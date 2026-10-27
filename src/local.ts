// Local prototype; native Node type stripping is not a static typecheck.
import { DatabaseSync } from 'node:sqlite';
import { randomUUID, createHash } from 'node:crypto';
import { existsSync, mkdirSync, lstatSync, realpathSync, openSync, closeSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

type ObjectData = Record<string, any>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const states: ObjectData = {pending:['in_progress','blocked','cancelled'],in_progress:['blocked','completed','cancelled'],blocked:['in_progress','cancelled'],completed:['in_progress'],cancelled:['in_progress']};
export const fail = (message: string): never => {throw Error(message);};
export function shape(value: ObjectData, required: string[], optional: string[] = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      required.some(k=>!Object.hasOwn(value,k)) || Object.keys(value).some(k=>![...required,...optional].includes(k))) fail('invalid fields');
}
function text(value: unknown) {if(typeof value!=='string' || !value.trim() || value.length>8000)fail('invalid text');}
function id(value: unknown) {if(typeof value!=='string' || !uuid.test(value))fail('UUID v4 required');}
function list(value: unknown) {if(!Array.isArray(value)||value.length>30)fail('bounded list required'); for(const v of value)text(v);}
function policy(value: ObjectData) {
  shape(value,['max_bytes','retention_days']);
  if(!Number.isSafeInteger(value.max_bytes)||value.max_bytes<4096||value.max_bytes>16*1024*1024||
     !Number.isSafeInteger(value.retention_days)||value.retention_days<1||value.retention_days>3650)fail('invalid quota/retention policy');
}
export function canonical(value: any): string {
  if(value===null || typeof value==='string' || typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number' && Number.isFinite(value))return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value && Object.getPrototypeOf(value)===Object.prototype)return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  return fail('JSON data required');
}
const digest = (value: any) => createHash('sha256').update(canonical(value)).digest('hex');
const now = () => new Date().toISOString();
function rejectTrackedStore(root: string) {
  const filenames=['local.sqlite','local.sqlite-wal','local.sqlite-shm','local.sqlite-journal'].map(name=>`:(icase,literal).agentcarry/${name}`);
  const result=spawnSync('git',['-C',root,'-c','core.fsmonitor=false','ls-files','-z','--',...filenames],
    {encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:3000,maxBuffer:1024*1024});
  if(result.status===0){if(result.stdout.length)fail('store path is tracked by Git; remove it from the index before initializing');return;}
  // Non-Git workspaces remain usable; a nearby Git marker means we cannot safely verify.
  for(let p=root;;p=dirname(p)){
    if(existsSync(join(p,'.git')))fail('cannot verify Git tracking; initialization stopped');
    if(dirname(p)===p)break;
  }
}
function paths(root: string) {
  const canonicalRoot=realpathSync(root), directory=join(canonicalRoot,'.agentcarry'), path=join(directory,'local.sqlite');
  if(existsSync(directory) && (lstatSync(directory).isSymbolicLink()||!lstatSync(directory).isDirectory()))fail('unsafe store directory');
  if(existsSync(path) && (lstatSync(path).isSymbolicLink()||!lstatSync(path).isFile()||lstatSync(path).nlink!==1))fail('unsafe store file');
  for(const suffix of ['-wal','-shm','-journal']) {
    let stat;try{stat=lstatSync(path+suffix);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')continue;throw error;}
    if(stat.isSymbolicLink()||!stat.isFile()||stat.nlink!==1)fail('unsafe store sidecar');
  }
  return {root:canonicalRoot,directory,path};
}

export function initialize(root: string, settings: ObjectData) {
  policy(settings);const p=paths(root);
  mkdirSync(p.directory,{recursive:true,mode:0o700});
  // Never overwrite local handoffs or project instruction files.
  const ignore=join(p.directory,'.gitignore');
  if(existsSync(ignore)) {
    // Existing ignore policy must not silently authorize storing private records.
    fail('store directory already has .gitignore; inspect it before initializing');
  }
  if(existsSync(p.path))fail('already initialized; use status');
  if(['-wal','-shm','-journal'].some(s=>existsSync(p.path+s)))fail('existing database sidecars require inspection');
  rejectTrackedStore(p.root);
  writeFileSync(ignore,'*\n',{flag:'wx',mode:0o600});
  const fd=openSync(p.path,'wx',0o600);closeSync(fd);
  const db=new DatabaseSync(p.path);
  try {
    db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON;
      BEGIN IMMEDIATE;
      CREATE TABLE meta(id INTEGER PRIMARY KEY CHECK(id=1),body TEXT NOT NULL) STRICT;
      CREATE TABLE tasks(id TEXT PRIMARY KEY,body TEXT NOT NULL,last_activity TEXT NOT NULL) STRICT;
      CREATE TABLE checkpoints(id TEXT PRIMARY KEY,task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,body TEXT NOT NULL) STRICT;
      CREATE TABLE receipts(token TEXT PRIMARY KEY,hash TEXT NOT NULL,kind TEXT NOT NULL,id TEXT NOT NULL,result TEXT) STRICT;
      PRAGMA user_version=1;`);
    const metadata={schema_version:1,project_id:randomUUID(),workspace_id:randomUUID(),root:p.root,created_at:now(),policy:settings};
    db.prepare('INSERT INTO meta VALUES(1,?)').run(JSON.stringify(metadata));db.exec('COMMIT');return metadata;
  }catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}finally{db.close();}
}

export class LocalStore {
  db: DatabaseSync;
  metadata: ObjectData;
  constructor(root: string) {
    const p=paths(root);if(!existsSync(p.path))fail('not initialized; run init --new');
    // Inspect schema and binding without mutation before enabling the writer connection.
    let db=new DatabaseSync(p.path,{readOnly:true});
    try {
      if(db.prepare('PRAGMA user_version').get()!.user_version!==1)fail('unsupported schema; no migration performed');
      this.metadata=JSON.parse(db.prepare('SELECT body FROM meta WHERE id=1').get()!.body as string);
      if(this.metadata.root!==p.root)fail('workspace moved/copied; explicit reattachment is not implemented');
      policy(this.metadata.policy);
    }finally{db.close();}
    this.db=new DatabaseSync(p.path);
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL;');
  }
  close(){this.db.close();}
  private transaction(action: ()=>any) {
    this.db.exec('BEGIN IMMEDIATE');
    try{const result=action();this.db.exec('COMMIT');return result;}
    catch(error){if(this.db.isTransaction)this.db.exec('ROLLBACK');throw error;}
  }
  private record(kind: string, recordId: string): ObjectData | null {
    const table=kind==='task'?'tasks':'checkpoints';
    const row=this.db.prepare(`SELECT body FROM ${table} WHERE id=?`).get(recordId);
    return row?JSON.parse(row.body as string):null;
  }
  private usage() {
    return Number(this.db.prepare(`SELECT
      COALESCE((SELECT sum(length(CAST(body AS BLOB))) FROM tasks),0)+
      COALESCE((SELECT sum(length(CAST(body AS BLOB))) FROM checkpoints),0)+
      COALESCE((SELECT sum(length(token)+length(hash)+length(kind)+length(id)+COALESCE(length(CAST(result AS BLOB)),0)) FROM receipts),0) AS bytes`).get()!.bytes);
  }
  private write(token: string, request: ObjectData, kind: string, action: ()=>ObjectData, stage: ()=>void) {
    id(token);const hash=digest(request);
    return this.transaction(()=>{
      this.metadata=JSON.parse(this.db.prepare('SELECT body FROM meta WHERE id=1').get()!.body as string);
      const receipt=this.db.prepare('SELECT * FROM receipts WHERE token=?').get(token);
      if(receipt){if(receipt.hash!==hash)fail('idempotency token reused with different request');return receipt.result?JSON.parse(receipt.result as string):{deleted:true,id:receipt.id};}
      const record=action();
      this.db.prepare('INSERT INTO receipts VALUES(?,?,?,?,?)').run(token,hash,kind,record.id,JSON.stringify(record));
      if(this.usage()>this.metadata.policy.max_bytes)fail('logical quota exceeded; delete records or raise policy explicitly');
      stage();return record;
    });
  }
  private envelope(recordId: string) {return {schema_version:1,id:recordId,project_id:this.metadata.project_id,workspace_id:this.metadata.workspace_id,created_at:now(),author:{client:'agentcarry-cli',version:'prototype'}};}
  status(){this.metadata=JSON.parse(this.db.prepare('SELECT body FROM meta WHERE id=1').get()!.body as string);
    return {...this.metadata,capture:'manual',tasks:this.db.prepare('SELECT count(*) n FROM tasks').get()!.n,
    checkpoints:this.db.prepare('SELECT count(*) n FROM checkpoints').get()!.n,logical_bytes:this.usage(),quota_warning:this.usage()>=this.metadata.policy.max_bytes*0.8};}
  task(input: ObjectData, stage = ()=>{}) {
    shape(input,['token','goal','acceptance_criteria']);text(input.goal);list(input.acceptance_criteria);
    if(!input.acceptance_criteria.length)fail('acceptance criteria required');
    return this.write(input.token,input,'task',()=>{
      const record={...this.envelope(randomUUID()),goal:input.goal,acceptance_criteria:input.acceptance_criteria,state:'pending',revision:0,blockers:[]};
      this.db.prepare('INSERT INTO tasks VALUES(?,?,?)').run(record.id,JSON.stringify(record),now());return record;
    },stage);
  }
  update(input: ObjectData, stage = ()=>{}) {
    shape(input,['token','task_id','expected_revision','state','blockers'],['reopen_reason']);id(input.task_id);list(input.blockers);
    if(!Number.isSafeInteger(input.expected_revision)||input.expected_revision<0||!Object.hasOwn(states,input.state))fail('invalid task update');
    if(Object.hasOwn(input,'reopen_reason'))text(input.reopen_reason);
    return this.write(input.token,input,'task',()=>{
      const old=this.record('task',input.task_id);if(!old)fail('task not found');
      if(old!.revision!==input.expected_revision)fail('revision conflict');
      if(!states[old!.state].includes(input.state))fail('invalid transition');
      if(['completed','cancelled'].includes(old!.state)){text(input.reopen_reason);}
      const record={...old,state:input.state,blockers:input.blockers,revision:old!.revision+1,updated_at:now(),reopen_reason:input.reopen_reason??null};
      this.db.prepare('UPDATE tasks SET body=?,last_activity=? WHERE id=?').run(JSON.stringify(record),now(),input.task_id);return record;
    },stage);
  }
  checkpoint(input: ObjectData, code: ObjectData, stage = ()=>{}) {
    shape(code,['branch','commit','dirty_state','reason']);
    if(!['clean','dirty','unknown'].includes(code.dirty_state)||
      (code.branch!==null&&typeof code.branch!=='string')||(code.commit!==null&&typeof code.commit!=='string')||
      (code.reason!==null&&typeof code.reason!=='string'))fail('invalid code observation');
    shape(input,['token','task_id','parent_checkpoint_ids','client','client_version','decisions','failed_attempts','unresolved','next_steps','checks']);
    id(input.task_id);text(input.client);text(input.client_version);
    for(const key of ['parent_checkpoint_ids','decisions','failed_attempts','unresolved','next_steps'])list(input[key]);
    if(new Set(input.parent_checkpoint_ids).size!==input.parent_checkpoint_ids.length)fail('duplicate parents');
    for(const parent of input.parent_checkpoint_ids)id(parent);
    if(!Array.isArray(input.checks)||input.checks.length>30)fail('invalid checks');
    for(const check of input.checks){shape(check,['command','outcome','origin','review']);text(check.command);
      if(check.origin!=='agent_reported'||check.review!=='unreviewed'||!['passed','failed','not_run','inconclusive'].includes(check.outcome))fail('invalid reported check');}
    return this.write(input.token,input,'checkpoint',()=>{
      const task=this.record('task',input.task_id);if(!task)fail('task not found');
      for(const parentId of input.parent_checkpoint_ids){const parent=this.record('checkpoint',parentId);if(!parent||parent.task_id!==input.task_id)fail('parent outside task scope');}
      const {token,...body}=input;
      const record={...this.envelope(randomUUID()),...body,session_id:randomUUID(),captured_at:now(),author:{client:input.client,version:input.client_version},task_refs:[input.task_id],task_revision:task!.revision,code_state:code};
      this.db.prepare('INSERT INTO checkpoints VALUES(?,?,?)').run(record.id,input.task_id,JSON.stringify(record));
      this.db.prepare('UPDATE tasks SET last_activity=? WHERE id=?').run(now(),input.task_id);return record;
    },stage);
  }
  resume(taskId: string, current: ObjectData, checkpointId?: string, offset=0) {
    return this.transaction(()=>{
    if(!Number.isSafeInteger(offset)||offset<0 || (checkpointId!==undefined && offset!==0))fail('invalid conflict offset');
    id(taskId);const task=this.record('task',taskId);if(!task)fail('task not found');
    const all=this.db.prepare('SELECT body FROM checkpoints WHERE task_id=? ORDER BY id').all(taskId).map(r=>JSON.parse(r.body as string));
    const parents=new Set(all.flatMap(c=>c.parent_checkpoint_ids));
    const tips=all.filter(c=>!parents.has(c.id));
    let selected;
    if(checkpointId!==undefined){id(checkpointId);selected=all.find(c=>c.id===checkpointId);if(!selected)fail('checkpoint outside task scope');}
    else if(tips.length>1)return {status:'conflict',task,
      tips:tips.slice(offset,offset+20).map(c=>({id:c.id,captured_at:c.captured_at,client:c.client.slice(0,120),
        task_revision:c.task_revision,next_steps:c.next_steps.slice(0,3).map((step:string)=>step.slice(0,240))})),
      total_tips:tips.length,next_offset:offset+20<tips.length?offset+20:null,trust:'untrusted_project_context'};
    else selected=tips[0];
    if(!selected)return {status:'empty',task};
    const saved=selected.code_state;
    let git_freshness='unknown';
    if(!saved.commit||!current.commit||saved.dirty_state==='unknown'||current.dirty_state==='unknown')git_freshness='unknown';
    else if(saved.branch!==current.branch||saved.commit!==current.commit||saved.dirty_state!==current.dirty_state)git_freshness='changed';
    else if(saved.dirty_state==='clean'&&current.dirty_state==='clean')git_freshness='matching';
    // Git cannot observe ignored files. Without relevant fingerprints, only a detected
    // change is definitive for the project; a clean Git state is not a full match.
    const freshness=git_freshness==='changed'?'changed':'unknown';
    return {status:'ok',task,checkpoint:selected,freshness,git_freshness,task_changed:task!.revision!==selected.task_revision,trust:'untrusted_project_context'};
    });
  }
  export(){return this.transaction(()=>({metadata:JSON.parse(this.db.prepare('SELECT body FROM meta WHERE id=1').get()!.body as string),tasks:this.db.prepare('SELECT body FROM tasks ORDER BY id').all().map(r=>JSON.parse(r.body as string)),
    checkpoints:this.db.prepare('SELECT body FROM checkpoints ORDER BY id').all().map(r=>JSON.parse(r.body as string)),limits:'external exports/backups are not deleted automatically'}));}
  deleteTask(taskId: string){id(taskId);return this.transaction(()=>{
    const checkpoints=this.db.prepare('SELECT id FROM checkpoints WHERE task_id=?').all(taskId).map(r=>r.id);
    const removed=this.db.prepare('DELETE FROM tasks WHERE id=?').run(taskId).changes;
    this.db.prepare('UPDATE receipts SET result=NULL WHERE id=?').run(taskId);
    for(const checkpoint of checkpoints)this.db.prepare('UPDATE receipts SET result=NULL WHERE id=?').run(checkpoint);
    // Retain only receipt IDs/hashes to prevent deleted requests recreating content.
    return {removed,deleted_checkpoint_ids:checkpoints,external_backups:'not deleted',physical_erasure:false};
  });}
  configure(settings: ObjectData){policy(settings);return this.transaction(()=>{
    if(settings.max_bytes<this.usage())fail('quota below existing logical usage');
    const metadata={...this.metadata,policy:settings};this.db.prepare('UPDATE meta SET body=? WHERE id=1').run(JSON.stringify(metadata));
    this.metadata=metadata;return metadata;
  });}
  prune(){return this.transaction(()=>{
    this.metadata=JSON.parse(this.db.prepare('SELECT body FROM meta WHERE id=1').get()!.body as string);
    const cutoff=new Date(Date.now()-this.metadata.policy.retention_days*86400000).toISOString();
    const expired=this.db.prepare('SELECT id FROM tasks WHERE last_activity<?').all(cutoff).map(r=>r.id);
      for(const task of expired){
        const children=this.db.prepare('SELECT id FROM checkpoints WHERE task_id=?').all(task);
        this.db.prepare('UPDATE receipts SET result=NULL WHERE id=?').run(task);
        for(const child of children)this.db.prepare('UPDATE receipts SET result=NULL WHERE id=?').run(child.id);
      }
      this.db.prepare('DELETE FROM tasks WHERE last_activity<?').run(cutoff);return {deleted_task_ids:expired,cutoff,physical_erasure:false};});}
}
