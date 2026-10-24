# Compatibility matrix

All integrations are **unimplemented and untested** as of this documentation foundation. A shared instruction file is not a working adapter.

| Target | Configuration | Knowledge | Checkpoints | Automatic lifecycle | Cross-agent handoff |
|---|---|---|---|---|---|
| Claude Code | Untested | Untested | Untested | Untested | Untested |
| Codex | Untested | Untested | Untested | Untested | Untested |
| Cursor | Untested | Untested | Untested | Untested | Untested |
| Gemini CLI | Untested | Untested | Untested | Untested | Untested |
| Antigravity | Untested | Untested | Untested | Untested | Untested |
| Manus | Untested | Untested | Untested | Untested | Untested |

## Evidence needed

For each client record exact product/version, OS, date, transport, setup changes, existing config preservation, restart requirements, test steps/results and limitations. Distinguish IDE, CLI and hosted variants.

A working integration must demonstrate scoped retrieval, task write, checkpoint save/read, agent attribution, truthful evidence labels and resume from another client. Automatic lifecycle claims additionally require observed startup/milestone behavior and a documented manual fallback.

Verify Windows early; Linux/macOS support need separate evidence. Hosted clients may not access local stores. Do not assume MCP transport or hooks exist because another client supports them.

## Handoff fixture

Client A records a decision, failed approach, pending task, evidence and code revision. Client B starts without the conversation, recovers those facts and checks current code. Repeat after a branch change and after an interrupted session. Report missing facts and duplicate work.

First pair: pending technical spike. Claude Code and Codex are candidates, not an accepted or verified selection.
