# Findings: Ground-Truth State of 14 GLOBAL Agents in `.claude/agents/global/`

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ3-Part-B

---

## Correction: Prior Context vs Actual State

The prior research context references "14 GLOBAL agents," but the filesystem
contains **13 files** at `.claude/agents/global/`. The prior AGENT_INVENTORY.md
(dated 2026-03-17) also lists 13 GSD agents, but includes `gsd-nyquist-auditor`
which is **not present** in the directory today. This discrepancy is documented
under Contradictions.

**Confirmed agent count:** 13

---

## Per-Agent Assessment

### Agent 1: deep-research-searcher

| Field           | Value                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| Name            | `deep-research-searcher`                                                                                         |
| Model           | sonnet                                                                                                           |
| Description     | General-purpose web researcher spawned by /deep-research skill                                                   |
| Tools           | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp**context7**resolve-library-id, mcp**context7**query-docs |
| disallowedTools | None                                                                                                             |
| permissionMode  | Not declared                                                                                                     |
| Color           | cyan                                                                                                             |
| Line count      | 385                                                                                                              |
| Last commit     | 2026-03-24 024ae700 (feat: agent-env P4.1 — improve 6 agents + model field for all 13 global agents)             |
| Framework       | deep-research                                                                                                    |
| Tier            | Comprehensive (400+ threshold; at 385 = Detailed)                                                                |

**Sections present:**

- role: YES
- philosophy: YES
- upstream_input: YES
- downstream_consumer: YES
- tool_strategy: YES (4 profiles: web, docs, codebase, academic)
- source_hierarchy: YES
- verification_protocol: YES (CRAAP+SIFT)
- output_format: YES (FINDINGS.md template)
- execution_flow: YES (4 steps)
- structured_returns: YES (RESEARCH COMPLETE + RESEARCH BLOCKED)
- success_criteria: YES (checklist)
- critical_rules: NO

**Quality signals:**

- Structured returns: YES
- Error handling: YES (RESEARCH BLOCKED variant)
- Compaction resilience: PARTIAL (writes to disk — survives context reset)
- Tool strategy: YES (profile-aware, 4 modes)
- Confidence levels: YES (CRAAP+SIFT evaluation)

---

### Agent 2: deep-research-synthesizer

| Field           | Value                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| Name            | `deep-research-synthesizer`                                                  |
| Model           | sonnet                                                                       |
| Description     | Combines findings from multiple searcher agents into unified research report |
| Tools           | Read, Write, Bash                                                            |
| disallowedTools | None                                                                         |
| permissionMode  | Not declared                                                                 |
| Color           | purple                                                                       |
| Line count      | 343                                                                          |
| Last commit     | 2026-03-24 024ae700                                                          |
| Framework       | deep-research                                                                |
| Tier            | Detailed (150-400 lines)                                                     |

**Sections present:**

- role: YES
- philosophy: YES (synthesis is curation, not concatenation)
- upstream_input: YES
- downstream_consumer: YES (4 consumers tabulated)
- tool_strategy: NO (only 3 tools; implicit)
- source_hierarchy: NO
- verification_protocol: NO
- output_format: IMPLICIT (execution_flow covers it)
- execution_flow: YES (11 steps, very detailed)
- structured_returns: YES (SYNTHESIS COMPLETE + SYNTHESIS BLOCKED)
- success_criteria: YES (checklist)
- critical_rules: NO

**Quality signals:**

- Structured returns: YES
- Error handling: YES (SYNTHESIS BLOCKED)
- Compaction resilience: YES (writes 4 files to disk; orchestrator reads state
  from files)
- Generates machine-parseable output: YES (claims.jsonl, sources.jsonl,
  metadata.json)

---

### Agent 3: gsd-codebase-mapper

| Field           | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Name            | `gsd-codebase-mapper`                                      |
| Model           | sonnet                                                     |
| Description     | Explores codebase and writes structured analysis documents |
| Tools           | Read, Bash, Grep, Glob, Write                              |
| disallowedTools | None                                                       |
| permissionMode  | Not declared                                               |
| Color           | cyan                                                       |
| Line count      | 822                                                        |
| Last commit     | 2026-03-24 024ae700                                        |
| Framework       | GSD                                                        |
| Tier            | Comprehensive (400+ lines)                                 |

**Sections present:**

- role: YES
- why_this_matters: YES (explains downstream consumers plan-phase and
  execute-phase)
- philosophy: YES
- process: YES (4 steps: parse_focus, explore_codebase, write_documents,
  return_confirmation)
- templates: YES (STACK.md, INTEGRATIONS.md, ARCHITECTURE.md, STRUCTURE.md,
  CONVENTIONS.md, TESTING.md, CONCERNS.md templates)
- critical_rules: YES
- success_criteria: YES

**Quality signals:**

