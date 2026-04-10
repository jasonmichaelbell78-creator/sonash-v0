---
name: document-analysis
description: >-
  Content analysis for documents — PDFs, gists, articles, markdown, arxiv
  papers, code snippets, meeting notes. Dual-lens (Creator View + Engineer View)
  three-tier (Quick/Standard/Deep). Part of the Content Analysis System (T28).
  Outputs to .research/analysis/<doc-slug>/.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-08
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Shared conventions:** See `.claude/skills/shared/CONVENTIONS.md`

# Document Analysis

Content analysis of documents as knowledge artifacts. Mirrors `/repo-analysis`
structure for cohesion within the Content Analysis System. Handles any
text-readable source: PDFs, GitHub gists, articles, markdown files, arxiv
papers, code snippets, meeting notes.

**Effort:** Quick Scan ~15 seconds. Standard 2-4 minutes. Deep 5-10 minutes.

## Critical Rules (MUST follow)

1. **Write-to-disk-first.** Every phase writes output before proceeding.
2. **State file on every phase transition.** Update
   `.claude/state/document-analysis.<slug>.state.json` after each phase.
3. **Creator View is mandatory** for Standard/Deep. Written as conversational
   prose, NOT tables or clinical output.
4. **No silent skips.** If a SHOULD step fails, retry once, then report.
5. **Bands over numbers.** Display categorical bands with scores in parentheses.
6. **Home context MUST be loaded** for Creator View — SESSION_CONTEXT.md,
   ROADMAP.md, CLAUDE.md, `.claude/skills/` listing, MEMORY.md user entries.
7. **Schema validation.** analysis.json MUST validate against
   `scripts/lib/analysis-schema.js`. See CONVENTIONS.md Section 12.
8. **Use Claude's built-in tools for reading.** Read tool for PDFs (up to 20
   pages per request, paginate for longer). WebFetch for URLs. Read for local
   files. **PDF fallback (Windows):** If Read tool fails with
   `pdftoppm not found`, use `pdfjs-dist` via node:
   `require('pdfjs-dist/legacy/build/pdf.mjs')` to extract text per page.
   Install: `npm install pdfjs-dist --no-save`. To permanently fix: install
   poppler (`winget install poppler` in a Windows terminal).

## When to Use

- User provides a file path to a PDF, markdown, or text file
- User provides a gist URL, arxiv URL, or article URL (not a repo or website)
- User invokes `/document-analysis` or `/analyze` routes here
- Evaluating a document as a knowledge source

**When NOT to Use:** GitHub repos -> `/repo-analysis` | Websites ->
`/website-analysis` | Video/audio -> `/media-analysis` | Testing our webapp ->
`/webapp-testing`

## Input

```
/document-analysis <path-or-url>
/document-analysis <path> --depth=standard
/document-analysis <path> --depth=deep
```

**Type detection (when called via `/analyze` router):**

| Input Pattern                   | Detected As    |
| ------------------------------- | -------------- |
| `*.pdf`                         | PDF document   |
| `*.md`, `*.txt`                 | Markdown/text  |
| `gist.github.com/*`             | GitHub gist    |
| `arxiv.org/*`                   | Academic paper |
| Other non-repo, non-website URL | Article        |

**Output location:** `.research/analysis/<doc-slug>/` **Produces:**
analysis.json (unified schema v3.0), value-map.json, creator-view.md,
findings.jsonl, summary.md, deep-read.md, content-eval.jsonl,
coverage-audit.jsonl, extraction-journal.jsonl entries.

---

## Process Overview

```
VALIDATE   Guards         -> File exists? URL reachable? Supported type?
PHASE 0    Quick Scan     -> Read first page/section, classify, lightweight
                             creator lens
GATE       Interactive    -> "Run Standard/Deep? [y/N]"
PHASE 1    Content Load   -> Read full document (Read tool for PDF/local,
                             WebFetch for URLs)
PHASE 2    Dimension Wave -> Content quality, depth, methodology,
                             actionability, novelty, clarity
PHASE 2b   Deep Read      -> Internal references, citations, linked resources
PHASE 4    Creator View   -> Same 6 sections as repo-analysis
PHASE 4b   Content Eval   -> Evaluate embedded references and linked resources
PHASE 5    Engineer View  -> Quality bands using shared scoring system
PHASE 6    Value Map      -> Pattern/knowledge/content/anti-pattern candidates
PHASE 6c   Tag Suggestion -> Suggest 5-8 tags, user accepts/modifies
PHASE 6b   Coverage Audit -> Unread sections, unfollowed references
SELF-AUDIT                -> Artifact presence, schema validation
ROUTING    Menu           -> Same 8 options as repo-analysis
```

Phase markers: `========== PHASE N: [NAME] ==========`

---

## Quick Scan (Phase 0)

Read the first page (PDF) or first 100 lines (text/markdown). For URLs, fetch
and read the first screenful. Classify the document type and produce a
lightweight assessment.

**Lightweight creator lens (MUST):** Write 2-3 sentences: "This document appears
to cover/argue/teach X." Enough to judge whether Standard/Deep is worth the
time.

