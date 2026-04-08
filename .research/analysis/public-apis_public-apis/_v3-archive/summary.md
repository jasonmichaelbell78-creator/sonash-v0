# Quick Scan: public-apis/public-apis

**Scan date:** 2026-04-05 | **Depth:** quick | **Rate limit:** OK

## Snapshot

|                        |                                      |
| ---------------------- | ------------------------------------ |
| **Description**        | A collective list of free APIs       |
| **Language / License** | Python (40KB) + Shell (1.4KB) / MIT  |
| **Age**                | 10 years (created 2016-03-20)        |
| **Stars / Forks**      | **419,392 / 45,617** (top-20 GitHub) |
| **Subscribers**        | 4,572                                |
| **Open issues**        | **1,191**                            |
| **Contributors**       | 10 visible, top 2 = 1,509 commits    |
| **Last push**          | 18 days ago                          |
| **README size**        | **195KB**                            |

## Health Bands

| Dimension       | Band       | Score             |
| --------------- | ---------- | ----------------- |
| Security        | Needs Work | 35                |
| Reliability     | Needs Work | 40                |
| Maintainability | Needs Work | 30                |
| Documentation   | Healthy    | 75                |
| Process         | Needs Work | 38                |
| Velocity        | Needs Work | 50 (split signal) |

**OpenSSF Scorecard: 2.3/10** (scored 2026-03-30)

## Key Signals

- **Celebrity stagnation**: 419K stars + 45K forks, but OpenSSF reports only 2
  commits and 0 issue activity in the last 90 days. Massive social signal,
  near-zero throughput.
- **Approval gate bottleneck**: 14/15 recent PR-triggered workflow runs have
  conclusion `action_required` — workflows require maintainer approval for PRs
  from forks, and that gate isn't moving. Code-Review OpenSSF score: 1/10 (4/29
  changesets approved).
- **Commercial capture**: README opens with prominent APILayer sponsorship and a
  product table before the community index. Curated list became a lead-gen
  surface.
- **Link validation tooling**: Scheduled GitHub Actions workflow
  `Validate links` runs on cron to catch link rot. Recent run: 1/1 failure.
- **Minimal dependencies**: Only 8 deps (`requests`, `urllib3`, `certifi`,
  `idna`, `charset-normalizer` + 2 actions + self). Python tooling is just the
  link validator.
- **1,191 open issues** — huge triage backlog.

## Absence Patterns

- **CELEBRITY_STAGNATION** (High): Top-20 stars + near-zero commit velocity.
- **COMMERCIAL_CAPTURE** (High): APILayer sponsorship precedes community content
  in README.
- **APPROVAL_GATE_BOTTLENECK** (High): CI gated on manual approval, approval
  rate near zero.

## Creator Lens (Lightweight)

This repo understands **how to structure a massive curated list so it stays
navigable** — alphabetized index → 35+ categories → per-category tables with
Description/Auth/HTTPS/CORS columns. It also understands that a curated list
needs continuous link validation to avoid rot, and they have dedicated GitHub
Actions tooling for it.

What it teaches, perhaps unintentionally, is **the full lifecycle of a
curated-list project**: community momentum → commercial sponsorship → approval
bottleneck → celebrity stagnation. **419K stars does not mean alive.**

For your purposes (JASON-OS, skills distribution), the extractable value is
low-to-moderate:

- The link-validation workflow is a transferable pattern
- The 35-category taxonomy overlaps with your existing
  `codecrafters-io/build-your-own-x` tracker entry
- The "what a stagnant awesome-list looks like" is useful cautionary context for
  any future community-distributed skill registry

## Unverified (403 / not applicable)

Dependabot / code-scanning / secret-scanning alerts: 403 (need admin). Workflow
pass rate: can't compute (all `action_required`).

## Interactive Gate

Quick Scan complete. This repo is primarily **cautionary context** rather than a
high-value extraction target. Extractable candidates are thin: link validation
workflow, taxonomy (overlaps existing entry), and a lesson about curated-list
stagnation.

Standard scan would clone the 195KB README + Python scripts and examine the
validation tooling in detail. Deep is overkill.

Run **Standard**, **Quick-only** (close with just this summary), or **skip**
(cleanup and move to next repo)?
