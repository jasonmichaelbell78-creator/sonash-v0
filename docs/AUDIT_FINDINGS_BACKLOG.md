# Audit Findings Backlog

**Document Version**: 3.0
**Created**: 2025-12-30
**Last Updated**: 2026-01-05
**Status**: ACTIVE
**Total Items**: 1 (1-2 hours estimated effort)

---

## Quick Start

- **Purpose**: Track CANON findings from multi-AI audits for systematic remediation
- **Add new findings**: Use the standard format in [How to Use This Backlog](#how-to-use-this-backlog)
- **Triage items**: Sort by severity (S1→S2→S3), estimate effort (E0-E3)
- **Process workflow**: See [INTEGRATED_IMPROVEMENT_PLAN.md](./INTEGRATED_IMPROVEMENT_PLAN.md) Step 4B
- **Related docs**: [AI_REVIEW_PROCESS.md](./AI_REVIEW_PROCESS.md), [MULTI_AI_REVIEW_COORDINATOR.md](./MULTI_AI_REVIEW_COORDINATOR.md)

---

## Purpose & Scope

### What This Document Covers

This document tracks non-blocking improvements, tech debt, and polish work discovered during the **Multi-AI Audit process** (Step 4 of the Integrated Improvement Plan). Items here are queued for remediation in Step 4B or deferred to ROADMAP.md M2.

**Primary Goal**: Maintain a prioritized backlog of CANON findings from multi-AI audits.

**Scope**:
- **In Scope**: CANON-verified items from audit aggregation, non-blocking improvements
- **Out of Scope**: Critical bugs (address immediately), blocking issues, security vulnerabilities (address in remediation sprint)

**Related To**:
- [INTEGRATED_IMPROVEMENT_PLAN.md](./INTEGRATED_IMPROVEMENT_PLAN.md) - Master improvement roadmap
- [AI_REVIEW_LEARNINGS_LOG.md](./AI_REVIEW_LEARNINGS_LOG.md) - Review learnings
- [MULTI_AI_REVIEW_COORDINATOR.md](./MULTI_AI_REVIEW_COORDINATOR.md) - Audit coordination

**Key Principle**: Items here are tracked for systematic remediation. Critical/Major items flow to Step 4B; Minor/Trivial items may be deferred to M2.

---

## Backlog Categories

Categories align with the 6-category audit framework:

| Category | Description | Typical Severity |
|----------|-------------|------------------|
| **Code Quality** | Refactoring, cleanup, consistency, type safety | S2-S3 |
| **Security** | Auth, input validation, secrets (non-critical) | S1-S2 |
| **Performance** | Bundle size, rendering, data fetching | S2-S3 |
| **Refactoring** | Architecture, duplication, god objects | S2-S3 |
| **Documentation** | Cross-refs, staleness, coverage gaps | S2-S3 |
| **Process** | CI/CD, hooks, scripts, automation | S2-S3 |

**Severity Scale**:
- **S0 - Critical**: Security breach, data loss risk → Address immediately (NOT for backlog)
- **S1 - Major**: Significant bugs, auth issues → Step 4B remediation
- **S2 - Medium**: Quality issues, tech debt → Step 4B or M2
- **S3 - Minor**: Polish, nice-to-have → M2 or skip

**Effort Scale**:
- **E0**: < 30 minutes
- **E1**: 30 min - 2 hours
- **E2**: 2-4 hours
- **E3**: 4+ hours (consider breaking down)

---

## How to Use This Backlog

### Adding Items (During Audit)

When CANON findings are aggregated from Step 4, add them here with this format:

```markdown
### [Category] Item Name

**CANON-ID**: CANON-XXX (from aggregator output)
**Severity**: S1/S2/S3
**Effort**: E0/E1/E2/E3
**Source**: Step 4.2.X (Category Audit)
**Status**: PENDING | IN_PROGRESS | DONE | DEFERRED

**Description**:
Brief description of the finding.

**Files affected**:
- file1.ts:123
- file2.tsx:45

**Implementation notes**:
- Step 1: ...
- Step 2: ...

**Acceptance criteria**:
- [ ] Criterion 1
- [ ] Criterion 2
```

### Processing Items (Step 4B Remediation)

1. Sort by severity (S1 → S2 → S3)
2. Group by category for efficient PRs
3. Execute via PR_PLAN_JSON from aggregator
4. Update status as work progresses
5. Move completed items to "Completed" section

### Deferring Items (to ROADMAP.md M2)

Items may be deferred if:
- Requires architectural changes beyond scope (document in ADR)
- Blocked by external dependency (document blocker)
- Risk/effort ratio unfavorable (S3/E3 items)

Deferred items MUST be:
- Added to ROADMAP.md M2 backlog
- Marked DEFERRED here with reason
- Logged in AI_REVIEW_LEARNINGS_LOG.md

---

## Backlog Items

### [Code Quality] Retrofit SSR-Safe localStorage

**CANON-ID**: LEGACY-001 (pre-audit discovery)
**Severity**: S3
**Effort**: E1 (1-2 hours)
**Source**: Phase 3 (PR3) - Error guards and SSR safety
**Status**: PENDING

**Description**:
Replace direct `localStorage` calls with SSR-safe utility functions. Existing code works fine (client-only components), but using utilities adds future-proofing.

**Why deferred**:
- Existing code works fine (client-only components)
- Not causing SSR crashes
- Defensive improvement, not fixing a bug

**Value**:
- Consistent use of SSR-safe utilities across codebase
- Future-proofs against accidental SSR rendering
- Removes 11 direct `localStorage` calls

**Risk if skipped**:
- Low - existing code won't break
- If components become server-rendered in the future, could cause SSR crashes
- New developers might copy old pattern instead of using utilities

**Files affected**:
- `components/notebook/hooks/use-smart-prompts.ts` (4 usages)
- `components/notebook/pages/today-page.tsx` (5 usages)
- `lib/utils/anonymous-backup.ts` (2 usages)

**Implementation notes**:
1. Replace `localStorage.getItem()` with `getLocalStorage()` from `lib/utils/storage.ts`
2. Replace `localStorage.setItem()` with `setLocalStorage()`
3. Replace `localStorage.removeItem()` with `removeLocalStorage()`
4. For JSON operations, use `getLocalStorageJSON<T>()` and `setLocalStorageJSON<T>()`
5. Update imports: `import { getLocalStorage, setLocalStorage, ... } from '@/lib/utils/storage'`
6. Test each file individually (no regressions expected)

**Acceptance criteria**:
- [ ] `grep -rn "localStorage\." components/ lib/ --include="*.ts" --include="*.tsx" --exclude="lib/utils/storage.ts"` → 0 results
- [ ] All existing functionality works (smart prompts, journal temp save, anonymous backup)
- [ ] No new TypeScript errors

---

## Backlog Statistics

| Category | Count | Effort |
|----------|-------|--------|
| Code Quality | 1 | E1 |
| Security | 0 | - |
| Performance | 0 | - |
| Refactoring | 0 | - |
| Documentation | 0 | - |
| Process | 0 | - |

**Total items**: 1
**Total estimated effort**: 1-2 hours

---

## Completed Items

*(Items completed during Step 4B remediation move here)*

---

## Rejected Items (Won't Do)

### [Type Safety] Strengthen Index Signature Types

**Why rejected**:
- Index signatures are appropriate for Firestore dynamic data
- Not a bug or vulnerability
- Would add complexity without value
- Firestore documents have flexible schemas
- Marked as "VERIFIED - Acceptable" in Phase 3 review

**Decision**: Won't fix - this is not a problem

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 3.0 | 2026-01-05 | Renamed from POST_PHASE_8_BACKLOG.md; updated for Step 4 audit framework; aligned categories with 6-category audit | Claude |
| 2.0 | 2026-01-02 | Standardized structure per Phase 4 migration | Claude |
| 1.0 | 2025-12-30 | Initial backlog document | Development Team |

---

## AI Instructions

**For AI Assistants managing this backlog:**

1. **Add CANON findings** from Step 4 aggregator output
2. **Use the standard format** with CANON-ID when adding items
3. **Update statistics** when adding/removing items
4. **Move completed items** to the "Completed" section (don't delete)
5. **Document rejections** in the "Rejected" section with rationale
6. **Cross-reference** items with AI_REVIEW_LEARNINGS_LOG.md for patterns

**When adding an item:**
```bash
# 1. Add the item using the standard format with CANON-ID
# 2. Update the statistics section
# 3. Commit with descriptive message
git add docs/AUDIT_FINDINGS_BACKLOG.md
git commit -m "docs: Add CANON-XXX to audit findings backlog"
```

---

## Update Triggers

**Update this document when:**
- New CANON finding discovered during Step 4 audit
- Item is completed and needs to move to Completed section
- Item is rejected and needs documentation
- Statistics need updating
- Item is deferred to ROADMAP.md M2

---

**END OF DOCUMENT**
