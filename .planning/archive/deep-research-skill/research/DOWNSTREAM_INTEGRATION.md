# Downstream Integration Architecture

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Status:** DRAFT
**Parent:** `.planning/deep-research-skill/`
<!-- prettier-ignore-end -->

## Executive Summary

The deep-research skill is a **feeder system** whose value is proportional to
the number of downstream consumers it can serve. This document maps every
consumer in the codebase, defines the output contracts between deep-research and
each consumer, and designs the handoff protocols that connect them.

**Core integration principles:**

1. **Universal format, consumer-specific adapters.** Deep-research produces one
   canonical output format. Adapter logic transforms it for each consumer. The
   skill never writes directly into consumer-owned artifacts.
2. **Research produces inputs, not outputs.** Deep-research writes to its own
   output directory. Consumers pull from there. Deep-research never overwrites
   DIAGNOSIS.md, PLAN.md, MASTER_DEBT.jsonl, or any consumer-owned file.
3. **Confidence is first-class.** Every claim, finding, and recommendation
   carries an explicit confidence level (HIGH/MEDIUM/LOW). Consumers use
   confidence to gate automated vs manual handoff.
4. **Handoff requires acknowledgment.** No fire-and-forget. Every handoff
   (automatic or manual) forces the user to acknowledge or act (per CLAUDE.md
   guardrail #6).

**Consumer count:** 9 primary consumers identified, with 4 secondary consumers.

---

## Consumer Map

### A. `/deep-plan` (Phase 0 Diagnosis)

- **What it needs:** Codebase context, existing patterns, ROADMAP alignment,
  reframe assessment, and verified claims about code state. Currently Phase 0
  does its own exploration but has NO web/domain research capability.
- **Current format:** DIAGNOSIS.md template (ROADMAP alignment, relevant
  existing systems table, reframe check, verify commands for code-state claims).
- **Integration point:** Deep-research output feeds Phase 0 BEFORE discovery
  questions begin. Research findings become the evidence base that makes Phase 0
  diagnosis more accurate and questions more targeted.
- **Handoff type:** User-initiated ("use this research for /deep-plan") or
  automatic when `/deep-plan` detects a research artifact at the plan output
  location.

**Relationship analysis:** Deep-research does NOT replace Phase 0. Phase 0 is
codebase-focused (local patterns, ROADMAP check, reframe). Deep-research is
domain-focused (external ecosystem, alternatives, pitfalls). They are
complementary:

| Concern                 | Phase 0 (codebase) | Deep-research (domain) |
| ----------------------- | ------------------ | ---------------------- |
| Existing patterns       | YES                | no                     |
| ROADMAP alignment       | YES                | no                     |
| Reframe check           | YES                | informed by research   |
| Domain ecosystem        | no                 | YES                    |
| Technology landscape    | no                 | YES                    |
| External pitfalls       | no                 | YES                    |
| Best practices / SOTA   | no                 | YES                    |
| Competitor analysis     | no                 | YES                    |
| Code-state verification | YES                | no                     |
| Claim confidence levels | limited            | YES                    |

**What changes in Phase 0 when research exists:** DIAGNOSIS.md gains a new
section `## Research Context` that references the research output directory and
summarizes key findings relevant to the diagnosis. Discovery questions in Phase
1 can reference research findings ("Research found X is the standard approach.
Use it, or override?").

**Adapter logic:**

```
Research SUMMARY.md → Extract:
  - Domain ecosystem summary (2-3 lines)
  - Key recommendations with confidence
  - Pitfalls relevant to the task
→ Inject into DIAGNOSIS.md as "## Research Context" section
→ Feed into Phase 1 question defaults ("Research recommends X because Y")
```

---

### B. `/skill-creator` (Phase 1 Context + Phase 2 Discovery)

- **What it needs:** Domain knowledge about the problem space the skill
  addresses, existing patterns in the codebase, design decisions from comparable
  systems, and conventions to follow.
- **Current format:** Phase 1 scans `.claude/skills/` for neighbors and reads
  CLAUDE.md/ROADMAP.md. Phase 2 asks 12+ discovery questions across 6
  categories.
- **Integration point:** Research output feeds Phase 1 Context Gathering and
  enriches Phase 2 discovery with informed defaults. Research findings about
  domain patterns become recommended defaults for discovery questions.
- **Handoff type:** User-initiated ("create a skill from this research").

**Relationship analysis:** Skill-creator's Phase 1 is local-only (codebase scan,
neighbor analysis). Deep-research adds external domain expertise. If you are
creating a skill for a domain you have not worked with (e.g., TDD for a new
framework), research provides the knowledge base that makes discovery questions
answerable.

**Adapter logic:**

```
Research output → Extract:
  - Domain patterns → inform "Architecture & Structure" questions
  - Existing tool analysis → inform "Scope & Scale" questions
  - Pitfalls → inform "Guard Rails" section of created skill
  - Best practices → inform "Critical Rules" section
→ Present as pre-populated defaults in Phase 2 Discovery
```

---

### C. Brainstorming (Process Skill)

- **What it needs:** Evidence base for evaluating design options. Brainstorming
  explores possibility space; research provides the reality constraints.
- **Current format:** No dedicated brainstorming skill exists in
  `.claude/skills/`. Brainstorming is referenced as a "process skill" in
  `using-superpowers` SKILL.md (priority #1 before implementation skills), and
  `/deep-plan` SKILL.md says to "use a brainstorming approach first, then
  /deep-plan to plan the chosen approach."
- **Integration point:** Research output serves as the evidence base for
  brainstorming sessions. When exploring "should we use X or Y?", research
  provides the comparison matrix, pitfall analysis, and ecosystem context.
- **Handoff type:** User-initiated ("brainstorm options using this research").

**NOTE:** Since no formal brainstorming skill exists, this integration is
aspirational. If/when a brainstorming skill is created via `/skill-creator`, it
SHOULD consume research outputs. The integration contract defined here serves as
a design input for that future skill.

**Adapter logic:**

```
Research output → Extract:
  - Comparison matrices → decision criteria for brainstorming
  - Alternatives considered → option space
  - Pitfalls → constraints on viable options
  - Confidence levels → weight for each option's evidence
→ Present as structured input to brainstorming session
```

---

### D. GSD Pipeline (Project Researcher + Phase Researcher + Roadmapper + Planner)

- **What it needs:** The GSD pipeline has two research agents
  (`gsd-project-researcher` and `gsd-phase-researcher`) that produce output in a
  specific multi-file format consumed by `gsd-roadmapper` and `gsd-planner`.
- **Current format:**
  - Project researcher writes to `.planning/research/`: SUMMARY.md, STACK.md,
    FEATURES.md, ARCHITECTURE.md, PITFALLS.md
  - Phase researcher writes to `.planning/phases/XX-name/{phase}-RESEARCH.md`
    with sections: Summary, Standard Stack, Architecture Patterns, Don't
    Hand-Roll, Common Pitfalls, Code Examples, Sources
  - Roadmapper consumes SUMMARY.md "Implications for Roadmap" section
  - Planner consumes RESEARCH.md sections directly (Standard Stack, Architecture
    Patterns, Don't Hand-Roll, Common Pitfalls, Code Examples)
- **Integration point:** Deep-research can produce GSD-compatible output files
  as an adapter mode. When research is destined for GSD consumption, the adapter
  transforms the universal format into the exact file structure GSD expects.
- **Handoff type:** Hybrid. Automatic adapter when user says "start GSD with
  this research." Manual when user runs `/gsd:new-project` and research already
  exists in `.planning/research/`.

**Should deep-research REPLACE gsd-project-researcher and
gsd-phase-researcher?**

**No.** The GSD researchers are tightly coupled to the GSD pipeline's execution
model (spawned by orchestrators, return structured results, operate within GSD's
phase/plan/wave paradigm). Deep-research is a general-purpose research tool.
However, deep-research CAN feed into GSD researchers, reducing their workload:

| Scenario                    | Flow                                           |
| --------------------------- | ---------------------------------------------- |
| Research done BEFORE GSD    | deep-research output → GSD researcher loads it |
| Research done DURING GSD    | GSD researcher runs normally (no change)       |
| Research + GSD same session | deep-research → adapter → GSD files directly   |

**Adapter logic (project-level):**

```
Research universal output → Transform to GSD format:
  - research/claims[category=stack]     → STACK.md
  - research/claims[category=features]  → FEATURES.md
  - research/claims[category=arch]      → ARCHITECTURE.md
  - research/claims[category=pitfalls]  → PITFALLS.md
  - research/executive_summary          → SUMMARY.md (with "Implications for Roadmap")
→ Write to .planning/research/ (GSD's expected location)
```

**Adapter logic (phase-level):**

```
Research universal output (scoped to phase) → Transform to:
  - Standard Stack table
  - Architecture Patterns section
  - Don't Hand-Roll table
  - Common Pitfalls section
  - Code Examples (from verified sources)
→ Write to .planning/phases/XX-name/{phase}-RESEARCH.md
```

---

### E. `/convergence-loop` (Claim Verification)

- **What it needs:** A set of testable assertions (claims) with sources,
  structured for multi-pass agent verification. Claims must have: (1) the
  assertion, (2) the source it references.
- **Current format:** Inline text, file path, JSONL/JSON, or conversation
  context. Claims get T20 tallied (Confirmed/Corrected/Extended/New) across 2-5
  passes.
- **Integration point:** Research findings ARE claims about reality. Every
  research claim with confidence < HIGH is a candidate for convergence-loop
  verification. Research output already includes confidence levels, making it
  natural to route LOW/MEDIUM claims to verification.
- **Handoff type:** Automatic for LOW confidence claims (prompt user: "Research
  produced N low-confidence claims. Verify with /convergence-loop?"). Manual for
  MEDIUM/HIGH claims.

**Relationship analysis:** This is bidirectional. Research produces claims;
convergence-loop verifies them. After verification, corrected claims feed back
into the research output (updating confidence and content).

**Adapter logic:**

```
Research claims → Filter by confidence < HIGH → Format as:
  [
    { "id": "R-001", "claim": "Library X supports feature Y",
      "source": "WebSearch + official docs", "confidence": "MEDIUM" },
    { "id": "R-002", "claim": "Pattern Z is deprecated since v3",
      "source": "WebSearch only", "confidence": "LOW" }
  ]
→ Pass to /convergence-loop as input claims
→ On convergence: update research output with corrected claims + upgraded confidence
```

---

### F. TDMS (Technical Debt Management System)

- **What it needs:** JSONL records conforming to the audit-schema.json schema
  with fields: id, source_id, title, severity (S0-S3), category (from
  validCategories), type (from validTypes), status, effort (E0-E3), file, line,
  description, recommendation, content_hash.
- **Current format:** MASTER_DEBT.jsonl entries. Intake via
  `scripts/debt/intake-audit.js` (audit JSONL) or
  `scripts/debt/intake-manual.js` (CLI arguments).
- **Integration point:** Research may discover tech debt (deprecated
  dependencies, security vulnerabilities, architectural anti-patterns in
  existing code). These findings should route to TDMS rather than being siloed
  in research output.
- **Handoff type:** Semi-automatic. Research flags potential debt items. Skill
  presents them: "Research found N potential tech debt items. Route to TDMS?
  [review each / route all / skip]". User acknowledges per guardrail #6.

**CRITICAL:** Research must NOT write directly to MASTER_DEBT.jsonl (overwrite
hazard per memory `reference_tdms_systems.md`). Instead, produce a JSONL file
that `intake-audit.js` can consume.

**Adapter logic:**

```
Research claims[type=debt] → Transform to TDMS intake format:
  {
    "source_id": "deep-research:{topic}:{claim-id}",
    "file": "[file path if applicable]",
    "line": 0,
    "title": "[debt item title]",
    "severity": "[S0-S3 mapped from research severity]",
    "category": "[mapped to validCategories]",
    "type": "tech-debt",
    "description": "[from research finding]",
    "recommendation": "[from research recommendation]",
    "effort": "[E0-E3 estimate]",
    "status": "NEW"
  }
→ Write to .planning/deep-research-skill/research/debt-intake.jsonl
→ User runs: node scripts/debt/intake-audit.js debt-intake.jsonl
```

**Severity mapping:**

| Research Confidence | Research Severity | TDMS Severity |
| ------------------- | ----------------- | ------------- |
| HIGH                | Critical          | S0            |
| HIGH                | High              | S1            |
| MEDIUM              | Medium            | S2            |
| LOW                 | any               | S3            |

---

### G. Memory System

- **What it needs:** Markdown files with YAML frontmatter (name, description,
  type, status) containing concise, durable insights that persist across
  sessions. Located in
  `~/.claude/projects/C--Users-jbell--local-bin-sonash-v0/memory/`.
- **Current format:** Frontmatter block + bullet-point content. Types: project,
  reference, feedback. Status: active.
- **Integration point:** Research conclusions that are durable (not
  session-specific) should persist to memory. Examples: "Library X does not
  support feature Y" (saves future sessions from re-researching), "Domain Z
  requires approach W" (architectural insight), "Pattern Q is deprecated since
  v3" (prevents future use).
- **Handoff type:** Automatic suggestion after research completion. "Research
  produced N durable insights. Save to memory? [review each / save all / skip]".

**Which research outputs qualify for memory?**

| Qualifies                             | Does NOT Qualify                   |
| ------------------------------------- | ---------------------------------- |
| Durable technology decisions          | Session-specific findings          |
| Verified architectural patterns       | Unverified claims (LOW confidence) |
| Domain constraints (e.g., API limits) | Comparison matrices (too detailed) |
| "X is impossible/deprecated" findings | Full research reports (too large)  |
| Cross-session relevant pitfalls       | Task-specific recommendations      |

**Adapter logic:**

```
Research claims[confidence=HIGH, durability=cross-session] → Format as:
  ---
  name: research_{topic_slug}_{finding_slug}
  description: [one-line summary]
  type: reference
  status: active
  ---

  - [Finding 1 in bullet format]
  - [Finding 2 in bullet format]
  - Source: [research date, confidence level]
→ Write to memory directory
→ Register in MEMORY.md under ## Reference section
```

---

### H. Decision Records (DECISIONS.md)

- **What it needs:** Structured decision table with columns: #, Decision,
  Choice, Rationale. One row per decision, numbered. Choice must be specific
  (never "TBD").
- **Current format:** deep-plan DECISIONS.md template (from REFERENCE.md).
- **Integration point:** When research produces a decisive finding (clear best
  option with HIGH confidence), it can output a decision-ready artifact. This
  pre-populates decisions for downstream `/deep-plan` runs.
- **Handoff type:** Manual only. Research produces decision CANDIDATES, not
  decisions. Decisions require user approval (CLAUDE.md guardrail #2: "Never
  implement without explicit approval").

**CRITICAL CONSTRAINT:** Research must NEVER produce final decisions. It
produces decision candidates with evidence. The user or `/deep-plan` Phase 2
makes the actual decision.

**Adapter logic:**

```
Research claims[decisive=true, confidence=HIGH] → Format as:
  ## Research-Informed Decision Candidates

  | # | Decision | Recommended Choice | Evidence | Confidence | Alternatives |
  |---|----------|--------------------|----------|------------|--------------|
  | 1 | [label]  | [recommended]      | [why]    | HIGH       | [rejected]   |

→ Write to research output directory as DECISION_CANDIDATES.md
→ Deep-plan Phase 2 references this when compiling DECISIONS.md
→ User confirms or overrides each candidate
```

---

### I. Other Consumers

#### `code-reviewer` Agent

- **What it needs:** Security findings, domain-specific review criteria.
- **Integration point:** Security research findings become additional review
  criteria. If research identifies a vulnerability pattern, code-reviewer should
  check for it.
- **Handoff type:** Manual (user adds research-informed criteria to review
  scope).
- **Adapter:** Extract security claims from research, format as review checklist
  items.

#### `security-auditor` Agent

- **What it needs:** Known vulnerability patterns, dependency risks,
  architecture-level security concerns.
- **Integration point:** Security-focused research directly informs audit scope.
- **Handoff type:** Manual (user provides research context when invoking audit).
- **Adapter:** Extract security-category claims, format as audit scope items.

#### `documentation-expert` Agent

- **What it needs:** Domain context for writing accurate documentation.
- **Integration point:** Research provides the factual basis for documentation.
- **Handoff type:** Manual (user references research when requesting docs).
- **Adapter:** No transformation needed; research SUMMARY.md is human-readable.

#### PR Descriptions

- **What it needs:** Context about why decisions were made.
- **Integration point:** Research references in "## Context" section of PR body.
- **Handoff type:** Manual (user/skill includes research link in PR).
- **Adapter:** Extract key decisions and their rationale, format as 2-3 bullet
  points.

#### SESSION_CONTEXT.md

- **What it needs:** Brief summary of session work for next-session handoff.
- **Integration point:** `/session-end` includes research topic in session
  summary.
- **Handoff type:** Automatic (session-end already captures session activity).
- **Adapter:** One-line summary: "Deep-research: {topic} — {N} claims, {M} HIGH
  confidence. Output: {path}."

---

## Universal Research Output Format

All consumers parse from one canonical format. This is the contract that
deep-research MUST produce regardless of research type.

### File Structure

```
.planning/{topic-slug}/research/   (or user-specified location)
  RESEARCH_OUTPUT.md        # Human-readable report (primary artifact)
  claims.jsonl              # Machine-parseable structured claims
  sources.jsonl             # Source registry with verification status
  metadata.json             # Research session metadata
```

### RESEARCH_OUTPUT.md (Human-Readable)

```markdown
# Deep Research: {Topic}

**Researched:** {date} **Domain:** {domain} **Overall Confidence:**
{HIGH/MEDIUM/LOW} **Claims:** {total} ({high} HIGH, {medium} MEDIUM, {low} LOW)
**Sources:** {total} ({verified} verified, {unverified} unverified)

## Executive Summary

[3-5 paragraph synthesis of all findings]

**Primary recommendation:** [one-liner actionable guidance]

## Key Findings

### Finding 1: {Title}

**Claim:** {Testable assertion} **Confidence:** {HIGH/MEDIUM/LOW} **Evidence:**
{Supporting evidence with source references} **Implications:** {What this means
for downstream consumers}

### Finding 2: {Title}

...

## Technology Landscape

[Stack analysis, alternatives, recommendations]

## Architecture Patterns

[Recommended patterns, anti-patterns, examples]

## Pitfalls and Risks

[Domain-specific pitfalls with prevention strategies]

## Open Questions

[Unresolved items with recommended next steps]

## Decision Candidates

[Research-informed recommendations — NOT final decisions]

| #   | Decision | Recommended | Evidence | Confidence | Alternatives |
| --- | -------- | ----------- | -------- | ---------- | ------------ |

## Sources

### Primary (HIGH confidence)

- [source with URL and verification status]

### Secondary (MEDIUM confidence)

- [source with attribution]

### Tertiary (LOW confidence)

- [source flagged for validation]

## Metadata

**Research agents used:** {count} **Passes completed:** {count} **Convergence
status:** {CONVERGED/NOT_CONVERGED/PARTIAL} **Duration:** {estimate} **Valid
until:** {date — 7 days for fast-moving, 30 for stable}
```

### claims.jsonl (Machine-Parseable)

Each line is one claim:

```json
{
  "id": "R-001",
  "category": "stack|architecture|pitfall|feature|security|debt|decision",
  "claim": "Library X supports feature Y as of v3.2",
  "confidence": "HIGH|MEDIUM|LOW",
  "source_ids": ["S-001", "S-003"],
  "evidence": "Context7 docs confirm, official changelog v3.2 release notes",
  "verified": true,
  "verification_method": "context7|web_fetch|web_search|codebase|convergence_loop",
  "implications": "Can use native feature instead of custom implementation",
  "decisive": false,
  "debt_candidate": false,
  "memory_candidate": false,
  "tags": ["library-x", "feature-y"],
  "created": "2026-03-20T10:00:00Z",
  "updated": "2026-03-20T12:00:00Z"
}
```

**Required fields:** id, category, claim, confidence, source_ids, evidence,
verified.

**Category semantics:**

| Category       | Description                        | Downstream consumers       |
| -------------- | ---------------------------------- | -------------------------- |
| `stack`        | Technology/library recommendations | GSD (STACK.md), deep-plan  |
| `architecture` | System structure patterns          | GSD (ARCHITECTURE.md)      |
| `pitfall`      | Domain-specific risks              | GSD (PITFALLS.md), planner |
| `feature`      | Feature landscape analysis         | GSD (FEATURES.md)          |
| `security`     | Security findings                  | security-auditor, reviewer |
| `debt`         | Tech debt discoveries              | TDMS                       |
| `decision`     | Decision-ready recommendations     | deep-plan, DECISIONS.md    |

**Boolean flags for routing:**

| Flag               | When true                               | Routes to           |
| ------------------ | --------------------------------------- | ------------------- |
| `decisive`         | Clear best option, HIGH confidence      | Decision candidates |
| `debt_candidate`   | Finding indicates tech debt             | TDMS intake         |
| `memory_candidate` | Durable insight, cross-session relevant | Memory system       |

### sources.jsonl

Each line is one source:

```json
{
  "id": "S-001",
  "type": "context7|official_docs|web_search|web_fetch|codebase|training",
  "url": "https://...",
  "title": "Library X v3.2 Release Notes",
  "accessed": "2026-03-20T10:15:00Z",
  "confidence": "HIGH|MEDIUM|LOW",
  "verified": true,
  "verification_chain": ["context7 → official docs crossref"],
  "publication_date": "2026-02-15"
}
```

### metadata.json

```json
{
  "topic": "deep-research topic slug",
  "started": "2026-03-20T10:00:00Z",
  "completed": "2026-03-20T12:00:00Z",
  "status": "complete|in_progress|paused",
  "agents_used": 4,
  "passes_completed": 3,
  "convergence": "CONVERGED|NOT_CONVERGED|PARTIAL",
  "claims_total": 24,
  "claims_high": 15,
  "claims_medium": 7,
  "claims_low": 2,
  "sources_total": 18,
  "sources_verified": 14,
  "output_location": ".planning/{topic}/research/",
  "consumer_hints": {
    "gsd_compatible": true,
    "deep_plan_compatible": true,
    "tdms_debt_items": 3,
    "memory_candidates": 5,
    "decision_candidates": 4
  }
}
```

---

## Consumer-Specific Adapters

Each adapter transforms the universal output into the format a specific consumer
expects. Adapters are invoked explicitly (user chooses) or automatically (based
on `consumer_hints` in metadata.json).

### Adapter: deep-plan

```
Input:  claims.jsonl + RESEARCH_OUTPUT.md
Output: "## Research Context" section for DIAGNOSIS.md
        + enriched defaults for Phase 1 discovery questions

Transform:
  1. Extract executive summary (3 lines max)
  2. Extract claims[decisive=true] → decision candidates for Phase 2
  3. Extract claims[category=pitfall] → guard rail inputs
  4. Extract claims[category=architecture] → structure recommendations
  5. Format as markdown section insertable into DIAGNOSIS.md
```

**Automation potential:** HIGH. Can be automated as a post-research step. When
`/deep-plan` starts and detects research output at the plan location, it reads
and integrates automatically.

### Adapter: GSD (project-level)

```
Input:  claims.jsonl + RESEARCH_OUTPUT.md
Output: .planning/research/SUMMARY.md
        .planning/research/STACK.md
        .planning/research/FEATURES.md
        .planning/research/ARCHITECTURE.md
        .planning/research/PITFALLS.md

Transform:
  1. Filter claims by category
  2. Format each category into GSD's expected template
  3. Generate SUMMARY.md with "Implications for Roadmap" section
  4. Write confidence assessment table
  5. Write sources section per file
```

**Automation potential:** HIGH. Deterministic category-to-file mapping. Could be
a script: `research-to-gsd.js`.

### Adapter: GSD (phase-level)

```
Input:  claims.jsonl (scoped to phase domain)
Output: .planning/phases/XX-name/{phase}-RESEARCH.md

Transform:
  1. Filter claims relevant to phase domain
  2. Format into RESEARCH.md template:
     - Standard Stack (from stack claims)
     - Architecture Patterns (from architecture claims)
     - Don't Hand-Roll (from pitfall/stack claims)
     - Common Pitfalls (from pitfall claims)
     - Code Examples (from verified code patterns)
  3. Include source hierarchy (Primary/Secondary/Tertiary)
  4. Add confidence breakdown metadata
```

**Automation potential:** MEDIUM. Requires domain-scoping logic to filter claims
for a specific phase.

### Adapter: convergence-loop

```
Input:  claims.jsonl (filtered: confidence < HIGH)
Output: Claims set formatted for /convergence-loop input

Transform:
  1. Filter claims where confidence != HIGH
  2. Format as convergence-loop input:
     - claim text + source reference per claim
     - Suggest preset: "quick" for <10 claims, "standard" for 10-50
  3. Return convergence results → update claims.jsonl confidence
```

**Automation potential:** HIGH for filtering and formatting. Convergence-loop
execution itself is interactive (user gates).

### Adapter: TDMS

```
Input:  claims.jsonl (filtered: debt_candidate=true)
Output: debt-intake.jsonl (TDMS intake format)

Transform:
  1. Filter claims where debt_candidate=true
  2. Map fields:
     - claim → title + description
     - source_ids → source_id ("deep-research:{topic}:{id}")
     - confidence → severity (see mapping table above)
     - category → map to TDMS validCategories
  3. Generate content_hash per item
  4. Write as TDMS-compatible JSONL
```

**Automation potential:** HIGH. Deterministic field mapping. Could be a script:
`research-to-tdms.js`.

### Adapter: Memory

```
Input:  claims.jsonl (filtered: memory_candidate=true, confidence=HIGH)
Output: Memory file(s) in ~/.claude/projects/.../memory/

Transform:
  1. Filter claims where memory_candidate=true AND confidence=HIGH
  2. Group by topic/domain
  3. Format as memory file:
     - YAML frontmatter (name, description, type: reference, status: active)
     - Bullet-point content
  4. Update MEMORY.md index
```

**Automation potential:** MEDIUM. Memory file creation is automatable, but
MEMORY.md index update requires reading the current index and inserting in the
correct section.

### Adapter: Decision Candidates

```
Input:  claims.jsonl (filtered: decisive=true, confidence=HIGH)
Output: DECISION_CANDIDATES.md

Transform:
  1. Filter claims where decisive=true
  2. Format as decision table:
     - # | Decision | Recommended Choice | Evidence | Confidence | Alternatives
  3. Write to research output directory
```

**Automation potential:** HIGH. Deterministic filtering and formatting.

---

## Handoff Protocols

### Automatic Handoffs (System-Initiated)

These handoffs are triggered automatically by the research completion flow. Each
MUST force user acknowledgment (guardrail #6).

| Trigger                                    | Action                                | User Gate                                          |
| ------------------------------------------ | ------------------------------------- | -------------------------------------------------- |
| Research has claims[confidence=LOW]        | Suggest convergence-loop verification | "Verify N low-confidence claims? [Y/skip]"         |
| Research has claims[debt_candidate]        | Suggest TDMS routing                  | "Route N debt items to TDMS? [review/all/skip]"    |
| Research has claims[memory_candidate]      | Suggest memory persistence            | "Save N durable insights to memory? [review/skip]" |
| Research has claims[decisive]              | Surface decision candidates           | "N decisions ready. Review? [Y/defer]"             |
| `/deep-plan` starts, research exists       | Load research context into Phase 0    | Presented in DIAGNOSIS.md for user review          |
| `/gsd:new-project` starts, research exists | Load research into project researcher | Research findings noted in SUMMARY.md              |

**Completion prompt template:**

```
Research complete: {topic}
- {total} claims ({high} HIGH, {medium} MEDIUM, {low} LOW)
- {decisive_count} decision candidates ready
- {debt_count} potential tech debt items
- {memory_count} durable insights for memory

Recommended next actions:
1. {if low_count > 0} Verify {low_count} low-confidence claims → /convergence-loop
2. {if debt_count > 0} Route {debt_count} debt items → TDMS
3. {if memory_count > 0} Save {memory_count} insights → memory
4. {if decisive_count > 0} Review {decisive_count} decision candidates

Which actions? [1,2,3,4 / all / skip / custom]
```

### User-Initiated Handoffs

These handoffs require explicit user invocation.

| User Says                           | Action                                                |
| ----------------------------------- | ----------------------------------------------------- |
| "use this research for /deep-plan"  | Run deep-plan adapter, inject into Phase 0            |
| "create a skill from this research" | Run skill-creator adapter, feed Phase 1 + 2           |
| "start GSD with this research"      | Run GSD project adapter, write to .planning/research/ |
| "plan this phase using research"    | Run GSD phase adapter, write RESEARCH.md              |
| "verify the research claims"        | Run convergence-loop adapter, start verification      |
| "add research debt to TDMS"         | Run TDMS adapter, produce intake JSONL                |
| "save research insights to memory"  | Run memory adapter, write memory files                |
| "use research for PR description"   | Extract key decisions, format as PR context           |

### Continuation Patterns

| Scenario                                 | Protocol                                                    |
| ---------------------------------------- | ----------------------------------------------------------- |
| Research paused mid-session              | State saved to `.claude/state/deep-research.{topic}.json`   |
| Research resumed later                   | Re-invoke skill, state file detected, resume from last pass |
| Research complete, picked up weeks later | Read metadata.json `valid_until`, warn if stale             |
| Research feeds Phase 0 across sessions   | DIAGNOSIS.md references research path; research persists    |
| Research updated after convergence-loop  | claims.jsonl updated in place, metadata.json refreshed      |

---

## Integration Architecture Diagram

```
                        +-------------------+
                        |  deep-research    |
                        |  skill            |
                        +--------+----------+
                                 |
                    produces universal output
                                 |
                    +------------+------------+
                    |                         |
              claims.jsonl          RESEARCH_OUTPUT.md
              sources.jsonl              (human-readable)
              metadata.json
                    |
        +-----------+-----------+-----------+-----------+
        |           |           |           |           |
   [decisive]  [debt]     [low conf]  [memory]    [all claims]
        |           |           |           |           |
        v           v           v           v           v
  +-----------+ +-------+ +---------+ +--------+ +----------+
  | Decision  | | TDMS  | | Converg.| | Memory | | Consumer |
  | Candidates| | Intake| | Loop   | | System | | Adapters |
  +-----------+ +-------+ +---------+ +--------+ +----------+
        |           |           |           |      |    |    |
        v           v           |           v      v    v    v
  DECISIONS.md  MASTER_     corrected    memory  GSD  deep  skill-
  (via deep-   DEBT.jsonl   claims →     files   files plan  creator
   plan P2)   (via intake)  update               (5)  DIAG  defaults
                            claims.jsonl               .md
```

**Data flow rules:**

1. Deep-research writes ONLY to its own output directory
2. Adapters read from research output, write to consumer-expected locations
3. Consumers never read claims.jsonl directly (adapters mediate)
4. RESEARCH_OUTPUT.md is human-readable; claims.jsonl is machine-parseable
5. metadata.json consumer_hints enable automatic adapter suggestions

---

## Anti-Patterns

### 1. Research output in a format no consumer can parse

**Problem:** Research produces prose-only output without structured data.
Consumers need specific formats (JSONL for TDMS, tables for GSD, frontmatter for
memory).

**Prevention:** Always produce both RESEARCH_OUTPUT.md (human-readable) AND
claims.jsonl (machine-parseable). The universal format is the contract.

### 2. Research siloed in files nobody references

**Problem:** Research artifacts sit in `.planning/research/` and are never
consumed. No handoff prompt, no integration, wasted effort.

**Prevention:** Mandatory completion prompt that surfaces all downstream
options. metadata.json consumer_hints make it impossible to miss routing
opportunities.

### 3. Research duplicating what consumers will discover themselves

**Problem:** Research investigates things that Phase 0 or GSD researcher would
discover anyway (codebase patterns, existing conventions, ROADMAP alignment).

**Prevention:** Deep-research focuses on EXTERNAL domain knowledge (ecosystem,
alternatives, pitfalls, SOTA). Codebase-internal discovery remains with
consumers (deep-plan Phase 0, skill-creator Phase 1, GSD researchers).

### 4. Research producing decisions without user approval

**Problem:** Research claims "Use library X" as a decision. Violates CLAUDE.md
guardrail #2 ("Never implement without explicit approval").

**Prevention:** Research produces DECISION_CANDIDATES.md, not DECISIONS.md.
Every candidate requires user confirmation. The word "recommended" appears,
never "decided."

### 5. Research modifying consumer artifacts directly

**Problem:** Research writes directly to DIAGNOSIS.md, MASTER_DEBT.jsonl,
PLAN.md, or memory files. Creates ownership confusion, overwrite hazards, and
unexpected modifications.

**Prevention:** Research writes to its own directory only. Adapters mediate all
cross-boundary writes. Adapters are explicitly invoked (automatic or
user-initiated), never silent.

### 6. Stale research consumed as current

**Problem:** Research from weeks ago consumed by a new planning session without
freshness check. Domain may have changed.

**Prevention:** metadata.json includes `valid_until` date. Consumers check
staleness before loading. Stale research triggers warning: "Research is {N} days
old (valid_until: {date}). Re-run or proceed with stale data?"

### 7. Research confidence inflation

**Problem:** LOW confidence claims treated as HIGH because the confidence field
is ignored downstream.

**Prevention:** Adapters propagate confidence. TDMS adapter maps confidence to
severity. Decision candidate adapter only includes HIGH confidence decisive
claims. Memory adapter only persists HIGH confidence durable claims.

### 8. Fire-and-forget handoffs

**Problem:** Research auto-routes debt to TDMS without user seeing it. Violates
guardrail #6 ("All passive surfacing must force acknowledgment").

**Prevention:** Every automatic handoff includes a user gate. The completion
prompt is the acknowledgment mechanism. No adapter runs without user saying
"yes" or selecting an option.

---

## Design Recommendations

### R1: Implement adapters as skill phases, not external scripts

Adapters should be phases within the deep-research skill workflow, not
standalone scripts. This keeps the transformation logic co-located with the
research logic and allows the skill to present the completion prompt with full
context.

**Exception:** GSD and TDMS adapters MAY also exist as standalone scripts
(`research-to-gsd.js`, `research-to-tdms.js`) for use outside the skill context.

### R2: claims.jsonl is the integration backbone

All machine-to-machine integration flows through claims.jsonl. The
human-readable RESEARCH_OUTPUT.md is for user consumption and PR references. If
a consumer needs structured data, it comes from claims.jsonl via an adapter.

### R3: Bidirectional convergence-loop integration

Research → convergence-loop (verify claims) and convergence-loop → research
(update claims) should be a tight loop. After verification, claims.jsonl is
updated in place with corrected claims and upgraded confidence. This makes
subsequent adapter runs produce higher-quality output.

### R4: GSD adapter should be the first implemented

The GSD pipeline is the most structured consumer with the most specific format
requirements. Getting the GSD adapter right validates the universal format
design. If claims.jsonl can produce valid STACK.md, FEATURES.md,
ARCHITECTURE.md, PITFALLS.md, and SUMMARY.md, the format is expressive enough
for all consumers.

### R5: consumer_hints in metadata.json enable smart prompting

Rather than always presenting all 4+ handoff options, use consumer_hints to show
only relevant options. If `tdms_debt_items: 0`, do not offer TDMS routing. This
keeps the completion prompt concise and actionable.

### R6: Do not build a brainstorming adapter yet

No brainstorming skill exists. When one is created, its discovery phase can
reference the adapter contract defined in this document. Building an adapter for
a non-existent consumer is premature.

### R7: Memory persistence should be conservative

Not every HIGH confidence claim belongs in memory. The `memory_candidate` flag
should only be set for claims that:

- Save significant future research time (negative findings, API limits)
- Represent durable architectural truths (not version-specific)
- Are relevant across multiple future sessions (not task-specific)

A good heuristic: if you would tell a colleague "remember this for next time,"
it is a memory candidate.

### R8: Research must declare its scope boundary

Every research session must explicitly state what it DID and DID NOT
investigate. This prevents consumers from assuming research covered something it
did not. The `## Open Questions` section in RESEARCH_OUTPUT.md and the absence
of claims in certain categories signal gaps.

---

## Version History

| Version | Date       | Description                                 |
| ------- | ---------- | ------------------------------------------- |
| 1.0     | 2026-03-20 | Initial downstream integration architecture |
