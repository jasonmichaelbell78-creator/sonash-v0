# Findings: Cross-Plan Dependency Graph and Critical Path

**Searcher:** deep-research-searcher (cross-cutting analyst)
**Profile:** codebase
**Date:** 2026-03-24
**Sub-Question IDs:** S-09 (cross-cutting analysis)
**Inputs:** S-01 through S-07 findings, DIAGNOSIS.md

---

## 1. Dependency Graph (DAG)

### Legend

- `-->` = HARD block (MUST complete before downstream starts)
- `..>` = SOFT block (SHOULD complete first; benefits downstream but not required)
- `---` = SHARED FILE CONFLICT (not a dependency, but concurrent modification risk)

### Full Graph

```
                    repo-cleanup (M, 60-90 min)
                    /    |    \      \       \
                  ..>  ..>   ..>    ..>     ..>
                 /      |      \      \       \
   cli-tools   passive  prop  agent-env  custom-statusline
   (L, 3-4h)  (M,1-2s) (M-L) (L,P4-5)   (L, 3-4s)
        \        |       /       |
        ..>    ..>     ..>     -->
          \    |      /         |
           v   v    v           v
        system-wide-standardization (XL, 80-130 sessions)
```

### Hard Dependencies (MUST sequence)

```
agent-env (ALL 5 phases) --> SWS Step 1 (CANON)
```

**Evidence:** Memory note `project_agent_env_analysis.md` explicitly states: "All
5 phases must complete before SWS Phase 1." PLAN-v3.md Step 3.14 confirms agent-env
plan executes the Agents ecosystem step of SWS, so agent-env outputs are a concrete
input to SWS's agent standardization work.

**Nuance (from convergence loop):** The hard block is specifically that agent-env
Phases 4-5 must complete before SWS *starts*, because:
1. SWS Step 13 (Agents) relies on improved agent definitions from agent-env Phase 4
2. SWS Step 1 (CANON) benefits from agent-env Phase 5 (process integration) having
   already wired hooks, compliance checks, and invocation schemas -- which CANON
   would otherwise need to retrofit
3. The STEP_3_14_COVERAGE_AUDIT.md confirms agent-env fully subsumes SWS Step 3.14

This is the ONLY true hard block in the entire 7-plan graph.

### Soft Dependencies (SHOULD sequence)

```
repo-cleanup ..> cli-tools          (removes orphan scripts, fixes stale docs)
repo-cleanup ..> passive-surfacing  (updates hook docs, TRIGGERS.md)
repo-cleanup ..> propagation        (clean rotation-policy, doc state reduces false findings)
repo-cleanup ..> agent-env          (updates AGENT_ORCHESTRATION.md version ref)
repo-cleanup ..> SWS                (don't standardize things that should be deleted)
passive-surfacing ..> SWS           (pre-fixes 33 violations SWS would flag)
propagation ..> SWS                 (shared-lib, baseline, consolidated patterns)
cli-tools ..> SWS                   (CLAUDE.md Section 6b in place for SWS to govern)
agent-env ..> custom-statusline     (token monitoring provides statusline widget data)
```

### No Dependency (fully independent)

```
custom-statusline <-> cli-tools         (ZERO overlap; Go binary vs shell tools)
custom-statusline <-> passive-surfacing (ZERO overlap)
custom-statusline <-> propagation       (ZERO overlap)
cli-tools <-> propagation               (ZERO overlap)
passive-surfacing <-> propagation       (ZERO overlap; different files entirely)
passive-surfacing <-> cli-tools         (WEAK overlap on session-start.js -- see conflicts)
```

---

## 2. Critical Path Analysis

### Longest Dependency Chain

```
agent-env Phase 4 (1-2 sessions)
  --> agent-env Phase 5 (1 session)
    --> SWS Step 1: CANON (6-10 sessions)
      --> SWS Steps 2-21 (74-120 sessions)
```

**Total critical path length: ~82-133 sessions**

This is overwhelmingly dominated by SWS itself. The agent-env tail (Phases 4-5,
~2-4 sessions) is a small fraction of the total.

