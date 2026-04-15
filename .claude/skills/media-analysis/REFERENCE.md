<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-08
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Media Analysis Reference

Output schemas, dimension catalog, platform detection matrix, slug generation,
transcription specifications, absence pattern definitions, scoring bands,
Creator View template, agent prompts, state file schema, and guard rails for the
media-analysis skill.

---

## 1. Output Schemas

### 1.0 Directory Structure

Per-media artifacts in `.research/analysis/<media-slug>/`:

```
<media-slug>/
├── analysis.json          # Core analysis (shared schema + media extensions)
├── transcript.md          # Full transcript (captions, Whisper, or manual)
├── findings.jsonl         # Per-finding records (shared schema)
├── value-map.json         # Knowledge candidates ranked (shared schema)
├── creator-view.md        # Human-readable Creator View report
├── deep-read.md           # Timestamps, linked resources, speaker credentials
├── content-eval.jsonl     # Evaluated linked resources from description
├── coverage-audit.jsonl   # Unanalyzed segments, unfollowed references
└── trends.jsonl           # Append-only per-run tracking
```

Cross-entity in `.research/`:

```
extraction-journal.jsonl   # Append-only extraction decisions (shared)
EXTRACTIONS.md             # Auto-regenerated grouped view (shared)
reading-chain.jsonl        # Cross-source relationships (shared)
research-index.jsonl       # Extended with media type fields
```

### 1.1 `analysis.json`

Top-level analysis result. Consumed by `/deep-plan` as research context, by
`/recall` for search indexing, and by resume detection on re-invocation.

**Validates against:** `scripts/lib/analysis-schema.js` (`analysisRecordCore`
merged with `mediaFields`). See `.claude/skills/shared/CONVENTIONS.md` Section
12 for schema contract.

```json
{
  "id": "UUID",
  "schema_version": "3.0",
  "source_type": "media",
  "source": "https://www.youtube.com/watch?v=abc123",
  "slug": "youtube-com--watch-v-abc123",
  "title": "Understanding Agent Architecture — Talk by Expert",
  "analyzed_at": "ISO8601",
  "depth": "quick|standard|deep",
  "tags": ["media", "youtube", "agents", "architecture"],
  "scoring": {
    "quality_band": "Healthy",
    "quality_score": 72,
    "personal_fit_band": "Excellent",
    "personal_fit_score": 85,
    "classification": "active-sprint"
  },
  "summary": "2-3 sentence summary of what this media content covers and what was learned.",
  "creator_view": "Full Creator View prose (from creator-view.md content)",
  "candidates": [
    {
      "name": "Candidate Name",
      "type": "pattern|knowledge|content|anti-pattern",
      "description": "What it is and why it matters",
      "novelty": "high|medium|low",
      "effort": "E0|E1|E2|E3",
      "relevance": "high|medium|low",
      "tags": ["architecture"]
    }
  ],
  "last_synthesized_at": null,

  "metadata": {
    "url": "https://www.youtube.com/watch?v=abc123",
    "platform": "youtube|tiktok|podcast|audio-file|video-file",
    "channel": "Channel Name",
    "duration_seconds": 2400,
    "duration_display": "40:00",
    "view_count": 125000,
    "publish_date": "ISO8601",
    "scan_version": "1.0",
    "language": "en",
    "has_captions": true,
    "caption_language": "en"
  },
  "transcript_source": "captions|whisper|manual",
  "transcript_length": 8500,
  "media_type": "youtube|tiktok|podcast|audio-file|video-file",
  "media_type_confidence": 1.0,
  "dimensions": {
    "MD-01_content_depth": {
      "score": 75,
      "band": "Healthy",
      "detail": "Covers core concepts well with moderate depth on advanced topics."
    },
    "MD-02_speaker_expertise": {
      "score": 88,
      "band": "Excellent",
      "detail": "Speaker demonstrates deep domain knowledge with practical experience."
    },
    "MD-03_actionability": {
      "score": 65,
      "band": "Healthy",
      "detail": "Several actionable takeaways, some require further research to apply."
    },
    "MD-04_novelty": {
      "score": 72,
      "band": "Healthy",
      "detail": "Fresh perspective on established concepts, some genuinely new insights."
    },
    "MD-05_clarity": {
      "score": 80,
      "band": "Excellent",
      "detail": "Well-structured presentation with clear transitions and examples."
    },
    "MD-06_production_quality": {
      "score": 70,
      "band": "Healthy",
      "detail": "Good audio quality, occasional background noise, adequate visuals."
    }
  },
  "summary_bands": {
    "Content Quality": { "score": 76, "band": "Healthy" },
    "Speaker Authority": { "score": 79, "band": "Healthy" },
    "Creator Value": { "score": 73, "band": "Healthy" }
  },
  "absence_patterns": [
    { "pattern": "NO_SHOW_NOTES", "confidence": "High", "evidence": "..." }
  ],
  "creator_verdict": {
    "verdict": "Study|Explore|Extract|Note",
    "verdict_score": 76,
    "recommendation": "One-sentence creator recommendation"
  }
}
```

**Field definitions:**

**Unified core fields (required -- validated by Zod):**

| Field                 | Type   | Description                                                           |
| --------------------- | ------ | --------------------------------------------------------------------- |
| `id`                  | string | UUID, stable across rebuilds                                          |
| `schema_version`      | string | Schema version (`"3.0"`)                                              |
| `source_type`         | string | Always `"media"` for this handler                                     |
| `source`              | string | URL or file path of analyzed media                                    |
| `slug`                | string | Directory slug (Section 4)                                            |
| `title`               | string | Media title (from platform metadata or filename)                      |
| `analyzed_at`         | string | ISO8601 timestamp of analysis                                         |
| `depth`               | string | `quick`, `standard`, or `deep`                                        |
| `tags`                | array  | Auto-generated + user tags (see Tag Suggestion step)                  |
| `scoring`             | object | Unified scoring: quality + personal fit bands and scores              |
| `summary`             | string | 2-3 sentence summary of what this content covers and what was learned |
| `creator_view`        | string | Full Creator View prose (from creator-view.md)                        |
| `candidates`          | array  | All candidates from value-map.json in unified format                  |
| `last_synthesized_at` | string | ISO8601 or null -- set by synthesis, not by handler                   |

**Media-specific fields (optional -- type-specific extensions):**

| Field                   | Type   | Description                                                       |
| ----------------------- | ------ | ----------------------------------------------------------------- |
| `metadata`              | object | Platform info, channel, duration, view count, publish date        |
| `transcript_source`     | string | How transcript was obtained: `captions`, `whisper`, or `manual`   |
| `transcript_length`     | number | Word count of transcript                                          |
| `media_type`            | string | Primary platform classification (Section 3)                       |
| `media_type_confidence` | number | Classification confidence (0.0-1.0)                               |
| `dimensions.*`          | object | Per-dimension: score (0-100), band, and detail string             |
| `summary_bands.*`       | object | 3-band summary: Content Quality, Speaker Authority, Creator Value |
| `absence_patterns`      | array  | Objects with pattern name, confidence, and evidence               |
| `creator_verdict`       | object | Creator lens verdict (Study/Explore/Extract/Note)                 |

