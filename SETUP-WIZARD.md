# Guided local setup preview

Run from the intended project workspace in an interactive terminal:

```sh
node /absolute/path/to/agentcarry/src/cli.ts setup
```

Use the actual absolute checkout path (quoted if it contains spaces). This is an unpublished checkout-based preview for disposable workspaces and synthetic data. No new package install command or cloud service is introduced.

## Menu and confirmation

Choose Configure a client, Undo setup, Forget a backup, or Exit. Configure supports one selected Gemini CLI or OpenCode v2 project at a time. It displays the config path and generated entry while hiding unrelated values. Conflicting entries refuse; an exact existing entry is not adopted as a new rollback-owned operation.

A new operation asks for a setup-history budget in whole MiB (1-16). No default is silently selected. If storage is missing, initialization additionally asks for memory quota in whole MiB (1-16) and retention in days (1-3650), then requires its own explicit yes confirmation. Retention requires explicit pruning; it is not a scheduled deletion promise. The initialized store remains if client configuration is subsequently declined or fails.

Client configuration requires a separate yes confirmation. The wizard generates the UUID and passes the displayed plan/config revisions internally to the same apply function used by the JSON CLI. There is no copied hash/token/JSON input in this journey. Changed configs still refuse under the shared revision checks. A no, q, EOF or Ctrl+C at a prompt does not authorize a new write. Previously confirmed work remains; cancellation is not automatic rollback.

Undo and Forget list at most 100 validated operation summaries: client, phase and ID only. Select an operation explicitly rather than automatically choosing the latest. Undo retains its backup; Forget removes its saved body and operation-scoped temporary copies after completed rollback. Neither removes the initialized store, other operations' backups or physical remnants. Existing forgotten operations remain selectable for repeated cleanup.

## Failure and boundaries

The wizard prints the operation ID before apply. If acknowledgement is lost, do not assume nothing changed: run setup again and choose Undo setup to inspect/select an eligible saved operation. The advanced JSON operations remain available for status, identical-request retry and explicit abandoned-lock recovery. Locks or malformed history fail closed; the wizard never auto-unlocks or repairs them. See [SETUP-APPLY.md](SETUP-APPLY.md).

No client is launched, no trust/environment settings are changed, and no connectivity/version check is claimed. The successful result says connectivity:not_checked and capture:manual. Run the selected client's mcp list separately. Gemini may disable MCP in an untrusted folder; review trust in the client yourself. A repeated OpenCode list has found the server after an initial absence in user-reported checks; the cause is unresolved, not a guaranteed retry mechanism.

Exact backups can contain credentials and are not encrypted. Configuration is project-local strict UTF-8 JSON only; global settings, JSONC, automatic capture, automatic knowledge consultation, cloud setup, distribution and production migration/import remain outside this preview. Do not infer broader client compatibility from menu availability. Inherited filesystem, permission, external-writer and power-loss limits remain in SETUP-APPLY.md.

The human terminal command deliberately rejects piped input or redirected output; automation must continue to use setup-preview and explicit JSON operations. Machine commands still return JSON; setup itself prints a human transcript followed by a JSON result. Terminal reads are aborted on EOF/Ctrl+C.

## Verification

Linux x64, Node 24.22.1: typecheck passed; 10/10 focused wizard tests and 91/91 full tests passed; the existing setup demo passed. Tests cover cancellation/EOF, invalid input, separately confirmed initialization, both clients' install/undo/forget journeys, exact/conflicting entries, hidden unrelated secrets, stale plans, persisted undo selection after lost acknowledgement and noninteractive refusal.

A separate Linux pseudo-terminal smoke completed a confirmed Gemini config install and a fresh invocation cancelled with Ctrl+C. Neither coding client was launched. User-reported Windows 10 checks now cover cancellation, explicit fresh initialization, and both clients' configure/connect/undo/forget journeys. Gemini required user-controlled trust; OpenCode repeatedly missed the server on its first listing. Exact checkout/runtime and Gemini version were not printed; Windows Ctrl+C and overlapping native terminal rendering remain unconfirmed. These and prior lower-level checks are recorded in [CLIENT-SETUP-CHECKS.md](CLIENT-SETUP-CHECKS.md). No P1/P2/P3 gate is completed.

For review:
```sh
npm run typecheck
npm run test:setup-wizard
npm test
npm run demo:setup
```
