# Meta-Roadmap

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** ACTIVE
**Purpose:** Guidebook for navigating all active plans, research, todos, and in-flight state across this repo. Not an index — a sequenced walkthrough.
**Scope:** sonash-v0 repo. Covers `.planning/`, `.research/`, `.claude/state/`, `.planning/todos.jsonl`, `ROADMAP.md`, and loose plan artifacts in `docs/`.
**How to update:** Regenerate via inventory sweep + agent scan. No template — this is a living routing doc.
<!-- prettier-ignore-end -->

---

## How to Use This Document

1. **Start at §2 (Sequenced Execution Walk-through)** — this is the "do these in
   this order" path through every open plan.
2. **Reference §3–§11 for full inventory** — each plan/research/todo has status,
   next action, blockers, effort.
3. **Check §12 (Dependency Chain)** when deciding what to unblock next.
4. **Use §13 (Stale & At-Risk)** when rehydrating context after a break.
5. **Use §14 (Housekeeping)** for cleanup when you have a spare 15 minutes.

Legend: **🔥** in-flight | **🟢** ready to execute | **🔒** blocked on another
item | **🧊** stalled (>14d) | **🗃️** complete (cleanup-eligible) | **📋**
research, no plan yet

---

## 1. At a Glance

| Bucket                              | Count | Notes                                                          |
| ----------------------------------- | ----- | -------------------------------------------------------------- |
| Active `.planning/` directories     | 15    | excluding `archive/`                                           |
| Active `.research/` directories     | 16    | excluding `archive/` and `analysis/` (CAS output)              |
| In-flight deep-plan state files     | 3     | orphan-detection, skill-convergence, t28-intelligence-graph-v1 |
| In-flight deep-research state files | 1     | research-discovery-standard (20d stale)                        |
| Complete state files (cleanup)      | 7     | content-analysis-system, multi-layer-memory, etc.              |
| Active todos                        | 25    | 6 in-progress, 4 blocked, 15 pending, 0 P0                     |
| SoNash product milestones (gated)   | 11    | M1.5 → M10, all blocked on Meta Pipeline                       |
| Critical dependency chain depth     | 4     | T2 → T3 → T6 → T7                                              |
| Loose research artifacts (orphans)  | 6     | `T39_*.md` files at `.research/` root                          |

---

## 2. Sequenced Execution Walk-through

This is the **recommended order**. Each "Lane" can be followed sequentially;
lanes can be interleaved based on energy/context.

### Lane 0: Close the current session's branch (IMMEDIATE)

1. **Push `planning-41326` → create PR → `/pr-review` cycle** — 15 commits
   ready, includes T29 Wave 5 synthesis + opportunities 1+2. (from
   SESSION_CONTEXT.md §Next Step)
2. After merge, decision point: **(a)** start rank-3+ synthesis opportunities,
   **(b)** pull **T47** Wave 6 gap-fill seed (10 sources) into active work,
   **(c)** pivot entirely to Lane 1.

### Lane 1: Finish in-flight momentum items (1–3 sessions)

3. **T29 Step 10.5** — full-corpus audit complete (31/31 PASS). Already closed
   this session.
4. **T28 CAS — `/recall` testing** — last remaining open item per T28 progress
   note.
5. **T40 CAS tag taxonomy** — COMPLETE this session (validate on merge). Move
   todo to completed on merge.

### Lane 2: Resume 3 in-flight deep-plans (unblock buried momentum)

6. **`/deep-plan skill-convergence`** — Phase A execution, 20 steps planned 0
   completed (7 days stale). Schema-as-code validation + shared behavior
   library.
7. **`/deep-plan orphan-detection`** — discovery complete, 20 decisions made, 8
   days stale. Build `scripts/detect-orphans.js` scaffold.
8. **`/deep-plan t28-intelligence-graph-v1`** — Phase 0 diagnosis written,
   decisions pending (5 days stale). Can now proceed because
   `deep-research.t28-intelligence-graph-data-layer` is complete.

### Lane 3: Convert research → plan (prevent rot)

These have finished research but no implementation plan. Convert before context
fades:

9. **`/deep-plan unified-content-intelligence`** — brainstorm done, 13 open
   questions across 4 resolved / 5 partial / 4 open. **Decision required
   first:** is this superseded by T28 CAS, or does it still ship? If superseded,
   archive. If live, plan.
