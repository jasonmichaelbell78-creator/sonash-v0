---
description: Commands Folder - DEPRECATED (Files Removed)
---

# Commands Folder - DEPRECATED

**Status:** DEPRECATED and CLEANED UP (2026-01-31, Session #120)
**Replacement:** `.claude/skills/` folder

---

## Migration Complete

All command files have been **deleted** from this folder. The skills in
`.claude/skills/` are now the only source.

## Command → Skill Mapping

| Former Command         | Use This Skill              |
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

## Why This Folder Exists

This README remains as a redirect notice. The folder may be fully removed in a
future cleanup.

---

**Do not add commands here.** Create skills in `.claude/skills/` instead.
