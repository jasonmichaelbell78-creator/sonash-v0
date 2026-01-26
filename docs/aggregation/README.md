# Aggregation Documents

**Purpose:** Consolidated findings from multi-AI audits, aggregated into
actionable items for ROADMAP.md integration.

---

## AI Instructions

When working with aggregation:

- **Use TECHNICAL_DEBT_MASTER.md**: This folder is largely superseded
- **Historical reference only**: MASTER_ISSUE_LIST.md preserved for
  cross-reference
- **New findings**: Add to TECHNICAL_DEBT_MASTER.md, not here

---

## Contents

| Document                                           | Description                               | Status          |
| -------------------------------------------------- | ----------------------------------------- | --------------- |
| [MASTER_ISSUE_LIST.md](./MASTER_ISSUE_LIST.md)     | 283 findings from 6-model multi-AI audits | **SUPERSEDED**  |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Execution plan for aggregated findings    | Active (legacy) |
| ROADMAP_INTEGRATION.md                             | Prioritized backlog (was ROADMAP v2.6)    | **Archived**    |

> **⚠️ IMPORTANT (Session #98):** MASTER_ISSUE_LIST.md is now **superseded** by
> [TECHNICAL_DEBT_MASTER.md](../TECHNICAL_DEBT_MASTER.md) which consolidates:
>
> - Comprehensive Audit (2026-01-24): 112 valid findings
> - This list (2026-01-17): Cross-referenced, many duplicates identified
> - ROADMAP inline items (CANON, DEDUP, EFF, PERF)
>
> **Use TECHNICAL_DEBT_MASTER.md for current tech debt tracking.**

> **Note:** ROADMAP_INTEGRATION.md was archived (2026-01-24) as ROADMAP.md has
> been reorganized to v3.9 with the full expansion integration. See
> [archived version](../archive/2026-jan-deprecated/ROADMAP_INTEGRATION.md).

---

## Workflow

1. **Multi-AI Audits** → Generate raw findings (stored in `docs/reviews/`)
2. **Aggregation** → Consolidate into `MASTER_ISSUE_LIST.md`
3. **Prioritization** → Create `ROADMAP_INTEGRATION.md` with effort/priority
4. **Execution** → Track in `ROADMAP.md` milestones

---

## Related Documents

- [ROADMAP.md](../../ROADMAP.md) - Canonical source of truth
- [Multi-AI Review Coordinator](../MULTI_AI_REVIEW_COORDINATOR.md) - Audit hub
- [Audit Tracker](../AUDIT_TRACKER.md) - Audit completion tracking

---

## Version History

| Version | Date       | Description                    |
| ------- | ---------- | ------------------------------ |
| 1.0     | 2026-01-20 | Initial README for aggregation |
