# Findings: UX & Interaction Design Comparison

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-04-06
**Sub-Question IDs:** SQ-007

---

## Key Findings

### 1. Input Format — Invocation Syntax Differs Significantly Across the 4 Skills [CONFIDENCE: HIGH]

The four skills use two distinct invocation models that are not
cross-consistent.

**Analysis skills** (website-analysis, repo-analysis) take a mandatory
positional argument (URL or GitHub URL) with optional depth/mode flags:

- `website-analysis`: `/website-analysis <URL>` with flags `--standard`,
  `--deep`, `--site`, `--expedition`, `--urls=URL1,URL2,...`
- `repo-analysis`: `/repo-analysis <github-url>` with flags
  `--depth=quick|standard|deep`, `--lens=adoption|creator`

**Synthesis skills** (website-synthesis, repo-synthesis) take NO positional
argument — they auto-discover from the filesystem:

- `website-synthesis`: `/website-synthesis` (no args) with flags
  `--paradigm=thematic|narrative|matrix|meta-pattern`, `--min-sites=N`,
  `--focus=themes|signals|map|portfolio`
- `repo-synthesis`: `/repo-synthesis` (no args) with flags `--min-repos=N`,
  `--focus=themes|gaps|chain|evolution|portfolio|map`

**Key inconsistency:** Depth selection uses different flag syntax.
website-analysis uses bare flags (`--standard`, `--deep`) while repo-analysis
uses a keyed flag (`--depth=standard`, `--depth=deep`). These are not
interchangeable.

Sources: website-analysis SKILL.md:62-68, repo-analysis SKILL.md:64-66,
website-synthesis SKILL.md:58-63, repo-synthesis SKILL.md:52-55.

---

### 2. Mode/Tier Selection — Analysis Skills Gate; Synthesis Skills Don't [CONFIDENCE: HIGH]

The two analysis skills share an interactive gate pattern: Quick Scan runs first
automatically, then the user is asked whether to proceed to Standard/Deep. Flags
bypass the gate.

- **website-analysis gate text:** "Run Standard analysis? [y/N]" — flags
  `--standard`, `--deep`, `--site`, `--expedition` bypass it (SKILL.md:86)
- **repo-analysis gate text:** "Quick Scan complete. [health bands]. Run
  Standard/Deep for full Creator + Engineer analysis? (Standard ~5-10 min, Deep
  ~15-20 min) [y/N]" (SKILL.md:113-116)

Repo-analysis's gate is richer — it includes time estimates and health bands.
Website-analysis's gate is minimal.

The synthesis skills have no tier selection at all. They run a single, complete
synthesis pass. Repo-synthesis has a `--focus` flag to narrow outputs, and
website-synthesis has a `--focus` flag too — but neither gates on depth.

**Curated-list special case (repo-analysis only):** The gate is enriched when a
curated-list repo is detected, showing link count and link mining option. No
equivalent exists in the other skills.

Sources: website-analysis SKILL.md:86, repo-analysis SKILL.md:113-116,
repo-analysis REFERENCE.md:Section 16.

---

### 3. Progress Reporting — Phase Markers Are Universal But Granularity Varies [CONFIDENCE: HIGH]

All four skills use the same phase transition marker format:

```
========== PHASE N: [NAME] ==========
```

This is explicitly specified in all four SKILL.md files. However, within-phase
progress reporting differs substantially:

- **repo-synthesis** is the most advanced: shows `--- Output N of 6: [Name] ---`
  within Phase 2 (SKILL.md:172), displays a Warm-Up summary before starting
  (SKILL.md:125-134), and presents a T20 tally after verification (SKILL.md:239)
- **website-synthesis** has no equivalent within-phase counters or warm-up
- **repo-analysis** shows progress during Coverage Audit as an interactive
  prompt listing found items (SKILL.md:399-411) and shows batch progress via the
  rate limit check per API batch
- **website-analysis** has no within-phase progress counters beyond the phase
  marker itself

Repo-synthesis uniquely pre-announces scope at start: repo count, candidate
count, effort estimate, output list, and any previous feedback acknowledgment.
The others begin execution without this warm-up.

Sources: website-analysis SKILL.md:99, repo-analysis SKILL.md:91,
website-synthesis SKILL.md:132, repo-synthesis SKILL.md:94, repo-synthesis
SKILL.md:125-134, repo-synthesis SKILL.md:172.

