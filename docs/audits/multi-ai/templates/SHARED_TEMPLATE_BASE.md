# Multi-AI Audit Shared Template Base

**Document Version:** 1.0 **Created:** 2026-02-07 **Last Updated:** 2026-02-07
**Status:** ACTIVE **Tier:** 4 (Reference) **Purpose:** Shared boilerplate for
all multi-AI audit templates

---

## Purpose

This document centralizes the shared sections used across all 7 multi-AI audit
templates. Each category template (`CODE_REVIEW_PLAN.md`,
`SECURITY_AUDIT_PLAN.md`, etc.) references this file for common elements,
keeping domain-specific content in their own files while avoiding ~60-70%
content duplication.

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

## TDMS Integration

### Automatic Intake

After aggregation, ingest findings to TDMS:

```bash
node scripts/debt/intake-audit.js \
  docs/audits/single-session/[DOMAIN]/AUDIT_YYYY_QX.jsonl \
  --source "multi-ai-[DOMAIN]-audit" \
  --batch-id "[DOMAIN]-audit-YYYYMMDD"
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

| Version | Date       | Changes                                             | Author |
| ------- | ---------- | --------------------------------------------------- | ------ |
| 1.0     | 2026-02-07 | Initial extraction from 7 audit templates (Phase 4) | Claude |

---

**END OF SHARED_TEMPLATE_BASE.md**
