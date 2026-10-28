import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync,readFileSync,existsSync,readdirSync,symlinkSync,copyFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync,spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {initialize} from '../src/local.ts';
import {previewSetup} from '../src/setup.ts';
import {applySetup,rollbackSetup,setupStatus,forgetSetup,unlockSetup} from '../src/setup-apply.ts';
function fresh(t,client='gemini',before){
 const root=mkdtempSync(join(tmpdir(),'agentcarry apply '));t.after(()=>rmSync(root,{recursive:true,force:true}));
 initialize(root,{max_bytes:1048576,retention_days:30});let p=previewSetup(root,client);
 if(before!==undefined){mkdirSync(dirname(p.config_path),{recursive:true});writeFileSync(p.config_path,before);p=previewSetup(root,client);}
 const request={token:randomUUID(),client,expected_revision:p.config_revision,expected_plan:p.plan_revision,max_backup_bytes:1048576};
 return {root,p,request,path:p.config_path};
}
function entry(config,client){return client==='gemini'?config.mcpServers?.['agentcarry-preview']:config.mcp?.servers?.['agentcarry-preview'];}
for(const client of ['gemini','opencode'])test(`${client}: apply, retry, rollback and forgetting do not resurrect a removed entry`,t=>{
 const {root,request,path}=fresh(t,client);assert.equal(applySetup(root,request).status,'applied');assert.ok(entry(JSON.parse(readFileSync(path)),client));
 assert.equal(applySetup(root,request).status,'already_applied');assert.equal(setupStatus(root,request.token).observed_config,'applied');
 assert.equal(rollbackSetup(root,request.token).status,'rolled_back');assert.equal(existsSync(path),false);
 writeFileSync(path,JSON.stringify({later:'keep me'}));assert.equal(rollbackSetup(root,request.token).status,'already_rolled_back');assert.deepEqual(JSON.parse(readFileSync(path)),{later:'keep me'});
 assert.equal(forgetSetup(root,request.token).backup_contains_config,false);assert.throws(()=>applySetup(root,request),/rolled back or retired/);
});

test('unchanged existing config restores exact original bytes and keeps backup contents private',t=>{
 const before=' { "theme": "dark", "auth": "synthetic-secret", "mcpServers": { "other": {"command":"example"} } }\r\n';
 const {root,request,path}=fresh(t,'gemini',before);const result=applySetup(root,request);assert.ok(!JSON.stringify(result).includes('synthetic-secret'));
 assert.equal(JSON.parse(readFileSync(path)).auth,'synthetic-secret');assert.throws(()=>forgetSetup(root,request.token),/rollback before/);
 rollbackSetup(root,request.token);assert.equal(readFileSync(path,'utf8'),before);forgetSetup(root,request.token);
 const history=join(root,'.agentcarry','setup-history');for(const name of readdirSync(history))assert.ok(!readFileSync(join(history,name),'utf8').includes(Buffer.from(before).toString('base64')));
});

test('rollback preserves later unrelated edits and refuses changes to the owned entry',t=>{
 const {root,request,path}=fresh(t,'opencode',JSON.stringify({theme:'before'}));applySetup(root,request);
 const config=JSON.parse(readFileSync(path));config.theme='later';config.extra={keep:true};writeFileSync(path,JSON.stringify(config));
 rollbackSetup(root,request.token);assert.deepEqual(JSON.parse(readFileSync(path)),{theme:'later',extra:{keep:true}});
 const p=previewSetup(root,'opencode'),next={...request,token:randomUUID(),expected_revision:p.config_revision,expected_plan:p.plan_revision};applySetup(root,next);
 const changed=JSON.parse(readFileSync(path));changed.mcp.servers['agentcarry-preview'].command=['different'];writeFileSync(path,JSON.stringify(changed));const bytes=readFileSync(path);
 assert.throws(()=>rollbackSetup(root,next.token),/entry changed/);assert.deepEqual(readFileSync(path),bytes);
});

test('stale or forged plans, budget failures and changed-token payloads leave config intact',t=>{
 const {root,request,path}=fresh(t,'gemini',JSON.stringify({large:'x'.repeat(5000)}));const bytes=readFileSync(path);
 assert.throws(()=>applySetup(root,{...request,expected_plan:'0'.repeat(64)}),/plan changed/);assert.deepEqual(readFileSync(path),bytes);
 assert.throws(()=>applySetup(root,{...request,max_backup_bytes:4096}),/budget exceeded/);assert.deepEqual(readFileSync(path),bytes);
 writeFileSync(path,JSON.stringify({later:true}));assert.throws(()=>applySetup(root,request),/plan changed|stale/);assert.deepEqual(JSON.parse(readFileSync(path)),{later:true});
 const p=previewSetup(root,'gemini'),next={...request,expected_revision:p.config_revision,expected_plan:p.plan_revision};applySetup(root,next);
 assert.throws(()=>applySetup(root,{...next,max_backup_bytes:2097152}),/token reused/);
});