**Scoring mapping:** The `scoring` object is derived from `summary_bands`:

- `quality_score` = average of 3 summary band scores
- `quality_band` = band for that average (per CONVENTIONS.md Section 4)
- `personal_fit_score` = from creator_verdict.verdict_score
- `personal_fit_band` = band for that score
- `classification` = from fit scoring thresholds (CONVENTIONS.md Section 5)

**Summary band derivation:**

| Summary Band      | Source Dimensions                     | Meaning                            |
| ----------------- | ------------------------------------- | ---------------------------------- |
| Content Quality   | MD-01 (40%), MD-04 (30%), MD-05 (30%) | How good is the content itself     |
| Speaker Authority | MD-02 (60%), MD-06 (40%)              | Credibility + presentation quality |
| Creator Value     | MD-03 (70%), personal_fit (30%)       | Practical applicability            |

**Schema parity with other handlers:** All handlers produce the same unified
core fields. Media-specific extensions (`transcript_source`,
`metadata.duration_seconds`, `metadata.platform`) are additive. The `scoring`
object is the cross-type comparison surface.

### 1.2 `transcript.md`

Full transcript of the media content. This is the media handler's equivalent of
the repo-analysis clone -- once text exists, all downstream analysis follows the
same patterns.

**Schema:**

```markdown
# Transcript: {title}

**Source:** {url_or_path} **Platform:** {platform} **Duration:**
{duration_display} **Transcript Source:** {captions|whisper|manual}
**Generated:** {ISO8601}

---

## Transcript

{full_transcript_text}

---

## Metadata

- **Word count:** {word_count}
- **Speaker count:** {detected_speaker_count|unknown}
- **Language:** {detected_language}
- **Captions language:** {caption_language|N/A}
```

**Formatting rules:**

- Paragraph breaks at natural pauses (sentence boundaries, topic transitions)
- Timestamps inserted every 2-5 minutes when available: `[12:34]`
- Speaker labels when detectable: `**Speaker A:**`, `**Host:**`, `**Guest:**`
- Whisper output: include confidence indicators for low-confidence segments:
  `[uncertain: word]`
- Manual transcripts: preserve user formatting, add header metadata

### 1.3 `findings.jsonl`

One record per finding. Shared schema with other handlers plus media-specific
extensions.

```jsonl
{
  "schema_version": "2.0",
  "id": "F001",
  "severity": "high|medium|low|info",
  "category": "content|speaker|production|absence",
  "dimension": "MD-01|MD-02|MD-03|MD-04|MD-05|MD-06",
  "title": "Speaker credentials not verifiable",
  "description": "Full finding description with evidence and timestamp references",
  "recommendation": "Recommended action",
  "timestamp": "12:34"
}
```

**Field definitions:**

| Field            | Type   | Required | Description                                             |
| ---------------- | ------ | -------- | ------------------------------------------------------- |
| `schema_version` | string | Yes      | Schema version (`"2.0"`)                                |
| `id`             | string | Yes      | Finding ID (F001, F002, etc.)                           |
| `severity`       | string | Yes      | `high`, `medium`, `low`, or `info`                      |
| `category`       | string | No       | `content`, `speaker`, `production`, or `absence`        |
| `dimension`      | string | Yes      | Dimension ID (e.g., MD-01, MD-02)                       |
| `title`          | string | Yes      | Short finding title                                     |
| `description`    | string | Yes      | Full description with evidence and timestamp references |
| `recommendation` | string | Yes      | Recommended action                                      |
| `timestamp`      | string | No       | Timestamp in media where finding is evidenced (MM:SS)   |

**TDMS intake transform (routing option 2):**

| findings.jsonl field | TDMS field       | Transform                                       |
| -------------------- | ---------------- | ----------------------------------------------- |
| `id`                 | `source_id`      | Prefixed: `media-analysis-<slug>-<date>-F001`   |
| `severity`           | `severity`       | `high`->S1, `medium`->S2, `low`->S3, `info`->S3 |
| `title`              | `title`          | Direct copy                                     |
| `description`        | `description`    | Direct copy                                     |
| `recommendation`     | `recommendation` | Direct copy                                     |
| (derived)            | `category`       | Derived from dimension prefix                   |
| (derived)            | `status`         | Always `NEW`                                    |
| (derived)            | `source`         | `media-analysis-<slug>-<YYYY-MM-DD>`            |

### 1.4 `value-map.json`

Ranked list of extraction candidates. Same 4 candidate types as repo-analysis.

```json
{
  "schema_version": "2.0",
  "media": "Understanding Agent Architecture",
  "source": "https://www.youtube.com/watch?v=abc123",
  "scan_date": "YYYY-MM-DD",
  "patternCandidates": [
    {
      "name": "Agent instruction decomposition pattern",
      "description": "Method for breaking complex agent instructions into composable units",
      "source": "Discussed at 15:30-22:00",
      "relevance": "high",
      "effort": "E1",
      "novelty": "High",
      "rank": 1,
      "location": "15:30-22:00",
      "pattern_novelty": "High",
      "adoption_readiness": "High",
      "quality_signal": "High",
      "extraction_effort": "E1",
      "objective_score": 85,
      "personal_fit_score": 78,
      "fit_class": "active-sprint",
      "notes": "Directly applicable to agent definition structure",
      "status": "identified",
      "decision_date": null,
      "decision_notes": null
    }
  ],
  "knowledgeCandidates": [
    {
      "name": "Context window management strategies",
      "description": "Speaker's framework for managing limited context windows in production",
      "source": "28:00-35:00",
      "relevance": "high",
      "effort": "E0",
      "novelty": "High"
    }
  ],
  "contentCandidates": [
    {
      "name": "Referenced paper on tool-use benchmarks",
      "description": "Paper cited by speaker with novel evaluation methodology",
      "source": "Description link #3",
      "relevance": "medium",
      "effort": "E0",
      "novelty": "Med",
      "url": "https://arxiv.org/abs/2401.99999"
    }
  ],
  "antiPatternCandidates": [
    {
      "name": "PROMPT_STUFFING",
      "description": "Speaker warns against overloading system prompts, shares failure case",
      "source": "Discussed at 38:00-42:00",
      "relevance": "high",
      "effort": "E0",
      "novelty": "Med"
    }
  ],
  "cross_source_connections": [
    {
      "target_source": "owner/repo-name",
      "target_type": "repo",
      "connection_type": "referenced|complementary|shared-pattern",
      "detail": "Speaker references this repo as their implementation"
    }
  ],
  "related_sources": [
    {
      "url": "https://arxiv.org/abs/2401.99999",
      "relationship": "cited-by|references|extends|contrasts|similar-to",
      "discovery_context": "Referenced in video description and at 28:15"
    }
  ]
}
```

**Required fields per candidate:**

