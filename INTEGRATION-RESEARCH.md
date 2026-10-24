# First-pair integration feasibility

Status: official documentation reviewed 2026-10-25; no live client verified.

Candidate first pair: local Claude Code and local Codex CLI. This is a proposed testing order; actual supported versions will be recorded after execution. IDE/cloud variants must be checked separately.

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

