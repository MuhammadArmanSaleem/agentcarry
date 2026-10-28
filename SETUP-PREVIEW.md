# Project setup preview

This is the read-only first part of guided local setup. It does not install or connect a client, initialize storage, apply edits, create backups or implement rollback. No cloud mode is configured. Full setup remains a later step; P1/P2/P3 gates stay open.

Run from the project you want the coding agent to use:

```sh
node /absolute/path/to/agentcarry/src/cli.ts setup-preview gemini
node /absolute/path/to/agentcarry/src/cli.ts setup-preview opencode
```

The current directory is the explicit workspace. Running `npm run local -- setup-preview gemini` from the AgentCarry checkout previews configuration for that checkout, not another project. No directories, client configs or SQLite files are created or opened for writing. Preview makes no model or network call and requires no initialized store. Memory tools still need a separately initialized local store.

Output identifies the project-local config path, entry path and proposed entry using the current Node executable and absolute MCP server/workspace paths. Status is preview for a missing entry, already_configured for an exact canonical match, or conflict for a different existing entry with the same owned name. An equivalent command spelled differently (for example node versus an absolute executable) may conservatively report conflict. The preview never prints existing entry contents or unrelated settings, which could contain secrets. It does not return a fully merged configuration file or authorize replacing one.

Gemini uses .gemini/settings.json under mcpServers.agentcarry-preview. OpenCode v2 uses opencode.json under mcp.servers.agentcarry-preview, based on the configuration conventions in MCP-PREVIEW.md. OpenCode JSONC is explicitly unsupported: if opencode.jsonc exists, preview fails rather than ignore it. A flat legacy owned MCP entry also requires manual review. Malformed JSON, non-object config sections, linked config directories/files and hard-linked config files fail explicitly. File reads are limited to 64 KiB based on the inspected file size.

The tool inspects only the selected project's strict-JSON config. It does not assess installed client versions, global settings, environment overrides, project trust, model availability or actual connectivity. It does not infer that storage is ready. Filesystem inspection is not protection against a hostile process concurrently replacing paths; local filesystem ownership remains the boundary. The printed preview is not an authenticated or immutable apply plan. Future apply/rollback must independently validate paths, current contents, permissions and conflicts.

Linux Node 24.22.1: npm run typecheck passed, npm test 67/67. Four setup tests cover fresh CLI previews, unchanged existing bytes, withholding synthetic unrelated secret values, exact-match/conflict statuses, malformed and JSONC configs, legacy collisions, junction/symlink and hardlink rejection. They do not run coding-agent clients. Windows reproduction remains pending. No new dependency was added.
