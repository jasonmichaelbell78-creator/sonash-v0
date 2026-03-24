# Cost & Token Economics for Deep Research

<!-- prettier-ignore-start -->
| Field        | Value                                                    |
| ------------ | -------------------------------------------------------- |
| Status       | COMPLETE                                                 |
| Last Updated | 2026-03-20                                               |
| Dimension    | Economic model: costs, budgets, tiering, caching, tradeoffs |
<!-- prettier-ignore-end -->

## Executive Summary

Multi-agent deep research is the most token-intensive operation a Claude Code
skill can perform. A single deep-research session with 3 subagents on
Opus/Sonnet easily consumes 400K-1.2M tokens, costing $2-$15+ depending on model
mix and depth. Without economic guardrails, costs spiral via retry loops,
redundant searches, and idle agent consumption.

Five economic principles govern the design:

1. **Model tiering is the single largest cost lever.** Routing orchestration to
   Opus and workers to Sonnet/Haiku saves 45-66% without measurable quality loss
   (MALBO framework, RouteLLM benchmarks).
2. **Budget-first design, not budget-as-afterthought.** Every research session
   must declare a token budget upfront, allocate it across phases, and terminate
   gracefully when approaching exhaustion.
3. **Caching is multiplicative.** Prompt caching (90% input cost reduction),
   within-session dedup (eliminate redundant searches), and cross-session
   knowledge persistence compound to cut total costs 60-80%.
4. **Depth levels create predictable cost tiers.** Quick ($0.50-$1), Standard
   ($2-$5), Deep ($5-$12), Exhaustive ($12-$25+) -- users choose the
   cost-quality tradeoff before research begins.
5. **Diminishing returns are steep.** Research quality plateaus after 3-5
   search-synthesize iterations. The third iteration adds ~15% new information;
   the fifth adds ~3%. Budget past the plateau is waste.

---

## 1. Token Cost Benchmarks

### 1.1 Per-Operation Token Costs

| Operation             | Input Tokens                   | Output Tokens             | Typical Cost (Sonnet) | Typical Cost (Opus) |
| --------------------- | ------------------------------ | ------------------------- | --------------------- | ------------------- |
| WebSearch query       | ~200 (prompt)                  | ~800 (results)            | $0.013                | $0.021              |
| WebFetch page read    | ~500 (prompt)                  | ~2,000-8,000 (content)    | $0.032-$0.12          | $0.053-$0.20        |
| Query decomposition   | ~2,000 (context)               | ~1,500 (plan)             | $0.029                | $0.048              |
| Subagent search task  | ~3,000 (prompt+context)        | ~4,000-12,000 (findings)  | $0.069-$0.19          | $0.12-$0.31         |
| Synthesis pass        | ~15,000-40,000 (all findings)  | ~5,000-15,000 (report)    | $0.12-$0.35           | $0.20-$0.45         |
| Verification/critique | ~10,000-25,000 (draft+sources) | ~2,000-5,000 (assessment) | $0.060-$0.15          | $0.10-$0.25         |
| Convergence loop pass | ~8,000-20,000 (claims+sources) | ~3,000-8,000 (tallies)    | $0.075-$0.18          | $0.13-$0.30         |

**Note:** Costs calculated at March 2026 API rates -- Opus 4.6: $5/$25 per 1M
input/output; Sonnet 4.6: $3/$15 per 1M input/output; Haiku 4.5: $1/$5 per 1M
input/output.

### 1.2 Session-Level Token Profiles

Data from codebase analysis (AGENT_TEAMS_RESEARCH.md) and production benchmarks:

| Configuration                | Total Tokens    | Estimated Cost (Sonnet) | Estimated Cost (Opus) |
| ---------------------------- | --------------- | ----------------------- | --------------------- |
| Solo agent research          | ~200K           | $1.80-$2.40             | $3.00-$4.00           |
| 3 subagents (search workers) | ~440K           | $3.50-$5.50             | $6.00-$9.00           |
| 3-person agent team          | ~800K           | $6.00-$10.00            | $10.00-$17.00         |
| 5-person agent team          | ~1.2M+          | $9.00-$15.00+           | $15.00-$25.00+        |
| Team mode with plan mode     | ~1.4M (7x solo) | $10.00-$18.00           | $17.00-$30.00         |

### 1.3 Cost Drivers (Ranked by Impact)

1. **Model selection** -- 3-5x cost difference between Opus and Haiku for same
   task. Single largest lever.
2. **Output token volume** -- Output costs 5x more than input per token. Verbose
   agents are expensive agents.
3. **Agent count** -- Each agent gets its own context window; cost scales
   linearly with agents.
4. **Iteration count** -- Each search-synthesize-verify cycle multiplies base
   cost. 3 cycles = 3x.
