# Implementation Plan: Plan Orchestration

## Summary

Execute all 7 active plans in optimal sequence, maximizing parallelism where
risk is low, with convergence-loop verification at every major boundary. The
schedule is a 5-wave pipeline: S0 debt triage + repo-cleanup (Wave 0), 5 non-SWS
plans interleaved (Wave 1), SWS CANON (Wave 2), M1.6 feature work (Wave 2b), SWS
Steps 2-21 with checkpoint gates (Wave 3).

**Decisions:** See DECISIONS.md (26 decisions) **Effort Estimate:** XL (~90-145+
sessions across all waves) **Research:**
`.research/plan-orchestration/RESEARCH_OUTPUT.md` (22-agent L3)

## Progress (Session #237)

| Step  | Description                     | Status                                                  |
| ----- | ------------------------------- | ------------------------------------------------------- |
| Pre   | Merge planning-32326 to main    | DONE (PR #465)                                          |
| 1     | S0 Pre-Verification (CL agents) | DONE — 0 fixes needed, S0: 32→25                        |
| 2     | Repo Cleanup                    | DONE — 5 orphans, 3 archives, 7 docs, 3 deps            |
| 3     | S0 Fixes                        | DONE — no-op (all deferred/FP/resolved)                 |
| 4     | S0 Post-Verification            | DONE — no-op                                            |
| 5     | Wave 0 Audit                    | DONE — PASS, 7/7 checks                                 |
| 6     | Wave 1 Pre-Verification         | DONE — all 5 plans verified                             |
| 7     | Wave 1a (agent-env P4)          | DONE — 6 agents, 13 model fields, 2 teams, 2 new agents |
| 7     | Wave 1a (agent-env P5)          | DONE — CLAUDE.md, skills, hooks, monitoring, tracking   |
| 7     | Wave 1a (passive-surfacing)     | DONE — 14 root causes, 46 sites, CL-PROTOCOL Phase D+V  |
| 8     | Wave 1a Mid-Audit               | DONE — PASS, 5/5 shared files clean, 3548 tests pass    |
| 9     | Wave 1b (PR, CLI, SL)           | NOT YET                                                 |
| 10    | Wave 1 Final Audit              | NOT YET                                                 |
| 11-25 | Waves 2-3                       | NOT YET                                                 |

## Files to Create/Modify

### New Files (2)

1. **`.planning/plan-orchestration/PLAN.md`** — this file
2. **`.planning/plan-orchestration/DECISIONS.md`** — decision record

### Modified Files (3)

1. **`.planning/plan-orchestration/DIAGNOSIS.md`** — updated with research
   context
2. **`SESSION_CONTEXT.md`** — updated with orchestration schedule
3. **`ROADMAP.md`** — updated with wave tracking

---

## Pre-Condition: Merge planning-32326 to Main

Per D19. Before any plan execution begins, merge the current branch to main.
This ensures all plan branches start from a main that includes the orchestration
research artifacts and this plan.

**Done when:** `planning-32326` merged to main via PR. All research, findings,
challenges, decisions, and plan artifacts on main. **Depends on:** Nothing.

---

## Wave 0: S0 Debt Triage + Repo Cleanup (1-2 sessions)

### Step 1: S0 Pre-Verification (CL Protocol Phase D)

Per D6, D24. Run **CL-PROTOCOL.md Phase D** to triage the 8 unresolved S0 items
before any fixes. Agents must go deeper than grep — inspect actual code paths,
test behavior, check if vulnerabilities are exploitable in context.

**S0 items to triage:**

- DEBT-0774/0853/0855/0864: App Check cluster (4 entries, 1 root issue)
- DEBT-1293: Soft-deleted entries sent to client
- DEBT-1878: pull_request_target with PR head checkout
- DEBT-2121: execSync command injection risk
- DEBT-4399: Hard-coded password (likely SonarCloud FP)
- DEBT-4403: OS command safety
- DEBT-7544: fast-xml-parser DoS (transitive dep)

**Also:** Mark 4 RESOLVED items (DEBT-0849, 0854, 0856, 0865, 9295) for cleanup
in MASTER_DEBT.jsonl.

**Agent tasks:**

- For each S0 item: read the actual code, assess real-world exploitability,
  determine if fix is feasible in 1 session, classify as FIX NOW / DEFER / FP.
- Functional verification, not grep-only (per D25).

**Done when:** Each S0 item has a disposition (fix/defer/false-positive) with
evidence. RESOLVED items marked for cleanup. **Depends on:** Nothing (runs
parallel with Step 2).

---

### Step 2: Repo Cleanup

Execute the repo-cleanup plan (`.planning/repo-cleanup/PLAN.md`). Per research
S-01: 14 steps, 26 files, 60-90 minutes.

**Known discrepancies (from research, verify with CL before executing):**

- `scripts/config/rotation-policy.json` path may be wrong — actual path is
  `config/rotation-policy.json`
- knip.json has 2 dep suppressions (not 3 — `@playwright/test` was never
  suppressed)
- 2 files targeted for deletion may already be missing (`MASTER_DEBT.jsonl.bak`,
  `deep-plan-review-lifecycle.state.json`)

**CL verification (pre):** Agent verifies the 3 discrepancies above and any
other plan assumptions before execution begins.

**Done when:** All 14 repo-cleanup steps complete. Tests pass. PR-1 ready.
**Depends on:** Nothing (runs parallel with Step 1).

---

### Step 3: S0 Fixes

Execute fixes for S0 items classified as FIX NOW in Step 1.

**Done when:** Each FIX NOW item resolved. Per-fix atomic commits (per D17).
**Depends on:** Steps 1 and 2 both complete.

---

### Step 4: S0 Post-Verification (CL Protocol Phase V)

Per D6, D25. Run **CL-PROTOCOL.md Phase V** to verify S0 fixes are effective.
Must be functional verification — not grep for removed code, but proof the
vulnerability is actually closed.

**Done when:** Each fix verified with evidence. Any failed verifications
escalated for re-fix or deferral. **Depends on:** Step 3.

---

### Step 5: Wave 0 Audit

Per D26. Light audit — repo-cleanup is low risk, S0 fixes are targeted.

Run code-reviewer agent on all modified files from Steps 2-3. Check:

- No regressions introduced
- Pre-commit hooks still pass
- Tests pass
- MASTER_DEBT.jsonl RESOLVED items cleaned up

**Done when:** Audit findings addressed or tracked. PR-1 (repo-cleanup) and S0
fix commits ready. **Depends on:** Step 4.

---

## Wave 1: Non-SWS Plans (5-8 sessions)

Per D1, D5. WIP=1 per session. Session priority order:

1. **agent-env P4-P5** (critical path — blocks SWS)
2. **passive-surfacing** (stabilizes shared resources)
3. **propagation W1** (resolves S0 debt items)
4. **cli-tools** (must wait for PS session-start.js)
5. **custom-statusline** (fully independent, lowest priority)

### Step 6: Wave 1 Pre-Verification (CL Protocol Phase D)

Per D24. Run **CL-PROTOCOL.md Phase D** before starting Wave 1. Verify key plan
claims against current codebase state:

- agent-env: Phases 1-3 still marked done? Phase 4 entry criteria met?
- passive-surfacing: 33 violations still present? session-start.js unchanged
  since research?
- propagation: file counts match? (D16 triage agent produces exact lists)
- cli-tools: tool availability on current system?
- custom-statusline: Go toolchain available?

**Also per D16:** Run triage agent for propagation Steps 6-7 to produce exact
file lists (plan says 9/23, grep found 55/34).

**Done when:** Each plan's entry assumptions verified. Propagation file lists
produced. Any discrepancies flagged for resolution. **Depends on:** Wave 0
complete. PR-1 merged to main.

---

### Step 7: Wave 1a — Agent-Env P4 + Passive-Surfacing + Propagation W1 + Statusline Start

Per D5, D9, D22. WIP=1 per session, pick from priority list.

**Agent-env P4** (per D22, use agent teams for internal parallelism):

- Sub-steps (pruning, configs, validation) are independent
- Agent teams can parallelize within P4

**Passive-surfacing** (Steps 1-7, 9):

- Per D8: Add comment-delimited section labels to `.husky/pre-commit` before
  modifying (`# --- passive-surfacing-checks ---`)
- Per D9: Complete all session-start.js changes before CLI touches it

**Propagation W1** (Steps 1-5):

- Per D13: Baseline uses per-file structure
- Per D15: Remove continue-on-error for security+docs checks only

**Custom-statusline** (Steps 1-4):

- Fully independent. Float to any session where other plans are blocked.

**Done when:** AE P4 complete. PS Steps 1-7,9 complete. PR W1 complete. SL Steps
1-4 complete. **Depends on:** Step 6 verification pass.

---

### Step 8: Wave 1a Mid-Audit (CL Protocol Phase V)

Per D26. Run **CL-PROTOCOL.md Phase V** — medium audit, multiple plans modifying
shared files.

Phase V agents verify:

- session-start.js: PS changes functional (not just present)
- `.husky/pre-commit`: section ownership labels in place, hooks still work
- propagation baseline created and valid
- agent-env P4 pruning didn't break anything

**Done when:** All CL checks pass. Any issues fixed before proceeding. **Depends
on:** Step 7 PS session-start.js changes complete.

---

### Step 9: Wave 1b — Agent-Env P5 + CLI Tools + Propagation W2-W4 + Finish PS + Finish SL

Per D5, D9, D14, D17, D18.

**Agent-env P5:**

- Highest priority — completes the SWS hard gate
- Per D9: session-start.js changes come after PS is done

**CLI tools:**

- Per D9: starts session-start.js changes only after PS is done
- 25 steps, 8 phases, ~3-4 sessions

**Propagation W2-W4:**

- Per D14: shared-lib extraction targets utility files only (~30-40 files)
- Per D17: per-step atomic commits for rollback granularity
- Per D18: W3 can overlap with W2 tail (gitleaks, sec-helpers)
- Per D12: multi-AI review for propagation W2 PR (high risk, 100+ files)

**Passive-surfacing Steps 8-11:**

- Steps 8-10 before propagation Step 8 (ecosystem audit skill dependency)
- Step 11 (/skill-audit alerts) last

**Custom-statusline Steps 5-14:**

- Continue as lowest priority fill work

**Done when:** ALL non-SWS plans complete. All PRs created (not necessarily
merged — per D12, high-risk PRs get multi-AI review). **Depends on:** Step 8
mid-audit pass.

---

### Step 10: Wave 1 Final Audit (CL Protocol Phase V + Code-Reviewer)

Per D26. Run **CL-PROTOCOL.md Phase V** — heavy audit covering all Wave 1 work
before SWS gate.

**Phase V agents verify (multi-level, per D25):**

- agent-env ALL 5 phases complete and functional (not just "done" markers)
- session-start.js: all 3 plans' changes work together
- `.husky/pre-commit`: all section owners' checks execute correctly
- propagation: shared-lib works, baseline valid, no regressions in 100+ files
- cli-tools: all installed tools functional
- custom-statusline: Go binary builds and runs
- All tests pass (`npm test`)
- All patterns pass (`npm run patterns:check`)

**Code-reviewer agent** on all high-risk modified files.

**Done when:** All CL verifications pass. All PRs reviewed and merged to main.
HARD GATE for SWS confirmed: agent-env complete. **Depends on:** Step 9 all
plans complete.

---

## Wave 2: SWS CANON (6-10 sessions)

### Step 11: SWS Pre-Verification (CL Protocol Phase D)

Per D24. Run **CL-PROTOCOL.md Phase D** before starting SWS. Verify:

- Agent-env all 5 phases truly complete (functional check, not grep)
- Passive-surfacing 33 violations resolved (SWS won't re-flag them)
- All plan PRs merged to main — clean starting state
- SWS PLAN.md Step 1 assumptions still valid (file paths, patterns, counts)
- CANON prerequisites from research still accurate

**Done when:** All SWS entry assumptions verified. Green light for CANON.
**Depends on:** Step 10 Wave 1 audit pass. All PRs merged.

---

### Step 12: Execute SWS C1 — CANON (Step 1)

Execute SWS PLAN.md Step 1. Per research S-07/S-16: 6-10 sessions, creates
`.canon/` directory with schemas, tenets, registry, enforcement, changelog,
tests.

Per D3: Meta Pipelines (T&I, CQ, DE) begin after CANON.

**Done when:** `.canon/` exists and self-validates. canon-v0.1.0 tagged. SWS
Checkpoint #0 passed. **Depends on:** Step 11 verification pass.

---

### Step 13: SWS C1 Post-Verification + Checkpoint Gate #0

Per D4, D21, D25, D26.

**CL post-verification:** CANON actually works — schemas validate, enforcement
runs, registry is populated. Functional proof, not file-existence check.

**Checkpoint gate (per D21):** Structured checklist + `/alerts`:

1. Is CANON scope still valid for remaining SWS steps?
2. Did CANON reveal unexpected complexity?
3. Velocity: was 6-10 session estimate accurate?
4. New debt discovered during CANON?
5. Health score trend from `/alerts`
6. Should M1.6 proceed next (per D20)?

**User decision:** Continue to M1.6 (per D2/D20) / Skip M1.6, continue SWS /
Reduce SWS scope / Pause.

**Done when:** User makes checkpoint decision. CL verification passes. **Depends
on:** Step 12.

---

## Wave 2b: M1.6 Feature Work (5-8 sessions, per D2/D20)

### Step 14: M1.6 Completion

Per D2, D20. Execute remaining M1.6 (Admin Panel + UX) work. Currently 75%
complete, ~5-8 sessions estimated.

Break the 171-session feature drought. First user-facing work since Session #65.

**Done when:** M1.6 100% complete. User-facing features shipped. **Depends on:**
Step 13 checkpoint decision approves M1.6.

---

### Step 15: M1.6 Post-Verification + Audit

Per D25, D26. Full audit of M1.6 changes:

- Functional testing of new features
- Security audit (user-facing code)
- Performance check
- Tests pass

**Done when:** M1.6 verified, PR merged. **Depends on:** Step 14.

---

## Wave 3: SWS Steps 2-21 (74-120+ sessions, scope grows)

Per D3, D4, D21. SWS is a plan-for-making-plans. Effort is a floor. Meta
Pipelines (T&I, CQ, DE) are integrated within SWS starting here.

### Step 16: SWS C2 — Framework (Steps 2-3, ~8-15 sessions)

Execute SWS Steps 2-3. Framework validation + Zod schema integration.

**CL pre-verification:** Verify Step 2-3 assumptions against current state.

**Done when:** Framework complete. Checkpoint #1 passed. **Depends on:** Step 15
(or Step 13 if M1.6 skipped).

---

### Step 17: Checkpoint Gate #1

Per D4, D21. Structured checklist + `/alerts`. This is the critical framework
validation gate — D68 skip-and-return does NOT apply here.

**Done when:** User decision: continue / reduce / pause. **Depends on:**
Step 16.

---

### Step 18: SWS C3 — First Ecosystems (Steps 4-7, ~12-20 sessions)

Execute SWS Steps 4-7. First 4 ecosystem standardizations.

**CL pre-verification:** Before each ecosystem, verify its current state. **CL
post-verification:** After each ecosystem, verify it meets CANON standards.

**Done when:** 4 ecosystems at target maturity. Checkpoint #2 passed. **Depends
on:** Step 17.

---

### Step 19: Checkpoint Gate #2

Per D4, D21. Re-validate schedule. SWS scope may have grown. Per D11: full
schedule re-validation at this checkpoint.

**Done when:** User decision. **Depends on:** Step 18.

---

### Step 20: SWS C4 — Heavy Ecosystems (Steps 8-10, ~12-20 sessions)

Execute SWS Steps 8-10. These are the L-effort ecosystems.

**CL pre-verification:** Verify ecosystem state, cross-plan interactions. **Per
D12:** Multi-AI review for SWS ecosystem PRs.

**Done when:** Steps 8-10 complete. **Depends on:** Step 19.

---

### Step 21: SWS C5 — Remaining Ecosystems (Steps 11-15, ~18-30 sessions)

Execute SWS Steps 11-15. 15/18 ecosystems complete after this chunk. Research
identified this as the "best interleave point."

**Done when:** 15/18 ecosystems complete. Checkpoint #3 passed. **Depends on:**
Step 20.

---

### Step 22: Checkpoint Gate #3

Per D4, D21. Major checkpoint — 15/18 ecosystems done. Full re-validation:

- All patterns established
- Scope growth assessment
- Remaining 3 ecosystems: continue or "good enough"?
- User-facing work needed?

**Done when:** User decision. **Depends on:** Step 21.

---

### Step 23: SWS C6 — Final Ecosystems (Steps 16-18, ~18-33 sessions)

Execute SWS Steps 16-18. Final 3 ecosystems.

**Done when:** All 18 ecosystems at target maturity. **Depends on:** Step 22.

---

### Step 24: SWS C7 — Verification + Closure (Steps 19-21, ~6-12 sessions)

Execute SWS Steps 19-21. Cross-ecosystem validation, documentation, CANON v1.0.

**CL final verification:** All 18 ecosystems meet CANON standards. Full
functional verification, not grep.

**Done when:** CANON at v1.0.0. All health checkers passing. Checkpoint #4
passed. SWS complete. **Depends on:** Step 23.

---

### Step 25: Final Checkpoint Gate #4

Per D4, D21. SWS completion assessment:

- All 18 ecosystems at target maturity?
- Sub-plans generated during SWS — all complete or tracked?
- CANON v1.0.0 stable?
- Health score trend
- What's next on ROADMAP?

**Done when:** User confirms SWS complete. **Depends on:** Step 24.

---

## Step 26: Plan Orchestration Retrospective

Review the entire orchestration execution:

1. What did the plan get right?
2. What did the plan miss?
3. What should deep-plan/deep-research do differently?
4. Effort estimate accuracy (planned vs actual)
5. CL verification value — did it catch real issues?
6. Checkpoint gates — were they useful?

Capture in `.planning/plan-orchestration/RETRO.md`.

**Done when:** Retro written. Learnings captured. **Depends on:** Step 25.

---

## Duration Summary

| Wave    | Steps                    | Sessions | Cumulative  |
| ------- | ------------------------ | -------- | ----------- |
| Pre     | Merge PR                 | 0        | 0           |
| Wave 0  | S0 triage + repo-cleanup | 1-2      | 1-2         |
| Wave 1  | 5 non-SWS plans          | 5-8      | 6-10        |
| Wave 2  | SWS CANON                | 6-10     | 12-20       |
| Wave 2b | M1.6 features            | 5-8      | 17-28       |
| Wave 3  | SWS Steps 2-21           | 74-120+  | **91-148+** |

At 2 sessions/day: **~46-74+ working days**.

## Parallelization Guidance

- Steps 1 + 2 parallel (S0 pre-verify is read-only, repo-cleanup is write)
- Wave 1: WIP=1 per session, but agent-env P4 uses agent teams internally (D22)
- Propagation W3 overlaps W2 tail (D18)
- Custom-statusline floats to any session where primary plan is blocked
- SWS chunks are strictly sequential (SWS D63)
- M1.6 can be skipped/deferred at checkpoint (D20)

## CL Verification Points

| Location    | Type                   | Depth                               |
| ----------- | ---------------------- | ----------------------------------- |
| Step 1      | Pre-verification       | Deep — S0 exploitability assessment |
| Step 2      | Pre-verification       | Light — 3 known discrepancies       |
| Step 4      | Post-verification      | Deep — functional proof fixes work  |
| Step 6      | Pre-verification       | Medium — plan claim freshness       |
| Step 8      | Mid-audit              | Medium — shared file integration    |
| Step 10     | Final audit            | Heavy — all Wave 1 work, SWS gate   |
| Step 11     | Pre-verification       | Medium — SWS entry assumptions      |
| Step 13     | Post-verification      | Deep — CANON functional proof       |
| Steps 16-24 | Pre+post per ecosystem | Scales with ecosystem complexity    |
