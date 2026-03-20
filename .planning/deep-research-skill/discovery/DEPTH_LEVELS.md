# Exhaustive Depth Level Definitions

<!-- prettier-ignore-start -->
**Date:** 2026-03-20
**Phase:** Discovery (distilled from Research phase)
**Source Reports:** COST_TOKEN_ECONOMICS, CORE_DESIGN_PRINCIPLE, CONVERGENCE_IN_RESEARCH, QUALITY_EVALUATION, SELF_AUDIT_ARCHITECTURE, ORCHESTRATION_PATTERNS, SYNTHESIS
<!-- prettier-ignore-end -->

---

## Purpose

Define exactly what each depth level means in terms of agent count, search
rounds, verification passes, quality gates, budget, and expected output. The
core design principle is **overkill by default** -- Exhaustive is the default
depth, and even Quick mode should exceed competitors' deep mode.

---

## The Four Depth Levels

### Quick

**When to use:** Factual lookups, single-source answers, "what is X" questions.
User explicitly requests Quick, or auto-selected for simple factual questions.

| Parameter                  | Value                                                   |
| -------------------------- | ------------------------------------------------------- |
| **Token budget**           | 80K                                                     |
| **Estimated cost**         | $0.50-$1.00                                             |
| **Agents**                 | 0 (solo mode -- orchestrator handles everything inline) |
| **Search rounds**          | 1                                                       |
| **Sources consulted**      | 2-3                                                     |
| **Verification**           | None (source confidence only)                           |
| **Self-audit**             | None                                                    |
| **Convergence passes**     | None                                                    |
| **Expected output length** | 200-500 words                                           |
| **Wall-clock time**        | 30-90 seconds                                           |

**Execution flow:**

1. Orchestrator classifies question (inline, no decomposition)
2. Single WebSearch + 1-2 WebFetch calls
3. Inline synthesis with citations
4. Present result with confidence level
5. No file output (terminal only, unless `--save` flag)

**Quality bar:** Even Quick mode must include:

- At least 2 independent sources
- Inline citations for every claim
- Explicit confidence level (HIGH/MEDIUM/LOW)
- "What I couldn't verify" section if applicable

**Comparison to competitors:** Perplexity's basic search mode typically consults
5-10 sources but produces shallow summaries. Quick mode targets fewer sources
but deeper per-source analysis with explicit confidence.

---

### Standard

**When to use:** Typical technical research questions, "how does X work",
"compare X vs Y". Default for most Descriptive and Comparative questions.

| Parameter                  | Value                                                  |
| -------------------------- | ------------------------------------------------------ |
| **Token budget**           | 300K                                                   |
| **Estimated cost**         | $2.00-$5.00                                            |
| **Agents**                 | 2-3 (2 searchers + 1 synthesizer)                      |
| **Search rounds**          | 2-3 per sub-question                                   |
| **Sources consulted**      | 8-15                                                   |
| **Sub-questions**          | 3-5                                                    |
| **Verification**           | Quick convergence (2 passes) on findings and synthesis |
| **Self-audit**             | None                                                   |
| **Convergence passes**     | Finding: 2, Synthesis: 2, Completeness: 0              |
| **Expected output length** | 1,000-3,000 words                                      |
| **Wall-clock time**        | 3-7 minutes                                            |

**Execution flow:**

1. Decompose into 3-5 sub-questions
2. Present plan to user for approval
3. Spawn 2 parallel searcher agents
4. Each searcher writes FINDINGS.md to disk
5. Spawn synthesizer to combine findings
6. Quick convergence pass on synthesis (2 passes)
7. Present RESEARCH_OUTPUT.md with downstream routing options

**Quality bar:**

- All sub-questions addressed with evidence
- Cross-source verification on key claims
- Contradictions surfaced (not silently resolved)
- Source diversity (not all from same author/site)
- Citations for every substantive claim

**Output files:**

- `RESEARCH_OUTPUT.md` (human-readable report)
- `claims.jsonl` (machine-parseable claims)
- `sources.jsonl` (source registry)
- `metadata.json` (session metadata)

---

### Deep

**When to use:** Multi-faceted research with verification, architecture
decisions, evaluative questions, topics with high contradiction rates.

