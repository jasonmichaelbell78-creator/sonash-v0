# Validation Checks Reference

**Source:** Extracted from `docs/templates/JSONL_SCHEMA_STANDARD.md` **Version:**
1.0

This document lists all validation rules enforced by the audit validation
wrapper.

---

## 1. Base Schema Required Fields

Every finding in JSONL output MUST include these fields:

| Field              | Type   | Validation                                   |
| ------------------ | ------ | -------------------------------------------- |
| `category`         | string | Must be valid enum (see Section 2)           |
| `title`            | string | Non-empty, short and specific                |
| `fingerprint`      | string | Must follow format `<category>::<file>::<id>` |
| `severity`         | enum   | Must be S0, S1, S2, or S3                    |
| `effort`           | enum   | Must be E0, E1, E2, or E3                    |
| `confidence`       | number | Integer 0-100                                |
| `files`            | array  | Non-empty array of file paths                |
| `why_it_matters`   | string | Non-empty impact explanation                 |
| `suggested_fix`    | string | Non-empty remediation direction              |
| `acceptance_tests` | array  | Non-empty array of verification steps        |

---

## 2. Valid Enum Values

### Categories

```javascript
["security", "performance", "code-quality", "documentation", "process", "refactoring"]
```

### Severities

| Level | Name     | Definition                                       |
| ----- | -------- | ------------------------------------------------ |
| S0    | Critical | Security breach, data loss, production breaking  |
| S1    | High     | Likely bugs, significant risk, major tech debt   |
| S2    | Medium   | Maintainability drag, inconsistency, friction    |
| S3    | Low      | Polish, cosmetic, minor improvements             |

### Efforts

| Level | Name    | Definition                   |
| ----- | ------- | ---------------------------- |
| E0    | Minutes | Quick fix, trivial change    |
| E1    | Hours   | Single-session work          |
| E2    | Days    | 1-3 days or staged PR        |
| E3    | Weeks   | Multi-PR, multi-week effort  |

---

## 3. S0/S1 Verification Requirements

All S0 (Critical) and S1 (High) severity findings MUST include
`verification_steps` object with these subfields:

### 3.1 first_pass (Required)

```json
{
  "first_pass": {
    "method": "grep|tool_output|file_read|code_search",
    "evidence_collected": ["array", "with", "at least 1 item"]
  }
}
```

**Valid methods:**

- `grep` - Pattern search in codebase
- `tool_output` - Output from external tool (ESLint, npm audit, etc.)
- `file_read` - Direct file content examination
- `code_search` - Semantic code search

### 3.2 second_pass (Required)

```json
{
  "second_pass": {
    "method": "contextual_review|exploitation_test|manual_verification",
    "confirmed": true,
    "notes": "Re-read in context, no existing mitigation found"
  }
}
```

**Valid methods:**

- `contextual_review` - Review finding in broader code context
- `exploitation_test` - Attempt to exploit the vulnerability
- `manual_verification` - Human verification of the issue

**Critical:** `confirmed` MUST be `true`. If the finding cannot be confirmed,
downgrade severity to S2 or S3.

### 3.3 tool_confirmation (Required)

```json
{
  "tool_confirmation": {
    "tool": "eslint|sonarcloud|npm_audit|patterns_check|typescript|NONE",
    "reference": "Tool output ID or NONE justification"
  }
}
```

**Valid tools:**

- `eslint` - ESLint rule violation
- `sonarcloud` - SonarCloud finding
- `npm_audit` - npm audit vulnerability
- `patterns_check` - `npm run patterns:check` violation
- `typescript` - TypeScript compiler error
- `NONE` - No tool confirmation available (requires justification)

---

## 4. Fingerprint Format

Fingerprints enable deduplication and must follow this format:

```
<category>::<primary_file>::<identifier>
```

**Examples:**

```
security::lib/auth.ts::missing-rate-limit-login
code-quality::components/Form.tsx::missing-error-boundary
performance::hooks/useData.ts::unnecessary-rerender-deps
```

**Validation:**

- Must contain at least 2 `::` separators (3+ parts)
- Category should match valid categories
- File path should be relative from repo root
- Identifier should be descriptive and unique within file

---

## 5. TDMS Field Mapping

When findings are ingested into TDMS via `intake-audit.js`, fields map as:

| Doc Standards Field | TDMS Field       | Mapping Notes                             |
| ------------------- | ---------------- | ----------------------------------------- |
| `fingerprint`       | `source_id`      | Converted: `cat::file::id` → `audit:cat-file-id` |
| `files[0]`          | `file`           | First file path extracted                 |
| `files[0]`          | `line`           | Line extracted if format `file:123`       |
| `why_it_matters`    | `description`    | Direct mapping                            |
| `suggested_fix`     | `recommendation` | Direct mapping                            |
| `acceptance_tests`  | `evidence`       | Appended with `[Acceptance]` prefix       |
| `confidence`        | (logged)         | Logged to intake-log.jsonl only           |
| `severity`          | `severity`       | Direct mapping (S0/S1/S2/S3)              |
| `effort`            | `effort`         | Direct mapping (E0/E1/E2/E3)              |
| `category`          | `category`       | Direct mapping                            |

**Validation Warnings:**

- `files[0]` not a string → Will be coerced
- `why_it_matters` empty → Empty TDMS description
- `suggested_fix` empty → Empty TDMS recommendation
- `fingerprint` very long → source_id may exceed limits

---

## 6. Confidence Thresholds

| Category                 | Threshold       | Action               |
| ------------------------ | --------------- | -------------------- |
| FINDINGS_JSONL           | confidence > 40 | Include as confirmed |
| SUSPECTED_FINDINGS_JSONL | confidence ≤ 40 | Include as suspected |
| Post-aggregation cap     | Single source   | Max 60               |
| Post-aggregation floor   | ≥2 confirmed    | Min 70               |