10. **`/deep-plan multi-layer-memory`** (T4) — 41-agent research complete. Write
    plan, decide on hybrid architecture (git sync + MCP + cloud DB).
11. **T13 research-discovery-standard plan update** — changes identified Session
    #263 but not committed. Integrate v2 findings + /brainstorm + dashboard.

### Lane 4: Break the T2 → T3 → T6 → T7 chain (unblock 4 P1s)

This is the highest-leverage unblocking sequence:

12. **T2 Dev Dashboard — close data gaps first** — Tab 4 (Pipeline) blocked on
    G29 velocity / G30 commit-log / G33 retro. Tab 5 (Audits) blocked on
    health-ecosystem-audit never having been run. Close these before Tab builds.
    See `.planning/dev-dashboard/`.
13. **T2 Dev Dashboard — Tab builds** — Debt → Health → Reviews → Planning →
    Pipeline → Audits.
14. **T3 debt-runner expansion plan** (unblocked by T2) — research complete at
    `.research/debt-runner-expansion/`, 23 agents. Write plan.
15. **T6 plan-orchestration Waves 2–3** (unblocked by T3) — Wave 1 done at
    `.planning/plan-orchestration/`.
16. **T7 SWS CANON enforcement (Step 12)** (unblocked by T6).

### Lane 5: JASON-OS (primary user goal — strategic, multi-session)

17. **T16 JASON-OS Domain 01** — brainstorm complete, 16 research domains in 3
    tiers scoped. Domain 01 is next. This is your primary "Claude Code OS"
    vision per user_os_vision memory. XL effort, paced across many sessions.

### Lane 6: SWS meta-pipeline (XL deep work, 60–90 sessions)

This is the P0-BLOCKING chain in ROADMAP.md. Gates all SoNash product milestones
(M1.5→M10).

18. **Tooling & Infrastructure Audit**
    (`.planning/system-wide-standardization/tooling-infrastructure-audit/`) — 30
    decisions, MCP patterns, Node.js standardization, script governance.
    **ACTIVE per ROADMAP.md.**
19. **Code Quality Overhaul**
    (`.planning/system-wide-standardization/code-quality-overhaul/`) — 26
    decisions, ESLint v9, TypeScript strictness, 7 workstreams. **BLOCKED until
    18 complete.**
20. **Data Effectiveness + Learnings-Effectiveness Audit**
    (`.planning/system-wide-standardization/learnings-effectiveness-audit/` —
    95% complete, operates independently).
21. **SWS core — Phase 0 → Phase 6** — 19 ecosystems coordinated (CANON, Skills,
    Hooks, PR Review, TDMS, Sessions, Scripts, CI/CD, Alerts, Analytics, Agents,
    Audits, Archival, Roadmap, Frontend, Firebase).
22. **Operational Visibility** — unblocks after SWS completes. ~25% done.

### Lane 7: Quick wins (batch when low-energy)

23. **T33** — Fix PreToolUse hook "node command not found" on Write/Edit.
24. **T35** — Build `audit-todos-history.js` diagnostic.
25. **T36** — InvocationRecord schema strict-context fix.
26. **T31** — Redesign hook state file tracking (split telemetry vs learning).
27. **T45** — Hook-based skill compliance enforcement.
28. **T9** — Agent stalling on large input investigation (you already have a
    memory — this is to turn it into code enforcement).

### Lane 8: Research queue (small lifts, surface when curious)

29. **T37** — Explore GitNexus for total repo reference map.
30. **T42** — Nous Research Hermes model series for agent tool use.
31. **T46** — Cross-locale memory sync strategy (T43 follow-up).
32. **T25** — Behavioral compliance proxy metrics (brainstorm + research).
33. **T19** — Internal testing suite for processes/files/workflows.
34. **T20** — Alert refresh mechanisms outside `/alerts`.

### Lane 9: Passive clocks (no action, just wait)

35. **T24** — 60-day MVM evaluation. Clock started 2026-04-07. Data
    accumulating. Evaluate at 2026-06-06.

### Lane 10: Stalled / rehydrate-or-archive

36. **`deep-research.research-discovery-standard`** — 20 days stalled at Phase 1
    Wave 1 (0/18 agents started). Decision: resume, supersede by v2, or archive.
37. **`worktree-planning.state.json`** — 32 days old, two approved plans
    (Tooling & Infrastructure Audit, Code Quality Overhaul) ready but not
    pushed. Decision: push or abandon worktree.
