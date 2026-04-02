# Findings: Why Release Please Is Failing and What the Correct Release Strategy Is

**Searcher:** deep-research-searcher (D11-SQ6a) **Profile:** web + codebase
**Date:** 2026-03-29 **Sub-Question IDs:** D11-SQ6a

---

## Key Findings

### 1. Root Cause 1 — No Bootstrap GitHub Release Exists [CONFIDENCE: HIGH]

Release Please (manifest mode) requires a GitHub Release tagged `sonash-v0.2.0`
to exist as its anchor point. The `.release-please-manifest.json` declares
version `"0.2.0"` for `.`, and the action logs confirm:

```
⚠ Could not find releases.
⚠ Expected 1 releases, only found 0
⚠ Missing 1 paths: .
❯ looking for tagName: sonash-v0.2.0
```

The repo has exactly **zero GitHub Releases** (confirmed via `gh api releases`
returning an empty array) and only one git tag (`v1.0`). Release Please cannot
determine its "starting commit" without this anchor, so it falls back to
scanning all 1,053 commits — and then fails before it can write anything.

**Evidence:** Workflow run #21 log (2026-03-29), `gh api /repos/.../releases` →
empty, `git tag --list` → `v1.0` only.

### 2. Root Cause 2 — The "sha wasn't supplied" Error is a Secondary Failure [CONFIDENCE: HIGH]

The fatal error in every run is:

```
release-please failed: Invalid request.
"sha" wasn't supplied. - https://docs.github.com/rest/repos/contents#create-or-update-file-contents
```

This happens at the step where Release Please tries to write its release-notes
tracking file to a newly created branch
`release-please--branches--main--components--sonash--release-notes`. The
sequence is:

1. Release Please creates the branch from `main` at SHA `270a7051`
2. It immediately tries to PUT a file to that branch via the GitHub Contents API
3. GitHub's Contents API requires the blob SHA of the existing file when
   updating; for a **new file** on a **newly created branch**, the file doesn't
   exist yet, so Release Please incorrectly passes no SHA

This is a known bug in release-please-action. Issue #959 (opened March 2024)
documents the identical failure pattern — the branch is created successfully,
then the next API call fails with this error. The issue remains **open with no
resolution** from maintainers as of March 2026. The root trigger is the missing
bootstrap release: if a bootstrap release existed, Release Please would not need
to create this tracking branch in the first place, as it would have a known
starting point.

**Evidence:** Run #21 log timestamps 00:18:00–00:18:01, release-please-action
issue #959 [1], octokit.net issue #1725 [2].

### 3. Root Cause 3 — Commit History Incompatibility is Partial, Not Total [CONFIDENCE: HIGH]

The known state described "1,053 merge commits with no conventional commits."
This is **inaccurate**. The actual breakdown across all 3,160 commits on main:

| Type                                                                | Count | %   |
| ------------------------------------------------------------------- | ----- | --- |
| Conventional commits (`feat:`, `fix:`, `chore:`, etc.)              | 2,467 | 78% |
| Merge commits (`Merge pull request #N`)                             | 426   | 13% |
| Non-conventional, non-merge (`plan:`, `verify:`, bare descriptions) | ~267  | 8%  |

The 1,053 figure from the run log is the number of commits Release Please
**attempted to scan** (its 500-commit search depth hits the oldest commits first
due to pagination). Of those scanned, many could not be parsed — but these were
primarily "Merge pull request #N" messages, which Release Please rejects as
non-conventional.

**Implication:** The commit history is largely conventional-commit-compatible.
Release Please would work correctly once bootstrapped, because it would start
from a recent anchor and encounter mostly `feat:`/`fix:`/`chore:` messages.

**Evidence:**
`git log --oneline main | grep -cE "^[a-f0-9]+ (feat|fix|chore|...)"` → 2,467;
run log "commit could not be parsed" entries showing "Merge pull request"
messages.

### 4. Node.js 20 Deprecation — Hard Deadline of 2026-06-02 [CONFIDENCE: HIGH]