5. **Context accumulation** -- Agents that keep full history in context pay for
   it every turn. A 100K-token context window costs $0.30/turn on Sonnet input
   alone.
6. **Idle agent consumption** -- Team members consume tokens even when waiting
   (polling, heartbeats). Identified as a cost driver in SoNash's agent teams
   research.
7. **WebFetch page size** -- A single dense page can inject 8K+ tokens. 10 page
   reads = 80K tokens of content.

### 1.4 External API Costs (Search)

| Service      | Cost per 1K Queries               | Free Tier                   | Best For                     |
| ------------ | --------------------------------- | --------------------------- | ---------------------------- |
| Tavily       | $5-$8 (basic), $10-$16 (advanced) | 1,000/mo                    | LLM-optimized search+extract |
| Brave Search | $5                                | $5/mo credits (~1K queries) | Independent index, privacy   |
| Serper       | ~$1                               | Limited                     | High-volume, budget          |
| SerpAPI      | ~$15                              | 250/mo                      | Google SERP accuracy         |
| Exa          | $5 (neural), $2.50 (keyword)      | $10 credits                 | Semantic search              |
| DataForSEO   | ~$0.60                            | None                        | Bulk/enterprise              |

Built-in WebSearch in Claude Code has no per-query cost beyond token
consumption, making it the default choice for budget-constrained research.

### 1.5 Industry Comparisons

| System                         | Approx Cost per Research Query | Token Usage                  |
| ------------------------------ | ------------------------------ | ---------------------------- |
| OpenAI Deep Research (o3)      | ~$10 per query                 | Millions of tokens per query |
| OpenAI Deep Research (o4-mini) | ~$0.92 per query               | Lower but still substantial  |
| Google Gemini Deep Research    | Included in $7.99-$20/mo tier  | Not disclosed                |
| Perplexity Deep Research       | Included in $20/mo Pro         | Not disclosed                |
| Claude Code solo research      | ~$2-$4 per session             | ~200K tokens                 |
| Our target (3-agent system)    | ~$3-$8 per session             | ~400-600K tokens             |

---

## 2. Model Tiering Strategy

### 2.1 The Economic Case for Tiering

Homogeneous model assignment (using the same model for all agents) is the
default but most wasteful approach. Research conclusively shows:

- **MALBO framework:** Bayesian-optimized hybrid teams achieve 45.6-65.8% cost
  savings over homogeneous baselines without accuracy loss (arxiv 2508.02694).
- **RouteLLM:** Routing simple queries to smaller models preserves 95% quality
  while reducing costs up to 85% on MT Bench (UC Berkeley, lm-sys/RouteLLM).
- **BudgetMLAgent:** Using free/cheap models as base with cascade to expensive
  models achieves 94.2% cost reduction ($0.054 vs $0.931 per run) while
  improving success rates (arxiv 2411.07464).
- **Production evidence:** One line of routing config cut agent costs by ~57% in
  an 18-run benchmark comparing Opus 4.6 vs Sonnet 4.6.

### 2.2 Recommended Tier Assignment

| Role                  | Model      | Rationale                                                                                                                                                                                                                                     | Cost/1M (in/out) |
| --------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **Orchestrator**      | Opus 4.6   | Needs: planning, synthesis, judgment, quality assessment. These are high-reasoning tasks where model quality directly determines output quality. The orchestrator is the bottleneck -- its quality caps system quality.                       | $5 / $25         |
| **Search Workers**    | Sonnet 4.6 | Needs: tool use, search execution, information extraction. Sonnet handles tool-calling and structured extraction at near-Opus quality. Workers do not need deep reasoning; they execute specific search tasks and return structured findings. | $3 / $15         |
| **Verifier/Critic**   | Sonnet 4.6 | Needs: cross-reference checking, gap detection. Verification is pattern-matching against sources, not creative reasoning. Sonnet is sufficient.                                                                                               | $3 / $15         |
| **Citation Manager**  | Haiku 4.5  | Needs: URL checking, format normalization, deduplication. Purely mechanical tasks. Haiku at 1/5th the cost of Opus is ideal.                                                                                                                  | $1 / $5          |
| **Router/Classifier** | Haiku 4.5  | Needs: classify query complexity, route to appropriate depth level. Simple classification task.                                                                                                                                               | $1 / $5          |

### 2.3 Cost Impact of Tiering

For a standard 3-agent research session (~440K tokens):

| Strategy                                                      | Estimated Cost | Savings vs Opus-Only       |
| ------------------------------------------------------------- | -------------- | -------------------------- |
| All Opus                                                      | $8.50          | --                         |
| All Sonnet                                                    | $4.20          | 51%                        |
| Tiered (Opus orchestrator + Sonnet workers)                   | $3.80          | 55%                        |
| Tiered (Opus orchestrator + Sonnet workers + Haiku citations) | $3.40          | 60%                        |
| All Haiku (quality insufficient)                              | $1.40          | 84% (but quality degrades) |

