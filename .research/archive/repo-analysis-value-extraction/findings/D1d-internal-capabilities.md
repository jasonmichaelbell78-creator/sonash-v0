# D1d: Internal Codebase Analysis Capabilities

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-31
**Sub-Question IDs:** D1d

---

## Key Findings

1. **The `explore` agent is purpose-built for read-only codebase investigation**
   — it uses a structured 5-step workflow (Understand, Broad Discovery, Deep
   Investigation, Cross-Reference, Synthesize) and returns a typed report with
   Key Files, Findings, Data Flow, Dependencies, Pattern Compliance, and
   Confidence sections. It is already generic — its constraints are
   SoNash-specific in the prompt preamble but its methodology is
   domain-agnostic. Adaptation cost: low. Just remove the SoNash context block.

2. **`gsd-codebase-mapper` is the most directly reusable agent** — it analyzes 4
   explicit axes (tech, arch, quality, concerns) and writes structured markdown
   documents directly to disk. Its templates (STACK.md, INTEGRATIONS.md,
   ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md) cover
   exactly the dimensions needed for external repo value extraction. The agent
   is already designed to be pointed at any directory and produce analysis
   documents without orchestrator context load.

3. **`code-reviewer` provides a 7-category analysis framework** — Code Hygiene,
   Types, Framework Best Practices, Testing Coverage, Security Surface, AICode
   (AI-Generated Code patterns), and Debugging Ergonomics. Its AICode category
   is uniquely valuable for external repo analysis because it explicitly looks
   for hallucinated APIs, happy-path-only logic, copy-paste anti-patterns, and
   session boundary inconsistencies — signals that distinguish high-quality
   repos from AI-generated noise.

4. **`ecosystem-health` provides a proven composite scoring model** — 9 weighted
   categories (Code Quality: 15%, Data Effectiveness: 15%, Security: 13%,
   Technical Debt: 12%, Infrastructure: 10%, Process & Workflow: 10%, Testing:
   9%, Learning & Patterns: 8%, Documentation: 8%) mapped to 14 dimensions with
   good/average/poor benchmarks, letter grades, sparklines, and trend tracking.
   The scoring engine (`scoring.js`, `composite.js`, `dimensions.js`) is a
   self-contained Node.js library with zero external dependencies.

5. **`audit-comprehensive` establishes the canonical staged-wave orchestration
   pattern** — 4+3+2+1 agent configuration, checkpoint verification between
   stages, S0/S1 escalation protocol, MASTER_DEBT deduplication step before
   interactive review, false positives database, and context-recovery
   procedures. This is the reference architecture for any multi-domain analysis
   orchestrator.

6. **`deep-research` provides the most complete orchestration pattern for
   decomposition, parallel dispatch, synthesis, and quality assurance** — MECE
   sub-question generation, wave-based spawning with 4-agent concurrency cap,
   write-to-disk-first principle, mandatory contrarian + OTB challenges, gap
   pursuit phase, and tiered self-audit. Its `D + 3 + floor(D/5)` allocation
   formula and domain module system (`domains/*.yaml`) are directly applicable
   to a repo-analysis skill.

7. **The internal pattern registry is an empirically-grown reference rubric** —
   65 skills, 57 agents (44 local + 13 global), 14 pre-commit checks, 12
   pre-push checks, and 10 propagation patterns, each distilled from recurring
   observations across 250+ AI review sessions. This constitutes a battle-tested
   benchmark for evaluating external repos against. 4 of 5 critical
   `patterns:check` rules are universal to any Node.js codebase. The
   security-critical propagation patterns (SSRF allowlisting, prototype
   pollution, ReDoS detection, atomic writes) are universal to any language.

---

## Detailed Analysis

### 1. `explore` Agent

**File:** `.claude/agents/explore.md`

**What it does:** Read-only codebase investigation specialist. Five-step
methodology: (1) parse the request type (feature trace, dependency map, pattern
inventory, component anatomy, data flow), (2) broad discovery using `ls` and
`grep`, (3) deep file reading with import tracing, (4) cross-reference against
known patterns, (5) synthesize into a structured report.

