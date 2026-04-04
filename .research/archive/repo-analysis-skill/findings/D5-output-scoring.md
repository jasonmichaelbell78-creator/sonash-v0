# Findings: D5 — How Should Repo Analysis Results Be Structured for Maximum Downstream Utility?

**Searcher:** deep-research-searcher **Profile:** web + codebase **Date:**
2026-03-31 **Sub-Question IDs:** D5

---

## Key Findings

### 1. Established Machine-Readable Formats: SARIF, CodeClimate, and OpenSSF Probe JSON [CONFIDENCE: HIGH]

Three dominant machine-readable formats exist, each with a distinct philosophy:

**SARIF 2.1.0 (OASIS Standard)** [1] [2] is the industry-standard interchange
format for static analysis. Its structure:

- Root: `{ version, $schema, runs[] }`
- Each `run`: `{ tool, results[], artifacts[], invocations[] }`
- Each `result`:
  `{ ruleId, level (none/note/warning/error), message, locations[], kind, fingerprints, suppressions[], rank (0-100) }`
- No native run-level aggregate/summary object — consumers derive summaries by
  iterating `results`
- Suppression tracking is first-class:
  `{ kind: "inSource"|"external", status: "accepted"|"underReview"|"rejected", justification }`
- The `rank` field (0-100) provides machine-sortable severity within a level

The absence of a native summary structure is a deliberate design choice — SARIF
is a results container, not a scoring system.

**CodeClimate Issue Format** [3] is a streaming JSONL format (null-byte
terminated) for engine outputs:

- `{ type: "issue", check_name, description, categories[], location, severity, fingerprint, remediation_points }`
- Severity: `info | minor | major | critical | blocker`
- Categories: Bug Risk, Clarity, Compatibility, Complexity, Duplication,
  Performance, Security, Style
- `remediation_points` is an abstract relative scale (not time-based) for effort
  estimation
- GitLab consumes a subset of this format in its Code Quality CI integration

**OpenSSF Scorecard Probe Format** [4] is the most downstream-useful for policy
enforcement:

```json
{
  "date": "YYYY-MM-DD",
  "repo": { "name": "github.com/org/repo", "commit": "hash" },
  "scorecard": { "version": "", "commit": "" },
  "findings": [
    {
      "probe": "probeName",
      "desc": "Human-readable description",
      "outcome": "True|False",
      "values": {},
      "remediation": { "text": "", "markdown": "", "effort": "High|Medium|Low" }
    }
  ]
}
```

Key insight: 44 discrete binary probes are more policy-actionable than an opaque
0-10 aggregate score. Organizations can define their own risk profiles by
selecting which probes must pass.

**Implication for repo-analysis-skill:** Use SARIF-compatible structure for
individual findings (enables GitHub integration), augment with a custom summary
wrapper for scoring and aggregation.

---

### 2. Scoring Rubrics: Letter Grades vs Numeric Scales vs Traffic Lights [CONFIDENCE: HIGH]

SonarQube's A-E rating system [5] is the most studied approach for code quality:

- Security/Reliability ratings: A (zero issues) through E (at least one blocker)
- Maintainability: A (≤5% debt ratio) through E (≥50% debt ratio)
- Quality gate: binary PASS/FAIL combining multiple A-E thresholds
- Key insight: The A-E scale uses **bounded severity tiers** rather than raw
  numeric counts, making it resilient to project size differences

Repo Doctor [6] uses 0-100% with P0/P1/P2 priority tiers — easier to communicate
to non-technical stakeholders than A-E.

Research on grading communication [7] shows that **hybrid approaches** (numeric
score + descriptive label) outperform either alone. For example:
`82/100 — "Healthy"` conveys both precision and semantic meaning.

**Recommendation for repo-analysis-skill:**

- Primary display: Numeric 0-100 per dimension + overall composite
- Secondary label: Qualitative band (Critical / Needs Work / Healthy /
  Excellent)
- Machine field: Raw numeric for downstream computation
- Avoid pure letter grades alone (A-F ambiguous — is "C" acceptable or failing?)

**Band definitions (proposed):** | Score | Band | Color |
|-------|------|-------| | 0-39 | Critical | Red | | 40-59 | Needs Work | Orange
| | 60-79 | Healthy | Yellow | | 80-100 | Excellent | Green |

