# Learnings Effectiveness Audit — DIAGNOSIS

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-12
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Date:** 2026-03-12 **Deep-Plan Topic:** Audit effectiveness of all learnings
capture/recall systems **ROADMAP Alignment:** Aligned with System-Wide
Standardization (P0 blocker) — this audit directly addresses why standardized
patterns aren't sticking.

---

## Reframe Check

**User framing:** "We keep seeing the same issues come up time after time with
little improvement despite having references that get updated."

**Reframe:** This is correct. The problem is not that learnings aren't captured
— the project has 12+ capture mechanisms and extensive state tracking. The
problem is a **broken feedback loop**: learnings are captured and stored but
insufficiently recalled, enforced, or acted upon during the moments that matter
(code creation, scripting, skill writing). The system has high write throughput
and low read effectiveness.

---

## Landscape Summary

### Capture Systems (12 categories, 30+ files)

| System               | Files                                       | Update Method           | Entries                       |
| -------------------- | ------------------------------------------- | ----------------------- | ----------------------------- |
| Pattern rules        | CODE_PATTERNS.md, verified-patterns.json    | Manual                  | 65 patterns                   |
| Review learnings     | AI_REVIEW_LEARNINGS_LOG.md, reviews.jsonl   | Semi-auto               | 29 reviews, 47 JSONL          |
| Retro findings       | retros.jsonl, pr-retro state files          | Skill-driven            | 5 retros                      |
| Technical debt       | MASTER_DEBT.jsonl, deduped.jsonl            | Multi-source pipeline   | 8,383 items                   |
| Hook warnings        | hook-warnings-log.jsonl, hook-warnings.json | Auto (hooks)            | 30+ entries/week              |
| Override audit trail | override-log.jsonl                          | Auto (hooks)            | 114/week                      |
| Health scores        | health-score-log.jsonl                      | Auto (ecosystem audits) | Time-series                   |
| Behavioral rules     | CLAUDE.md Section 4-5                       | Manual                  | 6 guardrails, 5 anti-patterns |
| Security checklist   | SECURITY_CHECKLIST.md                       | Manual                  | 8-point checklist             |
| Fix templates        | FIX_TEMPLATES.md                            | Manual                  | ~10 templates                 |
| Memory               | MEMORY.md, feedback files                   | Manual (AI)             | ~15 entries                   |
| Session context      | SESSION_CONTEXT.md, SESSION_HISTORY.md      | Per-session             | 217 sessions                  |

### Recall Systems (10+ mechanisms)

| Mechanism                        | Trigger           | Blocking?               | Forced Ack?       |
| -------------------------------- | ----------------- | ----------------------- | ----------------- |
| Pre-commit pattern check         | Every commit      | Partial (critical only) | No                |
| Pre-push type/CC/propagation     | Every push        | Yes (critical)          | No                |
| session-begin scripts (7 checks) | Session start     | No                      | No                |
| session-begin warning gate (7c)  | Session start     | Yes                     | Yes               |
| session-begin anomaly gate (7b)  | Session start     | Conditional             | Yes               |
| `npm run lessons:surface`        | Session start     | No                      | No                |
| /alerts skill                    | Manual invocation | N/A                     | Yes (interactive) |
| /pr-retro action items           | Post-PR           | N/A                     | Yes (interactive) |
| MEMORY.md auto-load              | Every turn        | No                      | No                |
| Episodic memory search           | Manual/optional   | No                      | No                |

---

## Evidence of Failure (Repeat Issues)

### Quantified Failures

1. **Propagation patterns:** `statSync-without-lstat` flagged 3x in 48h with
   escalating counts (21→23). `path-resolve-without-containment` at 24 occ. Gate
   exists but always bypassed.

