import { randomUUID } from 'node:crypto';
import { LocalStore } from '../src/local.ts';
const [root,operation,task_id]=process.argv.slice(2),store=new LocalStore(root);
try{store.update({token:randomUUID(),task_id,expected_revision:0,state:'in_progress',blockers:[]},()=>{
  if(operation==='kill'){process.send({stage:'before_commit'});Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0);}
});}catch(e){process.stderr.write(e.message);process.exitCode=2;}finally{store.close();process.disconnect?.();}
