# Research Quality Evaluation Framework

<!-- prettier-ignore-start -->
| Field        | Value                                                    |
| ------------ | -------------------------------------------------------- |
| Status       | COMPLETE                                                 |
| Last Updated | 2026-03-20                                               |
| Dimension    | How do you know if a deep-research output is actually good? |
<!-- prettier-ignore-end -->

## Executive Summary

Quality evaluation is the "how do we know it works" dimension of deep research.
Without it, every other design decision -- orchestration, convergence,
multi-agent patterns -- is theater. The core challenge: research quality is
multi-dimensional, partially subjective, and context-dependent. No single metric
captures it.

Key principles:

1. **Multi-dimensional assessment is non-negotiable.** A single "quality score"
   hides fatal flaws. Accuracy, completeness, depth, recency, objectivity, and
   actionability must be measured independently.
2. **Automated metrics catch the easy problems; LLM-as-judge catches the medium
   ones; only human feedback catches the hard ones.** All three layers are
   required.
3. **Quality gates at pipeline checkpoints prevent garbage propagation.** Bad
   findings corrupt synthesis; bad synthesis corrupts recommendations. Check
   quality early and often.
4. **Anti-pattern detection is as valuable as quality scoring.** Knowing what
   bad research looks like (Wikipedia-ism, echo chambers, confidence theater)
   enables targeted prevention.
5. **Benchmarking against established standards -- DRACO, ResearchRubrics,
   GRADE, IC Tradecraft Standards -- provides calibration.** Without external
   reference points, evaluation is circular.

---

## 1. Quality Dimensions

Research quality is not a single axis. The following eight dimensions form a
complete quality model, drawn from academic peer review, intelligence analysis
(ODNI ICD-203), journalism standards, and medical evidence grading (GRADE).

### 1.1 Accuracy

**Definition:** Are the stated facts correct and verifiable?

- The most fundamental dimension. Everything else is worthless if the facts are
  wrong.
- Includes both factual accuracy (verifiable claims) and logical accuracy (valid
  reasoning from premises to conclusions).
- LLM hallucination rates remain significant: studies show 28-40% of LLM
  references may be hallucinated (GPT-4 at 28.6%, GPT-3.5 at 39.6% in medical
  systematic reviews).
- **Measurement:** Citation verification, cross-source fact-checking, claim
  extraction + independent verification.
- **Source:** SemanticCite (4-class citation taxonomy), SourceCheckup
  (agent-based pipeline finding 50-90% of LLM citations not fully supported).

### 1.2 Completeness

**Definition:** Were all aspects of the research question covered?

- Not just "did it mention the topic" but "did it address every sub-question at
  adequate depth."
- The DeCE framework separates precision (factual accuracy) from recall
  (coverage of required concepts), treating completeness as the recall
  dimension.
- Sub-question coverage has been validated as an effective proxy for human
  perception of answer quality.
- **Measurement:** Sub-question decomposition + coverage scoring. For each
  sub-question derived from the original query, check whether the output
  addresses it. Coverage score = answered sub-questions / total sub-questions.

### 1.3 Relevance

**Definition:** Is the content actually useful for the research question?

- Research that is accurate and complete but tangential to the user's actual
  need scores zero on relevance.
- Must distinguish between topical relevance (is it about the right thing?) and
  pragmatic relevance (does it help the user do what they need to do?).
- **Measurement:** RAG-style answer relevancy (does the response actually
  address the question?) plus user-centric judgment (would the user find this
  useful?).

### 1.4 Depth

**Definition:** Did the research go deep enough, or did it just scratch the
surface?

- The most pernicious quality failure is "Wikipedia-ism" -- covering everything
  at surface level while adding no insight.
- Depth manifests as: analysis beyond mere reporting, synthesis of multiple
  sources into novel insights, identification of non-obvious implications,
  exploration of edge cases and caveats.
- **Measurement:** Word count per sub-topic (crude proxy), analysis-to-summary
  ratio (how much is synthesis vs. restatement), insight density (novel claims
  per section).

### 1.5 Recency

**Definition:** Is the information current?

- Domain-dependent: technology research requires sources from months, not years;
  legal research may cite century-old precedent appropriately.
- Temporal decay functions should adapt based on topic volatility: evergreen
  topics have slow decay, rapid-change topics have fast decay.
- **Measurement:** Average source age, recency-weighted source scoring with
  domain-appropriate half-life decay functions, presence of dated information
  flagged by explicit temporal context.

### 1.6 Objectivity

**Definition:** Does the research present multiple perspectives, or is it
biased?

- Directly inherited from intelligence analysis standards (ICD-203): analytic
  products must be objective and independent of political considerations.
- Echo chamber detection: are multiple sources actually independent, or do they
  all trace back to the same original? Ten mentions from the same root source do
  not triangulate -- they amplify the same potential error.
- **Measurement:** Source diversity (unique domains, author independence,
  geographic spread), perspective balance (are competing viewpoints represented
  proportionally?), assumption transparency (are analyst assumptions explicitly
  distinguished from findings?).

### 1.7 Actionability

**Definition:** Can the user make decisions based on this research?

- The ultimate pragmatic test. Research that informs without enabling action is
  academic exercise.
- Includes: clear recommendations (when warranted), decision frameworks,
  identified trade-offs, and explicit "here's what you should do next" guidance.
- **Measurement:** Presence of recommendations or decision frameworks,
  specificity of actionable items, conditional guidance ("if X then Y"),
  explicit next steps.

### 1.8 Verifiability

**Definition:** Can claims be traced to sources?

- Every substantive claim should be traceable to its source. This is the
  difference between research and opinion.
- The DRACO benchmark dedicates one of its four evaluation axes to citation of
  primary sources, and penalizes unsupported claims through negative-weighted
  rubric criteria.
- **Measurement:** Citation density (claims with sources / total claims), source
  accessibility (can the reader actually access the cited source?), citation
  accuracy (does the source actually say what's claimed?).

### Dimension Priority Framework

Not all dimensions are equally important in all contexts. Priority depends on
research type:

| Research Type        | Primary Dimensions           | Secondary Dimensions        |
| -------------------- | ---------------------------- | --------------------------- |
| Factual lookup       | Accuracy, Recency            | Verifiability, Completeness |
| Technology survey    | Completeness, Depth, Recency | Relevance, Objectivity      |
| Decision support     | Actionability, Accuracy      | Objectivity, Completeness   |
| Competitive analysis | Completeness, Recency        | Depth, Verifiability        |
| Risk assessment      | Accuracy, Objectivity        | Completeness, Verifiability |

---

## 2. Automated Metrics

Automated metrics are the first line of defense. They catch obvious quality
failures without human involvement or expensive LLM-as-judge calls. They are
necessary but not sufficient.

### 2.1 Source Metrics

| Metric                   | Formula / Approach                                      | Target                            |
| ------------------------ | ------------------------------------------------------- | --------------------------------- |
| Source count             | Total unique sources cited                              | >= 8 for standard, >= 15 for deep |
| Source diversity         | Unique domains / total sources                          | >= 0.6                            |
| Source independence      | Sources not sharing root (syndicated content detection) | >= 0.7                            |
| Geographic diversity     | Unique country-of-origin / total sources                | >= 0.3                            |
| Source type distribution | Mix of primary, secondary, expert opinion               | No single type > 60%              |

### 2.2 Citation Metrics

| Metric             | Formula / Approach                                    | Target                           |
| ------------------ | ----------------------------------------------------- | -------------------------------- |
| Citation density   | Cited claims / total substantive claims               | >= 0.8                           |
| Citation accuracy  | Verified citations / total citations (via spot-check) | >= 0.9                           |
| Orphan claim count | Substantive claims with no citation                   | 0 for critical, < 3 for standard |

### 2.3 Confidence Distribution

| Metric                | Formula / Approach                                   | Target        |
| --------------------- | ---------------------------------------------------- | ------------- |
| Confidence coverage   | Claims with explicit confidence level / total claims | >= 0.7        |
| HIGH confidence ratio | HIGH-confidence claims / total claims                | 0.3-0.6 range |
| Calibration error     | Abs(stated confidence - verified accuracy)           | < 0.15        |

The calibration error metric draws from LLM uncertainty quantification research:
confidence scores provided by LLMs are generally miscalibrated, typically
evaluated using Expected Calibration Error (ECE). A research system should aim
for better calibration than raw LLM output through triangulation and source
verification.

### 2.4 Coverage Metrics

| Metric                | Formula / Approach                                           | Target                                  |
| --------------------- | ------------------------------------------------------------ | --------------------------------------- |
| Sub-question coverage | Answered sub-questions / total decomposed sub-questions      | >= 0.85                                 |
| Section depth         | Word count per section relative to importance weight         | No section below 15% of weighted target |
| Gap detection         | Sub-questions answered with "unknown" or "insufficient data" | Flagged, not scored                     |

### 2.5 Consistency Metrics

| Metric                       | Formula / Approach                                       | Target                  |
| ---------------------------- | -------------------------------------------------------- | ----------------------- |
| Internal contradiction count | Claims that conflict with other claims in same output    | 0                       |
| Source-output alignment      | Output claims supported by cited sources                 | >= 0.9                  |
| Temporal consistency         | No newer information contradicting older claims silently | 0 silent contradictions |

### 2.6 Recency Metrics

| Metric                 | Formula / Approach                                   | Target                |
| ---------------------- | ---------------------------------------------------- | --------------------- |
| Mean source age        | Average publication date of all sources              | Domain-dependent      |
| Recency-weighted score | Sum(1 / (1 + decay_rate \* age_days)) / source_count | Domain-dependent      |
| Stale source flag      | Sources older than domain-specific threshold         | < 20% for tech topics |

### 2.7 Structural Metrics

| Metric               | Formula / Approach                                       | Target                                      |
| -------------------- | -------------------------------------------------------- | ------------------------------------------- |
| Output length        | Total word count                                         | Within 80-120% of target for research depth |
| Section balance      | Max section length / min section length                  | < 5:1 ratio                                 |
| Summary completeness | Key findings in executive summary / key findings in body | >= 0.8                                      |

### Composite Score

A composite quality score should be a weighted combination of dimension scores,
not a simple average. Weights should be configurable per research type (see
Dimension Priority Framework above). The DRACO benchmark provides a concrete
model:

```
raw_score = sum(v_i * w_i for all criteria i)
normalized_score = clamp(raw_score / sum_positive_weights, 0, 1) * 100%
```

Where each criterion has a weight (positive for desirable properties, negative
for errors like hallucinations) and receives a binary verdict (MET/UNMET).

---

## 3. LLM-as-Judge Patterns

Using a separate LLM to evaluate research quality is the middle layer of the
evaluation stack -- more nuanced than automated metrics, cheaper and faster than
human review. The field has matured significantly, with established patterns,
known biases, and documented mitigation strategies.

### 3.1 Evaluation Types

**Pointwise Evaluation (most common):** Score each output independently against
a rubric. Each dimension (accuracy, completeness, depth, etc.) receives a score
on a defined scale. This is the approach used by G-Eval, DRACO, and
ResearchRubrics.

**Pairwise Evaluation:** "Is output A better than B?" Useful for A/B testing
different research configurations. More reliable than pointwise for relative
ranking but cannot produce absolute quality scores.

**Listwise Evaluation:** Rank multiple outputs. Used in LMSYS Chatbot
Arena-style evaluation but less practical for research where you typically have
one output.

**Pass/Fail Evaluation:** Binary assessment against minimum criteria. Useful for
quality gates where the question is "is this good enough to deliver?" not "how
good is it?"

### 3.2 Rubric Design

The most critical factor in LLM-as-judge quality is rubric design. Research from
ResearchRubrics (2,593 human-authored criteria), DRACO (avg 39.3 criteria per
task), and DeepResearch Bench II (9,430 fine-grained binary rubrics) converges
on these principles:

1. **Decompose criteria into atomic units.** Each rubric item should test one
   thing. "Is the analysis accurate and comprehensive?" is two criteria
   disguised as one.

2. **Binary verdicts over Likert scales.** DRACO and DeepResearch Bench II both
   use MET/UNMET rather than 1-5 scales. Binary verdicts are more reliable
   across different judge models. Weighting handles importance differences.

3. **Ground rubrics in verifiable facts.** DeepResearch Bench II derives rubrics
   from expert reports so that the judge does not need domain knowledge -- it
   only needs to check whether specific, verifiable claims appear in the output.
   This transforms subjective assessment into fact-checking.

4. **Include negative criteria (penalties).** DRACO uses negative-weighted
   criteria to penalize hallucinations, unsupported claims, and factual errors.
   A response that scores well on positive criteria but triggers negative
   criteria still gets a low score.

5. **Use Recursive Rubric Decomposition (RRD).** For complex criteria, decompose
   high-level rubric items into finer-grained subpoints. This improves judge
   reliability and produces more interpretable evaluations.

6. **Saturation test rubrics.** If the best available system scores above 90% on
   a rubric, the rubric is too easy. DRACO revised ~45% of rubrics through this
   process.

### 3.3 Implementation Pattern: G-Eval Adapted for Research

G-Eval provides a proven template: task introduction + evaluation criteria +
chain-of-thought generation of evaluation steps + form-filling scoring. Adapted
for research evaluation:

```
SYSTEM: You are a research quality evaluator. You will assess a research
output against specific criteria using chain-of-thought reasoning.

TASK: Evaluate the following research output for [DIMENSION].

CRITERIA:
[Dimension-specific rubric items]

EVALUATION STEPS:
1. Read the research output completely.
2. For each rubric item, determine if it is MET or UNMET.
3. Provide evidence from the output for each verdict.
4. Note any issues not covered by the rubric.

OUTPUT FORMAT:
For each criterion:
- Criterion: [description]
- Verdict: MET / UNMET
- Evidence: [quote or reference from output]
- Notes: [any additional observations]
```

### 3.4 Known Biases and Mitigation

The LLM-as-judge literature has identified 12+ distinct bias types. The most
relevant for research evaluation:

| Bias Type       | Description                                        | Mitigation                                      |
| --------------- | -------------------------------------------------- | ----------------------------------------------- |
| Verbosity bias  | Prefers longer responses regardless of quality     | Length-normalized scoring; rubric-based eval    |
| Position bias   | Prefers first/last items in pairwise comparison    | Swap order and average; randomize presentation  |
| Self-preference | Prefers outputs generated by the same model family | Use different model for judge than for research |
| Authority bias  | Defers to confident-sounding text                  | Require evidence for each criterion             |
| Sycophancy      | Agrees with the implied quality of the prompt      | Neutral framing; no quality hints in prompt     |
| Anchoring       | First impression dominates subsequent assessment   | Criterion-by-criterion evaluation               |

**Critical mitigation strategies:**

- **Never use the same model to generate and judge.** Self-preference bias is
  well-documented. If Claude generates the research, use a different model (or
  at minimum a different prompt configuration) to judge it.
- **Ensemble evaluation.** Use multiple judge models and aggregate. Relative
  rankings remain consistent even when absolute scores vary (validated by DRACO
  across three judge models).
- **Binary over scalar.** Binary verdicts (MET/UNMET) reduce the surface area
  for bias compared to 1-5 Likert scales.

### 3.5 Limitations of LLM Judges

LLM judges are better than no evaluation but worse than expert human review:

- **Cannot verify facts against the real world.** They can check internal
  consistency and source-claim alignment, but cannot confirm whether a cited
  source actually says what's claimed without retrieval.
- **Miscalibrated on domain expertise.** A judge may rate a technically
  incorrect claim as MET if it sounds plausible and matches the rubric's
  surface-level description.
- **Blind to omission.** They can assess what is present but struggle to
  identify what is missing -- the completeness dimension is their weakest.
- **Detection accuracy drops for subtle errors.** Dramatic hallucinations are
  caught; "almost correct but subtly off" claims often pass.
- **Accuracy varies by domain.** Medical and legal accuracy assessment requires
  domain knowledge that general-purpose judges lack.

### 3.6 Self-Evaluation (Research System Evaluating Its Own Output)

Self-evaluation is tempting (no additional cost, no latency) but unreliable:

- The same biases that caused errors in generation affect self-evaluation.
- Useful only as a sanity check, not as a quality gate.
- Best application: identifying claims the system itself has low confidence in,
  flagging them for external verification rather than self-certifying quality.

---

## 4. User Feedback Integration

Human feedback is the ground truth that calibrates everything else. Automated
metrics and LLM judges are only as good as their correlation with human quality
perception.

### 4.1 Explicit Feedback Signals

| Signal                 | Implementation                       | Interpretation             |
| ---------------------- | ------------------------------------ | -------------------------- |
| Overall quality rating | 1-5 stars or thumbs up/down          | Global quality signal      |
| Dimension ratings      | Rate accuracy, completeness, etc.    | Per-dimension calibration  |
| Error flagging         | "This fact is wrong" inline          | Accuracy ground truth      |
| Missing info flag      | "You didn't cover X"                 | Completeness ground truth  |
| Usefulness rating      | "Did this help you make a decision?" | Actionability ground truth |

### 4.2 Implicit Feedback Signals

Research on implicit feedback in AI systems has shown these signals can be 13x
more frequent than explicit feedback, making them essential for learning at
scale:

| Signal              | Implementation                    | Interpretation                |
| ------------------- | --------------------------------- | ----------------------------- |
| Citation/reuse      | User quotes or pastes from output | High relevance/trust          |
| Follow-up questions | User asks for more depth on X     | X was insufficient depth      |
| Abandonment         | User stops reading at section Y   | Y or earlier was the problem  |
| Reformulation       | User rephrases the same question  | Output missed the intent      |
| Time spent          | Reading time per section          | Engagement proxy              |
| Action taken        | User acts on recommendations      | Ultimate actionability signal |

### 4.3 Feedback Loop Architecture

```
Research Output
    |
    v
User Interaction (implicit signals collected passively)
    |
    v
Explicit Feedback Prompt (non-intrusive, at natural breakpoints)
    |
    v
Feedback Storage (persistent, linked to research task + config)
    |
    v
Aggregate Analysis (per-dimension quality trends over time)
    |
    v
Calibration Updates (adjust automated metric thresholds,
                      retune LLM judge rubrics,
                      update quality gate thresholds)
```

### 4.4 Feedback Persistence and Learning

- Store feedback with full context: the research query, configuration (depth
  level, domain), output, and all metric scores. This enables correlation
  analysis between automated metrics and human satisfaction.
- Track per-user calibration: some users have higher standards than others. A
  4-star from a harsh critic is more informative than a 5-star from an easy
  grader.
- **Bias awareness:** Explicit feedback skews toward users who had notably good
  or bad experiences. Implicit feedback captures the middle ground but requires
  careful interpretation.

---

## 5. Benchmarking

### 5.1 Existing Benchmarks for AI Research Quality

Three purpose-built benchmarks have emerged for evaluating deep research agents:

**DRACO (Perplexity, 2026)**

- Deep Research Accuracy, Completeness, and Objectivity benchmark.
- 100 tasks across 10 domains (Academic, Finance, Law, Medicine, Technology,
  General Knowledge, UX Design, Personalized Assistant, Shopping, Needle-in-
  Haystack).
- Expert-crafted rubrics averaging ~40 criteria per task across four axes:
  factual accuracy (~50% of criteria), breadth/depth, presentation quality,
  source citation.
- Weighted binary criteria (positive and negative), LLM-as-judge protocol.
- Scoring: normalized weighted sum, 0-100%.
- Open source on HuggingFace.

**ResearchRubrics (Scale AI, 2025)**

- 2,500+ expert-written, fine-grained rubric criteria, zero LLM-generated
  criteria.
- Built with 2,800+ hours of human labor.
- Proposes complexity framework: conceptual breadth, logical nesting,
  exploration.
- Binary and ternary grading options.
- Key finding: even the strongest deep research agents (OpenAI, Google,
  Perplexity) fall below 68% average rubric compliance.

**DeepResearch Bench II (2026)**

- 132 tasks across 22 domains with 9,430 fine-grained binary rubrics.
- Rubrics derived from human expert reports, not LLM-generated.
- Three evaluation dimensions: Information Recall, Analysis, Presentation.
- Addresses prior benchmarks' weaknesses: rubrics are verifiable without domain
  knowledge from the judge.

**Adjacent Benchmarks:**

| Benchmark            | What It Tests                        | Relevance to Deep Research   |
| -------------------- | ------------------------------------ | ---------------------------- |
| FRAMES (Google)      | RAG factuality, retrieval, reasoning | Multi-hop question accuracy  |
| GAIA                 | Real-world problem-solving           | Complex reasoning + tool use |
| Humanity's Last Exam | Expert-level reasoning               | Ceiling test for depth       |
| STORM evaluation     | Wikipedia-quality article generation | Structure + citation quality |

### 5.2 Building Project-Specific Benchmarks

External benchmarks measure general quality. Project-specific benchmarks measure
quality for your users on your topics:

1. **Curate gold-standard outputs.** Have domain experts write "ideal" research
   outputs for 10-20 representative queries. These become the reference set.
2. **Develop task-specific rubrics.** For each gold-standard query, write 20-40
   binary criteria covering all eight quality dimensions. Follow the DRACO
   model: positive criteria for desired properties, negative criteria for
   errors.
3. **Include difficulty stratification.** Mix straightforward factual queries,
   multi-hop reasoning tasks, and open-ended analysis tasks. The ResearchRubrics
   complexity framework (conceptual breadth + logical nesting + exploration)
   provides a useful categorization.
4. **Run regularly.** Benchmark after every significant change to the research
   pipeline. Track scores over time to detect regression.

### 5.3 Baseline Comparison

To demonstrate value, the deep-research system must be compared against
alternatives:

| Baseline                 | How to Compare                           |
| ------------------------ | ---------------------------------------- |
| Manual web search        | Same query, human researcher, time-boxed |
| Single-shot LLM query    | Same query to base model, no research    |
| Existing GSD researchers | Same query through current pipeline      |
| Competing deep research  | Same query to OpenAI/Perplexity/Gemini   |

Compare on all eight quality dimensions, not just overall satisfaction.

### 5.4 A/B Testing

For iterative improvement, A/B test specific research configurations:

- **Depth levels:** Does "thorough" actually produce better output than
  "standard"?
- **Source count thresholds:** Does requiring 15 sources improve accuracy vs. 8?
- **Synthesis strategies:** Progressive vs. batch synthesis quality comparison.
- **Judge configurations:** Does ensemble judging correlate better with human
  ratings?

Use pairwise LLM evaluation for initial screening, human evaluation for
confirmation of significant differences.

---

## 6. Quality Gates in the Research Pipeline

Quality gates are checkpoints where quality is assessed and a go/no-go decision
is made. Drawing from CI/CD quality gate patterns and DRACO's evaluation
methodology, the research pipeline needs gates at three points.

### 6.1 Gate 1: Pre-Synthesis (Individual Finding Quality)

**When:** After each research sub-question is answered, before findings are
combined.

**What to check:**

- Citation presence: every substantive claim has a source.
- Source verification: cited sources are accessible and actually support the
  claim (spot-check, not exhaustive).
- Internal consistency: no contradictions within this finding.
- Confidence assignment: each claim has an explicit confidence level.
- Minimum depth: finding meets word count / detail threshold for its importance
  weight.

**On failure:**

- **Recoverable:** Re-research the sub-question with refined search queries.
- **Degraded:** Mark the finding as LOW confidence and flag for user attention.
- **Blocking:** If accuracy check fails (claim contradicts source), remove the
  finding entirely.

### 6.2 Gate 2: Post-Synthesis (Combined Output Quality)

**When:** After all findings are synthesized into a coherent output, before
final formatting.

**What to check:**

- Coverage completeness: all sub-questions addressed.
- Cross-finding consistency: no contradictions between different sections.
- Synthesis quality: output adds insight beyond mere concatenation of findings.
- Objectivity: competing viewpoints represented where relevant.
- Source diversity: not over-reliant on a single source or source type.

**On failure:**

- **Recoverable:** Re-synthesize with explicit instructions to resolve gaps.
- **Degraded:** Add explicit caveats to output ("This analysis could not fully
  address X due to limited source availability").
- **Blocking:** If coverage is below 50%, return to research phase.

### 6.3 Gate 3: Pre-Delivery (Final Quality Check)

**When:** After final output is formatted, before presenting to user.

**What to check:**

- LLM-as-judge evaluation against dimension rubrics (full eval or spot-check
  depending on configured depth).
- Structural completeness: executive summary, all sections, source list.
- Confidence calibration sanity check: are HIGH-confidence claims actually the
  most well-sourced?
- Actionability: does the output contain recommendations or decision-enabling
  information?
- Format compliance: meets output specification for the configured research
  depth.

**On failure:**

- **Recoverable:** Auto-fix structural issues, regenerate weak sections.
- **Degraded:** Deliver with quality warnings ("This output scored below
  threshold on [dimension]; consider supplementing with additional research").
- **Blocking:** Rare at this stage. Only if critical accuracy failures are
  detected.

### 6.4 Gate Behavior Configuration

Quality gate strictness should scale with research depth level:

| Depth Level | Gate 1 (Pre-Synth) | Gate 2 (Post-Synth) | Gate 3 (Pre-Delivery) |
| ----------- | ------------------ | ------------------- | --------------------- |
| Quick       | Spot-check only    | Skip                | Structural only       |
| Standard    | All checks         | All checks          | All checks            |
| Thorough    | All + re-verify    | All + convergence   | Full LLM-as-judge     |
| Exhaustive  | All + triangulate  | All + convergence   | Full eval + user gate |

---

## 7. Research Quality Anti-Patterns

Detecting anti-patterns is often more actionable than measuring quality
dimensions directly. Each anti-pattern has distinct signatures and specific
countermeasures.

### 7.1 "Wikipedia-ism" -- Broad but Shallow

**What it looks like:** Covers many sub-topics but none in depth. Reads like an
encyclopedia entry. Lots of text, no insight. Every section is 2-3 sentences of
surface-level summary.

**Detection signals:**

- Low analysis-to-summary ratio (mostly restatement, little synthesis).
- Even word distribution across all sections regardless of importance.
- Absence of caveats, edge cases, or "it depends" qualifications.
- No novel synthesis -- every paragraph could be found in a single source.

**Countermeasure:** Depth scoring per sub-topic against importance-weighted
thresholds. Force minimum word counts for high-priority sections. Include "so
what?" prompts in synthesis instructions.

### 7.2 "Echo Chamber" -- Apparent Diversity, Actual Monoculture

**What it looks like:** 15 sources cited, but 12 of them are blog posts
summarizing the same original study. Appears well-sourced but actually has a
single point of failure.

**Detection signals:**

- High source count but low source independence score.
- Multiple sources sharing identical phrases or data points (syndication
  detection).
- All sources published within a narrow time window (press release cascade).
- Single geographic or institutional origin for all sources.

**Countermeasure:** Source triangulation -- require genuinely independent source
types (regulatory filings + verified news + direct observation, not three news
articles about the same press release). Denzin's four triangulation types (data,
researcher, theory, method) provide the framework.

### 7.3 "Confidence Theater" -- Sounds Authoritative, Lacks Verification

**What it looks like:** Assertive language, definitive claims, no hedging -- but
claims are unverified or cherry-picked. The output sounds like it was written by
an expert but is actually a confident paraphrase of whatever was found first.

**Detection signals:**

- High confidence ratio (> 70% HIGH confidence) without proportional citation
  density.
- Absence of uncertainty language ("may," "suggests," "evidence indicates").
- Claims stated as fact that are actually contested in the literature.
- No explicit discussion of limitations or conflicting evidence.

**Countermeasure:** Calibration enforcement -- require that HIGH-confidence
claims have 3+ independent sources. Flag claims with high confidence but low
citation count. The intelligence community standard (ICD-203) requires analysts
to "properly express and explain uncertainties associated with major analytic
judgments."

### 7.4 "Quantity Over Quality" -- Source Hoarding

**What it looks like:** 50 sources cited but none read carefully. Sources are
grabbed by title/snippet relevance and cited without deep engagement. The output
could have been written from just the search result snippets.

**Detection signals:**

- Very high source count relative to output length.
- Citations cluster at the beginning or end of paragraphs (not integrated into
  analysis).
- Cited claims are surface-level (could be extracted from title + snippet).
- No source synthesis (Source A says X, Source B says Y, never "A and B together
  imply Z").

**Countermeasure:** Source engagement scoring -- does the output demonstrate
that the source was actually read (citing specific data points, page numbers, or
non-obvious findings)? Limit maximum sources per sub-topic and require deeper
engagement with fewer.

### 7.5 "Stale Authority" -- Citing Outdated Official Sources

**What it looks like:** Cites a 2019 government report or a 2020 industry
standard as current, when the landscape has changed significantly. Technically
the citation is accurate -- the report did say that -- but the information is no
longer current.

**Detection signals:**

- Source age above domain-specific threshold (e.g., > 2 years for technology).
- Official/authoritative sources cited without temporal context.
- Absence of "as of [date]" qualifiers on time-sensitive claims.
- Newer contradicting sources exist but are not cited.

**Countermeasure:** Mandatory temporal context on all cited sources. Recency
scoring with domain-appropriate decay. Require explicit "current as of" dating
on any claim about present state.

### 7.6 "Hallucination Laundering" -- Fabricated Sources That Sound Real

**What it looks like:** Citations to sources that do not exist, or to real
sources that do not actually contain the cited information. The LLM generates
plausible-sounding citations that pass cursory review.

**Detection signals:**

- Citation verification failure (URL returns 404, or source does not contain
  claimed information).
- Suspiciously perfect citations (too clean, too relevant).
- Source details that cannot be independently confirmed (author names,
  publication dates).

**Countermeasure:** Mandatory URL verification for all cited sources. Spot-check
source-claim alignment by retrieving the source and confirming the claim
appears. SourceCheckup-style automated pipeline.

### 7.7 "Analysis Paralysis" -- So Many Caveats Nothing Is Concluded

**What it looks like:** The inverse of Confidence Theater. Every claim is hedged
to the point of uselessness. "Some sources suggest X, while others suggest Y;
the truth likely depends on context." No conclusions, no recommendations, no
actionable insight.

**Detection signals:**

- Zero or near-zero HIGH-confidence claims.
- High hedge-word density ("may," "might," "some suggest," "it depends").
- No recommendations section, or recommendations are themselves hedged.
- User feedback: "This didn't help me decide anything."

**Countermeasure:** Require explicit conclusions even when uncertainty exists.
Force "best available answer given current evidence" framing. Include a
"confidence-adjusted recommendation" that acknowledges uncertainty but still
provides direction.

---

## 8. Industry Standards

### 8.1 Academic Peer Review

The gold standard for research quality, with centuries of practice:

- **Rubric-based assessment.** Systematic review tools (AMSTAR, ROBIS, PRESS)
  evaluate specific methodological criteria, not holistic impressions.
- **Multi-reviewer consensus.** Multiple independent reviewers reduce individual
  bias. Inter-rater reliability measured via Cohen's Kappa.
- **Structured criteria.** Key topics: correct classification, adherence to
  systematic methods, search strategy quality, risk of bias assessment, evidence
  synthesis methods, data availability.
- **Applicability to deep research:** Adopt rubric-based evaluation with
  multiple judge models as the analogue of multiple reviewers.

### 8.2 Journalism (Fact-Checking Standards)

The International Fact-Checking Network (IFCN) and editorial standards provide:

- **Checkability assessment.** A claim must be verifiable -- opinion-based
  claims are excluded from fact-checking. Relevant for research: distinguish
  between verifiable facts and analyst judgment.
- **Source transparency.** All sources and arguments leading to a verdict must
  be provided, enabling readers to reach the same conclusions.
- **Cross-checking.** Work is cross-checked by peers and scrutinized by
  editorial teams before publication.
- **Correction policy.** Explicit process for correcting errors after
  publication.
- **17 debunking techniques.** Research has identified 17 distinct verification
  techniques used across 23 fact-checking organizations.
- **Applicability to deep research:** Adopt source transparency and
  cross-checking principles. Every claim traceable to source; synthesis reviewed
  before delivery.

### 8.3 Intelligence Analysis (ODNI ICD-203)

The Intelligence Community Directive 203 defines nine Analytic Tradecraft
Standards, highly applicable to AI research:

1. **Properly describe quality and credibility of underlying sources.**
2. **Properly express and explain uncertainties.**
3. **Properly distinguish between intelligence information and analysts'
   assumptions and judgments.**
4. **Incorporate alternative analysis where appropriate.**
5. **Demonstrate relevance to customers' needs.**
6. **Use clear and logical argumentation.**
7. **Explain change to or consistency of analytic judgments.**
8. **Make accurate judgments and assessments.**
9. **Incorporate effective visual information where appropriate.**

Evaluated on a 4-level scale: Poor (0), Fair (1), Good (2), Excellent (3).

**Applicability to deep research:** This maps almost directly to the eight
quality dimensions. Standards 1-3 correspond to Verifiability and Accuracy.
Standard 4 maps to Objectivity. Standard 5 maps to Relevance and Actionability.
Standards 6-7 map to Depth and Completeness. Standard 8 maps to Accuracy. The
ODNI framework validates our dimension model.

### 8.4 Medical Evidence Grading (GRADE)

The Grading of Recommendations, Assessment, Development and Evaluation (GRADE)
system is used worldwide for health care evidence:

- **Four quality levels:** High, Moderate, Low, Very Low.
- **Five downgrade factors:** Risk of bias, inconsistency, indirectness,
  imprecision, publication bias.
- **Three upgrade factors:** Large effect, dose-response gradient, all plausible
  confounders would reduce effect.
- **Evidence type hierarchy:** Randomized trials start HIGH; observational
  studies start LOW but can upgrade.
- **Applicability to deep research:** The downgrade/upgrade factor model is
  directly applicable. Research quality starts at a baseline and is adjusted up
  or down based on specific quality signals. This is more nuanced than simple
  scoring and better handles the "it depends" nature of research quality.

### 8.5 Consulting (Management Consulting QA)

Major consulting firms (McKinsey, BCG, Bain) operationalize research quality
through:

- **Knowledge Networks.** Dedicated knowledge professionals (McKinsey has
  2,000+) who build institutional knowledge and quality-check research.
- **ISO 9001 quality management systems.** Structured QA processes, not ad-hoc.
- **Proprietary benchmarking databases.** Research validated against curated,
  verified data sets rather than raw web sources.
- **Peer review before client delivery.** Multiple rounds of review by subject
  matter experts and engagement managers.
- **Applicability to deep research:** The multi-round review before delivery
  maps to the three quality gates. The knowledge base approach maps to curated
  source lists and domain-specific verification databases.

---

## 9. Design Recommendations

### 9.1 Three-Layer Evaluation Architecture

```
Layer 1: AUTOMATED METRICS (every research output)
  - Source count, diversity, independence
  - Citation density and coverage
  - Confidence distribution
  - Sub-question coverage score
  - Recency score
  - Structural completeness
  |
  v  Metrics attached to output metadata
  |
Layer 2: LLM-AS-JUDGE (standard depth and above)
  - Dimension-specific rubric evaluation
  - Binary criteria (MET/UNMET) with weighted scoring
  - Anti-pattern detection scan
  - Different model from research generator
  |
  v  Quality score per dimension + anti-pattern flags
  |
Layer 3: USER FEEDBACK (collected on every output, analyzed in aggregate)
  - Explicit: quality rating, error flagging, missing info
  - Implicit: citation/reuse, follow-up patterns, time spent
  - Persisted with full context for correlation analysis
  |
  v  Ground truth calibration for Layers 1 and 2
```

### 9.2 Quality Gate Integration Points

Map quality gates to the research pipeline stages defined in
ORCHESTRATION_PATTERNS.md:

| Pipeline Stage              | Quality Gate          | Automated Metrics | LLM Judge | User Gate       |
| --------------------------- | --------------------- | ----------------- | --------- | --------------- |
| After sub-question research | Gate 1 (Pre-Synth)    | Yes               | No (cost) | No              |
| After synthesis             | Gate 2 (Post-Synth)   | Yes               | Standard+ | No              |
| Before delivery             | Gate 3 (Pre-Delivery) | Yes               | Standard+ | Exhaustive only |

### 9.3 Convergence Loop Integration

Quality evaluation connects directly to the convergence loop framework described
in CONVERGENCE_IN_RESEARCH.md:

- **Finding verification** (convergence loop point 1) uses Gate 1 metrics as
  convergence criteria. A finding "converges" when its accuracy and confidence
  metrics meet thresholds.
- **Synthesis verification** (point 2) uses Gate 2 metrics. Synthesis converges
  when cross-finding consistency, coverage, and depth metrics stabilize.
- **Completeness verification** (point 3) uses the sub-question coverage metric
  from Gate 2. Complete when coverage >= 0.85.

### 9.4 Metric Storage and Tracking

Every research output should persist:

```json
{
  "task_id": "unique-id",
  "query": "original research question",
  "config": { "depth": "standard", "domain": "technology" },
  "metrics": {
    "source_count": 12,
    "source_diversity": 0.75,
    "citation_density": 0.88,
    "coverage_score": 0.92,
    "confidence_distribution": { "HIGH": 0.4, "MEDIUM": 0.45, "LOW": 0.15 },
    "recency_score": 0.82,
    "contradiction_count": 0,
    "word_count": 3200
  },
  "judge_scores": {
    "accuracy": 0.85,
    "completeness": 0.9,
    "relevance": 0.95,
    "depth": 0.78,
    "recency": 0.8,
    "objectivity": 0.88,
    "actionability": 0.72,
    "verifiability": 0.91
  },
  "anti_patterns_detected": [],
  "composite_score": 0.84,
  "user_feedback": null,
  "timestamp": "2026-03-20T10:00:00Z"
}
```

Track metrics over time to detect:

- Quality regression after pipeline changes.
- Dimension-specific weaknesses that need targeted improvement.
- Correlation between automated metrics and user satisfaction (calibration).

### 9.5 Failure Mode Handling

| Failure Type                    | Detection                          | Response                                            |
| ------------------------------- | ---------------------------------- | --------------------------------------------------- |
| Accuracy failure (Gate 1)       | Citation verification fails        | Re-research with stricter source requirements       |
| Completeness failure (Gate 2)   | Coverage < 0.85                    | Identify gaps, research missing sub-questions       |
| Depth failure (Gate 3)          | Judge scores depth < 0.5           | Expand shallow sections with deeper research        |
| Anti-pattern detected           | Pattern-specific detection signals | Pattern-specific countermeasure                     |
| All gates pass but user unhappy | Negative explicit feedback         | Analyze feedback, update rubrics, adjust thresholds |
| Persistent low scores           | Trend analysis shows decline       | Root cause analysis, pipeline review                |

### 9.6 Cost-Quality Trade-off

Quality evaluation itself has a cost (tokens, latency, complexity). The
architecture must balance thoroughness with practicality:

| Evaluation Level       | Token Cost (approx.) | Latency Addition | When to Use      |
| ---------------------- | -------------------- | ---------------- | ---------------- |
| Automated only         | ~0 (deterministic)   | < 1 second       | Quick depth      |
| + LLM spot-check       | ~2K tokens           | 5-10 seconds     | Standard depth   |
| + Full LLM judge       | ~10K tokens          | 30-60 seconds    | Thorough depth   |
| + Multi-judge ensemble | ~30K tokens          | 60-120 seconds   | Exhaustive depth |

### 9.7 Minimum Viable Quality Framework

For initial implementation, start with:

1. **Automated metrics** (all seven categories from Section 2) -- free, fast,
   always-on.
2. **One LLM-as-judge pass** with binary rubrics covering accuracy,
   completeness, and depth -- the three most critical dimensions.
3. **Anti-pattern scan** for the two most damaging patterns: Wikipedia-ism and
   Echo Chamber.
4. **Simple user feedback** -- thumbs up/down + optional free-text.
5. **Gate 1 and Gate 3** only (skip Gate 2 for initial launch).

Then iterate based on which quality failures users actually experience.

---

## Appendix A: Quality Dimension Rubric Templates

### Accuracy Rubric (Binary Criteria)

| #   | Criterion                                                  | Weight | Type     |
| --- | ---------------------------------------------------------- | ------ | -------- |
| A1  | All cited statistics match their sources                   | +3     | Positive |
| A2  | All named entities (people, orgs, dates) are correct       | +3     | Positive |
| A3  | Logical reasoning from evidence to conclusions is valid    | +2     | Positive |
| A4  | No claims that contradict cited sources                    | -3     | Negative |
| A5  | No fabricated citations (sources exist and contain claims) | -5     | Negative |
| A6  | Uncertainty is acknowledged where evidence is ambiguous    | +1     | Positive |

### Completeness Rubric (Binary Criteria)

| #   | Criterion                                                 | Weight | Type     |
| --- | --------------------------------------------------------- | ------ | -------- |
| C1  | All explicitly requested sub-topics are addressed         | +3     | Positive |
| C2  | Each sub-topic has sufficient depth (not just mentioned)  | +2     | Positive |
| C3  | Edge cases and caveats are discussed where relevant       | +1     | Positive |
| C4  | Competing viewpoints are represented on contested topics  | +1     | Positive |
| C5  | Major relevant sub-topics not in the query are identified | +1     | Positive |
| C6  | Critical omission: a major aspect is entirely missing     | -3     | Negative |

### Depth Rubric (Binary Criteria)

| #   | Criterion                                                    | Weight | Type     |
| --- | ------------------------------------------------------------ | ------ | -------- |
| D1  | Analysis goes beyond restating sources (novel synthesis)     | +3     | Positive |
| D2  | Specific data, examples, or case studies are provided        | +2     | Positive |
| D3  | Implications and second-order effects are discussed          | +2     | Positive |
| D4  | Trade-offs and decision factors are explicitly articulated   | +2     | Positive |
| D5  | Output is mostly restatement with no original analysis       | -3     | Negative |
| D6  | Sections are so brief they add no value beyond a bullet list | -2     | Negative |

---

## Appendix B: Industry Standard Comparison Matrix

| Standard            | Accuracy | Completeness | Relevance | Depth  | Recency | Objectivity | Actionability | Verifiability |
| ------------------- | -------- | ------------ | --------- | ------ | ------- | ----------- | ------------- | ------------- |
| GRADE (Medical)     | High     | High         | Medium    | High   | Medium  | High        | High          | High          |
| ICD-203 (Intel)     | High     | Medium       | High      | Medium | Medium  | High        | High          | High          |
| IFCN (Journalism)   | High     | Low          | Medium    | Low    | High    | High        | Low           | High          |
| Peer Review (Acad.) | High     | High         | Medium    | High   | Low     | High        | Low           | High          |
| ISO 9001 (Consult.) | Medium   | High         | High      | Medium | Medium  | Medium      | High          | Medium        |
| DRACO (AI Research) | High     | High         | Medium    | High   | Medium  | High        | Medium        | High          |

---

## Appendix C: Key References

- [DRACO Benchmark (Perplexity)](https://huggingface.co/datasets/perplexity-ai/draco)
  -- Open-source deep research evaluation benchmark
- [ResearchRubrics (Scale AI)](https://arxiv.org/abs/2511.07685) -- Expert-
  authored rubrics for deep research evaluation
- [DeepResearch Bench II](https://arxiv.org/abs/2601.08536) -- Expert-report-
  derived rubric evaluation
- [G-Eval](https://ar5iv.labs.arxiv.org/html/2303.16634) -- Chain-of-thought NLG
  evaluation framework
- [GRADE Working Group](https://www.gradeworkinggroup.org/) -- Medical evidence
  quality grading
- [ODNI ICD-203](https://www.dni.gov/files/documents/ICD/ICD-203.pdf) --
  Intelligence analytic tradecraft standards
- [Ragas Framework](https://docs.ragas.io/) -- RAG evaluation metrics
  (faithfulness, relevance, precision, recall)
- [LLM-as-Judge Bias Study](https://llm-judge-bias.github.io/) -- 12 bias types
  in LLM evaluation
- [SemanticCite](https://arxiv.org/html/2511.16198v1) -- AI-powered citation
  verification
- [Stanford STORM](https://storm-project.stanford.edu/) -- LLM research writing
  system and evaluation
- [FRAMES (Google)](https://arxiv.org/abs/2409.12941) -- RAG factuality and
  reasoning benchmark
- [Uncertainty Quantification Survey](https://arxiv.org/abs/2503.15850) -- LLM
  confidence calibration

---

## Version History

| Version | Date       | Changes          |
| ------- | ---------- | ---------------- |
| 1.0     | 2026-03-20 | Initial research |
