# T29 Step 10.5 — Per-Source Audit Spec

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Created:** 2026-04-13
**Status:** ACTIVE
**Purpose:** Shared spec for parallel auditor agents. Each agent audits ONE source and writes `<slug>.json` to this directory.
<!-- prettier-ignore-end -->

---

## Inputs each agent receives

- `slug` — subdirectory name under `.research/analysis/<slug>/`
- This spec file — check criteria + output format

## Per-source checks (8 categories)

### 1. Schema (automated)

Run: `node scripts/cas/self-audit.js --slug=<slug>` from project root. Capture
exit code + full stdout. Parse:

- Exit 0 = overall PASS, exit 1 = overall FAIL
- Collect PASS / WARN / FAIL lines verbatim

### 2. MUST artifacts (§13.1)

Verify presence + non-empty:

- All depths: `analysis.json`
- Standard/Deep only: `value-map.json`, `creator-view.md`
- Extraction journal entries (check §6 below)

### 3. SHOULD artifacts (§13.2) — Standard/Deep only

Warn if missing or empty:

- `findings.jsonl`, `summary.md`, `deep-read.md`, `content-eval.jsonl`,
  `coverage-audit.jsonl`

### 4. Handler-specific (§13.3)

Determined by `source_type` in analysis.json:

- `repo` → `repomix-output.txt` SHOULD exist
- `website` → `meta.json` SHOULD exist
- `media` → `transcript.md` MUST + `transcript_source` MUST in analysis.json
  (values: `captions` | `whisper` | `manual`)
- `document` → no additional required files

### 5. Content quality (manual review)

**5a. Creator View cites specific items (NOT category-level only)**

