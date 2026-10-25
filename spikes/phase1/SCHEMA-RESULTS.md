# Normalized storage experiment

Research only; SQLite remains proposed and Phase 1 incomplete. This is not the product schema or a supported storage API.

## Reproduce

Run `npm run test:spike` with Node 24.22.1. It now runs 33 tests: twelve original-store, thirteen normalized-store and eight retrieval tests. This report's initial result describes the earlier 21-test storage subset. No package install, account, model key or network call is needed for the tests.

Observed here on 2026-10-26: Linux x64, Node 24.22.1, SQLite 3.53.4; 21 tests passed, zero failed. Synthetic temporary databases are removed after tests. This result applies to this revision's test files and does not certify installed coding clients.

## What the new experiment exercises

- Separate project, task, evidence and draft tables; composite foreign keys reject cross-project references.
- Expected-revision task transitions and evidence insertion commit together. Two processes racing at revision zero produce one winner. Task completion remains separate from check success.
- Reported evidence accepts only agent_reported/unreviewed; invalid outcomes and unexpected fields are rejected. Reopening a completed/cancelled task needs a reason.
- Version 1 to 2 migration makes a readable SQLite backup, adds and populates an FTS5 draft index, validates integrity and foreign keys, and rolls back on injected failure. Repeating a successful migration is a no-op. Unknown versions reject before migration mutation.
- Deleting evidence cascades to dependent draft bodies and their search entries in one transaction. Injected failure and writer termination before commit restore all three. Another project's records survive. A subsequent deletion succeeds.

## Evidence kept separate

The original ten-test Linux run is documented in [README.md](README.md). A separate user-supplied Windows screenshot showed ten passing original tests; exact Node/SQLite versions were not established from that screenshot. Later user-supplied Windows screenshots show 21/21 storage tests passing at commit 93b3f6d and separately identify Node 24.22.1 / SQLite 3.53.4. These screenshots are separate evidence from local Linux execution; no Windows test was run by this session.

A user-reported manual Gemini CLI to OpenCode handoff inspection identified inaccurate phase/status and file descriptions in a private handoff. That inspection did not rerun tests. It is manual-baseline evidence, not proof of an adapter, MCP integration or automatic capture. Client versions were not recorded.

## Limits and remaining gates

The fixture omits checkpoints, events, canonical payload hashing, idempotency, UUID/timestamp validation, quotas, workspace path approval, imports and full export. Transition/review rules are experimental, not a finalized public contract. The database connection is an internal trusted harness, not an authorization boundary.

Migration tests cover exceptions and retry, not process death during backup/migration. Backups contain private content and are outside deletion; use a new private backup destination for each attempt. A targeted two-connection test now commits after backup and before migration, verifies rejection without losing that write, then retries successfully. Existing backup destinations (including the source path) now reject before backup. A new destination is reserved exclusively with mode 0600 where supported; callers must own its containing directory and exclusively use the source connection during migration. This does not defend against an attacker replacing files in that directory. Failed backups may leave partial files. Windows ACL handling, backup retention and cleanup remain unimplemented.

Deletion proves logical query removal only. Database free pages, FTS shadow storage, rollback journals/WAL, filesystem snapshots and backups may retain bytes. No secure-erasure or physical power-loss claim is made. The normalized experiment uses SQLite's default journal settings; the original WAL/FULL tests remain separate.

A later [synthetic retrieval experiment](RETRIEVAL-RESULTS.md) adds limited regression evidence. TypeScript packaging, product CLI/MCP and live-client acceptance remain open. Next: close these gates in focused changes, then build the local vertical slice.

Implementation references: [Node SQLite API](https://nodejs.org/docs/latest-v24.x/api/sqlite.html), [SQLite PRAGMA documentation](https://www.sqlite.org/pragma.html), [SQLite foreign keys](https://www.sqlite.org/foreignkeys.html).
