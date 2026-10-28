# Decision records

Record concise engineering rationale, not private conversation transcripts. Date: 2026-10-25.

## D001 — Knowledge and continuity boundary
Status: accepted product direction.
Decision: AgentCarry provides guidance, records, retrieval, and continuity; coding agents execute work.
Reason: Focus on portable knowledge and handoffs.
Alternative: Build an autonomous execution platform.
Consequence: Check execution and software integrations remain external.
Evidence: Requirements discussion; no implementation evidence.

## D002 — Local default, optional cloud
Status: accepted product direction.
Decision: Local continuity works without an account or required separate model. Cloud is optional; hosted knowledge with local memory is permitted.
Reason: Cost control, ownership, and portability.
Alternative: Mandatory hosted memory.
Consequence: Guided local installation is necessary; hosted MCP is an optional path, not the only onboarding path.
Evidence: Requirements discussion; offline behavior pending tests.

## D003 — Shared contracts and target adapters
Status: accepted product direction.
Decision: Shared packages and project memory across Claude Code, Codex, Cursor, Gemini CLI, Antigravity, Manus.
Alternative: Isolated per-agent stores.
Consequence: Thin adapters; support requires versioned tests. Start verification with two clients.
Evidence: Targets agreed; actual client capabilities remain unverified.

## D004 — Curated packages and private learned drafts
Status: accepted product direction.
Decision: Owner-curated public packages; work-derived Markdown skills remain private drafts until explicit validation/promotion.
Reason: Control quality while allowing reusable learning.
Alternative: Automatic public publishing/community submissions from launch.
Consequence: Need provenance, lifecycle, correction and review mechanisms.
Evidence: Product discussion; extraction not implemented.

## D005 — Guidance and reporting by default
Status: accepted product direction.
Decision: Agents/CI run checks; AgentCarry supplies procedures and records results. Enforcement is explicit per project.
Reason: Subjective engineering principles require judgment.
Consequence: Never represent docs as technical merge enforcement.
Evidence: Product discussion; CI integrations pending.

## D006 — Optional cheaper-model delegation
Status: accepted product direction.
Decision: Active agent retains important reasoning; optional configured models handle routine summaries/documentation/draft extraction.
Alternative: Mandatory platform-paid inference.
Consequence: Separate provider credentials may be required; no assumption of subscription API access.
Evidence: Product discussion; providers/budgets pending.

## D007 — TypeScript and inspectable local records
Status: proposed technical direction.
Decision: Prefer TypeScript core/CLI/MCP, Markdown/JSON sources of truth, rebuildable full-text index, Next.js website later.
Reason: Shared types and a lightweight implementation path.
Alternatives: Python core; mandatory vector database.
Consequence: Verify runtime, dependencies, Windows packaging and concurrent storage before locking.
Evidence: Design discussion only; technical spike pending.

## D008 — Documentation-first delivery
Status: accepted workflow.
Decision: PRD, architecture essentials/details, research, decisions, shared instructions, phased backlog and compatibility matrix precede implementation.
Reason: Maintain context and reviewable scope across sessions.
Consequence: Update affected docs with meaningful implementation changes.
Evidence: Foundation documentation prepared; runtime remains absent.

## Template

ID/title; date; status (proposed/accepted/implemented/superseded); decision; rationale; alternatives; consequences; verification evidence; replacement reference if superseded.

## D009 — Explicit behavioral contracts and phased validation
Date: 2026-10-25. Status: accepted foundation revision; implementation pending.
Decision: CONTRACTS.md defines identity/scoping, checkpoint lineage/conflicts, capture acknowledgement and capability limits, evidence fields, package maintenance, skill promotion, deletion and recovery. VALIDATION.md maps tests to separate phase gates; OPEN-QUESTIONS.md preserves unresolved choices.
Reason: Avoid latest-checkpoint ambiguity, unsupported automation claims and circular phase gates.
Alternatives: Leave behavior to each adapter or infer latest-wins.
Consequences: More precise implementation obligations; no invented product guarantees. Capture defaults and quota periods still require resolution.
Evidence: Documentation review only; no runtime results.

## D010 — Persistence preference remains evidence-gated
Date: 2026-10-25. Status: proposed; refines D007 persistence preference.
Decision: Compare journaled files with SQLite authoritative storage plus readable export. Preserve portability and inspectability regardless of implementation.
Reason: Atomic single-file replacement does not establish multi-record recovery or crash durability.
Consequence: No file-lock implementation selected before P1 failure/concurrency tests.
Evidence: Design gap identified; spike pending.

