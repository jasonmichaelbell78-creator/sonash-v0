# Findings: Cross-Plan File Overlap Map

**Searcher:** deep-research-searcher (cross-cutting analyst) **Profile:**
codebase **Date:** 2026-03-24 **Sub-Question IDs:** S-08 **Input Sources:** S-01
through S-07 findings, DIAGNOSIS.md, filesystem verification

---

## 1. File Overlap Matrix

Every file touched by 2+ plans. Plans abbreviated as:

- **RC** = repo-cleanup
- **SL** = custom-statusline
- **CLI** = cli-tools-implementation
- **PS** = passive-surfacing-remediation
- **PR** = propagation-research
- **AE** = agent-environment-analysis
- **SWS** = system-wide-standardization

### 1.1 Files Touched by 3+ Plans (CRITICAL SHARED RESOURCES)

| File Path                           | Plans                                                                                                                                                 | Change Types                       | Conflict Risk | Notes                                                                                                                                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/hooks/session-start.js`    | **CLI** (modify: add tool detection), **PS** (modify: fix 7 violations), **AE** (modify: token monitoring in 5.4)                                     | All MODIFY                         | **HIGH**      | 37KB file. Three plans add different logic. CLI adds tool-manifest reading. PS fixes passive surfacing violations. AE adds token monitoring hooks. All three are additive but touch the same large file. |
| `.husky/pre-commit`                 | **PS** (modify: fix 1 violation), **PR** (modify: add EXIT trap), **AE** (modify: agent-based triggers), **SWS** (modify: add CANON validation gates) | All MODIFY                         | **HIGH**      | Four plans modify this file. PS adds a `Fix:` command. PR adds EXIT trap for failure telemetry. AE adds agent-based code review triggers. SWS progressively adds CANON enforcement gates.                |
| `.husky/pre-push`                   | **PR** (modify: add EXIT trap), **AE** (modify: agent-based triggers), **SWS** (modify: add CANON validation gates)                                   | All MODIFY                         | **HIGH**      | Three plans modify. Same pattern as pre-commit but without PS.                                                                                                                                           |
| `CLAUDE.md`                         | **CLI** (modify: add Section 6b tool preferences), **AE** (modify: update Section 7 triggers), **SWS** (modify: referenced for standards throughout)  | All MODIFY                         | **MEDIUM**    | Different sections modified. CLI adds 6b, AE updates Section 7, SWS references it. Low merge conflict risk if sections are distinct, but file is ~200 lines and dense.                                   |
| `.claude/settings.json`             | **SL** (modify: update statusLine.command to Go binary), **CLI** (modify: add ntfy hook entry)                                                        | All MODIFY                         | **MEDIUM**    | Both add different JSON keys. SL changes `statusLine.command`, CLI adds a PostToolUse/session-end hook for ntfy. Additive to different properties.                                                       |
| `package.json`                      | **RC** (modify: remove 3 devDeps), **CLI** (modify: add tsgo devDep)                                                                                  | Both MODIFY                        | **LOW**       | RC removes deps, CLI adds one. Both additive to `devDependencies`. Standard merge.                                                                                                                       |
| `package-lock.json`                 | **RC** (regenerated), **CLI** (regenerated)                                                                                                           | Both MODIFY                        | **LOW**       | Auto-regenerated. Whoever runs second gets the correct state.                                                                                                                                            |
| `.claude/skills/alerts/SKILL.md`    | **PS** (evaluate, possibly modify via /skill-audit), **AE** (modify: add Agent Cost category), **SWS** (modify: formalize schemas in Step 11)         | MODIFY                             | **MEDIUM**    | PS evaluates it (Step 11), AE adds monitoring category, SWS formalizes it. Different concerns but same file.                                                                                             |
| `scripts/check-agent-compliance.js` | **PS** (modify: add `Fix:` command, Step 7), **AE** (modify: switch to --strict mode, Decision #27)                                                   | Both MODIFY                        | **MEDIUM**    | PS adds a Fix command to output. AE changes from advisory to strict enforcement. Different changes but same file.                                                                                        |
| `ROADMAP.md`                        | **SWS** (modify: add Track-CANON items after each ecosystem)                                                                                          | Single plan but touched frequently | **LOW**       | Only SWS modifies this, but if other plans touch it for session context, conflicts possible.                                                                                                             |

### 1.2 Files Touched by Exactly 2 Plans

| File Path                                         | Plans                                                                                                           | Change Types                                       | Conflict Risk | Notes                                                                                                                             |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/check-document-sync.js`                  | **PS** (modify: add Fix command, include file paths), **SWS** (modify: canonize in Step 5)                      | Both MODIFY                                        | **MEDIUM**    | PS adds a Fix command. SWS canonizes the entire script. If PS runs first, SWS absorbs its changes.                                |
| `.github/workflows/ci.yml`                        | **PR** (modify: remove continue-on-error, add gitleaks step)                                                    | Single plan, but 2 modifications in Steps 2 and 13 | **LOW**       | Only PR touches this. No conflict.                                                                                                |
| `.claude/skills/session-begin/SKILL.md`           | **PS** (modify: extend warning gate in Section 4.2), **SWS** (modify: formalize lifecycle in Step 7)            | Both MODIFY                                        | **MEDIUM**    | PS extends the gate mechanism. SWS formalizes session lifecycle. PS should run first to establish gate, then SWS standardizes it. |
| `.claude/skills/skill-audit/SKILL.md`             | **AE** (modify: agent-based verification in Phase 5), **SWS** (modify: canonize as primary mechanism in Step 2) | Both MODIFY                                        | **MEDIUM**    | AE adds agent verification. SWS canonizes the skill. AE before SWS preferred.                                                     |
| `.claude/skills/hook-ecosystem-audit/SKILL.md`    | **PS** (modify: add Passive Surfacing Compliance category), **PR** (modify: shared-lib extraction)              | Both MODIFY                                        | **MEDIUM**    | PS adds an audit category. PR extracts shared code to shared-lib. Different sections.                                             |
| `.claude/skills/script-ecosystem-audit/SKILL.md`  | **PS** (modify: add Passive Surfacing Compliance category), **PR** (modify: shared-lib extraction)              | Both MODIFY                                        | **MEDIUM**    | Same pattern as hook-ecosystem-audit.                                                                                             |
| `.claude/skills/session-ecosystem-audit/SKILL.md` | **PS** (modify: add Passive Surfacing Compliance category), **PR** (modify: shared-lib extraction)              | Both MODIFY                                        | **MEDIUM**    | Same pattern.                                                                                                                     |
| `.claude/skills/health-ecosystem-audit/SKILL.md`  | **PS** (modify: add Passive Surfacing Compliance category), **PR** (modify: shared-lib extraction)              | Both MODIFY                                        | **MEDIUM**    | Same pattern.                                                                                                                     |
| `.claude/skills/create-audit/SKILL.md`            | **AE** (modify: agent architecture recommendations), **SWS** (modify: referenced in Step 14)                    | Both MODIFY/Reference                              | **LOW**       | AE modifies; SWS references. Low conflict.                                                                                        |
| `.claude/skills/deep-plan/SKILL.md`               | **AE** (modify: agent delegation in execution routing)                                                          | Single plan                                        | N/A           | Listed for completeness. Only AE touches this.                                                                                    |
| `.claude/skills/convergence-loop/SKILL.md`        | **AE** (modify: add team-based verification)                                                                    | Single plan                                        | N/A           | Only AE.                                                                                                                          |
| `scripts/hook-report.js`                          | **AE** (modify: hook integration for agent triggers)                                                            | Single plan                                        | N/A           | Only AE.                                                                                                                          |
| `scripts/config/hook-checks.json`                 | **AE** (modify: new hook check entries)                                                                         | Single plan                                        | N/A           | Only AE.                                                                                                                          |
| `scripts/reviews/write-invocation.ts`             | **AE** (modify: updated invocation schema)                                                                      | Single plan                                        | N/A           | Only AE.                                                                                                                          |
| `scripts/debt/validate-schema.js`                 | **AE** (modify: add schema), **SWS** (modify: Zod schemas)                                                      | Both MODIFY                                        | **LOW**       | Both add schemas; additive.                                                                                                       |
| `docs/agent_docs/AGENT_ORCHESTRATION.md`          | **RC** (modify: update version reference)                                                                       | Single plan                                        | N/A           | Only RC.                                                                                                                          |
| `.claude/HOOKS.md`                                | **RC** (modify: add gsd-check-update.js entry)                                                                  | Single plan                                        | N/A           | Only RC.                                                                                                                          |
| `.claude/skills/SKILL_INDEX.md`                   | **RC** (modify: count correction)                                                                               | Single plan                                        | N/A           | Only RC.                                                                                                                          |
| `.claude/COMMAND_REFERENCE.md`                    | **RC** (modify: add 4 skills)                                                                                   | Single plan                                        | N/A           | Only RC.                                                                                                                          |
| `.claude/hooks/global/statusline.js`              | **SL** (delete)                                                                                                 | DELETE                                             | **LOW**       | Only SL deletes. Other plans don't reference it.                                                                                  |
| `knip.json`                                       | **RC** (modify: remove 2 suppressions)                                                                          | Single plan                                        | N/A           | Only RC.                                                                                                                          |
| `scripts/check-propagation.js`                    | **PR** (modify: Steps 5, 10, 12 -- baseline, scope expand, rule removal)                                        | Single plan, 3 mods                                | N/A           | Only PR, but heavily modified.                                                                                                    |
| `.husky/_shared.sh`                               | **PR** (modify: possibly add EXIT trap infrastructure)                                                          | Single plan                                        | N/A           | Only PR.                                                                                                                          |

