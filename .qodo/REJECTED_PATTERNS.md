<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
# Qodo Rejected Patterns Tracker

**Document Version:** 1.0 **Created:** 2026-04-11 **Last Updated:** 2026-04-11

**Status:** ACTIVE

**Purpose:** Prevent Qodo compliance + reviewer suggestions from drifting back
into new PR reviews after they've been rejected on a prior PR. This file is a
human-readable index of every suppression rule in `.qodo/pr-agent.toml`, with
origin PR numbers and rejection counts. Grep this file first when considering
whether a new Qodo item is worth fixing.

**Workflow:** When a compliance or reviewer item is rejected for the 2nd time
(same rule category, same rationale), add a row here AND add a numbered rule to
the matching section in `.qodo/pr-agent.toml`. When it's rejected for the 3rd+
time, cite this file in the rejection message: "See REJECTED_PATTERNS.md row N."

**Two Qodo engines:**

- **Reviewer** (`[pr_reviewer]`): general code review comments. Suppressed via
  `extra_instructions` rules 1-27 in `pr-agent.toml`.
- **Custom Compliance** (`[pr_code_suggestions]` + built-in generic rules):
  runs separately from the reviewer. Generic rules (Secure Error Handling,
  Audit Trails, Secure Logging, etc.) use a DIFFERENT rule engine, so reviewer
  suppressions don't automatically apply. Compliance-specific suppressions go
  in `[pr_code_suggestions]` `extra_instructions`.

This is why rule #27 exists: the "logs include titles" item was rejected as a
compliance flag multiple times in PR #507 R1, but reviewer rules 1-26 never
caught it because compliance runs on its own engine.

## Reviewer suppression rules (`[pr_reviewer]`)

| Rule # | Category                          | Origin PRs      | Times Rejected | One-line rationale                                              |
| ------ | --------------------------------- | --------------- | -------------- | --------------------------------------------------------------- |
| 1      | Missing actor context (JSON)      | #370-#371       | 5+             | JSON is ephemeral CI artifact; durable actor lives in jsonl     |
| 2      | Unstructured console logs         | #370-#371       | 5+             | Pre-existing CLI pattern; DEBT-0455 tracks                      |
| 3      | Data quality in JSONL pipelines   | #366-#371       | ~100           | Pipeline output, not hand-edited                                |
| 4      | Sensitive log persistence         | #368            | 4              | override-log.jsonl is intentional audit trail                   |
| 5      | Silent JSONL parse catch          | #371 R1-R2      | 2              | Partial writes are expected; skip-and-continue is correct       |
| 6      | Absolute path leakage in TDMS     | #371 R2         | 1              | Repo-relative enforced by pipeline; older entries pre-existing  |
| 7      | Missing actor in intake log       | #379            | 5+             | Intake logs record what, not who                                |
| 8      | JSON.parse Date/Map/BigInt        | #379 R3-R7      | 5              | JSON can't produce those types                                  |
| 9      | Top-level await in ESM files      | #397, #407, #411| 3+             | Valid in ESM modules                                            |
| 10     | Repeat-rejection within same PR   | #378-#416       | pattern        | Same rule + file + rationale → skip                             |
| 11     | TDMS pipeline output quality      | #378-#416       | ~50            | data/ecosystem-v2/*.jsonl is generated                          |
| 12     | config-health.js local read       | #423 R1-R5      | 5              | Intentional feature, HOME-guarded                               |
| 13     | Hook stdin prompt fallback        | #423 R3-R4      | 2              | Protocol doesn't have those field names                         |
| 14     | stdin payload cap on hooks        | #423 R4         | 1              | Upstream bounds the payload                                     |
| 15     | CJS → ESM conversion suggestion   | #420-#447       | pattern        | CJS is intentional for CLI tooling                              |
| 16     | 3+ cross-PR repeat-rejection      | #447            | pattern        | Auto-skip verified false positives                              |
| 17     | .claude/ config as sensitive file | #423-#447       | pattern        | Project config, intentionally version-controlled                |
| 18     | R-style function signatures       | #432-#447       | pattern        | Project convention for CLI helpers                              |
| 19     | Statusline audit trails           | #470 R1-R4      | 4              | Local diagnostic, not compliance system                         |
| 20     | OpenWeatherMap query-param auth   | #470 R3         | 1              | Platform limitation, no alternative                             |
| 21     | Readdir path traversal            | #470 R4         | 1              | Trusted source (filesystem listing)                             |
| 22     | Bash(*) wildcard permissions      | #448-#477       | pattern        | Intended agent operational model                                |
| 23     | Magic string/constant extraction  | #448-#470       | pattern        | Self-contained CLI tools                                        |
| 24     | Missing audit trail on CLI        | #448-#477       | pattern        | Offline dev tools, not prod                                     |
| 25     | Silent catch in hooks/scripts     | #448-#477       | pattern        | Intentional fail-open on non-critical ops                       |
| 26     | Checksum verification on binaries | #448-#470       | pattern        | Version-pinned URLs already handle integrity                    |
| 27     | Logs include titles (intake)      | #507 R1         | 1 (first)      | TDMS triage titles, not user PII                                |

## Code-suggestion suppression rules (`[pr_code_suggestions]`)

See `.qodo/pr-agent.toml` `[pr_code_suggestions]` section for the full list.
Categories covered:

1. JSONL data file placeholders
2. content_hash recomputation
3. Generated TDMS files (no user-facing edits)
4. Weak input validation on trusted local files
5. Raw error details in CLI scripts
6. TOCTOU on single-user CLI
7. S4036 PATH binary hijacking on hardcoded binaries
8. Missing checksum verification on version-pinned downloads

## Adding a new rule

1. Rejected once: note in the current review's learning entry
   (`docs/AI_REVIEW_LEARNINGS_LOG.md`) and move on
2. Rejected a second time: add a row here + a numbered rule to
   `pr-agent.toml` in the matching section
3. When in doubt which engine (reviewer vs compliance) to suppress: check
   which Qodo bot comment raised the item. "PR Compliance Guide" = compliance
   engine. "Action required" / "PR Code Suggestions" = reviewer engine.

## Version

| Version | Date       | Changes                                                         |
| ------- | ---------- | --------------------------------------------------------------- |
| 1.0     | 2026-04-11 | Initial extract from pr-agent.toml rules 1-27, authored in      |
|         |            | PR #507 R1 to break the "logs include titles" recurrence loop   |
<!-- prettier-ignore-end -->
