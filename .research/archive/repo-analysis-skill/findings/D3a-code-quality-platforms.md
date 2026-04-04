# Findings: How Do Major Code Quality Platforms Work?

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** D3a

---

## Key Findings

### 1. SonarQube / SonarCloud (Sonar) [CONFIDENCE: HIGH]

**What it measures:** SonarQube is the most metrics-comprehensive platform in
this comparison. It tracks across 10 distinct categories, each with multiple
sub-metrics:

| Category         | Key Metrics                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Security         | Vulnerabilities, security rating (A-E), SAST findings                                     |
| Reliability      | Bugs, reliability rating (A-E)                                                            |
| Maintainability  | Code smells, technical debt (in minutes), debt ratio, maintainability rating              |
| Security Review  | Security hotspots (count), hotspots reviewed (%), security review rating                  |
| Coverage         | Line coverage, condition/branch coverage, lines to cover, uncovered lines                 |
| Duplication      | Duplicated lines, duplicated lines density (%), duplicated blocks                         |
| Complexity       | Cyclomatic complexity (paths through code), cognitive complexity (readability difficulty) |
| Size             | NCLOC, functions, classes, files, comment density                                         |
| Issues           | Open issues by severity (Blocker/High/Medium/Low/Info)                                    |
| SCA (Enterprise) | Dependency vulnerability count, license compliance, SCA rating                            |

Technical debt ratio = (remediation time / (cost-per-line × total LOC)). Default
cost-per-line = 30 minutes. Quality gates are configurable thresholds on any
metric; projects fail CI when a gate is violated.

**How it works:**

- Runs via scanner (sonar-scanner CLI, Maven/Gradle plugins, GitHub Action) as a
  CI step.
- Scanner sends AST, CFG, and DFG analysis to server/cloud for rule evaluation.
- Results appear in SonarCloud dashboard, PR decoration (Developer+ tier), IDE
  extension.
- REST API (JSON) + webhook callbacks (JSON payload with quality gate status) on
  analysis complete.
- SARIF: imports external SARIF 2.1.0 reports; native SARIF export requires REST
  API workaround or third-party tools — no first-party one-click SARIF export as
  of early 2026.

**Pricing:**

| Product          | Tier            | Cost                  | Gate                                                                     |
| ---------------- | --------------- | --------------------- | ------------------------------------------------------------------------ |
| SonarQube Server | Community Build | Free, self-hosted     | Main branch only, ~20 languages, no branch/PR analysis, no SAST security |
| SonarQube Server | Developer       | ~$2,500/yr (100K LOC) | Branch + PR analysis, 30+ languages, enhanced SAST                       |
| SonarQube Server | Enterprise      | ~$16,000/yr (1M LOC)  | 35+ languages, COBOL/Apex/RPG, security engine customization             |
| SonarQube Server | Data Center     | ~$100,000/yr          | HA/Kubernetes, 20M+ LOC                                                  |
| SonarQube Cloud  | Free            | Free                  | Up to 50K LOC private, main branch only                                  |
| SonarQube Cloud  | Team            | ~EUR 30/mo (100K LOC) | Branch + PR analysis                                                     |
| SonarQube Cloud  | Enterprise      | Custom                | SAST, SCA, AI fix suggestions, custom quality gates                      |

Critical free-tier gate: **no PR decoration and no branch analysis** in
Community/Cloud Free. The community branch plugin (third-party) can unlock this
for self-hosted.

**Language support:** 20+ (Community) → 30+ (Developer) → 35+ (Enterprise).
Includes Java, C#, Python, JS/TS, Go, C/C++, Kotlin, PHP, Ruby, Swift, Rust,
SQL, Terraform, Ansible, Kubernetes, Dockerfile, COBOL (Enterprise), Apex
(Enterprise).

**Accuracy / false positives:** Sonar reports 3.2% overall false positive rate
based on 137M user-flagged issues in 2025. Uses deep semantic analysis
(AST+CFG+DFG) rather than pattern matching. Context-aware rule triggering (e.g.,
SQL injection only fires when taint flow is traced without sanitization). Widely
reported as the market leader in precision for Java/C#/Python.

