<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Learning Capture (Step 7)

Mandatory learning documentation after every PR review processing.

## 7.1 Finalize Review Number

**Why deferred numbering**: Review numbers were previously assigned in Step 3
(at plan time), which caused numbering collisions when multiple PRs were
processed in parallel or across overlapping sessions. Now, the placeholder
`#TBD` is used until this step, where the final number is assigned at commit
time.

```bash
# Count reviews in both active log and archive (robust edge case handling)
active=0
if [ -f docs/AI_REVIEW_LEARNINGS_LOG.md ]; then
  active=$(grep -c "#### Review #" docs/AI_REVIEW_LEARNINGS_LOG.md || true)
  active=${active:-0}
fi

archived=0
# Use find to handle multiple archive files and cases where none exist
if [ -d docs/archive ]; then
  # The find command is robust against no-match errors
  archived_files=$(find docs/archive -type f -name "REVIEWS_*.md" 2>/dev/null)
  if [ -n "$archived_files" ]; then
    archived=$(grep -ch "#### Review #" $archived_files 2>/dev/null | awk '{s+=$1} END {print s+0}')
    archived=${archived:-0}
  fi
fi

echo "Total reviews: $((active + archived))"
```

Add 1 to the total to get the next review number. Then **replace all `#TBD`
occurrences** in the learning entry with the final number.

## 7.2 Create Learning Entry

Complete the `#TBD` stub created in Step 3. Replace `#TBD` with the final review
number and fill in all fields:

```markdown
#### Review #N: <Brief Description> (YYYY-MM-DD)

**Source:** CodeRabbit PR / Qodo Compliance / Mixed **PR/Branch:**
<branch name or PR number> **Suggestions:** X total (Critical: X, Major: X,
Minor: X, Trivial: X)

**Patterns Identified:**

1. [Pattern name]: [Description]
   - Root cause: [Why this happened]
   - Prevention: [What to add/change]

**Resolution:**

- Fixed: X items
- Deferred: X items (with tracking)
- Rejected: X items (with justification)

**Key Learnings:**

- <Learning 1>
- <Learning 2>
```

## 7.3 Update Quick Index

If a new pattern category emerges, add it to the Quick Pattern Index section.

## 7.4 Consolidation (Automated)

Consolidation is fully automated via JSONL state files. No manual counter
updates are needed. The system auto-triggers when 10+ reviews accumulate:

- **State:** `.claude/state/consolidation.json`
- **Reviews:** `.claude/state/reviews.jsonl`
- **Auto-trigger:** Runs at session-start via `run-consolidation.js --auto`

## 7.5 Health Check (Every 10 Reviews)

Check document health metrics:

```bash
wc -l docs/AI_REVIEW_LEARNINGS_LOG.md
```

**Archival Criteria** (ALL must be true before archiving reviews):

1. Log exceeds 1500 lines
2. Reviews have been consolidated into claude.md Section 4
3. At least 10 reviews in the batch being archived
4. Archive to `docs/archive/REVIEWS_X-Y.md`

If criteria met, archive oldest consolidated batch and update Tiered Access
table.
