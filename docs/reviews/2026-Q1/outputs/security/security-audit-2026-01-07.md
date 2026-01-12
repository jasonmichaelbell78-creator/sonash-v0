# Phase 4.2 Security Audit Results

**Audit Date:** 2026-01-07 **Models Aggregated:** Claude Opus 4.5, ChatGPT 5.2
**Overall Status:** NON_COMPLIANT **Review Entry:** #88 in
AI_REVIEW_LEARNINGS_LOG.md

---

## Purpose

This document captures the aggregated results of the Phase 4.2 multi-AI security
audit for SoNash. The audit evaluates compliance across rate limiting, input
validation, secrets management, and OWASP standards using consensus from
multiple AI models (Claude Opus 4.5 and ChatGPT 5.2).

**Scope:** Firebase Cloud Functions, Firestore Rules, client-side security
integrations **Output:** Canonical findings
([`CANON-SECURITY.jsonl`](../../canonical/CANON-SECURITY.jsonl))

**Prioritized remediation plan:** Included in this report (see "Remediation
Priority Order" below)

---

## Executive Summary

Multi-AI security audit identified **10 canonical findings** with deduplication
across models. 3 findings are Critical/High-priority requiring immediate
attention:

1. **F-001 (S0)**: Legacy Firestore path allows direct client writes bypassing
   server validation
2. **F-002 (S1)**: Rate-limiting gaps - no IP throttling, admin endpoints
   unprotected
3. **F-003 (S1)**: reCAPTCHA logs missing token but continues (fail-open)

One finding (**F-010**: App Check disabled) is documented as **Risk Accepted**
given the public API intent.

---

## 1. Consolidated Compliance Status

```json
{
  "audit_date": "2026-01-07",
  "models_aggregated": [
    "Claude Opus 4.5 (2026-01-07)",
    "ChatGPT 5.2 (2026-01-06)"
  ],
  "overall_status": "NON_COMPLIANT",
  "standards": {
    "rate_limiting": {
      "status": "NON_COMPLIANT",
      "model_votes": {
        "claude_opus_4_5": "PARTIAL",
        "chatgpt_5_2": "NON_COMPLIANT"
      },
      "rationale": [
        "Admin callable endpoints are not rate-limited (both models).",
        "No IP-based throttling (ChatGPT 5.2).",
        "Rate-limit exceeded does not consistently map to a stable resource-exhausted/429-equivalent response (ChatGPT 5.2)."
      ]
    },
    "input_validation": {
      "status": "PARTIAL",
      "model_votes": {
        "claude_opus_4_5": "PARTIAL",
        "chatgpt_5_2": "PARTIAL"
      },
      "rationale": [
        "Schemas lack .strict() allowing unknown fields (both models).",
        "Permissive z.record(..., z.unknown()) permits arbitrary nested payloads (both models).",
        "Client/server type drift: server enum missing 'step-1-worksheet' (ChatGPT 5.2)."
      ]
    },
    "secrets_management": {
      "status": "COMPLIANT",
      "model_votes": {
        "claude_opus_4_5": "COMPLIANT",
        "chatgpt_5_2": "PARTIAL"
      },
      "rationale": [
        "Claude Opus found no hardcoded secrets and proper env-var usage.",
        "ChatGPT 5.2 flagged committed .env.production as a policy concern; adjudicated COMPLIANT because it contains only public-facing configuration.",
        "F-009 is tracked as configuration integrity/hardening (rotation and environment isolation), not as a secrets leak."
      ],
      "adjudication": "Final status set to COMPLIANT because .env.production is treated as intentionally-public config and contains no private secrets (see assumptions).",
      "assumptions": [
        ".env.production contains only intentionally-public configuration values (e.g., Firebase web config / public IDs) and no private secrets."
      ]
    },
    "owasp_compliance": {
      "status": "NON_COMPLIANT",
      "model_votes": {
        "claude_opus_4_5": "PARTIAL",
        "chatgpt_5_2": "NON_COMPLIANT"
      },
      "rationale": [
        "Legacy Firestore path allows direct client writes, bypassing server-side controls (both models).",
        "reCAPTCHA is fail-open when token is missing (Claude Opus).",
        "Console logging present in security-sensitive paths / components (both models).",
        "App Check disabled was flagged by both models; stated as acceptable because the API is meant to be public-facing (tracked as 'Risk Accepted / Hardening', not a compliance blocker)."
      ]
    }
  }
}
```

---

## 2. Deduplicated Findings (JSONL)

### F-001: Legacy Firestore Direct Writes (S0 - Critical)

```json
{
  "canonical_id": "F-001",
  "vulnerability_type": {
    "custom": "Legacy Firestore direct writes bypass server-side controls",
    "owasp": ["A01", "A05"]
  },
  "title": "Legacy journalEntries collection allows direct client writes (bypasses Functions validation/rate limits)",
  "severity": "S0",
  "severity_normalization": {
    "canonical": "S0",
    "reported": ["S0", "S1"],
    "reason": "Adjudicated to S0 due to direct bypass of server-side validation/rate limiting on a legacy write path."
  },
  "effort": "E2",
  "confidence": 100,
  "files": ["firestore.rules"],
  "merged_from": [
    { "model": "Claude Opus 4.5", "severity": "S0", "confidence": 100 },
    { "model": "ChatGPT 5.2", "severity": "S1", "confidence": 100 }
  ],
  "evidence": [
    "firestore.rules allows owner create/update on /users/{userId}/journalEntries/{entryId} (both models)."
  ],
  "impact": "Owners can write unvalidated/untethered payloads directly to Firestore, bypassing any server-side schema/rate-limit/bot controls used elsewhere.",
  "remediation": {
    "steps": [
      "Migrate off /users/{userId}/journalEntries/* to the validated path (or Functions-only write path).",
      "Update firestore.rules to deny create/update on legacy path (align with newer collections).",
      "Add emulator/rules tests to prevent regression."
    ],
    "verification": [
      "Attempt direct client create/update to legacy path → denied.",
      "All journal writes succeed only via the intended secured path."
    ]
  }
}
```

### F-002: Rate-Limiting Gaps (S1 - High)

```json
{
  "canonical_id": "F-002",
  "vulnerability_type": {
    "custom": "Systemic rate limiting gaps across callable endpoints",
    "owasp": ["A04", "A07"]
  },
  "title": "Rate limiting is incomplete (no IP throttling, admin endpoints unthrottled, inconsistent 429-equivalent handling)",
  "severity": "S1",
  "effort": "E2",
  "confidence": 100,
  "files": [
    "functions/src/security-wrapper.ts",
    "functions/src/firestore-rate-limiter.ts",
    "functions/src/admin.ts"
  ],
  "merged_from": [
    { "model": "Claude Opus 4.5", "severity": "S1", "confidence": 100 },
    { "model": "ChatGPT 5.2", "severity": "S1", "confidence": 100 }
  ],
  "evidence": [
    "Admin callables have no limiter (both models).",
    "Limiter keyed by userId only; no IP-based throttling (ChatGPT 5.2).",
    "Limiter/wrapper mismatch can surface internal errors instead of stable resource-exhausted/429-equivalent (ChatGPT 5.2)."
  ],
  "impact": "Higher abuse/DoS and cost risk; weaker resilience due to unstable backoff signaling.",
  "remediation": {
    "steps": [
      "Add a secondary limiter keyed by IP (and/or App Check token/device) in addition to userId.",
      "Wrap admin callables with the same centralized limiter policy (admin-tier limits).",
      "Standardize limiter error mapping so rate-limit exceed always returns resource-exhausted (429-equivalent) with retry guidance."
    ],
    "verification": [
      "Burst calls produce consistent resource-exhausted responses.",
      "Account cycling no longer trivially bypasses throttles (IP limiter triggers).",
      "Admin callables throttle under burst."
    ]
  }
}
```

### F-003: reCAPTCHA Fail-Open (S1 - High)

```json
{
  "canonical_id": "F-003",
  "vulnerability_type": {
    "custom": "reCAPTCHA enforcement fail-open",
    "owasp": ["A07"]
  },
  "title": "reCAPTCHA token missing does not block requests (logs but continues)",
  "severity": "S1",
  "effort": "E1",
  "confidence": 100,
  "files": ["functions/src/security-wrapper.ts"],
  "merged_from": [
    { "model": "Claude Opus 4.5", "severity": "S1", "confidence": 100 }
  ],
  "evidence": [
    "Wrapper logs missing token but continues processing (Claude Opus evidence)."
  ],
  "impact": "Bot protection ineffective; automated abuse easier—especially when combined with incomplete throttling.",
  "remediation": {
    "steps": [
      "If recaptchaAction is configured for an endpoint, require a non-empty token and fail closed.",
      "Allow bypass only in explicit dev/test modes via env flag (not implicit)."
    ],
    "verification": [
      "Requests without token are rejected with a stable error.",
      "Valid tokens succeed; low-score tokens are rejected per policy."
    ]
  }
}
```

### F-004: Zod Schemas Missing .strict() (S2 - Medium)

```json
{
  "canonical_id": "F-004",
  "vulnerability_type": {
    "custom": "Non-strict request validation allows unknown fields",
    "owasp": ["A03", "A08"]
  },
  "title": "Zod schemas missing .strict() (unknown fields accepted)",
  "severity": "S2",
  "effort": "E0",
  "confidence": 100,
  "files": ["functions/src/schemas.ts"],
  "merged_from": [
    { "model": "Claude Opus 4.5", "severity": "S2", "confidence": 100 },
    { "model": "ChatGPT 5.2", "severity": "S2", "confidence": 95 }
  ],
  "evidence": [
    "No .strict() usage reported by both models; unknown fields accepted."
  ],
  "impact": "Data pollution and unexpected fields stored; increases bug surface and potential stored-content issues.",
  "remediation": {
    "steps": [
      "Add .strict() to request schemas.",
      "Add tests asserting unknown fields are rejected."
    ],
    "verification": [
      "Payload with extra fields fails validation; normal payloads succeed."
    ]
  }
}
```

### F-005: Permissive z.record (S2 - Medium)

```json
{
  "canonical_id": "F-005",
  "vulnerability_type": {
    "custom": "Untyped arbitrary nested payloads accepted for entry data",
    "owasp": ["A03", "A08"]
  },
  "title": "Permissive z.record(..., z.unknown()) allows arbitrary nested data in journal/inventory entries",
  "severity": "S2",
  "effort": "E2",
  "confidence": 95,
  "files": ["functions/src/schemas.ts"],
  "merged_from": [
    { "model": "Claude Opus 4.5", "severity": "S2", "confidence": 95 },
    { "model": "ChatGPT 5.2", "severity": "S2", "confidence": 95 }
  ],
  "evidence": [
    "Schemas use permissive z.record(..., z.unknown()) for data fields (both models)."
  ],
  "impact": "Enables oversized/odd payloads, storage abuse within Firestore limits, and higher risk of downstream rendering/logic edge cases.",
  "remediation": {
    "steps": [
      "Move to discriminated unions by entry type with per-type data schemas and size limits.",
      "Add limits on string lengths/array sizes/nesting depth as appropriate."
    ],
    "verification": [
      "Invalid per-type data rejected.",
      "Oversized payloads rejected at validation."
    ]
  }
}
```

### F-006: Client/Server Type Drift (S2 - Medium)

```json
{
  "canonical_id": "F-006",
  "vulnerability_type": {
    "custom": "Client/server contract drift for journal entry types",
    "owasp": ["A08"]
  },
  "title": "Server-side journal entry type enum missing 'step-1-worksheet' (validation drift)",
  "severity": "S2",
  "effort": "E1",
  "confidence": 95,
  "files": ["functions/src/schemas.ts"],
  "merged_from": [
    { "model": "ChatGPT 5.2", "severity": "S2", "confidence": 95 }
  ],
  "evidence": [
    "ChatGPT 5.2 reports server enum omits 'step-1-worksheet' while client emits it."
  ],
  "impact": "Valid client writes fail; can amplify retries and degrade availability/UX.",
  "remediation": {
    "steps": [
      "Establish a single source of truth for allowed types (shared package or generated types).",
      "Add contract tests to ensure client/server types stay in sync."
    ],
    "verification": ["'step-1-worksheet' saves succeed and validate correctly."]
  }
}
```

### F-007: Console Logging in Production (S2 - Medium)

```json
{
  "canonical_id": "F-007",
  "vulnerability_type": {
    "custom": "Console logging in production code paths",
    "owasp": ["A09"]
  },
  "title": "Console statements present; replace with structured logger and enforce no-console in production",
  "severity": "S2",
  "severity_normalization": {
    "canonical": "S2",
    "reported": ["S2", "S3"],
    "reason": "Adjudicated to S2 because the issue is a common, repo-wide hardening concern with potential info disclosure impact; treated as higher than S3 due to breadth across production paths."
  },
  "effort": "E1",
  "confidence": 85,
  "files": [],
  "file_globs": ["components/**", "functions/src/**", "lib/**"],
  "merged_from": [
    { "model": "Claude Opus 4.5", "severity": "S2", "confidence": 80 },
    { "model": "ChatGPT 5.2", "severity": "S3", "confidence": 90 }
  ],
  "evidence": [
    "Claude Opus counted 59 console statements across components; ChatGPT 5.2 identifies console usage in security-sensitive paths."
  ],
  "impact": "Potential info disclosure and inconsistent redaction/audit formatting; browser console exposure for end users.",
  "remediation": {
    "steps": [
      "Replace console.* with centralized logger (with redaction).",
      "Add ESLint no-console (error) and Next production removeConsole where applicable.",
      "Require PR checks to fail on console usage outside logger module(s)."
    ],
    "verification": [
      "Repo grep for console.* in production paths returns 0.",
      "Production builds emit no console logs from app code."
    ]
  }
}
```

### F-008: Admin Direct Writes (S2 - Medium)

```json
{
  "canonical_id": "F-008",
  "vulnerability_type": {
    "custom": "Admin data writes bypass server-side schema validation (direct Firestore writes)",
    "owasp": ["A04", "A05"]
  },
  "title": "Some admin-managed collections allow direct client writes without centralized schema/rate-limit protections",
  "severity": "S2",
  "effort": "E1",
  "confidence": 90,
  "files": ["firestore.rules", "lib/db/library.ts"],
  "merged_from": [
    { "model": "ChatGPT 5.2", "severity": "S2", "confidence": 90 },
    { "model": "Claude Opus 4.5", "severity": "S2", "confidence": 30 }
  ],
  "evidence": [
    "ChatGPT 5.2: rules permit admin writes to some collections and client code writes directly (e.g., prayers)."
  ],
  "impact": "If admin session is compromised, attacker can write malformed/oversized content directly; bypasses centralized validation pattern.",
  "remediation": {
    "steps": [
      "Prefer routing admin writes through callable/admin Functions that enforce schemas + throttles.",
      "If direct writes remain, add strict client-side validation and tighten rules where feasible (field allowlists/length limits)."
    ],
    "verification": [
      "Admin UI writes flow through validated Functions (preferred) or are schema-validated before Firestore writes."
    ]
  }
}
```

### F-009: Hardcoded reCAPTCHA Fallback (S2 - Medium)

```json
{
  "canonical_id": "F-009",
  "vulnerability_type": {
    "custom": "Hardcoded reCAPTCHA site key fallback (config integrity)",
    "owasp": ["A05"]
  },
  "title": "Hardcoded fallback reCAPTCHA site key in server verification code (config integrity/rotation risk)",
  "severity": "S2",
  "effort": "E1",
  "confidence": 100,
  "files": ["functions/src/recaptcha-verify.ts"],
  "merged_from": [
    { "model": "ChatGPT 5.2", "severity": "S2", "confidence": 100 }
  ],
  "evidence": [
    "ChatGPT 5.2 reports a hardcoded fallback site key path in recaptcha verification."
  ],
  "impact": "Silent misconfiguration risk and harder key rotation/environment isolation (not treated here as a secret leak).",
  "remediation": {
    "steps": [
      "Remove hardcoded fallback; require env vars to be set.",
      "Fail closed with a clear failed-precondition error if required config is missing."
    ],
    "verification": [
      "Unset env var → function refuses to proceed with clear error; set env var → verification succeeds."
    ]
  }
}
```

### F-010: App Check Disabled (S3 - Risk Accepted)

```json
{
  "canonical_id": "F-010",
  "vulnerability_type": {
    "custom": "App Check disabled (risk accepted / hardening)",
    "owasp": ["A04", "A05"]
  },
  "title": "App Check disabled on Functions and client init disabled (tracked as risk-accepted hardening item)",
  "severity": "S3",
  "severity_normalization": {
    "canonical": "S3",
    "reported": ["S0", "S0"],
    "reason": "Risk accepted due to public API intent; tracked as optional hardening provided compensating controls exist.",
    "contingency": "Risk acceptance is contingent on F-002 (rate limiting) and F-003 (reCAPTCHA fail-closed) being resolved first."
  },
  "effort": "E1",
  "confidence": 100,
  "files": ["functions/src/index.ts", "lib/firebase.ts"],
  "merged_from": [
    { "model": "Claude Opus 4.5", "severity": "S0", "confidence": 100 },
    { "model": "ChatGPT 5.2", "severity": "S0", "confidence": 100 }
  ],
  "evidence": [
    "Both models: requireAppCheck:false on callables; client App Check initialization commented out."
  ],
  "impact": "Reduces device-attestation defense-in-depth and increases automated abuse feasibility.",
  "remediation": {
    "steps": [
      "(If you later choose to enforce) enable App Check on server wrappers + restore client init.",
      "Add monitoring for App Check failures and volume anomalies."
    ],
    "verification": [
      "Calls without App Check token are rejected (if enabled); legit clients succeed."
    ],
    "notes": "Explicitly stated NOT a violation because the API is intended to be public-facing. Included as optional hardening / risk-tracked item, not as a compliance blocker. Risk acceptance becomes effective only after F-002 and F-003 are remediated and verified; until then F-010 remains a tracked risk requiring compensating controls.",
    "dependencies": ["F-002", "F-003"]
  }
}
```

---

## 3. Remediation Plan (Priority Ordered)

| Priority | Title                                                 | Findings            | Effort | Exit Criteria                                                                                                                         |
| -------- | ----------------------------------------------------- | ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **1**    | Eliminate legacy journalEntries direct-write bypass   | F-001               | E2     | Direct client writes to legacy path denied                                                                                            |
| **2**    | Complete rate limiting (IP + user, admin, stable 429) | F-002               | E2     | Bursts return resource-exhausted consistently                                                                                         |
| **3**    | reCAPTCHA fail-closed where configured                | F-003               | E1     | Missing token rejected                                                                                                                |
| **4**    | Validation tightening (.strict() + typed payloads)    | F-004, F-005, F-006 | E2     | Unknown fields rejected; types in sync                                                                                                |
| **5**    | Eliminate console.\* from production                  | F-007               | E1     | No console.\* in production; CI fails on new                                                                                          |
| **6**    | Harden admin write model (prefer Functions)           | F-008               | E1     | Admin writes follow validated policy path                                                                                             |
| **7**    | Remove hardcoded reCAPTCHA fallback                   | F-009               | E1     | Missing env vars produce explicit failure                                                                                             |
| **8**    | Document App Check risk acceptance                    | F-010               | E1     | F-002 and F-003 remediated and validated per their verification criteria; risk acceptance documented; monitoring baseline established |

---

## 4. Human Summary

### What models agreed is real and high-risk (fix first):

1. **Legacy Firestore bypass**: `/users/{userId}/journalEntries/*` allows direct
   client writes, bypassing server-side security pattern. (S0, both models) →
   Block direct writes + migrate.

2. **Rate-limiting gaps**: Admin endpoints aren't throttled; throttling is
   userId-only (no IP limits); and rate-limit errors aren't consistently
   returned as stable "429-equivalent." (S1, both models) → IP + user
   throttling, cover admin, stabilize error mapping.

3. **reCAPTCHA fail-open**: Missing token logs but does not block. (S1, Claude
   Opus) → Fail closed wherever configured.

### Hardening that reduces bugs/abuse surface (next):

- **Validation tightening**: Add `.strict()` and replace permissive
  `z.record(..., z.unknown())` with typed per-entry schemas; fix client/server
  type drift (`step-1-worksheet`). (S2)

- **Remove console.\* in production**: Enforce via lint/build and use structured
  logger with redaction. (S2)

### Explicit decisions captured:

- **Committed .env.production** is NOT a secrets violation (treated as public
  config); Secrets Management is marked COMPLIANT, with F-009 tracked as
  configuration integrity/hardening (not a secrets leak).

- **App Check disabled** is included as optional hardening / risk-tracked item
  (both models call it critical), but NOT treated as a compliance blocker given
  "public API" intent. **F-010 risk acceptance is contingent on F-002 (complete
  rate limiting including IP throttling and admin protection) and F-003
  (reCAPTCHA fail-closed) being resolved first; risk acceptance status becomes
  valid only after remediation completion and validation per the verification
  criteria defined in F-002 and F-003 sections above.**

---

## 5. Next Steps

1. **Step 4B: Remediation Sprint** - Address findings in priority order
2. **Track progress** - Update this document as findings are resolved
3. **Re-audit** - Run security audit again after remediation complete

---

## Version History

| Version | Date       | Changes                                                                                                                                                                                     | Author |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1.0     | 2026-01-07 | Initial multi-AI security audit                                                                                                                                                             | Claude |
| 1.1     | 2026-01-07 | F-010 severity S0→S3 (risk accepted), secrets_management adjudication                                                                                                                       | Claude |
| 1.2     | 2026-01-07 | Added severity_normalization field to F-010                                                                                                                                                 | Claude |
| 1.3     | 2026-01-07 | Moved report to [`docs/reviews/2026-Q1/outputs/security/`](./), canonical findings to [`../../canonical/CANON-SECURITY.jsonl`](../../canonical/CANON-SECURITY.jsonl), added Purpose section | Claude |

---

**Document Version:** 1.3 **Created:** 2026-01-07 **Last Updated:** 2026-01-07
