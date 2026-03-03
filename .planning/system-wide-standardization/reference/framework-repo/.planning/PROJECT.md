# Framework

## Overview

A reusable development workflow framework providing standardized tooling, quality gates, AI agent orchestration, and development practices that can be shared across projects. Extracted from sonash-v0, designed to be project-agnostic and configurable.

## Core Value

Every project built with this framework gets battle-tested automation, quality gates, and AI-assisted workflows out of the box — no manual scripts, no reinventing infrastructure.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] CANON standards system (schemas, conventions, templates)
- [ ] Complete sanitization of sonash-specific content (5 layers)
- [ ] Framework parameterization via `framework.config.json`
- [ ] Session, hook, script, and agent ecosystem migration
- [ ] Quality gate pipeline (pre-commit waves, pre-push gates, CI)
- [ ] TDMS and audit infrastructure migration
- [ ] Upstream sync mechanism (`/sync`, `/export-improvements`)
- [ ] PR ecosystem migration (first sync test case)
- [ ] Health monitoring, metrics aggregation, alerts
- [ ] Cross-platform validation (Windows CLI + Linux Claude Code)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Firebase content — sonash-specific, not reusable (D1)
- App-specific folders/functions — not relevant to framework (D3)
- Interactive creation layer — separate deep-plan after foundation solid (D5)
- Manual scripts — everything invokable via procedure/skill/hook (D6)

## Context

- **Source repo:** sonash-v0 (private, ~55% migrated to framework)
- **Development model:** 100% AI-coded, user does not write code (D8)
- **Environments:** Windows 11 CLI (home) + Linux Claude Code app (work)
- **Current state:** C+ readiness (62/100), 42 gaps across 13 domains
- **Planning artifacts:** `docs/planning/` — DIAGNOSIS.md, DECISIONS.md (68 decisions), PLAN.md (10 phases, 39 steps)
- **Data format standard:** JSONL for AI, Markdown for humans (D7)
- **State persistence:** Liberal use everywhere with compaction resilience (D9)

## Constraints

- **Cross-platform:** Must work on both Windows and Linux without modification
- **No manual scripts:** All automation via skills, hooks, or agents (D6)
- **CANON first:** Standards in place before building systems (D10, D11)
- **Hard gates:** Phases 1, 2, 7, 10 must pass audit before proceeding (D34)
- **Sanitization depth:** 5 layers (L1 explicit names → L5 cross-references) (D28)

## Key Decisions

<!-- 68 decisions captured in docs/planning/DECISIONS.md. Key ones below. -->

| Decision                             | Rationale                                                 | Outcome   |
| ------------------------------------ | --------------------------------------------------------- | --------- |
| Single `framework.config.json` (D13) | One place to look, one file to override                   | — Pending |
| CANON as codified standard (D14)     | Everything builds upon CANON                              | — Pending |
| Adaptive phase gating (D34)          | Foundation must be right; S0 blocks, others carry as TDMS | — Pending |
| GSD milestone structure (D35)        | Sync and creation layer as separate milestones            | — Pending |
| Upstream sync planned here (D4)      | Needed before PR migration                                | — Pending |

## Version History

| Version | Date       | Description                                 |
| ------- | ---------- | ------------------------------------------- |
| 1.0     | 2026-03-01 | Initial project from GSD milestone creation |

---

_Last updated: 2026-03-01_
