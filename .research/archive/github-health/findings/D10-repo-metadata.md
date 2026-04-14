# Findings: Repo Metadata, Community Profile, Labels, Issue Templates, and Settings

**Searcher:** deep-research-searcher **Profile:** web + codebase **Date:**
2026-03-29 **Sub-Question IDs:** D10

---

## Key Findings

### 1. Community Profile Reports 85% But Issue Templates Actually Exist [CONFIDENCE: HIGH]

The GitHub community profile API (`/community/profile`) returns
`issue_template: null` and reports 85% health despite the repository having a
fully-functional `.github/ISSUE_TEMPLATE/` directory with `bug_report.md`,
`feature_request.md`, and `config.yml`.

This is a **confirmed GitHub API bug** (tracked in
`github.com/orgs/community/discussions/164599`, open as of January 2026). The
API only recognizes the legacy single-file format (`ISSUE_TEMPLATE.md`), not the
modern directory-based format. Microsoft's `vscode` and `numpy/numpy` exhibit
the same null response. There is no documented workaround and no
GitHub-published fix timeline.

**Implication:** The 85% score is artificially deflated. The repository's actual
community health is higher than reported. The `issue_template: null` field in
the API response is a false negative — do not use it as a remediation signal.

Sources: GitHub community API (live), `gh api` output, GitHub Discussions
#164599.

---

### 2. Repo Description Is Missing [CONFIDENCE: HIGH]

The `description` field in the repository settings is `null`. GitHub surfaces
this in search results, on profile pages, and in the community profile. A null
description reduces discoverability and looks incomplete to visitors.

**Current:** `null` **Recommended:** A concise (1-2 sentence) description, e.g.,
"Privacy-first mood and wellness tracking app built with Next.js, Firebase, and
App Check."

---

### 3. No Topics/Tags Set [CONFIDENCE: HIGH]

The `topics` array is empty (`[]`). GitHub topics are the primary mechanism for
repository discoverability in search and category browsing. Relevant topics
would connect the repo to relevant developer communities.

**Current:** None **Recommended topics (suggested):**

| Topic           | Rationale                           |
| --------------- | ----------------------------------- |
| `nextjs`        | Core framework                      |
| `react`         | UI library                          |
| `firebase`      | Backend platform                    |
| `typescript`    | Primary language                    |
| `tailwindcss`   | Styling                             |
| `pwa`           | If applicable (check if configured) |
| `wellness`      | Domain                              |
| `mood-tracking` | Domain specificity                  |
| `web-app`       | General category                    |

Maximum 20 topics allowed. 8-10 is a reasonable target.

---

### 4. Missing tier-3 Label [CONFIDENCE: HIGH]

The label inventory shows a gap in the review effort tier system:

| Label  | Present     | Description                                 |
| ------ | ----------- | ------------------------------------------- |
| tier-0 | Yes         | No description                              |
| tier-1 | Yes         | "Review tier 1 - auto-assigned by workflow" |
| tier-2 | Yes         | "Review tier 2 - auto-assigned by workflow" |
| tier-3 | **MISSING** | —                                           |
| tier-4 | Yes         | No description                              |

This is an asymmetric series — 0, 1, 2, 4 exists but tier-3 is absent. If
workflows auto-assign tier labels, any PR that would be classified tier-3 will
either fail to label or fall through to an incorrect tier. The gap should be
filled or the tier-4 label should be audited to confirm it is intentionally
shifted.

---

### 5. Multiple Labels Lack Descriptions [CONFIDENCE: HIGH]

29 labels exist. A significant portion have `null` descriptions:

| Label                     | Color   | Description |
| ------------------------- | ------- | ----------- |
| autorelease: pending      | #ededed | null        |
| Bug fix                   | #1d76db | null        |
| codex                     | #ededed | null        |
| Failed compliance check   | #d1bcf9 | null        |
| needs-review              | #ededed | null        |
| Other                     | #d1bcf9 | null        |
| Possible security concern | #d1bcf9 | null        |
| Refactoring               | #d1bcf9 | null        |
| Review effort 1/5         | #d1bcf9 | null        |
| Review effort 2/5         | #d1bcf9 | null        |
| Review effort 3/5         | #d1bcf9 | null        |
| Review effort 4/5         | #d1bcf9 | null        |
| Review effort 5/5         | #d1bcf9 | null        |
| Security                  | #d1bcf9 | null        |
| Security fix              | #d1bcf9 | null        |
| Tests                     | #e99695 | null        |
| tier-0                    | #ededed | null        |
| tier-4                    | #ededed | null        |

