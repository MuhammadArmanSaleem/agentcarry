// Research harness only. Synthetic fixtures, not a product storage API.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, openSync, closeSync, writeSync, fsyncSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

function next(state, expected, token, payload) {
  if (state.tokens[token]) {
    if (state.tokens[token].payload !== JSON.stringify(payload)) throw Error('token reuse');
    return null;
  }
  if (state.revision !== expected) throw Error('revision conflict');
  return { revision: expected + 1, tokens: { ...state.tokens, [token]: { payload: JSON.stringify(payload) } },
    task: { id: 'task', ...payload }, evidence: { task_id: 'task', outcome: 'not_run', origin: 'agent_reported' },
    checkpoint: { task_id: 'task', revision: expected + 1 } };
}
export const empty = () => ({ revision: 0, tokens: {} });

export function sqliteRead(root) {
  const db = sqliteOpen(root);
  try { const row = db.prepare('SELECT body FROM bundle WHERE id=1').get(); return row ? JSON.parse(row.body) : empty(); }
  finally { db.close(); }
}
function sqliteOpen(root) {
  mkdirSync(root, { recursive: true });
  const db = new DatabaseSync(join(root, 'store.sqlite'));
  db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS bundle(id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL);');
  return db;
}
export function sqliteWrite(root, expected, token, payload, stage = () => {}) {
  const db = sqliteOpen(root);
  try {
    db.exec('BEGIN IMMEDIATE');
    const row = db.prepare('SELECT body FROM bundle WHERE id=1').get();
    const value = next(row ? JSON.parse(row.body) : empty(), expected, token, payload);
    if (value) db.prepare('INSERT OR REPLACE INTO bundle VALUES(1,?)').run(JSON.stringify(value));
    stage('before_commit'); db.exec('COMMIT'); stage('after_commit'); return value;
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
  finally { db.close(); }
}

// Append-only whole-bundle journal: one committed newline-terminated record.
// A dead process leaves a lock file; fail closed, never guess stale ownership.
export function journalRead(root) {
  const path = join(root, 'journal.jsonl');
  if (!existsSync(path)) return empty();
  const lines = readFileSync(path, 'utf8').split('\n'); lines.pop();
  return lines.length ? JSON.parse(lines.at(-1)) : empty();
}
export function journalWrite(root, expected, token, payload, stage = () => {}) {
  mkdirSync(root, { recursive: true });
  const lock = join(root, 'writer.lock');
  const lockFd = openSync(lock, 'wx');
  try {
    const value = next(journalRead(root), expected, token, payload);
    if (!value) return null;
    const path = join(root, 'journal.jsonl');
    // A torn tail is not silently repaired: this prototype requires recovery.
    if (existsSync(path)) { const text = readFileSync(path, 'utf8'); if (text && !text.endsWith('\n')) throw Error('torn journal; recovery required'); }
    const fd = openSync(path, 'a');
    try {
      const bytes = Buffer.from(JSON.stringify(value) + '\n');
      const split = Math.floor(bytes.length / 2);
      writeSync(fd, bytes.subarray(0, split)); stage('partial_append');
      writeSync(fd, bytes.subarray(split)); fsyncSync(fd); stage('after_commit');
    } finally { closeSync(fd); }
    return value;
  } finally { closeSync(lockFd); rmSync(lock); }
}
