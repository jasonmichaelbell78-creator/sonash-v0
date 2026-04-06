# Engineer View: codecrafters-io/build-your-own-x

**Analyzed:** 2026-04-06 | **Skill Version:** 4.1 | **Depth:** Standard

---

## Summary Bands

| Dimension       | Band     | Score | Detail                                                                                                                  |
| --------------- | -------- | ----- | ----------------------------------------------------------------------------------------------------------------------- |
| Security        | N/A      | —     | Markdown-only repo. No executable code, no dependencies.                                                                |
| Reliability     | Low      | 25    | 1 commit in 90 days. No releases. No CI producing artifacts.                                                            |
| Maintainability | Moderate | 50    | Single README.md with clear taxonomy. Easy to understand, hard to maintain at scale (390 links, no link validation).    |
| Documentation   | Strong   | 80    | The repo IS documentation. 31 categories, 390 curated links, clear submission criteria in issue template.               |
| Process         | Weak     | 20    | No LICENSE file (CC0 declared inline only). No CONTRIBUTING.md. No branch protection. 462 open issues.                  |
| Velocity        | Very Low | 10    | 1 commit in last 90 days. Celebrity stagnation pattern. Commercial ownership (codecrafters-io) with minimal investment. |

## Absence Pattern: Celebrity Stagnation

486K stars with 1 commit/90 days. Acquired by codecrafters-io from original
creator Daniel Stefanovic. Commercial banner added. Maintenance has not scaled
with community interest. 462 open issues are mostly link submissions that aren't
being processed.

## Adoption Assessment

### Scoring (dual-lens)

| Factor              | Rating   | Notes                                 |
| ------------------- | -------- | ------------------------------------- |
| WR-01 Activity      | Very Low | 1 commit/90d                          |
| WR-02 Community     | Moderate | 30 contributors, but bottlenecked     |
| WR-03 Quality       | Moderate | Good taxonomy, no link validation     |
| WR-04 Security      | N/A      | No code                               |
| WR-05 Documentation | Strong   | Self-documenting                      |
| WR-06 Maintenance   | Low      | Stagnating under commercial ownership |

**Adoption Verdict: Extract (44)** Extract the taxonomy structure and relevant
tutorial links. Don't treat as an active reference — the collection is
increasingly stale.

**Creator Verdict: Extract (45)** Extract the "build from scratch" philosophy
and taxonomy design. Apply the stagnation case study to your own skill lifecycle
planning.

## Findings

| ID   | Severity | Category | Title                                               |
| ---- | -------- | -------- | --------------------------------------------------- |
| F001 | Critical | license  | No LICENSE file (CC0 in README only)                |
| F002 | Medium   | process  | 462 open issues, bottlenecked maintenance           |
| F003 | Medium   | velocity | 44 days since last push, decelerating               |
| F004 | Low      | process  | No CONTRIBUTING.md despite 30+ contributors         |
| F005 | Info     | design   | Ultra-minimal structure (4 files)                   |
| F006 | Info     | pattern  | Copilot code review on Markdown repo (3/4 failures) |
| F007 | Info     | license  | CC0 declared inline but not machine-readable        |

## Link Mining Summary (Depth 0)

367 unique URLs across 31 categories. Home-relevant categories:

- **Medium:** Shell (7), CLI Tools (9), Git (5), Front-end Framework (14),
  Operating System (18)
- **Low:** Database (13), Search Engine (6), Neural Network (16), Regex (9)
- **None/Low:** Blockchain (20), Bot (15), Text Editor (6)

Depth 1 (HEAD-first link validation) not performed. Recommend if specific
categories are selected for extraction.
