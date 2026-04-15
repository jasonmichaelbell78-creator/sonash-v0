<!-- prettier-ignore-start -->
**Document Version:** 4.2
**Last Updated:** 2026-04-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Repo Analysis Reference

Dimension catalog, tool stack, output schemas, repo type classification, absence
pattern definitions, temporal fingerprint specification, dual-lens scoring
bands, Creator View specification, link mining pipeline, cross-repo awareness,
and guard rail rules for the repo-analysis skill.

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

Domain-based dimensions reflecting what the analysis actually measures. Tools
listed in the Source column feed the dimension but are not the dimension itself.

| #     | Dimension                           | Signal | Auto | Source                                           |
| ----- | ----------------------------------- | ------ | ---- | ------------------------------------------------ |
| ST-01 | Subprocess/execution safety         | 5/5    | 4/5  | `grep` shell=True/os.system + `semgrep` rules    |
| ST-02 | Test coverage and quality           | 5/5    | 4/5  | Test file ratio, framework detection, test count |
| ST-03 | Test CI enforcement                 | 5/5    | 5/5  | Workflow analysis, test commands in CI steps     |
| ST-04 | Code structure consistency          | 4/5    | 4/5  | Directory layout analysis, naming conventions    |
| ST-05 | Code reuse patterns                 | 4/5    | 3/5  | Shared library detection, copy-paste analysis    |
| ST-06 | Plugin/extension architecture       | 4/5    | 3/5  | Plugin configs, marketplace files, entry points  |
| ST-07 | Credential handling                 | 5/5    | 4/5  | `gitleaks` + env var / config file pattern scan  |
| ST-08 | Path safety                         | 5/5    | 4/5  | Path construction patterns, traversal guards     |
| ST-09 | Type safety and static analysis     | 4/5    | 5/5  | `mypy`/`pyright`/`tsc` config, type hint density |
| ST-10 | Dependency isolation                | 4/5    | 4/5  | Manifest analysis, shared vs isolated deps       |
| ST-11 | Error handling quality              | 4/5    | 4/5  | `semgrep` rules + manual pattern inspection      |
| ST-12 | Registry/catalog quality            | 3/5    | 4/5  | Registry file parsing, entry completeness        |
| ST-13 | Methodology documentation           | 4/5    | 3/5  | SOP docs, contributing guides, architecture docs |
| ST-14 | Scaffolding/generation tooling      | 3/5    | 3/5  | Template detection, generator scripts            |
| ST-15 | Monorepo/multi-project coordination | 4/5    | 4/5  | Monorepo markers, shared CI, cross-project gates |

**Absence pattern classification** runs across all dimensions as a cross-cutting
concern (see Section 5), not as a single dimension.

**Tool mapping appendix:** The original tool-based dimension catalog (v1.0) is
preserved below for reference. These tools remain available as data sources that
feed the domain-based dimensions above.

<details>
<summary>v1.0 Tool-Based Dimension Mapping (archived)</summary>

| Tool                     | Feeds Dimension(s)    | When Used                        |
| ------------------------ | --------------------- | -------------------------------- |
| `lizard`                 | ST-04 (structure)     | Complexity metrics               |
| `jscpd`                  | ST-05 (code reuse)    | Duplication detection            |
| `scc`                    | ST-04 (structure)     | LOC counting, cost estimation    |
| `knip` / `vulture`       | ST-05 (code reuse)    | Dead code detection              |
| `dependency-cruiser`     | ST-10 (dep isolation) | JS/TS dependency graph           |
| `semgrep`                | ST-01, ST-08, ST-11   | SAST, path safety, error quality |
| `gitleaks`               | ST-07 (credentials)   | Secret detection                 |
| `mypy` / `type-coverage` | ST-09 (type safety)   | Type checking                    |

</details>

### 1.3 Whole-Repo Adoption Dimensions (6 dimensions)

Evaluates whether to adopt the repository as a whole — install it, depend on it,
or integrate its ecosystem — rather than extracting individual parts. Computed
during Phase 4 (Aggregation) from existing dimension data plus adoption-specific
signals.

| #     | Dimension              | Signal | Auto | Source                                                                 |
| ----- | ---------------------- | ------ | ---- | ---------------------------------------------------------------------- |
| WR-01 | Stack compatibility    | 5/5    | 4/5  | Language match, framework overlap, OS support, install method          |
| WR-02 | Integration complexity | 5/5    | 3/5  | Plugin system, config requirements, API surface, migration path        |
| WR-03 | Maintenance burden     | 5/5    | 4/5  | Update frequency, breaking change history, dep chain depth             |
| WR-04 | Lock-in risk           | 5/5    | 3/5  | Proprietary formats, vendor lock-in, data portability, alternatives    |
| WR-05 | Value-to-cost ratio    | 5/5    | 2/5  | Unique value vs DIY effort, community support, commercial alternatives |
| WR-06 | Ecosystem maturity     | 4/5    | 4/5  | Age, stability signals, enterprise adoption, doc completeness          |

**Quick Scan partial assessment:** WR-01 (from language/framework metadata),
WR-04 (from license + alternatives search), WR-06 (from age, stars, contributor
diversity). Other dimensions require clone.

**Adoption verdict bands:**

| Band    | Score  | Interpretation                                           |
| ------- | ------ | -------------------------------------------------------- |
| Adopt   | 75-100 | Integrate as-is, benefits clearly outweigh costs         |
| Trial   | 55-74  | Worth a proof-of-concept, some concerns to address first |
| Extract | 30-54  | Don't adopt whole — cherry-pick valuable parts instead   |
| Avoid   | 0-29   | Costs outweigh benefits, build or find alternatives      |

### 1.4 Deep Mode Dimensions (requires 12-month history, 12 dimensions)

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

Eight primary artifacts plus one injectable Markdown summary. All written to
`.research/analysis/<repo-slug>/`. All v2.0 artifacts include a `schema_version`
field. Files without `schema_version` are implicitly v1.0 and will be migrated
on re-scan (re-scan IS the migration; old files archived to `archive/`).

### 3.1 `analysis.json`

Top-level analysis result. Consumed by `/deep-plan` as research context, by
`/recall` for search indexing, and by the Compare resume option.

**Validates against:** `scripts/lib/analysis-schema.js` (`analysisRecordCore`).
See `.claude/skills/shared/CONVENTIONS.md` Section 12 for schema contract.

