# Gap Agent B: PDF/Document + Image/OCR Cluster

**Generated:** 2026-04-07 | **Cluster:** B (marker, surya, tesseract, MinerU)
**Status:** Complete | **Feeds:** T28 Unified Content Intelligence brainstorm

---

## 1. What did Cluster B add that Cluster A didn't cover?

### Four new architectural patterns

**Pattern 1: LLM hybrid extraction (marker).** Cluster A tools treat extraction
as a deterministic pipeline -- parse the format, produce elements. Marker breaks
this by inserting LLM reasoning _during_ extraction, not after. Cross-page table
merging, form value extraction, and inline math are solved by sending ambiguous
regions to Gemini/Ollama and incorporating the LLM's response into the
extraction output.

This is architecturally significant for T28 because it reframes the
extraction-vs-analysis boundary. In Cluster A, extraction produces raw elements,
and analysis interprets them. Marker says: some "analysis" must happen at
extraction time because the parser alone cannot resolve ambiguity. T28's
extraction layer cannot be purely mechanical -- it needs LLM augmentation points
at the source type level, especially for complex documents.

**Pattern 2: Async task API (MinerU).** POST a document, get a task ID, poll for
status, retrieve results. This is the first time any analyzed repo has a
resumable extraction interface. Cluster A repos are all synchronous: call a
function, get a result. MinerU's async pattern directly addresses the
"progressive/resumable extraction" gap that Gap Agent A identified.

However, it is important to understand what MinerU's async API actually
provides: it is _restartable_ (submit again if it fails), not _resumable_ (pick
up from page 37 of 200). A task either succeeds or fails. True progressive
extraction -- extract pages 1-50 now, pages 51-100 later, with a coherent merged
output -- remains unsolved.

**Pattern 3: Three-backend strategy (MinerU).** Pipeline engine (fast, no
hallucination, CPU-capable), VLM engine (high accuracy via vLLM/LMDeploy), and
hybrid engine (native text + VLM fallback for complex pages). This maps directly
to the Quick/Standard/Deep depth model that T28 already uses in repo-analysis
and website-analysis.

The lesson: depth tiers should not just control how much analysis you do -- they
should control which extraction backend you invoke. Quick scan uses fast/CPU
parsing. Deep scan uses VLM. This is a different framing from Cluster A, where
unstructured's strategy selection (AUTO/FAST/HI_RES) feels more like a quality
toggle than an architectural tier switch.

**Pattern 4: Router for multi-service load balancing (MinerU).** mineru-router
provides a unified API that distributes extraction tasks across multiple GPU
workers. This is a deployment pattern, not an architecture pattern, but it
signals something T28 must consider: if extraction backends are heterogeneous
(some need GPU, some need network, some need only CPU), T28 needs resource-aware
task routing, not just source-type routing.

### Two confirmations from Cluster A

**surya and tesseract add no new patterns.** Surya's layout/OCR models are
already represented by docling's analysis. Tesseract is a foundational backend
used by both unstructured and docling. Neither repo contributes new
architectural thinking for T28.

---

## 2. Does Cluster B change any Cluster A gap assessments?

### Gap A Q5 (Progressive/resumable extraction): Partially addressed, not closed

MinerU's async task API proves the pattern is implementable and that at least
one major project considers it important. But the gap is only partially
addressed:

- **Restartable:** Yes. If extraction fails, re-submit. MinerU proves this.
- **Resumable (partial results):** No. No repo in either cluster supports
  extracting the first half of a document, storing intermediate state, and
  continuing later.
- **Incremental (delta extraction):** No. No repo supports "what changed since
  last extraction."

T28's needs are closer to "incremental" (re-analyze a repo after new commits,
re-crawl a site after 30 days). MinerU's async API is a useful deployment
pattern but does not solve T28's core resumability problem.

**Updated assessment:** Gap A Q5 remains open. Downgrade from "no prior art" to
"partial prior art (restartable only)."

### Gap A Q1 (Output schema): Cluster B reinforces Option C (thin core + extensions)

Marker outputs markdown + JSON. MinerU outputs markdown + structured JSON.
Neither produces tree-structured document objects like docling. This strengthens
the case that document extraction tools are converging on
markdown-as-interchange-format for the text layer, with structured metadata
sidecar for machine consumption.

For T28, this suggests the "text representation" field in the thin core schema
should be markdown, not plain text. Markdown preserves heading hierarchy, table
structure, code blocks, and emphasis without requiring a custom tree schema.

**Updated assessment:** Gap A Q1 gains a concrete recommendation. The brainstorm
should evaluate markdown-as-canonical-text-representation.

### Gap A Q4 (Extraction confidence): Still completely open

Neither marker nor MinerU surface per-element confidence scores. Marker's LLM
hybrid mode inherently introduces variable confidence (the LLM might hallucinate
a table cell value), but this confidence is not propagated to the output. This
gap is worse than Cluster A suggested, because LLM-augmented extraction
introduces a new source of uncertainty that traditional parsing does not have.

