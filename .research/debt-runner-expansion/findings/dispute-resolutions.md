# Dispute Resolutions -- debt-runner Expansion Research

**Resolved by:** Dispute Resolution Agent **Date:** 2026-03-27 **Inputs:**
RESEARCH_OUTPUT.md (revised), V1-codebase-verification.md,
V2-data-verification.md, contrarian-1.md, contrarian-2.md, otb-1.md, otb-2.md

---

## Dispute 1: Firestore Role -- "Not Needed" vs "Needed for Annotations"

### Context

- QA answer (pre-plan): "Firebase shouldn't be needed, correct?" -- answered
  affirmatively, meaning no Firestore for bulk debt data.
- SQ5 recommends Firestore at `dev/debt/annotations/{debtId}` for bookmarks and
  notes on individual debt items.
- Contrarian-1 (Challenge 5) argues: for a solo developer, localStorage is
  sufficient. Cross-device persistence is not a launch requirement.
- CLAUDE.md Security Rule #1: no direct Firestore writes -- all mutations go
  through Cloud Functions (`httpsCallable`). Adding Firestore annotations means
  writing a new Cloud Function, App Check enforcement, and rate limiting.

### RESOLUTION

**Start with localStorage. Design the annotation schema to be
Firestore-portable. Migrate only if a concrete cross-device need emerges.**

### RATIONALE

Three factors converge on localStorage as the correct V1 choice:

1. **Security overhead is disproportionate.** CLAUDE.md Rule #1 requires Cloud
   Functions for all Firestore writes. A new `saveDebtAnnotation` Cloud
   Function, App Check verification, rate limiting, and Zod validation would be
   needed for what amounts to saving a bookmark on a local dev tool. The
   engineering cost exceeds the value for a solo user.

2. **Data loss risk is manageable.** localStorage persists until explicitly
   cleared. The concern about "browser clear losing data" is valid but rare --
   the user would have to clear site data intentionally. For a dev tool bookmark
   (not a financial record), this risk is acceptable. If it ever becomes
   unacceptable, that is the signal to migrate.

3. **The "no Firebase" claim becomes genuinely accurate.** The revised report
   already leans this direction. Adopting localStorage eliminates the
   contradiction entirely.

**The middle ground:** Store annotations as
`localStorage.setItem('debt-annotations', JSON.stringify({...}))` using a schema
that maps directly to a future Firestore document structure. If migration is
needed later, a one-time script reads localStorage, writes to Firestore via
Cloud Function, and flips a feature flag.

### IMPACT

- Report Section 6 ("Annotations: localStorage First") already reflects this. No
  change needed to the report body.
- Executive summary "no Firebase needed" language is now accurate. No
  qualification needed.
- Remove any remaining SQ5 references to Firestore for annotations in planning
  artifacts.

### CONFIDENCE: HIGH

All three sources (contrarian-1, OTB-2's scope concerns, CLAUDE.md security
rules) independently support localStorage. No dissenting evidence.

---

## Dispute 2: SQLite -- Required or Optional?

### Context

- SQ1a/SQ1b designed the CLI data layer around SQLite (better-sqlite3) with 4
  tables, 25+ indexes, 10 views, and FTS5 full-text search.
- Contrarian-2 (Challenge 7) found that better-sqlite3 requires native
  compilation via node-gyp. MSVC (`cl.exe`) is not available on this machine.
  Prebuilt binaries for Node 22 on Windows x64 may or may not exist. The user is
  described as a non-developer director with no admin access at the work locale.
- OTB-2 (Challenge 7) measured 179ms full JSONL parse time. For interactive CLI
  use, this is imperceptible. SQLite indexed queries at 5ms do not improve the
  user experience meaningfully.
- DEBT-7593 in MASTER_DEBT.jsonl already tracks SQLite migration as a research
  item.

### RESOLUTION

**Defer SQLite entirely. JSONL is the sole data source for V1. The plan should
NOT have a "with SQLite" / "without SQLite" path -- it should have a single
JSONL-only path with SQLite documented as a future optimization when scale
demands it.**

### RATIONALE

1. **The performance gain is invisible.** 179ms vs 5ms for a CLI tool where the
   user interacts with a numbered menu. The bottleneck is human reading time,
   not I/O.

2. **The dependency risk is real.** On Windows without MSVC, better-sqlite3
   installation fails unless a prebuilt binary exists for the exact Node
   version. For a non-developer who cannot install Visual Studio Build Tools,
   this is a hard blocker -- not a graceful degradation. Making SQLite
   "optional" still means writing and maintaining sync-to-sqlite.js, testing
   both paths, and handling the fallback. That is two codepaths for zero user
   benefit today.