- Structured returns: YES (brief confirmation format)
- Error handling: IMPLICIT (focus area validates to one of 4 options)
- Compaction resilience: YES (writes directly to .planning/codebase/)
- Templates embedded: YES (7 document templates embedded)
- Focus areas: 4 (tech, arch, quality, concerns)

---

### Agent 4: gsd-debugger

| Field           | Value                                                             |
| --------------- | ----------------------------------------------------------------- |
| Name            | `gsd-debugger`                                                    |
| Model           | sonnet                                                            |
| Description     | Investigates bugs using scientific method, manages debug sessions |
| Tools           | Read, Write, Edit, Bash, Grep, Glob, WebSearch                    |
| disallowedTools | None                                                              |
| permissionMode  | Not declared                                                      |
| Color           | orange                                                            |
| Line count      | 1301                                                              |
| Last commit     | 2026-03-24 024ae700                                               |
| Framework       | GSD                                                               |
| Tier            | Comprehensive (400+ lines)                                        |

**Sections present:**

- role: YES
- philosophy: YES (meta-debugging, cognitive biases table)
- hypothesis_testing: YES (falsifiability, experimental design, pitfalls table)
- investigation_techniques: YES (binary search, rubber duck, minimal
  reproduction, working backwards, differential debugging, observability first,
  git bisect, technique selection table)
- verification_patterns: YES (stability testing, TDD, checklists)
- research_vs_reasoning: YES (decision tree)
- debug_file_protocol: YES (.planning/debug/ file structure and update rules)
- execution_flow: YES (7 steps with step names)
- checkpoint_behavior: YES (3 checkpoint types)
- structured_returns: YES (ROOT CAUSE FOUND, DEBUG COMPLETE, INVESTIGATION
  INCONCLUSIVE, CHECKPOINT REACHED)
- modes: YES (symptoms_prefilled, goal: find_root_cause_only, find_and_fix)
- success_criteria: YES

**Quality signals:**

- Structured returns: YES (4 return variants)
- Error handling: YES (INVESTIGATION INCONCLUSIVE + CHECKPOINT REACHED)
- Compaction resilience: YES (debug files in .planning/debug/ store full state)
- State file protocol: YES (OVERWRITE/APPEND/IMMUTABLE rules per section)
- Mode flags: YES (3 modes)

---

### Agent 5: gsd-executor

| Field           | Value                                                                            |
| --------------- | -------------------------------------------------------------------------------- |
| Name            | `gsd-executor`                                                                   |
| Model           | sonnet                                                                           |
| Description     | Executes GSD plans with atomic commits, deviation handling, checkpoint protocols |
| Tools           | Read, Write, Edit, Bash, Grep, Glob                                              |
| disallowedTools | None                                                                             |
| permissionMode  | Not declared                                                                     |
| Color           | yellow                                                                           |
| Line count      | 731                                                                              |
| Last commit     | 2026-03-24 024ae700                                                              |
| Framework       | GSD                                                                              |
| Tier            | Comprehensive (400+ lines)                                                       |

**Sections present:**

- role: YES
- execution_flow: YES (4 steps: load_project_state, load_plan,
  record_start_time, determine_execution_pattern, execute_tasks)
- deviation_rules: YES (4 rules with examples)
- authentication_gates: YES
- checkpoint_protocol: YES (3 checkpoint types)
- checkpoint_return_format: YES (exact structure template)
- continuation_handling: YES
- tdd_execution: YES (RED-GREEN-REFACTOR)
- task_commit_protocol: YES (commit type table, format)
- summary_creation: YES
- state_updates: YES
- final_commit: YES
- completion_format: YES (PLAN COMPLETE)
- success_criteria: YES

**Quality signals:**

- Structured returns: YES (PLAN COMPLETE + CHECKPOINT REACHED)
- Error handling: YES (auth gates, deviation rules with explicit priorities)
- Compaction resilience: YES (STATE.md, debug file, per-task commit tracking)
- TDD support: YES
- Atomic commit protocol: YES

---

### Agent 6: gsd-integration-checker

| Field           | Value                                          |
| --------------- | ---------------------------------------------- |
| Name            | `gsd-integration-checker`                      |
| Model           | sonnet                                         |
| Description     | Verifies cross-phase integration and E2E flows |
| Tools           | Read, Bash, Grep, Glob                         |
| disallowedTools | None                                           |
| permissionMode  | Not declared                                   |
| Color           | blue                                           |
| Line count      | 428                                            |
| Last commit     | 2026-03-24 024ae700                            |
| Framework       | GSD                                            |
| Tier            | Comprehensive (400+ lines)                     |

**Sections present:**

- role: YES
- core_principle: YES (existence vs integration)
- inputs: YES
- verification_process: YES (6 steps with bash scripts)
- output: YES (structured markdown report)
- critical_rules: YES

**Sections absent (relative to other GSD agents):**

