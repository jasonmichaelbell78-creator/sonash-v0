# Findings: Data Format Verification for Dev Dashboard

**Searcher:** deep-research-searcher (verification agent) **Profile:** codebase
**Date:** 2026-03-29 **Sub-Question IDs:** V2 (data format verification)

---

## Verification Results

### 1. `docs/technical-debt/metrics.json`

| Field         | Value                  |
| ------------- | ---------------------- |
| EXISTS        | YES                    |
| Record count  | 1 (single JSON object) |
| Schema match  | YES                    |
| Discrepancies | None                   |

**Confirmed top-level keys:** `generated`, `generated_date`, `summary`,
`by_status`, `by_severity`, `by_category`, `by_source`, `alerts`, `health`

All three claimed keys (`by_severity`, `by_category`, `by_source`) are present.
Generated timestamp: `2026-03-27T17:05:41.794Z`. Dashboard-ready structure
confirmed.

---

### 2. `docs/technical-debt/logs/metrics-log.jsonl`

| Field         | Value |
| ------------- | ----- |
| EXISTS        | YES   |
| Record count  | 114   |
| Schema match  | YES   |
| Discrepancies | None  |

**Confirmed 6-field compact schema:** `timestamp`, `total`, `open`, `resolved`,
`s0_alerts`, `s1_alerts`

Claim of "6-field compact schema" matches exactly. All 6 fields present on every
verified record.

---

### 3. `.claude/state/reviews.jsonl`

| Field         | Value     |
| ------------- | --------- |
| EXISTS        | YES       |
| Record count  | 23        |
| Schema match  | PARTIAL   |
| Discrepancies | See below |

**Schema versions found:** `1`, `2`, `MISSING` (i.e., no `schema_version` field)

The claim was "3 schema versions coexist." The actual state is: versions `1` and
`2` exist, plus records with no `schema_version` key at all (treated here as
version `MISSING`/implicit v0). Whether this counts as "3 versions" depends on
interpretation — two explicit numeric versions plus a pre-versioning legacy
format. The claim is directionally correct but imprecise: there are not three
distinct `schema_version` integers, there are two (1 and 2) plus unversioned
records.

---

### 4. `.claude/state/review-metrics.jsonl`

| Field         | Value |
| ------------- | ----- |
| EXISTS        | YES   |
| Record count  | 52    |
| Schema match  | YES   |
| Discrepancies | None  |

**Confirmed fields:** `pr`, `title`, `total_commits`, `fix_commits`,
`fix_ratio`, `review_rounds`, `timestamp`

Both claimed fields `fix_ratio` and `review_rounds` (research referred to it as
"rounds") are present. Note: the actual field name is `review_rounds`, not
`rounds`. This is a minor labeling difference in the research claim but the data
is correct.

---

### 5. `.claude/state/retros.jsonl`

| Field         | Value     |
| ------------- | --------- |
| EXISTS        | YES       |
| Record count  | 57        |
| Schema match  | PARTIAL   |
| Discrepancies | See below |

**Confirmed fields (typical):** `id`, `date`, `schema_version`, `completeness`,
`completeness_missing`, `origin`, `pr`, `top_wins`, `top_misses`,
`process_changes`, `score`, `metrics`

**`action_items` field:** Present on only 3 of 57 records. The claim of "action
items structure" is technically confirmed (the field exists and has structure
with `title`, `status`, `verify_cmd`, `implemented_in`, `severity` sub-fields),
but it is not a universal schema — it is a newer/optional field present in a
minority of records. Dashboard consumers must handle missing `action_items`
gracefully.

---

### 6. `.claude/state/hook-runs.jsonl`

| Field         | Value |
| ------------- | ----- |
| EXISTS        | YES   |
| Record count  | 122   |
| Schema match  | YES   |
| Discrepancies | None  |

**Confirmed `checks` array structure:** Array of objects each with `id`,
`status`, `duration_ms`. Top-level fields include `hook`, `timestamp`, `branch`,
`commit`, `total_checks`, `checks`, `total_duration_ms`, `outcome`,
`skipped_checks`, `warnings`, `errors`. The claim of "checks array with status
per check" is confirmed.

---

### 7. `.claude/state/agent-invocations.jsonl`

| Field         | Value |
| ------------- | ----- |
| EXISTS        | YES   |
| Record count  | 100   |
| Schema match  | YES   |
| Discrepancies | None  |

**Confirmed fields:** `agent`, `description`, `sessionId`, `timestamp`

Both claimed fields `agent` and `sessionId` are present. Schema is compact (4
fields).

---

