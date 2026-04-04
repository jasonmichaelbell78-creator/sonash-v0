# Findings: Comparison Methodologies for Repo-vs-Repo, Repo-vs-Standard, and Benchmarking

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** D6

---

## Key Findings

### 1. DORA Metrics — Evolved to Five in Oct 2024, Moving to Archetypes in 2025 [CONFIDENCE: HIGH]

DORA (DevOps Research and Assessment) originally defined four delivery
performance metrics. A fifth metric — **Deployment Rework Rate** — was added in
late 2024, tracking the percentage of deployments that are unplanned fixes for
user-facing bugs. The full five metrics are:

| Metric                          | What It Measures                                  | Category    |
| ------------------------------- | ------------------------------------------------- | ----------- |
| Deployment Frequency            | Number of deployments per time period             | Throughput  |
| Change Lead Time                | Committed code → production elapsed time          | Throughput  |
| Failed Deployment Recovery Time | Time to recover from a failed deploy              | Throughput  |
| Change Failure Rate             | % of deployments requiring immediate intervention | Instability |
| Deployment Rework Rate          | % of deployments that are unplanned bug fixes     | Instability |

**2024 Performance Thresholds** (elite → low):

| Metric                | Elite                    | High            | Medium            | Low                   |
| --------------------- | ------------------------ | --------------- | ----------------- | --------------------- |
| Deployment Frequency  | On-demand (multiple/day) | Daily to weekly | Weekly to monthly | Monthly to biannually |
| Lead Time for Changes | < 1 day                  | 1 day–1 week    | 1 week–1 month    | 1–6 months            |
| Change Failure Rate   | 5%                       | 20%             | 10%\*             | 40%                   |
| Recovery Time         | < 1 hour                 | < 1 day         | < 1 day           | 1 week–1 month        |

\*Note: 2024 data shows an inversion where medium performers (10%) outperform
high performers (20%) on change failure rate — the DORA team acknowledges this
anomaly.

**Critical 2025 shift**: The 2025 DORA report abandoned the four-tier
elite/high/medium/low model entirely. Instead, cluster analysis of 8 dimensions
(including burnout, friction, time on valuable work) produced **seven team
archetypes**: Foundational Challenges, Legacy Bottleneck, Constrained by
Process, High Impact Low Cadence, Stable and Methodical, Pragmatic Performers,
and Harmonious High-Achievers. This represents a move from benchmarking tiers to
pattern-based profiling.

**Single-repo adaptation caveat**: DORA specifies metrics "at the application or
service level" rather than team level [1][2]. Academic work has classified
individual OSS repos (e.g., oh-my-posh as High, webpack as Medium) against DORA
benchmarks, but the DORA team explicitly warns against creating "league tables"
since context matters — a web frontend repo will naturally deploy more
frequently than an embedded systems repo.

Sources: [1][2][4][5]

---

### 2. SPACE Framework — Designed for Team Level, Requires Adaptation for Single-Repo [CONFIDENCE: HIGH]

SPACE (Satisfaction, Performance, Activity, Communication, Efficiency) was
developed by GitHub, Microsoft Research, and University of Victoria. It captures
five productivity dimensions. It is intentionally team/org level and relies on
surveys for Satisfaction and Efficiency dimensions.

**SPACEX extension (2025 research)** provides a single-repo adaptation using
artifact-derived proxies instead of surveys:

| SPACE Dimension | SPACEX Proxy Metric                                                                              | Derivation Source                                     |
| --------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Satisfaction    | Negative commit percentage                                                                       | Sentiment analysis on commit messages (RoBERTa model) |
| Performance     | CI/CD success rate, avg PR merge time                                                            | CI logs, PR data                                      |
| Activity        | Commit frequency, code churn                                                                     | Git log                                               |
| Communication   | Commit Interaction Frequency (CIF) — how often 2+ devs alternate commits on same file within 24h | Git log                                               |
| Efficiency      | Time between commits, daily churn consistency                                                    | Git log                                               |

**Composite Productivity Score (CPS)**:

```
CPS = (w1 × Z_satisfaction) + (w2 × Z_performance) + (w3 × Z_activity) +
      (w4 × Z_communication) + (w5 × Z_efficiency)
```

Where Z = z-score normalization and weights (w) are organization-configurable.
This formula enables quantitative repo-vs-repo comparison after z-score
normalization.

Sources: [3][11]

---

### 3. CMMI — Process Maturity Model, Not Direct Repo Comparison Tool [CONFIDENCE: HIGH]

