# Findings: Risk Assessment and Rollback Blast Radius

**Searcher:** deep-research-searcher (risk analyst)
**Profile:** codebase
**Date:** 2026-03-24
**Sub-Question IDs:** S-17

**Inputs:** S-01 through S-13 findings, DIAGNOSIS.md

---

## 1. Per-Plan Risk Assessment

| Plan | Overall Risk | Top Risk Factor | Risk Category | Mitigation |
|------|-------------|-----------------|---------------|------------|
| **repo-cleanup** | LOW | Wrong file path for rotation-policy.json (Step 6) | Technical | Executor reads file before editing. Plan already documented the correct path (`config/rotation-policy.json`). Pre-commit hooks catch broken references. |
| **custom-statusline** | MEDIUM | Go binary cache race conditions (Step 7) and Claude Code stdin JSON schema instability (Step 3) | External Dependency | Cache: file locking + stale-ok fallback. Schema: graceful degradation (show `...` for unparsable fields). Old statusline preserved until Step 12 verification. |
| **cli-tools-implementation** | MEDIUM | Platform-specific binary downloads failing (Steps 9-14) and session-start.js modification risk (Step 18) | Integration | Download: install script with fallback methods + authenticated GitHub requests. Session-start.js: passive-surfacing runs first to stabilize the file. tsgo crash risk handled with explicit escape hatch. |
| **passive-surfacing-remediation** | LOW-MEDIUM | Cooldown splitting logic introduces edge cases (Step 4a) | Technical | Code-reviewer audit in Step 10 catches regressions. Tiered routing (D2) limits blast radius -- only HIGH items gate. New state files are advisory (graceful degradation if missing). |
| **propagation-research** | MEDIUM-HIGH | Wave 2 mass refactoring across 100+ files (Steps 6-8) | Scope | Wave structure provides natural checkpoints. Each wave has an AUDIT CHECKPOINT. Step 8 (186 ecosystem audit files) is the single highest-risk step across all 7 plans. Pre-commit + test suite catches regressions. |
| **agent-environment-analysis** | MEDIUM | Phase 4 scope creep from interactive per-agent decisions | Scope | "Done when" criteria per phase. Pause-and-reassess guidance. Phase 4 produces committed `.md` file changes (easily revertible). Critical path position means delays directly delay SWS. |
| **system-wide-standardization** | HIGH | CANON framework design flaws propagating through all 18 ecosystems | Technical | Checkpoint #1 validates CANON end-to-end before applying it broadly. D68 skip-and-return does NOT apply to CP#1. If CANON design is wrong at CP#1, correcting it costs ~6-10 sessions (Step 1 redo). Progressive enforcement limits blast radius. |

---

## 2. Rollback Blast Radius

| Plan | Rollback Difficulty | Blast Radius | Affects Other Plans? | Rollback Strategy |
|------|-------------------|--------------|---------------------|-------------------|
| **repo-cleanup** | **Easy** | **Isolated** | No (all changes are self-contained: file deletions, doc updates, dep removals) | `git revert <commit>`. Plan uses 2 commits (destructive + constructive). Revert either or both. Deleted files restored by git. npm deps restored by `npm install` from reverted package.json. |
| **custom-statusline** | **Easy** | **Isolated** | No (new `tools/statusline/` directory is entirely isolated; old statusline preserved until Step 12) | Delete `tools/statusline/`. Revert `.claude/settings.json` change to restore old Node.js statusline. If Step 12 (delete old statusline) has executed, restore from git. The Go binary at `~/.claude/statusline/` is outside the repo -- delete manually. |
| **cli-tools-implementation** | **Easy-Medium** | **Local** | Weak (CLAUDE.md S6b, session-start.js, settings.json touched) | Most changes are new file creations (tool-configs/, scripts/). `git revert` for repo changes. External changes (installed binaries, .bashrc, .gitconfig) need manual removal. Session-start.js modification (Step 18) is the only risky revert -- must be coordinated if passive-surfacing has already modified the same file. |
| **passive-surfacing-remediation** | **Medium** | **Local** | Moderate (session-start.js, pre-commit, 4 ecosystem audit skills, session-begin skill all touched; other plans depend on this running first) | `git revert` for the single commit (D17). However, if downstream plans (CLI, AE) have already modified session-start.js or pre-commit ON TOP of PS's changes, reverting PS alone creates a broken intermediate state. **Must revert in reverse dependency order.** New state files (`session-start-failures.json`, `context-warnings.json`) may be referenced by session-begin skill -- reverting PS means removing those references too. |
| **propagation-research** | **Hard** | **Wide** | Moderate (pre-commit/pre-push touched; 100+ files refactored in W2; CI workflow modified; ecosystem audit skills restructured) | Wave 1 (Steps 1-5): Easy revert -- 5 surgical changes. Wave 2 (Steps 6-8): **Hard revert** -- 55+ files for sanitizeError, 34+ files for readJsonl, 186 ecosystem audit files for shared-lib. A single `git revert` works technically but creates a massive diff. Wave 3-4 (Steps 9-14): Medium revert. **Recommended: per-wave commits** so each wave can be independently reverted. |
| **agent-environment-analysis** | **Medium** | **Local** | Strong (CLAUDE.md S7, pre-commit, pre-push, multiple skills, check-agent-compliance.js; SWS hard-blocks on AE completion) | Phase 4 (agent .md changes): Easy revert -- agent files are standalone. Phase 5 (process integration): Medium revert -- touches CLAUDE.md, hooks, skills, scripts. If reverted, SWS cannot start (hard dependency). Per-phase commits recommended. |
| **system-wide-standardization** | **Hard** | **Wide** | Total (creates `.canon/` infrastructure that all future work depends on; modifies pre-commit/pre-push progressively; touches all skills, hooks, scripts, and docs over 80-130 sessions) | Per-step commits make partial revert feasible. Reverting Step 1 (CANON): delete `.canon/`, revert hook changes. Reverting later steps: complex because each step adds enforcement gates that subsequent steps depend on. Checkpoints (4 total) are natural rollback boundaries. **If CP#1 fails, full restart of Steps 1-4 is required.** D68 skip-and-return protocol handles individual ecosystem failures within later phases. |

