# Phase 5: Health Monitoring - Research

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Researched:** 2026-03-01 **Domain:** Health scoring, warning lifecycle,
mid-session alerts **Confidence:** HIGH

## Summary

Phase 5 builds a formalized health monitoring system on top of extensive
existing infrastructure. The codebase already has a fully functional `/alerts`
skill with 36 categories, weighted health scoring, sparkline trends, delta
tracking, and a `health-score-log.jsonl` that persists scores. It also has 7
ecosystem audit skills with their own scoring, benchmarks, and state management
libraries. The key work is: (1) formalizing this into a structured 57-metric /
8-category / 13-dimension system with a new `/ecosystem-health` skill, (2)
adding a warning lifecycle system with proper JSONL persistence, and (3)
creating mid-session alert hooks for metric degradation.

The existing `/alerts` skill (run-alerts.js, 3714 lines) is the primary
foundation. It already computes a composite health score with letter grades
(A-F), 36 category checkers, weighted scoring (Core 70% + State 8% + Existing
9% + Full-mode 13%), and persists to `.claude/state/health-score-log.jsonl`. The
warning schema (WarningRecord with lifecycle states) exists but no
`warnings.jsonl` file has been created yet.

**Primary recommendation:** Build `/ecosystem-health` as a structured dashboard
layer on top of `/alerts`, reorganizing its 36 categories into 8 formal
categories with 13 drill-down dimensions. Add warnings.jsonl with lifecycle
tracking. Wire mid-session alerts into existing hook infrastructure.

## Standard Stack

### Core (Already in codebase)

| Library/Tool         | Version | Purpose                                              | Why Standard                         |
| -------------------- | ------- | ---------------------------------------------------- | ------------------------------------ |
| Zod                  | 4.3.5   | Schema validation for all JSONL records              | Already used for all 5 JSONL types   |
| Node.js scripts (JS) | N/A     | Health check scripts                                 | All existing checkers are plain JS   |
| JSONL format         | N/A     | Data persistence                                     | Established JSONL-first architecture |
| safe-fs.js           | N/A     | Advisory locking, symlink guards                     | Required for all file writes         |
| scoring.js (lib)     | N/A     | scoreMetric, computeGrade, sparkline, compositeScore | Exists in 7 ecosystem audit skills   |

### Supporting

| Library/Tool                       | Purpose                                               | When to Use                                           |
| ---------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| scripts/reviews/lib/write-jsonl.ts | appendRecord with Zod validation + locking            | Writing to warnings.jsonl, ecosystem-health-log.jsonl |
| scripts/reviews/lib/read-jsonl.ts  | readValidatedJsonl with schema enforcement            | Reading from JSONL files with validation              |
| scripts/reviews/lib/schemas/       | Zod schemas (WarningRecord, DeferredItemRecord, etc.) | Validating all record types                           |
| append-hook-warning.js             | Hook warning pipeline with dedup + JSONL trail        | Mid-session alert integration                         |
| symlink-guard                      | isSafeToWrite check                                   | All file write operations                             |

### Alternatives Considered

| Instead of                     | Could Use                              | Tradeoff                                                                   |
| ------------------------------ | -------------------------------------- | -------------------------------------------------------------------------- |
| New health script from scratch | Extend run-alerts.js                   | run-alerts.js is 3714 lines already; better to create new focused script   |
| TypeScript for new scripts     | JavaScript (plain)                     | All existing checkers and ecosystem audit scripts are JS; consistency wins |
| New scoring library            | Reuse scoring.js from ecosystem audits | Already proven, has scoreMetric/computeGrade/sparkline/compositeScore      |

**Installation:** No new packages needed. All dependencies are already in the
codebase.

## Architecture Patterns

### Existing Architecture to Follow