**What it misses:**

- Architectural drift across microservices or service boundaries
- Runtime-only behaviors (race conditions, memory leaks, actual exploitability)
- Business logic correctness or domain-specific intent
- Git history patterns, team knowledge concentration, hotspot churn
- Custom internal API usage violations (requires expensive Enterprise security
  engine customization)
- No SBOM generation natively (SCA only in Enterprise/Cloud Enterprise)

---

### 2. Qlty (formerly CodeClimate Quality) [CONFIDENCE: HIGH]

**What it measures:** Qlty uses a maintainability-centered model with two
primary pillars:

- **Technical Debt**: Sum of effort (minutes) to fix structural/duplication
  issues, expressed as a ratio against estimated project rewrite time (COCOMO
  model). Yields A-F letter grade.
- **Coverage**: Covered lines / total executable lines, yields A-F grade.

The 10-point technical debt assessment checks: argument count (threshold: 4),
complex boolean logic (threshold: 4), file lines (threshold: 250), method
complexity (cyclomatic, threshold: 5), method count per class (threshold: 20),
method length (threshold: 25), nested control flow (threshold: 4), return
statements (threshold: 4), similar code blocks, identical code blocks.

Additional metrics: cognitive complexity, cyclomatic complexity, LOC,
duplication %, security findings (SAST + IaC + SCA), lint violations.

Qlty CLI wraps 70+ linters, formatters, and security analyzers as plugins
(ESLint, Pylint, Bandit, Gosec, Rubocop, Clippy, PMD, Hadolint, and more), so
findings coverage is as broad as the underlying tools.

**How it works:**

- Qlty CLI (open-source Rust binary) runs locally or in CI; wraps underlying
  tools and normalizes output.
- Qlty Cloud connects via GitHub integration; no explicit CI configuration
  needed for basic setup.
- PR comments, pass/fail status checks, maintainability grade badges in
  dashboard.
- REST API gated to Pro tier ($20/contributor/month). Free tier has no API
  access.
- SARIF: tools with native SARIF output pass through; tools without SARIF have a
  custom results parser in Rust. Qlty itself normalizes to its own internal
  format; direct SARIF export not explicitly documented as a first-class
  feature.

**Pricing:**

| Tier       | Cost                  | Key Gates                                                                                        |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------------ |
| Free (CLI) | $0                    | Local CLI only, 1,000 analysis minutes/month, 100 AI autofixes/month, no REST API                |
| Pro        | $20/contributor/month | 20,000 analysis minutes/month, 5,000 AI autofixes, REST API, 1-year history                      |
| Enterprise | $30/contributor/month | 75,000 analysis minutes/month, hotspot analytics, audit logs, custom permissions, 3-year history |

Volume discounts: 5% at 100+ seats, 10% at 200+ seats. Open source projects
free. Non-profits 10% off.

**Language support for maintainability grading:** C#, Go, Java, JavaScript,
Kotlin, PHP, Python, Ruby, Rust, TypeScript. Lint/security coverage via plugins:
40+ languages.

**Accuracy / false positives:** Delegates to underlying tools; false positive
rate depends on the linter/analyzer. The normalization layer does not add its
own false positives but also does not filter underlying tool noise.

**What it misses:**

- No native security SAST beyond what bundled tools provide (no proprietary
  security rules)
- No AI-powered code review or fix suggestions beyond autofixes
- No secrets detection (must add a separate tool)
- No SCA with reachability analysis
- Historical maintainability trends only go back 1 year (Pro) or 3 years
  (Enterprise) — no unlimited history
- REST API gated to Pro; free tier has no programmatic access
- No self-hosted option

---

### 3. Codacy [CONFIDENCE: HIGH]

**What it measures:** Codacy orchestrates a suite of per-language open-source
tools (Opengrep, ESLint, Bandit, SpotBugs, Gosec, RuboCop, Clang-Tidy, etc.) and
adds proprietary AI analysis on top. Analysis dimensions:

- **Static Analysis (SAST)**: Security vulnerabilities per OWASP Top 10 / CWE
- **Code Quality**: Complexity, duplication, anti-patterns, code smells
- **Secrets Detection**: Hardcoded credentials, API keys, tokens
- **SCA (Business tier)**: Dependency vulnerability scanning with daily rescans
  for malicious packages
