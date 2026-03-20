# Gap Analysis: Research Capabilities in SoNash

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Status:** ACTIVE
**Author:** Claude (research agent, gap analysis task)
<!-- prettier-ignore-end -->

---

## Executive Summary

The SoNash codebase has **strong but narrowly-scoped** research capabilities.
Three GSD agents (`gsd-project-researcher`, `gsd-phase-researcher`,
`gsd-research-synthesizer`) form the core research engine, but they are
**completely locked inside the GSD orchestration pipeline**. Three skills
(`content-research-writer`, `market-research-reports`, `ux-researcher-designer`)
provide domain-specific research, but two of the three have **broken
dependencies** and none share infrastructure.

**The critical gap:** There is no way to do ad-hoc, standalone technical
research in this codebase. If a user wants to deeply research a technology,
pattern, or domain _without_ starting a GSD project or planning a GSD phase,
there is no invocable skill or agent for it. The closest option is `/deep-plan`
Phase 0, but that's a planning skill with a thin context-gathering step, not a
research tool.

**Key findings:**

1. **GSD research agents are excellent but unreachable.** The project-researcher
   and phase-researcher have sophisticated tool strategies, verification
   protocols, confidence levels, and source hierarchies. But they can only be
   spawned by GSD orchestrators that don't exist as standalone skills.
2. **Massive DRY violation.** The `gsd-project-researcher` and
   `gsd-phase-researcher` share ~70% identical content (philosophy, tool
   strategy, source hierarchy, verification protocol). Neither extracts this
   into shared infrastructure.
3. **The domain-specific skills are islands.** `content-research-writer`,
   `market-research-reports`, and `ux-researcher-designer` don't reference or
   reuse any of the GSD research patterns (confidence levels, source hierarchy,
   verification protocol).
4. **`market-research-reports` has phantom dependencies.** It references
   `research-lookup`, `scientific-schematics`, and `generate-image` skills --
   none of which exist in the codebase.
5. **No iterative research capability exists anywhere.** All research agents
   produce output in a single pass. There is no mechanism for "initial findings
   lead to new questions" iterative deepening.

---

## Current Landscape

### GSD Research Agents (3 agents)

#### `gsd-project-researcher`

- **Location:** `.claude/agents/global/gsd-project-researcher.md`
- **Spawned by:** `/gsd:new-project`, `/gsd:new-milestone` orchestrators
- **Tools:** Read, Write, Bash, Grep, Glob, WebSearch, WebFetch,
  mcp\_\_context7\_\_\*
- **What it does:** Surveys a domain ecosystem before roadmap creation. Produces
  5 files in `.planning/research/` (SUMMARY.md, STACK.md, FEATURES.md,
  ARCHITECTURE.md, PITFALLS.md).
- **Research modes:** Ecosystem (default), Feasibility, Comparison
- **Strengths:**
  - Sophisticated 3-tier source hierarchy (Context7 > Official Docs > WebSearch)
  - Formal verification protocol (verify WebSearch findings with authoritative
    sources)
  - Confidence levels (HIGH/MEDIUM/LOW) with clear criteria
  - Explicit "Claude's training as hypothesis" philosophy
  - Good anti-pattern awareness (negative claims without evidence, single source
    reliance)
- **Limitations:**
  - Only reachable via GSD orchestrators (not standalone)
  - Output format is project-roadmap-specific (not general research)
  - Does NOT commit (relies on synthesizer agent)
  - No iterative deepening -- single-pass research

#### `gsd-phase-researcher`

- **Location:** `.claude/agents/global/gsd-phase-researcher.md`
- **Spawned by:** `/gsd:plan-phase`, `/gsd:research-phase` orchestrators
- **Tools:** Same as project-researcher
- **What it does:** Researches how to implement a specific phase, producing a
  single RESEARCH.md consumed by gsd-planner.
- **Key difference from project-researcher:** More prescriptive ("Use X" not
  "Consider X or Y"), includes "Don't Hand-Roll" and "Code Examples" sections,
  output is a single file not 5 files.
- **Strengths:**
  - Respects upstream CONTEXT.md constraints (locked decisions vs discretion
    areas)
  - "Don't Hand-Roll" section is uniquely valuable
  - Code examples with source attribution
  - State-of-the-art tracking (old approach vs current approach)
