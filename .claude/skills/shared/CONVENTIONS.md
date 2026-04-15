# Shared Skill Conventions

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-04-12
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Canonical source for conventions shared across the analysis/synthesis skill
family: `/analyze`, `/repo-analysis`, `/website-analysis`, `/document-analysis`,
`/media-analysis`, and `/synthesize`. Individual skills reference this file
rather than duplicating these rules.

---

## 1. Phase Transition Markers

All skills MUST use this exact format for phase boundaries:

```
========== PHASE N: [NAME] ==========
```

Where N is the phase number (decimals like 2.5 are permitted) and NAME is the
phase title in ALL CAPS.

---

## 2. Write-to-Disk-First

Every phase MUST write its output file before proceeding to the next phase.
Orchestrators verify file existence, not return values. This ensures crash
recovery and compaction resilience.

---

## 3. Conversational Prose

Creator View and synthesis output MUST be written in conversational prose.
Anti-goal: must NOT read like a technical manual, compliance report, or
auto-generated summary. Write as you would explain insights to a colleague.

---

## 4. Scoring Bands

All skills use the same 4-band categorical scale:

| Band       | Range  | Meaning                              |
| ---------- | ------ | ------------------------------------ |
| Critical   | 0-39   | Fundamental issues, not recommended  |
| Needs Work | 40-59  | Significant gaps, use with caution   |
| Healthy    | 60-79  | Solid foundation, minor improvements |
| Excellent  | 80-100 | Best-in-class for its category       |

**Display rule:** Bands over numbers. Show categorical band with score in
parentheses: `Healthy (72)`. Never display raw numbers without band context.

---

## 5. Fit Scoring Thresholds

All skills use the same fit classification for Creator View recommendations:

| Classification | Criteria                        | Action                         |
| -------------- | ------------------------------- | ------------------------------ |
| active-sprint  | personal_fit >= 60              | Relevant to current work       |
| park-for-later | personal_fit 40-59              | Valuable but not urgent        |
| evergreen      | personal_fit < 40, quality high | Reference material, no urgency |
| not-relevant   | personal_fit < 40, quality low  | Skip unless context changes    |

---

## 6. SKILL.md / REFERENCE.md Split Principle

**SKILL.md** contains: process flow (phases in brief), critical rules, input/
output spec, when to use, integration, version history. Target: under 300 lines
for the process sections.

**REFERENCE.md** contains: detailed specifications, schemas, templates, scoring
rubrics, agent prompts, examples, appendices. No line limit.

**Reference implementation:** website-analysis (1:8.2 ratio, highest adherence).

When in doubt about where content belongs: if it is needed to understand the
workflow on first read, it goes in SKILL.md. If it is needed only during
execution or for reference, it goes in REFERENCE.md.

---

## 7. No Silent Skips

After every SHOULD step, verify the expected output exists. If missing:

1. Retry once with mitigation
2. If still missing, report to user with what was expected and what happened
3. Never silently continue past a failed step

This applies to agent output, file writes, phase outputs, and optional phases.

---

## 8. Self-Audit Minimum Floor

All skills MUST include a self-audit phase (or equivalent verification) before
presenting final output to the user. The minimum floor checks:

1. **Artifact presence:** All MUST output files exist and are non-empty
2. **Schema contract:** Output files match expected structure (field names,
   types)
3. **Completeness:** All phases that were supposed to run did run and produced
   output

Skills MAY add domain-specific audit dimensions above this floor (e.g.,
website-analysis adds 9 dimensions, `/synthesize` adds 10 via its self-audit
rubric).

---

## 9. Home Context Sources

All skills in the family MUST load these 5 sources before producing
Creator-facing output (Creator View, synthesis output, fit scoring):

1. `SESSION_CONTEXT.md` — current sprint, active work
2. `ROADMAP.md` — project direction, planned features
3. `CLAUDE.md` — conventions, stack, architecture
4. `.claude/skills/` directory listing — active skills inventory
5. `MEMORY.md` user/project entries — project initiatives, decisions

---

## 10. Retro Persistence

All skills SHOULD include a retro prompt at completion and persist the response:

1. **Prompt:** "What worked well? What would you change next time?"
2. **Persist:** Save response to `process_feedback` field in state file
3. **Replay:** At start of next run (VALIDATE or WARM-UP phase), present prior
   feedback: "Last run feedback: {response}"

---

## 11. Extraction Context