| Field                | Type   | Description                                                    |
| -------------------- | ------ | -------------------------------------------------------------- |
| `rank`               | number | Priority rank by composite value signal                        |
| `name`               | string | Short descriptive name                                         |
| `location`           | string | Timestamp range or description reference                       |
| `description`        | string | What the knowledge/pattern is and why it matters               |
| `pattern_novelty`    | string | Does this content offer something we lack? High/Med/Low        |
| `adoption_readiness` | string | How directly applicable: High/Med/Low                          |
| `quality_signal`     | string | Is this approach better than what we have? High/Med/Low        |
| `extraction_effort`  | string | E0 (listen/study) through E3 (significant adaptation)          |
| `objective_score`    | number | Context-independent quality score (0-100)                      |
| `personal_fit_score` | number | Personal fit to active projects (0-100)                        |
| `fit_class`          | string | `active-sprint`, `park-for-later`, `evergreen`, `not-relevant` |
| `notes`              | string | Adaptation requirements, context                               |

**Extraction effort levels (media context):**

| Level | Label               | Description                                               |
| ----- | ------------------- | --------------------------------------------------------- |
| E0    | Listen/study        | Knowledge absorbed by watching/listening, no code changes |
| E1    | Light adaptation    | Apply idea with minor modifications to our context        |
| E2    | Moderate adaptation | Requires synthesis with existing approaches, some rework  |
| E3    | Significant rework  | Major effort to translate spoken insight to practice      |

### 1.5 `content-eval.jsonl`

One record per evaluated linked resource from description or show notes.

```jsonl
{
  "schema_version": "1.0",
  "id": "CE-001",
  "type": "link|repo|paper|tool|website|social",
  "title": "Referenced Implementation Repo",
  "url": "https://github.com/speaker/demo-repo",
  "source_location": "Video description, link #2",
  "relevance_to_home": "high|medium|low|none",
  "relevance_reason": "Speaker's reference implementation of the agent pattern discussed",
  "fetch_status": "not_fetched|success|failed|private",
  "follow_up_action": "analyze|defer|skip",
  "notes": "Optional context"
}
```

### 1.6 `trends.jsonl` (append-only)

One record per analysis run. Useful when re-analyzing content (e.g., updated
description, new captions available).

```jsonl
{
  "schema_version": "1.0",
  "analysis_id": "uuid",
  "timestamp": "ISO8601",
  "media": "https://www.youtube.com/watch?v=abc123",
  "overall_band": "Healthy",
  "overall_score": 76,
  "dimensions": {
    "content_depth": 75,
    "speaker_expertise": 88,
    "actionability": 65,
    "novelty": 72,
    "clarity": 80,
    "production_quality": 70
  },
  "findings_total": 8,
  "findings_by_severity": {
    "high": 0,
    "medium": 3,
    "low": 3,
    "info": 2
  },
  "absence_patterns": [
    "NO_SHOW_NOTES"
  ],
  "candidate_count": 6,
  "transcript_source": "captions"
}
```

### 1.7 Cross-Entity: `extraction-journal.jsonl`

**Location:** `.research/extraction-journal.jsonl` (canonical root path)

```jsonl
{
  "schema_version": "2.0",
  "source_type": "media",
  "source": "https://www.youtube.com/watch?v=abc123",
  "source_analysis_id": "uuid",
  "candidate": "Agent instruction decomposition pattern",
  "type": "pattern",
  "decision": "extract",
  "decision_date": "2026-04-08",
  "extracted_to": ".claude/skills/shared/AGENT_INSTRUCTION_DECOMP.md",
  "extracted_at": "2026-04-08",
  "notes": "Composable instruction units for agent definitions.",
  "novelty": "high",
  "effort": "E1",
  "relevance": "high",
  "tags": [
    "agents",
    "architecture",
    "instructions"
  ]
}
```

### 1.8 Cross-Entity: `reading-chain.jsonl`

**Location:** `.research/reading-chain.jsonl` (canonical root path,
cross-source)

```jsonl
{
  "schema_version": "2.0",
  "from_type": "media",
  "from_source": "https://www.youtube.com/watch?v=abc123",
  "to_type": "repo",
  "to_source": "speaker/demo-repo",
  "relationship": "references|implements|extends|contrasts|similar-to",
  "discovery_context": "Speaker references this repo as implementation at 15:30",
  "discovered_during": "media-analysis of youtube.com watch abc123",
  "date": "2026-04-08"
}
```

### 1.9 Cross-Entity: `research-index.jsonl`

**Location:** `.research/research-index.jsonl` (shared)

```jsonl
{
  "id": "ma-001",
  "type": "media",
  "source": "https://www.youtube.com/watch?v=abc123",
  "slug": "youtube-com--watch-v-abc123",
  "platform": "youtube",
  "channel": "Channel Name",
  "depth": "standard",
  "date": "2026-04-08",
  "output_dir": ".research/analysis/youtube-com--watch-v-abc123/",
  "creator_verdict": "Explore",
  "creator_verdict_score": 76,
  "absence_patterns": [
    "NO_SHOW_NOTES"
  ],
  "transcript_source": "captions"
}
```

---

## 2. Dimension Catalog

Six dimensions assess media content quality on a 0-100 scale using the shared
4-band system (CONVENTIONS.md Section 4). Dimension IDs prefixed with `MD-`
(Media Dimension). All scoring is performed on the transcript text and available
metadata -- the transcript is the analysis substrate.

### MD-01: Content Depth

**What it measures:** How thoroughly topics are covered in the spoken/presented
content. Breadth of subject matter combined with depth of treatment.

| Band       | Range  | Meaning for Media                                                                       |
| ---------- | ------ | --------------------------------------------------------------------------------------- |
| Critical   | 0-39   | Surface-level only. Clickbait title with shallow content. No substantive detail.        |
| Needs Work | 40-59  | Covers topics but stays introductory. Missing depth on key points.                      |
| Healthy    | 60-79  | Solid coverage. Speaker goes beyond basics on most topics. Adequate examples.           |
| Excellent  | 80-100 | Comprehensive treatment. Layered explanations, real-world examples, edge cases covered. |

**Scoring signals (from transcript):**

- Topic count and depth of treatment per topic
- Ratio of assertions to supporting explanations
- Presence of concrete examples, case studies, demonstrations
- Coverage of nuance, limitations, and edge cases
- Progression from basics to advanced material
- Duration vs content density (longer is not automatically deeper)

### MD-02: Speaker Expertise

**What it measures:** Demonstrated knowledge and credibility of the speaker(s).
Replaces "Source Quality" from document-analysis because media credibility is
primarily about the speaker.

| Band       | Range  | Meaning for Media                                                                          |
| ---------- | ------ | ------------------------------------------------------------------------------------------ |
| Critical   | 0-39   | Speaker shows no domain expertise. Reads from script without understanding. Misstatements. |
| Needs Work | 40-59  | Some knowledge but gaps apparent. Credibility signals weak or unverifiable.                |
| Healthy    | 60-79  | Speaker demonstrates solid domain knowledge. Some practical experience evident.            |
| Excellent  | 80-100 | Deep expertise. First-hand experience. Can answer nuanced questions. Industry recognized.  |

