# SQ10: How Should the Research & Discovery Standard Integrate with SWS as a CANON Category?

<!-- prettier-ignore-start -->
**Sub-Question:** SQ10
**Status:** COMPLETE
**Date:** 2026-03-24
**Confidence:** HIGH (grounded in extensive SWS artifact analysis)
<!-- prettier-ignore-end -->

---

## 1. What IS a CANON Category in SWS?

### Definition

A CANON "category" is an **ecosystem** -- one of the 18 managed domains within
the System-Wide Standardization (SWS) meta-plan. Each ecosystem represents a
coherent area of the codebase's infrastructure that gets standardized to a
measurable maturity level (L0-L5) using CANON's 16-item checklist framework.

**Key structural facts:**

- CANON itself (Ecosystem Zero) is the meta-system that defines the rules for
  all other ecosystems (Tenet T1: `canon_is_ecosystem_zero`)
- Each ecosystem has a maturity level computed from a concrete 16-item
  checklist, never subjectively assigned (Tenet T3: `maturity_is_measurable`)
- Ecosystems live in `.canon/ecosystems/{id}/` with assessment.jsonl,
  enforcement.jsonl, and contracts/
- The ecosystem registry lives in `.canon/ecosystems.jsonl` (one JSONL line per
  ecosystem)

### Lifecycle

Every ecosystem follows a 4-step standardization process (PLAN-v3.md Section 7):

1. **Deep-plan** -- per-ecosystem discovery + decisions (T13, T19). Consults
   knowledge base. Minimum 5+ design decisions triggers full deep-plan (T23).
2. **Execute** -- implement standardization per deep-plan output. Complete with
   16-item checklist scorecard, health checkers passing, tests passing,
   changelog entries.
3. **Verify** -- `/convergence-loop` on completion claims (T20). Multi-agent,
   multi-angle. Minimum 2 passes.
4. **Declare** -- CANON ecosystem declaration with health checker. File
   assessment in `.canon/ecosystems/{id}/assessment.jsonl`. Activate
   born-compliant gate.

### Maturity Levels (D8)

| Level | Name        | Description                            |
| ----- | ----------- | -------------------------------------- |
| L0    | Nonexistent | No formal structure                    |
| L1    | Identified  | Components recognized but informal     |
| L2    | Structured  | Organized with some conventions        |
| L3    | Monitored   | Health checkers, schemas, testing      |
| L4    | Enforced    | Automated gates, enforcement manifests |
| L5    | Canonized   | Full CANON compliance, reference impl  |

**Confidence: HIGH** -- directly sourced from SWS DECISIONS.md D8, PLAN.md Step
1, and PLAN-v3.md Section 7.

---

## 2. What Existing CANON Artifacts Exist?

### Current State (Pre-Phase 1)