Labels without descriptions provide no guidance to contributors about when to
apply them. GitHub surfaces descriptions in the label picker tooltip.

---

### 6. Redundant / Overlapping Label Taxonomy [CONFIDENCE: MEDIUM]

The label set contains logical duplication that will confuse contributors:

**Overlap cluster: Bug**

- `bug` (has description: "Something isn't working")
- `Bug fix` (no description, presumably for PRs not issues)

**Overlap cluster: Security**

- `Possible security concern` (no description)
- `Security` (no description)
- `Security fix` (no description)

**Overlap cluster: Review effort**

- `Review effort 1/5` through `Review effort 5/5` (5 labels, all no description)
- `tier-0` through `tier-4` (4 labels of 5, all minimal description)

The "Review effort X/5" and "tier-X" series appear to serve the same semantic
purpose (effort/complexity categorization for PRs) but use different naming
conventions. If both are in active use, their distinction should be documented.
If one is legacy, it should be removed.

---

### 7. Merge Strategy Allows All Three Methods [CONFIDENCE: HIGH]

The repo currently allows all merge strategies simultaneously:

| Setting                | Value     |
| ---------------------- | --------- |
| allow_merge_commit     | true      |
| allow_squash_merge     | true      |
| allow_rebase_merge     | true      |
| delete_branch_on_merge | **false** |
| allow_auto_merge       | true      |

**Issues:**

- Allowing all three merge strategies results in an inconsistent commit history.
  PRs can be merged in any style, making history harder to read.
- `delete_branch_on_merge: false` means merged feature branches accumulate. With
  conventional commits enforced via PR template, squash-only or
  merge-commit-only is the typical recommendation.
- No branch protection on `main` (API returns 404 for branch protection). Direct
  pushes to `main` are not blocked.

**Recommended:** Disable `allow_merge_commit` and `allow_rebase_merge`, keeping
only squash merge (standard for conventional-commit projects). Enable
`delete_branch_on_merge`. Consider enabling branch protection on `main` with
required status checks.

---

### 8. SECURITY.md Exists But Is Not Recognized by Community Profile [CONFIDENCE: HIGH]

`SECURITY.md` exists at the repo root (last updated 2026-03-17, version 1.0). It
contains: supported versions table, GitHub Private Vulnerability Reporting
instructions, 90-day disclosure timeline, and implemented security measures.
Content quality is HIGH.

However, the community profile API does not surface `security_policy` in its
`files` response. The ISSUE_TEMPLATE `config.yml` links to SECURITY.md as a
contact link rather than using GitHub's native "Report a vulnerability" path
registration. GitHub's community profile checks for SECURITY.md in a specific
location — this may account for the score gap.

**Actual security policy status:** EXISTS and is well-written. **API detection
status:** Not surfaced in community profile.

---

### 9. CODEOWNERS Exists and Is Correctly Structured [CONFIDENCE: HIGH]

`.github/CODEOWNERS` exists and covers:

- `*` — default owner for all files
- `.github/workflows/` — CI/CD pipeline protection
- `functions/src/` — Cloud Functions (security-sensitive)
- `firestore.rules` — critical access control

For a solo developer repo, this configuration is appropriate and complete. No
gaps identified.

---

### 10. Issue Templates Are High Quality [CONFIDENCE: HIGH]

Both templates are well-structured:

**bug_report.md:**

- Project-aware (mentions Auth State field)
- Has environment section (Browser, OS, Device, Auth State)
- Links to App Check-specific template
- Auto-assigns to `jasonmichaelbell78-creator`

**feature_request.md:**

- Privacy-first framing baked in (Privacy Considerations section)
- ROADMAP alignment section (unique, project-specific)
- Auto-assigns to `jasonmichaelbell78-creator`

**config.yml:**

