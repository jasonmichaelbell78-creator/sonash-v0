# Quick Scan: teng-lin/notebooklm-py

**Scan date:** 2026-04-05 | **Depth:** quick | **Rate limit:** OK

## Snapshot

|                        |                                                               |
| ---------------------- | ------------------------------------------------------------- |
| **Description**        | Unofficial Python API and agentic skill for Google NotebookLM |
| **Language / License** | Python / MIT                                                  |
| **Age**                | 88 days (created 2026-01-07)                                  |
| **Stars / Forks**      | 9,228 / 1,184                                                 |
| **Contributors**       | 12 (bus factor ~1 — 551 vs 21 commits)                        |
| **Last push**          | Today                                                         |
| **Topics**             | `claude-skills`, `openclaw-skills`, `agentic-skill`, `skills` |

## Health Bands

| Dimension       | Band          | Score |
| --------------- | ------------- | ----- |
| Security        | Needs Work    | 55    |
| Reliability     | Healthy       | 60    |
| Maintainability | Healthy       | 68    |
| Documentation   | **Excellent** | 94    |
| Process         | Needs Work    | 55    |
| Velocity        | **Excellent** | 98    |

## Key Signals

- **Viral trajectory**: 9.2K stars in under 3 months, 12.8% fork ratio,
  Trendshift-featured.
- **Ships as a skill**: Has `SKILL.md` (27KB), `CLAUDE.md`, `AGENTS.md`, and a
  `notebooklm skill install` CLI command that installs into `~/.claude/skills/`
  and `~/.agents/skills/`.
- **Skills ecosystem**: Supports `npx skills add teng-lin/notebooklm-py` —
  references an "open skills ecosystem" distribution model.
- **Three-surface design**: Python API + CLI + agentic skill all built from one
  codebase.
- **Modern Python tooling**: `uv.lock`, `pyproject.toml`, pre-commit, mypy,
  Dependabot, CodeQL, Nightly E2E.
- **Test flakiness**: Test workflow passes 11/20 (45% failure rate). CodeQL /
  Nightly E2E / Verify / RPC Health all 100%.
- **Disclosed risk**: Uses undocumented Google APIs — acknowledged in README as
  a stability risk.

## Absence Patterns

- **SOLO_MAINTAINER** (High): One author (551 commits) vs everyone else (≤21
  each).
- **FLAKY_TEST_ACCEPTED** (Medium): Test workflow 45% failure tolerated
  alongside clean E2E.

## Creator Lens (Lightweight)

This repo understands how to ship **one capability across three audiences
simultaneously**: NotebookLM exposed as a Python SDK, a CLI, AND an installable
Claude Code / Codex / OpenClaw skill — all from the same codebase. The
`notebooklm skill install` command and `npx skills add teng-lin/notebooklm-py`
pattern hint at a skills distribution ecosystem that's directly relevant to your
JASON-OS aspirations around portable, project-agnostic skills.

Worth going deeper with Standard or Deep mode to understand:

- How the Python package self-installs as a Claude Code skill
- What the `npx skills add` ecosystem actually is
- How they embed CLAUDE.md + AGENTS.md + SKILL.md as first-class deliverables

## Unverified (403 — need admin access)

Dependabot alerts, code scanning alerts, secret scanning alerts. OpenSSF
Scorecard returns 404 (repo too new to be indexed).
