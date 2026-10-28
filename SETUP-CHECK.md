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

Linux Node 24.22.1: typecheck, seven setup tests, 94/94 full tests and the synthetic setup demo passed. New cases cover uninitialized CLI checks without file creation, hidden secrets, matching/conflicting entries and changing revisions, malformed refusal, invalid database bytes left unopened, and unsafe paths. Windows execution of this new command remains pending. No phase gate or released compatibility is established.
