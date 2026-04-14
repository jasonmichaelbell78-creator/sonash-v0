# DIAGNOSIS: Multi-skill Batched Audit Mode for /skill-audit

<!-- prettier-ignore-start -->
**Created:** 2026-04-14 (Session #281)
**Branch:** `41426`
**Planning directory:** `.planning/skill-audit-batch-mode/`
**Status:** Phase 0 — awaiting user confirmation before Discovery
<!-- prettier-ignore-end -->

---

## Topic Reframe Check

**User ask (as framed):** Design a faithful multi-skill batched audit mode for
`/skill-audit` so auditing N skills doesn't require per-category interactive
gates across every skill.

**Is this actually what they want?** Yes — confirmed through a long thread this
session. Original motivation is the CAS 7-skill audit (Step A) which is too slow
under the current sequential-per-category contract. Two drift-prone shortcuts
were proposed and rejected (parallel `code-reviewer` agents, `audit-review-team`
reviewer+fixer). User wants the **real skill's rubric**, just faster to run.

**Not a reframe.** Stays "design new mode for /skill-audit."

---

## ROADMAP Alignment

- **ROADMAP v3.28 Active Sprint:** "🔧 1. Tooling & Infrastructure" (P0, ACTIVE,
  0% — 30 decisions). This is meta-tooling improvement work.
- **Alignment:** ALIGNED. Skill-audit is core tooling. Extending it with a batch
  mode is a P0-track improvement, not a pivot.
- **Indirect:** Unblocks CAS Step A (T28 → T38 chain) once implemented.

---

## Current State (verified by direct read)

| Claim                                                                                | Verification                                                                                          |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `/skill-audit` SKILL.md is at v3.6, 404 lines                                        | `wc -l .claude/skills/skill-audit/SKILL.md` → 404                                                     |
| Phase 2 line 118 has the batching prohibition MUST                                   | Direct read, lines 118-120: _"Present ONE category at a time. Wait for user response. Do NOT batch."_ |
| Phase 5.0 invokes `scripts/skills/skill-audit/self-audit.js`                         | Direct read, SKILL.md lines 256-262                                                                   |
| State file path: `.claude/state/task-skill-audit-{skill-name}.state.json`            | SKILL.md line 90, REFERENCE.md line 690, self-audit.js line 114                                       |
| REFERENCE.md is 744 lines, defines 12 categories, state schema, completion templates | `wc -l` + direct read                                                                                 |
| SELF_AUDIT_PATTERN.md is the Session #280 canonical doc (v1.0, 292 lines)            | Direct read                                                                                           |
| `self-audit.js` covers all 9 dimensions (skill-audit classified Complex tier)        | self-audit.js line 26 + line 520: _"ALL 9 are MUST for skill-audit"_                                  |
| No existing plan dir `.planning/skill-audit-batch-mode/`                             | `ls` returned "No such file"                                                                          |
| No prior research at `.research/skill-audit-batch-mode/`                             | `ls` returned "No such file"                                                                          |
| `.claude/tmp/` directory exists (already used by `/alerts` for progress)             | SKILL.md alert reference confirms `.claude/tmp/alerts-progress-{date}.json`                           |
| Skill tier: Complex (>300 lines + 1 companion)                                       | Per SKILL_STANDARDS.md §Size Limits + self-audit.js line 26                                           |

**All claims above are verified by direct file reads this session.** No
`[UNVERIFIED]` claims in this diagnosis.

---

## Where the Design Tension Lives

### Tension 1 — Phase 2 MUST rule binds the interactive loop

SKILL.md Phase 2 (lines 104-179) is built around per-category gates:

- _"Present ONE category at a time. Wait for user response. Do NOT batch."_
  (line 118)
- Per-category procedure steps 1-13 (lines 130-154) assume sequential user
  interaction: pros → cons → gaps → suggestions → opportunities → user decision
  → save state → next category
- Critical Rule #1 (line 27): _"Present ALL issues — every con, gap, and issue
  identified in a category MUST be presented to the user, not just the ones with
  multiple options."_

**The rule couples two things:**

1. **Findings production** (analyzing the skill against one category)
2. **User decision gate** (accept/modify/reject suggestions before next
   category)

A faithful batch mode needs to **decouple these** — produce findings for all
categories up front, still require per-category user decisions from the batch.

### Tension 2 — Drift is the primary risk

Two shortcuts already rejected by user this session:

- Parallel `code-reviewer` agents with categories in a prompt → agents simulate
  the skill from a prompt, don't run the real rubric
- `audit-review-team` (reviewer + fixer) → same pattern under different
  packaging

**What "faithful" means here:** the batch output must be what /skill-audit Phase
2 _would_ have produced if it ran sequentially. Not a summary, not a
reviewer-agent's opinion — the full 12-category structured findings per
REFERENCE.md.

### Tension 3 — Phase 5 self-audit cannot be batched before decisions exist

Session #280's `self-audit.js` runs Phase 5.0 verification _after_ Phase 4
implementation. Its dimension checks depend on `state.decisions`,
`state.files_modified`, `state.status == "complete"`. Running it before Phase 2
finishes is incoherent (user correction #2 this session).

### Tension 4 — Cross-skill systemic patterns are currently invisible

Per `audit-review-team.md` line 82-90, cross-target pattern accumulation is the
reason that team exists — recognizing that "the same gap appears in targets 2,
4, 7" is load-bearing for efficient fixes. Shape Y (audit-all → decide-all →
implement-all, seeded this thread) lets these patterns surface before any fix is
applied. Current /skill-audit has no mechanism for this.

### Tension 5 — State schema is per-skill, no parent orchestration state

- Current: `.claude/state/task-skill-audit-<name>.state.json` per skill
- Multi-skill mode adds a coordination need: which skills in the batch, which
  have findings produced, which are awaiting decisions, which are implemented
- Either extend per-skill schema (status flags for which phase of the batch each
  skill is in) or add a parent multi-audit state file

### Tension 6 — Interactive vs script: who produces the findings?

Options:

- **(a) Main-session LLM** reads target skill + REFERENCE.md categories,
  produces findings in conversation, writes to tmp file. Faithful (same agent,
  same rubric), but batch production is still token-in-conversation, not
  offloaded.
- **(b) Dispatched agent** with the 12 categories as prompt. Risk = drift (the
  rejected pattern).
- **(c) Script-driven rubric walk** — a new script that walks REFERENCE.md
  categories, runs automated checks where possible, produces structured
  findings. No LLM drift but limited depth (automated checks can't cover
  judgment-heavy categories like Cat 4 Decision Points).

Only (a) preserves faithfulness without drift. (c) is a complement, not a
replacement.

---

## Prior Research Context

- `.research/skill-audit-batch-mode/` — does not exist
- `.research/EXTRACTIONS.md` — scanned for "skill-audit" references; no direct
  prior-art candidates for multi-skill batch audit patterns
- `.planning/synthesis-consolidation/` — T29 used Step 15 "code-reviewer audit"
  as a template prompt. That's where the rejected REMAINING_CAS_TASKS.md wording
  came from. Noted, not load-bearing for this plan.
- Session #280 infrastructure (SELF_AUDIT_PATTERN.md, self-audit.js) is
  **directly relevant** — governs Phase 5 contract this plan must respect.

**No /deep-research needed** — domain is internal tooling, all relevant context
is in-repo and already read.

---

## Seed Decisions (from user, carried into Discovery)

These are **locked**. Discovery does not re-litigate them:

1. Three modes: `single` (default, MUST line 118 preserved), `multi` (N skills),
   `quick` (1 skill batched)
2. Inline sequential execution. No background agents. User reads tmp file N
   while tool continues to audit N+1 ("overlap" = user's review pace, not
   parallel tool execution)
3. Shape Y orchestration: audit-all → decide-all → implement-all
4. Cross-category conflicts resolved at end (Phase 2 completion / Phase 3
   crosscheck) in multi/quick modes
5. Tmp files at `.claude/tmp/skill-audit-<name>-findings.md`
6. Backward compat: `single` remains default
7. Design + spec only in this plan. Implementation is a separate approval.

---

## Reframe Decision

**No reframe.** The task is as described: design the new mode.

**Phase gate:** User reviews this DIAGNOSIS and confirms (or corrects) before
Discovery begins.

---

## Version History

| Version | Date       | Description                      |
| ------- | ---------- | -------------------------------- |
| 1.0     | 2026-04-14 | Initial diagnosis (Session #281) |
