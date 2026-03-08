<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-08
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Script Ecosystem Audit — Reference

Templates, schemas, category reference, and checker development guide for the
script ecosystem audit. Referenced from SKILL.md.

---

## Dashboard Template

```
Script Ecosystem Health: {grade} ({score}/100)  |  Trend: {sparkline} ({delta})
{errors} errors · {warnings} warnings · {info} info  |  {patches} patch suggestions

┌──────────────────────────────┬───────┬──────────┬──────────────┐
│ Category                     │ Score │ Rating   │ Trend        │
├──────────────────────────────┼───────┼──────────┼──────────────┤
│ D1: Module System            │       │          │              │
│   CJS/ESM Consistency        │  {s}  │ {rating} │ {trend}      │
│   Shebang & Entry Points     │  {s}  │ {rating} │ {trend}      │
│   Node.js API Compatibility  │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────┼───────┼──────────┼──────────────┤
│ D2: Safety & Error Handling  │       │          │              │
│   File I/O Safety            │  {s}  │ {rating} │ {trend}      │
│   Error Sanitization         │  {s}  │ {rating} │ {trend}      │
│   Path Traversal Guards      │  {s}  │ {rating} │ {trend}      │
│   Exec Safety                │  {s}  │ {rating} │ {trend}      │
│   Security Helper Usage      │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────┼───────┼──────────┼──────────────┤
│ D3: Registration             │       │          │              │
│   Package.json Coverage      │  {s}  │ {rating} │ {trend}      │
│   Cross-Script Dependencies  │  {s}  │ {rating} │ {trend}      │
│   Shared Lib Utilization     │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────┼───────┼──────────┼──────────────┤
│ D4: Code Quality             │       │          │              │
│   Documentation Headers      │  {s}  │ {rating} │ {trend}      │
│   Consistent Patterns        │  {s}  │ {rating} │ {trend}      │
│   Dead Code                  │  {s}  │ {rating} │ {trend}      │
│   Complexity                 │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────┼───────┼──────────┼──────────────┤
│ D5: Testing & Reliability    │       │          │              │
│   Test Coverage              │  {s}  │ {rating} │ {trend}      │
│   Test Freshness             │  {s}  │ {rating} │ {trend}      │
│   Error Path Testing         │  {s}  │ {rating} │ {trend}      │
└──────────────────────────────┴───────┴──────────┴──────────────┘
```

Rating badges: good = "Good", average = "Avg", poor = "Poor"

---

## Finding Card Template

```
━━━ Finding {n}/{total} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{SEVERITY}  |  {domainLabel}: {categoryLabel}  |  Impact: {impactScore}/100

{message}

Evidence:
  {details}

Recommended: {action} — {rationale}
```

If finding has `patchable: true`:

```
Patch Available:
  Target: {patch.target}
  Action: {patch.description}
  Preview:
    {patch.preview or patch.content}
```

After each decision, show:

```
Progress: {n}/{total} | Fixed: {f} | Deferred: {d} | Skipped: {s}
```

---

## Summary Template

```
━━━ Audit Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Composite: {grade} ({score}/100)  |  {trend}

Decisions:
  Fixed:      {count} findings
  Deferred:   {count} findings → {count} DEBT entries created
  Skipped:    {count} findings

Patches Applied: {count}/{total patchable}

Top 3 Impact Areas:
  1. {category} — {brief description}
  2. {category} — {brief description}
  3. {category} — {brief description}

Trend (if previous runs):
  {category}: {before} → {after} ({delta})
  ⚠ {category} has been {rating} for {N} consecutive runs

Artifacts:
  Session log: {path}
  DEBT entries: {count} created
  Files patched: {list}
  History: updated

Next Steps:
  - {actionable recommendation}
  - {actionable recommendation}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Self-Audit Verification Template

```
━━━ Self-Audit Verification ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before: {previous_grade} ({previous_score}/100)
After:  {new_grade} ({new_score}/100)
Delta:  {+/-delta} points

Improved Categories:
  {category}: {before} → {after} (+{delta})

Remaining Issues:
  {count} findings still open (deferred/skipped)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Progress File Schema

Path: `.claude/tmp/script-audit-progress.json`

```json
{
  "auditTimestamp": "ISO timestamp of audit run",
  "score": 85,
  "grade": "B",
  "totalFindings": 142,
  "currentFindingIndex": 8,
  "decisions": [
    {
      "findingIndex": 1,
      "category": "file_io_safety",
      "message": "File I/O call without try/catch in generate-views.js",
      "decision": "skip",
      "note": "Already wrapped in outer handler"
    }
  ],
  "fixesApplied": ["added try/catch to sync-sonarcloud.js"],
  "findingsData": []
}
```

---

## Session Log JSONL Schema

Path: `.claude/tmp/script-audit-session-{YYYY-MM-DD-HHMM}.jsonl`

One JSON object per line, appended after each decision:

```json
{
  "timestamp": "ISO timestamp",
  "findingIndex": 1,
  "category": "file_io_safety",
  "severity": "warning",
  "message": "File I/O call without try/catch",
  "decision": "fix|defer|skip|acknowledge",
  "patchApplied": false,
  "debtEntryCreated": false
}
```

**Retention:** Ephemeral — lives in `.claude/tmp/` for current session only. Not
archived by `/session-end`.

---

## History JSONL Schema

Path: `.claude/state/script-ecosystem-audit-history.jsonl`

One JSON object per line, appended after each full audit run:

```json
{
  "timestamp": "ISO timestamp",
  "healthScore": { "score": 66, "grade": "D" },
  "categories": {
    "cjs_esm_consistency": { "score": 90, "rating": "good" },
    "...": "..."
  },
  "summary": { "errors": 3, "warnings": 166, "info": 356 },
  "feedback": "optional user feedback string"
}
```

