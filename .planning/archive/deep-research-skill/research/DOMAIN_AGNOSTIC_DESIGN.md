# Domain-Agnostic Research Architecture

> **Research Date:** 2026-03-20 **Status:** RESEARCH COMPLETE **Scope:**
> Architectural design for a deep-research skill that handles ANY subject domain

---

## Executive Summary

Building a research system that works across every domain -- technology,
academia, medicine, law, finance, security, competitive intelligence, and
domains not yet anticipated -- requires abandoning domain-hardcoded logic in
favor of **adaptive primitives**. The core insight from studying Gemini Deep
Research, Perplexity, OpenAI Deep Research, intelligence analysis (ACH),
consulting methodology (MECE), investigative journalism, OSINT, and library
science is this:

**Universal research is not about knowing every domain. It is about having a
structured process that detects what it does not know and adapts accordingly.**

The architecture rests on five pillars:

1. **Question-type classification** drives strategy selection (not domain
   detection alone)
2. **Domain detection** tunes source authority, verification depth, and output
   format
3. **The CRAAP+SIFT framework** provides domain-agnostic source evaluation
4. **Iterative plan-search-evaluate loops** (ReAct pattern) converge on answers
   regardless of domain
5. **Graceful degradation** handles unknown domains via meta-research
   bootstrapping

---

## Research Strategy Adaptation

### By Question Type

The research approach must change based on what is being asked, not just what
domain it falls in. A taxonomy of question types, drawn from academic research
methodology and library science, maps to distinct research strategies:

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

**Key insight from Perplexity's architecture:** Deep Research performs 3-5
sequential searches to refine queries as it learns what data is missing. The
question type determines the _shape_ of the iteration -- factual questions
converge in 1-2 rounds, while investigative questions may require 5+ rounds of
hypothesis refinement.

**Key insight from intelligence analysis (ACH):** Evaluative and investigative
questions benefit from the Analysis of Competing Hypotheses approach --
enumerate all possible answers first, then seek _disconfirming_ evidence rather
than confirming evidence. This reduces confirmation bias regardless of domain.

### By Domain

Domain affects three things: **where to look**, **how to verify**, and **how to
present findings**. But the underlying research _process_ (plan, search,
evaluate, synthesize) stays the same.

The system should detect domain to tune parameters, not to switch algorithms.

---

## Domain Detection

### The Classification Problem

A research question must be classified into one or more domains so the system
can adjust source selection, verification rules, and output format. Three
approaches exist:

**1. Explicit declaration (user specifies)**

- Highest accuracy, lowest friction for power users
- Example: `--domain=legal` or selecting from a dropdown
- Problem: Requires user to know the domain; fails for cross-domain questions

**2. Implicit inference (system detects)**

- Keyword/entity extraction: "FDA", "PubMed" signals medical; "CVE", "OWASP"
  signals security
- Topic modeling: Classify the query using a lightweight few-shot prompt
- Hybrid: Infer domain, then confirm with the user before proceeding
- Problem: Ambiguous queries ("compliance automation" could be legal, fintech,
  or security)

**3. Adaptive detection (recommended)**

- Start with a lightweight classification prompt that outputs domain(s) +
  confidence
- If confidence is high (>0.8), proceed with inferred domain
- If confidence is low or multi-domain, either ask the user or treat as
  cross-domain
- Re-evaluate domain classification after the first search round (new evidence
  may clarify)

### Classification Taxonomy

A practical domain taxonomy for research:

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
    clinical
    public-health
    pharmaceutical
  legal-regulatory/
    statutory-law
    case-law
    regulatory-compliance
  finance-markets/
    corporate-finance
    investments-markets
    fintech
  business/
    strategy
    competitive-intelligence
    market-research
  government-policy/
    legislation
    defense-intelligence
    public-administration
  UNKNOWN (trigger meta-research)
