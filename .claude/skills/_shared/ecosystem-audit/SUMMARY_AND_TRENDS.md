# Ecosystem Audit: Summary & Trends

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-25
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Shared summary, trend report, and verification templates for all ecosystem audit
skills.

**Usage:** Add this to your ecosystem audit SKILL.md:

```markdown
## Phase 4: Summary & Actions

> Read `.claude/skills/_shared/ecosystem-audit/SUMMARY_AND_TRENDS.md` for the
> summary template, trend report template, and verification re-run template.
```

---

## Audit Summary Template (MUST)

After all findings are reviewed, present:

```
━━━ Audit Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Composite: {grade} ({score}/100)  |  {trend}

Decisions:
  Fixed:      {count} findings
  Deferred:   {count} findings -> {count} DEBT entries created
  Skipped:    {count} findings
  Suppressed: {count} findings

Patches Applied: {count}/{total patchable}

Top 3 Impact Areas:
  1. {category} -- {brief description}
  2. {category} -- {brief description}
  3. {category} -- {brief description}

Next Steps:
  - {actionable recommendation based on worst categories}
  - {actionable recommendation}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### TDMS Batch Summary

If any DEBT entries were created, list them after the summary:

```
TDMS Batch Summary:
  - DEBT-XXXX: {title} (S1)
  - DEBT-XXXX: {title} (S2)
```

### Report Persistence (MUST)

Write the summary to `.claude/tmp/{audit-name}-audit-report-{YYYY-MM-DD}.md`.

---

## Trend Report Template (SHOULD -- skip if no history)

Trend history path convention:
`.claude/state/{audit-name}-ecosystem-audit-history.jsonl` (one JSONL entry per
run, written by the audit script automatically).

If no previous entries exist: "First audit run -- no trend data available." Skip
to next phase.

If history exists, show improvement/regression:

```
━━━ Trend Report ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Composite Trend: {sparkline}  {direction} ({delta})

Improving:
  {category}: {before} -> {after} (+{delta})

Declining:
  {category}: {before} -> {after} ({delta})

Stable:
  {category}: {score} (no change)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Persistent Poor Categories

Flag categories that have been poor across 2+ consecutive runs: "{category} has
been {rating} for {N} consecutive runs."

---

## Verification Re-run Template (SHOULD)

Re-run the audit to verify fixes improved the score:

1. Run the audit script again
2. Compare new vs original score

```
━━━ Self-Audit Verification ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before: {previous_grade} ({previous_score}/100)
After:  {new_grade} ({new_score}/100)
Delta:  {+/-delta} points

Improved Categories:
  {category}: {before} -> {after} (+{delta})

Remaining Issues:
  {count} findings still open (deferred/skipped)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If score improved, append to trend history. If score did not improve,
investigate -- fixes may have introduced new findings.

---

## Version History

| Version | Date       | Description                             |
| ------- | ---------- | --------------------------------------- |
| 1.0     | 2026-03-25 | Extracted from 8 ecosystem audit skills |
