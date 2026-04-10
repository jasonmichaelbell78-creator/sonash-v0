---
name: website-synthesis
description:
  DEPRECATED — use /synthesize instead. /website-synthesis was consolidated into
  the unified /synthesize skill which handles all 4 source types (repo, website,
  document, media). Redirect expires next session.
---

# /website-synthesis (DEPRECATED)

This skill has been consolidated into [`/synthesize`](../synthesize/SKILL.md).

## Why

T29 (Session #271) merged `/repo-synthesis` (v1.3) and `/website-synthesis`
(v1.1) plus the cross-type synthesis stub from `/analyze` into a single unified
skill. The new skill supports all 4 paradigms this skill exposed (thematic,
narrative, matrix, meta-pattern), source tier weighting (T1-T4), and the
saturation stopping rule, while also handling repos, documents, and media in one
pass.

See `.planning/synthesis-consolidation/` for the full design (32 decisions, 5
waves, 15 steps).

## Migration

```
# Old
/website-synthesis --paradigm=thematic

# New
/synthesize --type=website                # website-only synthesis
/synthesize                               # cross-type (recommended)
/synthesize --paradigm=matrix             # paradigm overrides supported
```

All flags from the old skill are supported via `/synthesize`. Output paths
remain the same: `.research/analysis/synthesis/synthesis.md`. History is
auto-archived to `.research/analysis/synthesis/history/`.

## Removal

This redirect expires next session. The directory will be deleted after a
one-session overlap to prevent breakage from habit or stale references.

**Deprecated:** 2026-04-09 (Session #271, T29 Wave 3).
