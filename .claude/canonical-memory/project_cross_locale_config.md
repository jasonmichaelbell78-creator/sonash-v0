---
name: project_cross_locale_config
description:
  Cross-locale memory sync — shared git artifacts vs locale-specific memory
  directories
type: project
status: active
---

- Shared via git: CLAUDE.md, codebase, .claude/state/, .planning/
- Locale-specific: memory directory (~/.claude/projects/<path>/memory/)
- Work locale: C:\Users\jbell\..., restricted Windows environment
- Home locale: C:\Users\jason\..., unrestricted
- Sync method: commit canonical memory set to repo, copy to locale memory dirs
- **Why:** Memory is keyed to project path, so different locales get separate
  directories.
- **Apply:** After major memory changes, commit to git for cross-locale sync.
