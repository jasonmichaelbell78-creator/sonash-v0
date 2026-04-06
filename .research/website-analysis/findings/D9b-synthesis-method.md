# Findings: Cross-Site Synthesis Methodology — How to Synthesize Insights Across Multiple Analyzed Websites

**Searcher:** deep-research-searcher **Profile:** web + academic **Date:**
2026-04-05 **Sub-Question IDs:** SQ9b

---

## Key Findings

### 1. Four Established Synthesis Paradigms Map Directly to Web Content Analysis [CONFIDENCE: HIGH]

Research synthesis literature (drawn from systematic review methodology, NLP,
and competitive intelligence) converges on four paradigms that translate
directly to cross-site web synthesis:

- **Thematic synthesis** (Thomas & Harden, 2008): Line-by-line coding of source
  content → descriptive themes → analytical themes. Strongest for hypothesis
  generation and revealing commonality. The explicit separation between
  data-driven descriptive themes and theory-driven analytical themes prevents
  conflating summarization with genuine synthesis.
- **Narrative synthesis**: Text-based, highly transparent for surfacing
  heterogeneity between sources. Better at revealing _differences_ than
  commonalities. Produces story-driven, connecting prose.
- **Matrix/comparative synthesis**: Sources as rows, evaluation dimensions as
  columns. Used by competitive analysis frameworks (Magic Quadrant, Forrester
  Wave) and UX benchmarking. Best for structured side-by-side comparison.
- **Meta-pattern extraction** (framework synthesis): Applies an a-priori
  framework to extract and chart findings — the synthetic product maps nature
  and range of a concept across sources. Used by scoping reviews to identify key
  concepts, theories, and gaps.

For creator-value extraction in cross-site mode, **thematic synthesis is the
primary workhorse**, with matrix synthesis as a complementary output structure.
Narrative synthesis is best for final presentation to humans.

Sources: [1], [2], [3], [4]

---

### 2. Google and Perplexity Demonstrate Proven Cross-Source Synthesis Pipelines [CONFIDENCE: HIGH]

Both Google AI Overviews and Perplexity Deep Research are deployed at scale and
represent the state of the art for automated cross-source synthesis.

**Google's Query Fan-Out pipeline** (confirmed 2025):

1. Query decomposition: 1 query → 8–12 parallel sub-queries across 8 variant
   types (equivalent, follow-up, generalization, canonicalization, translation,
   entailment, specification, clarification)
2. Iterative parallel execution: Each variant is searched, quality-scored, and
   evaluated by a control model
3. Cross-variant verification: Contradictions trigger additional follow-up
   variants to validate claims (if "X painted the Mona Lisa" gets no supporting
   follow-ups, it is flagged as incorrect)
4. Data fusion synthesis: Combines 5–15 sources into coherent narrative with
   inline citations, resolving conflicts and weaving perspectives
5. Output strategies: single-best-answer, multiple-perspectives, or
   composite-answer with confidence indicators

**Perplexity Deep Research pipeline** (confirmed 2025):

1. Hybrid retrieval: lexical + semantic indexing + vector embeddings
2. Multi-source reading: reads, analyzes, and compiles insights from dozens of
   sources
3. RAG-based synthesis: claims grounded in retrieved text, not model memory
4. Citation coupling: citations generated inline during generation (not
   post-processing)
5. Output: narrative summary integrating perspectives from multiple
   authoritative sources

**Key implication for `/website-analysis`**: The most effective cross-site
synthesis combines parallel source retrieval, thematic clustering, cross-source
verification of contradictions, and citation-coupled narrative output.

Sources: [5], [6], [7], [8]

---

### 3. Thematic Synthesis: A Three-Stage Process for Web Content [CONFIDENCE: HIGH]

The Thomas & Harden thematic synthesis method (widely validated in systematic
review literature) directly applies to web page analysis:

**Stage 1: Line-by-line coding** Each site's content is read and individual
observations are extracted as atomic "findings" (not page summaries). E.g.,
"Site A emphasizes peer support over professional therapy" is one finding.

**Stage 2: Descriptive themes** Related findings are grouped hierarchically into
themes that remain close to source content. One study produced 12 descriptive
themes from 36 initial codes. Theme names should be descriptive, not
interpretive.

**Stage 3: Analytical themes** An external framework (the review question, or
for `/website-analysis`: the "Creator View" questions about audience
understanding, problem framing, content gaps) is applied to generate
higher-order interpretations that "go beyond" individual sites. This is where
cross-site meta-patterns emerge.

