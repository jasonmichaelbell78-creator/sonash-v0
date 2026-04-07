# Creator View: unstructured-io/unstructured

**Analyzed:** 2026-04-07 | **Depth:** Standard | **Skill:** repo-analysis v4.3

---

## 1. What This Repo Understands (+ Blindspots)

Unstructured understands something that most document processing libraries miss
entirely: the problem isn't parsing any single format — it's building a unified
abstraction that makes 30+ formats look identical to downstream consumers. The
`partition()` function in `auto.py` is deceptively simple — you hand it a
filename, it figures out what it is via libmagic, routes to the right
partitioner, and hands back a list of typed `Element` objects. But the
sophistication lives in what's behind that simplicity.

The repo deeply understands the **quality-speed tradeoff** in document
extraction. The strategy system (AUTO/FAST/OCR_ONLY/HI_RES) with graceful
dependency fallback is a mature pattern — if you don't have
`unstructured-inference` installed, it doesn't crash, it falls back to OCR. If
you don't have tesseract, it falls back to fast text extraction. This cascade
means you can run the library with zero ML dependencies and still get useful
output for simple documents.

The **FileType enum** (`file_utils/model.py`) is a masterclass in
self-describing registration. Each file type carries its partitioner module
path, required dependencies, pip extras, file extensions, and MIME types. Adding
a new format means adding one enum member — the routing infrastructure handles
the rest. This is the kind of registry pattern that eliminates an entire class
of "I forgot to register the handler" bugs.

The **element type system** (`documents/elements.py`, 1111 lines) shows deep
thinking about what "structured output" means. Elements carry coordinates (for
layout-aware applications), data source metadata (provenance tracking), and
permissions data (from ingestion sources). This isn't just "text in, text out" —
it's document intelligence with spatial awareness.

What the repo also understands well: **chunking is harder than it looks**. The
1800-line `chunking/base.py` handles table isolation (tables never merge with
adjacent text), title-based semantic boundaries, token counting, cross-page
chunking, and header repetition across table continuation chunks. The recent
changelog shows they're still actively improving this — v0.22.9 added table
isolation, v0.22.10 added header repetition, v0.22.16 added formula markdown
export. These are deep problems that only surface at scale.

**Blindspots:**

- **No cross-document understanding.** Unstructured partitions one document at a
  time. There's no concept of a corpus, collection, or relationships between
  documents. For T28's synthesis layer, this is the biggest gap — unstructured
  solves extraction but has no opinion on what to do after.
- **Ontology V2 is over-engineered and they know it.** The TODO comment from
  "Pluto" in `ontology.py` explicitly says `OntologyElement` is the only needed
  class and the rest "could be strongly simplified." The Pydantic-based HTML
  intermediate representation adds complexity without clear benefit.
- **Embedding module deprecated with no clear replacement path in-repo.** It's
  been pushed to `unstructured-ingest`, which fragments the developer
  experience. The extraction library can't embed without a separate package.
- **No built-in quality metrics at partition time.** The metrics module
  (`metrics/evaluate.py`) exists but requires a ground-truth dataset. There's no
  confidence score per element, no "I'm not sure about this table" signal. You
  get elements or you don't.

---

## 2. What's Relevant To Your Work

This is the single most architecturally relevant repo for T28. Not for code
extraction — the languages don't match (Python vs TypeScript) — but for **design
patterns that T28 needs to learn from**.

**The `partition()` → FileType → type-specific partitioner pattern** is exactly
what T28's extraction layer needs. Right now your content analysis splits across
4 separate skills (repo-analysis, website-analysis, repo-synthesis,
website-synthesis) with no shared extraction infrastructure. Unstructured solved
this by making the routing decision implicit — `partition("file.pdf")` just
works. T28 should have `extract("https://github.com/foo/bar")` and
`extract("https://example.com")` that route to the right extractor without the
user choosing a skill.

**The FileType self-describing registry** (`file_utils/model.py`) is the pattern
your T28 source type registration should follow. Each source type should declare
its extractor module, required MCP servers, extraction depth options, and output
schema — all in one place. When you add a new source type (say,
"slack-channel"), you register it in one enum and the routing handles the rest.

**The strategy fallback chain** maps directly to your Quick/Standard/Deep depth
model. Unstructured's AUTO → HI*RES → OCR_ONLY → FAST mirrors how T28 could
route: first try deep analysis, fall back to standard if deps are missing, fall
back to quick scan if rate-limited. The key insight is that fallback should be
\_automatic and logged*, not a hard failure.

**The element type system with coordinates metadata** is relevant if T28 ever
processes PDFs or images. More immediately, the pattern of typed elements with
provenance metadata (`DataSourceMetadata`) is what your extraction-journal.jsonl
entries should evolve into — each extracted candidate carrying its source,
extraction date, confidence level, and relationship to other candidates.

**The golden-file snapshot testing pattern** from `test_unstructured_ingest/` is
directly applicable. Your 40+ connector snapshot tests demonstrate what T28's
extraction regression tests should look like — run extraction on a known input,
compare against expected output, fail if drift exceeds threshold.