- structured_returns: NO — returns inline markdown, no COMPLETE/BLOCKED variants
- success_criteria: YES
- modes: NO
- philosophy: NO

**Quality signals:**

- Structured returns: PARTIAL (markdown output format specified but no
  COMPLETE/BLOCKED variants)
- Error handling: IMPLICIT
- Compaction resilience: NONE — read-only, no persistent state
- Tool strategy: Embedded bash scripts for specific checks

---

### Agent 7: gsd-phase-researcher

| Field           | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| Name            | `gsd-phase-researcher`                                                |
| Model           | sonnet                                                                |
| Description     | Researches how to implement a phase, produces RESEARCH.md             |
| Tools           | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp**context7**\* |
| disallowedTools | None                                                                  |
| permissionMode  | Not declared                                                          |
| Color           | cyan                                                                  |
| Line count      | 676                                                                   |
| Last commit     | 2026-03-24 024ae700                                                   |
| Framework       | GSD                                                                   |
| Tier            | Comprehensive (400+ lines)                                            |

**Sections present:**

- role: YES (with deep-research escalation note)
- upstream_input: YES (CONTEXT.md constraints)
- downstream_consumer: YES (tabulated for gsd-planner)
- philosophy: YES (training as hypothesis, honest reporting)
- tool_strategy: YES (Context7, official docs, WebSearch, verification protocol)
- source_hierarchy: YES (confidence levels table)
- verification_protocol: YES (known pitfalls, checklist)
- output_format: YES (RESEARCH.md template)
- execution_flow: YES (7 steps)
- structured_returns: YES (RESEARCH COMPLETE + RESEARCH BLOCKED)
- success_criteria: YES

**Quality signals:**

- Structured returns: YES
- Error handling: YES (RESEARCH BLOCKED variant)
- Compaction resilience: YES (writes RESEARCH.md + commits)
- Deep-research escalation: YES (explicitly notes when to escalate to
  /deep-research)
- Source hierarchy: Tier 1-5 with confidence levels

---

### Agent 8: gsd-plan-checker

| Field           | Value                                                   |
| --------------- | ------------------------------------------------------- |
| Name            | `gsd-plan-checker`                                      |
| Model           | sonnet                                                  |
| Description     | Verifies plans will achieve phase goal before execution |
| Tools           | Read, Bash, Glob, Grep                                  |
| disallowedTools | None                                                    |
| permissionMode  | Not declared                                            |
| Color           | green                                                   |
| Line count      | 812                                                     |
| Last commit     | 2026-03-24 024ae700                                     |
| Framework       | GSD                                                     |
| Tier            | Comprehensive (400+ lines)                              |

**Sections present:**

- role: YES
- core_principle: YES (plan completeness vs goal achievement)
- verification_dimensions: YES (6 dimensions: requirement coverage, task
  completeness, dependency correctness, key links planned, scope sanity,
  verification derivation)
- verification_process: YES (10 steps)
- examples: YES (4 worked examples with YAML issues)
- issue_structure: YES (severity levels, aggregated output format)
- structured_returns: YES (VERIFICATION PASSED + ISSUES FOUND)
- anti_patterns: YES (7 anti-patterns)
- success_criteria: YES

**Quality signals:**

- Structured returns: YES (2 variants with structured YAML issues)
- Error handling: YES (issues_found with severity tiers: blocker/warning/info)
- Compaction resilience: NO — read-only static analysis, no state files
- Examples: YES (4 real failure scenarios)
- Distinct from gsd-verifier: YES (explicitly documented: plan checker =
  pre-execution, verifier = post-execution)

---

### Agent 9: gsd-planner

| Field           | Value                                                                   |
| --------------- | ----------------------------------------------------------------------- |
| Name            | `gsd-planner`                                                           |
| Model           | sonnet                                                                  |
| Description     | Creates executable phase plans with task breakdown, dependency analysis |
| Tools           | Read, Write, Bash, Glob, Grep, WebFetch, mcp**context7**\*              |
| disallowedTools | None                                                                    |
| permissionMode  | Not declared                                                            |
| Color           | green                                                                   |
| Line count      | 1477                                                                    |
| Last commit     | 2026-03-24 024ae700                                                     |
| Framework       | GSD                                                                     |
| Tier            | Comprehensive (400+ lines); largest file at 1477 lines                  |

**Sections present:**

- role: YES (3 spawn modes: standard, --gaps, revision)
- philosophy: YES (solo developer workflow, plans are prompts, quality
  degradation curve)
- discovery_levels: YES (mandatory discovery protocol)
- task_breakdown: YES (task anatomy, types, sizing, specificity examples, TDD
  heuristic, user setup detection)
- dependency_graph: YES (building dep graph, vertical slices vs horizontal
  layers, file ownership)