CMMI (v3.0, 2023) defines 5 process maturity levels (Initial → Managed → Defined
→ Quantitatively Managed → Optimizing). It is an organizational process model,
not a repository metric framework. SCAMPI A/B appraisals are the formal
assessment mechanism. CMMI is relevant to repo analysis as a **context signal**
— a repo from a Level 4+ org will likely show different process indicators
(documentation, testing discipline, release cadence) than one from a Level 1 org
— but CMMI itself does not produce per-repo scores.

Sources: [6]

---

### 4. ISO 5055 — The Standard for Automated Code Quality Measurement [CONFIDENCE: HIGH]

ISO/IEC 5055:2021 is the international standard for automated source code
quality assessment across four dimensions:

1. **Security** — vulnerability patterns in code structure
2. **Reliability** — structural weakness patterns affecting failure risk
3. **Performance Efficiency** — structural patterns affecting runtime
   performance
4. **Maintainability** — structural patterns affecting change cost

ISO 5055 is language-independent and implemented by static analysis vendors. It
provides a **before-the-fact structural measurement** (not runtime behavior). It
is the foundation for compliance-grade "repo-vs-standard" comparison since
results are auditable, vendor-neutral, and internationally recognized.

In 2024, NIST presentations referenced ISO 5055 as the tool for measuring
software risk in acquisition and modernization contexts.

Sources: [7]

---

### 5. ISO 25010 (SQuaRE) — Quality Model for Weighting Dimensions [CONFIDENCE: HIGH]

ISO/IEC 25010:2023 defines the product quality model with 9 characteristics
(Functional Suitability, Reliability, Performance Efficiency, Compatibility,
Usability, Security, Maintainability, Flexibility, Safety). This is the
reference model underlying both SIG's 1-5 star benchmarking and Codacy's
grading. It does not define weights itself — weights are applied by implementing
frameworks (SIG, Codacy, etc.).

The SIG Maintainability model maps 8 system properties (Volume, Duplication,
Unit Size, Unit Complexity, Unit Interfacing, Module Coupling, Component
Entanglement, Component Independence) to the ISO 25010 Maintainability
characteristic, enabling **technology-independent cross-repo comparison**
certified by TÜViT.

Sources: [8][9]

---

### 6. SIG/Sigrid Benchmarking — Most Mature Repo-vs-Industry Comparison Methodology [CONFIDENCE: HIGH]

The Software Improvement Group (SIG) Sigrid platform provides the most developed
publicly documented approach to repo-vs-industry benchmarking:

- **Scale**: 1–5 stars; 3 stars = market average
- **Reference corpus**: 30,000+ industry systems across 300+ technologies,
  recalibrated annually
- **Distribution**: 35% score below 2.5 stars; 35% above 3.5 stars (intentional
  non-uniform distribution)
- **Business impact data**: 4-star systems have 2x lower maintenance costs and
  4x faster development speed versus 2-star systems
- **2024 update**: Model recalibrated to reflect current tooling and technology
  landscape
- **Normalization**: Technology-independent measurements; the benchmark set is
  stratified by technology so language bias is controlled at the reference
  corpus level rather than formula adjustment

This is the gold standard for "repo-vs-standard" comparison in the
maintainability dimension.

Sources: [9][12]

---

### 7. Industrial Code Quality Benchmarking with Segmented Percentiles [CONFIDENCE: HIGH]

A 2024 academic study on gamification of maintainability benchmarking provides a
replicable segmented percentile methodology:

**Segmentation dimensions** for fair comparison:

| Factor       | Categories                                                             |
| ------------ | ---------------------------------------------------------------------- |
| Industry     | Consumer/Hospitality; Professional Services/Education; Industrial/Tech |
| Project size | Small (≤20K SLoC), Medium (20K–80K SLoC), Large (>80K SLoC)            |
| Company size | Small (10–100 employees), Medium (100–350), Large (>350)               |
| Codebase age | Greenfield (≥2022), Brownfield (2018–2021), Legacy (<2018)             |
| Language     | Analyzed per top-8 languages individually                              |

**Leaderboard tiers** (percentile-based):

- Leaders: Top 10th percentile (score at or above 90th percentile threshold)
- Laggards: Bottom 10th percentile (score at or below 10th percentile)
- Example thresholds: Average CodeHealth laggard = 5.9/10; Hotspot CodeHealth
  laggard = 4.1/10

**Dual weighting approach**:

- Raw frequency analysis (each project = 1 vote)
- Size-weighted analysis (project weight proportional to SLoC)

Key insight: size-weighting shifts distributions leftward, revealing that large
projects systematically contain more hard-to-maintain code than raw project
counts suggest.

Sources: [13]

---

### 8. Normalization Approaches for Cross-Repo Comparison [CONFIDENCE: HIGH]

Three normalization strategies are established in the literature:

**A. LOC normalization (default)** The most common approach: divide metric value
by lines of code. PIQUE (Platform for Investigative software Quality
Understanding and Evaluation) uses this as default. Limitation: LOC is
language-dependent — 100 lines of Python is not equivalent to 100 lines of Java.

**B. Language-independent normalization**

- **Halstead complexity metrics** as a substitute for LOC when comparing across
  languages
- **Number of Modules (NOM)** as a language-independent size proxy
- **Functional Points (FP)** for business-logic-density normalization
- ISO 5055 is explicitly designed to be language-independent

**C. Contextual/segmentation approach (recommended for cross-project)** Rather
than applying a universal formula, segment repos into comparable groups (same
language, similar size, similar age, similar domain) and compute percentile
ranks within each segment. This is how SIG, the DORA benchmark, and the
industrial maintainability study all handle the comparison problem in practice.

**Age adjustment**: Normalize commit/activity metrics against repository age
(similar to CNCI — Category Normalized Citation Impact — used in research
bibliometrics). A repo that is 1 year old should not be penalized for lower star
count than a 10-year-old repo.

**Contributor adjustment**: Normalize activity volume metrics per active
contributor. A 2-person team making 100 commits/month is more productive than a
20-person team with the same volume.

Sources: [14][15][16]

---

### 9. Composite Stability Index (CSI) — Academically Validated Repo Comparison Formula [CONFIDENCE: HIGH]

From peer-reviewed empirical validation (August 2025), the CSI provides a
directly replicable formula:

**Four components** (all normalized to [0,1] via triangular function):

| Component                | Weight | Stability Threshold                             |
| ------------------------ | ------ | ----------------------------------------------- |
| Commit Frequency c(t)    | 0.30   | CV ≤ 0.5 (weekly aggregation recommended)       |
| Issue Resolution i(t)    | 0.25   | Resolution rate ≥ 0.30, avg closure ≤ 14 days   |
| PR Merging p(t)          | 0.25   | Merge rate ≥ 0.40, review time ≤ 5 days         |
| Activity Engagement a(t) | 0.20   | Activity ratio ≥ 0.25, active user ratio ≥ 0.15 |

**Formula**: CSI(t) = 0.30·φc + 0.25·φi + 0.25·φp + 0.20·φa

**Triangular normalizer**: Each metric maps to [0,1] with a target value (μk)
and tolerance (σk). Values within ±σk of the target produce maximum score;
deviation beyond tolerance band scores zero.

Weekly aggregation outperformed daily aggregation in empirical validation across
diverse OSS repos.

Sources: [17]

---

### 10. OpenSSF Scorecard — Security-Domain Repo-vs-Standard Comparison [CONFIDENCE: HIGH]

OpenSSF Scorecard provides 19 automated security checks (0–10 each), aggregated
into a weighted composite score by risk level:

| Risk Level | Checks | Examples                                                                                                                                  |
| ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Critical   | 1      | Dangerous-Workflow                                                                                                                        |
| High       | 8      | Binary-Artifacts, Branch-Protection, Code-Review, Maintained, Token-Permissions, Signed-Releases, Dependency-Update-Tool, Vulnerabilities |
| Medium     | 5      | Fuzzing, Pinned-Dependencies, SAST, SBOM, Security-Policy                                                                                 |
| Low        | 5      | CI-Tests, CII-Best-Practices, Contributors, License, Packaging                                                                            |

Branch-Protection uses a 5-tier progressive scoring model (3/6/8/9/10 points).
CII-Best-Practices uses badge-level scoring (Gold=10, Silver=7, Passing=5).

**Key limitation**: Scorecard is exclusively security-focused and does not
define what "good" looks like for non-security dimensions. It has no built-in
percentile comparison or industry baseline. It enables repo-vs-standard
comparison only for security practices.

Sources: [18]

---

### 11. CHAOSS Metrics — Community Health Framework (Starter Project Model) [CONFIDENCE: MEDIUM]

CHAOSS (Community Health Analytics for Open Source Software) provides
implementation-agnostic metrics across working groups:
Diversity/Equity/Inclusion, Evolution, Risk, Value, and Common Metrics.

