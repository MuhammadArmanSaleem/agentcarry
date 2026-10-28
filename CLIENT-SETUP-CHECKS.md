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


## Guided wizard Windows checks

Date recorded: 2026-10-29. Evidence: user-supplied Windows 10 Command Prompt output from the guided-setup branch; exact checkout HEAD and runtime versions were not printed. Earlier output was reported as 91/91 tests passed; the visible separate typecheck invocation completed without errors. This is reported evidence, not assistant-observed Windows execution.

In an already initialized disposable workspace, OpenCode configuration through the wizard applied, the client listed the server as connected, menu undo returned rolled_back, the client then listed no servers, and menu forgetting returned forgotten with backup_contains_config:false.

In a fresh disposable workspace, cancellation returned cancelled and dir /a showed zero files. A subsequent wizard run selected explicit 1 MiB history and memory budgets and 30-day retention, separately confirmed initialization and configuration, and returned applied with initialized:true. OpenCode initially listed no servers; after inspecting the unchanged generated config, a second listing reported connected. Menu undo returned rolled_back, the client listed no servers, and menu forgetting returned forgotten with backup_contains_config:false. The initialized memory store remains after undo.

Invalid operation selection (an ID or out-of-range number) was rejected before the user selected list number 1. An invocation from the uninitialized repository refused with not initialized; the user returned to the intended disposable workspace and completed cleanup. Some pasted terminal lines overlap; the cause and native display behavior have not been established.

OpenCode v2.1.4 was printed in the preceding lower-level check, but was not reprinted for these wizard runs. Real-client preservation of existing unrelated config, tool invocation, Ctrl+C behavior on Windows, and complete V01/V11/V12/V16 remain unverified. Repeated initial missing-server listings remain unresolved; no cache/startup diagnosis or guaranteed retry is claimed.

Review follow-up: no blocking defect identified in the added wizard/control-flow changes within the documented preview scope. A local rerun passed typecheck, 91/91 tests with zero skips, and the synthetic setup demo. This does not resolve the real-client uncertainties above or complete any phase gate.


### Gemini wizard follow-up

User-supplied Windows 10 Command Prompt output on 2026-10-29 also shows the Gemini wizard applying configuration in the initialized disposable workspace. Gemini detected but disabled the server while the workspace was untrusted. A user-set terminal environment trust override allowed a connected listing; the user was instructed to clear the override afterward. The pasted clear command overlaps other output, so its execution is not independently established. AgentCarry did not change trust.

Menu undo returned rolled_back and Gemini then reported no configured MCP servers. Menu forgetting returned forgotten with backup_contains_config:false. Thus both clients completed the basic guided configure/connect/undo/forget journey. Gemini's exact version was not printed in this wizard run; tool invocation and broader lifecycle/compatibility remain unverified.
