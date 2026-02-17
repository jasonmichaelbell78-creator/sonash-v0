<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Implementation Plan: AI Review Learnings System Overhaul

## Summary

Full overhaul of the AI Review Learnings ecosystem: repair JSONL data quality,
remove dead sections from the markdown, automate archival, and build a
pattern-promotion pipeline from consolidation → CODE_PATTERNS.md. Addresses all
12 identified problems across 20+ files spanning scripts, skills, docs, hooks,
and config.

## Decision Record (from Q&A)

| Decision               | Choice                                                     |
| ---------------------- | ---------------------------------------------------------- |
| Scope                  | Full overhaul (all 12 problems)                            |
| Quick Pattern Index    | Remove entirely (CODE_PATTERNS.md is authoritative)        |
| Version History Table  | Collapse ALL rows into `<details>` block                   |
| Auto-Archive           | Build `archive-reviews.js` script                          |
| JSONL Data Repair      | Repair existing 61 entries + fix sync script going forward |
| Retros in JSONL        | Yes — add `type: "retrospective"` schema                   |
| Consolidation Pipeline | Auto-promote patterns (3+ occurrences) to CODE_PATTERNS    |
| Stale Sections         | Remove all (Pattern Audit, placeholders, malformed rows)   |

## Files to Create/Modify

### New Files (2)

1. **`scripts/archive-reviews.js`** — Automated review archival script
   (`npm run reviews:archive`)
2. **`scripts/promote-patterns.js`** — Auto-promote recurring patterns to
   CODE_PATTERNS.md (`npm run patterns:promote`)

### Modified Files (20)

**Core changes (Steps 1-5):**

1. **`scripts/sync-reviews-to-jsonl.js`** — Fix severity extraction, add retro
   parsing, add `--repair` mode for backfill
2. **`scripts/run-consolidation.js`** — Call promote-patterns after generating
   suggested-rules.md
3. **`docs/AI_REVIEW_LEARNINGS_LOG.md`** — Remove Quick Index, collapse version
   history, remove stale sections, remove placeholders, fix PR #367 retro format
4. **`docs/agent_docs/CODE_PATTERNS.md`** — Target for auto-promoted patterns
5. **`package.json`** — Add `reviews:archive`, `reviews:repair`,
   `patterns:promote` npm scripts
6. **`scripts/check-review-archive.js`** — Add JSONL entry count validation

**Skill updates (Step 7):**

7. **`.claude/skills/session-begin/SKILL.md`** — Add archive threshold check
8. **`.claude/skills/pr-retro/SKILL.md`** — Add instruction to sync retros to
   JSONL

**Reference updates (Step 9 — update all associated files):**

9. **`.claude/skills/pr-review/SKILL.md`** — Remove Quick Index from tier 2
   lookup table (line 136)
10. **`.claude/skills/pr-review/reference/LEARNING_CAPTURE.md`** — Remove
    section 7.3 "Update Quick Index", update 7.5 archival criteria
11. **`.claude/skills/session-end/SKILL.md`** — Update sync flow references
12. **`.claude/STATE_SCHEMA.md`** — Add retro schema to reviews.jsonl section,
    fix consolidation.json writers field
13. **`docs/AI_REVIEW_PROCESS.md`** — Update workflow references (removed
    sections)
14. **`scripts/suggest-pattern-automation.js`** — Verify parsing still works
    after section removals
15. **`scripts/surface-lessons-learned.js`** — Verify parsing still works after
    section removals
16. **`scripts/analyze-learning-effectiveness.js`** — Verify parsing still works
17. **`scripts/check-triggers.js`** — Verify consolidation references
18. **`DOCUMENTATION_INDEX.md`** — Regenerate after file changes
19. **`docs/SLASH_COMMANDS_REFERENCE.md`** — Add new commands
    (`reviews:archive`, `reviews:repair`, `patterns:promote`)
20. **`docs/technical-debt/MASTER_DEBT.jsonl`** — Resolve Quick Index debt items
    (now removed)

---

## Step 1: Fix sync-reviews-to-jsonl.js (Foundation)

Everything depends on clean JSONL data. Fix the parser first.

### 1a: Fix severity extraction (lines 171-179)

**Problem:** The regex `(\d+)\s*MAJOR` matches ANY number followed by "MAJOR"
anywhere in the raw text. But the markdown format is:
`**Suggestions:** 9 total (Fixed: 6, Rejected: 3)` — severities are in a
different format: `3 MAJOR, 3 MINOR, 3 rejected`.

