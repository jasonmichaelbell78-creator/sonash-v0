<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Phase 1: Storage Foundation - Research

**Researched:** 2026-02-28 **Domain:** JSONL schema validation, write utilities,
completeness modeling, contract testing **Confidence:** HIGH

## Summary

Phase 1 builds the data layer that every subsequent phase depends on. It defines
Zod schemas for 5 JSONL files (reviews, retros, deferred-items, invocations,
warnings), creates a single validated write utility, implements a three-tier
completeness model (full/partial/stub), and establishes contract tests for data
handoff points.

The existing codebase has significant infrastructure to build on:
`scripts/lib/safe-fs.js` provides symlink-guarded writes with file locking,
`scripts/lib/read-jsonl.js` handles JSONL reading with malformed-line skipping,
and `functions/src/schemas.ts` demonstrates the project's established Zod
patterns. The existing `reviews.jsonl` in `.claude/state/` has an ad-hoc schema
with no validation -- this is exactly what Phase 1 replaces.

The project uses Zod 4.x (`^4.2.1` in package.json, CLAUDE.md says 4.3.5). This
is beyond training cutoff. Key Zod 4 differences from Zod 3 are documented
below. Tests use Node.js built-in test runner (`node --test`) with TypeScript
compiled via `tsc` to `dist-tests/`. New v2 scripts go in `scripts/reviews/`
(does not exist yet). Test fixtures go in `test/fixtures/ecosystem-v2/` per
UC-14.

**Primary recommendation:** Build schemas and write utility as TypeScript
modules in `scripts/reviews/lib/`, with tests co-located in
`scripts/reviews/__tests__/`. Leverage existing `safe-fs.js` for underlying file
I/O (symlink guards, file locking).

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library      | Version  | Purpose                        | Why Standard                                      |
| ------------ | -------- | ------------------------------ | ------------------------------------------------- |
| Zod          | ^4.2.1   | Schema definition & validation | Already in project, mandated by CLAUDE.md (4.3.5) |
| Node.js test | built-in | Test runner                    | Already used by project (`node --test`)           |
| TypeScript   | strict   | Type-safe implementation       | Project mandate, no `any`                         |

### Supporting

| Library       | Version  | Purpose                     | When to Use                    |
| ------------- | -------- | --------------------------- | ------------------------------ |
| safe-fs.js    | existing | Symlink-guarded file writes | All JSONL writes must use this |
| read-jsonl.js | existing | JSONL file reading          | Read-time operations           |
| c8            | existing | Code coverage               | Coverage reporting for tests   |

### Alternatives Considered

| Instead of        | Could Use   | Tradeoff                                             |
| ----------------- | ----------- | ---------------------------------------------------- |
| Zod               | io-ts, Ajv  | Zod is mandated; already in project                  |
| Node test runner  | Jest/Vitest | Project already uses Node test runner for most tests |
| Custom write util | fs directly | safe-fs.js already handles symlink/locking concerns  |

**Installation:** No new packages needed. Zod already installed. All
infrastructure exists.

## Architecture Patterns

### Recommended Project Structure

```
scripts/reviews/
  lib/
    schemas/
      review.ts          # ReviewRecord Zod schema
      retro.ts           # RetroRecord Zod schema
      deferred-item.ts   # DeferredItemRecord Zod schema
      invocation.ts      # InvocationRecord Zod schema
      warning.ts         # WarningRecord Zod schema
      shared.ts          # Origin, completeness, common fields
      index.ts           # Re-exports all schemas
    write-jsonl.ts       # Single validated write utility
    read-jsonl.ts        # Validated read utility with warnings
    completeness.ts      # hasField() helper, tier logic
  __tests__/
    schemas.test.ts      # Schema validation tests
    write-jsonl.test.ts  # Write utility tests
    read-jsonl.test.ts   # Read-time validation tests
    completeness.test.ts # hasField() and tier tests
    contracts/
      review-write.test.ts       # Contract: skill writes valid JSONL
      deferred-write.test.ts     # Contract: deferred items auto-created
      promotion-input.test.ts    # Contract: promotion reads JSONL correctly
      promotion-output.test.ts   # Contract: promotion writes correctly
      effectiveness-input.test.ts # Contract: effectiveness reads correctly
      enforcement-generation.test.ts # Contract: auto-rules are valid
      markdown-render.test.ts    # Contract: JSONL->markdown correct
test/fixtures/ecosystem-v2/
  review-full.json       # All fields populated
  review-partial.json    # Missing patterns + learnings
  review-stub.json       # Minimal fields only
  retro-full.json
  retro-partial.json
  retro-stub.json
  deferred-item-full.json
  deferred-item-partial.json
  deferred-item-stub.json
  invocation-full.json
  warning-full.json
```