**Recommendation:** Opus orchestrator + Sonnet workers is the production sweet
spot. This matches Anthropic's own multi-agent research system design (Opus 4
lead + Sonnet 4 subagents) and delivers ~55% savings over Opus-only.

### 2.4 Cascade Pattern for Edge Cases

When a Sonnet worker encounters a task requiring deeper reasoning (complex
contradiction resolution, nuanced synthesis), escalate to Opus:

```
Sonnet worker attempts task
  -> If confidence < threshold (e.g., 0.6)
  -> Escalate to Opus for that specific subtask
  -> Return to Sonnet for remaining work
```

This "LLM cascade" pattern (from BudgetMLAgent) keeps average costs low while
preserving quality on hard problems. Expected escalation rate: 5-15% of worker
tasks.

---

## 3. Budget Management

### 3.1 Budget Allocation Model

Every research session operates within a declared token budget. The budget is
allocated across four phases using a **60/20/10/10 split**:

| Phase               | Budget Share | Purpose                                                     | Hard Cap                    |
| ------------------- | ------------ | ----------------------------------------------------------- | --------------------------- |
| **Search & Gather** | 60%          | WebSearch queries, WebFetch page reads, source discovery    | Cap at allocated share      |
| **Verification**    | 20%          | Cross-source verification, fact-checking, convergence loops | Cap at allocated share      |
| **Synthesis**       | 10%          | Draft generation, outline creation, report writing          | Reserve -- always runs      |
| **Overhead**        | 10%          | Orchestration, routing, error handling, retries             | Buffer for unexpected costs |

**Why 60/20/10/10:** Search is the most token-intensive phase (many tool calls,
large page reads). Verification is essential but bounded (convergence loops have
hard iteration caps). Synthesis is efficient (one pass over aggregated
findings). Overhead covers the orchestrator's coordination tokens and provides a
safety margin.

### 3.2 Depth-Level Budgets

| Depth Level    | Token Budget | Estimated Cost | Search Rounds | Agents   | Use Case                                        |
| -------------- | ------------ | -------------- | ------------- | -------- | ----------------------------------------------- |
| **Quick**      | 80K          | $0.50-$1.00    | 1             | 1 (solo) | Quick fact lookup, single-source answer         |
| **Standard**   | 300K         | $2.00-$5.00    | 2-3           | 2-3      | Typical technical research question             |
| **Deep**       | 600K         | $5.00-$12.00   | 3-5           | 3-4      | Multi-faceted research with verification        |
| **Exhaustive** | 1.2M+        | $12.00-$25.00  | 5-8           | 4-5      | Critical decision support, comprehensive survey |

### 3.3 Pre-Research Cost Estimation

Before research begins, the orchestrator MUST provide a cost estimate:

```
Research Plan: "Compare React Server Components vs Islands Architecture"
Estimated depth: Standard
Sub-questions identified: 4
Estimated searches: 12-16
Estimated page reads: 8-12
Estimated token budget: ~300K tokens
Estimated cost: $3.00-$5.00 (Sonnet workers) or $6.00-$9.00 (Opus workers)
```

**Estimation formula:**

```
base_tokens = (sub_questions * 3 * search_tokens_per_query)    # search phase
            + (page_reads * avg_page_tokens)                    # extraction
            + (sub_questions * verification_tokens)             # verification
            + (total_findings * synthesis_tokens_per_finding)   # synthesis
            + (agent_count * orchestration_overhead)            # overhead

estimated_cost = (base_tokens * 0.4 * input_price_per_token)   # ~40% input
               + (base_tokens * 0.6 * output_price_per_token)  # ~60% output
```

Where typical values are:

- `search_tokens_per_query` = ~1,000
- `avg_page_tokens` = ~5,000
- `verification_tokens` = ~12,000
- `synthesis_tokens_per_finding` = ~3,000
- `orchestration_overhead` = ~20,000

### 3.4 Budget Enforcement Mechanisms

**Hard caps:**

- Maximum tokens per agent per turn
- Maximum total tokens per research phase
- Maximum iteration count per convergence loop (already in /convergence-loop:
  quick=2, standard=3, thorough=5)
- Maximum total session tokens

**Soft warnings:**

- Alert at 70% budget consumed ("70% budget used -- 2 sub-questions remaining")
- Alert at 90% budget consumed ("Budget nearly exhausted -- entering synthesis")
- Estimate remaining cost before each new search round

**Graceful degradation:**

- At 80% budget: stop spawning new search tasks, complete in-progress work
- At 90% budget: enter forced synthesis with available findings
- At 95% budget: generate summary with explicit "research incomplete" flag
- At 100% budget: hard stop, return partial results with gap documentation

