# Multi-AI Review JSONL Schema Standard

**Document Version:** 1.4 **Created:** 2026-01-03 **Last Updated:** 2026-02-12
**Purpose:** Standardized JSONL output schema for all multi-AI review templates

---

## Purpose

This document defines the **canonical JSONL schema** used across all multi-AI
review templates. Consistent schemas enable:

- Automated aggregation across review types
- Unified tooling for parsing and analyzing findings
- Cross-review comparison and trending

---

## Base Schema (Required Fields)

All finding objects MUST include these fields:

```json
{
  "category": "string",
  "title": "string (short, specific)",
  "fingerprint": "string (<category>::<primary_file>::<identifier>)",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": "number (0-100)",
  "files": ["array of file paths"],
  "why_it_matters": "string (1-3 sentences)",
  "suggested_fix": "string (concrete direction)",
  "acceptance_tests": ["array of verification steps"],
  "evidence": ["array of evidence snippets (optional)"],
  "notes": "string (optional)"
}
```

### Field Definitions

| Field              | Type   | Required | Description                                               |
| ------------------ | ------ | -------- | --------------------------------------------------------- |
| `category`         | string | Yes      | Domain-level category (see Valid Domain Categories below) |
| `title`            | string | Yes      | Short, specific description of finding                    |
| `fingerprint`      | string | Yes      | Unique identifier for deduplication                       |
| `severity`         | enum   | Yes      | S0 (critical) to S3 (low)                                 |
| `effort`           | enum   | Yes      | E0 (minutes) to E3 (multi-week)                           |
| `confidence`       | number | Yes      | 0-100 confidence score                                    |
| `files`            | array  | Yes      | Affected file paths                                       |
| `why_it_matters`   | string | Yes      | Impact explanation                                        |
| `suggested_fix`    | string | Yes      | Remediation direction                                     |
| `acceptance_tests` | array  | Yes      | How to verify fix                                         |
| `evidence`         | array  | No       | Grep output, code snippets                                |
| `notes`            | string | No       | Additional context                                        |

---

## Severity Scale (Universal)

| Level  | Name     | Definition                                      |
| ------ | -------- | ----------------------------------------------- |
| **S0** | Critical | Security breach, data loss, production breaking |
| **S1** | High     | Likely bugs, significant risk, major tech debt  |
| **S2** | Medium   | Maintainability drag, inconsistency, friction   |
| **S3** | Low      | Polish, cosmetic, minor improvements            |

## Effort Scale (Universal)

| Level  | Name    | Definition                  |
| ------ | ------- | --------------------------- |
| **E0** | Minutes | Quick fix, trivial change   |
| **E1** | Hours   | Single-session work         |
| **E2** | Days    | 1-3 days or staged PR       |
| **E3** | Weeks   | Multi-PR, multi-week effort |

---

## Valid Domain Categories

The `category` field MUST be one of these domain-level values:

| Domain                   | `category` Value           |
| ------------------------ | -------------------------- |
| Code Quality             | `code-quality`             |
| Security                 | `security`                 |
| Performance              | `performance`              |
| Refactoring              | `refactoring`              |
| Documentation            | `documentation`            |
| Process/Automation       | `process`                  |
| Engineering Productivity | `engineering-productivity` |

**Sub-Classification:** Sub-categories (e.g., "Rate Limiting", "Bundle Size")
belong in the `fingerprint` or `title` fields, NOT in `category`. The pipeline's
`fix-schema.js` normalizes non-standard category values to domain-level, but
producing standard output is strongly preferred.

---

## Fingerprint Convention

The `fingerprint` field uniquely identifies a finding for deduplication. Format:

```
<domain>::<file_or_scope>::<issue_slug>
```

**Examples by domain:**

| Domain                   | Example Fingerprint                                        |
| ------------------------ | ---------------------------------------------------------- |
| code-quality             | `code-quality::lib/auth.ts::missing-type-guard`            |
| security                 | `security::lib/auth.ts::missing-rate-limit`                |
| performance              | `performance::components/List.tsx::missing-virtualization` |
| refactoring              | `refactoring::hooks/useJournal.ts::extract-service`        |
| documentation            | `documentation::ARCHITECTURE.md::broken-link-setup`        |
| process                  | `process::scripts/deploy.js::missing-error-handling`       |
| engineering-productivity | `engineering-productivity::scripts/dev.js::slow-startup`   |

