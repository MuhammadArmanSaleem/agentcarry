# Compatibility matrix

No integration is supported as a released product. Limited user-reported setup checks and manual handoff evidence exist below; they do not establish full adapter or automatic-capture compatibility. A shared instruction file is not a working adapter.

| Target | Configuration | Knowledge | Checkpoints | Automatic lifecycle | Cross-agent handoff |
|---|---|---|---|---|---|
| Claude Code | Untested | Untested | Untested | Untested | Untested |
| Codex | Untested | Untested | Untested | Untested | Untested |
| Cursor | Untested | Untested | Untested | Untested | Untested |
| OpenCode | Limited user-reported basic setup | Untested | Untested | Untested | Untested |
| Gemini CLI | Limited user-reported basic setup | Untested | Untested | Untested | Untested |
| Antigravity | Untested | Untested | Untested | Untested | Untested |
| Manus | Untested | Untested | Untested | Untested | Untested |

## Evidence needed

For each client record exact product/version, OS, date, transport, setup changes, existing config preservation, restart requirements, test steps/results and limitations. Distinguish IDE, CLI and hosted variants.

A working integration must demonstrate scoped retrieval, task write, checkpoint save/read, agent attribution, truthful evidence labels and resume from another client. Automatic lifecycle claims additionally require observed startup/milestone behavior and a documented manual fallback.

Verify Windows early; Linux/macOS support need separate evidence. Hosted clients may not access local stores. Do not assume MCP transport or hooks exist because another client supports them.

## Handoff fixture

Client A records a decision, failed approach, pending task, evidence and code revision. Client B starts without the conversation, recovers those facts and checks current code. Repeat after a branch change and after an interrupted session. Report missing facts and duplicate work.

First validation pair: Gemini CLI and OpenCode. Next: Antigravity, recording IDE/App/CLI separately. Codex, Claude Code, Cursor and Manus are later targets. Priority is not verified support.

## Capture level and limits

Record manual, instruction-assisted, or hook-assisted separately from tool connectivity (CONTRACTS C03). Startup instructions do not prove background checkpointing. Record supported triggers, failed-write visibility, restart and abrupt-termination results, and last acknowledged checkpoint. Use VALIDATION V01/V11/V12/V16. Separate workspace/branch handoff and remote code-transfer prerequisites.

## Initial feasibility research

Official documentation reviewed for local Claude Code and local Codex on 2026-10-25: see [INTEGRATION-RESEARCH.md](INTEGRATION-RESEARCH.md). Neither client binary is installed in the spike environment. Matrix remains untested; documented hook availability is not actual AgentCarry capture support.


## Google client research

Gemini CLI and Antigravity official MCP/rules/hooks documentation reviewed 2026-10-25. Their settings paths, remote endpoint fields and lifecycle event names differ; see [INTEGRATION-RESEARCH.md](INTEGRATION-RESEARCH.md). Neither was run. All compatibility cells remain untested. [MANUAL-HANDOFF.md](MANUAL-HANDOFF.md) is an optional baseline, not an installed adapter.


## Limited local setup evidence

See [CLIENT-SETUP-CHECKS.md](CLIENT-SETUP-CHECKS.md): user-provided Windows output shows lower-level apply, connected listing, rollback and forgetting for Gemini (current version not printed) and OpenCode v2.1.4. Gemini required explicit user trust; OpenCode first reported no servers, then connected on a repeated listing without an observed config change. Cause unknown. Empty starting configs do not qualify real-client preservation of existing settings. Earlier manually prompted continuity is separate in MCP-REVIEW.md; the matrix's other cells remain unqualified by these setup checks. User-reported Windows 10 wizard checks additionally cover both clients' configure/connect/undo/forget, cancellation and fresh initialization. Gemini's wizard version and exact checkout/runtime were not printed; Windows Ctrl+C/rendering remain unconfirmed. No complete V01/V11/V12/V16 result or automatic capture claim.