**Scoring signals:**

- First-person experience language ("when I built this", "in my work on")
- Technical accuracy of claims (cross-reference with known facts)
- Ability to handle complexity and nuance without oversimplification
- Speaker credentials (channel history, employer, publications)
- Guest credentials when applicable (interviewer vs interviewee)
- Correction of common misconceptions (signals deep understanding)

### MD-03: Actionability

**What it measures:** How directly applicable the spoken insights are to
practical work.

| Band       | Range  | Meaning for Media                                                                   |
| ---------- | ------ | ----------------------------------------------------------------------------------- |
| Critical   | 0-39   | Purely opinion or entertainment. No practical takeaways. Listener cannot act on it. |
| Needs Work | 40-59  | Some practical elements but vague. "You should do X" without explaining how.        |
| Healthy    | 60-79  | Actionable with moderate effort. Clear recommendations with some implementation.    |
| Excellent  | 80-100 | Directly actionable. Step-by-step guidance, tools named, code shown, demos given.   |

**Scoring signals:**

- Specific tool/library/framework recommendations (named, not vague)
- Step-by-step procedures described verbally
- Code shown or referenced with repo links
- Decision frameworks for when to apply techniques
- Real implementation stories (not just theory)
- Show notes with links to referenced resources

### MD-04: Novelty

**What it measures:** Original insights versus commonly available knowledge.

| Band       | Range  | Meaning for Media                                                                   |
| ---------- | ------ | ----------------------------------------------------------------------------------- |
| Critical   | 0-39   | Entirely derivative. Rehashes documentation or well-known blog posts.               |
| Needs Work | 40-59  | Mostly familiar ground with occasional fresh perspective. Some personal anecdotes.  |
| Healthy    | 60-79  | Several original insights. New combinations of ideas. Unique experience shared.     |
| Excellent  | 80-100 | Genuinely novel contributions. New frameworks, unreported findings, or unique data. |

**Scoring signals:**

- Claims that go beyond what documentation/tutorials cover
- Personal experience that adds context not available in writing
- Novel combinations or synthesis of existing knowledge
- Unique data, benchmarks, or case studies from speaker's work
- Challenges to conventional wisdom with supporting evidence
- "War stories" that reveal non-obvious failure modes

### MD-05: Clarity

**What it measures:** Organization, coherence, and signal-to-noise ratio of the
presentation. How easily a listener can extract value.

| Band       | Range  | Meaning for Media                                                                    |
| ---------- | ------ | ------------------------------------------------------------------------------------ |
| Critical   | 0-39   | Disorganized. Frequent tangents. Unclear language. Hard to follow thread.            |
| Needs Work | 40-59  | Followable but rough. Some tangents. Inconsistent pacing. Key points buried.         |
| Healthy    | 60-79  | Well-organized. Clear structure. Mostly focused. Good pacing.                        |
| Excellent  | 80-100 | Exceptionally clear. Logical progression. Excellent pacing. Easy to take notes from. |

**Scoring signals (from transcript):**

- Logical topic progression (agenda stated, followed, summarized)
- Signal-to-noise ratio (substantive content vs filler, tangents, repetition)
- Clear transitions between topics
- Use of summaries and recaps at key points
- Consistent terminology (not switching terms for the same concept)
- Timestamps or chapters available for navigation

### MD-06: Production Quality

**What it measures:** Audio/video quality signals detectable from the transcript
and metadata. This is a proxy dimension -- actual A/V quality assessment
requires playback, but significant quality issues leave traces in transcripts.

| Band       | Range  | Meaning for Media                                                                      |
| ---------- | ------ | -------------------------------------------------------------------------------------- |
| Critical   | 0-39   | Unintelligible sections. Major technical issues. Transcript has many [inaudible] gaps. |
| Needs Work | 40-59  | Noticeable quality issues. Some unclear segments. Distracting production problems.     |
| Healthy    | 60-79  | Adequate quality. Minor issues that don't impede comprehension.                        |
| Excellent  | 80-100 | Professional production. Clean audio. Good editing. Proper chapter markers.            |

**Scoring signals:**

- `[inaudible]`, `[unclear]`, or `[?]` markers in transcript (from
  captions/Whisper)
- Whisper confidence scores (if available) -- segments with <0.7 confidence
- Transcript coherence (garbled sentences indicate poor audio)
- Caption quality (auto-generated vs human-edited)
- Metadata signals: HD resolution, proper thumbnails, chapter markers
- Duration vs content (very short content with long intros = poor editing)

### Dimension Summary Computation

The 6 dimensions roll up into 3 summary bands:

| Summary Band      | Component Dimensions                  | Meaning                        |
| ----------------- | ------------------------------------- | ------------------------------ |
| Content Quality   | MD-01 (40%), MD-04 (30%), MD-05 (30%) | How good is the content itself |
| Speaker Authority | MD-02 (60%), MD-06 (40%)              | Credibility + presentation     |
| Creator Value     | MD-03 (70%), personal_fit (30%)       | Practical applicability        |

**Creator lens verdicts (same as other handlers):**

| Score | Verdict | Interpretation                            |
| ----- | ------- | ----------------------------------------- |
| 80+   | Study   | Deep engagement recommended               |
| 60-79 | Explore | Worth exploring, selective deep-dives     |
| 40-59 | Extract | Cherry-pick specific insights or patterns |
| 0-39  | Note    | Record existence, low learning priority   |

---

## 3. Platform Detection

Classification runs during Phase 0 (Quick Scan) based on URL patterns, file
extensions, and metadata. Platform determines the transcription strategy and
metadata extraction approach.

### Detection Matrix

| Input Pattern                                | Detected Platform | Confidence |
| -------------------------------------------- | ----------------- | ---------- |
| `youtube.com/watch?v=*`                      | `youtube`         | 1.0        |
| `youtu.be/*`                                 | `youtube`         | 1.0        |
| `youtube.com/live/*`                         | `youtube`         | 1.0        |
| `youtube.com/shorts/*`                       | `youtube`         | 0.95       |
| `tiktok.com/@*/video/*`                      | `tiktok`          | 1.0        |
| `tiktok.com/t/*`                             | `tiktok`          | 0.95       |
| `vm.tiktok.com/*`                            | `tiktok`          | 0.95       |
| `*.mp3`, `*.wav`, `*.m4a`, `*.ogg`, `*.flac` | `audio-file`      | 1.0        |
| `*.mp4`, `*.mkv`, `*.webm`, `*.mov`, `*.avi` | `video-file`      | 1.0        |
| RSS feed URL with `<enclosure>` audio MIME   | `podcast`         | 0.9        |
| Known podcast platforms (below)              | `podcast`         | 0.85       |
| Other audio/video URL                        | `audio-file`      | 0.6        |

### Known Podcast Platform Patterns