```json
{
  "id": "UUID",
  "schema_version": "3.0",
  "source_type": "repo",
  "source": "OWNER/REPO",
  "slug": "repo-slug",
  "title": "Repository Name",
  "analyzed_at": "ISO8601",
  "depth": "quick|standard|deep",
  "tags": ["repo", "extraction", "architecture"],
  "scoring": {
    "quality_band": "Healthy",
    "quality_score": 72,
    "personal_fit_band": "Excellent",
    "personal_fit_score": 85,
    "classification": "active-sprint"
  },
  "summary": "2-3 sentence summary of what this source is and what was learned.",
  "creator_view": "Full Creator View prose (from creator-view.md content)",
  "candidates": [
    {
      "name": "Candidate Name",
      "type": "pattern|knowledge|content|anti-pattern",
      "description": "What it is and why it matters",
      "novelty": "high|medium|low",
      "effort": "E0|E1|E2|E3",
      "relevance": "high|medium|low",
      "tags": ["architecture"]
    }
  ],
  "last_synthesized_at": null,

  "metadata": {
    "url": "https://github.com/OWNER/REPO",
    "scan_version": "4.3",
    "clone_dir": "/tmp/repo-analysis-<slug>/",
    "files_cloned": 796,
    "stars": 27518,
    "language": "Python",
    "license": "Apache-2.0",
    "created_at": "ISO8601",
    "pushed_at": "ISO8601",
    "age_days": 26,
    "size_kb": 22982,
    "forks": 2569,
    "open_issues": 73,
    "contributors": 44,
    "is_fork": false,
    "is_archived": false,
    "languages": { "Python": 4772855, "JavaScript": 31014 }
  },
  "repo_type": "library|application|curated-list|registry|documentation-hub|monorepo",
  "repo_type_secondary": "string|null",
  "dimensions": {
    "QS-01_activity_pulse": {
      "score": 95,
      "band": "Excellent",
      "detail": "..."
    },
    "ST-01_subprocess_safety": {
      "score": 88,
      "band": "Excellent",
      "detail": "..."
    }
  },
  "summary_bands": {
    "Security": { "score": 58, "band": "Needs Work" },
    "Reliability": { "score": 70, "band": "Healthy" },
    "Maintainability": { "score": 76, "band": "Healthy" },
    "Documentation": { "score": 82, "band": "Excellent" },
    "Process": { "score": 48, "band": "Needs Work" },
    "Velocity": { "score": 95, "band": "Excellent" }
  },
  "absence_patterns": [
    { "pattern": "SECURITY_FACADE", "confidence": "Medium", "evidence": "..." }
  ],
  "adoption_assessment": {
    "verdict": "Trial|Adopt|Extract|Avoid",
    "verdict_score": 62,
    "dimensions": {
      "WR-01_stack_compatibility": {
        "score": 75,
        "band": "Healthy",
        "detail": "..."
      },
      "WR-02_integration_complexity": {
        "score": 60,
        "band": "Healthy",
        "detail": "..."
      },
      "WR-03_maintenance_burden": {
        "score": 55,
        "band": "Needs Work",
        "detail": "..."
      },
      "WR-04_lock_in_risk": {
        "score": 80,
        "band": "Excellent",
        "detail": "..."
      },
      "WR-05_value_to_cost": {
        "score": 50,
        "band": "Needs Work",
        "detail": "..."
      },
      "WR-06_ecosystem_maturity": {
        "score": 45,
        "band": "Needs Work",
        "detail": "..."
      }
    },
    "recommendation": "One-sentence adoption recommendation"
  }
}
```

**Field definitions:**

**Unified core fields (required — validated by Zod):**

| Field                 | Type   | Description                                                      |
| --------------------- | ------ | ---------------------------------------------------------------- |
| `id`                  | string | UUID, stable across rebuilds                                     |
| `schema_version`      | string | Schema version (`"3.0"`)                                         |
| `source_type`         | string | Always `"repo"` for this handler                                 |
| `source`              | string | GitHub `OWNER/REPO` identifier                                   |
| `slug`                | string | Directory slug for `.research/analysis/<slug>/`                  |
| `title`               | string | Repository name (from GitHub API)                                |
| `analyzed_at`         | string | ISO8601 timestamp of analysis                                    |
| `depth`               | string | `quick`, `standard`, or `deep`                                   |
| `tags`                | array  | Auto-generated + user tags (see Tag Suggestion step)             |
| `scoring`             | object | Unified scoring: quality + personal fit bands and scores         |
| `summary`             | string | 2-3 sentence summary of what this source is and what was learned |
| `creator_view`        | string | Full Creator View prose (from creator-view.md)                   |
| `candidates`          | array  | All candidates from value-map.json in unified format             |
| `last_synthesized_at` | string | ISO8601 or null — set by synthesis, not by handler               |

**Repo-specific fields (optional — type-specific extensions):**

| Field                                | Type   | Description                                               |
| ------------------------------------ | ------ | --------------------------------------------------------- |
| `metadata`                           | object | GitHub stats, scan metadata, clone info                   |
| `repo_type`                          | string | Primary type (see Section 5b)                             |
| `repo_type_secondary`                | string | Secondary type (null if single-type)                      |
| `dimensions.*`                       | object | Per-dimension: score (0-100), band, and detail string     |
| `summary_bands.*`                    | object | 6-dimension summary: Security, Reliability, etc.          |
| `absence_patterns`                   | array  | Objects with pattern name, confidence, and evidence       |
| `adoption_assessment`                | object | Whole-repo adoption verdict + WR dimensions (see Sec 1.3) |
| `adoption_assessment.verdict`        | string | Adopt / Trial / Extract / Avoid                           |
| `adoption_assessment.verdict_score`  | number | Weighted average of WR dimensions, 0-100                  |
| `adoption_assessment.recommendation` | string | One-sentence adoption recommendation                      |

**Scoring mapping:** The `scoring` object is derived from `summary_bands`:

- `quality_score` = average of 6 summary band scores
- `quality_band` = band for that average (per CONVENTIONS.md Section 4)
- `personal_fit_score` = from adoption_assessment.verdict_score (or average if
  no adoption assessment)
- `personal_fit_band` = band for that score
- `classification` = from fit scoring thresholds (CONVENTIONS.md Section 5)

**Critical Health Metric:** The minimum score across all 6 summary dimensions. A
repo with a 90 average but a 15 security score is `Critical` regardless of
average. Display alongside overall band:
`Healthy (74) | Critical floor: Security (52)`.

### 3.2 `findings.jsonl`

One record per finding. Uses a lightweight analysis-native format. TDMS intake
(routing option 2) transforms to TDMS-compatible format at intake time.

```jsonl
{
  "schema_version": "2.0",
  "id": "F001",
  "severity": "high|medium|low|info",
  "dimension": "QS-15|ST-01|WR-03",
  "title": "No SAST for subprocess-heavy codebase",
  "description": "Full finding description with evidence",
  "recommendation": "Recommended action"
}
```

**Field definitions:**

| Field            | Type   | Required | Description                              |
| ---------------- | ------ | -------- | ---------------------------------------- |
| `schema_version` | string | Yes      | Schema version (`"2.0"`)                 |
| `id`             | string | Yes      | Finding ID (F001, F002, etc.)            |
| `severity`       | string | Yes      | `high`, `medium`, `low`, or `info`       |
| `category`       | string | No       | Optional: `cautionary` for anti-ideas    |
| `dimension`      | string | Yes      | Dimension ID (e.g., QS-15, ST-01, WR-03) |
| `title`          | string | Yes      | Short finding title                      |
| `description`    | string | Yes      | Full description with evidence           |
| `recommendation` | string | Yes      | Recommended action                       |

**TDMS intake transform (routing option 2):**

When the user selects "Send to TDMS", each finding is transformed to
TDMS-compatible format before intake:

| findings.jsonl field | TDMS field       | Transform                                    |
| -------------------- | ---------------- | -------------------------------------------- |
| `id`                 | `source_id`      | Prefixed: `repo-analysis-<slug>-<date>-F001` |
| `severity`           | `severity`       | `high`→S1, `medium`→S2, `low`→S3, `info`→S3  |
| `title`              | `title`          | Direct copy                                  |
| `detail`             | `description`    | Direct copy                                  |
| `recommendation`     | `recommendation` | Direct copy                                  |
| (derived)            | `category`       | Derived from dimension prefix                |
| (derived)            | `status`         | Always `NEW`                                 |
| (derived)            | `source`         | `repo-analysis-<slug>-<YYYY-MM-DD>`          |

### 3.3 `value-map.json`

Ranked list of extraction candidates. Produced by Standard and Deep modes.
Consumed by the Extract routing option. Updated with extraction decisions when
user acts on candidates.

