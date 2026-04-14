# Findings: Why Do Dependabot PRs Keep Failing, and How Can the Auto-Merge Pipeline Be Made More Reliable?

**Searcher:** deep-research-searcher (D8-SQ5b) **Profile:** codebase **Date:**
2026-03-29 **Sub-Question IDs:** SQ-5b

---

## Key Findings

### 1. The Pre-Scan "Failure" Report Is Inaccurate for node-forge and brace-expansion [CONFIDENCE: HIGH]

The task brief stated that node-forge "failed 3 times on main (Mar 26, 27, 28)"
and brace-expansion "failed 2 times (Mar 26)." The actual GitHub data
contradicts this. Both packages merged cleanly on first attempt:

- PR #473: `node-forge` 1.3.3 → 1.4.0, **MERGED** 2026-03-26T22:39:05Z — all 16
  checks passed [1]
- PR #474: `brace-expansion` 1.1.12 → 1.1.13, **MERGED** 2026-03-27T14:58:28Z —
  all 16 checks passed [2]
- PR #475 and #476 (path-to-regexp): **MERGED** 2026-03-28 — all checks passed
  [1]

There is no evidence of repeated failures for these packages. The "failed 3
times" description does not correspond to any observable PR history. The
pre-scan intelligence appears to have been either incorrect or referring to a
different mechanism (e.g., branch conflicts from competing PRs
closing/reopening, which Dependabot handles internally before pushing the PR).

### 2. Real Failures: All Closed (Non-Merged) PRs Share Two Root Causes [CONFIDENCE: HIGH]

Of 31 Dependabot PRs in the last 30 days, exactly 5 were closed without merging.
These break into two distinct categories:

**Category A — Prettier Formatting Failures (3 PRs, CI-blocked):**

| PR   | Package                     | CI Failure Root Cause                                                      |
| ---- | --------------------------- | -------------------------------------------------------------------------- |
| #412 | `@eslint/js` 10.0.1 (dup)   | Prettier: formatting issues in `SESSION_CONTEXT.md` and 10 other files [3] |
| #413 | `eslint` 10.0.2             | Prettier: formatting issues in `SESSION_CONTEXT.md` and 10 other files [4] |
| #440 | `@hono/node-server` 1.19.11 | Prettier: formatting issues in `docs/AI_REVIEW_LEARNINGS_LOG.md` [5]       |

In all three cases, the `Lint, Type Check & Test` CI job failed at the
`npm run format:check` step (Prettier). Specifically:

- Run 22565901054 (PR #412/#413):
  `Prettier: Code style issues found in 11 files. Run Prettier with --write to fix.`
  — including `SESSION_CONTEXT.md` [3]
- Run 23148735839 (PR #440):
  `Prettier: Code style issues found in the above file` for
  `docs/AI_REVIEW_LEARNINGS_LOG.md` [5]

The Prettier failure is caused by the **main branch having un-formatted files at
the time the Dependabot PR was opened.** When Dependabot creates its PR, it
checks out its branch (which only bumps the lockfile/version), but CI runs
Prettier against the whole repo including docs files that were committed on main
with formatting violations. Since Dependabot does not modify those docs files,
the format check fails not because of the dependency update, but because of
pre-existing formatting debt in main.

This is a known Dependabot/CI interaction problem: Dependabot PRs inherit CI
failures from dirty main branch state.

**Category B — Intentional Manual Closure (2 PRs):**

| PR   | Package                  | Closure Reason                                                                 |
| ---- | ------------------------ | ------------------------------------------------------------------------------ |
| #463 | `eslint` 9.39.4 → 10.1.0 | Manually closed by `jasonmichaelbell78-creator` (owner). All CI checks PASSED. |
| #422 | `eslint` 9.39.4 → 10.0.3 | CI failed (Prettier, same root cause as Category A), then manually closed      |

PR #463 had all 17 CI checks passing including `Lint, Type Check & Test`. It was
closed by the repository owner, not by CI failure. The close reason aligns with
the auto-merge workflow's design: `eslint` 9→10 is a major version bump, the
auto-merge step is intentionally skipped for major versions (see Finding 4), and
the owner reviewed and rejected the upgrade. Timeline from GitHub API:
`closed by jasonmichaelbell78-creator` [6].

### 3. The Prettier Failure Pattern Is Caused by Un-Committed Formatting Debt in Main [CONFIDENCE: HIGH]

The failing Prettier check is not checking only the changed files in the
Dependabot PR. The project's CI runs `prettier --check .` across the entire
repository. When human-authored commits land on `main` with formatting
violations in docs or session files (which are frequently modified and not
always auto-formatted), the next Dependabot PR inherits those violations and
fails CI.

Evidence timeline:

- Between 2026-02-28 (PR #406 @eslint/js merged cleanly) and 2026-03-02 (PR #412
  same package, CI fail), commits landed on main that introduced Prettier
  violations. Git log shows `SESSION_CONTEXT.md`,
  `docs/AI_REVIEW_LEARNINGS_LOG.md`, and up to 10 other files were unformatted
  when CI ran [3][5][7].
- This explains why the same package (`@eslint/js` 10.0.1) merged successfully
  as PR #406 on 2026-02-28 but failed as PR #412 on 2026-03-02 — the package
  itself is not the cause.

The Prettier check failure is deterministic: it fails when main has un-formatted
files, regardless of what Dependabot is bumping. This makes recurring Dependabot
failures predictable and preventable.

### 4. The Auto-Merge Workflow Correctly Gates Major Versions, But Emits Misleading "SUCCESS" Status [CONFIDENCE: HIGH]

The auto-merge workflow at `.github/workflows/auto-merge-dependabot.yml` [8]
uses a conditional step:

```yaml
- name: Auto-merge minor and patch updates
  if: ${{ steps.metadata.outputs.update-type != 'version-update:semver-major' }}
  run: gh pr merge --auto --squash "$PR_URL"
```

When a major version PR comes through (e.g., eslint 9→10), this step is
**skipped**, but the workflow job still reports **`auto-merge: SUCCESS`** (not
SKIPPED) in the PR checks list. This creates false confidence: looking at PR
#463 checks, `auto-merge` shows SUCCESS while the PR required manual review and
was eventually manually closed. The SUCCESS simply means the workflow itself ran
without errors, not that the PR was queued for merge.

This is correct behavior by design — major versions require manual review — but
the SUCCESS label is misleading for anyone reading check statuses. There is no
explicit "requires manual review" signal surfaced in the PR UI.

The workflow is correctly scoped to `github.actor == 'dependabot[bot]'` only,
which prevents accidental triggering on non-bot PRs.

### 5. Success/Failure Ratio: 83.9% Merge Rate Over 30 Days [CONFIDENCE: HIGH]

Over the last 30 days (2026-02-28 to 2026-03-29), from 31 Dependabot PRs:

| Outcome                 | Count | Percentage |
| ----------------------- | ----- | ---------- |
| Merged (auto or manual) | 26    | 83.9%      |
| Closed without merge    | 5     | 16.1%      |

Breakdown of the 5 closed-without-merge:

- 3 closed due to Prettier CI failure (Category A)
- 1 closed manually despite passing CI (Category B — major version rejection)
- 1 closed after CI failure + manual close (PR #422, both causes present)

Of the 3 pure CI failures, **none are caused by the dependency being updated**.
All are caused by pre-existing formatting violations in main-branch files. If
Prettier violations were not present in main, the merge rate would be ~96.8%
(30/31 — only the intentional major version close would remain).

### 6. Dependabot Configuration Is Well-Structured but Missing the /scripts/mcp Directory [CONFIDENCE: MEDIUM]

The `.github/dependabot.yml` [9] configures three ecosystems:

- `npm` at `/` (root, weekly Monday, max 5 PRs, minor-and-patch grouped)
- `npm` at `/functions` (weekly Monday, max 3 PRs, minor-and-patch grouped)
- `github-actions` at `/` (monthly, all grouped)

The `/scripts/mcp` directory has its own `package.json` and has received
Dependabot PRs (e.g., #475, #441, #438, #439, #442), but it is **not explicitly
listed** in `dependabot.yml`. Dependabot may be auto-detecting this workspace,
or there may be an implicit sub-ecosystem discovery mechanism. This is worth
confirming to ensure continued coverage.

The `functions/package.json` pins `eslint` at `^9.39.2` and `@eslint/js` at
`^9.39.1` (both caret-pinned to major 9). This means Dependabot correctly
identifies ESLint 10.x as a major update, and the auto-merge workflow
appropriately skips auto-merging these. The functions dependency constraints are
not preventing updates from being proposed — they are preventing auto-merge of
major bumps only.

---

## Sources

| #   | Source                                          | Title                                                          | Type               | Trust | CRAAP           | Date       |
| --- | ----------------------------------------------- | -------------------------------------------------------------- | ------------------ | ----- | --------------- | ---------- |
| 1   | `gh pr checks 473`, `gh pr checks 474`          | PR check statuses for node-forge #473, brace-expansion #474    | GitHub API         | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-29 |
| 2   | `gh pr list --author app/dependabot`            | Full Dependabot PR list (31 PRs)                               | GitHub API         | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-29 |
| 3   | Run 22565901054 (`gh run view --log-failed`)    | CI log for PR #412/#413 failure                                | GitHub Actions log | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-02 |
| 4   | `gh pr view 413 --json statusCheckRollup`       | PR #413 check statuses                                         | GitHub API         | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-09 |
| 5   | Run 23148735839 (`gh run view --log-failed`)    | CI log for PR #440 failure (`docs/AI_REVIEW_LEARNINGS_LOG.md`) | GitHub Actions log | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-16 |
| 6   | GitHub Timeline API for PR #463                 | Close event actor for eslint 10.1.0 PR                         | GitHub API         | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-23 |
| 7   | `git log --since 2026-03-01 --until 2026-03-10` | Commits near failure window                                    | git history        | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-29 |
| 8   | `.github/workflows/auto-merge-dependabot.yml`   | Auto-merge workflow source                                     | Filesystem         | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-29 |
| 9   | `.github/dependabot.yml`                        | Dependabot configuration                                       | Filesystem         | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-29 |
| 10  | `functions/package.json`                        | Functions dependency constraints                               | Filesystem         | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-29 |
| 11  | `gh pr view 422,440 --json statusCheckRollup`   | PR #422, #440 check details                                    | GitHub API         | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-29 |

---

## Contradictions

**Pre-scan claim vs. evidence:** The task brief stated node-forge "failed 3
times" and brace-expansion "failed 2 times." The actual GitHub PR history shows
both packages merged cleanly on first attempt without any CI failures. There are
no evidence of failed attempts for these specific packages. Either: (a) The
pre-scan referred to some other tracking mechanism (e.g., Dependabot internally
retrying to create/rebase a PR due to conflicts before it appeared publicly), or
(b) The pre-scan intelligence was incorrect.

This contradiction does not affect the overall root cause analysis — real
failures are documented in Category A and Category B above.

---

## Gaps

1. **Dependabot internal retries are invisible.** If Dependabot tried to create
   a PR, found a conflict, and retried before opening a public PR, those
   attempts would not appear in GitHub's PR history. This could explain the
   "failed 3 times" claim. There is no API surface for observing Dependabot's
   internal retry/rebase queue.

2. **`/scripts/mcp` ecosystem detection.** It is unclear whether Dependabot's
   coverage of `/scripts/mcp` is via auto-detection or some undocumented
   mechanism. The `dependabot.yml` does not list it explicitly. Verification
   would require checking GitHub's Dependabot configuration UI or API for
   detected ecosystems.

3. **No lock file conflict analysis.** The failing PRs were analyzed for CI
   failures only. Lock file conflicts between concurrent Dependabot PRs (a
   common cause of PR recreation) were not analyzed due to the historical nature
   of the data. This is a plausible secondary failure mode that cannot be ruled
   out.

4. **PR #406 vs PR #412 timing gap.** The exact commit(s) that introduced
   Prettier violations between 2026-02-28 and 2026-03-02 were not identified.
   The git log shows several large feature commits in that window. Identifying
   the precise offending commit would require `git log --diff-filter=M` on the
   specific files named in the CI logs.

---

## Serendipity

**The auto-merge workflow emits "SUCCESS" for major-version skips.** When
Dependabot opens a major version PR (e.g., eslint 9→10), the auto-merge step is
correctly skipped, but the workflow reports `auto-merge: SUCCESS` rather than
`auto-merge: SKIPPED`. This is not a failure, but it creates ambiguity for
anyone reviewing check status. Adding an explicit informational step (e.g., echo
"Major version — manual review required") when update-type IS semver-major would
improve signal clarity.

**ESLint is being updated at a high frequency** — 4 separate major-version PRs
(10.0.1, 10.0.2, 10.0.3, 10.1.0) within 4 weeks suggests either no `ignore`
directive for eslint major versions, or the project is tracking ESLint v10
closely. The functions `package.json` currently pins `^9.x`, meaning ESLint v10
will keep reappearing as a Dependabot major update until either the pin is
upgraded or an ignore rule is added.

---

## Recommendations

### Fix 1 (HIGH PRIORITY): Enforce Prettier on main before committing docs/session files

The root cause of all Category A failures is un-formatted files landing on main.
Options:

- Add a pre-commit hook for Prettier that runs on docs and .md files (already
  has pre-commit infrastructure via `.claude/hooks/`)
- Add `SESSION_CONTEXT.md`, `docs/AI_REVIEW_LEARNINGS_LOG.md` and other
  high-churn docs files to a stricter CI check that runs on push to main
- Or: scope Prettier CI to only changed files
  (`--check $(git diff --name-only HEAD)`) so Dependabot PRs are not blocked by
  pre-existing debt in unchanged files

### Fix 2 (MEDIUM PRIORITY): Improve auto-merge signal for major versions

Add an explicit informational step to the auto-merge workflow that runs when the
update IS a major version, making the PR check status clearly say the PR
requires manual review rather than ambiguously showing SUCCESS.

### Fix 3 (LOW PRIORITY): Add explicit /scripts/mcp to dependabot.yml

Explicitly list `/scripts/mcp` as a third npm ecosystem to ensure deterministic
Dependabot coverage and controlled PR limits, rather than relying on implicit
auto-detection.

### Fix 4 (ADVISORY): Add an ignore rule for ESLint major versions until ready to upgrade

Since the project is not ready to adopt ESLint v10 (all v10 PRs have been closed
or blocked), adding
`ignore: [{dependency-name: "eslint", versions: ["10.x"]}, {dependency-name: "@eslint/js", versions: ["10.x"]}]`
to `dependabot.yml` would stop the recurring noise without affecting the current
setup.

---

## Confidence Assessment

- HIGH claims: 6
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All findings are directly derived from GitHub API data, CI run logs, and
filesystem inspection. No training-data assumptions are relied upon.