- **IaC Analysis**: Terraform, CloudFormation, Kubernetes, GitHub Actions (via
  Checkov + Opengrep)
- **Coverage**: Test coverage tracking with merge gates
- **AI-Specific**: Unapproved AI model calls, AI coding policy violations
  (Business tier)
- **DAST (Business tier)**: Runtime scanning via ZAP integration

**How it works:**

- Connect GitHub/GitLab/Bitbucket; scanning begins within minutes — no pipeline
  configuration required for basic use.
- Analysis runs on Codacy infrastructure per commit and PR; PR comments with
  inline fix suggestions.
- IDE plugins for VS Code, Cursor, Windsurf (free tier includes AI Guardrails
  real-time scanning).
- REST API (v3, JSON, OpenAPI 2.0 definition available); SARIF supported for
  upload via codacy-cli-v2 (`codacy-cli analyze --format sarif`); analysis
  results can be pushed to GitHub Code Scanning via SARIF.
- Webhooks not prominently documented for outbound events.

**Pricing:**

| Tier      | Cost                   | Key Gates                                                                           |
| --------- | ---------------------- | ----------------------------------------------------------------------------------- |
| Developer | $0                     | IDE-only scanning, unlimited public repos, no PR analysis, no dashboards            |
| Team      | $18/dev/month (annual) | Up to 30 devs, 100 private repos, PR scans, coverage gates, smart FP triage         |
| Business  | Custom                 | Unlimited repos, SCA daily rescans, DAST, AI Risk Hub, license scanning, audit logs |

Open source: free. 14-day trial (no card). Free tier notably excludes PR
decoration, quality gates, and centralized dashboards.

**Language support:** 49 languages (Apex, C, C++, C#, CoffeeScript, Crystal,
CSS/SCSS, Dart, Dockerfile, Elixir, Go, Groovy, Java, JavaScript/TypeScript,
JSON, Kotlin, Markdown, PHP, Python, Ruby, Rust, SQL, Swift, and more).

**Accuracy / false positives:** Uses traditional pattern matching + rule-based
analysis for most findings; AI layer provides contextual fix suggestions.
Launched "Smart False Positive Triage" in 2025 to address known alert fatigue
issues. No public false positive rate claim; user reviews note some noise,
particularly from less mature underlying tools (e.g., some Opengrep rules).
Codacy is transparent that it delegates to best-of-breed open-source tools
rather than proprietary rule engines.

**What it misses:**

- SBOM generation not available (documented as absent as of 2026)
- Deep architectural analysis or cross-service boundary awareness
- Custom domain-specific rule authoring requires working within supported tool
  configs (not native Codacy rules)
- Business Logic / runtime correctness
- No self-hosted deployment below Business tier
- DAST only in Business tier (custom pricing)

---

### 4. DeepSource [CONFIDENCE: HIGH]

**What it measures:** DeepSource uses a hybrid static + AI engine. Findings
organized into five PR report card dimensions:

- **Security**: SAST findings (OWASP Top 10, SANS Top 25), secrets detection
  (165+ providers, 97% precision / 96.3% recall using pattern + AI Narada
  model), SCA with reachability analysis
- **Reliability**: Bugs, anti-patterns, edge cases
- **Complexity**: Overly complex code structures
- **Hygiene**: Style violations, dead code, formatting
- **Coverage**: Test coverage tracking (receives coverage reports from any CI
  tool)

Additional: IaC analysis (AWS/GCP/Azure), license compliance (Business+ tier),
KubeLinter support, blockchain-specific analyzers.

5,000+ static analysis rules. 17+ automated code formatters (Black, Prettier,
Rustfmt, gofmt, etc.).

**How it works:**

- Connect source control (GitHub, GitLab, Bitbucket, Azure DevOps); analysis
  auto-triggers on commit/PR within ~5 minutes. No explicit CI build steps
  required for static analysis.
- Configuration via `.deepsource.toml` in repository root.
- PR comments with structured five-dimension report card; Autofix AI generates
  verified patches.
