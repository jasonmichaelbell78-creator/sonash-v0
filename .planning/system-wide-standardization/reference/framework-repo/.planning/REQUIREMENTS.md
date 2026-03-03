# Requirements: Framework

## Overview

44 requirements across 10 categories for the Framework Migration v1.0 milestone. Derived from deep-plan artifacts and mapped to roadmap phases.

**Defined:** 2026-03-01
**Core Value:** Every project built with this framework gets battle-tested automation, quality gates, and AI-assisted workflows out of the box.

## v1 Requirements

Requirements for v1.0 milestone. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: Framework has a single unified config file (`framework.config.json`) with local override pattern
- [ ] **FOUND-02**: CANON directory contains schemas, standards, and templates as single codified standard
- [ ] **FOUND-03**: 10 CANON standards documents cover all system conventions
- [ ] **FOUND-04**: Dependency registry tracks all cross-system relationships with typed edges
- [ ] **FOUND-05**: Outside resource survey completed (plugins, MCP, Actions, ESLint, NPM)

### Sanitization

- [ ] **SANI-01**: Automated sanitization checker scans 5 layers (L1 explicit names through L5 cross-references)
- [ ] **SANI-02**: Zero Firebase content remains in framework
- [ ] **SANI-03**: All S0 sanitization gaps resolved
- [ ] **SANI-04**: All config files (6) sanitized of sonash-specific content
- [ ] **SANI-05**: All hooks and scripts sanitized with interactive L4-5 decisions recorded

### Core Systems

- [ ] **CORE-01**: Session ecosystem lifecycle works end-to-end (start, begin, end, compact, restore)
- [ ] **CORE-02**: All 12 hooks comply with HOOK_STANDARD
- [ ] **CORE-03**: All script libraries sanitized and clean

### Migration

- [ ] **MIGR-01**: 25 agents present and AGENT_STANDARD compliant
- [ ] **MIGR-02**: Missing generic skills migrated and SKILL_STANDARDS compliant
- [ ] **MIGR-03**: ESLint plugin has 24 rules (23 existing + 1 new)
- [ ] **MIGR-04**: Documentation infrastructure complete
- [ ] **MIGR-05**: `/config` skill provides interactive configuration browsing
- [ ] **MIGR-06**: `/recover` skill handles orphaned state recovery

### Quality Gates

- [ ] **QUAL-01**: Pre-commit waves 1-11 functional with tiered preset system (starter/standard/full)
- [ ] **QUAL-02**: All 7 pre-push gates functional
- [ ] **QUAL-03**: CI workflows sanitized, cross-platform, and all passing

### Pipelines

- [ ] **PIPE-01**: Full TDMS pipeline functional (sprint, resolution, extraction, sync)
- [ ] **PIPE-02**: Audit infrastructure migrated (10 scripts, 2 orchestrators)
- [ ] **PIPE-03**: Multi-AI audit runs with sanitized prompts

### Upstream Sync

- [ ] **SYNC-01**: Sync manifest maps all syncable files between repos
- [ ] **SYNC-02**: Drift detection runs at session-start via commit SHA comparison
- [ ] **SYNC-03**: `/sync` skill implements 8-step interactive flow with dual modes
- [ ] **SYNC-04**: `/export-improvements` generates summary and patch for reverse sync
- [ ] **SYNC-05**: Post-sync validation with rollback on failure

### PR Ecosystem

- [ ] **PREC-01**: PR ecosystem overhaul synced from sonash via `/sync` (first real test case)
- [ ] **PREC-02**: Pattern promotion pipeline connected
- [ ] **PREC-03**: PR-related CI workflows functional

### Polish

- [ ] **PLSH-01**: Health monitoring with `/alerts` dashboard and persistent history
- [ ] **PLSH-02**: Cross-system metrics aggregation to unified `metrics/` directory
- [ ] **PLSH-03**: CLAUDE.md rewritten as concise operational guide referencing CANON
- [ ] **PLSH-04**: ROADMAP.md updated to reflect actual state
- [ ] **PLSH-05**: Project genesis document captures foundational decisions
- [ ] **PLSH-06**: MCP and plugin configuration works in both environments

