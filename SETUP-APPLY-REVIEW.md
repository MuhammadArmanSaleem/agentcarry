# Setup apply/rollback review

Date: 2026-10-28. Reviewed PR #8 at 71810eedd72690d1acb3c4e698f2c501aa47d098, followed by the recovery fix in this PR. This is a source review and synthetic verification, not production or real-client qualification.

## Finding and correction

Concurrent abandoned-lock recovery could remove a replacement writer lock. Two recoverers could both read the old dead owner's lock; after one removed it and a writer acquired a replacement, the other could unlink that replacement. Writer serialization alone did not protect this recovery path.

Recovery now holds an exclusive, private recovery-lock while inspecting and removing an abandoned writer lock. Competing recoverers fail closed. Writers still use the existing writer lock. A process killed while recovering may leave the recovery guard behind; it is deliberately not auto-cleared, and requires manual inspection. No PID from a file receives a terminating signal.

A separate-process regression pauses one recoverer after it verifies the abandoned owner, checks that another recoverer cannot enter and a writer remains blocked, then verifies recovery completion and subsequent apply. It also checks that an existing recovery guard is not silently cleared.

## Scope inspected

Reviewed revision/plan binding, same-token requests, journal schema/project binding and integrity, backup publication before config replacement, interrupted apply/rollback recovery, owned-entry refusal, preservation of later unrelated edits, replay tombstones and orphan cleanup, history budgets, Git/link guards, CLI dispatch and disclosure of limits. No additional blocking finding was identified within the documented cooperative local-filesystem boundary.

## Evidence

- User-provided Windows terminal output for the original PR version: typecheck passed, 80/80 tests passed with no skips, setup demo passed for both synthetic client configurations. The output did not independently print HEAD or runtime version; it followed checkout of the PR branch. No live clients were started.
- Linux Node 24.22.1 after the correction: typecheck and 14/14 focused apply/recovery tests passed. Full-suite/demo results are recorded in SETUP-APPLY.md after execution.
- Windows reproduction of the correction remains pending. Earlier Windows results do not qualify the new recovery guard.

## Remaining limits

No atomic compare-and-swap against arbitrary external editors, no verified ACL restoration or physical erasure, no power-loss or network-filesystem guarantee. Backups can contain credentials and are not encrypted. A stale recovery guard requires manual inspection rather than recursive unlock. Actual Gemini/OpenCode configuration and launch checks remain separate. P1/P2/P3 remain incomplete.
