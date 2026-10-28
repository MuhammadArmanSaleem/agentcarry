import { closeSync,existsSync,fsyncSync,lstatSync,mkdirSync,openSync,readFileSync,readdirSync,renameSync,unlinkSync,writeFileSync,realpathSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { createHash,randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { LocalStore,canonical,fail,shape } from './local.ts';
import { inspectSetup } from './setup.ts';

type Config=Record<string,unknown>;
type Journal={schema_version:1,id:string,root:string,project_id:string,client:string,request_hash:string,phase:'active'|'rollback_requested'|'rolled_back'|'forgotten',before:string|null,before_hash:string,after_hash:string,entry:Config};
const sha=(data:string|Buffer)=>createHash('sha256').update(data).digest('hex');
const object=(v:unknown):v is Config=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function token(value:unknown):string {if(typeof value!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))return fail('UUID v4 token required');return value;}
function stat(path:string){try{return lstatSync(path);}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}}
function safeFile(path:string,max=524288){const s=stat(path);if(!s||!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.size>max)return fail('unsafe or oversized setup file');return s;}
function parse(text:string):Config {let v:unknown;try{v=JSON.parse(text);}catch{return fail('invalid setup JSON; contents withheld');}if(!object(v))return fail('setup JSON object required');return v;}
function context(workspace:string,create=false){
 const root=realpathSync(workspace),store=new LocalStore(root);let project_id:string;
 try{project_id=token(store.metadata.project_id);}finally{store.close();}
 const ignore=join(root,'.agentcarry','.gitignore');safeFile(ignore,4096);
 if(readFileSync(ignore,'utf8').trim()!=='*')return fail('private setup history requires the existing wildcard ignore policy');
 const git=spawnSync('git',['-C',root,'-c','core.fsmonitor=false','ls-files','-z','--',':(icase,glob).agentcarry/setup-history/**'],{encoding:'utf8',timeout:3000,maxBuffer:1048576});
 if(git.status===0){if(git.stdout)return fail('setup history path is tracked by Git');}
 else {for(let p=root;;p=dirname(p)){if(existsSync(join(p,'.git')))return fail('cannot verify setup history Git tracking');if(dirname(p)===p)break;}}
 const directory=join(root,'.agentcarry','setup-history');const s=stat(directory);
 if(s&&(s.isSymbolicLink()||!s.isDirectory()))return fail('unsafe setup history directory');
 if(!s&&create){try{mkdirSync(directory,{mode:0o700});}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;}const made=lstatSync(directory);if(made.isSymbolicLink()||!made.isDirectory())return fail('unsafe setup history directory');}
 return {root,project_id,directory};
}
type Context=ReturnType<typeof context>;
function pathFor(c:Context,id:string){return join(c.directory,token(id)+'.json');}
function atomic(c:Context,path:string,data:Buffer|string,id:string,verify=()=>{}){
 const temp=join(c.directory,'tmp-'+token(id)+'-'+randomUUID()),fd=openSync(temp,'wx',0o600);
 try{writeFileSync(fd,data);fsyncSync(fd);}finally{closeSync(fd);}
 try{verify();renameSync(temp,path);}finally{if(stat(temp))unlinkSync(temp);}
}
function withLock<T>(c:Context,id:string,action:()=>T):T {
 const path=join(c.directory,'lock');let fd:number;
 try{fd=openSync(path,'wx',0o600);}catch{return fail('setup lock present or unavailable; inspect before retrying');}
 try{writeFileSync(fd,JSON.stringify({token:id,pid:process.pid}));fsyncSync(fd);return action();}
 finally{closeSync(fd);unlinkSync(path);}
}
function owned(config:Config,keys:string[]):unknown {let v:unknown=config;for(const key of keys){if(!object(v)||!Object.hasOwn(v,key))return undefined;v=v[key];}return v;}
function merged(config:Config,keys:string[],entry:Config){
 const copy=parse(JSON.stringify(config));let p=copy;
 for(const key of keys.slice(0,-1)){if(!Object.hasOwn(p,key))p[key]={};const next=p[key];if(!object(next))return fail('config object required');p=next;}
 p[keys[keys.length-1]]=entry;return Buffer.from(JSON.stringify(copy,null,2)+'\n');
}
function prior(r:Journal){return r.before===null?{}:parse(Buffer.from(r.before,'base64').toString('utf8'));}
function readJournal(c:Context,id:string):Journal {
 const path=pathFor(c,id);safeFile(path);const v=parse(readFileSync(path,'utf8'));
 shape(v,['schema_version','id','root','project_id','client','request_hash','phase','before','before_hash','after_hash','entry']);
 if(v.schema_version!==1||v.id!==id||v.root!==c.root||v.project_id!==c.project_id||typeof v.client!=='string'||!['gemini','opencode'].includes(v.client)||typeof v.phase!=='string'||!['active','rollback_requested','rolled_back','forgotten'].includes(v.phase)||!object(v.entry)||typeof v.request_hash!=='string'||!/^[a-f0-9]{64}$/.test(v.request_hash)||typeof v.after_hash!=='string'||!/^[a-f0-9]{64}$/.test(v.after_hash))return fail('invalid or foreign setup history');
 const r=v as unknown as Journal;
 if(typeof r.before_hash!=='string'||! /^(missing|[a-f0-9]{64})$/.test(r.before_hash))return fail('invalid backup revision');
 if(r.phase==='forgotten'&&(r.before!==null||Object.keys(r.entry).length))return fail('invalid setup tombstone');
 if(r.phase!=='forgotten'){
  if(r.before!==null&&(typeof r.before!=='string'||Buffer.from(r.before,'base64').toString('base64')!==r.before||Buffer.from(r.before,'base64').length>65536))return fail('invalid setup backup');
  if((r.before===null?'missing':sha(Buffer.from(r.before,'base64')))!==r.before_hash)return fail('setup backup integrity mismatch');
  const keys=r.client==='gemini'?['mcpServers','agentcarry-preview']:['mcp','servers','agentcarry-preview'];
  if(sha(merged(prior(r),keys,r.entry))!==r.after_hash)return fail('setup result integrity mismatch');
 }
 return r;
}
function save(c:Context,r:Journal){atomic(c,pathFor(c,r.id),JSON.stringify(r),r.id);}
function historyBytes(c:Context){return readdirSync(c.directory).filter(n=>n!=='lock').reduce((n,name)=>n+safeFile(join(c.directory,name),16777216).size,0);}
function unchanged(c:Context,client:string,revision:string){if(inspectSetup(c.root,client).revision!==revision)return fail('configuration changed; no overwrite performed');}
function report(r:Journal,status:string){return {status,operation_id:r.id,client:r.client,backup_contains_config:r.phase!=='forgotten',physical_erasure:false};}