```

**Multi-domain questions** (e.g., "legal implications of AI in healthcare")
should be tagged with all relevant domains. Source selection then unions the
authoritative sources for each domain, and verification applies the strictest
rules from any applicable domain.

---

## Source Authority by Domain

Different domains have fundamentally different authority hierarchies. The system
needs a configurable **Source Authority Map** that ranks source types per
domain.

### Technology & Software Engineering

| Tier              | Source Type                                    | Examples                                 | Trust Signal                                    |
| ----------------- | ---------------------------------------------- | ---------------------------------------- | ----------------------------------------------- |
| 1 (Primary)       | Official documentation                         | MDN, React docs, RFC specs               | `.dev`, `.io` official domains; version-matched |
| 2 (Verified)      | Curated knowledge bases                        | Context7, StackOverflow accepted answers | Community verification, recency                 |
| 3 (Secondary)     | Technical blogs, tutorials                     | CSS-Tricks, Smashing Magazine            | Author credentials, publication date            |
| 4 (Supplementary) | Forum discussions, social media                | Reddit, HN, Discord threads              | Cross-reference required                        |
| **Pitfall**       | Outdated tutorials, AI-generated content farms | Medium clones, SEO-optimized garbage     | Check publication date vs library version       |

### Academic & Scientific

| Tier              | Source Type                           | Examples                                  | Trust Signal                       |
| ----------------- | ------------------------------------- | ----------------------------------------- | ---------------------------------- |
| 1 (Primary)       | Peer-reviewed journals                | Nature, Science, domain-specific journals | DOI, impact factor, citation count |
| 2 (Verified)      | Preprint servers with quality signals | arXiv (cited papers), bioRxiv             | Citation velocity, author h-index  |
| 3 (Secondary)     | Conference proceedings                | NeurIPS, ACL, CVPR                        | Acceptance rate, peer review       |
| 4 (Supplementary) | Review articles, textbooks            | Annual Reviews, Springer texts            | Recency of review, edition         |
| **Pitfall**       | Predatory journals, retracted papers  | Check Retraction Watch, Beall's List      | No peer review, pay-to-publish     |

### Medical & Health

| Tier              | Source Type                                 | Examples                                     | Trust Signal                     |
| ----------------- | ------------------------------------------- | -------------------------------------------- | -------------------------------- |
| 1 (Primary)       | Government health agencies                  | WHO, CDC, FDA, NICE                          | Official `.gov` domains          |
| 2 (Verified)      | Peer-reviewed medical journals              | NEJM, Lancet, BMJ, JAMA                      | PubMed indexed, DOI              |
| 3 (Secondary)     | Medical databases                           | PubMed, Cochrane Library, ClinicalTrials.gov | Systematic reviews preferred     |
| 4 (Supplementary) | Professional org guidelines                 | AMA, specialty colleges                      | Current edition, consensus-based |
| **Pitfall**       | Health misinformation, supplement marketing | Wellness blogs, influencer content           | No clinical evidence, anecdotal  |

### Legal & Regulatory

| Tier              | Source Type                          | Examples                                       | Trust Signal                             |
| ----------------- | ------------------------------------ | ---------------------------------------------- | ---------------------------------------- |
| 1 (Primary)       | Primary law sources                  | Statutes, regulations, case law                | Official government repositories         |
| 2 (Verified)      | Legal databases                      | Westlaw, LexisNexis, Google Scholar (case law) | Shepardized/KeyCited (still good law)    |
| 3 (Secondary)     | Law review articles                  | Harvard Law Review, Yale Law Journal           | Peer-reviewed, cited by courts           |
| 4 (Supplementary) | Legal commentary                     | Law firm blogs, Justia, Cornell LII            | Attorney credentials, jurisdiction match |
| **Pitfall**       | Jurisdiction confusion, outdated law | A statute may be amended or repealed           | Always verify current status             |

### Finance & Markets

| Tier              | Source Type                        | Examples                                     | Trust Signal                         |
| ----------------- | ---------------------------------- | -------------------------------------------- | ------------------------------------ |
| 1 (Primary)       | Regulatory filings                 | SEC EDGAR, company 10-K/10-Q filings         | Official filings, audited financials |
| 2 (Verified)      | Financial data providers           | Bloomberg, Reuters, S&P Global               | Licensed data, institutional use     |
| 3 (Secondary)     | Analyst reports                    | Gartner, Forrester, Morgan Stanley research  | Methodology disclosed, track record  |
| 4 (Supplementary) | Financial journalism               | FT, WSJ, Bloomberg News                      | Editorial standards, sourcing        |
| **Pitfall**       | Promotional content, pump-and-dump | Seeking Alpha user posts, crypto influencers | Undisclosed conflicts of interest    |

### Security & Cybersecurity

| Tier              | Source Type                      | Examples                                   | Trust Signal                       |
| ----------------- | -------------------------------- | ------------------------------------------ | ---------------------------------- |
| 1 (Primary)       | Vulnerability databases          | CVE/NVD, NIST, OWASP                       | Official CVE IDs, CVSS scores      |
| 2 (Verified)      | Security vendor research         | Mandiant, CrowdStrike, Recorded Future     | Incident response experience, IOCs |
| 3 (Secondary)     | Security blogs, conference talks | Krebs on Security, DEF CON talks           | Author reputation, technical depth |
| 4 (Supplementary) | Security forums, advisories      | CERT advisories, vendor security bulletins | Cross-reference with CVE           |
| **Pitfall**       | FUD, marketing-as-research       | Vendor whitepapers selling products        | Distinguish research from sales    |

### Competitive Intelligence & Market Research

| Tier              | Source Type                      | Examples                                      | Trust Signal                    |
| ----------------- | -------------------------------- | --------------------------------------------- | ------------------------------- |
| 1 (Primary)       | Company filings, press releases  | Investor relations, earnings calls            | Direct from company, verifiable |
| 2 (Verified)      | Industry analysts                | Gartner Magic Quadrant, IDC MarketScape       | Methodology disclosed           |
| 3 (Secondary)     | Industry publications            | TechCrunch, Industry Dive verticals           | Editorial standards             |
| 4 (Supplementary) | Job postings, patent filings     | LinkedIn, USPTO, Google Patents               | Signals of activity, not claims |
| **Pitfall**       | Biased comparisons, astroturfing | G2 reviews (can be gamed), vendor comparisons | Look for independent validation |

---

## Cross-Domain Research

### The Intersection Problem

Many real-world research questions span multiple domains: "What are the HIPAA
implications of using AI for medical diagnosis?" touches medical, legal,
technology, and regulatory domains simultaneously.

### Architecture for Cross-Domain Questions

**Approach 1: Domain Decomposition (recommended)** Break the question into
domain-specific sub-questions, research each with domain-appropriate sources,
then synthesize:

```
Original: "HIPAA implications of AI in medical diagnosis"
  -> Medical sub-Q: "How is AI currently used in medical diagnosis?"
  -> Legal sub-Q: "What HIPAA provisions apply to AI-processed health data?"
  -> Technology sub-Q: "What data handling practices do medical AI systems use?"
  -> Synthesis: Merge findings, identify gaps at domain boundaries
