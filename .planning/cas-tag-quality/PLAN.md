# CAS Tag Quality Improvements

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-12
**Status:** APPROVED — ready for implementation
<!-- prettier-ignore-end -->

## Problem

Current extraction journal tags are **taxonomic** (what-type-is-it) rather than
**semantic** (what-is-it-about). 236 entries, 149 unique tags, most used 1x.
Examples: 165x `repo`, 43x `framework`, 24x `research-tool` — these duplicate
the `type` field and provide no discovery value. Rich semantic content lives in
`notes` prose but never reaches the tag layer.

## Decisions (Confirmed 2026-04-12)

1. **Strip source-type tags** (`repo`, `website`, `document`, `media`) —
   redundant with the `type` field. Keep other taxonomic (`library`,
   `framework`, `curated-list`).
2. **Controlled vocabulary with controlled growth** at
   `.research/tag-vocabulary.json`. Prefer reuse; new tags only when nothing
   fits; user approves new vocabulary additions.
3. **Retag all 236 existing entries** in batches of 5-10 for user approval.

## Implementation Plan

### Part A: Fix at the Source (future analyses)

**A1. Rewrite CONVENTIONS.md Section 14** (canonical tag guidance, consumed by
all 4 handler skills: repo-analysis, website-analysis, document-analysis,
media-analysis)

- Define **taxonomic** tags (what-type) vs **semantic** tags (what-about,
  what-for, what-pattern)
- Cap taxonomic at 1-2 per entry
- Require 3-5 semantic tags per entry
- Forbid source-type tags (`repo`, `website`, `document`, `media`) — redundant
  with `type` field
- Before/after examples showing shallow vs rich tagging

**A2. Update Phase 6c (or equivalent) in 4 handler skills** to reference the
updated convention. Likely a single reference update since they share
CONVENTIONS.md.

**A3. Create `.research/tag-vocabulary.json`** with structure:

```json
{
  "tags": {
    "plugin-dispatch": {
      "definition": "Runtime routing based on input type or registered handlers",
      "category": "pattern",
      "count": 0
    },
    "jason-os-relevant": {
      "definition": "Directly applicable to JASON-OS portable OS vision",
      "category": "applicability",
      "count": 0
    }
  },
  "synonyms": { "knowledge-base": "knowledge-management" },
  "categories": ["pattern", "applicability", "quality", "taxonomic"]
}
```

**A4. Growth rules** (encoded in CONVENTIONS.md + enforced in retag script):

- Before applying a new tag, check the vocabulary
- If a synonym or parent concept exists, use that
- If the concept is genuinely new, propose it with 1-sentence definition
- User approves new vocabulary additions (never auto-added)

### Part B: Retroactive Retag (existing 236 entries)

**B1. Seed the vocabulary first** — analyze all 236 entries, cluster similar
concepts, present proposed initial vocabulary to user for approval before any
retagging happens.

**B2. Build `scripts/cas/retag.js`** — interactive retag tool:

- Reads each entry's `notes` + source's `creator-view.md`
- Proposes semantic tag enrichments per entry
- Strips source-type tags (`repo`, `website`, `document`, `media`)
- Keeps other taxonomic tags (`library`, `framework`, `curated-list`)
- Adds 3-5 semantic tags per entry from the vocabulary
- Batches of 5-10 entries for user approval per batch
- Writes updates through a locked CLI (pattern from `todos-cli.js`) with
  regression guard
- Auto-rebuilds SQLite index after

**B3. Dry-run mode** — `--dry-run` flag shows proposed changes without writing.

### Part C: Integration

**C1. Update `/recall`** — present taxonomic and semantic tags distinctly in
results. Semantic is the searchable surface; taxonomic is shown as metadata.

**C2. Update `/recall --stats`** — break down by tag category (taxonomic vs
semantic), show vocabulary size, top tags per category.

## Files to Create

- `.research/tag-vocabulary.json` (new)
- `scripts/cas/retag.js` (new)

## Files to Modify

- `.claude/skills/shared/CONVENTIONS.md` (Section 14 rewrite)
- `.claude/skills/repo-analysis/SKILL.md` (Phase 6c reference)
- `.claude/skills/website-analysis/SKILL.md`
- `.claude/skills/document-analysis/SKILL.md`
- `.claude/skills/media-analysis/SKILL.md`
- `.claude/skills/recall/SKILL.md` (display changes)
- `scripts/cas/recall.js` (category-aware display)
- `.research/extraction-journal.jsonl` (retag output)

## Dependencies

- SQLite FTS5 index rebuild after retag
- User approval at: initial vocabulary seed, each retag batch, new vocabulary
  additions

## Open Questions

- None at approval time. Decisions confirmed 2026-04-12.

## Context

Discovered during `/recall` investigation 2026-04-12. Plan approved for
implementation. Pending transfer to feature branch that has repo-analysis work
not present in current worktree.
