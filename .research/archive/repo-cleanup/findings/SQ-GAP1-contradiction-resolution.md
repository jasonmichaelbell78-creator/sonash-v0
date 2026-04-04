# SQ-GAP1: Contradiction Resolution

**Audit Date:** 2026-03-23 **Scope:** 4 contradictions from Waves 1-2

---

## Contradiction 1: state-utils.js Duplicate

| Agent  | Claim                                                        |
| ------ | ------------------------------------------------------------ |
| SQ-009 | Root-level duplicate exists (251 lines vs 139 lines in lib/) |
| SQ-002 | No duplicate exists                                          |

**RESOLVED: SQ-009 is correct, but both files are NEEDED.**

- `.claude/hooks/state-utils.js` (251 lines) — high-level task state management
  API (readState, writeState, updateTaskState, writeHandoff)
- `.claude/hooks/lib/state-utils.js` (139 lines) — low-level atomic write
  primitives (loadJson, saveJson, backupSwap)
- Different concerns, not redundant. Both active.
- SQ-002 missed the root-level file.
- **Action:** Document the architectural split, not delete.

---

## Contradiction 2: Orphan Count

| Agent   | Claim                                                          |
| ------- | -------------------------------------------------------------- |
| SQ-001a | 7 orphans (4 scripts + hook duplicate + 2 gitignore artifacts) |
| SQ-002  | Only 2 confirmed orphans                                       |

**RESOLVED: SQ-002 is substantially correct.**

| Script                            | SQ-001a | SQ-002     | Resolution                                                      |
| --------------------------------- | ------- | ---------- | --------------------------------------------------------------- |
| repair-archives.js                | ORPHAN  | NOT ORPHAN | **Has test file** — utility with coverage, active               |
| rotate-jsonl.js                   | ORPHAN  | NOT ORPHAN | **Imports rotate-state.js** — active utility                    |
| generate-detailed-sonar-report.js | ORPHAN  | NOT ORPHAN | **Has test file** — utility with coverage                       |
| assign-review-tier.js             | ORPHAN  | NOT ORPHAN | **Active in CI** — .github/workflows/auto-label-review-tier.yml |

**Principle:** Test existence confirms intent. CI-only invocation is valid (no
npm script needed). These are utilities, not orphans.

---

## Contradiction 3: Skill Count

| Source               | Count         |
| -------------------- | ------------- |
| SQ-001b              | 67            |
| SKILL_INDEX.md       | Claims 67     |
| SQ-007               | 64 actual     |
| SQ-004               | 64 actual     |
| SQ-GAP1 (this)       | **65 actual** |
| COMMAND_REFERENCE.md | 61 listed     |

**RESOLVED: 65 actual skill directories.**

Missing from COMMAND_REFERENCE.md (4 skills):

1. `/data-effectiveness-audit`
2. `/debt-runner`
3. `/convergence-loop`
4. (1 more TBD — needs manual verification)

SKILL_INDEX.md overcounts at 67 — needs regeneration.

---

## Contradiction 4: assign-review-tier.js

| Agent   | Claim                     |
| ------- | ------------------------- |
| SQ-001a | ORPHAN (no npm script)    |
| SQ-002  | NOT ORPHAN (active in CI) |

**RESOLVED: SQ-002 is correct.**

- Active in: `.github/workflows/auto-label-review-tier.yml` line 65
- CI scripts don't need package.json entries — different invocation context
- NOT orphaned.

---

## Summary

| Contradiction         | Winner                               | Action                                                                   |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------------ |
| state-utils.js        | SQ-009 (both exist) but not orphaned | Document the split                                                       |
| Orphan count          | SQ-002 (most cleared)                | True orphans: 2 (data/local-resources.ts, scripts/test-semgrep-rules.js) |
| Skill count           | SQ-GAP1: 65 actual                   | Update SKILL_INDEX.md + add 4 to COMMAND_REFERENCE.md                    |
| assign-review-tier.js | SQ-002 (active in CI)                | No action needed                                                         |
