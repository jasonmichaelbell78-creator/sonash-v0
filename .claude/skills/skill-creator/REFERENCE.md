# Skill Creator Reference

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-08
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Companion file for skill-creator SKILL.md. Contains discovery question bank,
content checklist, skill anatomy reference, example, and state file schema.

---

## About Skills

Skills are modular, self-contained packages that extend Claude's capabilities
with specialized knowledge, workflows, and tools.

### What Skills Provide

1. **Specialized workflows** — multi-step procedures for specific domains
2. **Tool integrations** — instructions for working with file formats or APIs
3. **Domain expertise** — company-specific knowledge, schemas, business logic
4. **Bundled resources** — scripts, references, and assets for complex tasks

### Anatomy of a Skill

```
skill-name/
  SKILL.md (required)    # Core instructions (< 300 lines)
  REFERENCE.md           # Detailed examples, templates, question banks
  scripts/               # Executable code (Python/Bash/etc.)
  references/            # Documentation loaded into context as needed
  assets/                # Files used in output (templates, icons, etc.)
```

### Progressive Disclosure

Skills use a three-level loading system:

1. **Metadata (name + description)** — always in context (~100 words)
2. **SKILL.md body** — when skill triggers (< 300 lines)
3. **Bundled resources** — as needed by Claude (unlimited)

---

## Discovery Question Categories

Six skill-specific categories. Floor of ~12 questions across all categories, no
ceiling. Front-load categories 1-2 (critical decisions) before 3-6.

### Category 1: Scope & Triggers

What the skill does, when it fires, what it doesn't do.

- "What specific scenarios trigger this skill? List concrete examples."
- "What are the boundaries? What tasks look similar but should NOT use this?"
- "What existing skills neighbor this one? How do they differ?"
- "Should this skill handle [related task] or route to another skill?"
- "What arguments or parameters does the skill accept?"

### Category 2: Architecture

Workflow structure, phase design, output artifacts.

- "Is this a workflow (sequential steps), a tool collection (task-based), or a
  reference (guidelines)?"
- "How many phases/steps? What are the key decision points?"
- "What artifacts does the skill produce? Files, state, conversation output?"
- "What's the estimated complexity? (Simple: <50 lines, Standard: 50-200,
  Complex: 200-300)"
- "Does the skill need companion files (REFERENCE.md, scripts, assets)?"
- "If this skill dispatches agents: what Agent tool parameters are needed?
  (subagent_type, prompt template, isolation mode). Document in SKILL.md." (S24)
- "If this skill uses state files: what happens on re-invocation with existing
  state? MUST define resume behavior (detect existing state → present status →
  offer continue/restart)." (S27)
- "Does this skill's workflow involve claims verification, multi-agent
  discovery, or iterative refinement? If yes, design convergence-loop
  integration per T25."

### Category 3: Attention & Prompt Engineering

How to structure for LLM effectiveness.

- "What are the 3-5 most critical rules? (These go in the top third)"
- "Which instructions are MUST vs SHOULD vs MAY?"
- "Are there anti-patterns specific to this domain?"
- "What rules need repeating at point-of-use?"
- "Are there examples that should go in REFERENCE.md vs inline?"

### Category 4: Integration

Handoffs, data flow, ecosystem connections.

- "What skills come before/after this one in a typical workflow?"
- "Does this skill produce artifacts consumed by other skills? What contract?"
- "Does the skill read data from hooks, scripts, or other sources?"
- "Should it check ROADMAP.md before proceeding?"
- "Does it need session-end integration?"

### Category 5: Guard Rails

Failure modes, edge cases, recovery.

- "What are the common failure modes? (Bad input, scope explosion, etc.)"
- "What should happen if the session compacts mid-execution?"
- "Does the skill need a disengagement protocol (clean exit)?"
- "What if the user's request turns out to need a different tool entirely?"
- "Are there phase gates (must complete X before Y)?"

### Category 6: UX & Interactivity

User experience, progress, feedback loops.

- "Is this interactive (multi-step user decisions) or autonomous?"
- "Does it need progress indicators? Warm-up? Closure signal?"
- "What approval format? (accept/modify/reject, free-form, delegation)"
- "Does the user need an effort estimate before starting?"
- "Should there be a retro/feedback prompt after completion?"