### Pattern 1: Shared Schema Base with Completeness

**What:** All 5 JSONL file types share common required fields, with the
completeness model enforced at the schema level.

**When to use:** Every record written to any JSONL file.

**Example:**

```typescript
// scripts/reviews/lib/schemas/shared.ts
import { z } from "zod";

// Completeness tier enum
export const CompletenessTier = z.enum(["full", "partial", "stub"]);

// Structured origin field (Q14 decision)
export const Origin = z.object({
  type: z.enum(["pr-review", "pr-retro", "backfill", "migration", "manual"]),
  pr: z.number().int().positive().optional(),
  round: z.number().int().positive().optional(),
  session: z.string().optional(),
  tool: z.string().optional(),
});

// Base fields required on every record (UC-2 Required tier)
export const BaseRecord = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  schema_version: z.number().int().positive(),
  completeness: CompletenessTier,
  completeness_missing: z.array(z.string()).default([]),
  origin: Origin,
});
```

### Pattern 2: Write Utility with Zod Validation

**What:** A single function that validates records against the appropriate
schema before writing to JSONL. All writes go through this function.

**When to use:** Every JSONL append operation.

**Example:**

```typescript
// scripts/reviews/lib/write-jsonl.ts
import { z } from "zod";
// Uses safe-fs.js for actual file operations (symlink guards + locking)

export function appendRecord<T>(
  filePath: string,
  record: T,
  schema: z.ZodType<T>
): void {
  // 1. Validate against schema - throws ZodError if invalid
  const validated = schema.parse(record);
  // 2. Serialize to JSON line
  const line = JSON.stringify(validated) + "\n";
  // 3. Write using safe-fs (with lock + symlink guard)
  withLock(filePath, () => {
    safeAppendFileSync(filePath, line);
  });
}
```

### Pattern 3: Read-Time Validation with Graceful Degradation

**What:** When reading JSONL, validate each record against the schema. Log
warnings for malformed records but continue processing (never throw).

**When to use:** Every JSONL read operation by consumers.

**Example:**

```typescript
// scripts/reviews/lib/read-jsonl.ts
export function readValidatedJsonl<T>(
  filePath: string,
  schema: z.ZodType<T>,
  options?: { quiet?: boolean }
): { valid: T[]; warnings: string[] } {
  const raw = readJsonl(filePath, { safe: true });
  const valid: T[] = [];
  const warnings: string[] = [];

  for (const item of raw) {
    const result = schema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      const msg = `Malformed record at id=${item?.id}: ${result.error.message}`;
      warnings.push(msg);
      if (!options?.quiet) console.warn(`  [read-jsonl] ${msg}`);
    }
  }

  return { valid, warnings };
}
```

### Pattern 4: hasField() Helper

**What:** Checks whether a field is truly available on a record by looking at
both the value and the completeness_missing array.

**When to use:** Any consumer that needs to decide whether a field's value is
meaningful (real zero vs. missing data).

**Example:**

```typescript
// scripts/reviews/lib/completeness.ts
export function hasField(
  record: { completeness_missing?: string[] },
  field: string
): boolean {
  // If field is listed in completeness_missing, it's not available
  if (record.completeness_missing?.includes(field)) return false;
  // Field exists and is not in missing list
  return true;
}
```

### Anti-Patterns to Avoid

- **Direct fs.appendFile for JSONL:** All writes MUST go through the validated
  write utility. Direct file writes bypass schema validation.
