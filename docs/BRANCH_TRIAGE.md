# Branch and Dependency Triage Snapshot

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-08-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Snapshot:** 2026-08-06 **Repository:** `jasonmichaelbell78-creator/sonash-v0`
**Remote `main`:** `4474ab6912cd6f00b3f477a40d37033a1719f402` **Working branch
at snapshot:** `agent/codespaces-baseline` (`65f9eb76`)

This is a read-only snapshot of the 14 open Dependabot pull requests inspected
on 2026-08-06. No pull request state was changed. The PRs are based on
historical `main` commits, so GitHub's mergeability signal is not a substitute
for validation against the current tree.

## Open Pull Requests

| PR   | Scope                            | Base       | Head       | Mergeable | Files / risk                                     | Treatment                                             |
| ---- | -------------------------------- | ---------- | ---------- | --------- | ------------------------------------------------ | ----------------------------------------------------- |
| #651 | Root minor/patch batch           | `81a3e1b6` | `6835361b` | yes       | `package.json`, `package-lock.json`; 28 packages | Validate first in an isolated worktree.               |
| #646 | MCP `fast-uri`                   | `98d8d720` | `550f5eec` | yes       | MCP lockfile                                     | Recreate against current `main`.                      |
| #626 | MCP `body-parser`                | `98d8d720` | `c82e24ae` | yes       | MCP lockfile                                     | Recreate against current `main`.                      |
| #641 | `actions/checkout` 7             | `3b3ccd0b` | `8e273fa4` | yes       | 16 workflows                                     | Review checkout/runtime behavior before recreating.   |
| #639 | GitHub Actions minor/patch group | `3b3ccd0b` | `684cee2d` | yes       | 3 workflows                                      | Consolidate after workflow review.                    |
| #640 | Codecov action 7                 | `3b3ccd0b` | `379524ab` | yes       | `.github/workflows/ci.yml`                       | Review action compatibility.                          |
| #607 | `lucide-react` major             | `b70131df` | `04261478` | no        | Root package files; title/version drift          | Recreate and review separately.                       |
| #611 | Functions `firebase-admin` major | `67803525` | `ff008dfd` | yes       | Functions package files                          | Validate Functions compatibility separately.          |
| #617 | Functions ESLint 10              | `67803525` | `18626073` | yes       | Functions package files                          | Validate Functions lint/build separately.             |
| #608 | `knip` major                     | `b70131df` | `85369238` | no        | Root package files                               | Recreate; do not manually repair conflicts.           |
| #596 | Root ESLint 10                   | `f83c9083` | `2c534158` | no        | Root package files                               | Recreate; do not manually repair conflicts.           |
| #578 | Gitleaks action 3                | `cc59fdf3` | `f063ef22` | yes       | `.github/workflows/ci.yml`                       | Compare with the container gitleaks workflow/runtime. |
| #577 | Dependency review action 5       | `cc59fdf3` | `616ef84f` | yes       | `.github/workflows/dependency-review.yml`        | Review Node 24 and runner requirements.               |
| #531 | `@eslint/js` 10                  | `36d16d83` | `e6a6e6f7` | yes       | Root package files                               | Review with the other ESLint majors, separately.      |

## PR #651 Validation

Validated 2026-08-06 in disposable worktree `/tmp/sonash-pr651-uxZKh4` at
`6835361b` under Node `v22.23.2`. The PR changed only the root dependency
manifest and lockfile (1,490 additions and 2,082 deletions in the lockfile diff
against current `origin/main`).

- `npm ci`: passed; 1,067 packages installed, 12 audit findings reported by npm
  (1 low, 9 moderate, 2 high). No audit fix was run.
- `npm run lint`: passed with 16 pre-existing warnings and no errors.
- `npm run type-check`: passed.
- `npx tsc --project scripts/reviews/tsconfig.json`: passed; required before the
  complete test suite because the repository tests consume generated review
  artifacts.
- `npm test`: passed after the review-artifact build: 4,009 tests, 978 suites,
  4,007 passed, 0 failed, 2 skipped.
- `npm run build`: passed.
- `npm run security:secrets`: passed; gitleaks found no leaks.

The initial test invocation before the review-artifact build showed missing
generated modules and was not treated as a dependency failure. The disposable
worktree was removed after validation.

## Decisions and Next Actions

- PR #651 is the best first root dependency candidate, but it should be
  recreated or applied against the current `main`; its historical branch was
  validated only as an isolated dependency change.
- Conflicted PRs #596, #607, and #608 should be recreated or superseded rather
  than manually repaired.
- Action updates need runtime-sensitive review: #577 requires Node 24 and a
  minimum Actions runner version, #641 touches 16 workflows, and #578 changes
  the gitleaks action while the container already provides gitleaks.
- Do not port Claude hooks into Codex, add MCP credentials, or mutate remote PR
  state as part of dependency triage.
