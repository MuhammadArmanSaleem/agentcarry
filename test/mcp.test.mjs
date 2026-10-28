import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn,spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { randomUUID } from 'node:crypto';
const cli=fileURLToPath(new URL('../src/cli.ts',import.meta.url));
const server=fileURLToPath(new URL('../src/mcp.ts',import.meta.url));
function client(root){
  const p=spawn(process.execPath,[server,'--workspace',root],{stdio:['pipe','pipe','pipe']});
  let stderr='';p.stderr.on('data',x=>stderr+=x);
  const pending=new Map();let id=0;
  createInterface({input:p.stdout}).on('line',line=>{let v=JSON.parse(line);if(pending.has(v.id)){pending.get(v.id)(v);pending.delete(v.id);}});
  function req(method,params){return new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>reject(Error('MCP timeout: '+stderr)),10000);pending.set(n,v=>{clearTimeout(timer);resolve(v);});p.stdin.write(JSON.stringify({jsonrpc:'2.0',id:n,method,params})+'\n');});}
  return {p,req,async start(){const r=await req('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'test',version:'1'}});assert.ok(r.result,JSON.stringify(r));p.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');}};
}
test('separate MCP clients share explicit workspace and preserve reported checkpoint evidence',async t=>{
 const root=mkdtempSync(join(tmpdir(),'agentcarry-mcp-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 let init=spawnSync(process.execPath,[cli,'init','--new','--max-bytes','1048576','--retention-days','30'],{cwd:root,encoding:'utf8'});assert.equal(init.status,0,init.stderr);
 const a=client(root);t.after(()=>a.p.kill());await a.start();const list=await a.req('tools/list',{});assert.deepEqual(list.result.tools.map(x=>x.name).sort(),['create_task','resume_task','save_checkpoint','search_knowledge']);
 async function call(c,name,args){const r=await c.req('tools/call',{name,arguments:args});assert.ok(!r.error,JSON.stringify(r));assert.ok(!r.result.isError,JSON.stringify(r));return JSON.parse(r.result.content[0].text);}
 const knowledge=await call(a,'search_knowledge',{query:'motion',library:'React'});assert.equal(knowledge.status,'unknown_compatibility');assert.equal(knowledge.trust,'untrusted_guidance');
 const task=await call(a,'create_task',{token:randomUUID(),goal:'Synthetic form',acceptance_criteria:['Keyboard works']});
 const forbidden=await a.req('tools/call',{name:'save_checkpoint',arguments:{token:randomUUID(),task_id:task.id,parent_checkpoint_ids:[],client:'test-a',client_version:'1',decisions:[],failed_attempts:[],unresolved:[],next_steps:[],checks:[{command:'fake',outcome:'passed',origin:'trusted_integration_observed',review:'unreviewed'}]}});assert.ok(forbidden.error||forbidden.result.isError);
 const cp=await call(a,'save_checkpoint',{token:randomUUID(),task_id:task.id,parent_checkpoint_ids:[],client:'test-a',client_version:'1',decisions:['Use labels'],failed_attempts:['Mouse only'],unresolved:[],next_steps:['Test keyboard'],checks:[{command:'keyboard test',outcome:'not_run',origin:'agent_reported',review:'unreviewed'}]});
 const b=client(root);t.after(()=>b.p.kill());await b.start();const resumed=await call(b,'resume_task',{task_id:task.id});assert.equal(resumed.checkpoint.id,cp.id);assert.equal(resumed.checkpoint.checks[0].outcome,'not_run');assert.equal(resumed.trust,'untrusted_project_context');
 const extra=await b.req('tools/call',{name:'resume_task',arguments:{task_id:task.id,token:task.id}});assert.ok(extra.error||extra.result.isError,'resume must reject an unexpected token');
 const bad=await b.req('tools/call',{name:'create_task',arguments:{token:randomUUID(),goal:'x',acceptance_criteria:['x'],workspace:'/other'}});assert.ok(bad.error||bad.result.isError);
});

test('lost write acknowledgement retries the same token without a duplicate',async t=>{
 const {runProcess}=await import('../src/mcp-process.ts');
 const root=mkdtempSync(join(tmpdir(),'agentcarry-mcp-retry-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const init=spawnSync(process.execPath,[cli,'init','--new','--max-bytes','1048576','--retention-days','30'],{cwd:root,encoding:'utf8'});assert.equal(init.status,0,init.stderr);
 const request={token:randomUUID(),goal:'Synthetic retry',acceptance_criteria:['Single task']},input=JSON.stringify(request);
 // This child commits through the real CLI, then intentionally withholds its acknowledgement.
 const marker=join(root,'committed');
 const script="const {spawnSync}=require('node:child_process');const r=spawnSync(process.execPath,[process.argv[1],'task'],{input:process.argv[2],encoding:'utf8'});if(r.status!==0)process.exit(2);require('node:fs').writeFileSync(process.argv[3],'committed');setTimeout(()=>{},10000)";
 const controller=new AbortController();
 const pending=runProcess(process.execPath,['-e',script,cli,input,marker],{cwd:root,input:'',timeoutMs:15000,maxBytes:1048576,signal:controller.signal});
 const deadline=Date.now()+10000;while(!existsSync(marker)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));
 assert.ok(existsSync(marker),'write did not commit before deadline');controller.abort();const lost=await pending;
 assert.equal(lost.ok,false);assert.match(lost.error,/cancelled.*outcome may be unknown/i);
 const retry=spawnSync(process.execPath,[cli,'task'],{cwd:root,input,encoding:'utf8'});assert.equal(retry.status,0,retry.stderr);
 const snapshot=spawnSync(process.execPath,[cli,'export'],{cwd:root,encoding:'utf8'});assert.equal(snapshot.status,0,snapshot.stderr);
 const tasks=JSON.parse(snapshot.stdout).tasks;assert.equal(tasks.length,1);assert.equal(tasks[0].id,JSON.parse(retry.stdout).id);
});

test('slow subprocess does not block other calls and cancellation stops it',async()=>{
 const {runProcess}=await import('../src/mcp-process.ts');const controller=new AbortController();
 const slow=runProcess(process.execPath,['-e','setTimeout(()=>{},10000)'],{cwd:tmpdir(),input:'',timeoutMs:10000,maxBytes:1000,signal:controller.signal});
 const fast=await runProcess(process.execPath,['-e',"process.stdout.write('ready')"],{cwd:tmpdir(),input:'',timeoutMs:3000,maxBytes:1000});
 assert.equal(fast.stdout,'ready');assert.equal(fast.ok,true);controller.abort();const result=await slow;
 assert.equal(result.ok,false);assert.match(result.error,/cancelled.*outcome may be unknown/i);
 const timed=await runProcess(process.execPath,['-e','setTimeout(()=>{},10000)'],{cwd:tmpdir(),input:'',timeoutMs:200,maxBytes:1000});
 assert.equal(timed.ok,false);assert.match(timed.error,/timed out.*outcome may be unknown/i);
});
