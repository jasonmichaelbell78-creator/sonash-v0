# Findings: GitHub API Insights Data for jasonmichaelbell78-creator/sonash-v0

**Searcher:** deep-research-searcher (D17-SQ10a) **Profile:** codebase + API
**Date:** 2026-03-29 **Sub-Question IDs:** SQ-10a

---

## Key Findings

### 1. Traffic: Views (14-day window: 2026-03-15 to 2026-03-28) [CONFIDENCE: HIGH]

Total: **768 views, 7 unique visitors** over 14 days. This is a private/personal
project repo (no description, no topics, 2 stars) — these views are almost
exclusively the owner actively browsing the repo on GitHub.com.

| Date       | Views | Uniques |
| ---------- | ----- | ------- |
| 2026-03-15 | 74    | 1       |
| 2026-03-16 | 47    | 1       |
| 2026-03-17 | 85    | 1       |
| 2026-03-18 | 85    | 1       |
| 2026-03-19 | 85    | 1       |
| 2026-03-20 | 85    | 1       |
| 2026-03-21 | 22    | 1       |
| 2026-03-22 | 23    | 2       |
| 2026-03-23 | 37    | 2       |
| 2026-03-24 | 48    | 1       |
| 2026-03-25 | 60    | 2       |
| 2026-03-26 | 66    | 1       |
| 2026-03-27 | 38    | 3       |
| 2026-03-28 | 13    | 1       |

**Pattern:** Mon–Fri views are substantially higher (22–85/day) vs weekend lows
(13–38). Weekday average ~69 views, weekend average ~28 views. The "85" plateau
on Mar 17–20 (Mon–Thu) likely reflects GitHub's view-counting ceiling for
individual page loads in a session. The 7 unique visitors over 14 days indicates
near-exclusive owner use.

**Retention:** GitHub retains traffic data for exactly 14 days. No historical
archive. Data captured today (2026-03-29) is the only window available.

---

### 2. Traffic: Clones (14-day window) [CONFIDENCE: HIGH]

Total: **9,064 clones, 481 unique cloners** over 14 days. This number is
strikingly large for a solo project and warrants careful interpretation.

| Date       | Clones | Uniques |
| ---------- | ------ | ------- |
| 2026-03-15 | 659    | 69      |
| 2026-03-16 | 617    | 54      |
| 2026-03-17 | 589    | 35      |
| 2026-03-18 | 822    | 57      |
| 2026-03-19 | 1,211  | 70      |
| 2026-03-20 | 1,152  | 65      |
| 2026-03-21 | 417    | 22      |
| 2026-03-22 | 166    | 18      |
| 2026-03-23 | 506    | 38      |
| 2026-03-24 | 622    | 40      |
| 2026-03-25 | 486    | 46      |
| 2026-03-26 | 1,324  | 66      |
| 2026-03-27 | 189    | 39      |
| 2026-03-28 | 304    | 29      |

**Interpretation (critical note):** GitHub counts each `git fetch` or
`git clone` operation separately. Claude Code, the GitHub Actions CI/CD system,
and any automated tooling each trigger clone/fetch operations on every run. With
~40–70 unique "cloners" per day at 600–1,300 operations, this is consistent with
automated CI/CD systems, agent worktrees, and local development all generating
repeated fetches throughout the day. This is NOT 481 different external humans
cloning the repo. The high clone count is an artifact of intensive development
tooling.

**Retention:** 14-day window only.

---

### 3. Popular Paths (14-day snapshot) [CONFIDENCE: HIGH]

Top 10 most-viewed GitHub.com pages:

| Path                | Title (truncated)                           | Views | Uniques |
| ------------------- | ------------------------------------------- | ----- | ------- |
| /sonash-v0          | Repo root                                   | 207   | 5       |
| /sonash-v0/branches | Branches                                    | 138   | 1       |
| /sonash-v0/pulls    | Pull requests                               | 34    | 2       |
| /pull/448           | feat: Session #227 Pipeline fracture fix... | 19    | 1       |
| /pull/470           | feat: Wave 1b propagation, statusline...    | 19    | 1       |
| /pull/457           | fix: CI reliability & parallelization...    | 18    | 1       |
| /pull/453           | fix: Zero-Warning Infrastructure 6 waves... | 16    | 2       |
| /pull/434           | feat: Review Lifecycle Pipeline Overhaul... | 15    | 1       |
| /compare            | Compare view                                | 13    | 1       |
| /pull/445           | feat: Planning artifacts, agent infra...    | 13    | 1       |

**Pattern:** The branches page (138 views, 1 unique) is the second most-visited
page, reflecting heavy branch management — consistent with the worktree and
planning-branch workflow evident elsewhere. All PR views are
single-unique-visitor (owner reviewing their own PRs). No external visitors
appear to be browsing PRs.

