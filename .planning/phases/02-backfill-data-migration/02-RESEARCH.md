<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Phase 2: Backfill & Data Migration - Research

**Researched:** 2026-02-28 **Domain:** Markdown parsing, JSONL migration, data
deduplication, archive reconciliation **Confidence:** HIGH

## Summary

Phase 2 transforms 13 markdown archive files + 1 active log into validated v2
JSONL records using the schemas and utilities built in Phase 1. The core
challenge is parsing 406+ reviews from highly inconsistent markdown formats that
evolved over 2 months, handling 3 overlapping archive ranges, 64 known-skipped
IDs, and deduplicating 654 review-sourced entries in MASTER_DEBT.jsonl.

The existing codebase provides significant infrastructure to build on:
`scripts/sync-reviews-to-jsonl.js` already parses markdown reviews into a v1
JSON shape (numeric id, date, title, source, pr, patterns, fixed/deferred/
rejected, severity counts, learnings). `scripts/check-review-archive.js` already
tracks known-skipped IDs, known-duplicate IDs, and performs gap analysis. The
`scripts/archive-reviews.js` script handles the markdown entry header detection
(`matchEntryHeader`). The Phase 1 schemas, write utility (`appendRecord`), and
read utility (`readValidatedJsonl`) are ready for consumption.

The main work is: (1) a parser that extracts v2-shaped records from markdown,
(2) overlap/gap resolution logic across 13 archives, (3) a migration script that
validates + transforms the existing `.claude/state/reviews.jsonl` records, (4)
MASTER_DEBT.jsonl dedup for review-sourced items, and (5) data corrections for
specific known errors.

**Primary recommendation:** Build an idempotent `backfill-reviews.ts` script in
`scripts/reviews/` that reads all 13 archives + active log, parses to v2 shape,
deduplicates overlapping ranges, and writes validated JSONL. Reuse the existing
parser patterns from `sync-reviews-to-jsonl.js` but output v2 schema records
instead of v1.

## Standard Stack

### Core

| Library             | Version  | Purpose                 | Why Standard                         |
| ------------------- | -------- | ----------------------- | ------------------------------------ |
| Zod                 | ^4.2.1   | Schema validation       | Phase 1 schemas already defined      |
| Node.js test        | built-in | Test runner             | Project standard                     |
| TypeScript          | strict   | Implementation          | Project mandate                      |
| safe-fs.js          | existing | File locking + symlinks | Required by CLAUDE.md security rules |
| read-jsonl.js       | existing | JSONL reading           | Existing utility                     |
| write-jsonl.ts (v2) | Phase 1  | Validated JSONL writes  | `appendRecord` with Zod validation   |

### Supporting

| Library               | Version  | Purpose                | When to Use                      |
| --------------------- | -------- | ---------------------- | -------------------------------- |
| check-review-archive  | existing | Archive health checks  | Pre/post validation              |
| sync-reviews-to-jsonl | existing | Parser reference       | Reuse parsing patterns           |
| archive-reviews.js    | existing | Entry header detection | Reuse `matchEntryHeader` pattern |

### Alternatives Considered

| Instead of       | Could Use          | Tradeoff                                        |
| ---------------- | ------------------ | ----------------------------------------------- |
| Custom MD parser | markdown-it/remark | Over-engineering: reviews are heading-delimited |
| Batch file write | Line-by-line write | Batch is faster for 400+ records                |

**Installation:** No new dependencies needed. All tooling already exists.

## Architecture Patterns

### Recommended Project Structure

```
scripts/reviews/
  lib/
    schemas/         # Phase 1 (existing)
    completeness.ts  # Phase 1 (existing)
    read-jsonl.ts    # Phase 1 (existing)
    write-jsonl.ts   # Phase 1 (existing)
    parse-review.ts  # NEW: markdown -> v2 record parser
    parse-retro.ts   # NEW: markdown -> v2 retro record parser
  backfill-reviews.ts  # NEW: main backfill orchestrator
  migrate-existing.ts  # NEW: transform v1 state -> v2 JSONL
  dedup-debt.ts        # NEW: MASTER_DEBT review-sourced dedup
  __tests__/
    parse-review.test.ts
    backfill-reviews.test.ts
    migrate-existing.test.ts

data/
  reviews.jsonl        # NEW: v2 output (406 records)
  retros.jsonl         # NEW: v2 retro output
  deferred-items.jsonl # NEW: v2 deferred items
```