- **Throwing on malformed read-time records:** Readers must use safeParse and
  log warnings. Never crash the pipeline for a single bad record.
- **String-based origin queries:** Never parse origin as a string. Always use
  the structured object fields (`origin.type`, `origin.pr`, etc.).
- **Assuming field presence without checking completeness:** Always use
  `hasField()` before treating a field value as meaningful data.
- **Using z.string().email() or z.string().uuid():** Zod 4 moved these to
  top-level `z.email()`, `z.uuid()`. The old methods are deprecated.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem               | Don't Build           | Use Instead                       | Why                                           |
| --------------------- | --------------------- | --------------------------------- | --------------------------------------------- |
| File write safety     | Custom symlink checks | `scripts/lib/safe-fs.js`          | Already handles symlinks, locking, EXDEV, BOM |
| JSONL reading         | Custom line parser    | `scripts/lib/read-jsonl.js`       | Already handles blank lines, malformed JSON   |
| File locking          | Custom lock mechanism | `safe-fs.js` withLock/acquireLock | Already has stale lock detection, PID checks  |
| Atomic writes         | Write-then-rename     | `safe-fs.js` safeAtomicWriteSync  | Already handles cross-drive, Windows compat   |
| Error sanitization    | Custom path scrubbing | `scripts/lib/sanitize-error.js`   | Project mandate per CLAUDE.md anti-patterns   |
| Schema type inference | Manual TS interfaces  | `z.infer<typeof Schema>`          | Zod generates types automatically             |

**Key insight:** The project already has mature file I/O infrastructure in
`safe-fs.js`. The new write utility should compose on top of it, not replace it.

## Common Pitfalls

### Pitfall 1: Zod 4 API Changes

**What goes wrong:** Using Zod 3 patterns that changed in Zod 4. **Why it
happens:** Training data and most online examples use Zod 3 syntax. **How to
avoid:**

- Use `z.enum()` not `z.nativeEnum()` for string enums
- `z.record()` in v4 requires two arguments (key schema, value schema)
- String format validators moved to top-level: `z.email()` not
  `z.string().email()`
- `.strict()` on objects replaced by `z.strictObject()` (old method still works)
- Default values in optional fields are now applied (behavior change from Zod 3)
- Import path is `import { z } from "zod"` (already used in project)

**Warning signs:** TypeScript compilation errors mentioning Zod method
signatures.

### Pitfall 2: CommonJS vs ESM Module Format

**What goes wrong:** New TypeScript files use ESM syntax but the build pipeline
expects CommonJS output. **Why it happens:** `tsconfig.test.json` compiles to
`"module": "commonjs"` and existing scripts are CommonJS. **How to avoid:**

- Write schemas in TypeScript with `import/export`
- The test build compiles to CommonJS via `tsconfig.test.json`
- Existing scripts in `scripts/` are plain JavaScript (`.js`) using `require()`
- New v2 scripts should be TypeScript compiled to CommonJS
- The test tsconfig currently only includes `lib/**/*.ts` and `tests/**/*.ts` --
  need to add `scripts/reviews/**/*.ts` to the include list

**Warning signs:** `ERR_REQUIRE_ESM` or
`SyntaxError: Cannot use import statement`

### Pitfall 3: Test Infrastructure Configuration

**What goes wrong:** New test files don't get compiled or discovered by the test
runner. **Why it happens:** `tsconfig.test.json` has a limited `include` array.
Tests must be in `tests/` or explicitly added. **How to avoid:**

- Either place tests in `tests/scripts/` (existing pattern) or update
  `tsconfig.test.json` include to cover `scripts/reviews/__tests__/`
- Test discovery pattern is `"dist-tests/tests/**/*.test.js"` -- co-located
  tests in `scripts/reviews/__tests__/` would need the runner pattern updated
  too
- Recommendation: Follow existing pattern and put tests in
  `tests/scripts/ecosystem-v2/` to minimize configuration changes

**Warning signs:** Tests exist but `npm test` reports zero new tests.

### Pitfall 4: Dual Ecosystem (JS Scripts + TS Tests)

