# Unplaced Technical Debt Items

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-01
**Status:** ACTIVE
**Generated:** 2026-02-01
**Total Unplaced:** 0
<!-- prettier-ignore-end -->

---

## Summary

All 868 technical debt items have been assigned to roadmap tracks via Phase 18
implementation.

## Assignment Distribution

| Track    | Count | Description                       |
| -------- | ----- | --------------------------------- |
| M2.1     | 465   | Code Quality (components/lib/app) |
| Track-E  | 207   | Solo Developer Automations        |
| Track-S  | 48    | Security Technical Debt           |
| M2.2     | 28    | Monitoring/Backend                |
| Track-D  | 22    | CI Reliability & Automation       |
| M1.5     | 22    | Quick Wins/Documentation          |
| Track-T  | 22    | Testing Infrastructure            |
| Track-P  | 17    | Performance Critical              |
| M2.3-REF | 15    | Infrastructure Refactoring        |
| M4.5     | 8     | Security & Privacy Features       |
| Other    | 14    | Pre-existing specific refs        |

## Assignment Rules

Items were assigned using the following mapping:

| Category      | File Pattern                    | Track    |
| ------------- | ------------------------------- | -------- |
| security      | \*                              | Track-S  |
| performance   | \*                              | Track-P  |
| process       | \*                              | Track-D  |
| refactoring   | \*                              | M2.3-REF |
| documentation | \*                              | M1.5     |
| code-quality  | scripts/                        | Track-E  |
| code-quality  | .claude/                        | Track-E  |
| code-quality  | .github/                        | Track-D  |
| code-quality  | tests/                          | Track-T  |
| code-quality  | functions/                      | M2.2     |
| code-quality  | components/, lib/, app/, hooks/ | M2.1     |
| code-quality  | docs/                           | M1.5     |
| code-quality  | (default)                       | M2.1     |

---

## Phase 18 Implementation

This view is the Phase 6 deliverable from the original TDMS plan. It was
implemented as part of Phase 18 (Corrective) on 2026-02-01.

- See [TDMS Plan](../../plans/TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md) for full
  details
- See [FINAL_SYSTEM_AUDIT.md](../FINAL_SYSTEM_AUDIT.md) for gap documentation
