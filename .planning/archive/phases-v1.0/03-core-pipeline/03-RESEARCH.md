<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Phase 3: Core Pipeline - Research

**Researched:** 2026-02-28 **Domain:** Skill JSONL integration, promotion
automation, template generation, invocation tracking **Confidence:** HIGH

## Summary

Phase 3 rewires the pr-review and pr-retro skills to write structured JSONL as
their source of truth (instead of markdown), auto-creates deferred items,
unifies invocation tracking, and builds a merged promotion pipeline that detects
pattern recurrence and auto-generates enforcement rules, CODE_PATTERNS entries,
CLAUDE.md anti-patterns, and FIX_TEMPLATE stubs.

The codebase has all the building blocks ready from Phases 1-2:

- **Zod schemas** for all 5 JSONL types live in `scripts/reviews/lib/schemas/`
  (ReviewRecord, RetroRecord, DeferredItemRecord, InvocationRecord,
  WarningRecord)
- **Write utility** `appendRecord()` in `scripts/reviews/lib/write-jsonl.ts`
  handles Zod validation, symlink guards, and advisory locking
- **Read utility** `readValidatedJsonl()` in `scripts/reviews/lib/read-jsonl.ts`
  returns typed valid records + warnings
- **Backfilled data** in `data/ecosystem-v2/reviews.jsonl` (406+ records) and
  `data/ecosystem-v2/retros.jsonl`
- **Existing consolidation** in `scripts/run-consolidation.js` already does
  pattern extraction from `.claude/state/reviews.jsonl` and auto-appends to
  CODE_PATTERNS.md

The primary challenge is integrating these building blocks into the live skill
execution flow. Skills are markdown files in `.claude/skills/` that Claude reads
and follows as instructions -- they are not executable code. The JSONL writes
must happen via scripts that the skill instructions call, or inline operations
the skill directs Claude to perform.

**Primary recommendation:** Build thin CLI scripts that skills invoke at the
right step (e.g.,
`node scripts/reviews/write-review.js --pr 399 --data '{...}'`), keeping skills
as instruction documents that orchestrate the pipeline. The merged promotion
script replaces `run-consolidation.js` with expanded capabilities.

## Standard Stack

### Core

| Library             | Version  | Purpose                | Why Standard                            |
| ------------------- | -------- | ---------------------- | --------------------------------------- |
| Zod                 | ^4.2.1   | Schema validation      | Phase 1 schemas already defined         |
| TypeScript          | strict   | All new scripts        | Project mandate, no `any`               |
| Node.js test        | built-in | Test runner            | Project standard                        |
| safe-fs.js          | existing | Symlink guards + locks | Required by CLAUDE.md security rules    |
| write-jsonl.ts (v2) | Phase 1  | Validated JSONL writes | `appendRecord` with Zod validation      |
| read-jsonl.ts (v2)  | Phase 1  | Validated JSONL reads  | `readValidatedJsonl` with typed results |

### Supporting

| Library                     | Version  | Purpose                  | When to Use                    |
| --------------------------- | -------- | ------------------------ | ------------------------------ |
| run-consolidation.js        | existing | Pattern extraction logic | Reference/merge into promotion |
| check-pattern-compliance.js | existing | Enforcement rule format  | Target format for auto-rules   |
| intake-pr-deferred.js       | existing | Deferred item creation   | Reference for auto-deferred    |
| sync-reviews-to-jsonl.js    | existing | Markdown->JSONL sync     | Legacy during dual-write       |

### Alternatives Considered

| Instead of         | Could Use             | Tradeoff                                         |
| ------------------ | --------------------- | ------------------------------------------------ |
| CLI scripts        | Direct file writes    | Scripts ensure validation; skills are text-only  |
| Merged promotion   | Keep separate scripts | Consolidation + promotion are tightly coupled    |
| Auto CLAUDE.md gen | Manual updates        | Automation prevents drift; manual is error-prone |

**Installation:** No new packages needed. All infrastructure exists from
Phase 1.

## Architecture Patterns

### Recommended Project Structure

