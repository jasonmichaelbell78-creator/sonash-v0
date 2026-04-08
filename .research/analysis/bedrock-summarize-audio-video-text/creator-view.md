# Creator View — Bedrock Summarize Audio Video Text

**Repo:** ksharlandjiev/bedrock-summarize-audio-video-text **Scan:** Standard,
2026-04-07 **Verdict:** Extract (35) | Creator fit: Moderate (52)

---

## 1. What This Repo Understands (+ Blindspots)

This repo understands something that the AWS Media Extraction Framework (which
we analyzed earlier today) doesn't: **most real-world content extraction starts
with messy, diverse inputs, not clean video files sitting in S3.** Someone hands
you a YouTube link, a PDF, an Excel spreadsheet, a Quip document, an email, or a
webpage — and you need to get text out of it and do something useful with that
text. The repo's answer is a composable pipeline: readers normalize inputs,
processors transform content, writers push results somewhere. Chain of
Responsibility means you snap handlers together like Lego bricks.

The factory pattern with AST-based auto-discovery is the most genuinely clever
thing here. Adding a new handler means creating a single Python file that
extends AbstractHandler — the system finds it, registers it, and makes it
available by class name. Zero boilerplate, zero config. That's exactly the kind
of zero-friction extensibility that makes a pipeline tool usable by people who
aren't the author.

The PII round-tripping is also smarter than it looks at first glance. Tokenize
PII before sending to the LLM (T1, T2, T3), instruct the model to use tokens as
names, untokenize after. It preserves semantic context while keeping sensitive
data out of the model context. The prompt template explicitly tells the model to
use the tokens, which is the step most PII redaction approaches miss — they
redact and then wonder why the summary doesn't make sense.

**Blindspots:**

- No transcript quality assessment — Transcribe outputs are trusted blindly
- YouTube extraction is audio-only — no frame sampling, no visual content
  analysis
- No streaming support — everything is batch, poll-and-wait
- Hard-coded `en-US` language in Transcribe handler — not multilingual
- The chunk_text implementations across handlers are duplicated and inconsistent
  (different size limits, different chunking strategies)
- No output format control beyond raw text — no structured extraction (JSON
  schemas, metadata tagging)

---

## 2. What's Relevant To Your Work

**Directly relevant to T27 (Media Extraction Deep-Research):**

This repo is the "practical hands-on toolkit" complement to the AWS Media
Extraction Framework's "enterprise architecture" view. Where AWS-MEF gives you
the grand design (frame sampling, dedup, multi-level granularity), this repo
gives you the working code for the messy parts:

- **YouTube → audio extraction** (`YouTubeReaderHandler`): Uses `pytubefix` for
  download + `moviepy` for audio extraction to MP3. This is the exact YouTube
  content pipeline T27 needs. The handler is ~30 lines and handles the full
  lifecycle: download → extract audio → cleanup original.

- **Amazon Transcribe lifecycle** (`AmazonTranscriptionHandler`): Full async job
  lifecycle — start job → poll every 30s → fetch transcript → delete job. Shows
  speaker labels config (`MaxSpeakerLabels: 2`). This is the Transcribe
  reference implementation.

- **Web page media extraction** (`HTTPHandler`): Fetches pages, extracts
  embedded images/videos/audio/YouTube iframes, downloads them locally, creates
  metadata.json with traceability. This is the "content extraction from
  arbitrary URLs" pattern that website-analysis doesn't currently do for media.

- **Multi-format reader ecosystem**: PDF (pdfminer + PyMuPDF for images), Word,
  Excel, PowerPoint, Email/IMAP, S3, Quip, HTTP. If T27 scope expands beyond
  video to "content extraction broadly," this handler catalog is a practical
  reference.

**Relevant to SoNash privacy-first architecture:**

- **PII tokenize/untokenize round-trip** (`AmazonComprehendPIITokenizeHandler` +
  `AmazonComprehendPIIUntokenizeHandler`): The token-map persistence pattern
  (write to JSON, reload for untokenization) is a clean approach. For SoNash
  journal entries that might contain sensitive personal details, a similar
  pre-LLM tokenization step could ensure privacy.

**Relevant to JASON-OS skill architecture:**

- **HandlerFactory auto-discovery via AST**: The pattern of walking a directory
  tree, parsing Python ASTs to find subclass relationships, and registering
  handlers by class name is analogous to how the home skill system discovers
  skills from `.claude/skills/`. The key difference: this repo discovers at
  runtime via code introspection, while home discovers at authoring time via
  file conventions. Neither approach is strictly better — they solve different
  problems.

