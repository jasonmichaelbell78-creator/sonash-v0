# Token Monitoring Pipeline

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-24
**Status:** BLOCKED
<!-- prettier-ignore-end -->

## Purpose

Documents the planned token monitoring infrastructure for agent/team
invocations. Three consumption surfaces are planned. All are blocked on token
data availability from Claude Code.

## Current State

Claude Code does not expose per-agent token counts. The `Task` tool does not
return token usage metadata. Until this data becomes available, the monitoring
pipeline consists of:

1. **Schema** defined at `docs/schemas/agent-token-usage.schema.json`
2. **Placeholder JSONL** at `.claude/state/agent-token-usage.jsonl`
3. **Invocation schema** extended with `team` and `tokens` fields
   (`scripts/reviews/lib/schemas/invocation.ts`)

## Schema

Each record in `agent-token-usage.jsonl` follows this format:

```json
{
  "agent": "code-reviewer",
  "team": "audit-team",
  "model": "claude-sonnet-4-20250514",
  "tokens": 12500,
  "input_tokens": 10000,
  "output_tokens": 2500,
  "duration_ms": 4200,
  "success": true,
  "context": "pr-review PR #450",
  "session": "235",
  "timestamp": "2026-03-24T14:30:00Z"
}
```

Required fields: `agent`, `model`, `timestamp`. All others are optional.

## Planned Surfaces

### Surface 1: Statusline Widget

**Status:** Blocked on custom-statusline plan
(`/.planning/custom-statusline/PLAN.md`)

**Design:** Add a token counter widget to the GSD statusline hook showing
cumulative session token usage for agents/teams.

**Format:** `Agents: Nk tokens | Teams: N active`

**Activation:** When `agent-token-usage.jsonl` has entries for the current
session.

### Surface 2: Session-End Metrics

**Status:** Blocked on token data availability

**Design:** Add an "Agent Token Usage" section to the `/session-end` skill
output. Per-agent and per-team breakdowns with cost estimates.

**Output example:**

```
Agent Token Usage (this session):
  code-reviewer    12.5k tokens  ($0.04)  2 invocations
  security-auditor  8.2k tokens  ($0.03)  1 invocation
  audit-team       45.0k tokens  ($0.15)  1 team session
  ---
  Total:           65.7k tokens  ($0.22)
```

**Integration point:** `/session-end` SKILL.md metrics collection phase.

### Surface 3: Alerts Category

**Status:** Blocked on token data availability

**Design:** Add an "Agent Cost" category to the `/alerts` skill. Tracks
session-over-session trends, per-team averages, and threshold warnings.

**Alert conditions:**

- Session token usage exceeds 2x the 5-session rolling average
- A single agent consumes more than 50% of session tokens
- Team idle cost exceeds 20% of team total tokens

**Integration point:** `/alerts` SKILL.md category list and
`alerts-baseline.json`.

## Activation Plan

When Claude Code exposes token data (via Task tool metadata, hook output, or
API):

1. Update the data capture hook to write to `agent-token-usage.jsonl`
2. Implement Surface 2 (session-end) first — lowest integration cost
3. Implement Surface 3 (alerts) — adds trend tracking
4. Implement Surface 1 (statusline) — depends on custom-statusline plan

## Related Files

| File                                         | Purpose                            |
| -------------------------------------------- | ---------------------------------- |
| `docs/schemas/agent-token-usage.schema.json` | JSON Schema for token records      |
| `.claude/state/agent-token-usage.jsonl`      | Token usage data (placeholder)     |
| `scripts/reviews/lib/schemas/invocation.ts`  | Invocation Zod schema (extended)   |
| `scripts/reviews/write-invocation.ts`        | Invocation writer (unchanged)      |
| `.planning/custom-statusline/PLAN.md`        | Statusline plan (blocks Surface 1) |
