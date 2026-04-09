# Decision Record: Synthesis Consolidation

**Date:** 2026-04-09 **Session:** #270 **Questions Asked:** 32 **Decisions
Captured:** 32

---

## Naming & Identity

| #   | Decision               | Choice                                                                             | Rationale                                                                   |
| --- | ---------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | Skill name and command | `/synthesize` — single verb command matching `/analyze` and `/recall`              | CAS commands are verbs. Router `--synthesize` is alias, not separate skill. |
| 2   | Skill file location    | `.claude/skills/synthesize/SKILL.md` + `REFERENCE.md`                              | New directory matching command name. Old dirs deprecated then deleted.      |
| 3   | Old skill disposition  | Deprecate with redirect — one-liner pointing to `/synthesize`, delete next session | One-session overlap prevents breakage from habit or stale references.       |

## Architecture & Structure

| #   | Decision                 | Choice                                                                                                                                                                                                                                                        | Rationale                                                                        |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 4   | Output path              | `.research/analysis/synthesis/` subdirectory with `history/` for prior runs                                                                                                                                                                                   | Keeps `.research/analysis/` root clean. History enables re-synthesis comparison. |
| 5   | Output file naming       | Lowercase: `synthesis.md`, `synthesis.json`                                                                                                                                                                                                                   | Matches CAS artifact convention (analysis.json, creator-view.md, etc.)           |
| 6   | Structured output schema | Type-aware — base keys always present, type-specific sections optional via `.optional()` in Zod                                                                                                                                                               | Avoids empty arrays for irrelevant sections while ensuring minimum outputs.      |
| 7   | Paradigm support         | Available for all types. `--paradigm=thematic` (default), `narrative`, `matrix`, `meta-pattern`                                                                                                                                                               | Narrative/matrix/meta-pattern are genuinely useful across all source types.      |
| 15  | Artifact contracts       | Reads: analysis.json + value-map.json + creator-view.md (MUST), 4 SHOULD artifacts, journal, extractions, chain, previous synthesis, 5 home context. Writes: synthesis.md + synthesis.json (MUST), history archive, state file. Updates: last_synthesized_at. | Maximum context for thorough analysis.                                           |
| 17  | State file               | Single: `.claude/state/synthesize.state.json`                                                                                                                                                                                                                 | Parallel synthesis runs don't make sense. Single file with history/ for outputs. |
| 28  | Zod schema location      | Add to `scripts/lib/analysis-schema.js` — single CAS schema file for all Zod                                                                                                                                                                                  | Synthesis references analysis types. Co-location enables shared imports.         |

## Scale & Scope

| #   | Decision                       | Choice                                                                                                                                                               | Rationale                                                                                    |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 8   | Interactive opening menu       | 6 options: Full, Incremental, Re-synthesize, Scoped, Resume, Review previous. State-aware visibility.                                                                | All options available, menu shows only what's contextually valid.                            |
| 9   | Source count minimum           | 3+ total (any mix), 2 allowed with warning. Cross-type mix is valid.                                                                                                 | 1 repo + 1 website + 1 video about same topic is valid synthesis.                            |
| 11  | Output sections (thematic)     | 8 sections: merged themes+signals, gaps, reading chain, evolution, portfolio, knowledge map, opportunity matrix, changes                                             | Themes and signals merged (every theme gets convergence confidence). Opportunity matrix new. |
| 18  | Quick scan depth handling      | Two-tier participation in synthesis + root cause fix: upgrade all 22 quick scans to Standard EARLY in plan. Quick scan becomes preview-only. Gate messaging updated. | Quick scans that can't contribute to synthesis are pointless. Fix data first.                |
| 30  | Quick scan migration logistics | All 22 in one session, one commit. Sequential with batch optimizations (pre-set depth, existing tags, batched retro, single index rebuild). ~2-2.5 hours.            | Agent farming infeasible due to interactive steps, shared files, Windows agent bugs.         |

## Behavior & Rules

