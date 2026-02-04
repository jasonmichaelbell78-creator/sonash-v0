# Multi-AI Review JSONL Schema Standard

**Document Version:** 1.0 **Created:** 2026-01-03 **Last Updated:** 2026-01-03
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

| Field              | Type   | Required | Description                               |
| ------------------ | ------ | -------- | ----------------------------------------- |
| `category`         | string | Yes      | Review-type-specific category (see below) |
| `title`            | string | Yes      | Short, specific description of finding    |
| `fingerprint`      | string | Yes      | Unique identifier for deduplication       |
| `severity`         | enum   | Yes      | S0 (critical) to S3 (low)                 |
| `effort`           | enum   | Yes      | E0 (minutes) to E3 (multi-week)           |
| `confidence`       | number | Yes      | 0-100 confidence score                    |
| `files`            | array  | Yes      | Affected file paths                       |
| `why_it_matters`   | string | Yes      | Impact explanation                        |
| `suggested_fix`    | string | Yes      | Remediation direction                     |
| `acceptance_tests` | array  | Yes      | How to verify fix                         |
| `evidence`         | array  | No       | Grep output, code snippets                |
| `notes`            | string | No       | Additional context                        |

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

## Domain-Specific Extensions

Each review type MAY add domain-specific fields. These are OPTIONAL and
supplement the base schema.

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

**Categories for Code Review:**

- Hygiene/Duplication
- Types/Correctness
- Next/React Boundaries
- Security
- Testing

**Categories for Refactor:**

- Hygiene/Duplication
- Types/Correctness
- Architecture/Boundaries
- Security Hardening
- Testing Infrastructure

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

### Security Audit Extensions

```json
{
  "vulnerability_details": {
    "description": "string (what's wrong)",
    "exploitation": "string (how it could be attacked)",
    "impact": "string (what damage could occur)",
    "affected_data": "string (what data is at risk)"
  },
  "remediation": {
    "steps": ["array of fix steps"],
    "code_example": "string (optional fix pattern)",
    "verification": ["array of verification steps"]
  },
  "owasp_category": "string (A01-A10 or N/A)",
  "cvss_estimate": "LOW|MEDIUM|HIGH|CRITICAL"
}
```

**Categories for Security:**

- Rate Limiting
- Input Validation
- Secrets Management
- Authentication
- Firebase Security
- OWASP

### Performance Audit Extensions

```json
{
  "symbols": ["array of affected components/hooks"],
  "performance_details": {
    "current_metric": "string (current value)",
    "expected_improvement": "string (estimated improvement)",
    "affected_metric": "LCP|INP|CLS|bundle|render|memory"
  },
  "optimization": {
    "description": "string (what to do)",
    "code_example": "string (optional pattern)",
    "verification": ["array of verification steps"]
  }
}
```

**Categories for Performance:**

- Bundle Size
- Rendering
- Data Fetching
- Memory
- Core Web Vitals

### Engineering Productivity Audit Extensions

```json
{
  "symbols": ["array of affected scripts/components"],
  "dx_details": {
    "current_state": "string (what exists)",
    "friction_point": "string (what causes friction)",
    "impact_area": "GoldenPath|Debugging|Offline"
  },
  "improvement": {
    "description": "string (what to do)",
    "code_example": "string (optional pattern)",
    "verification": ["array of verification steps"]
  }
}
```

**Categories for Engineering Productivity:**

- GoldenPath (setup, scripts, onboarding, dev workflow)
- Debugging (logging, tracing, error handling, messages)
- Offline (persistence, service workers, queues, sync)

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

## AI Instructions

When outputting JSONL:

1. **Always include base schema fields** - Never omit required fields
2. **Use domain extensions** - Add relevant extensions for review type
3. **Validate JSON** - Ensure each line parses independently
4. **Follow fingerprint format** - Enables proper deduplication
5. **Be conservative with confidence** - Err on side of lower confidence

When aggregating:

1. **Normalize categories** - Map to standard category names
2. **Merge by fingerprint first** - Primary deduplication key
3. **Check evidence overlap** - Secondary merge criteria
4. **Calculate consensus score** - Use standard formula
5. **Preserve domain extensions** - Don't drop type-specific fields

---

## Version History

| Version | Date       | Changes                                                 | Author |
| ------- | ---------- | ------------------------------------------------------- | ------ |
| 1.2     | 2026-02-02 | Added TDMS Field Mapping section for intake integration | Claude |
| 1.1     | 2026-01-24 | Added S0/S1 verification_steps extension (Session #98)  | Claude |
| 1.0     | 2026-01-03 | Initial schema standard creation (Task 6.7)             | Claude |

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

- [MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md](./MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md)
- [MULTI_AI_REFACTOR_PLAN_TEMPLATE.md](./MULTI_AI_REFACTOR_PLAN_TEMPLATE.md)
- [MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md](./MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md)
- [MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md](./MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md)
- [MULTI_AI_REVIEW_COORDINATOR.md](../MULTI_AI_REVIEW_COORDINATOR.md)
- [TDMS PROCEDURE.md](../technical-debt/PROCEDURE.md) - Canonical debt
  management
- [DOCUMENTATION_STANDARDS.md](../DOCUMENTATION_STANDARDS.md) - 5-tier doc
  system

---

**END OF JSONL_SCHEMA_STANDARD.md**
