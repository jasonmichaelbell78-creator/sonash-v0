# Engineer View: public-apis/public-apis

**Analyzed:** 2026-04-06 | **Skill Version:** 4.1 | **Depth:** Standard

---

## Summary Bands

| Dimension       | Band     | Score | Detail                                                                                                                |
| --------------- | -------- | ----- | --------------------------------------------------------------------------------------------------------------------- |
| Security        | Good     | 65    | MIT license. Python validation scripts with no injection vectors. OpenSSF 2.3/10 (low for hygiene, low blast radius). |
| Reliability     | Moderate | 50    | 3 CI workflows + tests (638 lines). But 1 commit/90 days — maintenance declining.                                     |
| Maintainability | Moderate | 55    | 1,490 entries in single README. Format validation prevents structural decay. Link rot inevitable.                     |
| Documentation   | Strong   | 75    | CONTRIBUTING.md with structured format. 40+ categories. 13 topics. PR/issue templates.                                |
| Process         | Weak     | 25    | 1,197 open issues. PR approval bottleneck (14/15 runs action_required). Commercial overlay.                           |
| Velocity        | Very Low | 10    | 1 commit in 90 days. 10 years old. Celebrity stagnation with commercial capture.                                      |

## Key Stats

| Metric         | Value                                        |
| -------------- | -------------------------------------------- |
| Stars          | 419,594                                      |
| Forks          | 45,644                                       |
| API Entries    | ~1,490 across 40+ categories                 |
| Python Scripts | 1,193 lines (format.py + links.py + tests)   |
| CI Workflows   | 3 (push test, package test, link validation) |
| Test Lines     | 638 (466 format + 172 links)                 |
| License        | MIT                                          |
| Age            | 10 years                                     |
| Open Issues    | 1,197                                        |

## Absence Pattern: Celebrity Stagnation (with Infrastructure)

Same trajectory as codecrafters (massive engagement + minimal maintenance), but
with better infrastructure. Format validation scripts + CI workflows + tests
prove that **automation alone doesn't prevent stagnation** — you also need
active maintenance. The PR approval bottleneck (14/15 action_required) means
community contributions can't land even when automation passes.

## Adoption Assessment (dual-lens)

| Factor              | Rating   | Notes                                                        |
| ------------------- | -------- | ------------------------------------------------------------ |
| WR-01 Activity      | Very Low | 1 commit/90d. 19 days since last push.                       |
| WR-02 Community     | Stagnant | 30 contributors historically. 1,197 open issues unprocessed. |
| WR-03 Quality       | Moderate | Format validation is real. Content freshness is unknown.     |
| WR-04 Security      | Moderate | MIT license. OpenSSF 2.3/10 but low blast radius.            |
| WR-05 Documentation | Strong   | CONTRIBUTING.md, templates, structured format.               |
| WR-06 Maintenance   | Very Low | Celebrity stagnation with commercial capture.                |

**Adoption Verdict: Extract (42)** Extract the link validation workflow pattern
and structured catalog format. Content itself is increasingly stale.

**Creator Verdict: Extract (48)** Second celebrity stagnation data point (with
codecrafters). Proves validation without maintenance is insufficient. Link
checker is the concrete extractable.

## Findings

| ID   | Severity | Category        | Title                                                                        |
| ---- | -------- | --------------- | ---------------------------------------------------------------------------- |
| F001 | High     | velocity        | Celebrity stagnation — 420K stars, 1 commit/90d                              |
| F002 | High     | process         | PR approval bottleneck — 14/15 runs action_required                          |
| F003 | Medium   | security        | OpenSSF Scorecard 2.3/10                                                     |
| F004 | Medium   | process         | Commercial capture — APILayer sponsorship before content                     |
| F005 | Medium   | maintainability | Bus factor 2 — top 2 contributors dominate                                   |
| F006 | Low      | relevance       | POSITIVE: Link validation via scheduled workflow — transferable pattern      |
| F007 | Low      | relevance       | POSITIVE: Format validation scripts (format.py + links.py + 638 lines tests) |
| F008 | Info     | engagement      | Massive absolute engagement — 420K stars, top-20 GitHub repo                 |
