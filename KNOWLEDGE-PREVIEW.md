# Local web accessibility knowledge preview

This is a small owner-curated draft for explicit lookup, not a published registry or verified coding-agent integration. It contains six original summaries of linked W3C WAI and MDN guidance: reduced motion, visible focus, form labels, validation errors, text contrast and keyboard operation. It is general web guidance; specific library/browser compatibility and complete WCAG conformance are not verified.

## Try it

Use Node 24.22.1 from the repository checkout:

```
npm run local -- search "reduced motion animation"
npm run local -- search "form validation errors"
npm run test:knowledge
npm run eval:knowledge
```

Search accepts one quoted query (maximum 500 characters) and works without an initialized project store. The CLI is available from other folders using the absolute path to `src/cli.ts`. It reads the bundled draft only and makes no network or model calls. There is no automatic consultation, download, installation, private-memory search or MCP server in this change.

For tools that need an exact package pin or wish to declare a library, `search-json` accepts JSON on stdin, for example `{ "query": "motion", "pin": "0.1.0" }`. Optional `library`/`library_version` fields cause `unknown_compatibility` and no results because this package has not assessed specific versions. A missing requested pin returns `pin_unavailable`; the code never substitutes another version. The ordinary `search` command is explicitly general web guidance, so it does not assert library compatibility.

Results include draft status, source URLs, package and section hashes, review date, review deadline and untrusted-guidance label. Project-rule conflict detection is not implemented and is reported as not assessed; apply the user's/project's rules and review any apparent conflict. The locally recorded source review is not proof of live upstream status. No registry has been checked, so `registry_status` is `not_checked` and the last check is null. A past review deadline returns `stale` with no guidance; a future review date returns unknown. The curator's proposed next review deadline is 2027-01-27; updating it requires reviewing upstream sources and changing the draft version rather than silently changing this one.

The integrity digest covers the entire parsed package, including sources and metadata, and is independent of checkout line endings. It detects accidental changes relative to this code; it does not authenticate a publisher against an attacker who can edit both files. The summaries were written for this repository after reviewing upstream pages; no upstream article text was bundled. Repository license/redistribution terms remain unresolved. Review before distributing this draft.

## Evaluation and limitations

[knowledge-cases.json](test/knowledge-cases.json) holds 24 labeled cases: 18 relevant, two no-match, and four uncertainty/pin/freshness cases. On Linux x64, Node 24.22.1 / SQLite 3.53.4, `npm run eval:knowledge` passed 24/24; all 18 expected sections appeared in the top five. One run measured median 0.633 ms, p95 1.441 ms and maximum JSON response 2,507 bytes. Timings are a small in-memory experiment and vary by machine; they are not production latency measurements.

This is a same-author, small, lexically overlapping dataset, authored while implementing the search. It is a regression fixture, not an independent or held-out benchmark. Keyword OR search may return unrelated matches or miss paraphrases; it cannot infer project context or detect semantic conflicts. Top-five on six sections is a weak relevance measure. Broader real-world queries, version-aware metadata, withdrawal checks, project rules and answer grounding remain open. No P2 acceptance gate is completed by these results.

At this revision, `npm test` passes 56/56 on Linux; the six new tests and real-knowledge evaluation have not yet been run on Windows. The user separately reported 50/50 tests and the continuity demo passing on Windows after the PR #3 fixes; that pasted output did not include the checkout commit/runtime versions. Static TypeScript checking, packaging and current-node support remain open.
