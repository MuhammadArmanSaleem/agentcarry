import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

const cli=fileURLToPath(new URL('../src/cli.ts',import.meta.url));
const directory=mkdtempSync(join(tmpdir(),'agentcarry-demo-'));
function run(args,input){
  const result=spawnSync(process.execPath,[cli,...args],{cwd:directory,input:input?JSON.stringify(input):undefined,encoding:'utf8'});
  if(result.status!==0)throw Error(result.stderr||result.error?.message||'CLI failed');
  return JSON.parse(result.stdout);
}
try {
  run(['init','--new','--max-bytes','1048576','--retention-days','30']);
  const task=run(['task'],{token:randomUUID(),goal:'Build an accessible synthetic form',acceptance_criteria:['Keyboard navigation works']});
  const checkpoint=run(['checkpoint'],{
    token:randomUUID(),task_id:task.id,parent_checkpoint_ids:[],client:'manual-demo',client_version:'1',
    decisions:['Use semantic form controls'],failed_attempts:['Mouse-only navigation did not meet acceptance criteria'],
    unresolved:['Review layout'],next_steps:['Test keyboard submission'],
    checks:[{command:'keyboard test',outcome:'not_run',origin:'agent_reported',review:'unreviewed'}],
  });
  const resumed=run(['resume'],{task_id:task.id});
  assert.equal(resumed.checkpoint.id,checkpoint.id);
  assert.equal(resumed.checkpoint.checks[0].outcome,'not_run');
  assert.equal(resumed.checkpoint.checks[0].origin,'agent_reported');
  process.stdout.write(JSON.stringify({demo:'passed',directory,task_id:task.id,resumed,
    capture:'manual CLI only; no coding-agent adapter was exercised'},null,2)+'\n');
}catch(error){process.stderr.write(JSON.stringify({error:error.message,directory})+'\n');process.exitCode=1;}
