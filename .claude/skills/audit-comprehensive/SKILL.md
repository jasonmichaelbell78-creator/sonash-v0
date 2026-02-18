---
name: audit-comprehensive
description:
  23-domain interactive comprehensive audit with per-finding review,
  suggestions, TDMS sync, and multi-session support
supports_parallel: false
version: "4.0"
estimated_sessions: 6
total_domains: 23
total_checks: "~100"
---

# Comprehensive 23-Domain Interactive Audit

**Version:** 4.0 (23-Domain Interactive with Suggestions) **Replaces:** v3.1
(9-domain wave orchestrator) **Sessions:** 6 recommended (can run as single long
session) **Output:** Per-domain JSONL + unified findings + SUMMARY.md report

---

## What This Does

Performs a deep, interactive audit of the entire SoNash codebase across 23
domains. Unlike v3.1 which spawned 9 sub-skills in parallel waves, v4.0 runs
each domain sequentially with **interactive user review** after every domain.

Key differences from v3.1:

- **23 domains** (vs 9) — finer granularity, deeper checks
- **Per-finding suggestions** — each finding includes a recommendation,
  counter-argument, and severity rationale
- **Interactive review** — user accepts/rejects/defers each finding with full
  context
- **Multi-session** — designed for 6 sessions with checkpoint recovery
- **TDMS-integrated** — findings sync directly to MASTER_DEBT.jsonl
- **Self-auditing** — Domain 21 verifies the audit's own completeness

---

## Quick Start

```
/audit-comprehensive                  # Fresh full audit
/audit-comprehensive --resume         # Resume from checkpoint
/audit-comprehensive --domain 7       # Re-run single domain
/audit-comprehensive --from 8 --to 11 # Run session range
/audit-comprehensive --dry-run        # Preview checks only
/audit-comprehensive --batch          # Skip interactive review
```

---

## Reference Documents

- **[WORKFLOW.md](reference/WORKFLOW.md)** — Complete interactive workflow with
  all 12 decision points
- **[RECOVERY_PROCEDURES.md](reference/RECOVERY_PROCEDURES.md)** — Compaction
  recovery and checkpoint management
- **[TRIAGE_GUIDE.md](reference/TRIAGE_GUIDE.md)** — Post-audit finding
  prioritization and TDMS intake

---

## Session Allocation

| Session | Domains | Focus Area                 | Risk   | Est. Findings |
| ------- | ------- | -------------------------- | ------ | ------------- |
| 1       | 0-4     | Foundation                 | LOW    | 5-15          |
| 2       | 5-7     | Lint, UI, Cloud Functions  | HIGH   | 20-35         |
| 3       | 8-11    | Security, Rules, Auth      | HIGH   | 15-25         |
| 4       | 12-16   | Perf, Config, Docs, PWA    | MEDIUM | 15-25         |
| 5       | 17-19   | Prior Audits, Admin, Data  | MEDIUM | 10-20         |
| 6       | 20-22   | Report, Self-Audit, Sentry | LOW    | 5-10          |

---

## Initialization Protocol

On every invocation:

1. **Detect mode**: fresh / resume / targeted / dry-run
2. **If resume**: Read `PLAN_INDEX.md` → show progress → confirm resume point
3. **Create/verify** output directory:
   ```
   docs/audits/comprehensive/audit-YYYY-MM-DD/
   ├── PLAN_INDEX.md
   ├── SUMMARY.md           (written at end)
   ├── unified-findings.jsonl (written at end)
   └── domains/
       └── d00-d22 JSONL files
   ```
4. **Write** PLAN_INDEX.md skeleton (all 23 domains, status: pending)
5. **Ask user** which session we're running (Decision Point 1)
6. **Commit**: `audit(comprehensive): initialize audit-YYYY-MM-DD`

---

## Interactive Review Protocol

After each domain's checks complete, present findings with **suggestions and
options**.

### Per-Finding Presentation