Open `creator-view.md`. Look for references to specific `deep-read.md` items
(artifact names, file paths) or `content-eval.jsonl` entries (eval IDs,
reference names). PASS if at least 2 specific citations across the 6 sections.
FAIL if Creator View only makes category-level observations ("the README is
thorough", "tests are good") without naming specific artifacts or references.

**5b. Conversational prose**

Creator View must read like prose, not a compliance report. Heuristics:

- FAIL: heavy bullet-list sections, "PASS/FAIL" banner text, repeated heading
  scaffolding per section, auto-generated tone
- PASS: paragraphs with connective flow, first-person observations or analyst
  voice, insights that build on prior sections

**5c. Home-repo references verified (Section 2)**

Find Creator View Section 2 (typically "Home Repo Fit" or similar). Identify any
references to specific SoNash files/scripts/features. For each one, verify
against filesystem (use Glob/Grep). PASS if all references resolve. FAIL if any
reference points to a non-existent path. WARN if Section 2 has no home-repo
references (may be acceptable for some source types).

### 6. Extraction completeness (THE CRITICAL CHECK)

**6a. Journal count vs value-map candidate count**

- Read `value-map.json`. Count entries in `candidates` array (for depth ≠
  quick).
- Count entries in `.research/extraction-journal.jsonl` where `source` matches
  this source (exact OR slugified match — see `slugify` in
  `scripts/lib/security-helpers.js`).
- PASS if journal_count ≥ value_map_candidate_count (excluding any candidates
  explicitly marked "skipped" / "rejected" dispositions in value-map).
- FAIL if journal_count < value_map_candidate_count OR journal_count == 0 when
  value-map has candidates.

**6b. EXTRACTIONS.md section exists**

- Read `.research/EXTRACTIONS.md`. Search for heading matching the source name
  OR slug.
- PASS if a section exists. FAIL if no section.

**6c. Per-candidate schema (sample 3 entries)**

Sample up to 3 journal entries for this source. Each MUST have:

- `schema_version`, `source_type`, `source`, `candidate`, `type`, `decision`,
  `decision_date`, `novelty`, `effort`, `relevance`, `tags`

Report any entries missing required fields.

### 7. Cross-file consistency

**7a. research-index.jsonl entry matches analysis.json depth**

- Read `.research/research-index.jsonl`. Find entry for this slug.
- Compare `depth` field to analysis.json `depth`. PASS if match, FAIL if
  mismatch (silent-drift bug from Session #273).

**7b. Tag consistency**

- Cross-reference `semantic_tags` in analysis.json vs `tags` array in
  value-map.json candidates vs `tags` in journal entries for this source.
- WARN (not FAIL) if tag sets differ significantly — this is a signal, not a
  hard gate.

**7c. last_synthesized_at field**

- Check analysis.json for `last_synthesized_at`. PASS if null (not synthesized
  yet) or valid ISO date.

### 8. Re-analysis signals

- Check for `trends.jsonl` in `.research/analysis/<slug>/`. If present, PASS
  (prior analysis exists). If absent, NOTE (informational, not a fail — most
  sources will not have this).

---

## Output format — `<slug>.json`

Write to `.planning/synthesis-consolidation/audit-step-10.5/<slug>.json`:

```json
{
  "slug": "<slug>",
  "source": "<from analysis.json>",
  "source_type": "<repo|website|document|media>",
  "depth": "<quick|standard|deep>",
  "audit_date": "2026-04-13",
  "overall": "PASS|FAIL",
  "self_audit_exit_code": 0,
  "checks": {
    "1_schema": { "verdict": "PASS|FAIL", "pass": [], "warn": [], "fail": [] },
    "2_must_artifacts": {
      "verdict": "PASS|FAIL",
      "missing": [],
      "empty": []
    },
    "3_should_artifacts": {
      "verdict": "PASS|WARN",
      "missing": [],
      "empty": []
    },
    "4_handler_specific": { "verdict": "PASS|FAIL|N/A", "issues": [] },
    "5_content_quality": {
      "verdict": "PASS|FAIL|WARN",
      "5a_specific_citations": "PASS|FAIL",
      "5a_notes": "<brief evidence>",
      "5b_prose_style": "PASS|FAIL",
      "5b_notes": "<brief evidence>",
      "5c_home_repo_refs": "PASS|FAIL|WARN",
      "5c_notes": "<brief evidence + broken refs>"
    },
    "6_extractions": {
      "verdict": "PASS|FAIL",
      "6a_journal_count": 0,
      "6a_value_map_count": 0,
      "6a_verdict": "PASS|FAIL",
      "6b_extractions_md_section": "PASS|FAIL",
      "6c_per_candidate_schema": "PASS|FAIL",
      "6c_missing_fields": []
    },
    "7_cross_file": {
      "verdict": "PASS|FAIL|WARN",
      "7a_index_depth_match": "PASS|FAIL",
      "7b_tag_consistency": "PASS|WARN",
      "7c_last_synthesized_at": "PASS|FAIL"
    },
    "8_reanalysis": {
      "verdict": "NOTE",
      "trends_jsonl_present": false
    }
  },
  "failure_classes": [
    "metadata_patch | missing_journal_entries | missing_artifacts | content_deficiency | schema_drift"
  ],
  "proposed_fixes": ["<category>: <specific action>"]
}
```

**Failure classes** (for aggregation into `_audit-fixes.md`):

- `metadata_patch` — e.g., depth mismatch, field rename
- `missing_journal_entries` — backfill from value-map.json
- `missing_artifacts` — re-run or manually produce
- `content_deficiency` — re-write Creator View / fix citations
- `schema_drift` — migration script needed
- `none` — PASS across the board

---

## Discipline

- **Do NOT modify files.** Audit only. Write ONLY your `<slug>.json` output.
- **Do NOT run `/analyze` or re-dispatch any skill.** You are read-only.
- **Report empty-result agent returns as FAIL**, not silent skip (CLAUDE.md
  guardrail #15).
- **If a required file is unreadable**, record as FAIL with the error, do not
  abort the audit.
- Target output size: 1-3 KB per source. Use brief evidence strings, not full
  file quotes.
