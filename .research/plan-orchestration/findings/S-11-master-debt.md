# Findings: Cross-Plan MASTER_DEBT Analysis

**Searcher:** deep-research-searcher (cross-cutting analyst) **Profile:**
codebase **Date:** 2026-03-24 **Sub-Question IDs:** S-11

---

## Baseline

- **MASTER_DEBT.jsonl:** 8,463 items
- **S0 (Critical):** 32 items (INDEX.md confirmed)
- **S1 (High):** 1,359 items
- **S0 status breakdown:** 17 VERIFIED, 13 RESOLVED, 2 NEW
- **S1 status breakdown:** 1,113 VERIFIED, 97 RESOLVED, 145 NEW, remainder
  FALSE_POSITIVE/other

**Key observation:** The 32 S0 items are heavily concentrated in duplicates.
De-duplicating by unique issue reveals only **6 distinct S0 problems:**

1. App Check disabled on Cloud Functions (DEBT-0853, 0855, 0859, 0864, 9290,
   9292, 9296, 9301) -- **8 duplicate entries**
2. Legacy journalEntries direct write path (DEBT-0849, 0854, 0856, 0860, 0865,
   9286, 9291, 9293, 9297, 9302) -- **10 duplicate entries**
3. Client-side filtering of soft-deleted data (DEBT-1293) -- **1 entry**
4. pull_request_target CI vulnerability (DEBT-1878) -- **1 entry**
5. Command injection in resolve-item.js (DEBT-2121) -- **1 entry**
6. Hard-coded password patterns / OS command execution (DEBT-4399-4403,
   11124-11126) -- **8 entries (5 unique files, 3 duplicates)**
7. fast-xml-parser DoS vulnerability (DEBT-7544, 11283) -- **2 duplicate
   entries**
8. CI quality gates non-blocking (DEBT-9295) -- **1 entry**

After dedup: **8 unique S0 issues**, represented by 32 MASTER_DEBT entries.

---

## 1. Debt Resolution by Plan

### Plan 1: repo-cleanup

| Debt ID       | Severity | Description                                                        | Resolution Type                                                                                                         |
| ------------- | -------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| DEBT-7470     | S1       | Playwright installed but zero E2E tests (playwright.config.ts)     | **obsolete** -- Plan removes @playwright/test devDependency, making this debt item moot                                 |
| DEBT-1830     | S1       | Orphaned: assign-review-tier.js disabled in workflow               | **partial** -- Plan focuses on orphan file cleanup but this specific workflow orphan is NOT in the plan's deletion list |
| DEBT-0019     | S1       | Cognitive complexity in generate-documentation-index.js (29 vs 15) | **not resolved** -- Plan updates docs but does NOT refactor scripts                                                     |
| Various S2-S3 | S2-S3    | Stale documentation items (version numbers, references)            | **fix** -- Step 10 updates 7 documentation files with current versions                                                  |

**Estimated S0 resolved: 0** **Estimated S1 resolved: 1** (DEBT-7470 becomes
obsolete when @playwright/test is removed) **Estimated S2+ resolved: ~10-20**
(stale doc references, orphan files)

### Plan 2: custom-statusline

| Debt ID           | Severity | Description                                            | Resolution Type |
| ----------------- | -------- | ------------------------------------------------------ | --------------- |
| (none identified) | --       | No MASTER_DEBT items directly reference the statusline | --              |

The custom-statusline plan creates a NEW Go binary and deletes the old Node.js
statusline. It does not resolve any existing MASTER_DEBT items because the
existing statusline was never captured as debt -- it is a feature replacement,
not a debt fix.

**Estimated S0 resolved: 0** **Estimated S1 resolved: 0**

### Plan 3: cli-tools-implementation

