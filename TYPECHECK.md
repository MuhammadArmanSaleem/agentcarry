# Static TypeScript checking

Run from the repository checkout using the preview's Node 24.22.1 runtime:

```sh
npm ci
npm run typecheck
npm test
```

The project pins TypeScript 7.0.2 and @types/node 24.19.2 as development dependencies. The lockfile includes the compiler's platform-specific optional packages, including Windows x64; do not omit optional dependencies when installing the compiler. The user supplied Windows installation/typecheck/test output before the review follow-up; the revised test fixtures still need Windows reproduction. A global TypeScript installation is not needed. These packages are not required by the running CLI/MCP server.

`tsconfig.json` checks all src/**/*.ts with strict checking, NodeNext modules/resolution, explicit Node types, no emitted JavaScript, and erasable syntax compatible with native Node execution. Declaration files are checked too; skipLibCheck is not enabled. The existing native TypeScript runtime entry points and `.ts` imports remain in use. The configuration emits no build artifacts and does not create an installable distribution.

Scope is the six current runtime TypeScript files, including the read-only setup planner. The research spikes, tests and scripts remain JavaScript and are exercised through runtime tests rather than checkJs. Existing explicit `any` types at JSON/storage boundaries limit compile-time guarantees; passing this command does not establish complete typed record schemas, safe input, correct migrations or product acceptance. Runtime validation and integration tests remain necessary.

The initial check exposed an incorrect MCP SDK context property: cancellation is available as ctx.mcpReq.signal, not ctx.signal. Correcting it wires incoming cancellation to the subprocess helper. The new wire-level test runs the actual server source with a controlled CLI fixture, sends notifications/cancelled, and verifies its direct child stops while the server still answers ping. The test fails with the old property and passes with the corrected one. It does not exercise a real coding client's cancellation UI or arbitrary process descendants.

A list validator also now returns explicitly after rejecting non-arrays so TypeScript narrows unknown to an array. The validator's runtime rejection policy is unchanged.

Linux x64 / Node 24.22.1: clean npm ci, npm run typecheck, and npm test 63/63 passed. A deliberate negative regression run with the old cancellation property failed as expected; the corrected source was restored and type checking passed again. No compiler errors were suppressed. User-provided Windows output on chore/typescript-typecheck reports npm ci with zero vulnerabilities, typecheck with no errors, and 63/63 tests. The exact checkout SHA and Node version were not printed in that run. The subsequent review fixture corrections still await Windows reproduction.

Compiler configuration follows the official [TypeScript options](https://www.typescriptlang.org/docs/handbook/compiler-options) and [Node module guidance](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options). Static checking is now available as an explicit command; automated CI enforcement, packaging and broader end-to-end client compatibility remain separate follow-ups.

The code review and test-fixture corrections are recorded in [TYPECHECK-REVIEW.md](TYPECHECK-REVIEW.md). No runtime, compiler configuration or dependency change was needed during that follow-up review.