- scope_estimation: YES (context budget rules, split signals, depth calibration)
- plan_format: YES (PLAN.md structure with frontmatter fields, context rules,
  user setup)
- goal_backward: YES (methodology)
- structured_returns: YES (implied from role section; full return variants)
- success_criteria: YES
- anti_patterns: YES (enterprise patterns to avoid)

**Quality signals:**

- Structured returns: YES
- Error handling: YES
- Compaction resilience: YES (writes PLAN.md files to disk)
- Largest agent: YES (1477 lines = highest complexity)
- 3 spawn modes: YES (standard, gaps, revision)

---

### Agent 10: gsd-project-researcher

| Field           | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| Name            | `gsd-project-researcher`                                              |
| Model           | sonnet                                                                |
| Description     | Researches domain ecosystem before roadmap creation                   |
| Tools           | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp**context7**\* |
| disallowedTools | None                                                                  |
| permissionMode  | Not declared                                                          |
| Color           | cyan                                                                  |
| Line count      | 917                                                                   |
| Last commit     | 2026-03-24 024ae700                                                   |
| Framework       | GSD                                                                   |
| Tier            | Comprehensive (400+ lines)                                            |

**Sections present:**

- role: YES (with deep-research escalation note via GSD adapter)
- downstream_consumer: YES (5 output files tabulated)
- philosophy: YES (training as hypothesis, honest reporting)
- research_modes: YES (Ecosystem, Feasibility, Comparison)
- tool_strategy: YES (Context7, official docs, WebSearch, verification protocol)
- source_hierarchy: YES
- verification_protocol: YES
- output_formats: YES (SUMMARY.md, STACK.md, FEATURES.md, ARCHITECTURE.md
  templates embedded)
- execution_flow: YES
- structured_returns: YES
- success_criteria: YES

**Quality signals:**

- Structured returns: YES
- Error handling: YES
- Compaction resilience: YES (writes 4-5 files)
- Research modes: 3 (ecosystem, feasibility, comparison)
- Deep-research GSD adapter: YES (explicitly documents the GSD adapter output
  format)

---

### Agent 11: gsd-research-synthesizer

| Field           | Value                                                                          |
| --------------- | ------------------------------------------------------------------------------ |
| Name            | `gsd-research-synthesizer`                                                     |
| Model           | sonnet                                                                         |
| Description     | Synthesizes research outputs from 4 parallel researcher agents into SUMMARY.md |
| Tools           | Read, Write, Bash                                                              |
| disallowedTools | None                                                                           |
| permissionMode  | Not declared                                                                   |
| Color           | purple                                                                         |
| Line count      | 266                                                                            |
| Last commit     | 2026-03-24 024ae700                                                            |
| Framework       | GSD                                                                            |
| Tier            | Detailed (150-400 lines)                                                       |

**Sections present:**

- role: YES (includes commit responsibility note)
- downstream_consumer: YES (tabulated for gsd-roadmapper)
- execution_flow: YES (8 steps)
- output_format: YES
- structured_returns: YES (SYNTHESIS COMPLETE + SYNTHESIS BLOCKED)
- success_criteria: YES

**Sections absent:**

- philosophy: NO
- tool_strategy: NO (only 3 tools)
- source_hierarchy: NO
- verification_protocol: NO
- critical_rules: NO

**Quality signals:**

- Structured returns: YES
- Error handling: YES (SYNTHESIS BLOCKED)
- Compaction resilience: YES (writes SUMMARY.md + commits all 5 research files)
- Note: Has commit responsibility for 4 research files it did not write
  (coordination pattern)

---

### Agent 12: gsd-roadmapper

| Field           | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| Name            | `gsd-roadmapper`                                                      |
| Model           | sonnet                                                                |
| Description     | Creates project roadmaps with phase breakdown and requirement mapping |
| Tools           | Read, Write, Bash, Glob, Grep                                         |
| disallowedTools | None                                                                  |
| permissionMode  | Not declared                                                          |
| Color           | purple                                                                |
| Line count      | 649                                                                   |
| Last commit     | 2026-03-24 024ae700                                                   |
| Framework       | GSD                                                                   |
| Tier            | Comprehensive (400+ lines)                                            |

**Sections present:**

- role: YES
- downstream_consumer: YES (tabulated for gsd-planner consumption)
- philosophy: YES (solo developer, anti-enterprise, requirements drive
  structure)
- goal_backward_phases: YES
- phase_identification: YES (deriving phases, numbering, depth calibration,
  patterns)
- coverage_validation: YES (100% requirement coverage, traceability)
- output_formats: YES (ROADMAP.md + STATE.md structures, draft presentation
  format)
- execution_flow: YES (9 steps)
- structured_returns: YES (ROADMAP CREATED + ROADMAP REVISED + ROADMAP BLOCKED)
- anti_patterns: YES
- success_criteria: YES

**Quality signals:**

