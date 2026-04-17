---
name: document-analysis
description: >-
  Content analysis for documents — PDFs, gists, articles, markdown, arxiv
  papers, code snippets, meeting notes. Dual-lens (Creator View + Engineer
  View). Two user-invokable depths (Standard / Deep); Quick Scan is triage-
  only. Outputs to .research/analysis/<doc-slug>/.
---

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-04-15
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Shared conventions:** See `.claude/skills/shared/CONVENTIONS.md`

**`/analyze` router:** This skill is the document-handler arm of `/analyze` —
direct invocation and router dispatch both supported. Handoff contract: the
router passes `{target, auto_detected_type: "document"}` as if the skill were
invoked directly.

# Document Analysis

Analysis of documents as knowledge artifacts. Mirrors `/repo-analysis` structure
for cohesion with sibling CAS handlers. Handles any text-readable source: PDFs,
GitHub gists, articles, markdown files, arxiv papers, code snippets, meeting
notes.

## Warm-up (shown at invocation)

```
/document-analysis <path-or-url> [--depth=standard|deep]
  depth:          standard (default) | deep | quick (triage)
  phases:         PHASE N of M  (M = 9 Standard / Deep, 1 Quick)
  est. time:      Quick ~15s | Standard 2-4m | Deep 5-10m
  output:         .research/analysis/<slug>/
  prior feedback: {replay per CONVENTIONS §18 if prior state file exists}
```

## Routing Guide

| You want to…                             | Use this                    |
| ---------------------------------------- | --------------------------- |
| Analyze one PDF / gist / article / paper | `/document-analysis` (here) |
| Let router auto-pick repo vs site vs PDF | `/analyze <target>`         |
| Cross-source synthesis across 3+         | `/synthesize`               |
| GitHub repo                              | `/repo-analysis`            |
| Website / blog                           | `/website-analysis`         |
| Video / audio                            | `/media-analysis`           |

## Critical Rules (MUST follow)

1. **Write-to-disk-first.** Every phase writes output before proceeding.
2. **State file on every phase transition.** Update
   `.claude/state/document-analysis.<slug>.state.json` after each phase.
3. **Creator View is mandatory** for Standard/Deep. Conversational prose, NOT
   tables or clinical output.
4. **No silent skips.** If a SHOULD step fails, retry once, then report.
5. **Bands over numbers.** Display categorical bands with scores in parens.
6. **Home context MUST be loaded** for Creator View — SESSION_CONTEXT.md,
   ROADMAP.md, CLAUDE.md, `.claude/skills/` listing, MEMORY.md user entries.
7. **Schema validation.** analysis.json MUST validate against
   `scripts/lib/analysis-schema.js`. See CONVENTIONS.md §12.
8. **Use Claude's built-in tools for reading.** Read tool for PDFs (up to 20
   pages per request, paginate for longer). WebFetch for URLs. **PDF fallback
   (Windows):** If Read fails with `pdftoppm not found`, use `pdfjs-dist` via
   node: `require('pdfjs-dist/legacy/build/pdf.mjs')` to extract text per page.
   Install: `npm install pdfjs-dist --no-save`. Permanent fix:
   `winget install poppler`.

## When to Use

- User provides a file path to a PDF, markdown, or text file
- User provides a gist URL, arxiv URL, or article URL (not repo or site)
- Evaluating a document as a knowledge source

## When NOT to Use

- GitHub repo → `/repo-analysis`
- Website → `/website-analysis`
- Video / audio → `/media-analysis`
- Testing webapp → `/webapp-testing`

## Input

```
/document-analysis <path-or-url>
/document-analysis <path> --depth=standard
/document-analysis <path> --depth=deep
/document-analysis <path> --depth=quick       # triage only
```

**Type detection (when called via `/analyze` router):**

| Input Pattern                   | Detected As    |
| ------------------------------- | -------------- |
| `*.pdf`                         | PDF document   |
| `*.md`, `*.txt`                 | Markdown/text  |
| `gist.github.com/*`             | GitHub gist    |
| `arxiv.org/*`                   | Academic paper |
| Other non-repo, non-website URL | Article        |