| Platform         | URL Pattern                      |
| ---------------- | -------------------------------- |
| Apple Podcasts   | `podcasts.apple.com/*/podcast/*` |
| Spotify Podcasts | `open.spotify.com/episode/*`     |
| Google Podcasts  | `podcasts.google.com/feed/*`     |
| Overcast         | `overcast.fm/+*`                 |
| Pocket Casts     | `pca.st/*`                       |
| Anchor / Spotify | `anchor.fm/*/episodes/*`         |
| Podbean          | `*.podbean.com/e/*`              |
| Buzzsprout       | `*.buzzsprout.com/*`             |
| Transistor       | `*.transistor.fm/*`              |

### Edge Cases

**YouTube Shorts vs standard video:** Shorts (< 60 seconds) are detected by the
`/shorts/` URL path. They typically lack captions. Classify as `youtube` with a
note in metadata: `"is_short": true`. Adjust depth expectations -- Quick Scan
may be sufficient for Shorts.

**TikTok redirect URLs:** `vm.tiktok.com/*` URLs redirect to full TikTok URLs.
Follow one redirect to resolve the canonical URL before processing.

**Podcast episode vs feed:** If the user provides an RSS feed URL (not a
specific episode), prompt: "This is a podcast feed. Provide a specific episode
URL or number, or analyze the most recent episode? [episode URL / latest / N]"

**Video files vs audio files:** If a video file contains no video stream (audio
only in `.mp4` container), treat as `audio-file` for transcription purposes.

### Platform-Specific Metadata Extraction

| Platform     | Metadata Available                                                               |
| ------------ | -------------------------------------------------------------------------------- |
| `youtube`    | Title, channel, description, duration, view count, publish date, captions status |
| `tiktok`     | Title/caption, creator, description, likes, comments                             |
| `podcast`    | Episode title, show name, description/show notes, duration, publish date         |
| `audio-file` | Duration, format, bitrate, embedded tags (ID3, Vorbis)                           |
| `video-file` | Duration, format, resolution, embedded metadata                                  |

---

## 4. Slug Generation

Converts URLs and file paths into directory-safe slugs for output storage.
Windows MAX_PATH compliant. Same algorithm as document-analysis (and
website-analysis) with media-specific examples.

### Step-by-step conversion

**For URLs:**

```
1. Parse URL: extract hostname + path (strip protocol, query string, fragment)
   EXCEPTION: For YouTube, preserve the video ID from query string: v=<id>
2. Lowercase the entire string
3. Replace path separators (/) with double-hyphens (--)
4. Replace all non-alphanumeric characters (except hyphens) with single hyphens
5. Collapse runs of 3+ consecutive hyphens to single hyphen (preserve -- path separators)
6. Strip leading/trailing hyphens
7. Truncate to 80 characters at a word boundary
8. If truncated OR known collision risk:
   append "-" + SHA-256(original full URL)[0:6]
```

**Examples:**

```
https://www.youtube.com/watch?v=abc123
  -> youtube-com--watch-v-abc123

https://youtu.be/abc123
  -> youtu-be--abc123

https://www.tiktok.com/@creator/video/1234567890
  -> tiktok-com---creator--video--1234567890

https://podcasts.apple.com/us/podcast/episode-name/id12345?i=67890
  -> podcasts-apple-com--us--podcast--episode-name--id12345-a1b2c3
```

**For local files:**

```
1. Extract filename without extension
2. Lowercase
3. Replace non-alphanumeric (except hyphens) with single hyphens
4. Collapse consecutive hyphens
5. Strip leading/trailing hyphens
6. Truncate to 80 characters
7. If truncated or generic name: append SHA-256(full path)[0:6]
```

### YouTube Video ID Preservation

YouTube URLs require special handling because the video ID is in the query
string, not the path:

- `youtube.com/watch?v=abc123` -> extract `v=abc123`, include in slug
- `youtu.be/abc123` -> video ID is already in the path
- `youtube.com/live/abc123` -> video ID is in the path

### Windows MAX_PATH Calculation

```
Windows MAX_PATH = 260 characters
Workspace prefix:  ~80 chars
.research/ prefix: ~30 chars
Media slug:        max 80 chars
Nested files:      ~50 chars (transcript.md, content-eval.jsonl)
Buffer:            ~20 chars
Total:             ~260 chars (fits MAX_PATH)
```

---

## 5. Transcription Specifications

Transcription is the critical first step for media analysis. Without text, no
analysis can proceed. Three paths in priority order.

### 5.1 Path A: Captions API (Preferred)

**When:** YouTube videos with available captions. Always attempt this first for
YouTube content.

**Reference tool:** `youtube-transcript-api` (Python package).

**Runtime detection procedure:**

```bash
python -c "from youtube_transcript_api import YouTubeTranscriptApi; print('ok')"
```

**Bootstrap (one-time, Windows):** If the Python package isn't installed:

```bash
curl -sL https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py && python.exe /tmp/get-pip.py
python.exe -m pip install youtube-transcript-api
```

The embedded Python at `~/bin/python312/` may need its `._pth` file edited to
enable site-packages (uncomment `import site`). If Python is unavailable
entirely, fall back to WebFetch-based caption extraction or offer manual
transcript input — this is the `transcript_source: "manual"` path.

Absorbed from media-analysis SKILL.md v1.1 → v2.0 to keep SKILL.md lean.

If installed, use it:

```bash
python -c "
from youtube_transcript_api import YouTubeTranscriptApi
transcript = YouTubeTranscriptApi.get_transcript('<video_id>')
for entry in transcript:
    print(f'[{int(entry[\"start\"])//60}:{int(entry[\"start\"])%60:02d}] {entry[\"text\"]}')
"
```

**If NOT installed:** Attempt WebFetch-based caption extraction. YouTube
auto-generated captions are available via timedtext API URLs embedded in the
video page source. This is fragile and may fail.

**Fallback chain for captions:**

1. `youtube-transcript-api` Python package (most reliable)
2. WebFetch of timedtext API URL extracted from page source (fragile)
3. Fall through to Path B or C

**Caption quality indicators:**

| Indicator            | Meaning                                        |
| -------------------- | ---------------------------------------------- |
| `asr` in track name  | Auto-generated (lower quality, no punctuation) |
| Named language track | Human-created or human-edited (higher quality) |
| Multiple tracks      | Choose manual over auto; prefer English        |

**Post-processing for auto-generated captions:**

- Add sentence boundaries (capitalize after periods)
- Merge duplicate/overlapping segments
- Remove timing artifacts (`[Music]`, `[Applause]`) -- preserve as metadata
- Insert paragraph breaks at topic transitions (>3 second pauses)

### 5.2 Path B: User-Provided Transcript

**When:** User invokes `--transcript <path>` or pastes transcript text when
prompted at the interactive gate.

**Accepted formats:**