## D011 — SQLite is the leading persistence candidate after initial spike
Date: 2026-10-25. Status: proposed implementation direction; P1 incomplete.
Decision: Prefer SQLite transactional storage plus readable export for P2, subject to Windows, schema/migration/deletion gates. Built-in node:sqlite was exercised on Node 24.22.1 without external dependencies; production runtime is not locked.
Alternatives: Append-only file journal with cross-process lock and recovery tooling.
Reason: Ten local spike tests passed; SQLite recovered and accepted writes after process termination. The deliberately minimal journal required lock recovery.
Consequences: Avoid hand-building a recovery protocol unless further evidence justifies it. FTS5 remains a candidate after only a two-row smoke test. Spike is JavaScript, not typechecked TypeScript production code.
Evidence: spikes/phase1/storage.test.mjs and spikes/phase1/README.md. No real-agent, power-loss or Windows proof; no production acceptance case completed.


## D012 — Prioritize Codex, Gemini CLI and Antigravity
Date: 2026-10-25. Status: superseded by D013; retained as decision history.
Decision: First validate Codex CLI <-> Gemini CLI; next Codex <-> Antigravity IDE/App, recording the exact installed surface. Keep Antigravity CLI separate and retain Claude Code as a later compatibility target.
Reason: Align the initial validation with available development tools.
Alternatives: Require Claude Code as the first receiving client.
Consequences: Different Google-client configuration and hooks require independent adapters; no subscription is needed solely to test Claude in the first milestone.
Evidence: Official Gemini/Antigravity documents reviewed in INTEGRATION-RESEARCH.md. No real-client run; optional manual baseline in MANUAL-HANDOFF.md.

## D013 — Prioritize accessible clients: Gemini CLI, OpenCode and Antigravity
Date: 2026-10-25. Status: accepted product priority; supersedes D012.
Decision: Gemini CLI, OpenCode and Antigravity are the high-priority integrations. First validate Gemini CLI <-> OpenCode, then both with the selected Antigravity surface. Codex, Claude Code, Cursor and Manus remain later targets.
Reason: Make the initial product useful with accessible client options and avoid requiring a paid subscription solely for validation.
Consequences: Add OpenCode as a target; independently implement config/plugin conventions. Keep shared knowledge and memory contracts client-neutral. Do not equate a free client with free/unlimited provider inference.
Evidence: User priority instruction; OpenCode official docs reviewed in INTEGRATION-RESEARCH.md. No live-client compatibility result.

## D014 — Evaluate FTS5 with deterministic metadata before adding retrieval dependencies
Date: 2026-10-26. Status: implemented research experiment; production choice remains proposed.
Decision: Exercise in-memory FTS5/BM25 after lifecycle, review-date, technology-major and package-pin filtering, using a frozen synthetic case set.
Alternatives: Add embeddings/reranking or external search before measuring a lexical baseline.
Consequences: No model/provider cost for this experiment; lexical overlap, fictional technology ranges and small corpus limit the evidence. Project-rule conflicts require explicit metadata; semantic contradiction detection is absent. The experiment does not finalize real package compatibility or maintenance policy.
Evidence: spikes/phase1/RETRIEVAL-RESULTS.md; 26/26 cases and combined 28/28 tests passed on Linux. Separate user-supplied Windows screenshots corroborate the earlier 21 storage tests at 93b3f6d, Node 24.22.1 / SQLite 3.53.4. They supplement D011's earlier Linux-only evidence without establishing power-loss durability or accepting SQLite. P1 remains incomplete.

## D015 — Start an unpublished local CLI continuity preview
Date: 2026-10-26. Status: implemented prototype choice; production acceptance pending.
Decision: Use Node 24.22.1 native TypeScript execution and built-in SQLite WAL/FULL behind a shared local core, with CLI transport first. No external runtime dependencies, cloud/model processing or global agent settings. This narrows D007/D011 for the development preview only.
Reason: Merged storage/retrieval research and user-provided Windows 33-test evidence support trying a usable local flow without accepting the complete production design. Separate CLI tests exercise task/checkpoint persistence and failure behavior.
Alternatives: Ship MCP and all adapters at once; add a mandatory compiler/runtime dependency before testing the flow.
Consequences: Unpublished checkout-only preview, requiring explicit init quota/retention. Local storage is bound to a canonical workspace and refuses copied/moved stores. No import/migration means synthetic data only. Static TypeScript checking, full schemas, real knowledge packages, MCP and live-client capture remain open; P1/P2 gates stay incomplete.
Evidence: initial 46-test Linux run and user-provided Windows 46-test/demo output; the latter did not show checkout commit or runtime versions. After review fixes, npm test 50/50 passed locally on Linux x64, Node 24.22.1 / SQLite 3.53.4; the revised code awaits Windows execution. No real coding agent was run. See LOCAL-PROTOTYPE.md.