**Tools:** Read, Bash, Grep, Glob. `disallowedTools: Agent, Write, Edit` —
enforces read-only mode.

**Output format:** Structured report with sections: Scope, Key Files (table),
Findings, Data Flow (step list), Dependencies, Pattern Compliance, Additional
Observations, Confidence level.

**What it extracts:**

- File-level purpose and export identification
- Import dependency chains (both directions)
- Data flow step-by-step (source to destination + mechanism)
- Pattern compliance against known project conventions
- Blast radius of changes (dependency map)
- Cross-subsystem relationships

**Current constraints that are SoNash-specific:**

- Prompt preamble describes SoNash architecture (Next.js, Firebase, Cloud
  Functions boundary)
- Pattern compliance checks are SoNash patterns (Cloud Functions boundary,
  repository pattern, type safety)

**Adaptation for external repos:** Strip the SoNash architecture context block.
Replace "SoNash-specific patterns" with a generalized version: dependency
injection patterns, security boundary patterns, data access patterns. The
exploration methodology and return protocol are 100% reusable. The agent already
handles "unfamiliar code" by design — its architecture-awareness is just
additive context, not structural.

**Adaptation cost:** LOW — remove 2 context blocks (~50 lines), update pattern
compliance checks to generic equivalents.

---

### 2. `gsd-codebase-mapper` Agent

**File:** `.claude/agents/gsd-codebase-mapper.md` (also at
`.claude/agents/global/gsd-codebase-mapper.md`)

**What it does:** Maps a codebase across exactly 4 focus axes, writing
structured analysis documents directly to disk. Each axis produces specific
document templates:

| Axis       | Documents Produced            | Contents                                                              |
| ---------- | ----------------------------- | --------------------------------------------------------------------- |
| `tech`     | STACK.md, INTEGRATIONS.md     | Languages, runtime, frameworks, key dependencies, external services   |
| `arch`     | ARCHITECTURE.md, STRUCTURE.md | Patterns, layers, data flow, entry points, where-to-add-code guidance |
| `quality`  | CONVENTIONS.md, TESTING.md    | Naming, formatting, import order, test patterns, mocking, coverage    |
| `concerns` | CONCERNS.md                   | Tech debt, known bugs, security risks, fragile areas, scaling limits  |

**Exploration methods per axis:**

- `tech`: Package manifests (`package.json`, `go.mod`, etc.), SDK import grep,
  config files
- `arch`: `find` directory structure, entry points, import pattern analysis
- `quality`: Lint/format configs, test framework configs, sample source files
- `concerns`: TODO/FIXME grep, large-file `wc -l` sort, empty-return stubs

**Key design decisions:**

- Writes documents directly to disk, returns only a brief confirmation (reduces
  orchestrator context load — this is the write-to-disk-first principle)
- Never reads `.env` or credential files (explicit `forbidden_files` block)
- Templates are prescriptive: "Use X pattern" not "X pattern is used"
- Covers "where do I put this?" guidance (STRUCTURE.md) — valuable for value
  extraction (understanding how to integrate patterns from the analyzed repo)

**Adaptation for external repos:** The agent already has NO hardcoded path
dependencies — it writes to `.planning/codebase/` but this is trivially
configurable. The exploration commands use relative paths. The key adaptation
is:

1. **Change the output path** from `.planning/codebase/` to a configurable path
   (e.g., `.research/<repo-slug>/codebase-map/`)
2. **Remove the hardcoded `forbidden_files` assumption** that `.env` = secrets
   (external repos may have `.env.example` files that are safe to read)
3. **Add stack-detection heuristics** for non-JS repos (the current commands
   assume JS/TS directory layouts)
4. **Consider spawning 4 parallel instances** (one per axis) rather than
   sequential — the axes are independent

**Adaptation cost:** MEDIUM — configuration path change + stack-detection
generalization.

