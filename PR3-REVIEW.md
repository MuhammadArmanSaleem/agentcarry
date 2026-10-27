# PR #3 review

Reviewed the 15-file PR diff at d0c52febebdbb1c2017ac45e52f99018a6d3b37c on 2026-10-27. Review was performed by an assistant working on the project; it is not an independent security audit. No merge performed.

## Findings and fixes

- **Project freshness:** A Git-clean status excludes ignored files; the earlier code could report a full matching project despite an ignored-file change. Overall freshness now remains unknown without relevant fingerprints unless a change is detected. git_freshness describes the narrower Git comparison. Added an ignored-file regression test.
- **Tracked database path:** A previously tracked database that was deleted from disk could be recreated with private content despite the nested ignore file. Initialization now refuses tracked database/sidecar paths, with case-insensitive pathspec matching, and stops when Git tracking cannot be checked in a workspace containing a Git marker. Added exact-path and case-variation regression tests. This cannot prevent a user from later forcibly adding files or a concurrent actor modifying Git state.
- **Conflict response size/trust:** Divergent tips previously returned all full checkpoint bodies. Resume now returns up to 20 abbreviated untrusted summaries per page with next_offset and total_tips; selecting an ID retrieves the full record. Pages are fresh queries and may shift under concurrent writes. Added 25-tip pagination/trust test.
- **Test isolation:** Temporary Git commits now disable user-configured hooks and signing. The CLI disables Git's filesystem monitor for its fixed inspection commands.
- **Evidence and docs:** Updated the instructions to reflect the user-provided Windows run and the limits of that evidence.

## Results

User-provided Windows output reports 46/46 tests and the temporary-folder demo passing before these corrections; its checkout commit and runtime versions were not included. The corrected suite passes 50/50 locally on Linux x64, Node 24.22.1 / SQLite 3.53.4. The local demo passed after the main fixes; the final case-insensitive pathspec change only affects Git workspace initialization. Syntax and relative link checks were run. The corrections need a Windows rerun.

No further merge-blocking issue identified within this synthetic preview scope. This is not product release readiness: input does not automatically redact secrets, migrations/import and relevant file fingerprints are absent, disk size and secure erasure are not guaranteed, and ACL/power-loss/hostile concurrent filesystem behavior remains unverified. The CLI uses filesystem ownership as its trust boundary; multiple Git worktrees do not yet share a project store. No MCP, real knowledge packages, agent adapters, automatic capture or live-agent acceptance has been implemented.