**Interactive gate:** Quick Scan is a **preview**. Standard produces the full
artifact set needed for `/synthesize` cross-source intelligence.

```
Quick Scan complete. [quality assessment].

Quick Scan is a preview — it confirms whether this document is worth your
time. Standard analysis produces the full artifact set needed for
/synthesize cross-source intelligence.

Run Standard/Deep? (Standard ~5-10 min) [Y/n]
```

**source_tier:** Documents span `T1`-`T3`. Default `T2`; academic papers and
peer-reviewed sources should be `T1`, anonymous gists `T3`. User can override
during `/synthesize` pre-flight.

---

## Content Load (Phase 1)

Read the full document:

- **PDF:** Use Read tool with `pages` parameter. For docs >20 pages, read in
  batches of 20. Note total page count.
- **Local files:** Read tool directly.
- **Gist URLs:** WebFetch the raw content URL.
- **arxiv URLs:** WebFetch the abstract page. If PDF analysis is needed, note
  the PDF URL and use Read tool.
- **Article URLs:** WebFetch the page content.

Update state file with content loaded flag.

---

## Dimension Wave (Phase 2)

Assess the document across 6 dimensions (0-100 scale, same band system):

| Dimension      | What It Measures                              |
| -------------- | --------------------------------------------- |
| Content Depth  | How thoroughly topics are covered             |
| Methodology    | Rigor of reasoning, evidence quality          |
| Actionability  | How directly applicable the ideas are         |
| Novelty        | Original insights vs rehashed knowledge       |
| Clarity        | Writing quality, organization, accessibility  |
| Source Quality | Author credibility, citation quality, recency |

---

## Deep Read (Phase 2b — MUST for Standard/Deep)

Identify and catalog:

- Internal references and citations
- Linked external resources (papers, repos, tools, datasets)
- Methodology descriptions worth extracting
- Diagrams or tables with condensed knowledge

Output: `deep-read.md` listing what was found and what knowledge it contains.

---

## Creator View (Phase 4 — MUST for Standard/Deep)

Same 6 sections as repo-analysis. Written in conversational prose.

1. **What This Document Understands (+ Blindspots)**
2. **What's Relevant To Your Work**
3. **Where Your Approach Differs**
4. **The Challenge**
5. **Knowledge Candidates**
6. **What's Worth Avoiding**

Load home context before writing. Reference specific content from Deep Read.

---

## Content Evaluation (Phase 4b — MUST for Standard/Deep)

Evaluate embedded references for relevance to home context. Output to
`content-eval.jsonl`. Same format as repo-analysis.

---

## Engineer View (Phase 5)

Quality bands using the shared scoring system. 6 dimensions from Phase 2 produce
summary bands. Absence pattern classification where applicable.

---

## Value Map (Phase 6)

Same 4 candidate types as repo-analysis: pattern, knowledge, content,
anti-pattern. Same ranking fields (novelty, effort, relevance). Write to
`value-map.json`.

Update `extraction-journal.jsonl` with entries for all candidates.

---

## Tag Suggestion (Phase 6c — MUST for Standard/Deep)

Suggest 5-8 tags based on: document type (`pdf`, `arxiv`, `gist`), topic
keywords, candidate types found. Present to user for accept/modify. Per
CONVENTIONS.md Section 14.

---

## Coverage Audit (Phase 6b — MUST for Standard/Deep)

Scan for unread sections, unfollowed references, unexplored citations. Present
as interactive prompt (same format as repo-analysis). Record skipped items in
`coverage-audit.jsonl`.

---

## Self-Audit (MUST — penultimate phase)

Per CONVENTIONS.md Section 8:

1. Artifact presence: all MUST files exist
2. Schema contract: analysis.json validates against Zod schema
3. Completeness: all phases produced output

---

## Routing Menu

Same 8 options as repo-analysis:

| Option                        | Action                                       |
| ----------------------------- | -------------------------------------------- |
| **1. Extract value**          | Present candidates from value-map            |
| **2. Send to TDMS**           | Transform findings to TDMS format            |
| **3. Deep-plan this**         | Inject analysis as research context          |
| **4. Save to memory**         | Persist key findings as project memory       |
| **5. Adoption verdict**       | Full assessment (if applicable)              |
| **6. Explore insights**       | Deeper conversation about findings           |
| **7. Done**                   | Cleanup, confirm artifacts, track invocation |
| **8. Cross-source synthesis** | If 3+ sources analyzed, offer synthesis      |

---

## State File & Resume

State file: `.claude/state/document-analysis.<slug>.state.json`

Update after every phase. On re-invocation with same input: offer Resume/Re-run.

---

## Version History

| Version | Date       | Description                                                                                                                                |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1     | 2026-04-09 | PDF fallback for Windows, add summary.md + deep-read.md + content-eval.jsonl + coverage-audit.jsonl to output list (Session #270 E2E test) |
| 1.0     | 2026-04-08 | Initial creation (T28 CAS, Session #269)                                                                                                   |