**The cleaners pipeline** (`cleaners/core.py`) — bullet normalization, ligature
replacement, whitespace cleanup — is a reminder that raw extraction output
always needs post-processing. T28's extraction layer should have a similar
normalization step between raw extraction and analysis input.

---

## 3. Where Your Approach Differs

| Area                      | Unstructured                              | Your Approach (T28)                            | Assessment                                                                                |
| ------------------------- | ----------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Scope**                 | Single-document extraction                | Multi-source extraction → analysis → synthesis | **Ahead** — T28's three-layer vision goes beyond what unstructured attempts               |
| **Source types**          | Files only (PDF, DOCX, HTML, etc.)        | Files + URLs + repos + APIs + audio + social   | **Ahead** — T28 covers source types unstructured doesn't touch                            |
| **Output schema**         | Typed elements (Text, Title, Table, etc.) | extraction-journal.jsonl + value-map.json      | **Different** — unstructured's element types are more granular; yours are more analytical |
| **Quality strategies**    | AUTO/FAST/OCR_ONLY/HI_RES                 | Quick/Standard/Deep                            | **Similar** — same concept, different granularity                                         |
| **Routing**               | libmagic auto-detection                   | Explicit skill invocation                      | **Behind** — unstructured auto-routes; you require the user to pick the right skill       |
| **Testing**               | Golden-file snapshots + benchmarks        | Manual verification                            | **Behind** — unstructured has mature regression testing; T28 has none yet                 |
| **Registry pattern**      | FileType enum, self-describing            | Ad-hoc per-skill configuration                 | **Behind** — no unified source type registry                                              |
| **Dependency management** | Graceful fallback chain                   | Hard requirements per skill                    | **Behind** — no fallback when tools are unavailable                                       |
| **Cross-document**        | None                                      | Synthesis layer planned                        | **Ahead** — unstructured can't do this at all                                             |
| **Language**              | Python                                    | TypeScript (orchestration)                     | **Different** — can't port code, but can port patterns                                    |

---

## 4. The Challenge

**Build T28's source type registry as a self-describing enum before writing any
extractors.**

Unstructured's biggest architectural win isn't any individual partitioner — it's
that adding a new file type is a one-liner enum addition. Everything else
(routing, dependency checking, strategy fallback, error handling) follows from
the registration. If T28 starts by writing individual extractors without this
registry pattern, you'll end up with the same fragmented skill landscape you
have now, just with more skills.

The registry should declare, for each source type: the extractor module,
required tools (gh CLI, Chrome, Whisper), optional tools, depth options, output
schema version, and dependencies on other source types. Build the registry
first, then populate it.

---

## 5. Knowledge Candidates

### Tier 1 — Active (directly applicable to T28 now)

| Candidate                         | Type    | Novelty | Effort | Relevance |
| --------------------------------- | ------- | ------- | ------ | --------- |
| Auto-routing via type detection   | pattern | high    | E2     | high      |
| Self-describing FileType registry | pattern | high    | E2     | high      |
| Strategy fallback chain           | pattern | medium  | E1     | high      |
| Graceful dependency checking      | pattern | medium  | E1     | high      |
| Golden-file snapshot testing      | pattern | medium  | E2     | medium    |

### Tier 2 — Systems (architectural lessons)

| Candidate                               | Type      | Novelty | Effort | Relevance |
| --------------------------------------- | --------- | ------- | ------ | --------- |
| Element type hierarchy with metadata    | knowledge | medium  | E1     | high      |
| Chunking with table isolation           | knowledge | medium  | E1     | medium    |
| Text cleaning pipeline pattern          | knowledge | low     | E0     | medium    |
| Benchmarking infrastructure (S3-backed) | knowledge | medium  | E1     | low       |

### Tier 3 — Lower priority

| Candidate                                      | Type      | Novelty | Effort | Relevance |
| ---------------------------------------------- | --------- | ------- | ------ | --------- |
| Ontology V2 (HTML intermediate representation) | knowledge | low     | E0     | low       |
| Formula markdown export                        | knowledge | low     | E0     | low       |
| Staging output adapters                        | knowledge | low     | E0     | low       |

---

## 6. What's Worth Avoiding

**Don't replicate unstructured's ontology V2 approach.** The Pydantic-based HTML
intermediate representation in `ontology.py` adds a full abstraction layer
between raw extraction and element output. The team themselves acknowledge it's
over-engineered (the TODO from "Pluto"). T28 should go directly from extraction
to typed output without an intermediate representation layer — the extra
indirection adds complexity without proportional value for an
orchestration-first system.

**Don't build per-format partitioners in TypeScript.** Unstructured's 30+
partitioners represent years of format-specific edge case handling (the PDF
partitioner alone is 1465 lines dealing with pdfminer quirks, coordinate space
math, graphics operator counting). T28 should delegate actual parsing to
existing tools (unstructured itself, Whisper, gh CLI, Chrome) and focus on
orchestration, routing, and synthesis — the layers unstructured doesn't have.

**Don't fragment your embedding/analysis pipeline across repos.** Unstructured
learned this the hard way — their embedding module is deprecated in the main
repo and moved to `unstructured-ingest`. This created a confusing developer
experience where the extraction library can't embed without a separate package.
Keep T28's extraction → analysis → synthesis as a single coherent system.
