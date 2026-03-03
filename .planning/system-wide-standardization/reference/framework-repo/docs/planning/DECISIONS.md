# Decision Record: Framework Migration & Sync System

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Date:** 2026-03-01
**Questions Asked:** 56
**Decisions Captured:** 68
**Batches:** 4 (+ upstream sync mini-deep-plan)

---

## Scope & Exclusions

| #   | Decision                   | Choice                                              | Rationale                                             |
| --- | -------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| 1   | Firebase content           | DELETE entirely from framework                      | Sonash-specific, not reusable                         |
| 2   | PR ecosystem timing        | Migrate later in plan (not excluded, deferred)      | Mid-redesign in sonash; PRs #398, #407, #411          |
| 3   | App-specific content       | Disregard entirely                                  | App folders/functions not relevant to framework       |
| 4   | Upstream sync planning     | Plan HERE as mini-deep-plan (revised from separate) | Needed before PR migration; extensive questions asked |
| 5   | Interactive creation layer | Separate deep-plan session                          | Deferred until framework foundation solid             |

## Core Principles

| #   | Decision              | Choice                                               | Rationale                                         |
| --- | --------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| 6   | Manual scripts policy | NONE — everything invokable via procedure/skill/hook | AUTOMATION IS KEY                                 |
| 7   | Data format standard  | JSONL for AI, MD for humans                          | Established project convention                    |
| 8   | Development model     | 100% AI-coded, user does not code                    | All code written by AI                            |
| 9   | State persistence     | Liberal use everywhere                               | State saves used liberally; compaction resilience |
| 10  | Standards timing      | Early, before building                               | Standards in place before implementation          |
| 11  | CANON timing          | Early foundation piece                               | Everything builds upon CANON                      |
| 12  | Testing approach      | Per-phase testing + end-stage audits on process      | Extensive context AND functionality testing       |

## Architecture

| #   | Decision                    | Choice                                              | Rationale                                         |
| --- | --------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| 13  | Framework config            | Single unified `framework.config.json` at repo root | One place to look, one file to override           |
| 14  | CANON definition            | Schemas + conventions as single codified standard   | CANON/ directory with schemas AND convention docs |
| 15  | Doc tier system             | Migrate all 5 components                            | Templates, header validation, dep tracking, index |
|     |                             |                                                     | auto-gen, generator config — all structural       |
| 16  | Session ecosystem           | Migrate ALL including velocity tracking and audit   | Core infrastructure. Ref session-ecosystem-audit  |
| 17  | Script ecosystem            | Migrate all generic now, PR scripts later in plan   | PR deferred in sequencing, not scope              |
| 18  | Audit system codification   | Codify in CANON with full taxonomy                  | 7 ecosystem, 9 single-system, 2 orchestrators,    |
|     |                             |                                                     | multi-ai, audit-health meta                       |
| 19  | Global/local asset strategy | Repo is source of truth + token dedup mechanism     | Works in both environments                        |
| 20  | Pattern system migration    | Split: infrastructure now, promotion with PR later  | Foundation and enforcement now, promotion when PR |
|     |                             |                                                     | overhaul lands                                    |

## Secrets, Resources & CI

| #   | Decision             | Choice                                              | Rationale                                        |
| --- | -------------------- | --------------------------------------------------- | ------------------------------------------------ |
| 21  | Secrets strategy     | `.env.example` + encrypted secrets store            | Local dev template + repo-safe encrypted storage |
| 22  | Outside resources    | Dedicated early survey (timeboxed) + ad-hoc         | Catch obvious wins early, discover as we go      |
| 23  | CI workflow strategy | Hybrid: keep sound, rewrite broken, migrate missing | Open to new from GitHub marketplace, community,  |
|     |                      |                                                     | or custom                                        |
| 24  | CLAUDE.md strategy   | Concise operational guide referencing CANON         | Stays within token budget, no duplication        |
| 25  | Health monitoring    | Alerts + health history (JSONL) + session-start     | TRACKING everywhere with actionable reporting.   |
|     |                      | checks. Sequenced later.                            | Every system needs tracking baked in             |
| 26  | Development workflow | User steers via discussion + dogfood tools as built | Validates tools in real usage, prevents drift    |

## TDMS & Sanitization

| #   | Decision                  | Choice                                           | Rationale                                        |
| --- | ------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| 27  | TDMS scope                | Track own migration debt AND ship ready-to-use   | Eat our own cooking; proves the system           |
| 28  | Sanitization verification | Automated scan (L1-3) + interactive audit (L4-5) | One-by-one presentation for user decisions.      |
|     |                           | with findings presented individually             | Checker becomes permanent gate                   |
| 29  | Plugin token dedup        | Session-start auto-detection + gitignored        | Detection catches new conflicts, config handles  |
|     |                           | `framework.config.local.json` for suppression    | known ones                                       |
| 30  | Tracking & metrics        | Hybrid: local writes, periodic aggregation to    | Systems stay independent, cross-system reporting |
|     |                           | unified `metrics/` directory                     | gets unified view                                |

## CANON Structure & Standards

