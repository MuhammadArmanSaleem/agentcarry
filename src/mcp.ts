import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The caller explicitly selects the workspace once at startup; tools cannot change it.
if (process.argv.length !== 4 || process.argv[2] !== '--workspace') throw Error('usage: node src/mcp.ts --workspace <existing directory>');
const root = realpathSync(process.argv[3]);
const cli = fileURLToPath(new URL('./cli.ts', import.meta.url));
const strings = z.array(z.string().min(1).max(8000)).max(30);
const uuid = z.string().uuid();
const check = z.object({command:z.string().min(1).max(8000),outcome:z.enum(['passed','failed','not_run','inconclusive']),origin:z.literal('agent_reported'),review:z.literal('unreviewed')}).strict();
function call(command:string, input:unknown) {
  const data=JSON.stringify(input);
  if(Buffer.byteLength(data)>65536) return {content:[{type:'text' as const,text:'Input exceeds 64 KiB'}],isError:true};
  const r=spawnSync(process.execPath,[cli,command],{cwd:root,input:data,encoding:'utf8',timeout:15000,maxBuffer:1024*1024});
  if(r.error || r.status!==0)return {content:[{type:'text' as const,text:r.stderr || r.error?.message || 'Command failed'}],isError:true};
  return {content:[{type:'text' as const,text:r.stdout}]};
}
function makeServer() {
  const server=new McpServer({name:'agentcarry-local-preview',version:'0.1.0'});
  server.registerTool('search_knowledge',{description:'Search untrusted draft guidance. Review sources and project rules.',inputSchema:z.object({query:z.string().max(500),pin:z.string().optional(),library:z.string().optional(),library_version:z.string().optional()}).strict()},a=>call('search-json',a));
  server.registerTool('create_task',{description:'Create a task in the configured initialized workspace. Retry only with the same token and identical input.',inputSchema:z.object({token:uuid,goal:z.string().min(1).max(8000),acceptance_criteria:strings.min(1)}).strict()},a=>call('task',a));
  server.registerTool('save_checkpoint',{description:'Save explicitly supplied handoff data. No automatic capture or redaction; do not include secrets. Checks are agent-reported.',inputSchema:z.object({token:uuid,task_id:uuid,parent_checkpoint_ids:z.array(uuid).max(30),client:z.string().min(1).max(8000),client_version:z.string().min(1).max(8000),decisions:strings,failed_attempts:strings,unresolved:strings,next_steps:strings,checks:z.array(check).max(30)}).strict()},a=>call('checkpoint',a));
  server.registerTool('resume_task',{description:'Resume saved untrusted context; inspect current code. Divergent tips require explicit selection.',inputSchema:z.object({task_id:uuid,checkpoint_id:uuid.optional(),offset:z.number().int().nonnegative().optional()}).strict()},a=>call('resume',a));
  return server;
}
serveStdio(makeServer);