**Critical principle**: Transparency in theme development is "central to the
method." The record of how themes evolved from individual site findings should
be traceable.

Sources: [2], [3]

---

### 4. Cross-Site Pattern Taxonomy: Four Signal Types to Surface [CONFIDENCE: HIGH]

Research synthesis literature (systematic reviews, competitive analysis,
multi-document NLP) converges on four distinct signal types that cross-site
synthesis should detect and surface:

| Signal Type     | Description                       | How to Detect                                                    | Significance                                           |
| --------------- | --------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Convergence** | Multiple sites agree on X         | Count sites making claim; score by source tier                   | Strong signal = well-established view in the ecosystem |
| **Divergence**  | Sites A and B disagree on X       | Compare claims on same dimension; flag when contradictory        | Interesting tension = contested or evolving space      |
| **Gap**         | No site addresses X               | Compare against expected dimensions; what's conspicuously absent | Opportunity or blind spot for the seed site            |
| **Trend**       | Movement from X to Y across sites | Compare sites by recency; look for direction in framing          | Ecosystem is shifting; early vs. late movers visible   |

A fifth signal worth surfacing is **best-of-breed**: "Site C's approach to X is
the strongest implementation." This requires evaluating each site against
dimensions, then ranking.

**Signal weighting**: Convergence from original-research sites carries more
weight than convergence from aggregator/hub sites. A finding stated
independently by 3 original-source sites outweighs the same finding echoed by 8
aggregators.

Sources: [1], [9], [10], [11]

---

### 5. Parallel Analysis is Preferred Over Sequential for Cross-Site Synthesis [CONFIDENCE: MEDIUM-HIGH]

Research synthesis design literature distinguishes convergent (parallel) from
sequential synthesis designs:

- **Convergent/parallel design**: All sources analyzed simultaneously,
  integration occurs at interpretation stage. Used in ~17% of systematic
  reviews. Less susceptible to order effects and anchoring bias. Preferred when
  sources are heterogeneous and independence of analysis is important.
- **Sequential design**: Each source's findings inform analysis of the next.
  Used in <5% of systematic reviews. Risk of anchoring (first source shapes all
  subsequent interpretation).

**Recommendation for `/website-analysis`**: Analyze all N sites in parallel
(extract findings from each independently) before integrating. Integration phase
should be the only place where cross-site comparison occurs. This prevents the
first site analyzed from unduly anchoring interpretation of subsequent sites.

**Exception**: When the seed page is a known authority (original research,
primary source), it can establish the analytical framework that later sites are
evaluated against — a legitimate a-priori framework, not anchoring.

Sources: [12], [13]

---

### 6. Optimal Site Count: 5–12 for Meaningful Synthesis, With Saturation as the Stopping Rule [CONFIDENCE: MEDIUM]

Multiple research traditions converge on guidance about sample size for
synthesis:

- **Meta-analysis**: Meaningful results achievable with as few as 5 studies; 83%
  of confidence intervals stabilize around the final estimate after 5 studies.
  6–10 studies recommended for reliable continuous-variable conclusions.
- **Qualitative saturation**: Data saturation typically reached within 9–17
  interviews for homogeneous populations. For heterogeneous sources (typical in
  web analysis), saturation requires more sources. The rule is: stop when new
  sources stop producing new themes.
- **Competitive analysis practice**: Most frameworks analyze 5–10 direct
  competitors. Beyond 10, marginal insight drops sharply for comparable domains.
- **Practical upper bound**: The 2025 Research Synthesis Report found 65% of
  practitioners complete projects in 1–5 days; manual synthesis of >15 sources
  becomes unwieldy without tooling.

**Recommended heuristic for `/website-analysis`**:

- Minimum meaningful: 5 sites
- Sweet spot: 7–12 sites
- Maximum before diminishing returns: ~15 sites (for comparable domain)
- Use thematic saturation as the dynamic stopping rule: stop adding sites when 3
  consecutive new sites produce no new descriptive themes

Sources: [14], [15], [16], [17]

---

### 7. Redundancy Handling: Acknowledge, Collapse, but Don't Silently Drop [CONFIDENCE: MEDIUM-HIGH]

When multiple sites say the same thing, the redundancy itself is the signal — it
indicates convergence and should be _counted_, not eliminated:

- **For synthesis**: Collapse redundant claims into one descriptive theme, but
  record site count. "6 of 8 sites emphasize peer support" is more informative
  than just "sites emphasize peer support."
- **For deduplication**: Sites that are clearly mirrors, syndicators, or copies
  of another site should be flagged and downweighted rather than silently
  removed. The fact that content is widely mirrored is itself evidence of its
  importance.
- **For source weighting**: Original research > summary > aggregation. A finding
  on an aggregator site that links back to a primary source should be attributed
  to the primary source in the synthesis, with the aggregator noted as
  distribution evidence.

The systematic review literature recommends transparency: track how many sources
were collapsed and why, analogous to PRISMA's "deduplication" step with counts.

Sources: [3], [17], [18]

---

### 8. Contradiction Detection: Surface Don't Resolve, Typed by Severity [CONFIDENCE: MEDIUM]

Cross-document contradiction detection is an active NLP research problem. Key
findings from 2024 research:

- **Pair contradictions** are most detectable (83–89% accuracy) — direct
  conflict between two sites on the same claim
- **Self-contradictions** (within a site) are hardest to detect (0.6–45%
  accuracy)
- **Conditional contradictions** (a third source makes two others mutually
  exclusive) require the most sophisticated detection

Three contradiction types mapped to web synthesis:

1. **Factual contradictions**: Site A says X; Site B says not-X (most common,
   detectable)
2. **Emphasis contradictions**: Site A leads with X; Site B treats X as
   secondary (framing conflict)
3. **Framework contradictions**: Sites use incompatible mental models of the
   same domain

**Recommendation**: Surface contradictions explicitly with their type. Do not
silently resolve. The synthesizer output should state: "Sites A and B present
contradictory views on X [factual/framing/framework contradiction]. Site A
argues [claim 1]. Site B argues [claim 2]. No consensus exists."

The RAG-based approach for resolution: generate follow-up queries that would
only be answerable if one side is correct; lack of evidence for one claim's
implications weakens it.

Sources: [19], [20]

---

### 9. Source Authority Weighting for Web Content [CONFIDENCE: MEDIUM-HIGH]

Drawing from systematic review evidence hierarchies and competitive analysis
practice, a tiered weighting system for cross-site synthesis:

| Source Tier                       | Examples                                                                     | Weight |
| --------------------------------- | ---------------------------------------------------------------------------- | ------ |
| **T1: Original research/primary** | Academic papers, original datasets, primary studies, firsthand reports       | 3x     |
| **T2: Expert synthesis**          | Established frameworks, methodologies, expert commentary with cited evidence | 2x     |
| **T3: Quality aggregation**       | Curated resource hubs, well-maintained directories, reputable roundups       | 1x     |
| **T4: Secondary aggregation**     | Lists-of-lists, mirror content, syndicated articles                          | 0.5x   |

In practice for `/website-analysis`: when detecting convergence, weight T1+T2
sources heavily. "3 T1 sites agree on X" is a stronger signal than "10 T3/T4
sites agree on X."

Sources: [1], [9], [21]

---

### 10. Synthesis Output Structure Recommendation for Creator View Integration [CONFIDENCE: MEDIUM]

Based on competitive analysis practice, systematic review output structures, and
research on what synthesis outputs are most actionable:

**Recommended output structure for cross-site synthesis mode:**

```
## Cross-Site Synthesis: [Domain/Topic]
### Scope
- N sites analyzed | Domain: [X] | Analysis date: [date]
- Source tier distribution: T1:[n] T2:[n] T3:[n] T4:[n]

### Convergence Signals (Strong)
[Theme]: [N of M sites] agree. Key evidence: [quote/claim from T1 source].

### Divergence Signals (Contested)
[Dimension]: [Site A] and [Site B] disagree. [Site A] argues [X]; [Site B] argues [Y].
Implication for seed site: [what this means for positioning]

### Landscape Gaps
[Topic X]: No site covers this. Represents opportunity or shared blind spot.

### Trend Signals
[Framing shift]: Earlier sites use [X framing]; more recent sites use [Y framing].

### Best-of-Breed
[Site N] has the strongest approach to [dimension]: [what makes it exemplary].

### Creator View: What the Ecosystem Collectively Understands
[2-3 analytical themes that go beyond individual sites — what this ecosystem of
sites collectively reveals about the domain's problems, opportunities, and blind spots]

### Creator View: What No Site Understands Yet
[Gaps where the whole ecosystem has a shared blind spot]
```