| Input              | Processing                                             |
| ------------------ | ------------------------------------------------------ |
| File path (`.txt`) | Read directly, save to `transcript.md` with header     |
| File path (`.srt`) | Parse SRT format, extract text, preserve timestamps    |
| File path (`.vtt`) | Parse WebVTT format, extract text, preserve timestamps |
| Pasted text        | Save to `transcript.md` with header                    |
| File path (`.md`)  | Read directly, preserve formatting                     |

**SRT parsing:**

```
1
00:00:01,000 --> 00:00:04,500
This is the first subtitle line.

2
00:00:05,000 --> 00:00:08,000
This is the second subtitle line.
```

Extract text, convert timestamps to `[MM:SS]` format, merge into flowing
paragraphs.

**Mark in analysis.json:** `"transcript_source": "manual"`

### 5.3 Path C: Whisper (Opt-In, Runtime Detected)

**When:** No captions available AND user opts in at the interactive gate.

**Runtime detection procedure:**

```bash
python -c "import faster_whisper; print('ok')"
```

**Detection outcomes:**

| Result           | Action                                      |
| ---------------- | ------------------------------------------- |
| `ok` printed     | Whisper available. Offer transcription.     |
| ImportError      | Whisper not installed. Fall back to Path B. |
| Python not found | No Python. Fall back to Path B.             |

**If Whisper is available, offer with time estimate:**

```
Whisper (faster-whisper) detected. Estimated transcription time:
  - {duration_minutes} min audio -> ~{estimate} min processing (GPU)
  - {duration_minutes} min audio -> ~{estimate} min processing (CPU)
Proceed with Whisper transcription? [y/N]
```

**Time estimation formula:**

- GPU (`large-v3` model): processing time ~= 0.1x real-time (10 min audio -> ~1
  min)
- CPU (`base` model): processing time ~= 1.0x real-time (10 min audio -> ~10
  min)

**GPU detection:**

```bash
python -c "import torch; print('cuda' if torch.cuda.is_available() else 'cpu')"
```

**Transcription command (conceptual -- actual invocation depends on API):**

```python
from faster_whisper import WhisperModel

# GPU available
model = WhisperModel("large-v3", device="cuda", compute_type="float16")
# CPU only
model = WhisperModel("base", device="cpu", compute_type="int8")

segments, info = model.transcribe("audio_file.mp3")
for segment in segments:
    print(f"[{segment.start:.1f}s -> {segment.end:.1f}s] {segment.text}")
```

**Audio extraction (if source is video):**

For local video files, audio must be extracted before Whisper processing.
Detection: `ffmpeg -version` to check availability.

```bash
ffmpeg -i input.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 output.wav
```

If `ffmpeg` is not available: report to user, suggest installing ffmpeg or
providing a pre-extracted audio file.

**Mark in analysis.json:** `"transcript_source": "whisper"`

**Whisper output post-processing:**

- Include confidence scores for each segment
- Flag low-confidence segments (< 0.7) with `[uncertain: word]` markers
- Insert paragraph breaks at detected silence gaps (> 2 seconds)
- Detect and label speaker changes when confidence is high

### 5.4 `transcript.md` Schema

The final transcript output follows this schema regardless of source:

```markdown
# Transcript: {title}

**Source:** {url_or_path} **Platform:** {platform} **Duration:**
{duration_display} **Transcript Source:** {captions|whisper|manual}
**Generated:** {ISO8601} **Word Count:** {word_count} **Language:**
{detected_language}

---

## Transcript

[0:00] First segment of transcript text. This flows as natural paragraphs with
timestamp markers inserted at regular intervals.

[2:15] Second segment continues here. Speaker changes are marked when
detectable.

**Speaker B:** [5:30] When a new speaker is detected, their contributions are
labeled.

[uncertain: technical term] markers appear when transcription confidence is low.

---

## Notes

- Transcript source: {captions|whisper|manual}
- Auto-generated captions: {yes|no}
- Low-confidence segments: {count}
- Detected speakers: {count|unknown}
- Audio artifacts removed: {list of [Music], [Applause], etc.}
```

---

## 6. Absence Patterns

The absence classifier detects what is missing, not what is present. Seven named
patterns specific to media content. Runs as a cross-cutting concern during Phase
2 (Dimension Wave) for Standard/Deep, with partial detection possible in Phase 0
(Quick Scan) from metadata alone.

### Pattern 1: NO_CAPTIONS

- **Description:** Video/audio has no captions or subtitles available
- **Detection signals:** YouTube reports no caption tracks. No `.srt`/`.vtt`
  file provided. Captions API returns empty result.
- **Severity:** HIGH (blocks standard analysis pipeline unless Whisper or manual
  transcript provided)
- **Applicable platforms:** YouTube, TikTok, video files
- **Scoring impact:** MD-06 (Production Quality) penalty of -15 to -20 points.
  Blocks Phase 2+ unless alternative transcript obtained.
- **Quick Scan detectable:** Yes (caption availability from metadata)

### Pattern 2: POOR_AUDIO

- **Description:** Audio quality is too low for reliable transcription
- **Detection signals:** Whisper confidence scores consistently < 0.6.
  > 15% of transcript marked `[inaudible]` or `[uncertain]`. Multiple garbled
  > sentence fragments. Auto-caption error rate visibly high.
- **Severity:** HIGH (unreliable transcript degrades all downstream analysis)
- **Applicable platforms:** All
- **Scoring impact:** MD-06 (Production Quality) penalty of -25 to -35 points.
  MD-05 (Clarity) penalty of -10 to -15 points.
- **Quick Scan detectable:** No (requires transcript attempt)

### Pattern 3: MONOLOGUE_ONLY

- **Description:** Single speaker with no external references, citations, or
  linked resources
- **Detection signals:** Single speaker throughout. No references to papers,
  tools, repos, or other sources. Description contains no links. No show notes.
  Pure opinion delivery.
- **Severity:** LOW (informational -- not inherently bad, but limits
  verifiability)
- **Applicable platforms:** All
- **Scoring impact:** MD-02 (Speaker Expertise) penalty of -5 to -10 points
  (harder to verify claims). MD-06 (Production Quality) no impact.
- **Quick Scan detectable:** Partial (description link count, but speaker count
  requires transcript)

### Pattern 4: NO_SHOW_NOTES

- **Description:** Media lacks description, show notes, or linked resources
- **Detection signals:** Description is empty or contains only auto-generated
  text. No links in description. No chapter markers. No referenced materials.
- **Severity:** MEDIUM (reduces discoverability and follow-up potential)
- **Applicable platforms:** YouTube, podcast
- **Scoring impact:** MD-03 (Actionability) penalty of -5 to -10 points. MD-06
  (Production Quality) penalty of -5 to -10 points.
- **Quick Scan detectable:** Yes (description content from metadata)

### Pattern 5: CLICKBAIT_MISMATCH

- **Description:** Title/thumbnail promises content that the actual media does
  not deliver
- **Detection signals:** Title keywords not addressed in transcript. Title
  contains sensational language ("INSANE", "GAME-CHANGING", "You Won't Believe")
  but content is introductory. Significant mismatch between described topic and
  actual content coverage.
