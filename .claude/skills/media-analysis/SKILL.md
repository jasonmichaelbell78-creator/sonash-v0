---
name: media-analysis
description: >-
  Content analysis for video and audio — YouTube, TikTok, podcasts, audio files.
  Transcription-first pipeline (captions API, user transcript, or Whisper
  opt-in). Dual-lens (Creator View + Engineer View). Two user- invokable depths
  (Standard / Deep); Quick Scan is triage-only. Outputs to
  .research/analysis/<media-slug>/.
---

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-04-15
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Shared conventions:** See `.claude/skills/shared/CONVENTIONS.md`

**`/analyze` router:** This skill is the media-handler arm of `/analyze` —
direct invocation and router dispatch both supported. Handoff contract: the
router passes `{target, auto_detected_type: "media"}` as if the skill were
invoked directly.

# Media Analysis

Content analysis of video and audio as knowledge artifacts. Mirrors
`/repo-analysis` structure for cohesion with sibling CAS handlers. Transcription
is the first step — once text is available, analysis follows the same pattern as
all other handlers.

## Warm-up (shown at invocation)

```
/media-analysis <url-or-path> [--depth=standard|deep] [--transcript=<path>]
  depth:          standard (default) | deep | quick (triage)
  phases:         PHASE N of M  (M = 10 Standard / Deep, 1 Quick)
  est. time:      Quick ~30s | Standard 3-5m | Deep 5-15m
                  (Whisper adds processing time based on duration)
  output:         .research/analysis/<slug>/
  prior feedback: {replay per CONVENTIONS §18 if prior state file exists}
```

## Routing Guide

| You want to…                             | Use this                 |
| ---------------------------------------- | ------------------------ |
| Analyze a video or audio / podcast       | `/media-analysis` (here) |
| Let router auto-pick repo vs site vs PDF | `/analyze <target>`      |
| Cross-source synthesis across 3+         | `/synthesize`            |
| GitHub repo                              | `/repo-analysis`         |
| Website                                  | `/website-analysis`      |
| PDF / article / gist                     | `/document-analysis`     |

## Critical Rules (MUST follow)

1. **Transcription before analysis.** No analysis without text. If captions
   aren't available and Whisper isn't installed, offer manual transcript input.
2. **`transcript.md` is MUST (CONVENTIONS §13.3).**
   `analysis.json.transcript_source` MUST be set to `captions`, `whisper`, or
   `manual`.
3. **Write-to-disk-first.** Every phase writes output before proceeding.
4. **State file on every phase transition.** Update
   `.claude/state/media-analysis.<slug>.state.json` after each phase.
5. **Creator View is mandatory** for Standard/Deep. Written as conversational
   prose, NOT tables or clinical output.
6. **No silent skips.** If a SHOULD step fails, retry once, then report.
7. **Bands over numbers.** Display categorical bands with scores in parens.
8. **Home context MUST be loaded** for Creator View — SESSION_CONTEXT.md,
   ROADMAP.md, CLAUDE.md, `.claude/skills/` listing, MEMORY.md user entries.
9. **Schema validation.** analysis.json MUST validate against
   `scripts/lib/analysis-schema.js`. See CONVENTIONS.md §12.
10. **Whisper is opt-in.** Runtime detection only. Never fail because Whisper
    isn't installed — fall back to captions or manual transcript.

## When to Use

- User provides a YouTube, TikTok, or other video platform URL
- User provides a podcast URL or audio file path
- Evaluating media content as a knowledge source

**When NOT to Use:** GitHub repo → `/repo-analysis` | Website →
`/website-analysis` | PDF/document → `/document-analysis` | Testing webapp →
`/webapp-testing`.

## Input

```
/media-analysis <url-or-path>
/media-analysis <url> --depth=standard
/media-analysis <url> --depth=deep
/media-analysis --transcript <path>    # Analyze pre-existing transcript
```