3. **Scale threshold is distant.** At 8,472 items growing at ~7.7/day organic
   rate, the dataset reaches 20,000 items in approximately 18 months. With 3
   discovery agents (reduced from 7), intake is bounded. JSONL parse time scales
   linearly -- 20,000 items would parse in approximately 420ms, still under the
   threshold where a solo user notices.

4. **sql.js is the fallback if SQLite is ever needed.** The WebAssembly-compiled
   SQLite (sql.js) requires zero native compilation and works identically on
   Windows, Mac, and Linux. It is 2-5x slower than better-sqlite3 but for
   sub-25K records the difference is academic.

### IMPACT

- Remove the "SQLite Scope (Optional)" subsection from Section 2 of the report.
  Replace with a one-line note: "SQLite deferred to future phase. Schema
  preserved in SQ1a for when scale demands it (~20K+ items)."
- Remove sync-to-sqlite.js from the data flow diagram.
- Remove the SQLite schema section (Section 6, "SQLite Schema") from active
  planning scope. Retain as a reference appendix.
- build-debt-data.js reads JSONL directly -- this is already the report's
  recommendation, but the "OR MASTER_DEBT.jsonl" ambiguity should be removed.
- Phase 2 and Phase 3 simplify because there is no SQLite to install, sync, or
  test.

### CONFIDENCE: HIGH

All three challengers (contrarian-2, OTB-2, and contrarian-1 implicitly) agree.
The 179ms measurement from SQ1b is verified data. The Windows compilation risk
is confirmed against the actual machine state.

---

## Dispute 3: Discovery Agents -- 7 or 3?

### Context

- Original research: 9 agents identified, reduced to 7 after removing
  dependency-auditor and security-scanner (duplicating existing tools).
- Contrarian-1 (Challenge 4): start with 3, add a resolution-rate gate.
  Recommended 3: config-drift-detector, architectural-boundary-checker,
  integration-verifier.
- OTB-2 (Challenge 3): at 13.2% resolution rate, adding 123-305 items per
  discovery run worsens the backlog. The research does not propose any
  resolution acceleration.
- OTB-2 (Challenge 5): full scope is unrealistic for a solo operator.

### RESOLUTION

**Start with 3 agents. The gate for adding more is: open backlog below 7,000
items OR resolution rate above 20%. 7 is never the right number simultaneously
-- it should always be the user's choice via individual agent selection.**

**The 3 to start with:**

1. **config-drift-detector** -- highest unique signal. No existing tool (ESLint,
   SonarCloud, TypeScript) checks for config files drifted from code reality.
   Yield: 5-15 items (manageable).

2. **architectural-boundary-checker** -- second highest unique signal. Cross-
   layer imports and coupling violations are invisible to existing linters.
   Yield: 10-30 items.

3. **integration-verifier** -- unique property: findings route directly to
   resolution (missing handoffs are actionable bugs, not speculative debt).
   Yield: 3-10 items. This agent has the best resolution potential.

**Total expected yield: 18-55 items per run** (vs 123-305 for all 7). At the
current resolution pace (~20 items/week), 18-55 items is absorbable without
worsening the backlog.

### RATIONALE

1. **The 4 deferred agents have high overlap with existing tools:**
   - type-safety-scanner overlaps with TypeScript strict mode + SonarCloud
   - dead-code-detector overlaps with ESLint no-unused-vars + tree-shaking
   - test-coverage-analyzer overlaps with coverage tooling
   - performance-regression-detector is lower priority until resolution improves

2. **Individual agent selection matters more than the total count.** The Mode 9
   sub-menu should present individual agents, not "run all." The user picks
   which agents to run based on what they care about today. "7 agents" as a
   batch is the wrong framing -- it should be a catalog the user selects from.

3. **The resolution-rate gate prevents the intake-without-resolution spiral.**
   OTB-2's arithmetic is correct: at 13.2% resolution, adding 200+ items per run
   means the backlog grows by 174 items net. The gate ensures discovery runs
   decelerate when the backlog is unhealthy.

4. **7 is never the right number simultaneously** because running 7 agents costs
   ~$0.35-1.05 in tokens, takes ~10 minutes, and produces 123-305 items that
   overwhelm triage capacity. The 4 deferred agents can be unlocked individually
   when the gate criteria are met AND the user requests them.

### IMPACT

- Report Section 9 already reflects 3 agents. No change needed to the report
  body.
- The /deep-plan should define the resolution-rate gate as a configurable
  threshold (stored in a config file, not hardcoded).
- The /deep-plan should include the individual agent selection sub-menu design.
- The deferred agents list should be preserved as Phase 4 backlog with
  documented overlap rationale for each.

### CONFIDENCE: HIGH