```

This mirrors how Anthropic's Claude research architecture works: a lead
orchestrator delegates sub-questions to parallel sub-agents, each exploring a
specific part of the problem space, then brings results back for synthesis.

**Approach 2: Generalist with Domain Hints** A single research thread uses the
union of all relevant domain source authorities, applying the strictest
verification rules from any applicable domain. Simpler to implement but may miss
domain-specific nuances.

**Approach 3: Expert Panel Simulation** For critical cross-domain questions,
simulate multiple "expert perspectives" by researching from each domain's
viewpoint, then identifying agreements and conflicts between perspectives. This
is analogous to ACH (Analysis of Competing Hypotheses) from intelligence
analysis.

### When Domain Expertise Matters vs. General Research Skill

Domain expertise matters most when:

- Verification requires domain-specific knowledge (e.g., "Is this paper
  retracted?")
- Source authority hierarchies are counterintuitive (e.g., preprints vs.
  journals in physics)
- Terminology has different meanings across domains ("agent" in AI vs. law vs.
  insurance)
- Recency requirements vary (yesterday's security advisory vs. a 50-year legal
  precedent)

General research skill matters most when:

- The question is well-structured and sources are clearly authoritative
- The domain is novel or interdisciplinary (no established hierarchy exists)
- The task is primarily synthesis, comparison, or summarization

---

## Domain-Specific Verification

### The Verification Matrix

Each domain has different "is this still true?" checks. Rather than hardcoding
every domain's rules, the system should use a **verification template** with
domain-specific parameters:

```
VERIFICATION_TEMPLATE:
  recency_check:
    question: "Is this information current?"
    domain_params:
      technology: "Check version numbers. Is this for the current release?"
      medical: "Check current clinical guidelines. Has this been superseded?"
      legal: "Check if statute/case is still good law. Any amendments?"
      academic: "Check if paper has been retracted or significantly challenged."
      finance: "Check data date. Markets data older than 1 quarter may be stale."
      security: "Check if vulnerability is patched. Is the advisory current?"

  authority_check:
    question: "Is this source authoritative for this claim?"
    domain_params:
      technology: "Is this the official documentation or a derivative?"
      medical: "Is this peer-reviewed or from a recognized health authority?"
      legal: "Is this primary law or commentary? Correct jurisdiction?"
      academic: "Peer-reviewed? Journal impact factor? Author credentials?"
      finance: "Audited financials or analyst opinion? Conflicts disclosed?"
      security: "CVE assigned? Confirmed by vendor? Independent verification?"

  contradiction_check:
    question: "Do other authoritative sources contradict this?"
    method: "Search for the same claim in 2+ independent sources"
    escalation: "If contradiction found, report both positions with evidence"

  bias_check:
    question: "Does the source have a financial or ideological interest?"
    method: "Check who funded/published the source. Check for disclaimers."
    domain_params:
      technology: "Vendor documentation may omit limitations"
      medical: "Pharma-funded studies may overstate efficacy"
      legal: "Law firm blogs may favor their practice area"
      finance: "Analyst reports may reflect institutional positions"
      security: "Vendor advisories may exaggerate threats they can fix"
