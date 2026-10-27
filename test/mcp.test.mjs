import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
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
 const bad=await b.req('tools/call',{name:'create_task',arguments:{token:randomUUID(),goal:'x',acceptance_criteria:['x'],workspace:'/other'}});assert.ok(bad.error||bad.result.isError);
});
