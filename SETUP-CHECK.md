# Local setup diagnostic preview

Run from the intended workspace, quoting the actual checkout path if it has spaces:

```sh
node /absolute/path/to/agentcarry/src/cli.ts setup-check gemini
node /absolute/path/to/agentcarry/src/cli.ts setup-check opencode
```

The command returns JSON and works without initialization. It uses the same strict project-local config inspector as setup-preview. Configuration is reported as missing_config, missing_entry, matches or conflict relative to this checkout and Node executable. A matching entry is not proof of connectivity or rollback ownership. Malformed, oversized, unsupported JSONC and unsafe config paths retain the inspector's refusals; existing values are not printed.

The result includes canonical workspace/config paths, the config revision, current Node/SQLite versions, local-store file presence and suggested next steps. Repeated config revisions can help establish whether bytes changed between client listings. They cannot prove which configuration the client loaded. Paths may identify a user; review them before sharing diagnostics.

No files are written, SQLite is not opened, clients are not launched and global/environment settings are not assessed. Store state present_not_validated means only that a regular singly linked database file exists; it may be invalid, foreign or unsupported. Run doctor separately for store validation. Unsafe store metadata is reported without reading the target. The command's checked status means inspection completed, not a healthy integration. Connectivity, client version and trust remain not_checked; capture remains manual.

Gemini trust is reviewed in Gemini by the user. OpenCode's previously reported initial missing-server listing remains unexplained; comparing revisions and repeating the listing is an investigation step, not an automatic fix. No automatic trust override, retry, config repair or network operation is added.

## Validation

Linux Node 24.22.1: typecheck, seven setup tests, 94/94 full tests and the synthetic setup demo passed. New cases cover uninitialized CLI checks without file creation, hidden secrets, matching/conflicting entries and changing revisions, malformed refusal, invalid database bytes left unopened, and unsafe paths. Windows missing-config checks are recorded below. No phase gate or released compatibility is established.


## Windows follow-up and review

User-reported Windows 10 Command Prompt checks on 2026-10-29: typecheck completed without errors and 94/94 tests passed with no skips. Separate setup-check invocations for both Gemini and OpenCode in the rolled-back disposable workspace returned checked, missing_config, config_revision:missing, local_store:present_not_validated and changes_applied:false. Both reported Node v24.22.1 / SQLite 3.53.4 and left connectivity, client version and trust explicitly not_checked. The branch switch was visible in the test output, but exact checkout HEAD was not printed. This is user-supplied execution evidence, not assistant-observed Windows execution; matching/conflicting live-client diagnostics and the OpenCode first-list cause were not established.

Review: no new blocking defect identified in the added diagnostic path within its documented preview scope. The command shares config validation with setup-preview, does not open local storage, and does not infer client connection from file presence. No runtime changes were required during this review. Prior Linux validation and the reported Windows checks above remain the verification evidence; no phase gate is completed.