```

### The CRAAP+SIFT Universal Framework

Two established frameworks from library science and digital literacy provide
domain-agnostic source evaluation:

**CRAAP Test** (developed by CSU Chico librarians):

- **Currency**: When was this published? Is it current enough for this domain?
- **Relevance**: Does this source actually address the specific question?
- **Authority**: Who wrote this? What are their credentials in this domain?
- **Accuracy**: Can the claims be verified? Are sources cited?
- **Purpose**: Why does this source exist? Inform, persuade, sell, entertain?

**SIFT Method** (developed by Mike Caulfield):

- **Stop**: Pause before trusting or sharing. Check emotional response to
  headline.
- **Investigate the source**: What do trusted third parties say about this
  source?
- **Find better coverage**: Can you find the same claim from a more
  authoritative source?
- **Trace claims**: Follow the claim back to its original context.

**Combined application for AI research:** Apply CRAAP scoring to every source
retrieved. Apply SIFT's lateral reading principle by cross-referencing claims
across independent sources. The combination works for any domain because it
evaluates the _source and claim structure_ rather than the _domain content_.

---

## Output Format Adaptation

### The Hybrid Approach

Research output should use a **universal structure with domain-specific
sections**. A purely universal format loses domain-appropriate nuance. A purely
domain-specific format requires maintaining templates for every conceivable
domain. The hybrid solves both problems.

### Universal Structure (always present)

```markdown
# [Research Question]

## Executive Summary

[2-3 sentence answer with confidence level]

## Key Findings

[Numbered findings, each with source citation and confidence]

## Detailed Analysis

[Main body -- structure adapts by domain, see below]

## Limitations & Caveats

[What the research could NOT determine; gaps; biases]

## Sources

[Tiered by authority level, with confidence ratings]
```

### Domain-Specific Sections (injected into Detailed Analysis)

| Domain      | Additional Sections                                                | Format Adaptations                                                |
| ----------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Technology  | Comparison tables, version compatibility matrix, code snippets     | Favor tables over prose; include version numbers everywhere       |
| Academic    | Literature review narrative, citation chains, methodology critique | Formal tone; extensive citations; discussion of methodology       |
| Medical     | Clinical evidence levels, guideline summaries, contraindications   | Evidence grading (Level I-V); risk/benefit framing                |
| Legal       | Issue-Rule-Analysis-Conclusion (IRAC), jurisdiction mapping        | Precedent chains; statutory citations; jurisdiction caveat        |
| Finance     | Data tables, trend analysis, risk factors                          | Quantitative emphasis; date-stamp all data; disclose data sources |
| Security    | Threat model, affected versions, remediation steps                 | CVSS scoring; timeline of disclosure; patch availability          |
| Competitive | Market positioning matrix, SWOT analysis                           | Comparative tables; cite data sources for market sizing           |

### Audience Adaptation

Beyond domain, output should adapt to the **audience's expertise level**:

- **Expert audience**: Full technical depth, jargon acceptable, methodology
  details
- **Decision-maker audience**: Executive summary emphasis, tradeoff framing,
  recommendations
- **General audience**: Plain language, analogies, simplified structure
- **Mixed audience**: Layered document with summary up front, details in
  appendix sections

---

## The Unknown Domain Problem

### When the System Encounters Unfamiliar Territory

This is the hardest problem: What happens when someone asks about a domain the
system has never been configured for? For example: "What are the current
standards for deep-sea mineral extraction environmental assessment?"

### Meta-Research: Researching How to Research

The solution is a **meta-research bootstrap sequence**:

```
UNKNOWN_DOMAIN_PROTOCOL:
  1. DETECT: Domain confidence < 0.5 from classifier
  2. META-SEARCH: "What are the authoritative sources for [topic]?"
     - "Who are the recognized experts in [topic]?"
     - "What professional organizations govern [topic]?"
     - "What databases or journals cover [topic]?"
  3. BUILD TEMPORARY AUTHORITY MAP:
     - From meta-search results, construct a provisional source hierarchy
     - Weight sources by: how many other sources reference them,
       institutional affiliation, publication standards
  4. VALIDATE AUTHORITY MAP:
     - Cross-reference the provisional map with Wikipedia's
       source citations for the topic
     - Check if identified organizations appear in .gov, .edu, or
       .org domains with established track records
  5. PROCEED WITH RESEARCH:
     - Use the bootstrapped authority map for source selection
     - Apply CRAAP+SIFT as universal verification
     - Flag to user: "This topic required bootstrapped source evaluation.
       Confidence in source authority ranking is MEDIUM."