38. **learning-analysis research** — paused mid-Phase 1, 12 questions drafted.
    Related to T25.

### Lane 11: SoNash product roadmap (BLOCKED on Meta Pipeline)

Covered by ROADMAP.md `Chain 0`. All gated. Listed here so you know the queue
exists:

- M1.5 Quick Wins (paused, ~20%)
- M1.6 Admin Panel + UX (paused, ~75%)
- M2 Architecture (optional, parallel)
- M3 Meetings, M4 Expansion, M4.5 Security, M5 Offline, M6 Journaling, M7
  Fellowship, M8 Speakers, M9 Native, M10 Monetization

### Lane 12: Housekeeping (anytime, 15-min windows)

39. Move `.research/T39_*.md` (6 loose files) into
    `.research/t39-hook-ecosystem/` subdir. T39 is complete per todos.
40. Archive completed deep-plan/deep-research/brainstorm state files (7 files —
    see §7).
41. Audit `skill-creator.state.json` — Phase 4 build planned for "todo" skill
    but files not created. Either complete or archive.
42. Delete `deep-plan.orphan-detection.state.json` after Lane 2 Step 7 completes
    (T21 completed 2026-04-09 per TODOS — state file is artifact).

---

## 3. `.planning/` — Active Directory Inventory

| #   | Dir                         | Type      | Status | Latest     | Matching Todo | Effort | Next Action                                                                |
| --- | --------------------------- | --------- | ------ | ---------- | ------------- | ------ | -------------------------------------------------------------------------- |
| 1   | synthesis-consolidation     | plan      | 🔥     | 2026-04-13 | T29           | L      | Wave 5 shipped; merge + pick next opportunity rank                         |
| 2   | synthesis-wave5-agents      | mixed     | 🔥     | 2026-04-13 | T29           | M      | Active this session (4-agent merge infra)                                  |
| 3   | cas-tag-quality             | plan      | 🗃️     | 2026-04-13 | T40           | S      | Validate on merge, close todo                                              |
| 4   | content-analysis-system     | mixed     | 🟢     | 2026-04-08 | T28           | XL     | `/recall` testing (last open)                                              |
| 5   | t28-intelligence-graph-v1   | plan      | 🟢     | 2026-04-08 | T28           | M      | Resume `/deep-plan t28-intelligence-graph-v1` — Phase 1                    |
| 6   | creator-view-upgrade        | plan      | 🟢     | 2026-04-06 | —             | XL     | Task A Steps 1–8 (repo-analysis schema v2)                                 |
| 7   | orphan-detection            | plan      | 🟢     | 2026-04-06 | T21 (done)    | M      | Resume deep-plan; state file exists but todo closed — investigate mismatch |
| 8   | skill-convergence           | plan      | 🟢     | 2026-04-07 | —             | M      | Resume `/deep-plan skill-convergence` Phase A                              |
| 9   | website-analysis            | plan      | 🗃️     | 2026-04-07 | T23 (done)    | S      | Skill shipped; archive when safe                                           |
| 10  | github-health-skill         | plan      | 🗃️     | 2026-04-05 | T12 (done)    | S      | Skill shipped; archive when safe                                           |
| 11  | jason-os                    | research  | 🟢     | 2026-04-05 | T16           | XL     | Domain 01 research start                                                   |
| 12  | dev-dashboard               | plan      | 🔒     | 2026-04-02 | T2            | XL     | Close G29/G30/G33 data gaps, run health-ecosystem-audit, then build Tab 1  |
| 13  | plan-orchestration          | plan      | 🔒     | 2026-03-28 | T6            | XL     | Waves 2–3 blocked on T3 (debt-runner)                                      |
| 14  | research-discovery-standard | plan      | 🧊     | 2026-03-25 | T13           | M      | Plan updates not committed; integrate v2 findings                          |
| 15  | system-wide-standardization | meta-plan | 🔒     | 2026-03-25 | T7            | XL     | Phase 0 pre-reqs → Phase 1 CANON Foundation (19 ecosystems, 6 phases)      |

### SWS sub-plans (meta-plan detail)

| Sub-plan                      | Status | Role                                                         |
| ----------------------------- | ------ | ------------------------------------------------------------ |
| tooling-infrastructure-audit  | 🟢     | 30 decisions; ACTIVE per ROADMAP Chain 0 (first in pipeline) |
| code-quality-overhaul         | 🔒     | 26 decisions; blocked on tooling                             |
| learnings-effectiveness-audit | 🗃️     | 95% complete, operates independently                         |

