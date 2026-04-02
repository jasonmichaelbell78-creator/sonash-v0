# Product Strategy Challenge: debt-runner Expansion Scope and Sequencing

**Author:** Product Strategy Reviewer (OTB-2) **Date:** 2026-03-27 **Input:**
RESEARCH_OUTPUT.md (701 lines), DECISIONS_PRE_PLAN.md, OTB-1
(challenges-v1/otb.md) **Perspective:** Non-technical scope and sequencing
review. Not challenging technical accuracy — challenging whether the right
things are being built in the right order.

---

## Context

The research report is technically excellent. 13 agents, 46 sources, HIGH
confidence across architectural decisions. That quality is precisely why this
challenge matters: thorough research creates momentum toward building everything
it describes. This document asks whether "everything" is the right answer.

The user has operated 240+ sessions with CLI-only debt management. The system
has 8,472 items, a 13% resolution rate, and 6 confirmed bugs. The research
proposes: fix bugs, build SQLite layer, expand CLI to 10 modes with guided mode,
build web dashboard tab with 27 capabilities, deploy 7 discovery agents, and
wire cross-tab synergies across 4 unbuilt tabs.

The question is not "can this be built?" — it clearly can. The question is
"should all of this be built, and in what order?"

---

## Challenge 1: Is the Web Dashboard Actually Needed NOW?

**Importance: CRITICAL**

### The Evidence Against Urgency

The user has managed 8,472 debt items across 240+ sessions using CLI only. The
CLI works. The resolution rate is 13% — but that number was achieved without a
dashboard. The 1,116 resolved items were resolved without visual trend charts,
without filter panels, without KPI cards. The existing `/alerts` skill already
surfaces S0/S1 counts at session start.

The research identifies zero incidents where the user could not find, triage, or
resolve a debt item because of insufficient visualization. The trigger for the
web dashboard appears in the DECISIONS_PRE_PLAN.md as D6 — a user decision, not
a pain point diagnosis. The user wants it. That is valid. But wanting it is
different from needing it, and the distinction affects sequencing.

### What CLI Expansion Alone Could Deliver

If the CLI got bug fixes, metrics enrichment (BUG-06), and guided mode — with no
web dashboard — the user would get:

- Correct data (bugs fixed)
- Richer trend data for future use (metrics enrichment)
- Outcome-oriented navigation (guided mode)
- Discovery agents finding new debt (expanded intake)
- Better resolution tooling (dry-run, bulk improvements)

That is arguably 80% of the practical value. The web dashboard adds visual
browsing and charts — valuable, but not blocking any workflow that is currently
broken.

### Recommended Action

Sequence the CLI expansion and bug fixes as Phase 1. Defer the web dashboard to
Phase 2. If Phase 1 is delivered and the user still wants the dashboard, build
it then — on clean data, with enriched metrics, with a working CLI underneath.
Do not build the viewing layer and the data layer simultaneously.

---

## Challenge 2: What Is the Simplest Useful Web Dashboard?

**Importance: IMPORTANT**

### The Research Proposes 27 Capabilities

The capability matrix (Section 5) lists 27 distinct capabilities for the web
side. These include: fuzzy search, 7 grouping modes, 3-tier filters, 6 chart
types, CSV export, JSONL export, override promotion, warning promotion, dark
debt status, discovery panel, annotation storage in Firestore, clipboard CLI
handoff, and cross-tab navigation with `setDebtFilter` props.

That is not a v1 dashboard. That is a v3 dashboard designed on paper.

### The Minimum Viable Dashboard

A single page with:

1. **3 KPI cards** — Total open, S0/S1 count, resolution rate percentage
2. **1 trend chart** — Open count over time (metrics-log.jsonl already has 112
   entries spanning 53 days)
3. **1 searchable table** — All items with sort on severity, status, category.
   No filter panel. No grouping modes. No Fuse.js fuzzy search. Just TanStack
   Table with column sort and a browser-native Ctrl+F.

That is approximately 5 of the 27 capabilities. It could be built in days, not
weeks. It would answer the two questions a dashboard actually needs to answer:
"How bad is it?" (KPIs) and "Is it getting better?" (trend). Everything else is
optimization.

