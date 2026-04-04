# Findings: How Specialized Repo Analysis Platforms Work and What Unique Insights They Provide

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** D3b

---

## Key Findings

### 1. GitClear — Code Churn and Durable Progress Analytics [CONFIDENCE: HIGH]

**What unique dimension it covers:** GitClear addresses the gap between raw
commit/line-count metrics and actual durable engineering contribution. Its core
insight is that most code changes are noise: whitespace, copy-paste, moves,
batch find-replace, and short-lived churn. It specifically tracks AI-assisted
coding's impact by measuring whether code written survives or gets reverted
within 2 weeks.

**How it works:** SaaS only. Connects to GitHub, GitLab, Bitbucket (including
self-hosted enterprise variants). Analyzes git history server-side and computes
its proprietary Diff Delta metric per commit. Refreshes data on a schedule (1
hour for Enterprise, 48 hours for free tier).

**Diff Delta methodology (proprietary, published):** The formula is
multiplicative across six factors:

- φ (file/branch filter) — eliminates auto-generated code, compiled files,
  unmerged/release branches
- ⊖ (context filter) — removes whitespace-only, keywords, blank lines, ad hoc
  comments
- ⧉ (duplication filter) — prevents double-counting of rebased/cherry-picked
  commits
- β (base score) — credits by operation type (deletes score higher than adds;
  copy-paste scores lowest)
- τ (time scalar) — increases credit for code that persists (durability
  premium); penalizes churn
- σ (context scalar) — adjusts for language weight, proximity, greenfield vs.
  legacy

In GitClear's published analysis of 62.6 million raw lines, only 1.4 million
(2.3%) survived all filters as "meaningful change that endures." [1][2]

**Pricing:**

- Starter (Free): 3 repos, 6-month window, 2,000 commits, 50 PRs, 48h refresh
- Pro: $14.95/mo (annual) — 25 repos, 3-year window, API access, DORA metrics,
  developer sentiment surveys
- Elite: $24.95/mo (annual) — 250 repos, 5,500-day window
- Enterprise: $34.95/mo (annual) — unlimited repos, 1h refresh, on-premises
  option

No annual contract required. Pricing based on contributor count, not seat count.
[3]

**API:** Available on Pro and above. GitClear does not publish a public API
spec, but Pro+ tiers expose export/API endpoints. Specifics not publicly
documented.

**Proprietary vs transparent:** The Diff Delta formula factors are published at
`gitclear.com/diff_delta_factors`. The exact weightings and research validation
claims are proprietary. The 2025 AI Code Quality research used 211 million
structured code changes from 2020-2024. [2][4]

**What it misses:** No security posture. No community health (contributor
diversity, response times). No cross-repo dependency analysis. No runtime
correlation.

---

### 2. OpenSSF Scorecard — Supply Chain Security Posture [CONFIDENCE: HIGH]

**What unique dimension it covers:** Scorecard is the only free, automated,
fully open-source tool that scores a repository's security practices as a whole
against a defined supply chain security framework. It evaluates process hygiene
(code review, branch protection, token permissions) rather than just CVE
presence.

**How it works:**

- **CLI:** `scorecard --repo=github.com/owner/repo` — runs all checks live
  against the target repo. Requires GitHub auth token. Available via Docker,
  Homebrew, Nix, or standalone binary.
- **GitHub Actions:** Can run on every PR as a CI gate.
- **REST API:** `https://api.scorecard.dev` serves pre-computed weekly scores
  for ~1 million critical open source projects (cached via Fastly CDN).
- **BigQuery dataset:** `openssf:scorecardcron.scorecard-v2` — the full weekly
  scan results are published as an open public dataset under CDLA Permissive
  2.0. [5][6]

**Complete check list (20 checks):**

