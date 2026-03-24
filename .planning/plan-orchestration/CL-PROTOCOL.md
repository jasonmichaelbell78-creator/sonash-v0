# Plan Execution CL Protocol

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Purpose

Defines the convergence-loop protocol for all pre-execution discovery and
post-execution verification within plan orchestration and sub-plans. Adapted
from the deep-research skill's 5-phase CL architecture for codebase verification
contexts.

**Origin:** Session #237 correction. Single-pass Explore agents were run instead
of proper CLs. This protocol prevents that by making the multi-pass structure
explicit and mandatory.

**Canonical reference:** `.claude/skills/deep-research/SKILL.md` Phases 1-4 and
`REFERENCE.md` Sections 8-9 (contrarian/OTB templates), Section 13 (cross-model
verification), Section 14 (CL research-claims behaviors).

---

## Agent Selection: Always Most Capable

**Non-negotiable:** Every CL agent role uses the most capable model and agent
type available, regardless of speed or cost. Quality of verification determines
quality of execution — cutting corners here cascades into implementation errors.

### Agent Roster for CL Roles

| CL Role                | Agent Type            | Model    | Why                                                                                                                      |
| ---------------------- | --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| **D1 Discovery**       | `general-purpose`     | **opus** | Must reason about code intent, not just pattern-match. Needs judgment to distinguish violations from intentional design. |
| **D3 Contrarian**      | `general-purpose`     | **opus** | Adversarial reasoning is the highest-judgment task. Must challenge findings with nuance, not generic skepticism.         |
| **V1 Verification**    | `general-purpose`     | **opus** | Must assess whether a fix is functionally correct, not just syntactically present.                                       |
| **V3 Contrarian**      | `general-purpose`     | **opus** | Same reasoning as D3 — adversarial verification requires the strongest model.                                            |
| **D2/D4/V4 Synthesis** | Inline (orchestrator) | **opus** | Consolidation and completeness audits run in the main session.                                                           |
| **V2 Regression**      | Bash commands         | N/A      | Automated checks (lint, test, patterns). No agent needed.                                                                |

### When to Use Teams vs Solo Agents

| Scenario                                             | Use                           | Rationale                                                                                                                                                            |
| ---------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discovery across 5+ files with shared concerns       | **audit-review-team**         | Reviewer accumulates cross-file patterns; fixer isn't needed for discovery but reviewer's pattern memory across targets is valuable. Spawn reviewer-only (1 member). |
| Discovery + immediate fix execution                  | **audit-review-team** (full)  | Reviewer discovers, fixer implements. The 2-member pipeline avoids context loss between discovery and execution.                                                     |
| Complex plan with research → planning → verification | **research-plan-team**        | 3-member team when the CL feeds into plan creation or revision. Verifier member maps directly to D3/V3 contrarian role.                                              |
| Simple verification (1-3 files)                      | Solo `general-purpose` agents | Team overhead isn't justified for small scope.                                                                                                                       |

### Model Override Rule

All team member definitions in `.claude/teams/` currently specify `sonnet` for
reviewer/verifier roles. **When spawned for CL Protocol work, override to
`opus`:**

```
TeamCreate("audit-review-team")
  members:
    - name: "reviewer"
      model: "opus"    # Override from sonnet for CL work
      ...
```

This override applies ONLY when the team is spawned for CL Protocol phases, not
for routine audit work where sonnet is sufficient.

---

## Phase D: Discovery CL (Pre-Execution)

Use before executing any plan step that modifies code. Verifies claims from the
plan are still accurate against the current codebase.

### D1: Parallel Discovery Agents

**Purpose:** Read files fully, catalog findings with exact line numbers and code
context.

**Agent type:** `general-purpose` (opus). One per file group (batch by logical
concern, not arbitrarily). Each agent receives:

- The file(s) to read (MUST read fully, not grep)
- The plan's expected findings for those files
- The compliance criteria to evaluate against

**Concurrency:** 4 agents max per wave (matches deep-research pattern).

**Output per agent:** For each finding:

- Exact current line number(s)
- 2-3 lines of quoted code context
- Confidence: HIGH (clear violation) / MEDIUM (likely but needs context) / LOW
  (uncertain)
