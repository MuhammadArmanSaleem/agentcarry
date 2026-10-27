import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import { searchKnowledge } from '../src/knowledge.ts';

const fixture=JSON.parse(readFileSync(new URL('../test/knowledge-cases.json',import.meta.url),'utf8'));
const categories={},failures=[],timings=[],sizes=[];
let hits=0,answerable=0,packageHash;
for(const c of fixture.cases){
  const {id,expected,status,as_of,...request}=c,start=performance.now();
  const result=searchKnowledge(request,as_of??'2026-10-27');
  timings.push(performance.now()-start);sizes.push(Buffer.byteLength(JSON.stringify(result)));packageHash=result.package_hash;
  const category=expected?'relevant':status;categories[category]??={cases:0,passed:0};categories[category].cases++;
  const passed=expected?(result.status==='ok'&&result.results.some(x=>x.id===expected)):(result.status===status&&!result.results.length);
  if(expected){answerable++;if(passed)hits++;}
  if(passed)categories[category].passed++;else failures.push({id,expected:expected??status,actual:result.status,returned:result.results.map(x=>x.id)});
}
timings.sort((a,b)=>a-b);
const report={fixture_version:fixture.version,fixture_hash:createHash('sha256').update(JSON.stringify(fixture)).digest('hex'),
  package_id:'web-accessibility',package_version:'0.1.0',package_hash:packageHash,
  environment:{platform:process.platform,arch:process.arch,node:process.version,sqlite:process.versions.sqlite},
  cases:fixture.cases.length,passed:fixture.cases.length-failures.length,categories,
  answerable,top_five_hits:hits,failures,median_ms:timings[Math.floor(timings.length/2)],
  p95_ms:timings[Math.ceil(timings.length*0.95)-1],max_response_bytes:Math.max(...sizes)};
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(failures.length)process.exitCode=1;