The real issue: many entries use a format like `Fixed: 6` without severity
labels. The script finds nothing and defaults to 0.

**Fix:** Add a secondary extraction from the `**Patterns Identified:**` section
where patterns are listed as `1. **Pattern Name** — description`. Count patterns
by checking if the description contains severity keywords. Also extract from
`Resolution Stats:` lines.

### 1b: Fix learnings extraction (lines 199-208)

**Problem:** The regex `[-*]\s+(?:`[^`]+`\s+)?[A-Z].{15,}` matches any bullet
line starting with a capital letter — including header prose like
`"Qodo Compliance R3 + CI Failure **PR/Branch:**"`.

**Fix:** Skip lines that contain `**Source:**`, `**PR/Branch:**`,
`**Suggestions:**`, `**Resolution Stats:**` — these are metadata, not learnings.

### 1c: Add `--repair` mode

New flag: `npm run reviews:repair` that re-parses ALL active markdown reviews
and OVERWRITES the JSONL (not append). This is a one-time backfill tool.

```javascript
// --repair mode: full rebuild of reviews.jsonl from markdown
if (repairMode) {
  const reviews = parseMarkdownReviews(content);
  const retros = parseRetrospectives(content); // NEW
  const all = [...reviews, ...retros].sort((a, b) => a.id - b.id);
  writeFileSync(
    REVIEWS_FILE,
    all.map((r) => JSON.stringify(r)).join("\n") + "\n"
  );
  log(`Repaired: ${all.length} entries written`);
}
```

### 1d: Add retrospective parsing

New function `parseRetrospectives(content)` that finds `### PR #N Retrospective`
sections and extracts:

```javascript
{
  id: "retro-370",           // string ID to distinguish from review IDs
  type: "retrospective",
  pr: 370,
  date: "2026-02-14",
  rounds: 5,
  totalItems: 53,
  churnChains: 3,            // number of ping-pong chains
  automationCandidates: [],  // list of automation opportunities
  skillsToUpdate: [],        // skills flagged for update
  processImprovements: [],   // process improvement items
  learnings: []              // key takeaways
}
```

---

## Step 2: Repair JSONL Data (One-Time)

After fixing the parser, run the repair:

```bash
npm run reviews:repair
```

This rebuilds reviews.jsonl from the current markdown, producing:

- 61 review entries with correct severity data
- 4 retrospective entries with structured fields
- Recovery of missing #323 and #335 (if they exist in markdown — if not, they
  stay missing and we log it)

Validate with:

```bash
npm run reviews:check-archive
```

---

## Step 3: Clean Up AI_REVIEW_LEARNINGS_LOG.md

### 3a: Remove Quick Pattern Index (lines ~300-350)

Delete the entire `## Quick Pattern Index` section. CODE_PATTERNS.md is the
authoritative pattern reference.

### 3b: Collapse version history table

Move ALL version history rows (both visible and already-collapsed) into a single
`<details>` block:

```markdown
## Version History

<details>
<summary>Version history (v1.0 – v17.32) — click to expand</summary>

| Version | Changes                    |
| ------- | -------------------------- |
| 17.32   | Review #347: PR #370 R5... |

...

</details>
```

### 3c: Fix malformed version history row

The row at line ~73 has broken pipes (2094 chars). Truncate or fix the cell
content that contains literal `|` characters.

### 3d: Remove Pattern Effectiveness Audit section (lines ~474-506)

This section is 6+ weeks stale and contains a malformed inline table. Remove
entirely. If we want audit data in the future, it belongs in a script output,
not inline.

### 3e: Remove stale Active Reviews placeholders (lines ~648-662)

Delete the 4 italic stubs that say "No active reviews" while 61 reviews exist
below.

### 3f: Standardize PR #367 retrospective format

PR #367's retro (27 lines, brief bullet points) doesn't match the structured
format used by #368-370. Add the standard subsections:

- Review Cycle Summary
- Churn Analysis
- Skills/Templates to Update
- Process Improvements

