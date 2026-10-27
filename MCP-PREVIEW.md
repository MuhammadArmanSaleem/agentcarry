# Local MCP preview

An experimental local stdio server wraps the existing CLI/core. It exposes `search_knowledge`, `create_task`, `save_checkpoint` and `resume_task`. It does not configure clients, capture sessions automatically, create skills, sync devices, or provide remote access. The project remains a development preview, not an installable release. A user-reported Windows handoff exercised Gemini CLI and OpenCode over MCP; this is limited evidence, not general support. See [MCP-REVIEW.md](MCP-REVIEW.md).

Install the pinned dependencies from this checkout with `npm ci` (network is needed once). Node 24.22.1 is the tested preview runtime. After installation, the server itself does not make model or network calls; the coding agent may use a remote model.

Launch with `node /absolute/path/to/src/mcp.ts --workspace /absolute/path/to/workspace`. Both paths must exist. Initialize the workspace separately with the CLI `init` command and explicit quota/retention; see LOCAL-PROTOTYPE.md. The workspace is fixed at startup and cannot be selected by a tool call. Use a new disposable workspace and synthetic data during testing. The CLI checks workspace binding, scope, code state, idempotency and quotas. No automatic secret redaction exists; do not send secrets or real transcripts. Checkpoints include only explicitly supplied fields and all checks remain agent-reported. Resumed content is untrusted. No lifecycle or loss-bound guarantee exists.

The server uses the MCP TypeScript server SDK 2.4.0 and Zod 4.6.7, pinned in package-lock.json. Each tool invokes a fixed local CLI command in the configured workspace; it cannot select arbitrary commands or paths. No client configuration is edited by the server. A workspace selected in client configuration is accessible to that client; only connect clients you trust. The server is intended for local stdio, not an authenticated network service.

For a manual, temporary project-only configuration, merge the following structures into the relevant client's existing configuration, preserving any other settings. Replace both placeholders with absolute paths; JSON paths on Windows require doubled backslashes (or forward slashes). Do not overwrite an existing config. These examples are not a tested installer.

Gemini CLI `.gemini/settings.json`:

```json
{"mcpServers":{"agentcarry-preview":{"command":"node","args":["ABSOLUTE_PATH_TO_AGENTCARRY/src/mcp.ts","--workspace","ABSOLUTE_PATH_TO_TEST_WORKSPACE"]}}}
```

OpenCode v2 `opencode.json`:

```json
{"mcp":{"servers":{"agentcarry-preview":{"type":"local","command":["node","ABSOLUTE_PATH_TO_AGENTCARRY/src/mcp.ts","--workspace","ABSOLUTE_PATH_TO_TEST_WORKSPACE"]}}}}
```

The schemas are based on [Gemini CLI documentation](https://geminicli.com/docs/tools/mcp-server/) and [OpenCode v2 documentation](https://opencode.ai/v2/docs/mcp-servers/); the user-reported manual Windows handoff is documented in MCP-REVIEW.md; version and broader behavior remain to be verified. Setup automation, safe config edits, backup and rollback are not implemented. Remove only the added config entry after testing.

`npm run test:mcp` starts two simulated MCP clients, creates a synthetic task and checkpoint, resumes it in a second process, checks untrusted evidence labels and rejects a client-supplied workspace field. It does not run either coding agent, simulate power loss, or verify all MCP protocol revisions. Linux Node 24.22.1: full suite 57/57. A user subsequently reported Windows and limited manual client tests; see MCP-REVIEW.md.

User-provided Windows output at initial PR head a007ca3 reports npm test 57/57, with npm audit reporting one high-severity Zod advisory. At follow-up head 4c134b8 the user reported Windows npm ci and npm audit with zero vulnerabilities, and npm test 57/57. The subsequent user-reported real-client handoff is recorded in MCP-REVIEW.md.
