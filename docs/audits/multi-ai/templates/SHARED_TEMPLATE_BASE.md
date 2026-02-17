# Multi-AI Audit Shared Template Base

**Document Version:** 1.0 **Created:** 2026-02-07 **Last Updated:** 2026-02-07
**Status:** ACTIVE **Tier:** 4 (Reference) **Purpose:** Shared boilerplate for
all multi-AI audit templates

---

## Purpose

This document centralizes the shared sections used across all 9 multi-AI audit
templates. Each category template (`CODE_REVIEW_AUDIT.md`, `SECURITY_AUDIT.md`,
etc.) references this file for common elements, keeping domain-specific content
in their own files while avoiding ~60-70% content duplication.

**When creating a new audit template:** Copy the relevant sections from this
file and customize the domain-specific parts (marked with `[DOMAIN-SPECIFIC]`
placeholders).

---

## Multi-Agent Capability Note

> **Multi-Agent Capability Note:** This template assumes orchestration by Claude
> Code which can spawn parallel agents via the Task tool. Other AI systems
> (ChatGPT, Gemini, etc.) cannot call multiple agents and should execute
> sections sequentially or use external orchestration.

---

## AI Models to Use

**Recommended configuration (4-6 models for consensus):**

| Model             | Capabilities                           | Notes                                       |
| ----------------- | -------------------------------------- | ------------------------------------------- |
| Claude Opus 4.6   | browse_files=yes, run_commands=yes     | Comprehensive analysis, pattern recognition |
| Claude Sonnet 4.5 | browse_files=yes, run_commands=yes     | Cost-effective analysis                     |
| GPT-5-Codex       | browse_files=yes, run_commands=yes     | Comprehensive code analysis                 |
| Gemini 3 Pro      | browse_files=yes, run_commands=yes     | Alternative perspective, fresh insights     |
| GitHub Copilot    | browse_files=yes, run_commands=limited | Quick pattern detection                     |
| ChatGPT-4o        | browse_files=no, run_commands=no       | Broad knowledge, alternative viewpoint      |

**Selection criteria:**

- At least 2 models with `run_commands=yes` for grep/lint verification
- At least 1 model with strong domain knowledge for the audit type
- Total 4-6 models for good consensus

---

## Severity Scale (Universal)

| Level  | Name     | Definition                                      | Action                  |
| ------ | -------- | ----------------------------------------------- | ----------------------- |
| **S0** | Critical | Security breach, data loss, production breaking | Fix immediately         |
| **S1** | High     | Likely bugs, significant risk, major tech debt  | Fix within sprint       |
| **S2** | Medium   | Maintainability drag, inconsistency, friction   | Schedule fix            |
| **S3** | Low      | Polish, cosmetic, minor improvements            | Batch with related work |

---

## Effort Scale (Universal)

| Level  | Name    | Definition                  |
| ------ | ------- | --------------------------- |
| **E0** | Minutes | Quick fix, trivial change   |
| **E1** | Hours   | Single-session work         |
| **E2** | Days    | 1-3 days or staged PR       |
| **E3** | Weeks   | Multi-PR, multi-week effort |

---

## Canonical JSONL Schema

All audit findings MUST use this base schema (from
[JSONL_SCHEMA_STANDARD.md](../../templates/JSONL_SCHEMA_STANDARD.md)):

```json
{
  "category": "<domain-level value>",
  "title": "short, specific description",
  "fingerprint": "<domain>::<file_or_scope>::<issue_slug>",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": 0-100,
  "files": ["path/to/file.ts"],
  "why_it_matters": "1-3 sentence impact explanation",
  "suggested_fix": "concrete remediation direction",
  "acceptance_tests": ["verification step 1", "step 2"],
  "evidence": ["grep output", "code snippet"]
}
```

### Valid Domain Categories

| Audit Type               | `category` Value           |
| ------------------------ | -------------------------- |
| Code Review              | `code-quality`             |
| Security                 | `security`                 |
| Performance              | `performance`              |
| Refactoring              | `refactoring`              |
| Documentation            | `documentation`            |
| Process/Automation       | `process`                  |
| Engineering Productivity | `engineering-productivity` |
| AI Optimization          | `ai-optimization`          |
| Enhancement              | `enhancement`              |

**Sub-categories** (e.g., "Rate Limiting", "Bundle Size", "GoldenPath") belong
in the `fingerprint` and `title` fields only, NOT in `category`.

### Output Section Order

All audit outputs follow this order:

1. **FINDINGS_JSONL** - Confirmed findings (confidence > 40)
2. **SUSPECTED_FINDINGS_JSONL** - Suspected findings (confidence <= 40)
3. **HUMAN_SUMMARY** - Markdown summary with priorities

---

## Anti-Hallucination Rules

