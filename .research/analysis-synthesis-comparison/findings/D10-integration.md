# Findings: Integration & Downstream Routing Comparison

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-04-06
**Sub-Question IDs:** SQ-010

---

## Summary

All four skills (website-analysis, repo-analysis, website-synthesis,
repo-synthesis) share a common integration philosophy: disk-first state, opt-in
TDMS, memory persistence, and downstream routing to `/deep-plan`. However, there
are significant asymmetries: TDMS integration exists only in repo-analysis (not
website-analysis); invocation tracking exists in both analysis skills but not
the synthesis skills (except website-synthesis via explicit
`write-invocation.ts` call); and index management diverges sharply —
repo-analysis maintains a shared `research-index.jsonl` while website-analysis
does not.

---

## Key Findings

### 1. TDMS Integration: Repo-Analysis Only [CONFIDENCE: HIGH]

TDMS (Tech Debt Management System) integration is a named routing option in
**repo-analysis** only. It is absent from website-analysis, website-synthesis,
and repo-synthesis.

- Repo-analysis routing menu: "2. Send to TDMS" — described as opt-in only
  (SKILL.md line 8: "No TDMS auto-pollution. TDMS intake is opt-in via routing
  menu only.")
- The transform converts `findings.jsonl` fields to TDMS-compatible format via a
  specified field mapping (repo-analysis REFERENCE.md lines 365-379): `id` →
  `source_id` (prefixed `repo-analysis-<slug>-<date>-F001`), `severity` mapped
  to S1/S2/S3, `title`/`detail`/`recommendation` direct copy, `category` derived
  from dimension prefix, `status` always `NEW`, `source` =
  `repo-analysis-<slug>-<YYYY-MM-DD>`.
- No explicit mention of `intake-manual.js` in any skill file. The skills
  describe the TDMS field mapping but reference the intake conceptually as
  "transform before intake" — the actual script invocation is not specified in
  the skill docs.
- Website-analysis REFERENCE.md contains zero mentions of "TDMS" or "debt." This
  is a hard asymmetry.

**Sources:** repo-analysis/SKILL.md:8, repo-analysis/REFERENCE.md:337-379

---

### 2. Memory Persistence: Both Analysis Skills, Not Synthesis Skills [CONFIDENCE: HIGH]

Memory persistence ("Save to memory") is a routing option in both analysis
skills but is absent as a named feature in the synthesis skills. Repo-synthesis
mentions it as a follow-up action option, but website-synthesis specifies it
explicitly in the follow-up actions table.

- **website-analysis** routing menu Option 4: "Save to memory — persist key
  findings" (REFERENCE.md line 1964-1967). Behavior: surface top 3-5 insights,
  ask which to persist to MCP memory or conversation context.
- **repo-analysis** routing menu Option 4: "Save to memory — persist key
  findings as project memory." Same pattern.
- **website-synthesis** Phase 4 follow-up actions: "Save to memory — Persist key
  synthesis findings" (SKILL.md line 225). Present in the action list.
- **repo-synthesis** Phase 4 follow-up actions: "Save to memory — 3-5 most
  actionable insights as project memory" (SKILL.md line 277). Explicitly named.

All four skills include memory persistence, but only the analysis skills make it
a first-class named routing menu option. Synthesis skills include it as a
follow-up action after presenting results.

**Sources:** website-analysis/REFERENCE.md:1964-1967; repo-analysis/SKILL.md
routing menu table; website-synthesis/SKILL.md:225; repo-synthesis/SKILL.md:277

---

### 3. Index File Management: Diverges Significantly Between Skills [CONFIDENCE: HIGH]

The four skills manage different sets of shared index/journal files:

**repo-analysis** maintains the most indexes:

- `research-index.jsonl` (`.research/research-index.jsonl`) — appended on every
  run. Fields: slug, url, depth, date, score_summary, output_dir,
  absence_patterns. Readers: `/deep-plan` Phase 0, session-begin, Compare resume
  (repo-analysis REFERENCE.md:1352-1369).
- `extraction-journal.jsonl`
  (`.research/repo-analysis/extraction-journal.jsonl`) — machine-readable
  per-candidate records. Schema: repo, candidate, type
  (pattern|knowledge|content|anti-pattern), status, decision, decision_date,
  extracted_to, notes, novelty, effort, relevance. Updated on every
  Standard/Deep run.
- `EXTRACTIONS.md` (`.research/repo-analysis/EXTRACTIONS.md`) — human-readable
  cross-repo candidate summary. Both files are canonical and must be updated in
  sync.
- `reading-chain.jsonl` (`.research/repo-analysis/reading-chain.jsonl`) —
  cross-repo relationship graph. Appended during Phase 6 (Value Map Generation).
- `coverage-audit.jsonl` (per-repo) — deferred/skipped items from Phase 6b.
- `content-eval.jsonl` (per-repo) — individual content items evaluated in Phase
  4b.
- `mined-links.jsonl` (per-repo, curated-list repos only) — link mining results.

**website-analysis** maintains a smaller set:

- `extraction-journal.jsonl` (`.research/`) — shared artifact (same concept as
  repo-analysis's). Written during "Extract Knowledge" routing option.
- `EXTRACTIONS.md` (`.research/EXTRACTIONS.md`) — shared with website sources,
  includes `source_type` column to distinguish from repo sources (REFERENCE.md
  Section 1.13).
- `reading-chain.jsonl` (`.research/`) — written during Extract Knowledge
  routing option (SKILL.md:287-288).
- No `research-index.jsonl` equivalent documented for website-analysis.

**website-synthesis and repo-synthesis**: Only produce synthesis output files.
No maintenance of shared index files. They consume the indexes but do not write
to them.

**Sources:** repo-analysis/REFERENCE.md:1352-1369;
repo-analysis/SKILL.md:423-457; website-analysis/SKILL.md:284-289;
website-analysis/REFERENCE.md:582-589

---

### 4. Skill Routing: Deep-Plan Is Universal; TDMS and Repo-Synthesis Are Repo-Analysis-Only [CONFIDENCE: HIGH]

Post-analysis routing options across all four skills:

**repo-analysis** (8 options, SKILL.md lines 474-483):

1. Extract value — load repomix + value-map
2. Send to TDMS — opt-in only
3. Deep-plan this — inject analysis as research context
4. Save to memory — persist findings
5. Adoption verdict — full WR-01 through WR-06
6. Explore insights — deeper Creator View conversation
7. Done — cleanup and exit
8. Cross-repo synthesis — if 3+ repos analyzed, offer `/repo-synthesis`

**website-analysis** (7 options, SKILL.md lines 236-242):

1. Extract knowledge — pick from value-map, write extraction-journal.jsonl,
   regenerate EXTRACTIONS.md
2. Start Expedition — launch Expedition mode
3. Deep-plan this — inject analysis.json + SITE-ANALYSIS.md as research context
4. Save to memory — persist key findings
5. Explore insights — deeper Creator View conversation
6. Done — list output files, remove state file, run retro
7. Cross-site synthesis — if 3+ sites analyzed, suggest `/website-synthesis`

**website-synthesis** (6 follow-up actions, SKILL.md lines 218-227):

1. Explore a theme — deep-dive into a specific emergent theme
2. Fill a gap — queue a `/website-analysis` scan for gap domain
3. Extract top candidates — start extraction workflow
4. Compare paradigms — re-run with different synthesis paradigm
5. Save to memory — persist key synthesis findings
6. Done — cleanup, exit

**repo-synthesis** (6 follow-up actions, SKILL.md lines 272-279):

1. Explore a theme — deep-dive; escalate to `/deep-research` if needed
2. Fill a gap — queue `/repo-analysis` scan for gap domain
3. Extract top candidates — manually copy candidates to project location
4. Save to memory — 3-5 most actionable insights
5. Inject into deep-plan —
   `/deep-plan --context=.research/repo-analysis/SYNTHESIS.md`
6. Done — exit

Key differences:

- `/deep-research` escalation is named only in repo-synthesis ("Explore a theme
  — escalate to `/deep-research` if needed"). Website-synthesis does not name
  this escalation.
- TDMS is repo-analysis-only.
- "Adoption verdict" is repo-analysis-only (WR-01 through WR-06 assessment).
- "Start Expedition" is website-analysis-only.
- "Compare paradigms" is website-synthesis-only.
- Both analysis skills offer their companion synthesis skill at option 7/8
  respectively.

**Sources:** repo-analysis/SKILL.md:474-483; website-analysis/SKILL.md:236-242;
website-synthesis/SKILL.md:218-227; repo-synthesis/SKILL.md:272-279

---

### 5. Analysis-to-Synthesis Trigger Mechanism and Data Handoff [CONFIDENCE: HIGH]

Both analysis-to-synthesis pipelines follow the same pattern but differ in
artifact requirements.

**Trigger mechanism:**

- Both analysis skills auto-offer their synthesis companion when 3+ analyzed
  entities exist in the output directory.
- repo-analysis (REFERENCE.md Section 17.3): checks
  `ls .research/repo-analysis/*/analysis.json | wc -l >= 3`, auto-offers after
  analysis completion.
- website-analysis (REFERENCE.md Section 12, Option 7): checks
  `ls .research/website-analysis/*/analysis.json | wc -l >= 3`, offered as
  routing menu item 7.
- Both synthesis skills can also be invoked explicitly with no arguments — they
  scan the output directory themselves.

**Data handoff schema (website-synthesis requires):**

- `analysis.json` (MUST) — site type, metadata, dimensions, scores
- `value-map.json` (MUST) — candidates with scores and source tier
- `SITE-ANALYSIS.md` (MUST) — Creator View prose for thematic extraction
- `links.json` (SHOULD) — link graph
- `meta.json` (SHOULD) — site metadata
- `findings.jsonl` (SHOULD) — individual findings

**Data handoff schema (repo-synthesis requires, v4.2+):** Per-repo:
`analysis.json` (MUST), `value-map.json` (MUST), `creator-view.md` (MUST),
`content-eval.jsonl` (MUST), `deep-read.md` (SHOULD), `coverage-audit.jsonl`
(SHOULD), `mined-links.jsonl` (MAY). Cross-repo: `reading-chain.jsonl` (SHOULD),
`EXTRACTIONS.md` (SHOULD), `extraction-journal.jsonl` (SHOULD).

**Version-sensitivity:** repo-synthesis explicitly checks for v4.2 artifacts
(`skillVersion` field in analysis.json). Pre-4.2 repos will be missing
content-eval.jsonl, deep-read.md, coverage-audit.jsonl, contentCandidates,
antiPatternCandidates, and cross_repo_connections — synthesis proceeds with
reduced capability (repo-synthesis REFERENCE.md:411-415).

Website-synthesis has no version check — it only verifies MUST artifacts exist.

**Sources:** repo-analysis/REFERENCE.md:1728-1737;
website-analysis/REFERENCE.md:1984-1992; website-synthesis/SKILL.md:62-76;
repo-synthesis/SKILL.md:57-75; repo-synthesis/REFERENCE.md:388-416

---

### 6. Cross-Skill Data Contracts: Schema Assumptions of Downstream Consumers [CONFIDENCE: HIGH]

**`/deep-plan`** (downstream of all four skills):

- Consumes `analysis.json` from analysis skills as research context injected
  into DIAGNOSIS.md.
- Consumes `SYNTHESIS.md` from synthesis skills via `--context=` flag.
- Also reads `research-index.jsonl` in Phase 0 for prior research discovery.
- The injection format is "analysis.json + SITE-ANALYSIS.md/creator-view.md as
  `## Research Context` in DIAGNOSIS.md."

**Cross-type synthesis (planned, not implemented):**

- website-synthesis REFERENCE.md Section 5 documents forward-compatibility hooks
  for a future `/cross-synthesis` skill that would consume both `synthesis.json`
  files.
- Shared fields between both synthesis.json files: `schema_version`,
  `synthesized_at`, `paradigm_output`, `signals` structure.
- Differing fields: source metadata (repo uses `owner/repo`, website uses
  `url/slug`), source weighting (repos have no T1-T4 tier system).
- A future cross-type schema would require a `source_type` discriminator field.

**Source tier system:**

- website-synthesis uses a T1-T4 source tier system (T1=original research 3x
  weight, T4=secondary 0.5x). This is website-specific — repo-analysis has no
  equivalent.
- repo-synthesis fit portfolio: loads `SESSION_CONTEXT.md` and `ROADMAP.md` at
  synthesis time to refresh fit classes. This is a runtime dependency on project
  files, not just analysis artifacts.

**Sources:** website-synthesis/REFERENCE.md:597-628;
repo-synthesis/SKILL.md:206-213; repo-synthesis/REFERENCE.md:228-241

---

### 7. Session Integration: Artifacts Survive Session End [CONFIDENCE: HIGH]

- **website-analysis** SKILL.md line 271-272: "State file and disk artifacts
  survive `/session-end` and session restarts." Explicitly stated.
- **repo-analysis** REFERENCE.md Section 8: state file schema notes
  `completedAt` remains null for in-progress analyses, enabling resume after any
  interruption.
- **repo-synthesis** SKILL.md line 308: "Session-end: State retained as record —
  no cleanup needed."
- **website-synthesis** SKILL.md: no explicit session-end statement, but state
  file is retained (no cleanup instruction).

The `research-index.jsonl` is explicitly stated to be read by "session-begin" in
repo-analysis REFERENCE.md line 1368, surfacing active analyses at session
start. Website-analysis has no equivalent session-begin integration.

None of the four skills create git branches, commits, or PRs. All artifact
production is file-system only.

**Sources:** website-analysis/SKILL.md:271-272; repo-analysis/REFERENCE.md:1368;
repo-synthesis/SKILL.md:308

---

### 8. Invocation Tracking: Only Analysis Skills [CONFIDENCE: HIGH]

Invocation tracking (writing to `write-invocation.ts`) is specified for the
analysis skills only:

- **website-analysis** SKILL.md line 277-278: "Invocation tracking (MUST): Log
  via `write-invocation.ts` with skill, depth, mode context." Also in
  REFERENCE.md Section 12 Option 6 (Done): "Run invocation tracking (SKILL.md
  invocation section)."
- **website-synthesis** SKILL.md lines 251-255: Has an explicit
  `write-invocation.ts` call with context
  `{"skill":"website-synthesis","type":"skill","success":true,"context":{"paradigm":"...","site_count":N}}`.
- **repo-analysis** SKILL.md: No explicit `write-invocation.ts` call documented,
  but the state file includes `completedAt` timestamp.
- **repo-synthesis** SKILL.md/REFERENCE.md: No invocation tracking documented.

Note: website-synthesis is the most explicit — it shows the exact bash command
with `npx tsx write-invocation.ts --data '...'`.

**Sources:** website-analysis/SKILL.md:277-278;
website-synthesis/SKILL.md:251-255; repo-analysis SKILL.md (absence confirmed by
grep)

---

### 9. External API Dependencies [CONFIDENCE: HIGH]

**repo-analysis** has the most external API dependencies:

- GitHub REST API (batches A/B/C): repo metadata, alerts, SBOM, contributors,
  workflow runs, branch protection (GraphQL)
- OpenSSF Scorecard API (`api.securityscorecards.dev`)
- deps.dev API (`api.deps.dev/v3alpha`)
- Rate limit check: `gh api rate_limit` before every API batch; abort if
  `remaining < 200`

**website-analysis** dependencies:

- `superpowers-chrome` MCP (`use_browser` tool) — primary extractor
- WebFetch — content extraction
- Playwright MCP — fallback
- robots.txt via WebFetch (compliance pre-flight)
- curl (HTTP headers, Deep only)

**website-synthesis**: Consumes local artifacts only. No external APIs. Reads
`.research/website-analysis/*/` directory.

**repo-synthesis**: Consumes local artifacts only. No external APIs. May use web
search for gap-fill suggestions (SKILL.md: "Suggest repos to fill gaps — MAY use
web search"), but this is optional and degrades gracefully.

**Sources:** repo-analysis/REFERENCE.md:46-57;
website-analysis/SKILL.md:105-122; website-synthesis/SKILL.md guard rails;
repo-synthesis/SKILL.md:224

---

### 10. Git Integration: None for Any Skill [CONFIDENCE: HIGH]

No skill creates branches, commits, or PRs. The repo-analysis skill clones repos
to `/tmp/` for analysis only (REFERENCE.md Section 15.1: "Clone to
`/tmp/repo-analysis-<slug>/`... Auto-cleanup clone after analysis completes").
This is not the project's own git repo. All outputs are written to `.research/`
and `.claude/state/` directories on the filesystem.

**Sources:** repo-analysis/REFERENCE.md:1249, 1569-1577

---

### 11. State File Locations [CONFIDENCE: HIGH]

| Skill             | State File Path                                         |
| ----------------- | ------------------------------------------------------- |
| website-analysis  | `.claude/state/website-analysis.<site-slug>.state.json` |
| repo-analysis     | `.claude/state/repo-analysis.<repo-slug>.state.json`    |
| website-synthesis | `.claude/state/website-synthesis.state.json`            |
| repo-synthesis    | `.claude/state/repo-synthesis.state.json`               |

Each analysis skill uses a per-entity state file keyed by slug (supports
concurrent analyses). Each synthesis skill uses a single shared state file (only
one synthesis run at a time).

**Sources:** website-analysis/REFERENCE.md:2051-2058;
repo-analysis/REFERENCE.md:1130-1152; website-synthesis/REFERENCE.md:639-657;
repo-synthesis/REFERENCE.md:440-476

---

## Integration Comparison Table

| Integration Dimension         | website-analysis                               | repo-analysis                                          | website-synthesis       | repo-synthesis                         |
| ----------------------------- | ---------------------------------------------- | ------------------------------------------------------ | ----------------------- | -------------------------------------- |
| **TDMS routing**              | None                                           | Yes (opt-in, routing option 2)                         | None                    | None                                   |
| **TDMS script**               | None                                           | Field mapping documented; `intake-manual.js` not named | None                    | None                                   |
| **Memory persistence**        | Yes (option 4)                                 | Yes (option 4)                                         | Yes (follow-up)         | Yes (follow-up)                        |
| **Invocation tracking**       | Yes (`write-invocation.ts`)                    | No explicit call documented                            | Yes (explicit bash cmd) | None documented                        |
| **research-index.jsonl**      | None documented                                | Yes (every run, MUST)                                  | Consumes only           | Consumes only                          |
| **extraction-journal.jsonl**  | Yes (Extract routing)                          | Yes (every Standard/Deep)                              | None                    | None                                   |
| **EXTRACTIONS.md**            | Yes (shared, source_type col)                  | Yes (every Standard/Deep)                              | None                    | None                                   |
| **reading-chain.jsonl**       | Yes (Extract routing)                          | Yes (Phase 6)                                          | Consumes only           | Consumes only                          |
| **State file**                | Per-site slug                                  | Per-repo slug                                          | Single shared           | Single shared                          |
| **Deep-plan routing**         | Yes (option 3)                                 | Yes (option 3)                                         | Yes (follow-up)         | Yes (follow-up)                        |
| **Synthesis routing**         | Yes (option 7, 3+ sites)                       | Yes (option 8, 3+ repos)                               | N/A                     | N/A                                    |
| **Brainstorm upstream**       | No                                             | Yes (listed as upstream)                               | No                      | No                                     |
| **deep-research upstream**    | No                                             | Yes (listed as upstream)                               | No                      | Yes (theme escalation)                 |
| **Git actions**               | None                                           | None (clone to /tmp only)                              | None                    | None                                   |
| **GitHub API**                | None                                           | Yes (REST + GraphQL + OpenSSF + deps.dev)              | None                    | None                                   |
| **Web scraping APIs**         | superpowers-chrome, WebFetch, Playwright, curl | None                                                   | None                    | Optional web search                    |
| **Session-begin integration** | None documented                                | Yes (via research-index.jsonl)                         | None                    | None                                   |
| **Session-end survival**      | Yes (explicit)                                 | Yes (state file)                                       | No explicit statement   | Yes (state retained)                   |
| **Expedition mode**           | Yes (unique)                                   | No                                                     | No                      | No                                     |
| **Adoption verdict**          | No                                             | Yes (option 5)                                         | No                      | No                                     |
| **Compliance pre-flight**     | Yes (robots.txt, GDPR)                         | No                                                     | No                      | No                                     |
| **Home context loading**      | SESSION_CONTEXT + ROADMAP + CLAUDE.md + skills | Same + MEMORY.md entries                               | Via artifacts only      | SESSION_CONTEXT + ROADMAP at synthesis |

---

## Sources

| #   | File Path                                       | Section                                   | Trust               | Notes                                             |
| --- | ----------------------------------------------- | ----------------------------------------- | ------------------- | ------------------------------------------------- |
| 1   | `.claude/skills/website-analysis/SKILL.md`      | Integration, Routing Menu, State File     | HIGH (ground truth) | Lines 229-290                                     |
| 2   | `.claude/skills/repo-analysis/SKILL.md`         | Integration, Routing Menu, Critical Rules | HIGH (ground truth) | Lines 502-516                                     |
| 3   | `.claude/skills/website-synthesis/SKILL.md`     | Integration, Phase 4, Follow-ups          | HIGH (ground truth) | Lines 257-280                                     |
| 4   | `.claude/skills/repo-synthesis/SKILL.md`        | Integration, Phase 4, Follow-ups          | HIGH (ground truth) | Lines 313-319                                     |
| 5   | `.claude/skills/repo-analysis/REFERENCE.md`     | Sections 3.2, 12b, 17.3                   | HIGH (ground truth) | TDMS transform, research-index, synthesis trigger |
| 6   | `.claude/skills/website-analysis/REFERENCE.md`  | Sections 12, 13, 14, 15                   | HIGH (ground truth) | Routing options, agent allocation, state schema   |
| 7   | `.claude/skills/website-synthesis/REFERENCE.md` | Sections 5, 6, 7                          | HIGH (ground truth) | Cross-type hooks, state schema, input contract    |
| 8   | `.claude/skills/repo-synthesis/REFERENCE.md`    | Sections 8, 9, 10                         | HIGH (ground truth) | Input contract, guard rails, state schema         |

---

## Contradictions

**Invocation tracking inconsistency:** website-analysis SKILL.md declares
invocation tracking as MUST (`write-invocation.ts`), and website-synthesis
SKILL.md includes an explicit bash command. But repo-analysis SKILL.md has no
`write-invocation.ts` call documented anywhere in the skill file — only state
file timestamps. Repo-synthesis has no invocation tracking at all. This
asymmetry appears unintentional but may reflect the different development
history of these skills.

**EXTRACTIONS.md location ambiguity:** website-analysis REFERENCE.md Section
1.13 states the shared EXTRACTIONS.md is at `.research/EXTRACTIONS.md`, while
repo-analysis SKILL.md line 430 specifies
`.research/repo-analysis/EXTRACTIONS.md`. These are different paths. The
website-analysis version adds a `source_type` column to distinguish sources. It
is unclear whether these are two separate files (one per analysis type) or if
website-analysis intends to share the repo-analysis location. The paths suggest
they are separate files.

**reading-chain.jsonl location:** Website-analysis SKILL.md line 287 says
`reading-chain.jsonl` is written to `.research/` during Extract Knowledge
routing. Repo-analysis REFERENCE.md Section 17.2 says it's appended to
`.research/repo-analysis/reading-chain.jsonl`. Two different paths.
Website-analysis appears to use the root `.research/` location.

---

## Gaps

1. **`intake-manual.js` not named explicitly.** The skills describe the TDMS
   field mapping for repo-analysis, but no skill file names `intake-manual.js`
   as the intake script. It is referenced in MEMORY.md project notes but not in
   any skill doc reviewed here. The actual intake mechanism is underdocumented
   in the skill files.

2. **Repo-analysis invocation tracking.** No `write-invocation.ts` call appears
   in repo-analysis SKILL.md. Either it was omitted during authoring, or
   repo-analysis uses a different tracking mechanism (state file +
   research-index.jsonl). Could not confirm.

3. **Website-synthesis session-begin integration.** Repo-analysis explicitly
   declares `research-index.jsonl` is read at session-begin.
   Website-analysis/synthesis/repo-synthesis have no equivalent session-begin
   hook documented.

4. **Cross-type synthesis compatibility.** website-synthesis REFERENCE.md
   Section 5 documents planned but unimplemented `/cross-synthesis`. No timeline
   or trigger mechanism is defined.

5. **Memory persistence mechanism.** All four skills say "save to MCP memory or
   conversation context" but none specify which MCP server, which tool call, or
   what schema is written to memory. The actual persistence mechanism is
   underspecified.

---

## Serendipity

**Version-gating in repo-synthesis:** repo-synthesis explicitly checks
`skillVersion` in analysis.json artifacts (requiring v4.2+). This creates a
version contract between the two skills. If someone runs repo-synthesis on a mix
of old and new analyses, it degrades gracefully with warnings. Website-synthesis
has no equivalent — it only checks for MUST file presence, not schema version.
This is a potential future gap as website-analysis evolves.

**Source tier system is website-only:** The T1-T4 source tier weighting
(T1=original research 3x, T4=secondary 0.5x) is website-synthesis-specific.
Repo-synthesis uses `objective_score` and `novelty` instead. This means the two
synthesis skills have fundamentally different evidence quality models, which
would be a schema incompatibility for any future cross-type synthesis.

**`research-index.jsonl` is the only session-level integration point:** Only
repo-analysis writes to this file, and only this file has documented
session-begin readers. This makes repo-analysis the most "integrated" skill from
a session lifecycle perspective — it's the only one that surfaces prior work at
session start.

---

## Confidence Assessment

- HIGH claims: 11
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are based on direct filesystem reads of the four skill files. No
external sources were consulted. All citations reference file paths and
approximate line numbers as verified during this research session.
