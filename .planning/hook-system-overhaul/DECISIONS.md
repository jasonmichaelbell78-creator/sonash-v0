# DECISIONS: Pre-Commit/Pre-Push Hook System Overhaul

**Date:** 2026-03-16
**Questions Asked:** 33
**Decisions Captured:** 44
**State File:** `.claude/state/deep-plan-hook-overhaul.state.json`

---

## Scope & Philosophy

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D1 | Scope boundary | All findings in scope — fix everything unless downstream negative ramifications. No artificial deferrals. | User directive: no deferrals as default |
| D33a | Changelog | Defer to CANON | T18 changelog infrastructure doesn't exist yet |
| D33b | Maturity checklist | Update L3→L4 checklist based on implementations | Enables D36 progress tracking |

## Silent Failures (T11: Fail Loud, Fail Early)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D2 | Mitigation strategy | Both: inline logging at each failure point + end-of-hook summary with actionable fix options | Summary is the call-to-action surface; inline catches specifics |
| D3 | `\|\| true` fallback | stderr fallback — echo warning to stderr if JSONL write fails, hook continues | User sees warning regardless; hook not blocked by logging infra |
| D17 | Per-failure fixes | All 10 approved: 3 missing-tool, 1 network, 4 logging-infra, 2 script-behavior | No silent failures remain after implementation |

## Warning Actionability (T8: Automation Over Discipline)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D4 | Escalation blocks push | "error" severity in hook-warnings blocks push. Pre-push reads hook-warnings.json, exits 1 on unacknowledged entries | Core tenet: warnings are calls to action |
| D10 | Action tiers | Tiered: investigate/fix/defer. Surfaced at end-of-hook summary | Not every warning has auto-fix, but every warning has an investigation + deferral path |
| D11 | Summary format | Per-check status table + actionable items for any warn/fail | Single place user looks to know what happened and what to do |
| D19 | Escalation unblock | Three paths: (1) fix issue, (2) session-begin conversation ack, (3) SKIP_WARNINGS emergency bypass. No manual CLI command (T8). | Acknowledge within conversation, not outside it |
| D19-rev | No manual ack CLI | Zero new npm scripts. T8: no manual steps outside conversations/invocations | User corrected: manual ack command violates T8 |
| D23 | Defer path | Defer command shown in summary — user runs intake-audit.js | Visible, actionable, tracked in TDMS |
| D29 | Summary visibility | Success: simple line ("Pre-commit: 13/13 passed (12.3s)"). Warn/fail: full summary with actions | Clean commits = low noise; problems = full context |
| D31 | Actions format | Fix first (when available), then investigate, then defer. Null fix = omit | Most actionable item first |
| D28 | CI bypass | `CI=true` skips escalation gate entirely | Gate is for dev workflow; CI has its own checks |
| D33c | npm scripts | Zero new scripts. All acknowledgment via session-begin conversation flow | T8 compliance |

## Data Architecture (T2: Source of Truth, T4: JSONL-First)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D9 | hook-warnings.json format | Keep as JSON — it's state/config, not data. JSONL audit trail is canonical per T2 | JSON appropriate for fixed-schema state; matches scripts/config/ pattern |
| D16 | Source of truth | session-start regenerates hook-warnings.json FROM hook-warnings-log.jsonl. JSONL is canonical | T2 compliance: one source, generated views |
| D30 | Acknowledgment state | Separate `.claude/state/hook-warnings-ack.json` | Clean separation: ack state is metadata about user, not about warnings |
| D12 | Summary destination | stderr (immediate) + hook-runs.jsonl (persistent) | Dual output: visibility + trend analysis |

## Data Store Cleanup (T5: No Orphans)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D5a | warned-files.json | Fix — verify graduation system actually works | Good pattern (warn→block), needs to function |
| D5b | commit-failures.jsonl | Fix — wire commit-tracker.js to write failures | Analytics references it; should exist |
| D5c | agent-invocations.jsonl | Fix — add rotation (100 of 200 at 32KB) | Unbounded growth (~3KB/day) |
| D5d | .session-agents.json | Defer — Claude Code hook scope | Out of pre-commit/pre-push scope |
| D13 | override-log dual writer | Remove check-triggers.js fallback. Single owner: log-override.js | T16: single ownership |

