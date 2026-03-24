# Findings: Repo Cleanup Plan Inventory

**Searcher:** deep-research-searcher
**Profile:** codebase
**Date:** 2026-03-24
**Sub-Question IDs:** S-01
**Plan Path:** `.planning/repo-cleanup/PLAN.md` (327 lines)
**Decisions Path:** `.planning/repo-cleanup/DECISIONS.md` (37 lines, 15 decisions)

---

## 1. Step Inventory Table

| Step ID | Description | Files Touched | Effort | Dependencies (within plan) | Can Parallelize? |
|---------|-------------|---------------|--------|---------------------------|------------------|
| Step 1 | Create branch (`cleanup/repo-hygiene` from main) | None (git operation) | S (2 min) | None | No (prerequisite for all) |
| Step 2 | Delete orphaned files (6 confirmed + 1 conditional) | DELETE: `scripts/test-semgrep-rules.js`, `.claude/hooks/state-utils.js`, `tests/hooks/gsd-context-monitor.test.ts`, `tests/hooks/stop-serena-dashboard.test.ts`, `docs/technical-debt/raw/reviews.jsonl`, `docs/technical-debt/MASTER_DEBT.jsonl.bak`, `.mcp.json.bak` (if exists) | S (5 min) | Step 1 | No (sequential with Step 3) |
| Step 3 | Archive completed artifacts (delete 2 ephemeral + move 2 archived) | DELETE: `.claude/state/deep-plan-review-lifecycle.state.json`, `.claude/override-log-1772919008171.jsonl`; MOVE: `data/ecosystem-v2/retros.jsonl.archived-20260318` and `data/ecosystem-v2/reviews.jsonl.archived-20260318` to `data/ecosystem-v2/archive/`; CREATE: `data/ecosystem-v2/archive/` directory | S (3 min) | Step 2 | No (sequential with Step 2) |
| Step 4 | Commit 1 -- destructive actions | None (git commit) | S (2 min) | Steps 2, 3 | No |
| Step 5 | Verify Commit 1 (`crossdoc:check`, `patterns:check`, `test:build`, `test`) | None (verification only) | S (5 min) | Step 4 | No |
| Step 6 | Fix rotation policies (add 3 files to rotation tiers) | MODIFY: `config/rotation-policy.json` (NOTE: plan says `scripts/config/rotation-policy.json` -- path is WRONG, actual file is at `config/rotation-policy.json`) | S (5 min) | Step 5 | YES (parallel with 7, 8, 9, 10) |
| Step 7 | Update indexes (SKILL_INDEX.md count + COMMAND_REFERENCE.md add 4 skills) | MODIFY: `.claude/skills/SKILL_INDEX.md`, `.claude/COMMAND_REFERENCE.md` | S-M (10 min) | Step 5 | YES (parallel with 6, 8, 9, 10) |
| Step 8 | Remove unused dependencies (3 devDeps + knip.json cleanup) | MODIFY: `package.json`, `package-lock.json` (regenerated), `knip.json` | S (5 min) | Step 5 | YES (parallel with 6, 7, 9, 10) |
| Step 9 | Fix stale test comments (2 test files) | MODIFY: `scripts/__tests__/wave6-alerts.test.js`, `scripts/__tests__/wave9-defense-depth.test.js` | S (3 min) | Step 5 | YES (parallel with 6, 7, 8, 10) |
| Step 10 | Update stale documentation (7 docs across 3 priority tiers) | MODIFY: `ARCHITECTURE.md`, `docs/TRIGGERS.md`, `.claude/HOOKS.md`, `docs/SECURITY.md`, `docs/agent_docs/AGENT_ORCHESTRATION.md`, `DEVELOPMENT.md`, `AI_WORKFLOW.md` | M (20-30 min) | Step 5 | YES (parallel with 6, 7, 8, 9) |
| Step 11 | Commit 2 -- constructive actions | None (git commit) | S (2 min) | Steps 6-10 | No |
| Step 12 | Final verification (`crossdoc:check`, `patterns:check`, `test:build`, `test`, `git status`, `git log`) | None (verification only) | S (5 min) | Step 11 | No |
| Step 13 | Push branch to remote | None (git push) | S (2 min) | Step 12 | No |
| Step 14 | Audit (code-reviewer agent on all modified files) | None (review only) | S (10 min) | Step 13 | No |