The pinned action `googleapis/release-please-action@16a9c90856f...` (v4.4.0)
runs on Node.js 20. GitHub will force all actions to Node.js 24 by default on
**June 2, 2026**. Node.js 20 will be **removed entirely on September 16, 2026**.

The `release-please-action` maintainers have a PR (#1188, "feat!: Upgrade to
node24") opened February 24, 2026, which was still unmerged as of March
15, 2026. There is no Node.js 24-compatible release of this action as of
2026-03-29.

This is an independent blocker regardless of the bootstrap issue: even if
Release Please were fixed today, it will break again on June 2, 2026 unless the
maintainers ship v4.5.0+ with Node.js 24 support.

**Evidence:** Run #21 log warning timestamp 00:18:01 [3], release-please-action
issue #1162 [4], release-please-action PR #1188 status [4].

### 5. The Correct Fix for Release Please (If Keeping It) [CONFIDENCE: HIGH]

Two sequential steps are required:

**Step A — Create the bootstrap GitHub Release manually:**

```bash
git tag sonash-v0.2.0 <SHA-of-commit-representing-v0.2.0>
git push origin sonash-v0.2.0
gh release create sonash-v0.2.0 --title "v0.2.0" --notes "Bootstrap release for Release Please"
```

The SHA should be the commit just before which conventional commits tracking
should begin (i.e., the last commit you want to be EXCLUDED from the first
auto-generated changelog).

**Step B — Add `bootstrap-sha` to config to prevent scanning all history:**

In `.github/release-please-config.json`, add at the top level:

```json
{
  "bootstrap-sha": "<full SHA of the commit BEFORE which to stop scanning>",
  "packages": { ... }
}
```

This tells Release Please where to stop looking backwards. Without this, it will
still try to parse all 3,160 commits, producing a massive first changelog.

**Step C — Pin to a SHA that will be updated for Node.js 24:**

Either upgrade to v4.4.0 using the tag (not SHA) so Dependabot can track it, or
wait for v4.5.0 when Node.js 24 support ships. The current pin
`@16a9c90856f42705d54a6fda1823352bdc62cf38` IS v4.4.0 but will break on June
2, 2026.

**Evidence:** Release Please manifest-releaser.md [5], release-please-action
issue #1162 [4].

### 6. Alternative: Release Drafter is a Superior Fit for This Project [CONFIDENCE: MEDIUM-HIGH]

Given the project's commit patterns (78% conventional commits, 13% merge
commits, 9% other), Release Drafter offers several advantages:

| Criterion                     | Release Please               | Release Drafter              |
| ----------------------------- | ---------------------------- | ---------------------------- |
| Works without bootstrap       | No — requires anchor release | Yes — starts immediately     |
| Handles merge commits         | Fails/skips them             | Passes through cleanly       |
| Requires conventional commits | Yes (strict)                 | No — uses PR labels          |
| Active Node.js 24 support     | Not yet (PR pending)         | Yes — maintained action      |
| Node.js migration risk        | High (June 2026 deadline)    | Lower                        |
| First-run complexity          | High (bootstrap required)    | Low                          |
| Version bump automation       | Yes (from commits)           | Yes (from labels)            |
| Draft release UX              | No (creates final PRs)       | Yes (keeps draft you review) |

Release Drafter drafts releases automatically as PRs merge. When ready to ship,
you publish the draft release manually (one click) or via workflow dispatch.
This gives the project a human-review gate before each release, which is
appropriate for a solo developer building a non-published (Firebase-hosted) app.

**Evidence:** Release Drafter repository [6], release drafter documentation [6].

### 7. Alternative: Manual Workflow Dispatch with `softprops/action-gh-release` [CONFIDENCE: MEDIUM]

For a Firebase-hosted Next.js app that does not publish to npm, the simplest
viable approach is a manual trigger workflow:

```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: "Release version (e.g. 0.3.0)"
        required: true
      notes:
        description: "Release notes"
        required: false
```

This eliminates all automation complexity. Combined with
`softprops/action-gh-release`, it creates a GitHub Release with a tag on demand.
The project already has very good commit message discipline (78% conventional)
so a changelog can be generated with `git log --oneline v0.2.0..HEAD` at release
time.

