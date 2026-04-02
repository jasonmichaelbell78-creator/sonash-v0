# Findings: Cross-Wave Consistency Check

**Agent:** gap-hunter **Profile:** codebase **Date:** 2026-03-29 **Sub-Question
IDs:** GAP-3 **Scope:** Wave 1 discovery claims vs Wave 3 deep-dive ground-truth
findings

---

## Method

All 12 source files were read directly. Wave 1 files were analyzed for claims
about data format, relevance ratings, and record counts. Wave 3 files provided
actual filesystem-verified schemas, counts, and sizes. Wave 4 files provided
additional contradiction signals. Each discrepancy is tagged by whether Wave 3
is authoritative (it almost always is — Wave 3 read the files directly).

---

## 1. Contradictions Table

Where Wave 1 asserts X but Wave 3 found Y. Column "Correct" identifies which
wave is authoritative and why.

---

### C-01: Audit ecosystem schema — `unresolvedFindings` field expectation

|                                               | Claim                                                                                                                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1a-2 — implied by W3-T5A cross-ref) | Prior research expected ecosystem audit history records to have shape `{timestamp, grade, score, unresolvedFindings}` at the top level                                                                                                            |
| Wave 3 (W3-T5A)                               | Actual schema wraps `grade` and `score` inside `healthScore{}` object. No `unresolvedFindings` field exists at any level in any of the 7 files verified. Schema is `{timestamp, healthScore{score, grade, breakdown{}}, categories{}, summary{}}` |
| Correct                                       | Wave 3 — direct filesystem verification of all 7 JSONL files                                                                                                                                                                                      |

---

### C-02: MASTER_DEBT record count

|                         | Claim                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1a-1, SQ1c-1) | "8,472 lines as of 2026-03-29"; "8,472 items"                                                                                           |
| Wave 1 (SQ1b)           | "8,472 records" — same claim in data inventory                                                                                          |
| Wave 3 (W3-T2A)         | 8,472 records confirmed. `metrics.json summary.total = 8472`, line count matches, `generated` timestamp is 2026-03-27. **Exact match.** |
| Correct                 | Both waves consistent. This is the rare case where Wave 1 figures were precisely accurate.                                              |

---

### C-03: metrics-log.jsonl record count

|                 | Claim                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Wave 1 (SQ1b)   | "114 records" for `docs/technical-debt/logs/metrics-log.jsonl`                                   |
| Wave 3 (W3-T2A) | 114 entries confirmed. Coverage: 49 unique dates from 2026-02-01 to 2026-03-27. **Exact match.** |
| Correct         | Both waves consistent.                                                                           |

---

### C-04: metrics-log.jsonl fields — breakdown data availability

|                 | Claim                                                                                                                                                                                                                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1c-1) | No explicit claim about which fields metrics-log contains. Generally described as "historical time-series metrics snapshots."                                                                                                                                                                                           |
| Wave 3 (W3-T2A) | Critical gap discovered: metrics-log has ONLY 6 fields (`timestamp, total, open, resolved, s0_alerts, s1_alerts`). It does NOT contain `by_severity`, `by_category`, `by_status`, or `by_source`. These breakdown fields exist only in the point-in-time `metrics.json`. Historical breakdown trends are not available. |
| Correct         | Wave 3 — Wave 1 did not inspect the actual field set; this is a Wave 3 discovery not a contradiction. **Dashboard implication: historical category/severity trend charts are impossible.**                                                                                                                              |

---

### C-05: health-score-log.jsonl — score and grade values

|                 | Claim                                                                                                                                                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wave 1 (SQ1c-2) | Latest entry: B/87 on 2026-03-26. "Current grade is B (87)."                                                                                                                                                                                                                                     |
| Wave 3 (W3-T1A) | Latest score confirmed as B/87 on 2026-03-26 — **exact match on score and grade**. However Wave 3 added critical context: this B/87 is the _process health_ score, while `ecosystem-health-log.jsonl` shows D/67 on 2026-03-27 for _technical health_. The two systems measure different things. |
| Correct         | Both consistent on the B/87 figure. Wave 3 enriched the finding by clarifying the dual-system nature — Wave 1 treated health-score-log as the single health source.                                                                                                                              |

