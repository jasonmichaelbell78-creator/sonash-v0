# PLAN: Research Integrity Fix

**Topic:** Fix deep-research pipeline integrity + commit all research artifacts +
remediate existing outputs + verify implementations and plans
**Date:** 2026-04-02
**Decisions:** [DECISIONS.md](./DECISIONS.md) (21 decisions)
**Research:** Audit conducted this session — 9 research outputs, content-level
analysis, dependency mapping
**Effort:** L-XL (multi-session)
**Execution branch:** `planning-33026` (main repo, NOT worktree)

---

## Pre-Execution

### Step 0: Commit worktree artifacts and exit

Commit all planning artifacts created in this worktree session:
- `.planning/research-integrity-fix/` (DIAGNOSIS.md, DECISIONS.md, PLAN.md)
- `.planning/github-health-skill/DIAGNOSIS.md` (paused deep-plan)
- `.planning/todos.jsonl` (updated with T18)
- `.claude/state/deep-plan.github-health-skill.state.json`

Then exit worktree and switch to `planning-33026` on the main repo. User must
wrap up existing instance on that branch first.

**Done when:** Worktree artifacts committed, user confirms main repo ready.

---

## Phase 1: Commit Existing Research Artifacts

### Step 1: Format findings/challenges files for pre-commit compliance

Per Decision #21 — raw agent output files have never been through linting or
doc headers. Run a formatting pass BEFORE committing to avoid pre-commit
failures.

1. Inventory all files: `find .research/*/findings .research/*/challenges -type f`
2. Run prettier on all `.md` files (formatting only, no content changes)
3. Check for pattern compliance issues (`npm run patterns:check` on the files)
4. Fix any issues found (encoding, line endings, malformed markdown)
5. Do NOT add doc headers — `.research/` is exempt per `doc-header-config.json`

**Depends on:** Step 0
**Done when:** All 172 files pass formatting checks.

### Step 2: Remove gitignore rules and commit all research artifacts

Per Decision #1 and #6.

1. Edit `.gitignore` — remove lines 155-158:
   ```
   .research/**/findings/
   .research/**/challenges/
   .research/**/archive/
   .research/*/findings/
   .research/*/challenges/
   ```
2. Replace with comment:
   ```
   # Research artifacts — all committed for traceability (Decision 2026-04-02)
   ```
3. `git add .research/*/findings .research/*/challenges .research/archive/*/findings .research/archive/*/challenges`
4. Single commit: "fix: commit 172 gitignored research artifacts for data integrity"

**Depends on:** Step 1
**Done when:** `git status` shows no untracked files under `.research/`.

---

## Phase 2: Build Validation Script

### Step 3: Create `scripts/research/validate-research.js`

Per Decisions #4, #10, #19, #20. Script validates research output integrity.

**Invocation:**
```bash
node scripts/research/validate-research.js                    # all research
node scripts/research/validate-research.js --topic=<slug>     # single
node scripts/research/validate-research.js --fix              # auto-fix counts
```

