# Skill Standards

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Canonical structural and quality standards for all skills in `.claude/skills/`.
Referenced by `skill-creator`, `skill-ecosystem-audit`, and all skill
maintenance workflows.

---

## Required Sections

Every SKILL.md MUST include these sections (enforced by ecosystem audit):

### 1. YAML Frontmatter

```yaml
---
name: skill-name
description: >-
  Brief description of what this skill does (1-3 sentences).
---
```

### 2. When to Use

```markdown
## When to Use

- Specific trigger conditions
- User invokes `/skill-name`
```

### 3. When NOT to Use

```markdown
## When NOT to Use

- When task X applies -- use `/other-skill` instead
- When a more specialized skill exists
```

### 4. Version History (at end of file)

```markdown
## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | YYYY-MM-DD | Initial implementation |
```

---

## Attention Management

LLMs exhibit primacy bias — instructions at the top of a skill get more
attention than instructions at the bottom. Skills MUST be structured to account
for this:

1. **Front-load critical rules.** MUST-do behaviors, phase structure, and hard
   requirements go in the first third of the file.
2. **Use checklists over prose.** A 5-item numbered list holds attention better
   than 5 paragraphs explaining the same things.
3. **Repeat critical rules at point-of-use.** If "always write ARTIFACT.md"
   matters in Phase 2, say it in Phase 2 — don't rely on a single mention in the
   overview.
4. **Keep the core skill lean.** Move examples, templates, and reference
   material to companion files. The core should contain WHAT to do; companions
   show HOW with examples.

---

## Instruction Hierarchy

Use MUST/SHOULD/MAY (RFC 2119 style) to distinguish requirement levels:

| Keyword    | Meaning                                            |
| ---------- | -------------------------------------------------- |
| **MUST**   | Non-negotiable requirement. Violation = failure.   |
| **SHOULD** | Strong recommendation. Skip only with good reason. |
| **MAY**    | Optional behavior. Use judgment.                   |

Every instruction in a skill should be classifiable as one of these. If an
instruction reads at the same "volume" as everything else, it will be treated as
optional regardless of intent.

---

## Size Limits

| Threshold | Action                                   |
| --------- | ---------------------------------------- |
| < 300     | Good -- no action needed                 |
| 300-499   | Warning -- consider extracting content   |
| 500+      | Error -- must extract to companion files |

### Extraction Strategy

When a skill approaches 300 lines, extract content to companion files in the
same skill directory:

```
skill-name/
├── SKILL.md          # Core instructions (< 300 lines)
├── REFERENCE.md      # Detailed examples, templates, question banks
├── prompts.md        # Agent prompt specifications (if multi-agent)
├── domains.md        # Domain-specific tables/data
├── ARCHIVE.md        # Archived evidence, old version history
└── scripts/          # Executable scripts
```

Reference extracted files from SKILL.md:

```markdown
> Read `.claude/skills/skill-name/REFERENCE.md` for detailed examples and
> templates.
```

---

## Agent Orchestration Standards

### Return Protocol

All agent prompts MUST include:

```
CRITICAL RETURN PROTOCOL: Return ONLY this format:
COMPLETE: [agent-id] wrote N findings to [output-path]
Do NOT return full findings content.
```

### Dependency Documentation

Skills with parallel execution MUST document constraints:

```markdown
**Dependency constraints:** All agents in this wave are independent -- no
ordering required. Wave N+1 depends on Wave N completion.
```

---

## Shared Templates

Common boilerplate lives in `.claude/skills/_shared/`:

| Template             | Purpose                                  | Used by             |
| -------------------- | ---------------------------------------- | ------------------- |
| `AUDIT_TEMPLATE.md`  | Evidence, TDMS intake, review procedures | All audit-\* skills |
| `SKILL_STANDARDS.md` | This file -- structural standards        | skill-creator       |

Audit skills reference the shared template instead of duplicating boilerplate:

```markdown
## Standard Audit Procedures

> Read `.claude/skills/_shared/AUDIT_TEMPLATE.md` for: Evidence Requirements,
> Dual-Pass Verification, JSONL Output Format, MASTER_DEBT Cross-Reference,
> Interactive Review, TDMS Intake & Commit, and Honesty Guardrails.
```