---

### 4. Interactive Checkpoints — Repo Skills Have More Pause Points [CONFIDENCE: HIGH]

Checkpoints where execution pauses for user input:

| Skill             | Checkpoints                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| website-analysis  | (1) Quick Scan gate [y/N], (2) WARN compliance acknowledgment required, (3) Site mode: every 5 pages, (4) Routing menu post-analysis |
| repo-analysis     | (1) Quick Scan gate [y/N], (2) Content Eval Depth 2 gate [Y/N/Select], (3) Coverage Audit [A/S/N], (4) Routing menu post-analysis    |
| website-synthesis | (1) Follow-up actions menu post-synthesis (no mid-run gates)                                                                         |
| repo-synthesis    | (1) Phase 1 checkpoint "Proceed to synthesis?" after loading, (2) Follow-up actions menu post-synthesis                              |

Repo-synthesis uniquely has an explicit mid-run checkpoint after loading all
artifacts — it pauses to confirm before synthesis begins (SKILL.md:157). This is
a "proceed?" gate not present in website-synthesis.

Repo-analysis has the most interactive mid-run checkpoints: depth-2 content eval
gate, coverage audit gate, plus the initial quick scan gate.

Website-analysis has a unique checkpoint type: the WARN compliance
acknowledgment — the user must acknowledge compliance warnings before extraction
proceeds. This is not present in the other three skills.

Sources: website-analysis SKILL.md:83-86, 256-258, 134-136, repo-analysis
SKILL.md:113-116, 257-264, 392-418, repo-synthesis SKILL.md:157-158,
website-synthesis SKILL.md: Phase 4.

---

### 5. Routing Menus — All 4 Skills Have Post-Analysis Menus, With Significant Variation [CONFIDENCE: HIGH]

All four skills present follow-up action menus after completion. Comparing
options:

**website-analysis Routing Menu (7 options):** (SKILL.md:230-243)

1. Extract knowledge
2. Start Expedition
3. Deep-plan this
4. Save to memory
5. Explore insights
6. Done
7. Cross-site synthesis (conditional: 3+ sites only)

**repo-analysis Routing Menu (8 options):** (SKILL.md:476-483)

1. Extract value
2. Send to TDMS
3. Deep-plan this
4. Save to memory
5. Adoption verdict
6. Explore insights
7. Done
8. Cross-repo synthesis (conditional)

**website-synthesis Follow-up Actions (6 options):** (SKILL.md:213-223)

1. Explore a theme
2. Fill a gap
3. Extract top candidates
4. Compare paradigms
5. Save to memory
6. Done

**repo-synthesis Follow-up Actions (6 options):** (SKILL.md:272-280)

1. Explore a theme
2. Fill a gap
3. Extract top candidates
4. Save to memory
5. Inject into deep-plan
6. Done

**Shared options across all 4:** "Save to memory", "Done", and "Deep-plan this /
Inject into deep-plan".

**Options unique to a single skill:**

- "Start Expedition" — website-analysis only (unique mode launch)
- "Send to TDMS" — repo-analysis only (tech debt pipeline integration)
- "Adoption verdict" — repo-analysis only (full WR-01 to WR-06 assessment)
- "Compare paradigms" — website-synthesis only (re-run with different paradigm)

**Notable pattern:** Synthesis skills use "Explore a theme" and "Fill a gap" as
their primary post-synthesis actions, while analysis skills use "Extract
knowledge/value" and "Explore insights" — reflecting the different output types.

**Delegation pattern (repo-synthesis only):** If user says "you decide",
repo-synthesis selects highest-impact action and records it as
`delegated-action`. No equivalent in the other 3 skills (SKILL.md:281-283).

Sources: website-analysis SKILL.md:230-243, repo-analysis SKILL.md:476-483,
website-synthesis SKILL.md:213-223, repo-synthesis SKILL.md:272-280.

---

### 6. Presentation Format — Creator View Is Conversational Prose; Engineer View Is Tables/Bands [CONFIDENCE: HIGH]

All four skills share the same top-level presentation philosophy:
"conversational, not clinical." The exact phrase appears in all four SKILL.md
files:

- website-analysis: "Creator View is mandatory... Written as conversational
  prose, NOT tables or clinical output" (SKILL.md:35-36)
- repo-analysis: "Conversational, not clinical. Creator View MUST be written in
  conversational prose. Anti-goal: must NOT read like a technical manual."
  (SKILL.md:43-44)
- website-synthesis: "Match the Creator View prose style — written as you'd
  explain insights to a colleague, not as a compliance report." (SKILL.md:34)
- repo-synthesis: "Write conversationally, not clinically" (SKILL.md:171)

Engineer View (analysis skills) uses tables with 4-band categorical scoring:

- website-analysis: 6 dimensions (Performance, Security Headers, Accessibility,
  SEO, Technical Stack, Mobile Readiness)
- repo-analysis: 6 dimensions (Security, Reliability, Maintainability,
  Documentation, Process, Velocity)

Both analysis skills enforce "Bands over numbers" as a Critical Rule —
categorical bands are shown with scores in parentheses, never raw scores alone
(e.g., "Excellent (85)" not just "85").

Synthesis outputs use both: section headers with numbered output progress
markers, then conversational paragraphs within each section.

Sources: website-analysis SKILL.md:35-36, 7; repo-analysis SKILL.md:43-44, 3;
website-synthesis SKILL.md:34; repo-synthesis SKILL.md:171; website-analysis
SKILL.md:218-225; repo-analysis SKILL.md:314-319.

---

### 7. Error Communication — Patterns Partially Shared But Not Formally Unified [CONFIDENCE: MEDIUM]

Error/failure communication patterns across the four skills:

**Compliance blocking (website-analysis only):** HARD_BLOCK stops execution with
a minimal analysis.json explaining why. WARN surfaces to user and requires
acknowledgment. Suggestions provided: "check in regular browser, try different
page, or different URL" (SKILL.md:251-258).

**Missing artifacts (all 4 skills):** Report which artifact is missing and
suggest re-scanning rather than silently failing. Synthesis skills exclude a
site/repo with warning and abort if <3 remain.

**No silent skips rule:** All four skills have this as a Critical Rule.
Website-analysis: "If a SHOULD step fails, retry once, then report to user"
(SKILL.md:36). Repo-analysis: same with "retry once with mitigation"
(SKILL.md:84).

**Tool unavailability (website-analysis):** If superpowers-chrome is
unavailable, falls back to WebFetch + Playwright MCP + curl and "Log a warning"
— communicated to user (SKILL.md:28-29).

**Rate limit safety (repo-analysis only):** Explicit rate limit check before
every API batch; abort if `remaining < 200`. Not present in the other three
skills (SKILL.md:38-39).

**Empty artifact warning (repo-synthesis only):** If a MUST artifact has no
candidates or <10 lines, warns explicitly before proceeding (SKILL.md:113-115).

Sources: website-analysis SKILL.md:27-29, 251-258; repo-analysis SKILL.md:36-39;
website-synthesis SKILL.md:143-146; repo-synthesis SKILL.md:113-115.

---

### 8. Skill Chaining UX — Synthesis Skills Are Explicitly Invited From Analysis Routing Menus [CONFIDENCE: HIGH]

All four skills are designed as an integrated chain. The cross-skill handoff UX:

**Analysis → Synthesis routing offer:** Both analysis skills conditionally offer
the synthesis skill in their routing menus:

- website-analysis option 7: "Cross-site synthesis — if 3+ sites analyzed,
  suggest `/website-synthesis`"
- repo-analysis option 8: "Cross-repo synthesis — if 3+ repos analyzed, offer
  /repo-synthesis"

**High-link-density trigger (website-analysis only):** When >40 unique external
links detected, website-analysis proactively suggests Expedition or cross-site
synthesis — a pre-routing trigger not dependent on user reaching the menu
(SKILL.md:273-275).

**Synthesis → Analysis "fill a gap" action:** Both synthesis skills offer "Fill
a gap" as a follow-up action that queues an analysis scan for a gap domain —
explicit round-trip chaining back to the analysis skill.

**Synthesis → deep-plan injection:** All four skills offer injecting results
into `/deep-plan` as a downstream action. The exact mechanism differs:

- website-analysis: "inject analysis.json + SITE-ANALYSIS.md as
  `## Research Context` in deep-plan DIAGNOSIS.md"