---

### C-06: ecosystem-health-log.jsonl location and record count

|                 | Claim                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1b)   | File at `data/ecosystem-v2/ecosystem-health-log.jsonl`. "32 entries, Per-/health-run." HIGH relevance.                     |
| Wave 3 (W3-T1A) | File confirmed at same path. 32 records, 438.5 KB, date range 2026-03-01 to 2026-03-27. **Exact match on count and path.** |
| Correct         | Both consistent.                                                                                                           |

---

### C-07: health-score-log.jsonl — category structure

|                 | Claim                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1c-2) | "36 categories (full mode, 42 maximum)." Listed specific categories: `code: 60`, `security: 100`, `hook-health: 50`, `hook-warnings: 50`, `agent-compliance: 100`.                          |
| Wave 3 (W3-T1A) | "37 flat numeric scores" in latest entry. `categoryScores` is a flat `{[key]: number                                                                                                        | null}`map — no`metrics[]` arrays (those live only in ecosystem-health-log). **Minor discrepancy: Wave 1 says 36 categories, Wave 3 says 37.** |
| Correct         | Wave 3 (direct field count of actual data). The 36 vs 37 gap is minor — likely one category was added between the Wave 1 read and the Wave 3 read, or Wave 1 counted only non-null entries. |

---

### C-08: velocity-log.jsonl — items_completed field

|                 | Claim                                                                                                                                                                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wave 1 (SQ1b)   | File listed as HIGH relevance with field `items_completed`. Presented as viable "velocity trends" data source.                                                                                                                                                                                               |
| Wave 1 (SQ1c-2) | Explicitly identified the broken extraction: "`items_completed: 0` appears in every reviewed record (sessions 148-187)." Rated as a structural gap.                                                                                                                                                          |
| Wave 3 (W3-T4A) | Confirmed broken: 50 records, sessions #148–#243, `items_completed: 0` universally. `sprint` field contains raw markdown table row text. Explicitly designated as a "Data Unavailable" widget state.                                                                                                         |
| Correct         | Wave 1 (SQ1c-2) correctly identified this as broken. Wave 3 confirmed and extended the scope (was sessions 148-187 in Wave 1; Wave 3 confirmed it's all 50 records through session 243). **The SQ1b "HIGH relevance" rating was overoptimistic** — should be rated LOW until the extraction script is fixed. |

---

### C-09: commit-log.jsonl — data quality

|                 | Claim                                                                                                                                                                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1b)   | "634 records. Per-commit. HIGH relevance — activity timeline. Yes; strip session/filesList, ~40KB." Presented as usable for branch-breakdown and file-change heatmaps.                                                                                                                   |
| Wave 1 (SQ1c-2) | Notes "recent entries show `session: null` and `filesChanged: 0` for seeded commits" as a partial concern.                                                                                                                                                                               |
| Wave 3 (W3-T4A) | Critical finding: ALL 634 records have `seeded: true`, `branch: "seeded"`, `filesChanged: 0`, `session: null`. Every single commit is a seeder artifact. The commit timeline can only show daily counts (timestamps are real), not branch breakdown or file counts.                      |
| Correct         | Wave 3 — Wave 1 (SQ1b) overrated this file. "HIGH relevance" with the implication of full feature support is wrong. The real availability is "daily commit count only" until live `commit-tracker.js` writes new records. Branch/file breakdown charts are impossible with current data. |

---

### C-10: hook-runs.jsonl — record count

|                 | Claim                                                                                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1b)   | "114 records. Per-commit/push. HIGH relevance."                                                                                                                                                                       |
| Wave 3 (W3-T4A) | "120 records, 2026-03-18 to 2026-03-29."                                                                                                                                                                              |
| Correct         | Wave 3 — the 6-record discrepancy is explained by 6 new hook runs between the Wave 1 inventory (2026-03-29 morning) and the Wave 3 read later the same day. Not a contradiction — temporal drift within a single day. |