### Pattern 1: Idempotent Backfill Script

**What:** Script reads all source markdown, parses every review, deduplicates,
validates, writes fresh JSONL output. Running it twice produces identical
output.

**When to use:** For the initial backfill and any subsequent corrections.

**Example:**

```typescript
// Pseudocode for backfill-reviews.ts
const ARCHIVE_FILES = [
  // Ordered by ID range (ascending)
  "REVIEWS_1-40.md",
  "REVIEWS_42-60.md",
  "REVIEWS_61-100.md",
  "REVIEWS_101-136.md", // table-indexed, special parser needed
  "REVIEWS_137-179.md",
  "REVIEWS_180-201.md",
  "REVIEWS_202-212.md",
  "REVIEWS_213-284.md",
  "REVIEWS_285-346.md",
  "REVIEWS_347-369.md", // overlap: 354-369
  "REVIEWS_354-357.md", // overlap: 354-357
  "REVIEWS_358-388.md", // overlap: 358-369, 385-388
  "REVIEWS_385-393.md", // overlap: 385-393
];

// Parse all sources, building Map<reviewId, ReviewRecord[]>
// For overlaps: prefer the file with fuller content
// For known-skipped IDs: emit stub records with completeness: "stub"
// Validate every record against ReviewRecord schema before writing
```

### Pattern 2: Two-Phase Parser (Header Detection + Content Extraction)

**What:** First pass identifies entry boundaries using heading patterns. Second
pass extracts structured fields from the content block.

**When to use:** This is how both `archive-reviews.js` and
`sync-reviews-to-jsonl.js` already work. Reuse the same approach.

**Existing header pattern:**

```typescript
// From archive-reviews.js line 135:
const reviewMatch = line.match(/^#{2,4}\s+Review\s+#(\d+)/);
// From sync-reviews-to-jsonl.js line 183:
const headerMatch = line.match(/^#{2,4}\s+Review\s+#(\d+):?\s*(.*)/);
```

### Pattern 3: Overlap Resolution Strategy

**What:** When a review ID appears in multiple archive files, select the
authoritative version based on content completeness.

**Decision rules for the 3 overlaps:**

1. **REVIEWS_347-369 vs REVIEWS_354-357**: The 354-357 file has dedicated,
   detailed entries. The 347-369 file also has them. Choose the file with
   `#### Review #N` heading format (more detail) over table-indexed summaries.

2. **REVIEWS_347-369 vs REVIEWS_358-388**: Reviews 358-369 appear in both. The
   358-388 file has reassigned IDs (366-369 were reassigned per
   `KNOWN_DUPLICATE_IDS` in check-review-archive.js). Both copies contain unique
   learnings. **Keep both as separate records with different origin metadata**
   (original ID + reassigned ID).

3. **REVIEWS_358-388 vs REVIEWS_385-393**: The 358-388 file's actual max review
   ID is #384 (filename is misleading). The 385-393 file starts at #385. **No
   actual overlap** -- the filename just says 388.

### Pattern 4: Completeness Tier Assignment

**What:** Each parsed review gets a completeness tier based on what fields were
actually extractable from the markdown.

**Rules:**

```typescript
// full: has title, pr, total, fixed, deferred, patterns, learnings
// partial: has title + at least total or pr
// stub: only has id and date (e.g., from table-indexed summaries)
```

### Anti-Patterns to Avoid

- **Parsing PR numbers from retro tables as review IDs:** The
  `check-review-archive.js` already handles this with `useTable` only when
  `!headings.found`. The backfill must do the same.
- **Using numeric IDs as the v2 `id` field:** The v2 schema uses string IDs like
  `rev-2026-0101-pr389`. Must generate string IDs from review number + date.
- **Writing reviews.jsonl in-place during parsing:** Parse ALL first, resolve
  overlaps, THEN write the output file atomically.
- **Ignoring retrospective entries:** Archives contain `### PR #N Retrospective`
  sections that should become RetroRecord entries.

## Don't Hand-Roll

