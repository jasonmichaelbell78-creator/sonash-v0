# SoNash Multi-AI Code Review Plan - 2026 Q1

**Document Version:** 1.0
**Created:** 2026-01-06
**Last Updated:** 2026-01-06
**Status:** COMPLETE
**Overall Completion:** 100%

---

## Purpose

This document serves as the **execution plan** for running a multi-AI code quality review on SoNash as part of **Step 4.2** of the Integrated Improvement Plan.

**Triggers for this review:**
- 47 commits since last formal review
- 48 files modified (threshold: 25)
- Step 4.2 of Integrated Improvement Plan

**Expected Output:** Ranked list of canonical findings (`CANON-CODE.jsonl`) with PR implementation plan.

---

## Status Dashboard

| Step | Description | Status | Completion |
|------|-------------|--------|------------|
| Step 1 | Prepare review context | COMPLETE | 100% |
| Step 2 | Run multi-AI review (3+ models) | COMPLETE | 100% |
| Step 3 | Collect and validate outputs | COMPLETE | 100% |
| Step 4 | Run aggregation | COMPLETE | 100% |
| Step 5 | Create canonical findings doc | COMPLETE | 100% |
| Step 6 | Generate PR plan | COMPLETE | 100% |

**Overall Progress:** 6/6 steps complete

**Output Files:**
- `2026-q1-code-review/CODE_REVIEW_2026_Q1.md` - Canonical findings document
- `2026-q1-code-review/CANON-CODE.jsonl` - Raw JSONL findings
- `2026-q1-code-review/PR_PLAN.json` - Implementation roadmap

---

## Review Context

### Repository Information

```
Repository URL: https://github.com/jasonmichaelbell78-creator/sonash-v0
Branch: main (audit from claude/new-session-YUxGa)
Commit: 26dea38294c7e6b08b36fda54a185db882622969
Last Review Date: 2025-12-30 (initial multi-AI review)
```

### Tech Stack

```
- Framework: Next.js 16.1.1
- UI Library: React 19.2.3
- Language: TypeScript 5.x
- Styling: Tailwind CSS v4, Framer Motion 12
- Backend: Firebase (Auth, Firestore, Cloud Functions, App Check)
- Security: reCAPTCHA Enterprise (optional), Firestore Rules, App Check (disabled)
- Testing: Jest, React Testing Library
- Quality gates: npm run lint, npm test, npm run patterns:check
```

### Scope

```
Include: app/, components/, hooks/, lib/, functions/src/, types/
Secondary: scripts/, tests/
Exclude: docs/, public/, node_modules/, .next/, coverage/
```

### Files in Scope

- **Source files:** 389 TypeScript/TSX files
- **Cloud Functions:** functions/src/

### Recent Changes Summary (Since Last Review)

Major work completed since last formal review:
1. **Step 4.1 Complete:** Updated 6 audit templates for multi-AI review framework
2. **Reviews #62-68:** Processed 7 CodeRabbit/Qodo reviews with 90+ fixes
3. **FIREBASE_CHANGE_POLICY.md:** Created comprehensive Firebase security review requirements
4. **Key rotation policy:** Added to SECURITY.md
5. **Aggregator rewrite:** 2-tier aggregation strategy (v2.0)
6. **claude.md refactor:** Reduced from 314 to 115 lines (63% reduction)
7. **SonarQube integration:** 778 issues documented as baseline

### Baseline Metrics

| Metric | Value | Source |
|--------|-------|--------|
| Tests | 115/116 passing (1 skipped) | `npm test` |
| Lint errors | 0 | `npm run lint` |
| Lint warnings | 181 (audited false positives) | `npm run lint` |
| Pattern violations | 0 | `npm run patterns:check` |
| Circular dependencies | 0 | `npm run deps:circular` |
| SonarQube issues | 778 (47 CRITICAL) | `sonarqube-manifest.md` |

---

## AI Models Configuration

**Selected models for this review:**

| Model | Capabilities | Role |
|-------|--------------|------|
| Claude Opus 4.5 | browse_files=yes, run_commands=yes | Primary auditor with full repo access |
| GPT-5-Codex | browse_files=yes, run_commands=yes | Secondary auditor for consensus |
| Gemini 3 Pro | browse_files=yes, run_commands=yes | Third perspective |

