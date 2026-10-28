import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,mkdirSync,writeFileSync,readFileSync,readdirSync,symlinkSync,linkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { previewSetup } from '../src/setup.ts';
function workspace(t){const root=mkdtempSync(join(tmpdir(),'agentcarry-setup-'));t.after(()=>rmSync(root,{recursive:true,force:true}));return root;}

test('setup CLI previews both clients without creating configuration or a store',t=>{
 const root=workspace(t),cli=fileURLToPath(new URL('../src/cli.ts',import.meta.url));
 for(const name of ['gemini','opencode']){
  const r=spawnSync(process.execPath,[cli,'setup-preview',name],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
  const result=JSON.parse(r.stdout);assert.equal(result.status,'preview');assert.equal(result.operation,'create_config');assert.equal(result.changes_applied,false);assert.equal(result.initialization,'not_checked');
  const command=name==='gemini'?[result.proposed_entry.command,...result.proposed_entry.args]:result.proposed_entry.command;
  assert.equal(command[0],process.execPath);assert.equal(command[2],'--workspace');assert.equal(command[3],result.workspace);
  assert.deepEqual(readdirSync(root),[]);
 }
});

test('preview preserves config bytes, hides unrelated values and detects owned-entry conflicts',t=>{
 const root=workspace(t);mkdirSync(join(root,'.gemini'));
 for(const client of ['gemini','opencode']){
  const initial=previewSetup(root,client),config={unrelated:'synthetic-secret-not-for-output'};
  let current=config;for(const key of initial.entry_path.slice(0,-1)){current[key]={};current=current[key];}current['agentcarry-preview']=initial.proposed_entry;
  const source=JSON.stringify(config,null,4)+'\n';writeFileSync(initial.config_path,source);
  const same=previewSetup(root,client);assert.equal(same.status,'already_configured');assert.equal(same.operation,'none');assert.ok(!JSON.stringify(same).includes(config.unrelated));assert.equal(readFileSync(initial.config_path,'utf8'),source);
  current['agentcarry-preview']={command:'different-server'};writeFileSync(initial.config_path,JSON.stringify(config));
  const before=readFileSync(initial.config_path,'utf8');assert.equal(previewSetup(root,client).status,'conflict');assert.equal(readFileSync(initial.config_path,'utf8'),before);
 }
});

test('malformed configs and JSONC fail explicitly without replacing them',t=>{
 const root=workspace(t);writeFileSync(join(root,'opencode.jsonc'),'// existing user config');assert.throws(()=>previewSetup(root,'opencode'),/JSONC/);
 rmSync(join(root,'opencode.jsonc'));writeFileSync(join(root,'opencode.json'),'{ bad synthetic-secret');assert.throws(()=>previewSetup(root,'opencode'),/strict JSON/);assert.equal(readFileSync(join(root,'opencode.json'),'utf8'),'{ bad synthetic-secret');
 writeFileSync(join(root,'opencode.json'),JSON.stringify({mcp:[]}));assert.throws(()=>previewSetup(root,'opencode'),/JSON object/);
 writeFileSync(join(root,'opencode.json'),JSON.stringify({mcp:{'agentcarry-preview':{command:['old-server']}}}));assert.throws(()=>previewSetup(root,'opencode'),/legacy MCP/);
 assert.throws(()=>previewSetup(root,'unknown'),/client must/);
});

test('linked config directories and hard-linked config files are not read',t=>{
 const root=workspace(t),other=workspace(t);mkdirSync(join(other,'settings'));symlinkSync(join(other,'settings'),join(root,'.gemini'),'junction');
 assert.throws(()=>previewSetup(root,'gemini'),/unsafe Gemini/);
 const source=join(other,'original.json');writeFileSync(source,'{}');linkSync(source,join(root,'opencode.json'));
 assert.throws(()=>previewSetup(root,'opencode'),/unsafe client config/);assert.equal(readFileSync(source,'utf8'),'{}');
});