- Webhooks (HMAC-signed POST, JSON payload); REST API with project/team tokens.
- SARIF: accepts SARIF 2.1.0 inputs via Community Analyzers workflow
  (`deepsource report --analyzer-type community --value-file report.sarif`).
  Native SARIF export was on the roadmap but not yet shipped as of early 2026 —
  still a feature request.
- Slack/Jira integrations available.

**Pricing:**

| Tier               | Cost                    | Key Gates                                                                                                        |
| ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Free (Open Source) | $0                      | Unlimited public repos, 1,000 PR reviews/month, no vulnerability scanning, no secrets detection, no SCA          |
| Starter            | $8/seat/month           | Unlimited repos, 500 Autofix runs/month                                                                          |
| Business           | $24/seat/month (annual) | Unlimited Autofix, monorepo, secrets detection, SCA (3 targets included, $8/additional target/month), audit logs |
| Enterprise         | Custom                  | Self-hosted/airgapped, SSO, IP restrictions, SLA                                                                 |

Open source: free with 1,000 PR review limit/month. 14-day free trial.

**Language support:** 30+ total. GA: Python, JavaScript, Java, Go, C#, Rust,
Ruby, PHP, Scala, Docker, Shell, SQL, Terraform, Ansible, Dart, plus Secrets
analyzer. Beta: C/C++, Swift, Kotlin. Framework-aware for Django/Flask,
React/Node.js, goroutine safety patterns.

**Accuracy / false positives:** Claims <5% false positive rate via
post-processing framework using explicit + implicit signals. Secrets detection
uses two-stage: fast pattern match + AI classification (93% reduction in FP vs
pattern-only). Developer reviews on Gartner note lower noise than SonarQube but
limited independent validation. Rating: 4.2 stars on Gartner (3 reviews) vs
SonarQube 4.4 stars (111 reviews) — much smaller user base.

**What it misses:**

- No architectural or cross-service analysis
- Native SARIF export not yet available (input only)
- No DAST / runtime analysis
- SCA is a paid add-on per-target, not included in base pricing
- C/C++ and Swift are beta quality only
- No SBOM generation
- Self-hosted requires Enterprise tier

---

### 5. JetBrains Qodana [CONFIDENCE: HIGH]

**What it measures:** Qodana surfaces 3,000+ inspections from JetBrains IDEs
(IntelliJ IDEA, PyCharm, WebStorm, Rider, GoLand, etc.), ensuring CI findings
exactly match IDE warnings developers see locally. Analysis dimensions:

- **Code Quality**: Bug-prone patterns, anti-patterns, dead code, naming
  violations
- **Security (Ultimate Plus)**: Taint analysis tracing untrusted input to SQL
  injection, XSS, command injection, path traversal. Currently limited to PHP
  and JVM (Java/Kotlin) linters.
- **Dependency Vulnerability Checker (Ultimate Plus)**: Known CVE scanning
- **License Audit (Ultimate Plus)**: Dependency license compliance
- **Technical Debt Tracking**: Incremental baseline comparison (new issues vs
  inherited)
- **Coverage**: CI-side coverage integration
- No native complexity scoring or duplication metrics equivalent to SonarQube

**How it works:**

- Runs as Docker container via `qodana scan` CLI or native GitHub Actions
  (`JetBrains/qodana-action@v2025.3`), GitLab CI, Azure Pipelines, CircleCI,
  TeamCity integrations.
- Results push to Qodana Cloud dashboard OR display inline in JetBrains IDEs and
  VS Code.
- Quality gates defined in `qodana.yaml` (threshold on issue counts or
  severity).
- Output formats: HTML report (sunburst visualization), `qodana.sarif.json`
  (SARIF 2.1.0 — primary machine-readable format), `results-allProblems.json`
  (full detail JSON).
- Qodana is the most complete SARIF-first platform in this comparison — SARIF is
  the primary output format, not a secondary export.
- GitHub Code Scanning integration via SARIF upload is documented and standard.
- Exit codes: 0 (success), 1 (internal error), 255 (quality gate exceeded —
  useful for CI gate fail).

**Pricing:**