- **Severity:** MEDIUM
- **Applicable platforms:** YouTube, TikTok
- **Scoring impact:** MD-01 (Content Depth) penalty of -10 to -15 points. MD-05
  (Clarity) penalty of -5 to -10 points.
- **Quick Scan detectable:** Partial (title analysis only; full detection
  requires transcript)

### Pattern 6: STALE_CONTENT

- **Description:** Media content is significantly outdated for a fast-moving
  technical field
- **Detection signals:** Published >2 years ago AND covers rapidly evolving
  technology. References deprecated tools, outdated APIs, or superseded
  versions. No update notes or corrections in description.
- **Severity:** MEDIUM
- **Applicable platforms:** All
- **Scoring impact:** MD-04 (Novelty) penalty of -10 to -20 points. MD-03
  (Actionability) penalty of -10 to -15 points (outdated guidance).
- **Quick Scan detectable:** Yes (publish date from metadata)

### Pattern 7: PROMOTIONAL_EPISODE

- **Description:** Content is primarily a product advertisement or sponsored
  segment with minimal independent value
- **Detection signals:** Product name repeated >10 times in transcript.
  "Sponsored by" or "brought to you by" language. Comparisons always favor one
  product. Significant portion of content is promotional.
- **Severity:** MEDIUM
- **Applicable platforms:** YouTube, podcast
- **Scoring impact:** MD-04 (Novelty) penalty of -15 to -25 points. MD-02
  (Speaker Expertise) penalty of -10 to -15 points (credibility concern).
- **Quick Scan detectable:** Partial (sponsored tags in metadata, but full
  detection requires transcript)

### Absence Classifier Scoring

```
Start at 100
Deduct: HIGH patterns (-3 each), MEDIUM patterns (-2 each), LOW patterns (-1 each)
Normalize to applicable checks per platform
Band result using the 4-band scale (CONVENTIONS.md Section 4)
```

Output named pattern labels in `analysis.json.absence_patterns[]`. Detailed
evidence for each detected pattern in `findings.jsonl` with
`category: "absence"`.

---

## 7. Agent Prompts

### 7.1 Creator View Agent Prompt

Used when dispatching a background agent for Phase 4 (Creator View). The agent
receives the transcript, dimension scores, and deep read output, then writes
`creator-view.md`.

```
You are analyzing media content (video/audio) as a knowledge source for the
user's active projects.

MEDIA CONTEXT:
- Title: {title}
- Platform: {platform}
- Channel/Speaker: {channel}
- Duration: {duration_display}
- Transcript Source: {transcript_source}
- Dimension scores: {dimension_scores_json}

TRANSCRIPT:
{transcript_content}

DEEP READ FINDINGS:
{deep_read_content}

HOME CONTEXT:
{session_context_content}
{roadmap_content}
{claude_md_summary}
{skills_listing}
{memory_user_project_entries}

Write the Creator View in conversational prose (NOT tables or clinical output).
Address the user directly. Be opinionated when warranted.

Six required sections:

1. **What This Content Understands (+ Blindspots)**
   What does this speaker/content KNOW -- mental models, techniques,
   philosophies? What have they NOT addressed that they arguably should?
   Reference specific timestamps for key insights.

2. **What's Relevant To Your Work**
   Direct comparison to the user's active projects and current sprint.
   Reference specific skills, agents, or workflows from the home context.
   Map specific spoken insights to specific active work items.

3. **Where Your Approach Differs**
   Classify each meaningful difference as Ahead/Different/Behind.
   Only include when genuine differences exist.

4. **The Challenge**
   The single most important insight or provocation from this content.
   One recommendation, not five. Only when genuinely warranted.
   If nothing challenges the user's approach, say so explicitly.

5. **Knowledge Candidates**
   What could be LEARNED from deeper engagement. Tiered:
   - Tier 1: Directly relevant to active projects
   - Tier 2: Deepens understanding / builds mental models
   - Tier 3: Interesting but lower priority
   Include "brilliant-but-off-sprint" callout for high-objective, low-fit items.
   Reference timestamps for where each candidate is discussed.

6. **What's Worth Avoiding**
   Cautionary lessons. What patterns or approaches mentioned in this content
   should NOT be replicated? Only when warranted -- cite specific timestamps.

STYLE: Conversational, direct address ("you're doing X, they argue Y"),
depth over brevity (5-15 lines per section), opinionated when warranted.
Reference specific timestamps from the transcript to ground claims.

OUTPUT: Write to creator-view.md. Use markdown headers for each section.
```

### 7.2 Engineer View Agent Prompt

Used when dispatching a background agent for Phase 5 (Engineer View). The agent
receives dimension scores and produces the quality band summary.

```
You are producing the Engineer View for a media analysis.

MEDIA CONTEXT:
- Title: {title}
- Platform: {platform}
- Channel: {channel}
- Duration: {duration_display}
- Transcript Source: {transcript_source}

DIMENSION SCORES:
{dimensions_json}

ABSENCE PATTERNS DETECTED:
{absence_patterns_json}

FINDINGS:
{findings_jsonl_content}

Produce the Engineer View with these sections:

1. **Quality Band Summary**
   Display each dimension as: Band (score) -- one-line detail
   Example: "Healthy (75) -- Solid coverage with good examples"
   Follow with 3 summary bands: Content Quality, Speaker Authority, Creator Value.

2. **Absence Pattern Analysis**
   For each detected pattern: name, confidence, evidence, and scoring impact.
   If no patterns detected, state explicitly.

3. **Critical Health Metric**
   Identify the minimum score across all 6 dimensions. Display as:
   "Overall: {band} ({score}) | Floor: {dimension_name} ({min_score})"

4. **Key Findings Summary**
   Group findings by severity (high -> medium -> low -> info).
   Top 5 findings with title, one-line description, and timestamp.

5. **Transcript Quality Assessment**
   Note the transcript source and quality:
   - Captions: auto-generated vs human; error indicators
   - Whisper: model used, confidence distribution
   - Manual: completeness assessment

6. **Creator Verdict**
   Study/Explore/Extract/Note with score and one-sentence recommendation.

DISPLAY RULES:
- Bands over numbers. Always show "Band (score)" not bare numbers.
- Per CONVENTIONS.md Section 4 band definitions.
- Reference timestamps when discussing specific findings.

OUTPUT: Return structured text. Orchestrator will merge into analysis.json.
```

### 7.3 Agent Allocation

**Standard Mode:**

| Agent                 | Role                                                      | Always?                      |
| --------------------- | --------------------------------------------------------- | ---------------------------- |
| Orchestrator (inline) | Phase management, transcription, state                    | Yes                          |
| Agent 1 (spawned)     | Creator View (loads home context, writes creator-view.md) | If transcript is substantial |
| Agent 2 (spawned)     | Engineer View (dimensions, scoring)                       | If transcript is substantial |

**Deep Mode:**

