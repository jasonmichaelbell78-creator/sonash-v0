# Outside-The-Box Challenge: Repo Cleanup Research

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-23
**Status:** ACTIVE
**Challenger:** OTB Agent
<!-- prettier-ignore-end -->

---

## Summary

The deep-research report (RESEARCH_OUTPUT.md) is thorough for what it examined
but has **significant blind spots** in 6 of 10 areas investigated. The research
audited scripts and hooks for orphans but never independently audited their
**test files**. It checked npm scripts but not **devDependency usage**. It
verified workflow wiring but not **workflow trigger reachability**. These gaps
add approximately **15-20 additional cleanup items** that the research missed
entirely.

**Overall impact on research conclusions:** The B+ overall grade should drop to
**B** when these items are factored in. The "Orphaned Files" grade of A should
drop to **B+** given the 8+ orphan test files found. The "Script Wiring" grade
of A+ remains valid but incomplete without the test file layer.

---

## Blind Spot 1: Test Files for Removed Features

**What I investigated:** Cross-referenced every test file in `tests/scripts/`,
`tests/hooks/`, and `tests/enforcement/` against the actual scripts/hooks they
test.

**Findings: 8 orphan test files confirmed.**

### tests/scripts/ orphans (no corresponding script exists)

| Test File                                         | Corresponding Script                                         | Evidence                                                                                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/scripts/check-pending-refinements.test.ts` | `scripts/check-pending-refinements.js`                       | Script does not exist. Only references are in `data/ecosystem-v2/test-registry.jsonl` and a planning doc.                                                |
| `tests/scripts/check-cc-gate.test.ts`             | (none -- tests `scripts/check-cc.js` pre-push gate behavior) | Misleading name. Actually tests `check-cc.js` integration with `.husky/pre-push`. Not a true orphan but mislabeled -- no `check-cc-gate.js` exists.      |
| `tests/scripts/validate-audit-s0s1.test.ts`       | `scripts/validate-audit-s0s1.js`                             | Script does not exist. Only appears in tech debt JSONL entries and audit archives. Tests `validate-audit.js` with S0/S1 scenarios.                       |
| `tests/scripts/retro-action-items.test.ts`        | (none)                                                       | Acceptance test for pr-retro action items #7 and #13. Tests file existence and structure, not a specific script. References `high-churn-watchlist.json`. |
| `tests/scripts/check-case-sensitivity.test.ts`    | `scripts/check-case-sensitivity.js`                          | Script does not exist. Tests `check-docs-light.js` case sensitivity behavior. Mislabeled -- tests a feature of another script.                           |

### tests/hooks/ orphans (no corresponding hook exists)

| Test File                                   | Corresponding Hook                       | Evidence                                                                                                                                                                            |
| ------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/hooks/stop-serena-dashboard.test.ts` | `.claude/hooks/stop-serena-dashboard.js` | Hook does not exist. Was removed/renamed. Test file still references the hook by name in its doc comment. 24 files still reference this hook name across docs.                      |
| `tests/hooks/gsd-context-monitor.test.ts`   | `.claude/hooks/gsd-context-monitor.js`   | Hook does not exist. The `.claude/hooks/gsd-*.js` pattern is gitignored (GSD plugin hooks are local-only). Test file mirrors constants from the hook but the hook is not committed. |

### tests/scripts/ -- questionable but not orphans

