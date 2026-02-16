<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-16
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Comprehensive Audit Wave Details

Complete reference for staged execution of the 9-domain comprehensive audit
system. This document provides detailed instructions for each stage, including
agent launch commands, checkpoint verification, and status displays.

---

## Table of Contents

- [Overview](#overview)
- [Stage Architecture](#stage-architecture)
- [Stage 1: Foundation](#stage-1-foundation)
- [Stage 2: Structure](#stage-2-structure)
- [Stage 2.5: Meta & Enhancement](#stage-25-meta--enhancement)
- [Stage 3: Cross-Cutting](#stage-3-cross-cutting)
- [Stage 4: Aggregation](#stage-4-aggregation)
- [Checkpoint Verification](#checkpoint-verification)
- [Status Display Templates](#status-display-templates)
- [Error Handling](#error-handling)

---

## Overview

The comprehensive audit runs 9 specialized audits across 4 stages, respecting
the 4-concurrent-agent limit. Stages are designed to:

1. **Minimize wait time** - Run independent audits in parallel
2. **Respect dependencies** - Engineering productivity needs
   code/security/performance context
3. **Enable early escalation** - S0/S1 security findings checked after Stage 1
4. **Support recovery** - Each stage has a checkpoint for context compaction
   recovery

**Total execution time:** ~65 minutes (vs 250 minutes sequential)

**Agent distribution:**

- Stage 1: 4 agents (Foundation)
- Stage 2: 3 agents (Structure)
- Stage 2.5: 2 agents (Meta & Enhancement)
- Stage 3: 0 agents (Cross-Cutting - reserved)
- Stage 4: 1 agent (Aggregation)

---

## Stage Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Pre-Flight: Validate skills, create dirs, run baselines    │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │  Stage 1: Foundation      │
        │  ┌──────────────────────┐ │
        │  │ audit-code          │ │  Parallel (4 agents)
        │  │ audit-security      │ │  Time: ~25 min
        │  │ audit-performance   │ │
        │  │ audit-refactoring   │ │
        │  └──────────────────────┘ │
        │  Checkpoint: 4 reports    │
        │  S0/S1 Escalation Check   │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴────────────────┐
        │  Stage 2: Structure          │
        │  ┌────────────────────────┐  │
        │  │ audit-documentation   │  │  Parallel (3 agents)
        │  │ audit-process         │  │  Time: ~20 min
        │  │ audit-engineering-    │  │
        │  │   productivity        │  │
        │  └────────────────────────┘  │
        │  Checkpoint: 3 reports       │
        └─────────────┬────────────────┘
                      │
        ┌─────────────┴────────────────┐
        │  Stage 2.5: Meta & Enhancement│
        │  ┌────────────────────────┐  │
        │  │ audit-enhancements    │  │  Parallel (2 agents)
        │  │ audit-ai-optimization │  │  Time: ~15 min
        │  └────────────────────────┘  │
        │  Checkpoint: 2 reports       │
        └─────────────┬────────────────┘
                      │
        ┌─────────────┴────────────────┐
        │  Stage 3: Cross-Cutting      │
        │  (Reserved for future)       │  Sequential (0 agents)
        │  Currently skipped           │  Time: ~0 min
        └─────────────┬────────────────┘
                      │
        ┌─────────────┴────────────────┐
        │  Stage 4: Aggregation        │
        │  ┌────────────────────────┐  │
        │  │ audit-aggregator      │  │  Sequential (1 agent)
        │  │ -> COMPREHENSIVE_     │  │  Time: ~5 min
        │  │    AUDIT_REPORT.md    │  │
        │  └────────────────────────┘  │
        │  Checkpoint: final report    │
        └─────────────┬────────────────┘
                      │
        ┌─────────────┴────────────────┐
        │  Post-Audit Actions          │
        │  - Update AUDIT_TRACKER.md   │
        │  - Reset triggers            │
        │  - Display summary           │
        └──────────────────────────────┘
```

---

## Stage 1: Foundation

**Purpose:** Core technical audits that form the foundation for all subsequent
analysis.

**Domains:** 4 audits running in parallel

1. `audit-code` - Code quality, types, framework patterns
2. `audit-security` - Auth, input validation, OWASP compliance
3. `audit-performance` - Load times, queries, caching
4. `audit-refactoring` - Technical debt, complexity, DRY violations

**Dependencies:** None (independent audits)

**Estimated time:** 25 minutes

### Agent Launch Commands

```javascript
// Set up environment variables (validate before launch!)
const AUDIT_DATE = "2026-02-16"; // Use actual date
const AUDIT_DIR = `docs/audits/comprehensive/audit-${AUDIT_DATE}`;

// Verify AUDIT_DIR is safe and exists
if (!AUDIT_DIR || AUDIT_DIR === "/" || AUDIT_DIR.startsWith("..")) {
  throw new Error("Invalid AUDIT_DIR");
}

// Launch 4 agents in parallel
const stage1Agents = [
  {
    skill: "audit-code",
    outputPath: `${AUDIT_DIR}/code-audit.md`,
  },
  {
    skill: "audit-security",
    outputPath: `${AUDIT_DIR}/security-audit.md`,
  },
  {
    skill: "audit-performance",
    outputPath: `${AUDIT_DIR}/performance-audit.md`,
  },
  {
    skill: "audit-refactoring",
    outputPath: `${AUDIT_DIR}/refactoring-audit.md`,
  },
];

// Spawn agents with Task tool
for (const agent of stage1Agents) {
  await Task({
    task: `Run ${agent.skill} and save report to ${agent.outputPath}`,
    context: {
      audit_date: AUDIT_DATE,
      output_dir: AUDIT_DIR,
      baseline_results: baselineResults, // from pre-flight
    },
  });
}
```

### Expected Outputs

Each audit produces a markdown report at:

- `${AUDIT_DIR}/code-audit.md`
- `${AUDIT_DIR}/security-audit.md`
- `${AUDIT_DIR}/performance-audit.md`
- `${AUDIT_DIR}/refactoring-audit.md`

**Report format:** Each report contains:

- Executive summary (severity breakdown)
- Top findings table (ID, severity, effort, location, description)
- Detailed findings sections
- Baseline metrics snapshot

### Checkpoint: Stage 1 Complete

**Verification script:**

```bash
AUDIT_DIR="docs/audits/comprehensive/audit-2026-02-16"

# Check all 4 reports exist and are non-empty
for report in code-audit security-audit performance-audit refactoring-audit; do
  if [ ! -f "${AUDIT_DIR}/${report}.md" ]; then
    echo "MISSING: ${report}.md"
    exit 1
  fi

  if [ ! -s "${AUDIT_DIR}/${report}.md" ]; then
    echo "EMPTY: ${report}.md"
    exit 1
  fi
done

echo "Stage 1 checkpoint PASSED: 4 reports verified"
```

### S0/S1 Escalation Check

**CRITICAL:** Before proceeding to Stage 2, check security audit for S0/S1
findings.

```bash
# Extract S0/S1 findings from security audit
grep -E "^\|.*\| S[01] \|" "${AUDIT_DIR}/security-audit.md" | wc -l
```

**If S0/S1 findings exist:**

1. Display findings immediately
2. Ask user if they want to:
   - **ABORT** - Stop audit and address critical issues now
   - **CONTINUE** - Note findings but complete audit first
   - **DEFER** - Mark for review, continue audit

**Decision tracking:** Log decision in `${AUDIT_DIR}/escalation-decisions.txt`

---

## Stage 2: Structure

**Purpose:** Documentation, process, and developer experience audits that depend
on understanding the codebase structure.

**Domains:** 3 audits running in parallel

1. `audit-documentation` - README, API docs, architecture docs
2. `audit-process` - CI/CD, testing, workflows, automation
3. `audit-engineering-productivity` - DX, debugging tools, offline support

**Dependencies:**

- Engineering productivity audit uses findings from Stage 1 (code quality,
  security, performance) to identify DX pain points

**Estimated time:** 20 minutes

### Agent Launch Commands

```javascript
// Stage 2 agents
const stage2Agents = [
  {
    skill: "audit-documentation",
    outputPath: `${AUDIT_DIR}/documentation-audit.md`,
  },
  {
    skill: "audit-process",
    outputPath: `${AUDIT_DIR}/process-audit.md`,
  },
  {
    skill: "audit-engineering-productivity",
    outputPath: `${AUDIT_DIR}/engineering-productivity-audit.md`,
    context: {
      // Pass Stage 1 reports for cross-domain analysis
      stage1Reports: [
        `${AUDIT_DIR}/code-audit.md`,
        `${AUDIT_DIR}/security-audit.md`,
        `${AUDIT_DIR}/performance-audit.md`,
      ],
    },
  },
];

// Spawn agents
for (const agent of stage2Agents) {
  await Task({
    task: `Run ${agent.skill} and save report to ${agent.outputPath}`,
    context: {
      audit_date: AUDIT_DATE,
      output_dir: AUDIT_DIR,
      ...agent.context,
    },
  });
}
```

### Expected Outputs

- `${AUDIT_DIR}/documentation-audit.md`
- `${AUDIT_DIR}/process-audit.md`
- `${AUDIT_DIR}/engineering-productivity-audit.md`

### Checkpoint: Stage 2 Complete

```bash
# Verify 3 reports
for report in documentation-audit process-audit engineering-productivity-audit; do
  if [ ! -f "${AUDIT_DIR}/${report}.md" ]; then
    echo "MISSING: ${report}.md"
    exit 1
  fi

  if [ ! -s "${AUDIT_DIR}/${report}.md" ]; then
    echo "EMPTY: ${report}.md"
    exit 1
  fi
done

echo "Stage 2 checkpoint PASSED: 3 reports verified"
```

---

## Stage 2.5: Meta & Enhancement

**Purpose:** Enhancements and AI optimization audits that analyze the system
holistically.

**Domains:** 2 audits running in parallel

1. `audit-enhancements` - Feature gaps, UX improvements, accessibility
2. `audit-ai-optimization` - Token waste, skill overlap, hook latency

**Dependencies:**

- Both audits benefit from seeing Stage 1 and 2 findings to identify enhancement
  opportunities and AI optimization targets

**Estimated time:** 15 minutes

### Agent Launch Commands

```javascript
// Stage 2.5 agents
const stage25Agents = [
  {
    skill: "audit-enhancements",
    outputPath: `${AUDIT_DIR}/enhancements-audit.md`,
    context: {
      priorReports: [
        `${AUDIT_DIR}/code-audit.md`,
        `${AUDIT_DIR}/documentation-audit.md`,
        `${AUDIT_DIR}/process-audit.md`,
      ],
    },
  },
  {
    skill: "audit-ai-optimization",
    outputPath: `${AUDIT_DIR}/ai-optimization-audit.md`,
    context: {
      skillReports: [
        `${AUDIT_DIR}/code-audit.md`,
        `${AUDIT_DIR}/engineering-productivity-audit.md`,
      ],
    },
  },
];

// Spawn agents
for (const agent of stage25Agents) {
  await Task({
    task: `Run ${agent.skill} and save report to ${agent.outputPath}`,
    context: {
      audit_date: AUDIT_DATE,
      output_dir: AUDIT_DIR,
      ...agent.context,
    },
  });
}
```

### Expected Outputs

- `${AUDIT_DIR}/enhancements-audit.md`
- `${AUDIT_DIR}/ai-optimization-audit.md`

### Checkpoint: Stage 2.5 Complete

```bash
# Verify 2 reports
for report in enhancements-audit ai-optimization-audit; do
  if [ ! -f "${AUDIT_DIR}/${report}.md" ]; then
    echo "MISSING: ${report}.md"
    exit 1
  fi

  if [ ! -s "${AUDIT_DIR}/${report}.md" ]; then
    echo "EMPTY: ${report}.md"
    exit 1
  fi
done

echo "Stage 2.5 checkpoint PASSED: 2 reports verified"
```

---

## Stage 3: Cross-Cutting

**Purpose:** Reserved for future cross-cutting analysis that requires insights
from all prior stages.

**Domains:** Currently none (reserved)

**Dependencies:** All of Stage 1, 2, and 2.5

**Estimated time:** 0 minutes (stage currently skipped)

### Future Use Cases

When implemented, Stage 3 might include:

- **Architectural integrity** - Cross-file dependency analysis
- **Compliance aggregation** - SOC2, GDPR, WCAG across all domains
- **Risk assessment** - Combined security + performance + process risks

### Checkpoint: Stage 3 Complete

```bash
# Currently a no-op
echo "Stage 3 checkpoint PASSED: no audits in this stage"
```

---

## Stage 4: Aggregation

**Purpose:** Combine all 9 audit reports into a single comprehensive report with
deduplication, cross-domain insights, and priority ranking.

**Domains:** 1 aggregator

1. `audit-aggregator` - Deduplication, ranking, cross-domain analysis

**Dependencies:** All prior stages (1, 2, 2.5)

**Estimated time:** 5 minutes

### Agent Launch Command

```javascript
// Stage 4: aggregation
const stage4Agent = {
  skill: "audit-aggregator",
  outputPath: `${AUDIT_DIR}/COMPREHENSIVE_AUDIT_REPORT.md`,
  inputs: [
    `${AUDIT_DIR}/code-audit.md`,
    `${AUDIT_DIR}/security-audit.md`,
    `${AUDIT_DIR}/performance-audit.md`,
    `${AUDIT_DIR}/refactoring-audit.md`,
    `${AUDIT_DIR}/documentation-audit.md`,
    `${AUDIT_DIR}/process-audit.md`,
    `${AUDIT_DIR}/engineering-productivity-audit.md`,
    `${AUDIT_DIR}/enhancements-audit.md`,
    `${AUDIT_DIR}/ai-optimization-audit.md`,
  ],
};

await Task({
  task: `Run ${stage4Agent.skill} to aggregate all reports into ${stage4Agent.outputPath}`,
  context: {
    audit_date: AUDIT_DATE,
    output_dir: AUDIT_DIR,
    input_reports: stage4Agent.inputs,
    false_positives_db: "docs/technical-debt/FALSE_POSITIVES.jsonl",
  },
});
```

### Expected Output

Single file: `${AUDIT_DIR}/COMPREHENSIVE_AUDIT_REPORT.md`

**Report structure:**

1. **Executive Summary**
   - Total unique findings (after deduplication)
   - Severity breakdown (S0, S1, S2, S3 counts)
   - Top 3 cross-domain insights
   - Recommended fix order
   - Total effort estimate

2. **Priority-Ranked Findings (Top 20)**
   - Table with rank, ID, severity, domains, location, description, effort

3. **Cross-Domain Insights**
   - Files appearing in 4+ audits
   - Security + Performance overlaps
   - Documentation gaps aligned with complexity

4. **Full Findings (Deduplicated)**
   - Complete table grouped by severity
   - Links to original audit reports

5. **Appendix**
   - Links to individual reports
   - Baseline metrics
   - False positives excluded count

### Checkpoint: Stage 4 Complete

```bash
# Verify final report exists and has all sections
if [ ! -f "${AUDIT_DIR}/COMPREHENSIVE_AUDIT_REPORT.md" ]; then
  echo "MISSING: COMPREHENSIVE_AUDIT_REPORT.md"
  exit 1
fi

# Check for required sections
for section in "Executive Summary" "Priority-Ranked Findings" "Cross-Domain Insights" "Full Findings" "Appendix"; do
  if ! grep -q "${section}" "${AUDIT_DIR}/COMPREHENSIVE_AUDIT_REPORT.md"; then
    echo "MISSING SECTION: ${section}"
    exit 1
  fi
done

echo "Stage 4 checkpoint PASSED: comprehensive report verified"
```

---

## Checkpoint Verification

### Checkpoint State Files

After each stage completes, write a state file to track progress:

```bash
# After Stage 1
echo "STAGE_1_COMPLETE=$(date -Iseconds)" > "${AUDIT_DIR}/.checkpoint-stage1"

# After Stage 2
echo "STAGE_2_COMPLETE=$(date -Iseconds)" > "${AUDIT_DIR}/.checkpoint-stage2"

# After Stage 2.5
echo "STAGE_2_5_COMPLETE=$(date -Iseconds)" > "${AUDIT_DIR}/.checkpoint-stage2.5"

# After Stage 4
echo "STAGE_4_COMPLETE=$(date -Iseconds)" > "${AUDIT_DIR}/.checkpoint-stage4"
```

### Recovery Check

To resume after context compaction:

```bash
# Check which stages are complete
if [ -f "${AUDIT_DIR}/.checkpoint-stage4" ]; then
  echo "Audit already complete"
  exit 0
fi

if [ -f "${AUDIT_DIR}/.checkpoint-stage2.5" ]; then
  echo "Resume from: Stage 4 (Aggregation)"
fi

if [ -f "${AUDIT_DIR}/.checkpoint-stage2" ]; then
  echo "Resume from: Stage 2.5 (Meta & Enhancement)"
fi

if [ -f "${AUDIT_DIR}/.checkpoint-stage1" ]; then
  echo "Resume from: Stage 2 (Structure)"
fi

# No checkpoints found
echo "Resume from: Stage 1 (Foundation)"
```

---

## Status Display Templates

### During Execution

```
COMPREHENSIVE AUDIT IN PROGRESS
================================

Stage 1: Foundation [RUNNING] (4/4 agents active)
  [~] audit-code             → code-audit.md
  [~] audit-security         → security-audit.md
  [~] audit-performance      → performance-audit.md
  [~] audit-refactoring      → refactoring-audit.md

Stage 2: Structure [WAITING]
Stage 2.5: Meta & Enhancement [WAITING]
Stage 4: Aggregation [WAITING]

Estimated time remaining: 60 minutes
```

### After Stage Completion

```
COMPREHENSIVE AUDIT IN PROGRESS
================================

Stage 1: Foundation [COMPLETE]
  [✓] audit-code             → code-audit.md (45 findings)
  [✓] audit-security         → security-audit.md (23 findings, 2 S1)
  [✓] audit-performance      → performance-audit.md (31 findings)
  [✓] audit-refactoring      → refactoring-audit.md (52 findings)

  WARNING: 2 S1 security findings detected
      → Review before continuing? [ABORT/CONTINUE/DEFER]

Stage 2: Structure [WAITING]
Stage 2.5: Meta & Enhancement [WAITING]
Stage 4: Aggregation [WAITING]

Estimated time remaining: 40 minutes
```

### Final Summary

```
COMPREHENSIVE AUDIT COMPLETE
============================

Stage 1: Foundation [COMPLETE] (4 reports, 151 findings)
Stage 2: Structure [COMPLETE] (3 reports, 87 findings)
Stage 2.5: Meta & Enhancement [COMPLETE] (2 reports, 34 findings)
Stage 4: Aggregation [COMPLETE]

Total Execution Time: 67 minutes
Raw Findings: 272
Unique Findings (after dedup): 184

Severity Breakdown:
  S0 Critical: 0
  S1 High: 7
  S2 Medium: 89
  S3 Low: 88

Next Steps:
  1. Review comprehensive report
  2. Triage findings into TDMS
  3. Update AUDIT_TRACKER.md
  4. Reset audit triggers
```

---

## Error Handling

### Agent Failure During Stage

**Symptom:** One or more agents in a stage fail to produce output.

**Recovery:**

```bash
# Identify failed reports
AUDIT_DIR="docs/audits/comprehensive/audit-2026-02-16"
FAILED_REPORTS=""

for report in code security performance refactoring; do
  if [ ! -s "${AUDIT_DIR}/${report}-audit.md" ]; then
    FAILED_REPORTS="${FAILED_REPORTS} ${report}"
  fi
done

if [ -n "${FAILED_REPORTS}" ]; then
  echo "Failed reports:${FAILED_REPORTS}"
  echo "Re-run only failed audits: /audit-code, /audit-security, etc."
fi
```

**Options:**

1. **Re-run individual audit** - Use `/audit-<domain>` to re-run just the failed
   audit
2. **Continue without** - If non-critical (e.g., enhancements), continue to
   aggregation
3. **Abort and retry** - If critical (e.g., security), abort and restart stage

### Context Compaction Mid-Stage

**Symptom:** Agent context compacted while stage is running.

**Recovery:** See [RECOVERY_PROCEDURES.md](RECOVERY_PROCEDURES.md) for detailed
recovery matrix.

**Quick guide:**

1. Check for checkpoint files (`.checkpoint-stageN`)
2. Resume from last completed stage
3. Re-validate AUDIT_DIR before launching agents

### Variable Loss (AUDIT_DIR empty)

**Symptom:** AUDIT_DIR variable is empty or invalid after compaction.

**Prevention:**

```bash
# Always validate before agent launch
AUDIT_DATE=$(date +%Y-%m-%d)
AUDIT_DIR="docs/audits/comprehensive/audit-${AUDIT_DATE}"

if [ -z "${AUDIT_DIR}" ] || [ "${AUDIT_DIR}" = "/" ] || [[ "${AUDIT_DIR}" == ".."* ]]; then
  echo "FATAL: Invalid AUDIT_DIR"
  exit 1
fi

# Store in state file for recovery
echo "AUDIT_DIR=${AUDIT_DIR}" > .claude/state/audit-session.env
```

**Recovery:**

```bash
# Restore from state file
source .claude/state/audit-session.env
echo "Recovered AUDIT_DIR: ${AUDIT_DIR}"
```

---

## Notes

- **Parallel execution** - Stages 1, 2, and 2.5 run multiple agents in parallel
  to minimize total time
- **Sequential aggregation** - Stage 4 must run sequentially after all prior
  stages
- **Checkpoint files** - Hidden `.checkpoint-stageN` files enable recovery after
  interruption
- **S0/S1 escalation** - Critical security findings are surfaced immediately
  after Stage 1
- **Cross-domain context** - Later stages receive prior stage reports for
  cross-domain analysis
- **Time estimates** - Based on typical codebase (5000-10000 LOC); adjust for
  larger codebases

---

**End of Wave Details**