- Whether the plan's proposed fix is still appropriate
- Any changes to the code since the plan was written

**Timeout:** 5 min per agent. Mark failed agents, present to user.

### D2: Synthesis

**Purpose:** Consolidate D1 findings into a single verified inventory.

**Method:** Inline (not a separate agent) unless findings exceed 30 items.

**Output:**

- Total count by confidence level
- Planned vs discovered comparison (what matched, what's new, what's missing)
- Discrepancies flagged for D3

### D3: Contrarian Verification

**Purpose:** Challenge D1 findings. Separate agents re-read the same files
looking for:

1. **False positives** in D1 — items flagged as violations that are actually
   compliant
2. **Missed violations** D1 didn't catch — read with fresh eyes, different
   criteria interpretation
3. **Invalid fixes** — proposed fixes that won't work given current code
   structure, dependencies, or side effects
4. **Alternative explanations** — is the "violation" actually intentional
   design?

**Agent type:** 1-2 `general-purpose` (opus) contrarian agents (not the same
agents that did D1). Contrarian agents receive D1's findings as input plus the
original files.

**Template (adapted from deep-research Section 8):**

```
You are a contrarian verifier. Your job is to challenge these discovery
findings. For each finding:

1. Re-read the code at the cited line numbers. Does the violation actually exist?
2. Is the proposed fix appropriate? What could go wrong?
3. What was MISSED in the same file that should have been flagged?
4. Is any finding actually intentional design, not a violation?

Rules:
- Read the actual code, don't trust the finding's description
- Rate each finding: CONFIRMED | WEAKENED | FALSE-POSITIVE
- Report any NEW findings the discovery agents missed
- If a fix has side effects, describe them specifically
```

**Re-synthesis trigger:** If contrarian pass changes >20% of findings (adds,
removes, or reclassifies), run D2 again with updated data.

### D4: Completeness Audit

**Purpose:** Verify coverage — no files skipped, no findings orphaned.

**Checklist:**

- [ ] Every file in the plan's scope was read by at least one D1 agent
- [ ] Every plan-expected finding has a disposition (confirmed/missing/changed)
- [ ] D3 contrarian findings integrated into the inventory
- [ ] Total count is stable (D2 count matches D3-adjusted count)
- [ ] Confidence distribution is reasonable (not >80% HIGH or >80% LOW)

**Output:** Final verified inventory with counts. Present to user before
execution.

---

## Phase V: Verification CL (Post-Execution)

Use after executing plan steps. Verifies fixes are functional, not just
syntactically present.

### V1: Parallel Verification Agents

**Purpose:** Re-read each modified file, confirm fix is functional.

**Agent type:** `general-purpose` (opus). One per file group (same grouping as
D1).

**Each agent checks:**

- The violation at the original line — is it actually resolved?
- Does the fix match the plan's intent (not just a syntactic change)?
- Are there side effects? (new warnings, changed behavior, broken callers)
- Does the file still pass its own internal consistency? (no orphaned imports,
  no broken references)

**Output per finding:** FIXED / PARTIALLY-FIXED / NOT-FIXED / REGRESSION

### V2: Regression Check

**Purpose:** Automated verification that nothing broke.

**Commands (all must pass):**

```bash
npm run lint
npm test
npm run patterns:check
```

**If any fail:** Stop. Present failure to user with options (fix / investigate /
rollback).

### V3: Contrarian Verification

**Purpose:** Challenge that fixes actually work.

**Agent type:** 1-2 `general-purpose` (opus) contrarian agents (different from
V1 agents). They receive the V1 results plus the modified files.

**They look for:**

1. **Fixes that appear to work but don't** — syntactically correct but
   functionally wrong (e.g., added a `Fix:` message but it's unreachable code)
2. **Side effects introduced** — fix one violation, create another
3. **Compliance criteria not actually met** — the letter of the fix is there but
   the spirit isn't (e.g., "Fix: run X" added but X doesn't exist)
4. **Incomplete propagation** — same pattern exists elsewhere but wasn't fixed

**Re-verification trigger:** If contrarian pass finds >20% of fixes problematic,
loop back to V1 with the issues.