2. **Qodo compliance:** Same items raised 4-5x per PR round ("local config
   exposure" 5x, "swallowed exceptions" 4x, "S4036 PATH hijacking" 5x). No
   suppression mechanism.

3. **Override fatigue:** 78% of overrides cite "pre-existing" — reflexive
   copy-paste. 114 overrides in 7 days. Override-log never surfaced until hook
   audit.

4. **Hook warnings:** 31 entries accumulated, 0 analyzed. Same warnings 6-8x
   each with no mitigation between occurrences.

5. **Code-reviewer gate:** Bypassed 4x due to stale timestamp validation. Gate
   was ineffective but no meta-analysis detected this.

6. **Unsafe fs patterns:** 321 writeFileSync + 272 path.resolve violations. Gate
   overwhelmed → permanently bypassed.

7. **PR churn:** 55% avoidable review rounds (27/49). PR #407 had 17 rounds.
   Root causes documented but not systematized.

### Root Cause Pattern

**"Passive surfacing is useless"** (CLAUDE.md Guardrail #6, added Session #215)

The recurring theme across ALL failures:

- Data **captured** ✓ (hook-warnings, override-log, health scores)
- Data **stored** ✓ (JSONL files, markdown docs, state files)
- Data **consumed** ✗ (no reader, or reader is informational/fire-and-forget)
- Data **acted upon** ✗ (no enforcement, no blocking, no forced decision)

---

## CLAUDE.md as a Learnings Store

CLAUDE.md plays a **dual role** — configuration file AND learnings repository —
but its learnings function is largely ineffective.

### What It Stores (Experience-Derived Rules)

| Section                   | Content                                                            | Origin                                                                     |
| ------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 4. Behavioral Guardrails  | 6 rules (ask on confusion, never implement without approval, etc.) | Added v5.3 (Session #204-205) after batch retro found 55% avoidable rounds |
| 5. Critical Anti-Patterns | 5 top patterns + enforcement table                                 | Distilled from 347 code reviews                                            |
| 7. Agent/Skill Triggers   | PRE-TASK and POST-TASK trigger tables                              | Added v5.2 after agents weren't checking TRIGGERS.md                       |

### How It's Consumed

- **Loaded every AI turn** via system prompt — passive context injection
- **No runtime verification** of compliance — no hook/script reads CLAUDE.md to
  enforce rules
- Only 6 files in codebase reference CLAUDE.md, and most are **comments only**
- Anti-pattern enforcement actually comes from CODE_PATTERNS.md +
  verified-patterns.json, not CLAUDE.md

### Effectiveness by Section

| Section                        | Score    | Why                                                                                   |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------- |
| Config/Navigation (1-3, 6, 8)  | **8/10** | Maintained, linked, clear                                                             |
| Anti-Pattern Guidance (5)      | **4/10** | Claims enforcement via patterns:check but actual enforcement is from CODE_PATTERNS.md |
| Behavioral Guardrails (4)      | **2/10** | Zero enforcement — aspirational rules with no compliance monitoring                   |
| Learnings Repository (overall) | **1/10** | No systematic distillation, no feedback loop, no violation tracking                   |

### Key Failure Mode

Behavioral guardrails are **aspirational theater**. Every guardrail was added
reactively after an incident, but none have enforcement mechanisms. The AI may
or may not follow them — there's no way to know and no consequence for ignoring
them. Compare to CODE_PATTERNS.md which has regex enforcement, ESLint rules,
Semgrep rules, pre-commit hooks, and CI gates.

---

## JSONL Files as Learnings Stores

20 JSONL files identified across 7 tiers. The critical finding: most are
**write-eager, read-lazy**.

### JSONL Consumption Analysis

| Tier                       | Files                                             | Consumers                                     | Verdict                                     |
| -------------------------- | ------------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| **Active** (session-level) | hook-warnings-log, override-log, commit-log       | Health checkers, session-start, analytics     | Working                                     |
| **Ecosystem health**       | ecosystem-health-log, 7 audit histories           | Trend computation, /alerts                    | Partial — no degradation triggers           |
| **Technical debt**         | MASTER_DEBT, deduped, intake-log, resolution-log  | Debt health checker, view generation, metrics | Working (with sync bug)                     |
| **Reviews**                | reviews.jsonl, review-metrics.jsonl, retros.jsonl | Consolidation pipeline, learning analyzer     | **Broken** — review-metrics has 0 consumers |
| **Agent tracking**         | agent-invocations.jsonl, velocity-log.jsonl       | Compliance checker, velocity report           | Partial                                     |
| **Planning**               | decisions.jsonl, directives.jsonl, etc.           | None — write-only                             | **Dead weight**                             |

### Files That Accumulate Without Being Consumed

1. **review-metrics.jsonl** — Written by review-churn-tracker.js, **zero readers
   found**
2. **7 ecosystem audit histories** — Only last entry used; no regression
   alerting when scores degrade
3. **retros.jsonl `pattern_recurrence` field** — Always 0, never populated or
   analyzed
4. **Planning JSONL files** — Write-only, no integration with runtime systems
5. **agent-invocations.jsonl** — Logged but minimal analysis

### Files With Broken Feedback Loops

1. **hook-warnings-log** — Warnings rotate away without per-warning
   acknowledgment
2. **override-log** — "pre-existing" banned (C4-G1) but validator implementation
   may still accept it
3. **MASTER_DEBT** — generate-views.js overwrite bug (documented in memory)
4. **ecosystem-health-log** — Scores can degrade indefinitely without triggering
   re-audit

### The Core JSONL Problem

JSONL is an excellent **append-only audit trail** format. But the project treats
JSONL as the destination, not a waypoint. Data goes in and rarely comes back out
in an actionable form. The few files that ARE consumed (hook-warnings,
override-log, MASTER_DEBT) are effective precisely because scripts read them
into health scores and dashboards. The rest are write-only storage.

---

## Key Hypotheses to Test in Discovery

1. **Markdown recall problem:** User hypothesis that `.md` files are ineffective
   as learnings stores. Evidence: CODE_PATTERNS.md has 65 patterns but only ~15%
   automated. CLAUDE.md rules loaded every turn but not enforced during code
   generation. AI_REVIEW_LEARNINGS_LOG.md is 437KB — too large for effective
   context injection.

2. **Capture-consumption gap:** Systems excel at writing data but have few/weak
   readers. Of 30+ learnings files, only ~5 have automated consumers.

3. **Scale desensitization:** When violations exceed ~50 per check, gates become
   noise and get reflexively bypassed. Baseline approach helps but was only
   recently implemented (Wave 3, Session #215).

4. **Missing "moment of creation" enforcement:** Most enforcement happens at
   commit/push time (after code is written). No enforcement during code
   generation — the AI writes code, THEN hooks catch violations, THEN bypass
   happens.

5. **Skill-embedded learnings are ephemeral:** Auto-learnings from skills
   (alerts, pr-retro, audits) saved to individual state files with no
   cross-skill aggregation or systematic recall.

---

## Existing Systems & Patterns

### Hook Audit Already Addressed Some Issues

The hook systems mini-audit (Session #215, PR #427) implemented 35 decisions
across 8 waves that address the hook-side of this problem:

- Warning enrichment + auto-escalation (Wave 4)
- Cross-system integration with /alerts (Wave 5)
- Acknowledgment gates in session-begin (Wave 7)
- Known-debt-baseline for regression-only gating (Wave 3)

**However:** The hook audit scope was limited to pre-commit/pre-push systems. It
did NOT address:

- Learnings recall during code creation
- Markdown file effectiveness
- Review-to-enforcement pipeline
- Skill learnings aggregation
- The fundamental question of whether our learnings ARCHITECTURE is right

### System-Wide Standardization Plans This

The standardization initiative (92 decisions, PLAN.md v1.1) includes hooks as
one of 6 ecosystems to overhaul. This audit could inform the "how" of that
overhaul by measuring what's actually working.

---

## Verification Commands

```bash
# Verify capture system file counts
wc -l docs/technical-debt/MASTER_DEBT.jsonl  # [VERIFIED: 8383 lines]
wc -l .claude/state/reviews.jsonl             # [VERIFIED: 47 lines]
cat .claude/hook-warnings.json | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(d.warnings.length)"  # [VERIFIED: 48 warnings]

# Verify pattern automation rate
node -e "const p=require('./scripts/config/verified-patterns.json'); console.log(Object.keys(p).length, 'patterns')"

# Verify override count
npm run hooks:analytics -- --since=2026-03-05  # [VERIFIED: 114 overrides]
```

---

**Phase gate:** Confirm this diagnosis before proceeding to Discovery.
