# Multi-AI Refactor Audit Prompt Template

**Document Tier:** 3 (Template) **Status:** Active **Last Updated:** 2026-01-05

---

## Purpose

This template provides a standardized prompt for running refactor audits across
multiple AI coding assistants. Use it to identify cross-cutting duplication,
inconsistencies, and tech debt in the codebase.

**Related Templates:**

- [MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md](./MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md) -
  Code review audits
- [MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md](./MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md) -
  Security audits
- [MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md](./MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md) -
  Performance audits

---

## Quick Start

1. Copy the **Main Prompt** section below
2. Paste into your AI assistant (Claude Code, Codex, Copilot, Gemini Jules,
   etc.)
3. For tool-capable agents, also include the **Tool Checklist Addendum**
4. Collect FINDINGS_JSONL output for aggregation

---

## Recommended AI Run Order

For maximum signal, run audits in this order:

| Order | AI Tool                    | Strengths                                         |
| ----- | -------------------------- | ------------------------------------------------- |
| 1     | Claude Code (tool-capable) | Repo-wide audits, grep-based proof                |
| 2     | Codex (tool-capable)       | Refactor detection, TS ergonomics                 |
| 3     | Copilot (IDE)              | Local pattern spotting, quick confirmations       |
| 4     | Gemini Jules               | Second opinion, alternative refactor lens         |
| 5     | Kimi K2                    | Extra coverage (may have more suspected findings) |

---

## Main Prompt

### ROLE

You are a senior TypeScript/Next.js engineer performing a refactor audit on a
repo that was "vibe coded" by multiple AI agents. Your #1 priority is
cross-cutting duplication/inconsistency across the codebase.

### REPO

https://github.com/jasonmichaelbell78-creator/sonash-v0

### STACK / CONTEXT (treat as true)

- Next.js 16.1 (App Router), React 19.2.3, TypeScript 5.x
- Tailwind CSS v4, Framer Motion 12, shadcn/ui
- Firebase: Auth, Firestore, Cloud Functions v2, App Check
- Security: reCAPTCHA v3, App Check, Firestore Rules, rate-limiting
- Quality gates: npm run lint, npm test, npm run test:coverage
- Client-side Firestore path validation mirrors rules:
  lib/security/firestore-validation.ts

### SCOPE

**Include:** app/, components/, hooks/, lib/, functions/, tests/, types/

**Secondary (only if relevant):** scripts/, styles/, data/

**Exclude:** docs/, public/ (unless a finding depends on it)

### CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

```
CAPABILITIES: browse_files=<yes/no>, run_commands=<yes/no>, repo_checkout=<yes/no>, limitations="<one sentence>"
```

### NON-NEGOTIABLE EVIDENCE RULE (ANTI-HALLUCINATION)

A finding is CONFIRMED only if it includes:

- at least one concrete file path AND
- at least one primary symbol name (component/function/type) from those files

If you cannot provide both, put it in SUSPECTED_FINDINGS with confidence <= 40.

### FOCUS AREAS (use ONLY these categories)

1. Hygiene/Duplication
2. Types/Correctness
3. Next/React Boundaries
4. Security (Firebase/Auth/Rules/App Check)
5. Testing

### WHAT TO FIND (PRIORITY ORDER)

**PASS 1 — Cross-cutting duplication/inconsistency (highest priority)**

Identify duplicated or inconsistent implementations across multiple areas,
especially:

- Firebase init/service wrappers, auth guards, Firestore read/write helpers,
  path validation, rate-limiting, logging/audit, analytics
- UI primitives duplicated outside components/ui
  (buttons/cards/modals/toasts/spinners/loading states)
- Repeated hook patterns (state sync, localStorage, keyboard shortcuts,
  scrolling, prompts, networking/offline)
- Repeated types/enums/constants (entry types, statuses, feature flags, routes,
  Firestore paths)

For each duplication cluster: produce ONE consolidated finding with a list of
the duplicated files/symbols.

**PASS 2 — Types/Correctness**

- any/unknown leakage, inconsistent domain types, nullable handling, unsafe
  casts
- places where runtime validation should match TS types (esp. data in/out of
  Firestore)

**PASS 3 — Next/React Boundaries + Security + Tests (only after pass 1 is
done)**

- Server vs client component boundary issues, data fetching patterns, state
  placement
- Trust boundaries: where client code assumes privileges; rules alignment;
  secrets/config; App Check usage assumptions
- Missing or weak tests around shared helpers and security-critical code paths

### OPTIONAL: TOOL EVIDENCE (ONLY IF you can run commands)

If run_commands=yes and repo_checkout=yes:

- Prefer to support PASS 1 claims with at least one "hard artifact" per major
  cluster:
  - search output (grep/ripgrep) OR
  - duplication scan output OR
  - lint/type/test output that points at repeated patterns

