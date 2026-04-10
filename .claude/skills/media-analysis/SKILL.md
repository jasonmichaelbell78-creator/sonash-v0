---
name: media-analysis
description: >-
  Content analysis for video and audio — YouTube, TikTok, podcasts, audio files.
  Transcription-first pipeline (captions API, user transcript, or Whisper
  opt-in). Dual-lens (Creator View + Engineer View) three-tier
  (Quick/Standard/Deep). Part of the Content Analysis System (T28). Outputs to
  .research/analysis/<media-slug>/.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-08
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Shared conventions:** See `.claude/skills/shared/CONVENTIONS.md`

# Media Analysis

Content analysis of video and audio as knowledge artifacts. Mirrors
`/repo-analysis` structure for cohesion within the Content Analysis System.
Transcription is the first step — once text is available, analysis follows the
same pattern as all other handlers.

**Effort:** Quick Scan ~30 seconds. Standard 3-5 minutes (with captions). Deep
5-15 minutes. Whisper transcription adds processing time based on duration.

## Critical Rules (MUST follow)

1. **Transcription before analysis.** No analysis without text. If captions
   aren't available and Whisper isn't installed, offer manual transcript input.
2. **Write-to-disk-first.** Every phase writes output before proceeding.
3. **State file on every phase transition.** Update
   `.claude/state/media-analysis.<slug>.state.json` after each phase.
4. **Creator View is mandatory** for Standard/Deep. Written as conversational
   prose, NOT tables or clinical output.
5. **No silent skips.** If a SHOULD step fails, retry once, then report.
6. **Bands over numbers.** Display categorical bands with scores in parentheses.
7. **Home context MUST be loaded** for Creator View.
8. **Schema validation.** analysis.json MUST validate against
   `scripts/lib/analysis-schema.js`. See CONVENTIONS.md Section 12.
9. **Whisper is opt-in.** Runtime detection only. Never fail because Whisper
   isn't installed — fall back to captions or manual transcript.

## When to Use

- User provides a YouTube, TikTok, or other video platform URL
- User provides a podcast URL or audio file path
- User invokes `/media-analysis` or `/analyze` routes here
- Evaluating media content as a knowledge source

**When NOT to Use:** GitHub repos -> `/repo-analysis` | Websites ->
`/website-analysis` | PDFs/docs -> `/document-analysis` | Testing our webapp ->
`/webapp-testing`

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

**Output location:** `.research/analysis/<media-slug>/` **Produces:**
analysis.json (unified schema v3.0), value-map.json, creator-view.md,
findings.jsonl, summary.md, deep-read.md, content-eval.jsonl,
coverage-audit.jsonl, extraction-journal.jsonl entries. Handler-specific:
transcript.md (MUST — per CONVENTIONS 13.3).

---

## Process Overview

```
VALIDATE   Guards         -> URL valid? Platform supported? File exists?
PHASE 0    Quick Scan     -> Fetch metadata (title, duration, description).
                             Check caption availability. Lightweight creator
                             lens from description.
GATE       Interactive    -> Captions available: "Run Standard/Deep? [y/N]"
                             No captions: "Provide transcript, use Whisper, or
                             skip? [T/W/N]"
PHASE 1    Transcription  -> Get text via captions API, user transcript, or
                             Whisper
PHASE 2    Dimension Wave -> Content quality, speaker expertise, actionability,
                             novelty, clarity, production quality
PHASE 2b   Deep Read      -> Linked resources in description, show notes,
                             referenced materials, timestamps of key segments
PHASE 4    Creator View   -> Same 6 sections as repo-analysis
PHASE 4b   Content Eval   -> Evaluate linked resources from description
PHASE 5    Engineer View  -> Quality bands using shared scoring system
PHASE 6    Value Map      -> Pattern/knowledge/content/anti-pattern candidates
PHASE 6c   Tag Suggestion -> Suggest 5-8 tags, user accepts/modifies
PHASE 6b   Coverage Audit -> Segments not analyzed, references not followed
SELF-AUDIT                -> Artifact presence, schema validation
ROUTING    Menu           -> Same 8 options as repo-analysis
```

Phase markers: `========== PHASE N: [NAME] ==========`

---

## Quick Scan (Phase 0)

Fetch metadata without transcription:

- **YouTube:** WebFetch on YouTube pages returns JS config, not rendered HTML.
  **Use oEmbed API as primary:**
  `https://www.youtube.com/oembed?url=<url>&format=json` or
  `https://noembed.com/embed?url=<url>`. Returns title, author_name,
  thumbnail_url. For captions: use `youtube-transcript-api` (Python) — if
  transcript fetches successfully, captions exist.
- **TikTok:** WebFetch the page for title, creator, description.
- **Audio files:** Read file metadata if available (duration, format).
- **Podcast URLs:** WebFetch episode page for title, show notes, duration.

**Lightweight creator lens (MUST):** From description/title, write 2-3 sentences
about what the content appears to cover.

**Interactive gate with transcript options:** Quick Scan is a **preview**.
Standard produces the full artifact set needed for `/synthesize` cross-source
intelligence.

