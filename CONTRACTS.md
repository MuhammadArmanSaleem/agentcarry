# Core behavioral contracts

Status: normative design requirements, not implemented. Proposed defaults below are implementation recommendations, not previously approved preferences. Date: 2026-10-25.

## C01 — Identity and scope

A project has a persisted random project_id; a repository URL or path alone is not its identity. A workspace has a workspace_id scoped to a canonical root; separate Git worktrees are separate workspaces. A session has a session_id and records client/product/version. Branch, commit, dirty state and relevant file fingerprints describe observed code state, not identity.

A copied/cloned project must explicitly attach to an existing project or initialize a new identity. Setup reports this choice. Do not automatically merge histories merely because remotes match. Non-Git and unborn-branch projects use explicit unavailable code markers and file fingerprints; do not invent commits.

Every private read/write requires project scope. Paths supplied by clients are constrained to an approved workspace; symlinks and canonical paths must be checked. Cloud authorization independently checks account/project access; knowing an ID grants no access.

## C02 — Checkpoints and handoff

Checkpoints are immutable records with parent_checkpoint_ids, session_id, workspace_id, branch/commit/dirty markers, scope (task IDs), author, captured_at, and freshness observation. Updating a task uses optimistic revisions; checkpoints do not overwrite each other.

Resume selection:
1. Use an explicitly requested checkpoint if authorized.
2. Otherwise consider non-deleted checkpoints for the selected project/workspace and task scope.
3. Follow an explicitly recorded handoff/continuation lineage when unambiguous.
4. If multiple divergent tips exist, return their summaries as a conflict and require selection or an explicit reconciled checkpoint with both parents. Never choose purely by newest timestamp.
5. Cross-workspace or cross-branch recovery is explicit and retains a stale/foreign-context warning.

The receiving agent compares recorded state with current code. Freshness states are matching, changed, or unknown; unknown is never matching. A commit match alone does not clear dirty-file differences. Checkpoints describe knowledge, not source-code transfer. A remote client needs code access separately.

Concurrent completion claims and contradictory decisions remain visible until explicitly reconciled. A checkpoint write never silently resolves another session's task revision conflict.

## C03 — Capture, interruption and capability levels

Every adapter declares one of: manual, instruction-assisted, or hook-assisted capture. MCP connectivity alone establishes none of these. An instruction-assisted request is best effort, not guaranteed background capture.

Required logical triggers: session start/resume, accepted material decision, completed substantive task step, failed diagnostic approach worth preserving, check outcome, task blocked/completed, explicit handoff, and clean session end. Coalesce repetitive events; keep unresolved facts.

After each completed substantive step, the integration must attempt to durably record its result before treating that step as checkpointed. Display last successfully persisted checkpoint and outstanding capture failure when the client supports it; otherwise expose through status/doctor. Do not claim unsaved conversation content was captured.

A wall-clock maximum loss bound cannot be guaranteed without a verified lifecycle/periodic mechanism and access to the needed context. No universal time-based guarantee is part of the MVP. Abrupt termination can lose work after the last acknowledged checkpoint. Each integration test records that gap. The main workflow must be described as best effort where only instructions exist.

Store write acknowledgements only after durable commit; retry writes use idempotency keys. Failures return actionable errors and do not advance the saved cursor. Never send a failed local write to cloud as an implicit fallback.

## C04 — Evidence and trust

Evidence records separate origin, outcome and review:
- origin: agent_reported or trusted_integration_observed;
- outcome: passed, failed, not_run, inconclusive;
- review: unreviewed or human_reviewed.

Human review does not turn reported execution into observed execution. Attach code state, check command/configuration, timestamp, producer and artifact digest/reference when available.

Initial prototype accepts only agent_reported evidence. Trusted integration observation stays unavailable until a separately configured collector is implemented, authenticated and tested (for example CI check ingestion). MCP clients cannot elevate evidence by submitting an enum. Never label a model's assertion independently verified. Task completion and verification outcome remain separate.

## C05 — Knowledge maintenance and retrieval

