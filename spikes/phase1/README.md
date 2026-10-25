# Phase 1 research harness

Status: isolated feasibility spike, not a production storage API, CLI, MCP server or adapter.

Run from repository root with Node 24.22.1:
```sh
npm run test:spike
```

No npm install, model credential or network request is needed for these tests. package.json is private to prevent accidental publishing. The harness uses built-in node:sqlite and node:test; production TypeScript compiler and packaging dependencies remain undecided. Node built-in type stripping does not typecheck code. Spike files intentionally use JavaScript modules.

## Observed results

Environment: Linux x64, Node v24.22.1, SQLite 3.53.4. Ten tests passed locally on 2026-10-25. Process-kill tests synchronize through IPC before terminating the writer. These exercise process termination, not physical power loss.

| Experiment | SQLite WAL/FULL | Minimal append journal |
|---|---|---|
| Whole bundle and idempotent retry | Passed | Passed |
| Same token with changed payload | Rejected | Rejected |
| Stale revision | Rejected | Rejected |
| Two processes racing revision zero | One winner | One winner; loser can see lock contention |
| Kill before commit / partial append | Prior bundle recovered; subsequent write works | Prior bundle readable; stale lock prevents subsequent write |
| Kill after commit/fsync | New bundle recovered; subsequent write works | New bundle readable; stale lock prevents subsequent write |
| Injected precommit exception | Rollback then retry passed | Not tested |
| Rebuildable FTS5 index | Passed synthetic two-row smoke | Not implemented |

The journal deliberately fails closed instead of guessing lock ownership after death. It is not a full-featured journal implementation. Results do not prove that every file-journal design fails or that SQLite is inherently faster.

SQLite prototype keeps a complete task/evidence/checkpoint bundle in one JSON row. It does NOT prove normalized multi-table references, schema migration, deletion, project authorization, path safety, code freshness, skill extraction, quota handling, or real-agent handoff. No VALIDATION.md product acceptance case is marked fully passed from this harness.

Recommendation: proceed with a SQLite-backed P2 design plus readable JSON/Markdown export, pending Windows and schema/migration/deletion gates. FTS5 is a candidate, not a selected retrieval solution: this smoke is not the required labeled relevance fixture.

Windows/macOS and actual Claude/Codex sessions were not tested. Neither CLI is installed in this environment. No hooks were installed, accounts accessed, model calls made, or global agent settings changed.

## Limits and follow-up

- WAL/FULL requests SQLite durability semantics; storage hardware, filesystem and directory durability require further validation.
- Failure recovery must be tested with normalized tables and real foreign-key/transaction boundaries in P2.
- File journal lacks automatic stale-lock recovery, torn-tail repair, compaction and robust deletion. Adding those is engineering cost, not impossible.
- Test fixtures use bounded synthetic payloads. This spike does not validate arbitrary user records.
- Run tests on Windows Node 24.22.1 before claiming platform readiness. Production minimum Node version remains open.
- Retention/deletion and SQLite WAL remanence need an explicit policy; logical deletion alone is not physical erasure.


## Later results and review

The ten-test results above are the original Linux run, not the current suite total. See [schema results](SCHEMA-RESULTS.md), [retrieval results](RETRIEVAL-RESULTS.md) and [PR review](PR-REVIEW.md) for subsequent work. User-provided Windows output at 212a828 reports 28/28 tests and 26/26 retrieval cases passing. Latest review corrections pass 33/33 tests locally on Linux and await Windows rerun. SQLite/FTS5 remain proposed and P1 incomplete.
