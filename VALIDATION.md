# Validation plan and traceability

Status: product acceptance specifications; no complete product acceptance gate has executed. Partial synthetic research results are recorded below.

| ID | Scenario and pass condition | Earliest gate |
|---|---|---|
| V01 | Setup preserves unrelated config, reports owned changes, and rollback restores owned prior state without erasing later user edits | P3 |
| V02 | Local record read/write and installed knowledge retrieval work with network disabled, no platform account and no separate model key | P2 |
| V03 | Two processes updating one task: exactly one expected-revision update wins; loser receives conflict without data loss | P1 spike; P2 integration |
| V04 | Kill writer at persistence stages: previous or complete committed bundle recovers, no half-published evidence/checkpoint references | P1 spike; P2 integration |
| V05 | Same-project divergent session tips return conflict; unrelated newer checkpoint never silently replaces selected lineage | P2 |
| V06 | Cross-branch/worktree and dirty-file changes are flagged; unavailable code observations return unknown | P2 |
| V07 | Client-supplied evidence cannot request observed origin; not_run/failed remain intact through summaries | P2 |
| V08 | Delete event containing synthetic secret: derived indexes/drafts no longer expose it; report external export limitation | P2 |
| V09 | Schema upgrade/import rejection leaves originals unchanged; successful retry does not duplicate records | P2 |
| V10 | Labeled retrieval set: expected source in top five for each answerable case, no deliberately incompatible/withdrawn result; unknown version yields uncertainty | P2 |
| V11 | Fresh client B recovers goal, decision, failed attempt, pending action and exact evidence origin/outcome from client A; inspect actual code before work | P3 |
| V12 | Force abrupt session termination; recover last acknowledged checkpoint, report missing later work without invented capture | P3 |
| V13 | Skill draft preserves conditions/evidence, stays project-private, and needs explicit promotion; failed extraction leaves prior knowledge intact | P3 |
| V14 | Stale/withdrawn pinned package warns; online withdrawal known status excludes automatic retrieval; offline status labeled last-known | P2 local; P5 hosted |
| V15 | Hosted account A cannot read/write account B; private cloud/model upload absent until enabled; quotas fail explicitly | P5 |
| V16 | Every supported client records exact product/version/OS and capture level; repeat V01/V11/V12 for each relevant integration | P3/P4 |
| V17 | Untrusted package content cannot cause automatic execution; unsafe archive paths and workspace symlink escape are rejected | P2 |

## Evaluation fixture

Build at least 20 synthetic retrieval cases spanning relevant match, incompatible version, unknown version, withdrawn content, conflicting guidance and no-answer. Freeze expected sources before testing. Report counts by category, failures, latency, returned context size and corpus/package versions. This is a regression gate, not proof of general retrieval quality.

Run paired handoff tasks against plain checkpoint files as a baseline. Record missing facts, repeated failed attempts, manual interventions, tool calls and model/network costs. No performance superiority claim without results.

## Gates

P1 validates technical feasibility and records decisions; a spike is not shipped compatibility.
P2 proves core local operations with fixtures/CLI, without requiring real-agent lifecycle or skill extraction.
P3 proves first-pair real-agent handoff and learning.
P4 adds each remaining client only when tested; unsupported capabilities remain explicit.
P5 proves website/optional cloud boundaries.

Every result records commit, environment, command/procedure, outcome and limitations. Markdown link checks are documentation checks only.

## Partial research results

[Storage/schema experiments](spikes/phase1/SCHEMA-RESULTS.md) and [retrieval experiment](spikes/phase1/RETRIEVAL-RESULTS.md) exercise subsets of V03/V04/V07–V10/V14 using synthetic fixtures. These results do not mark the corresponding product integration cases complete. Latest local Linux suite: 28 tests passed; retrieval: 26 fixed cases passed. Separate user-supplied Windows evidence covers the earlier 21 storage tests. New retrieval tests await Windows reproduction.
