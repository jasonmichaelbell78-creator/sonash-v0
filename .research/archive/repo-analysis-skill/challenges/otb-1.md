# Outside-the-Box Challenges: Repo Analysis Skill

**Author:** deep-research-searcher (challenge agent) **Date:** 2026-03-31
**Synthesizes:** SYNTHESIS_EXTERNAL.md, SYNTHESIS_INTERNAL.md **Purpose:**
Surface creative but implementable ideas the primary research missed

---

## Executive Summary

The primary research built an excellent catalog of what to measure and how to
measure it. It is strong on static analysis, pipeline architecture, and output
schema. It is systematically weak on four dimensions: time as a first-class
signal, portfolio-level inference, generative outputs, and the adversarial
framing that reveals what absence means. This document covers those gaps.

---

## 1. Social Signals: Star Trajectory Over Star Count

### What the Research Missed

Both synthesis documents treat GitHub stars as a static number — metadata pulled
from `/repos/{owner}/{repo}` to check whether a repo is "popular." The external
synthesis lists `stars` as one of 58 fields from `gh repo view --json`. Neither
document asks: what does the shape of the star accumulation curve tell you?

### The Actual Signal

Stars arrive in patterns that reveal project lifecycle stage more accurately
than the count itself.

**Star velocity** (stars/week over trailing 90 days) distinguishes a 5,000-star
repo that peaked in 2022 and is now forgotten from one that crossed 5,000 last
month and is still accelerating. The GitHub API `stats/stargazers` endpoint
returns timestamped stargazer events, enabling a full accumulation curve.

**Four curve shapes and what they mean:**

| Shape           | Description                       | Interpretation                                                                                                            |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Spike-and-decay | Sharp peak then flat              | Tutorial/viral content, not a durable project. Examine closely: often accompanies a blog post, not sustained development. |
| Steady ramp     | Linear growth                     | Genuinely useful project. Maintainers respond to issues. Worth depending on.                                              |
| Staircase       | Flat periods punctuated by spikes | Product Hunt / HN submissions. Marketing-driven. Health depends on activity between stairs.                               |
| Cliff           | Rapid growth then sudden stop     | Contributor left, company pivoted, or successor emerged. Cross-reference commit activity.                                 |

**Fork-to-star ratio** is a stronger signal than stars alone. A ratio above 0.15
means people are actually building on the project, not just bookmarking it.
Below 0.03 on a 1,000+ star project = bookmark bait. The research mentions forks
exist but never exploits this ratio.

**Watcher count** is the most neglected signal. Watchers opt in to notifications
— they are operators, not admirers. A high watcher-to-star ratio (>0.05) means
the repo is operationally critical to real users. This creates maintainer
accountability and predicts faster issue response.

### Implementation

Phase 0 (API pre-flight) already runs. Add to it:

- Fetch `GET /repos/{owner}/{repo}/stargazers` with
  `Accept: application/vnd.github.star+json` (returns timestamps, paginated, max
  40 req/page).
- Cap at 3,000 most recent star events (3 API calls) — sufficient for velocity
  and curve shape without exhausting rate limit.
- Compute: 7-day velocity, 90-day velocity, curve shape classifier
  (spike/ramp/staircase/cliff via slope variance), fork-to-star ratio,
  watcher-to-star ratio.
- Add `social_signals` block to `analysis.json`.

**Cost:** 3-5 additional API calls in Phase 0. No clone impact.

---

## 2. Cross-Repo Analysis: Portfolio Intelligence

### What the Research Missed

Every dimension in both synthesis documents is scoped to a single repo. The
research treats repo analysis as point-in-time, single-subject work. Neither
document considers: what does a user's full GitHub portfolio reveal? Or what
patterns emerge across all repos in an organization?

### The Actual Signal

**Portfolio analysis reveals developer maturity that no single repo can show.**

A developer who has 8 repos, all using the same framework (despite different
problem domains), shows one pattern. A developer who has 8 repos across 3
frameworks with clear progression in complexity shows another. A developer who
has 8 repos all abandoned at 30% completion shows a third.

**Organization-level analysis reveals Conway's Law dynamics.**

The external synthesis identifies "Team topology visibility" as gap #4: "no
platform maps Conway's Law dynamics — which teams own which subsystems and
whether team boundaries align with architectural boundaries." Cross-repo
analysis is the only way to detect this without organizational chart access.
Repos that share contributors, use similar dependency sets, and have correlated
commit patterns are likely owned by the same team, even if named differently.