- repo-synthesis: `/deep-plan --context=.research/repo-analysis/SYNTHESIS.md`

**Expedition mode (website-analysis only):** Cross-domain navigation that is
neither analysis nor synthesis but a distinct HITL mode. Can be launched from
the routing menu or from initial invocation. No equivalent in the other three
skills.

Sources: website-analysis SKILL.md:230-243, 273-275; repo-analysis
SKILL.md:476-483; website-synthesis SKILL.md:213-223; repo-synthesis
SKILL.md:272-280; website-analysis SKILL.md:148-157.

---

### 9. Flag/Option Naming Inconsistency: Depth Flag Uses Two Different Syntaxes [CONFIDENCE: HIGH]

The most significant flag inconsistency between the two analysis skills:

| Feature        | website-analysis            | repo-analysis               |
| -------------- | --------------------------- | --------------------------- | -------- | ---------- | --------------- | ---- | ----- | --------- | --------- | ---- |
| Quick depth    | (default, no flag)          | `--depth=quick`             |
| Standard depth | `--standard`                | `--depth=standard`          |
| Deep depth     | `--deep`                    | `--depth=deep`              |
| Lens selection | (none)                      | `--lens=adoption            | creator` |
| Min threshold  | `--min-sites=N` (synthesis) | `--min-repos=N` (synthesis) |
| Focus filter   | `--focus=themes             | signals                     | map      | portfolio` | `--focus=themes | gaps | chain | evolution | portfolio | map` |

The synthesis skills use the keyed `--focus=` syntax consistently. The analysis
skills diverge on depth selection — bare flags vs `--depth=` key.

**Threshold flag names differ:** `--min-sites=N` (website-synthesis) vs
`--min-repos=N` (repo-synthesis). Parallel names for the parallel concepts, but
not unified to a single `--min=N` pattern.

**Focus values differ:** website-synthesis `--focus` options
(`themes|signals|map|portfolio`) don't match repo-synthesis options
(`themes|gaps|chain|evolution|portfolio|map`). The `themes` and `portfolio`
values are shared, but others diverge.

Sources: website-analysis SKILL.md:62-68, repo-analysis SKILL.md:64-66,
website-synthesis SKILL.md:59-63, repo-synthesis SKILL.md:52-55.

---

### 10. Creator View vs Engineer View Navigation — Implicit Order, No User Toggle [CONFIDENCE: HIGH]

All four skills present Creator View before Engineer View as a fixed ordering —
there is no user flag to select "engineer view only" or reorder the views.

- website-analysis: Creator View is Phase 2, Engineer View is Phase 3 — written
  in that order
- repo-analysis: Creator View is Phase 4, Engineer View is Phase 5 — written in
  that order

The only way to access a different view order is post-routing via "Explore
insights" (which reopens Creator View conversation) or "Adoption verdict" (which
provides deeper Engineer View). Neither inverts the order at analysis time.

`--lens=adoption|creator` in repo-analysis controls which scoring lens is marked
"primary" in the dual-lens output, but does not change the output section order
(SKILL.md:64-66, 319-320).

There is no way to request "skip Creator View" or "Engineer View only" — both
are always produced for Standard/Deep runs in analysis skills.

Sources: website-analysis SKILL.md:208-225, repo-analysis SKILL.md:312-320,
repo-analysis SKILL.md:64-66.

---

### 11. State File Resume UX — Consistent Pattern, Different File Names [CONFIDENCE: HIGH]

All four skills maintain state files for compaction resilience. The resume
interaction is consistent in concept but differs in file paths and re-invocation
behavior:

| Skill             | State file path                                         | Re-invocation behavior                                                        |
| ----------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| website-analysis  | `.claude/state/website-analysis.<site-slug>.state.json` | "offer: (a) re-analyze with trends comparison, (b) resume, (c) view previous" |
| repo-analysis     | `.claude/state/repo-analysis.<repo-slug>.state.json`    | "offer Resume/Re-run/Compare"                                                 |
| website-synthesis | `.claude/state/website-synthesis.state.json`            | "offer Resume/Re-run"                                                         |
| repo-synthesis    | `.claude/state/repo-synthesis.state.json`               | "offer Resume/Re-run"                                                         |