**Updated assessment:** Gap A Q4 is now more urgent. LLM hybrid extraction makes
confidence scoring mandatory, not optional.

### Gap A Q7 (The 80/20 question): Cluster B provides evidence for "yes, unified is viable"

The fact that 5 independent PDF parsing tools (unstructured, docling, marker,
surya/tesseract as backend, MinerU) all converge on the same high-level
architecture (parse format -> detect layout -> extract elements -> produce
output) suggests that the extraction layer IS unifiable. The divergence is in
implementation quality and edge case handling, not in architecture.

But this applies to the extraction layer only. The analysis layer remains
unaddressed by any Cluster B repo, and the synthesis layer has zero prior art
anywhere.

**Updated assessment:** Gap A Q7 should be split. Extraction: unified is viable,
the pattern is converging. Analysis: unified is questionable. Synthesis: no data
to assess.

---

## 3. What would break if T28 tried to use these tools as backends?

### License constraints are the biggest barrier

| Tool                     | License    | T28 impact                                                                                                          |
| ------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| marker                   | GPL-3.0    | Cannot use as a library in T28 without GPL-licensing T28. Pattern is transferable but code is not.                  |
| surya                    | GPL-3.0    | Same as marker. Cannot bundle.                                                                                      |
| MinerU                   | AGPL-3.0   | Worse than GPL. Even running as a service requires AGPL compliance for any code interacting with it over a network. |
| tesseract                | Apache-2.0 | No constraint. Can use freely.                                                                                      |
| unstructured (Cluster A) | Apache-2.0 | No constraint.                                                                                                      |
| docling (Cluster A)      | MIT        | No constraint.                                                                                                      |

**Practical implication:** T28 can directly use unstructured, docling, and
tesseract as extraction backends. Marker and MinerU must be accessed as external
services with clean API boundaries (no code linking), or T28 must adopt their
patterns without their code. The marker LLM hybrid pattern and MinerU async task
pattern are both transferable without code dependency.

### Model dependencies create operational complexity

- **marker:** Requires surya models (layout, OCR) + optional Gemini API key or
  local Ollama. GPU recommended for batch processing.
- **surya:** Requires downloading 4 ML models (~2GB total). GPU strongly
  recommended.
- **MinerU:** Three engine modes each require different model stacks. VLM engine
  needs vLLM or LMDeploy with a vision-language model. Full setup is heavy.

T28 should not require GPU infrastructure or multi-GB model downloads for basic
extraction. The depth tier model helps here: Quick scan uses lightweight
backends (docling, tesseract), Deep scan optionally uses model-heavy backends if
available.

### Integration surface is narrower than expected

