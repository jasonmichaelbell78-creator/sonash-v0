# SQ-005: Documentation Staleness Audit

**Audit Date:** 2026-03-23 **Scope:** All non-archived docs

---

## Executive Summary

7 stale documents found. 7 verified as current. Most staleness is version
numbers and missing hook documentation.

---

## Stale Documents

### HIGH Priority

| File             | Last Updated | Age | Issue                                                                                                           | Severity    |
| ---------------- | ------------ | --- | --------------------------------------------------------------------------------------------------------------- | ----------- |
| ARCHITECTURE.md  | 2026-01-02   | 80d | Lists Next.js 16.1 (actual: 16.2.0), React 19.2.3 (actual: 19.2.4)                                              | MEDIUM      |
| docs/TRIGGERS.md | 2026-01-27   | 55d | Lists 13 session hooks but settings.json has more; missing PreToolUse hooks entirely; trigger count understated | MEDIUM-HIGH |
| docs/SECURITY.md | 2026-01-05   | 77d | Not referencing CLAUDE.md v5.6 guardrails; key rotation policy predates hook infrastructure changes             | MEDIUM      |

### MEDIUM Priority

| File                                   | Last Updated | Age | Issue                                                                                | Severity |
| -------------------------------------- | ------------ | --- | ------------------------------------------------------------------------------------ | -------- |
| .claude/HOOKS.md                       | 2026-02-23   | 29d | Missing gsd-check-update.js hook; lists 3 SessionStart hooks but settings.json has 4 | MEDIUM   |
| docs/agent_docs/AGENT_ORCHESTRATION.md | 2026-02-10   | 42d | References "claude.md v4.2" but CLAUDE.md is now v5.6; missing guardrails 7-14       | LOW      |

### LOW Priority

| File           | Last Updated | Age | Issue                                                                         | Severity |
| -------------- | ------------ | --- | ----------------------------------------------------------------------------- | -------- |
| DEVELOPMENT.md | 2026-02-11   | 40d | Predates sessions #232-234; may not reference newest CLI tools                | LOW      |
| AI_WORKFLOW.md | 2026-02-23   | 29d | Could clarify that CLAUDE.md S2+S4 now contains all security/behavioral rules | LOW      |

---

## Verified as Current (No Issues)

- CLAUDE.md (v5.6, 2026-03-17) ✓
- SESSION_CONTEXT.md (v8.6, 2026-03-23) ✓
- ROADMAP.md (v3.28, 2026-03-19) ✓
- CONTRIBUTING.md (v1.0, 2026-03-18) ✓
- README.md (v2.2, 2026-02-23) ✓
- .claude/COMMAND_REFERENCE.md (v5.8, 2026-03-19) ✓
- .claude/STATE_SCHEMA.md (v1.2, 2026-02-26) ✓

---

## Remediation Priority

1. Fix ARCHITECTURE.md version table (Next.js 16.1→16.2.0, React 19.2.3→19.2.4)
2. Update docs/TRIGGERS.md hook inventory + PreToolUse hooks
3. Update docs/SECURITY.md to reference latest CLAUDE.md guardrails
4. Update .claude/HOOKS.md with gsd-check-update.js
5. Update AGENT_ORCHESTRATION.md source version reference
6. Refresh DEVELOPMENT.md
7. Clarify AI_WORKFLOW.md security doc hierarchy
