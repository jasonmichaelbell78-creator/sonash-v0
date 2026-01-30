# Canonical Audit Findings Repository

**Created:** 2026-01-30 | **Last Updated:** 2026-01-30 | **Session:** #116

---

> **MIGRATION NOTICE:** This location will be superseded by
> `docs/technical-debt/` as part of the
> [Technical Debt Management System (TDMS)](../../plans/TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md).
> Once TDMS implementation is complete (Phase 8), this folder will be archived
> to `docs/archive/technical-debt-sources-2026-01/audits/`.
>
> **New canonical location:** `docs/technical-debt/MASTER_DEBT.jsonl` **New ID
> scheme:** `DEBT-XXXX` (replacing `CANON-XXXX`)

---

## Purpose

This is the **SINGLE SOURCE OF TRUTH** for all technical debt and audit findings
across the SoNash project. All audit processes ultimately feed into this
canonical location.

**Note:** After TDMS migration, this purpose transfers to
`docs/technical-debt/`.

## Structure

```
docs/audits/canonical/
├── README.md                    # This file - index and procedures
├── MASTER_FINDINGS.jsonl        # All active findings (machine-readable)
├── MASTER_FINDINGS_INDEX.md     # Human-readable findings index
├── RESOLVED_FINDINGS.jsonl      # Archived resolved findings
└── ROADMAP_INTEGRATION.md       # How findings map to ROADMAP.md
```

## File Descriptions

### MASTER_FINDINGS.jsonl

The consolidated, deduplicated list of all active audit findings. This file is:

- **Machine-readable**: JSONL format for script consumption
- **Authoritative**: All other audit outputs reference back to this file
- **Cross-referenced**: Each finding includes its ROADMAP placement

### MASTER_FINDINGS_INDEX.md

Human-readable index organized by:

1. Severity (S0 Critical → S3 Low)
2. Category (code, security, performance, etc.)
3. ROADMAP section

### RESOLVED_FINDINGS.jsonl

Archive of findings that have been addressed, including:

- Resolution date
- Resolving commit/PR
- Verification status

## How Findings Flow Here

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUDIT SOURCES                                 │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ Single-Session  │ Multi-AI Canon  │ Comprehensive Audits        │
│ /audit-* skills │ CANON-*.jsonl   │ docs/audits/comprehensive/  │
└────────┬────────┴────────┬────────┴─────────────┬───────────────┘
         │                 │                      │
         v                 v                      v
┌─────────────────────────────────────────────────────────────────┐
│              scripts/aggregate-audit-findings.js                 │
│  - Normalizes all findings to common schema                      │
│  - Deduplicates across sources                                   │
│  - Cross-references with ROADMAP.md                              │
│  - Identifies NET NEW vs already-tracked items                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             v
┌─────────────────────────────────────────────────────────────────┐
│           docs/audits/canonical/MASTER_FINDINGS.jsonl            │
│                  (This canonical location)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             v
┌─────────────────────────────────────────────────────────────────┐
│                      ROADMAP.md Integration                      │
│  - S0/S1 findings → Immediate Hotfixes section                   │
│  - S2/S3 findings → Appropriate milestone/track                  │
│  - All findings include file:line references                     │
└─────────────────────────────────────────────────────────────────┘
```

## Schema (JSONL Format)

Each finding in MASTER_FINDINGS.jsonl follows this schema:

```json
{
  "id": "CANON-XXXX",
  "original_id": "CODE-001",
  "category": "code|security|performance|refactoring|documentation|process|engineering-productivity",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": "HIGH|MEDIUM|LOW",
  "verified": "DUAL_PASS_CONFIRMED|TOOL_VALIDATED|MANUAL_ONLY",
  "file": "path/to/file.ts",
  "line": 123,
  "title": "Short description",
  "description": "Detailed issue description",
  "recommendation": "How to fix",
  "evidence": ["supporting evidence"],
  "cross_ref": "eslint|npm_audit|sonarcloud|MANUAL_ONLY",
  "roadmap_section": "M2.1|Track D|etc",
  "roadmap_item_id": "D4|A21|etc",
  "sources": [
    { "type": "single-session", "id": "CODE-001", "date": "2026-01-17" }
  ],
  "status": "active|in_progress|resolved",
  "created": "2026-01-30",
  "updated": "2026-01-30"
}
```

## ROADMAP Integration Rules

### By Severity

| Severity    | Placement              | Timeline            |
| ----------- | ---------------------- | ------------------- |
| S0 Critical | Immediate Hotfixes     | Fix NOW             |
| S1 High     | Active Sprint Track    | Before next release |
| S2 Medium   | Appropriate Milestone  | When convenient     |
| S3 Low      | Backlog / Nice-to-have | As time permits     |

### By Category

| Category                 | Primary ROADMAP Location                  |
| ------------------------ | ----------------------------------------- |
| code                     | M2.1 Code Quality / Track D               |
| security                 | M4.5 Security & Privacy / Track D-D5      |
| performance              | Track P - Performance Critical            |
| refactoring              | M2.3-REF God Objects / M2 Architecture    |
| documentation            | Track B-B8 Document Sync Tab              |
| process                  | Track D CI Reliability / Track E Solo Dev |
| engineering-productivity | Track E Solo Developer Automations        |

## Procedures

See [../AUDIT_FINDINGS_PROCEDURE.md](../AUDIT_FINDINGS_PROCEDURE.md) for
detailed procedures on:

- Running audits
- Processing findings
- Updating this canonical location
- ROADMAP integration

## Quick Reference Commands

```bash
# Run full aggregation (updates this location)
node scripts/aggregate-audit-findings.js

# Generate placement report
node scripts/generate-placement-report.js

# Validate findings
node scripts/validate-audit.js docs/audits/canonical/MASTER_FINDINGS.jsonl

# Check for duplicates
node scripts/aggregate-audit-findings.js --dedup-check
```

## Version History

| Version | Date       | Changes                                         |
| ------- | ---------- | ----------------------------------------------- |
| 1.0     | 2026-01-30 | Initial canonical location setup (Session #116) |
