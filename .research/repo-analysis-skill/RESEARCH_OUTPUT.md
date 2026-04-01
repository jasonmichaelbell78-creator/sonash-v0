# Repo Analysis Skill — Definitive Research Report

**Version:** Final (post-challenges, post-gaps) **Date:** 2026-03-31 **Sources
processed:** 15 external findings files (D1a, D1b, D2a-1 through D2a-4, D2b,
D3a, D3b, D4, D5, D6, D7, D11, D12), 7 internal findings files (D8, D9a-1,
D9a-2, D9b-1, D9b-2, D10a, D10b), 2 verification passes (V1, V2), 2 challenge
files (Contrarian-1, OTB-1), 2 gap files (G1, G2) **Confidence distribution:**
HIGH: 157, MEDIUM: 22, LOW: 2, UNVERIFIED: 3

---

## 1. Executive Summary

This report defines the design of a `/repo-analysis` skill for analyzing
external GitHub repositories. The research synthesizes external tool research,
internal codebase patterns, two rounds of challenge/verification, and targeted
gap analysis. The result is a complete, implementable design specification.

The central finding is that no existing commercial platform covers the full
signal space for repo analysis. SonarQube, CodeScene, Greptile, Qlty, and
DeepSource each own deep vertical slices — static quality, behavioral analysis,
AI-assisted review, maintainability tracking — but leave systematic blind spots.
Static platforms miss git behavioral signals. Behavioral platforms miss security
posture. Security platforms miss community health. The custom skill fills these
gaps through composition. [D3a, D3b, Contrarian-1]

The research validates four architecture mandates. First, the default entry
point is Quick Scan (Phase 0 API-only, under 30 seconds, no disk writes), not a
clone. Quick Scan delivers 40-55% of analysis signal — including the
highest-signal security and governance dimensions — before any clone occurs. For
the most common use case, evaluating an external dependency for adoption, Quick
Scan answers the question 70-80% of the time. [G1, Contrarian-1-Challenge-4]

Second, the full analysis pipeline uses a 4-tier hybrid: API pre-flight,
blobless partial clone, conditional 12-month history clone, conditional full
clone. The blobless partial clone (`git clone --filter=blob:none --depth=1`) is
1.5-2x faster than full clone and supports all analysis except `git-sizer`.
Shallow clones impose a 13-25x server CPU penalty and should never be the
default. [D4, C-001, C-013]

Third, the recommended tool stack is minimal, not maximal. The contrarian
challenge correctly identified that a 30-tool stack creates unsustainable
maintenance overhead for a solo operator. The core stack is 5-7 tools: `scc`,
`semgrep`, `knip`/`vulture` (dead code, language-dependent), `lizard`
(complexity, multi-language), `jscpd` (duplication), `dependency-cruiser` (JS/TS
architecture), and `git-quick-stats` (temporal signals). All other tools are
conditional on the detected language stack. [Contrarian-1-Challenge-2, D2a-1
through D2a-3]

Fourth, scoring uses categorical bands (A-F or Critical/Needs
Work/Healthy/Excellent) as the primary display, not a false-precision numeric
composite. The contrarian correctly identified that a "74/100" score conceals a
confidence interval of ±10-15 points given tool false-positive rates. Bands are
honest about this uncertainty. Numeric scores are retained as internal
computation and trend-tracking values only. [Contrarian-1-Challenge-3]

The internal codebase analysis revealed that our own quality infrastructure — 14
pre-commit checks, 12 pre-push checks, 65 skills, 57 agents, and an
empirically-grown pattern registry distilled from 347 AI reviews — constitutes
the most battle-tested reference rubric available. The skill should measure
external repos against this bar, not against theoretical checklists. [V2, D10a,
D10b]

Three contrarian challenges required genuine design changes: (1) Quick Scan is
now the DEFAULT mode, not an option. (2) The agent count formula is replaced
with the `gsd-codebase-mapper` 4-axis model as the starting point. (3) Scoring
uses bands + raw dimension values, not a single composite number. Two challenges
were conceded as valid concerns without full resolution: tool maintenance burden
is real but accepted with a minimum-viable-stack policy, and competitive
landscape review (Greptile, CodeRabbit) confirmed these tools solve a different
problem (ongoing PR review) than the custom skill (point-in-time external repo
evaluation). [Contrarian-1, G1]

---

## 2. Skill Design Overview — Three Modes

The skill operates in three modes. Quick Scan is the default and does not
require explicit selection.

### Mode 1: Quick Scan (default, API-only, no clone)

**When:** Default invocation. No `--depth` flag. Target is a GitHub URL. **Time
budget:** Under 30 seconds. **Disk writes:** None. **API calls:** 8-10
authenticated GitHub API calls + 1 OpenSSF Scorecard lookup. **Value
delivered:** 40-55% of full analysis signal. Answers: "Is this repo actively
maintained? Are there known CVEs? Does the team follow basic security practices?
Is CI working?" Excellent for rapid triage of multiple dependency candidates.
[G1, V1-C008]

### Mode 2: Standard (clone + static analysis)

**When:** `--depth=standard` or after Quick Scan surfaces findings warranting
deeper review. **Time budget:** 5-15 minutes depending on repo size. **Clone
strategy:** `git clone --filter=blob:none --depth=1` **Coverage:** All Quick
Scan dimensions plus code complexity, duplication, dead code, architecture, type
coverage, secret detection. **Value delivered:** ~80% of full analysis.
Sufficient for most decision contexts. [D4, D8]

### Mode 3: Deep (full history, temporal analysis)

**When:** `--depth=deep` or when Standard analysis flags temporal signals worth
investigating (contributor cliff, high churn). **Time budget:** 15-25 minutes.
**Clone strategy:** `git clone --filter=blob:none --shallow-since="1 year ago"`
(12-month history) **Additional coverage:** Code churn hotspots, contributor
health trends, temporal fingerprint (5 signals), dependency biography, absence
pattern classifier (7 named patterns). [D4, G2, OTB-1]

**Full clone (exceptional):** Triggered only by git-sizer audit requests, binary
anomalies, or repos over 1 GB. `git clone` (no filters). Not a named mode — an
edge case within Deep. [D4]

---

## 3. Analysis Dimensions Catalog

Organized by mode in which the dimension first becomes available. Feasibility
ratings (automation / signal value) are on a 1-5 scale. [D1a, D1b]

### 3.1 Quick Scan Dimensions (API-only)

| #     | Dimension                               | Signal | Auto | Tool/Source                                 |
| ----- | --------------------------------------- | ------ | ---- | ------------------------------------------- |
| QS-01 | Project activity and recency            | 5/5    | 5/5  | `pushed_at` + workflow runs                 |
| QS-02 | Stars/forks/engagement trajectory       | 3/5    | 4/5  | Stargazers API (with timestamps) [OTB-1-§1] |
| QS-03 | Archived/abandoned status               | 5/5    | 5/5  | REST metadata `archived` field              |
| QS-04 | License type and presence               | 4/5    | 5/5  | REST metadata + community health            |
| QS-05 | CI/CD presence and pass rate            | 5/5    | 5/5  | Workflow list + last N runs                 |
| QS-06 | Branch protection rules                 | 5/5    | 5/5  | GraphQL `branchProtectionRules`             |
| QS-07 | Dependabot alert count + severity       | 5/5    | 5/5  | REST dependabot/alerts                      |
| QS-08 | Code scanning alerts (CodeQL)           | 5/5    | 5/5  | REST code-scanning/alerts                   |
| QS-09 | Secret scanning alerts                  | 5/5    | 5/5  | REST secret-scanning/alerts                 |
| QS-10 | Community health completeness           | 4/5    | 5/5  | REST community/profile (0-100)              |
| QS-11 | CONTRIBUTING/SECURITY file presence     | 4/5    | 5/5  | Community profile response                  |
| QS-12 | Contributor count (bus factor proxy)    | 5/5    | 5/5  | REST contributors endpoint                  |
| QS-13 | Merge hygiene settings                  | 3/5    | 5/5  | REST metadata merge flags                   |
| QS-14 | OpenSSF 16-check security score         | 5/5    | 5/5  | `api.securityscorecards.dev` [V1-C008]      |
| QS-15 | Dependency SBOM (direct + transitive)   | 4/5    | 5/5  | REST dependency-graph/sbom                  |
| QS-16 | Known CVEs via deps.dev                 | 5/5    | 5/5  | `api.deps.dev` (no auth) [D2b]              |
| QS-17 | Fork-to-star ratio (adoption signal)    | 4/5    | 5/5  | Computed from metadata [OTB-1-§1]           |
| QS-18 | Watcher-to-star ratio (operational use) | 3/5    | 5/5  | Computed from metadata [OTB-1-§1]           |

