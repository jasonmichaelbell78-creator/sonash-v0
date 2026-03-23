# Determination Phase Analysis

<!-- prettier-ignore-start -->
**Date:** 2026-03-20
**Phase:** Discovery (distilled from Research phase)
**Source Reports:** DOMAIN_AGNOSTIC_DESIGN, ORCHESTRATION_PATTERNS, CUSTOM_AGENT_DESIGN, GAP_ANALYSIS, SYNTHESIS
<!-- prettier-ignore-end -->

---

## Purpose

The determination phase is the critical first step in any research invocation.
It classifies the incoming query along multiple axes to select the correct
execution strategy. Getting determination wrong means the entire research
session wastes budget on the wrong approach.

---

## What Gets Determined

### 1. Question Type Classification

The research approach must change based on what is being asked, not just what
domain it falls in. Eight question types map to distinct research strategies:

| Question Type     | Example                   | Strategy                                            | Termination Condition                       |
| ----------------- | ------------------------- | --------------------------------------------------- | ------------------------------------------- |
| **Factual**       | "What is X?"              | Direct lookup, 1-2 authoritative sources            | Single verified answer found                |
| **Descriptive**   | "How does X work?"        | Multi-source synthesis, official docs priority      | Coherent explanation assembled              |
| **Comparative**   | "X vs Y?"                 | Structured matrix, same criteria applied to both    | All comparison dimensions populated         |
| **Evaluative**    | "Should we use X?"        | Pros/cons, tradeoff analysis, context-dependent     | Decision framework with clear tradeoffs     |
| **Exploratory**   | "What exists in space X?" | Broad survey, landscape mapping, categorization     | Diminishing returns on new categories       |
| **Investigative** | "Why did X happen?"       | Causal chain analysis, timeline, evidence weighting | Root cause identified with evidence chain   |
| **Predictive**    | "What will happen if X?"  | Trend analysis, scenario modeling, precedent study  | Scenarios enumerated with confidence levels |
| **Relational**    | "How does X affect Y?"    | Cross-domain synthesis, causal mapping              | Mechanism identified with evidence          |

**Key insight from Perplexity:** Deep Research performs 3-5 sequential searches
to refine queries as it learns what data is missing. The question type
determines the _shape_ of the iteration -- factual questions converge in 1-2
rounds, while investigative questions may require 5+ rounds of hypothesis
refinement.

**Key insight from intelligence analysis (ACH):** Evaluative and investigative
questions benefit from the Analysis of Competing Hypotheses approach --
enumerate all possible answers first, then seek _disconfirming_ evidence rather
than confirming evidence. This reduces confirmation bias regardless of domain.

### 2. Domain Detection

Domain affects three things: **where to look**, **how to verify**, and **how to
present findings**. The underlying research process stays the same.

**Recommended approach: Adaptive detection**

1. Start with a lightweight classification prompt that outputs domain(s) +
   confidence
2. If confidence is high (>0.8), proceed with inferred domain
3. If confidence is low or multi-domain, either ask the user or treat as
   cross-domain
4. Re-evaluate domain classification after the first search round (new evidence
   may clarify)

**Practical domain taxonomy:**

```
DOMAINS:
  technology/
    software-engineering
    infrastructure-devops
    ai-ml
    security-cybersecurity
  academic/
    natural-sciences
    social-sciences
    humanities
  medical-health/
    clinical, public-health, pharmaceutical
  legal-regulatory/
    statutory-law, case-law, regulatory-compliance
  finance-markets/
    investment, fintech, macroeconomics
  business/
    competitive-intelligence, market-research, strategy
  general/
    current-events, historical, cross-domain
```

Each domain tunes: source authority map, verification depth, output format, and
staleness thresholds.

### 3. Depth Level Selection

| Depth          | Token Budget | Est. Cost    | Agents   | Search Rounds | Auto-Select When                   |
| -------------- | ------------ | ------------ | -------- | ------------- | ---------------------------------- |
| Quick          | 80K          | $0.50-$1     | 1 (solo) | 1             | Factual question, single-domain    |
| Standard       | 300K         | $2-$5        | 2-3      | 2-3           | Typical technical question         |
| Deep           | 600K         | $5-$12       | 3-4      | 3-5           | Multi-faceted, high-stakes         |
| **Exhaustive** | **1.2M+**    | **$12-$25+** | **4-5**  | **5-8**       | **Default per overkill principle** |