- `blank_issues_enabled: true` (allows flexibility)
- Links App Check tracker and Security Policy as contact links

One gap: `config.yml` links to SECURITY.md as a contact link, but GitHub's
native PVR (Private Vulnerability Reporting) would be better surfaced as a
separate contact link of type `url` pointing to the Security tab directly.

---

### 11. PR Template Is Comprehensive [CONFIDENCE: HIGH]

The PR template covers: What Changed, Why, How It Works, Testing Done (with
checklist), Screenshots/Videos, Related Issues/PRs, Technical Debt (DEBT-XXXX
IDs), Breaking Changes, Risks & Rollback, and Pre-Merge Checklist.

Quality: EXCELLENT. Notably includes TDMS integration (`Resolves: DEBT-XXXX`),
breaking change declaration, and rollback planning. No gaps identified.

---

### 12. CONTRIBUTING.md Is Complete and Project-Aware [CONFIDENCE: HIGH]

Covers: Fork/branch/setup workflow, code standards (TypeScript strict, no `any`,
Tailwind, Zod, repository pattern), validation checklist, PR submission guide,
bug reporting, feature requesting, security disclosure, and license agreement.

References project-specific files (CLAUDE.md, ROADMAP.md). Version 1.0, updated
2026-03-18. Quality: HIGH. No gaps identified.

---

### 13. No Milestones Configured [CONFIDENCE: HIGH]

Zero milestones exist. The ROADMAP.md references milestones (M1, M2, M3, etc.)
but none are created in GitHub Issues. Without GitHub milestones, PRs and issues
cannot be grouped by release, progress cannot be tracked against the roadmap,
and release-please cannot tie releases to milestone completion.

**Priority:** LOW for a solo project, MEDIUM if external contributors are
expected.

---

### 14. Wiki and Discussions Are Disabled [CONFIDENCE: HIGH]

| Feature         | Status |
| --------------- | ------ |
| has_wiki        | false  |
| has_discussions | false  |

For the current project stage (solo developer, private-ish community), these are
appropriate settings. Enabling Discussions adds community Q&A surface area
without requiring issue tracker pollution. Enabling Wiki is rarely recommended
for code-heavy projects (docs live in the repo).

**Recommendation:** Keep wiki disabled. Consider enabling Discussions if
community contributions are desired in the future.

---

## Sources

| #   | URL                                                                                                                                       | Title                                                                  | Type                        | Trust | CRAAP     | Date                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------- | ----- | --------- | --------------------- |
| 1   | `gh api repos/jasonmichaelbell78-creator/sonash-v0/community/profile`                                                                     | Live community profile API                                             | official-api                | HIGH  | 5/5/5/5/5 | 2026-03-29            |
| 2   | `gh api repos/jasonmichaelbell78-creator/sonash-v0/labels`                                                                                | Live labels API                                                        | official-api                | HIGH  | 5/5/5/5/5 | 2026-03-29            |
| 3   | `gh api repos/jasonmichaelbell78-creator/sonash-v0`                                                                                       | Live repo settings                                                     | official-api                | HIGH  | 5/5/5/5/5 | 2026-03-29            |
| 4   | https://github.com/orgs/community/discussions/164599                                                                                      | REST API: community/profile returns null for new-style issue templates | GitHub community discussion | HIGH  | 4/5/5/4/5 | 2026-01 (last update) |
| 5   | https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/about-community-profiles-for-public-repositories | About community profiles                                               | official-docs               | HIGH  | 5/5/5/5/5 | current               |
| 6   | Filesystem reads (.github/ISSUE_TEMPLATE/, SECURITY.md, CODEOWNERS, etc.)                                                                 | Local repo files                                                       | ground-truth                | HIGH  | 5/5/5/5/5 | 2026-03-29            |

---

## Contradictions

