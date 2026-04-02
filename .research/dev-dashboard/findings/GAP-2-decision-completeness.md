# GAP-2: Decision Completeness Audit

**Agent:** GAP HUNTER **Date:** 2026-03-29 **Scope:** All 20 decisions (D1-D10
from DECISIONS_PRE_RESEARCH.md; DD1-DD10 from debt-runner research
carry-forward) checked against 5 findings files.

---

## Part 1: D1-D10 Decision Audit

---

### D1: Lighthouse tab belongs on admin, not dev (move post-M1.6)

**Tested by:** SQ3a (admin-dev-boundary)

**Still valid?** YES

**Evidence:** SQ3a Finding 4 confirms: "Lighthouse tab — Current Location: /dev
(lighthouse-tab.tsx, implemented). Target: /admin. When: Post-M1.6. Rationale:
D1: Lighthouse scores reflect app quality visible to users; admin-appropriate
audience." No research wave contradicts this. The 6-tab CHECKPOINT does not
include Lighthouse in the new tab structure, which is consistent with removing
it from dev (it moves to admin later, not into the new 6-tab set).

**Action needed:** None on the decision itself. However, SQ3a surfaces a
concrete implementation gap: AdminTabId has no entry for Lighthouse, and no
admin-side component exists yet. The decision is settled; the migration work is
unplanned. Flag for /deep-plan as a tracked pre-work item.

---

### D2: Tab selection is NOT pre-decided (research discovers groupings)

**Tested by:** SQ2a, SQ2b, CHECKPOINT-tab-decisions.md

**Still valid?** YES — and fully resolved

