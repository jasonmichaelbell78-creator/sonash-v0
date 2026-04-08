# Engineer View: teng-lin/notebooklm-py

**Analyzed:** 2026-04-06 | **Skill Version:** 4.2 | **Depth:** Standard

---

## Summary Bands

| Dimension       | Band      | Score | Detail                                                                                             |
| --------------- | --------- | ----- | -------------------------------------------------------------------------------------------------- |
| Security        | Good      | 70    | MIT license. CodeQL scanning. SECURITY.md.                                                         |
| Reliability     | Strong    | 80    | 89 test files, 90% coverage threshold, nightly e2e, RPC health check. 45% test workflow flakiness. |
| Maintainability | Good      | 72    | 47 source files. Well-organized src/. Typed APIs.                                                  |
| Documentation   | Excellent | 90    | CLAUDE.md, AGENTS.md, SKILL.md, 10 docs files, CONTRIBUTING.md, CHANGELOG.md.                      |
| Process         | Strong    | 80    | MIT, 8 CI workflows, pre-commit hooks, 3 releases, 14 topics.                                      |
| Velocity        | Good      | 70    | 3 months old, 9K stars, pushed yesterday, 12 contributors.                                         |

## Adoption Assessment

**Adoption Verdict: Trial (60)** — Trial for skill distribution pattern and
SKILL.md format study. Don't adopt as dependency (undocumented API fragility).

**Creator Verdict: Trial (70)** — High knowledge value. Autonomy Rules, skill
install, RPC health monitoring, CLAUDE.md comparison all directly applicable.

## Findings

| ID   | Severity | Category  | Title                                                         |
| ---- | -------- | --------- | ------------------------------------------------------------- |
| F001 | High     | relevance | Ships as installable Claude Code skill with skill install CLI |
| F002 | High     | relevance | Three-surface architecture (Python SDK + CLI + agentic skill) |
| F003 | Medium   | process   | Test workflow 45% failure rate (tolerated flakiness)          |
| F004 | Medium   | security  | Depends on undocumented Google RPC endpoints                  |
| F005 | Info     | design    | POSITIVE: Most sophisticated SKILL.md in all 6 repos          |
| F006 | Info     | design    | POSITIVE: 8 CI workflows — most CI-mature repo analyzed       |
| F007 | Info     | design    | POSITIVE: RPC health monitoring with auto-issue creation      |
