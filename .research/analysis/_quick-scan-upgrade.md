# Quick Scan → Standard Upgrade Checklist

<!-- prettier-ignore-start -->
**Document Version:** 3.1
**Last Updated:** 2026-04-12 (Session #275 handoff)
**Status:** ACTIVE
**Purpose:** Prioritized checklist for T29 Wave 4 (Step 10) — upgrade **12 TRUE quick-scan repos** to Standard depth.
<!-- prettier-ignore-end -->

---

## Session #273 Scope Correction (v3.0)

**v2.0 (Session #272)** listed all 22 repos and flagged 10 as "mislabeled"
needing a depth-field patch. Those 10 have been fixed under
[Wave 4 Step 8.5](../../.planning/synthesis-consolidation/PLAN.md) in Session
#273:

- **9 repos patched** (depth `quick` → `standard` + candidates backfilled from
  the extraction journal under the "extractions are canon" principle): commit
  `aa4b5fe7`
- **1 repo excluded** (`aws-media-extraction`) as a legitimate quick scan with a
  separate anomaly — see PLAN.md Step 8.5 follow-ups

**v3.0 removes all 10 from the priority list and checklist.** This document now
tracks only the **12 TRUE quick-scan repos** that need a real re-analysis at
Standard depth for Wave 5 synthesis.

---

## Context

T29 Wave 4 upgrades the 12 TRUE quick-scan repos so `/synthesize` has full
artifact sets for all sources. The Standard artifact set is: analysis.json +
creator-view.md + value-map.json + findings.jsonl + summary.md + deep-read.md +
content-eval.jsonl + coverage-audit.jsonl.

**Current scan-depth state** (post Step 8.5):

| Source Type |  Total |  Quick | Standard | Deep |
| ----------- | -----: | -----: | -------: | ---: |
| repo        |     25 | **12** |       13 |    0 |
| website     |      6 |      0 |        6 |    0 |
| document    |      1 |      0 |        1 |    0 |
| media       |      2 |      0 |        2 |    0 |
| **Total**   | **34** | **12** |   **22** |    0 |

**Already at Standard (do not re-analyze):** safishamsi-graphify, docling,
unstructured, bedrock-summarize-audio-video-text,
bulk-transcribe-youtube-playlist, codecrafters-io-build-your-own-x,
hkuds-cli-anything, karpathy-autoresearch, public-apis_public-apis,
teng-lin_notebooklm-py, viktoraxelsen-memskill, youtube-transcript-api, plus all
websites/documents/media sources.

**Excluded from upgrade:** `aws-media-extraction` (legitimate quick scan,
pending separate investigation for its journal-entry anomaly).

---

## Ranking Criteria

Per PLAN.md Step 9, prioritized by:

1. **Qualitative ROADMAP relevance** (primary) — T28 CAS infrastructure, T29
   synthesis corpus completeness, T4 memory, T16 JASON-OS
2. **Quality score from Quick Scan** (tie-breaker 1) — range 52–87
3. **Stars** (tie-breaker 2) — range 10K–105K
4. **Tag overlap with Standard corpus** (tie-breaker 3) — signal that the repo
   sits in a domain already being synthesized

---

## Priority List (12 TRUE Quick Scans)

### Bucket A — Direct CAS content-extraction infrastructure (priority 1-6)

**Why top priority:** These repos are the reference implementations for the same
pipelines SoNash's own `/website-analysis`, `/document-analysis`, and
`/repo-analysis` handlers execute. Standard-depth artifacts feed directly into
T29 synthesis themes about extraction patterns.

| #   | Slug        | Source               | Quality | Stars | Lang | Rationale                                               |
| --- | ----------- | -------------------- | :-----: | ----: | :--: | ------------------------------------------------------- |
| 1   | `firecrawl` | mendableai/firecrawl |   87    |  105K |  TS  | AI crawler reference, TS stack match, website-analysis  |
| 2   | `MinerU`    | opendatalab/MinerU   |   85    |   58K |  Py  | Document extraction toolkit, document-analysis parallel |
| 3   | `crawl4ai`  | unclecode/crawl4ai   |   83    |   63K |  Py  | Python-side web-scraping-for-AI, complements firecrawl  |
| 4   | `marker`    | VikParuchuri/marker  |   74    |   33K |  Py  | PDF → Markdown, direct document-analysis relevance      |
| 5   | `surya`     | VikParuchuri/surya   |   70    |   19K |  Py  | OCR/layout companion to marker, PDF pipeline foundation |
| 6   | `reader`    | jina-ai/reader       |   52    |   10K |  TS  | LLM-first reader proxy, content-extraction pattern      |

### Bucket B — Foundational infrastructure (priority 7)

**Why:** Upstream dependency for marker and surya. Historical context for the
entire OCR pipeline layer.

| #   | Slug        | Source                  | Quality | Stars | Lang | Rationale                                      |
| --- | ----------- | ----------------------- | :-----: | ----: | :--: | ---------------------------------------------- |
| 7   | `tesseract` | tesseract-ocr/tesseract |   74    |   73K | C++  | Foundation OCR library (upstream marker/surya) |

### Bucket C — Knowledge / archival / collaborative tools (priority 8-9)

**Why:** Tangential to CAS infrastructure but inform UX/architecture patterns
relevant to JASON-OS (T16) and personal knowledge management themes.

| #   | Slug         | Source                | Quality | Stars | Lang | Rationale                                    |
| --- | ------------ | --------------------- | :-----: | ----: | :--: | -------------------------------------------- |
| 8   | `ArchiveBox` | ArchiveBox/ArchiveBox |   84    |   27K |  Py  | Self-host archiving, knowledge persistence   |
| 9   | `outline`    | outline/outline       |   83    |   38K |  TS  | Collaborative docs UX, real-time editing ref |

### Bucket D — Specialized / niche (priority 10-12)

**Why:** Lower direct relevance, but each fills a distinct domain gap.

| #   | Slug                   | Source             | Quality | Stars | Lang | Rationale                                    |
| --- | ---------------------- | ------------------ | :-----: | ----: | :--: | -------------------------------------------- |
| 10  | `qmd`                  | nicholasgasior/qmd |   81    |   19K |  TS  | General TS tool, domain discovered on scan   |
| 11  | `nitter`               | zedeus/nitter      |   69    |   12K | Nim  | Twitter scraper/frontend, extraction pattern |
| 12  | `lux-video-downloader` | iawia002/lux       |   65    |   31K |  Go  | Video download CLI (Go), media pipeline      |

---

## Execution Plan (Wave 4 Step 10)

Per PLAN.md Step 10 batch optimizations:

1. **Skip interactive gate** — depth pre-set to `standard` in each invocation
2. **Tags already exist** — present existing tags for confirmation,
   batch-approve where possible
3. **Batch retro at end** — one retro covering all 12
4. **Single index rebuild** — `node scripts/cas/rebuild-index.js` once after all
   12 complete (not per-repo)
5. **Single EXTRACTIONS.md regeneration** —
   `node scripts/cas/generate-extractions-md.js` once at end
6. **Self-audit sweep** — run `node scripts/cas/self-audit.js --slug=<slug>` for
   all 12 after completion
7. **Pragmatic deviations** for very large repos (firecrawl ~1162 files,
   monorepo with 13 sub-apps): consider skipping repomix and running the
   dimension wave inline if repomix assembly dominates wallclock

**Command pattern:**

```bash
/analyze https://github.com/<org>/<repo> --depth=standard
```

**Time estimate:** ~5-8 min per repo × 12 repos = **~1-1.5 hours** single
session (revised down from v2.0's 2-3h / 22-repo estimate).

**Firecrawl pilot state (resumable):** Session #272 attempted firecrawl as the
first upgrade. It completed VALIDATE + Phase 0 Quick Scan API batch + Phase 1
clone (1162 files). Paused before repomix to re-audit Wave 4 scope. Resume state
at `.claude/state/repo-analysis.firecrawl.state.json`. Clone still on disk at
`/tmp/repo-analysis-firecrawl/`. Consider resuming vs. restarting based on clone
freshness.

---

## Completion Checklist

### Bucket A — CAS content-extraction infrastructure

- [x] 1. firecrawl ✅ Session #273 (commit `5a0b6b0d`, manual bypass-skill +
     Step 10.5 audit)
- [x] 2. MinerU ✅ Session #274 (commit `34e647fd`, full skill compliance,
     self-audit 14/0/0)
- [ ] 3. crawl4ai ← **NEXT per Session #274 handoff**
- [ ] 4. marker
- [ ] 5. surya
- [ ] 6. reader

### Bucket B — Foundational

- [ ] 7. tesseract

### Bucket C — Knowledge / archival / collaborative

- [ ] 8. ArchiveBox
- [ ] 9. outline

### Bucket D — Specialized / niche

- [ ] 10. qmd
- [ ] 11. nitter
- [ ] 12. lux-video-downloader

---

## Post-Batch Actions

- [ ] Run `node scripts/cas/rebuild-index.js`
- [ ] Run `node scripts/cas/generate-extractions-md.js`
- [ ] Run self-audit sweep across all 12 (loop)
- [ ] Verify `source_tier` populated for all 12 (should remain T1 unless user
      reassigns)
- [ ] Stars field populated via Standard metadata fetch
- [ ] Commit with message:
      `feat(T29): Wave 4 Step 10 — batch upgrade 12 quick-scan repos to Standard`
- [ ] Proceed to Wave 5 (E2E testing + `/synthesize` run)

---

## Session Log

| Session | Date       | Action                                                                                                                                       |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| #272    | 2026-04-10 | Checklist v2.0 created (22 repos — later corrected)                                                                                          |
| #273    | 2026-04-10 | v3.0 — scope corrected to 12 TRUE quicks after Step 8.5 executed, actual quality/stars populated, priority re-ranked qualitative + tie-break |
| #273    | 2026-04-10 | **Wave 4 #1 firecrawl ✅** — Standard artifacts built manually (bypass-skill); Step 10.5 audit for firecrawl completed                       |
| #274    | 2026-04-10 | **Wave 4 #2 MinerU ✅** — full skill compliance (Tag + Retro + Routing all executed), self-audit PASS 14/0/0; set the deliverable bar        |
| #275    | 2026-04-12 | Handoff — PR #507 R3 merged + branch cleanup; user will invoke /analyze for each remaining Wave 4 repo separately (discipline decision)      |