**Why theme-based rather than source-based**: Organizing by theme (not by site)
is confirmed by both competitive analysis practice and thematic synthesis
research to be more revealing of commonality and patterns. Source-by-source
organization produces summaries; theme-based organization produces synthesis.

**Creator View integration**: Cross-site synthesis should produce its _own_
Creator View section focused on the ecosystem, separate from the seed site's
individual Creator View. The seed site's Creator View answers "What does this
site understand?" The ecosystem Creator View answers "What does this _space_
understand — and what does no one understand yet?" This is the highest-value
output for a creator seeking positioning opportunities.

Sources: [1], [3], [4], [22], [23]

---

### 11. Affinity Mapping as the Core Synthesis Mechanism [CONFIDENCE: MEDIUM-HIGH]

The 2025 Research Synthesis Report found affinity mapping is used by 48.3% of
practitioners as the primary synthesis technique. It directly supports
cross-site synthesis:

**5-step affinity mapping adapted for web synthesis:**

1. **Extract**: Pull individual observations from each site as discrete atomic
   claims (not summaries)
2. **Cluster**: Group related claims by identifying semantic similarity; name
   clusters as emerging themes
3. **Iterate**: Cycle through 2–3 rounds; first groupings are rarely optimal;
   themes clarify with iteration
4. **Filter by dimension**: Re-run clustering filtered by sub-topic to find
   segment-specific patterns
5. **Zoom out**: Examine how clusters relate to each other; identify
   dependencies and hierarchies between themes

**Tooling implication**: This process maps naturally to an LLM task: given N
site extractions, cluster claims semantically, name themes, then run a second
pass filtered by dimension. Output themes in order of site-count (convergence
strength).

Sources: [22], [24]

---

## Sources