Each finding MUST include:

1. **Severity + Effort** — preliminary assignment with rationale
2. **Evidence** — actual code or command output (not paraphrased)
3. **Suggestion** — recommendation (ACCEPT/REJECT/DEFER) with reasoning
4. **Counter-argument** — why the opposite decision might be valid
5. **Suggested fix** — concrete remediation steps
6. **Related findings** — cross-references to related items in other domains

### User Decision Options

For each finding, offer these choices:

```
○ Accept as-is (severity, effort unchanged)
○ Accept, change severity (offer S0/S1/S2/S3)
○ Accept, change effort (offer E0/E1/E2/E3)
○ Reject as false positive (must give reason)
○ Defer (revisit later — must give reason)
○ Discuss (show more context, then re-present)
```

### Review Mode Options

Before individual review, offer:

```
○ Individual review (one-by-one)  [Recommended for < 10 findings]
○ Batch accept all                [Recommended for clean domains]
○ Batch accept with exceptions    [Name the ones to discuss]
○ Show all detail first           [Read everything, then decide]
```

---

## Domain Execution Protocol

For each domain:

1. **Announce** — show domain header, risk level, expected findings, check list
2. **Ask** — proceed / skip / reorder (Decision Point 3)
3. **Execute** — run all checks, collect raw findings
4. **Present** — show summary table, ask review mode (Decision Point 4)
5. **Review** — per-finding with suggestions (Decision Point 5 per finding)
6. **Summarize** — show accepted/rejected/deferred counts
7. **Ask** — continue / re-review / pause (Decision Point 6)
8. **Commit** — `audit(comprehensive): Domain N — <name> [M/23]`
9. **Update** — PLAN_INDEX.md domain status → ✅ Complete
10. **Check** — session boundary (Decision Point 7 if triggered)

---

## Anti-Compaction Guardrails

| Layer | Mechanism                                           | What It Protects                         |
| ----- | --------------------------------------------------- | ---------------------------------------- |
| 1     | File-first: all content written to disk immediately | No content exists only in context        |
| 2     | Incremental commits after every domain              | Worst case: lose 1 domain of work        |
| 3     | PLAN_INDEX.md as recovery anchor                    | Single file shows all progress           |
| 4     | Domain independence: no cross-domain content deps   | Can resume anywhere without backtracking |

Recovery after compaction:

```
1. Read PLAN_INDEX.md → last ✅ Complete domain
2. Verify last domain's JSONL is intact
3. Resume from next domain
```

---

<!-- ═══════════════════════════════════════════════════════ -->
<!-- DOMAIN DEFINITIONS START HERE                          -->
<!-- Each domain: header, description, risk, checks, files  -->
<!-- ═══════════════════════════════════════════════════════ -->

## Domain 0: Self-Validation

**Risk:** NONE (meta-check) | **Findings:** 0 (pass/fail only) | **Session:** 1

This domain verifies the audit infrastructure itself works before real checks
begin. No findings are generated — this is a go/no-go gate.

### Checks

| ID  | Check                     | Method                                             | Pass Criteria                             |
| --- | ------------------------- | -------------------------------------------------- | ----------------------------------------- |
| 0.1 | Skill integrity           | Verify this SKILL.md has all 23 domain headers     | All `## Domain N:` headers present (0-22) |
| 0.2 | Output directory writable | Write a test file to audit output dir, then delete | Write + delete succeeds                   |
| 0.3 | TDMS accessible           | Read `docs/technical-debt/MASTER_DEBT.jsonl`       | File exists and parses as valid JSONL     |
| 0.4 | Git working tree status   | `git status`                                       | Clean or warn user of uncommitted changes |
| 0.5 | Required tools available  | Check `next`, `tsc`, `npm`, `firebase` on PATH     | All four found                            |
| 0.6 | PLAN_INDEX.md written     | Verify skeleton was created in init step           | File exists with all 23 domain rows       |