---

## 4. `.research/` — Active Directory Inventory

| #   | Dir                               | Type     | Status     | Latest     | Matching Todo | Effort | Next Action                                                  |
| --- | --------------------------------- | -------- | ---------- | ---------- | ------------- | ------ | ------------------------------------------------------------ |
| 1   | content-analysis-system           | research | 🔥         | 2026-04-08 | T28           | M      | Tracks with T28 plan execution                               |
| 2   | t28-intelligence-graph-data-layer | research | 🗃️→plan    | 2026-04-08 | T28           | XL     | Research done; unblocks t28-intelligence-graph-v1 deep-plan  |
| 3   | repo-analysis                     | research | 🗃️         | 2026-04-08 | T1 (done)     | S      | Complete                                                     |
| 4   | website-analysis                  | research | 🗃️         | 2026-04-06 | T23 (done)    | S      | Complete                                                     |
| 5   | analysis-synthesis-comparison     | research | 🗃️         | 2026-04-07 | —             | S      | Complete (60 claims verified)                                |
| 6   | unified-content-intelligence      | research | 📋         | 2026-04-07 | T28-adjacent  | L      | Brainstorm done; **DECISION:** superseded by T28 or plan it? |
| 7   | learning-analysis                 | research | 🧊         | 2026-04-07 | T25           | M      | Resume behavioral compliance brainstorm                      |
| 8   | jason-os                          | research | 🟢         | 2026-04-05 | T16           | M      | Brainstorm done; route to deep-plan for Domain 01            |
| 9   | research-discovery-standard-v2    | research | 🗃️         | 2026-04-05 | T13           | L      | Phases 2–4 pending T13 plan update                           |
| 10  | worktree-management               | mixed    | 🟢         | 2026-04-05 | T5            | M      | Testing Direction F (claude -w)                              |
| 11  | learning-system-effectiveness     | research | 🟢 passive | 2026-04-03 | T24           | XL     | Passive clock — data accumulating to 2026-06-06              |
| 12  | multi-layer-memory                | research | 📋         | 2026-04-02 | T4            | XL     | Write deep-plan from 41-agent findings                       |
| 13  | dev-dashboard                     | research | 🟢         | 2026-03-30 | T2            | L      | Plan exists; execute                                         |
| 14  | github-health                     | research | 🗃️         | 2026-03-30 | T12 (done)    | S      | Complete                                                     |
| 15  | debt-runner-expansion             | research | 🔒         | 2026-03-28 | T3            | M      | Wait for T2, then write plan                                 |
| 16  | research-discovery-standard (v1)  | research | 🧊         | 2026-03-25 | T13           | M      | Plan updates pending (v2 extends this)                       |

### Loose artifacts (housekeeping)

| Item           | Origin          | Action                                                             |
| -------------- | --------------- | ------------------------------------------------------------------ |
| `T39_*.md` × 6 | T39 (completed) | Move to `.research/t39-hook-ecosystem/` subdir so root stays clean |

---

## 5. State Files — In-Flight Planning Work

These are `.claude/state/*.state.json` files that represent interrupted or
paused planning sessions. Resume via the listed command.

| State File                                             | Status            | Age | Resume With                                                        |
| ------------------------------------------------------ | ----------------- | --- | ------------------------------------------------------------------ |
| `deep-plan.skill-convergence.state.json`               | 🔥 Phase A start  | 7d  | `/deep-plan skill-convergence`                                     |
| `deep-plan.orphan-detection.state.json`                | 🔥 discovery done | 8d  | `/deep-plan orphan-detection` (but T21 is marked done — reconcile) |
| `deep-plan.t28-intelligence-graph-v1.state.json`       | 🔥 Phase 0        | 5d  | `/deep-plan t28-intelligence-graph-v1`                             |
| `deep-research.research-discovery-standard.state.json` | 🧊 Wave 1 0/18    | 20d | `/deep-research research-discovery-standard` OR archive            |
| `worktree-planning.state.json`                         | 🧊 working        | 32d | Investigate worktree state; push or abandon                        |

### State files complete (cleanup-eligible)