**Cross-repo dependency graph reveals internal coupling.**

Many organizations spread what should be one monorepo across multiple repos,
creating hidden dependency chains (repo A's release gates repo B's deployment).
This is invisible inside any single repo but visible when you map the GitHub
Actions `uses:` directives across all org repos and look for shared workflow
templates, or when you compare release timestamps for correlated deployment
patterns.

### Implementation Ideas

**For a user's portfolio (`/repo-analysis --portfolio github.com/username`):**

- Fetch all public repos via `GET /users/{username}/repos?per_page=100`
- Run Phase 0 on each in parallel (100 API calls is well within rate limits)
- Classify repos by: alive/dormant/abandoned, technology stack, apparent domain
- Output: skill progression timeline, specialization breadth, completion rate,
  project lifecycle patterns

**For an organization (`/repo-analysis --org github.com/orgname`):**

- Map contributor overlap across repos (shared email domains across repos = same
  team)
- Detect shared CI templates (`.github/workflows/` with identical or
  near-identical content)
- Identify dependency chains (package.json `dependencies` pointing to same-org
  packages)
- Flag: single-contributor repos, abandoned repos still used as dependencies by
  live repos, version drift within org's own packages

**The "would I hire this team" framing (see Section 6) is only meaningful at
portfolio scope.** A single repo is a snapshot. A portfolio is a pattern.

---

## 3. Time-Series Analysis: The Repo That Changes Over Time

### What the Research Missed

The external synthesis includes `trends.jsonl` as an output artifact and
describes it as append-only per run. The internal synthesis mentions
"ecosystem-health trend-tracking model." But both treat trends as a passive
ledger — you run the skill, it appends a record, you can review history. Neither
proposes active alerting on trend anomalies.

The platform gap section (item 7) explicitly names this: "Platforms provide
point-in-time scores or historical charts; none surface trend-based anomalies
proactively." The research correctly identifies this as a gap but does not
propose how to fill it.

### The Actual Signal

**The most valuable moment to surface a finding is not when you ask for
analysis. It is when a metric crosses a threshold.**

Five trend patterns worth alerting on immediately:

| Pattern               | Threshold                                             | Why It Matters                                                                                                                                    |
| --------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contributor cliff     | Active contributors drops >50% in 90 days             | Bus factor collapse. Project may be unmaintained before the maintainer says so publicly.                                                          |
| Dependency spike      | Transitive dependency count increases >30% in 30 days | Framework migration or dependency chain explosion. Security attack surface grew significantly.                                                    |
| Test coverage decline | Coverage drops >10 percentage points between versions | Someone shipped without tests, consistently. Leading indicator of reliability regression.                                                         |
| Commit halt           | Zero commits for 45+ days on a previously active repo | Not a dormancy signal by itself — normal for stable libraries. Alarming when combined with open security issues or major dependency version gaps. |
| Issue age surge       | Median open issue age increases 2x over 60 days       | Maintainer overloaded or disengaged. Response SLA broken. Community trust eroding.                                                                |

### Implementation

The existing `trends.jsonl` schema already captures the right data. The gap is
the alerting layer.

**Add a `/repo-watch` subcommand:**

- Registers a repo slug + alert thresholds in a local watchlist file
  (`.claude/state/repo-watchlist.json`)
- At session-start or on `/alerts` invocation, runs a lightweight Phase 0 check
  on all watched repos (API only, no clone)
- If any threshold is crossed since last check, surfaces an alert with the delta

This is implementable with ~50 lines of orchestration logic on top of the
existing Phase 0 infrastructure. The watchlist concept mirrors the
`hook-warnings-log.jsonl` pattern already present in the codebase — append-only,
session-persistent, acknowledged by user.

**Concrete alerting schema:**

```json
{
  "repo": "github.com/org/repo",
  "alert_type": "contributor_cliff",
  "detected_at": "ISO8601",
  "metric_before": 8,
  "metric_after": 3,
  "delta_pct": -62.5,
  "severity": "HIGH",
  "recommended_action": "Evaluate fork or alternative before next dependency update"
}
```

---

## 4. Reverse Engineering Intent: What Absence Tells You

### What the Research Missed

The primary research is exhaustive on what to detect when things are present. It
catalogs 36 dimensions, 20+ tools, and a quality rubric with 60+ checklist
items. It is silent on the diagnostic power of absence patterns.