```

### Graceful Degradation Levels

When domain knowledge is incomplete, the system should degrade gracefully:

| Level                       | Condition                                  | Behavior                                                              |
| --------------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| **Full capability**         | Known domain, high confidence              | Use domain-specific source map, verification rules, output format     |
| **Partial capability**      | Known adjacent domain                      | Use closest domain's source map with lower confidence ratings         |
| **Bootstrapped capability** | Unknown domain, meta-research successful   | Use bootstrapped authority map, flag reduced confidence               |
| **Minimal capability**      | Unknown domain, meta-research inconclusive | Use general web search with CRAAP+SIFT only, heavily flag uncertainty |
| **Honest failure**          | Cannot find reliable sources at all        | Report "insufficient evidence" rather than fabricating an answer      |

### The "Adjacent Domain" Heuristic

For partially-known domains, the system can borrow verification strategies from
the closest known domain. Example: "aquaculture regulation" is not a configured
domain, but it intersects with legal/regulatory (for regulation) and natural
sciences (for aquaculture). The system applies both domain's verification rules.

---

## Universal Research Principles

### What Works Everywhere, Regardless of Domain

Drawing from academic research methodology, investigative journalism,
intelligence analysis (Structured Analytic Techniques), consulting frameworks
(MECE), OSINT, and library science, ten universal principles emerge:

**1. Hypothesis-First, Not Conclusion-First** McKinsey's hypothesis-driven
approach and intelligence analysis's ACH both start by generating multiple
possible answers, then seeking evidence to _disprove_ rather than _confirm_.
This reduces confirmation bias in every domain.

**2. MECE Decomposition** The consulting principle of Mutually Exclusive,
Collectively Exhaustive (MECE) decomposition applies to any research question.
Break the question into non-overlapping sub-questions that together cover the
entire answer space.

**3. Source Triangulation** Investigative journalism requires cross-referencing
claims across multiple independent sources. Perplexity's architecture applies
this: "The algorithm actively looks for information patterns that appear across
multiple independent domains." A claim verified by 3+ independent sources is
dramatically more reliable than one verified by one.

**4. Recency-Appropriate Sourcing** The CRAAP test's "Currency" dimension is
universal. But what "current" means varies wildly: yesterday's CVE advisory vs.
a 200-year-old legal precedent. The system must calibrate recency requirements
per domain.

**5. Authority Verification via Lateral Reading** The SIFT method's core insight
-- check what _other_ sources say _about_ your source, rather than what the
source says about itself -- works across every domain. It is the single most
transferable verification technique.

**6. Iterative Refinement (Plan-Search-Evaluate-Revise)** Every deep research
system (Gemini, Perplexity, OpenAI) uses iterative loops. Gemini Deep Research
"formulates queries, reads results, identifies knowledge gaps, and searches
again." This is the ReAct pattern: Reason, Act, Observe, Iterate. It is
domain-independent.

**7. Explicit Uncertainty Quantification** Report what you do NOT know.
Perplexity includes "source confidence ratings (high, medium, uncertain) and
short lists of disputed data points." Every domain benefits from honest
uncertainty reporting.

**8. Bias Detection** Every domain has systematic biases: vendor marketing in
technology, pharma funding in medicine, jurisdictional bias in law, conflicts of
interest in finance. The CRAAP "Purpose" criterion and OSINT's source
credibility assessment both address this universally.

**9. Evidence Diagnosticity (from ACH)** Not all evidence is equally useful. In
ACH, "diagnosticity" measures how much a piece of evidence helps distinguish
between competing hypotheses. Evidence that is consistent with all hypotheses is
less valuable than evidence that strongly favors one over others. This principle
applies to any research question with multiple possible answers.

**10. Proportional Depth** Not every question needs the same research depth. A
factual lookup needs 1-2 sources; an evaluative deep dive may need 20+. The
system should match effort to question complexity, as noted by LangChain: "Users
don't want simple requests to take 10+ minutes."

---

## Research Profiles / Modes

### Configurable Depth Without Overwhelm

Rather than exposing dozens of parameters, the system should offer **named
profiles** that bundle depth, verification, and output settings. Users can
select a profile or let the system auto-select based on question classification.

### Profile Definitions

**Quick Lookup** (1-2 minutes, 1-3 sources)

- Use case: Simple factual questions, definitions, current status checks
- Sources: Tier 1-2 only, first authoritative answer wins
- Verification: Basic CRAAP check, no cross-referencing required
- Output: Direct answer with source citation, 1-2 paragraphs
- Auto-trigger: Factual or descriptive question with high-confidence single
  answer

**Standard Research** (3-8 minutes, 5-10 sources)

- Use case: How-to questions, comparisons, "should we use X?" decisions
- Sources: Tier 1-3, cross-reference across 3+ independent sources
- Verification: Full CRAAP+SIFT, contradiction checking
- Output: Structured report with findings, comparison tables, recommendations
- Auto-trigger: Comparative, evaluative, or descriptive questions with moderate
  complexity

**Deep Research** (10-30 minutes, 15-30+ sources)

- Use case: Complex evaluations, investigative questions, landscape surveys
- Sources: All tiers, exhaustive search with iterative refinement
- Verification: Full CRAAP+SIFT + domain-specific verification + ACH for
  conflicting claims
- Output: Comprehensive report with executive summary, detailed analysis,
  limitations
- Auto-trigger: Investigative, predictive, or exploratory questions; explicit
  user request

**Academic Research** (15-45 minutes, 20-50+ sources)

- Use case: Literature reviews, evidence synthesis, theoretical analysis
- Sources: Peer-reviewed only (Tier 1-2), citation chain following
- Verification: Retraction checks, methodology critique, citation network
  analysis
- Output: Literature review format with formal citations, methodology discussion
- Auto-trigger: Domain detected as academic; user specifies academic mode

**Competitive Intelligence** (10-20 minutes, 10-20 sources)

- Use case: Market analysis, competitor evaluation, strategic assessment
- Sources: Company filings, analyst reports, job postings, patent filings, press
  coverage
- Verification: Cross-reference company claims with independent analysis
- Output: Competitive matrix, SWOT, market positioning with data sources
- Auto-trigger: Domain detected as competitive/market; company names in query

### Auto-Selection Logic

```
IF question_type == FACTUAL and domain_confidence > 0.8:
    profile = QUICK_LOOKUP
