# CAS Step A — Multi-Skill Audit Handoff

**Created:** 2026-04-15 (Session #282 mid-session, pre-context-clear) **For:**
Next session — post context clear **Branch:** `41526` (fresh from `origin/main`,
zero commits) **Task:** `/skill-audit` with `mode=multi` on 7 CAS skills (full
audit, all phases)

---

## Why this handoff exists

Session #282 completed the parity test for skill-audit batch mode (PLAN Steps
19+20 ✅, VERDICT: PASS). Upon starting Step A, the AI initially proposed
auditing recall first (promoting the parity findings to decisions). User
correction: **wrapper-first is wrong — handlers (primary skills) may change and
affect wrappers (analyze router, synthesize consumer). Audit them together via
`mode=multi`.**

Context clear is happening so the multi-audit starts with a clean budget rather
than the heavy context from the parity test.

---

## What is already done (do NOT redo)

1. **Parity test for skill-audit batch mode — PASS.**
   - `.planning/skill-audit-batch-mode/PARITY_TEST.md` (procedure + results +
     verdict)
   - `.planning/skill-audit-batch-mode/parity-run-single.md` (Run 1 findings, 12
     categories for recall)
   - `.planning/skill-audit-batch-mode/parity-run-batch.md` (Run 2 findings,
     batch mode)
   - `.claude/state/task-skill-audit-recall.run1-single.state.json` (archived
     Run 1 state)
   - PLAN Steps 19 + 20 marked ✅
   - Verdict: 100% overlap, zero missing cons/gaps, batch mode adds
     cross-category patterns as additive synthesis.

2. **Session #282 pre-flight.**
   - 10 health scripts ran (all exit 0; github-health flagged stale P0/P3 —
     deferred)
   - 3 hook warnings acked (pr-creep, tdms-s0, agent)
   - `rg` (ripgrep 15.1.0) installed via `scripts/install-cli-tools.sh`

3. **Branch state.**
   - `41526` branched from `origin/main` (which was fast-forwarded 18 commits
     from `d7a1df79`)
   - No commits yet on `41526`
   - Working tree has uncommitted parity-test artifacts (intentional — batch
     with Step A closure)

---

## The primary task: `/skill-audit --mode=multi`

Audit all 7 CAS skills in one run via native multi-mode orchestration. Do NOT
skip recall just because it was parity-tested — the parity test was scoped to
findings-only comparison; it did not produce decisions, implement fixes, or run
Phase 5 self-audit. A fresh full audit on recall (alongside the 6 others) is
correct.

### Skills to audit (exact list)

1. `.claude/skills/analyze/` — router (auto-detects source type, dispatches
   handler)
2. `.claude/skills/recall/` — query (FTS5/tag/type/source filters over SQLite
   index)
3. `.claude/skills/repo-analysis/` — handler (v4.6)
4. `.claude/skills/website-analysis/` — handler
5. `.claude/skills/document-analysis/` — handler
6. `.claude/skills/media-analysis/` — handler
7. `.claude/skills/synthesize/` — consumer (v1.2, Session #279)

### Invocation

```
/skill-audit --mode=multi
```

When prompted "Skills to audit (comma-separated list):", enter:

```
analyze, recall, repo-analysis, website-analysis, document-analysis, media-analysis, synthesize
```

### Expected flow (Shape Y)

1. **Phase 1.0** — mode = multi, capture skills list to parent batch state
2. **Phase 1** — per-skill preparation, read each SKILL.md + companions
3. **Phase 2b (per skill × 7)** — batched findings production, 12 categories
   each. Save `findings_by_category` per skill. Render 7 tmp files:
   `.claude/tmp/skill-audit-<name>-findings.md`
4. **Phase 2.A (multi only)** — cross-skill pattern detection. Patterns
   appearing in 3+ skills → write to parent batch state `cross_skill_patterns`.
   Present before 2.B begins
5. **Phase 2.B (per skill × 7)** — decision collection per category. Surface
   cross-skill patterns inline. Conflict checks (real-time + final sweep)
6. **Phase 2.5** — operational deps check per skill
7. **Phase 3 batched** — ONE crosscheck across the batch (skill-creator,
   self-audit, adjacent contracts, ecosystem impact aggregated + deduped)
8. **Phase 4** — implementation. Priority order, batch related changes, flag
   conflicts, low-confidence confirms. **Likely adds
   `scripts/skills/<name>/self-audit.js` per the Cat 12 canonical fix action for
   skills scoring <7.** Run `npm run skills:validate`
9. **Phase 5** — parallel self-audit.js dispatch (one per skill in the batch).
   Aggregate ---SUMMARY--- JSON blocks into composite table
10. **Phase 6** — auto-learnings + invocation tracking with `mode:"multi"` +
    `batch_id` + `skills_in_batch`

### Realistic time budget

**2-4 hours interactive.** Original SESSION_CONTEXT estimate of 30-60 min was
based on the old (pre-Session #281) model of 7 parallel code-reviewer agents;
that model was removed. Native multi-mode is faithful but slower because
decisions are real.

### Triage mode recommendation

Per REMAINING_CAS_TASKS.md Step A: **Triage mode 3** — fix P0/P1 in-session,
defer P2 to TDMS, skip P3. Prevents decision paralysis.

---

## Pre-flight checklist (run before starting the skill-audit)

1. Verify branch — should be `41526`, clean tree or only parity-test artifacts
   uncommitted
2. Verify skill-audit v4.0+ loaded —
   `grep "Phase 2b" .claude/skills/skill-audit/SKILL.md` should return ≥8
3. Verify self-audit pattern is wired —
   `ls scripts/skills/skill-audit/self-audit.js` should exist
4. Check for existing audit state on the 7 skills —
   `ls .claude/state/task-skill-audit-*.state.json`. If state exists for any of
   the 7, decide: resume or archive-and-fresh
5. Verify skills validate cleanly before audit starts —
   `npm run skills:validate` (passing floor)
6. Check current SonarCloud / TDMS S0 count — so any CI drift during the audit
   is attributable

---

## Key context the new session needs

### Critical files to read (in order)

1. `SESSION_CONTEXT.md` — session #281 handoff (the #282 entry hasn't been
   written yet — see "State to write at session-end" below)
2. **This file** (`.planning/content-analysis-system/STEP_A_HANDOFF.md`)
3. `.planning/content-analysis-system/REMAINING_CAS_TASKS.md` Step A (full
   spec + Session #280 update)
4. `.planning/skill-audit-batch-mode/PARITY_TEST.md` (parity test results —
   validates that multi-mode findings will be faithful)
5. `.claude/skills/skill-audit/SKILL.md` (v4.0 — has Phase 2b + 2.A + 2.B +
   batched Phase 3 + parallel Phase 5)
6. `.claude/skills/skill-audit/REFERENCE.md` (12 category definitions + Batch
   procedures + Parent Batch State Schema)
7. `.claude/skills/_shared/SELF_AUDIT_PATTERN.md` (canonical pattern for
   per-skill self-audit.js — likely Phase 4 output)
8. `scripts/skills/skill-audit/self-audit.js` (reference impl; template for 7
   new self-audits the audit will likely scaffold)

### Session #281 changes that impact Step A

- **code-reviewer agent REMOVED** from all /skill-audit modes (D11). Do NOT
  dispatch code-reviewer agents as part of the audit.
- **Phase 5.0** now invokes
  `scripts/skills/skill-audit/self-audit.js --target=<skill>` — parallel
  dispatch for multi mode.
- **Cat 12 canonical fix:** when a skill scores <7 on Cat 12, Phase 4 SHOULD
  create `scripts/skills/<skill-name>/self-audit.js`. Expect to add 4-7 of these
  during Step A implementation.
- **audit-review-team decoupled** from /skill-audit (D19). If
  .claude/teams/audit-review-team.md is referenced, it's for other workflows
  only.

### Parity test caveats carried forward

The parity test passed but had a same-session bias disclosure. Multi-mode on 7
skills is NOT the same setup — each skill is analyzed in sequence with
faithfulness guarantee, not comparison runs. Parity risk is orthogonal here. The
PASS result gives reasonable confidence multi-mode findings will match
single-mode findings on each skill.

---

## State to write at session-end of the NEW session (when Step A completes)

1. **Commit the parity-test artifacts** from Session #282 (currently
   uncommitted):
   - `.planning/skill-audit-batch-mode/PARITY_TEST.md` (edited)
   - `.planning/skill-audit-batch-mode/parity-run-single.md` (new)
   - `.planning/skill-audit-batch-mode/parity-run-batch.md` (new)
   - `.planning/skill-audit-batch-mode/PLAN.md` (Steps 19+20 markers)
   - `.claude/state/task-skill-audit-recall.run1-single.state.json` (archived)
   - `.planning/content-analysis-system/STEP_A_HANDOFF.md` (this file)
   - `.claude/state/hook-warnings-ack.json` (session #282 ack sync)

2. **Commit Step A work** separately: new self-audit.js files, updated
   SKILL.md/REFERENCE.md per audit decisions, state files for the 7 audits.

3. **Update PLAN markers:**
   - `.planning/content-analysis-system/PLAN.md` — Step 14 ⏳ → ✅
   - Consider whether Step B (E2E /recall) and Step C (T28 closure) happen same
     session

4. **Update SESSION_CONTEXT.md:**
   - Bump counter to #282 (pre-flight) and then #283 (if new session) or stay
     #282 depending on handoff timing
   - Record: parity test PASS (Session #282), Step A execution (Session #283?)

---

## Session #282 work log (context the new session will NOT have)

For the record if the new session needs to reconstruct:

1. Hard reset to origin/main, created branch `41526`
2. `/session-begin` — ran 10 health scripts, acked 3 hook warnings, installed
   rg, deferred github-health P0/P3 (stale), deferred multi-AI audit + debt
   runner
3. Executed PLAN Steps 19 + 20 (parity test on recall)
4. **Declined** to build a github-health ack pattern (user scoped it out as "too
   involved for such a small thing")
5. Generated this handoff doc

No commits yet on `41526`. All Session #282 work is in the working tree.

---

## Action protocol for next session (short version)

```
1. /session-begin (if not already)
2. Read this file + linked files
3. Verify pre-flight checklist above
4. Commit Session #282 parity-test artifacts in one commit (optional but recommended)
5. /skill-audit --mode=multi
6. Skills list: analyze, recall, repo-analysis, website-analysis, document-analysis, media-analysis, synthesize
7. Triage mode 3 (fix P0/P1, defer P2 to TDMS, skip P3)
8. Expect Phase 4 to scaffold ~4-7 new self-audit.js scripts
9. /session-end when complete (or at clean Phase boundary if running long)
```

---

## Guard rails for the next session

- **Do NOT re-run the parity test.** It's done; PASS.
- **Do NOT audit recall in isolation before the others.** User correction:
  primary skills may change, do them together.
- **Do NOT skip any of the 7 skills.** Multi mode value is in the cross-skill
  pattern detection (Phase 2.A); skipping any weakens that.
- **Do NOT dispatch code-reviewer agents** (removed from /skill-audit by D11).
- **Do NOT proceed past Phase 4 into implementation without user approval** on
  the accumulated decision set — that's a standard gate, preserved in multi
  mode.
- **Pause and /session-end if context budget looks thin mid-audit.** Don't rush
  through decisions to finish.
