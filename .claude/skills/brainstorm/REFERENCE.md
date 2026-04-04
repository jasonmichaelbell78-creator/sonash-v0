<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Brainstorm Reference

Question themes, output templates, contrarian prompts, and state file schema for
the brainstorm skill.

---

## Socratic Question Themes

Use these themes as guides, not rigid categories. Adapt to the conversation.
When the user can't answer, explore the question together.

### 1. Problem Space

- What problem are we solving? (If unclear: "What's bothering you about the
  current state?")
- Who experiences this problem? When? How often?
- What happens if we do nothing?
- Is this a symptom of a deeper issue?

### 2. Assumptions

- What are we taking for granted?
- What would have to be true for this to work?
- What if the opposite were true?
- Which assumptions can we test cheaply?

### 3. Constraints

- What's non-negotiable? (Technical, business, timeline, user expectations)
- What resources are available? What's scarce?
- What existing systems must we work with?
- What political or organizational constraints exist?

### 4. Alternatives

- What else could we do instead?
- How have others solved similar problems?
- What would we do if we had unlimited time? Unlimited resources?
- What's the simplest thing that could work?
- What would we do if we had to ship tomorrow?

### 5. Success Criteria

- How will we know this worked?
- What does "good enough" look like?
- What metrics matter? (If unclear: "If this succeeded, what would change?")
- What's the minimum viable version?

### 6. Anti-Goals

- What do we explicitly NOT want?
- What outcomes would make this a failure even if it "works"?
- What should this NOT become?
- What existing patterns should we NOT repeat?

---

## BRAINSTORM.md Template

```markdown
# Brainstorm: [Topic]

**Date:** YYYY-MM-DD **Status:** Complete **Routing:** [deep-plan /
deep-research / both / direct / saved]

## Problem Space

[What we're solving and why — the "why behind the why." Include seed-idea origin
if the brainstorm started from a vague notion.]

## Anti-Goals

- [What we explicitly do NOT want]
- [Failure modes to avoid]

## Landscape

[What exists today — codebase context, existing systems, domain knowledge
gathered by agents. Cite agent findings where applicable.]

## Directions Explored

### Direction A: [Name]

**Vision:** [2-3 sentence description of what this looks like] **Strengths:**
[What it gets right] **Weaknesses:** [What it gets wrong] **Assumptions:** [What
must be true] **Feasibility:** [Given current state]

### Direction B: [Name]

[Same structure]

### Direction C: [Name]

[Same structure]

## Contrarian Assessment

[Devil's advocate perspective on leading direction(s). Honest weaknesses. What
competing directions get right that the leader doesn't.]

## Evaluation Summary

| Direction | Strengths | Weaknesses | Feasibility  |
| --------- | --------- | ---------- | ------------ |
| A         | ...       | ...        | High/Med/Low |
| B         | ...       | ...        | High/Med/Low |
| C         | ...       | ...        | High/Med/Low |

## Chosen Direction

**Direction:** [Name] **Rationale:** [Why this over others — what was decisive]
**Open Questions:** [What still needs research or deeper planning]

## Routing

[Next action: /deep-plan, /deep-research, both, direct implementation] [Specific
arguments or context to pass to the next skill]
```

---

## Contrarian Checkpoint Prompts

Use these to structure the mandatory contrarian assessment:

- "Here's why [leading direction] might fail in 6 months..."
- "The strongest argument against this direction is..."
- "What [competing direction] gets right that this misses..."
- "The hidden assumption most likely to be wrong is..."
- "If I had to argue for a different direction, I'd say..."

For complex brainstorms (4+ directions, unfamiliar domain), dispatch a
`contrarian-challenger` agent with:

```
Stress-test these 2 directions for [topic]:
Direction A: [summary]
Direction B: [summary]

Assume they will fail. Articulate why. Focus on hidden assumptions,
feasibility gaps, and what each direction misses that the other gets right.
```

---

## State File Schema

**Path:** `.claude/state/brainstorm.<topic-slug>.state.json`

```json
{
  "task": "Brainstorm: [topic]",
  "topic": "[topic argument]",
  "status": "warm_up | phase_0 | phase_1 | phase_2 | phase_3 | phase_4 | complete",
  "directions": [
    {
      "name": "Direction A",
      "vision": "...",
      "strengths": ["..."],
      "weaknesses": ["..."],
      "chosen": false
    }
  ],
  "anti_goals": ["..."],
  "open_questions": ["..."],
  "chosen_direction": null,
  "routing": null,
  "agents_dispatched": [
    { "type": "deep-research-searcher", "scope": "...", "status": "complete" }
  ],
  "artifacts": {
    "brainstorm": ".research/<slug>/BRAINSTORM.md"
  },
  "updated": "ISO timestamp"
}
```

---

## Version History

| Version | Date       | Description                              |
| ------- | ---------- | ---------------------------------------- |
| 1.0     | 2026-04-01 | Initial creation alongside SKILL.md v1.0 |