**What goes wrong:** Schemas written in TypeScript can't be consumed by existing
plain JavaScript scripts without compilation. **Why it happens:** Existing
pipeline scripts (e.g., `run-consolidation.js`, `check-pattern-compliance.js`)
are `.js` files using `require()`. **How to avoid:**

- New v2 code in `scripts/reviews/lib/` should be TypeScript
- Provide a build step or pre-compiled output that existing JS scripts can
  require
- Consider: v2 scripts in `scripts/reviews/` are ALL new -- no need to integrate
  with v1 JS scripts until Phase 7 cutover
- For Phase 1, the schemas and utilities only need to be consumable by tests and
  by new v2 scripts (also TypeScript)

**Warning signs:** `require()` errors when v1 scripts try to load v2 TypeScript
modules.

### Pitfall 5: Contract Test Scope for Phase 1

**What goes wrong:** Trying to test all 10 handoff points when only the storage
layer exists in Phase 1. **Why it happens:** TEST-01 calls for contract tests at
all 10 handoff points, but many downstream scripts (promotion, enforcement,
markdown render) don't exist until Phase 3+. **How to avoid:**

- Phase 1 contract tests validate the DATA SHAPE, not the full pipeline
- Write fixture-based tests that prove: "If a consumer receives this data shape,
  it can parse it with the expected schema"
- The 7 contract test files from UC-14 test data handoffs -- Phase 1 can define
  the fixture data and schema contracts even before the consuming scripts exist
- Contract = "This is what the producer will output" + "This is what the
  consumer will accept" -- both sides testable with schemas alone

**Warning signs:** Blocked on "but the promotion script doesn't exist yet."

### Pitfall 6: MASTER_DEBT.jsonl Write Safety

**What goes wrong:** A new write utility for ecosystem JSONL files accidentally
interferes with the existing MASTER_DEBT.jsonl dual-write system. **Why it
happens:** `safe-fs.js` already has `writeMasterDebtSync` and
`appendMasterDebtSync` which dual-write to MASTER_DEBT.jsonl and deduped.jsonl.
**How to avoid:**

- The new write utility is ONLY for the 5 ecosystem JSONL files (reviews,
  retros, deferred-items, invocations, warnings)
- MASTER_DEBT.jsonl continues using its own existing write path in `safe-fs.js`
- Do not generalize the new write utility to cover MASTER_DEBT -- that system
  already works and has its own dual-write logic

**Warning signs:** MASTER_DEBT.jsonl stops being synced with deduped.jsonl.

## Code Examples

Verified patterns from the existing codebase:

### Existing Zod Usage Pattern (from functions/src/schemas.ts)

```typescript
// Source: functions/src/schemas.ts
import { z } from "zod";

export const dailyLogSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  content: z.string().max(50000, "Content too large. Maximum 50KB."),
  mood: z.string().nullable().optional(),
  cravings: z.boolean().optional(),
  used: z.boolean().optional(),
  userId: z.string().optional(),
});

export type DailyLogInput = z.infer<typeof dailyLogSchema>;
```

### Existing Read-JSONL Pattern (from scripts/lib/read-jsonl.js)

```javascript
// Source: scripts/lib/read-jsonl.js
function readJsonl(filePath, options = {}) {
  const { safe = false, quiet = false } = options;
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    if (safe) return [];
    console.error(
      `Failed to read ${path.basename(filePath)}: ${err.code || err.message}`
    );
    process.exit(1);
  }
  const lines = raw.split("\n");
  const items = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    try {
      items.push(JSON.parse(trimmed));
    } catch {
      if (!quiet) {
        console.warn(`  Skipping malformed JSON at line ${i + 1}`);
      }
    }
  }
  return items;
}
```

### Existing Safe-Write Pattern (from scripts/lib/safe-fs.js)

```javascript
// Source: scripts/lib/safe-fs.js
function withLock(filePath, fn, timeoutMs) {
  acquireLock(filePath, timeoutMs);
  try {
    return fn();
  } finally {
    releaseLock(filePath);
  }
}
```

### Existing Test Pattern (from tests/scripts/safe-fs.test.ts)

