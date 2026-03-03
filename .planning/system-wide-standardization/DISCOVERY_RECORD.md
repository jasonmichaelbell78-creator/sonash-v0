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

### Environment A: Work — Claude Code Desktop

| Attribute            | Value                                        |
| -------------------- | -------------------------------------------- |
| **Interface**        | Claude Code Desktop (web-based)              |
| **Local branch**     | `master` (default)                           |
| **Context risk**     | **Timeouts** — hard session kill, no hooks   |
| **Compaction**       | Also possible (hooks DO fire)                |
| **MCP secrets**      | Encrypted — need decrypt at session start    |
| **Checkpoint needs** | Proactive manual `/checkpoint` at milestones |

### Environment B: Home — Claude Code CLI

| Attribute            | Value                                    |
| -------------------- | ---------------------------------------- |
| **Interface**        | Claude Code CLI (terminal)               |
| **Local branch**     | TBD — confirm if `main` or `master`      |
| **Context risk**     | **Compaction** — PreCompact hook fires   |
| **Timeouts**         | Less common (CLI is more persistent)     |
| **MCP secrets**      | TBD — may already be decrypted           |
| **Checkpoint needs** | Standard (PreCompact handles most cases) |

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

## Version History

| Version | Date       | Changes                                                            |
| ------- | ---------- | ------------------------------------------------------------------ |
| 0.3     | 2026-03-03 | Added dual-environment config, decisions #19-22, PR creep fix      |
| 0.2     | 2026-03-02 | Added two-repo foundation, framework analysis, ecosystem hierarchy |
| 0.1     | 2026-03-02 | Initial discovery record from Session #201                         |
