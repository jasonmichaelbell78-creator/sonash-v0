# Statusline Deep-Plan: DECISIONS

**Date:** 2026-03-23 **Task:** Custom Claude Code statusline for SoNash
**Questions asked:** 20 **Decisions captured:** 20

---

## Decision Table

| #   | Decision                        | Choice                                                                                                | Rationale                                                                  |
| --- | ------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | Implementation approach         | Go binary                                                                                             | Best performance (<50ms), zero runtime deps, Go installed on machine       |
| 2   | Layout philosophy               | Always-visible                                                                                        | All widgets shown at all times, no anomaly-driven hiding                   |
| 3   | Widget set (22 widgets)         | A1,A3,A4,A6,B1,B2,B3,C1,C5,C6,C7,C8,D1,D5,E1,F4,F6,F7,F15,H2,H3,I4                                    | User-curated from full 40+ widget catalog                                  |
| 4   | Visual style                    | Symbolic Unicode                                                                                      | Works without Nerd Font, compact, self-documenting                         |
| 5   | Color scheme                    | 16-color ANSI                                                                                         | Max compatibility, Windows safe, universal color language sufficient       |
| 6   | Performance target              | <50ms render                                                                                          | Go binary achieves this with headroom for future widgets                   |
| 7   | Layout structure                | 3 lines                                                                                               | L1: Identity/workspace, L2: Health/metrics, L3: Lifestyle/session          |
| 8   | Separators                      | Thin pipe (`│`)                                                                                       | User preference                                                            |
| 9   | Conditional widget placeholders | Show `none` when inactive                                                                             | Stable layout — widgets don't shift position                               |
| 10  | Weather location                | Nashville, TN — Fahrenheit                                                                            | User's location                                                            |
| 11  | Timezone clock                  | Single timezone — Central                                                                             | Simplified from dual timezone                                              |
| 12  | Configuration format            | TOML — `config.toml` (shared) + `config.local.toml` (gitignored)                                      | Tweak thresholds, API keys, paths without rebuilding                       |
| 13  | Cache strategy for API widgets  | Background goroutine in binary                                                                        | Render fast with stale cache, refresh in background. No external scheduler |
| 14  | Source/binary location          | Source at `tools/statusline/` in repo. Binary compiled to `~/.claude/statusline/`. `build.sh` in repo | Cross-locale portable via git, machine-specific via local overrides        |
| 15  | Unavailable data display        | Show `...` placeholder                                                                                | Distinct from `none` (inactive) — means "no data yet"                      |
| 16  | Retry on cache failure          | Exponential backoff: 1m → 2m → 5m → 10m cap                                                           | Show last good data with dim `?` indicator, reset on success               |
| 17  | API key storage                 | `config.local.toml` (gitignored)                                                                      | Per-machine config alongside other local overrides. Machine setup in plan  |
| 18  | Phasing                         | All at once, then test extensively                                                                    | Build full 22-widget solution in one pass, then test/retest/retest         |
| 19  | `build.sh` scope                | Full: compile, copy, update settings.json, verify Go, test render, print summary                      | All-in-one setup script                                                    |
| 20  | Test strategy                   | Go tests only (`*_test.go`), remove old TS tests                                                      | Tests in same language as implementation, run before compile in build.sh   |

---

## Widget Manifest

### Line 1: Identity & Workspace

| Widget            | ID  | Source                        | Conditional? | Placeholder  |
| ----------------- | --- | ----------------------------- | :----------: | ------------ |
| Model name        | A1  | stdin `model.display_name`    |      No      | —            |
| Git branch        | B1  | `git rev-parse` (cached 5s)   |      No      | —            |
| Worktree          | B3  | stdin `worktree.name`         |     Yes      | `wt:none`    |
| Project directory | B2  | stdin `workspace.current_dir` |      No      | —            |
| Permission mode   | A4  | stdin `output_style.name`     |      No      | —            |
| Active agent      | A6  | stdin `agent.name`            |     Yes      | `agent:none` |
| Current task      | E1  | Todo file read                |     Yes      | `task:none`  |