```json
{
  "schema_version": "2.0",
  "repo": "OWNER/REPO",
  "scan_date": "YYYY-MM-DD",
  "patternCandidates": [
    {
      "name": "Rate limiting middleware",
      "description": "What the component/pattern does and why it matters",
      "source": "src/middleware/rate-limiter.ts + src/config/rate-limits.ts",
      "relevance": "high|medium|low",
      "effort": "E0|E1|E2|E3",
      "novelty": "High|Med|Low",
      "rank": 1,
      "location": "src/middleware/rate-limiter.ts + src/config/rate-limits.ts",
      "pattern_novelty": "High|Med|Low",
      "code_portability": 12,
      "adoption_readiness": "High|Med|Low",
      "quality_signal": "High|Med|Low",
      "extraction_effort": "E0|E1|E2|E3",
      "objective_score": 85,
      "personal_fit_score": 25,
      "fit_class": "active-sprint|park-for-later|evergreen|not-relevant",
      "notes": "Portability concerns, adaptation requirements, context",
      "status": "identified|selected|extracted|integrated|skipped",
      "decision_date": "ISO8601 or null",
      "decision_notes": "Why this decision was made"
    }
  ],
  "knowledgeCandidates": [
    {
      "name": "Agent instruction design patterns",
      "description": "What understanding/methodology to learn",
      "source": "docs/agent-design.md + src/agents/",
      "relevance": "high|medium|low",
      "effort": "E0|E1",
      "novelty": "High|Med|Low"
    }
  ],
  "contentCandidates": [
    {
      "name": "MCP backend tutorial",
      "description": "Specific content item with direct home applicability",
      "source": "guides/mcp-backend.md",
      "relevance": "high|medium|low",
      "effort": "E0|E1",
      "novelty": "High|Med|Low",
      "url": "https://example.com/resource"
    }
  ],
  "antiPatternCandidates": [
    {
      "name": "CELEBRITY_STAGNATION",
      "description": "Cautionary lesson — what NOT to replicate",
      "source": "Observed pattern in governance model",
      "relevance": "high|medium|low",
      "effort": "E0",
      "novelty": "High|Med|Low"
    }
  ],
  "cross_repo_connections": [
    {
      "target_repo": "owner/name",
      "connection_type": "shared-pattern|complementary|overlapping-finding|referenced",
      "detail": "..."
    }
  ],
  "related_repos": [
    {
      "url": "https://github.com/owner/repo",
      "relationship": "inspired-by|uses|similar-to|contrast|extends|referenced-in",
      "discovery_context": "How this relationship was discovered"
    }
  ]
}
```

**Required fields:**

| Field                | Type   | Description                                                                                                 |
| -------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| `rank`               | number | Priority rank by composite value signal                                                                     |
| `name`               | string | Short descriptive name for the extraction candidate                                                         |
| `location`           | string | Source file(s) or directory in the analyzed repo                                                            |
| `description`        | string | What the component/pattern does and why it matters                                                          |
| `pattern_novelty`    | string | Does this repo do something we do not? High/Med/Low                                                         |
| `code_portability`   | number | 0-15 score (5-dimension rubric, see Section 6)                                                              |
| `adoption_readiness` | string | License, deps overlap, stack match: High/Med/Low                                                            |
| `quality_signal`     | string | Is this pattern better than what we have? High/Med/Low                                                      |
| `extraction_effort`  | string | E0 (copy-paste) through E3 (significant adaptation)                                                         |
| `objective_score`    | number | Objective brilliance score (0-100). Context-independent                                                     |
| `personal_fit_score` | number | Personal fit to active projects (0-100). Sprint-dependent                                                   |
| `fit_class`          | string | Derived: `active-sprint` (fit≥60), `park-for-later` (fit<60, obj≥60), `evergreen` (both≥40), `not-relevant` |
| `notes`              | string | Portability concerns, adaptation requirements, context                                                      |

**Related repos (discovered during analysis):**

| Field                               | Type   | Description                                                |
| ----------------------------------- | ------ | ---------------------------------------------------------- |
| `related_repos[].url`               | string | GitHub URL of related repo                                 |
| `related_repos[].relationship`      | string | inspired-by/uses/similar-to/contrast/extends/referenced-in |
| `related_repos[].discovery_context` | string | How this relationship was discovered                       |

**Extraction tracking fields (added during Extract routing flow):**

| Field            | Type   | Description                                                              |
| ---------------- | ------ | ------------------------------------------------------------------------ |
| `status`         | string | `identified` (default), `selected`, `extracted`, `integrated`, `skipped` |
| `decision_date`  | string | ISO 8601 date when user made decision (null until acted on)              |
| `decision_notes` | string | Why this decision was made                                               |

**Optional enrichment fields:**

| Field                 | Type   | Description                                              |
| --------------------- | ------ | -------------------------------------------------------- |
| `files`               | array  | Specific source files (when `location` is a directory)   |
| `dependencies`        | array  | External dependencies required by this candidate         |
| `our_equivalent`      | string | Whether we have an equivalent: `none`, `partial`, `full` |
| `our_equivalent_path` | string | Path to our version if partial/full equivalent exists    |
| `extracted_to`        | string | Path in our repo where this was extracted to             |

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
  "schema_version": "2.0",
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

### 3.6 Extraction Persistence Artifacts

Three artifacts track extraction decisions and outcomes across repos.

#### 3.6.1 Per-Candidate Extraction Result

**Location:** `.research/analysis/<slug>/extractions/<candidate-slug>.json`

Written when user acts on a candidate in the Extract routing flow.

```json
{
  "candidate": "HARNESS.md Methodology",
  "repo": "HKUDS/CLI-Anything",
  "scan_date": "2026-04-03",
  "status": "selected",
  "decision": "extract|skip|defer",
  "decision_date": "2026-04-03",
  "decision_notes": "7-phase SOP applicable to JASON-OS agent-native tooling",
  "source_files": [
    "cli-anything-plugin/HARNESS.md",
    "cli-anything-plugin/guides/"
  ],
  "extracted_to": "docs/reference/HARNESS_METHODOLOGY.md",
  "adaptation_notes": "Adapted Phase 3 examples for TypeScript/Node",
  "dependencies_added": [],
  "follow_up": "Evaluate SKILL.md format for sonash skill files"
}
```

| Field                | Type   | Required | Description                                      |
| -------------------- | ------ | -------- | ------------------------------------------------ |
| `candidate`          | string | Yes      | Name from value-map.json                         |
| `repo`               | string | Yes      | Source repo identifier                           |
| `scan_date`          | string | Yes      | Date of analysis that found this candidate       |
| `status`             | string | Yes      | `selected`, `extracted`, `integrated`, `skipped` |
| `decision`           | string | Yes      | `extract`, `skip`, or `defer`                    |
| `decision_date`      | string | Yes      | ISO 8601 date of decision                        |
| `decision_notes`     | string | Yes      | Reasoning for the decision                       |
| `source_files`       | array  | No       | Specific files in source repo                    |
| `extracted_to`       | string | No       | Destination path in our repo (if extracted)      |
| `adaptation_notes`   | string | No       | What was changed during extraction               |
| `dependencies_added` | array  | No       | New dependencies required                        |
| `follow_up`          | string | No       | Remaining work or related investigations         |

#### 3.6.2 Cross-Entity Extraction Journal

**Location:** `.research/extraction-journal.jsonl` (canonical root path)

Append-only log across ALL analyzed entities (repos and websites). One line per
extraction decision. Uses unified v2.0 schema shared with website-analysis.
Legacy files at `.research/analysis/extraction-journal.jsonl` have been removed.
All data lives at the canonical location only.

```jsonl
{
  "schema_version": "2.0",
  "source_type": "repo",
  "source": "HKUDS/CLI-Anything",
  "candidate": "HARNESS.md Methodology",
  "type": "pattern",
  "decision": "extract",
  "decision_date": "2026-04-03",
  "extracted_to": "docs/reference/HARNESS_METHODOLOGY.md",
  "extracted_at": "2026-04-03",
  "notes": "7-phase SOP for agent-native CLI wrapping.",
  "novelty": "high",
  "effort": "E0",
  "relevance": "high"
}
```

