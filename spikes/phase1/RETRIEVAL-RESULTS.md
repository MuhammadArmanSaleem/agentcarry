# Synthetic knowledge retrieval experiment

Research only. Phase 1 remains incomplete; no product retrieval service, real library guidance or agent integration is shipped.

## Run on Windows or Linux

With Node 24.22.1, run from the repository root:

```
npm run test:spike
npm run eval:retrieval
```

The first command currently runs 33 tests: twelve original-store, thirteen normalized-store and eight retrieval tests. The second prints a JSON report for 26 labeled cases and exits nonzero on evaluation failure. It includes category counts, source hits, prohibited results, response sizes, timings, environment and fixture hashes. There are no model calls, package downloads or network requests in this experiment; network-disabled installation/client acceptance is still pending.

## Fixture and method

[retrieval-fixture.json](retrieval-fixture.json) contains 14 owner-authored synthetic sections with fictional technology names, package versions, compatibility bounds, lifecycle and review metadata. The synthetic registry timestamp is test data, not a real upstream check. Content is a test fixture, not a published package or a claim of current engineering advice. Repository licensing remains undecided; no third-party prose is copied.

[retrieval-cases.json](retrieval-cases.json) defines expected sources/statuses before the first evaluation run. It covers frontend/design, database, API/security and CI/testing topics: nine relevant cases, three incompatible, three unknown-version, two withdrawn, one expired-review, two project-rule conflict/agreement, three no-answer, one unpublished-draft and two pinning cases. The same author wrote corpus, cases and implementation; this is a small regression set with strong lexical overlap, not an independent or held-out quality benchmark.

[retrieval.mjs](retrieval.mjs) filters status, review deadline, technology, major-version interval and optional exact package pins before constructing an in-memory FTS5 index. Literal query words are OR-combined; SQLite BM25 orders matches with source ID as a deterministic tie-breaker. No embeddings, reranker, language model or paid provider is involved. Sources are never executed.

The output contains at most five sections and 512 Unicode code points of body per section, full-body SHA-256, package version, synthetic source reference and review deadline. Hashes identify content; they do not authenticate a publisher. Unknown/non-exact/prerelease technology versions return unknown_compatibility without results. Pinned unavailable/incompatible content warns without substituting a new version. Missing, malformed or expired review dates exclude a section. Offline results are explicitly last-known and cannot detect later withdrawals.

Conflicts use explicit fixture rule_key/rule_value metadata compared with supplied project rules. They preserve both values and identify project authority. Semantic contradictions in prose or between packages are not detected.

## Observed Linux result

2026-10-26, Linux x64, Node 24.22.1 / SQLite 3.53.4: 26/26 evaluation cases passed; all 13 answerable cases found their expected source in the top five; zero prohibited results. One standalone run measured median 0.362 ms, p95 1.068 ms and maximum serialized response 1,042 bytes. Timings include per-query in-memory index construction, exclude retriever initialization, and combine answerable/early-return cases; they are not production latency estimates. Re-run for current values.

The complete test suite passed 28/28 on Linux. Existing user-supplied Windows screenshots cover the earlier 21-test suite at commit 93b3f6d, Node 24.22.1 / SQLite 3.53.4. Later user-provided terminal output at 212a828 shows 28/28 tests and 26/26 evaluation cases passing on Windows x64, Node 24.22.1 / SQLite 3.53.4. The latest review corrections bring the suite to 33 tests and await a fresh Windows run.

## Limits and next gates

Major-only intervals are deliberately simpler than real dependency ranges. Multiple dependencies, package manifests/signatures, curator review cadence, lockfile installation, human browsing, workspace/private-memory authorization and production corpus scale are not implemented. An empty pins map searches nothing; omitted pins searches the eligible synthetic corpus. Excerpt limits are not a total response-byte cap. No semantic answer generation/grounding, multilingual relevance or task success is evaluated. No-match means no literal match in this fixture, not proof that no answer exists.

FTS5 is a viable candidate for the local slice based on this limited regression evidence; final selection and P1 completion remain open alongside schema, packaging and live-client gates. Next: Windows reproduction, then close remaining runtime/schema gates before integrating the shared core with CLI/MCP.

Implementation reference: [SQLite FTS5 documentation](https://www.sqlite.org/fts5.html).

## Review corrections

case_hash reporting now uses parsed JSON serialization: cases_hash is independent of LF/CRLF checkout formatting (but not JSON object-key order); cases_file_hash retains the exact file-byte hash. This is a research fingerprint, not the product's unresolved canonical payload protocol. The fixed evaluation clock remains 2026-10-26, so fixture expiry cases stay reproducible; this helper is not a live freshness service. See [PR-REVIEW.md](PR-REVIEW.md).
