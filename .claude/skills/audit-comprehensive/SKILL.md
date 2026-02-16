---
name: audit-comprehensive
description: Run all 9 domain audits in staged waves and aggregate results
supports_parallel: true
fallback_available: true
estimated_time_parallel: 65 min
estimated_time_sequential: 180 min
---

# Comprehensive Multi-Domain Audit Orchestrator

**Version:** 3.1 (9-Domain Coverage with Stage 2.5) **Time Savings:** 65% faster
than sequential (250min -> 65min) **Stages:** 4 stages with 4+3+2+1 agent
configuration

**What This Does:** Spawns 9 specialized audit agents in staged waves
(respecting max 4 concurrent limit), with verification checkpoints and S0/S1
escalation, then aggregates findings into a comprehensive report.

---

## Overview

This skill orchestrates a complete codebase audit across all 9 domains:

1. **Code Quality** (`audit-code`) - Code hygiene, types, framework patterns
2. **Security** (`audit-security`) - Auth, input validation, OWASP compliance
3. **Performance** (`audit-performance`) - Load times, queries, caching
4. **Documentation** (`audit-documentation`) - README, API docs, architecture
5. **Refactoring** (`audit-refactoring`) - Technical debt, complexity, DRY
6. **Process/Automation** (`audit-process`) - CI/CD, testing, workflows
7. **Engineering Productivity** (`audit-engineering-productivity`) - DX,
   debugging, offline support
8. **Enhancements** (`audit-enhancements`) - Feature gaps, UX improvements
9. **AI Optimization** (`audit-ai-optimization`) - Token waste, skill overlap,
   hook latency

**Output:** Single unified report in
`docs/audits/comprehensive/audit-YYYY-MM-DD/COMPREHENSIVE_AUDIT_REPORT.md`

---

## Orchestration Mode Selection

This skill supports two orchestration modes. Check which is available:

### Agent Teams Mode (Preferred when available)

**Requires:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in
`.claude/settings.json`

When agent teams are enabled, use team-based orchestration:

- **Lead:** Orchestrator + aggregator (you)
- **Teammate Group A:** code + refactoring specialists
- **Teammate Group B:** security + performance specialists
- **Teammate Group C:** documentation + process + engineering-productivity
- **Teammate Group D:** enhancements + ai-optimization specialists

**Team advantages:** Cross-cutting findings via messages, S0/S1 escalation as
team messages, lead handles aggregation directly, no artificial stage
boundaries.

**Team execution flow:**

1. Lead creates shared task list with all 9 audit tasks
2. Spawn 4 teammates (grouped by related domains)
3. Teammates claim and execute audit tasks, messaging lead on S0/S1 findings
4. Teammates message peers when they find cross-cutting issues
5. Lead monitors progress, collects results as teammates complete
6. Lead performs aggregation and deduplication directly
7. Lead shuts down teammates after all reports collected

**Token budget:** 250K total for the team. If approaching budget, lead messages
teammates to wrap up and collects partial results.

**Fallback:** If team formation fails or teammates error out, fall back to the
staged subagent execution flow below.

### Subagent Mode (Default fallback)

When agent teams are NOT enabled, use the 3-stage subagent execution flow below.

---

## Execution Flow (Subagent Mode)

```
Pre-Flight Validation
  - Verify all 9 audit skills exist
  - Create output directory
  - Gather baselines (tests, lint, patterns)
  - Load false positives database
        |
        v
Stage 1: Technical Core (4 agents parallel)
  - audit-code, audit-security, audit-performance, audit-refactoring
  - Checkpoint: verify 4 reports + S0/S1 escalation check
        |
        v
Stage 2: Supporting (3 agents parallel)
  - audit-documentation, audit-process, audit-engineering-productivity
  - Checkpoint: verify 3 reports
        |
        v
Stage 2.5: Meta & Enhancement (2 agents parallel)
  - audit-enhancements, audit-ai-optimization
  - Checkpoint: verify 2 reports
        |
        v
Stage 3: Aggregation (sequential)
  - audit-aggregator -> COMPREHENSIVE_AUDIT_REPORT.md
        |
        v
Post-Audit
  - Update AUDIT_TRACKER.md
  - Display final summary
  - Recommend next steps
```

> **Details:** See [reference/WAVE_DETAILS.md](reference/WAVE_DETAILS.md) for
> full agent launch instructions, checkpoint scripts, and status display
> templates.

---

## Pre-Flight Validation

