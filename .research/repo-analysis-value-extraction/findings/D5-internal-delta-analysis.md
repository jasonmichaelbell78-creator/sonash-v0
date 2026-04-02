# D5: Internal Capabilities Delta Analysis

**Searcher:** deep-research-searcher  
**Profile:** codebase  
**Date:** 2026-03-31  
**Topic:** What's the delta between current internal capabilities and what the
repo-analysis value-extraction skill needs?

---

## Reusable As-Is

These capabilities transfer directly to a repo-analysis value-extraction skill
with no modification required.

### 1. Deep-Research Parallel Searcher + Synthesizer Architecture

The `/deep-research` orchestration pipeline (SKILL.md v1.8) and its two global
agents — `deep-research-searcher.md` and `deep-research-synthesizer.md` — are
directly applicable to analyzing an external repo at depth. The existing pattern
of:

- Phase 0: decompose the question into MECE sub-questions
- Phase 1: spawn parallel searcher agents (each with a bounded scope)
- Phase 2: synthesizer collects FINDINGS.md files, deduplicates, extracts themes
- Phase 3: contrarian + OTB challenges
- Phase 3.95: gap pursuit

...is exactly the orchestration structure needed to explore an external codebase
at multiple levels (summary scan, deep pattern extraction, portability
analysis). The searcher already supports a `codebase` search profile, which uses
Read, Grep, Glob, and Bash — precisely the tools needed for repo analysis.

**What transfers:** The entire agent spawn/collect/synthesize loop. The state
file schema. The gap pursuit and challenge phases. The claims.jsonl +
sources.jsonl + RESEARCH_OUTPUT.md output contract.

**Source:** `.claude/skills/deep-research/SKILL.md`,
`.claude/agents/global/deep-research-searcher.md`,
`.claude/agents/global/deep-research-synthesizer.md`

---

### 2. claims.jsonl Routing Schema

The synthesizer already produces a `claims.jsonl` with per-claim routing hints:

```json
{
  "routing": {
    "deepPlan": false,
    "gsd": false,
    "convergenceLoop": false,
    "memory": false,
    "tdms": false
  }
}
```

A new `adoption` routing flag (or a new `value-extraction` key block) can be
added to this schema without breaking existing consumers. This gives the skill a
ready-made machine-parseable output format for downstream routing — claims
flagged `adoption: true` flow to an extraction report; claims flagged
`tdms: true` continue to the debt pipeline.

**Source:** `.claude/agents/global/deep-research-synthesizer.md` (Step 7,
claims.jsonl generation)

---

### 3. TDMS MASTER_DEBT.jsonl Schema as a Pattern for Value-Findings

The TDMS intake schema (from `docs/technical-debt/MASTER_DEBT.jsonl` and the
`add-debt` skill) provides a mature, battle-tested JSONL record structure with:
`id`, `category`, `severity`, `title`, `description`, `file`, `line`, `effort`,
`status`, `source`, `recommendation`, `created`, `content_hash` (SHA-256 dedup).

A value-findings schema for "things worth adopting from this repo" can mirror
this exactly, replacing debt-specific fields (`severity: S0-S3`) with
adoption-specific fields (`value_density`, `portability`, `effort_to_adapt`)
while keeping the same structural conventions. The existing intake scripts
(`intake-manual.js`) provide a reference implementation for append-to-JSONL with
dedup — the same pattern can be used for a `value-intake.js`.

**Source:** `.claude/skills\add-debt\SKILL.md`,
`docs/technical-debt/MASTER_DEBT.jsonl` (first 5 records)

---

### 4. gsd-codebase-mapper's Four-Axis Analysis Model

The `gsd-codebase-mapper` agent covers four axes that are directly useful for
external repo analysis:

- **tech**: package.json, dependencies, integrations — maps to "what stack does
  this repo use, what can I learn from their dependency choices?"