All creation-oriented skills (brainstorm, deep-plan, skill-creator) MUST check
extraction data during their context-gathering phase and surface relevant
candidates before proceeding. This ensures patterns, principles, and
architectures identified from external repos/websites inform new work rather
than being rediscovered from scratch.

**Two-step lookup:**

1. **Scan `.research/EXTRACTIONS.md` first** — human-readable, grouped by
   source. Skim for relevant sections by repo/website name or candidate type.
   This is the reading interface.
2. **Query `.research/extraction-journal.jsonl` for filtering** — machine-
   readable JSONL. Filter by `type` (pattern, architecture-pattern,
   design-principle, workflow-pattern), keywords in `notes`, or `source` domain.
   This is the data interface for targeted lookup.

Present matches as "Prior art from analyzed sources" with source, candidate
name, and notes.

---

## 12. Universal Schema Contract

All handler skills in the Content Analysis System MUST write output that
validates against the Zod schemas in `scripts/lib/analysis-schema.js`.

**Field naming:** snake_case everywhere. No camelCase in analysis output.

**Required vs optional:** Core fields defined in `analysisRecordCore` are
REQUIRED for all source types. Type-specific fields (e.g., `metadata`,
`dimensions`) are OPTIONAL — present when applicable, absent when not.

**Schema version:** Bump `schema_version` in the Zod file when adding fields.
Never remove fields — mark as `.optional()` or `.nullable()` instead.

**Validation timing:** Each handler MUST validate its `analysis.json` output
before writing to disk. If validation fails, report the error to the user —
never write invalid output.

**Import path:** `require("../../lib/analysis-schema.js")` from scripts, or
relative path from handler context.

---

## 13. Handler Output Contract

Every handler skill (repo-analysis, website-analysis, document-analysis,
media-analysis) MUST produce artifacts in `.research/analysis/<slug>/`.

### 13.1 MUST Artifacts

**All depths (including Quick Scan):**

| Artifact        | Phase    | Format                                     |
| --------------- | -------- | ------------------------------------------ |
| `analysis.json` | Phase 0+ | Validates against `analysisRecordCore` Zod |

**Standard/Deep only (in addition to above):**

| Artifact           | Phase   | Format                                           |
| ------------------ | ------- | ------------------------------------------------ |
| `value-map.json`   | Phase 6 | Candidates array with 4 types                    |
| `creator-view.md`  | Phase 4 | Conversational prose, 6 sections                 |
| Extraction entries | Phase 6 | Appended to `.research/extraction-journal.jsonl` |

Quick Scan produces only `analysis.json` (with lightweight creator lens in the
`creator_view` field). The interactive gate determines whether Standard/Deep
runs and produces the remaining MUST artifacts.

### 13.2 SHOULD Artifacts (all handlers, Standard/Deep)

Missing any of these at Standard/Deep depth indicates a **phase skip** and MUST
be flagged by `self-audit.js`.

| Artifact               | Phase     | Format                                  |
| ---------------------- | --------- | --------------------------------------- |
| `findings.jsonl`       | Phase 2/5 | One JSON object per line, id + severity |
| `summary.md`           | Phase 5   | Concise summary with health bands       |
| `deep-read.md`         | Phase 2b  | Internal artifacts catalog + knowledge  |
| `content-eval.jsonl`   | Phase 4b  | One entry per evaluated reference/link  |
| `coverage-audit.jsonl` | Phase 6b  | Unread sections, unfollowed references  |

### 13.3 Handler-Specific Artifacts (not checked by self-audit)

| Artifact             | Handler          | Purpose                        |
| -------------------- | ---------------- | ------------------------------ |
| `repomix-output.txt` | repo-analysis    | Compressed repo for extraction |
| `meta.json`          | website-analysis | Page metadata snapshot         |
| `mined-links.jsonl`  | repo-analysis    | Curated-list link mining       |
| `transcript.md`      | media-analysis   | **MUST** — transcribed content |
| `trends.jsonl`       | repo/website     | Prior analysis comparison      |

**Media handler additional contract:** `analysis.json` MUST include
`transcript_source` field (value: `captions`, `whisper`, or `manual`).
`self-audit.js` checks this for media sources.

### 13.4 Phase Structure

All handlers follow the same phase progression. Use repo-analysis v4.3 as the
reference template:

```
VALIDATE → PHASE 0 (Quick Scan) → GATE → PHASE 1 (Content Load) →
PHASE 2 (Dimensions) → PHASE 2b (Deep Read) → PHASE 4 (Creator View) →
PHASE 4b (Content Eval) → PHASE 5 (Engineer View) → PHASE 6 (Value Map) →
PHASE 6c (Tag Suggestion) → PHASE 6b (Coverage Audit) → SELF-AUDIT → ROUTING
```

Handlers MAY skip phases that don't apply (e.g., document-analysis has no clone
step) but MUST NOT reorder phases or add phases between existing numbers without
documenting the deviation. **Skipping a MUST or SHOULD phase without
documentation is a bug, not a feature.**

---

## 14. Tag Conventions

**Tags answer "what is this entry _about_?", not "what kind of thing is the
source?"** The `type` field already classifies the candidate and `source_type`
classifies the source. Tags carry _meaning_ — the subjects, patterns,
applicability, and quality signals that make entries discoverable via `/recall`
and `/synthesize`.

### 14.1 Minimum Tag Requirements

- **At least 3 semantic tags** per entry (required)
- **Taxonomic tags optional** — use when artifact-type adds info not already in
  the `type` field
- **No upper bound** — an entry can have 3, 7, or 15 tags; what matters is each
  tag is meaningful. If a source genuinely spans 12 subjects, tag it 12 times.

### 14.2 Forbidden Tags

MUST NOT be applied — these duplicate other fields or carry no information:

- **Source-type duplication**: `repo`, `website`, `document`, `media`
- **Entry-type duplication**: `pattern`, `anti-pattern`, `knowledge`, `content`,
  `architecture-pattern`, `design-principle`, `workflow-pattern`,
  `implementation-pattern`
- **Too vague**: `tool`

### 14.3 Tag Categories

The controlled vocabulary at `.research/tag-vocabulary.json` groups tags into
eight categories:

| Category        | Purpose                           | Examples                                                                             |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| `domain`        | Problem space / field             | `knowledge-management`, `code-review`, `security`, `authentication`, `observability` |
| `technology`    | Concrete tech / tools / protocols | `react`, `firebase`, `mcp`, `sqlite`, `obsidian`, `claude-code`                      |
| `concept`       | Named ideas / abstractions        | `multi-agent`, `rag`, `subagents`, `orchestration`, `swarm`, `skill-system`          |
| `technique`     | How-to methods                    | `prompt-engineering`, `chain-of-thought`, `web-crawling`, `pdf-parsing`              |
| `pattern`       | Architectural/design patterns     | `plugin-dispatch`, `wave-execution`, `event-sourcing`                                |
| `applicability` | Fit to user context               | `jason-os-relevant`, `cas-relevant`, `sonash-relevant`                               |
| `quality`       | Source quality signal             | `production-grade`, `early-stage`, `reference-implementation`                        |
| `taxonomic`     | Artifact type (optional)          | `framework`, `library`, `curated-list`                                               |

**Disambiguation**: If a tag could be `concept` or `pattern`, use `pattern` when
it has a replicable shape (code/structure you could copy), `concept` when it's
an idea you'd discuss.

### 14.4 Vocabulary-First Growth

Before applying a new tag:

1. **Check** `.research/tag-vocabulary.json` for an existing match
2. **Check synonyms** — if a parent concept or synonym exists, use it
3. **Propose** — if genuinely new, propose with category + one-sentence
   definition
4. **Approve** — user authorizes new vocabulary additions (never auto-added)

The retag script (`scripts/cas/retag.js`) enforces this — unknown tags trigger a
proposal prompt, not a silent write.

### 14.5 Naming Rules

- Lowercase, hyphenated: `design-principle` not `DesignPrinciple`
- No `#` prefix in JSON storage (stored bare in arrays; `#` only in display)
- No spaces: `web-crawling` not `web crawling`
- Singular unless inherently plural: `agent` not `agents`; compound tags like
  `multi-agent` keep their form

### 14.6 Tag Suggestion Protocol

After Value Map (Phase 6), each handler MUST:

1. Read entry `notes` + source `creator-view.md`
2. Propose tags covering the content — **at least 3 semantic**, as many more as
   the content warrants
3. Pull from `.research/tag-vocabulary.json`; for genuinely new tags, propose
   with category + one-sentence definition
4. Present to user for accept / modify / add
5. Write approved tags to both `analysis.json` and `extraction-journal.jsonl`

**Do not pre-populate tags without user approval.** The suggestion is a draft;
the user owns the final set.

### 14.7 Before / After Example

Shallow (old — 2 tags, both redundant with other fields):

