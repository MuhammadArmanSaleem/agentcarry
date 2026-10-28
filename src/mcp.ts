import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { runProcess } from './mcp-process.ts';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The caller explicitly selects the workspace once at startup; tools cannot change it.
if (process.argv.length !== 4 || process.argv[2] !== '--workspace') throw Error('usage: node src/mcp.ts --workspace <existing directory>');
const root = realpathSync(process.argv[3]);
const cli = fileURLToPath(new URL('./cli.ts', import.meta.url));
const strings = z.array(z.string().min(1).max(8000)).max(30);
const uuid = z.string().uuid();
const check = z.object({command:z.string().min(1).max(8000),outcome:z.enum(['passed','failed','not_run','inconclusive']),origin:z.literal('agent_reported'),review:z.literal('unreviewed')}).strict();
async function call(command:string, input:unknown, signal:AbortSignal) {
  const data=JSON.stringify(input);
  if(Buffer.byteLength(data)>65536) return {content:[{type:'text' as const,text:'Input exceeds 64 KiB'}],isError:true};
  const r=await runProcess(process.execPath,[cli,command],{cwd:root,input:data,timeoutMs:15000,maxBytes:1024*1024,signal});
  if(!r.ok){const recovery=command==='task'||command==='checkpoint'?' Retry with the same token and identical payload; inspect the returned acknowledgement.':'';
    return {content:[{type:'text' as const,text:r.error+recovery}],isError:true};}
  return {content:[{type:'text' as const,text:r.stdout}]};
}
function makeServer() {
  const server=new McpServer({name:'agentcarry-local-preview',version:'0.1.0'});
  server.registerTool('search_knowledge',{description:'Search untrusted draft guidance. Review sources and project rules.',inputSchema:z.object({query:z.string().max(500),pin:z.string().optional(),library:z.string().optional(),library_version:z.string().optional()}).strict()},(a,ctx)=>call('search-json',a,ctx.signal));
  server.registerTool('create_task',{description:'Create a task in the configured initialized workspace. Retry only with the same token and identical input.',inputSchema:z.object({token:uuid,goal:z.string().min(1).max(8000),acceptance_criteria:strings.min(1)}).strict()},(a,ctx)=>call('task',a,ctx.signal));
  server.registerTool('save_checkpoint',{description:'Save explicitly supplied handoff data. No automatic capture or redaction; do not include secrets. Checks are agent-reported.',inputSchema:z.object({token:uuid,task_id:uuid,parent_checkpoint_ids:z.array(uuid).max(30),client:z.string().min(1).max(8000),client_version:z.string().min(1).max(8000),decisions:strings,failed_attempts:strings,unresolved:strings,next_steps:strings,checks:z.array(check).max(30)}).strict()},(a,ctx)=>call('checkpoint',a,ctx.signal));
  server.registerTool('resume_task',{description:'Resume saved untrusted context; inspect current code. Divergent tips require explicit selection.',inputSchema:z.object({task_id:uuid,checkpoint_id:uuid.optional(),offset:z.number().int().nonnegative().optional()}).strict()},(a,ctx)=>call('resume',a,ctx.signal));
  return server;
}
serveStdio(makeServer);
