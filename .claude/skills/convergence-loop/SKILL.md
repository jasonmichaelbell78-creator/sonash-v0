---
name: convergence-loop
description:
  Multi-pass verification of claims about reality using agent-based discovery,
  T20 tallies, and composable behaviors. Use when claims could waste effort if
  wrong — audits, discovery, doc-sync, plan verification.
---

# Convergence Loop

Verify claims about reality through multi-pass agent loops with composable
behaviors. Implements tenet T20 (research_convergence_loops) and T25 (discovery
phases SHOULD use convergence loops).

## Critical Rules

1. **Minimum 2 passes** — MUST never single-pass. First pass discovers, second
   verifies. One-pass work is not a convergence loop.
2. **T20 tally every pass** — MUST record Confirmed / Corrected / Extended / New
   for every pass. No pass without a tally.
3. **User gate before convergence declaration** — MUST present tally and
   recommend converged/not-converged. User decides. (CLAUDE.md guardrail #2)
4. **Save state after every pass** — MUST persist to state file. Convergence
   loops are long-running and WILL hit compaction.
5. **Graduated convergence** — per-claim, not all-or-nothing. Converged claims
   graduate; unconverged continue to next pass.
6. **Contradictions are findings** — disagreement between agents or sources is a
   discovery, not an error. Surface with evidence from both sides.

## When to Use

- Verifying claims about codebase state (audit findings, diagnosis)
- Discovery phases in any skill (T25 — deep-plan, skill-audit, ecosystem audits)
- Validating plan completeness against requirements
- Cross-referencing documentation against code reality
- Any task where acting on wrong claims wastes significant effort

## When NOT to Use

- Single-value lookups ("what version is X?")
- Mechanical operations (git mv, file deletion)
- Tasks with binary right/wrong answers verifiable by running code
- When claims set has <3 items (overhead exceeds value)

## Composable Behaviors

Six behaviors that can be assigned to any pass. See REFERENCE.md Section 1 for
full definitions, agent prompt templates, and required output format.

| Behavior            | Purpose                                       | When to Use         |
| ------------------- | --------------------------------------------- | ------------------- |
| `source-check`      | Verify claims against source material         | First pass (Loop 0) |
| `discovery`         | Find NEW issues, not just confirm existing    | Early passes        |
| `verification`      | Confirm/extend existing claims                | Middle passes       |
| `fresh-eyes`        | Zero prior context — independent verify       | Final pass          |
| `write-then-verify` | Produce output then verify in same pass       | Writing tasks       |
| `fix-and-re-verify` | Apply corrections, re-verify without new pass | Mid-pass fixes      |

## Presets

| Preset            | Sequence                                                                                                      | Passes | Use Case                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------- |
| `standard`        | source-check -> verification -> fresh-eyes                                                                    | 3      | General purpose                     |
| `quick`           | verification -> verification                                                                                  | 2      | Lightweight confirmation            |
| `thorough`        | source-check -> discovery -> verification -> verification -> fresh-eyes                                       | 5      | High-stakes (SWS-level)             |
| `research-claims` | verify-sources -> cross-reference -> temporal-check -> completeness-audit -> bias-check -> synthesis-fidelity | 6      | `/deep-research` claim verification |

Custom: compose any behavior sequence. Callers can inject domain-specific
instructions into agent prompts via the prompt customization hook (see
REFERENCE.md Section 7).

---

## Input

Auto-detected format — provide any of:

- **Inline text**: Claims listed in conversation
- **File path**: Document containing claims (e.g., DIAGNOSIS-v2.md)
- **JSONL/JSON**: Structured findings from audits or pipelines
- **Conversation context**: Claims from ongoing work

**Valid claims:** A claim is a testable assertion about codebase/documentation
state. Each claim SHOULD have: (1) the assertion, (2) the source it references.
Claims without sources default to `source-check` behavior scanning the full
codebase.

MUST also provide or accept default for:

- **Domain slicing strategy** — how to split work across agents
- **Preset or custom behavior sequence** — which behaviors per pass

## Output

1. **Verified claims set** — corrected claims replace originals, with evidence
2. **Convergence report** — summary table + claims delta (what changed and why)
3. **Confidence score** — HIGH (0 corrections in final 2 passes), MEDIUM (1
   extension in final pass), LOW (corrections still declining but not zero)

For long-running or high-stakes loops, SHOULD write the convergence report to
`.claude/state/convergence-report-{topic}.md` alongside the state file.

## Quick Start Example

```
Topic: "Verify DIAGNOSIS-v2.md claims"
Input: /convergence-loop .planning/system-wide-standardization/DIAGNOSIS-v2.md
Preset: standard (source-check -> verification -> fresh-eyes)
Slicing: doc-by-section (4 agents)

Pass 1 (source-check): Confirmed 18, Corrected 3, Extended 2, New 1
Pass 2 (verification): Confirmed 22, Corrected 1, Extended 0, New 0
Pass 3 (fresh-eyes):   Confirmed 23, Corrected 0, Extended 0, New 0
-> CONVERGED (confidence: HIGH). 4 corrections applied, 2 extensions, 1 new.
```

**Canonical first test:** Run against DIAGNOSIS-v2.md (the document that
motivated this skill's creation — per PLAN-v3.md Step 0.1 "done when").

---

## Workflow

### Validate (gate — before Setup)

1. **Check input** — identify claims format, count claims
   - If >100 claims: MUST suggest decomposition before starting. Do not proceed.
2. **Check for existing state** — if
   `.claude/state/convergence-loop-{topic}.state.json` exists, present:
   "Resuming convergence loop on {topic}. {N} passes complete. Last pass:
   {behavior}. Continue from pass {N+1}? [Y/restart]"

### Setup

1. **Select preset or custom sequence** — present presets, recommend one
2. **Configure agents** — min 2, default 3-5, max 8. Scale to claims volume. Use
   the Agent tool with subagent_type appropriate to the domain (e.g.,
   `general-purpose` for doc verification, `code-reviewer` for code claims).
3. **Select domain slicing** — see REFERENCE.md for templates. Caller picks or
   customizes.
4. **Initialize state file** —
   `.claude/state/convergence-loop-{topic}.state.json` (see REFERENCE.md Section
   6 for schema)
5. **Present warm-up** — "Convergence loop: {topic}. Preset: {preset} ({N}
   passes). Agents: {N}. Slicing: {strategy}. Claims: {count}. Proceed?
   [Y/adjust]"

### Loop (repeat per pass)

1. **Dispatch agents** — each agent gets:
   - Its domain slice of claims
   - Behavior instructions for this pass
   - Required output format (see REFERENCE.md Section 1)
   - Prior pass tally and corrections (EXCEPT fresh-eyes: gets nothing)
2. **Collect results** — gather all agent outputs
   - **Agent output validation**: If an agent returns <3 findings for a slice of
     > 10 claims, or returns findings without claim IDs, flag as degraded.
     > Re-dispatch once. If second attempt fails, mark claims as "unverifiable."
   - **Deduplication**: If multiple agents report on the same claim, merge. If
     they agree, count once. If they disagree, route to Disagreement Handling.
3. **Compute T20 tally**:
   - **Confirmed**: claim verified as-is
   - **Corrected**: claim was wrong, replacement provided with evidence
   - **Extended**: claim was right but incomplete, additions provided
   - **New**: agent found something not in original claims
4. **Graduated convergence check**:
   - Claims with 2+ consecutive "Confirmed" across passes -> GRADUATED
   - Claims with "Corrected" or "Extended" -> continue to next pass
   - New findings -> added to claims set for next pass
5. **Summarize pass delta** — what was corrected, extended, or discovered.
   Present narrative before tally numbers.
6. **Present tally to user** — include pass progress: "Pass {N} of {max}
   ({behavior})". Recommend converged/not-converged with confidence score.
7. **User gate** — user approves continuation or declares convergence
8. **Save state** — full detail for current pass

### Convergence Decision Logic

Recommend **CONVERGED** when:

- Zero corrections in latest pass AND
- Zero new findings in latest pass AND
- All remaining claims are Confirmed or Graduated

Recommend **NOT CONVERGED** when:

- Any corrections in latest pass, OR
- New findings discovered, OR
- Unresolved disagreements between agents

**Warn at pass 3** without convergence trend: "3 passes without convergence —
consider splitting the claims set or narrowing scope."

**Hard cap**: Default 5 passes. Configurable. After max: present partial results
with unconverged claims flagged. Report MUST include an "Unconverged" section
listing claims that never stabilized, with last known agent positions and
recommended next action (decompose, manual review, or accept-as-is).

### Disagreement Handling

When agents disagree on a claim:

1. Surface both positions with evidence
2. Recommend resolution based on evidence quality
3. User decides — or delegates ("you decide" accepted)
4. Record resolution rationale in state file

### Report

Generate on convergence (or max passes):

**Section 1 — Summary Table:**

```
| Pass | Behavior      | Agents | Confirmed | Corrected | Extended | New |
|------|---------------|--------|-----------|-----------|----------|-----|
| 1    | source-check  | 4      | 18        | 3         | 2        | 1   |
| 2    | verification  | 3      | 22        | 1         | 0        | 0   |
| 3    | fresh-eyes    | 3      | 23        | 0         | 0        | 0   |
Confidence: HIGH | Convergence: ACHIEVED at Pass 3
```

**Section 2 — Claims Delta** (only changed claims):

```
| Claim | Original | Corrected/Extended | Evidence | Pass |
```

**Section 3 — Unconverged** (if max passes reached):

```
| Claim | Last Status | Agent Positions | Recommended Action |
```

---

## Programmatic Mode

Other skills reference this skill's workflow without invoking
`/convergence-loop` directly. To integrate:

1. Read this SKILL.md's Workflow section
2. Implement the Setup -> Loop -> Report sequence in your skill's relevant phase
3. Use the T20 tally format
4. Reference REFERENCE.md for behavior definitions and slicing templates

**Caller return:** For programmatic callers, return the verified claims set,
convergence status, and confidence score. The calling skill resumes its workflow
with the corrected claims.

**Note:** Integration with `/deep-plan` and `/skill-creator` complete (Session
#222). Remaining callers (audit skills, `/systematic-debugging`) will integrate
during Phase 3 ecosystem standardization.

Skills that MUST integrate (per T25 — discovery phases):

- `/deep-plan` — discovery phase
- `/skill-audit` — discovery phase
- `/skill-creator` — validation phase + planning prompt
- `/create-audit` — codebase exploration phase
- All audit skills — discovery phase
- `/systematic-debugging` — hypothesis generation

## State Management

**File:** `.claude/state/convergence-loop-{topic}.state.json` **Schema:** See
REFERENCE.md Section 6 for full JSON schema.

**Graduated storage:**

- Completed passes: tally summary + corrections list only
- Current pass: full agent outputs + intermediate results
- Always: input claims, behavior sequence, agent config, timestamps

**Resume:** Re-invoke `/convergence-loop` — Validate step detects existing
state, presents status, offers continue/restart.

## Guard Rails

- **>100 claims**: MUST suggest decomposition before starting (Validate gate)
- **Pass 3 no trend**: Warn, suggest scope split
- **Agent timeout**: Retry once, then mark claim "unverifiable", continue
- **Agent degradation**: <3 findings for >10 claims = re-dispatch once
- **User "stop"**: Save state, present partial tally, offer resume/abandon
- **Contradictory sources**: Flag as finding (contradictions ARE findings)
- **Scope explosion**: If new findings exceed original claims count, pause and
  ask user whether to absorb or split
- **Duplicate findings**: Merge overlapping agent results before tallying

---

## Version History

| Version | Date       | Description                                                                                                                                         |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1     | 2026-03-15 | Skill-audit S1-S22: validation gate, warm-up, agent dispatch, output format, dedup, confidence score, resume detection, schema, quick-start example |
| 1.0     | 2026-03-15 | Initial creation via /skill-creator (Session #221, 17 discovery decisions)                                                                          |