```typescript
// Source: tests/scripts/safe-fs.test.ts
import assert from "node:assert/strict";
import { test, describe, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

// Tests use require() to load JS modules
const safeFsPath = path.resolve(PROJECT_ROOT, "scripts/lib/safe-fs.js");
const safeFsModule = require(safeFsPath);
```

### Review Record Schema Shape (from DISCOVERY_QA.md UC-2)

```typescript
// Derived from UC-2 field tier definitions
const ReviewRecord = z.object({
  // Required tier (always present)
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  schema_version: z.number().int().positive(),
  completeness: z.enum(["full", "partial", "stub"]),
  completeness_missing: z.array(z.string()).default([]),
  origin: Origin,

  // Standard tier (full/partial -- nullable)
  title: z.string().nullable().optional(),
  pr: z.number().int().positive().nullable().optional(),
  source: z.string().nullable().optional(),
  total: z.number().int().min(0).nullable().optional(),
  fixed: z.number().int().min(0).nullable().optional(),
  deferred: z.number().int().min(0).nullable().optional(),
  rejected: z.number().int().min(0).nullable().optional(),
  patterns: z.array(z.string()).nullable().optional(),
  learnings: z.array(z.string()).nullable().optional(),

  // Extended tier (v2-only)
  severity_breakdown: z
    .object({
      critical: z.number().int().min(0),
      major: z.number().int().min(0),
      minor: z.number().int().min(0),
      trivial: z.number().int().min(0),
    })
    .nullable()
    .optional(),
  per_round_detail: z.array(z.unknown()).nullable().optional(),
  rejection_analysis: z.array(z.unknown()).nullable().optional(),
  ping_pong_chains: z.array(z.unknown()).nullable().optional(),
});
```

## State of the Art

| Old Approach                    | Current Approach                   | When Changed | Impact                                      |
| ------------------------------- | ---------------------------------- | ------------ | ------------------------------------------- |
| `z.string().email()`            | `z.email()` (top-level)            | Zod 4.0      | Deprecated method form, use top-level       |
| `z.record(valueSchema)`         | `z.record(keySchema, valueSchema)` | Zod 4.0      | Must provide key schema                     |
| `.strict()` on objects          | `z.strictObject()` (preferred)     | Zod 4.0      | Old method works but new function preferred |
| `ZodEffects` wrapper for refine | Refinements as inline "checks"     | Zod 4.0      | Internal change, simplifies error handling  |
| Markdown-first data             | JSONL-first architecture           | v2 (now)     | Eliminates parsing errors, enables queries  |
| String source_id                | Structured origin object           | v2 (now)     | Eliminates string parsing drift             |
| No completeness tracking        | Three-tier model                   | v2 (now)     | Handles partial data gracefully             |

**Deprecated/outdated:**

- `sync-reviews-to-jsonl.js`: Eliminated by JSONL-first architecture (listed in
  REQUIREMENTS.md Out of Scope)
- String-based `source_id` field: Replaced by structured `origin` object (Q14)
- Direct `fs.appendFile` to JSONL: Replaced by validated write utility (STOR-07)

## Existing Infrastructure Inventory

What already exists that Phase 1 builds on:

| Component              | Location                      | Status          | Phase 1 Relationship                             |
| ---------------------- | ----------------------------- | --------------- | ------------------------------------------------ |
| `safe-fs.js`           | `scripts/lib/safe-fs.js`      | Working         | Compose new write utility on top of this         |
| `read-jsonl.js`        | `scripts/lib/read-jsonl.js`   | Working         | Wrap with Zod validation for read-time checks    |
| `reviews.jsonl`        | `.claude/state/reviews.jsonl` | Broken (45/406) | Will be replaced by v2 validated reviews.jsonl   |
| `schemas.ts`           | `functions/src/schemas.ts`    | Working         | Pattern reference for Zod usage in this project  |
| Node test runner       | `package.json` test scripts   | Working         | Use for all new tests                            |
| `tsconfig.test.json`   | Root                          | Working         | Needs include path update for new test locations |
| `scripts/reviews/` dir | Does not exist                | Not created     | Must create as Phase 1 deliverable               |