### Key Files

- `.claude/skills/audit-comprehensive/SKILL.md` (this file)
- `docs/audits/comprehensive/audit-YYYY-MM-DD/PLAN_INDEX.md`
- `docs/technical-debt/MASTER_DEBT.jsonl`

### Pass/Fail

- **Pass:** All 6 checks green → proceed to Domain 1
- **Fail:** Any check fails → show which failed, offer to fix or abort

---

## Domain 1: Prerequisites

**Risk:** LOW | **Expected Findings:** 1-3 | **Session:** 1

Verifies the codebase compiles, type-checks, and has no critical vulnerabilities
before deeper analysis begins. Findings here block dependent domains.

### Checks

| ID  | Check                   | Method                                        | Finding Criteria                                     |
| --- | ----------------------- | --------------------------------------------- | ---------------------------------------------------- |
| 1.1 | Build succeeds          | `npx next build` (static export)              | Exit code != 0 → S0 finding                          |
| 1.2 | TypeScript clean        | `npx tsc --noEmit`                            | Any errors → S1 finding per error category           |
| 1.3 | npm audit               | `npm audit --json`                            | High/critical vulns in prod deps → S1; dev-only → S2 |
| 1.4 | Node version match      | Compare `node -v` with `package.json` engines | Mismatch → S2 finding                                |
| 1.5 | Firebase CLI configured | `firebase projects:list` or `firebase use`    | Not configured → S2 finding (blocks admin checks)    |

### Key Files

- `package.json` (engines field, scripts)
- `next.config.ts` (build configuration)
- `tsconfig.json` (TypeScript configuration)
- `functions/tsconfig.json` (Functions TypeScript)

### Dependency

- Domain 2 (Build) and Domain 3 (Tests) depend on checks 1.1 and 1.2 passing
- If 1.1 fails, skip Domains 2-3 and offer to proceed with independent domains

### Suggestions Template

For npm audit findings:

- **Suggestion:** "Accept at S1 if vuln is in production dependency. Downgrade
  to S2 if build-time only (check `npm ls <package>` to verify)."
- **Counter-argument:** "If the vulnerability requires specific conditions
  (e.g., user-controlled regex input for ReDoS), practical risk may be lower
  than severity implies."

---

## Domain 2: Build & Compilation

**Risk:** LOW | **Expected Findings:** 2-5 | **Session:** 1

Analyzes build output quality, warnings, bundle composition, and static export
correctness beyond just "does it compile."

### Checks

| ID  | Check                      | Method                                             | Finding Criteria                                         |
| --- | -------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| 2.1 | Build warnings             | Capture `next build` stderr/stdout for warnings    | Any warnings → S3 finding per warning category           |
| 2.2 | Static export completeness | List `out/` directory, verify all routes generated | Missing routes → S1 finding                              |
| 2.3 | Bundle size analysis       | Check `out/` total size and largest files          | Total > 5MB or single file > 500KB → S2 finding          |
| 2.4 | Image optimization         | Check `next.config.ts` for `images.unoptimized`    | `unoptimized: true` → S2 (expected for static, but note) |
| 2.5 | Source maps in production  | Check if `.map` files exist in `out/`              | Source maps present → S2 (information disclosure risk)   |
| 2.6 | Functions build            | `cd functions && npm run build`                    | Build failure → S0; warnings → S3                        |
| 2.7 | Functions TypeScript clean | `cd functions && npx tsc --noEmit`                 | Type errors → S1 finding                                 |

### Key Files

- `next.config.ts` (output: "export", images config)
- `out/` (build output directory)
- `functions/tsconfig.json`
- `functions/src/*.ts`

### Suggestions Template

For image optimization:

- **Suggestion:** "Accept at S2. Static export requires `unoptimized: true` —
  this is a known trade-off. Consider lazy loading and proper image sizing as
  mitigation."