| #   | Decision                  | Choice                                               | Rationale                                            |
| --- | ------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| 31  | CANON directory structure | `schemas/`, `standards/`, `templates/` +             | Single source of truth; templates inside CANON       |
|     |                           | `CANON_INDEX.md`                                     |                                                      |
| 32  | Naming conventions        | Generic "framework" name. kebab-case files,          | Codified in NAMING_CONVENTIONS.md including folder   |
|     |                           | UPPER_SNAKE CANON standards                          | structure and output placement locations             |
| 33  | Cross-platform testing    | CI-based (ubuntu + windows) + manual fallback        | Automated for most; manual for hook/session behavior |
| 34  | Phase gating              | Adaptive: hard gates on foundation, soft on          | Foundation must be right; S0 blocks, others carry    |
|     |                           | independent work                                     | as TDMS debt                                         |
| 35  | GSD handoff               | Single milestone "Framework Migration v1.0"          | Sync and creation layer as separate milestones.      |
|     |                           |                                                      | Explicitly documented boundaries for AI and user     |
| 36  | Skill migration priority  | Dependency order: session → infra → quality →        | Dependency tracking canonized across all systems     |
|     |                           | utility                                              |                                                      |
| 37  | Dependency registry       | Single `DEPENDENCY_GRAPH.jsonl` with typed edges     | Cross-system deps; typed edges (invokes, references, |
|     |                           | + generated MD view                                  | requires, triggers) enable relationship querying     |
| 38  | Pre-commit wave config    | Tiered presets: starter (1-3), standard (1-7),       | Sensible defaults. Pattern useful for future app     |
|     |                           | full (1-11) with per-wave override                   | creation layer                                       |
| 39  | Post-write validators     | Delete 4 Firebase, generalize reusable, configurable | Remove specific, keep generic value, enable          |
|     |                           | registry pattern                                     | extensibility                                        |

## Recovery, Agents & Config

| #   | Decision                   | Choice                                            | Rationale                                        |
| --- | -------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| 40  | Error recovery             | CANON `RECOVERY_STANDARD.md` + `/recover` skill + | Compaction becomes non-event; every system built |
|     |                            | session-start auto-detection with recovery menu   | with recovery in mind                            |
| 41  | Agent migration            | Audit all 25 (12 existing + 13 new) for           | Every agent must comply with AGENT_STANDARD.md   |
|     |                            | sanitization and CANON compliance                 |                                                  |
| 42  | MCP server config          | Committed `.mcp.json` + `.mcp.json.example` +     | Works both environments out of box; template for |
|     |                            | `/setup-mcp` skill                                | consuming projects                               |
| 43  | settings.json strategy     | Committed + gitignored `settings.local.json`      | Consistent local override pattern (matches D29)  |
| 44  | Skill creator canonization | Audit findings → `SKILL_STANDARDS.md` basis.      | Real-world-validated knowledge about good skills |
|     |                            | Skill-creator enforces CANON                      |                                                  |

## Data Standards & Documentation

| #   | Decision                 | Choice                                               | Rationale                                     |
| --- | ------------------------ | ---------------------------------------------------- | --------------------------------------------- |
| 45  | Document size management | Tiered thresholds by doc type in DOC_STANDARD.md     | AI context = tighter, human ref = flexible,   |
|     |                          |                                                      | generated = no limit. Split via references    |
| 46  | JSONL data standards     | Universal base fields (id, timestamp, source,        | Unified queryability, domain enforcement,     |
|     |                          | version) + per-system Zod schemas. `.quarantine.     | corrupt data handled safely                   |
|     |                          | jsonl` sidecar for invalid records                   |                                               |
| 47  | Bidirectional sync docs  | `FRAMEWORK_CHANGELOG.jsonl` + `/export-improvements` | Both directions covered. Genesis doc captures |
|     |                          | skill. Project genesis doc in `CANON/templates/`     | foundational decisions for future use         |
| 48  | Multi-AI audit prompts   | CANON template + `framework.config.json` values +    | No manual prompt editing per project          |
|     |                          | runtime assembly                                     |                                               |

## Hook & Session Config

| #   | Decision                   | Choice                                          | Rationale                                          |
| --- | -------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| 49  | Global/plugin hooks        | Document as stubs in-repo; code stays in plugin | Audit aware of existence, no maintenance burden    |
| 50  | Session-start config       | Configurable startup manifest in                | Predictable, configurable; new systems register as |
|     |                            | `framework.config.json`                         | they come online                                   |
| 51  | Config skill & interaction | Interactive `/config` skill with descriptions,  | Skills educate, not just prompt. Pattern canonized |
|     | pattern                    | options, recommendations, pros/cons             | for all skill interactions                         |
| 52  | Comprehensive audit timing | Incremental ecosystem audits per system +       | Progressive validation + cross-system final check  |
|     |                            | final comprehensive sweep                       |                                                    |
| 53  | Outside resource scope     | Wide net: plugins, MCP servers, GitHub Actions, | Can existing tools replace custom work?            |
|     |                            | ESLint, NPM packages. Timeboxed.                |                                                    |

## PR Ecosystem & Sync Test