Contrarian-1, OTB-2, and the revised report all converge on 3. The arithmetic
supporting the resolution-rate gate is verified against actual data (V2
verification: 8,472 items, 1,116 resolved, 14 entries in resolution-log.jsonl).

---

## Dispute 4: Static JSON Size -- Viable or Not?

### Context

- Contrarian-2 measured: MASTER_DEBT.jsonl is 7.23 MB (8,472 lines). As compact
  JSON array: approximately 7.6 MB. Gzipped: approximately 1.4 MB.
- Contrarian-2 estimated field-stripped (7 default columns only): approximately
  2 MB. With all 16 displayable columns: approximately 3-4 MB.
- Contrarian-1 projects growth: at 20,000 items (with weekly discovery runs),
  the full JSON reaches 17.1 MB. Even field-stripped, that is approximately 4.5
  MB.
- The report now recommends field stripping as mandatory, not optional.

### RESOLUTION

**Field-stripped static JSON is viable today and for the foreseeable future. The
size ceiling is 5 MB (field-stripped) / 15,000 items. The build script must
enforce this ceiling with a warning, not a hard failure.**

### RATIONALE

1. **Field stripping is the key intervention.** 7.6 MB full-field is
   problematic. 2 MB field-stripped (7 columns) is entirely fine. Even at 15,000
   items, field-stripped output is approximately 3.5 MB -- well within
   acceptable range for a local dev tool. The dispute dissolves when field
   stripping is treated as mandatory.

2. **The size ceiling should be explicit.** build-debt-data.js should measure
   the output file size and log a warning when it exceeds 5 MB:
   `"WARNING: debt-data.json is ${size}MB. Consider splitting by status or adding pagination. See RESEARCH_OUTPUT.md Section 2 for escape hatches."`
   This prevents the "silent technical debt" concern from contrarian-1.

3. **The escape hatches are documented.** When the ceiling is eventually hit,
   the options are: (a) split into debt-data-open.json and
   debt-data-resolved.json (resolved items rarely needed in default view); (b)
   paginated JSON files (~1,000 items each); (c) client-side SQLite WASM
   (sql.js); (d) remove output:export and serve via API routes. These are
   documented, not designed -- designing them now is premature.

4. **Git bloat prevention is essential.** `public/debt-data.json` MUST be in
   .gitignore. It is a build artifact. Without this, every rebuild adds ~2 MB to
   git history. Over 50 rebuilds, that is 100 MB of git bloat.

### IMPACT

- Report Section 2 already mandates field stripping and .gitignore. No change
  needed.
- The /deep-plan should add a size-check step to build-debt-data.js: measure
  output size, warn at 5 MB, and include the item count in the build log.
- The 7.6 MB figure should be referenced only as the "without field stripping"
  baseline, never as the target architecture.

### CONFIDENCE: HIGH

The 2 MB field-stripped estimate from contrarian-2 is grounded in measured
per-record size (942 bytes full, approximately 237 bytes for 7 columns). The
growth projections are conservative (linear extrapolation of current growth rate
plus bounded discovery agent intake).

---

## Dispute 5: Guided Mode -- Default or Optional?

### Context

- The original report treats Guided Mode as an optional add-on to the numbered
  menu.
- Contrarian-1 (Challenge 7) argues it should be the default for a non-
  developer user, with the numbered menu as an expert escape hatch.
- SQ10 designed both standard (numbered) and guided (outcome-oriented)
  interaction patterns.
- The user is described as a "non-developer director who uses AI to build
  software" (from MEMORY.md expertise profile).

### RESOLUTION

**Guided Mode is the default. The numbered expert menu is available via [E].
This is non-negotiable for the target user profile.**

### RATIONALE

1. **The user profile is explicit.** MEMORY.md describes a "non-developer
   director" with 240+ sessions. The numbered menu with categories like REVIEW /
   ACT / DISCOVER / MAINTAIN is developer-facing jargon. Outcome statements like
   "I want to reduce my S0 critical alerts" speak the user's language.

2. **Default matters.** Offering both modes equally means the user must choose
   between two interaction patterns on every invocation. Making Guided Mode the
   default eliminates this decision. Power users (if they ever exist) press [E].
   The solo non-developer user sees outcome language first.

3. **The guided-to-expert transition is one keypress.** There is no UX cost to
   making Guided Mode the default. The expert menu is always one keystroke away.
   But making the expert menu the default forces the non-developer to learn the
   mode numbers, which is a real UX cost.

4. **Contrarian-1 and the revised report both agree.** The report already
   updated to show `[G] Guided mode  <-- DEFAULT for first session`. This
   resolution strengthens that to: default for ALL sessions, not just the first.

### IMPACT

- Report Section 8 already shows Guided Mode with a DEFAULT annotation. Change
  "DEFAULT for first session" to "DEFAULT" (remove "for first session").