### 3.2 Standard Mode Dimensions (requires clone)

| #     | Dimension                            | Signal | Auto | Tool                                      |
| ----- | ------------------------------------ | ------ | ---- | ----------------------------------------- |
| ST-01 | Cyclomatic complexity                | 4/5    | 5/5  | `lizard` (26 languages) [D2a-2]           |
| ST-02 | Cognitive complexity                 | 5/5    | 4/5  | `rust-code-analysis` (where supported)    |
| ST-03 | Code duplication                     | 4/5    | 5/5  | `jscpd` (150+ languages) [D2a-2]          |
| ST-04 | LOC and file/function size metrics   | 3/5    | 5/5  | `scc` (322 languages) [D2a-3]             |
| ST-05 | Dead code / unused exports           | 4/5    | 4/5  | `knip` (JS/TS), `vulture` (Python)        |
| ST-06 | Dependency direction + circular deps | 5/5    | 4/5  | `dependency-cruiser` (JS/TS) [D2a-3]      |
| ST-07 | SAST vulnerability detection         | 5/5    | 5/5  | `semgrep` (30+ languages) [D2b]           |
| ST-08 | Type safety coverage                 | 4/5    | 5/5  | `type-coverage` (TS), `mypy` (Python)     |
| ST-09 | Test coverage presence/maturity      | 4/5    | 4/5  | Detect framework config + file ratio      |
| ST-10 | Secrets in current code              | 5/5    | 5/5  | `gitleaks` (150+ patterns) [D2b]          |
| ST-11 | Architecture pattern compliance      | 5/5    | 3/5  | AST-based + `dependency-cruiser` rules    |
| ST-12 | Naming convention consistency        | 3/5    | 5/5  | Linter rules (language-specific)          |
| ST-13 | Error handling quality               | 5/5    | 4/5  | `semgrep` rules + AST analysis            |
| ST-14 | Absence pattern classification       | 5/5    | 5/5  | Multi-source classifier (7 patterns) [G2] |
| ST-15 | Framework/stack detection            | 3/5    | 5/5  | Manifest heuristics (see §5.2) [D4]       |

### 3.3 Deep Mode Dimensions (require 12-month history)

| #     | Dimension                                 | Signal | Auto | Tool                                             |
| ----- | ----------------------------------------- | ------ | ---- | ------------------------------------------------ |
| DP-01 | Code churn hotspots                       | 5/5    | 4/5  | `git log --numstat` [D2a-3]                      |
| DP-02 | Temporal coupling (co-change pairs)       | 5/5    | 3/5  | `git log` + frequency analysis [D12]             |
| DP-03 | Contributor health (bus factor trend)     | 5/5    | 5/5  | `git shortlog` + 6-month window [G2]             |
| DP-04 | Commit velocity trend (sparkline)         | 5/5    | 5/5  | `git log` monthly aggregation [G2]               |
| DP-05 | Test-to-code file ratio trajectory        | 4/5    | 4/5  | `git ls-files` + quarterly comparison            |
| DP-06 | Dependency file touch frequency           | 4/5    | 5/5  | `git log --follow` on manifest files             |
| DP-07 | Secrets in history                        | 5/5    | 5/5  | `trufflehog git <url>` (no clone needed) [D2b]   |
| DP-08 | PR merge time and review velocity         | 5/5    | 4/5  | GitHub API pulls history                         |
| DP-09 | Issue response time                       | 5/5    | 4/5  | GitHub API issues history                        |
| DP-10 | Dependency biography (migration history)  | 4/5    | 3/5  | `git log --follow -p -- package.json` [OTB-1-§5] |
| DP-11 | Organizational contributor diversity      | 4/5    | 3/5  | Email-to-org heuristics [D1b]                    |
| DP-12 | DORA proxy metrics (lead time, frequency) | 4/5    | 4/5  | GitHub Actions + PR data [D6, V1-C014]           |

---

## 4. Recommended Tool Stack

The contrarian challenge correctly identified that cataloging 30 tools creates
unsustainable maintenance overhead. This section defines the minimum viable
stack and the conditional extensions. [Contrarian-1-Challenge-2]

### Tier 1 — Core (install always)

These 5-7 tools are required for every Standard or Deep analysis. They cover the
highest-signal dimensions across any language.

| Tool              | Version | License     | Purpose                                    | Why This One                                                                |
| ----------------- | ------- | ----------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| `scc`             | latest  | MIT         | LOC counting, COCOMO/LOCOMO cost estimates | Fastest; 322 languages; unique LLM cost estimate via `--locomo` [V1-C016]   |
| `semgrep`         | CE      | LGPL engine | SAST, pattern detection                    | 30+ languages; 3,000+ rules; 10s typical scan; CE engine is free [D2b]      |
| `lizard`          | 1.21.3+ | MIT         | Cyclomatic complexity (26 languages)       | Multi-language; `#lizard forgives` suppression; actively maintained [D2a-2] |
| `jscpd`           | latest  | MIT         | Code duplication detection                 | 150+ languages; Rabin-Karp; MCP native; SARIF output [D2a-2, V1-C011]       |
| `gitleaks`        | v8.28+  | MIT         | Secrets in current code                    | 150+ types; SARIF; pre-commit hook; fast regex [D2b]                        |
| `git-quick-stats` | latest  | MIT         | Temporal signal extraction                 | Zero dependencies; `--json-output`; `_GIT_SINCE`/`_GIT_UNTIL` support [G2]  |

### Tier 2 — Language-Conditional (install when detected)

| When            | Tool                      | Purpose                                                                          |
| --------------- | ------------------------- | -------------------------------------------------------------------------------- |
| JS/TS detected  | `knip` v6+                | Dead code, unused exports, orphaned types [D2a-3]                                |
| JS/TS detected  | `dependency-cruiser` v17+ | Module dependencies, circular detection, DOT/Mermaid output [D2a-3]              |
| JS/TS detected  | `eslint` v9+              | Linting; `lintText()` API for pre-clone analysis [D2a-1, C-029]                  |
| Python detected | `vulture` v2.16+          | Dead code with confidence percentages [D2a-3]                                    |
| Python detected | `ruff`                    | Fast linting (replaces pylint for speed) [D2a-1]                                 |
| Go detected     | `golangci-lint` v2+       | Aggregated linting; use `--output.json.path` (NOT `--out-format`) [D2a-1, C-039] |
| Multi-language  | `ast-grep` 0.42+          | Pattern-based structural search; 30 languages; Rust-based speed [D2a-2]          |

### Tier 3 — Optional / Deep Mode Only

| Tool             | Purpose                                        | When                                 |
| ---------------- | ---------------------------------------------- | ------------------------------------ |
| `trufflehog`     | Secrets in git history (API-only mode)         | Deep mode DP-07                      |
| `osv-scanner` v2 | SCA with guided remediation                    | When deep dependency audit requested |
| `ts-morph`       | TypeScript-specific dead code + type inference | TS repos needing deep type analysis  |
| `code-maat`      | Temporal coupling extraction (CSV)             | When DP-02 analysis requested        |

### Tools to Avoid