```
scripts/reviews/
  lib/
    schemas/             # Phase 1 (existing, unchanged)
    write-jsonl.ts       # Phase 1 (existing, unchanged)
    read-jsonl.ts        # Phase 1 (existing, unchanged)
    completeness.ts      # Phase 1 (existing, unchanged)
  write-review-record.ts     # PIPE-01: CLI to append ReviewRecord
  write-retro-record.ts      # PIPE-02: CLI to append RetroRecord
  write-deferred-items.ts    # PIPE-03: CLI to auto-create deferred items
  write-invocation.ts        # PIPE-04: CLI to track invocations
  render-reviews-to-md.ts    # PIPE-10: JSONL -> markdown renderer
  __tests__/
    write-review-record.test.ts
    write-retro-record.test.ts
    write-deferred-items.test.ts
    render-reviews-to-md.test.ts
    promotion-pipeline.test.ts

scripts/
  promote-patterns.ts         # PIPE-05/06: Merged promotion script
  generate-claude-antipatterns.ts  # PIPE-07: CLAUDE.md auto-gen
  generate-fix-template-stubs.ts   # PIPE-08: FIX_TEMPLATE auto-stubs

data/ecosystem-v2/
  reviews.jsonl           # Backfilled + new (Phase 2 + Phase 3)
  retros.jsonl            # Backfilled + new
  deferred-items.jsonl    # NEW: auto-created from reviews
  invocations.jsonl       # NEW: unified invocation log
  warnings.jsonl          # NEW: system warnings

.claude/skills/
  pr-review/SKILL.md      # Modified: add JSONL write step
  pr-retro/SKILL.md       # Modified: add JSONL write + dual-write
  add-debt/SKILL.md       # Modified: note auto-creation path
```

### Pattern 1: Skill-Script Bridge

**What:** Skills (markdown instructions) invoke CLI scripts for structured data
operations. Skills remain human-readable orchestration documents; scripts handle
validation and I/O.

**When to use:** Any time a skill needs to persist structured data.

**Example:**

```typescript
// write-review-record.ts - CLI entry point
// Usage: node scripts/reviews/dist/write-review-record.js --data '{"pr":399,...}'

import { appendRecord } from "./lib/write-jsonl";
import { ReviewRecord, type ReviewRecordType } from "./lib/schemas";
import { findProjectRoot } from "./lib/find-project-root";
import * as path from "path";

const root = findProjectRoot(__dirname);
const REVIEWS_FILE = path.join(root, "data", "ecosystem-v2", "reviews.jsonl");

// Parse CLI args, validate with Zod, append to JSONL
const data = JSON.parse(
  process.argv.find((a) => a.startsWith("--data="))?.slice(7) || "{}"
);
const record: ReviewRecordType = ReviewRecord.parse(data);
appendRecord(REVIEWS_FILE, record, ReviewRecord);
console.log(`Wrote review ${record.id} to reviews.jsonl`);
```

**In the skill SKILL.md:**

```markdown
### Step 7.5: Write JSONL Record

After completing the review, create the JSONL record:

\`\`\`bash cd scripts/reviews && npx tsc && node dist/write-review-record.js \
 --data '{"id":"rev-N","date":"YYYY-MM-DD","schema_version":1,...}' \`\`\`
```

### Pattern 2: Auto-Deferred Item Creation

**What:** When a review JSONL record is written with deferred > 0, the script
automatically creates corresponding DeferredItemRecord entries. No separate
`/add-debt` invocation needed for JSONL tracking (TDMS integration via
`/add-debt` still required for MASTER_DEBT.jsonl).

**When to use:** PIPE-03 -- automatic deferred item tracking.

**Example:**

