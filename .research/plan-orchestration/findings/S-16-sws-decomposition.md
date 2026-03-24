# Findings: SWS Decomposition into Schedulable Chunks

**Searcher:** deep-research-searcher (decomposition specialist)
**Profile:** codebase
**Date:** 2026-03-24
**Sub-Question IDs:** S-16

**Input Sources:** S-07 (SWS inventory), S-09 (dependency graph), S-10
(redundancy/synergy), S-12 (skill/hook impact), S-13 (ROADMAP/CANON),
PLAN.md (1374 lines), DECISIONS.md (732 lines)

---

## 1. Chunk Inventory

SWS's 21 steps decompose into **7 chunks** aligned with the 4 checkpoint
boundaries plus natural breakpoints within the two largest phases.

| Chunk ID | SWS Steps | Description | Effort (sessions) | Dependencies (other chunks) | Can Interleave? |
|----------|-----------|-------------|--------------------|-----------------------------|-----------------|
| **C1** | 1 (sub-steps 1a-1i + audit) | **CANON -- Ecosystem Zero.** Build `.canon/` directory, schemas, tenets, ecosystem registry, enforcement system, changelog, views, tests, self-assessment. Tag canon-v0.1.0. | 6-10 | None (first chunk). External: agent-env P4-5 must be done. | YES -- other plans (cli-tools, custom-statusline) can run in parallel sessions. |
| **C2** | 2, 3, 4 | **Foundation Ecosystems + Pilot.** Skills (L1->L3), Hooks (L3->L4), PR Review pilot (L4->L5). Validates CANON end-to-end. **CHECKPOINT #1** at end. CANON promoted to v0.2.0. | 10-17 | C1 (CANON framework must exist) | YES -- between C2 completion and C3, other work can be inserted safely. |
| **C3** | 5, 6, 7 | **Core Infrastructure.** Docs (L2->L3), Testing (L3->L4), Sessions (L1->L3). **CHECKPOINT #2** at end. CANON promoted to v0.3.0. All tooling-layer ecosystems complete. | 9-15 | C2 (checkpoint #1 must pass) | YES -- checkpoint boundary is a clean pause point. |
| **C4** | 8, 9 | **Data-Heavy Foundation.** TDMS Stage 1 (L2->L3) + Scripts (L2->L3). Two L-effort steps. Heaviest sub-chunk of Phase 3. TDMS learnings feed Scripts. | 12-20 | C3 (checkpoint #2 must pass) | YES -- clean pause point after each L-effort step. |
| **C5** | 10, 11, 12, 13, 14, 15 | **Process-Layer Completion.** CI/CD, Alerts, Analytics, Agents, Audits, Archival/Rotation. Six M-effort ecosystems. **CHECKPOINT #3** at end. CANON promoted to v0.4.0. | 18-30 | C4 (TDMS S1 and Scripts must be done) | YES -- any M-effort step boundary is a valid pause. Internal step boundaries are clean interleave points. |
| **C6** | 16, 17, 18, 19 | **App-Layer + Hub.** TDMS Stage 2 (L3->L4), Roadmap & Execution (L2->L3), Frontend/App (L2->L3), Firebase/Backend (L1->L3). Mixed effort. | 18-33 | C5 (checkpoint #3 must pass) | YES -- each step boundary is a valid pause. TDMS S2 and Roadmap are independent of Frontend/Firebase in terms of file overlap. |
| **C7** | 20, 21 | **Verification + Final Canonization.** Docs verification pass (S), TDMS Stage 3 final canonization (L4->L5). **CHECKPOINT #4** at end. CANON promoted to v1.0.0. Full overhaul audit. | 7-12 | C6 (all 18 ecosystems at target maturity) | NO -- this is the capstone. No interleaving within this chunk. |

**Total: 80-137 sessions across 7 chunks** (matches S-07's 80-130 estimate;
slight upward variance from rounding).

---

## 2. Chunk Dependency Graph

### Sequential Chain (all chunks are strictly sequential)

```
C1 (CANON, 6-10s)
  --> C2 (Foundation + Pilot, 10-17s)
    --> C3 (Core Infra, 9-15s)
      --> C4 (Data-Heavy, 12-20s)
        --> C5 (Process-Layer, 18-30s)
          --> C6 (App-Layer + Hub, 18-33s)
            --> C7 (Verification + Final, 7-12s)
```

**Reason for strict sequencing:** D63 mandates sequential implementation. Each
ecosystem depends on the previous one being complete. Checkpoints are gates that
must pass before proceeding. The 21-step chain is fully linear per D67.

### Internal Parallelism Within Chunks

While chunks are sequential, there is one approved form of parallelism within
each chunk:

- **Research overlap (D63):** Deep-plan ecosystem N+1 while implementing
  ecosystem N. This applies within C2-C6 where multiple steps exist.

### Can Any Chunks Be Parallelized?

**No.** The plan explicitly prohibits parallel implementation tracks (D63). The
reasons are structural:

1. Each ecosystem adds inter-ecosystem contracts validated against all prior
   ecosystems
2. Born-compliant gates activate progressively (after Step 2, new skills must
   comply; after Step 5, new docs must comply; etc.)
3. CANON version bumps happen at checkpoints and propagate
4. Health checkers accumulate -- Step N's regression check runs all prior health
   checkers
5. Changelog entries are cumulative and cross-referenced

**However:** Between chunks (at checkpoint boundaries), other non-SWS work CAN
be inserted. This is the primary interleaving mechanism.

---

## 3. Minimum Viable First Chunk

### C1 (CANON -- Ecosystem Zero) is confirmed as the smallest useful first chunk

**Verification against S-07 findings:**

S-07 identifies Step 1 as having 10 sub-steps (1a through 1i + audit) with
estimated effort of 6-10 sessions. This matches the plan's own estimate.

**Why C1 cannot be split smaller:**

1. Sub-steps 1a-1d are a tight dependency chain (directory structure -> tenets
   -> registry -> maturity model). 1a is foundation for everything.
2. Sub-step 1e (enforcement system) depends on 1a-1d outputs.
3. Sub-step 1h (testing) depends on all prior sub-steps.
4. Sub-step 1i (self-assessment) requires everything else to exist.
5. The audit requires the whole step to be complete.

**Why C1 alone delivers value:**

1. Creates the entire `.canon/` directory with schemas, scripts, and validation
2. Establishes the maturity model and 16-item checklist used by all subsequent
   work
3. Validates the CANON framework by self-assessing (CANON reaches L5 on itself)
4. Produces enforcement hooks that prevent regression
5. Creates the ecosystem registry that tracks all 18 ecosystems
6. Tags canon-v0.1.0 -- a concrete versioned artifact

**What C1 does NOT validate:**

1. Whether CANON works on a DIFFERENT ecosystem (that is C2's PR Review pilot)
2. Whether the cross-ecosystem contract format is usable (first tested in C2)
3. Whether the health checker interface works for non-CANON ecosystems

**Recommendation:** C1 is necessary and sufficient as the minimum viable first
chunk. It cannot be usefully reduced, and it should not be extended (the pilot
validation in C2 is a distinct concern).

### Internal Sub-Chunking of C1 (for session planning)

Within C1's 6-10 sessions, natural session boundaries exist:

| Session(s) | Sub-Steps | Work |
|------------|-----------|------|
| 1 | 1a | Directory structure, canon.json, all schema files (`.canon/schemas/*.schema.ts`) |
| 2 | 1b, 1c, 1g | Tenets JSONL + migration, ecosystem registry JSONL, changelog JSONL (three parallel JSONL artifacts) |
| 3 | 1d | Maturity model + 16-item checklist schema + CANON's own initial assessment |
| 4-5 | 1e | Enforcement system (validation scripts, health checker, enforcement manifest, hook integration) |
| 6 | 1f | Generated views + dashboard (view generators, matrix view) |
| 7-8 | 1h | Testing + documentation (unit tests for all scripts, integration test, README) |
| 9 | 1i + audit | Self-assessment + versioning + code-reviewer audit |

This maps to 7-9 sessions, consistent with the L estimate.

---

## 4. Interleaving Opportunities

D71 explicitly approves interleaving: "Standardization and project work in same
sessions as needed. Soft guideline: if 3+ sessions pass with no
standardization progress, ecosystem health dashboard flags it."

### Between Chunks -- What Other Work Can Be Inserted?

| Between | Can Insert | Why Safe | Duration Available |
|---------|-----------|----------|-------------------|
| **Before C1** | repo-cleanup, passive-surfacing, propagation W1-W4, cli-tools, custom-statusline, agent-env P4-5 | C1 has no SWS state to protect. Pre-SWS cleanup is beneficial (S-10 SY-01, SY-02, SY-03, SY-09). Agent-env P4-5 is a HARD prerequisite. | 5-10 sessions (all pre-work plans) |
| **C1 -> C2** | Any non-SWS work. Propagation remaining waves, cli-tools, custom-statusline, product features. | Checkpoint boundary. CANON exists but no ecosystem depends on it yet (only CANON self-referentially). No born-compliant gates active yet. `.canon/` directory is self-contained. | Unlimited -- D71 flags 3+ session gaps |
| **C2 -> C3** | Any non-SWS work. Product features, bug fixes, remaining plan work. | CHECKPOINT #1 just passed. Skills, Hooks, PR Review all at target. Born-compliant gates active for skills. Do NOT create new skills without meeting L3 standards after C2. | Unlimited -- D71 flags 3+ session gaps |
| **C3 -> C4** | Any non-SWS work, but caution with docs and testing changes. | CHECKPOINT #2 just passed. Born-compliant doc standards active after C3. New docs must comply. New tests must follow patterns. | Unlimited -- D71 flags 3+ session gaps |
| **C4 -> C5** | Any non-SWS work, but caution with scripts and TDMS changes. | TDMS S1 complete, Scripts standards defined. New scripts must follow patterns. New debt items should use Zod schemas. | Unlimited -- D71 flags 3+ session gaps |
| **C5 -> C6** | Any non-SWS work. | CHECKPOINT #3 just passed. 15 ecosystems complete. All process-layer patterns established. This is the most mature interleave point. | Unlimited -- D71 flags 3+ session gaps |
| **C6 -> C7** | Minimal -- only lightweight non-SWS work. | All 18 ecosystems standardized. C7 is verification and final canonization. Inserting work here risks introducing inconsistencies that C7 must then catch. | 1-2 sessions max recommended |

### Within Chunks -- Step-Level Interleaving

Within C4, C5, and C6, individual step boundaries are valid pause points:

| Within Chunk | Safe Interleave Points | Constraint |
|-------------|----------------------|------------|
| **C4** (Steps 8-9) | Between Step 8 (TDMS S1) and Step 9 (Scripts) | Script changes should not break TDMS S1's health checker |
| **C5** (Steps 10-15) | Between any adjacent steps | Each M-effort step is 3-5 sessions. Good granularity for inserting 1-2 sessions of other work. |
| **C6** (Steps 16-19) | Between Step 16-17 and Step 18-19 | TDMS S2/Roadmap are process-layer; Frontend/Firebase are app-layer. Natural break between these pairs. |

### Born-Compliant Gate Implications for Interleaving

After certain chunks complete, born-compliant gates activate. Work inserted
between chunks must comply:

| After Chunk | Born-Compliant Gate | Impact on Inserted Work |
|-------------|---------------------|------------------------|
| C2 | New skills must meet L3 standards | If inserting work that creates new skills (new audit skills, new workflow skills), they must pass skill-audit at L3 |
| C3 | New docs must meet L3 standards | If inserting work that creates new documentation, it must follow folder structure and header standards |
| C3 | New tests must meet L4 standards | If inserting test code, it must follow Testing ecosystem patterns |
| C4 | New scripts must meet L3 standards | If inserting new scripts, they must follow Scripts ecosystem naming, error handling, CLI interface standards |
| C5 | Most born-compliant gates active | Inserted work should be audited against relevant ecosystem standards |

---

## 5. Checkpoint Strategy

### C1 Exit (Step 1 Complete)

**What should be true:**
- `.canon/` directory exists with all files from D21
- All `.canon/schemas/*.schema.ts` compile with zero errors
- `validate-canon.js` passes on current `.canon/` state
- `check-canon-health.js` produces JSON envelope + JSONL findings (D25)
- CANON self-assessment at L5 on all applicable items
- All unit tests pass
- `canon-v0.1.0` git tag exists
- `.canon/ecosystems.jsonl` has 18 entries

**Rollback if chunk fails:**
- `git revert` commits back to `pre-canon-snapshot` tag
- Root cause analysis: which schema design or enforcement pattern failed?
- Re-attempt with amended design
- Log rollback in future changelog

**How to verify:**
- Run `node .canon/scripts/validate-canon.js`
- Run `node .canon/scripts/check-canon-health.js`
- Run `npm test` (full test suite)
- Verify git tag: `git tag -l 'canon-v*'`

### C2 Exit (CHECKPOINT #1)

**What should be true (6 concrete metrics from plan):**
1. All `.canon/schemas/*.schema.ts` compile with zero errors
2. PR Review health checker score >= 90%
3. PR Review enforcement manifest covers all applicable items
4. `.canon/changelog.jsonl` has entries for all cross-ecosystem impacts from
   Steps 1-4
5. CANON self-assessment matches verifiable evidence
6. Full test suite + Step 1 health checkers passing

**CANON version:** 0.1.0 -> 0.2.0

**Rollback if chunk fails:**
- If checkpoint #1 fails, D68 skip-and-return does NOT apply -- CANON must
  work. Iterate on Step 1 (C1) until checkpoint passes.
- Rollback to `pre-skills-snapshot` or `pre-hooks-snapshot` as appropriate
- This is the HIGHEST RISK checkpoint -- wrong CANON design cascades everywhere

**How to verify:**
- Run all 4 ecosystem health checkers (canon, skills, hooks, pr-review)
- Compile all schemas
- Audit `.canon/changelog.jsonl` completeness against git log
- User review of PR Review scorecard

### C3 Exit (CHECKPOINT #2)

**What should be true (5 concrete metrics from plan):**
1. All 7 ecosystem health checkers pass
2. No regressions (full test suite)
3. Registry has 7 "completed" entries with correct levels
4. All inter-ecosystem contracts have both sides implemented
5. Changelog entries for Steps 1-7 complete

**CANON version:** 0.2.0 -> 0.3.0

**Rollback if chunk fails:**
- Revert to the ecosystem-specific snapshot tag
- D68 skip-and-return IS available from here onward: if an ecosystem stalls,
  mark as "deferred with context" and move to next

**How to verify:**
- Run health checker suite for all 7 ecosystems
- `npm test` (full suite)
- Audit `ecosystems.jsonl` for status/level accuracy
- Contract audit: grep for orphaned contract references

### C4 Exit (Steps 8-9 Complete)

**What should be true:**
- TDMS at L3 with all 37 scripts having Zod schemas and monitoring
- Scripts ecosystem at L3 with infrastructure standards defined
- Health checkers for both ecosystems passing
- 9-writer race condition on MASTER_DEBT resolved (T12)
- No regressions in any of the 9 completed ecosystems

**Rollback:**
- Revert to pre-ecosystem snapshot tags
- TDMS S1 can be reverted without affecting Steps 2-7
- Scripts can be reverted without affecting TDMS S1

**How to verify:**
- Run all 9 ecosystem health checkers
- Validate TDMS JSONL files against new schemas
- Run `npm test`

### C5 Exit (CHECKPOINT #3)

**What should be true (6 concrete metrics from plan):**
1. All 15 ecosystem health checkers passing
2. No regressions
3. Registry has 15 "completed" entries
4. All L4+ ecosystems have active enforcement manifests
5. All migration findings resolved or tracked in MASTER_DEBT
6. All migrated files archived per protocol

**CANON version:** 0.3.0 -> 0.4.0

**Rollback:**
- Per-ecosystem snapshot revert available
- D68 skip-and-return available for any stalled ecosystem

**How to verify:**
- Run all 15 health checkers
- Check enforcement manifests exist for L4+ ecosystems
- Audit MASTER_DEBT for `canon-migration` source items
- Verify `.archive/` directories for migrated files

### C6 Exit (Steps 16-19 Complete)

**What should be true:**
- All 18 ecosystems at their target maturity levels
- TDMS at L4 with enforcement operational
- Roadmap with automated input pipelines
- Frontend/App connection points formalized
- Firebase/Backend cataloged with API contracts
- No regressions across any ecosystem

**Rollback:**
- Per-ecosystem snapshot revert
- App-layer steps (18-19) use adapted checklist -- rollback is lower risk here

**How to verify:**
- Run all 18 health checkers
- Verify `ecosystems.jsonl` shows all 18 at target level or above
- Full test suite

### C7 Exit (CHECKPOINT #4 -- FINAL)

**What should be true (8 concrete metrics from plan):**
1. All 18 ecosystems at or above target maturity level
2. All 18 health checkers passing
3. Changelog covers all 21 steps
4. All inter-ecosystem contracts have both sides implemented
5. All `canon-migration` MASTER_DEBT items resolved or accepted
6. All JSONL files validate against declared schema versions
7. All migrated files properly archived
8. Learnings captured, maintenance patterns documented

**CANON version:** 0.4.0 -> 1.0.0

**Rollback:**
- Full overhaul audit either passes or identifies gaps for iteration
- At this point, rollback is impractical for the whole -- individual ecosystem
  regression fixes are the mechanism

**How to verify:**
- Full overhaul audit: Tier 1 + Tier 2 + Tier 3 + Tier 4 (D83)
- All health checkers
- Full test suite
- Manual review of changelog completeness

---

## 6. Effort Distribution

### Effort By Chunk (Visual)

```
C1  [======    ] 6-10 sessions   (8%)
C2  [==========] 10-17 sessions  (13%)
C3  [=========]  9-15 sessions   (12%)
C4  [============] 12-20 sessions (15%)
C5  [==================] 18-30 sessions (23%)
C6  [==================] 18-33 sessions (25%)
C7  [=======]    7-12 sessions   (9%)
     TOTAL: 80-137 sessions
```

### Heaviest Chunks

1. **C6 (18-33 sessions):** TDMS Stage 2 (XL-partial) + Roadmap (L) + two
   M-effort app-layer steps. Wide range due to TDMS S2 and Roadmap variability.
2. **C5 (18-30 sessions):** Six M-effort ecosystems. Volume-driven. Each
   individually is 3-5 sessions, but there are six of them.
3. **C4 (12-20 sessions):** Two L-effort steps. TDMS S1 has 37 scripts to
   schema-ify; Scripts has 300+ scripts to audit.

### Highest Risk Chunks

| Chunk | Risk Level | Primary Risk | Mitigation |
|-------|-----------|-------------|------------|
| **C1** | **HIGH** | Wrong CANON design cascades to all 20 remaining steps. Self-referential bootstrap (CANON must standardize itself). | Pilot validation in C2 catches design flaws early. |
| **C2** | **HIGH** | Checkpoint #1 is the framework validation gate. If CANON doesn't work on PR Review, the whole approach may need redesign. D68 skip-and-return does NOT apply here. | PR Review is the most mature ecosystem (L4->L5, S effort). Lowest-risk pilot target. |
| **C4** | **MEDIUM-HIGH** | Scope explosion risk. TDMS S1 has 37 scripts; Scripts has 300+ scripts (per plan; S-07 notes possibly 88+, needs reconciliation). Volume-driven risk. | TDMS learnings directly inform Scripts. Sequential ordering is designed to prevent scope explosion via pattern reuse. |
| **C5** | **MEDIUM** | Eight ecosystems is a lot of repetitive work. Fatigue risk. Pattern establishment should make later ecosystems faster. | Each step follows the same pattern (deep-plan -> implement -> audit -> exit). By C5, the pattern should be mechanical. |
| **C6** | **MEDIUM** | App-layer ecosystems (Frontend, Firebase) have adapted checklists (D54). Different nature from process ecosystems. TDMS S2 builds on S1 but adds enforcement complexity. | App-layer deep-plans will adapt the approach. Previous 15 ecosystems provide extensive patterns. |
| **C3** | **LOW-MEDIUM** | Core infrastructure (docs, testing, sessions) is well-understood. Ecosystem dependencies emerge but are manageable. | Checkpoint #2 validates the full tooling layer before proceeding to data-heavy work. |
| **C7** | **LOW** | Verification pass is lightweight (S effort). TDMS S3 is the main work but patterns are established from S1 and S2. | Final overhaul audit is comprehensive but expected to validate rather than discover. |

### External Dependencies

| Chunk | External Dependency | Nature | Risk |
|-------|---------------------|--------|------|
| **C1** | agent-env Phases 4-5 complete | HARD block. Memory note: "All 5 phases must complete before SWS Phase 1." | MEDIUM -- agent-env P4-5 estimated at 2-4 sessions. Currently on critical path. |
| **C1** | repo-cleanup complete | SOFT. Cleaner repo = cleaner CANON foundation. | LOW -- repo-cleanup is 1 session (60-90 min). |
| **C1** | passive-surfacing complete | SOFT. Pre-fixes 33 violations SWS would flag. Saves ~1-2 sessions. | LOW -- passive-surfacing is 1-2 sessions. |
| **C1** | propagation complete | SOFT. Shared-lib, baseline mechanism benefit SWS Steps 2-14. | LOW -- propagation is 3-4 sessions. |
| **C4** | (none external) | All inputs come from C3 | -- |
| **C5** | (none external) | All inputs come from C4. Note: agent-env outputs already consumed at C1 entry. SWS Step 13 (Agents, in C5) benefits from agent-env but agent-env completion is already required before C1. | -- |
| **ALL** | Zod v4.3.6 (stack version table) | Tool dependency. All schemas use Zod. A breaking Zod release during the 80-130 session span could require migration. | LOW -- Zod semver is stable. |
| **ALL** | Node.js (T7 platform agnostic) | Tool dependency. All `.canon/scripts/` are Node.js. | LOW -- Node.js is stable. |

---

## 7. Convergence Loop

### CL-1: Do chunk step ranges cover ALL SWS steps?

```
C1: Step 1 (1a-1i + audit)
C2: Steps 2, 3, 4
C3: Steps 5, 6, 7
C4: Steps 8, 9
C5: Steps 10, 11, 12, 13, 14, 15
C6: Steps 16, 17, 18, 19
C7: Steps 20, 21
```

**Coverage check:** 1 + 3 + 3 + 2 + 6 + 4 + 2 = 21 steps. ALL steps covered.
No gaps. No overlaps. **VERIFIED.**

### CL-2: Does the chunk dependency graph match step dependencies in the plan?

The plan (D67, D63) mandates strictly sequential execution. My chunk graph is
strictly sequential: C1 -> C2 -> C3 -> C4 -> C5 -> C6 -> C7. Within each chunk,
internal step ordering matches the plan's dependency graph exactly:

- C2: Step 2 -> 3 -> 4 (Skills -> Hooks -> PR Review). Correct per plan.
- C3: Step 5 -> 6 -> 7 (Docs -> Testing -> Sessions). Correct per plan.
- C4: Step 8 -> 9 (TDMS S1 -> Scripts). Correct per plan.
- C5: Step 10 -> 11 -> 12 -> 13 -> 14 -> 15. Correct per plan.
- C6: Step 16 -> 17 -> 18 -> 19. Correct per plan.
- C7: Step 20 -> 21. Correct per plan.

Chunk boundaries align with checkpoints:
- C2 ends at Checkpoint #1 (after Step 4). **MATCH.**
- C3 ends at Checkpoint #2 (after Step 7). **MATCH.**
- C5 ends at Checkpoint #3 (after Step 15). **MATCH.**
- C7 ends at Checkpoint #4 (after Step 21). **MATCH.**

C4 does NOT end at a checkpoint -- it is a sub-division of Phase 3 (Steps 8-15)
for scheduling granularity. This is intentional: Phase 3 is 33-55 sessions and
too large for a single chunk. Splitting at the L/L -> M boundary (after the two
heavyweight steps) is the natural break.

**VERIFIED.** No dependency violations.

### CL-3: Are effort estimates grounded in S-07 inventory?

Cross-referencing against S-07 effort table:

| Chunk | My Estimate | S-07 Per-Step Sum | Match? |
|-------|-------------|-------------------|--------|
| C1 | 6-10 | Step 1: 6-10 | YES |
| C2 | 10-17 | Steps 2(6-10) + 3(3-5) + 4(1-2) = 10-17 | YES |
| C3 | 9-15 | Steps 5(3-5) + 6(3-5) + 7(3-5) = 9-15 | YES |
| C4 | 12-20 | Steps 8(6-10) + 9(6-10) = 12-20 | YES |
| C5 | 18-30 | Steps 10(3-5)+11(3-5)+12(3-5)+13(3-5)+14(3-5)+15(3-5) = 18-30 | YES |
| C6 | 18-33 | Steps 16(6-10)+17(6-10)+18(3-5)+19(3-8) = 18-33 | YES |
| C7 | 7-12 | Steps 20(1-2)+21(6-10) = 7-12 | YES |
| **TOTAL** | **80-137** | **S-07: ~80-130** | CLOSE (7 session variance from rounding) |

All estimates are direct sums of per-step S-07 values. **VERIFIED.**

### CL-4: Interleaving -- does inserted work conflict with ongoing SWS state?

Checked each interleave opportunity against born-compliant gates and file
conflicts:

1. **Before C1:** All 6 non-SWS plans can run. `.canon/` does not exist yet. No
   SWS state to protect. **SAFE.**

2. **C1 -> C2:** `.canon/` exists with schemas and enforcement hooks. Inserted
   work should not modify `.canon/` files directly. Non-SWS plans that modify
   `.husky/pre-commit` must account for CANON gates added in Step 1e. Per S-12,
   passive-surfacing and propagation add to different pre-commit sections.
   **SAFE with caveat.**

3. **C2 -> C3:** Born-compliant skill gate active. Per S-12, no remaining plans
   create new skills except agent-env (already complete by this point). Product
   feature work that creates new skills must comply. **SAFE with caveat.**

4. **C3 -> C4:** Born-compliant doc + test gates active. Product feature work
   must use doc standards and test patterns. This is the intended effect.
   **SAFE.**

5. **C4 -> C5:** Born-compliant script standards active. Per S-12, cli-tools
   may create scripts but in a different domain (`tools/`). **SAFE.**

6. **C5 -> C6:** 15 ecosystems complete. Most comprehensive born-compliant
   coverage. Inserted work benefits from all patterns. **SAFE -- this is the
   best interleave point.**

7. **C6 -> C7:** All 18 ecosystems complete but not yet verified/finalized.
   Inserting work here risks introducing inconsistencies right before the
   verification pass catches them. **MARGINALLY SAFE -- keep insertions minimal.**

**VERIFIED.** No unsafe interleaving identified. Caveats noted.

### CL-5: Does minimum viable chunk match S-07?

S-07 identifies Step 1 (CANON) as effort L (6-10 sessions) with "Depends on:
Nothing -- this is the foundation." My C1 matches this exactly. S-13 identifies
CANON as "the highest-value extraction" for SWS decomposition. S-09 identifies
CANON as the terminal node of the critical path (all pre-work feeds into it).

**VERIFIED.** C1 = Step 1 = CANON = minimum viable first chunk.

### Corrections Applied During CL

1. **C4 boundary justification added.** Initial draft had C4 split at Steps 8-9
   without explaining why Phase 3 (Steps 8-15) was split. Added explanation:
   Phase 3 is 33-55 sessions, too large for one chunk. Split at L/L -> M
   boundary.

2. **Born-compliant gate table added.** Initial draft listed interleaving
   opportunities without noting that born-compliant gates constrain what kind of
   work can be inserted. Added Section 4 table on gate implications.

3. **C6 effort range corrected.** Initial calculation used M (3-5) for
   Firebase/Backend but S-07 shows M-L (3-8). Corrected C6 from 18-30 to 18-33.

4. **Total range clarified.** S-07 says ~80-130. My per-chunk sum gives 80-137.
   The 7-session variance comes from rounding at step boundaries. Noted as
   acceptable variance.

---

## Confidence Assessment

- HIGH claims: 7 (chunk boundaries, dependency graph, effort sums, minimum
  viable chunk, checkpoint metrics, step coverage, born-compliant gates)
- MEDIUM claims: 2 (interleaving safety caveats, C4/C5 split optimality)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All findings are grounded in the SWS PLAN.md, DECISIONS.md, and S-07 through
S-13 prior findings. No claims rely on training data alone.
