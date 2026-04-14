# Implementation Plan: Synthesis Consolidation

> **Status:** ✅ COMPLETE (all 15 steps, Sessions #269–#279, closed 2026-04-14)
>
> Wave 1–3 (Sessions #269–#271): Schema, skill authoring, deprecation redirects,
> references. Wave 4 (Sessions #275–#276): Quick-scan upgrades (12 repos to
> Standard). Wave 4.5 / Step 8.5 (Session #275): Schema drift remediation. Step
> 10.5 (Sessions #276–#277): Full-corpus audit + remediation (12 categories).
> Wave 5 (Session #277): First synthesis run + opportunities ledger shipped.
> Step 12 (Session #278): Incremental synthesis test (GitNexus delta). Steps
> 13 + 15 (Session #279): Scoped+paradigm test + code-reviewer audit (8
> findings, all fixed).
>
> See per-step ✅ markers below for evidence anchors.

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

### Step 1: Add source_tier to Zod Schema ✅ COMPLETE (Wave 1, Session #269–270)

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

### Step 2: Migrate source_tier into existing analyses ✅ COMPLETE (Wave 1, Session #270)

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

### Step 3: Update handler Quick Scan gate messaging ✅ COMPLETE (Wave 1, Session #270)

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

### Step 4: Write SKILL.md for /synthesize ✅ COMPLETE (Wave 2, Session #271 — initial; v1.1 ledger Session #277; v1.2 audit Session #279)

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

### Step 5: Write REFERENCE.md for /synthesize ✅ COMPLETE (Wave 2, Session #271)

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

### Step 6: Deprecate old synthesis skills ✅ COMPLETE (Wave 3, Session #271 — both redirects shipped; path note corrected Session #279 F6)

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

### Step 7: Update all upstream/downstream references ✅ COMPLETE (Wave 3, Session #271)

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

### Step 8: Add CONVENTIONS.md Section 17 ✅ COMPLETE (Wave 3, Session #271)

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
> was stamped "quick" during the 2026-04-09 v3.0 migration. Real Wave 4 scope is
> **12 TRUE quick-scan repos + 9 metadata patches** (revised from 10 — see
> Session #273 scope correction below).
>
> **True quick scans (need Standard upgrade):** ArchiveBox, crawl4ai, firecrawl,
> lux-video-downloader, marker, MinerU, nitter, outline, qmd, reader, surya,
> tesseract.
>
> **Mislabeled (9 repos — depth field fix + candidate backfill only, no
> re-analysis):** bedrock-summarize-audio-video-text,
> bulk-transcribe-youtube-playlist, codecrafters-io-build-your-own-x,
> hkuds-cli-anything, karpathy-autoresearch, public-apis_public-apis,
> teng-lin_notebooklm-py, viktoraxelsen-memskill, youtube-transcript-api.
>
> **Excluded from mislabeled set:** `aws-media-extraction`. Session #273
> verification showed it has `meta.scan_depth: "quick"`, a `quick_scan` key,
> only 5/7 Standard artifacts, and a self-consistent quick-scan profile. Its 8
> journal entries are an unrelated anomaly (quick scans should not produce
> extractions) filed for separate investigation.
>
> **Evidence:** See Session #272 self-audit output. Example: `firecrawl` FAIL
> ("No extraction journal entries", only analysis.json present) vs.
> `codecrafters-io-build-your-own-x` PASS (10 checks, 12 journal entries, full
> artifact set). Both tagged `depth: "quick"` in analysis.json.

### Step 8.5 (NEW): Fix mislabeled depth field + candidate backfill + migrate-schemas root cause ✅

**Added Session #272 per pre-Wave-4 audit. Executed Session #273.**

> **Session #273 scope correction (2026-04-10):** Session #272's initial
> diagnosis attributed the depth mislabel to `scripts/cas/migrate-v3.js`. That
> was incorrect — migrate-v3.js has no depth-field logic at all. The actual root
> cause is `scripts/cas/migrate-schemas.js:223`, whose fallback chain
> `data.depth || data.meta?.scan_depth || "quick"` missed the v2 legacy
> root-level `data.scanDepth` (camelCase). Six of the nine repos have
> `scanDepth: "standard"` as direct evidence; the other three never had any
> depth metadata and fell through to the `"quick"` default. A second drift was
> discovered mid-execution: the same v2→v3 migration left
> `analysis.json.candidates` empty for all 9 repos even though the extraction
> journal had entries. Per the "extractions are canon" principle, the candidates
> mirror was rebuilt from the journal under the hood.

Executed in Session #273:

1. **Fix 9 mislabeled repos** — `scripts/cas/fix-depth-mislabel.js` updates
   `analysis.json::depth` from `"quick"` to `"standard"` for the 9 repos listed
   above, guarded by a full 7/7 Standard artifact check. Idempotent. ✅ 9 fixed,
   0 skipped, 0 errors.

2. **Fix `.research/research-index.jsonl`** — 3 of the 9 repos (codecrafters,
   hkuds, karpathy) had stale `depth: "quick"` entries in the index. Updated
   in-place. The other 6 are not present in research-index.jsonl. ✅

3. **Root-cause fix `scripts/cas/migrate-schemas.js:223`** — added
   `data.scanDepth` and `data.meta?.scanDepth` to the fallback chain before the
   `"quick"` default. Inline comment explains the Session #272 incident.

4. **Self-heal in `scripts/cas/migrate-v3.js`** — new rule #9 in `fixRecord()`:
   if a record has `depth: "quick"` AND either `scanDepth === "standard"` OR a
   full 7/7 Standard artifact set on disk, auto-correct to `depth: "standard"`.
   Idempotent. Verified not to trigger on currently-valid records
   (`Fixed: 0 | Already valid: 34`).

5. **Backfill candidates from journal** — `scripts/cas/backfill-candidates.js`
   reads `.research/extraction-journal.jsonl`, groups by source, and maps
   entries to the `candidateSchema` shape (candidate→name, notes→description,
   etc.). Populated candidates for all 9 repos (10–17 per repo, 108 total). ✅ 9
   backfilled, 0 skipped, 0 errors. `--all` flag available to scan beyond Step
   8.5 scope.

6. **Re-run self-audit** — all 9 repos: PASS. Only remaining warning is "No
   state file — pipeline tail (tags, retro, routing) may have been skipped" —
   pre-existing drift, outside Step 8.5 scope.

**Done when:** ✅ All 9 mislabeled repos report `depth: "standard"` in
analysis.json and research-index.jsonl, `candidates` arrays are populated from
the journal, self-audit passes for all 9, `migrate-schemas.js` root cause is
fixed, and `migrate-v3.js` has idempotent self-heal for future recurrences.

**Depends on:** None (can run immediately)

**Also during pre-Wave-4 audit (Session #272):**

- Confirmed journal ↔ EXTRACTIONS.md consistency: ✅ 196 entries / 23 sources
  both sides
- Confirmed 11 "missing from extractions" repos are the 11 TRUE quick scans
  (plus lux-video-downloader makes 12 once the true-quick list is corrected)
- NO bulk-scan pipeline tail bug — the missing extractions are legitimate (Quick
  Scans don't produce candidates)

**Known follow-ups (out of Step 8.5 scope):**

- `aws-media-extraction` anomaly — 8 journal entries from a self-identified
  quick scan. Either the scan was actually Standard and its metadata is corrupt,
  or the journal entries are spurious. Needs separate investigation.
- Pipeline tail state file missing for all 9 backfilled repos — tags, retro, and
  routing metadata were not recorded during the original runs. Affects the WARN
  line in self-audit but not the extraction data itself.

---

### Step 9: Prioritize and create upgrade checklist (REVISED) ✅ COMPLETE (Wave 4, Session #275)

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

### Step 10: Batch upgrade 12 TRUE quick-scan repos to Standard (REVISED) ✅ COMPLETE (Wave 4, Session #276 — 10/12 upgraded, 2 skipped by decision per CONVENTIONS §17.6)

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

### Step 10.5 (NEW): Full-corpus audit — content, schema, conventions, extractions ✅ COMPLETE (Sessions #276–#277, 12 categories remediated A–L)

**Added Session #273 per user instruction.** Gates Wave 5.

Once Step 10 completes (all 12 TRUE quicks upgraded to Standard), run a
comprehensive per-source audit across the ENTIRE `.research/analysis/` corpus —
not just Wave 4's 12 repos. This is the same class of check Session #273
produced for firecrawl: schema validation, convention compliance, content
quality, **and — most importantly — extraction completeness** (candidates
present in `.research/extraction-journal.jsonl` AND `.research/EXTRACTIONS.md`).

**Scope — every source in `.research/analysis/`:**

- 12 Wave 4 upgrades from Step 10 (firecrawl, MinerU, crawl4ai, marker, surya,
  reader, tesseract, ArchiveBox, outline, qmd, nitter, lux-video-downloader)
- 9 Step 8.5 backfilled repos (bedrock-summarize-audio-video-text,
  bulk-transcribe-youtube-playlist, codecrafters-io-build-your-own-x,
  hkuds-cli-anything, karpathy-autoresearch, public-apis_public-apis,
  teng-lin_notebooklm-py, viktoraxelsen-memskill, youtube-transcript-api)
- Previously-Standard repos (safishamsi-graphify, docling, unstructured,
  aws-media-extraction — note excluded-from-Wave-4 anomaly)
- Gists (farzaa-gist-c35ac0cf, karpathy-gist-442a6bf,
  kieranklaassen-gist-4f2aba89, maharshi-pandya-gist-4aeccbe1)
- Document sources (errors-and-vulnerabilities-in-ai-generated-code)
- Website sources (docs-composio-dev,
  sidbharath-com-blog-claude-code-the-complete-guide, and 4 others)
- Media sources (2 YouTube analyses)

**Per-source checks (same format used for firecrawl in Session #273):**

1. **Schema** — analysis.json validates against `analysisRecordCore` Zod (run
   via `scripts/cas/self-audit.js --slug=<slug>`)
2. **MUST artifacts per CONVENTIONS.md §13.1:**
   - analysis.json (all depths)
   - value-map.json (Standard/Deep)
   - creator-view.md (Standard/Deep, 6 sections, conversational prose)
   - **Extraction entries in `.research/extraction-journal.jsonl`**
     (Standard/Deep, MUST)
3. **SHOULD artifacts per §13.2:**
   - findings.jsonl, summary.md, deep-read.md, content-eval.jsonl,
     coverage-audit.jsonl
4. **Handler-specific artifacts per §13.3** (repomix-output.txt for repo,
   meta.json for website, transcript.md for media + `transcript_source` field)
5. **Content quality:**
   - Creator View references specific Deep Read / Content Eval items per Rule #9
     (not just category-level observations)
   - Creator View written in conversational prose per Rule #10
   - Home-repo references in Creator View Section 2 verified against filesystem
     (Rule #4 Self-verify SHOULD)
6. **Extraction completeness (THE MOST IMPORTANT CHECK):**
   - `grep -c "source.*<repo-slug-or-name>" .research/extraction-journal.jsonl`
     MUST be > 0 for any Standard/Deep source that has candidates in its
     value-map.json
   - `.research/EXTRACTIONS.md` MUST contain a section for the source
   - value-map.json candidate count MUST match journal entry count (excluding
     skipped dispositions)
   - Per-candidate schema — each journal entry has all required fields
     (schema_version, source_type, source, candidate, type, decision,
     decision_date, novelty, effort, relevance, tags)
7. **Cross-file consistency:**
   - `research-index.jsonl` entry matches analysis.json depth
   - Tags are consistent across analysis.json, value-map.json, journal entries
   - `last_synthesized_at` field correctly null or dated
8. **Re-analysis signals** — `trends.jsonl` present if prior analysis exists for
   the source

**Deliverables:**

- `.research/analysis/_audit-report.md` — per-source pass/fail matrix with
  specific issues flagged
- `.research/analysis/_audit-fixes.md` — proposed remediation for each failing
  source, categorized by: (a) metadata patches (like Step 8.5 depth fix), (b)
  missing extraction journal entries (the most critical class — backfill from
  value-map.json), (c) missing artifacts (re-run or manually produce), (d)
  content quality deficiencies (re-write), (e) schema drift (migration script
  needed)
- User review of the proposed fixes — interactive triage, not auto-apply
- Remediation execution after user approval

**Inspiration and precedent — Session #273 firecrawl evaluation:**

Session #273 built firecrawl's Standard artifacts manually (bypassing the skill
— see `feedback_skills_in_plans_are_tool_calls` memory). The resulting artifacts
were then audited against content / schema / convention. Self-audit surfaced a
single FAIL: **"No extraction journal entries for source:
mendableai/firecrawl"**. That one failure validated the user's strongest framing
(per `feedback_extractions_are_canon` memory): _"THE EXTRACTIONS ARE THE DATA.
This whole process is random data without those pointing towards it."_ The
per-source audit methodology in Step 10.5 is the same check, applied to the
whole corpus.

**Why this step exists:**

The Session #273 Step 8.5 audit found 9 repos with silently-wrong depth metadata
AND empty candidate arrays. The v2→v3 migration had a double-drift bug. Without
a full-corpus audit, similar drift may be hiding across ALL analyses — not just
Wave 4 scope. Before Wave 5 synthesis runs, every source has to be
verified-correct or synthesis will pull from broken data.

**Done when:**

1. `.research/analysis/_audit-report.md` exists covering every source in
   `.research/analysis/`
2. `.research/analysis/_audit-fixes.md` exists with categorized remediation
   proposals
3. User has reviewed the fixes and approved a remediation order
4. All approved fixes applied (commits may be per-category or consolidated)
5. Re-audit sweep shows PASS for every source (no silent "depth = quick but has
   Standard artifacts" drift, no "value-map has candidates but journal has none"
   drift, no missing MUST artifacts)

**Depends on:** Step 10 (so Wave 4 data is included in the audit scope). Does
NOT depend on Step 9 separately.

**Gates:** Wave 5 (Step 11 onward). `/synthesize` MUST NOT run against a corpus
with unresolved audit findings — doing so would feed synthesis bad data and
re-create the class of bug Session #272-273 just fixed.

---

## Wave 5: Testing & Verification (depends on all previous waves)

### Step 11: End-to-end test — full synthesis ✅ COMPLETE (Wave 5, Session #277 — first full synthesis of corpus, opportunities ledger initialized)

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

### Step 12: Test incremental synthesis ✅ COMPLETE (Session #278 — incremental mode test on GitNexus delta, 7/7 requirements PASS, self-audit 10/10)

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

### Step 13: Test scoped synthesis ✅ COMPLETE (Session #279, 2026-04-14)

Invoke `/synthesize --type=repo`. Verify only repo sources are included. Invoke
`/synthesize --paradigm=matrix`. Verify matrix paradigm output structure.

**Done when:** Scoped and paradigm overrides produce correct filtered/shaped
output.

**Depends on:** Step 11

**Result:** Functional verification (option B) —
`.research/analysis/synthesis/test-step13/RESULTS.md`. 13a PASS (26 repos in / 9
non-repos out: 6 web, 1 doc, 2 media). 13b PASS (Zod enum + REFERENCE.md §1.3
spec + structure all verified). Full-run testing skipped to preserve baseline;
flag combinations verified via static + filter inspection.

---

### Step 14: Verify all reference updates ✅ COMPLETE (Sessions #271 + verified #278 — grep confirmed only deprecation redirects + historical files mention old skill names)

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

### Step 15: Audit ✅ COMPLETE (Session #279, 2026-04-14)

Run code-reviewer agent on all new/modified files. Focus on:

- SKILL.md follows CONVENTIONS.md shared conventions
- Zod schema is internally consistent
- No orphaned references to old skills
- REFERENCE.md has no TBD/placeholder content
- Deprecation redirects are correct

**Done when:** All code-reviewer findings addressed or tracked in TDMS.

**Depends on:** All implementation steps (14)

**Result:** Audit returned 8 findings (3 P1, 4 P2, 2 P3 — F7 covered by F3). All
8 fixed in-session (none deferred to TDMS):

- F1 (P1) status banner v1.0 → v1.2 (also bumped for v1.2 changes below)
- F2 (P1) `opportunitySchema.title_key` added (optional, since current writers
  compute it on-the-fly)
- F3 (P1) `opportunityLedgerRecord` Zod schema + `ledgerStatusEnum` +
  `deferredToSchema` added; validates 17/17 existing ledger rows
- F4 (P2) repo-synthesis redirect "8 sections supersetting the 6" wording fix
- F5 (P2) Routing Guide table added to synthesize/SKILL.md
- F6 (P2) website-synthesis redirect path corrected (was claiming "remain the
  same" but parent dir consolidated `website-analysis/` → `analysis/`)
- F7 (P3) `deferred_to` shape — covered by F3 (`deferredToSchema` enforces
  nested object)
- F8 (P3) "2 sources of same type" line clarified (double warning: min-sources +
  thin convergence)

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
