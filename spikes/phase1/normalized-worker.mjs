import { randomUUID } from 'node:crypto';
import { open, report, deleteEvidence } from './normalized.mjs';
const [path, operation, project, task, evidenceId] = process.argv.slice(2);
const db = open(path);
try {
  if (operation === 'delete') {
    deleteEvidence(db,project,evidenceId,() => {
      process.send({stage:'before_commit'});
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0);
    });
  } else {
    report(db,project,task,0,{id:randomUUID(),origin:'agent_reported',review:'unreviewed',outcome:'not_run',body:'race'},'in_progress');
  }
} catch (error) { process.send?.({error:error.message}); process.exitCode=2; }
finally { db.close(); process.disconnect?.(); }
