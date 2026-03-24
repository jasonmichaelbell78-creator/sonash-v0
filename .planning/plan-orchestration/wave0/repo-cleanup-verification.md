# Repo Cleanup Plan — Pre-Execution Verification Report

**Date:** 2026-03-24 **Verifier:** CL verification agent (Step 2,
plan-orchestration) **Plan:** `.planning/repo-cleanup/PLAN.md` **Research:**
`.research/plan-orchestration/findings/S-01-repo-cleanup.md`

---

## Discrepancy 1: rotation-policy.json path

**Claimed (plan, Step 6 line 144):** `scripts/config/rotation-policy.json`
**Claimed (research):** Actual path is `config/rotation-policy.json` **Actual:**
`config/rotation-policy.json` EXISTS. `scripts/config/rotation-policy.json` does
NOT exist. The `scripts/config/` directory exists but contains other files, not
`rotation-policy.json`. **Impact on plan:** NEEDS STEP CHANGE. Step 6 must
reference `config/rotation-policy.json`, not
`scripts/config/rotation-policy.json`. Research was correct.

---

## Discrepancy 2: knip.json suppression count

**Claimed (plan, Step 8):** Remove 3 dep suppressions (`msw`,
`@firebase/rules-unit-testing`, `@playwright/test`) **Claimed (research):** Only
2 suppressions exist; `@playwright/test` was never suppressed **Actual:**
`knip.json` `ignoreDependencies` array contains exactly 2 of the 3 targeted
deps:

- `@firebase/rules-unit-testing` (line 23) — PRESENT, remove
- `msw` (line 24) — PRESENT, remove
- `@playwright/test` — NOT PRESENT in `ignoreDependencies`

Full `ignoreDependencies` list (15 entries): `@fontsource/*`,
`tailwindcss-animate`, `tw-animate-css`, `autoprefixer`, `firebase-admin`,
`remark-parse`, `remark-stringify`, `unified`, `tailwindcss`,
`@dataconnect/generated`, `@hookform/resolvers`, `cmdk`, `react-day-picker`,
`react-hook-form`, `isomorphic-dompurify`, `vaul`,
`@firebase/rules-unit-testing`, `msw`, `@modelcontextprotocol/server-memory`.

**Impact on plan:** NEEDS STEP CHANGE. Step 8 knip.json edit is 2 removals,
not 3. The `npm uninstall` of all 3 packages is still correct (all 3 are in
`package.json`). Research was correct.

---

## Discrepancy 3: Files already missing

### `docs/technical-debt/MASTER_DEBT.jsonl.bak`

**Claimed (plan, Step 2 line 84):** Delete via `git rm` **Claimed (research):**
NOT FOUND — already deleted or never existed **Actual:** NOT FOUND. Only
`docs/technical-debt/MASTER_DEBT.jsonl` exists (7.6 MB). **Impact on plan:**
NEEDS STEP CHANGE. Remove from Step 2 `git rm` list (or wrap in conditional like
`.mcp.json.bak`). This reduces confirmed orphan deletes from 6 to 5.

### `.claude/state/deep-plan-review-lifecycle.state.json`

**Claimed (plan, Step 3 line 100):** Delete via `git rm` **Claimed (research):**
NOT FOUND — already deleted **Actual:** NOT FOUND. **Impact on plan:** NEEDS
STEP CHANGE. Remove from Step 3 `git rm` list (or wrap in conditional). This
reduces archive/move operations from 4 to 3.

### `.mcp.json.bak`

**Claimed (plan, Step 2 line 86):** Conditional delete (`2>/dev/null || true`)
**Actual:** NOT FOUND. **Impact on plan:** NO IMPACT. Plan already handles this
with conditional delete.

---

## Additional Verification 4: Orphan Files Existence Check

