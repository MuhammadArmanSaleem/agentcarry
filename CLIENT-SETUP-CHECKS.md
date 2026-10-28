# User-reported client setup checks

Date recorded: 2026-10-28. Evidence source: user-supplied Windows Command Prompt output, not execution observed by the assistant. These are basic local stdio setup checks using disposable, initially empty client configuration in one initialized temporary workspace. Private paths, identities and transcripts are omitted.

The procedure followed a pull of main after PR #8 merged. The precise HEAD, Node version and SQLite version were not printed during these client checks. Separately, user output explicitly fast-forwarded to 9a68d6b and showed typecheck, 81/81 tests with no skips and the synthetic setup demo passing after the lock-recovery correction.

| Client | Version evidence in this setup check | Results |
|---|---|---|
| Gemini CLI | Not printed; earlier sessions reported 0.65.0 and later 0.66.0, which do not establish this run's version | Preview, apply, connected listing after explicit user trust override, rollback, no servers listed, backup forgetting with backup_contains_config:false |
| OpenCode | v2.1.4 printed during this run | Preview, apply, first listing found no servers, unchanged config inspected, repeated listing connected, rollback, no servers listed, backup forgetting with backup_contains_config:false |

Gemini initially detected but disabled the server in an untrusted workspace. The user enabled a process-environment trust override for the check and later cleared it explicitly. AgentCarry did not configure trust. OpenCode's initial missing-server result followed by a connected result is unresolved; no specific startup-race/cache cause is established.

Both configurations invoked the checkout's MCP source with an explicit workspace and absolute Node executable, including source paths with spaces. Rollback removed configuration created by each operation. Backup forgetting reports logical body removal, not physical erasure.

No real-client existing-config preservation, tool invocation through the newly installed entries, abrupt session lifecycle, automated capture, global-settings precedence or broad compatibility was established by this procedure. Earlier manual Gemini-to-OpenCode continuity is separate evidence in MCP-REVIEW.md. The new guided wizard was not used in this check. Full V01/V11/V12/V16 and P1/P2/P3 acceptance remain open.
