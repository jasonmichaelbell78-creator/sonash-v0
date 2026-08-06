# Branch and Dependency Backlog Triage Plan

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-08-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Approval:** Approved

**Scope:** 14 open Dependabot pull requests as of 2026-08-06.

## Safety Rules

- Preserve the existing unrelated `package-lock.json` worktree change until it
  is identified and intentionally handled.
- Do not combine dependency work with Codex configuration work.
- Do not delete remote branches or close pull requests without explicit
  approval.
- Use isolated branches or worktrees for major dependency upgrades.

## Current Groups

| Group                   | Pull requests                | Treatment                                                                                     |
| ----------------------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| Root minor/patch batch  | #651                         | Validate first; it is current with `main` and updates 28 packages.                            |
| Root major updates      | #596, #531, #608, #607       | Review and validate separately; several are conflicted or behind.                             |
| Functions major updates | #617, #611                   | Validate Functions build/tests independently; Firebase Admin 14 needs breaking-change review. |
| GitHub Actions updates  | #639, #641, #640, #578, #577 | Consolidate or recreate against current `main`, then validate workflow behavior.              |
| MCP script updates      | #626, #646                   | Rebase/recreate against current `main`, then validate MCP scripts and locks.                  |

## Workflow

1. Record current PR metadata, checks, merge state, base SHA, changed files,
   overlap, and risk in `docs/BRANCH_TRIAGE.md`.
2. Determine whether grouped Dependabot PRs supersede individual PRs.
3. Validate routine current batches with the relevant install, lint, type check,
   test, build, and security checks.
4. Recreate stale Dependabot PRs where possible; avoid manual conflict repair
   when Dependabot can safely regenerate the branch.
5. Process major upgrades individually with a compatibility review and focused
   test evidence.
6. Close only confirmed superseded PRs after their replacement has passed.
7. Add a recurring, Claude/Codex-neutral dependency-triage workflow to prevent
   the backlog from reaccumulating.

## Validation Tiers

- Root routine updates: install, `npm run lint`, `npm run type-check`, relevant
  tests, and build.
- GitHub Actions updates: workflow syntax plus review of affected triggers,
  permissions, and action compatibility.
- Functions updates: Functions install, lint, build, unit tests, and emulator or
  integration validation where feasible.
- Major upgrades: all applicable checks plus a documented compatibility review.
