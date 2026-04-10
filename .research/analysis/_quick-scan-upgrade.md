# Quick Scan → Standard Upgrade Checklist

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-04-10 (Session #272)
**Status:** ACTIVE
**Purpose:** Prioritized checklist for T29 Wave 4 (Step 10) — upgrade 12 TRUE quick-scan repos to Standard depth.
<!-- prettier-ignore-end -->

---

## ⚠️ Session #272 Scope Correction

**Original scope was 22 repos. Actual scope is 12 TRUE quick scans.** The
original count was based on the `depth: "quick"` field in analysis.json, but
`scripts/cas/migrate-v3.js` (2026-04-09 v3.0 migration) stamped `depth: "quick"`
on 10 repos that actually have full Standard artifact sets. Those 10 need only a
metadata depth-field patch, not re-analysis. See Wave 4 Step 8.5 in
`.planning/synthesis-consolidation/PLAN.md` for the fix procedure.

**12 TRUE quick scans (need Standard upgrade):** ArchiveBox, crawl4ai,
firecrawl, lux-video-downloader, marker, MinerU, nitter, outline, qmd, reader,
surya, tesseract.

**10 mislabeled (just need depth field fix):** aws-media-extraction,
bedrock-summarize-audio-video-text, bulk-transcribe-youtube-playlist,
codecrafters-io-build-your-own-x, hkuds-cli-anything, karpathy-autoresearch,
public-apis_public-apis, teng-lin_notebooklm-py, viktoraxelsen-memskill,
youtube-transcript-api.

---

## Context

T29 Wave 4 upgrades 12 TRUE quick-scan repos to Standard depth so `/synthesize`
has full artifact sets (analysis.json + creator-view.md + value-map.json +
findings.jsonl + summary.md + deep-read.md + content-eval.jsonl +
coverage-audit.jsonl) for all sources.

**Current scan depth state** (as of 2026-04-10):

| Source Type |  Total |  Quick | Standard | Deep |
| ----------- | -----: | -----: | -------: | ---: |
| repo        |     25 | **22** |        3 |    0 |
| website     |      6 |      0 |        6 |    0 |
| document    |      1 |      0 |        1 |    0 |
| media       |      2 |      0 |        2 |    0 |
| **Total**   | **34** | **22** |   **12** |    0 |

**Already at Standard (skip):** safishamsi-graphify, docling, unstructured.

## Ranking Criteria

Per PLAN.md Step 9:

1. Tag overlap with existing Standard-depth analyses
2. ROADMAP alignment (repos relevant to active work — T28 CAS, T29 synthesis,
   T16 JASON-OS, T4 memory, T27 media)
3. Quality score from Quick Scan (N/A — all stars null in quick scans)
4. Source diversity (prioritize repos that cover gap domains)

**Note:** All 22 repos currently have `source_tier: T1` and
`candidates_count: 0` (quick scans don't extract candidates). All stars are null
(quick scans don't fetch metrics). Standard upgrade will populate all of these.

---

## Priority List (22 repos)

### Wave 4A — Content extraction & web scraping (Priority 1-6)

**Relevance:** Direct infrastructure for T28 CAS (website-analysis,
document-analysis handlers). Highest synthesis value — informs the extraction
pipeline itself.

| #   | Slug        | Source               | Tags                                               | Why                                                                  |
| --- | ----------- | -------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | `firecrawl` | mendableai/firecrawl | framework, typescript, ai-crawler, data-extraction | Active AI crawler, TS stack match, direct website-analysis relevance |
| 2   | `crawl4ai`  | unclecode/crawl4ai   | library, python                                    | Complements firecrawl — python side of web scraping for AI           |
| 3   | `reader`    | jina-ai/reader       | web-service, typescript, llm, proxy                | LLM-first reader proxy; architecture pattern for content extraction  |
| 4   | `marker`    | VikParuchuri/marker  | library, python                                    | PDF → Markdown conversion, direct document-analysis relevance        |
| 5   | `MinerU`    | opendatalab/MinerU   | framework, python                                  | Document extraction toolkit, complements marker                      |
| 6   | `surya`     | VikParuchuri/surya   | library, python                                    | OCR/layout (sibling to marker), foundation for PDF pipelines         |

### Wave 4B — Research & agent tooling (Priority 7-11)

**Relevance:** T16 JASON-OS (Claude Code OS research), T4 multi-layer memory,
agent infrastructure patterns.

| #   | Slug                     | Source                 | Tags                    | Why                                                  |
| --- | ------------------------ | ---------------------- | ----------------------- | ---------------------------------------------------- |
| 7   | `karpathy-autoresearch`  | karpathy/autoresearch  | research-tool, python   | High-signal author (Karpathy), autoresearch patterns |
| 8   | `viktoraxelsen-memskill` | ViktorAxelsen/MemSkill | research-tool, python   | Memory/skill system — direct T4 relevance            |
| 9   | `hkuds-cli-anything`     | HKUDS/CLI-Anything     | framework, python       | CLI framework, JASON-OS CLI layer reference          |
| 10  | `qmd`                    | nicholasgasior/qmd     | tool, typescript        | General tool — needs discovery during analysis       |
| 11  | `outline`                | outline/outline        | application, typescript | Collaborative docs application, UX patterns          |

### Wave 4C — Media extraction (Priority 12-16)

**Relevance:** T27 media content extraction, complements /media-analysis handler
(which already uses youtube-transcript-api as a dependency).

| #   | Slug                                 | Source                                                                                                  | Tags                    | Why                                             |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------- |
| 12  | `youtube-transcript-api`             | jdepoix/youtube-transcript-api                                                                          | library                 | Active dependency of media-analysis handler     |
| 13  | `bulk-transcribe-youtube-playlist`   | Dicklesworthstone/bulk_transcribe_youtube_videos_from_playlist                                          | utility-tool            | Bulk transcription patterns                     |
| 14  | `bedrock-summarize-audio-video-text` | ksharlandjiev/bedrock-summarize-audio-video-text                                                        | tool-demo, bedrock      | AWS Bedrock media pipeline reference            |
| 15  | `aws-media-extraction`               | aws-solutions-library-samples/guidance-for-media-extraction-and-dynamic-content-policy-framework-on-aws | repo, media, extraction | AWS reference architecture for media extraction |
| 16  | `lux-video-downloader`               | iawia002/lux                                                                                            | cli-tool, video         | Video download CLI (Go)                         |

### Wave 4D — Foundational & gap fillers (Priority 17-22)

**Relevance:** Lower direct relevance but fill domain gaps (OCR, scraping,
archiving, curated lists).

| #   | Slug                               | Source                           | Tags                                 | Why                                                 |
| --- | ---------------------------------- | -------------------------------- | ------------------------------------ | --------------------------------------------------- |
| 17  | `tesseract`                        | tesseract-ocr/tesseract          | library, c++                         | Foundation OCR library (upstream for marker/surya)  |
| 18  | `teng-lin_notebooklm-py`           | teng-lin/notebooklm-py           | library, python                      | NotebookLM API wrapper, small scope                 |
| 19  | `ArchiveBox`                       | ArchiveBox/ArchiveBox            | application, python                  | Self-host archiving (knowledge persistence pattern) |
| 20  | `nitter`                           | zedeus/nitter                    | application, nim                     | Twitter scraper/frontend (tangential to extraction) |
| 21  | `codecrafters-io-build-your-own-x` | codecrafters-io/build-your-own-x | curated-list, markdown, awesome-list | Broad curated list (synthesis meta-source)          |
| 22  | `public-apis_public-apis`          | public-apis/public-apis          | curated-list, python, api, dataset   | Broad API directory (synthesis meta-source)         |

---

## Execution Plan (Wave 4 Step 10)

Per PLAN.md Step 10 batch optimizations:

1. **Skip interactive gate** — depth pre-set to `standard` in each invocation
2. **Tags already exist** — present existing tags for confirmation,
   batch-approve where possible
3. **Batch retro at end** — one retro covering all 22 at session end
4. **Single index rebuild** — `node scripts/cas/rebuild-index.js` once after all
   22 complete (not per-repo)
5. **Single EXTRACTIONS.md regeneration** —
   `node scripts/cas/generate-extractions-md.js` once at end
6. **Self-audit sweep** — run `node scripts/cas/self-audit.js --slug=<slug>` for
   all 22 after completion

**Command pattern:**

```bash
/analyze https://github.com/<org>/<repo> --depth=standard
```

**Time estimate:** ~5-8 min per repo × 22 repos = **~2-3 hours** single session.

## Completion Checklist

Wave 4A (Content extraction):

- [ ] 1. firecrawl
- [ ] 2. crawl4ai
- [ ] 3. reader
- [ ] 4. marker
- [ ] 5. MinerU
- [ ] 6. surya

Wave 4B (Research & agent tooling):

- [ ] 7. karpathy-autoresearch
- [ ] 8. viktoraxelsen-memskill
- [ ] 9. hkuds-cli-anything
- [ ] 10. qmd
- [ ] 11. outline

Wave 4C (Media extraction):

- [ ] 12. youtube-transcript-api
- [ ] 13. bulk-transcribe-youtube-playlist
- [ ] 14. bedrock-summarize-audio-video-text
- [ ] 15. aws-media-extraction
- [ ] 16. lux-video-downloader

Wave 4D (Foundational & gap fillers):

- [ ] 17. tesseract
- [ ] 18. teng-lin_notebooklm-py
- [ ] 19. ArchiveBox
- [ ] 20. nitter
- [ ] 21. codecrafters-io-build-your-own-x
- [ ] 22. public-apis_public-apis

## Post-Batch Actions

- [ ] Run `node scripts/cas/rebuild-index.js`
- [ ] Run `node scripts/cas/generate-extractions-md.js`
- [ ] Run self-audit sweep across all 22 (loop)
- [ ] Verify `source_tier` populated for all 22 (should remain T1 unless user
      reassigns)
- [ ] Stars field populated via Standard metadata fetch
- [ ] Commit with message:
      `feat(T29): Wave 4 — batch upgrade 22 quick-scan repos to Standard`
- [ ] Proceed to Wave 5 (E2E testing + /synthesize run)

---

## Session Log

| Session | Date       | Action                            |
| ------- | ---------- | --------------------------------- |
| #272    | 2026-04-10 | Checklist created (Wave 4 Step 9) |