```json
{
  "source": "anthropics/claude-agent-sdk",
  "type": "pattern",
  "tags": ["repo", "framework"]
}
```

Rich (new — subject-matter + applicability, no redundancy):

```json
{
  "source": "anthropics/claude-agent-sdk",
  "type": "pattern",
  "tags": [
    "claude-code",
    "multi-agent",
    "tool-integration",
    "agent-authoring",
    "jason-os-relevant",
    "production-grade"
  ]
}
```

The shallow version tells you it's a repo that's a framework — both already in
other fields. The rich version tells you what the entry is _about_, what
techniques it demonstrates, and why it matters to you.

### 14.8 Source Name Consistency (MUST)

The `source` field MUST use the same value in `analysis.json` AND
`extraction-journal.jsonl` entries. Canonical formats:

| Source Type | Format       | Example                                               |
| ----------- | ------------ | ----------------------------------------------------- |
| repo        | `owner/repo` | `safishamsi/graphify`                                 |
| website     | Full URL     | `https://sidbharath.com/blog/...`                     |
| document    | Filename     | `Errors and Vulnerabilities in AI-Generated Code.pdf` |
| media       | Full URL     | `https://www.youtube.com/watch?v=...`                 |

Never use slugs, short names, or alternate formats in the `source` field. The
`slug` field is for directory names — `source` is for identity matching.

---

## 15. Skill Template Contract

All handler skills MUST mirror the repo-analysis v4.3 structure:

1. Same SKILL.md sections: Critical Rules, When to Use, Input, Process Overview,
   phase descriptions, Self-Audit, Routing Menu, State File, Version History
2. Same REFERENCE.md split principle (Section 6)
3. Same routing menu options (8 options, same order)
4. Same state file pattern: `.claude/state/<skill-name>.<slug>.state.json`
5. Same self-audit minimum floor (Section 8) plus domain-specific checks

Deviations from the template MUST be documented in the handler's Critical Rules
section with rationale. Undocumented deviations are bugs.

---

## 16. Pipeline Tail Contract (MUST — not skippable)

Every handler MUST complete these 4 steps after all analysis phases finish and
before presenting the routing menu. These are **interactive steps that require
user participation** — they cannot be silently skipped or auto-filled.

### 16.1 Tag Suggestion (Phase 6c)

Present 5-8 suggested tags. User MUST explicitly accept, modify, or add. Do NOT
pre-populate analysis.json tags without user approval.

### 16.2 Retro Prompt

Ask: "What worked well? What would you change next time?" Save response to
`process_feedback` field in the state file. If user says "skip", record
`"skipped"` — not null.

### 16.3 Routing Menu

Present the 8-option routing menu. Wait for user selection. Do NOT skip to
"Done" or close the analysis without presenting options.

### 16.4 State File

Write `.claude/state/<handler>.<slug>.state.json` with at minimum:

- `slug`, `source`, `depth`, `current_phase: "complete"`
- `process_feedback` (from retro, or `"skipped"`)
- `completed_at` timestamp

**Self-audit enforcement:** `self-audit.js` checks for state file existence.
Missing state file at Standard/Deep depth = WARN (indicates tail was skipped).

**Why this matters:** Without these steps, analysis runs produce artifacts but
skip user decisions. Tags go unapproved, feedback is lost, and the routing menu
(which gates extraction, TDMS, memory, and synthesis) never fires. The tail is
where user judgment enters the pipeline.

---

## 17. Synthesis Output Contract

The `/synthesize` skill is a **consumer skill** — it reads handler output, it
does not produce handler output. Its contract is distinct from the handler
contract in Section 13.

### 17.1 MUST Artifacts

| Artifact         | Location                              | Format                                  |
| ---------------- | ------------------------------------- | --------------------------------------- |
| `synthesis.md`   | `.research/analysis/synthesis/`       | Conversational prose, 8 sections        |
| `synthesis.json` | `.research/analysis/synthesis/`       | Validates against `synthesisRecord` Zod |
| State file       | `.claude/state/synthesize.state.json` | JSON, tracks sections_completed + mode  |

### 17.2 Output Sections (thematic paradigm)

1. **Emergent Themes + Signals** — merged (convergence, divergence, gaps,
   trends)
2. **Ecosystem Gap Analysis** — what's missing across the source set
3. **Reading Chain** — cross-type study sequence with tier weighting
4. **Mental Model Evolution** — how understanding has shifted since previous
   synthesis