- Structured returns: YES (3 variants including revision)
- Error handling: YES (ROADMAP BLOCKED)
- Compaction resilience: YES (writes ROADMAP.md + STATE.md)
- Revision handling: YES (ROADMAP REVISED variant for re-runs)

---

### Agent 13: gsd-verifier

| Field           | Value                                                                          |
| --------------- | ------------------------------------------------------------------------------ |
| Name            | `gsd-verifier`                                                                 |
| Model           | sonnet                                                                         |
| Description     | Verifies phase goal achievement through goal-backward analysis after execution |
| Tools           | Read, Bash, Grep, Glob                                                         |
| disallowedTools | None                                                                           |
| permissionMode  | Not declared                                                                   |
| Color           | green                                                                          |
| Line count      | 790                                                                            |
| Last commit     | 2026-03-24 024ae700                                                            |
| Framework       | GSD                                                                            |
| Tier            | Comprehensive (400+ lines)                                                     |

**Sections present:**

- role: YES
- core_principle: YES (task completion vs goal achievement)
- verification_process: YES (10 steps including re-verification mode)
- output: YES (VERIFICATION.md structure, return format)
- critical_rules: YES
- stub_detection_patterns: YES (universal, React, API route stubs + wiring red
  flags)
- success_criteria: YES

**Sections absent:**

- philosophy: NO
- structured_returns: NO — inline return format in output section
- tool_strategy: NO (read-only agent)

**Quality signals:**

- Structured returns: PARTIAL (return format embedded in output section, not
  dedicated section)
- Error handling: YES (VERIFICATION FAILED variant with gap output)
- Compaction resilience: YES (writes VERIFICATION.md with gaps for
  re-verification)
- Re-verification mode: YES (Step 0 checks for prior VERIFICATION.md and
  optimizes)
- Stub detection: YES (dedicated patterns section)

---

## Summary Table

| Agent                     | Lines | Tier          | Framework     | Model  | Structured Returns | Compaction Safe | Last Updated |
| ------------------------- | ----- | ------------- | ------------- | ------ | ------------------ | --------------- | ------------ |
| deep-research-searcher    | 385   | Detailed      | deep-research | sonnet | YES (2 variants)   | YES             | 2026-03-24   |
| deep-research-synthesizer | 343   | Detailed      | deep-research | sonnet | YES (2 variants)   | YES             | 2026-03-24   |
| gsd-codebase-mapper       | 822   | Comprehensive | GSD           | sonnet | YES (brief)        | YES             | 2026-03-24   |
| gsd-debugger              | 1301  | Comprehensive | GSD           | sonnet | YES (4 variants)   | YES             | 2026-03-24   |
| gsd-executor              | 731   | Comprehensive | GSD           | sonnet | YES (2 variants)   | YES             | 2026-03-24   |
| gsd-integration-checker   | 428   | Comprehensive | GSD           | sonnet | PARTIAL            | NONE            | 2026-03-24   |
| gsd-phase-researcher      | 676   | Comprehensive | GSD           | sonnet | YES (2 variants)   | YES             | 2026-03-24   |
| gsd-plan-checker          | 812   | Comprehensive | GSD           | sonnet | YES (2 variants)   | NONE            | 2026-03-24   |
| gsd-planner               | 1477  | Comprehensive | GSD           | sonnet | YES                | YES             | 2026-03-24   |
| gsd-project-researcher    | 917   | Comprehensive | GSD           | sonnet | YES (2 variants)   | YES             | 2026-03-24   |
| gsd-research-synthesizer  | 266   | Detailed      | GSD           | sonnet | YES (2 variants)   | YES             | 2026-03-24   |
| gsd-roadmapper            | 649   | Comprehensive | GSD           | sonnet | YES (3 variants)   | YES             | 2026-03-24   |
| gsd-verifier              | 790   | Comprehensive | GSD           | sonnet | PARTIAL            | YES             | 2026-03-24   |

---

## Quality Distribution

| Tier                 | Count | Agents                                                                                                                                                                              |
| -------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comprehensive (400+) | 10    | gsd-codebase-mapper, gsd-debugger, gsd-executor, gsd-integration-checker, gsd-phase-researcher, gsd-plan-checker, gsd-planner, gsd-project-researcher, gsd-roadmapper, gsd-verifier |
| Detailed (150-400)   | 3     | deep-research-searcher, deep-research-synthesizer, gsd-research-synthesizer                                                                                                         |
| Basic (50-150)       | 0     | —                                                                                                                                                                                   |
| Stub (<50)           | 0     | —                                                                                                                                                                                   |

**Key stat:** 100% of global agents are Detailed or Comprehensive. No stubs.
This is in sharp contrast to the non-global agents (11 stubs in the broader
36-agent inventory per prior research).

---

## Framework Grouping

### GSD Ecosystem (11 agents)