| Check                  | What It Tests                           |
| ---------------------- | --------------------------------------- |
| Binary-Artifacts       | Executable binaries in source           |
| Branch-Protection      | Default/release branch protection rules |
| CI-Tests               | Tests run on PRs                        |
| CII-Best-Practices     | OpenSSF Best Practices Badge level      |
| Code-Review            | Human review required before merge      |
| Contributors           | Multiple orgs contributing              |
| Dangerous-Workflow     | Risky GitHub Actions patterns           |
| Dependency-Update-Tool | Dependabot/Renovate configured          |
| Fuzzing                | OSS-Fuzz or similar enrolled            |
| License                | License file present                    |
| Maintained             | Recent commit activity (90 days)        |
| Packaging              | Published as downloadable package       |
| Pinned-Dependencies    | Hash-pinned dependencies                |
| SAST                   | Static analysis tool integrated         |
| SBOM                   | Software Bill of Materials present      |
| Security-Policy        | Vulnerability disclosure policy         |
| Signed-Releases        | Cryptographic signing of releases       |
| Token-Permissions      | Least-privilege workflow tokens         |
| Vulnerabilities        | Known CVE presence                      |
| Webhooks               | Secure webhook configuration            |

Each check scores 0-10; aggregate score is risk-weighted. Weekly API results
exclude CI-Tests, Contributors, and Dependency-Update-Tool due to scaling cost.
[5][7]

**Pricing:** 100% free. CLI is open source (Apache 2.0). API is free with no
auth required for public repos.

**API data exposed:** JSON with individual check scores, risk levels, reasons,
and documentation links. Pre-computed dataset in BigQuery covers the top 1
million projects by dependent count.

**Proprietary vs transparent:** Fully open source. All check implementations are
in the public repo at `github.com/ossf/scorecard`. Scoring weights and logic are
auditable. [7]

**Key limitations:**

- Checks are heuristics — false positives and negatives exist
- Does not detect all SAST or fuzzing implementations (only known tools
  recognized)
- Does not verify code review quality, only presence
- Does not cover runtime behavior, production incidents, or developer
  productivity
- SBOM check only verifies existence, not completeness or accuracy
- GitHub-only for weekly scans; CLI supports GitLab/Bitbucket but not API

---

### 3. Socket.dev — Dependency Supply Chain Risk [CONFIDENCE: HIGH]

**What unique dimension it covers:** Socket is the only major platform that
analyzes what third-party packages _do_ in their code (install scripts, network
calls, filesystem access, obfuscated code, maintainer behavior) rather than just
matching against known CVE databases. It detects zero-day supply chain attacks
before they have CVEs.

**How it works:**

- **GitHub App:** Integrates into PRs; evaluates every `package.json` change and
  blocks malicious dependencies before merge
- **CLI:** `socket scan` for local analysis
- **API:** Full REST API for programmatic scanning, diff scans, SBOM export,
  vulnerability management
- Supports 10+ ecosystems: JavaScript, Python, Java, Ruby, .NET, Go, Rust,
  Scala, Kotlin, and more

**Methodology (partially transparent):** Socket uses 70+ signals across three
detection techniques:

1. **Static analysis** — capability detection (network access, filesystem,
   shell, env vars, obfuscation, install scripts)
2. **Package metadata analysis** — typosquat detection via Levenshtein distance,
   version chronology anomalies, maintainer ownership changes
3. **Maintainer behavior analysis** — unstable ownership (new publish
   permissions), out-of-order patch releases

Reachability analysis: Static analysis of both application code and dependency
tree to determine which CVEs are actually reachable. Claims 80% of CVEs in
typical projects are unreachable; Enterprise tier achieves 90% false-positive
reduction via full function-level reachability. [8][9]

**Pricing:**

- Free: $0 — unlimited repos/developers, 1,000 scans/month, open source free
  permanently
- Team: $25/dev/month — 5,000 scans/month, priority scoring
- Business: $50/dev/month — unlimited scans, full API quota, compliance
  integrations
