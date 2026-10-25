# Version 1 record schema draft

Status: proposed logical contract; not a finalized JSON Schema or implemented validator.

## Shared envelope

schema_version = 1 (integer); id/project_id = opaque generated UUID strings; created_at = UTC RFC3339 timestamp; author = client/product/version and optional session reference. Workspace-scoped records require workspace_id. Mutable tasks carry revision (nonnegative integer); immutable checkpoints/events carry parent IDs and do not use overwrites.

Reject unsupported schema versions, missing scope, invalid enum values and unknown privileged fields. Do not coerce malformed records or silently repair IDs. Each write includes idempotency_key; same key+same canonical payload returns prior result, changed payload returns conflict. Canonical serialization/hash design is a P2 prerequisite.

## Record-specific requirements

| Record | Required core | Cross-record validation |
|---|---|---|
| Project | id, schema_version, created_at | New versus attach is explicit |
| Workspace | project_id, workspace_id, canonical root identity | Canonical path approved; copying/cloning prompts identity choice |
| Session | project_id, workspace_id, session_id, client/version, started_at | Workspace belongs to project |
| Task | goal, acceptance_criteria array, state, revision, depends_on, blockers, evidence_refs | References remain in project; self/cyclic dependencies rejected |
| Evidence | task_id, origin, outcome, review, observed_code_state or explicit unknown | Initial writes only agent_reported/unreviewed; human review via separate authorized action |
| Checkpoint | session_id, workspace_id, parent_checkpoint_ids, task_refs, decisions, failed_attempts, unresolved, next_steps, code_state | Same-project references; no cycles; parent must exist unless explicit import validation |
| Skill draft | trigger, applicability, procedure, limitations, source_refs, evidence_refs, status=draft | Sources authorized; no implicit user/global/public promotion |
| Event | session_id, event_type, concise payload, evidence_refs | Immutable, project-scoped |

Task states: pending, in_progress, blocked, completed, cancelled. Proposed transitions: pending to in_progress/blocked/cancelled; in_progress to blocked/completed/cancelled; blocked to in_progress/cancelled; completed/cancelled reopen to in_progress only with reason. Every mutation requires expected_revision. These transitions remain proposals pending validator tests.

Code state: branch/commit may be null with reason non_git, unborn, unavailable. dirty_state is clean/dirty/unknown; file_fingerprints maps approved relative paths to hashes. Missing observation means unknown, not clean. Checks must bind to the observed state; timestamp alone cannot establish freshness.

## Not resolved by this draft

Canonical hashing, normalized SQLite DDL, authorization identity for human reviews, migration backup/retry rules, deletion dependency graph, timestamp bounds, quota and payload limits, task ID reuse policy and index schema. Finalization requires executable validators and failure fixtures, not only these tables.


## Executable partial experiment

[normalized.mjs](spikes/phase1/normalized.mjs) experiments with a subset of task/evidence validation, scoped references and task transitions. [SCHEMA-RESULTS.md](spikes/phase1/SCHEMA-RESULTS.md) records migration/deletion tests and exclusions. This does not finalize the schema or validate the full envelope, checkpoints, imports or authorization.
