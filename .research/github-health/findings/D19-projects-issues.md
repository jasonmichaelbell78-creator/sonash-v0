# Findings: GitHub Projects, Milestones, and Issue Management for Solo Dev

**Searcher:** deep-research-searcher **Profile:** web + codebase **Date:**
2026-03-29 **Sub-Question IDs:** D19-SQ11

---

## Current State (Verified via API and Filesystem)

| Dimension           | Current State                                                                     |
| ------------------- | --------------------------------------------------------------------------------- |
| GitHub Projects     | `has_projects=true` but zero projects configured                                  |
| Milestones          | Zero milestones (API returned empty)                                              |
| Open issues         | 1 (issue #151: Re-enable Firebase App Check)                                      |
| Closed issues       | 0 (no closed non-PR issues found)                                                 |
| Total labels        | 31 (including tier-0 through tier-4 from auto-label workflow)                     |
| Issue templates     | 2 (bug_report.md, feature_request.md)                                             |
| Existing automation | auto-label-review-tier.yml (PR-only), backlog-enforcement.yml                     |
| Roadmap system      | ROADMAP.md + ROADMAP_FUTURE.md + ROADMAP_LOG.md (highly structured, version 3.28) |

**Key observation:** This repo has essentially zero issue traffic. The single
open issue (#151) is a deferred action item (App Check re-enablement blocked on
Firebase support), not an externally-filed bug. There are no closed non-PR
issues in the last 100 results. The project tracks work almost entirely through
ROADMAP.md milestones and AI-assisted sessions, not GitHub Issues.

---

## Key Findings

### 1. GitHub Projects v2 Would Be Redundant Given ROADMAP.md [CONFIDENCE: HIGH]

The project already has a highly sophisticated in-repo roadmap system:
ROADMAP.md (v3.28, updated 2026-03-19) with 18+ milestones, a dependency graph,
priority buckets (P0-P2), phase sequencing, and separate future/log files. This
exceeds what GitHub Projects v2 provides by default.

The core value proposition of GitHub Projects v2 is: "keep planning next to your
code, no context switching required." For this repo, ROADMAP.md already achieves
this — it lives in the repo, is versioned in git, readable by AI assistants via
CLAUDE.md references, and validates via `npm run roadmap:validate`.

GitHub Projects v2 would add: a visual Kanban board, drag-and-drop status
changes, and timeline views. These benefits exist mainly when issues are the
primary work-tracking unit. Since this repo generates ~0 issues per week (1
open, 0 closed), a Project board would be mostly empty and require manual
population.

**Verdict:** Not recommended unless issue usage increases substantially. The
ROADMAP.md system is more powerful for this repo's actual workflow. [1][4]

### 2. GitHub Projects v2 Built-in Automation Is Limited [CONFIDENCE: HIGH]

The documented built-in automations in Projects v2 are:

- Auto-set status to "Done" when issue/PR is closed
- Auto-set status to "Done" when PR is merged
- Auto-add items from a repository matching a filter
- Auto-archive completed items

The auto-add workflow has a plan-based limit: **GitHub Free = 1 workflow, GitHub
Pro = 5 workflows**. [2]

A critical limitation: "When you enable the auto-add workflow, existing items
matching your criteria will not be added" — only future items are captured.
Given the near-zero issue volume here, auto-add provides minimal value.

The Projects API requires `read:project` token scope, which is not in the
current token configuration (confirmed by API error during this research). This
would also affect any GitHub Actions that query project state.

### 3. Milestones Have Marginal Value, But One Targeted Use Case Exists [CONFIDENCE: MEDIUM]

GitHub milestones are designed to group issues and PRs toward a release goal,
showing progress as a percentage. Standard use: create a "v1.0.0" milestone,
attach relevant issues/PRs, watch the percentage tick up.

**For this repo specifically:**

- Zero issues means milestones would only track PRs, and most PRs here are tied
  to AI-driven work sessions, not externally-reported issues
- Release Please (already configured) manages version bumping and changelog
  generation from conventional commits — it does not natively create or close
  milestones
- The ROADMAP.md milestone system is richer: it tracks progress %, priority,
  phase, blockers, and item counts — none of which GitHub milestones support

**One legitimate use case:** If the App Check issue (#151) is attached to a
milestone named "App Check Re-enablement" or "v1.2.0", GitHub will surface the
milestone progress in the UI. This is visible to any external viewer and creates
a lightweight accountability marker.

**Verdict:** Not worth setting up a full milestone hierarchy. One targeted
milestone for the current open issue or next planned release would add marginal
value without overhead. [3][5]

### 4. Issue Automation Is Largely Unnecessary at Current Issue Volume [CONFIDENCE: HIGH]

With 1 open issue and 0 historical closed issues, stale issue automation,
auto-labeling of issues, and issue triage workflows would all fire on near-empty
state. Specifically:

- **Stale bot** (`actions/stale`): Appropriate for repos receiving external
  contributions where issues accumulate. For a private solo project with ~0
  external contributors, stale automation adds noise and configuration overhead
  with zero benefit.
- **Auto-labeling issues**: The current `auto-label-review-tier.yml` correctly
  targets PRs only — this is correct behavior. Applying auto-labeling to issues
  would require a different signal (issue title patterns, template fields) and
  would need content to label.
- **Issue-to-PR linking**: The `pull_request_template.md` already has a "Related
  Issues/PRs" section with `Closes #` syntax — this is the correct approach and
  already in place.

**Exception:** If the project becomes public or starts receiving external issue
reports, issue automation becomes relevant. At that inflection point, consider a
triage workflow.

### 5. Label Taxonomy Has Significant Redundancy and Inconsistency [CONFIDENCE: HIGH]

Current label inventory (31 labels) analyzed by category:

**Security labels — 3 labels with overlapping semantics:**

- `Security` (d1bcf9, no description)
- `Security fix` (d1bcf9, no description)
- `Possible security concern` (d1bcf9, no description)

These represent three different concepts: a security category, a resolution
type, and a triage flag. They should be consolidated or differentiated with
clear descriptions and distinct colors.

**Bug labels — 2 overlapping:**

- `bug` (d73a4a / GitHub default red) — "Something isn't working"
- `Bug fix` (1d76db / blue) — no description

`bug` classifies the issue type. `Bug fix` classifies the PR resolution type.
These serve different purposes but the naming suggests they label the same
thing. `Bug fix` should be renamed to something unambiguous like `type: fix` or
eliminated in favor of using the `bug` label on both issues and the PRs that
resolve them (via conventional commits).

**Review tier labels — 5 labels (tier-0 through tier-4):** These are correctly
automated by `auto-label-review-tier.yml`. However, the label inventory shows
tier-0, tier-1, tier-2, and tier-4 but is missing tier-3 (the orange "Heavy"
tier). The workflow references tier-3 in `tierDescriptions` and `tierDetails`
but the label may not have been pre-created. This is a gap.

**Release/autorelease labels — inconsistent:**

- `autorelease: pending` (ededed) — created by Release Please, correct
- `autorelease: tagged` — not present in label list but may be created
  dynamically by Release Please when a release is tagged

**`release.yml` dependency:** The release notes categorization uses labels
`security`, `feature`, `bug`, `fix`, `refactor`, `refactoring`, `testing`,
`test`, `ci`, `infrastructure`, `documentation`, `docs`, `breaking`,
`breaking-change`. However, the actual repo labels use different casing:
`Security` not `security`, `Refactoring` not `refactor`. This **mismatch means
the release notes categories would not match the applied labels**, causing all
PRs to fall into "Other Changes." [6]

**Unused labels with no apparent workflow:**

- `codex` (ededed) — no description, no automation
- `Failed compliance check` (d1bcf9) — no description, possibly stale
- `Other` (d1bcf9) — no description, overly generic
- `needs-review` (ededed) — no description, not connected to review tier system

**Review effort labels — 5 labels (1/5 through 5/5):** These appear to be review
effort estimations. However, the existing tier system (tier-0 through tier-4)
already encodes review complexity. Having both `Review effort X/5` and `tier-X`
is redundant unless they serve distinct purposes. No workflow was found that
reads `Review effort` labels.

### 6. Recommended Minimal Label Taxonomy for This Repo [CONFIDENCE: MEDIUM]

Based on the actual workflows in use (tier-based labeling, release-please,
backlog enforcement) and the release.yml categories, a rationalized set would
be:

**Keep (essential, actively used):**

- `tier-0` through `tier-4` — auto-assigned by workflow
- `autorelease: pending` — managed by Release Please
- `dependencies` — Dependabot
- `bug` — issue template default
- `enhancement` — issue template default
- `documentation` — PR categorization
- `security` (rename from `Security`) — release notes + triage

**Add (missing for release.yml to work):**

- `feature` — maps to Features category in release.yml
- `fix` — maps to Bug Fixes category in release.yml (alongside `bug`)
- `refactor` — maps to Refactoring category in release.yml
- `ci` — maps to Infrastructure & CI category in release.yml
- `breaking` — maps to Breaking Changes category in release.yml
- `tier-3` — currently missing from label list despite being referenced in
  workflow

**Consolidate/rename:**

- `Bug fix` → delete (redundant with `bug` + conventional commits)
- `Security fix` → delete or rename to `security` (consolidate)
- `Possible security concern` → rename to `security: triage` for clarity
- `Refactoring` → lowercase to `refactor` (matches release.yml)
- `Tests` → rename to `test` (matches release.yml)

**Delete (unused, no workflow integration):**

- `codex`
- `Failed compliance check`
- `Other`
- `needs-review`
- `Review effort 1/5` through `Review effort 5/5` (redundant with tier system)
- `tier-4` — wait, this is needed (keep)

**Result:** ~18-20 labels vs current 31, with every label either auto-assigned
by a workflow or mapped to a release.yml category.

### 7. Issue Templates Are Adequate but Could Add a Maintenance Template [CONFIDENCE: MEDIUM]

The current templates (bug_report.md and feature_request.md) are
well-structured:

- Bug report has all standard fields plus auth state context
- Feature request has a "ROADMAP Alignment" section — genuinely useful for solo
  dev self-discipline

The `config.yml` contact links are thoughtful (App Check tracker, Security
Policy).

**Gap:** There is no template for maintenance/chore tasks (dependency upgrades,
refactoring, tech debt items). Since the backlog enforcement workflow monitors
`MASTER_DEBT.jsonl` rather than GitHub issues, this may be intentional. However,
if the workflow ever shifts to using issues for debt tracking, a "maintenance"
template would be needed.

**Gap:** `blank_issues_enabled: true` means anyone can bypass templates. For an
active public project, this is appropriate. For a private solo project, it's
harmless.

### 8. Release Please + Labels Integration Has a Bug [CONFIDENCE: HIGH]

The `release.yml` changelog categories use lowercase labels (`security`,
`refactor`, `refactoring`, `testing`, `test`). The repo labels use title case
(`Security`, `Refactoring`, `Tests`). GitHub label matching in `release.yml` is
**case-sensitive** for the `labels:` filter in changelog categories.

This means:

- PRs labeled `Refactoring` will NOT appear in the "Refactoring" changelog
  section (which looks for `refactor` or `refactoring`)
- PRs labeled `Security` will NOT appear in the "Security" section (which looks
  for `security`)
- They will fall into "Other Changes"

**Fix:** Either (a) rename the repo labels to lowercase to match `release.yml`,
or (b) update `release.yml` to add the title-case variants alongside the
lowercase ones.

### 9. Solo Developer GitHub Project Management: Research Summary [CONFIDENCE: MEDIUM]

From multiple sources [1][7][8], the consensus for productive solo developers:

1. **Projects v2 is low-value when issue volume is low.** The overhead of
   maintaining a board (keeping statuses current, creating items) is not
   justified when you're the only one reading it. Value increases with external
   contributors or public issue tracking.

2. **Milestones work best as version markers**, not planning tools. Attaching a
   "v1.x" milestone to Dependabot PRs and release PRs so they group correctly in
   the release notes viewer is a practical, low-overhead use.

3. **Label taxonomy should be driven by automation needs**, not by what looks
   comprehensive. Every label that exists but is never queried by a workflow or
   filter is noise.

4. **The ROADMAP.md pattern used here is unusual but highly effective** for
   AI-assisted solo development. It gives the AI assistant a stable,
   version-controlled, machine-readable planning artifact that GitHub Projects
   cannot replicate. The tradeoff is that it requires discipline to keep current
   — but this repo's v3.28 suggests that discipline exists.

---

## Sources

| #   | URL                                                                                                                       | Title                                                  | Type           | Trust  | CRAAP | Date    |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------- | ------ | ----- | ------- |
| 1   | https://www.bitovi.com/blog/github-projects-for-solo-developers                                                           | GitHub Projects for Solo Developers                    | Community blog | MEDIUM | 3.5/5 | 2023    |
| 2   | https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/adding-items-automatically  | Adding Items Automatically - GitHub Docs               | Official docs  | HIGH   | 5/5   | 2025    |
| 3   | https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/about-milestones                              | About Milestones - GitHub Docs                         | Official docs  | HIGH   | 5/5   | 2025    |
| 4   | https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/best-practices-for-projects | Best Practices for Projects - GitHub Docs              | Official docs  | HIGH   | 5/5   | 2025    |
| 5   | https://github.orgs/community/discussions/11832                                                                           | Iteration vs Milestone community discussion            | Community      | MEDIUM | 3/5   | 2023    |
| 6   | https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes                | Auto-generated release notes - GitHub Docs             | Official docs  | HIGH   | 5/5   | 2025    |
| 7   | https://dev.to/jorenrui/a-look-into-how-i-manage-my-personal-projects-my-git-github-workflow-1e7h                         | Personal project Git/GitHub workflow - DEV Community   | Community      | MEDIUM | 3/5   | 2022    |
| 8   | https://github.blog/changelog/2025-04-09-evolving-github-issues-and-projects/                                             | Evolving GitHub Issues and Projects - GitHub Changelog | Official       | HIGH   | 5/5   | 2025-04 |
| 9   | Filesystem: `.github/workflows/`, `.github/ISSUE_TEMPLATE/`, `.github/release.yml`, `ROADMAP.md`                          | Local codebase inspection                              | Codebase       | HIGH   | 5/5   | 2026-03 |

---

## Contradictions

**ROADMAP.md vs GitHub Projects as "single source of truth":** GitHub Docs
recommends maintaining a "single source of truth" in Projects. This conflicts
with the existing ROADMAP.md approach. However, the Projects recommendation
assumes issues are the primary work-tracking unit. In this repo, work is tracked
through AI sessions, conventional commits, and ROADMAP.md. GitHub's guidance
doesn't contemplate this workflow pattern. No contradiction that needs
resolution — they're different models for different workflows.

**Issue volume suggests the issue templates may be decorative:** Both templates
exist and are well-written, but the repo has generated only 1 issue in its
entire history (number 151 implies ~150 issues were created at some point, but
only 1 is accessible, suggesting large-scale closure or a different issue
history). The templates are valuable insurance but not currently driving
workflow.

---

## Gaps

1. **Cannot confirm GitHub Projects v2 configuration** — the GraphQL API call
   for `projectsV2` was blocked by missing `read:project` token scope. Cannot
   verify whether any projects exist (though the REST API `has_projects=true`
   flag indicates the feature is enabled, not that projects were created).

2. **Issue history gap** — Issue #151 exists but `issues?state=closed` returned
   empty. The number 151 implies 150+ previous issues, but they're not
   accessible via the current query (possibly deleted, or the numbering includes
   PRs). Cannot fully assess historical issue usage patterns.

3. **`tier-3` label existence unconfirmed** — The `auto-label-review-tier.yml`
   workflow references tier-3 but it wasn't in the `labels` API response. The
   workflow creates missing labels dynamically, so tier-3 would only appear in
   the labels list after a tier-3 PR was opened. Cannot confirm it exists
   without `read:project` or a PR-level query.

4. **Release.yml case-sensitivity behavior** — The finding that label matching
   is case-sensitive in `release.yml` is based on documentation analysis. This
   should be verified against an actual Release Please release to confirm
   whether the "Other Changes" bucket is getting PRs that should appear in
   categorized sections.

5. **No research on GitHub Copilot workspace integration** with Projects —
   GitHub is actively evolving AI features for Issues (sub-issues GA April 2025,
   issue types). Future integration value for AI-assisted solo workflows not
   assessed.

---

## Serendipity

**Release.yml label mismatch is actionable immediately.** The case mismatch
between repo labels (title case) and `release.yml` categories (lowercase) means
every release changelog is likely miscategorized. PRs labeled `Security`,
`Refactoring`, `Tests` are all falling into "Other Changes." This is a concrete
fix — either update 6 labels to lowercase or add title-case variants to
`release.yml`.

**The backlog-enforcement workflow references an archived file.**
`backlog-enforcement.yml` checks for `docs/AUDIT_FINDINGS_BACKLOG.md` but the
file was archived in TDMS Phase 2 (2026-01-31). The workflow gracefully handles
this by outputting `total=0` and `exit_code=0` when the file is absent. However,
this means the "backlog health" check is now a no-op — it's not actually
checking anything. The PR comment logic that warns about backlog size would
never fire. This is benign but the job continues to run weekly consuming CI
minutes for no value.

---

## Recommended Actions (Prioritized)

**Immediate (no overhead, fixes existing bugs):**

1. Fix the `release.yml` label case mismatch — add title-case variants to each
   category, or rename the 6 conflicting labels to lowercase
2. Create `tier-3` label explicitly (orange `F9A825`) so it exists before a
   tier-3 PR is opened
3. Delete or disable the `backlog-health` job in `backlog-enforcement.yml` (or
   point it at `MASTER_DEBT.jsonl`)

**Low effort, meaningful improvement:** 4. Delete ~10 unused labels: `codex`,
`Failed compliance check`, `Other`, `needs-review`, `Review effort 1/5` through
`Review effort 5/5` 5. Add missing labels required by `release.yml`: `feature`,
`fix`, `refactor`, `ci`, `breaking` 6. Rename: `Security` → `security`,
`Refactoring` → `refactor`, `Tests` → `test`, `Bug fix` → delete

**Optional (only if issue volume increases):** 7. Create one milestone for issue
#151 ("App Check Re-enablement") — creates accountability marker 8. Create a
single GitHub Project with two views (Backlog table + Kanban) only if external
contributors start filing issues

**Do not do:**

- Full GitHub Projects v2 setup while issue volume is ~0
- Stale issue automation (no issue volume to go stale)
- Milestone hierarchy to mirror ROADMAP.md (duplicates existing system)

---

## Confidence Assessment

- HIGH claims: 5 (Projects redundancy, automation limits, label redundancy,
  release.yml bug, issue volume)
- MEDIUM claims: 3 (milestones use case, label taxonomy recommendation, solo dev
  research summary)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** — findings are grounded in direct API queries,
  filesystem inspection, and official documentation. The main gap (Projects v2
  API scope) does not affect the core recommendations.