`deep-plan.content-analysis-system.state.json`,
`brainstorm.content-analysis-system.state.json`,
`deep-research.multi-layer-memory.state.json`,
`deep-research.analysis-synthesis-comparison.state.json`,
`deep-research.t28-intelligence-graph-data-layer.state.json`,
`skill-creator.state.json` (Phase 4 never built — reconcile),
`task-skill-audit-repo-synthesis.state.json`, `task-pr-retro.state.json`

Cleanup command (when ready): `rm .claude/state/<file>.state.json` after
verifying the matching plan/todo is closed.

---

## 6. Todo Inventory (from `.planning/todos.jsonl`)

25 active. Grouped by priority.

### P1 (9 active)

| ID  | Title                                            | Status      | Notes                                                    |
| --- | ------------------------------------------------ | ----------- | -------------------------------------------------------- |
| T2  | Dev dashboard — 6-tab command center             | in-progress | Blocker chain head — unblocks T3, T6, T7                 |
| T16 | Claude Code OS — multi-stage research initiative | in-progress | Brainstorm done, Domain 01 next — **primary user goal**  |
| T28 | Content Analysis System (CAS)                    | in-progress | Last open: `/recall` testing                             |
| T29 | Synthesis consolidation — `/synthesize` skill    | in-progress | Wave 5 SHIPPED this session; next: pick opportunity rank |
| T3  | debt-runner expansion — `/deep-plan`             | blocked     | Blocked on T2                                            |
| T6  | Plan orchestration — Waves 2-3                   | blocked     | Blocked on T3                                            |
| T7  | SWS CANON enforcement (Step 12)                  | blocked     | Blocked on T6                                            |
| T4  | Multi-layer memory — execute research findings   | pending     | Needs `/deep-plan` conversion — Lane 3                   |
| T24 | 60-day MVM evaluation                            | pending     | Passive clock — evaluate 2026-06-06                      |

### P2 (13 active)

| ID  | Title                                                           | Status      |
| --- | --------------------------------------------------------------- | ----------- |
| T5  | Worktree management — .claude/ syncing + parallel instances     | in-progress |
| T13 | Research-Discovery Standard plan update                         | in-progress |
| T38 | Full `/skill-audit` on all CAS skills                           | blocked     |
| T9  | Agent stalling on large input — investigation                   | pending     |
| T19 | Internal testing suite                                          | pending     |
| T25 | Behavioral compliance proxy metrics — brainstorm + research     | pending     |
| T31 | Redesign hook state file tracking — split telemetry vs learning | pending     |
| T33 | Fix PreToolUse hook: node command not found on Write/Edit       | pending     |
| T40 | CAS tag taxonomy — analyze and improve                          | pending     |
| T45 | Hook-based skill compliance enforcement                         | pending     |
| T46 | Cross-locale memory sync STRATEGY (T43 follow-up)               | pending     |

### P3 (5 active)

| ID  | Title                                         |
| --- | --------------------------------------------- |
| T20 | Alert refresh mechanisms                      |
| T35 | Build `audit-todos-history.js` diagnostic     |
| T36 | InvocationRecord schema strict-fields bug     |
| T37 | Explore GitNexus for total repo reference map |
| T42 | Research Nous Research Hermes model series    |

**Todo ↔ Plan map** (for cross-reference): T1↔repo-analysis, T2↔dev-dashboard,
T3↔debt-runner-expansion, T4↔multi-layer-memory, T5↔worktree-management,
T6↔plan-orchestration, T7↔system-wide-standardization,
T12↔github-health(-skill), T13↔research-discovery-standard(-v2), T16↔jason-os,
T21↔orphan-detection, T23↔website-analysis, T25↔learning-analysis,
T28↔content-analysis-system + t28-intelligence-graph-v1 +
t28-intelligence-graph-data-layer + unified-content-intelligence,
T29↔synthesis-consolidation + synthesis-wave5-agents, T39↔T39\_\*.md (loose),
T40↔cas-tag-quality.

---

## 7. Dependency Chain (Critical Path)