### 1.3 Files with Delete-vs-Modify Conflicts

| File Path                                          | Deleting Plan            | Modifying Plan | Risk | Resolution                             |
| -------------------------------------------------- | ------------------------ | -------------- | ---- | -------------------------------------- |
| `.claude/hooks/global/statusline.js`               | **SL** (Step 12: delete) | None           | NONE | Safe delete. No other plan touches it. |
| `tests/hooks/global/statusline.test.ts`            | **SL** (Step 12: delete) | None           | NONE | Safe delete.                           |
| `dist-tests/tests/hooks/global/statusline.test.js` | **SL** (Step 12: delete) | None           | NONE | Safe delete.                           |
| `.claude/hooks/state-utils.js`                     | **RC** (Step 2: delete)  | None           | NONE | Safe delete. Orphan.                   |

No delete-vs-modify conflicts exist. All deletions target files that no other
plan touches.

---

## 2. Directory-Level Overlap

| Directory            | Plans                                                                                                                                                                                              | File Count Across Plans  | Merge Complexity                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `.claude/hooks/`     | RC (delete 1), SL (delete 1), PS (modify 7), AE (modify session-start), CLI (modify session-start)                                                                                                 | 9 distinct files         | **HIGH** -- PS modifies 7 hook files; CLI and AE both modify session-start.js                                 |
| `.claude/skills/`    | RC (modify 2: SKILL_INDEX, COMMAND_REFERENCE), PS (modify 5 skills), PR (modify 4+ ecosystem audit skills), AE (modify 7+ skills, create 1), SWS (modify 15+ skills)                               | 15+ distinct skill files | **HIGH** -- Dense overlap. SWS touches nearly all. PS and PR share 4 ecosystem audit skills.                  |
| `.husky/`            | PS (modify pre-commit), PR (modify pre-commit, pre-push, \_shared.sh), AE (modify pre-commit), SWS (modify pre-commit, pre-push)                                                                   | 3 files                  | **HIGH** -- pre-commit touched by 4 plans. pre-push by 3.                                                     |
| `scripts/`           | RC (modify 2 test files), PS (modify 6 scripts), PR (modify 55+ for sanitizeError, 34+ for readJsonl, plus specific scripts), AE (modify 2 scripts), SWS (modify 30+ debt scripts, 5+ doc scripts) | 80+ files potentially    | **HIGH** -- PR's mass refactoring of scripts/ is the dominant concern. SWS also plans broad scripts/ changes. |
| `scripts/debt/`      | PR (modify intake-audit.js + migrate 3 MASTER_DEBT writers), AE (modify validate-schema.js), SWS (modify all 30 debt scripts with Zod schemas)                                                     | 30 files                 | **HIGH** -- SWS plans to touch all 30. PR touches a few.                                                      |
| `scripts/lib/`       | PR (create sanitize-error.cjs, modify read-jsonl.js implied)                                                                                                                                       | 2-3 files                | **LOW** -- Only PR touches these.                                                                             |
| `.claude/agents/`    | AE (modify up to 37 agent files, delete unused stubs)                                                                                                                                              | 37 files                 | **LOW** -- Only AE touches agent definitions. SWS Step 13 formalizes but runs after AE.                       |
| `tool-configs/`      | CLI (create directory + 4 files)                                                                                                                                                                   | 4 new files              | **NONE** -- New directory, only CLI.                                                                          |
| `tools/statusline/`  | SL (create directory + 11 files)                                                                                                                                                                   | 11 new files             | **NONE** -- New directory, only SL.                                                                           |
| `.canon/`            | SWS (create entire directory tree)                                                                                                                                                                 | 20+ new files            | **NONE** -- New directory, only SWS.                                                                          |
| `docs/`              | RC (modify 3: TRIGGERS.md, SECURITY.md, AGENT_ORCHESTRATION.md), CLI (create CLI_USER_GUIDE.md), SWS (modify DOCUMENT_DEPENDENCIES.md, DOCUMENTATION_INDEX.md, and canonize doc scripts)           | 5+ files                 | **LOW** -- Different files within docs/.                                                                      |
| `config/`            | RC (modify rotation-policy.json)                                                                                                                                                                   | 1 file                   | **NONE** -- Only RC.                                                                                          |
| `.github/workflows/` | PR (modify ci.yml twice)                                                                                                                                                                           | 1 file                   | **NONE** -- Only PR.                                                                                          |
| `data/ecosystem-v2/` | RC (create archive/ subdir, move 2 files)                                                                                                                                                          | 3 files                  | **NONE** -- Only RC.                                                                                          |