| Problem                   | Don't Build          | Use Instead                             | Why                                      |
| ------------------------- | -------------------- | --------------------------------------- | ---------------------------------------- |
| Entry header detection    | New regex patterns   | Existing `matchEntryHeader` patterns    | Already handles ##/###/#### variants     |
| Severity count extraction | New regex approach   | `parseSeverityCount` from sync script   | Handles both "N LABEL" and "Label: N"    |
| Known-skipped ID list     | Manual enumeration   | `KNOWN_SKIPPED_IDS` from check script   | Already verified via git log, 64 entries |
| Known-duplicate ID list   | Manual enumeration   | `KNOWN_DUPLICATE_IDS` from check script | Verified session #195                    |
| File locking              | Custom locking       | `safe-fs.js` withLock                   | Advisory locking + symlink guards        |
| Schema validation         | Manual field checks  | Zod schema.parse()                      | Phase 1 schemas are already defined      |
| JSONL writing             | Custom JSON+newline  | `appendRecord` from write-jsonl.ts      | Validates + locks + writes atomically    |
| Content hash computation  | Custom hash function | `content_hash` field in MASTER_DEBT     | Already used for dedup                   |

**Key insight:** The existing `sync-reviews-to-jsonl.js` contains ~300 lines of
battle-tested markdown parsing logic. The backfill script should import/reuse
its field extraction functions rather than rewriting them. The main difference
is the output format (v2 schema with completeness model vs v1 flat JSON).

## Common Pitfalls

### Pitfall 1: Inconsistent Markdown Formats Across Archives

