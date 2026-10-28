import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const cli=fileURLToPath(new URL('../src/cli.ts',import.meta.url)),directory=mkdtempSync(join(tmpdir(),'agentcarry-setup-demo-'));
function run(command,input,args=[]){const r=spawnSync(process.execPath,[cli,command,...args],{cwd:directory,input:input?JSON.stringify(input):undefined,encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||r.error?.message||'CLI failed');return JSON.parse(r.stdout);}
try{
 run('init',null,['--new','--max-bytes','1048576','--retention-days','30']);
 const checks=[];
 for(const client of ['gemini','opencode']){
  let plan=run('setup-preview',null,[client]);mkdirSync(dirname(plan.config_path),{recursive:true});writeFileSync(plan.config_path,JSON.stringify({theme:'synthetic-before'}));plan=run('setup-preview',null,[client]);
  const request={token:randomUUID(),client,expected_revision:plan.config_revision,expected_plan:plan.plan_revision,max_backup_bytes:1048576};
  assert.equal(run('setup-apply',request).status,'applied');assert.equal(run('setup-apply',request).status,'already_applied');
  const config=JSON.parse(readFileSync(plan.config_path,'utf8'));config.theme='synthetic-later-edit';writeFileSync(plan.config_path,JSON.stringify(config));
  assert.equal(run('setup-rollback',{token:request.token}).status,'rolled_back');assert.deepEqual(JSON.parse(readFileSync(plan.config_path,'utf8')),{theme:'synthetic-later-edit'});
  assert.equal(run('setup-forget',{token:request.token}).backup_contains_config,false);checks.push({client,apply:'passed',same_token_retry:'passed',rollback_preserves_later_edit:'passed',forget:'passed'});
 }
 rmSync(directory,{recursive:true,force:true});process.stdout.write(JSON.stringify({demo:'passed',checks,clients_started:false,live_project_changed:false,demo_directory_removed:true},null,2)+'\n');
}catch(error){process.stderr.write(JSON.stringify({error:error.message,directory,synthetic_data_only:true})+'\n');process.exitCode=1;}