---

## Domain-Specific Extensions

Each review type MAY add domain-specific fields. These are OPTIONAL supplements
to the base schema -- the REQUIRED base fields (`why_it_matters`,
`suggested_fix`, `acceptance_tests`) must always be populated. Domain extensions
provide additional structured detail but never replace base fields.

### Code Review / Refactor Extensions

```json
{
  "symbols": ["array of symbol names (functions, components, types)"],
  "duplication_cluster": {
    "is_cluster": "boolean",
    "cluster_summary": "string (pattern description)",
    "instances": [{ "file": "string", "symbol": "string" }],
    "consolidation_target": "string (optional, for refactor)"
  },
  "pr_bucket_suggestion": "string (firebase-access|ui-primitives|hooks-standardization|types-domain|boundaries|security-hardening|tests-hardening|misc)",
  "dependencies": ["array of fingerprints this depends on"]
}
```

### S0/S1 Verification Extension (REQUIRED for Critical/High Findings)

For all S0 (Critical) and S1 (High) severity findings, the `verification_steps`
field is **REQUIRED**. This ensures dual-pass verification and tool confirmation
for high-severity issues.

```json
{
  "verification_steps": {
    "first_pass": {
      "method": "grep|tool_output|file_read|code_search",
      "evidence_collected": ["initial code snippet", "grep output line"]
    },
    "second_pass": {
      "method": "contextual_review|exploitation_test|manual_verification",
      "confirmed": true,
      "notes": "Re-read in context, no existing mitigation found"
    },
    "tool_confirmation": {
      "tool": "eslint|sonarcloud|npm_audit|patterns_check|typescript|NONE",
      "reference": "Tool output ID or NONE with justification"
    }
  }
}
```

**Validation Rules for verification_steps:**

| Field                           | Required | Validation                           |
| ------------------------------- | -------- | ------------------------------------ |
| `first_pass.method`             | Yes      | Must be valid method enum            |
| `first_pass.evidence_collected` | Yes      | Array with >= 1 item                 |
| `second_pass.method`            | Yes      | Must be valid method enum            |
| `second_pass.confirmed`         | Yes      | Must be `true` (or downgrade to S2+) |
| `tool_confirmation.tool`        | Yes      | Must be valid tool or "NONE"         |
| `tool_confirmation.reference`   | Yes      | Non-empty string                     |

**Note:** S0/S1 findings with `confidence: "LOW"` or `cross_ref: "MANUAL_ONLY"`
require additional scrutiny and may be blocked by pre-commit hooks.

---

### Security Audit Extensions (OPTIONAL supplements)

These fields provide additional structured detail. The base schema fields
`why_it_matters` (description + impact), `suggested_fix` (remediation steps),
and `acceptance_tests` (verification) MUST still be populated.

```json
{
  "vulnerability_details": {
    "description": "string (what's wrong -- also put in why_it_matters)",
    "exploitation": "string (how it could be attacked)",
    "impact": "string (what damage could occur)",
    "affected_data": "string (what data is at risk)"
  },
  "remediation": {
    "steps": ["array of fix steps -- also put in suggested_fix"],
    "code_example": "string (optional fix pattern)",
    "verification": ["array -- also put in acceptance_tests"]
  },
  "owasp_category": "string (A01-A10 or N/A)",
  "cvss_estimate": "LOW|MEDIUM|HIGH|CRITICAL"
}
```

### Performance Audit Extensions (OPTIONAL supplements)

```json
{
  "symbols": ["array of affected components/hooks"],
  "performance_details": {
    "current_metric": "string (current value)",
    "expected_improvement": "string (estimated improvement)",
    "affected_metric": "LCP|INP|CLS|bundle|render|memory"
  },
  "optimization": {
    "description": "string (what to do -- also put in suggested_fix)",
    "code_example": "string (optional pattern)",
    "verification": ["array -- also put in acceptance_tests"]
  }
}
```