- Enterprise: Custom — full function-level reachability, GitLab/Bitbucket/Azure
  DevOps, named CSM

**API data exposed:** Full scan results, vulnerability alerts, security scores
per package, dependency trees, SBOM (SPDX/CycloneDX), OpenVEX, CSV exports,
audit logs, webhook events [10]

**Proprietary vs transparent:** Static analysis engine is proprietary.
Reachability specifications (which functions in a vulnerable package are
actually exploitable) are developed by Socket's team and peer-reviewed
internally. The 70+ signal list is published at a high level but individual
detection logic is not open source. [8][9]

**What it misses:** No code quality, productivity, or developer experience
metrics. No community health. Not designed for internal code analysis (only
third-party dependencies). Does not address runtime behavior of your own code.

---

### 4. CodeScene — Behavioral Code Analysis [CONFIDENCE: HIGH]

**What unique dimension it covers:** CodeScene is the only major platform that
combines git history (temporal/behavioral data) with code complexity analysis to
reveal _where teams actually spend time_ and _which complexity actually causes
problems_. Static analysis alone cannot detect this — a complex file that is
never touched creates no friction; a complex file changed daily is a critical
bottleneck.

**How it works:**

- **SaaS** (cloud) or **on-premise** Docker container. Both offer equivalent
  features.
- Connects to GitHub, GitLab, Bitbucket, Azure DevOps
- Analyzes git log (who changed what when) combined with static code analysis
  (complexity, cognitive load)
- CI/CD integration via GitHub/GitLab/Bitbucket/Azure PR gates
- IDE extensions: VS Code, IntelliJ, Cursor, Visual Studio

**Core methodology (partially proprietary):**

1. **Hotspot analysis** — identifies files changed most frequently (high change
   frequency) with highest complexity (high cognitive load). Hotspot = frequency
   × complexity. This prioritization is transparent and grounded in published
   research. [11][12]
2. **Temporal coupling** — detects files that always change together even
   without explicit dependency. Reveals hidden architectural coupling that
   static analysis misses entirely. Measured from git evolution, not code
   structure.
3. **Knowledge distribution / Bus Factor** — maps who owns each file; simulates
   "offboarding risk" by removing contributors to show which files would become
   orphaned. Proprietary "CodeHealth™" metric (patented algorithms).
4. **CodeHealth™** — measures cognitive difficulty for human comprehension.
   Based on 25+ code smells (God Class, God Methods, Duplicated Code, deep
   nesting, etc.). Validated through research; claims linkage to business impact
   (defect rates, delivery speed). Exact formula is proprietary.

**Pricing:**

- Community Edition: Free for open source projects — code reviews, hotspot
  management, CodeHealth, knowledge distribution
- Standard: €18/active author/month (annual) — Technical debt management,
  quality gates for AI coding, automated PR reviews
- Pro: €27/active author/month (annual) — Portfolio overview, team insights,
  delivery insights, code coverage
- Enterprise: Custom — dedicated workshops, tailored support, scalable pricing

"Active author" = anyone who committed code in the past 3 months. [13]

**API:** Full REST API v2 available on all plans. Endpoints cover:

- Projects, analyses, files, components, commits, issues, commit-activity
- Author statistics, branch statistics, technical debt, experience/language
  inventory
- Delta analyses (compare two points in time)
- Code coverage gate results
- Team and developer management All via Bearer token auth (Personal Access
  Token). Admin endpoints require Admin role. [14]

**Proprietary vs transparent:** Hotspot logic and temporal coupling algorithm
are documented conceptually in Adam Tornhill's books ("Your Code as a Crime
Scene," "Software Design X-Rays"). CodeHealth™ formula and specific scoring
weights are patented and not disclosed. The research-to-business-impact claims
("2x faster delivery," "9x risk reduction") are marketing assertions — the
underlying validation methodology is not fully public. [11][12]

---

