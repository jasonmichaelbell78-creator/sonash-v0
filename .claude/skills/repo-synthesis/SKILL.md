---
name: repo-synthesis
description:
  DEPRECATED — use /synthesize instead. /repo-synthesis was consolidated into
  the unified /synthesize skill which handles all 4 source types (repo, website,
  document, media). Redirect expires next session.
---

# /repo-synthesis (DEPRECATED)

This skill has been consolidated into [`/synthesize`](../synthesize/SKILL.md).

## Why

T29 (Session #271) merged `/repo-synthesis` (v1.3) and `/website-synthesis`
(v1.1) plus the cross-type synthesis stub from `/analyze` into a single unified
skill. The new skill produces 8 output sections — supersetting the 6 this skill
provided (emergent themes, ecosystem gaps, reading chains, mental model
evolution, fit portfolio, knowledge map) with 2 additions (opportunity matrix,
changes since previous) — and handles all source types in one pass.

See `.planning/synthesis-consolidation/` for the full design (32 decisions, 5
waves, 15 steps).

## Migration

```
# Old
/repo-synthesis

# New
/synthesize --type=repo                # repo-only synthesis
/synthesize                            # cross-type (recommended)
/synthesize --paradigm=narrative       # different paradigm
```

All flags from the old skill are supported via `/synthesize`. Output paths have
changed: `.research/analysis/SYNTHESIS.md` →
`.research/analysis/synthesis/synthesis.md`. History is auto-archived to
`.research/analysis/synthesis/history/`.

## Removal

This redirect expires next session. The directory will be deleted after a
one-session overlap to prevent breakage from habit or stale references.

**Deprecated:** 2026-04-09 (Session #271, T29 Wave 3).
