import { sqliteWrite, journalWrite } from './storage.mjs';
const [kind, root, expected, token, pauseAt = 'none', text = 'fixture'] = process.argv.slice(2);
function stage(name) {
  if (name !== pauseAt) return;
  process.send?.({ stage: name });
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
}
try {
  (kind === 'sqlite' ? sqliteWrite : journalWrite)(root, Number(expected), token, { text }, stage);
  process.send?.({ result: 'committed' });
} catch (error) { process.send?.({ result: 'rejected', message: error.message }); process.exitCode = 2; }
process.disconnect?.();
