# Engineer View: karpathy/autoresearch

**Analyzed:** 2026-04-06 | **Skill Version:** 4.1 | **Depth:** Standard

---

## Summary Bands

| Dimension       | Band      | Score | Detail                                                                                    |
| --------------- | --------- | ----- | ----------------------------------------------------------------------------------------- |
| Security        | Weak      | 25    | No license. No input validation. GPU code with subprocess. Trusted single-user design.    |
| Reliability     | Low       | 30    | No tests. No CI. Crash recovery is agent-level ("read stack trace, attempt fix, revert"). |
| Maintainability | Excellent | 90    | 3 files, ~1200 lines. Radically simple by design. Every line earns its place.             |
| Documentation   | Strong    | 80    | README (92 lines) + program.md (114 lines) = complete. No wasted docs.                    |
| Process         | Weak      | 20    | No license, no releases, no CI, no tests, 8 contributors. Intentionally minimal.          |
| Velocity        | Moderate  | 45    | 31 days old, 67K stars. 1 commit recently. Ship-and-stabilize pattern.                    |

## Key Stats

| Metric        | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Stars         | 66,911                                                     |
| Forks         | 9,611 (14.4% fork ratio — very high, many community ports) |
| Contributors  | 8                                                          |
| Files         | 8 (3 meaningful: prepare.py, train.py, program.md)         |
| Lines of Code | ~1,200 (389 prepare + 630 train + 114 program + 92 README) |
| Tests         | 0                                                          |
| CI Workflows  | 0                                                          |
| Releases      | 0                                                          |
| License       | None                                                       |
| Open Issues   | 173 (mostly community port requests)                       |

## Absence Pattern: Intentional Minimalism

Not a failure of process — a deliberate architectural choice. The 3-file design
IS the statement. Missing infrastructure (tests, CI, releases) is consistent
with "this is a research artifact, not a library." The 9,611 forks are the
distribution mechanism — Karpathy ships the reference, community forks adapt.

## Adoption Assessment (dual-lens)

| Factor              | Rating   | Notes                                                 |
| ------------------- | -------- | ----------------------------------------------------- |
| WR-01 Activity      | Moderate | Pushed 11 days ago. Low commit frequency post-launch. |
| WR-02 Community     | Low      | 8 contributors. 173 issues, mostly unaddressed.       |
| WR-03 Quality       | Mixed    | Code quality excellent. No infrastructure quality.    |
| WR-04 Security      | Weak     | No license, no validation, trusted-user-only design.  |
| WR-05 Documentation | Strong   | README + program.md = complete understanding.         |
| WR-06 Maintenance   | Low      | Karpathy-style: ship reference, don't maintain.       |

**Adoption Verdict: Extract (55)** Extract the methodology (program.md pattern,
3-file architecture, fixed-budget). Do not adopt as infrastructure.

**Creator Verdict: Extract (72)** High knowledge value. The simplicity
criterion, agent instruction pattern, and fixed-budget experimentation are
directly applicable to JASON-OS design decisions.

## Findings

| ID   | Severity | Category    | Title                                                                                  |
| ---- | -------- | ----------- | -------------------------------------------------------------------------------------- |
| F001 | High     | license     | No license — 9,611 forks in legal gray zone                                            |
| F002 | Medium   | process     | 173 open issues, mostly unaddressed community ports                                    |
| F003 | Medium   | reliability | Zero tests, zero CI                                                                    |
| F004 | Low      | security    | No input validation on agent-modified train.py (by design)                             |
| F005 | Info     | design      | POSITIVE: 3-file architecture is a masterclass in constraint-driven design             |
| F006 | Info     | design      | POSITIVE: program.md is the most effective agent instruction file in any analyzed repo |
| F007 | Info     | design      | POSITIVE: Fixed 5-min budget makes all experiments directly comparable                 |
| F008 | Info     | design      | POSITIVE: Simplicity criterion encoded in agent instructions                           |
