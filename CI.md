# Local preview CI

The workflow in [.github/workflows/checks.yml](.github/workflows/checks.yml) runs for pull requests, pushes to main and manual dispatch after the workflow is on the default branch. Independent Ubuntu and Windows jobs install the locked dependencies, record Node/SQLite/platform metadata, run typecheck, the full test suite and the synthetic setup demo. The runtime is pinned to Node 24.22.1, matching the current development preview.

Actions are pinned to exact commits resolved from their official v4 tags when this change was prepared. The workflow uses read-only repository permissions, does not persist checkout credentials, requires no project secrets and has a 15-minute job timeout. It does not deploy, publish packages, launch coding clients or alter branch protection. No shared dependency cache is introduced.

A passing workflow is evidence for that GitHub run and its tested revision. It does not establish installed Gemini/OpenCode compatibility, trust behavior, interactive Windows terminal behavior, capture automation, power-loss durability or full phase acceptance. Existing manual client checks remain necessary. Required-check enforcement needs separately configured repository rules; this workflow alone does not enforce merges.

Validation: commands and runtime were checked against package.json and the existing Linux/user-reported Windows 94-test runs. Those earlier runs are not execution of this workflow. Initial GitHub-hosted execution is pending; inspect PR checks before merging. See BACKLOG.md for remaining product gates.
