# Gap Finding: AI Content Detection Accuracy and Non-Article Extraction Benchmarks

**Gap type:** low-confidence, scope-gap, missing-sub-question **Profile used:**
web **Confidence:** MEDIUM

---

## Gap 1: AI Content Detection Accuracy

### Finding

Real-world AI content detection accuracy is substantially lower than vendor
claims, and the heuristic signals the research identified (uniform paragraph
length, hedging language, etc.) are unreliable on technical content
specifically. The gap between vendor-claimed accuracy (95-99.5%) and
independently-tested accuracy (65-88%) is large enough to disqualify these
signals as a reliable confidence gate.

Key facts established:

1. Independent tests consistently produce accuracy of 65-88%, while vendors
   claim 95-99.5%.
2. The RAID Benchmark (University of Pennsylvania, 2024) found that when false
   positive rates are constrained below 1%, most detectors become
   near-ineffective (true positive rate approaches zero). This is the
   fundamental accuracy-precision tradeoff.
3. GPTZero achieves 88% overall accuracy in independent tests (February 2026
   review), with a 9% false positive rate -- the second-highest among tools
   tested.
4. Originality.ai leads at 82% overall accuracy in independent tests. Its own
   study claims 99% on flagship models, but it catches only 31.7% of GPT-5
   output and 7.3% of GPT-5-mini output -- the most common model in circulation.
5. Copyleaks has the lowest false positive rate at 3%, making it the safest for
   high-stakes production use.

### Technical Content Bias (Critical for Web Crawling Use Case)

Technical content is the highest-risk domain for false positives:

- Software documentation, legal text, and business reports use standardized
  phrasing, passive voice, and domain-specific repetition that exactly mimics
  AI-generated text.
- The perplexity and burstiness signals on which most detectors rely fail on
  technical content because technical writing naturally produces low perplexity
  (familiar vocabulary, predictable structure) and low burstiness (uniform
  sentence length).
- Academic journals report false accusations against researchers whose
  grant-writing style triggers detection algorithms -- formal language trained
  on structured templates.
- A 2023 Stanford study found 61.3% average false positive rate on TOEFL essays
  (non-native English speakers), which share structural traits with formal
  technical documentation.

### Why Heuristic Signals Fail Specifically

The 6 heuristic signals in the prior research (uniform paragraph length, hedging
language, etc.) face these specific failures:

- Uniform paragraph length: Technical documentation is intentionally formatted
  uniformly. MDN, React docs, and Rust docs all have standardized paragraph
  structure by design.
- Hedging language ("it is worth noting", "it should be considered"): Standard
  in formal technical writing, APIs references, and academic content -- not an
  AI signal on these page types.
- Perplexity: Cannot be computed for ChatGPT, Claude, and Gemini output because
  these models do not expose token probabilities. The signal is blind to the
  most common sources.
- Pangram Labs research confirms: perplexity fails because LLMs are trained to
  minimize it, causing famous texts (Declaration of Independence) to score as
  AI-generated.

### Header-Based Signals: IETF AI-Disclosure Draft

An IETF Internet-Draft (draft-abaris-aicdh-00) proposes an `AI-Disclosure` HTTP
response header with the following structure:

```
AI-Disclosure: mode=ai-originated; model="gpt-4";
               provider="OpenAI"; reviewed-by="editorial-team";
               date=@1745286896
```

Fields: `mode` (none | ai-modified | ai-originated | machine-generated),
`model`, `provider`, `reviewed-by`, `date`.

Critical limitations of this signal:

- The draft is advisory-only (expired November 2025, not ratified).
- The IETF draft explicitly states it "can be trivially spoofed."
- It is designed for machine-readable advisory purposes, not security
  enforcement.
- Adoption is near-zero; no major web platforms have implemented it.