| Tool                    | Reason                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trivy` v0.69.4–v0.69.6 | Supply chain attack (CVE-2026-33634); `mirror.gcr.io` still serving malicious v0.69.6. Safe: v0.69.3 or `trivy-action@v0.35.0` (SHA: 57a97c7) [V1-C005] |
| `plato`                 | Abandoned 2014 [D2a-2]                                                                                                                                  |
| `ts-prune`              | Archived Sep 2025; replaced by Knip [D2a-3]                                                                                                             |
| `unimported`            | Archived Mar 2024; replaced by Knip [D2a-3]                                                                                                             |
| `MegaLinter` as default | AGPL-3.0; high maintenance cost; acceptable only if license risk and Docker overhead are acceptable [Contrarian-1-Challenge-2, C-026]                   |

---

## 5. Pipeline Architecture

### 5.1 The 4-Tier Hybrid with Quick Scan Default [D4, G1]

```
INVOCATION
    |
    v
PHASE 0: Quick Scan (always runs, ~5-30s, no disk I/O)
  |- GitHub REST: repo metadata, language, stars, forks, pushed_at, archived
  |- GitHub REST: community/profile (completeness score)
  |- GitHub REST: dependabot/alerts, code-scanning/alerts, secret-scanning/alerts
  |- GitHub REST: actions/workflow-runs (last 10 runs)
  |- GitHub REST: contributors (top 500, bus factor proxy)
  |- GitHub REST: dependency-graph/sbom
  |- GitHub GraphQL: branchProtectionRules, securityAndAnalysis
  |- OpenSSF Scorecard API: api.securityscorecards.dev (404 = not indexed; continue)
  |- deps.dev API: license + CVE summary for primary manifest
  All 3 external APIs run in parallel.
  Output: Quick Scan report. Present findings. Offer: "Run Standard analysis? [y/N]"
    |
    |-- [DEFAULT STOP: Quick Scan report is the output]
    |
    v (if --depth=standard or user accepts upgrade prompt)
PHASE 1: Clone (~5-30s depending on repo size)
  |- git clone --filter=blob:none --depth=1 <repo-url>
  |- LFS repos: GIT_LFS_SKIP_SMUDGE=1 git clone --filter=blob:none --no-checkout
  |- Write clone to /tmp/repo-analysis-<slug>/
    |
    v
PHASE 2: Dimension Wave (parallel, up to 4 concurrent agents)
  |- scc --format=json (LOC, language confirmation, complexity estimates)
  |- Manifest parser: package.json / go.mod / Cargo.toml / requirements.txt
  |- Framework detector (heuristics, see §5.2)
  |- Monorepo detector (turbo.json, nx.json, pnpm-workspace.yaml, etc.)
  |- lizard (complexity, 26 languages)
  |- semgrep (SAST, language-matched rules)
  |- jscpd (duplication detection)
  |- gitleaks (secrets in current code)
  |- Knip or Vulture (dead code, by detected language)
  |- dependency-cruiser (JS/TS only)
  |- Absence Pattern Classifier (single-pass, see §9)
  Each agent writes dimensions/<dim>-findings.json before returning.
    |
    v
PHASE 3: History Wave (conditional; --depth=deep)
  |- Deepen clone: git fetch --filter=blob:none --shallow-since="1 year ago"
  |- Temporal Fingerprint agent (5 signals, see §8)
  |- Churn agent: git log --numstat per file (last 12 months)
  |- Contributor health agent: git shortlog monthly analysis
  |- Dependency biography agent: git log on manifest files [OTB-1-§5]
    |
    v
PHASE 4: Full Clone (exceptional: git-sizer, binary anomaly, >1 GB repo)
  |- git clone (no filters, full depth)
  |- git-sizer --json (20+ size metrics)
    |
    v
PHASE 5: Aggregation (1 agent, sequential)
  |- Reads all dimensions/<dim>-findings.json
  |- Merges Quick Scan API results
  |- Computes scores (bands, not composite number as primary)
  |- Produces analysis.json, findings.jsonl, trends.jsonl, summary.md
    |
    v
PHASE 5.5: TDMS Deduplication (inline, mandatory pre-review)
  |- Cross-reference MASTER_DEBT.jsonl by fingerprint
  |- Write DEDUP_VS_MASTER_DEBT.md to output_dir
    |
    v
PHASE 6: Interactive Review (3-5 findings per batch, S0 first)
PHASE 7: Routing menu (deep-plan | add-debt | memory | compare | done)
```

### 5.2 Framework Detection Heuristics [D4]

Detection hierarchy: config file presence + dependency name together, not
dependency name alone.

| Framework    | Primary Signal                                    |
| ------------ | ------------------------------------------------- |
| Next.js      | `next` in deps AND `next.config.js/ts` present    |
| React (CRA)  | `react-scripts` in deps, no framework config file |
| Vite React   | `@vitejs/plugin-react` in devDeps                 |
| Angular      | `@angular/core` dep AND `angular.json`            |
| Vue          | `vue` dep AND optional `vue.config.js`            |
| Django       | `django` in requirements.txt or pyproject.toml    |
| FastAPI      | `fastapi` in requirements.txt                     |
| Express/Node | `express` in package.json, no frontend framework  |
| Go service   | `go.mod` present, no frontend frameworks          |
| Rust service | `Cargo.toml` with lib or binary crate             |

### 5.3 Monorepo Detection [D4, D7]

Single API call: check for root-level file presence.

| File                             | Monorepo Tool                |
| -------------------------------- | ---------------------------- |
| `turbo.json`                     | Turborepo                    |
| `nx.json`                        | Nx                           |
| `pnpm-workspace.yaml`            | pnpm (recommended 2025-2026) |
| `package.json#workspaces`        | npm/Yarn/Bun                 |
| `rush.json`                      | Rush                         |
| `WORKSPACE` or `WORKSPACE.bazel` | Bazel                        |
| `Cargo.toml` with `[workspace]`  | Rust/Cargo                   |

For sub-package analysis in monorepos: `git sparse-checkout set <subdir>`.
Enables analyzing one sub-package of a 30 GB repo in under 2 minutes. [D4]

---

## 6. Output Schema — 3-Artifact Design

Three primary artifacts plus one injectable Markdown summary. [D5]

### Artifact 1: `analysis.json`

```json
{
  "$schema": "repo-analysis/v1",
  "meta": {
    "analysis_id": "uuid-v4",
    "timestamp": "ISO8601",
    "target_repo": "github.com/org/repo",
    "target_commit": "sha",
    "language": "TypeScript",
    "loc": 42000,
    "analysis_mode": "standard"
  },
  "summary": {
    "overall_band": "Healthy",
    "overall_score": 74,
    "trend": "improving",
    "delta_from_previous": 6,
    "one_sentence": "Well-structured codebase with strong CI, weak security posture.",
    "top_priority_action": "Add rate limiting to Cloud Functions endpoints (3 unprotected)"
  },
  "dimensions": {
    "security":        { "band": "Needs Work", "score": 52, "delta": -4 },
    "reliability":     { "band": "Healthy",    "score": 78, "delta": 2  },
    "maintainability": { "band": "Excellent",  "score": 81, "delta": 5  },
    "documentation":   { "band": "Healthy",    "score": 66, "delta": 0  },
    "process":         { "band": "Excellent",  "score": 88, "delta": 8  },
    "velocity":        { "band": "Healthy",    "score": 71, "delta": -1 }
  },
  "absence_patterns": ["security_facade"],
  "actionable_insights": {
    "top_to_steal": [...],
    "top_to_avoid": [...]
  }
}
```

**Score bands:** [Contrarian-1-Challenge-3, D5]

| Score  | Band       | Interpretation                    |
| ------ | ---------- | --------------------------------- |
| 0-39   | Critical   | Immediate action required         |
| 40-59  | Needs Work | Significant gaps                  |
| 60-79  | Healthy    | Acceptable; targeted improvements |
| 80-100 | Excellent  | Strong across dimension           |

Primary display is band + score in parentheses: `Healthy (74)`. Not `74/100` as
a standalone number. This is the concession to the contrarian's false-precision
critique while retaining numeric scores for trend tracking.
[Contrarian-1-Challenge-3]

