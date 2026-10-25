import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { open, initialize, migrate, seed, report, deleteEvidence } from './normalized.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(),'agentcarry-schema-'));
  const path = join(root,'test.sqlite'), db = open(path);
  t.after(() => { db.close(); rmSync(root,{recursive:true,force:true}); });
  initialize(db);
  return { db, root, path };
}
const version = db => db.prepare('PRAGMA user_version').get().user_version;
const count = (db, table) => db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n;
const evidence = outcome => ({id:randomUUID(),origin:'agent_reported',review:'unreviewed',outcome,body:'synthetic check'});

test('migration backs up v1, preserves rows, indexes existing drafts and is retry-safe', async t => {
  const {db,root} = fixture(t); seed(db);
  const path = join(root,'backup.sqlite');
  assert.equal((await migrate(db,path)).migrated,true);
  assert.equal(version(db),2); assert.equal(count(db,'draft_search'),1);
  const old = open(path);
  try { assert.equal(version(old),1); assert.equal(count(old,'drafts'),1); } finally { old.close(); }
  assert.equal((await migrate(db,join(root,'unused.sqlite'))).migrated,false);
  assert.equal(count(db,'draft_search'),1);
});
test('migration failure rolls schema and data back; a fresh retry succeeds', async t => {
  const {db,root} = fixture(t); seed(db);
  await assert.rejects(migrate(db,join(root,'before.sqlite'),() => { throw Error('injected'); }),/injected/);
  assert.equal(version(db),1); assert.equal(count(db,'drafts'),1);
  assert.equal(db.prepare("SELECT name FROM sqlite_schema WHERE name='draft_search'").get(),undefined);
  await migrate(db,join(root,'retry.sqlite')); assert.equal(version(db),2);
});
test('unsupported newer schema is rejected without changing database bytes', async t => {
  const {db,root,path} = fixture(t); db.exec('PRAGMA user_version=99');
  const before = readFileSync(path);
  await assert.rejects(migrate(db,join(root,'unused.sqlite')),/unsupported/);
  assert.deepEqual(readFileSync(path),before);
});
test('cross-project evidence references fail at the database boundary', t => {
  const {db} = fixture(t), a = seed(db), b = seed(db);
  assert.throws(() => db.prepare('INSERT INTO evidence VALUES(?,?,?,?,?,?,?)')
    .run(a.project,randomUUID(),b.task,'agent_reported','passed','unreviewed','bad scope'),/FOREIGN KEY/);
  assert.equal(count(db,'evidence'),2);
});
test('reported checks cannot elevate trust or hide not_run/failed; stale writes do not persist', t => {
  const {db} = fixture(t), a = seed(db);
  for (const invalid of [{...evidence('passed'),origin:'trusted_integration_observed'},
    {...evidence('passed'),review:'human_reviewed'}, {...evidence('passed'),verified:true}]) {
    assert.throws(() => report(db,a.project,a.task,0,invalid,'in_progress'),/invalid/);
  }
  report(db,a.project,a.task,0,evidence('not_run'),'in_progress');
  assert.throws(() => report(db,a.project,a.task,0,evidence('passed'),'completed'),/revision conflict/);
  report(db,a.project,a.task,1,evidence('failed'),'completed');
  assert.deepEqual(db.prepare('SELECT outcome FROM evidence WHERE project_id=? ORDER BY rowid').all(a.project).map(r=>r.outcome),['not_run','not_run','failed']);
  assert.equal(db.prepare('SELECT state FROM tasks WHERE id=?').get(a.task).state,'completed');
});
test('invalid transition and unreasoned reopening leave task and evidence unchanged', t => {
  const {db} = fixture(t), a = seed(db);
  assert.throws(() => report(db,a.project,a.task,0,evidence('passed'),'completed'),/transition/);
  report(db,a.project,a.task,0,evidence('not_run'),'in_progress');
  report(db,a.project,a.task,1,evidence('failed'),'completed');
  assert.throws(() => report(db,a.project,a.task,2,evidence('not_run'),'in_progress'),/transition/);
  assert.equal(count(db,'evidence'),3);
  report(db,a.project,a.task,2,evidence('not_run'),'in_progress','reproduce failure');
});
test('failed evidence insertion rolls back state revision', t => {
  const {db} = fixture(t), a = seed(db);
  assert.throws(() => report(db,a.project,a.task,0,{...evidence('passed'),id:a.evidence},'in_progress'),/UNIQUE/);
  assert.equal(db.prepare('SELECT revision FROM tasks WHERE id=?').get(a.task).revision,0);
});
test('deletion removes derived drafts and search content only in selected project', async t => {
  const {db,root} = fixture(t), a = seed(db,'canarysecret'), b = seed(db,'otherlesson');
  await migrate(db,join(root,'backup.sqlite'));
  const result = deleteEvidence(db,a.project,a.evidence);
  assert.deepEqual(result.deleted_draft_ids,[a.draft]);
  assert.equal(result.external_backups,'not deleted');
  assert.equal(db.prepare("SELECT count(*) n FROM draft_search WHERE draft_search MATCH 'canarysecret'").get().n,0);
  assert.equal(count(db,'drafts'),1); assert.equal(count(db,'evidence'),1);
  assert.equal(db.prepare('SELECT id FROM drafts').get().id,b.draft);
  assert.equal(deleteEvidence(db,b.project,a.evidence).removed,0);
});
test('deletion failure restores evidence, draft and search index together', async t => {
  const {db,root} = fixture(t), a = seed(db,'canarysecret');
  await migrate(db,join(root,'backup.sqlite'));
  assert.throws(() => deleteEvidence(db,a.project,a.evidence,() => {throw Error('injected');}),/injected/);
  assert.equal(count(db,'evidence'),1); assert.equal(count(db,'drafts'),1);
  assert.equal(db.prepare("SELECT count(*) n FROM draft_search WHERE draft_search MATCH 'canarysecret'").get().n,1);
});

