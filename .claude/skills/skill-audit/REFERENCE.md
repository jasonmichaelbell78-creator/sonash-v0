<!-- prettier-ignore-start -->
**Document Version:** 2.2
**Last Updated:** 2026-04-04
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Skill Audit Reference

10-category audit framework for evaluating individual skill behavioral quality.
Each category includes purpose, evaluation criteria, common findings, and
scoring guidance.

---

## Category 1: Intent Fidelity

**Purpose:** Does the skill deliver what its tagline promises?

### Evaluation Criteria

- Tagline/description accuracy — does the skill do what it says?
- Promise vs delivery gap — are there implicit promises not fulfilled?
- Key terms alignment — do terms like "exhaustive," "comprehensive," etc. match
  actual behavior?
- Decision record completeness — are all decisions captured?

### Common Findings

- Tagline promises "exhaustive" but caps questions at a fixed number
- Description claims "structured" but output format is loose
- Key deliverables mentioned in description but not produced by workflow
- Quality checklist exists but isn't enforced during execution

### Scoring Guide

| Score | Criteria                                              |
| ----- | ----------------------------------------------------- |
| 9-10  | Tagline perfectly matches behavior, all promises met  |
| 7-8   | Minor gaps between description and delivery           |
| 5-6   | Notable promises unfulfilled or misleading terms      |
| 3-4   | Significant disconnect between intent and behavior    |
| 1-2   | Skill does something materially different from stated |

---

## Category 2: Workflow Sequencing

**Purpose:** Are the phases in the right order with the right boundaries?

### Evaluation Criteria

- Phase ordering — does each phase have the inputs it needs?
- Phase boundaries — are handoffs between phases explicit?
- Missing phases — is anything assumed but not stated?
- Phase granularity — too many small phases or too few large ones?
- Context gathering — does the skill explore before asking?

### Common Findings

- Missing Phase 0 (context gathering before discovery)
- Handoff phase disguised as full execution phase
- No inter-batch synthesis during multi-batch discovery
- Execution phase assumes too much about implementation approach
- No explicit handoff procedure to downstream tools

### Scoring Guide

| Score | Criteria                                               |
| ----- | ------------------------------------------------------ |
| 9-10  | Perfect sequencing, explicit handoffs, nothing missing |
| 7-8   | Good flow with minor ordering or boundary issues       |
| 5-6   | Missing phase or unclear handoffs                      |
| 3-4   | Multiple sequencing issues affecting quality           |
| 1-2   | Phases in wrong order or critical phases missing       |

---

## Category 3: Input/Output Quality

**Purpose:** Are inputs well-specified and outputs well-defined?

### Evaluation Criteria

- Input specification — what does the skill need to start?
- Output artifacts — what files/documents does it produce?
- Output format — is the format specified or left ambiguous?
- Artifact contracts — are produced artifacts documented for consumers?
- Arguments/parameters — does the skill accept configuration?

### Common Findings

- No topic/argument specification for invocation
- Output location not specified (where do artifacts go?)
- Decision record not standalone (embedded in plan, hard to reference)
- Step structure lacks "Done when:" criteria
- No DIAGNOSIS or context document produced before planning

### Scoring Guide

| Score | Criteria                                                |
| ----- | ------------------------------------------------------- |
| 9-10  | All inputs/outputs specified with formats and locations |
| 7-8   | Most artifacts defined, minor ambiguity                 |
| 5-6   | Key outputs undefined or format unspecified             |
| 3-4   | Multiple undefined artifacts or ambiguous formats       |
| 1-2   | No clear input/output specification                     |

---

## Category 4: Decision Points

**Purpose:** How well does the skill handle decisions and user interaction?

### Evaluation Criteria

- Question quality — specific, with defaults, referencing codebase?
- Question quantity — enough to eliminate assumptions?
- Batch management — grouped sensibly, not overwhelming?
- Decision capture — are choices recorded for reference?
- Inference handling — does the skill state when it infers vs asks?
- Front-loading — are critical decisions asked first?

### Common Findings

