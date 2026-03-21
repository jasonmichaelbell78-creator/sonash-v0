# Implementation Plan: `/deep-research` Skill

<!-- prettier-ignore-start -->
**Date:** 2026-03-20
**Phase:** Plan (deep-plan Phase 3)
**Decisions:** [DECISIONS.md](./DECISIONS.md) (21 decisions)
**Research:** [research/SYNTHESIS.md](./research/SYNTHESIS.md) (21 reports)
**Effort Estimate:** XL (multi-session, 4 phases + post-build audit)
<!-- prettier-ignore-end -->

---

## Phase Overview

| Phase | Goal                                     | Steps | Est. Lines     | Parallelizable |
| ----- | ---------------------------------------- | ----- | -------------- | -------------- |
| P0    | Working research engine (end-to-end)     | 1-12  | 950-1,350      | Steps 5-6, 8-9 |
| P1    | Verification + Memory + Expanded Sources | 13-20 | 500-800        | Steps 14-16    |
| P2    | Downstream Integration                   | 21-27 | 400-600        | Steps 22-25    |
| P3    | Learning + Management                    | 28-33 | 400-600        | Steps 29-31    |
| Post  | Skill Audit                              | 34    | 0 (audit only) | No             |

---

# P0: Working Research Engine

**Goal:** `/deep-research "topic"` works end-to-end. User types the command,
sees a research plan, approves it, gets parallel multi-agent research, gets a
report with confidence levels, contrarian challenges, outside-the-box insights,
and a "what next?" menu. Per Decision #5, the floor depth is L1 (Exhaustive).

**Estimated effort:** 950-1,350 lines across 3 artifacts **Estimated timeline:**
1-2 sessions

---

## Step 1: Add `.research/` to `.gitignore`

Per Decision #19, research output lives in `.research/<topic-slug>/`. This
directory should be git-ignored like `.worktrees/` since research output is
ephemeral and session-specific.

Add `.research/` entry to `.gitignore`, grouped near the existing `.worktrees/`
and `.planning/` exclusions.

```gitignore
# Research output (session-specific, not committed)
.research/**

# Allowlist curated cross-session index files if the repo chooses to version them
!.research/research-index.jsonl
!.research/strategy-log.jsonl
!.research/source-reputation.jsonl
```

> **Note:** If the intent is "never commit anything under `.research/`", use
> `.research/` instead and omit the allowlist lines.

**Files:**

- **Modified:** `.gitignore` -- add `.research/` exclusion

**Done when:**

- `.research/` appears in `.gitignore`
- `git status` does not show `.research/` contents as untracked after creating a
  test directory

**Depends on:** None **Triggers:** Steps 2-12 (all P0 steps can reference the
output location)

---

## Step 2: Create state file schema

Define the state file schema for research session persistence. Per Decision #20,
both automatic and manual resume are supported. State file lives at
`.claude/state/deep-research.<topic-slug>.state.json`.

The schema follows the proven `deep-plan` pattern from
`.claude/state/deep-plan.<topic>.state.json`.

```json
{
  "version": 1,
  "topic": "string — original research question",
  "topicSlug": "string — kebab-case slug",
  "status": "planning | researching | synthesizing | verifying | complete | failed",
  "depth": "L1 | L2 | L3 | L4",
  "depthLabel": "Exhaustive | Comprehensive | Investigation | Deep Investigation",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "plan": {
    "questionType": "factual | descriptive | comparative | evaluative | exploratory | investigative | predictive | relational",
    "domain": "string",
    "domainConfidence": "number 0-1",
    "subQuestions": [
      {
        "id": "SQ-001",
        "question": "string",
        "searchProfile": "web | docs | codebase | academic",
        "status": "pending | assigned | complete | failed",
        "agentId": "string — agent identifier",
        "findingsPath": "string — relative path to FINDINGS.md"
      }
    ],
    "approved": "boolean",
    "approvedAt": "ISO 8601 | null"
  },
  "agents": {
    "searchers": [
      {
        "id": "searcher-1",
        "subQuestions": ["SQ-001", "SQ-002"],
        "status": "pending | running | complete | failed",
        "findingsPaths": ["string"],
        "startedAt": "ISO 8601 | null",
        "completedAt": "ISO 8601 | null"
      }
    ],
    "synthesizer": {
      "status": "pending | running | complete | failed",
      "outputPath": "string | null"
    }
  },
  "output": {
    "researchOutputPath": "string | null",
    "claimsPath": "string | null",
    "sourcesPath": "string | null",
    "metadataPath": "string | null"
  },
  "verification": {
    "contrarian": { "status": "pending | complete | skipped", "passCount": 0 },
    "outsideTheBox": {
      "status": "pending | complete | skipped",
      "passCount": 0
    },
    "convergence": { "status": "pending | complete | skipped", "passCount": 0 }
  },
  "budget": {
    "estimatedTokens": "number",
    "estimatedCost": "string — e.g. '$3-$8'",
    "searchBudget": "number — 60% of total",
    "verifyBudget": "number — 20% of total",
    "synthesisBudget": "number — 10% of total",
    "overheadBudget": "number — 10% of total"
  },
  "errors": [],
  "resumePoint": "string — phase + step identifier for resume"
}
```

This schema is documented in the SKILL.md (Step 3) and referenced by both
agents. The schema is not a separate file -- it is embedded in the skill
definition.

**Files:**

- **No new files** -- schema is embedded in SKILL.md (Step 3)

**Done when:**

- Schema is defined and will be embedded in SKILL.md in Step 3
- Schema supports all statuses needed for checkpoint/resume
- Schema tracks budget allocation per the 60/20/10/10 split (per SYNTHESIS.md)

**Depends on:** None **Triggers:** Step 3 (SKILL.md references this schema)

---

## Step 3: Create SKILL.md (orchestrator)

Per Decision #14, the skill IS the orchestrator. Per Decision #1, the skill name
is `/deep-research`. This is the largest and most critical artifact.

**Location:** `.claude/skills/deep-research/SKILL.md`

**Fork from:** `.claude/skills/deep-plan/SKILL.md` for structure and
conventions.

### Frontmatter

```yaml
---
name: deep-research
description: >-
  Multi-agent research engine that decomposes questions, dispatches parallel
  searcher agents, synthesizes findings with citations and confidence levels,
  runs mandatory contrarian and outside-the-box challenges, and produces
  structured output for downstream consumption by deep-plan, GSD,
  convergence-loop, and other skills.
---
```

### SKILL.md Sections (in order)

1. **Document header** -- version, date, status (match deep-plan format)
2. **Title + description** -- one paragraph
3. **Critical Rules** (6-8 rules):
   - Per Decision #2: always show research plan before executing; `--auto` to
     skip
   - Per Decision #3: contrarian + OTB mandatory at ALL levels
   - Per Decision #5: floor depth is L1 (Exhaustive); Quick/Standard/Deep
     eliminated
   - Write to disk first -- findings must survive crashes
   - State file updated after every state-changing event
   - Research writes ONLY to `.research/<topic-slug>/` -- never to
     consumer-owned artifacts
   - Per Decision #7: agent allocation formula `D + 3 + floor(D/5)`
4. **When to Use / When NOT to Use** -- routing table
5. **Input** -- argument format, flags (`--depth`, `--domain`, `--auto`,
   `--audit-details`)
