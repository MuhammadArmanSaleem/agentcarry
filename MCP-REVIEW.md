# MCP preview review and manual handoff evidence

Status: reviewed for an unpublished local MCP development preview; not release acceptance. The following summarizes user-provided terminal and agent output; it was not independently observed on the user's machine. No private transcripts or local paths are recorded here.

## Evidence

- PR code tested: user pulled branch from a007ca3 to 4c134b8479424631de8a05cb485f010ca319a216 before running the checks. Windows Command Prompt output reported npm ci and npm audit with zero vulnerabilities and npm test 57/57. Exact Node and SQLite versions were not displayed in that run.
- The user reported Gemini CLI version 0.65.0 and OpenCode v2.1.4 before testing. During Gemini use an update message said a new version would be used on the next run; the exact Gemini version active during the handoff was not independently verified. The checkpoint's client/version values were supplied by the agent and are not independent version evidence.
- In a manually initialized temporary non-Git workspace, Gemini's MCP list showed the server connected. Gemini called search_knowledge and then create_task. A first save_checkpoint call was rejected for missing unresolved; a retry returned a checkpoint. The requested empty unresolved list was instead saved as ["none"]. The check remained not_run, agent_reported, unreviewed.
- OpenCode's configuration add reported success, but the first MCP list reported no servers. A later list reported connected. The cause is unknown. OpenCode then called resume_task and displayed the matching synthetic task and checkpoint, decision, failed attempt, next step and check labels. It reported unknown code freshness, appropriate for unavailable Git observation. The output was supplied by the user.
- This is an explicit prompted handoff in the same workspace. It does not demonstrate automatic capture, an actual interrupted session, code inspection, cross-device sync, full client support, safety against secret capture, or all acceptance criteria. P1/P2/P3 remain incomplete.

## Review findings and follow-up

1. **Write timeout ambiguity.** The original MCP wrapper used spawnSync with a 15-second timeout; the current wrapper is asynchronous. A process could commit before a timeout or response loss, so an error must not be interpreted as proof that no write occurred. Retry the *same token and exactly the same payload* and inspect the acknowledgement. A Linux test now simulates cancellation after a real CLI write committed and before acknowledgement, then retries the identical token/payload and verifies one task. The timeout branch is also tested with a slow subprocess; real-client lost responses remain unverified.
2. **Original blocking subprocess implementation replaced.** The wrapper now uses asynchronous subprocesses and forwards SDK cancellation signals. A Linux helper-level test checks another subprocess can complete while one runs, plus cancellation and timeout. Full concurrent MCP requests, slow Git, process-tree cleanup, client cancellation behavior and shutdown still need tests before production.
3. **Real-model input fidelity is imperfect.** Gemini initially omitted a required field and then replaced an empty list with a literal string. The application accepted the supplied string; the server did not independently verify the agent's intent. Improve instructions/confirmation and test empty lists and failure recovery without fabricating missing facts.
4. **Setup and compatibility are incomplete.** This run required manual project configuration, a temporary workspace trust setting for Gemini, and a retry of the OpenCode list command. Configuration preservation/rollback and guided setup are not implemented or tested. Repeat using exact recorded client versions, a fresh client/session and a representative Git project; do not infer the cause of OpenCode's initial empty list.
5. **Capture and privacy boundaries remain open.** Only explicit fields were saved; no automatic checkpointing, transcript access or redaction was verified. User-supplied client/version and reported checks are not independently authenticated. Session IDs are generated per checkpoint, not derived from the client's actual session. Tests must avoid real secrets and sensitive context.
6. **Verification gaps.** Test unknown or unavailable store, lost acknowledgement, fresh process handoff and abrupt client termination against last acknowledged write; exercise conflicting tips through real clients; run static TypeScript checking and assess MCP request size/protocol boundaries. The current automated MCP test uses simulated clients, not independent full client implementations.

These findings are classified below against the narrow preview scope. No merge or production acceptance is implied by the passing test or manual experiment.


## Updated Windows and resume evidence