```
ROADMAP Chain 0 (P0 BLOCKING — gates all product milestones):
  Tooling & Infrastructure → Code Quality Overhaul → Data Effectiveness
  → System-Wide Standardization (SWS core) → Operational Visibility
  → M1.5, M1.6, M2, M3, M4, M4.5, M5, M6, M7, M8, M9, M10

Tactical Chain (unblocks 4 P1s):
  T2 Dev Dashboard
    └── T3 debt-runner expansion
         └── T6 plan-orchestration Waves 2-3
              └── T7 SWS CANON enforcement

T28 Chain (CAS):
  T28 CAS (in-progress, Wave 5 shipped)
    └── /recall testing (last open)
    └── t28-intelligence-graph-data-layer research (done)
         └── t28-intelligence-graph-v1 deep-plan (Phase 0)
              └── SQLite+FTS5+MCP implementation

T13 Chain (Research-Discovery Standard):
  research-discovery-standard v1 (stalled)
    ←→ research-discovery-standard-v2 (supplements v1)
         └── T13 plan update (in-progress, not committed)
              └── v2 Phases 2-4 (SWS CANON registration)
```

---

## 8. Stale & At-Risk (rehydration queue)

| Item                                            | Age     | Recommended Disposition                                                               |
| ----------------------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| `research-discovery-standard` (v1 plan + state) | 20d     | Merge into v2 or archive v1 explicitly — choose before context erodes further         |
| `worktree-planning.state.json`                  | 32d     | Two approved plans ready but not pushed — finish or abandon; see `.claude/worktrees/` |
| `learning-analysis` (Phase 1 paused)            | ~6d     | Low urgency; resume when T25 comes up                                                 |
| `skill-creator.state.json` (todo skill build)   | unknown | Phase 4 planned but files not created — confirm T11 (completed todo) covers this      |
| 6× `T39_*.md` at `.research/` root              | 1d      | Move to subdir — organizational, not urgent                                           |

---

## 9. Housekeeping Queue (15-min windows)

1. Move `T39_*.md` (6 files) → `.research/t39-hook-ecosystem/`
2. Archive 7 complete state files (list in §5)
3. Reconcile `orphan-detection` state file vs T21 completed status (either
   resurrect work or delete state)
4. Reconcile `skill-creator.state.json` vs T11 completed status
5. Rebuild ROADMAP.md Chain 0 entries with links to concrete
   `.planning/system-wide-standardization/*` sub-plan dirs (partially done —
   verify all three are linked)
6. Consider: promote unified-content-intelligence to `archive/` if T28
   supersedes, or create deep-plan if it still ships

---

## 10. Quick-Access Commands

```bash
# List all in-flight plan states
ls .claude/state/deep-plan.*.state.json .claude/state/deep-research.*.state.json .claude/state/brainstorm.*.state.json

# Check active todos
cat .planning/TODOS.md

# See current sprint priorities
cat SESSION_CONTEXT.md | head -100

# ROADMAP milestone table
grep -A 30 "Milestones Overview" ROADMAP.md

# Resume a paused plan (example)
/deep-plan skill-convergence

# Scan extractions for prior art before starting new work
cat .research/EXTRACTIONS.md | head -50
```

---

## 11. Reference Docs

| Doc                                                  | Role                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| `ROADMAP.md`                                         | SoNash product roadmap (M-milestones + Meta Pipeline)       |
| `SESSION_CONTEXT.md`                                 | Current session state, last checkpoint, next step           |
| `.planning/TODOS.md`                                 | Rendered todo table (source: `.planning/todos.jsonl`)       |
| `.research/EXTRACTIONS.md`                           | Prior-art candidates from analyzed repos/sites (T28 corpus) |
| `.research/extraction-journal.jsonl`                 | Queryable prior-art journal                                 |
| `.planning/system-wide-standardization/DIAGNOSIS.md` | SWS meta-plan scope                                         |
| `docs/SESSION_HISTORY.md`                            | Archived session summaries                                  |

---

## 12. Open Decisions (to resolve when choosing Lane 0 next step)

1. **Next synthesis opportunity** — rank 3, 5, 6, 7, or 8? (From Session #277
   handoff.)
2. **T47 Wave 6 gap-fill** — 10 sources. Pull into active now or defer?
3. **Unified-content-intelligence** — does T28 fully supersede, or does it still
   ship?
4. **research-discovery-standard v1** — merge into v2 or archive v1?
5. **worktree-planning** — finish pushing the two approved plans, or abandon the
   worktree?
6. **orphan-detection state vs T21** — closed todo has open state file.
   Reconcile.

---

## Version History

| Version | Date       | Description                                                                                                        |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| 1.0     | 2026-04-13 | Initial meta-roadmap. 15 `.planning/` dirs + 16 `.research/` dirs + 14 state files + 25 todos swept and sequenced. |
