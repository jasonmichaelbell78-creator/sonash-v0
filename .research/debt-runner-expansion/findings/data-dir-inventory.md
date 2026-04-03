# Data Directory Inventory

| filepath                                                  | line_count | data_type                                                            | web_relevance                    |
| --------------------------------------------------------- | ---------- | -------------------------------------------------------------------- | -------------------------------- |
| data/ecosystem-v2/deferred-items.jsonl                    | 3          | pr-review deferred items (schema_version, review_id)                 | LOW — pr-review pipeline only    |
| data/ecosystem-v2/ecosystem-health-log.jsonl              | 31         | health scores over time (timestamp, score, grade, categoryScores)    | HIGH — trend charts for web UI   |
| data/ecosystem-v2/enforcement-manifest.jsonl              | 360        | pattern enforcement records (pattern_id, mechanisms, eslint/semgrep) | MEDIUM — debt discovery source   |
| data/ecosystem-v2/invocations.jsonl                       | 30         | skill invocation log (skill, type, date, origin)                     | MEDIUM — activity feed for web   |
| data/ecosystem-v2/test-registry.jsonl                     | 551        | test file registry (path, type, owner, target)                       | LOW — tooling metadata only      |
| data/ecosystem-v2/warnings.jsonl                          | 16         | health warnings (category, debt-aging)                               | HIGH — alert surface for web     |
| data/ecosystem-v2/archive/retros.jsonl.archived-20260318  | 47         | archived retro records                                               | LOW — historical only            |
| data/ecosystem-v2/archive/reviews.jsonl.archived-20260318 | 419        | archived pr-review records                                           | LOW — historical only            |
| docs/technical-debt/logs/dedup-log.jsonl                  | 2371       | dedup pass log (type, kept, removed, reason)                         | LOW — pipeline audit trail       |
| docs/technical-debt/logs/ims-archive-2026-02-12.jsonl     | 61         | archived debt items (category, impact, effort)                       | LOW — historical snapshot        |
| docs/technical-debt/logs/intake-log.jsonl                 | 80         | intake actions (action, item_id, severity, category)                 | MEDIUM — intake audit trail      |
| docs/technical-debt/logs/metrics-log.jsonl                | 113        | debt metrics over time (total, open, s0_alerts, s1_alerts)           | HIGH — trend data for web        |
| docs/technical-debt/logs/resolution-audit-report.json     | 1854       | bulk resolution audit (total_items, promoted, needs_triage)          | LOW — one-time audit artifact    |
| docs/technical-debt/logs/resolution-log.jsonl             | 14         | resolution events (action, item_ids, count, pr)                      | MEDIUM — resolution history      |
| docs/technical-debt/logs/s1-duplicate-candidates.json     | 62         | S1 duplicate groups (primary, duplicates, file)                      | LOW — dedup pipeline artifact    |
| docs/technical-debt/logs/s2s3-duplicate-candidates.json   | 234        | S2/S3 duplicate groups                                               | LOW — dedup pipeline artifact    |
| docs/technical-debt/logs/s2-verification-batch.json       | 4338       | S2 file existence verification results                               | LOW — dedup pipeline artifact    |
| docs/technical-debt/logs/s3-verification-batch.json       | 311        | S3 file existence verification results                               | LOW — dedup pipeline artifact    |
| docs/technical-debt/raw/audits.jsonl                      | 794        | audit-sourced debt items (category, severity, file, line)            | HIGH — primary debt source       |
| docs/technical-debt/raw/deduped.jsonl                     | 3850       | deduped debt items (category, severity, file, line, title)           | HIGH — canonical debt list       |
| docs/technical-debt/raw/normalized-all.jsonl              | 7264       | all normalized items pre-dedup                                       | LOW — intermediate pipeline file |
| docs/technical-debt/raw/review-needed.jsonl               | 467        | items flagged for human review (reason, item_a/b)                    | HIGH — web triage queue          |
| docs/technical-debt/raw/reviews.jsonl                     | 1          | review decisions (empty/stub)                                        | LOW — stub only                  |
| docs/technical-debt/raw/scattered-intake.jsonl            | 503        | code-comment sourced intake (INTAKE-CODE-\* ids)                     | MEDIUM — discovery source        |
| docs/technical-debt/raw/scattered-intake-cleaned.jsonl    | 125        | cleaned context-sourced intake (INTAKE-CTX-\* ids)                   | MEDIUM — discovery source        |
| docs/technical-debt/raw/scattered-triage-report.jsonl     | 374        | triage dispositions (DUPLICATE/ACCEPTED, reason)                     | LOW — pipeline audit trail       |
| docs/technical-debt/views/by-category.md                  | 8527       | debt grouped by category (rendered markdown)                         | HIGH — web view candidate        |
| docs/technical-debt/views/by-severity.md                  | 8502       | debt grouped by severity                                             | HIGH — web view candidate        |
| docs/technical-debt/views/by-status.md                    | 8506       | debt grouped by status                                               | HIGH — web view candidate        |
| docs/technical-debt/views/unplaced-items.md               | 63         | items with no category placement                                     | MEDIUM — triage aid              |
| docs/technical-debt/views/verification-queue.md           | 2144       | items awaiting file verification                                     | MEDIUM — ops queue               |
| .claude/override-log.jsonl                                | 30         | permission override events                                           | LOW — internal tooling only      |
| .claude/hooks/.session-state.json                         | 8          | session begin/end counters and timestamps                            | LOW — hook state only            |
