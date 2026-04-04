<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-30
**Status:** COMPLETE (Session #249)
<!-- prettier-ignore-end -->

# PLAN: 3-Layer Propagation Enforcement

**Decisions:** `.planning/propagation-enforcement/DECISIONS.md` (19 decisions)
**Diagnosis:** `.planning/propagation-enforcement/DIAGNOSIS.md` **Effort:** M
(~1 session, 12 steps)

---

## Layer 3: Pattern Registry (Foundation — Steps 1-2)

### Step 1: Create `propagation-patterns.json`

Create `scripts/config/propagation-patterns.json` as the canonical pattern
registry. Per D2, each entry has: `id`, `description`, `pattern` (regex string),
`antiPattern` (regex string or null), `searchGlob` (array of globs), `severity`
("BLOCK" or "WARN"), `missDetection` ("antiPattern" or "patternAbsence", default
"antiPattern" per D11), and `source` (PR/retro reference).

Include a `_meta` header with `version`, `updated`, and `howToAdd` field
documenting the format for AI consumption during retros (per D17).

Seed with 10 patterns from D9.

**Done when:** File exists, is valid JSON,
`node -e "JSON.parse(require('fs').readFileSync('scripts/config/propagation-patterns.json','utf8'))"`
exits 0.

### Step 2: Create shared registry loader module

Create `scripts/lib/load-propagation-registry.js` — a shared module consumed by
both `check-propagation-staged.js` and `check-propagation.js`. Exports:

- `loadRegistry()` → parsed array of pattern entries
- `matchPatterns(diffLines, registry)` → array of triggered pattern IDs
- `findMisses(patternEntry, files)` → array of files with antiPattern present

Use existing `scripts/lib/security-helpers.js` patterns for safe file reads
(try/catch per CLAUDE.md Section 5).

**Done when:** Module loads, exports 3 functions, handles missing/corrupt
registry file gracefully.

---

## Layer 1: Pre-Commit Gate (Steps 3-5)

### Step 3: Refactor `check-propagation-staged.js` to use registry

Replace the 6 hardcoded `SECURITY_PATTERNS` with a call to `loadRegistry()` from
the shared module (per D1). Change detection from full-file scanning to
diff-based: parse `git diff --cached` output and match against registry patterns
(per D10).

Change scan scope from same-directory to `searchGlob` per registry entry (per
D5).

Add `--blocking` flag support that respects per-pattern `severity` (per D3):

- BLOCK patterns → exit 2 (hard block)
- WARN patterns → exit 0 with stderr warning

Update the pre-commit hook at `.husky/pre-commit` line ~441 to pass
`--blocking`.

**Done when:** Pre-commit blocks on BLOCK-severity misses, warns on
WARN-severity. Existing skip infrastructure (`SKIP_PROPAGATION`) still works.

### Step 4: Align skip mechanism with SKIP_CHECKS

Per D6, update `.husky/pre-commit` to use `is_skipped "propagation-staged"`
instead of direct env var check. Add `propagation-staged` to the `SKIP_CHECKS`
map. Require `SKIP_REASON` (per Guardrail #14 — user must authorize wording).

**Done when:** `SKIP_CHECKS=propagation-staged SKIP_REASON="..." git commit`
skips the check. Direct `SKIP_PROPAGATION` still works as fallback.

### Step 5: Add `--json` output to `check-propagation-staged.js`

Per D14, add `--json` flag producing:

```json
{
  "triggered": ["sanitize-error", "safe-to-write"],
  "misses": [
    {
      "patternId": "sanitize-error",
      "file": "scripts/foo.js",
      "severity": "BLOCK"
    }
  ],
  "blocked": true,
  "duration_ms": 450
}
```

**Done when:** `--json` flag produces valid JSON. Human-readable output remains
the default.

---

## Layer 2: Pre-Push Check (Steps 6-8)

### Step 6: Refactor `check-propagation.js` to use registry

Replace the 4 hardcoded `KNOWN_PATTERN_RULES` with `loadRegistry()` (per D1).
Keep Mode A (function-name diffing) intact alongside new registry Mode B (per
D12).

Expand scope gate from `scripts/**/*.js` to the full D4 glob list.

Share `known-propagation-baseline.json` with pre-commit (per D7).

**Done when:** Pre-push scans all D4 directories, uses registry patterns for
Mode B, keeps Mode A function-name detection.

### Step 7: Align skip mechanism with SKIP_CHECKS

Per D6, update `.husky/pre-push` propagation section to use
`is_skipped "propagation"` consistently (currently mixes direct env var check
with `is_skipped`).

**Done when:** `is_skipped "propagation"` is the sole check. `SKIP_REASON`
required.

### Step 8: Add `--json` output to `check-propagation.js`

Per D14, same JSON structure as Step 5, plus a `modeA` field for function-name
results.

**Done when:** `--json` flag produces valid JSON.

---

## Integration & Testing (Steps 9-12)

### Step 9: Register `propagation-staged` in `hook-checks.json`

Per D8, add entry:

```json
{
  "id": "propagation-staged",
  "hook": "pre-commit",
  "wave": 4,
  "blocking": "block",
  "skip_flag": "propagation-staged"
}
```

**Done when:** `node scripts/validate-hook-checks.js` passes (if it exists),
entry appears in registry.

### Step 10: Populate baseline with current violations

Per D19, run both scripts in audit mode against the current codebase. Any
existing violations get added to `known-propagation-baseline.json` with
`addedAt` and `reason: "pre-existing at enforcement rollout"`. This prevents the
new enforcement from blocking all commits on day 1.

**Done when:** Baseline file has entries, both scripts pass (exit 0) against
current codebase with baseline applied.

### Step 11: Tests

Per D15:

- **Unit tests** in `tests/propagation/` — registry loader, pattern matching,
  miss detection. Test each of the 10 seed patterns against fixture files.
- **Integration test** via `test-hook-gates.js` — simulate PreToolUse stdin with
  staged files that trigger propagation patterns, verify exit code matches
  severity.

**Done when:** All tests pass. Coverage for registry loader, each pattern type,
BLOCK vs WARN severity, baseline suppression, and `--json` output.

### Step 12: Audit checkpoint + debt resolution

Run `code-reviewer` on all new/modified files. Per D19:

- Mark DEBT-45524/45525 (skip abuse) as `resolved-by-plan`
- Mark DEBT-11335/11339 (backlog) as `resolved-by-plan` (baseline populated)

**Done when:** Code review passes. Debt items updated. No untracked files.

Steps 3-5 can run in parallel. Steps 6-8 can run in parallel. Steps 9-11 depend
on Steps 1-2 being complete.