**Type detection (when called via `/analyze` router):**

| Input Pattern                      | Detected As     |
| ---------------------------------- | --------------- |
| `youtube.com/*`, `youtu.be/*`      | YouTube video   |
| `tiktok.com/*`                     | TikTok video    |
| `*.mp3`, `*.wav`, `*.m4a`, `*.ogg` | Audio file      |
| `*.mp4`, `*.mkv`, `*.webm`         | Video file      |
| Podcast RSS/episode URL            | Podcast episode |

## Output

`.research/analysis/<media-slug>/` produces:

| Artifact                   | Phase   | Format / Notes                                |
| -------------------------- | ------- | --------------------------------------------- |
| `analysis.json`            | 0+      | Core record (schema v3.0) + transcript_source |
| `transcript.md`            | 1       | **MUST** — raw transcript                     |
| `findings.jsonl`           | 2/5     | One JSON object per line                      |
| `creator-view.md`          | 4       | Conversational prose, 6 sections              |
| `summary.md`               | 5       | Health bands                                  |
| `value-map.json`           | 6       | Candidates ranked                             |
| `deep-read.md`             | 2b      | Timestamps + linked resources catalog         |
| `content-eval.jsonl`       | 3.5     | Evaluated description links                   |
| `coverage-audit.jsonl`     | 6b      | Unexplored segments + user decisions          |
| `extraction-journal.jsonl` | routing | Append-only cross-source record               |

Full schemas in REFERENCE.md §1.

---

## Process Overview (M=10 for Standard/Deep)

```
VALIDATE        Guards          -> URL valid? Platform supported? File exists? Prior feedback replay (§18)?
PHASE 0 of 10   Quick Scan      -> Metadata (title, duration, description), caption availability, creator lens
GATE            Interactive     -> Captions? Transcript? Whisper? Skip?
PHASE 1 of 10   Transcription   -> Captions API / user transcript / Whisper
PHASE 2 of 10   Dimension Wave  -> 6 dims: depth, speaker expertise, actionability, novelty, clarity, production
PHASE 2b of 10  Deep Read       -> Timestamps, linked resources in description/show notes
PHASE 3.5 of 10 Content Eval    -> Evaluate description/show-note links — BEFORE Creator View
PHASE 4 of 10   Creator View    -> 6 sections, home context comparison
PHASE 5 of 10   Engineer View   -> Quality bands via shared scoring
PHASE 6 of 10   Value Map       -> Pattern/knowledge/content/anti-pattern candidates
PHASE 6b of 10  Coverage Audit  -> Unanalyzed segments, unfollowed refs
PHASE 6c of 10  Tag Suggestion  -> Per _shared/TAG_SUGGESTION.md
SELF-AUDIT + ROUTING
```

**v2.0 phase renumber (BREAKING):** Per Pattern 10 — Phase 4b (Content Eval) →
Phase 3.5 (matches execution order). State files with `phase-4b-content-eval`
auto-migrate on resume through v2.2 transition window.

Phase markers: `========== PHASE N of M: [NAME] ==========`

---

## Quick Scan (Phase 0 of M)

Fetch metadata without transcription:

- **YouTube:** Use **oEmbed API** as primary
  (`https://www.youtube.com/oembed?url=<url>&format=json` or noembed fallback) —
  WebFetch on YouTube returns JS config, not rendered HTML. Returns title,
  author_name, thumbnail_url. Captions check: `youtube-transcript-api` fetch
  success = captions exist.
- **TikTok:** WebFetch page for title, creator, description.
- **Audio files:** Read metadata if available (duration, format).
- **Podcast URLs:** WebFetch episode page for title, show notes, duration.

**Lightweight creator lens (MUST):** From description/title, write 2-3 sentences
about what the content appears to cover.

**Gate:** Quick Scan is a **preview — not a peer user tier**. All `--depth`
flags bypass. Interactive gate with transcript options:

- Captions available → "Run Standard/Deep? [Y/n]"
- No captions → `[T] Transcript / [W] Whisper / [N] Skip` (per CONVENTIONS §13.3
  — manual transcript is valid; mark `transcript_source: "manual"`)

**source_tier:** Media spans `T1`-`T3`. Default `T2`; named experts `T1`,
anonymous YouTube `T3`.

**Done when:** analysis.json (Quick tier) exists AND creator-lens teaser written
AND caption availability recorded.

---

## Transcription (Phase 1 of 10)

Three paths, in priority order. Sets `analysis.json.transcript_source`.

### Path A: Captions API (preferred)

YouTube: `youtube-transcript-api` (Python). Save raw transcript to
`transcript.md`. Mark `transcript_source: "captions"`.

> Python bootstrap detail (Windows path, embedded Python `._pth` edit, pip
> install, graceful fallback) — see REFERENCE §5.1.

### Path B: User-Provided Transcript

User pastes text directly or provides a file path. Save to `transcript.md`. Mark
`transcript_source: "manual"` in analysis.json.

### Path C: Whisper (opt-in, runtime detected)

**Detection:** `python -c "import faster_whisper; print('ok')"`. If succeeds,
Whisper is available.

**If available:** Offer transcription. Use `faster-whisper` with `large-v3` if
GPU available, `base` on CPU. Save to `transcript.md`. Mark
`transcript_source: "whisper"`.

**Scope-explosion soft prompt:** Audio/video **>60 min duration** → prompt:
`"Media is N minutes. Transcribe all / first 30 min / chapters only / custom?"`
User decides; never hard-block. Particularly important when Whisper path is
chosen (processing time scales with duration).

**Done when:** `transcript.md` exists AND non-empty AND `transcript_source` set
in analysis.json.

---

## Dimension Wave (Phase 2 of 10)

Score the transcript across 6 dimensions (0-100 scale):

| Dimension          | What It Measures                               |
| ------------------ | ---------------------------------------------- |
| Content Depth      | How thoroughly topics are covered              |
| Speaker Expertise  | Demonstrated knowledge, credibility signals    |
| Actionability      | How directly applicable the ideas are          |
| Novelty            | Original insights vs common knowledge          |
| Clarity            | Organization, coherence, signal-to-noise ratio |
| Production Quality | Audio/video quality signals from transcript    |

**Done when:** all 6 dimension scores written to findings.jsonl.

---

## Deep Read (Phase 2b of 10 — MUST for Standard/Deep)

From transcript and description, identify and catalog:

- Timestamps of key segments/chapters
- Linked resources in description (tools, repos, papers, websites)
- Show notes references
- Guest/speaker credentials
- Referenced books, papers, or projects

**Output:** `deep-read.md`.

**Done when:** deep-read.md exists AND resources cataloged for Phase 3.5.

---

## Content Evaluation (Phase 3.5 of 10 — MUST for Standard/Deep)

> **Phase renumbered from 4b to 3.5 in v2.0** — runs BEFORE Creator View and
> feeds into it.

Evaluate linked resources from description/show notes. For each:
`{category, name, url, relevance, applicability, home_connection}`. Output to
`content-eval.jsonl`.

**Done when:** content-eval.jsonl exists AND every link has a relevance rating
AND feeds Creator View §2.

---

## Creator View (Phase 4 of 10 — MUST for Standard/Deep)

Same 6 sections as repo-analysis. Written in conversational prose.

1. **What This Content Understands (+ Blindspots)**
2. **What's Relevant To Your Work**
3. **Where Your Approach Differs**
4. **The Challenge**
5. **Knowledge Candidates**
6. **What's Worth Avoiding**

Load home context before writing. Reference specific content from Deep Read
(Phase 2b) and Content Eval (Phase 3.5) — cite timestamps where applicable.

**Done when:** creator-view.md exists AND all 6 sections written AND
home-context claims reference actual files/projects.

