# SQ-004: Skill & Agent Health Audit

**Audit Date:** 2026-03-23 **Scope:** 20 skills sampled, 15 agents sampled,
wiring + companions checked

---

## Executive Summary

Overall health: **B+**. 6 oversized skills violate SKILL_STANDARDS.md. 13 agents
missing maxTurns. 3 skills lack version history. Agent count is 25 (not 37 as
previously claimed). Wiring is sound — no orphaned agents.

---

## Oversized Skills (>300 lines, no REFERENCE.md)

Per SKILL_STANDARDS.md: >300 lines = extract to REFERENCE.md companion.

| Skill                 | Lines | Has REFERENCE.md? | Status        |
| --------------------- | ----- | :---------------: | ------------- |
| audit-enhancements    | 505   |        No         | **VIOLATION** |
| audit-ai-optimization | ~499  |        No         | **VIOLATION** |
| audit-comprehensive   | 493   |        No         | **VIOLATION** |
| pr-review             | 479   |        No         | **VIOLATION** |
| doc-optimizer         | 471   |        No         | **VIOLATION** |
| pr-ecosystem-audit    | 470   |        No         | **VIOLATION** |
| session-end           | 451   |        No         | **VIOLATION** |

---

## Skills Missing Version History

| Skill             | Issue                     |
| ----------------- | ------------------------- |
| quick-fix         | No version history at all |
| artifacts-builder | No version history at all |
| task-next         | No version history at all |

---

## Agent maxTurns Missing (13/25)

Only `code-reviewer` (25) and `security-auditor` (25) have explicit maxTurns.
All others fall back to system default.

Missing maxTurns: frontend-developer, debugger, database-architect,
deployment-engineer, documentation-expert, react-performance-optimization,
test-engineer, ui-ux-designer, mcp-expert, nextjs-architecture-expert,
fullstack-developer, deep-research-searcher, deep-research-synthesizer

---

## Count Discrepancies

| Source               | Skills        | Agents        |
| -------------------- | ------------- | ------------- |
| SKILL_INDEX.md       | Claims 67     | —             |
| SQ-001b (Wave 1)     | 67            | 37            |
| SQ-004 (this audit)  | **64 actual** | **25 actual** |
| COMMAND_REFERENCE.md | 61 listed     | —             |

**Note:** The 37 vs 25 agent discrepancy needs resolution — SQ-001b may have
counted GSD agents in .claude/agents/global/ that SQ-004 missed or vice versa.
SQ-GAP1 should resolve.

---

## Skill-to-Trigger Wiring: GOOD

All CLAUDE.md S7 triggers point to existing skills/agents:

- deep-research → deep-research-searcher/synthesizer ✓
- code-reviewer → .claude/agents/code-reviewer.md ✓
- security-auditor → .claude/agents/security-auditor.md ✓
- documentation-expert → .claude/agents/documentation-expert.md ✓
- frontend-developer → .claude/agents/frontend-developer.md ✓

No orphaned agents found.

---

## Companion File Health

- 15 skills have REFERENCE.md companions ✓
- 3 skills have domains/ directories (deep-research) ✓
- 18+ skills have scripts/ directories ✓
- Scripts registered in package.json for ecosystem audit skills ✓

---

## Recommendations

### Priority 1: Structural Compliance

1. Extract 7 oversized skills to REFERENCE.md companions
2. Add version history to quick-fix, artifacts-builder, task-next
3. Add maxTurns: 25 to all 13 agents missing it

### Priority 2: Index Accuracy

1. Regenerate SKILL_INDEX.md (64, not 67)
2. Update COMMAND_REFERENCE.md (add 3 missing skills)
3. Resolve agent count (25 vs 37)

### Priority 3: Validation

1. Add pre-commit check enforcing 300-line limit + REFERENCE.md pairing
2. Add agent maxTurns validation