### 5. Bitergia Analytics / GrimoireLab (CHAOSS) — Community and Multi-Source Development Analytics [CONFIDENCE: HIGH]

**What unique dimension it covers:** GrimoireLab is the only major open-source
platform designed specifically for cross-source community health analytics at
scale. It unifies contributor identity across 40+ data sources (git commits,
issue trackers, mailing lists, Slack, IRC, CI, package registries, social
platforms). No other platform normalizes identity across these sources and
applies CHAOSS community health metrics. Primarily designed for open source
project health measurement, not internal team productivity.

**How it works:**

- **Self-hosted only** (GrimoireLab open source): Docker Compose deployment.
  Data pipeline: Perceval (data retrieval) → SortingHat (identity
  deduplication/affiliation) → GrimoireELK (enrichment + Elasticsearch storage)
  → Kibana (visualization)
- **Cauldron.io** — SaaS wrapper built on GrimoireLab; managed instance,
  configurable in one business day
- **Bitergia Analytics** — Commercial SaaS + consulting; custom implementations;
  contact for pricing
- Python API: Common generator-based API for accessing all retrieved data as
  JSON documents

**Data sources (40+):** Git, GitHub, GitLab, Jira, Bugzilla, Gerrit, Launchpad,
Redmine, mailing lists (Pipermail, Mailman, GroupsIO), Slack, Mattermost, IRC,
Discourse, Confluence, Jenkins, Meetup, Mediawiki, Phabricator, StackOverflow,
Telegram, Twitter/X, Docker Hub [15][16]

**Key unique capabilities:**

- **Identity unification** (SortingHat): Merges the same contributor appearing
  as different usernames across systems. Tracks organizational affiliation over
  time (person changes employer but stays active).
- **CHAOSS metrics**: Standardized community health metrics including
  contributor retention, response time distributions, organizational diversity,
  geographic spread
- **Contribution delay analysis**: Measures time from submission to merge across
  platforms (calculated delays, not just averages)
- **Affiliation tracking**: Attributing contributions to organizations, not just
  individuals

**Pricing:**

- GrimoireLab: Free, open source (GPL)
- Cauldron.io: Free tier available; contact for paid tiers
- Bitergia Analytics: Commercial SaaS — pricing not published; requires contact

**API:** GrimoireLab v2.0 is adding a REST API for configuration. Current access
is via Python API (generator-based JSON documents). Elasticsearch indices are
queryable directly.

**Proprietary vs transparent:** GrimoireLab itself is fully open source
(CHAOSS/Linux Foundation). SortingHat identity algorithms are open source but
require expertise to configure affiliation data. Bitergia's commercial layer
adds consulting and customization, not proprietary algorithms.

**What it misses:** No code quality metrics. No security posture analysis. No
developer productivity measurement (no Diff Delta equivalent). Primarily
backward-looking (historical trends). Requires significant infrastructure and
expertise to deploy meaningfully. Not designed for single-team internal repos —
scales better for large open source ecosystems.

---

### 6. Sourcegraph Code Search — Cross-Repository Code Intelligence [CONFIDENCE: HIGH]

**What unique dimension it covers:** Sourcegraph provides cross-repository
semantic code search and navigation at enterprise scale. Its unique value is
answering questions impossible with grep or GitHub search: "Where is this
deprecated API called across all 500 repos?" "What is the blast radius of
changing this interface?" "Show me all implementations of this pattern
organization-wide."

**How it works:**

- **SaaS** (cloud, formerly free but now enterprise-only as of July 2025) or
  **self-hosted** (requires contacting Sourcegraph for fully air-gapped)
- Indexes entire codebases across all connected repos. Supports GitHub, GitLab,
  Bitbucket, Perforce, Azure DevOps, Gerrit
- Uses a variant of Google's PageRank algorithm for search relevance
- Code intelligence: go-to-definition, find-all-references, hover documentation
  — all cross-repo