| Parameter                  | Value                                                                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Token budget**           | 600K                                                                                                                                                                         |
| **Estimated cost**         | $5.00-$12.00                                                                                                                                                                 |
| **Agents**                 | 3-4 (3 searchers + 1 synthesizer)                                                                                                                                            |
| **Search rounds**          | 3-5 per sub-question                                                                                                                                                         |
| **Sources consulted**      | 15-30                                                                                                                                                                        |
| **Sub-questions**          | 5-8                                                                                                                                                                          |
| **Verification**           | Standard convergence (3 passes) on findings and synthesis                                                                                                                    |
| **Self-audit**             | Tier 1 (cross-consistency, claim verification, completeness) + Tier 2 (source diversity, confidence calibration) + Tier 3 (temporal validity, bias detection, actionability) |
| **Convergence passes**     | Finding: 3, Synthesis: 3, Completeness: 2                                                                                                                                    |
| **Expected output length** | 3,000-8,000 words                                                                                                                                                            |
| **Wall-clock time**        | 8-15 minutes                                                                                                                                                                 |

**Execution flow:**

1. Full determination phase (question type, domain, depth confirmation)
2. Decompose into 5-8 MECE sub-questions
3. Present plan with cost estimate for approval
4. Spawn 3 parallel searcher agents
5. Each searcher writes FINDINGS.md with confidence levels
6. Orchestrator reviews findings for gaps
7. If gaps found: spawn additional searcher(s) for gaps (budget permitting)
8. Spawn synthesizer to combine findings
9. Standard convergence loop on synthesis (3 passes)
10. Quick completeness audit (2 passes)
11. Tier 1-3 self-audit
12. Present RESEARCH_OUTPUT.md with full downstream routing

**Quality bar (adds to Standard):**

- MECE coverage of the question space
- Gap analysis with explicit "what we don't know" section
- Multiple independent verification of high-stakes claims
- Temporal validation (are sources current?)
- Bias assessment (source diversity across perspectives)
- Decision-relevant framing (not just facts, but implications)
- "Mental model" section to build user understanding

---

### Exhaustive (Default)

**When to use:** Critical decision support, comprehensive surveys, topics with
high uncertainty, investigative research. **This is the default depth per the
core design principle.**

| Parameter                    | Value                                                            |
| ---------------------------- | ---------------------------------------------------------------- |
| **Token budget**             | 1.2M+                                                            |
| **Estimated cost**           | $12.00-$25.00+                                                   |
| **Agents**                   | 4-5 (4 searchers + 1 synthesizer)                                |
| **Search rounds**            | 5-8 per sub-question                                             |
| **Sources consulted**        | 30-60+                                                           |
| **Sub-questions**            | 8-15 (hierarchical, with sub-sub-questions)                      |
| **Verification**             | Thorough convergence (5 passes) on findings and synthesis        |
| **Self-audit**               | Full Tier 1-4 (all 8 quality dimensions + adversarial challenge) |
| **Convergence passes**       | Finding: 5, Synthesis: 5, Completeness: 3                        |
| **Adversarial verification** | Yes (contrarian challenge pass)                                  |
| **Expected output length**   | 8,000-20,000+ words                                              |
| **Wall-clock time**          | 20-45 minutes                                                    |

**Execution flow:**

1. Full determination phase with domain-specific source map
2. Decompose into 8-15 hierarchical MECE sub-questions
3. Present detailed plan with cost estimate for approval
4. **Breadth pass:** Spawn 4 parallel searcher agents for initial survey
5. Orchestrator reviews breadth findings, scores coverage gaps
6. **Depth pass:** Spawn additional searchers for under-covered areas
7. **Negative research:** Spawn searcher for "what has failed/what doesn't
   exist"
8. Synthesizer combines all findings
9. Thorough convergence loop on synthesis (5 passes)
10. Standard completeness audit (3 passes)
11. **Adversarial verification:**
    - Pass 1: source-check (neutral)
    - Pass 2: discovery (adversarial -- "find what's wrong")
    - Pass 3: verification (resolve red-team challenges)
    - Pass 4: fresh-eyes (independent final assessment)
12. Full Tier 1-4 self-audit (8 quality dimensions)
13. Present RESEARCH_OUTPUT.md with comprehensive downstream routing

**Quality bar (adds to Deep):**

- Exhaustive source coverage (saturation detection -- stop when new searches
  return only known information)
