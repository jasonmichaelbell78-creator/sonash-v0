# Findings: What verification and quality gate patterns exist for research outputs at different scales?

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-24
**Sub-Question IDs:** SQ-009

## Key Findings

### SECTION A: AI-Specific Verification Patterns

1. **Self-Consistency Checking is a proven, cost-reducible verification
   pattern** [CONFIDENCE: HIGH]

   Self-consistency (SC) is a well-established technique where the same question
   is asked multiple ways and answers are compared. Confidence-Informed
   Self-Consistency (CISC), published at ACL 2025, outperforms standard SC in
   nearly all configurations while reducing the required number of reasoning
   paths by over 40% on average (tested across 9 models and 4 datasets) [1].
   Difficulty-Adaptive Self-Consistency (DSC) further optimizes by first ranking
   problem difficulty using the LLM itself, then partitioning problems into
   easy/hard to pre-allocate sampling budgets, saving cost for easy problems
   [2]. Socratic Self-Refine (SSR) decomposes responses into steps, re-evaluates
   intermediate results through self-consistency, and refines specific
   step-level errors, achieving ~67.57% relative improvement in initial accuracy
   [3].

   **Practical implication for research verification:** Ask the same research
   question 3+ different ways. If answers converge, confidence increases. If
   they diverge, the finding needs deeper investigation. The cost of multi-path
   sampling can be reduced by triaging question difficulty first.

2. **Cross-Model Verification (multi-agent panels) significantly improves
   factual reliability** [CONFIDENCE: HIGH]

   The DelphiAgent framework demonstrates that multiple LLM-based agents with
   distinct "personalities" can make factuality judgments individually, then
   reach consensus through multiple rounds of feedback and synthesis --
   emulating the Delphi method [7]. It outperforms existing LLM-based approaches
   and performs on par with state-of-the-art supervised baselines without
   requiring training. The AgentFact framework decomposes fact-checking into
   five specialized sub-tasks (Strategy Planning, Visual Retrieval, Text
   Evidence Retrieval, Plan-Guided Reasoning, Explanation Generation), each
   handled by a dedicated agent [8]. The FACT-AUDIT framework uses adaptive
   multi-agent evaluation for dynamic fact-checking of LLMs [9].

   **Practical implication:** Cross-model verification is not just "run it
   through GPT-4 too." The most effective approach uses agents with different
   roles (researcher, critic, fact-checker, synthesizer) operating in structured
   rounds with explicit consensus mechanisms.

3. **Retrieval-Augmented Verification (RAV) grounds claims in retrieved
   documents to combat hallucination** [CONFIDENCE: HIGH]

   MiniCheck (EMNLP 2024) builds small fact-checking models that achieve
   GPT-4-level performance at 400x lower cost by training on synthetic data
   generated through a structured procedure that creates realistic factual
   errors [4]. EvidenceRL (March 2026) uses reinforcement learning to enforce
   evidence adherence during training, scoring candidate responses for grounding
   (entailment with retrieved evidence) and correctness (agreement with
   reference answers), and optimizing via Group Relative Policy Optimization
   [5]. The Retrieval-And-Structuring (RAS) paradigm extends RAG by
   incorporating knowledge structuring techniques that transform unstructured
   text into organized representations (taxonomies, hierarchies, knowledge
   graphs) to provide a framework for verifying LLM outputs [6].

   **Practical implication:** Every research claim should be traced back to a
   retrieved source document. The MiniCheck approach of decomposing claims into
   atomic facts and checking each against source documents is directly
   applicable to research output verification.

4. **Adversarial/Contrarian Verification uses red-teaming techniques to
   stress-test findings** [CONFIDENCE: MEDIUM]

   Automated red-teaming for LLMs has matured significantly in 2025-2026.
   LLM-as-Attackers methods leverage the generative power of LLMs to discover
   nuanced failure modes [10]. Tools like DeepTeam (Nov 2025) apply jailbreaking
   and prompt injection techniques to probe LLM systems before deployment, while
   Garak from Nvidia focuses on vulnerability scanning [10]. For research
   verification specifically, the DREAM framework generates "neutralized search
   queries" to avoid confirmation bias when verifying factuality claims -- a
   form of adversarial verification applied to research output [11].

   **Practical implication:** After completing research, explicitly attempt to
   disprove each HIGH-confidence finding. Use adversarial query reformulation
   (e.g., "evidence against X", "problems with X", "X debunked") to search for
   counter-evidence.