### 8. `.claude/override-log.jsonl`

| Field         | Value                                 |
| ------------- | ------------------------------------- |
| EXISTS        | YES (at `.claude/override-log.jsonl`) |
| Record count  | 33                                    |
| Schema match  | YES                                   |
| Discrepancies | None — canonical path confirmed       |

**Canonical path confirmed:** `.claude/override-log.jsonl` exists and contains
data. `.claude/state/override-log.jsonl` does NOT exist. The research claim that
`.claude/override-log.jsonl` is the canonical path (not `.claude/state/`) is
correct.

**Confirmed fields:** `timestamp`, `check`, `reason`, `user`, `cwd`,
`git_branch`

---

### 9. `.claude/state/lifecycle-scores.jsonl`

| Field         | Value     |
| ------------- | --------- |
| EXISTS        | YES       |
| Record count  | 20        |
| Schema match  | PARTIAL   |
| Discrepancies | See below |

**Confirmed scoring dimensions:** `capture`, `storage`, `recall`, `action`,
`total`

The claim of "5-dimension scoring" requires a note: there are 4 named dimensions
(`capture`, `storage`, `recall`, `action`) plus a `total` aggregate. If `total`
counts as a fifth dimension, the claim is correct. If the claim meant 5
independent dimensions, it is imprecise — there are 4 independent dimensions
plus a derived total. Either way, the structure is confirmed present.

Additional non-score fields: `id`, `date`, `schema_version`, `completeness`,
`completeness_missing`, `system`, `category`, `files`, `gap`, `remediation`,
`wave_fixed`

---

### 10. `data/ecosystem-v2/enforcement-manifest.jsonl`

| Field         | Value |
| ------------- | ----- |
| EXISTS        | YES   |
| Record count  | 360   |
| Schema match  | YES   |
| Discrepancies | None  |

**Confirmed fields:** `pattern_id`, `pattern_name`, `priority`, `category`,
`mechanisms`, `coverage`, `status`, `last_verified`

The `mechanisms` field is a nested object with sub-fields: `regex`, `eslint`,
`semgrep`, `cross_doc`, `hooks`, `ai`, `manual` — this is the enforcement layer
info. Record count of 360 matches the "~360 records" claim exactly.

---

### 11. `.claude/state/forward-findings.jsonl`

| Field         | Value |
| ------------- | ----- |
| EXISTS        | YES   |
| Record count  | 4     |
| Schema match  | YES   |
| Discrepancies | None  |

**Confirmed fields:** `source_plan`, `finding_type`, `pattern`, `severity`,
`target_ecosystem`, `timestamp`

The claim of "cross-PLAN content (corrected label)" is confirmed. All 4 records
have `source_plan` values drawn from plan names (`review-lifecycle`,
`hook-system-overhaul`), and `target_ecosystem` indicating the destination
plan/system. This is clearly cross-plan forwarding data.

---

### 12. `.claude/state/pending-refinements.jsonl`

| Field         | Value |
| ------------- | ----- |
| EXISTS        | YES   |
| Record count  | 36    |
| Schema match  | YES   |
| Discrepancies | None  |

**Confirmed fields:** `id`, `route_type`, `pattern`, `generated_code`,
`confidence`, `reason`, `surfaced_count`, `created`

The `surfaced_count` field is present and confirmed. Value of `0` on the first
record indicates it has not yet been surfaced to the user.

---

### 13. `.claude/state/learning-routes.jsonl`

| Field         | Value |
| ------------- | ----- |
| EXISTS        | YES   |
| Record count  | 39    |
| Schema match  | YES   |
| Discrepancies | None  |

**Confirmed fields:** `id`, `timestamp`, `date`, `schema_version`, `learning`,
`route`, `scaffold`, `status`, `refined_at`, `classification`

The "routing disposition field" is confirmed as `route` (top-level, string value
such as `claude-md-annotation`). Additional routing context is nested in
`classification.action.type`. Both fields together constitute the routing
disposition.

---

### 14. `.research/research-index.jsonl`

| Field         | Value |
| ------------- | ----- |
| EXISTS        | YES   |
| Record count  | 4     |
| Schema match  | YES   |
| Discrepancies | None  |

**Confirmed fields per record:** `topicSlug`, `topic`, `depth`, `domain`,
`completedAt`, `claimCount`, `sourceCount`, `confidenceDistribution`,
`keywords`, `outputPath`, `status`

The `depth` field is present (values: `L1`, `L1`, `L3`, `L1`). The
`confidenceDistribution` field is present on all 4 records with `HIGH`,
`MEDIUM`, `LOW`, `UNVERIFIED` sub-fields. Claim of "4 entries with depth,
confidence fields" is exactly correct.