- **arch**: directory structure, layers, entry points — maps to "what
  architectural patterns are worth studying?"
- **quality**: conventions, linting, testing patterns — maps to "what quality
  practices are portable?"
- **concerns**: tech debt, fragile areas, security holes — maps to "what should
  I avoid copying?"

The agent's exploration instructions (grep patterns, bash commands, Glob
searches) are the exact investigation patterns needed for value-extraction. Its
`CONCERNS.md` template is particularly relevant: every concern in CONCERNS.md is
implicitly an "anti-adoption signal" — a warning about what not to import.

**What transfers directly:** The four exploration focuses and their grep/bash
investigation templates. The requirement to always include file paths. The
prescriptive (not just descriptive) output style.

**Source:** `.claude/agents/gsd-codebase-mapper.md`

---

### 5. Explore Agent's Pattern-Inventory Investigation Strategy

The `explore` agent's "Finding All Instances of a Pattern" strategy — grep for
the pattern signature, categorize instances (correct usage, deviations, legacy),
count and summarize — is the core micro-task of value extraction. When looking
at an external repo for a specific pattern (e.g., "how do they handle rate
limiting?"), the Explore agent's workflow applies without modification.

The agent is already constrained as read-only (no Write/Edit), which is exactly
the right posture for external repo analysis. Its 25-turn limit is a concern for
large repos, but the spawning model from deep-research handles this by splitting
scope across multiple agents.

**Source:** `.claude/agents/explore.md`

---

### 6. Ecosystem-Audit Weighted Scoring Model

The skill-ecosystem-audit's `benchmarks.js` pattern — domains with weighted
categories, each with `good/average/poor` thresholds, and a `direction` field —
is a reusable scoring architecture. A "value density" or "adoptability" scoring
model can be constructed identically:

```javascript
const VALUE_BENCHMARKS = {
  code_quality: {
    test_coverage_pct: {
      good: 80,
      average: 50,
      poor: 20,
      direction: "higher-is-better",
    },
    ts_strict_compliance: {
      good: 95,
      average: 70,
      poor: 40,
      direction: "higher-is-better",
    },
  },
  pattern_novelty: {
    unique_patterns_found: {
      good: 5,
      average: 2,
      poor: 0,
      direction: "higher-is-better",
    },
  },
  portability: {
    external_dep_count: {
      good: 5,
      average: 15,
      poor: 30,
      direction: "lower-is-better",
    },
  },
};
```

The composite score computation from `scripts/lib/scoring.js` (used across all 7
ecosystem-audit skills) can be imported verbatim.

**Source:** `.claude/skills/skill-ecosystem-audit/scripts/lib/benchmarks.js`,
pattern confirmed across all ecosystem-audit skills

---

## Reusable With Adaptation

These capabilities need modification — the delta and changes required are
described.

### 7. code-reviewer Agent — Repurposed for External Code Quality Assessment

The `code-reviewer` agent currently evaluates whether code meets SoNash-specific
patterns (Cloud Functions boundary, App Check, Zod schemas, etc.). For external
repo analysis, the framework is sound but the rules are wrong.

**What needs to change:**

- Remove all SoNash-specific CRITICAL patterns (httpsCallable, App Check,
  firestore-write-block)
- Replace with domain-agnostic quality signals: TypeScript strictness, test
  coverage, error handling discipline, security anti-patterns (OWASP Top 10
  variants), cognitive complexity
- Keep the three-tier output structure (CRITICAL / WARNING / SUGGESTION) — it
  maps cleanly to "do not adopt / adopt with caution / adopt as-is"
- Add a fourth tier: "ADOPT" — patterns worth importing verbatim
- Keep the automated checks layer but replace `npm run patterns:check` with
  generic linting equivalents

**Adaptation effort:** Medium. Core structure and tiering are reusable. The
SoNash-specific rules (10 of the 10 documented patterns) all need replacement or
parameterization. The return protocol can be kept as-is.

**Source:** `.claude/agents/code-reviewer.md`

---

### 8. gsd-project-researcher's Comparison Mode

The `gsd-project-researcher` already has a "Mode 3: Comparison" that produces
comparison matrices and structured recommendations. The output format
(comparison matrix + "Choose X when" recommendation) is directly applicable for
"this pattern vs my current approach" analysis.

**What needs to change:**

- The current tool strategy (Context7 + official docs + WebSearch) is for
  researching external technologies, not for comparing internal code patterns
  against an external repo
- For repo analysis, the primary tools should be codebase (Grep, Read, Glob on
  external repo) + codebase (same tools on own repo) + deep-research synthesis
- The `COMPARISON.md` output template is reusable verbatim but needs a
  "Portability Assessment" section added: what friction does adoption introduce?
  what dependencies does it bring?

**Adaptation effort:** Low-Medium. The template and output format are reusable.
The tool strategy needs a codebase-vs-codebase comparison mode.

**Source:** `.claude/agents/global/gsd-project-researcher.md` (Mode 3:
Comparison, output_formats section)

---

### 9. ecosystem-health Scoring + Triage Loop

The `/ecosystem-health` interactive triage loop (Phase 3 Q&A format,
per-dimension decisions, state persistence) provides the UX model for presenting
value-extraction findings to the user one at a time with options
(adopt/defer/skip/investigate-further).

**What needs to change:**

- The current 13 health dimensions are all internal quality metrics (ts-health,
  debt-aging, etc.)
- New dimensions needed: pattern-novelty, code-portability, adoption-readiness,
  quality-signal
- The action mapping table needs to output adoption actions instead of fix
  commands: "Copy pattern to lib/", "Adapt and rewrite", "Study only — not
  portable", "Add to backlog for consideration"
- The state schema is reusable (dimension, score, action, timestamp)

**Adaptation effort:** Medium. The UI loop, state management, and
compaction-resilience patterns are directly reusable. The dimension definitions
and action mapping need to be replaced with value-extraction equivalents.

**Source:** `.claude/skills/ecosystem-health/SKILL.md`,
`.claude/skills/ecosystem-health/REFERENCE.md`

---

### 10. deep-research's Domain Config System

The `domains/<domain>.yaml` system (technology, business, academic) provides a
source_authority tier and verification_rules that searchers use to calibrate
confidence. A new `external-repo` domain config could be added with
repo-specific source authority rules:

- Tier 1: actual code (filesystem reads) > tests > CI config
- Tier 2: README, CHANGELOG > comments, docs
- Tier 3: commit messages, issue references

**What needs to change:**

- Create `.claude/skills/deep-research/domains/external-repo.yaml`
- Define verification_rules appropriate for code analysis (e.g., "HIGH
  confidence requires code evidence, not just documentation"; recency threshold
  = last commit date, not publication date)

**Adaptation effort:** Low. The domain YAML schema is simple (confirmed from the
3 existing domain files). A new external-repo.yaml takes ~50 lines.

**Source:** `.claude/skills/deep-research/SKILL.md` (Phase 0.2),
`.claude/skills/deep-research/domains/` (3 files)

---

## Must Build New

These capabilities have no internal precedent and must be built from scratch.

### 11. Repo Discovery / Search Layer

There is no internal capability to find external repos worth analyzing. The
current system operates entirely on the local SoNash codebase or researches
external technology ecosystems via WebSearch. A value-extraction skill needs a
discovery phase that can:

- Search GitHub for repos matching a technology + pattern criteria (e.g.,
  "Next.js 16 + Firebase + App Check pattern examples")
- Filter by quality signals (stars, recent activity, test coverage badges,
  license)
- Rank by relevance to the user's own stack
- Return a shortlist of "repos worth analyzing"

This is a net-new capability. The `gsd-project-researcher` does ecosystem
discovery for technologies (what libraries exist) but not for codebases (which
actual repos implement this well). The deep-research web search profile finds
information about repos, not the repos themselves as analysis targets.

**What to build:** A `repo-discovery` agent or sub-skill that: (1) takes a
topic/pattern as input, (2) uses WebSearch + GitHub API (via gh CLI or WebFetch)
to find candidate repos, (3) scores candidates on quality signals, (4) returns a
ranked shortlist with rationale.

**Estimated scope:** 1 new agent or sub-skill, ~200 lines of agent definition.

---

### 12. Portability Scoring — Dependency Coupling Analysis

No internal capability assesses whether a pattern from an external codebase can
survive transplantation into the user's project. The code-reviewer evaluates
SoNash's own code quality; the gsd-codebase-mapper documents an external repo's
structure; but neither produces a "portability score" that asks:

- How many external dependencies does this pattern require?
- Does it assume a specific runtime, framework version, or authentication model?
- How many files/modules would need to be brought over?
- Does it conflict with existing SoNash patterns (e.g., does it do direct
  Firestore writes, violating the Cloud Functions boundary)?

**What to build:** A `portability-analyzer` sub-agent that: (1) takes a specific
pattern/component as input (file paths in external repo), (2) traces its import
graph and identifies all external dependencies, (3) checks those dependencies
against the user's own `package.json` and architectural constraints (from
CLAUDE.md), (4) produces a portability score (HIGH/MEDIUM/LOW) with a coupling
analysis.