---

### 3. Radar/Spider Charts: Dimensions and Design Constraints [CONFIDENCE: HIGH]

Radar charts work best with 5-8 axes and no more than 4-5 overlapping polygons
[8]. For software quality, the SonarQube model [5] provides 8 primary dimensions
which can be reduced to 6 for visual clarity:

**Proposed radar axes for repo-analysis-skill (6 dimensions):**

1. **Security** — vulnerability count, secrets exposure, dependency CVEs
2. **Reliability** — bug density, error handling coverage, test coverage
3. **Maintainability** — cyclomatic complexity, duplication rate, debt ratio
4. **Documentation** — README quality, inline docs, architecture docs
5. **Process** — CI/CD presence, branch protection, deployment automation
6. **Velocity Indicators** — commit frequency, PR merge time, contributor
   activity

Constraints from radar chart research [8]:

- All axes must share the same 0-100 scale for polygon area to be meaningful
- Don't include dimensions with different natural units without normalization
- Radar charts are better for "shape of health" at a glance than for precise
  comparison
- For repo-vs-repo comparison, limit to 3 repos max on a single radar

---

### 4. Comparison Frameworks: Normalization Across Languages and Sizes [CONFIDENCE: MEDIUM]

Cross-language normalization is an unsolved problem. The dominant approaches
are:

**Density-based normalization:** Express metrics per 1000 lines of code (defect
density, complexity density). This handles size differences but not language
expressiveness differences [9].

**Function point normalization:** Measure by functional complexity rather than
LOC — handles language differences but requires significant analysis effort.

**SIG Benchmarking approach** [10]: The Software Improvement Group stores
individual assessments in a repository and benchmarks any system against the
"industry-wide state of the art." Their model uses decile rankings (top 10%,
median, bottom 10%) rather than absolute scores — a given metric score means
"better than X% of projects in the same category."

**Practical approach for repo-analysis-skill:**

- For self-comparison over time: use raw metrics (no normalization needed)
- For repo-vs-repo: normalize by LOC density, flag language differences as a
  caveat
- For repo-vs-benchmark: express as percentile rank against a reference corpus,
  not absolute score
- Always surface the normalization method used — hidden normalization destroys
  trust

**Key caveat:** Cross-language normalization at scale requires a reference
corpus. Without one, percentile claims are unverifiable. A simpler approach is
to express findings as "exceeds/meets/below common thresholds" with explicit
threshold citations.

---

### 5. Actionable Insight Extraction: "Top 3 to Steal, Top 3 to Avoid" Pattern [CONFIDENCE: MEDIUM]

The "top N patterns to adopt/avoid" format is an emerging pattern in AI-powered
repo analysis tools [11]. Repo Doctor [6] structures each finding with: (1)
evidence-backed support, (2) specific remediation steps with code snippets, (3)
priority ranking.

**Insight extraction principles from research:**

1. **Prioritized by impact × effort matrix** — surface highest-ROI items first
   (high impact, low effort = steal immediately)
2. **Evidence-anchored** — every recommendation must link to a specific file,
   pattern, or metric that justifies it
3. **Concrete over general** — "Add `SECURITY.md` with a vulnerability
   disclosure contact" beats "improve security documentation"
4. **Counter-argument required** — honest insight requires surfacing why NOT to
   adopt a pattern (the SoNash TDMS schema includes a `counter_argument` field
   for this reason)

**"Top 3 to steal" generation algorithm (proposed):**

- Filter findings with `pattern_type: "strength"` AND
  `transferability_score > 70`
- Sort by estimated impact
- Take top 3, format as:
  `{ pattern, why_it_works, how_to_adopt, evidence_files[] }`

**"Top 3 to avoid" generation algorithm (proposed):**

- Filter findings with `severity: "S0|S1"` AND `category: "anti-pattern"`
- Sort by impact × likelihood
- Take top 3, format as:
  `{ pattern, why_it_fails, what_to_do_instead, evidence_files[] }`

---

### 6. JSONL Schema for Downstream Consumption: TDMS, Deep-Plan, and AI Agents [CONFIDENCE: HIGH]