---

## 3. Conflict Zones (CRITICAL)

### 3.1 HIGH Severity Conflicts

#### CONFLICT-H1: `.claude/hooks/session-start.js` (3 plans: CLI, PS, AE)

**Nature:** CLI adds tool-manifest reading and availability checking (~20-40
lines of new logic). PS fixes 7 passive surfacing violations (rewrites warning
messages, adds state file writes, removes wallpaper). AE adds token monitoring
hooks in Phase 5.

**Why HIGH:** This is a 37KB, 1077-line file. All three plans add different
logic to different parts of the file, but the file is dense and changes could
interact. PS changes message formatting throughout the file. CLI adds a new code
block. AE adds monitoring. Merge conflicts are likely if done out of order.

**Recommended sequence:** PS first (fixes existing violations -- stabilizes the
file), then CLI (adds new feature block -- discrete addition), then AE last
(Phase 5, adds monitoring that should observe the cleaned-up state).

**Merge protocol:** If parallel execution is needed, each plan should work on
separate code sections. PS touches lines 140-810 (existing warnings). CLI adds a
new section. AE adds monitoring hooks. A code-reviewer pass after each plan's
merge is mandatory.

---

#### CONFLICT-H2: `.husky/pre-commit` (4 plans: PS, PR, AE, SWS)

**Nature:** PS adds a `Fix:` command to one violation. PR adds EXIT trap for
hook failure telemetry. AE adds agent-based code review triggers. SWS
progressively adds CANON validation gates at Steps 1e, 3, and beyond.

**Why HIGH:** Four plans all modify the same shell script. Pre-commit hooks are
critical infrastructure -- a broken pre-commit blocks all commits.

**Recommended sequence:** PR first (EXIT trap is infrastructure-level, affects
telemetry), then PS (small targeted fix), then AE (adds conditional agent
triggers), then SWS (progressive additions, runs last because it adds cumulative
gates). SWS is naturally last due to its long timeline.

**Merge protocol:** Each plan should add its changes to a clearly demarcated
section of the pre-commit hook (PR: telemetry section; PS: output formatting;
AE: agent triggers section; SWS: CANON gates section). Test hook execution after
each merge.

---

#### CONFLICT-H3: `.husky/pre-push` (3 plans: PR, AE, SWS)

**Nature:** Same pattern as pre-commit but without PS. PR adds EXIT trap. AE
adds agent triggers. SWS adds CANON gates.

**Why HIGH:** Same infrastructure criticality as pre-commit.