The Starter Project Health model uses four metrics:

1. Time to First Response (target: ≤ 2 business days for PRs)
2. Change Request Closure Ratio (open vs. closed CRs in a time period)
3. Contributor Absence Factor (minimum people needed for 50% of contributions —
   bus factor)
4. Release Frequency

**Key limitation**: CHAOSS explicitly states "not every metric is appropriate
for every project" and warns against cross-project comparisons without context.
No scoring formula or weighted aggregate is provided — metrics are presented
individually. CHAOSS is better suited for within-project trend monitoring than
cross-repo comparison.

Software tools: GrimoireLab 2.0 (2025) and Augur for data collection and
visualization.

Sources: [19][20]

---

### 12. InnerSource Repository Activity Score — Practical Weighted Formula [CONFIDENCE: MEDIUM]

The InnerSource Commons pattern provides a concrete activity-based scoring
formula designed for ranking repos in internal portals:

**Score components**:

- Forks (5x multiplier)
- Watchers/subscribers (1x multiplier)
- Stars (÷ 3)
- Open issues (÷ 5)
- Recency multiplier (0–1, based on days since last update; 100 days = 0 boost)
- Commit frequency multiplier (0–1, based on weekly commits; 3–10+ per week)
- Logarithmic compression for scores > 3,000

**Bonuses**: +50 for meaningful description (≥ 30 chars); +100 for contribution
guidelines

This formula is intentionally biased toward currently active repos rather than
historically established ones, making it useful for discovery ranking but not
quality assessment.

Sources: [21]

---

### 13. Repo Comparison Tools That Exist [CONFIDENCE: HIGH]

| Tool                      | Type              | What It Compares                                                               | Normalization                                                 |
| ------------------------- | ----------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **OSSInsight**            | Free web platform | Stars, forks, PRs, issues, contributors, languages, LOC modified between repos | Raw counts + trend lines; no normalization formula            |
| **GitHubCompare.com**     | Free web tool     | Side-by-side GitHub metadata (stars, forks, issues, watchers)                  | None                                                          |
| **CodeScene**             | Commercial        | Code health (1–10) across repos and over time; hotspot comparison              | LoC-weighted average; industry segmentation for benchmarking  |
| **Sigrid (SIG)**          | Commercial        | Maintainability, security, architecture vs. 30K+ industry reference corpus     | Technology-independent measurement; corpus stratified by tech |
| **Codacy**                | Commercial        | Code quality grade (A–F) with industry baseline comparison                     | Weighted average of issues/complexity/duplication/coverage    |
| **OpenSSF Scorecard**     | Free CLI/API      | Security practices (0–10 per check)                                            | Risk-weighted aggregate; no industry percentile               |
| **Feedzai repo-analyzer** | Open source       | 14 metrics (coverage, bundle size, test commands, linter, CHANGELOG/README)    | No normalization; outputs to Elasticsearch/JSON               |
| **CHAOSS GrimoireLab**    | Open source       | Community health metrics                                                       | No unified score; individual metric trends                    |

**Sourcegraph** is a code intelligence platform (code search, batch changes) not
a repo comparison tool.

Sources: [22][23][24][25][26]

---

### 14. Weighting Dimensions for Overall Health Score — Fixed vs. Configurable [CONFIDENCE: HIGH]

**Three approaches** found in production systems:

**A. Fixed weights (research/standard-setting use)**

- CodeScene: LoC-weighted average across 25+ factors (weights not
  user-configurable)
- OpenSSF Scorecard: Fixed risk-tier weights (Critical > High > Medium > Low)
- PIQUE: Fixed edge weights set by domain expert at model design time
- CSI: Fixed weights [0.30, 0.25, 0.25, 0.20] validated empirically

**B. User-configurable weights (enterprise tooling)**

- Cortex Scorecards: Rules with optional group weightings configurable via UI or
  YAML
- LinkedIn multiproduct health model: Coefficients configurable per product via
  Gradle plugin; supports "Critical Health Metric" model (minimum of all
  metrics) as an alternative to weighted average
- Qualytics: Container/datastore-level weight settings; setting any weight to 0
  disables that dimension
- Docker Scout: Policy types carry varying weights impacting overall A–F grade

**C. ML-assigned weights (emerging approach)** PIQUE research (2024) shows that
semi-automated ML approaches to weight assignment outperform manual weighting by
learning weight profiles from benchmark documentation and relevant standards.
This is the research frontier.

