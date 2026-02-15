<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Wave-by-Wave Execution Details

Detailed agent launch instructions, checkpoint verification, and status display
templates for each stage.

## Stage 1: Technical Core Audits (4 Parallel)

**Launch 4 agents IN PARALLEL using Task tool with `run_in_background: true`:**

| Agent | Skill             | Output File                   |
| ----- | ----------------- | ----------------------------- |
| 1A    | audit-code        | `audit-code-report.md`        |
| 1B    | audit-security    | `audit-security-report.md`    |
| 1C    | audit-performance | `audit-performance-report.md` |
| 1D    | audit-refactoring | `audit-refactoring-report.md` |

**Why these 4 first:**

- Core technical analysis
- Security findings needed for S0/S1 escalation check
- Respects max 4 concurrent agents (CLAUDE.md Section 6.3)

**Display Initial Status:**

```
Comprehensive Audit Started

Stage 1: Technical Core (4 parallel)
  Code Quality
  Security
  Performance
  Refactoring

Stage 2: Supporting (waiting)
  Documentation
  Process/Automation
  Engineering Productivity

Stage 2.5: Meta & Enhancement (waiting)
  Enhancements
  AI Optimization

Stage 3: Aggregation (waiting)
  Aggregator

Estimated time: 55-65 minutes
(vs 250 minutes if run sequentially - 65% faster!)
```

### Stage 1 Checkpoint (MANDATORY)

**1. Verify output files exist:**

```bash
for f in audit-code-report.md audit-security-report.md audit-performance-report.md audit-refactoring-report.md; do
  if [ ! -s "docs/audits/comprehensive/$f" ]; then
    echo "MISSING: $f - re-run agent"
  else
    echo "OK: $f exists"
  fi
done
```

**2. S0/S1 Security Escalation Check:**

```bash
grep -cE "\bS0\b|\bS1\b" docs/audits/comprehensive/audit-security-report.md
```

If S0/S1 findings exist, display escalation prompt:

```
SECURITY ESCALATION

Security audit found critical/high findings.
These should be reviewed before continuing.

S0 Critical: X findings
S1 High: Y findings

Options:
1. Review security findings now (recommended for S0)
2. Continue with remaining audits
3. Stop and address security issues first

What would you like to do?
```

**3. Display Stage 1 Summary:**

```
Stage 1 Complete (Technical Core)

  Code Quality    (X findings)
  Security        (X findings, Y critical)
  Performance     (X findings)
  Refactoring     (X findings)

Proceeding to Stage 2...
```

---

## Stage 2: Supporting Audits (3 Parallel)

**Launch 3 agents IN PARALLEL using Task tool with `run_in_background: true`:**

| Agent | Skill                          | Output File                                |
| ----- | ------------------------------ | ------------------------------------------ |
| 2A    | audit-documentation            | `audit-documentation-report.md`            |
| 2B    | audit-process                  | `audit-process-report.md`                  |
| 2C    | audit-engineering-productivity | `audit-engineering-productivity-report.md` |

**Why these in Stage 2:**

- Supporting audits that can use Stage 1 context
- Lower priority than technical core

### Stage 2 Checkpoint (MANDATORY)

**1. Verify output files exist:**

```bash
for f in audit-documentation-report.md audit-process-report.md audit-engineering-productivity-report.md; do
  if [ ! -s "docs/audits/comprehensive/$f" ]; then
    echo "MISSING: $f - re-run agent"
  else
    echo "OK: $f exists"
  fi
done
```

**2. Display Stage 2 Summary:**

```
Stage 2 Complete (Supporting)

  Documentation         (X findings)
  Process/Auto          (X findings)
  Engineering Productivity (X findings)

Proceeding to Stage 2.5...
```

---

## Stage 2.5: Meta & Enhancement Audits (2 Parallel)

**Launch 2 agents IN PARALLEL using Task tool with `run_in_background: true`:**

| Agent | Skill                 | Output File                       |
| ----- | --------------------- | --------------------------------- |
| 2.5A  | audit-enhancements    | `audit-enhancements-report.md`    |
| 2.5B  | audit-ai-optimization | `audit-ai-optimization-report.md` |

**Why these in Stage 2.5:**

- Meta-level audits that benefit from seeing patterns in prior stages
- Enhancements audit looks at feature gaps across the full app
- AI optimization audits the audit infrastructure itself (skills, hooks, MCP)
- Only 2 agents -- well within concurrent limit

### Stage 2.5 Checkpoint (MANDATORY)

**1. Verify output files exist:**

```bash
for f in audit-enhancements-report.md audit-ai-optimization-report.md; do
  if [ ! -s "docs/audits/comprehensive/$f" ]; then
    echo "MISSING: $f - re-run agent"
  else
    echo "OK: $f exists"
  fi
done
```

**2. Display Stage 2.5 Summary:**

```
Stage 2.5 Complete (Meta & Enhancement)

  Enhancements         (X findings)
  AI Optimization      (X findings)

All 9 audits complete. Proceeding to aggregation...
```

---

## Stage 3: Aggregation Phase

**Launch Aggregator Agent**

Use Task tool to spawn `audit-aggregator` agent:

```javascript
Task({
  subagent_type: "audit-aggregator",
  description: "Aggregate and deduplicate audit results",
  prompt: `
Read all 9 audit reports from docs/audits/comprehensive/

Perform:
1. Deduplicate findings (same file:line across multiple audits -> merge)
2. Identify cross-cutting patterns (files appearing in 3+ audits)
3. Priority ranking (severity x cross-domain count x effort)
4. Generate executive summary with top 20 findings

Output to: docs/audits/comprehensive/COMPREHENSIVE_AUDIT_REPORT.md
  `,
});
```

**Expected Output:**

- `docs/audits/comprehensive/COMPREHENSIVE_AUDIT_REPORT.md` (unified report)

**Wait for aggregator to complete** (typically 3-5 minutes)

### Stage 3 Checkpoint (MANDATORY)

After aggregator completes, verify:

```bash
if [ ! -s "docs/audits/comprehensive/COMPREHENSIVE_AUDIT_REPORT.md" ]; then
  echo "Aggregation failed - report not generated"
  echo "Individual reports still available for manual review"
else
  echo "Comprehensive report generated"
fi
```