The project's existing JSONL_SCHEMA_STANDARD.md [12] defines the canonical
intake format for TDMS. The repo-analysis-skill output MUST be compatible with
this schema for direct `intake-audit.js` ingestion.

**Existing TDMS intake contract (required fields):**

```json
{
  "title": "string",
  "severity": "S0|S1|S2|S3",
  "category": "security|performance|code-quality|refactoring|documentation|process",
  "file": "path/to/file",
  "line": 42,
  "description": "string",
  "recommendation": "string",
  "source": "repo-analysis-<date>"
}
```

**Extended fields from JSONL_SCHEMA_STANDARD.md (for full compliance):**

```json
{
  "fingerprint": "<category>::<file>::<identifier>",
  "effort": "E0|E1|E2|E3",
  "confidence": 0-100,
  "files": ["array"],
  "why_it_matters": "string",
  "suggested_fix": "string",
  "acceptance_tests": ["array"],
  "evidence": ["array"]
}
```

**For deep-plan consumption**, the output needs a higher-level summary that
feeds the DIAGNOSIS.md Phase 0 context injection pattern. The deep-plan SKILL.md
[13] specifies a `## Research Context` section that can be injected from
`.research/<topic-slug>/`.

**Agent-to-agent schema design principles** [14]: Keep schemas minimal (only
fields that will be used), version schemas as API contracts, use separate
schemas for different contexts rather than one optional-heavy schema.

---

### 7. Trend Tracking: Diff Reports and Regression Detection [CONFIDENCE: MEDIUM]

No single established format exists for quality trend diffs. The patterns
observed across tools:

**SARIF baseline approach:** SARIF results include `baselineState` field (`new`,
`updated`, `unchanged`, `absent`) when compared against a previous run. This is
the cleanest approach for per-finding diff tracking.

**DORA-style trend structure** [15]: Express performance as a time series with
improvement/regression detection:

```json
{
  "metric": "string",
  "current": { "value": 0, "timestamp": "ISO8601" },
  "previous": { "value": 0, "timestamp": "ISO8601" },
  "delta": 0,
  "trend": "improving|stable|regressing",
  "threshold": { "pass": 80, "warn": 60 }
}
```

**SonarQube "new code" principle:** Track metrics separately for new code vs.
overall code. New-code metrics reveal trajectory; overall metrics reveal
accumulated state.

**Recommended trend record schema:**

```json
{
  "analysis_id": "uuid",
  "repo": "string",
  "timestamp": "ISO8601",
  "dimensions": {
    "security": { "score": 0, "delta": 0, "trend": "string" },
    "reliability": { "score": 0, "delta": 0, "trend": "string" }
  },
  "new_findings": ["DEBT-IDs or fingerprints"],
  "resolved_findings": ["DEBT-IDs or fingerprints"],
  "unchanged_findings": ["count"]
}
```

---

### 8. Progressive Disclosure: Executive Summary vs Detailed Drill-Down [CONFIDENCE: HIGH]

Nielsen Norman Group established that progressive disclosure should lead with
critical information and make depth available on demand [16]. For technical
reports this translates to a 3-layer structure:

**Layer 1 (Executive, ~1 paragraph):**

- Overall score + band + one-sentence interpretation
- Single most urgent action
- Trend arrow (improving/stable/regressing)

**Layer 2 (Manager/Lead, ~1 page):**

- Per-dimension radar scores
- Top 3 strengths + top 3 weaknesses
- "Top 3 to steal, top 3 to avoid" lists
- Change delta from last analysis

**Layer 3 (Engineer, full detail):**

- Individual finding JSONL records
- File-level evidence
- Specific line references
- Acceptance tests for each recommendation

GitHub's analysis of 2,500+ repositories [17] found that structured output with
named sections (`## Project Overview`, `## Architecture & Structure`) acts as
"output scaffolding" — the model treats section headers as required
deliverables, producing consistently formatted reports across different
codebases.

---

## Sources