**Why no precedent exists:** All existing analysis tools operate on the SoNash
codebase as the subject. No tool has a two-repo comparison mode (external source
vs. internal target) as a first-class concern.

**Estimated scope:** 1 new agent, ~250 lines. Needs access to both external
repo's package.json and SoNash's package.json simultaneously.

---

### 13. Adaptation Guidance — "How to transplant this" Output

Even when a pattern is identified as worth adopting and reasonably portable, no
existing skill produces the concrete adaptation instructions: what to rename,
what to replace, what to mock out, what to rewrite. The code-reviewer produces
fix instructions but always for SoNash's own code. The gsd-codebase-mapper
describes patterns but never asks "how would you use this in a different
project?"

**What to build:** An `adaptation-guide-writer` agent or a post-extraction
synthesis phase that: (1) takes an identified value-finding (pattern +
portability score + source files), (2) compares the pattern against SoNash's
conventions (CONVENTIONS.md, ARCHITECTURE.md from gsd-codebase-mapper), (3)
produces a structured "adoption recipe" with: rename checklist, dependency swap
list, refactoring steps, test strategy for the imported code.

**Estimated scope:** This may not need a separate agent — it could be a new
synthesis phase within the repo-analysis skill that runs after value findings
are collected. ~150 lines of synthesis logic. The output format is new: a
`ADOPTION_RECIPE.md` per finding, or a consolidated `EXTRACTION_PLAN.md`.