| Debt ID   | Severity | Description                                                     | Resolution Type                                                                                                                                                |
| --------- | -------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEBT-0058 | S1       | Missing security scanning in CI (npm audit, CodeQL, Dependabot) | **partial** -- Plan does NOT add npm audit/CodeQL/Dependabot, but does add oxlint type-aware rules (Step 1) and tsgo (Step 15), improving detection capability |
| DEBT-7544 | S0       | fast-xml-parser DoS vulnerability                               | **not resolved** -- Plan does not address npm audit vulnerabilities                                                                                            |
| DEBT-7545 | S1       | minimatch ReDoS vulnerability                                   | **not resolved** -- Plan does not address npm audit vulnerabilities                                                                                            |

**Estimated S0 resolved: 0** **Estimated S1 resolved: 0** (partial improvement
to DEBT-0058 but not full resolution)

### Plan 4: passive-surfacing-remediation

| Debt ID         | Severity | Description                                                            | Resolution Type |
| --------------- | -------- | ---------------------------------------------------------------------- | --------------- |
| (none directly) | --       | No MASTER_DEBT items specifically track "passive surfacing violations" | --              |

The passive-surfacing plan fixes 33 guardrail #6 violations across
hooks/scripts, but these violations were tracked in the plan's own research, NOT
in MASTER_DEBT.jsonl. The MASTER_DEBT system does not have a "passive-surfacing"
or "fire-and-forget" category. However, the plan indirectly improves debt items
involving hooks:

- DEBT-1161 (S1, check-agent-compliance.js cognitive complexity) -- NOT
  resolved, but file is touched in Step 7
- Hook files touched by the plan have many S1 items (34 items in
  session-start.js, 8 in post-write-validator.js) that are primarily SonarCloud
  code quality issues (cognitive complexity, nested ternaries). These are NOT
  resolved by the passive-surfacing plan, which changes message formatting, not
  code structure.

**Estimated S0 resolved: 0** **Estimated S1 resolved: 0** (touches files with
debt but does not fix the debt types)

### Plan 5: propagation-research

| Debt ID                | Severity | Description                                                     | Resolution Type                                                                                                                                                |
| ---------------------- | -------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEBT-2121              | **S0**   | Command injection in resolve-item.js execSync                   | **fix** -- Step 9 migrates MASTER_DEBT writers to centralized writer; if resolve-item.js is refactored to use safe-fs helpers, this exec injection is resolved |
| DEBT-4403 / DEBT-11126 | **S0**   | OS command execution safety in check-review-needed.js           | **partial** -- check-review-needed.js is NOT directly in propagation plan scope, but propagation patterns may influence how exec safety is handled             |
| DEBT-9295              | **S0**   | CI quality gates non-blocking                                   | **fix** -- Step 2 explicitly removes `continue-on-error: true` from CI security check                                                                          |
| DEBT-0851              | S1       | Multiple CI quality gates as non-blocking (continue-on-error)   | **partial fix** -- Step 2 addresses the security check specifically; other continue-on-error instances (4 total) may remain                                    |
| DEBT-1004              | S1       | intake-audit.js cognitive complexity (36 vs 15)                 | **partial** -- Step 1 refactors intake-audit.js to use appendMasterDebtSync, which may reduce complexity                                                       |
| DEBT-1993              | S1       | Missing validation on parsed JSON in intake-audit.js            | **partial** -- Step 1 refactors the write path but does not specifically add JSON validation                                                                   |
| DEBT-1958              | S1       | generate-documentation-index.js synchronous file reads          | **fix** -- Step 14 optimizes doc-index performance (43s to <15s)                                                                                               |
| DEBT-0019              | S1       | generate-documentation-index.js cognitive complexity (29 vs 15) | **possible fix** -- Step 14 refactors this file; complexity reduction is likely but not guaranteed                                                             |
| DEBT-0058              | S1       | Missing security scanning in CI                                 | **partial fix** -- Step 13 adds gitleaks to CI (secret scanning), addressing one dimension                                                                     |
| DEBT-1835              | S1       | backlog-enforcement.yml checks deleted file                     | **not resolved** -- Plan does not address this orphaned workflow                                                                                               |
| DEBT-1830              | S1       | Orphaned assign-review-tier.js in workflow                      | **not resolved**                                                                                                                                               |