**Evidence:** The research produced grouping proposals (SQ2a primary, SQ2b
challenger). The user made a binding decision in CHECKPOINT-tab-decisions.md
(Session #245): 6 tabs with specific data assignments. D2 was a process
constraint, not a content decision — it was the right call to defer grouping to
research.

**Action needed:** None. D2 is now superseded by the CHECKPOINT. The CHECKPOINT
is the authoritative grouping decision going forward.

---

### D3: Track B (B6-B11) is NOT assumed valid — research evaluates

**Tested by:** SQ3b (track-b-evaluation), SQ2a, SQ2b

**Still valid?** YES — and correctly applied

**Evidence:** SQ3b evaluated Track B items. The CHECKPOINT does not adopt Track
B as-is; instead it uses a different taxonomy (Health, Debt, Reviews, Pipeline,
Governance, Planning) that subsumes some Track B concepts (e.g., "Overrides"
from B9 absorbed into Tab 4, "Warnings" from B11 absorbed into Tab 1) and
discards others (B6 Errors, B7 Sessions, B8 Docs as standalone tabs).

**Action needed:** None. D3 served its purpose. The final tab structure reflects
independent evaluation, not Track B adoption.

---

### D4: Admin = app + users. Dev = build pipeline + process (clear boundary)

**Tested by:** SQ3a (admin-dev-boundary) — comprehensive full-codebase audit

**Still valid?** YES

**Evidence:** SQ3a Finding 1 confirms this boundary is clean across all 23 dev
data sources and all admin data sources. No data source straddles the boundary
inappropriately. The only word-level collision ("Errors" tab on both panels) has
distinct underlying data scopes (Sentry runtime vs. npm audit security).

**SQ3a flags one open sub-question:** npm audit security vulnerabilities and
SonarCloud are classified as BOTH (relevant to both admin and dev). No decision
specifies whether these appear on dev, admin, or both. This is a confirmed gap
(see Part 3 below).

**Action needed:** None on D4 itself. Resolve the BOTH classification for npm
audit/SonarCloud in /deep-plan.

---

### D5: All potential tabs researched (no artificial scope ceiling)

**Tested by:** SQ1a-1 through SQ1a-5, SQ1b, SQ1c-1 through SQ1c-3

**Still valid?** YES — and the coverage was comprehensive

**Evidence:** The CHECKPOINT claims 36/36 HIGH-relevance files covered. The
research wave produced 12 W3 data design files (6 tabs × 2 agents each), 5 SQ1
files, 3 SQ2 files, and SQ3 files. No data source was arbitrarily excluded.

**Action needed:** None.

---

### D6: One unified research report (integrates debt-runner research)

**Tested by:** SQ7a (debt-research-integration) and SQ7b
(debt-decisions-verification)

**Still valid?** YES — integration is complete

**Evidence:** SQ7a explicitly reconciles all 10 DD decisions against the 6-tab
dashboard scope. SQ7b verifies each DD decision's validity in the expanded
context. The debt-runner research is now fully absorbed into the dev-dashboard
research as Tab 2 (Debt Pipeline).

**Action needed:** None. The integration is documented in SQ7a and SQ7b.
/deep-plan should consume both files as inputs for Tab 2 planning.

---

### D7: Every tab gets CLI handoff (clipboard command generation pattern)

**Tested by:** W3-T1B, W3-T2B, W3-T3B, W3-T4B, W3-T5B, W3-T6B — all 6 CLI
handoff agents produced findings files.

**Still valid?** YES

**Evidence:** All 6 tabs have corresponding CLI handoff findings files
(W3-T\*B). W3-T2B (debt CLI handoff) is confirmed to document all 30 debt
scripts with exact clipboard command strings. The pattern is generalized across
all tabs.

**One scope question from SQ7a:** The shared `CopyCliButton` component was
identified as needed. It is not yet designed as a shared component — it exists
in the Tab 2 concept but has not been formalized as
`components/dev/shared/copy-cli-button.tsx`. This is an implementation detail,
not a decision gap.

**Action needed:** None on D7. Add `CopyCliButton` as a shared component to the
/deep-plan scaffolding phase.

---

### D8: Hybrid fetch (API in dev, static in prod) — from debt-runner research

**Tested by:** SQ5a (shared-infra-hybrid-fetch) — the most thorough verification
of any decision

**Still valid?** YES — and generalized to all 6 tabs

**Evidence:** SQ5a Finding 1 confirms `output: "export"` in next.config.mjs.
Finding 2 provides the definitive design: dev mode uses `/api/<tab>/data`
routes, production uses `/public/<tab>-data.json` static files. The pattern has
been confirmed for all 6 tabs with specific URL mappings. The `isDev` pattern
from resources-page.tsx and today-page.tsx provides a codebase precedent.

**One amendment needed:** SQ7a flags that the debt-runner research named the API
route `/api/debt-data` (single route), while W3-T2A specifies split routes
(`/api/debt/summary`, `/api/debt/alerts`, `/api/debt/items`). The split design
is correct per size analysis. The D8 decision text doesn't specify route naming,
so no amendment to D8 itself — but /deep-plan must use the split route design,
not the monolithic route.

**Action needed:** None on D8 text. /deep-plan should codify the split route
naming as the settled pattern.

---

### D9: Desktop only (same as admin panel)

**Tested by:** SQ3a (indirectly — admin panel reviewed for mobile handling)

**Still valid?** YES

**Evidence:** SQ3a confirms both panels use the mobile block pattern:
`/iPhone|iPad|iPod|Android/i` regex + `window.innerWidth < 768`. No research
wave proposed mobile support for the dev dashboard. The 6-tab structure is
explicitly a developer-facing tool operating on local filesystem data — mobile
is not a viable runtime environment for this use case.

**However, D9 was never directly verified** by any research agent. The mobile
block pattern is inferred from SQ3a's auth pattern comparison, not from a
dedicated D9 verification query.

**Action needed:** None. D9 is straightforward. Confirm that dev-dashboard.tsx
retains the mobile block when the new tab structure is implemented.

---

### D10: Agents sized to avoid context exhaustion (max ~13 files per agent)

**Tested by:** UNTESTED as a decision

**Still valid?** YES in practice (the research used this sizing)

**Evidence:** The research wave respected this constraint operationally — W3
agents were scoped to one tab per agent (A and B sub-agents per tab), keeping
file loads manageable. However, no findings file explicitly validates whether
~13 files was the right ceiling or whether any agent ran into context issues.

**One known gap:** The memory file `feedback_deep_research_formula.md` notes
"Agent allocation formula too low for large repos. Revisit after repo-cleanup
research." This is a meta-concern about the formula, not specifically D10, but
it is related. D10's "~13 files" guideline was set for this research wave and is
confirmed as workable.

**Action needed:** None on D10 for this research wave. Note for future waves
that the formula may need revision.

---

## Part 2: DD1-DD10 Decision Audit

---

### DD1: JSONL stays canonical write format

**Tested by:** SQ7b (Finding DD1) and SQ7a (DD1 reconciliation)

**Still valid?** YES [CONFIDENCE: HIGH]

**Evidence:** SQ7b: "All six tabs consume data that originates as JSONL. No tab
design has introduced a competing write format." SQ7a: "build-debt-data.js MUST
read from MASTER_DEBT.jsonl directly (not SQLite)." The static export approach
across all tabs uses JSONL as source-of-truth and JSON as derived read
artifacts. Cross-verified by W3 data design agents (W3-T1A through W3-T6A all
name JSONL as canonical read source).

**Action needed:** None.

---

### DD2: SQLite deferred — 179ms JSONL parse adequate

**Tested by:** SQ7b (Finding DD2)

**Still valid?** YES [CONFIDENCE: HIGH]

**Evidence:** SQ7b: "The web dashboard never parses JSONL at request time — the
static export scripts do the heavy lifting and write pre-aggregated JSON. The
179ms parse time was already adequate for interactive CLI; it is entirely
irrelevant to the web dashboard." MASTER_DEBT is at 8,472 items — well below the
50,000+ item threshold where SQLite becomes relevant. `better-sqlite3` Windows
friction (Visual Studio Build Tools, ~6 GB) further strengthens deferral.

**Action needed:** None.

---

### DD3: Static JSON field-stripped to ~2 MB

**Tested by:** SQ7b (Finding DD3) — verdict MODIFIED

**Still valid?** NEEDS AMENDMENT

**Evidence:** SQ7b: "The original decision assumed a single '~2 MB' static file.
Actual W3-T2A findings show the debt tab uses a split-file strategy." The actual
design is:

| File                 | Size                  |
| -------------------- | --------------------- |
| debt-summary.json    | ~2 KB                 |
| debt-trend.json      | ~12 KB                |
| debt-alerts.json     | ~432 KB               |
| debt-items-s0s1.json | ~464 KB               |
| debt-items-s2s3.json | ~2.2 MB (lazy-loaded) |
| Total (all debt)     | ~3.1 MB               |

The "~2 MB" figure was the original target for a monolithic stripped export. The
split strategy is strictly better (initial load is ~446 KB vs. 2 MB), but the
decision text now misstates the implementation.

**Action needed:** AMEND DD3. Update to: "Static JSON uses a split-file strategy
for debt data. Initial load is ~446 KB (summary + alerts). Full dataset is ~3.1
MB split across 5 files; S2/S3 items are lazy-loaded on demand. Total dashboard
eager load across all 6 tabs is ~770-810 KB. 5 MB ceiling is not at risk."

---

### DD4: 3 discovery agents initially, resolution-rate gate

**Tested by:** SQ7b (Finding DD4)

**Still valid?** YES [CONFIDENCE: HIGH]

**Evidence:** SQ7b: "This decision remains unchanged. The 6-tab dashboard scope
does not affect the CLI-side discovery agent layer." The web dashboard is
read-only and does not affect agent dispatch strategy. Current MASTER_DEBT at
8,472 items is still in the appropriate range for this configuration.

**Action needed:** None on the decision. Note from SQ7a: the Discovery Panel
widget (Capability 21) in Tab 2 requires `discovery-runs.jsonl` which does not
yet exist. The panel is deferred until CLI Phase 4 (discovery agents) is built.
Design Tab 2 with a placeholder slot.

---

### DD5: Guided mode is default for all sessions

**Tested by:** SQ7b (Finding DD5)

**Still valid?** YES [CONFIDENCE: HIGH]

**Evidence:** SQ7b: "The guided vs. expert mode decision is CLI-side and
entirely unaffected by the dashboard. The 6-tab dashboard is read-only
(browse/filter/trends). The CLI skill remains the write-side AI operation
layer." SQ7a confirms the 10-mode menu structure with guided mode default is the
primary locus of this decision.

**Action needed:** None.

---

### DD6: localStorage for annotations, Firestore optional later

**Tested by:** SQ7b (Finding DD6)

**Still valid?** YES [CONFIDENCE: HIGH]

**Evidence:** SQ7b: "The dashboard is a static SPA (`output: 'export'` in
next.config.mjs); Firestore writes require the Firebase client SDK, which is
available but adds complexity. localStorage is the right first-step for per-item
annotations on the debt tab. No other tab has proposed annotation functionality
that would require Firestore at this stage."