**Important:** Do NOT use a single-number composite as the primary health
indicator. A repo with a 90/100 average but one exposed `.env` file with live
credentials is a Critical security finding regardless of average. Use "Critical
Health Metric" mode (minimum score across all dimensions) as a mandatory
secondary indicator alongside the average. [Contrarian-1-Challenge-3]

### Artifact 2: `findings.jsonl` (TDMS-compatible)

One record per finding. Fields match `docs/templates/JSONL_SCHEMA_STANDARD.md`
exactly — no transformation needed for TDMS intake. [D5, D8]

```jsonl
{
  "title": "string",
  "severity": "S0|S1|S2|S3",
  "category": "security|performance|code-quality|refactoring|documentation|process",
  "file": "path/to/file",
  "line": 42,
  "description": "string",
  "recommendation": "string",
  "source": "repo-analysis-<repo-slug>-<date>",
  "fingerprint": "<category>::<file>::<identifier>",
  "effort": "E0|E1|E2|E3",
  "confidence": 0-100,
  "files": [],
  "why_it_matters": "string",
  "suggested_fix": "string",
  "acceptance_tests": [],
  "evidence": []
}
```

### Artifact 3: `trends.jsonl` (append-only)

One record per analysis run. Enables trend detection over multiple runs. [D8]

```jsonl
{
  "analysis_id": "uuid",
  "timestamp": "ISO8601",
  "repo": "github.com/org/repo",
  "commit": "sha",
  "overall_band": "Healthy",
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
  "findings_by_severity": {
    "S0": 2,
    "S1": 8,
    "S2": 35,
    "S3": 39
  },
  "new_findings": 6,
  "resolved_findings": 12,
  "delta_overall": 6,
  "absence_patterns": [
    "security_facade"
  ],
  "regression_flags": []
}
```

### Artifact 4: `summary.md` (deep-plan injectable)

Structured Markdown following `## Research Context: Repo Analysis` header format
expected by deep-plan's DIAGNOSIS.md injection. [D8]

---

## 7. Comparison and Scoring Framework

### 7.1 Benchmarking Standards [D6]

**DORA 5 metrics (as of October 2025):** [V1-C014]

1. Deployment Frequency (Throughput)
2. Lead Time for Changes (Throughput)
3. Failed Deployment Recovery Time (Throughput)
4. Change Failure Rate (Instability)
5. **Rework Rate** (Instability) — the ratio of unplanned deployments caused by
   production bugs

IMPORTANT correction: The 5th metric is Rework Rate, not "Reliability."
Reliability was added as a quasi-metric in 2021 but is not counted in the
official 5. The 2025 DORA Report also abandoned four-tier
(elite/high/medium/low) in favor of seven team archetypes — an archetype
classifier may be more useful than a tiered score for target repos. [V1-C014,
D6]

**ISO 5055:** Automated code quality across Security, Reliability, Performance
Efficiency, Maintainability. Language-independent. Use for compliance-grade
comparison. [D6]

**SIG/Sigrid:** 30,000+ systems benchmarked; 3 stars = market average; 4-star
systems show 2x lower maintenance costs, 4x faster development velocity. [D6,
C-020]

**CSI formula (Aug 2025 validation):**
`CSI = 0.30·φ_commit + 0.25·φ_issue + 0.25·φ_PR + 0.20·φ_activity` [C-021]

### 7.2 Normalization Strategy [D6]

Recommended: contextual segmentation. Classify target repo before any
comparison:

- **Primary language** (controls LOC normalization baseline)
- **Project type** (library / application / framework / tooling)
- **Maturity** (Greenfield <2 years, Established 2-7 years, Legacy >7 years)
- **Team size proxy** (solo: 1; micro: 2-3; small: 4-10; large: 10+)

Compare within segment, not globally. Raw scores across segments are not
comparable. [D6]

### 7.3 Comparison Layer Architecture [D6]

- **Layer 0:** Segmentation (required before any comparison)
- **Layer 1:** 4-dimension structural quality (Security via OpenSSF, Reliability
  via static density, Maintainability via CodeScene/scc, Activity via CSI)
- **Layer 2:** DORA-adapted delivery (only if CI/CD data available)
- **Layer 3:** SPACEX productivity proxy (git-derived, optional)
- **Layer 4:** Composite with configurable weights (default: Structural 40%,
  Security 25%, Community 25%, Delivery 10%)

---

## 8. Temporal Fingerprint — 5-Signal Design [G2, OTB-1]

Every analysis run should record a temporal fingerprint even if deep mode is not
requested. The value compounds across runs — first run establishes baseline,
subsequent runs detect drift. [OTB-1-§3]

### The 5 Signals

| Signal                          | Extraction                                               | Why Diagnostic                                                                   |
| ------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Commit velocity trend           | Monthly commit counts, 12 months                         | Health trajectory: rising/stable/declining/dead/recovering                       |
| Contributor churn rate          | Unique active authors per month, trailing 6m vs prior 6m | Bus factor deterioration; single-author collapse = #1 abandonment predictor [G2] |
| Test-to-code ratio trajectory   | Test file count vs source file count, per quarter        | Rising = growing discipline; declining = coverage debt accumulation              |
| Dependency file touch frequency | Manifest file changes per quarter                        | High frequency = active maintenance; stale 6+ months = "Dependency Freeze"       |
| Code churn vs net growth        | Lines added minus deleted per month                      | High churn + low net growth = thrash; inverse = healthy feature growth           |

### Fingerprint Schema

```jsonl
{
  "repo": "owner/name",
  "fingerprint_date": "2026-03-31",
  "window_months": 12,
  "signals": {
    "commit_velocity": {
      "monthly_counts": [
        3,
        5,
        12,
        8,
        6,
        0,
        1,
        2,
        4,
        7,
        9,
        11
      ],
      "sparkline": "▂▃█▅▄▁▁▁▃▄▆▇",
      "trend": "recovering",
      "dead_months": 2
    },
    "contributor_health": {
      "bus_factor_trend": "declining",
      "solo_months": 5,
      "unique_contributors_12m": 4
    },
    "test_ratio_trajectory": {
      "quarterly_ratios": [
        0.18,
        0.19,
        0.17,
        0.16
      ],
      "trend": "declining"
    },
    "dependency_freshness": {
      "dep_file_last_touched_days_ago": 187,
      "trend": "stale"
    },
    "churn_vs_growth": {
      "pattern": "erratic_then_stable"
    }
  },
  "summary_indicators": {
    "velocity_trend": "recovering",
    "maintenance_risk": "medium",
    "bus_factor": 1,
    "test_discipline": "declining"
  }
}
```

### Trend Alert Thresholds [OTB-1-§3]

| Pattern               | Threshold                                             | Severity |
| --------------------- | ----------------------------------------------------- | -------- |
| Contributor cliff     | Active contributors drops >50% in 90 days             | HIGH     |
| Dependency spike      | Transitive dependency count increases >30% in 30 days | HIGH     |
| Test coverage decline | Coverage drops >10pp between versions                 | MEDIUM   |
| Commit halt           | Zero commits for 45+ days on previously active repo   | MEDIUM   |
| Issue age surge       | Median open issue age doubles in 60 days              | MEDIUM   |

**Ghost Ship threshold ambiguity:** Research shows no consensus. Academic
literature [G2-source-8] uses 6 months; `cargo-unmaintained` uses 1 year; OSSF
Scorecard uses 90 days. Use 180 days as the Ghost Ship detection threshold but
surface the raw "days since last commit" value for consumer judgment. [G2]

---

## 9. Absence Pattern Classifier — 7 Named Patterns [G2, OTB-1]

The absence classifier runs in Phase 2 after clone, synthesizing signals already
collected. No new tool calls needed — pure structural analysis of what is
missing and in what combination.

### The 7 Named Patterns

**Pattern: GHOST_SHIP**

- Detection: Last commit > 180 days AND `archived: false` in GitHub API
- Severity: CRITICAL (as dependency); HIGH (standalone)
- Signal: Most reliable single predictor of project abandonment [G2-source-8]

**Pattern: TEST_THEATER**