Despite MinerU's MCP server and LangChain/LlamaIndex integrations, the actual
integration point for all these tools is simple: input file path, output
markdown + metadata JSON. The complex internal architectures (surya's 4-model
pipeline, MinerU's three engines) are implementation details hidden behind this
simple interface. T28's extraction adapter layer needs to handle:

1. File path in
2. Markdown + metadata out
3. Error/timeout handling
4. Optional progress reporting

This is manageable. The complexity is inside the backends, not at the
integration boundary.

---

## 4. What's the architectural lesson from seeing 5 PDF parsing tools?

### Convergence: the extraction pipeline pattern is settled

All 5 tools follow the same high-level architecture:

```
Input document
  -> Format detection / page decomposition
  -> Layout analysis (identify regions: text, table, figure, heading)
  -> Per-region extraction (OCR for images, parser for native text)
  -> Reassembly into reading order
  -> Output as markdown/JSON/structured document
```

The differences are in:

- **Layout analysis quality** (surya's ML models vs tesseract's heuristics)
- **Edge case handling** (marker's LLM augmentation vs docling's rule-based)
- **Output format** (docling's tree vs marker's flat markdown)
- **Deployment model** (MinerU's async API vs marker's batch CLI)

None of these differences are architectural. They are quality, strategy, and
operational choices within the same architecture.

### Divergence: the LLM boundary is where tools differentiate

The meaningful divergence is where each tool draws the line between "traditional
parsing" and "LLM reasoning":

- **tesseract:** 100% traditional. No LLM.
- **unstructured:** Traditional + optional LLM for chunking/summarization
  (post-extraction).
- **docling:** Traditional + ML models for layout. No LLM augmentation.
- **marker:** Traditional + LLM for ambiguity resolution _during_ extraction.
- **MinerU:** Traditional + VLM as an alternative extraction engine (not
  augmentation, replacement).

This spectrum is exactly the design space T28 must navigate. The brainstorm must
decide where T28's extraction layer sits on this spectrum for each source type.
Some source types (code repos, APIs) need no LLM at extraction time. Others
(complex PDFs, handwritten documents) likely need marker-style LLM augmentation.
Still others (images, screenshots) may need MinerU-style VLM replacement.

### The meta-lesson: extraction is a solved problem, analysis is not

Five mature tools with 73K-58K stars all solving the same extraction problem.
The community has converged. Extraction quality will only improve incrementally.

Not one of these tools does analysis. Not one tells you what the document
_means_, how it relates to other documents, whether its claims are trustworthy,
or what you should do with the information. That is T28's actual opportunity.
The brainstorm should spend 80% of its time on the analysis and synthesis
layers, not on extraction. Extraction is a pluggable backend; analysis is the
product.

---

## 5. Updated open questions for brainstorm

Revised from Gap Agent A's 7 questions, incorporating Cluster B findings.

### Q1 (REVISED): Output schema -- markdown as canonical text representation?

Gap Agent A framed this as thin-core vs schema-families vs universal. Cluster B
narrows it: both marker and MinerU converge on markdown + metadata JSON. This
suggests the thin core should use markdown (not plain text) as the canonical
text representation.

**Brainstorm question:** Is markdown sufficient as the text interchange format
for all 28 source types? What breaks? (Audio transcripts have no markdown
structure. Code repos are already code, not markdown descriptions of code.
Tweets are too short for markdown to matter.)

### Q2 (UNCHANGED): URL classification and routing

Cluster B adds nothing here. Still no prior art for routing
`https://arxiv.org/abs/...` to an academic paper extractor vs a web page
extractor.

### Q3 (UNCHANGED): Cross-source synthesis primitives

Cluster B adds nothing here. Still zero prior art.

### Q4 (ESCALATED): Extraction confidence is mandatory, not optional

LLM hybrid extraction (marker) and VLM extraction (MinerU) introduce new
uncertainty sources that traditional parsing does not have. An LLM might
hallucinate a table cell value. A VLM might misread a diagram. If T28 uses these
patterns, it must propagate confidence scores. No analyzed repo does this.

**Brainstorm question:** Should T28 invent per-element confidence scoring? What
is the schema? (e.g.,
`{confidence: 0.0-1.0, method: "ocr"|"vlm"|"llm"|"native", degradation_reason?: string}`)

### Q5 (REVISED): Progressive extraction -- restartable is solved, resumable is not

MinerU proves restartable extraction (submit, fail, re-submit). But T28 needs
incremental extraction (what changed since last run) and partial extraction
(extract pages 1-50 now, 51-100 later). These remain unsolved.

**Brainstorm question:** Does T28 actually need incremental extraction for
documents? Documents are static files -- you extract once. Incremental matters
for repos (new commits) and websites (new content). Should resumability be
per-source-type rather than universal?

### Q6 (UNCHANGED): Hierarchy preservation threshold

When is tree structure necessary vs wasteful? Cluster B does not change this
question.

### Q7 (SPLIT): Extraction is unifiable; analysis unification is the real question

Cluster B proves extraction is architecturally converged across 5 tools.
Unification at the extraction layer is viable and well-understood.

The brainstorm question is no longer "is unified extraction viable?" It is:
**What does a unified analysis layer look like when extraction is pluggable?**
If extraction is a solved interface (file in, markdown+metadata out), what does
the analysis layer receive, and what does it produce?

### Q8 (NEW): Where does LLM reasoning belong in the pipeline?

Marker puts LLM at extraction time. Unstructured puts it at chunking time.
MinerU offers it as an alternative engine. T28's existing skills put it at
analysis time (phases 3-4 of repo-analysis and website-analysis).

**Brainstorm question:** Should T28 have fixed LLM injection points, or should
each source type decide where LLM reasoning applies? This is a flexibility vs
consistency trade-off.

### Q9 (NEW): Depth tiers should control extraction backend selection

MinerU's three engines (pipeline/vlm/hybrid) map to quality tiers. This pattern
should be explicit in T28: Quick scan uses fast/CPU extraction, Deep scan uses
model-heavy extraction with LLM augmentation.

**Brainstorm question:** Does depth tier selection happen at the T28 level (one
tier for the whole extraction) or per-source-type (Quick for the PDF but Deep
for the embedded images)?

---

## Summary for brainstorm consumption

**Cluster B's contribution in one sentence:** Extraction is a solved, converging
problem -- T28 should treat it as a pluggable backend layer and spend its design
energy on the analysis and synthesis layers that no existing tool addresses.

**Three things the brainstorm must resolve from Cluster B:**

1. Markdown as canonical text representation (convergence signal from marker +
   MinerU)
2. Confidence scoring for LLM-augmented extraction (no prior art, but now
   mandatory)
3. Where LLM reasoning belongs in the pipeline (extraction-time vs analysis-time
   vs configurable)

**Two things the brainstorm can skip because Cluster B settled them:**

1. Whether extraction is architecturally unifiable (yes, it is, 5 tools prove
   it)
2. Whether the extraction interface is complex (no -- file in, markdown +
   metadata out)
