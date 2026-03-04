# Discovery Record: System-Wide Standardization

> **Auto-generated** from JSONL source files by `generate-discovery-record.js`.
> Per D79/T2: JSONL is source of truth. This MD is the generated human view.
> **Do not manually edit** — changes will be overwritten on next generation.

**Generated:** 2026-03-04
**Decisions:** 83 | **Tenets:** 18 | **Directives:** 38 | **Ideas:** 45
**Status:** phase_1b_complete

---

## Core Tenets (T1-T18)

| ID | Name | Category | Statement |
|-----|------|----------|-----------|
| T1 | T1_canon_is_ecosystem_zero | foundation | CANON is the meta-system above all others. It defines the rules, lives at `.canon/` repo root, and is the first ecosy... |
| T2 | T2_source_of_truth_generated_views | foundation | Every system has ONE authoritative source. Everything else is derived/generated. Never maintain two copies — maintain... |
| T3 | T3_maturity_is_measurable | foundation | Maturity is computed from a concrete checklist, never subjectively assigned. 16 items → L0-L5 levels. If you can't me... |
| T4 | T4_jsonl_first | design | JSONL is the canonical storage format — AI-consumed, appendable, line-diffable. MD is generated for human consumption... |
| T5 | T5_contract_over_implementation | design | CANON defines the contract (what a health checker must output, what an enforcement manifest looks like). How each eco... |
| T6 | T6_room_for_growth | design | Nothing ships as a dead end. Everything must be upgradeable. Ease the upgrade process. Schemas, APIs, structures — al... |
| T7 | T7_platform_agnostic_by_default | design | All CANON artifacts, scripts, and tooling MUST work identically on both Claude Code Desktop (Linux sandbox) and Windo... |
| T8 | T8_automation_over_discipline | operations | If a process relies on human memory, it WILL fail. Hooks, gates, scripts — not checklists and READMEs. Automate enfor... |
| T9 | T9_crash_proof_state | operations | State survives compaction, session boundaries, crashes, and network failures. Not optional — it's infrastructure. Sta... |
| T10 | T10_validate_before_scaling | operations | Pilot on 1-2, prove it works, then roll out. Never mass-apply an unproven pattern. CANON validates itself before it s... |
| T11 | T11_fail_loud_fail_early | operations | When something is wrong, it screams immediately — not silently logs to a file nobody reads. Pre-commit catches before... |
| T12 | T12_idempotent_operations | operations | Every CANON script and operation produces the same result whether run once or five times. No data corruption from re-... |
| T13 | T13_plan_as_you_go | process | Each ecosystem gets its own deep-plan when sequenced. No stale pre-plans. Discoveries feed forward — what you learn s... |
| T14 | T14_capture_everything_surface_what_matters | process | Ideas, findings, tangential thoughts MUST be recorded — institutional memory. Then surface what's actionable through ... |
| T15 | T15_interactivity_first | process | Interactive workflows over batch output. Batch questioning over monologue dumps. User-driven decisions, not AI-driven... |
| T16 | T16_single_ownership_many_consumers | process | Every component has exactly one owner responsible for it. Others consume, never supersede. Primary ownership = mainte... |
| T17 | T17_declarative_over_imperative | process | Declare WHAT should be, let tools enforce HOW. Enforcement manifests, schemas, configs — all declarative. You describ... |
| T18 | T18_changelog_driven_traceability | operations | Every ecosystem change that affects another system MUST be logged in a standardized JSONL changelog. Cross-ecosystem ... |