If captions available:

```
Quick Scan complete. [title] ([duration]). Captions available.

Quick Scan is a preview — it confirms whether this video is worth your time.
Standard analysis produces the full artifact set needed for /synthesize
cross-source intelligence.

Run Standard/Deep? [Y/n]
```

If NO captions:

```
Quick Scan complete. [title] ([duration]). No captions found.

Quick Scan is a preview. Standard produces the full artifact set needed for
/synthesize cross-source intelligence.

Options:
  [T] Provide a transcript (paste or file path)
  [W] Use Whisper for transcription (requires faster-whisper)
  [N] Skip — Quick Scan only (preview, will not contribute to /synthesize)
```

**source_tier:** Media spans `T1`-`T3`. Default `T2`; conference talks and
interviews with named experts → `T1`; anonymous YouTube → `T3`. User can
override during `/synthesize` pre-flight.

---

## Transcription (Phase 1)

Three paths, in priority order:

### Path A: Captions API (preferred)

For YouTube: fetch captions via `youtube-transcript-api` (Python). Save raw
transcript to `transcript.md`. **Bootstrap (one-time):** If the Python package
isn't installed:
`curl -sL https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py && python.exe /tmp/get-pip.py`
then `python.exe -m pip install youtube-transcript-api`. The embedded Python at
`~/bin/python312/` may need its `._pth` file edited to enable site-packages
(uncomment `import site`). If Python is unavailable entirely, fall back to
WebFetch-based caption extraction or offer manual transcript input.

### Path B: User-Provided Transcript

User provides text directly (paste) or a file path. Save to `transcript.md`.
Mark `transcript_source: "manual"` in analysis.json.

### Path C: Whisper (opt-in, runtime detected)

**Detection:** Run `python -c "import faster_whisper; print('ok')"`. If it
succeeds, Whisper is available.

**If available:** Offer transcription. Note expected processing time based on
duration. Use `faster-whisper` with `large-v3` model if GPU is available, `base`
model on CPU. Save to `transcript.md`. Mark `transcript_source: "whisper"` in
analysis.json.

**If NOT available:** Do not error. The gate already offered alternatives.

---

## Dimension Wave (Phase 2)

Assess the transcript across 6 dimensions (0-100 scale):

| Dimension          | What It Measures                               |
| ------------------ | ---------------------------------------------- |
| Content Depth      | How thoroughly topics are covered              |
| Speaker Expertise  | Demonstrated knowledge, credibility signals    |
| Actionability      | How directly applicable the ideas are          |
| Novelty            | Original insights vs common knowledge          |
| Clarity            | Organization, coherence, signal-to-noise ratio |
| Production Quality | Audio/video quality signals from transcript    |

---

## Deep Read (Phase 2b — MUST for Standard/Deep)

From transcript and description, identify:

- Timestamps of key segments/chapters
- Linked resources in description (tools, repos, papers, websites)
- Show notes references
- Guest/speaker credentials
- Referenced books, papers, or projects

Output: `deep-read.md`.

---

## Creator View (Phase 4 — MUST for Standard/Deep)

Same 6 sections as repo-analysis. Written in conversational prose.

1. **What This Content Understands (+ Blindspots)**
2. **What's Relevant To Your Work**
3. **Where Your Approach Differs**
4. **The Challenge**
5. **Knowledge Candidates**
6. **What's Worth Avoiding**

---

## Content Evaluation (Phase 4b — MUST for Standard/Deep)

Evaluate linked resources from description/show notes. Output to
`content-eval.jsonl`.

---

## Engineer View (Phase 5)

Quality bands from Phase 2 dimensions. Absence pattern classification.

---

## Value Map (Phase 6)

Same 4 candidate types. Write to `value-map.json`. Update
`extraction-journal.jsonl`.

---

## Tag Suggestion (Phase 6c — MUST for Standard/Deep)

Suggest tags based on: platform (`youtube`, `podcast`, `tiktok`), topic
keywords, speaker/channel, candidate types. Per CONVENTIONS.md Section 14.

---

## Coverage Audit (Phase 6b — MUST for Standard/Deep)

Unanalyzed segments (by timestamp), unfollowed description links, unresolved
speaker references. Present as interactive prompt.

---

## Self-Audit (MUST — penultimate phase)

Per CONVENTIONS.md Section 8. Additional check: verify `transcript.md` exists
and `transcript_source` field is set in analysis.json.

---

## Routing Menu

Same 8 options as repo-analysis.

---

## State File & Resume

State file: `.claude/state/media-analysis.<slug>.state.json`

Update after every phase. On re-invocation with same URL: offer Resume/Re-run.
Resume skips transcription if `transcript.md` exists.

---

## Version History

| Version | Date       | Description                                                                            |
| ------- | ---------- | -------------------------------------------------------------------------------------- |
| 1.1     | 2026-04-09 | Full output list, oEmbed fallback, Python bootstrap docs, v1.1 (Session #270 E2E test) |
| 1.0     | 2026-04-08 | Initial creation (T28 CAS, Session #269)                                               |
