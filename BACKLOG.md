# Phased backlog

All runtime work is pending. Check boxes indicate completed deliverables, not approval.

## Phase 0 — Foundation

- [x] Document product requirements, boundaries, architecture direction and decisions.
- [x] Record competitor evidence and unresolved integration claims.
- [x] Define phased gates and initial compatibility matrix.
- [ ] Review and merge the documentation PR.

## Phase 1 — Technical spike and contracts

- [ ] Verify official client capabilities and select first two executable test integrations.
- [ ] Validate TypeScript runtime/dependency options, including Windows setup.
- [ ] Finalize schema versioning, IDs, evidence levels and state transitions.
- [ ] Prototype atomic writes, cross-process locks, optimistic revision conflicts and recovery.
- [ ] Choose a minimal full-text index after a representative fixture.
- [ ] Record results and lock implemented decisions.
Gate: local persistence survives interruption/conflicts; dependency choices justified; no unsupported compatibility promises.

## Phase 2 — Local vertical slice

- [ ] Implement core records, project isolation, schema validation and safe storage.
- [ ] Implement CLI init/status/doctor and local MCP operations.
- [ ] Add small owner-curated packages with provenance and compatibility metadata.
- [ ] Implement package pinning and bounded filtered retrieval.
- [ ] Implement tasks, events, checkpoints and freshness markers.
- [ ] Verify CLI/files access without MCP, without network or separate provider credentials.
Gate: end-to-end local journey passes PRD acceptance cases.

## Phase 3 — Handoff and learning

- [ ] Implement first two adapters with preview, backups and rollback.
- [ ] Test real sessions and cross-agent handoff, including abrupt interruption.
- [ ] Add evidence-linked private skill drafts and lifecycle controls.
- [ ] Add explicit correction, deduplication, retirement, deletion and export/import.
- [ ] Add optional budget/local model jobs with data scope and budget limits.
Gate: useful draft preserves evidence; no automatic public publishing; handoff results documented.

## Phase 4 — Remaining targets and evaluation

- [ ] Extend Cursor, Gemini CLI, Antigravity and Manus according to capability findings; update order if first pair differs.
- [ ] Publish exact tested versions/OS and unsupported modes.
- [ ] Evaluate retrieval relevance, grounding and continuity against plain files and selected alternatives.
- [ ] Report token/context size, latency, setup friction and actual costs.
Gate: only tested integrations advertised; unresolved targets remain clearly labeled.

## Phase 5 — Website and optional cloud

- [ ] Build human browsing and guided setup website.
- [ ] Choose cloud provider, authentication and authorization approach.
- [ ] Implement hosted MCP, scoped storage, quotas, retention/deletion and export.
- [ ] Support hosted knowledge with private local memory.
- [ ] Test tenant isolation and local/cloud transfer; avoid silent sync.
Gate: hosted operating costs bounded; no cross-project/account leakage; local remains independently usable.

## Release readiness

- [ ] Decide license; review redistribution of third-party knowledge.
- [ ] Document install/uninstall, backups, migration and data locations.
- [ ] Verify package integrity and unsafe-path handling.
- [ ] Release only after reproducible setup and explicit limitations.
