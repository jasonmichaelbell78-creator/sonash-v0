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

Evaluates all agent definitions across 13 quality categories using a 3-stage
hybrid architecture: automated structural analysis, team-based interactive
behavioral review, and convergence-verified synthesis. Produces per-agent scores
(0-100), ecosystem grade (A-F), JSONL findings for TDMS, and trend tracking.

**Scope:** Custom agents in `.claude/agents/*.md`. Built-in agents (Explore,
Plan, general-purpose) are excluded — they cannot be modified.

## Critical Rules (MUST follow)

1. **Stage 1 findings must reach disk** — Explore agents return findings as
   text; the orchestrator (team leader) writes JSONL to disk. NEVER rely on
   conversation context alone.
2. **Stage 2 audit-team presents ONE agent at a time** — wait for user decision
3. **Convergence loops at every stage** — Stage 1 (2-pass), Stage 2 (every 6
   agents), Stage 3 (cross-stage verification)
4. **User retains approval authority** — improve / backlog / skip per agent
5. **Persist state after every agent reviewed** — long audits WILL hit
   compaction
6. **GSD agents are flag-only** — audit for quality but mark improvement
   proposals as "upstream" requiring GSD framework coordination
7. **Value filter on all proposals** — Before proposing an improvement, ask:
   "Would this change measurably improve the agent's output quality or fix a
   broken workflow?" If no — don't propose it. Integration wiring (CLAUDE.md
   triggers, skill connections) belongs in Phase 5, not here. Format conformance
   without functional impact is cosmetic. Do NOT pad recommendations to appear
   thorough.

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

"Auditing N agents across 13 categories. Estimated: Stage 1 ~5 min, Stage 2
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

## Stage 1: Structural Analysis (Team-Leader Pattern, CL-Expanded)

**CL requirement (Critical Rule #3):** 3-pass convergence loop within each
Explore agent + 1 cross-agent verification pass.

**Dependency constraints:** All 3 agents are independent — no ordering required.
Stage 2 depends on all Stage 1 outputs written to disk.

> Read REFERENCE.md for full agent prompt templates and category definitions.

### Team-Leader Write Pattern (MUST)

Explore agents are **read-only** — they cannot write files. Use the team-leader
pattern:

1. **Orchestrator (you) = team leader** — the only one who writes to disk
2. **Explore agents = scanners** — run CL passes internally, return structured
   JSONL findings as text in their response
3. **Orchestrator collects** all agent responses and writes JSONL files to
   `AUDIT_DIR/`

Never dispatch Explore agents expecting them to write output files. Always
instruct them: "Return all JSONL lines as text. You CANNOT write files."

### Pass 1: Initial Scan (3 Parallel Explore Agents, Internal 3-Pass CL Each)

Dispatch 3 parallel Explore agents. Each runs a **3-pass convergence loop
internally** (not just a single scan):

- **Pass 1 (within agent):** Initial catalog of all 36 agents
- **Pass 2 (within agent):** Re-verify uncertain findings, check for misses
- **Pass 3 (within agent):** T20 tally — Confirmed/Corrected/New/Dropped. If
  Corrected + New > 20% of Confirmed, agent does another pass before returning.

Each agent returns: JSONL findings as text + SUMMARY line with CL tally.

**Agent 1A: Frontmatter Validator** — checks all agents for: name format,
description presence and quality, model declaration, tools list presence, unused
frontmatter fields (memory, isolation, hooks, maxTurns, etc.)

**Agent 1B: Tool & Model Checker** — cross-checks: tool lists match actual
prompt references, model assignments follow Decision #18 criteria (opus for
complex, sonnet for routine), agents don't reference non-existent scripts/paths

**Agent 1C: Redundancy & Integration Scanner** — detects: overlapping agent
descriptions, agents with >80% responsibility overlap, CLAUDE.md Section 7
trigger coverage gaps, agents with zero invocation history

**Orchestrator writes** findings to:

- `AUDIT_DIR/stage-1a-frontmatter.jsonl`
- `AUDIT_DIR/stage-1b-tools.jsonl`
- `AUDIT_DIR/stage-1c-redundancy.jsonl`

**Done when:** All 3 agents complete, orchestrator has written all JSONL files.

### Pass 2: Cross-Agent CL Verification (MUST)

Dispatch 1 general-purpose agent (not Explore — needs Write access) that reads
all Pass 1 JSONL files from disk and:

- Confirms findings with evidence (grep/read actual files)
- Corrects any false positives or missed issues
- Checks for cross-domain contradictions (e.g., 1A says tools present but 1B
  says tools missing)
- T20 tally: Confirmed/Corrected/Extended/New

Writes merged findings to `AUDIT_DIR/stage-1-merged.jsonl`.

**Done when:** T20 tally shows convergence. Merged findings on disk.

