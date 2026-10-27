import { readSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { LocalStore, initialize, shape, fail } from './local.ts';
import { searchKnowledge } from './knowledge.ts';

function input() {
  const chunks: Buffer[]=[];let total=0;
  for(;;){const chunk=Buffer.alloc(4096);const n=readSync(0,chunk,0,chunk.length,null);if(!n)break;
    total+=n;if(total>65536)fail('JSON input exceeds 64 KiB');chunks.push(chunk.subarray(0,n));}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function observe(root: string) {
  const git=(...args: string[])=>execFileSync('git',['-C',root,'-c','core.fsmonitor=false',...args],{encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:3000,maxBuffer:1024*1024}).trim();
  try {
    git('rev-parse','--show-toplevel');
    let commit=null;try{commit=git('rev-parse','--verify','HEAD');}catch{}
    let branch=null;try{branch=git('symbolic-ref','--quiet','--short','HEAD');}catch{}
    return {branch,commit,dirty_state:git('status','--porcelain')?'dirty':'clean',reason:commit?null:'unborn'};
  }catch{return {branch:null,commit:null,dirty_state:'unknown',reason:'unavailable'};}
}
function run() {
  const [command,...args]=process.argv.slice(2), root=process.cwd();
  if(command==='help'||!command)return {prototype:true,commands:['search "query"','search-json','init --new --max-bytes N --retention-days N','status','doctor','token','task','update','checkpoint','resume','export','delete-task','configure','prune'],input:'JSON via stdin for search-json/task/update/checkpoint/resume/delete-task/configure',capture:'manual'};
  if(command==='search'){if(args.length!==1)fail('use search "query"');return searchKnowledge({query:args[0]});}
  if(command==='search-json'){if(args.length)fail('use JSON stdin');return searchKnowledge(input());}
  if(command==='token'){if(args.length)fail('unexpected arguments');return {token:randomUUID()};}
  if(command==='init') {
    if(args.length!==5||args[0]!=='--new'||args[1]!=='--max-bytes'||args[3]!=='--retention-days')fail('use init --new --max-bytes N --retention-days N');
    return initialize(root,{max_bytes:Number(args[2]),retention_days:Number(args[4])});
  }
  if(args.length)fail('unexpected arguments; use JSON stdin');
  const store=new LocalStore(root);
  try {
    switch(command){
      case 'status':return store.status();
      case 'doctor':{
        const integrity=store.db.prepare('PRAGMA integrity_check').all();
        if(integrity.length!==1||integrity[0].integrity_check!=='ok')fail('database integrity check failed');
        return {status:'ok',integrity,...store.status(),node:process.version,sqlite:process.versions.sqlite,limitations:['manual capture','no MCP/adapters yet','dirty/non-Git freshness may be unknown']};
      }
      case 'task':return store.task(input());
      case 'update':return store.update(input());
      case 'checkpoint':return store.checkpoint(input(),observe(root));
      case 'resume':{const v=input();shape(v,['task_id'],['checkpoint_id','offset']);return store.resume(v.task_id,observe(root),v.checkpoint_id,v.offset);}
      case 'export':return store.export();
      case 'delete-task':{const v=input();shape(v,['task_id']);return store.deleteTask(v.task_id);}
      case 'configure':return store.configure(input());
      case 'prune':return store.prune();
      default:return fail('unknown command; run help');
    }
  }finally{store.close();}
}
try{process.stdout.write(JSON.stringify(run(),null,2)+'\n');}
catch(error){process.stderr.write(JSON.stringify({error:(error as Error).message})+'\n');process.exitCode=1;}