- **Model-agnostic invocation via JSONPath** (`.env.default` + `bedrock.py`):
  The env-driven model config maps request/response schemas via JSONPath
  expressions. Same invocation code works for Claude, Titan, or any Bedrock
  model. This is a simpler version of the "model adapter" pattern.

---

## 3. Where Your Approach Differs

| Area                 | This Repo                                               | Home (SoNash/JASON-OS)                        | Classification                                                   |
| -------------------- | ------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| Handler discovery    | Runtime AST parsing                                     | File-convention + SKILL.md metadata           | **Different** — both auto-discover, different mechanisms         |
| Pipeline composition | Chain of Responsibility (runtime chaining)              | Skill orchestration via agent dispatch        | **Different** — imperative vs declarative                        |
| Input diversity      | 11 reader handlers (YouTube, PDF, S3, email, etc.)      | URL-focused (website-analysis, repo-analysis) | **Behind** — home doesn't handle audio/video/document extraction |
| PII handling         | Tokenize → LLM → untokenize round-trip                  | No PII processing                             | **Behind** — privacy-first mission but no PII pipeline           |
| Test coverage        | 0%                                                      | Functional tests with node:test               | **Ahead**                                                        |
| CI/CD                | None                                                    | Pre-commit hooks, pattern checks, multi-stage | **Ahead**                                                        |
| Documentation        | README-only                                             | Multi-tier (CLAUDE.md, skills, agent docs)    | **Ahead**                                                        |
| Content processing   | AWS managed services (Transcribe, Textract, Comprehend) | Claude API (direct)                           | **Different** — managed service vs direct API                    |
| Extension model      | Add .py file, auto-discovered                           | Add SKILL.md + companions, convention-based   | **Different** — code-first vs metadata-first                     |

---

## 4. The Challenge

**Consider building a PII handling pipeline for SoNash journal entries.**

SoNash is privacy-first, and journal entries in a sobriety app contain some of
the most sensitive personal data imaginable — names of people, places,
substances, meetings, sponsors, therapists. The
tokenize-before-LLM-untokenize-after pattern from this repo is simple, proven,
and directly applicable. You don't need Amazon Comprehend — a local NER model
(spaCy, which this repo also uses via `AnonymizeHandler`) or even regex-based
patterns could tokenize sensitive entities before any AI processing, then
restore them in the output. This is a low-effort, high-impact privacy
enhancement that aligns with SoNash's core mission.

---

## 5. Knowledge Candidates

### T1 — Active value (directly applicable now)

| Candidate                                               | Type      | Novelty | Effort | Relevance |
| ------------------------------------------------------- | --------- | ------- | ------ | --------- |
| YouTube audio extraction pipeline (pytubefix + moviepy) | pattern   | medium  | E1     | high      |
| Amazon Transcribe async job lifecycle                   | knowledge | medium  | E0     | high      |
| PII tokenize/untokenize round-trip pattern              | pattern   | high    | E1     | high      |

### T2 — Systems/architecture value

| Candidate                                             | Type    | Novelty | Effort | Relevance |
| ----------------------------------------------------- | ------- | ------- | ------ | --------- |
| Chain of Responsibility + Factory handler composition | pattern | medium  | E1     | medium    |
| AST-based handler auto-discovery                      | pattern | medium  | E2     | medium    |
| JSONPath model-agnostic invocation config             | pattern | low     | E1     | medium    |

### T3 — Lower priority

| Candidate                                                   | Type      | Novelty | Effort | Relevance |
| ----------------------------------------------------------- | --------- | ------- | ------ | --------- |
| Web page media extraction (images, videos, audio from HTML) | pattern   | low     | E2     | low       |
| Multi-format reader catalog (PDF, Word, Excel, PPT)         | knowledge | low     | E0     | low       |
| Bedrock chunk-and-retry summarization                       | pattern   | low     | E1     | low       |

---

## 6. What's Worth Avoiding

**Don't build AWS-coupled extraction pipelines.** This repo is locked to 5+ AWS
services (Transcribe, Textract, Comprehend, Bedrock, S3, Rekognition). Each adds
a service dependency, a billing dimension, and a failure mode. For JASON-OS's
portable-tools vision, extraction should use local-first alternatives where
possible: Whisper instead of Transcribe, Tesseract instead of Textract, local
spaCy instead of Comprehend. The repo itself hints at this — there's a
commented-out `OpenAIWhisperTranscriptionHandler` in the custom chain,
suggesting even the author was moving toward local alternatives.

**Don't poll with `time.sleep(30)`.** The Transcribe handler polls every 30
seconds in a blocking while loop. For a CLI tool this is acceptable. For any
production or agent-integrated system, use async callbacks, SQS notifications,
or EventBridge. The polling pattern is fine to understand but should never be
copied into agent pipelines.
