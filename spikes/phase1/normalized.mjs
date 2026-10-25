// Isolated feasibility experiment. Not a product API or import format.
import { DatabaseSync, backup } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

const v1 = `
CREATE TABLE projects(id TEXT PRIMARY KEY) STRICT;
CREATE TABLE tasks(
 project_id TEXT NOT NULL REFERENCES projects(id), id TEXT NOT NULL,
 goal TEXT NOT NULL, revision INTEGER NOT NULL CHECK(revision >= 0),
 state TEXT NOT NULL CHECK(state IN ('pending','in_progress','blocked','completed','cancelled')),
 PRIMARY KEY(project_id,id)
) STRICT;
CREATE TABLE evidence(
 project_id TEXT NOT NULL, id TEXT NOT NULL, task_id TEXT NOT NULL,
 origin TEXT NOT NULL CHECK(origin='agent_reported'),
 outcome TEXT NOT NULL CHECK(outcome IN ('passed','failed','not_run','inconclusive')),
 review TEXT NOT NULL CHECK(review='unreviewed'), body TEXT NOT NULL,
 PRIMARY KEY(project_id,id),
 FOREIGN KEY(project_id,task_id) REFERENCES tasks(project_id,id) ON DELETE CASCADE
) STRICT;
CREATE TABLE drafts(
 project_id TEXT NOT NULL, id TEXT NOT NULL, evidence_id TEXT NOT NULL, body TEXT NOT NULL,
 PRIMARY KEY(project_id,id),
 FOREIGN KEY(project_id,evidence_id) REFERENCES evidence(project_id,id) ON DELETE CASCADE
) STRICT;
PRAGMA user_version=1;`;

export function open(path) {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  return db;
}

export function transaction(db, action) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = action(); db.exec('COMMIT'); return result; }
  catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

export function initialize(db) {
  transaction(db, () => {
    if (db.prepare('PRAGMA user_version').get().user_version !== 0 ||
        db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get()) {
      throw Error('initialization requires empty database');
    }
    db.exec(v1);
  });
}

// Version 2 adds a rebuildable derived search index. Backup remains private.
// data_version detects another connection committing while the backup is made.
export async function migrate(db, backupPath, inject = () => {}) {
  const version = db.prepare('PRAGMA user_version').get().user_version;
  if (version === 2) return { migrated: false };
  if (version !== 1) throw Error('unsupported schema version');
  const observed = db.prepare('PRAGMA data_version').get().data_version;
  await backup(db, backupPath);
  transaction(db, () => {
    if (db.prepare('PRAGMA user_version').get().user_version !== 1 ||
        db.prepare('PRAGMA data_version').get().data_version !== observed) {
      throw Error('database changed during backup; retry with a new backup path');
    }
    db.exec(`CREATE VIRTUAL TABLE draft_search USING fts5(project_id UNINDEXED, draft_id UNINDEXED, body);
      INSERT INTO draft_search SELECT project_id,id,body FROM drafts;
      CREATE TRIGGER draft_insert AFTER INSERT ON drafts BEGIN
        INSERT INTO draft_search VALUES(new.project_id,new.id,new.body); END;
      CREATE TRIGGER draft_delete AFTER DELETE ON drafts BEGIN
        DELETE FROM draft_search WHERE project_id=old.project_id AND draft_id=old.id; END;
      CREATE TRIGGER draft_update AFTER UPDATE ON drafts BEGIN
        DELETE FROM draft_search WHERE project_id=old.project_id AND draft_id=old.id;
        INSERT INTO draft_search VALUES(new.project_id,new.id,new.body); END;
      PRAGMA user_version=2;`);
    inject();
    if (db.prepare('PRAGMA foreign_key_check').get() || db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') {
      throw Error('migration validation failed');
    }
  });
  return { migrated: true, backupPath };
}

const transitions = {
  pending: ['in_progress', 'blocked', 'cancelled'],
  in_progress: ['blocked', 'completed', 'cancelled'],
  blocked: ['in_progress', 'cancelled'], completed: ['in_progress'], cancelled: ['in_progress'],
};

export function report(db, project, task, expected, evidence, nextState, reopenReason = '') {
  const keys = ['id', 'origin', 'outcome', 'review', 'body'];
  if (!evidence || Object.keys(evidence).some(k => !keys.includes(k)) ||
      keys.some(k => typeof evidence[k] !== 'string') ||
      evidence.origin !== 'agent_reported' || evidence.review !== 'unreviewed' ||
      !['passed','failed','not_run','inconclusive'].includes(evidence.outcome) ||
      !Number.isSafeInteger(expected) || expected < 0) throw Error('invalid reported evidence');
  return transaction(db, () => {
    const current = db.prepare('SELECT state,revision FROM tasks WHERE project_id=? AND id=?').get(project, task);
    if (!current || current.revision !== expected) throw Error('revision conflict or missing scoped task');
    if (!transitions[current.state].includes(nextState) ||
        (['completed','cancelled'].includes(current.state) && !reopenReason.trim())) throw Error('invalid transition');
    db.prepare('INSERT INTO evidence VALUES(?,?,?,?,?,?,?)')
      .run(project, evidence.id, task, evidence.origin, evidence.outcome, evidence.review, evidence.body);
    db.prepare('UPDATE tasks SET state=?,revision=revision+1 WHERE project_id=? AND id=?')
      .run(nextState, project, task);
    return { revision: expected + 1, evidence_id: evidence.id };
  });
}

export function deleteEvidence(db, project, id, inject = () => {}) {
  return transaction(db, () => {
    const drafts = db.prepare('SELECT id FROM drafts WHERE project_id=? AND evidence_id=?').all(project,id).map(r => r.id);
    const removed = db.prepare('DELETE FROM evidence WHERE project_id=? AND id=?').run(project,id).changes;
    inject();
    return { removed, deleted_draft_ids: drafts, external_backups: 'not deleted' };
  });
}

// Synthetic test fixture only; UUID generation is not a full identity implementation.
export function seed(db, body = 'synthetic lesson') {
  const project = randomUUID(), task = randomUUID(), evidence = randomUUID(), draft = randomUUID();
  transaction(db, () => {
    db.prepare('INSERT INTO projects VALUES(?)').run(project);
    db.prepare('INSERT INTO tasks VALUES(?,?,?,0,?)').run(project, task, 'synthetic goal', 'pending');
    db.prepare('INSERT INTO evidence VALUES(?,?,?,?,?,?,?)').run(project,evidence,task,'agent_reported','not_run','unreviewed',body);
    db.prepare('INSERT INTO drafts VALUES(?,?,?,?)').run(project,draft,evidence,body);
  });
  return { project, task, evidence, draft };
}
