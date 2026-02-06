# Multi-AI Audit Evaluation Report

<!-- prettier-ignore-start -->
**Generated:** 2026-02-06T01:06:19.851Z
**Session:** maa-2026-02-06-361974
**Overall Score:** 94/100 (A)
**Status:** PASS
<!-- prettier-ignore-end -->

---

## Overall Summary

| Metric                       | Value          |
| ---------------------------- | -------------- |
| Overall Score                | **94/100** (A) |
| Stages Passed                | 8/8            |
| Total Issues                 | 10             |
| Total Recommendations        | 8              |
| Items Ingested to TDMS       | 40             |
| Pre-Audit MASTER_DEBT Count  | 1850           |
| Post-Audit MASTER_DEBT Count | 1890           |

---

## Stage Scorecard

| Stage | Name                       | Score   | Weight | Passed | Issues |
| ----- | -------------------------- | ------- | ------ | ------ | ------ |
| E1    | Session Initialization     | 100/100 | 1x     | ✅     | 0      |
| E2    | Template Output            | 100/100 | 1x     | ✅     | 0      |
| E3    | Format Normalization       | 76/100  | 2x     | ✅     | 8      |
| E4    | Schema Fixing              | 100/100 | 2x     | ✅     | 0      |
| E5    | Category Aggregation       | 90/100  | 2x     | ✅     | 2      |
| E6    | Cross-Category Unification | 100/100 | 1.5x   | ✅     | 0      |
| E7    | TDMS Intake                | 100/100 | 1.5x   | ✅     | 0      |
| E8    | Roadmap Integration        | 100/100 | 1x     | ✅     | 0      |

---

## Detailed Stage Results

### ✅ E1: Session Initialization — 100/100

**Metrics:**

| Metric     | Value                                     |
| ---------- | ----------------------------------------- |
| dirs_found | ["raw","canon","final"]                   |
| state_file | .claude/multi-ai-audit/session-state.json |

No issues found.

---

### ✅ E2: Template Output — 100/100

**Metrics:**

| Metric    | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| templates | {"code":{"exists":true,"readable":true,"promptLength":13300},"security":{"exists":true,"readable":true,"promptLength":20231},"performance":{"exists":true,"readable":true,"promptLength":16427},"refactoring":{"exists":true,"readable":true,"promptLength":10449},"documentation":{"exists":true,"readable":true,"promptLength":4466},"process":{"exists":true,"readable":true,"promptLength":11154},"engineering-productivity":{"exists":true,"readable":true,"promptLength":8233}} |

No issues found.

---

### ✅ E3: Format Normalization — 76/100

**Metrics:**

| Metric                 | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| raw_files              | 12                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| original_files         | 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| total_findings         | 150                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| total_errors           | 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| total_missing_fields   | 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| extraction_quality_pct | 100                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| per_file               | {"code-claude-backend-architect.fixed.jsonl":{"findings":12,"json_errors":0,"missing_required_fields":0},"code-claude-backend-architect.jsonl":{"findings":12,"json_errors":0,"missing_required_fields":0},"code-claude-backend-architect.normalized.jsonl":{"findings":12,"json_errors":0,"missing_required_fields":0},"code-claude-code-reviewer.fixed.jsonl":{"findings":14,"json_errors":0,"missing_required_fields":0},"code-claude-code-reviewer.jsonl":{"findings":14,"json_errors":0,"missing_required_fields":0},"code-claude-code-reviewer.normalized.jsonl":{"findings":14,"json_errors":0,"missing_required_fields":0},"security-claude-penetration-tester.fixed.jsonl":{"findings":11,"json_errors":0,"missing_required_fields":0},"security-claude-penetration-tester.jsonl":{"findings":11,"json_errors":0,"missing_required_fields":0},"security-claude-penetration-tester.normalized.jsonl":{"findings":11,"json_errors":0,"missing_required_fields":0},"security-claude-security-auditor.fixed.jsonl":{"findings":13,"json_errors":0,"missing_required_fields":0},"security-claude-security-auditor.jsonl":{"findings":13,"json_errors":0,"missing_required_fields":0},"security-claude-security-auditor.normalized.jsonl":{"findings":13,"json_errors":0,"missing_required_fields":0}} |

**Issues Found:**

- ⚠️ code-claude-backend-architect.fixed.jsonl: no .original.txt backup found
- ⚠️ code-claude-backend-architect.normalized.jsonl: no .original.txt backup
  found
- ⚠️ code-claude-code-reviewer.fixed.jsonl: no .original.txt backup found
- ⚠️ code-claude-code-reviewer.normalized.jsonl: no .original.txt backup found
- ⚠️ security-claude-penetration-tester.fixed.jsonl: no .original.txt backup
  found
- ⚠️ security-claude-penetration-tester.normalized.jsonl: no .original.txt
  backup found
- ⚠️ security-claude-security-auditor.fixed.jsonl: no .original.txt backup found
- ⚠️ security-claude-security-auditor.normalized.jsonl: no .original.txt backup
  found

**Stage Recommendations:**

- 💡 Original input for code-claude-backend-architect.fixed.jsonl not preserved
  — debugging will be harder
- 💡 Original input for code-claude-backend-architect.normalized.jsonl not
  preserved — debugging will be harder
