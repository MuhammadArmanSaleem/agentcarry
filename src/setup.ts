import { lstatSync,readFileSync,realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonical,fail } from './local.ts';
import { createHash } from 'node:crypto';
import { isUtf8 } from 'node:buffer';

type Config = Record<string,unknown>;
function object(value:unknown):value is Config {
  return value!==null&&typeof value==='object'&&!Array.isArray(value);
}
function stat(path:string) {
  try{return lstatSync(path);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw error;}
}
function configObject(value:unknown,label:string):Config {
  if(!object(value))return fail(`${label} must be a JSON object`);
  return value;
}
function validateNumbers(value:unknown){
  const pending:unknown[]=[value];
  while(pending.length){const item=pending.pop();if(typeof item==='number'&&(!Number.isFinite(item)||(Number.isInteger(item)&&!Number.isSafeInteger(item))))return fail('client config contains an unsupported numeric range');
    if(item!==null&&typeof item==='object')pending.push(...Object.values(item));}
}
// Internal local inspector for preview/apply. Existing values can contain secrets;
// only previewSetup's explicitly selected fields are returned by the CLI preview.
export function inspectSetup(workspace:string,client:string) {
  if(client!=='gemini'&&client!=='opencode')return fail('client must be gemini or opencode');
  const root=realpathSync(workspace);
  if(!lstatSync(root).isDirectory())return fail('workspace must be a directory');
  const server=fileURLToPath(new URL('./mcp.ts',import.meta.url));
  const command=[process.execPath,server,'--workspace',root];
  const name='agentcarry-preview';
  let path:string,entry:Config,keys:string[];
  if(client==='gemini'){
    const folder=join(root,'.gemini'),s=stat(folder);
    if(s&&(s.isSymbolicLink()||!s.isDirectory()))return fail('unsafe Gemini config directory');
    path=join(folder,'settings.json');entry={command:command[0],args:command.slice(1)};keys=['mcpServers',name];
  }else{
    // Do not silently ignore JSONC or an alternate config that may take precedence.
    if(stat(join(root,'opencode.jsonc')))return fail('opencode.jsonc is present; JSONC setup preview is not implemented');
    path=join(root,'opencode.json');entry={type:'local',command};keys=['mcp','servers',name];
  }
  const s=stat(path);let existing:Config={},raw:Buffer|null=null;
  if(s){
    if(s.isSymbolicLink()||!s.isFile()||s.nlink!==1)return fail('unsafe client config file');
    if(s.size>65536)return fail('client config exceeds 64 KiB preview limit');
    let parsed:unknown;
    try{raw=readFileSync(path);if(raw.length>65536)return fail('client config exceeds 64 KiB preview limit');if(!isUtf8(raw))return fail('client config must be UTF-8 JSON');parsed=JSON.parse(raw.toString('utf8'));}catch{return fail('client config must be strict JSON; no existing contents returned');}
    existing=configObject(parsed,'client config');validateNumbers(existing);
  }
  if(client==='opencode'&&Object.hasOwn(existing,'mcp')){
    const mcp=configObject(existing.mcp,'mcp');
    if(Object.hasOwn(mcp,name))return fail('legacy MCP entry conflicts with the v2 entry path; inspect configuration manually');
  }
  let parent=existing;
  for(const key of keys.slice(0,-1)){
    parent=Object.hasOwn(parent,key)?configObject(parent[key],key):{};
  }
  const present=Object.hasOwn(parent,name);
  const status=present?(canonical(parent[name])===canonical(entry)?'already_configured':'conflict'):'preview';
  const revision=raw===null?'missing':createHash('sha256').update(raw).digest('hex');
  const plan_revision=createHash('sha256').update(canonical({root,client,entry,keys,revision})).digest('hex');
  return {status,client,root,path,entry,keys,existing,raw,revision,plan_revision};
}

export function previewSetup(workspace:string,client:string) {
  const s=inspectSetup(workspace,client);
  return {status:s.status,client:s.client,workspace:s.root,config_path:s.path,operation:s.status==='preview'?(s.raw?'add_entry':'create_config'):'none',
    entry_path:s.keys,proposed_entry:s.entry,config_revision:s.revision,plan_revision:s.plan_revision,changes_applied:false,
    scope:'project',capture:'manual',initialization:'not_checked',
    warnings:['preview_only_no_files_written','existing_settings_not_included','memory_tools_require_an_initialized_local_store','global_and_environment_config_not_assessed','client_version_not_checked']};
}