| #   | URL                                                                                                                                               | Title                                          | Type                 | Trust  | CRAAP | Date       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------- | ------ | ----- | ---------- |
| 1   | https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html                                                                                  | SARIF 2.1.0 OASIS Standard                     | Official spec        | HIGH   | 4.8   | 2022       |
| 2   | https://www.sonarsource.com/resources/library/sarif/                                                                                              | Complete Guide to SARIF                        | Vendor docs          | HIGH   | 4.2   | 2025       |
| 3   | https://github.com/codeclimate/platform/blob/master/spec/analyzers/SPEC.md                                                                        | CodeClimate Engine SPEC.md                     | Official spec        | HIGH   | 4.6   | 2024       |
| 4   | https://openssf.org/blog/2024/04/17/beyond-scores-with-openssf-scorecard-granular-structured-results-for-custom-policy-enforcement/               | Beyond Scores with OpenSSF Scorecard           | Official blog        | HIGH   | 4.5   | 2024       |
| 5   | https://docs.sonarsource.com/sonarqube-server/10.8/user-guide/code-metrics/metrics-definition                                                     | SonarQube Metrics Definition                   | Official docs        | HIGH   | 4.7   | 2025       |
| 6   | https://dev.to/glaucia86/repo-doctor-ai-powered-github-repository-health-analyzer-136n                                                            | Repo Doctor AI Health Analyzer                 | Community article    | MEDIUM | 3.8   | 2025       |
| 7   | https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2018.00022/full                                                             | Appropriate Criteria: Key to Effective Rubrics | Peer-reviewed        | HIGH   | 4.3   | 2018       |
| 8   | https://www.highcharts.com/blog/tutorials/radar-chart-explained-when-they-work-when-they-fail-and-how-to-use-them-right/                          | Radar Chart Explained                          | Vendor tutorial      | MEDIUM | 4.0   | 2024       |
| 9   | https://blog.codacy.com/code-quality-metrics                                                                                                      | 8 Code Quality Metrics Every Team Should Track | Vendor blog          | MEDIUM | 3.9   | 2025       |
| 10  | https://www.semanticscholar.org/paper/Standardized-code-quality-benchmarking-for-software-Baggen-Correia/3b4881fffbb2530f844f5f884046c4e3be6e72a3 | Standardized Code Quality Benchmarking (SIG)   | Academic paper       | HIGH   | 4.4   | 2011       |
| 11  | https://dev.to/glaucia86/repo-doctor-ai-powered-github-repository-health-analyzer-136n                                                            | Repo Doctor — P0/P1/P2 patterns                | Community            | MEDIUM | 3.8   | 2025       |
| 12  | `docs/templates/JSONL_SCHEMA_STANDARD.md`                                                                                                         | SoNash JSONL Schema Standard                   | Internal canon       | HIGH   | 5.0   | 2026-02-12 |
| 13  | `.claude/skills/deep-plan/SKILL.md`                                                                                                               | SoNash Deep Plan Skill                         | Internal canon       | HIGH   | 5.0   | 2026-03-07 |
| 14  | https://binarytrails.com/posts/2025/11/working_with_structured_data                                                                               | Working with Structured Data in AI Agents      | Community            | MEDIUM | 3.7   | 2025       |
| 15  | https://dora.dev/guides/dora-metrics-four-keys/                                                                                                   | DORA Four Keys Metrics                         | Official             | HIGH   | 4.6   | 2025       |
| 16  | https://www.nngroup.com/articles/progressive-disclosure/                                                                                          | Progressive Disclosure — Nielsen Norman Group  | Official             | HIGH   | 4.8   | 2025       |
| 17  | https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/                                  | How to Write a Great agents.md                 | Official GitHub Blog | HIGH   | 4.5   | 2025       |

---

## Contradictions

1. **Numeric score vs. threshold-based rating:** SonarQube's A-E model argues
   that severity thresholds (e.g., "any blocker = E") are more meaningful than
   numeric aggregates because a single critical issue shouldn't be averaged
   away. Repo Doctor's 0-100% model argues numeric scores communicate gradient
   progress better. Both are defensible — the contradiction is a design
   philosophy choice, not a factual dispute.

2. **Aggregate scores vs. probe-based pass/fail:** OpenSSF explicitly argues
   that moving "beyond scores" to discrete binary probes is more actionable for
   policy enforcement. Yet most human-facing tools (SonarQube, Repo Doctor,
   Codacy) lead with aggregate scores because humans need a gestalt before
   details. Resolution: use both — aggregate for display, probes for machine
   policy.

