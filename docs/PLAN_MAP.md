# SoNash Documentation Plan Map

**Last Updated:** 2026-02-02 | **Version:** 1.8

---

## Purpose

Provide a visual map of documentation relationships, hierarchy, and
cross-document sync triggers for the SoNash project.

---

## Quick Start

1. **Find a doc**: Use Visual Hierarchy diagram below to locate documents
2. **Understand tiers**: Tier 1 = essential, Tier 5 = archive
3. **Check sync triggers**: See table at bottom for what updates require sync

## AI Instructions

When navigating documentation:

- **Start here**: Use this map to understand document relationships
- **ROADMAP.md is canonical**: All planning flows from ROADMAP.md
- **Update triggers**: Check sync table before making cross-document changes
- **Archive properly**: Move completed plans to `docs/archive/completed-plans/`

---

## Visual Hierarchy

```
                              ┌─────────────────────────────────────┐
                              │           ROADMAP.md                │
                              │    (Canonical Source of Truth)      │
                              │         v2.16 | 2026-01-20          │
                              └─────────────────┬───────────────────┘
                                                │
           ┌────────────────────────────────────┼────────────────────────────────────┐
           │                                    │                                    │
           ▼                                    ▼                                    ▼
┌─────────────────────┐            ┌─────────────────────┐            ┌─────────────────────┐
│   ROADMAP_LOG.md    │            │  SESSION_CONTEXT.md │            │   AI_WORKFLOW.md    │
│  (Completed Items)  │            │   (Current State)   │            │  (Navigation Hub)   │
└─────────────────────┘            └──────────┬──────────┘            └──────────┬──────────┘
                                              │                                   │
                                              ▼                                   ▼
                                   ┌─────────────────────┐            ┌─────────────────────┐
                                   │     CLAUDE.md       │            │  ARCHITECTURE.md    │
                                   │  (AI Instructions)  │            │   (System Design)   │
                                   └─────────────────────┘            └─────────────────────┘
```

---

## Tier 1: Documents Directly Referenced BY ROADMAP.md

```
ROADMAP.md
    │
    ├──► OPERATIONAL_VISIBILITY_SPRINT.md (Active Sprint Spec)
    │
    ├──► TESTING_PLAN.md ◄──────────────┐
    │    └─ "Update when features added" │ (Bidirectional)
    │                                    │
    ├──► LIGHTHOUSE_INTEGRATION_PLAN.md  │
    │                                    │
    ├──► MONETIZATION_RESEARCH.md (M10)  │
    │                                    │
    ├──► docs/plans/TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md (TDMS)
    │    └─ Canonical technical debt process (DEBT-XXXX IDs)
    │    └─ **ALL 18 PHASES COMPLETE** (2026-02-02)
    │    └─ 868 items consolidated into MASTER_DEBT.jsonl
    │    └─ Full intake, verification, resolution workflow
    │    └─ GitHub Action for auto-resolution on PR merge
    │
    ├──► docs/plans/CI_GATES_BLOCKING_PLAN.md (CI Quality Gates)
    │    └─ Plan to convert non-blocking CI checks to blocking
    │    └─ Phase 1 complete: 2/6 gates now blocking (2026-02-02)
    │
    └──► docs/technical-debt/ (Canonical location - ACTIVE)
         ├── MASTER_DEBT.jsonl (868 items, single source of truth)
         ├── INDEX.md (Human-readable summary)
         ├── PROCEDURE.md (System documentation)
         ├── METRICS.md / metrics.json (Dashboard integration)
         ├── PHASE_*_AUDIT.md (Audit reports for all 17 phases)
         └── views/ (by-severity, by-category, by-status, verification-queue)
```

> **Note:** `docs/aggregation/` and `docs/audits/canonical/` have been archived
> to `docs/archive/technical-debt-sources-2026-01/` (TDMS Phase 13 complete).

---

## Tier 2: Documents Referencing ROADMAP.md

