# Plan: Manifest JSON Refactors

**Created:** 2026-02-08 (Session #142) **Completed:** 2026-02-08 (Session #142)
**Status:** COMPLETE (Completed Session #142, 2026-02-08 — consider archiving)
**Priority:** P3 (improvement, not blocking) **Scope:** 4 refactors, 33 files
changed, net -527 lines

---

## Context

PR #351 code review suggested using a declarative manifest JSON instead of
filesystem scanning for capability discovery. Analysis identified 4 areas in the
project where the same pattern applies — scanning directories or parsing
markdown tables when structured JSON would be more reliable, faster, and
maintainable.

## 1. Pattern Compliance Exclude List → `verified-patterns.json`

**Current:** `scripts/check-pattern-compliance.js` has a 60+ entry
`pathExcludeList` array with inline audit comments (date, reviewer, line
numbers) buried in JS source. Grows every PR review.

**Target:** Extract to `scripts/config/verified-patterns.json`:

```json
{
  "readfilesync-without-try": [
    {
      "file": "search-capabilities.js",
      "lines": [38, 65],
      "verified": "2026-02-08",
      "review": "PR #351",
      "note": "readFileSync at L38 in try/catch (L37-41), L65 in try/catch (L64-68)"
    }
  ]
}
```

**Changes:**

- Create `scripts/config/verified-patterns.json` with structured data
- Update `check-pattern-compliance.js` to read from JSON instead of hardcoded
  array
- Migration script to extract existing entries from the JS source
- PR review skill (`/pr-review`) updated to write to JSON instead of editing JS

**ROI:** High — edited almost every session, eliminates source code churn

## 2. Cross-Doc Dependency Graph → `doc-dependencies.json`

**Current:** `docs/DOCUMENT_DEPENDENCIES.md` is a markdown table parsed by
`scripts/check-cross-doc-deps.js`. Fragile regex parsing caused commit failures
in this session.

**Target:** Extract to `scripts/config/doc-dependencies.json`:

```json
{
  "triggers": [
    {
      "when": "docs/plans/*",
      "then": ["docs/PLAN_MAP.md", "docs/README.md"],
      "reason": "New/updated plans must be referenced in navigation docs"
    }
  ]
}
```

**Changes:**

- Create `scripts/config/doc-dependencies.json`
- Update `check-cross-doc-deps.js` to read from JSON
- Keep `DOCUMENT_DEPENDENCIES.md` as human-readable reference (auto-generated
  from JSON)
- Migration script to parse existing markdown table into JSON

**ROI:** Medium — reduces false-positive commit failures, easier to maintain

## 3. Audit Schedule/Tracking → `audit-config.json`

**Current:** `docs/audits/AUDIT_TRACKER.md` has markdown tables with category
definitions, thresholds, and last-run dates. `scripts/reset-audit-triggers.js`
parses these tables with regex.

**Target:** Extract to `scripts/config/audit-config.json`:

```json
{
  "categories": {
    "code-quality": {
      "threshold_days": 14,
      "last_audit": "2026-02-06",
      "sources_required": 6
    }
  }
}
```

**Changes:**

- Create `scripts/config/audit-config.json`
- Update `reset-audit-triggers.js` to read/write JSON
- Keep `AUDIT_TRACKER.md` as human-readable view (auto-generated from JSON)
- Update audit skills to write dates to JSON

**ROI:** Medium — eliminates regex parsing of markdown tables

## 4. Skill Registry → `skill-registry.json`

**Current:** `SKILL_INDEX.md` is manually maintained. `/find-skills` and
`search-capabilities.js` scan directories and parse SKILL.md frontmatter each
invocation.

**Target:** Auto-generated `scripts/config/skill-registry.json`:

```json
{
  "skills": [
    {
      "name": "pr-review",
      "path": ".claude/skills/pr-review/SKILL.md",
      "description": "PR Code Review Processor",
      "version": "1.0",
      "status": "ACTIVE"
    }
  ],
  "generated": "2026-02-08T00:00:00Z"
}
```

**Changes:**

- Create `scripts/generate-skill-registry.js` (scans dirs, parses frontmatter,
  writes JSON)
- Add npm script: `npm run skills:registry`
- Update `search-capabilities.js` to read from registry for local skills
- Update `/find-skills` skill to use registry
- Add to session-start hook or pre-commit to keep fresh

**ROI:** Low-Medium — skill list is relatively stable, but eliminates repeated
scanning

## Execution Order

1. ✅ **Pattern compliance** — completed Session #142
2. ✅ **Cross-doc dependencies** — completed Session #142
3. ✅ **Audit config** — completed Session #142
4. ✅ **Skill registry** — completed Session #142

## Shared Pattern

All 4 follow the same architecture:

- **JSON file** in `scripts/config/` — single source of truth
- **Markdown file** — human-readable view, auto-generated from JSON
- **Script** reads JSON at runtime (no regex parsing)
- **Migration script** — one-time extraction from current format
- **Update hooks** — keep JSON fresh (PR review, audit, skill install)