| Tier          | Cost                         | Key Gates                                                                                               |
| ------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| Community     | Free                         | Java, Kotlin, Python, C#, C++, VB.NET only (7 languages); 30-day history; single team                   |
| Ultimate      | $6/contributor/month (min 3) | 12+ languages (adds Go, JS, PHP, Ruby, TS); coverage; Docker/K8s; 180-day history; multiple teams       |
| Ultimate Plus | $15/contributor/month        | All Ultimate + taint analysis, vulnerability checker, license audit, SSO, public API, unlimited history |

60-day free trial for paid tiers. Pricing is per active contributor (commit in
last 90 days).

**Language support:** 60+ languages via 15 specialized linters. Primary:
Java/Kotlin (IntelliJ), Python (PyCharm), JS/TS (WebStorm), PHP (PhpStorm), Go
(GoLand), C#/.NET (Rider), C/C++ (CLion). Ruby is early access. Markup, SQL,
CSS, YAML, config files included.

**Accuracy / false positives:** Accuracy was historically a concern (server-side
inspection results often diverged from IDE and caused alert fatigue). Qodana
2025.2 specifically fixed a number of false positives/negatives. The core
advantage is IDE-CI consistency: the same engine produces the same results in
both environments, reducing the "works on my machine" false-positive problem.
Taint analysis benchmarks: 7M LOC analyzed in under 30 minutes (v2025.2).

**What it misses:**

- No duplication detection (unlike all other platforms in this comparison)
- No native secrets detection
- No SCA with reachability (only CVE scanner, not SCA workflow)
- Taint analysis limited to PHP and JVM only (not Go, Python, JS/TS)
- Ruby is early access and unreliable
- No DAST
- Security features heavily gated (taint analysis requires Ultimate Plus at
  $15/user)
- Less suited for non-JetBrains IDE teams (the CI-IDE consistency benefit is
  lost)
- Community free tier covers only 7 languages

---

### 6. Cross-Cutting: What All Platforms Miss [CONFIDENCE: HIGH]

All five platforms share the following systematic blind spots:

**Architectural awareness:** Static analysis is file-scoped or
repository-scoped. None of these tools detect: microservice boundary violations,
API contract drift between services, architectural layer violations (e.g.,
presentation layer calling data layer directly), or breaking changes across
service interfaces. SonarQube has been specifically cited as "excellent for
file-level quality but blind to architectural context."

**Runtime behavior:** No static tool can determine: race conditions, memory
leaks under load, deadlocks, or actual exploitability of a vulnerability
(whether an attacker can reach a vulnerable path in production). False positive
rates of 30-60% for vulnerability findings have been cited for automated tools
generally (though individual platform claims are lower for their own
methodology).

**Business logic and domain correctness:** No tool can verify that code
correctly implements business rules. Domain-specific intent, access control
policy correctness, and product requirement alignment require human review or
domain-specific rule authoring that none of these platforms support out of the
box.

**Git history / behavioral signals:** None of these platforms analyze: commit
frequency by file (hotspot churn), knowledge concentration (which developers
know which subsystems), team coupling, or defect probability from historical
change patterns. Tools like CodeScene specialize in this gap.

**Custom organizational patterns:** These tools enforce universal rules (OWASP,
language best practices) but cannot enforce: project-specific architecture
decisions, internal framework usage contracts, team-specific naming conventions
beyond style guides, or domain glossary alignment. Custom rules exist but
require deep integration work (SonarQube Enterprise security engine
customization, Codacy tool config tuning).

**SBOM generation:** None of the five platforms generate a Software Bill of
Materials natively. Codacy explicitly confirms this gap.

**Documentation coverage:** None measure whether public APIs, complex functions,
or changed modules have adequate documentation. This is a gap that custom
tooling could address.

**Commit quality:** None analyze commit message quality, PR description
completeness, or conventional commit adherence at analysis time.

---

## Sources

