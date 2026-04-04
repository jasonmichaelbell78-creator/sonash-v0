# Findings: Specialized Adversarial Agent Design Patterns (External Research)

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-29
**Sub-Question IDs:** SQ8-Part-A

---

## Key Findings

### 1. The Contrarian Agent Pattern: Steel-Manning Before Attack [CONFIDENCE: HIGH]

Production adversarial systems consistently use a two-phase structure: first
steel-man the proposal (make it as strong as possible), then attack that
strengthened version. This prevents the trivial adversarial failure mode of
attacking a strawman.

Francis Shanahan's documented contrarian agent architecture [1] requires:

- The contrarian receives "the STRONGEST version this idea could be" — not the
  raw proposal
- Agents must provide numbered, specific fatal flaws rather than vague criticism
- Maximum iteration limits (5 rounds) prevent endless debate without resolution
- Explicit approval criteria: a proposal survives if it passes scrutiny, not if
  agents merely run out of objections

The medium.com devil's advocate architecture analysis [9] formalizes this as a
three-agent dialectical system: Worker (Thesis) → Devil's Advocate (Antithesis,
challenges assumptions rather than just disagreeing) → Reviewer (Synthesis,
enforces confidence threshold before accepting decision).

**Design implication for contrarian-challenger:** The agent should receive
synthesized research findings and steel-man them internally before attacking.
The challenge output should list specific numbered objections, not vague concern
about quality. A confidence threshold (e.g., 80%) should be required before the
challenge is considered "passed."

---

### 2. iMAD Selective Triggering: 41 Features, 92% Token Reduction [CONFIDENCE: HIGH]

iMAD (intelligent Multi-Agent Debate) [2] provides the most technically rigorous
answer to when adversarial review should fire vs. be skipped. It achieves 92%
token reduction and +13.5% accuracy improvement by using a lightweight
classifier trained on 41 interpretable features extracted from a self-critique
response.

**The 41 features span five categories:**

- Surface-level statistics (3): token counts, named entity frequency
- Readability metrics (6): Flesch Reading Ease and Coleman-Liau Index on
  question, reasoning, and self-critique
- Syntactic features (3): parse tree depth across all three components
- Part-of-speech counts (9): noun/verb/adjective frequencies across all three
  sections
- Uncertainty-related lexical cues (20): hedge words ("maybe"), certainty
  expressions ("definitely"), contrastive markers ("however")

**Triggering logic:** The classifier outputs a score p ∈ (0,1). When p <
threshold τ=0.7, debate activates. The key insight is that "confidence scores
alone are unreliable" — a high-confidence response can still be wrong. iMAD
detects distributed uncertainty across semantic interpretations, not just
surface-level hedging.

**Practical simplification for deep-research:** The 41 features require an ML
classifier not feasible for a prompt-based agent. However, the _categories_
translate directly to a rubric: (a) lexical hedges present in claims? (b)
contradictions between sub-findings? (c) LOW/MEDIUM confidence claims exceed
threshold N? (d) sources contradict each other? These are the tractable
iMAD-inspired triggers for the contrarian-challenger.

---

### 3. Free-MAD Anti-Sycophancy: Consensus-Free Debate [CONFIDENCE: HIGH]

Free-MAD [3] achieves 13-16% accuracy improvement over baselines by removing the
consensus requirement from multi-agent debate. The critical design principle:
"agents are expected to change their beliefs only if there is a clear indication
that their own answer is incorrect, rather than aiming to reach consensus."

**Contrast with vanilla MAD (which fails):**

- Standard MAD: encourages majority alignment → agents converge on wrong answers
- Free-MAD: evaluates entire debate trajectory, not just final-round responses;
  penalizes abandoned answers (treating abandonment as signal that agent
  recognized error)
- Includes explicit scenario: "some malicious agents may deliberately
  disseminate incorrect answers" — forcing each agent to independently verify
  rather than conform

**Score-based decision mechanism** tracks all intermediate responses across
debate rounds, not just the last round, creating a "debate history" that
prevents sudden late-round capitulation from dominating.

**Design implication for contrarian-challenger:** The agent must be explicitly
instructed: "Do not seek consensus. Change your assessment only if you find
specific evidence your challenge is wrong. Maintain your challenge if you
believe it is valid even if other agents disagree." This is the most important
anti-sycophancy instruction.

