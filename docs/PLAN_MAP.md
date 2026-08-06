# SoNash Plan Map

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-08-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Purpose

This map is the navigation entry point for active planning documents. It is
updated whenever a document is added or changed under `docs/plans/`.

## Active Plans

| Plan                                                                        | Purpose                                                               | Status   |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------- |
| [Codex and Claude Dual-System Plan](plans/CODEX_CLAUDE_DUAL_SYSTEM_PLAN.md) | Add Codex while retaining Claude as a permanent independent workflow. | Approved |
| [Branch and Dependency Backlog Triage Plan](plans/BRANCH_TRIAGE_PLAN.md)    | Safely assess and process the open Dependabot pull-request backlog.   | Approved |
| [Implementation Plan](plans/IMPLEMENTATION_PLAN.md)                         | Track the broader implementation program.                             | Active   |
| [Lighthouse Integration Plan](plans/LIGHTHOUSE_INTEGRATION_PLAN.md)         | Integrate Lighthouse audit workflows.                                 | Active   |
| [Testing Infrastructure Plan](plans/TESTING_INFRASTRUCTURE_CHECKLIST.md)    | Define testing infrastructure work.                                   | Active   |
| [Testing User Manual](plans/TESTING_USER_MANUAL.md)                         | Document UI-testing workflows and protocols.                          | Active   |
| [Track A Admin Panel Testing Plan](plans/TRACK_A_TESTING_CHECKLIST.md)      | Define admin-panel testing coverage.                                  | Active   |

## Planning Relationships

```text
ROADMAP.md
  ├── implementation and product priorities
  └── active plan documents in docs/plans/
        ├── dual Claude/Codex environment
        │     └── branch and dependency stabilization
        ├── testing infrastructure and manual workflows
        └── targeted quality initiatives
```

## Update Rules

- Add new active plan documents to this table and `docs/README.md`.
- Update a plan's status here when it becomes complete, superseded, or archived.
- Preserve completed plans in the repository history or the documented archive
  process; do not remove them solely to reduce navigation entries.
