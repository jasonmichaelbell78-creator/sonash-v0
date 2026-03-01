<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
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

## Overall Scoring

Sum individual category scores for an overall quality score out of 100.

| Range | Rating    | Action                                      |
| ----- | --------- | ------------------------------------------- |
| 85+   | Excellent | Minor polish only                           |
| 70-84 | Good      | Targeted improvements in weak categories    |
| 50-69 | Fair      | Significant rewrite needed in 3+ categories |
| 30-49 | Poor      | Major restructuring required                |
| <30   | Critical  | Consider full rewrite                       |

---

## State File Schema

```json
{
  "task": "Skill Audit: [skill-name]",
  "target_skill": "[skill-name]",
  "status": "auditing_category_N | crosscheck | implementation | complete",
  "current_category": N,
  "decisions": {
    "cat1_intent_fidelity": "N decisions: [summary]",
    "cat2_workflow_sequencing": "N decisions: [summary]",
    ...
  },
  "scores": {
    "cat1": N,
    "cat2": N,
    ...
  },
  "total_decisions": N,
  "overall_score": N,
  "cross_cutting_principles": ["..."],
  "files_modified": ["..."],
  "skill_creator_gaps": N,
  "updated": "ISO timestamp"
}
```

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
