# Findings: Passive Surfacing Remediation Plan Inventory

**Searcher:** deep-research-searcher **Profile:** codebase
**Date:** 2026-03-24 **Sub-Question IDs:** SQ-004

---

## 1. Step Inventory Table

### Top-Level Steps (11 steps, 33 violations across 8 hook/script files + 5 skill files)

| Step ID | Description | Files Touched | Effort | Internal Dependencies | Can Parallelize? |
|---------|-------------|---------------|--------|-----------------------|------------------|
| **Step 1** | Fix session-start.js (7 violations: 3H, 3M, 1L) | `.claude/hooks/session-start.js`, `.claude/state/session-start-failures.json` (new) | M | None | Yes |
| **Step 2** | Fix post-write-validator.js (9 violations: 1H, 7M, 1L) | `.claude/hooks/post-write-validator.js` | M | None | Yes |
| **Step 3** | Fix post-read-handler.js (3 violations: 3H) | `.claude/hooks/post-read-handler.js`, `.claude/state/context-warnings.json` (new) | S | None | Yes |
| **Step 4** | Fix user-prompt-handler.js (4 violations: 2H, 2M) | `.claude/hooks/user-prompt-handler.js` | S-M | None | Yes |
| **Step 5** | Fix remaining hooks (3 violations: 2M, 1L across 3 files) | `.claude/hooks/compact-restore.js`, `.claude/hooks/check-remote-session-context.js`, `.claude/hooks/decision-save-prompt.js` | S | None | Yes |
| **Step 6** | Fix pre-commit (1 violation: 1M) | `.husky/pre-commit` | S | None | Yes |
| **Step 7** | Fix scripts (6 violations: 3M, 3L across 6 files) | `scripts/check-agent-compliance.js`, `scripts/check-review-needed.js`, `scripts/log-override.js`, `scripts/check-backlog-health.js`, `scripts/check-document-sync.js`, `scripts/append-hook-warning.js` | M | None | Yes |
| **Step 8** | Update session-begin skill (extend warning gate) | `.claude/skills/session-begin/SKILL.md` | S-M | Steps 1-5 (must know what flags are written) | No -- sequential after 1-5 |
| **Step 9** | Add "Passive Surfacing Compliance" category to 4 ecosystem audits | `.claude/skills/hook-ecosystem-audit/SKILL.md`, `.claude/skills/script-ecosystem-audit/SKILL.md`, `.claude/skills/session-ecosystem-audit/SKILL.md`, `.claude/skills/health-ecosystem-audit/SKILL.md` | S-M | None | Yes (parallel with Steps 1-8) |
| **Step 10** | Audit checkpoint (code-reviewer on all ~18 files) | All modified files from Steps 1-9 | S-M | Steps 1-9 | No -- sequential |
| **Step 11** | Run `/skill-audit alerts` with expanded focus areas | `.claude/skills/alerts/SKILL.md` (evaluated, possibly modified) | M | Step 10 | No -- sequential |

### Sub-Step Detail