| Test File                                         | Status          | Notes                                                                                                                                                |
| ------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/scripts/github-optimization-wave3.test.js` | Acceptance test | Tests deliverables from Wave 3 optimization. No corresponding script. But validates that files/structures exist. May be stale if structures changed. |
| `tests/scripts/github-optimization-wave4.test.js` | Acceptance test | Same pattern. Tests Wave 4 deliverables.                                                                                                             |

**Severity:** MEDIUM-HIGH. Orphan test files waste CI time and mislead
developers about what is tested. The `stop-serena-dashboard` and
`gsd-context-monitor` hook tests will produce false passes (testing inlined
logic copies, not actual hooks).

**Impact on research:** The research's orphan count of 2 confirmed + 1 likely
should be revised to **2 script orphans + 5-7 test file orphans + 1 likely
script orphan = 8-10 total orphans**. The "Orphaned Files" grade of A drops to
B+.

---

## Blind Spot 2: Unused devDependencies

**What I investigated:** Checked each devDependency in `package.json` for actual
import/require usage across the codebase (excluding `node_modules/` and lock
files).

**Findings: 3 confirmed unused, 1 suspicious.**

| Package                        | In devDeps |     Used in Code     | In knip ignoreDependencies | Status                                                                                                                         |
| ------------------------------ | :--------: | :------------------: | :------------------------: | ------------------------------------------------------------------------------------------------------------------------------ |
| `msw`                          |    Yes     | **No imports found** |      Yes (suppressed)      | UNUSED -- no `require('msw')` or `import from 'msw'` anywhere                                                                  |
| `@firebase/rules-unit-testing` |    Yes     | **No imports found** |      Yes (suppressed)      | UNUSED -- no imports in any `.ts` or `.js` file                                                                                |
| `@playwright/test`             |    Yes     | **No imports found** |       Not suppressed       | UNUSED -- `tests/e2e/` exists but doesn't import it; `settings.local.json` has playwright MCP permissions                      |
| `firebase-admin`               |    Yes     |   Yes (functions/)   |      Yes (suppressed)      | Used in `functions/src/` -- but it's a dep of the functions sub-package, not the root. Having it in root devDeps is redundant. |

**Key insight:** The `knip.json` file explicitly suppresses warnings for `msw`,
`@firebase/rules-unit-testing`, and `@modelcontextprotocol/server-memory` via
`ignoreDependencies`. This is a **debt suppression mechanism** -- Knip would
flag these as unused but was told to ignore them. The research checked npm
scripts but never ran or analyzed Knip output.

**Severity:** LOW-MEDIUM. These packages add to install time and attack surface
but don't break anything. `msw` (2.12.13) and `@playwright/test` (1.58.1) are
large packages.

**Impact on research:** New finding category. The research did not examine
dependency hygiene at all.

---

## Blind Spot 3: GitHub Actions Workflow Trigger Reachability

**What I investigated:** Read all 18 workflow files and checked whether their
`on:` triggers can actually fire.

**Findings: 1 effectively unreachable workflow, 1 narrow trigger.**

| Workflow                    | Trigger                                                                                             | Issue                                                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `validate-plan.yml`         | `pull_request` on `main` when `docs/archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md` changes | This is an **extremely narrow** path trigger. The file exists but is archived/completed. Future PRs are very unlikely to modify it. The workflow is effectively dormant. |
| `sync-readme.yml`           | `push` to `main` when `ROADMAP.md` changes                                                          | Narrow but valid -- ROADMAP.md does get updated.                                                                                                                         |
| `auto-merge-dependabot.yml` | `pull_request` on `main` with `if: github.actor == 'dependabot[bot]'`                               | Valid but only runs for Dependabot PRs. All other PRs trigger the workflow job but immediately skip via the `if:` condition, wasting a runner allocation.                |

**Severity:** LOW. The `validate-plan.yml` workflow is harmless but misleading
about CI coverage. The Dependabot auto-merge pattern is standard GitHub Actions
practice.

**Impact on research:** Minor. Does not change conclusions.

---

## Blind Spot 4: MCP Configuration

**What I investigated:** Read `.mcp.json` (project-level) and checked that
configured MCP servers actually exist.

**Findings: Configuration is healthy.**

| Server       | Config      | Exists                                            | Status                |
| ------------ | ----------- | ------------------------------------------------- | --------------------- |
| `memory`     | `.mcp.json` | Uses `npx -y @modelcontextprotocol/server-memory` | OK -- auto-downloaded |
| `sonarcloud` | `.mcp.json` | `scripts/mcp/sonarcloud-server.js`                | OK -- file exists     |

The `_note` field in `.mcp.json` documents that Firebase, GitHub, and Context7
are auto-discovered by plugins and don't need entries. The
`@modelcontextprotocol/server-memory` is in devDependencies (matching the npx
command). No issues found.

**Severity:** None.

**Impact on research:** None.

---

## Blind Spot 5: Git Hooks Beyond Claude Code

**What I investigated:** Checked `.husky/` directory structure and `.husky/_/`
internal files.

**Findings: Stale Husky v8 internal directory.**

The `.husky/_/` directory contains 13 old Husky v8-era hook scripts
(`pre-commit`, `pre-push`, `commit-msg`, `prepare-commit-msg`,
`pre-merge-commit`, `post-commit`, `post-checkout`, `post-merge`,
`post-rewrite`, `pre-rebase`, `pre-applypatch`, `post-applypatch`,
`pre-auto-gc`). These internal files have a `.gitignore` with `*` so they are
not tracked, but they are generated by Husky locally.

The `husky.sh` file in `.husky/_/` prints a **deprecation warning**:

```
husky - DEPRECATED
Please remove the following two lines from $0:
...
They WILL FAIL in v10.0.0
```

The project uses Husky v9.1.7 (from package.json). The `.husky/_/` directory is
the old Husky v8 internal directory that should have been cleaned up during the
Husky v8 to v9 migration. The active hooks (`.husky/pre-commit`,
`.husky/pre-push`) use the correct v9 pattern (sourcing `_shared.sh`), so the
`_/` directory is vestigial.

The active Husky hooks in `.husky/pre-commit` and `.husky/pre-push` are large,
production-quality shell scripts (12K+ tokens each). These are the actual
pre-commit/pre-push hooks that run alongside the `.claude/hooks/` Claude Code
hooks. The research mentioned "Husky + lint-staged properly configured" but did
not examine the Husky hooks themselves for staleness or issues.

**Severity:** LOW. The `_/` directory is gitignored and auto-generated. But the
deprecation warning in `husky.sh` indicates the project should prepare for Husky
v10 breaking changes.

**Impact on research:** Minor. The research correctly noted Husky is configured
but missed the v10 migration risk.

---

## Blind Spot 6: Dotfiles and Hidden Configs

**What I investigated:** Checked `.nvmrc`, `.env*` files, `.env.local.example`,
`.env.production`.

**Findings: 2 items of note.**

### .nvmrc files

| File               | Content | Status                                                   |
| ------------------ | ------- | -------------------------------------------------------- |
| `.nvmrc`           | `22`    | **Current** -- matches `node-version: "22"` in workflows |
| `functions/.nvmrc` | `22`    | **Current** -- matches root                              |

### .env files

| File                   | Status                           | Notes                                                                                                                                                                                           |
| ---------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env.local.example`   | **Current**                      | Lists all required env vars (Firebase, Sentry, MCP tokens, App Check). Well-maintained.                                                                                                         |
| `.env.production`      | **Contains production API keys** | Firebase API key, reCAPTCHA site key, Sentry DSN are committed. These are client-side keys (NEXT*PUBLIC*\*) so this is standard practice for Firebase web apps, but the file is tracked in git. |
| `.env.local`           | Gitignored                       | Correct -- contains secrets                                                                                                                                                                     |
| `.env.local.encrypted` | Tracked                          | Encrypted secrets backup -- OK                                                                                                                                                                  |