---

## 3. Shared Resource Risk Matrix

Based on S-08 file overlap data (verified against filesystem).

| Resource | Plans | Failure Mode | Impact | Mitigation |
|----------|-------|-------------|--------|------------|
| `.claude/hooks/session-start.js` (37KB, 1077 lines) | CLI, PS, AE (3 plans) | Merge conflict or broken hook logic from overlapping modifications | **HIGH** -- session-start.js runs on every session. A broken session-start means every new Claude Code session starts with errors. | Strict sequencing: PS first (fixes violations), CLI second (adds tool detection), AE last (adds monitoring). Each plan tests the hook after modification. |
| `.husky/pre-commit` (34KB) | PS, PR, AE, SWS (4 plans) | Merge conflict or broken pre-commit halts all commits | **CRITICAL** -- a broken pre-commit blocks all git commits across the entire project. No code can be committed until fixed. | Section-based ownership: PS (output formatting), PR (EXIT trap section), AE (agent triggers section), SWS (CANON gates section). Test `git commit` after each plan's modification. |
| `.husky/pre-push` (32KB) | PR, AE, SWS (3 plans) | Broken pre-push blocks all pushes | **HIGH** -- blocks push to remote but does not block local commits. Less critical than pre-commit. | Same section-based ownership pattern as pre-commit. |
| `CLAUDE.md` (12KB, ~200 lines) | CLI, AE, SWS (3 plans) | Inconsistent agent instructions from overlapping edits | **MEDIUM** -- CLAUDE.md is the primary AI instruction file. Errors here cause behavioral issues in all future sessions. | Different sections: CLI adds S6b, AE updates S7, SWS references only. Low merge conflict probability. |
| `.claude/settings.json` (5.7KB) | SL, CLI (2 plans) | Broken Claude Code configuration | **HIGH** -- settings.json is the Claude Code runtime config. Errors break the agent environment entirely. | Different JSON keys: SL modifies `statusLine.command`, CLI adds hook entries. JSON structure makes conflicts unlikely. |
| `package.json` (12KB) | RC, CLI (2 plans) | npm dependency resolution failure | **LOW** -- package.json is well-structured and npm handles merge gracefully. | RC removes deps, CLI adds deps. Standard npm operations. |
| 4 ecosystem audit skills | PS, PR (2 plans) | Skill file corruption or lost content from concurrent edits | **MEDIUM** -- audit skills are used for ongoing compliance monitoring. Broken skills mean missed audit categories. | PS first (adds category text), PR second (structural refactoring preserves PS's additions). |
| `scripts/check-agent-compliance.js` (5.9KB) | PS, AE (2 plans) | Broken compliance check output or enforcement | **MEDIUM** -- compliance check runs as part of POST-TASK workflow. Broken check means agent compliance is not enforced. | PS first (fix surfacing format), AE second (change enforcement mode). Complementary changes. |
| `.claude/skills/session-begin/SKILL.md` (8.9KB) | PS, SWS (2 plans) | Session-begin gate becomes broken or incomplete | **MEDIUM** -- session-begin gates on warnings. Broken gate means warnings are either suppressed or excessively noisy. | PS first (adds flag sources to gate), SWS later (formalizes the lifecycle). |
| `scripts/` directory (80+ files) | RC, PS, PR, AE, SWS (5 plans) | Mass refactoring collision between PR (100+ files) and SWS (all scripts) | **HIGH** -- PR Wave 2 and SWS Steps 8-9 both perform broad modifications. Collision would cause massive merge conflicts. | PR completes Wave 2 before SWS reaches Step 8. Given SWS timeline (~80-130 sessions), PR will naturally finish first. |

---

## 4. Failure Scenarios

Top 5 most likely failure scenarios, ranked by likelihood x impact.

| # | Scenario | Likelihood | Impact | Plans Affected | Recovery Strategy |
|---|----------|-----------|--------|----------------|-------------------|
| 1 | **Pre-commit hook breaks mid-modification** -- one of the 4 plans modifying `.husky/pre-commit` introduces a syntax error or logic bug that blocks all commits | MEDIUM-HIGH | CRITICAL | PS, PR, AE, SWS + all future work | **Immediate:** `git stash` current work, `git checkout .husky/pre-commit` to restore working version. **Root cause:** run the hook manually (`bash .husky/pre-commit`) to identify the error. Fix and recommit. **Prevention:** test commit after each plan's pre-commit modification. |
| 2 | **Propagation Wave 2 mass refactoring breaks tests** -- Steps 6-7 modify 55+ and 34+ files respectively. An incorrect import replacement or CJS/ESM mismatch causes test failures across multiple scripts | MEDIUM | HIGH | PR primarily; SWS downstream (builds on PR's refactored code) | **Immediate:** `git revert` the Wave 2 commit(s). **Root cause:** identify which import replacements failed (CJS vs ESM context). Fix the specific files and re-run. **Prevention:** per-file verification that imports resolve correctly before committing. AUDIT CHECKPOINT after Wave 2. |
| 3 | **SWS CANON design flaw discovered at Checkpoint #2+** -- CANON's schema architecture or maturity model has a structural problem that only surfaces after multiple ecosystems have been standardized | LOW-MEDIUM | VERY HIGH | SWS (potentially 16-27 sessions of work affected); all plans that created artifacts SWS governs | **Immediate:** Stop at checkpoint. Assess scope of design flaw. **Recovery:** D68 skip-and-return handles individual ecosystem issues. For structural CANON flaws, rollback to post-CP#1 state (revert Steps 5-7+) and redesign the affected CANON component. **Prevention:** CP#1 specifically exists to validate CANON before broad application. PR Review (Step 4) is a deliberate pilot. |
| 4 | **Session-start.js modification collision** -- PS and CLI both modify this 1077-line file, and the second plan's changes conflict with or break the first plan's changes | MEDIUM | HIGH | PS, CLI, AE (all three touch this file); every future Claude Code session | **Immediate:** identify the conflict. If merge conflict: resolve manually. If logic bug: revert the second plan's changes and re-apply after reading the current file state. **Prevention:** strict sequencing (PS first, CLI second). Each plan tests session-start behavior after modification. |
| 5 | **Agent-env Phase 4 scope explosion** -- interactive per-agent decisions reveal that most of the 36 agents need substantial rewrites, expanding Phase 4 from 1-2 sessions to 4-6+ sessions, delaying SWS start | MEDIUM | MEDIUM | AE directly; SWS indirectly (every session of AE delay = 1 session of SWS delay) | **Immediate:** apply the "done when" criteria -- improve priority agents only, backlog the rest. **Recovery:** partial completion is acceptable. Improved priority agents (code-reviewer, security-auditor, GSD agents) provide 80% of the value. Remaining agents can be improved during SWS Step 13 instead. **Prevention:** time-box Phase 4 to 2 sessions. Define "minimum viable improvement set" before starting. |

---

## 5. Risk-Adjusted Execution Order

Reordered from S-09's dependency graph to minimize risk exposure:

### Tier 0: Foundation (1 session)

**repo-cleanup** -- Execute first.

- **Risk justification:** Lowest risk of all plans (all changes verified, 2 missing files already handled). Easy rollback (2 git commits). Creates clean foundation for everything else.
- **Failure impact:** Isolated. No other plan is affected if this fails.
- **Confidence builder:** Quick completion builds momentum and validates the orchestration process.

### Tier 1: Independent Plans with Low Shared-Resource Risk (3-4 sessions, parallel)

Execute these in parallel. Order within tier is by priority, not dependency:

1. **agent-env Phases 4-5** (HIGHEST PRIORITY -- critical path)
   - Risk: MEDIUM (scope creep from interactive decisions)
   - Mitigation: Time-box Phase 4 to 2 sessions
   - Why first in tier: every session of delay here delays SWS

2. **passive-surfacing-remediation** (HIGH PRIORITY -- stabilizes shared resources)
   - Risk: LOW-MEDIUM (mostly mechanical pattern application)
   - Mitigation: code-reviewer audit catches regressions
   - Why early: stabilizes session-start.js and pre-commit BEFORE other plans modify them

3. **custom-statusline** (can interleave)
   - Risk: MEDIUM (Go development, but fully isolated files)
   - Mitigation: old statusline preserved as fallback until verified
   - Why parallel: ZERO shared files with any other Tier 1 plan

4. **propagation Wave 1** (Steps 1-5 only -- surgical fixes)
   - Risk: LOW (5 targeted fixes to known issues)
   - Mitigation: each fix is independent and independently revertible
   - Why split from W2-W4: Wave 1 is low-risk; Wave 2+ is high-risk

### Tier 2: Higher-Risk Shared-Resource Plans (1-2 sessions)

Execute after Tier 1's shared-resource stabilizers (PS) complete:

5. **cli-tools-implementation** (after PS completes session-start.js fixes)
   - Risk: MEDIUM (platform-specific, touches session-start.js)
   - Mitigation: PS has stabilized session-start.js; CLI adds a discrete new block
   - Why after PS: PS fixes 7 violations in session-start.js; CLI should not build on broken code

6. **propagation Waves 2-4** (after PS completes ecosystem audit skill changes)
   - Risk: MEDIUM-HIGH (100+ file mass refactoring)
   - Mitigation: per-wave commits enable independent rollback; AUDIT CHECKPOINTs after each wave
   - Why after PS: PS adds categories to 4 ecosystem audit skills that PR's shared-lib extraction (Step 8) must preserve

### Tier 3: Terminal Plan (80-130 sessions)

7. **system-wide-standardization** (after AE Phase 5 completes)
   - Risk: HIGH (if CANON design is flawed, all downstream work is affected)
   - Mitigation: CP#1 validates CANON before broad application. 4 checkpoint gates. D68 skip-and-return for individual ecosystems. Per-ecosystem deep-plan provides research before each step.
   - Why last: memory note mandates "all AE phases before SWS Phase 1"; all other plans provide cleaner foundation

### Does this order conflict with S-09's dependency graph?

**No.** S-09 identifies one hard dependency (AE --> SWS) and five soft dependencies (all pointing toward SWS). This order respects:

- Hard: AE completes before SWS starts (Tier 1 before Tier 3)
- Soft: RC before all (Tier 0); PS before CLI and AE P5 (Tier 1 before Tier 2); PR W1-W2 before SWS Steps 8-9 (Tier 1-2 before Tier 3)
- File conflicts from S-08: PS before CLI (session-start.js); PS before PR (ecosystem audit skills); PR before SWS (scripts/ mass refactoring)

The only adjustment from S-09: I split propagation into W1 (Tier 1, low risk) and W2-4 (Tier 2, higher risk) rather than treating it as a monolithic block. This reduces risk exposure in Tier 1.

---

## 6. Parallel Execution Risk

For each proposed parallel pair from S-09, assessed for merge conflict probability.

| Pair | Parallel Risk | Shared Files | Merge Conflict Probability | Recommendation |
|------|--------------|-------------|---------------------------|----------------|
| RC + SL | **NONE** | 0 shared files | 0% | Safe to parallelize. |
| RC + PS | **NONE** | 0 shared files | 0% | Safe to parallelize. |
| RC + PR | **NONE** | 0 shared files | 0% | Safe to parallelize. |
| RC + CLI | **VERY LOW** | `package.json` (RC removes deps, CLI adds dep) | <5% -- different devDependencies, clean merge | Safe to parallelize. |
| SL + PS | **NONE** | 0 shared files | 0% | Safe to parallelize. |
| SL + PR | **NONE** | 0 shared files | 0% | Safe to parallelize. |
| SL + CLI | **LOW** | `.claude/settings.json` (different JSON keys: `statusLine.command` vs hook entries) | <10% -- different JSON properties | Safe to parallelize. JSON merges cleanly. |
| SL + AE | **NONE** | 0 shared files (AE P5.4 statusline data is a separate file, not the Go binary itself) | 0% | Safe to parallelize. |
| PS + PR | **LOW-MEDIUM** | 4 ecosystem audit skills, `.husky/pre-commit` | ~25% -- PS adds categories (additive text); PR extracts shared-lib (structural). Pre-commit: PS adds Fix command, PR adds EXIT trap (different sections). | Parallelize with caution. PS should commit first. PR should pull PS's changes before starting ecosystem audit skill work. |
| PS + CLI | **HIGH** | `.claude/hooks/session-start.js` (both modify this 1077-line file substantively) | ~60% -- both make significant changes to the same file. PS modifies existing code; CLI adds new blocks. | **DO NOT parallelize.** PS must complete session-start.js changes first. CLI modifies after PS commits. |
| PS + AE | **MEDIUM** | `session-start.js` (PS Step 1, AE P5.4), `check-agent-compliance.js`, `alerts` skill | ~30% -- PS and AE Phase 4 are safe in parallel (different files). PS and AE Phase 5 overlap on session-start.js and compliance script. | Parallelize PS with AE Phase 4 only. AE Phase 5 must follow PS completion. |
| CLI + AE | **MEDIUM** | `CLAUDE.md` (different sections: S6b vs S7), `session-start.js` (both add new blocks) | ~30% -- CLAUDE.md sections are distinct (low risk). Session-start.js is the concern. | Parallelize if CLI completes session-start.js changes before AE Phase 5. Otherwise, sequential. |
| PR + AE | **LOW** | `.husky/pre-commit`, `.husky/pre-push` (PR adds EXIT trap, AE adds agent triggers -- different sections) | ~15% -- both add to different sections of pre-commit/pre-push | Safe to parallelize. Different sections, additive changes. |
| PR + SWS | **HIGH** (for SWS Steps 8-9+) | `scripts/` directory mass overlap (PR touches 100+ files; SWS Steps 8-9 touch 30+ debt scripts + 88+ scripts) | ~70% for overlapping steps | **DO NOT parallelize PR W2+ with SWS Steps 8-9.** PR must complete before SWS reaches these steps. Given SWS's timeline, this is naturally satisfied. |
| AE + SWS | **BLOCKED** | Hard dependency: AE all 5 phases must complete before SWS Phase 1 | N/A | **Cannot parallelize.** AE must complete first. |

---

## 7. Stop-Loss Criteria

For each plan, the point at which to stop and reassess rather than push through.

| Plan | Stop-Loss Trigger | What To Do |
|------|-------------------|-----------|
| **repo-cleanup** | Pre-commit hook fails after Step 4 (destructive commit) and verification (Step 5) reveals broken crossdoc references from file deletions | **Stop.** Revert Step 4 commit. Identify which deleted file is still referenced. Either fix the reference first or exclude the file from deletion. Do not proceed to constructive phase with a broken destructive commit. |
| **custom-statusline** | Go binary compiles but Claude Code stdin JSON schema does not match expected format (Step 3 failure) | **Stop.** The stdin schema is reverse-engineered, not guaranteed. Options: (a) inspect actual Claude Code stdin output to update the schema, (b) add a pass-through mode that echoes stdin for debugging, (c) fall back to Node.js statusline while investigating. Do not proceed to widget development (Steps 4-8) with an incorrect schema. |
| **cli-tools-implementation** | More than 3 binary downloads fail (Step 9) due to network restrictions or GitHub rate limiting | **Stop.** The install script is designed for both locales. If the current locale has network restrictions, switch to home locale for downloads (Step 25), or use alternative install methods (winget/scoop). Do not manually download 15+ binaries one by one. |
| **passive-surfacing-remediation** | Code-reviewer audit (Step 10) reveals that violation fixes have changed hook behavior (not just message formatting) | **Stop.** PS is supposed to change message formatting and add state flags, NOT change hook logic. If behavior changed, revert the offending step and re-examine the violation. The cooldown splitting in Step 4a is the most likely source -- test HIGH and MEDIUM alerts explicitly before proceeding. |
| **propagation-research** | Wave 2 (Steps 6-7) breaks more than 5 tests after refactoring | **Stop Wave 2.** Commit Wave 1 (Steps 1-5) as a standalone deliverable. Investigate why imports broke. The most likely cause is CJS/ESM mismatch in scripts that use `require()`. The `.cjs` wrapper (Step 4) should handle this, but if it does not, the refactoring approach needs redesign. Do not attempt Step 8 (186 files) if Steps 6-7 (89 files) are failing. |
| **propagation-research** | Step 8 (ecosystem audit shared-lib extraction) breaks any ecosystem audit skill | **Stop Step 8.** This step touches 186 files across 10 skill directories. If the shared-lib pattern does not work for even one skill, revert and redesign the extraction approach. Proceeding with a partially-working shared-lib is worse than no shared-lib. |
| **agent-environment-analysis** | Phase 4 exceeds 3 sessions without reaching "priority agents improved" milestone | **Stop and reassess scope.** The plan defines "done when" criteria. If priority agents (code-reviewer, security-auditor, GSD agents) are improved, Phase 4 can be declared "done enough" even if lower-priority agents remain unimproved. Document the remaining agents as Phase 4 backlog. Proceed to Phase 5. |
| **agent-environment-analysis** | Phase 5 hook integration (Step 5.3) breaks pre-commit or pre-push | **Stop Step 5.3.** Pre-commit/pre-push are critical infrastructure. If agent-based triggers cause hook failures, revert the hook changes. The agent triggers can be re-introduced later with better testing. Do not delay SWS start for a hook integration issue. |
| **system-wide-standardization** | Checkpoint #1 fails: PR Review (Step 4) health checker score < 90% after two attempts | **Stop all SWS work.** CP#1 exists specifically to validate CANON. If CANON's enforcement system, maturity model, or health checker architecture cannot produce a passing score for the pilot ecosystem (PR Review), the CANON design is flawed. Return to Step 1 and redesign. Do not proceed to Steps 5+. The plan explicitly states D68 skip-and-return does NOT apply to CP#1. |
| **system-wide-standardization** | Any single ecosystem step exceeds 2x its estimated sessions without checkpoint passage | **Pause and reassess.** Either the ecosystem is more complex than estimated (rescope), or the CANON framework needs adjustment for this ecosystem type. D68 allows skip-and-return: skip the problematic ecosystem, continue to the next, and return later. |

---

## Convergence Loop

### CL-1: Are rollback strategies actually feasible?

| Plan | Can you `git revert` cleanly? | Assessment |
|------|-------------------------------|-----------|
| repo-cleanup | YES -- 2 commits (destructive + constructive). Each independently revertible. File deletions restored by git. | **Feasible.** Verified: `git revert` restores deleted files. npm deps restored by `npm install` from reverted package.json. |
| custom-statusline | YES -- new directory (`tools/statusline/`) plus `.claude/settings.json` change. Revert settings.json restores old statusline. | **Feasible.** One caveat: compiled binary at `~/.claude/statusline/` is outside repo. Manual cleanup needed. Low risk. |
| cli-tools-implementation | MOSTLY -- repo changes revertible. External changes (installed binaries, .bashrc, .gitconfig) NOT tracked by git. | **Partially feasible.** Repo changes: clean revert. External changes: require manual removal of 14+ binaries from `~/bin/`, reverting .bashrc/.gitconfig changes. The install script should have a corresponding uninstall capability -- currently does not exist (Gap). |
| passive-surfacing-remediation | YES -- single commit (D17). All changes are to existing files (message formatting, state flag writes). | **Feasible, with caveat.** If CLI or AE have already committed changes ON TOP of PS's session-start.js modifications, reverting PS creates a conflict. Must check dependency chain before reverting. |
| propagation-research | PARTIALLY -- per-wave commits enable wave-level revert. Wave 2 (55+34+186 files) is a massive revert but technically possible. | **Feasible if per-wave commits are maintained.** Without per-wave commits, reverting W2 from a monolithic commit touching 275 files is technically possible but creates a very large diff that is hard to review. **Recommendation: enforce per-wave commits.** |
| agent-environment-analysis | YES -- per-phase commits. Agent .md file changes are standalone. Phase 5 integration changes are additive. | **Feasible.** Agent files are isolated. Phase 5 touches shared resources but changes are additive (new sections, new hook entries). Revert is clean. |
| system-wide-standardization | PARTIALLY -- per-step commits. Step 1 (CANON) is a clean revert (delete `.canon/`). Later steps add enforcement gates to pre-commit/pre-push that become cumulative dependencies. | **Feasible at checkpoint boundaries.** Reverting to pre-CP#1 state: clean. Reverting within a phase (e.g., reverting Step 7 after Steps 5-6 completed): possible but requires verifying health checkers for Steps 5-6 still pass without Step 7's contributions. **Checkpoints are the practical rollback boundaries.** |

**Corrections from CL-1:**
- Added "cli-tools has no uninstall script" to Gaps
- Emphasized per-wave commits for propagation as a recommendation, not just an option
- Clarified SWS rollback boundaries are checkpoints, not individual steps

### CL-2: Do shared resource risks match S-08 data?

Cross-checked every shared resource in Section 3 against S-08 file overlap data:

| Resource | My claim | S-08 says | Match? |
|----------|----------|-----------|--------|
| session-start.js | 3 plans (CLI, PS, AE) | 3 plans: CLI (Step 18), PS (Step 1), AE (Step 5.4) | YES |
| .husky/pre-commit | 4 plans (PS, PR, AE, SWS) | 4 plans: PS (Step 6), PR (Step 11), AE (Step 5.3), SWS (Steps 1e/3/progressive) | YES |
| .husky/pre-push | 3 plans (PR, AE, SWS) | 3 plans: PR (Step 11), AE (Step 5.3?), SWS (Steps 1e/3/progressive) | YES -- S-08 Section 1.1 confirms PR, AE, SWS |
| CLAUDE.md | 3 plans (CLI, AE, SWS) | 3 plans per S-08 Section 1.1 | YES |
| settings.json | 2 plans (SL, CLI) | 2 plans per S-08 Section 1.1 | YES |
| package.json | 2 plans (RC, CLI) | 2 plans per S-08 Section 1.1 | YES |
| 4 ecosystem audit skills | 2 plans (PS, PR) | Confirmed in S-08 Section 1.2 | YES |
| check-agent-compliance.js | 2 plans (PS, AE) | Confirmed in S-08 Section 1.2 | YES |
| session-begin SKILL.md | 2 plans (PS, SWS) | Confirmed in S-08 Section 1.2 | YES |
| scripts/ directory | 5 plans (RC, PS, PR, AE, SWS) | Confirmed in S-08 Section 2 | YES |

**All 10 shared resources verified against S-08. No discrepancies.**

### CL-3: Are failure scenarios grounded in plan content?

| Scenario | Grounded in plan content? | Evidence |
|----------|--------------------------|---------|
| #1 (pre-commit breaks) | YES | S-08 CONFLICT-H2 identifies 4-plan modification. S-12 Section 2 confirms all 4 plans' changes. Pre-commit is 34KB of shell scripting -- syntax errors are plausible. |
| #2 (PR W2 breaks tests) | YES | S-05 Step 6 risk rated MEDIUM ("55 files potentially touched; must verify each import works CJS vs ESM"). S-05 Step 7 risk rated MEDIUM ("34 files; multiple inline variants may have subtle differences"). No DECISIONS.md exists for propagation to clarify test strategy. |
| #3 (CANON design flaw) | YES | S-07 Phase 1 risk rated HIGH ("if CANON design is wrong, everything downstream is wrong"). CP#1 metrics are defined (6 concrete criteria). D68 explicitly says skip-and-return does NOT apply to CP#1. |
| #4 (session-start.js collision) | YES | S-08 CONFLICT-H1 identifies this as the highest-risk file conflict. S-03 Step 18 MEDIUM risk ("Modifying a 1077-line session-start hook -- must not break existing functionality"). S-04 Step 1 rates session-start.js work as M effort with LOW risk. |
| #5 (AE Phase 4 scope explosion) | YES | S-06 Finding #5 rates Phase 4 as "highest-risk remaining phase" with MEDIUM confidence. Plan's own risk mitigation includes "Done when" criteria and pause-and-reassess. Memory note `feedback_agent_teams_learnings.md` documents previous token cost overruns with Agent Teams. |

**All 5 scenarios grounded in specific plan content and findings. No speculation.**

### CL-4: Does risk-adjusted order conflict with S-09 dependency graph?

S-09 identifies these hard/soft constraints:
- HARD: AE (all 5 phases) --> SWS
- SOFT: RC ..> all; PS ..> SWS; PR ..> SWS; CLI ..> SWS; AE ..> SL (weak)

My risk-adjusted order:
- Tier 0: RC (satisfies RC ..> all)
- Tier 1: AE P4-5, PS, SL, PR W1 (all parallel; satisfies PS ..> SWS, PR ..> SWS)
- Tier 2: CLI (after PS for session-start.js), PR W2-4 (after PS for ecosystem audit skills)
- Tier 3: SWS (after AE; satisfies AE --> SWS hard dependency)

**No conflicts with S-09.** The only difference is splitting PR into W1 (Tier 1) and W2-4 (Tier 2), which S-09 does not explicitly suggest but is compatible with its wave structure analysis.

### CL-5: Cross-check parallel risks against S-08 file overlap data

| Pair from Section 6 | S-08 Parallel Safety | Match? |
|---------------------|---------------------|--------|
| RC + SL = NONE risk | S-08: "YES" (no shared files) | YES |
| SL + PS = NONE risk | S-08: "YES" (no shared files) | YES |
| PS + CLI = HIGH risk | S-08: "NO" (session-start.js HIGH conflict) | YES |
| PS + PR = LOW-MEDIUM risk | S-08: "MOSTLY" (4 ecosystem audit skills MEDIUM, pre-commit MEDIUM) | YES -- my "25%" aligns with "MOSTLY safe" |
| PS + AE = MEDIUM risk | S-08: "NO" (session-start.js via AE 5.4) | PARTIAL -- S-08 says NO because of AE Phase 5. I said parallelize PS with AE Phase 4 only, which S-08's detailed analysis supports (AE Phase 4 touches agent files, not session-start.js). **Corrected to clarify: PS safe with AE Phase 4, not Phase 5.** |
| PR + SWS = HIGH risk | S-08: "NO (for Steps 8-9+)" (mass scripts/ collision) | YES |
| AE + SWS = BLOCKED | S-08: "NO" (hard dependency) | YES |

**Corrections from CL-5:**
- Clarified PS + AE parallel risk: safe for AE Phase 4 only, not Phase 5

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
| 8 | `.research/plan-orchestration/findings/S-08-file-overlaps.md` | Findings | HIGH | 2026-03-24 |
| 9 | `.research/plan-orchestration/findings/S-09-dependency-graph.md` | Findings | HIGH | 2026-03-24 |
| 10 | `.research/plan-orchestration/findings/S-10-redundancy-synergy.md` | Findings | HIGH | 2026-03-24 |
| 11 | `.research/plan-orchestration/findings/S-11-master-debt.md` | Findings | HIGH | 2026-03-24 |
| 12 | `.research/plan-orchestration/findings/S-12-skill-hook-impact.md` | Findings | HIGH | 2026-03-24 |
| 13 | `.research/plan-orchestration/findings/S-13-roadmap-canon.md` | Findings | HIGH | 2026-03-24 |
| 14 | `.planning/plan-orchestration/DIAGNOSIS.md` | Diagnosis | HIGH | 2026-03-23 |

## Contradictions

None between this analysis and the source findings. All risk assessments, shared resource claims, and failure scenarios are grounded in specific findings from S-01 through S-13.

One minor tension: S-09 treats propagation as a monolithic plan in wave analysis, while this analysis splits it into W1 (low risk) and W2-4 (higher risk) for scheduling purposes. This is not a contradiction -- S-09's wave structure acknowledges the same risk gradient ("W2 is the highest-risk wave") but does not split it for scheduling.

## Gaps

1. **CLI tools has no uninstall script.** If cli-tools needs to be rolled back, external changes (14+ installed binaries, .bashrc/.gitconfig modifications) must be manually reversed. The plan should include an uninstall capability for clean rollback.

2. **SWS inter-checkpoint rollback cost not estimated.** The analysis identifies checkpoints as rollback boundaries but does not estimate the session cost of rolling back within a phase (e.g., reverting Steps 5-6 after starting Step 7). This cost depends on how many enforcement gates and health checkers have been activated.

3. **Pre-commit section ownership protocol not formalized.** The analysis recommends section-based ownership of pre-commit but no formal protocol exists. Each of the 4 plans modifying pre-commit should declare which lines/sections it owns to prevent accidental overlap.

4. **Propagation per-wave commit strategy is a recommendation, not a plan requirement.** The propagation plan does not explicitly require per-wave commits. Without them, rollback of Wave 2 becomes a 275-file revert. This should be formalized before execution.

## Serendipity

1. **repo-cleanup is a zero-risk confidence builder.** Its LOW risk, EASY rollback, and ISOLATED blast radius make it the ideal first execution to validate the orchestration process. If even repo-cleanup fails, it signals that the plans need more work before the higher-risk plans are attempted.

2. **The pre-commit file is the single most dangerous shared resource in the system.** Four plans modify it, and a broken pre-commit blocks ALL git commits. This file deserves a formal merge protocol, integration tests, and possibly a pre-commit health check that runs after any modification.

3. **SWS's checkpoint system is excellent risk management.** The 4 checkpoints (with specific metrics) provide natural stop-loss boundaries. CP#1's exemption from D68 (skip-and-return) is a deliberately conservative design -- it forces CANON validation before broad application.

4. **Splitting propagation into W1 (Tier 1) and W2-4 (Tier 2) is the single most impactful risk reduction in the execution order.** W1 (5 surgical fixes) has near-zero risk. W2-4 (mass refactoring) has the highest risk of any non-SWS work. Separating them lets W1's value be captured immediately while W2-4 waits for shared-resource stabilization.

---

## Confidence Assessment

- HIGH claims: 18 (per-plan risk ratings, rollback feasibility, shared resource verification, failure scenario grounding, dependency graph compatibility)
- MEDIUM claims: 6 (merge conflict probability percentages, stop-loss trigger timing, SWS inter-checkpoint rollback cost)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**