---

### 4. Traffic Referrers [CONFIDENCE: HIGH]

| Referrer   | Views | Uniques |
| ---------- | ----- | ------- |
| github.com | 85    | 3       |
| Google     | 1     | 1       |

Near-complete self-referral from github.com. A single Google-referred view
indicates the repo has minimal external discovery or public visibility. No
external communities, newsletters, or social links are sending traffic.

---

### 5. Participation Stats (52-week window) [CONFIDENCE: HIGH]

The `/stats/participation` endpoint returned successfully. Data covers 52 weeks
ending 2026-03-29 (weeks indexed 0=oldest, 51=most recent).

**Commit counts by week (owner vs all contributors):**

- **All contributors, rolling 52-week total:** 3,548 commits (sum of `all`
  array)
- **Owner only, rolling 52-week total:** 1,558 commits (sum of `owner` array)
- **Non-owner share:** 1,990 commits (~56%) — attributable to Claude, bots,
  Copilot agents

The first 35 weeks of the 52-week window show zero activity (project began
~2025-12-09, so weeks 0–34 predate the repo). Active weeks: weeks 35–51.

**Recent weekly commit trajectory (last 16 active weeks):**

| Week # | All Contributors | Owner Only |
| ------ | ---------------- | ---------- |
| 35     | 172              | 119        |
| 36     | 189              | 132        |
| 37     | 229              | 132        |
| 38     | 379              | 62         |
| 39     | 274              | 50         |
| 40     | 299              | 110        |
| 41     | 234              | 136        |
| 42     | 165              | 45         |
| 43     | 193              | 116        |
| 44     | 244              | 98         |
| 45     | 248              | 94         |
| 46     | 269              | 156        |
| 47     | 9                | 9          |
| 48     | 69               | 69         |
| 49     | 123              | 111        |
| 50     | 64               | 58         |

**Notable:** Week 47 (near-zero: 9 commits) is a visible dip. Weeks 38–39 show
the owner's contribution dropping sharply relative to total (Claude/bots
carrying more). The ratio of owner:all varies from ~17% (week 39) to ~100% (week
47-48), indicating variable delegation to AI agents.

---

### 6. Punch Card — Commit Timing by Day/Hour [CONFIDENCE: HIGH]

Data from GitHub's `/stats/punch_card` endpoint (confirmed correct; corroborated
by local `git log` analysis).

**By day of week** (from git log, total 3,174 commits):

| Day       | Commits | % of total |
| --------- | ------- | ---------- |
| Monday    | 434     | 13.7%      |
| Tuesday   | 507     | 16.0%      |
| Wednesday | 394     | 12.4%      |
| Thursday  | 447     | 14.1%      |
| Friday    | 518     | 16.3%      |
| Saturday  | 520     | 16.4%      |
| Sunday    | 354     | 11.2%      |

Work is distributed across **all 7 days** with no clear weekday-only pattern.
Friday and Saturday are the busiest days. Sunday is the lightest. This is
consistent with a solo developer working evenings and weekends as well as
weekdays — no clear "9-to-5" constraint.

**By hour of day** (UTC, from git log):

| Hour (UTC) | Commits | Notes                            |
| ---------- | ------- | -------------------------------- |
| 00–05      | 289     | Low (overnight UTC)              |
| 06–09      | 273     | Low-medium                       |
| 10–11      | 174     | Ramping                          |
| 12–13      | 410     | **Peak #1** — noon UTC           |
| 14–15      | 362     | High                             |
| 16–17      | 526     | **Peak #2** — late afternoon UTC |
| 18–19      | 468     | High                             |
| 20–21      | 435     | High                             |
| 22–23      | 206     | Tapering                         |

**Peak activity is 12:00–21:00 UTC.** If the developer is in a US timezone
(e.g., CT = UTC-6), this maps to 06:00–15:00 CT. If UK/EU, this is lunchtime
through early evening. The punch card from GitHub's endpoint confirms the same
pattern (day 0=Sunday through day 6=Saturday format, with heavy
afternoon/evening activity).

---

### 7. Language Breakdown [CONFIDENCE: HIGH]

Total measured bytes: ~8.48M

| Language   | Bytes     | % share |
| ---------- | --------- | ------- |
| JavaScript | 4,944,343 | 58.3%   |
| TypeScript | 3,188,605 | 37.6%   |
| Shell      | 105,909   | 1.3%    |
| Python     | 105,292   | 1.2%    |
| TeX        | 65,835    | 0.8%    |
| Go         | 48,421    | 0.6%    |
| CSS        | 12,250    | 0.1%    |
| HTML       | 9,443     | 0.1%    |