**Circuit breakers (from production failure analysis):**

- If an agent retries the same operation 3 times, kill the task (prevents the
  "retry loop" pattern that can burn entire daily budgets)
- If a single agent consumes >40% of total budget, pause and reassess
- If total cost exceeds 2x estimate, require user confirmation to continue

### 3.5 Token-Budget-Aware Reasoning

The Token-Budget-Aware LLM Reasoning framework (arxiv 2412.18547, ACL 2025
Findings) demonstrates that dynamically adjusting reasoning tokens based on
problem complexity reduces output costs by 67% and expenses by 59% while
maintaining competitive performance. This principle applies directly to
research:

- **Simple sub-questions** get compressed reasoning budgets
- **Complex sub-questions** get full reasoning allocation
- The orchestrator classifies sub-question complexity before assigning budgets

---

## 4. Cost vs Quality Tradeoffs

### 4.1 The Diminishing Returns Curve

Research quality does not scale linearly with token spend. Based on convergence
research and production data:

```
Quality
  |
  |         ****
  |       **    ***
  |     **         **
  |    *              *****
  |   *                    **************
  |  *
  | *
  |*
  +------------------------------------ Tokens/Cost
    Quick  Standard  Deep  Exhaustive
    (80K)   (300K)  (600K)  (1.2M+)
```

| Transition         | Marginal Quality Gain | Marginal Cost | Worth It?                     |
| ------------------ | --------------------- | ------------- | ----------------------------- |
| Quick -> Standard  | +40-60%               | 3-5x          | Almost always yes             |
| Standard -> Deep   | +15-25%               | 2-3x          | Yes for important decisions   |
| Deep -> Exhaustive | +5-10%                | 2-3x          | Only for critical/high-stakes |
| Beyond Exhaustive  | +1-3%                 | Unbounded     | Almost never                  |

### 4.2 When to Spend More

**High-spend justified:**

- Architecture decisions affecting 6+ months of development
- Security-sensitive research (threat models, vulnerability analysis)
- Competitive analysis informing business strategy
- Topics with high contradiction rates (need verification depth)
- Novel/cutting-edge topics with limited reliable sources

**Low-spend sufficient:**

- API documentation lookups
- "How to do X in framework Y" questions
- Version comparison (well-documented upgrade paths)
- Standard pattern implementations
- Topics with clear consensus and authoritative sources

### 4.3 The Token Cost Paradox

Per-token costs are declining (Anthropic has reduced prices multiple times), but
total costs per task are rising because:

1. Models consume more tokens per task (longer reasoning chains)
2. Agentic workflows multiply calls (5-20x more tokens than simple chains)
3. Reflexion/retry loops can consume 50x tokens of a linear pass
4. Context windows are growing, and agents fill them

**Implication:** Cost optimization must focus on _reducing token volume_, not
just _reducing per-token price_. Architectural efficiency (fewer agents, shorter
prompts, structured outputs) matters more than model pricing.

### 4.4 Quality Signals for Adaptive Budgeting

Rather than fixed depth levels, implement adaptive budgeting that responds to
research quality signals:

- **High source agreement** (3+ sources concur): reduce verification budget,
  stop early
- **High contradiction rate** (sources disagree): increase verification budget,
  add more search rounds
- **Information saturation** (new searches return known information): stop
  searching, proceed to synthesis
- **Low source availability** (few relevant results): broaden search terms
  rather than repeating
- **High confidence from orchestrator** (>0.8): skip optional verification
  rounds

---

## 5. Latency Optimization

### 5.1 Parallel vs Sequential Economics

| Strategy                                       | Wall-Clock Time  | Token Cost                 | When to Use                   |
| ---------------------------------------------- | ---------------- | -------------------------- | ----------------------------- |
| Fully sequential                               | N \* T (slowest) | Baseline                   | Never for research (too slow) |
| Fully parallel                                 | ~T (fastest)     | Baseline + 25-35% overhead | Independent sub-questions     |
| Hybrid (parallel search, sequential synthesis) | ~2T              | Baseline + 10-15% overhead | Default recommendation        |

**Key finding:** Parallel execution adds 25-35% more tokens due to coordination
overhead (spawn prompts, result aggregation, duplicate context). But it achieves
2-3x speedup. For a 3-subagent system:

- Sequential: ~8-12 minutes, ~400K tokens
- Parallel: ~3-5 minutes, ~500K tokens (+25%)
- Hybrid: ~5-7 minutes, ~440K tokens (+10%)

**Recommendation:** Use hybrid. Parallel search workers (independent), then
sequential verification and synthesis (dependent on search results). This
achieves 90% of the latency benefit with only 10% cost overhead -- matching
Anthropic's reported 90% latency reduction.

