# Roadmap: Framework v1.0

## Overview

10-phase execution roadmap for the Framework Migration v1.0 milestone. Derived from deep-plan artifacts (68 decisions, 39 implementation steps) and mapped to 44 requirements.

**Milestone:** Framework Migration v1.0
**Phases:** 10
**Requirements:** 44 (all mapped)
**Planning source:** `docs/planning/PLAN.md` (39 detailed steps)

## Phases

### Phase 1: Foundation (CANON & Config)

**Goal:** Establish the standards foundation everything else builds on.
**Gate:** HARD — must pass before any other phase begins.
**Requirements:** FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05

**Success criteria:**

- `framework.config.json` exists and validates against Zod schema
- CANON directory contains 10 standards, 2 schemas, 8 templates
- Dependency registry populated with known relationships
- Outside resource survey documented with go/no-go decisions
- Phase audit passes

---

### Phase 2: Sanitization & Cleanup

**Goal:** Remove all sonash-specific content so the framework is project-agnostic.
**Gate:** HARD — framework must be clean before building on it.
**Requirements:** SANI-01, SANI-02, SANI-03, SANI-04, SANI-05

**Success criteria:**

- Sanitization checker detects all 5 layers of references
- Zero Firebase content in repo
- All S0 gaps resolved
- All config files and hooks pass sanitization scan
- Phase audit passes (zero sonash/Firebase references)

---

### Phase 3: Core Systems

**Goal:** Complete session, hook, and script infrastructure.
**Gate:** SOFT — S0 blocks, others carry as TDMS debt.
**Requirements:** CORE-01, CORE-02, CORE-03

**Success criteria:**

- Full session lifecycle works (start → work → end, compact → restore)
- All 12 hooks comply with HOOK_STANDARD
- All script libraries pass sanitization
- Ecosystem audits pass for session, hook, and script domains

---

### Phase 4: Migration Wave

**Goal:** Migrate agents, skills, ESLint rules, docs, and build new skills.
**Gate:** SOFT
**Requirements:** MIGR-01, MIGR-02, MIGR-03, MIGR-04, MIGR-05, MIGR-06

**Success criteria:**

- 25 agents present and AGENT_STANDARD compliant
- All generic skills migrated and SKILL_STANDARDS compliant
- 24 ESLint rules in plugin
- `/config` and `/recover` skills functional
- Skill ecosystem audit passes

---

### Phase 5: Quality Gates

**Goal:** Complete pre-commit/pre-push pipeline and CI workflows.
**Gate:** SOFT
**Requirements:** QUAL-01, QUAL-02, QUAL-03

**Success criteria:**

- All 11 pre-commit waves work with tiered presets
- All 7 pre-push gates functional
- CI passes on both platforms
- All non-PR workflows functional

---

### Phase 6: Pipeline Completion

**Goal:** Complete TDMS, audit infrastructure, and multi-AI audit.
**Gate:** SOFT
**Requirements:** PIPE-01, PIPE-02, PIPE-03

**Success criteria:**

- Full TDMS pipeline functional (sprint, resolution, extraction)
- Both audit orchestrators run successfully
- Multi-AI audit works with sanitized prompts
- All standalone scripts migrated and invokable

---

### Phase 7: Upstream Sync Mechanism

**Goal:** Build bidirectional sync between framework and sonash.
**Gate:** HARD — sync must work before PR migration uses it.
**Requirements:** SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05

**Success criteria:**

- Confirmed sync manifest covers all syncable files
- Drift detection fires at session-start
- `/sync` skill completes 8-step flow end-to-end
- `/export-improvements` generates summary and patch
- Rollback on validation failure works

---

### Phase 8: PR Ecosystem Migration

**Goal:** First real test of sync mechanism — pull PR overhaul from sonash.
**Gate:** SOFT
**Requirements:** PREC-01, PREC-02, PREC-03

**Success criteria:**

- PR ecosystem synced via `/sync` commit-history mode
- Pattern promotion pipeline connected
- PR-related CI workflows functional
- PR ecosystem audit passes

---

### Phase 9: Health, Monitoring & Polish

**Goal:** Health monitoring, metrics, documentation rewrite, genesis doc.
**Gate:** SOFT
**Requirements:** PLSH-01, PLSH-02, PLSH-03, PLSH-04, PLSH-05, PLSH-06

**Success criteria:**

- `/alerts` produces accurate 36-category dashboard
- Cross-system metrics aggregation works
- CLAUDE.md is concise and references CANON
- ROADMAP.md reflects actual state
- Genesis document complete
- MCP/plugin config works in both environments

---

### Phase 10: Final Audit & Stabilization

**Goal:** Validate everything works, fix remaining issues, sign off.
**Gate:** HARD — framework must be production-ready.
**Requirements:** VALD-01, VALD-02, VALD-03, VALD-04, VALD-05

**Success criteria:**

- Cross-platform test matrix passes on Windows and Linux
- Both comprehensive audit orchestrators pass
- Zero sonash/Firebase references in final scan
- Dependency graph complete
- Migration completeness 95%+
- User sign-off

---

## Phase Dependencies

```
Phase 1 (Foundation) ──HARD──> Phase 2 (Sanitization) ──HARD──> Phase 3 (Core)
                                                                      │
                                                    ┌─────────────────┤
                                                    v                 v
                                              Phase 4 (Migration) Phase 5 (Quality)
                                                    │                 │
                                                    └────────┬────────┘
                                                             v
                                                       Phase 6 (Pipelines)
                                                             │
                                                             v
                                                  Phase 7 (Sync) ──HARD──> Phase 8 (PR)
                                                                                │
                                                                                v
                                                                          Phase 9 (Polish)
                                                                                │
                                                                                v
                                                                     Phase 10 (Final) ──HARD──> DONE
```

**Parallelization opportunities:**

- Phases 4 and 5 can run in parallel after Phase 3
- Within Phase 4: Steps 3.1-3.6 are independent
- Within Phase 6: Steps 5.1-5.3 are independent
- Within Phase 9: Steps 8.1 and 8.2 are independent

## Version History

| Version | Date       | Description                                 |
| ------- | ---------- | ------------------------------------------- |
| 1.0     | 2026-03-01 | Initial roadmap from GSD milestone creation |

---

_Roadmap created: 2026-03-01_
_Last updated: 2026-03-01_
