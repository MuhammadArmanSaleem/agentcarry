# Unresolved choices and evidence gates

Status: explicit uncertainty register. No row represents an implemented capability.

| Question | Current position | Evidence/decision required before |
|---|---|---|
| Runtime and dependency versions | Local preview executes erasable TypeScript with Node 24.22.1 built-ins; strict static checking added (TYPECHECK.md); packaging and production support open | P1 installation/packaging spike including Windows |
| Authoritative persistence | SQLite leading candidate; user-provided Windows synthetic results supplement Linux runs; product schema/recovery remain open | P1 crash, concurrent writer and multi-record recovery tests |
| First two clients | Gemini CLI/OpenCode prioritized; Antigravity next; other clients later | Documentation checked; actual client/version execution still needed |
| Capture automation | Manual/instruction/hook levels defined in CONTRACTS | P3 actual lifecycle observations; no time-loss guarantee otherwise |
| Package verification cadence | Per-package policy required; intervals not chosen | First published package |
| Quota/retention defaults | Preview requires explicit max_bytes/retention_days, no default values or automatic pruning; release defaults open | First persistent MVP release |
| Cloud provider and auth | Undecided | P5 identity/tenant isolation/cost spike |
| Cloud pricing/limits | No free-unlimited promise | P5 measured storage/request/inference budget |
| External model providers | Optional, explicit configuration | Provider integration and failure/budget tests |
| Trusted evidence collector | Absent in initial prototype | Separate authenticated ingestion design/tests |
| Manus/local bridging | Unknown; no filesystem assumption | Manus adapter feasibility gate |
| License/redistribution | No license selected; sources retain own terms | Before distribution/reuse of third-party content |

Resolve technical choices using evidence and record in DECISIONS.md. Ask the developer when a choice changes product scope, cost commitment or privacy expectations; routine technical choices within approved requirements do not need repeated approval.