**Recommendation pattern from production systems**: Provide sensible defaults
derived from domain research (e.g., security = high weight for public repos,
maintainability = high weight for enterprise) with user override capability. The
"Critical Health Metric" model (minimum score across all dimensions) is a useful
complement to the weighted average — it highlights any critical failure even if
overall score is high.

Sources: [27][28][29][30]

---

### 15. RSMM — Research Software Maturity Model for Repos [CONFIDENCE: MEDIUM]

RSMM v1.0 (2024) provides a maturity scoring framework applicable to research
software repos with four focus areas:

1. Software Project Management (19 practices)
2. Research Software Management (22 practices)
3. Community Engagement (16 practices)
4. Software Adoptability (22 practices)

Scores are per-focus-area (e.g., GGIR: 4-3-6-7; ESMValTool: 5-4-8-8 on a 0-10
scale). The framework uses MoSCoW prioritization for practices and explicitly
acknowledges that "not all software must follow the same practices." Best used
for research/academic repos; the "Software Adoptability" dimension directly
addresses portability/adoption difficulty scoring.

Sources: [31]

---

### 16. Technology Radar — Adoption Difficulty / Pattern Portability Framework [CONFIDENCE: MEDIUM]

The Thoughtworks Technology Radar model (Adopt/Trial/Assess/Hold) provides a
qualitative pattern for scoring how "portable" a detected practice or technology
is:

| Ring   | Meaning for Pattern Portability                                     |
| ------ | ------------------------------------------------------------------- |
| Adopt  | Mature, well-understood, low adoption risk — high portability       |
| Trial  | Proven in real-world scenarios but higher risk — medium portability |
| Assess | Under evaluation — unknown adoption difficulty                      |
| Hold   | Known limitations/risks — low portability or actively discouraged   |

Assessment criteria include: technology maturity vs. implementation complexity;
impact vs. urgency; and organizational knowledge vs. interest level. This
framework is directly applicable to the "what can we learn from this repo"
extraction use case — detected patterns in a source repo can be Radar-scored for
portability to a target context.

Sources: [32]

---

### 17. "What Can We Learn From This" Extraction Methodology [CONFIDENCE: MEDIUM]

No single established framework exists for systematic "lesson extraction" from a
source repo to a target context. The closest established approaches are:

**Mining Software Repositories (MSR)**: Systematic field with literature since
the early 2000s. Key steps:

1. Repository selection with explicit criteria
2. Data extraction (git log, issues, PRs, code)
3. Cross-linking data sources
4. Pattern identification and evidence-based conclusions

Documented limitation: MSR studies "typically do not follow a systematic
approach for repository selection" and "many do not report selection or data
extraction protocols."

**Pattern portability scoring (proposed composite)**: Based on Technology Radar
criteria + RSMM adoptability dimension + complexity analysis, a pattern
portability score should assess:

- Implementation complexity (cyclomatic complexity, coupling of the pattern)
- Documentation coverage (is the pattern explained?)
- Dependency footprint (how many external dependencies does adopting this
  pattern require?)
- Community adoption signal (is this pattern widely used or novel?)
- Effort-to-benefit ratio (technical debt reduction per adoption effort)

Sources: [33][34]

---

## Sources