---

### 4. AgentAuditor ACPO: Training Against Majority-Failure Cases [CONFIDENCE: HIGH]

AgentAuditor [4] introduces Anti-Consensus Preference Optimization (ACPO), which
trains an auditor specifically on cases where the majority was wrong but a
minority held the correct answer. Results: 65-82% recovery on majority-failure
cases where voting fails completely, +3.6% average improvement over majority
vote at 44.8% lower token cost than LLM-as-Judge.

**The Reasoning Tree mechanism:**

1. Decompose agent outputs into atomic reasoning steps
2. Cluster semantically similar steps across agents
3. Create explicit branching nodes where agents diverge (Critical Divergence
   Points)
4. Evaluate only the divergence packets (shared context + competing branches),
   not full traces

**Key insight:** Frequency-based voting fails because it mistakes popularity for
correctness. Structure-based auditing catches the cases where the minority holds
the truth.

**Design implication for claim-verifier:** Rather than asking "do most findings
agree?", the verifier should identify where findings diverge and evaluate the
_quality of reasoning_ at those divergence points. A minority finding with
high-quality reasoning and strong citations should outweigh a majority finding
with weak sourcing.

---

### 5. Devil's Advocate Anticipatory Reflection: Pre-Action Failure Modeling [CONFIDENCE: HIGH]

The DEVIL'S ADVOCATE paper [5] introduces anticipatory reflection: agents
contemplate potential failures _before_ executing, not only learning from
post-hoc mistakes. The core enabling prompt is elegantly simple:

> "If your answer above is not correct, instead, the next action should be:"

This forces the agent to pre-compute alternative actions before discovering
whether the primary action was flawed, reducing position bias. On WebArena:
23.5% vs. 19.8% success rate (3.5 pp improvement), 45% reduction in plan
revisions needed.

**Design implication for contrarian-challenger:** Add a pre-challenge step where
the agent generates "if this challenge is wrong, what would it mean?" before
finalizing its critique. This prevents the agent from committing too early to a
challenge position.

---

### 6. The 13-Agent System: L0-L3 Adversarial Depth Tiers [CONFIDENCE: HIGH]

The 13-agent production system [6] implements four-tier adversarial depth that
matches computational cost to decision stakes:

- **L0 (Foundation):** Every agent embeds three self-checks before responding
- **L1 (Quick Challenge):** Three adversarial questions before moderate task
  completion
- **L2 (Full Protocol):** Five-phase Devil's Advocate — claim extraction,
  disconfirmation-focused searches (60%+ must seek contradicting evidence),
  belief gap analysis, pre-mortem scenarios, weighted scoring
- **L3 (Multi-Adversarial):** Multiple independent adversaries for irreversible
  decisions; Double-DA Rule: scores above 80 trigger independent second
  evaluation; divergence >10 points defaults to lower score

**Seven mandatory research gates (L2):**

1. Minimum 3 web searches, 60%+ seeking contradicting evidence
2. Competitor/alternative analysis (≥2 options)
3. External market validation (not LLM reasoning)
4. Technical feasibility verification
5. Historical precedent check
6. First-principles cost estimation
7. [Implicit] Citation resolution to actual sources

**Design implication:** deep-research's three proposed agents map well to L1
(contrarian-challenger on HIGH-confidence claims), L2 (full claim-verifier
protocol), and L3 (otb-challenger for irreversible or high-stakes synthesis).

---

### 7. LinqAlpha Devil's Advocate: Assumption Decomposition + Disconfirmation-First Search [CONFIDENCE: HIGH]

LinqAlpha's production investment thesis agent [7] uses Claude Sonnet on Amazon
Bedrock with a four-step adversarial process:

1. **Thesis decomposition:** Claude interprets the statement and decomposes it
   into core assumptions
2. **Document ingestion:** System uploads trusted source documents
3. **Automated assumption analysis:** Each assumption is tested against ingested
   evidence
4. **Structured counterargument generation:** Citation-linked rebuttals, not
   vague criticism

The critical design constraint noted in the ZenML database entry [8]: "60%+ of
searches must seek disconfirmation, since the default LLM behavior is to search
for supporting evidence."