| Sub-Step | Violation IDs | Severity | Description | Fix Type |
|----------|---------------|----------|-------------|----------|
| 1a | V1-V3 | HIGH | Build failures "continuing anyway" (lines 415-425) | Write failure flag to `session-start-failures.json`; session-begin gates |
| 1b | V4 | HIGH | Hook warnings summary no ack gate (lines 798-810) | Write error-level warnings to `session-start-failures.json`; mark `[TRACKED]` |
| 1c | V5 | HIGH | Previous session warning auto-corrects silently (lines 140-154) | Change to informational text (already resolved) |
| 1d | V6 | MEDIUM | Pattern compliance failure no action (line 520) | Add `Fix: npm run patterns:check-all` |
| 1e | V7 | MEDIUM | Consolidation warning no action (line 546) | Add `Fix:` command + route to hook-warnings.jsonl |
| 1f | V8 | MEDIUM | JSONL rotation error no action (line 612) | Add `Fix:` command + route to hook-warnings.jsonl |
| 1g | V9 | LOW | Informational skip messages (lines 443, 468, 473, 506) | Remove entirely per D6 |
| 2 (table) | V10-V18 | 1H, 7M, 1L | 9 post-write-validator messages (1 already compliant) | Standardize format with `Fix:` commands; move wallpaper to DEBUG; mark `[TRACKED]` |
| 3a | V19 | HIGH | Large context warning (lines ~203-217) | Write flag to `context-warnings.json`; add `Fix:` command |
| 3b | V20 | HIGH | Many files warning (lines ~191-201) | Write flag; mark `[TRACKED]`; add `Fix:` command |
| 3c | V21 | HIGH | Auto-save context prepared (lines ~345-354) | Write flag; mark `[TRACKED]`; add `Fix:` command |
| 4a | V22 | HIGH | Alerts reminder cooldown suppresses critical items (lines ~44-54) | Split cooldown: HIGH bypasses entirely; MEDIUM/LOW respect 10-min window |
| 4b | V23 | HIGH | Security/debugging directives with dedup (lines ~220+) | Already COMPLIANT -- confirm dedup doesn't suppress first occurrence |
| 4c | V24 | MEDIUM | Session ending suggestion (lines ~413-427) | Add `Fix:` command + route to hook-warnings.jsonl |
| 4d | V25 | MEDIUM | Multi-step task suggestion (lines ~486-506) | Add `Fix:` command + mark `[TRACKED]` |
| 5a | V26 | MEDIUM | compact-restore.js recovery header (lines ~134-160) | Add `[TRACKED]` marker; write recovery flag for session-begin gate |
| 5b | V27 | MEDIUM | check-remote-session-context.js passive suggestion (lines ~234-249) | Add `Fix:` command + route to hook-warnings.jsonl |
| 5c | V28 | LOW | decision-save-prompt.js template (lines ~87-103) | Add `Fix:` command; keep non-blocking |
| 6a | V29 | MEDIUM | Prettier formatting failed (line ~526) | Add `Fix:` command + route to hook-warnings.jsonl |
| 7 (table) | V30-V35 | 3M, 3L | 6 script violations across 6 files | Add `Fix:` commands to each |

**Note on violation numbering:** The plan uses V1-V33 in its mapping table. My sub-step detail above uses sequentially assigned IDs that may differ in numbering from the plan's mapping. The plan's canonical mapping at line 380-393 is:

- V1-V7: session-start.js (Step 1)
- V8-V16: post-write-validator.js (Step 2)
- V17-V19: post-read-handler.js (Step 3)
- V20-V23: user-prompt-handler.js (Step 4)
- V24: compact-restore.js (Step 5a)
- V25: check-remote-session-context.js (Step 5b)
- V26: decision-save-prompt.js (Step 5c)
- V27: pre-commit (Step 6)
- V28-V33: scripts (Step 7)

---

## 2. External Touchpoints

### Files Modified (14 existing files)

| File | Step | Modification Type |
|------|------|-------------------|
| `.claude/hooks/session-start.js` | 1 | Fix 7 violations (add flags, `Fix:` commands, remove wallpaper) |
| `.claude/hooks/post-write-validator.js` | 2 | Fix 8 violations (standardize format, add `Fix:` commands, remove wallpaper) |
| `.claude/hooks/post-read-handler.js` | 3 | Fix 3 violations (write state flags, add `Fix:` commands) |
| `.claude/hooks/user-prompt-handler.js` | 4 | Fix 3 violations (split cooldown logic, add `Fix:` commands) |
| `.claude/hooks/compact-restore.js` | 5a | Fix 1 violation (add `[TRACKED]`, write recovery flag) |
| `.claude/hooks/check-remote-session-context.js` | 5b | Fix 1 violation (add `Fix:` command, route to JSONL) |
| `.claude/hooks/decision-save-prompt.js` | 5c | Fix 1 violation (add `Fix:` command) |
| `.husky/pre-commit` | 6 | Fix 1 violation (add `Fix:` command, route to JSONL) |
| `scripts/check-agent-compliance.js` | 7 | Add `Fix:` command |
| `scripts/check-review-needed.js` | 7 | Change "Consider running" to `Fix:` command |
| `scripts/log-override.js` | 7 | Add `Fix:` command with --reason flag |
| `scripts/check-backlog-health.js` | 7 | Add specific DEBT IDs and `Fix:` command |
| `scripts/check-document-sync.js` | 7 | Include file paths in default output; add `Fix:` command |
| `scripts/append-hook-warning.js` | 7 | Add `Fix:` command for symlink/rotation |

