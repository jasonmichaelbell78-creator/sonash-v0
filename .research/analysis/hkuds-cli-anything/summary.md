# Engineer View: HKUDS/CLI-Anything

**Analyzed:** 2026-04-06 | **Skill Version:** 4.1 | **Depth:** Standard

---

## Summary Bands

| Dimension       | Band       | Score | Detail                                                                                                                                            |
| --------------- | ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security        | Needs Work | 58    | Apache-2.0. 99+ subprocess calls, 0 shell=True. 3 injection vectors (SoX, Intelwatch, GIMP Script-Fu) from v2.0 likely still present. No SAST CI. |
| Reliability     | Good       | 70    | 74 test files, 1,839+ tests claimed. No CI enforcement. Tests exist but aren't gated.                                                             |
| Maintainability | Good       | 72    | Consistent harness pattern across 35 CLIs. repl_skin.py copy-paste drift risk. No monorepo coordination (0 conftest.py).                          |
| Documentation   | Strong     | 82    | HARNESS.md (7-phase SOP), CONTRIBUTING.md, SECURITY.md with threat model, 37 SKILL.md files, i18n (CN + JA READMEs).                              |
| Process         | Moderate   | 52    | Apache-2.0, CONTRIBUTING.md, active PR merging. 1 release. No test CI. Bus factor: 1 maintainer with merge authority.                             |
| Velocity        | Very High  | 95    | 29 days old, 28K stars, pushed today, 30+ contributors, daily community PRs.                                                                      |

## Key Stats (v4.1 refresh)

| Metric        | v2.0 (2026-04-03) | v4.1 (2026-04-06) | Delta            |
| ------------- | ----------------- | ----------------- | ---------------- |
| Stars         | 27,589            | 28,591            | +1,002 in 3 days |
| Forks         | 2,586             | 2,716             | +130             |
| CLI Harnesses | 33                | 35                | +2 (exa, rms?)   |
| Files         | 796               | 831               | +35              |
| Open Issues   | ~55               | 73                | +18              |
| Repomix       | 3.1MB             | 3.3MB             | +200KB           |

## Absence Patterns

| Pattern         | Confidence | Evidence                                                                                                       |
| --------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| SECURITY_FACADE | Medium     | Real mitigations exist (allowlists, escaping), but no SAST, no security CI. 3 known injection vectors unfixed. |
| TEST_THEATER    | Low        | Tests are real and numerous, but CI only deploys docs pages. No test gating on PRs.                            |

## Adoption Assessment (dual-lens)

| Factor              | Rating     | Notes                                                  |
| ------------------- | ---------- | ------------------------------------------------------ |
| WR-01 Activity      | Very High  | Daily commits, pushed today                            |
| WR-02 Community     | Good       | 30+ contributors, active PRs                           |
| WR-03 Quality       | Moderate   | Good patterns, no CI enforcement                       |
| WR-04 Security      | Needs Work | 3 injection vectors, no SAST                           |
| WR-05 Documentation | Strong     | HARNESS.md, SECURITY.md, CONTRIBUTING.md, SKILL.md x37 |
| WR-06 Maintenance   | Moderate   | 1 release, bus factor 1, growing faster than gates     |

**Adoption Verdict: Trial (62)** Trial for methodology extraction and Claude
Code plugin study. Don't adopt as infrastructure dependency until CI matures and
injection vectors are fixed.

**Creator Verdict: Trial (68)** High knowledge value — HARNESS.md methodology,
SKILL.md format comparison, plugin marketplace, registry pattern all directly
inform JASON-OS.

## Findings Summary

22 findings from v2.0 analysis (4 dimension agents). Key items:

**High (5):** No SAST, no test CI, SoX effect injection, Intelwatch arg
passthrough, GIMP Script-Fu injection.

**Medium (7):** XXE in shotcut lxml, no path confinement, immature release
cadence, bus factor 1, inconsistent credentials, no monorepo coordination,
documentation staleness (test counts disagree).

**Low (6):** repl_skin drift, missing CoC, no static analysis, missing
**main**.py, CONTRIBUTING doesn't link HARNESS.md, stale HARNESS.md copy.

**Positive (4):** Subprocess safety strong (0 shell=True), HARNESS.md is novel
methodology, viral growth, Claude Code plugin pioneer.

See `_v3-archive/summary.md` for full findings detail.
