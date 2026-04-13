# T29 Step 10.5 — Full-Corpus Audit Report

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Created:** 2026-04-13
**Status:** ACTIVE — triage pending
**Scope:** 31 of 34 sources in `.research/analysis/` (excluded: `firecrawl` already audited Session #273; `surya` + `tesseract` quick-only preview per Step 10 skip decision)
**Methodology:** Parallel auditor agents (6 waves of 5 + 1), 8-category spec per `AUDIT_SPEC.md`. Per-source JSON in `.planning/synthesis-consolidation/audit-step-10.5/`.
<!-- prettier-ignore-end -->

## Headline

- **PASS: 11 / 31 (35%)**
- **FAIL: 20 / 31 (65%)**
- **Self-audit exit 0 but Step 10.5 FAIL: 8 sources** — i.e., `self-audit.js`
  passed them but extended checks caught drift the automated floor misses
- **Self-audit exit 1: 12 sources** — automated floor already catches these

## PASS / FAIL matrix

| Slug                                               | Type     | Depth    | Self-Audit | Step 10.5 | Failure Classes                                                           |
| -------------------------------------------------- | -------- | -------- | ---------- | --------- | ------------------------------------------------------------------------- |
| archivebox-archivebox                              | repo     | standard | exit 1     | FAIL      | schema_drift, metadata_patch                                              |
| aws-media-extraction                               | repo     | quick    | exit 0     | **PASS**  | —                                                                         |
| bedrock-summarize-audio-video-text                 | repo     | standard | exit 0     | **PASS**  | —                                                                         |
| bulk-transcribe-youtube-playlist                   | repo     | standard | exit 0     | FAIL      | missing_artifacts, metadata_patch                                         |
| codecrafters-io-build-your-own-x                   | repo     | standard | exit 0     | **PASS**  | —                                                                         |
| crawl4ai                                           | repo     | standard | exit 1     | FAIL      | schema_drift, missing_journal_entries                                     |
| docling                                            | repo     | standard | exit 1     | FAIL      | metadata_patch, schema_drift                                              |
| docs-composio-dev                                  | website  | standard | exit 1     | FAIL      | metadata_patch, schema_drift                                              |
| errors-and-vulnerabilities-in-ai-generated-code    | document | standard | exit 0     | FAIL      | metadata_patch                                                            |
| farzaa-gist-c35ac0cf                               | website  | standard | exit 1     | FAIL      | metadata_patch                                                            |
| hkuds-cli-anything                                 | repo     | standard | exit 0     | **PASS**  | —                                                                         |
| jina-ai-reader                                     | repo     | standard | exit 0     | FAIL      | metadata_patch                                                            |
| karpathy-autoresearch                              | repo     | standard | exit 0     | **PASS**  | —                                                                         |
| karpathy-gist-442a6bf                              | website  | standard | exit 1     | FAIL      | metadata_patch, missing_artifacts, content_deficiency                     |
| kieranklaassen-gist-4f2aba89                       | website  | standard | exit 1     | FAIL      | metadata_patch, content_deficiency, schema_drift                          |
| lux-video-downloader                               | repo     | standard | exit 1     | FAIL      | schema_drift, metadata_patch, missing_journal_entries                     |
| maharshi-pandya-gist-4aeccbe1                      | website  | standard | exit 1     | FAIL      | metadata_patch                                                            |
| MinerU                                             | repo     | standard | exit 0     | **PASS**  | —                                                                         |
| outline                                            | repo     | standard | exit 1     | FAIL      | schema_drift                                                              |
| public-apis_public-apis                            | repo     | standard | exit 0     | **PASS**  | —                                                                         |
| qmd                                                | repo     | standard | exit 0     | **PASS**  | —                                                                         |
| safishamsi-graphify                                | repo     | standard | exit 0     | FAIL      | missing_journal_entries                                                   |
| sidbharath-com-blog-claude-code-the-complete-guide | website  | standard | exit 0     | FAIL      | missing_journal_entries                                                   |
| teng-lin_notebooklm-py                             | repo     | standard | exit 0     | **PASS**  | —                                                                         |
| unstructured                                       | repo     | standard | exit 1     | FAIL      | metadata_patch, schema_drift                                              |
| vikparuchuri-marker                                | repo     | standard | exit 1     | FAIL      | schema_drift, metadata_patch, missing_journal_entries, content_deficiency |
| viktoraxelsen-memskill                             | repo     | standard | exit 0     | **PASS**  | —                                                                         |
| youtube-oszdfnqmgrw                                | media    | standard | exit 0     | **PASS**  | —                                                                         |
| youtube-qinuqwl4e-k                                | media    | standard | exit 0     | FAIL      | content_deficiency, metadata_patch                                        |
| youtube-transcript-api                             | repo     | standard | exit 0     | FAIL      | missing_journal_entries                                                   |
| zedeus-nitter                                      | repo     | standard | exit 1     | FAIL      | schema_drift, metadata_patch                                              |

## Failure-class distribution

| Class                   | Count | % of FAILs |
| ----------------------- | ----- | ---------- |
| metadata_patch          | 15    | 75%        |
| schema_drift            | 10    | 50%        |
| missing_journal_entries | 6     | 30%        |
| content_deficiency      | 4     | 20%        |
| missing_artifacts       | 2     | 10%        |

Most FAILs carry ≥2 classes. Totals sum >20 because a single source can belong
to multiple classes.

## Systemic patterns

### Pattern 1 — `analysis.json.candidates=[]` while value-map populated (8 sources)

**Affected:** docling, docs-composio-dev, farzaa-gist, karpathy-gist,
kieranklaassen-gist, maharshi-pandya-gist, unstructured, + outline (worse:
string-array instead of object-array)

**Root cause:** Analysis pipeline writes candidates to `value-map.json` but does
not mirror them back into `analysis.json.candidates[]`. `self-audit.js`
correctly flags this as "Standard/Deep analysis has 0 candidates."

**Scale:** This alone causes 8 of 12 `self-audit exit 1` failures.

### Pattern 2 — Missing `research-index.jsonl` entries (systemic ≥15 sources)

**Affected:** nearly every source outside the repo-analysis early-adopter set.
The index appears to track only repo-analysis sources — website/document/media
handlers are not registered.

**Root cause:** Handler skills don't all write to `research-index.jsonl` on
completion, OR the index only exists for a subset of the corpus by design.
Per-agent reports suggest this is systemic drift, not per-source bugs.

### Pattern 3 — `id` field not UUID (5 sources)

**Affected:** archivebox-archivebox, crawl4ai, lux-video-downloader,
vikparuchuri-marker, zedeus-nitter

**Root cause:** Some analyses wrote `id: "<slug>-YYYY-MM-DD"` instead of UUID.
Zod schema v3.0 requires UUID. These 5 predate or missed the UUID enforcement.

### Pattern 4 — Candidates missing `description` field (3 sources)

**Affected:** crawl4ai, vikparuchuri-marker, zedeus-nitter. Description lives in
value-map.json but not in analysis.json candidate objects.

### Pattern 5 — Retroactive placeholder artifacts (4 sources)

**Affected:** docs-composio-dev, farzaa-gist, karpathy-gist, kieranklaassen-gist

**Root cause:** `deep-read.md`, `content-eval.jsonl`, `coverage-audit.jsonl`
contain placeholder text acknowledging the original analysis didn't cover Deep
Read. Files exist to pass artifact-presence checks but aren't substantive.

### Pattern 6 — Legacy enum values (1 source)

**Affected:** outline — `scoring.personal_fit_band = "Good"` (v3.0 enum:
Critical/Needs Work/Healthy/Excellent); `scoring.classification = "extract"`
(v3.0 enum: active-sprint/park-for-later/evergreen/not-relevant). Pre-v3.0
vocabulary never migrated.

### Pattern 7 — Genuine candidate/journal count mismatches (6 sources)

Not mirror bugs — actual missing journal entries. value-map > journal, without
explicit skipped disposition:

- **crawl4ai**: journal=7, value-map=9 (missing 2)
- **lux-video-downloader**: journal=5, value-map=6 (missing 1)
- **safishamsi-graphify**: journal=9, value-map=10 (missing "ARCHITECTURE.md
  single-page format")
- **sidbharath…complete-guide**: journal=6, value-map=7 (missing
  "Feature-breadth coverage")
- **vikparuchuri-marker**: journal=5, value-map=8 (missing 3)
- **youtube-transcript-api**: journal=10, value-map=11 (missing "100% coverage +
  2-dep library packaging")

### Pattern 8 — Content quality deficiencies (4 sources)

- **karpathy-gist, kieranklaassen-gist** — Creator View can't cite specific
  deep-read/content-eval items because those files are placeholders (compounds
  Pattern 5)
- **vikparuchuri-marker** — Creator View Section 3 cites non-existent
  `CONVENTIONS.md` path
- **youtube-qinuqwl4e-k** — Creator View has zero citations to deep-read
  segments or content-eval entries (all refs point outward to SoNash artifacts)

## What `self-audit.js` missed

8 sources passed automated self-audit but FAIL Step 10.5. The gaps:

| Source                                | Passes automated, FAILs extended because…                       |
| ------------------------------------- | --------------------------------------------------------------- |
| bulk-transcribe-youtube-playlist      | Missing research-index entry (not checked by self-audit)        |
| errors-and-vulnerabilities-in-ai-code | Missing research-index entry                                    |
| jina-ai-reader                        | Missing research-index entry                                    |
| safishamsi-graphify                   | journal ≠ value-map count (self-audit only checks > 0)          |
| sidbharath…complete-guide             | journal ≠ value-map count                                       |
| youtube-qinuqwl4e-k                   | Creator View citation depth (not checked)                       |
| youtube-transcript-api                | journal ≠ value-map count                                       |
| bulk-transcribe-youtube-playlist      | Missing repomix-output.txt (listed WARN not FAIL in self-audit) |

Per user decision, these 8 check categories will be folded into `self-audit.js`
after the per-source fixes land.

## Per-source detail

Full per-check verdicts and proposed fixes live in:

`.planning/synthesis-consolidation/audit-step-10.5/<slug>.json`

`_audit-fixes.md` (sibling file) proposes categorized remediation.

## Done-when

1. `_audit-fixes.md` reviewed and remediation order approved by user
2. All approved fixes applied (commits may be per-category)
3. Re-audit sweep shows PASS for every source
4. Step 10.5 check categories 5/6b/6c/7a/7b/7c/8 folded into `self-audit.js`
5. Wave 5 (`/synthesize` full run) unblocked
