# Findings: Medium-Confidence Claim Verification (C-035, C-036, C-038, C-G010)

**Searcher:** deep-research-searcher (convergence-loop mode) **Profile:** web
**Date:** 2026-03-31 **Sub-Question IDs:** C-035, C-036, C-038, C-G010

---

## Key Findings

### C-035: 6-Dimension Radar + 4-Artifact Output Design [CONFIDENCE: MEDIUM]

**Claim:** "A proposed 6-dimension radar output (Security, Reliability,
Maintainability, Documentation, Process, Velocity) with 4-artifact delivery
(analysis.json, findings.jsonl, trends.jsonl, summary.md) represents the optimal
output design for repo analysis."

**Verdict: HOLD (MEDIUM) — partially supported by industry patterns, but
"optimal" is unverifiable**

**Evidence for the dimensions:**

The 6 dimensions have partial grounding in established standards, but no single
authoritative source uses exactly this combination:

- **Security + Reliability + Maintainability**: Directly present in ISO/IEC
  25010:2023 [1], SonarQube's measurable axes [2], and GitHub Code Quality's
  two-tier system (Reliability + Maintainability) [3].
- **Documentation**: Appears as a tracked dimension in tools like GitHub OSPO
  health metrics [4], Repo Doctor's "Docs & Onboarding" category [5], and
  NxCode's 8-dimension checker.
- **Process**: Implicit in CHAOSS's Evolution and Risk working groups [6], and
  in SAFe DevOps Health Radar's 16-area model. No tool uses "Process" as a
  standalone top-level axis.
- **Velocity**: Referenced in general repo analytics literature and DORA metrics
  [7], but rarely as a first-class health dimension alongside
  security/reliability. CHAOSS mentions it within Evolution metrics.

**Comparable tool dimension sets:**

- Repo Doctor (6 categories): Docs & Onboarding, Developer Experience, CI/CD,
  Quality & Tests, Governance, Security — notably uses Governance + Developer
  Experience instead of Reliability/Process/Velocity [5]
- NxCode (8 dimensions): Activity & Maintenance, Documentation Quality, Code
  Quality, Community Engagement, Reliability & Testing, Security & Best
  Practices, Performance & Optimization, Innovation & Impact
- CHAOSS (5 working groups): Common, Diversity & Inclusion, Evolution, Value,
  Risk
- LFX Insights (4 dimensions): Contributors, Popularity, Development, Security &
  Best Practices [8]
- OpenSSF Scorecard (20 checks): Heavily security-focused, no Documentation or
  Velocity axis

**Conclusion on dimensions:** Security + Reliability + Maintainability are
well-validated. Documentation is common but often merged with
Process/Governance. Process and Velocity are less common as standalone top-level
axes. The 6-dimension set is defensible and internally coherent; it is not
uniquely "optimal" — it is one reasonable configuration among several.

**Evidence on 4-artifact output:**

No existing documented tool uses the specific combination {analysis.json,
findings.jsonl, trends.jsonl, summary.md}. Search found no matches across
gitinspector, repomix, feedzai repo-analyzer, or any other tool. This appears to
be a novel design proposal. The pattern of separating structured
machine-readable (JSON/JSONL) from human-readable (markdown summary) output is
used by tools like GitInspector (HTML/JSON/XML) and CodeScene, but the exact
4-artifact split is not established practice.

**Revised claim:**

> "The 6-dimension radar design (Security, Reliability, Maintainability,
> Documentation, Process, Velocity) is grounded in established standards (ISO
> 25010, SonarQube) for the first 3 dimensions, and reasonably supported by
> community tools for Documentation. Process and Velocity are valid but less
> common as standalone axes. The 4-artifact delivery split is a novel design
> with no precedent in existing tools — it is coherent but unvalidated as
> 'optimal'."

---

### C-036: Scoring Bands 0-39/40-59/60-79/80-100 Aligned with SonarQube [CONFIDENCE: LOW]

