# Plan: Analysis/Synthesis Skill Convergence

**Date:** 2026-04-06 **Decisions:** [DECISIONS.md](./DECISIONS.md) (20
decisions) **Research:** `.research/analysis-synthesis-comparison/` **Effort:**
L (single session, subagent-parallel)

---

## Phase A: Shared Infrastructure (sequential, do first)

### Step 1: Create shared CONVENTIONS.md

**Per Decision #1, #7**

Create `.claude/skills/shared/CONVENTIONS.md` with 7 canonical conventions:

1. Phase transition markers: `========== PHASE N: [NAME] ==========`
2. Write-to-disk-first: every phase writes output before proceeding
3. Conversational prose: Creator View MUST be conversational, not clinical
4. 4-band scoring: Critical (0-39) / Needs Work (40-59) / Healthy (60-79) /
   Excellent (80-100). Bands over numbers display rule.
5. Fit scoring thresholds: active-sprint (personal_fit >= 60), park-for-later,
   evergreen, not-relevant
6. SKILL.md/REFERENCE.md split: process flow in SKILL.md (brief),
   specs/schemas/templates in REFERENCE.md (detailed). Use website-analysis as
   the reference implementation.
7. No silent skips: after every SHOULD step, verify output exists. Retry once,
   then report. Never silently continue.