```
NON-NEGOTIABLE EVIDENCE RULE (ANTI-HALLUCINATION)

A finding is CONFIRMED only if it includes:

- at least one concrete file path AND
- at least one specific indicator (code snippet, metric, missing file)

If you cannot provide both, put it in SUSPECTED_FINDINGS with confidence <= 40.
```

---

## PRE-REVIEW CONTEXT Pattern

All templates include a PRE-REVIEW CONTEXT section that references
project-specific resources. This section MUST include the following note:

```
> NOTE: The references below require repository access. If your AI model cannot
> browse files or run commands, skip to the audit prompt section below.
```

**Standard PRE-REVIEW items** (customize per domain):

1. **AI Learnings** (claude.md Section 4): Critical anti-patterns
2. **Pattern History** (../AI_REVIEW_LEARNINGS_LOG.md): Documented patterns from
   past reviews
3. **Current Compliance** (`npm run patterns:check`): Known anti-pattern
   violations
4. **Dependency Health**: `npm run deps:circular`, `npm run deps:unused`
5. **Static Analysis**: SonarCloud integration via `npm run sonar:report`

---

## Quality Guardrails

All audit findings must meet these quality standards to ensure actionable,
grounded results:

### Minimum Confidence Threshold

**Threshold: 0.7 (70%)** — Findings below this threshold should be placed in the
"SUSPECTED_FINDINGS" or "Inconclusive" section rather than confirmed findings.

**Rationale:** Findings with confidence <70% often lack sufficient evidence or
involve speculation. Including low-confidence items dilutes the actionability of
the audit output.

### Evidence Requirements

Every confirmed finding MUST include:

- **Specific file paths** — Exact location(s) where the issue occurs
- **Line numbers** (where applicable) — Pinpoint the problematic code
- **Code snippets** — Direct quotes showing the issue (3-10 lines recommended)
- **Verification method** — How the finding was confirmed (grep output, tool
  run, manual inspection)

**Example of sufficient evidence:**

```
files: ["lib/auth/session.ts:45-52"]
evidence: [
  "No try/catch around Firebase auth call",
  "grep output: 'await signInWithEmailAndPassword' (no error handling)"
]
```

**Insufficient evidence:**

```
files: ["lib/auth/"]
evidence: ["Auth code needs improvement"]
```

### False Positive Awareness

Before reporting a finding, auditors MUST:

1. **Check the false positives registry** — Read
   `docs/technical-debt/FALSE_POSITIVES.jsonl` for patterns that have been
   previously reviewed and dismissed
2. **Verify context** — Ensure the "issue" isn't intentional design (e.g.,
   verbose logging in debug hooks, detailed SKILL.md files)
3. **Cross-reference** — Check if the file/pattern is referenced elsewhere
   before flagging as "dead code" or "unused"

**Common false positive patterns to avoid:**

- Flagging intentionally detailed AI instruction files as "bloated"
- Reporting scripts as "unused" without checking CI workflows, hooks, or other
  scripts
- Identifying "duplicate" code that has legitimate reasons for similarity
- Marking debug/development-only code as "production issues"

### Severity Calibration

Use the **SHARED_TEMPLATE_BASE.md severity scale** consistently:

| Level  | Name     | Definition                                      | Frequency Guideline        |
| ------ | -------- | ----------------------------------------------- | -------------------------- |
| **S0** | Critical | Security breach, data loss, production breaking | Should be RARE (1-5%)      |
| **S1** | High     | Likely bugs, significant risk, major tech debt  | Should be limited (10-20%) |
| **S2** | Medium   | Maintainability drag, inconsistency, friction   | Most findings (50-70%)     |
| **S3** | Low      | Polish, cosmetic, minor improvements            | Common (20-30%)            |

**S0 should be rare** — Reserve for findings that could cause:

- Data loss or corruption
- Security vulnerabilities exploitable in production
- Complete application failure or crash
- Regulatory compliance violations

If >10% of findings are S0, recalibrate severity assignments.

---

## TDMS Integration

### Automatic Intake

After aggregation, ingest findings to TDMS using the intake script:

```bash
# Standard intake command
node scripts/debt/intake-audit.js \
  docs/audits/single-session/[DOMAIN]/AUDIT_YYYY_QX.jsonl \
  --source "multi-ai-[DOMAIN]-audit" \
  --batch-id "[DOMAIN]-audit-YYYYMMDD"

# Example for code review audit
node scripts/debt/intake-audit.js \
  docs/audits/single-session/code/CODE_REVIEW_2026_Q1.jsonl \
  --source "multi-ai-code-review" \
  --batch-id "code-review-20260216"
```

### Intake Verification Steps

After running the intake command, verify successful ingestion:

1. **Check for errors** in the intake script output:

   ```bash
   # Look for "ERROR" or "WARN" messages in output
   # Expected: "Successfully ingested X findings"
   ```