**Recommended sequence:** PR first, then AE, then SWS.

---

#### CONFLICT-H4: `scripts/` directory mass-refactoring collision (PR vs SWS)

**Nature:** PR Step 6 modifies up to 55 files to replace inline `sanitizeError`
with imports. PR Step 7 modifies up to 34 files to replace inline `readJsonl`
with imports. SWS Steps 8-9 modify 30+ debt scripts and 88+ general scripts with
Zod schemas and standardization.

**Why HIGH:** The file sets overlap significantly. Many scripts in
`scripts/debt/` and `scripts/` will be touched by both plans. If PR runs first,
SWS operates on refactored code. If SWS runs first, PR's grep-based
identification of inline copies may find different patterns.

**Recommended sequence:** PR first. PR's refactoring consolidates duplicate
code, making SWS's standardization work cleaner. PR creates a more consistent
codebase for SWS to standardize.

**Merge protocol:** PR should complete Waves 1-2 (Steps 1-8, the refactoring
waves) before SWS enters Steps 8-9 (Scripts/TDMS). Given SWS's timeline (~80-130
sessions), PR will naturally complete long before SWS reaches Step 8.

---

### 3.2 MEDIUM Severity Conflicts

#### CONFLICT-M1: `CLAUDE.md` (3 plans: CLI, AE, SWS)

**Nature:** CLI adds Section 6b (tool preferences). AE updates Section 7 (agent
triggers). SWS references throughout but primarily as a standards source.

**Why MEDIUM:** Different sections. Low merge conflict risk, but CLAUDE.md is
the core agent instruction file. Concurrent modifications could create
inconsistencies.

**Recommended sequence:** CLI first (new section addition is non-destructive),
then AE (Section 7 update reflects actual agent state post-improvements), then
SWS (references finalized CLAUDE.md).

---

#### CONFLICT-M2: `.claude/settings.json` (2 plans: SL, CLI)

**Nature:** SL changes `statusLine.command`. CLI adds ntfy hook entries.

**Why MEDIUM:** Different JSON properties. Low merge conflict risk. But this is
the Claude Code configuration file -- errors here break the agent environment.

**Recommended sequence:** Either order works. SL modifies `statusLine.command`,
CLI adds hook entries. Both are additive to different properties.

---

#### CONFLICT-M3: 4 Ecosystem Audit Skills (2 plans: PS, PR)

Files: `.claude/skills/{hook,script,session,health}-ecosystem-audit/SKILL.md`

**Nature:** PS adds a "Passive Surfacing Compliance" audit category to each. PR
extracts shared code to a shared-lib directory (Step 8).

**Why MEDIUM:** PS adds content sections. PR restructures code imports.
Different concerns. PS's additions would survive PR's refactoring if PR
correctly moves shared code but preserves skill-specific categories.

**Recommended sequence:** PS first (adds category -- content change), then PR
(structural refactoring preserves the new category).

---

#### CONFLICT-M4: `scripts/check-agent-compliance.js` (2 plans: PS, AE)

**Nature:** PS adds a `Fix:` command to output. AE switches from advisory to
--strict mode.

**Why MEDIUM:** PS changes output formatting. AE changes execution behavior.
Both are compatible.

**Recommended sequence:** PS first (output formatting fix), then AE (behavioral
change to strict mode).

---

#### CONFLICT-M5: `.claude/skills/alerts/SKILL.md` (3 plans: PS, AE, SWS)

**Nature:** PS evaluates via /skill-audit (possibly modifies). AE adds Agent
Cost category. SWS formalizes schemas in Step 11.

**Why MEDIUM:** PS may or may not modify. AE adds a section. SWS standardizes
the whole skill.

**Recommended sequence:** PS first (evaluation may produce fixes), then AE (adds
category), then SWS (standardizes final state).

---

#### CONFLICT-M6: `.claude/skills/session-begin/SKILL.md` (2 plans: PS, SWS)

**Nature:** PS extends the warning gate (Section 4.2) to include 4 new flag
sources. SWS formalizes session lifecycle in Step 7.

**Why MEDIUM:** PS creates the enhanced gate mechanism. SWS standardizes it.

**Recommended sequence:** PS first (establishes the gate), then SWS
(standardizes the established pattern).

---

#### CONFLICT-M7: `scripts/check-document-sync.js` (2 plans: PS, SWS)

**Nature:** PS adds `Fix:` command and file path display. SWS canonizes the
script in Step 5.

**Why MEDIUM:** PS makes targeted output changes. SWS may rewrite more broadly.

**Recommended sequence:** PS first. SWS absorbs the improvements.

---

### 3.3 LOW Severity Conflicts

#### CONFLICT-L1: `package.json` / `package-lock.json` (2 plans: RC, CLI)

**Nature:** RC removes 3 devDeps. CLI adds 1 devDep (tsgo). Standard npm
operations.

**Recommended sequence:** Either order. RC first is slightly cleaner (removes
first, then CLI adds).

---

#### CONFLICT-L2: `scripts/debt/validate-schema.js` (2 plans: AE, SWS)

**Nature:** AE adds a Zod schema for agent frontmatter. SWS adds Zod schemas
broadly.

**Recommended sequence:** AE first (adds specific schema), SWS absorbs and
standardizes.

---

#### CONFLICT-L3: `.claude/skills/skill-audit/SKILL.md` (2 plans: AE, SWS)

**Nature:** AE adds agent-based verification in Phase 5. SWS canonizes as
primary mechanism in Step 2.

**Recommended sequence:** AE first (adds verification). SWS standardizes.

---