---

## Summary Table

| #   | File                                           | EXISTS | Records | Schema Match | Notes                                                         |
| --- | ---------------------------------------------- | ------ | ------- | ------------ | ------------------------------------------------------------- |
| 1   | `docs/technical-debt/metrics.json`             | YES    | 1 obj   | YES          | All 3 claimed keys confirmed                                  |
| 2   | `docs/technical-debt/logs/metrics-log.jsonl`   | YES    | 114     | YES          | Exactly 6 fields confirmed                                    |
| 3   | `.claude/state/reviews.jsonl`                  | YES    | 23      | PARTIAL      | Versions: 1, 2, plus unversioned (not 3 distinct integers)    |
| 4   | `.claude/state/review-metrics.jsonl`           | YES    | 52      | YES          | fix_ratio + review_rounds confirmed (not just "rounds")       |
| 5   | `.claude/state/retros.jsonl`                   | YES    | 57      | PARTIAL      | action_items present on only 3/57 records — optional field    |
| 6   | `.claude/state/hook-runs.jsonl`                | YES    | 122     | YES          | checks array with per-check status confirmed                  |
| 7   | `.claude/state/agent-invocations.jsonl`        | YES    | 100     | YES          | agent + sessionId confirmed                                   |
| 8   | `.claude/override-log.jsonl`                   | YES    | 33      | YES          | Canonical path confirmed, NOT in .claude/state/               |
| 9   | `.claude/state/lifecycle-scores.jsonl`         | YES    | 20      | PARTIAL      | 4 independent dims + total aggregate; "5-dim" claim imprecise |
| 10  | `data/ecosystem-v2/enforcement-manifest.jsonl` | YES    | 360     | YES          | mechanisms object confirms enforcement layer structure        |
| 11  | `.claude/state/forward-findings.jsonl`         | YES    | 4       | YES          | source_plan + target_ecosystem confirm cross-PLAN content     |
| 12  | `.claude/state/pending-refinements.jsonl`      | YES    | 36      | YES          | surfaced_count field confirmed                                |
| 13  | `.claude/state/learning-routes.jsonl`          | YES    | 39      | YES          | route field confirmed as routing disposition                  |
| 14  | `.research/research-index.jsonl`               | YES    | 4       | YES          | depth + confidenceDistribution confirmed on all 4 entries     |

**All 14 files exist. 10 full matches, 3 partial matches, 0 missing files.**

---

## Discrepancies Requiring Attention

**D1 — reviews.jsonl schema versions (file #3):** Research claimed "3 schema
versions coexist." Reality: schema_version values are `1` and `2` plus records
with no schema_version field (legacy/pre-versioning). This is 2 explicit
versions + 1 implicit legacy format. Dashboard code reading this file must
handle the case where `schema_version` is absent.

**D2 — retros.jsonl action_items (file #5):** Research implied `action_items` is
a standard schema field. Reality: it is an optional field present on only 3 of
57 records (~5%). Dashboard must not assume its presence. Null-guard required.

**D3 — lifecycle-scores.jsonl "5 dimensions" (file #9):** The file has 4
independently measured dimensions (`capture`, `storage`, `recall`, `action`)
plus a `total` aggregate. The "5-dimension" claim counts `total` as a dimension,
which is technically arguable. The structure is correct but the characterization
is slightly misleading for implementation purposes.

**D4 — review-metrics.jsonl field name (file #4):** Minor: the field is
`review_rounds` not `rounds`. Not a blocker but dashboard queries must use the
exact field name.

---

## Gaps

No files were missing. No files had fundamentally wrong schemas. All core
claimed fields were confirmed present.

One area not verified: whether all records in each file consistently carry the
claimed fields (only first records were sampled for most files). Edge cases with
schema drift within a file cannot be ruled out based on this spot-check.

---

## Serendipity

- `enforcement-manifest.jsonl` has exactly 360 records — the "~360" estimate in
  research was precise to the unit.
- `override-log.jsonl` includes a `cwd` field showing the machine path where the
  override was issued — useful for multi-machine audit scenarios not covered in
  the original research framing.
- `research-index.jsonl` has depth values of L1, L1, L3, L1 — the one L3 entry
  (`plan-orchestration`) indicates a deeper research pass was run for that
  topic, which may be relevant context for dashboard filtering or display.

---

## Confidence Assessment

- HIGH claims: 10 (all fully confirmed files)
- MEDIUM claims: 3 (partial matches with documented discrepancies)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH
