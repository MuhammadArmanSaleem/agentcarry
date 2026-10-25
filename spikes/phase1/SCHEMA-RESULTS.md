# Normalized storage experiment

Research only; SQLite remains proposed and Phase 1 incomplete. This is not the product schema or a supported storage API.

## Reproduce

Run `npm run test:spike` with Node 24.22.1. It runs the original ten storage tests and eleven normalized-schema tests. No package install, account, model key or network call is needed for the tests.

Observed here on 2026-10-26: Linux x64, Node 24.22.1, SQLite 3.53.4; 21 tests passed, zero failed. Synthetic temporary databases are removed after tests. This result applies to this revision's test files and does not certify installed coding clients.

## What the new experiment exercises

- Separate project, task, evidence and draft tables; composite foreign keys reject cross-project references.
- Expected-revision task transitions and evidence insertion commit together. Two processes racing at revision zero produce one winner. Task completion remains separate from check success.
- Reported evidence accepts only agent_reported/unreviewed; invalid outcomes and unexpected fields are rejected. Reopening a completed/cancelled task needs a reason.
- Version 1 to 2 migration makes a readable SQLite backup, adds and populates an FTS5 draft index, validates integrity and foreign keys, and rolls back on injected failure. Repeating a successful migration is a no-op. Unknown versions reject before migration mutation.
- Deleting evidence cascades to dependent draft bodies and their search entries in one transaction. Injected failure and writer termination before commit restore all three. Another project's records survive. A subsequent deletion succeeds.

## Evidence kept separate

The original ten-test Linux run is documented in [README.md](README.md). A separate user-supplied Windows screenshot showed ten passing original tests; exact Node/SQLite versions were not established from that screenshot. The eleven new tests have not been run on Windows.

A user-reported manual Gemini CLI to OpenCode handoff inspection identified inaccurate phase/status and file descriptions in a private handoff. That inspection did not rerun tests. It is manual-baseline evidence, not proof of an adapter, MCP integration or automatic capture. Client versions were not recorded.

## Limits and remaining gates

The fixture omits checkpoints, events, canonical payload hashing, idempotency, UUID/timestamp validation, quotas, workspace path approval, imports and full export. Transition/review rules are experimental, not a finalized public contract. The database connection is an internal trusted harness, not an authorization boundary.

Migration tests cover exceptions and retry, not process death during backup/migration. Backups contain private content and are outside deletion; use a new private backup destination for each attempt. Concurrent writes during backup cause migration rejection when the connection's data_version changes; this guard still needs a targeted race test. Backup permissions, retention and cleanup are not implemented.

Deletion proves logical query removal only. Database free pages, FTS shadow storage, rollback journals/WAL, filesystem snapshots and backups may retain bytes. No secure-erasure or physical power-loss claim is made. The normalized experiment uses SQLite's default journal settings; the original WAL/FULL tests remain separate.

No representative retrieval benchmark, TypeScript packaging result, CLI/MCP or live-client acceptance run is included. Next: close these gates in focused changes, then build the local vertical slice.

Implementation references: [Node SQLite API](https://nodejs.org/docs/latest-v24.x/api/sqlite.html), [SQLite PRAGMA documentation](https://www.sqlite.org/pragma.html), [SQLite foreign keys](https://www.sqlite.org/foreignkeys.html).