#### CONFLICT-L4: `.claude/skills/create-audit/SKILL.md` (2 plans: AE, SWS)

**Nature:** AE adds agent architecture recommendations. SWS references in
Step 14.

**Recommended sequence:** AE first. SWS references final state.

---

## 4. Isolation Zones

Files/directories touched by ONLY one plan -- safe for parallel execution.

### Fully Isolated Plans/Phases

| Plan    | Isolated Files/Directories                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                                                                                                                                                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SL**  | `tools/statusline/` (11 new files), `.claude/hooks/global/statusline.js` (delete), `tests/hooks/global/statusline.test.ts` (delete), `dist-tests/tests/hooks/global/statusline.test.js` (delete)                                                                                                                                                                                                                                                                                      | SL is almost entirely isolated. Only `.claude/settings.json` and `.gitignore` overlap with other plans. The `tools/statusline/` directory is brand new.                                                                                                       |
| **RC**  | `config/rotation-policy.json`, `knip.json`, `.claude/skills/SKILL_INDEX.md`, `.claude/COMMAND_REFERENCE.md`, `.claude/HOOKS.md`, `docs/TRIGGERS.md`, `docs/SECURITY.md`, `ARCHITECTURE.md`, `DEVELOPMENT.md`, `AI_WORKFLOW.md`, `data/ecosystem-v2/archive/` (new), `scripts/__tests__/wave6-alerts.test.js`, `scripts/__tests__/wave9-defense-depth.test.js`, all 7 delete targets                                                                                                   | 20+ isolated files. RC's overlap is limited to `package.json`, `docs/agent_docs/AGENT_ORCHESTRATION.md`.                                                                                                                                                      |
| **CLI** | `tool-configs/` (new, 4 files), `.claude/tool-manifest.json` (new), `scripts/setup-cli-tools.sh` (new), `scripts/install-cli-tools.sh` (new), `docs/CLI_USER_GUIDE.md` (new), `.oxlintrc.json`                                                                                                                                                                                                                                                                                        | Most CLI files are new creations. Overlaps: CLAUDE.md, session-start.js, settings.json, package.json.                                                                                                                                                         |
| **PS**  | `.claude/state/session-start-failures.json` (new), `.claude/state/context-warnings.json` (new), `.claude/hooks/post-write-validator.js`, `.claude/hooks/post-read-handler.js`, `.claude/hooks/user-prompt-handler.js`, `.claude/hooks/compact-restore.js`, `.claude/hooks/check-remote-session-context.js`, `.claude/hooks/decision-save-prompt.js`, `scripts/check-review-needed.js`, `scripts/log-override.js`, `scripts/check-backlog-health.js`, `scripts/append-hook-warning.js` | 12 isolated files. Most hook files are only touched by PS. Overlaps: session-start.js, pre-commit, session-begin skill, 4 ecosystem audit skills, alerts skill, check-agent-compliance.js, check-document-sync.js.                                            |
| **PR**  | `scripts/debt/intake-audit.js`, `scripts/lib/sanitize-error.cjs` (new), `known-propagation-baseline.json` (new), `.claude/skills/shared-lib/` (new), `scripts/check-propagation.js`, `scripts/check-propagation-staged.js`, `.github/workflows/ci.yml`, `scripts/generate-documentation-index.js`, `.husky/_shared.sh`                                                                                                                                                                | 9 isolated files. Mass refactoring (Steps 6-8) touches many files but those overlap with SWS. Overlaps: pre-commit, pre-push, 4 ecosystem audit skills, scripts/ mass changes.                                                                                |
| **AE**  | `.claude/agents/*.md` (37 files), `.claude/agents/global/*.md` (13 files), `.claude/skills/convergence-loop/SKILL.md`, `.claude/skills/deep-plan/SKILL.md`, `scripts/hook-report.js`, `scripts/config/hook-checks.json`, `scripts/reviews/write-invocation.ts`, `.claude/state/agent-token-usage.jsonl` (new), `.claude/skills/session-end/SKILL.md`, `.claude/skills/checkpoint/SKILL.md`                                                                                            | 50+ isolated agent files. AE has the widest footprint but most of it is agent definitions no other plan touches. Overlaps: CLAUDE.md, pre-commit, pre-push, session-start.js, alerts skill, skill-audit skill, check-agent-compliance.js, validate-schema.js. |
| **SWS** | `.canon/` (entire new directory, 20+ files), all per-ecosystem artifacts, `.claude/skills/SKILL_STANDARDS.md`, `DOCUMENTATION_INDEX.md`, `docs/DOCUMENT_DEPENDENCIES.md`, `jest.config.ts`, `scripts/check-roadmap-health.js`, `scripts/check-roadmap-hygiene.js`, `scripts/check-cross-doc-deps.js`, `scripts/check-doc-headers.js`, `scripts/check-doc-placement.js`                                                                                                                | Many isolated files, especially in `.canon/`. But SWS eventually touches nearly everything. Its overlaps are with every other plan.                                                                                                                           |

### Parallel Execution Safety Assessment