- REC-09 already recommends Guided Mode as default. No change needed.
- The /deep-plan should specify that the debt-runner SKILL.md invocation always
  starts in Guided Mode unless the user explicitly passes a mode number (e.g.,
  `/debt-runner 5` goes directly to Mode 5).

### CONFIDENCE: HIGH

The user profile is unambiguous. The contrarian, OTB-2, and the revised report
all converge. No dissenting evidence.

---

## Dispute 6: Pre-Generated AI Summaries -- In Scope or Future?

### Context

- OTB-1 (Idea 2 + Idea 5) rated pre-generated AI summaries as HIGH value, SOON
  feasibility. It transforms the KPI panel from "numbers you interpret" to
  "insights you act on."
- Not in the original research scope -- identified during the OTB challenge
  round.
- Would require a Claude API call at build time (~$0.01-0.03 per build).
- Requires an Anthropic API key in the build environment.
- The revised report (Section 4, Theme 9) already incorporated this as a
  recommended capability.

### RESOLUTION

**In scope for Phase 3, but as an optional enhancement with a graceful fallback.
Not a blocking dependency for the web dashboard.**

### RATIONALE

1. **The value is real.** "26 S0 items" is a number. "The 3 oldest S0 items
   (DEBT-00142, DEBT-00389, DEBT-01204) have been open for 41, 38, and 33 days.
   None are assigned to any sprint." is an actionable insight. For a
   non-developer who interprets debt data through narrative rather than raw
   numbers, this is the highest-impact single card on the dashboard.

2. **The implementation is minimal.** Approximately 30 lines in
   build-debt-data.js: construct a summary prompt from computed metrics, call
   the Claude API, write the response to public/debt-insights.json. One React
   card component reads and renders it. This is not architectural scope creep.

3. **It must be optional.** The API key may not be configured (especially at the
   work locale). Offline builds must succeed. The fallback is: if no API key is
   set OR the API call fails, skip insights generation and serve the previous
   debt-insights.json (if it exists) or show a placeholder card ("Build with
   ANTHROPIC_API_KEY set for AI insights").

4. **The minimal version is a build-time summary, not a chat widget.** The
   dispute is not about embedding an AI chat in the dashboard (that was rejected
   as architecturally incompatible). It is about one API call at build time
   producing 3-5 static text bullets. This is the same category as generating
   debt-data.json -- a build-time computation, not a runtime feature.

### IMPACT

- Report Section 4 (Theme 9) and Section 7 (AI Insights card) already include
  this. No change needed to the report body.
- Phase 3 scope (Section 16) already lists "AI Insights card (if API key
  available)" as step 4. No change needed.
- The /deep-plan should specify: (a) the prompt template for the Claude API
  call, (b) the fallback behavior when no API key is available, (c) the output
  schema for debt-insights.json, (d) the React component for rendering insights.

### CONFIDENCE: MEDIUM

The value assessment is subjective (HIGH value is OTB-1's judgment, not verified
against user preference). The technical feasibility is HIGH -- the
implementation is straightforward. The MEDIUM overall confidence reflects
uncertainty about whether the user will configure the API key and whether the
generated insights will be actionable enough to justify the dependency.

---

## Summary Matrix

| #   | Dispute                  | Resolution                                                     | Confidence |
| --- | ------------------------ | -------------------------------------------------------------- | ---------- |
| 1   | Firestore role           | localStorage first; Firestore migration path if needed         | HIGH       |
| 2   | SQLite required/optional | Defer entirely; single JSONL-only path                         | HIGH       |
| 3   | Discovery agents count   | 3 initially with individual selection; gate before expanding   | HIGH       |
| 4   | Static JSON size         | Viable with mandatory field stripping; 5 MB / 15K item ceiling | HIGH       |
| 5   | Guided Mode default      | Default for ALL sessions; [E] for expert menu                  | HIGH       |
| 6   | AI summaries scope       | In scope for Phase 3, optional with graceful fallback          | MEDIUM     |

---

## Report Changes Required

Only two minor text changes are needed in RESEARCH_OUTPUT.md:

1. **Section 8, line 419:** Change
   `[G] Guided mode  <-- DEFAULT for first session` to
   `[G] Guided mode  <-- DEFAULT` (remove "for first session").

2. **Section 2, SQLite Scope:** The subsection can be reduced to a single
   paragraph noting deferral, with a cross-reference to SQ1a for the preserved
   schema. This is a structural simplification, not a correction.

All other resolutions are already reflected in the revised report. The disputes
were largely resolved during the post-challenge re-synthesis. This document
formalizes those resolutions and provides the rationale chain for /deep-plan
consumption.