- Artificial caps on question count (e.g., "10-25 questions")
- No floor on minimum questions (skill could ask 3 and move on)
- Missing delegation protocol (how to indicate "your call")
- Batch cap too rigid (e.g., "cap at ~8 per batch")
- No mechanism to revisit earlier answers with new context
- Critical architectural decisions not front-loaded

### Scoring Guide

| Score | Criteria                                              |
| ----- | ----------------------------------------------------- |
| 9-10  | Smart questioning, good defaults, captures everything |
| 7-8   | Good question flow with minor gaps                    |
| 5-6   | Question quantity/quality issues or weak capture      |
| 3-4   | Poor questioning strategy, missing key decisions      |
| 1-2   | No real decision process, assumptions everywhere      |

---

## Category 5: Integration Surface

**Purpose:** How well does the skill connect to the broader ecosystem?

### Evaluation Criteria

- Neighbor awareness — does the skill know its adjacent skills?
- Handoff protocols — explicit procedures for passing work downstream?
- State persistence — compaction resilience for long-running skills?
- ROADMAP alignment — does the skill check project context?
- Artifact contracts — do produced artifacts match consumer expectations?
- Session management — session-end hooks, state cleanup?

### Common Findings

- No compaction resilience for skills running 30+ minutes
- No ROADMAP check before planning (misaligned with project goals)
- Handoff procedure not explicit (just "proceed to Phase 5")
- No decision tree for what happens after the skill completes
- Inline triggers not specified (what triggers downstream skills)
- No session-end integration (state left dangling)

### Scoring Guide

| Score | Criteria                                                 |
| ----- | -------------------------------------------------------- |
| 9-10  | Full ecosystem integration, explicit handoffs, resilient |
| 7-8   | Good integration with minor gaps                         |
| 5-6   | Some integration but missing key handoffs or resilience  |
| 3-4   | Isolated skill with weak connections                     |
| 1-2   | No integration awareness                                 |

---

## Category 6: Guard Rails

**Purpose:** Does the skill handle failure modes and edge cases?

### Evaluation Criteria

- Contradiction detection — what if user answers conflict?
- Scope explosion — what if scope grows beyond skill boundaries?
- Recovery procedure — how to resume from partial execution?
- Reframe path — what if the task isn't what it seemed?
- Phase validation — gates between phases?
- Disengagement protocol — how to gracefully exit mid-skill?
- Anti-patterns — does the skill explicitly warn against common mistakes?

### Common Findings