```
.claude/
  skills/
    alerts/
      SKILL.md              # Skill definition with workflow phases
      scripts/
        run-alerts.js       # 3714-line checker with 36 categories
    comprehensive-ecosystem-audit/
      SKILL.md              # Orchestrates 7 ecosystem audits
    [domain]-ecosystem-audit/
      scripts/
        run-[domain]-ecosystem-audit.js
        checkers/            # Individual check functions
        lib/
          scoring.js         # scoreMetric, computeGrade, sparkline
          state-manager.js   # History JSONL management
          benchmarks.js      # Threshold definitions
          patch-generator.js # Auto-fix suggestions
  state/
    health-score-log.jsonl   # Already persisting scores (13 entries exist)
    alerts-baseline.json     # Delta tracking baseline
    alert-suppressions.json  # Suppression system
    hook-warnings-log.jsonl  # Warning audit trail
  hook-warnings.json         # Active warnings (JSON, not JSONL)
data/
  ecosystem-v2/
    deferred-items.jsonl     # Deferred findings with Zod schema
    reviews.jsonl            # Review records
    retros.jsonl             # Retro records
    invocations.jsonl        # Skill invocations
scripts/
  reviews/lib/
    schemas/                 # Zod schemas for all JSONL types
    read-jsonl.ts            # Validated reading
    write-jsonl.ts           # Validated writing with locks
```

### Recommended Structure for Phase 5

```
scripts/
  health/
    checkers/               # 10 health check scripts (HLTH-01)
      code-quality.js
      security.js
      debt-health.js
      test-coverage.js
      learning-effectiveness.js
      hook-pipeline.js
      session-management.js
      documentation.js
      pattern-enforcement.js
      ecosystem-integration.js
    lib/
      scoring.js            # Reuse from ecosystem audit lib (copy or symlink)
      dimensions.js          # 13-dimension mapping and drill-down logic
      composite.js           # 57-metric aggregation into 8 categories
    run-health-check.js      # Main runner (like run-alerts.js but focused)
data/
  ecosystem-v2/
    warnings.jsonl           # Warning lifecycle records (HLTH-05)
    ecosystem-health-log.jsonl # Persistent health scores (HLTH-03)
.claude/
  skills/
    ecosystem-health/
      SKILL.md               # Interactive dashboard skill (HLTH-04)
      scripts/
        run-ecosystem-health.js  # Orchestrator
```

### Pattern 1: Checker Function Pattern (from run-alerts.js)

**What:** Each checker is a function that runs diagnostics and calls
addAlert/addContext. **When to use:** All 10 health check scripts. **Example:**

```javascript
// Source: .claude/skills/alerts/scripts/run-alerts.js line 608
function checkCodeHealth() {
  console.error("  Checking code health...");
  // Run diagnostic commands
  const tsResult = runCommandSafe("npm", ["run", "type-check"], {
    timeout: 120000,
  });
  // Classify and add alerts
  if (!tsResult.success) {
    addAlert(
      "code",
      "error",
      `${tsErrorCount} TypeScript error(s)`,
      details,
      action
    );
  }
  // Add context with benchmarks and ratings
  addContext("code", {
    benchmarks: { ts_errors: BENCHMARKS.code.ts_errors },
    ratings: { ts_errors: tsRating },
    totals: { ts_errors: tsErrorCount },
  });
}
```

### Pattern 2: Weighted Composite Score (from run-alerts.js)

**What:** Categories weighted, unmeasured categories excluded, letter grades
computed. **When to use:** The 8-category composite score. **Example:**

```javascript
// Source: .claude/skills/alerts/scripts/run-alerts.js line 3475
function computeHealthScore() {
  const weights = { code: 0.15, security: 0.15 /* ... */ };
  for (const [cat, weight] of Object.entries(weights)) {
    const catData = results.categories[cat];
    if (!catData || catData.context?.no_data) {
      continue;
    } // Skip unmeasured
    const score = Math.max(
      0,
      Math.min(100, 100 - errorCount * 30 - warningCount * 10)
    );
    totalScore += score * weight;
    measuredWeight += weight;
  }
  const finalScore =
    measuredWeight > 0 ? Math.round(totalScore / measuredWeight) : 50;
  // Grades: A=90+, B=80+, C=70+, D=60+, F=<60
}
```