**Critical design note:** Per the core design principle, **Exhaustive is the
default depth.** Quick/Standard/Deep are opt-in downgrades. Even Quick mode
should exceed competitors' deep mode in thoroughness.

Auto-selection heuristics (when user does not specify depth):

- Factual + single-domain -> Quick (unless user says otherwise)
- Descriptive/Comparative + single-domain -> Standard
- Evaluative/Exploratory + multi-domain -> Deep
- Investigative/Predictive OR user says "overkill" -> Exhaustive
- **Default when ambiguous: Exhaustive** (per core principle)

### 4. Decomposition Strategy

Based on question type and domain, select the decomposition approach:

| Question Type | Recommended Decomposition                 | Sub-Question Count |
| ------------- | ----------------------------------------- | ------------------ |
| Factual       | No decomposition (direct answer)          | 1                  |
| Descriptive   | Top-down by aspects                       | 3-5                |
| Comparative   | By comparison dimensions                  | 4-8                |
| Evaluative    | By decision criteria                      | 5-8                |
| Exploratory   | Bottom-up clustering + top-down structure | 8-15               |
| Investigative | Tree-of-reasoning                         | 5-10               |
| Predictive    | By scenario + by factor                   | 5-10               |
| Relational    | By mechanism + by impact area             | 5-8                |

For Deep/Exhaustive depths, apply MECE (Mutually Exclusive, Collectively
Exhaustive) validation to ensure sub-questions cover the full space without
overlap.

---

## Determination Phase Flow

```
User query arrives
  |
  |-- Step 1: Classify question type (8 types)
  |     Lightweight prompt: ~200 tokens
  |     Output: type + confidence
  |
  |-- Step 2: Detect domain (adaptive)
  |     Keyword/entity extraction + topic classification
  |     Output: domain(s) + confidence
  |     If low confidence: ask user
  |
  |-- Step 3: Select depth level
  |     Apply auto-selection heuristics
  |     Output: depth + token budget + agent count
  |     Default: Exhaustive
  |
  |-- Step 4: Decompose into sub-questions
  |     Apply decomposition strategy matching question type
  |     Generate MECE sub-questions
  |     Output: research plan with sub-queries + source strategy
  |
  |-- Step 5: Present plan to user for approval
  |     Show: question type, domain, depth, sub-questions, cost estimate
  |     User can: approve, modify depth, add/remove sub-questions, redirect
  |
  |-- Step 6: Proceed to research execution
```

### Plan Approval Gate

Following the Gemini Deep Research pattern, the research plan is shown to the
user before execution begins. This serves multiple purposes:

1. Catches misunderstandings early (wrong interpretation of the question)
2. Allows user to inject domain knowledge ("also check X")
3. Provides cost transparency (estimated token budget and dollar cost)
4. Respects CLAUDE.md guardrail #2 (never implement without explicit approval)

For the solo developer context, the gate should be lightweight: show plan,
accept modifications, proceed. Not an interrogation.

---

## Contrarian Considerations

### Determination overhead

For quick lookups, the determination phase itself may cost more tokens than the
research. Consider a fast path: if the query is clearly factual and
single-domain (detected by simple pattern matching, not LLM classification),
skip the full determination and go directly to Quick mode.

### Over-classification risk

Domain detection can be wrong, and wrong domain classification biases the entire
research session. The system must be tolerant of misclassification -- use domain
to _tune_ behavior, not to _switch algorithms_. A misclassified domain should
produce slightly suboptimal source selection, not fundamentally wrong research.

### The "I know what I want" user

Power users who invoke
`/deep-research --depth=standard --domain=technology "How does X work?"` should
bypass determination entirely. All determination outputs should be overridable
via flags.

---

## Open Questions

1. Should determination be a separate lightweight model call (Haiku) or inline
   in the orchestrator (Opus)? Cost vs accuracy tradeoff.
2. How should multi-domain queries be handled? Research each domain separately
   then merge? Or treat as a single cross-domain investigation?
3. Should the plan approval gate be skippable via `--auto` flag for automated
   pipeline usage (e.g., when deep-plan invokes deep-research)?