**Minimum requirement:** 3 models for consensus scoring.

---

## Review Prompt (Execute on Each Model)

Copy the following prompt and run on each AI model:

```markdown
ROLE

You are a senior TypeScript/Next.js engineer performing a code quality audit on a repository. Your #1 priority is identifying cross-cutting issues that affect code quality, maintainability, and security.

REPO

https://github.com/jasonmichaelbell78-creator/sonash-v0

STACK / CONTEXT (treat as true)

- Next.js 16.1.1
- React 19.2.3
- TypeScript 5.x
- Tailwind CSS v4, Framer Motion 12
- Firebase (Auth, Firestore, Cloud Functions)
- Security: Firestore Rules, reCAPTCHA (optional), App Check (currently disabled)
- Quality gates: npm run lint (0 errors, 181 audited warnings), npm test (115/116 passing), npm run patterns:check (0 violations)

BASELINE CONTEXT (treat as true - gathered 2026-01-06)

- Test suite: 115/116 tests passing (1 intentionally skipped)
- Circular dependencies: 0 (verified via madge)
- SonarQube issues: 778 total (1 BLOCKER-FP, 47 CRITICAL, 216 MAJOR, 507 MINOR)
- CRITICAL issues are cognitive complexity violations (functions exceeding 15-point threshold)
- Top complexity files: scripts/assign-review-tier.js (38), scripts/phase-complete-check.js (27), scripts/check-pattern-compliance.js (26)
- Auto-fixable issues: ~200+ (unused imports, optional chaining, Array.includes)

KNOWN FALSE POSITIVES (do not flag these)

1. Firebase API key in .env.production - This is intentional (public client key secured via Firebase Security Rules + App Check)
2. ESLint security warnings (181) - Audited 2026-01-04, all are false positives (safe object iteration patterns)

SCOPE

Include: app/, components/, hooks/, lib/, functions/src/, types/
Secondary: scripts/ (already flagged in SonarQube - focus on app code)
Exclude: docs/, public/, node_modules/, .next/, coverage/, tests/

CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

CAPABILITIES: browse_files=<yes/no>, run_commands=<yes/no>, repo_checkout=<yes/no>, limitations="<one sentence>"

If browse_files=no OR repo_checkout=no:
- Run in "NO-REPO MODE": Cannot complete this review without repo access
- Stop immediately and report limitation

NON-NEGOTIABLE EVIDENCE RULE (ANTI-HALLUCINATION)

A finding is CONFIRMED only if it includes:
- at least one concrete file path AND
- at least one primary symbol name (component/function/type) from those files

If you cannot provide both, put it in SUSPECTED_FINDINGS with confidence <= 40.

FOCUS AREAS (use ONLY these categories)

1) Hygiene/Duplication
2) Types/Correctness
3) Next/React Boundaries
4) Security
5) Testing

REVIEW PHASES

PHASE 1: REPOSITORY ACCESS VALIDATION
- Verify you can access the repository files
- If you CAN access, list 5 actual files you can see
- If you CANNOT access, stop immediately

PHASE 2: REPOSITORY OVERVIEW
- List key files in each included directory
- Note what each major file does
- Identify configuration files, contexts, services
- At the end, write: "Phase 2 complete - Total files reviewed: [count]"

PHASE 3: SYSTEMATIC CATEGORY REVIEW

Category 1: Hygiene/Duplication
- Duplicated code blocks, repeated logic patterns
- Firebase init/service wrappers duplicated
- UI primitives duplicated outside components/ui
- Repeated hook patterns, types, constants
- For each cluster: produce ONE finding listing all instances

Category 2: Types/Correctness
- any/unknown leakage, inconsistent domain types
- Nullable handling, unsafe casts
- Runtime validation vs TS types mismatch

Category 3: Next/React Boundaries
- Server vs client component issues
- Data fetching patterns, state placement
- "use client" where not needed or missing

Category 4: Security
- Trust boundaries, rules alignment
- Secrets/config exposure
- Auth/authorization gaps
- App Check usage issues (currently disabled - flag if needed)

Category 5: Testing
- Missing tests for critical paths
- Weak test coverage areas
- Security-critical code without tests

As you work:
- Quote specific code snippets with file paths
- Maintain running count of issues per category
- After each category: "Category X complete - Issues found: [number]"

PHASE 4: DRAFT FINDINGS
- Create detailed entry for each issue
- Number findings sequentially
- At the end: "Phase 4 complete - Total draft findings: [count]"

PHASE 5: PATTERN IDENTIFICATION
- Review findings and identify patterns
- Number each pattern explicitly
- At the end: "Phase 5 complete - Total patterns: [count]"

PHASE 6: SUMMARY PREPARATION
- Count findings by severity (S0/S1/S2/S3)
- Draft executive summary
- At the end: "Phase 6 complete - Ready to output"

OUTPUT FORMAT (STRICT)

Return 3 sections in this exact order:

1) FINDINGS_JSONL
(one JSON object per line, each must be valid JSON)

Schema:
{
  "category": "Hygiene/Duplication|Types/Correctness|Next/React Boundaries|Security|Testing",
  "title": "short, specific",
  "fingerprint": "<category>::<primary_file>::<primary_symbol>::<problem_slug>",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": 0-100,
  "files": ["path1", "path2"],
  "symbols": ["SymbolA", "SymbolB"],
  "duplication_cluster": {
    "is_cluster": true/false,
    "cluster_summary": "if true, describe the repeated pattern",
    "instances": [{"file":"...","symbol":"..."}, ...]
  },
  "why_it_matters": "1-3 sentences",
  "suggested_fix": "concrete refactor direction (no rewrite)",
  "acceptance_tests": ["what to run/verify after change"],
  "pr_bucket_suggestion": "firebase-access|ui-primitives|hooks-standardization|types-domain|boundaries|security-hardening|tests-hardening|misc",
  "dependencies": ["fingerprint it depends on", "..."],
  "evidence": ["optional: short grep output or tool output summary"],
  "notes": "optional"
}

Severity guide:
- S0: high-risk security/data loss/major bug
- S1: likely bug/perf/security footgun
- S2: maintainability drag/inconsistency/duplication
- S3: cosmetic cleanup

Effort guide:
- E0: minutes
- E1: hours
- E2: 1-3 days or staged PR
- E3: multi-PR/multi-week

2) SUSPECTED_FINDINGS_JSONL
(same schema, but confidence <= 40; evidence missing file+symbol OR claim is broad)

3) HUMAN_SUMMARY (markdown)
- Top duplication clusters (5-10 bullets)
- Top 5 high-risk items (S0/S1)
- "Do next" shortlist (<= 10 items) emphasizing small, reviewable PRs
```

