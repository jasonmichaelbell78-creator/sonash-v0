# External Research Synthesis: Repo Analysis Skill

## Tools, Platforms, Methodology, Pipeline, Constraints, Intelligence, AI

**Synthesized from:** 15 findings files (D1a, D1b, D2a-1 through D2a-4, D2b,
D3a, D3b, D4, D5, D6, D7, D11, D12) **Synthesis date:** 2026-03-31 **Confidence
distribution:** HIGH: 127 claims, MEDIUM: 38 claims, LOW: 0, UNVERIFIED: 0

---

## 1. Executive Summary

This synthesis covers the external research on what a comprehensive GitHub repo
analysis skill should measure, how to measure it, and how to present findings.
Fifteen research files were read covering analysis dimensions, specific tools
across five category tiers, existing platform gaps, a proven 4-tier pipeline
architecture, output schema design, comparison frameworks, operational
constraints, strategic intelligence capabilities, and AI-assisted analysis
patterns.

The central finding is that no existing tool or platform covers all the
dimensions that matter. Commercial platforms (SonarQube, CodeScene, DeepSource)
each own deep vertical slices but leave systematic blind spots. Static analysis
platforms miss git behavioral signals. Behavioral analysis platforms miss
security posture. Security platforms miss community health. The opportunity for
a skill that composites across all these dimensions — using the GitHub API as
the primary access mechanism and a blobless partial clone as the secondary — is
real and well-supported by the evidence.

**Five high-confidence design mandates emerge from the research:**

1. The blobless partial clone (`git clone --filter=blob:none`) is the correct
   default clone strategy for analysis pipelines. It is 1.5-2x faster than full
   clone, supports all analysis except `git-sizer`, and can be deepened
   incrementally for history analysis without re-cloning.

2. A 4-tier pipeline (API pre-flight → blobless HEAD clone → conditional history
   clone → conditional full clone) is the correct architecture. Phase 0 API
   calls are free, parallel, and cover roughly 40% of all analysis dimensions
   without a single disk write.

3. The output schema must be triply compatible: SARIF 2.1.0-compatible for
   individual findings (enabling GitHub Code Scanning integration),
   TDMS-compatible JSONL for debt intake, and a custom `analysis.json` with a
   6-dimension radar score for human consumption.

4. Static tools should handle deterministic detection; LLMs should handle
   synthesis, explanation, and cross-file reasoning. Replacing static analysis
   with LLMs for detection is a known anti-pattern (23% category disagreement
   across identical runs; 12% false positive rate vs. 5% for static tools).

5. The most underserved gap across all current platforms is cross-dimension
   correlation: no single tool connects code churn + security posture +
   community health + dependency risk into a composited view with configurable
   weights. This is the primary differentiator opportunity.

---

## 2. Analysis Dimensions Catalog

### 2.1 Code-Facing Dimensions [D1a]

All 20 code-facing dimensions were cataloged with automation feasibility
ratings. Confidence: HIGH for all unless noted.