The internal synthesis comes closest — it mentions that a repo with any of
SoNash's three-layer enforcement patterns "is significantly above average." But
it does not systematize what the absence of common things means, or what
combinations of absences form a recognizable anti-pattern.

### The Framework: Absence Clusters

Individual absences are noise. Absence clusters are signals.

**The "Prototype Trapped in Production" cluster:**

- No `CONTRIBUTING.md`
- No issue templates
- No `CHANGELOG.md` or release notes
- CI exists but only runs lint (no tests)
- Dependencies rarely updated (>6 months stale on average)

Individual interpretation: sloppy. Combined interpretation: this started as a
personal project, got adopted, and the maintainer never made the governance
investment. The code may work but the project is fragile under any pressure.
Risky to depend on.

**The "Ghost Ship" cluster:**

- Stars: >500
- Last commit: >18 months ago
- Open issues: >50
- PR queue: >10 open, none merged in >12 months
- README still says "actively maintained"

This is a common trap for dependency selection. The external synthesis notes
"13% of PRs merged without review industry-wide" but does not surface the
inverse: projects where PRs are never merged because the maintainer has left
silently.

**The "Security Facade" cluster:**

- `SECURITY.md` present (passes community health check)
- No CI running security tools
- Dependabot alerts exist but are unacknowledged (>90 days)
- No branch protection on main

Passes surface-level scans. Community profile score looks reasonable. But the
security infrastructure is decorative, not operational.

**The "Heroic Single-Contributor" cluster:**

- Bus factor: 1
- Contributor diversity: 0 (all commits from one email)
- No `CODEOWNERS`
- Last 10 PRs: all self-merged
- Issue response time: highly variable (fast responses when online, multi-week
  gaps otherwise)

Not inherently bad — many excellent libraries are maintained by one person. But
the risk profile is specific: if that person disappears for any reason (job
change, health, interest), the project has zero institutional memory and zero
handoff capacity.

### Implementation

Add an "Absence Pattern Classifier" to Phase 2 (static analysis of cloned
content + API metadata). It does not require new tool calls — it synthesizes
signals already collected by other dimensions. The output is a named pattern
label plus evidence list.

The classifier runs after all dimension agents complete, as part of the
aggregation phase. Pattern labels appear in `analysis.json` as
`absence_patterns: ["prototype_trapped", "security_facade"]` — a named cluster
taxonomy that gives the human reader a shortcut to the risk interpretation.

---

## 5. Package.json as Biography: Dependency History as Narrative

### What the Research Missed

Both synthesis documents treat dependencies as a current-state security problem
(CVEs, licenses, freshness). The external synthesis covers `deps.dev`, Grype,
OSV-Scanner, and Renovate thoroughly. What is entirely absent is treating the
dependency history as a record of technical decisions.

### The Narrative Layers

**Layer 1: Current `package.json` as snapshot**

The research covers this well. CVEs, licenses, freshness. Not novel.

**Layer 2: Git history of `package.json` as timeline**

`git log --follow -p -- package.json` (available after Phase 3 history clone)
reveals:

- When each major dependency was added
- Whether frameworks were migrated (Webpack → Vite, Jest → Vitest, CRA → Vite
  React)
- Whether a dependency was added and quickly removed (abandoned experiment,
  replaced, or security incident response)
- Dependency bloat trajectory (when did devDependencies double? What triggered
  it?)

**Layer 3: Removal events as stronger signals than addition**

Adding a dependency is common. Removing one is deliberate. A team that removed a
major dependency (say, migrated off Redux to Zustand, or dropped a testing
framework entirely) made a considered architectural decision. The history of
these removals tells you more about team maturity and decisiveness than any
static count.

**Layer 4: Version pinning behavior as risk posture indicator**

Does the team pin exact versions (`"lodash": "4.17.21"`) or ranges
(`"lodash": "^4.17.0"`)? Does CI use `npm ci` (lockfile-enforced) or
`npm install`? The external synthesis mentions `U-C01: CI uses lockfile` as a
universal checklist item. The historical trend of this behavior reveals whether
the team's risk posture has tightened or loosened over time.

### Implementation

In Phase 3 (history analysis), add `manifest-history` as a conditional analysis
agent:

```
git log --reverse --pretty=format:"%ai %H" -- package.json | head -500
```

