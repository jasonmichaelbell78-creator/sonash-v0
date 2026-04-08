# codecrafters-io/build-your-own-x — Deep Analysis

**Analyzed:** 2026-04-03 | **Depth:** Deep (clone + temporal) | **Age:** 8 years

> Master programming by recreating your favorite technologies from scratch.

## Health Summary

| Dimension       | Band              | Score  | Detail                                                |
| --------------- | ----------------- | ------ | ----------------------------------------------------- |
| Security        | **Critical** (5)  | 5/100  | No license, no branch protection                      |
| Reliability     | N/A               | —      | Markdown-only repo — no code                          |
| Maintainability | Healthy (70)      | 70/100 | Single README, well-organized 35 categories           |
| Documentation   | Excellent (82)    | 82/100 | The entire repo IS documentation. 363 tutorial links. |
| Process         | **Critical** (15) | 15/100 | 460 open issues, 30 open PRs, no CONTRIBUTING         |
| Velocity        | **Critical** (10) | 10/100 | 1 commit in 12 months. Effectively dormant.           |

## Temporal Fingerprint (Deep)

- **611 commits, 8 years.** Peak: 327 commits in 2018 (creation year).
- **1 commit in last 12 months** — practically dormant.
- **Ownership transfer:** Originally by Daniel Stefanovic (320 commits), now
  under codecrafters-io org. Banner promotes paid platform.
- **Bus factor = 0.** No active maintainer. Last meaningful activity was a PR
  merge in Feb 2026.
- **Lifecycle:** Mature/dormant curated list. Content still valuable but
  actively decaying (link rot expected after 8 years).

## Key Findings

1. **NO LICENSE** (Critical). 486K-star repo with no license. 45,710 forks in
   legal gray zone.
2. **Effectively unmaintained.** 460 open issues, 30 open PRs, 1 commit in 12
   months. Community contributions are not being processed.
3. **Commercial overlay.** codecrafters.io banner and interspersed platform
   links. The repo serves as a marketing funnel for their paid service.
4. **Content quality is high but decaying.** 363 tutorial links across 35
   categories. After 8 years, significant link rot is expected. No automation to
   detect broken links.
5. **Security Facade.** Copilot code review workflow on a Markdown-only repo (3
   of 4 runs failed).

## Absence Patterns

- **SECURITY_FACADE:** Non-functional CI on a Markdown repo.

## Adoption Verdict: Extract (45)

**Low extraction value for JASON-OS.** The 35-category taxonomy is mildly
interesting as a learning path reference, but the content itself is a curated
link list — not patterns, code, or methodology. No license blocks redistribution
anyway.

| Candidate                     | Novelty | Effort | Relevance               |
| ----------------------------- | ------- | ------ | ----------------------- |
| 35-Category Tutorial Taxonomy | Medium  | E0     | Learning path reference |
| Curated Link Format           | Low     | E0     | Standard awesome-list   |
| Issue Template Pattern        | Low     | E0     | Low relevance           |