### Validation

- [ ] **VALD-01**: Cross-platform test matrix passes on Windows and Linux
- [ ] **VALD-02**: Both comprehensive audit orchestrators pass
- [ ] **VALD-03**: Final sanitization scan shows zero references
- [ ] **VALD-04**: Dependency graph complete and accurate
- [ ] **VALD-05**: Migration completeness score 95%+

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Upstream Sync (Ongoing)

- **SYNC-06**: Ongoing sync cadence and skill refinement
- **SYNC-07**: Automated scheduled sync checks

### Interactive Creation Layer

- **CREA-01**: Interactive project scaffolding from framework templates
- **CREA-02**: Guided configuration setup for new projects
- **CREA-03**: Template-based skill/agent/hook creation

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                    | Reason                                   |
| -------------------------- | ---------------------------------------- |
| Firebase content           | Sonash-specific, not reusable (D1)       |
| App-specific folders       | Not relevant to framework (D3)           |
| Manual scripts             | Everything via skill/hook/procedure (D6) |
| Interactive creation layer | Separate milestone after foundation (D5) |
| User-written code          | 100% AI-coded model (D8)                 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase    | Status  |
| ----------- | -------- | ------- |
| FOUND-01    | Phase 1  | Pending |
| FOUND-02    | Phase 1  | Pending |
| FOUND-03    | Phase 1  | Pending |
| FOUND-04    | Phase 1  | Pending |
| FOUND-05    | Phase 1  | Pending |
| SANI-01     | Phase 2  | Pending |
| SANI-02     | Phase 2  | Pending |
| SANI-03     | Phase 2  | Pending |
| SANI-04     | Phase 2  | Pending |
| SANI-05     | Phase 2  | Pending |
| CORE-01     | Phase 3  | Pending |
| CORE-02     | Phase 3  | Pending |
| CORE-03     | Phase 3  | Pending |
| MIGR-01     | Phase 4  | Pending |
| MIGR-02     | Phase 4  | Pending |
| MIGR-03     | Phase 4  | Pending |
| MIGR-04     | Phase 4  | Pending |
| MIGR-05     | Phase 4  | Pending |
| MIGR-06     | Phase 4  | Pending |
| QUAL-01     | Phase 5  | Pending |
| QUAL-02     | Phase 5  | Pending |
| QUAL-03     | Phase 5  | Pending |
| PIPE-01     | Phase 6  | Pending |
| PIPE-02     | Phase 6  | Pending |
| PIPE-03     | Phase 6  | Pending |
| SYNC-01     | Phase 7  | Pending |
| SYNC-02     | Phase 7  | Pending |
| SYNC-03     | Phase 7  | Pending |
| SYNC-04     | Phase 7  | Pending |
| SYNC-05     | Phase 7  | Pending |
| PREC-01     | Phase 8  | Pending |
| PREC-02     | Phase 8  | Pending |
| PREC-03     | Phase 8  | Pending |
| PLSH-01     | Phase 9  | Pending |
| PLSH-02     | Phase 9  | Pending |
| PLSH-03     | Phase 9  | Pending |
| PLSH-04     | Phase 9  | Pending |
| PLSH-05     | Phase 9  | Pending |
| PLSH-06     | Phase 9  | Pending |
| VALD-01     | Phase 10 | Pending |
| VALD-02     | Phase 10 | Pending |
| VALD-03     | Phase 10 | Pending |
| VALD-04     | Phase 10 | Pending |
| VALD-05     | Phase 10 | Pending |

**Coverage:**

- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

## Version History

| Version | Date       | Description                                      |
| ------- | ---------- | ------------------------------------------------ |
| 1.0     | 2026-03-01 | Initial requirements from GSD milestone creation |

---

_Requirements defined: 2026-03-01_
_Last updated: 2026-03-01_
