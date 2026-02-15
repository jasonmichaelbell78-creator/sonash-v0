<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# TDMS Integration (Step 6.5)

When items are deferred during PR review, they MUST be ingested into the
Technical Debt Management System (TDMS) for tracking.

## 6.5.1 For Each Deferred Item

Use the `/add-debt` skill to create TDMS entries:

```
/add-debt
```

The skill will prompt for required fields:

- **ID**: Auto-generated DEBT-XXXX
- **Title**: Brief description of the issue
- **File/Line**: Location from the review
- **Severity**: Map from review category:
  - CRITICAL -> S0 (Blocker)
  - MAJOR -> S1 (Critical)
  - MINOR -> S2 (Major)
  - TRIVIAL -> S3 (Minor)
- **Source**: `pr-review-#N` (review number)
- **Reason**: Why deferred

## 6.5.2 Tracking Resolution

When the deferred issue is later fixed:

1. Include `DEBT-XXXX` in the PR body's "Technical Debt" section
2. The `resolve-debt.yml` workflow auto-resolves it on merge
3. Or use: `node scripts/debt/resolve-item.js DEBT-XXXX --pr <PR#>`

## 6.5.3 Quick Reference

```bash
# Add deferred item manually
node scripts/debt/intake-pr-deferred.js <JSONL_FILE>

# View all PR-review sourced items
grep '"source":"pr-review' docs/technical-debt/MASTER_DEBT.jsonl

# Resolve when fixed
node scripts/debt/resolve-item.js DEBT-XXXX --pr 123
```

**See**: `docs/technical-debt/PROCEDURE.md` for full TDMS workflow.
