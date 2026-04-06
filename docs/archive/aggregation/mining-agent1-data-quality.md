# Mining Report: Review Data Quality

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-27
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Purpose

Data quality analysis of review JSONL vs markdown sources, identifying
completeness gaps and fidelity issues.

**Generated:** 2026-02-27 **Source files:** `.claude/state/reviews.jsonl`,
`docs/AI_REVIEW_LEARNINGS_LOG.md`, `docs/archive/REVIEWS_*.md`

---

## 1. JSONL Field Completeness

**Total entries:** 45 (18 review entries + 16 retrospective entries + 11
additional review entries = 45 lines)

Breakdown by entry type:

- **Review entries** (no `type` field or type != "retrospective"): 33
- **Retrospective entries** (`type: "retrospective"`): 12

### Review Entry Field Completeness (33 entries)

| Field       | Non-empty/Non-zero Count | Completeness % | Notes                                 |
| ----------- | ------------------------ | -------------- | ------------------------------------- |
| `id`        | 33                       | 100%           | All have numeric IDs                  |
| `date`      | 33                       | 100%           | All populated                         |
| `title`     | 33                       | 100%           | All populated                         |
| `source`    | 33                       | 100%           | All populated                         |
| `pr`        | 8                        | 24%            | 25 entries have `pr: null`            |
| `patterns`  | 5                        | 15%            | **28 entries have `patterns: []`**    |
| `fixed`     | 1                        | 3%             | **32 entries have `fixed: 0`**        |
| `deferred`  | 0                        | 0%             | **All 33 entries have `deferred: 0`** |
| `rejected`  | 0                        | 0%             | **All 33 entries have `rejected: 0`** |
| `critical`  | 0                        | 0%             | **All 33 have `critical: 0`**         |
| `major`     | 0                        | 0%             | **All 33 have `major: 0`**            |
| `minor`     | 0                        | 0%             | **All 33 have `minor: 0`**            |
| `trivial`   | 0                        | 0%             | **All 33 have `trivial: 0`**          |
| `total`     | 20                       | 61%            | 13 entries have `total: 0`            |
| `learnings` | 5                        | 15%            | **28 entries have `learnings: []`**   |

### Retrospective Entry Field Completeness (12 entries)

| Field                  | Non-empty/Non-zero Count | Completeness % |
| ---------------------- | ------------------------ | -------------- | ----------------------------- |
| `id`                   | 12                       | 100%           |
| `type`                 | 12                       | 100%           |
| `pr`                   | 12                       | 100%           |
| `date`                 | 12                       | 100%           |
| `rounds`               | 11                       | 92%            | retro-390 has `rounds: 0`     |
| `totalItems`           | 11                       | 92%            | retro-390 has `totalItems: 0` |
| `fixed`                | 11                       | 92%            |                               |
| `rejected`             | 10                       | 83%            |                               |
| `deferred`             | 5                        | 42%            |                               |
| `churnChains`          | 4                        | 33%            |                               |
| `automationCandidates` | 6                        | 50%            |                               |
| `skillsToUpdate`       | 2                        | 17%            |                               |
| `processImprovements`  | 8                        | 67%            |                               |
| `learnings`            | 6                        | 50%            |                               |

### Critical Quality Issues

1. **Severity fields are universally zero** across all 33 review entries:
   `critical`, `major`, `minor`, `trivial` are ALL zero in every single entry.
   This entire dimension of data is unpopulated.
2. **Fix/defer/reject counts almost entirely zero** in review entries: `fixed`
   has exactly 1 non-zero entry (id 401, `fixed: 2`), `deferred` and `rejected`
   are zero across all 33 entries. The markdown log shows detailed fix/reject
   counts for every review, so this data exists but was never synced to JSONL.
3. **85% of entries have empty patterns and learnings arrays**, making the JSONL
   nearly useless for pattern mining.
4. **Duplicate ID detected:** Two entries share `id: 367` (one dated 2026-02-22
   "PR #384 R2", another dated 2026-02-25 "PR #389 R1"). Similarly, `id: 368`
   appears twice (2026-02-22 and 2026-02-25).

---

## 2. Source Distribution

| Source                               | Count | % of Review Entries |
| ------------------------------------ | ----- | ------------------- |
| `manual`                             | 29    | 88%                 |
| `sonarcloud+qodo`                    | 2     | 6%                  |
| (retrospectives — no `source` field) | 12    | N/A                 |

**Finding:** 88% of review entries are tagged `source: "manual"`. The markdown
log describes multi-source reviews (SonarCloud + Qodo + Gemini + CI), but the
JSONL collapses everything to "manual". Only 2 entries from the earlier period
retain the `sonarcloud+qodo` source tag. Source attribution is essentially lost
in JSONL.

---

