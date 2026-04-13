# T29 Step 10.5 — Remediation Proposals

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Created:** 2026-04-13
**Status:** ACTIVE — triage pending
**Companion:** `_audit-report.md` (findings), `.planning/synthesis-consolidation/audit-step-10.5/<slug>.json` (per-source detail)
<!-- prettier-ignore-end -->

This document proposes fixes categorized by failure class and scope. Each
category ends with a **decision required** block for user triage. No fixes are
applied until approval.

---

## Category A — `analysis.json.candidates` mirror bug (8 sources)

**Sources:** docling, docs-composio-dev, farzaa-gist-c35ac0cf,
karpathy-gist-442a6bf, kieranklaassen-gist-4f2aba89,
maharshi-pandya-gist-4aeccbe1, unstructured, outline (outline is worse — strings
instead of objects)

**Symptom:** `analysis.json.candidates = []` while `value-map.json` has the
candidates. Journal entries exist and match value-map. Self-audit FAILs because
`checkSchema` reads candidate count from `analysis.json`.

**Root-cause options:**

1. **Data bug** — pipeline should write candidates to both stores;
   `analysis.json` is canonically supposed to mirror them.
2. **Script bug** — `self-audit.js` should read candidate count from
   `value-map.json` for Standard/Deep (since that's the handler's actual
   output); `analysis.json` shouldn't have to duplicate.

**Proposed fix (Option 1 — data patch):** Write a one-shot Node script that for
each affected source: reads `value-map.json`, copies the candidates array into
`analysis.json.candidates`, preserves all other analysis.json fields, writes
atomically. ~10 lines of script, runs 8 times, idempotent.

**Proposed fix (Option 2 — script patch):** Modify `self-audit.js` to read
candidate count from `value-map.json` for Standard/Deep sources.
`analysis.json.candidates` then becomes optional.

**Decision required:** Option 1 (mirror the data) or Option 2 (remove the
requirement)? I'd recommend Option 1 — it keeps `analysis.json` as a canonical
single-file summary and matches what handlers like qmd/MinerU already do.

**outline sub-case:** `outline` has candidates as array of strings, not objects.
Needs object-form backfill from value-map.json regardless of Option 1/2.

---

## Category B — Missing `research-index.jsonl` entries (15+ sources)

**Sources:** archivebox-archivebox, bulk-transcribe-youtube-playlist, docling,
docs-composio-dev, errors-and-vulnerabilities-in-ai-generated-code,
farzaa-gist-c35ac0cf, jina-ai-reader, karpathy-gist-442a6bf,
kieranklaassen-gist-4f2aba89, lux-video-downloader,
maharshi-pandya-gist-4aeccbe1, unstructured, vikparuchuri-marker,
youtube-oszdfnqmgrw, youtube-qinuqwl4e-k, youtube-transcript-api,
zedeus-nitter, + others (most non-repo-analysis sources)

**Symptom:** `research-index.jsonl` appears to contain only repo-analysis
entries from early sessions. Most website/document/media sources plus many later
repo sources are absent. Silent-drift risk per Session #273.

**Root-cause:** Handler skills likely don't uniformly append to
`research-index.jsonl` on completion, OR the index was only populated by a
one-time script that wasn't re-run.

**Proposed fix:** Write a one-shot reconciliation script that:

1. Reads every `.research/analysis/<slug>/analysis.json`
2. For each, checks if an entry exists in `research-index.jsonl` matching `slug`
   OR `source`
3. If missing, appends a row with
   `{slug, source, source_type, depth, analyzed_at, output_dir, handler}`
4. Dedupes if any exist
5. Writes atomically

**Scope question:** Is `research-index.jsonl` meant to track every CAS analysis,
or only a curated subset (e.g., "research topics" vs per-source snapshots)?
Agent reports were split on this:

- youtube-oszdfn report: "file appears repo-focused... media handlers likely
  don't register there by design"
- youtube-transcript-api report: "contains research-topic entries only, no
  per-analysis slug rows"

**Decision required:** (a) reconcile full corpus into the index (backfill ~25
entries); (b) leave as-is and update the Step 10.5 check to treat absence as
PASS for non-repo handlers; (c) retire `research-index.jsonl` if it's dead
infrastructure.

---

## Category C — UUID id migration (5 sources)

**Sources:** archivebox-archivebox, crawl4ai, lux-video-downloader,
vikparuchuri-marker, zedeus-nitter

**Symptom:** `analysis.json.id = "<slug>-YYYY-MM-DD"` instead of UUID. Zod v3.0
schema requires UUID.

**Proposed fix:** One-shot script regenerates each affected analysis.json with a
new UUID v4 `id`, preserves all other fields including the existing date stamp
elsewhere, writes atomically. Journal entries may reference these IDs via
`source_analysis_id` — check and update if so.

**Decision required:** Approve UUID migration? Alternative: relax Zod to accept
slug-date IDs (not recommended — loses join key cleanliness).

---

## Category D — Candidate `description` field missing (3 sources)

**Sources:** crawl4ai, vikparuchuri-marker, zedeus-nitter

**Symptom:** `analysis.json.candidates[].description` missing. `value-map.json`
has it. Zod v3.0 requires it on `analysis.json`.

**Proposed fix:** Same reconciliation script as Category A — when copying
candidates from value-map to analysis.json, include `description`. Bundle fix
with Category A.

**Decision required:** Combine Category A + D into a single reconciliation pass?
Recommended.

---

## Category E — Genuine missing journal entries (6 sources, 9 candidates)

Real data gaps, not mirror bugs. value-map candidate exists without journal
entry, without explicit skipped/rejected disposition.

| Source                    | Missing candidates                                                            |
| ------------------------- | ----------------------------------------------------------------------------- |
| crawl4ai                  | Safe expression eval via AST; DUPLICATE_FILES_IN_REPO                         |
| lux-video-downloader      | Per-site CI isolation pattern                                                 |
| safishamsi-graphify       | ARCHITECTURE.md single-page format                                            |
| sidbharath…complete-guide | Feature-breadth coverage as completeness benchmark                            |
| vikparuchuri-marker       | Session-scoped test fixtures; GPU-enforced CI; CONTRIBUTOR_HOSTILE_GOVERNANCE |
| youtube-transcript-api    | 100% coverage + 2-dep library packaging                                       |

**Proposed fix (per candidate):** Two paths per candidate — user chooses:

- **Backfill** — append journal entry with appropriate decision
  (`defer`/`evergreen`/`park-for-later`), novelty/effort/relevance, tags aligned
  with source's existing entries
- **Prune** — remove from value-map.json if the candidate was intentionally
  dropped during analysis but never removed from the map

**Decision required:** Review the 9 candidates individually — backfill vs prune.
This is the ONE category that can't be bulk-automated; needs per- candidate
judgment. I can pull each candidate's value-map description to help you decide.

---

## Category F — Retroactive placeholder artifacts (4 sources)

**Sources:** docs-composio-dev, farzaa-gist-c35ac0cf, karpathy-gist-442a6bf,
kieranklaassen-gist-4f2aba89

**Symptom:** `deep-read.md` / `content-eval.jsonl` / `coverage-audit.jsonl`
contain placeholder text like "No internal artifacts cataloged during original
analysis." Files exist to pass presence checks but aren't substantive. This
cascades into content_deficiency (can't cite artifacts that aren't there).

**Proposed fix (3 options per source):**

1. **Re-run Standard analysis** — dispatch `/analyze` again with fresh Deep Read
   pass. Cost: ~1 skill run per source. Gain: real content.
2. **Leave placeholders + document** — add a header line to Creator View noting
   deep-read was skipped; remove the Step 10.5 citation requirement for these 4
   sources.
3. **Delete placeholder files** — convert these 4 from Standard to "Standard-
   lite" (analysis + value-map + creator-view only) and document the policy.

**Decision required:** Which of the 3 options? Can mix per-source if the value
of each varies.

---

## Category G — Legacy enum values (outline only)

**Source:** outline

