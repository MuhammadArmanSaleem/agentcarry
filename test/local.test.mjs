import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,mkdirSync,writeFileSync,readFileSync,cpSync,symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync,fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { LocalStore,initialize } from '../src/local.ts';

const settings={max_bytes:1024*1024,retention_days:30};
const code={branch:'main',commit:'synthetic-commit',dirty_state:'clean',reason:null};
const taskInput=()=>({token:randomUUID(),goal:'Build a synthetic form',acceptance_criteria:['Keyboard navigation works']});
const cpInput=task_id=>({token:randomUUID(),task_id,parent_checkpoint_ids:[],client:'synthetic-agent',client_version:'test-1',decisions:['Use semantic form controls'],failed_attempts:['Mouse-only navigation failed'],unresolved:['Review layout'],next_steps:['Test keyboard submission'],checks:[{command:'synthetic test',outcome:'not_run',origin:'agent_reported',review:'unreviewed'}]});
const handles=new WeakMap();
function root(t){const p=mkdtempSync(join(tmpdir(),'agentcarry-local-'));t.after(()=>{
  for(const s of handles.get(t)??[])s.close();handles.set(t,[]);rmSync(p,{recursive:true,force:true});
});return p;}
function openStore(t,p){const s=new LocalStore(p);handles.set(t,[...(handles.get(t)??[]),s]);return s;}
function fixture(t,policy=settings){const p=root(t);initialize(p,policy);return {p,s:openStore(t,p)};}
const cli=fileURLToPath(new URL('../src/cli.ts',import.meta.url));
function run(p,command,input){return spawnSync(process.execPath,[cli,command],{cwd:p,input:input?JSON.stringify(input):undefined,encoding:'utf8'});}