### Pattern 3: JSONL Append with Validation (from write-jsonl.ts)

**What:** Zod validation + symlink guard + advisory lock before appending.
**When to use:** All writes to warnings.jsonl and ecosystem-health-log.jsonl.
**Example:**

```typescript
// Source: scripts/reviews/lib/write-jsonl.ts
import { appendRecord } from "../reviews/lib/write-jsonl";
import { WarningRecord } from "../reviews/lib/schemas";

appendRecord(warningsPath, warningData, WarningRecord);
// Validates against Zod schema, checks isSafeToWrite, uses withLock
```

### Pattern 4: Health Score Log Persistence (from run-alerts.js)

**What:** Append score entry to JSONL after each health check run. **When to
use:** HLTH-03 ecosystem-health-log.jsonl. **Example:**

```javascript
// Source: .claude/skills/alerts/scripts/run-alerts.js line 3441
function appendHealthScoreLog() {
  const entry = JSON.stringify({
    timestamp: results.timestamp,
    mode: results.mode,
    grade: results.healthScore?.grade,
    score: results.healthScore?.score,
    summary: results.summary,
    categoryScores,
  });
  fs.appendFileSync(logPath, entry + "\n");
}
```

### Anti-Patterns to Avoid

- **Don't create a new scoring library:** Reuse the existing `scoring.js`
  pattern (scoreMetric, computeGrade, sparkline, compositeScore) that is already
  copied into 7 ecosystem audit skills.
- **Don't write raw JSONL without validation:** Always use Zod schemas and the
  write-jsonl.ts appendRecord function for ecosystem-v2 data.
- **Don't use existsSync before read:** Race condition. Use try/catch directly
  (established pattern throughout codebase).
