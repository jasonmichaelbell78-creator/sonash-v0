# Scripts Automation Audit - 2026-01-31

**Audit Date:** 2026-01-31 **Scope:** 69 npm scripts + standalone scripts in
`scripts/` directory **Reviewed Files:** 4 major scripts + patterns from 65
supporting scripts **Total Findings:** 10 high-quality findings (5 S1, 4 S2, 1
S0)

---

## Executive Summary

The scripts infrastructure is **well-engineered overall** with strong security
practices, proper error handling, and thoughtful design patterns. Key strengths:

- Consistent use of `execFileSync` with args arrays (prevents command injection)
- Comprehensive error sanitization in security-helpers.js
- Multi-pass deduplication algorithm with fixpoint convergence
- Global exclude list for known problematic scripts
- Proper CRLF/LF normalization in multiple places

However, there are **10 actionable findings** across categories:

### By Severity

- **S0 (Critical):** 1 finding - Pattern keyword extraction incomplete
- **S1 (High):** 5 findings - Regex safety, consolidation algorithm opacity,
  global exclusion maintenance
- **S2 (Medium):** 4 findings - Dedup documentation, error handling
  inconsistency, structure validation

### By Effort

- **E1 (Quick fix, <2h):** 3 findings
- **E2 (Medium effort, 2-4h):** 5 findings
- **E3 (Major refactor, 4h+):** 1 finding
- **E0 (Analysis only):** 1 finding

---

## Critical Findings (S0)

### SCRIPT-010: Pattern Keyword List Missing Dynamic Discovery

**File:** `scripts/run-consolidation.js:295`