Also include: **Self-audit minimum floor** (per Decision #8):

- Artifact presence check (all MUST files exist and are non-empty)
- Schema contract verification (output matches expected structure)
- Completeness check (all phases produced expected output)

Add one-line header to all 4 SKILL.md files:
`**Shared conventions:** See \`.claude/skills/shared/CONVENTIONS.md\``

**OS tag:** PORTABLE

**Done when:** CONVENTIONS.md exists with 7 conventions + self-audit floor. All
4 SKILL.md files reference it.

---

### Step 2: Create Zod schemas + validation script

**Per Decision #2, #3, #16**

Create `.claude/skills/schemas/`:

- `analysis-schema.ts` — Zod schema for `analysis.json` (v4.2 runtime structure:
  4 typed candidate arrays, `description` field, `schema_version`)
- `synthesis-schema.ts` — Zod schema for `synthesis.json` (unified:
  `schema_version` key, `synthesized_at`, core fields)
- `findings-schema.ts` — Zod schema for `findings.jsonl` (canonize `description`
  over `detail`)
- `validate-artifact.ts` — CLI script:
  `npx tsx validate-artifact.ts --type=analysis --path=<file>`
  - Strict validation for new artifacts (schema_version present)
  - Warning-only for legacy artifacts (schema_version absent = v1.0 implicit)

Use Zod 4.3.6 (already in stack). TypeScript strict mode.

**OS tag:** PORTABLE (schemas are domain-agnostic patterns)

**Done when:** All 3 schemas compile. validate-artifact.ts validates one real
`analysis.json` from
`.research/repo-analysis/codecrafters-io-build-your-own-x/`. Legacy files
produce warnings, not errors.

---

### Step 3: OS portability audit on remaining items

**Per Decision #4**

Tag each remaining step in this plan:

- **PORTABLE** — works in any project with no modification
- **CONFIGURABLE** — works if project-specific paths/integrations are
  parameterized
- **SONASH-SPECIFIC** — hardcoded to SoNash

(Tags already applied inline below. This step is the audit pass — verify tags
are correct before executing Phase B.)

**Done when:** All steps tagged. Any SONASH-SPECIFIC items flagged for future
parameterization.

---

## Phase B: Critical Gap Fixes (can parallelize Steps 4-6)

### Step 4: Fix repo-analysis REFERENCE.md schema drift

**Per Decision #16, research C-024**

Update `.claude/skills/repo-analysis/REFERENCE.md`:

- Section 3.3: Replace `extraction_candidates[]` with 4 typed arrays:
  `patternCandidates[]`, `knowledgeCandidates[]`, `contentCandidates[]`,
  `antiPatternCandidates[]`. Document actual fields (`novelty`, `effort`,
  `relevance`).
- Section 3.2: Change `detail` to `description` in `findings.jsonl` schema.
- Bump version from v4.0 to v4.2.
- Update phase numbering in Section 15 and agent allocation table to match
  current SKILL.md phases.

Verify fix: run `validate-artifact.ts --type=analysis` against a real file after
updating schema.

**OS tag:** PORTABLE

**Done when:** REFERENCE.md v4.2. Schema matches runtime artifacts. Validation
passes.

---

### Step 5: Add self-audit phase to website-synthesis

**Per Decision #8, research gap (Critical)**

Add Phase 2.5 Self-Audit to `.claude/skills/website-synthesis/SKILL.md` after
paradigm synthesis (Phase 2), before signal detection (Phase 3):

Minimum floor from CONVENTIONS.md plus:

- Theme evidence check: each theme supported by 3+ independent sites
- T20 tally: confirmed/corrected/extended/new
- Source tier distribution: warn if >50% of evidence is T4

Add corresponding detail section to REFERENCE.md.

**OS tag:** PORTABLE

**Done when:** website-synthesis SKILL.md has Phase 2.5 with T20 tally.
REFERENCE.md has detail section.

---

### Step 6: Add convergence scoring to repo-synthesis

**Per Decision #10, research gap (Critical)**

Add to `.claude/skills/repo-synthesis/REFERENCE.md` Section 1 (or new section):

Confidence thresholds based on agreement count:

- **HIGH:** 3+ repos independently confirm a pattern/theme
- **MEDIUM:** 2 repos confirm
- **LOW:** 1 repo only (flag as "single-source")

No tier weighting (per Decision #10 — repos are first-party). Add independence
check: repos that fork from each other count as 1 source.

Update SKILL.md Phase 2 to reference the scoring section.

**OS tag:** PORTABLE

**Done when:** REFERENCE.md has convergence scoring section. SKILL.md Phase 2
references it. Thresholds are HIGH/MEDIUM/LOW.

---

## Phase C: Structural Alignment (can parallelize Steps 7-11)

### Step 7: Unify depth flag syntax

**Per Decision #13**

Update `.claude/skills/website-analysis/SKILL.md`:

- Change `--standard`, `--deep`, `--quick` to `--depth=standard`,
  `--depth=deep`, `--depth=quick`
- Update Input section and any REFERENCE.md references

**OS tag:** PORTABLE

**Done when:** website-analysis uses keyed `--depth=` format matching
repo-analysis.

---

### Step 8: Resolve artifact path conflict

**Per Decision #15**

Update `.claude/skills/repo-analysis/SKILL.md` and `REFERENCE.md`:

- Change `extraction-journal.jsonl` path from `.research/repo-analysis/` to
  `.research/` (root)
- Change `reading-chain.jsonl` path similarly
- Change `EXTRACTIONS.md` path similarly
- Add `source_type: "repo"` discriminator field to extraction-journal entries

Note: existing files at `.research/repo-analysis/extraction-journal.jsonl`
remain valid (legacy).

**OS tag:** CONFIGURABLE (paths are project-specific)

**Done when:** repo-analysis docs point to root paths. Discriminator field
documented.

---

### Step 9: Unify synthesis.json schema key

**Per Decision #16**

Update `.claude/skills/repo-synthesis/REFERENCE.md`:

- Change top-level `version` key to `schema_version`
- Update any state file references

**OS tag:** PORTABLE

**Done when:** repo-synthesis uses `schema_version` matching website-synthesis.

---

### Step 10: Remove agent_budget from repo-analysis state schema

**Per Decision #17**

Update `.claude/skills/repo-analysis/REFERENCE.md` Section 8 (State File
Schema):

- Remove `agent_budget: {allocated, spawned, completed}`
- Replace with `agents: {spawned, completed}` (flat, no budget concept)
- Aligns with website-analysis's pattern and MEMORY.md behavioral rule

**OS tag:** PORTABLE

**Done when:** State schema has `agents: {spawned, completed}` with no
`allocated` field.

---

### Step 11: Add "no silent skips" to synthesis skills' Critical Rules

**Per Decision #7**

Add to `.claude/skills/website-synthesis/SKILL.md` Critical Rules and
`.claude/skills/repo-synthesis/SKILL.md` Critical Rules:

- "No silent skips. After every SHOULD step, verify output exists. Retry once,
  then report. Never silently continue."
- Reference CONVENTIONS.md

**OS tag:** PORTABLE

**Done when:** Both synthesis skills have explicit no-silent-skips rule.

---

## Phase D: Feature Cross-Pollination (can parallelize Steps 12-18)

### Step 12: Add warm-up phase to website-synthesis

**Per Decision #9**

Add WARM-UP pre-phase to `.claude/skills/website-synthesis/SKILL.md`:

- Site count, candidate count estimate, selected paradigm, estimated duration
- Prior retro feedback replay (per Decision #11)
- Model on repo-synthesis SKILL.md lines 121-135

**OS tag:** PORTABLE

**Done when:** website-synthesis has WARM-UP phase with scope estimate and retro
replay.

---

### Step 13: Add retro persistence to 3 non-repo-synthesis skills

**Per Decision #11**

For each of website-analysis, repo-analysis, website-synthesis:

- Add `process_feedback` field to state file schema in REFERENCE.md
- Add retro prompt at skill completion (before routing menu)
- Add replay of prior feedback: analysis skills in VALIDATE phase,
  website-synthesis in WARM-UP

**OS tag:** PORTABLE

**Done when:** All 4 skills persist retro to state and replay on next run.

---

### Step 14: Align synthesis skills to 5 home context sources

**Per Decision #12**

Update `.claude/skills/website-synthesis/SKILL.md` and `REFERENCE.md`:

- Add Critical Rule or MUST instruction: load SESSION_CONTEXT.md, ROADMAP.md,
  CLAUDE.md, `.claude/skills/` listing, MEMORY.md before Creator-facing output
- Match website-analysis Rule 8 and repo-analysis Creator View source list

Update `.claude/skills/repo-synthesis/SKILL.md`:

- Expand from 2 sources (SESSION_CONTEXT, ROADMAP) to all 5

**OS tag:** CONFIGURABLE (file paths are project-specific)

**Done when:** Both synthesis skills document all 5 context sources as MUST.

---

### Step 15: Add self-audit phase to repo-analysis

**Per Decision #8, research gap (High)**

Add pre-routing self-audit to `.claude/skills/repo-analysis/SKILL.md`:

- CONVENTIONS.md minimum floor (artifact presence, schema contract,
  completeness)
- Domain-specific: schema drift detection (check skillVersion), regression check
  (finding count delta vs prior run), REFERENCE.md contract verification
- Model on website-analysis's 9-dimension approach but adapted for repo domain

**OS tag:** PORTABLE

**Done when:** repo-analysis has named Self-Audit phase with minimum floor +
domain dimensions.

---

### Step 16: Add invocation tracking to repo-analysis and repo-synthesis

**Per Decision #18**

Add `write-invocation.ts` call to:

- repo-analysis: in the "Done" routing option
- repo-synthesis: in Phase 4 completion

Model on website-synthesis SKILL.md lines 251-255 (exact bash command format).

**OS tag:** SONASH-SPECIFIC (write-invocation.ts is project tooling)

**Done when:** Both skills document invocation tracking with exact command.

---

### Step 17: Add Phase 2.5 Verification Pass to website-synthesis

**Per research gap (High)**

Already partially addressed by Step 5 (self-audit). This step ensures the T20
tally format is explicitly documented as a verification pass, not just a
self-audit checklist. Add to REFERENCE.md:

- T20 tally format: Confirmed / Corrected / Extended / New
- Threshold: if Corrected > 20%, flag synthesis quality concern

**OS tag:** PORTABLE

**Done when:** website-synthesis REFERENCE.md has T20 tally specification.

---

### Step 18: Add Decision Coverage Map to 3 non-website-analysis skills

**Per Decision #14**

Add appendix to REFERENCE.md of repo-analysis, repo-synthesis,
website-synthesis:

- Map all design decisions to their implementation location (section + line
  range)
- Model on website-analysis REFERENCE.md appendix format

**OS tag:** PORTABLE

**Done when:** All 4 REFERENCE.md files have Decision Coverage Map appendices.

---

## Phase E: Integration Fix + Final

### Step 19: Fix session-begin research-index.jsonl integration

**Per Decision #19**

Update `.claude/skills/session-begin/SKILL.md`:

- Add step: read `.research/research-index.jsonl` if it exists
- Surface summary: "Prior research: N topics analyzed. Most recent: {topic}
  ({date})"
- Non-blocking: if file missing or empty, skip silently

**OS tag:** CONFIGURABLE (path is project-specific)

**Done when:** session-begin reads and surfaces research-index.jsonl content.

---

### Step 20: Audit checkpoint

**Per deep-plan Critical Rule #3**

Run code-reviewer on all new/modified files:

- `.claude/skills/shared/CONVENTIONS.md` (new)
- `.claude/skills/schemas/*.ts` (new)
- All 4 SKILL.md files (modified)
- All 4 REFERENCE.md files (modified)
- `.claude/skills/session-begin/SKILL.md` (modified)

Verify:

- All CONVENTIONS.md references resolve
- All Zod schemas compile
- validate-artifact.ts runs successfully on test data
- No broken cross-references between SKILL.md and REFERENCE.md
- Version numbers bumped in all modified files

**Done when:** Code review passes. All cross-references verified. Versions
bumped.

---

## Execution Strategy

**Per Decision #20:** Single session, sequential with subagents.

1. **Phase A (Steps 1-3):** Sequential — shared infrastructure must exist before
   skill edits
2. **Phase B (Steps 4-6):** Parallel subagents — one per critical gap,
   independent
3. **Phase C (Steps 7-11):** Parallel subagents — structural edits, independent
4. **Phase D (Steps 12-18):** Parallel subagents — grouped by skill:
   - Agent 1: website-synthesis (Steps 5, 12, 14-ws, 17)
   - Agent 2: repo-synthesis (Steps 6, 14-rs, 9)
   - Agent 3: repo-analysis (Steps 4, 10, 15, 16-ra)
   - Agent 4: website-analysis (Step 7, 18-wa)
5. **Phase E (Steps 19-20):** Sequential — integration + audit

**Parallelizable steps:** 4-6, 7-11, 12-18 (within phases)

---

## OS Portability Summary

| Tag             | Count | Items                         |
| --------------- | ----- | ----------------------------- |
| PORTABLE        | 15    | Steps 1, 2, 4-7, 9-15, 17-18  |
| CONFIGURABLE    | 3     | Steps 8, 14, 19               |
| SONASH-SPECIFIC | 1     | Step 16 (invocation tracking) |

Step 16 needs a portability wrapper (configurable script path) before OS
adoption.
