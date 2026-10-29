# AgentCarry

Carry knowledge, skills, and project progress between coding agents.

**Status: local continuity CLI development preview plus research experiments.** See [LOCAL-PROTOTYPE.md](LOCAL-PROTOTYPE.md) for the runnable task/checkpoint flow and [KNOWLEDGE-PREVIEW.md](KNOWLEDGE-PREVIEW.md) for explicit local web-guidance search. An experimental local MCP server is documented in [MCP-PREVIEW.md](MCP-PREVIEW.md); a limited user-reported Windows handoff exercised two real clients; broader support is unverified. No website, cloud service or installed agent adapter is implemented. Full P1/P2 gates remain incomplete.

## Purpose

AgentCarry supplies relevant engineering guidance and preserves project continuity when developers switch coding agents. The connected agent performs implementation and runs tools; AgentCarry manages knowledge, records, and retrieval.

Local operation is the default. Cloud operation is optional. Installed local guidance and memory must remain usable without an AgentCarry account or mandatory paid model call. Fresh documentation and package updates can require network access.

Priority targets: Gemini CLI, OpenCode and Antigravity. Later targets: Codex, Claude Code, Cursor and Manus. These are product targets, not compatibility claims. See [COMPATIBILITY.md](COMPATIBILITY.md).

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

The unpublished local preview runs from this checkout with Node 24.22.1: `npm run test:local` and `npm run demo:local`. The demo uses a separate temporary folder. `npm test` runs all 94 current tests; `npm run test:spike` retains the 33 research tests. Git is needed for the complete test suite; the CLI itself needs no npm install or model key; MCP preview requires npm ci. See [LOCAL-PROTOTYPE.md](LOCAL-PROTOTYPE.md). Do not install similarly named packages assuming they belong to this repository.

## Build contracts

- [CONTRACTS.md](CONTRACTS.md): precise handoff, capture, evidence, maintenance, privacy and recovery behavior.
- [VALIDATION.md](VALIDATION.md): reproducible acceptance scenarios and phase gates.
- [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md): unresolved choices and required evidence.

The design explicitly tracks uncertainty; it does not claim assumption-free implementation or universal automatic capture.

## Phase 1 evidence

[Integration research](INTEGRATION-RESEARCH.md), [schema draft](SCHEMA-DRAFT.md), and [storage experiments](spikes/phase1/README.md) distinguish measured local behavior from pending product requirements. No client integration is supported as a released product; see MCP-REVIEW.md for limited manual testing.


## Integration priority

Highest priority: Gemini CLI, OpenCode and Antigravity. First handoff validation pair: Gemini CLI <-> OpenCode; extend to Antigravity next, recording IDE/App/CLI separately. Codex, Claude Code, Cursor and Manus remain later targets. Priority is not verified support.

Affordability requirement: AgentCarry local knowledge and continuity must not require a paid AgentCarry subscription or separate inference call. Client availability, provider authentication, model quotas and model charges are separate from AgentCarry; do not promise unlimited free model access.

## Static checks

Run `npm ci`, then `npm run typecheck` for strict checking of src/**/*.ts, and `npm test` for runtime behavior. See [TYPECHECK.md](TYPECHECK.md) for scope, versions and limitations. No JavaScript is emitted; Node continues to execute the TypeScript source directly.

## Setup preview

From the intended project workspace, use `node /absolute/path/to/agentcarry/src/cli.ts setup-preview gemini` or `setup-preview opencode` to inspect the proposed local MCP entry without writing configuration. See [SETUP-PREVIEW.md](SETUP-PREVIEW.md). Explicit apply, private backups and rollback are now a development preview in [SETUP-APPLY.md](SETUP-APPLY.md). Guided installation and real-client qualification remain incomplete.


## Guided local setup

Run `node /absolute/path/to/agentcarry/src/cli.ts setup` from the intended disposable workspace in a terminal. The menu handles client selection, preview/confirmation, optional explicit store initialization, undo and backup forgetting without copied JSON or revision hashes. It does not launch clients, change trust or establish connectivity. See [SETUP-WIZARD.md](SETUP-WIZARD.md) for limits and [CLIENT-SETUP-CHECKS.md](CLIENT-SETUP-CHECKS.md) for separate user-reported checks of lower-level setup.


## Local setup diagnostics

Run `node /absolute/path/to/agentcarry/src/cli.ts setup-check gemini` or `setup-check opencode` from the intended workspace. This read-only inspection works before initialization, withholds config bodies, and reports configuration revisions and suggested next steps. It does not establish a client connection. See [SETUP-CHECK.md](SETUP-CHECK.md).