Website-analysis has the richest resume UX: it also offers trend comparison via
`trends.jsonl` when prior analysis exists, and notes the prior artifacts survive
`/session-end`. Repo-synthesis uniquely supports a "pause" command mid-run: user
says "pause" and the skill saves state, prints progress, and exits gracefully
(SKILL.md:309-311).

Sources: website-analysis SKILL.md:264-276, repo-analysis SKILL.md:489-492,
website-synthesis SKILL.md:241-248, repo-synthesis SKILL.md:303-311.

---

### 12. Retro Pattern — All 4 Skills Have Post-Session Retro, But Persistence Differs [CONFIDENCE: HIGH]

All four skills end with a retro prompt. The prompts are structurally similar
but differ in what happens to the response:

- website-analysis: "Anything about this analysis that should inform future
  website-analysis runs?" — no explicit persistence location specified
  (SKILL.md:309-311)
- repo-analysis: "Any observations about the analysis quality or process?" — no
  explicit persistence location specified (SKILL.md:514-515)
- website-synthesis: "Any observations about the synthesis quality or process?"
  — no explicit persistence location specified (SKILL.md:279-280)
- repo-synthesis: "Any observations about the synthesis quality or process?"
  Save to state file `process_feedback`. Accept empty/"none". — explicitly saved
  and reused in Warm-Up for next run (SKILL.md:293-295)

Repo-synthesis is the only skill where the retro response is both explicitly
saved to state and actively used in the next run (the Warm-Up section displays
"Previous feedback: [X]. Adjusting accordingly."). This closes the feedback loop
in a way the other three skills do not.

Sources: website-analysis SKILL.md:309-311, repo-analysis SKILL.md:514-515,
website-synthesis SKILL.md:279-280, repo-synthesis SKILL.md:293-295,
repo-synthesis SKILL.md:128-133.

---

### 13. Self-Audit Phase — Website-Analysis and Repo-Synthesis Have It; Others Lack Explicit Audit [CONFIDENCE: HIGH]

Website-analysis includes an explicit 9-dimension Self-Audit as the penultimate
phase (SKILL.md:293-306), verifying: completeness, orphan detection, schema
integrity, gap analysis, functional verification, multi-agent review,
regression, contract check, partial recovery.

Repo-synthesis includes a 6-dimension Self-Audit as Phase 3 (SKILL.md:246-258):
completeness, orphan detection, build integrity, gap analysis, contract
verification, regression detection.

Repo-analysis does NOT have an explicit self-audit phase — it has "Artifact
Verification (before routing)" which is a checklist of expected files rather
than a full audit (SKILL.md:459-465).

Website-synthesis does NOT have a self-audit phase — it has "Artifact
Verification (before presenting)" which checks expected outputs exist
(SKILL.md:228-235).

The asymmetry suggests self-audit was added to the analysis and synthesis skills
at different stages of maturity.

Sources: website-analysis SKILL.md:293-306, repo-synthesis SKILL.md:246-258,
repo-analysis SKILL.md:459-465, website-synthesis SKILL.md:228-235.

---

### 14. Unique UX Patterns Per Skill That Others Could Adopt [CONFIDENCE: MEDIUM]

**repo-synthesis Warm-Up (unique):** The Warm-Up phase pre-announces full scope:
repo count, candidate count, effort estimate, output list, previous feedback.
Creates a "pre-flight briefing" UX that orients the user before any work begins.
No equivalent in the other three skills.

**repo-synthesis Delegation pattern (unique):** When user says "you decide",
repo-synthesis makes the choice and records a rationale. No other skill has this
explicit delegation handling.

**repo-synthesis "pause" command (unique):** User can say "pause" at any point
to checkpoint and exit gracefully, with a progress summary. No equivalent in the
other three skills.

**website-analysis Expedition mode (unique):** Multi-hop HITL navigation is a
distinct UX mode with its own state files, depth limits, resume capability, and
link selection UI (5 options per hop: 4 high-relevance + 1 wildcard). No
equivalent in the other three skills.

**repo-analysis Coverage Audit interactive prompt (unique):** Presents
unexplored content as lettered categories [A], [B], [C] etc. with item counts,
allowing selective exploration. "Analyze all / Select categories / Skip?
[A/S/N]" — a more granular interactive prompt than any other checkpoint in the
four skills.

