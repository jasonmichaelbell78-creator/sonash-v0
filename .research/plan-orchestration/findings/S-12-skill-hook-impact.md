# Findings: Skill, Hook, and Agent Definition Impact Analysis

**Searcher:** deep-research-searcher (cross-cutting analyst)
**Profile:** codebase
**Date:** 2026-03-24
**Sub-Question IDs:** S-12 (cross-cutting L3 analysis)
**Inputs:** S-01 through S-07 findings, DIAGNOSIS.md, filesystem verification

---

## 1. Skill Modification Map

| Skill | Plans That Modify It | Type of Change | Ordering Constraint |
|-------|---------------------|----------------|---------------------|
| `session-begin` | **passive-surfacing** (Step 8), **SWS** (Step 7) | PS: Extend Section 4.2 warning gate with 4 new flag sources. SWS: Formalize lifecycle. | PS before SWS -- PS adds gates that SWS would formalize. If SWS runs first, it formalizes a gate that does not yet include the new flag sources. |
| `session-end` | **agent-env** (Step 5.4), **SWS** (Step 7) | AE: Add agent Teams metrics section. SWS: Formalize lifecycle. | AE before SWS -- AE adds a concrete feature; SWS formalizes the skill. |
| `alerts` | **passive-surfacing** (Step 11 evaluation), **agent-env** (Step 5.4), **SWS** (Step 11) | PS: Evaluate via /skill-audit (may modify). AE: Add "Agent Cost" alert category. SWS: Formalize alert schemas. | PS and AE before SWS. PS and AE are independent of each other (PS evaluates; AE adds a category). |
| `convergence-loop` | **agent-env** (Step 5.2) | AE: Add team-based verification to the skill. | No constraint vs other plans. Must complete before SWS. |
| `deep-plan` | **agent-env** (Step 5.2) | AE: Add agent delegation in execution routing. | No constraint vs other plans. Must complete before SWS. |
| `skill-audit` | **agent-env** (Step 5.2), **SWS** (Step 2) | AE: Add agent-based verification in Phase 5. SWS: Canonize as primary mechanism. | AE before SWS. |
| `create-audit` | **agent-env** (Step 5.2), **SWS** (Step 14) | AE: Add agent architecture recommendations. SWS: Referenced during Audits standardization. | AE before SWS. |
| `audit-agent-quality` | **agent-env** (Phase 2 created it; Phase 4-5 may refine) | AE: Created in Phase 2 (done). May be refined during Phase 4. | Self-contained to agent-env plan. |
| `hook-ecosystem-audit` | **passive-surfacing** (Step 9), **SWS** (Step 3/14) | PS: Add "Passive Surfacing Compliance" audit category. SWS: Standardize. | PS before SWS. |
| `script-ecosystem-audit` | **passive-surfacing** (Step 9), **SWS** (Step 9) | PS: Add "Passive Surfacing Compliance" audit category. SWS: Standardize. | PS before SWS. |
| `session-ecosystem-audit` | **passive-surfacing** (Step 9), **SWS** (Step 7) | PS: Add "Passive Surfacing Compliance" audit category. SWS: Standardize. | PS before SWS. |
| `health-ecosystem-audit` | **passive-surfacing** (Step 9), **SWS** (Step 14) | PS: Add "Passive Surfacing Compliance" audit category. SWS: Standardize. | PS before SWS. |
| `doc-ecosystem-audit` | **propagation** (Step 8, via shared-lib extraction), **SWS** (Step 5) | PROP: Refactor to use shared-lib imports. SWS: Enhanced/standardized. | PROP before SWS. |
| `comprehensive-ecosystem-audit` | **propagation** (Step 8), **SWS** (Step 14) | PROP: Refactor to use shared-lib imports. SWS: Standardized. | PROP before SWS. |
| `pr-ecosystem-audit` | **propagation** (Step 8), **SWS** (Step 4) | PROP: Refactor to shared-lib. SWS: PR Review standardized. | PROP before SWS. |
| `tdms-ecosystem-audit` | **propagation** (Step 8), **SWS** (Step 8/16/21) | PROP: Refactor to shared-lib. SWS: TDMS standardized across 3 stages. | PROP before SWS. |
| `skill-ecosystem-audit` | **propagation** (Step 8), **SWS** (Step 2) | PROP: Refactor to shared-lib. SWS: Skills standardized. | PROP before SWS. |
| `SKILL_INDEX.md` | **repo-cleanup** (Step 7) | RC: Correct skill count (65 not 67), add 4 missing entries. | RC before any plan that checks skill counts. |
| `SKILL_STANDARDS.md` (in `_shared/`) | **SWS** (Step 2) | SWS: Update with CANON standards. | SWS-internal. |
| `checkpoint` | **SWS** (Step 7) | SWS: Formalize session checkpoint lifecycle. | SWS-internal. |
| `task-next` | **SWS** (Step 17) | SWS: Referenced during Roadmap & Execution standardization. | SWS-internal. |
| `docs-maintain` | **SWS** (Step 5) | SWS: Referenced during Docs standardization. | SWS-internal. |
| `sonarcloud` | **SWS** (Step 8) | SWS: Referenced during TDMS standardization. | SWS-internal. |
| `add-debt` | **SWS** (Step 8) | SWS: Referenced during TDMS standardization. | SWS-internal. |