## All Decisions (D1-D83)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D1 | CANON file location | `.canon/` at repo root — new top-level directory | Meta-system deserves top-level visibility, not buried under .planning/ or docs/ |
| D2 | Ecosystem definition format | Registry JSONL (`.canon/ecosystems.jsonl`) + per-ecosystem detail files | JSONL = canonical/AI-consumed, MD = human views generated from JSONL. Core tenet of the system mo... |
| D3 | Maturity model | Hybrid: completeness tier checklist drives computed level (L0-L5) | Makes 'what's missing' obvious and progress measurable. Concrete capabilities compute to a level. |
| D4 | Cross-cutting subsystem mapping | Per-ecosystem files are source of truth + generated matrix view | Follows JSONL-first → generated-views pattern. Each ecosystem knows its own subsystems, matrix is... |
| D5 | Configuration parameterization | Global defaults + per-ecosystem cascade/override (CSS-like) | Avoids 70+ hardcoded values while letting ecosystems specialize where needed. |
| D6 | Sequencing strategy | Dependency graph (CANON first) with maturity as tiebreaker (highest first) | Build momentum: early wins validate the framework before tackling hard stuff. CANON → near-compli... |
| D7 | This deep-plan's deliverable | Full ecosystem catalog + maturity assessments + sequenced plan + CANON spec | We have the research (500+ components). Comprehensive output avoids another discovery pass. |
| D8 | Maturity level definitions (L0-L5) | Approved scale: L0=Nonexistent, L1=Identified, L2=Structured, L3=Monitored, L4=Enforced, L5=Canon... | Clear progression. L5 = all applicable subsystems canonized (not all 16 if some don't apply to ec... |
| D9 | Completeness checklist items | 16-item checklist (original 13 + 3 gap-fills: inter-ecosystem contracts, rollback/recovery, depre... | User liked original 13, accepted 3 additions to close gaps. |
| D10 | Subsystem standardization depth | Pattern-level: CANON defines interface + reference pattern (PR Review v2 as exemplar) | Templates too rigid, interface-only too ambiguous. Reference patterns formalize what already exists. |
| D11 | Ecosystem boundary rules | Primary ownership + consumer references (no superseding ecosystem) | Primary = maintenance responsibility, not authority hierarchy. Shared components have one owner, ... |
| D12 | CANON spec scope in this plan | Working draft (structure + maturity model + subsystem interfaces + registry schema) with room for... | Enough to start building CANON. Ecosystem assessments separate. Room for growth is a core tenet —... |
| D13 | CANON versioning | Semver (start at 0.1.0, promote to 1.0.0 after 2-3 ecosystem validations) | CANON is infrastructure others depend on. Breaking changes need explicit migration guidance. |
| D14 | Enforcement severity levels | 4-tier: error (blocking), warning (non-blocking + logged), info (displayed only), silent (suppres... | Granular enough without being complex. Silent tier handles known-accepted items. |
| D15 | Enforcement gate placement | Tiered: pre-commit (fast checks), pre-push (full validation), PR (comprehensive) | Fast feedback for quick checks, thorough validation before sharing. Each gate has appropriate scope. |
| D16 | Naming convention depth | Files + exports + JSONL fields (3-layer naming standard) | Covers the surfaces that matter most. Full taxonomy is overkill, files-only misses the data layer. |
| D17 | Health checker interface | Current interface + trend data + recommendations (enhanced) | Trend enables progress tracking over time. Recommendations make health checks actionable, not jus... |
| D18 | Dashboard generation trigger | Hybrid: auto-generate on data change + on-demand for full rebuild | Stale dashboards are useless, but full rebuild on every change is wasteful. Incremental auto + ma... |
| D19 | Migration strategy for existing ecosystems | Pilot + rollout: validate with 2-3 near-compliant ecosystems, then roll out to rest | Validates CANON itself before forcing it on complex ecosystems. Early pilots surface spec issues ... |
| D20 | Dependency declaration method | Both: per-ecosystem declares own deps + central registry aggregates all | Per-ecosystem is source of truth (consistent with Decision #4). Central view is generated/compute... |
| D21 | .canon/ directory structure | Hybrid: CANON infrastructure in categorized dirs + per-ecosystem dirs for assessment/detail data | Best of both worlds. CANON's own config/schemas/reports organized by function. Each ecosystem's d... |
| D22 | Ecosystem registry JSONL field depth | Extensible core: required core fields + optional fields with defaults. Schema validates required,... | Registry line is summary/index. Detail files have full picture. Room for growth — new fields with... |
| D23 | Maturity assessment storage | Per-ecosystem files: `.canon/ecosystems/{id}/assessment.jsonl` — co-located with ecosystem data | Keeps ecosystem data co-located (consistent with Decision #4). Each ecosystem owns its assessment... |
| D24 | Subsystem interface contract format | Zod as source of truth → JSON Schema auto-generated for external tooling. JSONL tracks implementa... | Follows established pattern: source of truth (Zod) → generated views (JSON Schema). Plus JSONL tr... |
| D25 | Health report output format | JSON summary envelope (score, trend, metadata) + JSONL findings stream (one finding per line) | Summary is single object for dashboards. Individual findings are JSONL (appendable, processable).... |
| D26 | Enforcement manifest schema | Single JSONL file per ecosystem, each rule has `tier` + `severity` fields | Single file easier to maintain/query. Tier (pre-commit/pre-push/PR) + severity (error/warning/inf... |
| D27 | Generated view production method | Standardized script interface: each view is a script with contract (reads JSONL → outputs MD). St... | Standardized interface, not implementation. Scripts can be simple or complex — the contract is wh... |
| D28 | Core tenets discovery phase — inserted before Batch 5 | Pause schema batches. Discover, formalize, and lock all core tenets BEFORE continuing with ecosys... | Core tenets guide everything downstream. Locking schemas before fully articulating the principles... |
| D29 | Tenet candidate disposition — promote, merge, demote | Promote 6 candidates to formal tenets, merge 2 into existing tenets, demote 2 to implementation p... | Tenets are 'why' principles that guide decisions. Patterns are 'how' implementations. Cascade/ove... |
| D30 | New tenets — 3 missing + 1 formalized | Add platform_agnostic_by_default, idempotent_operations, fail_loud_fail_early. Formalize automati... | Platform-agnostic: dual-environment (Linux sandbox + Windows CLI) is a real constraint with exist... |
| D31 | Tenet organization — flat with categories | Option A: Flat list with 4 categories (Foundation, Design, Operations, Process). No parent-child ... | At 16 tenets, a flat list becomes a wall. Categories make it scannable. No hierarchy avoids 'is X... |
| D32 | Tenets as first CANON artifact | `.canon/tenets.jsonl` (source of truth) + `.canon/tenets.md` (generated view). First artifact CAN... | CANON defines itself first. Tenets depend on nothing else. Dog-foods JSONL-first pattern. Each li... |
| D33 | PR Review: Current and target maturity | Current L4 (Enforced) → Target L5 (Canonized) | Reference implementation. 10/16 present, 4 partial, 2 absent. First ecosystem to reach L5 — valid... |
| D34 | TDMS: Current and target maturity | Current L2 (Structured) → Target L5 (Canonized) **[OVERRIDE]** | USER OVERRIDE: TDMS feeds into everything, MASTER_DEBT has thousands of entries, too critical to ... |
| D35 | Sessions: Current and target maturity | Current L1 (Identified) → Target L3 (Monitored) | Cross-cutting infrastructure — every ecosystem depends on session state being reliable. Schemas +... |
| D36 | Hooks: Current and target maturity | Current L3 (Monitored) → Target L4 (Enforced) | Infrastructure that other ecosystems depend on. Strong operational automation, good monitoring. D... |
| D37 | Skills: Current and target maturity | Current L1 (Identified) → Target L3 (Monitored) **[OVERRIDE]** | USER OVERRIDE from L2→L3 staged to direct L3. Large undertaking across 65 skills. Skill-audit ski... |
| D38 | Alerts: Current and target maturity | Current L2 (Structured) → Target L4 (Enforced) | Mid-session alerting is a critical operational layer. Has 36 alert categories, scoring, benchmark... |
| D39 | Scripts: Current and target maturity | Current L2 (Structured) → Target L3 (Monitored) | 300+ scripts across the repo. Script ecosystem audit exists but infrastructure lacks formal schem... |
| D40 | Docs: Current and target maturity | Current L2 (Structured) → Target L3 (Monitored) | Documentation ecosystem has generation pipelines, index sync, templates. Needs monitoring for sta... |
| D41 | CI/CD: Current and target maturity | Current L1 (Identified) → Target L3 (Monitored) | GitHub Actions workflows exist but lack formal ecosystem treatment. Pre-commit/pre-push hooks are... |
| D42 | Analytics: Current and target maturity | Current L1 (Identified) → Target L3 (Monitored) | Metrics, trend data, benchmarks scattered across health checkers and audit outputs. No unified an... |
| D43 | Batch 5B assessment complete — ecosystems 6-10 | 5 ecosystems assessed: Alerts (L2→L4, M staged), Scripts (L2→L3, L), Docs (L2→L3, M), CI/CD (L1→L... | Middle-tier ecosystems. None at L0, none targeting L5. All need schema formalization and monitori... |
| D44 | Batch 5C begins — ecosystems 11-13 + CANON self-assessment | Assessing: Planning/Roadmap, Testing, Archival/Rotation, and CANON (Ecosystem Zero) | Final ecosystem assessment batch. Includes CANON self-assessment which is unique — CANON assessin... |
| D45 | Planning ecosystem renamed to Roadmap & Execution | Rename 'Planning' → 'Roadmap & Execution'. Planning-as-skill stays in Skills ecosystem. Roadmap s... | USER INSIGHT: Planning is a skill (deep-plan, GSD discovery). The SYSTEM is the roadmap — where w... |
| D46 | Roadmap & Execution: Current and target maturity | Current L2 (Structured) → Target L3 (Monitored) | L3 is correct target — establishes monitoring + input pipeline contracts. Hub ecosystem that ever... |
| D47 | Testing: Current and target maturity | Current L3 (Monitored) → Target L4 (Enforced) | Testing infrastructure has good coverage (500+ test files), pre-commit enforcement, CI integratio... |
| D48 | Archival/Rotation: Current and target maturity | Current L3 (Monitored) → Target L4 (Enforced) | Archival patterns exist (JSONL rotation, review archival, state cleanup). Monitoring via health c... |
| D49 | CANON (Ecosystem Zero): Self-assessment and enforcement model | Current L0 (Nonexistent) → Target L5 (Canonized). STOUT enforcement system required — both intern... **[USER]** | USER DIRECTIVE: L5+++ with emphasis on 'stout system.' CANON is the meta-system — everything buil... |
| D50 | Agents: Current and target maturity | Current L2 (Structured) → Target L3 (Monitored) | 35 agent definitions with structured patterns, invocation JSONL tracking, but lacking formal heal... |
| D51 | Audits: Current and target maturity | Current L3 (Monitored) → Target L4 (Enforced), with L5 pathway built in **[USER]** | 22 quality + 7 ecosystem audit skills, results in JSONL history, health scoring. Strong foundatio... |
| D52 | Frontend/App: Current and target maturity + planning approach | Current L2 (Structured) → Target L3 (Monitored). Adapted checklist (app-layer). Planning approach... | Next.js 16, React 19, Tailwind 4 — 'part of but apart.' Has its own conventions but lacks CANON i... |
| D53 | Firebase/Backend: Current and target maturity | Current L1 (Identified) → Target L3 (Monitored). Adapted checklist (app-layer). Staged approach g... | Cloud Functions, Firestore, Auth, Storage rules — functional but largely informal. Biggest maturi... |
| D54 | App-layer checklist adaptation: formalization approach | Formalized per-ecosystem required-vs-optional mapping. Rigid framework with built-in adaptability... **[USER]** | USER DIRECTIVE: 'Formalize it. Rigidity when necessary but ability to adapt to different situatio... |
| D55 | Discovery documentation approach: two-doc system | Two-doc system — DISCOVERY_RECORD.md (human-complete) + deep-plan.state.json (machine-complete). ... | Minimum viable separation. Human-readable narrative for audit/review/reference. Machine-readable ... |
| D56 | Wave structure model | Tiered waves (4-5 waves of 3-5 ecosystems each) with checkpoint validation between waves | T10 (validate before scaling) + T13 (discoveries feed forward). Parallelism within waves, learnin... |
| D57 | Wave 1 composition | CANON solo — Wave 1 is exclusively CANON (L0→L5) | Ecosystem Zero (T1) needs undivided attention. Self-dogfoods the framework. All subsequent waves ... |
| D58 | PR Review as CANON pilot | PR Review goes in Wave 2 as explicit CANON pilot (S effort, L4→L5) | Smallest delta, proves CANON framework works on a real ecosystem before scaling. T10 validated. U... |
| D59 | TDMS staging timeline | TDMS L2→L3 starts in Wave 2, L3→L4 in Wave 3-4, L5 in Wave 5. Staged across full timeline. | Too critical to defer (user directive: feeds into everything), but XL scope requires staging acro... |
| D60 | Enforcement infrastructure timing + Skills elevation | Hooks + Testing in Wave 2 for enforcement gates. Skills ELEVATED to Wave 2 (user directive: main ... | Enforcement infra early so all subsequent waves have formal gates. Skills elevated by user — it's... |
| D61 | App-layer ecosystem timing | Frontend/App + Firebase/Backend in the final wave (last) | User insight: connection points between app and process layers are what matters. Standardize proc... |
| D62 | Parallelism within waves — SUPERSEDED by D63 *(superseded by DD63)* | SUPERSEDED. Originally: 2-3 parallel max within waves. Replaced by sequential-first approach (D63... | Deep research across 13 agents + user analysis revealed: every ecosystem overhaul creates/modifie... |
| D63 | Sequential-first execution model (replaces wave-based parallelism) | Sequential implementation with research overlap. One ecosystem at a time. Research/deep-plan ecos... | USER INSIGHT + deep research synthesis: (1) Every ecosystem overhaul creates/modifies skills, hoo... |
| D64 | T18 — Changelog-Driven Traceability (new tenet) | Every ecosystem change that affects another system MUST be logged in a standardized JSONL changel... **[USER]** | USER DIRECTIVE: 'changelogs need to be standardized and it needs to be a tenet of at least this s... |
| D65 | Docs elevated to position #5 in sequence | Docs ecosystem standardized at position #5 (after CANON, Skills, Hooks, PR Review pilot). Establi... **[USER]** | USER DIRECTIVE: 'I think I want docs at number five.' Too much content in docs (100+ files) to de... |
| D66 | CI/CD restored to sequence at position #10 | CI/CD (L1→L3, M staged) restored to the sequence at position #10, between Scripts (#9) and Alerts... | Was accidentally dropped from the initial sequential proposal. CI/CD (D41: GitHub Actions workflo... |
| D67 | Final locked sequence — 18 ecosystems, 21 steps | Sequential execution order locked. 18 unique ecosystems. TDMS staged at #8, #16, #21. Docs at #5 ... | Synthesizes all Batch 6 decisions (D56-D66) plus deep research from 13 agents covering all 18 eco... |
| D68 | Failure & stall handling | Option B: Skip & Return. If ecosystem N stalls, move to N+1, mark N as 'deferred with context.' C... | Sequential model shouldn't become a bottleneck. T18 changelog captures the gap naturally. Stalls ... |
| D69 | Exit criteria per ecosystem | Option B+C: All checklist items addressed (completed or formally deferred with justification per ... | Combines measurability (checklist) with interactivity (T15). Formal deferral prevents silent skip... |
| D70 | ROADMAP integration | Option D: Hybrid — Track-CANON for the overhaul's 21-step sequence as big picture, individual eco... | Best visibility. Track-CANON shows the big picture, existing tracks show the work. Tests Roadmap ... |
| D71 | Ongoing project work during overhaul | Option B: Interleaved. Standardization and project work in same sessions as needed. Soft guidelin... | Natural workflow. Deep-plan state files handle pause/resume. T8 automation over discipline — syst... |
| D72 | Changelog schema formalization | Option C: Extensible core. Required: {timestamp, ecosystem, change, affects}. Optional: {type, se... | Same extensible-core pattern used for ecosystem registry. Avoids schema bloat for simple changes,... |
| D73 | TDMS Grand Plan reassessment timing | Option B: Full reassessment at TDMS L2->L3 (#8) with lightweight pre-checks before each ecosystem... | Informed reassessment — changelog shows exactly what changed across ecosystems #1-#7. Pre-checks ... |
| D74 | Cross-ecosystem contracts — when defined | Option B: Per-ecosystem. CANON (#1) defines the contract FORMAT (structure, location, required fi... | Contracts grow organically and are concrete. Ecosystem #14 has 13 potential contract partners. Ch... |
| D75 | Framework repo and knowledge base integration | Option B: Per-ecosystem consultation. Each ecosystem's Phase 0 includes checking framework repo f... | USER INSIGHT: current standards, PR review patterns, prior research, and decision logs all form a... |
| D76 | CANON versioning and learning capture during overhaul | Option B (version at checkpoints) with critical amendment: learning capture happens DURING ecosys... **[USER]** | USER DIRECTIVE: 'learnings need to not only be caught ecosystem to ecosystem but during ecosystem... |
| D77 | Decision artifact architecture | Option B with path to C: Decompose state.json into purpose-specific JSONL files (decisions.jsonl,... | Follows T4 (JSONL-first) and T2 (source of truth + generated views). Each artifact independently ... |
| D78 | Safety and redundancy for planning artifacts | Option B+C: Git commits at every batch (primary). Tagged commits at 4 checkpoints (canon-checkpoi... | Multiple independent copies. Tagged commits are hard to lose. MCP memory enables cross-session se... |
| D79 | Format optimization — JSONL source + generated MD views | Option A: JSONL files are canonical source (AI-optimized). MD files are generated views (human-op... | T2 applied to our own planning process. Eliminates the dual-maintenance problem. DISCOVERY_RECORD... |
| D80 | Standard for future deep-plans — always full suite | REVISED to always full suite. All ecosystem deep-plans use the complete JSONL artifact structure.... **[USER]** | USER DIRECTIVE: lean heavy-handed. Deep-plan floor is ~15 questions, most ecosystems will exceed ... |
| D81 | Comprehensive audit framework — 26 domains, 4 tiers | 26 audit domains across 4 tiers. Tier 1: Core (5 mechanical checks). Tier 2: Analytical (7 deep a... **[USER]** | USER DIRECTIVE: thorough audits at all levels. Gap analysis + re-research with fresh eyes. Implem... |
| D82 | Audit process — interactive | Interactive, conversational audit at all levels. AI produces analysis, presents in batches, user ... **[USER]** | USER DIRECTIVE: 'interactive as all skill functions should be even if it isn't an actual skill. o... |
| D83 | Audit triggers — multi-level | Plan audits: twice (after DECISIONS.md and after PLAN.md). Implementation audits: at every phase ... | Smaller phase audits catch drift before it compounds. Full-scope confirms everything. Two plan au... |

## Implementation Sequence (21 Steps)

| # | Ecosystem | Target | Effort | Rationale |
|---|-----------|--------|--------|-----------|
| 1 | CANON | L0->L5 | L | Foundation. Tenets, schemas, changelog mechanism (T18). |
| 2 | Skills | L1->L3 | L | Daily tool. Skill-audit canonized. Born-compliant skills for all future work. |
| 3 | Hooks | L3->L4 | M | Enforcement infra. Skill validation gates formalized. |
| 4 | PR Review | L4->L5 | S | CANON pilot. CHECKPOINT: Does framework work? |
| 5 | Docs | L2->L3 | M | Folder structure, placement standards, dependency maps, master lists. Born-co... |
| 6 | Testing | L3->L4 | M | Test infrastructure. Complements hooks. Proper test patterns for all subseque... |
| 7 | Sessions | L1->L3 | M | State management. Cross-cutting infra. Now with skills, hooks, testing, docs ... |
| 8 | TDMS (L2->L3) | L2->L3 | XL-partial | Critical system, first stage. 37 scripts get Zod schemas + monitoring. |
| 9 | Scripts | L2->L3 | L | Script infrastructure standards. Informed by TDMS learnings. |
| 10 | CI/CD | L1->L3 | M | Build/deploy pipelines. Benefits from hooks and testing being standard. |
| 11 | Alerts | L2->L4 | M | Monitoring layer. Benefits from all infra being standardized. |
| 12 | Analytics | L1->L3 | M | Aggregation layer. Builds on alerts + health checker patterns. |
| 13 | Agents | L2->L3 | M | Agent definitions. Benefits from Skills and Hooks. |
| 14 | Audits | L3->L4+L5path | M | All audits are skills. L4 with L5 pathway. Benefits from Skills standardization. |
| 15 | Archival/Rotation | L3->L4 | M | Lifecycle patterns. Benefits from JSONL and schema standards. |
| 16 | TDMS (L3->L4) | L3->L4 | XL-partial | Second stage. Enforcement manifest, testing. |
| 17 | Roadmap & Execution | L2->L3 | L | Hub ecosystem. All input pipelines now standardized. Automated intake. |
| 18 | Frontend/App | L2->L3 | M | App-layer. All process-side connections defined. |
| 19 | Firebase/Backend | L1->L3 | M-L | App-layer. Connection point contracts. |
| 20 | Docs (verification pass) | verification | S | Meta-check: all 18 ecosystems docs consistent? Staleness audit. |
| 21 | TDMS (L4->L5) | L4->L5 | XL-final | Final canonization of the critical system. |

### Checkpoints

- **After #4:** Does CANON framework work? PR Review pilot validates end-to-end.
- **After #7:** Core infrastructure complete. Skills, Hooks, Docs, Testing, Sessions all standardized. Ready for data-heavy ecosystems.
- **After #15:** All process-layer ecosystems standardized. Ready for app-layer.
- **After #21:** Full system overhaul complete. End-of-process audit.

## Ecosystem Assessments

| Ecosystem | Current | Target | Effort | Staging | Decision |
|-----------|---------|--------|--------|---------|----------|
| PR Review | L4 | L5 | S | Direct (L4→L5) | D33 |
| TDMS | L2 | L5 | XL (L2→L5 across 37 scripts with thousands of data entries) | Staged: L2→L3 (Zod+monitoring) → L4 (... | D34 |
| Sessions | L1 | L3 | M | Direct (L1→L3) | D35 |
| Hooks | L3 | L4 | M | Direct (L3→L4) | D36 |
| Skills | L1 | L3 | L (65 skills, each needs ecosystem audit + standardization) | Direct (L1→L3). Skill-audit skill dri... | D37 |
| Alerts | L2 | L4 | M | Staged: L2→L3 (schemas + monitoring) ... | D38 |
| Scripts | L2 | L3 | L (300+ scripts to audit and standardize) | Direct (L2→L3) | D39 |
| Docs | L2 | L3 | M | Direct (L2→L3) | D40 |
| CI/CD | L1 | L3 | M | Staged: L1→L2 (structure + schemas) →... | D41 |
| Analytics | L1 | L3 | M | Staged: L1→L2 (identify + structure a... | D42 |
| Roadmap & Execution | L2 | L3 | L (input pipeline contracts + sprint automation + ROADMAP schema) | Direct (L2→L3). Focus on input pipeli... | D46 |
| Testing | L3 | L4 | M | Direct (L3→L4) | D47 |
| Archival/Rotation | L3 | L4 | M | Direct (L3→L4) | D48 |
| CANON (Ecosystem Zero) | L0 | L5 | L (foundational but well-scoped — CANON defines itself first, D12/D32) | Direct (L0→L5). First ecosystem stand... | D49 |
| Agents | L2 | L3 | M | Direct (L2→L3) | D50 |
| Audits | L3 | L4 | M | Direct (L3→L4) with L5 pathway archit... | D51 |
| Frontend/App | L2 | L3 | M | Direct (L2→L3) with adapted checklist | D52 |
| Firebase/Backend | L1 | L3 | M-L | Staged (L1→L2→L3) | D53 |

## User Directives (38)

1. **roadmap_will_change**: ROADMAP.md will need additions, changes, removals after this process
2. **grand_plan_reassessment**: TDMS Grand Plan needs reassessment — changing many files invalidates existing debt items
3. **state_persistence_standard**: Constant state file saving is a standard here AND repo-wide going forward — to be canonized as rules
4. **capture_all_ideas**: Stream-of-consciousness ideas MUST be captured even if not immediately actionable
5. **canon_is_ecosystem_zero**: CANON is the meta-system/Ecosystem Zero — building block for all others
6. **overlap_management**: Many points of overlap between ecosystems — must not let one supersede another
7. **duplicate_subsystems**: Cross-cutting subsystems exist in multiple ecosystems and need mapping
8. **standardization_is_key**: Duplicate subsystems must follow shared standards
9. **pr_creep_guard**: User has tendency toward 30-50 commit PRs. Wants guardrail mechanism SOON.
10. **lifecycle_management**: User agreed — helps future-proof. Added to cross-cutting subsystems.
11. **jsonl_is_canon**: JSONL is canonical/AI-consumed, MD is human-readable generated from JSONL. Core tenet.
12. **room_for_growth_everywhere**: Nothing not-upgradeable. Ease upgrade process. Room for growth built in everywhere. Things change all the time.
13. **no_superseding_ecosystem**: Primary ownership = maintenance responsibility, not authority. No ecosystem supersedes another.
14. **plan_as_you_go**: Each ecosystem gets its own deep-plan when sequenced. Don't pre-plan all 13 — they'd go stale.
15. **ecosystem_plan_sequencing_matters**: Dependency-wise sequencing between ecosystem plans is important. Discoveries in one plan may feed into another.
16. **mcp_memory_enabled**: enableAllProjectMcpServers flipped to true. Verify memory MCP tools available next session.
17. **interactivity_is_paramount**: Interactivity of utmost importance across everything whenever possible. Skills should be interactive (deep-plan as exemplar), not monologue dumps. Extends beyond skills to all methods/tools where applicable.
18. **dual_environment_is_constraint**: System must work identically on Claude Code Desktop (Linux sandbox) and Windows CLI. Platform-agnostic by default. Node.js over bash. Formalized as tenet T7.
19. **tdms_must_be_l5**: TDMS feeds into everything, MASTER_DEBT has thousands of entries. Too critical to leave below L5. Acknowledged as massive XL effort.
20. **skill_audit_leverage**: Skill-audit skill exists (.claude/skills/skill-audit/) — created Feb 28, 2026. Born from 64-decision audit of deep-plan skill. 10-category interactive framework (intent fidelity, workflow sequencing, I/O quality, decision points, integration surface, guard rails, prompt engineering, scope boundaries, institutional memory, UX). Used on deep-plan (64 decisions → v2 rewrite) and informed skill-creator v2 update. Codifies the behavioral quality standards from those refinements. This is the mechanism for all 65 skills' ecosystem auditing.
21. **planning_is_skill_roadmap_is_system**: Planning is a SKILL (deep-plan, GSD discovery). The SYSTEM is the Roadmap & Execution ecosystem — where work items land, get prioritized, get executed. Multiple avenues feed in. Non-debt input pipelines are the critical missing piece. Must be high in implementation order as a hub ecosystem.
22. **canon_enforcement_must_be_stout**: CANON enforcement must be bidirectional and robust: (1) CANON self-protection — changes gated, validated, migration-scripted. (2) Downstream propagation — all 13 ecosystems notified, migrated, held to new standards. Semver drives blast radius. User directive: 'stout system.'
23. **app_ecosystem_connections_are_key**: For app-layer ecosystems (Frontend/App, Firebase/Backend), planning approach differs from process ecosystems. What matters most are the CONNECTION POINTS between process ecosystems and app layer — testing, health monitoring, and contracts at those boundaries must be solid.
24. **planning_docs_must_evolve**: All planning docs (roadmap, sprints, grand plan, future roadmap) need updating as we move through plans — BOTH for additions of new work AND deletions of completed or deprecated items. Living documents, not static snapshots.
25. **formalize_adaptability**: Formalize the checklist adaptation approach. Rigidity when necessary but ability to adapt to different situations while maintaining order. No ad-hoc exemptions — adaptations are earned through formal justification.
26. **audits_l5_pathway**: Audits ecosystem must have L5 pathway designed in from the start at L4, not bolted on later. Architecture for L5 readiness is part of the L4 work.
27. **batch_6_skills_elevation**: Skills must be high in Wave 2 — it's a main tool and touches many systems (user override)
28. **batch_6_parallel_bounded**: Parallel is OK but not too much — not ecosystems that could affect another or lose lessons learned
29. **batch_6_wave_proposal_needed**: User wants to see concrete wave proposal with parallel groupings before committing to D62
30. **changelog_is_tenet**: Changelogs must be standardized JSONL and a tenet of at least this system overhaul. Cross-ecosystem impact tracking at every step. Formalized as T18.
31. **research_parallelization**: User likes research overlap as productivity bridge — research ecosystem N+1 while implementing ecosystem N. Approved approach.
32. **docs_at_position_5**: User wants Docs at #5 in the sequence — not buried at #16. Folder structure, file placement standards, document dependencies, master lists need to be established early. Too much content to defer.
33. **sequential_over_parallel**: User questioning whether parallel tracks are truly right or just time-saving. Learning transfer and cross-ecosystem overlap make sequential the better philosophy.
34. **every_change_has_ripple**: User insight: overlap is inevitable everywhere. Change one thing here, have to change another thing there. Changelog becomes invaluable for tracking this.
35. **roadmap_dedupe_on_add**: Each time items are added to ROADMAP (in groupings), run a dedupe against MASTER_DEBT to prevent duplication.
36. **knowledge_base_for_ecosystem_plans**: All prior research forms a knowledge base for every ecosystem deep-plan Phase 0: framework repo, current standards, PR Review v2 patterns, 13 research agent findings, 76+ decisions, 18 tenets, user directives. Excellent starting point.
37. **learning_capture_during_not_after**: Learnings must be captured DURING ecosystem builds, not just between them. Any approach that delays learning capture to checkpoint boundaries is a non-starter. Changelog (T18) is the continuous mechanism. CANON versions are batched formalization.
38. **grand_plan_reassessment_is_task**: TDMS Grand Plan reassessment is an explicit task at position #8 with lightweight pre-checks before each ecosystem #1-#7.

## Captured Ideas (45)

1. ROADMAP entries will change significantly post-standardization
2. Grand Plan debt items may become invalid as files change
3. State persistence should use whatever resources are best
4. Future idea capture mechanism needed
5. Cross-ecosystem subsystem mapping is its own discovery task
6. Canon is Ecosystem Zero — all others derive from it
7. Planning standardization (deep-plan, GSD) as backbone — build from there
8. PR creep guardrail: commit counter hook (warn 10, block 25, override available)
9. Branch scope declaration idea: S/M/L with commit brackets
10. Session-end PR gate: flag if >15 commits not in a PR
11. State saving rules need to be canonized
12. 13 cross-cutting subsystems
13. Configuration as single source of truth vs hardcoded values
14. Per-ecosystem required-vs-optional subsystem mapping needed
15. L5 is north star not exit criteria — most target L3-L4 baseline
16. Upgrade-friendliness as design principle in every component
17. MCP memory as secondary state backup (verify next session)
18. Configure episodic memory for remote sessions (broader benefit beyond this plan)
19. Interactivity-first as a design tenet for all skills and tooling — batch questioning > monologue output
20. Health report dual format (JSON envelope + JSONL findings) could become a general pattern for all ecosystem outputs
21. Core tenets discovery phase should precede schema/structure decisions — tenets guide everything downstream
22. Tenets should be CANON's first artifact (.canon/tenets.jsonl) — CANON defines itself before it defines others
23. CROSS_PLATFORM_SETUP.md is stale — references removed sync script. Needs update when platform-agnostic tenet is implemented
24. Cascade/override (D#5) and progressive disclosure are useful patterns but not tenets — keep as referenced patterns, not principles
25. 17 tenets across 4 categories is the right granularity — specific enough to be actionable, broad enough to be stable
26. Roadmap & Execution ecosystem is the HUB — all other ecosystems feed work items into it. Non-debt pipelines (audit findings → roadmap, deep-plan decisions → roadmap, feature planning → roadmap) are completely missing. T8 violation.
27. Roadmap & Execution needs high implementation priority — if we standardize 13 ecosystems, each generates work items needing automated intake
28. CANON enforcement cascade: version broadcast → health checker detection → migration automation → fail-loud escalation → staggered rollout. Both self-protection and downstream propagation.
29. deep-plan decisions should auto-generate ROADMAP sprint items — manual copying is T8 violation
30. audit-aggregator produces report but nobody places findings into sprints unless human does it — another missing pipeline
31. App-layer ecosystem planning is fundamentally different from process ecosystem planning — connection points between layers are the priority, not internal structure
32. Operational sprint health monitoring items may overlap with ecosystem standardization health monitoring — need reconciliation during sequencing
33. Planning docs (ROADMAP, sprints, grand plan, future roadmap) need continuous updates during plan execution — additions AND deletions of completed/deprecated items
34. Audits L5 pathway should be architecturally designed during L4 work — versioned audit standards, automated regression detection, self-auditing capabilities
35. Checklist adaptation formalization: rigid framework + earned flexibility. Per-ecosystem mapping with required justification for any deviation from the 16-item standard
36. Wave structure allows both parallelism (within waves) and learning transfer (between waves) — hybrid approach
37. TDMS as cross-wave staged effort — each wave advances it one level
38. Skills elevation to Wave 2 creates a heavy wave — may need 2A/2B split or careful parallel tracks
39. Track-CANON in ROADMAP.md as the overhaul's big-picture sequence, with individual items in natural tracks
40. ROADMAP additions should trigger dedupe against MASTER_DEBT to prevent duplicate entries
41. Knowledge base concept: all prior research (framework repo, PR Review v2, research agents, decision logs, standards) form a reusable database for every ecosystem deep-plan Phase 0
42. 3+ sessions without standardization progress should trigger ecosystem health dashboard flag (T8 automation over discipline)
43. Grand Plan pre-checks before each ecosystem: scan changelog for MASTER_DEBT items referencing files about to be modified
44. Changelog extensible-core schema mirrors D22 ecosystem registry pattern — required fields + optional context
45. CANON version trajectory: 0.1.0 → 0.2.0 (checkpoint #4) → 0.3.0 (checkpoint #7) → 0.4.0 (checkpoint #15) → 1.0.0 (checkpoint #21)

## Audit Framework (26 Domains, 4 Tiers)

### Tier 1: Core
- 1. Decision Coverage — every ecosystem assessed, no unresolved questions
- 2. Tenet Alignment — decisions traceable to tenets, no orphans
- 3. Directive Compliance — all user directives addressed
- 4. Sequence Integrity — no dependency gaps, checkpoints defined
- 5. Artifact Completeness — all JSONL, MD, state files exist

### Tier 2: Analytical
- 6. Gap Analysis — plan vs original diagnosis, emerged vs planned, decision-to-delivery gaps
- 7. Re-Research with Fresh Eyes — agents re-examine codebase through lens of completed plan, compare against original findings
- 8. Contradiction Detection — systematic scan for conflicting decisions
- 9. Risk Assessment — per-ecosystem completion risks, dependencies, scope explosion potential
- 10. Cross-Ecosystem Impact Projection — pre-populate expected downstream effects per ecosystem
- 11. Knowledge Base Readiness — is the knowledge base (D75) actually ready for ecosystem #1?
- 12. Rollback Viability — what's the plan if checkpoint #1 reveals CANON is flawed?

### Tier 3: Implementation
*Audits the BUILD itself. Two levels: phase-level (lightweight, frequent) and full-scope (comprehensive, once per ecosystem).*

**Phase-Level (7 domains):**
- I1. Plan Adherence — implementation following the deep-plan? Deviations documented?
- I2. Changelog Discipline — every cross-ecosystem change logged per T18?
- I3. Code Quality — code-reviewer pass, CLAUDE.md patterns, security checklist
- I4. Born-Compliant — new artifacts (skills, hooks, scripts, docs) comply with previously standardized ecosystems?
- I6. Learning Capture — learnings captured DURING build per D76? Insights in changelog?
- I7. Scope Containment — staying within ecosystem boundary? No creep into later ecosystems?
- I8. Test Coverage — new patterns tested? Health checkers pass? Enforcement gates enforcing?
- I10. Documentation Sync — docs updated as implementation proceeds?

**Full-Scope Only (2 additional):**
- I5. Regression Detection — health checkers for ALL completed ecosystems, not just current
- I9. User Directive Satisfaction — ecosystem-specific user directives honored?

### Tier 4: Ecosystem Completion
- 13. Completeness Scorecard — 16-item CANON checklist: completed vs formally deferred with justification
- 14. Integration Verification — new contracts work with previously standardized ecosystems
- 15. Changelog Accuracy — changelog vs git diff cross-reference
- 16. Learning Harvest — what feeds into next ecosystem, what triggers CANON patch

---

*Generated by `scripts/planning/generate-discovery-record.js` from JSONL sources.*
*Source files: decisions.jsonl, tenets.jsonl, directives.jsonl, ideas.jsonl*