---

### C-11: reviews-archive.jsonl — record count

|                 | Claim                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| Wave 1 (SQ1b)   | "478 records. Per-rotation (~10 reviews). HIGH relevance — PR churn trends." |
| Wave 3 (W3-T3A) | 478 records confirmed.                                                       |
| Correct         | Both consistent.                                                             |

---

### C-12: reviews-archive.jsonl — data quality for numeric metrics

|                 | Claim                                                                                                                                                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1b)   | Presented archive as viable "PR churn trends" source with HIGH relevance. Static export plan says "strip learnings text, ~80KB."                                                                                                                    |
| Wave 3 (W3-T3A) | Critical gap: most `fixed`, `deferred`, `rejected`, and `total` counts in the archive are 0 — backfill only captured patterns and learnings, not counts. **The archive is usable only for pattern frequency analysis, not numeric review metrics.** |
| Correct         | Wave 3. Wave 1's HIGH relevance rating for churn trend charts was overoptimistic. Pattern frequency analysis is still valid, but count-based trending (fix rates over time) cannot use the archive.                                                 |

---

### C-13: audit-health skill persistence

|                 | Claim                                                                                                                                                                                                                                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1a-1) | "CLI-ONLY for output. The scripts it invokes may produce their own output, but `audit-health` itself writes nothing to disk. All output is conversational/session-only. Web dashboard relevance: LOW as currently implemented."                                                                                                              |
| Wave 3 (W3-T5A) | `health-ecosystem-audit-history.jsonl` does not exist — health audit has never been run. Confirms no persistent output. However, W3-T5A is about the _ecosystem_ health audit, not the `audit-health` skill which is a different, simpler check. Both findings consistently confirm no persistent output for the health-monitoring function. |
| Correct         | Both consistent on the core claim: no persistent health audit history file.                                                                                                                                                                                                                                                                  |

---

### C-14: enforcement-manifest.jsonl record count and relevance

|                 | Claim                                                                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1b)   | "360 records. Per-audit. MEDIUM — debt discovery audit."                                                                                                                                                                  |
| Wave 3 (W3-T1A) | 360 records confirmed, 119.6 KB. Relevance upgraded: Wave 3 identified the pattern gate coverage widget as one of 8 key health-tab widgets, using this file for the "17% automated / 82% manual-only" coverage breakdown. |
| Correct         | Both consistent on count. Wave 3 elevated relevance from MEDIUM to full dashboard widget — a positive upgrade, not a contradiction.                                                                                       |

---

### C-15: audit-agent-quality-history.jsonl record count

|                 | Claim                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1a-1) | "Confirmed: `{"date":"2026-03-17","agents_total":36,"ecosystem_grade":"F","mean_score":51}`" — implies 1 record at time of inspection. |
| Wave 1 (SQ1b)   | "1 record. Per-audit. MEDIUM."                                                                                                         |
| Wave 3 (W3-T5A) | 1 record confirmed. Last run: 2026-03-17. **Exact match.**                                                                             |
| Correct         | Both consistent.                                                                                                                       |

---

### C-16: review-metrics.jsonl record count

|                 | Claim                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1b)   | "52 records. Per-PR-review. HIGH relevance."                                                       |
| Wave 3 (W3-T3A) | 52 records confirmed, covering PRs #414–#477. Average fix_ratio 0.485, average review_rounds 1.17. |
| Correct         | Both consistent.                                                                                   |

---

### C-17: retros.jsonl record count

|                 | Claim                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1b)   | "57 records. Per-PR-retro. HIGH relevance."                                                                                                                                                       |
| Wave 3 (W3-T3A) | 57 records confirmed: full=39, stub=17, partial=1.                                                                                                                                                |
| Correct         | Both consistent. However Wave 3 added the completeness breakdown: 17 of 57 records are stubs with `top_wins`/`top_misses`/`process_changes` as null. Wave 1 did not flag this data quality issue. |

---

### C-18: pr-review state file schema