- Adversarial challenge of key findings
- Negative research ("what has been tried and failed")
- Serendipity register (unexpected findings surfaced)
- Cross-domain implications identified
- Reading guide for navigating the full report
- "Unexpected Findings" section
- Confidence calibration check
- Full 8-dimension quality assessment

---

## Comparison Matrix

| Dimension          | Quick    | Standard | Deep     | Exhaustive |
| ------------------ | -------- | -------- | -------- | ---------- |
| Token budget       | 80K      | 300K     | 600K     | 1.2M+      |
| Cost               | $0.50-$1 | $2-$5    | $5-$12   | $12-$25+   |
| Agents             | 0        | 3        | 4        | 5-6        |
| Sub-questions      | 0-1      | 3-5      | 5-8      | 8-15       |
| Search rounds      | 1        | 2-3      | 3-5      | 5-8        |
| Sources            | 2-3      | 8-15     | 15-30    | 30-60+     |
| Convergence passes | 0        | 4        | 8        | 18+        |
| Self-audit tiers   | 0        | 0        | 3        | 4          |
| Adversarial        | No       | No       | No       | Yes        |
| Negative research  | No       | No       | No       | Yes        |
| Serendipity        | No       | No       | No       | Yes        |
| File output        | Optional | Yes      | Yes      | Yes        |
| Wall-clock time    | 30-90s   | 3-7 min  | 8-15 min | 20-45 min  |

---

## Diminishing Returns Analysis

| Transition         | Marginal Quality Gain | Marginal Cost | Worth It?                     |
| ------------------ | --------------------- | ------------- | ----------------------------- |
| Quick -> Standard  | +40-60%               | 3-5x          | Almost always yes             |
| Standard -> Deep   | +15-25%               | 2-3x          | Yes for important decisions   |
| Deep -> Exhaustive | +5-10%                | 2-3x          | Only for critical/high-stakes |
| Beyond Exhaustive  | +1-3%                 | Unbounded     | Almost never                  |

**Implication for default depth:** The overkill principle says Exhaustive is
default. But the diminishing returns curve says Deep -> Exhaustive adds only
5-10% quality at 2-3x cost. The resolution: Exhaustive is the default _starting
point_, but the system should detect saturation and stop early when further
research adds nothing. An Exhaustive session that saturates at Deep-level effort
saves the user money while still being thorough.

---

## Auto-Selection Heuristics

When the user does not specify depth:

| Signal                                      | Selected Depth              |
| ------------------------------------------- | --------------------------- |
| Factual question + single domain            | Quick                       |
| "Quick"/"fast"/"brief" in query             | Quick                       |
| Descriptive/Comparative + single domain     | Standard                    |
| Evaluative/Exploratory + any domain         | Deep                        |
| Investigative/Predictive + any domain       | Exhaustive                  |
| "Overkill"/"exhaustive"/"thorough" in query | Exhaustive                  |
| Multi-domain or cross-cutting               | Deep minimum                |
| User has not specified and ambiguous        | **Exhaustive** (default)    |
| `--depth=X` flag provided                   | Override to specified depth |

---

## Verification Depth Scaling

| Research Depth | Finding Verification | Synthesis Verification | Completeness Check  |
| -------------- | -------------------- | ---------------------- | ------------------- |
| Quick          | None                 | None                   | None                |
| Standard       | Quick (2 passes)     | Quick (2 passes)       | None                |
| Deep           | Standard (3 passes)  | Standard (3 passes)    | Quick (2 passes)    |
| Exhaustive     | Thorough (5 passes)  | Thorough (5 passes)    | Standard (3 passes) |

The convergence loop's existing presets (quick=2, standard=3, thorough=5) map
directly to research depth levels.

---

## Open Questions

1. Should Exhaustive mode include a dedicated contrarian agent (separate from
   convergence loop adversarial passes)? The research phase used contrarian and
   outside-the-box agents to great effect, but they add significant cost.
2. Should saturation detection automatically downgrade Exhaustive to Deep when
   further research adds <5% new information? This saves cost but conflicts with
   the overkill principle.
3. For Quick mode, is terminal-only output (no files) the right default? Some
   users may want even quick lookups persisted for later reference.
4. Should Deep mode include negative research ("what has failed")? Currently
   reserved for Exhaustive only, but it is high-value at relatively low cost.
