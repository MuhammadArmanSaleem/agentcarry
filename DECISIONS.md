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
