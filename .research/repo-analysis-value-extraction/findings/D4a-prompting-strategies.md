# D4a: Prompting Strategies for Repo Analysis

**Searcher:** deep-research-searcher **Profile:** web + codebase **Date:**
2026-03-31 **Sub-Question IDs:** SQ-1 through SQ-8

---

## Key Findings

1. **Structured dimension-by-dimension beats open-ended exploration for
   analytical tasks** [CONFIDENCE: HIGH]

   The community consistently reports that structured prompting outperforms
   open-ended for codebase analysis (20-50% accuracy improvement cited in
   practitioner sources). Structured prompts with defined dimensions reduce
   output variance and prevent the "infinite exploration" pattern where an LLM
   reads hundreds of files without converging on useful findings. However,
   open-ended exploration ("what would you improve in this file?") is
   specifically recommended by Anthropic when you want to surface things you
   wouldn't have thought to ask about — so a hybrid approach is optimal:
   structured for analysis of known dimensions, open-ended for serendipitous
   discovery. [SOURCE: Anthropic Claude Code Best Practices,
   promptengineering.org structured vs conversational, Medium structured vs
   unstructured]

2. **Anthropic's own pattern is: Explore → Plan → Implement, never jump to
   analysis output** [CONFIDENCE: HIGH]

   Official Claude Code documentation prescribes a four-phase workflow that
   separates read-only investigation from implementation. For codebase analysis
   specifically: Enter Plan Mode → read files and answer questions without
   making changes → ask Claude to identify relevant files and explain
   dependencies → then produce structured output. The key pattern from internal
   Anthropic team usage: "asking Claude to navigate and synthesize information
   proves most valuable — teams don't ask it to write solutions immediately, but
   rather to map dependencies, identify relevant files, and explain system
   behavior first." The explore.md agent in this codebase implements this exact
   5-step pattern. [SOURCE: Anthropic Claude Code Best Practices, Anthropic "How
   teams use Claude Code"]

3. **Context window is the binding constraint — scoping trumps completeness**
   [CONFIDENCE: HIGH]

   Anthropic's best practices document states explicitly: "Most best practices
   are based on one constraint: Claude's context window fills up fast, and
   performance degrades as it fills." For repo analysis, three anti-patterns
   consistently cause failure: (a) kitchen-sink sessions mixing analysis with
   unrelated tasks, (b) unscopped "investigate this" prompts that read hundreds
   of files, (c) over-specified CLAUDE.md that gets ignored. The recommended fix
   for large codebases is subagents — delegate investigation to separate context
   windows that report summaries back. [SOURCE: Anthropic Claude Code Best
   Practices, Kinde AI context windows guide]

4. **Granularity should match the question type, not be fixed** [CONFIDENCE:
   HIGH]

   From local codebase evidence (gsd-codebase-mapper.md) and community practice:
   architecture-level analysis (ARCHITECTURE.md, STRUCTURE.md) is best for "what
   patterns does this repo use?"; module-level (per-directory) is best for "how
   does this subsystem work?"; file-level is best for "what does this specific
   component do?". The codebase-mapper agent separates this into four distinct
   focus areas (tech, arch, quality, concerns) each triggering different
   exploration strategies. The gist.github.com community prompt uses a six-phase
   framework: Initial Context Scan → Architecture Deep Dive → Feature-by-Feature
   Analysis → Nuances & Gotchas → Technical Reference → Final Assembly. [SOURCE:
   gsd-codebase-mapper.md (local), gist.github.com/cmer, Anthropic best
   practices]

5. **For repos exceeding context limits, three practical strategies exist with
   different trade-offs** [CONFIDENCE: HIGH]

   (a) Context chunking: break into functions, classes, or files; relies on
   developer judgment to select relevant segments. (b) Semantic search / RAG:
   embed code chunks, retrieve by similarity, augment prompts with most-relevant
   chunks only. (c) Summary hierarchies (map-reduce): summarize each chunk
   independently, then combine summaries. RAG is most scalable but requires
   infrastructure. Summary hierarchies work for unlimited-length analysis but
   add latency and cost. For repo analysis (not code generation), representative
   sampling + progressive disclosure works: start with structure/entry-points →
   then drill into subsystems on demand. Tools: Repomix (pack entire repo into
   single AI-friendly file), code2prompt (with token counting), LLMap
   (relevance-based file selection). [SOURCE: Kinde AI context windows guide,
   Redis context window management, agenta.ai techniques]

6. **Multi-pass analysis with phase separation produces significantly better
   results than single-pass** [CONFIDENCE: HIGH]

   Multiple independent sources converge on a three-phase pattern: (1) Structure
   pass: map the repo topology, understand tech stack, identify entry points and
   boundaries; (2) Pattern pass: identify coding conventions, data flow,
   architectural decisions, cross-cutting concerns; (3) Quality pass: assess
   debt, gaps, security surface, test coverage. This matches exactly the
   four-focus-area decomposition in gsd-codebase-mapper.md
   (tech/arch/quality/concerns). The Code-Survey methodology from academic
   research formalizes this further: design survey questions first, have LLM
   complete them, have experts evaluate a sample, then do quantitative analysis.
   Each pass should write documents to disk rather than accumulating in context.
   [SOURCE: gsd-codebase-mapper.md (local), gist.github.com/cmer 6-phase
   framework, Code-Survey arxiv paper]

7. **Structured output via JSON Schema / JSONL dramatically improves downstream
   usability** [CONFIDENCE: HIGH]

   For machine-parseable codebase analysis, providers now support API-native
   structured outputs that guarantee schema compliance. JSON schema reduces
   format errors by up to 70%; API-native approaches achieve up to 99%
   reliability. Practitioners recommend: define schema with Pydantic (Python) or
   Zod (TypeScript), pass to API, skip post-processing regex parsing. The local
   codebase (AUDIT_TEMPLATE.md, audit-code/SKILL.md) uses JSONL with
   fingerprint-based dedup, severity/effort/confidence fields, and file:line
   references as the standard output format for machine-parseable audit
   findings. This is a mature, battle-tested pattern. [SOURCE: agenta.ai
   structured outputs guide, cognitivetoday.com 2025 guide, AUDIT_TEMPLATE.md
   (local)]

8. **Comparative analysis prompting requires explicit reference injection, not
   vague "compare against"** [CONFIDENCE: MEDIUM]

   For "compare this repo against our CODE_PATTERNS.md" tasks, the effective
   pattern is: (a) load the reference standard as context explicitly before the
   codebase, (b) ask for compliance finding per pattern rule (not a general
   impression), (c) structure output as a per-rule verdict table. The local
   audit-code skill demonstrates this: it loads FALSE_POSITIVES.jsonl, checks
   template currency, runs patterns:check, and uses tool output (ESLint,
   SonarCloud) as authoritative evidence rather than relying on LLM impression.
   The key insight from the empirical prompting guidelines paper: specificity
   about the comparison target (explicit rule names, file:line references) is
   the most frequently applied and effective pattern (57% of successful
   prompts). [SOURCE: arxiv.org/2601.13118 prompting guidelines,
   audit-code/SKILL.md (local), AUDIT_TEMPLATE.md (local)]

9. **"What's interesting here" prompts need explicit permission and scaffolding
   to surface non-obvious insights** [CONFIDENCE: MEDIUM]

   Vague open-ended prompts alone are insufficient. The effective approach from
   community practice: (a) give explicit permission to deviate from standard
   quality metrics ("identify surprising, non-obvious, or innovative patterns —
   not standard quality checks"); (b) prime with categories of insight (unusual
   design decisions, contradictions between stated architecture and actual
   patterns, evidence of evolution/technical debt narrative, innovative
   approaches); (c) use the Code-Survey methodology: ask high-level insightful
   questions first, then drill down. The Anthropic best practices doc confirms
   that a prompt like "what would you improve in this file?" can surface things
   you wouldn't have thought to ask — but only when you explicitly frame it as
   exploratory. codebase-digest's 60+ prompt library includes a "Business &
   Stakeholder Analysis" category (SWOT, OKR alignment, competitive positioning)
   as a model for non-obvious insight extraction. [SOURCE: Anthropic Claude Code
   best practices, Code-Survey methodology (arxiv),
   kamilstanuch/codebase-digest, dev.to code understanding article]

10. **The local codebase's own agent/skill patterns are among the most mature
    examples available** [CONFIDENCE: HIGH]

    Analysis of .claude/agents/ and .claude/skills/ reveals a highly evolved
    prompting architecture: (a) explore.md uses a 5-step pattern (Understand →
    Broad Discovery → Deep Investigation → Cross-Reference → Synthesize) with
    explicit return protocol; (b) gsd-codebase-mapper.md separates analysis into
    four focus areas (tech/arch/quality/concerns) with typed output templates;
    (c) audit-code skill uses dual-pass verification, JSONL output with
    fingerprints, and cross-references against tool output. These patterns
    exceed most community documentation in specificity and are validated by
    production use. [SOURCE: explore.md (local), gsd-codebase-mapper.md (local),
    audit-code/SKILL.md (local)]

---

## Detailed Analysis

### Approach 1: Structured Dimension-by-Dimension Analysis

**What it is:** Break the analysis into explicit named dimensions and ask about
each one. Examples: "analyze architecture, then patterns, then quality" or
"cover: tech stack, data flow, error handling, test coverage."

**When to use:** When you know what you want to find and need reproducible,
comparable results across repos. Best for audit tasks, onboarding documentation
generation, and producing reference artifacts.

**Evidence from community:** The gist.github.com "Ultimate LLM Prompt for Deep
Codebase Analysis" formalizes six phases with explicit sequential output.
Code-Survey methodology uses survey design with closed-ended questions targeting
specific dimensions. The local gsd-codebase-mapper uses four typed focus areas
with separate document templates for each.

**Key pattern:** Each dimension gets its own output file/section. Separate
exploration commands per dimension. No dimension inherits another's findings
(avoids bias).

**Failure modes:** Can miss emergent properties that appear only when examining
relationships across dimensions. Tends toward checklist completion rather than
genuine understanding.

---

### Approach 2: Open-Ended Exploration

**What it is:** Give the LLM latitude to explore and surface what it finds
interesting or surprising. "What would you improve in this codebase?" or "What's
unusual about how this project handles X?"

**When to use:** Serendipitous discovery, finding things you didn't know to ask
about, early-stage understanding of an unfamiliar codebase.

**Evidence from Anthropic:** Official best practices explicitly endorses vague
prompts for exploration: "Vague prompts can be useful when you're exploring and
can afford to course-correct. A prompt like 'what would you improve in this
file?' can surface things you wouldn't have thought to ask about."

**Key pattern:** Short prompts, explicit permission to deviate from standard
analysis frameworks, expectation of conversational rather than structured
output.

**Failure modes:** Without boundaries, produces the "infinite exploration"
anti-pattern — LLM reads hundreds of files without converging. Must be scoped
narrowly or run in a subagent to protect main context.

---

### Approach 3: Hybrid (Recommended for Skill Design)

**What it is:** Structured pass for known dimensions + open-ended pass for
discovery, executed in separate phases. The structured pass produces the
reference artifact; the open-ended pass produces the serendipity/concerns
output.

**Evidence:** gsd-codebase-mapper's concerns focus (CONCERNS.md) is essentially
the open-ended discovery pass after the structured passes
(STACK/ARCHITECTURE/CONVENTIONS). The Code-Survey methodology's step 1 ("design
high-level insightful questions") is a structured way to operationalize
open-ended discovery.

---

### Context Window Management Strategies

| Strategy                       | Best For                          | Limitation                      |
| ------------------------------ | --------------------------------- | ------------------------------- |
| Full repo packing (Repomix)    | Small-medium repos (<100K tokens) | Hard ceiling on repo size       |
| Focus-area scoping             | Targeted analysis of subsystems   | Misses cross-cutting patterns   |
| Subagent delegation            | Any repo, parallelizable          | Requires aggregation step       |
| RAG / semantic search          | Very large repos (>500K tokens)   | Infrastructure overhead         |
| Summary hierarchy (map-reduce) | Unlimited but sequential          | Latency, cost                   |
| Progressive disclosure         | Interactive/exploratory           | Not suitable for batch analysis |

---

### Multi-Pass Pattern

Based on convergent evidence from multiple sources:

**Pass 1 — Structure:** Directory topology, entry points, tech stack, key
dependencies, module boundaries. Goal: produce a navigable map. Tools: ls, find,
package.json, README. Output: STRUCTURE.md, STACK.md.

**Pass 2 — Patterns:** Coding conventions, data flow, architectural patterns,
naming, error handling, cross-cutting concerns. Goal: understand how the
codebase works. Tools: grep for patterns, read representative files per layer.
Output: ARCHITECTURE.md, CONVENTIONS.md.

**Pass 3 — Quality/Concerns:** Tech debt, security surface, test gaps, fragile
areas, dependencies at risk. Goal: identify risks and opportunities. Tools:
TODO/FIXME grep, wc-l for large files, test coverage data. Output: CONCERNS.md.

**Pass 4 (optional) — Comparison:** Check findings against a reference standard
(CLAUDE.md, CODE_PATTERNS.md, security checklist). Goal: compliance and gap
analysis. Tools: load reference standard explicitly, produce per-rule verdict
table.

---

### Structured Output Patterns

Three formats are established practice:

**JSONL (best for batch/pipeline use):**

```json
{
  "category": "Architecture",
  "finding": "...",
  "file": "src/auth.ts",
  "line": 45,
  "severity": "S2",
  "confidence": 85,
  "fingerprint": "Architecture::auth.ts::missing-rate-limit"
}
```

JSONL supports streaming, dedup by fingerprint, easy grep/filter,
append-friendly.

**XML (best for hierarchical findings):**

```xml
<finding category="Architecture" severity="S2">
  <location file="src/auth.ts" line="45"/>
  <description>...</description>
  <evidence>...</evidence>
</finding>
```

XML is better for nested/hierarchical findings. Claude (Anthropic) specifically
recommends XML delimiters for prompt structure as they reduce parsing ambiguity.

**Structured Markdown with frontmatter (best for human+machine):**

```markdown
---
category: Architecture
severity: S2
file: src/auth.ts
line: 45
---

## Missing Rate Limiting

...
```

---

## Recommended Prompt Templates

### Template 1: Architecture-Level Exploration (Explore First)

```
You are a read-only codebase exploration specialist. Do NOT modify any files.

## Task
Produce a structured architecture overview of this repository.

## Analysis Dimensions (analyze each separately)
1. **Tech Stack**: Languages, frameworks, key dependencies (read package.json, lockfiles, configs)
2. **Directory Structure**: High-level layout, purpose of each top-level directory
3. **Entry Points**: How does the application start? What are the main flows?
4. **Data Flow**: How does data move from UI → services → storage?
5. **Key Patterns**: What design patterns are in use? Repository pattern, dependency injection, etc.
6. **Cross-Cutting Concerns**: How are auth, logging, error handling, and validation implemented?

## Exploration Strategy
- Start with directory structure and package manifests
- Read 2-3 representative files per layer
- Trace one feature end-to-end
- Do NOT read more than 15 files total without pausing to report

## Output Format
Return findings as structured Markdown sections matching the Analysis Dimensions above.
Include actual file paths for every claim. No assumptions — only what you read.

## What to Skip
- node_modules/, .next/, dist/, build/ directories
- Test data fixtures
- Generated files
```

---

### Template 2: Pattern Comparison Against Reference Standard

```
You are a code pattern compliance analyst.

## Reference Standard
The following patterns are REQUIRED in this codebase:
[PASTE CODE_PATTERNS.md or specific rules here]

## Task
Analyze [DIRECTORY or FILES] for compliance with the reference standard above.

## Output Format
Produce a compliance table:

| Pattern Rule | Status | Violations Found | Evidence |
|---|---|---|---|
| [Rule Name] | COMPLIANT / PARTIAL / VIOLATION | [count] | [file:line] |

Then list each violation in detail:
- Pattern: [which rule]
- Location: [file:line]
- Current code: [snippet]
- Required: [what the pattern says it should be]
- Severity: [S0/S1/S2/S3]

## Important
- For each violation, quote the actual code. Do not infer.
- Mark findings you are uncertain about as LOW_CONFIDENCE.
- Check each pattern rule exactly once — no interpretation of "spirit of the rule."
```

---

### Template 3: Multi-Pass Codebase Analysis (Full Audit)

```
You are a systematic codebase auditor running a four-pass analysis.

## Repo: [REPO NAME]
## Pass: [PASS NUMBER] of 4

### Pass 1 — Structure
Explore directory layout, tech stack, dependencies, entry points.
Write findings to: .planning/codebase/STRUCTURE.md and STACK.md
Limit: 10 files read max.

### Pass 2 — Patterns
Explore coding conventions, data flow, architectural patterns.
Reference STRUCTURE.md from Pass 1.
Write findings to: .planning/codebase/ARCHITECTURE.md and CONVENTIONS.md
Limit: 15 files read max.

### Pass 3 — Quality
Find tech debt, security surface, test gaps, fragile areas.
Grep for: TODO|FIXME|HACK, large files (wc -l), missing error handling.
Write findings to: .planning/codebase/CONCERNS.md
Limit: use grep/glob primarily, read files to confirm only.

### Pass 4 — Serendipity
With knowledge from Passes 1-3, answer:
- What's surprising or unusual about this codebase?
- What design decisions are non-obvious?
- What innovation or clever approaches exist?
- What contradictions exist between stated architecture and actual code?
Write findings to: .planning/codebase/OBSERVATIONS.md

## Rules
- Write each pass output to disk before starting the next pass
- Include file paths for every assertion
- Mark uncertain findings LOW_CONFIDENCE
- Do NOT modify any files
```

---

### Template 4: "What's Interesting Here?" Discovery Prompt

```
You are exploring this codebase as a curious senior engineer visiting this project for the first time.

## Your Mission
Surface non-obvious, interesting, or surprising findings. NOT standard quality metrics.

## What I'm Looking For
- Unusual design decisions that solved a real problem in an unexpected way
- Contradictions: where stated patterns differ from actual implementation
- Evidence of evolution: where the code shows a "this was changed from X to Y" narrative
- Clever or innovative approaches that other codebases don't typically use
- Hidden complexity: things that look simple but are actually sophisticated
- Over-engineering: abstractions that are more complex than the problem warrants
- "Why is this here?" moments: code that doesn't fit the surrounding patterns

## What I'm NOT Looking For
- Standard ESLint violations
- Missing tests
- TODO comments
- Obvious code smell

## Exploration Approach
1. Read the directory structure and pick 3 areas that look interesting based on names alone
2. Read the entry point and follow one data flow that surprises you
3. Look for the oldest and newest code patterns — what changed?
4. Find the most complex file (largest wc -l) and explain why it's complex

## Output
3-7 findings maximum. Quality over quantity.
For each: title, explanation of why it's interesting, evidence (file:line), implication.
```

---

### Template 5: Context-Budget-Aware Exploration (for Large Repos)

```
You are exploring a large codebase. Context is limited — prioritize ruthlessly.

## Budget: [N] files maximum

## Priority Order (stop when budget is exhausted)
1. package.json / requirements.txt / go.mod (tech stack) — 1 file
2. README / CLAUDE.md / docs/README (stated architecture) — 1-2 files
3. Top-level directory structure (ls only, no file reads) — 0 files
4. Entry points: main.ts, app.tsx, index.js, server.ts (1-2 files)
5. One representative file per architectural layer (1 file each)
6. The single largest file by wc -l (1 file)

## At Each Stage
Report: "Stage [N] complete. Files read: [count]/[budget]. Key finding: [1 sentence]. Continuing?"

## If Budget Exhausted Early
Stop and report what you found. Note: "Budget exhausted at stage [N]. Unexplored areas: [list]."

## Output
Findings organized by what you could and could not cover within the budget.
```

---

## Gaps Identified

1. **No direct evidence on hybrid structured/open-ended performance comparison**
   — community reports general benefits of structured prompting but there are no
   controlled studies specifically comparing structured vs. open-ended for
   codebase analysis output quality.

2. **Context-window threshold guidance is missing** — no source provides clear
   thresholds for when to switch from full-repo-in-context to RAG/subagent
   approaches (e.g., "above X tokens, switch strategies").

3. **Comparative analysis prompt patterns are underresearched** — the "compare
   repo against reference standard" use case has no established community prompt
   templates. The closest evidence comes from the local audit-code skill, which
   is more mature than anything found in public sources.

4. **"What's interesting" prompt effectiveness is anecdotal** — no studies
   measure whether explicit "serendipity framing" in prompts produces materially
   different output than standard analysis. Evidence is practitioner observation
   only.

5. **Multi-pass coordination between agents** — how to pass state between
   analysis passes without blowing context is solved in the local codebase
   (write to disk, load specific files in next pass) but not well-documented in
   public sources.

---

## Sources

| #   | URL                                                                                                                                          | Title                                                                               | Type                    | Trust  | CRAAP     | Date      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------- | ------ | --------- | --------- |
| 1   | https://code.claude.com/docs/en/best-practices                                                                                               | Best Practices for Claude Code                                                      | Official Docs           | HIGH   | 5/5/5/5/5 | 2026      |
| 2   | https://claude.com/blog/how-anthropic-teams-use-claude-code                                                                                  | How Anthropic Teams Use Claude Code                                                 | Official Blog           | HIGH   | 5/5/5/4/5 | 2025      |
| 3   | https://gist.github.com/cmer/2a9b78d2145204eedf1029e9305e3e50                                                                                | Ultimate LLM Prompt for Deep Codebase Analysis                                      | Community               | MEDIUM | 4/5/3/3/4 | 2025      |
| 4   | https://arxiv.org/html/2410.01837v1                                                                                                          | Code-Survey: LLM-Driven Methodology for Large-Scale Codebases                       | Academic                | HIGH   | 5/5/4/4/5 | 2024      |
| 5   | https://arxiv.org/html/2601.13118v1                                                                                                          | Guidelines to Prompt LLMs for Code Generation                                       | Academic                | HIGH   | 5/5/4/5/5 | 2025      |
| 6   | https://arxiv.org/html/2503.17502v1                                                                                                          | LLMs for Source Code Analysis: Applications, Models, Datasets                       | Academic                | HIGH   | 5/5/4/4/5 | 2025      |
| 7   | https://github.com/kamilstanuch/codebase-digest                                                                                              | Codebase-Digest: 60+ Coding Prompts                                                 | Community               | MEDIUM | 3/5/3/3/4 | 2025      |
| 8   | https://www.kinde.com/learn/ai-for-software-engineering/best-practice/ai-context-windows-engineering-around-token-limits-in-large-codebases/ | Kinde: Engineering Around Token Limits in Large Codebases                           | Industry Blog           | MEDIUM | 4/5/3/4/4 | 2025      |
| 9   | https://agenta.ai/blog/the-guide-to-structured-outputs-and-function-calling-with-llms                                                        | Guide to Structured Outputs and Function Calling                                    | Industry Blog           | MEDIUM | 4/5/3/4/4 | 2025      |
| 10  | https://promptengineering.org/a-guide-to-conversational-and-structured-prompting/                                                            | Conversational vs Structured Prompting                                              | Community               | MEDIUM | 3/5/3/3/4 | 2025      |
| 11  | https://github.com/Piebald-AI/claude-code-system-prompts                                                                                     | Claude Code System Prompts (Extracted)                                              | Community Analysis      | MEDIUM | 4/5/3/4/3 | 2025-2026 |
| 12  | Local: `.claude/agents/explore.md`                                                                                                           | Explore Agent — SoNash codebase                                                     | Codebase (Ground Truth) | HIGH   | n/a       | 2026      |
| 13  | Local: `.claude/agents/gsd-codebase-mapper.md`                                                                                               | GSD Codebase Mapper Agent                                                           | Codebase (Ground Truth) | HIGH   | n/a       | 2026      |
| 14  | Local: `.claude/skills/audit-code/SKILL.md`                                                                                                  | Audit-Code Skill                                                                    | Codebase (Ground Truth) | HIGH   | n/a       | 2026      |
| 15  | Local: `.claude/skills/_shared/AUDIT_TEMPLATE.md`                                                                                            | Shared Audit Template                                                               | Codebase (Ground Truth) | HIGH   | n/a       | 2026      |
| 16  | https://medium.com/@danielfornicauxui/how-structured-vs-unstructured-prompting-shapes-llm-output-in-web-app-building-054d8d82a0ce            | Structured vs Unstructured Prompting in Web App Building                            | Community               | LOW    | 3/4/2/3/3 | 2025      |
| 17  | https://arxiv.org/html/2508.01523v1                                                                                                          | Direct Instruction and Summary-Mediated Prompting in LLM-Assisted Code Modification | Academic                | HIGH   | 5/5/4/4/5 | 2025      |

---

## Contradictions

**Structured vs. Open-ended trade-off:** Research claims structured prompts
improve accuracy by 20-50%, but Anthropic's official guidance explicitly
recommends vague/open-ended prompts for exploratory use cases. These are not in
direct conflict (different use cases) but risk being misread as "always use
structured." Resolution: use structured for known-dimension analysis, open-ended
for discovery, hybrid for comprehensive analysis.

**Simplicity vs. complexity in prompts:** The academic survey paper (arxiv
2503.17502) found that "simpler prompting techniques like zero-shot prompting
may outperform more advanced ones" for some code analysis tasks. This
contradicts the community advice to use rich, detailed prompts with multiple
guidelines. Resolution: likely task-dependent — zero-shot works better for
classification/labeling; rich prompts work better for multi-dimensional analysis
tasks.

**Full-context vs. chunked/RAG approaches:** Large context windows (1M tokens)
are marketed as eliminating the need for chunking, but Anthropic's own guidance
emphasizes context management as the primary constraint. Resolution:
full-context works for small-medium repos; for large repos, performance degrades
as context fills, requiring active management regardless of theoretical window
size.

---

## Serendipity

- **The local codebase's own prompting patterns are more mature than most
  published guidance.** The gsd-codebase-mapper.md and explore.md agents encode
  practices (typed focus areas, mandatory file paths, prescriptive templates,
  forbidden file lists) that exceed what's available in community documentation.
  This suggests the repo-analysis skill should start from local patterns and
  extend them, not import from community sources.

- **Code-Survey's "treat LLM as survey participant" framing** offers a useful
  mental model for structured analysis: instead of asking "analyze this repo,"
  design survey questions, have the LLM complete them, then have an expert
  sample-check the results. This reduces hallucination risk for
  categorical/classification findings.

- **Anthropic's "let Claude interview you" pattern** (for feature development)
  has an analog for repo analysis: instead of asking Claude to analyze a repo,
  have Claude interview the codebase by asking questions about it, then produce
  findings. This grounds the analysis in actual file reads rather than
  inference.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 3
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The high confidence derives primarily from: (1) Anthropic's official
documentation on codebase exploration being directly applicable and current; (2)
local codebase artifacts being ground-truth evidence of working patterns; (3)
academic papers with methodology descriptions; (4) convergent evidence across
independent sources for the core patterns.