- Detection: `.github/workflows/` exists AND no step with `run:` contains a
  recognizable test command
- Test commands: `test`, `pytest`, `jest`, `rspec`, `go test`, `cargo test`,
  `mocha`, `vitest`, `phpunit`, `dotnet test`, `mvn test`, `gradle test`
- Severity: CRITICAL (worst pattern — CI infrastructure cost with zero quality
  signal)

**Pattern: SECURITY_FACADE**

- Detection: README contains security badge URLs (snyk.io/badge, security/badge)
  OR security keywords, but no `.github/dependabot.yml`, no security-scanning
  workflow steps, no `SECURITY.md`
- Severity: HIGH (false sense of security for consumers)

**Pattern: BORROWED_ARMOR**

- Detection: `SECURITY.md` present but contains `TODO`, `[PLACEHOLDER]`,
  `your@email.com`, or GitHub default template boilerplate
- Detection command:
  `grep -iE "TODO|placeholder|\[your|example\.com|maintainer@" SECURITY.md`
- Severity: IMPORTANT (misleads contributors)

**Pattern: DEPENDENCY_FREEZE**

- Detection: Manifest file (package.json, go.mod, requirements.txt) present AND
  manifest not modified in > 6 months AND dependency count > 5
- Severity: IMPORTANT (accumulating vulnerability exposure)
- Enhancement: Use `libyear` for version-lag-weighted staleness instead of file
  modification date alone [G2-serendipity]

**Pattern: LONE_WOLF**

- Detection: >90% of commits in last 12 months from single author AND no
  `.github/CODEOWNERS`
- Variant: VANISHING_WOLF — was multi-contributor 12 months ago, now solo
- Severity: IMPORTANT (bus factor = 1, no succession path)

**Pattern: SILENT_FAILURE**

- Detection: CI exists AND tests exist AND CI has test commands, but GitHub API
  shows no required status checks on default branch
- Severity: IMPORTANT (tests run but advisory, not gating)

### Absence Classifier Scoring

```
Start at 100
Deduct: CRITICAL patterns (-3 each), IMPORTANT patterns (-2 each), NICE-TO-HAVE (-1 each)
Normalize to applicable checks per repo type
Band result using the 4-band scale
```

Output in `analysis.json.absence_patterns[]` as named pattern labels. Detailed
evidence in `findings.jsonl`. [G2]

---

## 10. Strategic Intelligence — What Repo Analysis Reveals Beyond Code [D11, OTB-1]

### Team Intelligence Signals

| Signal                  | Observable Artifact                                       | Inference                                          |
| ----------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| Team size               | Commit timestamp variance + timezone spread               | Co-located vs. distributed                         |
| Hiring event            | Sudden new contributor cluster + CONTRIBUTING.md addition | Expansion underway                                 |
| Key person departure    | Consistent contributor activity → zero                    | Knowledge concentration risk                       |
| Work culture            | Weekend/evening commit ratio                              | Crunch vs. sustainable pace                        |
| Judgment under pressure | CVE patch latency vs. CVSS score                          | Quality of security response [OTB-1-§6]            |
| Consistency vs. heroism | CV of weekly commit count, 12 months                      | High variance = person-dependent output [OTB-1-§6] |

### Product Strategy Signals

| Signal               | Observable Artifact                  | Inference                            |
| -------------------- | ------------------------------------ | ------------------------------------ |
| Product pivot        | README significant rewrite           | Value proposition repositioning      |
| Enterprise readiness | SECURITY.md first commit date        | SOC2/enterprise sales ramp           |
| API maturity         | v2 route prefix introduction         | Locked-in users; forward evolution   |
| Framework migration  | package.json dependency diff history | Strategic tech investment [OTB-1-§5] |

### AI Adoption Detection [D11]

A 2026 study (arXiv 2601.17406) achieved 97.2% F1-score for AI agent
fingerprinting using 53 features. Claude Code signature: high conditional
density (27.2%), high comment density (19.8%). Important caveat: this accuracy
applies to agentic PRs, not human-plus-AI-suggestion hybrid use, where accuracy
drops significantly. [C-015]

GitClear data (211M changed lines, 2020-2024): code clone rate up from 8.3% to
12.3%, refactoring ratio down from 25% to <10%. This is a measurable quality
signal from AI adoption, not a theoretical concern. [D11]

### VC / Acquirer Due Diligence Thresholds [D11]

| Metric                      | Threshold | Risk                |
| --------------------------- | --------- | ------------------- |
| Bus Factor                  | = 1       | Critical            |
| Gini coefficient (commits)  | > 0.7     | Key person risk     |
| Single-contributor files    | > 25%     | Orphaned knowledge  |
| Orphaned file percentage    | > 20%     | Knowledge loss      |
| AGPL/GPL in transitive deps | Any       | Deal blocker in M&A |

The 2025 Black Duck report found 30% of M&A license conflicts stem from
transitive dependencies, not direct ones. [D11]

---

## 11. Skill Orchestration [D8, D9b-1, D9b-2]

### 11.1 Agent Allocation

The contrarian correctly challenged the
`N = N_dimensions + 2 + floor(N_dimensions / 4)` formula. The corrected
approach: start with `gsd-codebase-mapper`'s 4-axis model (tech, arch, quality,
concerns) as the base, then add specialized agents per detected stack.
[Contrarian-1-Challenge-1, V2-C005]

**Minimum viable agent pool (Standard mode, 6-dimension analysis):**

| Agent                 | Role                                            | Always? |
| --------------------- | ----------------------------------------------- | ------- |
| Orchestrator (inline) | Phase 0-1 pre-flight, state management          | Yes     |
| `gsd-codebase-mapper` | Initial map; tech, arch, quality, concerns axes | Yes     |
| `security-auditor`    | SAST + supply chain + OWASP                     | Yes     |
| `dependency-manager`  | CVE, license, freshness                         | Yes     |
| `code-reviewer`       | Quality, maintainability, error handling        | Yes     |
| Aggregation agent     | Reads dimension files, computes scores          | Yes     |

**Conditional additions:**

- `test-engineer`: when test infrastructure present
- `deployment-engineer`: when CI config present
- `backend-architect`: for API/backend repos
- `performance-engineer`: for repos with performance indicators
- Stack-specific agent (e.g., `nextjs-architecture-expert`): when stack detected

**Hard cap:** 4 concurrent agents (per CLAUDE.md concurrency constraint). Wave
staging required. [D8]

### 11.2 Staged Wave Execution [D8]

```
Phase 0: Inline orchestrator (no spawn) — Quick Scan
Phase 1: Inline orchestrator — clone execution
Phase 2: Dimension Wave — up to 4 concurrent agents
          Each agent writes dimensions/<dim>-findings.json before returning
          Orchestrator verifies file existence (does not trust return values)
Phase 3: History Wave (conditional) — up to 3 concurrent agents
Phase 4: Aggregation — 1 agent, sequential
Phase 4.5: TDMS dedup (inline, mandatory, before review)
Phase 5: Interactive review (3-5 findings per batch)
Phase 6: Routing menu
```

### 11.3 State Schema [D8]

Location: `.claude/state/repo-analysis.<repo-slug>.state.json`

```json
{
  "skill": "repo-analysis",
  "version": "1.0",
  "slug": "<repo-slug>",
  "target_repo": "github.com/org/repo",
  "target_commit": "<sha>",
  "status": "in-progress|complete|failed",
  "phase": 2,
  "depth": "quick|standard|deep",
  "dimensions_completed": [],
  "dimensions_failed": [],
  "clone_dir": "/tmp/repo-analysis-<slug>/",
  "clone_strategy": "blobless-shallow",
  "output_dir": ".research/<repo-slug>/",
  "agent_budget": { "allocated": 6, "spawned": 0, "completed": 0 },
  "startedAt": "ISO 8601",
  "completedAt": null
}
```

**Resume protocol:** Check for state file by `<repo-slug>`. If
`status=in-progress`, offer resume. If missing, scan `output_dir/dimensions/`
for existing files and infer resumption point. [D8]