Combined with `git show <sha>:package.json` for each significant commit
(dependency count change >3 in a single commit), this reconstructs the
dependency narrative in under 10 API calls against the local clone.

Output: a `dependency_biography` block in `analysis.json` with:

- `framework_migrations: [{ from, to, date }]`
- `notable_removals: [{ package, reason_inference, date }]`
- `dependency_count_trajectory: [{ date, direct, dev, total }]`
- `pinning_discipline: { current_strategy, lockfile_present, ci_uses_lockfile }`

This is implementable with one additional history-phase agent. No new tools
required — pure git log analysis.

---

## 6. The "Would I Hire This Team" Lens

### What the Research Missed

The external synthesis defines six radar axes and twenty-plus analysis
dimensions. The framing is uniformly technical: complexity scores, security
posture, test coverage. There is no adversarial or evaluative framing — no
answer to the question "given all of this, should I trust this team/project?"

Technical due diligence for hiring or acquisition has a different question
hierarchy than general code quality analysis. This section proposes that framing
as a complementary mode.

### The Dimensions That Matter for "Trust This Team"

**1. Judgment under pressure** (not measurable by static analysis)

Detectable signals: When security vulnerabilities were found, how fast were they
patched? When a major dependency released a breaking upgrade, how long did the
team take to migrate? These are time-to-respond signals in git history. A team
that took 6 months to patch a CVSS 9.0 vulnerability shows different judgment
than one that shipped a fix in 72 hours.

Implementation: Cross-reference Dependabot alert creation timestamps (API)
against fix commit timestamps (git log) for all historical CVE patches. Compute
a "security response SLA" score.

**2. Consistency vs. heroism**

Heroic repos have incredible sprints followed by months of silence. Consistent
repos have steady, modest commit cadence. For a team you are hiring or
acquiring, heroism is a liability — it suggests the output quality is
person-dependent, not process-dependent.

Implementation: Coefficient of variation of weekly commit count over trailing 12
months. High variance = heroic. Low variance = process-driven.

**3. Debt management discipline**

Not whether debt exists (it always does), but whether the team tracks and
reduces it. Signals: a `TODO`/`FIXME` count that decreases over time (healthy)
vs. one that grows monotonically (accumulating). The presence of structured debt
tracking (any form of `CHANGELOG`, debt tracking file, or issue labeling system)
vs. purely informal comments.

Implementation: `git log --stat -- '*.md' | grep -i debt\|todo\|fixme` for
explicit debt docs. Plus `git diff HEAD~50:. HEAD:. | grep -c "TODO\|FIXME"` for
trend direction.

**4. Knowledge transfer investment**

A team worth hiring writes for the next person. Signals: test coverage growth
trend (not absolute level), increasing comment density over time in complex
files, ADR (Architecture Decision Records) presence, onboarding documentation.

The external synthesis covers documentation presence but not documentation
investment trajectory. A team that has been consistently improving their
documentation over 18 months is a fundamentally different hire than one that
wrote a README on day 1 and never touched it.

**5. Reaction to criticism**

PR review density and response quality. If maintainers close PRs without
comment, merge without review, or have a pattern of dismissive issue responses,
that behavioral signature predicts how they will behave on your team or in an
acquisition.

Implementation: GitHub API `GET /repos/{owner}/{repo}/pulls?state=closed` —
sample 50 closed PRs, check: reviewed before merge (yes/no), reviews-to-merge
ratio, time-to-first-response.

### Packaging This as a Skill Mode

Add `--mode=due-diligence` as an optional flag to `/repo-analysis`. This mode:

1. Runs standard analysis
2. Adds five "due diligence signals" not in standard output: security response
   SLA, commit consistency score, debt trend direction, documentation investment
   trajectory, PR review discipline
3. Generates a separate `due-diligence.md` artifact alongside `summary.md`

---

## 7. Generative Outputs: From Analysis to Action

### What the Research Missed

Both synthesis documents treat the skill's output as terminal — the skill
produces findings, the user decides what to do. The research is entirely
diagnostic. It is strong on "what is wrong" and weak on "here is the fix."

The external synthesis describes an `actionable_insights` block in
`analysis.json` with `top_to_steal` and `top_to_avoid` arrays, and notes that
findings are TDMS-compatible for debt intake. But the synthesis never proposes
that the skill could generate artifacts that fix or improve the analyzed repo.

### Generative Ideas (Ordered by Implementability)