```typescript
// write-deferred-items.ts
// Called after review record is written, with deferred item details

import { appendRecord } from "./lib/write-jsonl";
import { DeferredItemRecord, type DeferredItemRecordType } from "./lib/schemas";

export function createDeferredItems(
  reviewId: string,
  items: Array<{ finding: string; reason?: string; severity?: string }>,
  date: string
): DeferredItemRecordType[] {
  const records: DeferredItemRecordType[] = [];
  for (let i = 0; i < items.length; i++) {
    const record: DeferredItemRecordType = DeferredItemRecord.parse({
      id: `${reviewId}-deferred-${i + 1}`,
      date,
      schema_version: 1,
      completeness: "full",
      completeness_missing: [],
      origin: { type: "pr-review", tool: "write-deferred-items.ts" },
      review_id: reviewId,
      finding: items[i].finding,
      reason: items[i].reason ?? null,
      severity: items[i].severity ?? null,
      status: "open",
      defer_count: 1,
      promoted_to_debt: false,
    });
    appendRecord(DEFERRED_FILE, record, DeferredItemRecord);
    records.push(record);
  }
  return records;
}
```

### Pattern 3: Dual-Write Transition (PIPE-02)

**What:** pr-retro writes to BOTH the new `retros.jsonl` AND the legacy markdown
format during transition. The JSONL record is source of truth; the markdown is a
view for backward compatibility.

**When to use:** PIPE-02 transition period only.

**Example:**

```markdown
### Step 4: Save to Log (Dual-Write)

1. Write JSONL record (source of truth): \`\`\`bash node
   scripts/reviews/dist/write-retro-record.js --data '...' \`\`\`

2. Append markdown to `docs/AI_REVIEW_LEARNINGS_LOG.md` (legacy view): [existing
   markdown append logic]

3. Run sync: `npm run reviews:sync -- --apply`
```

### Pattern 4: Promotion Pipeline

**What:** Merged script that replaces `run-consolidation.js` with expanded
capabilities: detect recurrence across N times / M PRs, auto-generate
CODE_PATTERNS entries, enforcement rule skeletons, FIX_TEMPLATE stubs, and
CLAUDE.md anti-patterns updates.

**When to use:** PIPE-05/06/07/08.

**Architecture:**

```
promote-patterns.ts
  1. Read reviews.jsonl + retros.jsonl
  2. Extract patterns (reuse extractPatterns from run-consolidation.js)
  3. Detect recurrence: count(pattern) >= N across count(distinct PRs) >= M
  4. For each promoted pattern:
     a. Append to CODE_PATTERNS.md (existing logic from run-consolidation.js)
     b. Generate enforcement rule skeleton for check-pattern-compliance.js
     c. Generate FIX_TEMPLATE stub
     d. Update CLAUDE.md anti-patterns section
  5. Update consolidation state
```

### Anti-Patterns to Avoid

- **Inline JSONL writes in skills:** Skills should call scripts, not write files
  directly. Claude may generate malformed JSON if not validated by Zod.
- **Breaking the markdown UX:** The JSONL plumbing must be invisible to the
  user. Same review/retro output format; JSONL writes happen behind the scenes.
- **Skipping dual-write:** During transition, both JSONL and markdown must be
  written. Dropping one prematurely breaks downstream consumers.
- **Monolithic promotion script:** The promotion pipeline should be decomposable
  into testable functions, not one giant main() function.

## Don't Hand-Roll

| Problem                  | Don't Build              | Use Instead                            | Why                                    |
| ------------------------ | ------------------------ | -------------------------------------- | -------------------------------------- |
| JSONL file writes        | Raw fs.appendFileSync    | `appendRecord()` from write-jsonl      | Validation, locking, symlink guards    |
| JSONL file reads         | Manual JSON.parse        | `readValidatedJsonl()` from read-jsonl | Typed results, warning collection      |
| Schema validation        | Custom validation logic  | Zod schemas from Phase 1               | Already defined, tested, correct       |
| Pattern extraction       | New regex parser         | Reuse from run-consolidation.js        | Already handles all known patterns     |
| CODE_PATTERNS.md updates | Manual section insertion | Reuse from run-consolidation.js        | Already handles dedup, version history |
| Symlink guards           | Custom lstat checks      | safe-fs.js `isSafeToWrite`             | Battle-tested, used project-wide       |
| File locking             | Custom lockfile          | safe-fs.js `withLock`                  | Advisory locking already implemented   |
| Deferred item -> TDMS    | New intake logic         | `intake-pr-deferred.js`                | Already handles MASTER_DEBT dual-write |