## New Artifacts

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D6 | Run-summary JSONL | `.claude/state/hook-runs.jsonl` — one line per invocation with check names, exit codes, commit hash | Enables pass rates, timing trends, skip detection |
| D7 | Per-check timing | Capture duration per check via `date +%s%N` before/after | Enables slow-check detection |
| D20 | hook-runs.jsonl schema | Includes: hook, timestamp, branch, checks array (id/status/duration_ms), total_duration, outcome, commit hash | Full observability per hook run |
| D21 | hook-runs.jsonl rotation | Entry-based: 200 entries, keep 100. Matches override-log pattern | Consistent rotation policy |

## Hook Contract Manifest (T5: Contract, T17: Declarative)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D14 | Contract schema | Full v1 at `scripts/config/hook-checks.json`. JSON format. **CANON artifact** — must be sent to SWS plan | T5 + T17: declarative contract for all hook checks |
| D14a | Blocking field | Enum: `block / warn / auto-fix`. `escalation_blocking` boolean for warn→block at 15+ | Captures all current behaviors |
| D14b | Parallel groups | `parallel_group` string. Same group = can run concurrent. null = sequential | Enables future runner + documents current parallelization |
| D14c | Conditions | Typed structure: `staged_files_match` with pattern + diff_filter | Documents when checks trigger |
| D14d | Timeouts | `timeout_ms`: null = no timeout. Explicit on risky checks (npm audit 15s, tests 60s, secrets 10s) | Prevents hang-forever scenarios |
| D14e | Extra fields | schema_version, description, test_command, flags | Evolution support + testability |
| D15 | Manifest mode | Documentation + validation only (Option B). Declarative runner deferred | Incremental: get the contract right, runner later |
| D24 | Manifest validation | `validate-hook-manifest.js` — bi-directional sync, path resolution, skip flag validation. Runs in hooks:test | Keeps manifest honest |
| D32 | Validation trigger | Only in hooks:test, not pre-commit | Low-frequency drift; pre-push already runs hooks:test on hook changes |

## Parallelization

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D18 | Implement parallel groups | Now — modify pre-commit bash for compliance-checks + doc-checks parallel groups | Pattern exists in pre-push; 3-4s savings per commit |

## Skip Reason & Analytics

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D8 | Stale override entries | Analytics filter — ignore pre-ban entries via --since cutoff. Non-destructive | Preserves history; --since flag already exists |
| D22 | Baseline verification | Verify propagation + CC baseline mode works. Verify reviewer gate active. Phase 0 of plan | Must confirm existing mechanisms before adding new ones |
| D25 | /alerts integration | Wire hook-runs.jsonl into /alerts now. Hook completeness dimension | Data exists, consumer exists, wiring is straightforward |

## Testing & Rollout

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D26 | Testing strategy | 3-tier: (1) unit verification per script, (2) integration end-to-end hooks, (3) multi-agent verification sweep | Same execution-based pattern as Phase 0 discovery |
| D27 | Rollout approach | Wave-based: 9 waves, one commit per wave. Each independently testable | Matches project pattern (mini-audit was 8 waves); enables bisecting |

---

## Decision Index by Plan Wave

| Wave | Decisions | Focus |
|------|-----------|-------|
| 0 | D22 | Verification of existing mechanisms |
| 1 | D14, D14a-e, D15, D24, D32 | Hook contract manifest + validation |
| 2 | D17, D2 (inline), D3 | Silent failure fixes |
| 3 | D6, D7, D20, D21, D2 (summary), D11, D12, D29 | End-of-hook summary + hook-runs.jsonl |
| 4 | D4, D19, D19-rev, D28 | Escalation gate in pre-push |
| 5 | D5a, D5b, D5c, D13 | Data store fixes |
| 6 | D18 | Parallelization |
| 7 | D16, D30, D9 | Source-of-truth regeneration |
| 8 | D25, D8, D33b | /alerts integration + analytics + maturity |
| 9 | D26 | Execution-based testing verification |
