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

[Storage/schema experiments](spikes/phase1/SCHEMA-RESULTS.md) and [retrieval experiment](spikes/phase1/RETRIEVAL-RESULTS.md) exercise subsets of V03/V04/V07–V10/V14 using synthetic fixtures. These results do not mark the corresponding product integration cases complete. Latest local Linux suite: 28 tests passed; retrieval: 26 fixed cases passed. User-provided Windows output at 212a828 covers 28/28 tests and 26/26 retrieval cases. Latest review fixes pass 33/33 tests locally on Linux and await Windows rerun; see [PR review](spikes/phase1/PR-REVIEW.md).

## Local CLI preview results

Seventeen tests in [test/local.test.mjs](test/local.test.mjs) exercise fresh-process task/checkpoint recovery, V03/V04 races/termination, V05 lineage conflicts, V06 code observations, V07 check labels, V08 removal of dependent copies and quota/retention handling. npm test: 50/50 passed on Linux x64 with Node 24.22.1 / SQLite 3.53.4. The Node temporary-folder demo passed. User-reported Windows output covers the earlier 46-test PR version and demo; the review fixes and actual coding agents await verification. These subsets do not satisfy full P2 or P3 gates. See [LOCAL-PROTOTYPE.md](LOCAL-PROTOTYPE.md) for boundaries and exclusions.

## Local knowledge preview results

[KNOWLEDGE-PREVIEW.md](KNOWLEDGE-PREVIEW.md) records a 24-case same-author regression against six real, source-linked draft summaries: 18/18 expected sections in top five, 24/24 checks passed on Linux. These cases partly exercise V10/V14 but are not independent and do not complete the product gates. Full suite: 56/56 Linux. The user separately reported 50/50 tests and the local continuity demo on Windows after the prior review; the new knowledge change was subsequently run on Windows as recorded below.


User-provided Windows x64 output at commit 6d7d03fb59ba0206980a8098e9f3086f14c77e6f, Node 24.22.1 / SQLite 3.53.4: npm test 56/56, eval:knowledge 24/24, and reduced-motion search returned source-linked guidance. This is not a real-agent integration or production durability test.


## Setup write/recovery preview evidence

[SETUP-APPLY.md](SETUP-APPLY.md) records partial V01 coverage with synthetic configs: exact original-byte restoration, preserving later unrelated values, owned-entry conflict refusal, stale/forged plan rejection, private bounded backups, idempotent retry, scoped forgetting/replay protection and process contention/interruption followed by explicit recovery. Linux suite 80/80 and disposable CLI demo passed. Windows, real-client behavior and full installer preservation/rollback remain unqualified; no product gate is completed.


Setup review follow-up: user-provided Windows output reports typecheck, 80/80 tests with no skips, and the disposable setup demo passing for both clients before the review correction. Concurrent abandoned-lock recovery is now serialized; Linux typecheck, 14/14 focused tests, 81/81 full tests and demo passed after that correction. Windows reproduction of the correction and real-client setup remain pending. See [SETUP-APPLY-REVIEW.md](SETUP-APPLY-REVIEW.md); no gate is completed.



## Guided setup partial coverage

[SETUP-WIZARD.md](SETUP-WIZARD.md): Linux typecheck, 10 focused tests, 91 full tests and setup demo passed, plus a pseudo-terminal install/Ctrl+C smoke. Covers explicit confirmation/cancellation, initialization boundaries, both client flows, metadata-only operation selection, stale previews and machine-interface preservation. Windows terminal validation is pending. [CLIENT-SETUP-CHECKS.md](CLIENT-SETUP-CHECKS.md) separately records user-provided Windows basic lower-level Gemini/OpenCode configuration connectivity/rollback/forget and 81-test correction evidence. This does not complete V01/V16 or any phase gate.

