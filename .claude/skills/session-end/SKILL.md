---
name: session-end
description: Complete verification steps before ending the session
---

# Session End Checklist

Before ending the session, complete these steps:

## 1. Roadmap Check (if feature work done)

If you implemented features or completed tasks this session, verify ROADMAP.md
reflects current status. Mark completed items with `[x]`.

## 2. Learning Consolidation (AUTOMATIC)

Consolidation runs **automatically** during SessionStart when the threshold is
reached (10+ reviews). No manual action required at session end.

## 3. Commit Summary

Review what was done this session:

```bash
git log --oneline -5
```

## 4. Update Session State

```bash
npm run hooks:health -- --end
```

## 5. Final Commit & Push (MANDATORY)

```bash
npm run session:end
```

This script commits and pushes all session-end changes.

Session complete.
