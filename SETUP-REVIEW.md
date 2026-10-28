# Setup preview review

Date: 2026-10-28. Starting head: 88888cf2c6aecd01f0ea46b5268413bb48956af6. Review by the implementing assistant; not an independent audit.

Reviewed the complete PR diff against its TypeScript-checking base, setup.ts, CLI dispatch, setup fixtures and documentation. No blocking code issue was identified within the read-only project-JSON preview scope; no implementation change was required for this review.

Checks: setup dispatch occurs before LocalStore construction, and the planner has no write/database/model/network operations. The workspace is canonicalized and used explicitly. Missing intermediate config sections are not written; an exact owned-entry match is distinct from a conflict. Existing unrelated values and conflicting entry bodies are not included in output. Existing object shapes are checked before traversal and own-property checks avoid inherited names. Invalid client selection, malformed JSON, OpenCode JSONC/owned legacy ambiguity and linked paths fail explicitly. Executable/server/workspace arguments remain separate array elements, not shell text.

Evidence: existing Linux typecheck and 67/67 tests passed. User-provided Windows output after switching to feat/setup-preview reports typecheck without errors and 67/67 tests, including setup cases. The Gemini preview from the AgentCarry checkout reports its own project as workspace, create_config and changes_applied:false. Exact runtime version/HEAD were not printed. This supports preview behavior, not a completed install or actual client test. No new test run was performed for these documentation updates.

Remaining scope limits: project strict JSON only; no assessment of globals, environment overrides, installed client version, project trust, store readiness or connectivity. Equivalent command spellings may conservatively conflict. The 64 KiB check uses inspected size; filesystem inspection is not defense against hostile concurrent path replacement. No apply/backup/rollback exists. A future mutating setup operation must independently revalidate and preserve settings; it must not blindly apply this preview.

Recommendation: ready for user review and merge as this limited preview, after PR #6 lands and the dependency/base is resolved. No merge performed. Product acceptance and guided setup remain incomplete.
