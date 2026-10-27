import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { shape, fail } from './local.ts';

// Digest pins the whole parsed package including metadata and sources. It detects
// accidental edits, not an attacker who can also edit this code.
const expectedHash='8f2761df60ed18741c61d02e14b48b3327988533994efe8d9df8e96ded821371';
const sha = (s:string)=>createHash('sha256').update(s).digest('hex');
const common = new Set(['a','an','and','are','as','at','be','by','can','do','for','from','how','i','in','is','it','of','on','or','should','the','to','use','we','what','when','with']);

// Explicit lookup of a bundled draft, not automatic package installation.
// asOf is injectable for deterministic tests; the CLI always uses the current date.
export function searchKnowledge(request:Record<string,any>, asOf=new Date().toISOString().slice(0,10)) {
  shape(request,['query'],['pin','library','library_version']);
  if(typeof request.query!=='string'||request.query.length>500 ||
     (request.pin!==undefined&&typeof request.pin!=='string')||
     (request.library!==undefined&&typeof request.library!=='string')||
     (request.library_version!==undefined&&typeof request.library_version!=='string')||
     !/^\d{4}-\d{2}-\d{2}$/.test(asOf)||Number.isNaN(Date.parse(asOf))||new Date(asOf).toISOString().slice(0,10)!==asOf)fail('invalid knowledge request');
  const pkg=JSON.parse(readFileSync(new URL('../knowledge/web-accessibility-0.1.0.json',import.meta.url),'utf8'));
  const hash=sha(JSON.stringify(pkg));
  if(hash!==expectedHash)fail('knowledge package integrity mismatch');
  const base={package_id:pkg.package_id,package_version:pkg.version,package_hash:hash,
    package_status:pkg.status,scope:pkg.scope,compatibility:pkg.compatibility,reviewed_at:pkg.reviewed_at,
    review_by:pkg.review_by,review_method:pkg.review_method,redistribution:pkg.redistribution,
    registry_status:'not_checked',last_registry_check:null,project_conflicts:'not_assessed',
    trust:'untrusted_guidance',results:[] as any[]};
  if(request.pin!==undefined && request.pin!==pkg.version)return {...base,status:'pin_unavailable',warnings:['no_version_substituted']};
  if(asOf<pkg.reviewed_at)return {...base,status:'review_date_in_future',warnings:['freshness_unknown']};
  if(asOf>pkg.review_by)return {...base,status:'stale',warnings:['review_expired']};
  if(request.library!==undefined||request.library_version!==undefined)
    return {...base,status:'unknown_compatibility',warnings:['library_versions_not_verified']};
  const words=[...new Set((request.query.toLowerCase().match(/[\p{L}\p{N}]+/gu)??[]).filter((w:string)=>w.length>1&&!common.has(w)))].slice(0,12);
  if(!words.length)return {...base,status:'no_match',warnings:['no_search_terms']};
  const expression=words.map((w:any)=>`"${w}"`).join(' OR '),db=new DatabaseSync(':memory:');
  try {
    db.exec('CREATE VIRTUAL TABLE sections USING fts5(id UNINDEXED,title,body);');
    const insert=db.prepare('INSERT INTO sections VALUES(?,?,?)');
    for(const s of pkg.sections)insert.run(s.id,s.title,s.text);
    const ids=db.prepare('SELECT id FROM sections WHERE sections MATCH ? ORDER BY bm25(sections),id LIMIT 5').all(expression);
    const results=ids.map(row=>{const s=pkg.sections.find((section:any)=>section.id===row.id);
      return {id:s.id,title:s.title,text:s.text,content_hash:sha(s.text),sources:s.sources,trust:'untrusted_guidance'};});
    return {...base,status:results.length?'ok':'no_match',results,warnings:['draft_explicit_lookup_only','upstream_status_not_checked','project_conflicts_not_assessed']};
  }finally{db.close();}
}
