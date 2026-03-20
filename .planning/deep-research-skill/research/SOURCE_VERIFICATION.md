# Source Verification & Confidence Scoring for AI Research

**Document Version:** 1.0 **Last Updated:** 2026-03-20 **Status:** RESEARCH
COMPLETE

---

## Executive Summary

Building a trustworthy AI research system requires treating verification not as
an afterthought but as a structural primitive. The research literature and
industry practice converge on several key principles:

1. **No single verification method is sufficient.** Cross-referencing, authority
   assessment, temporal validation, and provenance tracking must work together
   as complementary layers. Each catches failures the others miss.

2. **Confidence scores must be calibrated, not decorative.** LLMs are
   systematically overconfident. Verbalized confidence ("I'm 90% sure") is
   unreliable without calibration. A confidence score that doesn't correlate
   with actual accuracy is worse than no score at all --- it creates false
   trust.

3. **Citation is not verification.** Attaching a URL to a claim creates the
   appearance of rigor without the substance unless the system verifies that the
   cited source actually supports the specific claim being made. Studies show
   40-56% of AI-generated citations contain errors or are fabricated entirely.

4. **Conflicting sources are signal, not noise.** When sources disagree, the
   system should surface the disagreement rather than silently picking a winner.
   Source conflicts often indicate the most important parts of a research
   question.

5. **Epistemic humility is a design requirement.** The system must distinguish
   between "confirmed by multiple sources," "found in one source," "sources
   conflict," and "no reliable information found." Collapsing these into a
   single confident-sounding paragraph is the primary failure mode of AI
   research tools.

6. **Multi-agent architectures enable adversarial verification.** Having one
   agent research and another attempt to disprove creates a natural verification
   loop that catches errors single-agent systems miss.

---

## 1. Verification Approaches

### 1.1 Cross-Referencing Across Independent Sources

- **How it works:** A claim is verified by checking whether multiple independent
  sources corroborate it. The key word is "independent" --- three news articles
  quoting the same press release count as one source, not three.
- **Strengths:** Highly effective for factual claims (dates, statistics, named
  events). The probability of multiple independent sources being wrong in the
  same way is low.
- **Limitations:** Fails for novel or niche claims where few sources exist. Also
  vulnerable to "citation cascades" where a single original error propagates
  through secondary sources that all reference each other.
- **Implementation complexity:** Medium. Requires source deduplication
  (detecting when sources share a common origin) and a definition of
  "independent."

### 1.2 Authority Hierarchies

- **How it works:** Sources are ranked by type and reliability. Primary sources
  (original research papers, official records, first-hand accounts) outrank
  secondary sources (journalism, reviews, textbooks), which outrank tertiary
  sources (encyclopedias, aggregators, social media).
- **Strengths:** Provides a principled basis for resolving conflicts. A
  peer-reviewed study trumps a blog post.
- **Limitations:** Authority is domain-specific. A medical journal is
  authoritative for clinical claims but not for software architecture. Also,
  primary sources can be retracted, and authoritative institutions can be wrong.
- **Implementation complexity:** Medium. Requires maintaining a domain-aware
  source taxonomy and handling edge cases (preprints, institutional reports,
  government data).

### 1.3 Temporal Verification

- **How it works:** Information is checked for recency and temporal validity. A
  2019 API reference may be obsolete; a 2024 clinical trial may supersede a 2018
  meta-analysis.
- **Strengths:** Critical for fast-moving domains (technology, medicine,
  policy). Catches stale information that cross-referencing alone would validate
  (because many sources may agree on outdated facts).
- **Limitations:** Recency is not always superiority --- a well-established
  older study may be more reliable than a new preprint. Requires domain
  knowledge to assess whether temporal decay matters.
- **Implementation complexity:** Easy to implement for date-checking; Hard to
  implement well (requires understanding which domains have high information
  decay rates).

### 1.4 Provenance Tracking (Chain of Custody)

- **How it works:** For each claim in the output, the system tracks: (a) which
  source it came from, (b) what the original context was, (c) how many degrees
  of separation exist from the primary source, and (d) whether the claim was
  synthesized from multiple sources or directly extracted.
- **Strengths:** Enables post-hoc auditing. Users can trace any claim back to
  its origin and evaluate the chain for themselves.