### V4: Completeness Audit

**Purpose:** Final accounting.

**Checklist:**

- [ ] fixed + deferred + rejected = total from D4 inventory
- [ ] Every file modified in execution was re-read in V1
- [ ] V3 contrarian findings resolved or escalated
- [ ] All automated checks pass (V2)
- [ ] No untracked files left behind (`git status`)

**Output:** Final verification report. Present to user before commit.

---

## Placement in Plan Orchestrator

| Orchestrator Step               | Protocol Phase                 | Scope                                              |
| ------------------------------- | ------------------------------ | -------------------------------------------------- |
| Step 1: S0 Pre-Verification     | Phase D (full)                 | S0 debt items against codebase                     |
| Step 4: S0 Post-Verification    | Phase V (full)                 | S0 fix effectiveness                               |
| Step 6: Wave 1 Pre-Verification | Phase D (full)                 | All 5 plan entry assumptions                       |
| Step 8: Wave 1a Mid-Audit       | Phase V (full)                 | Shared-file changes (session-start.js, pre-commit) |
| Step 10: Wave 1 Final Audit     | Phase V (full) + code-reviewer | All Wave 1 work                                    |
| Step 11: SWS Pre-Verification   | Phase D (full)                 | SWS entry assumptions                              |

## Placement in Sub-Plans

Every sub-plan that modifies code gets two CL points:

| Point          | When                                     | Protocol Phase |
| -------------- | ---------------------------------------- | -------------- |
| Pre-execution  | Before Step 1 of the sub-plan            | Phase D (full) |
| Post-execution | After last fix step, before audit/commit | Phase V (full) |

### Passive-Surfacing Remediation

| Point   | Scope                                                                               |
| ------- | ----------------------------------------------------------------------------------- |
| Phase D | 14 hook/script files + 4 audit skills. Verify all 33+ violations exist, fixes valid |
| Phase V | After Steps 1-9, before Step 10 (code-reviewer audit). Verify all fixes functional  |

### Propagation Patterns

| Point   | Scope                                                                      |
| ------- | -------------------------------------------------------------------------- |
| Phase D | File lists from triage. Verify counts, patterns, shared-lib targets        |
| Phase V | After each wave. Verify propagation complete, no regressions in 100+ files |

### CLI Tools Implementation

| Point   | Scope                                                    |
| ------- | -------------------------------------------------------- |
| Phase D | Tool availability, session-start.js state, install paths |
| Phase V | All tools installed and functional, no conflicts         |

### Custom Statusline

| Point   | Scope                                         |
| ------- | --------------------------------------------- |
| Phase D | Go toolchain, build environment, no conflicts |
| Phase V | Binary builds, runs, displays correctly       |

---

## Guard Rails

- **Agent selection:** All CL agents use `general-purpose` (opus). No
  exceptions. No downgrading to sonnet or Explore for speed. Quality over speed.
- **Agent count:** D1 agents scale with file count (1 per logical group, max 8
  per wave). D3/V3 contrarian agents: 1-2 regardless of scope.
- **Team spawning:** For 5+ file groups with shared concerns, spawn
  `audit-review-team` with model override to opus. For research-to-plan
  pipelines, spawn `research-plan-team`.
- **Timeout:** 5 min per agent. Failed agents reported to user.
- **Scope explosion:** If D1 finds >50 items, pause and present before D3.
- **Re-synthesis cap:** Max 2 re-synthesis loops. If still unstable, escalate to
  user.
- **Contrarian quality:** Contrarian agents must cite specific line numbers and
  code, not generic skepticism (per deep-research Section 8 rules).
- **No single-pass shortcuts:** Every CL phase (D1→D2→D3→D4, V1→V2→V3→V4) is
  mandatory. Skipping any phase requires explicit user approval.

---

## Version History

| Version | Date       | Description                                                                                        |
| ------- | ---------- | -------------------------------------------------------------------------------------------------- |
| 1.1     | 2026-03-24 | Agent selection guidance: opus for all CL roles, team spawn rules, model override for team CL work |
| 1.0     | 2026-03-24 | Initial protocol. Session #237 correction — replaces vague "CL agents"                             |