| #   | URL                                                                                                                   | Title                                                                           | Type                      | Trust  | CRAAP Score | Date       |
| --- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------- | ------ | ----------- | ---------- |
| 1   | https://dora.dev/guides/dora-metrics/                                                                                 | DORA's Software Delivery Performance Metrics                                    | Official docs             | HIGH   | 4.8         | 2025       |
| 2   | https://octopus.com/devops/metrics/dora-metrics/                                                                      | Understanding DORA Metrics                                                      | Community/detailed        | HIGH   | 4.4         | 2024       |
| 3   | https://arxiv.org/html/2511.20955v1                                                                                   | SPACEX: Exploring Metrics with the SPACE Model                                  | Academic preprint         | HIGH   | 4.5         | Nov 2025   |
| 4   | https://octopus.com/blog/2024-devops-performance-clusters                                                             | 2024 DORA Performance Clusters                                                  | Community analysis        | MEDIUM | 4.0         | 2024       |
| 5   | https://redmonk.com/rstephens/2025/12/18/dora2025/                                                                    | DORA 2025: Measuring Software Delivery After AI                                 | Industry analyst          | HIGH   | 4.6         | Dec 2025   |
| 6   | https://cmmiinstitute.com/learning/appraisals/levels                                                                  | CMMI Levels of Capability and Performance                                       | Official docs             | HIGH   | 4.5         | 2024       |
| 7   | https://www.it-cisq.org/standards/code-quality-standards/                                                             | ISO 5055 Software Quality Standards                                             | Official standard body    | HIGH   | 4.8         | 2024       |
| 8   | https://www.iso.org/standard/78176.html                                                                               | ISO/IEC 25010:2023 Product Quality Model                                        | Official standard         | HIGH   | 5.0         | 2023       |
| 9   | https://www.softwareimprovementgroup.com/sigrid/code-quality-maintainability/                                         | SIG Code Quality and Maintainability                                            | Vendor official docs      | HIGH   | 4.5         | 2024       |
| 10  | https://queue.acm.org/detail.cfm?id=3454124                                                                           | The SPACE of Developer Productivity                                             | Academic (ACM Queue)      | HIGH   | 4.8         | 2021       |
| 11  | https://linearb.io/blog/space-framework                                                                               | SPACE Metrics Framework Explained (2025 Edition)                                | Community blog            | MEDIUM | 3.8         | 2025       |
| 12  | https://docs.sigrid-says.com/getting-started/approach.html                                                            | SIG Sigrid Approach to High Quality Software                                    | Official docs             | HIGH   | 4.5         | 2025       |
| 13  | https://arxiv.org/html/2412.06307                                                                                     | Industrial Code Quality Benchmarks: Toward Gamification of Maintainability      | Academic paper            | HIGH   | 4.7         | Dec 2024   |
| 14  | https://pmc.ncbi.nlm.nih.gov/articles/PMC11623205/                                                                    | A Generalized Approach to Operationalization of Software Quality Models (PIQUE) | Academic (PMC)            | HIGH   | 4.7         | Oct 2024   |
| 15  | https://link.springer.com/article/10.1007/s11219-023-09656-y                                                          | Alternatives to Size Metrics for Defect Prediction                              | Academic (Springer)       | HIGH   | 4.5         | 2023       |
| 16  | https://www.researchgate.net/publication/4356256_Normalization_approach_for_metric_based_software_quality_measurement | Normalization Approach for Metric-Based Quality Measurement                     | Academic                  | MEDIUM | 4.0         | Historical |
| 17  | https://arxiv.org/html/2508.01358                                                                                     | Empirical Validation of Open Source Repository Stability Metrics (CSI)          | Academic preprint         | HIGH   | 4.8         | Aug 2025   |
| 18  | https://github.com/ossf/scorecard/blob/main/docs/checks.md                                                            | OpenSSF Scorecard Checks Documentation                                          | Official docs             | HIGH   | 4.9         | 2025       |
| 19  | https://chaoss.community/kb/metrics-model-starter-project-health/                                                     | CHAOSS Starter Project Health Metrics Model                                     | Official docs             | HIGH   | 4.6         | 2025       |
| 20  | https://blog.okfn.org/2025/02/11/chaosscon-2025-key-takeaways-on-open-source-health-and-metrics/                      | CHAOSScon 2025 Key Takeaways                                                    | Community blog            | MEDIUM | 3.8         | Feb 2025   |
| 21  | https://patterns.innersourcecommons.org/p/repository-activity-score                                                   | Repository Activity Score Pattern                                               | Official InnerSource docs | HIGH   | 4.6         | 2024       |
| 22  | https://ossinsight.io/docs/about                                                                                      | About OSS Insight                                                               | Official docs             | HIGH   | 4.4         | 2025       |
| 23  | https://www.githubcompare.com/                                                                                        | GitHub Compare                                                                  | Tool site                 | MEDIUM | 3.5         | 2024       |
| 24  | https://codescene.com/product/code-health                                                                             | CodeScene Code Health                                                           | Vendor official           | HIGH   | 4.5         | 2025       |
| 25  | https://github.com/feedzai/repo-analyzer                                                                              | Feedzai repo-analyzer                                                           | Open source repo          | HIGH   | 4.3         | 2024       |
| 26  | https://openssf.org/projects/scorecard/                                                                               | OpenSSF Scorecard Project                                                       | Official docs             | HIGH   | 4.9         | 2025       |
| 27  | https://docs.cortex.io/standardize/scorecards                                                                         | Cortex Scorecards                                                               | Official docs             | HIGH   | 4.5         | 2025       |
| 28  | https://engineering.linkedin.com/blog/2017/10/health-score-metrics-as-a-software-craftsmanship-enabler                | LinkedIn Health Score Metrics                                                   | Engineering blog          | MEDIUM | 4.0         | 2017       |
| 29  | https://link.springer.com/article/10.1007/s10664-021-09984-2                                                          | Weighted Software Metrics Aggregation                                           | Academic (Springer)       | HIGH   | 4.5         | 2021       |
| 30  | https://www.osti.gov/pages/biblio/2527259                                                                             | PIQUE: Generalized Operationalization of Quality Models                         | Academic (OSTI)           | HIGH   | 4.7         | Oct 2024   |
| 31  | https://arxiv.org/html/2406.01788v1                                                                                   | RSMM: Framework to Assess Research Software Maturity                            | Academic preprint         | HIGH   | 4.4         | Jun 2024   |
| 32  | https://nealford.com/memeagora/2013/05/28/build_your_own_technology_radar.html                                        | Build Your Own Technology Radar                                                 | Practitioner blog         | MEDIUM | 3.8         | 2013/2024  |
| 33  | https://www.sciencedirect.com/article/abs/pii/S0950584921002317                                                       | Systematic Process for Mining Software Repositories                             | Academic (ScienceDirect)  | HIGH   | 4.5         | 2021       |
| 34  | https://www.faros.ai/blog/5th-dora-metric-rework-rate-track-it-now                                                    | 5th DORA Metric: Rework Rate                                                    | Industry blog             | MEDIUM | 3.8         | 2024       |