3. **Cross-language normalization:** SIG academic benchmarking uses decile
   ranking against an industry corpus. Practical tools (Codacy, SonarQube) use
   raw density metrics (per 1000 LOC) without language weighting. There is no
   consensus on whether language-adjusted normalization is worth the added
   complexity for most use cases.

---

## Gaps

1. **No established "patterns to steal/avoid" output format found** — the
   concept exists in ad-hoc AI analysis tools but no standardized schema was
   located. The schema proposed below is original synthesis.

2. **Deep-plan consumption contract not explicitly documented** — the deep-plan
   SKILL.md describes accepting a `## Research Context` block from
   `.research/<topic-slug>/` but doesn't specify what fields it can parse
   programmatically. The injection is prose-only, not structured.

3. **TDMS `source` field conventions for repo-analysis** — TDMS accepts
   `--source "audit-<type>-<date>"` but no existing source prefix for external
   repo analysis was found. A new convention (e.g.,
   `"repo-analysis-<target-repo>-<date>"`) would need to be established.

4. **Trend database schema** — no canonical schema for storing analysis runs
   over time was found in the codebase. This would need to be designed from
   scratch.

5. **Radar chart rendering** — the research confirms 5-8 axes is optimal, but no
   decision on whether to output a chart image, chart-spec JSON (e.g.,
   Vega-Lite), or just the raw scores for the caller to render.

---

## Serendipity

- **SARIF's `rank` field (0-100)** is underused by most tools — it provides
  machine-sortable confidence within a severity level, which is more useful for
  prioritization than level alone. Could be mapped directly to the TDMS
  `confidence` field.
- **CodeClimate redirected to qlty.sh** — CodeClimate's Engine spec has been
  taken over by a new platform (qlty.sh). This means the CodeClimate format is
  now "legacy" and qlty.sh may diverge from it.
- **DORA 5th metric (2025)** — DORA added a fifth key metric in October 2025
  (reliability/operational health). Any DORA-integrated reporting should include
  this new dimension.
- **OpenSSF is moving toward a REST API and BigQuery access** for structured
  results — this would make OpenSSF scorecard data programmatically queryable
  across repos, enabling true industry benchmarking.

---

## Proposed Output Schema

The following schema is designed for maximum downstream utility:
TDMS-ingestible, deep-plan-injectable, human-readable at three layers, and
trend-trackable.

### File Conventions

```
.research/<repo-slug>/
  analysis.json          ← Full structured output (machine primary)
  summary.md             ← Layer 1+2 human summary (deep-plan injectable)
  findings.jsonl         ← TDMS-ingestible individual findings
  trends.jsonl           ← Append-only trend log (one record per run)
```

### analysis.json (Full Structured Output)

