---
name: deep-research
description: >-
  Multi-agent research engine that decomposes questions, dispatches parallel
  searcher agents, synthesizes findings with citations and confidence levels,
  runs mandatory contrarian and outside-the-box challenges, and produces
  structured output for downstream consumption by deep-plan, GSD,
  convergence-loop, and other skills.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Deep Research

Multi-agent research engine that does what a single conversation cannot.
Decomposes questions into sub-questions, dispatches parallel searcher agents,
synthesizes findings with citations and confidence levels, runs mandatory
contrarian and outside-the-box challenges, and produces structured output with
downstream routing.

## Critical Rules (MUST follow)

1. **Always show research plan before executing** — present the decomposition,
   agent allocation, and cost estimate. Wait for user approval. `--auto` flag
   skips approval for trusted/repeated research. (Decision #2)
2. **Contrarian + outside-the-box mandatory at ALL levels** — no exceptions.
   These are not optional quality passes. (Decision #3)
3. **Floor depth is L1 (Exhaustive)** — Quick/Standard/Deep eliminated. If
   someone wants quick, they ask Claude directly. `/deep-research` does what a
   single conversation cannot. (Decision #5)
4. **Write to disk first** — findings must survive crashes. Every agent writes
   its output to `.research/<topic-slug>/` before returning.
5. **State file updated after every state-changing event** — plan approval,
   agent completion, synthesis, challenges, audit. Enables resume after
   compaction or interruption.
6. **Research writes ONLY to `.research/<topic-slug>/`** — never to
   consumer-owned artifacts. Downstream consumers pull from research output.
7. **Agent allocation formula: `D + 3 + floor(D/5)`** — where D = number of
   sub-questions. Dimension-driven, not capped. Budget is a guardrail, not a
   constraint. (Decision #7)

## When to Use

- User invokes `/deep-research` explicitly
- Task requires understanding a domain, technology, or landscape before planning
- Multiple conflicting sources need structured evaluation
- `/deep-plan` Phase 0 reveals the task needs domain research before questions
  can even be asked
- Creating a new skill and domain expertise is needed (via `/skill-creator`)
- GSD project research where thoroughness matters more than speed

## When NOT to Use

- Simple factual questions — just ask Claude directly
- Codebase-only questions — use `Explore` agent or Grep/Glob
- Questions where the user already knows the answer and wants confirmation
- Mid-implementation lookups — use WebSearch/WebFetch/Context7 directly
- Research that must complete in under 2 minutes — this is thorough, not fast

## Routing Guide

| Situation                       | Use                | Why                                    |
| ------------------------------- | ------------------ | -------------------------------------- |
| Domain research before planning | `/deep-research`   | Structured multi-agent investigation   |
| Quick factual lookup            | Ask Claude         | Single-turn, no orchestration needed   |
| Codebase understanding          | `Explore` agent    | Codebase-specific tools                |
| Planning with known domain      | `/deep-plan`       | Discovery-first planning, not research |
| Multi-phase project setup       | `/gsd:new-project` | Project-level with built-in research   |

## Input

**Argument:** Research question or topic, passed as `/deep-research "<topic>"`.

**Flags:**

| Flag              | Default | Effect                                              |
| ----------------- | ------- | --------------------------------------------------- |
| `--depth`         | L1      | Depth level: L1, L2, L3, L4                         |
| `--domain`        | auto    | Override auto-detected domain                       |
| `--auto`          | off     | Skip plan approval gate                             |
| `--audit-details` | off     | Show full self-audit report instead of summary line |

**Output location:** `.research/<topic-slug>/`

---

## Depth Levels

Per Decision #5, L1 (Exhaustive) is the floor. No shallow modes.

| Level | Name               | Typical Agents | Search Rounds | Contrarian                       | OTB                 | Self-Audit         |
| ----- | ------------------ | -------------- | ------------- | -------------------------------- | ------------------- | ------------------ |
| L1    | Exhaustive         | 4-5            | 5-8           | 1 agent (CL preset)              | 1 agent (CL preset) | Summary            |
| L2    | Comprehensive      | 3-4            | 3-5           | 1 agent                          | 1 agent             | Summary            |
| L3    | Investigation      | 5-7            | 5-8           | 2 agents (different strategies)  | 2 agents            | Full               |
| L4    | Deep Investigation | 8-10           | 8+            | 3 agents + red team + pre-mortem | 3 agents            | Full + adversarial |

> **Precedence:** The allocation formula `D + 3 + floor(D/5)` determines actual
> agent count. The "Typical Agents" column shows ranges for common sub-question
> counts. When they conflict, the formula wins. L4 additionally uses agent team
> orchestration when sub-questions are interdependent (Decision #4).

---

## Process Overview

```
PHASE 0: Interactive Decomposition (inline)
  → Classify question type (8 types) + domain detection
  → Start at level B (2-3 rounds Q&A), escalate to C if needed
  → Generate MECE sub-questions
  → Apply allocation formula: D + 3 + floor(D/5) agents
  → Present research plan with cost estimate
  → User approves / modifies / aborts

PHASE 1: Parallel Research (Agent tool → searcher agents)
  → Spawn searcher agents per allocation formula
  → Each gets: sub-question(s), search profile, output path, budget slice
  → Each writes: .research/<topic-slug>/findings/<sub-query>-FINDINGS.md
  → Checkpoint after each agent completes

PHASE 2: Synthesis (Agent tool → synthesizer agent)
  → Spawn synthesizer agent
  → Reads all FINDINGS.md files
  → Writes: RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl, metadata.json

PHASE 3: Mandatory Challenges (convergence-loop presets)
  → Contrarian: challenge consensus, seek disconfirming evidence
  → Outside-the-box: find what structured research missed
  → Both write to .research/<topic-slug>/challenges/

PHASE 4: Self-Audit (inline, depth-dependent)
  → Summary line by default ("Self-audit: 6/6 passed")
  → --audit-details flag for full report

PHASE 5: Presentation + Downstream Routing (inline)
  → Terminal summary (5-10 lines)
  → "What next?" menu with routing options
  → Require acknowledgment (CLAUDE.md guardrail #6)
```

Use phase transition markers: `========== PHASE N: [NAME] ==========`

---

## Phase 0: Interactive Decomposition (MUST)

**Purpose:** Understand the research question deeply before dispatching agents.
This is inline orchestration — no agents spawned yet.

### Step 0.0: Research Index Check (P1+)

Before decomposition, check `.research/research-index.jsonl` for prior research:

1. **Exact topic match** → offer to resume or re-research
2. **Keyword overlap >50%** → surface existing research, ask if user wants to
   build on it or start fresh
3. **No overlap** → proceed normally
4. **Stale research** → flag staleness per domain rules (see REFERENCE.md
   Section 12)

### Step 0.1: Classify Question Type

Classify the research question into one of 8 types (see REFERENCE.md for full
classification guide):

| Type          | Example                                       | Decomposition Strategy        |
| ------------- | --------------------------------------------- | ----------------------------- |
| Factual       | "What is the latest version of Next.js?"      | Direct lookup, verify sources |
| Descriptive   | "How does React Server Components work?"      | Feature survey + examples     |
| Comparative   | "Next.js vs Remix for our use case?"          | Matrix + tradeoffs            |
| Evaluative    | "Is Firebase a good choice for our scale?"    | Criteria-based assessment     |
| Exploratory   | "What are the best practices for WebSockets?" | Landscape survey + patterns   |
| Investigative | "Why is our build time increasing?"           | Hypothesis → evidence         |
| Predictive    | "Will Deno replace Node.js?"                  | Trend analysis + signals      |
| Relational    | "How do auth, billing, and roles interact?"   | Dependency mapping            |

### Step 0.2: Detect Domain

Auto-detect the domain from the question. If confident, proceed. If uncertain,
ask: "I'm detecting this as a [domain] question. Correct, or is there a more
specific domain?"

### Step 0.3: Select Depth Level

Default to L1 (Exhaustive). User can override with `--depth` flag. Present the
depth level and its implications (agent count, search rounds).

### Step 0.4: Interactive Decomposition

Start at **level B** (2-3 rounds of probing questions):

- What is the scope and boundaries of this research?
- What does the user already know? (avoid re-researching known ground)
- What angles matter most? What would make this research actionable?
- Are there specific constraints (technologies, timelines, existing systems)?

**Escalate to level C** (deep-plan-style exhaustive discovery) if:

- Question is multi-domain
- User requests deeper decomposition
- Initial decomposition reveals 8+ sub-dimensions

Batch questions 5-8 per round (per CLAUDE.md guardrail #10).

### Step 0.5: Generate MECE Sub-Questions

From the decomposition, generate Mutually Exclusive, Collectively Exhaustive
sub-questions. Each sub-question gets assigned a search profile:

| Profile  | Tools                          | When                        |
| -------- | ------------------------------ | --------------------------- |
| web      | WebSearch, WebFetch            | General knowledge, trends   |
| docs     | Context7 MCP, WebFetch         | Library/framework specifics |
| codebase | Grep, Glob, Read, Bash         | Internal code questions     |
| academic | WebSearch, WebFetch for papers | Research papers, theory     |

### Step 0.6: Apply Allocation Formula

Calculate agent count: `D + 3 + floor(D/5)` where D = number of sub-questions.

**Worked example:** 7 sub-questions → 7 + 3 + floor(7/5) = 7 + 3 + 1 = 11
agents. Per AGENT_ORCHESTRATION.md: max 4 concurrent agents, so batch into 3
waves.

### Step 0.7: Present Research Plan

Present to user for approval:

```
========== RESEARCH PLAN ==========
Question: [original question]
Type: [classification] | Domain: [detected domain]
Depth: [L1-L4] ([label])

Sub-Questions ([N]):
  SQ-001: [question] (profile: web)
  SQ-002: [question] (profile: docs)
  ...

Agents: [N] searchers + 1 synthesizer + [N] challenge agents
Waves: [N] (max 4 concurrent)

Approve / Modify / Abort?
====================================
```

**If `--auto` flag:** Skip approval, log that auto-mode was used.

### Step 0.8: Update State File

After approval, create state file at
`.claude/state/deep-research.<topic-slug>.state.json` with plan details.

---

## Phase 1: Parallel Research (MUST)

**Purpose:** Dispatch searcher agents to investigate sub-questions in parallel.

### Execution

1. Read approved plan from state file
2. **L4 team check (Decision #4):** If depth is L4 AND sub-questions are
   interdependent (agents need to react to each other's findings), route to
   agent team orchestration — use TeamCreate to spawn a coordinated team where
   agents can share findings via SendMessage. Otherwise, proceed with standard
   wave dispatch below.
3. Group sub-questions into agent assignments
4. Spawn searcher agents in parallel via Agent tool:

   ```
   For each agent assignment:
     Agent(
       subagent_type: "deep-research-searcher",
       prompt: {
         sub_questions: [...],
         search_profile: "web" | "docs",
         output_dir: ".research/<topic>/findings/",
         depth: <depth level>,
         domain: <detected domain>
       }
     )
   ```

5. Respect 4-agent concurrency limit — batch into waves if needed
6. Update state file after each agent completes
7. If critical gaps found and budget allows, spawn additional searcher(s)
8. Proceed to Phase 2 when all searchers complete

### Error Handling

- If an agent fails: log the failure, mark sub-questions as `failed` in state
- If 50%+ of agents fail: stop and present to user with options
- Individual agent failure does not block synthesis — synthesizer works with
  available findings

---

## Phase 2: Synthesis (MUST)

**Purpose:** Combine all findings into a coherent research report.

### Execution

1. Verify all expected FINDINGS.md files exist on disk
2. Spawn synthesizer agent:

   ```
   Agent(
     subagent_type: "deep-research-synthesizer",
     prompt: {
       findings_dir: ".research/<topic>/findings/",
       output_dir: ".research/<topic>/",
       topic: <original question>,
       depth: <depth level>,
       sub_questions: <full list>
     }
   )
   ```

3. Verify output files exist: RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl,
   metadata.json
4. Update state file with synthesis status

### Error Handling

- If findings files are missing: warn synthesizer, proceed with available data
- If synthesizer fails: present error to user, offer re-run or manual synthesis

---

## Phase 3: Mandatory Challenges (MUST)

**Purpose:** Stress-test findings. Contrarian + OTB are mandatory at ALL levels.

### Contrarian Challenge

Spawn a general-purpose agent with the contrarian prompt template from
`.claude/skills/deep-research/REFERENCE.md` Section 8. The agent receives
RESEARCH_OUTPUT.md as input and writes CONTRARIAN.md to
`.research/<topic>/challenges/`. Give the agent WebSearch and WebFetch tools so
it can find disconfirming evidence.

### Outside-the-Box Challenge

Spawn a general-purpose agent with the OTB prompt template from
`.claude/skills/deep-research/REFERENCE.md` Section 9. The agent receives
RESEARCH_OUTPUT.md as input and writes OUTSIDE_THE_BOX.md to
`.research/<topic>/challenges/`. Give the agent WebSearch and WebFetch tools so
it can explore adjacent domains.

### Scaling by Depth Level (Decision #15)

| Level | Contrarian                                  | OTB                 |
| ----- | ------------------------------------------- | ------------------- |
| L1-L2 | 1 agent (CL preset)                         | 1 agent (CL preset) |
| L3    | 2 agents (different adversarial strategies) | 2 agents            |
| L4    | 3 agents + red team pass + pre-mortem       | 3 agents            |

### Cross-Model Verification via Gemini CLI (P1+)

For HIGH-confidence claims, run independent verification via Gemini CLI to
address same-model bias (Decision #13):

```bash
echo '<verification prompt>' | gemini --json 2>/dev/null
```

- **L1:** Verify top 5 HIGH-confidence claims
- **L2:** Verify all HIGH-confidence claims
- **L3-L4:** Full verification suite (all claims above LOW)

If Gemini disagrees with a claim, flag it and include both perspectives. Update
confidence based on cross-model consensus.

**Prerequisite:** `npm install -g @google/gemini-cli` + Google auth (one-time).
If Gemini CLI is not available, skip with a note in the self-audit.

### Convergence-Loop Research-Claims Verification (P1+)

For MEDIUM/LOW confidence claims, invoke `/convergence-loop` with the
`research-claims` preset (6 behaviors: verify-sources, cross-reference,
temporal-check, completeness-audit, bias-check, synthesis-fidelity).

Update claims.jsonl with upgraded/downgraded confidence levels after
verification.

### Re-Synthesis Trigger

If verification changed >20% of claims, re-run the synthesizer to update
RESEARCH_OUTPUT.md with corrected confidence levels and new evidence.

### Post-Challenge

If challenges reveal significant gaps, optionally feed challenge findings back
to synthesizer for incorporation into the final report. Update state file.

---

## Phase 4: Self-Audit (MUST)

**Purpose:** Verify research quality before presenting results.

Run these 6 checks inline (not via a separate agent):

1. **Completeness** — all sub-questions addressed in RESEARCH_OUTPUT.md
2. **Citation density** — every substantive claim has at least one citation
3. **Confidence distribution** — not all HIGH (confidence theater), not all LOW
   (insufficient research)
4. **Source diversity** — not all from same domain/author
5. **Contradiction resolution** — all contradictions surfaced, not silently
   resolved
6. **Challenge integration** — contrarian and OTB findings acknowledged

### Output

- **Default:** `Self-audit: 6/6 passed` or
  `Self-audit: 5/6 passed, 1 warning: [detail]`
- **With `--audit-details`:** Full checklist with evidence for each check

Update state file with audit results.

---

## Phase 5: Presentation + Downstream Routing (MUST)

### Terminal Summary

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

### "What Next?" Menu

Present recognition-over-recall options. Adapter-aware — each option triggers
the corresponding adapter from REFERENCE.md Section 15:

1. "Deepen research on: [top 2-3 suggested sub-topics from gaps]"
2. "Route to /deep-plan for implementation planning" — runs deep-plan adapter,
   generates Research Context section for DIAGNOSIS.md
3. "Route to /skill-creator for skill creation" — runs skill-creator adapter,
   extracts domain patterns for discovery defaults
4. "Route to GSD pipeline" — runs GSD adapter, produces STACK.md/FEATURES.md/
   ARCHITECTURE.md/PITFALLS.md/SUMMARY.md in `.planning/research/`
5. "Verify LOW-confidence claims with /convergence-loop (N claims)" — runs
   convergence-loop adapter, filters claims by confidence < HIGH
6. "Save HIGH-confidence insights to memory (N candidates) (P3+)"
7. "View full report"
8. "Done"

Per CLAUDE.md guardrail #6: require acknowledgment before continuing.

### Raw Artifact Cleanup

Do NOT hard-delete raw artifacts by default:

- **Default:** keep `findings/*.md` and `challenges/*.md` for resume + audit
  provenance
- **Optional (user-confirmed):** archive to `.research/<topic>/archive/`
- Record cleanup action in state file
  (`output.rawArtifacts: "kept" | "archived"`)
- **Always preserve:** RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl,
  metadata.json — these support decision provenance, research memory, overlap
  detection, and `/research-refresh`

### Research Index Entry (P1+)

After completion, append an entry to `.research/research-index.jsonl` (see
REFERENCE.md Section 12 for schema). This enables overlap detection, staleness
tracking, and `/research-recall`.

Update state file to `complete`.

---

## State Management

### State File

Location: `.claude/state/deep-research.<topic-slug>.state.json`

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
        "agentId": "string",
        "findingsPath": "string"
      }
    ],
    "approved": "boolean",
    "approvedAt": "ISO 8601 | null"
  },
  "agents": {
    "searchers": [
      {
        "id": "searcher-1",
        "subQuestions": ["SQ-001"],
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
    "metadataPath": "string | null",
    "rawArtifacts": "kept | archived"
  },
  "verification": {
    "contrarian": { "status": "pending | complete | skipped", "passCount": 0 },
    "outsideTheBox": {
      "status": "pending | complete | skipped",
      "passCount": 0
    },
    "selfAudit": { "status": "pending | complete", "result": "string | null" }
  },
  "errors": [],
  "resumePoint": "string — phase + step identifier for resume"
}
```

### Resume Protocol

**Automatic:** Session-start detects incomplete research via state file. Offers
to resume.

**Manual:** Re-invoke `/deep-research "<same topic>"`. Skill detects existing
state file, skips completed phases, resumes from `resumePoint`.

---

## Output Structure

```
.research/<topic-slug>/
  findings/                          # gitignored — intermediate
    <sub-query-1>-FINDINGS.md
    <sub-query-2>-FINDINGS.md
  challenges/                        # gitignored — intermediate
    CONTRARIAN.md
    OUTSIDE_THE_BOX.md
  RESEARCH_OUTPUT.md                 # retained — human-readable report
  claims.jsonl                       # retained — machine-parseable claims
  sources.jsonl                      # retained — source registry
  metadata.json                      # retained — session metadata + consumer hints
```

### Output Format Schemas

See [REFERENCE.md](./REFERENCE.md) for:

- RESEARCH_OUTPUT.md template
- claims.jsonl record schema
- sources.jsonl record schema
- metadata.json schema
- FINDINGS.md template (for searcher agents)
- Contrarian and OTB prompt templates

---

## Compaction Resilience

- **State file:** `.claude/state/deep-research.<topic-slug>.state.json` —
  updated after every state-changing event
- **Recovery:** On resume, read state file, skip completed phases
- **Topic matching:** State file name derived from topic (lowercase, hyphens).
  If no matching state file exists, start fresh.
- **Artifacts as checkpoints:** FINDINGS.md files, RESEARCH_OUTPUT.md persist
  even if state file is lost
- **Cleanup:** `rm .claude/state/deep-research.<topic-slug>.state.json`
- **List active research:** `ls .claude/state/deep-research.*.state.json`

---

## Integration

- **Neighbors:** `/deep-plan` (consumes research for Phase 0 context),
  `/convergence-loop` (challenge presets + low-confidence claim verification),
  `/skill-creator` (domain research for skill creation), `/gsd:research-phase`
  (structured alternative to gsd-project-researcher)
- **References:** [REFERENCE.md](./REFERENCE.md) (output templates, question
  type classification, prompt templates, schemas)
- **Downstream consumers:** claims.jsonl + sources.jsonl + metadata.json
  consumed by downstream adapters (P2+)

---

## Guard Rails

- **Budget enforcement:** Monitor token usage at 70/85/95/100% thresholds. At
  95%: warn. At 100%: force synthesis with available data.
- **Scope explosion:** If sub-question count exceeds 15, pause: "Research has N
  sub-questions. Continue, scope-reduce, or split into multiple research
  sessions?"
- **Agent failure cascade:** If 50%+ of searcher agents fail, stop and present
  options to user instead of proceeding with partial data.
- **Disengagement:** If user says "skip" or "let's work" mid-research, save
  state and present what's completed vs remaining.

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-03-22 | Initial implementation |
