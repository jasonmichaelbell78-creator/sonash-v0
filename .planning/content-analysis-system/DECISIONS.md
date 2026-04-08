# Decision Record: T28 Content Analysis System

**Date:** 2026-04-08 **Session:** #269 **Questions Asked:** 25+ **Decisions
Captured:** 29

---

## Naming & Identity

| #   | Decision              | Choice                            | Rationale                                         |
| --- | --------------------- | --------------------------------- | ------------------------------------------------- |
| 1   | Router skill name     | `/analyze`                        | Simple verb, naturally used in brainstorm         |
| 2   | Query skill name      | `/recall`                         | Implies memory/retrieval, future growth potential |
| 4   | Router skill location | `.claude/skills/analyze/SKILL.md` | Skill name matches command                        |

## Architecture & Structure

| #   | Decision                  | Choice                                                 | Rationale                                                      |
| --- | ------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| 3   | Source type detection     | Pattern matching on input + `--type` override flag     | Auto-detect 95% of cases, flag for ambiguous                   |
| 5   | Existing skills           | Retain standalone commands (`/repo-analysis`, etc.)    | Power user direct access, router is preferred not exclusive    |
| 6   | Schema ownership          | Zod in `scripts/lib/analysis-schema.js`                | Each handler validates own output. Schema-as-code per OTB.     |
| 7   | Universal analysis schema | snake_case. Core fields shared, type-specific optional | Common structure, room for type-specific data                  |
| 8   | Extraction schema         | Expand current v2.0 + `tags` + `source_analysis_id`    | Backward compatible. Strict shared conventions via Zod.        |
| 9   | Queryable data layer      | SQLite + better-sqlite3 + FTS5 as search index         | Files canonical. DB deletable/rebuildable. Research validated. |
| 10  | Database location         | `.research/content-analysis.db` (gitignored)           | Alongside the files it indexes, regenerable                    |
| 22  | Output directory          | Flatten into `.research/analysis/<slug>/`              | Migrate existing files. Cleaner than split directories.        |

## Handler Design

| #   | Decision                    | Choice                                                              | Rationale                                                               |
| --- | --------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 13  | Repo-analysis adaptation    | Modify to write unified schema directly. Back up first. No adapter. | All 4 skills must match. Backup enables safe revert.                    |
| 14  | Website-analysis adaptation | Same — modify directly, back up first, no adapter                   | Consistent with #13. Adapters add unnecessary complexity.               |
| 15  | Document handler scope      | One skill for all text-readable types                               | Same extraction logic; only input handling differs.                     |
| 16  | PDF reading                 | Claude's built-in Read tool                                         | No deps. Don't build parsers — delegate to existing tools.              |
| 17  | Media transcription         | Captions API + user transcript + Whisper opt-in                     | Ships complete. Runtime detects Whisper. GPU at home, captions at work. |
| 20  | Handler architecture        | All 4 are skills following repo-analysis v4.3 template              | Cohesion is priority. Agents used WITHIN skills, not AS handlers.       |

## Synthesis

| #   | Decision              | Choice                                                                        | Rationale                                              |
| --- | --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| 18  | Synthesis scope       | `/analyze --synthesize` defaults all, `--type` narrows                        | Cross-type or single-type, user controls               |
| 19  | Incremental synthesis | `last_synthesized_at` per record, builds on previous                          | Avoid full corpus re-analysis as data grows            |
| 21  | Subagent use          | Parallel agents within skills (Creator+Engineer views, synthesis themes+gaps) | Proven pattern from deep-research, keeps context clean |

## Data Layer & Recall

| #   | Decision              | Choice                                                                        | Rationale                                         |
| --- | --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| 11  | Recall implementation | Node.js script `scripts/cas/recall.js` invoked by skill                       | Simple, testable, no MCP overhead                 |
| 12  | Tag system            | Two-tier: auto-tags + user tags. Suggestions in each handler.                 | Immediately searchable, user can organize on top. |
| 23  | SQLite index contents | Extraction entries + source records (id, title, type, tags, scoring, summary) | Primary queryable surface + useful source list    |
| 27  | Recall query modes    | Free-text + tag + source type + structured (novelty, recency, by source)      | Full flexibility, all cheap via SQLite            |
| 28  | Index update timing   | Auto after `/analyze` + manual rebuild available                              | Immediately recallable. Rebuild for out-of-sync.  |

## Migration & Operations

| #   | Decision            | Choice                                                      | Rationale                                              |
| --- | ------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| 24  | Migration script    | Idempotent rebuild — always re-runnable                     | Files canonical. One script for initial + recovery.    |
| 29  | Migration summaries | Generate 2-3 sentence summaries from creatorLens/key_claims | Summary field required, existing data doesn't have it. |

## Drift Prevention

| #   | Decision                 | Choice                                                                    | Rationale                                                |
| --- | ------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| 25  | CONVENTIONS.md expansion | Add sections 12-15: schema, handler output, tags, skill template contract | Drift prevention for expanded skill family               |
| 26  | Error handling           | Handlers own recovery, router reports                                     | Existing skills already handle errors, router stays thin |

## Overarching Constraint (from user, Session #269)

> All 4 handler skills MUST match in structure. Repo-analysis v4.3 is the
> template. The only difference between skills is the content analyzed. Use
> agents within skills for parallelism, not as skill replacements. Back up
> existing skills before modification. Changes to internals are fine as long as
> the user experience stays the same.