**Total steps: 14** (matches PLAN.md Steps 1-14 exactly)

### Step 10 Sub-Tasks Detail

| Sub-task | Doc | Priority | Change Description |
|----------|-----|----------|-------------------|
| 10a | `ARCHITECTURE.md` | HIGH | Fix version table: Next.js 16.1->16.2.0, React 19.2.3->19.2.4 |
| 10b | `docs/TRIGGERS.md` | HIGH | Add PreToolUse hooks, update SessionStart count to 4, update total trigger count |
| 10c | `.claude/HOOKS.md` | HIGH | Add `global/gsd-check-update.js` to SessionStart section |
| 10d | `docs/SECURITY.md` | MEDIUM | Reference CLAUDE.md v5.6 guardrails (sections 2, 4) |
| 10e | `docs/agent_docs/AGENT_ORCHESTRATION.md` | MEDIUM | Update "extracted from claude.md v4.2" to v5.6 |
| 10f | `DEVELOPMENT.md` | LOW | Refresh with latest session context |
| 10g | `AI_WORKFLOW.md` | LOW | Clarify CLAUDE.md S2+S4 as authoritative for security/behavioral rules |

---

## 2. External Touchpoints

### Files Created
| File | Step | Notes |
|------|------|-------|
| `data/ecosystem-v2/archive/` (directory) | Step 3 | New archive subdirectory |
| `data/ecosystem-v2/archive/retros.jsonl.archived-20260318` | Step 3 | Moved from parent dir |
| `data/ecosystem-v2/archive/reviews.jsonl.archived-20260318` | Step 3 | Moved from parent dir |

### Files Deleted (11 total)
| File | Step | Verification Status |
|------|------|-------------------|
| `scripts/test-semgrep-rules.js` | Step 2 | EXISTS on disk |
| `.claude/hooks/state-utils.js` | Step 2 | EXISTS on disk |
| `tests/hooks/gsd-context-monitor.test.ts` | Step 2 | EXISTS on disk |
| `tests/hooks/stop-serena-dashboard.test.ts` | Step 2 | EXISTS on disk |
| `docs/technical-debt/raw/reviews.jsonl` | Step 2 | EXISTS on disk |
| `docs/technical-debt/MASTER_DEBT.jsonl.bak` | Step 2 | NOT FOUND -- already deleted or never existed at this path |
| `.mcp.json.bak` | Step 2 | NOT FOUND -- conditional delete, expected |
| `.claude/state/deep-plan-review-lifecycle.state.json` | Step 3 | NOT FOUND -- already deleted |
| `.claude/override-log-1772919008171.jsonl` | Step 3 | EXISTS on disk |
| `data/ecosystem-v2/retros.jsonl.archived-20260318` | Step 3 | EXISTS (moved, not deleted) |
| `data/ecosystem-v2/reviews.jsonl.archived-20260318` | Step 3 | EXISTS (moved, not deleted) |

### Files Modified (15 listed, actual count varies)
| File | Step | Exists? |
|------|------|---------|
| `config/rotation-policy.json` | Step 6 | YES (but plan cites wrong path `scripts/config/rotation-policy.json`) |
| `.claude/skills/SKILL_INDEX.md` | Step 7 | YES |
| `.claude/COMMAND_REFERENCE.md` | Step 7 | YES |
| `knip.json` | Step 8 | YES |
| `package.json` | Step 8 | YES |
| `package-lock.json` | Step 8 | YES (regenerated) |
| `scripts/__tests__/wave6-alerts.test.js` | Step 9 | YES |
| `scripts/__tests__/wave9-defense-depth.test.js` | Step 9 | YES |
| `ARCHITECTURE.md` | Step 10 | YES |
| `docs/TRIGGERS.md` | Step 10 | YES |
| `.claude/HOOKS.md` | Step 10 | YES |
| `docs/SECURITY.md` | Step 10 | YES |
| `docs/agent_docs/AGENT_ORCHESTRATION.md` | Step 10 | YES |
| `DEVELOPMENT.md` | Step 10 | YES |
| `AI_WORKFLOW.md` | Step 10 | YES |

### Skills/Hooks/Agents Affected
- `.claude/skills/SKILL_INDEX.md` -- skill registry (count correction)
- `.claude/COMMAND_REFERENCE.md` -- skill command reference (4 additions)
- `.claude/HOOKS.md` -- hook documentation (1 addition)
- `.claude/hooks/state-utils.js` -- DELETED (orphan root duplicate)
- No agent definitions are modified
- No hook implementations are modified (only hook docs)