| Plan Pair | Can Run in Parallel?          | Blocking Conflicts                                                                                  |
| --------- | ----------------------------- | --------------------------------------------------------------------------------------------------- |
| RC + SL   | **YES**                       | No shared files                                                                                     |
| RC + CLI  | **MOSTLY**                    | `package.json` overlap (LOW risk)                                                                   |
| RC + PS   | **YES**                       | No shared files                                                                                     |
| RC + PR   | **YES**                       | No shared files                                                                                     |
| SL + CLI  | **MOSTLY**                    | `.claude/settings.json` overlap (MEDIUM, different keys)                                            |
| SL + PS   | **YES**                       | No shared files                                                                                     |
| SL + PR   | **YES**                       | No shared files                                                                                     |
| SL + AE   | **YES**                       | No shared files (statusline hook in 5.4 is a different file)                                        |
| CLI + PS  | **NO**                        | `session-start.js` (HIGH)                                                                           |
| CLI + AE  | **NO**                        | `session-start.js` (HIGH), `CLAUDE.md` (MEDIUM)                                                     |
| PS + PR   | **MOSTLY**                    | 4 ecosystem audit skills (MEDIUM), `.husky/pre-commit` (MEDIUM)                                     |
| PS + AE   | **NO**                        | `session-start.js` via AE 5.4 (HIGH), `check-agent-compliance.js` (MEDIUM), `alerts` skill (MEDIUM) |
| PR + AE   | **MOSTLY**                    | `.husky/pre-commit` and `.husky/pre-push` (MEDIUM)                                                  |
| PR + SWS  | **NO** (for Steps 8-9+)       | Mass scripts/ refactoring collision (HIGH)                                                          |
| AE + SWS  | **NO**                        | SWS Step 13 depends on AE completing. Memory note: "all 5 phases must complete before SWS Phase 1"  |
| Any + SWS | **MOSTLY YES for SWS Step 1** | SWS Step 1 (CANON) creates `.canon/` which is isolated. Conflicts emerge at SWS Steps 2+            |

---

## 5. Critical Shared Resources

### 5.1 Files Touched by 3+ Plans (VERIFIED)

| Rank | File                             | Plan Count | Plans           | Verified On Disk        |
| ---- | -------------------------------- | ---------- | --------------- | ----------------------- |
| 1    | `.husky/pre-commit`              | **4**      | PS, PR, AE, SWS | YES (34KB, 2026-03-19)  |
| 2    | `.claude/hooks/session-start.js` | **3**      | CLI, PS, AE     | YES (37KB, 2026-03-20)  |
| 3    | `.husky/pre-push`                | **3**      | PR, AE, SWS     | YES (32KB, 2026-03-19)  |
| 4    | `CLAUDE.md`                      | **3**      | CLI, AE, SWS    | YES (12KB, 2026-03-23)  |
| 5    | `.claude/skills/alerts/SKILL.md` | **3**      | PS, AE, SWS     | YES (8.7KB, 2026-03-19) |

### 5.2 Files Touched by 2 Plans (Significant Ones)

| Rank | File                                              | Plan Count | Plans   | Verified On Disk |
| ---- | ------------------------------------------------- | ---------- | ------- | ---------------- |
| 6    | `.claude/settings.json`                           | 2          | SL, CLI | YES (5.7KB)      |
| 7    | `package.json`                                    | 2          | RC, CLI | YES (12KB)       |
| 8    | `.claude/skills/session-begin/SKILL.md`           | 2          | PS, SWS | YES (8.9KB)      |
| 9    | `scripts/check-agent-compliance.js`               | 2          | PS, AE  | YES (5.9KB)      |
| 10   | `.claude/skills/hook-ecosystem-audit/SKILL.md`    | 2          | PS, PR  | YES (15.6KB)     |
| 11   | `.claude/skills/script-ecosystem-audit/SKILL.md`  | 2          | PS, PR  | YES (11.1KB)     |
| 12   | `.claude/skills/session-ecosystem-audit/SKILL.md` | 2          | PS, PR  | YES (18.3KB)     |
| 13   | `.claude/skills/health-ecosystem-audit/SKILL.md`  | 2          | PS, PR  | YES (8.6KB)      |
| 14   | `.claude/skills/skill-audit/SKILL.md`             | 2          | AE, SWS | YES (16.5KB)     |
| 15   | `scripts/check-document-sync.js`                  | 2          | PS, SWS | YES (14KB)       |
| 16   | `scripts/debt/validate-schema.js`                 | 2          | AE, SWS | YES (14.9KB)     |

### 5.3 Directories Touched by 3+ Plans

| Directory         | Plan Count | Plans               |
| ----------------- | ---------- | ------------------- |
| `.claude/hooks/`  | 5          | RC, SL, CLI, PS, AE |
| `.claude/skills/` | 5          | RC, PS, PR, AE, SWS |
| `.husky/`         | 4          | PS, PR, AE, SWS     |
| `scripts/`        | 5          | RC, PS, PR, AE, SWS |

---

## 6. Recommended Sequencing Based on File Overlaps

### Tier 1: Run First (No/Minimal Overlap Constraints)

| Plan                       | Rationale                                                                                                        | Can Parallel With     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------- |
| **RC** (repo-cleanup)      | Cleans orphans and updates stale docs. Only overlaps via `package.json` (LOW). Diagnosis says "should go first." | SL, PS, PR (all safe) |
| **SL** (custom-statusline) | Almost entirely isolated (`tools/statusline/` is new). Only settings.json overlap with CLI.                      | RC, PS, PR (all safe) |

### Tier 2: Run After Tier 1

| Plan                       | Rationale                                                                                                                                                          | Must Follow      | Can Parallel With                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------- |
| **PS** (passive-surfacing) | Fixes 33 violations in hooks/scripts. Should run before plans that add new features to those hooks (CLI, AE). Stabilizes session-start.js before others modify it. | Ideally after RC | PR (with care on ecosystem audit skills and pre-commit) |
| **PR** (propagation)       | Consolidates code patterns. Should run before SWS's mass standardization. EXIT trap in pre-commit should land before AE's triggers.                                | Ideally after RC | PS (with care), SL, RC                                  |

