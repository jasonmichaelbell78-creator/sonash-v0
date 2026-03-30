<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Diagnosis: Passive Surfacing Remediation

**Date:** 2026-03-17 **Task:** Fix all passive surfacing violations (CLAUDE.md
Guardrail #6) across hooks, scripts, and Claude Code handlers **Discovery
Method:** 4-agent research team (hooks, scripts, skills, settings) + convergence
verification agent. 5 agents total.

---

## ROADMAP Alignment

**Aligned (Operational Tooling / SWS).** Guardrail #6 ("All passive surfacing
must force acknowledgment") is an existing rule. This plan enforces it in code
that predates the rule.

---

## Findings: 33 Verified Violations

### By Severity

| Severity | Count | Files                                                                                                                           |
| -------- | ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| HIGH     | 10    | session-start.js (3), post-read-handler.js (3), user-prompt-handler.js (2), post-write-validator.js (1), compact-restore.js (1) |
| MEDIUM   | 16    | post-write-validator.js (8), scripts (3), session-start.js (3), pre-commit (1), check-remote-session-context.js (1)             |
| LOW      | 7     | post-write-validator.js (1), scripts (4), alerts Phase 6 (1), decision-save-prompt.js (1)                                       |

### By Root Cause Pattern

| Pattern                              | Count | Fix Approach (Per D1)                                |
| ------------------------------------ | ----- | ---------------------------------------------------- |
| Non-blocking warning, no action path | 14    | Add action command or route to /alerts (Per D2, D10) |
| "Consider running X" without command | 8     | Replace with `Fix: [command]` (Per D4, D11)          |
| Cooldown/dedup suppressing warnings  | 3     | Exclude HIGH severity from cooldown (Per D5)         |
| "Continuing anyway" auto-recovery    | 4     | Flag for session-begin gate (Per D3, D8)             |
| Informational wallpaper              | 4     | Remove or move to DEBUG (Per D6)                     |

### Compliant Layer

All 7 audited skills (session-begin, session-end, alerts, ecosystem-health,
checkpoint, code-reviewer, audit-health) are COMPLIANT. Violations are entirely
in the hooks and scripts infrastructure layer — built before Guardrail #6.

### Convergence Results

8/8 HIGH-severity claims CONFIRMED. 2 false negatives found and added
(check-remote-session-context.js, decision-save-prompt.js).