**Symptom:** `scoring.personal_fit_band = "Good"` (should be Critical/Needs
Work/Healthy/Excellent); `scoring.classification = "extract"` (should be
active-sprint/park-for-later/evergreen/not-relevant). Pre-v3.0 vocabulary never
migrated.

**Proposed fix:** One-off patch — map `"Good"` → `"Healthy"` and `"extract"` →
`"park-for-later"` (or `"active-sprint"` per dualScoring signal). Also convert
string-array candidates to object-form (pick up from Category A script).

**Decision required:** Approve enum mapping? Specifically: does `"extract"`
correspond to `"park-for-later"` or `"active-sprint"` in v3.0?

---

## Category H — Creator View citation / broken-ref fixes (3 sources)

**Sources:**

- **vikparuchuri-marker** — Section 3 cites `CONVENTIONS.md` (no such path at
  repo root). Likely intended `.claude/skills/shared/CONVENTIONS.md` or
  `docs/agent_docs/CODE_PATTERNS.md`.
- **youtube-qinuqwl4e-k** — Creator View has zero citations to deep-read
  segments or content-eval entries; all refs point outward to SoNash.
- **karpathy-gist / kieranklaassen-gist** — depends on Category F outcome (can't
  cite artifacts that don't exist; if Category F Option 1 runs, these fix
  automatically).

**Proposed fix:** Per-source Creator View edit after Category F resolved. Small
targeted edits; don't need a full re-run.

**Decision required:** Approve targeted Creator View edits for
vikparuchuri-marker (broken ref) and youtube-qinuqwl4e-k (citation gap)?

---

## Category I — SHOULD artifacts / state files / tag drift (advisory, non-blocking)

Recurring WARN-level signals across the corpus:

- **`repomix-output.txt` missing** — majority of repo sources. SHOULD per §13.3,
  not MUST. Bulk-generate or accept absence?
- **State files missing** — `process_feedback` empty or state file absent.
  CONVENTIONS 16 WARN. Indicates Retro / Routing steps may have been skipped.
- **Tag set drift** — analysis.json top-level `semantic_tags` differ from
  candidate-level `tags` in value-map/journal. Often richer in journal
  (enrichment tags like `cas-relevant`, `jason-os-relevant`).

**Proposed fix:** Treat as **Phase 2** after primary fixes land. None of these
block Wave 5 by themselves.

**Decision required:** Defer Category I to Phase 2, or tackle together with
Categories A-H?

---

## Recommended remediation order

Proposed sequencing (each step can be a separate commit):

1. **Category A + D** — data mirror script. Copies candidates + descriptions
   from value-map into analysis.json for 8+3 sources (overlap). One script run.
   ~10 min.
2. **Category C** — UUID migration script for 5 sources. ~10 min.
3. **Category G** — outline enum patch. ~5 min.
4. **Category B** — research-index.jsonl decision + (if approved) backfill
   script. ~15 min.
5. **Category E** — per-candidate triage (9 candidates). User-in-the-loop.
   Variable.
6. **Category F** — placeholder artifact decision per-source (4 sources).
   User-in-the-loop. Variable.
7. **Category H** — Creator View targeted edits. ~15 min after F resolved.
8. **Re-audit sweep** — re-run Step 10.5 on all 31, verify PASS for all.
9. **Self-audit expansion** — fold Step 10.5 checks 5/6b/6c/7a/7b/7c/8 into
   `self-audit.js` (per-user decision earlier in session).
10. **Unblock Wave 5** — `/synthesize` full run.

## Next action

Decisions needed before remediation execution:

1. **A:** Option 1 (data mirror) or Option 2 (relax self-audit)?
2. **B:** Backfill index / leave it / retire it?
3. **C:** Approve UUID migration (or relax schema)?
4. **D:** Combine with A?
5. **E:** Review 9 candidates one-by-one (I can surface each)?
6. **F:** Re-run / document / delete — per-source?
7. **G:** Approve `"Good"→"Healthy"`, `"extract"→"park-for-later"` (or other)?
8. **H:** Approve targeted Creator View edits?
9. **I:** Phase 2 or integrate now?
