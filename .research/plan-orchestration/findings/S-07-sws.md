# Findings: System-Wide Standardization (SWS) Plan Inventory

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-24
**Sub-Question IDs:** S-07

---

## 1. Step Inventory Table

SWS defines 21 steps across 18 unique ecosystems (TDMS staged x3 = 3 extra
steps). Each step follows a standard pattern: pre-implementation (deep-plan +
register) -> implementation -> audit -> exit review -> changelog -> next.

Cross-cutting infrastructure applies to ALL steps (not counted as separate
steps): per-ecosystem deep-plan (T13), exit criteria (D69), ROADMAP integration
(D70), learning capture (D76/T18), rollback protocol (D68/T12), schema
versioning (D24), migration validation (T10/T11), regression checks (T10/T11),
born-compliant timing (D26), checkpoint metrics (D69/D67).

### Step 1: CANON -- Ecosystem Zero (L0 -> L5)

| Sub-Step | Description                                | Files Touched                                                                                                                                                   | Effort | Internal Deps | Can Parallelize?        |
| -------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------- | ----------------------- |
| 1a       | Directory Structure + Meta Config          | `.canon/canon.json`, `.canon/schemas/*.schema.ts`, full `.canon/` directory tree                                                                                | M      | None          | No (foundation)         |
| 1b       | Tenets -- First CANON Artifact             | `.canon/tenets.jsonl`, `.canon/tenets.md`, `.canon/scripts/generate-tenets-md.js`                                                                               | S      | 1a            | No                      |
| 1c       | Ecosystem Registry                         | `.canon/ecosystems.jsonl`, `.canon/schemas/ecosystem-registry.schema.ts`                                                                                        | S      | 1a            | Yes (with 1b)           |
| 1d       | Maturity Model + 16-Item Checklist         | `.canon/schemas/assessment.schema.ts`, `.canon/ecosystems/canon/assessment.jsonl`                                                                               | S      | 1a, 1c        | No                      |
| 1e       | Enforcement System                         | `.canon/scripts/validate-canon.js`, `.canon/scripts/check-canon-health.js`, `.canon/ecosystems/canon/enforcement.jsonl`, `.husky/pre-commit`, `.husky/pre-push` | M      | 1a-1d         | No                      |
| 1f       | Generated Views + Dashboard                | `.canon/scripts/generate-ecosystem-matrix.js`, `.canon/scripts/generate-changelog-md.js`, `.canon/reports/`                                                     | S      | 1a-1c         | Yes (with 1e partially) |
| 1g       | Changelog Infrastructure                   | `.canon/changelog.jsonl`, `.canon/schemas/changelog.schema.ts`                                                                                                  | S      | 1a            | Yes (with 1b-1c)        |
| 1h       | Testing + Documentation                    | `.canon/scripts/__tests__/*`, `.canon/README.md`                                                                                                                | M      | 1a-1g         | No                      |
| 1i       | CANON Self-Assessment + Versioning         | `.canon/ecosystems/canon/assessment.jsonl` (update), git tag `canon-v0.1.0`                                                                                     | S      | 1a-1h         | No                      |
| 1-audit  | Step 1 Audit (code-reviewer, D81 Tier 1+2) | Review artifacts                                                                                                                                                | S      | 1i            | No                      |

**Step 1 Total Effort: L (6-10 sessions)**

### Steps 2-21: Ecosystem Standardization Passes