- **Limitations:** Computationally expensive. Difficult to maintain across
  complex synthesis where a single output sentence may draw on 3-4 sources.
- **Implementation complexity:** Hard. Requires structured metadata at every
  stage of the research pipeline.

### 1.5 RAG-Based Grounding

- **How it works:** Retrieval-Augmented Generation grounds LLM outputs in
  retrieved documents rather than relying on parametric memory. Every generated
  statement should be traceable to a specific passage in a retrieved document.
- **Strengths:** Dramatically reduces hallucination compared to pure generation.
  Enables direct citation. Hybrid retrieval systems (combining sparse matching
  like BM25 with dense embeddings) outperform single-mode approaches by 14-18
  percentage points on factual accuracy.
- **Limitations:** Only as good as the retrieval step. If retrieval misses
  relevant documents or returns low-quality sources, grounding in those sources
  doesn't help. Also, LLMs can still hallucinate claims that superficially match
  retrieved content but distort the actual meaning.
- **Implementation complexity:** Medium-Hard. Requires a retrieval pipeline,
  chunking strategy, and attribution mechanism.

### 1.6 How Commercial Tools Handle Verification

**Perplexity AI** uses a citation-forward architecture: it retrieves live web
content, ranks documents by relevance, authority, freshness, clarity, and
existing citation signals, then passes selected passages to an LLM that
generates answers with inline numbered citations. Verification is partially
delegated to the user through visible source links, making "verify the source"
part of the default interaction rather than an extra audit step.

**Elicit** focuses on academic literature and provides sentence-level citations
from underlying papers. Every AI-generated data point links to a supporting
quote from the source paper. In accuracy testing, Elicit correctly extracted
1,502 out of 1,511 data points (99.4% accuracy). However, its recall is lower
--- sensitivity ranges from 25-69% across case studies, meaning it misses
relevant papers.

**Google DeepMind's SAFE** (Search-Augmented Factuality Evaluator) breaks a
long-form response into individual atomic facts, then evaluates each fact by
sending search queries to Google Search and determining whether the fact is
supported by the results. SAFE agreed with human annotators 72% of the time, and
in disagreement cases, SAFE was correct 76% of the time --- while being 20x
cheaper than human evaluation.

---

## 2. Confidence Scoring Frameworks

### 2.1 Scale Options

| Scale         | Levels        | Description                                              | Tradeoffs                                                 |
| ------------- | ------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| Binary        | 2             | Verified / Unverified                                    | Simple but loses nuance                                   |
| Three-level   | 3             | High / Medium / Low                                      | Good balance for most use cases                           |
| Five-level    | 5             | Very High through Very Low                               | More expressive but harder to calibrate                   |
| Probabilistic | Continuous    | 0.0 to 1.0                                               | Most precise but users struggle to interpret 0.73 vs 0.68 |
| Hybrid        | 3 + qualifier | High (3 sources) / Medium (1 source) / Low (conflicting) | Combines confidence with evidence basis                   |

**Recommendation for our system:** A three-level scale (HIGH / MEDIUM / LOW)
with mandatory evidence qualifiers. The qualifier explains _why_ the confidence
level was assigned:

- **HIGH** --- Corroborated by 3+ independent, authoritative sources; no
  contradicting evidence found
- **MEDIUM** --- Supported by 1-2 sources, or by multiple sources of moderate
  authority; minor conflicts possible
- **LOW** --- Single source of uncertain authority, conflicting sources found,
  information may be outdated, or claim could not be independently verified
- **UNVERIFIED** --- No supporting sources found; claim is based on inference or
  synthesis, not direct evidence

### 2.2 Confidence Propagation

When combining information from multiple sources, confidence should propagate
according to principled rules rather than ad-hoc averaging:

**Bayesian Aggregation:** The most theoretically grounded approach. Each source
contributes evidence weighted by its prior reliability. Bayesian methods allow
principled combination of multiple sources of information, accounting for data
quality variation. In practice:

- If Source A (HIGH reliability) and Source B (HIGH reliability) agree, combined
  confidence increases
- If Source A (HIGH) and Source B (MEDIUM) agree, combined confidence is HIGH
  (the weaker source adds confirmation without reducing confidence)
- If Source A (HIGH) and Source B (HIGH) disagree, confidence drops to LOW and
  the conflict is flagged