**Downside:** Requires manual trigger — but that may be a feature, not a bug,
for a project that does not ship on a fixed cadence.

### 8. semantic-release is NOT Recommended [CONFIDENCE: MEDIUM]

semantic-release is the other major automated release tool. It would also
require conventional commits (same requirement as Release Please), but is
significantly more complex to configure and has mandatory npm publish behavior
that must be explicitly disabled for non-npm-published projects. The overhead is
not justified here.

---

## Root Cause Summary

The failure chain is:

```
No bootstrap GitHub Release (tag sonash-v0.2.0)
  → Release Please cannot find its anchor commit
  → Falls back to scanning all 1,053 commits in current depth window
  → Parses commit history, finds 0 recognizable releases
  → Tries to create release-notes tracking branch
  → GitHub Contents API: tries to write file to new branch
  → Passes no SHA (bug in release-please-action #959)
  → HTTP 422 "sha wasn't supplied"
  → Run fails
```

This repeats on every push to main because nothing persists between failed runs.

---

## Options Comparison

| Option                                  | Effort | Risk     | Node.js 24             | Works Now       | Recommended        |
| --------------------------------------- | ------ | -------- | ---------------------- | --------------- | ------------------ |
| A. Fix Release Please (bootstrap + sha) | Medium | Low      | Blocked until ~Q2 2026 | After fix       | If committed to RP |
| B. Switch to Release Drafter            | Low    | Very Low | Yes                    | Immediately     | YES                |
| C. Manual workflow dispatch             | Low    | None     | Yes                    | Immediately     | Good fallback      |
| D. Remove release automation entirely   | None   | None     | N/A                    | Now             | Not recommended    |
| E. Adopt semantic-release               | High   | Medium   | Yes                    | After migration | No                 |

---

## Recommended Approach

**Option B: Replace Release Please with Release Drafter**, with a one-time
manual bootstrap release to anchor the history.

### Implementation Steps

**Phase 1 — Create bootstrap release (30 min):**

1. Identify the commit SHA you want to call v0.2.0 (likely current HEAD or the
   last meaningful feat: commit before the research phase)
2. `git tag sonash-v0.2.0 <SHA>`
3. `git push origin sonash-v0.2.0`
4. `gh release create sonash-v0.2.0 --title "v0.2.0 (Bootstrap)" --notes "Initial versioned release"`

**Phase 2 — Remove Release Please workflow:**

1. Delete or disable `.github/workflows/release-please.yml`
2. Keep `.github/release-please-config.json` and `.release-please-manifest.json`
   in place or archive them (they do no harm)

**Phase 3 — Add Release Drafter (45 min):**

1. Create `.github/release-drafter.yml`:

```yaml
name-template: "v$RESOLVED_VERSION"
tag-template: "v$RESOLVED_VERSION"
categories:
  - title: "Features"
    labels: ["enhancement", "feature"]
  - title: "Bug Fixes"
    labels: ["bug", "fix"]
  - title: "Maintenance"
    labels: ["chore", "maintenance", "dependencies"]
  - title: "Documentation"
    labels: ["documentation"]
change-template: "- $TITLE @$AUTHOR (#$NUMBER)"
template: |
  ## Changes
  $CHANGES
version-resolver:
  major:
    labels: ["breaking-change"]
  minor:
    labels: ["enhancement", "feature"]
  patch:
    labels: ["bug", "fix", "chore", "maintenance", "dependencies"]
  default: patch
```

2. Create `.github/workflows/release-drafter.yml`:

```yaml
name: Release Drafter
on:
  push:
    branches: [main]
  pull_request:
    types: [opened, reopened, synchronize]

permissions:
  contents: read

jobs:
  update-release-draft:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: release-drafter/release-drafter@v6
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Phase 4 — Label existing PRs (optional):**

- Apply labels retroactively to past PRs for changelog generation, OR
- Accept that the first Release Drafter release notes will be based on PRs
  merged after the workflow is added

**Total effort:** ~2 hours

---

## Contradictions

**"1,053 merge commits" vs actual data:** The sub-question brief stated the repo
uses "no conventional commits — 1,053 merge commits." The actual repo data shows
78% conventional commits (2,467 of 3,160 total). The 1,053 figure appears to
come from the run log's "commits: 1053" line, which is the scan depth limit, not
the total commit count, and not a measure of commit quality. This is a
significant inaccuracy in the problem statement — the commit history is actually
well-suited for Release Please once bootstrapped.

**Release Please SHA bug vs bootstrap theory:** Some sources suggest the "sha
wasn't supplied" error is entirely caused by missing bootstrap release. The run
logs tell a more nuanced story: Release Please successfully creates the tracking
branch, then fails on the file write. This is a distinct code path that is
triggered BY the missing bootstrap but is also a bug in Release Please itself
(issue #959). Both problems must be resolved.

---

## Gaps

1. **Exact SHA to use for bootstrap release:** Cannot determine from the data
   available which commit the user intended to represent v0.2.0. This requires a
   user decision.
2. **Whether the Node.js 24 PR (#1188) will ship before June 2026:** Unknown —
   depends on maintainer velocity.
3. **Release Drafter compatibility with current GitHub label setup:** The repo's
   existing PR labels were not audited in this research. Label naming in
   release-drafter.yml must match existing labels or labels must be created.
4. **Impact of `plan:` and `verify:` prefix commits on Release Please:** These
   ~9 commits would be skipped by Release Please as unrecognized. This is minor
   but means those commits would not appear in changelogs.

---

## Serendipity

- The project has significantly better conventional commit hygiene than the
  brief indicated. 78% of commits follow the convention — this is actually good
  news for Release Please viability post-bootstrap, or for any commit-based
  release tool.
- The `v1.0` git tag exists but has no corresponding GitHub Release. If this was
  intended as the bootstrap point, creating a GitHub Release from it would
  resolve the anchor problem.
- release-please-action maintainers have a pending PR for Node.js 24 support (PR
  #1188) — if it ships within the next few weeks, the Node.js 24 timeline risk
  drops significantly.

---

## Sources

| #   | URL                                                                                        | Title                                        | Type            | Trust  | CRAAP | Date       |
| --- | ------------------------------------------------------------------------------------------ | -------------------------------------------- | --------------- | ------ | ----- | ---------- |
| 1   | https://github.com/googleapis/release-please-action/issues/959                             | release-please failed: "sha" wasn't supplied | Issue tracker   | HIGH   | 4.2   | 2024-03    |
| 2   | https://github.com/octokit/octokit.net/issues/1725                                         | SHA not supplied while creating new file     | Issue tracker   | MEDIUM | 3.8   | 2020       |
| 3   | gh run view 23697470470 (live data)                                                        | Run #21 failure log                          | Primary source  | HIGH   | 5.0   | 2026-03-29 |
| 4   | https://github.com/googleapis/release-please-action/issues/1162                            | Update action to use node24                  | Issue tracker   | HIGH   | 4.5   | 2025-11    |
| 5   | https://raw.githubusercontent.com/googleapis/release-please/main/docs/manifest-releaser.md | Manifest Releaser docs                       | Official docs   | HIGH   | 4.8   | 2025       |
| 6   | https://github.com/release-drafter/release-drafter                                         | Release Drafter repository                   | Official source | HIGH   | 4.3   | 2025-2026  |
| 7   | https://github.com/googleapis/release-please-action/releases                               | release-please-action releases               | Official source | HIGH   | 4.7   | 2025-10    |
| 8   | https://oneuptime.com/blog/post/2026-01-25-automate-releases-github-actions/view           | Automate Releases with GitHub Actions        | Blog            | MEDIUM | 3.5   | 2026-01    |

---

## Confidence Assessment

- HIGH claims: 5
- MEDIUM-HIGH claims: 1
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The root cause is fully established by primary evidence (live run logs + API
data). The fix recommendations are based on official documentation and
established patterns. The main uncertainty is in timing of the Node.js 24
release-please-action update.
