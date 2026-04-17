---
name: recall
description: >-
  Query the Content Analysis System knowledge base. Search extraction
  candidates, filter by tags/type/source, find specific ideas across all
  analyzed sources.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-04-12
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Recall

Search and query your extracted knowledge. Everything analyzed via `/analyze` is
searchable here.

## When to Use

- Query the CAS knowledge base after running `/analyze`
- Filter extractions by tag, type, source, or date
- Explore what's been extracted before starting new analysis
- List all analyzed sources (`/recall --target=sources`)

## When NOT to Use

- Analyzing a new source → use `/analyze` or a direct handler first
- Cross-source synthesis / patterns → use `/synthesize`
- Raw filesystem search for arbitrary text → use Grep

## Input

```
/recall <search terms>                  # Free-text FTS5 search
/recall --tag=architecture              # Filter by tag
/recall --type=repo                     # Filter by source type
/recall --sort=recent                   # Sort by date
/recall --sort=novelty                  # Sort by novelty (high first)
/recall --source=unstructured           # By specific source
/recall --target=sources                # List analyzed sources instead
/recall --stats                         # Show index statistics
/recall --limit=30                      # Adjust result limit (default 20)
```

**Combine filters:**

```
/recall architecture --type=repo --sort=novelty
/recall --tag=anti-pattern --type=website
/recall --target=sources --type=media
```

## How It Works

1. Parse the query (free text, flags, or both)
2. Run `node scripts/cas/recall.js` with parsed arguments
3. Present results in a readable format
4. Offer follow-up options

## Presenting Results

Each result comes with **category-aware tag groupings** per CONVENTIONS.md §14:
`semantic_tags` (grouped by category), `taxonomic_tags`, and `orphan_tags`
(legacy tags awaiting retag).

### For extraction queries (default)

Present as a list. "About:" shows semantic tags flat (middle-dot separated).
"Type:" shows taxonomic tags. "Legacy tags:" appears only when `orphan_tags` is
non-empty — signals un-retagged entries.

```
Found 8 results for "architecture":

1. Auto-routing via type detection [pattern]
   Source: unstructured-io/unstructured (repo) | Novelty: high | Effort: E2

   About: knowledge-management · claude-code · multi-agent · jason-os-relevant
   Type: framework

   "partition() auto-detects file type via libmagic, routes to format-specific
   partitioner."

2. Per-site extractor plugin architecture [pattern]
   Source: iawia002/lux (repo) | Novelty: high | Effort: E2

   About: extraction · web-crawling
   Type: utility-tool
   Legacy tags: repo, anti-pattern

   "44-site video downloader with per-site extractor plugins."
```

### For source queries (--target=sources)

```
29 analyzed sources:

  repo (24): unstructured, docling, reader, ...
  website (5): docs-composio-dev, karpathy-gist, ...
  document (0)
  media (0)
```

### For stats (--stats)

Present four groupings:

1. **Summary**: sources, extractions, unique_tags counts
2. **By source type / novelty**: existing breakdowns
3. **Vocabulary**: `total_size` plus `by_category` (how many tags live in each
   of the 8 categories) and `top_tags_by_category` (top 5 per category by
   journal-applied count)
4. **Orphan / legacy health**: `orphan_tags_in_journal` (tags used in journal
   but missing from the vocabulary — signals retag gaps) and
   `legacy_tags_in_journal` (forbidden tags or unresolved synonyms still
   appearing — will clear after retag)

## Follow-Up Options

After presenting results, offer:

1. **Read full analysis** — "Want to read the full analysis for [source]?"
2. **Narrow search** — "Add a tag or type filter?"
3. **Show related** — "Show other candidates from the same source?"
4. **Done** — Return to conversation

## When Index Is Missing

If the SQLite database doesn't exist:

```
Index not found. Building from .research/ files...
[runs rebuild-index.js automatically]
Done. [N] sources, [M] extractions indexed.
[then runs the query]
```

## Critical Rules

1. **Auto-rebuild if missing.** Don't error on missing index — rebuild it.
2. **JSON output to readable format.** The script outputs JSON. Transform to
   human-readable presentation.
3. **Always show result count.** "Found N results" or "No results found."
4. **Suggest refinements on empty results.** "No results for X. Try broader
   terms, or check /recall --stats for available tags."

## Integration

- **Producers:** `/synthesize`, `/analyze` (router), 4 analysis handler skills
  (`/repo-analysis`, `/website-analysis`, `/document-analysis`,
  `/media-analysis`)
- **Consumers:** `/deep-plan`, `/brainstorm` (prior-art surfacing)
- **Cross-skill contract:** `/recall` reads `synthesis.json` via the SQLite
  index. Gates on `synthesis.json.schema_version >= 1.0`; older/unversioned
  artifacts are ignored with a WARN (rebuild required via `/synthesize`).
- **Shared artifacts:** `.research/extraction-journal.jsonl`,
  `.research/analysis/synthesis/synthesis.json`, CAS SQLite index

## Version History

| Version | Date       | Description                                                                                    |
| ------- | ---------- | ---------------------------------------------------------------------------------------------- |
| 1.1     | 2026-04-12 | T40 Part C — category-aware tag display (semantic/taxonomic/orphan) + vocabulary-aware --stats |
| 1.0     | 2026-04-08 | Initial creation (T28 CAS, Session #269)                                                       |