---

## Contradictions

**DORA tier model vs. archetype model**: The 2024 report uses four performance
tiers (elite/high/medium/low) with defined metric thresholds. The 2025 report
abandoned this in favor of seven archetypes. These are incompatible approaches —
a repo analyzed using 2024 thresholds produces a different classification than
2025 archetype analysis. For repo analysis tooling built in 2026, the 2025
archetype model is more nuanced but harder to operationalize as a single score.
The 2024 tier model is simpler to implement.

**DORA 2024 medium/high inversion**: The 2024 data shows medium performers (10%
change failure rate) outperforming high performers (20%). This is statistically
anomalous and the DORA team acknowledges it but does not explain it. Using these
thresholds for classification would misclassify repos.

**LOC normalization disagreement**: PIQUE uses LOC as the default normalizer;
the Springer research on defect prediction shows that "excluding size metrics
decreases model performance by only 1.99–0.66% AUC-ROC," suggesting size
normalization may matter less than expected. Industrial benchmarking studies use
both raw and size-weighted analysis and treat them as complementary lenses, not
contradictory approaches.

**Fixed vs. configurable weights**: No consensus exists on whether weights
should be fixed (research/ standardization view) or user-configurable
(enterprise tooling view). Academic frameworks tend to derive weights
empirically or from domain experts; enterprise tools tend to offer configuration
because different organizations have different priorities.

---

## Gaps

1. **No established methodology for "pattern portability scoring"**: The
   Technology Radar model provides qualitative rings but no quantitative formula
   for assessing how difficult it would be to adopt a pattern from Repo A into
   Repo B. This is an open design space for the repo-analysis skill.

2. **No public benchmark for "repo-vs-repo" across multiple quality dimensions
   simultaneously**: Existing tools (OSSInsight, GitHubCompare) compare raw
   counts only. CodeScene and Sigrid compare within their proprietary scoring
   systems but do not provide a vendor-neutral multi-dimensional comparison
   framework.

3. **DORA at repo level for OSS repos lacks comprehensive academic validation**:
   Only one identified study classifies individual OSS repos against DORA tiers;
   it had methodological limitations (single developer dominating
   contributions).

4. **SPACEX weights (w1–w5)**: The paper presents the CPS formula but treats
   weights as "organization- dependent" without empirical guidance for defaults.
   No published default weight set exists.

5. **Age-normalized activity benchmarks**: While the concept is established in
   bibliometrics (CNCI), no published software repo comparison framework
   implements age normalization with validated thresholds.

6. **Adoption difficulty / effort estimation**: RSMM's "Software Adoptability"
   dimension is the closest existing framework, but its 22 practices are
   primarily research-software-focused and do not include quantitative
   complexity or coupling analysis.

---

## Serendipity

**DORA 2025 archetype model signals a shift in the industry**: The move from
metric thresholds to team archetypes (seven types) reflects growing recognition
that single-number benchmarking is insufficient for capturing the holistic
reality of delivery performance. This has implications for any repo analysis
scoring system — an archetype classifier may be more useful than a composite
score.

