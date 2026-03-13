# Hook Systems Audit — Implementation Plan

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-11
**Status:** COMPLETE
**State File:** `.claude/state/task-mini-audit-hook-systems.state.json`
<!-- prettier-ignore-end -->

## Summary

35 accepted decisions + 6 learnings from a 10-category mini-audit of pre-commit
and pre-push hook systems. Organized into 8 implementation waves by dependency
order.

**Scope:** Hook code, shared infrastructure, warning/override systems, /alerts +
session-begin/end integration, CLAUDE.md rules, audit skill updates, underlying
issue remediation.

---

## Wave 0: Quick Wins (no dependencies)

_Estimated: 15 min | Files: 3-4_

| ID     | Action                                                                                 | Files                                                             |
| ------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| C10-G1 | Replace 5 direct fs calls with safe-fs wrappers                                        | `scripts/suggest-pattern-automation.js`, `scripts/archive-doc.js` |
| C6-G3  | Compute STAGED_FILES once after fnm init, reuse throughout                             | `.husky/pre-commit`                                               |
| C7-G5  | Replace `2>/dev/null \|\| true` on append-hook-warning with logging to HOOK_OUTPUT_LOG | `.husky/pre-commit`, `.husky/pre-push`                            |

---

## Wave 1: Shared Infrastructure (enables Waves 2-4)

_Estimated: 30 min | Files: 3_

| ID    | Action                                                                                             | Files                                                                    |
| ----- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| C6-G1 | Extract `require_skip_reason()`, `is_skipped()`, fnm init to `.husky/_shared.sh`                   | NEW: `.husky/_shared.sh`, MODIFY: `.husky/pre-commit`, `.husky/pre-push` |
| C6-G2 | Move `add_exit_trap()` to `_shared.sh`, pre-push adopts chaining                                   | `.husky/_shared.sh`, `.husky/pre-push`                                   |
| C4-G1 | Ban "pre-existing" in `require_skip_reason()` validator + create `known-debt-baseline.json` schema | `.husky/_shared.sh`, NEW: `.claude/state/known-debt-baseline.json`       |
| L2    | (Confirms C4-G1 — no additional work)                                                              | —                                                                        |
| L5    | (Confirms C6-G1/G2 — no additional work)                                                           | —                                                                        |

**Baseline file design:**

```json
{
  "generated": "ISO-date",
  "checks": {
    "cognitive-complexity": { "file.js": 45, "file2.js": 30 },
    "propagation": { "statSync-without-lstat": ["file1.js", "file2.js"] }
  }
}
```

---

## Wave 2: Gate Cleanup (remove dead gates)

_Estimated: 20 min | Files: 2_

| ID    | Action                                                             | Files                             |
| ----- | ------------------------------------------------------------------ | --------------------------------- |
| C7-G2 | Remove gate 3b (propagation warning) from pre-commit               | `.husky/pre-commit`               |
| C7-G3 | Remove gate 5 (CANON validation) from pre-commit                   | `.husky/pre-commit`               |
| C7-G4 | Remove gate 13 (test coverage warning) from pre-commit             | `.husky/pre-commit`               |
| C9-G2 | Remove consolidation trigger from check-triggers.js                | `.claude/hooks/check-triggers.js` |
| L6    | (Confirms C7-G2/G3/G4 — gate effectiveness review added in Wave 7) | —                                 |

---

## Wave 3: Gate Improvements (depends on Wave 1 for baseline)

_Estimated: 45 min | Files: 5-6_

| ID     | Action                                                                           | Files                                                           |
| ------ | -------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| C7-G1  | Code-reviewer gate: parse JSONL, verify timestamp within 4 hours                 | `.husky/pre-push`                                               |
| C6-G4  | Security check: filter diff to .js/.ts content only using diff headers           | `.husky/pre-push`                                               |
| C9-G1  | Tighten security trigger: check changed line content, exclude tests/docs         | `.claude/hooks/check-triggers.js`                               |
| C8-G1  | Parallelize tsc + cyclomatic CC + cognitive CC in pre-push                       | `.husky/pre-push`                                               |
| C10-G4 | Implement CC baseline — record current CC per file, gate blocks regressions only | `scripts/check-cc.js`, `.claude/state/known-debt-baseline.json` |

---

## Wave 4: Warning System Improvements

_Estimated: 30 min | Files: 3-4_