| #   | Decision                  | Choice                                          | Rationale                                     |
| --- | ------------------------- | ----------------------------------------------- | --------------------------------------------- |
| 54  | PR ecosystem as sync test | PR overhaul (PRs #398, #407, #411) = first test | Real-world validation; significant but self-  |
|     |                           | case for sync mechanism                         | contained                                     |
| 55  | Sync dual modes           | File-diff for routine, commit-history for major | Routine needs "what changed"; major needs the |
|     |                           | migrations                                      | narrative                                     |

## Upstream Sync Mechanism (Mini-Deep-Plan)

| #   | Decision                 | Choice                                            | Rationale                                          |
| --- | ------------------------ | ------------------------------------------------- | -------------------------------------------------- |
| 56  | Sync trigger             | Automated drift detection at session-start +      | Detection is passive; sync is active and           |
|     |                          | manual `/sync` skill on demand                    | interactive                                        |
| 57  | Sync scope definition    | Pattern-based defaults + explicit overrides.      | Patterns handle bulk; overrides handle edge cases. |
|     |                          | Auto-generated `sync-manifest.jsonl`              | Manifest is source of truth                        |
| 58  | Drift detection          | Commit SHA for quick session-start check;         | SHA check = single API call (fast). Hashes =       |
|     |                          | content hashes for detailed diff on `/sync`       | precision when needed                              |
| 59  | Sonash access method     | Configurable (auto/api/local). Remote is ALWAYS   | Local is convenience only, never authoritative.    |
|     |                          | canonical. Local path in gitignored config.       | Exception: during active PR before merge           |
| 60  | Sanitization during sync | Three-stage: auto-sanitize L1-2 → interactive     | Mechanical stuff automated; human judgment for     |
|     |                          | review L3-5 → validate before commit              | ambiguous items                                    |
| 61  | Conflict resolution      | Three-way merge with interactive resolution.      | Neither repo blindly wins. Commit messages provide |
|     |                          | Show both versions + ancestor + commit context    | context for informed decisions                     |
| 62  | Sync state tracking      | `sync-state.json` + `sync-history.jsonl` +        | Audit trail of every sync decision. MD view for    |
|     |                          | generated `SYNC_STATUS.md`                        | quick health check. Aligns with D7, D25, D30       |
| 63  | Sync granularity         | File-level. Split files if mixed content needed.  | Section markers add fragility. Split into synced   |
|     |                          | No section markers.                               | base + framework overlay instead                   |
| 64  | Sync skill UX flow       | 8-step: drift check → categorize → auto-sanitize  | Interactive throughout. Aligns with D51 educate    |
|     |                          | → conflicts → new files → validate → confirm →    | pattern                                            |
|     |                          | update state                                      |                                                    |
| 65  | Reverse sync             | `/export-improvements` generates human summary    | Simple changes use patch; complex use narrative.   |
|     |                          | AND machine-applicable patch                      | Both logged to FRAMEWORK_CHANGELOG.jsonl           |
| 66  | Sync frequency           | Event-driven sync + session-start drift detection | Configurable staleness threshold escalates alert   |
|     |                          |                                                   | from informational to recommended action           |
| 67  | Post-sync validation     | Sync-specific validation first, then full test    | Rollback on failure — bad sync never lands         |
|     |                          | suite. Rollback on failure.                       |                                                    |
| 68  | Manifest bootstrap       | Auto-generated draft via path/name comparison +   | Hundreds of files; auto handles obvious matches,   |
|     |                          | interactive one-by-one review                     | interactive catches edge cases                     |

---

## Cross-Reference: Key Patterns

These patterns recur across multiple decisions and should be treated as architectural principles:

| Pattern                           | Decisions That Use It             | Description                                           |
| --------------------------------- | --------------------------------- | ----------------------------------------------------- |
| Interactive presentation          | D28, D51, D60, D61, D64, D68      | Present findings/options one-by-one with context      |
| JSONL + MD dual format            | D7, D30, D37, D46, D47, D62       | JSONL for AI/tracking, MD for human review            |
| Configurable via framework.config | D13, D29, D38, D39, D48, D50, D59 | Single config file, local overrides gitignored        |
| CANON as source of truth          | D14, D18, D31, D32, D37, D40, D44 | Standards, schemas, templates all live in CANON       |
| Tracking everywhere               | D25, D30, D37, D47, D62           | Every system writes metrics; aggregated for reporting |
| Dogfooding                        | D26, D27, D52                     | Use framework tools as they come online               |
| Three-stage verification          | D28, D60, D67                     | Auto → interactive → validate                         |
| Local override pattern            | D29, D43, D59                     | Committed defaults + gitignored `.local` overrides    |

---

## Completed Tasks (from Discovery)

1. ~~Add one-at-a-time interactive questioning mode to deep-plan skill~~ — Done (deep-plan SKILL.md v2.1, commit bae9dc6)
2. ~~Canonize comprehensive diagnosis doc format into deep-plan skill~~ — Done (deep-plan REFERENCE.md, commit bae9dc6)

---

## Version History

| Version | Date       | Description                                              |
| ------- | ---------- | -------------------------------------------------------- |
| 1.0     | 2026-03-01 | Initial record — 68 decisions across 4 discovery batches |