**Dempster-Shafer Evidence Theory:** An alternative framework that explicitly
models uncertainty using belief functions and plausibility functions. The belief
function measures confidence that a proposition is true; the plausibility
function measures the extent to which evidence does not contradict it. The gap
between belief and plausibility represents ignorance. This framework is
particularly useful when sources provide partial or ambiguous evidence rather
than clear support/refute signals.

**Practical simplification for our system:**

```
if all_sources_agree AND count >= 3:      confidence = HIGH
if all_sources_agree AND count < 3:       confidence = MEDIUM
if sources_mostly_agree (>75%):           confidence = MEDIUM, note dissent
if sources_split (~50/50):                confidence = LOW, present both sides
if single_source_only:                    confidence = MEDIUM at best
if no_sources_found:                      confidence = UNVERIFIED
```

### 2.3 Calibration

LLM confidence scores are systematically miscalibrated. Research identifies
three primary approaches to measuring and improving calibration:

1. **Logit-based methods** analyze the model's internal probability distribution
   over tokens. Effective when you have access to model internals, but
   unavailable with black-box API models. Researchers compute confidence from
   output logits through length-normalized sequence probabilities or
   attention-weighted sums.

2. **Sampling-based methods** generate multiple responses to the same prompt and
   measure consistency. If 9 out of 10 samples say the same thing, confidence is
   high. Computationally expensive (requires multiple API calls) but works with
   black-box models. The "Cycles of Thought" approach measures confidence
   through explanation stability across iterations.

3. **Verbalized confidence** asks the model to state its confidence in natural
   language. Intuitive and human-readable but models tend to be overconfident by
   default. Requires calibration fine-tuning to produce reliable scores.

**For our system (black-box API access):** Sampling-based consistency checking
is the most practical approach. Generate the research finding, then in a
separate pass, attempt to verify it. If verification succeeds with corroborating
sources, confidence is warranted. If verification fails or finds conflicts,
confidence must be reduced regardless of how confident the model "sounds."

### 2.4 Communicating Confidence to Users

Research on confidence visualization UX patterns identifies key principles:

- **Color-coded indicators** are widely understood: green (HIGH, >= 85%), yellow
  (MEDIUM, 60-84%), red (LOW, < 60%)
- **Show what drives confidence**, not just the level. "HIGH --- confirmed by 3
  peer-reviewed sources" is far more useful than "HIGH"
- **Trigger different UI states based on confidence thresholds.** LOW confidence
  findings might display with a warning banner; UNVERIFIED claims might require
  explicit user acknowledgment
- Users hover over approximately 12 sources in traditional search but only ~2 in
  AI answer engines, creating a trust feedback loop where less verification
  leads to more trust. This means the system must proactively surface
  uncertainty rather than relying on users to check

---

## 3. Citation Best Practices

### 3.1 Inline vs. End-of-Document Citations

| Pattern                           | Pros                                                           | Cons                                             | Best For                           |
| --------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------- |
| Inline numbered `[1]`             | Claim-to-source bond is immediate; matches academic convention | Can clutter text if dense                        | Factual claims, statistics, quotes |
| Inline descriptive `(Smith 2024)` | Provides author context inline                                 | Takes more space; requires consistent formatting | Academic-style output              |
| End-of-section summary            | Cleaner reading flow                                           | Reader must scroll to verify claims              | Synthesis/analysis sections        |
| Source panel (Perplexity-style)   | Non-intrusive; always visible                                  | Weaker claim-source bond                         | Interactive interfaces             |

**Recommendation:** Use inline numbered citations `[n]` for specific factual
claims, with a full source list at document end. For synthesis paragraphs that
draw on general themes from multiple sources, use end-of-section source groups.

### 3.2 Citation Verification

A citation is only valuable if the cited source actually supports the claimed
statement. The research tool CiteCheck (arxiv 2511.16198) demonstrates an
approach where AI performs full-text analysis of cited papers to verify that the
citation supports the claim. Key steps:

1. Extract the specific claim being made
2. Retrieve the cited source content
3. Verify the source actually states what is claimed (not just that it's
   topically related)
4. Flag mismatches: "Source discusses X but does not support the specific claim
   Y"