## Output

`.research/analysis/<doc-slug>/` produces:

| Artifact                   | Phase   | Format / Notes                    |
| -------------------------- | ------- | --------------------------------- |
| `analysis.json`            | 0+      | Core record (schema v3.0)         |
| `findings.jsonl`           | 3/5     | One JSON object per line          |
| `creator-view.md`          | 4       | Conversational prose, 6 sections  |
| `summary.md`               | 5       | Health bands                      |
| `value-map.json`           | 6       | Candidates ranked                 |
| `deep-read.md`             | 2       | Internal references catalog       |
| `content-eval.jsonl`       | 3.5     | Evaluated references              |
| `coverage-audit.jsonl`     | 6b      | Unexplored items + user decisions |
| `extraction-journal.jsonl` | routing | Append-only cross-source record   |

Full schemas in REFERENCE.md §1.

---

## Process Overview (M=9 for Standard/Deep)

```
VALIDATE       Guards         -> File exists? URL reachable? Supported type? Prior feedback replay (§18)?
PHASE 0 of 9   Quick Scan     -> Read first page/section, classify, lightweight creator lens
GATE           Interactive    -> "Run Standard/Deep?" — flag bypasses
PHASE 1 of 9   Content Load   -> Read full document
PHASE 2 of 9   Deep Read      -> Internal references, citations, linked resources
PHASE 3 of 9   Dimension Wave -> 6 dimensions: depth, methodology, actionability, novelty, clarity, source quality
PHASE 3.5 of 9 Content Eval   -> Evaluate embedded references — BEFORE Creator View
PHASE 4 of 9   Creator View   -> 6 sections, home context comparison
PHASE 5 of 9   Engineer View  -> Quality bands via shared scoring
PHASE 6 of 9   Value Map      -> Pattern/knowledge/content/anti-pattern candidates
PHASE 6b of 9  Coverage Audit -> Unread sections, unfollowed references
PHASE 6c of 9  Tag Suggestion -> Per _shared/TAG_SUGGESTION.md
SELF-AUDIT + ROUTING
```

**v2.0 phase renumber (BREAKING):** Per Cat 2-E + Pattern 10 combined fix:

- Phase 2 (Dimension Wave) → Phase 3 (closes Cat 2-E gap)
- Phase 2b (Deep Read) → Phase 2 (promoted since documents have fewer discovery
  phases than repos)
- Phase 4b (Content Eval) → Phase 3.5 (matches execution order)
- Phase 4 (Creator View) stays at Phase 4

State files with old phase labels auto-migrate on resume through v2.2 transition
window.

Phase markers: `========== PHASE N of M: [NAME] ==========`

---

## Quick Scan (Phase 0 of M)

Read the first page (PDF) or first 100 lines (text/markdown). For URLs, fetch
and read the first screenful. Classify the document type and produce a
lightweight assessment.

**Lightweight creator lens (MUST):** Write 2-3 sentences — "This document
appears to cover/argue/teach X." Enough to judge Standard/Deep worth.

**Gate:** Quick Scan is a **preview — not a peer user tier**. Standard produces
the full artifact set needed for `/synthesize`. All `--depth` flags bypass.

**source_tier:** Documents span `T1`-`T3`. Default `T2`; academic papers `T1`,
anonymous gists `T3`.

**Done when:** analysis.json (Quick tier) exists AND creator-lens teaser
written.

---

## Content Load (Phase 1 of 9)

- **PDF:** Read tool with `pages` parameter. >20 pages → batch. Note total.
- **Local files:** Read tool directly.
- **Gist URLs:** WebFetch raw content.
- **arxiv URLs:** WebFetch abstract page; for PDF, note URL + Read tool.
- **Article URLs:** WebFetch page content.

**Scope-explosion soft prompt:** PDF with **>100 pages** → prompt:
`"Document is N pages. Analyze all / first 50 pages / table of contents only / custom?"`
User decides; never hard-block.

**Done when:** full text loaded into working memory AND page/line count recorded
in state.