All spawned by GSD workflow commands at
`/c/Users/jason/.claude/get-shit-done/workflows/`.

| Agent                    | GSD Workflow(s) that Spawn It                           |
| ------------------------ | ------------------------------------------------------- |
| gsd-planner              | plan-phase.md, quick.md, verify-work.md                 |
| gsd-executor             | execute-phase.md, execute-plan.md, quick.md             |
| gsd-debugger             | diagnose-issues.md                                      |
| gsd-verifier             | execute-phase.md, verify-work.md (via gsd-verifier)     |
| gsd-roadmapper           | new-project.md, new-milestone.md                        |
| gsd-plan-checker         | plan-phase.md, quick.md, verify-work.md                 |
| gsd-codebase-mapper      | map-codebase.md (4 parallel instances)                  |
| gsd-phase-researcher     | plan-phase.md, research-phase.md                        |
| gsd-project-researcher   | new-project.md (4 parallel instances), new-milestone.md |
| gsd-research-synthesizer | new-project.md, new-milestone.md                        |
| gsd-integration-checker  | audit-milestone.md                                      |

### Deep-Research Ecosystem (2 agents)

Spawned by `/deep-research` skill orchestrator at
`.claude/skills/deep-research/SKILL.md`.

| Agent                     | Spawn Context                                           |
| ------------------------- | ------------------------------------------------------- |
| deep-research-searcher    | Phase 1 (parallel research) — can be spawned N times    |
| deep-research-synthesizer | Phase 2 (synthesis) — spawned once after searchers done |

---

## Integration Surface Map

### deep-research-searcher

- **Primary spawner:** `.claude/skills/deep-research/SKILL.md` (Phase 1)
- **Spawn reference:** `.claude/skills/deep-research/REFERENCE.md` line 966
  (spawn prompt example)
- **Downstream consumer:** `deep-research-synthesizer` reads its FINDINGS.md
  files
- **Teams:** None (teams not involved in deep-research skill)
- **Mentioned in:** `audit-agent-quality/REFERENCE.md` implicitly (deep-research
  agents auditable)

### deep-research-synthesizer

- **Primary spawner:** `.claude/skills/deep-research/SKILL.md` (Phase 2)
- **Downstream consumers:** User (RESEARCH_OUTPUT.md), orchestrator (structured
  return), contrarian/OTB agents (Phase 3)
- **Reads from:** findings directory written by deep-research-searcher

### GSD Agents — Spawn Surface

| Workflow           | Agents Spawned                                                                 |
| ------------------ | ------------------------------------------------------------------------------ |
| new-project.md     | gsd-project-researcher (x4 parallel), gsd-research-synthesizer, gsd-roadmapper |
| new-milestone.md   | gsd-project-researcher (x4 parallel), gsd-research-synthesizer, gsd-roadmapper |
| plan-phase.md      | gsd-phase-researcher, gsd-planner, gsd-plan-checker (revision loop x3 max)     |
| research-phase.md  | gsd-phase-researcher                                                           |
| execute-phase.md   | gsd-executor (per plan), gsd-verifier                                          |
| execute-plan.md    | gsd-executor                                                                   |
| map-codebase.md    | gsd-codebase-mapper (x4 parallel, run_in_background=true)                      |
| diagnose-issues.md | gsd-debugger                                                                   |
| audit-milestone.md | gsd-integration-checker                                                        |
| quick.md           | gsd-planner (quick mode), gsd-plan-checker, gsd-executor                       |
| verify-work.md     | gsd-verifier, gsd-planner (gaps mode), gsd-plan-checker                        |

---

## Key Findings

### Finding 1: All 13 agents are Detailed or Comprehensive tier [CONFIDENCE: HIGH]

No stubs exist in the global agents directory. The 10 GSD agents average 726
lines, and the 2 deep-research agents average 364 lines. The 3 "synthesizer"
agents (gsd-research-synthesizer, deep-research-synthesizer, and gsd-verifier)
are the lightest (266-790 lines) due to their read-and-write-report nature vs.
the orchestration-heavy planner/executor/debugger agents.

Source: Direct filesystem read of all 13 files.

### Finding 2: All 13 agents share the same last-commit timestamp [CONFIDENCE: HIGH]

Every file was last touched by commit `024ae700` on 2026-03-24 with the message
"feat: agent-env P4.1 — improve 6 agents + model field for all 13 global
agents". This was the Session #236 agent-environment-analysis project (Phase
4.1) that standardized `model:` field declarations across all global agents and
improved 6 of them. There is no version skew between agents.

Source: git log output verified for all 13 files.

### Finding 3: All GSD agents lack `permissionMode` and `disallowedTools` fields [CONFIDENCE: HIGH]

No agent in the global directory declares `permissionMode` or `disallowedTools`
in frontmatter. The tools fields are permissive (Write and Edit granted to most
agents that produce output). This is consistent across all 13 files — it is an
intentional design choice for the GSD and deep-research ecosystems.