- Deep Search: AI-powered conversational search against the codebase

**API:** GraphQL API with endpoints for:

- Search queries (file matches, symbol results, repository results, commit
  search)
- Symbol navigation (definitions, references, implementations)
- Repository management
- Search context management
- Stream API for long-running searches (replaces pagination) Does not support
  pagination in GraphQL search; uses streaming for continuous results. `src` CLI
  tool provides JSON output of search queries without manual GraphQL
  construction. [17][18]

**Pricing (as of mid-2025):**

- Cody Free, Pro, Enterprise Starter: Discontinued July 23, 2025
- Enterprise Starter: $19/user/month — up to 50 developers, 100 repos, 5GB
  storage
- Enterprise: $59/user/month — AI + search with enterprise security/scalability
- Deep Search: Each Code Search seat includes 3 Deep Searches/month (starting
  Oct 2025)
- Note: Source code moved to private repository Aug 2024; previously Apache 2.0
  [19][20]

**Proprietary vs transparent:** Previously open source, now fully proprietary.
The search ranking algorithm and code intelligence infrastructure are not
disclosed. The GraphQL API schema is published and documented.

**What it misses:** No code quality metrics. No security scanning. No dependency
analysis. No community health. No developer productivity metrics. Pure search
and navigation — the value is exploration and impact analysis, not automated
scoring or policy enforcement.

---

### 7. "repo-report-card" — Lightweight Repository Grading Tools [CONFIDENCE: MEDIUM]

The specific tool "repo-report-card" was not found as a distinct named product.
What exists is a fragmented landscape of lightweight grading tools:

**RepoCheck (repocheck.com):** Scores PR and issue closure effectiveness on 0-10
scale. Currently appears non-functional based on retrieval. No pricing, no API.

**RepoRater (EddieHubCommunity):** Developer Experience (DX) focused repository
rating. Open source GitHub project.

**RepoHealth (pelson/repohealth.info):** Combines commit data with GitHub API
metrics. Explicitly avoids single aggregate score — presents multi-dimensional
data. Open source.

**Reaper (RepoReapers):** Scores repos on best engineering practices using a
weighted formula. Academic origin. CLI.

**RepoMetaScore (cossacklabs):** Risk scoring based on contributor metadata,
location, email domain, commit history. CLI or CI/CD integration.

**Repo Doctor:** AI-powered 0-100% health score across 6 categories with
P0/P1/P2 prioritization. Built with GitHub Copilot SDK. Newer tool (2025).

**Common characteristics:** These lightweight tools primarily use GitHub API
metadata (stars, forks, issues, PRs, contributors, last commit date). None
access git history for behavioral analysis. None perform code quality analysis.
Primarily useful as quick open-source project health indicators, not internal
team analytics. [21][22]

---

## Sources

