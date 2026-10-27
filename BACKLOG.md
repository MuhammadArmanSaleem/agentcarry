# Phased backlog

An isolated Phase 1 research harness exists; product runtime and integrations remain pending. Check boxes indicate completed deliverables, not approval.

## Phase 0 — Foundation

- [x] Document product requirements, boundaries, architecture direction and decisions.
- [x] Record competitor evidence and unresolved integration claims.
- [x] Define phased gates and initial compatibility matrix.
- [x] Review and merge the documentation PR (#1).

## Phase 1 — Technical spike and contracts

- [x] Select first validation pair: Gemini CLI/OpenCode; Antigravity next, with IDE/App/CLI distinguished.
- [x] Review official Gemini CLI/Antigravity integration documentation.
- [ ] Verify exact installed versions and execute first-pair client tests.
- [ ] Validate TypeScript runtime/dependency options, including Windows setup.
- [ ] Finalize schema versioning, IDs, evidence levels and state transitions.
- [ ] Compare journaled files and SQLite plus export for atomic writes, cross-process conflicts, multi-record recovery and schema migration.
- [ ] Choose a minimal full-text index after a representative fixture.
- [ ] Record results and lock implemented decisions.
Gate: local persistence survives interruption/conflicts; dependency choices justified; no unsupported compatibility promises.

## Phase 2 — Local vertical slice

- [ ] Implement core records, project isolation, schema validation and safe storage.
- [ ] Implement CLI init/status/doctor and local MCP operations.
- [ ] Add small owner-curated packages with provenance and compatibility metadata.
- [ ] Implement package pinning and bounded filtered retrieval.
- [ ] Implement tasks, events, immutable checkpoint lineage, divergent-tip conflict responses and freshness markers.
- [ ] Implement exclusions, storage caps, private deletion including derived data, schema migration and validated export/import.
- [ ] Implement package freshness/withdrawal metadata and truthful offline status.
- [ ] Verify CLI/files access without MCP, without network or separate provider credentials.
Gate: P2 fixture/CLI checks V02–V10, V14 (local), V17 in VALIDATION.md pass. Actual-agent handoff and skill extraction belong to P3.

## Phase 3 — Handoff and learning

- [ ] Implement Gemini CLI and OpenCode adapters with preview, backups and rollback.
- [ ] Implement and validate the selected Antigravity surface next; do not infer CLI support from IDE/App tests.
- [ ] Test real sessions and cross-agent handoff, including abrupt interruption; document capture level, triggers and last acknowledged persistence.
- [ ] Add evidence-linked private skill drafts and lifecycle controls.
- [ ] Add skill correction, deduplication, retirement, explicit promotion and deletion propagation.
- [ ] Add optional budget/local model jobs with data scope and budget limits.
Gate: V01, V11–V13 and V16 for first pair pass; report remaining capture gaps. Useful drafts preserve provenance; no automatic public publishing.

## Phase 4 — Remaining targets and evaluation

- [ ] Extend Codex, Claude Code, Cursor and Manus; validate any remaining Antigravity surfaces separately.
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

## Phase 1 partial evidence

See [spikes/phase1/README.md](spikes/phase1/README.md), [INTEGRATION-RESEARCH.md](INTEGRATION-RESEARCH.md), and [SCHEMA-DRAFT.md](SCHEMA-DRAFT.md). Storage and retrieval experiments have partial Linux results; see the follow-ups below. Remaining P1 boxes intentionally stay open: complete schema/validators, TypeScript packaging, production migration/deletion behavior and versioned live-client integration are not verified.


## Normalized storage follow-up

See [schema experiment results](spikes/phase1/SCHEMA-RESULTS.md): eleven additional Linux tests cover scoped foreign keys, reported evidence, task transitions, backup/migration rollback and logical derived-data deletion, including a process race and terminated deletion. Combined suite: 21 passing tests. These are partial P1 experiments, not completed product acceptance gates. Separate user-supplied Windows screenshots show 21/21 tests passing and identify branch spike/phase1-storage-feasibility, commit 93b3f6d, Node 24.22.1 and SQLite 3.53.4. This is user-supplied evidence, distinct from the local Linux execution. Manual Gemini CLI/OpenCode inspection was reported without a test rerun or recorded client versions. P1 remains incomplete and SQLite remains proposed.

## Knowledge retrieval follow-up

[Retrieval results](spikes/phase1/RETRIEVAL-RESULTS.md): 26 fixed synthetic cases passed on Linux; 13/13 answerable source hits in the top five, zero prohibited results. Combined suite: 28 passing tests. Includes metadata filtering, exact package pins, unknown-version responses, explicit project-rule conflicts and source hashes. Fictional technologies and lexical overlap limit generalization; no real package is published. FTS5 remains a candidate. User-provided terminal output at 212a828 reports 28/28 tests and 26/26 retrieval cases passing on Windows x64, Node 24.22.1 / SQLite 3.53.4. Phase 1 remains incomplete.

## Final PR review follow-up

[PR review](spikes/phase1/PR-REVIEW.md) found and fixed backup-destination overwrite and inherited-property retry-token collisions. A parsed-JSON case fingerprint removes LF/CRLF comparison noise while preserving an exact raw-file hash. Added backup/write-race and regression coverage; latest local Linux suite 33/33, retrieval 26/26. Corrections await Windows rerun. Merge readiness applies only to this research PR, not P1 completion or production acceptance.

## Local continuity preview (partial P2 work)

[LOCAL-PROTOTYPE.md](LOCAL-PROTOTYPE.md) adds checkout-only init/status/doctor, scoped task revisions, immutable checkpoint lineage/resume, retry acknowledgements, explicit quotas/retention, delete/prune and readable export. Seventeen local tests plus 33 research tests pass on Linux (50 total); temporary-folder demo passed. User-provided Windows output reports 46/46 and the demo passing before the review corrections; the checkout commit/runtime versions were not shown in that output. The revised code awaits Windows reproduction. No P1/P2 gate is marked complete: full schema/typecheck/packaging, migration/import, real curated retrieval and MCP/adapters remain pending.
