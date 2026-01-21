---
description: Commands Folder - DEPRECATED
---

# Commands Folder - DEPRECATED

**Status:** DEPRECATED as of 2026-01-21 **Replacement:** `.claude/skills/`
folder

---

## Migration Notice

All commands in this folder have been migrated to the skills format in
`.claude/skills/`.

The skill format provides:

- Better discoverability by Claude
- Richer metadata (name, description in frontmatter)
- Support for reference files and helper scripts
- Cleaner organization

## Command → Skill Mapping

| Command (deprecated)   | Skill (use this)            |
| ---------------------- | --------------------------- |
| `/audit-code`          | `audit-code` skill          |
| `/audit-documentation` | `audit-documentation` skill |
| `/audit-performance`   | `audit-performance` skill   |
| `/audit-process`       | `audit-process` skill       |
| `/audit-refactoring`   | `audit-refactoring` skill   |
| `/audit-security`      | `audit-security` skill      |
| `/checkpoint`          | `checkpoint` skill          |
| `/docs-sync`           | `docs-sync` skill           |
| `/pr-review`           | `pr-review` skill           |
| `/session-begin`       | `session-begin` skill       |
| `/session-end`         | `session-end` skill         |

## Usage

Both formats currently work identically:

- `/session-begin` (old) → invokes same content
- Skill tool with `session-begin` → invokes same content

## Planned Removal

These command files will be removed in a future update once skill-only
invocation is confirmed stable.

---

**Do not add new commands here.** Create skills in `.claude/skills/` instead.