## 3. Temporal Density

### Date Range

- **Earliest review entry:** 2026-02-20 (id 364)
- **Latest review entry:** 2026-02-27 (id 406)
- **Earliest retrospective:** 2026-02-16 (retro-367)
- **Latest retrospective:** 2026-02-27 (retro-396)

### Reviews by Date

| Date       | Review Count | Retro Count | Total |
| ---------- | ------------ | ----------- | ----- |
| 2026-02-16 | 0            | 3           | 3     |
| 2026-02-17 | 0            | 3           | 3     |
| 2026-02-18 | 0            | 1           | 1     |
| 2026-02-20 | 2            | 2           | 4     |
| 2026-02-21 | 1            | 1           | 2     |
| 2026-02-22 | 3            | 0           | 3     |
| 2026-02-25 | 2            | 2           | 4     |
| 2026-02-26 | 17           | 2           | 19    |
| 2026-02-27 | 8            | 1           | 9     |

**Finding:** The JSONL only covers 10 days (Feb 16-27). The markdown archive
covers reviews #1-406 spanning 2026-01-01 to 2026-02-27 (~58 days). The JSONL
contains data for approximately **7.8% of the total review history** (45 entries
vs ~406 reviews in the archive + active log). Data before review #364 is
entirely absent from JSONL.

### Gap: No JSONL data for Feb 19, Feb 23, Feb 24