test('a last-moment external edit is not overwritten and rollback leaves that edit intact',t=>{
 const {root,request,path}=fresh(t,'gemini',JSON.stringify({theme:'before'}));
 assert.throws(()=>applySetup(root,request,stage=>{if(stage==='backup_saved')writeFileSync(path,JSON.stringify({theme:'external'}));}),/configuration changed/);
 assert.deepEqual(JSON.parse(readFileSync(path)),{theme:'external'});rollbackSetup(root,request.token);assert.deepEqual(JSON.parse(readFileSync(path)),{theme:'external'});
});

test('a rollback interrupted after writing config can be retried without applying again',t=>{
 const before=JSON.stringify({preserve:true}),{root,request,path}=fresh(t,'gemini',before);applySetup(root,request);
 assert.throws(()=>rollbackSetup(root,request.token,stage=>{if(stage==='rollback_written')throw Error('injected failure');}),/injected/);
 assert.equal(readFileSync(path,'utf8'),before);assert.throws(()=>applySetup(root,request),/rolled back or retired/);
 assert.equal(rollbackSetup(root,request.token).status,'rolled_back');
});

test('private history links, tracked backups, invalid UTF-8 and live lock owners fail closed',t=>{
 const {root,request,path}=fresh(t,'gemini');const outside=mkdtempSync(join(tmpdir(),'agentcarry-history-'));t.after(()=>rmSync(outside,{recursive:true,force:true}));
 symlinkSync(outside,join(root,'.agentcarry','setup-history'),'junction');assert.throws(()=>applySetup(root,request),/unsafe setup history/);rmSync(join(root,'.agentcarry','setup-history'));
 mkdirSync(dirname(path),{recursive:true});writeFileSync(path,Buffer.from([123,34,120,34,58,34,255,34,125]));assert.throws(()=>previewSetup(root,'gemini'),/JSON/);rmSync(path);
 for(const text of ['{"count":1e400}','{"count":9007199254740993}']){writeFileSync(path,text);assert.throws(()=>previewSetup(root,'gemini'),/numeric range/);assert.equal(readFileSync(path,'utf8'),text);}rmSync(path);
 applySetup(root,request,stage=>{if(stage==='backup_saved')assert.throws(()=>unlockSetup(root,request.token,true),/still running/);});rollbackSetup(root,request.token);
 initialize(outside,{max_bytes:1048576,retention_days:30});mkdirSync(join(outside,'.agentcarry','setup-history'));copyFileSync(join(root,'.agentcarry','setup-history',request.token+'.json'),join(outside,'.agentcarry','setup-history',request.token+'.json'));assert.throws(()=>setupStatus(outside,request.token),/foreign setup history/);
 const git=spawnSync('git',['init','-q'],{cwd:root,encoding:'utf8'});assert.equal(git.status,0,git.stderr);
 const add=spawnSync('git',['add','-f','.agentcarry/setup-history/'+request.token+'.json'],{cwd:root,encoding:'utf8'});assert.equal(add.status,0,add.stderr);
 assert.throws(()=>setupStatus(root,request.token),/tracked by Git/);
});

for(const point of ['backup_saved','config_written'])test(`process death at ${point} keeps recoverable state and stale lock fails closed`,async t=>{
 const before=JSON.stringify({original:'keep'}),{root,request,path}=fresh(t,'gemini',before);
 const worker=join(root,'worker.mjs'),module=pathToFileURL(fileURLToPath(new URL('../src/setup-apply.ts',import.meta.url))).href;
 writeFileSync(worker,`import {applySetup} from ${JSON.stringify(module)};import{writeFileSync}from'node:fs';applySetup(process.cwd(),JSON.parse(process.argv[2]),s=>{if(s===process.argv[3]){writeFileSync('ready',s);Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0);}});`);
 const child=spawn(process.execPath,[worker,JSON.stringify(request),point],{cwd:root,stdio:['ignore','ignore','pipe']});let stderr='';child.stderr.on('data',d=>stderr+=d);
 t.after(()=>child.kill('SIGKILL'));const marker=join(root,'ready'),deadline=Date.now()+10000;while(!existsSync(marker)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));assert.ok(existsSync(marker),stderr);
 await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGKILL');});
 assert.equal(setupStatus(root,request.token).observed_config,point==='backup_saved'?'original':'applied');
 assert.throws(()=>applySetup(root,request),/setup lock/);assert.equal(unlockSetup(root,request.token,true).status,'unlocked');
 rollbackSetup(root,request.token);assert.equal(readFileSync(path,'utf8'),before);
});

test('an older active operation cannot undo a later reinstall with identical config',t=>{
 const {root,request,path}=fresh(t,'gemini');applySetup(root,request);rmSync(path);
 const p=previewSetup(root,'gemini'),next={...request,token:randomUUID(),expected_revision:p.config_revision,expected_plan:p.plan_revision};
 assert.throws(()=>applySetup(root,next),/unresolved setup operation/);
 rollbackSetup(root,request.token);applySetup(root,next);const bytes=readFileSync(path);
 assert.equal(rollbackSetup(root,request.token).status,'already_rolled_back');assert.deepEqual(readFileSync(path),bytes);
});