**Key insight:** Phase 1 and 2 built the entire storage and read/write layer.
Phase 3 is integration work -- wiring existing validated I/O into skill flows
and building automation on top of validated data. The temptation to rebuild
utilities should be resisted.

## Common Pitfalls

### Pitfall 1: Skills Cannot Execute Code

**What goes wrong:** Attempting to make skills (markdown files) execute scripts
automatically. Skills are instructions that Claude follows -- they don't have a
runtime.

**Why it happens:** Confusing skills with executable hooks or scripts.

**How to avoid:** Skills instruct Claude to run commands at specific steps. The
actual execution is Claude running the bash commands. The skill document is the
orchestration layer.

**Warning signs:** Trying to add imports or require() calls to SKILL.md files.

### Pitfall 2: JSONL Data File Location Ambiguity

**What goes wrong:** Writing to `.claude/state/reviews.jsonl` (v1) vs
`data/ecosystem-v2/reviews.jsonl` (v2) inconsistently.

**Why it happens:** Two review JSONL files exist with different schemas.

**How to avoid:** Phase 3 writes to `data/ecosystem-v2/` exclusively. The
`sync-reviews-to-jsonl.js` -> `.claude/state/reviews.jsonl` path is the legacy
v1 pipeline. The two systems coexist during dual-write transition:

- **v2 (new):** `data/ecosystem-v2/*.jsonl` -- Zod-validated, used by new
  pipeline
- **v1 (legacy):** `.claude/state/reviews.jsonl` -- unvalidated, used by
  `run-consolidation.js`

During transition, BOTH must be written. After promotion script replaces
`run-consolidation.js`, the v1 path can be deprecated.

**Warning signs:** Importing from `scripts/reviews/lib/schemas/` but writing to
`.claude/state/`.

### Pitfall 3: Consolidation State Dual-Ownership

**What goes wrong:** The new promotion script and the old `run-consolidation.js`
both try to manage `.claude/state/consolidation.json`.

**Why it happens:** Two scripts competing for the same state.

**How to avoid:** The merged promotion script (`promote-patterns.ts`) replaces
`run-consolidation.js` entirely. It should read the same
`.claude/state/consolidation.json` for backward compatibility but can migrate
the state format. Do NOT run both scripts concurrently.

**Warning signs:** `consolidation.json` getting reset or double-incremented.

### Pitfall 4: MASTER_DEBT.jsonl Dual-Write Requirement

**What goes wrong:** Auto-deferred items write to
`data/ecosystem-v2/deferred-items.jsonl` but not to
`docs/technical-debt/MASTER_DEBT.jsonl`.

**Why it happens:** Two separate tracking systems: the v2 JSONL pipeline and the
TDMS pipeline.

**How to avoid:** Auto-deferred item creation (PIPE-03) writes to the v2 JSONL
file. The `/add-debt` skill call in the pr-review process writes to MASTER_DEBT.
These are complementary, not replacements. The v2 deferred-items.jsonl tracks
items for the promotion pipeline; MASTER_DEBT.jsonl tracks items for the TDMS.

**Warning signs:** Deferred items appearing in one system but not the other.

### Pitfall 5: Breaking Existing Consolidation During Transition

**What goes wrong:** Removing `run-consolidation.js` or changing its input
format before the promotion script is fully tested.

**Why it happens:** Eagerness to replace legacy code.

**How to avoid:** Keep `run-consolidation.js` working throughout Phase 3. The
promotion script can be tested in parallel. Only deprecate after the promotion
script passes all verification criteria.

**Warning signs:** `npm run consolidation:run` failing.

### Pitfall 6: CLAUDE.md Section Format Brittleness

**What goes wrong:** Auto-generation of CLAUDE.md anti-patterns section breaks
the document format or clobbers manual edits.

**Why it happens:** CLAUDE.md has strict formatting (must be ~120 lines,
markdown table format).