---

## Deep Read (Phase 2 of 9 — MUST for Standard/Deep)

Identify and catalog:

- Internal references and citations
- Linked external resources (papers, repos, tools, datasets)
- Methodology descriptions worth extracting
- Diagrams or tables with condensed knowledge

**Output:** `deep-read.md` listing what was found and what knowledge it
contains.

**Done when:** deep-read.md exists AND references cataloged for Phase 3.5.

---

## Dimension Wave (Phase 3 of 9)

Score the document across 6 dimensions (0-100, band system):

| Dimension      | What It Measures                              |
| -------------- | --------------------------------------------- |
| Content Depth  | How thoroughly topics are covered             |
| Methodology    | Rigor of reasoning, evidence quality          |
| Actionability  | How directly applicable the ideas are         |
| Novelty        | Original insights vs rehashed knowledge       |
| Clarity        | Writing quality, organization, accessibility  |
| Source Quality | Author credibility, citation quality, recency |

**Done when:** all 6 dimension scores written to findings.jsonl.

---

## Content Evaluation (Phase 3.5 of 9 — MUST for Standard/Deep)

> **Phase renumbered from 4b to 3.5 in v2.0** — runs BEFORE Creator View and
> feeds into it.

Evaluate embedded references for relevance to home context. For each reference:
category, name, URL, relevance (high/medium/low/none), applicability,
home_connection.

**Done when:** content-eval.jsonl exists AND every reference has a relevance
rating AND feeds Creator View §2.

---

## Creator View (Phase 4 of 9 — MUST for Standard/Deep)

Same 6 sections as repo-analysis. Written in conversational prose.

1. **What This Document Understands (+ Blindspots)**
2. **What's Relevant To Your Work**
3. **Where Your Approach Differs**
4. **The Challenge**
5. **Knowledge Candidates**
6. **What's Worth Avoiding**

Load home context before writing. Reference specific content from Deep Read
(Phase 2) and Content Eval (Phase 3.5).

**Done when:** creator-view.md exists AND all 6 sections written AND
home-context claims reference actual files/projects.

---

## Engineer View (Phase 5 of 9)

Quality bands using shared scoring. 6 dimensions from Phase 3 produce summary
bands. Absence pattern classification where applicable.

**Done when:** summary.md contains all 6 bands.

---

## Value Map (Phase 6 of 9)

4 candidate types: pattern, knowledge, content, anti-pattern. Same ranking
fields (novelty, effort, relevance).

**Promotion rules (MUST):**

- Content Eval high-relevance references → content candidates.
- Creator View §6 actionable warnings → anti-pattern candidates.

Write value-map.json. Update `.research/extraction-journal.jsonl`.

**Done when:** value-map.json exists AND promotion rules applied.

---

## Coverage Audit (Phase 6b of 9 — MUST for Standard/Deep)

Scan for unread sections, unfollowed references, unexplored citations.
Interactive prompt: Analyze all / Select / Skip. Record in
`coverage-audit.jsonl`.

**Done when:** every item has `user_decision` (analyze/skip) or
`status: analyzed`.

---

## Tag Suggestion (Phase 6c of 9 — MUST for Standard/Deep)

Follow the canonical protocol in
[`.claude/skills/_shared/TAG_SUGGESTION.md`](../_shared/TAG_SUGGESTION.md). Per
CONVENTIONS §14: at least 3 semantic tags per entry, 8 categories, no upper
bound.

**Signal sources for document-analysis**: `creator-view.md`, entry `notes`,
`engineer-view.md`, cited references.

**Done when:** user-approved tags written to `analysis.json.tags` AND each
`extraction-journal.jsonl` row.

---

## Delegation & Defaults

| Gate                             | Default                                |
| -------------------------------- | -------------------------------------- |
| `--depth` unspecified            | `standard`                             |
| Quick → Standard gate unanswered | `proceed to Standard`                  |
| Scope-explosion (>100 pages)     | `first 50 pages`                       |
| Coverage Audit unanswered        | `skip all` (logged)                    |
| Tag Suggestion unanswered        | **never auto-approve** — block         |
| Routing menu unanswered          | `7. Done` (cleanup + invocation track) |
| Prior Feedback Replay (CONV §18) | `continue unchanged` (logged as shown) |