---

## Stage 2: Interactive Behavioral Review (Audit-Team, Per-Agent)

**CL requirement (Critical Rule #3):** Mid-audit convergence every 6 agents.

### Team Setup (MUST)

Spawn `audit-team` with 2 persistent members:

- **reviewer**: Evaluates each agent against 13 behavioral categories. Scores
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

## Stage 2.5: Improvement Implementation & Testing (Batch)

**Depends on:** Stage 2 complete (all "improve now" decisions collected).

This stage implements all accepted improvements as a batch, then validates each
improved agent with both structural and behavioral tests.

### Implementation (per agent with "improve now" decision)

For each agent, apply the proposed improvements from Stage 2:

- Prompt rewrites, code pattern additions, script workflow additions
- Frontmatter fixes, tool list corrections, model changes
- GSD agents: flag-only (mark as upstream, do not modify)

### Testing Protocol (MUST — both structural AND behavioral)

**Structural validation (automated):**

1. Verify frontmatter passes Stage 1 checks (name, description, model, tools)
2. Verify referenced scripts exist (`npm run patterns:check`, etc.)
3. Verify code patterns are syntactically valid
4. Run `npm run patterns:check` on any added script content

**Behavioral validation (invoke-and-evaluate):**

1. For each improved agent, define a **test task** appropriate to its domain:
   - code-reviewer → review a known diff with known issues
   - security-auditor → audit a file with planted vulnerabilities
   - frontend-developer → build a small component
2. Invoke the improved agent on the test task
3. Evaluate output against expected quality (did it catch the issues? follow the
   workflow? produce structured output?)
4. Compare to pre-improvement baseline if available

**Pass/fail criteria:**

- Structural: all checks pass
- Behavioral: output quality is equal or better than pre-improvement

**Done when:** All "improve now" agents pass both validation types. Failures
cycle back for fix + re-test.

---

## Stage 3: Synthesis (1 Agent, Cross-Stage CL)

**CL requirement (Critical Rule #3):** Cross-stage contradiction check.

### Scoring (MUST)

> Read REFERENCE.md for category weights and scoring formula.

Per-agent composite: weighted average of 13 category scores (0-100). Ecosystem
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

## Stage 4: Built-in Agent Optimization (SHOULD)

**Scope:** Built-in agents (Explore, Plan, general-purpose, Bash) cannot be
modified via `.claude/agents/` files, but their invocation parameters and the
control infrastructure around them CAN be optimized.

**Run after:** Stage 3 synthesis. Can be skipped if audit scope is `--scope gsd`
or `--scope stubs`.

### Step 4.1: Review Built-in Agent Usage Patterns

For each built-in agent type, assess:

- Are we using the right built-in for each task? (e.g., Explore when we need
  writes → should be general-purpose)
- Are we overriding model when quality matters? (Explore defaults to haiku —
  override to sonnet for CL verification passes)
- Are invocation parameters optimal? (mode, isolation, maxTurns)

### Step 4.2: Frontmatter Hardening (Custom Agents)

Apply high-value frontmatter fields to improved custom agents:

- **`maxTurns: 25`** on review agents (code-reviewer, security-auditor) —
  prevents runaway token burn. These should finish in 10-15 turns.
- **`disallowedTools: Agent`** on review agents — review agents should do their
  own work, not spawn sub-agents.
- **`permissionMode: bypassPermissions`** on code-reviewer when invoked by
  pre-commit hooks — automated flow shouldn't pause for approval on file reads.

### Step 4.3: Control Infrastructure Gaps

Assess and recommend fixes for invocation control:

- **Agent compliance strict mode:** Should `check-agent-compliance.js` enforce
  POST-TASK triggers (code-reviewer after code changes) with `--strict`? Or
  remain advisory?
- **PreToolUse hook for Agent tool:** Currently no hook fires BEFORE agent
  invocation. A PreToolUse hook could enforce mandatory agents for specific file
  patterns (e.g., security-auditor for `**/auth/**`).
- **Explore model override convention:** Document when to pass `model: "sonnet"`
  to Explore agents (CL verification, audit discovery) vs accepting haiku
  default (quick scans).

### Step 4.4: Present Recommendations

Present findings to user as decision list. Only implement with approval.

**Done when:** Built-in usage reviewed, frontmatter hardening applied (if
approved), control gap recommendations documented.

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

| Version | Date       | Description                                                                                                                                      |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.2     | 2026-03-17 | Added Stage 4 (built-in agent optimization), Stage 2.5 (implementation + testing), Categories 12-13, team-leader pattern, value filter (Rule #7) |
| 1.1     | 2026-03-17 | skill-audit: 27 decisions applied                                                                                                                |
| 1.0     | 2026-03-17 | Initial creation via /create-audit                                                                                                               |
