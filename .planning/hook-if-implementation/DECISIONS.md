<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-29
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# DECISIONS: Hook If-Conditions Implementation

## Decision Table

| #   | Decision                    | Choice                                                      | Rationale                                                                                                                                          |
| --- | --------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Phasing strategy            | 3 waves: W1 infra+inline, W2 gates+OTB T1, W3 stretch       | Each wave builds on previous. Infra first enables cheaper hooks later.                                                                             |
| D2  | ensure-fnm.sh approach      | Fast-path check (Option A)                                  | Minimal safe change. `if command -v node; then exec "$@"; fi` at top. Preserves fnm fallback for cross-locale safety. ~30 min effort.              |
| D3  | WORK locale verification    | Ship with fallback (Option A)                               | Lean wrapper falls through to fnm if node isn't on PATH. Safe at both locales by design. No need to defer.                                         |
| D4  | GSD context-monitor scoping | Add broad matcher to user settings at home (Option A)       | 5-min config change, ~48% spawn reduction, near-zero risk. User-level only (doesn't affect work locale).                                           |
| D5  | Duplicate GSD check         | Remove P4 from project settings, keep U1                    | U1 has multi-IDE detection and windowsHide. P4 is the simpler duplicate.                                                                           |
| D6  | .env.local.encrypted block  | Wave 1 — fastest high-value item                            | Validates PreToolUse `if` pattern for later gates. 5-min inline ship.                                                                              |
| D7  | Hook script location        | Flat `.claude/hooks/`                                       | Consistent with existing convention. No subdirectories.                                                                                            |
| D8  | Hook wiring requirement     | Every hook must wire end-to-end                             | Trigger → script → output → consumer. No dead-end hooks. Design the outlet before writing the hook.                                                |
| D9  | Settings.json guardian      | Both PreToolUse + PostToolUse (Option C)                    | PreToolUse blocks structural corruption (invalid JSON, missing critical hooks). PostToolUse logs what changed for audit trail. Different purposes. |
| D10 | Firestore rules guard       | Block with override (Option C)                              | `exit 2` blocks by default. `ALLOW_RULES_EDIT=1` env var permits legitimate changes. Security-critical files need default-block.                   |
| D11 | Governance change logger    | Full git diff (Option B)                                    | Timestamp, file, git diff output, session number. Ground truth for audit without over-engineering.                                                 |
| D12 | Loop detector thresholds    | 3 failures within 20 minutes                                | Slightly wider window than research proposed. Warns, doesn't block. Same error hash (line numbers stripped for fuzzy match).                       |
| D13 | Gate wiring — consumers     | stderr + JSONL + /alerts (all three)                        | Immediate visibility (stderr), persistence (hook-warnings-log.jsonl), session review (/alerts). Full end-to-end wiring per D8.                     |
| D14 | Gate testing strategy       | Test harness + ship all at once (C+A)                       | Script simulates PreToolUse stdin, invokes gate scripts directly. Verifies logic without Claude Code. Harness serves future gate development.      |
| D15 | Deploy safeguard scope      | Build freshness + env verification + test status (Option C) | Deploys are high-stakes. Comprehensive pre-flight check.                                                                                           |
| D16 | Test-runner tracking        | Pass/fail + duration (Option A)                             | Append to `.claude/state/test-runs.jsonl`. Upgrade to output parsing later.                                                                        |
| D17 | Dead code activation        | Activate isMarkdownFile + isConfigFile (Option A)           | Wire up markdown fence detection and JSON syntax validation inside monolith. Zero new spawn cost.                                                  |
| D18 | Execution approach          | Wave-per-session + parallel subagents (B+C)                 | One wave per session. Parallel subagents within each wave for independent work.                                                                    |
| D19 | Code review gate            | Review per wave (Option A)                                  | Each wave is a logical unit. Code-reviewer after each wave's commit.                                                                               |
| D20 | Rollback strategy           | Kill switch env var + manual removal docs (Option C)        | `SKIP_GATES=1` for quick disable. Pattern matches existing `SKIP_TRIGGERS=1`. Documentation for permanent removal.                                 |
| D21 | Tier 2 scope                | Stretch goals in Wave 3 (Option C)                          | Included but not committed. Deploy safeguard, test tracker, large file warning, branch context.                                                    |