Despite active reviews on these dates visible in archives (REVIEWS_358-388.md
shows Reviews #372-384 on Feb 23-26), the JSONL has zero entries for Feb 19, 23,
and 24.

---

## 4. Arithmetic Consistency

### Review Entries

For review entries, the expected relationship is
`fixed + deferred + rejected <= total`. Since `fixed`, `deferred`, and
`rejected` are almost universally zero, arithmetic checks are vacuous — there is
nothing to validate. The one exception:

- **id 401**: `fixed: 2`, `total: 0` — **Inconsistent**: 2 fixed items but total
  is 0.

### Retrospective Entries

For retrospectives, checking `fixed + rejected + deferred ≈ totalItems`:

| Retro ID  | fixed | rejected | deferred | Sum | totalItems | Delta | Status     |
| --------- | ----- | -------- | -------- | --- | ---------- | ----- | ---------- |
| retro-367 | 100   | 24       | 6        | 130 | 193        | -63   | MISMATCH   |
| retro-368 | 50    | 15       | 0        | 65  | 65         | 0     | OK         |
| retro-369 | 78    | 41       | 0        | 119 | 119        | 0     | OK         |
| retro-370 | 46    | 6        | 1        | 53  | 53         | 0     | OK         |
| retro-371 | 38    | 7        | 0        | 45  | 45         | 0     | OK         |
| retro-374 | 29    | 5        | 5        | 39  | 40         | -1    | MINOR      |
| retro-379 | 106   | 61       | 4        | 171 | 190        | -19   | MISMATCH   |
| retro-382 | 61    | 13       | 0        | 74  | 76         | -2    | MINOR      |
| retro-383 | 192   | 23       | 67       | 282 | 282        | 0     | OK         |
| retro-390 | 0     | 0        | 0        | 0   | 0          | 0     | OK (empty) |
| retro-391 | 108   | 7        | 0        | 115 | 122        | -7    | MISMATCH   |
| retro-392 | 35    | 12       | 4        | 51  | 54         | -3    | MINOR      |
| retro-393 | 6     | 9        | 0        | 15  | 15         | 0     | OK         |
| retro-394 | 153   | 112      | 35       | 300 | 321        | -21   | MISMATCH   |
| retro-395 | 17    | 1        | 0        | 18  | 18         | 0     | OK         |
| retro-396 | 30    | 16       | 1        | 47  | 48         | -1    | MINOR      |

**4 significant mismatches** (delta > 5): retro-367 (-63), retro-379 (-19),
retro-394 (-21), retro-391 (-7). These suggest items exist that were not
categorized as fixed/rejected/deferred (possibly "informational",
"acknowledged", or "not applicable" items).

---

## 5. JSONL vs Markdown Fidelity

### Sampled Reviews: 5 comparisons (first, last, 3 middle)

#### Sample 1: Review #364 (first JSONL entry)

| Field          | JSONL                   | Markdown                                                         |
| -------------- | ----------------------- | ---------------------------------------------------------------- |
| Source         | `sonarcloud+qodo`       | "SonarCloud (2) + Qodo Compliance (6) + Qodo PR Suggestions (3)" |
| Items count    | `total: 0`              | "11 raw → 5" (after dedup)                                       |
| Fixed/rejected | `fixed: 0, rejected: 0` | 5 specific fixes described                                       |
| Patterns       | `[]`                    | 5 specific learnings in text                                     |
| Severity       | All zeros               | Not explicitly broken out                                        |
| Learnings      | 7 items (raw dump)      | Full narrative with context                                      |

**Gap:** JSONL has total=0 but markdown shows 5 items. Learnings exist but as
raw text dumps, not structured data.

#### Sample 2: Review #406 (last JSONL entry)

| Field          | JSONL          | Markdown                                                         |
| -------------- | -------------- | ---------------------------------------------------------------- |
| Source         | `manual`       | "SonarCloud (3) + Qodo Compliance (2) + Qodo PR Suggestions (6)" |
| Total          | `11`           | 11 total items                                                   |
| Fixed/rejected | `0/0`          | "6 fixed, 3 deferred, 2 rejected"                                |
| Patterns       | 1 pattern slug | Full pattern description                                         |

**Gap:** Source collapsed to "manual". Fix/defer/reject counts exist in markdown
but are zero in JSONL.

#### Sample 3: Review #386 (middle — PR #394 R3)

| Field    | JSONL | Markdown                           |
| -------- | ----- | ---------------------------------- |
| Total    | `42`  | "42 total (36 unique after dedup)" |
| Fixed    | `0`   | "27 fixed, 7 deferred, 2 rejected" |
| Patterns | `[]`  | Detailed CC reduction, regex fixes |

**Gap:** Total matches, but all resolution counts are zero.

#### Sample 4: Review #398 (middle — PR #396 R1)

| Field    | JSONL | Markdown                            |
| -------- | ----- | ----------------------------------- |
| Total    | `38`  | "38 total"                          |
| Patterns | `[]`  | 12 specific patterns listed         |
| Fixed    | `0`   | "21 fixed, 12 deferred, 3 rejected" |

**Gap:** 12 patterns in markdown, zero in JSONL.

#### Sample 5: Review #400 (middle — Maintenance PR R1)

| Field     | JSONL   | Markdown                              |
| --------- | ------- | ------------------------------------- |
| Total     | `37`    | "37 total (32 unique after dedup)"    |
| Patterns  | 3 slugs | 3 patterns match                      |
| Fixed     | `0`     | "22 fixed, 10 deferred, 1 rejected"   |
| Learnings | `[]`    | 6 bullet points with detailed context |

**Gap:** Patterns are actually populated here. But fix/defer/reject still zero.

### Summary of Fidelity Issues

| Data Dimension               | In Markdown         | In JSONL                  | Loss Rate |
| ---------------------------- | ------------------- | ------------------------- | --------- |
| Source detail (multi-source) | Always detailed     | 88% collapsed to "manual" | ~88%      |
| Fixed count                  | Always present      | 1 of 33 non-zero          | ~97%      |
| Deferred count               | Usually present     | 0 of 33 non-zero          | 100%      |
| Rejected count               | Usually present     | 0 of 33 non-zero          | 100%      |
| Severity breakdown           | Sometimes present   | Always zero               | 100%      |
| Pattern slugs                | Usually described   | 5 of 33 non-empty         | ~85%      |
| Learnings narrative          | Rich multi-sentence | 5 of 33 non-empty         | ~85%      |
| PR number                    | Always present      | 8 of 33 non-null          | ~76%      |

---

## 6. Archive Health

### Archive File Inventory

| File                 | Claimed Range | Actual Reviews Found                        | Date Range                |
| -------------------- | ------------- | ------------------------------------------- | ------------------------- |
| `REVIEWS_1-40.md`    | 1-40          | #1-#40                                      | 2026-01-01 to ~2026-01-04 |
| `REVIEWS_42-60.md`   | 42-60         | #42-#60                                     | 2026-01-04 to ~2026-01-06 |
| `REVIEWS_61-100.md`  | 61-100        | #61-#100                                    | 2026-01-06 to 2026-01-08  |
| `REVIEWS_101-136.md` | 101-136       | Summary only (no individual review headers) | 2026-01-08 to 2026-01-13  |
| `REVIEWS_137-179.md` | 137-179       | #145-#179                                   | 2026-01-14 to 2026-01-18  |
| `REVIEWS_180-201.md` | 180-201       | #197-#201                                   | 2026-01-23 to 2026-01-24  |
| `REVIEWS_202-212.md` | 202-212       | #202, #204, #211, #212                      | 2026-01-24 to 2026-01-27  |
| `REVIEWS_213-284.md` | 213-284       | #213-#284                                   | 2026-01-28 to 2026-02-10  |
| `REVIEWS_285-346.md` | 285-346       | #285-#346                                   | 2026-02-10 to 2026-02-17  |
| `REVIEWS_347-369.md` | 347-369       | #347-#353, #366-#369                        | 2026-02-17 to 2026-02-21  |
| `REVIEWS_354-357.md` | 354-357       | #354-#357                                   | 2026-02-18 to 2026-02-20  |
| `REVIEWS_358-388.md` | 358-388       | #358-#384                                   | 2026-02-20 to 2026-02-26  |
| `REVIEWS_385-393.md` | 385-393       | #385-#393                                   | 2026-02-26                |

Active log (`AI_REVIEW_LEARNINGS_LOG.md`): Reviews #394-#406

### Overlapping Ranges

1. **REVIEWS_347-369 vs REVIEWS_354-357**: Reviews #354-357 appear in BOTH
   files. The 354-357 file was created as a separate archive but the 347-369
   file only contains #347-353 and #366-369 (skipping 354-365). So the actual
   overlap is just #354-357 existing in a dedicated file while the parent range
   file skips them.

2. **REVIEWS_347-369 vs REVIEWS_358-388**: The 347-369 file contains #366-369
   and the 358-388 file also contains #366-369 (confirmed: both files have
   Review #366, #367, #368, #369). **This is a true overlap of 4 reviews.**

3. **REVIEWS_358-388 vs REVIEWS_385-393**: The 358-388 file contains #383-384 at
   the end, and the 385-393 file starts at #385. The 358-388 filename claims to
   go to 388, and it contains reviews up to #384 in the original numbering
   scheme. However, it also contains a SECOND set of reviews numbered #367-#384
   (duplicate numbering from a renumbering event). **Reviews #367-369 appear 3
   times across archives** (in 347-369, 358-388 original, and 358-388
   renumbered).

4. **REVIEWS_358-388 duplicate numbering**: This file contains TWO sets of
   reviews:
   - Lines 156-470: Reviews #358-#365 (original numbering)
   - Lines 470-700: Reviews #366-#371 (these overlap with 347-369 file)
   - Lines 692+: A SECOND set starting at #367 again with different content (PR
     #384 R2 vs PR #389 R1)
   - Lines 2696+: Reviews #372-#384 (new content, no overlap)

### Gaps in Coverage

| Gap                   | Reviews Missing                                                        | Notes                                    |
| --------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| Review #41            | Not in any archive                                                     | Between REVIEWS_1-40 and REVIEWS_42-60   |
| Reviews #101-136      | Archive exists but contains summary only, no individual review entries | Headers use different format             |
| Reviews #137-144      | Not found in REVIEWS_137-179.md                                        | File starts at #145 despite claiming 137 |
| Reviews #180-196      | Not found in REVIEWS_180-201.md                                        | File starts at #197 despite claiming 180 |
| Reviews #203, 205-210 | Not in REVIEWS_202-212.md                                              | Only #202, #204, #211, #212 present      |
| Review #323           | Not found in REVIEWS_285-346.md                                        | Jumps from #322 to #324                  |
| Review #335           | Not found in REVIEWS_285-346.md                                        | Jumps from #334 to #336                  |
| Review #349           | Not found in any archive                                               | Between #348 and #350                    |

### Archive Health Summary

- **13 archive files** covering claimed range #1-393
- **3 overlapping ranges** with duplicate review content
- **Review #367-369 appear in 3 separate files** with different content
  (numbering collision)
- **Multiple gaps** in coverage: #41, portions of #101-144, #180-196, #203-210,
  #323, #335, #349
- **REVIEWS_358-388.md has internal duplicate numbering** (two different Review
  #367, two different Review #368, two different Review #369)

---

## Summary of Key Findings

### Data Quality Score Card

| Dimension                | Score                                | Assessment                                                |
| ------------------------ | ------------------------------------ | --------------------------------------------------------- |
| JSONL field completeness | **Poor** (15-24% for key fields)     | Severity 100% empty, fix/defer/reject 97-100% empty       |
| Source attribution       | **Poor** (88% collapsed to "manual") | Multi-source detail lost                                  |
| Temporal coverage        | **Very Poor** (7.8% of history)      | Only last 10 days in JSONL                                |
| Arithmetic consistency   | **Mixed**                            | Retros mostly correct; review entries vacuous             |
| JSONL-Markdown fidelity  | **Poor** (76-100% data loss)         | Markdown is the authoritative source                      |
| Archive health           | **Fair**                             | 3 overlaps, ~7 coverage gaps, 1 duplicate numbering event |

### Root Cause Assessment

The JSONL was either (a) recently introduced and only retroactively populated
for the most recent reviews, or (b) the sync mechanism (`npm run reviews:sync`)
fails to extract structured data from the markdown format, defaulting most
fields to zero/empty. The markdown log is by far the richer, more complete data
source. The JSONL in its current state is not suitable for quantitative analysis
of review outcomes.

## Version History

| Version | Date       | Changes          |
| ------- | ---------- | ---------------- |
| 1.0     | 2026-02-27 | Initial creation |