---

## Script v2 JSON Output Schema

The audit script outputs this structure to stdout:

```json
{
  "version": 2,
  "timestamp": "ISO timestamp",
  "healthScore": { "score": 66, "grade": "D", "breakdown": {} },
  "categories": {
    "<category_key>": {
      "label": "Human-readable name",
      "domain": "domain_key",
      "domainLabel": "D1: Module System & Consistency",
      "score": 90,
      "rating": "good",
      "metrics": {},
      "findings": [],
      "trend": { "direction": "up|down|stable", "delta": 5, "sparkline": "..." }
    }
  },
  "findings": [
    {
      "id": "unique-id",
      "category": "category_key",
      "domain": "domain_key",
      "severity": "error|warning|info",
      "message": "Description",
      "details": "Evidence",
      "impactScore": 85,
      "patchable": true,
      "patch": { "target": "file.js", "description": "...", "preview": "..." }
    }
  ],
  "trends": { "composite": null, "per_category": {} },
  "summary": { "errors": 0, "warnings": 0, "info": 0 },
  "patchableCount": 0,
  "domainScores": {}
}
```

---

## Category Reference

These categories enforce patterns from **CLAUDE.md Section 5** (Critical
Anti-Patterns). See CLAUDE.md for canonical definitions.

### Domain 1: Module System & Consistency (20% weight)

| Category                  | What It Checks                                                        |
| ------------------------- | --------------------------------------------------------------------- |
| CJS/ESM Consistency       | Directories use consistent module system (all CJS or all ESM)         |
| Shebang & Entry Points    | npm script file refs exist, shebangs are correct                      |
| Node.js API Compatibility | No deprecated APIs (fs.exists, new Buffer, url.parse without 2nd arg) |

### Domain 2: Safety & Error Handling (25% weight)

| Category              | What It Checks                                                          |
| --------------------- | ----------------------------------------------------------------------- |
| File I/O Safety       | All fs.readFileSync/writeFileSync wrapped in try/catch                  |
| Error Sanitization    | Scripts use sanitize-error.js, don't log raw error.message              |
| Path Traversal Guards | Correct regex pattern, not startsWith('..')                             |
| Exec Safety           | All regex.exec() in loops have /g flag                                  |
| Security Helper Usage | Scripts doing file I/O, git ops, or CLI args import security-helpers.js |

### Domain 3: Registration & Reachability (20% weight)

| Category                  | What It Checks                                                    |
| ------------------------- | ----------------------------------------------------------------- |
| Package.json Coverage     | Scripts reachable via npm scripts or internal require/import      |
| Cross-Script Dependencies | All require/import references resolve to existing files           |
| Shared Lib Utilization    | Scripts use shared libs instead of reimplementing common patterns |

### Domain 4: Code Quality (20% weight)

| Category              | What It Checks                                                  |
| --------------------- | --------------------------------------------------------------- |
| Documentation Headers | JSDoc or block comment at top of each script                    |
| Consistent Patterns   | Scripts in same directory follow similar structure              |
| Dead Code             | Exported functions are actually imported elsewhere              |
| Complexity            | Scripts under 300 lines or have adequate function decomposition |

### Domain 5: Testing & Reliability (15% weight)

| Category           | What It Checks                                                         |
| ------------------ | ---------------------------------------------------------------------- |
| Test Coverage      | Each script has a corresponding .test.js file                          |
| Test Freshness     | Tests updated within 30 days of source changes                         |
| Error Path Testing | Test files include error scenario coverage (toThrow, rejects, mocking) |

---

## Benchmarks

Internal benchmarks are defined in `scripts/lib/benchmarks.js`. Each category
scores 0-100 with ratings: good (90+), average (70-89), poor (<70). The
composite grade uses weighted average across all 18 categories with domain
weights: D1=20%, D2=25%, D3=20%, D4=20%, D5=15%.

---

## Checker Development Guide

### Adding a New Category

1. Choose the appropriate domain checker in `scripts/checkers/`
2. Add a new check function following the pattern of existing categories
3. Add benchmarks to `scripts/lib/benchmarks.js`
4. Add weight to `CATEGORY_WEIGHTS` in benchmarks.js (adjust existing weights)
5. Add labels to the orchestrator's `CATEGORY_LABELS` and `CATEGORY_DOMAIN_MAP`
6. Test: `node scripts/run-script-ecosystem-audit.js --summary`

### Data Sources

| Source              | Path                    | Content                           |
| ------------------- | ----------------------- | --------------------------------- |
| Script source code  | `scripts/**/*.js`       | 300+ script implementations       |
| Shared libraries    | `scripts/lib/*.js`      | Shared utilities (sanitize, etc.) |
| Package config      | `package.json`          | npm scripts section               |
| Test files          | `scripts/**/__tests__`  | Script test suites                |
| Pre-commit pipeline | `.husky/pre-commit`     | Pre-commit stage references       |
| State files         | `.claude/state/*.jsonl` | Audit state and history           |

### Script Infrastructure Architecture

```
scripts/
  ├── lib/                    # Shared libraries
  │   ├── sanitize-error.js   # Error sanitization
  │   ├── security-helpers.js # Security utilities
  │   └── ...                 # Other shared modules
  ├── __tests__/              # Test files
  │   ├── *.test.js           # Unit/integration tests
  │   └── ...
  ├── ci/                     # CI/CD scripts
  ├── eval/                   # Evaluation pipeline
  ├── audit/                  # Audit scripts
  └── *.js                    # Top-level scripts
```