| Field            | Type   | Required | Description                                      |
| ---------------- | ------ | -------- | ------------------------------------------------ |
| `schema_version` | string | Yes      | Schema version (`"2.0"`)                         |
| `source_type`    | string | Yes      | `"repo"` or `"website"`                          |
| `source`         | string | Yes      | Repo name or URL                                 |
| `candidate`      | string | Yes      | Candidate name from value-map                    |
| `type`           | string | Yes      | content/pattern/tool/knowledge/anti-pattern/etc. |
| `decision`       | string | Yes      | extract/defer/skip/investigate                   |
| `decision_date`  | string | Yes      | ISO date when decision was made                  |
| `extracted_to`   | string | No       | Destination path (null if not yet extracted)     |
| `extracted_at`   | string | No       | ISO date when extraction completed               |
| `notes`          | string | No       | Optional context about the candidate             |
| `novelty`        | string | Yes      | high/medium/low                                  |
| `effort`         | string | Yes      | E0/E1/E2/E3                                      |
| `relevance`      | string | Yes      | high/medium/low                                  |

#### 3.6.3 `EXTRACTIONS.md` (Human-Readable Summary)

**Location:** `.research/EXTRACTIONS.md` (canonical root path only). Legacy
files at `.research/analysis/EXTRACTIONS.md` have been removed.

Auto-regenerated from `extraction-journal.jsonl` after each Extract routing
flow. Grouped by status for quick scanning.

```markdown
# Extraction Candidates — Cross-Repo Summary

Generated: 2026-04-05 | Total: 7 candidates across 1 repo

## Extracted (0)

_None yet._

## Deferred (7)

### HKUDS/CLI-Anything (7 candidates) -- Verdict: Trial (62)

| Candidate              | Novelty | Effort | Fit             | Notes                                                       |
| ---------------------- | ------- | ------ | --------------- | ----------------------------------------------------------- |
| HARNESS.md Methodology | High    | E0     | [ACTIVE-SPRINT] | 7-phase SOP for agent-native CLI wrapping.                  |
| SKILL.md Format        | High    | E0     | [PARK]          | AI-discoverable skill definition. Compare against existing. |
| Plugin Marketplace     | High    | E2     | [PARK]          | Brilliant but not current sprint.                           |

_(truncated for brevity)_

#### Per-Repo Detail: HKUDS/CLI-Anything

| Candidate              | Novelty | Effort | Obj | Fit | Notes                                       |
| ---------------------- | ------- | ------ | --- | --- | ------------------------------------------- |
| HARNESS.md Methodology | High    | E0     | 92  | 78  | Directly applicable to JASON-OS agent work. |
| SKILL.md Format        | High    | E0     | 88  | 25  | High objective, low fit to current sprint.  |
| Plugin Marketplace     | High    | E2     | 85  | 30  | Brilliant but not current sprint.           |

## Skipped (3)

...
```

**Fit badge derivation rules** (see Section 14.7 for full derivation table):

- `personal_fit_score >= 60` --> `[ACTIVE-SPRINT]`
- `personal_fit_score < 60 AND objective_score >= 60` --> `[PARK]`
- `objective_score >= 40 AND personal_fit_score >= 40` --> `[EVERGREEN]`
- Otherwise --> no badge (low value)

### 3.7 `mined-links.jsonl`

**Location:** `.research/analysis/<slug>/mined-links.jsonl`

One record per link extracted during the Link Mining Pipeline (Section 16).
Produced conditionally when `repo_type` is `curated-list` or `registry`.
Supports incremental deepening: Depth 0 entries have `confidence: "low"`,
upgraded to `"high"` after Depth 1 fetching.

```jsonl
{
  "schema_version": "2.0",
  "title": "FastAPI",
  "url": "https://github.com/tiangolo/fastapi",
  "category": "Web Frameworks > Python",
  "source_line": "- [FastAPI](https://github.com/tiangolo/fastapi) - Modern, fast web framework for building APIs with Python.",
  "description": "Modern, fast web framework for building APIs with Python.",
  "objective_score": 88,
  "personal_fit_score": 35,
  "personal_fit_projects": [
    "sonash-v0"
  ],
  "confidence": "low|high",
  "depth": 0,
  "fetch_status": "not_fetched|success|failed|rate_limited",
  "tags": [
    "python",
    "web-framework",
    "async"
  ],
  "notes": "Optional analyst notes"
}
```

**Field definitions:**

| Field                   | Type   | Required | Description                                                      |
| ----------------------- | ------ | -------- | ---------------------------------------------------------------- |
| `title`                 | string | Yes      | Link title (from markdown text or fetched page title)            |
| `url`                   | string | Yes      | Target URL                                                       |
| `category`              | string | Yes      | Category from source repo's taxonomy (heading-based)             |
| `source_line`           | string | Yes      | Raw markdown line where link was found                           |
| `description`           | string | Yes      | Description (from markdown context or fetched meta)              |
| `objective_score`       | number | Yes      | Context-independent quality/relevance score (0-100)              |
| `personal_fit_score`    | number | Yes      | Fit to active projects (0-100), scored against home context      |
| `personal_fit_projects` | array  | Yes      | Which active projects this link is relevant to                   |
| `confidence`            | string | Yes      | `"low"` (Depth 0, metadata only) or `"high"` (Depth 1+, fetched) |
| `depth`                 | number | Yes      | 0 (parsed), 1 (HEAD+selective fetch), 2 (targeted deep-dive)     |
| `fetch_status`          | string | Yes      | `not_fetched`, `success`, `failed`, or `rate_limited`            |
| `tags`                  | array  | Yes      | Descriptive tags for filtering and synthesis                     |
| `notes`                 | string | No       | Optional analyst notes or context                                |

### 3.8 `reading-chain.jsonl`

**Location:** `.research/reading-chain.jsonl` (canonical root path, cross-repo,
NOT per-slug). Legacy files at `.research/analysis/reading-chain.jsonl` remain
valid

Append-only log of relationships between analyzed repos. Populated during Phase
4 (Creator View) and Phase 6 (Value Map) when cross-repo relationships are
discovered. Consumed by the `/synthesize` skill for reading chain generation and
cross-repo knowledge maps.

```jsonl
{
  "schema_version": "2.0",
  "from_repo": "sindresorhus/awesome-nodejs",
  "to_repo": "tiangolo/fastapi",
  "relationship": "referenced-in",
  "discovery_context": "Listed in awesome-nodejs Web Frameworks section",
  "discovered_during": "sindresorhus/awesome-nodejs scan",
  "date": "2026-04-05"
}
```

**Field definitions:**

| Field               | Type   | Required | Description                                                                 |
| ------------------- | ------ | -------- | --------------------------------------------------------------------------- |
| `from_repo`         | string | Yes      | Source repo (`owner/repo` format)                                           |
| `to_repo`           | string | Yes      | Target repo (`owner/repo` format)                                           |
| `relationship`      | string | Yes      | `inspired-by`, `uses`, `similar-to`, `contrast`, `extends`, `referenced-in` |
| `discovery_context` | string | Yes      | How this relationship was discovered                                        |
| `discovered_during` | string | Yes      | Which repo scan discovered this (`owner/repo scan`)                         |
| `date`              | string | Yes      | ISO 8601 date of discovery                                                  |

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

**Band application:** Each summary dimension receives an independent band. The
overall band is computed from the weighted average using the active lens. The
Critical Health Metric (minimum across all dimensions) is a mandatory secondary
display.

### 4.1 Adoption Lens Scoring

6 dimensions. Used when evaluating a repo as a dependency or integration target.