### Files Modified (5 skill files)

| File | Step | Modification Type |
|------|------|-------------------|
| `.claude/skills/session-begin/SKILL.md` | 8 | Extend Section 4.2 warning gate to include 4 new flag sources |
| `.claude/skills/hook-ecosystem-audit/SKILL.md` | 9 | Add "Passive Surfacing Compliance" audit category |
| `.claude/skills/script-ecosystem-audit/SKILL.md` | 9 | Add "Passive Surfacing Compliance" audit category |
| `.claude/skills/session-ecosystem-audit/SKILL.md` | 9 | Add "Passive Surfacing Compliance" audit category |
| `.claude/skills/health-ecosystem-audit/SKILL.md` | 9 | Add "Passive Surfacing Compliance" audit category |

### Files Created (2 new state files)

| File | Step | Purpose |
|------|------|---------|
| `.claude/state/session-start-failures.json` | 1 | Stores build failure flags + HIGH-severity hook warnings for session-begin gate |
| `.claude/state/context-warnings.json` | 3 | Stores context size warnings for session-begin gate |

### Files Possibly Modified (Step 11 outcome-dependent)

| File | Step | Condition |
|------|------|-----------|
| `.claude/skills/alerts/SKILL.md` (or related) | 11 | Only if `/skill-audit alerts` identifies sizing/flow issues |

### Total File Touchpoints

- **14 existing files modified** (8 hooks/scripts + 6 scripts)
- **5 skill files modified**
- **2 new state files created**
- **1 skill evaluated** (alerts, possibly modified)
- **Grand total: ~21 files touched**

### Hooks, Skills, and Agent Definitions Affected

- **Hooks affected (7):** session-start, post-write-validator, post-read-handler, user-prompt-handler, compact-restore, check-remote-session-context, decision-save-prompt
- **Husky hooks affected (1):** pre-commit
- **Skills modified (5):** session-begin, hook-ecosystem-audit, script-ecosystem-audit, session-ecosystem-audit, health-ecosystem-audit
- **Skills evaluated (1):** alerts (via /skill-audit)
- **Agent definitions affected:** None directly

### Specific Violations Being Fixed (33 total)

**By severity:**
- HIGH (10): 3 in session-start.js, 1 in post-write-validator.js, 3 in post-read-handler.js, 2 in user-prompt-handler.js (1 already compliant)
- MEDIUM (16): 3 in session-start.js, 7 in post-write-validator.js, 2 in user-prompt-handler.js, 1 in compact-restore.js, 1 in check-remote-session-context.js, 1 in pre-commit, 3 in scripts
- LOW (7): 1 in session-start.js, 1 in post-write-validator.js, 1 in decision-save-prompt.js, 3 in scripts (+ 1 LOW-MEDIUM in check-document-sync.js)

**By fix pattern (D1 -- 5 root cause patterns):**
1. **Fire-and-forget warnings** -- Add `Fix:` action commands
2. **No gate on HIGH severity** -- Write state flags for session-begin gate
3. **Cooldown suppresses critical** -- Split cooldown by severity
4. **Informational wallpaper** -- Remove entirely or move to DEBUG
5. **Passive suggestions** -- Replace "Consider..." with explicit `Fix:` commands

---

## 3. Effort Summary

### Plan-Stated Effort

- **PLAN.md header:** L (~6-8 hours)
- **DIAGNOSIS.md:** M (1-2 sessions)
- **Execution model:** Single commit, single session, separate from planning session (D16, D17)

### Per-Step Effort Estimates

