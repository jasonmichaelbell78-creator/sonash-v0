# Implementation Plan: Synthesis Consolidation

## Summary

Merge repo-synthesis (v1.3) + website-synthesis (v1.1) + cross-type synthesis
stub into one unified `/synthesize` skill. Upgrade all 22 quick-scan repos to
Standard depth so synthesis has full data. Update all 14+ upstream/downstream
references. Deprecate old skills with redirects.

**Decisions:** See DECISIONS.md (32 decisions) **Effort Estimate:** XL
(multi-session — migration is ~2-2.5h alone, skill authoring ~2h, reference
updates ~1h, testing ~1h)

---

## Files to Create/Modify

### New Files (5)

1. **`.claude/skills/synthesize/SKILL.md`** — Unified synthesis skill (D#1, D#2)
2. **`.claude/skills/synthesize/REFERENCE.md`** — Paradigm templates, schemas,
   heuristics, output specs (D#2)
3. **`.research/analysis/synthesis/`** — Output directory (created by skill on
   first run) (D#4)
4. **CONVENTIONS.md Section 17** — Synthesis Output Contract (D#29)
5. **Migration tracking list** — `.research/analysis/_quick-scan-upgrade.md` —
   checklist of 22 repos with priority ranking (D#30)

### Modified Files (18+)

1. **`scripts/lib/analysis-schema.js`** — Add `synthesisRecord` Zod schema +
   `source_tier` field to `analysisRecordCore` (D#28, D#32)
2. **`.claude/skills/repo-synthesis/SKILL.md`** — Replace with deprecation
   redirect (D#3)
3. **`.claude/skills/website-synthesis/SKILL.md`** — Replace with deprecation
   redirect (D#3)
4. **`.claude/skills/analyze/SKILL.md`** — Rewrite synthesis mode section to
   smart redirect (D#31)
5. **`.claude/skills/repo-analysis/SKILL.md`** — Replace 5 `/repo-synthesis`
   references with `/synthesize` (D#16)
6. **`.claude/skills/repo-analysis/REFERENCE.md`** — Update integration refs
   (D#16)
7. **`.claude/skills/website-analysis/SKILL.md`** — Replace 5
   `/website-synthesis` references with `/synthesize` (D#16)
8. **`.claude/skills/website-analysis/REFERENCE.md`** — Update integration refs
   (D#16)
9. **`.claude/skills/document-analysis/SKILL.md`** — Update routing menu option
   8 (D#16)
10. **`.claude/skills/media-analysis/SKILL.md`** — Add/update synthesis routing
    (D#16)
11. **`.claude/skills/shared/CONVENTIONS.md`** — Update skill family list + add
    Section 17 (D#29)
12. **`CLAUDE.md`** — Update Section 7 trigger table (D#16)
13. **`.claude/COMMAND_REFERENCE.md`** — Update command list (D#16)
14. **`DOCUMENTATION_INDEX.md`** — Update doc index (D#16)
15. **`.claude/skills/analyze/REFERENCE.md`** — Update synthesis refs (D#16)
16. **`.claude/skills/schemas/synthesis-schema.ts`** — Remove or redirect to
    analysis-schema.js (D#28)
17. **All 4 handler SKILL.md files** — Add `source_tier` to output description
    and Quick Scan gate messaging (D#32, D#18)
18. **`scripts/cas/migrate-v3.js`** — Add `source_tier` default migration (D#32)

### Analysis Directories Modified (22)

All quick-scan repos in `.research/analysis/` — upgraded to Standard depth,
producing full artifact sets (D#30).

---

## Wave 1: Schema & Foundation (parallelizable)

### Step 1: Add source_tier to Zod Schema

Add `source_tier` field to `analysisRecordCore` in
`scripts/lib/analysis-schema.js`:

```javascript
source_tier: z.enum(["T1", "T2", "T3", "T4"]).optional(),
```

Add `synthesisRecord` schema with type-aware structure (D#6):

```javascript
const synthesisRecord = z.object({
  schema_version: z.string(),
  generated_at: z.string(),
  paradigm: z.enum(["thematic", "narrative", "matrix", "meta-pattern"]),
  mode: z.enum(["full", "incremental", "re-synthesis"]),
  sources_included: z.array(
    z.object({
      slug: z.string(),
      source: z.string(),
      source_type: z.enum(["repo", "website", "document", "media"]),
      source_tier: z.enum(["T1", "T2", "T3", "T4"]),
      depth: z.string(),
    })
  ),
  sources_excluded: z.array(
    z.object({
      slug: z.string(),
      reason: z.string(),
    })
  ),
  // Base keys — always present
  themes: z.array(themeSchema),
  ecosystem_gaps: z.array(gapSchema),
  fit_portfolio: z.object({
    refreshed_at: z.string(),
    candidates: z.array(candidateSchema),
  }),
  knowledge_map: z.object({
    covered: z.array(
      z.object({
        domain: z.string(),
        sources: z.array(z.string()),
        quality: z.string(),
      })
    ),
    gaps: z.array(
      z.object({
        domain: z.string(),
        home_context_source: z.string(),
        suggested_scan: z.string().nullable(),
      })
    ),
  }),
  opportunity_matrix: z.array(opportunitySchema),
  // Type-specific — optional
  reading_chain: z.array(chainNodeSchema).optional(),
  mental_model: z
    .object({
      interest_shifts: z.array(z.any()),
      confidence_shifts: z.array(z.any()),
      emerging_focus_tags: z.array(z.string()),
      date_range: z.string(),
    })
    .optional(),
  // Re-synthesis — optional
  changes_since_previous: changesSectionSchema.optional(),
});
```

**Done when:** `node -e "require('./scripts/lib/analysis-schema.js')"` succeeds.
Existing analysis validation still passes:
`node scripts/cas/migrate-v3.js --dry-run` reports 0 issues.

**Depends on:** None **Triggers:** Steps 2, 3

---

### Step 2: Migrate source_tier into existing analyses

Update `scripts/cas/migrate-v3.js` to fill `source_tier` for existing records:

- `source_type === "repo"` → `"T1"` (all repos are first-party artifacts)
- `source_type === "website"` → `"T2"` (conservative default; user can override)
- `source_type === "document"` → `"T2"` (conservative default)
- `source_type === "media"` → `"T2"` (conservative default)

Run: `node scripts/cas/migrate-v3.js` — should report 34 records updated with
source_tier.

**Done when:** All 34 analysis.json files have `source_tier` field. `migrate-v3`
reports 0 issues on re-run.

**Depends on:** Step 1

---

### Step 3: Update handler Quick Scan gate messaging

In all 4 handler SKILL.md files, update the interactive gate text to make it
clear Quick Scan is a preview:

```
Quick Scan complete. [health bands].

Quick Scan is a preview — it confirms whether this source is worth your time.
Standard analysis produces the full artifact set needed for /synthesize
cross-source intelligence.

Run Standard? (Standard ~5-10 min) [Y/n]
```

Also add `source_tier` to each handler's output description. Repo-analysis
always sets T1. Other handlers determine tier based on content signals and
present for user confirmation.

**Done when:** All 4 handler SKILL.md files updated. Gate messaging emphasizes
Standard as the real analysis, Quick Scan as preview.

**Depends on:** Step 1 (schema must accept source_tier)

---

## Wave 2: Skill Authoring (depends on Wave 1)

### Step 4: Write SKILL.md for /synthesize

Create `.claude/skills/synthesize/SKILL.md`. Structure per DECISIONS.md:

**Sections:**

- Frontmatter (name, description)
- Critical Rules (read don't re-analyze, conversational not clinical, state on
  every phase, write-to-disk-first, no-silent-skips, maximum thoroughness)
- When to Use / When NOT to Use
- Input (flags: `--paradigm`, `--type`, `--focus`, `--min-sources`)
- Interactive Opening Menu (D#8 — 6 options with state-aware visibility)
- Process Overview (phases below)
- Output sections (D#11 — 8 sections)
- Self-Audit (D#27 — 10 dimensions)
- Opportunity Matrix + routing (D#12)
- State File & Resume (D#19)
- Integration
- Version History

**Process phases:**

```
MENU       Interactive  -> 6-option opening menu (D#8)
PRE-FLIGHT Validation   -> Source count, artifact check, quick-scan upgrade
                           suggestions, tier review (D#21, D#32)
PHASE 1    Load         -> Read all artifacts, build internal graph,
                           checkpoint (D#15, D#20)
PHASE 2    Synthesize   -> Produce 8 outputs per paradigm (D#11, D#7)
                           Subagent hybrid for 10+ sources (D#20)
PHASE 3    Verify       -> Evidence check, convergence math, dedup (D#27)
PHASE 4    Self-Audit   -> 10-dimension audit (D#27)
PHASE 5    Present      -> Write synthesis.md + synthesis.json, archive
                           previous to history/, present inline (D#4, D#5)
PHASE 6    Opportunity  -> Interactive opportunity matrix with routing
                           to /brainstorm, /deep-plan, /deep-research,
                           /analyze (D#12)
RETRO      Feedback     -> Process feedback, persist to state
```

Target: under 300 lines for process sections (per CONVENTIONS.md Section 6).
Detailed specs go in REFERENCE.md.

**Done when:** SKILL.md exists, follows CONVENTIONS.md shared conventions, under
300 lines for process sections, all 32 decisions traceable to skill content.

**Depends on:** Step 1 (schema)

---

### Step 5: Write REFERENCE.md for /synthesize

Create `.claude/skills/synthesize/REFERENCE.md`. Contains:

1. **Paradigm templates** — thematic (default, 8 sections), narrative
   (timeline), matrix (comparison table), meta-pattern (taxonomy). Merged from
   both old REFERENCE.md files.
2. **Output section specs** — format, JSON schema, heuristics for each of the 8
   sections. Theme detection rules, gap analysis methodology, reading chain
   algorithm, evolution tracking, portfolio scoring, knowledge map construction,
   opportunity matrix ranking.
3. **Cross-type detection methods** (D#22) — tag matching, semantic similarity,
   candidate matching, explicit connections.
4. **Candidate deduplication algorithm** (D#23) — merge rules, convergence boost
   formula.
5. **Source tier weighting table** (D#13) — multipliers per tier, assignment
   rules per source type.
6. **Incremental synthesis algorithm** (D#14) — hybrid approach, contradiction
   detection, escalation rules.
7. **Re-synthesis change detection spec** (D#10) — all 6 dimensions, comparison
   methodology.
8. **Self-audit rubric** (D#27) — 10 dimensions with pass/fail criteria.
9. **State file schema** (D#17, D#19) — sections_completed, sources_loaded,
   resume protocol.
10. **Synthesis.json complete schema** (D#6) — full Zod-aligned JSON spec.
11. **Subagent strategy** (D#20) — inline vs agent thresholds, max sources per
    agent, merge protocol.
12. **Reading chain algorithm** (D#25) — dependency → pedagogical → tag cluster
    ordering.

**Done when:** REFERENCE.md exists, all 12 sections present, no TBD/TODO.

**Depends on:** Step 4 (SKILL.md defines what REFERENCE.md details)

---

## Wave 3: Reference Updates (parallelizable, depends on Wave 2)

### Step 6: Deprecate old synthesis skills

Replace contents of both old SKILL.md files with redirect:

**`.claude/skills/repo-synthesis/SKILL.md`:**

```markdown
---
name: repo-synthesis
description:
  "DEPRECATED — use /synthesize instead. Redirect expires next session."
---

# Repo Synthesis (DEPRECATED)

This skill has been consolidated into `/synthesize`.

Run `/synthesize` for cross-source synthesis (all types). Run
`/synthesize --type=repo` for repo-only synthesis.

Deprecated: 2026-04-09 (Session #270). Will be removed next session.
```

Same pattern for website-synthesis. Delete both REFERENCE.md files (the unified
REFERENCE.md supersedes them).

**Done when:** Both SKILL.md files are redirect-only. Both REFERENCE.md files
deleted.

**Depends on:** Steps 4-5 (new skill must exist before deprecating old ones)

---

### Step 7: Update all upstream/downstream references

Per D#16, update 14+ files. Run grep first to catch any missed references:

```bash
grep -r "repo-synthesis\|website-synthesis" --include="*.md" --include="*.js" --include="*.ts" --include="*.json" .claude/ CLAUDE.md DOCUMENTATION_INDEX.md SESSION_CONTEXT.md
```

**File-by-file changes:**

| File                            | Change                                                                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repo-analysis/SKILL.md`        | Replace 5 `/repo-synthesis` → `/synthesize`. Update "When NOT to Use", routing menu option 8, downstream, cross-repo connections note.                         |
| `repo-analysis/REFERENCE.md`    | Update integration/sibling references.                                                                                                                         |
| `website-analysis/SKILL.md`     | Replace 5 `/website-synthesis` → `/synthesize`. Update routing menu, companion reference.                                                                      |
| `website-analysis/REFERENCE.md` | Update integration references.                                                                                                                                 |
| `document-analysis/SKILL.md`    | Routing menu option 8: "Cross-source synthesis" → `/synthesize`.                                                                                               |
| `media-analysis/SKILL.md`       | Add routing menu option for synthesis if missing. Reference `/synthesize`.                                                                                     |
| `analyze/SKILL.md`              | Rewrite Synthesis Mode section (lines 84-103): smart redirect to `/synthesize`. Remove delegation to repo-synthesis/website-synthesis. Remove cross-type stub. |
| `analyze/REFERENCE.md`          | Update synthesis references.                                                                                                                                   |
| `shared/CONVENTIONS.md`         | Line 9: update skill family list. Add `/synthesize`, remove `repo-synthesis` and `website-synthesis`.                                                          |
| `CLAUDE.md` Section 7           | Trigger table: replace repo-synthesis + website-synthesis entries with single `/synthesize` entry.                                                             |
| `COMMAND_REFERENCE.md`          | Update command list: add `/synthesize`, mark old commands deprecated.                                                                                          |
| `DOCUMENTATION_INDEX.md`        | Update doc index.                                                                                                                                              |
| `schemas/synthesis-schema.ts`   | Remove (superseded by analysis-schema.js Zod schema) or add redirect comment.                                                                                  |
| `SESSION_CONTEXT.md`            | Update Quick Status table for T28.                                                                                                                             |

**Done when:** `grep -r "repo-synthesis\|website-synthesis" .claude/ CLAUDE.md`
returns only: deprecation redirects, historical planning docs, and the
deprecated SKILL.md files themselves.

**Depends on:** Steps 4-6 (new skill exists, old skills deprecated)

---

### Step 8: Add CONVENTIONS.md Section 17

Add "Synthesis Output Contract" to `.claude/skills/shared/CONVENTIONS.md`:

```markdown
## 17. Synthesis Output Contract

The `/synthesize` skill is a consumer skill — it reads handler output, does not
produce handler output. Its contract is separate from the handler contract
(Section 13).

### 17.1 MUST Artifacts

| Artifact         | Location                              | Format                                  |
| ---------------- | ------------------------------------- | --------------------------------------- |
| `synthesis.md`   | `.research/analysis/synthesis/`       | Conversational prose, 8 sections        |
| `synthesis.json` | `.research/analysis/synthesis/`       | Validates against `synthesisRecord` Zod |
| State file       | `.claude/state/synthesize.state.json` | JSON, sections_completed tracking       |

### 17.2 Output Sections (thematic paradigm)

1. Emergent Themes + Signals (merged)
2. Ecosystem Gap Analysis
3. Reading Chain (cross-type study sequence)
4. Mental Model Evolution
5. Fit Portfolio (all candidates, deduplicated, re-ranked)
6. Knowledge Map (domain coverage matrix)
7. Opportunity Matrix (interactive, routes to next actions)
8. Changes Since Previous (re-synthesis only)

### 17.3 History Preservation

Before overwriting, archive previous synthesis to
`.research/analysis/synthesis/history/synthesis-YYYY-MM-DD.md`. The
`synthesis.json` is also archived.

### 17.4 Side Effects

After synthesis: update `last_synthesized_at` in each processed source's
`analysis.json` and run `rebuild-index.js` to sync SQLite.
```

**Done when:** Section 17 added to CONVENTIONS.md. Internally consistent with
Sections 12-16.

**Depends on:** Step 4 (skill defines what the contract covers)

---

## Wave 4: Quick Scan Migration (depends on Wave 1, can parallel with Wave 2-3)

> **Session #272 discovery (2026-04-10):** Wave 4 scope was wrong. The original
> "22 quick-scan repos" count was based on the `depth: "quick"` field in
> `analysis.json`, but **10 of those 22 were mislabeled** — they have full
> Standard artifact sets
> (findings/summary/deep-read/content-eval/coverage-audit/
> creator-view/value-map) AND extraction journal entries, but their depth field
> was stamped "quick" by `scripts/cas/migrate-v3.js` during the 2026-04-09 v3.0
> migration. Real Wave 4 scope is **12 TRUE quick-scan repos + 10 metadata
> patches**.
>
> **True quick scans (need Standard upgrade):** ArchiveBox, crawl4ai, firecrawl,
> lux-video-downloader, marker, MinerU, nitter, outline, qmd, reader, surya,
> tesseract.
>
> **Mislabeled (need depth field fix only — no re-analysis):**
> aws-media-extraction, bedrock-summarize-audio-video-text,
> bulk-transcribe-youtube-playlist, codecrafters-io-build-your-own-x,
> hkuds-cli-anything, karpathy-autoresearch, public-apis_public-apis,
> teng-lin_notebooklm-py, viktoraxelsen-memskill, youtube-transcript-api.
>
> **Evidence:** See Session #272 self-audit output. Example: `firecrawl` FAIL
> ("No extraction journal entries", only analysis.json present) vs.
> `codecrafters-io-build-your-own-x` PASS (10 checks, 12 journal entries, full
> artifact set). Both tagged `depth: "quick"` in analysis.json.

### Step 8.5 (NEW): Fix mislabeled depth field + audit migrate-v3.js

**Added Session #272 per pre-Wave-4 audit.**

Before Wave 4 Step 10 begins:

1. **Fix 10 mislabeled repos** — update `analysis.json::depth` from `"quick"` to
   `"standard"` for the 10 repos listed above. These already have full Standard
   artifact sets; only the metadata field is wrong.

2. **Also fix `research-index.jsonl`** — check and correct depth values for the
   same 10 repos (same migrate-v3.js bug likely affected both files).

3. **Root-cause `scripts/cas/migrate-v3.js`** — read the migration script to
   understand why it stamped `depth: "quick"` across repos with Standard
   artifacts. The bug is likely in how it normalized the legacy `depth` /
   `scan_depth` fields during the v3.0 schema change. Fix or document.

4. **Re-run self-audit** for all 10 mislabeled to verify the fix:
   ```bash
   for slug in aws-media-extraction bedrock-summarize-audio-video-text bulk-transcribe-youtube-playlist codecrafters-io-build-your-own-x hkuds-cli-anything karpathy-autoresearch public-apis_public-apis teng-lin_notebooklm-py viktoraxelsen-memskill youtube-transcript-api; do
     node scripts/cas/self-audit.js --slug=$slug
   done
   ```

**Done when:** All 10 mislabeled repos report `depth: "standard"` in
analysis.json and research-index.jsonl, self-audit passes for all 10, and
migrate-v3.js bug is either fixed or documented as a known limitation.

**Depends on:** None (can run immediately)

**Also during pre-Wave-4 audit (Session #272):**

- Confirmed journal ↔ EXTRACTIONS.md consistency: ✅ 196 entries / 23 sources
  both sides
- Confirmed 11 "missing from extractions" repos are the 11 TRUE quick scans
  (plus lux-video-downloader makes 12 once the true-quick list is corrected)
- NO bulk-scan pipeline tail bug — the missing extractions are legitimate (Quick
  Scans don't produce candidates)

---

### Step 9: Prioritize and create upgrade checklist (REVISED)

Create `.research/analysis/_quick-scan-upgrade.md` with all **12** TRUE quick
scans ranked by synthesis relevance:

**Priority criteria:**

- Tag overlap with existing Standard-depth analyses
- ROADMAP alignment (repos relevant to active work)
- Star count / quality score from Quick Scan
- Source diversity (prioritize repos that cover gap domains)

List all 12 with: repo URL, current tags, priority rank (1-12), estimated
synthesis value.

> **Note (Session #272):** Initial checklist was created with 22 repos. It was
> revised down to 12 after the Step 8.5 mislabel discovery. The 10 mislabeled
> repos are already at Standard depth (real artifacts exist) — they only needed
> the metadata patch, not re-analysis.

**Done when:** Checklist created with all 12 TRUE quick-scan repos prioritized.

**Depends on:** Step 8.5 (depth corrections must be in place first)

---

### Step 10: Batch upgrade 12 TRUE quick-scan repos to Standard (REVISED)

Execute `/analyze <url> --depth=standard` for each of the **12** TRUE quick-scan
repos, in priority order. Batch optimizations:

1. **Skip interactive gate** — depth pre-set to standard
2. **Tags already exist** — present existing tags for confirmation,
   batch-approve
3. **Batch retro at end** — skip per-repo retro, do one batch retro covering all
   12 at session end
4. **Single index rebuild** — run `node scripts/cas/rebuild-index.js` once after
   all 12 complete (not per-repo)
5. **Single EXTRACTIONS.md regeneration** — run
   `node scripts/cas/generate-extractions-md.js` once at end

**Time estimate (revised):** ~6-10 min per repo × 12 repos = **~1.5-2 hours**
(single session feasible, but firecrawl alone may consume significant context
due to monorepo scale — 1162 files, 13 sub-apps).

> **Session #272 pilot attempt:** Firecrawl was chosen as the pilot (Wave 4A
> #1). After clone (1162 files) it was clear that full-fidelity Standard on
> firecrawl alone would consume substantial context due to monorepo structure
>
> - repomix output size. Pilot paused and deferred to next session. Firecrawl
>   clone is at `/tmp/repo-analysis-firecrawl/` if resuming. State file:
>   `.claude/state/repo-analysis.firecrawl.state.json`.

**Pragmatic deviations to consider for large repos (per-repo judgment):**

- **Skip repomix for Wave 4 batch** — repomix is "required for Extract routing"
  per skill docs. Wave 4 is not extracting, only upgrading depth for
  /synthesize. Can be regenerated later if Extract is needed.
- **Inline dimension wave instead of 4-agent spawn** — avoids the Windows 0-byte
  agent output bug, more deterministic, less context per repo. Trade: less
  exhaustive dimension coverage.

Document any deviations taken per-repo in the repo's state file.

**Done when:** All 12 TRUE quick-scan repos have full Standard artifact sets
(analysis.json, creator-view.md, value-map.json, findings.jsonl, summary.md,
deep-read.md, content-eval.jsonl, coverage-audit.jsonl). Self-audit passes for
all 12:
`for d in .research/analysis/*/; do node scripts/cas/self-audit.js --slug=$(basename $d); done`

**Depends on:** Step 8.5 (depth corrections), Step 9 (priority list), Step 1
(source_tier in schema), Step 3 (updated gate messaging)

---

## Wave 5: Testing & Verification (depends on all previous waves)

### Step 11: End-to-end test — full synthesis

Invoke `/synthesize` with all sources (now 34 Standard-depth). Verify:

1. Interactive menu appears with correct options (Full, Scoped, Review — no
   Resume/Incremental/Re-synthesize since first run)
2. Pre-flight validates all sources, assigns tiers, presents tier summary
3. All 8 output sections produced in synthesis.md
4. synthesis.json validates against Zod schema
5. Self-audit passes (10 dimensions)
6. Opportunity matrix presents interactive menu with actionable routing
7. State file written correctly
8. `last_synthesized_at` updated on all sources
9. SQLite index updated

**Done when:** Full synthesis completes, all artifacts valid, self-audit PASS.

**Depends on:** Steps 4-5 (skill exists), Step 10 (data ready)

---

### Step 12: Test incremental synthesis

After full synthesis, analyze one NEW source (any type). Then invoke
`/synthesize` again. Verify:

1. Menu shows Incremental option (detects 1 new source)
2. Incremental mode loads previous synthesis.json + new source
3. Correctly identifies what changed (new themes, candidate shifts, gaps filled)
4. Changes Since Previous section generated
5. History archive created from previous run

**Done when:** Incremental synthesis produces valid output with correct change
detection.

**Depends on:** Step 11 (first synthesis must exist)

---

### Step 13: Test scoped synthesis

Invoke `/synthesize --type=repo`. Verify only repo sources are included. Invoke
`/synthesize --paradigm=matrix`. Verify matrix paradigm output structure.

**Done when:** Scoped and paradigm overrides produce correct filtered/shaped
output.

**Depends on:** Step 11

---

### Step 14: Verify all reference updates

Run comprehensive grep to verify no stale references remain:

```bash
grep -rn "repo-synthesis\|website-synthesis" --include="*.md" --include="*.js" --include="*.ts" .claude/ CLAUDE.md SESSION_CONTEXT.md DOCUMENTATION_INDEX.md
```

Expected results: only deprecation redirects and historical `.research/` /
`.planning/` files.

**Done when:** Grep returns only expected results. No active files reference old
skill names except deprecation redirects.

**Depends on:** Step 7

---

### Step 15: Audit

Run code-reviewer agent on all new/modified files. Focus on:

- SKILL.md follows CONVENTIONS.md shared conventions
- Zod schema is internally consistent
- No orphaned references to old skills
- REFERENCE.md has no TBD/placeholder content
- Deprecation redirects are correct

**Done when:** All code-reviewer findings addressed or tracked in TDMS.

**Depends on:** All implementation steps (14)

---

## Execution Notes

### Parallelization

- **Wave 1 (Steps 1-3):** Step 1 first, then Steps 2-3 in parallel
- **Wave 2 (Steps 4-5):** Sequential (REFERENCE.md depends on SKILL.md)
- **Wave 3 (Steps 6-8):** All 3 parallelizable after Wave 2
- **Wave 4 (Steps 9-10):** Step 9 can start in Wave 1. Step 10 is the long
  sequential batch (~2-3 hours). Can run in parallel with Waves 2-3.
- **Wave 5 (Steps 11-15):** Sequential testing → audit

### Critical Path

Step 1 → Step 4 → Step 5 → Step 11 (shortest path to first synthesis run)

Step 10 is the longest individual step but can overlap with skill authoring.

### Session Planning

**Session A (this session or next):** Waves 1-3 (schema, skill authoring,
reference updates). ~2-3 hours.

**Session B:** Wave 4 (22 repo migrations). ~2-3 hours. Can combine with Session
A if time permits.

**Session C:** Wave 5 (testing, verification, audit). ~1-2 hours.

Total: ~5-8 hours across 1-3 sessions.