| #   | URL                                                                                                                | Title                                                                            | Type                      | Trust       | CRAAP | Date |
| --- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------- | ----------- | ----- | ---- |
| 1   | https://pmc.ncbi.nlm.nih.gov/articles/PMC5690272/                                                                  | What Synthesis Methodology Should I Use? A Review and Analysis                   | Academic / PMC            | HIGH        | 4.2/5 | 2017 |
| 2   | https://pmc.ncbi.nlm.nih.gov/articles/PMC2478656/                                                                  | Methods for the Thematic Synthesis of Qualitative Research in Systematic Reviews | Academic / PMC            | HIGH        | 4.5/5 | 2008 |
| 3   | https://link.springer.com/article/10.1186/1471-2288-8-45                                                           | Methods for the thematic synthesis of qualitative research                       | Academic / Springer       | HIGH        | 4.5/5 | 2008 |
| 4   | https://systematicreviewmethods.github.io/synthesis2.html                                                          | Synthesis: Narrative, Quantitative and Qualitative Methods                       | Academic course material  | MEDIUM      | 3.5/5 | 2023 |
| 5   | https://dejan.ai/blog/googles-query-fan-out-system-a-technical-overview/                                           | Google's Query Fan-Out System: Technical Overview                                | Industry analysis         | MEDIUM-HIGH | 3.8/5 | 2025 |
| 6   | https://www.frugaltesting.com/blog/behind-perplexitys-architecture-how-ai-search-handles-real-time-web-data        | Behind Perplexity's Architecture: How AI Search Handles Real-Time Web Data       | Industry analysis         | MEDIUM      | 3.5/5 | 2024 |
| 7   | https://whitepeak.io/how-googles-ai-overviews-select-sources/                                                      | How Google's AI Overviews Select Sources                                         | Industry analysis         | MEDIUM      | 3.5/5 | 2025 |
| 8   | https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research                                            | Introducing Perplexity Deep Research                                             | Official product blog     | HIGH        | 4.2/5 | 2024 |
| 9   | https://storychief.io/blog/competitive-content-analysis                                                            | Competitive Content Analysis: Ultimate 2025 Guide                                | Industry practice         | MEDIUM      | 3.5/5 | 2025 |
| 10  | https://amplyfi.com/blog/competitor-analysis-matrix-for-market-positioning/                                        | Competitor Analysis Matrix for Market Positioning                                | Industry practice         | MEDIUM      | 3.3/5 | 2024 |
| 11  | https://resources.nu.edu/researchtools/synthesisandanalysis                                                        | Literature Review: Synthesis and Analysis                                        | Academic library          | MEDIUM-HIGH | 3.8/5 | 2024 |
| 12  | https://link.springer.com/article/10.1186/s13643-017-0454-2                                                        | Convergent and Sequential Synthesis Designs                                      | Academic / Springer       | HIGH        | 4.3/5 | 2017 |
| 13  | https://pmc.ncbi.nlm.nih.gov/articles/PMC5364694/                                                                  | Convergent and sequential synthesis designs (PMC)                                | Academic / PMC            | HIGH        | 4.3/5 | 2017 |
| 14  | https://www.researchgate.net/post/Is-there-any-minimum-number-for-studies-that-should-be-included-in-meta-analysis | Minimum number of studies for meta-analysis                                      | Academic forum            | MEDIUM      | 3.2/5 | 2023 |
| 15  | https://pmc.ncbi.nlm.nih.gov/articles/PMC5993836/                                                                  | Saturation in Qualitative Research                                               | Academic / PMC            | HIGH        | 4.2/5 | 2018 |
| 16  | https://www.lyssna.com/reports/research-synthesis/                                                                 | Research Synthesis Report 2025                                                   | Industry survey (n=300)   | MEDIUM-HIGH | 3.9/5 | 2025 |
| 17  | https://pmc.ncbi.nlm.nih.gov/articles/PMC3609745/                                                                  | Impact of Study Size on Meta-Analyses                                            | Academic / PMC            | HIGH        | 4.4/5 | 2013 |
| 18  | https://guides.lib.utexas.edu/c.php?g=1062764&p=10128018                                                           | Deduplication in Systematic Reviews                                              | Academic library          | MEDIUM-HIGH | 3.8/5 | 2024 |
| 19  | https://arxiv.org/html/2504.00180v1                                                                                | Contradiction Detection in RAG Systems                                           | Academic preprint / arXiv | MEDIUM-HIGH | 4.0/5 | 2025 |
| 20  | https://aclanthology.org/2024.naacl-long.362/                                                                      | ContraDoc: Self-Contradictions in Documents                                      | Academic / ACL            | HIGH        | 4.3/5 | 2024 |
| 21  | https://research.com/research/primary-research-vs-secondary-research                                               | Primary vs Secondary Research                                                    | Educational resource      | MEDIUM      | 3.2/5 | 2024 |
| 22  | https://www.userinterviews.com/blog/affinity-mapping-ux-research-data-synthesis                                    | Affinity Mapping: How to Synthesize UX Research Data                             | Industry practice         | MEDIUM-HIGH | 3.8/5 | 2024 |
| 23  | https://contadu.com/competitor-content-analysis-the-expert-framework-to-win/                                       | Competitor Content Analysis Expert Framework                                     | Industry practice         | MEDIUM      | 3.3/5 | 2025 |
| 24  | https://www.nngroup.com/articles/affinity-diagram/                                                                 | Affinity Diagramming: Collaboratively Sort UX Findings                           | Industry practice (NN/g)  | HIGH        | 4.2/5 | 2024 |

---

## Contradictions

### Contradiction 1: Thematic vs. Narrative Synthesis Primacy

- **Thematic synthesis research** (Thomas & Harden, Sources [2][3]) argues
  thematic synthesis is better at revealing commonality: "organising according
  to themes is comparatively more successful in revealing commonality."
- **Narrative synthesis literature** (Source [4]) argues narrative synthesis is
  better at making heterogeneity transparent: "textual narrative synthesis is
  more likely to make transparent heterogeneity between studies."
- **Resolution for `/website-analysis`**: Both are correct for different
  purposes. Use thematic synthesis for identifying convergence; use narrative
  synthesis for the final human-readable output where heterogeneity and nuance
  need to be communicated.

### Contradiction 2: Parallel vs. Sequential Contradiction Resolution

- **Google's fan-out system** (Source [5]) uses iterative sequential
  verification — when a contradiction is detected, follow-up queries are issued
  sequentially to validate claims.
- **Synthesis design research** (Sources [12][13]) recommends parallel analysis
  to prevent anchoring bias.
- **Resolution**: These address different phases. Parallel analysis is for
  initial extraction (no anchoring). Sequential verification is appropriate for
  the contradiction-resolution phase specifically (checking which of two
  contradictory claims holds up).

### Contradiction 3: Minimum Source Count

- **Meta-analysis research** (Source [14]) suggests 5–10 studies is the minimum
  for reliable results.
