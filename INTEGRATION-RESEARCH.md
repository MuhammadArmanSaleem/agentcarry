# Coding-agent integration feasibility

Status: official documentation reviewed 2026-10-25; no live client verified.

First handoff pair: Gemini CLI and OpenCode. Next: include Antigravity, recording IDE/App/CLI separately. Codex, Claude Code, Cursor and Manus remain later targets. This is a testing order, not a compatibility claim. Exact supported versions require execution evidence.

| Surface | Documented capability | AgentCarry implication |
|---|---|---|
| Claude Code | Project instructions, local stdio and remote HTTP MCP | Use shared instructions plus local retrieval tools; test setup preservation |
| Claude hooks | SessionStart, PostToolUse, PreCompact and session-end events | Candidate triggers, not guaranteed semantic memory extraction |
| Claude startup | Launch SessionStart MCP hooks can be skipped before MCP is ready | Local startup helper or deferred instruction lookup needed; do not rely only on startup MCP |
| Codex MCP | Local stdio and Streamable HTTP configuration | Local process and optional hosted paths are feasible on paper |
| Codex hooks | Startup/tool/compaction events; startup MCP may not be ready and SessionEnd does not support MCP hooks | Test local command-based capture and explicit tool-based fallback |
| Codex cloud orchestration | Local command/plugin hooks have different availability | Never extend local CLI conclusions to cloud automatically |

Hook events do not identify every meaningful decision. Start with instruction-assisted semantic checkpoints; test command hooks for event capture separately. Do not ingest transcripts by default. Startup should read acknowledged scoped context and show conflicts rather than manufacture a new checkpoint from incomplete context.

## Official sources

- [Claude memory](https://code.claude.com/docs/en/memory): project instructions and their context-versus-enforcement boundary.
- [Claude MCP](https://code.claude.com/docs/en/mcp): supported transports and setup.
- [Claude hooks](https://code.claude.com/docs/en/hooks): lifecycle and startup availability caveat.
- [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp): stdio and Streamable HTTP configuration.
- [Codex hooks](https://learn.chatgpt.com/docs/hooks): lifecycle and local/cloud restrictions.
- [Node SQLite](https://nodejs.org/api/sqlite.html): API reference; the unversioned page currently describes a different Node line, so runtime availability was tested separately.
- [Node 24 TypeScript](https://nodejs.org/docs/latest-v24.x/api/typescript.html): type stripping versus type checking.

No minimum client version is inferred from a changing documentation page. Recheck the exact installed client's help/schema and official release documentation before generating configuration.

## First live test procedure

1. Record exact OS/product/version and a synthetic project with existing client settings.
2. Preview managed config/instruction changes, install with rollback, verify unrelated settings.
3. Read local scoped context via MCP and independently through CLI.
4. Save a decision, failed attempt, task and reported check; verify durable acknowledgement.
5. Switch client and inspect recovered facts; repeat on a different branch/worktree.
6. Force termination after a saved milestone; identify what was and was not captured.
7. Exercise configured hooks independently from semantic handoff; record startup race and failure visibility.
8. Roll back settings and verify later user edits survive.

Blocked here by absent client binaries/authenticated test environments. No instructions in this report authorize using user subscriptions or installing global hooks.


## Gemini CLI

Official docs describe project GEMINI.md context and /memory show for inspecting loaded instructions. MCP uses mcpServers in .gemini/settings.json for project scope: command/args for stdio and httpUrl for Streamable HTTP. These fields are not automatically portable to Antigravity.

Hooks are configured in settings.json. Candidate capture points: SessionStart, AfterTool, AfterAgent, PreCompress and SessionEnd. An AfterAgent event is a loop boundary, not proof a substantive task is complete. Hook stdout must be valid JSON; logs belong on stderr. Validate Windows executable paths and quoting with the installed client before writing config.

Sources: [context](https://geminicli.com/docs/cli/gemini-md/), [MCP](https://geminicli.com/docs/tools/mcp-server/), [hooks](https://geminicli.com/docs/hooks/). Reviewed 2026-10-25; no installed Gemini CLI tested.

## Antigravity: separate adapter and surface identity

Current official docs describe workspace MCP at .agents/mcp_config.json and global config at ~/.gemini/config/mcp_config.json. IDE also exposes Manage MCP Servers / View raw config. Local servers use command/args; remote servers use serverUrl for Streamable HTTP. The documented CLI rejects Gemini's httpUrl field. Use the active product's own config UI to confirm the path rather than overwrite an older installation's settings.

Workspace hooks use .agents/hooks.json; candidate events are SessionStart, PostToolUse and Stop. PostInvocation is a model-call boundary, not a task completion event. Hook format differs from Gemini CLI; no event-name renaming alone is sufficient. Rules docs describe AGENTS.md/GEMINI.md and .agents/rules. Preserve existing instructions and validate loading in a real session.

Sources: [MCP](https://antigravity.google/docs/mcp), [hooks](https://antigravity.google/docs/hooks?tab=ide), [rules](https://antigravity.google/docs/rules). Reviewed 2026-10-25; no IDE, App or CLI tested. No version minimum inferred.

## Immediate manual baseline

See [MANUAL-HANDOFF.md](MANUAL-HANDOFF.md) for a file-based handoff usable before AgentCarry tools exist. This tests human/agent continuation behavior only; it does not satisfy automatic capture or MCP integration acceptance. No placeholder MCP endpoint or nonexistent server command is provided.

Planned execution order: Gemini CLI -> OpenCode -> Gemini CLI, then each with Antigravity (identify exact surface). Test other pairs later. None of these client binaries is installed in this environment. Actual results must be recorded separately from documentation findings.

## OpenCode feasibility

Official documentation reviewed 2026-10-25; no OpenCode client was run. Project instructions use AGENTS.md. MCP configuration uses the mcp map in opencode.json/opencode.jsonc: local entries use type=local and a command array; remote entries use type=remote and url. This differs from Gemini's mcpServers and Antigravity's endpoint fields.

Plugins can load from .opencode/plugins/. Candidate events include session.created, session.idle, session.compacted and tool.execute.after. Idle is not proof of task completion; plugin callbacks do not guarantee semantic checkpoint quality or capture after abrupt termination. Prefer scoped explicit tools initially, then verify event capture in the installed version. Do not install a plugin merely to mark documentation research complete.

Sources: [OpenCode rules](https://opencode.ai/docs/rules/), [MCP](https://opencode.ai/docs/mcp-servers/), [plugins](https://opencode.ai/docs/plugins/). Adapter, configuration preservation, provider access, Windows and live handoff remain untested.