function worker(t,args) {
  const child = fork(fileURLToPath(new URL('./normalized-worker.mjs',import.meta.url)),args,{stdio:['ignore','ignore','pipe','ipc']});
  let errors=''; child.stderr.on('data',d=>{errors+=d;});
  const exit = new Promise((resolve,reject)=> {child.on('error',reject); child.on('exit',code=>resolve(code));});
  const stage = new Promise((resolve,reject)=> {
    child.on('message',m=>{if(m.stage)resolve(m.stage);});
    child.on('exit',()=>reject(Error('exited before stage: '+errors)));
  });
  stage.catch(()=>{});
  t.after(()=>{if(child.exitCode===null)child.kill('SIGKILL');});
  return {child,exit,stage};
}
test('normalized revision race commits exactly one evidence/state transaction', {timeout:15000}, async t => {
  const {db,path}=fixture(t), a=seed(db);
  const args=[path,'report',a.project,a.task];
  const workers=[worker(t,args),worker(t,args)];
  const results=await Promise.all(workers.map(w=>w.exit));
  assert.deepEqual(results.sort(),[0,2]);
  assert.equal(count(db,'evidence'),2);
  assert.equal(db.prepare('SELECT revision FROM tasks WHERE id=?').get(a.task).revision,1);
});
test('terminated deletion restores evidence, derived draft and search; next deletion succeeds', {timeout:15000}, async t => {
  const {db,root,path}=fixture(t), a=seed(db,'canarysecret');
  await migrate(db,join(root,'backup.sqlite'));
  const w=worker(t,[path,'delete',a.project,a.task,a.evidence]);
  assert.equal(await w.stage,'before_commit'); w.child.kill('SIGKILL'); await w.exit;
  assert.equal(count(db,'evidence'),1); assert.equal(count(db,'drafts'),1);
  assert.equal(db.prepare("SELECT count(*) n FROM draft_search WHERE draft_search MATCH 'canarysecret'").get().n,1);
  assert.equal(deleteEvidence(db,a.project,a.evidence).removed,1);
  assert.equal(count(db,'draft_search'),0);
});