**8 checks (per Decision #20):**

1. **Source traceability** — every `sourceIds` entry in claims.jsonl resolves to
   an `id` in sources.jsonl. Flag orphaned source IDs.
2. **Claim coverage** — every claim in claims.jsonl has its ID referenced in
   RESEARCH_OUTPUT.md. Flag orphaned JSONL claims.
3. **Findings file inventory** — count files in `findings/` and `challenges/`,
   compare against metadata `agentCount`. Flag mismatches.
4. **Confidence reconciliation** — recount HIGH/MEDIUM/LOW/UNVERIFIED from
   claims.jsonl, compare against metadata `confidenceDistribution`. Flag
   mismatches.
5. **Post-pipeline delta** — flag if metadata `claimCount` < claims.jsonl line
   count (means post-pipeline claims not counted).
6. **Claim-to-report bidirectional** — scan RESEARCH_OUTPUT.md for claim ID
   patterns (C-NNN, C-GNNN), verify all exist in claims.jsonl. Flag report-only
   claims.
7. **Source freshness** — flag sources with `accessDate` > 30 days old.
8. **Verification verdict persistence** — if RESEARCH_OUTPUT.md mentions
   VERIFIED/REFUTED verdicts, check claims.jsonl has `verificationStatus` field.

**Output (per Decision #10):**
- Console: summary table per research topic (PASS/WARN/FAIL per check)
- JSONL: `.claude/state/research-validation.jsonl` — one line per finding,
  feeds into TDMS/alerts

**Error handling:**
- Missing files (no claims.jsonl, no sources.jsonl) → WARN, not FAIL
- Parse errors in JSONL → FAIL with line number
- Use `scripts/lib/sanitize-error.js` for all error logging

**Done when:** Script runs against all 9 research outputs and produces baseline
report showing current state (expect many failures — that's the point).

### Step 4: Add npm script alias

```json
"research:validate": "node scripts/research/validate-research.js"
```

**Done when:** `npm run research:validate` works.

---

## Phase 3: Remediate Existing Research Outputs

### Step 5: Run baseline validation

```bash
npm run research:validate
```

Capture output. This is the "before" snapshot. Save to
`.planning/research-integrity-fix/BASELINE.md`.

**Done when:** Baseline captured with per-topic, per-check results.

### Step 6: Remediate metadata.json for all 8 research outputs

Per Decision #3 (full remediation). For each research output (excluding
research-discovery-standard per Decision #7):

1. **github-health**: Fix agentCount (21→32), claimCount (38→100+),
   sourceCount (27→103+), confidenceDistribution, remove stale
   `findingsFilesCompleted`/`findingsFilesMissing`/`coverageNote` fields.
2. **custom-agents**: Fix agentCount (37→49), confidenceDistribution
   (MEDIUM 32→35).
3. **dev-dashboard**: Fix agentCount (36→42 or verify report says 35+).
4. **repo-analysis-skill**: Fix agentCount (32→31 per PR), confidenceDistribution
   (HIGH 37→42, MEDIUM 10→6, remove LOW/UNVERIFIED that don't exist).
5. **repo-analysis-value-extraction**: Fix agentCount (18→28),
   confidenceDistribution (reconcile 3 conflicting counts against JSONL).
6. **debt-runner-expansion**: Fix agentCount (19→verify, PR says 17 but report
   says 19), sourceCount (55→46 to match JSONL, or add 9 missing sources).
7. **multi-layer-memory**: Fix agentCount (30→41 per report header),
   confidenceDistribution (HIGH 96→105, MEDIUM 30→22, LOW 2→1), status
   (phase-2.5-complete → challenge-and-gap-complete).
8. **plan-orchestration**: Fix confidenceDistribution (off by 1: HIGH 25→26,
   MEDIUM 9→8).

**Approach:** Read each metadata.json, cross-reference against claims.jsonl
actual counts and RESEARCH_OUTPUT.md header. Use `--fix` mode of validation
script where possible.

**Done when:** `npm run research:validate` shows metadata checks passing for
all 8.

### Step 7: Remediate claims.jsonl for affected outputs

Per Decision #3. For each research output where claims.jsonl is stale:

1. **github-health**: Add C-039 (CODEOWNERS finding from V1 verification).
   This is the worst case — claims.jsonl has 38 entries but report has 100.
   The final synthesizer needs to regenerate claims.jsonl from
   RESEARCH_OUTPUT.md claim registry. Consider: manually extract all ~39 claim
   IDs from report Section 5 and ensure JSONL matches.
2. **multi-layer-memory**: Persist 10 corrected claim confidence levels from
   report verification appendix back into claims.jsonl. Mark C-215 as
   `"refuted": true`.
3. **custom-agents**: Fix confidenceDistribution mismatch (add 3 MEDIUM claims
   from gap-pursuit to align 32→35).

**Note:** For github-health, the claims.jsonl has 38 entries but the report
describes ~39 claim IDs (C-001 through C-039). The gap between 38/39 claims
in JSONL vs "100 claims" in the PR description suggests the PR counted
differently (possibly including prioritized issues P0-001 through P3-006 as
"claims"). Verify the actual scope before rebuilding.

**Done when:** `npm run research:validate` shows claim checks passing.

### Step 8: Remediate sources.jsonl for affected outputs

Per Decision #3.

1. **github-health**: Add S-027 (orphaned source in JSONL but not report) —
   actually this is in the JSONL already, just not cited. Low priority.
2. **debt-runner-expansion**: Add 9 missing sources (S-047 through S-055) —
   these are cited in the report but absent from JSONL. Extract from report
   Section 20 source table.
3. **multi-layer-memory**: Generate sources.jsonl from scratch — claims
   reference 26 internal source IDs (D-codes) but no file exists. Per Decision
   #2, use D-codes as IDs for this existing research.

**For repo-analysis-skill and repo-analysis-value-extraction:** Per Decision #2,
accept the D-code/S-code inconsistency for existing research. Add a note to
metadata.json: `"sourceIdScheme": "research-phase-codes"` to document the
divergence.

**Done when:** `npm run research:validate` shows source checks passing (or
WARN for accepted inconsistencies).

### Step 9: Add AUDIT.md to research-discovery-standard

Per Decision #7.

```markdown
# AUDIT: research-discovery-standard

Pre-standard pipeline output (2026-03-24). No claims.jsonl or sources.jsonl.
All claims (8) and sources (100+) embedded in RESEARCH_OUTPUT.md narrative.
Downstream plan references report sections directly.

No JSONL remediation performed — content integrity verified via report.
```

**Done when:** File written, committed.

### Step 10: Commit remediation

Single commit: "fix: remediate research metadata, claims, and sources across
8 outputs"

**Depends on:** Steps 6-9
**Done when:** `npm run research:validate` shows all checks passing or
WARN-only (no FAIL).

---

## Phase 4: Fix Pipeline

### Step 11: Update final-synthesizer agent to reconcile metadata + claims

Per Decisions #4 and #5. Edit
`.claude/agents/deep-research-final-synthesizer.md`.

**Metadata reconciliation (add to Metadata Update section):**

The final synthesizer MUST update these core fields by recounting from
actual artifacts:
- `agentCount` — count all agent output files in findings/ + challenges/ +
  verification files
- `claimCount` — count lines in claims.jsonl
- `sourceCount` — count lines in sources.jsonl
- `confidenceDistribution` — recount from claims.jsonl
- `findingsFilesCompleted` — count files in findings/
- `challengeFilesCompleted` — count files in challenges/

**Claims.jsonl reconciliation (new section):**

After writing RESEARCH_OUTPUT.md, the final synthesizer MUST regenerate
claims.jsonl to include ALL claims from the report:
1. Read RESEARCH_OUTPUT.md claim registry
2. Read existing claims.jsonl
3. Add any claims in report but not in JSONL
4. Update confidence levels for any claims changed by verification/challenges
5. Mark refuted claims with `"refuted": true`
6. Write updated claims.jsonl

**Sources.jsonl reconciliation (new section):**

After updating claims.jsonl, verify all sourceIds resolve:
1. Read all sourceIds from claims.jsonl
2. Read all ids from sources.jsonl
3. Flag any unresolvable references
4. For new research: enforce S-code scheme (per Decision #2)

**Done when:** Agent definition updated with reconciliation requirements.

### Step 12: Embed validation checks in final-synthesizer

Per Decision #4. Add a self-audit section to the final-synthesizer that runs
checks 1-6 (of the 8) inline before declaring research complete:

1. Source traceability
2. Claim coverage
3. Findings file inventory
4. Confidence reconciliation
5. Post-pipeline delta
6. Claim-to-report bidirectional

If any check FAILs, the final synthesizer must fix it before completing.
Checks 7-8 (source freshness, verdict persistence) are advisory only at
pipeline time.

**Done when:** Agent definition includes self-audit section.

### Step 13: Update Phase 2 synthesizer to use S-code scheme

Per Decision #2. Edit `.claude/agents/deep-research-synthesizer.md`.

In Step 8 (Generate sources.jsonl) and Step 7 (Generate claims.jsonl):
- Sources MUST use sequential S-### IDs
- Claims MUST reference S-### IDs in sourceIds arrays
- Add explicit instruction: "Do NOT use research-phase codes (D1a, D2a-1)
  as source IDs. Map each source to a sequential S-### ID."

**Done when:** Synthesizer agent definition updated.

### Step 14: Commit pipeline fixes

Single commit: "fix: deep-research pipeline — metadata reconciliation,
claims/sources integrity, S-code standardization"

**Depends on:** Steps 11-13
**Done when:** Pipeline agents updated and committed.

---

## Phase 5: Verify Implementations and Plans

### Step 15: Verify custom-agents implementation (T8, completed)

Per Decisions #13 and #14. Custom-agents research had:
- 22 orphaned sources (38%)
- Agent count 3-way conflict (37/39/49)
- Stale confidence distribution
- Zero formal claim citations in report

**Functional check:** The implementation (6 pipeline agents, sonash-context
skill, 8 consolidations, elevations) is in production and working. Verify no
behavioral issues.

**Code audit:** Read the implemented agents/skills. Check whether any design
decisions were based on claims that were refuted or had confidence downgrades.
Focus on the 9 claims added during gap-pursuit (C-103 to C-111) that weren't
in the original JSONL.

**Done when:** Audit report produced. Material issues → fix commit. No issues →
note in AUDIT.md.

### Step 16: Verify repo-analysis skill (just committed)

Per Decision #15. Repo-analysis research had:
- repo-analysis-skill: 146/147 orphaned sources, D-code/S-code mismatch
- repo-analysis-value-extraction: broken source traceability, 3 conflicting
  confidence counts

**Code audit:** Read `.claude/skills/repo-analysis/SKILL.md` and
`REFERENCE.md`. Check whether any skill behavior references specific claims
or findings that are stale/wrong. The skill was built from the PLAN.md which
references RESEARCH_OUTPUT.md sections — check the chain.

**Done when:** Audit report produced. Material issues → follow-up commit on
planning-33026. No issues → note in AUDIT.md.

### Step 17: Light-touch verify plan-orchestration Waves 0-1b

Per Decision #16. Research was mostly clean (agent count + confidence off by 1).

Check: did the minor count discrepancies propagate into any execution
decisions in Waves 0-1b? Read the execution commits and verify.

**Done when:** Quick audit, documented.

### Step 18: Audit all 6 downstream plans for discrepancies

Per Decisions #8 and #9. For each plan:

1. `.planning/custom-agents/PLAN.md` + `DECISIONS.md` + `DIAGNOSIS.md`
2. `.planning/dev-dashboard/PLAN.md` + `DECISIONS.md` + `DIAGNOSIS.md`
3. `.planning/repo-analysis-skill/PLAN.md` + `DECISIONS.md` + `DIAGNOSIS.md`
4. `.planning/plan-orchestration/PLAN.md` + `DECISIONS.md`
5. `.planning/research-discovery-standard/PLAN.md` + `DECISIONS.md`
6. `.planning/github-health-skill/DIAGNOSIS.md` (paused, in progress)

**For each:** Read the plan. Cross-reference every research citation (agent
counts, claim counts, source counts, confidence levels, specific findings)
against the corrected research. Flag ALL mismatches per Decision #9.

Present findings to user for approval before making changes.

**Done when:** Audit complete, findings presented, user approves corrections.

### Step 19: Fix plan discrepancies

Apply approved corrections from Step 18 to plan files.

**Depends on:** Step 18 + user approval
**Done when:** All plan files updated. Committed.

---

## Phase 6: Validation and Home Locale

### Step 20: Final validation run

```bash
npm run research:validate
```

All 8 research outputs (excluding research-discovery-standard) should show
PASS on all 8 checks. Capture as "after" snapshot.

**Done when:** All PASS. Compare against Step 5 baseline.

### Step 21: Home locale sync plan

Per Q21 comment. Some research artifacts exist ONLY at the home locale:
- multi-layer-memory research state file
- Possibly other findings/challenges files not on this machine

**Plan:**
1. At home locale, run `npm run research:validate` to identify gaps
2. Run Step 1 (formatting pass) on any unformatted findings/challenges
3. Remove gitignore rules (already done via git pull from Step 2)
4. Commit any additional findings/challenges files not on work machine
5. Run final validation to confirm full coverage

**This step happens at the home locale in a separate session.**

**Done when:** Home locale validation passes. All research artifacts committed
across both locales.

---

## Audit Checkpoint

### Step 22: Code review

Run `code-reviewer` agent on:
- `scripts/research/validate-research.js` (new script)
- `.claude/agents/deep-research-final-synthesizer.md` (modified)
- `.claude/agents/deep-research-synthesizer.md` (modified)
- All remediated metadata.json, claims.jsonl, sources.jsonl files

**Done when:** Review passes, no material issues.

---

## Parallelization Notes

- **Steps 1-2** are sequential (format then commit)
- **Steps 3-4** can start in parallel with Steps 1-2 (script doesn't depend
  on gitignore change)
- **Steps 6-9** can be parallelized per research output (each is independent)
- **Steps 11-13** can be parallelized (different agent files)
- **Steps 15-17** can be parallelized (independent verifications)
- **Step 18** depends on Steps 6-10 (needs corrected research to audit against)
- **Step 21** is a separate session at a different locale

---

## Summary

| Phase | Steps | Description |
|-------|-------|-------------|
| Pre-execution | 0 | Commit worktree, switch to feature branch |
| 1: Commit artifacts | 1-2 | Format + commit 172 gitignored files |
| 2: Validation script | 3-4 | Build + wire validate-research.js |
| 3: Remediate | 5-10 | Fix metadata, claims, sources for 8 outputs |
| 4: Fix pipeline | 11-14 | Update synthesizer agents, S-code scheme |
| 5: Verify impls/plans | 15-19 | Audit implementations + 6 plans, fix discrepancies |
| 6: Validate + home | 20-21 | Final run, home locale sync |
| Audit | 22 | Code review |
