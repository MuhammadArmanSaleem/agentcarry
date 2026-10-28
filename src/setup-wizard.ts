import { lstatSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import type { Readable, Writable } from 'node:stream';
import { LocalStore, initialize, fail } from './local.ts';
import { previewSetup } from './setup.ts';
import { applySetup, rollbackSetup, forgetSetup, listSetupOperations } from './setup-apply.ts';

export type SetupUI = { ask: (prompt:string)=>Promise<string|null>; write:(text:string)=>void };
const MiB=1024*1024;
class Cancelled extends Error {}
async function answer(ui:SetupUI,prompt:string){
 const value=await ui.ask(prompt);
 if(value===null||value.trim().toLowerCase()==='q')throw new Cancelled();
 return value.trim();
}
async function number(ui:SetupUI,prompt:string,min:number,max:number):Promise<number>{
 for(;;){const value=await answer(ui,prompt);if(/^\d+$/.test(value)){const n=Number(value);if(Number.isSafeInteger(n)&&n>=min&&n<=max)return n;}
  ui.write(`Enter a whole number from ${min} to ${max}, or q to cancel.\n`);}
}
async function confirm(ui:SetupUI,prompt:string){return (await answer(ui,prompt+' Type yes to confirm: ')).toLowerCase()==='yes';}
function exists(path:string){try{return lstatSync(path);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw error;}}
function checkStore(root:string){
 const directory=exists(join(root,'.agentcarry'));
 if(directory&&(directory.isSymbolicLink()||!directory.isDirectory()))return fail('unsafe store directory');
 if(!exists(join(root,'.agentcarry','local.sqlite')))return false;
 const store=new LocalStore(root);store.close();return true;
}

// Uses the same validated setup/core functions as the machine CLI, with no model calls.
export async function runSetupWizard(workspace:string,ui:SetupUI){
 const root=realpathSync(workspace);let initialized=false;
 ui.write(`AgentCarry local setup preview\nWorkspace: ${JSON.stringify(root)}\nCloud setup is not available yet. Capture remains manual.\nUse a disposable workspace and synthetic data during this preview.\nType q at any prompt to cancel. Close coding clients/editors before configuration changes.\n`);
 try{
  const action=await number(ui,'1 Configure a client | 2 Undo setup | 3 Forget a backup | 4 Exit: ',1,4);
  if(action===4)return {status:'cancelled',initialized};
  if(action!==1){
   const operations=listSetupOperations(root).filter(r=>action===2?r.phase==='active'||r.phase==='rollback_requested':r.phase==='rolled_back'||r.phase==='forgotten');
   if(!operations.length){ui.write('No eligible setup operations. No configuration changed.\n');return {status:'no_operations',initialized};}
   operations.forEach((r,i)=>ui.write(`${i+1}. ${r.client} | ${r.phase} | ${r.id}\n`));
   const operation=operations[await number(ui,'Choose the operation number: ',1,operations.length)-1];
   ui.write(`Selected ${operation.client} operation ${operation.id}.\n`);
   const description=action===2?'Remove only the matching AgentCarry entry, preserving unrelated later settings?':'Forget this operation\'s saved config body and temporary copies? Other backups and physical remnants are not erased.';
   if(!await confirm(ui,description))return {status:'cancelled',initialized};
   const result=action===2?rollbackSetup(root,operation.id):forgetSetup(root,operation.id);
   ui.write(action===2?'Setup undone. Backup retained; choose Forget a backup to remove its body.\n':'Saved backup body forgotten. Physical erasure is not guaranteed.\n');
   return {...result,initialized};
  }
  const client=(await number(ui,'Choose client: 1 Gemini CLI | 2 OpenCode v2: ',1,2))===1?'gemini':'opencode';
  const plan=previewSetup(root,client);
  ui.write(`Client: ${client}\nConfig: ${JSON.stringify(plan.config_path)}\nProposed entry (unrelated settings are hidden):\n${JSON.stringify(plan.proposed_entry,null,2)}\n`);
  if(plan.status==='conflict'){ui.write('An existing AgentCarry entry differs. No overwrite or initialization performed.\n');return {status:'conflict',initialized};}
  if(plan.status==='already_configured'){ui.write('This entry already matches. No changes or new rollback ownership claimed. Store initialization and connectivity are not established by this match.\n');return {status:'already_configured',initialized};}
  ui.write('Only the project-local AgentCarry entry will be added. Existing unrelated values survive; JSON formatting may change.\nExact private backups can contain credentials and are not encrypted. Filesystem sync/backup software remains outside AgentCarry control.\n');
  const budget=await number(ui,'Setup backup-history budget in MiB (1-16, no default): ',1,16);
  if(!checkStore(root)){
   const quota=await number(ui,'Local memory quota in MiB (1-16, no default): ',1,16);
   const days=await number(ui,'Memory retention in days (1-3650, explicit pruning; no automatic deletion): ',1,3650);
   ui.write(`Initialize private .agentcarry storage: ${quota} MiB memory quota, ${days} days retention. No transcript ingestion or upload. This store remains if client setup is declined or fails.\n`);
   if(!await confirm(ui,'Initialize this workspace?'))return {status:'cancelled',initialized};
   initialize(root,{max_bytes:quota*MiB,retention_days:days});initialized=true;
   ui.write('Local store initialized.\n');
  }
  ui.write(`Setup history budget: ${budget} MiB, separate from memory quota. Connection, client version and trust have not been checked.\n`);
  if(!await confirm(ui,'Apply this preview to the selected config?'))return {status:'cancelled',initialized};
  const token=randomUUID();
  ui.write(`Operation: ${token}\nIf interrupted or an error occurs, inspect local setup history before retrying. Run setup again and choose Undo setup for a saved operation; do not assume an error means no change. Stale locks require explicit advanced recovery.\n`);
  const result=applySetup(root,{token,client,expected_revision:plan.config_revision,expected_plan:plan.plan_revision,max_backup_bytes:budget*MiB});
  ui.write(`Configuration result: ${result.status}. Connectivity has not been checked.\nRun ${client==='gemini'?'gemini':'opencode'} mcp list from this workspace. If absent, inspect the config and retry the list before editing.\nFor Gemini, an untrusted folder may disable MCP; review project trust in Gemini yourself. AgentCarry does not change trust.\nRun setup again and choose Undo setup to remove this operation's entry, then Forget a backup to clean its saved body.\n`);
  return {...result,initialized,connectivity:'not_checked',capture:'manual'};
 }catch(error){if(!(error instanceof Cancelled))throw error;ui.write(`Cancelled. ${initialized?'The explicitly initialized local store remains.':'Previously completed operations, if any, remain unchanged.'}\n`);return {status:'cancelled',initialized};}
}

// EOF/Ctrl+C abort an unanswered question, rather than leaving it pending forever.
export function terminalSetupUI(input:Readable,output:Writable){
 const terminal=createInterface({input,output}),abort=new AbortController();
 terminal.on('close',()=>abort.abort());terminal.on('SIGINT',()=>terminal.close());
 return {
  write:(text:string)=>{output.write(text);},
  ask:async(prompt:string):Promise<string|null>=>{
   if(abort.signal.aborted)return null;
   try{return await terminal.question(prompt,{signal:abort.signal});}catch(error){if(abort.signal.aborted)return null;throw error;}
  },
  close:()=>terminal.close()
 };
}