### 11.4 Write-to-Disk-First Rule [D8]

Every agent writes its output file before returning. Orchestrator verifies file
existence — does not trust return-value content. Enables:

- Partial inspection before aggregation completes
- State survival across compaction
- Resume from last completed dimension on restart

### 11.5 Handoff to Deep-Plan [D8]

Route to `/deep-plan` when: >20 S0/S1 findings, any dimension below 40, systemic
architectural issue, or findings spanning 5+ files in the same subsystem.

Do not route to deep-plan when: ≤5 S0+S1 findings, all isolated, score delta
positive, user explicitly limits scope.

---

## 12. Internal Quality Rubric — Universal Patterns [D10a, D10b]

These patterns were extracted from our own codebase (CODE_PATTERNS.md v4.1,
distilled from 347 AI code reviews; SECURITY_CHECKLIST.md, 180+ patterns). They
represent what a "well-defended codebase" looks like in practice, not theory.
Use as the assessment rubric for external repos. [D9a-2, D10a, D10b]

### Critical Security Patterns (detect via SAST + regex scan)

| Ref   | Check                                                            |
| ----- | ---------------------------------------------------------------- | ------------------------- |
| U-S01 | No raw `error.message` in logs                                   |
| U-S02 | Path traversal uses `/^\.\.(?:[\\/]                              | $)/`not`startsWith('..')` |
| U-S05 | Process execution uses args array, not string interpolation      |
| U-S08 | ReDoS: length-bounded quantifiers `{1,N}` not `+` for user input |
| U-S17 | `eval` in shell replaced with direct execution                   |
| U-F01 | All file reads in try/catch (TOCTOU race)                        |
| U-F02 | Symlink check on target AND parent before write                  |
| U-R01 | `/g` flag on regexes in `while` + `exec()` loops                 |

### Critical CI/Automation Patterns

| Ref   | Check                                              |
| ----- | -------------------------------------------------- |
| U-C01 | CI uses lockfile (`npm ci`, not `npm install`)     |
| U-C02 | Third-party CI actions pinned to full SHA          |
| U-C07 | Cognitive complexity thresholds enforced (CC ≤ 15) |

### Three-Layer Enforcement Signal

A repo has "three-layer enforcement" when it has all of:

1. Automated hooks (pre-commit gates beyond standard linting)
2. AI-assisted review (code-reviewer or equivalent, not just PR comments)
3. A propagation/pattern registry (patterns added empirically from repeated
   violations)

Our codebase has all three. Most repos have one (linting only). A repo with two
layers is above average. A repo with all three is rare — flag as a best-practice
target for the `top_to_steal` section of `analysis.json`. [D9a-1, D9a-2, D10b]

---

## 13. Make-vs-Buy Analysis [G1, Contrarian-1-Challenge-6]

### What the Custom Skill Provides That No Commercial Platform Can

After reviewing CodeRabbit, Greptile, Sourcegraph Cody, and Qlty: [G1]

1. **Point-in-time external repo evaluation.** No commercial tool accepts a
   GitHub URL and returns a structured health report without first installing
   the tool as a GitHub App on connected repos. The dependency evaluation use
   case has no commercial answer.

2. **Native SoNash workflow integration.** Commercial tools do not know about
   TDMS, hook-checks.json, or the agent orchestration framework. Findings from
   commercial tools cannot feed into the debt pipeline.

3. **Composite cross-dimension scoring with custom weights.** No commercial
   platform lets you define weighting across Security / Maintainability /
   Community / Delivery dimensions.

4. **Full offline operation.** CodeRabbit and Greptile (Cloud) send code to
   third-party LLMs. The custom skill sends code only to Anthropic, which is
   already the declared trust boundary.

### What Commercial Platforms Do Better

1. **Ongoing PR review at scale.** CodeRabbit (82% bug catch rate with agentic
   use per Greptile comparison; $24/dev/month) and Greptile ($30/seat/month)
   have processed millions of PRs and have calibration data the custom skill
   cannot replicate. For ongoing PR review on your own repos, commercial tools
   are strictly better.

2. **Full codebase semantic search.** Greptile builds a code graph. Sourcegraph
   provides cross-repo semantic search. Neither is replicated by `rg` +
   `semgrep`.

3. **Team collaboration features.** PR comments, @mentions, inline review
   assignment — commercial tools are native to GitHub's review workflow.

### Recommendation

| Use Case                        | Recommendation                              |
| ------------------------------- | ------------------------------------------- |
| Evaluate external dependencies  | Custom skill (only viable option)           |
| Point-in-time audit reports     | Custom skill (structured SARIF/TDMS output) |
| TDMS intake from analysis       | Custom skill (native compatibility)         |
| Air-gapped / work locale        | Custom skill (no new vendor relationships)  |
| Quick triage of N repos         | Custom skill Quick Scan mode                |
| Ongoing PR review (own repo)    | Commercial tool (CodeRabbit $24/dev)        |
| Semantic search at scale        | Sourcegraph Cody or Greptile                |
| Test coverage trends (own repo) | Qlty CLI (free, Rust binary, open source)   |

**The honest threshold:** For ongoing PR review of your own codebase at
$24/dev/month for a solo operator ($288/year), the custom skill cannot be built,
maintained, and improved for that cost. The custom skill's economic
justification is external repo evaluation + SoNash workflow integration + custom
scoring — not ongoing PR review. [G1]

**Qlty CLI note:** The Qlty CLI (formerly CodeClimate, free, open source, Rust
binary, 70+ tools) is not a competitor to the custom skill — it is a potential
Tier 2 component in the tool stack. [G1-serendipity]

---

## 14. Guard Rails [D7, G1]

### Rate Limits

- Always authenticate; never unauthenticated API calls
- Check `/rate_limit` before each analysis batch; abort if `remaining < 200`
- Cache ETag on every GET; use `If-None-Match` on subsequent polls
- Core, search, code_search, and GraphQL are independent rate limit buckets
- On 429 or 403: read `retry-after` header; wait + backoff; never retry
  immediately
- GitHub App installation tokens expire in 1 hour (NOT 8 hours — user access
  tokens are 8 hours) [C-011]

### Large Repository Safety

- Skip statistics endpoints for repos with ≥10,000 commits; use git log fallback
  [C-014]
- Handle HTTP 202 on statistics endpoints (retry after 3-5 seconds; limit 5
  retries)
- Never trust the `size` field as authoritative (treat as rough
  order-of-magnitude)
- Use Git Trees API (not Contents API) for full file enumeration
- Check `truncated: true` on Trees API responses (cap: 100,000 entries, 7 MB)
  [C-012]
- GitHub Linguist fails for repos >100,000 files; fall back to local `scc`

### Monorepo Handling

- Check for multiple monorepo indicators (pnpm + Turborepo simultaneously is
  valid)
- Parse workspace globs for sub-package paths; do not assume `packages/` or
  `apps/`
- Analyze each sub-package independently when monorepo contains discrete
  deployables

### Edge Cases

- Fork detection: always fetch full repo object for `parent` and `source`
  fields; flag forks in output
- Archive detection: `archived: true` is reliable; archive date requires GraphQL
  `archivedAt`
- LFS: check `.gitattributes` before cloning; never trust `size` for LFS repos
- Empty repos: use Contents API (HTTP 404 with "Git Repository is empty");
  return graceful finding
- Home repo guard: if target URL matches known home repo, warn and offer to
  route to `/audit-comprehensive` instead [D8]
- Private repo support: V2 concern; all current patterns operate on public repos
  [D8]

### Trivy Supply Chain Attack

Trivy (CVE-2026-33634, March 2026) — CRITICAL operational security item:
[V1-C005]

- Compromised: v0.69.4 (binary), v0.69.5 and v0.69.6 (Docker Hub)
- Google's `mirror.gcr.io` continued serving malicious v0.69.6 after Docker Hub
  cleanup — pin to digest, not tag, in Kubernetes environments
- Safe: v0.69.3 or earlier; `trivy-action@v0.35.0` (SHA: 57a97c7);
  `setup-trivy@v0.2.6` (SHA: 3fb12ec)
