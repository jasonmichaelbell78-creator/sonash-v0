# V2 Data Verification

**Generated:** 2026-03-27  
**Verifier:** Verification Agent  
**Source Report:** .research/debt-runner-expansion/RESEARCH_OUTPUT.md

---

## Summary

14 claims checked. 12 VERIFIED, 2 REFUTED (claims 5 and 11).

---

## Results by Claim

### Claim 1: MASTER_DEBT.jsonl has 8,470+ items

**Status: VERIFIED**

Actual line count: **8,472**. Exact match with the report.

---

### Claim 2: metrics-log.jsonl has 112+ entries

**Status: VERIFIED**

Actual line count: **113**.

---

### Claim 3: resolution-log.jsonl has only 14 entries

**Status: VERIFIED**

Actual line count: **14** -- exact match.

---

### Claim 4: intake-log.jsonl exists

**Status: VERIFIED**

File present at docs/technical-debt/logs/intake-log.jsonl.

---

### Claim 5: known-debt-baseline.json has 45+ entries

**Status: REFUTED**

File: .claude/state/known-debt-baseline.json (66 lines).

The file is a nested JSON object with a baselines key containing 3
sub-categories:

- raw-error-message: 1 pattern baseline
- cognitive-complexity: 22 file-level numeric baselines
- cyclomatic-complexity: 16 file-level numeric baselines

Total file-level entries: **~40**. This is below the claimed 45+. The file is
not a flat list.

---

### Claim 6: BUG-01 -- debt-health.js uses lowercase status strings

**Status: VERIFIED**

File: scripts/health/checkers/debt-health.js line 65:

    const openDebt = allDebt.filter(d => d.status !== "resolved" && d.status !== "closed");

This uses lowercase "resolved" and "closed". Canonical status values in
MASTER_DEBT.jsonl are uppercase (confirmed: resolve-bulk.js line 298 uses
item.status === "RESOLVED"). The filter never matches any record because
"RESOLVED" !== "resolved" in strict comparison. All items including resolved
ones are treated as open when calculating average age. BUG-01 is confirmed.

Scope: bug is in the age-calculation filter in debt-health.js specifically.
resolve-bulk.js and other mutation scripts use uppercase status values
correctly.

---

### Claim 7: BUG-03 -- resolve-bulk.js does NOT call sync-deduped.js

**Status: VERIFIED**

scripts/debt/resolve-bulk.js (492 lines) read in full. Post-resolution calls:

- generate-views.js (line 420)
- reconcile-roadmap.js --write (line 432)

No call to sync-deduped.js anywhere in the file.

---

### Claim 8: BUG-06 -- logMetricsGeneration does NOT log by_source or by_category

**Status: VERIFIED**

File: scripts/debt/generate-metrics.js, logMetricsGeneration function (lines
335-356).

Log entry written to metrics-log.jsonl contains only: timestamp, total, open,
resolved, s0_alerts, s1_alerts

The by_source and by_category fields ARE computed in calculateMetrics (lines
140-154) and ARE written to metrics.json (lines 179-181). They are absent only
from the logMetricsGeneration append to metrics-log.jsonl. Any web dashboard
trend chart reading historical by_source or by_category from metrics-log.jsonl
would find those fields missing from all 113 existing entries. BUG-06 is
confirmed.

---

### Claim 9: DEBT-7593 exists and references SQLite

**Status: VERIFIED**

Found at line 4609. Title: "SQLite migration for TDMS pipeline -- research +
implementation". The description covers SQLite migration goals and verification
steps. source_id is "OVER-ENG-009".

---

### Claim 10: source_id field uses prefix convention

**Status: VERIFIED**

Five sampled items (lines 1, 2000, 4000, 6000, 8000):

| Line | source_id                                  |
| ---- | ------------------------------------------ |
| 1    | unknown                                    |
| 2000 | audit:process-scripts-error-message-format |
| 4000 | context:agent-research-results.md:124      |
| 6000 | audit:PERF-021                             |
| 8000 | audit:SYST-2026-02-19-D02-002              |

