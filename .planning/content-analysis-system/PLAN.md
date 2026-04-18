# Implementation Plan: T28 Content Analysis System

> **Status:** ✅ **COMPLETE** — 14 of 15 steps done; Step 14 (skill-audits)
> rolls forward as tracker T38 per REMAINING_CAS_TASKS.md Step C protocol.
> Closed Session #287 (2026-04-18) on Step B verification.
>
> Wave 1 (Sessions #267–#268): Steps 1, 2, 3, 12 — backups, unified Zod schema,
> CONVENTIONS §13/14/16, .gitignore. Wave 2 (Session #269): Steps 4, 5 —
> repo-analysis + website-analysis migrated to unified schema. Wave 3 (Sessions
> #269–#270): Steps 6, 7, 8 — document-analysis + media-analysis built;
> SQLite+FTS5 index infrastructure (`content-analysis.db`). Wave 4 (Sessions
> #270–#278): Steps 9, 10, 11, 13 — `/analyze` router, directory migration,
> `/recall` skill, synthesis merge (T29 sub-plan: closed Session #279, all 15
> sub-steps complete). Wave 5: Step 15 (Session #287 — E2E `/recall`
> verification on y2z-monolith: 6/6 handoff points, 4/4 recall queries,
> `last_synthesized_at` mutation mechanism validated, SQLite rebuild OK). Step
> 14 (skill-audits) → T38 follow-up (unblocked by this closure).
>
> **Current corpus:** 37 sources (27 repo, 6 website, 1 doc, 2 media + 1
> monolith added Session #287), 379 extraction candidates, 332 tags.
>
> See per-step ✅ markers below for evidence anchors.

## Summary

Build the Content Analysis System: two user-facing skills (`/analyze` and
`/recall`) backed by 4 source-type handler skills (repo, website, document,
media), a unified Zod schema, a SQLite+FTS5 search index, and incremental
synthesis. All handler skills follow the same structure (repo-analysis v4.3 as
template). Existing data migrates to the new system.

**Decisions:** See DECISIONS.md (29 decisions) **Effort Estimate:** XL (4-6
sessions)

---

## Files to Create/Modify

### New Files (estimated 20+)

1. **`.claude/skills/analyze/SKILL.md`** — Router skill
2. **`.claude/skills/analyze/REFERENCE.md`** — Router reference (type detection
   patterns, flags, synthesis modes)
3. **`.claude/skills/recall/SKILL.md`** — Query skill
4. **`.claude/skills/recall/REFERENCE.md`** — Recall reference (query modes,
   examples)
5. **`.claude/skills/document-analysis/SKILL.md`** — Document handler skill
6. **`.claude/skills/document-analysis/REFERENCE.md`** — Document handler
   reference
7. **`.claude/skills/media-analysis/SKILL.md`** — Media handler skill
8. **`.claude/skills/media-analysis/REFERENCE.md`** — Media handler reference
9. **`scripts/lib/analysis-schema.js`** — Zod schemas (analysis + extraction)
10. **`scripts/cas/rebuild-index.js`** — SQLite index build/rebuild script
11. **`scripts/cas/recall.js`** — Query script for `/recall`
12. **`scripts/cas/update-index.js`** — Incremental index update after analysis
13. **`scripts/cas/migrate-files.js`** — One-time file directory migration
14. **`.claude/agents/document-analyst.md`** — Agent for parallel doc analysis
15. **`.claude/agents/media-analyst.md`** — Agent for parallel media analysis
16. **`.research/analysis/`** — New unified output directory

### Modified Files (estimated 10+)

1. **`.claude/skills/repo-analysis/SKILL.md`** — Write unified schema, add tag
   suggestions
2. **`.claude/skills/repo-analysis/REFERENCE.md`** — Update output schema docs
3. **`.claude/skills/website-analysis/SKILL.md`** — Align to repo-analysis
   structure, write unified schema, add tag suggestions
4. **`.claude/skills/website-analysis/REFERENCE.md`** — Update output schema
   docs
5. **`.claude/skills/shared/CONVENTIONS.md`** — Add sections 12-15
6. **`.gitignore`** — Add `*.db`, `*.db-wal`, `*.db-shm` under `.research/`
7. **`CLAUDE.md`** — Update Section 7 agent triggers for `/analyze` and
   `/recall`
8. **`.claude/skills/repo-synthesis/SKILL.md`** — Update to read from unified
   directory
9. **`.claude/skills/website-synthesis/SKILL.md`** — Update to read from unified
   directory

---

## Step 1: Back Up Existing Skills ✅ COMPLETE (Wave 1, Session #267)

Before any modifications, create safety copies of the skills being changed.

- Copy `.claude/skills/repo-analysis/SKILL.md` →
  `.claude/skills/repo-analysis/SKILL.md.backup-v4.3`
- Copy `.claude/skills/repo-analysis/REFERENCE.md` →
  `.claude/skills/repo-analysis/REFERENCE.md.backup-v4.3`
- Copy `.claude/skills/website-analysis/SKILL.md` →
  `.claude/skills/website-analysis/SKILL.md.backup-v1.1`
- Copy `.claude/skills/website-analysis/REFERENCE.md` →
  `.claude/skills/website-analysis/REFERENCE.md.backup-v1.1`

**Done when:** 4 backup files exist. Verified via `ls`. **Depends on:** None
**Triggers:** Steps 2-5 (cannot modify skills until backups exist)

---

## Step 2: Unified Zod Schema ✅ COMPLETE (Wave 1, Session #267 — `scripts/lib/analysis-schema.js`; extended Sessions #271 + #279 for synthesis)

Create `scripts/lib/analysis-schema.js` with Zod schemas for both the analysis
record and the extraction record. Per Decision #6 and #7.

**Analysis record schema (core fields — all required):**

```js
const analysisRecord = z.object({
  id: z.string().uuid(),
  schema_version: z.string(),
  source_type: z.enum(["repo", "website", "document", "media"]),
  source: z.string(), // URL, file path, or identifier
  slug: z.string(), // directory slug
  title: z.string(),
  analyzed_at: z.string().datetime(),
  depth: z.enum(["quick", "standard", "deep"]),
  tags: z.array(z.string()), // auto + user tags
  scoring: z.object({
    quality_band: z.string(),
    quality_score: z.number(),
    personal_fit_band: z.string(),
    personal_fit_score: z.number(),
    classification: z.string(),
  }),
  summary: z.string(), // 2-3 sentence summary
  creator_view: z.string(), // full conversational prose
  candidates: z.array(candidateSchema),
  last_synthesized_at: z.string().datetime().nullable(),
});
```

**Type-specific optional fields:**

```js
const repoFields = z
  .object({
    metadata: z.object({ stars: z.number(), language: z.string() /* ... */ }),
    dimensions: z.object({
      /* 6 summary dimensions */
    }),
    absence_patterns: z.array(z.string()),
  })
  .partial();

const websiteFields = z
  .object({
    metadata: z.object({ domain: z.string(), pages_analyzed: z.number() }),
    value_axes: z.object({
      /* 13 dimensions */
    }),
    key_claims: z.array(z.string()),
    links: z.array(z.string()),
  })
  .partial();

const mediaFields = z
  .object({
    metadata: z.object({ duration_seconds: z.number(), platform: z.string() }),
    transcript_source: z.enum(["captions", "whisper", "manual"]),
  })
  .partial();

const documentFields = z
  .object({
    metadata: z.object({ page_count: z.number(), file_type: z.string() }),
  })
  .partial();
```

**Extraction record schema (expanded v2.0):**

```js
const extractionRecord = z.object({
  schema_version: z.literal("3.0"),
  source_type: z.enum(["repo", "website", "document", "media"]),
  source: z.string(),
  source_analysis_id: z.string().uuid().nullable(),
  candidate: z.string(),
  type: z.enum([
    "pattern",
    "anti-pattern",
    "knowledge",
    "content",
    "architecture-pattern",
    "design-principle",
    "workflow-pattern",
    "tool",
  ]),
  decision: z.enum(["defer", "extract", "skip", "investigate"]),
  decision_date: z.string(),
  extracted_to: z.string().nullable(),
  extracted_at: z.string().nullable(),
  notes: z.string(),
  novelty: z.enum(["high", "medium", "low"]),
  effort: z.enum(["E0", "E1", "E2", "E3"]),
  relevance: z.enum(["high", "medium", "low"]),
  tags: z.array(z.string()).default([]),
});
```

**Done when:** `scripts/lib/analysis-schema.js` exports both schemas + a
`validate(record, type)` function. Both schemas pass unit tests with sample data
from existing repo and website analyses. **Depends on:** None (can run parallel
with Step 1)

---

## Step 3: CONVENTIONS.md Expansion ✅ COMPLETE (Wave 1, Session #267 — Sections 13/14/16 added; §17 added by T29 Session #271)

Add 4 new sections per Decision #25:

- **Section 12: Universal Schema Contract** — field naming (snake_case),
  required vs optional, Zod validation import path, schema version bumping
  rules.
- **Section 13: Handler Output Contract** — what every handler MUST produce:
  `analysis.json` (validated), `value-map.json`, `creator-view.md`,
  `extraction-journal.jsonl` entries. Write to `.research/analysis/<slug>/`.
- **Section 14: Tag Conventions** — auto-tag categories (source type, candidate
  type, topic), naming rules (lowercase, hyphenated), tag suggestion protocol in
  handler skills.
- **Section 15: Skill Template Contract** — all handler skills follow the same
  phase structure. Reference repo-analysis v4.3 phases. Deviations must be
  documented in Critical Rules.

**Done when:** CONVENTIONS.md updated, all 4 existing skills still reference it.
**Depends on:** Step 2 (schema must exist to reference)

---

## Step 4: Modify Repo-Analysis for Unified Schema ✅ COMPLETE (Wave 2, Session #269 — repo-analysis migrated; later bumped to v4.6 in Session #278 with Use-As-Is verdict)

Update repo-analysis to write the unified analysis record schema. This is the
template that all other skills follow.

Changes:

1. Import Zod schema from `scripts/lib/analysis-schema.js`
2. Change `analysis.json` output to unified schema (snake_case, unified
   structure). Map existing fields:
   - `schemaVersion` → `schema_version`
   - `summaryBands` → `scoring` object (convert A-F bands to numeric + band)
   - `creatorLens` → `creator_view`
   - Add `id` (UUID), `tags` (auto-generated from repo type + dimensions),
     `summary` (condensed from creator view), `last_synthesized_at` (null)
3. Keep all existing phases, guards, and behavior identical
4. Add tag suggestion step after Value Map (Phase 6): suggest 5-8 tags based on
   repo type, top dimensions, candidate types. Present to user for
   accept/modify.
5. Update output path references to `.research/analysis/<slug>/` per Decision
   #22 (but keep existing path as fallback during transition)
6. Update REFERENCE.md schema documentation to match new output

**Done when:** repo-analysis writes valid unified schema. Existing test with a
known repo produces output that passes Zod validation. All phases still run.
**Depends on:** Steps 1, 2, 3

---

## Step 5: Modify Website-Analysis for Unified Schema ✅ COMPLETE (Wave 2, Session #269)

Align website-analysis to match repo-analysis structure and write unified
schema.

Changes:

1. Import Zod schema from `scripts/lib/analysis-schema.js`
2. Align `analysis.json` to unified schema:
   - Already snake_case (good)
   - `value_axes` → move to type-specific `dimensions` field
   - `key_claims` → move to type-specific field
   - Add `scoring` object matching repo-analysis format
   - Add `creator_view` field (from SITE-ANALYSIS.md content)
   - Add `id`, `tags`, `summary`, `last_synthesized_at`
3. Align phases to match repo-analysis phase numbering where applicable:
   - VALIDATE → PHASE 0 → GATE → deeper phases → Creator View → Engineer View →
     Value Map → Coverage Audit → Self-Audit → Routing
4. Add tag suggestion step (same as repo-analysis)
5. Update output path to `.research/analysis/<slug>/`
6. Update REFERENCE.md

**Done when:** website-analysis writes valid unified schema. Phase structure
mirrors repo-analysis. Zod validation passes. **Depends on:** Steps 1, 2, 3, 4
(repo-analysis is the template — do it first)

---

## Step 6: Build Document-Analysis Skill ✅ COMPLETE (Wave 3, Session #269)

New skill at `.claude/skills/document-analysis/SKILL.md`. Follows repo-analysis
v4.3 template structure. Per Decision #15 and #16.

**Source types handled:** PDF, markdown, gist, article, arxiv paper, code
snippet, meeting notes, generic text file.

**Phase structure (mirroring repo-analysis):**

```
VALIDATE   Guards         -> File exists? URL reachable? Supported type?
PHASE 0    Quick Scan     -> Read first page/section, classify, lightweight
                             creator lens
GATE       Interactive    -> "Run Standard/Deep? [y/N]"
PHASE 1    Content Load   -> Read full document (Read tool for PDF, WebFetch
                             for URLs, Read for local files)
PHASE 2    Dimension Wave -> Assess content quality, depth, methodology,
                             actionability, novelty
PHASE 2b   Deep Read      -> For longer docs: internal references, citations,
                             linked resources
PHASE 4    Creator View   -> Same 6 sections as repo-analysis
PHASE 4b   Content Eval   -> Evaluate embedded references, linked resources
PHASE 5    Engineer View  -> Quality bands using same scoring system
PHASE 6    Value Map      -> Pattern/knowledge/content/anti-pattern candidates
PHASE 6b   Coverage Audit -> Unread sections, unfollowed references
SELF-AUDIT                -> Artifact presence, schema validation
ROUTING    Menu           -> Same options as repo-analysis
```

**Input detection:** file path ending in `.pdf`/`.md`/`.txt` → local file.
GitHub gist URL → fetch raw content. arxiv URL → fetch abstract + PDF. Other
URLs that aren't repos/websites → treat as article, fetch content.

**Tag suggestions:** Auto-tag by document type (`#pdf`, `#arxiv`, `#gist`),
topic keywords from content, candidate types found.

Also create `.claude/agents/document-analyst.md` for use as parallel agent
within the skill during Standard/Deep (Creator View + Engineer View parallel).

**Done when:** SKILL.md + REFERENCE.md created. Follows same structure as
repo-analysis. Writes valid unified schema. Manual test with a PDF and a gist.
**Depends on:** Steps 2, 3, 4 (needs schema + conventions + template to follow)

---

## Step 7: Build Media-Analysis Skill ✅ COMPLETE (Wave 3, Session #270)

New skill at `.claude/skills/media-analysis/SKILL.md`. Per Decision #17.

**Source types handled:** YouTube videos, TikTok videos, podcast episodes, audio
files, any media with available transcript.

**Phase structure:**

```
VALIDATE   Guards         -> URL valid? Platform supported? Captions available?
PHASE 0    Quick Scan     -> Fetch metadata (title, duration, description).
                             Check for captions. Lightweight creator lens from
                             description.
GATE       Interactive    -> "Captions available. Run Standard/Deep? [y/N]"
                             OR "No captions. Provide transcript or install
                             Whisper? [T/W/N]"
PHASE 1    Transcription  -> Captions API (YouTube) OR user-provided transcript
                             OR Whisper (if installed, runtime detection)
PHASE 2    Dimension Wave -> Assess content quality, depth, speaker expertise,
                             actionability
PHASE 2b   Deep Read      -> Linked resources in description, show notes,
                             referenced materials
PHASE 4    Creator View   -> Same 6 sections as repo-analysis
PHASE 4b   Content Eval   -> Evaluate linked resources from description
PHASE 5    Engineer View  -> Quality bands
PHASE 6    Value Map      -> Candidates
PHASE 6b   Coverage Audit -> Segments not analyzed, references not followed
SELF-AUDIT                -> Artifact presence, schema validation
ROUTING    Menu           -> Same options
```

**Whisper runtime detection:**

```js
// In PHASE 1, check for Whisper availability
// Try: python -c "import faster_whisper; print('ok')"
// If available: offer Whisper transcription
// If not: fallback to captions or manual transcript
```

**Tag suggestions:** Auto-tag by platform (`#youtube`, `#podcast`), content
topic, speaker if identifiable.

Also create `.claude/agents/media-analyst.md`.

**Done when:** SKILL.md + REFERENCE.md created. Captions path tested with a
YouTube URL. Manual transcript path tested. Whisper detection works (doesn't
error if Whisper is absent). **Depends on:** Steps 2, 3, 4 (needs schema +
conventions + template)

---

## Step 8: Build SQLite Index Infrastructure ✅ COMPLETE (Wave 3, Session #270 — `.research/content-analysis.db`, FTS5 enabled, rebuild script at scripts/cas/rebuild-index.js)

Per Decisions #9, #10, #23, #28. Three scripts in `scripts/cas/`.

**8a: `scripts/cas/rebuild-index.js`**

Idempotent rebuild script. Per Decision #24.

```
1. Delete .research/content-analysis.db if exists
2. Create schema:
   - sources table (id, source_type, source, slug, title, tags JSON,
     quality_band, quality_score, personal_fit_band, personal_fit_score,
     summary, analyzed_at, last_synthesized_at)
   - extractions table (all extraction-journal fields + source_analysis_id
     + tags JSON)
   - tags table (id, name normalized)
   - source_tags junction (source_id, tag_id)
   - extraction_tags junction (extraction_id, tag_id)
   - FTS5 virtual table over extractions (candidate, notes, tags)
   - FTS5 virtual table over sources (title, summary, tags)
3. PRAGMA: WAL, synchronous NORMAL, foreign_keys ON, temp_store MEMORY
4. Scan .research/analysis/*/analysis.json → insert source records
5. Read .research/extraction-journal.jsonl → insert extraction records
6. Build tag junction tables from tags arrays
7. Run 5 validation queries:
   - Source count matches directory count
   - Extraction count matches journal line count
   - No orphaned extractions (all have valid source)
   - PRAGMA integrity_check = 'ok'
   - PRAGMA foreign_key_check = 0 rows
8. Print summary: N sources, M extractions, K unique tags
```

**8b: `scripts/cas/update-index.js`**

Incremental update after a single analysis. Called by `/analyze` after handler
completes.

```
1. Read the new analysis.json
2. Content-hash comparison — skip if unchanged
3. SAVEPOINT transaction
4. Upsert source record
5. Remove old extraction entries for this source
6. Insert new extraction entries
7. Update tag junctions
8. RELEASE savepoint
```

**8c: `scripts/cas/recall.js`**

Query interface for `/recall` skill. Per Decisions #11, #27.

```
Usage:
  node scripts/cas/recall.js <query>           # Free-text FTS5 search
  node scripts/cas/recall.js --tag=#pattern    # Tag filter
  node scripts/cas/recall.js --type=repo       # Source type filter
  node scripts/cas/recall.js --sort=recent     # Sort by date
  node scripts/cas/recall.js --sort=novelty    # Sort by novelty
  node scripts/cas/recall.js --source=<slug>   # By specific source
  node scripts/cas/recall.js --limit=20        # Result limit (default 20)

Output: JSON array of matching records with source context.
```

**Done when:** All 3 scripts work. `rebuild-index.js` produces a valid DB from
current data. `recall.js` returns results for test queries. **Depends on:** Step
2 (schema), Step 10 (needs migrated data to index) **Note:** Can start Step
8a/8c in parallel with Steps 4-7. Step 8b depends on handlers writing unified
schema.

---

## Step 9: Build Router Skill (`/analyze`) ✅ COMPLETE (Wave 4, Session #270)

New skill at `.claude/skills/analyze/SKILL.md`. Per Decisions #1, #3, #18.

**Type detection patterns:**

| Input Pattern                                     | Detected Type  | Handler           |
| ------------------------------------------------- | -------------- | ----------------- |
| `github.com/<owner>/<repo>`                       | repo           | repo-analysis     |
| `*.github.io/*`, other URLs (not video platforms) | website        | website-analysis  |
| `youtube.com/*`, `youtu.be/*`, `tiktok.com/*`     | media          | media-analysis    |
| `*.pdf`, `*.md`, `*.txt`, local file paths        | document       | document-analysis |
| `gist.github.com/*`                               | document       | document-analysis |
| `arxiv.org/*`                                     | document       | document-analysis |
| No input                                          | synthesis mode | trigger synthesis |

**Override:** `--type=repo|website|media|document` forces type.

**Router flow:**

```
1. Parse input → detect type (or use --type override)
2. If no input → synthesis mode (Decision #18):
   - Default: synthesize all sources
   - --type flag narrows to single source type
   - Check last_synthesized_at, only process new entries (Decision #19)
3. If input → dispatch to handler skill:
   - Pass through --depth flag
   - Handler runs its full phase pipeline
   - Handler writes unified schema to .research/analysis/<slug>/
   - Handler writes extraction entries to extraction-journal.jsonl
4. After handler completes:
   - Run scripts/cas/update-index.js to update SQLite
   - Confirm indexing success
5. Present handler's routing menu
```

**SKILL.md should be thin** (~100-150 lines) — it's routing logic, not analysis
logic. All the heavy lifting is in the handler skills.

**Done when:** `/analyze <github-url>` correctly routes to repo-analysis.
`/analyze <website-url>` routes to website-analysis. `/analyze` with no input
triggers synthesis. `--type` override works. **Depends on:** Steps 4, 5, 6, 7
(needs all handlers ready), Step 8b (index update script)

---

## Step 10: Directory Migration + Data Migration ✅ COMPLETE (Wave 4, Session #270 — v3.0 migration to unified `.research/analysis/`)

Per Decisions #22, #24, #29. Two sub-steps.

**10a: Directory migration**

```
1. Create .research/analysis/
2. git mv .research/repo-analysis/<each-slug>/ → .research/analysis/<slug>/
3. git mv .research/website-analysis/<each-slug>/ → .research/analysis/<slug>/
4. Keep .research/repo-analysis/_*.md files (gap agents, analysis plan) in place
5. Update references in:
   - CONVENTIONS.md
   - repo-synthesis SKILL.md (reads from .research/analysis/ now)
   - website-synthesis SKILL.md (reads from .research/analysis/ now)
   - Any state files referencing old paths
6. Verify: every slug in source-slug-map.json resolves to new location
```

**10b: Schema migration + summary generation**

```
1. For each existing analysis.json in .research/analysis/:
   - Read current format (camelCase repo or snake_case website)
   - Normalize to unified schema
   - Generate 2-3 sentence summary from creatorLens or key_claims
   - Add id (UUID), tags (auto-generated), last_synthesized_at (null)
   - Validate with Zod
   - Write updated analysis.json
2. For each extraction-journal.jsonl entry:
   - Add source_analysis_id (link to parent analysis UUID)
   - Add tags (auto-generated from type + notes keywords)
   - Bump schema_version to 3.0
3. Run scripts/cas/rebuild-index.js to build initial SQLite index
4. Validation:
   - 29 source records in SQLite
   - 168+ extraction records in SQLite
   - All sources have summaries
   - Zod validation passes on all migrated files
```

**Done when:** All files in `.research/analysis/`, all analysis.json files
validate against unified schema, SQLite index built with correct counts.
**Depends on:** Steps 2, 8a

---

## Step 11: Build Recall Skill (`/recall`) ✅ COMPLETE (Wave 4, Session #270 — skill exists; functional E2E test pending in Step 15)

New skill at `.claude/skills/recall/SKILL.md`. Per Decisions #2, #27.

**Skill flow:**

```
1. Parse user input → determine query type:
   - Free text → FTS5 search via recall.js
   - --tag=X → tag filter
   - --type=X → source type filter
   - --sort=X → ordering
   - Combinations supported
2. Run scripts/cas/recall.js with parsed args
3. Present results:
   - For extraction queries: candidate name, source, type, novelty, tags, notes
   - For source queries: title, type, quality band, summary, tag list
4. Interactive follow-up:
   - "Read full analysis?" → Read analysis.json / creator-view.md
   - "Show all candidates from this source?" → filter by source
   - "Open in browser?" → provide URL
```

**SKILL.md should be thin** (~80-100 lines). The heavy lifting is in
`scripts/cas/recall.js`.

**Done when:** `/recall architecture patterns` returns relevant results.
`/recall --tag=#anti-pattern` works. `/recall --type=repo --sort=recent` works.
**Depends on:** Steps 8, 10 (needs index built with data)

---

## Step 12: Update .gitignore + CLAUDE.md ✅ COMPLETE (Wave 1, Session #268)

- Add to `.gitignore`:
  ```
  # Content Analysis System (derived, regenerable)
  .research/*.db
  .research/*.db-wal
  .research/*.db-shm
  ```
- Update CLAUDE.md Section 7 agent triggers:
  - Add `/analyze` trigger row
  - Add `/recall` trigger row
  - Update repo-analysis and website-analysis descriptions to note they're also
    accessible via `/analyze`

**Done when:** `.gitignore` updated. CLAUDE.md triggers table updated. **Depends
on:** None (can run anytime)

---

## Step 13: Synthesis Merge ✅ COMPLETE (Wave 4 + T29 sub-plan — closed Session #279; all 15 T29 steps marked complete, opportunities-ledger.jsonl shipped with 17 entries)

Update synthesis to work within the `/analyze` router and across all source
types. Per Decisions #18, #19.

1. Read existing repo-synthesis and website-synthesis for their approaches
2. Create unified synthesis logic that:
   - Reads from `.research/analysis/*/analysis.json` (all types)
   - Respects `--type` filter if provided
   - Checks `last_synthesized_at` — only processes new/changed entries
   - Produces cross-type insights (themes, gaps, patterns)
   - Updates `last_synthesized_at` on processed records
3. Synthesis output: `.research/analysis/SYNTHESIS.md` (replaces separate
   repo-synthesis and website-synthesis outputs)
4. Uses parallel agents for theme discovery + gap analysis (Decision #21)

**Done when:** `/analyze --synthesize` produces a cross-type synthesis.
Incremental mode only processes new entries. `--type` filter works. **Depends
on:** Steps 4, 5, 6, 7, 10 (needs all handlers + migrated data)

---

## Step 14: Audit Checkpoint ⏳ DEFERRED TO T38 (tracker T38 — `/skill-audit` on all 7 CAS skills: analyze, recall, repo-analysis, website-analysis, document-analysis, media-analysis, synthesize). T28 closed Session #287 without this step per REMAINING_CAS_TASKS.md Step C protocol; T38 unblocked for follow-up.

Run code-reviewer agent on all new and modified files:

- All new skills (analyze, recall, document-analysis, media-analysis)
- All modified skills (repo-analysis, website-analysis, CONVENTIONS.md)
- All new scripts (scripts/lib/analysis-schema.js, scripts/cas/\*.js)
- All new agents (document-analyst.md, media-analyst.md)
- Migration script output (spot-check 3 migrated analysis.json files)

**Verify:**

- All 4 handler skills have matching phase structures
- All analysis.json outputs validate against Zod schema
- `/analyze` correctly routes all 4 input types
- `/recall` returns results for free-text, tag, type, and structured queries
- SQLite index counts match file counts
- Tag suggestions work in each handler
- Synthesis processes only new entries
- Backup files exist for modified skills

**Done when:** All findings addressed or tracked in TDMS. **Depends on:** All
previous steps

---

## Step 15: End-to-End Verification ✅ COMPLETE (Session #287, 2026-04-18 — fresh source `y2z-monolith`, all 6 handoff points pass; 4/4 recall queries; `last_synthesized_at` mutation validated; SQLite rebuild OK 37 sources/379 extractions)

Test the complete flow:

1. `/analyze https://github.com/<some-repo>` → routes to repo-analysis → unified
   output → indexed → recallable
2. `/analyze https://some-website.com` → routes to website-analysis → unified
   output → indexed
3. `/analyze path/to/document.pdf` → routes to document-analysis → unified
   output → indexed
4. `/analyze https://youtube.com/watch?v=xxx` → routes to media-analysis →
   captions → unified output → indexed
5. `/recall architecture` → returns results across all 4 types
6. `/recall --tag=#anti-pattern --type=repo` → filtered results
7. `/analyze --synthesize` → cross-type synthesis, incremental
8. `/analyze --synthesize --type=document` → type-scoped synthesis

**Done when:** All 8 flows complete successfully. **Depends on:** Step 14

---

## Parallelization Guide

```
SEQUENTIAL DEPENDENCIES:
  Step 1 (backup) → Steps 4, 5 (modify existing skills)
  Step 2 (schema) → Steps 3, 4, 5, 6, 7, 8, 10
  Step 4 (repo template) → Steps 5, 6, 7 (follow template)

PARALLEL OPPORTUNITIES:
  Steps 1 + 2 + 12 (no dependencies between them)
  Steps 6 + 7 (both follow template, independent source types)
  Steps 8a + 8c (rebuild and recall scripts are independent)
  Step 10a + 10b can start once Step 2 is done (file move + schema migration)
  Step 11 can start once Step 8c is done (recall skill wraps recall script)
```

---

## Build Order (recommended)

| Wave       | Steps         | What                                                | Sessions      |
| ---------- | ------------- | --------------------------------------------------- | ------------- |
| **Wave 1** | 1, 2, 3, 12   | Foundation: backups, schema, conventions, gitignore | ~1 session    |
| **Wave 2** | 4, 5          | Modify existing skills to unified schema            | ~1 session    |
| **Wave 3** | 6, 7, 8       | New handlers + SQLite infrastructure                | ~1-2 sessions |
| **Wave 4** | 9, 10, 11, 13 | Router, migration, recall, synthesis                | ~1 session    |
| **Wave 5** | 14, 15        | Audit + E2E verification                            | ~1 session    |