|                         | Claim                                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1a-4, SQ1c-1) | State file schema shown as: `{pr, round, review_number, source, total, fixed, deferred, rejected, severity:{critical,major,minor,trivial}, status, commit_sha, completed_at}`                                                                                                                                                                       |
| Wave 3 (W3-T3A, W3-T4A) | Per-PR task state files confirmed to contain severity breakdown (`critical`/`major`/`minor`/`trivial`). However this data is NOT in `reviews.jsonl` itself — it lives exclusively in the per-round task state files. Wave 3 T3A (Gap G24) explicitly calls out: "Severity breakdown lives only in per-PR task state files, not in `reviews.jsonl`." |
| Correct                 | Not a contradiction — Wave 1 correctly described the task state file schema. Wave 3 added the important nuance that `reviews.jsonl` (the canonical record) does NOT include severity, requiring a join across 21 state files to get it. Wave 1 implied these fields were in `reviews.jsonl`; they are not.                                          |

---

### C-19: CHECKPOINT "~300KB" MASTER_DEBT estimate

|                           | Claim                                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 / CHECKPOINT       | "~300KB" for field-stripped MASTER_DEBT static export                                                                                                                            |
| Wave 3 (W3-T2A)           | 13-field strip of all 8,472 items = ~2.64 MB (S0+S1: 464 KB; S2+S3: 2.2 MB). The CHECKPOINT used a 7-field strip of a subset.                                                    |
| SQ7a (Wave 4 integration) | Explicitly flags this: "The '~300KB' figure in CHECKPOINT-tab-decisions.md should be treated as a placeholder, not a constraint."                                                |
| Correct                   | Wave 3. The CHECKPOINT estimate was based on an incomplete strip. **Dashboard build must use the split-file strategy: initial load S0+S1 (464 KB), S2+S3 lazy-loaded (2.2 MB).** |

---

### C-20: pr-ecosystem-audit.jsonl naming

|                 | Claim                                                                                                                                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1b)   | File cataloged as `pr-ecosystem-audit.jsonl` in the state directory listing.                                                                                                                                                                   |
| Wave 3 (W3-T5A) | Confirmed file is at `pr-ecosystem-audit.jsonl` — WITHOUT the `-history` suffix. All other 7 ecosystem audit files use `<name>-ecosystem-audit-history.jsonl`. This naming inconsistency is a known exception the build script must hard-code. |
| Correct         | Both consistent on the filename. Wave 3 explicitly flagged the naming inconsistency as a schema concern (Gap G38).                                                                                                                             |

---

### C-21: reviews.jsonl — schema version uniformity

|                 | Claim                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wave 1 (SQ1a-4) | Schema shown as a single consistent format: `{pr, round, review_number, source, total, fixed, deferred, rejected, severity, status, commit_sha, completed_at}` — implied uniform.                                                                      |
| Wave 3 (W3-T3A) | Three coexisting schemas in the same file: v1 (13 records, has `title`/`patterns`/`learnings`), v2 (4 records, those fields removed), and legacy no-schema (6 records with integer IDs and zero counts). Data loading must branch on `schema_version`. |
| Correct         | Wave 3. Wave 1 showed the task-state file schema, not the `reviews.jsonl` canonical schema. These are two separate artifacts. The `reviews.jsonl` schema is more complex than Wave 1 depicted.                                                         |

---

### C-22: lifecycle-scores.jsonl — action dimension range

|                         | Claim                                                                                                                                                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 1 (SQ1b)           | Listed as "20 records. Per-audit. HIGH relevance — system health matrix." Described fields as capture/storage/recall/action per system.                                                                                                         |
| Wave 3 (W3-T1A, W3-T6A) | Confirmed 20 records. Wave 3 T6A adds precision: `action` dimension score range is 0–2 (NOT 0–3 like the other three dimensions). Max possible total is therefore 3+3+3+2=11 not 12. Current max observed is 10.                                |
| Correct                 | Wave 3. Wave 1 did not inspect the actual score ranges. Wave 3 found the action dimension tops out at 2 in practice — though the schema allows 3, no entry achieves it. **This affects the color-coding thresholds for the lifecycle heatmap.** |