### 5.2 Latency-Aware Orchestration

The LAMaS framework (arxiv 2601.10560) demonstrates learned controllers that
jointly optimize accuracy, cost, and latency. Key applicable insights:

- **Critical path optimization:** Identify the longest dependency chain and
  allocate the fastest model to it
- **Early termination:** If 2 of 3 workers return similar findings, don't wait
  for the third
- **Speculative execution:** Start synthesis on partial results while remaining
  workers complete
- **Staggered spawning:** Don't spawn all agents simultaneously; stagger to
  avoid rate limits and spread load

### 5.3 WebSearch/WebFetch Latency

| Operation             | Typical Latency | Tokens Generated |
| --------------------- | --------------- | ---------------- |
| WebSearch             | 1-3 seconds     | 500-1,000        |
| WebFetch (small page) | 2-5 seconds     | 1,000-3,000      |
| WebFetch (large page) | 5-15 seconds    | 5,000-10,000     |
| WebFetch (PDF)        | 10-30 seconds   | 5,000-20,000     |

**Optimization strategies:**

- Batch WebSearch queries (one search per sub-question, all in parallel)
- Prefer WebSearch summaries over WebFetch full-page reads when summaries
  suffice
- Set WebFetch extraction prompts to extract only relevant sections, not full
  pages
- Skip WebFetch for sources already summarized adequately by WebSearch results

---

## 6. Caching Strategies

### 6.1 Within-Session Deduplication

**Problem:** Multiple subagents may search for overlapping terms, read the same
pages, or discover the same sources independently.

**Solution: Search dedup registry.**

The orchestrator maintains a registry of all searches performed and pages read
during the session:

```
search_registry = {
  "react server components performance": { results: [...], timestamp: ... },
  "islands architecture comparison": { results: [...], timestamp: ... }
}

page_registry = {
  "https://example.com/rsc-guide": { content_hash: "...", summary: "...", timestamp: ... }
}
```

Before any agent performs a search or page read:

1. Check the registry for exact or near-match queries
2. If match found, return cached results (zero tokens, zero latency)
3. If no match, perform the operation and register the result

**Expected savings:** 15-30% token reduction in multi-agent sessions (based on
observed query overlap in production systems).

### 6.2 Prompt Caching (Provider-Level)

Claude's prompt caching is the highest-leverage caching mechanism:

| Cache Type         | Cost                    | Savings vs Fresh     | TTL       |
| ------------------ | ----------------------- | -------------------- | --------- |
| Cache read         | $0.30/M tokens (Sonnet) | 90%                  | Automatic |
| 5-min cache write  | 1.25x base price        | Amortized over reads | 5 min     |
| 1-hour cache write | 2x base price           | Amortized over reads | 1 hour    |

**Research-specific application:**

- **System prompts** for all agents share a common prefix (research
  instructions, output format, tool guidance). This prefix is cached across all
  agent turns.
- **Findings accumulator** -- as research progresses, the growing findings
  document becomes a cached prefix for verification and synthesis agents.
- **Claude Code achieves 92% cache hit rate and 81% cost reduction** at scale --
  this is the target benchmark.

**Implementation:**

- Structure agent prompts with stable prefixes (instructions, format) followed
  by dynamic content (current findings, current sub-question)
- Avoid mid-session changes to tool definitions (invalidates entire cache)
- Use 1-hour cache writes for the research plan and findings accumulator

### 6.3 Cross-Session Knowledge Persistence

**Problem:** The same topics get researched across sessions. Example: "Claude
API pricing" or "multi-agent patterns" may be researched in multiple
deep-research sessions within the same project.

**Solution: Research knowledge base.**

Persist research findings with metadata:

```json
{
  "topic": "Claude API pricing March 2026",
  "findings": [...],
  "sources": [...],
  "confidence": 0.95,
  "researched_at": "2026-03-20T14:30:00Z",
  "ttl_days": 30,
  "stale_after_days": 7
}
```

**Reuse rules:**

- **Fresh (<7 days):** Use directly without re-verification
- **Stale (7-30 days):** Use as starting point, verify key claims only
- **Expired (>30 days):** Re-research from scratch (but use as search hints)
- **Time-sensitive topics** (pricing, versions, current events): TTL = 3 days
- **Stable topics** (architecture patterns, algorithms): TTL = 90 days

**Storage:** `.planning/research-cache/` directory with JSON files per topic.
Fits naturally into the existing `.planning/` convention.

### 6.4 Semantic Deduplication

Beyond exact-match dedup, detect semantically equivalent queries:

- "Claude API pricing 2026" ~ "Anthropic token costs March 2026"
- "multi-agent coordination failures" ~ "why multi-agent systems fail"

Use the orchestrator (high-capability model) to classify query similarity before
spawning a search. If a semantically similar query exists in the registry, merge
the new query's specific requirements with cached results rather than
re-searching.