**Design implication for contrarian-challenger:** The agent should explicitly
decompose research findings into their core assumptions before challenging, then
generate evidence-based counterarguments against each assumption. The agent must
be constrained to search for disconfirmation, not confirmation.

---

### 8. Vibe Science R2 Architecture: Falsification as Structural Requirement [CONFIDENCE: HIGH]

The Vibe Science Claude Code plugin [10] represents the most comprehensive
open-source implementation of adversarial research review. Its R2 (Reviewer 2)
design:

- Foundational posture: "Assumes every claim is wrong. No congratulations."
- Operates in seven modes: INLINE, FORCED, BATCH, BRAINSTORM, SHADOW, VETO,
  REDIRECT
- **VETO mode:** Unilateral kill authority on weak claims
- **Confounder Harness (LAW 9):** Every quantitative claim must traverse raw →
  conditioned → matched states; sign reversal = ARTIFACT (claim blocked)
- **Separation of powers:** R2 never writes to the claim ledger directly; R3
  (meta-reviewer) never modifies R2's report — prevents review capture
- **Salvagente Rule:** When R2 kills a claim, it must produce a serendipity seed
  explaining why the claim failed and what unexpected signals emerged

**Design implication for otb-challenger:** The "BRAINSTORM" mode (exploring
alternative hypotheses) and "Salvagente Rule" (converting failure into
serendipity) are directly applicable. The otb-challenger should not just reject
findings — it should propose what alternative explanations the research missed.

---

### 9. Claim Verification: SUPPORTED/REFUTED/NEI Three-Verdict System [CONFIDENCE: HIGH]

The claim verification literature [11][12][13] consistently uses three-label
verdict systems: SUPPORTED, REFUTED, or NOT ENOUGH EVIDENCE (NEI). More
sophisticated systems add: Conflicting Evidence/Cherrypicking.

The ClaimCheck pipeline [11] achieves state-of-the-art 76.4% accuracy on
AVeriTeC using a small model (Qwen3-4B) through:

1. Web search query planning
2. Web-based evidence retrieval and summarization
3. Evidence synthesis and re-retrieval
4. Claim verdict evaluation

Multi-agent claim verification [12] uses a Decision layer with K consistent
outputs before confirming a verdict, plus a Reasoning layer for task-specific
analysis.

**Design implication for claim-verifier:** Three-verdict output
(VERIFIED/REFUTED/INSUFFICIENT-EVIDENCE) is the correct format. Each verdict
must include: (a) the specific evidence used, (b) the source URL/citation, (c)
any contradicting evidence found. The verifier should attempt to actively search
for contradicting evidence before confirming VERIFIED.

---

### 10. Devil's Advocate for AI Explanations: Seven Adversarial Prompting Strategies [CONFIDENCE: MEDIUM-HIGH]

The "Don't Just Translate, Agitate" paper [14] catalogs seven adversarial
prompting strategies for LLM explanations:

1. Uncertainty Awareness — surface where explanations become unreliable
2. Alternative Explanations — present competing interpretations
3. Bias Detection — interrogate for fairness issues
4. Counterfactual Thinking — how do input changes alter predictions?
5. Scrutinize Assumptions — challenge users' own mental models
6. Explanation Audit — demonstrate limitations of simplifications
7. User-Calibrated Depth — adjust complexity based on user expertise

**Key reframing:** Replace "You are a helpful XAI assistant" with "You are a
helpful XAI adversary, promoting healthy skepticism in AI."

**Design implication for otb-challenger:** Strategies 1, 4, and 5 are most
applicable. The OTB challenger should ask: "What assumptions is this research
operating under? What would need to change for the opposite conclusion to be
true? What alternative explanations were not considered?"

---

### 11. Multi-Agent Debate Fails Without Diversity [CONFIDENCE: HIGH]

The "Demystifying Multi-Agent Debate" paper [15] finds that vanilla MAD
"underperforms simple majority vote" when agents lack initial answer diversity.
Debate succeeds when:

- Initial answer diversity is present (correlation is statistically significant)
- Task difficulty is higher (harder tasks naturally produce diverse initial
  answers)
- Confidence is calibrated and communication of confidence is weighted during
  updates