- No contradiction detection between user answers
- No scope explosion handling (skill keeps growing)
- No recovery procedure for mid-execution failure
- No reframe path when Phase 0 reveals different needs
- No phase validation gates (phases bleed into each other)
- No disengagement protocol (can't exit cleanly)
- Anti-patterns list incomplete or missing
- Artificial plan size cap (e.g., "500 lines")

### Scoring Guide

| Score | Criteria                                               |
| ----- | ------------------------------------------------------ |
| 9-10  | Comprehensive failure handling, all edge cases covered |
| 7-8   | Good coverage with minor blind spots                   |
| 5-6   | Some guard rails but missing key failure modes         |
| 3-4   | Minimal error handling, several unaddressed cases      |
| 1-2   | No guard rails, fragile execution                      |

---

## Category 7: Prompt Engineering Quality

**Purpose:** Is the skill structured for optimal LLM attention?

### Evaluation Criteria

- Primacy bias — are critical rules in the top third?
- MUST/SHOULD/MAY — is the instruction hierarchy applied?
- Size management — core under 300 lines with companion files?
- Guided prompts — specific prompts vs generic placeholders?
- Redundancy — critical rules repeated at point-of-use?
- Examples — compressed, illustrative, not bloating the skill?
- Incremental persistence — state saved throughout, not just at end?

### Common Findings

- Critical rules buried in middle or bottom of file
- All instructions at same "volume" (no MUST/SHOULD/MAY)
- Skill exceeds 300 lines without companion files
- Generic placeholders like `[Implementation details]`
- Detailed examples that should be in REFERENCE.md
- No incremental state persistence for long-running skills
- Redundant content that could be extracted

### Scoring Guide

| Score | Criteria                                                 |
| ----- | -------------------------------------------------------- |
| 9-10  | Optimal attention management, lean core, clear hierarchy |
| 7-8   | Good structure with minor attention issues               |
| 5-6   | Some attention problems, moderate bloat                  |
| 3-4   | Poor attention management, critical rules buried         |
| 1-2   | No attention awareness, monolithic skill file            |

---

## Category 8: Scope Boundaries

**Purpose:** Is the skill's scope clearly defined relative to neighbors?

### Evaluation Criteria

- Clear scope definition — what's in vs out?
- Neighbor differentiation — how does this differ from similar skills?
- Routing guidance — when to use this vs alternatives?
- Expanded task coverage — does the skill handle its full domain?
- GSD relationship — clear boundary with project-level planning?
- Brainstorming pipeline — where does brainstorming fit?

### Common Findings

- Overlap with GSD planning skills not resolved
- No routing section for skills with close neighbors
- Task type coverage too narrow (only handles one pattern)
- "When NOT to Use" doesn't name specific alternatives
- No clear boundary between this skill and writing-plans
- Middle-ground tasks (3-4 decisions) fall through the cracks

### Scoring Guide

| Score | Criteria                                              |
| ----- | ----------------------------------------------------- |
| 9-10  | Crystal clear scope, explicit routing, no gaps        |
| 7-8   | Good scope definition with minor overlaps             |
| 5-6   | Some boundary confusion with neighbors                |
| 3-4   | Significant overlap or scope gaps                     |
| 1-2   | Undefined scope, constant confusion about when to use |

---

## Category 9: Institutional Memory

**Purpose:** Does the skill learn and reference project context?

### Evaluation Criteria

- Project-specific anchors — references to actual codebase patterns?
- Convention awareness — references CLAUDE.md instead of duplicating?
- Abstract lessons — rationale captured, not just decisions?
- Learning loop — retro prompt after execution?
- Data standards — JSONL as canonical, .md for human reference?
- Audit integration — audits built into every plan produced?

### Common Findings

- Generic examples instead of project-specific anchors
- Conventions duplicated instead of referencing CLAUDE.md
- Decisions captured without rationale (loses "why")
- No retro prompt after skill execution
- Data format not specified (or defaults to .md only)
- No audit checkpoints built into produced plans

### Scoring Guide

| Score | Criteria                                                 |
| ----- | -------------------------------------------------------- |
| 9-10  | Deep project awareness, learning loop, standards aligned |
| 7-8   | Good project awareness with minor gaps                   |
| 5-6   | Some project-specific content but mostly generic         |
| 3-4   | Little project awareness, duplicated conventions         |
| 1-2   | Completely generic, no project integration               |

---

## Category 10: User Experience

**Purpose:** How does the skill feel to use interactively?

### Evaluation Criteria

- Progress indicators — "Batch 2 of 3" or "Step 3 of 7"?
- Approval format — free-form feedback vs rigid accept/reject?
- Warm-up — brief orientation at start?
- Effort estimate — rough sense of how long the skill takes?
- Welcoming prompt — space for user questions/concerns?
- Visual structure — consistent headers, dividers, tables, bold?
- Closure signal — explicit completion message with artifact list?

### Common Findings

- No progress indicators during multi-step execution
- Rigid approval gate (accept/reject only, no partial feedback)
- No warm-up orientation at skill start
- No effort estimate for user planning
- No space for user to ask questions before starting
- Inconsistent visual formatting
- No closure signal listing what was produced

### Scoring Guide

| Score | Criteria                                         |
| ----- | ------------------------------------------------ |
| 9-10  | Polished UX, clear progress, welcoming, thorough |
| 7-8   | Good UX with minor polish issues                 |
| 5-6   | Functional but rough edges                       |
| 3-4   | Poor UX, confusing flow                          |
| 1-2   | No UX consideration                              |

---

## Category 11: Convergence Loop Integration (T25)

**Purpose:** Does the skill use convergence loops where appropriate? Per tenet
T25, all discovery phases SHOULD use convergence loops.

### Evaluation Criteria

- **Appropriateness check** — does this skill have a discovery phase,
  multi-agent verification, or iterative refinement? If yes, T25 says it SHOULD
  use convergence loops.
- **Implementation quality** (if convergence loops are used):
  - Minimum 2 passes? (MUST per `/convergence-loop` SKILL.md)
  - T20 tally format (Confirmed/Corrected/Extended/New)? (MUST)
  - User gate before convergence declaration? (MUST)
  - State persistence between passes? (MUST)
  - Graduated convergence (per-claim, not all-or-nothing)? (SHOULD)
- **Missing integration** — skill has discovery/verification but uses
  single-pass

### Common Findings

- Skill has discovery phase but no convergence loop (most common gap)
- Convergence loop present but only 1 pass (violates minimum)
- No T20 tally — findings just listed without categorization
- No user gate — auto-declares convergence without confirmation
- Single-pass audit followed by "verify" that's really just re-reading output

### Scoring Guide

| Score | Criteria                                                      |
| ----- | ------------------------------------------------------------- |
| 9-10  | Convergence loops used appropriately, follows all MUST rules  |
| 7-8   | Convergence loops present with minor deviations from standard |
| 5-6   | Has discovery phase, convergence loop partially implemented   |
| 3-4   | Has discovery phase, no convergence loop, single-pass         |
| 1-2   | Multi-agent verification with no convergence mechanics at all |
| N/A   | Skill has no discovery/verification phase (score excluded)    |

**N/A handling:** If a skill has no discovery, verification, or iterative
refinement phase, score this category as N/A and exclude from the total. Adjust
overall scoring denominator accordingly (100 -> 90 for 10 categories).

---

## Category 12: Completion Verification Design

**Purpose:** Does the skill verify its own execution through a built-in
self-audit phase? Per SKILL_STANDARDS.md, Standard and Complex skills MUST
include a self-audit phase with 9 verification dimensions.

### Evaluation Criteria

- **Self-audit phase present** — does the skill have a dedicated verification
  phase near the end of its process?
- **Phase positioning** — is it penultimate (after all build, before closure)?
- **Dimension coverage** — which of the 9 SKILL_STANDARDS.md dimensions are
  covered? (completeness, orphan detection, build integrity, gap analysis,
  functional verification, multi-agent, regression, contract, partial recovery)
- **Tier-appropriate scope** — Standard skills cover dimensions 1-5 minimum;
  Complex skills cover all 9
- **Multi-agent verification** — does the self-audit dispatch independent
  agents?
- **Regression detection** — if re-run, does it compare against prior output?
- **Contract verification** — if downstream consumers exist, does it verify
  output matches their expectations?
- **Partial execution recovery** — does it detect stale artifacts from
  interrupted runs?

### Common Findings

- Standard/Complex skill has no self-audit phase at all (most common gap)
- Self-audit exists but only checks structural validation (runs
  `skills:validate`) — misses completeness, orphans, gaps
- Self-audit positioned after closure (evidence already cleaned up)
- No multi-agent verification for Complex skills with >15 deliverables
- Downstream consumers listed in Integration section but self-audit doesn't
  verify contract compliance
- No regression detection — re-runs silently lose prior capabilities
- Self-audit checks existence but not function (file exists but doesn't work)

### Canonical Fix Action

When Cat 12 scores **<7** (no self-audit, structural-only, or missing key
dimensions), the canonical Phase 4 implementation is:

1. **Create** `scripts/skills/<target-skill>/self-audit.js` per
   [SELF_AUDIT_PATTERN.md](../_shared/SELF_AUDIT_PATTERN.md). Use
   `scripts/skills/skill-audit/self-audit.js` as the template; replace
   domain-specific dimension checks. This gives MUST dimensions 1-5 + 8-9 (and
   6-7 for Complex tier) automated coverage out of the box.
2. **Wire SKILL.md Phase 5** to invoke the script as a new Phase 5.0 (per
   pattern doc §Wiring template). Existing prose Phase 5 steps remain for
   judgment-only checks (interactive multi-agent dispatch, decision
   walkthrough).
3. **Extend the skill's state schema** if needed (`files_created`,
   `files_modified`, `decisions[].file_modified`) so Dim 4 Gap analysis can map
   decisions to diff hunks.
4. **Document any skipped dimensions** in the script header with rationale (per
   pattern doc §Skip List Convention).
5. **Validate against a known-good prior run** to confirm the script reports
   PASS on existing artifacts (regression guardrail for the check logic itself).

When Cat 12 scores **7-8**, recommend incremental improvements (typically adding
regression detection or contract verification). When Cat 12 scores **9-10**, no
remediation required — note the skill as a positive reference example for future
audits.

### Scoring Guide

| Score | Criteria                                                        |
| ----- | --------------------------------------------------------------- |
| 9-10  | Full 9-dimension self-audit, correctly positioned, tier-matched |
| 7-8   | Self-audit present with most dimensions, minor gaps             |
| 5-6   | Self-audit present but missing key dimensions or mispositioned  |
| 3-4   | Minimal self-audit (grep-only or structural-only)               |
| 1-2   | No self-audit despite Standard/Complex tier                     |
| N/A   | Simple skill (<50 lines) — "Done when:" gate sufficient         |

**N/A handling:** If a skill is Simple tier (<50 lines, no companions), score
this category as N/A and exclude from the total. Adjust scoring denominator
accordingly (120 -> 110 for 11 categories, or 100 if both Cat 11 and 12 N/A).

---

## Overall Scoring

Sum individual category scores for an overall quality score out of 120 (or
adjusted if Category 11 and/or 12 is N/A).

| Range | Rating    | Action                                      |
| ----- | --------- | ------------------------------------------- |
| 85+   | Excellent | Minor polish only                           |
| 70-84 | Good      | Targeted improvements in weak categories    |
| 50-69 | Fair      | Significant rewrite needed in 3+ categories |
| 30-49 | Poor      | Major restructuring required                |
| <30   | Critical  | Consider full rewrite                       |

---

## Phase 2 Completion Summary Template

Present after all 10 categories are complete and before Phase 3:

```
========================================
PHASE 2 COMPLETE: All 10 categories audited
========================================

Total decisions: N (M accepted, K rejected)
Overall score: N/100 ([rating])

Scores by category:
  Cat 1  Intent Fidelity:      N/10
  Cat 2  Workflow Sequencing:   N/10
  [... all 10 ...]

Top 3 concerns:
  1. [Lowest-scoring category] (N/10) — [brief description]
  2. [Second-lowest] (N/10) — [brief description]
  3. [Third-lowest] (N/10) — [brief description]

Cross-cutting user requirements: N
  [List each]

Proceed to implementation with these N decisions? [Y/modify/n]
```

---

## Phase Transition Markers

Use this format before each phase to maintain orientation during long audits:

```
========================================
PHASE N: [NAME]
========================================
```

---

## Self-Audit Report Format

### Evidence-Based Verification (MUST — both deterministic layers)

**IMPORTANT:** A decision logged as "accepted" is NOT verified until objective
evidence proves it was implemented. Self-reporting "PASS" without evidence is
the primary failure mode of self-audits.

**Session #281 change (per skill-audit-batch-mode D11):** Agent-based Layer 2
verification (previously MUST for >15 decisions) is REMOVED from all modes.
Another LLM reading the same state + files is echo, not independent verification
— same drift class as using agents to produce findings (which was rejected).
Deterministic checks (grep + diff) catch the "I thought I wrote it but didn't"
failure mode mechanically, without drift risk.

#### Layer 1: Grep-Based Proof (MUST for every decision)

For each accepted decision, identify a keyword or pattern that MUST exist in the
output file if the decision was implemented. Run grep. Cite the result.

**Format per decision:**

```
Cat1-A: "multi-sentence description in frontmatter"
  Grep: grep -n "through a structured" SKILL.md → line 5 ✓
  Status: PASS

Cat5-A: "add compaction resilience with state file"
  Grep: grep -n "state.*file\|compaction" SKILL.md → lines 246-248 ✓
  Status: PASS

Cat6-C: "pause/resume protocol with --resume flag"
  Grep: grep -n "\-\-resume" SKILL.md → (no match)
  Status: MISSING — decision accepted but not implemented
```

**Rules:**

- If grep returns no match, the decision is MISSING — not PASS
- If grep matches but the content is incomplete, the decision is PARTIAL
- Grep MUST target the output file, not the state file or conversation memory
- For decisions affecting multiple files, grep each file

#### Layer 2: Diff-Based Mapping (MUST)

Generate `git diff` (or compare old vs new content) for all modified files. For
each accepted decision, identify the specific diff hunk that implements it.

**Format:**

```
Cat2-A: "renumber steps sequentially"
  Diff: -## STEP 0.5: PRE-PUSH CHECKS → +## Step 1: Context & Parse
  Hunk: SKILL.md lines 62-100 (old) → lines 72-100 (new) ✓

Cat4-D: "add delegation protocol"
  Diff: +**Delegation:** User says "you decide" → accept recommendations...
  Hunk: SKILL.md new lines 176-177 ✓

Cat9-D: "add skill feedback prompt after commit"
  Diff: (no corresponding hunk found)
  Status: MISSING
```

**Rules:**

- Decisions with no corresponding diff hunk are MISSING
- New content that doesn't map to any decision should be flagged for review
- This catches "I thought I wrote it but didn't" failures

### Decision Verification Table

Both layers are deterministic (grep + diff). There is no agent-based Layer 2
anymore (Session #281 D11).

For audits with <=20 decisions, show full table with grep evidence:

```
| # | Decision | Grep Evidence | Diff Hunk | Status |
|---|----------|---------------|-----------|--------|
| Cat1-A | [description] | grep result → line N | SKILL.md:N-M | PASS |
```

For audits with >20 decisions, group by category. PASS items show grep evidence
inline. Expand PARTIAL/MISSING with both deterministic layers (grep + diff):

```
Cat 1 (Intent Fidelity): 3/3 PASS
  Cat1-A: grep "structured.*protocol" → line 5 ✓
  Cat1-B: grep "8-step" → line 5 ✓
  Cat1-C: grep "Process external" → line 12 ✓
Cat 6 (Guard Rails): 3/4 — 1 MISSING:
  | Cat6-B | Pause protocol | grep "--resume" → no match | no diff hunk | MISSING |
  Resolution: [what was done to fix it]
```

### Self-Audit Report

```
SELF-AUDIT REPORT: [skill-name]
================================
Verification method:    Evidence-based (grep + diff, deterministic)
Decision verification:  [N/M PASS | K PARTIAL | J MISSING]
Process compliance:     [N/M checks passed]
Structural validation:  [PASS/FAIL]
skills:validate:        [PASS/FAIL]

[List each PARTIAL or MISSING with resolution]
```

### Completion Summary (only after report passes clean)

```
Skill Audit Complete: [skill-name]
Categories: 10 | Decisions: [N] ([M] accepted, [K] rejected)
Overall Score: [N/100] → post-fix: [N/100]
[If repeat: Previous: [N] → Current: [M] | Improved: [list] | Regressed: [list]]
Files modified: [list] | Skill-creator gaps: [N]
```

---

## Process Compliance Checklist

Verify the skill-audit process itself was followed:

- [ ] All 10 categories presented one at a time (not batched)
- [ ] Every category followed per-category procedure (pros, cons, gaps,
      suggestions with recommendations)
- [ ] Opportunities section included where genuinely applicable; MUST explicitly
      state "No opportunities identified" when a category has none (do not
      silently omit the section)
- [ ] State file updated after every category
- [ ] Every con and gap had at least one suggestion
- [ ] Every suggestion had a recommendation with rationale
- [ ] Cross-cutting user requirements captured and tracked
- [ ] Mid-audit check presented after Category 5
- [ ] "Anything I missed?" prompt after Category 10
- [ ] Phase 3 crosscheck performed against skill-creator
- [ ] Implementation approval gate presented before Phase 4
- [ ] Phase transition markers used between phases

---

## State File Schema

Path: `.claude/state/task-skill-audit-{skill-name}.state.json`

```json
{
  "task": "Skill Audit: [skill-name]",
  "target_skill": "[skill-name]",
  "status": "preparation | auditing_category_N | retroactive_opportunities | phase2_complete_transition | crosscheck | implementation_approval | implementation | self_audit | complete",
  "current_category": 0,
  "decisions": {
    "cat1_intent_fidelity": "N decisions: A-accepted (description — rationale for rejection if rejected), B-rejected (description — rationale), OPP-1A-accepted (description)",
    "...": "..."
  },
  "scores": {
    "cat1": 0,
    "...": "..."
  },
  "total_decisions": 0,
  "accepted_decisions": 0,
  "rejected_decisions": 0,
  "overall_score": null,
  "estimated_post_fix_score": null,
  "cross_cutting_principles": ["USER-REQ-N: description"],
  "process_compliance_notes": ["any process deviations noted during audit"],
  "process_feedback": null,
  "files_modified": ["path (description of changes)"],
  "skill_creator_gaps": null,
  "skill_creator_gap_details": ["gap description"],
  "updated": "ISO timestamp"
}
```

**Decision format:** Include rejection rationale inline:
`"D-rejected (don't reorder — crosscheck before implementation lets us batch fixes)"`.
This preserves institutional memory about WHY decisions were rejected.

**Confidence tagging:** Append to accepted decisions when applicable:
`"A-accepted [high] (description)"`, `"B-accepted [low] (description)"`.

---

## Batch Mode Appendix (Session #281)

The sections below specify batch/multi mode additions per the
skill-audit-batch-mode plan. They extend — not replace — the sections above.

### Mode Field on Per-Skill State Schema

The existing state schema at
`.claude/state/task-skill-audit-{skill-name}.state.json` gains these fields:

```json
{
  "mode": "single | batch | multi",
  "batch_id": "optional string — if part of a multi-mode batch, refs parent state",
  "findings_by_category": {
    "cat1_intent_fidelity": {
      "assessment": "string — current-state assessment citing sections/lines",
      "pros": ["..."],
      "cons": ["..."],
      "gaps": ["..."],
      "suggestions": [
        {
          "id": "A",
          "description": "...",
          "rationale": "...",
          "recommendation": true
        }
      ],
      "opportunities": ["..."],
      "generated_at": "ISO timestamp"
    }
  }
}
```

The existing `decisions` field stays. `findings_by_category` is populated during
Phase 2b; `decisions` is populated during Phase 2.B (batch/multi) or Phase 2a
(single). For legacy state files without `mode`, treat as `mode: "single"`.

### Parent Batch State Schema (multi mode)

Path: `.claude/state/task-skill-audit-batch-<batch-id>.state.json`

```json
{
  "task": "Skill Audit Batch: <batch-id>",
  "batch_id": "string — timestamp or user-supplied tag",
  "mode": "multi",
  "skills": ["name1", "name2", "..."],
  "skill_status": {
    "name1": "phase_2b_findings | phase_2B_decisions | phase_3_crosscheck | phase_4_impl | phase_5_audit | complete",
    "name2": "..."
  },
  "cross_skill_patterns": [
    {
      "pattern": "description",
      "skills_affected": ["..."],
      "severity": "high | medium | low",
      "detected_at": "ISO timestamp"
    }
  ],
  "started_at": "ISO timestamp",
  "updated": "ISO timestamp",
  "status": "in_progress | complete"
}
```

The parent state coordinates the batch; each skill still has its own per-skill
state file with the extended schema above.

### Batch Findings Production Procedure (Phase 2b)

For each skill in the batch (1 skill if `mode=batch`, list if `mode=multi`):

1. **For each category (1-12):**
   - Follow Phase 2a per-category procedure steps 1-8 (assess, list pros, cons,
     gaps, suggestions with recommendations, opportunities)
   - **SKIP step 9** (collect decisions) — Phase 2.B handles that
   - Write findings to `state.findings_by_category.<cat_key>`
   - **Save state file** (MUST — per category, matches Phase 2a save cadence)
2. **After all 12 categories complete:** render markdown to
   `.claude/tmp/skill-audit-<name>-findings.md` (see §Batch Findings Rendering)
3. **Progress:** "Phase 2b [skill-name]: N/12 categories generated"

**Faithfulness guarantee:** Findings produced here MUST be equivalent to what
Phase 2a would produce on the same skill — same 12 categories, same depth, same
REFERENCE.md rubric. Only **delivery** differs (batched vs gated).

### Batch Findings Rendering

Trigger: after all 12 categories written to `state.findings_by_category` for a
skill.

Output path: `.claude/tmp/skill-audit-<name>-findings.md`

Format:

```markdown
# Findings: <skill-name>

**Mode:** batch | multi **Generated:** <ISO timestamp> **Batch ID:**
<only if multi>

---

## Category 1: Intent Fidelity

### Assessment

<one-paragraph current-state assessment>

### Pros

- <pro 1>
- <pro 2>

### Cons

- <con 1>

### Gaps

- <gap 1>

### Suggestions

- **A (recommended):** <description> — <rationale>
- **B:** <description> — <rationale>

### Opportunities

- <opportunity 1> (or: "Opportunities: None for this category.")

---

## Category 2: ...
```

Rendering is done by the main session — it writes `state.findings_by_category`
into this markdown template. No separate script required.

### Decision Collection Procedure (Phase 2.B)

For each skill in the batch (if multi, iterate through all skills):

1. Reference the rendered tmp findings file
2. For each category (1-12):
   - Read the category's `suggestions` array from state (**NOT re-analyze** —
     findings are locked from Phase 2b per faithfulness guarantee)
   - For `mode=multi`: surface any `cross_skill_patterns` entries affecting this
     category inline: "also appears in N other skills in this batch ([list])"
   - Collect disposition conversationally (accept / modify / reject /
     alternative) — NEVER use AskUserQuestion
   - **Real-time conflict check (MUST):** compare new decision vs all earlier
     decisions in this audit. If a conflict is detected (e.g., Cat8 accepts an
     approach that contradicts Cat3's accepted approach), present the conflict
     and resolve before continuing.
   - Save decision to state file (MUST — per category)
3. After all 12 categories decided: **final sweep conflict pass** (MUST
   backstop) — re-scan the full decision set for any conflicts missed during
   real-time checks.

### Tmp File Lifecycle

- **Created:** at Phase 2b completion per skill
  (`.claude/tmp/skill-audit-<name>-findings.md`)
- **Active:** lives at the above path through Phase 2.B + Phase 4
- **Archived:** at Phase 6 closure, moved to
  `.claude/tmp/history/skill-audit-<name>-<ISO-timestamp>-findings.md`
- **Rolling retention:** keep last 5 archives per skill; prune older at archive
  time
- **Directory creation:** ensure `.claude/tmp/history/` exists (create if
  missing at archive time)

### Multi-Mode Resume Protocol

On `/skill-audit` invocation when a parent batch state file exists and
`status != "complete"`:

1. Read parent batch state file
2. Identify last-active skill (first `skill_status` entry != `complete`)
3. Read that skill's per-skill state file
4. Determine resume point: last saved `findings_by_category` key (if in Phase
   2b) or last saved `decisions` key (if in Phase 2.B)
5. Offer: "Resume batch `<batch-id>` from skill `<X>` category `<N>`, or discard
   and restart?"

---

## Cross-Cutting Principles

These principles apply across all 10 categories and SHOULD be checked as a final
pass after category-level audit:

1. **Primacy bias awareness** — critical rules at top of skill files
2. **Structural attention management** — core <300 lines + companion files
3. **MUST/SHOULD/MAY instruction hierarchy** — every instruction classifiable
4. **Compaction resilience** — state persisted incrementally for long-running
   skills
5. **JSONL as canonical data standard** — .md generated for human readability
6. **Audits built into every plan** — at completion minimum, at phase boundaries
   for multi-phase
7. **Project conventions referenced** — via CLAUDE.md, not duplicated
8. **Guided prompts over placeholders** — specific prompts produce better output