**repo-analysis curated-list enriched gate (unique):** When the repo is a
curated list, the Quick Scan gate is enhanced with link count and link mining
option. Context-sensitive gate text based on repo type.

**website-synthesis paradigm selection (unique):** Four named paradigms
(thematic/narrative/matrix/meta-pattern) give the user explicit control over the
synthesis strategy. Repo-synthesis has no equivalent paradigm choice.

**website-analysis WARN acknowledgment (unique):** Compliance warnings require
explicit user acknowledgment before proceeding. This is a safety-gate UX pattern
not present in the other three skills.

Sources: repo-synthesis SKILL.md:125-134, 281-283, 309-311; website-analysis
SKILL.md:148-157, 251-258; repo-analysis SKILL.md:392-418, 111-116;
website-synthesis SKILL.md:58-63.

---

## UX Comparison Table

| UX Dimension          | website-analysis                                | repo-analysis                                      | website-synthesis                    | repo-synthesis                    |
| --------------------- | ----------------------------------------------- | -------------------------------------------------- | ------------------------------------ | --------------------------------- |
| Invocation arg        | `<URL>` (required)                              | `<github-url>` (required)                          | None (auto-discovers)                | None (auto-discovers)             |
| Depth flag syntax     | `--standard`, `--deep`                          | `--depth=standard`, `--depth=deep`                 | N/A (single pass)                    | N/A (single pass)                 |
| Mode flags            | `--site`, `--expedition`, `--urls=`             | `--lens=`                                          | `--paradigm=`, `--focus=`            | `--focus=`                        |
| Quick scan gate       | "Run Standard? [y/N]" (minimal)                 | "Run Standard/Deep? + time estimates [y/N]" (rich) | N/A                                  | N/A                               |
| Mid-run gates         | Compliance WARN, site page gate (every 5 pages) | Content eval depth-2 gate, coverage audit [A/S/N]  | None                                 | Phase 1 "Proceed?" checkpoint     |
| Phase markers         | `========== PHASE N: [NAME] ==========`         | Same                                               | Same                                 | Same                              |
| Within-phase progress | None                                            | None                                               | None                                 | `--- Output N of 6: [Name] ---`   |
| Warm-up announcement  | None                                            | None                                               | None                                 | Full scope brief + prior feedback |
| Routing menu items    | 7 (conditional 7th)                             | 8 (conditional 8th)                                | 6                                    | 6                                 |
| Creator View format   | Conversational prose, 7 sections                | Conversational prose, 6 sections                   | Conversational prose (all paradigms) | Conversational prose              |
| Engineer View format  | Tables + 4-band scoring                         | Tables + 4-band scoring                            | N/A                                  | N/A                               |
| Bands over numbers    | Yes (Critical Rule)                             | Yes (Critical Rule)                                | N/A                                  | N/A                               |
| Unique mode           | Expedition                                      | Curated-list enriched gate                         | 4 paradigms                          | Delegation + Pause                |
| Retro persistence     | Not specified                                   | Not specified                                      | Not specified                        | Saved to state, reused in Warm-Up |
| Self-audit phase      | Yes (9 dimensions)                              | Artifact verification only                         | Artifact verification only           | Yes (6 dimensions)                |
| Resume UX             | Re-analyze/Resume/View options                  | Resume/Re-run/Compare                              | Resume/Re-run                        | Resume/Re-run + Pause             |
| Skill chaining offer  | Option 7 (conditional)                          | Option 8 (conditional)                             | "Fill a gap" → website-analysis      | "Fill a gap" → repo-analysis      |
| Error for blocked     | HARD_BLOCK with suggestions                     | Rate limit abort                                   | Abort with exclusion warnings        | Empty artifact warnings           |
| Deep-plan injection   | analysis.json + SITE-ANALYSIS.md                | Creator View as context                            | Inline synthesis.md                  | SYNTHESIS.md via flag             |

---

## Sources