| Step | Effort | Risk | Rationale |
|------|--------|------|-----------|
| Step 1 (session-start.js, 7 violations) | M (45-60 min) | LOW | Largest file (37KB), most violations, but straightforward pattern application. New state file creation adds minor complexity. |
| Step 2 (post-write-validator.js, 9 violations) | M (45-60 min) | LOW | Largest violation count. All 9 follow same standardized format template. 1 already compliant. |
| Step 3 (post-read-handler.js, 3 violations) | S (20-30 min) | LOW | All 3 are same pattern (write flag + add Fix command). New state file creation. |
| Step 4 (user-prompt-handler.js, 4 violations) | S-M (25-35 min) | MEDIUM | Cooldown splitting (4a) requires careful logic change. 1 violation already compliant. |
| Step 5 (3 remaining hooks, 3 violations) | S (15-25 min) | LOW | 3 separate small files, 1 violation each. Straightforward. |
| Step 6 (pre-commit, 1 violation) | S (10-15 min) | LOW | Single violation, single fix. |
| Step 7 (6 scripts, 6 violations) | M (30-45 min) | LOW | 6 files but each has only 1 violation. Pattern-level fix. |
| Step 8 (session-begin skill) | S-M (20-30 min) | MEDIUM | Must integrate with existing Section 4.2 gate. Depends on Steps 1-5 for flag definitions. |
| Step 9 (4 ecosystem audit skills) | S-M (20-30 min) | LOW | Same category text copied 4 times with scope adaptation. |
| Step 10 (code-reviewer audit) | S-M (15-25 min) | LOW | Standard code-review pass. |
| Step 11 (/skill-audit alerts) | M (30-45 min) | MEDIUM | Open-ended audit. May surface sizing issues requiring additional work. |

### Aggregate Estimates

- **Serial execution:** ~5-7 hours (matches plan estimate of 6-8 hours)
- **With parallelization (8 agents for Steps 1-7+9):** ~2-3 hours (1-2 sessions)
- **Violation count:** 33 violations, 32 requiring fixes (1 already compliant in Step 4b)
- **Actual fixes needed:** 31 message changes + 2 new state files + 1 cooldown logic change + 4 skill category additions + 1 skill gate extension

### Complexity Assessment

**Overall: MEDIUM**

- Most fixes are mechanical pattern application (add `Fix:` commands, add `[TRACKED]` markers)
- Two areas require more thought:
  1. Cooldown splitting in user-prompt-handler.js (Step 4a) -- logic change, not just text
  2. Session-begin gate extension (Step 8) -- integration with existing gate pattern
- State file creation (Steps 1, 3) is straightforward but introduces new infrastructure
- The single-commit strategy (D17) reduces integration risk

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking hook behavior with message changes | LOW | HIGH | Code-reviewer audit (Step 10) catches regressions |
| Cooldown split introduces edge cases | MEDIUM | MEDIUM | Test with HIGH and MEDIUM alerts to verify bypass works |
| /skill-audit alerts reveals sizing issues | MEDIUM | LOW | Already planned as Step 11; issues tracked, not scope-blocking |
| Session-begin gate becomes too noisy | LOW | MEDIUM | Tiered routing (D2) already mitigates; only HIGH items gate |
| New state files introduce failure modes | LOW | MEDIUM | Files are advisory (session-begin reads if exists); graceful degradation |

---

## 4. Pre/Post Conditions

### Pre-Conditions (What Must Be True Before Starting)

1. **All 19 target files must exist** -- Verified: all 19 exist as of 2026-03-24
2. **`.claude/state/` directory must exist** -- Verified: exists with 50+ files
3. **CLAUDE.md Guardrail #6 must be the governing rule** -- Verified: "All passive surfacing must force acknowledgment"
4. **No other plan is actively modifying the same 19 files** -- Must verify at execution time
5. **Session-begin SKILL.md must have Section 4.2 (warning gate)** -- Referenced but not verified in this inventory (assumed per plan text)
6. **hook-warnings.jsonl routing infrastructure must exist** -- Verified: `scripts/append-hook-warning.js` exists and is itself a fix target
7. **Plan is approved and decisions (D1-D17) are ratified** -- Status shows ACTIVE

