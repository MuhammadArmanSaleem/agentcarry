# AgentCarry

Carry knowledge, skills, and project progress between coding agents.

**Status: planning plus an isolated Phase 1 research harness.** No CLI, MCP server, website, cloud service, or agent integration is implemented or verified yet. Command and tool names in these documents are proposed interfaces.

## Purpose

AgentCarry supplies relevant engineering guidance and preserves project continuity when developers switch coding agents. The connected agent performs implementation and runs tools; AgentCarry manages knowledge, records, and retrieval.

Local operation is the default. Cloud operation is optional. Installed local guidance and memory must remain usable without an AgentCarry account or mandatory paid model call. Fresh documentation and package updates can require network access.

Targets: Claude Code, Codex, Cursor, Gemini CLI, Antigravity, and Manus. These are product targets, not compatibility claims. See [COMPATIBILITY.md](COMPATIBILITY.md).

## Planning documents

- [PRD.md](PRD.md): requirements, scope, journeys, acceptance criteria.
- [ARCHITECTURE-ESSENTIALS.md](ARCHITECTURE-ESSENTIALS.md): concise engineering boundaries.
- [ARCHITECTURE.md](ARCHITECTURE.md): proposed components and data contracts.
- [DECISIONS.md](DECISIONS.md): accepted direction and unresolved technical choices.
- [RESEARCH.md](RESEARCH.md): alternatives, evidence, limitations.
- [BACKLOG.md](BACKLOG.md): phased implementation and verification gates.
- [AGENTS.md](AGENTS.md): development and handoff instructions.

## First proof

Install curated guidance, record a task and failed attempt, save a checkpoint, switch agents, resume against current code, and create a reusable skill draft backed by recorded evidence.

There are no product installation or execution commands yet. The isolated research tests run with Node 24.22.1 using npm run test:spike; see [spikes/phase1/README.md](spikes/phase1/README.md). Do not install similarly named packages assuming they belong to this repository.

## Build contracts

- [CONTRACTS.md](CONTRACTS.md): precise handoff, capture, evidence, maintenance, privacy and recovery behavior.
- [VALIDATION.md](VALIDATION.md): reproducible acceptance scenarios and phase gates.
- [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md): unresolved choices and required evidence.

The design explicitly tracks uncertainty; it does not claim assumption-free implementation or universal automatic capture.

## Phase 1 evidence

[Integration research](INTEGRATION-RESEARCH.md), [schema draft](SCHEMA-DRAFT.md), and [storage experiments](spikes/phase1/README.md) distinguish measured local behavior from pending product requirements. No client integration is supported yet.

