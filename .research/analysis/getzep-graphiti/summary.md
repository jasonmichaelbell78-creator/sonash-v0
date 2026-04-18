# Summary — getzep/graphiti

**Python framework for building temporal context graphs for AI agents.** 25,065
stars, 2,491 forks, Apache-2.0, Python 3.10+. Pushed 3 days ago. Backed by Zep
Software (commercial managed counterpart). arXiv paper: 2501.13956.

## One-Line Takeaway

> A bi-temporal knowledge-graph engine where facts have validity windows and
> history is preserved through invalidation. Pluggable across 4 graph DBs (Neo4j
> / FalkorDB / Kuzu / Neptune) and 6 LLM providers, with a first-class MCP
> server for AI assistant memory. **Extract patterns; don't adopt** (stack
> mismatch + no home use case).

## Six Summary Bands

| Dimension       | Band   | Score |
| --------------- | ------ | ----- |
| Security        | Solid  | 7.0   |
| Reliability     | Solid  | 7.5   |
| Maintainability | Strong | 8.5   |
| Documentation   | Strong | 8.5   |
| Process         | Strong | 8.0   |
| Velocity        | Strong | 9.0   |

## Adoption Verdict

**Extract-only** (classification: framework).

Blockers: Python vs home TypeScript, requires graph DB infrastructure, no home
use case justifies operational load.

Recommendation: lift cursor_rules.md protocol, versioned LLM model catalog,
telemetry transparency template, SEMAPHORE tuning guidance,
structured-output-as-floor posture.

## Top 5 Extractable Patterns

1. **`cursor_rules.md` operating protocol** — 34-line prescriptive doc handed to
   AI memory clients. Home gap: no equivalent for memory MCP + episodic-memory
   skill.
2. **Versioned LLM model catalog in `CLAUDE.md`** — dated table of current model
   names. Defense against AI "correcting" model names to older ones.
3. **Opt-out telemetry with explicit content exclusions** — "what we collect /
   what we don't" template.
4. **Structured Output as hard floor** — named-floor pattern for any
   pluggable-LLM skill.
5. **SEMAPHORE_LIMIT per-provider tuning table** — symptom→dial guide for
   rate-limit handling.

## Top 3 Concerns

1. REST server has zero auth by default (DELETE /clear on port 8000).
2. No REST server test suite; no performance / benchmark tests.
3. 9 absence patterns catalogued (auth, perf tests, snapshot tests, multi-DB
   parity, arch doc, migration guide, coverage reporting, multi-Python CI, LLM
   response validation).

## Primary Challenge to Home

**When a user correction supersedes an earlier memory, is the original preserved
or destroyed?** Home MEMORY.md overwrites on correction; Graphiti's bi-temporal
model invalidates but preserves. Corrections are instructive — erasing them
erases the learning signal. Lighter version: add `history:` sub-field to
feedback memories preserving superseded corrections with dates.

**Secondary challenge:** home has no operating-protocol doc for the memory
system. Graphiti hands every AI client a cursor_rules.md. Home relies on
system-prompt instructions — not auditable, not editable, not prescriptive.

## Artifacts

- `analysis.json` — structured metadata (v3.0 schema)
- `value-map.json` — 9 patterns + 4 knowledge + 10 content + 4 anti-patterns
- `creator-view.md` — dual-lens conversational analysis (6 sections + 2b
  Use-As-Is Verdict)
- `engineer-view.md` — bands, absence patterns, adoption verdict
- `deep-read.md` — internal artifacts knowledge extraction (20 insights)
- `content-eval.jsonl` — 24 embedded/referenced content items evaluated
- `coverage-audit.jsonl` — 23 unexplored categories logged (all skip-defaulted)
- `dim-security.md`, `dim-architecture.md`, `dim-docs.md`, `dim-tests.md` —
  dimension agent outputs
- `repomix-output.txt` — 3.58M token packed source
- `source/` — clone of main branch

## Next Actions (routing menu presented separately)

- **Extract value** — load value-map.json, walk top patterns
- **Send to TDMS** — skip (opt-in only)
- **Deep-plan this** — candidates: memory protocol doc, model catalog addendum,
  feedback-history field
- **Save to memory** — cursor_rules pattern + bi-temporal challenge + extraction
  verdict
- **Cross-repo synthesis** — skip (only 1 analyzed in agent-memory cluster)
