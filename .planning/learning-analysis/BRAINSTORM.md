# Brainstorm: Learning Analysis

**Status:** PAUSED — routed to /deep-research before direction selection
**Date:** 2026-04-03 **Phase reached:** 3 (Converge — deferred to research)

---

## Landscape Summary

SoNash has 11 learning capture systems, 13 application systems, and 7 traced
knowledge flows. Capture is strong; application is partial; feedback loops are
mostly broken.

### Critical Finding

The "89.2% learning effectiveness" metric is misleading. It measures pattern
existence, not pattern impact. Formula:
`(patterns not seen again + automated) / total`. Most "learned" patterns
(356/444) simply weren't encountered again — no evidence enforcement prevented
them.

### Learning-Router Bottleneck

39 patterns in learning-routes.jsonl. 38 stuck at "refined." 1 reached
"enforced" (test failing). 0 verified. The graduation pipeline exists in code
but nothing moves through it.

### Key Gaps

| Flow                            | Automation |
| ------------------------------- | ---------- |
| PR review → pattern enforcement | ~70%       |
| Session corrections → behavior  | ~40%       |
| Audit findings → enforcement    | ~30%       |
| PR retro → learning capture     | ~10%       |
| Pre-commit failures → learning  | 0%         |
| SonarCloud → pattern docs       | 0%         |
| Behavioral guardrails (8/14)    | 0%         |

---

## Directions Explored (5)

### A: "Prove It or Kill It"

Ruthless audit. Every system gets 30 days to demonstrate measurable impact. What
can't prove value gets removed.

### B: "Close the Loops"

Keep systems, fix broken connections. Wire pre-commit → learning entries,
SonarCloud → CODE_PATTERNS, graduate the learning-router.

### C: "Single Pane of Glass"

One dashboard answering "are mistakes declining?" Don't change underlying
systems — change visibility. Problem: underlying data doesn't support this yet.

### D: "Burn It Down and Build Simple"

Replace 444 patterns with the 20 that actually recur. Delete learning-router,
lifecycle-scores, review-metrics, effectiveness analyzer. Problem: don't know
which 20 matter without data that doesn't exist.

### E: "Hybrid — Prove Then Invest"

Sequenced: audit (tag PROVEN/UNPROVEN/ORPHANED) → close loops for survivors →
add dashboard. Problem: "prove" phase needs violation-count data that requires
weeks of collection.

---

## Contrarian Checkpoint (Critical)

**The real question none of the directions answer:**

Is the learning system's job to:

1. **Prevent code mistakes** (check-pattern-compliance, pre-commit hooks)
2. **Make Claude a better collaborator** (memory system, behavioral guardrails)

These are different problems requiring different solutions. Mixing them under
one "learning" umbrella may be why the system feels incoherent. 8/14 CLAUDE.md
behavioral guardrails have zero automated enforcement.

---

## Anti-Goals

- No metrics for metrics' sake — must be actionable
- No added complexity that isn't maintainable
- No manual processes — must be automated
- Not opposed to adding OR removing — let evidence decide

---

## Decision: Route to /deep-research

Open questions:

1. Effective learning infra in AI-directed dev — models from other projects?
2. Code-level enforcement vs. behavioral improvement — same or different
   systems?
3. Minimum viable learning system that proves its own value?
4. Retroactive measurement using existing git/PR data?
5. Measuring dev tool effectiveness without A/B tests?

**Next:** Run `/deep-research` on these questions, then return to select
direction.
