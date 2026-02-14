# Audit Standards

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Canonical reference for creating, running, and extending audits in SoNash.

---

## 1. Purpose & Scope

This document defines the standards for all audit activities: single-session
audits, multi-AI consensus audits, and ad-hoc/custom audits. It ensures
consistent output, pipeline compatibility, and TDMS integration.

**Audience:** AI agents running audits, humans creating new audit types.

---

## 2. Audit Taxonomy — 3 Types

| Type                   | Tool                         | AI Systems                     | Speed         | Best For                           |
| ---------------------- | ---------------------------- | ------------------------------ | ------------- | ---------------------------------- |
| **Single-Session**     | `/audit-<category>` skill    | Claude Code (parallel agents)  | Fast (15-50m) | Regular checks, threshold triggers |
| **Multi-AI Consensus** | `/multi-ai-audit` + template | Multiple external AIs (manual) | Slow (hours)  | Critical decisions, diverse views  |
| **Ad-hoc / Custom**    | `/create-audit` wizard       | Varies                         | Varies        | One-off investigations             |

### When to Use Each

```
Decision Tree:
├─ Threshold triggered? → Single-session (matching category)
├─ 100+ commits or 14+ days? → Multi-AI consensus (all categories)
├─ Critical security/architecture? → Multi-AI consensus
├─ Quick pre-merge check? → Single-session
├─ Custom investigation? → Ad-hoc (use create-audit wizard)
└─ Full sweep? → /audit-comprehensive (runs all 9 single-session)
```

---

## 3. Category Taxonomy — 9 Fixed Categories

| Category                   | Skill                             | Scope                                    |
| -------------------------- | --------------------------------- | ---------------------------------------- |
| `code-quality`             | `/audit-code`                     | Complexity, patterns, dead code          |
| `security`                 | `/audit-security`                 | Vulnerabilities, auth, data exposure     |
| `performance`              | `/audit-performance`              | Bottlenecks, bundle size, rendering      |
| `refactoring`              | `/audit-refactoring`              | Duplication, coupling, structure         |
| `documentation`            | `/audit-documentation`            | Coverage, accuracy, freshness            |
| `process`                  | `/audit-process`                  | CI/CD, hooks, scripts, automation        |
| `engineering-productivity` | `/audit-engineering-productivity` | DX, debugging tools, workflow friction   |
| `enhancements`             | `/audit-enhancements`             | Feature gaps, UX improvements            |
| `ai-optimization`          | `/audit-ai-optimization`          | Token waste, skill overlap, hook latency |

### Sub-Category Rules

- Domain-specific subdivisions are allowed (e.g., `security::auth`,
  `performance::rendering`)
- Sub-categories MUST map to exactly one parent category
- Use `::` separator in fingerprints: `<category>::<file>::<identifier>`
- New top-level categories require updating this document, all pipeline scripts,
  and AUDIT_TRACKER.md

---

## 4. Severity & Effort Scales

### Severity (S0-S3)

| Level  | Name     | Definition                                      |
| ------ | -------- | ----------------------------------------------- |
| **S0** | Critical | Security breach, data loss, production breaking |
| **S1** | High     | Likely bugs, significant risk, major tech debt  |
| **S2** | Medium   | Maintainability drag, inconsistency, friction   |
| **S3** | Low      | Polish, cosmetic, minor improvements            |

### Effort (E0-E3)

| Level  | Name    | Definition                  |
| ------ | ------- | --------------------------- |
| **E0** | Minutes | Quick fix, trivial change   |
| **E1** | Hours   | Single-session work         |
| **E2** | Days    | 1-3 days or staged PR       |
| **E3** | Weeks   | Multi-PR, multi-week effort |

**Reference:** Full schema in
[JSONL_SCHEMA_STANDARD.md](../templates/JSONL_SCHEMA_STANDARD.md)

---

## 5. SKILL.md Structure Standard

Every audit skill (`/audit-<name>`) MUST include these sections:

```markdown
---
name: audit-<name>
description: <one-line description>
supports_parallel: true|false
fallback_available: true|false
estimated_time_parallel: <X> min
estimated_time_sequential: <X> min
---

# Single-Session <Name> Audit

## Purpose

<What this audit checks and why>

## Execution Mode Selection

<Table: parallel vs sequential conditions>

## Pre-Audit Validation

1. Episodic memory search for prior findings
2. Read docs/technical-debt/FALSE_POSITIVES.jsonl
3. Check prior audit results in output directory
4. Verify output directory exists

## Agent Architecture

<Stages with agent definitions, parallel grouping>

## Output Format

- JSONL per JSONL_SCHEMA_STANDARD.md
- Category field: <category name>
- Output dir: docs/audits/single-session/<category>/audit-YYYY-MM-DD/

## Post-Audit

1. Validate JSONL schema
2. Run TDMS intake
3. Update AUDIT_TRACKER.md
4. Commit results
```

### Required Agent Prompt Elements

Each agent prompt MUST include:

- Output file path (explicit, not implied)
- JSONL schema reference
- FALSE_POSITIVES.jsonl exclusion instructions
- Category and fingerprint format
- Evidence requirements

---

## 6. Multi-AI Template Standard

Every multi-AI template (`docs/multi-ai-audit/templates/<NAME>_AUDIT.md`) MUST
include:

```markdown
# [Project Name] Multi-AI <Name> Audit Plan

## Purpose

<When to use this template>

## Review Scope

<Table of what to audit, file patterns, counts>

## <Name> Audit Prompt (Copy for Each AI Model)

<The actual prompt to paste into external AIs>

### Sub-Categories

<Numbered list matching skill domains>

### Output Format

<JSONL schema with examples>

### Quality Guardrails

- Minimum confidence threshold
- Evidence requirements
- False positive awareness

## Aggregation Process

<How to merge results from multiple AIs>

## TDMS Integration

<Intake commands and verification steps>
```

**Reference:** Shared boilerplate in
[SHARED_TEMPLATE_BASE.md](../multi-ai-audit/templates/SHARED_TEMPLATE_BASE.md)

---

## 7. Results Pipeline & Storage Conventions

### 3 Canonical Output Paths

All audit output MUST use one of these 3 paths. No ad-hoc locations.

| Type           | Path Pattern                                                 | Example                                             |
| -------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| Single-session | `docs/audits/single-session/<category>/audit-YYYY-MM-DD/`    | `docs/audits/single-session/code/audit-2026-02-14/` |
| Comprehensive  | `docs/audits/comprehensive/audit-YYYY-MM-DD/`                | `docs/audits/comprehensive/audit-2026-02-14/`       |
| Multi-AI       | `docs/audits/multi-ai/<session-id>/raw/`, `canon/`, `final/` | `docs/audits/multi-ai/2026-02-14-security/raw/`     |

### Standard Output Files

Single-session audits produce:

- `findings.jsonl` or `all-findings-deduped.jsonl` — JSONL findings
- `REPORT.md` or `<NAME>_AUDIT_REPORT.md` — Human-readable report
- Stage-specific files (e.g., `stage-1-*.jsonl`) for multi-stage audits

Comprehensive audits produce per-domain reports plus an aggregated report.

### Results Flow

```
Audit Output → Pipeline Scripts → TDMS Intake → MASTER_DEBT.jsonl → Views
```

Pipeline scripts (in `scripts/debt/` and `scripts/multi-ai/`):

| Script                      | Purpose                                |
| --------------------------- | -------------------------------------- |
| `intake-audit.js`           | Ingest single-session findings to TDMS |
| `extract-agent-findings.js` | Parse agent JSONL outputs              |
| `normalize-format.js`       | Normalize field names across sources   |
| `aggregate-category.js`     | Merge multi-AI results per category    |
| `unify-findings.js`         | Cross-category deduplication           |
| `generate-views.js`         | Generate INDEX.md and METRICS.md views |
| `generate-metrics.js`       | Generate metrics.json for dashboard    |
| `consolidate-all.js`        | Full pipeline: extract → dedup → views |

