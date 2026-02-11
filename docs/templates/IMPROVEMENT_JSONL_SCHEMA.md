<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-11
**Status:** DRAFT
<!-- prettier-ignore-end -->

# Improvement JSONL Schema Standard

**Version**: 1.0 **Status**: Active **Related**:
[JSONL_SCHEMA_STANDARD.md](./JSONL_SCHEMA_STANDARD.md) (TDMS equivalent)

---

## Overview

The Improvement Management System (IMS) tracks enhancement opportunities
discovered through audits. Unlike TDMS (which tracks technical debt - things
that are _wrong_), IMS tracks things that could be _better_.

**Canonical store**: `docs/improvements/MASTER_IMPROVEMENTS.jsonl` **Schema
config**: `scripts/config/improvement-schema.json`

---

## Base Schema

Every improvement item MUST include these fields:

| Field                   | Type   | Required | Description                                 |
| ----------------------- | ------ | -------- | ------------------------------------------- |
| `id`                    | string | Yes      | Unique ID: `ENH-XXXX` format                |
| `category`              | string | Yes      | One of 10 valid categories                  |
| `title`                 | string | Yes      | Short, specific description                 |
| `fingerprint`           | string | Yes      | `category::file_or_scope::improvement-slug` |
| `impact`                | string | Yes      | `I0` \| `I1` \| `I2` \| `I3`                |
| `effort`                | string | Yes      | `E0` \| `E1` \| `E2` \| `E3`                |
| `confidence`            | number | Yes      | 0-100 (threshold: 70+)                      |
| `status`                | string | Yes      | Lifecycle status                            |
| `files`                 | array  | Yes      | Affected files with line refs               |
| `current_approach`      | string | Yes      | What exists now and why                     |
| `proposed_outcome`      | string | Yes      | What the improved version looks like        |
| `counter_argument`      | string | Yes      | Why NOT to make this change                 |
| `why_it_matters`        | string | Yes      | The benefit if implemented                  |
| `suggested_fix`         | string | No       | Concrete implementation direction           |
| `concrete_alternatives` | array  | No       | Named libraries, patterns, approaches       |
| `implementation_notes`  | string | No       | Guidance for Claude Code                    |
| `affected_workflows`    | array  | No       | Dev lifecycle or user-facing flows          |
| `dependencies`          | array  | No       | `ENH-XXXX`, `DEBT-XXXX`, other              |
| `risk_assessment`       | string | No       | What could go wrong                         |
| `tdms_crossref`         | array  | No       | Related `DEBT-XXXX` items                   |
| `acceptance_tests`      | array  | No       | Verification steps                          |
| `evidence`              | array  | No       | Grep output, benchmarks, snippets           |
| `benchmarks`            | object | No       | Competitor/peer comparisons                 |
| `content_hash`          | string | No       | SHA-256 for dedup                           |
| `source_audit`          | string | No       | Source audit identifier                     |
| `created`               | string | No       | ISO date created                            |
| `decided_date`          | string | No       | ISO date decision made                      |
| `decision_notes`        | string | No       | Reason for accept/decline/defer             |

---

## Impact Scale

| Level  | Name           | Definition                                                                       | Examples                                                             |
| ------ | -------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **I0** | Transformative | Changes how things fundamentally work. Significant user or dev experience shift. | New architecture pattern, major UX overhaul, workflow transformation |
| **I1** | Significant    | Meaningful, measurable improvement to quality, speed, or experience.             | Component consolidation, testing strategy change, content rewrite    |
| **I2** | Moderate       | Nice-to-have improvement. Incremental benefit.                                   | Config optimization, better error messages, minor UX tweak           |
| **I3** | Minor          | Polish. Small quality-of-life improvement.                                       | Naming consistency, slightly better logging, micro-optimization      |

---

## Effort Scale

| Level  | Name    | Estimate         |
| ------ | ------- | ---------------- |
| **E0** | Trivial | < 30 minutes     |
| **E1** | Small   | 30 min - 2 hours |
| **E2** | Medium  | 2 hours - 1 day  |
| **E3** | Large   | Multiple days    |

---

## Valid Categories

| Category                 | Description                                                           |
| ------------------------ | --------------------------------------------------------------------- |
| `app-architecture`       | Component patterns, state management, data flow, code organization    |
| `product-ux`             | User journeys, accessibility, interaction patterns, responsive design |
| `content`                | Microcopy, button labels, error messages, onboarding text             |
| `devx-automation`        | Scripts, hooks, skills, CI/CD, pre-commit pipeline                    |
| `infrastructure`         | Firebase config, build config, dependencies, deployment               |
| `testing-strategy`       | Test patterns, coverage approach, maintenance burden                  |
| `documentation-strategy` | Doc organization, freshness, usefulness                               |
| `workflow-lifecycle`     | Dev lifecycle mapping, session patterns, friction points              |
| `external-services`      | Firebase, Sentry, analytics, hosting config                           |
| `meta-tooling`           | Audit system, skill system, TDMS/IMS tooling itself                   |

---

## Status Lifecycle

```
PROPOSED → ACCEPTED → IMPLEMENTED
    │          │
    ├→ DECLINED (with decision_notes)
    │
    ├→ DEFERRED (re-evaluate later)
    │
    └→ STALE (context changed, re-evaluate)
```