- **Counter-argument:** "Next.js Image component still handles lazy loading and
  sizing even when unoptimized. The real impact is larger downloads on slow
  connections."

---

## Domain 3: Test Suite

**Risk:** LOW | **Expected Findings:** 2-5 | **Session:** 1

Evaluates test suite health, coverage gaps, and test quality beyond just "do
tests pass."

### Checks

| ID  | Check                       | Method                                                       | Finding Criteria                                  |
| --- | --------------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| 3.1 | Tests pass                  | `npm test` (Vitest)                                          | Any failures → S1 finding per failing test        |
| 3.2 | Coverage analysis           | `npm test -- --coverage` or check existing coverage config   | < 50% overall → S2; critical paths uncovered → S1 |
| 3.3 | Test file inventory         | Glob `**/*.test.{ts,tsx}` and `**/*.spec.{ts,tsx}`           | Source files with 0 test coverage → list as S3    |
| 3.4 | Cloud Functions test gap    | Check if `functions/src/*.ts` have corresponding tests       | No function tests at all → S1 finding             |
| 3.5 | Test for security utilities | Check if `secure-caller.ts`, `callable-errors.ts` have tests | Security utils without tests → S1 finding         |
| 3.6 | Snapshot test freshness     | Check for stale snapshots                                    | Outdated snapshots → S3 finding                   |
| 3.7 | Test configuration review   | Read `vitest.config.ts` for misconfigurations                | Coverage thresholds not set → S3 finding          |

### Key Files

- `vitest.config.ts`
- `__tests__/` directory
- `functions/src/` (should have corresponding tests)
- `lib/utils/secure-caller.ts`, `lib/utils/callable-errors.ts`

### Suggestions Template

For Cloud Functions test gap:

- **Suggestion:** "Accept at S1. Cloud Functions handle auth, data mutations,
  and admin operations with no test coverage. This is the highest-risk untested
  code in the project."
- **Counter-argument:** "Integration testing Cloud Functions requires Firebase
  emulator setup (E3 effort). Unit testing the validation/business logic
  portions is a practical first step (E2)."

---

## Domain 4: Dependency Health

**Risk:** MEDIUM | **Expected Findings:** 3-6 | **Session:** 1

Audits dependency versions, consistency between root and functions packages,
duplicate packages, and supply chain health.

### Checks

| ID  | Check                        | Method                                                                      | Finding Criteria                                          |
| --- | ---------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| 4.1 | Firebase version consistency | Compare firebase versions in `package.json` vs `functions/package.json`     | Version mismatch → S2 finding (known 3-way mismatch)      |
| 4.2 | Duplicate dependencies       | Check if same package appears in root and functions with different versions | Duplicates with different majors → S2 finding             |
| 4.3 | Outdated critical packages   | `npm outdated --json` for major version gaps                                | Major version behind on security packages → S1            |
| 4.4 | Package-lock integrity       | Verify `package-lock.json` matches `package.json`                           | Drift → S2 finding                                        |
| 4.5 | Functions package-lock       | Verify `functions/package-lock.json` exists and is current                  | Missing or stale → S2 finding                             |
| 4.6 | Unused dependencies          | Cross-reference `package.json` deps with actual imports                     | Unused prod deps → S3 finding                             |
| 4.7 | License compliance           | Check licenses of all direct deps                                           | GPL in non-GPL project → S1; unknown license → S2         |
| 4.8 | Zod version consistency      | Compare Zod versions between root and functions                             | Known issue: root uses 3.24.2, functions uses 3.24.1 → S3 |

### Key Files

- `package.json` (root)
- `functions/package.json`
- `package-lock.json`
- `functions/package-lock.json`

### Known Issues (from research)

- Firebase packages have a 3-way version mismatch: `firebase` (root),
  `firebase-admin` (functions), `firebase-functions` (functions) — different
  major release cadences
- Zod minor version drift between root and functions

### Suggestions Template

For Firebase version mismatch:

- **Suggestion:** "Accept at S2. The firebase (client), firebase-admin (server),
  and firebase-functions (server) packages intentionally have different version
  numbers. Check if the firebase-admin version is the latest available."
- **Counter-argument:** "These are maintained by the same team (Google) and
  designed to work across version boundaries. A mismatch is only a problem if
  specific APIs are incompatible."

---

## Domain 5: Lint & Static Analysis

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 6: UI Components & Accessibility

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 7: Cloud Functions

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 8: Security Headers & CSP

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 9: Firestore Rules

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 10: Environment & Config

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 11: Auth & Session Management

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 12: Performance

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 13: Config File Consistency

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 14: Documentation & Canon

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 15: PWA & Offline

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 16: TDMS Integrity

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 17: Prior Audit Findings

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 18: Admin Panel

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 19: Data Integrity & Migration

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 20: Final Report & Cross-Cutting Analysis

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 21: Post-Test Self-Audit

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 22: Sentry & Monitoring

<!-- PLACEHOLDER: Will be filled with checks -->

---

<!-- ═══════════════════════════════════════════════════════ -->
<!-- POST-DOMAIN SECTIONS                                   -->
<!-- ═══════════════════════════════════════════════════════ -->

## TDMS Sync Protocol

After Domain 20 report is generated:

1. **Preview** — show count of new findings, duplicates, updates
2. **Deduplication** — match on file + title (>80% fuzzy match)
3. **Ask user** — sync all / S0+S1 only / preview diff / skip
4. **Execute** — append accepted findings to MASTER_DEBT.jsonl
5. **Verify** — confirm TDMS item count after sync

---

## Finding JSONL Schema

```jsonl
{
  "id": "COMP-2026-02-18-D07-003",
  "domain": 7,
  "domain_name": "Cloud Functions",
  "check_id": "7.2",
  "severity": "S1",
  "effort": "E2",
  "category": "correctness",
  "title": "Short title < 80 chars",
  "description": "Full description",
  "file": "relative/path.ts",
  "line": 287,
  "evidence": "Actual code or output",
  "suggested_fix": "How to fix",
  "status": "accepted|rejected|deferred",
  "suggestion_text": "Recommendation shown to user",
  "counter_argument": "Why opposite decision valid",
  "related_findings": [
    "D07-001"
  ],
  "detected_at": "ISO8601",
  "reviewed_at": "ISO8601"
}
```

---

## Severity & Effort Scales

| Sev | Name     | Meaning                                  | Response        |
| --- | -------- | ---------------------------------------- | --------------- |
| S0  | Critical | Security breach, data loss, app crash    | Fix immediately |
| S1  | High     | Significant bug, security risk, UX break | Fix this sprint |
| S2  | Medium   | Moderate issue, tech debt, minor UX      | Schedule fix    |
| S3  | Low      | Cosmetic, optimization, nice-to-have     | Backlog         |

| Eff | Name    | Meaning                        |
| --- | ------- | ------------------------------ |
| E0  | Minutes | Quick fix, config change       |
| E1  | < 1 hr  | Small code change, one file    |
| E2  | Hours   | Multi-file change, design work |
| E3  | Days    | Major refactor, new subsystem  |

---

## Version History

| Version | Date       | Description                                                  |
| ------- | ---------- | ------------------------------------------------------------ |
| 4.0     | 2026-02-18 | 23-domain interactive audit with suggestions and TDMS sync   |
| 3.1     | 2026-02-14 | Extract reference docs: wave details, recovery, triage guide |
| 3.0     | 2026-02-14 | 9-domain coverage: add enhancements + ai-optimization        |
| 2.1     | 2026-02-03 | Added Triage & Roadmap Integration with priority scoring     |
| 2.0     | 2026-02-02 | Staged execution (4+2+1), S0/S1 escalation, checkpoints      |
| 1.0     | 2026-01-28 | Initial version - flat parallel execution of all 6 audits    |