EU AI Act (Article 50) requires machine-readable marking of AI-generated content
by August 2026 for EU providers. The EU Code of Practice (finalized June 2026)
adopts a multilayer approach: metadata, imperceptible watermarks, and
fingerprinting. However, this applies only to EU-compliant generative AI
providers and does not apply retroactively to the 74% of existing AI-generated
web content.

C2PA (Content Credentials) provides cryptographically signed provenance
assertions that are more robust than the IETF header, but adoption is
concentrated in media (images, video) not text-based web content.

### Confidence Degradation Rule (Research Gap -- No Established Standard)

No established production standard exists for confidence degradation when AI
content is suspected. The research literature treats AI detection as a binary
classification problem (AI vs. human), not a confidence-weighting input for
downstream extraction quality. This means any degradation rule applied in the
webcrawler skill would be original design, not established practice.

Reasonable inference from the data:

- At 3% false positive rate (best case, Copyleaks), applying a confidence
  penalty to all flagged content would incorrectly penalize 3% of genuinely
  human-authored technical content. At 74% AI prevalence, this is an acceptable
  tradeoff.
- At 9-17% false positive rates (GPTZero, average detectors), the penalty would
  incorrectly penalize significant volumes of legitimate technical
  documentation.
- Recommended approach from the data: treat AI detection signals as advisory
  soft signals, not binary gates. Weight by content type: article-type content
  is more reliably classified than documentation or technical reference content.

---

## Gap 2: Non-Article Extraction Benchmarks

### Finding

The benchmark F1 scores cited in the original research (trafilatura 0.945,
Readability 0.970) are exclusively from article extraction benchmarks.
Non-article page types are systematically underrepresented or absent from
published benchmarks. However, new data exists from rs-trafilatura (2024) that
provides the first page-type-stratified F1 scores across 7 content categories.

### Confirmed: All Major Benchmarks Are Article-Only

The Scrapinghub article extraction benchmark (the source of most published F1
scores) explicitly focuses on article content. The Chuniversiteit comparison of
14 extractors uses "eight common evaluation datasets" that do not break down by
page type. No documentation-site-specific benchmark existed prior to 2024.

### rs-trafilatura: First Page-Type-Stratified Benchmark (2024)

rs-trafilatura (Rust implementation with ML page-type classification) tested on
a 1,502-page dataset across 7 page types. This is the most relevant non-article
benchmark discovered:

| Page Type     | rs-trafilatura F1 | Standard Trafilatura F1 | Delta  |
| ------------- | ----------------- | ----------------------- | ------ |
| Article       | 0.932             | 0.926                   | +0.006 |
| Documentation | 0.931             | 0.888                   | +0.043 |
| Service       | 0.843             | 0.763                   | +0.080 |
| Forum         | 0.792             | 0.585                   | +0.207 |
| Collection    | 0.713             | 0.553                   | +0.160 |
| Listing       | 0.704             | 0.589                   | +0.115 |
| Product       | 0.670             | 0.567                   | +0.103 |

Key finding: Standard trafilatura achieves F1=0.888 on documentation sites --
meaningfully below its article-benchmark score of 0.945. The gap is 0.057 F1
points.

On a held-out 511-page test set, rs-trafilatura achieves F1=0.893 overall (vs.
0.945 for article-only), confirming performance degrades substantially on
non-article content mix.

### Documentation Sites: Specific Failure Modes

Standard trafilatura fails on documentation sites for these reasons (from
rs-trafilatura analysis):

- Framework-specific boilerplate: Sphinx, Rustdoc, MDN, and ReadTheDocs all
  inject navigation chrome, version selectors, and API sidebars that standard
  extractors retain as body content or strip along with legitimate content.
- Code block handling: Article extractors are trained to strip `<pre>` and
  `<code>` blocks as boilerplate. For documentation, these blocks are the
  primary content.
- Structured data: Technical docs encode parameters and return types in
  definition lists and tables that confuse article-extraction heuristics.

rs-trafilatura adds framework-specific boilerplate removal for Sphinx, Rustdoc,
MDN, and ReadTheDocs, achieving 0.931 on documentation pages.

### Product Pages: Critical Failure

Standard trafilatura achieves F1=0.567 on product pages -- a 40% relative
performance drop from article benchmarks. The root cause is architectural:

Product pages encode descriptions in JSON-LD structured data (schema.org Product
type) rather than visible DOM text. Extractors that parse only visible HTML miss
the semantic content entirely. The visible content is often navigation, pricing
widgets, and image carousels -- all boilerplate.

### SPA/JavaScript-Rendered Pages

No F1 benchmark for SPA content extraction exists in the literature. The
Firecrawl Scrape-Evals benchmark (2025, 1,000 URLs across unique domains) covers
SPAs but does not publish per-category F1 scores in accessible form. The
consensus from scraping literature is that static extractors (trafilatura,
Readability) produce near-zero usable content from SPAs because the content does
not exist in the initial HTML -- it is injected post-JavaScript-execution.

This means the webcrawler skill's JS detection and Playwright fallback are
load-bearing for an unknown fraction of target URLs. Documentation sites and
government portals increasingly use client-side rendering frameworks.

### Government Sites: No Benchmark Data

No benchmark data for government site extraction was found. Government sites
typically use CMS platforms (Drupal, WordPress) with consistent templates,
suggesting article extractors may perform adequately on their text content.
However, government portals often include:

- Embedded PDFs (require separate extraction path)
- Database-backed lookup pages (no body text)
- Form-centric pages (minimal content)

These page types would produce near-zero extraction yield with any article
extractor.

---

## Claims

**[C-G3-01]** Independent benchmarks show AI content detectors achieve 65-88%
accuracy in practice, versus vendor-claimed 95-99.5%. (confidence: HIGH)

**[C-G3-02]** The RAID Benchmark (2024) demonstrated that constraining detector
false positive rates below 1% causes true positive rates to approach zero,
establishing a fundamental accuracy-precision tradeoff. (confidence: HIGH)

**[C-G3-03]** Technical content (documentation, academic writing, formal
business writing) faces 9-17% false positive rates from AI detectors due to
inherent structural similarity to AI-generated text. (confidence: MEDIUM)

**[C-G3-04]** Heuristic signals (perplexity, burstiness, uniform paragraph
length) cannot be computed for output from closed-source models (ChatGPT,
Claude, Gemini) because token probabilities are not exposed. These signals are
structurally blind to the dominant AI content sources. (confidence: HIGH)

**[C-G3-05]** The IETF AI-Disclosure header (draft-abaris-aicdh-00) is an
expired, unadopted draft that is explicitly self-described as trivially
spoofable. It cannot be relied upon as a detection signal. (confidence: HIGH)

**[C-G3-06]** EU AI Act Article 50 requires machine-readable marking of AI
content by August 2026 for EU providers, but this is prospective only and does
not address the existing 74% AI-generated content base. (confidence: HIGH)

**[C-G3-07]** No established production standard exists for applying confidence
degradation to extraction outputs when AI content is suspected. Any rule
implemented in the webcrawler skill is original design without benchmark
validation. (confidence: HIGH)

**[C-G3-08]** Standard trafilatura achieves F1=0.888 on documentation sites
versus 0.945 on articles -- a 6% relative performance drop. (confidence: MEDIUM,
from single source: rs-trafilatura 2024 benchmark)

**[C-G3-09]** Standard trafilatura achieves F1=0.567 on product/ecommerce pages
-- a 40% relative drop from article benchmarks -- because product descriptions
are encoded in JSON-LD structured data not visible DOM text. (confidence:
MEDIUM, single source)

**[C-G3-10]** Forum pages score F1=0.585 with standard trafilatura because
article extractors strip CSS classes like `comment` and `reply` that contain the
primary content. (confidence: MEDIUM)

**[C-G3-11]** No F1 benchmark exists for SPA/JavaScript-rendered page extraction
using static extractors. Static extractors produce near-zero usable content from
SPAs by design. (confidence: HIGH)