- **Limitations:**
  - ~70% content duplicated from project-researcher
  - Only reachable via GSD orchestrators
  - Prescriptive output format assumes downstream planner consumption
  - Commits its own file (inconsistent with project-researcher which does NOT
    commit)

#### `gsd-research-synthesizer`

- **Location:** `.claude/agents/global/gsd-research-synthesizer.md`
- **Spawned by:** `/gsd:new-project` (after 4 researcher agents complete)
- **Tools:** Read, Write, Bash (notably NO WebSearch/WebFetch/Context7)
- **What it does:** Reads outputs from 4 parallel researchers, synthesizes into
  SUMMARY.md, commits all research files together.
- **Strengths:**
  - Clear downstream-consumer awareness (roadmapper)
  - Commits all research atomically
- **Limitations:**
  - References template at
    `~/.claude/get-shit-done/templates/research-project/SUMMARY.md` which does
    not exist
  - Cannot do any research itself (no research tools)
  - Tightly coupled to exactly 4 input files (STACK, FEATURES, ARCHITECTURE,
    PITFALLS)
  - Only useful within GSD pipeline

### Domain-Specific Research Skills (3 skills)

#### `content-research-writer`

- **Location:** `.claude/skills/content-research-writer/SKILL.md`
- **What it does:** Writing partner for blog posts, articles, tutorials.
  Research is a supporting capability for content creation, not standalone.
- **Research capabilities:**
  - Find relevant information and add citations
  - Citation management (inline, numbered, footnote)
  - Source credibility assessment