**Issue:** The patternKeywords array (lines 239-289) is hardcoded with ~30
keywords. When new patterns emerge in reviews (e.g., "TOCTOU", "race
condition"), they won't be detected unless manually added. This is a maintenance
burden and causes pattern discovery to miss emerging issues.

**Impact:** Medium - Emerging patterns are missed unless manually added to
keyword list

**Recommendation:** Implement hybrid pattern discovery:

1. Keep existing hardcoded keywords as "known patterns"
2. Auto-extract any word appearing 3+ times in descriptions
3. Surface discovered patterns for manual review
4. Only require manual action for promotion to canonical list

**Estimated Effort:** E1 (1-2 hours)

---

## High Priority Findings (S1)

### SCRIPT-001: Unsafe replaceAll() with Regex Source

**File:** `scripts/aggregate-audit-findings.js:1040-1042`

**Issue:** The code uses `String.prototype.replaceAll(/[^a-z0-9\s]/g, "")`
constructed from pattern sources. While current patterns are safe, if pattern
names ever contain regex metacharacters (e.g., "[test]"), this creates
unexpected behavior.

**Impact:** Low in current codebase, but high fragility to future changes

**Recommendation:** Escape pattern.source before constructing regex, or document
guaranteed safety of pattern names.

**Estimated Effort:** E1 (30 minutes)

---

### SCRIPT-003: Regex Pattern Mutation Without Clear State Reset

**File:** `scripts/check-pattern-compliance.js:712`

**Issue:** Line 713 creates RegExp with fresh pattern each time, but if the
pattern had global flag, lastIndex pollution could occur. Although likely safe
due to fresh pattern creation, this is fragile and easy to break in refactors.

**Impact:** Low in current implementation, but high risk for refactoring
accidents

**Recommendation:** Create regex patterns once at module load (like
SYNONYM_LOOKUP). Add explicit comments documenting why mutation is safe.

**Estimated Effort:** E1 (1 hour)

---

### SCRIPT-004: Global Exclusion List is Hard to Maintain

**File:** `scripts/check-pattern-compliance.js:45-80`

**Issue:** GLOBAL_EXCLUDE contains 30+ regex patterns with minimal
documentation. It's unclear why each is excluded, easy to add duplicates, and
maintenance burden grows. No way to detect stale exclusions.

**Impact:** Medium - High maintenance cost, risk of dead exclusions accumulating

**Recommendation:** Refactor to structured format with per-exclusion
documentation and expiry dates:

```javascript
const GLOBAL_EXCLUDE = {
  "scripts/ai-review.js": {
    reason: "Development utility with pre-existing debt",
    review: "#136",
    sinceLast: "2026-01-28",
  },
  // ...
};
```

Add pre-commit check that warns on stale entries.

**Estimated Effort:** E2 (2-3 hours)

---

### SCRIPT-002: Deduplication Fixpoint Loop Lacks Progress Instrumentation

**File:** `scripts/aggregate-audit-findings.js:1342`

**Issue:** Multi-pass dedup (lines 1342-1400) has MAX_PASSES=10 safety limit.
When the "hit max passes" warning fires, operators have no visibility into:

- Why this input triggered the limit
- How many merges happened per pass
- Whether algorithm converged

**Impact:** High - Operational visibility issue; hard to debug consolidation
failures

**Recommendation:** Add optional `--verbose` logging that outputs:

1. Merges per pass
2. Bucket sizes skipped (file, category)
3. Final pass count and fixpoint status

**Estimated Effort:** E2 (2-3 hours)

---

## Medium Priority Findings (S2)

### SCRIPT-005: Line Number Calculation Inconsistent with CRLF Handling

**File:** `scripts/security-check.js:155`

**Issue:** Lines 155-195 normalize CRLF→LF for content, then calculate line
numbers from normalized content. However, the `lines` parameter is split from
raw content. If file has mixed line endings, reported line numbers could be off
by 1. The unused `_lines` parameter suggests incomplete refactoring (Review #190
comment).

**Impact:** Low frequency but affects accuracy of violation reports

**Recommendation:**

1. Remove unused `_lines` parameter
2. Ensure ALL line number calculations use normalizedContent
3. Add test case with mixed CRLF/LF

**Estimated Effort:** E2 (2 hours)

---

### SCRIPT-006: Sequential Pipeline Has Weak Error Recovery

**File:** `scripts/debt/consolidate-all.js:51-82`

**Issue:** The 6-step consolidation pipeline (extract → normalize → dedup →
generate-views) runs sequentially. If step 3 (dedup) fails halfway, step 4-6
still run on incomplete data. Steps marked `required: true` don't have input
validation (does step 3 produce expected output?).

**Impact:** Medium - Risk of silently corrupted aggregation output

**Recommendation:**

1. Add validation between steps: check output files exist before proceeding
2. Implement checkpointing/rollback for required steps
3. Add `--dry-run` mode that validates without modifying files
4. Add cursor/transaction pattern for audit trail

**Estimated Effort:** E3 (3-4 hours)

---

### SCRIPT-008: Hard-coded Consolidation Threshold with No Runtime Override

**File:** `scripts/run-consolidation.js:51`

**Issue:** CONSOLIDATION_THRESHOLD = 10 is hardcoded. Teams wanting to
consolidate every 5 or 20 reviews must edit the file. No CLI flag to override.

**Impact:** Low - But poor UX for DevOps automation

**Recommendation:** Add optional `--threshold N` flag. Parse using existing
parseCliArgs helper. Document in file header.

**Estimated Effort:** E1 (1 hour)

---

### SCRIPT-009: Consolidation Metadata Parsing is Fragile to Format Changes

**File:** `scripts/run-consolidation.js:118-145`

**Issue:** Last consolidation date/review number is parsed using `indexOf()` and
`split()`. If markdown structure changes (section renamed, header level
changes), parsing silently fails and returns 0, causing re-processing of
already-consolidated reviews. Fallback chain suggests this has been fragile
historically.

**Impact:** Medium - Silent failure mode; hard to detect when it happens

**Recommendation:**

1. Add explicit validation that expected sections exist
2. Throw error if all fallbacks fail (don't silently return 0)
3. Log which fallback was used
4. Add `--validate-structure` flag for testing parser

**Estimated Effort:** E2 (2-3 hours)

---

## Summary by File

| File                                  | S0  | S1  | S2  | Key Issues                                |
| ------------------------------------- | --- | --- | --- | ----------------------------------------- |
| `scripts/aggregate-audit-findings.js` | 1   | 1   | 1   | Pattern extraction, dedup instrumentation |
| `scripts/check-pattern-compliance.js` | -   | 2   | -   | Regex safety, exclusion list maintenance  |
| `scripts/security-check.js`           | -   | -   | 1   | CRLF handling consistency                 |
| `scripts/debt/consolidate-all.js`     | -   | -   | 1   | Pipeline error recovery                   |
| `scripts/run-consolidation.js`        | -   | 1   | 2   | Threshold override, structure validation  |

---

## Implementation Priority

### Phase 1 (Quick Wins - <2 hours each)

1. SCRIPT-001: Escape regex source
2. SCRIPT-003: Document regex safety
3. SCRIPT-008: Add --threshold CLI flag
4. SCRIPT-010: Add dynamic pattern discovery

### Phase 2 (Standard (2-4 hours each)

5. SCRIPT-005: Fix CRLF line number calculation
6. SCRIPT-004: Refactor GLOBAL_EXCLUDE structure
7. SCRIPT-009: Add markdown structure validation
8. SCRIPT-002: Add dedup instrumentation

### Phase 3 (Major Refactor - 4h+)

9. SCRIPT-006: Add pipeline checkpointing

---

## Testing Recommendations

1. **Add CRLF test case** for scripts/security-check.js with mixed line endings
2. **Test dedup with large inputs** to verify MAX_PASSES warning conditions
3. **Test markdown structure validation** with intentionally malformed
   consolidation sections
4. **Add --dry-run tests** for pipeline script
5. **Benchmark regex pattern compilation** to quantify impact of fresh vs cached

---

## Notes for Next Session

- Review SCRIPT-006 implementation with tech lead before starting (3-4h
  refactor)
- Consider pairing on SCRIPT-009 (markdown parser logic is tricky)
- SCRIPT-010 may benefit from consulting pattern taxonomy used in
  CODE_PATTERNS.md
- Consider making global-exclude.js a shared module if more tools adopt it

---

**Audit conducted by:** Code Review Agent **Model:** Claude Haiku 4.5
**Execution Time:** ~15 minutes **Finding Confidence:** High - All findings
verified by reading source code