**[C-G3-12]** No benchmark data for government site extraction was found in the
literature. (confidence: HIGH)

**[C-G3-13]** rs-trafilatura (page-type-aware Rust implementation, 2024)
achieves F1=0.931 on documentation sites and F1=0.893 overall on a 1,502-page
mixed-type dataset, using ML page-type classification with XGBoost (86.6%
classifier accuracy). (confidence: MEDIUM)

---

## Evidence

### AI Detection

- [GPTZero AI Detection Benchmarking](https://gptzero.me/news/gptzero-ai-detection-benchmarking-the-industry-standard-in-accuracy-transparency-and-fairness/)
  -- vendor benchmark claiming 99.3% accuracy, 0.24% FPR
- [Are AI Detectors Accurate in 2026?](https://walterwrites.ai/are-ai-detectors-accurate/)
  -- independent tests show 65-88% range
- [Why Perplexity and Burstiness Fail](https://www.pangram.com/blog/why-perplexity-and-burstiness-fail-to-detect-ai)
  -- structural critique of heuristic signals
- [PMC Academic AI Detection Study](https://pmc.ncbi.nlm.nih.gov/articles/PMC12331776/)
  -- Corrector FPR 30.4%, ZeroGPT 16% on pre-ChatGPT human articles
- [AI Detection False Positives Exposed](https://hastewire.com/blog/study-false-positives-in-ai-detectors-exposed)
  -- 15-45% FPR range across tools
- [Originality.ai AI Detection Studies Meta-Analysis](https://originality.ai/blog/ai-detection-studies-round-up)
  -- round-up of 13 independent studies
- [JISC AI Detection Update 2025](https://nationalcentreforai.jiscinvolve.org/wp/2025/06/24/ai-detection-assessment-2025/)
  -- Copyleaks 3% FPR as lowest

### IETF and Regulatory

- [IETF AI Content Disclosure Header Draft](https://www.ietf.org/archive/id/draft-abaris-aicdh-00.html)
  -- draft standard, trivially spoofable, expired Nov 2025
- [Tom's Hardware: IETF AI Header Proposal](https://www.tomshardware.com/tech-industry/artificial-intelligence/internet-standards-body-proposes-new-header-field-disclosing-ai-will-make-it-easier-for-machines-to-determine-if-ai-was-used-on-a-site)
  -- coverage of draft
- [EU AI Act Code of Practice on AI Content Marking](https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content)
  -- August 2026 enforcement date
- [Cooley: EU AI Act Watermarking Draft](https://www.cooley.com/news/insight/2025/2025-12-18-eu-ai-act-first-draft-code-of-practice-on-transparency-and-watermarking-released)
  -- multilayer approach confirmed

### Non-Article Extraction

- [rs-trafilatura DEV Community](https://dev.to/murroughfoley/rs-trafilatura-page-type-aware-web-content-extraction-in-rust-2ppf)
  -- primary source for per-type F1 table
- [rs-trafilatura GitHub](https://github.com/Murrough-Foley/rs-trafilatura) --
  F1=0.966 ScrapingHub, F1=0.860 across 1,502 mixed pages
- [Trafilatura Evaluation Docs](https://trafilatura.readthedocs.io/en/latest/evaluation.html)
  -- article-only benchmark baseline
- [Scrapinghub Article Extraction Benchmark](https://github.com/scrapinghub/article-extraction-benchmark)
  -- confirms article-only scope of standard benchmarks
- [Chuniversiteit Extraction Algorithm Comparison](https://chuniversiteit.nl/papers/comparison-of-web-content-extraction-algorithms)
  -- 14 extractors, 8 datasets, no page-type stratification
- [Firecrawl Scrape-Evals](https://www.firecrawl.dev/blog/introducing-scrape-evals)
  -- 1,000 URL benchmark covering SPAs, no per-type F1 published