---

### 14. Value-Findings JSONL Schema + Intake Pipeline

The TDMS schema can be adapted (see section 3 above), but the actual schema
definition, intake script, dedup logic, and view generation for "value findings"
do not exist. This is distinct from technical debt — a value finding is an asset
to import, not a liability to fix.

**What to build:**

- `docs/value-extractions/VALUE_FINDINGS.jsonl` — the canonical store
- Schema fields: `id`, `source_repo`, `source_file`, `source_url`,
  `pattern_name`, `category`
  (pattern/architecture/tooling/convention/component), `value_density`
  (HIGH/MEDIUM/LOW), `portability` (HIGH/MEDIUM/LOW), `effort_to_adapt` (E0-E3),
  `adoption_status` (NEW/EVALUATING/ADOPTED/DEFERRED/REJECTED), `notes`,
  `created`, `content_hash`
- `scripts/value/intake-value-finding.js` — intake script following TDMS
  conventions
- `scripts/value/generate-views.js` — markdown view generation
- Integration with TDMS-style dedup (content_hash)

**Estimated scope:** 3-4 new scripts (~100 lines each), 1 new JSONL file, 1
markdown view. Can be modeled directly on TDMS scripts at `scripts/debt/`.

---

### 15. Summary-Level vs. Extraction-Level Mode Switching