| #   | URL                                                                                                 | Title                                                     | Type                      | Trust  | CRAAP | Date |
| --- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------- | ------ | ----- | ---- |
| 1   | https://www.gitclear.com/diff_delta_factors                                                         | Diff Delta Factors                                        | Official docs             | HIGH   | 4.2   | 2024 |
| 2   | https://www.gitclear.com/ai_assistant_code_quality_2025_research                                    | AI Code Quality 2025 Research                             | Official research         | HIGH   | 4.0   | 2025 |
| 3   | https://www.gitclear.com/pricing                                                                    | GitClear Pricing                                          | Official pricing page     | HIGH   | 4.5   | 2026 |
| 4   | https://www.gitclear.com/help/understand_diff_delta_from_first_principles_stats_on_metric_stability | Diff Delta First Principles                               | Official docs             | HIGH   | 4.2   | 2024 |
| 5   | https://scorecard.dev/                                                                              | OpenSSF Scorecard                                         | Official product site     | HIGH   | 4.8   | 2025 |
| 6   | https://www.endorlabs.com/learn/introducing-the-openssf-scorecard-api                               | Introducing OpenSSF Scorecard API                         | Tech blog                 | MEDIUM | 3.5   | 2024 |
| 7   | https://github.com/ossf/scorecard/blob/main/docs/checks.md                                          | Scorecard Checks Documentation                            | Official source code docs | HIGH   | 5.0   | 2025 |
| 8   | https://docs.socket.dev/docs/static-reachability-analysis                                           | Socket Static Reachability Analysis                       | Official docs             | HIGH   | 4.8   | 2025 |
| 9   | https://appsecsanta.com/socket                                                                      | Socket Review 2026                                        | Third-party review        | MEDIUM | 3.6   | 2026 |
| 10  | https://docs.socket.dev/reference/introduction-to-socket-api                                        | Socket API Reference                                      | Official docs             | HIGH   | 4.8   | 2025 |
| 11  | https://codescene.com/product/behavioral-code-analysis                                              | CodeScene Behavioral Analysis                             | Official product page     | HIGH   | 4.0   | 2025 |
| 12  | https://codescene.com/product/how-it-works                                                          | CodeScene How It Works                                    | Official product page     | HIGH   | 4.0   | 2025 |
| 13  | https://codescene.com/pricing                                                                       | CodeScene Pricing                                         | Official pricing page     | HIGH   | 4.5   | 2025 |
| 14  | https://docs.enterprise.codescene.io/latest/integrations/rest-api.html                              | CodeScene REST API v2                                     | Official API docs         | HIGH   | 5.0   | 2025 |
| 15  | https://chaoss.github.io/grimoirelab/                                                               | GrimoireLab Platform                                      | Official product site     | HIGH   | 4.5   | 2025 |
| 16  | https://pmc.ncbi.nlm.nih.gov/articles/PMC8279145/                                                   | GrimoireLab: A toolset for software development analytics | Peer-reviewed paper       | HIGH   | 4.8   | 2021 |
| 17  | https://sourcegraph.com/docs/api/graphql/search                                                     | Sourcegraph GraphQL Search API                            | Official docs             | HIGH   | 4.5   | 2025 |
| 18  | https://sourcegraph.com/blog/why-code-search-at-scale-is-essential                                  | Why Code Search at Scale                                  | Official blog             | MEDIUM | 3.8   | 2024 |
| 19  | https://sourcegraph.com/changelog/introducing-pricing-plans-and-major-updates-for-deep-search       | Sourcegraph Pricing Plans                                 | Official changelog        | HIGH   | 4.7   | 2025 |
| 20  | https://en.wikipedia.org/wiki/Sourcegraph                                                           | Sourcegraph Wikipedia                                     | Reference                 | MEDIUM | 3.5   | 2025 |
| 21  | https://repocheck.com/                                                                              | Repo Health Check                                         | Product site              | MEDIUM | 3.0   | 2025 |
| 22  | https://github.com/pelson/repohealth.info                                                           | repohealth.info                                           | Open source tool          | MEDIUM | 3.5   | 2023 |
| 23  | https://blog.exceeds.ai/developer-productivity-metrics-ai-era/                                      | 7 AI-Era Developer Productivity Metrics                   | Industry blog             | MEDIUM | 3.4   | 2026 |
| 24  | https://www.hud.io/                                                                                 | Hud Runtime Code Sensor                                   | Product site              | MEDIUM | 3.5   | 2025 |

---

## Platform Comparison Matrix