---

## Output Collection

After running on each model, save outputs as:

| Model | Findings File | Suspected File | Summary File |
|-------|---------------|----------------|--------------|
| Claude Opus 4.5 | `claude-opus_findings.jsonl` | `claude-opus_suspected.jsonl` | `claude-opus_summary.md` |
| GPT-5-Codex | `gpt5-codex_findings.jsonl` | `gpt5-codex_suspected.jsonl` | `gpt5-codex_summary.md` |
| Gemini 3 Pro | `gemini3_findings.jsonl` | `gemini3_suspected.jsonl` | `gemini3_summary.md` |

Save all outputs to: `docs/reviews/2026-q1-code-review/`

---

## Aggregation

After collecting all outputs, run aggregation using `MULTI_AI_AGGREGATOR_TEMPLATE.md` in Tier-1 mode.

**Output:** `CANON-CODE.jsonl`

---

## Related Documents

- [MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md](../templates/MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md) - Source template
- [MULTI_AI_AGGREGATOR_TEMPLATE.md](../templates/MULTI_AI_AGGREGATOR_TEMPLATE.md) - Aggregation prompt
- [INTEGRATED_IMPROVEMENT_PLAN.md](../INTEGRATED_IMPROVEMENT_PLAN.md) - Parent plan (Step 4.2)
- [sonarqube-manifest.md](../analysis/sonarqube-manifest.md) - Baseline static analysis

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-06 | Initial creation with project-specific context | Claude |

---

**END OF CODE_REVIEW_PLAN_2026_Q1.md**