### Config Files Changed
- `config/rotation-policy.json` -- rotation tier additions
- `knip.json` -- dependency suppression removals
- `package.json` -- devDependency removals (msw, @firebase/rules-unit-testing, @playwright/test)
- `package-lock.json` -- regenerated

---

## 3. Effort Summary

### Plan's Own Estimate
| Phase | Steps | Effort |
|-------|-------|--------|
| Branch + destructive commit | 1-5 | S (15 min) |
| Constructive fixes | 6-10 | M (30-45 min, docs are the bulk) |
| Commit + verify + push | 11-13 | S (10 min) |
| Audit | 14 | S (10 min) |
| **Total** | 1-14 | **M (~60-75 min)** |

### Assessment: Plan estimate is REASONABLE
- Destructive phase (Steps 1-5): Straightforward git rm operations. 15 min is accurate.
- Constructive phase (Steps 6-10): Docs are the bulk (Step 10 = 7 documents). 30-45 min is realistic if docs need only targeted edits. Could stretch to 60 min if doc content requires research.
- Final phase (Steps 11-14): Mechanical. 20 min is accurate.
- **Realistic total: 60-90 minutes (1 session)**

### Risk Assessment Per Step

| Step | Risk Level | Risk Description |
|------|-----------|------------------|
| Step 1 | NONE | Standard git operation |
| Step 2 | LOW | 2 files already missing (`MASTER_DEBT.jsonl.bak`, `.mcp.json.bak`). Commands will need adjustment. Conditional delete handles `.mcp.json.bak` already. |
| Step 3 | LOW | 1 file already missing (`deep-plan-review-lifecycle.state.json`). Archive dir creation is safe. |
| Step 4 | LOW | Pre-commit hooks could fail if deletions break crossdoc references |
| Step 5 | LOW | Verification may surface unexpected broken references from deletions |
| Step 6 | MEDIUM | Plan has WRONG file path (`scripts/config/` vs actual `config/`). Executor must use correct path. Also, rotation-policy.json structure needs to be read first. |
| Step 7 | LOW | Count verification is straightforward |
| Step 8 | LOW | Standard npm uninstall. 3 deps confirmed in package.json. Only 2 of 3 are in knip.json (not 3 as plan states). |
| Step 9 | NONE | Trivial comment edits |
| Step 10 | MEDIUM | 7 docs to update. Version numbers need verification against package.json. LOW-priority docs (DEVELOPMENT.md, AI_WORKFLOW.md) are vague on scope. |
| Step 11 | LOW | Pre-commit hooks could fail on doc format issues |
| Step 12 | LOW | Standard verification |
| Step 13 | NONE | Standard push |
| Step 14 | LOW | Code-reviewer findings may require additional fixes |

---

## 4. Pre/Post Conditions

### Pre-Conditions (what must be true before this plan starts)
1. **Clean working tree** -- no uncommitted changes on current branch
2. **Main branch up to date** -- `git pull origin main` succeeds
3. **All npm scripts functional** -- `crossdoc:check`, `patterns:check`, `test:build`, `npm test` pass on main
4. **No other plans have modified the same files** -- particularly docs files, `knip.json`, `package.json`
5. **Research is complete** -- `.research/repo-cleanup/RESEARCH_OUTPUT.md` (v2.0, 53 claims) exists and is current

### Post-Conditions (what will be true after completion)
1. **7 orphaned files removed** from the repository (6 confirmed + 1 conditional)
2. **4 completed artifacts archived or deleted** (ephemeral state cleaned)
3. **`data/ecosystem-v2/archive/` directory exists** with 2 archived JSONL files
4. **Rotation policy updated** with 3 additional files in rotation tiers
5. **SKILL_INDEX.md reflects actual skill count** (65, not 67)
6. **COMMAND_REFERENCE.md lists all skills** (4 added)
7. **3 unused devDependencies removed** (msw, @firebase/rules-unit-testing, @playwright/test)
8. **knip.json suppressions reduced** by 2 (not 3 -- @playwright/test was never there)
9. **2 stale test comments fixed**
10. **7 documentation files updated** to current state
11. **All verification suites pass** (crossdoc, patterns, tests)
12. **Branch `cleanup/repo-hygiene` pushed** to remote