5. **Confidence Calibration in LLMs is poorly solved but critical for honest
   reporting** [CONFIDENCE: MEDIUM]

   LLMs are generally miscalibrated in their confidence -- they often exhibit
   high overconfidence when verbalizing uncertainty [12]. Practical approaches
   include: (a) External judge models that evaluate response quality, (b)
   Black-box consistency-based methods that generate multiple response
   variations, (c) Token-level entropy analysis that quantifies uncertainty from
   probability distributions, (d) Explanation-based methods that compute
   confidence from the distribution of LLM-generated explanations [12]. The
   "Cycles of Thought" approach measures LLM confidence through stable
   explanations, checking whether explanations remain consistent across multiple
   generation attempts [13].

   **Practical implication:** Do not trust LLM self-reported confidence.
   Instead, use behavioral signals: consistency across reformulations,
   consistency across models, and grounding in retrieved evidence. These three
   signals together form a more reliable confidence estimate than any single
   measure.

### SECTION B: Software Engineering Verification at Scale

6. **Pre-Execution Verification: Dissect-and-Restore decomposes complex code for
   tractable verification** [CONFIDENCE: MEDIUM-HIGH]

   The Prometheus system (2025) introduces "Dissect-and-Restore" -- a novel
   approach that decomposes complex program logic into smaller, verifiable
   components, verifies each component independently, then recomposes them to
   construct a proof for the original program [14]. This approach improved
   success rates from 68% to 86% on standard benchmarks and from 30% to 69% on
   complex specifications. The core insight: transient refactoring makes
   verification tractable by reducing the reasoning complexity at each step.

   **Practical implication for research:** Complex research questions should be
   decomposed into verifiable sub-claims. Verify each sub-claim independently,
   then verify the composition. This is structurally identical to how systematic
   reviews decompose meta-questions.

7. **Batched, Staged Rollout with Tight Feedback Loops is the gold standard for
   safe large-scale changes** [CONFIDENCE: HIGH]

   Atlassian's approach to AI-assisted large-scale refactoring emphasizes:
   working in small package-level batches, running tests and CI early and often,
   validating diffs before scaling out, and keeping human judgment in the loop
   for decisions scripts cannot make [15]. Organizations with systematic testing
   protocols for refactored code experience 70% fewer post-deployment issues
   [16]. Sonar's quality gate model enforces: zero new issues, 100% security
   hotspot review, 80% code coverage, and 3% or less duplication for new code
   [17].

   **Practical implication for research:** Research outputs at scale should
   follow the same staged approach: verify a small batch first, refine the
   verification process, then scale. Quality gates at each stage prevent bad
   findings from propagating.

8. **Regression Detection follows a tiered approach: unit, selective,
   progressive** [CONFIDENCE: HIGH]

   Regression testing patterns include: Unit Regression (validating individual
   functions with mocked dependencies), Selective Regression (focusing on
   high-risk areas and modified code paths), and Progressive Regression (focused
   validation of new feature impact, more efficient for incremental changes)
   [18]. Change impact analysis predicts the impact of a change on various
   components, supplementing test case selection and prioritization [18]. CI/CD
   integration ensures every change is verified automatically.

   **Practical implication:** Research verification should have regression
   checks: when new findings modify previous conclusions, systematically verify
   that prior findings still hold. Selective regression (checking only
   high-risk/high-impact findings) is more cost-effective than full
   re-verification.

### SECTION C: Research Methodology Verification

9. **The CRAAP Test provides a structured source evaluation framework with five
   dimensions** [CONFIDENCE: HIGH]

   Developed by Sarah Blakeslee at CSU Chico (2004), the CRAAP test evaluates
   sources across Currency (timeliness), Relevance (fit for research topic),
   Authority (credibility of author/organization), Accuracy (truthfulness via
   cross-referencing), and Purpose (inform vs. persuade) [19]. Each dimension
   scored 1-5 for a composite reliability assessment. While proven in academic
   contexts, critics note it focuses on "deep-dives" into individual sources,
   whereas modern misinformation requires "lateral reading" -- checking what
   other sources say about the source [20].

   **Practical implication:** CRAAP is necessary but insufficient alone. Combine
   with SIFT for a more robust evaluation. Apply CRAAP scoring to every source,
   but also do lateral verification via SIFT.

10. **The SIFT Method adds lateral reading for faster, more robust source
    verification** [CONFIDENCE: HIGH]

    Developed by Mike Caulfield, SIFT (Stop, Investigate the source, Find better
    coverage, Trace claims to original context) emphasizes lateral reading --
    moving away from the source to explore what other resources say about it
    [20]. Unlike CRAAP's vertical deep-dive, SIFT checks the ecosystem around a
    claim. Professional fact-checkers use lateral reading as their primary
    strategy, and studies show it is faster and more effective than deep-reading
    a single source [20].

    **Practical implication:** For every key finding, apply SIFT: Stop before
    trusting it, Investigate who published it, Find whether better/more
    authoritative coverage exists, Trace the claim back to its original source.

11. **Triangulation -- using multiple methods, sources, and perspectives -- is
    the gold standard for research validation** [CONFIDENCE: HIGH]

    Triangulation enhances credibility through: methodological triangulation
    (different data collection methods), data triangulation (different data
    sources), investigator triangulation (multiple researchers/agents), and
    theoretical triangulation (multiple interpretive frameworks) [21]. The key
    insight: if findings converge across different methods and sources,
    confidence is substantially higher. If they diverge, the divergence itself
    is a finding worth investigating [21]. Convergent triangulation (used in
    mixed methods) compares findings from concurrent approaches -- alignment
    enhances credibility, divergence prompts deeper investigation [21].

    **Practical implication:** Research findings should be verified using at
    least 2 of the 4 triangulation types. For AI research systems, investigator
    triangulation maps directly to cross-model verification (different LLMs as
    different "investigators").

12. **Cochrane-Style Systematic Review methodology provides the most rigorous
    verification framework** [CONFIDENCE: HIGH]

    Cochrane systematic reviews use: pre-registered protocols (preventing
    outcome switching), standardized search strategies (reproducible evidence
    gathering), quality assessment via Risk-of-Bias tools (RoB 2 for RCTs,
    ROBINS-I for non-randomized), a 20-section pre-submission checklist, GRADE
    system for grading evidence quality, and explicit documentation of excluded
    studies and reasons [22]. The methodology is designed for healthcare
    interventions but the structural patterns (pre-registration, standardized
    search, quality assessment, structured checklists, evidence grading) are
    domain-transferable.

    **Practical implication:** The Cochrane model maps well to research output
    verification: define the question precisely before searching, use
    reproducible search strategies, assess each source's risk of bias, grade the
    overall evidence quality, and document what was excluded.

### SECTION D: Graduated Verification Models

13. **The Evaluator-Optimizer Pattern provides iterative refinement with
    convergence detection** [CONFIDENCE: HIGH]

    The Evaluator-Optimizer pattern employs two distinct LLMs: a Generator
    (creates outputs) and an Evaluator (assesses quality and provides feedback)
    [23]. The iterative process continues until the Evaluator deems output
    satisfactory (convergence) or a MAX_ATTEMPTS circuit-breaker fires [23]. Key
    design principles: clearly define evaluation criteria rather than perfecting
    prompts, separate "generate" and "critique" roles, and detect when further
    improvement is minimal [23]. AWS documents this as the "Evaluator
    Reflect-Refine Loop" pattern [24]. Anthropic provides an official cookbook
    implementation [25].

    **Practical implication:** This is the most directly applicable pattern for
    research convergence loops. The separation of generation and evaluation
    mirrors the separation of research and verification. The circuit-breaker
    (max iterations) prevents infinite loops.

14. **The Ralph Loop Pattern achieves convergence through external,
    machine-verifiable completion criteria** [CONFIDENCE: HIGH]

    The Ralph Loop (by Geoffrey Huntley, 2025-2026) inverts quality control:
    instead of treating failures as terminal states requiring human
    intervention, it treats failure as diagnostic data [26]. The agent iterates
    until external verification (not self-assessment) confirms success. Key
    mechanism: a Stop hook intercepts exit attempts, evaluates state against
    success criteria, and re-injects the prompt if criteria are not met [26].
    The core insight: define the "finish line" through machine-verifiable tests,
    then let the agent iterate autonomously [26].

    **Practical implication:** For research verification, define
    machine-verifiable success criteria upfront (e.g., "every claim has a
    citation", "no contradictions between findings", "all sub-questions
    addressed"). The system iterates until these criteria are met, not until it
    "feels done."

15. **Iterative Retrieval-Verification Loops provide a general framework for
    progressive evidence refinement** [CONFIDENCE: HIGH]

    These loops involve: query reformulation (improving search queries based on
    gaps), context pruning (removing noisy/irrelevant retrieved content),
    explicit verification (scoring retrieved evidence against claims), and
    convergence detection (stopping when confidence thresholds are met, budget
    is exhausted, or no unresolved gaps remain) [27]. Unlike single-step RAG,
    iterative frameworks diagnose deficiencies and take corrective action.
    Applied in fact-checking, open-domain QA, formal mathematics, and legal
    analysis [27].

    **Practical implication:** Research should not be single-pass. The iterative
    loop pattern (search -> retrieve -> verify -> reformulate -> search again)
    continues until findings stabilize or budget is exhausted.

16. **DREAM Framework provides a multi-dimensional, agentic evaluation pipeline
    for deep research outputs** [CONFIDENCE: MEDIUM-HIGH]

    DREAM (Deep Research Evaluation with Agentic Metrics, Feb 2026) addresses
    the "Mirage of Synthesis" -- where strong surface-level fluency masks
    underlying factual defects [11]. It routes evaluation to three evaluator
    types: LLM Evaluator (judgment without tool use), Agent Evaluator
    (autonomously following validation plans with external evidence retrieval),
    and Workflow Evaluator (multi-stage pipeline for Factuality, Citation
    Integrity, and Domain Authoritativeness) [11]. For Factuality, it generates
    neutralized search queries to avoid confirmation bias. Citation Integrity is
    the harmonic mean of Claim Attribution and Citation Faithfulness.

    **Practical implication:** Research output verification should measure
    multiple dimensions: not just "is this factually correct?" but also "are
    citations present?", "do citations actually support the claims?", "is the
    source authoritative for this domain?", and "is the writing quality
    sufficient?"

17. **Risk-Based Graduated Verification: scale effort proportionally to risk and
    impact** [CONFIDENCE: MEDIUM-HIGH]

    Risk-based audit planning from IIA and FFIEC frameworks groups entities into
    risk tiers (High/Medium/Low) to determine audit frequency and depth [28].
    The principle of proportionality applies: broader and more severe problems
    require more evidence to verify, and the scale of verification must match
    the scale of actions taken [29]. Quality gates in software follow this
    pattern: SonarQube enforces stricter criteria on new code ("Clean as You
    Code") while applying less strict thresholds to overall codebase [17]. Teams
    should define risk-based and adaptive criteria that allow low-risk changes
    to proceed while enforcing stricter checks on high-impact modifications
    [30].

    **Practical implication:** Not all research findings need the same
    verification depth. A graduated model:
    - **Spot Check (LOW risk):** Single-source confirmation, CRAAP score >= 3
      average. Used for background context, well-established facts, low-stakes
      claims.
    - **Standard Verification (MEDIUM risk):** 2+ independent sources,
      CRAAP+SIFT evaluation, cross-reference check. Used for supporting
      evidence, moderately important claims.
    - **Full Audit (HIGH risk):** 3+ independent sources, adversarial
      disconfirmation attempt, cross-model verification, source trace to origin,
      formal confidence assessment. Used for primary conclusions, novel claims,
      actionable recommendations.
    - **Critical Verification (CRITICAL risk):** Full audit plus expert/human
      review, pre-registration of verification criteria, systematic bias check.
      Used for safety-critical decisions, irreversible actions.

### SECTION E: Integrated Verification Model Recommendation

18. **A Practical Graduated Verification Model for Research Outputs**
    [CONFIDENCE: MEDIUM]

    Synthesizing across all patterns found, the following graduated model
    emerges:

    **Tier 0 -- Automatic (every finding):**
    - Citation presence check (machine-verifiable: does every claim have a
      source?) [Ralph Loop pattern]
    - Source recency check (is the source within the domain's recency
      threshold?) [CRAAP Currency]
    - Self-consistency check (does the finding remain stable across 2+
      reformulations?) [SC pattern]

    **Tier 1 -- Standard (default for most findings):**
    - Tier 0 + CRAAP scoring (1-5 on each dimension, average >= 3 to pass)
    - SIFT lateral reading (check what others say about the source)
    - Cross-reference (2+ independent sources agree) [Triangulation]
    - Contradiction detection (surface disagreements, do not resolve silently)

    **Tier 2 -- Enhanced (HIGH-confidence claims, novel claims, actionable
    items):**
    - Tier 1 + Adversarial disconfirmation (actively search for
      counter-evidence) [Red-teaming]
    - Cross-model verification (verify with a different LLM or agent) [Delphi
      method]
    - Source trace to origin (trace claims upstream per SIFT step 4) [Cochrane
      methodology]
    - Confidence calibration (behavioral signals: consistency, grounding,
      convergence)

    **Tier 3 -- Critical Audit (safety-critical, irreversible, high-stakes):**
    - Tier 2 + Human expert review [Cochrane peer review]
    - Pre-registered verification criteria [Cochrane protocol]
    - DREAM-style multi-dimensional assessment (factuality + citation
      integrity + domain authoritativeness + writing quality)
    - Formal documentation of what was checked, what passed, what failed

    **Integration with Convergence Loops:**
    - Each tier maps to a convergence loop: Tier 0 is a single-pass automated
      check. Tier 1 is a single iteration with human-in-the-loop review. Tier 2
      is an iterative loop (Evaluator-Optimizer pattern) that continues until
      findings stabilize. Tier 3 is a multi-round Delphi-style consensus
      process.
    - The convergence criteria for each tier: Tier 0 passes when all
      machine-verifiable checks are green. Tier 1 passes when CRAAP >= 3 and 2+
      sources agree. Tier 2 passes when adversarial search finds no
      contradicting evidence AND cross-model verification agrees. Tier 3 passes
      when all evaluators/reviewers reach consensus.
    - Circuit breakers: Tier 0 has no iteration (pass/fail). Tier 1 allows 1
      refinement cycle. Tier 2 allows 3 refinement cycles before escalating to
      human review. Tier 3 allows 5 rounds before declaring "insufficient
      evidence."

## Sources

| #   | URL                                                                                                                                 | Title                                                      | Type                   | Trust       | CRAAP | Date    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------- | ----------- | ----- | ------- |
| 1   | https://aclanthology.org/2025.findings-acl.1030/                                                                                    | Confidence Improves Self-Consistency in LLMs               | academic-paper         | HIGH        | 4.4   | 2025    |
| 2   | https://aclanthology.org/2025.findings-naacl.383.pdf                                                                                | Difficulty-Adaptive Self-Consistency                       | academic-paper         | HIGH        | 4.2   | 2025    |
| 3   | https://arxiv.org/html/2511.10621v1                                                                                                 | SSR: Socratic Self-Refine for LLM Reasoning                | preprint               | MEDIUM-HIGH | 3.8   | 2025    |
| 4   | https://arxiv.org/abs/2404.10774                                                                                                    | MiniCheck: Efficient Fact-Checking of LLMs                 | academic-paper (EMNLP) | HIGH        | 4.6   | 2024    |
| 5   | https://arxiv.org/html/2603.19532                                                                                                   | EvidenceRL: Reinforcing Evidence Consistency               | preprint               | MEDIUM-HIGH | 4.0   | 2026-03 |
| 6   | https://arxiv.org/pdf/2509.10697                                                                                                    | A Survey on Retrieval And Structuring Augmented Generation | survey-paper           | MEDIUM-HIGH | 4.0   | 2025    |
| 7   | https://www.sciencedirect.com/science/article/abs/pii/S0306457325001827                                                             | DelphiAgent: Multi-agent Verification Framework            | academic-paper         | HIGH        | 4.4   | 2025    |
| 8   | https://arxiv.org/html/2512.22933v2                                                                                                 | AgentFact: Multimodal Fact-Checking Agent-based Approach   | preprint               | MEDIUM-HIGH | 4.0   | 2025    |
| 9   | https://arxiv.org/abs/2502.17924                                                                                                    | FACT-AUDIT: Adaptive Multi-Agent Framework                 | preprint               | MEDIUM-HIGH | 3.8   | 2025    |
| 10  | https://aclanthology.org/2025.trustnlp-main.23.pdf                                                                                  | End-to-End Overview of Red Teaming for LLMs                | academic-paper         | HIGH        | 4.2   | 2025    |
| 11  | https://arxiv.org/html/2602.18940                                                                                                   | DREAM: Deep Research Evaluation with Agentic Metrics       | preprint               | MEDIUM-HIGH | 4.2   | 2026-02 |
| 12  | https://arxiv.org/abs/2503.15850                                                                                                    | UQ and Confidence Calibration in LLMs: A Survey            | survey-paper           | MEDIUM-HIGH | 4.0   | 2025    |
| 13  | https://arxiv.org/html/2406.03441v1                                                                                                 | Cycles of Thought: Measuring LLM Confidence                | preprint               | MEDIUM      | 3.6   | 2024    |
| 14  | https://arxiv.org/html/2510.25406v1                                                                                                 | Dissect-and-Restore: AI-based Code Verification            | preprint               | MEDIUM-HIGH | 4.0   | 2025    |
| 15  | https://www.atlassian.com/blog/developer/how-to-effectively-utilise-ai-to-enhance-large-scale-refactoring                           | Atlassian: AI for Large-Scale Refactoring                  | industry-blog          | MEDIUM      | 3.8   | 2025    |
| 16  | https://getdx.com/blog/enterprise-ai-refactoring-best-practices/                                                                    | Enterprise AI Refactoring Best Practices                   | industry-blog          | MEDIUM      | 3.6   | 2025    |
| 17  | https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates | SonarQube Quality Gates Documentation                      | official-docs          | HIGH        | 4.8   | 2025    |
| 18  | https://www.datacamp.com/tutorial/regression-testing                                                                                | Regression Testing: Complete Guide                         | tutorial               | MEDIUM      | 3.4   | 2025    |
| 19  | https://en.wikipedia.org/wiki/CRAAP_test                                                                                            | CRAAP Test - Wikipedia                                     | reference              | MEDIUM      | 3.6   | ongoing |
| 20  | https://guides.lib.uchicago.edu/c.php?g=1241077&p=9082322                                                                           | SIFT Method - UChicago Library                             | academic-resource      | HIGH        | 4.0   | ongoing |
| 21  | https://www.scribbr.com/methodology/triangulation/                                                                                  | Triangulation in Research                                  | academic-resource      | MEDIUM-HIGH | 4.0   | ongoing |
| 22  | https://www.cochrane.org/authors/handbooks-and-manuals/handbook                                                                     | Cochrane Handbook for Systematic Reviews                   | official-docs          | HIGH        | 4.8   | ongoing |
| 23  | https://dev.to/clayroach/building-self-correcting-llm-systems-the-evaluator-optimizer-pattern-169p                                  | Evaluator-Optimizer Pattern                                | community-blog         | MEDIUM      | 3.4   | 2025    |
| 24  | https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/evaluator-reflect-refine-loop-patterns.html            | AWS Evaluator Reflect-Refine Loop                          | official-docs          | HIGH        | 4.4   | 2025    |
| 25  | https://github.com/anthropics/anthropic-cookbook/blob/main/patterns/agents/evaluator_optimizer.ipynb                                | Anthropic Evaluator-Optimizer Cookbook                     | official-docs          | HIGH        | 4.4   | 2025    |
| 26  | https://asdlc.io/patterns/ralph-loop/                                                                                               | Ralph Loop Pattern                                         | pattern-reference      | MEDIUM-HIGH | 3.8   | 2025    |
| 27  | https://www.emergentmind.com/topics/iterative-retrieval-verification-loops                                                          | Iterative Retrieval-Verification Loops                     | survey-aggregator      | MEDIUM      | 3.6   | 2025    |
| 28  | https://www.theiia.org/en/content/guidance/recommended/supplemental/practice-guides/developing-a-risk-based-internal-audit-plan/    | IIA Risk-Based Internal Audit Plan                         | official-guidance      | HIGH        | 4.2   | ongoing |
| 29  | https://www.pmi.org/learning/library/qualitative-risk-assessment-cheaper-faster-3188                                                | PMI Qualitative Risk Assessment                            | official-guidance      | HIGH        | 4.0   | ongoing |
| 30  | https://testrigor.com/blog/software-quality-gates/                                                                                  | Software Quality Gates                                     | industry-blog          | MEDIUM      | 3.4   | 2025    |

## Contradictions

1. **Self-assessment reliability:** Some research (CISC [1]) suggests LLMs _can_
   effectively judge their own outputs, while the verification literature [12]
   and the DREAM paper [11] explicitly warn against trusting self-assessment.
   Resolution: LLMs can judge _factual correctness_ of discrete answers
   reasonably well (math, factual QA), but are unreliable at judging the
   _completeness and nuance_ of complex research outputs. Both are likely
   correct in their respective scopes.

2. **Automation vs. human-in-the-loop:** The Ralph Loop pattern [26] advocates
   full autonomous iteration until machine-verifiable completion, while
   Atlassian [15] and ICSE 2025 findings [16] emphasize that LLM error-proneness
   requires humans in the loop. Resolution: These are not contradictory but
   apply at different verification tiers. Machine-verifiable checks (citation
   presence, format compliance) can be fully automated. Judgment-intensive
   checks (claim quality, relevance, nuance) require human oversight.

3. **CRAAP vs. SIFT:** The CRAAP test [19] uses vertical deep-reading of
   individual sources, while SIFT [20] uses lateral reading across multiple
   sources. Some information literacy researchers argue CRAAP is insufficient
   for modern misinformation. Resolution: They are complementary, not competing.
   Use CRAAP for scoring individual source quality, use SIFT for verifying
   claims across the information ecosystem.

## Gaps

1. **No standard "research output verification" framework exists.** While
   individual patterns are well-documented (self-consistency, triangulation,
   CRAAP, etc.), there is no widely-adopted, integrated framework specifically
   for verifying AI-generated research outputs. DREAM [11] is the closest but is
   evaluation-focused (benchmarking), not operational (guiding a verification
   workflow).

2. **Cost data for verification at scale is sparse.** While MiniCheck [4]
   reports 400x cost reduction for fact-checking, and DSC [2] reports 40%
   reduction in sampling paths, there are no comprehensive studies on the total
   cost of applying graduated verification models at different tiers. The "how
   much does Tier 2 cost vs. Tier 1?" question remains unanswered empirically.

3. **Convergence criteria for research (vs. code) are underspecified.** The
   Evaluator-Optimizer pattern [23] and Ralph Loop [26] define convergence
   clearly for code (tests pass, checks green). For research outputs,
   "convergence" is harder to define -- when is a research finding "done"? The
   iterative retrieval-verification loop literature [27] offers stopping
   conditions (confidence thresholds, budget exhaustion, no unresolved gaps) but
   these are abstract, not operationalized for a specific research workflow.

4. **Cross-model verification cost and practical tooling.** While DelphiAgent
   [7] and cross-model verification are well-studied academically, practical
   tooling for "run this finding through three different LLMs and compare" is
   limited. No off-the-shelf framework was found for this specific workflow in
   research contexts.

5. **Verification of "negative findings" (what was NOT found).** The literature
   focuses heavily on verifying positive claims. Verifying that something does
   NOT exist or is NOT possible (negative claims) is acknowledged as harder but
   not well-addressed by any of the frameworks found.

## Serendipity

1. **The "Mirage of Synthesis" concept from DREAM [11]** is highly relevant
   beyond formal research evaluation. It describes how strong surface-level
   fluency and citation alignment can mask underlying factual and reasoning
   defects -- directly applicable to any AI research output review. This concept
   should be explicitly called out as a risk in any research discovery standard.

2. **EvidenceRL's training-time approach [5]** suggests a future where
   verification is baked into the model itself rather than applied post-hoc.
   This represents a paradigm shift from "verify after generation" to "train for
   verifiable generation." While not immediately actionable, it signals where
   the field is heading.

3. **Atlassian's use of Rovo Dev with the Ralph Loop pattern for large-scale
   test refactoring** [15] demonstrates that the same verification patterns
   (batch, iterate, verify, scale) apply whether you're refactoring 1000 files
   or verifying 1000 research claims. The structural isomorphism between code
   verification and research verification is a strong finding.

4. **The DREAM framework's "neutralized search queries" [11]** -- rewriting
   verification queries to avoid confirmation bias -- is a specific,
   implementable technique that addresses a real risk in research verification.
   When checking if a finding is true, the natural tendency is to search for
   confirming evidence. Neutralizing the query (removing bias-inducing terms)
   forces more objective evidence gathering.

## Confidence Assessment

- HIGH claims: 10
- MEDIUM-HIGH claims: 3
- MEDIUM claims: 4
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The high overall confidence reflects that verification and quality gate patterns
are well-studied across multiple domains (academic research methodology,
software engineering, AI/ML). The primary uncertainty is in the _integration_
and _graduated scaling_ of these patterns specifically for AI research outputs,
which is a novel application area with limited direct precedent.