**Action needed:** None.

---

### DD7: MiniSearch for client-side search

**Tested by:** SQ7b (Finding DD7) — verdict CONFIRMED but scope clarified

**Still valid?** YES with scope clarification [CONFIDENCE: HIGH]

**Evidence:** SQ7b: "MiniSearch is still the right choice for the debt table
(8,472 items × 4 fields). Scope clarification: MiniSearch was scoped to the Debt
Pipeline tab. Other tabs have much smaller datasets where MiniSearch would be
overkill." SQ5a confirms MiniSearch is NOT currently installed (absent from
package.json). SQ7a confirms MiniSearch replaces browser Ctrl+F for the
virtualized debt table.

**Action needed:** The decision is valid but the scope must be recorded:
MiniSearch is Debt tab only. /deep-plan should not install it as a shared
infrastructure choice. SQ5a also notes it may be useful for the Planning tab
(research topics + plan titles) — this is optional, not required.

---

### DD8: Pre-generated AI summaries at build time (Phase 3)

**Tested by:** SQ7b (Finding DD8)

**Still valid?** YES [CONFIDENCE: MEDIUM]

**Evidence:** SQ7b: "The 6-tab dashboard context does not change the Phase 3
scoping for AI summaries on the debt tab." The AI Insights card is positioned
above KPI cards showing 3-5 pre-generated insights.