---

## 8. TDMS Integration Checklist

After any audit completes, follow this checklist:

1. **Validate schema** — `node scripts/debt/validate-schema.js <findings.jsonl>`
2. **Run intake** —
   `node scripts/debt/intake-audit.js <findings.jsonl> --source "audit-<category>-YYYY-MM-DD"`
3. **Regenerate views** — `node scripts/debt/generate-views.js`
4. **Regenerate metrics** — `node scripts/debt/generate-metrics.js`
5. **Assign roadmap refs** (if applicable) —
   `node scripts/debt/assign-roadmap-refs.js`

**False Positives:** Maintained at `docs/technical-debt/FALSE_POSITIVES.jsonl`.
All audit skills MUST check this file and exclude matching patterns before
reporting findings.

**CRITICAL:** `generate-views.js` reads from
`docs/technical-debt/raw/deduped.jsonl` and OVERWRITES `MASTER_DEBT.jsonl`. Any
script that appends to MASTER_DEBT.jsonl MUST also append to
`raw/deduped.jsonl`.

---

## 9. Naming Conventions

| Item              | Pattern                            | Example                      |
| ----------------- | ---------------------------------- | ---------------------------- |
| Skill directory   | `.claude/skills/audit-<name>/`     | `.claude/skills/audit-code/` |
| Skill file        | `SKILL.md`                         | Always `SKILL.md`            |
| Multi-AI template | `<NAME>_AUDIT.md` (UPPER_SNAKE)    | `PROCESS_AUDIT.md`           |
| Output directory  | `audit-YYYY-MM-DD/`                | `audit-2026-02-14/`          |
| JSONL findings    | `findings.jsonl` or stage-specific | `stage-2-redundancy.jsonl`   |
| Report            | `*-report.md` or `REPORT.md`       | `AUTOMATION_AUDIT_REPORT.md` |
| Fingerprint       | `<category>::<file>::<identifier>` | `security::auth.ts::no-csrf` |
| TDMS source tag   | `audit-<category>-YYYY-MM-DD`      | `audit-code-2026-02-14`      |

---

## 10. Growth Guide — Adding a New Audit Type

### Option A: Use the Create-Audit Wizard

```
/create-audit
```

The wizard will prompt for name, description, category, domains, agent count,
and generate all required files.

### Option B: Manual Creation

1. **Create skill:** `.claude/skills/audit-<name>/SKILL.md`
   - Follow Section 5 structure standard
   - Fork from closest existing skill (e.g., `audit-process` for complex audits)
2. **Create template:** `docs/multi-ai-audit/templates/<NAME>_AUDIT.md`
   - Follow Section 6 template standard
   - Fork from closest existing template
3. **Create output directory:** `docs/audits/single-session/<name>/`
4. **Update tracker:** Add row to `docs/AUDIT_TRACKER.md`
5. **Update index:** Add entry to `.claude/skills/SKILL_INDEX.md`
6. **Update multi-ai README:** Update template count in
   `docs/multi-ai-audit/README.md`
7. **Update comprehensive:** If permanent, add to
   `.claude/skills/audit-comprehensive/SKILL.md`
8. **Verify integration:**
   - `npm run skills:validate`
   - `npm run crossdoc:check`
   - `npm run docs:headers`

### Category Rules

- Use one of the 9 existing categories (Section 3) if possible
- Adding a new top-level category requires updating:
  - This document (Section 3)
  - `scripts/debt/intake-audit.js` (category validation)
  - `scripts/debt/extract-audits.js` (category normalization)
  - `scripts/debt/validate-schema.js` (category enum)
  - `docs/AUDIT_TRACKER.md` (threshold row)
  - `audit-comprehensive/SKILL.md` (stage allocation)
  - `audit-aggregator/SKILL.md` (input list)

---

## Version History

| Version | Date       | Change           |
| ------- | ---------- | ---------------- |
| 1.0     | 2026-02-14 | Initial creation |