| Agent                 | Role                                     | Always?                          |
| --------------------- | ---------------------------------------- | -------------------------------- |
| Orchestrator (inline) | Phase management, transcription, state   | Yes                              |
| Agent 1 (spawned)     | Creator View analysis                    | Yes                              |
| Agent 2 (spawned)     | Engineer View analysis                   | Yes                              |
| Agent 3 (spawned)     | Deep reference evaluation (content-eval) | If >10 linked resources in desc. |

Maximum: orchestrator + 3 spawned agents.

**Staged Wave Execution:**

```
VALIDATE:    Inline orchestrator -- URL valid? File exists?
Phase 0:     Inline orchestrator -- Quick Scan metadata (no transcript needed)
GATE:        Inline orchestrator -- present Quick Scan, offer transcript options
Phase 1:     Inline orchestrator -- transcription (captions/Whisper/manual)
Phase 2:     Inline orchestrator -- dimension scoring (transcript is loaded)
Phase 2b:    Inline orchestrator -- deep read (description links, timestamps)
Phase 4-5:   Agent Wave -- up to 2-3 concurrent agents
             Each writes its artifacts before returning
             Orchestrator verifies file existence (does not trust return values)
Phase 6:     Inline orchestrator -- value map generation
Phase 6c:    Inline orchestrator -- tag suggestion
Phase 6b:    Inline orchestrator -- coverage audit
SELF-AUDIT:  Inline orchestrator -- artifact verification + transcript.md check
ROUTING:     Inline orchestrator -- present menu
```

**Agent failure handling (MUST):**

1. After each agent completes, verify output file exists
2. If file is empty (0 bytes -- Windows agent output bug): capture
   task-notification result text, write to output file
3. If agent failed entirely: log failure, re-dispatch with narrower scope
4. If retry also fails: report to user, continue with available data
5. NEVER silently accept missing analysis data

---

## 8. State File Schema

**File naming:** `.claude/state/media-analysis.<media-slug>.state.json`

Each analysis gets its own state file keyed by media slug. Examples:

- `media-analysis.youtube-com--watch-v-abc123.state.json`
- `media-analysis.podcasts-apple-com--episode-name-a1b2c3.state.json`
- `media-analysis.interview-recording.state.json`

```json
{
  "schema_version": "1.0",
  "skill": "media-analysis",
  "version": "1.0",
  "slug": "<media-slug>",
  "source": "https://www.youtube.com/watch?v=abc123",
  "platform": "youtube|tiktok|podcast|audio-file|video-file",
  "status": "in-progress|complete|failed",
  "phase": 0,
  "depth": "quick|standard|deep",
  "phases_completed": [],
  "phases_failed": [],
  "transcript_available": false,
  "transcript_source": null,
  "transcript_path": null,
  "captions_checked": false,
  "captions_available": false,
  "whisper_available": null,
  "output_dir": ".research/analysis/<media-slug>/",
  "agents": {
    "spawned": 0,
    "completed": 0
  },
  "process_feedback": null,
  "startedAt": "ISO8601",
  "completedAt": null
}
```

**Field definitions:**

| Field                  | Type    | Description                                              |
| ---------------------- | ------- | -------------------------------------------------------- |
| `skill`                | string  | Always `"media-analysis"`                                |
| `version`              | string  | Skill version for compatibility checking                 |
| `slug`                 | string  | Media slug derived from URL or path                      |
| `source`               | string  | Original URL or file path                                |
| `platform`             | string  | Detected platform                                        |
| `status`               | string  | Current status: in-progress, complete, or failed         |
| `phase`                | number  | Current phase number (0-6)                               |
| `depth`                | string  | Requested depth tier                                     |
| `phases_completed`     | array   | List of completed phase names                            |
| `phases_failed`        | array   | List of failed phases with reason                        |
| `transcript_available` | boolean | Whether transcript has been obtained                     |
| `transcript_source`    | string  | `captions`, `whisper`, `manual`, or null                 |
| `transcript_path`      | string  | Path to transcript.md (null until obtained)              |
| `captions_checked`     | boolean | Whether caption availability was checked                 |
| `captions_available`   | boolean | Whether platform captions were found                     |
| `whisper_available`    | boolean | Whether faster-whisper is installed (null = not checked) |
| `output_dir`           | string  | Output artifact directory                                |
| `agents`               | object  | Agent tracking: `{spawned, completed}`                   |
| `process_feedback`     | string  | User feedback from retro prompt (null until given)       |
| `startedAt`            | string  | ISO8601 analysis start time                              |
| `completedAt`          | string  | ISO8601 completion time (null if in-progress)            |

**Resume behavior:** On re-invocation with the same URL:

- If `transcript_available: true`: offer Resume (skip transcription) or Re-run
- If `transcript_available: false`: restart from Phase 1 (transcription)
- If `status: complete`: offer Re-run or route to Routing Menu directly

---

## 9. Guard Rails

### Transcription Safety

- Never install Python packages (`pip install`) without explicit user approval
- Whisper detection is read-only: `import` check only, no side effects
- If Whisper transcription hangs (> 2x estimated time), offer to cancel
- Never stream audio data to external services without user knowledge

### Platform API Safety

- YouTube metadata: use unauthenticated methods first (WebFetch of page)
- Rate limit: maximum 5 requests per second to any single platform
- Respect platform terms: do not scrape content beyond public metadata and
  captions
- TikTok: content may require user to provide transcript (platform restrictions)

### Size Limits

- Transcripts: no hard limit, but warn user for content > 3 hours (transcription
  and analysis time increases significantly)
- Whisper processing: warn for audio > 2 hours (CPU) or > 6 hours (GPU)
- Description/show notes: process up to 50KB, truncate with notice beyond that

### Error Handling

- Caption API failure: fall back gracefully to Path B/C with user prompt
- Whisper crash: report error, offer manual transcript as alternative
- Platform URL returns 404 or private: report clearly, do not retry
- Transcript quality too low: flag in findings, reduce confidence on all
  transcript-derived scores
- Never block entire analysis for a single failed component

### Home Context Loading

Same 5 sources as all handlers (CONVENTIONS.md Section 9):

1. `SESSION_CONTEXT.md` -- current sprint, active work
2. `ROADMAP.md` -- project direction, planned features
3. `CLAUDE.md` -- conventions, stack, architecture
4. `.claude/skills/` directory listing -- active skills inventory
5. `MEMORY.md` user/project entries -- project initiatives, decisions

### Self-Audit Additional Checks

Beyond the minimum floor (CONVENTIONS.md Section 8), media-analysis adds:

1. **transcript.md exists** and is non-empty
2. **transcript_source field** is set in analysis.json
3. **transcript_length field** matches actual word count of transcript.md
   (within 5% tolerance)
4. **All timestamps** referenced in creator-view.md and findings.jsonl appear
   within the transcript's time range

---

## 10. Version History

| Version | Date       | Description                              |
| ------- | ---------- | ---------------------------------------- |
| 1.0     | 2026-04-08 | Initial creation (T28 CAS, Session #269) |
