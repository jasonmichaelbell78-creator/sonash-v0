# /synthesize Subagent Spec

**Purpose:** Each of 4 agents reads its 8-source slice and writes ONE structured
JSON output. Parent merges all 4 outputs inline (no cross-slice synthesis from
agents).

---

## Inputs each agent receives

At spawn time, each agent is told:

1. **Slice index** (1..4) and the 8 slugs in the slice
2. **Home context brief** — read
   `.planning/synthesis-wave5-agents/HOME_CONTEXT.md` first
3. **SOURCES.json** — read `.planning/synthesis-wave5-agents/SOURCES.json` for
   the metadata (paths, tags, scoring) of your slice's sources
4. **This spec** — read `.planning/synthesis-wave5-agents/AGENT_SPEC.md`
5. **Output path** — `.planning/synthesis-wave5-agents/slice-N-output.json`
   (atomic write)

## What each agent does

For each source in its slice:

1. Read `creator-view.md` end-to-end (primary synthesis input — prose)
2. Read `value-map.json` (candidates with descriptions)
3. Skim `findings.jsonl` (per-finding evidence)
4. Skim `summary.md` and `deep-read.md` if present

Produce, PER SOURCE:

- **raw_themes** — themes this source contributes. Each = { name, short_desc,
  evidence_quote (≤240 chars), strength_signal (strong, medium, weak) }
- **raw_candidates** — copy/refine value-map candidates with minimal edits. Each
  = { name, type, description, novelty, effort, relevance, tags, source_slug }.
  Preserve names verbatim where possible so dedup works in merge.
- **relevance_to_home** — 1-2 sentence narrative: is this source's knowledge
  relevant to SoNash or JASON-OS? Be concrete.

Produce, PER SLICE (one per output file):

- **initial_clusters** — themes you see appearing across ≥2 sources WITHIN your
  slice. Each = { cluster_name, member_themes (list of {source_slug,
  theme_name}), convergence_within_slice (weak/medium/strong), short_desc }
- **absence_signals** — knowledge domains you expected for SoNash / JASON-OS but
  DID NOT find in your slice. Each = { domain, expected_because, suggestion }
- **notes** — free-form observations that don't fit the categories but matter
  for the parent synthesis

## Output format

Write to `.planning/synthesis-wave5-agents/slice-N-output.json`:

```json
{
  "slice_index": 1,
  "slugs": ["slug1", ...],
  "generated_at": "2026-04-13T...",
  "per_source": {
    "slug1": {
      "raw_themes": [ {"name":"...", "short_desc":"...", "evidence_quote":"...", "strength_signal":"strong"} ],
      "raw_candidates": [ {"name":"...", "type":"pattern|knowledge|anti-pattern|content|...", "description":"...", "novelty":"high|medium|low", "effort":"E0|E1|E2|E3", "relevance":"high|medium|low", "tags":[], "source_slug":"slug1"} ],
      "relevance_to_home": "..."
    }
  },
  "initial_clusters": [
    {"cluster_name":"...", "member_themes":[{"source_slug":"slug1","theme_name":"..."}, ...], "convergence_within_slice":"strong", "short_desc":"..."}
  ],
  "absence_signals": [
    {"domain":"...", "expected_because":"SoNash/JASON-OS feature...", "suggestion":"..."}
  ],
  "notes": ["..."]
}
```

## Discipline rules (hard stops)

- **Read-only.** Do not modify any file except your own `slice-N-output.json`.
  Do NOT touch `analysis.json`, `value-map.json`, creator-view.md, etc.
- **Do not synthesize across the full corpus.** Your scope is your 8 sources.
  Observations like "this theme probably shows up elsewhere" belong in `notes`,
  NOT as a full theme.
- **Do not skip empty-return silently.** If a source has no relevant themes, say
  so explicitly in `notes` with the reason. Parent will treat silent empties as
  failures (per SoNash feedback memory).
- **Do not write prose paragraphs as `short_desc`.** Keep descriptions to ≤240
  chars. The parent will expand into prose.
- **Preserve candidate names verbatim.** The parent dedupes by name. Don't
  rename.
- **Quote for evidence.** `evidence_quote` must be a real substring from the
  source's creator-view.md or value-map.json description. No paraphrasing.

## Target size

- Per source: 3-8 raw themes, 3-15 raw candidates.
- Per slice: 2-6 initial clusters, 0-5 absence signals.
- Output file: 20-80 KB JSON.

## If you hit an error

If a source has unreadable or empty artifacts, record the failure in `notes`
with the slug and reason. Do not retry. Do not re-analyze. Continue with
remaining sources.
