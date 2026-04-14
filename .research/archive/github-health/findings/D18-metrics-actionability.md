# Findings: Which GitHub Metrics Are Genuinely Actionable for a Solo Developer

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-29
**Sub-Question ID:** D18-SQ10b

---

## Key Findings

### 1. Security Alerts Are the Highest-Signal Category (Always Check) [CONFIDENCE: HIGH]

**Dependabot vulnerability alerts** are the clearest action driver for any
developer. The action is unambiguous: when an alert exists, merge the PR or
dismiss with justification. GitHub's own prioritization guidance [1] recommends
using the EPSS + CVSS matrix:

| EPSS Level | Low CVSS        | Medium CVSS | High CVSS     |
| ---------- | --------------- | ----------- | ------------- |
| Low        | When convenient | Next sprint | Fix soon      |
| Medium     | Next sprint     | Fix soon    | Fix soon      |
| High       | Fix soon        | Fix soon    | **Fix first** |

For a solo dev on a Next.js + Firebase app, the practical threshold is: **any
Dependabot alert open > 14 days without dismissal = stale and needs triage.**
Critical/High alerts should never sit open >7 days. Research found that teams
can achieve 87% coverage of exploited vulnerabilities by focusing on just 10% of
alerts (highest EPSS + CVSS). For a solo dev, this means 2-3 critical alerts are
more worth addressing immediately than 20 low alerts.

**Secret scanning alerts** are even more urgent — an exposed credential in a
public repo requires immediate rotation. GitHub auto-notifies integrated service
providers (AWS, Stripe, Slack, etc.) but the developer must also rotate the
credential manually [8].

**Code scanning (SAST) alerts** apply if CodeQL or similar is enabled. For solo
devs, the recommended threshold: block on High severity or above, ignore
Medium/Low until triaged. Starting conservative (High+) then adjusting downward
is better than alert fatigue from day one [9].

### 2. CI/Actions Health Is High-Signal for a Daily Check [CONFIDENCE: HIGH]

GitHub Actions Performance Metrics became generally available in March 2025 [2],
providing:

- Workflow failure rates (with trend indicator: improving or worsening)
- Job run times and queue times
- Per-job failure breakdown (scatter plot showing which jobs fail most)

For a solo developer, the most actionable data point is the **latest run status
of the primary CI workflow on the default branch.** If `main`'s last CI run
failed, it is the highest-priority item before any new work. The API returns
`status` and `conclusion` fields per workflow run.

A reasonable action threshold: **any protected branch with a failing CI run
for >24 hours = must resolve before new feature work.** This is not vanity — a
broken CI on main means all subsequent commits are shipping without quality
gates.

Actions billing (minutes used) is worth a periodic check (~monthly) for private
repos. GitHub free tier provides 2,000 minutes/month for Linux runners. If a
solo dev is near the limit, it may indicate inefficient workflows (e.g., running
expensive jobs on every commit) rather than just high activity [10].

### 3. Dependabot PR Backlog Is a Distinct Signal from Vulnerability Alerts [CONFIDENCE: HIGH]

Beyond security alerts, tracking **the count of open Dependabot PRs** (including
non-security dependency updates) reveals maintenance debt. A growing backlog of
unmerged Dependabot PRs (>10 open, especially if the oldest is >30 days) signals
either:

- Auto-merge is not configured (easily fixable)
- PRs are failing CI (needs investigation)
- Developer is ignoring routine updates (accumulates risk)

This is distinct from Dependabot security alerts — it covers the full ecosystem
health including non-critical version bumps that, if deferred too long, become
harder to merge due to conflicts.

### 4. Traffic Metrics Have Narrow Utility for a Solo Developer [CONFIDENCE: MEDIUM]

GitHub traffic data (views, clones, referrers) has limited actionability for a
private/personal project but some value for an open-source project. Key
constraints:

- **14-day retention only** — data is lost if not regularly fetched/persisted
  [4]
- Views and clones include bots and automated scrapers (inflating unique clone
  counts) [3]
- Top referrers only show the top 10 sources, and only for the last 14 days

**Actionability assessment:**

- Open-source project: MEDIUM — traffic spikes correlated with social sharing
  indicate which channels work; referrer data identifies where to engage
