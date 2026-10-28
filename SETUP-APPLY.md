# Explicit setup apply and rollback preview

Development preview for disposable workspaces and synthetic config only. It builds on SETUP-PREVIEW.md with explicit CLI writes; it is not a guided installer or released client adapter. No real client is launched by these operations. Windows, network-filesystem and real-client configuration tests remain pending.

## First verification

From the AgentCarry checkout:

```sh
npm run typecheck
npm test
npm run demo:setup
```

The demo creates a unique temporary workspace, initializes its local store, applies synthetic Gemini/OpenCode configs, retries writes, changes an unrelated setting, rolls back, forgets backups and removes that workspace. It does not alter the AgentCarry checkout's client settings, call a model or start either coding client. A failed demo leaves its synthetic directory for inspection.

## Commands and explicit input

Run the CLI from the intended workspace. Initialize storage separately with the existing init command and explicit memory quota/retention; setup does not initialize or attach a store implicitly. The setup history is workspace/project-bound and separate from the SQLite record schema.

1. setup-preview gemini or setup-preview opencode returns config_revision and plan_revision, alongside the proposed entry. These bind the current config and generated executable/server/workspace arguments.
2. setup-apply accepts JSON stdin with token (new UUID v4), client, expected_revision, expected_plan and max_backup_bytes (integer 4096 through 16777216). Copy revisions from a fresh preview; choose the backup budget explicitly. There is no default. Reusing the same token requires the identical input. Preview changes and different owned entries refuse rather than overwrite.
3. setup-status accepts {"token":"OPERATION_UUID"} and returns only metadata and observed config state. It never prints the backup body. Observed matching bytes are not proof of which process wrote them.
4. setup-rollback accepts the token. If the installed config is unchanged, it restores exact original file bytes (or removes a file created by that operation). If unrelated settings changed later, it removes only the matching owned entry and prunes only now-empty containers the original config lacked. Later unrelated values survive; JSON formatting may change. A changed owned entry refuses rollback. Repeating an already completed rollback does not remove a later reinstall.
5. setup-forget accepts the token after completed rollback. It removes the original body and entry from the journal, clears operation-scoped orphan temporary files, and retains non-content identity/hash metadata to block replay. Interrupted cleanup is reported by setup-status as cleanup_pending and may be retried. Physical erasure is false; other operations' backups, filesystem history/sync and external copies are not deleted.

For example, put the reviewed apply input in a local request file and pass it through stdin, using the actual absolute path to the checkout:

```sh
node /absolute/path/to/agentcarry/src/cli.ts setup-apply < apply-request.json
node /absolute/path/to/agentcarry/src/cli.ts setup-status < operation-request.json
node /absolute/path/to/agentcarry/src/cli.ts setup-rollback < operation-request.json
node /absolute/path/to/agentcarry/src/cli.ts setup-forget < operation-request.json
```

One client may have only one active or rollback-requested operation. Resolve that operation before creating another. An existing exact configuration not installed by this command is reported as already_configured without creating an operation or claiming rollback ownership. This preview does not implement updating/replacing pre-existing owned entries.

## Private backups and budget

History lives under .agentcarry/setup-history. The workspace must already have a valid bound local store, its wildcard .agentcarry/.gitignore and no tracked setup-history paths. Linked or hard-linked history/config files and linked directories are refused. The inspected client config must be strict UTF-8 JSON, at most 64 KiB before and after apply; JSONC remains unsupported. Non-finite numbers and unsafe integer values are rejected rather than silently coerced while rewriting unrelated settings. Existing settings may contain credentials: exact backups necessarily include those bytes. AgentCarry does not print them, put them in task memory, or upload them. Filesystem sync/backup software remains outside its control. This is not encrypted storage or automatic secret redaction.

max_backup_bytes limits retained setup-history bytes with a small metadata reserve when admitting a new operation. This is an explicit setup-history budget, separate from the core record quota, and not a physical disk cap. Temporary files, filesystem metadata and other data consume additional space. There is no automatic pruning. Backups request private POSIX modes; Windows ACL hardening, original ownership/ACL restoration and physical deletion are not verified. Config rollback restores file content, not all filesystem metadata. An empty .gemini directory may remain.

## Failure and recovery

AgentCarry serializes its own setup writers with an exclusive lock. It writes and fsyncs a versioned backup record before touching client config, stages replacement files privately, rechecks the current config revision and renames the replacement. Rollback intent is recorded before config removal/restoration, so a retry cannot reinstall a rolled-back operation. This journal is not a general file-store replacement and does not change the core SQLite schema.

A killed process may leave a stale lock. Other writes then fail closed. After inspecting the operation, setup-unlock accepts the token and confirm_abandoned:true only if the recorded positive PID no longer exists. A live/reused PID, malformed lock or unknown state is not force-cleared. Status may be inspected while locked. After unlocking, retry the same apply request or explicitly roll it back. Never assume an error means no change occurred. Malformed recovery files need manual inspection; there is no automatic destructive repair.

Close clients/editors before applying or undoing setup. The lock coordinates AgentCarry processes only. Revision checks catch observed changes, but cannot provide atomic compare-and-swap against arbitrary external writers or hostile path replacement between inspection and rename. Local filesystem ownership remains the boundary. Rename/permission failures preserve the recovery record; copying over a failed rename is not used as a fallback. Process-termination testing does not establish physical power-loss durability, and directory fsync/remote filesystems are not qualified.

## Evidence and limits

Linux Node 24.22.1: strict typecheck, 80/80 full tests and the fresh-process setup demo passed. Thirteen apply tests cover both clients, exact restoration, later edits, conflicts, stale/forged plans, budgets, token misuse, tracked/linked history, invalid UTF-8, owned-entry lifetime, scoped cleanup and replay blocking, two-process contention and process death before/after config replacement followed by explicit recovery. A subsequent targeted run covered pending cleanup status. These do not establish production readiness or complete V01/V16, and are not a substitute for Windows reproduction and actual client checks. P1/P2/P3 remain incomplete.
