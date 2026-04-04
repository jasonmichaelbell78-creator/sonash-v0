# Research Integrity Fix — Baseline Validation

**Date:** 2026-04-02 **Command:** `npm run research:validate`

## Summary

| Metric | Count |
| ------ | ----- |
| PASS   | 27    |
| FAIL   | 24    |
| WARN   | 13    |
| FIXED  | 0     |

## Per-Topic Results

### custom-agents

| Check                        | Status | Detail                                           |
| ---------------------------- | ------ | ------------------------------------------------ |
| 1. Source traceability       | PASS   | All sourceIds resolve                            |
| 2. Claim coverage            | FAIL   | 93/111 claims not in report                      |
| 3. Findings inventory        | FAIL   | Files: 0 vs agentCount: 37                       |
| 4. Confidence reconciliation | FAIL   | MEDIUM: actual=35 metadata=32                    |
| 5. Post-pipeline delta       | PASS   | 111 claims match                                 |
| 6. Claim-to-report bidir     | PASS   | All report claim IDs exist in JSONL              |
| 7. Source freshness          | PASS   | Fresh                                            |
| 8. Verdict persistence       | WARN   | Verdicts in report but no fields in claims.jsonl |

### debt-runner-expansion

| Check                        | Status | Detail                                           |
| ---------------------------- | ------ | ------------------------------------------------ |
| 1. Source traceability       | FAIL   | 12 orphaned sourceIds                            |
| 2. Claim coverage            | FAIL   | 44/44 claims not in report                       |
| 3. Findings inventory        | FAIL   | Files: 25 vs agentCount: 19                      |
| 4. Confidence reconciliation | FAIL   | HIGH: 39 vs 38; MEDIUM: 3 vs 4                   |
| 5. Post-pipeline delta       | PASS   | 44 match                                         |
| 6. Claim-to-report bidir     | PASS   | All report claim IDs exist in JSONL              |
| 7. Source freshness          | PASS   | Fresh                                            |
| 8. Verdict persistence       | WARN   | Verdicts in report but no fields in claims.jsonl |

### dev-dashboard

| Check                        | Status | Detail                                           |
| ---------------------------- | ------ | ------------------------------------------------ |
| 1. Source traceability       | PASS   | All sourceIds resolve                            |
| 2. Claim coverage            | FAIL   | 100/100 claims not in report                     |
| 3. Findings inventory        | WARN   | No agentCount in metadata                        |
| 4. Confidence reconciliation | WARN   | No confidenceDistribution in metadata            |
| 5. Post-pipeline delta       | WARN   | No claimCount in metadata                        |
| 6. Claim-to-report bidir     | FAIL   | 16 claim IDs in report but not JSONL             |
| 7. Source freshness          | PASS   | Fresh                                            |
| 8. Verdict persistence       | WARN   | Verdicts in report but no fields in claims.jsonl |

### github-health

| Check                        | Status | Detail                                        |
| ---------------------------- | ------ | --------------------------------------------- |
| 1. Source traceability       | PASS   | All sourceIds resolve                         |
| 2. Claim coverage            | PASS   | All claims referenced in report               |
| 3. Findings inventory        | FAIL   | Files: 0 vs agentCount: 21                    |
| 4. Confidence reconciliation | FAIL   | HIGH: 18 vs 22; MEDIUM: 13 vs 11; LOW: 7 vs 9 |
| 5. Post-pipeline delta       | PASS   | 38 match                                      |
| 6. Claim-to-report bidir     | FAIL   | 1 claim ID in report but not JSONL            |
| 7. Source freshness          | PASS   | Fresh                                         |
| 8. Verdict persistence       | PASS   | No verdicts in report                         |

### multi-layer-memory

| Check                        | Status | Detail                                           |
| ---------------------------- | ------ | ------------------------------------------------ |
| 1. Source traceability       | WARN   | No sources.jsonl                                 |
| 2. Claim coverage            | FAIL   | 115/128 claims not in report                     |
| 3. Findings inventory        | WARN   | No agentCount in metadata                        |
| 4. Confidence reconciliation | WARN   | No confidenceDistribution in metadata            |
| 5. Post-pipeline delta       | WARN   | No claimCount in metadata                        |
| 6. Claim-to-report bidir     | PASS   | All report claim IDs exist in JSONL              |
| 7. Source freshness          | WARN   | No sources.jsonl                                 |
| 8. Verdict persistence       | WARN   | Verdicts in report but no fields in claims.jsonl |

### plan-orchestration

| Check                        | Status | Detail                                           |
| ---------------------------- | ------ | ------------------------------------------------ |
| 1. Source traceability       | PASS   | All sourceIds resolve                            |
| 2. Claim coverage            | FAIL   | 34/34 claims not in report                       |
| 3. Findings inventory        | PASS   | 22 files match agentCount 22                     |
| 4. Confidence reconciliation | FAIL   | HIGH: 26 vs 25; MEDIUM: 8 vs 9                   |
| 5. Post-pipeline delta       | PASS   | 34 match                                         |
| 6. Claim-to-report bidir     | PASS   | All report claim IDs exist in JSONL              |
| 7. Source freshness          | PASS   | Fresh                                            |
| 8. Verdict persistence       | WARN   | Verdicts in report but no fields in claims.jsonl |

### repo-analysis-skill

| Check                        | Status | Detail                                       |
| ---------------------------- | ------ | -------------------------------------------- |
| 1. Source traceability       | FAIL   | 64 orphaned sourceIds                        |
| 2. Claim coverage            | FAIL   | 39/50 claims not in report                   |
| 3. Findings inventory        | FAIL   | Files: 29 vs agentCount: 32                  |
| 4. Confidence reconciliation | FAIL   | HIGH: 42 vs 37; MEDIUM: 6 vs 10; LOW: 0 vs 1 |
| 5. Post-pipeline delta       | PASS   | 50 match                                     |
| 6. Claim-to-report bidir     | PASS   | All report claim IDs exist in JSONL          |
| 7. Source freshness          | PASS   | Fresh                                        |
| 8. Verdict persistence       | PASS   | No verdicts in report                        |

### repo-analysis-value-extraction

| Check                        | Status | Detail                                              |
| ---------------------------- | ------ | --------------------------------------------------- |
| 1. Source traceability       | FAIL   | 170 orphaned sourceIds                              |
| 2. Claim coverage            | FAIL   | 80/80 claims not in report                          |
| 3. Findings inventory        | FAIL   | Files: 23 vs agentCount: 18                         |
| 4. Confidence reconciliation | FAIL   | HIGH: 74 vs 68; MEDIUM: 6 vs 10; UNVERIFIED: 0 vs 2 |
| 5. Post-pipeline delta       | PASS   | 80 match                                            |
| 6. Claim-to-report bidir     | FAIL   | 5 claim IDs in report but not JSONL                 |
| 7. Source freshness          | PASS   | Fresh                                               |
| 8. Verdict persistence       | PASS   | No verdicts in report                               |