---

## Engineer View (Phase 5 of 10)

Quality bands from Phase 2 dimensions. Absence pattern classification where
applicable.

**Done when:** summary.md contains all 6 bands.

---

## Value Map (Phase 6 of 10)

4 candidate types: pattern, knowledge, content, anti-pattern. Same ranking
fields.

**Promotion rules (MUST):**

- Content Eval high-relevance links → content candidates.
- Creator View §6 actionable warnings → anti-pattern candidates.

Write `value-map.json`. Update `.research/extraction-journal.jsonl`.

**Done when:** value-map.json exists AND promotion rules applied.

---

## Coverage Audit (Phase 6b of 10 — MUST for Standard/Deep)

Scan for unanalyzed segments (by timestamp), unfollowed description links,
unresolved speaker references. Interactive prompt: Analyze all / Select / Skip.
Record in `coverage-audit.jsonl`.

**Done when:** every item has `user_decision` (analyze/skip) or
`status: analyzed`.

---

## Tag Suggestion (Phase 6c of 10 — MUST for Standard/Deep)

Follow the canonical protocol in
[`.claude/skills/_shared/TAG_SUGGESTION.md`](../_shared/TAG_SUGGESTION.md). Per
CONVENTIONS §14: at least 3 semantic tags per entry, 8 categories, no upper
bound.

**Signal sources for media-analysis**: `creator-view.md`, entry `notes`,
`engineer-view.md`, `transcript.md`, speaker/channel context.

**Done when:** user-approved tags written to `analysis.json.tags` AND each
`extraction-journal.jsonl` row.

---

## Delegation & Defaults

| Gate                             | Default                                |
| -------------------------------- | -------------------------------------- |
| `--depth` unspecified            | `standard`                             |
| Quick → Standard gate unanswered | `proceed to Standard`                  |
| No-captions gate unanswered      | `[N] Skip to Quick Scan only`          |
| Scope-explosion (>60 min)        | `first 30 min`                         |
| Coverage Audit unanswered        | `skip all` (logged)                    |
| Tag Suggestion unanswered        | **never auto-approve** — block         |
| Routing menu unanswered          | `7. Done` (cleanup + invocation track) |
| Prior Feedback Replay (CONV §18) | `continue unchanged` (logged as shown) |

Tag Suggestion auto-approve is forbidden (CONVENTIONS §14.6).

---

## Guard Rails (top 5)

1. **Transcription first** — no analysis without `transcript.md` +
   `transcript_source`. Blocks at Phase 2 if absent.
2. **Whisper opt-in** — runtime detection; never error on missing dep; fall back
   to captions/manual path.
3. **Duration cap guard** — >60 min → scope-explosion soft prompt.
4. **YouTube oEmbed fallback** — if noembed/oembed both fail, degrade to manual
   title entry rather than aborting.
5. **Write-rejection bypass** — hook-rejected transcript/prose writes → retry
   via Bash/Python, never silently skip.

> Full guard catalog + Python bootstrap details — REFERENCE §3.1, §9.

---

## Self-Audit (MUST — penultimate phase)

Per CONVENTIONS §8 plus domain checks:

1. **Artifact presence** — all MUST files (analysis.json, transcript.md,
   value-map.json, creator-view.md, summary.md, deep-read.md,
   content-eval.jsonl, coverage-audit.jsonl, extraction-journal entries)
2. **Transcript contract** — `transcript.md` exists AND non-empty AND
   `analysis.json.transcript_source` ∈ {captions, whisper, manual}
3. **Schema contract** — analysis.json validates
4. **Completeness** — all phases that ran produced output
5. **Tags populated** — `analysis.json.tags` non-empty (user-approved)
6. **Coverage decisions** — every item has `user_decision`
7. **Phase ordering** — state file shows `phase-3.5-content-eval` before
   `phase-4-creator-view`, `phase-6c-tags` before `self-audit`