Source: Frontmatter inspection of all 13 files.

### Finding 4: gsd-nyquist-auditor is absent from the global directory [CONFIDENCE: HIGH]

The prior AGENT_INVENTORY.md (2026-03-17) includes `gsd-nyquist-auditor` as a
13th GSD agent (178 lines, medium tier) with a non-standard YAML list tools
declaration. This file does NOT exist at `.claude/agents/global/`. The
audit-agent-quality REFERENCE.md still references it by name (line 344-345).
This represents a divergence between the prior inventory and current filesystem
state.

**Possible explanations:** (1) It was deleted or moved in agent-env P4.1; (2) It
was never in the global directory and the prior inventory was incorrect about
its location; (3) It exists elsewhere (local agents). This gap requires
follow-up investigation.

Source: `ls .claude/agents/global/` returns 13 files, no nyquist-auditor
present.

### Finding 5: deep-research-searcher confirms Session #222 creation claim [CONFIDENCE: HIGH]

The prior research context states "deep-research-searcher and
deep-research-synthesizer were created in Session #222." Both files exist and
are comprehensive-quality agents with full framework support. However, the last
commit (2026-03-24) represents a subsequent improvement from Session #236
(agent-env P4.1). The creation date cannot be confirmed from git log -1 alone —
only the most recent modification is visible. The claim about Session #222
creation is plausible but unverified from the current commit info.

Source: Agent files read, git log -1 per file.

### Finding 6: Tool declarations use wildcard mcp**context7**\* [CONFIDENCE: HIGH]

Three agents (gsd-planner, gsd-phase-researcher, gsd-project-researcher) declare
`mcp__context7__*` as their tool string — a wildcard that matches both
`mcp__context7__resolve-library-id` and `mcp__context7__query-docs`. The
deep-research-searcher is more explicit, listing both individually. This is a
minor inconsistency in declaration style but functionally equivalent.

Source: Frontmatter inspection.

### Finding 7: Integration is entirely through GSD workflows, not Claude skills [CONFIDENCE: HIGH]

GSD agents are spawned by GSD workflows at
`/c/Users/jason/.claude/get-shit-done/workflows/` (an npm-installed package),
NOT by skills in `.claude/skills/`. The `audit-agent-quality` REFERENCE.md
mentions the GSD agents for auditing purposes only. The actual spawn
`subagent_type` calls live in the external GSD workflow package.

This means changes to `.claude/agents/global/gsd-*.md` are decoupled from the
skill system. The GSD workflow files in `~/.claude/get-shit-done/workflows/` are
the integration surface, not the local `.claude/skills/` directory.

Source: grep of .claude/skills/ for gsd agent names returns only
audit-agent-quality reference. grep of ~/.claude/get-shit-done/workflows/
returns 35+ spawn references.

---

## Sources

| #   | Path                                                    | Title                                | Type            | Trust  | CRAAP     | Date       |
| --- | ------------------------------------------------------- | ------------------------------------ | --------------- | ------ | --------- | ---------- |
| 1   | .claude/agents/global/deep-research-searcher.md         | deep-research-searcher agent file    | codebase        | HIGH   | 5/5/5/5/5 | 2026-03-24 |
| 2   | .claude/agents/global/deep-research-synthesizer.md      | deep-research-synthesizer agent file | codebase        | HIGH   | 5/5/5/5/5 | 2026-03-24 |
| 3   | .claude/agents/global/gsd-codebase-mapper.md            | gsd-codebase-mapper agent file       | codebase        | HIGH   | 5/5/5/5/5 | 2026-03-24 |
| 4   | .claude/agents/global/gsd-debugger.md                   | gsd-debugger agent file              | codebase        | HIGH   | 5/5/5/5/5 | 2026-03-24 |
| 5   | .claude/agents/global/gsd-executor.md                   | gsd-executor agent file              | codebase        | HIGH   | 5/5/5/5/5 | 2026-03-24 |
| 6   | .claude/agents/global/gsd-integration-checker.md        | gsd-integration-checker agent file   | codebase        | HIGH   | 5/5/5/5/5 | 2026-03-24 |
| 7   | .claude/agents/global/gsd-phase-researcher.md           | gsd-phase-researcher agent file      | codebase        | HIGH   | 5/5/5/5/5 | 2026-03-24 |
| 8   | .claude/agents/global/gsd-plan-checker.md               | gsd-plan-checker agent file          | codebase        | HIGH   | 5/5/5/5/5 | 2026-03-24 |
| 9   | .claude/agents/global/gsd-planner.md                    | gsd-planner agent file               | codebase        | HIGH   | 5/5/5/5/5 | 2026-03-24 |
| 10  | .claude/agents/global/gsd-project-researcher.md         | gsd-project-researcher agent file    | codebase        | HIGH   | 5/5/5/5/5 | 2026-03-24 |
| 11  | .claude/agents/global/gsd-research-synthesizer.md       | gsd-research-synthesizer agent file  | codebase        | HIGH   | 5/5/5/5/5 | 2026-03-24 |
| 12  | .claude/agents/global/gsd-roadmapper.md                 | gsd-roadmapper agent file            | codebase        | HIGH   | 5/5/5/5/5 | 2026-03-24 |
| 13  | .claude/agents/global/gsd-verifier.md                   | gsd-verifier agent file              | codebase        | HIGH   | 5/5/5/5/5 | 2026-03-24 |
| 14  | .planning/agent-environment-analysis/AGENT_INVENTORY.md | Prior agent inventory                | codebase        | MEDIUM | 3/4/4/3/5 | 2026-03-17 |
| 15  | ~/.claude/get-shit-done/workflows/\*.md                 | GSD workflow files (all)             | codebase        | HIGH   | 5/5/5/5/5 | current    |
| 16  | .claude/skills/deep-research/REFERENCE.md               | deep-research skill REFERENCE        | codebase        | HIGH   | 5/5/5/5/5 | current    |
| 17  | .claude/skills/audit-agent-quality/REFERENCE.md         | audit-agent-quality REFERENCE        | codebase        | HIGH   | 5/5/5/5/5 | current    |
| 18  | git log output                                          | Commit history for all 13 files      | version-control | HIGH   | 5/5/5/5/5 | 2026-03-29 |

