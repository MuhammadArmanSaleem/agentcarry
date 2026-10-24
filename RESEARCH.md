# Research and alternatives

Research snapshot: 2026-10-24/25. Sources are maintainer descriptions unless explicitly stated. Documentation review is not an installation, benchmark, audit, or proof of handoff reliability.

| Project | Observed overlap | Qualification |
|---|---|---|
| [Context7](https://github.com/upstash/context7) | Version-specific docs, hosted MCP, CLI + skills | CLI fetching is remote, not proof of offline package support |
| [Skills.sh](https://www.skills.sh/) | Skill discovery and installation | Does not by itself establish shared project continuity |
| [OpenMemory / Mem0](https://mem0.ai/openmemory) | Persistent memory across clients | Distinguish local OpenMemory deployment from hosted Mem0 MCP |
| [AgentSync](https://github.com/x0c/agentsync) | Rules, skills and MCP config synchronization | Shared configuration is not equivalent to outcome-derived learning |
| [Agent Parity](https://github.com/libkim/agent-parity) | Shared skills, instructions and project memory | Source inspected for Markdown store and memory merging; no execution test |
| [Acontext](https://github.com/memodb-io/Acontext) | Session outcomes distilled into reusable Markdown skills | Owner archived repository on 2026-10-24 per contemporaneous GitHub screenshot; cached retrieval omitted archive banner |

## Primary references

- [Context7 repository](https://github.com/upstash/context7): setup modes and automatic consultation guidance.
- [Skills directory](https://www.skills.sh/): reusable capabilities and installation entry.
- [OpenMemory introduction](https://mem0.ai/blog/introducing-openmemory-mcp): local memory tools and Docker/OpenAI-key quickstart.
- [Hosted Mem0 MCP](https://docs.mem0.ai/platform/mem0-mcp): authenticated hosted memory connection. Hosting is not mandatory local Docker.
- [AgentSync](https://github.com/x0c/agentsync): setup, watch, backup and rollback.
- [Agent Parity store](https://github.com/libkim/agent-parity/blob/main/store.go) and [merge implementation](https://github.com/libkim/agent-parity/blob/main/merge_memory.go): file-backed memory and merge logic were inspected, not run.
- [Acontext README](https://github.com/memodb-io/Acontext): task outcomes, distillation, skill extraction/retrieval and export; its documented self-host setup includes Docker and model credentials.

## Findings

The combination of skills, memory and multiple agents is not inherently novel. Hosted documentation and memory connections already exist. AgentCarry's proposed advantage is one guided experience, tested handoffs, compatible curated engineering guidance, and affordable local operation. This is a hypothesis to test, not a market exclusivity claim.

Archive status does not establish why a project stopped, service availability, or license permission. Recheck maintenance and license before adopting code. Stale cached pages can miss same-day changes.

## Comparative experiment pending

Use an isolated sample project with explicit goal, a recorded decision, a failed attempt, an unfinished task and check evidence. Save in client A; resume in client B. Score recovered facts, repeated failed work, stale-state detection, setup friction, tool calls, returned tokens, network dependencies and model costs. Then ask for a reusable skill and review fidelity.

Test AgentCarry against plain handoff files and selected existing tools under the same conditions. No results exist yet.

## Integration research pending

Verify each client's supported instruction files, MCP transports, hooks, capture permissions and restart requirements from current official docs. Treat Gemini CLI and Antigravity as separate targets. Establish what Manus can access and whether local/cloud bridging is possible. No global automatic-capture claim is supported yet.