The user wants both "give me a quick value summary of this repo" and "go deep on
pattern X — how do I actually extract it?" No internal skill has a mode that
switches depth based on extraction intent. Deep-research has depth levels
(L1-L4) but these control research thoroughness, not the type of output (summary
vs. extraction-ready recipe).

**What to build:** A mode flag on the skill itself
(`--mode summary | extraction`) that routes to different sub-agents:

- `summary` mode: runs gsd-codebase-mapper (all 4 axes) + a single synthesis
  pass → produces a VALUE_SUMMARY.md with top 5-10 findings ranked by value
  density
- `extraction` mode: takes a specific finding ID or pattern name, spawns
  portability-analyzer + adaptation-guide-writer → produces ADOPTION_RECIPE.md
  for that specific pattern

This mode distinction is absent from all existing skills. Every current skill
either explores broadly (gsd-codebase-mapper, deep-research) or acts
specifically (add-debt, code-reviewer on a diff). The summary→extraction
pipeline is a new workflow shape.

---

## Recommended Architecture

A repo-analysis value-extraction skill should be composed as follows:

### Phase 0: Discovery (Optional, new capability needed)

If the user does not provide a repo URL, invoke `repo-discovery` sub-agent to
find candidate repos. Takes: topic/pattern query. Returns: ranked shortlist.
User selects target.

If the user provides a repo URL, skip to Phase 1.

### Phase 1: Broad Mapping (Reuse gsd-codebase-mapper, 4 agents in parallel)

Spawn 4 `gsd-codebase-mapper` instances in parallel, each with one focus axis
(tech/arch/quality/concerns), targeting the external repo. Output: 5 planning
documents (STACK.md, INTEGRATIONS.md, ARCHITECTURE.md, STRUCTURE.md,
CONCERNS.md, CONVENTIONS.md, TESTING.md).

These documents answer: "What is this repo?" — the prerequisite for value
extraction.

**Constraint note:** gsd-codebase-mapper writes to `.planning/codebase/`. For
external repo analysis, redirect output to `.research/<repo-slug>/mapping/` to
avoid collisions with SoNash's own planning docs.

### Phase 2: Value Scan (Reuse deep-research codebase searchers, 3-6 agents)

Spawn `deep-research-searcher` agents (codebase profile) with sub-questions
scoped to value extraction:

- "What patterns in this repo are not present in my project?"
- "Which architectural decisions differ from SoNash's approach and appear
  superior?"
- "What testing patterns here are more thorough than my current approach?"
- "What tooling or scripts solve problems I have in my own codebase?"
- "What conventions appear consistently enforced that I lack?"

Each agent produces a FINDINGS.md. The existing searcher agent works as-is for
this. Requires the `external-repo` domain config (new, Low effort).

### Phase 3: Value Synthesis (Adapt deep-research-synthesizer)

Synthesizer collects findings and produces:

- `VALUE_SUMMARY.md` — top findings ranked by value density × portability
- `value-claims.jsonl` — per-claim with adoption routing flags

New routing flags needed on claims.jsonl: `adoption_candidate`, `portability`,
`effort_to_adapt`. The synthesizer agent needs a new output section added to its
template.

### Phase 4: Portability Analysis (New, for --mode extraction)

For each HIGH/MEDIUM value claim flagged as `adoption_candidate`, spawn
`portability-analyzer` to assess coupling and compatibility. This is the
new-build phase. Can be skipped in `--mode summary`.

### Phase 5: Adaptation Recipe (New, for --mode extraction)

For findings that pass portability threshold, spawn `adaptation-guide-writer` to
produce per-finding `ADOPTION_RECIPE.md` files. New-build phase.