**What goes wrong:** The 13 archives span 2 months of evolution. Early archives
(#1-40) use `**PR:** branch-name` format. Later archives (#285+) use
`**Source:** SonarCloud (N) + Qodo (N)` format. Some (#101-136) are table-only
summaries with no heading-based entries.

**Why it happens:** The review format evolved organically as the project
matured.

**How to avoid:** Build a parser that handles ALL observed formats:

- `#### Review #N: Title (YYYY-MM-DD)` -- most common
- `#### Review #N — Title (YYYY-MM-DD)` -- em-dash variant
- `#### Review #N: Title` -- no date in header
- Table-only format (REVIEWS_101-136) with `| #N |` rows
- Bullet-list format (newer reviews): `- **Source**: ...`, `- **Items**: ...`

**Warning signs:** Parser returns 0 reviews for a known-populated archive file.

### Pitfall 2: Review ID #41 and the 64 Known-Skipped IDs

**What goes wrong:** #41 was never assigned. There are 64 total known-skipped
IDs that were never used for individual reviews. If the backfill script treats
these as gaps, it will try to find reviews that don't exist.

**Why it happens:** Numbering skips from batch consolidations, PR round
grouping, and historical renumbering.

**How to avoid:** Import `KNOWN_SKIPPED_IDS` set from `check-review-archive.js`
(or define the same set). Known-skipped IDs should NOT generate stub records --
they simply don't exist.

**Warning signs:** Backfill reports "missing reviews" for IDs in the skip list.

### Pitfall 3: Duplicate Review IDs (366-369)

**What goes wrong:** Reviews #366-369 legitimately exist in TWO archive files
with different content. If the parser just takes "first seen" or "last seen",
one copy's unique learnings are lost.

**Why it happens:** PR #383 R5-R8 were originally assigned these IDs, then later
different reviews for PRs #384/#389/#394 were also assigned the same numbers.

**How to avoid:** For `KNOWN_DUPLICATE_IDS` (366-369), emit both records with
disambiguating IDs: `rev-N-a` (from REVIEWS_347-369) and `rev-N-b` (from
REVIEWS_358-388). Document the provenance in the `origin.session` field.

**Warning signs:** JSONL has duplicate IDs (the existing state file already
shows #367 and #368 appearing twice).

### Pitfall 4: REVIEWS_101-136.md Has No Review Headings

**What goes wrong:** This archive uses table-indexed summaries, not
`#### Review #N` headings. A heading-based parser returns 0 reviews.

**Why it happens:** It was an early summary-only archive format.

**How to avoid:** Implement the table parser path that `check-review-archive.js`
already uses (`parseTableIds`). For these, emit stub-tier records with
`completeness: "stub"` and `completeness_missing` listing all content fields.

**Warning signs:** "REVIEWS_101-136.md: 0 reviews parsed" in backfill output.

### Pitfall 5: Within-File Duplicates

**What goes wrong:** The health check shows within-file duplicates: #21 (4x in
1-40), #30 (5x in 1-40), #194 (2x in 180-201), #376/#377/#378/#375 (in 358-388),
#73 (in 61-100). The parser must handle these.

**Why it happens:** Reviews were mentioned in multiple contexts within the same
archive (e.g., referenced in a retro table AND as a heading).

**How to avoid:** When extracting from heading-based entries, only count entries
that have `#### Review #N` as a heading start. References to review numbers
within body text should not create duplicate records. After parsing, deduplicate
by keeping the entry with the most content.

**Warning signs:** More records than expected for a given archive file.

### Pitfall 6: MASTER_DEBT.jsonl Dedup Complexity

**What goes wrong:** 654 review-sourced entries, 16 duplicate content hashes,
plus potential title-based duplicates. The dedup must preserve the `id`
(DEBT-NNNN) sequence and not break the deduped.jsonl mirror.

**Why it happens:** Multiple intake pipelines ingested review findings at
different times.

**How to avoid:** Use content_hash as the primary dedup key. After dedup, MUST
also update `docs/technical-debt/raw/deduped.jsonl` (per MEMORY.md: "Any script
that appends to MASTER_DEBT.jsonl MUST also append to raw/deduped.jsonl").

**Warning signs:** `generate-views.js` run after dedup produces different
results than expected.

### Pitfall 7: The v2 ID Format

**What goes wrong:** The existing `.claude/state/reviews.jsonl` uses numeric IDs
(`"id": 364`). The v2 schema expects string IDs (`"id": "rev-2026-0312-pr389"`).
A migration script must convert numeric -> string format.

**Why it happens:** v1 was ad-hoc; v2 is schema-driven.

**How to avoid:** Define a deterministic ID generation function:
`rev-{reviewNumber}` or `rev-{date}-{reviewNumber}`. The ID must be stable
across re-runs (idempotent).

**Warning signs:** Zod validation fails on `id` field for numeric values.

## Code Examples

### Markdown Review Parser (reusing existing patterns)

````typescript
// Source: scripts/sync-reviews-to-jsonl.js (adapted for v2)
import { ReviewRecord, type ReviewRecordType } from "./schemas";

interface ParsedEntry {
  reviewNumber: number;
  date: string | null;
  title: string;
  rawLines: string[];
  sourceFile: string;
}

function parseArchiveFile(filePath: string, content: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  const lines = content.split("\n");
  let current: ParsedEntry | null = null;
  let inFence = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // Match review headers: #### Review #N: Title (YYYY-MM-DD)
    const match = line.match(/^#{2,4}\s+Review\s+#(\d+):?\s*(.*)/);
    if (match) {
      if (current) entries.push(current);
      const id = parseInt(match[1], 10);
      const rest = match[2].trim();
      const dateMatch = rest.match(/\((\d{4}-\d{2}-\d{2})\)\s*$/);

      current = {
        reviewNumber: id,
        date: dateMatch ? dateMatch[1] : null,
        title: dateMatch ? rest.slice(0, rest.lastIndexOf("(")).trim() : rest,
        rawLines: [],
        sourceFile: filePath,
      };
      continue;
    }

    if (current) current.rawLines.push(line);
  }
  if (current) entries.push(current);
  return entries;
}
````

### V2 Record Construction from Parsed Entry

```typescript
function toV2Record(entry: ParsedEntry): ReviewRecordType {
  const raw = entry.rawLines.join("\n");
  const missing: string[] = [];

  // Extract structured fields (reuse sync script patterns)
  const pr = extractPR(raw);
  const total = extractTotal(raw);
  const fixed = extractCount(raw, "fixed");
  const deferred = extractCount(raw, "deferred");
  const rejected = extractCount(raw, "rejected");
  const patterns = extractPatterns(raw);
  const learnings = extractLearnings(raw);
  const severity = extractSeverity(raw);

  // Track missing fields
  if (!entry.title) missing.push("title");
  if (!pr) missing.push("pr");
  if (!total && total !== 0) missing.push("total");
  // ... etc

  const completeness =
    missing.length === 0 ? "full" : missing.length <= 5 ? "partial" : "stub";

  return {
    id: `rev-${entry.reviewNumber}`,
    date: entry.date || "1970-01-01", // fallback for missing dates
    schema_version: 1,
    completeness,
    completeness_missing: missing,
    origin: {
      type: "backfill",
      tool: "backfill-reviews.ts",
    },
    title: entry.title || null,
    pr: pr || null,
    source: entry.sourceFile,
    total: total ?? null,
    fixed: fixed ?? null,
    deferred: deferred ?? null,
    rejected: rejected ?? null,
    patterns: patterns.length > 0 ? patterns : null,
    learnings: learnings.length > 0 ? learnings : null,
    severity_breakdown: severity,
    per_round_detail: null,
    rejection_analysis: null,
    ping_pong_chains: null,
  };
}
```

### Overlap Resolution

```typescript
const KNOWN_DUPLICATE_IDS = new Set([366, 367, 368, 369]);

function resolveOverlaps(
  allEntries: Map<number, ParsedEntry[]>
): ParsedEntry[] {
  const resolved: ParsedEntry[] = [];

  for (const [id, copies] of allEntries) {
    if (copies.length === 1) {
      resolved.push(copies[0]);
      continue;
    }

    if (KNOWN_DUPLICATE_IDS.has(id)) {
      // Emit both with disambiguated IDs
      copies.forEach((c, i) => {
        resolved.push({
          ...c,
          reviewNumber: id, // keep original for reference
          // ID will be rev-366-a, rev-366-b etc.
        });
      });
      continue;
    }

    // For non-known duplicates: keep the copy with most content
    const best = copies.reduce((a, b) =>
      a.rawLines.length > b.rawLines.length ? a : b
    );
    resolved.push(best);
  }

  return resolved;
}
```

### MASTER_DEBT Dedup

```typescript
function dedupReviewSourced(items: DebtItem[]): DebtItem[] {
  const seen = new Map<string, DebtItem>(); // content_hash -> item

  for (const item of items) {
    if (item.source !== "review" && item.source !== "pr-review") {
      // Keep non-review items as-is
      continue;
    }

    if (item.content_hash && seen.has(item.content_hash)) {
      // Duplicate found -- keep the one with the lower DEBT-NNNN ID
      const existing = seen.get(item.content_hash)!;
      // Log the duplicate for audit trail
      continue;
    }

    if (item.content_hash) {
      seen.set(item.content_hash, item);
    }
  }

  return [...seen.values()];
}
```

## State of the Art

| Old Approach (v1)             | Current Approach (v2)             | When Changed | Impact                          |
| ----------------------------- | --------------------------------- | ------------ | ------------------------------- |
| Numeric review IDs (`364`)    | String IDs (`rev-364`)            | Phase 1      | Supports multiple record types  |
| No schema validation          | Zod validation on write           | Phase 1      | Data integrity guaranteed       |
| Flat JSON shape               | Completeness-tiered records       | Phase 1      | Handles partial data gracefully |
| `.claude/state/reviews.jsonl` | `data/reviews.jsonl` (or similar) | Phase 2      | Dedicated data directory        |
| sync-reviews-to-jsonl.js (v1) | backfill-reviews.ts (v2)          | Phase 2      | Full history, not just active   |
| No retro records              | Separate retros.jsonl             | Phase 2      | Retrospectives as first-class   |

**Deprecated/outdated:**

- `.claude/state/reviews.jsonl` (v1 format): Will be replaced by v2 JSONL
- `sync-reviews-to-jsonl.js` current behavior: Parser logic reusable, but output
  format changes

## Key Data Points from Codebase Analysis

### Archive File Inventory (13 files)

| File               | ID Range | Count | Format        | Overlaps With                                     |
| ------------------ | -------- | ----- | ------------- | ------------------------------------------------- |
| REVIEWS_1-40.md    | 1-40     | 47    | heading       | (has within-file dups)                            |
| REVIEWS_42-60.md   | 42-60    | 19    | heading       | --                                                |
| REVIEWS_61-100.md  | 61-100   | 20    | heading       | (has #73 dup)                                     |
| REVIEWS_101-136.md | 92-136   | 38    | table-only    | 92-100 overlap w/ 61-100                          |
| REVIEWS_137-179.md | 137-179  | 27    | heading       | --                                                |
| REVIEWS_180-201.md | 180-201  | 22    | heading       | (has #194 dup)                                    |
| REVIEWS_202-212.md | 202-212  | 4     | heading       | --                                                |
| REVIEWS_213-284.md | 213-284  | 55    | heading       | --                                                |
| REVIEWS_285-346.md | 285-346  | 60    | heading       | --                                                |
| REVIEWS_347-369.md | 347-369  | 10    | heading       | 354-369                                           |
| REVIEWS_354-357.md | 354-357  | 4     | heading       | 354-357                                           |
| REVIEWS_358-388.md | 358-384  | 35    | heading+retro | 358-369, name misleading                          |
| REVIEWS_385-393.md | 385-393  | 9     | heading       | name suggests overlap but actual IDs start at 385 |

**Active log:** Reviews #394-#407 (15 entries)

### Known Issues to Fix

1. **3 overlapping ranges:**
   - 92-100: REVIEWS_101-136 (table) vs REVIEWS_61-100 (heading) -- heading file
     has richer content, table file is summary
   - 354-369: REVIEWS_347-369 vs REVIEWS_354-357 and REVIEWS_358-388
   - 366-369: Known-duplicate IDs (historical ID reuse, both copies valid)

2. **Within-file duplicates:** #21 (4x), #30 (5x), #73 (2x), #194 (2x), #375-378
   (2-3x), #397 (2x in active log)

3. **64 known-skipped IDs:** Never assigned (verified via git log)

4. **MASTER_DEBT.jsonl:** 654 review-sourced entries, 16 duplicate
   content_hashes. Must also update `raw/deduped.jsonl` after dedup.

5. **Existing reviews.jsonl (v1):** 50 records, covers #364-411 + 16 retros. Has
   duplicate IDs (#367, #368). Must be migrated to v2 format.

### Output Location Decision

The v2 JSONL output location needs to be determined. Options:

- `data/reviews.jsonl` -- new dedicated directory
- `scripts/reviews/output/reviews.jsonl` -- co-located with scripts
- `.claude/state/reviews-v2.jsonl` -- alongside v1

**Recommendation:** Create `data/ecosystem-v2/` directory as the canonical
location for all v2 JSONL files. This separates data from code and from the old
state directory.

## Open Questions

1. **Output directory location**
   - What we know: v1 lives in `.claude/state/reviews.jsonl`
   - What's unclear: Where should v2 JSONL files live?
   - Recommendation: `data/ecosystem-v2/` as canonical v2 data directory

2. **What to do with v1 reviews.jsonl after migration**
   - What we know: 50 records covering recent reviews (#364-411)
   - What's unclear: Keep for backward compatibility or remove?
   - Recommendation: Keep v1 file but stop writing to it; migration script
     converts all v1 records to v2

3. **Retro record completeness for older reviews**
   - What we know: Retrospectives exist in later archives (#358-388, #385-393,
     active log) but not in early ones
   - What's unclear: Should we create stub retro records for reviews that had
     process improvements but no formal retro section?
   - Recommendation: Only create RetroRecord for explicit
     `### PR #N Retrospective` sections; don't fabricate retros from review
     content

4. **BKFL-04 "Retro arithmetic tagging" specifics**
   - What we know: Retros have metrics (total_findings, fix_rate,
     pattern_recurrence)
   - What's unclear: What computed metrics need to be tagged?
   - Recommendation: Compute fix_rate from fixed/total, pattern_recurrence from
     cross-review pattern matching

5. **BKFL-05 "Consolidation counter fix" specifics**
   - What we know: consolidation.json shows number 4, last review 406
   - What's unclear: What specific miscounts need correcting?
   - Recommendation: Research during implementation by comparing consolidation
     output with archive data

## Sources

### Primary (HIGH confidence)

- `scripts/sync-reviews-to-jsonl.js` -- existing v1 parser (full source read)
- `scripts/check-review-archive.js` -- archive health checker with known IDs
- `scripts/archive-reviews.js` -- entry header detection patterns
- `scripts/reviews/lib/schemas/*.ts` -- Phase 1 v2 schemas (all read)
- `scripts/reviews/lib/write-jsonl.ts` -- Phase 1 write utility
- `scripts/reviews/lib/read-jsonl.ts` -- Phase 1 read utility
- `docs/archive/REVIEWS_*.md` -- all 13 archive files examined
- `docs/AI_REVIEW_LEARNINGS_LOG.md` -- active log (2190 lines)
- `.claude/state/reviews.jsonl` -- existing v1 data (50 records)
- `docs/technical-debt/MASTER_DEBT.jsonl` -- 8354 entries analyzed

### Secondary (MEDIUM confidence)

- Archive health check output -- ran `check-review-archive.js` live, confirmed
  current state: 13 issues, 343 reviews found, 64 skipped, 0 missing

### Tertiary (LOW confidence)

- BKFL-04/05/06 specifics -- requirements reference specific fixes but exact
  details need investigation during implementation

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all tools exist in the repo, verified
- Architecture: HIGH -- patterns derived from actual codebase analysis
- Pitfalls: HIGH -- derived from running health checks and reading actual data
- Data specifics: HIGH -- counted from actual files, not estimated
- BKFL-04/05/06 details: LOW -- requirements reference fixes without full
  context

**Research date:** 2026-02-28 **Valid until:** Stable (data is project-specific,
not library-dependent)
