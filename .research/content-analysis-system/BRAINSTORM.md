# Brainstorm: T28 Content Analysis System

**Date:** 2026-04-08 **Session:** #269 **Status:** DIRECTION CHOSEN

---

## Problem

Four separate skills (repo-analysis, website-analysis, repo-synthesis,
website-synthesis) do essentially the same thing for different source types. To
analyze something, you have to know which skill to invoke. There's no skill at
all for PDFs, audio, video, gists, or other media. And the extracted ideas (142+
candidates across 12 sources) are growing fast — in a few weeks of active use,
there could be 500-1000+ entries that Claude can't efficiently search through by
reading files.

## Chosen Direction

**Two user-facing commands, everything else behind the scenes.**

### `/analyze`

Feed it anything — a repo URL, a website, a YouTube link, a file path, or no
input (triggers synthesis). The router detects source type, dispatches to the
right handler, extracts ideas into a unified format, and stores them in a
queryable data layer.

### `/recall`

Search and query the extracted knowledge. Tags, filters, full-text search.
Separate from `/analyze` because it has future growth potential as the data
layer evolves.

## Components

| Component                          | Status          | User-facing? |
| ---------------------------------- | --------------- | ------------ |
| Router/orchestrator (`/analyze`)   | New             | Yes          |
| Repo handler                       | Exists (v4.3)   | No           |
| Website handler                    | Exists (v1.1)   | No           |
| Media handler (video/audio)        | New             | No           |
| Document handler (PDF, gist, etc.) | New             | No           |
| Unified schema (Zod-enforced)      | New             | No           |
| Schema contract / drift prevention | Expand existing | No           |
| Queryable data layer               | New             | No           |
| Synthesis (within router)          | Merge existing  | No           |
| `/recall`                          | New             | Yes          |
| Data migration script              | New (one-time)  | No           |

## Source Type Categories

| Category  | Extraction method                  | Examples                               |
| --------- | ---------------------------------- | -------------------------------------- |
| Repos     | GitHub API, cloning, code scan     | GitHub repos                           |
| Websites  | Browser extraction, link graphs    | Any URL, documentation sites           |
| Media     | Transcription first, then analysis | YouTube, TikTok, podcasts, audio files |
| Documents | Read content directly              | PDFs, gists, articles, markdown, arxiv |

## Constraints

- **Ships complete.** No MVP, no future phases. Everything in the component list
  ships together.
- **Infrastructure serves the skill.** The data layer exists because `/analyze`
  and `/recall` need it, not as its own project.
- **Grounded in user needs.** Every component traces back to "analyze anything,
  extract ideas, find them later."
- **Build order can be smart** — easier components first — but everything ships.
- **Existing skills are adapted, not rewritten.** Repo-analysis v4.3 and
  website-analysis v1.1 keep their logic, adapt their output format.
- **Drift prevention is mandatory.** CONVENTIONS.md + Zod schema enforcement so
  handlers stay cohesive as they evolve.

## Anti-Goals

- Don't let infrastructure eat the project (learned from T28 data layer detour)
- Don't require users to know which skill to call
- Don't build 12 separate skills for 12 source types
- Don't break existing skills during adaptation

## Open Questions (for `/deep-plan`)

1. What exactly is the queryable data layer? Keep it practical.
2. Universal schema design — which fields, what's optional per source type
3. How to adapt repo-analysis and website-analysis output without breaking them
4. Media handler transcription approach (captions-first vs Whisper)
5. What does cross-type synthesis look like in practice
6. Router type detection logic
7. Migration plan for existing 142+ candidates

## Prior Research (usable, not the project)

- **Analysis/synthesis comparison** (`.research/analysis-synthesis-comparison/`)
  — 60 claims on schema drift, architectural differences between the 4 skills,
  Zod validation recommendation. Directly applicable to schema unification.
- **T28 data layer research** (`.research/t28-intelligence-graph-data-layer/`) —
  SQLite + FTS5 + better-sqlite3 findings may inform the queryable data layer
  component. Use as reference, not as the project scope.
- **T27 media extraction** — youtube-transcript-api, faster-whisper, layered
  architecture for video/audio. Informs media handler design.
- **Unstructured-io patterns** — auto-routing via type detection, strategy
  fallback chain. Informs router design.
- **Source-slug-map.json** — 18 source-to-directory mappings, useful for
  migration.

## Version History

| Version | Date       | Changes                                                    |
| ------- | ---------- | ---------------------------------------------------------- |
| 1.0     | 2026-04-08 | Initial brainstorm (Session #269, 4 directions → 1 chosen) |