---

## 7. Error Codes Reference

Errors returned by `validate-audit-integration.js`:

### Schema Errors (Non-blocking)

| Code                          | Description                          |
| ----------------------------- | ------------------------------------ |
| `MISSING_REQUIRED_FIELD`      | Required base field missing          |
| `INVALID_CATEGORY`            | Category not in valid enum           |
| `INVALID_SEVERITY`            | Severity not S0/S1/S2/S3             |
| `INVALID_EFFORT`              | Effort not E0/E1/E2/E3               |
| `INVALID_CONFIDENCE`          | Confidence not number 0-100          |
| `INVALID_FILES`               | Files not non-empty array            |
| `INVALID_ACCEPTANCE_TESTS`    | Acceptance tests not non-empty array |
| `INVALID_FINGERPRINT_FORMAT`  | Fingerprint doesn't match format     |

### S0/S1 Errors (BLOCKING)

| Code                         | Description                          |
| ---------------------------- | ------------------------------------ |
| `MISSING_VERIFICATION_STEPS` | S0/S1 missing verification_steps     |
| `MISSING_FIRST_PASS`         | Missing first_pass object            |
| `INVALID_FIRST_PASS_METHOD`  | first_pass.method not valid          |
| `EMPTY_FIRST_PASS_EVIDENCE`  | evidence_collected empty             |
| `MISSING_SECOND_PASS`        | Missing second_pass object           |
| `INVALID_SECOND_PASS_METHOD` | second_pass.method not valid         |
| `SECOND_PASS_NOT_CONFIRMED`  | confirmed !== true                   |
| `MISSING_TOOL_CONFIRMATION`  | Missing tool_confirmation object     |
| `INVALID_TOOL_CONFIRMATION`  | tool not valid                       |
| `MISSING_TOOL_REFERENCE`     | reference empty                      |

### TDMS Mapping Warnings

| Code                   | Description                          |
| ---------------------- | ------------------------------------ |
| `TDMS_MAPPING_ERROR`   | Field will need type coercion        |
| `TDMS_MAPPING_WARNING` | Field may cause issues during intake |

---

## 8. Stage-Specific Expected Outputs

### Stage 1 (Technical Core)

| Audit              | Expected JSONL File                  |
| ------------------ | ------------------------------------ |
| audit-code         | `audit-code-findings.jsonl`          |
| audit-security     | `audit-security-findings.jsonl`      |
| audit-performance  | `audit-performance-findings.jsonl`   |
| audit-refactoring  | `audit-refactoring-findings.jsonl`   |

### Stage 2 (Supporting)

| Audit               | Expected JSONL File                    |
| ------------------- | -------------------------------------- |
| audit-documentation | `audit-documentation-findings.jsonl`   |
| audit-process       | `audit-process-findings.jsonl`         |

### Stage 3 (Aggregation)

| Audit            | Expected JSONL File             |
| ---------------- | ------------------------------- |
| audit-aggregator | `aggregated-findings.jsonl`     |

---

## 9. Quick Reference: Valid Values

```javascript
// Categories
const VALID_CATEGORIES = [
  "security",
  "performance",
  "code-quality",
  "documentation",
  "process",
  "refactoring",
];

// Severities
const VALID_SEVERITIES = ["S0", "S1", "S2", "S3"];

// Efforts
const VALID_EFFORTS = ["E0", "E1", "E2", "E3"];

// First pass methods
const VALID_FIRST_PASS_METHODS = [
  "grep",
  "tool_output",
  "file_read",
  "code_search",
];

// Second pass methods
const VALID_SECOND_PASS_METHODS = [
  "contextual_review",
  "exploitation_test",
  "manual_verification",
];

// Tool confirmations
const VALID_TOOL_CONFIRMATIONS = [
  "eslint",
  "sonarcloud",
  "npm_audit",
  "patterns_check",
  "typescript",
  "NONE",
];
```

---

## 10. Example Valid S0 Finding

```json
{
  "category": "security",
  "title": "Missing rate limiting on login endpoint",
  "fingerprint": "security::lib/auth.ts::missing-rate-limit-login",
  "severity": "S0",
  "effort": "E1",
  "confidence": 95,
  "files": ["lib/auth.ts:45"],
  "why_it_matters": "Without rate limiting, attackers can perform brute-force password attacks, potentially compromising user accounts.",
  "suggested_fix": "Implement rate limiting using the existing rateLimiter middleware. Apply to /api/auth/login with 5 attempts per minute per IP.",
  "acceptance_tests": [
    "6th login attempt within 1 minute returns 429",
    "Successful login resets attempt counter",
    "Rate limit is per-IP not per-session"
  ],
  "verification_steps": {
    "first_pass": {
      "method": "grep",
      "evidence_collected": [
        "grep -r 'rateLimiter' lib/auth.ts returned empty",
        "No rate limiting middleware applied to login handler"
      ]
    },
    "second_pass": {
      "method": "contextual_review",
      "confirmed": true,
      "notes": "Reviewed entire auth.ts file. No rate limiting or brute-force protection present. Login attempts not logged for anomaly detection."
    },
    "tool_confirmation": {
      "tool": "patterns_check",
      "reference": "Rate limiting check not in patterns:check yet, but would fail 'auth-endpoint-security' rule"
    }
  }
}
```

---

## Version History

| Version | Date       | Description                                 |
| ------- | ---------- | ------------------------------------------- |
| 1.0     | 2026-02-03 | Initial extraction from JSONL_SCHEMA_STANDARD.md |
