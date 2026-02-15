<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Triage & Roadmap Integration Guide

After TDMS intake completes, triage new items into the roadmap using this guide.

## 1. Review New Items

Check the newly added DEBT-XXXX items:

```bash
# View recent additions (last 50 items by ID)
tail -50 docs/technical-debt/MASTER_DEBT.jsonl | jq -r '[.id, .severity, .category, .title[:60]] | @tsv'
```

## 2. Priority Scoring

Beyond S0-S3 severity, consider these factors for prioritization:

| Factor         | Weight | Description                                     |
| -------------- | ------ | ----------------------------------------------- |
| Severity       | 40%    | S0=100, S1=50, S2=20, S3=5                      |
| Cross-domain   | 20%    | Items flagged by multiple audits get +50%       |
| Effort inverse | 20%    | E0=4x, E1=2x, E2=1x, E3=0.5x (quick wins first) |
| Dependency     | 10%    | Blockers for other items get +25%               |
| File hotspot   | 10%    | Files with 3+ findings get +25%                 |

**Priority Score Formula:**

```
score = (severity x 0.4) x (cross_domain_mult x 0.2) x (effort_inv x 0.2) x (dep_mult x 0.1) x (hotspot_mult x 0.1)
```

## 3. Track Assignment

New items are auto-assigned based on category + file patterns:

| Category      | File Pattern            | Track    |
| ------------- | ----------------------- | -------- |
| security      | \*                      | Track-S  |
| performance   | \*                      | Track-P  |
| process       | \*                      | Track-D  |
| refactoring   | \*                      | M2.3-REF |
| documentation | \*                      | M1.5     |
| code-quality  | scripts/, .claude/      | Track-E  |
| code-quality  | .github/                | Track-D  |
| code-quality  | tests/                  | Track-T  |
| code-quality  | functions/              | M2.2     |
| code-quality  | components/, lib/, app/ | M2.1     |

**View current assignments:**

```bash
cat docs/technical-debt/views/unplaced-items.md
```

## 4. Update ROADMAP.md

For S0/S1 items that need immediate attention:

```markdown
## Track-S: Security Technical Debt

- [ ] DEBT-0875: Firebase credentials written to disk (S1) **NEW**
- [ ] DEBT-0876: Missing App Check validation (S1) **NEW**
```

For bulk items by track:

```markdown
- [ ] DEBT-0869 through DEBT-0880: Process automation gaps (S2, bulk)
```

## 5. Consistency Check

Verify all references are valid:

```bash
node scripts/debt/sync-roadmap-refs.js --check-only
```

Reports:

- Orphaned refs (in ROADMAP but not in MASTER_DEBT)
- Unplaced items (in MASTER_DEBT but not in ROADMAP)
- Status mismatches (marked done but not RESOLVED)

## 6. Review Cadence

| Trigger                   | Action                             |
| ------------------------- | ---------------------------------- |
| After comprehensive audit | Full triage of all new items       |
| After single-domain audit | Triage items in that category only |
| Weekly (if no audits)     | Check unplaced-items.md for drift  |
| Before sprint planning    | Review S0/S1 items for inclusion   |
