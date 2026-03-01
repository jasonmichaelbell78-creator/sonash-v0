---
name: skill-creator
description:
  Guide for creating effective skills. This skill should be used when users want
  to create a new skill (or update an existing skill) that extends Claude's
  capabilities with specialized knowledge, workflows, or tool integrations.
license: Complete terms in LICENSE.txt
---

# Skill Creator

This skill provides guidance for creating effective skills that are structurally
correct AND behaviorally effective.

## When to Use

- Creating a new skill from scratch
- Updating or improving an existing skill
- User explicitly invokes `/skill-creator`

## When NOT to Use

- Auditing an existing skill's effectiveness -- use `/skill-audit` instead
- When the task doesn't involve skill creation or modification

---

## Critical Principles (MUST follow)

These principles apply to ALL skills created or modified. Front-loaded here
because they are the most commonly violated:

1. **Primacy bias**: LLMs pay more attention to the top of a skill than the
   bottom. MUST front-load critical rules, MUST-do behaviors, and hard
   requirements in the first third of the file.
2. **Attention decay**: Skills over ~300 lines lose effectiveness. MUST extract
   detailed examples, templates, and reference material to companion files
   (REFERENCE.md, prompts.md, etc.). Core SKILL.md stays lean.
3. **MUST/SHOULD/MAY hierarchy**: Every instruction MUST be classifiable as MUST
   (non-negotiable), SHOULD (strong recommendation), or MAY (optional). If
   everything reads at the same "volume," nothing stands out.
4. **Checklists over prose**: A 5-item numbered checklist holds attention better
   than 5 paragraphs explaining the same things.
5. **Repeat at point-of-use**: If a rule matters in Phase 3, say it in Phase 3 —
   don't rely on a single mention in the overview carrying through.
6. **Guided prompts, not placeholders**: Instead of `[Implementation details]`,
   write "Describe the implementation approach, key code changes, and any
   non-obvious logic." Placeholders produce placeholder-quality output.

---

## About Skills

Skills are modular, self-contained packages that extend Claude's capabilities by
providing specialized knowledge, workflows, and tools. They transform Claude
from a general-purpose agent into a specialized agent equipped with procedural
knowledge that no model can fully possess.

### What Skills Provide

1. Specialized workflows - Multi-step procedures for specific domains
2. Tool integrations - Instructions for working with specific file formats or
   APIs
3. Domain expertise - Company-specific knowledge, schemas, business logic
4. Bundled resources - Scripts, references, and assets for complex and
   repetitive tasks

### Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)    # Core instructions (< 300 lines)
├── REFERENCE.md           # Detailed examples, templates, question banks
├── scripts/               # Executable code (Python/Bash/etc.)
├── references/            # Documentation loaded into context as needed
└── assets/                # Files used in output (templates, icons, etc.)
```

### Progressive Disclosure

Skills use a three-level loading system to manage context efficiently:

1. **Metadata (name + description)** - Always in context (~100 words)
2. **SKILL.md body** - When skill triggers (< 300 lines)
3. **Bundled resources** - As needed by Claude (unlimited)

---

## Skill Creation Process

**Before creating skills**, review:

- [SKILL_STANDARDS.md](../_shared/SKILL_STANDARDS.md) — Required sections, size
  limits, attention management, instruction hierarchy, and quality checklist
- [Skill & Agent Policy](../../../docs/agent_docs/SKILL_AGENT_POLICY.md) —
  Naming conventions, scope rules, and usage policies

Follow these steps in order, skipping only when clearly inapplicable.

### Step 1: Understanding the Skill

Skip only when the skill's usage patterns are already clearly understood.

To create an effective skill, understand concrete examples of how it will be
used. This understanding comes from user examples or generated examples
validated with user feedback.

**Discovery questions MUST:**

- Reference existing codebase patterns and conventions (not ask in a vacuum)
- Offer a recommended default for each question
- Explain why the decision matters (not just "what do you want?")
- Cover: triggers, scope, failure modes, adjacent skills, output format

**Discovery questions SHOULD:**

- Be batched (3-5 related questions per message, not 1 at a time)
- Front-load critical decisions (architecture, scope) before cosmetic ones
- Check existing skills for overlap — run `ls .claude/skills/` and identify
  neighbors

**Example questions for an image-editor skill:**

- "What functionality should the skill support? Editing, rotating, anything
  else?"
- "What existing skills overlap? `/frontend-design` handles UI — should
  image-editor handle in-browser editing or file-based only?"
- "What are the failure modes? Large files, unsupported formats, missing
  dependencies?"

Conclude when there is a clear sense of: functionality, scope boundaries,
failure modes, and relationship to existing skills.

### Step 2: Planning the Skill Contents

Analyze each concrete example to identify reusable resources:

1. What would need to be rewritten each time? → `scripts/`
2. What context would need to be rediscovered? → `references/`
3. What files would be used in output? → `assets/`

**Also plan for:**

- **Integration surface**: What skills does this neighbor? What's the handoff?
- **Guard rails**: What are the common failure modes? How should the skill
  handle them?
- **Compaction resilience**: If the skill runs long, what state needs to persist
  to survive context compaction?

### Step 3: Initializing the Skill

Skip if the skill already exists and only needs iteration.

When creating from scratch, run the `init_skill.py` script:

```bash
scripts/init_skill.py <skill-name> --path <output-directory>
```

The script creates the skill directory with SKILL.md template, frontmatter, and
example resource directories. Customize or remove generated files as needed.

### Step 4: Edit the Skill

The skill is being created for another instance of Claude to use. Focus on
information that is beneficial, non-obvious, and structured for attention
management.

#### 4.1 Start with Reusable Resources

Implement `scripts/`, `references/`, and `assets/` identified in Step 2. Delete
example files not needed. This step may require user input (e.g., brand assets,
API documentation).

#### 4.2 Write SKILL.md

**Writing style**: Imperative/infinitive form (verb-first instructions). Use "To
accomplish X, do Y" not "You should do X."

**Structure the file for attention management:**

1. **Top third** (lines 1-100): Critical principles, MUST rules, phase/step
   overview, routing guidance (if skill has close neighbors)
2. **Middle third** (lines 100-200): Step-by-step procedures, rules, checklists
3. **Bottom third** (lines 200-300): Examples (compressed), version history,
   references to companion files

**Content checklist:**

- [ ] Purpose (2-3 sentences)
- [ ] When to Use / When NOT to Use (with named alternatives)
- [ ] MUST/SHOULD/MAY applied to all instructions
- [ ] Error handling for the skill's domain
- [ ] Integration guidance (what comes before/after this skill)
- [ ] If multi-step: progress indicators, warm-up, closure signal
- [ ] If long-running: compaction resilience (state persistence)
- [ ] Project conventions referenced (CLAUDE.md), not duplicated
- [ ] Critical rules repeated at point-of-use

#### 4.3 Extract to Companion Files (if needed)

If SKILL.md exceeds ~300 lines, extract to companion files:

- `REFERENCE.md` — Detailed examples, templates, question banks
- `prompts.md` — Agent prompt specifications (if multi-agent)
- `domains.md` — Domain-specific tables/data

Reference from SKILL.md:

```markdown
> Read `.claude/skills/skill-name/REFERENCE.md` for detailed examples.
```

### Step 5: Validate and Package

Validate the skill meets all requirements:

```bash
npm run skills:validate
```

For distribution, package into a zip:

```bash
scripts/package_skill.py <path/to/skill-folder>
```

The packaging script validates automatically (frontmatter, structure,
description quality, file organization) and only packages if validation passes.

### Step 6: Iterate

After testing the skill on real tasks, capture what worked and what didn't.

**Iteration workflow:**

1. Use the skill on real tasks
2. Note where the AI struggled, deviated, or produced weak output
3. Identify root cause: missing instruction? Wrong priority? Attention decay?
4. Update SKILL.md or companion files
5. **Capture the lesson**: Add a brief note to the skill's version history
   explaining WHAT changed and WHY — this is institutional memory

**Common iteration patterns:**

- AI ignores a rule → Move it higher in the file (primacy bias)
- AI produces generic output → Add project-specific examples
- AI asks questions it should know → Add to references/
- AI gets confused in long sessions → Add compaction checkpoints
- Skill overlaps with another → Add routing guidance to both

---

## Version History

| Version | Date       | Description                                          |
| ------- | ---------- | ---------------------------------------------------- |
| 1.0     | 2026-02-25 | Initial implementation                               |
| 2.0     | 2026-02-28 | Add attention management, behavioral quality, guards |