```json
{
  "$schema": "repo-analysis/v1",
  "meta": {
    "analysis_id": "uuid-v4",
    "timestamp": "ISO8601",
    "target_repo": "github.com/org/repo",
    "target_commit": "sha",
    "analyzer_version": "1.0.0",
    "language": "TypeScript",
    "loc": 42000,
    "normalization_method": "per-1000-loc"
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
    "security": {
      "score": 52,
      "band": "Needs Work",
      "delta": -4,
      "findings_count": { "S0": 2, "S1": 5, "S2": 8, "S3": 3 }
    },
    "reliability": {
      "score": 78,
      "band": "Healthy",
      "delta": 2,
      "findings_count": { "S0": 0, "S1": 2, "S2": 6, "S3": 4 }
    },
    "maintainability": {
      "score": 81,
      "band": "Excellent",
      "delta": 5,
      "findings_count": { "S0": 0, "S1": 0, "S2": 12, "S3": 20 }
    },
    "documentation": {
      "score": 66,
      "band": "Healthy",
      "delta": 0,
      "findings_count": { "S0": 0, "S1": 1, "S2": 4, "S3": 7 }
    },
    "process": {
      "score": 88,
      "band": "Excellent",
      "delta": 8,
      "findings_count": { "S0": 0, "S1": 0, "S2": 2, "S3": 5 }
    },
    "velocity": {
      "score": 71,
      "band": "Healthy",
      "delta": -1,
      "findings_count": { "S0": 0, "S1": 0, "S2": 3, "S3": 2 }
    }
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
        "pattern": "Convergence-loop verification on all DIAGNOSIS.md claims",
        "why_it_works": "Prevents planning on false codebase assumptions; verified across 30+ plans",
        "how_to_adopt": "Add a verify-before-present step to any planning workflow",
        "evidence_files": [".claude/skills/deep-plan/SKILL.md"],
        "transferability_score": 95
      }
    ],
    "top_to_avoid": [
      {
        "rank": 1,
        "pattern": "Direct Firestore writes from client components",
        "why_it_fails": "Bypasses security rules and App Check; creates unauditable write paths",
        "what_to_do_instead": "Always use httpsCallable Cloud Functions for writes",
        "evidence_files": [
          "components/notebook/features/quick-actions-fab.tsx"
        ],
        "severity": "S0"
      }
    ]
  },

  "findings_summary": {
    "total": 84,
    "by_severity": { "S0": 2, "S1": 8, "S2": 35, "S3": 39 },
    "by_category": {
      "security": 18,
      "performance": 6,
      "code-quality": 40,
      "refactoring": 8,
      "documentation": 7,
      "process": 5
    },
    "new_since_last": 6,
    "resolved_since_last": 12
  }
}
```

### findings.jsonl (TDMS-Compatible, One Finding Per Line)

Each line is a JSON object fully compliant with
`docs/templates/JSONL_SCHEMA_STANDARD.md`:

```json
{
  "title": "Missing rate limit on createJournalEntry Cloud Function",
  "severity": "S0",
  "category": "security",
  "file": "functions/src/journal.ts",
  "line": 42,
  "description": "Cloud Function accepts unbounded POST requests with no rate limiting",
  "recommendation": "Add Firebase App Check + rate limiting middleware",
  "source": "repo-analysis-sonash-app-2026-03-31",
  "fingerprint": "security::functions/src/journal.ts::missing-rate-limit",
  "effort": "E1",
  "confidence": 88,
  "files": ["functions/src/journal.ts"],
  "why_it_matters": "Allows denial-of-wallet attacks and data flooding",
  "suggested_fix": "Implement rate limiter using express-rate-limit or Firebase App Check enforcement",
  "acceptance_tests": [
    "Cloud Function returns 429 after 10 req/min from single IP"
  ],
  "evidence": [
    "line 42: export const createJournalEntry = functions.https.onCall(async (data, context) => {"
  ]
}
```

### trends.jsonl (Append-Only, One Record Per Analysis Run)

```json
{
  "analysis_id": "uuid-v4",
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

### summary.md (Deep-Plan Injectable Layer 1+2)

```markdown
## Research Context: Repo Analysis — <target-repo>

**Analyzed:** 2026-03-31 | **Overall:** 74/100 (Healthy, +6 improving)

### Dimension Scores

| Dimension | Score | Band       | Trend      |
| --------- | ----- | ---------- | ---------- |
| Security  | 52    | Needs Work | regressing |
| Process   | 88    | Excellent  | improving  |

...

### Top Priority Action

Add rate limiting to Cloud Functions endpoints (3 unprotected, S0).

### Top 3 Patterns to Steal

1. Convergence-loop verification before planning (95% transferability) ...

### Top 3 Patterns to Avoid

1. Direct Firestore writes from client components (S0, data integrity risk) ...

### Finding Counts

- S0: 2 | S1: 8 | S2: 35 | S3: 39
- 84 total | 6 new | 12 resolved since last analysis
```

---

## Confidence Assessment

- HIGH claims: 5 (SARIF structure, SonarQube scoring, CodeClimate schema,
  progressive disclosure pattern, TDMS compatibility)
- MEDIUM claims: 3 (cross-language normalization, actionable insight extraction,
  trend tracking)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The proposed schema is a synthesis derived from verified external standards
(SARIF, OpenSSF, SonarQube, CodeClimate) and the project's own canonical
internal schema (JSONL_SCHEMA_STANDARD.md). It is TDMS-ingestible today without
changes to intake-audit.js.