### Tier 3: Run After Tier 2

| Plan                           | Rationale                                                                                                                                                                                                            | Must Follow                                        | Can Parallel With                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| **CLI** (cli-tools)            | Modifies session-start.js (must follow PS's cleanup), CLAUDE.md (additive), settings.json.                                                                                                                           | PS (for session-start.js)                          | SL                                                    |
| **AE** (agent-env, Phases 4-5) | Widest modification footprint. Phase 5 modifies CLAUDE.md, pre-commit, pre-push, skills, session-start.js. Must follow PS (session-start.js), ideally follows PR (pre-commit/pre-push). Memory mandates: before SWS. | PS, PR (for hook files). Must complete before SWS. | CLI (if CLI completes session-start.js changes first) |

### Tier 4: Run Last

| Plan                                  | Rationale                                                                                                                                                                        | Must Follow                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **SWS** (system-wide-standardization) | Touches nearly everything. By design runs last (80-130 sessions). Benefits from all other plans completing first. Memory note: AE all 5 phases must complete before SWS Phase 1. | All other plans, especially AE. |

### Critical Sequencing Constraints (Hard Rules)

1. **AE must complete all 5 phases before SWS Phase 1** (memory note, confirmed
   in S-06)
2. **PS must complete before CLI modifies session-start.js** (CONFLICT-H1:
   stabilize first)
3. **PR must complete Waves 1-2 before SWS reaches Steps 8-9** (CONFLICT-H4:
   refactoring before standardization)
4. **PS must complete before AE Phase 5** (both touch session-start.js,
   check-agent-compliance.js, alerts skill)

---

## Convergence Loop Results

### CL-1: File Path Spot-Checks (15 verified)

| File Path                                      | Referenced In          | On Disk?     | Status  |
| ---------------------------------------------- | ---------------------- | ------------ | ------- |
| `.claude/hooks/session-start.js`               | S-03, S-04, S-06       | YES (37KB)   | CORRECT |
| `.husky/pre-commit`                            | S-04, S-05, S-06, S-07 | YES (34KB)   | CORRECT |
| `.husky/pre-push`                              | S-05, S-06, S-07       | YES (32KB)   | CORRECT |
| `CLAUDE.md`                                    | S-03, S-06, S-07       | YES (12KB)   | CORRECT |
| `.claude/settings.json`                        | S-02, S-03             | YES (5.7KB)  | CORRECT |
| `package.json`                                 | S-01, S-03             | YES (12KB)   | CORRECT |
| `.claude/skills/alerts/SKILL.md`               | S-04, S-06, S-07       | YES (8.7KB)  | CORRECT |
| `scripts/check-agent-compliance.js`            | S-04, S-06             | YES (5.9KB)  | CORRECT |
| `.claude/skills/session-begin/SKILL.md`        | S-04, S-07             | YES (8.9KB)  | CORRECT |
| `.claude/skills/hook-ecosystem-audit/SKILL.md` | S-04, S-05             | YES (15.6KB) | CORRECT |
| `.claude/hooks/global/statusline.js`           | S-02                   | YES (4.2KB)  | CORRECT |
| `.github/workflows/ci.yml`                     | S-05                   | YES (9.6KB)  | CORRECT |
| `scripts/check-propagation.js`                 | S-05                   | YES (18.4KB) | CORRECT |
| `scripts/debt/validate-schema.js`              | S-06, S-07             | YES (14.9KB) | CORRECT |
| `.husky/_shared.sh`                            | S-05                   | YES (10.6KB) | CORRECT |

**15/15 spot-checks pass.**

### CL-2: Complete Coverage Across All 7 Inventories

Cross-checked: My overlap matrix includes all files listed in all 7 findings
files. Verified by re-reading each findings file's "Files Modified" and
"External Touchpoints" sections.

**Files I initially missed and added during CL:**

- `.claude/skills/SKILL_STANDARDS.md` (SWS only -- moved to isolation list)
- `jest.config.ts` (SWS only -- moved to isolation list)
- `SESSION_CONTEXT.md` (SWS only -- moved to isolation list)
- `DOCUMENTATION_INDEX.md` (SWS only -- moved to isolation list)
- `docs/DOCUMENT_DEPENDENCIES.md` (SWS only -- moved to isolation list)
- `scripts/check-propagation-staged.js` (PR only -- was in S-05 as "likely",
  confirmed exists on disk)
- `.claude/hooks/session-start.sh` (SWS references this but only
  `.claude/hooks/session-start.js` exists -- likely a typo in SWS plan or refers
  to a future renaming. Flagged but not added as overlap.)

### CL-3: Single-Plan Files Appearing in Multiple Inventories

Re-checked all files I listed as "single-plan" against all 7 inventories:

- `scripts/hook-report.js` -- Listed as AE-only. Confirmed: not referenced in
  any other findings. CORRECT.
- `scripts/config/hook-checks.json` -- Listed as AE-only. Confirmed: not
  referenced in any other findings. CORRECT.
- `.oxlintrc.json` -- Listed as CLI-only. Confirmed. CORRECT.
- `config/rotation-policy.json` -- Listed as RC-only. Confirmed. CORRECT.
- `.github/workflows/ci.yml` -- Listed as PR-only. Confirmed. CORRECT.

### CL-4: External Touchpoints Cross-Check

Re-read each findings file's "External Touchpoints" section:

- S-01: All external touchpoints accounted for in matrix. RC's doc files are in
  isolation list.
- S-02: All accounted for. SL's settings.json overlap correctly flagged.
- S-03: All accounted for. CLI's session-start.js, settings.json, CLAUDE.md,
  package.json overlaps flagged.
- S-04: All accounted for. PS's massive hook file list split between overlap
  matrix and isolation zones.
- S-05: All accounted for. PR's mass-refactoring flagged as CONFLICT-H4 with
  SWS.
- S-06: All accounted for. AE's wide footprint captured. Session-start.js,
  pre-commit, pre-push, CLAUDE.md overlaps flagged.
- S-07: All accounted for. SWS overlaps with every plan correctly identified.
  `.canon/` is isolated (new directory).

**Correction applied during CL-4:** S-06 mentions AE modifies "Statusline hook"
for token monitoring in Step 5.4. S-06 says "Statusline hook (GSD statusline)"
which appears to reference a different statusline mechanism than the
`.claude/hooks/global/statusline.js` file that SL deletes. This could mean AE
touches the new Go binary's output or a different statusline data source. This
is NOT a conflict with SL because AE Step 5.4 runs after SL replaces the
statusline. However, if AE expects to modify a Node.js statusline hook that SL
has already deleted, that is a dependency: SL must complete before AE Phase 5.4.
Added to sequencing notes.

---

## Sources

| #   | Path                                                              | Type          | Trust   | Date       |
| --- | ----------------------------------------------------------------- | ------------- | ------- | ---------- |
| 1   | `.research/plan-orchestration/findings/S-01-repo-cleanup.md`      | Findings doc  | HIGH    | 2026-03-24 |
| 2   | `.research/plan-orchestration/findings/S-02-custom-statusline.md` | Findings doc  | HIGH    | 2026-03-24 |
| 3   | `.research/plan-orchestration/findings/S-03-cli-tools.md`         | Findings doc  | HIGH    | 2026-03-24 |
| 4   | `.research/plan-orchestration/findings/S-04-passive-surfacing.md` | Findings doc  | HIGH    | 2026-03-24 |
| 5   | `.research/plan-orchestration/findings/S-05-propagation.md`       | Findings doc  | HIGH    | 2026-03-24 |
| 6   | `.research/plan-orchestration/findings/S-06-agent-env.md`         | Findings doc  | HIGH    | 2026-03-24 |
| 7   | `.research/plan-orchestration/findings/S-07-sws.md`               | Findings doc  | HIGH    | 2026-03-24 |
| 8   | `.planning/plan-orchestration/DIAGNOSIS.md`                       | Diagnosis doc | HIGH    | 2026-03-23 |
| 9   | Filesystem verification (ls, Glob)                                | Ground truth  | HIGHEST | 2026-03-24 |

## Contradictions

1. **S-06 references "Statusline hook (GSD statusline)" in Step 5.4 token
   monitoring.** This could be the existing Node.js statusline that SL plans to
   delete and replace with a Go binary. If AE Phase 5.4 expects to modify the
   Node.js hook, it will find the file deleted. However, AE's intent is likely
   to add a widget data source to whatever statusline exists at execution time,
   which would be the Go binary by then. This is an ambiguity, not a hard
   conflict, but the sequencing implication is: SL should complete before AE
   Phase 5.

2. **SWS S-07 references `.claude/hooks/session-start.sh`** but only
   `session-start.js` exists on disk. This may be a plan typo or a future plan
   to convert to shell script. Not a conflict with other plans but worth
   flagging.

## Gaps

1. **Mass-refactoring file overlap precision.** PR's Steps 6-7 may touch up to
   55+34 files in `scripts/`. SWS Steps 8-9 touch 30+ debt scripts and 88+
   scripts. The exact overlap between these sets was not computed file-by-file.
   The finding is that the directories overlap; the exact file-level
   intersection requires running both plans' grep queries side by side.

2. **SWS progressive modifications.** SWS modifies `.husky/pre-commit` at "Steps
   1, 3, and progressively" -- the exact set of steps that touch pre-commit is
   not enumerated. This means the actual overlap count with pre-commit may be
   higher than stated.

3. **AE agent definition file list.** AE touches "up to 37 agent .md files" but
   the specific set depends on Phase 4 interactive decisions (which agents to
   improve vs. skip). The isolation analysis assumes all 37 are AE-only, which
   is true -- no other plan touches agent definitions.

## Serendipity

1. **SL (custom-statusline) is the most isolated plan.** It creates an entirely
   new directory (`tools/statusline/`), deletes files no other plan touches, and
   only overlaps on `.claude/settings.json` and `.gitignore`. It can run in
   parallel with nearly anything.

2. **SWS Step 1 (CANON) is also highly isolated.** Despite SWS being the most
   overlap-heavy plan overall, its first step creates the new `.canon/`
   directory. SWS Step 1 could technically begin in parallel with any other
   plan. Conflicts only emerge at SWS Steps 2+.

3. **The `.husky/pre-commit` file is the most contested resource** in the entire
   system -- touched by 4 of 7 plans. This file deserves a formal merge protocol
   or section-based ownership model.

4. **Five directories are each touched by 5 plans**: `.claude/hooks/`,
   `.claude/skills/`, `.husky/` (4 plans), `scripts/` (5 plans). These four
   directories are the coordination bottlenecks.

---

## Confidence Assessment

- HIGH claims: 16 (file overlap counts, existence verification, delete-vs-modify
  analysis, directory overlap)
- MEDIUM claims: 6 (conflict risk ratings, sequencing recommendations,
  mass-refactoring overlap scope)
- LOW claims: 1 (SWS progressive pre-commit modifications count)
- UNVERIFIED claims: 1 (AE Step 5.4 statusline hook target -- ambiguous
  reference)
- Overall confidence: **HIGH**