**Severity:** None actionable. The `.env.production` containing `NEXT_PUBLIC_*`
keys is standard Next.js practice for Firebase web apps (these keys are visible
in the client bundle anyway).

**Impact on research:** None.

---

## Blind Spot 7: Lock File Freshness

**What I investigated:** Checked that both `package-lock.json` and
`functions/package-lock.json` exist.

**Findings:** Both lock files exist. Without running `npm ci` or comparing
checksums, I cannot verify they are perfectly in sync with their respective
`package.json` files. The pre-commit hooks and CI workflows run `npm ci` which
would fail if they were out of sync, so the lock files are implicitly validated
on every commit and CI run.

**Severity:** None (implicitly validated by CI).

**Impact on research:** None.

---

## Blind Spot 8: Types and Schemas

**What I investigated:** Checked `types/` directory and
`functions/src/schemas.ts` for unused type definitions.

**Findings:** The `types/` directory contains only `journal.ts`, which is
actively imported by 8 files (`hooks/use-journal.ts`, 7 components in
`components/journal/`). The `functions/src/schemas.ts` is used by the Cloud
Functions. No orphan types found.

**Severity:** None.

**Impact on research:** None.

---

## Blind Spot 9: Firebase Configuration

**What I investigated:** Checked `firebase.json`, `.firebaserc`,
`firestore.rules`, `storage.rules`.

**Findings:** All files exist and appear current.

| File              | Status  | Notes                                                                                                       |
| ----------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `firebase.json`   | Current | COOP/COEP headers present (matches CLAUDE.md note about Google OAuth). Hosting config for `out/` directory. |
| `.firebaserc`     | Current | Points to `sonash-app` project.                                                                             |
| `firestore.rules` | Present | Not deeply audited for rule correctness.                                                                    |
| `storage.rules`   | Present | Not deeply audited.                                                                                         |

**Severity:** None found.

**Impact on research:** None.

---

## Blind Spot 10: Automation Writing to Gitignored Locations

**What I investigated:** Checked `.gitignore` for patterns that match script
output locations, then cross-referenced with scripts that write to those
locations.

**Findings: 2 significant issues.**

### Issue 1: Research challenges/ directory is gitignored (META-ISSUE)

`.gitignore` contains:

```
.research/**/challenges/
```

This means **this very file** (`otb.md`) and all challenge outputs from the
deep-research pipeline are gitignored and will never be committed. If challenges
contain important findings that should be preserved, they are silently lost.

**Severity:** HIGH for the research pipeline. Challenge findings are part of the
research methodology but are discarded by gitignore.

### Issue 2: scripts/reviews/dist is gitignored

`.gitignore` contains:

```
scripts/reviews/dist
```

The `reviews:render` npm script compiles TypeScript in `scripts/reviews/` to
`scripts/reviews/dist/`. The dist directory is gitignored, so compiled review
scripts are never committed. Multiple test files reference
`scripts/reviews/dist/__tests__/` paths. This is intentional (compile on demand)
but means the test-registry JSONL that references these test paths assumes
`dist/` has been built.