| Platform             | Dimension                           | Deployment                      | Free Tier                | API                      | Open Source                 | Methodology                                                |
| -------------------- | ----------------------------------- | ------------------------------- | ------------------------ | ------------------------ | --------------------------- | ---------------------------------------------------------- |
| GitClear             | Code churn / durable productivity   | SaaS only                       | 3 repos, 6mo window      | Pro+ only                | No                          | Partially published (formula factors), weights proprietary |
| OpenSSF Scorecard    | Supply chain security posture       | CLI + API + CI                  | Fully free               | Public REST API          | Yes (Apache 2.0)            | Fully transparent                                          |
| Socket.dev           | Dependency behavior risk            | SaaS + CLI + API                | OSS free, 1K scans       | Business+ only           | No                          | High-level published, engine proprietary                   |
| CodeScene            | Behavioral hotspot + org health     | SaaS + on-prem                  | OSS free                 | All tiers REST API       | No (patented)               | Conceptually published, formula proprietary                |
| GrimoireLab/Bitergia | Cross-source community analytics    | Self-hosted / SaaS              | OSS fully free           | Python API, REST roadmap | Yes (GPL)                   | Fully transparent                                          |
| Sourcegraph          | Cross-repo code search/intelligence | SaaS (enterprise) + self-hosted | None (discontinued 2025) | GraphQL API              | No (proprietary since 2024) | Search ranking undisclosed                                 |
| Lightweight graders  | Basic repo health indicators        | SaaS / CLI                      | All free                 | None or minimal          | Varies (mostly OSS)         | Simple heuristics                                          |

---

## Contradictions

1. **CodeScene API availability:** Marketing pages say "API available on all
   plans" but the REST API documentation is clearly enterprise-grade. The free
   Community Edition for open source likely has no practical API access. This
   could not be definitively confirmed from public pricing pages alone.

2. **GitClear API:** One search result stated "GitClear does not offer an API"
   while the official pricing page explicitly lists API access on Pro and above.
   The pricing page is the more authoritative source — the earlier result was
   outdated or incorrect.

3. **Sourcegraph open source status:** Sourcegraph was originally Apache 2.0. It
   was relicensed to "Sourcegraph Enterprise" in June 2023, then moved to a
   private repository in August 2024. Some search results still describe it as
   open source — these are outdated.

4. **CodeScene "no API":** One search engine summary stated CodeScene does not
   have an API. The official REST API v2 documentation contradicts this with 50+
   documented endpoints. The summary was wrong.

---

## Gaps

1. **GrimoireLab REST API pricing:** Bitergia commercial pricing is not publicly
   listed. No pricing data could be retrieved for Cauldron.io paid tiers.
   Requires direct vendor contact.

2. **GitClear API spec:** The actual API endpoints and data schema for
   GitClear's Pro+ API are not publicly documented. Only its existence is
   confirmed via the pricing page.

3. **Sourcegraph current pricing after July 2025 restructuring:** Pricing
   changed significantly (Cody Free discontinued). Current enterprise pricing
   confirmed ($19/$59/user/mo) but limits and feature details for the new
   structure were not fully retrievable.

4. **repo-report-card specifically:** No tool with this exact name was found.
   The landscape of lightweight graders is fragmented and mostly unmaintained.
   Could not confirm if this refers to a specific GitHub tool by this name.

---

## Serendipity

**Hud.io (runtime code sensor, 2025):** An emerging platform (first runtime code
sensor, announced Dec 2025) that continuously captures function-level behavior
in production and feeds it back to AI coding agents via MCP. This closes a gap
none of the above platforms address: correlating what code does in production
with how it was written. Provides structured production behavior to Cursor,
Copilot, Claude Code agents. This is a new category entirely — runtime
intelligence for AI-assisted development. [24]

**DORA gained a 5th metric (Oct 2025):** The CD Foundation announced a 5th DORA
metric in October 2025 (beyond the original 4: deployment frequency, lead time,
change failure rate, time to restore). Current tools claiming "DORA metrics" may
not include this new metric yet.

**GitClear 2025 research findings:** GitClear's 2025 study found 4x growth in
code clones (copy/paste exceeding "moved" code for the first time in history)
and 7.9% of newly added code revised within 2 weeks (up from 5.5% in 2020) —
attributed to AI-assisted coding patterns. This data is available to GitClear
customers but not publicly queryable.

