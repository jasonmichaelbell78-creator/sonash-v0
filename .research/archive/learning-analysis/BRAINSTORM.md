# Brainstorm: Behavioral Compliance Measurement

**Status:** PAUSED — Phase 1 (Diverge) in progress, 12 questions asked **Date:**
2026-04-07 **Phase reached:** 1 (mid-discovery)

---

## Landscape Summary

SoNash has 14 CLAUDE.md behavioral guardrails. 7 have some automated enforcement
(hooks, agent compliance checks). 7 are purely probabilistic (system prompt
only). The PRE_GENERATION_CHECKLIST.md defines 6 proxy metrics that are never
automatically collected. Data infrastructure (JSONL, hooks, state files) is
mature — the measurement layer on top is absent.

No AI tool in the industry has published evidence of behavioral learning
measurement.

### Key Reframe

The question is NOT "make Claude learn" (structurally impossible without weight
updates). The question IS: **which behavioral corrections keep recurring despite
being documented, and which can be moved from Layer 3 (probabilistic) to Layer 2
(semi-deterministic) via hooks?**

---

## Discovery So Far (12 Questions)

### User Answers

1. **Which corrections recur?** User doesn't know — feedback memory system
   captures corrections but doesn't surface recurrence patterns. This is itself
   a finding.
2. **How do you notice violations?** Both in the moment and after the fact.
3. **Comfortable with behavioral hooks?** Yes, as long as not overbearing.
4. **Success definition:** (c) Behavioral rules that enforce themselves, will
   accept (b) fewer correction moments.
5. **Anti-goals:** No change (system that doesn't improve anything).
6. **Proxy metric collection valuable?** Yes, as long as hook interruption cost
   doesn't exceed correction cost. Key constraint: low-friction detection only.
7. **Which patterns feel detectable?** Edit-without-read (a) selected. Others
   not selected — unclear if "not a problem" or "not detectable."
8. **JSONL for feedback memories?** Open to it, already migrating other systems.
9. **Why only (a)?** Unanswered — paused here.
10. **edit-without-read action?** Unanswered.
11. **Hybrid markdown + JSONL index?** Unanswered.
12. **Session scoring comfort?** Unanswered.

### Key Constraints Discovered

- **Cost-benefit threshold:** A hook that interrupts more than the correction it
  prevents is net negative. Constrains to warnings in hook summaries, not
  blocking gates.
- **Detection scope:** Hooks fire on tool calls (Read, Write, Edit, Bash). Can
  see what Claude does, not what Claude thinks. Limits detection to
  tool-call-sequence patterns.
- **Recurrence visibility gap:** User doesn't know which corrections recur.
  First deliverable should surface this.

---

## Emerging Direction (not yet evaluated)

**"Promotion pipeline"** — move behavioral patterns from probabilistic
(CLAUDE.md) to semi-deterministic (hooks) one at a time, based on recurrence
data:

1. Build recurrence analysis over feedback memories (which corrections repeat?)
2. For the top recurring patterns, assess hook-detectability
3. For detectable ones, build low-friction hooks (warnings, not blocks)
4. Measure whether hook introduction reduces the correction

This mirrors the code-side ratchet approach but adapted for behavioral patterns.

---

## Anti-Goals

- No change (system that doesn't improve anything)
- Over-interruption (hooks that cost more than the corrections they prevent)

---

## Open Questions (for resumption)

1. Which of the 30+ feedback memories are actually recurring vs one-time fixes?
2. Can impl-before-plan (guardrail #2) be detected via tool-call sequence?
3. What's the right action for edit-without-read detection? (warning vs block)
4. Should session quality be scored, or is that too judgmental?
5. Hybrid markdown + JSONL for feedback memories — architecture?

---

## Resume Instructions

Re-invoke `/brainstorm behavioral compliance measurement` to resume from Phase 1
mid-discovery (Q9-12 unanswered, directions not yet generated).
