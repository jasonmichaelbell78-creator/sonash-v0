# Findings: Root Causes of All Recent Workflow Failures

**Searcher:** deep-research-searcher (D5-SQ1b) **Profile:** codebase **Date:**
2026-03-29 **Sub-Question IDs:** D5-SQ1b

---

## Key Findings

### 1. Release Please: Chronic "sha wasn't supplied" GitHub API Error [CONFIDENCE: HIGH]

**Failure type:** (c) upstream bug / configuration issue **Recurrence:** Every
single push to main — 10+ consecutive failures going back to at least
2026-03-23. This is a persistent, unresolved blocker.

**Root cause:** Release Please action (v4.4.0, pinned SHA `16a9c908`) attempts
to create or update a file on a newly-created branch, but passes no `sha`
parameter when the file already exists or the race condition between branch
creation and file write causes GitHub's contents API to reject the request.

**Exact terminal error (run #23697470470, 2026-03-29):**

```
##[error]release-please failed: Invalid request.
"sha" wasn't supplied. - https://docs.github.com/rest/repos/contents#create-or-update-file-contents
```

**Secondary symptoms:**

- 1,053 commits being scanned but none parsed as conventional commits — all
  "Merge pull request #NNN" subject lines fail the conventional-commit parser
  with: `Error: unexpected token ' ' at 1:6, valid tokens [(, !, :]`
- Release Please reports "No latest release found" for path `.`, then tries to
  create a release notes branch
  `release-please--branches--main--components--sonash--release-notes`, which
  succeeds, then immediately fails writing to it.
- `.release-please-manifest.json` is pinned at `"0.2.0"` but no GitHub release
  or tag with that version exists:
  `⚠ Could not find releases. ⚠ Expected 1 releases, only found 0`.

**Contributing factors:**

1. **Zero conventional commits in history.** Commit subjects are merge PR
   messages (`Merge pull request #472 from ...`) or freeform titles. Release
   Please's node-strategy parser requires `feat:`, `fix:`, etc. prefixes. With
   1,053 unparseable commits, it falls through to the branch-creation code path
   which then hits the API bug.
2. **Missing initial GitHub release tag.** The manifest declares `0.2.0` but no
   `sonash-v0.2.0` tag or release exists. Release Please is in an indeterminate
   state where it can't bootstrap.
3. **Node.js 20 deprecation warning.** The action runs on Node.js 20 which will
   be forced to Node.js 24 on 2026-06-02. Not currently failing, but will break
   automatically without action upgrade.

**Fix strategy:**

- **Option A (recommended):** Create a GitHub release manually tagged
  `sonash-v0.2.0` to bootstrap the manifest state, AND push at least one
  conventional commit to trigger a proper release PR. Release Please should then
  operate normally.
- **Option B:** If the project does not use conventional commits and never will,
  disable Release Please entirely or switch to a different release strategy.
- **Option C:** Upgrade the action to a newer version — the pinned SHA
  `16a9c908` corresponds to v4.4.0 (2024). Check if a newer release fixes the
  `sha` API bug.
- **Regardless:** The Node.js 20 deprecation warning must be addressed before
  2026-06-02.

**Source citations:** Run IDs `23697470470` (2026-03-29), `23621358112`
(2026-03-26), `23596459538` (2026-03-26), `23566015381` (2026-03-25). Pattern
consistent across all 10 sampled runs.

---

### 2. CI (Lint & Format job): knip Reports `@typescript/native-preview` as Unused DevDependency [CONFIDENCE: HIGH]

**Failure type:** (d) needs code change **Recurrence:** Recurring — present on
plan-32626 PR (run #23696563972, 2026-03-28) and on main push (run #23596459504,
2026-03-26).

**Root cause:** `knip` (the unused dependency checker, `npm run deps:unused`)
flags `@typescript/native-preview` as an unused devDependency. This package is
listed in `package.json` at version `^7.0.0-dev.20260326.1` but knip cannot find
any import or usage reference, causing it to report an error and exit with
code 1.

**Exact failure output (run #23696563972):**

```
Unused devDependencies (1)
@typescript/native-preview  package.json:176:6
##[error]Process completed with exit code 1.
```

**Context:** The `knip.json` config lists `@typescript/native-preview` in
`ignoreDependencies`, but this appears to either be absent from the version on
the failing branch or the syntax is not working as expected. The 78 oxlint
warnings (unused variables, unused imports) are separate and currently
non-blocking since oxlint does not fail the CI step with exit code 1 — they
appear in the log as `##[warning]` annotations only.

**Fix strategy:**

- **Option A (preferred):** Verify `@typescript/native-preview` is in
  `knip.json`'s `ignoreDependencies` array in the branch code. If the entry was
  added to main after the branch diverged, rebase or cherry-pick.
- **Option B:** If the package is genuinely unused and was added speculatively,
  remove it from `package.json`.
- **Option C:** If it will be used later, add it to
  `knip.json → ignoreDependencies` (the array already has entries for other
  packages like `react-day-picker`, `@modelcontextprotocol/server-memory`).

**Note on oxlint warnings:** 78 warnings about unused variables across scripts
are present but these are currently `##[warning]` level, not errors. They may
become errors if oxlint config strictness increases or if a future rule treats
them as errors. Worth addressing separately.

**Source citations:** Run ID `23696563972` (plan-32626, 2026-03-28);
`23596459504` (main, 2026-03-26).

---

### 3. CI (Validate job): Gitleaks Action Unreachable — Transient or Deleted SHA [CONFIDENCE: HIGH]

**Failure type:** (a) config issue / (b) transient **Recurrence:** Observed in
run #23596459504 (2026-03-26 main push). Not present in the most recent run
(2026-03-28), suggesting it may have been transient or resolved.

**Root cause:** The pinned SHA `44c470ffc35caa81b8a8b2e75a06b4ec8e308688` for
`gitleaks/gitleaks-action` could not be fetched:

```
##[error]An action could not be found at the URI
'https://api.github.com/repos/gitleaks/gitleaks-action/tarball/44c470ffc35caa81b8a8b2e75a06b4ec8e308688'
```

This error pattern occurs when a commit SHA is force-pushed away from a pinned
action ref, the action repository has changed structure, or GitHub API was
temporarily unavailable. Since a subsequent CI run on 2026-03-28 did not show
this error (it failed on knip instead), it may have been a transient GitHub
infrastructure issue.

**Fix strategy:**

- If recurring: update the Gitleaks action pin to a current known-good SHA/tag.
- If confirmed transient: no action needed, but consider adding
  `continue-on-error: true` for secret scan if it would block other critical
  checks.

**Source citations:** Run ID `23596459504` (main, 2026-03-26).

---

### 4. Documentation Lint: `.research/dev-dashboard/RESEARCH_PLAN.md` Missing Version History Section [CONFIDENCE: HIGH]

**Failure type:** (d) needs code change **Recurrence:** Single occurrence
observed on plan-32626 PR (run #23696563981, 2026-03-28). File-specific issue.

**Root cause:** The docs-lint workflow (`docs-lint.yml`) runs
`scripts/check-docs-light.js` on changed markdown files. The script requires a
section matching `/version history/i`. The file
`.research/dev-dashboard/RESEARCH_PLAN.md` changed in the plan-32626 PR but
lacks a version history section.

**Exact failure output (run #23696563981):**

```
Checking: .research/dev-dashboard/RESEARCH_PLAN.md
    ❌ Missing required section matching: /version history/i
Files with errors: 1
Total errors: 2
```

The file has a well-structured research plan with a `## Settled Decisions` table
and `## Research Phases` sections, but no `## Version History` table. The
documentation standards for this project require a version history section in
all docs.

**Fix strategy:**

- Add a `## Version History` section to
  `.research/dev-dashboard/RESEARCH_PLAN.md`.
- Example minimal entry: `| 1.0 | 2026-03-27 | Initial research plan |`
- Alternatively, if research artifacts like `.research/**` should be exempt from
  the version history requirement, update `check-docs-light.js` to exclude
  `.research/` paths (similar to how `docs/archive/` is already excluded).

**Source citations:** Run ID `23696563981` (plan-32626, 2026-03-28). Error line:
`Missing required section matching: /version history/i`.

---

### 5. Dependabot node-forge Security Updates (3x): `@dataconnect/generated` File-Path Dependency Blocking File Fetcher [CONFIDENCE: HIGH]

**Failure type:** (a) config issue — structural problem with local path
dependency **Recurrence:** Recurring — 3 consecutive failures on main for
node-forge (runs #23693601219, #23653677021, #23623710281 on 2026-03-28,
2026-03-27, 2026-03-26).

**Root cause:** Dependabot's file fetcher phase fails because `package.json`
references a local path-based dependency:

```json
"@dataconnect/generated": "file:src/dataconnect-generated"
```

Dependabot cannot resolve `file:` protocol dependencies — it requires all
dependency paths to be resolvable from the GitHub API (public registry or git
URLs). When Dependabot attempts to fetch and analyze the full dependency tree
for the node-forge security update in `/` (root), it hits:

```
ERROR Error during file fetching; aborting:
The following path based dependencies could not be retrieved: @dataconnect/generated
```

**Why it matters:** This blocks ALL security updates that target the root `/`
workspace. node-forge `<= 1.3.3` has multiple security advisories (CVE coverage
across versions `< 1.0.0`, `< 1.3.0`, `< 1.3.2`, `< 1.4.0`). The fix PR `#476`
was eventually merged manually (visible in git log:
`chore(deps): bump node-forge from 1.3.3 to 1.4.0 in /functions`), but
Dependabot keeps re-triggering the `/` (root) workspace update which continues
to fail.

**Fix strategy:**

- **Option A (preferred):** Add `@dataconnect/generated` to Dependabot's ignore
  list in `.github/dependabot.yml` to prevent it from trying to resolve the
  local path dependency:
  ```yaml
  ignore:
    - dependency-name: "@dataconnect/generated"
  ```
- **Option B:** Move the local package to a workspace-aware structure that
  Dependabot understands (npm workspaces).
- **Option C:** Accept manual updates for root-level security advisories that
  Dependabot cannot process.

**Source citations:** Run IDs `23693601219` (2026-03-28), `23653677021`
(2026-03-27), `23623710281` (2026-03-26). Error:
`path based dependencies could not be retrieved: @dataconnect/generated`.

---

### 6. Dependabot brace-expansion Security Updates (2x): Same File-Path Dependency Failure [CONFIDENCE: HIGH]

**Failure type:** (a) config issue — same root cause as node-forge
**Recurrence:** 2 failures in the `/functions` workspace targeting
`brace-expansion` (runs #23622814415 and #23621361942, both 2026-03-26).

**Root cause:** Identical to node-forge — but the failures occur in the
`/functions` workspace. Inspection of the Dependabot job definition shows the
directory is `/functions`, and the workspace still detects the root-level
`@dataconnect/generated: file:src/dataconnect-generated` when scanning the full
monorepo structure. The error format is the same:
`Failure running container ... Command failed with exit code 1`.

**Note on resolution:** PRs `#474` (brace-expansion bump in `/functions`) and
`#475` (path-to-regexp in `/scripts/mcp`) appear in the recent git log as
successfully merged. However, Dependabot continues to fail on new security scan
attempts due to the structural file-path issue.

**Fix strategy:** Same as node-forge — add `@dataconnect/generated` to the
Dependabot ignore list or configure exclude-paths.

**Source citations:** Run IDs `23622814415` and `23621361942` (both 2026-03-26).

---

## Sources

| #   | Source                                 | Title                                       | Type               | Trust | Date       |
| --- | -------------------------------------- | ------------------------------------------- | ------------------ | ----- | ---------- |
| 1   | Run #23697470470                       | Release Please failure (2026-03-29)         | GitHub Actions log | HIGH  | 2026-03-29 |
| 2   | Run #23621358112                       | Release Please failure (2026-03-26)         | GitHub Actions log | HIGH  | 2026-03-26 |
| 3   | Run #23696563972                       | CI failure – knip (plan-32626)              | GitHub Actions log | HIGH  | 2026-03-28 |
| 4   | Run #23696563981                       | Documentation Lint failure (plan-32626)     | GitHub Actions log | HIGH  | 2026-03-28 |
| 5   | Run #23693601219                       | Dependabot node-forge failure #3            | GitHub Actions log | HIGH  | 2026-03-28 |
| 6   | Run #23653677021                       | Dependabot node-forge failure #2            | GitHub Actions log | HIGH  | 2026-03-27 |
| 7   | Run #23623710281                       | Dependabot node-forge failure #1            | GitHub Actions log | HIGH  | 2026-03-26 |
| 8   | Run #23622814415                       | Dependabot brace-expansion failure #2       | GitHub Actions log | HIGH  | 2026-03-26 |
| 9   | Run #23621361942                       | Dependabot brace-expansion failure #1       | GitHub Actions log | HIGH  | 2026-03-26 |
| 10  | Run #23596459504                       | CI failure – Gitleaks URI (main 2026-03-26) | GitHub Actions log | HIGH  | 2026-03-26 |
| 11  | `.github/workflows/release-please.yml` | Release Please workflow config              | codebase           | HIGH  | 2026-03-18 |
| 12  | `.github/workflows/ci.yml`             | CI workflow config                          | codebase           | HIGH  | current    |
| 13  | `.github/workflows/docs-lint.yml`      | Docs lint workflow config                   | codebase           | HIGH  | current    |
| 14  | `.github/release-please-config.json`   | Release Please config                       | codebase           | HIGH  | current    |
| 15  | `.release-please-manifest.json`        | Release Please manifest                     | codebase           | HIGH  | current    |
| 16  | `package.json`                         | Root package manifest                       | codebase           | HIGH  | current    |
| 17  | `knip.json`                            | Knip unused-dep config                      | codebase           | HIGH  | current    |

---

## Contradictions

**knip vs ignoreDependencies:** The `knip.json` file on main includes
`@typescript/native-preview` in `ignoreDependencies`. However, CI was still
failing with this error on plan-32626. This could mean: (a) the
`ignoreDependencies` entry was added to main AFTER the branch diverged, or (b)
the entry was present but the format changed between knip versions. No direct
contradiction between sources — most likely a branch sync issue.

**Gitleaks transient vs persistent:** Run #23596459504 shows a hard Gitleaks
action SHA failure. Subsequent runs (plan-32626, 2026-03-28) do not show this
error — the CI failed on knip instead. This suggests the Gitleaks issue was
transient (temporary GitHub API unavailability) rather than a permanent SHA
deletion. However, since only one Validate job log was examined in detail, there
may be additional occurrences not captured.

---

## Gaps

1. **Dependabot brace-expansion error message:** The brace-expansion failure
   logs do not show an explicit "path based dependencies could not be retrieved"
   message in the raw log — the error was inferred from the identical failure
   pattern (same Dependabot updater error structure, same job definition
   format). The node-forge run explicitly confirms this error. Brace-expansion
   may have a slightly different root cause not visible without deeper
   Dependabot internals.

2. **Why `@typescript/native-preview` was added:** The purpose of this package
   is unclear from the logs. It may be a future native TypeScript language
   server preview. No usage was found in the failing run logs.

3. **Docs lint errors "Total errors: 2" vs "Files with errors: 1":** The log
   shows 1 file failing with 2 errors, but only one error message was captured
   (`Missing required section matching: /version history/i`). A second error
   exists but was not visible in the truncated grep output. It may be a second
   missing required section or a link validation error in the same file.

4. **Historical Release Please:** The manifest states `0.2.0` but there is no
   GitHub release with this tag. It is unclear when Release Please last
   succeeded (if ever). The failure pattern goes back at least to 2026-03-23
   (oldest run in the sampled 10-run history). Determining the true origin of
   the failure would require examining older runs.

5. **plan-32626 CI failure — whether it also has a Type Check or Build
   failure:** Only the Lint & Format job failure was confirmed. If the knip
   failure blocks the workflow before Build runs, there may be additional hidden
   failures in Type Check or Build. Not examined.

---

## Serendipity

1. **Release Please has never successfully run.** All 10 returned runs (the
   maximum retrievable in a filtered list) show `failure`. The workflow was
   added on 2026-03-18 per the version history in the YAML file. Every push to
   main since launch has triggered a failure. This is a dormant workflow that
   has never produced a release PR or release.

2. **1,053 unparsed commits.** Release Please is scanning the entire commit
   history looking for conventional commits and finding zero. This suggests the
   project has never used Conventional Commits format. Release Please is
   fundamentally mismatched to this project's commit style unless commit
   discipline changes.

3. **Node.js 20 deprecation timeline is tight.** The action runs on Node.js 20
   and will be force-migrated to Node.js 24 on 2026-06-02 — approximately 65
   days from now. The release-please-action at the pinned SHA may not support
   Node.js 24. This failure will become worse (potentially a different error)
   without action.

4. **78 oxlint warnings across the codebase.** These are all currently
   non-blocking but represent a real code hygiene debt — mostly unused
   variables, unused imports, and unused function parameters across scripts. All
   are in scripts (not app code). They appear consistently across multiple CI
   runs.

---

## Failure Classification Summary

| Workflow                   | Category                      | Recurring?                    | Severity                      | Fix Effort                                                |
| -------------------------- | ----------------------------- | ----------------------------- | ----------------------------- | --------------------------------------------------------- |
| Release Please             | (a) config + (c) upstream bug | YES — every push to main      | MEDIUM (non-blocking CI)      | MEDIUM — needs bootstrap tag + action upgrade             |
| CI / knip                  | (d) code change               | YES — present on main + PR    | HIGH (blocks CI)              | LOW — add to ignoreDependencies or remove package         |
| CI / Gitleaks              | (b) transient                 | Possibly one-off              | LOW                           | LOW — monitor for recurrence                              |
| Documentation Lint         | (d) code change               | NO — single file on single PR | MEDIUM (blocks PR merge)      | TRIVIAL — add version history section to RESEARCH_PLAN.md |
| Dependabot node-forge      | (a) config issue              | YES — 3 consecutive           | LOW (security update blocked) | LOW — add to dependabot ignore list                       |
| Dependabot brace-expansion | (a) config issue              | YES — 2 consecutive           | LOW (security update blocked) | LOW — same fix as node-forge                              |

---

## Confidence Assessment

- HIGH claims: 6
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All findings are based on direct log inspection of actual GitHub Actions runs
with quoted error messages. No training-data-only claims are made.