### Post-Conditions (What Will Be True After Completion)

1. **0 passive surfacing violations** across all 8 hook/script files and 6 scripts
2. **All warnings have explicit `Fix:` action commands** -- no "Consider running..." language remains
3. **HIGH severity items write state flags** that session-begin gates on:
   - Build failures -> `session-start-failures.json`
   - Context warnings -> `context-warnings.json`
   - Recovery state -> recovery flag from compact-restore
4. **MEDIUM items route to `hook-warnings.jsonl`** via `append-hook-warning.js` and are marked `[TRACKED]`
5. **LOW items** either have inline `Fix:` commands or are removed (wallpaper)
6. **Informational wallpaper removed** -- skip messages gone, phase transitions DEBUG-only
7. **HIGH alerts bypass cooldowns** in user-prompt-handler.js
8. **Session-begin skill gates on 4 flag sources** (build failures, hook warnings, context warnings, recovery flags)
9. **4 ecosystem audit skills** have "Passive Surfacing Compliance" category for ongoing compliance monitoring
10. **`/skill-audit alerts` completed** with sizing validation

### What Other Plans Benefit From This Completing First

| Benefiting Plan | How It Benefits |
|----------------|-----------------|
| **system-wide-standardization (SWS)** | SWS enforces CANON compliance. This plan pre-fixes 33 violations that SWS would otherwise need to flag and track. Reduces SWS scope. |
| **agent-environment-analysis** | Cleaner hook behavior means agent environment research (Phase 4-5) operates on post-remediation hooks rather than discovering known violations. |
| **repo-cleanup** | Less likely to benefit -- repo-cleanup focuses on file/directory housekeeping, not code-level fixes. However, if repo-cleanup modifies any of the same 19 files, this plan's changes could conflict. |
| **cli-tools-implementation** | If CLI tools invoke or depend on hooks (e.g., session-start), they benefit from compliant surfacing behavior. Marginal benefit. |

**Strongest sequencing recommendation:** Execute BEFORE SWS (avoids SWS having to handle 33 known violations). No hard dependency -- can execute in any order relative to other plans.

---

## 5. Parallelization Map

```
                  Parallel Group 1                    Sequential Chain
    +-----------------------------------------+     +------------------+
    | Step 1 (session-start.js)               |     |                  |
    | Step 2 (post-write-validator.js)        |     |                  |
    | Step 3 (post-read-handler.js)           |---->| Step 8           |
    | Step 4 (user-prompt-handler.js)         |     | (session-begin)  |
    | Step 5 (3 remaining hooks)              |     |                  |
    | Step 6 (pre-commit)                     |     +--------+---------+
    | Step 7 (6 scripts)                      |              |
    | Step 9 (4 ecosystem audits)             |              v
    +-----------------------------------------+     +------------------+
                                                    | Step 10          |
                                                    | (code-reviewer)  |
                                                    +--------+---------+
                                                             |
                                                             v
                                                    +------------------+
                                                    | Step 11          |
                                                    | (/skill-audit)   |
                                                    +------------------+
```

**Optimal agent allocation (per plan):** 8 parallel agents for Steps 1-7 + 9, then sequential Steps 8 -> 10 -> 11.

---

## Convergence Loop Results

### Check 1: Step Count Match
- Plan defines **11 top-level steps** (Steps 1-11). My inventory covers all 11. MATCH.
- Sub-steps: Step 1 (7 sub-steps: 1a-1g), Step 2 (9-item table), Step 3 (3 sub-steps: 3a-3c), Step 4 (4 sub-steps: 4a-4d), Step 5 (3 sub-steps: 5a-5c), Step 6 (1 sub-step: 6a), Step 7 (6-item table), Step 8 (4 items), Step 9 (4 skills), Step 10 (1 action), Step 11 (6 focus areas). ALL accounted for.