- 💡 Original input for code-claude-code-reviewer.fixed.jsonl not preserved —
  debugging will be harder
- 💡 Original input for code-claude-code-reviewer.normalized.jsonl not preserved
  — debugging will be harder
- 💡 Original input for security-claude-penetration-tester.fixed.jsonl not
  preserved — debugging will be harder
- 💡 Original input for security-claude-penetration-tester.normalized.jsonl not
  preserved — debugging will be harder
- 💡 Original input for security-claude-security-auditor.fixed.jsonl not
  preserved — debugging will be harder
- 💡 Original input for security-claude-security-auditor.normalized.jsonl not
  preserved — debugging will be harder

---

### ✅ E4: Schema Fixing — 100/100

**Metrics:**

| Metric               | Value |
| -------------------- | ----- |
| total_items          | 150   |
| complete_items       | 150   |
| completeness_pct     | 100   |
| valid_severity_pct   | 100   |
| valid_category_pct   | 100   |
| low_confidence_count | 0     |

No issues found.

---

### ✅ E5: Category Aggregation — 90/100

**Metrics:**

| Metric                  | Value                                                                                                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| canon_files             | 2                                                                                                                                                                                                                          |
| total_raw               | 50                                                                                                                                                                                                                         |
| total_canon             | 46                                                                                                                                                                                                                         |
| overall_dedup_ratio_pct | 8                                                                                                                                                                                                                          |
| per_category            | {"code":{"sources":2,"raw_count":26,"canon_count":26,"dedup_ratio_pct":0,"valid_canon_ids":0,"verified":0},"security":{"sources":2,"raw_count":24,"canon_count":20,"dedup_ratio_pct":17,"valid_canon_ids":0,"verified":0}} |

**Issues Found:**

- ⚠️ code: 26 items missing valid CANON ID
- ⚠️ security: 20 items missing valid CANON ID

---

### ✅ E6: Cross-Category Unification — 100/100

**Metrics:**

| Metric                 | Value                           |
| ---------------------- | ------------------------------- |
| unified_count          | 40                              |
| json_errors            | 0                               |
| has_priority_score     | 40                              |
| has_cross_cutting_flag | 1                               |
| cross_cutting_files    | 0                               |
| severity_counts        | {"S0":1,"S1":7,"S2":22,"S3":10} |
| summary_exists         | true                            |

No issues found.

---

### ✅ E7: TDMS Intake — 100/100

**Metrics:**

| Metric                    | Value |
| ------------------------- | ----- |
| pre_count                 | 1850  |
| post_count                | 1890  |
| new_items                 | 40    |
| expected_from_unified     | 40    |
| duplicate_hashes          | 0     |
| intake_log_found          | true  |
| views_updated             | true  |
| items_without_file        | 0     |
| items_without_description | 0     |

No issues found.

---

### ✅ E8: Roadmap Integration — 100/100

**Metrics:**

| Metric                 | Value                             |
| ---------------------- | --------------------------------- |
| new_items              | 40                                |
| with_roadmap_ref       | 40                                |
| assignment_rate_pct    | 100                               |
| default_fallback_count | 0                                 |
| track_distribution     | {"M2.1":19,"Track-S":17,"M2.2":4} |
| metrics_updated        | true                              |
| report_exists          | true                              |

No issues found.

---

## Recommendations

### Schema & Format Gaps

- [E3] Original input for code-claude-backend-architect.normalized.jsonl not
  preserved — debugging will be harder
- [E3] Original input for code-claude-code-reviewer.normalized.jsonl not
  preserved — debugging will be harder
- [E3] Original input for security-claude-penetration-tester.normalized.jsonl
  not preserved — debugging will be harder
- [E3] Original input for security-claude-security-auditor.normalized.jsonl not
  preserved — debugging will be harder

### Process Improvements

- [E3] Original input for code-claude-backend-architect.fixed.jsonl not
  preserved — debugging will be harder
- [E3] Original input for code-claude-code-reviewer.fixed.jsonl not preserved —
  debugging will be harder
- [E3] Original input for security-claude-penetration-tester.fixed.jsonl not
  preserved — debugging will be harder
- [E3] Original input for security-claude-security-auditor.fixed.jsonl not
  preserved — debugging will be harder

---

## Data Integrity Check

| Check                                 | Result                            |
| ------------------------------------- | --------------------------------- |
| Items not ingested                    | 0 (all unified findings ingested) |
| Duplicate content hashes              | 0                                 |
| Items without file path               | 0                                 |
| Items without description             | 0                                 |
| Items without roadmap_ref             | 0                                 |
| Items hitting default fallback (M2.1) | 0                                 |

---

## Pre/Post State Comparison

| Metric            | Before    | After     | Delta |
| ----------------- | --------- | --------- | ----- |
| MASTER_DEBT items | 1850      | 1890      | +40   |
| Last DEBT ID      | DEBT-1911 | DEBT-1951 |       |
| Roadmap DEBT refs | 38        | 38        | +0    |
| S0 items          | 24        | 25        | +1    |
| S1 items          | 453       | 460       | +7    |
| S2 items          | 1064      | 1086      | +22   |
| S3 items          | 309       | 319       | +10   |

---

**END OF EVALUATION REPORT**
