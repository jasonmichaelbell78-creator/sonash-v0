---
name: audit-agent-quality
description: >-
  Hybrid agent audit — automated structural checks + interactive behavioral
  review with audit-team (reviewer + fixer) for all agent definitions in
  .claude/agents/. Convergence-loop verified at every stage.
---

# Hybrid Agent Quality Audit

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Evaluates all agent definitions across 11 quality categories using a 3-stage
hybrid architecture: automated structural analysis, team-based interactive
behavioral review, and convergence-verified synthesis. Produces per-agent scores
(0-100), ecosystem grade (A-F), JSONL findings for TDMS, and trend tracking.

**Scope:** Custom agents in `.claude/agents/*.md`. Built-in agents (Explore,
Plan, general-purpose) are excluded — they cannot be modified.

## Critical Rules (MUST follow)

1. **Stage 1 agents write findings to disk** — NEVER rely on conversation
   context
2. **Stage 2 audit-team presents ONE agent at a time** — wait for user decision
3. **Convergence loops at every stage** — Stage 1 (2-pass), Stage 2 (every 6
   agents), Stage 3 (cross-stage verification)
4. **User retains approval authority** — improve / backlog / skip per agent
5. **Persist state after every agent reviewed** — long audits WILL hit
   compaction
6. **GSD agents are flag-only** — audit for quality but mark improvement
   proposals as "upstream" requiring GSD framework coordination

## When to Use

- Evaluating agent ecosystem quality and identifying improvements
- After adding or modifying agents in `.claude/agents/`
- After 50 commits touching agent files
- User explicitly invokes `/audit-agent-quality`
- Optional `--scope` argument: `gsd`, `stubs`, `priority`, or `all` (default)

## When NOT to Use

- Evaluating skill quality — use `/skill-audit`
- Running a code review audit — use `/audit-code`
- Checking agent orchestration health — use `/skill-ecosystem-audit` Domain 5
- Creating a new agent — use agent definitions in `.claude/agents/`

## Routing Guide

| Situation                  | Use                      | Why                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------- |
| Agent prompt quality       | `/audit-agent-quality`   | 11-category hybrid audit                              |
| Skill behavioral quality   | `/skill-audit`           | Skill-specific categories                             |
| Agent orchestration wiring | `/skill-ecosystem-audit` | Domain 5 checks structural wiring, not prompt quality |
| Code quality broadly       | `/audit-code`            | Source code, not agent defs                           |
| Security of agent tools    | `/audit-security`        | Security-specific patterns                            |

---

## Warm-Up (MUST)

Check ROADMAP.md for agent-related work items (prevents auditing agents
scheduled for replacement).

If previous state file exists, surface: last grade, top 3 findings, learnings.

"Auditing N agents across 11 categories. Estimated: Stage 1 ~5 min, Stage 2
~60-90 min (shorter with batch mode), Stage 3 ~5 min."

---

## Pre-Audit Setup (MUST)

```bash
AUDIT_DATE=$(date +%Y-%m-%d)
AUDIT_DIR="docs/audits/single-session/agent-quality/audit-${AUDIT_DATE}"
mkdir -p "${AUDIT_DIR}"
```

Count agents: `ls .claude/agents/*.md | wc -l`

Filter by `--scope` if provided. Set `AUDIT_DIR` as a literal path string for
agent prompts — agents cannot expand bash variables.

---

## Stage 1: Structural Analysis (3 Parallel Agents, 2-Pass CL)

**CL requirement (Critical Rule #3):** 2-pass convergence loop.

**Dependency constraints:** All 3 agents are independent — no ordering required.
Stage 2 depends on all Stage 1 outputs written to disk.

> Read REFERENCE.md for full agent prompt templates and category definitions.

### Pass 1: Initial Scan

Dispatch 3 parallel Explore agents. Pass the literal `AUDIT_DIR` path in each
prompt (not a bash variable).

**Agent 1A: Frontmatter Validator** — checks all agents for: name format,
description presence and quality, model declaration, tools list presence, unused
frontmatter fields (memory, isolation, hooks, maxTurns, etc.)

**Agent 1B: Tool & Model Checker** — cross-checks: tool lists match actual
prompt references, model assignments follow Decision #18 criteria (opus for
complex, sonnet for routine), agents don't reference non-existent scripts/paths

**Agent 1C: Redundancy & Integration Scanner** — detects: overlapping agent
descriptions, agents with >80% responsibility overlap, CLAUDE.md Section 7
trigger coverage gaps, agents with zero invocation history

Each agent writes JSONL findings to `AUDIT_DIR/stage-1-{domain}.jsonl`. Return
ONLY: `COMPLETE: [id] wrote N findings to [path]`

**Done when:** All 3 agents complete, all JSONL files exist on disk.

### Pass 2: CL Verification (MUST)

Dispatch 1 verification agent that reads all Pass 1 findings and:

- Confirms findings with evidence (grep/read actual files)
- Corrects any false positives or missed issues
- T20 tally: Confirmed/Corrected/Extended/New

**Done when:** T20 tally shows convergence. Merged findings written to
`AUDIT_DIR/stage-1-merged.jsonl`.

---

## Stage 2: Interactive Behavioral Review (Audit-Team, Per-Agent)