---

## Evidence & Version History Management

- **Version History**: Keep last 5 entries inline. Archive older entries to
  `ARCHIVE.md` in the same skill directory.
- **Evidence blocks**: Keep last 5 citations. Archive older evidence to
  `ARCHIVE.md`.
- **PR/Session references**: Use format `PR #NNN`, `Session #NNN` for
  traceability.

---

## Step Numbering

- Sequential within each section (1, 2, 3...)
- Separate sections may restart numbering (Phase 1 steps, Phase 2 steps)
- Use `Step N.M` for sub-steps (not `Step Nb`)
- No gaps or duplicates within a single logical sequence

---

## Naming Conventions

| Convention | Pattern                   | Example                  |
| ---------- | ------------------------- | ------------------------ |
| Skill name | lowercase-kebab-case      | `audit-code`             |
| Directory  | `.claude/skills/<name>/`  | `.claude/skills/sprint/` |
| Companion  | lowercase with extension  | `prompts.md`             |
| Shared     | `.claude/skills/_shared/` | UPPERCASE filenames      |

---

## Cross-Reference Patterns

- **Skill invocations**: Use `/skill-name` format
- **Descriptive references**: Use backtick `` `skill-name` `` format (for
  parent/related skills that shouldn't be flagged as dependencies)
- **File paths**: Use relative paths from repo root
- **Script references**: Use `node scripts/...` or `npm run ...` format

---

## Integration & Routing

Skills MUST be aware of their neighbors:

- **"When NOT to Use" MUST redirect** to specific alternatives, not just say
  "when a more specialized skill exists." Name the skill.
- **Routing guidance** belongs at the top of skills with close neighbors. If 3+
  skills could plausibly handle the same trigger, the primary skill SHOULD
  include a routing section distinguishing them.
- **Handoff protocols** MUST be explicit. If a skill produces output consumed by
  another skill, document the artifact contract: what files, what paths, what
  format.

---

## Guard Rails & Error Handling

Skills SHOULD address failure modes relevant to their domain:

- What happens with bad input or missing context?
- What if scope grows beyond the skill's boundaries?
- What if the session compacts mid-execution? (especially for long-running
  skills)
- Recovery procedure: how to resume from a partial execution.

For long-running skills (planning, auditing, multi-phase): persist state to
`.claude/state/` and write artifacts to disk incrementally — not just at the
end.

---

## User Experience

Skills that involve multi-step interaction SHOULD include:

- **Warm-up**: Brief orientation at start — what the skill does, what to expect
- **Progress indicators**: "Batch 2 of 3" or "Step 3 of 7" where applicable
- **Visual structure**: Consistent use of `##` headers, `---` dividers, tables,
  bold for emphasis
- **Closure signal**: Explicit completion message listing artifacts produced

---

## Quality Checklist (for skill-creator)

### Structural Quality

- [ ] YAML frontmatter with name + description
- [ ] "When to Use" section with specific triggers
- [ ] "When NOT to Use" section with named alternatives
- [ ] "Version History" table at end of file
- [ ] Under 300 lines core (extract to companions if needed)
- [ ] Agent prompts include COMPLETE: return protocol (if multi-agent)
- [ ] Parallel execution has dependency constraints documented
- [ ] Cross-references resolve to existing skills/scripts
- [ ] No duplicated boilerplate (use shared templates)

### Behavioral Quality

- [ ] Critical rules front-loaded (top third of file)
- [ ] MUST/SHOULD/MAY hierarchy applied to all instructions
- [ ] Critical rules repeated at point-of-use (not just in overview)
- [ ] Checklists used instead of prose for multi-item requirements
- [ ] "When NOT to Use" redirects to specific named skills
- [ ] Error/failure paths addressed for the skill's domain
- [ ] Long-running skills have compaction resilience (state persistence)
- [ ] Multi-step skills have UX guidance (progress, warm-up, closure)
- [ ] Project conventions referenced (CLAUDE.md), not duplicated
- [ ] Guided prompts used instead of generic `[placeholder]` text