| #   | File Path                                       | Type                 | Trust | Notes                                 |
| --- | ----------------------------------------------- | -------------------- | ----- | ------------------------------------- |
| 1   | `.claude/skills/website-analysis/SKILL.md`      | Codebase (canonical) | HIGH  | Read lines 1-319                      |
| 2   | `.claude/skills/repo-analysis/SKILL.md`         | Codebase (canonical) | HIGH  | Read lines 1-525                      |
| 3   | `.claude/skills/website-synthesis/SKILL.md`     | Codebase (canonical) | HIGH  | Read lines 1-291                      |
| 4   | `.claude/skills/repo-synthesis/SKILL.md`        | Codebase (canonical) | HIGH  | Read lines 1-332                      |
| 5   | `.claude/skills/website-analysis/REFERENCE.md`  | Codebase (canonical) | HIGH  | Read lines 1-450 (schemas + routing)  |
| 6   | `.claude/skills/repo-analysis/REFERENCE.md`     | Codebase (canonical) | HIGH  | Read lines 1-100 (dimension catalog)  |
| 7   | `.claude/skills/website-synthesis/REFERENCE.md` | Codebase (canonical) | HIGH  | Read lines 1-100 (paradigm templates) |
| 8   | `.claude/skills/repo-synthesis/REFERENCE.md`    | Codebase (canonical) | HIGH  | Read lines 1-100 (output specs)       |

---

## Contradictions

**None identified.** The four skills are internally consistent. All
cross-references (e.g., website-analysis pointing to website-synthesis,
repo-analysis pointing to repo-synthesis) are bidirectionally consistent.

The depth flag inconsistency between website-analysis (`--standard`/`--deep`)
and repo-analysis (`--depth=standard`/`--depth=deep`) is a design divergence,
not a contradiction — both work as specified but are not interchangeable.

---

## Gaps

1. **Error message exact text not specified** for most failure cases. The
   SKILL.md files describe the decision logic (HARD_BLOCK, WARN, abort) but do
   not specify the exact text shown to users. A UX audit of actual output would
   require a live run.

2. **Routing menu presentation format not specified.** The skills describe what
   options exist but not how they are formatted on screen (numbered list?
   lettered? prose description with brackets?). The repo-analysis SKILL.md shows
   a markdown table for the routing menu but this may not match the actual
   conversational rendering.

3. **website-analysis Quick Scan gate text differs from repo-analysis.** The
   exact gate text for website-analysis is only partially specified ("Run
   Standard analysis? [y/N]") while repo-analysis provides the full gate text.
   Whether website-analysis's gate includes time estimates is unspecified.

4. **`--focus` value overlap between synthesis skills not addressed.** `themes`
   and `portfolio` appear in both, but `signals` and `map` are
   website-synthesis-only while `gaps`, `chain`, and `evolution` are
   repo-synthesis-only. There is no documentation explaining why portfolio
   overlaps but others don't.

5. **"Explore insights" vs "Explore a theme" naming divergence** between
   analysis and synthesis skills. Both open a deeper conversation but use
   different names for equivalent actions.

6. **No specification for what "Explore insights" produces.** The routing menu
   entry exists in both analysis skills but REFERENCE.md sections for this
   option are not present in the read content — they may be in unread sections.

---

## Serendipity

**Shared artifact schema parity (website-analysis REFERENCE.md:180-183):** The
website-analysis REFERENCE.md explicitly documents which fields are "shared with
repo-analysis" (`schema_version`, `meta.scan_date`, `meta.scan_depth`,
`meta.scan_version`, `ecosystem_tags`, `absence_patterns`, `summary_bands`).
This intentional schema alignment means a future cross-type synthesizer
(websites + repos) is already partially enabled at the data layer — noted in
website-synthesis SKILL.md Integration section as "planned, not implemented."

**Repo-synthesis retro loop is the only closed feedback loop** across all four
skills. The pattern of capturing retro feedback in state and replaying it in the
next Warm-Up is a self-improving UX mechanism. If adopted by the other three
skills, it would make them learn from user feedback across sessions rather than
treating each run as isolated.

**Expedition mode may be the most novel UX pattern in the suite.** It has no
equivalent in any of the other three skills and combines elements of all three:
interactive gates (like analysis), cross-site traversal (like synthesis), and
HITL pacing (like a guided tour). It is also the only mode with a built-in depth
limit (3 hops, configurable) as a UX constraint rather than a technical one.

---

## Confidence Assessment

- HIGH claims: 11
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All findings are grounded in direct filesystem reads of the canonical SKILL.md
and REFERENCE.md files. No external sources or training-data assumptions were
used.