**CL requirement (Critical Rule #3):** Mid-audit convergence every 6 agents.

### Team Setup (MUST)

Spawn `audit-team` with 2 persistent members:

- **reviewer**: Evaluates each agent against 11 behavioral categories. Scores
  0-10 per category. Accumulates cross-agent pattern knowledge. Loads Stage 1
  merged findings before starting.
- **fixer**: Drafts concrete improvement proposals per agent based on reviewer
  findings — prompt rewrites, model changes, tool list corrections.

### Per-Agent Flow (MUST — sequential, user-gated)

For each agent (ordered by priority: most-invoked first, then stubs):

```
--- Agent {N} of {total} | Stage 2 Progress: {percent}% ---

Agent: {name} | Tier: {stub/light/medium/heavy} | Lines: {N}
Score: {N}/100 | Stage 1 structural findings: {N}

| Category | Score | Key Finding |
|----------|-------|-------------|
| 1. Prompt Quality | N/10 | ... |
| ... | | |

Proposed improvements: {fixer summary}

[improve now / backlog / skip]
```

User decides. State saved after each agent.

### Batch Decision Mode (SHOULD — offer after first 6 agents)

"Continue one-by-one, or batch-decide remaining agents by tier?" Batch mode:
present tier summary (e.g., "8 stubs, mean score 32, all share same gaps"), user
decides once per tier.

**Delegation:** If user says "you decide" for a tier, accept all
recommendations. Record as `delegated-accept`.

**Early exit:** User can say "stop here" at any point. State saved. Resume later
with `/audit-agent-quality`.

### Mid-Audit CL (MUST — every 6 agents)

1 verification pass per checkpoint: reviewer re-reads earlier scores with
current accumulated context. Checks for score drift. T20 tally presented.
Earlier scores corrected if needed (corrections are informational, not
re-gated).

### Team Shutdown

After all agents reviewed, collect systemic patterns from reviewer and reusable
prompt patterns from fixer. Disband team.

**Stage 2 output:** Per-agent scores in state file + systemic patterns document.

**Done when:** All agents reviewed (or early-exit), user decisions captured,
team disbanded.

---

## Stage 3: Synthesis (1 Agent, Cross-Stage CL)

**CL requirement (Critical Rule #3):** Cross-stage contradiction check.

### Scoring (MUST)

> Read REFERENCE.md for category weights and scoring formula.

Per-agent composite: weighted average of 11 category scores (0-100). Ecosystem
grade: mean of all agent composites mapped to A-F scale.

### Cross-Stage CL (MUST)

Verify structural findings (Stage 1) align with behavioral scores (Stage 2).
Flag contradictions (e.g., structural says tools missing but behavioral scored
tools 8/10). T20 tally. **Present contradiction report to user before finalizing
ecosystem grade.** User confirms or overrides.

### Output (MUST)

1. Write `AUDIT_DIR/AGENT_QUALITY_REPORT.md` — executive summary, per-agent
   scores, ecosystem grade, trend comparison, systemic patterns
2. Write `AUDIT_DIR/all-findings-deduped.jsonl` — merged structural + behavioral
3. Append to `.claude/state/audit-agent-quality-history.jsonl`:
   `{"date":"...","agents":N,"grade":"B","mean_score":72,"findings":N}`

---

## Post-Audit (MUST)

### TDMS Integration

```bash
node scripts/debt/validate-schema.js AUDIT_DIR/all-findings-deduped.jsonl
node scripts/debt/intake-audit.js AUDIT_DIR/all-findings-deduped.jsonl --source "audit-agent-quality-$(date +%Y-%m-%d)"
node scripts/debt/generate-views.js
node scripts/debt/generate-metrics.js
```

### /alerts Integration (SHOULD)

History JSONL consumed by `/alerts` under "Agent Quality" category. Surfaces:
current grade, trend direction, grade-drop warnings.

### /session-end Integration (SHOULD)

Results available for `/session-end` metrics capture under "Agent Quality."

---

## Guard Rails

- **Scope explosion:** >40 agents → recommend splitting by tier
- **Contradiction resolution:** Stage 3 CL presents contradictions, user decides
- **Disengagement:** "abort" → save state, offer: resume / delete / keep
- **GSD boundary:** audit for quality, flag improvements as "upstream"

## Compaction Resilience

- **State file:** `.claude/state/task-audit-agent-quality.state.json`
- **Update:** After each agent reviewed in Stage 2
- **Contents:** Current stage, agents reviewed, scores, user decisions, team
  state
- **Recovery:** Re-invoke `/audit-agent-quality` to resume from last saved agent

---

## Learning Loop + Closure (MUST)

**Auto-learnings** (MUST): Generate 2-3 insights (common agent gaps, scoring
patterns, systemic issues). Save to state file `learnings` field.

**Invocation tracking** (MUST):

```bash
cd scripts/reviews && node dist/write-invocation.js --data '{"skill":"audit-agent-quality","type":"skill","success":true,"context":{"agents_audited":N,"grade":"X"}}'
```

Present: artifact manifest, ecosystem grade, top 3 systemic findings, next steps
(which agents to improve first).

---

## Integration

- **Neighbors:** `/skill-audit` (skills), `/skill-ecosystem-audit` (Domain 5),
  `/audit-code` (source code)
- **Produces:** JSONL findings → TDMS pipeline, history → /alerts
- **Consumes:** `.claude/agents/*.md`, `data/ecosystem-v2/invocations.jsonl`
- **Handoff:** Audit findings (state file) consumed by Phase 4 (Improvements) of
  the agent environment analysis plan
- **References:** [CLAUDE.md](../../CLAUDE.md) Section 5 for security patterns

> See REFERENCE.md for artifact contract table.

## Version History

| Version | Date       | Description                        |
| ------- | ---------- | ---------------------------------- |
| 1.1     | 2026-03-17 | skill-audit: 27 decisions applied  |
| 1.0     | 2026-03-17 | Initial creation via /create-audit |