### Enhancement Type Extensions (for `type: "enhancement"` items)

Enhancement items (formerly tracked in the IMS) use `category: "enhancements"`
and `type: "enhancement"` in TDMS. These optional fields preserve
enhancement-specific context:

```json
{
  "type": "enhancement",
  "category": "enhancements",
  "subcategory": "string (domain: app-architecture|product-ux|content|devx-automation|infrastructure|testing-strategy|documentation-strategy|workflow-lifecycle|external-services|meta-tooling)",
  "impact": "I0|I1|I2|I3 (original impact rating, mapped to severity for TDMS)",
  "confidence": "number (0-100, minimum 70 for acceptance)",
  "counter_argument": "string (why NOT to do this - honesty guard)",
  "current_approach": "string (what exists today)",
  "proposed_outcome": "string (what would be better)",
  "why_it_matters": "string (the benefit)",
  "concrete_alternatives": ["array of named solutions"],
  "risk_assessment": "string (what could go wrong)",
  "migrated_from": "string (original ENH-XXXX ID, for items migrated from IMS)"
}
```

**Impact → Severity mapping:** I0→S1, I1→S2, I2→S2, I3→S3. Enhancements never
use S0 (critical/production-breaking).

### Engineering Productivity Audit Extensions (OPTIONAL supplements)

```json
{
  "symbols": ["array of affected scripts/components"],
  "dx_details": {
    "current_state": "string (what exists)",
    "friction_point": "string (what causes friction)",
    "impact_area": "GoldenPath|Debugging|Offline"
  },
  "improvement": {
    "description": "string (what to do -- also put in suggested_fix)",
    "code_example": "string (optional pattern)",
    "verification": ["array -- also put in acceptance_tests"]
  }
}
```

---

## Aggregated/Canonical Schema

After aggregation, findings gain additional metadata:

```json
{
  "canonical_id": "CANON-0001",
  "status": "CONFIRMED|SUSPECTED",
  "final_confidence": "number (0-100, adjusted)",
  "consensus_score": "number (0-5)",
  "sources": ["array of model names"],
  "confirmations": "number (count in FINDINGS_JSONL)",
  "suspects": "number (count in SUSPECTED_JSONL)",
  "evidence_summary": ["array of condensed evidence bullets"]
}
```

---

## Output Sections (Standard Order)

All review outputs MUST follow this section order:

1. **FINDINGS_JSONL** - Confirmed findings (one JSON object per line)
2. **SUSPECTED_FINDINGS_JSONL** - Suspected findings (confidence ≤ 40)
3. **HUMAN_SUMMARY** - Markdown summary with priorities

Aggregation outputs add: 4. **PARSE_ERRORS_JSON** - Any parsing errors
encountered 5. **DEDUPED_FINDINGS_JSONL** - Canonical findings with IDs 6.
**[TYPE]\_PLAN_JSON** - PR/Remediation/Optimization plan

---

## Validation Rules

### Required Validations

1. **Valid JSON**: Each line in JSONL must be valid JSON
2. **Required fields**: All base schema fields must be present
3. **Enum validation**: severity, effort must match defined values
4. **Non-empty arrays**: `files` and `acceptance_tests` must have ≥1 item
5. **Fingerprint format**: Must follow `<category>::<file>::<identifier>`
   pattern
6. **S0/S1 strict validation**: High-severity findings must include:
   - `verification_steps` object with all required subfields
   - `confidence`: "HIGH" or "MEDIUM" (LOW is blocked)
   - `cross_ref`: Tool validation preferred (MANUAL_ONLY triggers warning)
   - `evidence`: Array with >= 2 items

### Confidence Thresholds

| Category                 | Threshold               | Action               |
| ------------------------ | ----------------------- | -------------------- |
| FINDINGS_JSONL           | confidence > 40         | Include as confirmed |
| SUSPECTED_FINDINGS_JSONL | confidence ≤ 40         | Include as suspected |
| Post-aggregation cap     | Single source, no tool  | Max 60               |
| Post-aggregation floor   | ≥2 confirmed + evidence | Min 70               |

---

---

## Version History