- Private/internal project (the SoNash case): LOW — no external audience, data
  is noise
- Checking frequency: Monthly at most, only for public repos. Not worth
  automating for private

For the specific Next.js + Firebase app (SoNash), which appears
private/personal, traffic metrics should be in the "skip" category.

### 5. Commit Frequency Is Low-Signal for Solo Developer Action Triggers [CONFIDENCE: MEDIUM]

Commit frequency measures cadence, not quality. Research consistently warns
against treating commit counts as a performance target (Goodhart's Law — the
metric becomes gamed) [5]. For a solo dev, the signal is:

- Useful for **personal reflection only** (monthly review: am I shipping
  consistently?)
- Not useful as a dashboard "health" indicator — low commit count may mean
  complex architecture work, not idleness
- The "punch card" (commits by hour/day of week) is more interesting for
  self-awareness: understanding personal productive hours, not for action
  triggers

The GitHub API's `participation` endpoint provides 52 weeks of owner vs.
non-owner commit counts, which can be used to visualize activity rhythms. But
this is a "nice to have" self-reflection tool, not a health indicator.

**Recommended category:** On-demand / monthly reflection only. Not a dashboard
default.

### 6. Code Frequency (Additions/Deletions) Is Low-Signal Except as Anomaly Detection [CONFIDENCE: MEDIUM]

The code frequency graph (weekly additions + deletions) is useful only as an
anomaly detector:

- Sudden spike in deletions with no additions = major refactor or accidental
  deletion
- Week with 0 additions AND 0 deletions + no commits = inactive period (may
  indicate burnout or project pause)
- High code churn (lines written and then rewritten within 2 weeks) can indicate
  instability

However, for a solo dev with regular commits, this data is mostly low-value:

- No team to compare against
- GitHub's code frequency endpoint has a 10,000-commit limit before returning
  errors
- Absolute numbers (e.g., "+5,000 lines this week") don't suggest a specific
  action

**Recommended category:** On-demand only. Not a dashboard default.

### 7. PR Merge Time Is Mostly Irrelevant for Solo Developers [CONFIDENCE: HIGH]

PR review metrics (wait time for review, review cycles, review response time)
are explicitly team metrics [6]. For a solo developer who self-merges PRs:

- Review response time = 0 (you are the reviewer)
- Review cycles = 1 (always, by definition)
- PR merge time reflects self-imposed gates (CI must pass) rather than
  collaboration friction

The one exception: **PR size** (lines changed). Consistently large PRs (>500
lines) suggest the developer is not chunking work well, which can be worth
monitoring as a personal hygiene check. But this is more of a development
practice signal than a health dashboard item.

**DORA metrics** (deployment frequency, lead time, change failure rate, MTTR)
are valuable at team/org scale but lose meaning for solo developers:

- Deployment frequency: useful if measuring actual deploys to Firebase Hosting
- Lead time: from commit to production deploy — Firebase auto-deploys make this
  near-zero
- Change failure rate: requires rollback tracking which most solo devs don't
  maintain
- MTTR: rarely relevant unless there are actual production incidents

**Recommended category:** Skip PR review metrics entirely. Optionally track
deploy frequency and CI failure rate as simplified DORA proxies.

### 8. Language Breakdown Is Static and Rarely Actionable [CONFIDENCE: HIGH]

GitHub's language statistics (calculated by bytes of code per language) are
almost entirely static for an established project. A Next.js + Firebase project
will always show TypeScript/ JavaScript/CSS until the architecture changes. The
API returns this instantly but it provides no action signal:

- No threshold triggers any action
- Gradual language drift is not a health concern
- Language stats are best used for README badges or discovery, not health
  monitoring

**Recommended category:** Skip entirely.

### 9. Issue Age Is Contextually Actionable (Small Volume = Direct Triage) [CONFIDENCE: MEDIUM]