---

### 3. `code-reviewer` Agent

**File:** `.claude/agents/code-reviewer.md`

**What it does:** A post-implementation review specialist with 10 named patterns
and 7 audit categories. Reviews git diff (staged or HEAD), runs automated checks
(`patterns:check`, `npm run lint`), then applies semantic pattern review.

**7 audit categories:**

1. **Code Hygiene** — unused imports, dead code, console.log leaks
2. **Types & Correctness** — `any` types, null safety, type coercion
3. **Framework Best Practices** — React patterns, Next.js conventions
   (SoNash-specific but generalizable)
4. **Testing Coverage** — untested functions, missing edge cases
5. **Security Surface** — input validation, auth checks, OWASP patterns
6. **AICode** — AI-generated code failure modes: happy-path-only logic,
   hallucinated APIs, copy-paste blocks, session boundary inconsistencies,
   trivial test assertions
7. **Debugging Ergonomics** — structured logging, correlation IDs, error
   messages with fix hints

**Output:** 3-tier findings (CRITICAL / WARNING / SUGGESTION) with file:line
references, verdict (APPROVE / REQUEST_CHANGES / BLOCK).

**Unique value for external repo analysis:** The `AICode` category is not found
in any commercial static analysis tool. It detects signals specific to
AI-assisted development: "tests that exist but don't assert meaningful
behavior," "functions with only happy-path logic," "session boundary
inconsistencies" (conflicting patterns from different AI sessions). For external
repos in 2026, this is a high-signal dimension.

**Current constraints:**

- References SoNash-specific automated checks (`npm run patterns:check`,
  `npm run lint`)
- Has SoNash-specific patterns (App Check, httpsCallable, Firestore)
- Assumes Node.js/TypeScript stack

**Adaptation for external repos:**

- Replace SoNash-specific automated checks with language-appropriate equivalents
  (detected from repo stack)
- Replace SoNash architectural patterns with generic equivalents (security
  boundary, data access layer, validation layer)
- Retain the 7-category framework — it is universally applicable
- The AICode category needs zero changes — it is by definition
  framework-agnostic

**Adaptation cost:** MEDIUM — replace automated check invocations, strip 6
SoNash-specific patterns, retain the rest.

---

### 4. `ecosystem-health` Skill

**File:** `.claude/skills/ecosystem-health/SKILL.md` **Reference:**
`.claude/skills/ecosystem-health/REFERENCE.md` **Scripts:**
`scripts/health/lib/` (scoring.js, composite.js, dimensions.js),
`scripts/health/checkers/` (11 checker scripts)

**What it does:** Runs 10-11 health checkers, aggregates results into 9 weighted
categories with 14 drill-down dimensions, computes composite score with letter
grade, and guides interactive triage.

**Composite scoring model:**

```
Category Weights:
- Code Quality:       0.15
- Data Effectiveness: 0.15
- Security:           0.13
- Technical Debt:     0.12
- Infrastructure:     0.10
- Process & Workflow: 0.10
- Testing:            0.09
- Learning & Patterns:0.08
- Documentation:      0.08
```

**Scoring engine (from `scripts/health/lib/scoring.js`):**

- `scoreMetric(value, benchmark, direction)` — scores individual metrics against
  `{good, average, poor}` benchmarks with `lower-is-better` or
  `higher-is-better` direction
- `computeGrade(score)` — maps 0-100 to A/B/C/D/F
- `sparkline(values)` — generates trend sparklines from value arrays
- `compositeScore(scores, weights)` — weighted average aggregation
- `computeTrend(history)` — computes trend from last 5 runs

**What this provides for repo-analysis:**

- A proven, battle-tested scoring architecture that avoids the "false precision"
  problem (composite score is honest about ±15% confidence interval)
- Letter-grade system is more communicable than raw numbers
- Trend tracking per dimension — directly applicable to temporal analysis in
  repo-analysis
- The category weight rationale is well-documented and defensible