As of Session #237, the `.canon/` directory does **not yet exist**. SWS is in
Wave 1 of plan orchestration (non-SWS plans executing). CANON Foundation (Phase

1. is scheduled for Wave 2 of plan orchestration (Steps 11-13 of the
   orchestrator).

### Planned Structure (.canon/ Directory -- D21, PLAN-v3.md Step 1.1)

```
.canon/
  canon.json                         # CANON meta: version, config
  tenets.jsonl                       # Core tenets (first artifact -- D32)
  tenets.md                          # Generated view
  ecosystems.jsonl                   # Registry (one line per ecosystem)
  changelog.jsonl                    # Cross-ecosystem change log (T18)
  schemas/
    ecosystem-registry.schema.ts     # Zod 4
    assessment.schema.ts             # Zod 4
    enforcement-manifest.schema.ts   # Zod 4
    changelog.schema.ts              # Zod 4
    health-report.schema.ts          # Zod 4
    tenet.schema.ts                  # Zod 4
    directive.schema.ts              # Zod 4
    forward-findings.schema.ts       # Zod 4
  config/
    defaults.json                    # Global defaults
    shadow-append-registry.json      # Sacred JSONL files
    scope-manifests/                 # Per-plan collision detection
    overrides/                       # Per-ecosystem overrides
  reports/                           # Generated dashboards/matrix views
  scripts/
    generate-tenets-md.js            # JSONL -> MD view generator
    generate-ecosystem-matrix.js     # Cross-ecosystem matrix
    validate-canon.js                # Self-validation
    check-canon-health.js            # Health checker
    scan-changelog.js                # TDMS pre-check
  ecosystems/
    {id}/                            # Per-ecosystem dirs
      assessment.jsonl               # Maturity assessment
      enforcement.jsonl              # Enforcement manifest
      contracts/                     # Inter-ecosystem contracts
```

### Pre-CANON Artifacts That Already Exist

These live in `.planning/system-wide-standardization/` and will be the input
material for CANON Phase 1:

- `tenets.jsonl` -- 19+ tenets (T1-T19), to migrate to `.canon/tenets.jsonl`
- `directives.jsonl` -- 41 directives, to migrate to `.canon/` (Q25)
- `decisions.jsonl` -- 92 decisions, stays in `.planning/` (Q25)
- `ideas.jsonl` -- 45 ideas, stays in `.planning/` (Q25)
- `changelog.jsonl` -- stays in `.planning/` (Q25)
- `coordination.json` -- transient state, stays in `.planning/`

### Existing Tenets Relevant to Research & Discovery

| Tenet | Key                        | Relevance to R&D Standard         |
| ----- | -------------------------- | --------------------------------- |
| T19   | extensive_discovery_first  | DIRECTLY about research/discovery |
| T20   | research_convergence_loops | DIRECTLY about research quality   |
| T23   | all_planning_via_deep_plan | Research feeds into planning      |
| T15   | interactivity_first        | Research must be interactive      |
| T22   | honest_findings_only       | Research output quality           |
| T13   | plan_as_you_go             | Discoveries feed forward          |

**Confidence: HIGH** -- sourced from tenets.jsonl, coordination.json, PLAN-v3.md
Step 1.1, and Q25.

---

## 3. How Does a CANON Standard Get Enforced?

### Four Enforcement Layers

SWS defines a tiered enforcement model (D14, D15, D26, D49):

**Layer 1: Pre-commit (fast checks)**

- Schema validation of `.canon/` files
- JSONL → MD sync verification
- Shadow-append protection (Q21 -- source JSONL is append-only)
- Naming compliance

**Layer 2: Pre-push (full validation)**

- Migration script required for breaking schema changes
- All tenet references valid
- Cross-reference integrity

**Layer 3: PR-level (comprehensive)**

- Code-reviewer agent
- Multi-AI review for high-risk PRs (D12)
- Enforcement manifests checked

**Layer 4: Session-level (behavioral)**

- CLAUDE.md rules with `[BEHAVIORAL:]` and `[GATE:]` annotations
- Session-start surfacing of warnings/health data
- `/alerts` skill for proactive monitoring

### Per-Ecosystem Enforcement Manifest

Each ecosystem gets an enforcement manifest at
`.canon/ecosystems/{id}/enforcement.jsonl` with rules that have:

- `tier`: which gate (pre-commit / pre-push / PR)
- `severity`: error (blocking), warning (non-blocking + logged), info, silent

### CANON Self-Protection (D49)

Bidirectional enforcement:

- **Internal**: Pre-commit validates `.canon/` files, tenet changes require
  version bump, no orphaned references
- **Downstream**: Version broadcast, contract enforcement, migration automation,
  fail-loud cascade (T11), semver blast radius

### Behavioral Rules (CLAUDE.md Section 4)

CLAUDE.md contains 14 behavioral guardrails. Some map directly to GATE
enforcement (pre-commit hooks, patterns:check), others are BEHAVIORAL (no
automated enforcement -- rely on AI compliance).

**For the R&D Standard, enforcement would use ALL four layers:**

- Pre-commit: validate research artifact schemas (if JSONL)
- Pre-push: verify research completeness checklists
- Session-level: CLAUDE.md guardrails for research processes
- Skill-level: deep-research and deep-plan skills enforce process internally

**Confidence: HIGH** -- sourced from D14, D15, D26, D49, PLAN-v3.md CANON Phase
3, CLAUDE.md Section 4.

---

## 4. What Categories Does SWS Already Have? Where Does R&D Fit?

### The 18 Existing Ecosystems (D67 Locked Sequence)

| #   | Ecosystem           | Current | Target | Category         |
| --- | ------------------- | ------- | ------ | ---------------- |
| 1   | CANON               | L0      | L5     | Meta             |
| 2   | Skills              | L1      | L3     | Process Tooling  |
| 3   | Hooks               | L3      | L4     | Enforcement      |
| 4   | PR Review           | L4      | L5     | Process (Pilot)  |
| 5   | Docs                | L2      | L3     | Knowledge        |
| 6   | Testing             | L3      | L4     | Quality          |
| 7   | Sessions            | L1      | L3     | State Management |
| 8   | TDMS (Stage 1)      | L2      | L3     | Data             |
| 9   | Scripts             | L2      | L3     | Tooling          |
| 10  | CI/CD               | L1      | L3     | Automation       |
| 11  | Alerts              | L2      | L4     | Monitoring       |
| 12  | Analytics           | L1      | L3     | Monitoring       |
| 13  | Agents              | L2      | L3     | Process Tooling  |
| 14  | Audits              | L3      | L4+    | Quality          |
| 15  | Archival/Rotation   | L3      | L4     | Lifecycle        |
| 16  | TDMS (Stage 2)      | L3      | L4     | Data             |
| 17  | Roadmap & Execution | L2      | L3     | Process Hub      |
| 18  | Frontend/App        | L2      | L3     | App Layer        |
| 19  | Firebase/Backend    | L1      | L3     | App Layer        |
| 20  | Docs (verification) | --      | --     | Meta-check       |
| 21  | TDMS (Stage 3)      | L4      | L5     | Data             |

### Where Research & Discovery Fits

Research & Discovery is **not currently one of the 18 ecosystems**. It would
need to be **added** as a new ecosystem. The closest existing ecosystems are:

- **Skills (#2)** -- deep-research and deep-plan are skills, so their SKILL.md
  files fall under Skills ecosystem standardization
- **Sessions (#7)** -- research happens within sessions
- **Audits (#14)** -- research informs audits, audit findings feed research

However, Research & Discovery has a **distinct identity** that merits its own
ecosystem:

1. It has its own skill infrastructure (deep-research, deep-plan,
   convergence-loop)
2. It has its own artifact pattern (.research/ directories, findings files,
   RESEARCH_OUTPUT.md)
3. It has behavioral standards already defined (T19, T20, CL-PROTOCOL.md)
4. It spans multiple existing ecosystems (skills, agents, sessions, docs)
5. It has its own maturity progression (ad-hoc research -> structured
   multi-agent -> convergence-verified)

### Proposed Position in Sequence

Research & Discovery should be positioned **after Skills (#2) and before or
alongside Agents (#13)** in the sequence, because:

- It depends on Skills being standardized (deep-research, deep-plan are skills)
- It informs how Agents operate (research uses multi-agent patterns)
- It is a cross-cutting concern that benefits from early standardization

However, since the 21-step sequence is locked (D67), adding R&D would require
either:

1. **Inserting it** into the sequence (requires user decision, amends D67)
2. **Folding it into Skills** as a sub-ecosystem (simpler, but may dilute focus)
3. **Adding it as Step 22+** after the current 21 steps (defers it too far)

**Recommendation:** Insert as new ecosystem between Steps 3.1 (Skills) and 3.2
(Hooks) or as a sub-domain of Skills. This is a user decision.

**Confidence: MEDIUM** -- the ecosystem list is well-documented, but R&D's exact
placement requires a user decision on D67 sequence amendment.

---

## 5. What Enforcement Mechanisms Should the R&D Standard Use?

### Proposed Enforcement Stack

| Mechanism           | What It Enforces                                      | Tier       | Severity |
| ------------------- | ----------------------------------------------------- | ---------- | -------- |
| Pre-commit hook     | .research/ artifact schema validation                 | GATE       | warning  |
| Pre-commit hook     | Findings files have required frontmatter              | GATE       | warning  |
| CLAUDE.md guardrail | Must use /deep-research for domain research           | BEHAVIORAL | --       |
| CLAUDE.md guardrail | Must use /deep-plan for non-trivial planning          | BEHAVIORAL | --       |
| CLAUDE.md guardrail | Research requires convergence loops (T20)             | BEHAVIORAL | --       |
| Skill enforcement   | deep-research SKILL.md enforces 5-phase CL process    | SKILL      | blocking |
| Skill enforcement   | deep-plan SKILL.md enforces discovery before planning | SKILL      | blocking |
| CL-PROTOCOL         | Multi-pass verification for plan execution            | PROTOCOL   | blocking |
| Health checker      | Research artifact completeness + staleness detection  | MONITOR    | warning  |
| Born-compliant gate | New research must follow standard after R&D declared  | GATE       | error    |

### What Already Exists vs What Needs Building

**Already exists (needs formalization, not creation):**

- deep-research SKILL.md with 5-phase CL architecture
- deep-plan SKILL.md with discovery-first process
- CL-PROTOCOL.md for plan execution verification
- CLAUDE.md guardrails: T19 (extensive discovery first), T20 (convergence loops)
- .research/ directory convention with findings structure
- Agent allocation formulas in deep-research REFERENCE.md

**Needs building:**

- Zod schemas for research artifacts (findings, RESEARCH_OUTPUT, challenge logs)
- Health checker for research ecosystem
- Enforcement manifest (.canon/ecosystems/research-discovery/enforcement.jsonl)
- Born-compliant gate for new research
- Schema for .research/ directory structure
- Formal inter-ecosystem contracts (R&D <-> Skills, R&D <-> Agents, R&D <->
  Planning)

**Confidence: HIGH** -- enforcement mechanisms are well-defined in SWS (D14,
D15, D26); applying them to R&D is straightforward pattern application.

---

## 6. How Do Other Standards Relate? Peer, Parent, Child?

### Relationship Map

```
CANON (Ecosystem Zero) ── PARENT of all ecosystems
  |
  ├── Skills ── PEER to R&D (R&D skills are skills)
  |     └── deep-research, deep-plan, convergence-loop
  |
  ├── Research & Discovery ── NEW ECOSYSTEM
  |     ├── CONSUMES: Skills (its tools are skills)
  |     ├── CONSUMES: Agents (uses multi-agent patterns)
  |     ├── PRODUCES FOR: All ecosystems (research informs everything)
  |     └── CONTRACTS WITH: Sessions, Docs, Audits
  |
  ├── Agents ── PEER to R&D (agents execute research)
  |
  └── CL-PROTOCOL ── CHILD of R&D
        (verification protocol, adapted from deep-research CL architecture)
```

### CL-PROTOCOL Relationship

CL-PROTOCOL.md is currently stored at
`.planning/plan-orchestration/CL-PROTOCOL.md` and is a plan-execution artifact.
Within a CANON framework:

- CL-PROTOCOL is a **process standard** that implements T20
  (research_convergence_loops) for plan execution contexts
- It is a **child/derivative** of the deep-research skill's 5-phase CL
  architecture
- It should be **owned by R&D ecosystem** but **consumed by** plan
  orchestration, audits, and any ecosystem that needs verification

### CLAUDE.md Relationship

CLAUDE.md is the behavioral rule surface. It is:

- **Not an ecosystem** -- it is cross-cutting infrastructure that SWS itself
  uses but does not own as a separate ecosystem
- The R&D standard would ADD rules to CLAUDE.md (e.g., "use /deep-research for
  research tasks") but not own CLAUDE.md
- Enforcement annotations in CLAUDE.md (`[BEHAVIORAL]`, `[GATE]`) would
  reference the R&D ecosystem

### Tenets Relationship

The R&D standard does not CREATE new tenets -- it IMPLEMENTS existing ones:

- T19 (extensive_discovery_first) -- the core R&D behavioral requirement
- T20 (research_convergence_loops) -- the quality mechanism
- T23 (all_planning_via_deep_plan) -- the planning integration
- T15 (interactivity_first) -- the interaction model
- T22 (honest_findings_only) -- the output quality standard

New tenets would only be needed if R&D standardization discovers gaps not
covered by T1-T24. This is determined during the deep-plan phase for the R&D
ecosystem.

**Confidence: HIGH** -- relationship analysis based on ecosystem boundary rules
(D11, T16) and the contract model (D74, T5).

---

## 7. Registration Process: Making R&D Official in SWS

### Required Steps

To register Research & Discovery as a CANON ecosystem:

**Step A: User Decision on D67 Amendment**

The 21-step sequence is locked (D67). Adding a new ecosystem requires user
approval to amend D67. Options:

1. Insert R&D into Phase 3 sequence (e.g., between Skills and Hooks)
2. Add R&D as a Skills sub-domain (no D67 change needed)
3. Add R&D as Step 22 (extends the sequence)

**Step B: Ecosystem Assessment**

Assess R&D's current maturity using the 16-item checklist (D9):

| #   | Item                      | Current Status                                   |
| --- | ------------------------- | ------------------------------------------------ |
| 1   | Zod schemas               | ABSENT -- no schemas for research artifacts      |
| 2   | JSONL storage             | PARTIAL -- .research/ uses MD, not JSONL         |
| 3   | Generated views           | ABSENT -- no generated views                     |
| 4   | Health monitoring         | ABSENT -- no health checker                      |
| 5   | Enforcement manifest      | ABSENT -- no formal manifest                     |
| 6   | Testing                   | ABSENT -- no tests for research process          |
| 7   | Documentation             | PRESENT -- deep-research SKILL.md + REFERENCE.md |
| 8   | State persistence         | PARTIAL -- .research/ dirs persist, no schema    |
| 9   | Error handling            | PARTIAL -- timeout, scope explosion guards exist |
| 10  | Naming compliance         | PARTIAL -- conventions exist but not formalized  |
| 11  | Configuration             | PARTIAL -- agent allocation in REFERENCE.md      |
| 12  | Lifecycle hooks           | ABSENT -- no formal lifecycle                    |
| 13  | Versioning                | ABSENT -- no schema versioning                   |
| 14  | Inter-ecosystem contracts | ABSENT -- no formal contracts                    |
| 15  | Rollback/recovery         | ABSENT -- no formal rollback                     |
| 16  | Deprecation policy        | ABSENT -- no deprecation policy                  |

**Assessment: L1 (Identified)** -- components exist but are informal. 2 items
PRESENT, 5 PARTIAL, 9 ABSENT.

**Target: L3 (Monitored)** -- schemas, health checker, testing, state
persistence, naming compliance all formalized.

**Step C: Registry Entry**

Add to `.canon/ecosystems.jsonl`:

```json
{"id":"research-discovery","name":"Research & Discovery","current_level":"L1","target_level":"L3","effort":"M","seq_position":TBD,"status":"not_started","owner":"skills+agents","dependencies":["skills"],"decision_ref":"NEW"}
```

**Step D: Deep-Plan**

Run `/deep-plan` for the R&D ecosystem (T13). This produces:

- Design decisions for R&D standardization
- Artifact schemas (findings format, research output format, challenge log)
- Health checker specification
- Enforcement manifest
- Inter-ecosystem contracts
- Exit criteria

**Step E: Execute, Verify, Declare**

Standard 4-step process as defined in PLAN-v3.md Section 7.

**Confidence: MEDIUM-HIGH** -- process is well-defined, but D67 amendment and
sequence position require user decision.

---

## Integration Blueprint

### What the R&D Standard Would Own

1. **Artifacts:** .research/ directory structure, findings format, research
   output format, challenge logs, domain configuration
2. **Skills:** deep-research, deep-plan (lifecycle + quality standards),
   convergence-loop (verification process)
3. **Protocols:** CL-PROTOCOL.md (plan execution verification), research quality
   gates
4. **Health checker:** Research artifact completeness, staleness, quality
   metrics
5. **Enforcement:** Research process compliance (skill usage, CL requirements,
   artifact schemas)

### What the R&D Standard Would NOT Own

1. **Agent infrastructure** -- owned by Agents ecosystem (#13)
2. **Skill metadata/lifecycle** -- owned by Skills ecosystem (#2)
3. **Planning tools** -- owned by Roadmap & Execution ecosystem (#17)
4. **CLAUDE.md rules** -- cross-cutting, not owned by any single ecosystem
5. **Session flow** -- owned by Sessions ecosystem (#7)

### Inter-Ecosystem Contracts

| Contract           | R&D Role | Partner Role | Interface                        |
| ------------------ | -------- | ------------ | -------------------------------- |
| R&D <-> Skills     | Consumer | Provider     | Skill lifecycle, SKILL.md format |
| R&D <-> Agents     | Consumer | Provider     | Agent allocation, team spawning  |
| R&D <-> Sessions   | Producer | Consumer     | Research output in session flow  |
| R&D <-> Docs       | Producer | Consumer     | Research doc standards           |
| R&D <-> Audits     | Peer     | Peer         | Audit findings feed research     |
| R&D <-> Plan Orch. | Producer | Consumer     | CL-PROTOCOL for plan execution   |

---

## Enforcement Plan

### Phase 1: Behavioral (immediate, no CANON infra needed)

These can be added to CLAUDE.md now:

- Mandate /deep-research for domain/technology research
- Mandate /deep-plan for non-trivial planning
- Reference T19, T20, T23 as the governing tenets

**Status:** Partially exists (CLAUDE.md Section 7 already has triggers).

### Phase 2: Skill-Level (during R&D ecosystem deep-plan)

- Formalize deep-research 5-phase CL as the R&D process standard
- Formalize CL-PROTOCOL as the plan verification standard
- Define quality gates within skills (min agent count, convergence criteria)

**Status:** Partially exists (skills have internal enforcement).

### Phase 3: Schema + Health (during R&D ecosystem execution)

- Zod schemas for .research/ artifacts
- Health checker for research ecosystem
- Pre-commit validation of research artifact schemas

**Status:** Not yet built.

### Phase 4: Enforcement Manifest (after R&D at L3)

- Born-compliant gate: new research must follow standard
- Enforcement manifest with tier/severity rules
- CANON Phase 3 integration

**Status:** Not yet built; depends on CANON Phase 1 infrastructure existing.

---

## Confidence Summary

| Finding                          | Confidence  | Basis                                         |
| -------------------------------- | ----------- | --------------------------------------------- |
| CANON ecosystem definition       | HIGH        | D1-D32, PLAN.md, PLAN-v3.md                   |
| Existing artifact structure      | HIGH        | Filesystem verification + PLAN-v3.md Step 1.1 |
| Enforcement mechanism mapping    | HIGH        | D14, D15, D26, D49, CLAUDE.md                 |
| R&D current maturity (L1)        | HIGH        | 16-item checklist against actual codebase     |
| Sequence position recommendation | MEDIUM      | D67 is locked; user decision required         |
| Inter-ecosystem contracts        | MEDIUM-HIGH | D74, T5, T16 define the model; specifics TBD  |
| Enforcement plan phasing         | HIGH        | Follows standard SWS enforcement progression  |

---

## Key Decisions for User

1. **D67 amendment:** Does R&D get its own ecosystem slot, or fold into Skills?
2. **Sequence position:** If standalone, where in the 18-ecosystem sequence?
3. **Target maturity:** L3 (Monitored) is recommended; L4 (Enforced) is
   ambitious for a process-layer ecosystem.
4. **CL-PROTOCOL ownership:** Should it be owned by R&D or remain a plan
   orchestration artifact?
5. **Research artifact format:** Stay with MD-based .research/ or migrate to
   JSONL-first (T4)?

---

## Source Files Consulted

| File                                                        | Purpose                                   |
| ----------------------------------------------------------- | ----------------------------------------- |
| `.planning/plan-orchestration/PLAN.md`                      | Plan orchestrator, wave structure         |
| `.planning/plan-orchestration/CL-PROTOCOL.md`               | Convergence-loop verification protocol    |
| `.planning/plan-orchestration/DECISIONS.md`                 | 26 orchestration decisions                |
| `.planning/plan-orchestration/DIAGNOSIS.md`                 | Research context, shared resources        |
| `.planning/system-wide-standardization/PLAN.md`             | SWS v1 plan (21 steps)                    |
| `.planning/system-wide-standardization/PLAN-v3.md`          | SWS v3 plan (6 phases)                    |
| `.planning/system-wide-standardization/DECISIONS.md`        | 92 SWS decisions + tenets                 |
| `.planning/system-wide-standardization/DECISIONS-reeval.md` | 33 re-evaluation decisions                |
| `.planning/system-wide-standardization/GAP-ANALYSIS.md`     | Plan gaps and risks                       |
| `.planning/system-wide-standardization/coordination.json`   | SWS state and artifacts                   |
| `.planning/system-wide-standardization/tenets.jsonl`        | 19 tenets (T1-T19)                        |
| `SESSION_CONTEXT.md`                                        | Current sprint, SWS status                |
| `CLAUDE.md`                                                 | Behavioral rules, enforcement annotations |