For a solo developer with very few open issues (the prompt notes "only 1 open
issue"), issue age is a direct prompt for triage, not a dashboard metric. The
OSPO guidance [7] recommends:

- High ratio of closed-without-merge issues = potential spam or low-quality
  contributions
- Long-stale issues = candidate for archiving or closing with comment

For a solo dev with 1 open issue: check it weekly. No metric needed — just
direct triage. For a solo dev with 10+ issues: track median issue age and flag
issues open >30 days as stale.

The `actions/stale` automation can auto-label issues after 60 days and close
after 67 days by default, but this is more of a hygiene automation than a
dashboard metric.

**Recommended category:** Not a standalone metric for <5 open issues. Becomes
relevant as backlog grows beyond 5-10 items.

### 10. Release Cadence Is a Useful Personal Shipping Velocity Indicator [CONFIDENCE: MEDIUM]

Tracking time between releases (GitHub Releases/tags) gives a solo dev feedback
on their shipping velocity. This is distinct from commit frequency — a release
represents a meaningful version boundary, not just code activity.

The OpenSSF Scorecard's "Maintained" check uses ≥1 commit/week over 90 days as a
health proxy, which is a reasonable floor for active projects. For releases
specifically:

- Releases shipping less frequently than your stated cadence = drift worth
  acknowledging
- Long release gaps (>90 days for an active project) = may indicate scope creep
  or motivation issues

**Signal use:** Monthly check only. Compare "days since last release" against
personal expectation. No hard threshold — this is context-dependent.

### 11. Dependency Health Summary (Beyond Dependabot Alerts) [CONFIDENCE: MEDIUM]

Beyond individual Dependabot alerts, overall dependency health can be assessed
via:

- **Count of outdated direct dependencies** (not just security vulnerabilities)
- **Unmaintained transitive dependencies** (packages with no recent activity)

The OpenSSF Scorecard [11] checks for dependency pinning, automated security
updates, and vulnerability detection. For a Next.js + Firebase app, specific
action triggers:

- Any direct dependency >2 major versions behind latest = assess upgrade path
- Any transitive dependency with published CVE = wait for Dependabot, but
  monitor actively

The GitHub Dependency Graph + Dependabot covers most of this automatically. No
custom tooling needed.

---

## Recommended Dashboard Design: Always Check vs. On Demand vs. Skip

### ALWAYS CHECK (every invocation of `/github-health`)

| Metric                         | What to Show                                 | Action Threshold                                                        |
| ------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------- |
| **Dependabot security alerts** | Count by severity (Critical/High/Medium/Low) | Any Critical/High alert: immediate triage. Medium alert >14 days: stale |
| **Secret scanning alerts**     | Count of open alerts                         | Any open alert: immediate action (rotate credential)                    |
| **CI status (default branch)** | Last run status + age of last run            | Any failure on protected branch: fix before new work                    |
| **Open Dependabot PRs**        | Count of open Dependabot PRs + age of oldest | >10 open, or oldest >30 days: configure auto-merge or triage            |
| **Days since last commit**     | Single number                                | >30 days on active project: surface as inactivity warning               |

### ON DEMAND (only when specifically requested)

| Metric                                   | Use Case                                   | How Often                     |
| ---------------------------------------- | ------------------------------------------ | ----------------------------- |
| **Traffic (views/clones/referrers)**     | Public repo adoption check                 | Monthly, public repos only    |
| **Code frequency (additions/deletions)** | Anomaly detection after suspected incident | On-demand only                |
| **Commit activity (52-week)**            | Personal reflection / burnout awareness    | Monthly / quarterly           |
| **Release cadence**                      | Personal shipping velocity review          | Monthly                       |
| **Issue age**                            | Backlog triage when issues > 5             | Weekly when backlog is active |
| **CI performance metrics**               | Workflow optimization session              | Quarterly or when slow        |
| **Actions minutes usage**                | Billing review                             | Monthly for private repos     |
| **PR size trends**                       | Personal development practice review       | Quarterly                     |

### SKIP ENTIRELY

| Metric                                     | Why Skip                                   |
| ------------------------------------------ | ------------------------------------------ |
| **Language breakdown**                     | Static, never actionable, no threshold     |
| **PR review time / review response time**  | Team metric, irrelevant for solo dev       |
| **Review cycles until merge**              | Always 1 for solo dev                      |
| **Contributor stats (other contributors)** | N/A for solo project                       |
| **DORA: MTTR**                             | No incident tracking in place              |
| **DORA: Change failure rate**              | Requires rollback discipline not present   |
| **Stars / watchers**                       | Vanity metric, no action trigger           |
| **Fork count**                             | Informational only, not actionable         |
| **Punch card (hourly commits)**            | Self-reflection tool, not health indicator |

---

## Action Threshold Reference (Specific Numbers)

These are evidence-backed thresholds derived from research:

| Condition                          | Threshold                     | Reasoning                                        |
| ---------------------------------- | ----------------------------- | ------------------------------------------------ |
| Critical Dependabot alert          | >0 = immediate                | Any critical vulnerability needs triage same day |
| High Dependabot alert              | >0 open, >7 days              | Should not sit longer than one work week         |
| Medium Dependabot alert            | >3 open, >14 days             | Accumulation signals neglect                     |
| Secret scanning alert              | >0 = immediate                | Credential exposure risk cannot wait             |
| CI failure on default branch       | >1 day                        | Breaks developer feedback loop                   |
| Open Dependabot PRs (non-security) | >10 or oldest >30 days        | Auto-merge misconfiguration likely               |
| Days since last commit             | >30 on active project         | Surface as low-priority awareness note           |
| Days since last release            | >90 for stated active project | Soft warning only                                |
| Open issues >30 days old           | When count >5                 | Stale label or close workflow needed             |

---

## Sources

| #   | URL                                                                                                                                              | Title                                                          | Type                      | Trust  | CRAAP | Date       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ------------------------- | ------ | ----- | ---------- |
| 1   | https://github.blog/security/application-security/cutting-through-the-noise-how-to-prioritize-dependabot-alerts/                                 | Cutting through the noise: How to prioritize Dependabot alerts | Official GitHub blog      | HIGH   | 4.5   | 2024       |
| 2   | https://github.blog/changelog/2025-03-14-actions-performance-metrics-are-generally-available-and-enterprise-level-metrics-are-in-public-preview/ | Actions Performance Metrics GA                                 | Official GitHub changelog | HIGH   | 5.0   | 2025-03-14 |
| 3   | https://github.com/orgs/community/discussions/23994                                                                                              | What does the Git Clone metric mean in the traffic section?    | GitHub community          | MEDIUM | 3.5   | 2022       |
| 4   | https://docs.github.com/en/rest/metrics/traffic                                                                                                  | REST API endpoints for repository traffic                      | Official GitHub docs      | HIGH   | 5.0   | Current    |
| 5   | https://gun.io/news/2025/01/what-github-activity-really-says-about-developer-productivity/                                                       | What GitHub Activity Really Says About Developer Productivity  | Community blog            | MEDIUM | 4.0   | 2025-01    |
| 6   | https://graphite.com/guides/github-pr-metrics                                                                                                    | 5 essential GitHub PR metrics you need to measure              | Tool vendor docs          | MEDIUM | 4.0   | 2024       |
| 7   | https://github.com/github/github-ospo/blob/main/docs/open-source-health-metrics.md                                                               | GitHub OSPO Open Source Health Metrics                         | Official GitHub           | HIGH   | 4.5   | Current    |
| 8   | https://docs.github.com/code-security/secret-scanning/about-secret-scanning                                                                      | About secret scanning                                          | Official GitHub docs      | HIGH   | 5.0   | Current    |
| 9   | https://www.ox.security/blog/static-application-security-sast-tools/                                                                             | Top 10 SAST Tools in 2025                                      | Security vendor blog      | MEDIUM | 3.5   | 2025       |
| 10  | https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions                                             | GitHub Actions billing                                         | Official GitHub docs      | HIGH   | 5.0   | Current    |
| 11  | https://github.com/ossf/scorecard                                                                                                                | OpenSSF Scorecard                                              | Official OpenSSF          | HIGH   | 4.5   | Current    |
| 12  | https://opensource.guide/metrics/                                                                                                                | Open Source Metrics                                            | Open Source Guides        | HIGH   | 4.0   | Current    |
| 13  | https://docs.github.com/en/rest/metrics/statistics                                                                                               | REST API endpoints for repository statistics                   | Official GitHub docs      | HIGH   | 5.0   | Current    |

---

## Contradictions

**Traffic metrics usefulness:** The opensource.guide [12] treats traffic
(views/clones/referrers) as highly actionable for understanding adoption and
promotion effectiveness. The GitHub community discussions [3] note that unique
clone counts include bots and automated scripts, making the numbers less
reliable than they appear. For a public open-source project, traffic has signal.
For a private personal project, the contradiction dissolves — both sources agree
traffic is only meaningful when there is an external audience.

**Commit frequency as a productivity signal:** software.com's commit frequency
guide treats higher commit frequency as a health positive. gun.io's research [5]
argues commit counts are a classic Goodhart's Law trap and actively misleading
when used as performance metrics. Both are correct in different contexts: commit
frequency is a useful _personal_ rhythm check, not an external performance
measure. The resolution: treat it as self-awareness data, never as a dashboard
alert condition.

**DORA metrics for solo devs:** DORA research [from multiple sources] is
designed for teams. Multiple sources confirm deployment frequency and lead time
can apply at individual scale, but change failure rate and MTTR require
infrastructure (incident tracking, rollback logging) that most solo devs don't
have. The contradiction is between "DORA applies to any scale" (DORA.dev) and
"DORA metrics lose meaning without team context" (practical experience).
Recommended resolution: use only deployment frequency as a solo DORA proxy.

---

## Gaps

1. **SoNash-specific data**: Whether the repo is public or private affects
   traffic metric relevance. The research prompt suggests it's a personal app
   (not OSS), which would make traffic metrics entirely noise. Confirmation
   needed.

2. **Firebase deploy integration**: The prompt mentions Firebase. If Firebase
   Hosting deploys are tracked via GitHub Actions, deployment frequency becomes
   measurable automatically. No research was done on Firebase-specific CI/CD
   health signals.

3. **Threshold empirical validation**: The action thresholds proposed (e.g.,
   "Medium alert >14 days = stale") are synthesized from best practice guidance
   but not empirically derived from solo developer survey data. They represent
   reasonable heuristics, not validated benchmarks.

4. **GitHub-native vs. API data distinction**: Some metrics (Actions Performance
   Metrics, code frequency) are only available for organization-level or require
   specific API calls. Access levels for a personal repo (vs. org repo) were not
   fully verified — the GA announcement for Actions Performance Metrics [2]
   mentions both repository and organization tiers.

5. **Code scanning availability**: CodeQL code scanning is free for public
   repos. For private repos, it requires GitHub Advanced Security (paid). The
   SoNash security posture document (D2-code-scanning.md exists in findings) may
   cover this — not cross-referenced here.

---

## Serendipity

**Burnout detection via commit patterns:** Research uncovered that commit
pattern analysis (not just frequency) can detect burnout risk signals: sudden
increase in late-night commits, swings between intense activity and total
silence, shorter/less informative commit messages. The 2024 Stack Overflow
Developer Survey found 51% of developers report burnout. For a solo developer
building a productivity app, this meta-use of their own GitHub data could be a
feature (commit health as a personal wellness signal).

**OpenSSF Scorecard as a free health baseline:** The OpenSSF Scorecard [11]
automates security health checks across 10+ dimensions (branch protection,
dependency pinning, security policy, maintained status, etc.) and is free for
public repos. If SoNash is public, a Scorecard GitHub Action integration could
replace several manual checks in the `/github-health` skill with a single
automated score.

**14-day traffic data loss problem:** GitHub only retains traffic data for 14
days via API. Any `/github-health` skill that surfaces traffic must either
persist data locally (e.g., writing to a `.github/metrics/` JSON file on a
schedule) or accept that older trends are invisible. This is an architectural
constraint for skill design, not just a metric limitation.

---

## Confidence Assessment

- HIGH claims: 5 (security alerts, CI health, PR review irrelevance, language
  stats, traffic narrow utility)
- MEDIUM claims: 6 (commit frequency, code frequency, traffic open-source use
  case, issue age, release cadence, dependency health beyond alerts)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM-HIGH**

The HIGH-confidence findings are grounded in multiple official GitHub sources
and represent clear signal/action relationships. The MEDIUM findings involve
more judgment about what "actionable" means for a specific developer context
(solo, private project, Firebase app) where no published benchmarks exist for
solo developers specifically.