| Dimension       | Weight | Coverage                                            |
| --------------- | ------ | --------------------------------------------------- |
| Security        | 25%    | SAST, supply chain, secrets, OpenSSF score          |
| Reliability     | 20%    | Error handling, test coverage, type safety          |
| Maintainability | 20%    | Complexity, duplication, dead code, naming          |
| Documentation   | 10%    | README, CONTRIBUTING, API docs, inline comments     |
| Process         | 15%    | CI/CD, branch protection, merge hygiene             |
| Velocity        | 10%    | Commit frequency, PR turnaround, contributor health |

### 4.2 Creator Lens Scoring

7 dimensions (adds Knowledge). Used when evaluating a repo as a learning source
or creative reference.

| Dimension       | Weight | Coverage                                   |
| --------------- | ------ | ------------------------------------------ |
| Security        | 5%     | Irrelevant for learning                    |
| Reliability     | 10%    | Nice-to-have                               |
| Maintainability | 15%    | Clean code easier to learn from            |
| Documentation   | 25%    | How you learn from a repo                  |
| Process         | 5%     | CI/CD irrelevant for learning              |
| Velocity        | 5%     | Active dev nice-to-have                    |
| Knowledge       | 35%    | KN-01 through KN-05 composite (Section 13) |

### 4.3 Lens Selection Logic

Both lenses are always computed. The primary lens is inferred from `repo_type`
(Section 5b):

| Repo Type           | Primary Lens |
| ------------------- | ------------ |
| `library`           | Adoption     |
| `application`       | Adoption     |
| `monorepo`          | Adoption     |
| `curated-list`      | Creator      |
| `registry`          | Creator      |
| `documentation-hub` | Creator      |

User override at scan time: `--lens=adoption|creator`

### 4.4 Verdict Tables

**Adoption lens verdicts:**

| Score | Verdict | Interpretation                                           |
| ----- | ------- | -------------------------------------------------------- |
| 75+   | Adopt   | Integrate as-is, benefits clearly outweigh costs         |
| 55-74 | Trial   | Worth a proof-of-concept, some concerns to address first |
| 30-54 | Extract | Don't adopt whole -- cherry-pick valuable parts instead  |
| 0-29  | Avoid   | Costs outweigh benefits, build or find alternatives      |

**Creator lens verdicts:**

| Score | Verdict | Interpretation                            |
| ----- | ------- | ----------------------------------------- |
| 80+   | Study   | Deep engagement recommended               |
| 60-79 | Explore | Worth exploring, selective deep-dives     |
| 40-59 | Extract | Cherry-pick specific insights or patterns |
| 0-39  | Note    | Record existence, low learning priority   |

### 4.5 Display Format

Both lenses always shown. Primary lens marked with `[PRIMARY]`.

```
Adoption Lens: Trial (62) — viable dependency with caveats
Creator Lens:  Study (85) — deep engagement recommended [PRIMARY]
```

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

## 5b. Repo Type Classification

Classifies the repository into a primary type that drives scoring lens selection
(Section 4.3), conditional phases (link mining, Section 16), and display format.
Classification runs during Quick Scan (Phase 0) using API data and is optionally
refined during Standard mode (Phase 1) with full file access.

### Detection Signal Matrix

Signals are evaluated using GitHub API data (no clone required for Quick Scan).

| Signal                                                             | Source                    | Strength |
| ------------------------------------------------------------------ | ------------------------- | -------- |
| README size > 50KB                                                 | Contents API `size` field | Strong   |
| Code-to-markdown ratio < 0.2                                       | Tree API file extensions  | Strong   |
| Topics include "awesome"/"list"/"resources"/"curated"/"collection" | REST metadata `topics`    | Strong   |
| < 20 code files outside docs/scripts/                              | Tree API                  | Moderate |
| External link density > 5 per KB in README                         | Contents API + parse      | Strong   |
| Single top-level README + category dirs                            | Tree API                  | Moderate |

### Classification Thresholds

Applied in order. First match wins.

1. **`curated-list`**: 3+ strong signals, OR 2 strong + 1 moderate
2. **`monorepo`**: Presence of `turbo.json`, `nx.json`, `pnpm-workspace.yaml`,
   `lerna.json`, or `rush.json`
3. **`registry`**: Structured data files (JSON/YAML) with URL fields + web
   frontend (detected from topics or file structure)
4. **`documentation-hub`**: Code-to-docs ratio > 0.3 but < 0.7, README > 10KB
5. **`library` vs `application`**: Primary language present, code-to-markdown
   ratio > 0.7. Distinguish by: CLI entry point or `bin` field in package.json
   --> `application`; otherwise --> `library`
6. **Default fallback**: `library`

**Ambiguity handling:** If signals are evenly split between two types with no
clear primary, default to `library` and set `repo_type_secondary`. Log the
ambiguity in the state file.

### Secondary Type

If secondary signals are strong but don't win primary classification, set
`repo_type_secondary` in `analysis.json`. The secondary type is informational
only -- it does not drive phase routing or lens selection.

Example: build-your-own-x has primary = `curated-list`, secondary =
`documentation-hub` (extensive how-to content alongside the link catalog).

### Library vs Application Distinction

For repos classified as code-primary (not curated-list, registry, or
documentation-hub):

| Signal                                    | Classification |
| ----------------------------------------- | -------------- |
| `bin` field in package.json               | `application`  |
| CLI entry point (main.go, src/cli.ts)     | `application`  |
| `main` field + no `bin` in package.json   | `library`      |
| Exported module with API surface          | `library`      |
| Docker/Kubernetes configs + service entry | `application`  |
| No clear signal                           | `library`      |

### Monorepo and Registry Detection

**Monorepo markers** (any one sufficient):

- `turbo.json` (Turborepo)
- `nx.json` (Nx)
- `pnpm-workspace.yaml` (pnpm workspaces)
- `rush.json` (Rush)
- `package.json` with `workspaces` field (npm/Yarn/Bun)
- `WORKSPACE` or `WORKSPACE.bazel` (Bazel)
- `Cargo.toml` with `[workspace]` (Rust)

**Registry markers** (2+ required):

- Structured data directory (JSON/YAML files with `url` or `homepage` fields)
- Web frontend or API serving the data
- Submission/contribution template referencing data format

### Standard Mode Refinement

After clone (Phase 1), re-evaluate type with full file access. Override Quick
Scan classification if clone data contradicts API-only assessment. Log any
classification change in the state file:

```json
{
  "repo_type_quick_scan": "library",
  "repo_type_refined": "documentation-hub",
  "refinement_reason": "Clone revealed 60% markdown content not visible via Tree API truncation"
}
```

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
  "output_dir": ".research/analysis/<repo-slug>/",
  "agents": {
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
| `agents`               | object | Agent tracking: `{spawned, completed}` (flat)    |
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
Phase 0:  Inline orchestrator (no spawn) -- Quick Scan
Phase 1:  Inline orchestrator -- clone execution
Phase 2:  Dimension Wave -- up to 4 concurrent agents
          Each writes dimensions/<dim>-findings.json before returning
          Orchestrator verifies file existence (does not trust return values)
Phase 2b: Deep Read -- inline, read internal artifacts beyond code
Phase 3:  History Wave (conditional, Deep only) -- up to 3 concurrent agents
Phase 4:  Creator View -- inline, requires home context + Deep Read + Content Eval
Phase 4b: Content Evaluation -- inline, evaluates embedded content for relevance
Phase 5:  Engineer View -- inline, merge dimensions, compute bands
Phase 6:  Value Map generation -- inline, 4 typed candidate arrays
Phase 6b: Coverage Audit -- inline, scan for unexplored content
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

## 12b. Research Index

**Location:** `.research/research-index.jsonl`

Every analysis run appends one record for cross-skill discoverability.

| Field              | Type   | Description                                     |
| ------------------ | ------ | ----------------------------------------------- |
| `slug`             | string | Repo slug (e.g., `facebook-react`)              |
| `url`              | string | Full GitHub URL                                 |
| `depth`            | string | `quick` / `standard` / `deep`                   |
| `date`             | string | ISO 8601 timestamp                              |
| `score_summary`    | object | `{ security: 52, reliability: 78, ... }`        |
| `output_dir`       | string | Path to `.research/analysis/<slug>/`            |
| `absence_patterns` | array  | Detected patterns (e.g., `["SECURITY_FACADE"]`) |

**Readers:** `/deep-plan` Phase 0 (discovers prior research), session-begin
(surfaces active analyses), Compare resume option (finds previous runs).

---

## 13. Knowledge Dimensions (Creator View)

Five dimensions that capture what a repo UNDERSTANDS, not just its health. These
feed the Creator View (SKILL.md Phase 4). Low automation — knowledge extraction
requires AI judgment, not tool output.

| #     | Dimension                | Signal | Auto | What It Captures                                    |
| ----- | ------------------------ | ------ | ---- | --------------------------------------------------- |
| KN-01 | Domain knowledge map     | 5/5    | 2/5  | What technical domains does this repo teach/embody? |
| KN-02 | Insight density          | 5/5    | 1/5  | Non-obvious insights embedded in code/docs/design   |
| KN-03 | Learning path potential  | 4/5    | 2/5  | Could this repo serve as a curriculum or deep dive? |
| KN-04 | Methodology novelty      | 5/5    | 1/5  | Does this repo approach a problem in a new way?     |
| KN-05 | Relevance to active work | 5/5    | 1/5  | How directly does this connect to current projects? |

**Scoring:** Each dimension scored 0-100 with the same 4-band scale (Section 4).
The Knowledge composite score is the weighted average of KN-01 through KN-05.

**Key differences from engineer dimensions:**

- Low automation — requires reading and understanding, not counting
- Subjective — AI judgment, not tool output
- Context-dependent — KN-05 requires home repo context loading
- Changes the verdict — a repo with Critical health but Excellent knowledge
  should score differently than health-only analysis suggests

**Examples from real analyses:**

| Repo                  | Knowledge Score | What Was Missed Without This                                                                                       |
| --------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------ |
| karpathy/autoresearch | Excellent (92)  | Autonomous research methodology, agent instruction design, fixed-budget experimentation as generalizable pattern   |
| build-your-own-x      | Excellent (85)  | 363 paths into deep systems knowledge. 5 domains directly relevant to JASON-OS. The "build from scratch" pedagogy. |
| CLI-Anything          | Healthy (72)    | HARNESS.md 7-phase SOP for agent-native CLI wrapping. Claude Code plugin marketplace format.                       |
| MemSkill              | Excellent (88)  | Meta-memory concept (skills about HOW to remember). Skill evolution loop. arXiv 2602.02474.                        |

---

## 14. Creator View Specification

The Creator View is the primary analytical output for Standard and Deep modes.
It captures what the repo KNOWS and how it relates to your work.

### 14.1 Style Guide

- **Conversational prose, not tables.** Written as you'd explain a repo to a
  colleague over coffee, not as a compliance report.
- **Anti-goal: must NOT read like a technical manual.** No jargon-heavy,
  impersonal, bullet-point-only output.
- **Direct address.** "You're doing X. They're doing Y. Here's why that
  matters." Not "The repository implements X."
- **Depth over brevity.** Each section should be substantive — 5-15 lines of
  real analysis, not 2-line summaries.
- **Opinionated when warranted.** The Challenge section (14.5) exists to push
  back. Don't soften genuine insights.

### 14.2 Home Repo Context Loading

Before writing any Creator View section, load home context in explicit priority
order. Higher-priority sources override lower when signals conflict.

**Priority ranking (MUST load all):**

1. **`SESSION_CONTEXT.md`** (primary) — current sprint, active work, immediate
   priorities. This is the primary input for personal fit scoring.
2. **`ROADMAP.md`** (secondary) — project direction, planned features, vision.
   Provides medium-term context for fit assessment.
3. **`CLAUDE.md`** — conventions, stack, architecture constraints
4. **`.claude/skills/`** directory listing — active skills inventory
5. **Active project memories from MEMORY.md** — project initiatives, decisions

**MAY load (when comparison requires deeper context):**

- Specific skill SKILL.md files for detailed comparison
- Agent definitions for agent-architecture comparison
- Specific source files when the external repo has a direct equivalent

### 14.3 Section: What This Repo Understands (+ Blindspots)

Deep analysis of the repo's embedded knowledge. Not WHAT it does (features,
functionality) — what it KNOWS (mental models, techniques, philosophies). The
natural complement: what they DON'T know, haven't solved, or are blind to.

**Knowledge prompts:**

- What problem does this repo solve, and what understanding of that problem does
  it demonstrate?
- What non-obvious design decisions reveal deep domain knowledge?
- What would a developer learn by studying this codebase that they couldn't
  learn from documentation alone?
- What methodologies or approaches does this repo embody?

**Blindspot prompts:**

- What problems does this repo NOT solve that it arguably should?
- What failure modes or edge cases has this repo not anticipated?
- What domains adjacent to their core work have they not entered?

### 14.4 Section: What's Relevant To Your Work

Direct comparison to home repo. Reference specific files, skills, approaches.

**Prompts to explore:**

- What does this repo do that we also do? How do their approaches differ?
- What does this repo do that we DON'T do? Should we?
- What active projects (JASON-OS, current sprint) would benefit from this
  knowledge?
- Are there specific skills, agents, or workflows that overlap?

### 14.5 Section: Where Your Approach Differs

Classify each meaningful difference:

| Classification | Meaning                                   | Action                                         |
| -------------- | ----------------------------------------- | ---------------------------------------------- |
| **Ahead**      | You've already solved this better         | Confirm direction, note as validation          |
| **Different**  | Valid alternative approach, neither wrong | Consider whether their approach has advantages |
| **Behind**     | They've figured out something you haven't | Investigate further, consider adopting         |

### 14.6 Section: The Challenge

The most important section. Opinionated, specific, actionable.

**Rules:**

- Only when warranted. If nothing genuinely challenges your approach, say so
  explicitly: "No significant challenges identified."
- Never forced. Don't manufacture challenges for completeness.
- Never obstructive. Challenge to improve, not to criticize.
- One recommendation, not five. "THE thing to consider."
- Include reasoning. Why this matters, what changes if you adopt it.

### 14.7 Section: Knowledge Candidates

What you could LEARN from deeper engagement. Not code to extract — understanding
to gain.

**Tier structure:**

- **Tier 1: Directly relevant** — connects to active projects, current sprint
- **Tier 2: Deepens understanding** — builds systems knowledge, mental models
- **Tier 3: Interesting but lower priority** — worth knowing, not urgent

Added to `value-map.json` alongside pattern candidates. Knowledge candidates use
extraction effort E0 (read/study) or E1 (experiment/prototype).

**Brilliant-but-off-sprint callout:** After the tiered listing, include a
dedicated paragraph identifying candidates with high objective score but low
personal fit. These are "brilliant but off-sprint" -- worth parking, not
discarding. For each, explain why it scored high objectively and why it doesn't
fit the current sprint. Frame as "worth parking, not discarding" with specific
reasoning for why each is high-objective.

**Fit badge derivation (used in value-map.json and EXTRACTIONS.md):**

| Condition                                            | Badge             |
| ---------------------------------------------------- | ----------------- |
| `personal_fit_score >= 60`                           | `[ACTIVE-SPRINT]` |
| `personal_fit_score < 60 AND objective_score >= 60`  | `[PARK]`          |
| `objective_score >= 40 AND personal_fit_score >= 40` | `[EVERGREEN]`     |
| Otherwise                                            | (no badge)        |