(Use existing data — just restructure, don't invent data.)

### 3g: Update Document Health section

Update line counts, active review count, and thresholds to reflect post-cleanup
state.

---

## Step 4: Build archive-reviews.js

New script: `scripts/archive-reviews.js`

**Purpose:** Move oldest N reviews from the active log to a new archive file.

**Usage:**

```bash
npm run reviews:archive              # Preview (dry run)
npm run reviews:archive -- --apply   # Apply archival
npm run reviews:archive -- --count 40  # Archive oldest 40 (default: all above 20)
```

**Algorithm:**

1. Read AI_REVIEW_LEARNINGS_LOG.md
2. Parse all `#### Review #N` entries
3. If count > 20 (threshold), select oldest entries for archival
4. Determine archive filename: `docs/archive/REVIEWS_{min}-{max}.md`
5. Write archive file with standard header
6. Remove archived entries from the active log
7. Update the `## Archive Reference` section with new file
8. Remove archived entries from reviews.jsonl (or mark as archived)
9. Report: "Archived N reviews (#X-#Y) → docs/archive/REVIEWS_X-Y.md"

**Safety:**

- Dry run by default
- Symlink guard on all file writes
- Atomic write (tmp → rename) for the active log
- Validate archive file was written before modifying active log

**Also archives retrospectives:** Retros older than the archive boundary move
with their associated reviews.

---

## Step 5: Build promote-patterns.js

New script: `scripts/promote-patterns.js`

**Purpose:** Auto-promote recurring patterns (3+ occurrences in JSONL) to
CODE_PATTERNS.md.

**Usage:**

```bash
npm run patterns:promote              # Preview candidates
npm run patterns:promote -- --apply   # Add to CODE_PATTERNS.md
```

**Algorithm:**

1. Load reviews.jsonl
2. Extract all patterns with occurrence counts
3. Load CODE_PATTERNS.md, parse existing pattern names
4. Find patterns with 3+ occurrences NOT already in CODE_PATTERNS.md
5. For each candidate:
   - Generate a pattern entry using the template from CODE_PATTERNS.md
   - Include source review references
   - Include example learnings from JSONL
6. Append new patterns to CODE_PATTERNS.md under appropriate category
7. Update suggested-rules.md to mark promoted patterns

**Integration with run-consolidation.js:** After consolidation completes,
auto-call promote-patterns:

```javascript
// In applyConsolidation(), after generateRuleSuggestions():
try {
  execFileSync("node", ["scripts/promote-patterns.js", "--apply"], {
    stdio: "inherit",
    cwd: ROOT_DIR,
  });
} catch {
  /* non-blocking */
}
```

---

## Step 6: Update package.json

Add 3 new npm scripts:

```json
{
  "reviews:archive": "node scripts/archive-reviews.js",
  "reviews:repair": "node scripts/sync-reviews-to-jsonl.js --repair",
  "patterns:promote": "node scripts/promote-patterns.js"
}
```

---

## Step 7: Update Skills

### 7a: session-begin/SKILL.md

Add archive threshold check to the session-begin checklist:

```markdown
## N. Archive Health

- [ ] Check if active reviews > 20 (run `npm run reviews:check-archive`)
- [ ] If overdue, suggest: `npm run reviews:archive -- --apply`
```

### 7b: pr-retro/SKILL.md

Add instruction after writing the retro to the markdown:

```markdown
### Step 5: Sync Retrospective to JSONL

Run `npm run reviews:sync -- --apply` to ensure the retro is captured in
reviews.jsonl for consolidation analysis.
```

---

## Step 8: Run Full Validation

After all changes:

```bash
npm run reviews:repair           # Rebuild JSONL with fixed parser
npm run reviews:check-archive    # Validate archive health
npm run reviews:archive -- --apply  # Archive overdue reviews
npm run patterns:promote         # Preview pattern promotion candidates
npm run patterns:sync            # Check pattern sync status
```

---

## Step 9: Update All Associated References

Every file that references the learnings ecosystem must be checked and updated.
Grouped by category:

### 9a: Skills that reference removed sections

| File                                                                   | Change Needed                                                                                                                                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/skills/pr-review/SKILL.md` (line 136)                         | Remove `Quick Pattern Index` from tier 2 lookup. Update tier description to point to CODE_PATTERNS.md only.                                                   |
| `.claude/skills/pr-review/reference/LEARNING_CAPTURE.md` (section 7.3) | **Delete section 7.3 "Update Quick Index"** entirely — the Quick Index no longer exists. Update 7.5 archival criteria to reference `npm run reviews:archive`. |
| `.claude/skills/session-end/SKILL.md`                                  | Update sync flow description if it references Quick Index or Pattern Audit.                                                                                   |

### 9b: State & schema documentation

| File                                      | Change Needed                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/STATE_SCHEMA.md` (lines 174-185) | **consolidation.json**: Fix writers field (currently says "alerts/run-alerts.js" — should be "run-consolidation.js"). **reviews.jsonl**: Add retro entry schema (`type: "retrospective"` fields: `pr, rounds, totalItems, churnChains, automationCandidates, skillsToUpdate, processImprovements, learnings`). Update description from "Append-only log" to "Append-only log of PR reviews and retrospectives." |

### 9c: Scripts that parse the learnings log directly

These scripts parse `AI_REVIEW_LEARNINGS_LOG.md` — verify they still work after
section removals (Quick Index, Pattern Audit, version history collapse):

| Script                                      | Risk                                                    | Action                          |
| ------------------------------------------- | ------------------------------------------------------- | ------------------------------- |
| `scripts/suggest-pattern-automation.js`     | LOW — parses `Wrong:` code blocks, not removed sections | Verify with dry run             |
| `scripts/surface-lessons-learned.js`        | LOW — searches by keyword across full content           | Verify with dry run             |
| `scripts/analyze-learning-effectiveness.js` | MEDIUM — may reference Pattern Audit data               | Read & verify, update if needed |
| `scripts/check-triggers.js`                 | LOW — checks consolidation.json, not markdown sections  | Verify with dry run             |

### 9d: Command & index documentation

| File                               | Change Needed                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `docs/SLASH_COMMANDS_REFERENCE.md` | Add `reviews:archive`, `reviews:repair`, `patterns:promote` commands           |
| `DOCUMENTATION_INDEX.md`           | Regenerate with `npm run docs:index` after all changes                         |
| `docs/AI_REVIEW_PROCESS.md`        | Update workflow diagram if it references Quick Index or Pattern Audit sections |

### 9e: Technical debt resolution

| File                                                                                     | Change Needed                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/technical-debt/MASTER_DEBT.jsonl`                                                  | Mark Quick Index debt items as resolved (status: "resolved", resolution: "Quick Index removed — CODE_PATTERNS.md is authoritative"). Search for items matching "Quick.\*Index". |
| TDMS views (`by-status.md`, `by-severity.md`, `by-category.md`, `verification-queue.md`) | Regenerate after MASTER_DEBT.jsonl updates: `npm run debt:views`                                                                                                                |

### 9f: Validation checklist

After all Step 9 updates, verify:

```bash
# 1. No remaining references to removed sections
grep -r "Quick Pattern Index" docs/ .claude/skills/ scripts/ --include="*.md" --include="*.js"
grep -r "Pattern Effectiveness Audit" docs/ .claude/skills/ scripts/ --include="*.md" --include="*.js"

# 2. All scripts still parse the log correctly
node scripts/suggest-pattern-automation.js 2>&1 | head -5
node scripts/surface-lessons-learned.js --topic test 2>&1 | head -5
node scripts/analyze-learning-effectiveness.js --auto 2>&1 | head -5

# 3. Archive health
npm run reviews:check-archive

# 4. Pattern sync
npm run patterns:sync

# 5. Documentation index
npm run docs:index
```

---

## Execution Order & Dependencies

```
Step 1 (fix sync script)  ← MUST be first, everything depends on clean parser
  ↓
Step 2 (repair JSONL)     ← uses fixed parser
  ↓
Step 3 (clean markdown)   ← can partially parallel with Step 2
  ↓
Step 4 (archive script)   ← depends on clean markdown from Step 3
Step 5 (promote script)   ← depends on clean JSONL from Step 2
  ↑ Steps 4-5 can run in parallel ↑
  ↓
Step 6 (package.json)     ← depends on scripts existing from Steps 4-5
Step 7 (update skills)    ← depends on scripts existing from Steps 4-5
  ↑ Steps 6-7 can run in parallel ↑
  ↓
Step 8 (validation)       ← validates core changes work
  ↓
Step 9 (update all refs)  ← update every associated file
  ↓
Step 9f (final validation) ← grep for stale refs, run all scripts, regen index
```

**Parallelizable groups:**

- Steps 4 + 5 (independent scripts)
- Steps 6 + 7 (independent file edits)
- Step 9a + 9b + 9d + 9e (independent file updates within Step 9)

---

## Risk Assessment

| Risk                         | Mitigation                                                |
| ---------------------------- | --------------------------------------------------------- |
| JSONL repair loses data      | Backup reviews.jsonl before repair; repair is idempotent  |
| Archive script corrupts log  | Dry-run default; atomic writes; validate before modify    |
| Pattern promotion adds junk  | Preview mode default; only promote 3+ occurrence patterns |
| Missing reviews #323, #335   | Log as known gaps if not recoverable from markdown        |
| Markdown cleanup breaks refs | check-review-archive.js validates completeness after      |