### Phase 6: Intake to Value-Findings JSONL (New)

Run `scripts/value/intake-value-finding.js` for accepted findings. Produces
persistent VALUE_FINDINGS.jsonl entry. New-build.

### Phase 7: Interactive Triage (Reuse ecosystem-health UX pattern)

Present findings one at a time in ecosystem-health Q&A format. User decides:
adopt now / defer / investigate further / skip. Decisions saved to state file.
Deferred items optionally routed to TDMS as enhancements.

---

### Component Reuse Summary

| Component                                    | Source                            | Reuse Level                     |
| -------------------------------------------- | --------------------------------- | ------------------------------- |
| Agent orchestration / wave model             | deep-research SKILL.md            | As-is                           |
| Parallel searcher agents (codebase profile)  | deep-research-searcher.md         | As-is                           |
| Synthesizer (RESEARCH_OUTPUT + claims.jsonl) | deep-research-synthesizer.md      | Adapt (new routing flags)       |
| Broad codebase mapping (4 axes)              | gsd-codebase-mapper.md            | As-is (redirect output path)    |
| Pattern inventory investigation              | explore.md                        | As-is (spawned by searchers)    |
| Weighted scoring model                       | ecosystem-audit benchmarks.js     | Adapt (new dimensions)          |
| Interactive triage UX                        | ecosystem-health SKILL.md Phase 3 | Adapt (new action mapping)      |
| JSONL schema conventions                     | TDMS MASTER_DEBT.jsonl + add-debt | Adapt (new fields)              |
| Comparison matrix format                     | gsd-project-researcher Mode 3     | Adapt (add portability section) |
| Repo discovery                               | —                                 | Build new                       |
| Portability scoring                          | —                                 | Build new                       |
| Adaptation guidance                          | —                                 | Build new                       |
| Value-findings JSONL + intake                | —                                 | Build new                       |
| Summary vs. extraction mode switch           | —                                 | Build new                       |

---

## Sources

| File                                                             | Purpose                                                            | Trust                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| `.claude/agents/gsd-codebase-mapper.md`                          | Four-axis codebase analysis agent, exploration patterns, templates | HIGH (filesystem ground truth) |
| `.claude/agents/explore.md`                                      | Read-only investigation specialist, pattern inventory strategy     | HIGH                           |
| `.claude/agents/code-reviewer.md`                                | Code quality review agent, tier structure, SoNash-specific rules   | HIGH                           |
| `.claude/agents/global/deep-research-searcher.md`                | Parallel searcher agent, codebase search profile                   | HIGH                           |
| `.claude/agents/global/deep-research-synthesizer.md`             | Synthesis agent, claims.jsonl schema, routing hints                | HIGH                           |
| `.claude/agents/global/gsd-project-researcher.md`                | Comparison mode, feasibility mode, output formats                  | HIGH                           |
| `.claude/skills/deep-research/SKILL.md`                          | Orchestration pipeline, phase model, allocation formula            | HIGH                           |
| `.claude/skills/ecosystem-health/SKILL.md`                       | Interactive triage loop, phase 3 Q&A format                        | HIGH                           |
| `.claude/skills/ecosystem-health/REFERENCE.md`                   | Scoring dimensions, action mapping, triage state schema            | HIGH                           |
| `.claude/skills/skill-ecosystem-audit/scripts/lib/benchmarks.js` | Weighted scoring model with good/average/poor thresholds           | HIGH                           |
| `.claude/skills/add-debt/SKILL.md`                               | TDMS intake workflow, schema conventions, dedup pattern            | HIGH                           |
| `docs/technical-debt/MASTER_DEBT.jsonl` (first 5 records)        | Live TDMS schema with all fields in use                            | HIGH                           |
| `.claude/skills/deep-research/REFERENCE.md` (Section 1-2)        | Question type classification, depth levels                         | HIGH                           |