**Expected additional savings:** 5-10% beyond exact-match dedup.

### 6.5 Hierarchical Caching Architecture

Drawing from the Hierarchical Caching for Agentic Workflows research (76.5%
caching efficiency, 73.3% cost reduction):

```
Layer 1: Exact match cache     (sub-ms, highest hit rate for repeated queries)
Layer 2: Semantic cache         (10-50ms, catches paraphrased queries)
Layer 3: Knowledge base cache   (50-200ms, cross-session topic reuse)
Layer 4: Provider prompt cache  (automatic, 90% input cost reduction)
```

Each layer catches what the previous layer misses. Combined hit rate
target: >70%.

---

## 7. Cost Estimation Model

### 7.1 Pre-Research Estimation Algorithm

```
function estimateResearchCost(query, depthLevel):
  # Step 1: Decompose query into sub-questions
  subQuestions = decomposeQuery(query)
  n = len(subQuestions)

  # Step 2: Estimate operations per sub-question
  searchesPerQuestion = DEPTH_CONFIG[depthLevel].searchesPerQ    # quick=2, standard=4, deep=6, exhaustive=10
  pageReadsPerQuestion = DEPTH_CONFIG[depthLevel].pageReadsPerQ  # quick=1, standard=2, deep=4, exhaustive=6
  verificationPasses = DEPTH_CONFIG[depthLevel].verifyPasses     # quick=0, standard=1, deep=2, exhaustive=3

  # Step 3: Calculate token estimates
  searchTokens = n * searchesPerQuestion * 1200                  # ~1200 tokens per search round-trip
  extractTokens = n * pageReadsPerQuestion * 5500                # ~5500 tokens per page read
  verifyTokens = n * verificationPasses * 14000                  # ~14K tokens per verification pass
  synthesisTokens = n * 4000 + 15000                             # ~4K per finding + 15K for final report
  orchestrationTokens = n * 5000 + 25000                         # ~5K per sub-question coordination + 25K base

  totalTokens = searchTokens + extractTokens + verifyTokens + synthesisTokens + orchestrationTokens

  # Step 4: Apply model tiering
  opusTokens = orchestrationTokens + synthesisTokens             # high-capability tasks
  sonnetTokens = searchTokens + extractTokens + verifyTokens     # worker tasks

  # Step 5: Calculate cost (assume 40% input, 60% output split)
  opusCost = opusTokens * 0.4 * 5/1e6 + opusTokens * 0.6 * 25/1e6
  sonnetCost = sonnetTokens * 0.4 * 3/1e6 + sonnetTokens * 0.6 * 15/1e6

  totalCost = opusCost + sonnetCost

  return {
    totalTokens,
    estimatedCost: totalCost,
    breakdown: { search: searchTokens, extract: extractTokens,
                 verify: verifyTokens, synthesis: synthesisTokens,
                 orchestration: orchestrationTokens },
    confidence: 0.7  # estimates typically accurate within +/- 30%
  }
```

### 7.2 Example Estimates

| Research Query                                              | Depth      | Sub-Qs | Est. Tokens | Est. Cost (Tiered) |
| ----------------------------------------------------------- | ---------- | ------ | ----------- | ------------------ |
| "What is prompt caching?"                                   | Quick      | 1      | ~18K        | $0.25              |
| "Compare React 19 vs Solid 2.0 for production apps"         | Standard   | 4      | ~180K       | $2.80              |
| "Design a multi-agent research system with cost management" | Deep       | 6      | ~450K       | $6.50              |
| "Comprehensive survey of LLM agent frameworks 2025-2026"    | Exhaustive | 8      | ~950K       | $14.00             |

### 7.3 Estimation Accuracy

Pre-research estimates are inherently uncertain. Expected accuracy:

- **Quick depth:** +/- 20% (predictable, few operations)
- **Standard depth:** +/- 30% (moderate variability in page sizes and search
  relevance)
- **Deep depth:** +/- 40% (verification rounds may vary, contradictions may
  trigger additional research)
- **Exhaustive depth:** +/- 50% (high variability, adaptive iteration counts)

**Mitigation:** Present estimates as ranges, not point estimates. "This research
will cost approximately $5-$8" is more honest than "$6.50."

---

## 8. Design Recommendations

### 8.1 Economic Architecture