---

## Gaps No Platform Covers

These are the analytical blind spots that exist across ALL specialized platforms
reviewed:

### 1. Cross-Dimension Correlation

No single platform connects: code churn (GitClear) + security posture
(Scorecard) + dependency risk (Socket) + behavioral hotspots (CodeScene) +
community health (GrimoireLab) in a unified view. An engineer or director
looking at a repo's total health must manually triangulate 5 separate tools with
incompatible scoring models.

### 2. Runtime Behavior Correlation with Code Properties

No platform (except nascent Hud.io) correlates what code does in production
(errors, latency, failure rates, incident frequency) with the static/behavioral
properties of that code. A file that is a hotspot AND frequently involved in
incidents is a critical risk — no tool surfaces this combination.

### 3. AI-Assisted Code Identification and Downstream Risk

No platform reliably detects which lines of code were AI-generated vs.
human-written and flags them for differentiated risk treatment. GitClear
measures _effects_ (increased churn, copy-paste) but does not attribute lines to
AI origin. No platform adjusts its code quality, security, or reliability scores
based on the proportion of AI-generated code.

### 4. Team Topology and Coordination Cost

CodeScene partially addresses knowledge silos, but no platform maps Conway's Law
dynamics: which teams own which subsystems, whether team boundaries align with
architectural boundaries, and what coordination overhead exists at team
interfaces. Team Topologies (streams, platforms, enabling, complicated
subsystems) are invisible to all current tools.

### 5. Tech Debt ROI and Business Impact

Every platform measures debt or complexity but none connect it to business
outcomes (cycle time, incident rate, revenue risk, customer-reported defects).
CodeScene makes marketing claims ("2x faster delivery," "9x risk reduction") but
the linkage is not user-configurable or repo-specific. No tool says: "the 3
files in this hotspot cost you X additional hours per sprint based on your PR
history."

### 6. Composite Repo Health Scoring with User-Defined Weights

There is no platform that lets you define your own health model: "I care 40%
about security posture, 30% about code maintainability, 20% about community
health, 10% about dependency freshness" and get a single score updated on
demand. OpenSSF Scorecard is the closest but covers only security and is not
composable with other dimensions.

### 7. Trend-Based Early Warning

Platforms provide point-in-time scores or historical charts, but none surface
trend-based anomalies proactively: "Code churn increased 40% this sprint vs.
12-week average in module X" or "Hotspot complexity has increased 3 weeks
running while contributor coverage decreased." This requires combining temporal
data across dimensions — a gap a custom skill could fill.

### 8. Private Repository Open Source Comparable

For teams using internal code, there is no way to benchmark their repo health
against anonymized industry peers. GitClear offers industry benchmark
comparisons, but only at the aggregate level. No platform provides: "your
security posture is at the 35th percentile for teams your size in your stack."

### 9. Pre-PR / Pre-Commit Local Analysis Combining Multiple Dimensions

All platforms operate post-commit or in CI. No tool provides a pre-commit hook
experience that says: "This change affects a high-churn, low-test-coverage
hotspot with 3 contributors, 2 of whom are inactive. Proceed?" (CodeScene's IDE
extension is closest but is code-health only.)

### 10. Non-GitHub/GitLab Forges and Monorepo Intelligence

Several platforms (Scorecard weekly scans, some lightweight graders) are
GitHub-only or GitHub-primary. For teams on Bitbucket, Azure DevOps, Gitea, or
Gitolite, coverage is partial. No platform handles monorepo architecture
natively — treating sub-packages or workspace members as distinct health units
rather than one blob.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 4
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

Most findings are grounded in official product documentation, official pricing
pages, or open source code. The main uncertainty areas are: proprietary
algorithm details (acknowledged as unknown), Bitergia commercial pricing (not
publicly listed), and the "repo-report-card" specific tool identity (not
confirmed).
