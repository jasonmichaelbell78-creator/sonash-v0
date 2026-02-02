# CI Quality Gates: Non-Blocking → Blocking Conversion Plan

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-02
**Status:** DRAFT
<!-- prettier-ignore-end -->

---

## Problem Statement

The CI workflow (`.github/workflows/ci.yml`) has 6 quality gates configured with
`continue-on-error: true`, meaning they provide visibility but don't block
merges. This was flagged as S0 critical debt (DEBT-0852, 0859, 0864).

Related debt items:

- DEBT-0852: Multiple CI quality gates configured as non-blocking
- DEBT-0859: CI quality gates non-blocking allowing regressions
- DEBT-0864: Convert CI gates to blocking

---

## Current State Analysis

| Line | Check                        | Current Output               | Recommendation      |
| ---- | ---------------------------- | ---------------------------- | ------------------- |
| 39   | `deps:unused` (knip)         | Clean (0 issues)             | **MAKE BLOCKING**   |
| 75   | `patterns:check-all` on push | Has baseline, provides value | KEEP NON-BLOCKING   |
| 80   | `docs:check`                 | ~10 issues (audit docs)      | FIX THEN BLOCK      |
| 90   | `audit:validate --all`       | 1 issue (FILE_NOT_FOUND)     | FIX THEN BLOCK      |
| 101  | `sync-roadmap-refs.js`       | Clean (0 orphans)            | **MAKE BLOCKING**   |
| 107  | `generate-views.js`          | Date diffs only              | NEEDS CONSIDERATION |

---

## Recommendations

### 1. Immediate: Make Already-Passing Checks Blocking

**deps:unused (Line 39)**

- Currently passes with 0 issues
- Remove `continue-on-error: true`
- If leaflet CSS issue recurs, add to knip config exclusions

**sync-roadmap-refs.js (Line 101)**

- Currently passes with "All DEBT references are valid"
- Remove `continue-on-error: true`
- This prevents orphaned DEBT-XXXX references in ROADMAP.md

### 2. Short-term: Fix Issues Then Block

**docs:check (Line 80)**

Issues are in audit docs (templates/stubs):

- Broken link in SKILL_AGENT_POLICY.md → FALSE_POSITIVES.jsonl
- Missing sections in audit-2026-01-24.md, process audit files

Options:

1. Fix the broken links and missing sections
2. Add audit directories to docs-check exclusions
3. Create a `.docs-check-ignore` file

Recommendation: Option 2 - exclude audit output directories since they're
generated content with different standards.

**audit:validate (Line 90)**

- 1 FILE_NOT_FOUND issue for CODE-014 (references "various")
- Fix: Update the audit finding with valid file reference
- Then remove `continue-on-error: true`

### 3. Keep Non-Blocking (By Design)

**patterns:check-all on push to main (Line 75)**

This is intentionally non-blocking because:

- Provides visibility into full codebase compliance
- Baseline exists with pre-existing violations
- PRs check only changed files (which IS blocking)
- Converting to blocking would require fixing 200+ pre-existing violations

Keep as-is: visibility without blocking is the right trade-off.

**generate-views.js (Line 107)**

The diff output shows only date changes (`Last Updated: 2026-02-01` →
`2026-02-02`), not actual content drift.

Options:

1. Make blocking and ensure views are always regenerated before commit
2. Change to content-based comparison (ignore date headers)
3. Keep non-blocking as informational

Recommendation: Option 2 - modify the check to use `--ignore-date` or strip date
headers before diff.

---

## Implementation Steps

### Phase 1: Quick Wins (E0)

1. Remove `continue-on-error: true` from line 39 (deps:unused)
2. Remove `continue-on-error: true` from line 101 (sync-roadmap-refs.js)

### Phase 2: Fix Then Block (E1)

3. Add audit directories to docs:check exclusions
4. Remove `continue-on-error: true` from line 80 (docs:check)
5. Fix CODE-014 file reference in audit findings
6. Remove `continue-on-error: true` from line 90 (audit:validate)

### Phase 3: Smart Blocking (E2)

7. Update generate-views.js check to ignore date headers in diff
8. Remove `continue-on-error: true` from line 107 (generate-views.js)

---

## Risk Assessment

| Change               | Risk | Mitigation                                   |
| -------------------- | ---- | -------------------------------------------- |
| Block deps:unused    | Low  | Currently passing, knip has exclusion config |
| Block sync-roadmap   | Low  | Currently passing, validates ROADMAP.md      |
| Block docs:check     | Med  | Requires exclusion config for audit dirs     |
| Block audit:validate | Low  | Single fix needed                            |
| Block generate-views | Med  | Requires date-ignore logic                   |
| Block patterns:check | High | Would break CI until 200+ fixes made         |

---

## Success Criteria

- [ ] 4 of 6 non-blocking checks converted to blocking
- [ ] CI passes on main branch
- [ ] No false-positive failures in PRs
- [ ] patterns:check-all remains non-blocking (by design)

---

## Related Debt Items

After implementing this plan, resolve:

- DEBT-0852 → RESOLVED (4/6 gates now blocking)
- DEBT-0859 → RESOLVED (gates converted per analysis)
- DEBT-0864 → RESOLVED (gates that can be blocking are blocking)