**Severity:** LOW. This is a known pattern (build before test) but the
SCHEMA_MAP test failure note in memory confirms this can cause confusion.

### Issue 3: hook-runs.jsonl is gitignored but referenced by rotation policy

`.gitignore` contains `.claude/state/hook-runs.jsonl`. The research flagged this
file as needing rotation but did not note that it is gitignored, meaning
rotation doesn't affect the git repo -- it only affects local disk usage.

**Severity:** LOW. The research's rotation recommendation is still valid for
local disk hygiene.

---

## New Action Items (Not in Research Report)

### HIGH

| #     | Action                                                                               | Severity | Files                                                                      |
| ----- | ------------------------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------- |
| OTB-1 | Delete orphan test: `tests/scripts/check-pending-refinements.test.ts`                | HIGH     | Script never existed                                                       |
| OTB-2 | Delete orphan test: `tests/hooks/stop-serena-dashboard.test.ts`                      | HIGH     | Hook removed, test remains                                                 |
| OTB-3 | Delete orphan test: `tests/hooks/gsd-context-monitor.test.ts`                        | HIGH     | Hook is gitignored (GSD local-only)                                        |
| OTB-4 | Rename or delete `tests/scripts/validate-audit-s0s1.test.ts`                         | HIGH     | Tests `validate-audit.js` S0/S1 scenarios but name implies separate script |
| OTB-5 | Address `.research/**/challenges/` gitignore -- challenge findings are silently lost | HIGH     | `.gitignore` line 150-151                                                  |

### MEDIUM

| #      | Action                                                                                                  | Severity | Files                                  |
| ------ | ------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------- |
| OTB-6  | Rename `tests/scripts/check-cc-gate.test.ts` to clarify it tests `check-cc.js` pre-push integration     | MEDIUM   | Misleading name                        |
| OTB-7  | Rename `tests/scripts/check-case-sensitivity.test.ts` to clarify it tests `check-docs-light.js`         | MEDIUM   | Misleading name                        |
| OTB-8  | Remove unused devDependency: `msw` (not imported anywhere, suppressed in knip)                          | MEDIUM   | `package.json`                         |
| OTB-9  | Remove unused devDependency: `@firebase/rules-unit-testing` (not imported anywhere, suppressed in knip) | MEDIUM   | `package.json`                         |
| OTB-10 | Remove unused devDependency: `@playwright/test` (not imported in any test file)                         | MEDIUM   | `package.json`                         |
| OTB-11 | Clean up Knip `ignoreDependencies` after removing unused deps                                           | MEDIUM   | `knip.json`                            |
| OTB-12 | Review `tests/scripts/retro-action-items.test.ts` -- acceptance test for pr-retro items, may be stale   | MEDIUM   | Verify items #7/#13 are still relevant |

### LOW

| #      | Action                                                                       | Severity | Files                                       |
| ------ | ---------------------------------------------------------------------------- | -------- | ------------------------------------------- |
| OTB-13 | Prepare for Husky v10 migration (`.husky/_/husky.sh` deprecation warning)    | LOW      | `.husky/_/`                                 |
| OTB-14 | Evaluate `validate-plan.yml` workflow -- trigger path is for archived file   | LOW      | `.github/workflows/validate-plan.yml`       |
| OTB-15 | Review `github-optimization-wave3.test.js` and `wave4.test.js` for staleness | LOW      | Acceptance tests for past optimization work |

---

## Revised Scorecard (with OTB findings)

| Category               |  Original Grade  | Revised Grade | Delta | Reason                              |
| ---------------------- | :--------------: | :-----------: | :---: | ----------------------------------- |
| Orphaned Files         |        A         |    **B+**     |  -1   | +5-7 orphan test files missed       |
| Ghost References       |        A+        |      A+       |   0   | No change                           |
| Doc Staleness          |        B-        |      B-       |   0   | No change                           |
| Archive Hygiene        |        A-        |      A-       |   0   | No change                           |
| Skill/Agent Health     |        B         |       B       |   0   | No change                           |
| State File Health      |        C+        |      C+       |   0   | No change                           |
| Script Wiring          |        A+        |      A+       |   0   | No change (test wiring is separate) |
| Planning Health        |        A-        |      A-       |   0   | No change                           |
| Cross-Ref Integrity    |        A-        |      A-       |   0   | No change                           |
| **Dependency Hygiene** | **(not graded)** |    **B-**     |  NEW  | 3 unused devDeps, Knip suppressions |
| **Test File Hygiene**  | **(not graded)** |     **B**     |  NEW  | 5-7 orphan tests, 2 mislabeled      |

**Revised Overall Grade: B** (was B+). The orphan test files and unused
dependencies represent a modest but real blind spot in the original research.
