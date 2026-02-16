# CANON Quick Reference Card

**Version:** 1.1 | **Created:** 2026-01-11 | **Last Updated:** 2026-02-07

---

## Purpose

One-page quick reference for Multi-AI audits. Distilled from the 400+ line
docs/audits/multi-ai/templates/AGGREGATOR.md to provide essential schema, format
rules, and validation commands at a glance.

## Version History

| Version | Date       | Changes                                                     |
| ------- | ---------- | ----------------------------------------------------------- |
| 1.1     | 2026-02-07 | Domain-level categories, added engineering-productivity row |
| 1.0     | 2026-01-11 | Initial quick reference                                     |

---

## Required Schema (All 20 Fields)

```json
{
  "canonical_id": "CANON-0001",
  "category": "<see list below>",
  "title": "Short, actionable title",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "status": "CONFIRMED|SUSPECTED",
  "final_confidence": 0-100,
  "consensus_score": 0-5,
  "sources": ["model1", "model2"],
  "confirmations": 1,
  "suspects": 0,
  "tool_confirmed_sources": 1,
  "verification_status": "VERIFIED|PARTIALLY_VERIFIED|UNVERIFIED|SKIPPED",
  "verification_notes": "Brief note",
  "files": ["path/to/file.ts"],
  "symbols": ["functionName", "ClassName"],
  "why_it_matters": "Impact statement",
  "suggested_fix": "Remediation guidance",
  "acceptance_tests": ["npm test", "npm run lint"],
  "pr_bucket_suggestion": "security-hardening|types-domain|...",
  "dependencies": ["CANON-0002"]
}
```

---

## ID Format Rules

| Rule      | Correct           | Wrong                 |
| --------- | ----------------- | --------------------- |
| Prefix    | `CANON-`          | `F-`, `PERF-`, `REF-` |
| Numbering | `0001` (4 digits) | `001`, `1`            |
| Category  | In filename only  | `CANON-R-001`         |
| Example   | `CANON-0042`      | `PERF-042`, `F-010`   |

**File naming:** `CANON-<CATEGORY>.jsonl` (e.g., `CANON-SECURITY.jsonl`)

---

## Severity Scale

| Level | Label    | Definition                               | Action                  |
| ----- | -------- | ---------------------------------------- | ----------------------- |
| S0    | Critical | Security vuln, data loss, system failure | Fix immediately         |
| S1    | High     | Significant security/correctness issue   | Fix within sprint       |
| S2    | Medium   | Code quality, moderate risk              | Schedule fix            |
| S3    | Low      | Minor improvement, suspected             | Batch with related work |

---

## Effort Scale

| Level | Time      | Description                                  |
| ----- | --------- | -------------------------------------------- |
| E0    | < 1 hour  | Quick fix, simple change                     |
| E1    | 1-4 hours | Medium change, some refactoring              |
| E2    | 4-8 hours | Larger refactor, multiple files, needs tests |
| E3    | 8+ hours  | Major refactor, architecture change          |

---

## Category Values by Audit Type

> **Important:** The `category` field MUST be the domain-level value from
> `docs/templates/JSONL_SCHEMA_STANDARD.md` (treat as enum, not free text).
> Sub-categories belong in the `fingerprint` or `title` fields only.

| Audit Type               | `category` Value           | Sub-categories (for fingerprint/title only)                             |
| ------------------------ | -------------------------- | ----------------------------------------------------------------------- |
| Code Review              | `code-quality`             | Hygiene/Duplication, Types/Correctness, Boundaries, Security, Testing   |
| Security                 | `security`                 | Rate Limiting, Input Validation, Secrets, Auth, Firebase, OWASP         |
| Performance              | `performance`              | Bundle Size, Rendering, Data Fetching, Memory, Core Web Vitals          |
| Refactoring              | `refactoring`              | Hygiene, Types, Architecture, Security Hardening, Testing Infra         |
| Documentation            | `documentation`            | Cross-Reference, Staleness, Coverage Gaps, Tier Compliance, Frontmatter |
| Process                  | `process`                  | CI/CD, Hooks, Scripts, Pattern Checker, Triggers, Workflow Docs         |
| Engineering Productivity | `engineering-productivity` | GoldenPath, Debugging, Offline                                          |

---

## Consensus Scoring

| Points  | Condition                                   |
| ------- | ------------------------------------------- |
| +2      | >= 2 confirmed sources                      |
| +1      | >= 3 total sources (confirmed or suspected) |
| +1      | Any tool_confirmed_sources >= 1             |
| +1      | Shared evidence overlap (file/symbol)       |
| **Max** | 5                                           |

---

## PR Bucket Suggestions

| Bucket                | Use For                                        |
| --------------------- | ---------------------------------------------- |
| security-hardening    | Auth, validation, rate limiting, App Check     |
| types-domain          | Type definitions, Zod schemas, type guards     |
| hooks-standardization | useJournal, error handling, service extraction |
| boundaries            | Client/server split, service layer, components |
| firebase-access       | Collection helpers, CRUD patterns, queries     |
| tests-hardening       | Coverage gaps, emulator tests, security tests  |
| ui-primitives         | Component consolidation, variants              |
| performance           | SSR, virtualization, lazy loading              |
| process               | CI/CD, hooks, workflows                        |
| docs                  | Links, metadata, content                       |
| misc                  | Batch fixes, low-priority items                |

---

## Validation Command

```bash
# Run BEFORE completing each category
npm run validate:canon
```

**Expected output:** `All CANON files pass schema validation`

---

## Mid-Process Checkpoint

Before starting a new category audit:

1. [ ] Run `npm run validate:canon` on completed files
2. [ ] Review prior CANON file for format consistency
3. [ ] Verify ID numbering continues from last file
4. [ ] Check schema compliance matches this card

---

## Quick Validation Checklist

- [ ] All IDs are `CANON-XXXX` format
- [ ] All 20 required fields present
- [ ] Severity is S0-S3
- [ ] Effort is E0-E3
- [ ] status is CONFIRMED or SUSPECTED
- [ ] files array is non-empty
- [ ] Category matches audit type

---

**Full Template:** `docs/templates/docs/audits/multi-ai/templates/AGGREGATOR.md`
(400+ lines) **Schema Definition:** `docs/standards/JSONL_SCHEMA_STANDARD.md`
**Validation Script:** `scripts/validate-canon-schema.js`
