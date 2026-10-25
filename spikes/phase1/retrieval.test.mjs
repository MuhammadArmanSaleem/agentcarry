import test from 'node:test';
import assert from 'node:assert/strict';
import { corpus, fixture, evaluate, caseFingerprint } from './retrieval-eval.mjs';
import { createRetriever, hash } from './retrieval.mjs';

test('frozen labeled retrieval cases pass with no prohibited results', () => {
  const result=evaluate();
  assert.ok(fixture.cases.length>=20);
  assert.equal(result.failures.length,0,JSON.stringify(result.failures));
  assert.equal(result.top_five_hits,result.answerable);
  assert.equal(result.prohibited_results,0);
});
test('known withdrawn and incompatible matches cannot crowd eligible sections out of top five', () => {
  const expanded=structuredClone(corpus);
  for(let i=0;i<20;i++) expanded.sections.push({...corpus.sections[0],id:'excluded-'+i,status:'withdrawn'});
  const result=createRetriever(expanded)({query:'motion',technology:'sample-web',version:'1.0.0'});
  assert.deepEqual(result.results.map(r=>r.id),['ui-motion']);
});
test('returned content includes exact provenance and remains untrusted task data', () => {
  const result=createRetriever(corpus)({query:'motion',technology:'sample-web',version:'1.0.0'});
  const row=result.results[0];
  assert.equal(row.content_hash,hash(corpus.sections[0].body));
  assert.equal(row.source,'synthetic:synthetic-1/ui-motion');
  assert.equal(row.trust,'untrusted_task_data');
  assert.equal(result.freshness,'offline_last_known');
  assert.equal(result.registry_checked_at,corpus.registry_checked_at);
});
test('missing review dates fail closed and caller changes cannot alter the owned snapshot', () => {
  const changed=structuredClone(corpus), search=createRetriever(changed);
  changed.sections[0].status='withdrawn';
  assert.equal(search({query:'motion',technology:'sample-web',version:'1.0.0'}).results.length,1);
  delete changed.sections[1].review_due;
  assert.equal(createRetriever(changed)({query:'colour',technology:'sample-web',version:'1.0.0'}).results.length,0);
});
test('query syntax is literal data and invalid bounds/pins fail explicitly', () => {
  const search=createRetriever(corpus), input={query:'" OR * ) ; --',technology:'sample-web',version:'1.0.0'};
  assert.doesNotThrow(()=>search(input));
  for(const limit of [0,6,1.5]) assert.throws(()=>search({...input,limit}),/invalid/);
  assert.throws(()=>search({...input,pins:{'web-guide':'latest'}}),/invalid/);
  assert.throws(()=>search({...input,query:'x'.repeat(1001)}),/invalid/);
});
test('all review dates expiring produces no match rather than a freshness claim', () => {
  assert.equal(createRetriever(corpus)({query:'motion',technology:'sample-web',version:'1.0.0',as_of:'2027-01-01'}).status,'no_match');
});
test('malformed review dates are excluded; incompatible pins warn without substituting', () => {
  const changed=structuredClone(corpus); changed.sections[0].review_due='2026-99-99';
  assert.equal(createRetriever(changed)({query:'motion',technology:'sample-web',version:'1.0.0'}).results.length,0);
  const result=createRetriever(corpus)({query:'motion',technology:'sample-web',version:'2.0.0',pins:{'web-guide':'1.0.0'}});
  assert.equal(result.results.length,0); assert.ok(result.warnings.includes('pin_incompatible:web-guide@1.0.0'));
});
test('case fingerprints ignore checkout line endings but detect changed test meaning', () => {
  const lf=JSON.stringify(fixture,null,2)+'\n', crlf=lf.replaceAll('\n','\r\n');
  assert.equal(caseFingerprint(lf),caseFingerprint(crlf));
  const changed=structuredClone(fixture); changed.cases[0].expected=[];
  assert.notEqual(caseFingerprint(lf),caseFingerprint(JSON.stringify(changed)));
});
