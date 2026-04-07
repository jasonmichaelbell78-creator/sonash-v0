# T28 Pre-Brainstorm Analysis Plan

**Created:** 2026-04-07 | **Status:** IN PROGRESS | **Branch:** planning-4626

Goal: Analyze repos covering all content extraction source types before
brainstorming the Unified Content Intelligence System (T28). Build comprehensive
extraction journal data so the brainstorm has prior art for every source type.

---

## Process

1. **Quick Scan all repos in cluster** — triage for Standard worthiness
2. **Standard the valuable ones** — full Creator + Engineer views
3. **After each cluster** — spin up background gap agent that reads the
   cluster's analyses and asks: "Given what these repos taught us about this
   extraction layer, what process gaps, architectural questions, or design
   unknowns remain for T28?" The agent looks inward at what we've learned, not
   outward for more repos.
4. **Back-end pass** — review gap agent findings, address open questions
5. **Final gap sweep** — re-scan across all 28 source types for architectural
   blind spots

---

## Gap Agent Specification

Each gap agent receives:

- The cluster's completed analyses (creator-view.md, value-map.json)
- The T28 goal (unified extraction → analysis → synthesis layers)
- What we've already analyzed (prior clusters + T27 repos)

It produces a short report answering:

- What extraction patterns are still unclear for this source type?
- What architectural decisions aren't covered by any analyzed repo?
- How does this cluster's approach connect to or conflict with prior clusters?
- What would break if we tried to normalize this source type into the shared
  analysis layer?
- What's the hardest unsolved problem for T28 in this domain?

Output: `.research/repo-analysis/_gap-agent-{cluster}.md`

---

## Repo Queue (by topic cluster)

### Cluster A: Multi-format extraction (architectural references)

| #   | Repo                                             | Depth       | Status  |
| --- | ------------------------------------------------ | ----------- | ------- |
| 1   | `unstructured-io/unstructured`                   | QS→Standard | pending |
| 2   | `DS4SD/docling`                                  | QS→triage   | pending |
| 3   | `jina-ai/reader`                                 | QS→triage   | pending |
|     | **Gap agent A:** multi-format normalization gaps | background  | pending |

### Cluster B: PDF/document + image/OCR

| #   | Repo                                            | Depth      | Status  |
| --- | ----------------------------------------------- | ---------- | ------- |
| 4   | `VikParuchuri/marker`                           | QS→triage  | pending |
| 5   | `VikParuchuri/surya`                            | QS→triage  | pending |
| 10  | `tesseract-ocr/tesseract`                       | QS→triage  | pending |
| 11  | `opendatalab/MinerU`                            | QS→triage  | pending |
|     | **Gap agent B:** document/image extraction gaps | background | pending |

### Cluster C: Web crawling

| #   | Repo                                      | Depth      | Status  |
| --- | ----------------------------------------- | ---------- | ------- |
| 6   | `mendableai/firecrawl`                    | QS→triage  | pending |
| 7   | `unclecode/crawl4ai`                      | QS→triage  | pending |
|     | **Gap agent C:** web crawling for AI gaps | background | pending |

### Cluster D: Audio/podcast + universal download

| #   | Repo                                                     | Depth      | Status  |
| --- | -------------------------------------------------------- | ---------- | ------- |
| 8   | `m-bain/whisperX`                                        | QS→triage  | pending |
| 9   | `yt-dlp/yt-dlp`                                          | QS→triage  | pending |
|     | **Gap agent D:** audio extraction + T27 integration gaps | background | pending |

### Cluster E: Wiki + MCP + API

| #   | Repo                                                | Depth      | Status  |
| --- | --------------------------------------------------- | ---------- | ------- |
| 12  | `outline/outline`                                   | QS→triage  | pending |
| 13  | `tobi/qmd`                                          | QS→triage  | pending |
| 14  | `modelcontextprotocol/servers`                      | QS→triage  | pending |
| 15  | `punkpeye/awesome-mcp-servers`                      | QS→triage  | pending |
| 16  | `swagger-api/swagger-parser`                        | QS→triage  | pending |
|     | **Gap agent E:** structured content extraction gaps | background | pending |

### Cluster F: Chat/forum + social media + CLI

| #   | Repo                                           | Depth      | Status  |
| --- | ---------------------------------------------- | ---------- | ------- |
| 17  | `ArchiveBox/ArchiveBox`                        | QS→triage  | pending |
| 18  | `zedeus/nitter`                                | QS→triage  | pending |
| 19  | `JustAnotherArchivist/snscrape`                | QS→triage  | pending |
| 20  | `tldr-pages/tldr`                              | QS→triage  | pending |
|     | **Gap agent F:** ephemeral/social content gaps | background | pending |

### Back-end pass

| Task                                        | Status  |
| ------------------------------------------- | ------- |
| Review gap agent A-F findings               | pending |
| Address open architectural questions        | pending |
| Final coverage sweep across 28 source types | pending |

---

## Source Type Coverage Tracker

| Source Type         | Analyzed Repos           | Gap Status |
| ------------------- | ------------------------ | ---------- |
| Code repository     | 7 repos ✓                | covered    |
| Website/webpage     | 5 sites ✓                | covered    |
| Video (captions)    | youtube-transcript-api ✓ | covered    |
| Video (Whisper)     | bulk-transcribe ✓        | covered    |
| Video (frames)      | aws-media-extraction ✓   | covered    |
| Video (download)    | lux ✓                    | covered    |
| PDF/document        | #1, #2, #4, #5, #11      | pending    |
| Office docs         | #1, #2                   | pending    |
| Image/OCR           | #5, #10, #11             | pending    |
| Audio/podcast       | #8, #9                   | pending    |
| Web crawling (LLM)  | #6, #7                   | pending    |
| Multi-format        | #1, #2, #3               | pending    |
| Wiki/knowledge base | #12, #13                 | pending    |
| MCP                 | #14, #15                 | pending    |
| API/OpenAPI         | #16                      | pending    |
| Chat/forum          | #17                      | pending    |
| Social media        | #18, #19                 | pending    |
| Tweets/threads      | #18, #19                 | pending    |
| CLI                 | #20                      | pending    |
| Email/newsletter    | #1                       | pending    |
| Academic paper      | gap — none queued        | pending    |
| Book/ebook          | gap — none queued        | pending    |
| Slide deck          | gap — none queued        | pending    |
| Conference talk     | gap — none queued        | pending    |
| RSS/feed            | gap — none queued        | pending    |
| Structured data     | gap — none queued        | pending    |
| Database schema     | gap — none queued        | pending    |
| Figma/design        | gap — none queued        | pending    |

---

## Completion Criteria

- All 20 repos Quick Scanned
- High-value repos Standard analyzed
- Gap agents run for each cluster with findings documented
- Open architectural questions addressed
- Source type coverage tracker shows no critical Tier 1-2 gaps
- extraction-journal.jsonl has candidates for all Tier 1-2 source types
- Ready for `/brainstorm` on T28
