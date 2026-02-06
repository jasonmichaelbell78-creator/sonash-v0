# SonarCloud Skill Evaluation Report

<!-- prettier-ignore-start -->
**Generated:** 2026-02-05T23:46:11.553Z
**Session:** eval-sonarcloud-20260205-174410
**Overall Score:** 90/100 (A)
**Status:** ✅ PASS
<!-- prettier-ignore-end -->

---

## Overall Summary

| Metric                     | Value          |
| -------------------------- | -------------- |
| Overall Score              | **90/100** (A) |
| Stages Passed              | 6/6            |
| Total Issues               | 3              |
| Total Recommendations      | 2              |
| Items Added                | +0             |
| Items Resolved             | +0             |
| Pre-Run MASTER_DEBT Count  | 899            |
| Post-Run MASTER_DEBT Count | 899            |

---

## Stage Scorecard

| Stage | Name              | Score   | Weight | Status | Issues |
| ----- | ----------------- | ------- | ------ | ------ | ------ |
| E1    | API Fetch         | 85/100  | 1.5x   | ✅     | 1      |
| E2    | Deduplication     | 100/100 | 1.5x   | ✅     | 0      |
| E3    | Resolve Logic     | 80/100  | 1.5x   | ✅     | 1      |
| E4    | View Regeneration | 100/100 | 1x     | ✅     | 0      |
| E5    | Report Generation | 80/100  | 1x     | ✅     | 1      |
| E6    | Schema Integrity  | 100/100 | 1x     | ✅     | 0      |

---

## Detailed Stage Results

### ✅ E1: API Fetch — 85/100

**Metrics:**

| Metric             | Value   |
| ------------------ | ------- |
| sync_entry_found   | true    |
| items_fetched      | 1324    |
| items_added        | 951     |
| already_tracked    | 351     |
| content_duplicates | 22      |
| outcome            | success |
| pre_count          | 899     |
| current_count      | 899     |
| delta              | 0       |

**Issues Found:**

- ⚠️ Log claims 951 items added but MASTER_DEBT shows 0 delta

---

### ✅ E2: Deduplication — 100/100

**Metrics:**

| Metric                   | Value   |
| ------------------------ | ------- |
| total_items              | 899     |
| json_errors              | 0       |
| duplicate_content_hashes | 0       |
| duplicate_sonar_keys     | 0       |
| unique_content_hashes    | 869     |
| duplicate_examples       | (empty) |

No issues found.

---

### ✅ E3: Resolve Logic — 80/100

**Metrics:**

| Metric              | Value   |
| ------------------- | ------- |
| resolve_entry_found | false   |
| items_checked       | 0       |
| items_resolved      | 0       |
| outcome             | not_run |
| sonar_items_total   | 0       |
| status_breakdown    | `{}`    |

**Issues Found:**

- ⚠️ No resolve-sonarcloud-stale entry found - resolve phase may not have run

**Recommendations:**

- 💡 Run sync-sonarcloud.js with --resolve or --full flag

---

### ✅ E4: View Regeneration — 100/100

**Metrics:**

| Metric        | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| views_checked | 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| views_updated | 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| items_added   | 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| view_results  | `{"by-severity.md":{"exists":true,"updated":true,"pre_mtime":"2026-02-05T23:40:31.712Z","current_mtime":"2026-02-05T23:45:22.835Z"},"by-category.md":{"exists":true,"updated":true,"pre_mtime":"2026-02-05T23:40:31.710Z","current_mtime":"2026-02-05T23:45:22.836Z"},"by-status.md":{"exists":true,"updated":true,"pre_mtime":"2026-02-05T23:40:31.713Z","current_mtime":"2026-02-05T23:45:22.837Z"},"verification-queue.md":{"exists":true,"updated":true,"pre_mtime":"2026-02-05T23:40:31.713Z","current_mtime":"2026-02-05T23:45:22.838Z"}}` |

No issues found.

---

### ✅ E5: Report Generation — 80/100

**Metrics:**

| Metric        | Value                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------- |
| report_exists | true                                                                                      |
| report_path   | C:\Users\jason\Workspace\dev-projects\sonash-v0\docs\audits\sonarcloud-issues-detailed.md |
| report_size   | 806                                                                                       |

**Issues Found:**

- ⚠️ Report file too small (802 bytes) - may be incomplete

**Recommendations:**

- 💡 Report has no code snippets - code context improves actionability

---

### ✅ E6: Schema Integrity — 100/100

**Metrics:**

| Metric                  | Value |
| ----------------------- | ----- |
| total_items             | 899   |
| json_errors             | 0     |
| missing_required_fields | 0     |
| missing_sonar_fields    | 0     |
| invalid_id_format       | 0     |
| invalid_severity        | 0     |
| invalid_status          | 0     |
| resolved_no_reason      | 0     |

No issues found.

---

## Consolidated Recommendations

### Pipeline & Integration

- [E3] Run sync-sonarcloud.js with --resolve or --full flag
- [E5] Report has no code snippets - code context improves actionability

---

## Data Integrity Summary

| Check                     | Result |
| ------------------------- | ------ |
| Duplicate Content Hashes  | 0      |
| Duplicate SonarCloud Keys | 0      |
| JSON Parse Errors         | 0      |
| Missing Required Fields   | 0      |
| Invalid ID Format         | 0      |
| Invalid Severity          | 0      |
| Invalid Status            | 0      |

---

## Pre/Post State Comparison

| Metric               | Before    | After     | Delta |
| -------------------- | --------- | --------- | ----- |
| MASTER_DEBT items    | 899       | 899       | +0    |
| Last DEBT ID         | DEBT-0960 | DEBT-0960 |       |
| SonarCloud items     | 0         | 0         | +0    |
| Items with sonar_key | 502       | 502       | +0    |
| Intake log lines     | 9         | 10        | +1    |
| Resolution log lines | 1         | 1         | +0    |

---

---

**END OF EVALUATION REPORT**