### Minimum Wave Count (Parallelized)

Given the dependency structure, the minimum number of sequential waves is **4**:

| Wave | Plans | Duration (sessions) | Rationale |
|------|-------|---------------------|-----------|
| **Wave 0** | repo-cleanup | 1 session (60-90 min) | Quick win; clears the deck for everything else |
| **Wave 1** | cli-tools, passive-surfacing, propagation, custom-statusline, agent-env (Phases 4-5) -- ALL IN PARALLEL | 3-4 sessions | All 5 can run concurrently. Agent-env is the longest at 2-4 sessions. Others finish faster. |
| **Wave 2** | SWS Step 1 (CANON) | 6-10 sessions | Blocked on agent-env completion. Start immediately after agent-env Phase 5 finishes. |
| **Wave 3** | SWS Steps 2-21 | 74-120 sessions | Strictly sequential within SWS per D63. |

**Total elapsed time: ~84-135 sessions** (waves are sequential, but Wave 1 has 5
plans running in parallel)

### Alternative: More Aggressive Parallelism

If repo-cleanup is folded into Wave 1 (run first within the wave, takes only 1
hour while others are setting up), we reduce to **3 waves**:

| Wave | Plans | Duration |
|------|-------|----------|
| **Wave 1** | repo-cleanup (first hour) + cli-tools + passive-surfacing + propagation + custom-statusline + agent-env P4-5 | 3-4 sessions |
| **Wave 2** | SWS Step 1 (CANON) | 6-10 sessions |
| **Wave 3** | SWS Steps 2-21 | 74-120 sessions |

This is viable because repo-cleanup has no hard dependencies pointing TO it -- it
just provides cleaner inputs. Starting repo-cleanup at the beginning of Wave 1
gives it a head start before the other plans modify shared files.

### Plans on Critical Path vs Float

| Plan | On Critical Path? | Float |
|------|-------------------|-------|
| **repo-cleanup** | NO | Can run anytime before SWS. Has ~3-4 sessions of float (Wave 0 or early Wave 1). |
| **cli-tools** | NO | Can run anytime. ~80+ sessions of float. |
| **passive-surfacing** | NO | Can run anytime before SWS. ~80+ sessions of float. |
| **propagation** | NO | Can run anytime. ~80+ sessions of float. |
| **custom-statusline** | NO | Can run anytime. ~80+ sessions of float. |
| **agent-env (P4-5)** | YES | On critical path. Delays here directly delay SWS start. ZERO float relative to SWS. |
| **SWS** | YES | Terminal plan. Always on critical path. |

**Implication:** Agent-env Phases 4-5 should be prioritized as the single most
schedule-sensitive work item outside of SWS itself.

---

## 3. Intra-Plan Phase Dependencies

### Agent-Env: Phase 4 vs Phase 5

Phase 4 (Improvements) and Phase 5 (Process Integration) are **strictly
sequential within agent-env** -- Phase 5 wires improvements from Phase 4 into
CLAUDE.md, hooks, and skills. Phase 5 cannot start until Phase 4 defines which
agents to keep, improve, prune, and merge.

