---
name: audit-health
description:
  Meta-check for audit system health — runs diagnostics and suggests next audits
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-16
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Audit System Health Check

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

## Step 5: Summary and Recommendations

Compile a summary report:

```
=== Audit System Health Report ===

Infrastructure: X/6 health checks passing
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