6. **Depth Levels** (per Decision #5 and #9):

   | Level | Name               | Agents | Search Rounds | Contrarian                       | OTB                 | Self-Audit         |
   | ----- | ------------------ | ------ | ------------- | -------------------------------- | ------------------- | ------------------ |
   | L1    | Exhaustive         | 4-5    | 5-8           | 1 agent (CL preset)              | 1 agent (CL preset) | Summary            |
   | L2    | Comprehensive      | 3-4    | 3-5           | 1 agent                          | 1 agent             | Summary            |
   | L3    | Investigation      | 5-7    | 5-8           | 2 agents (different strategies)  | 2 agents            | Full               |
   | L4    | Deep Investigation | 8-10   | 8+            | 3 agents + red team + pre-mortem | 3 agents            | Full + adversarial |

   Per Decision #15, contrarian/OTB scale with level.

7. **Process Overview** (6-phase flow):

   ```
   PHASE 0: Interactive Decomposition (inline)
     → Classify question type (8 types) + domain detection
     → Per Decision #16: start at level B (2-3 rounds Q&A), escalate to C if needed
     → Generate MECE sub-questions
     → Apply allocation formula: D + 3 + floor(D/5) agents (Decision #7)
     → Present research plan with cost estimate
     → User approves / modifies / aborts (Decision #2)

   PHASE 1: Parallel Research (Task tool → searcher agents)
     → Spawn searcher agents per allocation formula
     → Each gets: sub-question(s), search profile, output path, budget slice
     → Each writes: .research/<topic-slug>/findings/<sub-query>-FINDINGS.md
     → Write-to-disk-first pattern — checkpoint after each agent completes

   PHASE 2: Synthesis (Task tool → synthesizer agent)
     → Spawn synthesizer agent
     → Reads all FINDINGS.md files
     → Writes: RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl, metadata.json
     → All to .research/<topic-slug>/

   PHASE 3: Mandatory Challenges (convergence-loop presets)
     → Per Decision #3: contrarian + OTB mandatory at ALL levels
     → Contrarian: CL preset that challenges consensus, seeks disconfirming evidence
     → Outside-the-box: CL preset that finds what structured research missed
     → Both write challenge findings to .research/<topic-slug>/challenges/

   PHASE 4: Self-Audit (inline, depth-dependent)
     → Per Decision #18: summary line by default ("Self-audit: 6/6 passed")
     → --audit-details flag for full audit report
     → Check: completeness, citation density, confidence distribution,
       source diversity, contradiction resolution

   PHASE 5: Presentation + Downstream Routing (inline)
     → Terminal summary (5-10 lines): topic, depth, confidence, claim counts
     → Full report path
     → "What next?" menu:
       - "Deepen research on: [suggested sub-topics]"
       - "Route to /deep-plan for planning"
       - "Route LOW-confidence claims to /convergence-loop"
       - "Save HIGH-confidence insights to memory"
     → Per CLAUDE.md guardrail #6: require acknowledgment
   ```

8. **State Management** -- state file schema (from Step 2), resume protocol
9. **Output Structure** (per Decision #19):

   ```
   .research/<topic-slug>/
     findings/
       <sub-query-1>-FINDINGS.md
       <sub-query-2>-FINDINGS.md
       ...
     challenges/
       CONTRARIAN.md
       OUTSIDE_THE_BOX.md
     RESEARCH_OUTPUT.md        # Human-readable report
     claims.jsonl              # Machine-parseable claims
     sources.jsonl             # Source registry
     metadata.json             # Session metadata + consumer_hints
   ```

10. **Output Format Templates** -- RESEARCH_OUTPUT.md template, claims.jsonl
    record schema, sources.jsonl record schema, metadata.json schema

    **claims.jsonl record:**

    ```json
    {
      "id": "C-001",
      "claim": "string — the assertion",
      "confidence": "HIGH | MEDIUM | LOW | UNVERIFIED",
      "evidence": "string — what supports this",
      "sourceIds": ["S-001", "S-003"],
      "category": "stack | features | architecture | pitfalls | general",
      "subQuestionId": "SQ-001",
      "routing": {
        "deepPlan": true,
        "gsd": false,
        "convergenceLoop": false,
        "memory": false,
        "tdms": false
      }
    }
    ```

    **sources.jsonl record:**

    ```json
    {
      "id": "S-001",
      "url": "string",
      "title": "string",
      "type": "official-docs | blog | academic | community | codebase | training-data",
      "accessDate": "ISO 8601",
      "trustLevel": "HIGH | MEDIUM | LOW",
      "craapScore": {
        "currency": "number 1-5",
        "relevance": "number 1-5",
        "authority": "number 1-5",
        "accuracy": "number 1-5",
        "purpose": "number 1-5"
      }
    }
    ```

    **metadata.json:**

    ```json
    {
      "topic": "string",
      "depth": "L1 | L2 | L3 | L4",
      "questionType": "string",
      "domain": "string",
      "startedAt": "ISO 8601",
      "completedAt": "ISO 8601",
      "agentCount": "number",
      "searchRounds": "number",
      "sourceCount": "number",
      "claimCount": "number",
      "confidenceDistribution": {
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0,
        "UNVERIFIED": 0
      },
      "selfAuditResult": "string — e.g. '6/6 passed'",
      "consumerHints": {
        "hasStackClaims": "boolean",
        "hasPitfallClaims": "boolean",
        "hasDebtCandidates": "boolean",
        "hasMemoryCandidates": "boolean",
        "lowConfidenceCount": "number"
      }
    }
    ```

11. **Budget Management** -- 60/20/10/10 allocation, enforcement thresholds
    (70/85/95/100%), circuit breakers
12. **Resume Protocol** -- per Decision #20, both automatic (session-start
    detects incomplete research) and manual (re-invoke same topic)

**Files:**

- **New:** `.claude/skills/deep-research/SKILL.md` -- skill orchestrator
  (~250-350 lines)

**Done when:**

- SKILL.md follows the deep-plan SKILL.md structure (frontmatter, critical
  rules, when to use, phases, output format)
- All 6 phases are documented with clear inputs/outputs
- State file schema is embedded
- Output format templates are complete (claims.jsonl, sources.jsonl,
  metadata.json)
- Depth level table matches Decision #5 and #9
- Agent allocation formula `D + 3 + floor(D/5)` is documented (Decision #7)
- Contrarian + OTB mandatory at ALL levels (Decision #3)
- Plan approval gate is documented (Decision #2)
- Interactive decomposition starts at level B, escalates to C (Decision #16)
- Self-audit UX shows summary line by default (Decision #18)
- Resume protocol supports both automatic + manual (Decision #20)

**Depends on:** Step 1 (gitignore), Step 2 (schema design) **Triggers:** Steps
4-12 (all other P0 steps reference the skill)

---

## Step 4: Create REFERENCE.md

A reference companion for SKILL.md, following the deep-plan pattern where
`SKILL.md` has the process and `REFERENCE.md` has the detailed templates,
examples, and lookup tables.

**Location:** `.claude/skills/deep-research/REFERENCE.md`

### Content

1. **Question Type Classification Reference** -- the 8 question types with
   examples, recommended decomposition strategies, and termination conditions
   (from DETERMINATION_PHASE.md)
2. **Depth Level Detail** -- full parameter tables for L1-L4 (from
   DEPTH_LEVELS.md)
3. **Source Hierarchy by Domain** -- default source priority ordering plus
   domain-specific overrides (technology, academic, business)
4. **CRAAP+SIFT Framework** -- evaluation criteria for source assessment
5. **RESEARCH_OUTPUT.md Template** -- the exact Markdown template the
   synthesizer must produce, including:
   - Executive Summary
   - Key Findings (by theme, with inline citations `[n]`)
   - Contradictions & Open Questions
   - Confidence Assessment
   - Recommendations
   - Unexpected Findings (serendipity section -- even in P0)
   - Sources (tiered by authority)
   - Methodology (agents used, passes completed, duration)
6. **Interactive Decomposition Protocol** -- level B (2-3 rounds) and level C
   (deep-plan-style) question templates
7. **Budget Estimation Heuristics** -- how to estimate cost before execution
8. **Contrarian Challenge Prompt Template** -- the exact prompt for the
   contrarian convergence-loop pass
9. **Outside-the-Box Prompt Template** -- the exact prompt for the OTB
   convergence-loop pass
10. **Self-Audit Checklist** -- the 6 checks with pass/fail criteria

**Files:**

- **New:** `.claude/skills/deep-research/REFERENCE.md` -- detailed reference
  (~200-300 lines)

**Done when:**

- All 10 sections are present
- Question type classification covers all 8 types from DETERMINATION_PHASE.md
- RESEARCH_OUTPUT.md template is complete and specific (not placeholder)
- Contrarian and OTB prompt templates are actionable
- Self-audit checklist has verifiable pass/fail criteria

**Depends on:** Step 3 (SKILL.md references REFERENCE.md) **Triggers:** Steps 5,
6, 7 (agents reference the templates)

---

## Step 5: Create deep-research-searcher agent

Per Decision #14, fork from `gsd-project-researcher.md`. Per Decision #6, hybrid
approach -- default to specialists with spawn-time profiles.

**Location:** `.claude/agents/global/deep-research-searcher.md`

### Frontmatter

```yaml
---
name: deep-research-searcher
description: >-
  General-purpose web researcher spawned by the /deep-research skill. Executes
  search queries, fetches and analyzes sources, extracts findings with
  confidence levels, and writes structured FINDINGS.md files. Receives a search
  profile (web, docs, codebase, academic) at spawn time that activates the
  relevant tool strategy.
tools:
  Read, Write, Bash, Grep, Glob, WebSearch, WebFetch,
  mcp__context7__resolve_library_id, mcp__context7__get_library_docs
color: cyan
---
```

### Body Sections

Per CUSTOM_AGENT_DESIGN.md agent pattern:

1. **`<role>`** -- general-purpose web researcher spawned by `/deep-research`.
   Receives sub-question(s), search profile, output path, and budget. Writes
   findings to disk.

2. **`<philosophy>`** -- forked from gsd-project-researcher:
   - Claude's training as hypothesis (verify before asserting)
   - Honest reporting ("I couldn't find X" is valuable)
   - Source verification before confidence assignment
   - Write to disk first, always
   - Per CORE_DESIGN_PRINCIPLE: leave no stone unturned

3. **`<upstream_input>`** -- spawn prompt provides:
   - `sub_questions`: array of sub-question objects
   - `search_profile`: "web" | "docs" | "codebase" | "academic"
   - `output_dir`: path to findings directory
   - `budget_tokens`: max tokens for this agent
   - `depth`: current depth level
   - `domain`: detected domain for source authority tuning

4. **`<downstream_consumer>`** -- output consumed by:
   - `deep-research-synthesizer` agent (reads FINDINGS.md)
   - `/deep-research` skill orchestrator (reads structured return)

5. **`<tool_strategy>`** -- profile-based, per SEARCHER_VARIANTS.md Decision #6:

   **Web Profile (default):**
   - WebSearch: initial discovery, landscape mapping, 3-step query reformulation
   - WebFetch: deep-read specific pages, extract structured data
   - Training data: fallback only, always `[UNVERIFIED]`

   **Docs Profile:**
   - Context7 MCP: library/framework docs (highest trust)
   - WebFetch: official documentation sites
   - WebSearch: fallback for undocumented features

   **Codebase Profile (P1+):**
   - Grep/Glob: pattern discovery, file location
   - Read: deep-read specific files
   - Bash: structure analysis, metrics

   **Academic Profile (P1+):**
   - WebSearch: conference proceedings, preprints
   - WebFetch: arxiv, scholar, specific paper retrieval
   - (P1+ Paper Search MCP when available)

6. **`<source_hierarchy>`** -- CRAAP+SIFT evaluation framework:
   - Tier 1: Context7 MCP (highest), Official docs via WebFetch
   - Tier 2: WebSearch (established sources, recent dates)
   - Tier 3: Community content (blog posts, Stack Overflow, forums)
   - Tier 4: Training data (always `[UNVERIFIED]`)
   - Confidence assignment rules: 2+ independent sources = MEDIUM minimum,
     official source = HIGH eligible, training-only = UNVERIFIED

7. **`<verification_protocol>`** -- per-finding source verification:
   - Cross-reference key claims across 2+ independent sources
   - Check source recency (flag if >12 months on fast-moving topic)
   - Verify URLs actually support the claims made
   - Flag contradictions between sources (do not silently resolve)

8. **`<output_format>`** -- FINDINGS.md template:

   ```markdown
   # Findings: [Sub-Question]

   **Searcher:** deep-research-searcher **Profile:**
   [web|docs|codebase|academic] **Date:** [ISO 8601] **Sub-Question IDs:**
   [SQ-001, SQ-002]

   ## Key Findings

   1. **[Finding title]** [CONFIDENCE: HIGH|MEDIUM|LOW|UNVERIFIED] [Description
      with inline citations [n]]

   ## Sources

   | #   | URL | Title | Type | Trust | Date |
   | --- | --- | ----- | ---- | ----- | ---- |
   | 1   | ... | ...   | ...  | ...   | ...  |

   ## Contradictions

   [Any conflicts between sources, with evidence from both sides]

   ## Gaps

   [What could not be verified, what was not found, what needs deeper research]

   ## Serendipity

   [High-value findings outside the sub-question scope — unexpected discoveries]

   ## Confidence Assessment

   - HIGH claims: N
   - MEDIUM claims: N
   - LOW claims: N
   - UNVERIFIED claims: N
   - Overall confidence: [HIGH|MEDIUM|LOW]
   ```

9. **`<execution_flow>`** -- numbered steps:
   1. Parse spawn prompt for sub-questions, profile, output path, budget
   2. For each sub-question: a. Formulate initial search query (domain-aware) b.
      Execute search using profile-appropriate tools c. Deep-read top 3-5
      results via WebFetch d. Extract findings with confidence assessment e.
      Cross-reference across sources (verification protocol) f. If gaps found
      and budget allows: reformulate query (up to 3 rounds)
   3. Compile findings into FINDINGS.md at output path
   4. Write to disk immediately (do not hold in context)
   5. Return structured result to orchestrator

10. **`<structured_returns>`** -- return format:

    ```markdown
    ## RESEARCH COMPLETE

    **Sub-questions addressed:** N of M **Sources consulted:** N **Confidence
    distribution:** HIGH: N, MEDIUM: N, LOW: N, UNVERIFIED: N **Findings path:**
    .research/<topic>/findings/<sub-query>-FINDINGS.md **Gaps identified:**
    [brief list] **Serendipity:** [any unexpected findings, or "None"]
    ```

11. **`<success_criteria>`** -- completion checklist:
    - All assigned sub-questions addressed with evidence
    - FINDINGS.md written to disk at specified path
    - Every claim has at least one citation
    - Confidence levels assigned to every finding
    - Contradictions surfaced, not silently resolved
    - Gaps documented explicitly

**Files:**

- **New:** `.claude/agents/global/deep-research-searcher.md` -- searcher agent
  (~600-800 lines)

**Done when:**

- Agent follows the GSD agent pattern (frontmatter, XML sections)
- Forked from gsd-project-researcher with domain generalization
- All 4 search profiles defined (web and docs active for P0; codebase and
  academic stubbed for P1+)
- FINDINGS.md output format includes: Key Findings, Sources table,
  Contradictions, Gaps, Serendipity, Confidence Assessment
- Structured return includes findings path, confidence distribution, and gaps
- Tool declarations include all needed tools per Decision #11

**Depends on:** Step 3 (SKILL.md defines the spawn protocol), Step 4
(REFERENCE.md has templates) **Triggers:** Step 7 (skill orchestration
references the agent)

> **Steps 5 and 6 can run in parallel** -- they are independent agent
> definitions.

---

## Step 6: Create deep-research-synthesizer agent

Per Decision #14, fork from `gsd-research-synthesizer.md`.

**Location:** `.claude/agents/global/deep-research-synthesizer.md`

### Frontmatter

```yaml
---
name: deep-research-synthesizer
description: >-
  Combines findings from multiple searcher agents into a coherent research
  report with inline citations, confidence levels, and structured machine-
  parseable output. Spawned by the /deep-research skill after all searcher
  agents complete.
tools: Read, Write, Bash
color: purple
---
```

### Body Sections

1. **`<role>`** -- synthesizer spawned by `/deep-research`. Reads all
   FINDINGS.md files, deduplicates, extracts themes, produces
   RESEARCH_OUTPUT.md + claims.jsonl + sources.jsonl + metadata.json.

2. **`<philosophy>`** -- synthesis is curation, not concatenation:
   - Resolve contradictions transparently (show both sides, state which is
     better supported)
   - Elevate patterns that appear across multiple findings files
   - Do not inflate confidence (if sources disagree, confidence is MEDIUM at
     best)
   - Per CORE_DESIGN_PRINCIPLE: comprehensive output, let user skim if they want
     less

3. **`<upstream_input>`** -- spawn prompt provides:
   - `findings_dir`: path to findings directory
   - `output_dir`: path to output directory
   - `topic`: original research question
   - `depth`: depth level (affects output detail)
   - `sub_questions`: the original sub-question list
   - `claims_schema`: reference to claims.jsonl record format

4. **`<downstream_consumer>`** -- output consumed by:
   - User (RESEARCH_OUTPUT.md)
   - `/deep-research` skill orchestrator (structured return)
   - Downstream adapters (claims.jsonl, sources.jsonl, metadata.json)

5. **`<execution_flow>`** -- numbered steps:
   1. Read all FINDINGS.md files from findings directory
   2. Deduplicate findings across files (same claim from different searchers)
   3. Extract themes -- group findings by conceptual theme, not by source
   4. Identify contradictions across findings files
   5. Assign citations -- number all unique sources sequentially
   6. Draft RESEARCH_OUTPUT.md using template from REFERENCE.md
   7. Generate claims.jsonl -- one record per claim with confidence and routing
   8. Generate sources.jsonl -- one record per unique source with CRAAP scoring
   9. Generate metadata.json -- session metadata with consumer_hints
   10. Write all files to output directory
   11. Return structured result to orchestrator

6. **`<output_format>`** -- references RESEARCH_OUTPUT.md template from
   REFERENCE.md. Also specifies claims.jsonl, sources.jsonl, metadata.json
   schemas (from Step 3).

7. **`<structured_returns>`**:

   ```markdown
   ## SYNTHESIS COMPLETE

   **Findings files processed:** N **Unique claims extracted:** N **Unique
   sources cited:** N **Confidence distribution:** HIGH: N, MEDIUM: N, LOW: N,
   UNVERIFIED: N **Themes identified:** [brief list] **Contradictions found:** N
   **Output path:** .research/<topic>/RESEARCH_OUTPUT.md
   ```

8. **`<success_criteria>`**:
   - All FINDINGS.md files processed (no silent omission)
   - Every claim in RESEARCH_OUTPUT.md has inline citation `[n]`
   - claims.jsonl contains every extractable claim
   - sources.jsonl contains every cited source
   - metadata.json has accurate consumer_hints
   - Contradictions surfaced in dedicated section
   - Executive summary is readable standalone

**Files:**

- **New:** `.claude/agents/global/deep-research-synthesizer.md` -- synthesizer
  agent (~300-400 lines)

**Done when:**

- Agent follows the GSD agent pattern (frontmatter, XML sections)
- Forked from gsd-research-synthesizer with generalization
- Produces all 4 output files: RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl,
  metadata.json
- Claims include routing flags for downstream consumers
- Structured return includes claim count, source count, confidence distribution
- Tool declarations match Decision #11 (Read, Write, Bash)

**Depends on:** Step 3 (SKILL.md defines the output format), Step 4
(REFERENCE.md has templates) **Triggers:** Step 7 (skill orchestration
references the agent)

---

## Step 7: Wire Phase 0 -- Interactive Decomposition

Implement the Phase 0 logic in SKILL.md. This is the inline orchestration that
runs before any agents are spawned.

Per Decision #16, start at level B (2-3 rounds of Q&A) and escalate to level C
(deep-plan-style exhaustive discovery) if scope warrants.

Phase 0 must:

1. Classify question type (8 types from DETERMINATION_PHASE.md)
2. Detect domain (adaptive -- high confidence proceeds, low asks user)
3. Select depth level (per Decision #5, L1-L4 scale, Exhaustive default)
4. Run interactive decomposition:
   - Level B: 2-3 rounds of probing questions about scope, constraints, what
     user already knows, what angles matter most
   - Escalate to Level C if: question is multi-domain, user requests it, or
     initial decomposition reveals 8+ sub-dimensions
5. Generate MECE sub-questions
6. Apply allocation formula: `D + 3 + floor(D/5)` where D = sub-question count
   (Decision #7)
7. Present research plan to user:
   - Question type, domain, depth level
   - Sub-questions with assigned search profiles
   - Agent count and estimated cost
   - "Approve, modify, or abort?"
8. Update state file with plan details

This logic is all inline in SKILL.md (not a separate agent, per Decision #14 and
CUSTOM_AGENT_DESIGN.md).

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- Phase 0 section
  detail

**Done when:**

- Phase 0 section in SKILL.md covers all 8 steps above
- Interactive decomposition protocol references REFERENCE.md for question
  templates
- Allocation formula is embedded with worked example
- Plan presentation format is specified
- State file is updated after plan approval

**Depends on:** Steps 3, 4 **Triggers:** Step 8 (Phase 1 depends on approved
plan)

---

## Step 8: Wire Phase 1 -- Parallel Research

Implement Phase 1 in SKILL.md. This phase spawns searcher agents via the Task
tool.

Phase 1 must:

1. Read approved plan from state file
2. Group sub-questions into agent assignments (1 searcher per sub-question
   group)
3. Spawn searcher agents in parallel via Task tool:
   ```
   For each agent assignment:
     Task(agent: "deep-research-searcher", prompt: {
       sub_questions: [...],
       search_profile: "web" | "docs",
       output_dir: ".research/<topic>/findings/",
       budget_tokens: <allocated amount>,
       depth: <depth level>,
       domain: <detected domain>
     })
   ```
4. Collect structured returns from each agent
5. Update state file after each agent completes
6. Check for gaps in coverage -- if critical gaps and budget allows, spawn
   additional searcher(s)
7. Proceed to Phase 2 when all searchers complete (or budget forces synthesis)

Per AGENT_ORCHESTRATION.md: max 4 concurrent agents. If allocation formula
yields more, batch into waves.

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- Phase 1 section
  detail

**Done when:**

- Phase 1 spawns searcher agents via Task tool with correct prompt format
- Parallel execution respects 4-agent concurrency limit
- State file tracks each agent's status (running/complete/failed)
- Gap detection logic is documented
- Budget enforcement at 70/85/95% thresholds is documented

**Depends on:** Steps 5, 7 **Triggers:** Step 9 (Phase 2 depends on completed
findings)

> **Steps 8 and 9 can be written in parallel** as they are separate phase
> sections of SKILL.md, though Phase 2 executes after Phase 1 at runtime.

---

## Step 9: Wire Phase 2 -- Synthesis

Implement Phase 2 in SKILL.md.

Phase 2 must:

1. Verify all expected FINDINGS.md files exist on disk
2. Spawn synthesizer agent via Task tool:
   ```
   Task(agent: "deep-research-synthesizer", prompt: {
     findings_dir: ".research/<topic>/findings/",
     output_dir: ".research/<topic>/",
     topic: <original question>,
     depth: <depth level>,
     sub_questions: <full list>,
     claims_schema: <reference to schema>
   })
   ```
3. Collect structured return
4. Verify output files exist: RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl,
   metadata.json
5. Update state file

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- Phase 2 section
  detail

**Done when:**

- Phase 2 spawns synthesizer with correct prompt
- Output file existence verification is documented
- State file updated with synthesis status
- Error handling for missing findings files is documented

**Depends on:** Steps 6, 7 **Triggers:** Step 10 (Phase 3 depends on synthesis
output)

---

## Step 10: Wire Phase 3 -- Mandatory Challenges

Per Decision #3, contrarian + outside-the-box are mandatory at ALL depth levels.

Phase 3 must:

1. **Contrarian challenge** -- invoke convergence-loop with a custom contrarian
   preset that:
   - Takes RESEARCH_OUTPUT.md as input
   - Challenges the consensus findings
   - Seeks disconfirming evidence
   - Tries to disprove the strongest claims
   - Writes CONTRARIAN.md to `.research/<topic>/challenges/`

   Prompt template (from REFERENCE.md):

   ```
   You are a contrarian researcher. Your job is to challenge the findings in
   this research report. For each key claim:
   1. What evidence would DISPROVE this claim?
   2. What alternative explanations exist?
   3. What biases might have led to this conclusion?
   4. What sources were NOT consulted that might disagree?
   Write your challenges with specific evidence, not generic skepticism.
   ```

2. **Outside-the-box challenge** -- invoke convergence-loop with a custom OTB
   preset that:
   - Takes RESEARCH_OUTPUT.md as input
   - Identifies what structured research missed
   - Explores tangential connections
   - Surfaces non-obvious implications
   - Writes OUTSIDE_THE_BOX.md to `.research/<topic>/challenges/`

   Prompt template:

   ```
   You are a lateral thinker. The structured research has answered the
   questions it asked. Your job is to find what it DIDN'T ask:
   1. What adjacent domains have relevant insights?
   2. What analogies from other fields illuminate this problem?
   3. What second-order effects were not considered?
   4. What would a complete non-expert notice that experts miss?
   Write specific insights, not vague "think differently" suggestions.
   ```

3. Per Decision #15 scaling:
   - L1-L2: 1 agent each (CL presets) -- single contrarian + single OTB pass
   - L3: 2 agents each (different adversarial/lateral strategies)
   - L4: 3 agents each + red team pass + pre-mortem

4. Update state file with challenge status
5. Optionally feed challenge findings back to synthesizer for incorporation into
   the final report (if challenges reveal significant gaps)

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- Phase 3 section
  detail
- **Modified:** `.claude/skills/deep-research/REFERENCE.md` -- contrarian and
  OTB prompt templates

**Done when:**

- Contrarian and OTB challenges are mandatory at all levels
- Scaling per Decision #15 is documented (L1-L2: 1 each, L3: 2 each, L4: 3
  each + extras)
- Challenge output paths are defined
- Prompt templates are specific and actionable (not generic)
- State file tracks challenge completion

**Depends on:** Step 9 **Triggers:** Step 11 (Phase 4 depends on completed
challenges)

---

## Step 11: Wire Phase 4 -- Self-Audit

Per Decision #18, summary line by default ("Self-audit: 6/6 passed"),
`--audit-details` flag for full report.

Phase 4 must run these checks inline (not via a separate agent):

1. **Completeness** -- all sub-questions addressed in RESEARCH_OUTPUT.md
2. **Citation density** -- every substantive claim has at least one citation
3. **Confidence distribution** -- not all HIGH (confidence theater), not all LOW
   (insufficient research)
4. **Source diversity** -- not all from same domain/author
5. **Contradiction resolution** -- all contradictions surfaced, not silently
   resolved
6. **Challenge integration** -- contrarian and OTB findings acknowledged

**Output:**

- Default: `Self-audit: 6/6 passed` or
  `Self-audit: 5/6 passed, 1 warning: [detail]`
- With `--audit-details`: full checklist with evidence for each check

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- Phase 4 section
  detail
- **Modified:** `.claude/skills/deep-research/REFERENCE.md` -- self-audit
  checklist

**Done when:**

- 6 audit checks are defined with pass/fail criteria
- Summary line format matches Decision #18
- `--audit-details` flag behavior is documented
- Audit results written to state file

**Depends on:** Step 10 **Triggers:** Step 12 (Phase 5 depends on audit
completion)

---

## Step 12: Wire Phase 5 -- Presentation + Downstream Routing

Phase 5 presents results and offers next actions.

Phase 5 must:

1. **Terminal summary** (5-10 lines):

   ```
   ========== RESEARCH COMPLETE ==========
   Topic: [question]
   Depth: [L1-L4] ([label])
   Claims: N (HIGH: X, MEDIUM: Y, LOW: Z)
   Sources: N unique sources consulted
   Challenges: Contrarian [N issues], OTB [N insights]
   Self-audit: [summary line]
   Report: .research/<topic-slug>/RESEARCH_OUTPUT.md
   ========================================
   ```

2. **"What next?" menu** (recognition over recall):
   - "1. Deepen research on: [top 2-3 suggested sub-topics from gaps]"
   - "2. Route to /deep-plan for implementation planning"
   - "3. Verify LOW-confidence claims with /convergence-loop (N claims)"
   - "4. Save HIGH-confidence insights to memory (N candidates)"
   - "5. View full report"
   - "6. Done"

3. Per CLAUDE.md guardrail #6: require acknowledgment before continuing

4. **Cleanup raw findings** (per Decision #21): Do **not** hard-delete raw
   artifacts by default. Instead:
   - Default: keep `findings/*.md` and `challenges/*.md` for resume + audit
     provenance.
   - Optional (user-confirmed in Phase 5 acknowledgment step): archive them to
     `.research/<topic-slug>/archive/findings/` and
     `.research/<topic-slug>/archive/challenges/` after synthesis + verification
     are complete.
   - Record cleanup action in state file (e.g.,
     `output.rawArtifacts: "kept" | "archived" | "deleted"`) so
     resume/verification does not assume missing files.
   - Preserve always: RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl,
     metadata.json. These conclusion artifacts support decision provenance,
     research memory, overlap detection, and `/research-refresh`.

5. Update state file to `complete`

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- Phase 5 section
  detail

**Done when:**

- Terminal summary format is specified
- "What next?" menu includes all routing options
- Acknowledgment requirement is documented
- State file transitions to `complete`

**Depends on:** Step 11 **Triggers:** P0 audit checkpoint (Step 12a)

---

## Step 12a: P0 Audit Checkpoint

Run `code-reviewer` agent on all new/modified files before proceeding to P1.

**Files to review:**

- `.claude/skills/deep-research/SKILL.md` (new)
- `.claude/skills/deep-research/REFERENCE.md` (new)
- `.claude/agents/global/deep-research-searcher.md` (new)
- `.claude/agents/global/deep-research-synthesizer.md` (new)
- `.gitignore` (modified)

**Done when:**

- code-reviewer has reviewed all 5 files
- All critical issues resolved
- Non-critical issues logged as DEBT or deferred to P1

**Depends on:** Steps 1-12 **Triggers:** P0 is complete; P1 can begin

---

## P0 Smoke Test

Before declaring P0 complete, manually verify:

1. `/deep-research "What are the best practices for implementing WebSocket connections in Next.js 16?"`
   produces a research plan
2. Plan approval works (approve, modify, abort)
3. Searcher agents spawn and write FINDINGS.md files
4. Synthesizer produces RESEARCH_OUTPUT.md with citations
5. Contrarian and OTB challenges produce challenge files
6. Self-audit runs and reports a summary line
7. Terminal summary appears with "What next?" menu
8. State file enables resume after interruption (kill and re-invoke)

---

# P1: Verification + Memory + Expanded Sources

**Goal:** Add cross-model verification via Gemini CLI. Research index for
overlap detection. Convergence-loop research-claims preset. MCP source
expansion.

**Prerequisite:** P0 working end-to-end, used at least 3 times. **Estimated
effort:** 500-800 additional lines

---

## Step 13: Install and configure Gemini CLI

Per Decision #13, Gemini CLI provides independent cross-model verification
(free, scriptable, JSON output, 1K queries/day).

### Setup

```bash
npm install -g @google/gemini-cli
```

Google auth is required (one-time). Document the setup in REFERENCE.md.

### Integration Pattern

Gemini CLI is invoked via Bash tool from the skill orchestrator. The invocation
pattern:

```bash
echo '<PROMPT>' | gemini --json 2>/dev/null
```

Where `<PROMPT>` contains the verification request and the claim to verify. The
`--json` flag ensures structured output that can be parsed.

### Verification Protocol

For each HIGH-confidence claim in the research output:

1. Formulate a verification prompt: "Is the following claim accurate and
   current? Provide evidence for or against: [claim]"
2. Invoke Gemini CLI
3. Parse JSON response for agreement/disagreement
4. If disagreement: flag the claim, include both perspectives in output
5. Update confidence level based on cross-model consensus

### Rate Limiting

1,000 free queries/day. For a typical Exhaustive research session with 30-60
claims, verification of HIGH-confidence claims (typically 30-50%) consumes 9-30
queries. Well within budget.

**Files:**

- **Modified:** `.claude/skills/deep-research/REFERENCE.md` -- Gemini CLI setup
  section, verification prompt template
- **Modified:** `.claude/skills/deep-research/SKILL.md` -- Phase 3 updated to
  include cross-model verification after contrarian/OTB

**Done when:**

- Gemini CLI installation instructions documented
- Verification prompt template is specific and tested
- JSON output parsing pattern is documented
- Rate limiting strategy is documented
- Phase 3 in SKILL.md includes cross-model verification as an optional step
  (enabled by default for L1-L2, mandatory for L3-L4)

**Depends on:** P0 complete **Triggers:** Steps 14-20 (Gemini verification
available for all P1 features)

---

## Step 14: Create convergence-loop `research-claims` preset

Per Decision #17 and CONVERGENCE_IN_RESEARCH, add a research-specific preset to
the convergence-loop skill.

### Preset Definition

```
research-claims:
  sequence: verify-sources -> cross-reference -> temporal-check -> completeness-audit -> bias-check -> synthesis-fidelity
  passes: 6 (one per behavior)
  input: claims.jsonl from deep-research output
  output: verified claims with upgraded/downgraded confidence
```

### Six Research-Specific Behaviors

1. **verify-sources** -- check cited URLs exist and support the claims
2. **cross-reference** -- find independent corroborating sources
3. **temporal-check** -- verify information is current
4. **completeness-audit** -- check all sub-questions were addressed
5. **bias-check** -- assess perspective diversity and source concentration
6. **synthesis-fidelity** -- verify synthesis accurately represents findings

**Files:**

- **Modified:** `.claude/skills/convergence-loop/SKILL.md` -- add
  `research-claims` preset to presets table
- **Modified:** `.claude/skills/convergence-loop/REFERENCE.md` -- add behavior
  definitions and prompt templates for the 6 research behaviors

**Done when:**

- `research-claims` preset appears in convergence-loop presets table
- All 6 behaviors have defined prompts and output formats
- Integration contract is documented (how deep-research invokes the preset)
- T20 tally format works with research claims

**Depends on:** P0 complete **Triggers:** Step 19 (verification integration in
SKILL.md)

> **Steps 14, 15, and 16 can run in parallel** -- they are independent features.

---

## Step 15: Create research index system

Per the SYNTHESIS.md memory architecture, create a research index for topic
lookup and overlap detection.

### Location

`.research/research-index.jsonl` -- top-level index of all research sessions.

### Record Schema

```json
{
  "topicSlug": "string",
  "topic": "string — original question",
  "depth": "L1 | L2 | L3 | L4",
  "domain": "string",
  "completedAt": "ISO 8601",
  "claimCount": "number",
  "sourceCount": "number",
  "confidenceDistribution": {
    "HIGH": 0,
    "MEDIUM": 0,
    "LOW": 0,
    "UNVERIFIED": 0
  },
  "keywords": ["array of topic keywords for overlap detection"],
  "outputPath": ".research/<topic-slug>/",
  "status": "complete | partial | stale"
}
```

### Overlap Detection

When a new `/deep-research` invocation begins, Phase 0 checks the index:

1. Exact topic match -> offer to resume or re-research
2. Keyword overlap >50% -> surface existing research, ask if user wants to build
   on it or start fresh
3. No overlap -> proceed normally

### Staleness Rules (from SYNTHESIS.md)

| Domain     | Stale After  | Expired After |
| ---------- | ------------ | ------------- |
| Technology | 7 days       | 30 days       |
| Business   | 14 days      | 60 days       |
| Academic   | 90 days      | 365 days      |
| Historical | No staleness | No expiry     |

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- Phase 0 updated to
  check index, Phase 5 updated to write index entry
- **New:** Documentation of index schema in REFERENCE.md

**Done when:**

- Index schema is defined
- Phase 0 checks index for overlap before decomposition
- Phase 5 writes index entry after completion
- Staleness rules are documented and enforced
- `.research/research-index.jsonl` is created on first use

**Depends on:** P0 complete **Triggers:** P3 (research-recall, research-forget,
research-refresh)

---

## Step 16: Configure MCP source expansion

Per Decision #12, P1 adds Tavily, Brave Search, Firecrawl, and Paper Search MCP
servers.

### .mcp.json Updates

Add to `.mcp.json` (currently `.mcp.json.example` entries need activation):

```json
{
  "mcpServers": {
    "tavily": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-tavily"],
      "env": { "TAVILY_API_KEY": "${TAVILY_API_KEY}" }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-brave-search"],
      "env": { "BRAVE_API_KEY": "${BRAVE_API_KEY}" }
    },
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-firecrawl"],
      "env": { "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}" }
    }
  }
}
```

> **Secrets must live only in `.env` (gitignored).** Never paste real keys into
> `.mcp.json`. Prefer committing `.mcp.json.example` and keeping `.mcp.json`
> local if it is developer-specific.

Paper Search MCP is P2 (academic mode).

### Searcher Agent Updates

Update `deep-research-searcher.md` to include MCP tools in tool strategy:

- Tavily: preferred for LLM-optimized search+extract ($0.008/req)
- Brave: independent index for cross-verification
- Firecrawl: deep extraction for JS-rendered pages

### Source Hierarchy Update

With MCP servers, the source hierarchy becomes:

1. Context7 (library docs -- highest trust)
2. Tavily (LLM-optimized, structured extraction)
3. WebFetch (official docs)
4. Brave Search (independent index, cross-verification)
5. Firecrawl (JS rendering, deep extraction)
6. WebSearch (general fallback)
7. Training data (always UNVERIFIED)

**Files:**

- **Modified:** `.mcp.json` -- add Tavily, Brave Search, Firecrawl server
  configs
- **Modified:** `.claude/agents/global/deep-research-searcher.md` -- update
  tool_strategy section, add MCP tools to frontmatter tools list
- **Modified:** `.claude/skills/deep-research/REFERENCE.md` -- update source
  hierarchy

**Done when:**

- MCP servers are configured in `.mcp.json`
- Searcher agent tool strategy includes MCP servers
- Source hierarchy updated with new sources
- API key requirements documented (which keys go in `.env`)
- Fallback behavior documented (what happens when MCP server is unavailable)

**Depends on:** P0 complete **Triggers:** Enhanced source coverage for all
research sessions

---

## Step 17: Add codebase search profile

Activate the stubbed `codebase` profile in the searcher agent.

The codebase profile enables queries like "How does our codebase handle X?" that
combine local code analysis with web research on patterns.

### Tool Strategy

| Priority | Tool               | Usage                            |
| -------- | ------------------ | -------------------------------- |
| 1        | Grep/Glob          | Pattern discovery, file location |
| 2        | Read               | Deep-read specific files         |
| 3        | Bash (ls, wc)      | Structure analysis, metrics      |
| 4        | WebSearch/WebFetch | External patterns for comparison |

**Files:**

- **Modified:** `.claude/agents/global/deep-research-searcher.md` -- activate
  codebase profile (fill in the P1+ stub)

**Done when:**

- Codebase profile has complete tool strategy
- Profile handles mixed queries (local + external)
- Source hierarchy for codebase: filesystem (ground truth) > git log (recency) >
  CLAUDE.md conventions

**Depends on:** Step 5 (searcher agent exists) **Triggers:** Codebase research
queries work

---

## Step 18: Add academic search profile

Activate the stubbed `academic` profile in the searcher agent.

### Tool Strategy

| Priority | Tool                            | Usage                             |
| -------- | ------------------------------- | --------------------------------- |
| 1        | Paper Search MCP (if available) | Academic databases                |
| 2        | WebFetch (arxiv, scholar)       | Specific paper retrieval          |
| 3        | WebSearch                       | Conference proceedings, preprints |

### Verification Protocol (academic-specific)

- Peer-reviewed > preprint > blog
- Check citation count as quality signal
- Check for retractions
- Follow citation chains (cited-by, references)

**Files:**

- **Modified:** `.claude/agents/global/deep-research-searcher.md` -- activate
  academic profile
- **Modified:** `.claude/skills/deep-research/REFERENCE.md` -- academic source
  hierarchy

**Done when:**

- Academic profile has complete tool strategy
- Citation chain following is documented
- Peer review status is a confidence factor

**Depends on:** Step 5 (searcher agent exists), Step 16 (MCP servers optionally
available) **Triggers:** Academic research queries work

---

## Step 19: Integrate verification into research flow

Wire the convergence-loop `research-claims` preset and Gemini CLI verification
into the SKILL.md flow.

### Updated Phase 3 Flow

```
Phase 3: Verification + Challenges
  |
  |-- 3a: Contrarian challenge (existing from P0)
  |-- 3b: Outside-the-box challenge (existing from P0)
  |-- 3c: Cross-model verification via Gemini CLI (NEW)
  |     → Verify HIGH-confidence claims independently
  |     → Flag disagreements between Claude and Gemini
  |-- 3d: Convergence-loop research-claims preset (NEW)
  |     → Run on MEDIUM/LOW confidence claims
  |     → 6-behavior sequence: verify-sources, cross-reference,
  |       temporal-check, completeness-audit, bias-check, synthesis-fidelity
  |     → Update claims with upgraded/downgraded confidence
  |-- 3e: Re-synthesis if verification changed >20% of claims
```

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- Phase 3 expanded with
  3c, 3d, 3e

**Done when:**

- Phase 3 includes both Gemini CLI and convergence-loop verification
- Verification is depth-dependent:
  - L1: contrarian + OTB + Gemini on top 5 claims
  - L2: contrarian + OTB + Gemini on all HIGH claims
  - L3-L4: full verification suite
- Re-synthesis trigger documented (>20% claim changes)
- State file tracks verification results

**Depends on:** Steps 13, 14 **Triggers:** Verification is complete; P1 audit
checkpoint

---

## Step 20: P1 Audit Checkpoint

Run `code-reviewer` agent on all modified files.

**Files to review:**

- `.claude/skills/deep-research/SKILL.md` (modified in steps 13, 15, 19)
- `.claude/skills/deep-research/REFERENCE.md` (modified in steps 13, 15, 16, 18)
- `.claude/agents/global/deep-research-searcher.md` (modified in steps 16,
  17, 18)
- `.claude/skills/convergence-loop/SKILL.md` (modified in step 14)
- `.claude/skills/convergence-loop/REFERENCE.md` (modified in step 14)
- `.mcp.json` (modified in step 16)

**Done when:**

- code-reviewer has reviewed all modified files
- All critical issues resolved
- P1 features tested with at least 1 research session using verification

**Depends on:** Steps 13-19 **Triggers:** P1 complete; P2 can begin

---

# P2: Downstream Integration

**Goal:** Priority adapters connect research output to deep-plan, skill-creator,
GSD, and convergence-loop. Domain modules. Self-audit Tier 1. Source reliability
tracking.

**Prerequisite:** P1 working, verification improving quality. **Estimated
effort:** 400-600 additional lines

---

## Step 21: Design adapter contract

Define the universal adapter contract that all downstream integrations follow.
Per DOWNSTREAM_INTEGRATION.md principles:

1. Universal format, consumer-specific adapters
2. Research produces inputs, not outputs (never overwrites consumer files)
3. Confidence is first-class (gates automated vs manual handoff)
4. Handoff requires acknowledgment (per CLAUDE.md guardrail #6)

### Adapter Interface

Every adapter:

- **Reads:** claims.jsonl + sources.jsonl + metadata.json
- **Filters:** by claim category, confidence, routing flags
- **Transforms:** to consumer-specific format
- **Writes:** to consumer's expected location (or presents for copy)
- **Reports:** what was adapted, what was skipped, why

### Adapter Registry

Documented in REFERENCE.md:

| Adapter          | Consumer             | Trigger                                | Category Filter                 |
| ---------------- | -------------------- | -------------------------------------- | ------------------------------- |
| deep-plan        | `/deep-plan` Phase 0 | User says "use for planning"           | all                             |
| skill-creator    | `/skill-creator`     | User says "create skill from research" | all                             |
| gsd              | GSD pipeline         | User says "start GSD with research"    | stack, features, arch, pitfalls |
| convergence-loop | `/convergence-loop`  | Auto-suggest for LOW claims            | confidence < HIGH               |

**Files:**

- **Modified:** `.claude/skills/deep-research/REFERENCE.md` -- adapter contract
  specification, adapter registry table

**Done when:**

- Adapter contract interface is defined
- All 4 adapters have trigger conditions documented
- Category and confidence filters specified per adapter
- Write boundaries clear (research never overwrites consumer files)

**Depends on:** P1 complete **Triggers:** Steps 22-25 (individual adapter
implementations)

> **Steps 22-25 can run in parallel** -- they are independent adapter
> implementations.

---

## Step 22: Implement deep-plan adapter

Per Decision #17, `/deep-plan` is the highest-priority adapter. Research output
feeds Phase 0 DIAGNOSIS.md as a `## Research Context` section.

### Adapter Logic

```
claims.jsonl → Filter by routing.deepPlan === true → Extract:
  - Domain ecosystem summary (from metadata + HIGH-confidence claims)
  - Key recommendations with confidence levels
  - Pitfalls relevant to the task
  - Contradictions that affect planning
→ Format as "## Research Context" markdown section
→ Present to user: "Add this to DIAGNOSIS.md? [yes/no/edit]"
```

### Integration Point

When `/deep-plan` Phase 0 begins, it checks for research at
`.research/<topic-slug>/`. If found, auto-inject Research Context section into
DIAGNOSIS.md template.

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- adapter invocation in
  Phase 5 "what next?" menu
- **Modified:** `.claude/skills/deep-plan/SKILL.md` -- Phase 0 updated to check
  for existing research

**Done when:**

- deep-plan adapter transforms claims.jsonl into DIAGNOSIS.md section
- `/deep-plan` Phase 0 detects and offers to use existing research
- User confirms before any injection (guardrail #6)
- Research Context section has defined format

**Depends on:** Step 21 **Triggers:** Research feeds into planning workflow

---

## Step 23: Implement skill-creator adapter

Per Decision #17, `/skill-creator` uses research for domain patterns, guard
rails, and discovery question defaults.

### Adapter Logic

```
claims.jsonl → Extract:
  - Domain patterns → inform "Architecture & Structure" questions
  - Existing tool analysis → inform "Scope & Scale" questions
  - Pitfalls → inform "Guard Rails" section of created skill
  - Best practices → inform "Critical Rules" section
→ Present as pre-populated defaults in Phase 2 Discovery
```

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- adapter in "what
  next?" menu

**Done when:**

- skill-creator adapter extracts relevant claims by category
- Output format matches skill-creator's expected input
- User-initiated only ("create skill from research")

**Depends on:** Step 21 **Triggers:** Research-informed skill creation

---

## Step 24: Implement GSD adapter

Per DOWNSTREAM_INTEGRATION.md, the GSD adapter transforms universal output into
GSD-specific file format.

### Adapter Logic (project-level)

```
claims.jsonl → Transform by category:
  claims[category=stack]     → STACK.md format
  claims[category=features]  → FEATURES.md format
  claims[category=arch]      → ARCHITECTURE.md format
  claims[category=pitfalls]  → PITFALLS.md format
  executive_summary          → SUMMARY.md with "Implications for Roadmap"
→ Write to .planning/research/ (GSD's expected location)
→ User confirms before writing
```

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- GSD adapter in "what
  next?" menu

**Done when:**

- GSD adapter produces files in the exact format consumed by gsd-roadmapper and
  gsd-planner
- Output matches the structure of gsd-project-researcher output
- User confirms before writing to `.planning/research/`

**Depends on:** Step 21 **Triggers:** Research feeds into GSD pipeline

---

## Step 25: Implement convergence-loop adapter

Per DOWNSTREAM_INTEGRATION.md, LOW/MEDIUM confidence claims auto-route to
convergence-loop for verification.

### Adapter Logic

```
claims.jsonl → Filter by confidence < HIGH → Format as:
  [
    { "id": "C-001", "claim": "...", "source": "...", "confidence": "MEDIUM" },
    { "id": "C-002", "claim": "...", "source": "...", "confidence": "LOW" }
  ]
→ Auto-suggest: "Research produced N low-confidence claims. Verify with
  /convergence-loop? [yes/no/select specific claims]"
→ On convergence: update claims.jsonl with corrected claims + upgraded confidence
```

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- convergence-loop
  adapter in Phase 5

**Done when:**

- Adapter filters claims by confidence
- Auto-suggestion appears in "what next?" menu with claim count
- After convergence, claims.jsonl is updated with new confidence levels
- Bidirectional flow works (research -> convergence -> updated research)

**Depends on:** Steps 14, 21 **Triggers:** Research verification loop is
complete

---

## Step 26: Add domain modules

Per DETERMINATION_PHASE.md, domain detection tunes source authority,
verification rules, and output format. Start with 3 domain modules as YAML
configuration.

### Domain Module Structure

```
.claude/skills/deep-research/domains/
  technology.yaml
  academic.yaml
  business.yaml
```

### Example: technology.yaml

```yaml
name: technology
keywords: ["api", "framework", "library", "architecture", "deploy", "devops"]
source_authority:
  - tier: 1
    sources: ["context7", "official-docs"]
    trust: HIGH
  - tier: 2
    sources: ["github", "stackoverflow", "web-search"]
    trust: MEDIUM
  - tier: 3
    sources: ["blog", "tutorial", "training-data"]
    trust: LOW
verification_rules:
  recency_threshold_days: 30
  min_independent_sources: 2
  check_deprecation: true
staleness:
  stale_after_days: 7
  expired_after_days: 30
output_tuning:
  include_code_examples: true
  include_version_matrix: true
```

**Files:**

- **New:** `.claude/skills/deep-research/domains/technology.yaml` (~30 lines)
- **New:** `.claude/skills/deep-research/domains/academic.yaml` (~30 lines)
- **New:** `.claude/skills/deep-research/domains/business.yaml` (~30 lines)
- **Modified:** `.claude/skills/deep-research/SKILL.md` -- Phase 0 loads domain
  module
- **Modified:** `.claude/skills/deep-research/REFERENCE.md` -- domain module
  format documented

**Done when:**

- 3 domain modules exist with complete configuration
- Phase 0 loads domain module based on detection
- Source authority and verification rules vary by domain
- Adding a new domain requires only creating a new YAML file

**Depends on:** P0 complete (domain detection exists in Phase 0) **Triggers:**
Domain-aware research produces better results

---

## Step 27: P2 Audit Checkpoint

Run `code-reviewer` agent on all modified files from P2.

**Files to review:**

- `.claude/skills/deep-research/SKILL.md` (modified in steps 22-25)
- `.claude/skills/deep-research/REFERENCE.md` (modified in steps 21, 26)
- `.claude/skills/deep-plan/SKILL.md` (modified in step 22)
- `.claude/skills/deep-research/domains/*.yaml` (new in step 26)

**Done when:**

- code-reviewer has reviewed all files
- All 4 adapters tested with at least 1 real research session
- Domain module loading tested

**Depends on:** Steps 21-26 **Triggers:** P2 complete; P3 can begin

---

# P3: Learning + Management

**Goal:** `/research-recall`, `/research-forget`, `/research-refresh`. Strategy
learning. Full self-audit. MCP memory entities.

**Prerequisite:** P2 working, adapters proven useful. **Estimated effort:**
400-600 additional lines

---

## Step 28: Design research management commands

Three new sub-commands or companion skills:

1. **`/research-recall <topic>`** -- search the research index, surface relevant
   prior research. Supports keyword search and fuzzy matching.

2. **`/research-forget <topic>`** -- mark research as archived/deleted. Remove
   from index. Optionally delete output files.

3. **`/research-refresh <topic>`** -- re-run research on a previously completed
   topic, preserving the old output for comparison. Surface what changed.

### Implementation Approach

These can be sub-commands within `/deep-research` rather than separate skills:

- `/deep-research --recall <topic>`
- `/deep-research --forget <topic>`
- `/deep-research --refresh <topic>`

Or as documented "what next?" options in the Phase 5 menu.

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- add sub-command
  documentation
- **Modified:** `.claude/skills/deep-research/REFERENCE.md` -- sub-command
  reference

**Done when:**

- All 3 sub-commands documented with input/output
- Index querying logic documented for recall
- Archival logic documented for forget
- Refresh logic preserves old research for comparison
- Staleness rules from Step 15 drive refresh suggestions

**Depends on:** Step 15 (research index) **Triggers:** Steps 29-31

> **Steps 29, 30, and 31 can run in parallel** -- they are independent features.

---

## Step 29: Implement strategy learning

Track which search strategies produce the best results per domain. After each
research session, record:

```json
{
  "domain": "technology",
  "questionType": "comparative",
  "depth": "L2",
  "searchProfile": "web",
  "sourceCount": 18,
  "highConfidenceRate": 0.72,
  "queryReformulations": 2,
  "topPerformingSources": ["official-docs", "github"],
  "completedAt": "ISO 8601"
}
```

Store in `.research/strategy-log.jsonl`. Over time, this data informs:

- Which search profiles work best for which question types
- Which sources consistently produce HIGH-confidence findings
- Which domains need more search rounds

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- Phase 5 writes
  strategy log entry
- **New:** `.research/strategy-log.jsonl` schema documented in REFERENCE.md

**Done when:**

- Strategy log schema defined
- Phase 5 writes entry after each session
- Phase 0 reads strategy log to inform search strategy selection

**Depends on:** P2 complete **Triggers:** Improving research quality over time

---

## Step 30: Implement full self-audit (Tier 2-3)

Upgrade self-audit from P0's 6-check summary to the full quality assessment.

### Tier 2 Checks (added to existing 6)

7. **Source diversity** -- sources span 3+ distinct domains/authors
8. **Confidence calibration** -- HIGH claims are genuinely well-supported

### Tier 3 Checks

9. **Temporal validity** -- all sources within domain staleness threshold
10. **Bias detection** -- no single perspective dominates
11. **Actionability** -- recommendations are specific, not generic

### Tier 4 (Exhaustive only)

12. Full 8-dimension quality assessment (from SYNTHESIS.md)
13. Adversarial challenge of key findings

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- Phase 4 expanded with
  tiered checks
- **Modified:** `.claude/skills/deep-research/REFERENCE.md` -- full self-audit
  checklist

**Done when:**

- 13 audit checks defined across 4 tiers
- Tier assignment matches depth level:
  - L1: Tier 1 (checks 1-6)
  - L2: Tier 1-2 (checks 1-8)
  - L3: Tier 1-3 (checks 1-11)
  - L4: Tier 1-4 (checks 1-13)
- `--audit-details` flag shows full tier report
- Summary line still works for default UX

**Depends on:** P0 Phase 4 (baseline self-audit) **Triggers:** Higher research
quality assurance

---

## Step 31: Implement MCP memory entities

Per Decision #12 and SYNTHESIS.md memory architecture, HIGH-confidence durable
insights persist as MCP memory entities for cross-session recall.

### Criteria for Memory Persistence

Only persist claims that are:

- HIGH confidence
- Cross-session relevant (not task-specific)
- Durable (not rapidly changing)

Examples:

- "Library X does not support feature Y" (saves future re-research)
- "Pattern Z is deprecated since v3" (prevents misuse)
- "Domain W requires approach Q" (architectural insight)

### Integration

Use `@modelcontextprotocol/server-memory` MCP server (already in the codebase
per memory `reference_ai_capabilities.md`).

Auto-suggest in Phase 5 "what next?" menu: "Save N HIGH-confidence insights to
memory? [review each / save all / skip]"

**Files:**

- **Modified:** `.claude/skills/deep-research/SKILL.md` -- memory adapter in
  Phase 5
- **Modified:** `.claude/skills/deep-research/REFERENCE.md` -- memory
  persistence criteria

**Done when:**

- Memory persistence criteria defined
- Auto-suggestion in "what next?" menu with claim count
- User reviews each candidate before persistence (guardrail #6)
- MCP memory server invocation documented

**Depends on:** P2 complete **Triggers:** Cross-session research knowledge
accumulation

---

## Step 32: Source reliability tracking

Track which sources produce reliable vs unreliable results over time.

### Source Reputation

```json
{
  "sourceUrl": "string — normalized URL or domain",
  "totalCitations": "number",
  "verifiedCitations": "number — passed verification",
  "failedCitations": "number — failed verification",
  "reliabilityScore": "number 0-1",
  "lastUpdated": "ISO 8601"
}
```

Store in `.research/source-reputation.jsonl`. Consulted during searcher
execution to adjust initial confidence based on source history.

**Files:**

- **Modified:** `.claude/skills/deep-research/REFERENCE.md` -- source reputation
  schema
- **Modified:** `.claude/agents/global/deep-research-searcher.md` -- check
  reputation during confidence assignment

**Done when:**

- Source reputation schema defined
- Searcher checks reputation during confidence assignment
- Reputation updated after verification passes
- Low-reputation sources get automatic confidence downgrade

**Depends on:** P1 (verification exists) **Triggers:** Improving source
selection over time

---

## Step 33: P3 Audit Checkpoint

Run `code-reviewer` agent on all modified files from P3.

**Files to review:**

- `.claude/skills/deep-research/SKILL.md` (modified in steps 28-31)
- `.claude/skills/deep-research/REFERENCE.md` (modified in steps 28-32)
- `.claude/agents/global/deep-research-searcher.md` (modified in step 32)

**Done when:**

- code-reviewer has reviewed all files
- Research management commands tested
- Strategy learning log populates after research session
- Memory persistence tested
- Source reliability tracking tested

**Depends on:** Steps 28-32 **Triggers:** P3 complete; Post-Build audit

---

# Post-Build: Skill Audit

## Step 34: Run `/skill-audit` on the completed skill

Per CLAUDE.md Section 7, run `/skill-audit` as the final step after all phases
are complete.

The skill audit evaluates:

- SKILL.md completeness and format compliance
- Agent definition quality
- Integration contract correctness
- Reference documentation accuracy
- Output format consistency

**Files:**

- **Input:** All `.claude/skills/deep-research/` files + both agent definitions

**Done when:**

- `/skill-audit` passes with no critical findings
- All findings addressed or logged as DEBT
- Skill is production-ready

**Depends on:** Steps 1-33 (all phases complete) **Triggers:** `/deep-research`
is officially available for use

---

# Appendix A: File Inventory

## New Files (P0)

| File                                                 | Type      | Est. Lines | Step |
| ---------------------------------------------------- | --------- | ---------- | ---- |
| `.claude/skills/deep-research/SKILL.md`              | Skill     | 250-350    | 3    |
| `.claude/skills/deep-research/REFERENCE.md`          | Reference | 200-300    | 4    |
| `.claude/agents/global/deep-research-searcher.md`    | Agent     | 600-800    | 5    |
| `.claude/agents/global/deep-research-synthesizer.md` | Agent     | 300-400    | 6    |

## New Files (P1+)

| File                                                   | Type   | Est. Lines | Step |
| ------------------------------------------------------ | ------ | ---------- | ---- |
| `.claude/skills/deep-research/domains/technology.yaml` | Config | ~30        | 26   |
| `.claude/skills/deep-research/domains/academic.yaml`   | Config | ~30        | 26   |
| `.claude/skills/deep-research/domains/business.yaml`   | Config | ~30        | 26   |

## Modified Files

| File                                           | Steps | Phases |
| ---------------------------------------------- | ----- | ------ |
| `.gitignore`                                   | 1     | P0     |
| `.claude/skills/convergence-loop/SKILL.md`     | 14    | P1     |
| `.claude/skills/convergence-loop/REFERENCE.md` | 14    | P1     |
| `.claude/skills/deep-plan/SKILL.md`            | 22    | P2     |
| `.mcp.json`                                    | 16    | P1     |

## Runtime Files (not committed)

| File                                             | Purpose           | Step |
| ------------------------------------------------ | ----------------- | ---- |
| `.claude/state/deep-research.<topic>.state.json` | Session state     | 2    |
| `.research/<topic-slug>/`                        | Research output   | 3    |
| `.research/research-index.jsonl`                 | Topic index       | 15   |
| `.research/strategy-log.jsonl`                   | Strategy learning | 29   |
| `.research/source-reputation.jsonl`              | Source reputation | 32   |

---

# Appendix B: Decision Traceability

Every decision from DECISIONS.md is referenced in the plan:

| Decision # | Topic                                                 | Plan Steps |
| ---------- | ----------------------------------------------------- | ---------- |
| 1          | Skill name `/deep-research`                           | 3          |
| 2          | Plan approval gate always                             | 3, 7       |
| 3          | Contrarian + OTB mandatory ALL levels                 | 3, 10      |
| 4          | 5-level determination model                           | 7          |
| 5          | Floor depth L1 (Exhaustive)                           | 3, 7       |
| 6          | Hybrid searcher (profiles)                            | 5          |
| 7          | Agent allocation `D + 3 + floor(D/5)`                 | 3, 7, 8    |
| 8          | Budget NOT a design consideration                     | 3          |
| 9          | Depth level naming (L1-L4)                            | 3, 4       |
| 10         | Sub-question depth interactive                        | 7          |
| 11         | All agents get Read + Write minimum                   | 5, 6       |
| 12         | MCP integration P0 native, P1+ expansion              | 16         |
| 13         | Cross-model verification (Gemini CLI)                 | 13, 19     |
| 14         | 9 roles: 2 custom agents, 3 CL presets, 4 conditional | 5, 6, 10   |
| 15         | Contrarian/OTB scaling by level                       | 10         |
| 16         | Interactive decomposition level B→C                   | 7          |
| 17         | Priority downstream adapters                          | 21-25      |
| 18         | Self-audit UX summary line                            | 11, 30     |
| 19         | Output location `.research/<topic-slug>/`             | 1, 3       |
| 20         | Resume both automatic + manual                        | 2, 3       |

---

# Appendix C: Parallelization Map

```
P0:
  Step 1 (gitignore)  ─────────────────────────┐
  Step 2 (schema)     ─────────────────────────┤
                                                ├──► Step 3 (SKILL.md)
                                                │    Step 4 (REFERENCE.md)
                                                │         │
                                                │    ┌────┴────┐
                                                │    ▼         ▼
                                                │  Step 5    Step 6
                                                │  (searcher) (synth)
                                                │    │         │
                                                │    └────┬────┘
                                                │         ▼
                                                │    Step 7 (Phase 0)
                                                │         │
                                                │    ┌────┴────┐
                                                │    ▼         ▼
                                                │  Step 8    Step 9
                                                │  (Phase 1)  (Phase 2)
                                                │    └────┬────┘
                                                │         ▼
                                                │    Step 10 (Phase 3)
                                                │         ▼
                                                │    Step 11 (Phase 4)
                                                │         ▼
                                                │    Step 12 (Phase 5)
                                                │         ▼
                                                │    Step 12a (Audit)
                                                │
P1:                                             │
  Step 13 (Gemini)    ──────────────────────────┤
  Step 14 (CL preset) ─────────┐               │
  Step 15 (research index) ────┤ PARALLEL       │
  Step 16 (MCP sources) ──────┤               │
  Step 17 (codebase profile) ──┤               │
  Step 18 (academic profile) ──┘               │
                                ▼               │
  Step 19 (wire verification) ◄── Steps 13,14  │
  Step 20 (P1 audit)                            │
                                                │
P2:                                             │
  Step 21 (adapter contract) ──────────────────┤
                                ▼               │
  Step 22 (deep-plan adapter) ─┐               │
  Step 23 (skill-creator)     ─┤ PARALLEL      │
  Step 24 (GSD adapter)       ─┤               │
  Step 25 (CL adapter)        ─┘               │
  Step 26 (domain modules) ────────────────────┤
  Step 27 (P2 audit)                            │
                                                │
P3:                                             │
  Step 28 (management commands) ───────────────┤
  Step 29 (strategy learning) ─┐               │
  Step 30 (full self-audit)   ─┤ PARALLEL      │
  Step 31 (MCP memory)        ─┘               │
  Step 32 (source reputation) ─────────────────┘
  Step 33 (P3 audit)
  Step 34 (skill-audit)
```

---

## Version History

| Version | Date       | Description                 |
| ------- | ---------- | --------------------------- |
| 1.0     | 2026-03-20 | Initial implementation plan |