| #   | Decision                  | Choice                                                                                                                                                                                                         | Rationale                                                                            |
| --- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 10  | Re-synthesis change dims  | All 6: theme, candidate, gap, confidence, contradiction, source impact                                                                                                                                         | Ultra-thorough. Synthesis is macro-scale analysis, not just theme finding.           |
| 12  | Opportunity Matrix depth  | Interactive — ranked opportunities with effort/impact/evidence, numbered menu routing to /brainstorm, /deep-plan, /deep-research, /analyze                                                                     | Closes analysis→action loop. Complexity determines routing target.                   |
| 13  | Source tier weighting     | Full tier assignment for all types. Repos=T1, Websites=T1-T4, Documents=T1-T3, Media=T1-T3. Stored in analysis.json.                                                                                           | Authority varies within every type. Papers vs blog summaries carry different weight. |
| 14  | Incremental synthesis     | Hybrid — new sources checked against previous conclusions. Confirm, extend, or flag contradictions. Escalate to full re-run on contradictions.                                                                 | Fast for additive, catches stale conclusions when evidence changes.                  |
| 19  | Recovery strategy         | Section-level resume. State tracks `sections_completed[]`. Agent spawns with max sources per agent for large counts.                                                                                           | Each of 8 sections independently writable. Resume skips completed.                   |
| 20  | Subagent strategy         | Hybrid — inline for <10 sources, agents for 10+. Merge/interpretation always inline. Max sources per agent.                                                                                                    | Agents risk losing cross-source connections. Heavy reading parallelized.             |
| 21  | Missing artifact handling | Pre-flight with upgrade suggestions + full migration of all 22 quick scans to Standard. Scope expansion acknowledged.                                                                                          | Synthesis needs Standard-depth data. Migration is prerequisite work.                 |
| 24  | Synthesis freshness       | Any new source triggers notice with graded urgency based on source depth and count.                                                                                                                            | Flag any change, grade urgency. Menu already has incremental option.                 |
| 27  | Self-audit dimensions     | 10 total: 3 minimum floor (artifact, schema, completeness) + 7 domain-specific (evidence grounding, candidate integrity, convergence math, dedup check, gap validity, opportunity grounding, changes accuracy) | Thorough verification matching the thoroughness of the analysis itself.              |
| 32  | Source tier assignment    | Hybrid — handler suggests tier in analysis.json, user can override via tags or during synthesis pre-flight.                                                                                                    | Handler has best context but user may disagree. Pre-flight shows tiers.              |

## Integration & Cross-References

| #   | Decision                   | Choice                                                                                                                                                                                                           | Rationale                                                               |
| --- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 16  | Upstream reference updates | 14 active files: 4 handler skills, analyze router + REFERENCE, CONVENTIONS.md, CLAUDE.md, COMMAND_REFERENCE.md, DOCUMENTATION_INDEX.md, SESSION_CONTEXT.md, synthesis-schema.ts. Full grep sweep.                | User flagged analysis skills. Comprehensive sweep catches stragglers.   |
| 29  | CONVENTIONS.md updates     | New Section 17 "Synthesis Output Contract" — separate from handler contract. Skill follows shared conventions (phase markers, write-to-disk-first, no-silent-skips, self-audit, retro) but NOT handler template. | Synthesis is structurally different from handlers. Own contract needed. |
| 31  | Analyze router change      | Smart redirect — `/analyze --synthesize` invokes `/synthesize` with flags passed through. Router adds context (source count, type breakdown).                                                                    | Keeps router thin while maintaining `--synthesize` UX.                  |

## Domain-Specific

| #   | Decision                     | Choice                                                                                                            | Rationale                                                                        |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 22  | Cross-type insight detection | All methods — tags, semantic overlap, candidate matching, explicit connections. Highest recall.                   | Cross-type connections are highest-value unique output. Can't afford false negs. |
| 23  | Candidate deduplication      | Deduplicate within type + promote. Convergence boosts ranking. Merged entry shows all sources.                    | Pattern in 3 independent sources is validated, not 3 separate candidates.        |
| 25  | Reading chain across types   | Hybrid — dependency links > pedagogical ordering > tag clusters. Study path: overview → tutorial → impl → theory. | Real dependencies highest quality. Pedagogical fallback for unlinked sources.    |
| 26  | Review previous behavior     | Freshness context + interactive section navigation. Staleness assessment + table of contents.                     | Don't force full re-read. Show what's stale and let user navigate.               |

## Overarching Constraint (from user, Session #270)

> This is synthesis AND macro-scale analysis. Ultra-thorough, maximizing
> information, suggestions, and opportunities. Not just theme-finding. Quick
> scans that can't contribute are pointless — fix the data first. One session,
> one commit for the migration. All upstream and downstream references must be
> updated.
