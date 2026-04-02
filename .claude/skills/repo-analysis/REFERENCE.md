<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-02
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Repo Analysis Reference

Dimension catalog, tool stack, output schemas, absence pattern definitions,
temporal fingerprint specification, scoring bands, and guard rail rules for the
repo-analysis skill.

---

## 1. Analysis Dimensions Catalog

Organized by the depth tier in which each dimension first becomes available.
Signal and Automation ratings are on a 1-5 scale.

### 1.1 Quick Scan Dimensions (API-only, 18 dimensions)

| #     | Dimension                               | Signal | Auto | Source                           |
| ----- | --------------------------------------- | ------ | ---- | -------------------------------- |
| QS-01 | Project activity and recency            | 5/5    | 5/5  | `pushed_at` + workflow runs      |
| QS-02 | Stars/forks/engagement trajectory       | 3/5    | 4/5  | Stargazers API (with timestamps) |
| QS-03 | Archived/abandoned status               | 5/5    | 5/5  | REST metadata `archived` field   |
| QS-04 | License type and presence               | 4/5    | 5/5  | REST metadata + community health |
| QS-05 | CI/CD presence and pass rate            | 5/5    | 5/5  | Workflow list + last N runs      |
| QS-06 | Branch protection rules                 | 5/5    | 5/5  | GraphQL `branchProtectionRules`  |
| QS-07 | Dependabot alert count + severity       | 5/5    | 5/5  | REST dependabot/alerts           |
| QS-08 | Code scanning alerts (CodeQL)           | 5/5    | 5/5  | REST code-scanning/alerts        |
| QS-09 | Secret scanning alerts                  | 5/5    | 5/5  | REST secret-scanning/alerts      |
| QS-10 | Community health completeness           | 4/5    | 5/5  | REST community/profile (0-100)   |
| QS-11 | CONTRIBUTING/SECURITY file presence     | 4/5    | 5/5  | Community profile response       |
| QS-12 | Contributor count (bus factor proxy)    | 5/5    | 5/5  | REST contributors endpoint       |
| QS-13 | Merge hygiene settings                  | 3/5    | 5/5  | REST metadata merge flags        |
| QS-14 | OpenSSF 16-check security score         | 5/5    | 5/5  | `api.securityscorecards.dev`     |
| QS-15 | Dependency SBOM (direct + transitive)   | 4/5    | 5/5  | REST dependency-graph/sbom       |
| QS-16 | Known CVEs via deps.dev                 | 5/5    | 5/5  | `api.deps.dev` (no auth)         |
| QS-17 | Fork-to-star ratio (adoption signal)    | 4/5    | 5/5  | Computed from metadata           |
| QS-18 | Watcher-to-star ratio (operational use) | 3/5    | 5/5  | Computed from metadata           |

**API batch structure for Quick Scan:**

- **Batch A (GitHub REST/GraphQL):** repo metadata, community/profile,
  dependabot/alerts, code-scanning/alerts, secret-scanning/alerts,
  actions/workflow-runs (last 10), contributors (top 500),
  dependency-graph/sbom, GraphQL branchProtectionRules + securityAndAnalysis
- **Batch B (OpenSSF):**
  `GET api.securityscorecards.dev/projects/github.com/{owner}/{repo}` (404 = not
  indexed, continue gracefully)
- **Batch C (deps.dev):**
  `GET api.deps.dev/v3alpha/systems/{ecosystem}/packages/{name}` for primary
  manifest dependencies (no auth required)

All three batches run in parallel.

### 1.2 Standard Mode Dimensions (requires clone, 15 dimensions)

| #     | Dimension                            | Signal | Auto | Tool                                   |
| ----- | ------------------------------------ | ------ | ---- | -------------------------------------- |
| ST-01 | Cyclomatic complexity                | 4/5    | 5/5  | `lizard` (26 languages)                |
| ST-02 | Cognitive complexity                 | 5/5    | 4/5  | `rust-code-analysis` (where supported) |
| ST-03 | Code duplication                     | 4/5    | 5/5  | `jscpd` (150+ languages)               |
| ST-04 | LOC and file/function size metrics   | 3/5    | 5/5  | `scc` (322 languages)                  |
| ST-05 | Dead code / unused exports           | 4/5    | 4/5  | `knip` (JS/TS), `vulture` (Python)     |
| ST-06 | Dependency direction + circular deps | 5/5    | 4/5  | `dependency-cruiser` (JS/TS)           |
| ST-07 | SAST vulnerability detection         | 5/5    | 5/5  | `semgrep` (30+ languages)              |
| ST-08 | Type safety coverage                 | 4/5    | 5/5  | `type-coverage` (TS), `mypy` (Python)  |
| ST-09 | Test coverage presence/maturity      | 4/5    | 4/5  | Detect framework config + file ratio   |
| ST-10 | Secrets in current code              | 5/5    | 5/5  | `gitleaks` (150+ patterns)             |
| ST-11 | Architecture pattern compliance      | 5/5    | 3/5  | AST-based + `dependency-cruiser` rules |
| ST-12 | Naming convention consistency        | 3/5    | 5/5  | Linter rules (language-specific)       |
| ST-13 | Error handling quality               | 5/5    | 4/5  | `semgrep` rules + AST analysis         |
| ST-14 | Absence pattern classification       | 5/5    | 5/5  | Multi-source classifier (7 patterns)   |
| ST-15 | Framework/stack detection            | 3/5    | 5/5  | Manifest + config file heuristics      |

