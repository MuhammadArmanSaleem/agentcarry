# Product requirements

Status: agreed product direction; implementation pending. Date: 2026-10-25.

## Problem and audience

Developers switch coding agents because of usage limits, availability, or task needs. They repeat project context, lose prior decisions, and manually assemble engineering instructions. AgentCarry provides a shared, inspectable knowledge and continuity layer for developers using coding agents in new and existing projects. Human-readable browsing is part of the product; a general learning platform is a longer-term direction.

## Product boundary

AgentCarry retrieves and stores guidance, tasks, checkpoints, evidence, and learned skills. The connected agent designs, codes, invokes external software, runs checks, and reports outcomes. AgentCarry is not an autonomous coding or hosted execution service. Tool instructions do not themselves grant control of external applications.

## Required capabilities

1. Guided project setup offers local or optional cloud operation and selected agent integrations. Advanced configuration can combine hosted public knowledge with local private memory.
2. Existing projects are inspected without overwriting conventions or existing instructions. New projects capture goals and stack preferences; the agent scaffolds them.
3. Automatic consultation is the desired default, with explicit lookup available. Actual automatic behavior requires verified client-specific wiring.
4. Curated packages cover software development: frontend, backend, databases, architecture, testing, security, CI/CD, design, and agent development. Initial content is maintained by the project owner. Launch coverage is deliberately small.
5. Engineering principles such as DRY, KISS, SOLID, separation of concerns, and appropriate OOP are applied contextually; principles are not mechanically provable universal rules.
6. Retrieve compatible guidance with sources, supported versions, and last verification dates. Do not confuse latest guidance with guidance appropriate to an older dependency.
7. Shared project memory works across target agents: Gemini CLI, OpenCode, Antigravity, Codex, Claude Code, Cursor, Manus. All begin untested.
8. Track tasks, dependencies, acceptance criteria, blockers, evidence, decisions, failed attempts, and next actions.
9. Capture structured session events and checkpoints by default. Full transcripts are optional and require explicit data handling and retention settings.
10. Extract reusable Markdown skill drafts from work outcomes. Preserve applicability, failures, origin, and verification evidence. Private project drafts do not automatically enter the public collection.
11. The active agent handles coding and important reasoning. Optional configured budget/local models can format documentation, summarize, or draft skills. No separate model is required for core continuity.
12. Supply relevant verification procedures and record reported results. Guidance and reporting are defaults; selected enforcement belongs to explicitly configured agent/CI checks.

## Journeys

### Existing project, local

Run guided setup, choose agents, inspect project stack, select packages, initialize local records, work using retrieved guidance, save a checkpoint, and resume in another agent after checking current files.

### New project

Capture outcome and preferences, record decisions, supply guidance to the agent that scaffolds the app, then follow the same task and checkpoint workflow.

### Optional cloud

Connect and authenticate a supported client, select a project, retrieve guidance and authorized memory, write progress, and resume from another client. Extra adapter instructions/hooks may be required for automatic capture. Cloud service cannot inspect local files without supplied context or a permitted bridge.

## Acceptance criteria

These are overall product criteria, not a single early-phase gate. See [VALIDATION.md](VALIDATION.md) for staged tests and [CONTRACTS.md](CONTRACTS.md) for required behavior.

- A setup fixture with existing instructions preserves all unrelated content and provides a reversible change report.
- Installed local packages, tasks, and checkpoints remain readable and searchable with network disabled and no API key.
- A labeled retrieval fixture returns expected relevant sections within the top five results and excludes deliberately incompatible versions. Report the sample size and failures.
- Divergent checkpoints are surfaced as conflicts with explicit selection/reconciliation; no latest-timestamp overwrite.
- Private deletion removes derived copies/index entries; exclusions and quota handling ship with initial persistence.
- Automatic capture is labeled manual/instruction-assisted/hook-assisted per adapter; only acknowledged durable checkpoints count as saved.
- A fresh agent session recovers the goal, one decision, a failed approach, pending work, and exact recorded check status without developer re-explanation.
- A changed branch/revision or relevant file fingerprint is visibly flagged; code freshness is not inferred from timestamp alone.
- Missing evidence never becomes a passed check. Agent-reported results remain labeled as such.
- An interrupted write leaves either the prior valid record or the complete new record; concurrent stale updates are rejected.
- A learned draft contains trigger, conditions, procedure, evidence references, and unresolved limitations; promotion is explicit.
- Each advertised agent integration passes the versioned compatibility checks in COMPATIBILITY.md.

## Scope and exclusions

The first prototype implements local continuity and a small knowledge collection, validated with two agents first. Remaining adapters, website, and optional cloud follow in phases; all seven remain targets.

Excluded initially: model training, executing user code in AgentCarry infrastructure, automatic public skill publishing, community submissions, billing, universal full-transcript ingestion, guaranteed enforcement of subjective principles, and guaranteed identical behavior across clients.

## Risks and open questions

Automatic hooks vary by agent; retrieval can select wrong guidance; memory may be stale; cheap-model summaries can omit decisions; captured text can contain secrets or hostile instructions. Mitigations must be implemented and tested, not claimed from documentation alone.

Unresolved: exact dependencies/runtime, first two validated clients, cloud provider/auth/quota design, retention defaults, and licensing of distributed third-party content.

## Requirements authority

Accepted product direction and proposed technical choices are distinct. Unknown capabilities and defaults remain in [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md). Do not describe planning text as implementation evidence. Offline AgentCarry operations do not imply an offline coding model. Published knowledge requires source maintenance and withdrawal policy (CONTRACTS C05).

## Integration priority

Prioritize Gemini CLI, OpenCode and Antigravity. First validate Gemini CLI <-> OpenCode, then Antigravity with exact surface identified. Other clients remain later targets. Local continuity requires no paid AgentCarry subscription or separate inference call; client/provider quotas and costs remain independent.