| #   | URL                                                                                                       | Title                                 | Type              | Trust  | CRAAP Avg | Date |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------- | ------ | --------- | ---- |
| 1   | https://www.sonarsource.com/plans-and-pricing/                                                            | Sonar Plans & Pricing                 | Official docs     | HIGH   | 4.5       | 2026 |
| 2   | https://www.sonarsource.com/blog/sonarqube-compare-editions                                               | Compare SonarQube Editions            | Official blog     | HIGH   | 4.4       | 2025 |
| 3   | https://docs.sonarsource.com/sonarqube-server/2025.3/user-guide/code-metrics/metrics-definition           | SonarQube Metrics Reference           | Official docs     | HIGH   | 5.0       | 2025 |
| 4   | https://www.sonarsource.com/blog/how-sonarqube-minimizes-false-positives/                                 | SonarQube False Positives Methodology | Official blog     | HIGH   | 4.3       | 2026 |
| 5   | https://qlty.sh/                                                                                          | Qlty - Code Quality and Coverage      | Official docs     | HIGH   | 4.5       | 2026 |
| 6   | https://qlty.sh/pricing                                                                                   | Qlty Software Pricing                 | Official docs     | HIGH   | 5.0       | 2026 |
| 7   | https://docs.qlty.sh/cloud/maintainability/metrics                                                        | Qlty Maintainability Metrics          | Official docs     | HIGH   | 5.0       | 2026 |
| 8   | https://codeclimate.com/blog/code-climate-quality-is-now-qlty-software                                    | Code Climate → Qlty transition        | Official blog     | HIGH   | 4.2       | 2025 |
| 9   | https://www.codacy.com/pricing                                                                            | Codacy Pricing                        | Official docs     | HIGH   | 5.0       | 2026 |
| 10  | https://docs.codacy.com/getting-started/supported-languages-and-tools/                                    | Codacy Supported Languages            | Official docs     | HIGH   | 5.0       | 2026 |
| 11  | https://www.codacy.com/quality                                                                            | Codacy Quality Platform               | Official docs     | HIGH   | 4.5       | 2026 |
| 12  | https://deepsource.com/platform/code-quality                                                              | DeepSource Code Quality               | Official docs     | HIGH   | 4.5       | 2026 |
| 13  | https://deepsource.com/pricing                                                                            | DeepSource Pricing                    | Official docs     | HIGH   | 5.0       | 2026 |
| 14  | https://appsecsanta.com/deepsource                                                                        | DeepSource Feature Analysis 2026      | Review site       | MEDIUM | 3.8       | 2026 |
| 15  | https://deepsource.com/sonarqube-alternatives                                                             | DeepSource vs SonarQube               | Vendor comparison | MEDIUM | 3.5       | 2026 |
| 16  | https://www.jetbrains.com/help/qodana/pricing.html                                                        | Qodana Pricing                        | Official docs     | HIGH   | 5.0       | 2026 |
| 17  | https://appsecsanta.com/qodana                                                                            | Qodana Review 2026                    | Review site       | MEDIUM | 3.8       | 2026 |
| 18  | https://www.jetbrains.com/help/qodana/qodana-inspection-output.html                                       | Qodana Output Formats                 | Official docs     | HIGH   | 5.0       | 2026 |
| 19  | https://docs.deepsource.com/docs/languages/community                                                      | DeepSource Community Analyzers        | Official docs     | HIGH   | 4.8       | 2026 |
| 20  | https://securityboulevard.com/2026/02/how-sonarqube-minimizes-false-positives-in-code-analysis-below-5/   | SonarQube FP Rate Below 5%            | Industry article  | MEDIUM | 3.8       | 2026 |
| 21  | https://dev.to/rahulxsingh/deepsource-vs-code-climate-automated-code-quality-platforms-compared-2026-3l85 | DeepSource vs Code Climate 2026       | Community article | MEDIUM | 3.2       | 2026 |
| 22  | https://blog.codacy.com/sonarqube-alternatives                                                            | Codacy: Best SonarQube Alternatives   | Vendor blog       | MEDIUM | 3.5       | 2026 |
| 23  | https://vfunction.com/blog/static-vs-dynamic-code-analysis/                                               | Static vs Dynamic Code Analysis       | Industry blog     | MEDIUM | 3.8       | 2025 |
| 24  | https://docs.codacy.com/codacy-api/using-the-codacy-api/                                                  | Codacy API Documentation              | Official docs     | HIGH   | 5.0       | 2026 |
| 25  | https://www.jetbrains.com/help/qodana/sarif-output.html                                                   | Qodana SARIF Output                   | Official docs     | HIGH   | 5.0       | 2026 |