### 14.8 Section: What's Worth Avoiding

Cautionary learnings and anti-ideas. Not "what's wrong with this repo" (that's
the Engineer View) — "what patterns, approaches, or decisions from this repo
should you consciously NOT replicate?"

**Content categories:**

- **Anti-patterns embedded in the codebase or process.** Patterns that work for
  them but are fundamentally flawed or would fail at different scale.
- **Cultural or organizational decisions that led to negative outcomes.** How
  governance, contribution policy, or community management created problems.
- **Approaches that worked for them but would fail in your context.** Context-
  dependent solutions that don't transfer.
- **Cautionary case studies.** Named patterns like CELEBRITY_STAGNATION from
  public-apis — real examples of failure modes worth remembering.

**Rules:**

- Every anti-idea MUST cite specific evidence from the repo (file, commit,
  issue, PR, or observable pattern).
- Findings tagged with `category: "cautionary"` in `findings.jsonl` feed this
  section.
- Not a criticism section. Frame as "what to avoid doing yourself" not "what
  they did wrong."
- Only when warranted. If no cautionary learnings exist, say so explicitly.

---

## 15. Standard/Deep Process Details

Absorbed from SKILL.md v2.0 to keep SKILL.md under 300 lines.

### 15.1 Clone Process (Phase 1)

1. Clone: `git clone --filter=blob:none --depth=1 <url>` to
   `/tmp/repo-analysis-<slug>/`
2. LFS check: `GIT_LFS_SKIP_SMUDGE=1` if `.gitattributes` detected
3. Monorepo detection (turbo.json, nx.json, pnpm-workspace.yaml, etc.)
4. **Repomix generation (MUST — immediately after clone):**
   `npx repomix@latest --compress --output <output-dir>/repomix-output.txt`
   Verify file exists. If fails: retry once, report to user. Never skip.
5. For Deep: `git fetch --unshallow` or `--shallow-since="1 year ago"`
6. Update state file with clone path and strategy

### 15.2 Dimension Wave (Phase 2)

**Small repos (<20 files):** Analyze inline via Bash. Subagents cannot access
temp directories — do NOT spawn agents for small repos.

**Large repos (20+ files):** Copy clone to project workspace at
`.research/analysis/<slug>/source/`, then spawn agents against that path. Max 4
concurrent. See Section 10 for agent allocation.

**Agent failure handling (MUST):**

1. After each agent completes, verify dimension file exists
2. If file is empty (0 bytes — Windows agent output bug): capture
   task-notification result text, write to dimension file
3. If agent failed entirely: log failure reason, re-dispatch with narrower scope
   (same pattern as deep-research agent overflow)
4. If retry also fails: report to user, continue with available dimensions
5. NEVER silently accept missing dimension data

### 15.3 Temporal Analysis (Phase 3 — Deep only)

1. `git shortlog -sn --all` for contributor breakdown
2. `git log --format="%aI"` for commit velocity distribution
3. `git log --numstat` for churn hotspot detection
4. Bot-commit filtering (exclude dependabot, renovate, etc.)
5. Monthly aggregation for temporal fingerprint (Section 7)

### 15.4 Content Evaluation Detail (Phase 3.5)

> Absorbed from SKILL.md v5.0 to keep SKILL.md under ~330 lines. Phase 3.5 was
> numbered 4b prior to v5.0.

Evaluate the repo's embedded content for specific relevance to home context.
Runs BEFORE Creator View (Phase 4) and feeds into it. Applies to ALL repo types.

#### 15.4.1 Curated-List / Registry Repos

The repo's value IS its links. Evaluate them, not just count them.

- **Depth 0 (MUST):** Parse entries, classify by category, score categories
  against home context (SoNash features, JASON-OS domains, current roadmap).
- **Depth 1 (MUST for medium/high categories):** Evaluate individual entries
  within relevant categories. For each: name, what it does, auth requirements,
  specific applicability to home work. Filter structured metadata (auth type,
  HTTPS, CORS) to surface zero-friction integration candidates.
- **Depth 2 (interactive gate):** Targeted deep-dive on selected entries. Fetch
  docs, test endpoints, evaluate quality. Gate: _"N entries look relevant.
  Deep-dive? [Y/N/Select]"_

Output to `mined-links.jsonl` (curated-list) or `content-eval.jsonl` (other).
See §16 for link mining spec. If Depth 1 fetch fails for >50% of links, abort
Depth 1 and present Depth 0 results.

#### 15.4.2 Framework / Library / Tool Repos

Evaluate internal documentation artifacts identified in Deep Read (Phase 2b):

- **Guides and tutorials:** Read each. Note which are relevant to home work.
- **Per-module docs** (e.g., 37 SKILL.md files in cli-anything): Sample
  representative examples. Compare against home equivalents. Identify the
  best-built and worst-built examples.
- **Embedded SKILL.md / instruction files:** Read and compare against home
  SKILL.md format. Note structural differences.

#### 15.4.3 Research / Experimental Repos

Evaluate referenced external resources:

- **Papers / arXiv references:** Summarize relevance. Note if the paper's
  methodology applies to home work.
- **Linked repos** (forks, parent repos, related projects): Catalog with
  one-line relevance assessment.
- **Datasets / models referenced:** Note if accessible and applicable.
- **Notebooks:** Read for methodology patterns, not just code.

#### 15.4.4 Output Schema

Write `content-eval.jsonl` with one entry per evaluated item:

```json
{
  "category": "guide|api|tutorial|paper|repo|notebook|skill-file",
  "name": "...",
  "url": "...",
  "relevance": "high|medium|low|none",
  "applicability": "...",
  "home_connection": "..."
}
```

This output feeds directly into Creator View Section 2.

### 15.5 Coverage Audit Detail (Phase 6b)

> Absorbed from SKILL.md v5.0.

After all artifacts are written, scan for content that exists in the repo but
was NOT analyzed. Safety net that catches edge cases.

#### 15.5.1 Scan Categories

1. **Referenced but unfollowed links** — URLs in README, docs, or code comments
   pointing to external resources not evaluated in Phase 3.5.
2. **Internal artifacts not read** — guides, notebooks, examples, config files,
   embedded docs discovered in Phase 2b but not read.
3. **Structured data not queried** — metadata fields (auth types, categories,
   registry entries, dependency lists) that could have been filtered against
   home context but weren't.
4. **Cross-repo connections not traced** — references to other repos (analyzed
   or not) whose content relationships weren't explored.
5. **Anomalies** — unexpectedly large files, hidden directories, generated
   artifacts, binary blobs, config files suggesting undocumented features.

#### 15.5.2 Interactive Output Format

```
Coverage Audit: N unexplored items found.

  [A] Referenced links not evaluated (M items)
      - arXiv 2602.02474 (referenced in value-map)
      - https://github.com/karpathy/nanochat (parent repo)
  [B] Internal docs not read (K items)
      - guides/mcp-backend.md
      - guides/skill-generation.md
  [C] Structured data not queried (J items)
      - 807 no-auth APIs not filtered for SoNash applicability
  [D] Cross-repo connections (L items)
      - memskill arXiv -> autoresearch methodology overlap?
  [E] Anomalies (P items)
      - analysis.ipynb (8.4KB notebook, methodology patterns)

Analyze all / Select categories / Skip? [A/S/N]
```

#### 15.5.3 User Decision Handling

- **Analyze** → Run additional analysis, update affected artifacts
  (creator-view.md, value-map.json, content-eval.jsonl), re-verify.