- If any pipeline ran v0.69.4–v0.69.6: rotate ALL secrets immediately

---

## 15. Contrarian Adjustments [Contrarian-1]

### Challenge 1: Overengineering (20-agent formula)

**Concession:** The formula `N = N_dimensions + 2 + floor(N_dimensions / 4)`
overcounts. A single `gsd-codebase-mapper` agent covers 4 dimensions natively
(tech, arch, quality, concerns). The minimum viable pool is 5-6 agents for a
standard run.

**Resolution:** Replace the formula with the `gsd-codebase-mapper`-first
approach. Add specialized agents only when the detected stack or scope warrants
them. The formula is retained as an upper-bound estimate for Deep mode with full
dimension set.

**Not conceded:** Multi-agent parallelism for Standard and Deep modes is still
justified — not because individual tools are slow, but because dimension agents
need dedicated context windows for quality output.

### Challenge 2: Tool Sprawl (30 tools)

**Concession:** Cataloging 30 tools as the "recommended stack" was overreach.
The minimum viable stack is 5-7 core tools (Tier 1). Tool half-lives are real (4
documented abandonments in the research period). A 30-tool stack is a 30-point
maintenance exposure for a solo operator.

**Resolution:** Tiers 1/2/3 architecture above. Tool selection follows
detection: only install what the analyzed repo's language stack requires.

**Not conceded:** The full catalog remains as documentation of what exists and
what to use for specific dimensions. It is a reference, not a deployment
manifest.

### Challenge 3: False Precision in Scoring

**Concession:** `74/100` as a headline number implies measurement precision the
underlying tools do not support (±10-15 points given FP rates). Numeric
composite scores are not the primary display.

**Resolution:** Band + score in parentheses (`Healthy (74)`) as primary display.
Numeric scores retained for trend tracking. "Critical Health Metric" mode
(minimum across dimensions) is mandatory secondary indicator alongside averages.

### Challenge 4: No Quick Scan Mode

**Concession:** This was a real gap. The pipeline going straight from Phase 0 to
clone meant a 5-30 second difference between Quick Scan and Standard was
invisible to the user.

**Resolution:** Quick Scan is now the DEFAULT mode. Standard and Deep are
explicit opt-ins. Phase 0 is the entry point, not a pre-amble to clone.

### Challenge 5: Strategic Intelligence Overreach

**Partial concession:** Team topology visibility, AI code identification, and
private repo industry benchmarking are not buildable by a single skill running
on one machine. They require data networks or organizational access the skill
cannot have.

**Resolution:** Strategic intelligence is framed as "signals derivable from
standard analysis artifacts" — not as features. The signals (hiring events,
framework migrations, AI adoption indicators) are surfaced as observations with
explicit confidence levels, not as computed scores.

### Challenge 6: Competitive Landscape (Greptile, CodeRabbit)

**Concession:** Both tools were absent from the original synthesis. Greptile
(82% bug catch rate with full-codebase context) and CodeRabbit ($24/dev/month,
13M+ PRs processed) are genuine competitors for ongoing PR review.

**Resolution:** Make-vs-Buy section above documents both honestly. The
conclusion is that CodeRabbit and Greptile solve a different problem (ongoing PR
review of your own code) than the custom skill (point-in-time evaluation of
external repos). They are not alternatives; they are complements.

---

## 16. Gaps and Future Work

| Gap                                                                                          | Source         | Priority                   |
| -------------------------------------------------------------------------------------------- | -------------- | -------------------------- |
| Private repo support (credential passing to clone agent)                                     | D8             | V2                         |
| Build time not quantified (2-4 days for Quick Scan; 2-4 weeks for full pipeline)             | G1             | Pre-build                  |
| Annual maintenance burden not quantified for full tool stack                                 | G1             | Pre-build                  |
| golangci-lint v2 exact `--output.json.path` syntax — verify against current docs             | D2a-1, C-039   | Before Go analysis         |
| Python framework detection — no equivalent to Netlify's framework-info                       | D4             | V1.1                       |
| git log performance on Windows — no benchmark (all estimates are Linux/macOS)                | G2             | Pre-deployment             |
| Test Theater false negatives — `make ci` calling tests not detected                          | G2             | V1.1                       |
| Exact unauthenticated GitHub API rate limits post-May 2025                                   | D7             | Before unauthenticated use |
| GraphQL resource limits (Sept 2025) — GitHub declined to publish exact thresholds            | D7             | Monitor                    |
| `brief` tool evaluation as absence classifier substrate                                      | G2-serendipity | V1.1                       |
| `/repo-watch` subcommand for persistent repo monitoring                                      | OTB-1-§3       | V2                         |
| Portfolio analysis mode (`--portfolio github.com/username`)                                  | OTB-1-§2       | V2                         |
| Due diligence mode (`--mode=due-diligence`) with 5 additional signals                        | OTB-1-§6       | V2                         |
| Generative outputs: dependabot.yml generator, CI skeleton generator                          | OTB-1-§7       | V1.1                       |
| CodeRabbit / Greptile current capabilities should be re-verified before make-vs-buy decision | G1             | Before buy decision        |

---

## 17. Serendipity Catalog

All unexpected findings worth preserving from across the research. [D2a-1
through D12, V1, G1, G2, OTB-1]

1. **ESLint's `lintText()` API** can analyze code without any filesystem access
   — directly on content fetched via GitHub Contents API. Enables pre-clone
   linting of individual files. [D2a-1, C-029]

2. **scc's LOCOMO metric** (`--locomo` flag) estimates LLM cost-to-regenerate
   per file alongside traditional COCOMO. Unique capability across all LOC
   tools. [D2a-3, V1-C016]

3. **Knip's official MCP server** (`@knip/mcp`, npm version 0.0.23) enables
   dead-code detection directly from Claude without CLI invocation. [V1-C010]

4. **Trivy mirror hazard:** Google's `mirror.gcr.io` (containerd's default
   registry mirror) was still serving malicious Trivy v0.69.6 after Docker Hub
   cleanup. Kubernetes environments may be pulling compromised images even after
   pin-to-tag remediation. The correct remediation is pin-to-digest. [V1-C005]

5. **DORA 2025 archetype model:** The 2025 DORA Report abandoned four-tier
   (elite/high/medium/low) in favor of seven team archetypes. An archetype
   classifier may produce more useful repo comparisons than a tiered score.
   [V1-C014, D6]

6. **OpenSSF Scorecard v6 roadmap:** Evolving from "a scoring tool" to "an open
   source security evidence engine" with SARIF-native output. Future versions
   will provide output that integrates more naturally with the skill's schema.
   [G1-serendipity]

7. **Qlty CLI is free, open-source Rust binary:** Formerly CodeClimate; supports
   70+ static analysis tools. Not a competitor to the custom skill — a potential
   free component in the tool stack. [G1-serendipity]

8. **Repo Doctor precedent:** An AI-powered tool (2025) already implements the
   exact Phase 0 Quick Scan design: GitHub API only, ~20 file reads, six
   categories, upgradable to deep scan. Independent validation that the Phase 0
   design is technically feasible and practically useful. [G1-serendipity]

9. **`brief` tool for absence detection:** A deterministic tool that detects
   language, package manager, test framework, linter, CI system, and project
   resources in JSON with confidence levels. Implementing the absence classifier
   with `brief` as substrate would eliminate ~60% of the implementation.
   [G2-serendipity]

10. **`libyear` metric** quantifies dependency staleness as a single number (sum
    of years between current and latest version across all deps). More precise
    than Dependency Freeze (which uses file modification date). [G2-serendipity]

11. **`git_time_extractor`** detects "death marches" in development by analyzing
    commit timing patterns — a temporal pattern directly relevant to team health
    signals and not covered in the primary research. [G2-serendipity]

12. **OSSF Scorecard JSON output mode** (`scorecard --format json`) maps
    directly to absence patterns. Running as a subprocess would provide 20
    pre-scored absence signals out of the box, potentially replacing the entire
    Tier 3 security detection layer. [G2-serendipity]