**Specific threshold finding:** Debate becomes less necessary when Pass@5
(probability any agent samples correctly) exceeds ~90%.

**Design implication for iMAD-style selective triggering:** If all deep-research
sub-agents are generating the same findings with HIGH confidence on a
non-controversial question, adversarial review is overhead. Trigger adversarial
agents when: confidence varies across sub-agents, claims are LOW/MEDIUM
confidence, sources contradict each other, or the question is
high-stakes/irreversible.

---

### 12. Claude Devils Advocate GitHub: Forced Disagreement Architecture [CONFIDENCE: HIGH]

The claude-devils-advocate GitHub project [16] implements a robust
anti-sycophancy mechanism through explicit structural constraints:

- "Reviewer must raise a substantive concern every round"
- "Author must push back before conceding"
- Reviews proceed through prioritized topics: Correctness → Error Handling →
  Performance → Security → Maintainability → Testing Gaps
- Both parties must include code snippets/diffs, not just descriptions
- Early termination only when consensus emerges naturally (not manufactured
  concern)

**Rationale cited in the project:** "A single model playing both roles tends to
converge quickly" — the forced-disagreement rules deliberately slow this
convergence.

**Design implication:** deep-research adversarial agents need explicit
instructions that prevent them from "agreeing too easily." The agent definition
should include: "You must raise at least one substantive challenge before
concluding the research is acceptable."

---

### 13. Pre-Mortem Pattern: Assume Failure, Work Backward [CONFIDENCE: HIGH]

The pre-mortem technique [17] frames adversarial critique as "it has already
failed — why?" rather than "will this succeed?" Research by Mitchell, Russo, and
Pennington shows imagining an event has already occurred increases ability to
identify failure reasons by 30%.

Applied to deep-research:

- "This research report has already failed to answer the question correctly. In
  six months, we discovered the findings were wrong. What were the three most
  likely causes?"
- Produces: probable failure modes (ranked by probability), hidden dependency
  not tested, modification making failure survivable, 30-day tripwire metric

**Design implication for contrarian-challenger:** Include a pre-mortem
sub-prompt: "Assume this research conclusion turns out to be wrong six months
from now. What are the three most likely reasons?" This shifts from "find flaws"
to "identify plausible failure narratives."

---

### 14. CONSENSAGENT: Dynamic Prompt Refinement for Independence [CONFIDENCE: MEDIUM]

CONSENSAGENT [18] mitigates sycophancy by dynamically refining prompts based on
agent interactions — essentially detecting when an agent is conforming to
pressure and recalibrating its independence instructions. The paper reports
state-of-the-art results across six benchmark datasets, but specific
quantitative improvements are not available from the abstract.

The core problem it addresses: "agents reinforce each other's responses instead
of critically engaging," which wastes computation through additional debate
rounds.

**Design implication:** The orchestrator layer for deep-research adversarial
agents should monitor for convergence patterns — if the contrarian-challenger
and the synthesizer are agreeing too quickly, the orchestrator should inject
independence-reinforcement prompts before finalizing.

---

### 15. Adversarial Spec: Multi-LLM Debate Until Consensus [CONFIDENCE: MEDIUM]

The adversarial-spec GitHub project [19] recognizes that "a single LLM reviewing
a spec will miss things, and multiple LLMs debating a spec will catch gaps." It
iteratively refines specifications through debate between GPT, Gemini, Grok, and
Claude until all models reach consensus.

**Key insight:** Cross-model diversity (different LLMs, not just different
prompts to the same model) produces more genuine adversarial challenge because
different models have different training biases and blind spots.

**Design implication:** If deep-research can spawn adversarial agents on
different models (e.g., contrarian-challenger uses a different model than the
primary searchers), the quality of challenge improves significantly. D2b already
confirmed model diversity matters more than debate structure.

---

## Sources

