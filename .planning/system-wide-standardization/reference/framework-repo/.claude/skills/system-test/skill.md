---
name: system-test
description: Interactive system/repo test plan with per-finding review, suggestions, and
  multi-session support. Performs deep audits across configurable domains.
supports_parallel: false
version: '4.0'
estimated_sessions: 6
---

# System Test — Interactive Multi-Domain Audit Plan

**Version:** 4.0 (Interactive with Suggestions) **Sessions:** Configurable
(recommended: split into multiple sessions for large codebases) **Output:** Per-domain JSONL +
unified findings + SUMMARY.md report

---

## When to Use

- Tasks related to system-test
- User explicitly invokes `/system-test`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## What This Does

Performs a deep, interactive audit of the codebase across configurable domains.
Runs each domain sequentially with **interactive user review** after every
domain.

Key features:

- **Configurable domains** — define audit domains relevant to your project
- **Per-finding suggestions** — each finding includes a recommendation,
  counter-argument, and severity rationale
- **Interactive review** — user accepts/rejects/defers each finding with full
  context
- **Multi-session** — designed for checkpoint recovery across multiple sessions
- **Self-auditing** — a meta-domain verifies the audit's own completeness

---

## Quick Start

```
/system-test                  # Fresh full audit
/system-test --resume         # Resume from checkpoint
/system-test --domain 7       # Re-run single domain
/system-test --from 8 --to 11 # Run session range
/system-test --dry-run        # Preview checks only
/system-test --batch          # Skip interactive review
```

---

## Domain Planning

Before starting, define the audit domains relevant to your codebase. Standard
domain categories to consider:

| Category       | Examples                                       |
| -------------- | ---------------------------------------------- |
| Foundation     | Self-validation, prerequisites, build          |
| Code Quality   | Lint/static analysis, test suite, dependencies |
| Security       | Auth, headers, secrets, input validation       |
| Performance    | Bundle size, load time, caching                |
| Configuration  | Environment vars, config consistency           |
| Documentation  | Doc accuracy, coverage, freshness              |
| Infrastructure | CI/CD, deployment, monitoring                  |
| Data Integrity | Schema validation, migration health            |
| Prior Findings | Unresolved items from previous audits          |
| Meta           | Post-test self-audit, reporting                |

---

## Initialization Protocol

On every invocation:

1. **Detect mode**: fresh / resume / targeted / dry-run
2. **If resume**: Read `PLAN_INDEX.md` -> show progress -> confirm resume point
3. **Create/verify** output directory:
   ```
   docs/audits/system-test/audit-YYYY-MM-DD/
   ├── PLAN_INDEX.md
   ├── SUMMARY.md           (written at end)
   ├── unified-findings.jsonl (written at end)
   └── domains/
       └── d00-dNN JSONL files
   ```
4. **Write** PLAN_INDEX.md skeleton (all domains, status: pending)
5. **Ask user** which session we're running (Decision Point 1)
6. **Commit**: `system-test: initialize audit-YYYY-MM-DD`

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
- Accept as-is (severity, effort unchanged)
- Accept, change severity (offer S0/S1/S2/S3)
- Accept, change effort (offer E0/E1/E2/E3)
- Reject as false positive (must give reason)
- Defer (revisit later — must give reason)
- Discuss (show more context, then re-present)
```

### Review Mode Options

Before individual review, offer:

```
- Individual review (one-by-one)  [Recommended for < 10 findings]
- Batch accept all                [Recommended for clean domains]
- Batch accept with exceptions    [Name the ones to discuss]
- Show all detail first           [Read everything, then decide]
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
8. **Commit** — `system-test: Domain N — <name> [M/N]`
9. **Update** — PLAN_INDEX.md domain status -> Complete
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
1. Read PLAN_INDEX.md -> last Complete domain
2. Verify last domain's JSONL is intact
3. Resume from next domain
```

---

## Finding JSONL Schema

```jsonl
{
  "id": "SYST-2026-02-18-D07-003",
  "domain": 7,
  "domain_name": "Domain Name",
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
| 4.0     | 2026-02-18 | Interactive audit with suggestions                           |
| 3.1     | 2026-02-14 | Extract reference docs: wave details, recovery, triage guide |
| 3.0     | 2026-02-14 | 9-domain coverage: add enhancements + ai-optimization        |
| 2.1     | 2026-02-03 | Added Triage & Roadmap Integration with priority scoring     |
| 2.0     | 2026-02-02 | Staged execution, S0/S1 escalation, checkpoints              |
| 1.0     | 2026-01-28 | Initial version                                              |