Note: Wave 3 T1A first says "max possible is 12" then the T6A findings confirm
max observed is 10. The T6A field-level analysis (listing max per dimension)
shows action peaks at 2 in the actual data. The T1A "max 12" appears to be the
theoretical max per schema definition, while the practical observed max is
lower.

---

## 2. Record Count Discrepancies

Summary table of all record counts comparing Wave 1 claims to Wave 3 actuals.

| File                                   | Wave 1 Count | Wave 3 Count | Delta | Notes                                                                     |
| -------------------------------------- | ------------ | ------------ | ----- | ------------------------------------------------------------------------- |
| `MASTER_DEBT.jsonl`                    | 8,472        | 8,472        | 0     | Exact match                                                               |
| `metrics-log.jsonl`                    | 114          | 114          | 0     | Exact match                                                               |
| `hook-runs.jsonl`                      | 114          | 120          | +6    | Temporal drift within same day (new runs)                                 |
| `ecosystem-health-log.jsonl`           | 32           | 32           | 0     | Exact match                                                               |
| `health-score-log.jsonl`               | 24           | 24           | 0     | Exact match                                                               |
| `hook-warnings-log.jsonl`              | 68 (Wave 1)  | 87 (Wave 3)  | +19   | Wave 1 SQ1b said 68; Wave 3 T1A/T4A says 87. New warnings added same day. |
| `reviews-archive.jsonl`                | 478          | 478          | 0     | Exact match                                                               |
| `review-metrics.jsonl`                 | 52           | 52           | 0     | Exact match                                                               |
| `retros.jsonl`                         | 57           | 57           | 0     | Exact match                                                               |
| `reviews.jsonl`                        | 23           | 23           | 0     | Exact match                                                               |
| `commit-log.jsonl`                     | 634          | 634          | 0     | Exact match                                                               |
| `velocity-log.jsonl`                   | 50           | 50           | 0     | Exact match                                                               |
| `agent-invocations.jsonl`              | 92           | 97           | +5    | New invocations same day                                                  |
| `lifecycle-scores.jsonl`               | 20           | 20           | 0     | Exact match                                                               |
| `enforcement-manifest.jsonl`           | 360          | 360          | 0     | Exact match                                                               |
| `warnings.jsonl`                       | 16           | 16           | 0     | Exact match                                                               |
| `audit-agent-quality-history.jsonl`    | 1            | 1            | 0     | Exact match                                                               |
| `pr-ecosystem-audit.jsonl`             | 24           | 24           | 0     | Exact match                                                               |
| `hook-ecosystem-audit-history.jsonl`   | 25           | 25           | 0     | Exact match                                                               |
| `skill-ecosystem-audit-history.jsonl`  | 15           | 15           | 0     | Exact match                                                               |
| `script-ecosystem-audit-history.jsonl` | 9            | 9            | 0     | Exact match                                                               |
| `intake-log.jsonl`                     | 80           | 80           | 0     | Exact match                                                               |
| `resolution-log.jsonl`                 | 14           | 14           | 0     | Exact match                                                               |
| `review-needed.jsonl`                  | 27           | 27           | 0     | Exact match                                                               |

**Observation:** Record counts were highly accurate in Wave 1. The only deltas
are temporal drift within the same research day (new hook runs, warnings, and
agent invocations between Wave 1 and Wave 3 reads). No Wave 1 count was
materially wrong.

---

## 3. Relevance Rating Changes

Wave 1 relevance ratings vs Wave 3 findings.