Studies show citation accuracy rates below 66% when users rely on AI citations
without verification. ChatGPT GPT-4o fabricates or introduces errors in 56% of
academic citations. This means citation verification is not optional --- it is a
core safety requirement.

### 3.3 Handling Inaccessible Sources

For paywalled or otherwise inaccessible sources:

- **Always disclose access limitations:** "This paper is behind a paywall; the
  claim is based on the abstract and citing articles"
- **Reduce confidence accordingly:** A claim supported only by an abstract
  excerpt is MEDIUM confidence at best
- **Provide alternative paths:** Link to preprint versions, institutional
  repositories, or citing articles that quote the relevant passages
- **Never cite a source you cannot access the full text of without disclosing
  this limitation**

### 3.4 Legal and Ethical Considerations

- AI-generated text that cites sources must not misrepresent what those sources
  say (this has led to court sanctions in legal contexts)
- Fair use permits limited quotation for commentary and research, but wholesale
  reproduction of source content raises copyright concerns
- Proper attribution is both ethical and practical --- it enables verification
  and gives credit

---

## 4. Handling Conflicting Information

### 4.1 Conflict Detection Strategies

Conflicts arise when sources provide different answers to the same question. The
system must:

1. **Detect the conflict** --- not silently choose one answer
2. **Classify the conflict type** --- factual disagreement, different time
   periods, different scopes, opinion vs. fact
3. **Surface the conflict to the user** with enough context to evaluate

### 4.2 Resolution Approaches

| Approach                 | How It Works                              | When to Use                                 | Risk                                              |
| ------------------------ | ----------------------------------------- | ------------------------------------------- | ------------------------------------------------- |
| **Majority vote**        | Go with what most sources say             | Low-stakes factual claims with many sources | Majority can be wrong (citation cascades)         |
| **Authority-weighted**   | Prefer the most authoritative source      | When source quality varies widely           | Authorities can be outdated or biased             |
| **Temporal precedence**  | Prefer the most recent source             | Fast-changing domains (tech, policy)        | Newer isn't always better (replication crisis)    |
| **Present both sides**   | Show the conflict explicitly              | High-stakes claims, genuine debates         | Puts burden on user; may create false equivalence |
| **Scope disambiguation** | Show both are right in different contexts | When claims apply to different situations   | Requires nuanced domain understanding             |

**Recommendation for our system:** Default to **present both sides** for any
conflict involving HIGH-authority sources. Use authority-weighted resolution
only when the authority gap is large and unambiguous (e.g., peer-reviewed study
vs. unsourced blog post). Always log the conflict and the resolution decision
for transparency.

### 4.3 Stance Detection

Academic work on stance detection classifies source positions as SUPPORT,
REFUTE, DISCUSS, or UNRELATED relative to a claim. The STEntConv model and
related work build graphs of entities and their stances to detect agreement and
disagreement patterns. For a research tool, lightweight stance classification of
retrieved passages enables automated conflict detection before synthesis.

### 4.4 Practical Patterns

When sources disagree, the output should use explicit framing:

```
According to [Source A] (2024 meta-analysis, n=15,000), X is the case.
However, [Source B] (2025 clinical trial, n=500) found the opposite.
The disagreement may reflect [possible explanation].
Confidence: LOW (sources conflict)
```

This pattern prevents the system from presenting contested claims as settled
facts.

---

## 5. Epistemic Humility Patterns

### 5.1 The Problem of "Confidence Theater"

The primary failure mode of AI research tools is producing text that sounds
authoritative regardless of actual certainty. A well-written paragraph with
professional tone and citations _feels_ reliable even when the underlying claims
are fabricated or poorly supported. Research on epistemic humility in LLMs
(HumbleBench, arxiv 2509.09658) evaluates whether models can recognize when they
don't know --- and most models perform poorly, preferring to guess confidently
rather than abstain.

### 5.2 Uncertainty Expression Patterns

The system should use graduated language that maps to confidence levels:

| Confidence | Language Pattern               | Example                                                                                               |
| ---------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| HIGH       | Direct assertion with citation | "X is the case [1][2][3]"                                                                             |
| MEDIUM     | Qualified assertion            | "Available evidence suggests X [1], though limited research exists"                                   |
| LOW        | Hedged with conflict noted     | "Sources disagree: A finds X [1] while B finds Y [2]"                                                 |
| UNVERIFIED | Explicit uncertainty           | "No reliable sources were found to confirm or deny X"                                                 |
| INFERENCE  | Marked as reasoning            | "Based on [cited premises], X would follow, though this specific conclusion was not found in sources" |