**Can other work happen between Phases 4 and 5?** YES. Phase 4 outputs are
committed agent `.md` file changes. A different plan could execute between Phases
4 and 5 without conflict, as long as that plan does not modify:
- `.claude/agents/*.md` files (Phase 4's outputs)
- `CLAUDE.md` Section 7 (Phase 5's target)
- `.husky/pre-commit` (Phase 5's target)

Practically, repo-cleanup and custom-statusline could safely interleave here.
Passive-surfacing and cli-tools touch some of Phase 5's target files (session-start.js,
CLAUDE.md) so they should ideally complete BEFORE agent-env Phase 5.

### SWS Phases: External Dependencies

SWS is internally sequential (D63), but specific steps have inputs from other plans:

| SWS Step | External Input | From Plan | Nature |
|----------|---------------|-----------|--------|
| Step 1 (CANON) | Agent-env all 5 phases complete | agent-env | HARD -- agent ecosystem must be stabilized |
| Step 1 (CANON) | Clean repo state | repo-cleanup | SOFT -- don't standardize dead files |
| Step 2 (Skills) | None external | -- | Self-contained |
| Step 3 (Hooks) | Passive-surfacing violations fixed | passive-surfacing | SOFT -- avoids flagging 33 known violations |
| Step 3 (Hooks) | Propagation hook telemetry | propagation Step 11 | SOFT -- better data available |
| Step 5 (Docs) | Clean doc state | repo-cleanup | SOFT -- stale docs already updated |
| Step 8 (TDMS S1) | Propagation consolidation done | propagation Steps 6-8 | SOFT -- shared-lib, readJsonl consolidation |
| Step 9 (Scripts) | CLI tools installed | cli-tools | SOFT -- tools available for script development |
| Step 13 (Agents) | Agent-env improvements | agent-env | Already consumed -- agent-env subsumes this step |

**Key insight:** All SWS external dependencies except agent-env are SOFT. This
means SWS can start after agent-env finishes, regardless of whether other plans
are complete. The benefits of completing passive-surfacing and propagation before
SWS are real but not blocking.

### Propagation Waves: Interleaving Opportunities

Propagation has 4 internal waves:
- **W1 (Steps 1-5, 3h):** Critical fixes, can run anytime
- **W2 (Steps 6-8, 8h):** Mass consolidation, touches 100+ files
- **W3 (Steps 9-11, 4h):** Infrastructure hardening
- **W4 (Steps 12-14, 2h):** Cleanup

Other plans CAN interleave between propagation waves. W2 is the highest-risk
wave (100+ file refactoring) and should NOT overlap with any plan that modifies
files in `scripts/` or `.claude/skills/*ecosystem*/`. This means:
- cli-tools and custom-statusline: safe to interleave (different file domains)
- passive-surfacing: safe to interleave (different files)
- repo-cleanup: should NOT interleave with W2 (overlapping `scripts/` domain)
- agent-env: safe to interleave (different files)
- SWS: should NOT run during propagation (too many shared files)

---

## 4. Dependency Verification

| Dependency | Claimed By | Evidence | Verified? | Hard/Soft |
|------------|-----------|----------|-----------|-----------|
| agent-env (all 5 phases) --> SWS | Memory note, DIAGNOSIS.md, STEP_3_14_COVERAGE_AUDIT.md | Memory: "All 5 phases must complete before SWS Phase 1." PLAN-v3.md Step 3.14: "Executed via Agent Environment Analysis plan." | YES | HARD |
| repo-cleanup ..> SWS | DIAGNOSIS.md: "cleans house for everything else" | S-01 finding: "SWS touches many docs and config files. Repo-cleanup removes orphans and fixes stale docs first." | YES | SOFT |
| repo-cleanup ..> cli-tools | S-01: removes orphan `scripts/test-semgrep-rules.js` | S-01 verified: file EXISTS, would be removed | YES | SOFT (minor -- cli-tools works around it) |
| repo-cleanup ..> passive-surfacing | S-01: updates TRIGGERS.md, HOOKS.md | S-01 verified: these docs updated in Step 10 | YES | SOFT (informational, not blocking) |
| repo-cleanup ..> propagation | S-01: clean rotation-policy.json | S-01 verified: rotation-policy updated in Step 6 | YES | SOFT (reduces false findings) |
| repo-cleanup ..> agent-env | S-01: updates AGENT_ORCHESTRATION.md version ref | S-01 verified: doc version updated in Step 10e | YES | SOFT (cosmetic) |
| passive-surfacing ..> SWS | S-04: "pre-fixes 33 violations SWS would flag" | S-04 verified: 33 violations across 19 files. SWS Hook step (Step 3) would encounter all of these. | YES | SOFT (saves SWS ~1-2 sessions of violation handling) |
| propagation ..> SWS | S-05: shared-lib, baseline, consolidated patterns | S-05 verified: Step 8 creates shared-lib for ecosystem audits, Steps 6-7 consolidate canonical patterns | YES | SOFT (provides cleaner foundation for SWS Scripts step) |
| cli-tools ..> SWS | S-03: CLAUDE.md Section 6b modification | S-03 verified: Step 17 adds tool preferences | YES | SOFT (SWS governs what's already in place) |
| agent-env ..> custom-statusline | S-06: Step 5.4 token monitoring provides widget data | S-06 verified: token monitoring JSONL pipeline feeds statusline | YES | SOFT (statusline works without it; adds richness) |
| DIAGNOSIS.md: "SWS gated on CANON framework" | DIAGNOSIS.md line 35 | MISLEADING. CANON is built WITHIN SWS Step 1, not an external dependency. SWS has no external hard blocks except agent-env. | CORRECTED | N/A (internal step, not external dependency) |
| DIAGNOSIS.md: "Agent-env depends on Agent Teams SDK" | DIAGNOSIS.md line 36 | VERIFIED but RESOLVED. Phases 1-3 already completed using Agent Teams SDK. Phase 4 still needs it but SDK is proven functional. | YES (but low risk) | HARD (for Phase 4 execution, not for inter-plan sequencing) |
| DIAGNOSIS.md: "Most plans have NO inter-dependencies" | DIAGNOSIS.md line 32 | PARTIALLY CORRECT. See analysis below. | PARTIALLY | N/A |

### Verification of DIAGNOSIS.md Claim: "Most plans have NO inter-dependencies"

This claim is **mostly correct but understated**. After Wave 1 analysis:

- **True:** 5 of 7 plans have ZERO hard dependencies on each other
- **True:** custom-statusline is completely independent
- **Nuanced:** There is ONE hard dependency (agent-env --> SWS)
- **Understated:** There are FIVE soft dependencies pointing toward SWS
- **Understated:** There are significant SHARED FILE CONFLICTS that create
  practical sequencing constraints even without formal dependencies

The DIAGNOSIS was correct directionally but too dismissive of soft dependencies
and shared file conflicts.

---

## 5. Shared File Conflict Matrix

This is not about dependencies but about **practical execution risk** when plans
modify the same files.

| Shared File | Plans That Modify It | Conflict Risk | Mitigation |
|-------------|---------------------|---------------|------------|
| `.claude/hooks/session-start.js` (1077 lines) | cli-tools (Step 18), passive-surfacing (Step 1) | **HIGH** | Sequence: passive-surfacing first (fixes violations), then cli-tools (adds tool detection). Both are additive to different sections. |
| `CLAUDE.md` | cli-tools (Step 17, add Section 6b), agent-env (Step 5.1, update Section 7) | **MEDIUM** | Different sections. Can merge cleanly if sections don't overlap. |
| `.husky/pre-commit` | passive-surfacing (Step 6), propagation (Step 11), agent-env (Step 5.3), SWS (Steps 1,3, progressive) | **HIGH** | Run passive-surfacing and propagation first (smaller changes). Agent-env Phase 5 next. SWS last (rewrites most aggressively). |
| `.claude/settings.json` | cli-tools (Step 19), custom-statusline (Step 10) | **MEDIUM** | Different keys. cli-tools adds ntfy hook entry; statusline changes `statusLine.command`. Can merge. |
| `package.json` | repo-cleanup (Step 8, remove deps), cli-tools (Step 15, add tsgo) | **LOW** | Different operations (remove vs add). Clean merge. |
| `docs/agent_docs/AGENT_ORCHESTRATION.md` | repo-cleanup (Step 10e), agent-env (Phase 5, potentially) | **LOW** | repo-cleanup fixes version ref; agent-env may add agent guidance. Non-conflicting. |

### Recommended Sequencing for Shared Files

For `session-start.js` (the highest-risk shared file):
1. **passive-surfacing Step 1** first (fixes 7 violations, adds state flags)
2. **cli-tools Step 18** second (adds tool detection logic to a now-clean file)

For `.husky/pre-commit`:
1. **passive-surfacing Step 6** (add Fix command, route to JSONL)
2. **propagation Step 11** (add EXIT trap for failure telemetry)
3. **agent-env Step 5.3** (add agent-based triggers)
4. **SWS Steps 1/3** (CANON validation gates -- last, as most transformative)

---

## 6. Parallelism Opportunities

### Maximum Parallel Sets

**Set A (ZERO mutual dependencies, fully parallel):**
- custom-statusline
- cli-tools (Phases 1-4)
- propagation (Wave 1)

These three plans touch completely different file domains and can run simultaneously
without any coordination.

**Set B (ZERO mutual dependencies, fully parallel, but should follow repo-cleanup):**
- passive-surfacing
- propagation (Waves 2-4)

These benefit from repo-cleanup completing first but have zero dependencies on
each other.

**Set C (Sequential due to hard dependency):**
- agent-env (Phases 4-5) THEN SWS

This is the critical path and cannot be parallelized.

### Optimal Execution Schedule

| Wave | Parallel Set | Plans Running | Duration | Notes |
|------|-------------|---------------|----------|-------|
| **Wave 0** | Setup | repo-cleanup | 1 session | Quick win. Clears deck. |
| **Wave 1** | Full parallel | cli-tools + passive-surfacing + propagation W1-W2 + custom-statusline + agent-env P4 | 3-4 sessions | All 5 in parallel. Agent-env P4 is schedule-critical. |
| **Wave 1b** | Continued | propagation W3-W4 + agent-env P5 + cli-tools (Phase 5-8 if not done) | 1-2 sessions | Tail work from Wave 1. Agent-env P5 must complete to unblock SWS. |
| **Wave 2** | SWS start | SWS Step 1 (CANON) | 6-10 sessions | All other plans should be complete by now. |
| **Wave 3** | SWS main | SWS Steps 2-21 | 74-120 sessions | Strictly sequential per D63. |

### Practical Note on "Parallel" Execution

The user is a solo developer. "Parallel" means interleaving work across sessions,
not literally running plans simultaneously. The practical benefit of parallelism is:
- Session flexibility: pick up any Wave 1 plan in any session
- No blocking: if one plan stalls (e.g., waiting for API keys for custom-statusline
  weather widgets), switch to another
- Faster critical path: prioritize agent-env P4-P5 when possible since it gates SWS

---

## 7. Convergence Loop

### CL-1: Can I cite the specific step/file creating each dependency?

| Dependency | Specific Evidence |
|------------|------------------|
| agent-env --> SWS | Memory note line 19: "All 5 phases must complete before SWS Phase 1." PLAN-v3.md lines 1542-1544: "Executed via Agent Environment Analysis plan." Agent-env Phase 4 outputs (improved `.claude/agents/*.md`) are consumed by SWS Step 13. Agent-env Phase 5 outputs (CLAUDE.md S7, hooks, invocation schemas) would need to be re-done by SWS if not completed first. |
| repo-cleanup ..> others | S-01 Step 2 (delete orphans), Step 6 (fix rotation-policy), Step 10 (update 7 docs). Each of these cleans up artifacts that other plans would otherwise encounter as noise. |
| passive-surfacing ..> SWS | S-04: 33 specific violations (V1-V33) across 19 files. SWS Step 3 (Hooks, L3->L4) would need to address all surviving violations. |

**Result:** All dependencies have specific step-level evidence. VERIFIED.

### CL-2: Circular dependencies?

Checking for cycles:
- repo-cleanup --> nothing (source node only)
- cli-tools --> nothing (source node only, soft dep on repo-cleanup)
- passive-surfacing --> nothing (soft dep on repo-cleanup, soft dep TO SWS)
- propagation --> nothing (soft dep TO SWS)
- custom-statusline --> nothing (independent)
- agent-env --> SWS only (one-directional)
- SWS --> nothing downstream (terminal node)

**No circular dependencies exist.** The graph is a DAG. VERIFIED.

### CL-3: Does the critical path match effort estimates?

Critical path: agent-env P4 (1-2 sessions) + agent-env P5 (1 session) + SWS (80-130 sessions) = ~82-133 sessions.

From the inventories:
- Agent-env remaining: S-06 says "3-5 hours (165-330 min) across 2-4 sessions" for Phases 4-5 + checkpoint
- SWS total: S-07 says "80-130 sessions" (table-based sum)

The numbers align. The critical path is dominated by SWS by a factor of ~30x over
agent-env's remaining work. This means even a 2x overrun on agent-env (4-8 sessions
instead of 2-4) would barely move the needle on total elapsed time.

**Result:** Critical path matches effort estimates. VERIFIED.

### CL-4: Is the DIAGNOSIS claim "Most plans have NO inter-dependencies" still true?

**After Wave 1 research: MOSTLY TRUE, with important caveats.**

- 5 of 7 plans have zero HARD inter-dependencies (correct)
- 1 hard dependency exists: agent-env --> SWS (correctly identified in DIAGNOSIS)
- Multiple SOFT dependencies exist that the DIAGNOSIS did not enumerate
- Shared file conflicts create practical sequencing needs the DIAGNOSIS missed entirely

The DIAGNOSIS was a reasonable first-pass but understated the soft dependency and
shared file conflict picture.

### CL-5: Is the agent-env --> SWS block truly ALL 5 phases?

**YES, for maximum benefit. But with nuance.**

The memory note says "All 5 phases must complete before SWS Phase 1." Let me
examine what each phase contributes:

| Agent-env Phase | What SWS Needs From It | Truly Required? |
|----------------|----------------------|-----------------|
| Phase 1 (Research) | Agent inventory, gaps, external patterns | YES -- SWS Step 13 uses findings |
| Phase 2 (Audit Creation) | `/audit-agent-quality` skill | YES -- SWS Step 14 (Audits) references it |
| Phase 3 (Audit Execution) | Disposition of all 36 agents | YES -- SWS Step 13 implements dispositions |
| Phase 4 (Improvements) | Improved agent definitions | YES -- SWS Step 13 standardizes the improved versions |
| Phase 5 (Process Integration) | CLAUDE.md S7, hooks, invocation schemas | PARTIALLY -- SWS could do this itself in Step 13, but it would duplicate work |

**Could SWS start after Phase 4 instead of Phase 5?**

Theoretically yes -- SWS could absorb Phase 5's integration work into its own
Step 13. But this would mean:
1. SWS Step 13 becomes larger (adding 5 integration tasks)
2. CLAUDE.md Section 7 would be written twice (once in agent-env P5, once in SWS)
3. Hook integration would need to happen in SWS context instead

The memory note's "all 5 phases" is the correct recommendation. Phase 5 is only
~1 session, and skipping it to start SWS 1 session earlier creates more work
downstream.

**Result:** ALL 5 phases confirmed as the correct gate. VERIFIED.

### Corrections From Convergence Loop

1. **DIAGNOSIS.md "CANON framework" framing corrected.** CANON is SWS Step 1,
   not an external dependency. SWS has no external hard blocks except agent-env.

2. **Shared file conflicts added as a new analysis dimension.** The original
   dependency analysis focused only on output-->input relationships but missed
   the concurrent-modification risk on shared files (session-start.js, pre-commit,
   CLAUDE.md, settings.json). These create practical sequencing needs.

3. **Agent-env --> SWS dependency confirmed as ALL 5 phases** after examining
   what each phase contributes. Phase 5 skip is not worth the downstream cost.

4. **"Most plans have no inter-dependencies" reaffirmed** as directionally correct
   but understated. The soft dependency and shared file picture is richer than
   DIAGNOSIS suggested.

---

## Summary: Optimal Execution Order

```
Wave 0 (1 session):     repo-cleanup
Wave 1 (3-4 sessions):  [passive-surfacing, cli-tools, propagation, custom-statusline, agent-env P4-5] all parallel
Wave 2 (6-10 sessions): SWS Step 1 (CANON)
Wave 3 (74-120 sessions): SWS Steps 2-21
```

**Within Wave 1, priority order for session allocation:**
1. **agent-env P4-5** (HIGHEST -- on critical path, gates SWS)
2. **passive-surfacing** (HIGH -- fixes 33 violations before SWS touches hooks)
3. **propagation W1-W2** (MEDIUM -- consolidates patterns before SWS Scripts step)
4. **cli-tools** (MEDIUM -- provides tooling for all future work)
5. **custom-statusline** (LOWER -- nice-to-have, completely independent, can float)

**Total elapsed time: ~84-135 sessions (~40-65 working days at 2 sessions/day)**

---

## Sources

| # | Path | Type | Trust | Date |
|---|------|------|-------|------|
| 1 | `.research/plan-orchestration/findings/S-01-repo-cleanup.md` | Findings | HIGH | 2026-03-24 |
| 2 | `.research/plan-orchestration/findings/S-02-custom-statusline.md` | Findings | HIGH | 2026-03-24 |
| 3 | `.research/plan-orchestration/findings/S-03-cli-tools.md` | Findings | HIGH | 2026-03-24 |
| 4 | `.research/plan-orchestration/findings/S-04-passive-surfacing.md` | Findings | HIGH | 2026-03-24 |
| 5 | `.research/plan-orchestration/findings/S-05-propagation.md` | Findings | HIGH | 2026-03-24 |
| 6 | `.research/plan-orchestration/findings/S-06-agent-env.md` | Findings | HIGH | 2026-03-24 |
| 7 | `.research/plan-orchestration/findings/S-07-sws.md` | Findings | HIGH | 2026-03-24 |
| 8 | `.planning/plan-orchestration/DIAGNOSIS.md` | Diagnosis | HIGH | 2026-03-23 |
| 9 | `.planning/system-wide-standardization/PLAN-v3.md` (lines 1529-1584) | SWS Plan v3 | HIGH | 2026-03-04 |
| 10 | Memory: `project_agent_env_analysis.md` | Memory note | HIGH | 2026-03-19 |

## Contradictions

1. **DIAGNOSIS.md vs reality on CANON.** DIAGNOSIS says "SWS is gated on CANON
   framework (not yet built)" which implies CANON is an external prerequisite.
   S-07 findings confirm CANON is Step 1 OF SWS, not external. SWS's only
   external hard dependency is agent-env completion. This contradiction is
   resolved in favor of S-07 (based on PLAN.md text).

2. **SWS effort header vs table.** DIAGNOSIS says "XL (40-60 sessions)." S-07
   findings show the effort table sums to 80-130 sessions. The 40-60 figure
   appears stale. This affects critical path duration estimates.

## Gaps

1. **Session-start.js merge protocol undefined.** Both cli-tools and passive-surfacing
   modify this 1077-line file. No merge protocol exists for coordinating changes.
   Recommended: passive-surfacing first, cli-tools second.

2. **SWS interleaving protocol with other plans undefined.** D71 says SWS can
   interleave with project work, but no protocol exists for handling shared file
   conflicts during interleaving.

3. **Propagation W2 collision risk with SWS Steps 8-9.** If propagation W2 (mass
   consolidation of 100+ script files) overlaps with SWS Step 8 (TDMS) or Step 9
   (Scripts), massive merge conflicts are likely. These should not run concurrently.

## Serendipity

1. **The dependency graph is remarkably shallow.** Only 1 hard dependency across 7
   plans. This means the user has maximum flexibility in session-to-session work
   selection. The only scheduling constraint that truly matters is "finish agent-env
   before starting SWS."

2. **SWS dominates total effort by ~20x.** At 80-130 sessions, SWS is 20x larger
   than the next biggest plan. All 6 other plans combined (~15-20 sessions) are
   a rounding error on SWS. This means the optimal strategy is to clear all 6
   non-SWS plans quickly (Wave 0 + Wave 1, ~4-5 sessions total) and then focus
   exclusively on SWS for the remaining ~80-130 sessions.

3. **Agent-env is the critical path bottleneck** despite having only ~2-4 sessions
   remaining. Every session of delay on agent-env P4-P5 is a session of delay on
   SWS start. This makes agent-env the highest priority work item in the system.

## Confidence Assessment

- HIGH claims: 14 (dependency verification, critical path, shared file conflicts, wave structure)
- MEDIUM claims: 4 (effort estimates for total duration, optimal ordering within Wave 1, SWS interleaving risk)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**