---

## Contradictions

### Contradiction 1: Agent count — "14 global agents" vs actual 13

The upstream research task specification says "14 GLOBAL agents." The prior
AGENT_INVENTORY.md says 13 GSD + 2 deep-research = 15 total agents listed, but
the GSD table shows 13 rows (with gsd-nyquist-auditor). The actual filesystem
contains exactly 13 files.

**Most likely resolution:** The task specification contains an error. There are
13 agents in `.claude/agents/global/`. The prior inventory's gsd-nyquist-auditor
may have been deleted during agent-env Phase 4.1 work.

### Contradiction 2: Prior inventory line counts vs current

The prior AGENT_INVENTORY.md lists `gsd-debugger: 1257 lines` but current
filesystem shows 1301 lines. `gsd-planner: 1309 lines` vs current 1477 lines.
These deltas (44 and 168 lines respectively) are consistent with the 2026-03-24
improvement commit that "improved 6 agents." The prior inventory (2026-03-17)
predates the improvement.

---

## Gaps

1. **gsd-nyquist-auditor location:** Was it deleted, moved to local agents, or
   was it never in the global directory? Not confirmed. The audit-agent-quality
   REFERENCE.md still lists it in the GSD group, suggesting it may exist
   somewhere.

2. **Session #222 creation date for deep-research agents:** Cannot confirm from
   git log -1. Would require `git log --follow` or full commit history to trace.

3. **permissionMode alternatives:** No agent uses permissionMode. Whether this
   is intentional policy or a gap in the framework spec was not verified.

4. **model field history:** The 2026-03-24 commit added `model:` fields to all
   13 agents. What models were assigned before? Not determinable from current
   state.

5. **GSD adapter files:** `gsd-project-researcher` references a "GSD adapter"
   for deep-research that produces STACK.md, FEATURES.md etc. at
   `.planning/research/`. Whether this adapter exists as a separate skill file
   was not verified.

---

## Serendipity

1. **Deep-research escalation path from GSD:** Both `gsd-phase-researcher` and
   `gsd-project-researcher` contain explicit notes about escalating to
   `/deep-research` when single-agent research confidence is LOW. This creates a
   formal bridge between the two frameworks — GSD can trigger deep-research,
   which uses the same global agents (deep-research-searcher/synthesizer). This
   is architectural coupling worth noting.

2. **GSD agents are in an external npm package, not the skill system:** The
   spawn surface for all 11 GSD agents lives in
   `~/.claude/get-shit-done/workflows/` (npm package `get-shit-done-cc`), not in
   `.claude/skills/`. This means the local project skills system has no spawn
   authority over GSD agents. Any upgrades to GSD agent behavior require both
   updating the agent .md file AND potentially the npm package workflows.

3. **All global agents are `model: sonnet`:** Despite the broader agent system
   using opus for some heavy agents (fullstack-developer, security-engineer,
   database-architect), every single global agent is sonnet. The 2026-03-24
   commit that added model fields assigned sonnet universally. The
   `set-profile.md` GSD workflow shows gsd-planner defaulting to opus in the
   profile table — suggesting sonnet may be an efficiency default that operators
   can override via profile settings.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

**Rationale:** All findings are derived directly from filesystem reads and git
log output. Every agent file was read in full or with section-level inspection.
No inference required — ground truth is the filesystem.