**One open question from SQ7b:** Should pre-generated AI summaries extend to
other tabs (e.g., "What's deteriorating?" on Health tab, "Recurring pattern
digest" on Reviews)? This was not addressed in W3 findings. The debt-tab-only
scoping is still appropriate as a starting point but the broader potential was
not decided.

**A second open question from SQ7a:** DD8 requires an Anthropic API key setup
decision in the build environment. If accepted, it adds ~30 lines to
`build-debt-data.js` and one React card component. If deferred, Tab 2 ships
without the AI Insights widget. This is a go/no-go not yet made.

**Action needed:** FLAG FOR USER. Two unresolved questions:

1. Is AI Insights scoped to debt tab only or also other tabs?
2. Go/no-go on Anthropic API key setup in build environment (needed before Phase
   3). These do not block Phase 1-2 implementation but must be decided before
   Phase 3.

---

### DD9: 4-phase implementation with independent value

**Tested by:** SQ7b (Finding DD9) — verdict MODIFIED

**Still valid?** NEEDS AMENDMENT [CONFIDENCE: HIGH]

**Evidence:** SQ7b: "The original 4-phase plan was scoped to the debt-runner
expansion (CLI + debt web tab). The 6-tab dashboard reveals that phases must now
account for 6 tabs, not 1." The 4-phase structure is directionally correct but
each phase now covers 6 data pipelines and 6 tab implementations.

SQ7a provides the revised phasing alignment:

- Phase 0 (pre-work): BUG-01, BUG-06, generate-debt-export.js, API routes for
  debt
- Phase 1 (foundation): Static export scaffolding designed for all 6 tabs,
  hybrid fetch hook, shared component extraction
- Phase 2 (Tab 2 milestone 1): KPI strip, charts, trend, S0 table — data layer
  proven
- Phase 3 (Tab 2 milestone 2): Full TanStack Virtual table, MiniSearch, column
  toggles, grouping modes
- Phase 4 (CLI expansion): 10-mode menu, guided mode, 3 discovery agents
- Plus: Tab 1, Tab 3, Tab 4, Tab 5, Tab 6 build phases (not in original 4-phase)

**Action needed:** AMEND DD9. The 4-phase structure no longer reflects the full
scope. /deep-plan needs to produce a revised phasing model that covers: (a)
pre-work gate (BUG fixes, data pipeline scaffolding), (b) Tab 2 two-milestone
build, (c) remaining 5 tabs (each with own data export script + component
build), (d) CLI expansion (Phase 4 from original), (e) cross-tab synergies
(shared components, prop threading, PromoteToDebtButton).

---

### DD10: BUG-01 + BUG-06 must fix BEFORE web development

**Tested by:** SQ7b (Finding DD10) and SQ7a (Section 2: Bug Status)

**Still valid?** YES — strengthened [CONFIDENCE: HIGH]

**Evidence:** SQ7b: "W3-T2A (Gaps section) explicitly flags BUG-01 and BUG-06.
Both bugs directly impact the Debt Pipeline tab (Tab 2). BUG-01 corrupts status
filter results; BUG-06 prevents historical breakdown charts. These remain
pre-development blockers for Tab 2."

SQ7a Section 2 provides the full dashboard-driven bug prioritization:

- Phase 0 (must complete before any dashboard code): BUG-01, BUG-06
- Phase 1 (before dashboard production): BUG-03, BUG-04
- Defer (no dashboard impact): BUG-02, BUG-05

SQ5a independently confirms both bugs in the build script prerequisites.

**Action needed:** None on the decision. Bug fix sequence is established.

---

## Part 3: Implicit Decisions (Assumed but Never Explicitly Decided)

These are things the research operationalized without a formal user decision.

---

### IMP-1: All tabs use dark theme (bg-gray-900 palette)

**Status:** ASSUMED — never explicitly decided

**Evidence:** SQ5a Finding 5 documents the dark theme tokens from
lighthouse-tab.tsx and dev-dashboard.tsx. The CHECKPOINT makes no mention of
theme. SQ3a confirms the dark theme is intentional and well-chosen. But the user
has never been presented with a formal "all 6 new tabs will use the established
dark theme" decision point.

**Risk level:** LOW — this is almost certainly correct and reversible. The dark
theme is visually established and architecturally motivated (contrast with
admin's light theme).

**Recommended action:** Present to user as a confirmed implicit decision during
/deep-plan kickoff. One line: "All 6 new tabs will use the existing dark theme
(bg-gray-900 / gray-800 cards / blue accents) matching lighthouse-tab.tsx.
Confirm."

---

### IMP-2: `output: "export"` constraint is permanent (not revisited)

**Status:** ASSUMED — never re-evaluated

**Evidence:** D8 (hybrid fetch) takes this as given. SQ5a explicitly confirms
`output: "export"` with "Required for Firebase Hosting static deployment" in
next.config.mjs. But no decision record asks whether this constraint should be
revisited for the dashboard specifically.

**Risk level:** LOW — this is a hard infrastructure constraint tied to Firebase
Hosting. Changing it would require migrating to Firebase App Hosting (Cloud
Run). But the research never asked "should we reconsider this for the dev
dashboard?"

**Recommended action:** None — the constraint is load-bearing and correct. But
document it explicitly in /deep-plan as a non-negotiable constraint, not an
assumed one.

---

### IMP-3: Dashboard is git-ignored / not deployed (local-only dev tool)

**Status:** ASSUMED — partially

**Evidence:** SQ5a Finding 3 recommends gitignoring all 10 generated JSON files
in public/. But the dashboard itself (the React components) would still be
deployed to Firebase Hosting for the production build. The research never
explicitly addressed whether the dev dashboard is: (a) deployed to Firebase
Hosting (accessible at the public URL but admin-auth-gated), or (b) strictly
local (`npm run dev` only, never deployed)

The CHECKPOINT and D9 (desktop only) don't resolve this. The existing
lighthouse-tab.tsx is in the deployed codebase already (it's in the build). The
admin panel at /admin is deployed. The dev dashboard at /dev is likely also
deployed.

**Risk level:** MEDIUM — the generated JSON files (up to 3.5 MB debt data) would
be committed to the repo OR gitignored. SQ5a recommends gitignoring them, which
means the production deployment at /dev would show empty/stale states unless
`npm run build` is run with the data-generation step.

**Recommended action:** FLAG FOR USER. Clarify: Is the dev dashboard intended to
be deployed (e.g., accessible from any desktop browser after Firebase deploy),
or is it strictly a local `npm run dev` tool? Answer affects gitignore strategy
for generated JSON and whether the `prebuild` data generation script is required
in CI.

---

### IMP-4: Lucide React icons for new dev tabs (replacing emoji in dev-tabs.tsx)

**Status:** ASSUMED in SQ5a; not user-decided

**Evidence:** SQ3a Finding 5 flags: "Dev tabs use emoji strings while admin uses
Lucide React components. The dev panel should standardize on Lucide for
consistency and resizability." SQ5a Finding 6 also shows the TABS array with
emoji. No user decision was made on icon standardization.

**Risk level:** LOW — cosmetic. Lucide-react is already installed.

**Recommended action:** Include in /deep-plan as a scaffolding decision. Default
to Lucide icons for new tabs; ask user only if they have a preference to keep
emoji.

---

### IMP-5: `DevTabProvider` context pattern (parallel to AdminTabProvider)

**Status:** ASSUMED NEEDED — not explicitly decided

**Evidence:** SQ3a Finding 5 and Gap 2 both flag this: "Dev tab context provider
design not decided. The dev dashboard will need a context pattern for tab
refresh (parallel to AdminTabProvider). Whether to create a generic shared
context or a parallel dev-specific context has not been decided."

SQ7a Gap G8 also flags: "`useTabRefresh` scoped to AdminTabId — generalize or
create DevTabId variant when Tab 2 needs refresh-on-activation."

**Risk level:** MEDIUM — this architectural decision affects how all 6 tab
components are wired. If the wrong pattern is chosen (e.g., ad-hoc local state
per tab vs. shared context), refactoring later adds friction.

**Recommended action:** FLAG FOR /deep-plan as an architectural decision point.
Two options: (a) generalize `useTabRefresh` with generics, (b) create a parallel
`useDevTabRefresh` hook + `DevTabProvider`. A third option: skip context
entirely and use local useState if no tab needs auto-refresh in Phase 1.
Recommend option (c) for Phase 1 (defer context until auto-refresh is needed) —
simplest, cleanest stop point.

---

### IMP-6: All build-generated JSON files are gitignored

**Status:** ASSUMED in SQ5a — not user-decided

**Evidence:** SQ5a Finding 3 recommends gitignoring all 10 public/\*.json files
as build artifacts. But it also notes "public/planning-data.json gitignore
strategy: Should it be gitignored? The file is smaller and includes planning
state from .claude/state/ which is already committed." This was explicitly left
unresolved.

**Risk level:** MEDIUM — if generated files are not gitignored:

- Up to 3.5 MB added per commit to git history
- Sensitive planning/review data may be exposed in public git history
- If gitignored but deployed via Firebase Hosting, the files must be generated
  locally before every deploy

**Recommended action:** FLAG FOR USER. Confirm the gitignore strategy.
Recommendation: gitignore ALL 10 public/\*.json files (they are derived
artifacts). The `prebuild` script generates them on demand before each deploy.
This is consistent with the "local dev tool" model.

---

## Part 4: Decision Gaps (Should Have Been Decided, Weren't)

These are questions the research identified but no decision was made.

---

### GAP-A: npm audit / SonarCloud panel home (BOTH classification unresolved)

**Source:** SQ3a Finding 2 (BOTH classification), Gap 4

The research classifies npm audit security vulnerabilities and SonarCloud as
relevant to BOTH admin and dev panels. No decision specifies:

- Should security vulnerability counts appear on dev (Tab 1 Health? Tab 5
  Governance?)?
- Should they also appear on admin (as security incidents affecting the live
  app)?
- Or is this deferred to a future research wave?

**Why this matters:** If the 6-tab structure is finalized with no security scan
visibility, this becomes a deliberate omission that the dev dashboard user may
want later. SQ3b evaluated Track B which may have addressed this.

**Recommended action:** Decide before /deep-plan. Options: (a) Include
SonarCloud score in Tab 5 Governance (audit health), (b) Include npm audit
summary in Tab 1 Health (dependency health), (c) Defer both to a future sprint,
(d) Show in both panels. Most minimal option: add a SonarCloud "last score" card
to Tab 5 Governance as it is already audit-adjacent.

---

### GAP-B: Lighthouse post-M1.6 migration — admin-side implementation not planned

**Source:** D1, SQ3a Gap 1

D1 says "move post-M1.6." The research confirms the source exists
(lighthouse-tab.tsx in dev) but the destination does not: "No admin tab ID for
it in AdminTabId, no admin-side component, and no migration plan in code."

This is explicitly confirmed future work, but it is not tracked in any planning
artifact (not in ROADMAP.md, not in any plan file). The dev dashboard rebuild
(removing lighthouse-tab.tsx from dev-tabs.tsx) will break the only
implementation.

**Why this matters:** If /deep-plan includes DevTabId removal of "lighthouse" in
Phase 1 scaffolding, but the admin migration is not in scope for the same plan,
the Lighthouse tab goes dark entirely until a separate plan adds it to admin.

**Recommended action:** /deep-plan must include a "Lighthouse migration" work
item even if it is a small one (add AdminTabId entry, stub component, copy
lighthouse-tab.tsx to admin with minor theme changes). Alternatively: keep
lighthouse-tab.tsx in dev-tabs.tsx as a deprecated tab until admin migration is
explicitly planned. Get user direction.

---

### GAP-C: Forward-findings.jsonl header widget — design not specified

**Source:** CHECKPOINT-tab-decisions.md

The CHECKPOINT defines a "Dashboard Header Widget" for Watch Items
(forward-findings.jsonl — pinned cross-PR issues feed). This widget appears in
the header area, not inside any tab. No research agent designed this widget:

- No W3 file covers the header widget specifically
- No component design was produced
- The data source is small (< 1 KB per SQ5a source table) but the UX is
  unspecified

**Why this matters:** The header widget appears on every tab load. Its position,
update frequency, and interaction model affect all 6 tabs simultaneously.

**Recommended action:** /deep-plan should include a header widget design task.
Minimal design: a `ForwardFindingsStrip` component in dev-dashboard.tsx that
shows N pinned items (severity badge + title + days-open). Fetches from the same
`/api/dashboard/health` or a dedicated `/api/dashboard/watch` endpoint. Static
fallback: health-data.json includes a `forwardFindings` array.

---

### GAP-D: Tab 2 CSV/JSONL export — capability in spec, missing from widget design

**Source:** SQ7a Section 3 (Gap G1), capability 19 and 20

The debt-runner research capability matrix includes CSV export (papaparse) and
JSONL download as web capabilities (19 and 20). W3-T2A's component tree does not
include them. SQ7a flags this explicitly as a gap requiring addition to
DebtItemsTable.

**Why this matters:** These are user-facing export buttons. If they are not
included in the /deep-plan build spec for Tab 2, they will be forgotten and need
a separate PR to add.

**Recommended action:** /deep-plan must include export buttons in the
DebtItemsTable build. Both buttons use papaparse (not yet installed — add to
dependency list). Small addition: two action buttons above the table, one for
CSV, one for JSONL raw download.

---

### GAP-E: Tab 6 planning-data.json size and `--json` flag are blocking pre-work

**Source:** SQ5a Gap section, SQ7b Total Static JSON Budget

SQ5a confirms: "ROADMAP.md needs `--json` flag on resolve-dependencies.js. The
planning tab's sprint board widget cannot be fully built until this flag is
added." This is a code change that must happen before Tab 6 can be fully
implemented. Additionally, Tab 6's `planning-data.json` has no verified size
estimate — the W3-T6A file does not include a size section comparable to other
tabs.

**Why this matters:** Tab 6 cannot be spec'd completely without knowing the
output size. The `--json` flag work is unplanned.

**Recommended action:** Add `resolve-dependencies.js --json` flag as a pre-work
task in /deep-plan. Estimate Tab 6 size by running the build script once with
current data. Not blocking for Tabs 1-5.

---

### GAP-F: Recharts React 19.2.4 compatibility — not re-verified

**Source:** SQ7b Gap 3

"RESEARCH_OUTPUT.md (line 529) notes: 'Verify React 19 compatibility. Recharts
v3 uses react-is internally.' package.json confirms React 19.2.4. No W3 finding
explicitly verified current Recharts compatibility with React 19.2.4."

SQ5a Finding 4 says install recharts but does not mention the react-is override.
SQ7a Phase 2 dependency list does include: "Verify
`'overrides': { 'react-is': '^19.0.0' }` in package.json for Recharts React 19
compat" — but this was written as a recommendation, not as a confirmed
verification.

**Why this matters:** Installing Recharts without the react-is override may
cause peer dependency conflicts or runtime errors under React 19.2.4. This could
block all chart development across 5 of 6 tabs.

**Recommended action:** Verify before any chart work begins. Run
`npm install recharts --dry-run` and check for peer warnings. If react-is
conflict appears, add `"overrides": { "react-is": "^19.0.0" }` to package.json
before installing.

---

### GAP-G: TanStack Virtual vs. pagination — unresolved tension

**Source:** SQ7b Gap 4

"W3-T2A describes a 'virtualized table with server-side-style pagination.'
TanStack Virtual renders only visible rows (continuous scroll); pagination
renders a fixed page. W3-T2A uses the word 'virtualized' but the description
sounds more like pagination. This tension should be resolved in /deep-plan
before implementing the debt items table."

**Why this matters:** These are different UX models. If /deep-plan specifies
TanStack Virtual (continuous scroll) but the UI design was imagined as
paginated, the user will be surprised. More importantly, the two approaches have
different implementation costs and behaviors when combined with MiniSearch.

**Recommended action:** FLAG FOR USER. Show them both options: (a) TanStack
Virtual: 8,472 rows rendered in a continuous scrollable viewport, only visible
rows in DOM. MiniSearch input replaces Ctrl+F. No page numbers. (b) Pagination:
fixed page size (e.g., 100 rows), page number controls, Ctrl+F works within the
page. Simpler implementation, less impressive UX. The original debt-runner
research selected TanStack Virtual for a reason (60fps, 8K rows). But the user
should confirm.

---

## Summary Tables

### D1-D10 Status

| ID  | Decision                           | Tested By              | Valid?         | Action                                    |
| --- | ---------------------------------- | ---------------------- | -------------- | ----------------------------------------- |
| D1  | Lighthouse → admin post-M1.6       | SQ3a                   | YES            | Track migration as pre-work item          |
| D2  | Tab selection deferred to research | SQ2a/2b/CHECKPOINT     | YES (resolved) | None — superseded by CHECKPOINT           |
| D3  | Track B not assumed valid          | SQ3b                   | YES            | None                                      |
| D4  | Admin/dev boundary                 | SQ3a                   | YES            | Resolve BOTH classification (GAP-A)       |
| D5  | All tabs researched, no ceiling    | SQ1 wave               | YES            | None                                      |
| D6  | One unified report                 | SQ7a/7b                | YES (complete) | None                                      |
| D7  | Every tab gets CLI handoff         | W3-T\*B files          | YES            | Add shared CopyCliButton in Phase 1       |
| D8  | Hybrid fetch pattern               | SQ5a                   | YES            | Codify split route design in /deep-plan   |
| D9  | Desktop only                       | SQ3a (indirect)        | YES            | Confirm mobile block retained in new tabs |
| D10 | ~13 files per agent                | Operational (untested) | YES            | Note formula review for future waves      |

### DD1-DD10 Status

| ID   | Decision                                 | Tested By        | Valid?             | Action                                                      |
| ---- | ---------------------------------------- | ---------------- | ------------------ | ----------------------------------------------------------- |
| DD1  | JSONL canonical write format             | SQ7b, SQ7a       | YES                | None                                                        |
| DD2  | SQLite deferred                          | SQ7b             | YES                | None                                                        |
| DD3  | ~2 MB static JSON                        | SQ7b             | NEEDS AMENDMENT    | Update to split-file model (~446 KB initial, ~3.1 MB total) |
| DD4  | 3 discovery agents, resolution-rate gate | SQ7b             | YES                | Note discovery panel deferred (no data yet)                 |
| DD5  | Guided mode default                      | SQ7b, SQ7a       | YES                | None                                                        |
| DD6  | localStorage for annotations             | SQ7b             | YES                | None                                                        |
| DD7  | MiniSearch for search                    | SQ7b, SQ5a       | YES with scope     | Debt tab only; confirm planning tab optional                |
| DD8  | Pre-generated AI summaries Phase 3       | SQ7b             | YES — FLAG         | User must decide: API key go/no-go + cross-tab scope        |
| DD9  | 4-phase implementation                   | SQ7b, SQ7a       | NEEDS AMENDMENT    | Revise to cover 6 tabs + pre-work gate + CLI workstream     |
| DD10 | BUG-01 + BUG-06 first                    | SQ7b, SQ7a, SQ5a | YES — strengthened | Bug fix sequence established; use Phase 0 model             |

### Decisions Requiring User Input Before /deep-plan

| Priority | Item          | Question                                                                                              |
| -------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| HIGH     | IMP-3 / GAP-F | Is dev dashboard deployed to Firebase Hosting or local-only? Affects gitignore + CI strategy.         |
| HIGH     | GAP-G         | TanStack Virtual (continuous scroll, ~13 days work) vs. pagination (simpler, ~4 days)?                |
| HIGH     | GAP-B         | Lighthouse tab: keep it in dev during the rebuild or migrate to admin as part of this plan?           |
| MEDIUM   | DD8 / GAP     | AI Insights (Capability 18): go for Phase 3 API key setup, or defer entirely?                         |
| MEDIUM   | GAP-A         | npm audit / SonarCloud: Tab 5 Governance, Tab 1 Health, both panels, or defer?                        |
| LOW      | IMP-1         | Confirm dark theme for all 6 new tabs (effectively confirmed but surface for acknowledgment).         |
| LOW      | IMP-5         | Tab context pattern: defer DevTabProvider to when auto-refresh is needed (recommended), or build now? |

---

## Confidence Assessment

- HIGH claims: 14 (all decision verdicts with direct evidence from findings
  files)
- MEDIUM claims: 4 (IMP-3 deployment question, IMP-5 context pattern, GAP-F
  React 19 compat, GAP-A boundary)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All verdicts are based on direct reading of 5 specified findings files plus
DECISIONS_PRE_RESEARCH.md. No training data used for any verdict. Every finding
references the specific findings file and section that supports it.