### 1.3 Deep Mode Dimensions (requires 12-month history, 12 dimensions)

| #     | Dimension                                 | Signal | Auto | Tool                                     |
| ----- | ----------------------------------------- | ------ | ---- | ---------------------------------------- |
| DP-01 | Code churn hotspots                       | 5/5    | 4/5  | `git log --numstat`                      |
| DP-02 | Temporal coupling (co-change pairs)       | 5/5    | 3/5  | `git log` + frequency analysis           |
| DP-03 | Contributor health (bus factor trend)     | 5/5    | 5/5  | `git shortlog` + 6-month window          |
| DP-04 | Commit velocity trend (sparkline)         | 5/5    | 5/5  | `git log` monthly aggregation            |
| DP-05 | Test-to-code file ratio trajectory        | 4/5    | 4/5  | `git ls-files` + quarterly comparison    |
| DP-06 | Dependency file touch frequency           | 4/5    | 5/5  | `git log --follow` on manifest files     |
| DP-07 | Secrets in history                        | 5/5    | 5/5  | `trufflehog git <url>` (no clone needed) |
| DP-08 | PR merge time and review velocity         | 5/5    | 4/5  | GitHub API pulls history                 |
| DP-09 | Issue response time                       | 5/5    | 4/5  | GitHub API issues history                |
| DP-10 | Dependency biography (migration history)  | 4/5    | 3/5  | `git log --follow -p -- package.json`    |
| DP-11 | Organizational contributor diversity      | 4/5    | 3/5  | Email-to-org heuristics                  |
| DP-12 | DORA proxy metrics (lead time, frequency) | 4/5    | 4/5  | GitHub Actions + PR data                 |

---

## 2. Tool Stack

### Tier 1 -- Core (install always for Standard/Deep)

| Tool              | Version | License     | Purpose                          | Selection rationale                                |
| ----------------- | ------- | ----------- | -------------------------------- | -------------------------------------------------- |
| `scc`             | latest  | MIT         | LOC counting, COCOMO/LOCOMO cost | Fastest; 322 languages; LLM cost via `--locomo`    |
| `semgrep`         | CE      | LGPL engine | SAST, pattern detection          | 30+ languages; 3,000+ rules; 10s typical scan      |
| `lizard`          | 1.21.3+ | MIT         | Cyclomatic complexity            | 26 languages; `#lizard forgives` suppression       |
| `jscpd`           | latest  | MIT         | Code duplication detection       | 150+ languages; Rabin-Karp; SARIF output           |
| `gitleaks`        | v8.28+  | MIT         | Secrets in current code          | 150+ types; SARIF; fast regex                      |
| `git-quick-stats` | latest  | MIT         | Temporal signal extraction       | Zero dependencies; `--json-output`; date filtering |

### Tier 2 -- Language-Conditional (install when detected)

| Trigger         | Tool                      | Purpose                                                           |
| --------------- | ------------------------- | ----------------------------------------------------------------- |
| JS/TS detected  | `knip` v6+                | Dead code, unused exports, orphaned types                         |
| JS/TS detected  | `dependency-cruiser` v17+ | Module dependencies, circular detection, DOT/Mermaid output       |
| JS/TS detected  | `eslint` v9+              | Linting; `lintText()` API for pre-clone analysis                  |
| Python detected | `vulture` v2.16+          | Dead code with confidence percentages                             |
| Python detected | `ruff`                    | Fast linting (replaces pylint for speed)                          |
| Go detected     | `golangci-lint` v2+       | Aggregated linting; use `--output.json.path` (NOT `--out-format`) |
| Multi-language  | `ast-grep` 0.42+          | Pattern-based structural search; 30 languages; Rust speed         |

### Tier 3 -- Optional / Deep Mode Only

| Tool             | Purpose                                    | When                                 |
| ---------------- | ------------------------------------------ | ------------------------------------ |
| `trufflehog`     | Secrets in git history (API-only mode)     | Deep mode DP-07                      |
| `osv-scanner` v2 | SCA with guided remediation                | When deep dependency audit requested |
| `ts-morph`       | TypeScript-specific dead code + type infer | TS repos needing deep type analysis  |
| `code-maat`      | Temporal coupling extraction (CSV)         | When DP-02 analysis requested        |