| File                                                  | Plan Step | Status                            |
| ----------------------------------------------------- | --------- | --------------------------------- |
| `scripts/test-semgrep-rules.js`                       | Step 2    | EXISTS                            |
| `.claude/hooks/state-utils.js`                        | Step 2    | EXISTS                            |
| `tests/hooks/gsd-context-monitor.test.ts`             | Step 2    | EXISTS                            |
| `tests/hooks/stop-serena-dashboard.test.ts`           | Step 2    | EXISTS                            |
| `docs/technical-debt/raw/reviews.jsonl`               | Step 2    | EXISTS                            |
| `docs/technical-debt/MASTER_DEBT.jsonl.bak`           | Step 2    | **NOT FOUND**                     |
| `.mcp.json.bak`                                       | Step 2    | NOT FOUND (conditional, expected) |
| `.claude/state/deep-plan-review-lifecycle.state.json` | Step 3    | **NOT FOUND**                     |
| `.claude/override-log-1772919008171.jsonl`            | Step 3    | EXISTS                            |
| `data/ecosystem-v2/retros.jsonl.archived-20260318`    | Step 3    | EXISTS                            |
| `data/ecosystem-v2/reviews.jsonl.archived-20260318`   | Step 3    | EXISTS                            |

**Summary:** 8 of 11 targeted files exist. 2 are already gone (need plan
adjustment). 1 is conditional (no change needed).

---

## Additional Verification 5: Step Dependencies

| Dependency Claim                                                    | Valid? | Notes                                                           |
| ------------------------------------------------------------------- | ------ | --------------------------------------------------------------- |
| Steps 2-3 depend on Step 1 (branch creation)                        | YES    | Standard prerequisite                                           |
| Step 4 depends on Steps 2-3 (commit after deletions)                | YES    | Correct sequencing                                              |
| Step 5 depends on Step 4 (verify after commit)                      | YES    | Correct sequencing                                              |
| Steps 6-10 depend on Step 5 (begin constructive after verification) | YES    | Correct — ensures destructive commit is clean before proceeding |
| Steps 6-10 can run in parallel                                      | YES    | All modify independent files. No overlap.                       |
| Step 11 depends on Steps 6-10                                       | YES    | Commit after all constructive changes                           |
| Steps 11-14 are sequential                                          | YES    | commit → verify → push → audit                                  |

**All step dependencies are valid.** No changes needed.

---

## Additional Verification 6: Test Suite Baseline

```
Tests:    3592
Suites:   864
Pass:     3586
Fail:     0
Cancelled: 0
Skipped:  6
Duration: 13.15s
```

**Verdict: ALL TESTS PASS.** Clean baseline confirmed. Any test failure after
cleanup execution is attributable to the cleanup changes.

---

## Overall Verdict: PLAN NEEDS UPDATES

The plan is fundamentally sound but requires 3 specific corrections before
execution:

### Required Updates

1. **Step 6 (line 144):** Change `scripts/config/rotation-policy.json` to
   `config/rotation-policy.json`

2. **Step 2 (line 84):** Change
   `git rm docs/technical-debt/MASTER_DEBT.jsonl.bak` to conditional:

   ```bash
   git rm docs/technical-debt/MASTER_DEBT.jsonl.bak 2>/dev/null || true
   ```

   Or remove the line entirely. Update the orphan count from 6 to 5 confirmed.

3. **Step 3 (line 100):** Change
   `git rm .claude/state/deep-plan-review-lifecycle.state.json` to conditional:

   ```bash
   git rm .claude/state/deep-plan-review-lifecycle.state.json 2>/dev/null || true
   ```

   Or remove the line entirely. Update the archive count from 4 to 3.

4. **Step 8 (plan text + commit message):** Change "remove 3 dep suppressions"
   to "remove 2 dep suppressions" for knip.json. The `npm uninstall` of all 3
   packages remains correct.

5. **Step 4 commit message (line 121):** Update to reflect actual deletion count
   (adjust "7 orphans" to "5 orphans + 2 conditional" or similar).

### No Changes Needed

- Step dependencies: all valid
- File existence for remaining targets: all confirmed
- Test baseline: clean (0 failures)
- Parallelization plan (Steps 6-10): valid, no file overlaps