### What Other Plans Benefit From This Plan Completing First

| Benefiting Plan | Why |
|----------------|-----|
| **system-wide-standardization (SWS)** | SWS touches many docs and config files. Repo-cleanup removes orphans and fixes stale docs first, preventing SWS from building on stale foundations. |
| **cli-tools-implementation** | Removes orphan `scripts/test-semgrep-rules.js` and fixes test comments, reducing noise for CLI tools work in `scripts/`. |
| **passive-surfacing-remediation** | Updates `docs/TRIGGERS.md` and `.claude/HOOKS.md` hook inventory, which passive-surfacing may reference for hook-based alerts. |
| **agent-environment-analysis** | Updates `docs/agent_docs/AGENT_ORCHESTRATION.md` version reference, which agent-env analysis may reference. |
| **propagation-research** | Clean rotation-policy.json and doc state reduces false findings in propagation analysis. |
| **custom-statusline** | Minimal overlap. Statusline is self-contained Go binary. |

**DIAGNOSIS.md confirms:** "Repo-cleanup should go first (cleans up issues other plans would work around)"

---

## 5. Deferred Items (from DECISIONS.md)

These items are explicitly OUT OF SCOPE for this plan:

| Item | Deferred To | Decision # |
|------|------------|------------|
| 7 oversized skills needing REFERENCE.md split | `/skill-audit` per skill | #3 |
| 13 agents missing maxTurns | N/A (unnecessary) | #4 |
| Husky v10 migration | Separate task | #13 |
| knip.json blanket test/script ignores | Future knip session | #9 |
| validate-plan.yml dormant workflow | N/A (harmless) | #11 |

---

## 6. Discrepancies Found During Verification

### Convergence Loop Results

1. **Step count: MATCH** -- Plan has 14 steps (Steps 1-14). Inventory has 14 rows. Verified.

2. **File path spot-checks (19 checked):**
   - 14 of 19 files EXIST as expected
   - `docs/technical-debt/MASTER_DEBT.jsonl.bak` -- NOT FOUND (only `MASTER_DEBT.jsonl` exists, no `.bak`)
   - `.mcp.json.bak` -- NOT FOUND (plan handles this with conditional delete)
   - `.claude/state/deep-plan-review-lifecycle.state.json` -- NOT FOUND (already cleaned up)
   - `scripts/config/rotation-policy.json` -- WRONG PATH in plan. Actual: `config/rotation-policy.json`
   - `data/ecosystem-v2/archive/` directory -- does not exist yet (will be created in Step 3)

3. **Effort estimates: GROUNDED** -- All effort numbers come directly from the plan's own effort table (line 319-327). My "realistic total" assessment adds buffer based on doc update scope.

4. **Sub-steps / conditional branches:**
   - Step 2 has a conditional branch: `.mcp.json.bak` delete only if exists (handled with `2>/dev/null || true`)
   - Step 7 has 2 sub-tasks (SKILL_INDEX + COMMAND_REFERENCE)
   - Step 10 has 7 sub-tasks across 3 priority tiers
   - No hidden steps found

5. **knip.json discrepancy:** Plan says "remove 3 dep suppressions" (Step 8) but only 2 of the 3 deps (`@firebase/rules-unit-testing`, `msw`) are in knip.json's `ignoreDependencies`. `@playwright/test` is NOT suppressed in knip.json. The npm uninstall of all 3 is still correct, but the knip.json edit is 2 removals, not 3.

6. **Rotation policy path error:** Plan references `scripts/config/rotation-policy.json` (Step 6, line 144) but the actual file is `config/rotation-policy.json` at project root. The `rotate-jsonl.js` script confirms: `path.resolve(projectRoot, "config", "rotation-policy.json")` (line 231).

### Corrections Applied
- Rotation policy path corrected in all tables to `config/rotation-policy.json`
- knip.json suppression count noted as 2 (not 3) in effort/risk sections
- Missing files flagged in External Touchpoints table with verification status
- `deep-plan-review-lifecycle.state.json` noted as already cleaned up

---

## Confidence Assessment

- HIGH claims: 12 (file existence, step structure, dependency presence, path verification)
- MEDIUM claims: 3 (effort estimates, doc update scope, cross-plan benefits)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** (all claims verified against filesystem)