### Line 2: Health & Metrics

| Widget            | ID  | Source                                        | Conditional? | Placeholder           |
| ----------------- | --- | --------------------------------------------- | :----------: | --------------------- |
| Hook health       | D1  | `.claude/state/hook-runs.jsonl` (tail)        |      No      | `✓hooks` when passing |
| Unacked warnings  | D5  | `.claude/state/hook-warnings-log.jsonl`       |     Yes      | `⚠0 unacked`          |
| GitHub PR status  | H2  | `gh pr status` → cache                        |     Yes      | `PR:none`             |
| CI/CD pipeline    | H3  | `gh run list` → cache                         |     Yes      | `CI:none`             |
| Lines changed     | C8  | stdin `cost.total_lines_added/removed`        |      No      | `+0 -0`               |
| Context gauge     | C1  | stdin `context_window.used_percentage`        |      No      | —                     |
| Rate limit 5-hour | C5  | stdin `rate_limits.five_hour.used_percentage` |      No      | `5hr:...`             |
| Rate limit reset  | C7  | stdin `rate_limits.five_hour.resets_at`       |      No      | `resets ...`          |
| Rate limit 7-day  | C6  | stdin `rate_limits.seven_day.used_percentage` |      No      | `7d:...`              |

### Line 3: Lifestyle & Session

| Widget              | ID  | Source                         | Conditional? | Placeholder    |
| ------------------- | --- | ------------------------------ | :----------: | -------------- |
| Weather current     | F6  | Weather API → cache            |      No      | `weather:...`  |
| Weather forecast    | F7  | Same cache                     |      No      | `forecast:...` |
| Clock (Central)     | F4  | System time                    |      No      | —              |
| Session duration    | A3  | stdin `cost.total_duration_ms` |      No      | —              |
| Uptime              | F15 | System query                   |      No      | —              |
| Session count today | I4  | State file counter             |      No      | `sessions:...` |

---

## Canonical Mockup (all 22 widgets, full width)

```
Opus 4.6 │ planning-32326 │ wt:none │ sonash-v0 │ ⏵⏵ accept edits │ agent:none │ task:none
✓hooks │ ⚠0 unacked │ PR:none │ CI:none │ +0 -0 │ ████░░░░░░ 42% │ 5hr:42% resets 2:15pm │ 7d:18%
72°F ☀ H:78 L:55 │ 10:23 CST │ 1h23m │ Up 3d 7h │ Sessions today: 4
```

**With active work:**

```
Opus 4.6 │ planning-32326 │ wt:planning │ sonash-v0 │ ⏵⏵ accept edits │ ◆code-reviewer │ Implement statusline
✓hooks │ ⚠2 unacked │ PR#462 ✓ │ CI ✓ │ +124 -38 │ ████████░░ 78% │ 5hr:72% resets 2:15pm │ 7d:34%
68°F 🌧 H:72 L:51 │ 14:23 CST │ 2h41m │ Up 3d 7h │ Sessions today: 6
```

---

## File Structure

```
tools/statusline/
  main.go              — stdin reader, widget orchestrator, stdout writer
  config.go            — TOML config parsing, defaults, local override merge
  widgets.go           — all 22 widget functions
  cache.go             — background goroutine fetch, backoff, staleness
  render.go            — 3-line layout assembly, color, separators
  statusline_test.go   — Go tests for widgets + full binary stdin/stdout
  config.toml          — shared defaults (committed)
  config.local.toml    — per-machine overrides (gitignored)
  build.sh             — compile, copy, update settings, verify, test render
  .gitignore           — ignores config.local.toml and compiled binary
```

---

## Cross-Locale Setup

Each machine requires a one-time setup after cloning/pulling:

1. Verify Go is installed (`go version`)
2. Create `tools/statusline/config.local.toml` with weather API key
3. Run `./tools/statusline/build.sh`
4. Verify statusline renders in Claude Code
