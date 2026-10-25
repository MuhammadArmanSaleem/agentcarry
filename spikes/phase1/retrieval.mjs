// Synthetic public-knowledge retrieval experiment. No private memory or agent wiring.
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

export const hash = value => createHash('sha256').update(value).digest('hex');
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const validDate = value => typeof value === 'string' && datePattern.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;

export function createRetriever(input) {
  // Own a snapshot: callers cannot mutate status/compatibility behind the index.
  const corpus = structuredClone(input);
  if (corpus.synthetic !== true || !Array.isArray(corpus.sections)) throw Error('synthetic fixture required');
  const ids = new Set();
  for (const section of corpus.sections) {
    if (ids.has(section.id) || ['id','package','version','technology','title','body','status'].some(k => typeof section[k] !== 'string') ||
        !versionPattern.test(section.version) || !Number.isSafeInteger(section.min_major) ||
        !Number.isSafeInteger(section.max_major) || section.min_major < 0 || section.max_major < section.min_major ||
        !['draft','published','stale','withdrawn'].includes(section.status)) throw Error('invalid fixture section');
    ids.add(section.id);
  }
  const corpusHash = hash(JSON.stringify(corpus));

  return function search({query,technology,version,pins = null,project_rules = {},as_of = '2026-10-26',limit = 5}) {
    if (typeof query !== 'string' || query.length > 1000 || typeof technology !== 'string' ||
        !validDate(as_of) || !Number.isSafeInteger(limit) || limit < 1 || limit > 5 ||
        (pins !== null && (typeof pins !== 'object' || Array.isArray(pins))) ||
        project_rules === null || typeof project_rules !== 'object' || Array.isArray(project_rules)) throw Error('invalid search input');
    const response = {
      status:'no_match', results:[], conflicts:[], warnings:[],
      freshness:'offline_last_known', registry_checked_at:corpus.registry_checked_at ?? null,
      corpus_version:corpus.corpus_version, corpus_hash:corpusHash,
    };
    if (typeof version !== 'string' || !versionPattern.test(version) || !Number.isSafeInteger(Number(version.split('.')[0]))) {
      return {...response,status:'unknown_compatibility',warnings:['exact_stable_version_required']};
    }
    const major = Number(version.split('.')[0]);
    const active = s => s.status === 'published' && validDate(s.review_due) && s.review_due >= as_of;
    if (pins !== null) {
      for (const [name,pin] of Object.entries(pins)) {
        if (typeof pin !== 'string' || !versionPattern.test(pin)) throw Error('invalid package pin');
        if (!corpus.sections.some(s=>s.package===name && s.version===pin && active(s))) {
          response.warnings.push(`pin_unavailable:${name}@${pin}`);
        } else if (!corpus.sections.some(s=>s.package===name && s.version===pin && active(s) &&
            s.technology===technology && major>=s.min_major && major<=s.max_major)) {
          response.warnings.push(`pin_incompatible:${name}@${pin}`);
        }
      }
    }
    const eligible = corpus.sections.filter(s => active(s) && s.technology === technology &&
      major >= s.min_major && major <= s.max_major &&
      (pins === null || (Object.hasOwn(pins,s.package) && pins[s.package] === s.version)));
    // Convert text into quoted literal words. Users cannot inject FTS operators/SQL.
    const words = [...new Set(query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])].slice(0,12);
    if (!words.length || !eligible.length) return response;
    const expression = words.map(word=>`"${word}"`).join(' OR ');
    // Build only eligible sections before ranking. No excluded result can consume top-k.
    const db = new DatabaseSync(':memory:');
    try {
      db.exec('CREATE VIRTUAL TABLE sections USING fts5(id UNINDEXED,title,body);');
      const insert = db.prepare('INSERT INTO sections VALUES(?,?,?)');
      for (const s of eligible) insert.run(s.id,s.title,s.body);
      const found = db.prepare('SELECT id FROM sections WHERE sections MATCH ? ORDER BY bm25(sections),id LIMIT ?').all(expression,limit);
      for (const row of found) {
        const s = eligible.find(s=>s.id===row.id);
        // Fixture sections are short; return bounded excerpts for larger experiments.
        const excerpt = [...s.body].slice(0,512).join('');
        response.results.push({id:s.id,package:s.package,package_version:s.version,title:s.title,
          excerpt,content_hash:hash(s.body),source:`synthetic:${corpus.corpus_version}/${s.id}`,
          review_due:s.review_due,trust:'untrusted_task_data'});
        if (s.rule_key && Object.hasOwn(project_rules,s.rule_key) && project_rules[s.rule_key] !== s.rule_value) {
          response.conflicts.push({source_id:s.id,rule:s.rule_key,project_value:project_rules[s.rule_key],package_value:s.rule_value,authority:'project'});
        }
      }
      response.status = response.conflicts.length ? 'conflict' : response.results.length ? 'ok' : 'no_match';
      return response;
    } finally { db.close(); }
  };
}