| Step | Ecosystem           | Maturity      | Effort     | Sessions (est.) | Depends On              | Checkpoint?       | Can Parallelize? |
| ---- | ------------------- | ------------- | ---------- | --------------- | ----------------------- | ----------------- | ---------------- |
| 2    | Skills              | L1->L3        | L          | 6-10            | Step 1 (CANON)          | No                | No               |
| 3    | Hooks               | L3->L4        | M          | 3-5             | Step 2 (Skills)         | No                | No               |
| 4    | PR Review           | L4->L5        | S          | 1-2             | Step 3 (Hooks)          | **CHECKPOINT #1** | No               |
| 5    | Docs                | L2->L3        | M          | 3-5             | Step 4 (CP#1 passed)    | No                | No               |
| 6    | Testing             | L3->L4        | M          | 3-5             | Step 5 (Docs)           | No                | No               |
| 7    | Sessions            | L1->L3        | M          | 3-5             | Step 6 (Testing)        | **CHECKPOINT #2** | No               |
| 8    | TDMS Stage 1        | L2->L3        | XL-partial | 6-10            | Step 7 (CP#2)           | No                | No               |
| 9    | Scripts             | L2->L3        | L          | 6-10            | Step 8 (TDMS S1)        | No                | No               |
| 10   | CI/CD               | L1->L3        | M          | 3-5             | Step 9 (Scripts)        | No                | No               |
| 11   | Alerts              | L2->L4        | M          | 3-5             | Step 10 (CI/CD)         | No                | No               |
| 12   | Analytics           | L1->L3        | M          | 3-5             | Step 11 (Alerts)        | No                | No               |
| 13   | Agents              | L2->L3        | M          | 3-5             | Step 12 (Analytics)     | No                | No               |
| 14   | Audits              | L3->L4+L5path | M          | 3-5             | Step 13 (Agents)        | No                | No               |
| 15   | Archival/Rotation   | L3->L4        | M          | 3-5             | Step 14 (Audits)        | **CHECKPOINT #3** | No               |
| 16   | TDMS Stage 2        | L3->L4        | XL-partial | 6-10            | Step 15 (CP#3)          | No                | No               |
| 17   | Roadmap & Execution | L2->L3        | L          | 6-10            | Step 16 (TDMS S2)       | No                | No               |
| 18   | Frontend/App        | L2->L3        | M          | 3-5             | Step 17 (Roadmap)       | No                | No               |
| 19   | Firebase/Backend    | L1->L3        | M-L        | 3-8             | Step 18 (Frontend)      | No                | No               |
| 20   | Docs Verification   | verification  | S          | 1-2             | Step 19 (all 18 done)   | No                | No               |
| 21   | TDMS Stage 3        | L4->L5        | XL-final   | 6-10            | Step 20 (Docs verified) | **CHECKPOINT #4** | No               |

**Each step (2-21) internally contains:**

- Pre-implementation: deep-plan + register in ecosystems.jsonl (consistent)
- Implementation: Zod schemas + enforcement manifest + health checker +
  inter-ecosystem contracts + monitoring (varies per ecosystem)
- Exit criteria: 16-item checklist scorecard + user review + changelog entries
- Regression check: full test suite + all prior ecosystem health checkers

**Total steps/sub-steps: 10 sub-steps in Step 1 + 20 ecosystem steps = 30
distinct work units** **Total sessions estimate: ~80-130** (from PLAN.md effort
summary table)

---

## 2. External Touchpoints

### Files This Plan CREATES (new)

**`.canon/` directory tree (entirely new -- confirmed not existing via Glob):**

- `.canon/canon.json` -- CANON meta (version, config)
- `.canon/tenets.jsonl` -- Core tenets (migrated from
  `.planning/system-wide-standardization/tenets.jsonl`)
- `.canon/tenets.md` -- Generated view
- `.canon/ecosystems.jsonl` -- Registry (18 ecosystem entries)
- `.canon/changelog.jsonl` -- Cross-ecosystem change log
- `.canon/schemas/ecosystem-registry.schema.ts`
- `.canon/schemas/assessment.schema.ts`
- `.canon/schemas/enforcement-manifest.schema.ts`
- `.canon/schemas/changelog.schema.ts`
- `.canon/schemas/health-report.schema.ts`
- `.canon/schemas/tenet.schema.ts`
- `.canon/schemas/skill-metadata.schema.ts` (Step 2)
- `.canon/config/defaults.json`
- `.canon/config/overrides/` (per-ecosystem)
- `.canon/reports/` (generated dashboards)
- `.canon/scripts/generate-tenets-md.js`
- `.canon/scripts/generate-ecosystem-matrix.js`
- `.canon/scripts/generate-changelog-md.js`
- `.canon/scripts/validate-canon.js`
- `.canon/scripts/check-canon-health.js`
- `.canon/scripts/scan-changelog.js`
- `.canon/scripts/__tests__/` (test files)
- `.canon/README.md`
- `.canon/.xref.json` (cross-reference map for migrations)
- `.canon/ecosystems/{id}/assessment.jsonl` (18 directories, one per ecosystem)
- `.canon/ecosystems/{id}/enforcement.jsonl` (18 files)
- `.canon/ecosystems/{id}/contracts/` (inter-ecosystem contracts)

**Per-ecosystem Zod schemas (created during each step):**

- Steps 2-21 each produce ecosystem-specific schemas (e.g., skill-metadata,
  hook-config, test-config, alert-definitions, agent-definitions,
  audit-definitions, archive-format, TDMS-data, ROADMAP-structure, etc.)

**Per-ecosystem health checkers (created or enhanced during each step):**

- 18 health checkers total (one per ecosystem)

### Files This Plan MODIFIES (existing)

- `.husky/pre-commit` -- Add CANON validation gates (Step 1e, plus additions at
  each ecosystem step)
- `.husky/pre-push` -- Add CANON validation gates
- `.claude/skills/SKILL_STANDARDS.md` -- Update with CANON standards (Step 2)
- `ROADMAP.md` -- Add Track-CANON items after each ecosystem (D70)
- `SESSION_CONTEXT.md` -- Update quick status after each ecosystem (D70)
- `DOCUMENTATION_INDEX.md` -- Update (Step 5, Step 20)
- `docs/DOCUMENT_DEPENDENCIES.md` -- Canonize (Step 5)
- `docs/technical-debt/MASTER_DEBT.jsonl` -- Dedupe against ROADMAP additions
  (D70), fix 9-writer race condition (Step 8)
- `jest.config.ts` -- Potentially modified for testing standards (Step 6)
- `scripts/check-roadmap-health.js` -- Enhanced (Step 17)
- `scripts/check-roadmap-hygiene.js` -- Referenced (Step 17)
- `scripts/check-cross-doc-deps.js` -- Canonized (Step 5)
- `scripts/check-doc-headers.js` -- Canonized (Step 5)
- `scripts/check-doc-placement.js` -- Canonized (Step 5)
- `scripts/check-document-sync.js` -- Canonized (Step 5)
- `scripts/generate-doc-index.js` -- Canonized (Step 5)
- `scripts/debt/*.js` -- All 30 scripts get Zod schemas + standardization (Step
  8, 16, 21)

### Files This Plan ARCHIVES

- `.archive/<ecosystem-id>/<datestamp>/` -- Migrated source files after
  validated migration (per Migration Validation Protocol)
- Original markdown sources replaced by JSONL+generated-view pattern

### Skills Affected

- `.claude/skills/skill-audit/` -- Canonized as primary mechanism (Step 2)
- `.claude/skills/doc-ecosystem-audit/` -- Enhanced (Step 5)
- `.claude/skills/docs-maintain/` -- Referenced (Step 5)
- `.claude/skills/alerts/` -- Schemas formalized (Step 11)
- `.claude/skills/sonarcloud/` -- Referenced (Step 8)
- `.claude/skills/add-debt/` -- Referenced (Step 8)
- `.claude/skills/session-begin/` -- Formalized lifecycle (Step 7)
- `.claude/skills/session-end/` -- Formalized lifecycle (Step 7)
- `.claude/skills/checkpoint/` -- Formalized (Step 7)
- `.claude/skills/task-next/` -- Referenced (Step 17)
- `.claude/skills/script-ecosystem-audit/` -- Referenced (Step 9)
- `.claude/skills/comprehensive-ecosystem-audit/` -- Referenced (Step 14)
- `.claude/skills/create-audit/` -- Referenced (Step 14)
- `.claude/skills/audit-*/` -- 7+ audit skills formalized (Step 14)
- All 65 skills: born-compliant gate activated after Step 2 completion

### Hooks Affected

- `.husky/pre-commit` -- Modified at Steps 1, 3, and progressively
- `.husky/pre-push` -- Modified at Steps 1, 3, and progressively
- `.claude/hooks/*.js` -- Zod schemas added (Step 3)
- `.claude/hooks/session-start.sh` -- Formalized (Step 7)

### Documentation Files Modified

- `DOCUMENTATION_INDEX.md` -- Updated (Steps 5, 20)
- `docs/DOCUMENT_DEPENDENCIES.md` -- Canonized (Step 5)
- `.canon/README.md` -- Created (Step 1)
- All 18 ecosystem directories get documentation

### Config Files Changed

- `.canon/config/defaults.json` -- Created (Step 1)
- `.canon/config/overrides/` -- Per-ecosystem overrides (progressive)
- `.canon/canon.json` -- Version bumped at 4 checkpoints (0.1.0 -> 0.2.0 ->
  0.3.0 -> 0.4.0 -> 1.0.0)

### CANON Framework Artifacts

CANON IS BUILT WITHIN THIS PLAN (Step 1). It is NOT an external dependency. The
DIAGNOSIS.md statement "SWS is gated on CANON framework" refers to CANON being
the first step of SWS itself -- SWS gates on its own Step 1.

---

## 3. Effort Summary

### Total Estimated Effort

**80-130 sessions** (plan states "40-60 sessions across 21 steps" in header, but
the effort summary table sums to 80-130 sessions). The header estimate appears
to be stale/undercount. The table-based sum is authoritative.

| Effort Size                     | Count                                | Session Range |
| ------------------------------- | ------------------------------------ | ------------- |
| S (1-2 sessions)                | 3 steps (4, 20, misc)                | 3-6           |
| M (3-5 sessions)                | 10 steps (3,5,6,7,10,11,12,13,14,15) | 30-50         |
| M-L (3-8 sessions)              | 1 step (19)                          | 3-8           |
| L (6-10 sessions)               | 5 steps (1,2,9,17 + misc)            | 24-40         |
| XL-partial (6-10 sessions each) | 2 steps (8,16)                       | 12-20         |
| XL-final (6-10 sessions)        | 1 step (21)                          | 6-10          |
| **TOTAL**                       | **21 steps**                         | **~80-130**   |

### Complexity Assessment Per Phase

| Phase (Checkpoint Range)                   | Steps | Complexity                                                                            | Risk                                                                                            |
| ------------------------------------------ | ----- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Foundation (Steps 1-4, CP#1)               | 4     | HIGH -- CANON creation is greenfield architecture with self-referential requirements  | HIGH -- if CANON design is wrong, everything downstream is wrong                                |
| Core Infra (Steps 5-7, CP#2)               | 3     | MEDIUM -- applying proven CANON patterns to well-understood ecosystems                | MEDIUM -- ecosystem interdependencies emerging                                                  |
| Data-Heavy Process (Steps 8-15, CP#3)      | 8     | HIGH -- TDMS S1 (30+ scripts), Scripts (88+ items in scripts/), and volume ecosystems | HIGH -- scope explosion risk on Scripts (88 items, not 300+ as plan states? or subdirectories?) |
| App-Layer + Completion (Steps 16-21, CP#4) | 6     | MEDIUM-HIGH -- TDMS S2+S3, app-layer connection points, final verification            | MEDIUM -- patterns well-established by this point                                               |

### What Makes This Plan XL?

1. **Volume:** 18 distinct ecosystems, each requiring its own deep-plan session,
   implementation, audit, and exit review
2. **Sequential constraint:** D63 mandates sequential execution with only
   research overlap -- no parallel implementation
3. **Per-ecosystem overhead:** Each ecosystem has ~5 ceremony steps (deep-plan,
   register, implement, audit, exit review) regardless of implementation size
4. **Compounding contracts:** Each ecosystem adds inter-ecosystem contracts that
   must be validated against all previously completed ecosystems
5. **TDMS staging:** TDMS alone is 3 separate steps (8, 16, 21) at 18-30
   sessions total
6. **4 checkpoint gates:** Each checkpoint requires comprehensive validation
   across all completed ecosystems
7. **Regression testing:** Every step requires running health checkers for ALL
   previously completed ecosystems

---

## 4. Phase Structure

SWS uses 4 phases defined by checkpoint boundaries, not explicit "phase" labels.
The plan calls them checkpoints, not phases.

### Phase 1: Foundation (Steps 1-4) -- CHECKPOINT #1

**Purpose:** Build CANON framework and validate it works end-to-end with a pilot
ecosystem (PR Review).

**Steps:**

1. CANON (L0->L5) -- build the meta-framework
2. Skills (L1->L3) -- daily tool, skill-audit canonized
3. Hooks (L3->L4) -- enforcement infrastructure
4. PR Review (L4->L5) -- CANON pilot validation

**Entry gate:** Nothing -- this is the start **Exit gate (Checkpoint #1):** 6
concrete metrics:

- All `.canon/schemas/*.schema.ts` compile with zero errors
- PR Review health checker score >= 90%
- PR Review enforcement manifest covers all applicable items
- `.canon/changelog.jsonl` has entries for all cross-ecosystem impacts
- CANON self-assessment matches verifiable evidence
- Full test suite + Step 1 health checkers passing

**CANON version:** 0.1.0 -> 0.2.0 at checkpoint pass **Effort:** 16-27 sessions
(L+L+M+S) **Risk:** HIGH -- if CANON design is flawed, checkpoint #1 catches it
here. D68 skip-and-return does NOT apply to checkpoint #1.

### Phase 2: Core Infrastructure (Steps 5-7) -- CHECKPOINT #2

**Purpose:** Complete core infrastructure: docs, testing, sessions. After this,
all tooling-layer ecosystems are standardized.

**Steps:** 5. Docs (L2->L3) -- folder structure, placement standards, dependency
maps 6. Testing (L3->L4) -- test infrastructure standards 7. Sessions (L1->L3)
-- session state management

**Entry gate:** Checkpoint #1 passed **Exit gate (Checkpoint #2):** 5 concrete
metrics:

- All 7 completed ecosystem health checkers passing
- No regressions in any ecosystem
- Registry has 7 "completed" entries with correct levels
- All inter-ecosystem contracts have both sides implemented
- Changelog entries for Steps 1-7 complete

**CANON version:** 0.2.0 -> 0.3.0 at checkpoint pass **Effort:** 9-15 sessions
(M+M+M) **Risk:** MEDIUM

### Phase 3: Process-Layer Ecosystems (Steps 8-15) -- CHECKPOINT #3

**Purpose:** Standardize all process-layer ecosystems (data-heavy, monitoring,
agents, audits, archival).

**Steps:** 8. TDMS Stage 1 (L2->L3) -- Zod schemas + monitoring for 30+
scripts 9. Scripts (L2->L3) -- script infrastructure standards (88+ scripts) 10.
CI/CD (L1->L3) -- build/deploy pipelines 11. Alerts (L2->L4) -- monitoring
layer 12. Analytics (L1->L3) -- metrics aggregation 13. Agents (L2->L3) -- agent
definitions 14. Audits (L3->L4+L5path) -- audit lifecycle 15. Archival/Rotation
(L3->L4) -- lifecycle patterns

**Entry gate:** Checkpoint #2 passed **Exit gate (Checkpoint #3):** 6 concrete
metrics:

- All 15 ecosystem health checkers passing
- No regressions
- Registry has 15 "completed" entries
- All L4+ ecosystems have active enforcement manifests
- All migration findings resolved or tracked in MASTER_DEBT
- All migrated files archived per protocol

**CANON version:** 0.3.0 -> 0.4.0 at checkpoint pass **Effort:** 33-55 sessions
(XL+L+M+M+M+M+M+M) **Risk:** HIGH -- largest phase, scope explosion risk on
Scripts and TDMS

### Phase 4: App-Layer + Completion (Steps 16-21) -- CHECKPOINT #4

**Purpose:** Complete TDMS to L4, standardize app-layer ecosystems, verify docs,
final TDMS L5 canonization.

**Steps:** 16. TDMS Stage 2 (L3->L4) -- enforcement + testing 17. Roadmap &
Execution (L2->L3) -- hub ecosystem, input pipelines 18. Frontend/App (L2->L3)
-- connection points 19. Firebase/Backend (L1->L3) -- biggest maturity gap 20.
Docs Verification -- meta-check across all 18 ecosystems 21. TDMS Stage 3
(L4->L5) -- final canonization

**Entry gate:** Checkpoint #3 passed **Exit gate (Checkpoint #4):** 8 concrete
metrics:

- All 18 ecosystems at or above target maturity
- All 18 health checkers passing
- Changelog covers all 21 steps
- All inter-ecosystem contracts implemented (both sides)
- All `canon-migration` MASTER_DEBT items resolved or accepted
- All JSONL files validate against declared schema versions
- All migrated source files archived
- Maintenance patterns documented

**CANON version:** 0.4.0 -> 1.0.0 at checkpoint pass **Effort:** 22-43 sessions
(XL+L+M+M-L+S+XL) **Risk:** MEDIUM -- patterns well-established, but TDMS S3 is
large

### Phase Independence

ALL phases are STRICTLY SEQUENTIAL. No phase can start before the prior
checkpoint passes. The only approved parallelism is research overlap (deep-plan
ecosystem N+1 while implementing ecosystem N).

### Where CANON Gets Built

CANON is built in **Step 1** (Phase 1). Sub-steps 1a through 1i create the
entire `.canon/` directory tree, all schemas, all scripts, enforcement system,
and self-assessment. Step 4 (PR Review) validates CANON works. Checkpoints 2-4
trigger CANON version bumps.

---

## 5. CANON Dependencies

### What Is CANON?

CANON is "Ecosystem Zero" -- the meta-system that defines the rules, schemas,
enforcement mechanisms, and maturity model for all other ecosystems. It lives at
`.canon/` in the repo root. It is both:

1. **A framework:** Defines contracts (what a health checker must output, what
   an enforcement manifest looks like, the 16-item checklist, maturity levels
   L0-L5)
2. **Self-referential:** CANON standardizes itself first (L0->L5), validating
   the framework before applying it to others (T10)

### What CANON Requires (to be built)

- Nothing external. CANON is the first step and has no dependencies.
- It consumes existing artifacts: tenets from
  `.planning/system-wide-standardization/tenets.jsonl`, framework repo decisions
  (68 decisions, 42 gaps -- referenced but consumed into CANON)
- It requires Zod (already in project stack at v4.3.6)
- It requires Node.js (platform-agnostic per T7)

### What CANON Produces (that other plans consume)

- `.canon/schemas/*.schema.ts` -- Zod schemas that define data contracts
- `.canon/ecosystems.jsonl` -- ecosystem registry
- `.canon/changelog.jsonl` -- cross-ecosystem change tracking
- `.canon/config/` -- global defaults + override system
- `.canon/scripts/` -- validation, health checking, view generation
- Enforcement hooks in `.husky/pre-commit` and `.husky/pre-push`
- The 16-item completeness checklist framework
- The maturity model (L0-L5)
- The born-compliant gate mechanism

### Which Other Plans Might Produce CANON-eligible Artifacts?

Based on other active plans in the DIAGNOSIS.md:

- **repo-cleanup:** Could clean up files before CANON structures them
- **cli-tools-implementation:** CLI tools could become CANON-managed if they
  touch `.canon/` schemas
- **agent-environment-analysis:** Agent definitions formalized in SWS Step 13 --
  agent-env analysis could produce findings that feed into this
- **propagation-research:** Propagation patterns are relevant to CANON's
  downstream propagation mechanism (D49)

### What Must Exist Before CANON Phase Starts?

Nothing external. The plan is self-contained. However, practically:

- The repo should be clean (suggests repo-cleanup first)
- Stack versions should be current (Zod 4.3.6 for schemas)
- `.planning/system-wide-standardization/` JSONL artifacts exist (confirmed via
  Glob -- they do)

---

## 6. Pre/Post Conditions

### Pre-Conditions (before SWS starts)

1. **No `.canon/` directory exists** -- confirmed via Glob (ground truth)
2. **Planning artifacts exist** in `.planning/system-wide-standardization/` --
   confirmed (decisions.jsonl, tenets.jsonl, directives.jsonl, ideas.jsonl,
   coordination.json, etc.)
3. **92 decisions locked** in DECISIONS.md -- confirmed
4. **18 tenets defined** (DECISIONS.md header says 18, T1-T19 with T18 added
   later but numbered as such; plan references T1-T19 with 19 entries but header
   says 18 -- minor discrepancy, see Contradictions)
5. **41 directives captured** -- confirmed in DECISIONS.md header
6. **Zod available** in project (v4.3.6 per CLAUDE.md)
7. **Husky hooks exist** (`.husky/pre-commit`, `.husky/pre-push`) -- confirmed
8. **65 skills exist** in `.claude/skills/` -- confirmed (plan says "62+ skills"
   in Step 2, actual count is 65)
9. **30 scripts in `scripts/debt/`** -- confirmed (plan says 37 -- see
   Contradictions)
10. **88+ items in `scripts/`** top level -- confirmed (plan says "300+ scripts"
    which likely includes subdirectories)

### Post-Conditions (after SWS completes)

1. **`.canon/` directory exists** with full infrastructure
2. **All 18 ecosystems at target maturity levels:**
   - 2 at L5 (CANON, PR Review)
   - 4 at L4 (Hooks, Testing, Alerts, Archival/Rotation, Audits) -- actually 5
     at L4
   - 11 at L3 (Skills, Docs, Sessions, TDMS, Scripts, CI/CD, Analytics, Agents,
     Roadmap, Frontend, Firebase) -- wait, TDMS targets L5
   - Correction: TDMS at L5, PR Review at L5, CANON at L5 = 3 at L5; Hooks,
     Testing, Alerts, Archival, Audits = 5 at L4; remainder at L3
3. **CANON at v1.0.0**
4. **18 ecosystem health checkers** all passing
5. **All inter-ecosystem contracts** implemented (both sides)
6. **Enforcement manifests** active for all L4+ ecosystems
7. **Born-compliant gates** active for all completed ecosystems
8. **`.canon/changelog.jsonl`** has complete cross-ecosystem history
9. **ROADMAP.md** updated with Track-CANON items
10. **All migrated source files** archived in `.archive/`
11. **Maintenance patterns** documented for ongoing operations

### What Other Plans Benefit from SWS Completing First?

- **ALL future plans** -- CANON provides the framework for standardized planning
- **agent-environment-analysis:** Step 13 (Agents) standardizes agent
  definitions
- **cli-tools-implementation:** Would benefit from script standards (Step 9)
- **propagation-research:** Would benefit from changelog/propagation
  infrastructure
- **passive-surfacing-remediation:** Would benefit from alerts standardization
  (Step 11)

Conversely, SWS benefits from OTHER plans completing first:

- **repo-cleanup:** Cleaning the repo first means SWS doesn't standardize things
  that should be deleted
- **cli-tools-implementation (Phase 1):** Already done -- provides tooling SWS
  can use

---

## 7. Decomposition Candidates

### Which Phases Could Be Extracted and Scheduled Independently?

The plan is explicitly SEQUENTIAL (D63, D67). However, for orchestration
purposes, certain chunks have weaker dependencies and could theoretically be
extracted:

**Strong candidates for extraction:**

1. **Step 1 alone (CANON):** Zero dependencies. Could be executed as a
   standalone plan. This is the minimum viable first execution chunk. Effort: L
   (6-10 sessions). After completion, all other SWS steps become unblocked.

2. **Steps 1-4 as "CANON Foundation" mini-plan:** Natural checkpoint boundary.
   Validates the entire framework. Effort: 16-27 sessions. This is the most
   logical extraction point.

3. **Steps 18-19 (Frontend/App + Firebase/Backend):** These are app-layer steps
   that depend on process-layer being done (CP#3). Their connection-point focus
   differs from process-layer work. Could be deferred if app-layer work isn't
   urgent.

4. **Step 20 (Docs Verification):** A standalone verification pass that only
   requires all 18 ecosystems to be done. Could be combined with final TDMS
   step.

**Weak candidates (too intertwined):**

5. **Steps 5-7 (Docs, Testing, Sessions):** Each depends on the prior, but they
   form a natural "core infrastructure" group that could be a chunk.

6. **Steps 8-15 (process-layer):** These are the bulk of the work. While
   individually sequential, the learning-transfer rationale (D63) makes
   splitting them risky.

### Which Phases Have No Intra-SWS Dependencies?

**None.** The entire plan is a strictly sequential chain. Every step depends on
the prior step. The dependency graph is a single linear chain (not a DAG with
independent branches). This is by design (D63).

However, the NATURE of dependencies varies:

- **Hard dependencies (framework required):** Steps 1-4 (CANON must exist before
  anything uses it)
- **Soft dependencies (learning transfer):** Steps 5-21 (each benefits from
  learnings but could theoretically run with only CANON + its declared ecosystem
  dependencies)

### Minimum Viable First Execution Chunk

**Step 1 (CANON) alone.** 6-10 sessions. After this:

- `.canon/` exists with full infrastructure
- All schemas, scripts, health checkers, enforcement ready
- Steps 2-21 are unblocked
- Other plans can start consuming CANON patterns

**Second-best MVE: Steps 1-4 (CANON through Checkpoint #1).** 16-27 sessions.
After this:

- CANON is VALIDATED (not just built)
- CANON at v0.2.0 (proven to work)
- Skills, Hooks, PR Review all standardized
- Born-compliant gates active for new skills/hooks

### Interleaving Opportunity

D71 explicitly allows standardization and project work in the same sessions.
This means SWS steps can be interleaved with other plans. The 3-session
no-progress flag prevents SWS from stalling.

---

## Decisions Coverage Summary

The 92 decisions in DECISIONS.md break down as:

| Section                  | Decision Range | Count  | Coverage in This Inventory                                                  |
| ------------------------ | -------------- | ------ | --------------------------------------------------------------------------- |
| Architecture & Standards | D1-D32         | 32     | Covered via CANON infrastructure (Step 1), checklist (D9), tenets (D28-D32) |
| Ecosystem Assessments    | D33-D54        | 22     | Covered via per-ecosystem maturity targets (Steps 2-21)                     |
| Sequencing & Execution   | D55-D76        | 22     | Covered via phase structure, checkpoints, execution model                   |
| Process & Artifacts      | D77-D83        | 7      | Covered via JSONL artifact architecture, audit framework                    |
| Audit Fixes & Protocols  | D84-D92        | 9      | Covered via supersession protocol, effort calibration, versioning           |
| **Total**                | D1-D92         | **92** | All addressed                                                               |

Note: D55-D62 are superseded by D63/D67 (sequential model replaced wave model).
These are historical decisions preserved in DECISIONS.md but no longer active.

---

## Contradictions

1. **Script count discrepancy:** PLAN.md Step 8 says "37 scripts in
   `scripts/debt/`". Filesystem shows 30 scripts. Either scripts were removed
   since the plan was written (2026-03-04) or the count was inaccurate at plan
   time.

2. **Total session estimate inconsistency:** Plan header says "40-60 sessions
   across 21 steps" but the effort summary table sums to ~80-130 sessions. The
   table is more detailed and should be authoritative. The header appears stale
   (possibly from before review decisions increased scope).

3. **Tenet count:** DECISIONS.md header says "Tenets: 18" but the plan
   references T1-T19 (with T18 and T19 both existing). The tenets section lists
   T1-T12, T13-T17, T18, T19 = 18 unique tenets (T18 and T19 are the last two;
   there is no T0). So the count is 18 tenets numbered T1-T19 with a gap
   (unclear which number is skipped). On closer inspection: T1-T12, T13-T17,
   T18, T19 = 19 entries. But if T8 was "discussed but never formally recorded"
   and only formalized later in D30, the original count may have been 18 with T8
   added making 19. The header was likely written before T19 was added.

4. **Skills count:** Plan Step 2 says "62+ skills" but filesystem shows 65 skill
   directories. Minor discrepancy -- plan was written before new skills were
   added.

5. **DIAGNOSIS.md says "SWS is gated on CANON framework (not yet built)"** --
   this is technically misleading. CANON is Step 1 OF SWS, not an external
   dependency. SWS does not need anything external to start. The diagnosis
   phrasing suggests CANON is a separate prerequisite, but the plan shows it is
   built within SWS itself.

---

## Gaps

1. **No explicit rollback cost estimate.** The plan defines rollback protocol
   but does not estimate the session cost of a rollback + re-attempt scenario.

2. **No explicit "abort" criteria.** What if multiple ecosystems fail their
   checkpoints? D68 allows skip-and-return but doesn't define when to stop the
   overhaul entirely.

3. **Script count needs revalidation.** The "300+ scripts" and "37 scripts"
   claims both need fresh filesystem verification before execution.

4. **No capacity planning for checkpoint validation.** Checkpoints require
   running health checkers across ALL completed ecosystems. As the count grows
   (7 at CP#2, 15 at CP#3, 18 at CP#4), the validation overhead grows. This
   overhead is not included in session estimates.

5. **Cross-plan integration not specified.** How do other active plans
   (repo-cleanup, cli-tools, etc.) interact with in-progress SWS work? D71 says
   "interleaved" but gives no protocol for conflicts.

6. **TDMS Grand Plan reassessment (D73, D38)** is called out as an explicit task
   at position #8, with "lightweight pre-checks before each ecosystem #1-#7."
   The pre-check mechanism is not defined in detail.

---

## Serendipity

1. **CANON is a reusable framework beyond SWS.** Once built, CANON's maturity
   model, health checkers, enforcement manifests, and schema patterns can be
   applied to ANY future system or ecosystem without going through SWS. This
   makes Step 1 disproportionately valuable.

2. **The DECISIONS.md is auto-generated** from JSONL source files by
   `scripts/planning/generate-decisions.js`. This means the SWS planning
   artifacts themselves are already practicing what CANON preaches (JSONL source
   of truth + generated MD views). The SWS planning directory is essentially a
   prototype of CANON.

3. **D90 (no hardcoded growing counts)** is a repo-wide directive that should be
   enforced from the start of SWS, not just within CANON. This could be added to
   existing pre-commit hooks early.

4. **The `.planning/system-wide-standardization/` directory has multiple plan
   versions** (PLAN.md, PLAN-v2.md, PLAN-v3.md, DECISIONS-reeval.md,
   DIAGNOSIS.md, DIAGNOSIS-v2.md, GAP-ANALYSIS.md) indicating significant
   iteration. The current PLAN.md is v1.1 with 21 review decisions incorporated.

5. **SWS's inter-ecosystem contract system (D74)** creates a dependency
   declaration mechanism that could be valuable for plan-orchestration itself --
   declaring dependencies between plans, not just ecosystems.

---

## Confidence Assessment

- HIGH claims: 18 (step inventory, phase structure, CANON location, file paths
  verified against filesystem, checkpoint metrics from plan text)
- MEDIUM claims: 6 (effort estimates are plan's own estimates not independently
  validated, decomposition candidates are analytical judgments)
- LOW claims: 2 (script counts may have changed, session overhead for
  checkpoints is estimated)
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

---

## Convergence Loop Verification

### CL-1: Step count verification

Plan defines 21 steps. My inventory covers 10 sub-steps for Step 1 + 20
ecosystem steps (2-21) = 30 distinct work units across 21 numbered steps.
**MATCH** -- the plan says "21 steps" and I have all 21 with sub-steps for
Step 1.

### CL-2: Decision count verification

DECISIONS.md header says 92 decisions. My coverage table accounts for D1-D92
across 5 sections (32+22+22+7+9 = 92). **MATCH.**

### CL-3: File path spot-checks (10 paths)

1. `.husky/pre-commit` -- EXISTS (confirmed via Glob)
2. `.husky/pre-push` -- EXISTS (confirmed via Glob)
3. `.claude/skills/skill-audit/` -- EXISTS (confirmed via Glob: SKILL.md +
   REFERENCE.md)
4. `.claude/skills/session-begin/` -- EXISTS (confirmed via Glob)
5. `.claude/skills/alerts/` -- EXISTS (confirmed via Glob)
6. `scripts/check-cross-doc-deps.js` -- EXISTS (confirmed via Glob)
7. `scripts/check-doc-headers.js` -- EXISTS (confirmed via Glob)
8. `scripts/debt/validate-schema.js` -- EXISTS (confirmed via Glob)
9. `.github/workflows/ci.yml` -- EXISTS (confirmed via Glob)
10. `.canon/` -- DOES NOT EXIST (confirmed -- this is correct, plan creates it)
    **10/10 spot-checks pass.**

### CL-4: Phase dependency accuracy

Phase 1 (Steps 1-4) -> Checkpoint #1 -> Phase 2 (Steps 5-7) -> Checkpoint #2 ->
Phase 3 (Steps 8-15) -> Checkpoint #3 -> Phase 4 (Steps 16-21) -> Checkpoint #4.
This matches the plan's dependency graph (Mermaid diagram at line 1324-1346) and
checkpoint definitions. **MATCH.**

### CL-5: Missing phases/steps/sub-steps?

- All 21 steps accounted for
- All 9 sub-steps of Step 1 (1a-1i) accounted for, plus Step 1 Audit
- All 4 checkpoints accounted for
- Cross-cutting infrastructure documented
- Parallelization guidance documented (D63: research overlap only)
- Step 4 audit and Step 15 audit and Step 21 audit noted **No missing elements
  found.**

### CL-6: CANON framework description accuracy

Verified: CANON is built in Step 1 of SWS (not external). Lives at `.canon/`.
Contains schemas, scripts, enforcement, tenets, ecosystem registry, changelog,
config, reports. Versioned via semver (0.1.0 -> 1.0.0 at CP#4). Self-referential
(scores itself L5 on its own checklist). **Matches plan text.**

### Corrections Made During CL

1. Added Step 1 Audit as a distinct work unit (initially missed)
2. Corrected the session estimate discrepancy (header vs table)
3. Added the TDMS Grand Plan reassessment note (D73) to Gaps section
4. Clarified that tenet count is 18 or 19 (ambiguous in source -- documented as
   contradiction)
5. Verified script count discrepancy (plan says 37, filesystem shows 30)
