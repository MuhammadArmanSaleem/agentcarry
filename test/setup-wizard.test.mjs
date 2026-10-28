import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,readdirSync,existsSync,readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { PassThrough } from 'node:stream';
import { runSetupWizard,terminalSetupUI } from '../src/setup-wizard.ts';
import { previewSetup } from '../src/setup.ts';
import { initialize } from '../src/local.ts';
import { listSetupOperations,setupStatus } from '../src/setup-apply.ts';

function fresh(t){const root=mkdtempSync(join(tmpdir(),'agentcarry wizard '));t.after(()=>rmSync(root,{recursive:true,force:true}));return root;}
function ui(answers,beforeAnswer=()=>{}){
 let output='',index=0;
 return {ask:async prompt=>{output+=prompt;beforeAnswer(prompt);return index<answers.length?answers[index++]:null;},write:text=>{output+=text;},text:()=>output};
}
test('cancel, exit, EOF and rejected initialization leave a new workspace untouched',async t=>{
 for(const answers of [['q'],['4'],[],['1','1','1','1','30','no']]){
  const root=fresh(t),result=await runSetupWizard(root,ui(answers));assert.equal(result.status,'cancelled');assert.equal(result.initialized,false);assert.deepEqual(readdirSync(root),[]);
 }
});
test('invalid numeric answers never select defaults or authorize writes',async t=>{
 const root=fresh(t),screen=ui(['1','9','2','1e6','0','17','','q']);
 assert.equal((await runSetupWizard(root,screen)).status,'cancelled');assert.deepEqual(readdirSync(root),[]);assert.match(screen.text(),/Enter a whole number/);
});
test('declining client edits after explicit initialization retains only the initialized store',async t=>{
 const root=fresh(t),result=await runSetupWizard(root,ui(['1','1','1','1','30','yes','no']));
 assert.equal(result.status,'cancelled');assert.equal(result.initialized,true);assert.ok(existsSync(join(root,'.agentcarry','local.sqlite')));assert.equal(existsSync(join(root,'.gemini')),false);
 assert.equal(listSetupOperations(root).length,0);
});
for(const client of ['gemini','opencode'])test(`${client}: guided install, menu undo and forgetting share the setup core`,async t=>{
 const root=fresh(t),screen=ui(['1',client==='gemini'?'1':'2','1','1','30','yes','yes']);
 const installed=await runSetupWizard(root,screen);assert.equal(installed.status,'applied');assert.equal(installed.connectivity,'not_checked');assert.equal(installed.capture,'manual');
 assert.match(screen.text(),/Connectivity has not been checked/);assert.match(screen.text(),/trust/);
 const plan=previewSetup(root,client),config=JSON.parse(readFileSync(plan.config_path,'utf8'));config.theme='later';writeFileSync(plan.config_path,JSON.stringify(config));
 const operations=listSetupOperations(root);assert.equal(operations.length,1);assert.deepEqual(Object.keys(operations[0]).sort(),['client','id','phase']);
 const declined=await runSetupWizard(root,ui(['2','1','no']));assert.equal(declined.status,'cancelled');assert.equal(setupStatus(root,installed.operation_id).observed_config,'changed');
 const undone=await runSetupWizard(root,ui(['2','1','yes']));assert.equal(undone.status,'rolled_back');assert.deepEqual(JSON.parse(readFileSync(plan.config_path,'utf8')),{theme:'later'});
 const forgotten=await runSetupWizard(root,ui(['3','1','yes']));assert.equal(forgotten.status,'forgotten');assert.equal(forgotten.backup_contains_config,false);
 assert.equal((await runSetupWizard(root,ui(['2']))).status,'no_operations');
});
test('existing exact entries and conflicts never initialize, adopt or expose unrelated config',async t=>{
 const root=fresh(t),plan=previewSetup(root,'gemini');mkdirSync(dirname(plan.config_path));
 for(const entry of [plan.proposed_entry,{command:'another-server'}]){
  const bytes=JSON.stringify({auth:'synthetic-secret',mcpServers:{'agentcarry-preview':entry}});writeFileSync(plan.config_path,bytes);
  const screen=ui(['1','1']),result=await runSetupWizard(root,screen);
  assert.equal(result.status,entry===plan.proposed_entry?'already_configured':'conflict');assert.equal(existsSync(join(root,'.agentcarry')),false);
  assert.equal(readFileSync(plan.config_path,'utf8'),bytes);assert.ok(!screen.text().includes('synthetic-secret'));
 }
});
test('changing config at confirmation refuses a stale plan instead of overwriting',async t=>{
 const root=fresh(t);initialize(root,{max_bytes:1048576,retention_days:30});const path=previewSetup(root,'opencode').config_path;
 const screen=ui(['1','2','1','yes'],prompt=>{if(prompt.startsWith('Apply this preview'))writeFileSync(path,JSON.stringify({later:'preserve'}));});
 await assert.rejects(runSetupWizard(root,screen),/plan changed|stale/);assert.deepEqual(JSON.parse(readFileSync(path,'utf8')),{later:'preserve'});assert.equal(listSetupOperations(root).length,0);
});
test('reopening setup after an unacknowledged apply offers the saved operation for undo',async t=>{
 const root=fresh(t);initialize(root,{max_bytes:1048576,retention_days:30});
 const installed=await runSetupWizard(root,ui(['1','2','1','yes']));
 // Treat the acknowledgement as lost; a fresh UI uses persisted operation metadata.
 const screen=ui(['2','1','yes']),undone=await runSetupWizard(root,screen);
 assert.equal(undone.operation_id,installed.operation_id);assert.equal(undone.status,'rolled_back');assert.match(screen.text(),new RegExp(installed.operation_id));
});
test('terminal EOF aborts a pending question and later questions return cancellation',async()=>{
 const input=new PassThrough(),output=new PassThrough(),terminal=terminalSetupUI(input,output);
 try{const pending=terminal.ask('Choose: ');input.end();assert.equal(await pending,null);assert.equal(await terminal.ask('Again: '),null);}finally{terminal.close();}
});
test('noninteractive CLI refuses guided setup without mutation and preserves machine JSON commands',t=>{
 const root=fresh(t),cli=fileURLToPath(new URL('../src/cli.ts',import.meta.url));
 const denied=spawnSync(process.execPath,[cli,'setup'],{cwd:root,input:'yes\n',encoding:'utf8'});assert.notEqual(denied.status,0);assert.match(denied.stderr,/interactive terminal/);assert.deepEqual(readdirSync(root),[]);
 const plan=spawnSync(process.execPath,[cli,'setup-preview','gemini'],{cwd:root,encoding:'utf8'});assert.equal(plan.status,0,plan.stderr);assert.equal(JSON.parse(plan.stdout).status,'preview');assert.deepEqual(readdirSync(root),[]);
});