### What to Defer

- Fuzzy search (Fuse.js) — browser Ctrl+F works for a solo user
- Filter panel (3 tiers) — column sorting is sufficient for v1
- 7 grouping modes — not needed until the user asks for them
- CSV/JSONL export — the data is already in JSONL on disk
- Annotations in Firestore — zero users need this today
- Discovery panel — discovery agents are a separate concern
- Override/warning promotion buttons — CLI `/add-debt` already works
- Cross-tab navigation — the other tabs do not exist yet
- URL state (nuqs) — the research itself rates this MEDIUM confidence

### Recommended Action

If the dashboard is built, scope v1 to KPIs + trend + sortable table. Define "v1
done" before starting. Resist the urge to add "just one more feature" during
implementation. The 27-capability list is a backlog, not a spec.

---

## Challenge 3: Resolution Rate Is 13% — More Intake Makes It Worse

**Importance: CRITICAL**

### The Arithmetic Problem

Current state: 8,472 items, 1,116 resolved, 7,281 open. Resolution rate: 13%.

The research proposes 7 discovery agents with estimated yields:

- dead-code-detector: 20-50 items
- config-drift-detector: 5-15 items
- test-coverage-analyzer: 30-80 items
- type-safety-scanner: 50-100 items
- architectural-boundary-checker: 10-30 items
- performance-regression-detector: 5-20 items
- integration-verifier: 3-10 items

**Total estimated new intake: 123-305 items per discovery run.**

Additionally, the research identifies 26 intake gaps. Closing even the 6
elevated MUST-HAVE gaps will increase the intake rate further.

If 200 new items are added per discovery run and the resolution rate stays at
13%, the backlog grows by ~174 items per run. Run discovery monthly and the
backlog grows by ~2,000 items per year on top of organic growth. The dashboard
will show an increasingly bad trend line.

### The Real Problem

OTB-1 (Challenge 4 and Challenge 9) already identified this: the `/pr-retro`
skill explicitly says "don't file into TDMS because it gets lost." Items are
filed but never acted on. The resolution mechanism requires developers to
manually reference DEBT-XXXXX IDs in PR bodies. For a solo non-developer
director, this is essentially non-functional.

The research does not propose any resolution acceleration. No auto-resolution
when code is deleted. No bulk false-positive sweep. No aging-out policy. No
connection between resolved PRs and debt items. The entire expansion is
intake-side and display-side. Resolution is untouched.

### Recommended Action

Before adding any new intake sources or discovery agents, invest in resolution
tooling:

1. **Bulk false-positive sweep** — The research notes that
   `reverify-resolved.js` had a 52% false alarm rate. Apply the inverse: sweep
   OPEN items for ones that are already resolved in code but not marked resolved
   in MASTER_DEBT.
2. **Auto-resolution detection** — When a file referenced by a debt item is
   deleted or substantially refactored, flag the item for resolution review.
3. **Aging policy** — Items open > 180 days with no interaction get auto-triaged
   to LOW or marked for bulk review.

Even a simple bulk sweep that resolves 500 false-positive items would move the
resolution rate from 13% to 20% — more improvement than any dashboard feature.

---

## Challenge 4: 6 Bugs Exist — Fix the Foundation First

**Importance: CRITICAL**

### Building on Sand

The research correctly identifies that BUG-01 (lowercase status strings) and
BUG-06 (missing metrics fields) must be fixed before web development. But the
recommendation buries this in "REC-01" alongside 9 other recommendations.

The reality is starker: the current data is wrong. Status filters will return
zero results. Trend charts will be missing breakdowns. The metrics that would
power KPI cards are incomplete. BUG-03 means bulk resolve can create
inconsistent state. BUG-04 means TRIAGED items show as unknown status.

Building any new feature — CLI or web — on top of buggy data is building on
sand. Every new feature will need to be tested twice: once to verify the feature
works, and once to verify the underlying data is correct after the bug fix.

### The Case for a Bug-Fix-Only Phase

Phase 1 should be exclusively:

1. Fix all 6 bugs in priority order (BUG-01 -> BUG-06 -> BUG-03 -> BUG-04 ->
   BUG-02 -> BUG-05)
2. Enrich metrics-log.jsonl with by_source and by_category (part of BUG-06 fix)
3. Regenerate metrics after fixes
4. Verify data integrity end-to-end
5. Ship as a standalone PR with no new features

This phase has zero feature risk. Every change is a correction, not an addition.
It makes every subsequent phase more reliable. And it is small enough to
complete in 1-2 sessions.

### Recommended Action

Make Phase 1 a strict bug-fix + metrics-enrichment phase. No new modes, no new
scripts, no dashboard work. Gate Phase 2 on all 6 bugs being resolved and
verified. The research's own fix sequence (Section 10) is correct — just elevate
it from a recommendation to a hard prerequisite.

---

## Challenge 5: Is This Scope Realistic for a Solo Operator?

**Importance: CRITICAL**

### The Full Scope

The research proposes:

- 10 CLI modes (up from 7)
- Guided mode with delegation triggers
- 7 new discovery agents in 2-wave execution
- 26 intake gap closures (6 elevated to MUST-HAVE)
- Web dashboard with 27 capabilities
- SQLite layer with 4 tables, 25+ indexes, 10 views, FTS5
- Static JSON build pipeline
- Cross-tab synergies with 4+ dashboard tabs
- Firestore annotations collection
- 6 new chart types
- 3-tier filter system
- Clipboard CLI handoff protocol

For a solo non-developer director who manages this project through AI sessions,
this is roughly 4-6 weeks of implementation work. During those weeks, the
existing system continues accumulating debt items (75/session average), bugs
remain unfixed, and no resolution improvement happens.

### The Minimum Viable Expansion

What does the user actually need to manage debt more effectively?

1. **Clean data** (bug fixes) — 1-2 sessions
2. **Better metrics** (BUG-06 fix + enrichment) — included in bug fixes
3. **A "full refresh" command** — 1 session, using existing scripts only
4. **Guided mode on existing modes** — 1-2 sessions, outcome language wrapper
5. **One dashboard page** (KPIs + trend + table) — 2-3 sessions

Total: 5-8 sessions. That is 1-2 weeks, not 4-6. And every item above delivers
independent value — the user could stop after item 3 and still be better off.

### Recommended Action

Scope the /deep-plan to the minimum viable expansion. Put the remaining items
(discovery agents, cross-tab synergies, advanced filters, Firestore annotations,
SQLite layer) in a Phase 2/3 backlog that is explicitly deferred. The user can
pull from it when Phase 1 proves valuable.

---

## Challenge 6: Cross-Tab Synergies Are Premature

**Importance: IMPORTANT**

### The Current State of the Dashboard

The research (D7) notes the debt tab sits alongside "planned Lighthouse, Error
Tracing, Session Activity, Document Sync, Override Audit tabs." The key word is
"planned." As of today:

- Lighthouse tab: partially implemented (data source pending per PERF-002/003)
- Error Tracing tab: unbuilt, no Firestore path found (research confidence: LOW)
- Session Activity tab: unbuilt, no data source defined (research confidence:
  LOW)
- Document Sync tab: unbuilt
- Override Audit tab: unbuilt

The research proposes cross-tab synergies with 4 of these tabs:

- `useDebtMetrics()` shared across Debt, Sessions, Docs, B10
- `setActiveTab` + `setDebtFilter` props for cross-tab navigation
- "Promote to Debt" button pattern for Override/Warning tabs
- Shared `metrics-data.json` as hub data source

Designing integration points with tabs that do not exist is speculative
architecture. The sessions tab has no data source. The errors tab has no
Firestore path. The docs tab has no implementation. Building shared hooks and
cross-tab navigation for consumers that may never be built (or may be built with
different architectures) is premature optimization.

### What to Do Instead

Build the debt tab as a standalone component. Use a simple `fetch` for its data.
Do not lift state to the DevDashboard level. Do not create shared hooks. Do not
pass `setDebtFilter` to tabs that do not exist.