Tag Suggestion auto-approve is forbidden (CONVENTIONS §14.6).

---

## Guard Rails (top 5)

1. **PDF page cap guard** — >100 pages → scope-explosion soft prompt.
2. **PDF read fallback** — Windows pdftoppm failure → pdfjs-dist path.
3. **URL reachability** — WebFetch failures → retry once, then report.
4. **Schema validation** — analysis.json MUST validate before write.
5. **Write-rejection bypass** — hook-rejected prose → retry via Bash/Python,
   never silently skip.

> Full guard catalog — REFERENCE §9.

---

## Self-Audit (MUST — penultimate phase)

Per CONVENTIONS §8 plus domain checks:

1. **Artifact presence** — all MUST files exist (analysis.json, value-map.json,
   creator-view.md, summary.md, deep-read.md, content-eval.jsonl,
   coverage-audit.jsonl, extraction-journal entries)
2. **Schema contract** — analysis.json validates
3. **Completeness** — all phases that ran produced output
4. **Tags populated** — `analysis.json.tags` non-empty (user-approved)
5. **Coverage decisions** — every item has `user_decision`
6. **Phase ordering** — state file shows `phase-2-deep-read` before
   `phase-3-dimension-wave`, `phase-3.5-content-eval` before
   `phase-4-creator-view`, `phase-6c-tags` before `self-audit`
7. **Prior feedback replay** — `prior_feedback_shown: true` if prior state
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

State file: `.claude/state/document-analysis.<slug>.state.json`.

Update after every phase. On re-invocation with same input: offer Resume /
Re-run / Compare. State file stores `process_feedback` (nullable) from retro.

---

## Integration

- **Siblings:** `/repo-analysis`, `/website-analysis`, `/media-analysis`
- **Router:** `/analyze` (auto-detects document sources)
- **Companion:** `/synthesize` (cross-source, requires 3+ sources)
- **Consumers:** `/deep-plan` (as research context), JASON-OS
- **Cross-skill contract:** MUST preserve `last_synthesized_at` field on
  `analysis.json` when writing — this field is set by `/synthesize` Phase 5 and
  must not be dropped by handler re-runs (v2.0 contract, Session #284).
- **Shared artifacts:** `.research/extraction-journal.jsonl`,
  `.research/EXTRACTIONS.md`, `.research/reading-chain.jsonl`

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
  "skill":"document-analysis","type":"skill","success":true,
  "schema_version":1,"completeness":"stub",
  "origin":{"type":"manual"},
  "context":{"target":"DOC_SLUG","mode":"document","depth":"DEPTH",
             "score":SCORE,"decisions":DECISION_COUNT,
             "candidates":CANDIDATE_COUNT}
}'
```

---

## Version History

| Version | Date       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.0     | 2026-04-15 | Skill-audit batch 2026-04-15-analysis-quartet Wave 2. **Breaking:** phase renumber — Phase 2 (Dimension Wave) → Phase 3, Phase 2b (Deep Read) → Phase 2, Phase 4b (Content Eval) → Phase 3.5 (Cat 2-E + Pattern 10 combined). Structural: /analyze router ack, Warm-up, Routing Guide, NEW Integration section, NEW Retro section, NEW invocation tracking, Delegation & Defaults, consolidated Guard Rails top-5, PDF scope-explosion soft prompt (>100 pages), Done-when gates, PHASE N of M, Tag Suggestion → \_shared ref, Prior Feedback Replay per CONVENTIONS §18, output table. T28 tagline removed from user-visible description (preserved in v1.0 history below). |
| 1.1     | 2026-04-09 | PDF fallback for Windows, add summary.md + deep-read.md + content-eval.jsonl + coverage-audit.jsonl to output list (Session #270 E2E test)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.0     | 2026-04-08 | Initial creation (T28 CAS, Session #269)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
