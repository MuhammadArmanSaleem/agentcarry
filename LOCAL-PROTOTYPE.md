# Local continuity prototype

Development preview, not an installable release. P1 and P2 acceptance gates remain incomplete. The local runtime includes an explicit search of one bundled draft; knowledge installation, MCP and coding-agent adapters follow separately. See [KNOWLEDGE-PREVIEW.md](KNOWLEDGE-PREVIEW.md). No automatic consultation/capture is implemented.

## Try it on Windows

Use Node 24.22.1 and Git for the complete test suite. No npm install, model key or account is needed.

```
npm run test:local
npm run demo:local
```

The demo creates a uniquely named temporary folder, initializes local storage, saves a synthetic task/checkpoint, then launches a fresh CLI process to resume it. It verifies the checkpoint ID and preserves a not_run check result. The output includes the folder/task ID for later inspection. It does not alter agent settings, send messages or call a model. The portable Node demo avoids shell quoting and PowerShell script-policy changes. The user reported a successful Windows demo on the initial PR revision; the review fixes need a new Windows run.

## Manual commands

Run `node /path/to/agentcarry/src/cli.ts help` (use your actual absolute path) from the project you want to use. The current directory is the explicit approved workspace; it is not inferred by searching parent folders.

```
node /path/to/agentcarry/src/cli.ts init --new --max-bytes 1048576 --retention-days 30
node /path/to/agentcarry/src/cli.ts status
node /path/to/agentcarry/src/cli.ts doctor
node /path/to/agentcarry/src/cli.ts export
```

The quota and retention numbers above are example choices, not product defaults. Initialization requires both. It creates .agentcarry/local.sqlite and a narrowly scoped .agentcarry/.gitignore containing `*`, preserving existing handoffs and project instruction files. Existing stores/ignore files are not overwritten. Initialization rejects a database or sidecar path already tracked by Git, including paths differing only in case. If Git tracking cannot be checked in a workspace with a Git marker, initialization stops. A failed initialization may leave files requiring manual inspection; do not remove a real store to retry. Workspace copies/moves reject rather than silently attach; attach/import is not implemented.

`task`, `update`, `checkpoint`, `resume`, `delete-task` and `configure` accept a single JSON object via standard input, capped at 64 KiB. Unknown fields reject. Commands return JSON; errors go to stderr with a nonzero exit. Paths are not accepted in input and no file contents/transcripts/environment files are ingested. Only explicitly submitted text is captured; do not submit secrets. This is not automatic secret detection/redaction.

Task input: token (new UUID v4), goal, acceptance_criteria (nonempty string list). Update: token, task_id, expected_revision, state, blockers; optional reopen_reason is required to reopen completed/cancelled tasks. Use `token` to generate a UUID if needed. Retry with the same token and identical request to get the original acknowledgement; changed payload conflicts. Deleted requests replay only a non-content tombstone.

Checkpoint input: token, task_id, parent_checkpoint_ids, client, client_version, decisions, failed_attempts, unresolved, next_steps, checks. Lists may be empty. Each check requires command, outcome (passed/failed/not_run/inconclusive), origin=agent_reported, review=unreviewed. Use the prior checkpoint ID as a parent to continue a lineage; use multiple parents to explicitly reconcile it. Each recording invocation creates a session ID; this does not discover an agent's conversation/session identity. See [demo.mjs](scripts/demo.mjs) for a complete input example.

Resume: task_id and optional checkpoint_id or conflict-page offset. Multiple task tips return a conflict with at most 20 abbreviated candidates per page; use next_offset to request another page. Each request sees the current state, so concurrent changes may alter pages; refresh before choosing. No timestamp winner is selected. Explicit checkpoint selection is supported. Resume returns the current task alongside the selected checkpoint and flags task revision differences. Content remains untrusted project context; the receiving agent must inspect current code. Git branch/commit/dirty state are observed by the CLI. git_freshness reports their comparison; a clean Git state does not cover ignored files. Overall freshness is unknown unless a change is detected, because relevant file fingerprints are not implemented. Unavailable/non-Git/unborn state stays unknown. Cross-workspace recovery is not implemented.

Delete: task_id. It removes the task, all its checkpoints and their retry-result body copies. Only IDs/request hashes remain to prevent replay resurrection. There are no learned drafts, derived search indexes or standalone events in this slice. Export prints a transactional JSON snapshot; it is a readable backup, not a validated transferable import format. Exports can contain private text and local paths. Logical deletion cannot erase database free pages, WAL, snapshots or external exports/backups.

Configure: max_bytes and retention_days. The quota counts UTF-8 record/retry-body bytes plus receipt fields, not total SQLite file size. It fails atomically at the cap; status warns at 80%. SQLite pages, metadata, WAL and tombstones can consume additional disk. Tombstones count toward usage; no automatic compaction/reset is supplied. `prune` explicitly deletes tasks with no task update/checkpoint activity within the configured retention period, including dependent checkpoints and retry bodies. No background or silent deletion runs.

## Implementation and verification

Shared core: [local.ts](src/local.ts); CLI: [cli.ts](src/cli.ts). Built-in SQLite WAL/FULL, immediate writer transactions, same-database idempotency receipts and optimistic task revisions are used for this prototype. Schema version 1 rejects unsupported versions before enabling writes. This layout is separate from the spike databases and is not a finalized product schema. Migration/import are absent, so use synthetic data for this preview.

Node executes erasable TypeScript directly. Runtime tests exercise this on Node 24.22.1; a static TypeScript compiler/typecheck and distributable packaging are still pending. No external dependency is introduced. Exact production runtime support remains unaccepted.

Seventeen local tests passed on Linux x64 with Node 24.22.1 / SQLite 3.53.4: fresh-process handoff, lineage conflicts/reconciliation, freshness/trust restrictions, copied/symlinked-store rejection, revision/retry handling, quota rollback, deletion/pruning, unsupported schema, injected precommit failure, two-process race and killed-writer recovery. The merged 33 research tests remain separate. User-provided Windows terminal output reports 46/46 tests and the demo passing on the initial PR version; the checkout commit and runtime versions were not shown in that output. The user subsequently reported 50/50 tests and the demo passing on Windows; the pasted output did not identify the checkout commit or runtime versions. The knowledge change was subsequently run on Windows as recorded below. No Gemini/OpenCode/Antigravity compatibility claim is made.

Local filesystem ownership is the trust boundary. Symlink/hardlink checks prevent common accidental escapes, not hostile replacement races by another process with write access to the containing directory. File modes are requested where supported; Windows ACL hardening and physical power-loss durability need separate evidence. No cloud upload, telemetry, model processing or arbitrary command execution service exists. The CLI invokes only fixed Git inspection commands.


User-provided Windows x64 output at commit 6d7d03fb59ba0206980a8098e9f3086f14c77e6f, Node 24.22.1 / SQLite 3.53.4: npm test 56/56, eval:knowledge 24/24, and reduced-motion search returned source-linked guidance. This is not a real-agent integration or production durability test.