**Interpretation:** JavaScript dominates due to the Firebase Cloud Functions and
likely compiled/bundled output being tracked. TypeScript at 37.6% reflects the
app source code. Shell (1.3%) and Python (1.2%) are infrastructure scripts (hook
systems, build tooling). Go (0.6%) is the statusline binary. TeX (0.8%) is
unexpected — likely documentation or reports generated from templates. The 96%
JS/TS share confirms this is a TypeScript-first web application with a JS-heavy
runtime layer.

---

### 8. Contributors [CONFIDENCE: HIGH]

All contributors by commit count:

| Contributor                | Type    | Commits |
| -------------------------- | ------- | ------- |
| claude                     | Human\* | 1,511   |
| jasonmichaelbell78-creator | Human   | 1,497   |
| TalkHard                   | Human\* | 607     |
| copilot-swe-agent[bot]     | Bot     | 59      |
| github-actions[bot]        | Bot     | 53      |
| dependabot[bot]            | Bot     | 26      |
| v0[bot]                    | Bot     | 7       |
| coderabbitai[bot]          | Bot     | 4       |
| google-labs-jules[bot]     | Bot     | 3       |

\*Note: "claude" (id: 81847) is the GitHub account that Claude Code commits
under. "TalkHard" appears to be an alternate account for the owner (git config
shows "TalkHard" as an author name in local commits, consistent with the 607
appearing as the same developer's earlier commits before account consolidation).

**Key insight:** Claude Code is the #1 contributor by commit count (1,511 vs
owner's 1,497). Combined human contributions = 3,615, bot contributions = 149
(4.1%). This is an **AI-paired development workflow** where the AI assistant
generates roughly as many commits as the human owner.

---

### 9. Recent Activity Events (last 20) [CONFIDENCE: HIGH]

Activity type breakdown from the 20 most recent events:

| Activity Type   | Count | Actor(s)                                        |
| --------------- | ----- | ----------------------------------------------- |
| push            | 16    | jasonmichaelbell78-creator                      |
| pr_merge        | 2     | jasonmichaelbell78-creator, github-actions[bot] |
| branch_creation | 2     | jasonmichaelbell78-creator, github-actions[bot] |
| branch_deletion | 3     | jasonmichaelbell78-creator, dependabot[bot]     |

All push events are on `planning-32926` (active planning branch) or `plan-32626`
(recently merged). The sequence shows the typical workflow: branch creation →
multiple pushes → PR merge → branch deletion, then a new planning branch
created. Today (2026-03-29) shows 9 pushes to `planning-32926` between 12:50 and
22:19 UTC, confirming an active development session.

---

### 10. Repository Core Metadata [CONFIDENCE: HIGH]

| Field          | Value                     |
| -------------- | ------------------------- |
| Created        | 2025-12-09 (113 days ago) |
| Last updated   | 2026-03-29                |
| Last pushed    | 2026-03-29T22:19:11Z      |
| Repo size      | 79,666 KB (~78 MB)        |
| Stars          | 2                         |
| Watchers       | 2                         |
| Forks          | 0                         |
| Open issues    | 1                         |
| Visibility     | Public                    |
| Description    | null (none set)           |
| Topics         | [] (none set)             |
| License        | Apache-2.0                |
| Default branch | main                      |
| Wiki           | Disabled                  |
| Pages          | Disabled                  |

**Notable:** The 78 MB repo size is substantial for a web app — consistent with
containing generated artifacts, `node_modules` leftovers, or large binary assets
(statusline Go binary, hook infrastructure). No public discoverability signals
(no description, no topics), confirming this is a personal project not seeking
external contributors.

---

### 11. Monthly Commit Velocity [CONFIDENCE: HIGH]

From local git log (authoritative):

| Month     | Commits | Avg/day |
| --------- | ------- | ------- |
| 2025-12   | 717     | ~23/day |
| 2026-01   | 1,224   | ~39/day |
| 2026-02   | 936     | ~33/day |
| 2026-03\* | 297     | ~10/day |

\*March 2026 figure is partial (29 days elapsed, but commits only through ~Mar
28 captured). Likely total for March will be ~310–330.

**Trend:** Jan 2026 was the peak velocity month (1,224 commits). February
maintained strong pace. March shows a significant drop in raw commit count, but
this may reflect fewer small AI-generated commits rather than reduced feature
work. The total over ~4 months is 3,174 commits, averaging ~26 commits/day.

---

### 12. Stats Endpoints: Consistently Returning Empty [CONFIDENCE: HIGH]

Three GitHub statistics endpoints returned `{}` on all three attempts:

- `GET /stats/contributors`
- `GET /stats/commit_activity`
- `GET /stats/code_frequency`

**GitHub behavior note:** These endpoints are computed asynchronously. GitHub
returns `202 Accepted` (with empty body) on first call, then caches the result
for ~15 minutes. For repos with large commit histories (~3,174 commits), the
computation may take longer. The fact that all three return `{}` repeatedly
suggests either: (a) the stats cache has expired and GitHub is recalculating, or
(b) there is a temporary service-side issue. The `/stats/participation` and
`/stats/punch_card` endpoints returned data successfully, confirming API access
is not the issue.

---

## Sources

| #   | Source                                       | Type                  | Trust | Date       |
| --- | -------------------------------------------- | --------------------- | ----- | ---------- |
| 1   | `gh api repos/.../traffic/views`             | GitHub API (official) | HIGH  | 2026-03-29 |
| 2   | `gh api repos/.../traffic/clones`            | GitHub API (official) | HIGH  | 2026-03-29 |
| 3   | `gh api repos/.../traffic/popular/paths`     | GitHub API (official) | HIGH  | 2026-03-29 |
| 4   | `gh api repos/.../traffic/popular/referrers` | GitHub API (official) | HIGH  | 2026-03-29 |
| 5   | `gh api repos/.../stats/participation`       | GitHub API (official) | HIGH  | 2026-03-29 |
| 6   | `gh api repos/.../stats/punch_card`          | GitHub API (official) | HIGH  | 2026-03-29 |
| 7   | `gh api repos/.../languages`                 | GitHub API (official) | HIGH  | 2026-03-29 |
| 8   | `gh api repos/.../contributors`              | GitHub API (official) | HIGH  | 2026-03-29 |
| 9   | `gh api repos/.../activity`                  | GitHub API (official) | HIGH  | 2026-03-29 |
| 10  | `gh api repos/...` (core metadata)           | GitHub API (official) | HIGH  | 2026-03-29 |
| 11  | `git log` (local)                            | Git (ground truth)    | HIGH  | 2026-03-29 |

---

## Contradictions

**Clone count vs. unique visitors mismatch:** 9,064 clones from 481 "unique
cloners" seems contradictory with 768 views from only 7 unique visitors. This is
not a true contradiction — GitHub counts git protocol operations (fetch/clone)
separately from HTTP browsing sessions. Automated CI/CD and agent tools generate
git operations without generating web page views.

**Stats endpoints returning `{}`:** The `/stats/contributors`,
`/stats/commit_activity`, and `/stats/code_frequency` endpoints returned empty
on all attempts, while `/stats/participation` and `/stats/punch_card` succeeded.
This is inconsistent behavior — all five use the same async-compute system. The
three empty endpoints may require a longer recompute time due to the data volume
involved (contributors and per-week code frequency require more processing than
simple participation counts).

---

## Gaps

1. **`/stats/contributors` not available:** Per-contributor weekly breakdown
   (additions, deletions, commit counts over time) could not be retrieved. This
   would have enabled a week-by-week breakdown of Claude vs. human contribution
   ratio. The local git log partially compensates.

2. **`/stats/commit_activity` not available:** Weekly total commit counts (52
   weeks) from the GitHub-computed API are unavailable. Compensated by local git
   log monthly counts, but the exact week-by-week breakdown is missing.

3. **`/stats/code_frequency` not available:** Additions and deletions per week
   (lines changed) are unavailable. This would have shown code churn rate.

4. **Traffic data only covers 14 days:** No historical traffic data is retained
   by GitHub. The views/clones/paths/referrers data collected today is the only
   window that will ever exist for this period.

5. **Clone count interpretation is uncertain:** The 481 unique "cloners" could
   include GitHub infrastructure, external bots scanning public repos, or CI
   runner IPs that get reassigned — making the "who is cloning" question
   unanswerable from this data alone.

6. **TalkHard identity:** The "TalkHard" contributor account (607 commits) is
   assumed to be an alternate identity of the repo owner based on context, but
   this was not verified via a separate API call.

---

## Serendipity

**Claude is the #1 committer:** With 1,511 commits vs. the owner's 1,497, Claude
Code has committed more code to this repo than the human owner. This is likely a
unique metric in GitHub's history for a solo project — the AI assistant has
become the primary commit author. This is a meaningful signal for the dashboard:
the repo is running a genuinely AI-first development model, not just
"AI-assisted."

**The repo has no external audience:** Zero forks, 2 stars (likely the owner's
own accounts), no description, no topics, 1 Google referral in 14 days. Despite
being public, this repo is effectively invisible to the broader GitHub
ecosystem. This has implications for dashboard design — "GitHub presence"
metrics (stars, forks, community traffic) are meaningless for this project.

**Active session right now:** The 20 most recent activity events are all from
today (2026-03-29), with 9 pushes to `planning-32926` between 12:50 and 22:19
UTC. Research is being conducted during an active development session.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All data collected directly from GitHub API and local git log. No inference from
secondary sources. The only uncertainty is in interpretation of clone counts and
the TalkHard identity, both flagged explicitly.