### 5.3 Critical Distinctions

The system must distinguish between these fundamentally different epistemic
states:

- **"No evidence found"** --- the search didn't return results (could be a
  search limitation)
- **"Evidence of absence"** --- sources specifically state that X does not exist
  or is not the case
- **"Insufficient evidence"** --- some evidence exists but it's not enough to
  draw a conclusion
- **"Contested"** --- credible sources actively disagree

Collapsing these into silence (just not mentioning the topic) or false
confidence (asserting something without basis) are both unacceptable failure
modes.

### 5.4 Abstention as a Feature

Research on abstention-hedging models shows that systems which can say "I don't
know" perform better on trust metrics than systems that always produce an
answer. The system should have explicit abstention triggers:

- Fewer than N sources found on a specific sub-question
- All sources are low-authority or very old
- Source conflict ratio exceeds threshold
- The claim requires domain expertise the system cannot verify

When abstaining, the system should explain _why_ it couldn't answer and suggest
what the user could do (e.g., "This may require consulting domain-specific
databases not available to this tool").

---

## 6. Verification in Multi-Agent Systems

### 6.1 Agent Specialization for Verification

Modern multi-agent fact-checking architectures assign specialized roles:

- **Researcher Agent** --- gathers information and synthesizes findings
- **Verifier Agent** --- independently checks claims against sources
- **Critic/Adversarial Agent** --- actively tries to disprove findings
- **Indexer Agent** --- maintains trusted source repositories
- **Mediator Agent** --- resolves disagreements between agents

The **Tool-MAD** framework (arxiv 2601.04742) assigns each agent a distinct
external tool (search API, RAG module, knowledge base) so they cross-validate
evidence from different retrieval systems. Iterative debate rounds allow agents
to refine queries and challenge each other's evidence.

### 6.2 Adversarial Verification Pattern

The most effective verification architecture uses adversarial structure:

1. **Research phase:** Agent A produces findings with citations
2. **Challenge phase:** Agent B receives only the claims (not the citations) and
   attempts to verify or disprove each one using independent searches
3. **Reconciliation phase:** A mediator agent compares Agent A's citations with
   Agent B's findings
4. **Output phase:** Claims that both agents support are HIGH confidence; claims
   only one agent supports are MEDIUM; claims they disagree on are flagged as
   conflicts

The **CLIMINATOR** system demonstrates this for climate claims, using a
Mediator + Advocate framework that simulates structured debates including
adversarial perspectives, iteratively reconciling diverse viewpoints.

### 6.3 Self-Consistency Checking

Even without multiple agents, self-consistency can be checked by:

- Generating the same research question multiple times and comparing answers
- Asking the model to identify potential weaknesses in its own findings
- Re-querying with different phrasings and checking for contradictions

The **Multi-agent Collaborative Filtering (MCF)** framework uses
cross-examination among agents to cross-verify each step while filtering and
selecting the highest-quality responses from the response space.

### 6.4 Four Failure Patterns in Single-Agent Systems

Research identifies four specific hallucination patterns that multi-agent
validation catches:

1. **Claiming success when operations failed** --- the agent reports finding
   information when the search actually returned nothing relevant
2. **Using wrong tools for requests** --- retrieving from an inappropriate
   source type
3. **Fabricating responses** --- generating plausible-sounding but invented
   information
4. **Providing inaccurate statistics** --- hallucinating numbers that sound
   reasonable

Multi-agent validation with a dedicated verifier agent addresses all four by
providing an independent check on each output.

### 6.5 Ground-Truth Anchoring

Use known facts to calibrate the system. Before a research session, the system
can verify a set of known-true claims to ensure the verification pipeline is
working correctly. If the system fails to verify known facts, the entire
session's results should be flagged as potentially unreliable.

---

## 7. Case Studies: Verification Failures

### 7.1 NeurIPS 2025 Hallucinated Citations

**What happened:** GPTZero analysis of 4,000+ NeurIPS 2025 research papers found
hundreds of AI-hallucinated citations across at least 53 papers. Some citations
blended elements from multiple real papers; others were fully fabricated with
nonexistent authors, fake journal names, and dead URLs.

**Why it happened:** Authors used LLMs to draft or polish papers without
verifying generated citations. Peer reviewers did not systematically check
reference validity.

**Prevention:** Automated citation verification at submission time. Every
citation should be checked for: (a) does the paper exist? (b) do the authors
match? (c) does the paper actually discuss what's claimed?

### 7.2 ChatGPT Academic Citation Fabrication

**What happened:** A Deakin University study found GPT-4o fabricated roughly 1
in 5 academic citations, with 56% of all citations containing errors or being
fake. Less-studied subjects (binge eating disorder, body dysmorphic disorder)
had fabrication rates near 30%, while well-studied topics (depression) had only
6% fabrication.

**Why it happened:** LLMs generate plausible-looking citations from parametric
memory. For well-studied topics, the model has seen enough real papers to
produce accurate references. For niche topics, it fills in gaps with fabricated
but realistic-looking references.

**Prevention:** Never trust LLM-generated citations without verification. The
system must retrieve and confirm each cited source exists and says what is
claimed.

### 7.3 Mata v. Avianca (Legal Hallucination)

**What happened:** A New York attorney used ChatGPT for legal research. The
resulting brief cited cases that did not exist. The attorney was sanctioned by
the court.

**Why it happened:** The attorney treated AI output as equivalent to a legal
database search. No verification step existed between generation and submission.

**Prevention:** Mandatory verification gate between AI research output and final
deliverable. The system should never present a citation without confirming the
source exists.

### 7.4 Google AI Overview Citing Satire

**What happened:** In February 2025, Google's AI Overview cited an April Fool's
satire article about "microscopic bees powering computers" as factual
information.

**Why it happened:** The retrieval system selected the article based on topical
relevance without evaluating source intent or genre. Satire, parody, and
fictional content look structurally similar to factual content.

**Prevention:** Source type classification. The system should identify and flag
satirical, opinion, promotional, and fictional content before using it as
evidence.

### 7.5 Hallucination Rate Progression

Historical hallucination rates show improvement but not elimination:

| Model               | Citation Hallucination Rate |
| ------------------- | --------------------------- |
| GPT-3.5             | 39-55%                      |
| GPT-4               | 18-29%                      |
| GPT-4o              | ~20% (varies by domain)     |
| GPT-5 (with search) | ~7-8%                       |

Even the best current models fabricate citations nearly 1 in 12 times.
Verification is not optional.

---

## 8. Design Recommendations for Our System

Based on this research, the following recommendations apply to the deep-research
skill:

### R1: Mandatory Verification Layer

Every factual claim in the final output must pass through a verification step.
This is non-negotiable. The verification step should be a separate pass from the
research step --- the same agent that generated a claim should not be the sole
verifier.

### R2: Three-Level Confidence with Evidence Basis

Use HIGH / MEDIUM / LOW / UNVERIFIED confidence levels. Every confidence
assignment must include an evidence basis:

- Number of corroborating sources
- Authority level of sources
- Whether any sources conflict
- Recency of sources relative to the claim's domain

### R3: Inline Citations with Verification Status

Use numbered inline citations `[n]` for specific claims. Each citation in the
source list should include:

- URL
- Source type (primary/secondary/tertiary)
- Access date
- Whether the source was fully accessed or only partially (e.g., abstract-only
  for paywalled papers)

### R4: Explicit Conflict Surfacing

When sources disagree, the system must present both perspectives with their
respective evidence basis. Never silently resolve conflicts by picking one
source.

### R5: Abstention Protocol

Define explicit conditions under which the system should say "I could not find
reliable information on this" rather than generating a speculative answer:

- Fewer than 2 sources found
- All sources are low-authority
- Source conflict without clear resolution
- Information outside the system's verification capability

### R6: Adversarial Verification Architecture

In multi-agent configurations, use a Researcher + Verifier pattern at minimum.
The verifier should independently search for evidence supporting or refuting
each major claim without seeing the researcher's sources.

### R7: Citation Fabrication Prevention

Never generate citations from model memory. Every citation must come from an
actual retrieved source with a verified URL. Implement a "citation exists" check
before including any reference in the output.

### R8: Temporal Awareness

Tag all sources with publication dates. For domains with high information decay
(technology, medicine, policy), apply temporal weighting that preferences recent
sources while flagging if older foundational sources contradict newer findings.

### R9: User-Facing Transparency

The final output should include:

- A confidence summary at the top (e.g., "12 claims verified HIGH, 3 MEDIUM, 1
  LOW, 2 claims had conflicting sources")
- Inline confidence markers on individual claims
- A methodology note explaining how sources were found and verified

### R10: Calibration Testing

Periodically test the system against known-answer questions to verify that
confidence scores are calibrated. If the system assigns HIGH confidence to
claims that turn out to be wrong more than 5% of the time, the confidence
thresholds need adjustment.

---

## Sources

### Verification Approaches

- [A Survey on Automated Fact-Checking (TACL 2022)](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00454/109469/A-Survey-on-Automated-Fact-Checking)
- [Claim Detection for Automated Fact-checking: Survey](https://www.sciencedirect.com/science/article/pii/S2949719124000141)
- [Automated Fact-Checking Resources (GitHub)](https://github.com/Cartus/Automated-Fact-Checking-Resources)
- [How Perplexity AI Selects Sources (2026)](https://www.trysight.ai/blog/how-perplexity-ai-selects-sources)
- [Perplexity Platform Guide: Citation-Forward Answers](https://www.unusual.ai/blog/perplexity-platform-guide-design-for-citation-forward-answers)
- [Elicit: AI for Scientific Research](https://elicit.com/)
- [Comparison of Elicit AI and Traditional Literature Searching (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12483133/)
- [Google DeepMind SAFE: Long-form Factuality in LLMs](https://deepmind.google/research/publications/85420/)
- [SAFE: Search-Augmented Factuality Evaluator (arxiv)](https://arxiv.org/pdf/2403.18802)

### Confidence Scoring and Calibration

- [Uncertainty Quantification and Confidence Calibration in LLMs: A Survey (KDD 2025)](https://arxiv.org/abs/2503.15850)
- [A Survey on Uncertainty Quantification of LLMs: Taxonomy (ACM Computing Surveys)](https://dl.acm.org/doi/10.1145/3744238)
- [Do LLMs Estimate Uncertainty Well? (ICLR 2025)](https://proceedings.iclr.cc/paper_files/paper/2025/file/ef472869c217bf693f2d9bbde66a6b07-Paper-Conference.pdf)
- [Cycles of Thought: Measuring LLM Confidence through Stable Explanations](https://arxiv.org/html/2406.03441v1)
- [Benchmarking UQ Methods for LLMs with LM-Polygraph (MIT Press)](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00737/128713/Benchmarking-Uncertainty-Quantification-Methods)
- [Quantifying LLMs Uncertainty with Confidence Scores (Capgemini)](https://medium.com/capgemini-invent-lab/quantifying-llms-uncertainty-with-confidence-scores-6bb8a6712aa0)

### Citation and Provenance

- [Citation Verification with AI-Powered Full-Text Analysis (arxiv)](https://arxiv.org/html/2511.16198v1)
- [How AI Engines Cite Sources: Patterns Across ChatGPT, Claude, Perplexity (Medium)](https://medium.com/@shuimuzhisou/how-ai-engines-cite-sources-patterns-across-chatgpt-claude-perplexity-and-sge-8c317777c71d)
- [8 Trusted AI Tools That Provide Sources Correctly](https://anara.com/blog/ai-referencing-sources)
- [LLM Citation Tracking: How AI Systems Choose Sources (2026)](https://www.ekamoira.com/blog/ai-citations-llm-sources)

### Conflicting Information

- [How AI Models Handle Conflicting Information (Am I Cited)](https://www.amicited.com/faq/how-do-ai-models-handle-conflicting-information/)
- [Conflicting Information in AI Search: How Platforms Reconcile Disputes](https://geneo.app/blog/conflicting-information-in-ai-search/)
- [STEntConv: Predicting Disagreement with Stance Detection](https://arxiv.org/html/2403.15885v2)

### Epistemic Humility

- [HumbleBench: Measuring Epistemic Humility in Multimodal LLMs](https://www.maifoundations.com/blog/humblebench/)
- [Measuring Epistemic Humility in Multimodal LLMs (arxiv)](https://arxiv.org/pdf/2509.09658)
- [Epistemic Humility in the Age of AI (PhilArchive)](https://philarchive.org/archive/MOREHI-2)
- [The Transition from Omniscient AI to Epistemically Honest AI](https://intuitmachine.medium.com/the-transition-from-omniscient-ai-to-epistemically-honest-ai-971309f69b1a)

### Multi-Agent Verification

- [Tool-MAD: Multi-Agent Debate Framework for Fact Verification (arxiv)](https://arxiv.org/abs/2601.04742)
- [DelphiAgent: Trustworthy Multi-Agent Verification Framework](https://www.sciencedirect.com/science/article/abs/pii/S0306457325001827)
- [FACT-AUDIT: Adaptive Multi-Agent Framework (ACL 2025)](https://aclanthology.org/2025.acl-long.17.pdf)
- [Multi-agent Systems for Misinformation Lifecycle](https://arxiv.org/html/2505.17511)
- [How to Stop AI Agents from Hallucinating Silently with Multi-Agent Validation](https://dev.to/aws/how-to-stop-ai-agents-from-hallucinating-silently-with-multi-agent-validation-3f7e)
- [LLM-based Agents Suffer from Hallucinations: A Survey](https://arxiv.org/html/2509.18970v1)
- [Mitigating Reasoning Hallucination through Multi-agent Collaborative Filtering](https://www.sciencedirect.com/science/article/abs/pii/S0957417424025909)
- [Argos: Agentic Verifier for AI Agents (Microsoft Research)](https://www.microsoft.com/en-us/research/blog/multimodal-reinforcement-learning-with-agentic-verifier-for-ai-agents/)

### Verification Failures and Hallucination Case Studies

- [NeurIPS Papers Contained 100+ AI-Hallucinated Citations (Fortune)](https://fortune.com/2026/01/21/neurips-ai-conferences-research-papers-hallucinations/)
- [ChatGPT's Hallucination Problem: 56% of References Fabricated or Contain Errors](https://studyfinds.org/chatgpts-hallucination-problem-fabricated-references/)
- [AI Hallucinations in Research: Why 40% of AI Citations Are Wrong (Enago)](https://www.enago.com/academy/ai-hallucinations-research-citations/)
- [Can Generative AI Reliably Synthesise Literature? (AI & Society)](https://link.springer.com/article/10.1007/s00146-025-02406-7)
- [How to Prevent AI Citation Hallucinations (INRA.AI)](https://www.inra.ai/blog/citation-accuracy)
- [Google AI Overview Errors](https://www.articulate.com/blog/how-to-fact-check-ai-content-like-a-pro/)

### Evidence Aggregation Theory

- [Bayesian Reliability: Combining Information](https://www.tandfonline.com/doi/full/10.1080/08982112.2016.1211889)
- [Dempster-Shafer Theory for Multi-Source Information Fusion](https://www.sciencedirect.com/science/article/pii/S1566253524005323)
- [Combining Sources of Evidence with Reliability and Importance (Springer)](https://link.springer.com/article/10.1007/s10100-013-0334-3)

### RAG and Grounding

- [Enhancing Factual Accuracy and Citation Generation (arxiv)](https://arxiv.org/pdf/2509.05741)
- [RAG Evaluation: A Complete Guide (2025)](https://www.getmaxim.ai/articles/rag-evaluation-a-complete-guide-for-2025/)
- [Reducing Hallucinations in LLM Agents with Verified Semantic Cache (AWS)](https://aws.amazon.com/blogs/machine-learning/reducing-hallucinations-in-llm-agents-with-a-verified-semantic-cache-using-amazon-bedrock-knowledge-bases/)

### Confidence Visualization UX

- [Confidence Visualization UI Patterns (Agentic Design)](https://agentic-design.ai/patterns/ui-ux-patterns/confidence-visualization-patterns)
- [Confidence Visualization (AI Design Patterns)](https://www.aiuxdesign.guide/patterns/confidence-visualization)
- [FACTS Benchmark Suite: Evaluating LLM Factuality (Google DeepMind)](https://deepmind.google/blog/facts-benchmark-suite-systematically-evaluating-the-factuality-of-large-language-models/)