**1. README scorecard badge generator (trivially implementable)**

After analysis completes, generate a Markdown snippet the repo owner can paste
into their README:

```markdown
[![Repo Health](https://img.shields.io/badge/health-74%2F100-yellow)](link-to-full-report)
```

No external service required — static badge via shields.io URL constructed from
the computed score. This is 5 lines of output generation after aggregation. Low
value on its own but surfaces the score in a durable, visible location.

**2. `.github/dependabot.yml` generator (high implementability, high value)**

Phase 0 already detects the package ecosystem (npm, pip, Go modules, Cargo,
etc.) and whether `dependabot.yml` exists. If it does not, generate a correct,
minimal `dependabot.yml` for the detected ecosystem(s) with weekly update
schedule and standard ignore patterns.

This is a deterministic template fill — no AI required. It produces a file the
user can commit directly. The external synthesis notes "30+ ecosystems" and
"zero-config via `.github/dependabot.yml`." We already have all the input data
to generate this.

**3. CI pipeline skeleton generator (medium implementability, high value)**

The external synthesis notes "only ~10% of repos use CI at all." For repos with
no `.github/workflows/`, the analysis can detect: language, test framework (from
`package.json` `scripts.test`, or `pytest.ini`, etc.), and linter configuration.
This is enough to generate a minimal but functional `ci.yml` that:

- Installs dependencies
- Runs tests
- Runs linter
- Pins all action versions (supply chain hygiene)

Output as a separate file `generated/ci.yml` in the analysis output directory,
clearly labeled as a starting point. Not auto-committed — the user reviews and
applies it.

**4. Architecture diagram from dependency-cruiser output (medium
implementability)**

Phase 2 already plans to run `dependency-cruiser` for JS/TS repos (produces
DOT/Mermaid output). The analysis skill can emit a
`generated/dependency-graph.md` with the Mermaid diagram embedded — immediately
renderable in GitHub, VS Code, or the skill's own summary.

For non-JS repos, `scc` produces per-directory language breakdowns that can be
rendered as a simplified module map.

**5. Security fix PR generator (high value, high complexity)**

The most ambitious generative output. For findings of type "missing CI action
pin" or "missing branch protection" or "no secrets scan configured," the skill
could:

1. Generate the specific file change required
2. Create a branch in the target repo (requires write token)
3. Open a PR with structured description and SARIF attachment

This requires OAuth write access, not just read. It should be gated behind
`--mode=generate-fixes` with explicit user confirmation. But it is implementable
— the individual fix templates are deterministic for the most common security
hygiene gaps.

**Implementation priority order:** 2 → 3 → 1 → 4 → 5. Start with dependabot.yml
generation (deterministic, high value, zero risk) and CI skeleton
(deterministic, high value, zero risk). Defer architecture diagrams and PR
generation to v2.

---

## Cross-Cutting: The Missing Temporal Dimension

All seven sections above share a common thread that the primary research missed:
**time is a first-class signal, not a side effect of metrics.**

The research treats repos as static objects with history attached. The
outside-the-box view treats repos as processes observed over time. The
difference is not philosophical — it changes what you measure and when you
alert.

The primary research correctly identifies seven platform gaps. The most
consequential one is gap #7: "trend-based early warning." The implementation
path for gap #7 runs through ideas 1 (star velocity), 3 (time-series alerting),
5 (dependency biography), and 6 (due diligence temporal signals). All four use
the same underlying infrastructure: Phase 3 history clone + append-only
`trends.jsonl` + a watchlist alerting layer.

**Recommended addition to the architecture:** Phase 3 should always include a
"temporal fingerprint" agent that computes the time-series signatures cheaply
and appends them to `trends.jsonl`. This agent is not conditional on "churn
requested" — every analysis should record the temporal state, because the value
is in the second and third run, not the first.

---

## Confidence Assessment

- HIGH claims: 8 (implementability assessments, existing API capabilities, git
  command viability)
- MEDIUM claims: 12 (signal interpretations, threshold values, business value
  estimates)
- LOW claims: 3 (fork-to-star ratio thresholds, covenant of variation as heroism
  proxy, PR review density as behavioral predictor)
- UNVERIFIED claims: 0

Overall confidence: MEDIUM-HIGH. All proposals are grounded in the existing
synthesis's confirmed infrastructure. The uncertainty is in calibration (exact
threshold values) not in feasibility.