test('fresh CLI processes create and recover a structured handoff without model credentials',t=>{
  const p=root(t);writeFileSync(join(p,'AGENTS.md'),'existing instructions');
  mkdirSync(join(p,'.agentcarry'));writeFileSync(join(p,'.agentcarry','manual-handoff.md'),'keep this handoff');
  initialize(p,settings);
  const task=JSON.parse(run(p,'task',taskInput()).stdout);
  const saved=JSON.parse(run(p,'checkpoint',cpInput(task.id)).stdout);
  const resumed=JSON.parse(run(p,'resume',{task_id:task.id}).stdout);
  assert.equal(resumed.checkpoint.id,saved.id);assert.equal(resumed.checkpoint.checks[0].outcome,'not_run');
  assert.equal(resumed.checkpoint.failed_attempts[0],'Mouse-only navigation failed');assert.equal(resumed.freshness,'unknown');
  assert.equal(readFileSync(join(p,'AGENTS.md'),'utf8'),'existing instructions');
  assert.equal(readFileSync(join(p,'.agentcarry','manual-handoff.md'),'utf8'),'keep this handoff');
  assert.equal(run(p,'doctor').status,0);
});
test('divergent tips conflict; explicit selection and reconciliation preserve lineage',t=>{
  const {s}=fixture(t), task=s.task(taskInput());
  const a=s.checkpoint(cpInput(task.id),code), b=s.checkpoint(cpInput(task.id),code);
  assert.equal(s.resume(task.id,code).status,'conflict');
  assert.equal(s.resume(task.id,code,a.id).checkpoint.id,a.id);
  const merged=s.checkpoint({...cpInput(task.id),parent_checkpoint_ids:[a.id,b.id]},code);
  assert.equal(s.resume(task.id,code).checkpoint.id,merged.id);
  assert.equal(s.resume(task.id,code).freshness,'matching');
  assert.equal(s.resume(task.id,{...code,branch:'other'}).freshness,'changed');
  assert.equal(s.resume(task.id,{...code,dirty_state:'dirty'}).freshness,'changed');
  assert.equal(s.resume(task.id,{branch:null,commit:null,dirty_state:'unknown',reason:'unavailable'}).freshness,'unknown');
});
test('dirty observations never establish matching and reported checks cannot elevate trust',t=>{
  const {s}=fixture(t), task=s.task(taskInput()), input=cpInput(task.id);
  assert.throws(()=>s.checkpoint({...input,checks:[{...input.checks[0],origin:'trusted_integration_observed'}]},code),/reported/);
  s.checkpoint(input,{...code,dirty_state:'dirty'});
  assert.equal(s.resume(task.id,{...code,dirty_state:'dirty'}).freshness,'unknown');
});
test('scope rejects copied stores, symlink escape and foreign task parents',t=>{
  const {s,p}=fixture(t), another=root(t);cpSync(join(p,'.agentcarry'),join(another,'.agentcarry'),{recursive:true});
  assert.throws(()=>new LocalStore(another),/moved\/copied/);
  const a=s.task(taskInput()), b=s.task(taskInput()), parent=s.checkpoint(cpInput(a.id),code);
  assert.throws(()=>s.checkpoint({...cpInput(b.id),parent_checkpoint_ids:[parent.id]},code),/scope/);
  const link=root(t);try{symlinkSync(join(p,'.agentcarry'),join(link,'.agentcarry'),'junction');}catch(e){if(e.code==='EPERM'){t.diagnostic('Symlink subcase unavailable: OS permission denied');return;}throw e;}
  assert.throws(()=>new LocalStore(link),/unsafe/);
});
test('task revision conflicts and retries preserve original acknowledgements',t=>{
  const {s}=fixture(t), input=taskInput(), original=s.task(input);
  const change={token:randomUUID(),task_id:original.id,expected_revision:0,state:'in_progress',blockers:[]};
  s.update(change);assert.deepEqual(s.task(input),original);
  assert.throws(()=>s.update({...change,token:randomUUID()}),/revision conflict/);
  assert.throws(()=>s.task({...input,goal:'different'}),/reused/);
  assert.equal(s.update(change).revision,1);
});
test('quota failure rolls back records and receipt; stale handles honor a newly lowered quota',t=>{
  const {s,p}=fixture(t), second=openStore(t,p);
  second.configure({max_bytes:4096,retention_days:30});const input={...taskInput(),goal:'a'.repeat(3000)};
  assert.throws(()=>s.task(input),/quota/);assert.equal(s.status().tasks,0);
  second.configure(settings);assert.ok(s.task(input).id);
});
test('deletion removes checkpoint and retry copies; replay cannot resurrect content',t=>{
  const {s}=fixture(t), input={...taskInput(),goal:'canarysecret'}, task=s.task(input), cp=cpInput(task.id);
  s.checkpoint({...cp,decisions:['canarysecret']},code);
  const report=s.deleteTask(task.id);assert.equal(report.deleted_checkpoint_ids.length,1);
  assert.ok(!JSON.stringify(s.export()).includes('canarysecret'));
  assert.equal(s.db.prepare("SELECT count(*) n FROM receipts WHERE result LIKE '%canarysecret%'").get().n,0);
  assert.equal(s.task(input).deleted,true);assert.equal(s.status().tasks,0);
});
test('explicit retention pruning removes old tasks and derived retry bodies',t=>{
  const {s}=fixture(t);s.task(taskInput());
  s.db.exec("UPDATE tasks SET last_activity='2000-01-01T00:00:00.000Z'");
  assert.equal(s.prune().deleted_task_ids.length,1);
  assert.equal(s.db.prepare('SELECT count(*) n FROM receipts WHERE result IS NOT NULL').get().n,0);
});
test('unsupported schema is rejected without mutation and failed init cannot overwrite a store',t=>{
  const {s,p}=fixture(t);s.db.exec('PRAGMA user_version=99');
  assert.throws(()=>new LocalStore(p),/unsupported/);assert.throws(()=>initialize(p,settings),/already/);
  assert.equal(s.db.prepare('PRAGMA user_version').get().user_version,99);
});
test('precommit failure rolls back the task and idempotency receipt together',t=>{
  const {s}=fixture(t),input=taskInput();
  assert.throws(()=>s.task(input,()=>{throw Error('injected');}),/injected/);
  assert.equal(s.status().tasks,0);assert.equal(s.db.prepare('SELECT count(*) n FROM receipts').get().n,0);
  assert.ok(s.task(input).id);
});
test('CLI observes unborn Git state, then clean and dirty code without inventing fingerprints',t=>{
  const p=root(t);const git=(...args)=>{const r=spawnSync('git',args,{cwd:p,encoding:'utf8'});assert.equal(r.status,0,r.stderr);};
  git('init');initialize(p,settings);
  const task=JSON.parse(run(p,'task',taskInput()).stdout);
  const first=JSON.parse(run(p,'checkpoint',cpInput(task.id)).stdout);
  assert.equal(first.code_state.reason,'unborn');
  writeFileSync(join(p,'sample.txt'),'synthetic code');git('add','sample.txt');
  git('-c','user.name=Synthetic Test','-c','user.email=synthetic@example.invalid','commit','-m','fixture');
  const saved=JSON.parse(run(p,'checkpoint',{...cpInput(task.id),parent_checkpoint_ids:[first.id]}).stdout);
  assert.equal(saved.code_state.dirty_state,'clean');
  assert.equal(JSON.parse(run(p,'resume',{task_id:task.id}).stdout).freshness,'matching');
  writeFileSync(join(p,'sample.txt'),'changed');
  assert.equal(JSON.parse(run(p,'resume',{task_id:task.id}).stdout).freshness,'changed');
});
function worker(t,args){
  const child=fork(fileURLToPath(new URL('./local-worker.mjs',import.meta.url)),args,{stdio:['ignore','ignore','pipe','ipc']});
  let errors='';child.stderr.on('data',b=>{errors+=b;});
  const exit=new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>resolve(code));});
  const stage=new Promise((resolve,reject)=>{child.on('message',m=>{if(m.stage)resolve(m.stage);});child.on('exit',()=>reject(Error(errors)));});stage.catch(()=>{});
  t.after(()=>{if(child.exitCode===null)child.kill('SIGKILL');});return {child,exit,stage};
}
test('two-process task revision race has one winner', {timeout:15000},async t=>{
  const {s,p}=fixture(t),task=s.task(taskInput());
  const workers=[worker(t,[p,'update',task.id]),worker(t,[p,'update',task.id])];
  assert.deepEqual((await Promise.all(workers.map(w=>w.exit))).sort(),[0,2]);
  assert.equal(s.export().tasks[0].revision,1);
});
test('process termination before commit recovers prior records and allows retry',{timeout:15000},async t=>{
  const {s,p}=fixture(t),task=s.task(taskInput()),w=worker(t,[p,'kill',task.id]);
  await w.stage;w.child.kill('SIGKILL');await w.exit;
  assert.equal(s.export().tasks[0].revision,0);
  s.update({token:randomUUID(),task_id:task.id,expected_revision:0,state:'in_progress',blockers:[]});
  assert.equal(s.export().tasks[0].revision,1);
});