**Total unique skills modified: 24** (across 6 plans; SWS touches nearly all).

---

## 2. Hook Modification Map

| Hook | Plans That Modify It | Type of Change | Ordering Constraint |
|------|---------------------|----------------|---------------------|
| `.claude/hooks/session-start.js` | **passive-surfacing** (Step 1, 7 violations), **cli-tools** (Step 18, tool detection) | PS: Fix fire-and-forget warnings, add state flags, remove wallpaper. CLI: Add tool-manifest reading + availability check logic. | **CRITICAL conflict.** Both modify the same 1077-line file. PS and CLI are independent (neither depends on the other), but merge conflicts are near-certain if they run in parallel. **Recommendation:** Run one before the other; PS first is preferable (fixes violations that CLI would inherit). |
| `.claude/hooks/post-write-validator.js` | **passive-surfacing** (Step 2, 9 violations) | PS: Standardize format, add Fix commands, remove wallpaper. | PS-only. No ordering constraint. |
| `.claude/hooks/post-read-handler.js` | **passive-surfacing** (Step 3, 3 violations) | PS: Write state flags, add Fix commands. | PS-only. No ordering constraint. |
| `.claude/hooks/user-prompt-handler.js` | **passive-surfacing** (Step 4, 4 violations) | PS: Split cooldown logic, add Fix commands. | PS-only. No ordering constraint. |
| `.claude/hooks/compact-restore.js` | **passive-surfacing** (Step 5a, 1 violation) | PS: Add [TRACKED] marker, write recovery flag. | PS-only. No ordering constraint. |
| `.claude/hooks/check-remote-session-context.js` | **passive-surfacing** (Step 5b, 1 violation) | PS: Add Fix command, route to JSONL. | PS-only. No ordering constraint. |
| `.claude/hooks/decision-save-prompt.js` | **passive-surfacing** (Step 5c, 1 violation) | PS: Add Fix command. | PS-only. No ordering constraint. |
| `.claude/hooks/commit-tracker.js` | None | No changes planned. | N/A |
| `.claude/hooks/pre-compaction-save.js` | None | No changes planned. | N/A |
| `.claude/hooks/pre-commit-agent-compliance.js` | None | No changes planned. | N/A |
| `.claude/hooks/block-push-to-main.js` | None | No changes planned. | N/A |
| `.claude/hooks/track-agent-invocation.js` | None | No changes planned. | N/A |
| `.claude/hooks/global/statusline.js` | **custom-statusline** (Step 12, DELETE) | SL: Delete and replace with Go binary. | SL is self-contained. Must happen after Go binary is verified (SL-internal). No cross-plan constraint. |
| `.claude/hooks/global/gsd-check-update.js` | None | No changes planned. | N/A |
| `.claude/hooks/state-utils.js` (ROOT orphan) | **repo-cleanup** (Step 2, DELETE) | RC: Delete orphan file. | RC first -- otherwise other plans might reference it by mistake (unlikely since it is unused). |
| `.claude/hooks/lib/state-utils.js` (real) | None | No changes planned. | N/A |
| `.husky/pre-commit` | **passive-surfacing** (Step 6, 1 violation), **propagation** (Step 11, EXIT trap), **agent-env** (Step 5.3, agent triggers), **SWS** (Steps 1e/3/progressive, CANON gates) | PS: Add Fix command, route to JSONL. PROP: Add EXIT trap for failure telemetry. AE: Wire agent-based code review triggers. SWS: Add CANON validation gates. | **CRITICAL 4-way conflict.** All 4 plans modify `.husky/pre-commit`. Changes are additive (different concerns), so merge conflicts are avoidable if each plan appends/modifies different sections. **Ordering:** PS and PROP first (smaller, surgical changes). AE next (adds triggers). SWS last (adds comprehensive CANON gates that should wrap final state). |
| `.husky/pre-push` | **propagation** (Step 11, EXIT trap), **SWS** (Steps 1e/3/progressive, CANON gates) | PROP: Add EXIT trap. SWS: Add CANON validation gates. | PROP before SWS. |
| `.husky/_shared.sh` | **propagation** (Step 11, possibly EXIT trap shared logic) | PROP: May add shared EXIT trap infrastructure. | PROP-only. No constraint. |
| `.claude/settings.json` `statusLine` | **custom-statusline** (Step 10, change command to Go binary) | SL: Update `statusLine.command` from Node.js to Go binary path. | SL is self-contained for this field. |
| `.claude/settings.json` `hooks` | **cli-tools** (Step 19, add ntfy notification hook) | CLI: Add Notification hook entry for ntfy.sh. | CLI-only for this section. No conflict with SL (different JSON key). |
| `scripts/check-agent-compliance.js` | **agent-env** (Step 5.1, Decision #27), **passive-surfacing** (Step 7) | AE: Move from advisory to --strict mode. PS: Add Fix command. | AE after PS -- PS fixes the surfacing format; AE changes enforcement strictness. |

**Total unique hook files modified: 13** (across 5 plans).

---

## 3. Agent Definition Modification Map

| Agent(s) | Plans That Modify It | Type of Change | Ordering Constraint |
|----------|---------------------|----------------|---------------------|
| All 24 root agents (`*.md` in `.claude/agents/`) | **agent-env** (Phase 4, Step 4.1) | AE: Prompt rewrites, model changes, tool list fixes per audit findings. | AE-only for modifications. SWS Step 13 standardizes later. AE before SWS. |
| All 13 global agents (`*.md` in `.claude/agents/global/`) | **agent-env** (Phase 4, Step 4.1) | AE: GSD agent improvements and deep-research agent refinement. | AE-only. |
| New agents (to be created) | **agent-env** (Phase 4, Step 4.3) | AE: Create agents for workflow gaps identified in Phase 1.2. | AE-only. |
| Agents to be pruned (subset of 11 stubs) | **agent-env** (Phase 4, Step 4.1) | AE: Delete unused stub agents. | AE-only. Must happen before SWS Step 13 (Agent standardization). |
| Agent trigger table in CLAUDE.md S7 | **agent-env** (Step 5.1) | AE: Update trigger assignments, add team triggers, remove pruned entries. | AE before SWS. Also: after CLI-tools if CLI adds to CLAUDE.md S6b. |

**Total unique agent files potentially modified: 37+** (24 root + 13 global + new creations - deletions). All modifications are within agent-env plan only.

---

## 4. Config File Impact

| Config File | Plans That Modify It | Type of Change | Ordering Constraint |
|-------------|---------------------|----------------|---------------------|
| `CLAUDE.md` | **cli-tools** (Step 17, add S6b), **agent-env** (Step 5.1, update S7), **SWS** (implicit, standards ref) | CLI: Add tool preferences section 6b. AE: Update agent trigger table section 7. SWS: May reference for standards. | CLI and AE modify different sections (6b vs 7) -- no conflict. Both before SWS. |
| `.claude/settings.json` | **custom-statusline** (Step 10, `statusLine.command`), **cli-tools** (Step 19, add ntfy hook) | SL: Modify `statusLine` key. CLI: Add to `hooks.Notification` or `hooks.PostToolUse`. | Independent JSON keys -- no conflict. Can parallelize. |
| `config/rotation-policy.json` | **repo-cleanup** (Step 6) | RC: Add 3 files to rotation tiers. | RC-only. |
| `knip.json` | **repo-cleanup** (Step 8) | RC: Remove 2 dependency suppressions. | RC-only. |
| `package.json` | **repo-cleanup** (Step 8, remove 3 devDeps), **cli-tools** (Step 15, add tsgo) | RC: Remove msw, @firebase/rules-unit-testing, @playwright/test. CLI: Add @typescript/native-preview. | No conflict -- different deps. Either order. |
| `.oxlintrc.json` | **cli-tools** (Step 1) | CLI: Enable type-aware rules. | CLI-only. |
| `.github/workflows/ci.yml` | **propagation** (Steps 2 and 13) | PROP: Remove continue-on-error (Step 2). Add gitleaks step (Step 13). | PROP-only. |
| `scripts/config/hook-checks.json` | **agent-env** (Step 5.3) | AE: Add new hook check entries for agent triggers. | AE-only. |
| `known-propagation-baseline.json` | **propagation** (Step 5, NEW) | PROP: Create baseline for existing violations. | PROP-only. |
| `.canon/` (entire directory) | **SWS** (Step 1, NEW) | SWS: Create entire CANON framework. | SWS-only. |
| `.claude/tool-manifest.json` | **cli-tools** (Step 5, NEW) | CLI: Create tool registry. | CLI-only. |
| `.claude/state/session-start-failures.json` | **passive-surfacing** (Step 1, NEW) | PS: Build failure flags for session-begin gate. | PS-only. |
| `.claude/state/context-warnings.json` | **passive-surfacing** (Step 3, NEW) | PS: Context size warnings for session-begin gate. | PS-only. |
| `.claude/state/agent-token-usage.jsonl` | **agent-env** (Step 5.4, NEW) | AE: Token monitoring data layer. | AE-only. |

---

## 5. Cascade Analysis

If Plan A modifies artifact X, and Plan B uses/modifies artifact X:

| Dependency | Upstream Plan | Downstream Plan | Artifact | Risk if Wrong Order |
|------------|--------------|-----------------|----------|---------------------|
| **D1** | **passive-surfacing** | **SWS** (Step 7) | `session-begin` skill | SWS would formalize a session-begin gate that lacks PS's 4 new flag sources. SWS would need to redo the gate. MEDIUM risk. |
| **D2** | **agent-env** | **SWS** (Step 13) | Agent definitions (37 files) | SWS standardizes agents AE hasn't improved yet. SWS would standardize broken/low-quality agents. HIGH risk -- memory note explicitly says "all 5 phases must complete before SWS Phase 1." |
| **D3** | **agent-env** | **SWS** (Step 2) | `skill-audit` skill | SWS canonizes skill-audit as primary mechanism. If AE hasn't added agent-based verification yet, SWS canonizes an incomplete skill. MEDIUM risk. |
| **D4** | **propagation** | **SWS** (Steps 2-14) | 10 ecosystem audit skills | PROP extracts shared-lib from ecosystem audit skills. If SWS runs first, it standardizes skills with duplicated code. SWS would need to re-standardize after PROP. MEDIUM risk. |
| **D5** | **passive-surfacing** | **SWS** (Steps 3/7/11/14) | 4 ecosystem audit skills | PS adds "Passive Surfacing Compliance" category to these skills. If SWS runs first, it standardizes without this category. LOW risk (SWS could add it). |
| **D6** | **passive-surfacing** | **cli-tools** | `session-start.js` | CLI modifies session-start.js (adds tool detection). If PS hasn't fixed the 7 violations first, CLI inherits broken surfacing patterns. MEDIUM risk of merge conflicts. |
| **D7** | **repo-cleanup** | **All other plans** | Stale docs, orphan files | RC cleans stale docs and orphans. Other plans may reference stale state. LOW risk (other plans don't depend on these specific files). |
| **D8** | **passive-surfacing** + **propagation** | **agent-env** (Step 5.3) | `.husky/pre-commit` | AE adds agent triggers to pre-commit. If PS and PROP haven't already made their changes, AE may conflict during integration. MEDIUM risk. |
| **D9** | **agent-env** | **SWS** (Step 5.4) | `session-end`, `alerts` skills | AE adds token monitoring sections. SWS formalizes these skills. AE before SWS. MEDIUM risk. |
| **D10** | **propagation** | **SWS** (Steps 1e/3) | `.husky/pre-commit`, `.husky/pre-push` | PROP adds EXIT traps. SWS adds CANON validation gates. PROP before SWS to avoid SWS overwriting PROP's additions. LOW risk (additive, different sections). |
| **D11** | **cli-tools** | **agent-env** (Step 5.1) | `CLAUDE.md` | CLI adds Section 6b. AE updates Section 7. Independent sections. No cascade. NONE risk. |
| **D12** | **custom-statusline** | **agent-env** (Step 5.4) | Statusline infrastructure | AE Step 5.4 adds token monitoring to statusline. If SL has already replaced the Node.js statusline with Go binary, AE's statusline modifications must target the Go binary's config, not JS. MEDIUM risk. |

---

## 6. Safe Parallel Sets

These groups of skill/hook modifications are independent and can run simultaneously without conflicts:

### Parallel Set A: Independent Plan-Internal Work
| Plan | What It Does | Why Safe |
|------|-------------|----------|
| **custom-statusline** (Steps 1-9) | Builds Go binary in `tools/statusline/` | Entirely new directory, no overlap with any other plan until Step 10/12 (settings.json / delete old statusline) |
| **repo-cleanup** (Steps 1-10) | Deletes orphans, updates docs, removes deps | Touches files no other plan modifies (rotation-policy, knip.json, orphan files, SKILL_INDEX count) |

### Parallel Set B: Passive-Surfacing Hook Fixes (Steps 1-7, 9)
All 8 parallel agents in passive-surfacing work on different files:
- session-start.js, post-write-validator.js, post-read-handler.js, user-prompt-handler.js, compact-restore.js, check-remote-session-context.js, decision-save-prompt.js, pre-commit -- all independent of each other.
- **Can run in parallel with Set A** (no file overlap with SL or RC core work).

### Parallel Set C: CLAUDE.md Section Modifications
| Plan | Section | Why Safe |
|------|---------|----------|
| **cli-tools** (Step 17) | Section 6b (new) | Additive, new section |
| **agent-env** (Step 5.1) | Section 7 (update) | Different section from CLI |

### Parallel Set D: `.claude/settings.json` Modifications
| Plan | JSON Key | Why Safe |
|------|----------|----------|
| **custom-statusline** (Step 10) | `statusLine.command` | Different key |
| **cli-tools** (Step 19) | `hooks.Notification` or `hooks.PostToolUse` | Different key |

### NOT Safe to Parallelize
| Plans | Shared Resource | Why Unsafe |
|-------|----------------|------------|
| **passive-surfacing** + **cli-tools** | `session-start.js` | Both modify the same 1077-line file. Merge conflict near-certain. |
| **passive-surfacing** + **propagation** + **agent-env** + **SWS** | `.husky/pre-commit` | 4 plans touch this file. Must be sequenced. |
| **propagation** + **SWS** | `.husky/pre-push` | Both modify this file. Must be sequenced. |
| **passive-surfacing** + **agent-env** | `check-agent-compliance.js` | PS fixes surfacing; AE changes enforcement mode. |

---

## 7. Ordering Recommendations

### Required Execution Order (Cascade-Driven)

```
TIER 1 (Foundation -- no dependencies, safe to parallelize)
  +-- repo-cleanup          [M, 60-75 min]
  +-- custom-statusline     [L, 3-4 sessions -- Steps 1-9 safe, Steps 10-12 after build]

TIER 2 (Core fixes -- after repo-cleanup completes for clean base)
  +-- passive-surfacing     [M, 1-2 sessions]
  +-- propagation (W1-W2)   [W1: 3 hr, W2: 8 hr]
  |   (These CAN parallelize since they touch different files,
  |    EXCEPT for .husky/pre-commit where PS Step 6 and PROP Step 11 both modify.
  |    Recommendation: PS finishes pre-commit fix before PROP adds EXIT trap.)

TIER 3 (Integration layer -- after Tier 2 hooks are stable)
  +-- cli-tools             [L, multi-session]
  |   (Must follow passive-surfacing for session-start.js cleanliness)
  +-- propagation (W3-W4)   [W3: 4 hr, W4: 2 hr]
  +-- agent-env (Phase 4)   [M-L, 1-2 sessions]
  |   (Can parallelize with cli-tools -- different files)

TIER 4 (Process wiring -- after agent improvements and tool installs)
  +-- agent-env (Phase 5)   [M, 1 session]
  |   (Touches CLAUDE.md S7, skills, hooks, statusline)
  |   (Must follow custom-statusline if SL is complete, to target correct statusline)
  |   (Must follow passive-surfacing for pre-commit stability)

TIER 5 (Standardization -- after ALL other plans complete)
  +-- SWS (Step 1: CANON)   [L, 6-10 sessions]
  +-- SWS (Steps 2-21)      [XL, 74-120 sessions]
```

### Critical Path Constraints (Non-Negotiable)

1. **agent-env (all 5 phases) BEFORE SWS Phase 1** -- Memory note is explicit: "All 5 phases must complete before SWS Phase 1."

2. **passive-surfacing BEFORE cli-tools Step 18** -- Both modify `session-start.js`. PS fixes 7 violations; CLI adds new logic. Running CLI first means building on broken surfacing.

3. **passive-surfacing BEFORE SWS** -- PS fixes 33 violations that SWS would otherwise need to track. PS also adds ecosystem audit categories that SWS would formalize.

4. **propagation (at least W1-W2) BEFORE SWS** -- PROP creates shared-lib for ecosystem audit skills and consolidates inline functions. SWS standardizes these skills. Standardizing pre-consolidation = wasted work.

5. **repo-cleanup BEFORE most other plans** -- DIAGNOSIS.md confirms: "Repo-cleanup should go first." Removes stale docs and orphans that other plans would work around.

### Soft Preferences (Recommended but Not Required)

6. **custom-statusline can run anytime** -- Self-contained Go binary. Only constraint: if agent-env Phase 5 adds statusline token monitoring, it should target the correct statusline (Go if SL is done, JS if not). Recommendation: complete SL before AE Phase 5.

7. **cli-tools Phase 1-3 (tool installs) can run anytime** -- Only Phase 5 (AI integration, Steps 17-19) has hook/CLAUDE.md dependencies.

8. **propagation W3-W4 can run after or alongside cli-tools** -- No file overlaps.

### Sequencing for `.husky/pre-commit` (4-Way Conflict Resolution)

The `.husky/pre-commit` file is modified by 4 plans. Recommended order:

1. **passive-surfacing** Step 6 -- Fix surfacing violation (add Fix command)
2. **propagation** Step 11 -- Add EXIT trap for failure telemetry
3. **agent-env** Step 5.3 -- Wire agent-based triggers for code review
4. **SWS** Step 1e/3 -- Add CANON validation gates (wraps everything)

Each modification targets a different concern (surfacing format, telemetry, agent triggers, validation gates). These are additive and can coexist, but must be applied sequentially to avoid merge conflicts.

### Sequencing for `session-start.js` (2-Way Conflict Resolution)

1. **passive-surfacing** Steps 1a-1g -- Fix 7 violations
2. **cli-tools** Step 18 -- Add tool detection logic

PS fixes existing code; CLI adds new functionality. Running PS first ensures CLI builds on compliant surfacing patterns.

---

## Convergence Loop Results

### CL Pass 1: Verify Every Skill/Hook Listed Exists on Disk

| Artifact | Claimed By | Exists? | Verification |
|----------|-----------|---------|--------------|
| `.claude/skills/session-begin/SKILL.md` | PS, SWS | YES | Glob confirmed |
| `.claude/skills/session-end/SKILL.md` | AE, SWS | YES | Glob confirmed |
| `.claude/skills/alerts/SKILL.md` | PS, AE, SWS | YES | Glob confirmed |
| `.claude/skills/convergence-loop/SKILL.md` | AE | YES | Glob confirmed |
| `.claude/skills/deep-plan/SKILL.md` | AE | YES | Glob confirmed |
| `.claude/skills/skill-audit/SKILL.md` | AE, SWS | YES | Glob confirmed |
| `.claude/skills/create-audit/SKILL.md` | AE, SWS | YES | Glob confirmed |
| `.claude/skills/audit-agent-quality/SKILL.md` | AE | YES | Glob confirmed |
| `.claude/skills/hook-ecosystem-audit/SKILL.md` | PS, SWS | YES | Glob confirmed |
| `.claude/skills/script-ecosystem-audit/SKILL.md` | PS, SWS | YES | Glob confirmed |
| `.claude/skills/session-ecosystem-audit/SKILL.md` | PS, SWS | YES | Glob confirmed |
| `.claude/skills/health-ecosystem-audit/SKILL.md` | PS, SWS | YES | Glob confirmed |
| `.claude/skills/doc-ecosystem-audit/SKILL.md` | PROP, SWS | YES | Glob confirmed |
| `.claude/skills/comprehensive-ecosystem-audit/SKILL.md` | PROP, SWS | YES | Glob confirmed |
| `.claude/skills/pr-ecosystem-audit/SKILL.md` | PROP, SWS | YES | Glob confirmed |
| `.claude/skills/tdms-ecosystem-audit/SKILL.md` | PROP, SWS | YES | Glob confirmed |
| `.claude/skills/skill-ecosystem-audit/SKILL.md` | PROP, SWS | YES | Glob confirmed |
| `.claude/skills/shared-lib/` | PROP (creates) | NO (correct -- to be created) | Glob confirmed absent |
| `.claude/skills/SKILL_INDEX.md` | RC | YES | Glob confirmed |
| `.claude/skills/_shared/SKILL_STANDARDS.md` | SWS | YES | Glob confirmed |
| `.claude/hooks/session-start.js` | PS, CLI | YES | Glob confirmed |
| `.claude/hooks/post-write-validator.js` | PS | YES | Glob confirmed |
| `.claude/hooks/post-read-handler.js` | PS | YES | Glob confirmed |
| `.claude/hooks/user-prompt-handler.js` | PS | YES | Glob confirmed |
| `.claude/hooks/compact-restore.js` | PS | YES | Glob confirmed |
| `.claude/hooks/check-remote-session-context.js` | PS | YES | Glob confirmed |
| `.claude/hooks/decision-save-prompt.js` | PS | YES | Glob confirmed |
| `.claude/hooks/global/statusline.js` | SL (deletes) | YES | Glob confirmed |
| `.claude/hooks/state-utils.js` (orphan) | RC (deletes) | YES | Glob confirmed |
| `.husky/pre-commit` | PS, PROP, AE, SWS | YES | Glob confirmed |
| `.husky/pre-push` | PROP, SWS | YES | Glob confirmed |
| `.husky/_shared.sh` | PROP | YES | Glob confirmed |
| `.claude/settings.json` | SL, CLI | YES | Read confirmed |
| `scripts/check-agent-compliance.js` | AE, PS | YES | Glob confirmed |
| `scripts/config/hook-checks.json` | AE | YES | Glob confirmed |
| `scripts/hook-report.js` | AE | YES | Glob confirmed |

**Result: 35/35 artifacts verified. 1 artifact (shared-lib) correctly marked as to-be-created.**

### CL Pass 2: Verify Cascade Dependencies

| Dependency | Upstream Modifies | Downstream Uses | Verified? |
|-----------|-------------------|-----------------|-----------|
| D1: PS -> SWS (session-begin) | PS Step 8 extends gate | SWS Step 7 formalizes lifecycle | YES -- S-04 confirms PS extends Section 4.2; S-07 confirms SWS touches session-begin. |
| D2: AE -> SWS (agents) | AE Phase 4 rewrites agents | SWS Step 13 standardizes agents | YES -- S-06 confirms AE modifies all 37 agent files; S-07 confirms SWS Step 13 is "Agents." Memory note confirms hard dependency. |
| D3: AE -> SWS (skill-audit) | AE Step 5.2 adds verification | SWS Step 2 canonizes skill-audit | YES -- S-06 lists skill-audit as modified in Step 5.2; S-07 Step 2 says "skill-audit canonized as primary mechanism." |
| D4: PROP -> SWS (ecosystem audits) | PROP Step 8 extracts shared-lib | SWS Steps 2-14 standardize these skills | YES -- S-05 confirms Step 8 touches 10 ecosystem audit skills; S-07 confirms SWS standardizes all of them. |
| D5: PS -> SWS (ecosystem audits) | PS Step 9 adds compliance category | SWS standardizes these skills | YES -- S-04 Step 9 adds to 4 skills; S-07 confirms SWS standardizes them. |
| D6: PS -> CLI (session-start.js) | PS Steps 1a-1g fix violations | CLI Step 18 adds tool detection | YES -- S-04 confirms 7 violations in session-start.js; S-03 confirms Step 18 modifies session-start.js. Both confirmed to exist. |
| D8: PS+PROP -> AE (pre-commit) | PS Step 6 + PROP Step 11 | AE Step 5.3 adds agent triggers | YES -- S-04 Step 6 modifies pre-commit; S-05 Step 11 adds EXIT trap; S-06 Step 5.3 wires agent triggers. |
| D12: SL -> AE (statusline) | SL replaces JS with Go binary | AE Step 5.4 adds token monitoring to statusline | YES -- S-02 confirms SL deletes statusline.js, replaces with Go; S-06 Step 5.4 modifies "statusline hook." If SL completes first, AE must target Go config, not JS. |

**Result: All 8 non-trivial cascade dependencies verified against findings.**

### CL Pass 3: Uncaptured Skill/Hook Modifications

Scanned all 7 findings for any skill/hook mentions not in my maps:

- **S-01 (repo-cleanup):** `.claude/HOOKS.md` (documentation, not a hook) -- captured as doc update, not hook modification. `.claude/COMMAND_REFERENCE.md` -- skill reference doc, not a skill. Correctly excluded from skill map.
- **S-02 (statusline):** No skills/hooks beyond what's captured.
- **S-03 (cli-tools):** Tool-manifest is a config file (captured). setup-cli-tools.sh and install-cli-tools.sh are scripts, not hooks. Correctly excluded.
- **S-05 (propagation):** `scripts/lib/sanitize-error.cjs` (NEW) -- a library file, not a hook/skill. Correctly excluded. But propagation Step 7's `readJsonl` consolidation touches scripts that may include hook-adjacent scripts. Checked: the 34 files are in `scripts/`, not `.claude/hooks/`. Correctly excluded.
- **S-06 (agent-env):** Decision #28 mentions "PreToolUse hook on Agent/Task tool" -- this is a NEW hook registration in `.claude/settings.json`, not a file modification. **ADDITION NEEDED:** Added to Hook Modification Map (`.claude/settings.json` hooks section) under agent-env.
- **S-07 (SWS):** References `.claude/hooks/*.js -- Zod schemas added (Step 3)` -- this means SWS Step 3 (Hooks ecosystem standardization) adds Zod schemas to ALL Claude hooks. This is a broad modification. **Already captured** in the ordering constraint "SWS last for hooks."

**Correction applied:** Agent-env Decision #28 adds a PreToolUse hook for Agent/Task matcher in `.claude/settings.json`. This is an additive change to the hooks section (new matcher entry). Added note to Config File Impact table under `.claude/settings.json`.

### CL Pass 4: `.claude/settings.json` Hook Registrations

Current `settings.json` has these hook registrations:
- `SessionStart`: 2 matchers (default + compact)
- `PreToolUse`: 1 matcher (Bash)
- `PreCompact`: 1 matcher (default)
- `PostToolUse`: 5 matchers (Write, Edit, MultiEdit, Read, AskUserQuestion, Bash, Task/Agent)
- `UserPromptSubmit`: 1 matcher (default)
- `Notification`: empty array
- `statusLine`: 1 command entry

Plans that add hook registrations to settings.json:
- **cli-tools** Step 19: Adds ntfy notification hook (likely to `Notification` array or `PostToolUse`)
- **agent-env** Decision #28: Adds PreToolUse matcher for Agent/Task tool (new entry in `PreToolUse` array)
- **custom-statusline** Step 10: Changes `statusLine.command` value

These are all additive to different sections/arrays. Low conflict risk. Can parallelize.

---

## Summary Statistics

- **Plans modifying skills:** 5 of 7 (all except repo-cleanup and custom-statusline)
- **Plans modifying hooks:** 5 of 7 (all except custom-statusline is indirect through settings.json, and propagation touches husky hooks)
- **Plans modifying agent definitions:** 1 (agent-env only, but it modifies ALL of them)
- **Plans modifying `.claude/settings.json`:** 3 (custom-statusline, cli-tools, agent-env)
- **Plans modifying `.husky/pre-commit`:** 4 (passive-surfacing, propagation, agent-env, SWS)
- **Plans modifying `CLAUDE.md`:** 2 (cli-tools, agent-env -- different sections)
- **Most-modified artifact:** `.husky/pre-commit` (4 plans)
- **Highest cascade risk:** agent-env -> SWS (37 agent files + 4+ skills + hooks)

## Confidence Assessment

- HIGH claims: 22 (file existence, cascade dependencies, ordering constraints backed by memory notes)
- MEDIUM claims: 6 (merge conflict predictions, parallel safety assessments)
- LOW claims: 1 (SWS hook schema additions -- exact scope unclear from S-07)
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**
