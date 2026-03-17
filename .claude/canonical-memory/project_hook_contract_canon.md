---
name: Hook contract schema is CANON artifact
description: hook-checks.json schema (D14) must be registered in SWS CANON plan — defines hook check contract for all ecosystems
type: project
status: active
---

The hook-checks.json schema (D14) is a CANON-level artifact per T5 (contract over implementation). Defines what every hook check must declare: id, command, blocking behavior, exit codes, conditions, actions. All ecosystems register checks against this schema.

**When CANON Phase 1 or Hooks Phase 3 resumes:**
1. Register schema in `.canon/schemas/`, reference from enforcement manifests
2. Validate via validate-hook-manifest.js against CANON schema version
3. All ecosystems (pre-commit, pre-push, Claude Code, CI/CD) use same format

**Source:** `.planning/hook-system-overhaul/DECISIONS.md` decision D14