- **PROPOSED**: Discovered by audit, awaiting review
- **ACCEPTED**: Approved for implementation
- **DECLINED**: Reviewed and rejected (reason recorded)
- **DEFERRED**: Good idea, wrong time (re-evaluate on change)
- **IMPLEMENTED**: Successfully completed
- **STALE**: Context changed, needs re-evaluation

---

## Fingerprint Convention

```
<category>::<file_or_scope>::<improvement-slug>
```

Examples:

- `app-architecture::components/auth::consolidate-auth-forms`
- `product-ux::app/dashboard::add-keyboard-navigation`
- `content::components/onboarding::improve-welcome-copy`
- `devx-automation::scripts/hooks::parallel-pre-commit`
- `meta-tooling::scripts/debt::unified-debt-cli`

---

## Confidence Classification

| Level  | Range   | Meaning                                                      |
| ------ | ------- | ------------------------------------------------------------ |
| HIGH   | 90-100% | Strong evidence, clear benefit, well-understood trade-offs   |
| MEDIUM | 70-89%  | Good evidence, reasonable benefit, some unknowns             |
| LOW    | <70%    | Uncertain benefit, limited evidence - goes to "Inconclusive" |

Items with confidence below 70% are excluded from main findings and placed in
the "Inconclusive" section of audit reports.

---

## Honesty Guardrails

1. **Mandatory counter-argument**: Every finding MUST have a non-empty
   `counter_argument`. If no genuine reason not to make the change exists, the
   finding is suspect.
2. **Confidence threshold**: Below 70% → Inconclusive section
3. **Evidence requirement**: Concrete file path + specific indicator required
4. **No-change validation**: Auditors must list areas evaluated and found
   adequate

---

## Relationship to TDMS

IMS is **parallel** to TDMS, not a replacement:

| Aspect          | TDMS                          | IMS                                           |
| --------------- | ----------------------------- | --------------------------------------------- |
| Tracks          | Things that are wrong         | Things that could be better                   |
| ID prefix       | `DEBT-`                       | `ENH-`                                        |
| Severity/Impact | S0-S3 (severity)              | I0-I3 (impact)                                |
| Default status  | NEW                           | PROPOSED                                      |
| Store           | `docs/debt/MASTER_DEBT.jsonl` | `docs/improvements/MASTER_IMPROVEMENTS.jsonl` |
| Scripts         | `scripts/debt/`               | `scripts/improvements/`                       |

Cross-referencing: IMS items can reference TDMS items via `tdms_crossref` field
when an improvement relates to existing debt.

---

## Example Finding

```json
{
  "id": "ENH-0001",
  "category": "app-architecture",
  "title": "Consolidate duplicate form validation logic across auth components",
  "fingerprint": "app-architecture::components/auth::consolidate-form-validation",
  "impact": "I1",
  "effort": "E2",
  "confidence": 85,
  "status": "PROPOSED",
  "files": [
    "components/auth/LoginForm.tsx:45",
    "components/auth/RegisterForm.tsx:62",
    "components/auth/ResetPasswordForm.tsx:38"
  ],
  "current_approach": "Each auth form implements its own validation logic with similar but slightly different patterns. This was done organically as each form was built independently.",
  "proposed_outcome": "Shared validation hook (useAuthValidation) that all auth forms consume, with form-specific overrides where needed.",
  "counter_argument": "The current approach works fine and each form's validation is slightly different. A shared hook adds coupling between forms and a new abstraction to maintain. If forms diverge further, the shared hook becomes awkward.",
  "why_it_matters": "Reduces code duplication (~120 lines), ensures consistent validation behavior, and makes it easier to add new validation rules across all auth forms at once.",
  "suggested_fix": "Create hooks/useAuthValidation.ts with shared email, password, and name validation. Each form imports and extends as needed.",
  "concrete_alternatives": [
    "Zod schema composition",
    "React Hook Form resolver pattern",
    "Shared validation utilities (non-hook)"
  ],
  "implementation_notes": "Check if react-hook-form is already used. If so, use its resolver pattern with Zod schemas.",
  "affected_workflows": ["user registration", "user login", "password reset"],
  "dependencies": [],
  "risk_assessment": "Low risk - validation logic is well-tested. Main risk is edge cases in form-specific validation being lost during consolidation.",
  "tdms_crossref": ["DEBT-0234"],
  "acceptance_tests": [
    "All auth forms pass existing tests",
    "Validation behavior is identical before and after",
    "No regression in error message display"
  ],
  "evidence": [
    "grep shows 3 files with similar email regex patterns",
    "LoginForm and RegisterForm share 85% validation logic"
  ],
  "benchmarks": {},
  "content_hash": "a1b2c3d4e5f6...",
  "source_audit": "audit-enhancements-2026-02-11",
  "created": "2026-02-11",
  "decided_date": null,
  "decision_notes": null
}
```

---

## Ingestion

```bash
# Ingest audit findings into IMS
node scripts/improvements/intake-audit.js <audit-output.jsonl> --source "audit-enhancements-YYYY-MM-DD"

# Validate schema
node scripts/improvements/validate-schema.js

# Generate views
node scripts/improvements/generate-views.js

# Generate metrics
node scripts/improvements/generate-metrics.js
```