If you cannot run tools, proceed with static browsing and keep confidence lower
for cross-cutting claims.

### OUTPUT FORMAT (STRICT)

Return 3 sections in this exact order.

**⚠️ NO CODE FENCES:** Output raw JSONL lines directly — do NOT wrap
FINDINGS_JSONL, SUSPECTED_FINDINGS_JSONL, or HUMAN_SUMMARY in Markdown fenced
code blocks (including ` ```json ` blocks). The schema example below is for
reference only.

**1) FINDINGS_JSONL**

(one JSON object per line, each object must be valid JSON)

Schema (reference only — do not copy formatting):

- category: "Hygiene/Duplication" | "Types/Correctness" | "Next/React
  Boundaries" | "Security" | "Testing"
- title: "short, specific description"
- fingerprint: "<category>::<primary_file>::<primary_symbol>::<problem_slug>"
- severity: "S0" | "S1" | "S2" | "S3"
- effort: "E0" | "E1" | "E2" | "E3"
- confidence: 0-100 (integer)
- files: ["path/to/file1.ts", "path/to/file2.tsx"]
- symbols: ["ComponentA", "functionB"]
- duplication_cluster: see below
- why_it_matters: "1-3 sentences explaining impact"
- suggested_fix: "concrete refactor direction (no full rewrites)"
- acceptance_tests: ["what to run/verify after change"]
- pr_bucket_suggestion: "firebase-access" | "ui-primitives" |
  "hooks-standardization" | "types-domain" | "boundaries" | "security-hardening"
  | "tests-hardening" | "misc"
- dependencies: [] (array of fingerprints this depends on, or empty)
- evidence: [] (optional: short grep output or tool summary)
- notes: "" (optional additional context)

**duplication_cluster format:**

When the finding IS a duplication cluster:
`"duplication_cluster": { "is_cluster": true, "cluster_summary": "describe the repeated pattern", "instances": [{"file": "path1.ts", "symbol": "funcA"}, {"file": "path2.ts", "symbol": "funcB"}] }`

When the finding is NOT a duplication cluster:
`"duplication_cluster": { "is_cluster": false, "cluster_summary": "", "instances": [] }`

**Severity guide:**

- S0: high-risk security/data loss/major bug
- S1: likely bug/perf/security footgun
- S2: maintainability drag/inconsistency/duplication
- S3: cosmetic cleanup

**Effort guide:**

- E0: minutes
- E1: hours
- E2: 1–3 days or staged PR
- E3: multi-PR/multi-week (avoid unless unavoidable)

**2) SUSPECTED_FINDINGS_JSONL**

(same schema, but confidence <= 40; evidence missing file+symbol OR claim is
broad)

**3) HUMAN_SUMMARY (markdown)**

- Top duplication clusters (5–10 bullets)
- Top 5 high-risk items (S0/S1)
- "Do next" shortlist (<= 10 items) emphasizing small, reviewable PRs

---

## Tool Checklist Addendum

Use this as a second message only to tool-capable agents (Claude Code, Codex,
Copilot-in-IDE, Jules), after the main prompt:

```
If (run_commands=yes AND repo_checkout=yes), prioritize PASS 1 duplication with these checks (do not install heavy tooling unless already present):

1) Quality gates (capture only failures + file paths):
- npm run lint
- npm test
- npm run test:coverage

2) Cross-cutting duplication triangulation (pick 2–4 that are available):
- ripgrep searches for repeated patterns (firebase init, getFirestore(), collection paths, auth guards, "use client", localStorage keys, feature flags)
- ts/prune-style check for unused exports (if available)
- circular dependency check (if available)
- duplication scan (if available)

In evidence, paste only the minimal excerpt needed to support the finding (e.g., file paths + 1–3 matching lines).
If a command is not available, write "SKIPPED: <reason>" and continue.
```

---

## AI Instructions

**For AI Assistants using this template:**

1. **Before running audit**: Update REPO and STACK sections if project details
   have changed
2. **During audit**: Follow PASS 1→2→3 order strictly
3. **Evidence requirements**: Every CONFIRMED finding must have file path +
   symbol
4. **Output format**: Use JSONL (one JSON per line), not JSON arrays
5. **After audit**: Feed FINDINGS_JSONL to aggregator template

**Template updates**: If you modify this template, update the Version History
below.

---

## Version History

| Version | Date       | Changes                                                                                                        |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| 1.1     | 2026-01-05 | Added template structure (H1, Purpose, Quick Start, AI Instructions, Version History) for docs-lint compliance |
| 1.0     | 2025-12-30 | Initial prompt created                                                                                         |

---

**END OF TEMPLATE**
