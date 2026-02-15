<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Recovery Procedures

How to resume a comprehensive audit after context compaction or interruption.

## Determine Current State

```bash
echo "=== Checking audit progress ==="
ls -la docs/audits/comprehensive/*.md 2>/dev/null | wc -l
```

## Recovery Matrix

| Files Found                 | State                | Resume Action                  |
| --------------------------- | -------------------- | ------------------------------ |
| 0-3 reports                 | Stage 1 incomplete   | Re-run missing Stage 1 audits  |
| 4 reports                   | Stage 1 complete     | Start Stage 2                  |
| 5-6 reports                 | Stage 2 incomplete   | Re-run missing Stage 2 audit   |
| 7 reports                   | Stage 2 complete     | Start Stage 2.5                |
| 8 reports                   | Stage 2.5 incomplete | Re-run missing Stage 2.5 audit |
| 9 reports, no COMPREHENSIVE | Stage 2.5 complete   | Run Stage 3 (aggregator)       |
| COMPREHENSIVE exists        | Complete             | Run post-audit only            |

## Resume Commands

**Stage 1 incomplete:** Re-run only missing audits:

```bash
# Check which are missing
for audit in code security performance refactoring; do
  [ ! -f "docs/audits/comprehensive/audit-${audit}-report.md" ] && echo "Missing: $audit"
done
```

**Stage 2 incomplete:** Run documentation and/or process audits as needed.

**Stage 2.5 incomplete:** Run enhancements and/or ai-optimization as needed.

**Stage 3:** Run aggregator on existing 9 reports.

## Error Handling

**If Individual Audit Fails:**

- Continue with remaining audits in the same stage
- Mark failed audit in status display
- Note failure in final report
- Suggest running failed audit individually for debugging

**If Aggregator Fails:**

- All individual reports still available
- User can manually review 9 separate reports
- Suggest creating GitHub issue for aggregator failure

**If All Audits Fail:**

- Check baseline environment (tests passing, lint working)
- Check for system issues (disk space, memory)
- Suggest running single audit first to isolate issue