13. **Fork-to-star ratio as adoption signal:** A ratio above 0.15 means people
    are building on the project. Below 0.03 on a 1,000+ star project is
    "bookmark bait." More diagnostic than star count alone. [OTB-1-§1]

14. **Star velocity over star count:** The shape of the star accumulation curve
    (spike-and-decay / steady ramp / staircase / cliff) reveals project
    lifecycle stage more accurately than the total count. Four distinct curve
    shapes with distinct interpretations. [OTB-1-§1]

15. **Code Climate → Qlty spinout clarification:** CodeClimate was NOT acquired
    and did NOT redirect to qlty.sh. The Quality product line was spun out as a
    separate company. CodeClimate as a brand persists. [V1-C013]

---

## 18. Sources — Tiered by Authority

### Tier 1 — Official Documentation and Standards

[S-001] GitHub REST API Rate Limits —
https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
[S-005] GitHub REST API: Repositories —
https://docs.github.com/en/rest/repos/repos [S-006] GitHub REST API: Community
Profile — https://docs.github.com/en/rest/metrics/community [S-009] GitHub REST
API: Dependabot Alerts — https://docs.github.com/en/rest/dependabot/alerts
[S-010] GitHub REST API: Code Scanning —
https://docs.github.com/en/rest/code-scanning/code-scanning [S-011] GitHub REST
API: Secret Scanning —
https://docs.github.com/en/rest/secret-scanning/secret-scanning [S-023] OpenSSF
Scorecard GitHub — https://github.com/ossf/scorecard [S-025] OpenSSF Scorecard
API — https://scorecard.dev/ [S-027] Trivy Supply Chain Advisory
(CVE-2026-33634) —
https://github.com/aquasecurity/trivy/security/advisories/GHSA-69fq-xp46-6x23
[S-028] Trivy Security Incident Discussion —
https://github.com/aquasecurity/trivy/discussions/10425 [S-029] Microsoft
Security Blog: Trivy Compromise —
https://microsoft.com/en-us/security/blog/2026/03/24/detecting-investigating-defending-against-trivy-supply-chain-compromise/
[S-033] SARIF 2.1.0 OASIS Standard —
https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html [S-039] DORA
Metrics Official Site — https://dora.dev/ [S-045] ISO 5055 / CISQ Standards —
https://www.it-cisq.org/standards/code-quality-standards/ [S-060] deps.dev API —
https://docs.deps.dev/ [S-061] OSV-Scanner v2 —
https://google.github.io/osv-scanner/

### Tier 2 — Official Tool and Platform Documentation

[S-021] Partial Clone and Shallow Clone (GitHub Blog) —
https://github.blog/open-source/git/get-up-to-speed-with-partial-clone-and-shallow-clone/
[S-022] Git Clone Data-Driven Study —
https://github.blog/open-source/git/git-clone-a-data-driven-study-on-cloning-behaviors/
[S-031] Tree-sitter — https://github.com/tree-sitter/tree-sitter [S-052]
Cognitive Complexity White Paper (SonarSource) —
https://www.sonarsource.com/resources/cognitive-complexity/ [S-053] CodeScene:
Behavioral Code Analysis —
https://codescene.com/product/behavioral-code-analysis [S-057] Code Climate →
Qlty Transition —
https://codeclimate.com/blog/code-climate-quality-is-now-qlty-software [S-065]
Semgrep Community Edition — https://semgrep.dev/products/community-edition/
[S-069] ESLint Node.js API (lintText) —
https://eslint.org/docs/latest/integrate/nodejs-api [S-075] jscpd (MCP native) —
https://github.com/kucherenko/jscpd [S-076] Lizard complexity analyzer —
https://github.com/terryyin/lizard [S-078] scc (LOCOMO metric) —
https://github.com/boyter/scc [S-081] dependency-cruiser —
https://github.com/sverweij/dependency-cruiser [S-082] Knip (dead code) —
https://github.com/webpro-nl/knip [S-086] Aider Repo-Map —
https://aider.chat/docs/repomap.html [S-114] SIG Sigrid: 4-star = 2x lower
maintenance —
https://www.softwareimprovementgroup.com/sigrid/code-quality-maintainability/
[S-120] GitHub Community Profiles —
https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/about-community-profiles-for-public-repositories

### Tier 3 — Academic, Blogs, and Community Sources

[S-042] DORA 5th Metric: Rework Rate (CD Foundation) —
https://cd.foundation/blog/2025/10/16/dora-5-metrics/ [S-043] SPACEX Framework
(arXiv Nov 2025) — https://arxiv.org/html/2511.20955v1 [S-048] CSI Formula
Empirical Validation (arXiv Aug 2025) — https://arxiv.org/html/2508.01358v1
[S-049] AI Coding Agent Fingerprinting 97.2% F1 (arXiv 2026) —
https://arxiv.org/html/2601.17406v1 [S-093] Lost in the Middle: LLM Context
(arXiv Oct 2025) — https://arxiv.org/html/2510.05381v1 [S-094] Reducing FP with
LLMs (arXiv Jan 2026) — https://arxiv.org/html/2601.18844 [S-107] GitClear AI
Code Quality 2025 —
https://www.gitclear.com/ai_assistant_code_quality_2025_research

### Gap Research Sources (New in this pass)

[G1-S001] GitHub REST API: Workflow Runs —
https://docs.github.com/en/rest/actions/workflow-runs [G1-S008] CodeRabbit
Pricing — https://www.coderabbit.ai/pricing [G1-S010] Greptile Pricing —
https://www.greptile.com/pricing [G1-S014] Qlty Pricing —
https://qlty.sh/pricing [G2-S001] OSSF Scorecard Checks —
https://github.com/ossf/scorecard/blob/main/docs/checks.md [G2-S004] hercules
git analytics — https://github.com/src-d/hercules [G2-S008] Identifying
Unmaintained Projects in GitHub (arXiv/ESEM 2018) —
https://arxiv.org/abs/1809.04041 [G2-S009] GitHub REST API: Community Metrics —
https://docs.github.com/en/rest/metrics/community [V1-S001] Trivy Advisory
GHSA-69fq-xp46-6x23 —
https://github.com/aquasecurity/trivy/security/advisories/GHSA-69fq-xp46-6x23
[V1-S012] DORA 5 Metrics — CD Foundation —
https://cd.foundation/blog/2025/10/16/dora-5-metrics/ [V1-S014] scc GitHub
(LOCOMO) — https://github.com/boyter/scc

---

## 19. Methodology

**Agents used:** 3 phases of research

- Phase 1: 15 external searcher agents (D1a, D1b, D2a-1 through D2a-4, D2b, D3a,
  D3b, D4, D5, D6, D7, D11, D12)
- Phase 1 internal: 7 internal codebase searcher agents (D8, D9a-1, D9a-2,
  D9b-1, D9b-2, D10a, D10b)
- Phase 2 synthesis: SYNTHESIS_EXTERNAL.md + SYNTHESIS_INTERNAL.md
- Phase 3 verification: V1 (tool/API claims), V2 (internal claims — 2
  refutations found)
- Phase 4 challenge: Contrarian-1 (6 challenges), OTB-1 (7 opportunities)
- Phase 5 gap resolution: G1 (Quick Scan + Make-vs-Buy), G2 (Temporal
  Fingerprint + Absence Patterns)
- Phase 6 final synthesis: This document

**Key corrections from verification passes:**

- Skill count: 65 (not 62) — V2
- Agent count: 57 (not 39) — V2
- Trivy attack scope understated — mirror.gcr.io hazard added — V1
- DORA 5th metric is Rework Rate (not Reliability) — V1
- API coverage is 40-55% partial / 40% full (not a flat 40%) — G1
- CodeClimate was spun out, not acquired/redirected — V1
- Quick Scan is now the DEFAULT mode (not an option) — Contrarian-1
- Scoring uses bands not false-precision composites — Contrarian-1
- Agent formula replaced by gsd-codebase-mapper-first approach — Contrarian-1