2. **Verify DEBT IDs were assigned**:

   ```bash
   # Check that findings have DEBT-XXXX IDs
   grep "DEBT-" docs/technical-debt/MASTER_DEBT.jsonl | tail -10
   ```

3. **Regenerate views** to reflect new findings:

   ```bash
   node scripts/debt/generate-views.js
   ```

4. **Check the generated views** for the new items:

   ```bash
   # View by severity
   cat docs/technical-debt/views/by-severity/S0-critical.md

   # View by category
   cat docs/technical-debt/views/by-category/[DOMAIN].md
   ```

5. **Verify finding count** matches expectations:
   ```bash
   # Count new items from this batch
   grep "batch-id-[DOMAIN]-audit-YYYYMMDD" docs/technical-debt/MASTER_DEBT.jsonl | wc -l
   ```

### Required TDMS Fields

All findings must include these fields for TDMS compatibility:

| Audit Field      | TDMS Field    | Notes                            |
| ---------------- | ------------- | -------------------------------- |
| `category`       | `category`    | Domain-level value (see above)   |
| `severity`       | `severity`    | S0/S1/S2/S3 (unchanged)          |
| `files[0]`       | `file`        | Primary file path                |
| `line`           | `line`        | Line number (use 1 if file-wide) |
| `title`          | `title`       | Short description                |
| `why_it_matters` | `description` | Primary description field        |

### Completion Checklist

After TDMS intake:

- [ ] Findings ingested without errors
- [ ] DEBT-XXXX IDs assigned
- [ ] Views regenerated (`node scripts/debt/generate-views.js`)
- [ ] Audit History updated with TDMS Items count

---

## AI Instructions (General Workflow)

When using any audit template:

1. **Copy the template** to `docs/reviews/[AUDIT_TYPE]_[YYYY]_Q[X].md`
2. **Fill in Audit Context** with project-specific details
3. **Run the audit prompt** on each selected AI model
4. **Collect outputs** in the specified JSONL format
5. **Run aggregation** for consolidated findings
6. **Create canonical findings doc** with deduplicated results
7. **Ingest to TDMS** using `node scripts/debt/intake-audit.js`
8. **Prioritize and implement** based on severity and effort
9. **Update Audit History** in the template (include TDMS Items count)
10. **Update [COORDINATOR.md](../COORDINATOR.md)** with audit results

### Universal Quality Checks

- [ ] All domain categories assessed
- [ ] Severity ratings justified with evidence
- [ ] Remediation steps actionable
- [ ] TDMS intake completed without errors
- [ ] DEBT-XXXX IDs assigned to all findings

---

## Aggregation Process

### Step 1: Collect Outputs

For each AI model, save:

- `[model-name]_findings.jsonl`
- `[model-name]_suspected.jsonl`
- `[model-name]_summary.md`
- `[model-name]_metrics.json` (if applicable)

### Step 2: Run Aggregator

Use the aggregation prompt from [AGGREGATOR.md](./AGGREGATOR.md) with a capable
model. The aggregator:

- Deduplicates findings by fingerprint (primary) and evidence overlap
  (secondary)
- Escalates severity when 2+ models agree on a higher level
- Assigns `canonical_id` (CANON-XXXX format) to each unique finding
- Produces a consolidated improvement plan ordered by impact/effort ratio

### Step 3: Create Findings Document

Create `docs/reviews/[AUDIT_TYPE]_[YYYY]_Q[X].md` with all findings, priorities,
and implementation order.

---

## Related Documents (Common)

- **[JSONL_SCHEMA_STANDARD.md](../../templates/JSONL_SCHEMA_STANDARD.md)** -
  Canonical JSONL schema for all review templates
- **[CANON_QUICK_REFERENCE.md](../../templates/CANON_QUICK_REFERENCE.md)** -
  Quick reference for canonical schema
- **[docs/technical-debt/PROCEDURE.md](../../technical-debt/PROCEDURE.md)** -
  TDMS intake and tracking procedures
- **[COORDINATOR.md](../COORDINATOR.md)** - Master index and trigger tracking
- **[AGGREGATOR.md](./AGGREGATOR.md)** - Aggregation prompt and deduplication
  rules
- **[ARCHITECTURE.md](../../../ARCHITECTURE.md)** - System architecture
- **[DEVELOPMENT.md](../../../DEVELOPMENT.md)** - Development setup

---

## Version History

| Version | Date       | Changes                                                                                                                                                      | Author |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1.1     | 2026-02-16 | Added Quality Guardrails section, expanded TDMS Integration with verification steps, updated category count from 7 to 9 (added AI Optimization, Enhancement) | Claude |
| 1.0     | 2026-02-07 | Initial extraction from 7 audit templates (Phase 4)                                                                                                          | Claude |

---

**END OF SHARED_TEMPLATE_BASE.md**
