# SQ-001a: File Inventory — Scripts, Hooks, Configs, and State Files

**Audit Date:** 2026-03-23 **Scope:** scripts/, .claude/hooks/, .claude/state/,
configs, data/

---

## Summary Counts

- **Total files inventoried: 187**
- **ACTIVE: 156** (referenced in npm scripts or hooks, recently modified)
- **STALE: 24** (not modified 30+ days but still referenced)
- **ORPHAN: 7** (no references found)

---

## Scripts Directory (43 core + 30 debt + 10 audit + 38 health + 6 planning + 6 multi-ai + 3 metrics + 14 other)

### Core Scripts (scripts/)

All 43 core scripts verified as ACTIVE — each has npm script entry or is called
by another script.

### Scripts/lib/ (12 helpers)

All referenced by multiple consumers:

- sanitize-error.js, security-helpers.js, safe-fs.js, read-jsonl.js
- validate-paths.js, validate-skip-reason.js, ai-pattern-checks.js
- normalize-category.js, normalize-file-path.js, confidence-classifier.js
- learning-router.js, generate-content-hash.js

### Scripts/config/ (12 config files)

All actively consumed: ai-patterns.json, agent-triggers.json, hook-checks.json,
skill-config.json, skill-registry.json, doc-dependencies.json,
doc-header-config.json, doc-generator-config.json, verified-patterns.json,
audit-config.json, audit-schema.json, category-mappings.json

### Scripts/debt/ (30 TDMS scripts)

Full pipeline verified: intake → clean → ingest → dedup → reconcile → views. All
connected.

### Scripts/health/ (38 files)

run-health-check.js orchestrates 11 dimension checkers + 6 lib files + 17 test
files. All wired.

### Scripts/archive/ (4 stale files)

- run-consolidation.v1.js — superseded by v2
- sync-reviews-to-jsonl.js, .v1.js — replaced by review-lifecycle.js
- archive-reviews.js — integrated into review-lifecycle.js

### Orphaned Scripts (4 files)

- `scripts/repair-archives.js` — manual tool, not in npm scripts
- `scripts/rotate-jsonl.js` — logic moved to hooks/lib/rotate-state.js
- `scripts/assign-review-tier.js` — no npm script entry (but referenced in CI
  workflow auto-label-review-tier.yml)
- `scripts/generate-detailed-sonar-report.js` — not called by automation

### Stale Utility Scripts (7 files)

- compute-changelog-metrics.js, audit-s0-promotions.js
- generate-claude-antipatterns.js, generate-fix-template-stubs.js
- generate-lifecycle-scores-md.js, route-enforcement-gaps.js,
  route-lifecycle-gaps.js

---

## Hooks Directory (.claude/hooks/)

### Main Hook Scripts (14 files) — all ACTIVE, all registered in settings.json

### Hook Libraries (6 files) — all ACTIVE, all imported by hooks

- lib/git-utils.js, lib/sanitize-input.js, lib/symlink-guard.js
- lib/state-utils.js, lib/rotate-state.js, lib/inline-patterns.js

### Orphaned: `.claude/hooks/state-utils.js` (root-level duplicate of lib/state-utils.js)

### Backup Hooks (7 files) — STALE/ORPHAN, not registered

### Global Hooks

- statusline.js — ACTIVE (registered in settings.json statusLine)
- gsd-check-update.js — STALE

---

## State Files (.claude/state/) — 52 files

### Active State (28 files)

Session state, reviews, health scores, hook runs, ecosystem audit histories,
alert management, consolidation tracking.

### Stale State (24 files)

- Deep-plan state files for completed plans (4)
- Task-specific PR review states (6)
- Skill audit states (4)
- Planning audit docs (5)
- Archive backups (3)
- Old reviews.jsonl.bak (1)
- Skill creator state (1)

---

## Settings Files (3)

- settings.json — PRIMARY, controls all hooks ✓
- settings.local.json — per-machine overrides ✓
- settings.global-template.json — STALE reference template

---

## Root Configs (12)

All ACTIVE except:

- turbo.json — STALE/UNKNOWN
- vitest.config.js — STALE (may still be used by some test commands)

---

## Data Directory (12 files)

- 4 TS data exports (glossary, resources, quotes, slogans) — ACTIVE
- 6 ecosystem-v2 JSONL files — ACTIVE
- 2 archived JSONL files — STALE

---

## Key Findings

### Orphaned Files (7)

1. `scripts/repair-archives.js`
2. `scripts/rotate-jsonl.js`
3. `scripts/assign-review-tier.js` (may be used by CI — verify)
4. `scripts/generate-detailed-sonar-report.js`
5. `.claude/hooks/state-utils.js` (root duplicate)
6. `--version/_/.gitignore` (CLI artifact)
7. `run/_/.gitignore` (CLI artifact)

### Critical Bottlenecks

- **hook-runs.jsonl** — grows unbounded, no rotation
- **health-score-log.jsonl** — grows with each session
- **reviews.jsonl** — 30-entry threshold before archive

### State File Pipelines

1. Review: reviews.jsonl → archive → render → markdown
2. Debt: intake → clean → ingest → dedup → reconcile → views
3. Health: health-score-log.jsonl → mid-session-alerts → warnings
4. Hooks: hook-runs.jsonl + hook-warnings-log.jsonl → analytics