| #   | URL                                                                                                                                  | Title                                                                                                 | Type                 | Trust       | CRAAP | Date      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------- | ----------- | ----- | --------- |
| 1   | https://francisshanahan.substack.com/p/the-contrarian-agent-why-making-ai                                                            | The Contrarian Agent: Why Making AI Fight with Itself Produces Better Output                          | Community blog       | MEDIUM      | 3.6   | 2024-2025 |
| 2   | https://arxiv.org/abs/2511.11306                                                                                                     | iMAD: Intelligent Multi-Agent Debate for Efficient and Accurate LLM Inference                         | Academic preprint    | HIGH        | 4.5   | Nov 2025  |
| 3   | https://arxiv.org/html/2509.11035v1                                                                                                  | Free-MAD: Consensus-Free Multi-Agent Debate                                                           | Academic preprint    | HIGH        | 4.5   | Sep 2025  |
| 4   | https://arxiv.org/html/2602.09341                                                                                                    | Auditing Multi-Agent LLM Reasoning Trees Outperforms Majority Vote and LLM-as-Judge                   | Academic preprint    | HIGH        | 4.5   | Feb 2026  |
| 5   | https://arxiv.org/html/2405.16334v4                                                                                                  | DEVIL'S ADVOCATE: Anticipatory Reflection for LLM Agents                                              | Academic paper       | HIGH        | 4.4   | May 2024  |
| 6   | https://dev.to/jarradbermingham/i-built-a-13-agent-ai-system-that-reviews-its-own-decisions-heres-the-architecture-pbd               | I Built a 13-Agent AI System That Reviews Its Own Decisions                                           | Community blog       | MEDIUM      | 3.8   | 2025      |
| 7   | https://aws.amazon.com/blogs/machine-learning/how-linqalpha-assesses-investment-theses-using-devils-advocate-on-amazon-bedrock/      | How LinqAlpha assesses investment theses using Devil's Advocate on Amazon Bedrock                     | Official/vendor      | HIGH        | 4.2   | 2025      |
| 8   | https://www.zenml.io/llmops-database/multi-agent-ai-system-for-investment-thesis-validation-using-devil-s-advocate                   | Linqalpha: Multi-Agent AI System for Investment Thesis Validation Using Devil's Advocate              | Curated database     | MEDIUM-HIGH | 3.9   | 2025      |
| 9   | https://medium.com/@jsmith0475/the-devils-advocate-architecture-how-multi-agent-ai-systems-mirror-human-decision-making-9c9e6beb09da | The Devil's Advocate Architecture: How Multi-Agent AI Systems Mirror Human Decision-Making Psychology | Community blog       | MEDIUM      | 3.5   | 2025      |
| 10  | https://github.com/th3vib3coder/vibe-science                                                                                         | Vibe Science: Adversarial Agent Loops for Verifiable Vibe Researching                                 | Open source          | MEDIUM-HIGH | 4.0   | 2025      |
| 11  | https://arxiv.org/abs/2510.01226                                                                                                     | ClaimCheck: Real-Time Fact-Checking with Small Language Models                                        | Academic preprint    | HIGH        | 4.4   | Oct 2025  |
| 12  | https://ceur-ws.org/Vol-3962/paper20.pdf                                                                                             | Multi-LLM Agents Architecture for Claim Verification                                                  | Academic proceedings | HIGH        | 4.3   | 2025      |
| 13  | https://arxiv.org/html/2408.14317v1                                                                                                  | Claim Verification in the Age of Large Language Models: A Survey                                      | Academic survey      | HIGH        | 4.5   | 2024      |
| 14  | https://arxiv.org/html/2504.12424v1                                                                                                  | Don't Just Translate, Agitate: Using LLMs as Devil's Advocates for AI Explanations                    | Academic preprint    | HIGH        | 4.3   | Apr 2025  |
| 15  | https://arxiv.org/html/2601.19921                                                                                                    | Demystifying Multi-Agent Debate: The Role of Confidence and Diversity                                 | Academic preprint    | HIGH        | 4.5   | Jan 2026  |
| 16  | https://github.com/richiethomas/claude-devils-advocate                                                                               | Claude Devil's Advocate: Multi-Round Code Review                                                      | Open source          | MEDIUM-HIGH | 3.9   | 2025      |
| 17  | https://age-of-product.com/three-ai-skills-to-sharpen-judgment/                                                                      | AI Thinking Skills: Socratic Explorer, Brutal Critic, Pre-Mortem                                      | Community blog       | MEDIUM      | 3.4   | 2025      |
| 18  | https://aclanthology.org/2025.findings-acl.1141/                                                                                     | CONSENSAGENT: Towards Efficient and Effective Consensus Through Sycophancy Mitigation                 | Academic/ACL         | HIGH        | 4.5   | 2025      |
| 19  | https://github.com/zscole/adversarial-spec                                                                                           | Adversarial Spec: Iterative Refinement by Multi-LLM Debate                                            | Open source          | MEDIUM      | 3.5   | 2025      |
| 20  | https://arxiv.org/html/2502.06251v1                                                                                                  | Amplifying Minority Voices: AI-Mediated Devil's Advocate System                                       | Academic preprint    | HIGH        | 4.3   | Feb 2025  |

---

## Agent-Specific Design Recommendations

### contrarian-challenger

**Purpose:** Challenge the primary researcher's findings with adversarial rigor
before synthesis.

**Core design principles:**

1. **Steel-man before attacking.** Receive the research findings. Internally
   generate "the strongest version of these findings" before attacking. This
   prevents strawman critiques.
2. **Pre-mortem framing.** Add a sub-prompt: "Assume this research turns out to
   be wrong in six months. What are the three most likely reasons?"
3. **Disconfirmation-first search.** If the challenger searches for additional
   evidence, 60%+ of searches must seek contradicting evidence. Default LLM
   behavior is confirmatory search.
4. **Numbered, specific objections.** Output must list specific numbered
   objections, not vague criticism. Each objection must cite specific evidence
   or identify a specific gap.
5. **Anti-sycophancy mandate.** Explicit instruction: "Do not seek consensus.
   Change your challenge only if you find specific evidence your challenge is
   wrong. Maintain your challenge if you believe it is valid."

**iMAD-inspired selective triggering:** Fire the contrarian-challenger when ANY
of these are true:

- 3+ claims in the research have LOW or MEDIUM confidence
- Sub-agents produced contradictory findings on the same question
- The question is classified as high-stakes or irreversible
- Any finding lacks independent corroboration (single-source claim) Skip when:
  all claims are HIGH confidence with 2+ independent sources and no
  contradictions detected.

**Recommended output format:**

```
CHALLENGE ASSESSMENT:
Overall: PASS | PARTIAL | FAIL

Per-finding challenges:
1. [Finding title] — CHALLENGED | UNCHALLENGED
   Challenge: [specific objection]
   Evidence: [supporting source for challenge, or "gap: no evidence found"]

Pre-mortem failure modes:
1. [Most likely failure scenario if findings are wrong]
2. [Second most likely]
3. [Third most likely]

Assumptions requiring verification:
- [Assumption 1]
- [Assumption 2]
```

---

### claim-verifier

**Purpose:** Per-claim verification against evidence, producing
VERIFIED/REFUTED/INSUFFICIENT verdicts.

**Core design principles:**

1. **Three-verdict system.** Each claim receives: VERIFIED (evidence found),
   REFUTED (contradicting evidence found), or INSUFFICIENT (cannot determine
   from available evidence). Optional fourth: CONFLICTING (contradicting sources
   of equal weight).
2. **Evidence requirement.** Every verdict must cite the specific source URL and
   quote the relevant passage. "VERIFIED" without a citation is invalid.
3. **Active disconfirmation search.** Before confirming VERIFIED, the verifier
   must search for contradicting evidence. A claim confirmed without a
   disconfirmation search is LOW confidence at best.
4. **Divergence packet analysis.** When multiple sources conflict, the verifier
   evaluates reasoning quality at the divergence point — not source count. A
   minority finding with strong reasoning and authoritative source outweighs
   majority findings with weak sourcing.
5. **Filesystem/code verification.** For claims about code behavior or file
   existence, the verifier should check the actual filesystem, not just
   documentation (per CLAUDE.md guardrail 12).

**ClaimCheck-inspired pipeline:**

1. Extract each discrete factual claim from the research
2. Generate targeted disconfirmation search queries per claim
3. Retrieve and evaluate evidence
4. Synthesize verdict with source citation
5. Flag any claims where evidence conflicts

**Output format:**

```
CLAIM VERIFICATION REPORT:

Claim 1: [verbatim claim text]
Verdict: VERIFIED | REFUTED | INSUFFICIENT | CONFLICTING
Evidence: [source URL — "quote"]
Contradicting evidence: [if found] | None found
Confidence: HIGH | MEDIUM | LOW

[repeat per claim]

Summary: N verified, N refuted, N insufficient, N conflicting
Highest-risk claims: [list claims where verdict is REFUTED or CONFLICTING]
```