The prefix convention confirmed in 4 of 5 samples. Line 1 uses "unknown" which
is the documented fallback value in generate-metrics.js line 152.

---

### Claim 11: cluster_primary field exists in MASTER_DEBT.jsonl

**Status: REFUTED -- sparse field, not universal**

All 5 sampled items showed cluster_primary absent. A grep across all 8,472 lines
found **172 matches** -- approximately **2% of items**.

This is a sparse optional field. The research report implies universal presence.
The SQLite schema must declare this column nullable. Any web-side filter or sort
on this field must handle absent values gracefully.

---

### Claim 12: FALSE_POSITIVES.jsonl has only 6 entries

**Status: VERIFIED**

Line count: **6** -- exact match.

---

### Claim 13: resolve-debt.yml does NOT call generate-metrics.js

**Status: VERIFIED**

.github/workflows/resolve-debt.yml (176 lines) read in full. The workflow calls
only node scripts/debt/resolve-bulk.js and then commits/pushes
docs/technical-debt/. No call to generate-metrics.js exists. The post-resolution
metrics gap is confirmed.

Note: generate-metrics.js is also absent from consolidate-all.js.

---

### Claim 14: consolidate-all.js pipeline order

**Status: VERIFIED**

scripts/debt/consolidate-all.js STEPS array (lines 18-50) defines 6 steps:

1. extract-sonarcloud.js (deprecated, not required)
2. extract-audits.js (required)
3. extract-reviews.js (required)
4. normalize-all.js (required)
5. dedup-multi-pass.js (required)
6. generate-views.js --ingest (required)

Matches the pipeline order described in the research report.

---

## Summary Table

| #   | Claim                                                    | Status           | Key Evidence                    |
| --- | -------------------------------------------------------- | ---------------- | ------------------------------- |
| 1   | MASTER_DEBT.jsonl has 8,470+ items                       | VERIFIED         | 8,472 lines                     |
| 2   | metrics-log.jsonl has 112+ entries                       | VERIFIED         | 113 lines                       |
| 3   | resolution-log.jsonl has only 14 entries                 | VERIFIED         | 14 lines                        |
| 4   | intake-log.jsonl exists                                  | VERIFIED         | File present                    |
| 5   | known-debt-baseline.json has 45+ entries                 | REFUTED          | ~40 entries across 3 categories |
| 6   | BUG-01: debt-health.js lowercase status filter           | VERIFIED         | Line 65 confirmed               |
| 7   | BUG-03: resolve-bulk.js no sync-deduped.js call          | VERIFIED         | No such call in 492-line file   |
| 8   | BUG-06: logMetricsGeneration omits by_source/by_category | VERIFIED         | Log entry fields confirmed      |
| 9   | DEBT-7593 exists and references SQLite                   | VERIFIED         | Line 4609                       |
| 10  | source_id uses prefix convention                         | VERIFIED         | 4 of 5 samples confirm          |
| 11  | cluster_primary field exists                             | REFUTED (sparse) | ~172 of 8,472 items (~2%)       |
| 12  | FALSE_POSITIVES.jsonl has only 6 entries                 | VERIFIED         | 6 lines                         |
| 13  | resolve-debt.yml no generate-metrics.js call             | VERIFIED         | Workflow read in full           |
| 14  | consolidate-all.js pipeline order                        | VERIFIED         | 6-step order confirmed          |

---

## Corrections for /deep-plan

**Correction 1 (Claim 5):** Describe known-debt-baseline.json as containing
approximately 40 file-level entries across 3 baseline categories, not "45+
entries." The file is a nested object, not a flat list.

**Correction 2 (Claim 11):** cluster_primary is a sparse optional field with ~2%
coverage (~172 of 8,472 items). The SQLite schema must declare this column
nullable. Web UI components must handle null/absent values for this field.

**Precision note (Claim 6):** BUG-01 is real and confirmed at debt-health.js
line 65. The web dashboard risk is valid: any status filter written with
lowercase values will silently fail against uppercase-stored data in
MASTER_DEBT.jsonl.