- **Qualitative saturation research** (Source [15]) uses saturation (not count)
  as the stopping rule — sometimes 9–17 sources, sometimes more or fewer.
- **Resolution**: Use saturation as the decision rule, but treat 5 sites as a
  practical floor below which synthesis outputs should be labeled as
  provisional.

---

## Gaps

1. **No established methodology specifically for web content cross-site
   synthesis**: All identified frameworks are adapted from academic systematic
   review methodology, NLP research, or competitive analysis practice. No
   published framework addresses the specific case of synthesizing across linked
   web pages from an awesome-list or resource hub context.

2. **Contradiction resolution strategies remain underdeveloped**: The 2024 RAG
   contradiction detection paper explicitly names resolution as future work. No
   current framework provides a systematic resolution algorithm beyond "generate
   follow-up queries."

3. **Source tier weighting is practice-based, not empirically validated**: The
   tiered weighting system (T1 original research > T2 expert synthesis > T3
   aggregation) is drawn from systematic review evidence hierarchies and
   industry practice, but no study has validated this weighting for web content
   cross-site synthesis specifically.

4. **Creator View integration with cross-site synthesis is novel**: The concept
   of generating an "ecosystem Creator View" (what the _space_ collectively
   understands, not just what individual sites understand) has no prior art. The
   methodology proposed here is an original synthesis of existing approaches,
   not a direct application of any documented method.

5. **Optimal N for heterogeneous web domains is unknown**: The 5–12 site
   recommendation is drawn from adjacent domains (meta-analysis, competitive
   analysis). The specific saturation point for web content analysis across
   diverse linked sites has not been studied.

---

## Serendipity

1. **Google's contradiction resolution mechanism (cross-variant verification) is
   directly implementable**: The fan-out approach of generating follow-up
   queries that would only be answerable if a claim is true — and treating lack
   of supporting evidence as disconfirmation — is a practical, implementable
   algorithm for contradiction resolution in `/website-analysis`. Not just a
   description of what Google does; a concrete method to adopt.

2. **Thematic saturation as a stopping rule is more principled than a fixed
   count**: For the `/website-analysis` skill, implementing a saturation
   detector ("stop adding sites when 3 consecutive sites produce zero new
   themes") would make the cross-site synthesis adaptive rather than arbitrary.
   This is methodologically sound and more computationally efficient than always
   analyzing a fixed N.

3. **The 2025 Research Synthesis Report confirms AI excels at pattern
   identification but practitioners reserve strategic interpretation for
   humans**: 61% use AI for theme/pattern identification; only 47.6% trust AI
   for translating insights to recommendations. This aligns perfectly with the
   `/website-analysis` skill's design: AI identifies patterns, Creator View
   requires human-level strategic interpretation framing but can be AI-generated
   if structured carefully.

4. **PRISMA-trAIce (2025)**: A new extension to PRISMA specifically for
   reporting when AI is used in systematic literature reviews. This suggests the
   research community has accepted AI-assisted synthesis as legitimate, and its
   transparency requirements (what AI did, what humans validated) are relevant
   to how `/website-analysis` should report its cross-site synthesis.

5. **Affinity mapping's "zoom out" step is the key structural move**: The
   instruction to "zoom out at the end of the process to see how the different
   clusters relate to each other" is the mechanism that transforms a list of
   themes into a genuine ecosystem view. For `/website-analysis`, this suggests
   the final synthesis step should explicitly examine inter-theme relationships,
   not just list themes.

---

## Confidence Assessment

- **HIGH claims**: 5 (synthesis paradigm taxonomy; Google/Perplexity pipeline
  detail; thematic synthesis three-stage process;
  convergence/divergence/gap/trend taxonomy; parallel vs. sequential design
  recommendation)
- **MEDIUM-HIGH claims**: 4 (source authority weighting; contradiction detection
  typed by severity; affinity mapping mechanism; output structure
  recommendation)
- **MEDIUM claims**: 2 (optimal site count 5–12; creator view integration
  approach)
- **LOW claims**: 0
- **UNVERIFIED claims**: 0

**Overall confidence: MEDIUM-HIGH**

The core methodology (thematic synthesis + matrix output + parallel analysis +
saturation stopping rule) is well-supported by multiple independent academic and
industry sources. The specific application to web content cross-site synthesis
and the Creator View integration proposal are original extrapolations from
established methods — well-grounded but not directly validated in the specific
context of linked-site analysis.