| ID    | Action                                                                            | Files                                                                   |
| ----- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| C2-G1 | Enrich warning payloads: top 3 affected files + pattern name                      | `.claude/hooks/check-propagation.js`, `.claude/hooks/check-triggers.js` |
| C2-G2 | Occurrence counting + auto-escalation (5+ → warning, 15+ → error)                 | `.claude/hooks/append-hook-warning.js`                                  |
| C2-G3 | Add `last_acknowledged` + `occurrences_since_ack` to hook-warnings.json           | `.claude/hooks/append-hook-warning.js`                                  |
| C1-G3 | Fix trend calculation: rolling 7-day windows instead of all-time vs previous week | `.claude/hooks/log-override.js`                                         |

---

## Wave 5: Cross-System Integration (depends on Wave 4)

_Estimated: 60 min | Files: 4-5 skills/scripts_

| ID    | Action                                                                                   | Files                                                                                    |
| ----- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| C1-G1 | Wire override frequency into /alerts (10 bypasses/check/7 days threshold)                | `.claude/skills/alerts/`                                                                 |
| C2-G4 | Hook-warning-trends dimension in /alerts (reads JSONL trail)                             | `.claude/skills/alerts/`                                                                 |
| C4-G3 | Bypass budget metric in /alerts (weekly override count vs average)                       | `.claude/skills/alerts/`                                                                 |
| C5-G3 | Health score one-liner at session-start (grade + delta, 2+ grade drop = warning)         | `.claude/hooks/session-start.js`                                                         |
| C3-G1 | Hook learning synthesizer at session-end (top 3 recurring issues from 3 data sources)    | `.claude/skills/session-end/`                                                            |
| L3    | Wire data into session-begin (anomaly gate), session-end (summary), /alerts (drill-down) | `.claude/skills/session-begin/`, `.claude/skills/session-end/`, `.claude/skills/alerts/` |

---

## Wave 6: Escalation + TDMS Integration

_Estimated: 30 min | Files: 3-4_

| ID    | Action                                                                      | Files                                         |
| ----- | --------------------------------------------------------------------------- | --------------------------------------------- |
| C3-G2 | PR retro: 3+ same recommendation → auto-tag CRITICAL + session action items | `.claude/skills/pr-retro/`                    |
| C3-G3 | Auto-generate DEBT entry at 15+ bypasses in 14 days (dedupe vs MASTER_DEBT) | `.claude/hooks/log-override.js` or new script |
| L4    | (Confirms C2-G2 + C3-G2 — no additional work)                               | —                                             |

---

## Wave 7: Rules + Skill Updates

_Estimated: 30 min | Files: 4-5_

| ID        | Action                                                                                 | Files                                  |
| --------- | -------------------------------------------------------------------------------------- | -------------------------------------- |
| L1        | Add "all passive surfacing must force acknowledgment" to CLAUDE.md Section 4           | `CLAUDE.md`                            |
| L1        | Add acknowledgment gate to session-begin skill (unacknowledged warnings block proceed) | `.claude/skills/session-begin/`        |
| L6        | Add gate effectiveness review step to hook-ecosystem-audit skill                       | `.claude/skills/hook-ecosystem-audit/` |
| Side note | Cross-check all 10 audit categories against hook-ecosystem-audit skill, add missing    | `.claude/skills/hook-ecosystem-audit/` |

---

## Wave 8: Underlying Issue Remediation

_Estimated: 60-90 min | Files: many_

| ID     | Action                                                                                             | Files                                                        |
| ------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| C10-G2 | Run test suite diagnostic, fix trivial failures, DEBT for complex                                  | test files, health state                                     |
| C10-G3 | Bulk reclassify S0 → S1 for non-security/non-production items                                      | `docs/technical-debt/MASTER_DEBT.jsonl`, `raw/deduped.jsonl` |
| C10-G5 | Fix `writeFileSync` without symlink guard (321 occ) + `path.resolve` without containment (272 occ) | 200+ script files                                            |

**Note:** C10-G5 is the largest item. May need to be split into sub-PRs:

- PR A: `writeFileSync` → `safeWriteFileSync` across scripts/
- PR B: `path.resolve` → validated `path.resolve` across scripts/

---

## Deferred Items (not in scope)

| ID                                | Reason                                                         | Where tracked    |
| --------------------------------- | -------------------------------------------------------------- | ---------------- |
| C3-G4                             | Closed-loop verification — depends on C3-G2/G3                 | State file       |
| C8-G2                             | Null/undefined safety gate — needs deep-plan for ESLint impact | Create DEBT item |
| Non-security propagation patterns | filter(Boolean), statSync, rmSync, escapeCell — baselined      | DEBT-11335       |

---

## Execution Notes

- **Commit strategy:** One commit per wave (or sub-wave for large changes)
- **Testing:** Run `npm run patterns:check` after Wave 0, hook test suite after
  Waves 1-4, full test suite in Wave 8
- **Rollback:** Each wave is independently revertable
- **Total estimated effort:** 4-5 hours across 2-3 sessions