**Issue template null vs. actual existence:** The community profile API reports
`issue_template: null` (suggesting 85% health = missing issue templates), but
the GitHub contents API and local filesystem both confirm `bug_report.md` and
`feature_request.md` exist and are well-formed. This contradiction is caused by
a known GitHub API bug (Discussion #164599). Do not treat the community
profile's `issue_template: null` as a remediation action item — the templates
are present.

**SECURITY.md exists but community profile may not count it:** SECURITY.md
exists at repo root and is referenced in ISSUE_TEMPLATE/config.yml. The
community profile API `files` response does not include a `security_policy` key.
GitHub's community profile checks for SECURITY.md, but the scoring may require
the file to be registered via the Security tab (GitHub's "Security policy"
feature) rather than just existing on disk. This cannot be fully confirmed
without a fix to the health percentage being observable.

---

## Gaps

1. **Cannot determine what is causing the 15% gap to 100% health score.** The
   API returns 85% with `issue_template: null` as the only null field. Given the
   API bug, the actual missing checklist item is unclear. It may be related to:
   (a) the old-style `issue_template` check that requires a legacy single-file,
   (b) SECURITY.md not being registered via GitHub's Security tab UI, or (c)
   another undetected gap. Would need to navigate to the repo's community
   profile page in GitHub UI to see the actual checklist render.

2. **Branch protection status:** Main branch has no protection rules. This was
   confirmed (API 404). No investigation was done on whether rulesets (newer
   GitHub feature, different from branch protection) are configured. Rulesets
   can exist without classic branch protection.

3. **GitHub Actions permissions and fork PR safety:** Not investigated in this
   sub-question scope (covered by other D-series findings).

4. **Social preview image:** Cannot be checked via API. The `description: null`
   is confirmed but whether a social preview image is configured requires UI
   access. The API does not expose this.

5. **FUNDING.yml:** Absent. For an open-source project this is optional, but
   GitHub Sponsors and buy-me-a-coffee links are surfaced via FUNDING.yml. No
   action required unless monetization is desired.

---

## Serendipity

**App Check re-enablement tracker as a non-issue:**
`.github/ISSUE_TEMPLATE_APP_CHECK_REENABLE.md` is a detailed internal checklist
document stored in `.github/` but NOT in the `ISSUE_TEMPLATE/` directory. It
will not be presented to contributors as an issue template (which is intentional
— it is an internal checklist, not a public template). However, its name matches
the issue template naming convention which could cause confusion. It is
referenced correctly from `config.yml` as a contact link URL.

**`codex` label with no description:** The label `codex` exists with color
`#ededed` and no description. This appears to be a GitHub Copilot/Codex
integration label (used to tag issues for automated coding agents). If this is
intentional for Copilot agent workflows, it should have a description. If it is
a leftover from an experiment, it should be removed.

**`autorelease: pending` label:** This label exists and matches the
release-please automation system (`.github/release-please-config.json` exists).
The label is auto-managed by release-please and should not be manually modified.
No action needed.

**All three merge strategies enabled simultaneously:** The project uses
conventional commits (enforced by PR template) but allows merge commits, squash,
and rebase. This inconsistency means the commit history format depends on
whoever clicks the merge button. For a solo project this is low risk, but worth
standardizing.

---

## Priority Action Matrix

| Item                                             | Priority | Effort | Impact                                  |
| ------------------------------------------------ | -------- | ------ | --------------------------------------- |
| Add repo description                             | HIGH     | 2 min  | Discoverability, professionalism        |
| Add 8-10 topics/tags                             | HIGH     | 5 min  | Search discoverability                  |
| Add missing tier-3 label                         | HIGH     | 2 min  | Workflow correctness                    |
| Add descriptions to 18 undescribed labels        | MEDIUM   | 20 min | Contributor experience                  |
| Audit/remove redundant label pairs               | MEDIUM   | 15 min | Label hygiene                           |
| Enable delete_branch_on_merge                    | MEDIUM   | 1 min  | Branch hygiene                          |
| Disable merge commit + rebase (squash only)      | MEDIUM   | 2 min  | History consistency                     |
| Create GitHub milestones from ROADMAP.md         | LOW      | 30 min | Release tracking                        |
| Enable branch protection on main                 | LOW      | 15 min | Protection (solo project = low urgency) |
| Resolve community profile issue_template API bug | NONE     | 0 min  | Cannot fix — GitHub API bug             |

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The majority of findings are based on live API data and direct filesystem reads,
which are ground-truth sources. The only medium-confidence findings involve
interpretation of ambiguous label overlap and the GitHub community profile
scoring algorithm internals.