```
These documents MUST check ROADMAP.md before work:

┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   CLAUDE.md         │     │   AI_WORKFLOW.md    │     │ SESSION_CONTEXT.md  │
│ "Check ROADMAP      │     │ "Start with         │     │ "Current sprint     │
│  before features"   │────►│  ROADMAP.md"        │────►│  from ROADMAP"      │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│ DOCUMENT_           │     │   docs/README.md    │     │ SESSION_DECISIONS   │
│ DEPENDENCIES.md     │     │  (Inventory Index)  │     │     .md             │
│ "Sync triggers"     │     │                     │     │ (Decision Log)      │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

---

## Tier 3: Reference & Workflow Documents

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           REFERENCE DOCUMENTS                              │
├─────────────────────┬─────────────────────┬─────────────────────┬──────────┤
│ TESTING_PLAN.md     │ PR_WORKFLOW_        │ AI_REVIEW_          │ GLOBAL_  │
│                     │ CHECKLIST.md        │ PROCESS.md          │ SECURITY │
│ • Quick Manual      │ • Mandatory PR      │ • CodeRabbit        │ _STDS.md │
│   Testing           │   Steps             │   Integration       │          │
│ • Phase Testing     │ • Pre-commit        │ • Review #N         │ • 4 Rules│
│ • Integration       │   Validation        │   Logging           │ • Strict │
└─────────────────────┴─────────────────────┴─────────────────────┴──────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ agent_docs/         │ │ MULTI_AI_REVIEW_    │ │ INCIDENT_           │
│ CODE_PATTERNS.md    │ │ COORDINATOR.md      │ │ RESPONSE.md         │
│ • 180+ patterns     │ │ • 6-category audit  │ │ • Security          │
│ • Priority tiers    │ │ • Central hub       │ │   procedures        │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

---

## Tier 5: Archive Structure

```
docs/archive/
│
├── completed-plans/           ◄── Finished implementation work
│   ├── INTEGRATED_IMPROVEMENT_PLAN.md (9 steps, 2026-01-02)
│   ├── EIGHT_PHASE_REFACTOR_PLAN.md (2025-12-30)
│   ├── DOCUMENTATION_STANDARDIZATION_PLAN.md
│   ├── sonarcloud-cleanup-sprint.md (PR 1+2 done, 3-5 deferred)
│   └── TRACK_A_TESTING_CHECKLIST.md (131 tests, 97.7%)
│
├── completed-audits/          ◄── Finished audit analyses
│   └── PHASE_5_COMPLETION_ANALYSIS.md (18/18 tasks)
│
├── completed-decisions/       ◄── Accepted ADRs
│   └── ADR-001-integrated-improvement-plan-approach.md
│
├── superseded-plans/          ◄── Replaced by ROADMAP tracking
│   ├── M1.6_SUPPORT_TAB_PLAN.md
│   └── LOCAL_RESOURCES_IMPLEMENTATION_PLAN.md
│
├── 2025-dec-reports/          ◄── December analysis (17 files)
│   ├── AGGREGATED_6MODEL_REPORT.md
│   ├── CODE_ANALYSIS_REPORT.md
│   └── [15 more]
│
├── 2026-jan-deprecated/       ◄── Superseded docs
│   └── SLASH_COMMANDS.md (→ skills format)
│
├── consolidated-2025-12-19/   ◄── Pre-standardization (9 files)
│   ├── ROADMAP_V3.md (→ ROADMAP.md v2.16)
│   └── [8 more]
│
├── source-data/               ◄── Raw content
│   ├── nashville_recovery_resources_links.md
│   └── Recovery worksheets (PDFs)
│
└── REVIEWS_*.md               ◄── Code review archives
    ├── REVIEWS_1-40.md
    ├── REVIEWS_42-60.md
    ├── REVIEWS_61-100.md
    └── REVIEWS_101-136.md
```

---

## Cross-Document Sync Triggers

| When This Changes...          | ...Update These                                    |
| ----------------------------- | -------------------------------------------------- |
| ROADMAP.md milestone complete | ROADMAP_LOG.md (archive items)                     |
| ROADMAP.md new feature        | TESTING_PLAN.md (add test coverage)                |
| ROADMAP.md sprint status      | SESSION_CONTEXT.md (current state)                 |
| TESTING_PLAN.md new section   | ROADMAP.md (cross-reference)                       |
| **TDMS Plan changes**         | **Audit skills, pr-review skill, SESSION_CONTEXT** |
| **New technical debt found**  | **MASTER_DEBT.jsonl → ROADMAP.md (via DEBT-XXXX)** |
| **Debt item resolved**        | **MASTER_DEBT.jsonl status, ROADMAP.md checkbox**  |

---

## Quick Navigation

| I Need To...              | Go To                                                   |
| ------------------------- | ------------------------------------------------------- |
| See current priorities    | ROADMAP.md                                              |
| Understand current sprint | SESSION_CONTEXT.md → OPERATIONAL_VISIBILITY_SPRINT.md   |
| Find testing guidance     | docs/TESTING_PLAN.md                                    |
| Check AI rules/patterns   | CLAUDE.md → docs/agent_docs/CODE_PATTERNS.md            |
| Review completed work     | docs/archive/completed-plans/                           |
| **Manage technical debt** | **docs/plans/TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md** |
| Find technical debt       | docs/technical-debt/MASTER_DEBT.jsonl (canonical)       |
| View debt metrics         | docs/technical-debt/METRICS.md or metrics.json          |

---

## Version History

| Version | Date       | Description                                                  |
| ------- | ---------- | ------------------------------------------------------------ |
| 1.7     | 2026-02-01 | TDMS ALL 17 PHASES COMPLETE - System fully operational       |
| 1.6     | 2026-01-31 | TDMS Phases 6-8 complete, Phase 9b added (audit integration) |
| 1.5     | 2026-01-30 | TDMS Phase 4 complete, validation scripts built              |
| 1.4     | 2026-01-30 | TDMS Phase 3 complete, intake scripts built                  |
| 1.3     | 2026-01-30 | TDMS Phase 2 complete, PROCEDURE.md created                  |
| 1.2     | 2026-01-30 | TDMS Phase 1 complete, docs/technical-debt/ now active       |
| 1.1     | 2026-01-30 | Added TDMS plan references, updated sync triggers            |
| 1.0     | 2026-01-20 | Initial plan map created after document archival             |