ELIF question_type in [COMPARATIVE, EVALUATIVE, DESCRIPTIVE]:
    profile = STANDARD_RESEARCH
ELIF question_type in [INVESTIGATIVE, PREDICTIVE, EXPLORATORY]:
    profile = DEEP_RESEARCH
ELIF domain == ACADEMIC or user_specified_academic:
    profile = ACADEMIC_RESEARCH
ELIF domain == COMPETITIVE_INTELLIGENCE:
    profile = COMPETITIVE_INTELLIGENCE

// User can always override: --depth=deep, --depth=quick, etc.
```

---

## Design Recommendations

### Architecture for Implementation

Based on the research above, the following architecture is recommended for the
deep-research skill:

**1. Three-Phase Pipeline**

```
Phase 1: CLASSIFY
  Input: Raw research question
  Output: question_type, domain(s), confidence, suggested_profile
  Method: Few-shot classification prompt
  Fallback: Ask user if confidence < 0.5

Phase 2: PLAN
  Input: Classified question + profile
  Output: Research plan (sub-questions, source strategy, verification rules)
  Method: Generate MECE sub-questions; select source authority map per domain;
           determine iteration budget based on profile
  User checkpoint: Present plan for approval (per Gemini's approach)

Phase 3: EXECUTE (iterative)
  Loop:
    a. SEARCH: Execute queries against domain-appropriate sources
    b. EVALUATE: Apply CRAAP+SIFT to each source; rate confidence
    c. SYNTHESIZE: Integrate new findings with existing knowledge
    d. GAP ANALYSIS: Identify unanswered sub-questions or contradictions
    e. DECIDE: Continue (gaps remain, budget allows) or terminate
  Output: Structured findings with source citations and confidence levels

Phase 4: REPORT
  Input: Synthesized findings + profile + domain
  Output: Formatted research report with domain-appropriate sections
  Method: Universal structure + domain-specific section injection
```

**2. Pluggable Domain Modules**

Rather than hardcoding domain knowledge, use a pluggable module system:

```
domain_modules/
  technology.yaml    # Source authority map, verification rules, output sections
  academic.yaml
  medical.yaml
  legal.yaml
  finance.yaml
  security.yaml
  competitive.yaml
  _default.yaml      # Fallback for unknown domains (CRAAP+SIFT only)
```

Each module defines:

- `source_authority_tiers`: Ranked source types with trust signals
- `verification_rules`: Domain-specific checks (retraction check, version check,
  etc.)
- `output_sections`: Additional report sections for this domain
- `recency_threshold`: How old is "too old" for this domain
- `terminology_notes`: Domain-specific term meanings that differ from general
  usage

New domains can be added by creating a new YAML file without changing core code.

**3. The Orchestrator Pattern**

Following the architecture used by Anthropic's Claude research system: a lead
orchestrator manages the overall research strategy, delegates sub-questions to
parallel research threads, and synthesizes results. For cross-domain questions,
each domain gets its own research thread.

```
Orchestrator
  |
  |-- Classifier (Phase 1)
  |-- Planner (Phase 2)
  |-- Research Thread 1 (domain A sub-questions)
  |-- Research Thread 2 (domain B sub-questions)
  |-- ...
  |-- Synthesizer (combines threads)
  |-- Reporter (formats output)
```

**4. Source Confidence Propagation**

Every claim in the final report should carry a confidence score derived from:

- Source tier (Tier 1 = high, Tier 4 = low)
- Cross-reference count (3+ independent sources = high)
- CRAAP score (composite of all five criteria)
- Domain-specific verification result (passed/failed/not-applicable)
- Recency (within domain's recency threshold = high)

The composite confidence flows through to the final report, enabling the user to
see not just _what_ was found but _how confident_ the system is in each finding.

**5. Honest Failure Reporting**

The system must never fabricate answers. When evidence is insufficient:

- Report what was searched and not found
- Distinguish "no evidence found" from "evidence of absence"
- Suggest alternative research approaches the user might try
- Flag when a human domain expert should be consulted

---

## Sources

### AI Research Systems Architecture

- [Gemini Deep Research Agent Documentation](https://ai.google.dev/gemini-api/docs/deep-research)
- [How OpenAI, Gemini, and Claude Use Agents to Power Deep Research](https://blog.bytebytego.com/p/how-openai-gemini-and-claude-use)
- [Introducing Perplexity Deep Research](https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research)
- [LangChain Deep Agents](https://blog.langchain.com/deep-agents/)
- [LangChain Open Deep Research](https://blog.langchain.com/open-deep-research/)
- [AI Agent Systems: Architectures, Applications, and Evaluation (arXiv)](https://arxiv.org/html/2601.01743v1)
- [The Landscape of Emerging AI Agent Architectures (arXiv)](https://arxiv.org/html/2404.11584v1)
- [Google Gemini Deep Research Complete Guide](https://www.digitalapplied.com/blog/google-gemini-deep-research-guide)
- [OpenAI Introducing Deep Research](https://openai.com/index/introducing-deep-research/)
- [Perplexity Deep Research: How It Works, Limitations, and Use Cases](https://www.datastudios.org/post/perplexity-ai-deep-research-how-it-works-limitations-and-use-cases-for-professionals)
- [How Perplexity AI Selects Sources](https://www.trysight.ai/blog/how-perplexity-ai-selects-sources)
- [Deep Research: A Survey of Autonomous Research Agents (arXiv)](https://arxiv.org/html/2508.12752v1)

### Intelligence Analysis & Structured Analytic Techniques

- [Structured Analytic Techniques for Intelligence Analysis (RAND)](https://www.rand.org/content/dam/rand/pubs/research_reports/RR1400/RR1408/RAND_RR1408.pdf)
- [Analysis of Competing Hypotheses (Wikipedia)](https://en.wikipedia.org/wiki/Analysis_of_competing_hypotheses)
- [Mastering ACH: A Practical Framework (SOS Intelligence)](https://sosintel.co.uk/mastering-the-analysis-of-competing-hypotheses-ach-a-practical-framework-for-clear-thinking/)
- [Structured Analytic Techniques Taxonomy (ResearchGate)](https://www.researchgate.net/publication/337154064_Structured_Analytic_Techniques_Taxonomy_and_Technique_Selection)

### Source Evaluation Frameworks

- [CRAAP Test (Wikipedia)](https://en.wikipedia.org/wiki/CRAAP_test)
- [CRAAP Test Guide (Illinois State University)](https://guides.library.illinoisstate.edu/evaluating/craap)
- [SIFT Method (University of Chicago Library)](https://guides.lib.uchicago.edu/c.php?g=1241077&p=9082322)
- [SIFT and Lateral Reading (Central Michigan University)](https://libguides.cmich.edu/web_research/lateral)

### OSINT & Information Gathering

- [OSINT: Frameworks and Applications (Group-IB)](https://www.group-ib.com/resources/knowledge-hub/osint/)
- [What is OSINT (IBM)](https://www.ibm.com/think/topics/osint)
- [OSINT for Research Security (Science Diplomacy Grid)](https://www.sciencediplomacygrid.org/learning-pods/osint-for-research-security)

### Consulting & Research Methodology

- [BCG and McKinsey Problem Solving Process (Slideworks)](https://slideworks.io/resources/mckinsey-problem-solving-process)
- [Consulting Frameworks: MECE, 7S, Porter's Five Forces (StrategyU)](https://strategyu.co/consulting-frameworks/)
- [Investigative Journalism Methodology (Al Jazeera Centre)](https://studies.aljazeera.net/en/analyses/methodological-approaches-investigative-journalism-and-their-impact-enhancing-its-quality)
- [Deep Internet Research: OSINT Techniques (GIJN)](https://gijn.org/resource/introduction-investigative-journalism-deep-internet-research/)

### Research Question Taxonomy

- [Types of Research Questions (University of Minnesota)](https://libguides.umn.edu/c.php?g=1337354&p=9854776)
- [How to Write a Research Question: Types and Examples (Research.com)](https://research.com/research/how-to-write-a-research-question)
- [Research Question Types (Conjointly)](https://conjointly.com/kb/research-question-types/)

### Domain-Specific Verification

- [Step-by-Step Fact Verification for Medical Claims (NAACL 2025)](https://aclanthology.org/2025.naacl-short.68.pdf)
- [Hallucination-Free? Reliability of AI Legal Research Tools (JELS)](https://onlinelibrary.wiley.com/doi/full/10.1111/jels.12413)
- [Detecting Health and Science Misinformation (IBM Research)](https://research.ibm.com/blog/detecting-health-science-misinformation-ai)

### Cross-Domain & Interdisciplinary Research

- [Cross-Domain Knowledge Transfer in Large Models (IntechOpen)](https://www.intechopen.com/online-first/1209560)
- [Cross-Disciplinary Research Framework (Nature Communications)](https://www.nature.com/articles/s41467-024-54703-2)
- [Virtual Laboratories: Domain-Agnostic Workflows (arXiv)](https://arxiv.org/html/2507.06271v1)

### Domain-Specific AI & NLP

- [Advances in Pre-trained Language Models for Domain-Specific Text Classification (ACM TIST)](https://dl.acm.org/doi/10.1145/3763002)
- [Domain Classification with NLP (TAUS)](https://www.taus.net/resources/blog/domain-classification-with-natural-language-processing)
- [Tailoring Scientific Communications for Audience (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7566313/)

### Academic Research Databases

- [Elicit: AI for Scientific Research](https://elicit.com/)
- [Consensus: AI for Research](https://consensus.app/)
- [Dimensions AI](https://www.dimensions.ai/)
- [Web of Science Research Assistant (Clarivate)](https://clarivate.com/academia-government/scientific-and-academic-research/research-discovery-and-referencing/web-of-science/web-of-science-research-assistant/)
