# Skill Standards

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
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

## Size Limits

| Threshold | Action                                   |
| --------- | ---------------------------------------- |
| < 500     | Good -- no action needed                 |
| 500-799   | Warning -- consider extracting content   |
| 800+      | Error -- must extract to companion files |

### Extraction Strategy

When a skill exceeds 500 lines, extract content to companion files in the same
skill directory:

```
skill-name/
├── SKILL.md          # Core instructions (< 500 lines)
├── prompts.md        # Agent prompt specifications (if multi-agent)
├── examples.md       # Code examples, templates
├── domains.md        # Domain-specific tables/data
├── ARCHIVE.md        # Archived evidence, old version history
└── scripts/          # Executable scripts
```

Reference extracted files from SKILL.md:

```markdown
> Read `.claude/skills/skill-name/prompts.md` for full agent prompt
> specifications.
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

## Quality Checklist (for skill-creator)

Before finalizing a new skill:

- [ ] YAML frontmatter with name + description
- [ ] "When to Use" section with specific triggers
- [ ] "When NOT to Use" section with alternatives
- [ ] "Version History" table at end of file
- [ ] Under 500 lines (extract to companions if needed)
- [ ] Agent prompts include COMPLETE: return protocol (if multi-agent)
- [ ] Parallel execution has dependency constraints documented
- [ ] Cross-references resolve to existing skills/scripts
- [ ] No duplicated boilerplate (use shared templates)