### Check 2: File Path Verification
Spot-checked all 19 target files using Glob/filesystem queries:
- 5 primary hook files: ALL EXIST
- 3 remaining hook/husky files: ALL EXIST
- 6 script files: ALL EXIST
- 5 skill files: ALL EXIST
- 2 new state files (session-start-failures.json, context-warnings.json): Confirmed DO NOT YET EXIST (will be created by plan)

### Check 3: Violation Count
Plan states 33 violations. Violation mapping table (lines 380-393) sums to: 7+9+3+4+1+1+1+1+6 = **33**. MATCH.
Severity breakdown: 10 HIGH + 16 MEDIUM + 7 LOW = **33**. MATCH with DECISIONS.md.

### Check 4: Effort Estimates Grounded
- Plan header: "L (~6-8 hours)" -- reflected in my serial estimate of 5-7 hours
- DIAGNOSIS.md: "M (1-2 sessions)" -- reflects parallelized execution
- Plan parallelization guidance: "8 agents" -- reflected in my 2-3 hour parallel estimate
- All per-step estimates derived from violation count, file size, and fix complexity described in plan

### Check 5: Missed Steps/Sub-Steps
- Reviewed plan line-by-line. No conditional branches exist -- all steps are unconditional.
- Step 4b is noted as "already COMPLIANT" -- reduces actual fix count by 1 (32 fixes needed for 33 violations).
- Step 2 table row "Test registry reminder (line ~1011)" is noted as "COMPLIANT -- no change needed" -- reduces actual post-write-validator fixes to 8 (not 9).
- **Correction applied:** Updated sub-step detail to note these 2 compliant items. Actual fixes = 31 violations requiring code changes.

---

## Sources

| # | Path | Type | Trust | Notes |
|---|------|------|-------|-------|
| 1 | `.planning/passive-surfacing-remediation/PLAN.md` | Plan document | HIGH | Primary source, 392 lines, comprehensive |
| 2 | `.planning/passive-surfacing-remediation/DECISIONS.md` | Decision record | HIGH | 17 decisions, severity counts |
| 3 | `.planning/plan-orchestration/DIAGNOSIS.md` | Context document | HIGH | Effort estimate, dependency analysis |
| 4 | Filesystem verification (Glob/ls) | Ground truth | HIGHEST | All 19 files confirmed to exist |

## Contradictions

- **Effort sizing mismatch:** PLAN.md says "L (~6-8 hours)" but DIAGNOSIS.md says "M (1-2 sessions)". These are not truly contradictory -- the L estimate is serial execution time, while M (1-2 sessions) reflects parallelized execution with 8 agents. The plan's parallelization guidance resolves the apparent discrepancy.

## Gaps

- **Session-begin SKILL.md Section 4.2 not verified:** The plan references "Section 4.2 (warning gate)" in the session-begin skill but I did not read the skill content to verify Section 4.2 exists and has the expected structure. Low risk -- the plan author researched this.
- **append-hook-warning.js routing contract not verified:** Multiple steps route to hook-warnings.jsonl via this script. Its current API/interface was not examined. It is itself a fix target (Step 7).
- **Step 11 outcome is open-ended:** The /skill-audit alerts step may produce additional work items not captured in this inventory. The plan acknowledges this ("Any sizing issues addressed or tracked").

## Serendipity

- **This plan creates ongoing compliance infrastructure:** The 4 ecosystem audit categories (Step 9) mean future passive surfacing violations will be caught automatically during routine audits. This is a "fix once, prevent forever" pattern that has value beyond the 33 current violations.
- **State file pattern is reusable:** The session-start-failures.json and context-warnings.json pattern (hook writes flag, skill reads flag and gates) could be extended to other cross-boundary communication needs.

## Confidence Assessment

- HIGH claims: 12 (file existence, violation counts, step inventory, severity breakdown)
- MEDIUM claims: 5 (effort estimates, parallelization timing, cross-plan benefits)
- LOW claims: 1 (Step 11 outcome prediction)
- UNVERIFIED claims: 1 (session-begin Section 4.2 structure)
- **Overall confidence: HIGH**