- **Don't use execSync for commands:** Use execFileSync via runCommandSafe to
  avoid shell injection (Review #256 pattern).
- **Don't put state files outside .claude/state/ or data/ecosystem-v2/:** These
  are the two established locations for JSONL persistence.

## Don't Hand-Roll

| Problem            | Don't Build                | Use Instead                            | Why                                                                              |
| ------------------ | -------------------------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| Scoring metrics    | Custom math                | scoring.js (scoreMetric, computeGrade) | Already handles good/average/poor benchmarks, higher/lower-is-better, sparklines |
| JSONL write safety | Manual fs.appendFileSync   | write-jsonl.ts appendRecord            | Has Zod validation, symlink guard, advisory locking                              |
| JSONL reading      | Manual JSON.parse per line | read-jsonl.ts readValidatedJsonl       | Handles malformed records, returns valid + warnings                              |
| Letter grades      | if/else chain              | computeGrade from scoring.js           | A=90+, B=80+, C=70+, D=60+, F=<60 already defined                                |
| Trend computation  | Custom trend math          | computeTrend from scoring.js           | Direction, delta, deltaPercent, sparkline generation                             |
| Hook warnings      | Custom warning pipeline    | append-hook-warning.js                 | Deduplication, 50-entry cap, JSONL audit trail, atomic writes                    |
| File path safety   | Manual path checks         | isSafeToWrite from symlink-guard       | Prevents symlink attacks, established security pattern                           |
| Command execution  | execSync with string       | runCommandSafe (execFileSync)          | No shell injection, Windows .cmd handling built in                               |

**Key insight:** The codebase has extensive existing infrastructure for health
monitoring. Phase 5 is primarily an _organization and formalization_ effort, not
a greenfield build. The `/alerts` skill already does 80% of what
`/ecosystem-health` needs -- the work is restructuring 36 flat categories into 8
formal categories with 13 dimensions, adding warning lifecycle, and wiring in
mid-session alerts.

## Common Pitfalls

### Pitfall 1: Duplicating the /alerts skill

**What goes wrong:** Building /ecosystem-health as a completely separate system
that duplicates the 36 checkers in run-alerts.js. **Why it happens:** The
requirements say "57 metrics across 8 categories" which sounds like new code.
**How to avoid:** Reuse run-alerts.js checkers as the data source.
/ecosystem-health should orchestrate the same checkers but present them through
a different lens (8 categories / 13 dimensions vs 36 flat categories). Consider
having run-health-check.js call individual checker functions imported/required
from run-alerts.js, or extract shared checker logic into a common module.
**Warning signs:** If you find yourself reimplementing checkCodeHealth(),
checkSecurity(), etc.

### Pitfall 2: Inconsistent JSONL file locations

**What goes wrong:** Putting ecosystem-health-log.jsonl in .claude/state/
instead of data/ecosystem-v2/, or vice versa. **Why it happens:** The codebase
has two JSONL storage locations with different purposes. **How to avoid:**
.claude/state/ is for operational state (session data, audit histories, warnings
logs). data/ecosystem-v2/ is for reviewed, schema-validated ecosystem data
(reviews, retros, deferred-items). Health score logs should go in
data/ecosystem-v2/ (schema-validated, long-term trending). However, the existing
health-score-log.jsonl is in .claude/state/ -- need to decide: migrate or keep
both. **Warning signs:** Files with no Zod schema in ecosystem-v2, or
schema-validated files in .claude/state/.

### Pitfall 3: warnings.jsonl without lifecycle management

**What goes wrong:** Creating warnings.jsonl but treating it as append-only
without lifecycle transitions (new -> acknowledged -> resolved -> stale). **Why
it happens:** The WarningRecord Zod schema has lifecycle field but no code
manages transitions. **How to avoid:** Build explicit lifecycle management: a
function to transition warnings between states, auto-stale detection (warnings
older than N days without action), and resolution tracking. The warning
lifecycle is a core requirement (HLTH-05). **Warning signs:** warnings.jsonl
grows indefinitely with no resolved/stale entries.

### Pitfall 4: Mid-session alerts that are too noisy

**What goes wrong:** Firing alerts on every minor change, causing alert fatigue.
**Why it happens:** Thresholds set too sensitively for mid-session checks. **How
to avoid:** Use the existing suppression system
(.claude/state/alert-suppressions.json) and cooldown mechanism
(.claude/hooks/.alerts-cooldown.json). Only fire mid-session alerts for
significant degradation: new S0/S1 duplicates, deferred items aging past
threshold. Use the append-hook-warning.js dedup (same hook+type+message within 1
hour). **Warning signs:** More than 3 mid-session alerts per session.

### Pitfall 5: Scoring formula mismatch with existing system

**What goes wrong:** Creating a new scoring formula that produces different
grades than the existing /alerts system, causing user confusion. **Why it
happens:** The requirements say "57-metric composite" which suggests new math.
**How to avoid:** Use the same formula: `score = 100 - errors*30 - warnings*10`,
same grade thresholds (A=90+, B=80+, C=70+, D=60+, F=<60), same weighted average
with `totalScore / measuredWeight`. The 57 metrics feed into the same scoring
pipeline. **Warning signs:** /ecosystem-health gives grade B while /alerts gives
grade C for the same state.

## Code Examples

### Existing Health Score Log Entry Structure

```json
// Source: .claude/state/health-score-log.jsonl (actual data)
{
  "timestamp": "2026-02-28T14:42:59.916Z",
  "mode": "full",
  "grade": "B",
  "score": 80,
  "summary": { "errors": 4, "warnings": 13, "info": 10 },
  "categoryScores": {
    "code": 60,
    "security": 70,
    "debt-metrics": 60,
    "test-results": 80,
    "learning": 90,
    "skip-abuse": 90,
    "session": 100,
    "agent-compliance": 100,
    "hook-health": 50,
    "session-state": 100,
    "pattern-hotspots": 100,
    "context-usage": 100,
    "velocity": 100,
    "review-quality": 100,
    "docs": 90,
    "debt-intake": 90,
    "roadmap-hygiene": 100,
    "trigger-compliance": 100,
    "pattern-sync": 100,
    "doc-placement": 100,
    "external-links": 100,
    "unused-deps": 100,
    "review-churn": null,
    "backlog-health": 100,
    "github-actions": null,
    "sonarcloud": null,
    "reviews-sync": null,
    "review-archive": 100,
    "crossdoc": null
  }
}
```

### WarningRecord Zod Schema

```typescript
// Source: scripts/reviews/lib/schemas/warning.ts
export const WarningRecord = BaseRecord.extend({
  category: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
  lifecycle: z
    .enum(["new", "acknowledged", "resolved", "stale"])
    .default("new"),
  resolved_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  source_script: z.string().nullable().optional(),
  related_ids: z.array(z.string()).nullable().optional(),
});
// BaseRecord provides: id, date, schema_version, completeness, completeness_missing, origin
```

### Existing Scoring Library API

```javascript
// Source: .claude/skills/hook-ecosystem-audit/scripts/lib/scoring.js
const {
  scoreMetric,
  computeGrade,
  sparkline,
  computeTrend,
  compositeScore,
  impactScore,
} = require("./scoring");

// Score a metric against benchmarks
const result = scoreMetric(
  5,
  { good: 0, average: 5, poor: 20 },
  "lower-is-better"
);
// => { score: 80, rating: "average" }

// Grade from score
computeGrade(85); // => "B"

// Sparkline from values
sparkline([60, 70, 75, 80, 85]); // => "~~~~~" (block chars)

// Weighted composite
compositeScore(
  { code: { score: 60 }, security: { score: 70 } },
  { code: 0.5, security: 0.5 }
); // => { score: 65, grade: "D", breakdown: {...} }
```

### Existing Weight Distribution (Current /alerts)

```javascript
// Source: .claude/skills/alerts/scripts/run-alerts.js line 3475
// Core (70%): code 15%, security 15%, debt 11%, tests 10%, learning 7%,
//   skip-abuse 2%, session 3%, agents 4%, hook-health 3%
// State (8%): session-state 3%, pattern-hotspots 3%, context-usage 2%
// Existing (9%): velocity 3%, review-quality 3%, docs 3%
// Full-mode (13%): debt-intake 2%, roadmap-hygiene 2%, github-actions 2%,
//   sonarcloud 2%, + 1% each for 7 more categories
```

## Mapping: 36 Existing Categories to 8 Required Categories (13 Dimensions)

This is the critical design decision. The requirements specify 8 categories and
13 dimensions. Based on the existing 36 category checkers, here is a proposed
mapping:

### 8 Categories (from existing checkers)

| Category               | Existing Checkers                                                                  | Proposed Weight |
| ---------------------- | ---------------------------------------------------------------------------------- | --------------- |
| 1. Code Quality        | code, pattern-hotspots, pattern-sync                                               | 18%             |
| 2. Security            | security                                                                           | 15%             |
| 3. Technical Debt      | debt-metrics, debt-intake, debt-resolution, backlog-health                         | 14%             |
| 4. Testing             | test-results                                                                       | 10%             |
| 5. Learning & Patterns | learning, trigger-compliance                                                       | 10%             |
| 6. Infrastructure      | hook-health, hook-warnings, skip-abuse, session-state                              | 12%             |
| 7. Documentation       | docs, doc-placement, external-links, crossdoc                                      | 10%             |
| 8. Process & Workflow  | review-quality, review-churn, velocity, roadmap-hygiene, agent-compliance, session | 11%             |

### 13 Dimensions (drill-down targets)

1. TypeScript health (from code checker)
2. ESLint compliance (from code checker)
3. Pattern enforcement (from pattern-hotspots, pattern-sync)
4. Vulnerability status (from security checker)
5. Debt aging (from debt-metrics)
6. Debt velocity (from debt-intake, debt-resolution)
7. Test pass rate (from test-results)
8. Learning effectiveness (from learning checker)
9. Hook pipeline health (from hook-health, hook-warnings)
10. Session management (from session-state, session)
11. Documentation freshness (from docs, doc-placement)
12. Review quality (from review-quality, review-churn)
13. Workflow compliance (from agent-compliance, trigger-compliance)

### Metric Count Verification

The 57 metrics come from the individual data points within each checker. Based
on the existing benchmarks and context data:

- Code: ~8 metrics (ts_errors, eslint_errors, eslint_warnings,
  pattern_violations, circular_deps, repeat_offenders, outdated_patterns, ...)
- Security: ~4 metrics (critical_vulns, high_vulns, encrypted_secrets,
  audit_status)
- Debt: ~8 metrics (s0_count, s1_count, resolution_rate, avg_age, intake_30d,
  s0_intake_rate, resolved_30d, active_total)
- Tests: ~4 metrics (pass_rate, failed_count, error_count, staleness_days)
- Learning: ~5 metrics (effectiveness, automation_coverage, failing_patterns,
  trigger_failures, ...)
- Infrastructure: ~12 metrics (warnings_7d, overrides_7d, false_positive_pct,
  noise_ratio, commit_failures_7d, overrides_24h, no_reason_pct,
  uncommitted_files, stale_branch_days, ...)
- Documentation: ~8 metrics (staleness_days, misplaced, broken_links,
  crossdoc_issues, ...)
- Process: ~8 metrics (fix_ratio, max_rounds, churn_pct, items_per_session,
  blocked_items, compliance_pct, ...)

Total: ~57 metrics (HIGH confidence -- these map directly to existing benchmark
definitions)

## State of the Art

| Old Approach                             | Current Approach                          | When Changed  | Impact                                     |
| ---------------------------------------- | ----------------------------------------- | ------------- | ------------------------------------------ |
| Flat 36-category scoring                 | Hierarchical 8-category/13-dimension      | Phase 5 (new) | Better organization, drill-down capability |
| hook-warnings.json (JSON array)          | warnings.jsonl (JSONL with Zod)           | Phase 5 (new) | Lifecycle tracking, schema validation      |
| No mid-session alerts                    | Hook-triggered degradation alerts         | Phase 5 (new) | Proactive issue detection                  |
| health-score-log.jsonl in .claude/state/ | ecosystem-health-log.jsonl (TBD location) | Phase 5 (new) | Formalized trending data                   |

**Already exists and works well:**

- Health scoring with letter grades (run-alerts.js)
- Delta tracking against baselines (alerts-baseline.json)
- Suppression system (alert-suppressions.json)
- Sparkline trend visualization (scoring.js)
- 36 checker functions covering all dimensions
- Health score persistence to JSONL (13 entries exist)

## Open Questions

1. **ecosystem-health-log.jsonl location**
   - What we know: health-score-log.jsonl already exists in .claude/state/ with
     13 entries. HLTH-03 calls for ecosystem-health-log.jsonl.
   - What's unclear: Is this a rename/migration of the existing file, or a new
     file alongside it? Should it be in data/ecosystem-v2/ (schema-validated) or
     .claude/state/ (operational)?
   - Recommendation: Create ecosystem-health-log.jsonl in data/ecosystem-v2/
     with a proper Zod schema (new HealthScoreRecord). Keep
     health-score-log.jsonl as-is for backward compatibility with /alerts. The
     new file gets richer data (8 categories, 13 dimensions, per-metric scores).

2. **Relationship between /ecosystem-health and /alerts**
   - What we know: /alerts has 36 categories, 3714 lines of checkers.
     /ecosystem-health needs 8 categories, 13 dimensions.
   - What's unclear: Should /ecosystem-health call /alerts internally, or share
     checker code?
   - Recommendation: Extract checker functions into a shared module
     (scripts/health/checkers/). Both /alerts and /ecosystem-health import from
     there. /alerts keeps its flat 36-category view. /ecosystem-health adds the
     hierarchical 8/13 layer on top.

3. **warnings.jsonl initial population**
   - What we know: WarningRecord schema exists. hook-warnings.json has active
     warnings. hook-warnings-log.jsonl has historical trail.
   - What's unclear: Should existing hook-warnings be migrated into
     warnings.jsonl?
   - Recommendation: Start warnings.jsonl fresh. Going forward, new warnings
     from any source (hooks, health checks, manual) get written to
     data/ecosystem-v2/warnings.jsonl with full lifecycle. Don't migrate
     historical data -- it lacks the required BaseRecord fields.

4. **Mid-session alert trigger mechanism**
   - What we know: Hooks run on pre-commit, post-commit events.
     append-hook-warning.js writes to hook-warnings.json. Session-begin/end have
     hooks.
   - What's unclear: What triggers a "mid-session" health check? Is it
     time-based, event-based (e.g., after every N commits), or on-demand?
   - Recommendation: Event-based via post-commit hook. After each commit, run a
     lightweight subset of checks (duplicate detection on deferred-items.jsonl,
     age check on open deferred items). Use append-hook-warning.js to surface
     findings. Full health check remains on-demand via /ecosystem-health.

## Sources

### Primary (HIGH confidence)

- `.claude/skills/alerts/scripts/run-alerts.js` -- 3714-line health checker with
  36 categories, scoring, trends, persistence (read directly)
- `.claude/skills/alerts/SKILL.md` -- Skill definition with workflow phases,
  benchmarks, weight distribution
- `scripts/reviews/lib/schemas/warning.ts` -- WarningRecord Zod schema with
  lifecycle states
- `scripts/reviews/lib/write-jsonl.ts` -- appendRecord with validation and
  locking
- `scripts/reviews/lib/read-jsonl.ts` -- readValidatedJsonl with schema
  enforcement
- `.claude/state/health-score-log.jsonl` -- 13 actual health score entries
  showing current data shape
- `.claude/skills/hook-ecosystem-audit/scripts/lib/scoring.js` -- Scoring
  library (scoreMetric, computeGrade, etc.)
- `scripts/append-hook-warning.js` -- Hook warning pipeline with dedup and JSONL
  trail
- `.planning/ROADMAP.md` -- Phase 5 requirements and success criteria
- `.planning/REQUIREMENTS.md` -- HLTH-01 through HLTH-06 requirement definitions

### Secondary (MEDIUM confidence)

- `.claude/skills/comprehensive-ecosystem-audit/SKILL.md` -- 7-audit
  orchestration pattern with weighted grades
- `scripts/check-backlog-health.js` -- Standalone health check pattern with
  thresholds
- `scripts/check-hook-health.js` -- Session state management and hook validation
- `scripts/audit/audit-health-check.js` -- 9-check audit system health validator

### Tertiary (LOW confidence)

- Metric count (57) mapping to existing benchmarks -- reasonable extrapolation
  but needs validation during implementation
- 8-category to 36-checker mapping -- proposed mapping needs user validation

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all tools already exist in codebase, no new
  dependencies
- Architecture: HIGH -- patterns directly observable in existing code
  (run-alerts.js, scoring.js, write-jsonl.ts)
- Pitfalls: HIGH -- derived from actual codebase structure and existing
  anti-patterns
- Category/dimension mapping: MEDIUM -- proposed based on requirements +
  existing checkers, needs validation
- Mid-session alert mechanism: MEDIUM -- hook infrastructure exists but specific
  trigger design is a planning decision

**Research date:** 2026-03-01 **Valid until:** 2026-03-31 (stable --
infrastructure changes slowly)