- **Limitations:**
  - Research is subordinate to writing -- you cannot invoke research without a
    writing project
  - No confidence levels, no source hierarchy, no verification protocol
  - No tool specifications (doesn't declare WebSearch/WebFetch/Context7)
  - Generic "find credible sources" without the rigor of GSD researchers

#### `market-research-reports`

- **Location:** `.claude/skills/market-research-reports/SKILL.md`
- **What it does:** Generates 50+ page market research reports in
  consulting-firm style with LaTeX output.
- **Research capabilities:**
  - Deep integration with `research-lookup` for market data
  - Multi-framework analysis (Porter's, PESTLE, SWOT, TAM/SAM/SOM, BCG)
  - Visual generation integration
- **Critical problems:**
  - **`research-lookup` skill does not exist** -- the primary data gathering
    tool referenced throughout the skill is phantom
  - **`scientific-schematics` skill does not exist** -- diagram generation tool
    is phantom
  - **`generate-image` skill does not exist** -- image generation tool is
    phantom
  - Effectively non-functional as specified due to missing dependencies
  - No confidence levels, no source hierarchy from GSD research patterns
  - Allowed tools list is `[Read, Write, Edit, Bash]` -- notably missing
    WebSearch, WebFetch, and Context7

#### `ux-researcher-designer`

- **Location:** `.claude/skills/ux-researcher-designer/SKILL.md`
- **What it does:** UX research toolkit -- persona generation, journey mapping,
  usability testing.
- **Research capabilities:**
  - `persona_generator.py` script for data-driven personas
  - Confidence scoring based on sample size
- **Limitations:**
  - Very thin SKILL.md (56 lines) -- mostly a stub
  - Single script (`persona_generator.py`) is the only concrete capability
  - No web research integration
  - No connection to GSD research patterns

### Adjacent Research Capabilities

#### `deep-plan` Phase 0

- **Location:** `.claude/skills/deep-plan/SKILL.md`
- **What Phase 0 does:** Context gathering before planning. Explores codebase,
  checks ROADMAP alignment, produces DIAGNOSIS.md.
- **Research aspects:**
  - Reads codebase to understand existing patterns
  - ROADMAP alignment check
  - Convergence-loop verification of claims
- **Why it's NOT research:**
  - No external research (no WebSearch/WebFetch/Context7 in Phase 0)
  - Purpose is diagnosis, not investigation
  - Output is a DIAGNOSIS.md (what exists), not a RESEARCH.md (what's possible)
  - Does not survey ecosystems, compare options, or investigate domains

#### `gsd-planner` Discovery Levels

- **Location:** `.claude/agents/global/gsd-planner.md`
- **What it does:** Has a 4-level discovery protocol (Level 0-3) built into
  planning.
- **Research aspects:**
  - Level 1: Quick Context7 verification
  - Level 2: Standard research producing DISCOVERY.md
  - Level 3: Deep dive with full DISCOVERY.md
- **Why it's NOT standalone research:**
  - Embedded inside the planner agent
  - Purpose is to inform planning decisions, not produce research artifacts
  - Level 2-3 suggest routing to `/gsd:research-phase` for niche domains
  - Research capability is a pre-step, not the main function

#### `security-auditor` agent

- **Location:** `.claude/agents/security-auditor.md`
- **What it does:** Security vulnerability review, OWASP compliance.
- **Research aspects:** Domain-specific security knowledge application.
- **Why it's NOT research:** It's an audit tool. It applies known security
  patterns, it doesn't investigate unfamiliar domains.

---

## Use Case Coverage Matrix

| Use Case                                                      | Currently Served By                                    | Quality (1-5) | Gap Description                                                                                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Researching a new technology before adopting it               | `gsd-project-researcher` (STACK.md mode)               | 4             | Excellent capability but only reachable via GSD orchestrators. Cannot be invoked ad-hoc.                                                           |
| Researching best practices for a specific pattern             | `gsd-phase-researcher` (architecture patterns section) | 4             | Good output format but locked behind `/gsd:plan-phase`. No standalone access.                                                                      |
| Researching an unfamiliar domain before building features     | `gsd-project-researcher` (ecosystem mode)              | 4             | Strong ecosystem survey capability. Same GSD-lock problem.                                                                                         |
| Researching competitor/similar products                       | `market-research-reports`                              | 1             | Skill exists but has 3 phantom dependencies (`research-lookup`, `scientific-schematics`, `generate-image`). Effectively broken.                    |
| Researching academic literature on a topic                    | **NOTHING**                                            | 0             | No agent or skill handles academic/scholarly research. No citation of papers, no DOI lookup, no academic database querying.                        |
| Researching security implications of a design choice          | `security-auditor` (partial)                           | 2             | Audits known patterns but doesn't research unfamiliar security domains. No WebSearch/WebFetch tools.                                               |
| Ad-hoc "I need to understand X deeply" research               | **NOTHING**                                            | 0             | The biggest gap. No invocable skill for standalone deep research. Users must either start a GSD project or ask the main Claude session informally. |
| Research combining web search + codebase analysis + docs      | `gsd-project-researcher` (partial)                     | 3             | Has web + Context7 but no codebase analysis component. Deep-plan Phase 0 has codebase analysis but no web research. Nobody combines both.          |
| Research requiring iteration (findings lead to new questions) | **NOTHING**                                            | 0             | All research agents are single-pass. No mechanism for "based on finding X, I now need to investigate Y."                                           |
| Research producing actionable output (not just information)   | `gsd-phase-researcher`                                 | 4             | Prescriptive output ("Use X because Y") is excellent. But again, GSD-locked.                                                                       |

---

## Capability Gaps (Ranked by Impact)

### Gap 1: No Standalone Research Invocation

- **What's missing:** A `/deep-research` or `/research` skill that any user can
  invoke at any time for any topic, independent of GSD project lifecycle.
- **Impact:** Users who need to understand a technology, pattern, or domain
  before making a decision have no tool to reach for. They must either (a) start
  a full GSD project just to get research, (b) ask the main Claude session
  informally and get inconsistent quality, or (c) go without.
- **Difficulty to fill:** M -- The research methodology already exists in GSD
  agents. The work is extraction and re-packaging, not invention.

### Gap 2: No Iterative Research Loop

- **What's missing:** A research mode that can deepen based on initial findings.
  Current research agents run a single pass: identify domains, research them,
  write output. There is no "Phase 2: Based on findings, investigate further"
  loop.
- **Impact:** Complex research topics require iteration. "What authentication
  approach should we use?" leads to "OK, OAuth -- but which provider library?"
  leads to "NextAuth vs Clerk vs Lucia -- what are the tradeoffs with Firebase?"
  This chain cannot be expressed in any current research agent.
- **Difficulty to fill:** M -- Requires adding an iteration mechanism with
  convergence detection (similar to how `/convergence-loop` works for
  verification).

### Gap 3: Research + Codebase Analysis Integration

- **What's missing:** No agent combines external research (WebSearch, WebFetch,
  Context7) with codebase analysis (Grep, Glob, Read) in a unified
  investigation. `gsd-project-researcher` does external research. `deep-plan`
  Phase 0 does codebase analysis. Nobody does both together.
- **Impact:** "Should we migrate from library X to library Y?" requires both
  understanding the current codebase usage of X AND researching Y's
  capabilities. Currently requires two separate tools with no integration.
- **Difficulty to fill:** S -- Both tool sets exist. Need a unified agent that
  has all tools and a workflow that interleaves them.

### Gap 4: Massive DRY Violation Across Research Agents

- **What's missing:** Shared research infrastructure. The following blocks are
  duplicated nearly verbatim between `gsd-project-researcher` and
  `gsd-phase-researcher`:
  - `<philosophy>` section (~40 lines, identical)
  - `<tool_strategy>` section (~80 lines, identical)
  - `<source_hierarchy>` section (~40 lines, identical)
  - `<verification_protocol>` section (~50 lines, identical)
  - Total: ~210 lines of duplicated content (~70% of phase-researcher)
- **Impact:** Any improvement to research methodology must be applied in two
  places. When they inevitably drift, one agent will have better practices than
  the other.
- **Difficulty to fill:** S -- Extract into a shared reference document that
  both agents import.

### Gap 5: Domain-Specific Skills Don't Use Research Patterns

- **What's missing:** The confidence levels, source hierarchy, and verification
  protocol from GSD research agents are not used by `content-research-writer`,
  `market-research-reports`, or `ux-researcher-designer`. Each skill has its own
  (inferior or nonexistent) approach to source quality.
- **Impact:** Research quality varies wildly depending on which tool is used.
  GSD researchers produce findings with clear confidence levels and source
  attribution. Domain skills produce findings with no quality indicators.
- **Difficulty to fill:** M -- Requires establishing research patterns as a
  shared standard, then retrofitting existing skills.

### Gap 6: `market-research-reports` Is Non-Functional

- **What's missing:** Three dependencies (`research-lookup`,
  `scientific-schematics`, `generate-image`) referenced throughout the skill do
  not exist in the codebase. The skill also lacks WebSearch/WebFetch in its
  allowed-tools list.
- **Impact:** The skill cannot be used as written. A user invoking
  `/market-research-reports` would hit errors immediately when trying to use the
  referenced scripts.
- **Difficulty to fill:** L -- Would require building or sourcing three separate
  capabilities.

### Gap 7: No Academic/Scholarly Research Capability

- **What's missing:** No agent or skill can research academic literature, cite
  papers, use DOI lookups, or reference scholarly databases. All research
  capabilities are oriented toward technology evaluation and market analysis.
- **Impact:** For a recovery-focused app (SoNash), evidence-based practices are
  core to the product vision ("Evidence-Based" is explicitly called out in
  CLAUDE.md and ROADMAP.md). Yet there's no tool to research the academic
  evidence behind recovery methodologies.
- **Difficulty to fill:** M -- WebSearch can find papers, but a structured
  approach to academic research (citation formats, evidence quality assessment,
  systematic review patterns) would need to be designed.

### Gap 8: GSD Orchestrators Don't Exist as Skills

- **What's missing:** The commands `/gsd:new-project`, `/gsd:plan-phase`,
  `/gsd:research-phase`, `/gsd:new-milestone`, and `/gsd:discuss-phase` are
  referenced throughout the agent definitions but do not exist as SKILL.md
  files. They appear to be implicit orchestration patterns handled by the main
  conversation, not invocable skills.
- **Impact:** The entire GSD research pipeline has an undefined invocation
  mechanism. The agents exist but the entry points are informal.
- **Difficulty to fill:** M -- Would require creating orchestrator skill
  definitions with proper routing logic.

---

## Integration Gaps

### Can you invoke research independently of GSD?

**No.** This is the single largest integration gap. The three GSD research
agents explicitly state they are "spawned by" GSD orchestrators. There is no
`/research` skill, no standalone research command, and no way to invoke
`gsd-project-researcher` or `gsd-phase-researcher` outside the GSD pipeline.

The skill index (`SKILL_INDEX.md`) confirms this: under "Quick Reference by
Task" there is no entry for "research" or "investigation." The closest is
`/deep-plan` for "Complex task planning."

### Can deep-plan invoke research agents?

**No.** Deep-plan's Phase 0 is explicitly "Context Gathering" -- it reads the
codebase and ROADMAP, but does not invoke research agents, WebSearch, or
WebFetch. Deep-plan's tool list does not include WebSearch or WebFetch. The
handoff section routes to GSD for multi-phase work, but there's no research
handoff.

### Can skills outside GSD/deep-plan trigger research?

**Partially.** The `gsd-planner` has discovery levels that can trigger
`/gsd:research-phase`, but this is planner-internal and produces DISCOVERY.md
for planning consumption, not general research output.

No other skill references research agents. The domain skills
(`content-research-writer`, `market-research-reports`, `ux-researcher-designer`)
operate completely independently.

### Is there ad-hoc research without a GSD project?

**No.** The user's only option for ad-hoc research is to ask the main Claude
session directly. This produces conversational output with no structured
methodology, no confidence levels, no verification protocol, and no persistent
artifacts.

---

## Quality Gaps

### Confidence Levels

| Agent/Skill              | Has Confidence Levels                             | Consistent Scale | Enforced                    |
| ------------------------ | ------------------------------------------------- | ---------------- | --------------------------- |
| gsd-project-researcher   | Yes (HIGH/MEDIUM/LOW)                             | Yes              | Self-enforced (checklist)   |
| gsd-phase-researcher     | Yes (HIGH/MEDIUM/LOW)                             | Yes              | Self-enforced (checklist)   |
| gsd-research-synthesizer | Yes (per-area assessment)                         | Yes              | Aggregates from researchers |
| content-research-writer  | No                                                | N/A              | N/A                         |
| market-research-reports  | No                                                | N/A              | N/A                         |
| ux-researcher-designer   | Partial (confidence scoring in persona_generator) | Different scale  | Script-level only           |

**Gap:** Only GSD agents have consistent confidence levels. Domain skills either
lack them entirely or use incompatible scales.

### Source Verification

| Agent/Skill             | Verification Protocol      | Source Hierarchy | Cross-References |
| ----------------------- | -------------------------- | ---------------- | ---------------- |
| gsd-project-researcher  | Yes (3-step)               | Yes (5-tier)     | Yes              |
| gsd-phase-researcher    | Yes (3-step)               | Yes (5-tier)     | Yes              |
| content-research-writer | "Verify sources" (generic) | No               | No               |
| market-research-reports | No                         | No               | No               |
| ux-researcher-designer  | No                         | No               | No               |

**Gap:** Only GSD agents have formal verification. Domain skills rely on vague
guidance ("verify sources") or nothing at all.

### Output Format Standards

| Agent/Skill              | Structured Output        | Template                        | Persistent Artifact             |
| ------------------------ | ------------------------ | ------------------------------- | ------------------------------- |
| gsd-project-researcher   | Yes (5 files)            | Detailed templates              | `.planning/research/`           |
| gsd-phase-researcher     | Yes (1 file)             | Detailed template               | `.planning/phases/XX-name/`     |
| gsd-research-synthesizer | Yes (1 file)             | References nonexistent template | `.planning/research/SUMMARY.md` |
| content-research-writer  | Partial (outline format) | In examples.md                  | User-specified                  |
| market-research-reports  | Yes (LaTeX report)       | Template exists                 | `writing_outputs/`              |
| ux-researcher-designer   | Minimal                  | No                              | No                              |

**Gap:** No consistent output format across research capabilities. Each produces
different artifacts in different locations with different structures.

### Research Output Validation

**None of the research agents or skills have output validation.** There is no
equivalent of `npm run patterns:check` or `npm run roadmap:validate` for
research output. Research quality depends entirely on the agent following its
own checklist, which is self-reported.

---

## Tool Utilization Gaps

### WebSearch

| Agent/Skill             | Has WebSearch        | Usage Pattern                                  | Effectiveness |
| ----------------------- | -------------------- | ---------------------------------------------- | ------------- |
| gsd-project-researcher  | Yes                  | Ecosystem discovery with year, query templates | Strong        |
| gsd-phase-researcher    | Yes                  | Same pattern                                   | Strong        |
| gsd-debugger            | Yes                  | Debugging-specific                             | Limited scope |
| content-research-writer | Not declared         | "Find relevant information" (vague)            | Unknown       |
| market-research-reports | Not in allowed-tools | References `research-lookup` instead           | Broken        |
| ux-researcher-designer  | Not declared         | No                                             | Missing       |
| deep-plan               | Not declared         | Not available in Phase 0                       | Missing       |

**Gap:** WebSearch is well-used in GSD research agents but absent from all other
research-adjacent capabilities. Deep-plan cannot do web research during context
gathering.

### WebFetch

| Agent/Skill            | Has WebFetch | Usage Pattern                             |
| ---------------------- | ------------ | ----------------------------------------- |
| gsd-project-researcher | Yes          | Official docs, changelogs, GitHub READMEs |
| gsd-phase-researcher   | Yes          | Same                                      |
| gsd-planner            | Yes          | Quick verification                        |
| All others             | No           | Not available                             |

**Gap:** WebFetch for authoritative source verification is only available in GSD
agents. Domain skills cannot fetch official documentation.

### Context7 MCP

| Agent/Skill            | Has Context7 | Usage Pattern                    |
| ---------------------- | ------------ | -------------------------------- |
| gsd-project-researcher | Yes          | Library resolution + doc queries |
| gsd-phase-researcher   | Yes          | Same                             |
| gsd-planner            | Yes          | Quick verification               |
| All others             | No           | Not available                    |

**Gap:** Context7 (the highest-confidence source per GSD research methodology)
is unavailable to all domain-specific research skills.

### Missing Research Tools

1. **No academic search integration** -- no tool for searching Google Scholar,
   PubMed, or similar databases
2. **No structured comparison tool** -- comparisons are done narratively, not
   with a systematic framework
3. **No research caching/persistence** -- research findings are not indexed for
   reuse across sessions
4. **No "research status" tracking** -- no way to see what's been researched vs
   what's still unknown for a project

---

## Reusability Opportunities

### Duplicated Research Logic (Extraction Candidates)

#### 1. Research Philosophy (~40 lines)

Duplicated verbatim between `gsd-project-researcher` and `gsd-phase-researcher`:

- "Claude's Training as Hypothesis" (5 principles)
- "Honest Reporting" (4 dos, 4 don'ts)
- "Research is Investigation, Not Confirmation"

**Extract to:** `.claude/agents/global/shared/research-philosophy.md` or embed
in a new deep-research skill as the canonical source.

#### 2. Tool Strategy (~80 lines)

Duplicated verbatim:

- Context7 usage protocol (resolve then query)
- WebFetch best practices
- WebSearch query templates
- Verification protocol (3-step upgrade path)

**Extract to:** `.claude/agents/global/shared/research-tool-strategy.md`

#### 3. Source Hierarchy (~40 lines)

Duplicated verbatim:

- 3-tier confidence level definitions
- 5-tier source prioritization

**Extract to:** `.claude/agents/global/shared/research-source-hierarchy.md`

#### 4. Verification Protocol (~50 lines)

Duplicated verbatim:

- Known pitfalls (configuration scope blindness, deprecated features, negative
  claims, single source reliance)
- Quick reference checklist

**Extract to:** `.claude/agents/global/shared/research-verification.md`

### Shared Research Library Concept

Currently there is no "research library" -- no shared patterns, no common output
formats, no reusable components. Each research capability is fully
self-contained.

A shared research library would provide:

- Standard confidence level definitions
- Standard source hierarchy
- Standard verification protocol
- Standard output format (sections, metadata)
- Standard tool usage patterns
- Reusable query templates

---

## Recommendations (Prioritized)

### Priority 1: Create `/deep-research` Standalone Skill

**What:** A new skill that extracts the best of `gsd-project-researcher` and
`gsd-phase-researcher` into a standalone, ad-hoc invocable research capability.

**Key design decisions:**

- Invocable as `/deep-research <topic>` -- no GSD project required
- Multiple research modes: Ecosystem, Feasibility, Comparison, Technology
  Evaluation, Domain Investigation
- Iterative deepening: initial findings can trigger follow-up investigation
  rounds
- Combines external research (WebSearch, WebFetch, Context7) with codebase
  analysis (Grep, Glob, Read)
- Produces structured, persistent artifacts with confidence levels
- Outputs actionable findings, not just information dumps

**What it replaces:** Nothing (fills a gap). But it should become the canonical
research methodology that GSD agents delegate to or reference.

### Priority 2: Extract Shared Research Infrastructure

**What:** Pull duplicated research patterns from GSD agents into shared
reference documents that all research capabilities can import.

**Files to create:**

- Research philosophy
- Tool strategy (Context7, WebFetch, WebSearch protocols)
- Source hierarchy and confidence levels
- Verification protocol and known pitfalls
- Output format standards

**Consumers:** `deep-research` skill, `gsd-project-researcher`,
`gsd-phase-researcher`, and any future domain-specific research skills.

### Priority 3: Add Iterative Research Capability

**What:** Design a research loop mechanism where initial findings can trigger
follow-up investigations. Similar to how `/convergence-loop` iterates on
verification, `/deep-research` should iterate on investigation.

**Pattern:**

1. Initial research pass (broad)
2. Identify gaps and follow-up questions
3. Targeted follow-up research (deep)
4. Synthesize combined findings
5. Repeat if confidence remains LOW on critical questions

### Priority 4: Fix `market-research-reports` Dependencies

**What:** Either build or remove the three phantom dependencies
(`research-lookup`, `scientific-schematics`, `generate-image`). Until this is
done, the skill is non-functional.

**Recommendation:** If `/deep-research` is built, `market-research-reports` can
delegate its data gathering to `/deep-research` instead of the nonexistent
`research-lookup`. Visual generation is a separate problem.

### Priority 5: Retrofit Confidence Levels to Domain Skills

**What:** Add the GSD-standard confidence level system (HIGH/MEDIUM/LOW with
clear criteria) to `content-research-writer` and any other skill that produces
research findings.

### Priority 6: Add Research to deep-plan Phase 0

**What:** Give `/deep-plan` Phase 0 the ability to do targeted external research
when context gathering reveals unfamiliar territory. Currently it can only read
the codebase -- it cannot research external technologies or patterns that the
task involves.

**Implementation:** Either add WebSearch/WebFetch/Context7 to deep-plan's tool
list for Phase 0, or add a routing step: "If Phase 0 reveals unfamiliar
technology, invoke `/deep-research` before proceeding to Phase 1."

### Priority 7: Create GSD Orchestrator Skills

**What:** The commands `/gsd:new-project`, `/gsd:plan-phase`,
`/gsd:research-phase`, etc. need to exist as actual SKILL.md files with defined
invocation mechanisms. Currently the research agents reference orchestrators
that have no skill definition.

---

## Appendix: Agent/Skill Cross-Reference

### Research Tool Access by Agent/Skill

| Capability               | WebSearch                                | WebFetch     | Context7     | Codebase (Grep/Glob/Read) |
| ------------------------ | ---------------------------------------- | ------------ | ------------ | ------------------------- |
| gsd-project-researcher   | Yes                                      | Yes          | Yes          | Yes                       |
| gsd-phase-researcher     | Yes                                      | Yes          | Yes          | Yes                       |
| gsd-research-synthesizer | No                                       | No           | No           | Read only                 |
| gsd-planner              | No                                       | Yes          | Yes          | Yes                       |
| gsd-debugger             | Yes                                      | No           | No           | Yes                       |
| content-research-writer  | Not declared                             | Not declared | Not declared | Not declared              |
| market-research-reports  | No (allowed-tools: Read,Write,Edit,Bash) | No           | No           | Bash only                 |
| ux-researcher-designer   | Not declared                             | Not declared | Not declared | Not declared              |
| deep-plan                | No                                       | No           | No           | Yes                       |
| security-auditor         | No                                       | No           | No           | Yes                       |

### Lines of Content by Agent (Research-Specific)

| Agent                    | Total Lines | Unique Content                                            | Duplicated Content                              |
| ------------------------ | ----------- | --------------------------------------------------------- | ----------------------------------------------- |
| gsd-project-researcher   | 909         | ~700 (output formats, execution flow)                     | ~210 (philosophy, tools, sources, verification) |
| gsd-phase-researcher     | 668         | ~460 (output format, execution flow, upstream/downstream) | ~210 (philosophy, tools, sources, verification) |
| gsd-research-synthesizer | 266         | 266 (all unique)                                          | 0                                               |

### Phantom Dependencies

| Skill                    | References                                                      | Exists? |
| ------------------------ | --------------------------------------------------------------- | ------- |
| market-research-reports  | `research-lookup`                                               | No      |
| market-research-reports  | `scientific-schematics`                                         | No      |
| market-research-reports  | `generate-image`                                                | No      |
| gsd-research-synthesizer | `~/.claude/get-shit-done/templates/research-project/SUMMARY.md` | No      |