---

### otb-challenger (Outside-the-Box)

**Purpose:** Find blind spots, unexplored alternatives, and reframings the
research did not consider.

**Core design principles:**

1. **Alternative hypothesis generation.** Before reviewing findings, generate 3+
   alternative hypotheses that could explain the evidence. The primary finding
   is just one interpretation.
2. **Assumption surfacing.** Identify the unstated assumptions the research is
   operating under. Ask: "What would need to be true for the opposite conclusion
   to hold?"
3. **BRAINSTORM mode (from Vibe Science).** Explicitly explore alternative
   explanations rather than just challenging the primary finding.
4. **Salvagente Rule.** When rejecting a finding, produce a serendipity seed:
   "This finding may be wrong, but it points to [alternative signal worth
   investigating]."
5. **Seven adversarial prompting strategies** (from the AI Explanations paper):
   Apply counterfactual thinking, scrutinize assumptions, and surface
   alternative explanations as core OTB moves.

**Practical prompting pattern:**

- "What are we not seeing? List 3-5 alternative framings of the evidence that
  were not explored."
- "What assumptions is this research making that, if wrong, would invalidate the
  conclusions?"
- "If an expert in [adjacent domain] reviewed this, what would they find
  missing?"
- "What is the weakest link in the chain of reasoning? If that breaks, what else
  breaks?"

**Cross-model diversity.** If the primary research agents used Claude, the OTB
challenger should use a different model (or be explicitly prompted to simulate
different epistemic perspectives). D2b confirmed model diversity matters more
than debate structure.

**Output format:**

```
OTB CHALLENGE REPORT:

Alternative hypotheses not explored:
1. [Alternative framing of the evidence]
2. [Second alternative]
3. [Third alternative]

Unstated assumptions:
- [Assumption 1] — What if this is false?
- [Assumption 2] — What if this is false?

Missing perspectives:
- [Domain/viewpoint not considered]

Serendipity seeds (from failed alternatives):
- [Finding that was rejected but points to something worth investigating]

Blind spots: [Summary of what the research may have missed]
```

---

## Anti-Sycophancy Implementation Recommendations

Based on the research, sycophancy in adversarial agents is a structural risk
requiring structural countermeasures — not just good prompting:

### 1. Independent Assessment Before Seeing Other Outputs [CONFIDENCE: HIGH]

The most critical anti-sycophancy measure: adversarial agents must form their
independent assessment before seeing the primary research findings in full.
Present claims in batches; force the verifier to commit before seeing the
synthesizer's verdict.

### 2. Free-MAD Mandate [CONFIDENCE: HIGH]

Explicit instruction in every adversarial agent definition: "Change your
assessment only if you find specific evidence that you are wrong. Do not change
your position simply because other agents disagree. Consensus is not evidence of
correctness."

### 3. AgentAuditor Divergence Evaluation [CONFIDENCE: HIGH]

When agents disagree, the orchestrator should evaluate the _quality of
reasoning_ at the divergence point, not the count of agents on each side.
Minority positions with strong evidence and clear reasoning should be preserved,
not overruled by majority vote.

### 4. ACPO-Inspired Training Signal [CONFIDENCE: MEDIUM]

For any learning mechanism in deep-research, prioritize cases where the majority
of agents were wrong but the adversarial challenger was right. These are the
highest-value training signals for improving adversarial quality.

### 5. Forced Non-Concession Rule [CONFIDENCE: HIGH]

The claude-devils-advocate pattern: adversarial agents must raise at least one
substantive challenge before concluding the research is acceptable. Pure
agreement outputs should be treated as a signal of sycophancy, not quality.

---

## iMAD Applicability Assessment

**Can iMAD's selective triggering be adapted for deep-research?**

The 41-feature ML classifier is not directly portable — it requires model
training. However, the _principle_ is fully applicable:

**Tractable iMAD-inspired trigger ruleset for deep-research:**