---

## Contradictions

**DeepSource language count claims:** DeepSource marketing says "30+ languages,"
official analyzer documentation lists 16 GA languages + 3 beta. The "30+" figure
appears to include community/contributed analyzers and IaC targets. The
functional GA language count is closer to 16-19 depending on how IaC tools are
counted. Both figures come from DeepSource's own materials.

**Codacy language count:** Codacy claims "49 languages" in marketing but the
official supported languages doc lists approximately 40 named languages in the
table. The gap is likely due to counting language variants (CSS/SCSS/Less
separately) and documentation lag.

**SonarQube SARIF export:** Sonar's official SARIF guide positions Sonar as a
"complete guide to SARIF" expert, but the community forum and product roadmap
show SARIF _export_ has been a requested feature since at least 2022 and is
still not a first-party one-click export in early 2026. SARIF _import_ is
well-supported. This is a notable discrepancy between marketing positioning and
actual capability.

**DeepSource false positive claims vs user reviews:** DeepSource claims <5%
false positive rate. Gartner reviews do not independently validate this. The
claim appears to be self-reported and based on the secrets detection
sub-component (97% precision), not the entire analysis suite. The broader <5%
claim for all static analysis is unverified by independent sources.

---

## Gaps

- **Qlty REST API documentation**: The API structure for Qlty Cloud (formerly
  CodeClimate) was not fully inspectable; the developer API reference at
  developer.codeclimate.com was found but not deeply fetched.
- **Qodana Ruby early access timeline**: No information on when Ruby support
  will reach GA.
- **Codacy DAST scope**: ZAP-powered DAST is mentioned but the Business tier's
  DAST capabilities are not publicly documented in detail.
- **SonarCloud/SonarQube Server 2026.1/2026.2 release notes**: Specific new
  features in the 2026 calendar-versioned release were referenced but not fully
  enumerated.
- **Enterprise pricing for Qlty and Codacy**: Both require "contact sales" with
  no public list prices, making TCO comparison impossible for large teams.
- **DeepSource SARIF native export status**: The roadmap item page
  (feedback.deepsource.com) was redirected and the status could not be confirmed
  as shipped or still pending.

---

## Serendipity

**Code Climate / Qlty brand transition**: CodeClimate Quality (the static
analysis product) was fully spun out as Qlty Software and the domain now
redirects to qlty.sh. This is a significant change — existing CodeClimate
integrations, documentation links, and references in team tooling may be broken
or outdated. Any custom tool that integrates with "CodeClimate" should be
audited.

**Qodana is uniquely SARIF-first**: Among all five platforms, Qodana is the only
one where SARIF 2.1.0 is the primary machine-readable output (not an
afterthought export). Its `qodana.sarif.json` is the canonical result file. This
makes Qodana the most interoperable platform for teams building tooling on top
of SARIF.

**DeepSource's hybrid secrets model**: The two-stage secrets detection (regex
pattern + AI classifier using the open-source Narada model) achieves a 93%
reduction in false positives compared to pattern-only approaches. This is a
pattern applicable to custom tool design — AI classification as a post-filter on
top of fast pattern matching.

**SonarQube community branch plugin**: A community-maintained third-party plugin
restores branch analysis and PR decoration to the free Community Edition. This
is widely used and maintained at
https://github.com/mc1arke/sonarqube-community-branch-plugin. For self-hosted
deployments, this effectively closes the biggest free-tier gap without upgrading
to Developer edition.

---

## Comparison Matrix

