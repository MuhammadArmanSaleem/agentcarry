import { lstatSync,readFileSync,realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonical,fail } from './local.ts';

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
// Inspect only the selected client's project config. Never return existing values:
// those may contain credentials. Preview has no write or database operations.
export function previewSetup(workspace:string,client:string) {
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
  const s=stat(path);let existing:Config={};
  if(s){
    if(s.isSymbolicLink()||!s.isFile()||s.nlink!==1)return fail('unsafe client config file');
    if(s.size>65536)return fail('client config exceeds 64 KiB preview limit');
    let parsed:unknown;
    try{parsed=JSON.parse(readFileSync(path,'utf8'));}catch{return fail('client config must be strict JSON; no existing contents returned');}
    existing=configObject(parsed,'client config');
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
  return {status,client,workspace:root,config_path:path,operation:status==='preview'?(s?'add_entry':'create_config'):'none',
    entry_path:keys,proposed_entry:entry,changes_applied:false,
    scope:'project',capture:'manual',initialization:'not_checked',
    warnings:['preview_only_no_files_written','existing_settings_not_included','memory_tools_require_an_initialized_local_store','global_and_environment_config_not_assessed','client_version_not_checked']};
}
