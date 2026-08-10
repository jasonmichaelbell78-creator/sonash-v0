# Codex Project Checkpoint

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-08-10
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Saved:** 2026-08-10 UTC

**Baseline:** `main` at `28ba0f99` (`origin/main` matched when saved)

**Open pull requests:** none

## Completed

- Infrastructure readiness PR #654 and CI hardening PR #662 are merged.
- Consolidated dependency and GitHub Actions PRs #664 and #663 are merged; the
  superseded source PRs are closed.
- Functions ESLint 10 PR #617 and coordinated root ESLint 10 PR #665 are merged;
  superseded PRs #596 and #531 are closed.
- Root dependency cleanup PR #668 is merged.
- Knip 6 replacement PR #670 is merged; superseded PR #608 is closed.
- lucide-react 1.25 replacement PR #671 is merged; superseded PR #607 is closed.
- Firebase Admin 14 PR #611 remains closed because the current Functions test
  toolchain is incompatible with Admin 14.

## Validation completed

The dependency cleanup sequence passed:

- `npm run type-check`
- `npm run lint` (no errors; existing warnings only)
- `npm run deps:unused`
- `npm test` (4,007 passed, 0 failed, 2 skipped)
- `npm run build`

The merged pull-request checks were green when the queue was closed.

## Current position

- Local `main` and `origin/main` both pointed to `28ba0f99` when this checkpoint
  was created.
- The worktree was clean before this checkpoint update.
- There were no open pull requests.
- Stale remote-tracking branches were pruned.

## Preserved local state

Four safety stashes remain locally:

- `preserve hook-generated state before merging PR 671`
- `preserve hook-generated state after Knip 6 validation`
- `preserve hook-generated state after PR 668`
- `preserve hook-generated state after PR 665`

They contain small, overlapping snapshots of hook-generated Claude state and
`llms.txt`. They were intentionally not replayed onto the newer `main` baseline
because doing so would replace current generated files with older snapshots.
Keep them until the checkpoint branch is confirmed on the remote; then review
and remove them separately if desired.

## Deferred work

- Prettier 3.9 requires a separately scoped formatting migration.
- Firebase Admin 14 remains blocked on compatible Functions test tooling.
- Review and schedule the remaining `npm audit` findings separately (2 low, 13
  moderate, and 2 high at the last audit).
- Continue the tracked pattern-compliance and App Check work in issues #495 and
  #151.

## Resume sequence

1. Start new product or maintenance work from the latest `origin/main`.
2. Keep major dependency upgrades isolated from Codex configuration work.
3. Re-run the full Node 22 validation suite before the next release checkpoint.