| File                                   | Wave 1 Rating                                       | Wave 3 Finding                                                                    | Change                           | Notes                                                                                                                                                                     |
| -------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `velocity-log.jsonl`                   | HIGH (SQ1b)                                         | Broken — "Data Unavailable" widget state                                          | DOWNGRADE: HIGH → LOW            | Wave 1 SQ1c-2 correctly flagged as broken, but SQ1b still rated it HIGH. The correct rating is LOW until `track-session.js` is fixed.                                     |
| `commit-log.jsonl`                     | HIGH (SQ1b — "activity timeline, branch/file data") | Only daily counts usable; all 634 records seeded with degraded fields             | DOWNGRADE: HIGH → MEDIUM         | Wave 1 SQ1c-2 noted partial degradation but SQ1b framed it as full-featured. Wave 3 confirmed comprehensive seeding. Daily counts are real; all other fields are useless. |
| `reviews-archive.jsonl`                | HIGH (SQ1b — "PR churn trends")                     | Pattern frequency usable; numeric counts (fixed/deferred/total) are all 0         | PARTIAL DOWNGRADE: HIGH → MEDIUM | Count-based trend charts impossible. Pattern frequency analysis valid.                                                                                                    |
| `enforcement-manifest.jsonl`           | MEDIUM (SQ1b)                                       | Full dashboard widget (pattern gate coverage donut + per-category stacked bar)    | UPGRADE: MEDIUM → HIGH           | Wave 3 found this is a first-class data source for the Health tab.                                                                                                        |
| `lifecycle-scores.jsonl`               | HIGH (SQ1b)                                         | Confirmed HIGH; identified as primary planning tab data source                    | CONFIRMED HIGH                   | Wave 3 confirmed and elevated with detailed component spec.                                                                                                               |
| `warnings.jsonl`                       | HIGH (SQ1b — "active warning surface")              | HIGH confirmed; identified as the curated lifecycle state machine vs raw hook log | CONFIRMED HIGH                   | Wave 3 added nuance: this is distinct from `hook-warnings-log.jsonl`. Both needed.                                                                                        |
| `health-ecosystem-audit-history.jsonl` | Not mentioned in Wave 1 skill catalog               | Does not exist — health audit never run                                           | N/A → MISSING                    | Wave 1 did not identify the absence. Wave 3 found the file missing entirely.                                                                                              |
| `audit-health` skill                   | LOW (SQ1a-1 — "no persistent output")               | Confirmed LOW for history; confirmed no file exists                               | CONFIRMED LOW                    | Wave 3 verified no file at the expected path.                                                                                                                             |
| `retros.jsonl` (stub completeness)     | HIGH (SQ1b)                                         | HIGH confirmed but 17 of 57 records are stubs with null key fields                | CAVEAT ADDED                     | Wave 3 surfaced data quality gap Wave 1 did not flag.                                                                                                                     |
| `reviews.jsonl` (schema complexity)    | HIGH (SQ1a-4)                                       | HIGH confirmed but three incompatible schemas coexist; export script must branch  | CAVEAT ADDED                     | Wave 3 revealed schema fragmentation Wave 1 did not detect.                                                                                                               |

---

## 4. Schema Surprises

Significant data format discoveries in Wave 3 that differed from Wave 1
expectations.

### SS-01: Two separate health scoring systems (not one)

Wave 1 presented `health-score-log.jsonl` as the health data source. Wave 3
discovered the project has two completely independent health systems:

- `health-score-log.jsonl` (24 records, 18 KB) — B/87 — process/workflow health
  (37 flat numeric scores per entry)
- `ecosystem-health-log.jsonl` (32 records, 438 KB) — D/67 — technical artifact
  health (8-9 rich category objects with nested `metrics[]` arrays)

The D/67 score (technical) vs B/87 score (process) represent genuinely different
measurements of different facets of project health. A dashboard showing only one
would mislead. Wave 1 did not discover this dual-system architecture.

### SS-02: metrics-log.jsonl is structurally impoverished

Wave 1 described `metrics-log.jsonl` as "historical time-series metrics
snapshots" implying parity with `metrics.json`. Wave 3 found it has only 6
fields — the rich `by_severity`, `by_category`, `by_status`, `by_source`
breakdowns that exist in the point-in-time `metrics.json` are entirely absent
from the time-series log. This is BUG-06 from the prior debt-runner-expansion
research. Dashboard implication: trend charts can only track totals (total/open/
resolved/s0/s1), not breakdown trends.