**Step 0: Episodic Memory Search (Session #128)**

Before running audits, search for context from past audit sessions:

```javascript
mcp__plugin_episodic -
  memory_episodic -
  memory__search({
    query: ["comprehensive audit", "findings", "patterns"],
    limit: 5,
  });
```

**Why:** Compare against previous findings, identify recurring issues, avoid
known false positives, track trends.

**Step 1: Verify Skills Exist**

```bash
ls -1 .claude/skills/audit-*/SKILL.md | wc -l
# Should return 9 (excludes audit-comprehensive and audit-aggregator)
```

If not all present, notify user which audits are missing.

**Step 2: Create Output Directory**

```bash
AUDIT_DATE=$(date +%Y-%m-%d)
mkdir -p docs/audits/comprehensive/audit-${AUDIT_DATE}
```

**Step 2.5: Verify Output Directory (CRITICAL)**

```bash
AUDIT_DATE=$(date +%Y-%m-%d)
AUDIT_DIR="docs/audits/comprehensive/audit-${AUDIT_DATE}"
AUDIT_PATH=$(realpath "${AUDIT_DIR}" 2>/dev/null || echo "${AUDIT_DIR}")
if [ -z "${AUDIT_DIR}" ] || [ "${AUDIT_PATH}" = "/" ] || [[ "${AUDIT_DIR}" == ".."* ]]; then
  echo "FATAL: Invalid or unsafe AUDIT_DIR"
  exit 1
fi
```

**Why:** Context compaction can cause variable loss. Always verify before agent
launches.

**Step 3: Run Baseline Checks**

```bash
npm test 2>&1 | grep -E "Tests:|passing|failed" | head -5
npm run lint 2>&1 | tail -10
npm run patterns:check 2>&1 | head -20
```

Store results in `docs/audits/comprehensive/audit-YYYY-MM-DD/baseline.txt` for
reference.

**Step 4: Load False Positives**

Read `docs/technical-debt/FALSE_POSITIVES.jsonl` to pass to aggregator.

---

## Final Report Structure

The `COMPREHENSIVE_AUDIT_REPORT.md` should contain:

### Executive Summary

- Total unique findings (after deduplication)
- Severity breakdown (S0: X, S1: Y, S2: Z, S3: W)
- Top 3 cross-domain insights
- Recommended fix order
- Effort estimate (total hours)

### Priority-Ranked Findings (Top 20)

Table format:

| Rank | ID       | Severity | Domains | File:Line  | Description        | Effort |
| ---- | -------- | -------: | ------: | ---------- | ------------------ | -----: |
| 1    | COMP-001 |       S0 |       3 | auth.ts:45 | Missing auth check |     E1 |

### Cross-Domain Insights

- Files appearing in 4+ audits needing comprehensive refactor
- Security + Performance overlaps
- Documentation gaps aligned with code complexity hotspots

### Full Findings (Deduplicated)

Complete table grouped by severity, with links to original audit reports.

### Appendix

- Links to individual audit reports
- Baseline metrics snapshot
- False positives excluded (count)

---

## Interactive Review (MANDATORY -- before TDMS intake)

**Do NOT ingest findings into TDMS until the user has reviewed them.**

### Presentation Format

Present findings in **batches of 3-5 items**, grouped by severity (S0 first).
Each item shows:

```markdown
### DEBT-XXXX: [Title]

**Severity:** S* | **Effort:** E* | **Confidence:** \_% **Current:** [What
exists now] **Suggested Fix:** [Concrete remediation] **Acceptance Tests:** [How
to verify] **Counter-argument:** [Why NOT to do this] **Recommendation:**
ACCEPT/DECLINE/DEFER -- [Reasoning]
```

Wait for user decisions on each batch before presenting the next.

### Decision Tracking (Compaction-Safe)

Create `${AUDIT_DIR}/REVIEW_DECISIONS.md` after the first batch. Update after
each batch. This file survives context compaction.

### Processing Decisions

- DECLINED: remove from findings before TDMS intake
- DEFERRED: keep in TDMS as NEW status for future planning
- ACCEPTED: proceed to TDMS intake

---

## Post-Audit (MANDATORY)

### 1. Update AUDIT_TRACKER.md

Add an entry to **each of the 9 category tables** in
`docs/audits/AUDIT_TRACKER.md`:

| Date    | Session       | Commits Covered | Files Covered | Findings                     | Reset Threshold |
| ------- | ------------- | --------------- | ------------- | ---------------------------- | --------------- |
| {TODAY} | Comprehensive | Full codebase   | All           | Session #{N} - [report link] | all             |

### 2. Reset Audit Triggers (Automated)

```bash
node scripts/reset-audit-triggers.js --type=comprehensive --apply
```

Verify with `npm run review:check` (should show no triggers).

---

## Triage & Roadmap Integration (MANDATORY)

After TDMS intake, triage new items into the roadmap with priority scoring and
track assignment.

> **Details:** See [reference/TRIAGE_GUIDE.md](reference/TRIAGE_GUIDE.md) for
> priority scoring formula, track assignment matrix, and consistency checks.

---

## Context Recovery

If context compacts mid-audit, resume from last completed checkpoint.

> **Details:** See
> [reference/RECOVERY_PROCEDURES.md](reference/RECOVERY_PROCEDURES.md) for
> recovery matrix, resume commands, and error handling procedures.

---

## Completion

**Display Final Summary:**

```
COMPREHENSIVE AUDIT COMPLETE

Results Summary:
   142 raw findings -> 97 unique (45 merged)
   S0 Critical: 3
   S1 High: 24
   S2 Medium: 42
   S3 Low: 28

Cross-Domain Insights:
   8 files need comprehensive refactor (4+ audits)
   12 security/performance overlaps
   5 documentation gaps in complex areas

Full Report:
   docs/audits/comprehensive/audit-YYYY-MM-DD/COMPREHENSIVE_AUDIT_REPORT.md

Recommended Next Steps:
   1. Review top 20 priority findings
   2. Create GitHub issues for S0/S1
   3. Plan refactor for hotspot files
```

---

## Usage Examples

**Quarterly Health Check / Pre-Release / After Major Refactor:**

```
/audit-comprehensive
```

**Focused Audit (Not Comprehensive):**

Use individual skills instead:

```
/audit-security   (25 min - when you only need security review)
/audit-code       (30 min - when you only need code quality)
```

---

## Notes

- **Staged Execution:** 4 stages (4+3+2+1 agents) respects CLAUDE.md max 4
  concurrent limit
- **Time Estimate:** ~65 minutes (vs 250min sequential = 65% savings)
- **S0/S1 Escalation:** Security findings checked after Stage 1 before
  proceeding
- **Checkpoints:** Each stage verifies outputs exist and are non-empty
- **Context Recovery:** Can resume from any checkpoint after context compaction
- **Output Consistency:** All audits use same severity (S0-S3) and effort
  (E0-E3) scales

---

## Future Enhancements

- [ ] **Incremental Audits:** Only re-run audits for changed domains
- [ ] **Custom Audit Subset:** `--audits code,security` to run subset
- [ ] **Confidence Scoring:** Weight findings by audit confidence levels
- [ ] **Trend Analysis:** Compare against previous comprehensive audits
- [ ] **Auto-Issue Creation:** Create GitHub issues for S0/S1 findings
      automatically

---

## Related Skills

- `/audit-code` - Individual code quality audit
- `/audit-security` - Individual security audit
- `/audit-performance` - Individual performance audit
- `/audit-documentation` - Individual documentation audit
- `/audit-refactoring` - Individual refactoring audit
- `/audit-process` - Individual process/automation audit
- `/audit-enhancements` - Individual enhancements audit
- `/audit-ai-optimization` - Individual AI optimization audit
- `/audit-aggregator` - Standalone aggregation (if you have existing reports)
- `/create-audit` - Wizard to scaffold new audit types

---

## Documentation References

Before running this audit, review:

### TDMS Integration (Required)

- [PROCEDURE.md](../../../docs/technical-debt/PROCEDURE.md) - Full TDMS workflow
- [MASTER_DEBT.jsonl](../../../docs/technical-debt/MASTER_DEBT.jsonl) -
  Canonical debt store

### Documentation Standards (Required)

- [JSONL_SCHEMA_STANDARD.md](../../../docs/templates/JSONL_SCHEMA_STANDARD.md) -
  Output format requirements and TDMS field mapping
- [DOCUMENTATION_STANDARDS.md](../../../docs/DOCUMENTATION_STANDARDS.md) -
  5-tier doc hierarchy

---

## Version History

| Version | Date       | Description                                                               |
| ------- | ---------- | ------------------------------------------------------------------------- |
| 3.1     | 2026-02-14 | Extract reference docs: wave details, recovery, triage guide              |
| 3.0     | 2026-02-14 | 9-domain coverage: add enhancements + ai-optimization as Stage 2.5        |
| 2.1     | 2026-02-03 | Added Triage & Roadmap Integration section with priority scoring formula  |
| 2.0     | 2026-02-02 | Staged execution (4+2+1), S0/S1 escalation, checkpoints, context recovery |
| 1.0     | 2026-01-28 | Initial version - flat parallel execution of all 6 audits                 |
