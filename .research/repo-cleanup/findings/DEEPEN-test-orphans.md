# Deepening: Test File Orphan Sweep

**Date:** 2026-03-23 **Scope:** All test directories (~200+ test files)

---

## Confirmed Orphan Tests (2)

| Test File                                 | Tests What                             | Target Exists? |
| ----------------------------------------- | -------------------------------------- | :------------: |
| tests/hooks/gsd-context-monitor.test.ts   | .claude/hooks/gsd-context-monitor.js   |       NO       |
| tests/hooks/stop-serena-dashboard.test.ts | .claude/hooks/stop-serena-dashboard.js |       NO       |

Both will fail if run — they import non-existent modules.

## Partial Orphan Tests (2 — stale comments only)

| Test File                                     | Issue                                            |       Runs?        |
| --------------------------------------------- | ------------------------------------------------ | :----------------: |
| scripts/**tests**/wave6-alerts.test.js        | Comments reference removed scripts/run-alerts.js | Yes (inline logic) |
| scripts/**tests**/wave9-defense-depth.test.js | Comments reference removed scripts/run-alerts.js | Yes (inline logic) |

## Knip Config Finding

knip.json ignores `tests/**` and `scripts/**` entirely and suppresses 13
devDependencies including the 3 the OTB agent flagged (msw,
@firebase/rules-unit-testing, @playwright/test). Knip is masking
infrastructure-layer issues. The config itself is technical debt.

## Summary

| Category               | Count                                  |
| ---------------------- | -------------------------------------- |
| Confirmed orphan tests | 2                                      |
| Partial orphan tests   | 2                                      |
| Active tests           | ~200+                                  |
| OTB estimate (5-7)     | **Revised to 2 confirmed + 2 partial** |