| #   | Dimension                                           | Signal Value | Automation | Tool Availability | Notes                                                                     |
| --- | --------------------------------------------------- | ------------ | ---------- | ----------------- | ------------------------------------------------------------------------- |
| 1   | Cyclomatic Complexity                               | 4/5          | 5/5        | 5/5               | Built into every major platform                                           |
| 2   | Cognitive Complexity                                | 5/5          | 4/5        | 3/5               | SonarSource canonical; ESLint port exists                                 |
| 3   | Code Duplication (clone detection)                  | 4/5          | 5/5        | 5/5               | jscpd, PMD CPD, SonarQube                                                 |
| 4   | Code Churn + Hotspot Overlay                        | 5/5          | 4/5        | 3/5               | Highest ROI refactoring signal; CodeScene gold standard                   |
| 5   | Temporal Coupling                                   | 5/5          | 3/5        | 3/5               | Surfaces hidden coupling invisible to static analysis                     |
| 6   | Dead Code / Unused Exports                          | 4/5          | 4/5        | 4/5               | Knip (JS/TS), Vulture (Python)                                            |
| 7   | Error Handling Quality                              | 5/5          | 4/5        | 3/5               | High defect correlation; no cross-language tool                           |
| 8   | Type Safety Coverage                                | 4/5          | 5/5        | 4/5               | type-coverage CLI; mypy/pyright                                           |
| 9   | Dependency Health (CVE + outdated + license)        | 5/5          | 5/5        | 5/5               | Best-in-class tooling; direct business risk                               |
| 10  | Code Size Metrics (LOC, function/file/class length) | 3/5          | 5/5        | 5/5               | First-pass filter; high false positive rate without context               |
| 11  | Coupling and Cohesion (LCOM, CBO, Instability)      | 5/5          | 4/5        | 3/5               | Language-specific tools; no universal solution                            |
| 12  | Depth of Inheritance (DIT)                          | 3/5          | 5/5        | 4/5               | OO-language specific; less relevant for functional patterns               |
| 13  | Halstead Complexity Metrics                         | 3/5          | 4/5        | 3/5               | Component of MI formula; less actionable standalone                       |
| 14  | Maintainability Index (MI)                          | 3/5          | 5/5        | 4/5               | Dashboard/trend use; can be gamed via comments                            |
| 15  | Naming Convention Consistency                       | 3/5          | 5/5        | 5/5               | Team discipline signal; linter rules universal                            |
| 16  | Test Coverage and Quality                           | 4/5          | 5/5        | 5/5               | Line coverage necessary but insufficient; mutation score is gold standard |
| 17  | Security Vulnerability Detection (SAST)             | 5/5          | 5/5        | 5/5               | Highest business risk category                                            |
| 18  | Code Smell Detection                                | 4/5          | 4/5        | 4/5               | Leading indicator of future defects                                       |
| 19  | Architecture Pattern Compliance                     | 5/5          | 3/5        | 3/5               | [CONFIDENCE: MEDIUM] Requires encoding rules first                        |
| 20  | Dependency Direction (Martin's Package Metrics)     | 4/5          | 4/5        | 3/5               | Ca/Ce/Instability/Abstractness                                            |

**Priority tier 1 (highest signal-to-effort):** Dimensions 1, 4, 9, 16, 17 — all
score 5/5 on signal value and 5/5 on automation.

**Priority tier 2 (high signal, moderate effort):** Dimensions 2, 5, 7, 11, 18,
19 — high signal but require more assembly or language-specific tools.

### 2.2 Project-Facing Dimensions [D1b]

These dimensions operate on git metadata, GitHub API data, and community signals
rather than source code content.

| #   | Dimension                                           | Signal Value | Automation | Notes                                                          |
| --- | --------------------------------------------------- | ------------ | ---------- | -------------------------------------------------------------- |
| 1   | Bus Factor / Contributor Absence Factor             | 5/5          | 5/5        | 65% of popular repos have factor ≤2                            |
| 2   | Commit Velocity and Recency                         | 5/5          | 5/5        | Primary alive/dead signal; ML can predict cessation            |
| 3   | PR Merge Time and Review Velocity                   | 5/5          | 4/5        | DORA Lead Time; proxy for maintainer load                      |
| 4   | Issue Response Time and Resolution                  | 5/5          | 4/5        | Median ≤14 days = healthy per empirical study                  |
| 5   | Organizational Contributor Diversity                | 4/5          | 3/5        | Email-to-org mapping requires heuristics                       |
| 6   | Code Review Coverage Rate                           | 5/5          | 4/5        | 13% of PRs merged without review industry-wide                 |
| 7   | Community Health Files (README, CONTRIBUTING, etc.) | 4/5          | 5/5        | GitHub Community Profile API is direct                         |
| 8   | API/Setup Documentation Completeness                | 4/5          | 2/5        | [CONFIDENCE: MEDIUM] Quality needs NLP/AI                      |
| 9   | Testing Maturity: Coverage + Type Distribution      | 4/5          | 4/5        | Detecting presence is 5/5; reading values harder               |
| 10  | Mutation Testing Score                              | 5/5          | 2/5        | Running is expensive; detecting whether project uses it is 4/5 |
| 11  | CI/CD Pipeline Maturity                             | 5/5          | 5/5        | Only ~10% of repos use CI at all; DORA canonical               |
| 12  | CI/CD Workflow Permission Hygiene                   | 5/5          | 5/5        | 86% of workflows have no token permission limits               |
| 13  | Secrets in History and Current Files                | 5/5          | 5/5        | TruffleHog scans full git history                              |
| 14  | .gitignore Completeness                             | 3/5          | 4/5        | [CONFIDENCE: MEDIUM] No dominant specialized tool              |
| 15  | License Presence, Validity, and Compatibility       | 4/5          | 4/5        | Without license = legally all rights reserved                  |
| 16  | Dependency Vulnerability and Freshness              | 5/5          | 5/5        | GitHub SBOM API + Dependabot alerts API                        |

**Note on radar axis mapping:** These 36 dimensions (20 code-facing + 16
project-facing) map to 6 radar axes as follows: Security (dimensions 1a-17,
1a-9, 1b-12, 1b-13), Reliability (1a-7, 1a-8, 1a-16), Maintainability (1a-1
through 1a-6, 1a-10 through 1a-15), Documentation (1b-7, 1b-8), Process (1b-11,
1b-12, 1b-3, 1b-6), Velocity (1b-1 through 1b-6).

---

## 3. Tool Landscape

### 3.1 Static Linters by Language [D2a-1]

**Recommended stack for the skill (confidence: HIGH):**

| Language       | Recommended Tool | Stars      | SARIF               | JSON                    | Clone Required                 |
| -------------- | ---------------- | ---------- | ------------------- | ----------------------- | ------------------------------ |
| JS/TS          | ESLint v9+       | 27.2k      | Plugin              | Built-in                | CLI: yes; `lintText()` API: no |
| Python         | Pylint + Ruff    | 5.7k / 29k | External            | Built-in                | Yes                            |
| Ruby           | RuboCop          | 12.8k      | External gem        | Built-in                | Yes                            |
| Rust           | Clippy           | 13k        | `clippy-sarif` pipe | `--message-format=json` | Yes                            |
| Go             | golangci-lint v2 | 18.7k      | Built-in            | Built-in                | Yes                            |
| PHP            | PHPStan          | 13.9k      | External            | Built-in                | Yes                            |
| Java           | Checkstyle       | 8.9k       | Built-in (native)   | XML default             | Yes                            |
| Swift          | SwiftLint        | 19.5k      | Built-in            | Built-in                | Yes (needs toolchain)          |
| Kotlin         | ktlint           | 6.7k       | Built-in            | Built-in                | Yes                            |
| Multi-language | MegaLinter v9    | 2.4k       | Built-in            | Built-in                | Docker mount                   |

**Key constraints:**

- ESLint's `lintText()` programmatic API is the only linter that can analyze
  code without a local clone — directly usable on content fetched via GitHub
  Contents API [D2a-1].
- golangci-lint v2 (released 2025-03-24) is a breaking change from v1; the
  `--out-format` flag was removed. Any tooling targeting Go must use v2's
  `--output.json.path` syntax [D2a-1].
- MegaLinter is AGPL-3.0 which creates license compliance risk in commercial
  tooling. super-linter (MIT, 10.4k stars) is more permissive if aggregation is
  the goal [D2a-1].
- Trivy (not a linter but commonly bundled) suffered a confirmed supply chain
  attack in March 2026 (CVE-2026-33634). Safe pin: `trivy-action@v0.35.0` (SHA:
  57a97c7). Rotate all secrets from pipelines that ran v0.69.4–v0.69.6 [D2b].

### 3.2 AST Parsing and Complexity Tools [D2a-2]

The analysis layer beneath linters — enabling structural queries, complexity
metrics, and duplication detection.

**Foundation layer:**

- **tree-sitter** (24.4k stars, MIT, v0.26.7 March 2026): The universal AST
  parser. 900+ community parsers covering virtually every language including
  niche DSLs. Used as the foundation by ast-grep, rust-code-analysis, Neovim, VS
  Code. Incremental, error-tolerant. This is the recommended AST substrate for
  the skill [D2a-2].
- **ts-morph** (6k stars, MIT): TypeScript/JS-only but uniquely type-aware.
  Resolves inferred types, finds all references across a project, detects dead
  exports. Use for TypeScript-specific deep analysis when a clone is available
  [D2a-2].
- **ast-grep** (13.2k stars, MIT, 0.42.0 March 2026): Rust-based structural
  search using tree-sitter. Pattern matching on AST nodes across 30 languages.
  `--json` output. Multi-core parallel. Recommended for pattern-based custom
  rule enforcement [D2a-2].

**Complexity measurement:**

- **lizard** (2.3k stars, MIT, 1.21.3 March 2026): Multi-language cyclomatic
  complexity across 26 languages including C/C++ without header resolution.
  `#lizard forgives` suppression. JSON/HTML/XML output. Most actively maintained
  complexity tool [D2a-2].
- **radon** (Python only, MIT): Cyclomatic complexity + Halstead +
  Maintainability Index in one tool. Last release March 2023 but 7,100+
  dependents; stable [D2a-2].
- **rust-code-analysis** (Mozilla, MPL-2.0): 15 metrics including Cognitive
  Complexity and WMC (class-level complexity sum). Notable for distinguishing CC
  from cognitive complexity. Based on tree-sitter [D2a-2].

**Duplication detection:**

- **jscpd** (5.5k stars, MIT): 150+ languages/formats, Rabin-Karp rolling hash.
  SARIF output. Implements MCP — queryable directly by AI assistants [D2a-2].
- **PMD CPD** (5.4k stars, BSD, 7.23.0 March 2026): 33+ languages,
  enterprise-grade. `--ignore-identifiers` for semantic clone detection. Exit
  code 4 = duplicates found (trivial CI gate) [D2a-2].

**Do not use:** plato (abandoned 2014), escomplex/complexity-report
(unmaintained), comby (last release 2022, uncertain maintenance) [D2a-2].

### 3.3 LOC, Churn, and Architecture Tools [D2a-3]

**LOC counting — recommended stack:**

- **scc** (8.2k stars, MIT, active): 322 languages, fastest tool, adds
  COCOMO/LOCOMO cost projection and cyclomatic complexity estimates per file.
  Unique: estimates LLM regeneration cost alongside traditional COCOMO. Only LOC
  tool with built-in complexity estimation. **Primary recommendation** [D2a-3].
- **tokei** (14.2k stars, MIT/Apache-2.0): Fast, 150+ languages, JSON/YAML/CBOR
  output. Use as secondary validator [D2a-3].
- **cloc** (22.8k stars, GPL v2): Can analyze git commits and diff two versions
  — useful for change analysis [D2a-3].

**Code churn / hotspot:**

- **git-quick-stats** (7k stars, MIT, updated Sep 2025): Shell-based,
  non-interactive mode available, CSV/JSON export. Good for commit velocity and
  heatmap analysis [D2a-3].
- **git-fame** (808 stars, MPL-2.0): Author LOC/commit/file attribution,
  JSON/CSV output. Web interface for public repos available [D2a-3].
- **CodeScene** (commercial): Gold standard for hotspot analysis. Academic
  foundation from Adam Tornhill ("Your Code as a Crime Scene"). API available.
  €18/author/month Standard [D2a-3].

**Architecture / dependency visualization:**

- **dependency-cruiser** (6.5k stars, MIT, v17.3.10 March 2026): JS/TS
  dependency rules, circular detection, orphan detection. DOT/HTML/JSON/Mermaid
  output. Very actively maintained [D2a-3].
- **Knip** (10.8k stars, ISC, v6.1.1 March 2026): Dead code detection for JS/TS.
  Finds unused files, exports, types, devDependencies. MCP server available.
  Used by Adobe, AWS, Google, Microsoft, Shopify [D2a-3].
- **Vulture** (4.4k stars, MIT, v2.16 March 2026): Python dead code with
  confidence percentages (60-100%). Very actively maintained [D2a-3].

**Do not use for dead code:** ts-prune (ARCHIVED Sep 2025), unimported (ARCHIVED
Mar 2024) — both replaced by Knip [D2a-3].

### 3.4 GitHub API and Remote Analysis Capabilities [D2a-4]

The GitHub API enables substantial analysis without any clone. This is the most
underutilized capability in current tooling.

**Remote-only, no clone required (confidence: HIGH):**

| Capability                                                 | Endpoint                                       | Auth                  |
| ---------------------------------------------------------- | ---------------------------------------------- | --------------------- |
| Repo metadata (stars, forks, language bytes, size, topics) | REST `/repos/{owner}/{repo}`                   | None (public)         |
| Language distribution                                      | REST `/repos/{owner}/{repo}/languages`         | None                  |
| Contributor list + commit counts                           | REST `/repos/{owner}/{repo}/contributors`      | None                  |
| Community health score (0-100)                             | REST `/repos/{owner}/{repo}/community/profile` | None                  |
| Last-year commit activity (weekly)                         | REST `stats/commit_activity`                   | None                  |
| Commit time-of-day heatmap                                 | REST `stats/punch_card`                        | None                  |
| Full SBOM (SPDX JSON)                                      | REST `/dependency-graph/sbom`                  | Read access           |
| Dependabot vulnerability alerts                            | REST `/dependabot/alerts`                      | security_events scope |
| Code scanning alerts                                       | REST `/code-scanning/alerts`                   | security_events scope |
| Secret scanning alerts                                     | REST `/secret-scanning/alerts`                 | Admin access          |
| Branch protection rules                                    | GraphQL `branchProtectionRules`                | Token                 |
| Security feature flags                                     | GraphQL `securityAndAnalysis`                  | Token                 |
| 58-field repo summary                                      | `gh repo view --json`                          | Token recommended     |
| Pre-computed security scorecard                            | `https://api.securityscorecards.dev`           | None                  |
| Package vulnerability metadata                             | `https://api.deps.dev`                         | None                  |

**Critical API limitations to design around [D2a-4, D7]:**

- `stats/code_frequency` and `stats/contributors` return 422 or silent zeros for
  repos with ≥10,000 commits
- Contents API truncates at 1,000 files per directory; use Git Trees API for
  full enumeration
- Git Trees API caps at 100,000 entries (7 MB); check `truncated: true` in
  response
- The `size` field in REST API is unreliable and excludes LFS — treat as
  order-of-magnitude hint only
- GitHub Linguist language detection fails for repos with >100,000 files — fall
  back to local scc
- Traffic endpoints return last 14 days only; no historical retention via API
- Code scanning CodeQL databases are queryable via
  `GET /code-scanning/codeql/databases/{language}` — enables checking CodeQL
  analysis status without cloning [D2a-4]
- The OpenSSF Scorecard API at `api.securityscorecards.dev` has pre-computed
  weekly scores for 1M+ repos — often no local run needed at all [D2a-4, D2b,
  D3b]

**Authentication recommendation:** GitHub App installation tokens for production
tools. They expire in 1 hour (not 8 hours — a common confusion; 8 hours is for
user access tokens) and scale the rate limit up to 12,500 req/hr (15,000 on
Enterprise Cloud). Implement refresh logic [D7].

### 3.5 Security and Supply Chain Tools [D2b]

**Vulnerability scanning (SCA):**

- **Grype** (Anchore, Apache 2.0, free): Integrates EPSS exploit probability +
  CVSS + CISA KEV into a composite risk score. Scans container images from
  remote registries without local clone. SARIF output. Recommended primary SCA
  tool [D2b].
- **OSV-Scanner** (Google, Apache 2.0, v2.0 March 2025): Guided remediation,
  layer-aware container scanning, 19+ lockfile types. Fully free [D2b].
- **OpenSSF Scorecard** (Apache 2.0, free): 19 automated checks (0-10 each) for
  supply chain security posture. Many checks work via API only, no clone needed.
  Pre-computed for 1M+ repos at `api.securityscorecards.dev` [D2b, D3b].
- **Socket.dev** (free GitHub App tier): Detects zero-day supply chain attacks
  before CVEs are assigned by analyzing what packages do at install time. 70+
  signals including install scripts, obfuscated code, typosquatting [D2b, D3b].
- **deps.dev** (Google, Apache 2.0, free API): 50M+ package versions across
  npm/Go/Maven/PyPI/Cargo/NuGet/RubyGems. Returns licenses, advisories,
  dependency graphs. Zero auth required [D2b, D4].

**Secrets detection:**

- **TruffleHog** (AGPL-3.0, free): 800+ secret types, actively verifies
  credentials against live APIs (only reports still-active secrets). Can scan
  remote repos directly without cloning:
  `trufflehog git https://github.com/owner/repo` [D2b].
- **Gitleaks** (MIT, free): 150+ types, fast regex-based. v8.28.0+ includes
  composite rules. SARIF output. Recommended as pre-commit hook; TruffleHog as
  CI verification layer [D2b].
- **GitHub Native Secret Scanning** (free for public repos): 200+ partner
  patterns + AI-powered generic password detection. March 2026 batch added 28
  new detectors [D2b].

**SAST:**

- **Semgrep Community Edition** (LGPL 2.1 engine, free tier): 3,000+ rules, 30+
  languages including Terraform/Dockerfile. 10-second typical scan. Important:
  Semgrep-maintained rules switched to a restricted license in 2024 — community
  (user-contributed) rules remain open [D2b].
- **CodeQL** (free for public repos): True data-flow/taint analysis catching
  vulnerabilities that pattern matchers miss. Slower (minutes to 30+ min for
  large repos). GitHub-native integration [D2b].

**Dependency update automation:**

- **Renovate** (AGPL-3.0, free Mend-hosted): 90+ package managers, automerge,
  shared presets, multi-platform. Preferred over Dependabot for multi-platform
  or monorepo setups [D2b].
- **Dependabot** (free for all GitHub repos): Zero-config via
  `.github/dependabot.yml`, 30+ ecosystems, GitHub-native [D2b].

**TRIVY WARNING:** As of March 19, 2026, Trivy suffered a confirmed supply chain
attack. Safe versions: v0.69.3 and earlier. Safe action pin:
`trivy-action@v0.35.0` (SHA: 57a97c7). If any pipeline ran v0.69.4–v0.69.6,
rotate all secrets immediately [D2b].

---

## 4. Platform Gaps

### 4.1 Commercial Code Quality Platforms — What They Cover [D3a]

| Platform                    | Unique Strength                                                                     | Key Gap                                                                       | SARIF            | API           |
| --------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------- | ------------- |
| SonarQube / SonarCloud      | Market leader; 3.2% false positive rate; 10 dimensions; cognitive complexity        | No SARIF export (import only); no git behavioral signals; SCA enterprise only | Import only      | All tiers     |
| Qlty (formerly CodeClimate) | COCOMO-based technical debt ratio; linter aggregation (70+ tools)                   | REST API gated to Pro ($20/contributor/mo); no native secrets detection       | Tool passthrough | Pro+ only     |
| Codacy                      | 49 languages; DAST (Business); IaC analysis; smart FP triage (2025)                 | No SBOM; no self-hosted below Business tier                                   | CLI upload       | Paid tiers    |
| DeepSource                  | Hybrid static+AI; 5-dimension PR report card; EPSS-weighted secrets (97% precision) | No SARIF export (input only); SCA is paid add-on per-target                   | Input only       | Paid tiers    |
| Qodana (JetBrains)          | SARIF-first (primary output); IDE-CI result consistency; 60+ languages              | No duplication detection; no secrets detection; security gated to $15/user    | Native           | Ultimate Plus |

**Universal blind spots across all five platforms [D3a]:** None generate SBOM,
none analyze git behavioral signals (churn, temporal coupling, knowledge
concentration), none detect documentation coverage, none analyze commit quality,
none enforce custom domain-specific rules without deep integration work.

### 4.2 Specialized Platforms — What They Cover [D3b]

| Platform             | Unique Dimension                                         | Deployment         | Free Tier                    | API         |
| -------------------- | -------------------------------------------------------- | ------------------ | ---------------------------- | ----------- |
| GitClear             | Durable code change (Diff Delta); AI code quality impact | SaaS only          | 3 repos, 6-month window      | Pro+        |
| OpenSSF Scorecard    | Supply chain security posture (20 checks)                | CLI + API          | Fully free                   | Public REST |
| Socket.dev           | Dependency behavior risk (zero-day supply chain)         | SaaS + CLI         | OSS free, 1K scans           | Business+   |
| CodeScene            | Behavioral hotspot + organizational health               | SaaS + on-prem     | OSS free                     | All tiers   |
| GrimoireLab / CHAOSS | Cross-source community analytics (40+ sources)           | Self-hosted / SaaS | GPL free                     | Python API  |
| Sourcegraph          | Cross-repo code search/intelligence                      | SaaS (enterprise)  | None (discontinued Jul 2025) | GraphQL     |

### 4.3 The Gap Map — What No Platform Covers [D3b]

This is the primary differentiator space for a custom skill:

1. **Cross-dimension correlation**: No platform connects churn + security +
   community health + dependency risk in a single composited view.
2. **Runtime correlation**: No platform (except nascent Hud.io, Dec 2025)
   correlates production behavior (errors, latency) with static code properties.
3. **AI code identification and risk differentiation**: No platform reliably
   detects AI-generated lines and adjusts quality/security scores accordingly.
4. **Team topology visibility**: No platform maps Conway's Law dynamics — which
   teams own which subsystems and whether team boundaries align with
   architectural boundaries.
5. **Tech debt ROI in business terms**: Every platform measures debt or
   complexity; none connect it to actual business outcomes (cycle time, incident
   rate, revenue risk).
6. **Composite health scoring with user-defined weights**: No platform lets you
   define a custom health model with configurable dimension weights.
7. **Trend-based early warning**: Platforms provide point-in-time scores or
   historical charts; none surface trend-based anomalies proactively.
8. **Private repo industry benchmarking**: No platform provides percentile
   comparison of your repo's health against anonymized industry peers at the
   same size/stack/age tier.
9. **Pre-commit multi-dimensional awareness**: All platforms operate
   post-commit; no tool says "this change affects a high-churn, low-coverage
   hotspot with 2 inactive contributors."
10. **Monorepo sub-package independence**: No platform treats monorepo
    sub-packages as distinct health units rather than one blob.

---

## 5. Pipeline Architecture

### 5.1 The 4-Tier Hybrid Model [D4]

The optimal architecture is a tiered pipeline where each tier is only invoked
when necessary. All research supports this structure; it is grounded in GitHub's
own data-driven git clone study [D4].

**PHASE 0 — API Pre-Flight (always runs, ~2-5 seconds, no disk I/O):**

- GitHub REST API: repo metadata, language bytes, topics, stars, license, branch
  protection
- OpenSSF Scorecard API: 20 security checks (0-10 each), pre-computed for 1M+
  repos
- deps.dev API: license + vulnerability summary for primary package ecosystem
- All three run in parallel. Check cache: if HEAD SHA matches stored result,
  return cache.

**PHASE 1 — Clone (sequential gate):**

- Default: `git clone --filter=blob:none --depth=1 <repo>`
- Binary-heavy / LFS repos:
  `GIT_LFS_SKIP_SMUDGE=1 git clone --filter=blob:none --no-checkout`
- Estimated: 2-30 seconds depending on repo size

**PHASE 2 — Static Analysis (parallel, all operate on cloned file tree):**

- scc --format=json for LOC/language confirmation/complexity estimates
- Manifest parser: package.json, go.mod, Cargo.toml, requirements.txt
- Framework detector: heuristic stack identification (see §5.2)
- Monorepo detector: check for turbo.json, nx.json, pnpm-workspace.yaml, etc.
- Security files check: SECURITY.md, CODEOWNERS, .github/FUNDING.yml
- CI/CD config detection: .github/workflows, .circleci, Jenkinsfile

**PHASE 3 — History Analysis (conditional; only if churn/evolution requested):**

- Deepen clone: `git fetch --filter=blob:none --shallow-since="1 year ago"`
- Churn per file: `git log --reverse --numstat --since="1 year ago"`
- Commit frequency: `git log --format="%ai" --since="1 year ago"`
- Active contributors:
  `git log --format="%ae" --since="1 year ago" | sort -u | wc -l`
- Research-validated: 12 months of history is sufficient for hotspot/churn
  analysis [D4]

**PHASE 4 — Full Clone (exceptional; only when specifically required):**

- Trigger conditions: git-sizer audit requested, binary artifact anomaly,
  repo >1GB
- `git clone` (no filters)
- `git-sizer --json` for 20+ size metrics
- Requires non-shallow full clone — cannot use with git-sizer

**PHASE 5 — Synthesis:**

- Merge results from all phases
- Compute composite scores
- Cache results (key: `{repo_full_name}:{HEAD_SHA}`)

### 5.2 Framework Detection Heuristics [D4]

Detection hierarchy: config file presence > dependency name alone.

| Framework        | Primary Detection Signal                         |
| ---------------- | ------------------------------------------------ |
| Next.js          | `next` in deps + `next.config.js/ts`             |
| React (CRA)      | `react-scripts` in deps, no framework config     |
| Vite React       | `@vitejs/plugin-react` in devDeps                |
| Angular          | `@angular/core` + `angular.json`                 |
| Vue              | `vue` dep + optional `vue.config.js`             |
| Svelte           | `svelte` dep + `svelte.config.js`                |
| Django           | `django` in requirements.txt / pyproject.toml    |
| Flask            | `flask` in requirements.txt                      |
| FastAPI          | `fastapi` in requirements.txt                    |
| Express/Node API | `express` in package.json, no frontend framework |
| Go service       | `go.mod` present, no frontend frameworks         |
| Rust service     | `Cargo.toml`, lib or binary crate                |

### 5.3 Monorepo Detection and Sub-Package Analysis [D4, D7]

Detection via root-level file presence check (1 API call):

| File                             | Monorepo Tool   |
| -------------------------------- | --------------- |
| `turbo.json`                     | Turborepo       |
| `nx.json`                        | Nx              |
| `lerna.json`                     | Lerna v6+       |
| `pnpm-workspace.yaml`            | pnpm workspaces |
| `package.json#workspaces`        | npm/Yarn/Bun    |
| `rush.json`                      | Rush            |
| `.moon/workspace.yml`            | Moon            |
| `WORKSPACE` or `WORKSPACE.bazel` | Bazel           |
| `Cargo.toml` with `[workspace]`  | Rust/Cargo      |

For sub-package analysis, use sparse-checkout:
`git sparse-checkout set <subdir>` to analyze one sub-package in a 30GB repo in
under 2 minutes vs. hours for full clone [D4].

---

## 6. Output Design

### 6.1 The 3-Artifact Schema [D5]

The output must be simultaneously compatible with three consumers: human
readers, TDMS intake, and deep-plan injection.

**Artifact 1: `analysis.json` (Machine primary)**

```json
{
  "$schema": "repo-analysis/v1",
  "meta": {
    "analysis_id": "uuid-v4",
    "timestamp": "ISO8601",
    "target_repo": "github.com/org/repo",
    "target_commit": "sha",
    "language": "TypeScript",
    "loc": 42000
  },
  "summary": {
    "overall_score": 74,
    "band": "Healthy",
    "trend": "improving",
    "delta_from_previous": 6,
    "one_sentence": "Well-structured codebase with strong CI, weak security posture.",
    "top_priority_action": "Add rate limiting to Cloud Functions endpoints (3 unprotected)"
  },
  "dimensions": {
    "security": { "score": 52, "band": "Needs Work", "delta": -4 },
    "reliability": { "score": 78, "band": "Healthy", "delta": 2 },
    "maintainability": { "score": 81, "band": "Excellent", "delta": 5 },
    "documentation": { "score": 66, "band": "Healthy", "delta": 0 },
    "process": { "score": 88, "band": "Excellent", "delta": 8 },
    "velocity": { "score": 71, "band": "Healthy", "delta": -1 }
  },
  "radar": {
    "axes": [
      "security",
      "reliability",
      "maintainability",
      "documentation",
      "process",
      "velocity"
    ],
    "scores": [52, 78, 81, 66, 88, 71],
    "scale": "0-100"
  },
  "actionable_insights": {
    "top_to_steal": [
      {
        "rank": 1,
        "pattern": "...",
        "why_it_works": "...",
        "how_to_adopt": "...",
        "evidence_files": [],
        "transferability_score": 95
      }
    ],
    "top_to_avoid": [
      {
        "rank": 1,
        "pattern": "...",
        "why_it_fails": "...",
        "what_to_do_instead": "...",
        "evidence_files": [],
        "severity": "S0"
      }
    ]
  }
}
```

**Artifact 2: `findings.jsonl` (TDMS-compatible, one finding per line)**

Each record must include all fields from the project's
`JSONL_SCHEMA_STANDARD.md`:

```json
{
  "title": "string", "severity": "S0|S1|S2|S3",
  "category": "security|performance|code-quality|refactoring|documentation|process",
  "file": "path/to/file", "line": 42,
  "description": "string", "recommendation": "string",
  "source": "repo-analysis-<repo-slug>-<date>",
  "fingerprint": "<category>::<file>::<identifier>",
  "effort": "E0|E1|E2|E3", "confidence": 0-100,
  "files": [], "why_it_matters": "string", "suggested_fix": "string",
  "acceptance_tests": [], "evidence": []
}
```

The SARIF `rank` field (0-100) maps directly to the TDMS `confidence` field — an
underused connection that improves prioritization [D5].

**Artifact 3: `trends.jsonl` (append-only, one record per analysis run)**

```json
{
  "analysis_id": "uuid",
  "timestamp": "ISO8601",
  "repo": "github.com/org/repo",
  "commit": "sha",
  "overall_score": 74,
  "dimensions": {
    "security": 52,
    "reliability": 78,
    "maintainability": 81,
    "documentation": 66,
    "process": 88,
    "velocity": 71
  },
  "findings_total": 84,
  "findings_by_severity": { "S0": 2, "S1": 8, "S2": 35, "S3": 39 },
  "new_findings": 6,
  "resolved_findings": 12,
  "delta_overall": 6,
  "regression_flags": []
}
```

**Artifact 4: `summary.md` (Deep-plan injectable, Layer 1+2)**

Structured Markdown following the `## Research Context: Repo Analysis` section
header pattern that deep-plan's DIAGNOSIS.md injection expects.

### 6.2 Scoring Band Design [D5]

**Recommended hybrid approach** (numeric score + descriptive label):

| Score  | Band       | Color  | Interpretation                           |
| ------ | ---------- | ------ | ---------------------------------------- |
| 0-39   | Critical   | Red    | Immediate action required                |
| 40-59  | Needs Work | Orange | Significant gaps present                 |
| 60-79  | Healthy    | Yellow | Acceptable; targeted improvements needed |
| 80-100 | Excellent  | Green  | Strong across dimension                  |

Primary display: `74/100 — Healthy (+6 improving)`. Avoids pure letter grades
(A-F ambiguous — is "C" acceptable or failing?) [D5].

### 6.3 Progressive Disclosure [D5]

Three layers following Nielsen Norman Group research:

- **Layer 1 (Executive):** Overall score + band + one-sentence interpretation +
  single most urgent action
- **Layer 2 (Manager/Lead):** Per-dimension radar + top 3 strengths + top 3
  weaknesses + delta
- **Layer 3 (Engineer):** Individual JSONL findings + file-level evidence +
  acceptance tests

---

## 7. Comparison Framework

### 7.1 Established Benchmarking Standards [D6]

**DORA Metrics (5 as of Oct 2024):** Deployment Frequency, Change Lead Time,
Failed Deployment Recovery Time, Change Failure Rate, and Deployment Rework Rate
(new in 2024). Important: the 2025 DORA report abandoned the four-tier
elite/high/medium/low model entirely in favor of seven team archetypes — an
archetype classifier may be more useful than a tiered score [D6].

**ISO 5055:** The international standard for automated code quality measurement
across Security, Reliability, Performance Efficiency, and Maintainability.
Language-independent. The foundation for compliance-grade "repo-vs-standard"
comparison [D6].

**ISO 25010 (SQuaRE):** 9-characteristic product quality model underlying SIG's
star benchmarking and Codacy's grading. Does not define weights — implementing
frameworks apply their own [D6].

**SIG/Sigrid:** Most mature repo-vs-industry approach. 30,000+ industry systems
across 300+ technologies; recalibrated annually. 1-5 stars; 3 stars = market
average. Quantified business impact: 4-star systems have 2x lower maintenance
costs and 4x faster development speed vs. 2-star [D6].

**CSI (Composite Stability Index):** Academically validated (Aug 2025) formula
for repo stability. CSI = 0.30·φ_commit + 0.25·φ_issue + 0.25·φ_PR +
0.20·φ_activity. Weekly aggregation recommended [D6].

**SPACEX (2025):** Single-repo adaptation of the SPACE framework using
artifact-derived proxies instead of surveys. Enables quantitative repo-vs-repo
comparison via z-score normalized Composite Productivity Score [D6].

### 7.2 Normalization Strategies [D6]

Three approaches with different trade-offs:

1. **LOC normalization (default):** Per-1000-LOC metrics. Handles size but not
   language expressiveness.
2. **Language-independent normalization:** Halstead metrics, Number of Modules,
   Functional Points. More accurate but harder to compute.
3. **Contextual segmentation (recommended for cross-project):** Segment repos by
   language + size + age + team size; compute percentile ranks within each
   segment. Used by SIG, DORA, and industrial benchmarking studies [D6].

**Segmentation dimensions for fair comparison:**

- Primary language (controls LOC normalization baseline)
- Project type (library / application / framework / tooling / research software)
- Maturity tier (Greenfield <2 years, Established 2-7 years, Legacy >7 years)
- Team size proxy (solo/micro: ≤2 active contributors; small: 3-10; large: 10+)

### 7.3 Recommended Comparison Framework [D6]

**Layer 0: Segmentation** — classify repo before any comparison

**Layer 1: 4-Dimension Structural Quality** | Dimension | Primary Tool |
Normalize By | |-----------|------------|-------------| | Security | OpenSSF
Scorecard (0-10) | None (binary practices) | | Reliability | Static analyzer
density | Issues per 1K LOC | | Maintainability | CodeScene health (1-10) or
Codacy grade | LoC-weighted | | Activity/Health | CSI | Per contributor,
age-adjusted |

**Layer 2: DORA-adapted Delivery Performance** (optional, only if CI/CD data
available)

**Layer 3: SPACEX Productivity Proxy** (optional, git-derived)

**Layer 4: Composite Score with Configurable Weights** Default weights
(tunable): Structural Quality 40%, Community Health 25%, Security 25%,
Activity/Delivery 10%.

**"Critical Health Metric" mode:** minimum score across all dimensions as an
alternative to weighted average — highlights any critical failure even when
overall score is high [D6].

---

## 8. Guard Rails

### 8.1 The 40-Item Constraint Checklist [D7]

Organized by failure category:

**Rate Limits (8 checks):**

- Always authenticate; never make unauthenticated API calls
- Check `/rate_limit` before each analysis batch; abort if `remaining < 200`
- Cache ETag on every GET; use `If-None-Match` on subsequent polls (304 = free)
- Core, search, code_search, and GraphQL are independent rate limit buckets
- Never fire >100 concurrent requests; keep concurrency ≤10 for safety headroom
- On 429 or 403: read `retry-after` header; wait + backoff; never retry
  immediately
- Code search: max 10 req/minute; throttle explicitly
- Search queries: assume ≤1,000 results max; implement date/size range
  segmentation

**Large Repository Safety (7 checks):**

- Skip statistics endpoints for repos with ≥10,000 commits (use git log
  fallback)
- Handle HTTP 202 on statistics endpoints (retry after 3-5 seconds; limit to 5
  retries)
- Do NOT use the `size` field as authoritative (use as rough filter only)
- Use Git Trees API (not Contents API) for full file enumeration
- Check `truncated: true` on Trees API responses; fall back to non-recursive
  subtree fetch
- Cap commit traversal for repos >50,000 commits to most recent N
- Estimate API call budget before starting (large repo = thousands of API calls
  for commit traversal)

**Monorepo Handling (4 checks):**

- Check for monorepo indicators at root (turbo.json, nx.json,
  pnpm-workspace.yaml, etc.)
- Multiple indicators are valid (pnpm + Turborepo simultaneously is common)
- Parse workspace globs for sub-package paths; do not assume `packages/` or
  `apps/`
- Analyze each sub-package independently when monorepo contains discrete
  deployables

**Fork and Archive Detection (4 checks):**

- Always fetch full repository object to get `parent` and `source` fields
- Flag forks in output with `parent.full_name` and `source.full_name`
- Use `archivedAt` (GraphQL) for archive date; REST `archived: true` is reliable
  but date is not
- Classify inactive repos using `pushed_at` (no push in 365 days = inactive)

**LFS Detection (3 checks):**

- Check for `.gitattributes` with `filter=lfs` before cloning
- Do NOT trust `size` field for LFS repos (severely undercounted)
- Warn before cloning LFS repos; actual download may far exceed reported size

**Empty and Skeleton Repos (3 checks):**

- Use Contents API to detect empty repos (HTTP 404 with "Git Repository is
  empty")
- Return graceful "empty repository" finding; do not error
- Distinguish "no commits" from "no source code"

**Auth and Privacy (5 checks):**

- Use GitHub App installation tokens for production (1-hour expiry; implement
  refresh)
- Never use deploy keys for multi-repo analysis
- Require explicit `archived` and `private` field checks before outputting
  findings
- Handle 401/403 gracefully (404 = repo not found OR access denied — GitHub
  prevents information leakage)
- GitHub App token expiry is 1 hour (installation tokens), NOT 8 hours (user
  access tokens)

**Non-Standard Layouts (6 checks):**

- Do not assume `src/` exists; enumerate actual root-level directories
- Treat Linguist language stats as advisory; cross-check against file extensions
- Identify and skip vendor/generated dirs (node_modules, vendor, _.min.js,
  _\_generated.\*)
- Handle polyglot repos; analyze top 3 languages by bytes as primary
- Language detection via API fails for repos >100,000 files; fall back to local
  scc
- pnpm is now the recommended workspace manager in 2025-2026 (shifted from Yarn)

---

## 9. Strategic Intelligence

### 9.1 What Repo Analysis Reveals Beyond Code [D11]

A GitHub repo is not just a codebase — it is an organizational intelligence
surface. The following signals are derivable from standard analysis artifacts.

**Team Intelligence Signals:**

| Signal               | Observable Artifact                                       | Inference                                                       |
| -------------------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| Team size            | Commit timestamp variance + timezone spread               | Small co-located vs. large distributed (CMU research validated) |
| Hiring event         | Sudden new contributor cluster + CONTRIBUTING.md addition | Team expansion underway                                         |
| Key person departure | Consistent contributor activity dropping to zero          | Knowledge concentration risk                                    |
| Team health          | PR merge time trends                                      | Reviewer bandwidth; culture of review debt                      |
| Work culture         | Weekend/evening commit ratio                              | Crunch culture vs. sustainable pace                             |

**Product Strategy Signals:**

| Signal               | Observable Artifact                  | Inference                           |
| -------------------- | ------------------------------------ | ----------------------------------- |
| Product pivot        | README significant rewrite (git log) | Value proposition repositioning     |
| Enterprise readiness | SECURITY.md first commit date        | SOC2/enterprise sales ramp starting |
| API maturity         | v2 route prefix introduction         | Locked-in users; forward evolution  |
| Feature priority     | Custom issue label taxonomy          | Business model emphasis areas       |
| Feature exploration  | Feature branch names in PR history   | Active R&D not yet public           |

**Technology Strategy Signals:**

| Signal              | Observable Artifact                             | Inference                                                                                                        |
| ------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Framework migration | package.json dependency diff                    | Strategic tech investment (Express→Fastify = performance focus; plain React→Next.js = SSR/customer-facing shift) |
| Architecture shift  | Service discovery / MQ library first appear     | Monolith-to-microservices transition date                                                                        |
| AI tool adoption    | Code churn rate, clone ratio, PR size explosion | Copilot/AI adoption before it is disclosed                                                                       |
| Security investment | Dependabot config, secret scanning              | Security posture shift for enterprise sales                                                                      |
| Test investment     | Test file growth ratio vs. source growth        | Quality vs. velocity tradeoff                                                                                    |

### 9.2 VC and Acquirer Due Diligence Signals [D11]

Five quantified risk thresholds from the ContributorIQ/acquisition methodology
(confidence: HIGH):

| Metric                             | Threshold | Risk Level                                 |
| ---------------------------------- | --------- | ------------------------------------------ |
| Bus Factor                         | = 1       | Critical                                   |
| Gini coefficient of commits        | > 0.7     | Significant key person risk                |
| Gini coefficient of commits        | > 0.5     | Moderate concentration risk                |
| Single-contributor file percentage | > 25%     | Extensive orphaned knowledge risk          |
| Orphaned file percentage           | > 20%     | Institutional knowledge loss               |
| Organization Health Score          | < 30      | Critical — warrants repricing or deal exit |

**License compliance as deal-killer:** AGPL and GPL licenses embedded in
proprietary products are the single most common deal-derailing finding in
technical M&A due diligence. The 2025 Black Duck report found 30% of license
conflicts stem from hidden transitive dependencies, not direct dependencies
[D11].

### 9.3 AI Code Detection [D11]

A 2026 academic study (arxiv 2601.17406) analyzed 33,580 PRs from five AI agents
and achieved 97.2% F1-score for agent fingerprinting using 53 features across 5
categories. Key signatures:

| Agent          | Distinctive Pattern                                               |
| -------------- | ----------------------------------------------------------------- |
| OpenAI Codex   | Multiline commit messages (67.5%)                                 |
| GitHub Copilot | Longer PR descriptions (38.4%), high change concentration (24.9%) |
| Cursor         | Bullet points (17.2%), hyperlinks (12.8%)                         |
| Devin          | Multiline commits (48.9%), distributed file changes               |
| Claude Code    | High conditional density (27.2%), high comment density (19.8%)    |

**Important caveat:** This 97.2% accuracy is for agentic (full-agent) PRs. Human
developers selectively accepting Copilot suggestions are much harder to detect —
accuracy drops significantly in the hybrid use case [D11].

**Structural quality signal from GitClear (211M changed lines, 2020-2024):**
Code clone rate up from 8.3% to 12.3%, refactoring ratio down from 25% to <10%,
code churn projected to double vs. 2021. "Copy/paste exceeds moved code for
first time in history" [D11].

---

## 10. AI-Assisted Analysis

### 10.1 Convergent Architecture Pattern [D12]

Every major AI code analysis tool (CodeRabbit, Sourcegraph Cody, Cursor, aider,
Greptile, Sweep) has converged on the same core architecture:

1. **AST-based chunking**: Split files by syntactic units (functions, classes)
   using tree-sitter or equivalent — not arbitrary character counts
2. **Graph-based ranking**: Build a dependency graph of symbols/files; use
   PageRank or similar to rank relevance at query time
3. **Semantic vector index**: Embed chunks using a code-optimized model; store
   in vector DB (LanceDB, Turbopuffer, or proprietary)
4. **RAG at inference**: Query expansion + nearest-neighbor retrieval populates
   LLM context window

The differences between tools lie in how richly they model code structure and
how aggressively they prune context — not in the fundamental architecture [D12].

### 10.2 The Repo-Map Pattern [D12]

Aider's repo-map is the simplest and most transparent implementation of context
injection for LLM analysis:

- Use tree-sitter to extract symbol definitions and references from all source
  files
- Build a directed graph (files as nodes, symbol dependencies as edges)
- Apply Personalized PageRank to rank files by relevance to current context
- Output: compact text showing each file's path + most-referenced class/function
  signatures (not full bodies)
- Default token budget: **1,000 tokens** for the map, expandable dynamically
- Key insight: **signatures beat full bodies** for architectural understanding —
  the LLM infers intent from function names, types, and call patterns [D12]

**Token budget recommendations for LLM context:**

- Repo-map (signatures only): 1,000-3,000 tokens
- Active analysis target (full code): 2,000-5,000 tokens
- Retrieved relevant context (RAG hits): 2,000-4,000 tokens
- Total target: < 12,000 tokens for reliable reasoning

### 10.3 LLMs vs. Static Analysis — The Correct Division [D12]

This is confirmed by multiple independent studies (confidence: HIGH):

**Use static analysis for:**

- Deterministic pattern detection (anti-patterns, security rules)
- Exact metric computation (LOC, cyclomatic complexity)
- Deterministic reporting (scores, counts)
- Speed-sensitive checks (15-50ms vs. 3-8s per scan)
- Cost-sensitive checks ($0 vs. $0.002-0.01 per LLM call)
- False positive rate: 5% for static vs. 12% for LLM detection

**Use LLMs for:**

- Explaining findings from static/churn analysis in natural language
- Identifying architectural patterns and technical debt from the repo-map
- Cross-file reasoning ("does this change break anything elsewhere?")
- Generating actionable, prioritized recommendations
- Summarizing complex analysis results
- Novel pattern detection not covered by pre-written rules

**Hybrid approaches reduce false positives by 43-91% vs. pure static analysis**
while maintaining or improving recall [D12].

**The "lost in the middle" problem:** LLMs achieve 85-95% recall at start/end of
context but drop to 76-82% in the middle. Place the repo-map at context start,
analysis task at context end, detailed findings in the middle [D12].

### 10.4 Structural Prompt Design [D12]

Following CodeRabbit's "evidence not vibes" approach — give the LLM structured
input, ask it to synthesize:

```
[REPO-MAP: top-N files by PageRank, signatures only]
[STATIC FINDINGS: linter/security tool output for changed files]
[CHURN DATA: high-churn files, co-change coupling pairs]
[COMPLEXITY METRICS: cyclomatic complexity outliers]

Task: Identify the top 3 architectural risks. For each risk, cite specific
evidence from the data above. Do not invent findings not supported by the data.
```

**Co-change coupling as a quality signal:** Track which files "frequently change
together" from commit history. Independent of semantic analysis — provides a
churn-based quality signal that complements static analysis. Mines from git log;
no special tooling required [D12].

**Contextual embeddings (Anthropic technique):** Before embedding a chunk,
generate a 1-2 sentence LLM description of the chunk's role in the broader file,
prepend it to the chunk text, then embed the concatenation. Dramatically
improves retrieval relevance for cross-file queries [D12].

---

## 11. Cross-Cutting Themes

These patterns appeared independently in 3 or more findings files, indicating
strong convergence:

### Theme 1: "Clone is Not the First Step" [D2a-4, D4, D7]

Three findings files independently concluded that the GitHub API + Scorecard
API + deps.dev API together cover approximately 40% of meaningful analysis
dimensions without any clone. The API-first pattern was confirmed in D2a-4
(capability matrix), D4 (pipeline design), and D7 (constraint analysis). The
blobless partial clone is the default; full clone is exceptional.

### Theme 2: "No Single Platform Covers the Full Signal Space" [D3a, D3b, D1a, D1b]

All four findings files covering dimensions and platforms confirmed systematic
blind spots: code quality platforms miss git behavioral signals, behavioral
platforms miss security, security platforms miss community health. The gap is
structural, not an oversight that any platform is likely to close soon — because
each commercial platform is optimizing for its own niche.

### Theme 3: "Tree-sitter is the Correct AST Substrate" [D2a-2, D12, D1a]

Three files independently arrived at tree-sitter as the universal foundation for
structural analysis. D2a-2 documented it as the parsing library underlying all
major tools. D12 documented its use in every production AI analysis system
(aider, Cursor, CodeRabbit). D1a confirmed it as the mechanism for dimensions
1-20. 900+ parsers covering virtually every language.

### Theme 4: "Churn + Complexity Overlay is the Highest-ROI Single Dimension" [D1a, D2a-3, D3b, D11]

Four files independently elevated hotspot analysis (code churn × complexity) as
uniquely high-signal. D1a rated it 5/5 signal value as "the single highest-ROI
analysis dimension." D2a-3 documented CodeScene's academic foundation. D3b
confirmed CodeScene's claim of 6x maintainability advantage over SonarQube. D11
documented it as a strategic intelligence signal for M&A.

### Theme 5: "12 Months of History is Sufficient for Churn Analysis" [D4, D1a, D2a-3]

This research-validated finding appeared in three files independently: D4 cited
a specific community-validated study, D1a's dimension description confirmed it,
D2a-3's CodeScene reference aligned. This simplifies the pipeline significantly
— no full history clone needed for churn/hotspot analysis.

### Theme 6: "Static + LLM Hybrid Beats Either Alone" [D12, D3a, D2b]

Three files confirmed the hybrid approach. D12 provided quantitative evidence
(43-91% false positive reduction). D3a confirmed all commercial platforms now
use some form of AI layer on top of static analysis. D2b noted DeepSource's
two-stage secrets detection (regex + AI classifier) achieving 93% false positive
reduction vs. pattern-only.

### Theme 7: "The OpenSSF Scorecard API is Underutilized" [D2a-4, D2b, D3b, D4, D7]

Five files independently noted the OpenSSF Scorecard API at
`api.securityscorecards.dev` as covering 1M+ repos with pre-computed weekly
security posture scores — no local run required, no authentication required.
This appeared in the API capabilities file (D2a-4), the security tools file
(D2b), the specialized platforms file (D3b), the pipeline file (D4), and the
constraints file (D7). It is the single most immediately usable free data
source.

### Theme 8: "AI Coding Tools Create Detectable, Measurable Quality Degradation" [D11, D12, D1b]

Three files documented the AI productivity paradox from different angles. D11
reported GitClear's 4x growth in code clones and 7.9% short-lived code revision
rate. D12 reported 25.1% average code complexity increase from LLM-assisted
development. D1b noted the DORA 2025 finding of +91% more code review time with
AI adoption. This is a measurable, consistent signal across multiple independent
data sources.

---

## 12. Consolidated Gaps and Serendipity

### 12.1 Open Gaps (requires further research or design)

| Gap                                                               | Source | Notes                                                                                        |
| ----------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Exact unauthenticated rate limits post-May 2025                   | D7     | GitHub tightened but did not publish new numbers                                             |
| GraphQL resource limits (Sept 2025)                               | D7     | GitHub declined to publish exact thresholds                                                  |
| LFS storage size via API                                          | D7     | No endpoint for actual LFS object sizes                                                      |
| Benchmark data for medium repos (10MB-100MB)                      | D4     | Studies focus on linux-scale repos; medium repos may not benefit from partial clone overhead |
| No mature incremental analysis framework                          | D4     | DIY SQLite caching is the current state; no purpose-built open-source solution               |
| Python framework detection library                                | D4     | No equivalent to Netlify's framework-info for Python stacks                                  |
| ts-morph performance on very large TypeScript repos (100k+ files) | D2a-2  | No benchmarks found                                                                          |
| SPACEX default weights                                            | D6     | Paper treats weights as "organization-dependent" without empirical defaults                  |
| Pattern portability scoring formula                               | D6     | Technology Radar provides qualitative rings but no quantitative formula                      |
| Token cost per repo analysis                                      | D12    | Not publicly available for any tool; critical for feasibility at scale                       |
| "repo-report-card" as a named tool                                | D3b    | No tool by this exact name confirmed; fragmented landscape                                   |

### 12.2 Serendipitous Discoveries

**High operational value — immediately actionable:**

1. **scc estimates LLM regeneration cost** [D2a-3]: Beyond COCOMO, scc added a
   "LOCOMO" metric estimating cost to regenerate a codebase using an LLM. Could
   be a compelling differentiator metric for the skill output.

2. **OpenSSF Scorecard BigQuery dataset** [D2a-4, D3b]: The full weekly scan
   results for 1M+ repos are published as an open public dataset
   (`openssf:scorecardcron.scorecard-v2`). Enables true industry benchmarking
   without running any tool.

3. **CodeQL databases are queryable** [D2a-4]:
   `GET /repos/{owner}/{repo}/code-scanning/codeql/databases/{language}` lets
   you check whether a repo has been analyzed by CodeQL and potentially download
   the database for offline analysis.

4. **jscpd and Knip both implement MCP** [D2a-2, D2a-3]: Both tools expose Model
   Context Protocol servers, making them directly queryable by AI assistants
   without scripting. jscpd: duplication analysis. Knip: dead code analysis.

5. **TruffleHog can scan remote repos without cloning** [D2b]:
   `trufflehog git https://github.com/owner/repo` performs full secret scanning
   including git history without any local clone. Unique capability in the
   secrets detection category.

6. **Contextual embeddings improve retrieval** [D12]: Prepend a 1-2 sentence
   LLM-generated description of each chunk's role before embedding. Low
   implementation cost, high retrieval quality improvement. Documented Anthropic
   technique.

7. **The `stats/punch_card` endpoint reveals commit time-of-day** [D2a-4]: A
   behavioral proxy for team working hours and geographic distribution. Free, no
   clone, immediate.

8. **`gh repo view --json diskUsage`** [D2a-4]: Quick remote proxy for
   repository complexity without cloning. Single API call.

**Strategic / design insights:**

9. **Hud.io (Dec 2025)** [D3b]: First "runtime code sensor" — continuously
   captures function-level production behavior and feeds it back to AI coding
   agents via MCP. Closes the static/runtime correlation gap that no current
   platform addresses.

10. **DORA gained a 5th metric** [D3b, D6]: Deployment Rework Rate added
    Oct 2024. Any "DORA metrics" reporting should include this or explicitly
    note it is not included.

11. **GitClear's Diff Delta formula** [D3b]: Only 2.3% of raw code changes
    survive all six filters (file, context, duplication, base score, time,
    context scalar) as "meaningful change that endures." This is a reframing of
    productivity that could be surfaced as a differentiating metric.

12. **Sourcegraph went fully proprietary in Aug 2024** [D3b]: Previously Apache
    2.0; now private repository. References to it as open source are outdated.

13. **CodeClimate/Qlty brand transition** [D3a]: CodeClimate Quality is now Qlty
    Software at qlty.sh. Existing CodeClimate integrations may be broken. Any
    tool that integrates with "CodeClimate" should be audited.

14. **CNCF governance can be contested** [D11]: The 2025 NATS/Synadia dispute
    showed that even CNCF-donated projects can have governance contested. For
    dependency risk assessment: check whether key OSS dependencies are in
    contested governance situations.

15. **Index sharing via simhash (Cursor)** [D12]: 92% of codebase clones within
    an org are near-identical. This suggests an optimization: index once per
    repo, reuse across branches/forks with simhash lookup. Cuts
    time-to-first-query from 4+ hours to 21 seconds.

---

## Sources Index (Abbreviated)

All sources are cited inline via `[Dxx]` references to their originating
findings files. Complete source tables with URLs, CRAAP scores, trust levels,
and dates are in each individual findings file. A summary of source tiers:

**Tier 1 (Official docs/repos — HIGH trust):**

- GitHub REST/GraphQL API documentation (current 2026)
- OpenSSF Scorecard official documentation
- deps.dev API documentation
- Individual tool GitHub repositories (ESLint, golangci-lint, tree-sitter, etc.)
- JetBrains, SonarSource, Anchore official documentation
- OASIS SARIF 2.1.0 specification

**Tier 2 (Vendor blogs/official changelogs — HIGH-MEDIUM trust):**

- GitHub Blog (git clone study, partial clone, monorepo sparse-checkout)
- golangci-lint v2 release blog
- CodeRabbit, Cursor, Sourcegraph Cody architecture blogs
- DORA official reports and methodology documentation

**Tier 3 (Academic papers, community — MEDIUM trust):**

- arXiv preprints on SPACEX, CSI, AI agent fingerprinting (2025-2026)
- SIG/Sigrid maintainability benchmarking research
- CHAOSS community health framework documentation
- Practitioner blogs on static analysis vs. LLM tradeoffs

**Source freshness note:** All findings are from March 2026 research. Tools with
last releases before 2023 (plato, escomplex, comby, gitinspector, loc) are
explicitly flagged as abandoned or uncertain.
