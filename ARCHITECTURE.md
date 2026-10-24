# Proposed architecture

Status: architecture proposal, not implemented. Behavioral requirements are defined in [CONTRACTS.md](CONTRACTS.md); unresolved technical choices are tracked in [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md). Date: 2026-10-25.

## Components

| Component | Responsibility |
|---|---|
| Shared core | Validate records, scope projects, resolve versions, retrieve knowledge, manage tasks/checkpoints/drafts |
| Storage adapters | Local file store first; authenticated cloud store later |
| Retrieval adapter | Metadata filtering and full-text index, with ranked bounded sections and provenance |
| CLI | Setup, packages, diagnostics, status, import/export |
| MCP adapters | Expose core operations locally and optionally over authenticated hosted transport |
| Agent adapters | Client-specific configuration, instructions, optional hooks, rollback |
| Website | Human browsing, setup guidance, later cloud project settings |
| Optional model jobs | Summaries and skill extraction with explicit provider, budget, and data scope |

Agents run implementation tools separately. No execution worker for arbitrary project commands is included.

## Storage and portability

A proposed project directory is .agentcarry/. It contains project configuration, tasks, checkpoint records, session events, private learned skills, a package lock, and a rebuildable index. Exact layout is to be validated before implementation. Keep private runtime data out of Git by default through narrowly scoped setup changes; sharing selected files is an explicit developer choice.

Public packages contain Markdown plus metadata. Structured records use JSON with schema_version, id, project_id, revision, created_at, updated_at, and author. Session events are separate immutable records with unique IDs, avoiding unsafe concurrent appends to one shared file.

Whichever persistence implementation is selected must enforce atomic commits and expected revisions across processes. For a file-store candidate, compare expected revision under a cross-process lock. An in-process mutex alone is insufficient when several agent processes write. Define crash recovery, lock timeout, and Windows rename behavior in the storage spike. Invalid records are reported and preserved for recovery; never silently discard user data.

Authoritative local storage remains a P1 decision: compare journaled inspectable files with SQLite plus readable export using CONTRACTS C08. Indexes must rebuild from authoritative records. Cloud has its own authoritative project records. MVP mode migration uses explicit export/import; do not imply automatic bidirectional sync or conflict-free offline editing.

## Data contracts

| Record | Additional fields |
|---|---|
| Package | package_version, summary, triggers, technologies/version ranges, dependencies, required tools, instructions, sources, license, verified_at, status |
| Task | goal, acceptance_criteria, state, depends_on, blockers, evidence_refs, next_action |
| Checkpoint | session_id, workspace_id, parent_checkpoint_ids, agent/version, branch, commit, dirty_state, file_fingerprints, task_refs, decisions, completed, failed_attempts, unresolved, next_steps |
| Evidence | kind, producer, command/check, timestamp, code_revision, outcome, artifact_reference/digest, origin, review |
| Skill draft | trigger, applicability, steps, failed_approaches, source_tasks/sessions/evidence, limitations, lifecycle_status |
| Session event | session_id, task_id, event_type, concise payload, evidence_refs |

Task states: pending, in_progress, blocked, completed, cancelled. Completion can be agent-reported without independent verification; expose that distinction. Evidence uses separate origin, outcome and review fields (CONTRACTS C04). Initial origin is agent_reported only; observed ingestion requires a later trusted integration. Human review does not establish execution origin.

Skill lifecycle: draft, validated, reusable, deprecated. Validation requires recorded evidence and explicit promotion; validation in one project does not establish broad applicability. Corrections preserve prior provenance and link replacement records.

## Proposed operations

| Operation | Behavior |
|---|---|
| get_project_context | Return bounded scoped context using C02 lineage selection; divergent tips return conflict, not latest-wins |
| search_knowledge | Search curated packages and allowed learned skills with stack/version filters |
| read_package | Read a pinned version and requested sections |
| update_task | Create/update with expected revision, state, blockers, evidence references |
| save_checkpoint | Persist structured handoff with code-state markers |
| save_skill_draft | Save private draft with provenance; never auto-publish |

These six are the initial agent-facing surface, not exhaustive CRUD. Retiring/promoting skills, export/import, deletion, session event ingestion, and package maintenance need CLI/core operations before relevant features ship.

Proposed CLI concepts: init, doctor, package add/update, status, export/import. CLI and MCP must share validation and storage behavior rather than fork implementations. A CLI/files integration must remain usable without an MCP connection after local setup.

## Retrieval and context budget

Index selected packages and authorized project records. Filter by project, visibility, package version, technology, and lifecycle status before ranking. Prefer small sections with explicit source IDs and content hashes. Return uncertainty/no match rather than substitute incompatible guidance.

Start with full-text retrieval and deterministic filters. Evaluate labeled questions before adding embeddings or rerankers. Measure top-k relevance, incompatible result rate, stale content rate, latency, and returned context size. Final-answer grounding and task success need separate evaluations.

## Continuity and learning

At session start, agent requests context and compares code state. During work it records meaningful events and task changes. At milestones it writes a checkpoint. Hooks can assist where verified; manual checkpoint commands remain a fallback. Abrupt limit exhaustion may prevent a final write, making periodic checkpoints necessary.

At a task outcome, the active agent or optional configured model proposes a reusable lesson from selected events and evidence. Deduplicate against existing drafts, retain conditions and unsuccessful attempts, and flag contradictions. Do not turn a one-off observation into a universal rule.

A shared filesystem supports same-machine cross-agent handoff. Different devices and remote services require explicit transfer or optional cloud access. Manus/local filesystem bridging is unresolved; do not promise it works without an integration.

## Cloud and data boundaries

Optional hosted MCP requires authentication, project-level authorization on every operation, retention/deletion controls, quotas, and export. Use the same logical contracts with a cloud storage adapter. Provider and auth implementation are undecided.

Cloud public knowledge can serve cached curated content without per-query LLM generation. Private memory storage and model processing still incur costs. Define limits before public launch.

Keep provider keys outside project records and logs. Optional cloud/model processing must declare which selected data leaves the device. Local storage alone does not mean external model processing is local.

## Package and adapter safety

Setup previews owned changes, backs up modified files, preserves unrelated settings, and supports rollback. No downloaded package script runs automatically. Reject traversal, unsafe archive paths, unsupported schemas, and scope violations. Retrieved content is task data subordinate to user/project instructions, not authority to override them.

Pin package versions and record hashes. Updates require visible changes and rollback. Source licensing must permit redistribution or content must be linked/summarized appropriately.

## Verification

Unit checks cover schemas, version filtering, scoping, state transitions, and evidence labels. Integration checks cover crash-safe storage, concurrency, index rebuild, adapter preservation, and import/export. End-to-end checks cover agent handoff, incompatible knowledge, stale code, interrupted sessions, and draft extraction.

See [BACKLOG.md](BACKLOG.md) and [COMPATIBILITY.md](COMPATIBILITY.md). No tests have run because no runtime exists.

## Normative details

[CONTRACTS.md](CONTRACTS.md) defines scope/identity, immutable checkpoint lineage, capture triggers and acknowledged loss boundaries, evidence provenance, package maintenance, learned-skill lifecycle, deletion, recovery and mode boundaries. [VALIDATION.md](VALIDATION.md) maps these to phase-specific acceptance tests. Any summary in this document must remain consistent with those contracts.