**How to avoid:** Auto-generation should ONLY update the specific anti-patterns
table rows. Use section markers (comments or anchors) to delimit the
auto-managed region. The rest of CLAUDE.md is untouched.

**Warning signs:** CLAUDE.md growing beyond ~120 lines, or section 4 content
being duplicated.

## Code Examples

### Writing a Review Record (PIPE-01)

```typescript
// Source: scripts/reviews/lib/write-jsonl.ts + schemas/review.ts (Phase 1)
import { appendRecord } from "./lib/write-jsonl";
import { ReviewRecord, type ReviewRecordType } from "./lib/schemas";
import * as path from "path";

function writeReviewRecord(projectRoot: string, data: ReviewRecordType): void {
  const filePath = path.join(
    projectRoot,
    "data",
    "ecosystem-v2",
    "reviews.jsonl"
  );
  appendRecord(filePath, data, ReviewRecord);
}

// Example record shape:
const record: ReviewRecordType = {
  id: "rev-410",
  date: "2026-02-28",
  schema_version: 1,
  completeness: "full",
  completeness_missing: [],
  origin: {
    type: "pr-review",
    pr: 399,
    round: 1,
    tool: "write-review-record.ts",
  },
  title: "PR #399 R1 - SonarCloud + Qodo",
  pr: 399,
  source: "sonarcloud+qodo",
  total: 15,
  fixed: 12,
  deferred: 2,
  rejected: 1,
  patterns: ["error-handling", "path-traversal"],
  learnings: ["Always check symlink before write"],
  severity_breakdown: { critical: 1, major: 3, minor: 8, trivial: 3 },
  per_round_detail: null,
  rejection_analysis: null,
  ping_pong_chains: null,
};
```

### Writing a Retro Record with Dual-Write (PIPE-02)

```typescript
import { appendRecord } from "./lib/write-jsonl";
import { RetroRecord, type RetroRecordType } from "./lib/schemas";

const retro: RetroRecordType = {
  id: "retro-pr-399",
  date: "2026-02-28",
  schema_version: 1,
  completeness: "full",
  completeness_missing: [],
  origin: { type: "pr-retro", pr: 399, tool: "write-retro-record.ts" },
  pr: 399,
  session: null,
  top_wins: ["Zero critical findings"],
  top_misses: ["Path normalization missed in 2 files"],
  process_changes: ["Add path normalization pre-check"],
  score: 8.5,
  metrics: { total_findings: 15, fix_rate: 0.8, pattern_recurrence: 1 },
};

// v2 JSONL write (source of truth)
appendRecord(RETROS_FILE, retro, RetroRecord);

// Legacy markdown write (dual-write during transition)
// Append to docs/AI_REVIEW_LEARNINGS_LOG.md using existing format
```

### Invocation Tracking (PIPE-04)

```typescript
import { appendRecord } from "./lib/write-jsonl";
import { InvocationRecord, type InvocationRecordType } from "./lib/schemas";

const invocation: InvocationRecordType = {
  id: `inv-${Date.now()}`,
  date: new Date().toISOString().split("T")[0],
  schema_version: 1,
  completeness: "full",
  completeness_missing: [],
  origin: { type: "manual", tool: "write-invocation.ts" },
  skill: "pr-review",
  type: "skill",
  duration_ms: 45000,
  success: true,
  error: null,
  context: { pr: 399, trigger: "user-invoked" },
};

appendRecord(INVOCATIONS_FILE, invocation, InvocationRecord);
```

### Pattern Recurrence Detection (PIPE-05/06)