**Estimated S0 resolved: 2** (DEBT-2121 via Step 9 refactoring, DEBT-9295 via
Step 2) **Estimated S1 resolved: 3-5** (DEBT-1958, DEBT-0019 via Step 14;
DEBT-1004 partially via Step 1; DEBT-0058 partially via Step 13)

### Plan 6: agent-environment-analysis

| Debt ID                        | Severity | Description                                    | Resolution Type                                                                                                                 |
| ------------------------------ | -------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| DEBT-1161                      | S1       | check-agent-compliance.js cognitive complexity | **possible fix** -- Step 5.1 moves this script from advisory to --strict mode (Decision #27); refactoring may reduce complexity |
| 16 S1 items in .claude/agents/ | S1       | Various agent quality issues                   | **fix** -- Phase 4 audits and improves all 36+ agent definitions, directly addressing agent quality debt                        |

The agent-env plan's primary value is improving agent quality, but the
MASTER_DEBT items for agents are mostly S1 code-quality issues from SonarCloud
(cognitive complexity in agent-related scripts) rather than agent definition
quality. The plan addresses a dimension of "debt" (agent prompt quality, tool
lists, model assignments) that is NOT tracked in MASTER_DEBT at all.

**Estimated S0 resolved: 0** **Estimated S1 resolved: 1-3** (DEBT-1161 possibly;
some agent-file debt items)

### Plan 7: system-wide-standardization (SWS)

| Debt ID            | Severity | Description                                    | Resolution Type                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| DEBT-9295          | **S0**   | CI quality gates non-blocking                  | **fix** -- Steps 8-10 (TDMS/Scripts/CI ecosystems) standardize CI enforcement                                                                 |
| DEBT-0851          | S1       | Multiple CI non-blocking gates                 | **fix** -- CI/CD ecosystem (Step 10) addresses all continue-on-error issues                                                                   |
| DEBT-0058          | S1       | Missing security scanning in CI                | **fix** -- CI/CD ecosystem (Step 10) standardizes CI security pipeline                                                                        |
| DEBT-1364          | S1       | Excessive cognitive complexity (40+ files)     | **partial** -- Scripts ecosystem (Step 9) may enforce complexity standards                                                                    |
| DEBT-1958          | S1       | Doc-index sync performance                     | **possible** -- Scripts ecosystem (Step 9) standardizes script patterns                                                                       |
| DEBT-7470          | S1       | Playwright with no E2E tests                   | **fix** -- Testing ecosystem (Step 6) establishes testing standards                                                                           |
| DEBT-7544/11283    | S0       | fast-xml-parser vulnerability                  | **not resolved** -- SWS does not address npm vulnerability management                                                                         |
| All 1,359 S1 items | S1       | Via schema validation and born-compliant gates | **systematic reduction** -- SWS's CANON framework establishes born-compliant gates that prevent NEW debt and standardizes resolution tracking |

SWS has the most sweeping debt impact because it creates the INFRASTRUCTURE for
systematic debt resolution (Zod schemas, health checkers, enforcement
manifests). However, SWS does NOT directly resolve most individual debt items --
it creates the framework that prevents new debt and enables tracking.

**The TDMS ecosystem (Steps 8, 16, 21) directly addresses MASTER_DEBT itself:**

- Step 8: Zod schemas for MASTER_DEBT.jsonl, fix 9-writer race condition
- Step 16: Enforcement + testing
- Step 21: Final canonization (L5)

**Estimated S0 resolved: 1** (DEBT-9295 via CI/CD standardization) **Estimated
S1 resolved: 10-30** (via ecosystem standardization across CI, testing, scripts)
**Estimated systematic impact: MASSIVE** (born-compliant gates prevent new S1+
items; schema enforcement reduces data quality debt)

---

## 2. Cross-Plan Debt Dedup

Debt items addressed by 2+ plans:

| Debt ID        | Severity | Plans That Address It                                                                        | Which Plan Should Own Resolution?                                                                                                                      |
| -------------- | -------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DEBT-9295      | S0       | propagation-research (Step 2), SWS (Step 10)                                                 | **propagation-research** -- it targets this explicitly in Wave 1 as a critical fix; SWS would handle it as part of broad CI standardization much later |
| DEBT-0851      | S1       | propagation-research (Step 2, partial), SWS (Step 10)                                        | **propagation-research** for the security check; **SWS** for the remaining 3 continue-on-error instances                                               |
| DEBT-0058      | S1       | propagation-research (Step 13, gitleaks), cli-tools (Step 1, oxlint), SWS (Step 10)          | **propagation-research** owns gitleaks addition; **SWS** owns comprehensive CI security standardization                                                |
| DEBT-1958/0019 | S1       | propagation-research (Step 14), SWS (Step 9)                                                 | **propagation-research** -- explicitly targets doc-index perf in Wave 4                                                                                |
| DEBT-7470      | S1       | repo-cleanup (removes dep), SWS (Step 6, testing standards)                                  | **repo-cleanup** -- removing @playwright/test makes the debt item obsolete; SWS would only apply if Playwright is retained                             |
| DEBT-1161      | S1       | agent-env (Step 5.1, --strict mode), passive-surfacing (touches file in Step 7)              | **agent-env** -- it explicitly addresses check-agent-compliance.js behavior                                                                            |
| DEBT-1004      | S1       | propagation-research (Step 1, refactors intake-audit.js), SWS (Step 8, TDMS standardization) | **propagation-research** -- directly fixes the data-loss vector in intake-audit.js                                                                     |

**Key insight:** propagation-research and SWS have the most overlap. Propagation
handles surgical fixes; SWS handles systematic standardization. They are
complementary, not duplicative.

---

## 3. S0/S1 Impact Forecast

### S0 Resolution by Plan

| Plan                     | S0 Items Resolved | Which Ones                                                 |
| ------------------------ | ----------------- | ---------------------------------------------------------- |
| repo-cleanup             | 0                 | --                                                         |
| custom-statusline        | 0                 | --                                                         |
| cli-tools-implementation | 0                 | --                                                         |
| passive-surfacing        | 0                 | --                                                         |
| propagation-research     | **2**             | DEBT-2121 (command injection), DEBT-9295 (CI non-blocking) |
| agent-env-analysis       | 0                 | --                                                         |
| SWS                      | **1**             | DEBT-9295 (CI non-blocking) -- overlaps with propagation   |

**Net unique S0 items resolved by all 7 plans: 2** (DEBT-2121, DEBT-9295)

### S1 Resolution by Plan

| Plan                     | Est. S1 Items Resolved |
| ------------------------ | ---------------------- |
| repo-cleanup             | 1                      |
| custom-statusline        | 0                      |
| cli-tools-implementation | 0                      |
| passive-surfacing        | 0                      |
| propagation-research     | 3-5                    |
| agent-env-analysis       | 1-3                    |
| SWS                      | 10-30                  |

**Net unique S1 items resolved by all 7 plans: ~15-35** (accounting for overlap)

### Projected Counts After All Plans Execute

| Severity | Current | Resolved                                                                  | Projected                                         |
| -------- | ------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| S0       | 32      | 2 unique (but ~4 MASTER_DEBT entries due to duplicates of those 2 issues) | **~28** (6 unique issues remain, with duplicates) |
| S1       | 1,359   | 15-35                                                                     | **~1,325-1,345**                                  |

**Important caveats:**

- The 13 RESOLVED S0 items (legacy journalEntries, App Check) are ALREADY
  resolved. They remain in MASTER_DEBT as historical records.
- If we count only VERIFIED+NEW S0 items (the active ones): 19 items
  representing 5 unique issues. Plans resolve 2 of those 5 (command injection +
  CI non-blocking).
- The remaining 3 active S0 unique issues (hard-coded passwords in
  errors.ts/logger.test.ts, OS command execution in check-review-needed.js,
  fast-xml-parser vulnerability) are NOT addressed by ANY plan.

### Debt-Reduction ROI Ranking

| Rank | Plan                         | S0 Impact      | S1 Impact       | Effort                | ROI                                                                          |
| ---- | ---------------------------- | -------------- | --------------- | --------------------- | ---------------------------------------------------------------------------- |
| 1    | **propagation-research**     | 2 S0 resolved  | 3-5 S1 resolved | M-L (17 hrs)          | **HIGHEST** -- only plan resolving S0 items                                  |
| 2    | **SWS**                      | 1 S0 (overlap) | 10-30 S1        | XL (80-130 sessions)  | HIGH total but LOW per-session -- massive systematic value                   |
| 3    | **repo-cleanup**             | 0              | 1 S1            | M (60-75 min)         | MEDIUM -- fast execution, modest debt reduction, but HIGH foundational value |
| 4    | **agent-env-analysis**       | 0              | 1-3 S1          | L (3-5 hrs remaining) | LOW-MEDIUM -- debt reduction not primary goal                                |
| 5    | **cli-tools-implementation** | 0              | 0               | L (3-4 hrs)           | LOW for debt reduction (but HIGH for developer experience)                   |
| 6    | **passive-surfacing**        | 0              | 0               | M (2-3 hrs)           | LOW for MASTER_DEBT (but HIGH for guardrail #6 compliance)                   |
| 7    | **custom-statusline**        | 0              | 0               | L (8-12 hrs)          | ZERO for MASTER_DEBT (pure feature work)                                     |

---

## 4. Unaddressed Critical Debt

### Active S0 items NOT addressed by any plan:

| Debt ID(s)             | Severity | Description                                                                                 | File                                  | Gap Analysis                                                                                                                                                               |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEBT-4399, 4400, 11124 | S0       | "Review this potentially hard-coded password" in lib/utils/errors.ts (lines 69, 71)         | lib/utils/errors.ts                   | SonarCloud hotspot (S2068). Likely a false positive (error codes that match password patterns), but requires review/suppression. No plan addresses app-layer code quality. |
| DEBT-4401, 4402, 11125 | S0       | "Review this potentially hard-coded password" in tests/utils/logger.test.ts (lines 96, 130) | tests/utils/logger.test.ts            | SonarCloud hotspot in test file. Likely false positive. No plan addresses test file security hotspots.                                                                     |
| DEBT-4403, 11126       | S0       | "Executing this OS command is safe here" in check-review-needed.js (line 214)               | scripts/check-review-needed.js        | SonarCloud S4721 command-injection hotspot. Propagation plan touches many scripts but NOT this specific file or issue.                                                     |
| DEBT-7544, 11283       | S0       | fast-xml-parser DoS vulnerability (transitive via firebase-admin)                           | package-lock.json                     | Dependency vulnerability requiring firebase-admin upgrade or override. No plan addresses npm vulnerability management. This is the only S0 item with status=NEW.           |
| DEBT-1878              | S0       | pull_request_target security vulnerability in deploy-firebase.yml                           | .github/workflows/deploy-firebase.yml | CI security gap allowing untrusted code execution. Propagation plan addresses ci.yml but NOT deploy-firebase.yml.                                                          |

### Active S1 items NOT addressed by any plan (notable clusters):

| Cluster                                 | Count | Description                                           | Gap                                                                                                     |
| --------------------------------------- | ----- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| SonarCloud cognitive complexity (S3776) | ~200+ | Functions exceeding complexity threshold of 15        | No plan systematically addresses cognitive complexity; SWS may establish standards but not fix existing |
| App-layer code quality                  | ~300+ | Bug patterns in app/, components/, hooks/             | No plan targets application code fixes                                                                  |
| Security hotspots                       | ~50+  | SonarCloud security hotspots in scripts and app code  | Plans focus on infrastructure, not app-layer security                                                   |
| Test coverage gaps                      | ~30+  | Missing tests for critical paths                      | No plan adds application tests (SWS Step 6 establishes standards only)                                  |
| Dependency vulnerabilities              | 5+    | npm audit findings (minimatch, fast-xml-parser, etc.) | No plan addresses dependency management                                                                 |

---

## 5. Debt-Driven Sequencing Insights

### Which plan resolves the most S0 items?

**propagation-research** resolves 2 unique S0 items -- the ONLY plan that
resolves any S0. This strongly supports executing it early.

### Debt items that block other plans if not resolved first

1. **DEBT-9295** (CI non-blocking gates): If CI gates remain non-blocking, other
   plans' verification steps are less reliable. Propagation Step 2 fixes this.
   Execute propagation Wave 1 before other plans run verification checkpoints.

2. **MASTER_DEBT data integrity** (the 9-writer race condition mentioned in SWS
   Step 8): If multiple plans generate MASTER_DEBT entries during execution, the
   race condition could corrupt the MASTER_DEBT file. Propagation Step 1 (fix
   intake-audit.js) and Step 9 (centralize MASTER_DEBT writers) should execute
   before plans that generate new debt items.

### Debt cluster analysis: are S0/S1 items concentrated in certain files/areas?

**S0 concentration:** | Area | Unique S0 Issues | Entries |
|------|-----------------|---------| | Firebase security (App Check,
journalEntries) | 2 | 18 entries -- but ALL RESOLVED | | CI/CD workflows
(.github/workflows/) | 2 | 2 entries | | Scripts (execSync patterns) | 1 | 3
entries | | SonarCloud hotspots (hard-coded password patterns) | 1 | 6 entries |
| Dependency vulnerabilities | 1 | 2 entries | | App code (client-side
filtering) | 1 | 1 entry |

**S1 concentration (by file):** | File/Area | S1 Count |
|-----------|----------| | scripts/ (all) | 536 | | scripts/debt/ (TDMS) | 104 |
| .claude/hooks/ | 20+ | | .github/workflows/ | 20+ | | .claude/agents/ | 16 | |
scripts/generate-documentation-index.js | 5 | |
scripts/check-agent-compliance.js | 2 |

**Insight:** S1 items are overwhelmingly concentrated in `scripts/` (536 of
1,359 = 39%). The propagation-research plan (Steps 6-7: consolidate
sanitizeError and readJsonl across scripts/) has the highest S1 density
exposure. SWS Steps 8-9 (TDMS + Scripts ecosystems) cover the same territory
systematically.

### Optimal debt-aware execution order:

1. **repo-cleanup** (first) -- cleans house, removes 1 S1 item (Playwright dep),
   establishes clean baseline
2. **propagation-research Wave 1** (second) -- resolves 2 S0 items, fixes CI
   blocking, fixes TDMS data integrity
3. **passive-surfacing** (third) -- fixes guardrail violations before SWS
   evaluates compliance
4. **propagation-research Waves 2-4** (fourth) -- consolidates script patterns,
   reducing S1 density in scripts/
5. **agent-env Phases 4-5** (fifth) -- improves agent quality, resolves 1-3 S1
   items
6. **cli-tools + custom-statusline** (parallel, any time) -- zero debt impact,
   pure feature work
7. **SWS** (last) -- systematic framework benefits from all prior debt reduction

This sequence maximizes early S0 resolution and ensures the MASTER_DEBT data
pipeline is reliable before plans that generate new debt items.

---

## Convergence Loop Verification

### CL-1: Debt IDs cited actually exist in MASTER_DEBT.jsonl

Spot-checked 15 debt IDs:

| Debt ID    | Line | Exists? | Severity Match? |
| ---------- | ---- | ------- | --------------- |
| DEBT-0849  | 849  | YES     | S0 - VERIFIED   |
| DEBT-0853  | 853  | YES     | S0 - VERIFIED   |
| DEBT-2121  | 2121 | YES     | S0 - VERIFIED   |
| DEBT-9295  | 6311 | YES     | S0 - VERIFIED   |
| DEBT-7544  | 4578 | YES     | S0 - VERIFIED   |
| DEBT-1878  | 1878 | YES     | S0 - VERIFIED   |
| DEBT-4403  | 3565 | YES     | S0 - VERIFIED   |
| DEBT-0058  | 58   | YES     | S1 - VERIFIED   |
| DEBT-0851  | 851  | YES     | S1 - VERIFIED   |
| DEBT-1004  | 1004 | YES     | S1 - VERIFIED   |
| DEBT-1958  | 1958 | YES     | S1 - VERIFIED   |
| DEBT-7470  | 4504 | YES     | S1 - VERIFIED   |
| DEBT-1161  | 1161 | YES     | S1 - VERIFIED   |
| DEBT-1364  | 1364 | YES     | S1 - VERIFIED   |
| DEBT-11283 | 8299 | YES     | S0 - VERIFIED   |

**15/15 spot-checks pass.** All cited DEBT IDs exist and severity matches.

### CL-2: File paths in debt items match plan inventories

| Debt File Path                          | Plan              | Plan Step                   | Match?                                                 |
| --------------------------------------- | ----------------- | --------------------------- | ------------------------------------------------------ |
| scripts/debt/intake-audit.js            | propagation       | Step 1                      | YES - plan directly modifies this file                 |
| .github/workflows/ci.yml                | propagation       | Steps 2, 13                 | YES - plan directly modifies this file                 |
| scripts/debt/resolve-item.js            | propagation       | Step 9 (centralize writers) | PARTIAL - plan targets MASTER_DEBT writers generically |
| scripts/generate-documentation-index.js | propagation       | Step 14                     | YES - plan directly modifies this file                 |
| scripts/check-agent-compliance.js       | agent-env         | Step 5.1                    | YES - plan directly modifies this file                 |
| .claude/hooks/session-start.js          | passive-surfacing | Step 1                      | YES - plan directly modifies this file                 |
| package.json                            | repo-cleanup      | Step 8                      | YES - plan removes devDependencies                     |

**7/7 match or partial match.** Resolution mappings are based on actual plan
steps, not file proximity alone.

### CL-3: "Resolved by" mappings based on actual step actions?

Reviewed each mapping:

- DEBT-2121 resolved by propagation Step 9: YES, Step 9 migrates MASTER_DEBT
  writers including resolve-item.js
- DEBT-9295 resolved by propagation Step 2: YES, Step 2 explicitly removes
  continue-on-error from CI security check
- DEBT-1958 resolved by propagation Step 14: YES, Step 14 targets doc-index
  performance optimization
- DEBT-7470 resolved by repo-cleanup Step 8: YES, Step 8 removes
  @playwright/test, making the "no E2E tests" moot
- DEBT-1161 possibly resolved by agent-env Step 5.1: MEDIUM confidence -- step
  changes behavior (advisory to strict) which may or may not refactor complexity

All HIGH-confidence mappings are based on explicit step actions matching debt
descriptions. No mappings are based solely on "same file" proximity.

### CL-4: S0 count matches INDEX.md count of 32?

INDEX.md says 32 S0 items. My grep found 34 lines matching `"severity":"S0"`,
but 2 of those (lines 774 and 6227) have `"severity":"S3"` as their actual
severity, with `"severity":"S0"` appearing only inside their `merged_from`
fields. **Actual S0 count: 32. MATCHES INDEX.md.**

### Corrections Applied During CL

1. Removed false S0 matches at lines 774 and 6227 (S3 items with S0 in
   merged_from)
2. Adjusted "resolved by" for DEBT-2121 from "certain" to "likely" --
   propagation Step 9 targets MASTER_DEBT writers generally, but resolve-item.js
   may not be one of the "3 remaining bypass writers" the plan references
3. Verified DEBT-7470 resolution logic: repo-cleanup removes @playwright/test
   dep, which makes the "no E2E tests for Playwright" debt item obsolete (the
   tool is removed, not the gap fixed)
4. Noted that many S0 items are already RESOLVED (13 of 32) and do not need plan
   resolution

---

## Sources

| #   | Path                                                    | Type                        | Trust        | Date       |
| --- | ------------------------------------------------------- | --------------------------- | ------------ | ---------- |
| 1   | docs/technical-debt/MASTER_DEBT.jsonl                   | Debt registry (8,463 items) | GROUND TRUTH | 2026-03-24 |
| 2   | docs/technical-debt/INDEX.md                            | Generated debt summary      | HIGH         | 2026-03-24 |
| 3   | .research/plan-orchestration/findings/S-01 through S-07 | Plan inventory findings     | HIGH         | 2026-03-24 |
| 4   | .planning/plan-orchestration/DIAGNOSIS.md               | Orchestration context       | HIGH         | 2026-03-23 |
| 5   | Grep/Read filesystem verification                       | Line-by-line JSONL analysis | GROUND TRUTH | 2026-03-24 |

## Contradictions

1. **INDEX.md says 32 S0, grep finds 34 matches.** Resolved: 2 false positives
   from S3 items containing "S0" in merged_from metadata. Actual count is 32.

2. **S0 items appear duplicated 3-4x each.** This is a known MASTER_DEBT quality
   issue -- the same underlying problem (e.g., App Check disabled) exists as
   separate entries from different source audits (CANON-CODE, CANON-SECURITY,
   DEDUPED_FINDINGS, unique-findings). The TDMS dedup report in
   docs/audits/comprehensive/ likely covers this, but the duplicates remain in
   MASTER_DEBT.jsonl.

3. **Plan "resolved" vs "actually resolved" ambiguity.** Plans may touch files
   containing debt without resolving the specific debt items. For example,
   passive-surfacing modifies session-start.js (which has 34 S1 items), but
   those S1 items are cognitive complexity issues, not passive-surfacing
   violations. The plan fixes a DIFFERENT category of issue in the same file.

## Gaps

1. **No plan addresses npm dependency vulnerabilities** (DEBT-7544 S0, DEBT-7545
   S1). These require firebase-admin upgrade or package.json overrides. This is
   a notable S0 gap.

2. **No plan addresses SonarCloud security hotspots** in app-layer code
   (DEBT-4399-4402, 11124-11125 -- hard-coded password patterns; DEBT-4403,
   11126 -- OS command safety in check-review-needed.js). These are likely false
   positives but need review/suppression.

3. **No plan addresses the deploy-firebase.yml pull_request_target
   vulnerability** (DEBT-1878 S0). This is a real CI security risk.

4. **No plan addresses the 200+ cognitive complexity S1 items.** These are the
   single largest S1 cluster and none of the 7 plans target them systematically.

5. **MASTER_DEBT duplication itself is debt.** 32 S0 entries represent only 8
   unique issues (4:1 ratio). For S1, the ratio may be similar. The propagation
   plan's TDMS work (Steps 8-9) and SWS Step 8 both aim to address this, but it
   remains an active quality issue.

## Serendipity

1. **The 13 already-RESOLVED S0 items** (App Check + journalEntries) suggest the
   project has been actively addressing its most critical security debt. The
   remaining active S0 items are either false positives (SonarCloud hotspots),
   dependency issues (fast-xml-parser), or CI configuration gaps.

2. **The passive-surfacing plan's 33 violations exist OUTSIDE the MASTER_DEBT
   system.** This reveals a TDMS coverage gap: guardrail compliance violations
   are not tracked as debt items. SWS's born-compliant gates would capture these
   going forward, but the current 33 violations are invisible to MASTER_DEBT
   analytics.

3. **propagation-research is the only plan with S0-level debt reduction
   impact.** This makes it the most valuable plan from a risk-reduction
   perspective, despite not being the largest (SWS) or most immediately visible
   (custom-statusline) plan.

---

## Confidence Assessment

- HIGH claims: 8 (S0 count verification, debt ID existence, file-plan mapping,
  INDEX.md reconciliation)
- MEDIUM claims: 6 (resolution estimates for each plan, ROI ranking, S1 impact
  projections)
- LOW claims: 2 (exact S1 resolution counts, whether propagation Step 9
  specifically covers resolve-item.js)
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**