**Claim:** "Scoring bands for repo health should be: 0-39 Critical (Red), 40-59
Needs Work (Orange), 60-79 Healthy (Yellow), 80-100 Excellent (Green), aligned
with SonarQube A-E tiers."

**Verdict: DOWNGRADE to LOW — the SonarQube alignment claim is factually
incorrect**

**Critical finding:** SonarQube does NOT use 0-100 numeric score bands. Its
rating system is:

- **Security/Reliability**: A (0 issues) → B (low) → C (medium) → D (high) → E
  (blocker) [2]
- **Maintainability**: A (0-5% technical debt ratio) → B (5-10%) → C (10-20%) →
  D (20-50%) → E (≥50%) [2]

These are letter grades tied to issue severity thresholds or technical debt
ratio percentages. There is no SonarQube numeric 0-100 aggregate score that maps
to these tiers. The claim that the proposed 4-band system is "aligned with
SonarQube A-E tiers" is not accurate — they are structurally different scoring
systems.

**What actually uses 5-band 0-100 systems:**

LFX Insights Health Score uses a 5-band system on 0-100: [8]

- > 80: Excellent
- 60-79: Healthy
- 40-59: Stable
- 20-39: Unsteady
- < 20: Critical

The claim's bands (80-100, 60-79, 40-59, 0-39) collapse LFX's bottom two tiers
(Unsteady + Critical) into one "Critical" band. This is a real difference: a
repo scoring 25/100 (Unsteady, salvageable) would be treated identically to a
repo scoring 5/100 (Critical, abandoned) under the proposed scheme.

**Other band systems found:**

- GitHub Code Quality: 4 qualitative tiers (Excellent, Good, Fair, Needs
  Improvement) — issue severity-based, no numeric cutoffs [3]
- OpenSSF Scorecard: 0-10 per check, no aggregate 0-100 score
- CodeScene Code Health: 1.0-10.0 scale (inverse — lower is worse)

**Conclusion:** The 4-band structure is a reasonable human-readable
simplification, but the SonarQube alignment claim is unsupported. The bands also
conflict with LFX's empirically deployed 5-band system at the low end (0-39 vs
0-19/20-39). No authoritative source maps these exact numeric thresholds to a
repo health score.

**Revised claim:**

> "Scoring bands of 0-39 Critical, 40-59 Needs Work, 60-79 Healthy, 80-100
> Excellent are a plausible 4-tier simplification for a 0-100 repo health score.
> This is NOT aligned with SonarQube, which uses severity-based letter grades
> (A-E), not numeric bands. LFX Insights uses a comparable but finer 5-band
> system with a different Critical threshold (< 20, not < 40). The proposed
> bands compress two meaningful health states (Unsteady vs Critical) into one."

---

### C-038: LFX Insights Relaunch, 15,000+ Repos, 4 Dimensions, External Accessibility [CONFIDENCE: HIGH]

**Claim:** "LFX Insights relaunched in May 2025 covering 15,000+ repositories
with Health Scores across 4 dimensions; it is free for Linux Foundation projects
and increasingly accessible for external use."

**Verdict: UPGRADE to HIGH — all core facts verified across multiple
authoritative sources**

**Verified facts:**