// No config paths or executable commands are accepted from callers.
export function applySetup(workspace:string,request:Config,stage:(name:string)=>void=()=>{}) {
 shape(request,['token','client','expected_revision','expected_plan','max_backup_bytes']);const id=token(request.token);
 if(typeof request.expected_plan!=='string'||! /^[a-f0-9]{64}$/.test(request.expected_plan)||typeof request.client!=='string'||typeof request.expected_revision!=='string'||! /^(missing|[a-f0-9]{64})$/.test(request.expected_revision)||!Number.isSafeInteger(request.max_backup_bytes)||Number(request.max_backup_bytes)<4096||Number(request.max_backup_bytes)>16777216)return fail('invalid setup apply request');
 const c=context(workspace,true),request_hash=sha(canonical(request));
 return withLock(c,id,()=>{
  const s=inspectSetup(c.root,String(request.client));let r:Journal;
  if(stat(pathFor(c,id))){
   r=readJournal(c,id);if(r.request_hash!==request_hash)return fail('setup token reused with different request');
   if(r.phase!=='active')return fail('setup operation was rolled back or retired; use a new token');
   if(s.revision===r.after_hash)return report(r,'already_applied');
   if(s.revision!==r.before_hash)return fail('configuration changed since the saved operation; inspect before retry');
   if(canonical(s.entry)!==canonical(r.entry))return fail('setup executable or checkout changed; inspect before retry');
  }else{
   if(s.plan_revision!==request.expected_plan)return fail('setup plan changed; generate a new preview');
   if(s.revision!==request.expected_revision)return fail('stale setup preview; generate a new preview');
   if(s.status==='conflict')return fail('existing AgentCarry entry conflicts; no overwrite performed');
   if(s.status==='already_configured')return {status:'already_configured',operation_id:null,changes_applied:false};
   for(const name of readdirSync(c.directory).filter(n=>n.endsWith('.json'))){const old=readJournal(c,name.slice(0,-5));if(old.client===s.client&&['active','rollback_requested'].includes(old.phase))return fail('client has an unresolved setup operation: '+old.id);}
   const after=merged(s.existing,s.keys,s.entry);
   if(after.length>65536)return fail('resulting client config exceeds 64 KiB');
   r={schema_version:1,id,root:c.root,project_id:c.project_id,client:s.client,request_hash,phase:'active',before:s.raw?.toString('base64')??null,before_hash:s.revision,after_hash:sha(after),entry:s.entry};
   if(historyBytes(c)+Buffer.byteLength(JSON.stringify(r))+1024>Number(request.max_backup_bytes))return fail('setup backup budget exceeded; no config changed');
   save(c,r);
  }
  stage('backup_saved');
  const after=merged(prior(r),s.keys,r.entry);
  if(r.client==='gemini'&&!stat(dirname(s.path)))mkdirSync(dirname(s.path),{mode:0o700});
  atomic(c,s.path,after,r.id,()=>unchanged(c,r.client,r.before_hash));stage('config_written');
  return report(r,'applied');
 });
}
export function setupStatus(workspace:string,id:string){const c=context(workspace),r=readJournal(c,token(id));if(r.phase==='forgotten'){const pending=readdirSync(c.directory).some(n=>n.startsWith('tmp-'+r.id+'-'));return {...report(r,'forgotten'),backup_contains_config:pending,cleanup_pending:pending};}const s=inspectSetup(c.root,r.client);const observed=s.revision===r.after_hash?'applied':s.revision===r.before_hash?'original':'changed';return {...report(r,r.phase),observed_config:observed};}
// Bounded, metadata-only selection for the interactive setup UI. Never return backups.
export function listSetupOperations(workspace:string){
 const c=context(workspace);if(!stat(c.directory))return [];
 const names=readdirSync(c.directory).filter(n=>n.endsWith('.json')).sort();
 if(names.length>100)return fail('more than 100 setup operations; use setup-status with an explicit operation token');
 return names.map(name=>{const r=readJournal(c,name.slice(0,-5));return {id:r.id,client:r.client,phase:r.phase};});
}
export function rollbackSetup(workspace:string,id:string,stage:(name:string)=>void=()=>{}){
 const c=context(workspace);token(id);
 return withLock(c,id,()=>{
  const r=readJournal(c,id);if(r.phase==='forgotten')return fail('setup backup was forgotten');if(r.phase==='rolled_back')return report(r,'already_rolled_back');
  const s=inspectSetup(c.root,r.client),value=owned(s.existing,s.keys);
  if(value!==undefined&&canonical(value)!==canonical(r.entry))return fail('owned setup entry changed; rollback refused');
  r.phase='rollback_requested';save(c,r);stage('rollback_prepared');
  if(value!==undefined){
   let data:Buffer|null;
   if(s.revision===r.after_hash)data=r.before===null?null:Buffer.from(r.before,'base64');
   else{
    const copy=parse(JSON.stringify(s.existing)),before=prior(r);let parent=copy;
    for(const key of s.keys.slice(0,-1))parent=parent[key] as Config;
    delete parent[s.keys[s.keys.length-1]];
    for(let i=s.keys.length-2;i>=0;i--){const prefix=s.keys.slice(0,i+1),v=owned(copy,prefix);if(owned(before,prefix)===undefined&&object(v)&&!Object.keys(v).length){let p=copy;for(const key of prefix.slice(0,-1))p=p[key] as Config;delete p[prefix[prefix.length-1]];}}
    data=Buffer.from(JSON.stringify(copy,null,2)+'\n');
   }
   if(data===null){unchanged(c,r.client,s.revision);unlinkSync(s.path);}else atomic(c,s.path,data,r.id,()=>unchanged(c,r.client,s.revision));
  }
  stage('rollback_written');r.phase='rolled_back';save(c,r);return report(r,'rolled_back');
 });
}
function clearTemps(c:Context,id:string){for(const name of readdirSync(c.directory)){if(name.startsWith('tmp-'+id+'-')){const path=join(c.directory,name);safeFile(path);unlinkSync(path);}}}
export function forgetSetup(workspace:string,id:string){
 const c=context(workspace);token(id);
 return withLock(c,id,()=>{
  if(!stat(pathFor(c,id))){clearTemps(c,id);return {status:'orphan_temps_removed',operation_id:id,config_changed:false};}
  const r=readJournal(c,id);
  if(r.phase!=='forgotten'){
   if(r.phase!=='rolled_back')return fail('rollback before forgetting a setup backup');
   r.phase='forgotten';r.before=null;r.entry={};save(c,r);
  }
  clearTemps(c,id);return report(r,'forgotten');
 });
}
export function unlockSetup(workspace:string,id:string,confirm:unknown,stage:(name:string)=>void=()=>{}){
 if(confirm!==true)return fail('explicit abandoned-lock confirmation required');const c=context(workspace),path=join(c.directory,'lock');token(id);
 // Serialize recoverers, not just writers: a second recoverer must never unlink
 // a replacement lock acquired after the first recoverer removed the old one.
 const guard=join(c.directory,'recovery-lock');let fd:number;
 try{fd=openSync(guard,'wx',0o600);}catch{return fail('setup recovery lock present or unavailable; inspect before retrying');}
 try{
  writeFileSync(fd,JSON.stringify({token:id,pid:process.pid}));fsyncSync(fd);
  safeFile(path,4096);const lock=parse(readFileSync(path,'utf8'));
  if(lock.token!==id||!Number.isSafeInteger(lock.pid)||Number(lock.pid)<=0)return fail('lock identity mismatch');
  try{process.kill(Number(lock.pid),0);return fail('setup lock owner is still running');}catch(error){if((error as NodeJS.ErrnoException).code!=='ESRCH')throw error;}
  stage('abandoned_lock_verified');unlinkSync(path);return {status:'unlocked',operation_id:id,config_changed:false};
 }finally{closeSync(fd);unlinkSync(guard);}
}
