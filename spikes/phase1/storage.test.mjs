import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { sqliteRead, sqliteWrite, journalRead, journalWrite } from './storage.mjs';

function dir(t) { const p = mkdtempSync(join(tmpdir(), 'agentcarry-spike-')); t.after(() => rmSync(p, { recursive: true, force: true })); return p; }
function worker(args) {
  const child = fork(fileURLToPath(new URL('./worker.mjs', import.meta.url)), args, { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  const messages = []; let errorText = ''; child.stderr.on('data', d => { errorText += d; });
  const exit = new Promise((resolve, reject) => {
    child.on('error', reject); child.on('exit', (code, signal) => resolve({ code, signal, messages, errorText }));
  });
  const stage = new Promise((resolve, reject) => {
    child.on('message', m => { messages.push(m); if (m.stage) resolve(m.stage); });
    child.on('exit', () => reject(Error('exited before pause: ' + errorText)));
  });
  stage.catch(() => {});
  return { child, exit, stage };
}
for (const [name, read, write] of [['sqlite', sqliteRead, sqliteWrite], ['journal', journalRead, journalWrite]]) {
  test(name + ': whole bundle, idempotency, token misuse and stale revision', t => {
    const root = dir(t); write(root, 0, 'a', { text: 'initial' });
    assert.equal(read(root).revision, 1);
    assert.equal(read(root).evidence.task_id, read(root).task.id);
    assert.equal(write(root, 0, 'a', { text: 'initial' }), null);
    assert.throws(() => write(root, 1, 'a', { text: 'changed' }), /token reuse/);
    assert.throws(() => write(root, 0, 'b', { text: 'stale' }), /revision conflict/);
    assert.equal(read(root).revision, 1);
  });
  test(name + ': two processes cannot both commit expected revision zero', { timeout: 15000 }, async t => {
    const root = dir(t); read(root);
    const workers = [worker([name, root, '0', 'a']), worker([name, root, '0', 'b'])];
    const results = await Promise.all(workers.map(w => w.exit));
    assert.equal(results.filter(r => r.code === 0).length, 1, JSON.stringify(results));
    assert.equal(results.filter(r => r.code === 2).length, 1, JSON.stringify(results));
    assert.equal(read(root).revision, 1);
  });
}
for (const pause of ['before_commit', 'after_commit']) {
  test('sqlite: killed writer at ' + pause + ' recovers complete bundle and allows next writer', { timeout: 15000 }, async t => {
    const root = dir(t); sqliteWrite(root, 0, 'initial', { text: 'before' });
    const w = worker(['sqlite', root, '1', 'crash', pause, 'after']);
    t.after(() => { if (w.child.exitCode === null) w.child.kill('SIGKILL'); });
    assert.equal(await w.stage, pause); w.child.kill('SIGKILL'); await w.exit;
    const state = sqliteRead(root); const expected = pause === 'before_commit' ? 1 : 2;
    assert.equal(state.revision, expected); assert.equal(state.checkpoint.revision, expected);
    sqliteWrite(root, expected, 'resume', { text: 'resume' });
    assert.equal(sqliteRead(root).revision, expected + 1);
  });
}
test('journal: killed partial append preserves prior read but leaves recovery-required lock', { timeout: 15000 }, async t => {
  const root = dir(t); journalWrite(root, 0, 'initial', { text: 'before' });
  const w = worker(['journal', root, '1', 'crash', 'partial_append']);
  t.after(() => { if (w.child.exitCode === null) w.child.kill('SIGKILL'); });
  await w.stage; w.child.kill('SIGKILL'); await w.exit;
  assert.equal(journalRead(root).revision, 1); assert.equal(existsSync(join(root, 'writer.lock')), true);
  assert.throws(() => journalWrite(root, 1, 'resume', { text: 'resume' }), /EEXIST/);
});
test('sqlite FTS5: search index can be rebuilt without losing authoritative rows', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec("CREATE TABLE docs(id INTEGER PRIMARY KEY, body TEXT); INSERT INTO docs VALUES(1,'checkpoint handoff'),(2,'database migration'); CREATE VIRTUAL TABLE idx USING fts5(body);");
    const rebuild = () => db.exec('DELETE FROM idx; INSERT INTO idx(rowid,body) SELECT id,body FROM docs');
    rebuild(); assert.equal(db.prepare("SELECT rowid FROM idx WHERE idx MATCH 'handoff'").get().rowid, 1);
    db.exec('DELETE FROM idx'); assert.equal(db.prepare('SELECT count(*) AS n FROM docs').get().n, 2);
    rebuild(); assert.equal(db.prepare("SELECT rowid FROM idx WHERE idx MATCH 'migration'").get().rowid, 2);
  } finally { db.close(); }
});
test('sqlite: failure before commit rolls back bundle and retry succeeds', t => {
  const root = dir(t); sqliteWrite(root, 0, 'initial', { text: 'before' });
  assert.throws(() => sqliteWrite(root, 1, 'retry', { text: 'after' }, () => { throw Error('injected failure'); }), /injected failure/);
  assert.equal(sqliteRead(root).revision, 1);
  sqliteWrite(root, 1, 'retry', { text: 'after' }); assert.equal(sqliteRead(root).revision, 2);
});
test('journal: killed writer after fsync leaves committed bundle but blocks further writes', { timeout: 15000 }, async t => {
  const root = dir(t); journalWrite(root, 0, 'initial', { text: 'before' });
  const w = worker(['journal', root, '1', 'crash', 'after_commit']);
  t.after(() => { if (w.child.exitCode === null) w.child.kill('SIGKILL'); });
  await w.stage; w.child.kill('SIGKILL'); await w.exit;
  assert.equal(journalRead(root).revision, 2);
  assert.throws(() => journalWrite(root, 2, 'resume', { text: 'resume' }), /EEXIST/);
});