User-provided output shows a pull to ef4b54c, npm ci reporting zero vulnerabilities and npm test 59/59 on Windows. A subsequent OpenCode resume display recovered the same task and checkpoint, preserving not_run/agent_reported/unreviewed and unknown freshness. Exact current client versions and the running background server's code revision were not displayed, so this does not independently prove the new server process was loaded. No additional record was requested.

The OpenCode call display included an extra token argument, which resume_task does not accept. A focused Linux protocol regression confirms the current server rejects a resume request containing token; 3/3 MCP tests passed after adding that assertion. Whether the client omitted/normalized that argument, its UI misrepresented it, or a different process/schema was used is unresolved. Do not claim this display proves unknown fields are accepted. A raw request or controlled fresh server connection would be needed to distinguish those cases. These output discrepancies do not establish storage corruption.


## Version follow-up

After the resume smoke test, the user ran version commands in the test workspace: Gemini CLI 0.66.0 and OpenCode v2.1.4. These identify the installed clients at that time. They do not retroactively authenticate the earlier Gemini session or the checkpoint's agent-supplied 0.65.0 label; the earlier update timing remains uncertain. No additional tool operation or implementation test was performed for this documentation update.


## Merge-readiness assessment — 2026-10-28

Recommendation: ready for user review and a merge decision as an unpublished, manually configured, synthetic-data local MCP preview. No known merge-blocking defect was identified in the reviewed changes within that narrow scope. This is the implementing assistant's code review, not an independent audit, and does not waive product acceptance gates.

Required corrections completed: replace blocking subprocess calls, preserve strict resume arguments, warn about uncertain write outcomes and retain same-token retry semantics, upgrade the vulnerable dependency, and record real-test discrepancies without changing their meaning. Linux full suite passed 59/59 at ef4b54c; user-provided Windows output reports the same. The later strict-argument assertion passed in the focused three-test Linux MCP suite; later commits otherwise changed documentation. No new test run was performed for this assessment.

Remaining items are follow-up work rather than claims made by this preview: automated config preservation/rollback, static TypeScript checking, request and process lifecycle hardening, secret exclusions/redaction, abrupt real-client interruption tests, Git-workspace handoffs, independently confirmed running versions, broader schema/protocol coverage and the unexplained OpenCode token display. Before advertising supported integrations or persistent use with real project data, complete the applicable gates. The input-fidelity discrepancy remains visible; do not silently rewrite stored history to make the test appear exact.

Suggested next focused development step: establish static TypeScript checking for the current runtime, then build guided setup with preview, backups and conflict-aware rollback. Do not expand client targets or add cloud requirements before the first pair is easier to set up and its limits are measured.


## Second detailed review — cancellation and protocol failure cases

Reviewed starting head 1a3e1cd. Two additional runtime defects were found and corrected: an already-aborted request could spawn a potentially mutating child before cancellation was checked; and a POSIX child ignoring SIGTERM could keep running beyond the timeout. The helper now returns without spawning for pre-cancelled requests and escalates direct-child termination to SIGKILL after 250 ms, clearing timers on close. This is not a guarantee of descendant process cleanup or forced parent shutdown behavior.

Added regression checks for pre-cancelled writers, missing executables, output overflow and ignored termination. Added actual MCP protocol calls covering an uninitialized store, cross-workspace read rejection, simultaneous same-token retries, changed-payload token rejection and a single authoritative task afterward. The lost-acknowledgement and handoff tests remain. Linux Node 24.22.1: npm test 62/62. Windows verification of this runtime follow-up is pending; previous Windows 59/59 evidence is unchanged. No dependency or schema changed.

The earlier merge-readiness assessment is conditional on reproducing this new runtime correction on Windows. The reviewed limited preview has no other identified blocking defect after these fixes; this is not a security audit or a full product-gate pass. Known remaining limits include direct-client cancellation/lifecycle behavior, process-tree cleanup, SDK request-size/protocol coverage, automated config preservation, static typechecking and real-project privacy controls. The unexplained OpenCode extra-token display is still unresolved, with direct server rejection verified. Broader claims remain out of scope.