1. **Relaunch in May 2025**: Confirmed by LFX Insights official blog ("end of
   May 2025") [9], CNCF blog (October 2025) [10], and Linux Foundation blog. The
   2022 LF blog described an earlier version that was "available exclusively to
   Linux Foundation projects" — the May 2025 relaunch is a distinct product
   revision. [11]

2. **15,000+ repositories**: Confirmed by CNCF blog [10] and LFX Insights "First
   3 Months" blog post (September 2025): "15k repositories across 953 LF
   projects and 170 non-LF projects." [9] Note: Official documentation page says
   "1,000+ projects" — this is project count, not repository count. The 15,000
   figure refers to repositories (multiple repos per project). Roadmap targets
   "Top 10,000 projects by Criticality Score." [8]

3. **4 health score dimensions**: Confirmed in official Health Score
   documentation [8] and CNCF blog [10]:
   - Contributors (0-25 pts)
   - Popularity (0-25 pts)
   - Development (0-25 pts)
   - Security & Best Practices (0-25 pts)

4. **Accessibility for non-LF projects**: Confirmed. The relaunch explicitly
   introduced "Support for projects outside of the Linux Foundation." [9] CNCF
   blog confirms projects can be submitted via GitHub discussions. [10]
   Pre-May-2025 version was LF-exclusive.

5. **Free access**: The platform is publicly accessible at
   insights.linuxfoundation.org with no stated paywall. The prior LFX tooling
   had different access models, but the relaunched Insights platform is framed
   as a developer tool for ecosystem-wide use.

**Minor correction:** The claim says "free for Linux Foundation projects" — more
precisely, it is free for all users (LF and non-LF). The prior constraint was
that _only_ LF projects were indexed; the May 2025 change added non-LF project
indexing, not a pricing change.

**Revised claim:**

> "LFX Insights relaunched in late May 2025 covering 15,000+ repositories
> (across 953 LF + 170 non-LF projects) with Health Scores across 4
> equally-weighted dimensions: Contributors, Popularity, Development, and
> Security & Best Practices (each 0-25 pts). It is publicly accessible at no
> charge to all developers; prior to the May 2025 relaunch it was limited to
> Linux Foundation-hosted projects only."

---

### C-G010: Star Velocity / Fork-to-Star / Watcher-to-Star Thresholds [CONFIDENCE: LOW]

**Claim:** "Star velocity, fork-to-star ratio, and watcher-to-star ratio are
more diagnostic signals than raw star count. Fork-to-star > 0.15 indicates
active building; watcher-to-star

> 0.05 indicates operational criticality."

**Verdict: HOLD at LOW (not MEDIUM) — directional intuition is supportable,
specific thresholds are not cited anywhere and appear to be invented**

**On the claim that ratios are more diagnostic than raw counts:**

Multiple sources support the general principle that ratios provide context that
raw counts do not [12, 13]. The metrics-toolkit.org resource explicitly notes
that forks signal "use or reuse" while watchers indicate passive notification
interest [14]. The "What's in a GitHub Star?" 2018 academic paper found stars
correlate with popularity but are unreliable for quality [12]. CHAOSS treats
these as different signal types. This directional claim is well-supported.

**On the specific 0.15 and 0.05 thresholds:**

Exhaustive search found zero citations for these specific numbers in any:

- Academic paper (searched JSS, arXiv, MSR proceedings)
- Tool documentation (CHAOSS, LFX, OpenSSF, GitHub Docs)
- Blog post or community source

The thresholds appear to be invented values, not derived from empirical research
or community consensus.

**Empirical test against known repos (current data from GitHub Ranking [15]):**

| Repo           | Stars   | Forks  | Fork/Star Ratio | Above 0.15? |
| -------------- | ------- | ------ | --------------- | ----------- |
| facebook/react | 244,267 | 50,864 | 0.208           | YES         |
| vercel/next.js | 138,553 | 30,732 | 0.222           | YES         |

Both are canonically "actively built" frameworks and both clear the 0.15
threshold, which is consistent with the claim's direction. However, this does
not validate the threshold itself:

- A ratio of 0.14 might be equally "active building" — there is no demonstrated
  discontinuity at 0.15
- A low-activity framework that was heavily forked years ago might have a high
  ratio with no recent building activity
- Academic research notes "most repositories are forks and have very low
  activity" — the base rate problem is unaddressed by this threshold

**Watcher data limitation:** Watcher counts (subscribers_count in GitHub API)
are not available in public ranking tables. The 0.05 watcher-to-star threshold
cannot be empirically tested without API access. Notably, GitHub's own API
documentation distinguishes "stargazers_count" from "subscribers_count"
(watchers), and community discussions note these are frequently confused [GitHub
community discussion #24795]. The watcher count for major repos is generally
much lower than star count (typically 1-3% for large repos), which would make
the > 0.05 threshold trivially true for most watched repos.

**Revised claim:**

> "Fork-to-star ratio and watcher-to-star ratio provide more contextual signal
> than raw star count, as ratios control for absolute scale. This directional
> principle is supported by academic literature and community tools. However,
> the specific thresholds (> 0.15 for 'active building', > 0.05 for 'operational
> criticality') have no citation in academic literature, tool documentation, or
> community standards — they appear to be invented heuristics. Both React and
> Next.js clear the 0.15 fork/star threshold, but this provides limited
> validation given the arbitrary threshold value. Use these ratios as relative
> signals, not absolute gates."

---

## Verdict Summary

| Claim                                       | Original Confidence | Verdict   | New Confidence |
| ------------------------------------------- | ------------------- | --------- | -------------- |
| C-035: 6-dimension radar + 4-artifact       | MEDIUM              | HOLD      | MEDIUM         |
| C-036: Scoring bands aligned with SonarQube | MEDIUM              | DOWNGRADE | LOW            |
| C-038: LFX Insights facts                   | MEDIUM              | UPGRADE   | HIGH           |
| C-G010: Ratio thresholds 0.15/0.05          | MEDIUM              | DOWNGRADE | LOW            |

---

## Sources

| #   | URL                                                                                                    | Title                                              | Type                       | Trust  | CRAAP | Date       |
| --- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | -------------------------- | ------ | ----- | ---------- |
| 1   | https://iso25000.com/en/iso-25000-standards/iso-25010                                                  | ISO/IEC 25010 Quality Model                        | Official standard          | HIGH   | 4.8   | 2023       |
| 2   | https://docs.sonarsource.com/sonarqube-server/user-guide/code-metrics/metrics-definition               | SonarQube Metrics Definition                       | Official docs              | HIGH   | 4.9   | 2025       |
| 3   | https://docs.github.com/en/code-security/code-quality/reference/metrics-and-ratings                    | GitHub Code Quality Metrics & Ratings              | Official docs              | HIGH   | 4.9   | 2026       |
| 4   | https://github.com/github/github-ospo/blob/main/docs/open-source-health-metrics.md                     | GitHub OSPO: Open Source Health Metrics            | Official/community         | HIGH   | 4.5   | 2024       |
| 5   | https://dev.to/glaucia86/repo-doctor-ai-powered-github-repository-health-analyzer-136n                 | Repo Doctor Health Analyzer                        | Community blog             | MEDIUM | 3.2   | 2025       |
| 6   | https://github.com/chaoss/metrics                                                                      | CHAOSS Metrics README                              | Official OSS project       | HIGH   | 4.5   | 2025       |
| 7   | https://www.atlassian.com/devops/frameworks/dora-metrics                                               | DORA Metrics: Atlassian                            | Vendor docs                | MEDIUM | 4.0   | 2025       |
| 8   | https://insights.linuxfoundation.org/docs/metrics/health-score                                         | LFX Insights Health Score Documentation            | Official docs              | HIGH   | 4.9   | 2025       |
| 9   | https://insights.linuxfoundation.org/blog/first-3-months                                               | LFX Insights: First 3 Months Recap                 | Official blog              | HIGH   | 4.7   | 2025-09-03 |
| 10  | https://www.cncf.io/blog/2025/10/22/lfx-insights-a-new-way-to-understand-open-source-projects/         | LFX Insights: A New Way to Understand OSS Projects | Official CNCF blog         | HIGH   | 4.8   | 2025-10-22 |
| 11  | https://www.linuxfoundation.org/blog/actively-manage-your-open-source-project-health-with-lfx-insights | LFX Insights 2022 Announcement                     | Official blog (historical) | HIGH   | 4.0   | 2022-10-18 |
| 12  | https://www.sciencedirect.com/science/article/abs/pii/S0164121218301961                                | What's in a GitHub Star? (JSS 2018)                | Peer-reviewed              | HIGH   | 4.6   | 2018       |
| 13  | https://arxiv.org/pdf/1606.04984                                                                       | Factors Impacting GitHub Repository Popularity     | Academic preprint          | MEDIUM | 4.2   | 2016       |
| 14  | https://metrics-toolkit.org/metrics/github_forks_collaborators_watchers/                               | Metrics Toolkit: GitHub Forks/Watchers             | Community reference        | MEDIUM | 3.8   | 2024       |
| 15  | https://github.com/EvanLi/Github-Ranking/blob/master/Top100/Top-100-stars.md                           | GitHub Top 100 Stars Ranking (auto-updated)        | Community data             | MEDIUM | 3.9   | 2026-03-30 |

---

## Contradictions

**C-038 repo count discrepancy:** Official documentation says "1,000+ projects"
while the CNCF blog and the First 3 Months post say "15,000+ repositories."
These are not contradictory — they measure different things (projects vs
repositories). A project typically has multiple repos. The LF OSS Index page
notes the goal of "Top 10,000 projects by Criticality Score," suggesting
projects are the primary unit and repos are secondary counts.

**C-036 LFX vs claim bands:** LFX Insights uses 5 bands (<20 Critical, 20-39
Unsteady, 40-59 Stable, 60-79 Healthy, >80 Excellent), while the claim uses 4
bands (0-39 Critical, 40-59 Needs Work, 60-79 Healthy, 80-100 Excellent). These
are in conflict at the low end. The LFX system provides finer resolution for
distressed repos.

---

## Gaps

- **Watcher count data**: Could not empirically verify the 0.05 watcher-to-star
  threshold without GitHub API access. Watcher/subscriber counts are not in
  public ranking tables.
- **SonarQube 0-100 aggregate**: A numeric 0-100 SonarQube score does not appear
  to exist. If the claim's author was thinking of SonarCloud's Quality Score
  metric (which some plugins compute), that would require source verification.
  No such metric was found in official docs.
- **"Optimal" output design**: The 4-artifact split (analysis.json,
  findings.jsonl, trends.jsonl, summary.md) has no precedent in existing tools.
  Cannot verify or refute "optimal" — it is an untestable design claim without a
  comparative study.
- **C-G010 threshold origin**: Cannot determine where 0.15 and 0.05 originated.
  No search query surfaced a source. May be the original researcher's heuristic,
  or from an unpublished internal study. Should be treated as invented until a
  primary source is found.

---

## Serendipity

- **GitHub Code Quality launched in public preview (Feb 2026)**: GitHub recently
  launched an organization-level Code Quality dashboard (changelog: 2026-02-24)
  with Reliability + Maintainability ratings. This is directly relevant to the
  repo-analysis-skill design — it represents new first-party competition/overlap
  that the skill design should account for. [3]
- **LFX Insights is fully open source**: The First 3 Months blog confirms the
  relaunched platform has an open source codebase. This is relevant if the skill
  design wants to reference, integrate, or differentiate from it.
- **"What the Fork" FSE 2019 paper**: Research on fork efficiency
  (cmustrudel.github.io/papers/fse19forks.pdf) measures the fraction of forks
  that submit PRs upstream — a more nuanced "active building" metric than the
  binary > 0.15 ratio threshold.

---

## Confidence Assessment

- HIGH claims: 1 (C-038 upgrade)
- MEDIUM claims: 1 (C-035 hold)
- LOW claims: 2 (C-036 downgrade, C-G010 downgrade)
- UNVERIFIED claims: 0
- Overall confidence: MEDIUM (one verified, one plausible, two unsupported)
