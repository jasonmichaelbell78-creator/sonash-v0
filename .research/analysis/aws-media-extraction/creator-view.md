# Creator View — AWS Media Extraction Framework

**Repo:**
aws-solutions-library-samples/guidance-for-media-extraction-and-dynamic-content-policy-framework-on-aws
**Scan:** Standard, 2026-04-07 **Verdict:** Extract (42) | Creator fit: Healthy
(65)

---

## 1. What This Repo Understands (+ Blindspots)

This repo understands something fundamental about video analysis: **extraction
and analysis are separate problems that should be separate systems.** Most video
processing pipelines couple them — you build a "content moderation pipeline" or
a "video summarization pipeline." This repo splits the work: extract ALL useful
metadata once (frames, labels, text, celebrities, moderation flags, captions,
transcripts, embeddings), store it in a service-agnostic format, then run
arbitrary analysis on the extracted data using LLM prompts.

The extraction pipeline itself is well-architected: frame sampling with
configurable FPS, smart deduplication via multimodal embeddings (both
OpenSearch-backed and FAISS local variants), multi-level granularity (frames →
shots → scenes), and independently toggleable ML features per frame.

**Blindspots:**

- No streaming/real-time support — batch only
- No incremental extraction (can't add a new ML feature to existing extractions)
- Frame-based only — no audio feature extraction beyond transcription
- No extraction quality metrics or confidence aggregation
- No support for non-video media (podcasts, audio-only, images)

---

## 2. What's Relevant To Your Work

**Directly relevant to T27 (Media Extraction Deep-Research):**

The extraction pipeline architecture is the reference design you need:

1. **Frame sampling pattern** (`extr-srv-sample-video.py`): moviepy-based frame
   extraction with configurable FPS and chunk-based processing. The key insight:
   process video in 10-minute chunks to manage Lambda memory. This pattern is
   portable — moviepy runs locally, no AWS dependency.

2. **Smart deduplication** (`extr-srv-sample-video-dedup.py` +
   `extr-srv-sample-video-dedup-faiss.py`): Two approaches — OpenSearch vector
   similarity (cloud) and FAISS cosine similarity (local). The FAISS version is
   directly portable. Claims 50% frame reduction = 50% cost reduction.

3. **Per-frame ML feature extraction** (`extr-srv-image-extraction.py`): Each
   Rekognition API call (labels, text, celebrity, moderation) is independently
   toggleable. The Bedrock Claude Haiku captioning uses a 100-token prompt. This
   pattern transfers: replace Rekognition with local models or alternative APIs,
   keep the toggleable-feature architecture.

4. **Multi-granularity hierarchy** (shot-analysis.py + scene-analysis.py):
   Frames → Shots (camera continuity via similarity threshold) → Scenes (LLM
   narrative segmentation). Each level has summaries, timestamps, and metadata.
   This hierarchy could structure how `/website-analysis` handles video content.

5. **Audio transcription** (`extr-srv-transcription-s3-trigger.py`): Amazon
   Transcribe with subtitle-to-frame timestamp mapping. Local alternative:
   Whisper. The subtitle alignment to frame timestamps is the non-obvious
   engineering.

**For your YouTube analysis use case:** The pattern would be:

1. Download video (yt-dlp)
2. Sample frames at configured FPS
3. Smart-dedup via local embeddings (FAISS)
4. Per-frame captioning (Claude vision)
5. Audio transcription (Whisper or YouTube's own captions)
6. Shot/scene segmentation from frame similarity
7. Full video summary from scene summaries + transcript

---

## 3. Where Your Approach Differs

**Ahead:** Your analysis skills (website-analysis, repo-analysis) already have
the dual-lens architecture (Creator View + Engineer View) that this repo lacks.
Their "Evaluation Service" is a basic LLM prompt runner — your skills have
convergence loops, quality verification, and structured output.

**Different:** They use cloud services (Rekognition, Transcribe, Bedrock); you'd
use local tools (moviepy, FAISS, Whisper, Claude vision). Same patterns,
different providers.

**Behind:** You have no video processing at all. This repo has a production
extraction pipeline. The gap is the entire media layer.

---

## 4. The Challenge

The challenge for T27 is **cost and latency**. Their README shows ~$0.28-0.35
per video minute at 1 FPS. A 10-minute YouTube video = $2.80-3.50 for full
extraction. With Claude vision for captioning (vs their Bedrock Haiku), your
costs would be different but similar order of magnitude.

The question is: does the use case justify per-video costs? For occasional
YouTube analysis, transcript extraction alone (free via YouTube captions or
cheap via Whisper) gets you 80% of the value. Frame extraction is the premium
layer for visual content analysis.

---

## 5. Knowledge Candidates

| Tier | Candidate                                       | Type                 | Novelty | Effort | Relevance |
| ---- | ----------------------------------------------- | -------------------- | ------- | ------ | --------- |
| T1   | Frame sampling + smart dedup pipeline           | architecture-pattern | high    | E1     | high      |
| T1   | Multi-granularity hierarchy (frame→shot→scene)  | architecture-pattern | high    | E1     | high      |
| T1   | Toggleable per-frame ML feature extraction      | pattern              | medium  | E0     | high      |
| T2   | FAISS local dedup (no cloud dependency)         | pattern              | medium  | E1     | high      |
| T2   | Subtitle-to-frame timestamp alignment           | pattern              | medium  | E1     | medium    |
| T3   | Step Functions orchestration of Lambda pipeline | pattern              | low     | E2     | low       |
| T3   | Evaluation Service prompt template system       | pattern              | low     | E0     | medium    |

---

## 6. What's Worth Avoiding

- **OpenSearch dependency for similarity.** The FAISS alternative exists in the
  same repo and is simpler. Don't add a search cluster for video dedup.
- **Per-Lambda function design.** 17 single-purpose Lambdas is AWS-idiomatic but
  creates deployment complexity. For local use, compose these as functions in a
  single script.
- **No tests.** The `tests/` directory has 1 file. Don't follow this pattern.