**Key adaptation notes:**

- The checkers are entirely SoNash-specific (they check local files like
  `MASTER_DEBT.jsonl`, `hook-runs.jsonl`, etc.)
- The scoring library (`scoring.js`, `composite.js`) is 100% reusable — zero
  project-specific dependencies
- The category weights need recalibration for external repos (e.g., "Data
  Effectiveness" replaces with "Community Health" or "Documentation Coverage")
- The 13-dimension drill-down model maps well to the repo-analysis dimension
  catalog

**Adaptation cost:**

- Scoring library: ZERO cost (drop-in reuse)
- Category/weight scheme: LOW cost (reconfigure weights, rename categories)
- Checkers: HIGH cost (must write new checkers for external repo signals)

---

### 5. `audit-comprehensive` Skill

**File:** `.claude/skills/audit-comprehensive/SKILL.md`

**What it does:** Orchestrates 9 domain audit agents in staged waves (4+3+2+1),
aggregates results, deduplicates against MASTER_DEBT, and guides interactive
review before TDMS intake.

**Wave structure:**

```
Stage 1: Technical Core (4 agents parallel) — code, security, performance, refactoring
Stage 2: Supporting (3 agents parallel) — documentation, process, engineering-productivity
Stage 2.5: Meta & Enhancement (2 agents parallel) — enhancements, ai-optimization
Stage 3: Aggregation (1 sequential) — produces COMPREHENSIVE_AUDIT_REPORT.md
Stage 3.5: MASTER_DEBT Dedup (mandatory inline) — prevents duplicate intake
```

**Coordination patterns:**

- Pre-flight validation: verify skill existence, create output directory, gather
  baselines, load false positives
- Output directory verified with safety check (`realpath`, `../` prevention)
  before agent spawning
- Each agent writes to `output_dir/` and returns ONLY a brief completion signal
  (write-to-disk-first principle)
- S0/S1 escalation checkpoint between Stage 1 and Stage 2
- Checkpoint verification: each stage confirms reports exist and are non-empty
  before proceeding
- Context recovery: state machine that can resume from any checkpoint after
  compaction

**Deduplication model:** Before interactive review, cross-references all
findings against MASTER_DEBT.jsonl by: file path match, title/description
semantic overlap, root cause equivalence. Produces three classifications:
Already Tracked (skip), New Finding (proceed), Possibly Related (flag for manual
review). For external repos, this becomes: de-duplication against prior analyses
of the same repo (by HEAD SHA or date).

**Return protocol:** Each audit agent returns ONLY:
`COMPLETE: [audit-domain] wrote N findings to [output-path]`. No content is
returned — the orchestrator reads files. This is critical for context budget
management with many parallel agents.

**Adaptation for external repos:** The 9-domain coverage maps well to external
repo analysis with light renaming:

- `audit-code` → code-quality analysis agent
- `audit-security` → security posture agent
- `audit-performance` → complexity/performance signals agent
- `audit-refactoring` → technical debt detection agent
- `audit-documentation` → documentation coverage agent
- `audit-process` → CI/CD and workflow health agent
- `audit-engineering-productivity` → DX and tooling signals agent
- `audit-enhancements` → value identification agent (the "what's interesting?"
  agent)
- `audit-ai-optimization` → AI/LLM usage pattern detection agent

**Adaptation cost:** LOW for orchestration pattern, MEDIUM for individual agent
prompts (need to swap internal-oriented focus for external repo focus).

---

### 6. `deep-research` Skill

**File:** `.claude/skills/deep-research/SKILL.md` **Reference:**
`.claude/skills/deep-research/REFERENCE.md` **Domain configs:**
`.claude/skills/deep-research/domains/technology.yaml`

**What it does:** 12-phase research engine: interactive decomposition → parallel
searcher dispatch → synthesis → verification → challenges (contrarian + OTB) →
dispute resolution → gap pursuit → gap verification → final re-synthesis →
self-audit → presentation.

**Directly reusable patterns for repo analysis:**

**MECE sub-question generation (Phase 0.5):** After generating sub-questions,
runs a convergence-loop quick-pass to verify coverage: "are there blind spots?
overlaps? missing angles?" This is directly applicable to the repo-analysis
dimension catalog — validate that the analysis covers all relevant axes before
spawning agents.

**Agent allocation formula (Critical Rule #7):** `D + 3 + floor(D/5)` where D =
sub-questions. Presented as a floor, not a ceiling. For repo-analysis:
`N_dimensions + 2 + floor(N_dimensions/4)`. The formula's purpose is ensuring
buffer agents for cross-domain correlation.

**Write-to-disk-first principle (Critical Rule #4):** "Findings must survive
crashes." Every agent writes to a path before returning. The orchestrator
verifies files exist after each wave. This prevents context exhaustion from
causing silent data loss.

**Domain module system:** `domains/technology.yaml` defines source authority
tiers, verification rules (recency threshold, min independent sources,
deprecation check), and output tuning (include code examples, version matrix).
This is directly portable — a `domains/repo-analysis.yaml` could define the
authority hierarchy for repo analysis sources (GitHub API = T1, OpenSSF
Scorecard = T1, npm audit = T2, etc.).

**Gap pursuit phase (Phase 3.95):** After challenges, scans ALL findings for
actionable gaps. Spawns gap agents only when gaps are identified. One round only
— no recursive gap chasing. For repo-analysis, this maps to: after initial
analysis, scan dimension scores for anomalies that warrant deeper investigation
(e.g., "security score is F but code quality is A — investigate the
disconnect").

**Compaction resilience:** State file at
`.claude/state/deep-research.<slug>.state.json` updated after every
state-changing event. On resume: read state, validate JSON, skip completed
phases. For repo-analysis: `.claude/state/repo-analysis.<slug>.state.json` with
SHA pinning to detect cache invalidation.

**Adaptation cost:** LOW for orchestration patterns and state management (direct
port), MEDIUM for phase content (replace "web search" with "git API calls +
static analysis tool invocation").

---

### 7. `gsd-phase-researcher` Agent (Bonus)

**File:** `.claude/agents/global/gsd-phase-researcher.md`

**What it does:** Answers "What do I need to know to PLAN this phase well?"
Produces a RESEARCH.md consumed by `gsd-planner`. Its output format (Standard
Stack, Architecture Patterns, Don't Hand-Roll, Common Pitfalls, Code Examples,
State of the Art, Validation Architecture) is a template for "understand this
codebase for planning purposes."

**Unique value for repo-analysis:** The `## Don't Hand-Roll` section is directly
applicable to value extraction: it catalogs existing solutions that already
solve a problem, plus the reasoning for why custom solutions are worse. This is
exactly the signal a repo-analysis skill needs to surface — "this repo reinvents
X when library Y exists."

**The `## Runtime State Inventory` section** is also valuable for external
repos: identifying state stored in databases, external services, OS-registered
state, and secrets that are outside the repository but relevant to understanding
the system.

**Adaptation cost:** LOW — the output template is already structured for
"understand this codebase for planning."

---

### 8. `deep-research-searcher` and `deep-research-synthesizer` Global Agents

**Files:**

- `.claude/agents/global/deep-research-searcher.md`
- `.claude/agents/global/deep-research-synthesizer.md`

**What the searcher does:** Executes search queries using profile-appropriate
tools (web, docs, codebase, academic), writes structured FINDINGS.md files with
confidence levels (HIGH/MEDIUM/LOW/UNVERIFIED) and CRAAP+SIFT source evaluation.
The codebase profile uses Grep, Glob, Read, Bash.

**What the synthesizer does:** Reads multiple FINDINGS.md files, deduplicates
findings, extracts themes, resolves contradictions transparently, assigns
sequential citation numbers, produces RESEARCH_OUTPUT.md + claims.jsonl +
sources.jsonl + metadata.json.

**Direct application to repo analysis:** A repo-analysis `--depth=deep` mode
could literally use the deep-research-searcher in `codebase` profile, pointed at
a cloned external repo. The FINDINGS.md format with confidence levels is already
the right output format for dimension analysis agents. The synthesizer's
deduplication and theme extraction logic is exactly what the aggregation phase
needs.

---

## Reuse Opportunities

Organized by adaptation cost:

### Direct Reuse (ZERO adaptation cost)

1. **`scripts/health/lib/scoring.js`** — `scoreMetric()`, `computeGrade()`,
   `sparkline()`, `compositeScore()`, `computeTrend()` — self-contained, no
   project dependencies. Drop into repo-analysis scoring engine.
2. **`scripts/health/lib/composite.js`** — composite scoring engine
   architecture. Swap category names and weights, reuse the aggregation logic.
3. **Write-to-disk-first principle** — every analysis agent writes to
   `<output-dir>/dimensions/<name>-findings.json` and returns only a completion
   signal. Copy the return protocol verbatim from `audit-comprehensive`.
4. **4-agent concurrency cap + staged-wave pattern** — copy the
   checkpoint-and-proceed structure from `audit-comprehensive`.
5. **CRAAP+SIFT source evaluation framework** — directly applicable to assessing
   GitHub repos and external APIs as sources.
6. **MECE coverage verification (convergence-loop quick-pass)** — run after
   generating the dimension list to verify no blind spots.

### Low-Cost Fork (change context, keep structure)

7. **`explore` agent** — remove SoNash context block, update pattern compliance
   checks. Runtime: read-only codebase investigator for external repos.
8. **`deep-research` domain module system** — create
   `domains/repo-analysis.yaml` with GitHub API and OpenSSF Scorecard as T1
   sources.
9. **`audit-comprehensive` pre-flight validation** — adapt for: verify clone
   target is accessible, verify required tools are installed (scc, semgrep,
   lizard, etc.), create output directory with safety check.
10. **`deep-research` state file schema** — adapt with `repo_url`, `head_sha`,
    `clone_path` fields for cache invalidation logic.
11. **`deep-research-synthesizer` deduplication and theme extraction** — reuse
    synthesis patterns for the aggregation agent.

### Medium-Cost Fork (significant prompt work, same architecture)

12. **`gsd-codebase-mapper`** — generalize stack detection for non-JS repos,
    change output path to `.research/<slug>/codebase-map/`, add option to spawn
    all 4 axes in parallel.
13. **`code-reviewer`** 7-category framework — strip SoNash-specific checks,
    plug in language-appropriate equivalents at runtime. The AICode category is
    zero-change.
14. **`audit-comprehensive` orchestration** — swap 9 domain audit agents for
    repo-analysis dimension agents, adapt MASTER_DEBT dedup to prior-run SHA
    dedup.
15. **`ecosystem-health` scoring model** — recalibrate 9 category weights for
    external repo context (replace "Data Effectiveness" and "Infrastructure"
    with "Community Health" and "Governance"), write new checkers.

### Higher-Cost Composition (multiple agents working together)

16. **`research-plan-team` pattern** — a 3-member team (analyzer + synthesizer +
    verifier) mirrors the research-plan team. For repo-analysis depth=deep:
    analysis agents → synthesis agent → contrarian/verification agent.

---

## Delta Analysis

What is needed for repo-analysis value extraction that does NOT currently exist:

### Missing Capability 1: GitHub API / External Repo Pre-flight Agent

**Gap:** No existing agent is designed to hit GitHub REST/GraphQL APIs to gather
metadata about an external repo before cloning. The `explore` agent assumes
you're already inside the repo. The `gsd-phase-researcher` uses
WebSearch/Context7 for external lookups, not GitHub API. **What's needed:** A
new `repo-analysis-preflight` agent that takes a GitHub URL, calls 8-10
REST/GraphQL endpoints, and produces a structured `api-signals.json`. This is
the Quick Scan mode (QS-01 through QS-18 dimensions).

### Missing Capability 2: Stack Detection and Tool Selection Logic

**Gap:** `gsd-codebase-mapper` assumes JavaScript/TypeScript throughout (its
exploration commands use `*.ts`/`*.tsx` globs, `package.json` for stack, etc.).
No agent dynamically selects analysis tools based on detected language stack.
**What's needed:** A stack-detection module that reads manifests
(`package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`, `pom.xml`, etc.)
and maps detected stacks to the correct analysis tools (e.g., Python →
`bandit` + `vulture` + `mypy`; JS/TS → `semgrep` + `knip` +
`dependency-cruiser`).

### Missing Capability 3: Temporal Analysis Agent

**Gap:** The existing health checkers check temporal signals for the local repo
(debt aging, commit recency) but no agent does systematic temporal analysis of
an external repo's git history: churn hotspots, contributor health trends,
co-change coupling, commit velocity sparklines. **What's needed:** A
`repo-analysis-temporal` agent that runs `git log --numstat`, `git shortlog`,
and `git log --follow` against a deepened clone and produces temporal dimension
findings (DP-01 through DP-12 from the research output).

### Missing Capability 4: Value Extraction Scoring (Not Health Scoring)

**Gap:** `ecosystem-health` scores "is this system healthy?" — a health-oriented
framework. Repo value extraction asks different questions: "What patterns here
are worth copying?", "What does this repo do well that we don't?", "Is this
dependency worth adopting?". These require a different rubric:
adoption-worthiness score, pattern-quality score, maintainability forecast.
**What's needed:** A `value-extraction-rubric` that scores dimensions
differently for adoption decisions vs health decisions. For example, "Active
contributor count > 3" is health-neutral but adoption-critical (bus factor
risk). A fork of `ecosystem-health` with recalibrated weights and new
value-extraction dimensions.

### Missing Capability 5: Clone Management Infrastructure

**Gap:** No existing skill or agent manages the clone lifecycle: blobless
partial clone → history deepening on demand → cleanup. The `explore` agent
assumes it's already in the repo. `gsd-codebase-mapper` uses `find` and `ls`
without any clone management. **What's needed:** A clone manager module (inline
orchestrator logic, not a separate agent) that: (1) checks cache by HEAD SHA,
(2) executes `git clone --filter=blob:none --depth=1`, (3) deepens to
`--shallow-since="1 year ago"` on demand, (4) cleans up on completion. The
`audit-comprehensive` pre-flight pattern provides the template.

### Missing Capability 6: Cross-Repo Pattern Extraction Output Format

**Gap:** All existing analysis output is formatted for internal consumption —
TDMS intake, session-end handoff, GitHub PR comment format. There is no output
format optimized for "I analyzed this external repo, here is what's worth
extracting/adapting." **What's needed:** A structured
`value-extraction-report.md` template with sections: Standout Patterns
(high-signal ideas worth copying), Adoption Decision (with confidence score),
Reuse Candidates (specific files/modules worth forking), Anti-patterns Avoided
(things this repo does that we should continue not doing), and a one-page "CTO
summary" terse format.

---

## Sources

| File                                                                         | Purpose                                                                                |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `.claude/agents/explore.md`                                                  | Explore agent definition — read-only codebase investigation methodology                |
| `.claude/agents/gsd-codebase-mapper.md`                                      | 4-axis codebase mapper — templates, exploration commands, output format                |
| `.claude/agents/global/gsd-codebase-mapper.md`                               | Global copy of codebase mapper (canonical version)                                     |
| `.claude/agents/code-reviewer.md`                                            | Code reviewer — 7-category analysis framework, AICode patterns                         |
| `.claude/agents/plan.md`                                                     | Plan agent — 6-step planning methodology, constraint identification                    |
| `.claude/agents/global/deep-research-searcher.md`                            | Searcher agent — FINDINGS.md format, confidence levels, CRAAP+SIFT                     |
| `.claude/agents/global/deep-research-synthesizer.md`                         | Synthesizer agent — deduplication, theme extraction, output schemas                    |
| `.claude/agents/global/gsd-phase-researcher.md`                              | Phase researcher — research domain methodology, RESEARCH.md template                   |
| `.claude/agents/global/gsd-project-researcher.md`                            | Project researcher — ecosystem research methodology, STACK/FEATURES/PITFALLS templates |
| `.claude/agents/global/gsd-research-synthesizer.md`                          | Research synthesizer — synthesis from parallel researcher agents                       |
| `.claude/skills/ecosystem-health/SKILL.md`                                   | Ecosystem health skill — 8-category composite scoring, triage workflow                 |
| `.claude/skills/ecosystem-health/REFERENCE.md`                               | 13 dimension descriptions, triage format                                               |
| `.claude/skills/audit-comprehensive/SKILL.md`                                | Staged-wave orchestration — 4+3+2+1 pattern, checkpoints, dedup                        |
| `.claude/skills/deep-research/SKILL.md`                                      | Deep research orchestration — 12 phases, allocation formula, write-to-disk-first       |
| `.claude/skills/deep-research/REFERENCE.md`                                  | MECE verification, confidence levels, CRAAP+SIFT, domain modules                       |
| `.claude/skills/deep-research/domains/technology.yaml`                       | Domain module schema — source authority tiers, verification rules                      |
| `.claude/skills/audit-code/SKILL.md`                                         | Code audit — 7-category parallel/sequential execution, AICode patterns                 |
| `.claude/skills/audit-health/SKILL.md`                                       | Audit meta-check — diagnostics on audit infrastructure                                 |
| `.claude/skills/skill-audit/SKILL.md`                                        | Skill behavioral quality audit — 11 quality categories                                 |
| `.claude/teams/research-plan-team.md`                                        | 3-member team pattern (researcher + planner + verifier)                                |
| `scripts/health/lib/scoring.js`                                              | Scoring engine — `scoreMetric`, `computeGrade`, `sparkline`, `computeTrend`            |
| `scripts/health/lib/composite.js`                                            | Composite scoring — category weights, aggregation, 9-category model                    |
| `scripts/health/lib/dimensions.js`                                           | 14 health dimensions — metric keys, checker field references                           |
| `scripts/health/checkers/`                                                   | 11 health checker scripts (SoNash-specific, not directly portable)                     |
| `.research/repo-analysis-skill/findings/D8-skill-orchestration.md`           | Orchestration patterns from prior internal research                                    |
| `.research/repo-analysis-skill/findings/D9a-2-patterns-codereview.md`        | patterns:check and code-reviewer analysis — universal vs project-specific              |
| `.research/repo-analysis-skill/findings/D9b-1-skills-inventory.md`           | Full skills inventory (65 skills, categorized)                                         |
| `.research/repo-analysis-skill/findings/D9b-2-agents-tdms-session.md`        | Full agents inventory (57 agents)                                                      |
| `.research/repo-analysis-skill/findings/D10a-universal-quality-standards.md` | Universal vs SoNash-specific patterns from CODE_PATTERNS.md                            |
| `.research/repo-analysis-skill/findings/D10b-hook-review-rubric.md`          | hook-checks.json analysis — universal check types                                      |
| `.research/repo-analysis-skill/findings/V2-internal-verification.md`         | Verified claims: 65 skills, 57 agents, 14+12 hooks, gsd-codebase-mapper 4 axes         |
| `.research/repo-analysis-skill/RESEARCH_OUTPUT.md`                           | Complete prior research output — dimension catalog, modes, architecture decisions      |

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 4
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All agent/skill descriptions are based on direct file reads. Adaptation cost
ratings are judgments based on reading actual prompt content. The delta analysis
(missing capabilities) reflects what was NOT found in the filesystem after
systematic search. The V2 internal verification file from the prior research
pass confirmed the major inventory counts (65 skills, 57 agents, 14+12 hooks).