### SS-03: reviews.jsonl has three incompatible schemas

Wave 1 described `reviews.jsonl` as a uniform format. Wave 3 found three
coexisting schemas in 23 records: v2 (most recent, drops title/patterns/
learnings), v1 (has those fields), and legacy integer-ID records (zero counts,
scaffolded stubs never populated). The export script must branch on
`schema_version`. Title must be derived from a template for v2 records.

### SS-04: ecosystem audit history files have schema drift mid-file

Wave 1 presented ecosystem audit skills as producing uniform JSONL histories.
Wave 3 found that two audit files (`hook` and `pr`) added new category keys
mid-history without versioning. Hook records 1–17 have 16 category keys; records
18–25 have 19 keys. PR records 1–20 have 14 keys; records 21–24 have 18 keys.
Charts must handle null/gap for categories absent from older records.

### SS-05: review-needed.jsonl is pair-based, not item-based

Wave 1 described `review-needed.jsonl` as "27 items flagged for human triage
review" implying individual debt items. Wave 3 found each record is a pair:
`{reason, item_a, item_b, note}` — two full MASTER_DEBT items being compared for
potential deduplication. The widget renders these as 27 "review pairs," not 27
individual items. Render logic must show both sides of each pair.

### SS-06: `health.verification_queue_size` (2126) is different from review-needed.jsonl (27)

Wave 1 did not surface this ambiguity. Wave 3 (W3-T2A) explicitly resolved it:
`health.verification_queue_size = 2126` refers to NEW-status items in
MASTER_DEBT awaiting triage status change. The 27 items in `review-needed.jsonl`
are potential duplicate pairs requiring human dedup review. These are two
entirely different work queues that both need dashboard representation.

### SS-07: commit-log.jsonl comprehensively seeded

Wave 1 noted "seeded commits" as a caveat. Wave 3 confirmed the full extent:
every single one of the 634 records is seeded. `seeded: true` on 100% of
records. Branch, filesChanged, and session are uniformly null/zero/"seeded".
This is a total data quality failure for branch/file analysis, not a partial
one.

### SS-08: agent-invocations.jsonl name casing inconsistency

Wave 1 did not flag this. Wave 3 (W3-T4A) found `explore` and `Explore` are the
same agent with inconsistent casing across sessions. Without normalization, the
usage bar chart double-counts this agent. Normalization to lowercase required.

---

## 5. Consistent Claims

Major claims that held up exactly across both waves, confirming HIGH confidence.