```
                          ┌─────────────────────┐
                          │   Budget Controller  │
                          │  (token accounting)  │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │    Orchestrator      │
                          │  (Opus 4.6)          │
                          │  - Query decompose   │
                          │  - Budget allocation  │
                          │  - Result synthesis   │
                          └──┬────┬────┬────┬───┘
                             │    │    │    │
                    ┌────────▼┐  ┌▼────▼┐  ┌▼────────┐
                    │ Worker 1 │  │ W2   │  │ Verifier │
                    │ (Sonnet) │  │(Son.)│  │ (Sonnet) │
                    └────┬─────┘  └──┬───┘  └────┬─────┘
                         │           │           │
                    ┌────▼───────────▼───────────▼────┐
                    │        Search Dedup Registry     │
                    │    + Knowledge Base Cache         │
                    │    + Provider Prompt Cache        │
                    └─────────────────────────────────┘
```

### 8.2 Implementation Priorities (by Cost Impact)

| Priority | Feature                                            | Expected Savings             | Effort         |
| -------- | -------------------------------------------------- | ---------------------------- | -------------- |
| P0       | Model tiering (Opus orchestrator + Sonnet workers) | 45-60%                       | Low            |
| P0       | Depth levels with pre-set budgets                  | Prevents overrun             | Low            |
| P0       | Hard iteration caps (from /convergence-loop)       | Prevents runaway             | Already exists |
| P1       | Pre-research cost estimation                       | User trust + informed choice | Medium         |
| P1       | Budget enforcement with graceful degradation       | Prevents overrun             | Medium         |
| P1       | Within-session search dedup registry               | 15-30%                       | Medium         |
| P2       | Prompt caching optimization (stable prefixes)      | Up to 81% on input           | Medium         |
| P2       | Adaptive budgeting (quality signal response)       | 10-20%                       | High           |
| P3       | Cross-session knowledge persistence                | 20-40% on repeated topics    | High           |
| P3       | Semantic deduplication                             | 5-10% additional             | High           |
| P3       | LLM cascade (Sonnet->Opus escalation)              | 5-15%                        | Medium         |

### 8.3 Cost Monitoring and Reporting

Every research session should produce a cost report:

```
=== Research Cost Report ===
Query: "Multi-agent research architecture patterns"
Depth: Deep
Duration: 8 minutes

Token Usage:
  Search & Gather:  245,000 tokens (54%)  [budget: 60%] -- under budget
  Verification:      98,000 tokens (22%)  [budget: 20%] -- slightly over
  Synthesis:         52,000 tokens (12%)  [budget: 10%] -- over (complex topic)
  Orchestration:     55,000 tokens (12%)  [budget: 10%] -- over (more sub-questions than estimated)
  Total:            450,000 tokens

Cost Breakdown:
  Orchestrator (Opus):   107,000 tokens -> $1.94
  Workers (Sonnet):      343,000 tokens -> $3.77
  Total:                                   $5.71

Efficiency Metrics:
  Cache hit rate:        34% (first session on this topic)
  Search dedup saves:    18,000 tokens (3 duplicate queries avoided)
  Estimate accuracy:     within 12% of pre-research estimate ($6.50)

Comparison:
  All-Opus cost:         $10.25 (saved $4.54 via tiering, 44%)
  All-Sonnet cost:       $5.40 (Opus orchestrator added $0.31 for better quality)
```

### 8.4 Anti-Patterns to Enforce

| Anti-Pattern                                   | Cost Impact              | Prevention                                         |
| ---------------------------------------------- | ------------------------ | -------------------------------------------------- |
| **Retry loops without circuit breaker**        | Unbounded (50x reported) | Max 3 retries per operation, then fail gracefully  |
| **Full context in every agent turn**           | Linear growth per turn   | Progressive summarization, artifact-based handoffs |
| **Homogeneous Opus for all agents**            | 2-3x over-spend          | Model tiering enforcement in orchestrator          |
| **Searching same query from multiple agents**  | 15-30% waste             | Search dedup registry                              |
| **Reading entire pages when snippets suffice** | 3-5x per WebFetch        | Extraction-focused WebFetch prompts                |
| **Spawning agents for trivial sub-tasks**      | ~20K overhead per spawn  | Minimum complexity threshold for agent spawning    |
| **No termination criteria**                    | Unbounded research loops | Hard caps + diminishing returns detection          |
| **Re-researching known topics**                | Full session cost        | Cross-session knowledge cache                      |

---

## Sources

### Pricing Data