```typescript
// Reusable from run-consolidation.js extractPatterns logic
interface RecurrenceResult {
  pattern: string;
  count: number;
  distinctPRs: Set<number>;
  reviews: string[];
}

function detectRecurrence(
  reviews: ReviewRecordType[],
  minOccurrences: number, // N
  minDistinctPRs: number // M
): RecurrenceResult[] {
  const patterns = new Map<string, RecurrenceResult>();

  for (const review of reviews) {
    if (!review.patterns) continue;
    for (const p of review.patterns) {
      const key = p.toLowerCase().trim();
      if (!patterns.has(key)) {
        patterns.set(key, {
          pattern: key,
          count: 0,
          distinctPRs: new Set(),
          reviews: [],
        });
      }
      const entry = patterns.get(key)!;
      entry.count++;
      if (review.pr) entry.distinctPRs.add(review.pr);
      entry.reviews.push(review.id);
    }
  }

  return Array.from(patterns.values())
    .filter(
      (p) => p.count >= minOccurrences && p.distinctPRs.size >= minDistinctPRs
    )
    .sort((a, b) => b.count - a.count);
}
```

### CLAUDE.md Anti-Patterns Auto-Generation (PIPE-07)

```typescript
// Generate the anti-patterns table from top patterns
// Only updates the section between markers, preserving rest of CLAUDE.md

const START_MARKER = "<!-- AUTO-ANTIPATTERNS-START -->";
const END_MARKER = "<!-- AUTO-ANTIPATTERNS-END -->";

function generateAntiPatternsTable(topPatterns: RecurrenceResult[]): string {
  const rows = topPatterns.slice(0, 6).map((p) => {
    const name = p.pattern.replace(/-/g, " ");
    const rule = `${name} (${p.count}x across ${p.distinctPRs.size} PRs)`;
    return `| ${name} | ${rule} |`;
  });

  return ["| Pattern | Rule |", "| --- | --- |", ...rows].join("\n");
}
```

## State of the Art

| Old Approach                            | Current Approach                            | When Changed | Impact                                  |
| --------------------------------------- | ------------------------------------------- | ------------ | --------------------------------------- |
| Markdown as source of truth for reviews | JSONL as source of truth (Phase 1-2)        | Phase 1-2    | Enables structured queries, automation  |
| Manual `/add-debt` for deferred items   | Auto-creation from review JSONL (PIPE-03)   | Phase 3      | No manual step needed                   |
| Separate consolidation + promotion      | Merged promotion script (PIPE-05)           | Phase 3      | Single pipeline for pattern lifecycle   |
| Manual CODE_PATTERNS updates            | Auto-generation from promotion (PIPE-05)    | Partial      | run-consolidation.js already does this  |
| Manual CLAUDE.md anti-patterns          | Auto-generation from top patterns (PIPE-07) | Phase 3      | Prevents drift                          |
| Manual FIX_TEMPLATES                    | Auto-stub generation (PIPE-08)              | Phase 3      | Skeleton created, human fills in detail |
| agent-invocations.jsonl (unstructured)  | invocations.jsonl (Zod-validated) (PIPE-04) | Phase 3      | Structured, queryable invocation data   |

**Deprecated/outdated:**

- `.claude/state/reviews.jsonl` (v1): Unvalidated, numeric IDs, no schema.
  Replaced by `data/ecosystem-v2/reviews.jsonl` (v2). Kept during dual-write.
- `.claude/state/agent-invocations.jsonl`: Unstructured format
  (`{agent, description, sessionId, timestamp}`). Replaced by v2
  `invocations.jsonl` with InvocationRecord schema.
- `sync-reviews-to-jsonl.js`: Legacy markdown->v1-JSONL bridge. Kept during
  dual-write transition; replaced by JSONL-first skill writes.

## Existing Infrastructure Analysis

### What exists and can be reused:

1. **`run-consolidation.js` (825 lines):**
   - `extractPatterns()` -- pattern extraction from reviews
   - `categorizePatterns()` -- Security/JS/Shell/CI/Docs/General categories
   - `filterNewPatterns()` -- dedup against existing CODE_PATTERNS.md content
   - `insertPatternsIntoSections()` -- section-aware insertion
   - `updateVersionHistory()` -- version bump + history row
   - `appendConsolidationToMarkdown()` -- markdown consolidation record
   - `generateRuleSuggestions()` -- compliance checker rule skeletons
   - **Reuse:** All of these functions. The promotion script wraps them with
     additional recurrence detection (N times / M PRs) and adds FIX_TEMPLATE and
     CLAUDE.md generation.