---

## Content Checklist

Walk this checklist during Phase 5 (Validate). Items marked MUST are
non-negotiable; SHOULD items may be skipped with documented rationale.

### Structural Quality

1. MUST: YAML frontmatter with name + multi-sentence description
2. MUST: "When to Use" section with specific triggers
3. MUST: "When NOT to Use" section with named alternatives
4. MUST: "Version History" table at end of file (WHAT + WHY)
5. MUST: Under 300 lines core (extract to companions if needed)
6. SHOULD: Agent prompts include COMPLETE: return protocol (if multi-agent)
7. SHOULD: Parallel execution has dependency constraints documented
8. MUST: Cross-references resolve to existing skills/scripts
9. SHOULD: No duplicated boilerplate (use shared templates)
10. SHOULD: Quick-start example (5-8 lines) showing minimal invocation (S25)
11. MUST (if state files): State file schema in REFERENCE.md (per Q8) (S26)
12. MUST (if state files): Resume detection on re-invocation (S27)

### Behavioral Quality

1. MUST: Critical rules front-loaded (top third of file)
2. MUST: MUST/SHOULD/MAY hierarchy applied to all instructions
3. MUST: Critical rules repeated at point-of-use (not just in overview)
4. SHOULD: Checklists used instead of prose for multi-item requirements
5. MUST: "When NOT to Use" redirects to specific named skills
6. MUST: Error/failure paths addressed for the skill's domain
7. MUST: Long-running skills have compaction resilience (state persistence)
8. MUST: Multi-step skills have UX (progress, warm-up, closure, effort est.)
9. MUST: Project conventions referenced (CLAUDE.md by path), not duplicated
10. MUST: Guided prompts used instead of generic `[placeholder]` text
11. MUST: Steps/phases have "Done when:" completion criteria
12. SHOULD: Anti-patterns list for common mistakes in the skill's domain
13. SHOULD: Routing guide if 3+ skills share triggers (table format)
14. SHOULD: Approval gates before irreversible actions or phase transitions
15. SHOULD: Post-execution retro prompt (learning loop)

---

## Minimal Complete Example

A well-structured simple skill (~40 lines):

```markdown
---
name: example-formatter
description: >-
  Format code examples for documentation. Detects language, applies syntax
  highlighting hints, and wraps in consistent markdown fences.
---

# Example Formatter

Format code examples with consistent fencing and language detection.

## Critical Rules (MUST follow)

1. Always detect language before formatting
2. Use triple backticks with language identifier

## When to Use

- Formatting code for documentation
- User explicitly invokes `/example-formatter`

## When NOT to Use

- Full document formatting -- use `/doc-optimizer`

## Process

1. Detect language from content or file extension
2. Apply consistent triple-backtick fencing with language tag
3. Verify rendered output

**Done when:** All code blocks have language-tagged fences.

## Version History

| Version | Date       | Description                             |
| ------- | ---------- | --------------------------------------- |
| 1.0     | 2026-03-08 | Initial (format standardization needed) |
```

---

## Iteration Patterns

After testing a skill on real tasks, common fixes:

| Symptom                           | Fix                                  |
| --------------------------------- | ------------------------------------ |
| AI ignores a rule                 | Move it higher in the file (primacy) |
| AI produces generic output        | Add project-specific examples        |
| AI asks questions it should know  | Add to references/                   |
| AI gets confused in long sessions | Add compaction checkpoints           |
| Skill overlaps with another       | Add routing guidance to both         |

---

## State File Schema

Path: `.claude/state/skill-creator.state.json`

```json
{
  "task": "Skill Creator: [skill-name]",
  "target_skill": "[skill-name]",
  "status": "warmup | context | discovery_batch_N | planning | approval | build | validate | audit | complete",
  "current_phase": 0,
  "discovery_decisions": {
    "scope_triggers": ["decision text with rationale"],
    "architecture": [],
    "attention_prompt_eng": [],
    "integration": [],
    "guard_rails": [],
    "ux_interactivity": []
  },
  "planning_output": {
    "files_planned": [],
    "section_outline": [],
    "guard_rails_planned": [],
    "integration_surface": []
  },
  "files_created": [],
  "process_feedback": null,
  "updated": "ISO timestamp"
}
```
