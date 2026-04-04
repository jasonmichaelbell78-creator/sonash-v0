# Findings: Cross-Plan Redundancy and Synergy Analysis

**Searcher:** deep-research-searcher (cross-cutting analyst) **Profile:**
codebase **Date:** 2026-03-24 **Sub-Question IDs:** S-10 (cross-cutting)
**Input:** S-01 through S-07 findings, DIAGNOSIS.md

---

## 1. Redundancy Table

| Redundancy ID | Description                                                                                  | Plans Involved                                                                                                         | Steps Involved                                                                                                   | Effort Saved if Deduped                                                                                                                               | Recommendation                                                                                                                                                                                                                                                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-01          | **CLAUDE.md modification** -- multiple plans add sections/update references                  | repo-cleanup (Step 10e), cli-tools (Step 17), agent-env (Step 5.1), SWS (various)                                      | RC Step 10e (version ref); CLI Step 17 (Section 6b); AE Step 5.1 (Section 7); SWS (ongoing)                      | LOW (~10-15 min) -- each plan modifies different sections, so merge conflicts are the cost, not redundant work                                        | **Not true redundancy.** Each plan touches different CLAUDE.md sections. Dedup = coordinated merge order, not step removal. Owner: whichever plan runs last should reconcile.                                                                                                                                                                                                          |
| R-02          | **`.claude/settings.json` modification** -- multiple plans add/change entries                | custom-statusline (Step 10), cli-tools (Step 19)                                                                       | CS Step 10 (statusLine.command); CLI Step 19 (ntfy hook entry)                                                   | LOW (~5 min) -- additive JSON keys, different sections                                                                                                | **Not true redundancy.** Different keys modified. Owner: whichever runs second just adds its key. No step removal needed.                                                                                                                                                                                                                                                              |
| R-03          | **`.husky/pre-commit` modification** -- 4 plans modify the same hook script                  | passive-surfacing (Step 6), propagation (Step 11), agent-env (Step 5.3), SWS (Steps 1e, 3, progressive)                | PS Step 6 (Fix: command); PROP Step 11 (EXIT trap); AE Step 5.3 (agent triggers); SWS Step 1e+ (CANON gates)     | MEDIUM (~20-30 min) -- coordinating 4 independent modifications to one file, merge conflict resolution                                                | **Coordination needed, not dedup.** Each plan adds different functionality. Owner: first plan to run owns the base; subsequent plans merge. Recommend: propagation (EXIT trap) and passive-surfacing (Fix: command) are small, surgical changes -- do them early. SWS and agent-env add more substantial changes later.                                                                |
| R-04          | **`.husky/pre-push` modification** -- 2 plans modify this file                               | propagation (Step 11), SWS (Step 1e+)                                                                                  | PROP Step 11 (EXIT trap); SWS Step 1e (CANON gates)                                                              | LOW (~5 min)                                                                                                                                          | **Propagation owns EXIT trap first; SWS adds CANON gates later.** No step removal.                                                                                                                                                                                                                                                                                                     |
| R-05          | **`.claude/hooks/session-start.js` modification** -- 2 plans modify this 1077-line file      | cli-tools (Step 18), passive-surfacing (Step 1)                                                                        | CLI Step 18 (tool detection logic); PS Step 1 (7 violation fixes)                                                | MEDIUM (~15-20 min merge effort)                                                                                                                      | **HIGH conflict risk.** Both plans make substantive changes to the same large file. Owner: passive-surfacing should run first (fixes existing code); cli-tools adds new functionality after. Sequential execution mandatory.                                                                                                                                                           |
| R-06          | **Documentation updates to `docs/agent_docs/AGENT_ORCHESTRATION.md`**                        | repo-cleanup (Step 10e), agent-env (Phase 5 implicit)                                                                  | RC Step 10e (version ref update)                                                                                 | LOW (~5 min)                                                                                                                                          | **repo-cleanup owns the version ref fix.** Agent-env may add orchestration guidance later but this is a different scope. No dedup needed.                                                                                                                                                                                                                                              |
| R-07          | **`docs/TRIGGERS.md` and `.claude/HOOKS.md` updates**                                        | repo-cleanup (Steps 10b, 10c), passive-surfacing (implicit -- modifies hook behavior that these docs describe)         | RC Steps 10b, 10c                                                                                                | LOW (~5 min)                                                                                                                                          | **repo-cleanup owns doc updates.** Passive-surfacing changes hook behavior, not hook docs. If PS runs first, RC may need to account for new behavior in docs.                                                                                                                                                                                                                          |
| R-08          | **Ecosystem audit skill modifications** -- 2 plans modify overlapping ecosystem audit skills | passive-surfacing (Step 9 -- 4 skills), propagation (Step 8 -- 10 ecosystem audit skills)                              | PS Step 9 (add compliance category to 4 skills); PROP Step 8 (extract shared-lib from 10 ecosystem audit skills) | MEDIUM (~20-30 min) -- both touch the same skill files: hook-ecosystem-audit, script-ecosystem-audit, session-ecosystem-audit, health-ecosystem-audit | **Real redundancy risk.** Both plans modify the same 4 ecosystem audit skill files (PS adds a category, PROP extracts shared code). If PROP runs first and refactors the file structure, PS's category additions target different code locations. Recommend: **PS runs first** (smaller, additive change); PROP's shared-lib extraction runs second and incorporates the new category. |
| R-09          | **`package.json` / `package-lock.json` modification**                                        | repo-cleanup (Step 8 -- remove 3 deps), cli-tools (Step 15 -- add tsgo)                                                | RC Step 8; CLI Step 15                                                                                           | LOW (~5 min -- npm handles merges well)                                                                                                               | **No true redundancy.** One removes deps, the other adds. Separate concerns. Whichever runs first, the other just runs `npm install` again.                                                                                                                                                                                                                                            |
| R-10          | **`config/rotation-policy.json` modification** -- potential overlap                          | repo-cleanup (Step 6), SWS (Step 15 -- Archival/Rotation ecosystem)                                                    | RC Step 6 (add 3 files to tiers); SWS Step 15 (canonize rotation)                                                | LOW (~5 min)                                                                                                                                          | **repo-cleanup owns immediate fixes.** SWS would later canonize the entire rotation system. No step removal -- different scopes and timelines.                                                                                                                                                                                                                                         |
| R-11          | **`.github/workflows/ci.yml` modification** -- 2 plans modify CI                             | propagation (Steps 2, 13), SWS (Step 10 -- CI/CD ecosystem)                                                            | PROP Steps 2 (remove continue-on-error), 13 (add gitleaks); SWS Step 10 (full CI canonization)                   | LOW (~5 min)                                                                                                                                          | **Propagation owns tactical CI fixes now.** SWS canonizes CI later. Propagation's changes would be absorbed into SWS's canonical CI config. No dedup -- different timelines.                                                                                                                                                                                                           |
| R-12          | **Skill SKILL_INDEX.md / COMMAND_REFERENCE.md updates**                                      | repo-cleanup (Step 7), agent-env (Phase 5 -- new agents imply skill/command updates), SWS (Step 2 -- Skills ecosystem) | RC Step 7 (count fix + 4 additions); AE Phase 5 (implicit); SWS Step 2 (canonize all skills)                     | LOW (~10 min)                                                                                                                                         | **repo-cleanup owns immediate count/listing fixes.** SWS will later canonize the entire index. No dedup needed.                                                                                                                                                                                                                                                                        |
| R-13          | **Token monitoring / statusline surface overlap**                                            | custom-statusline (Step 6 -- file-read widgets D1, D5), agent-env (Step 5.4 -- token monitoring statusline surface)    | CS Step 6 (statusline widgets read state files); AE Step 5.4 (adds token monitoring widget data)                 | LOW (~5 min)                                                                                                                                          | **Synergy, not redundancy.** Agent-env creates data that custom-statusline displays. CS should build the display infrastructure; AE provides the data source. Ordering: CS first (builds widget framework), AE second (adds data feed).                                                                                                                                                |
| R-14          | **`scripts/check-agent-compliance.js` modification**                                         | passive-surfacing (Step 7 -- add Fix: command), agent-env (Step 5.1/Decision #27 -- make strict mode)                  | PS Step 7 (add Fix: command to surfacing); AE Decision #27 (advisory -> --strict for POST-TASK)                  | LOW (~10 min)                                                                                                                                         | **Both changes are valid and complementary.** PS fixes the surfacing format; AE changes enforcement level. Order: PS first (fix surfacing), then AE (make strict).                                                                                                                                                                                                                     |
| R-15          | **Session-begin skill modification**                                                         | passive-surfacing (Step 8 -- extend warning gate), SWS (Step 7 -- canonize Sessions ecosystem)                         | PS Step 8 (add 4 flag sources to Section 4.2 gate); SWS Step 7 (full session lifecycle canonization)             | LOW (~5 min)                                                                                                                                          | **PS owns immediate gate extension.** SWS canonizes later. No step removal.                                                                                                                                                                                                                                                                                                            |
| R-16          | **`scripts/append-hook-warning.js` modification**                                            | passive-surfacing (Step 7 -- add Fix: command), propagation (Step 11 -- EXIT trap feeds data here)                     | PS Step 7; PROP Step 11 (indirectly -- hook failures feed hook-warnings.jsonl)                                   | LOW (~5 min)                                                                                                                                          | **Complementary, not redundant.** PS fixes the script's surfacing; PROP adds a new data feed into it.                                                                                                                                                                                                                                                                                  |

---

## 2. Synergy Table

| Synergy ID | Description                                                                                        | Plans Involved                         | Steps Involved                                                                                                  | Synergy Type                | Execution Note                                                                                                                                                                                                                                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SY-01      | **repo-cleanup removes orphans that other plans would work around**                                | repo-cleanup -> ALL others             | RC Steps 2-3 (delete/archive)                                                                                   | Prerequisite infrastructure | Run repo-cleanup first. All other plans benefit from a clean starting state. DIAGNOSIS.md confirms: "Repo-cleanup should go first."                                                                                                                                                                                     |
| SY-02      | **passive-surfacing fixes hook violations before SWS canonizes them**                              | passive-surfacing -> SWS               | PS Steps 1-7 (fix 33 violations); SWS Steps 3, 7, 11 (Hooks, Sessions, Alerts ecosystems)                       | Prerequisite reduction      | Run PS before SWS. SWS would otherwise encounter 33 known violations during canonization, inflating its scope. PS removes them preemptively. Saves SWS ~1-2 sessions of violation triage.                                                                                                                               |
| SY-03      | **propagation shared-lib extraction aligns with SWS ecosystem audit canonization**                 | propagation -> SWS                     | PROP Step 8 (shared-lib for ecosystem audits); SWS Step 14 (Audits ecosystem)                                   | Shared foundation           | PROP creates `.claude/skills/shared-lib/` which SWS Step 14 would canonize. If PROP runs first, SWS has a concrete artifact to standardize rather than creating one from scratch. Saves SWS ~1 session on Step 14.                                                                                                      |
| SY-04      | **agent-env Phase 4-5 must complete before SWS Step 13 (Agents ecosystem)**                        | agent-env -> SWS                       | AE Phases 4-5 (improve + integrate agents); SWS Step 13 (canonize Agents)                                       | Hard prerequisite           | Memory note: "All 5 phases must complete before SWS Phase 1." SWS Step 13 would standardize agent definitions that agent-env is still rewriting. Running AE first means SWS canonizes final agent state, not interim state.                                                                                             |
| SY-05      | **custom-statusline creates widget framework that agent-env token monitoring feeds into**          | custom-statusline -> agent-env         | CS Steps 4-9 (widget system); AE Step 5.4 (token monitoring statusline surface)                                 | Infrastructure provider     | CS builds the Go binary with widget infrastructure. AE adds a token monitoring data source. If CS completes first, AE can add its widget data via `config.toml` rather than modifying code.                                                                                                                             |
| SY-06      | **cli-tools session-start.js tool detection + passive-surfacing session-start.js violation fixes** | cli-tools, passive-surfacing           | CLI Step 18 (add tool detection); PS Step 1 (fix 7 violations in session-start.js)                              | Shared file coordination    | Both modify session-start.js. PS fixes existing code (violations 1a-1g); CLI adds new code (tool detection block). Running PS first means CLI adds to a cleaner codebase. Combined into a single commit/PR is possible if both run in the same session.                                                                 |
| SY-07      | **propagation baseline + SWS propagation infrastructure**                                          | propagation -> SWS                     | PROP Step 5 (create baseline); SWS (D49 downstream propagation mechanism)                                       | Shared concept              | Propagation creates `known-propagation-baseline.json` which aligns with SWS's D49 downstream propagation mechanism. PROP provides the tactical implementation; SWS provides the canonical framework.                                                                                                                    |
| SY-08      | **repo-cleanup doc updates + passive-surfacing hook doc accuracy**                                 | repo-cleanup -> passive-surfacing      | RC Steps 10b, 10c (update TRIGGERS.md, HOOKS.md); PS Steps 1-5 (change hook behavior)                           | Documentation accuracy      | If RC runs first and updates hook docs, then PS changes hook behavior, the docs may become stale again. If PS runs first, RC can update docs to reflect both the current state AND PS's changes. Optimal: RC doc updates should reference post-PS hook behavior.                                                        |
| SY-09      | **propagation sanitizeError consolidation + SWS Scripts ecosystem**                                | propagation -> SWS                     | PROP Steps 4, 6 (CJS wrapper + consolidate 9 copies); SWS Step 9 (Scripts ecosystem canonization)               | Prerequisite cleanup        | PROP eliminates inline copies of utility functions across 55+ script files. SWS would encounter these same duplications during Scripts canonization. PROP doing it first saves SWS significant triage effort (~1-2 sessions).                                                                                           |
| SY-10      | **propagation CI hardening + SWS CI/CD ecosystem**                                                 | propagation -> SWS                     | PROP Steps 2, 13 (remove continue-on-error, add gitleaks); SWS Step 10 (CI/CD canonization)                     | Prerequisite fixes          | PROP fixes tactical CI issues. SWS later canonizes the full CI/CD pipeline. Running PROP first means SWS starts with a healthier CI baseline.                                                                                                                                                                           |
| SY-11      | **agent-env audit skill + SWS Audits ecosystem**                                                   | agent-env -> SWS                       | AE Phase 2 (create audit-agent-quality skill); SWS Step 14 (Audits ecosystem)                                   | Artifact contribution       | AE creates a new audit skill. SWS Step 14 canonizes all audit skills. AE's skill becomes an input to SWS's standardization.                                                                                                                                                                                             |
| SY-12      | **passive-surfacing state files + custom-statusline file-read widgets**                            | passive-surfacing -> custom-statusline | PS Steps 1, 3 (create session-start-failures.json, context-warnings.json); CS Step 6 (file-read widgets D1, D5) | Data source creation        | PS creates state files that CS's widgets could read and display. If PS runs before CS, the statusline can surface these state flags from day one.                                                                                                                                                                       |
| SY-13      | **propagation hook telemetry + passive-surfacing hook monitoring**                                 | propagation -> passive-surfacing       | PROP Step 11 (EXIT trap for failure recording); PS Step 1b (hook warnings routing)                              | Data pipeline enrichment    | PROP adds EXIT traps that record hook failures to hook-runs.jsonl. PS routes hook warnings with `[TRACKED]` markers. Together they create a complete hook health monitoring pipeline.                                                                                                                                   |
| SY-14      | **Multiple plans create new state/config files that SWS will canonize**                            | ALL -> SWS                             | PS (2 state files), PROP (baseline JSON), CLI (tool-manifest.json), CS (config.toml), AE (token-usage JSONL)    | Born-compliant opportunity  | SWS's born-compliant gates (after Step 2) will enforce standards on new artifacts. If these plans run before SWS's born-compliant gates activate, their artifacts won't be born-compliant. If they run after SWS Step 2, they must comply. Practically: most plans will run before SWS Step 2 (SWS is 80-130 sessions). |

---

## 3. Dedup Recommendations

### R-03: `.husky/pre-commit` (4 plans)

This is the highest-contention file. Four plans modify it for different
purposes:

- **passive-surfacing** Step 6: Add `Fix:` command to prettier failure message
  (tiny, surgical)
- **propagation** Step 11: Add EXIT trap for failure telemetry (moderate,
  structural)
- **agent-env** Step 5.3: Add agent-based triggers for code review/security
  (substantial)
- **SWS** Step 1e+: Add CANON validation gates (major, progressive)

**Recommendation:** Execution order should be: PS -> PROP -> AE -> SWS. Each
plan owns its modification. No step removal. The first two changes (PS, PROP)
are small and independent. AE and SWS add larger structural changes and should
come later. If PS and PROP run in the same session, combine their pre-commit
changes into a single commit.

### R-05: `.claude/hooks/session-start.js` (2 plans)

This is the highest-risk overlap. session-start.js is 1077 lines and both plans
make substantive changes:

- **passive-surfacing** Step 1: Fix 7 violations (modify existing code -- add
  Fix: commands, state flags, remove wallpaper)
- **cli-tools** Step 18: Add new tool detection logic (add new code block)

**Recommendation:** passive-surfacing MUST run first. It fixes existing code.
cli-tools adds new functionality after. These cannot be parallelized. If both
run in the same session, combine into a single commit, but PS changes come first
in the diff.

### R-08: Ecosystem audit skills (2 plans)

Both passive-surfacing and propagation modify the same 4 ecosystem audit skill
files:

- **passive-surfacing** Step 9: Add "Passive Surfacing Compliance" audit
  category (additive -- new section)
- **propagation** Step 8: Extract duplicated code to shared-lib (structural --
  refactors imports/code layout)

**Recommendation:** passive-surfacing MUST run first. Its change is additive
(new text section). Propagation's change is structural (refactoring imports). If
PROP runs first and moves code around, PS's target locations change. If PS runs
first, PROP's extraction simply includes the new category in the shared-lib.
**Owner: PS for category addition; PROP for shared-lib extraction.**

### R-14: `scripts/check-agent-compliance.js` (2 plans)

- **passive-surfacing** Step 7: Add `Fix:` command to output (surfacing format)
- **agent-env** Decision #27: Change from advisory to `--strict` mode for
  POST-TASK (enforcement level)

**Recommendation:** Complementary changes. PS fixes output format; AE changes
enforcement behavior. Either order works. **Owner: PS for surfacing format; AE
for enforcement mode.**

---

## 4. Synergy Exploitation Strategy

### Tier 1: Execute First (Foundation Layer)

**repo-cleanup** should execute first. It provides:

- Clean file state for all other plans (SY-01)
- Updated documentation that other plans reference (SY-08)
- Removed orphans that would otherwise confuse analysis

**Effort saved:** ~15-30 min across all other plans (less noise, fewer "is this
file still relevant?" questions during execution).

### Tier 2: Execute Early (Violation Fixes + Hook Health)

**passive-surfacing** and **propagation** should execute early (after
repo-cleanup), potentially in the same session or adjacent sessions.

Synergy exploitation:

- PS fixes 33 violations across hooks/scripts (SY-02), creating clean hooks for
  all subsequent plans
- PROP fixes CI and adds hook telemetry (SY-10, SY-13), creating clean CI for
  all subsequent plans
- PS + PROP together create the hook health monitoring pipeline (SY-13)
- Both plans' ecosystem audit skill changes should be coordinated (R-08): PS
  adds categories first, PROP extracts shared-lib second

**Combined session opportunity:** PS Steps 1-7 and PROP Wave 1 (Steps 1-5) could
execute in the same session if parallelized with agents. PS Steps 1-7 are
independent of PROP Steps 1-5. Total: ~4-5 hours of parallel agent work.

**Effort saved by synergy exploitation:** ~2-3 sessions for SWS (SY-02, SY-09,
SY-10 combined).

### Tier 3: Execute Independently (Self-Contained Plans)

**custom-statusline** and **cli-tools** are largely self-contained. They can
execute in any position relative to other plans, but benefit slightly from:

- Running after repo-cleanup (SY-01)
- Running before agent-env (SY-05 for statusline; SY-06 for CLI tools)

**Combined session opportunity:** custom-statusline and cli-tools touch almost
no overlapping files (only `.claude/settings.json` -- R-02, with different
keys). They COULD run in parallel if multiple engineers were available. For a
solo developer, sequence doesn't matter.

### Tier 4: Execute After Prerequisites (Agent-Env)

**agent-env** (Phases 4-5 remaining) should execute after:

- passive-surfacing (so check-agent-compliance.js is already fixed -- R-14)
- custom-statusline (so statusline widget infrastructure exists for token
  monitoring -- SY-05)

**Hard constraint:** Agent-env must complete ALL 5 phases before SWS Phase 1
starts (SY-04).

### Tier 5: Execute Last (SWS)

**SWS** is the terminal plan. It benefits from ALL other plans completing first:

- SY-02: PS removes 33 violations SWS would triage
- SY-03: PROP creates shared-lib SWS would canonize
- SY-04: AE finalizes agents SWS would standardize
- SY-09: PROP consolidates scripts SWS would canonize
- SY-10: PROP hardens CI SWS would canonize
- SY-14: All plans create artifacts SWS would govern

**Total effort saved for SWS:** ~4-6 sessions by running all other plans first.

### Recommended Execution Order

```
1. repo-cleanup          (M, 1 session)     -- foundation cleanup
2. passive-surfacing     (M, 1-2 sessions)  -- fix violations
3. propagation W1        (S, ~3 hours)      -- critical fixes, baseline
4. custom-statusline     (L, 3-4 sessions)  -- independent, can interleave
5. cli-tools             (L, 2 sessions)    -- independent, can interleave
6. propagation W2-W4     (L, ~14 hours)     -- consolidation, infra hardening
7. agent-env Ph4-5       (M-L, 2-4 sessions)-- agent improvements + integration
8. SWS                   (XL, 80-130 sessions) -- canonize everything
```

Plans 4 and 5 can interleave with 3 and 6. Plans 2 and 3 can partially
parallelize.

---

## 5. Net Effort Impact

### Total Estimated Effort Across All 7 Plans (Raw)

| Plan                        | Raw Effort (hours)                        | Raw Effort (sessions) |
| --------------------------- | ----------------------------------------- | --------------------- |
| repo-cleanup                | 1-1.5                                     | 1                     |
| custom-statusline           | 8-12                                      | 3-4                   |
| cli-tools                   | 3-4                                       | 2                     |
| passive-surfacing           | 5-7 (serial) / 2-3 (parallel)             | 1-2                   |
| propagation                 | ~17                                       | 4-6                   |
| agent-env (remaining Ph4-5) | 3-5                                       | 2-4                   |
| SWS                         | ~200-325 (80-130 sessions x 2.5h/session) | 80-130                |
| **Total**                   | **~237-362 hours**                        | **~93-149 sessions**  |

Note: SWS dominates at ~85% of total effort. The other 6 plans combined are
~37-42 hours (~15 sessions).

### Effort Saved by Dedup

Most "redundancies" are not true duplicated work -- they are coordination needs
(multiple plans modifying the same file for different purposes). The actual
effort saved by dedup is small:

| Dedup Action                                       | Savings                              |
| -------------------------------------------------- | ------------------------------------ |
| Coordinated `.husky/pre-commit` ordering (R-03)    | ~20-30 min (avoided merge conflicts) |
| Sequential session-start.js ordering (R-05)        | ~15-20 min (avoided merge conflicts) |
| PS-before-PROP on ecosystem audit skills (R-08)    | ~20-30 min (avoided rework)          |
| Combined package.json changes when adjacent (R-09) | ~5 min                               |
| **Total dedup savings**                            | **~60-85 min (~1 hour)**             |

### Effort Saved by Synergy Exploitation

Running plans in the recommended order saves significant effort for downstream
plans, especially SWS:

| Synergy Exploitation                                    | Savings                                        |
| ------------------------------------------------------- | ---------------------------------------------- |
| SY-02: PS removes 33 violations before SWS              | ~1-2 SWS sessions (5-10 hours)                 |
| SY-03: PROP shared-lib before SWS Audits                | ~1 SWS session (2.5 hours)                     |
| SY-04: AE completes agents before SWS Agents step       | ~1-2 SWS sessions (2.5-5 hours)                |
| SY-09: PROP consolidates scripts before SWS Scripts     | ~1-2 SWS sessions (2.5-5 hours)                |
| SY-10: PROP hardens CI before SWS CI/CD                 | ~0.5 SWS session (1.25 hours)                  |
| SY-01: repo-cleanup reduces noise for all plans         | ~0.5 sessions spread across plans (1.25 hours) |
| SY-06+SY-08: Coordinated session-start.js + doc updates | ~0.5 sessions (1.25 hours)                     |
| **Total synergy savings**                               | **~5-9 SWS sessions + ~1 non-SWS session**     |
| **In hours**                                            | **~15-25 hours**                               |

### Net Estimated Effort

| Category                           | Hours        | Sessions    |
| ---------------------------------- | ------------ | ----------- |
| Raw total (all 7 plans)            | ~237-362     | ~93-149     |
| Dedup savings                      | -1           | -0.5        |
| Synergy savings (optimal ordering) | -15-25       | -6-10       |
| **Net total**                      | **~211-336** | **~83-139** |
| **Savings percentage**             | **~7%**      | **~7%**     |

The savings are modest in percentage terms because SWS dominates total effort
and SWS's internal work is mostly non-reducible. The real value of optimal
ordering is **risk reduction** (avoiding merge conflicts, rework, and building
on stale foundations) rather than raw hour savings.

---

## Convergence Loop

### CL Pass 1: Verify each redundancy is real

| Redundancy                       | Both plans actually do this?                                                                                                                               | Verdict                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| R-01 (CLAUDE.md)                 | RC Step 10e updates version ref. CLI Step 17 adds Section 6b. AE Step 5.1 updates Section 7. SWS touches it progressively.                                 | VERIFIED -- different sections, coordination issue not duplication |
| R-02 (settings.json)             | CS Step 10 changes statusLine.command. CLI Step 19 adds ntfy hook.                                                                                         | VERIFIED -- different JSON keys                                    |
| R-03 (pre-commit)                | PS Step 6 (Fix: command). PROP Step 11 (EXIT trap). AE Step 5.3 (agent triggers). SWS Step 1e (CANON gates).                                               | VERIFIED -- all 4 make different changes to the same file          |
| R-05 (session-start.js)          | CLI Step 18 (tool detection). PS Step 1 (7 violation fixes).                                                                                               | VERIFIED -- both modify substantively                              |
| R-08 (ecosystem audit skills)    | PS Step 9 (add category to 4 skills). PROP Step 8 (extract shared-lib from 10 skills). 4 skills overlap: hook-, script-, session-, health-ecosystem-audit. | VERIFIED -- 4 overlapping files confirmed                          |
| R-14 (check-agent-compliance.js) | PS Step 7 (Fix: command). AE Decision #27 (--strict mode).                                                                                                 | VERIFIED -- both modify, different purposes                        |

All redundancies verified. No false positives.

### CL Pass 2: Verify each synergy benefit is real

| Synergy                                 | Benefit is real?                                                                            | Verdict                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| SY-02 (PS before SWS)                   | PS fixes 33 violations. SWS would encounter them during Hooks/Sessions/Alerts canonization. | REAL -- SWS would need to either fix or baseline these                               |
| SY-04 (AE before SWS)                   | Memory note says "All 5 phases must complete before SWS Phase 1."                           | REAL -- explicit hard dependency                                                     |
| SY-05 (CS before AE)                    | AE Step 5.4 adds token monitoring to statusline. CS builds the statusline.                  | REAL but WEAK -- AE could write its own widget data file regardless of CS completion |
| SY-09 (PROP scripts before SWS Scripts) | PROP consolidates 9+ inline copies. SWS Step 9 canonizes all 88+ scripts.                   | REAL -- fewer violations for SWS to triage                                           |
| SY-13 (PROP + PS hook pipeline)         | PROP adds EXIT traps -> hook-runs.jsonl. PS routes warnings -> hook-warnings.jsonl.         | REAL -- complementary data pipelines                                                 |
| SY-14 (All before SWS born-compliant)   | Plans create artifacts before SWS gates activate.                                           | REAL but MOOT -- SWS will likely be far behind other plans                           |

Revised SY-05 strength from MEDIUM to WEAK. All other synergies confirmed.

### CL Pass 3: Missed redundancies? Re-scan for overlapping file paths.

Systematic file overlap scan across all 7 findings:

| File                                     | Plans touching it                | Already captured?                                                                                                                                                                  |
| ---------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                              | RC, CLI, AE, SWS                 | Yes (R-01)                                                                                                                                                                         |
| `.claude/settings.json`                  | CS, CLI                          | Yes (R-02)                                                                                                                                                                         |
| `.husky/pre-commit`                      | PS, PROP, AE, SWS                | Yes (R-03)                                                                                                                                                                         |
| `.husky/pre-push`                        | PROP, SWS                        | Yes (R-04)                                                                                                                                                                         |
| `.claude/hooks/session-start.js`         | CLI, PS                          | Yes (R-05)                                                                                                                                                                         |
| `package.json`                           | RC, CLI                          | Yes (R-09)                                                                                                                                                                         |
| `scripts/check-agent-compliance.js`      | PS, AE                           | Yes (R-14)                                                                                                                                                                         |
| Ecosystem audit skill files              | PS, PROP, SWS                    | Yes (R-08, partially SWS)                                                                                                                                                          |
| `docs/agent_docs/AGENT_ORCHESTRATION.md` | RC, AE (implicit)                | Yes (R-06)                                                                                                                                                                         |
| `.github/workflows/ci.yml`               | PROP, SWS                        | Yes (R-11)                                                                                                                                                                         |
| `knip.json`                              | RC only                          | N/A (single plan)                                                                                                                                                                  |
| `config/rotation-policy.json`            | RC, SWS (distant)                | Yes (R-10)                                                                                                                                                                         |
| `.claude/skills/session-begin/SKILL.md`  | PS, SWS                          | Yes (R-15)                                                                                                                                                                         |
| `.claude/skills/alerts/SKILL.md`         | AE, SWS, PS (Step 11 evaluation) | **NEW -- minor.** PS evaluates it; AE modifies it (Step 5.4); SWS canonizes it (Step 11). But PS only evaluates (may not modify), and AE/SWS are in different timelines. Low risk. |
| `scripts/hook-report.js`                 | AE only                          | N/A (single plan)                                                                                                                                                                  |
| `scripts/config/hook-checks.json`        | AE only                          | N/A (single plan)                                                                                                                                                                  |
| `scripts/append-hook-warning.js`         | PS, PROP (indirect)              | Yes (R-16)                                                                                                                                                                         |

One minor additional overlap found (alerts skill: PS evaluates, AE modifies, SWS
canonizes) but this is low-risk given the different scopes and timelines. No
significant missed redundancies.

### CL Pass 4: Are effort savings estimates realistic?

| Estimate                                | Assessment                                                                                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dedup savings (~1 hour)                 | CONSERVATIVE -- could be higher if merge conflicts are severe, but the recommended ordering prevents most conflicts                                                                         |
| Synergy savings for SWS (~5-9 sessions) | MODERATE -- realistic range. SWS is so large that pre-cleaning represents a small fraction. The sessions saved are from avoided violation triage, not from eliminated steps.                |
| Total ~7% savings                       | REALISTIC -- the savings are real but modest because SWS dominates and its internal sequential work is irreducible. The bigger win is risk reduction (avoiding merge conflicts and rework). |

No corrections needed. Estimates are grounded.

---

## Sources

| #   | Path                                                              | Type               | Trust | Date       |
| --- | ----------------------------------------------------------------- | ------------------ | ----- | ---------- |
| 1   | `.research/plan-orchestration/findings/S-01-repo-cleanup.md`      | Inventory findings | HIGH  | 2026-03-24 |
| 2   | `.research/plan-orchestration/findings/S-02-custom-statusline.md` | Inventory findings | HIGH  | 2026-03-24 |
| 3   | `.research/plan-orchestration/findings/S-03-cli-tools.md`         | Inventory findings | HIGH  | 2026-03-24 |
| 4   | `.research/plan-orchestration/findings/S-04-passive-surfacing.md` | Inventory findings | HIGH  | 2026-03-24 |
| 5   | `.research/plan-orchestration/findings/S-05-propagation.md`       | Inventory findings | HIGH  | 2026-03-24 |
| 6   | `.research/plan-orchestration/findings/S-06-agent-env.md`         | Inventory findings | HIGH  | 2026-03-24 |
| 7   | `.research/plan-orchestration/findings/S-07-sws.md`               | Inventory findings | HIGH  | 2026-03-24 |
| 8   | `.planning/plan-orchestration/DIAGNOSIS.md`                       | Diagnosis document | HIGH  | 2026-03-23 |

## Contradictions

None between findings files. All 7 findings are internally consistent and their
file overlap claims are verified against each other.

## Gaps

1. **SWS per-ecosystem file touchpoints not fully enumerated.** SWS touches "all
   skills" (Step 2), "all hooks" (Step 3), "all scripts" (Step 9), etc. The
   exact overlap with other plans at the individual file level is harder to
   quantify because SWS's scope is so broad. The synergy estimates for SWS are
   based on ecosystem-level analysis, not file-level.

2. **Agent-env Phase 4 file modifications not precisely known.** AE Step 4.1
   modifies "multiple agent .md files" but which specific agents get which
   changes depends on interactive decisions during execution. The overlap with
   other plans is estimated, not precise.

3. **Timing of SWS born-compliant gates relative to other plans.** SY-14 notes
   that plans creating new artifacts should ideally be born-compliant. But since
   SWS is 80-130 sessions, most other plans will complete long before
   born-compliant gates activate. This makes the synergy moot for practical
   purposes.

## Confidence Assessment

- HIGH claims: 16 (redundancy identification, synergy identification, file
  overlap verification, execution ordering)
- MEDIUM claims: 6 (effort savings estimates, SWS session savings, combined
  session opportunities)
- LOW claims: 1 (SWS per-ecosystem overlap precision)
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**