| Version | Date       | Changes                                                                       | Author |
| ------- | ---------- | ----------------------------------------------------------------------------- | ------ |
| 1.4     | 2026-02-12 | Added Enhancement Type extensions (IMS merged into TDMS)                      | Claude |
| 1.3     | 2026-02-07 | Domain-level category requirement, fingerprint convention, flatten extensions | Claude |
| 1.2     | 2026-02-02 | Added TDMS Field Mapping section for intake integration                       | Claude |
| 1.1     | 2026-01-24 | Added S0/S1 verification_steps extension (Session #98)                        | Claude |
| 1.0     | 2026-01-03 | Initial schema standard creation (Task 6.7)                                   | Claude |

---

## TDMS Field Mapping

When audit findings are ingested into TDMS via `intake-audit.js`, fields are
mapped as follows:

### Doc Standards JSONL → TDMS MASTER_DEBT.jsonl

| Doc Standards Field | TDMS Field       | Mapping Notes                                            |
| ------------------- | ---------------- | -------------------------------------------------------- |
| `fingerprint`       | `source_id`      | Converted: `category::file::id` → `audit:UUID`           |
| `fingerprint`       | `content_hash`   | Used for deduplication (SHA256 of normalized content)    |
| `files[0]`          | `file`           | First file path extracted (TDMS stores single file)      |
| `files[0]`          | `line`           | Line extracted if present in path, else 0                |
| `why_it_matters`    | `description`    | Direct mapping                                           |
| `suggested_fix`     | `recommendation` | Direct mapping                                           |
| `acceptance_tests`  | `evidence`       | Appended to evidence array                               |
| `confidence`        | (logged)         | Logged to intake-log.jsonl but not stored in MASTER_DEBT |
| `severity`          | `severity`       | Direct mapping (S0/S1/S2/S3)                             |
| `effort`            | `effort`         | Direct mapping (E0/E1/E2/E3)                             |
| `category`          | `category`       | Normalized per Section 11 of PROCEDURE.md                |
| (auto)              | `id`             | Generated as DEBT-XXXX by intake script                  |
| (auto)              | `status`         | Set to "NEW"                                             |
| (auto)              | `created`        | Set to current date                                      |

### Handling Optional Fields

| Doc Standards Field   | Handling                                       |
| --------------------- | ---------------------------------------------- |
| `verification_steps`  | Stored in `evidence` as JSON string if present |
| `evidence`            | Merged into TDMS `evidence` array              |
| `notes`               | Appended to `description` if present           |
| `symbols`             | Stored in `evidence` as reference              |
| `duplication_cluster` | Preserved in finding metadata                  |

### Ingestion Command

```bash
# Standard intake from audit JSONL
node scripts/debt/intake-audit.js <audit-output.jsonl> --source "audit-<type>-<date>"

# With explicit category mapping (for external sources)
node scripts/debt/intake-audit.js <audit-output.jsonl> \
  --source "external-vendor" \
  --category-mapping "Critical=security,Major=code-quality"
```

---

## Related Documents

- [CODE_REVIEW_PLAN.md](../multi-ai-audit/templates/CODE_REVIEW_PLAN.md)
- [SECURITY_AUDIT_PLAN.md](../multi-ai-audit/templates/SECURITY_AUDIT_PLAN.md)
- [PERFORMANCE_AUDIT_PLAN.md](../multi-ai-audit/templates/PERFORMANCE_AUDIT_PLAN.md)
- [REFACTORING_AUDIT.md](../multi-ai-audit/templates/REFACTORING_AUDIT.md)
- [SHARED_TEMPLATE_BASE.md](../multi-ai-audit/templates/SHARED_TEMPLATE_BASE.md) -
  Shared boilerplate for all audit templates
- [COORDINATOR.md](../multi-ai-audit/COORDINATOR.md)
- [TDMS PROCEDURE.md](../technical-debt/PROCEDURE.md) - Canonical debt
  management
- [DOCUMENTATION_STANDARDS.md](../DOCUMENTATION_STANDARDS.md) - 5-tier doc
  system

---

**END OF JSONL_SCHEMA_STANDARD.md**