### Tools to Avoid

| Tool                     | Reason                                                         |
| ------------------------ | -------------------------------------------------------------- |
| `trivy` v0.69.4--v0.69.6 | Supply chain attack (CVE-2026-33634); safe: v0.69.3 or earlier |
| `plato`                  | Abandoned 2014                                                 |
| `ts-prune`               | Archived Sep 2025; replaced by Knip                            |
| `unimported`             | Archived Mar 2024; replaced by Knip                            |
| `MegaLinter` as default  | AGPL-3.0; high maintenance cost; Docker overhead               |

---

## 3. Output Schemas

Four primary artifacts plus one injectable Markdown summary. All written to
`.research/<repo-slug>/`.

### 3.1 `analysis.json`

Top-level analysis result. Consumed by `/deep-plan` as research context and by
the Compare resume option.

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
    "analysis_mode": "quick|standard|deep"
  },
  "summary": {
    "overall_band": "Critical|Needs Work|Healthy|Excellent",
    "overall_score": 74,
    "critical_health_metric": 52,
    "trend": "improving|stable|declining|new",
    "delta_from_previous": 6,
    "one_sentence": "Well-structured codebase with strong CI, weak security posture.",
    "top_priority_action": "Add rate limiting to Cloud Functions endpoints"
  },
  "dimensions": {
    "security": { "band": "Needs Work", "score": 52, "delta": -4 },
    "reliability": { "band": "Healthy", "score": 78, "delta": 2 },
    "maintainability": { "band": "Excellent", "score": 81, "delta": 5 },
    "documentation": { "band": "Healthy", "score": 66, "delta": 0 },
    "process": { "band": "Excellent", "score": 88, "delta": 8 },
    "velocity": { "band": "Healthy", "score": 71, "delta": -1 }
  },
  "absence_patterns": ["security_facade"],
  "actionable_insights": {
    "top_to_steal": [],
    "top_to_avoid": []
  }
}
```

**Field definitions:**

| Field                    | Type   | Description                                                |
| ------------------------ | ------ | ---------------------------------------------------------- |
| `analysis_id`            | string | UUID v4, unique per run                                    |
| `timestamp`              | string | ISO 8601 timestamp of analysis completion                  |
| `target_repo`            | string | Full GitHub path `owner/repo`                              |
| `target_commit`          | string | HEAD commit SHA at time of analysis                        |
| `language`               | string | Primary language by LOC                                    |
| `loc`                    | number | Total lines of code (from `scc` or API estimate)           |
| `analysis_mode`          | string | Depth tier: `quick`, `standard`, or `deep`                 |
| `overall_band`           | string | Categorical band (see scoring bands below)                 |
| `overall_score`          | number | Weighted average, 0-100 (internal, for trend tracking)     |
| `critical_health_metric` | number | Minimum score across all dimensions (mandatory secondary)  |
| `trend`                  | string | Direction vs previous run: improving/stable/declining/new  |
| `delta_from_previous`    | number | Score change from last run (0 if first run)                |
| `one_sentence`           | string | Human-readable summary, one sentence                       |
| `top_priority_action`    | string | Single most impactful recommended action                   |
| `dimensions.*`           | object | Per-dimension band, score (0-100), and delta from previous |
| `absence_patterns`       | array  | Named patterns detected (see Section 5)                    |
| `actionable_insights`    | object | Top patterns to adopt from and top anti-patterns to avoid  |

**Critical Health Metric:** The minimum score across all 6 dimensions. A repo
with a 90 average but a 15 security score is `Critical` regardless of average.
Display alongside overall band: `Healthy (74) | Critical floor: Security (52)`.

### 3.2 `findings.jsonl` (TDMS-compatible)

One record per finding. Schema matches `docs/templates/JSONL_SCHEMA_STANDARD.md`
for direct TDMS intake compatibility.

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

**Field definitions:**

| Field              | Type   | Description                                      |
| ------------------ | ------ | ------------------------------------------------ |
| `title`            | string | Short finding title                              |
| `severity`         | string | S0 (critical) through S3 (informational)         |
| `category`         | string | Finding category matching TDMS taxonomy          |
| `file`             | string | Relative file path in analyzed repo              |
| `line`             | number | Line number (0 if not applicable)                |
| `description`      | string | Full finding description                         |
| `recommendation`   | string | Recommended action                               |
| `source`           | string | Attribution: `repo-analysis-<slug>-<YYYY-MM-DD>` |
| `fingerprint`      | string | Dedup key: `<category>::<file>::<identifier>`    |
| `effort`           | string | E0 (trivial) through E3 (major)                  |
| `confidence`       | number | 0-100 confidence in finding accuracy             |
| `files`            | array  | Additional affected files                        |
| `why_it_matters`   | string | Impact explanation                               |
| `suggested_fix`    | string | Concrete fix suggestion                          |
| `acceptance_tests` | array  | How to verify the fix                            |
| `evidence`         | array  | Supporting evidence (tool output, code snippets) |

### 3.3 `value-map.json`

Ranked list of extraction candidates. Produced by Standard and Deep modes.
Consumed by the Extract routing option.

```json
{
  "$schema": "repo-analysis-value-map/v1",
  "repo": "github.com/org/repo",
  "analysis_id": "uuid-v4",
  "timestamp": "ISO8601",
  "candidates": [
    {
      "rank": 1,
      "name": "Rate limiting middleware",
      "description": "Express middleware implementing sliding window rate limiting with Redis backing",
      "files": ["src/middleware/rate-limiter.ts", "src/config/rate-limits.ts"],
      "pattern_novelty": "High|Med|Low",
      "code_portability": 12,
      "adoption_readiness": "High|Med|Low",
      "quality_signal": "High|Med|Low",
      "extraction_effort": "E0|E1|E2|E3",
      "why_interesting": "string",
      "portability_notes": "string",
      "dependencies": ["ioredis"],
      "our_equivalent": "none|partial|full",
      "our_equivalent_path": "path/to/our/version"
    }
  ]
}
```

**Field definitions:**

| Field                 | Type   | Description                                               |
| --------------------- | ------ | --------------------------------------------------------- |
| `rank`                | number | Priority rank by composite value signal                   |
| `name`                | string | Short descriptive name for the extraction candidate       |
| `description`         | string | What the component/pattern does                           |
| `files`               | array  | Source files comprising the candidate                     |
| `pattern_novelty`     | string | Does this repo do something we do not? High/Med/Low       |
| `code_portability`    | number | 0-15 score (5-dimension rubric, see Section 6)            |
| `adoption_readiness`  | string | License, deps overlap, stack match: High/Med/Low          |
| `quality_signal`      | string | Is this pattern better than what we have? High/Med/Low    |
| `extraction_effort`   | string | E0 (copy-paste) through E3 (significant adaptation)       |
| `why_interesting`     | string | Explanation of value                                      |
| `portability_notes`   | string | Specific portability concerns or advantages               |
| `dependencies`        | array  | External dependencies required by this candidate          |
| `our_equivalent`      | string | Whether we have an existing equivalent: none/partial/full |
| `our_equivalent_path` | string | Path to our version if partial/full equivalent exists     |

**Extraction effort levels:**

| Level | Label               | Description                                        |
| ----- | ------------------- | -------------------------------------------------- |
| E0    | Copy-paste          | Lift and drop, zero modification needed            |
| E1    | Light adaptation    | Rename, adjust imports, minor config changes       |
| E2    | Moderate adaptation | Interface changes, dependency swaps, test rewrites |
| E3    | Significant rework  | Architectural adaptation, major refactoring        |

### 3.4 `trends.jsonl` (append-only)

One record per analysis run. Enables trend detection over multiple runs of the
same repo.

```jsonl
{
  "analysis_id": "uuid",
  "timestamp": "ISO8601",
  "repo": "github.com/org/repo",
  "commit": "sha",
  "overall_band": "Healthy",
  "overall_score": 74,
  "critical_health_metric": 52,
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

**Field definitions:**

| Field                    | Type   | Description                                   |
| ------------------------ | ------ | --------------------------------------------- |
| `analysis_id`            | string | UUID matching the analysis.json run           |
| `timestamp`              | string | ISO 8601 timestamp                            |
| `repo`                   | string | Repository identifier                         |
| `commit`                 | string | HEAD SHA at analysis time                     |
| `overall_band`           | string | Band result for this run                      |
| `overall_score`          | number | Weighted average score                        |
| `critical_health_metric` | number | Minimum dimension score                       |
| `dimensions`             | object | Per-dimension numeric scores                  |
| `findings_total`         | number | Total findings count                          |
| `findings_by_severity`   | object | Findings broken out by S0-S3                  |
| `new_findings`           | number | New findings vs previous run (0 if first run) |
| `resolved_findings`      | number | Findings resolved since previous run          |
| `delta_overall`          | number | Score change from previous run                |
| `absence_patterns`       | array  | Named patterns detected this run              |
| `regression_flags`       | array  | Dimensions that regressed since previous run  |

### 3.5 `summary.md` (deep-plan injectable)

Structured Markdown following `## Research Context: Repo Analysis` header format
expected by deep-plan's DIAGNOSIS.md injection. Contains human-readable summary
of all findings, dimension bands, absence patterns, and value map highlights.
This is the primary display artifact shown inline after each phase.

---

## 4. Scoring Bands

Primary display is band with score in parentheses. Never present a bare numeric
score as the headline.

| Score  | Band       | Interpretation                    | Display example   |
| ------ | ---------- | --------------------------------- | ----------------- |
| 0-39   | Critical   | Immediate action required         | `Critical (28)`   |
| 40-59  | Needs Work | Significant gaps                  | `Needs Work (52)` |
| 60-79  | Healthy    | Acceptable; targeted improvements | `Healthy (74)`    |
| 80-100 | Excellent  | Strong across dimension           | `Excellent (88)`  |

**Band application:** Each of the 6 summary dimensions (Security, Reliability,
Maintainability, Documentation, Process, Velocity) receives an independent band.
The overall band is computed from the weighted average. The Critical Health
Metric (minimum across all dimensions) is a mandatory secondary display.

**Weight defaults** (configurable per analysis):

| Dimension       | Default Weight | Coverage                                            |
| --------------- | -------------- | --------------------------------------------------- |
| Security        | 25%            | SAST, supply chain, secrets, OpenSSF score          |
| Reliability     | 20%            | Error handling, test coverage, type safety          |
| Maintainability | 20%            | Complexity, duplication, dead code, naming          |
| Documentation   | 10%            | README, CONTRIBUTING, API docs, inline comments     |
| Process         | 15%            | CI/CD, branch protection, merge hygiene             |
| Velocity        | 10%            | Commit frequency, PR turnaround, contributor health |

---

## 5. Absence Pattern Definitions

The absence classifier detects what is missing, not what is present. Seven named
patterns with specific detection rules. Runs in Phase 2 (Standard) on full data,
with partial detection possible in Phase 0 (Quick Scan) using API data alone.

### Pattern 1: GHOST_SHIP

- **Detection:** Last commit > 180 days AND `archived: false` in GitHub API
- **Severity:** CRITICAL (as dependency); HIGH (standalone evaluation)
- **Quick Scan detectable:** Yes
- **Signal:** Most reliable single predictor of project abandonment. Academic
  literature uses 6 months; `cargo-unmaintained` uses 1 year; OSSF Scorecard
  uses 90 days. Use 180 days as the detection threshold but always surface the
  raw "days since last commit" value for consumer judgment.

### Pattern 2: TEST_THEATER

- **Detection:** `.github/workflows/` exists AND no workflow step `run:` field
  contains a recognizable test command
- **Test commands to match:** `test`, `pytest`, `jest`, `rspec`, `go test`,
  `cargo test`, `mocha`, `vitest`, `phpunit`, `dotnet test`, `mvn test`,
  `gradle test`
- **Severity:** CRITICAL (CI infrastructure cost with zero quality signal)
- **Quick Scan detectable:** Partial (workflow file presence from API, but
  step-level inspection requires clone or Contents API)

### Pattern 3: SECURITY_FACADE

- **Detection:** README contains security badge URLs (`snyk.io/badge`,
  `security/badge`) OR security keywords, but no `.github/dependabot.yml`, no
  security-scanning workflow steps, and no `SECURITY.md`
- **Severity:** HIGH (false sense of security for consumers)
- **Quick Scan detectable:** Yes (via community/profile and README inspection)

### Pattern 4: BORROWED_ARMOR

- **Detection:** `SECURITY.md` present but contains `TODO`, `[PLACEHOLDER]`,
  `your@email.com`, or GitHub default template boilerplate
- **Detection command:**
  `grep -iE "TODO|placeholder|\[your|example\.com|maintainer@" SECURITY.md`
- **Severity:** IMPORTANT (misleads contributors about security posture)
- **Quick Scan detectable:** Partial (file presence from API, content inspection
  requires Contents API or clone)

### Pattern 5: DEPENDENCY_FREEZE

- **Detection:** Manifest file (package.json, go.mod, requirements.txt) present
  AND manifest not modified in > 6 months AND dependency count > 5
- **Severity:** IMPORTANT (accumulating vulnerability exposure)
- **Quick Scan detectable:** Partial (manifest presence from API, modification
  date requires commit history or Contents API)
- **Enhancement:** Use `libyear` metric for version-lag-weighted staleness when
  available, instead of file modification date alone.

### Pattern 6: LONE_WOLF

- **Detection:** >90% of commits in last 12 months from single author AND no
  `.github/CODEOWNERS`
- **Variant:** VANISHING_WOLF -- was multi-contributor 12 months ago, now solo
- **Severity:** IMPORTANT (bus factor = 1, no succession path)
- **Quick Scan detectable:** Partial (contributor count from API, but percentage
  distribution requires deeper analysis)

### Pattern 7: SILENT_FAILURE

- **Detection:** CI exists AND tests exist AND CI has test commands, but GitHub
  API shows no required status checks on default branch
- **Severity:** IMPORTANT (tests run but advisory, not gating)
- **Quick Scan detectable:** Yes (branch protection rules from GraphQL include
  required status checks)

### Absence Classifier Scoring

```
Start at 100
Deduct: CRITICAL patterns (-3 each), IMPORTANT patterns (-2 each)
Normalize to applicable checks per repo type
Band result using the 4-band scale (Section 4)
```

Output named pattern labels in `analysis.json.absence_patterns[]`. Detailed
evidence for each detected pattern in `findings.jsonl`.

**Display:** Both in-dimension (within the relevant dimension's findings) AND as
a standalone summary list in `summary.md`. Cross-cutting signals deserve both
standalone visibility and in-context relevance.

---

## 6. Code Portability Rubric (0-15)

Five-dimension rubric for scoring extraction candidate portability. Each
dimension scored 0-3. Total score >= 10 = strong candidate; 6-9 = conditional; <
6 = project-specific, extraction not recommended.

| Dimension               | 0 (worst)                | 1                         | 2                         | 3 (best)                   |
| ----------------------- | ------------------------ | ------------------------- | ------------------------- | -------------------------- |
| Dependency Profile      | Invasive framework       | Heavy library deps        | Light, standard deps      | Standard library only      |
| Coupling Profile        | Ce > 12 (high efferent)  | Ce 8-12                   | Ce 4-7                    | Ce < 3                     |
| Configuration Surface   | Requires global state    | Requires env/config files | Constructor injection     | Zero-config                |
| Cognitive Portability   | Name requires system ref | Name implies parent       | Nameable with domain hint | Nameable without context   |
| Documentation Artifacts | No documentation         | Inline comments only      | README + usage examples   | Full API reference + tests |

**Blank project test:** Imagine copying the candidate into a blank project and
listing all imports. Any import that is not (a) standard library, (b) a
well-known general-purpose library, or (c) an abstracted interface is a
portability risk.

---

## 7. Temporal Fingerprint Specification (5-Signal)

Recorded on every analysis run, even Quick Scan (with limited signals).
Compounds across runs: first run establishes baseline, subsequent runs detect
drift.

### Signal Definitions

| #   | Signal                          | Extraction method                                    | Diagnostic value                                               |
| --- | ------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Commit velocity trend           | Monthly commit counts, 12 months                     | Health trajectory: rising/stable/declining/dead/recovering     |
| 2   | Contributor churn rate          | Unique active authors/month, trailing 6m vs prior 6m | Bus factor deterioration; single-author collapse               |
| 3   | Test-to-code ratio trajectory   | Test file count vs source file count, per quarter    | Rising = growing discipline; declining = coverage debt         |
| 4   | Dependency file touch frequency | Manifest file changes per quarter                    | High = active maintenance; stale 6+ months = Dependency Freeze |
| 5   | Code churn vs net growth        | Lines added minus deleted per month                  | High churn + low growth = thrash; inverse = healthy growth     |

### Fingerprint Schema

```json
{
  "repo": "owner/name",
  "fingerprint_date": "2026-04-02",
  "window_months": 12,
  "signals": {
    "commit_velocity": {
      "monthly_counts": [3, 5, 12, 8, 6, 0, 1, 2, 4, 7, 9, 11],
      "sparkline": "...........",
      "trend": "rising|stable|declining|dead|recovering",
      "dead_months": 2
    },
    "contributor_health": {
      "bus_factor_trend": "improving|stable|declining",
      "solo_months": 5,
      "unique_contributors_12m": 4
    },
    "test_ratio_trajectory": {
      "quarterly_ratios": [0.18, 0.19, 0.17, 0.16],
      "trend": "rising|stable|declining"
    },
    "dependency_freshness": {
      "dep_file_last_touched_days_ago": 187,
      "trend": "active|stale|frozen"
    },
    "churn_vs_growth": {
      "pattern": "healthy_growth|thrash|erratic_then_stable|contraction"
    }
  },
  "summary_indicators": {
    "velocity_trend": "recovering",
    "maintenance_risk": "low|medium|high|critical",
    "bus_factor": 1,
    "test_discipline": "rising|stable|declining"
  }
}
```

### Trend Alert Thresholds

| Pattern               | Threshold                                             | Severity |
| --------------------- | ----------------------------------------------------- | -------- |
| Contributor cliff     | Active contributors drops >50% in 90 days             | HIGH     |
| Dependency spike      | Transitive dependency count increases >30% in 30 days | HIGH     |
| Test coverage decline | Coverage drops >10 percentage points between versions | MEDIUM   |
| Commit halt           | Zero commits for 45+ days on previously active repo   | MEDIUM   |
| Issue age surge       | Median open issue age doubles in 60 days              | MEDIUM   |

---

## 8. State File Schema

**File naming:** `.claude/state/repo-analysis.<repo-slug>.state.json`

Each analysis gets its own state file keyed by repo slug (lowercase, hyphens for
special chars). Examples:

- `repo-analysis.facebook-react.state.json`
- `repo-analysis.vercel-next-js.state.json`
- `repo-analysis.pallets-flask.state.json`

```json
{
  "skill": "repo-analysis",
  "version": "1.0",
  "slug": "<repo-slug>",
  "target_repo": "github.com/org/repo",
  "target_commit": "<sha>",
  "status": "in-progress|complete|failed",
  "phase": 0,
  "depth": "quick|standard|deep",
  "dimensions_completed": [],
  "dimensions_failed": [],
  "clone_dir": "/tmp/repo-analysis-<slug>/",
  "clone_strategy": "none|blobless-shallow|blobless-history|full",
  "output_dir": ".research/<repo-slug>/",
  "agent_budget": {
    "allocated": 6,
    "spawned": 0,
    "completed": 0
  },
  "startedAt": "ISO 8601",
  "completedAt": null
}
```

**Field definitions:**

| Field                  | Type   | Description                                      |
| ---------------------- | ------ | ------------------------------------------------ |
| `skill`                | string | Always `"repo-analysis"`                         |
| `version`              | string | Skill version for compatibility checking         |
| `slug`                 | string | Repo slug derived from URL                       |
| `target_repo`          | string | Full GitHub path                                 |
| `target_commit`        | string | HEAD SHA at analysis start                       |
| `status`               | string | Current status: in-progress, complete, or failed |
| `phase`                | number | Current phase number (0-5)                       |
| `depth`                | string | Requested depth tier                             |
| `dimensions_completed` | array  | List of completed dimension IDs (e.g., "QS-01")  |
| `dimensions_failed`    | array  | List of failed dimensions with reason            |
| `clone_dir`            | string | Clone location (null for Quick Scan)             |
| `clone_strategy`       | string | Clone method used                                |
| `output_dir`           | string | Output artifact directory                        |
| `agent_budget`         | object | Agent allocation tracking                        |
| `startedAt`            | string | ISO 8601 analysis start time                     |
| `completedAt`          | string | ISO 8601 completion time (null if in-progress)   |

---

## 9. Guard Rails

### Rate Limits

- Always authenticate; never unauthenticated API calls
- Check `gh api /rate_limit` before each API batch; abort if `remaining < 200`
- Cache ETag on every GET; use `If-None-Match` on subsequent polls
- Core, search, code_search, and GraphQL are independent rate limit buckets
- On 429 or 403: read `retry-after` header; wait + backoff; never retry
  immediately
- GitHub App installation tokens expire in 1 hour (not 8 hours -- user access
  tokens are 8 hours)

### Large Repository Safety

- Skip statistics endpoints for repos with >= 10,000 commits; use `git log`
  fallback
- Handle HTTP 202 on statistics endpoints (retry after 3-5 seconds; limit 5
  retries)
- Never trust the `size` field as authoritative (treat as rough
  order-of-magnitude)
- Use Git Trees API (not Contents API) for full file enumeration
- Check `truncated: true` on Trees API responses (cap: 100,000 entries, 7 MB)
- GitHub Linguist fails for repos > 100,000 files; fall back to local `scc`

### Monorepo Handling

- Check for multiple monorepo indicators (pnpm + Turborepo simultaneously is
  valid)
- Parse workspace globs for sub-package paths; do not assume `packages/` or
  `apps/`
- Analyze each sub-package independently when monorepo contains discrete
  deployables
- For sub-package analysis: `git sparse-checkout set <subdir>` to avoid cloning
  the full monorepo

**Monorepo detection signals:**

| File                             | Monorepo Tool |
| -------------------------------- | ------------- |
| `turbo.json`                     | Turborepo     |
| `nx.json`                        | Nx            |
| `pnpm-workspace.yaml`            | pnpm          |
| `package.json#workspaces`        | npm/Yarn/Bun  |
| `rush.json`                      | Rush          |
| `WORKSPACE` or `WORKSPACE.bazel` | Bazel         |
| `Cargo.toml` with `[workspace]`  | Rust/Cargo    |

### Fork Detection

- Always fetch full repo object for `parent` and `source` fields
- If repo is a fork: flag prominently in output, display upstream reference
- Analyze the fork (the user chose it for a reason); inform, do not redirect

### Home Repo Guard

- Exact URL match on `jasonmichaelbell78-creator/sonash-v0`
- On match: warn user and offer redirect to `/audit-comprehensive`
- Do NOT proceed with repo-analysis on the home repo

### Error Handling

- Retry once with backoff on transient API failures (5xx, timeout)
- Degrade gracefully on persistent failures (mark dimension as unavailable with
  reason)
- Never block entire analysis for a single failed dimension or tool
- On OpenSSF 404: not indexed, continue (not an error)
- On deps.dev failure: skip CVE cross-reference, note in findings

### Clone Safety

- Clone to `/tmp/repo-analysis-<slug>/` (never to project directory)
- LFS repos: `GIT_LFS_SKIP_SMUDGE=1` if `.gitattributes` detected
- Auto-cleanup clone after analysis completes
- Blobless partial clone (`--filter=blob:none`) is default; never full clone
  unless git-sizer or binary anomaly requires it

### Framework Detection Heuristics

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

---

## 10. Agent Allocation (Standard/Deep Modes)

### Minimum Viable Agent Pool (Standard)

| Agent                 | Role                                       | Always? |
| --------------------- | ------------------------------------------ | ------- |
| Orchestrator (inline) | Phase 0-1 pre-flight, state management     | Yes     |
| `gsd-codebase-mapper` | Initial map; tech, arch, quality, concerns | Yes     |
| `security-auditor`    | SAST + supply chain + OWASP                | Yes     |
| `code-reviewer`       | Quality, maintainability, error handling   | Yes     |
| Aggregation (inline)  | Reads dimension files, computes scores     | Yes     |

### Conditional Additions

| Agent                  | Trigger                        |
| ---------------------- | ------------------------------ |
| `test-engineer`        | Test infrastructure detected   |
| `deployment-engineer`  | CI config detected             |
| `backend-architect`    | API/backend repo detected      |
| `performance-engineer` | Performance indicators present |
| Stack-specific agent   | When specific stack detected   |

**Hard cap:** 4 concurrent agents. Wave staging required for pools larger
than 4.

### Staged Wave Execution

```
Phase 0: Inline orchestrator (no spawn) -- Quick Scan
Phase 1: Inline orchestrator -- clone execution
Phase 2: Dimension Wave -- up to 4 concurrent agents
         Each writes dimensions/<dim>-findings.json before returning
         Orchestrator verifies file existence (does not trust return values)
Phase 3: History Wave (conditional) -- up to 3 concurrent agents
Phase 4: Aggregation -- inline, sequential
Phase 5: Value Map generation -- inline
```

---

## 11. Value Extraction Signals

Five signals scored per extraction candidate in `value-map.json`:

| Signal             | Scoring      | Criteria                                      |
| ------------------ | ------------ | --------------------------------------------- |
| Pattern Novelty    | High/Med/Low | Does this repo do something we do not?        |
| Code Portability   | 0-15 numeric | 5-dimension rubric (Section 6)                |
| Adoption Readiness | High/Med/Low | License compatible, deps overlap, stack match |
| Quality Signal     | High/Med/Low | Is this pattern better than what we have?     |
| Extraction Effort  | E0-E3        | Effort to transplant (see Section 3.3)        |

**Ranking formula:** Candidates ranked by: Pattern Novelty (High=3, Med=2,
Low=1) + Code Portability (normalized 0-3) + Quality Signal (High=3, Med=2,
Low=1), penalized by Extraction Effort (E0=0, E1=-0.5, E2=-1, E3=-2). Ties
broken by Adoption Readiness.

---

## 12. Normalization and Comparison

Classify target repo before any comparison. Raw scores across segments are not
comparable.

**Segmentation dimensions:**

| Dimension        | Values                                             |
| ---------------- | -------------------------------------------------- |
| Primary language | Controls LOC normalization baseline                |
| Project type     | library / application / framework / tooling        |
| Maturity         | Greenfield (<2y), Established (2-7y), Legacy (>7y) |
| Team size proxy  | solo (1), micro (2-3), small (4-10), large (10+)   |

Compare within segment, not globally.

---

## 12. Research Index

**Location:** `.research/research-index.jsonl`

Every analysis run appends one record for cross-skill discoverability.

| Field              | Type   | Description                                     |
| ------------------ | ------ | ----------------------------------------------- |
| `slug`             | string | Repo slug (e.g., `facebook-react`)              |
| `url`              | string | Full GitHub URL                                 |
| `depth`            | string | `quick` / `standard` / `deep`                   |
| `date`             | string | ISO 8601 timestamp                              |
| `score_summary`    | object | `{ security: 52, reliability: 78, ... }`        |
| `output_dir`       | string | Path to `.research/<slug>/`                     |
| `absence_patterns` | array  | Detected patterns (e.g., `["SECURITY_FACADE"]`) |

**Readers:** `/deep-plan` Phase 0 (discovers prior research), session-begin
(surfaces active analyses), Compare resume option (finds previous runs).
