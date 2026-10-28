import { spawn } from 'node:child_process';

// Run one fixed CLI invocation without blocking the MCP event loop. A timeout,
// cancellation, or lost response cannot establish whether a write committed.
export function runProcess(executable:string, args:string[], options:{cwd:string,input:string,timeoutMs:number,maxBytes:number,signal?:AbortSignal}):Promise<{ok:boolean,stdout:string,error:string}> {
  // An already cancelled request must never start a process that might write.
  if(options.signal?.aborted)return Promise.resolve({ok:false,stdout:'',error:'Request cancelled before execution.'});
  return new Promise(resolve=>{
    const child=spawn(executable,args,{cwd:options.cwd,stdio:['pipe','pipe','pipe'],windowsHide:true});
    const stdout:Buffer[]=[],stderr:Buffer[]=[];let size=0,reason='',settled=false;
    let forceTimer:ReturnType<typeof setTimeout>|undefined;
    const stop=(message:string)=>{
      if(reason)return;
      reason=message;child.stdin.destroy();child.kill();
      // SIGTERM can be handled/ignored on POSIX. Bound direct-child termination.
      forceTimer=setTimeout(()=>child.kill('SIGKILL'),250);
    };
    const abort=()=>stop('Request cancelled; the write outcome may be unknown.');
    const timer=setTimeout(()=>stop('Command timed out; the write outcome may be unknown.'),options.timeoutMs);
    const collect=(target:Buffer[],chunk:Buffer)=>{size+=chunk.length;if(size>options.maxBytes){stop('Command output exceeded the limit; the write outcome may be unknown.');return;}target.push(chunk);};
    child.stdout.on('data',(chunk:Buffer)=>collect(stdout,chunk));child.stderr.on('data',(chunk:Buffer)=>collect(stderr,chunk));
    child.stdin.on('error',()=>{});
    child.on('error',error=>{if(!reason)reason=error.message;});
    child.on('close',code=>{if(settled)return;settled=true;clearTimeout(timer);clearTimeout(forceTimer);options.signal?.removeEventListener('abort',abort);
      resolve({ok:!reason&&code===0,stdout:Buffer.concat(stdout).toString('utf8'),error:reason||Buffer.concat(stderr).toString('utf8')||(code===0?'':'Command failed')});});
    options.signal?.addEventListener('abort',abort,{once:true});
    if(options.signal?.aborted)abort();
    if(!reason)child.stdin.end(options.input);
  });
}