test('forget removes operation-scoped orphan temps and retains a replay-blocking tombstone',t=>{
 const {root,request}=fresh(t,'gemini');applySetup(root,request);rollbackSetup(root,request.token);
 const history=join(root,'.agentcarry','setup-history'),temp=join(history,'tmp-'+request.token+'-'+randomUUID());writeFileSync(temp,'synthetic-secret-orphan');
 forgetSetup(root,request.token);assert.equal(existsSync(temp),false);assert.equal(setupStatus(root,request.token).status,'forgotten');assert.throws(()=>applySetup(root,request),/retired/);
 writeFileSync(temp,'synthetic-pending-cleanup');assert.equal(setupStatus(root,request.token).cleanup_pending,true);assert.equal(setupStatus(root,request.token).backup_contains_config,true);forgetSetup(root,request.token);assert.equal(setupStatus(root,request.token).cleanup_pending,false);
});

test('concurrent abandoned-lock recovery cannot remove a replacement writer lock',async t=>{
 const {root,request}=fresh(t,'gemini'),history=join(root,'.agentcarry','setup-history');mkdirSync(history);
 const exited=spawnSync(process.execPath,['-e',''],{encoding:'utf8'});assert.equal(exited.status,0,exited.stderr);
 assert.throws(()=>process.kill(exited.pid,0),e=>e.code==='ESRCH');
 writeFileSync(join(history,'lock'),JSON.stringify({token:request.token,pid:exited.pid}));
 const module=pathToFileURL(fileURLToPath(new URL('../src/setup-apply.ts',import.meta.url))).href,worker=join(root,'recover.mjs');
 writeFileSync(worker,`import{unlockSetup}from ${JSON.stringify(module)};import{writeFileSync,existsSync}from'node:fs';unlockSetup(process.cwd(),process.argv[2],true,()=>{writeFileSync('recover-ready','ready');while(!existsSync('recover-go'))Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10);});`);
 const child=spawn(process.execPath,[worker,request.token],{cwd:root,stdio:['ignore','ignore','pipe']});let stderr='';child.stderr.on('data',d=>stderr+=d);
 const done=new Promise(resolve=>child.on('close',code=>resolve(code)));t.after(()=>child.kill('SIGKILL'));
 const deadline=Date.now()+10000;while(!existsSync(join(root,'recover-ready'))&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));assert.ok(existsSync(join(root,'recover-ready')),stderr);
 assert.throws(()=>unlockSetup(root,request.token,true),/recovery lock/);
 assert.throws(()=>applySetup(root,request),/setup lock/);
 assert.equal(JSON.parse(readFileSync(join(history,'lock'))).pid,exited.pid);
 writeFileSync(join(root,'recover-go'),'go');assert.equal(await done,0,stderr);
 assert.equal(existsSync(join(history,'recovery-lock')),false);assert.equal(applySetup(root,request).status,'applied');
 // A surviving recovery guard is never silently removed after an interruption.
 writeFileSync(join(history,'recovery-lock'),JSON.stringify({token:request.token,pid:exited.pid}));
 assert.throws(()=>unlockSetup(root,request.token,true),/recovery lock/);
});

test('two simultaneous setup writers cannot both apply a stale plan',async t=>{
 const {root,request}=fresh(t,'opencode'),module=pathToFileURL(fileURLToPath(new URL('../src/setup-apply.ts',import.meta.url))).href;
 const worker=join(root,'race.mjs');writeFileSync(worker,`import{applySetup}from ${JSON.stringify(module)};import{writeFileSync,existsSync}from'node:fs';const r=JSON.parse(process.argv[2]);writeFileSync(r.token+'.ready','ready');while(!existsSync('go'))Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10);try{console.log(JSON.stringify(applySetup(process.cwd(),r)));}catch(e){console.error(e.message);process.exitCode=1;}`);
 const requests=[request,{...request,token:randomUUID()}];
 const children=requests.map(r=>{const p=spawn(process.execPath,[worker,JSON.stringify(r)],{cwd:root,stdio:['ignore','pipe','pipe']});let out='',err='';p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);const done=new Promise(resolve=>p.on('close',code=>resolve({code,out,err})));t.after(()=>p.kill('SIGKILL'));return {p,done};});
 const deadline=Date.now()+10000;while(!requests.every(r=>existsSync(join(root,r.token+'.ready')))&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));assert.ok(requests.every(r=>existsSync(join(root,r.token+'.ready'))));writeFileSync(join(root,'go'),'go');
 const results=await Promise.all(children.map(x=>x.done));assert.equal(results.filter(r=>r.code===0).length,1,JSON.stringify(results));assert.equal(results.filter(r=>r.code!==0).length,1);
});
