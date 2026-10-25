# PR #2 code review

Reviewed baseline: 212a8280114f8310b53ad834a7bbfd04e19a5c00 against cd869184ee0cdf06fbfd4f3df49568c0d5b6cd1a on 2026-10-26. Reviewed all 31 changed files: research modules/tests, fixtures, manual handoff procedure/template and requirements/status/integration documents. This review was performed by the implementing assistant, not an independent reviewer. No merge was performed.

## Findings and corrections

| Severity | Finding | Correction and evidence |
|---|---|---|
| High | migrate() can overwrite an existing SQLite backup destination | Reproduced with a synthetic existing database: previous code did not reject. Reserve a new destination with exclusive creation before backup. Regression checks preserve existing bytes and reject the source path. |
| Medium | Retry-token lookup reads inherited properties such as constructor/toString | Reproduced failures in both backends. Use Object.hasOwn; tests cover constructor, toString and __proto__, successful retry and changed-payload rejection. |
| Low | Case hashes differ on LF versus CRLF despite identical parsed cases | cases_hash now hashes parsed JSON serialization; cases_file_hash preserves raw-file identity. Regression proves line-ending stability and detects changed expected results. |
| Low | Current status summaries omit later Windows results | Record user-supplied 28/28 test and 26/26 evaluation output at 212a828 separately from Linux execution. Ignore SQLite rollback-journal artifacts as well as database/WAL files. |

Also closed a documented test gap: a separate SQLite connection commits between backup completion and migration lock acquisition. Migration rejects without losing the write; retry with a fresh destination preserves and indexes both drafts. This tests that boundary, not every possible concurrent-backup schedule.

## Validation of corrections

- npm run test:spike: 33/33 passed locally, Linux x64, Node 24.22.1 / SQLite 3.53.4.
- npm run eval:retrieval: 26/26 cases passed; 13/13 expected-source hits; zero prohibited results.
- Changed JavaScript syntax and relative Markdown links checked before push.
- Windows evidence predates these corrections. Rerun both commands after pulling the review commit; expect 33 passing tests and 26 passing evaluation cases. No install is needed.

## Assessment and remaining limits

No other merge-blocking defect identified within the documented synthetic research scope after these corrections. This is not production approval or an independent audit. P1 remains incomplete; SQLite and FTS5 remain proposed. Real client adapters, complete schemas, project/workspace security, packaging, capture, import/export and real-corpus quality remain open.

Backups remain sensitive. Exclusive creation prevents accidental replacement of existing destinations, not hostile mutation of the containing directory. Failed attempts can retain partial files; migration is not tested under power loss or termination during backup. The journal remains deliberately minimal, including stale-lock recovery and physical deletion gaps. Tests validate bounded synthetic payloads, not arbitrary user records. The retrieval clock and technology ranges are fixture-specific, and semantic contradictions are not detected.