2. **`check-pattern-compliance.js` (ESM, 800+ lines):**
   - Defines the target format for enforcement rules (id, pattern regex,
     message, fix, fileTypes, severity tier)
   - Uses `verified-patterns` config for false-positive exclusions
   - **Reuse:** Rule format as target output for PIPE-06 auto-rule generation.

3. **`intake-pr-deferred.js`:**
   - Creates MASTER_DEBT.jsonl entries for deferred items
   - Handles DEBT-XXXX ID assignment, severity mapping, dual-file write
   - **Relationship:** PIPE-03 auto-creates v2 deferred-items.jsonl entries.
     `/add-debt` via `intake-pr-deferred.js` still needed for TDMS tracking.
     These are complementary systems.

4. **`.claude/state/agent-invocations.jsonl` (existing):**
   - Current format: `{agent, description, sessionId, timestamp}`
   - 32 entries, simple append-only
   - **Migration:** PIPE-04 replaces this with v2 InvocationRecord schema. Needs
     migration of existing entries.

5. **`.claude/state/reviews.jsonl` (v1, existing):**
   - Current format: numeric id, date, title, source, pr, patterns, fixed/etc
   - ~35 entries, used by `run-consolidation.js`
   - **Transition:** v1 continues to be written during dual-write. Promotion
     script reads from v2. After full transition, v1 deprecated.

### What needs to be built new:

1. **write-review-record.ts** -- CLI that accepts review data, validates,
   appends to v2 reviews.jsonl
2. **write-retro-record.ts** -- CLI that accepts retro data, validates, appends
   to v2 retros.jsonl + auto-creates deferred items
3. **write-deferred-items.ts** -- Library function for auto-creating deferred
   item records from review findings
4. **write-invocation.ts** -- CLI for unified invocation tracking
5. **promote-patterns.ts** -- Merged promotion script incorporating
   run-consolidation.js logic + PIPE-06/07/08 generation
6. **generate-claude-antipatterns.ts** -- CLAUDE.md section 4 auto-update
7. **generate-fix-template-stubs.ts** -- FIX_TEMPLATES.md stub generation
8. **render-reviews-to-md.ts** -- JSONL -> markdown renderer (PIPE-10)
9. **3 security FIX_TEMPLATES** -- Authored content (PIPE-09)
10. **Skill modifications** -- pr-review and pr-retro SKILL.md updates

## Key Design Decisions Required

### D1: v2 JSONL File Location

The v2 JSONL files currently live in `data/ecosystem-v2/`. This was established
in Phase 2 for backfilled data. Phase 3 continues writing here. The path
`docs/reviews/` was explored but no files exist there. **Recommendation:** Stay
with `data/ecosystem-v2/` for all 5 JSONL file types.

### D2: How Skills Invoke Scripts

Two approaches:

- **A: CLI scripts** -- Skills instruct Claude to run
  `node scripts/reviews/dist/write-review-record.js --data '...'`
- **B: Inline construction** -- Skills instruct Claude to construct the JSON and
  use `appendRecord()` directly (but this requires Claude to import/compile TS)

**Recommendation:** Option A (CLI scripts). Skills are text instructions; CLI
scripts are the cleanest bridge. The skill says "run this command", Claude runs
it. No ambiguity about imports or compilation.

### D3: Review ID Assignment

Reviews currently use numeric IDs (364, 365, ...) in v1 and `rev-N` string IDs
in v2. New reviews need a consistent ID strategy.

**Recommendation:** Use `rev-{next_number}` where next_number is
max(existing) + 1. The write-review-record CLI should auto-assign if no ID is
provided, by reading the last record in reviews.jsonl.

### D4: Promotion Thresholds (N times / M PRs)

The current consolidation uses MIN_PATTERN_OCCURRENCES = 3 (from
run-consolidation.js). PIPE-06 adds a cross-PR requirement.

**Recommendation:** N >= 3 occurrences across M >= 2 distinct PRs. This filters
out patterns that recur within a single PR review cycle (which are already
caught by the review process) and surfaces patterns that persist across PRs
(which indicate systemic issues needing automation).

