import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { createRetriever, hash } from './retrieval.mjs';

const read = name => readFileSync(new URL(name,import.meta.url),'utf8');
export const corpus = JSON.parse(read('./retrieval-fixture.json'));
const caseText = read('./retrieval-cases.json');
export const fixture = JSON.parse(caseText);
// Parsed JSON hash ignores checkout line endings/formatting; raw bytes stay identifiable.
export const caseFingerprint = text => hash(JSON.stringify(JSON.parse(text)));

export function evaluate() {
  const search = createRetriever(corpus);
  const categories = {}, failures = [], measurements = [];
  let answerable = 0, hits = 0, prohibited = 0;
  for (const c of fixture.cases) {
    const start = performance.now();
    const result = search(c);
    const duration_ms = performance.now()-start;
    const ids = result.results.map(r=>r.id);
    const errors = [];
    if (result.status !== c.status) errors.push(`status ${result.status}, expected ${c.status}`);
    if (c.expected.length) {
      answerable++;
      if (c.expected.every(id=>ids.includes(id))) hits++;
      else errors.push('expected source absent from top five');
    } else if (ids.length) errors.push('expected no result');
    if (c.warning && !result.warnings.includes(c.warning)) errors.push('expected warning absent');
    for (const id of ids) {
      const section = corpus.sections.find(s=>s.id===id);
      const major = Number(c.version?.split('.')[0]);
      if (section.status !== 'published' || section.review_due < '2026-10-26' ||
          section.technology !== c.technology || major < section.min_major || major > section.max_major || c.forbidden?.includes(id)) {
        prohibited++; errors.push(`prohibited source: ${id}`);
      }
    }
    if (result.results.length > 5) errors.push('top-k bound exceeded');
    const category = categories[c.category] ??= {cases:0,passed:0};
    category.cases++; if (!errors.length) category.passed++;
    if (errors.length) failures.push({id:c.id,errors});
    measurements.push({id:c.id,duration_ms,response_bytes:Buffer.byteLength(JSON.stringify(result))});
  }
  const db = new DatabaseSync(':memory:');
  const sqlite = db.prepare('SELECT sqlite_version() version').get().version; db.close();
  const times = measurements.map(m=>m.duration_ms).sort((a,b)=>a-b);
  return {fixture_version:fixture.fixture_version,corpus_version:corpus.corpus_version,
    corpus_hash:hash(JSON.stringify(corpus)),cases_hash:caseFingerprint(caseText),cases_file_hash:hash(caseText),
    environment:{platform:process.platform,arch:process.arch,node:process.version,sqlite},
    cases:fixture.cases.length,passed:fixture.cases.length-failures.length,categories,
    answerable,top_five_hits:hits,prohibited_results:prohibited,failures,
    latency_ms:{median:times[Math.floor(times.length/2)],p95:times[Math.ceil(times.length*0.95)-1]},
    max_response_bytes:Math.max(...measurements.map(m=>m.response_bytes)),measurements};
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = evaluate(); process.stdout.write(JSON.stringify(report,null,2)+'\n');
  if (report.failures.length) process.exitCode=1;
}