8. **Prior feedback replay** — `prior_feedback_shown: true` if prior state
   existed (CONVENTIONS §18)

---

## Routing Menu

Same 8 options as repo-analysis:

| Option                    | Action                                       |
| ------------------------- | -------------------------------------------- |
| 1. Extract value          | Present candidates from value-map            |
| 2. Send to TDMS           | Transform findings to TDMS format            |
| 3. Deep-plan this         | Inject analysis as research context          |
| 4. Save to memory         | Persist key findings                         |
| 5. Adoption verdict       | Full assessment (if applicable)              |
| 6. Explore insights       | Deeper conversation about findings           |
| 7. Done                   | Cleanup, confirm artifacts, track invocation |
| 8. Cross-source synthesis | If 3+ sources analyzed, offer `/synthesize`  |

---

## State File & Resume

State file: `.claude/state/media-analysis.<slug>.state.json`.

Update after every phase. On re-invocation with same URL: offer Resume / Re-run
/ Compare. **Resume skips transcription if `transcript.md` exists** —
transcripts are reusable non-CAS artifacts. State file stores `process_feedback`
(nullable) from retro.

---

## Integration

- **Siblings:** `/repo-analysis`, `/website-analysis`, `/document-analysis`
- **Router:** `/analyze` (auto-detects media sources)
- **Companion:** `/synthesize` (cross-source, requires 3+ sources)
- **Consumers:** `/deep-plan` (as research context), JASON-OS
- **Shared artifacts:** `.research/extraction-journal.jsonl`,
  `.research/EXTRACTIONS.md`, `.research/reading-chain.jsonl`
- **Reusable artifact:** `transcript.md` is a non-CAS artifact usable by any
  downstream consumer (e.g., direct quoting, citation building)

---

## Retro & Prior Feedback Replay

**Retro (CONVENTIONS §10):** Before the routing menu, ask: "What worked well?
What would you change next time?" Save to `process_feedback` in the state file.
Optional structured dimensions: `worked_well`, `would_change`, `longest_phase`,
`signal_quality`.

**Prior Feedback Replay (CONVENTIONS §18):** On re-invocation for the same
target, replay prior `process_feedback` during VALIDATE and ask whether to
adjust approach. Log `prior_feedback_shown: true`.

**Invocation tracking** — at Done routing:

```bash
cd scripts/reviews && npx tsx write-invocation.ts --data '{
  "skill":"media-analysis","type":"skill","success":true,
  "schema_version":1,"completeness":"stub",
  "origin":{"type":"manual"},
  "context":{"target":"MEDIA_SLUG","mode":"media","depth":"DEPTH",
             "transcript_source":"captions|whisper|manual",
             "score":SCORE,"decisions":DECISION_COUNT,
             "candidates":CANDIDATE_COUNT}
}'
```

---

## Version History

| Version | Date       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.0     | 2026-04-15 | Skill-audit batch 2026-04-15-analysis-quartet Wave 2. **Breaking:** Phase 4b → 3.5 (Content Eval) per Pattern 10. Structural: /analyze router ack, Warm-up, Routing Guide, **NEW Integration section** (siblings + reusable transcript.md), **NEW Retro section**, **NEW Invocation tracking** with transcript_source context, Delegation & Defaults, consolidated Guard Rails top-5, duration scope-explosion soft prompt (>60 min), Done-when gates, PHASE N of M, Tag Suggestion → \_shared ref, Prior Feedback Replay per CONVENTIONS §18, output table, Python bootstrap detail deferred to REFERENCE §3.1 pointer. T28 tagline removed from user-visible description (preserved in v1.0 history). |
| 1.1     | 2026-04-09 | Full output list, oEmbed fallback, Python bootstrap docs, v1.1 (Session #270 E2E test)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.0     | 2026-04-08 | Initial creation (T28 CAS, Session #269)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