## Open Questions

Things that couldn't be fully resolved:

1. **Zod 4.3.5 specific API surface**
   - What we know: Zod 4.x has breaking changes from Zod 3 (documented above).
     Package.json has `^4.2.1`. CLAUDE.md says 4.3.5.
   - What's unclear: Whether 4.3.5 has additional changes beyond 4.0 release
     notes. Zod 4 is beyond training cutoff -- only web search data available.
   - Recommendation: Use `z.safeParse()` and `z.parse()` which are stable across
     all versions. Avoid exotic APIs. If a Zod 4 API doesn't work as expected,
     check the official docs at zod.dev/v4.

2. **Test file placement -- co-located vs centralized**
   - What we know: UC-14 says `scripts/reviews/__tests__/`. Existing tests are
     in `tests/scripts/`. `tsconfig.test.json` includes `tests/**/*.ts`.
   - What's unclear: Whether co-located tests under `scripts/reviews/` would
     require tsconfig and test runner changes.
   - Recommendation: Use `tests/scripts/ecosystem-v2/` to follow the existing
     pattern and minimize config changes. If the planner prefers co-location,
     the tsconfig.test.json include array and the npm test glob pattern both
     need updating.

3. **TypeScript compilation for scripts/reviews/lib/**
   - What we know: Existing scripts in `scripts/` are plain JS. Tests are TS
     compiled via tsconfig.test.json. The main tsconfig excludes `scripts/`.
   - What's unclear: Whether v2 TypeScript in `scripts/reviews/lib/` needs its
     own tsconfig or should use the test tsconfig.
   - Recommendation: Create a `scripts/reviews/tsconfig.json` that compiles v2
     TypeScript to a `scripts/reviews/dist/` directory, making it consumable by
     both tests and runtime scripts. Alternatively, since all consumers are also
     TypeScript (tests and new v2 scripts), compile everything together via the
     test tsconfig.

4. **The "10 data handoff points" precise list**
   - What we know: Q3 says "contract tests for all 10 data handoff points."
     UC-14 says v2 reduces to ~7 handoffs and lists 7 contract test files.
   - What's unclear: The original 10 handoff points are not explicitly
     enumerated anywhere. The 7 contract tests from UC-14 are the definitive
     list for v2.
   - Recommendation: Use the 7 contract test files from UC-14 as the canonical
     list. Phase 1 defines the fixture data and schema contracts; later phases
     implement the consuming scripts.

## Sources

### Primary (HIGH confidence)

- `functions/src/schemas.ts` -- existing Zod patterns in this project
- `scripts/lib/safe-fs.js` -- existing file I/O infrastructure
- `scripts/lib/read-jsonl.js` -- existing JSONL reader
- `.planning/ecosystem-v2/DISCOVERY_QA.md` -- 60 decisions including UC-2
  (completeness), Q14 (origin), UC-14 (test strategy), UC-15 (field defense)
- `.planning/REQUIREMENTS.md` -- 11 requirements mapped to Phase 1
- `.planning/ROADMAP.md` -- phase definition and success criteria
- `package.json` -- test runner config, Zod version
- `tsconfig.test.json` -- test compilation config

### Secondary (MEDIUM confidence)

- [Zod v4 migration guide](https://zod.dev/v4/changelog) -- breaking changes
  verified via web search + official docs fetch
- [Zod v4 release notes](https://zod.dev/v4) -- new features and API changes

### Tertiary (LOW confidence)

- Zod 4.3.5 specific features -- could not verify minor version differences
  beyond the 4.0 release notes

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries already in project, versions confirmed
  from package.json
- Architecture: HIGH -- patterns derived directly from 60 user decisions in
  DISCOVERY_QA.md with specific field definitions and test file names
- Pitfalls: HIGH -- identified from actual codebase analysis (tsconfig limits,
  module format, existing dual-write system)
- Zod 4 specifics: MEDIUM -- verified via official migration guide but minor
  version 4.3.5 details unconfirmed

**Research date:** 2026-02-28 **Valid until:** 2026-03-30 (stable domain --
schemas and file I/O patterns don't change rapidly)
