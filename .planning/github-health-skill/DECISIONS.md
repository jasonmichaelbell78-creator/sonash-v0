# Decision Record: /github-health Skill

**Date:** 2026-04-03 **Questions Asked:** 27 **Decisions Captured:** 28

## Architecture & Scope

| #   | Decision                      | Choice                                                                                           | Rationale                                                                                       |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1   | File structure                | SKILL.md + REFERENCE.md + scripts/run-github-health.js. Default mode is --full                   | Complex skill (7 phases, 10+ fix classes, API integration). Matches alerts/ecosystem-health     |
| 2   | Assessment phases             | 7 phases: Security, Actions, Deps, Config, Release, Insights, PR Health                          | Original 6 from research + new Phase 7 from agent research. All avenues explored                |
| 3   | Scoring methodology           | Per-phase letter grades (A-F), no composite score                                                | Simple, matches existing patterns, avoids inventing unvalidated methodology                     |
| 4   | --quick mode (3+1 calls)      | Secret scanning alerts, Dependabot alert count, CI run on main, cache usage                      | Swapped auth status for Dependabot count (higher signal). Added cache usage (1 REST call)       |
| 5   | Session-begin integration     | Add github-health --quick to session-begin health scripts (like alerts --limited)                | Session-begin already orchestrates health checks, adding another matches the pattern            |
| 6   | Fix approach                  | All fixes inline with standard commit → push → PR workflow. Everything fixable from within skill | User wants full fix capability — inline, gh commands, task list at end. No artificial scope cap |
| 7   | Relationship to /alerts       | Fully separate — each owns its domain. Session-begin calls both independently                    | Different domains (internal repo health vs GitHub platform health)                              |
| 8   | Phase architecture (expanded) | 7 phases with agent-researched additions (see Phase Additions table below)                       | 11 parallel research agents validated each capability. 8 included, 3 omitted                    |

### Phase Additions from Agent Research

| Phase           | New additions                                                   | Agent source                   |
| --------------- | --------------------------------------------------------------- | ------------------------------ |
| 1. Security     | Commit signing rate (low priority, supply chain signal)         | research-commit-signing        |
| 2. Actions      | Cache utilization (1 REST), CI duration trending                | research-actions-cache/billing |
| 3. Dependencies | SBOM license compliance, ecosystem gap detection                | research-sbom                  |
| 4. Config       | Issue health, branch staleness, tag protection, webhooks        | 4 agents                       |
| 7. PR Health    | NEW PHASE — Dependabot backlog, CI-blocked PRs, merge conflicts | research-stale-prs             |

### Omitted from v1

| Capability      | Why omitted                                                           |
| --------------- | --------------------------------------------------------------------- |
| Autolinks       | No external trackers, DEBT-XXXXX is internal JSONL with no web viewer |
| GitHub Projects | Zero projects, ROADMAP.md + /todo + /gsd stack is superior            |
| Actions billing | Returns zeros for public repos — unlimited free minutes               |

## State & Data

| #   | Decision             | Choice                                                                                           | Rationale                                                                             |
| --- | -------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| 9   | State files          | github-health-history.jsonl (append), github-health-suppressions.json (config), <30min dedup     | Matches alerts/ecosystem-health pattern. JSONL for trends, JSON for config            |
| 10  | Grading thresholds   | A=0 issues, B=P3 only, C=1-2 P2, D=any P1 or 3+ P2, F=any P0                                     | Severity-weighted, uses research P0-P3 priority system                                |
| 11  | Suppression model    | Both per-finding (by ID with optional expiry) and per-category                                   | Matches /alerts which has both per-alert and per-category suppression                 |
| 12  | License flags (SBOM) | WARNING: copyleft (MPL, LGPL, GPL, AGPL), unknown/null. INFO: FSL. Ignore: MIT, Apache, BSD, ISC | Clear taxonomy. Copyleft/unknown are real risks. FSL is non-OSS but may be acceptable |
| 13  | GraphQL strategy     | Single "Core Health Snapshot" query for --quick AND --full base, REST for deep dives             | Research designed this pattern. One query gets 80% of data. Minimizes API cost        |
| 14  | Trend alerts         | Grade drop 2+, cache +20%, PRs +3, new P0                                                        | Meaningful degradation signals, not noise                                             |
| 15  | Warm-up context      | Last run timestamp + mode, per-phase grades, trend alerts, suppression count                     | Matches ecosystem-health "Last run: [grade], [time ago]" pattern                      |

## Triage UX & Fixes

| #   | Decision              | Choice                                                                                            | Rationale                                                                                      |
| --- | --------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 16  | Triage UX             | Per-finding review: Fix/Defer/Skip/Suppress. No scope limit on fixes — skill handles everything   | Guardrail #2 compliance. User wants full fix capability from within the skill                  |
| 17  | Defer to TDMS         | Batch deferred items, route to /add-debt once at end of triage                                    | Avoids interrupting triage flow with debt intake                                               |
| 18  | Commit strategy       | One commit per fix (atomic, individually revertable)                                              | Matches per-item triage flow, each fix independently revertable                                |
| 19  | Skill delegation      | Surface finding, offer to invoke delegate skill, user confirms                                    | Transparent handoff. "Release Please failing. Delegate to /gh-fix-ci? [Y/n]"                   |
| 20  | Session-begin output  | Single line when green, expand multi-line when yellow/red                                         | Quiet when healthy, verbose when there's a problem                                             |
| 21  | Script implementation | scripts/run-github-health.js for --quick (Node.js), SKILL.md orchestrates --full conversationally | Quick must be fast and callable. Full is too interactive for a script                          |
| 22  | Error handling        | Per-phase try/catch, graceful degradation, NO SILENT FAILURES — every failure reported            | User explicitly mandated no silent failures. Every error must surface with what failed and why |

## Edge Cases & Boundaries

| #   | Decision                      | Choice                                                                                           | Rationale                                                                             |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| 23  | UI-only fixes                 | Explicit step-by-step layman instructions with URLs, offer to open browser, "USER ACTION" status | Some fixes need GitHub Settings UI. Instructions must be explicit and layman-friendly |
| 24  | PR workflow for file edits    | Single github-health-fixes branch, atomic commits per fix, one PR at end                         | Reviewable batch PR while each fix is atomic in git history                           |
| 25  | Token scope detection         | Proactive check at start — present coverage summary before running                               | User notes most scopes already granted. Proactive > on-failure for UX                 |
| 26  | Fresh assessment              | No pre-seeding. Live API data every run. If issues are resolved, they won't surface              | Clean design. API is the source of truth, not research snapshots                      |
| 27  | SKILL.md / REFERENCE.md split | SKILL.md: process, modes, triage, guardrails. REFERENCE.md: API catalog, queries, fix recipes    | Standard split for complex skills. REFERENCE.md is the implementation handbook        |
| 28  | Name                          | /github-health                                                                                   | Explicit, matches research, distinct from /alerts and /ecosystem-health               |