### D5: CLAUDE.md Auto-Generation Scope

The anti-patterns table in CLAUDE.md Section 4 is currently 6 rows. It should
stay small (~6-8 rows) as CLAUDE.md is loaded every turn.

**Recommendation:** Auto-generation replaces the "Top 5" table with the top 6
patterns by recurrence. Use HTML comment markers to delimit the auto-managed
region. Manual entries outside the markers are preserved.

### D6: Dual-Write Duration

How long should the pr-retro dual-write (JSONL + markdown) persist?

**Recommendation:** Keep dual-write until Phase 5 (or until all consumers of the
markdown format have been migrated to read from JSONL). The markdown is still
the primary human-readable view. JSONL is the machine-readable source of truth.

## Open Questions

1. **tsconfig.json include paths:**
   - Phase 3 adds new .ts files to `scripts/reviews/`. The current tsconfig
     includes only `["lib/**/*.ts", "dedup-debt.ts", "backfill-reviews.ts"]`.
   - New files must be added to the `include` array.
   - Recommendation: Update to include `["lib/**/*.ts", "*.ts"]` to catch all
     top-level scripts.

2. **Invocation tracking integration points:**
   - Besides pr-review and pr-retro, which skills should write to
     invocations.jsonl?
   - The `.claude/state/agent-invocations.jsonl` currently tracks code-reviewer
     and Explore agents.
   - Recommendation: Start with pr-review, pr-retro, code-reviewer. Expand
     later.

3. **Security FIX_TEMPLATES content (PIPE-09):**
   - These are authored content, not generated. The 3 templates need to be
     identified based on the most common security patterns.
   - Based on CODE_PATTERNS.md, likely candidates: (1) Error sanitization, (2)
     Path traversal prevention, (3) Symlink guard patterns.
   - Recommendation: Choose based on pattern recurrence data from reviews.jsonl.

## Sources

### Primary (HIGH confidence)

- **scripts/reviews/lib/schemas/\*.ts** -- Phase 1 Zod schemas (verified by
  reading)
- **scripts/reviews/lib/write-jsonl.ts** -- Phase 1 write utility (verified by
  reading)
- **scripts/reviews/lib/read-jsonl.ts** -- Phase 1 read utility (verified by
  reading)
- **scripts/run-consolidation.js** -- Existing consolidation logic (verified,
  825 lines)
- **.claude/skills/pr-review/SKILL.md** -- Current pr-review skill (verified,
  v3.5)
- **.claude/skills/pr-retro/SKILL.md** -- Current pr-retro skill (verified,
  v3.2)
- **.claude/skills/add-debt/SKILL.md** -- Current add-debt skill (verified,
  v1.0)
- **docs/agent_docs/CODE_PATTERNS.md** -- Current pattern reference (verified,
  v3.7)
- **docs/agent_docs/FIX_TEMPLATES.md** -- Current fix templates (verified, v2.6)
- **data/ecosystem-v2/\*.jsonl** -- Backfilled v2 data (verified by reading)
- **.claude/state/reviews.jsonl** -- v1 legacy data (verified by reading)
- **.claude/state/agent-invocations.jsonl** -- Legacy invocations (verified by
  reading)

### Secondary (MEDIUM confidence)

- **Phase 1 and Phase 2 research documents** -- Architecture decisions, file
  locations

### Tertiary (LOW confidence)

- None. All findings verified against actual codebase files.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries verified in codebase, no new
  dependencies
- Architecture: HIGH -- building on verified Phase 1/2 infrastructure
- Pitfalls: HIGH -- identified from actual dual-system conflicts in codebase
- Promotion pipeline: MEDIUM -- reuse of consolidation logic is straightforward,
  but auto-generation of CLAUDE.md and FIX_TEMPLATES is novel within this
  codebase

**Research date:** 2026-02-28 **Valid until:** 2026-03-14 (14 days -- Phase 3
builds directly on Phase 1/2 which was completed same day; infrastructure is
fresh)