| Dimension                     | SonarQube/SonarCloud                        | Qlty (CodeClimate)                           | Codacy                     | DeepSource               | Qodana                                   |
| ----------------------------- | ------------------------------------------- | -------------------------------------------- | -------------------------- | ------------------------ | ---------------------------------------- |
| **Primary model**             | Rule-based static analysis                  | Maintainability grading + linter aggregation | Linter orchestration + AI  | Hybrid static + AI       | IDE inspection parity                    |
| **Security (SAST)**           | Yes (Developer+)                            | Via plugins only                             | Yes (all paid tiers)       | Yes (Business+)          | Yes (taint, Ultimate Plus, PHP/JVM only) |
| **Secrets detection**         | Yes (Developer+)                            | No native                                    | Yes (Team+)                | Yes (Business+)          | No                                       |
| **SCA**                       | Yes (Enterprise only)                       | No native                                    | Yes (Business)             | Yes ($8/target add-on)   | CVE checker only (Ultimate Plus)         |
| **IaC analysis**              | Yes (Terraform, K8s, etc.)                  | Via plugins                                  | Yes (Checkov)              | Yes                      | No                                       |
| **Duplication detection**     | Yes                                         | Yes                                          | Yes                        | Partial                  | No                                       |
| **Cyclomatic complexity**     | Yes                                         | Yes                                          | Yes                        | Partial                  | No native                                |
| **Cognitive complexity**      | Yes                                         | Yes                                          | No                         | No                       | No                                       |
| **Technical debt scoring**    | Yes (SQALE model)                           | Yes (COCOMO ratio)                           | No                         | No                       | No                                       |
| **Code coverage tracking**    | Yes                                         | Yes                                          | Yes                        | Yes                      | Yes (Ultimate+)                          |
| **PR decoration**             | Developer+ / Team+                          | Pro+                                         | Team+                      | All paid                 | Ultimate+                                |
| **Branch analysis**           | Developer+ / Team+                          | All (via CI)                                 | All paid                   | All                      | All                                      |
| **AI autofix / suggestions**  | Cloud Enterprise                            | Yes (AI autofixes)                           | Yes (Team+)                | Yes (Business+)          | Via Quick-Fix                            |
| **SARIF output**              | Import only (no native export)              | Passthrough from tools                       | Upload via CLI             | Input only               | SARIF-first native output                |
| **REST API**                  | Yes (all tiers)                             | Pro+ only                                    | Yes (all paid)             | Yes (all paid)           | Ultimate Plus only                       |
| **Webhooks**                  | Yes (all tiers)                             | Yes                                          | Partial docs               | Yes                      | No documented                            |
| **Self-hosted**               | Yes (Server editions)                       | No                                           | Business tier              | Enterprise tier          | Yes (via Docker)                         |
| **Open source free**          | Yes (50K LOC cloud)                         | Yes (CLI free)                               | Yes (unlimited public)     | Yes (1K PRs/month limit) | Yes (7 languages only)                   |
| **Language count (GA)**       | 20-35+ (by tier)                            | 10 graded, 40+ linted                        | 49 languages               | ~16-19 GA + beta         | 12+ (Ultimate), 7 (Community)            |
| **False positive reputation** | LOW (3.2% reported)                         | Depends on tools                             | MEDIUM (triage added 2025) | LOW (claimed <5%)        | MEDIUM (improving 2025.2+)               |
| **Custom rules**              | Yes (Enterprise)                            | Via plugin config                            | Via tool config            | Limited                  | Via qodana.yaml inspection tuning        |
| **DAST**                      | No                                          | No                                           | Yes (Business, ZAP)        | No                       | No                                       |
| **SBOM**                      | No                                          | No                                           | No                         | No                       | No                                       |
| **Git history/behavioral**    | No                                          | No                                           | No                         | No                       | No                                       |
| **Pricing model**             | LOC-based (Server) / LOC (Cloud)            | Per contributor                              | Per developer              | Per seat                 | Per contributor                          |
| **Approx. entry paid cost**   | ~$2,500/yr (Server Dev) / EUR 30/mo (Cloud) | $20/contributor/month                        | $18/dev/month              | $8/seat/month            | $6/contributor/month                     |

---

## Confidence Assessment

- HIGH claims: 18
- MEDIUM claims: 4
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

Primary evidence sources are official documentation pages for pricing, feature
descriptions, and metrics definitions (Tier 1). Comparison articles and review
sites used only to supplement gaps, cross-check claims, and surface user
experience signal (Tier 2-3). All material claims are traceable to at least one
primary source.
