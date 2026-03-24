# Cross-Reference Audit: Deep Research Skill

<!-- prettier-ignore-start -->
| Field        | Value                                                          |
| ------------ | -------------------------------------------------------------- |
| Status       | COMPLETE                                                       |
| Last Updated | 2026-03-20                                                     |
| Reports Audited | 21 (all files in research directory)                        |
| Purpose      | Consistency matrix, contradiction report, citation analysis    |
<!-- prettier-ignore-end -->

---

## A. Convergence Matrix

Major design decisions and which reports agree or disagree.

| #   | Decision                                                          | Reports That Agree                                                                                                                                                | Reports That Disagree / Nuance                                                                                                                                                                                                         | Confidence                                                                                                                                                               |
| --- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Orchestrator-workers is the right multi-agent topology**        | ORCHESTRATION_PATTERNS, MULTI_AGENT_PATTERNS, INDUSTRY_LANDSCAPE, CUSTOM_AGENT_DESIGN, EXISTING_TOOLS_LANDSCAPE, CONVERGENCE_IN_RESEARCH, SELF_AUDIT_ARCHITECTURE | CONTRARIAN_ANALYSIS (accepts topology IF multi-agent is used, but questions whether multi-agent is necessary at all)                                                                                                                   | HIGH (8 reports converge; contrarian challenge is valid but about a different axis)                                                                                      |
| 2   | **3-5 agents is the optimal count**                               | MULTI_AGENT_PATTERNS, ORCHESTRATION_PATTERNS, CUSTOM_AGENT_DESIGN, COST_TOKEN_ECONOMICS                                                                           | CONTRARIAN_ANALYSIS (weakened: task-dependent, gap narrowing over time), CORE_DESIGN_PRINCIPLE (contradicts: "More agents, not fewer... launch 5 if 3 might suffice")                                                                  | MEDIUM (convergent from research, but user directive explicitly overrides)                                                                                               |
| 3   | **File-based state (JSONL + JSON) for persistence**               | ORCHESTRATION_PATTERNS, ERROR_RECOVERY_RESILIENCE, RESEARCH_MEMORY_LEARNING, DOWNSTREAM_INTEGRATION, CONVERGENCE_IN_RESEARCH, CUSTOM_AGENT_DESIGN                 | None                                                                                                                                                                                                                                   | HIGH (universal agreement, no dissent, matches codebase patterns)                                                                                                        |
| 4   | **Progressive disclosure in 3 layers (summary, report, sources)** | UX_OUTPUT_PATTERNS, ORCHESTRATION_PATTERNS, DOWNSTREAM_INTEGRATION, QUALITY_EVALUATION                                                                            | None                                                                                                                                                                                                                                   | HIGH (validated by commercial tool analysis and UX research)                                                                                                             |
| 5   | **Inline numbered citations [N] as standard**                     | UX_OUTPUT_PATTERNS, SOURCE_VERIFICATION, DOMAIN_AGNOSTIC_DESIGN, QUALITY_EVALUATION                                                                               | None                                                                                                                                                                                                                                   | HIGH (universal in production tools; empirical finding)                                                                                                                  |
| 6   | **Model tiering (Opus orchestrator + Sonnet workers)**            | COST_TOKEN_ECONOMICS, MULTI_AGENT_PATTERNS, CUSTOM_AGENT_DESIGN                                                                                                   | CONTRARIAN_ANALYSIS (questions whether multi-agent is needed; simpler approach may suffice)                                                                                                                                            | HIGH (well-grounded in pricing data and production patterns)                                                                                                             |
| 7   | **Confidence levels: HIGH/MEDIUM/LOW scale**                      | SOURCE_VERIFICATION, QUALITY_EVALUATION, DOMAIN_AGNOSTIC_DESIGN, GAP_ANALYSIS, DOWNSTREAM_INTEGRATION, CONVERGENCE_IN_RESEARCH                                    | UX_OUTPUT_PATTERNS (recommends verbal hedging over any numeric/categorical scale for user-facing output)                                                                                                                               | MEDIUM (internal tracking = categorical scale; user-facing = verbal hedging. Not a true contradiction but a nuance)                                                      |
| 8   | **CRAAP+SIFT as domain-agnostic source evaluation**               | DOMAIN_AGNOSTIC_DESIGN, SOURCE_VERIFICATION                                                                                                                       | CONTRARIAN_ANALYSIS (acknowledges as "good default" but not a universal solution for specialized domains like legal/medical)                                                                                                           | MEDIUM (sound as a baseline; insufficient alone for some domains)                                                                                                        |
| 9   | **Iterative plan-search-synthesize loop (ReAct pattern)**         | ORCHESTRATION_PATTERNS, INDUSTRY_LANDSCAPE, DOMAIN_AGNOSTIC_DESIGN, EXISTING_TOOLS_LANDSCAPE, MULTI_AGENT_PATTERNS                                                | None                                                                                                                                                                                                                                   | HIGH (universal across all production systems studied)                                                                                                                   |
| 10  | **Query sanitization for security**                               | SECURITY_PRIVACY                                                                                                                                                  | CONTRARIAN_ANALYSIS (validates as genuinely novel and important)                                                                                                                                                                       | HIGH (unique contribution; well-grounded in real incidents)                                                                                                              |
| 11  | **Progressive synthesis (not batch)**                             | ORCHESTRATION_PATTERNS, CONVERGENCE_IN_RESEARCH, ERROR_RECOVERY_RESILIENCE                                                                                        | None                                                                                                                                                                                                                                   | HIGH (reduces context pressure, catches gaps early, produces partial results on interruption)                                                                            |
| 12  | **Skill-as-orchestrator (not separate orchestrator agent)**       | CUSTOM_AGENT_DESIGN, GAP_ANALYSIS                                                                                                                                 | MULTI_AGENT_PATTERNS (describes orchestrator as an agent role, not a skill), CORE_DESIGN_PRINCIPLE (implies heavier agent infrastructure)                                                                                              | MEDIUM (CUSTOM_AGENT_DESIGN's analysis of codebase patterns is most authoritative here)                                                                                  |
| 13  | **Domain detection tunes parameters, not algorithms**             | DOMAIN_AGNOSTIC_DESIGN                                                                                                                                            | CONTRARIAN_ANALYSIS (challenges directly: legal, medical, and security require different reasoning patterns, not just different source lists), OUTSIDE_THE_BOX (agrees implicitly by proposing domain-specific methodologies)          | LOW (the strongest challenge in the entire corpus; DOMAIN_AGNOSTIC_DESIGN acknowledges the issue in its source authority tables but underestimates it in its conclusion) |
| 14  | **Multi-agent is always better than single-agent for research**   | ORCHESTRATION_PATTERNS, MULTI_AGENT_PATTERNS, INDUSTRY_LANDSCAPE, CUSTOM_AGENT_DESIGN, CONVERGENCE_IN_RESEARCH                                                    | CONTRARIAN_ANALYSIS (Groupthink Alert #1: no report tested the null hypothesis of a well-budgeted single agent with extended thinking), OUTSIDE_THE_BOX ("Smart Prompting" approach)                                                   | LOW (the most significant unresolved question; no empirical comparison exists for this specific use case)                                                                |
| 15  | **Convergence loops are reliable for verification**               | CONVERGENCE_IN_RESEARCH, SELF_AUDIT_ARCHITECTURE, QUALITY_EVALUATION                                                                                              | CONTRARIAN_ANALYSIS (Groupthink Alert #2: same-model verification has documented biases -- self-preference, verbosity, position bias), OUTSIDE_THE_BOX (notes human-in-the-loop as the only thing that catches errors LLM judges miss) | LOW (fundamental limitation acknowledged but no alternative proposed that is cost-feasible within a CLI tool)                                                            |
| 16  | **Exhaustive depth as default mode**                              | CORE_DESIGN_PRINCIPLE                                                                                                                                             | CONTRARIAN_ANALYSIS (R6: "Add a Simple Mode that skips all verification"), COST_TOKEN_ECONOMICS (Quick mode at $0.50-$1.00 vs Exhaustive at $12-$25), OUTSIDE_THE_BOX ("What if less research is better?")                             | SPECIAL (user directive overrides efficiency-first assumptions; design must support both)                                                                                |
| 17  | **Mid-stream human steering is essential**                        | OUTSIDE_THE_BOX (Must-have #1), UX_OUTPUT_PATTERNS (OpenAI's interrupt-and-redirect)                                                                              | No report disagrees, but 8 of 10 original reports completely omit this dimension                                                                                                                                                       | HIGH (strong user experience evidence; critical differentiation)                                                                                                         |
| 18  | **Project context injection is the #1 differentiator**            | OUTSIDE_THE_BOX, GAP_ANALYSIS (Gap #3: research + codebase integration), DOWNSTREAM_INTEGRATION                                                                   | None                                                                                                                                                                                                                                   | HIGH (unique capability vs. Perplexity/Gemini/OpenAI; universally agreed)                                                                                                |
| 19  | **Serendipity register for unexpected findings**                  | OUTSIDE_THE_BOX                                                                                                                                                   | No disagreement but no other report mentions it                                                                                                                                                                                        | MEDIUM (low implementation cost, high differentiation; single-source recommendation)                                                                                     |
| 20  | **Budget-first design with 60/20/10/10 split**                    | COST_TOKEN_ECONOMICS                                                                                                                                              | CORE_DESIGN_PRINCIPLE (cost is "managed but not minimized at the expense of coverage")                                                                                                                                                 | MEDIUM (budget structure is sound; the allocation percentages may need adjustment for the "overkill" directive)                                                          |

---

## B. Contradiction Report

### Contradiction 1: Agent Count Recommendation vs. "Overkill" Directive

**MULTI_AGENT_PATTERNS says:**

> "2-5 agents is the production-tested sweet spot (Anthropic docs: '2-5
> teammates with 5-6 tasks per teammate')" "Saturation threshold at ~4 agents"

**CORE_DESIGN_PRINCIPLE says:**

> "Agent count should err high -- launch 5 searchers if 3 might suffice" "More
> agents, not fewer. Cast a wider net than seems necessary."

**Resolution recommendation:** The CORE_DESIGN_PRINCIPLE is a user directive
that overrides efficiency-focused recommendations. The architecture should
support dynamic agent scaling (2-5 as default, with "overkill" mode allowing
5-7). The diminishing returns research is valid for default behavior; the user
directive defines the upper bound for exhaustive mode.

---

### Contradiction 2: Cost Savings Attribution (45.6-65.8%)

**MULTI_AGENT_PATTERNS says:**

> "Bayesian-optimized hybrid teams achieve 65.8% cost savings over homogeneous
> baselines" (cited under arxiv 2508.02694, "Efficient Agents")

**CONTRARIAN_ANALYSIS says:**

> "The reports misattribute this statistic. MULTI_AGENT_PATTERNS.md cites it
> under the paper entry for arxiv 2508.02694 ('Efficient Agents'), but that
> paper actually reports a 28.4% cost improvement. The 45.6-65.8% figure comes
> from MALBO (a separate, different paper)."

**COST_TOKEN_ECONOMICS says:**

> "MALBO framework, RouteLLM benchmarks" -- correctly attributes to MALBO but
> also cites 2508.02694

**Resolution recommendation:** This is a confirmed citation error. The
45.6-65.8% figure is from the MALBO paper (ResearchGate), not from arxiv
2508.02694 ("Efficient Agents"). The actual Efficient Agents paper reports 28.4%
savings. MULTI_AGENT_PATTERNS and COST_TOKEN_ECONOMICS should be corrected. The
general principle (model tiering saves significant cost) remains valid; the
specific number attribution is wrong.

---

### Contradiction 3: Confidence Communication Format

**UX_OUTPUT_PATTERNS says:**

> "Numeric confidence scores create false precision. Telling a user '82%
> confident' implies a level of calibration that LLMs don't possess." "Never
> show numeric confidence scores."

**SOURCE_VERIFICATION says:**

> Defines a hybrid three-level scale (HIGH/MEDIUM/LOW) with mandatory evidence
> qualifiers

**QUALITY_EVALUATION says:**

> Defines calibration error metrics: "Abs(stated confidence - verified accuracy)
> < 0.15"

**Resolution recommendation:** No true contradiction -- these address different
audiences. UX_OUTPUT_PATTERNS addresses user-facing output (verbal hedging +
symbols). SOURCE_VERIFICATION and QUALITY_EVALUATION address internal quality
tracking (categorical + numeric for calibration). The design should use
categorical confidence internally and verbal hedging externally.

---

### Contradiction 4: Domain-Agnostic vs. Domain-Specific Design

**DOMAIN_AGNOSTIC_DESIGN says:**

> "The system should detect domain to tune parameters, not to switch
> algorithms." "The underlying research process (plan, search, evaluate,
> synthesize) stays the same."

**CONTRARIAN_ANALYSIS says:**

> "Legal research requires jurisdiction-specific precedent chain analysis,
> Shepardization... These are not parameter tweaks -- they are entirely
> different research processes." "Medical research requires evidence grading
> (GRADE framework), clinical trial phase awareness, FDA approval status
> tracking" "Security research requires CVE correlation, CVSS scoring, affected
> version range analysis"

**OUTSIDE_THE_BOX says:**

> Proposes domain-specific methodologies (detective work for investigative
> questions, archaeological reconstruction for fragmentary evidence, foresight
> for predictive questions)

**Resolution recommendation:** CONTRARIAN_ANALYSIS's challenge is valid. The
DOMAIN_AGNOSTIC_DESIGN's CRAAP+SIFT framework and pluggable YAML modules work
well for technology and general research but are insufficient for legal,
medical, and security domains. The design should: (a) use CRAAP+SIFT as the
universal baseline, (b) allow domain modules to override research behavior
(reasoning patterns, not just source lists), (c) explicitly acknowledge this
limitation for v1 and plan domain-specific paths as future work.

---

### Contradiction 5: Simple MVP vs. Full-Featured System

**CONTRARIAN_ANALYSIS says:**

> "A simpler approach that captures most of the value: 1. Single orchestrator
> skill, 2. 2-3 parallel subagent Task calls using WebSearch + WebFetch, 3.
> Single synthesis pass, 4. Confidence levels based on source count, 5. Markdown
> output to file. This could be built in 200-400 lines."

**CORE_DESIGN_PRINCIPLE says:**

> "Exhaustive is the default depth." "Mandatory Phases: Contrarian agent,
> Outside-the-box agent, Self-audit, Cross-reference verification"

**Resolution recommendation:** Both are valid for their contexts. The design
must support a spectrum from simple (Quick mode, ~200 lines of logic) to
exhaustive (all phases, ~2,000+ lines). The key architectural decision is: build
the simple core first with clean extension points, then layer in the advanced
features. This satisfies both the contrarian's "start simple" advice and the
user's "overkill by default" directive.

---

### Contradiction 6: Number of Custom Agents to Build

**CUSTOM_AGENT_DESIGN says:**

> "3 custom agents -- decomposer (NO, inline), searcher-analyzer (YES),
> synthesizer (YES)" = 2 custom agents + skill orchestrator
> "deep-research-verifier: MAYBE -- leaning NO" "deep-research-critic: NO. This
> is a convergence-loop pass."

**CORE_DESIGN_PRINCIPLE says:**

> "Mandatory Phases: Contrarian agent, Outside-the-box agent, Self-audit,
> Cross-reference verification"

**SELF_AUDIT_ARCHITECTURE says:**

> Defines a mandatory multi-dimensional audit phase with potentially multiple
> audit agents

**Resolution recommendation:** CUSTOM_AGENT_DESIGN's analysis of the codebase
patterns is the most grounded. The "mandatory phases" from CORE_DESIGN_PRINCIPLE
can be implemented as convergence-loop presets and prompt-driven passes within
the existing infrastructure, not as additional custom agents. This keeps
maintenance burden manageable while delivering the thoroughness the user
directive requires.

---

### Contradiction 7: 82% MCP Path Traversal Statistic

**SECURITY_PRIVACY says:**

> "Among 2,614 MCP implementations analyzed, 82% use file system operations
> prone to path traversal"

**CONTRARIAN_ANALYSIS says:**

> "The stat measures exposure surface, not confirmed vulnerabilities... 30 CVEs
> across 2,614 implementations is a 1.1% confirmed vulnerability rate, not 82%."

**Resolution recommendation:** CONTRARIAN_ANALYSIS is correct. The 82% describes
potential attack surface (implementations that use filesystem operations), not
confirmed vulnerabilities. SECURITY_PRIVACY should be read as "82% have
filesystem-operation exposure" not "82% are vulnerable." The distinction matters
for risk assessment: the actual confirmed vulnerability rate is much lower, but
the exposure surface is real.

---

### Contradiction 8: 90.2% Multi-Agent Improvement Statistic

**MULTI_AGENT_PATTERNS says:**

> "Anthropic's system achieved 90.2% improvement over single-agent baselines
> with Claude Opus 4 as orchestrator and Claude Sonnet 4 as subagents."

**ORCHESTRATION_PATTERNS says:**

> "90.2% improvement over single-agent Claude Opus 4"

**CONTRARIAN_ANALYSIS says:**

> "This is vendor marketing, not independent research. The eval is internal and
> not publicly available. The methodology is not peer-reviewed... the blog also
> states 'token usage explains 80% of performance variance' -- meaning the
> multi-agent system may perform better primarily because it spends more
> tokens."

**Resolution recommendation:** The 90.2% figure should be cited with appropriate
caveats: it is from Anthropic's own blog, the eval methodology is not published,
and the token-spend confound is significant. It should not be used as a basis
for architectural decisions without independent verification. The figure appears
in 3+ reports without caveats -- this is an echo chamber effect.

---

## C. Citation Overlap Analysis

### Source Frequency (cited in 3+ reports)

| Source                                                                      | Reports Citing It                                                                                                                                        | Type                               |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Anthropic: "How we built our multi-agent research system"                   | ORCHESTRATION_PATTERNS, MULTI_AGENT_PATTERNS, INDUSTRY_LANDSCAPE, CONTRARIAN_ANALYSIS, COST_TOKEN_ECONOMICS, DOMAIN_AGNOSTIC_DESIGN, CUSTOM_AGENT_DESIGN | Vendor blog (7 reports)            |
| Google/MIT: "Towards a Science of Scaling Agent Systems" (arxiv 2512.08296) | MULTI_AGENT_PATTERNS, CONTRARIAN_ANALYSIS, ORCHESTRATION_PATTERNS                                                                                        | Academic paper (3 reports)         |
| Stanford STORM                                                              | ORCHESTRATION_PATTERNS, MULTI_AGENT_PATTERNS, INDUSTRY_LANDSCAPE, DOMAIN_AGNOSTIC_DESIGN                                                                 | Academic + open-source (4 reports) |
| OpenAI: "Introducing Deep Research"                                         | ORCHESTRATION_PATTERNS, MULTI_AGENT_PATTERNS, INDUSTRY_LANDSCAPE, UX_OUTPUT_PATTERNS                                                                     | Vendor announcement (4 reports)    |
| ByteByteGo: "How OpenAI, Gemini, and Claude Use Agents"                     | ORCHESTRATION_PATTERNS, MULTI_AGENT_PATTERNS, DOMAIN_AGNOSTIC_DESIGN                                                                                     | Analysis article (3 reports)       |
| Salesforce Enterprise Deep Research                                         | MULTI_AGENT_PATTERNS, INDUSTRY_LANDSCAPE                                                                                                                 | Vendor/academic (2 reports)        |
| MAST study (UC Berkeley, arxiv 2503.13657)                                  | MULTI_AGENT_PATTERNS                                                                                                                                     | Academic (1 report, but critical)  |
| LangGraph/LangChain Open Deep Research                                      | ORCHESTRATION_PATTERNS, MULTI_AGENT_PATTERNS, INDUSTRY_LANDSCAPE, EXISTING_TOOLS_LANDSCAPE                                                               | Framework docs (4 reports)         |
| JELS: "Hallucination-Free? AI Legal Research Tools"                         | DOMAIN_AGNOSTIC_DESIGN, CONTRARIAN_ANALYSIS, OUTSIDE_THE_BOX                                                                                             | Academic (3 reports)               |

### Unique Source Counts by Report

| Report                    | Approximate Unique Sources | Shared Sources (w/ other reports) | Independence Score                                                            |
| ------------------------- | -------------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| ORCHESTRATION_PATTERNS    | 20                         | 8                                 | Medium                                                                        |
| MULTI_AGENT_PATTERNS      | 35+                        | 10                                | Medium-High                                                                   |
| INDUSTRY_LANDSCAPE        | 45+                        | 8                                 | HIGH (broadest source base)                                                   |
| DOMAIN_AGNOSTIC_DESIGN    | 25+                        | 5                                 | HIGH (draws from intelligence analysis, OSINT, consulting, library science)   |
| EXISTING_TOOLS_LANDSCAPE  | 30+                        | 6                                 | HIGH (unique MCP server and API sources)                                      |
| UX_OUTPUT_PATTERNS        | 35                         | 3                                 | HIGH (unique UX research, user experience studies)                            |
| CONVERGENCE_IN_RESEARCH   | 0 (internal analysis)      | 0                                 | N/A (analyzes existing skill, no external sources)                            |
| SECURITY_PRIVACY          | 15+                        | 2                                 | HIGH (unique security research, privacy studies)                              |
| QUALITY_EVALUATION        | 15+                        | 3                                 | HIGH (unique eval frameworks: DRACO, ResearchRubrics, G-Eval)                 |
| COST_TOKEN_ECONOMICS      | 15+                        | 4                                 | HIGH (unique pricing data, economic analysis)                                 |
| CONTRARIAN_ANALYSIS       | 14                         | 6                                 | MEDIUM (deliberately re-examined same sources as originals)                   |
| OUTSIDE_THE_BOX           | 25+                        | 3                                 | HIGH (uniquely draws from archaeology, forensics, foresight, design thinking) |
| CORE_DESIGN_PRINCIPLE     | 0                          | 0                                 | N/A (user directive, no external sources)                                     |
| CUSTOM_AGENT_DESIGN       | 0 (codebase analysis)      | 0                                 | N/A (internal analysis)                                                       |
| DOWNSTREAM_INTEGRATION    | 0 (codebase analysis)      | 0                                 | N/A (internal analysis)                                                       |
| GAP_ANALYSIS              | 0 (codebase analysis)      | 0                                 | N/A (internal analysis)                                                       |
| ERROR_RECOVERY_RESILIENCE | 5+                         | 2                                 | MEDIUM                                                                        |
| RESEARCH_MEMORY_LEARNING  | 5+                         | 1                                 | HIGH (unique memory architecture sources)                                     |
| SELF_AUDIT_ARCHITECTURE   | 10+                        | 3                                 | HIGH (unique audit/calibration research)                                      |
| SOURCE_REGISTRY_DESIGN    | 5+ (codebase + external)   | 2                                 | MEDIUM                                                                        |
| SOURCE_VERIFICATION       | 15+                        | 4                                 | HIGH (unique verification and calibration research)                           |

### Echo Chamber Risk Assessment

**RISK: MEDIUM-HIGH for multi-agent architecture claims.**

The Anthropic blog post is cited in 7 of 21 reports. The Google/MIT scaling
paper appears in 3. The STORM paper appears in 4. These three sources form the
evidentiary backbone of the multi-agent architecture recommendations. The
CONTRARIAN_ANALYSIS correctly identifies this:

> "All 10 research agents had access to the same WebSearch tool and likely
> received similar search results. When 10 agents all search for 'multi-agent
> research architecture' and get the same top results (Anthropic's blog,
> Google/MIT paper, STORM), they will converge on the same conclusions. This is
> not independent validation -- it is 10 readings of the same sources."

**RISK: LOW for domain-specific and specialized topics.**

Reports covering UX patterns, security, cost economics, quality evaluation,
source verification, and outside-the-box thinking each draw from largely unique
source pools. These represent genuine independent research threads with minimal
overlap.

**RISK: MEDIUM for training-data circularity.**

The CONTRARIAN_ANALYSIS raises a valid meta-concern: when LLM agents search for
information about multi-agent AI systems, the results they find were largely
written by AI companies selling multi-agent frameworks. This creates a
self-reinforcing consensus that may not reflect engineering reality.

---

## D. Contrarian Integration

The CONTRARIAN_ANALYSIS identified 5 challenged claims and 4 groupthink alerts.
Assessment of each:

### Challenged Claim 1: "3-5 agents is the optimal count"

- **Challenge validity:** VALID. The number is task-dependent and the gap
  between multi-agent and single-agent is narrowing.
- **Original reports needing correction:** MULTI_AGENT_PATTERNS,
  ORCHESTRATION_PATTERNS should add the caveat that this is task-dependent and
  may shrink as models improve.
- **Corrected finding:** 3-5 agents is a defensible starting range for
  parallelizable research tasks, but the optimal count depends on task structure
  and model capability. Design for dynamic scaling, not a fixed number.

### Challenged Claim 2: "45.6-65.8% cost savings from hybrid teams"

- **Challenge validity:** VALID -- confirmed citation error.
- **Original reports needing correction:** MULTI_AGENT_PATTERNS (misattributes
  to arxiv 2508.02694), COST_TOKEN_ECONOMICS (correctly attributes to MALBO but
  also cross-references 2508.02694).
- **Corrected finding:** MALBO reports up to 65.8% savings in
  maximum-performance configurations. The actual "Efficient Agents" paper
  (2508.02694) reports 28.4% savings. The general principle is correct; the
  specific numbers were conflated.

### Challenged Claim 3: "82% of MCP implementations have path traversal vulnerabilities"

- **Challenge validity:** VALID -- the 82% describes exposure surface, not
  confirmed vulnerabilities.
- **Original reports needing correction:** SECURITY_PRIVACY should clarify "82%
  use filesystem operations prone to path traversal" (exposure) vs. the 1.1%
  confirmed vulnerability rate.
- **Corrected finding:** 82% of MCP implementations use filesystem operations
  that create potential path traversal attack surface. The confirmed
  vulnerability rate (30 CVEs / 2,614 implementations) is approximately 1.1%.
  Both numbers are relevant: the exposure surface justifies caution, the
  confirmed rate calibrates the actual risk.

### Challenged Claim 4: "Centralized coordination reduces error amplification from 17.2x to 4.4x"

- **Challenge validity:** PARTIALLY VALID. The paper is real and
  methodologically sound, but the 17.2x figure is for a worst-case "bag of
  agents" topology (a strawman), and applicability to research-specific tasks is
  unverified.
- **Original reports needing correction:** MULTI_AGENT_PATTERNS should note the
  17.2x is worst-case "bag of agents" (which nobody would deploy), and the
  benchmarks are general agentic tasks, not research-specific.
- **Corrected finding:** Centralized coordination demonstrably reduces error
  amplification vs. unstructured agent architectures. The 4.4x figure for
  centralized systems is the actionable number. The 17.2x comparison point is a
  worst-case strawman.

### Challenged Claim 5: "90.2% improvement over single-agent baselines"

- **Challenge validity:** VALID. Vendor marketing, opaque methodology,
  token-spend confound.
- **Original reports needing correction:** MULTI_AGENT_PATTERNS,
  ORCHESTRATION_PATTERNS should cite with caveats: vendor-reported, internal
  eval, token-spend confound.
- **Corrected finding:** Anthropic reports 90.2% improvement in their internal
  eval. This is a single vendor's self-reported result with unpublished
  methodology. The token-spend explanation (80% of variance) suggests the
  improvement may be primarily a function of compute budget, not multi-agency
  per se.

### Groupthink Alert 1: "Multi-agent is always better"

- **Assessment:** VALID concern. No report tested the null hypothesis. The
  design should include a simple single-agent mode for benchmarking.

### Groupthink Alert 2: "Convergence loops are reliable verification"

- **Assessment:** VALID concern. Same-model verification has documented biases.
  The design should acknowledge this limitation, consider cross-model
  verification where feasible, and treat convergence loops as a filter, not a
  guarantee.

### Groupthink Alert 3: "Domain detection tunes parameters, not algorithms"

- **Assessment:** VALID challenge. Already addressed in Contradiction #4 above.

### Groupthink Alert 4: "More tools make research better"

- **Assessment:** PARTIALLY VALID. The EXISTING_TOOLS_LANDSCAPE appropriately
  prioritizes (P0-P5), but the sheer number of recommended integrations (22+)
  creates real maintenance burden. The design should start with WebSearch +
  WebFetch (already available) and add tools only when specific quality failures
  demand them.

---

## E. Strongest Findings

Claims supported by 3+ independent reports with diverse sources. These are
highest-confidence inputs for the design.

### Finding 1: The plan-search-synthesize iterative loop is the universal research pattern

- **Supporting reports:** ORCHESTRATION_PATTERNS, INDUSTRY_LANDSCAPE,
  DOMAIN_AGNOSTIC_DESIGN, EXISTING_TOOLS_LANDSCAPE, MULTI_AGENT_PATTERNS
- **Source diversity:** Google Deep Research docs, OpenAI docs, Perplexity docs,
  Stanford STORM paper, Together AI blog, LangGraph framework, consulting
  methodology (MECE), intelligence analysis (ACH) -- 8+ independent source types
- **Why it is strong:** Convergence across production systems, open-source
  implementations, academic research, AND established non-AI research
  methodologies. The pattern predates LLMs (ACH, MECE, investigative journalism
  all use iterative cycles).

### Finding 2: File-based state persistence is the correct pattern for this environment

- **Supporting reports:** ORCHESTRATION_PATTERNS, ERROR_RECOVERY_RESILIENCE,
  RESEARCH_MEMORY_LEARNING, DOWNSTREAM_INTEGRATION, CONVERGENCE_IN_RESEARCH,
  CUSTOM_AGENT_DESIGN, GAP_ANALYSIS
- **Source diversity:** Codebase analysis (existing patterns), LangGraph state
  management, production failure analysis, memory architecture research -- 4+
  independent source types
- **Why it is strong:** Uniquely matches the codebase's existing infrastructure
  (JSONL logs, JSON state files, markdown artifacts). Every alternative
  (in-memory, cloud service, vector DB) has documented failure modes in this
  environment.

### Finding 3: Citation-forward output with inline numbered references is table stakes

- **Supporting reports:** UX_OUTPUT_PATTERNS, SOURCE_VERIFICATION,
  QUALITY_EVALUATION, DOMAIN_AGNOSTIC_DESIGN
- **Source diversity:** Commercial tool UX analysis (6 tools), academic UX
  research (Nielsen Norman Group, AI UX Design Guide), citation research
  (CiteCheck, SourceCheckup), library science frameworks -- 5+ independent
  source types
- **Why it is strong:** Empirical observation across every successful research
  tool. NotebookLM's source grounding reduces perceived hallucination from ~40%
  to ~13%. Perplexity's citation-forward design is its most praised feature.

### Finding 4: Progressive disclosure (summary then detail then sources) prevents overwhelm

- **Supporting reports:** UX_OUTPUT_PATTERNS, ORCHESTRATION_PATTERNS,
  DOWNSTREAM_INTEGRATION, QUALITY_EVALUATION
- **Source diversity:** Nielsen Norman Group research, AI UX Design Guide,
  commercial tool analysis (Perplexity, Gemini, OpenAI, Elicit), CLI-specific
  patterns (GitHub Copilot CLI, Aider) -- 4+ independent source types
- **Why it is strong:** Validated by both academic UX research and production
  implementation across 6+ commercial tools.

### Finding 5: The unique value proposition is contextual research that leads to action

- **Supporting reports:** OUTSIDE_THE_BOX, GAP_ANALYSIS, DOWNSTREAM_INTEGRATION
- **Source diversity:** Competitive analysis (Perplexity, Gemini, OpenAI
  capabilities), codebase gap analysis (current vs. needed capabilities),
  integration architecture analysis
- **Why it is strong:** Identifies capabilities external tools fundamentally
  cannot replicate: codebase access, project decision history, stack-specific
  filtering, code execution for empirical research, persistent project memory,
  downstream action pipeline. No external tool has any of these.

### Finding 6: Multi-agent research is expensive ($2-$15+ per session) and requires budget management

- **Supporting reports:** COST_TOKEN_ECONOMICS, MULTI_AGENT_PATTERNS,
  CONTRARIAN_ANALYSIS, ORCHESTRATION_PATTERNS
- **Source diversity:** API pricing data (March 2026 rates), production
  benchmarks, agent team research from this codebase, OpenAI Deep Research cost
  analysis -- 4+ independent source types
- **Why it is strong:** Grounded in concrete pricing data, not estimates. The
  60/20/10/10 budget allocation is derived from per-operation token
  measurements. Cost is the primary constraint that prevents "just add more
  agents."

### Finding 7: Query sanitization (treating outbound queries as sensitive intelligence) is a genuine novel contribution

- **Supporting reports:** SECURITY_PRIVACY, CONTRARIAN_ANALYSIS (validates as
  genuinely novel and important)
- **Source diversity:** Samsung ChatGPT incident, CyberHaven data (11% of
  employee data to ChatGPT is confidential), search provider profiling research,
  MCP security analysis -- 5+ independent source types
- **Why it is strong:** The CONTRARIAN_ANALYSIS -- whose purpose is to challenge
  claims -- explicitly validates this as one of the strongest contributions. The
  data classification framework (PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED) with
  source routing is practical and implementable.

---

## F. Reports with No External Source Overlap (Potential Independent Verification)

These reports share few or no sources with the rest of the corpus, suggesting
genuinely independent research threads:

1. **CONVERGENCE_IN_RESEARCH** -- Pure internal analysis of the existing
   convergence-loop skill applied to research. No external sources. Independent
   by construction.
2. **CUSTOM_AGENT_DESIGN** -- Pure codebase analysis of existing agent patterns.
   Independent by construction.
3. **GAP_ANALYSIS** -- Pure codebase audit. Independent by construction.
4. **DOWNSTREAM_INTEGRATION** -- Pure codebase integration mapping. Independent
   by construction.
5. **OUTSIDE_THE_BOX** -- Draws from uniquely different fields (archaeology,
   forensics, futures studies, philosophy of science, design thinking). Lowest
   source overlap with any other report.
6. **UX_OUTPUT_PATTERNS** -- Draws primarily from UX-specific research and
   commercial tool analysis with 35 unique sources, only 3 shared with other
   reports.
7. **SECURITY_PRIVACY** -- Draws primarily from security research with minimal
   overlap to the AI/agent literature that dominates other reports.

---

## G. Missing Reports Assessment

The CONTRARIAN_ANALYSIS noted that 5 planned reports did not exist. However, by
the time of this audit, **all 21 files exist on disk and contain substantive
content**:

- SOURCE_VERIFICATION -- EXISTS, comprehensive (verification approaches,
  confidence scoring, citation practices, conflict handling)
- GAP_ANALYSIS -- EXISTS, comprehensive (current landscape, 8 ranked capability
  gaps, tool utilization gaps)
- CUSTOM_AGENT_DESIGN -- EXISTS, comprehensive (agent pattern analysis,
  candidate roles, recommended architecture)
- SOURCE_REGISTRY_DESIGN -- EXISTS, comprehensive (complete source inventory,
  metadata schema, selection algorithm)
- RESEARCH_MEMORY_LEARNING -- EXISTS, comprehensive (three-tier memory
  architecture, overlap detection, staleness management)
- ERROR_RECOVERY_RESILIENCE -- EXISTS, comprehensive (10 failure modes cataloged
  with mitigations)

**Assessment:** The CONTRARIAN_ANALYSIS was written when only 10 reports
existed. Its R8 recommendation ("Account for the Missing Reports") is now moot
-- all 21 reports are complete.

---

## Version History

| Version | Date       | Description                    |
| ------- | ---------- | ------------------------------ |
| 1.0     | 2026-03-20 | Complete cross-reference audit |