5. **Fit Portfolio** — all candidates deduplicated and re-ranked by cross-source
   convergence
6. **Knowledge Map** — domain coverage matrix
7. **Opportunity Matrix** — interactive, routes to next actions (extract, plan,
   research, defer)
8. **Changes Since Previous** — re-synthesis mode only

Other paradigms (narrative, matrix, meta-pattern) MAY reorder or substitute
sections per the paradigm template in `synthesize/REFERENCE.md`.

### 17.3 History Preservation

Before overwriting, archive the previous synthesis:

- `synthesis.md` →
  `.research/analysis/synthesis/history/synthesis-YYYY-MM-DD.md`
- `synthesis.json` →
  `.research/analysis/synthesis/history/synthesis-YYYY-MM-DD.json`

This preserves mental-model evolution across re-synthesis runs.

### 17.4 Side Effects

After synthesis completes:

1. Update `last_synthesized_at` in each processed source's `analysis.json`
2. Run `node scripts/cas/rebuild-index.js` to sync the SQLite index
3. Append a record to `.research/synthesis-journal.jsonl` (mode, paradigm,
   source count, timestamp)

### 17.5 Scope Semantics

- **Full synthesis** — all sources where `last_synthesized_at < analyzed_at`
- **Scoped synthesis** — filtered by `--type=<type>` or `--scope=<tags>`
- **Re-synthesis** — full re-run ignoring `last_synthesized_at`; produces
  "Changes Since Previous" section
- **Incremental** — append-only update when new sources are added since last
  full synthesis (fits inside "Changes Since Previous")

### 17.6 Pre-Flight Validation

Before producing any output, `/synthesize` MUST verify:

1. At least 3 sources at Standard or Deep depth exist (Quick Scans are
   preview-only and do not contribute — see Section 13.1 gate messaging)
2. All contributing sources have valid `analysis.json` (schema validates)
3. All contributing sources have a `source_tier` assigned (T1-T4)
4. Tier distribution is presented to the user before synthesis runs

Failed pre-flight → block with remediation instructions, do not produce partial
synthesis output.

---

## 18. Prior Feedback Replay

All handler skills in the Content Analysis System MUST replay prior retro
feedback at the start of a re-invocation for the same target. This closes the
loop between Section 10 (Retro Persistence) capture and next-run consumption —
without replay, retro feedback is write-only and process improvement stalls.

### 18.1 When

During the VALIDATE or WARM-UP phase, before any analysis work begins. Skills
with an early guards phase run replay as part of that phase so the user sees
prior feedback before committing to another run.

### 18.2 What to Replay

1. Read the state file at `.claude/state/<skill>.<slug>.state.json` if present.
2. Extract `process_feedback` (prior retro response, per Section 10).
3. Extract structured retro dimensions if stored: `worked_well`, `would_change`,
   `longest_phase`, `signal_quality`.
4. If absent, null, or `"skipped"`, proceed without replay (no error).

### 18.3 How to Present

Before the first phase marker, present:

```
Prior run feedback ({completed_at}):
  {process_feedback}
  {structured retro dimensions, if present}

Continue, or adjust approach based on this feedback?
```

**Gate behavior:**

- If the user responds with adjustments (e.g., "skip Deep Read this run"),
  record adjustments in the new state file's `prior_feedback_applied` field and
  honor them during execution.
- If the user responds "continue" or equivalent, proceed — but log that feedback
  was displayed (`prior_feedback_shown: true`) so self-audit can verify replay
  happened.
- If no prior state file exists, skip this step silently — first runs have
  nothing to replay.

### 18.4 Scope

Applies to all CAS handlers (`/repo-analysis`, `/website-analysis`,
`/document-analysis`, `/media-analysis`). `/synthesize` has its own feedback
surface and is not covered by this section — see Section 17 for synthesis-
specific behavior.

### 18.5 Pattern Origin

Promoted from `/website-analysis` (the reference implementation). Prior to this
section, website-analysis was the only handler that replayed feedback;
repo-analysis, document-analysis, and media-analysis captured feedback but never
surfaced it. Codifying the pattern as CAS-wide closes the gap.

---

## Adoption

Each skill's SKILL.md includes a one-line reference:

```
**Shared conventions:** See `.claude/skills/shared/CONVENTIONS.md`
```

Conventions in this file override any conflicting statement in individual skill
files. If a skill needs to deviate from a convention, it MUST document the
deviation and rationale in its own Critical Rules section.
