import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,mkdtempSync,mkdirSync,copyFileSync,writeFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { searchKnowledge } from '../src/knowledge.ts';

const fixture=JSON.parse(readFileSync(new URL('./knowledge-cases.json',import.meta.url),'utf8'));
test('labeled real-guidance search cases return expected sources or explicit uncertainty',()=>{
  const failures=[],categories={};
  for(const c of fixture.cases){
    const {id,expected,status,as_of,...request}=c;
    const result=searchKnowledge(request,as_of??'2026-10-27');
    const passed=expected ? result.status==='ok' && result.results.some(r=>r.id===expected) : result.status===status && !result.results.length;
    const category=expected?'relevant':status;categories[category]??={passed:0,total:0};categories[category].total++;
    if(passed)categories[category].passed++;else failures.push({id,status:result.status,results:result.results.map(r=>r.id)});
  }
  assert.equal(fixture.cases.length,24);assert.deepEqual(failures,[],JSON.stringify({failures,categories}));
});
test('guidance includes provenance, draft status, hashes and offline uncertainty',()=>{
  const r=searchKnowledge({query:'reduced motion'},'2026-10-27');
  assert.equal(r.status,'ok');assert.equal(r.package_status,'draft');assert.equal(r.registry_status,'not_checked');
  assert.equal(r.project_conflicts,'not_assessed');assert.equal(r.package_hash.length,64);
  assert.ok(r.results.some(x=>x.id==='reduced-motion'&&x.sources.some(s=>s.includes('mozilla.org'))));
  assert.ok(r.results.every(x=>x.trust==='untrusted_guidance'&&x.content_hash.length===64));
  assert.ok(r.results.length<=5);
});
test('unsupported library version or unavailable pin never silently substitutes guidance',()=>{
  assert.equal(searchKnowledge({query:'motion',library:'React'},'2026-10-27').status,'unknown_compatibility');
  assert.equal(searchKnowledge({query:'motion',pin:'2.0.0'},'2026-10-27').status,'pin_unavailable');
  assert.equal(searchKnowledge({query:'motion',pin:'0.1.0'},'2026-10-27').status,'ok');
});
test('review deadlines fail closed and literal FTS input cannot run query operators',()=>{
  assert.equal(searchKnowledge({query:'motion'},'2027-01-27').status,'ok');
  assert.equal(searchKnowledge({query:'motion'},'2027-01-28').status,'stale');
  assert.throws(()=>searchKnowledge({query:'motion'},'2026-02-30'),/invalid/);
  assert.doesNotThrow(()=>searchKnowledge({query:'" OR *) --'},'2026-10-27'));
  assert.throws(()=>searchKnowledge({query:'x'.repeat(501)},'2026-10-27'),/invalid/);
  assert.throws(()=>searchKnowledge({query:'motion',unexpected:true},'2026-10-27'),/invalid/);
});
test('modified metadata or content fails package integrity before any result',async t=>{
  const root=mkdtempSync(join(tmpdir(),'agentcarry-knowledge-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
  mkdirSync(join(root,'src'));mkdirSync(join(root,'knowledge'));
  for(const f of ['knowledge.ts','local.ts'])copyFileSync(fileURLToPath(new URL('../src/'+f,import.meta.url)),join(root,'src',f));
  const source=JSON.parse(readFileSync(new URL('../knowledge/web-accessibility-0.1.0.json',import.meta.url),'utf8'));
  source.review_by='2099-01-01';writeFileSync(join(root,'knowledge','web-accessibility-0.1.0.json'),JSON.stringify(source));
  const copy=await import(pathToFileURL(join(root,'src','knowledge.ts')).href);
  assert.throws(()=>copy.searchKnowledge({query:'motion'},'2026-10-27'),/integrity mismatch/);
});
test('CLI searches bundled draft in a non-Git folder without a store or provider credentials',t=>{
  const root=mkdtempSync(join(tmpdir(),'agentcarry-search-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
  const cli=fileURLToPath(new URL('../src/cli.ts',import.meta.url));
  const r=spawnSync(process.execPath,[cli,'search','focus keyboard'],{cwd:root,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);const value=JSON.parse(r.stdout);
  assert.equal(value.package_status,'draft');
  // The real current date may be after the fixed review deadline.
  if(value.status==='ok')assert.ok(value.results.some(s=>s.id==='visible-focus'));else assert.equal(value.status,'stale');
  const unknown=spawnSync(process.execPath,[cli,'search-json'],{cwd:root,input:JSON.stringify({query:'motion',library:'React'}),encoding:'utf8'});
  assert.equal(unknown.status,0,unknown.stderr);
  if(value.status==='ok')assert.equal(JSON.parse(unknown.stdout).status,'unknown_compatibility');
});