**CodeScene publishes an empirical claim that it outperforms SonarQube 6x on
maintainability**: This is a vendor claim but references specific research. If
accurate, it suggests that the hotspot + code health combination (behavioral +
structural) is significantly more predictive than static rule violation counts
alone. This is relevant to choosing which dimensions to weight most heavily in a
health score.

**InnerSource Activity Score is intentionally biased toward recent repos**: The
logarithmic compression at

> 3,000 points and the 365-day decay model means the score is really a
> recency/momentum indicator, not a quality signal. This is a useful design
> pattern if the goal is "which repos deserve attention now" vs. "which repos
> are highest quality overall."

**SIG found a quantified business impact of quality**: Maintenance costs for
4-star repos are 2x lower than 2-star repos; development speed is up to 4x
faster. This kind of ROI calibration data is valuable for justifying why a repo
analysis skill should produce actionable scores rather than just observations.

---

## Recommended Comparison Framework

Based on the research, the following layered framework is recommended for the
repo-analysis skill:

### Layer 0: Segmentation (prerequisite to comparison)

Before scoring, classify the repo along:

- Primary language (controls LOC normalization baseline)
- Project type (library / application / framework / tooling / research software)
- Maturity tier (Greenfield <2 years, Established 2–7 years, Legacy >7 years)
- Team size proxy (solo/micro: ≤2 active contributors; small: 3–10; large: 10+)

Only compare repos within the same or adjacent segments for meaningful
benchmarking.

### Layer 1: Four-Dimension Structural Quality (repo-vs-standard)

Use ISO 5055 / ISO 25010 inspired dimensions with tool-derived scores:

| Dimension       | Primary Tool                            | Normalize By                  | Standard Reference                    |
| --------------- | --------------------------------------- | ----------------------------- | ------------------------------------- |
| Security        | OpenSSF Scorecard (0–10)                | None (binary practices)       | OSSF Scorecard ≥ 7.0 = strong         |
| Reliability     | Static analyzer / linter density        | Issues per 1K LOC             | Language-specific p50/p75/p90         |
| Maintainability | CodeScene health (1–10) or Codacy grade | LoC-weighted                  | SIG star table; CodeScene p10/p50/p90 |
| Activity/Health | CSI or CHAOSS-derived                   | Per contributor, age-adjusted | CSI > 0.5 = stable                    |

### Layer 2: Delivery Performance (DORA-adapted, optional if CI/CD data available)

Apply 2024 DORA tier thresholds for repos with deployment pipelines. Fall back
to proxy metrics (release cadence, PR merge rate, PR age) for repos without
formal CD.

### Layer 3: SPACE Productivity Proxy (optional, git-derived)

Use SPACEX artifact proxies for repos where contributor behavior data is
available: CPS with default equal weights (0.20 each) until project-specific
calibration is possible.

### Layer 4: Overall Composite Score with Configurable Weights

Default weight set (tunable):

- Structural Quality (averaged across 4 dimensions): 40%
- Community Health (CHAOSS 4-metric starter): 25%
- Security (OpenSSF Scorecard): 25%
- Activity/Delivery (DORA proxy or CSI): 10%

Support "Critical Health Metric" mode (minimum-score-wins) as an alternative for
risk-focused assessments.

### Layer 5: Pattern Portability Extraction

For each detected high-performing pattern in a source repo:

1. Assign a Technology Radar ring (Adopt/Trial/Assess/Hold) based on community
   adoption signal
2. Score implementation complexity (cyclomatic complexity of pattern entry
   points)
3. Score dependency footprint (number of external dependencies required)
4. Produce an Adoption Difficulty Index (ADI): high complexity + high dependency
   = hard to adopt

### Comparison Modes

- **Repo-vs-standard**: Score against SIG 1–5 star thresholds or OSSF Scorecard
  benchmarks
- **Repo-vs-repo**: Normalize all scores to 0–100 within same segment; show
  delta report
- **Repo-vs-industry**: Use segmented percentile tables from industrial
  benchmarking study (p10/p50/p90/p90 per language/size/age tier)

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 5
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The research landscape on this topic is mature, with multiple independently
published frameworks (DORA, SPACE/SPACEX, SIG, CSI, ISO 5055/25010, OpenSSF
Scorecard, PIQUE) that converge on similar dimensional structures while
differing on weighting and normalization choices. The recommended framework
synthesizes the most empirically validated elements of each.