## D016 — Explicit offline lookup for one curated draft
Date: 2026-10-27. Status: local preview implemented; publication/registry pending.
Decision: Bundle one small source-linked general web accessibility draft and search it explicitly with in-memory FTS5; show review/expiry, fixed package and section digests, untrusted guidance and unknown registry state. Reject unsupported library-specific compatibility and unavailable pins without substitution.
Reason: Provide actual useful source-backed guidance while testing the existing local-first baseline without provider accounts or extra inference.
Alternatives: Treat synthetic corpus as product guidance; auto-download current libraries; require embeddings or hosted service.
Consequences: No installation/updates, authenticity signature, semantic conflict handling, registry withdrawal knowledge or automatic agent consultation. The draft is not a published package; repository license remains unresolved. Short same-author evaluations are not general quality proof. Source review deadline is a proposed maintenance date, not a guarantee of up-to-date information.
Evidence: 24/24 labeled cases and 56/56 combined tests passed on Linux x64, Node 24.22.1 / SQLite 3.53.4. Specific W3C/MDN pages were inspected on 2026-10-27; no automated conformance review. See KNOWLEDGE-PREVIEW.md. P1/P2 remain incomplete.


User-provided Windows x64 output at commit 6d7d03fb59ba0206980a8098e9f3086f14c77e6f, Node 24.22.1 / SQLite 3.53.4: npm test 56/56, eval:knowledge 24/24, and reduced-motion search returned source-linked guidance. This is not a real-agent integration or production durability test.


## D017 — Local MCP transport preview
Date: 2026-10-28. Status: experimental; limited user-reported manual client handoff.
Decision: Use the pinned official MCP TypeScript server SDK and Zod for local stdio, with one explicit startup workspace and four bounded tools that invoke the existing CLI. The existing CLI remains independently usable without MCP.
Alternatives: Implement protocol framing by hand; duplicate storage logic in MCP; expose a network server.
Consequences: MCP requires npm dependencies and starts a local CLI subprocess per call. No config installer, background capture, real-agent compatibility or cloud service is claimed. A trusted client can access the explicitly selected workspace. Static typechecking and full integration remain open.
Evidence: Linux Node 24.22.1, one simulated MCP handoff test and 57/57 full tests; user-reported Windows tests and a limited actual-client handoff are documented in MCP-REVIEW.md; broad compatibility remains unverified.


D017 follow-up: the MCP transport now runs CLI subprocesses asynchronously, propagates request cancellation and reports potentially unknown write outcomes. A Linux test covers retry after simulated acknowledgement loss; see MCP-REVIEW.md. This does not establish full cancellation or process-tree behavior.


## D018 — Explicit strict checking for the existing TypeScript runtime
Date: 2026-10-28. Status: implemented with user-reported Windows checks; review fixture follow-up pending Windows.
Decision: Pin TypeScript 7.0.2 and @types/node 24.19.2 as development dependencies, with strict/noEmit/NodeNext/erasableSyntaxOnly checking for src/**/*.ts. Keep native Node runtime execution and existing JavaScript research/tests.
Reason: Native stripping does not validate types; compiler checking identified incorrect MCP SDK cancellation wiring (ctx.signal instead of ctx.mcpReq.signal).
Alternatives: Keep runtime-only checks; introduce a compiled distribution now; silence the SDK error with any or suppressions.
Consequences: No runtime compiler requirement or new model cost. The native compiler uses platform-specific optional packages; user-provided Windows installation/typecheck output passed before the review fixture follow-up. Existing explicit any at JSON/storage boundaries remains a limitation, not full schema typing. Packaging/CI remain separate.
Evidence: Linux clean npm ci, typecheck passed, 63/63 runtime tests, npm audit reported zero vulnerabilities. New cancellation protocol test fails with the old property and passes with the corrected one. See TYPECHECK.md. User-provided Windows branch output subsequently reports installation, typecheck and 63/63 tests before fixture review corrections. No real-client cancellation UI claim for this change.


## D019 — Preview project-local client configuration before implementing writes
Date: 2026-10-28. Status: read-only prototype; apply/rollback pending.
Decision: Add a CLI-only setup-preview for selected Gemini/OpenCode v2 project JSON settings, emitting only the owned entry fragment and conservative conflicts. Never expose unrelated config values or modify files in preview. Explicitly reject JSONC and legacy owned-entry ambiguity.
Reason: Reduce manual assembly of executable/workspace paths while avoiding premature config mutation without preservation/rollback support.
Alternatives: Auto-edit global settings; output entire existing settings including credentials; treat generated snippets as completed installation.
Consequences: Store initialization, global/environment precedence, project trust, actual connectivity and version checks remain separate. Local filesystem ownership is still the boundary. A future apply must revalidate rather than trust this mutable preview. No dependency or cloud/model requirement is added.
Evidence: Linux Node 24.22.1 typecheck, four setup cases and combined 67/67 tests; no Windows or coding-client execution for this change. See SETUP-PREVIEW.md.
