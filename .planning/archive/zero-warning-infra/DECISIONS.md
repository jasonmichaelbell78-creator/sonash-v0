# DECISIONS: Zero-Warning Infrastructure

**Date:** 2026-03-19 **Topic:** Eliminate all pre-existing warnings, errors,
failures, and blocks

## Decision Table

| #   | Decision                          | Choice                                               | Rationale                                                           |
| --- | --------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| D1  | Knip unused deps (B1)             | Verify usage, then remove or add to knip config      | Unblocks ALL downstream CI — highest impact single fix              |
| D2  | Cyclomatic CC (B2)                | Add baseline mechanism + refactor CC>40              | Mirrors cognitive CC approach; refactor worst offenders             |
| D3  | Cognitive CC regressions (B3)     | Refactor all 6 functions to fit baselines            | User: fix everything, no scope limits                               |
| D4  | CI workflow permissions (W1-W4)   | Enable repo settings: PR creation + auto-merge       | Low risk — branch protection still requires review                  |
| D5  | ESLint security warnings (N5)     | Override security rules in test files                | 1541 warnings are false positives in tests; keep rules in prod code |
| D6  | Prettier bulk format (N6)         | Single dedicated commit on this branch               | Gets it done; lint-staged prevents future drift                     |
| D7  | Documentation drift (N7-N9)       | Fix all doc issues                                   | CODE_OF_CONDUCT.md errors, version refs, markdownlint, accuracy     |
| D8  | Review system integrity (N10-N11) | Sync missing records + fix disposition math          | Patch what's broken, don't rebuild entire history                   |
| D9  | Verification strategy             | Full re-research with 6 agents + all npm checks      | Not just grep — functional verification matrix                      |
| D10 | Execution approach                | Parallel agent teams in waves                        | Blocking → config → warnings → cosmetic → verify                    |
| D11 | Prettier commit strategy          | Dedicated commit: `style: bulk format with Prettier` | Isolate formatting noise from functional changes                    |
| D12 | run-alerts.js refactoring         | Extract helper functions within same file            | Least disruptive; file stays self-contained                         |
| D13 | Cross-doc-deps false positives    | Refine rules + add exclusions                        | Belt and suspenders — fix both the rules and the scope              |
| D14 | Orphaned test files               | Delete + add rimraf to test:build                    | Clean up and prevent recurrence                                     |
| D15 | ESM warnings                      | Per-directory package.json with "type": "module"     | Doesn't affect CJS files elsewhere                                  |
| D16 | SWS/ROADMAP cleanup               | Search and mark complete after fixes                 | Cross-reference fix commits against roadmap items                   |
| D17 | Doc-headers exclusions            | Exclude `.claude/`, `.planning/`, `docs/audits/`     | Internal docs don't need standard headers                           |
| D18 | CI oxlint hook warnings           | Refactor all 11 warnings in hook files               | Hooks run every prompt — worth fixing properly                      |
| D19 | Pattern compliance full scan      | Fix ALL 73 blocking violations                       | User: fix everything                                                |
| D20 | Slow auth test                    | Accept — 7s tolerable                                | Not worth mock complexity to save 7s                                |
| D21 | Commit strategy                   | ~7 commits by logical group                          | Each reviewable and revertible                                      |
| D22 | Branch strategy                   | Stay on housecleaning                                | Name fits perfectly                                                 |
| D23 | Verification re-research          | 6 agents + every npm check as evidence matrix        | Maximum evidence for compliance                                     |
