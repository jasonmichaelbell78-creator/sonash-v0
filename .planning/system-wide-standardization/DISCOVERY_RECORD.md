# System-Wide Standardization — Discovery Record

**Created:** 2026-03-02 (Session #201) **Status:** DISCOVERY PHASE — Capturing
findings, decisions, and vision **Branch:** `claude/ecosystem-review-s201`
**Context:** Post PR Ecosystem v2 review surfaced need for system-wide
standardization

---

## Origin

During Session #201, a 14-question deep review of the PR Ecosystem v2 overhaul
(PRs #398, #407, #411) revealed that the patterns, standards, and architecture
established for the PR review ecosystem need to be canonized system-wide. What
started as an ecosystem review became a discovery session for a much larger
undertaking.

---

## Vision Statement

**Establish a standardized system-wide framework** where every ecosystem (PR
review, TDMS, sessions, hooks, skills, docs, scripts) follows the same
architectural patterns: Zod-validated JSONL-first storage, completeness tiers,
health monitoring, automated enforcement, and unified analytics. The PR
ecosystem v2 becomes the reference implementation, not a one-off.

---

## The 14-Question Review — Findings & Decisions

### Q1: JSONL Source of Truth + MD for Human Consumption

**Finding:** TDMS has automated JSONL→MD pipeline (`generate-views.js`). Review
archives are still manual markdown. `render-reviews-to-md.js` exists, is tested,
but is **orphaned** — never wired into any pipeline.

**Decision:** Wire `render-reviews-to-md.js` into archival pipeline. BUT — this
surfaced a bigger need: **multi-faceted gap review** across the entire system.
Looking for:

- Unwired products (built but not connected)
- Orphaned products (connected to nothing)
- Designed but unused features
- Planned but undesigned features
- Process/procedure gaps

**User quote:** "looking more like v2" — this gap review itself may be a
v2-scale effort.

### Q2: Manual Steps (~42 found)

**Finding:** 42 manual invocation points across skills, hooks, and scripts. Key
areas: 18 conditional pre-push audits, 7 JSONL write steps, 5 suppression steps,
12 session lifecycle steps. Some "manual" steps are actually auto-run by
session-start hook — skill docs out of sync with reality.

**Decision:** User accepts manual steps as long as there is **a prompt of some
nature** — a direct invocation isn't always necessary. The critical requirement:
**nothing should get lost or unused because the user doesn't remember to do
it.** Every manual step needs at minimum a surface/reminder mechanism.

**Action items:**

- Audit skill docs against actual automation (fix discrepancies)
- Ensure every manual step has a prompt/reminder surface
- Automate top candidates: session counter, TDMS entries, suppression sync
- Design a "did you forget?" mechanism for steps that get skipped

### Q3: Review-the-Reviews Mechanism

**Finding:** Multi-layered and functional (promote-patterns.ts,
analyze-learning-effectiveness.js, surface-lessons-learned.js,
run-consolidation.js). But gaps: no cross-archive temporal trends, no PR-level
pattern clustering, no fuzzy matching, no pattern lifecycle tracking.

**Decision:** Research how to successfully integrate these gaps. This is a
research task, not immediate implementation.

**Gaps to research:**

- Cross-archive temporal trend analysis
- PR-level pattern clustering (which PR types cause which patterns?)
- Fuzzy matching for pattern variants
- Pattern lifecycle tracking (new → documented → automated → stable)
- Consolidated mining dashboard

### Q4: Analytics Surfacing Inventory

**Finding:** 51+ npm scripts across 7 surfaces (session hooks, pre-commit,
pre-push, CI, weekly, manual skills, ecosystem audits). 6 dead/minimal scripts
found. `ecosystem:audit:all` is a placeholder.

**Decision:** The analytics system needs to be **system-wide canonized**. Start
with PR ecosystem analytics as the reference, then expand as the base for all
ecosystems.

**Questions raised:**

- What is the `ecosystem:audit:all` placeholder for? There IS already a
  `/comprehensive-ecosystem-audit` skill — the npm script is dead weight.
- Should each ecosystem have its own analytics surface, or one unified system?
- How do we prevent analytics fragmentation as ecosystems grow?

**Action:** Clean up dead scripts. Design unified analytics architecture.

### Q5: Full Pipeline Testing

**Finding:** v2 shipped with 56 test files and 7 E2E smoke tests, but no live
end-to-end walkthrough of every skill and script has been done.

**Decision:** Design this as a **skill** — even if temporary — with compaction
guardrails. A `/pipeline-walkthrough` or `/ecosystem-validation` skill that
systematically tests every pipeline end-to-end, tracks progress through
compaction, and produces a verification report.

**Design requirements:**

- Compaction-safe (state persisted to files, not just conversation)
- Resumable (can pick up where left off)
- Covers every skill, script, hook, and CI workflow
- Produces pass/fail report per pipeline
- Can be scoped to single ecosystem or run system-wide

### Q6: Semgrep.yml Warning — RESOLVED

All semgrep issues from PR #411 R5-R8 resolved. 20 custom rules clean. No action
needed.

### Q7: Skip Documentation — RESOLVED

All skips documented via override-log.jsonl with mandatory SKIP_REASON.
Session-end includes override audit. Hook analytics detects patterns. No action
needed.

### Q8: Ecosystem-Health Naming

**Finding:** The `/ecosystem-health` skill is BROADER than PR reviews — 10
health checkers covering code quality, security, tech debt, tests, docs, hooks,
sessions, patterns, and ecosystem integration. The name is accurate.

**Decision:** Name stays. But raises bigger questions:

- Does it need to be **expanded** for other ecosystems?
- Do ALL ecosystems need to adopt the health checker pattern?
- Do these ecosystems and/or system-wide need to be changed for the standards
  set in the PR ecosystem v2?

**User quote:** "a lot of rabbit holes here" — this is part of the system-wide
standardization vision.

### Q9: Health Skill Details + Alerts Overlap

**Finding:** 10 checkers, 8 scoring categories, 64 metrics. Separate from alerts
system. Both read similar sources but serve different purposes (health = trend
tracking, alerts = interactive triage). Not redundant but could be unified.

**Decision:** More evidence for canonized system-wide analytics. Need
**unification** — fix specific to PR ecosystem while persistently planning for
system-wide changes.

**Idea:** A **persistent decision record** for system-wide changes. Not just
this document — an ongoing living record of architectural decisions that span
ecosystems.

**User acknowledgment:** "yes, I know I'm scope-deviating but this just brings
up so much more" — scope deviation is the POINT of discovery. Capture
everything.

### Q10: MASTER_DEBT.jsonl Field Alignment

**Finding:** MASTER_DEBT.jsonl uses legacy schema — no Zod validation, no
completeness tiers, no schema_version. Completely separate from v2 standards.

**Decision:** This belongs to the **TDMS ecosystem overhaul**, not the PR
ecosystem. The TDMS ecosystem needs its own v2-style overhaul applying the same
patterns (Zod schemas, completeness tiers, atomic writes, health monitoring).

**Scope:** TDMS overhaul is a separate milestone but follows the same playbook.

### Q11: Future Canonization

**Finding:** The patterns from PR ecosystem v2 (Zod schemas, completeness tiers,
JSONL-first, atomic writes, health checkers) need system-wide standardization.

**Decision:** Confirmed. This is the core of the system-wide standardization
effort.

### Q12: Sprint/Debt Placement — NO CHANGES NEEDED

Sprint skill untouched during v2, already JSONL-first. Compatible. No action.

### Q13: Consolidation Compatibility — NO CHANGES NEEDED

Consolidation fully v2-compatible. JSONL-first. No backward compat issues.

### Q14: Tech Debt from Overhaul (10 items)

**Items documented in milestone audit:**

1. Enforcement coverage ceiling at 17.2% (architectural trade-off)
2. ~200 new rules needed for complex patterns (scope limitation)
3. 10 health checkers lack direct unit tests (testing gap)
4. warnings.jsonl doesn't exist until first warning (by design)
5. Override rate reduction not validated in production (measurement gap)
6. Auto-fix limited to comment injection (scope limitation)
7. Health score D (63/100) vs B+ target (external dependency)
8. v1/v2 gradual coexistence, not hard swap (architectural trade-off)
9. Session-start health display unverified in real session (needs verification)
10. Session-end score persistence unverified (needs verification)

**Decision:** These need to be addressed, but as part of the broader
standardization effort, not piecemeal.

---

## Emerging Architecture Vision

### The Framework

Every ecosystem should follow these patterns (established by PR ecosystem v2):

1. **Zod-validated JSONL-first storage** — schemas for every entity type
2. **Completeness tiers** — full/partial/stub with explicit missing fields
3. **Atomic writes** — .tmp + rename, dedup guards
4. **Health monitoring** — checkers with composite scoring, letter grades
5. **Automated enforcement** — multi-mechanism (regex, ESLint, Semgrep, hooks)
6. **Analytics persistence** — JSONL time-series, trend tracking
7. **Warning lifecycle** — create/acknowledge/resolve with cooldowns
8. **Promotion pipeline** — recurrence detection → documentation → enforcement
9. **Testing tiers** — unit, contract, integration, E2E, performance
10. **Session lifecycle integration** — wired into start/end hooks

### Ecosystems Needing This Treatment

| Ecosystem | Current State                           | Standardization Needed |
| --------- | --------------------------------------- | ---------------------- |
| PR Review | v2 COMPLETE (reference impl)            | Tech debt cleanup only |
| TDMS      | Legacy JSONL, no Zod, no completeness   | Full overhaul          |
| Sessions  | Partial automation, manual counter      | Moderate overhaul      |
| Hooks     | Well-automated, no Zod schemas          | Schema standardization |
| Skills    | Validated via hooks, no JSONL tracking  | Design needed          |
| Docs      | Cross-doc deps, no health scoring       | Integration needed     |
| Scripts   | Pattern compliance, no ecosystem health | Integration needed     |

### Scope Assessment

**User assessment:** "HUGE undertaking. Multiple deep plans feeding into a
master deep plan which probably feeds into GSD."

**Proposed approach:**

1. This document = Ideas/Discovery phase
2. Per-ecosystem deep plans for each overhaul
3. Master deep plan for system-wide standardization framework
4. GSD milestone(s) for execution
5. Persistent decision record for cross-cutting architectural decisions

---

## Gap Review Findings (Q1 Extended)

### Orphaned/Unwired Products Found

| Product                          | Location              | Status                        |
| -------------------------------- | --------------------- | ----------------------------- |
| `render-reviews-to-md.js`        | scripts/reviews/dist/ | Built, tested, orphaned       |
| `ecosystem:audit:all` npm script | package.json          | Dead placeholder              |
| `lighthouse` npm script          | package.json          | Defined, never runs           |
| `docs:lint` npm script           | package.json          | Defined, results not surfaced |
| `docs:external-links` npm script | package.json          | Link checker, not integrated  |
| `learning:dashboard` npm script  | package.json          | Rarely invoked                |

### Gap Review Still Needed

A full multi-faceted gap review has NOT been completed. The above are findings
from the 8 research agents. A dedicated gap review should search for:

- [ ] All scripts in `scripts/` not referenced in package.json
- [ ] All package.json scripts never invoked by hooks, skills, or CI
- [ ] All skill directories with no invocation evidence
- [ ] All JSONL files with no reader/consumer
- [ ] All state files with no cleanup/rotation mechanism
- [ ] All health checkers not integrated into composite scoring
- [ ] All CI workflow jobs that never run (conditional, dead branches)
- [ ] All planned features in ROADMAP.md with no implementation
- [ ] All documented procedures with no skill/automation backing
- [ ] All test files testing code that no longer exists

---

## Structural Decisions (Session #201, Pre-Deep-Plan)

**Where work lives:** `.planning/system-wide-standardization/` for now. NOT in
GSD until much further along. Naming and folder placement will be decided as
part of a canon ecosystem standard.

**Documentation strategy:** A dedicated docs folder within this planning area.
This process will generate enormous documentation — start organized from day
one. Copies of source documents (framework repo decisions, ecosystem v2 plans,
etc.) should live in a dedicated reference location.

**First deep-plan scope:** Ecosystem Mapping + Sequencing. Includes ingestion of
framework repo decisions/plans as crucial reference material.

**Framework repo:** READ-ONLY reference during deep-plan. No simultaneous sync.

## Immediate Action Items (This Session)

1. **Save this document** — DONE
2. **Deep-plan: Ecosystem Mapping** — NEXT (user invoking)
3. Wire `render-reviews-to-md.js` into archival pipeline — DEFERRED to plan
4. Clean up dead npm scripts — DEFERRED to plan
5. Begin full gap review — PART OF deep-plan
6. Verify session-start health display (tech debt item #9) — DEFERRED
7. Verify session-end score persistence (tech debt item #10) — DEFERRED

## Next Steps (Future Sessions)

1. Complete multi-faceted gap review
2. Design `/pipeline-walkthrough` skill (Q5)
3. Research review-mining gap integration (Q3)
4. Design unified analytics architecture (Q4/Q9)
5. Per-ecosystem deep plans for standardization
6. Master deep plan for system-wide framework
7. GSD milestone creation

---

## Decision Log

| #   | Date       | Decision                                                                                 | Rationale                                         |
| --- | ---------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | 2026-03-02 | PR ecosystem v2 patterns become system-wide standard                                     | Proven architecture, 59/59 requirements met       |
| 2   | 2026-03-02 | `/ecosystem-health` name stays (it IS system-wide)                                       | 10 checkers cover all ecosystems, not just PR     |
| 3   | 2026-03-02 | MASTER_DEBT.jsonl overhaul scoped to TDMS ecosystem                                      | Different operational domain, same playbook       |
| 4   | 2026-03-02 | Manual steps OK if prompted/surfaced                                                     | User preference: reminders > forced automation    |
| 5   | 2026-03-02 | Pipeline testing becomes a skill                                                         | Compaction-safe, resumable, scoped or system-wide |
| 6   | 2026-03-02 | System-wide standardization = GSD milestone(s)                                           | Too large for single plan; needs master plan      |
| 7   | 2026-03-02 | Persistent decision record for cross-cutting decisions                                   | Prevents context loss across sessions/compactions |
| 8   | 2026-03-02 | Keep out of GSD until much further along                                                 | Canon/naming not yet decided                      |
| 9   | 2026-03-02 | Dedicated docs folder for this initiative                                                | Massive documentation expected                    |
| 10  | 2026-03-02 | Framework repo = READ-ONLY reference for now                                             | No simultaneous sync                              |
| 11  | 2026-03-02 | First deep-plan = ecosystem mapping + ingestion                                          | Roadmap for the roadmap                           |
| 12  | 2026-03-02 | CANON = Ecosystem Zero (meta-system above all others)                                    | Defines what an ecosystem IS                      |
| 13  | 2026-03-02 | 13 cross-cutting subsystems (was 9, added versioning, error handling, naming, lifecycle) | CANON standardizes all of these                   |
| 14  | 2026-03-02 | Configuration = single parameterization file concept                                     | Replace hardcoded values across 70+ scripts       |
| 15  | 2026-03-02 | Planning (deep-plan, GSD) = canonizable system, backbone for everything                  | Standardized in perpetuity                        |
| 16  | 2026-03-02 | State saving rules to be canonized                                                       | Guard against compaction                          |
| 17  | 2026-03-02 | PR creep guardrail needed SOON                                                           | Commit counter hook: warn 10, block 25            |
| 18  | 2026-03-02 | Lifecycle management added to cross-cutting subsystems                                   | Future-proofing                                   |
| 19  | 2026-03-03 | Dual-environment parity is a system requirement                                          | Work (Desktop) + Home (CLI) must both work        |
| 20  | 2026-03-03 | PR creep guardrail must detect default branch dynamically (main/master/remote)           | Bug: hardcoded `main` silently failed on `master` |
| 21  | 2026-03-03 | All hooks/scripts must be environment-agnostic (no hardcoded branch names, paths, tools) | Dual-env parity; proven by PR creep bug           |
| 22  | 2026-03-03 | Desktop sessions need proactive `/checkpoint` at milestones (no PreCompact on timeout)   | Timeout kills session without hook trigger        |

---

## Dual-Environment Configuration (Decision #19, Session #202)

The developer operates from **two distinct environments**. All system
infrastructure (hooks, scripts, skills, procedures) must work identically in
both. This is a cross-cutting requirement that affects every ecosystem.

### Environment A: Work — Claude Code Desktop (Linux Sandbox)

| Attribute            | Value                                        |
| -------------------- | -------------------------------------------- |
| **Interface**        | Claude Code Desktop (web-based)              |
| **Platform**         | Linux sandbox                                |
| **Local branch**     | `master` (default)                           |
| **Context risk**     | **Timeouts** — hard session kill, no hooks   |
| **Compaction**       | Also possible (hooks DO fire)                |
| **MCP secrets**      | Encrypted — need decrypt at session start    |
| **Checkpoint needs** | Proactive manual `/checkpoint` at milestones |

### Environment B: Home — Claude Code CLI (Windows)

| Attribute            | Value                                        |
| -------------------- | -------------------------------------------- |
| **Interface**        | Claude Code CLI (terminal)                   |
| **Platform**         | Windows                                      |
| **Local branch**     | May differ from Work — detect dynamically    |
| **Context risk**     | **Compaction** — PreCompact hook fires       |
| **Timeouts**         | Less common (CLI is more persistent)         |
| **MCP secrets**      | TBD — may already be decrypted               |
| **Checkpoint needs** | Standard (PreCompact handles most cases)     |
| **Shell**            | Windows shell — POSIX hooks run via Git Bash |

### Parity Requirements

1. **Branch detection**: Never hardcode `main` or `master` — always detect
   dynamically (proven by PR creep guardrail bug, Decision #20)
2. **Hook compatibility**: All hooks must work under both Desktop and CLI
   execution models
3. **Timeout resilience**: Desktop needs proactive state saves that CLI gets
   automatically via PreCompact
4. **Path independence**: No assumptions about absolute paths, home directories,
   or tool locations
5. **Secret management**: Both environments need the decrypt-secrets flow for
   MCP tokens
6. **Cross-platform**: Linux (Work) vs Windows (Home) — shell scripts must be
   POSIX-compatible (Git Bash on Windows), avoid Linux-only tools/paths
7. **Local branch names**: May differ between environments — reinforces dynamic
   detection requirement (Decision #20)

### Known Differences to Test

- [ ] Pre-commit hook `main` vs `master` — FIXED (Session #202)
- [ ] Pre-push hook — check for same hardcoded branch assumptions
- [ ] SessionStart hooks — verify both environments trigger correctly
- [ ] `/checkpoint` behavior — confirm it works on Desktop
- [ ] MCP token state — document which env has persistent vs encrypted tokens

---

## Raw Research Agent Summaries

### Q1 Agent — JSONL vs MD Generation

- TDMS: Fully automated JSONL→MD via generate-views.js (4 view files)
- Reviews: render-reviews-to-md.js exists but orphaned (not in any pipeline)
- Consolidation: Produces markdown (CODE_PATTERNS.md) from JSONL source
- Archives: Still manual markdown, not auto-generated

### Q2 Agent — Manual Steps Audit

- 42 manual invocation points identified
- Tier A: 30 steps within skill protocols
- Tier B: 3 post-skill consolidation steps
- Tier C: 12 session lifecycle steps
- Key discrepancy: Some "manual" steps actually auto-run via hooks
- Top automation candidates: session counter, TDMS entries, suppression sync

### Q3 Agent — Review Mining Capabilities

- 4 active mining tools (promote-patterns, learning-effectiveness,
  lessons-surface, consolidation)
- 150 total review entries (43 active + 107 archived)
- 8 gaps identified: cross-archive trends, PR clustering, fuzzy matching,
  lifecycle tracking, session-level mining, historical comparison, variant
  tracking, consolidated dashboard
- Rich data available but underutilized

### Q4 Agent — Analytics Surfacing Map

- 51+ npm scripts across 7 categories
- 7 analytics surfaces: session hooks, pre-commit, pre-push, CI, weekly, manual,
  audit skills
- 24 state files in .claude/state/
- 6 dead/minimal scripts found
- Complete invocation decision tree documented
- All analytics accounted for

### Q6 Agent — Semgrep Investigation

- All issues resolved (R5: --error removal, R7: YAML quoting, R8: guard
  patterns)
- 20 custom rules across correctness/security/style
- Test fixtures in tests/semgrep/ with annotation format
- No outstanding warnings

### Q8 Agent — Ecosystem-Health Naming Scope

- 10 health checkers cover ALL ecosystems (not just PR)
- 8 scoring categories, 13 dashboard dimensions
- Would need ~20 file changes to rename (but shouldn't rename)
- Planning docs confirm "full ecosystem health" was intentional scope

### Q9+12+13 Agent — Health/Sprint/Consolidation

- Health: 10 checkers, composite scoring, separate from alerts
- Sprint: Untouched during v2, already JSONL-first, compatible
- Consolidation: Fully v2-compatible, JSONL-first, atomic state

### Q10+14 Agent — DEBT Schema + Tech Debt Inventory

- MASTER_DEBT.jsonl: Legacy schema, no Zod, no completeness tiers
- 10 tech debt items from v2 overhaul (architectural trade-offs, testing gaps,
  measurement gaps)
- None are blockers; all are documented trade-offs or deferred improvements

---

## Two-Repo Foundation

### Source 1: sonash-v0 (this repo)

- PR Ecosystem v2 = reference implementation (proven patterns)
- All planning artifacts: `.planning/ecosystem-v2/`, diagnosis, discovery QA,
  phase plans, milestone audit, PR_ECOSYSTEM_V2_CHANGELOG.md
- 7 ecosystem audit skills already exist
- 51+ analytics scripts, 10 health checkers, 24 state files

### Source 2: framework repo

- GitHub: `jasonmichaelbell78-creator/framework`
- Purpose: Reusable dev workflow framework extracted from sonash-v0
- Current state: C+ readiness (62/100), ~55% migrated, GSD Phase 1 not started
- Has comprehensive planning: 68 decisions, 42 gaps, 10-phase plan, 39 steps
- 53 skills, 12 agents, 12 hooks, 23 ESLint rules bootstrapped
- Missing: framework.config.json, CANON standards, sanitization
- Key: This is a META-FRAMEWORK for development workflows, not an app template

### Relationship Between Repos

- sonash-v0 = PROVING GROUND (where patterns are discovered and battle-tested)
- framework = EXTRACTION TARGET (where proven patterns become reusable
  standards)
- System-wide standardization flows BOTH ways:
  - sonash discoveries → framework standards (upstream)
  - framework standards → sonash implementation (downstream)

### User Vision (Session #201)

- Everything in both repos is a resource for the system framework project
- Need clear hierarchy: EVERYTHING fits within ecosystems (existing or new)
- The app itself is its own ecosystem ("part of but apart")
- Process layer vs app layer distinction is critical
- Multi-deep-plan → master deep plan → GSD
- First deep-plan = ingestion of all resources + full system discovery
- Constant testing and auditing once underway

### Ecosystem Hierarchy (Draft)

**Process Layer Ecosystems:**

- PR Review (v2 complete in sonash, reference implementation)
- TDMS (legacy schema, needs overhaul)
- Sessions (partial automation)
- Hooks (well-automated, no Zod)
- Skills (validated, no JSONL tracking)
- Docs (cross-doc deps, no health scoring)
- Scripts (pattern compliance, no ecosystem health)
- CI/CD (workflows, not yet ecosystem-ified)
- Analytics/Health (partially unified)

**App Layer Ecosystems:**

- Application (Next.js app code — "part of but apart")
- Firebase/Backend (Cloud Functions, Firestore, Auth)
- UI/Frontend (components, design system)

**Meta Layer:**

- Framework Standards (CANON, config, schemas)
- Quality Gates (pre-commit, pre-push, CI)
- Agent Orchestration (agents, teams, skills)

---

## Deep-Plan: Ecosystem Mapping — All Decisions (D1-D49)

The following 49 decisions were made during the Deep Plan: System-Wide
Standardization — Ecosystem Mapping process. They are organized by batch and
include full detail: ID, decision name, choice, rationale, and any
sub-decisions, amendments, user overrides, or schemas.

### Batch 1: Architecture & Foundation (D1-D7)

**D#1: CANON file location**

- **Choice:** `.canon/` at repo root — new top-level directory
- **Rationale:** Meta-system deserves top-level visibility, not buried under
  .planning/ or docs/

**D#2: Ecosystem definition format**

- **Choice:** Registry JSONL (`.canon/ecosystems.jsonl`) + per-ecosystem detail
  files
- **Rationale:** JSONL = canonical/AI-consumed, MD = human views generated from
  JSONL. Core tenet of the system moving forward.

**D#3: Maturity model**

- **Choice:** Hybrid: completeness tier checklist drives computed level (L0-L5)
- **Rationale:** Makes 'what's missing' obvious and progress measurable.
  Concrete capabilities compute to a level.

**D#4: Cross-cutting subsystem mapping**

- **Choice:** Per-ecosystem files are source of truth + generated matrix view
- **Rationale:** Follows JSONL-first → generated-views pattern. Each ecosystem
  knows its own subsystems, matrix is computed.

**D#5: Configuration parameterization**

- **Choice:** Global defaults + per-ecosystem cascade/override (CSS-like)
- **Rationale:** Avoids 70+ hardcoded values while letting ecosystems specialize
  where needed.

**D#6: Sequencing strategy**

- **Choice:** Dependency graph (CANON first) with maturity as tiebreaker
  (highest first)
- **Rationale:** Build momentum: early wins validate the framework before
  tackling hard stuff. CANON → near-compliant → major overhauls.

**D#7: This deep-plan's deliverable**

- **Choice:** Full ecosystem catalog + maturity assessments + sequenced plan +
  CANON spec
- **Rationale:** We have the research (500+ components). Comprehensive output
  avoids another discovery pass.

### Batch 2: Scale, Scope & Maturity (D8-D13)

**D#8: Maturity level definitions (L0-L5)**

- **Choice:** Approved scale: L0=Nonexistent, L1=Identified, L2=Structured,
  L3=Monitored, L4=Enforced, L5=Canonized
- **Rationale:** Clear progression. L5 = all applicable subsystems canonized
  (not all 16 if some don't apply to ecosystem).
- **Sub-decisions:**
  - **L5 for everything:** L5 is the north star, not the exit criteria. Most
    ecosystems target L3-L4 baseline. L5 means all _applicable_ subsystems
    canonized — per-ecosystem required-vs-optional mapping.
  - **Plan structure:** Plan-as-you-go with sequenced placeholders. This deep
    plan produces catalog + sequence. Each ecosystem gets its own deep-plan when
    its turn comes. Pre-planning all 13 now would produce stale plans by
    ecosystem #8.

**D#9: Completeness checklist items**

- **Choice:** 16-item checklist (original 13 + 3 gap-fills: inter-ecosystem
  contracts, rollback/recovery, deprecation policy)
- **Rationale:** User liked original 13, accepted 3 additions to close gaps.
- **Checklist:**
  1. Zod schemas — for all data structures
  2. JSONL storage — canonical data in JSONL format
  3. Generated views — MD/JSON views computed from JSONL
  4. Health monitoring — at least one health checker with metrics
  5. Enforcement manifest — rules defining what's blocking vs warning
  6. Testing — unit + integration tests for ecosystem scripts
  7. Documentation — ecosystem-level docs
  8. State persistence — survives compaction / session boundaries
  9. Error handling — standardized error patterns
  10. Naming compliance — follows CANON naming conventions
  11. Configuration — uses central config (not hardcoded values)
  12. Lifecycle hooks — creation, update, archival, deletion defined
  13. Versioning — schema/data migration strategy
  14. Inter-ecosystem contracts — interfaces between dependent ecosystems
  15. Rollback/recovery — revert to prior state after bad migration
  16. Deprecation policy — how old schemas/APIs/patterns are sunset

**D#10: Subsystem standardization depth**

- **Choice:** Pattern-level: CANON defines interface + reference pattern (PR
  Review v2 as exemplar)
- **Rationale:** Templates too rigid, interface-only too ambiguous. Reference
  patterns formalize what already exists.

**D#11: Ecosystem boundary rules**

- **Choice:** Primary ownership + consumer references (no superseding ecosystem)
- **Rationale:** Primary = maintenance responsibility, not authority hierarchy.
  Shared components have one owner, many consumers. CANON defines rules but
  doesn't own other ecosystems' components.

**D#12: CANON spec scope in this plan**

- **Choice:** Working draft (structure + maturity model + subsystem interfaces +
  registry schema) with room for growth built in everywhere
- **Rationale:** Enough to start building CANON. Ecosystem assessments separate.
  Room for growth is a core tenet — nothing ships as a dead end.
- **Sub-decisions:**
  - **Upgradeability:** Core tenet: nothing not-upgradeable. Ease the upgrade
    process. Everything must have room for growth. Things change all the time.

**D#13: CANON versioning**

- **Choice:** Semver (start at 0.1.0, promote to 1.0.0 after 2-3 ecosystem
  validations)
- **Rationale:** CANON is infrastructure others depend on. Breaking changes need
  explicit migration guidance.

### Batch 3+4: Schema & Interface Design (D14-D27)

**D#14: Enforcement severity levels**

- **Choice:** 4-tier: error (blocking), warning (non-blocking + logged), info
  (displayed only), silent (suppressed)
- **Rationale:** Granular enough without being complex. Silent tier handles
  known-accepted items.

**D#15: Enforcement gate placement**

- **Choice:** Tiered: pre-commit (fast checks), pre-push (full validation), PR
  (comprehensive)
- **Rationale:** Fast feedback for quick checks, thorough validation before
  sharing. Each gate has appropriate scope.

**D#16: Naming convention depth**

- **Choice:** Files + exports + JSONL fields (3-layer naming standard)
- **Rationale:** Covers the surfaces that matter most. Full taxonomy is
  overkill, files-only misses the data layer.

**D#17: Health checker interface**

- **Choice:** Current interface + trend data + recommendations (enhanced)
- **Rationale:** Trend enables progress tracking over time. Recommendations make
  health checks actionable, not just diagnostic.
- **Amendment (Batch 4T):** Health checker implementations MUST be Node.js (T7
  platform-agnostic). Added during tenets retroactive review.

**D#18: Dashboard generation trigger**

- **Choice:** Hybrid: auto-generate on data change + on-demand for full rebuild
- **Rationale:** Stale dashboards are useless, but full rebuild on every change
  is wasteful. Incremental auto + manual full.

**D#19: Migration strategy for existing ecosystems**

- **Choice:** Pilot + rollout: validate with 2-3 near-compliant ecosystems, then
  roll out to rest
- **Rationale:** Validates CANON itself before forcing it on complex ecosystems.
  Early pilots surface spec issues cheaply.

**D#20: Dependency declaration method**

- **Choice:** Both: per-ecosystem declares own deps + central registry
  aggregates all
- **Rationale:** Per-ecosystem is source of truth (consistent with Decision #4).
  Central view is generated/computed for cross-cutting analysis.

**D#21: .canon/ directory structure**

- **Choice:** Hybrid: CANON infrastructure in categorized dirs + per-ecosystem
  dirs for assessment/detail data
- **Rationale:** Best of both worlds. CANON's own config/schemas/reports
  organized by function. Each ecosystem's data co-located in its own dir.
- **Structure:**
  - `.canon/canon.json` — CANON meta (version, config)
  - `.canon/tenets.jsonl` — Core tenets (first CANON artifact — CANON defines
    itself first)
  - `.canon/tenets.md` — Generated human-readable tenet view
  - `.canon/ecosystems.jsonl` — Registry (one line per ecosystem)
  - `.canon/schemas/` — Zod schemas, JSON schemas
  - `.canon/config/` — Global defaults, override rules
  - `.canon/reports/` — Generated dashboards/matrix views
  - `.canon/ecosystems/{id}/` — Per-ecosystem detail + assessment data

**D#22: Ecosystem registry JSONL field depth**

- **Choice:** Extensible core: required core fields + optional fields with
  defaults. Schema validates required, accepts extra.
- **Rationale:** Registry line is summary/index. Detail files have full picture.
  Room for growth — new fields without breaking existing data.

**D#23: Maturity assessment storage**

- **Choice:** Per-ecosystem files: `.canon/ecosystems/{id}/assessment.jsonl` —
  co-located with ecosystem data
- **Rationale:** Keeps ecosystem data co-located (consistent with Decision #4).
  Each ecosystem owns its assessment. Matrix/summary views generated.

**D#24: Subsystem interface contract format**

- **Choice:** Zod as source of truth → JSON Schema auto-generated for external
  tooling. JSONL tracks implementation status.
- **Rationale:** Follows established pattern: source of truth (Zod) → generated
  views (JSON Schema). Plus JSONL tracks adoption per ecosystem.

**D#25: Health report output format**

- **Choice:** JSON summary envelope (score, trend, metadata) + JSONL findings
  stream (one finding per line)
- **Rationale:** Summary is single object for dashboards. Individual findings
  are JSONL (appendable, processable). Best of both.

**D#26: Enforcement manifest schema**

- **Choice:** Single JSONL file per ecosystem, each rule has `tier` + `severity`
  fields
- **Rationale:** Single file easier to maintain/query. Tier
  (pre-commit/pre-push/PR) + severity (error/warning/info/silent from #14) per
  rule. Tools filter by tier at runtime.

**D#27: Generated view production method**

- **Choice:** Standardized script interface: each view is a script with contract
  (reads JSONL → outputs MD). Standard CLI interface (--input, --output).
- **Rationale:** Standardized interface, not implementation. Scripts can be
  simple or complex — the contract is what's standardized. Follows Decision #10
  pattern-level standardization.
- **Amendment (Batch 4T):** Scripts MUST be Node.js (T7 platform-agnostic) and
  idempotent — same input always produces same output with no side effects
  (T12). Added during tenets retroactive review.

### Batch 4T: Core Tenets Discovery (D28-D32)

**D#28: Core tenets discovery phase — inserted before Batch 5**

- **Choice:** Pause schema batches. Discover, formalize, and lock all core
  tenets BEFORE continuing with ecosystem assessments.
- **Rationale:** Core tenets guide everything downstream. Locking schemas before
  fully articulating the principles that shape them is backwards. Two tenets
  (automation over discipline, no forgettable processes) had already fallen
  through the cracks, proving the need.

**D#29: Tenet candidate disposition — promote, merge, demote**

- **Choice:** Promote 6 candidates to formal tenets, merge 2 into existing
  tenets, demote 2 to implementation patterns.
- **Rationale:** Tenets are 'why' principles that guide decisions. Patterns are
  'how' implementations. Cascade/override (D#5) and progressive disclosure are
  patterns, not principles.
- **Promoted:**
  - source_of_truth_generated_views
  - single_ownership_many_consumers
  - contract_over_implementation
  - validate_before_scaling
  - crash_proof_state
  - declarative_over_imperative
- **Merged:**
  - nothing_gets_lost → Merged into renamed tenet
    'capture_everything_surface_what_matters' (combines visibility +
    institutional memory)
  - discoveries_feed_forward → Merged as sub-principle of 'plan_as_you_go'
    (knowledge compounds, learnings from ecosystem #3 inform #4)
- **Demoted:**
  - cascade_override → Implementation pattern (Decision #5), not a guiding
    principle. Referenced by tenets but isn't one.
  - progressive_disclosure → UX/design guideline for tooling. L0-L5 and tiered
    gates implement it, but it's not why they exist.

**D#30: New tenets — 3 missing + 1 formalized**

- **Choice:** Add platform_agnostic_by_default, idempotent_operations,
  fail_loud_fail_early. Formalize automation_over_discipline (was discussed but
  never recorded).
- **Rationale:** Platform-agnostic: dual-environment (Linux sandbox + Windows
  CLI) is a real constraint with existing breakage. Idempotency: prevents data
  corruption from re-runs (MASTER_DEBT race condition is a violation). Fail
  loud/early: complements visibility — errors must scream, not whisper.
  Automation over discipline: if it relies on human memory, it WILL fail.
- **Dual-environment impact:**
  - Affected decisions: D#15 enforcement gates, D#17 health checkers, D#21
    directory structure, D#27 generated view scripts
  - Implications: All CANON scripts Node.js (not bash). Forward-slash paths. LF
    line endings. No symlinks. No platform-specific env vars without
    cross-platform fallback.
  - Existing breakage: CROSS_PLATFORM_SETUP.md references removed sync script, 3
    bash-only scripts have no Windows equivalent, Path separators differ across
    environments

**D#31: Tenet organization — flat with categories**

- **Choice:** Option A: Flat list with 4 categories (Foundation, Design,
  Operations, Process). No parent-child hierarchy.
- **Rationale:** At 16 tenets, a flat list becomes a wall. Categories make it
  scannable. No hierarchy avoids 'is X a child of Y?' debates. Easy to add new
  tenets to a category.

**D#32: Tenets as first CANON artifact**

- **Choice:** `.canon/tenets.jsonl` (source of truth) + `.canon/tenets.md`
  (generated view). First artifact CANON produces about itself.
- **Rationale:** CANON defines itself first. Tenets depend on nothing else.
  Dog-foods JSONL-first pattern. Each line: {id, category, name, statement,
  evidence[], added, version}.
- **Schema:**
  - `id`: T1-T16
  - `category`: foundation|design|operations|process
  - `name`: snake_case identifier
  - `statement`: Full tenet statement
  - `evidence`: Array of decision IDs that informed/embody this tenet
  - `added`: ISO date
  - `version`: 0.1.0 (inherits CANON version)

### Batch 5A: Ecosystem Assessments 1-5 (D33-D37)

**D#33: PR Review: Current and target maturity**

- **Choice:** Current L4 (Enforced) → Target L5 (Canonized)
- **Rationale:** Reference implementation. 10/16 present, 4 partial, 2 absent.
  First ecosystem to reach L5 — validates CANON framework itself before applying
  to others.
- **Effort:** S
- **Staging:** Direct (L4→L5)
- **Assessment summary:** Strongest ecosystem. 56 test files, 10 health
  checkers, multi-mechanism enforcement. Gaps are post-v2 items (rollback,
  deprecation policy) and formalization (naming validation pending CANON,
  contracts pending format definition).

**D#34: TDMS: Current and target maturity**

- **Choice:** Current L2 (Structured) → Target L5 (Canonized)
- **Rationale:** USER OVERRIDE: TDMS feeds into everything, MASTER_DEBT has
  thousands of entries, too critical to leave below L5. Acknowledged as massive
  effort across 37 scripts.
- **Effort:** XL (L2→L5 across 37 scripts with thousands of data entries)
- **Staging:** Staged: L2→L3 (Zod+monitoring) → L4 (enforcement) → L5
  (canonized). Each stage is L effort.
- **Assessment summary:** 3/16 present, 8 partial, 5 absent. No Zod schemas, no
  enforcement manifest, no versioning. 37 scripts with inconsistent patterns.
  Massive scope but critical system.
- **User override:** Yes (original recommendation was Target L3→L4 staged)

**D#35: Sessions: Current and target maturity**

- **Choice:** Current L1 (Identified) → Target L3 (Monitored)
- **Rationale:** Cross-cutting infrastructure — every ecosystem depends on
  session state being reliable. Schemas + JSONL + monitoring gives reliability
  layer. Full enforcement (L4) too aggressive for infrastructure that needs
  graceful degradation.
- **Effort:** M
- **Staging:** Direct (L1→L3)
- **Assessment summary:** 2/16 present, 8 partial, 6 absent. State persistence
  works, lifecycle defined, but nothing else formalized. Runs on convention.

**D#36: Hooks: Current and target maturity**

- **Choice:** Current L3 (Monitored) → Target L4 (Enforced)
- **Rationale:** Infrastructure that other ecosystems depend on. Strong
  operational automation, good monitoring. Delta is mainly Zod schemas +
  formalized contracts + versioning.
- **Effort:** M
- **Staging:** Direct (L3→L4)
- **Assessment summary:** 5/16 present, 6 partial, 5 absent. Strong enforcement
  (IS the enforcement system for the repo), good monitoring via ecosystem audit.
  Gaps in formalization.

**D#37: Skills: Current and target maturity**

- **Choice:** Current L1 (Identified) → Target L3 (Monitored)
- **Rationale:** USER OVERRIDE from L2→L3 staged to direct L3. Large undertaking
  across 65 skills. Skill-audit skill exists and was recently used on
  skill-creator and deep-plan with great results — that process should be
  leveraged during ecosystem standardization.
- **Effort:** L (65 skills, each needs ecosystem audit + standardization)
- **Staging:** Direct (L1→L3). Skill-audit skill drives per-skill assessment.
- **Assessment summary:** 0/16 present, 8 partial, 8 absent. 65 skills,
  structurally validated but zero data tracking, zero formalized contracts, zero
  lifecycle management.
- **User override:** Yes (original recommendation was Target L2→L3 staged)
- **User note:** Skill-audit skill (recently created) follows processes enacted
  in refined skill-creator and deep-plan skills. All skills will need ecosystem
  auditing.

### Batch 5B: Ecosystem Assessments 6-10 (D38-D43)

**D#38: Alerts: Current and target maturity**

- **Choice:** Current L2 (Structured) → Target L4 (Enforced)
- **Rationale:** Mid-session alerting is a critical operational layer. Has 36
  alert categories, scoring, benchmarks, trend tracking. Needs Zod schemas,
  enforcement manifest, versioning, and inter-ecosystem contracts formalized.
- **Effort:** M
- **Staging:** Staged: L2→L3 (schemas + monitoring) → L4 (enforcement manifest +
  gates)
- **Assessment summary:** 4/16 present, 7 partial, 5 absent. Strong operational
  tooling but no schema validation, no enforcement manifest, no versioning
  strategy.

**D#39: Scripts: Current and target maturity**

- **Choice:** Current L2 (Structured) → Target L3 (Monitored)
- **Rationale:** 300+ scripts across the repo. Script ecosystem audit exists but
  infrastructure lacks formal schemas, consistent error handling, and
  monitoring. L3 establishes baseline.
- **Effort:** L (300+ scripts to audit and standardize)
- **Staging:** Direct (L2→L3)
- **Assessment summary:** 3/16 present, 7 partial, 6 absent. Large volume,
  inconsistent patterns, some scripts unreachable. Ecosystem audit skill exists.

**D#40: Docs: Current and target maturity**

- **Choice:** Current L2 (Structured) → Target L3 (Monitored)
- **Rationale:** Documentation ecosystem has generation pipelines, index sync,
  templates. Needs monitoring for staleness, schema validation for doc metadata,
  and formalized contracts with other ecosystems.
- **Effort:** M
- **Staging:** Direct (L2→L3)
- **Assessment summary:** 3/16 present, 8 partial, 5 absent. Generation exists
  but sync checking is fragile. Doc-ecosystem-audit skill exists.

**D#41: CI/CD: Current and target maturity**

- **Choice:** Current L1 (Identified) → Target L3 (Monitored)
- **Rationale:** GitHub Actions workflows exist but lack formal ecosystem
  treatment. Pre-commit/pre-push hooks are in Hooks ecosystem. CI/CD covers the
  pipeline beyond local gates — build, deploy, integration checks.
- **Effort:** M
- **Staging:** Staged: L1→L2 (structure + schemas) → L3 (monitoring + health)
- **Assessment summary:** 1/16 present, 6 partial, 9 absent. Workflows exist but
  minimal formalization. Strong dependency on Hooks ecosystem.

**D#42: Analytics: Current and target maturity**

- **Choice:** Current L1 (Identified) → Target L3 (Monitored)
- **Rationale:** Metrics, trend data, benchmarks scattered across health
  checkers and audit outputs. No unified analytics layer. L3 establishes
  schemas, monitoring, and consolidation.
- **Effort:** M
- **Staging:** Staged: L1→L2 (identify + structure all metric sources) → L3
  (monitoring + dashboards)
- **Assessment summary:** 1/16 present, 5 partial, 10 absent. Metric data exists
  in health checkers and audits but no unified system. Cross-cuts many
  ecosystems.

**D#43: Batch 5B assessment complete — ecosystems 6-10**

- **Choice:** 5 ecosystems assessed: Alerts (L2→L4, M staged), Scripts (L2→L3,
  L), Docs (L2→L3, M), CI/CD (L1→L3, M staged), Analytics (L1→L3, M staged)
- **Rationale:** Middle-tier ecosystems. None at L0, none targeting L5. All need
  schema formalization and monitoring as baseline.

### Batch 5C: Final Ecosystems + CANON (D44-D49)

**D#44: Batch 5C begins — ecosystems 11-13 + CANON self-assessment**

- **Choice:** Assessing: Planning/Roadmap, Testing, Archival/Rotation, and CANON
  (Ecosystem Zero)
- **Rationale:** Final ecosystem assessment batch. Includes CANON
  self-assessment which is unique — CANON assessing itself.

**D#45: Planning ecosystem renamed to Roadmap & Execution**

- **Choice:** Rename 'Planning' → 'Roadmap & Execution'. Planning-as-skill stays
  in Skills ecosystem. Roadmap system, input pipelines, sprint execution = this
  ecosystem.
- **Rationale:** USER INSIGHT: Planning is a skill (deep-plan, GSD discovery).
  The SYSTEM is the roadmap — where work items land, get prioritized, get
  executed. Critical distinction. The ecosystem is the hub, not the skill.
  Multiple avenues must feed into it automatically (T8 automation over
  discipline).
- **User insight:** Yes
- **Boundary definition:**
  - **In scope:** ROADMAP.md artifact and its structure/maintenance, All input
    pipelines (debt, audits, deep-plan decisions, feature requests, architecture
    decisions), Sprint planning and execution lifecycle, task-next dependency
    resolution, GSD execution handoff, Feedback loops (sprint outcomes →
    planning)
  - **Out of scope but feeds in:** deep-plan skill (assessed in Skills
    ecosystem, feeds decisions INTO roadmap), GSD discovery/planning agents
    (skill work, feeds INTO roadmap), TDMS/MASTER_DEBT (assessed in TDMS
    ecosystem, feeds debt INTO roadmap), Audit findings (assessed in respective
    audit ecosystems, feed INTO roadmap)
- **Gap identified:** Non-debt input pipelines are MISSING. TDMS is the only
  semi-automated route. Audit findings, deep-plan decisions, feature planning,
  architecture decisions all require manual ROADMAP editing. T8 violation.

**D#46: Roadmap & Execution: Current and target maturity**

- **Choice:** Current L2 (Structured) → Target L3 (Monitored)
- **Rationale:** L3 is correct target — establishes monitoring + input pipeline
  contracts. Hub ecosystem that everything feeds into. Non-debt input pipelines
  are the critical gap. Priority elevated due to hub nature — if we standardize
  13 ecosystems, each generates work items that need automated intake.
- **Effort:** L (input pipeline contracts + sprint automation + ROADMAP schema)
- **Staging:** Direct (L2→L3). Focus on input pipeline automation.
- **Assessment summary:** ROADMAP.md exists with sprint structure. GSD agents
  (11) operational. Sprint skill (6 phases) functional. task-next works. But:
  non-debt input pipelines missing, no schema validation on ROADMAP structure,
  no monitoring of pipeline health.
- **Priority elevated:** Yes
- **Priority reason:** Hub ecosystem — every other ecosystem generates work
  items that need automated intake. Must be high in implementation order.

**D#47: Testing: Current and target maturity**

- **Choice:** Current L3 (Monitored) → Target L4 (Enforced)
- **Rationale:** Testing infrastructure has good coverage (500+ test files),
  pre-commit enforcement, CI integration. Delta to L4 is formalized enforcement
  manifest, Zod schemas for test config, and inter-ecosystem test contracts.
- **Effort:** M
- **Staging:** Direct (L3→L4)
- **Assessment summary:** 6/16 present, 6 partial, 4 absent. Strong operational
  testing but lacks formalized enforcement manifest and schema validation.

**D#48: Archival/Rotation: Current and target maturity**

- **Choice:** Current L3 (Monitored) → Target L4 (Enforced)
- **Rationale:** Archival patterns exist (JSONL rotation, review archival, state
  cleanup). Monitoring via health checkers. Delta to L4 is enforcement gates,
  Zod schemas for archive format, and lifecycle hook formalization.
- **Effort:** M
- **Staging:** Direct (L3→L4)
- **Assessment summary:** 5/16 present, 6 partial, 5 absent. Rotation works
  operationally but lacks formal enforcement and schema validation.

**D#49: CANON (Ecosystem Zero): Self-assessment and enforcement model**

- **Choice:** Current L0 (Nonexistent) → Target L5 (Canonized). STOUT
  enforcement system required — both internal (CANON self-protection) and
  downstream (cascade propagation to all 13 dependent ecosystems).
- **Rationale:** USER DIRECTIVE: L5+++ with emphasis on 'stout system.' CANON is
  the meta-system — everything builds from it. Enforcement must be
  bidirectional: (1) CANON changes are gated and validated, (2) downstream
  ecosystems are notified, migrated, and held to new standards. T1 (CANON is
  Ecosystem Zero), T8 (automation over discipline), T11 (fail loud fail early)
  all converge here.
- **Effort:** L (foundational but well-scoped — CANON defines itself first,
  D12/D32)
- **Staging:** Direct (L0→L5). First ecosystem standardized (D6).
  Self-dogfooding validates the framework.
- **Enforcement model:**
  - **Internal self-protection:**
    - pre-commit: Schema validation on .canon/ files, tenet changes require
      version bump, no orphaned references
    - pre-push: Migration script required for breaking changes, all tenet
      references valid across codebase
    - review gate: CANON changes get elevated review (not any PR)
    - integrity checks: tenets.jsonl <-> tenets.md sync, ecosystems.jsonl <->
      per-ecosystem dirs sync
  - **Downstream propagation:**
    - version broadcast: CANON version bump → health checkers in all 13
      ecosystems detect skew
    - contract enforcement: Schema change → dependent enforcement manifests fail
      validation until updated
    - migration automation: Breaking changes ship WITH migration scripts (T12
      idempotent)
    - staggered rollout: D19 pilot pattern — validate on 2-3 ecosystems before
      mass rollout
    - fail-loud cascade: T11 — ecosystem >48h behind CANON version → alerts
      escalate to blocking
  - **Semver blast radius:**
    - patch: Clarifications only, informational, <1h auto rollout
    - minor: New checklist items/rules, maturity may shift, 24-48h auto PRs
    - major: Breaking schema changes, all 13 must migrate, 1-2 weeks staggered
- **User directive:** "There has got to be a stout system for canon changes both
  within the canon itself and downstream as well."

---

## Core Tenets (T1-T17)

17 tenets across 4 categories. Locked in Batch 4T (Tenets Discovery). Flat list
with categories (D#31). Stored as `.canon/tenets.jsonl` (source of truth) +
`.canon/tenets.md` (generated view) — first CANON artifact (D#32).

### Foundation

**T1: canon_is_ecosystem_zero**

- **Statement:** CANON is the meta-system above all others. It defines the
  rules, lives at `.canon/` repo root, and is the first ecosystem standardized.
- **Evidence:** D1, D11, D12

**T2: source_of_truth_generated_views**

- **Statement:** Every system has ONE authoritative source. Everything else is
  derived/generated. Never maintain two copies — maintain one and compute the
  other.
- **Evidence:** D2, D4, D20, D24
- **Note:** JSONL-first (T4) is an instance of this broader principle.

**T3: maturity_is_measurable**

- **Statement:** Maturity is computed from a concrete checklist, never
  subjectively assigned. 16 items → L0-L5 levels. If you can't measure it, you
  can't improve it.
- **Evidence:** D3, D8, D9

### Design

**T4: jsonl_first**

- **Statement:** JSONL is the canonical storage format — AI-consumed,
  appendable, line-diffable. MD is generated for human consumption. Instance of
  T2.
- **Evidence:** D2, D22, D25, D26

**T5: contract_over_implementation**

- **Statement:** CANON defines the contract (what a health checker must output,
  what an enforcement manifest looks like). How each ecosystem implements it is
  their business.
- **Evidence:** D10, D24, D27

**T6: room_for_growth**

- **Statement:** Nothing ships as a dead end. Everything must be upgradeable.
  Ease the upgrade process. Schemas, APIs, structures — all must accommodate
  evolution without breaking.
- **Evidence:** D12, D13, D22

**T7: platform_agnostic_by_default**

- **Statement:** All CANON artifacts, scripts, and tooling MUST work identically
  on both Claude Code Desktop (Linux sandbox) and Windows CLI. Node.js over
  bash. Forward-slash paths. LF line endings. No platform-specific assumptions
  without a documented cross-platform fallback.
- **Evidence:** D15, D17, D21, D27
- **Dual-environment context:**
  - Environments: Claude Code Desktop (Linux sandbox), Windows CLI
    (PowerShell/Git Bash)
  - Constraints: Node.js for all scripts (not bash), Forward-slash paths only,
    LF line endings only, No symlinks in .canon/, No platform-specific env var
    assumptions, Cross-platform hooks (already Node.js — formalize as
    requirement)
  - Known violations: 3 bash-only scripts with no Windows equivalent, Removed
    sync script never replaced, CROSS_PLATFORM_SETUP.md references dead tooling

### Operations

**T8: automation_over_discipline**

- **Statement:** If a process relies on human memory, it WILL fail. Hooks,
  gates, scripts — not checklists and READMEs. Automate enforcement or accept
  non-compliance.
- **Evidence:** D14, D15, D18, D26
- **Note:** Was discussed in Batch 3 but never formally recorded. Formalized in
  Batch 4T.

**T9: crash_proof_state**

- **Statement:** State survives compaction, session boundaries, crashes, and
  network failures. Not optional — it's infrastructure. State files, not memory.
  Persistent, not ephemeral.
- **Evidence:** D9 checklist item 8
- **Note:** The existence of deep-plan.state.json itself embodies this tenet.

**T10: validate_before_scaling**

- **Statement:** Pilot on 1-2, prove it works, then roll out. Never mass-apply
  an unproven pattern. CANON validates itself before it standardizes others.
- **Evidence:** D6, D13, D19

**T11: fail_loud_fail_early**

- **Statement:** When something is wrong, it screams immediately — not silently
  logs to a file nobody reads. Pre-commit catches before PR. Errors block, they
  don't whisper. The aggressive complement to visibility.
- **Evidence:** D14, D15

**T12: idempotent_operations**

- **Statement:** Every CANON script and operation produces the same result
  whether run once or five times. No data corruption from re-runs. No side
  effects from retries. Safe to re-run is safe to automate.
- **Evidence:** D18, D27
- **Note:** The MASTER_DEBT 9-writer race condition is a direct violation of
  this tenet.

### Process

**T13: plan_as_you_go**

- **Statement:** Each ecosystem gets its own deep-plan when sequenced. No stale
  pre-plans. Discoveries feed forward — what you learn standardizing ecosystem
  #3 informs ecosystem #4. Knowledge compounds.
- **Evidence:** D6, D8
- **Sub-principle:** discoveries_feed_forward — merged here from candidate T16

**T14: capture_everything_surface_what_matters**

- **Statement:** Ideas, findings, tangential thoughts MUST be recorded —
  institutional memory. Then surface what's actionable through visibility
  tooling. Nothing gets lost AND nothing gets buried.
- **Evidence:** D14, D17
- **Note:** Renamed from 'visibility_is_key'. Merges visibility + institutional
  memory (candidate T14 'nothing gets lost').

**T15: interactivity_first**

- **Statement:** Interactive workflows over batch output. Batch questioning over
  monologue dumps. User-driven decisions, not AI-driven assumptions. Deep-plan
  is the exemplar — extends to all skills/tools.
- **Evidence:** deep-plan skill design

**T16: single_ownership_many_consumers**

- **Statement:** Every component has exactly one owner responsible for it.
  Others consume, never supersede. Primary ownership = maintenance
  responsibility, not authority hierarchy.
- **Evidence:** D11

**T17: declarative_over_imperative**

- **Statement:** Declare WHAT should be, let tools enforce HOW. Enforcement
  manifests, schemas, configs — all declarative. You describe the world you
  want; automation makes it so.
- **Evidence:** D9, D14, D26

---

## Ecosystem Maturity Assessment Summary

| Ecosystem                    | Current Level    | Target Level   | Effort | Staging             | Key Gaps                                                                                                  |
| ---------------------------- | ---------------- | -------------- | ------ | ------------------- | --------------------------------------------------------------------------------------------------------- |
| PR Review (D33)              | L4 (Enforced)    | L5 (Canonized) | S      | Direct (L4→L5)      | Rollback, deprecation policy, naming validation pending CANON, contracts pending format                   |
| TDMS (D34)                   | L2 (Structured)  | L5 (Canonized) | XL     | Staged: L2→L3→L4→L5 | No Zod schemas, no enforcement manifest, no versioning. 37 scripts, inconsistent patterns. USER OVERRIDE. |
| Sessions (D35)               | L1 (Identified)  | L3 (Monitored) | M      | Direct (L1→L3)      | State persistence works but nothing else formalized. Runs on convention.                                  |
| Hooks (D36)                  | L3 (Monitored)   | L4 (Enforced)  | M      | Direct (L3→L4)      | Zod schemas, formalized contracts, versioning. Strong enforcement already.                                |
| Skills (D37)                 | L1 (Identified)  | L3 (Monitored) | L      | Direct (L1→L3)      | Zero data tracking, zero contracts, zero lifecycle mgmt. 65 skills. USER OVERRIDE.                        |
| Alerts (D38)                 | L2 (Structured)  | L4 (Enforced)  | M      | Staged: L2→L3→L4    | No schema validation, no enforcement manifest, no versioning strategy.                                    |
| Scripts (D39)                | L2 (Structured)  | L3 (Monitored) | L      | Direct (L2→L3)      | 300+ scripts, inconsistent patterns, some unreachable.                                                    |
| Docs (D40)                   | L2 (Structured)  | L3 (Monitored) | M      | Direct (L2→L3)      | Sync checking fragile, no schema validation for doc metadata.                                             |
| CI/CD (D41)                  | L1 (Identified)  | L3 (Monitored) | M      | Staged: L1→L2→L3    | Minimal formalization, strong Hooks dependency.                                                           |
| Analytics (D42)              | L1 (Identified)  | L3 (Monitored) | M      | Staged: L1→L2→L3    | No unified system, metrics scattered across health checkers and audits.                                   |
| Roadmap & Execution (D46)    | L2 (Structured)  | L3 (Monitored) | L      | Direct (L2→L3)      | Non-debt input pipelines missing, no schema on ROADMAP, no pipeline health monitoring. PRIORITY ELEVATED. |
| Testing (D47)                | L3 (Monitored)   | L4 (Enforced)  | M      | Direct (L3→L4)      | Lacks formalized enforcement manifest and schema validation.                                              |
| Archival/Rotation (D48)      | L3 (Monitored)   | L4 (Enforced)  | M      | Direct (L3→L4)      | Lacks formal enforcement and schema validation.                                                           |
| CANON — Ecosystem Zero (D49) | L0 (Nonexistent) | L5 (Canonized) | L      | Direct (L0→L5)      | Everything — CANON does not exist yet. STOUT enforcement required (bidirectional).                        |

---

## User Directives (Captured During Discovery)

All directives captured from the user during the deep-plan discovery process:

- **roadmap_will_change:** ROADMAP.md will need additions, changes, removals
  after this process
- **grand_plan_reassessment:** TDMS Grand Plan needs reassessment — changing
  many files invalidates existing debt items
- **state_persistence_standard:** Constant state file saving is a standard here
  AND repo-wide going forward — to be canonized as rules
- **capture_all_ideas:** Stream-of-consciousness ideas MUST be captured even if
  not immediately actionable
- **canon_is_ecosystem_zero:** CANON is the meta-system/Ecosystem Zero —
  building block for all others
- **overlap_management:** Many points of overlap between ecosystems — must not
  let one supersede another
- **duplicate_subsystems:** Cross-cutting subsystems exist in multiple
  ecosystems and need mapping
- **standardization_is_key:** Duplicate subsystems must follow shared standards
- **pr_creep_guard:** User has tendency toward 30-50 commit PRs. Wants guardrail
  mechanism SOON.
- **lifecycle_management:** User agreed — helps future-proof. Added to
  cross-cutting subsystems.
- **jsonl_is_canon:** JSONL is canonical/AI-consumed, MD is human-readable
  generated from JSONL. Core tenet.
- **room_for_growth_everywhere:** Nothing not-upgradeable. Ease upgrade process.
  Room for growth built in everywhere. Things change all the time.
- **no_superseding_ecosystem:** Primary ownership = maintenance responsibility,
  not authority. No ecosystem supersedes another.
- **plan_as_you_go:** Each ecosystem gets its own deep-plan when sequenced.
  Don't pre-plan all 13 — they'd go stale.
- **ecosystem_plan_sequencing_matters:** Dependency-wise sequencing between
  ecosystem plans is important. Discoveries in one plan may feed into another.
- **mcp_memory_enabled:** enableAllProjectMcpServers flipped to true. Verify
  memory MCP tools available next session.
- **interactivity_is_paramount:** Interactivity of utmost importance across
  everything whenever possible. Skills should be interactive (deep-plan as
  exemplar), not monologue dumps. Extends beyond skills to all methods/tools
  where applicable.
- **dual_environment_is_constraint:** System must work identically on Claude
  Code Desktop (Linux sandbox) and Windows CLI. Platform-agnostic by default.
  Node.js over bash. Formalized as tenet T7.
- **tdms_must_be_l5:** TDMS feeds into everything, MASTER_DEBT has thousands of
  entries. Too critical to leave below L5. Acknowledged as massive XL effort.
- **skill_audit_leverage:** Skill-audit skill exists
  (.claude/skills/skill-audit/) — created Feb 28, 2026. Born from 64-decision
  audit of deep-plan skill. 10-category interactive framework (intent fidelity,
  workflow sequencing, I/O quality, decision points, integration surface, guard
  rails, prompt engineering, scope boundaries, institutional memory, UX). Used
  on deep-plan (64 decisions → v2 rewrite) and informed skill-creator v2 update.
  Codifies the behavioral quality standards from those refinements. This is the
  mechanism for all 65 skills' ecosystem auditing.
- **planning_is_skill_roadmap_is_system:** Planning is a SKILL (deep-plan, GSD
  discovery). The SYSTEM is the Roadmap & Execution ecosystem — where work items
  land, get prioritized, get executed. Multiple avenues feed in. Non-debt input
  pipelines are the critical missing piece. Must be high in implementation order
  as a hub ecosystem.
- **canon_enforcement_must_be_stout:** CANON enforcement must be bidirectional
  and robust: (1) CANON self-protection — changes gated, validated,
  migration-scripted. (2) Downstream propagation — all 13 ecosystems notified,
  migrated, held to new standards. Semver drives blast radius. User directive:
  'stout system.'

---

## Ideas Captured (Discovery Phase)

All ideas captured during the deep-plan discovery process, including
stream-of-consciousness items:

1. ROADMAP entries will change significantly post-standardization
2. Grand Plan debt items may become invalid as files change
3. State persistence should use whatever resources are best
4. Future idea capture mechanism needed
5. Cross-ecosystem subsystem mapping is its own discovery task
6. Canon is Ecosystem Zero — all others derive from it
7. Planning standardization (deep-plan, GSD) as backbone — build from there
8. PR creep guardrail: commit counter hook (warn 10, block 25, override
   available)
9. Branch scope declaration idea: S/M/L with commit brackets
10. Session-end PR gate: flag if >15 commits not in a PR
11. State saving rules need to be canonized
12. 13 cross-cutting subsystems
13. Configuration as single source of truth vs hardcoded values
14. Per-ecosystem required-vs-optional subsystem mapping needed
15. L5 is north star not exit criteria — most target L3-L4 baseline
16. Upgrade-friendliness as design principle in every component
17. MCP memory as secondary state backup (verify next session)
18. Configure episodic memory for remote sessions (broader benefit beyond this
    plan)
19. Interactivity-first as a design tenet for all skills and tooling — batch
    questioning > monologue output
20. Health report dual format (JSON envelope + JSONL findings) could become a
    general pattern for all ecosystem outputs
21. Core tenets discovery phase should precede schema/structure decisions —
    tenets guide everything downstream
22. Tenets should be CANON's first artifact (.canon/tenets.jsonl) — CANON
    defines itself before it defines others
23. CROSS_PLATFORM_SETUP.md is stale — references removed sync script. Needs
    update when platform-agnostic tenet is implemented
24. Cascade/override (D#5) and progressive disclosure are useful patterns but
    not tenets — keep as referenced patterns, not principles
25. 17 tenets across 4 categories is the right granularity — specific enough to
    be actionable, broad enough to be stable
26. Roadmap & Execution ecosystem is the HUB — all other ecosystems feed work
    items into it. Non-debt pipelines (audit findings → roadmap, deep-plan
    decisions → roadmap, feature planning → roadmap) are completely missing. T8
    violation.
27. Roadmap & Execution needs high implementation priority — if we standardize
    13 ecosystems, each generates work items needing automated intake
28. CANON enforcement cascade: version broadcast → health checker detection →
    migration automation → fail-loud escalation → staggered rollout. Both
    self-protection and downstream propagation.
29. deep-plan decisions should auto-generate ROADMAP sprint items — manual
    copying is T8 violation
30. audit-aggregator produces report but nobody places findings into sprints
    unless human does it — another missing pipeline

---

## Version History

| Version | Date       | Changes                                                                           |
| ------- | ---------- | --------------------------------------------------------------------------------- |
| 0.4     | 2026-03-03 | Deep-plan backfill: D1-D49, T1-T17, ecosystem assessments, user directives, ideas |
| 0.3     | 2026-03-03 | Added dual-environment config, decisions #19-22, PR creep fix                     |
| 0.2     | 2026-03-02 | Added two-repo foundation, framework analysis, ecosystem hierarchy                |
| 0.1     | 2026-03-02 | Initial discovery record from Session #201                                        |