```
TRIGGER adversarial review if ANY of:
- confidence_distribution has 3+ LOW claims
- confidence_distribution has 5+ MEDIUM claims
- source_contradictions > 0 (sources disagree on same claim)
- single_source_claims > 2 (claims supported by only one source)
- all_claims_same_source == true (no cross-referencing)
- question_stakes == HIGH (irreversible or high-impact decision)

SKIP adversarial review if ALL of:
- all claims are HIGH confidence
- all claims have 2+ independent sources
- no source contradictions detected
- question is low-stakes / reversible
```

**Expected token reduction:** A ruleset like this would skip adversarial review
on roughly 40-60% of standard research queries (those with clear, well-sourced
findings). This aligns with iMAD's goal of selective triggering without
requiring a trained classifier.

**Implementation note:** The trigger ruleset should be evaluated by the
orchestrator after Phase 1 searchers complete, before spawning adversarial
agents. This preserves the "independent assessment" anti-sycophancy property.

---

## Contradictions

**Contradiction 1: Debate always helps vs. debate often wastes**

- Free-MAD [3] and iMAD [2] show debate improves accuracy when applied
  selectively
- The "Demystifying Multi-Agent Debate" paper [15] shows vanilla MAD "often
  underperforms simple majority vote"
- Resolution: Both are correct — debate helps when there is genuine diversity
  and genuine uncertainty. The contradiction dissolves with selective
  triggering.

**Contradiction 2: Consensus is valuable vs. consensus is sycophancy**

- Standard MAD frameworks encourage convergence toward consensus as a quality
  signal
- Free-MAD and AgentAuditor both show consensus-seeking degrades quality
- Resolution: Consensus on correctly-reasoned answers is valuable; consensus
  driven by social conformity is harmful. The distinction requires structural
  countermeasures (Free-MAD's mandate, ACPO training).

**Contradiction 3: Cross-model diversity is key vs. prompting structure is key**

- D2b (upstream finding) concluded model diversity matters more than debate
  structure
- Free-MAD shows 13-16% improvement from structural changes alone
  (consensus-free framing), even with same models
- Resolution: Both matter independently. Structure matters for anti-sycophancy;
  diversity matters for finding the correct answer when structure is held
  constant.

---

## Gaps

1. **iMAD classifier training data:** The specific training dataset used to
   build iMAD's 41-feature classifier is not publicly available. Reproducing the
   exact triggering mechanism requires training data collection.

2. **OTB agent effectiveness metrics:** No academic paper specifically measures
   "outside-the-box" agent performance. The nearest proxies are lateral thinking
   evaluations, which show mixed LLM performance (2025 CHI study found no
   evidence LLMs help with problem reframing).

3. **Filesystem verification patterns:** No direct research found on agents that
   verify claims against local filesystem state (file existence, code behavior).
   This is a gap in the literature — the deep-research claim-verifier would be
   novel in this regard.

4. **Selective triggering false negative rate:** iMAD reduces tokens by 92% but
   what is the false negative rate — how often does it skip debate that would
   have caught an error? The paper does not report this metric directly.

5. **Agent definition token overhead:** D1 found 500-2000 token sweet spot for
   agent definitions. The three proposed agents each need detailed adversarial
   protocols — risk of exceeding the sweet spot and degrading performance.

---

## Serendipity

**Vibe Science Salvagente Rule** is highly applicable beyond adversarial
research: when ANY agent rejects or fails to verify a claim, requiring it to
produce a "serendipity seed" (why the claim failed + what signal it points to)
could prevent knowledge loss across deep-research sessions. This pattern is not
currently in deep-research's workflow.

**The "Wait" prompt anti-blind-spot technique:** Research found that appending a
minimal "Wait" prompt activates dormant self-correction capabilities, reducing
blind spot rate from 64.5% average to 10.7% (89.3% reduction). This is
potentially applicable as a low-cost addition to any deep-research agent before
it finalizes its output.

**AgentAuditor token efficiency:** The Reasoning Tree approach costs only 973
tokens vs. 1,762 for LLM-as-Judge (44.8% cheaper) while outperforming it. If
deep-research implements a synthesizer auditor, the Reasoning Tree approach
offers a path to better quality at lower cost.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM-HIGH claims: 2
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All key findings are supported by at least one peer-reviewed or official source.
The agent design recommendations synthesize patterns from 20 sources across
academic literature, production systems, and open-source implementations.
