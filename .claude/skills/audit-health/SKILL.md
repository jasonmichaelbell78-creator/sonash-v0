---
name: audit-health
description:
  Meta-check for audit system health — runs diagnostics on domain audits and
  ecosystem audits, suggests next audits
---

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Audit System Health Check

## When to Use

- Meta-check for audit system health — runs diagnostics on domain audits and
- User explicitly invokes `/audit-health`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## Purpose

Quick meta-check that verifies the audit ecosystem is healthy and suggests which
audits should be run next. Does NOT perform an actual audit — instead checks
that the audit infrastructure (directories, scripts, templates, thresholds) is
in good shape.

**Invocation:** `/audit-health`

---

## AI Instructions

When invoked, execute the following steps in order. Report results to the user
after each step.

---

## Step 1: Run Health Check Script

```bash
node scripts/audit/audit-health-check.js
```

Report the results. If any checks fail, note them as action items.

---

## Step 2: Check Audit Thresholds

```bash
node scripts/audit/count-commits-since.js
```

Report which categories have exceeded their commit thresholds. Recommend running
audits for exceeded categories.

---

## Step 3: Run Template Compliance

```bash
node scripts/audit/validate-templates.js
```

Report template compliance scores. Flag any templates below 70%.

---

## Step 4: Run Pre-Audit Check

```bash
node scripts/audit/pre-audit-check.js
```

Report any missing prerequisites that would block future audits.

---

## Step 5: Ecosystem Audit Health

Review the ecosystem audit checks (7-9) from the health check output and compile
a detailed table:

```
### Ecosystem Audit Health

| Audit | Skill Dir | Run Script | State File | Lib Complete |
|-------|-----------|------------|------------|--------------|
| hook-ecosystem-audit | {status} | {status} | {status} | {status} |
| session-ecosystem-audit | {status} | {status} | {status} | {status} |
| tdms-ecosystem-audit | {status} | {status} | {status} | {status} |
| pr-ecosystem-audit | {status} | {status} | {status} | {status} |
| skill-ecosystem-audit | {status} | {status} | {status} | {status} |
| doc-ecosystem-audit | {status} | {status} | {status} | {status} |
| script-ecosystem-audit | {status} | {status} | {status} | {status} |
```

Replace `{status}` with PASS or FAIL based on health check results.

---

## Step 6: Summary and Recommendations

Compile a summary report:

```
=== Audit System Health Report ===

Infrastructure: X/9 health checks passing
Templates: Y/9 at 80%+ compliance
Prerequisites: Z/6 checks passing

Recommended Actions:
1. [URGENT] Run /audit-<category> — threshold exceeded (N commits)
2. [WARN] Fix template compliance for <template>
3. [INFO] Update stale baselines in COORDINATOR.md

Next suggested audit: /audit-<category> (highest threshold exceedance)
```

Prioritize recommendations:

- URGENT: Any S0/S1 threshold exceedances or failed health checks
- WARN: Template compliance issues or missing prerequisites
- INFO: Stale baselines or informational items

---

## Context Recovery

This skill runs quickly (< 1 minute) and does not need context recovery. If
interrupted, simply re-run `/audit-health`.

---

## Version History

| Version | Date       | Change                                                  |
| ------- | ---------- | ------------------------------------------------------- |
| 1.1     | 2026-02-24 | Add ecosystem audit coverage (checks 7-9, health table) |
| 1.0     | 2026-02-16 | Initial version with 6 domain audit health checks       |