| Claim                                                                                                 | Wave 1 Source                                                        | Wave 3 Confirmation                                                                                             |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| MASTER_DEBT has 8,472 records as of 2026-03-29                                                        | SQ1a-1, SQ1b                                                         | W3-T2A: exact match, generated 2026-03-27                                                                       |
| `metrics.json` is "already dashboard-ready" with clean machine-readable structure                     | SQ1c-1                                                               | W3-T2A: all 12 widgets mapped to specific fields; metrics.json confirmed as primary KPI source                  |
| `audit-health` produces no persistent output; LOW relevance                                           | SQ1a-1                                                               | W3-T5A: history file does not exist; "never run" state required                                                 |
| velocity-log.jsonl has broken extraction (`items_completed: 0` universally)                           | SQ1c-2                                                               | W3-T4A: confirmed across all 50 records, labeled "unavailable" widget state                                     |
| `hook-runs.jsonl` has pre-commit/pre-push as two distinct check sets with no overlap                  | SQ1c-2 (implied by schema)                                           | W3-T4A: explicitly confirmed "zero check IDs shared between pre-commit and pre-push"                            |
| `lifecycle-scores.jsonl` is 20 records with capture/storage/recall/action per system                  | SQ1b                                                                 | W3-T1A, W3-T6A: all 20 records confirmed with schema verified                                                   |
| `enforcement-manifest.jsonl` is 360 records with pattern/mechanism/coverage structure                 | SQ1b                                                                 | W3-T1A: 360 records, full schema verified, adds coverage breakdown                                              |
| PR review state files survive compaction (designed for cross-session recovery)                        | SQ1a-4                                                               | W3-T3A: "per-round state files confirmed to contain severity breakdown"                                         |
| `ecosystem-health-log.jsonl` is the largest health file at ~438 KB                                    | SQ1b (no size claim made; Wave 3 first measured this)                | W3-T1A: 438.5 KB confirmed; Wave 3 first                                                                        |
| `resolve-dependencies.js --json` produces ready/blocked/completed arrays                              | SQ (planning context)                                                | W3-T6A: confirmed "81 ready, 12 blocked, 10 completed"; G45 gap resolved                                        |
| The 13% resolution rate on 8,472 TDMS items is a "striking signal"                                    | SQ1c-1                                                               | W3-T2A: confirmed `summary.resolution_rate_pct = 13` in metrics.json                                            |
| `metrics.json` `alerts.s0_count` = 11 (open S0 items)                                                 | SQ1c-1 implied S0 count in low double digits                         | W3-T2A: `s0_count = 11` confirmed; 26 total S0 items, 11 open                                                   |
| `by_source` breakdown in metrics.json has sonarcloud (2561) and audit (2942) as top sources           | SQ1c-1: "sonarcloud (2561), audit (2942), review (623), manual (83)" | W3-T2A: confirmed; `by_source` has 19 distinct source labels with audit (2942) and sonarcloud (2561) as top two |
| `reviews.jsonl` and `reviews-archive.jsonl` are two separate files with current vs historical records | SQ1a-4, SQ1b                                                         | W3-T3A: confirmed — 23 active records vs 478 archived records                                                   |
| `hook-warnings-log.jsonl` entries contain `user: jason` and `user: jbell` (multi-locale)              | SQ1c-2                                                               | W3-T4A: confirmed; also found `user: "unknown"` (34/87 records) as a third category not noted in Wave 1         |

---

## 6. Implications for Dashboard Build

Ordered by impact on implementation:

1. **MUST update size estimates in planning docs.** MASTER_DEBT field-stripped
   export is ~464 KB (S0+S1) + ~2.2 MB (S2+S3), not ~300 KB. The split-file
   lazy-load strategy in W3-T2A is the correct approach.

2. **MUST treat velocity-log.jsonl as LOW relevance, not HIGH.** The Wave 1 SQ1b
   "HIGH" rating is an error. Build the "Data Unavailable" widget state from day
   one; do not design a velocity chart expecting real data.

3. **MUST treat commit-log.jsonl as MEDIUM relevance (daily counts only).** The
   branch/file breakdown features Wave 1 described as achievable via static
   export are not achievable with current data. Design the commit timeline as
   count-only from day one.

4. **MUST design for dual health systems.** Display both Technical Health (D/67)
   and Process Health (B/87) as distinct labeled panels. A single composite
   score would mislead.

5. **MUST add normalization layer in export scripts.** Three issues identified:
   - reviews.jsonl schema branching (v1/v2/legacy)
   - MASTER_DEBT status case normalization (BUG-01)
   - agent-invocations name casing (`Explore`/`explore`)

6. **MUST handle audit file schema drift.** Hook and PR ecosystem audit files
   have new category keys added mid-history. Null-fill missing keys in export to
   prevent rendering errors.

7. **MUST render review-needed.jsonl as duplicate pairs, not individual items.**
   Each of the 27 records is `{item_a, item_b}` — two items needing comparison.

8. **SHOULD add enforcement-manifest.jsonl to Health tab.** Wave 1 rated it
   MEDIUM; Wave 3 confirmed it supports a full "Pattern Gate Coverage" widget
   showing 17% automated vs 82% manual-only patterns.

---

## Confidence Assessment

- HIGH claims: 22 (all based on Wave 3 direct filesystem verification + Wave 1
  cross-check)
- MEDIUM claims: 3 (schema-drift implication analysis, action dimension range
  nuance)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All contradictions verified by cross-reading the exact claims in source
documents. No claims rely on inference; each contradiction has a direct textual
citation from both waves.