Packages declare immutable published version, content hash, compatible technology ranges, verification method/date, upstream sources, redistribution permission, and lifecycle: draft, published, stale, withdrawn. Verification means only the documented checks were performed.

Before launch, curator defines a review cadence per package and a release-time upstream check. Missing/expired review metadata makes freshness unknown/stale, not current. Online updates check registry withdrawal metadata before activation. Offline clients show last-known status and last registry check; they cannot know subsequent withdrawals.

Published content is never edited in place. Fixes produce a new version. Withdrawn packages are excluded from automatic selection when withdrawal is known. Preserve provenance; warn if pinned content is stale, withdrawn or incompatible. Never silently substitute a different version.

Initial retrieval uses full-text plus deterministic metadata. Unknown stack versions produce a clarification/unknown-compatibility response rather than a false match. Conflicting project rules and package guidance are surfaced; user/project authority takes precedence.

## C06 — Learned skills

Distinguish project-local reuse and explicit user-level reuse across projects. Default scope is project. No cross-project promotion or public publication is implicit.

Extraction consumes selected structured events and evidence, not unrestricted filesystem/chat ingestion. Active agent can produce a draft; optional budget/local provider is separately configured. A completed task is a trigger to consider extraction, not proof that every task deserves a skill.

Draft includes applicability, procedure, counterexamples/failed approaches, limitations, source record IDs and evidence origin. Validation means named tests under named conditions. Promotion is an explicit state transition, not a model's confidence score. A draft cannot override curated knowledge or established rules automatically. Corrections retain lineage; deletion follows C07 rather than preserving sensitive body text forever.

## C07 — Data minimization, retention and deletion

Local mode has no required cloud processing or telemetry. Downloading public packages is distinct from uploading project context. Ask explicitly before remote private-memory storage or sending selected content to an external model.

Initial storage ships with capture exclusions, configurable size/retention settings, list/status, deletion and export. Proposed defaults for review: structured events/checkpoints only; transcripts disabled; no private upload; warn before configured quota and reject new writes at the cap without deleting silently. Exact quota and retention periods are unresolved release decisions.

Exclude credentials, environment-file contents, tokens and secret values from capture. Redaction is defense in depth, not a guarantee; show captured content and permit correction/deletion.

Deletion removes targeted content and derived index entries. Identify dependent checkpoints/drafts/artifacts and either delete them in scope or redact references with an explicit report; do not leave sensitive copied text in derived skills. Keep only non-content tombstone IDs where necessary. User-managed exports and external backups are outside automatic deletion; explain that limit. Cloud backups require a documented expiry policy before cloud launch.

## C08 — Persistence, recovery and migration

Validate schema and expected revision under a cross-process lock. Specify process-death recovery and test Linux/Windows semantics before selecting file persistence. Atomic rename alone is not proof of crash durability or multi-record atomicity.

Task/evidence/checkpoint bundles require a transaction or recovery journal so references are not published half-written. The technical spike must compare a journaled file store with SQLite as authoritative storage plus readable export. Markdown/JSON authority is a preference under evaluation, not a mandate to hand-build unsafe transactions.

Persist schema versions; reject unsupported newer versions without mutation. Migration backs up prior state, validates the result, and is retry-safe or rolls back. Import validates IDs, scopes, duplicate policy, size limits and unsafe paths before activation. Local/cloud transfer is explicit; no automatic bidirectional sync is promised.

## C09 — Mode and product boundaries

Local mode runs without hosted account/model calls after required installation and package download. Connected coding agents may still need their own model service. AgentCarry's offline storage/retrieval does not imply the entire agent works offline.

Optional hosted MCP serves knowledge/private memory after authentication. It cannot inspect local code, intercept all conversations or use external editing software by itself. Setup must identify additional instructions/hooks/tool connections required for each client.

Website and cloud are separate milestones, not prerequisites for the local proof. All seven clients remain targets; Gemini CLI, OpenCode and Antigravity take priority. No adapter is advertised as automatic or supported before its measured capability and versioned tests are recorded.