- **Select categories** → Same as Analyze, but only for chosen categories.
- **Skip** → Record skipped items in `coverage-audit.jsonl` with
  `user_decision: "skip"`. Do NOT silently discard — the record ensures the next
  run or `/synthesize` knows what was deferred.

### 15.6 Cross-Repo Extraction Tracking Detail

> Absorbed from SKILL.md v5.0.

After writing value-map.json, update both cross-repo extraction files.

#### 15.6.1 `extraction-journal.jsonl` Schema (v2.0, unified with website-analysis)

Machine-readable, one JSON object per line:

```json
{
  "schema_version": "2.0",
  "source_type": "repo",
  "source": "owner/name",
  "candidate": "Name",
  "type": "pattern|knowledge|content|anti-pattern|tool",
  "decision": "defer|extract|skip|investigate",
  "decision_date": "YYYY-MM-DD",
  "extracted_to": null,
  "extracted_at": null,
  "notes": "...",
  "novelty": "high|medium|low",
  "effort": "E0|E1|E2|E3",
  "relevance": "high|medium|low"
}
```

Remove stale entries for the repo being re-analyzed. Write fresh entries for all
candidates in value-map.json.

#### 15.6.2 `EXTRACTIONS.md` Regeneration

Human-readable cross-repo summary with Table of Contents. **Do NOT edit
manually.** After updating the journal, run:

```bash
node scripts/cas/generate-extractions-md.js
```

This regenerates the entire file from the journal including header stats, TOC
(source, type, candidate counts by category), and per-source tables.

#### 15.6.3 Canonicality

- `extraction-journal.jsonl` is the **data source** — always updated first.
- `EXTRACTIONS.md` is the **generated reading interface** — always regenerated
  from the journal, never manually appended.

Self-audit verifies: `grep -c "$SOURCE" .research/extraction-journal.jsonl` >= 1
AND the generator script output confirms the source is included in
EXTRACTIONS.md.

---

## 16. Link Mining Pipeline

Conditional phase (Phase 4b in SKILL.md) that runs only when `repo_type` is
`curated-list` or `registry`. Extracts, scores, and optionally fetches links
found in the repository's markdown files. Output: `mined-links.jsonl` (Section
3.7).

### 16.1 Phase 4b Process (10 Steps)

```
4b.1  Parse markdown structure --> extract all links with context
4b.2  Categorize links using source repo's own category structure
4b.3  Score at Depth 0 (category match + keyword overlap with home context)
4b.4  Write mined-links.jsonl with confidence: "low"
4b.5  Interactive gate: "[N] links extracted. Fetch and verify? ~[M] min. [y/N]"
4b.6  If yes --> Depth 1: HEAD-first (5 req/sec), selective full fetch (1 req/sec)
4b.7  Update mined-links.jsonl: confidence --> "high", fetch_status updated
4b.8  Present top-N by personal_fit_score with [ACTIVE-SPRINT]/[PARK] badges
4b.9  Interactive gate: "Targeted deep-dive on specific links? [select/N]"
4b.10 If yes --> Depth 2: full fetch + analysis on selected links only
```

### 16.2 Markdown Parsing Rules

Three link formats detected, in order of prevalence in curated lists:

**List format** (most common in awesome-lists):

```markdown
- [Title](URL) - Description
- [Title](URL) -- Description
```

**Table format:**

```markdown
| Name    | URL                                 | Description          |
| ------- | ----------------------------------- | -------------------- |
| FastAPI | https://github.com/tiangolo/fastapi | Modern web framework |
```

**Heading-based categories:**

```markdown
## Category Name

### Subcategory Name

- [Title](URL) - Description
```

The source repo's category taxonomy is preserved in the `category` field of
`mined-links.jsonl`. Heading hierarchy maps to category path (e.g.,
`"Web Frameworks > Python"`).

### 16.3 Depth 1 -- HEAD-First Strategy

Designed for efficiency when processing 500-1000+ links from large curated
lists. Estimated time: ~5 minutes for 850 links.

1. **Group links by domain.** Links to the same domain share rate limit budget.
2. **HEAD request at 5 req/sec**, max 5 concurrent per domain. Record:
   - HTTP status code
   - Content-Type header
   - Content-Length header
   - Title from headers (if available)
3. **Filter for full fetch.** Only full-fetch links where:
   - Depth 0 `personal_fit_score >= 40`, OR
   - Depth 0 `objective_score >= 70`
4. **Full fetch filtered links at 1 req/sec.** Extract:
   - Page title (from `<title>` tag)
   - Meta description
   - Open Graph tags (`og:title`, `og:description`, `og:image`)
   - First 500 characters of body text
5. **Re-score with enriched data.** Update `confidence: "high"` in
   `mined-links.jsonl`.

### 16.4 Depth 2 -- Targeted Deep-Dive

User selects specific links from Depth 1 results. For each selected link:

1. Full page fetch and analysis
2. Follow internal links one level (links within the same domain)
3. Write enriched findings to `mined-links.jsonl` with `depth: 2`

### 16.5 Home Context for Link Scoring

Same loading order as Creator View (Section 14.2):

1. `SESSION_CONTEXT.md` (primary) -- active sprint items populate
   `personal_fit_projects[]`
2. `ROADMAP.md` (secondary) -- project direction for medium-term relevance
3. `CLAUDE.md` -- stack constraints for compatibility filtering

---

## 17. Cross-Repo Awareness

Lightweight cross-referencing during per-repo analysis. Not full synthesis
(that's `/synthesize`) -- just awareness of what's already been analyzed and how
repos relate.

### 17.1 During Phase 4 (Creator View)

1. Check `.research/analysis/*/value-map.json` for existing analyses
2. If matches found (similar `ecosystem_tags`, overlapping candidates):
   - Add cross-reference notes in Creator View Section 2 (What's Relevant)
   - Example: "This repo's rate limiter pattern is similar to what you found in
     fastapi/fastapi (analyzed 2026-03-15). Their approach differs in..."
3. Populate `related_repos[]` in `value-map.json` for any relationships
   discovered

### 17.2 During Phase 6 (Value Map Generation)

1. Append to `.research/analysis/reading-chain.jsonl` (Section 3.8) for any repo
   relationships discovered during analysis
2. Check `reading-chain.jsonl` for existing chains that this repo extends
3. If this repo was referenced by a previously-analyzed repo, note the
   back-reference

### 17.3 Synthesis Auto-Offer

After analysis completion, if 3+ repos have been analyzed:

```
"You've analyzed [N] repos. Cross-repo synthesis available via /synthesize.
Run now? [y/N]"
```

Check: `ls .research/analysis/*/analysis.json | wc -l >= 3`

---

## 18. Version History

| Version | Date       | Description                                         |
| ------- | ---------- | --------------------------------------------------- |
| 4.0     | 2026-04-05 | Creator View v2: dual scoring lens, 6-section CV,   |
|         |            | repo type classification, link mining pipeline,     |
|         |            | fit separation, anti-ideas, cross-repo awareness,   |
|         |            | reading chain. 30-decision deep-plan.               |
| 3.0     | 2026-04-03 | Dual-lens rewrite: Creator View + Engineer View.    |
|         |            | Knowledge dimensions (KN-01-05). No silent skips.   |
|         |            | Inline analysis for small repos. Repomix mandatory. |
|         |            | SKILL.md compressed to <300 lines.                  |
| 2.0     | 2026-04-03 | Schema alignment, adoption assessment, extraction   |
|         |            | persistence, agent capture fixes, repomix           |
| 1.2     | 2026-04-03 | Output path: .research/analysis/<slug>/             |
| 1.1     | 2026-04-02 | Skill-audit: 16 decisions — UX, guard rails, labels |
| 1.0     | 2026-04-02 | Initial: 3 tiers, 45 dimensions, routing, resume    |