When the next tab is actually built, refactor the shared infrastructure at that
point. The 3-file change for the tab shell (Section 12) is correct and minimal.
The shared infrastructure proposals (R1-R5) are not wrong — they are early.

### Recommended Action

Defer all cross-tab synergy work. Build the debt tab self-contained. Document
the synergy opportunities in the research (they are already documented) so they
can be implemented when the target tabs exist. Do not build bridges to islands
that have not been constructed yet.

---

## Challenge 7: SQLite Adds Complexity for Uncertain Gain

**Importance: IMPORTANT**

### What SQLite Provides

The research proposes SQLite (better-sqlite3) for CLI queries with 4 tables, 25+
indexes, 10 views, and FTS5 full-text search. The stated benefit: faster queries
than JSONL parsing.

### What SQLite Costs

1. **New dependency**: `better-sqlite3` requires native compilation. On Windows
   (the user's platform), this means `node-gyp`, which requires Python and
   Visual Studio Build Tools. The research does not mention this Windows
   dependency chain.

2. **New sync script**: `sync-to-sqlite.js` must be written and maintained. It
   introduces a second source of truth. If the sync fails or is forgotten, the
   SQLite database diverges from MASTER_DEBT.jsonl. The research proposes
   full-rebuild (DELETE + INSERT) to avoid this, but that means every sync
   rewrites all 8,472 records.

3. **New failure mode**: If the SQLite database is corrupted (and SQLite
   databases do occasionally corrupt, especially on Windows with aggressive
   antivirus), the user has a broken query path. JSONL is append-only and
   trivially recoverable.

4. **30 existing scripts use JSONL**: None of them would benefit from SQLite
   without being rewritten. The SQLite layer serves only the CLI query path and
   the build-debt-data.js script, which could equally read JSONL directly.

### What JSONL Already Provides

The research itself notes that full JSONL parse time is 179ms. For a solo-user
dev tool that runs interactively (user waits for menu choices), 179ms is
imperceptible. The user will never notice the difference between 179ms (JSONL)
and 5ms (SQLite indexed query).

The research proposes SQLite primarily to enable the `build-debt-data.js` script
to query efficiently. But `build-debt-data.js` runs at build time, not
interactively. Whether it takes 179ms or 5ms to generate the static JSON is
irrelevant — it runs once per build.

### Recommended Action

Defer SQLite entirely. Build everything on JSONL. The 179ms parse time is
adequate for the current scale and the next 2x of growth. When JSONL becomes a
bottleneck (likely around 20,000-25,000 items based on linear I/O scaling), the
SQLite migration can be designed with full knowledge of how the system is
actually used, rather than speculating now.

If SQLite is desired later, the research's schema (Section 6) is preserved in
this document and can be implemented when the time comes. Nothing is lost by
deferring.

---

## Challenge 8: Phasing Matters More Than Features

**Importance: CRITICAL**

### The Problem with Feature-First Planning

The research presents 15 recommendations (REC-01 through REC-10 plus 5
architecture recommendations). These are organized by category (Immediate,
Architecture, Implementation Sequence, Discovery Agents, CLI Expansion). They
are not organized by phase boundary.

A phase boundary is a point where the user can stop and still have a better
system than before. The research's implementation sequence (REC-07) has 10 steps
but no stop points. If the user stops after step 6 (add Recharts trend charts),
they have a partially-built dashboard with no search and no filters — arguably
worse than no dashboard at all.

### Proposed Phasing

**Phase 1: Bug Fixes + Metrics Enrichment**

- Fix all 6 bugs (BUG-01 through BUG-06)
- Enrich metrics-log.jsonl with by_source and by_category
- Regenerate metrics
- Verify data integrity
- **Value delivered:** Clean, trustworthy data. Every subsequent feature works
  correctly.
- **Estimated effort:** 1-2 sessions
- **Can stop here:** Yes. The system is better with correct data.

**Phase 2: CLI Expansion**

- Add guided mode (outcome-oriented language)
- Add "full refresh" command (sequence existing scripts)
- Add intake scan mode
- Fix intake-audit.js gaps for discovery_source passthrough
- Expand menu from 7 to 10 modes
- **Value delivered:** Faster, more intuitive CLI operations. The user can run a
  complete debt refresh from a single command.
- **Estimated effort:** 2-3 sessions
- **Can stop here:** Yes. The CLI is better and the data is clean.

**Phase 3: Web Dashboard (Minimal)**

- Create `build-debt-data.js` for static JSON generation
- Build debt-tab.tsx with KPI cards, trend chart, sortable table
- Add stale-data banner
- Wire into dev-dashboard.tsx (3-file change)
- **Value delivered:** Visual overview of debt state and trends.
- **Estimated effort:** 2-3 sessions
- **Can stop here:** Yes. The user has a functional read-only dashboard.

**Phase 4: Enhancement (Future)**

- Discovery agents (7 types, 2-wave)
- Advanced filters and grouping
- Fuzzy search
- Cross-tab synergies (when target tabs exist)
- SQLite migration (when scale demands it)
- Firestore annotations
- Export capabilities
- **Value delivered:** Power-user features, automated discovery, richer
  browsing.
- **Estimated effort:** 4-6 sessions
- **Can stop here:** This is the aspirational phase. Pull from it as needed.

### Why This Phasing Works

1. **Each phase is independently valuable.** The user benefits from Phase 1
   alone. Phase 2 adds to Phase 1. Phase 3 adds to Phase 2. Phase 4 is optional.

2. **Each phase de-risks the next.** Phase 1 ensures clean data for Phase 2.
   Phase 2 ensures the CLI works correctly for Phase 3's build pipeline. Phase 3
   validates the dashboard concept before Phase 4 invests in advanced features.

3. **The user can re-prioritize between phases.** After Phase 2, the user might
   decide the CLI is sufficient and skip the dashboard. After Phase 3, the user
   might decide discovery agents are more valuable than advanced filters.
   Phasing preserves optionality.

4. **It respects the solo-operator constraint.** Each phase is 1-3 sessions. No
   phase requires a multi-week commitment. The user is never deep in a
   half-built feature with no exit ramp.

### Recommended Action

Structure the /deep-plan around these 4 phases with explicit gates between them.
Each phase should produce a PR. Each phase should be usable without the
subsequent phases. The research's comprehensive feature list becomes Phase 4's
backlog — valuable as documentation, not as an immediate implementation spec.

---

## Summary

| #   | Challenge                                     | Importance | Recommended Action                                               |
| --- | --------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| 1   | Web dashboard not needed NOW                  | CRITICAL   | Defer to Phase 3; CLI expansion delivers 80% of value            |
| 2   | Simplest useful dashboard                     | IMPORTANT  | Scope v1 to KPIs + trend + sortable table (5 of 27 capabilities) |
| 3   | 13% resolution rate worsens with more intake  | CRITICAL   | Invest in resolution tooling before expanding intake             |
| 4   | 6 bugs corrupt the data foundation            | CRITICAL   | Phase 1 is bug fixes only, no new features                       |
| 5   | Scope unrealistic for solo operator           | CRITICAL   | Minimum viable expansion: 5-8 sessions, not 4-6 weeks            |
| 6   | Cross-tab synergies are premature             | IMPORTANT  | Defer until target tabs exist; build debt tab standalone         |
| 7   | SQLite adds complexity for imperceptible gain | IMPORTANT  | Defer entirely; 179ms JSONL parse is adequate                    |
| 8   | Phasing matters more than features            | CRITICAL   | 4-phase plan with independent value at each stop point           |

### The Three Most Important Takeaways

1. **Fix the data first.** Nothing else matters if the foundation is wrong.
   Phase 1 is non-negotiable and should be gated before any feature work.

2. **Phase > Feature.** The research identified the right features. This
   challenge is about ordering them so each phase delivers standalone value and
   the user is never stranded mid-build with nothing usable.

3. **Resist the momentum of comprehensive research.** The research is thorough
   enough to be seductive — "we know exactly what to build, so let's build all
   of it." The discipline is building the minimum that delivers value, measuring
   whether it actually helps, and then deciding what to build next.