- [Claude API Pricing (Official)](https://platform.claude.com/docs/en/about-claude/pricing)
- [Claude API Pricing March 2026 Update (TLDL)](https://www.tldl.io/resources/anthropic-api-pricing)
- [OpenAI API Pricing (Official)](https://openai.com/api/pricing/)
- [LLM API Pricing Comparison 2026](https://pricepertoken.com/pricing-page/provider/openai)
- [Web Search API Pricing Comparison (Medium)](https://medium.com/@RonaldMike/cheapest-web-search-apis-for-production-use-2026-real-costs-hidden-fees-and-what-actually-90f2e7643243)
- [Best Web Search APIs for AI Applications 2026 (Firecrawl)](https://www.firecrawl.dev/blog/best-web-search-apis)

### Cost Optimization Research

- [Efficient Agents: Building Effective Agents While Reducing Cost (arxiv 2508.02694)](https://arxiv.org/abs/2508.02694)
- [AgentBalance: Cost-Effective Multi-Agent Systems Under Budget Constraints (arxiv 2512.11426)](https://arxiv.org/abs/2512.11426)
- [Controlling Performance and Budget of Centralized Multi-agent LLM System with RL (arxiv 2511.02755)](https://arxiv.org/abs/2511.02755)
- [BudgetMLAgent: A Cost-Effective LLM Multi-Agent System (arxiv 2411.07464)](https://arxiv.org/abs/2411.07464)
- [Token-Budget-Aware LLM Reasoning (arxiv 2412.18547, ACL 2025)](https://arxiv.org/abs/2412.18547)
- [RouteLLM: Learning to Route LLMs with Preference Data (UC Berkeley)](https://github.com/lm-sys/RouteLLM)
- [57% Cost Cut: Model Routing for Multi-Agent Systems (Infralovers)](https://www.infralovers.com/blog/2026-02-19-ki-agenten-modell-optimierung/)

### Caching and Latency

- [Don't Break the Cache: Prompt Caching for Long-Horizon Agentic Tasks (arxiv 2601.06007)](https://arxiv.org/abs/2601.06007)
- [Hierarchical Caching for Agentic Workflows (MDPI)](https://www.mdpi.com/2504-4990/8/2/30)
- [Agentic Plan Caching: Test-Time Memory for Fast and Cost-Efficient LLM Agents (OpenReview)](https://openreview.net/pdf?id=n4V3MSqK77)
- [Asteria: Semantic-Aware Cross-Region Caching for Agentic LLM Tool Access (arxiv 2509.17360)](https://arxiv.org/html/2509.17360v1)
- [LLM Token Optimization: Cut Costs & Latency in 2026 (Redis)](https://redis.io/blog/llm-token-optimization-speed-up-apps/)
- [Prompt Caching: Reducing LLM Costs by Up to 90% (Medium)](https://medium.com/@pur4v/prompt-caching-reducing-llm-costs-by-up-to-90-part-1-of-n-042ff459537f)
- [Learning Latency-Aware Orchestration for Parallel Multi-Agent Systems (arxiv 2601.10560)](https://arxiv.org/abs/2601.10560)

### Production Cost Data

- [OpenAI Deep Research API Costs ~$30 per Call (Artificial Analysis, X)](https://x.com/ArtificialAnlys/status/1940896348364210647)
- [The Hidden Costs of Agentic AI: 40% Project Failure Rate (Galileo)](https://galileo.ai/blog/hidden-cost-of-agentic-ai)
- [The Hidden Economics of AI Agents (Stevens Institute)](https://online.stevens.edu/blog/hidden-economics-ai-agents-token-costs-latency/)
- [LLM Cost Paradox: "Cheaper" Models Breaking Budgets (IKangAI)](https://www.ikangai.com/the-llm-cost-paradox-how-cheaper-ai-models-are-breaking-budgets/)
- [Claude Code Cost Management Docs](https://code.claude.com/docs/en/costs)
- [Beyond Benchmarks: The Economics of AI Inference (arxiv 2510.26136)](https://arxiv.org/html/2510.26136v1)
- [Manage Costs Effectively (Anthropic Docs)](https://docs.anthropic.com/en/docs/claude-code/costs)

### Multi-Agent Economics

- [Cross-Session Agent Memory: Foundations and Challenges (MGX)](https://mgx.dev/insights/cross-session-agent-memory-foundations-implementations-challenges-and-future-directions/d03dd30038514b75ad4cbbda2239c468)
- [Why Multi-Agent Systems Need Memory Engineering (MongoDB/Medium)](https://medium.com/mongodb/why-multi-agent-systems-need-memory-engineering-153a81f8d5be)
- [Adaptive Computational Budgeting for AI Agents (TDCommons)](https://www.tdcommons.org/cgi/viewcontent.cgi?article=9826&context=dpubs_series)
- [How to Budget for AI Agents (Tonic3)](https://blog.tonic3.com/guide-to-smart-ai-agent-budget-token-consumption)

### Codebase References

- Agent Teams Token Cost Model:
  `.planning/agent-environment-analysis/AGENT_TEAMS_RESEARCH.md`
- Existing Research Tools Landscape:
  `.planning/deep-research-skill/research/EXISTING_TOOLS_LANDSCAPE.md`
- Multi-Agent Patterns Research:
  `.planning/deep-research-skill/research/MULTI_AGENT_PATTERNS.md`
- Convergence Loop Integration:
  `.planning/deep-research-skill/research/CONVERGENCE_IN_RESEARCH.md`
