# Gap Agent C: Web Crawling Cluster

**Generated:** 2026-04-07 | **Cluster:** C (firecrawl, crawl4ai) **Status:**
Complete | **Feeds:** T28 Unified Content Intelligence brainstorm

---

## 1. What did Cluster C add that Clusters A+B didn't?

### Four new architectural patterns

**Pattern 1: AI-driven extraction paradigm (firecrawl Interact/Agent).** Every
repo in Clusters A and B follows the same model: you specify _what to parse_ and
_how to parse it_. Firecrawl introduces a fundamentally different model with its
Agent endpoint: you describe _what you want_, and the system autonomously
navigates, interacts with, and extracts data from web pages to satisfy your
request.

This is not extraction -- it is goal-directed data gathering. The Interact
endpoint is the intermediate step: scrape a page, then interact with it via AI
prompts or code before extracting. The Agent endpoint goes further: fully
autonomous, multi-page, describe-what-you-need gathering.

For T28, this means the extraction layer cannot be purely "input in, content
out." Some source types (especially web) benefit from an agent-like extraction
model where the extractor navigates, filters, and selects content based on the
user's intent. This is a third extraction paradigm beyond Cluster A's
"parse-this-file" and Cluster B's "parse-with-LLM-augmentation."

**Pattern 2: URL discovery/classification at scale (firecrawl Map).** Gap Agent
A identified URL classification/routing as a hard unsolved problem (Q2).
Firecrawl's Map endpoint partially addresses this: given a domain, it instantly
discovers all URLs on the site and can classify them. This is not full URL
classification (it does not distinguish arxiv paper URLs from generic web pages
across the open web), but it solves the site-scope URL discovery problem that
T28 needs for website-type sources.

The Map endpoint returns a site's URL structure without fetching/parsing every
page. This is analogous to `git ls-files` for repos -- understand the structure
before deciding what to extract. T28 could use a similar pre-extraction
discovery phase for web sources.

**Pattern 3: Crash recovery with state callbacks (crawl4ai).** MinerU's async
API in Cluster B provides restartable extraction (re-submit on failure).
Crawl4ai goes further with `resume_state` + `on_state_change` callbacks that
enable true mid-crawl recovery. If a 500-page deep crawl fails at page 237, it
resumes from page 237, not from scratch.

This is the first real prior art for progressive/resumable extraction across all
three clusters. It is specific to web crawling (the "state" is the crawl
frontier -- which URLs have been visited), but the pattern (checkpoint state +
resume from checkpoint) is transferable to any long-running extraction task.

**Pattern 4: Anti-bot operational hardening (crawl4ai).** Three-tier bot
detection with automatic proxy escalation, Shadow DOM flattening, consent popup
removal. Clusters A and B deal with static files or controlled API endpoints.
Web crawling operates in an adversarial environment where the source actively
resists extraction. This is a fundamentally different operational model.

For T28, this means web source types need an operational resilience layer that
document/code source types do not. Rate limiting, proxy management, bot
detection evasion, and JavaScript rendering are all web-specific concerns that
live below the extraction interface but must be configurable from T28's
orchestration layer.

### One confirmation, one surprise

**Confirmation:** Both repos output markdown for LLM consumption, reinforcing
Cluster B's convergence signal. Firecrawl explicitly offers markdown as a
primary output format. Crawl4ai is described as "LLM Friendly" -- markdown
output is the default. This is now a signal from 4+ independent repos across all
three clusters.

**Surprise:** Crawl4ai includes LLM extraction with natural language questions
("Extract all product prices from this page"). This is similar to firecrawl's
Agent paradigm but at page scope rather than site scope. Two independent repos
converging on "describe-what-you-need" extraction suggests this is an emerging
standard pattern for web extraction, not a firecrawl-specific novelty.

---

## 2. How do web crawling patterns change the T28 architecture?

### T28 needs two extraction paradigms, not one

Clusters A and B established a clean extraction model: input source, parse
format, output markdown + metadata. Cluster C breaks this by introducing
goal-directed extraction where the extractor must:

- Navigate across pages (not just parse one input)
- Make decisions about what to extract (not just extract everything)
- Interact with the page (fill forms, click buttons, dismiss popups)
- Use AI reasoning during extraction (not just after)

**T28 must support both paradigms:**

1. **Format-driven extraction** (Clusters A+B): "Here is a source, parse it."
   Used for: PDFs, documents, code repos, audio files, static data. The
   extractor does not make content decisions.

2. **Goal-driven extraction** (Cluster C): "Here is a target and an intent, find
   what I need." Used for: websites, search results, social media feeds, API
   exploration. The extractor navigates and selects.

These are not just different backends -- they have different interfaces.
Format-driven extraction takes a source path and returns content. Goal-driven
extraction takes a target + intent description and returns findings. The
extraction adapter layer must accommodate both.

### The pre-extraction discovery phase

Firecrawl's Map endpoint introduces a concept that Clusters A+B lack entirely:
understanding a source's structure _before_ extracting content. For web sources,
this means discovering all URLs before deciding which to scrape. For repo
sources, T28 already does this (list files, then select which to analyze). For
document sources, this could mean scanning a table of contents before extracting
full sections.

This suggests T28 should have an explicit **discovery phase** before extraction:

```
Source input
  -> Discovery (what exists in this source?)
  -> Selection (what should we extract, given the user's intent?)
  -> Extraction (parse the selected content)
  -> Output
```

This is a richer pipeline than the Cluster A/B model (source -> parse -> output)
and it is already implicit in the existing repo-analysis and website-analysis
skills (Phase 1 is always "understand the source structure").

### Web sources need an operational resilience layer

Document extraction (Clusters A+B) operates on cooperative inputs -- the file is
there, it has a format, parse it. Web extraction operates on adversarial inputs
-- bot detection, JavaScript rendering, dynamic content, consent dialogs, rate
limits, CAPTCHAs.

T28's extraction adapter interface for web sources needs additional
configuration beyond source-type routing:

- Proxy configuration
- Bot detection strategy
- JavaScript rendering requirements
- Cookie/session management
- Rate limiting per domain
- Crash recovery checkpoints

This is a web-specific operational layer that does not exist for other source
types. It should be encapsulated in the web extraction adapter, not spread
across T28's orchestration layer.

---

## 3. Does Cluster C close any remaining gaps?

### Updated 9 open questions

**Q1 (Output schema): NARROWED further -- markdown convergence is strong.**
Firecrawl and crawl4ai both default to markdown output. This is now 4+ repos
across all 3 clusters converging on markdown as the interchange format. The
brainstorm question narrows from "what format?" to "markdown with what metadata
sidecar schema?"

Status: Partially addressed. The text format is converging. The metadata schema
remains open.

**Q2 (URL classification/routing): PARTIALLY ADDRESSED by firecrawl Map.** Map
provides site-scope URL discovery and classification. This solves the "given a
domain, what pages exist?" problem. It does NOT solve the cross-domain
classification problem ("is this URL a paper, a web page, or a download link?").

However, combined with the goal-driven extraction paradigm, the classification
problem transforms. Instead of T28 classifying URLs into source types and
routing to specialized extractors, T28 could use the goal-driven model: "here is
a URL, here is what I want to learn from it, extract accordingly." The AI agent
handles classification implicitly during extraction.

Status: Partially addressed. Site-scope solved. Cross-domain still open but may
be bypassed by goal-driven extraction.

**Q3 (Cross-source synthesis primitives): STILL OPEN.** Neither firecrawl nor
crawl4ai operates across sources. They crawl one site at a time. Cross-source
synthesis remains T28's unique value proposition with zero prior art across all
three clusters.

Status: Fully open. No change.

**Q4 (Extraction confidence): STILL OPEN, but new dimension added.** Web
extraction introduces a new confidence dimension: was the page fully rendered?
Did the anti-bot measures succeed? Did the JavaScript execute completely?
Document extraction confidence is about parse quality. Web extraction confidence
is about access quality -- did we even get the real page?

Status: Fully open. Scope expanded (parse confidence + access confidence).

**Q5 (Progressive/resumable extraction): NOW ADDRESSED for web crawling.**
Crawl4ai's `resume_state` + `on_state_change` provides true mid-crawl recovery
with checkpoint-resume semantics. This is the first real prior art across all
clusters.

However, this solves web crawling resumability specifically. It does not
generalize to document extraction (no concept of resuming from page 37) or repo
analysis (no concept of incremental commit analysis). The pattern (checkpoint +
resume) is transferable, but the implementation is web-specific.

Status: Addressed for web sources. Pattern is transferable but per-source-type
implementation is still needed.

**Q6 (Hierarchy preservation threshold): UNCHANGED.** Web pages have implicit
hierarchy (DOM structure, headings), but crawl4ai flattens Shadow DOM and
firecrawl converts to flat markdown. This aligns with Cluster B's finding that
markdown handles hierarchy well enough for LLM consumption. But the deeper
question (when does tree structure matter?) is still unanswered.

Status: Fully open. No change.

**Q7 (80/20 split -- extraction unified, analysis unification open):
REINFORCED.** Cluster C adds a wrinkle: web extraction is converging, but it is
converging on a _different paradigm_ (goal-driven) than document extraction
(format-driven). Extraction is unifiable within source-type families, but may
need paradigm-level separation (format-driven vs goal-driven) at the
orchestration level.

Status: Refined. Extraction is unifiable _per paradigm_. Two paradigms needed.

**Q8 (Where LLM reasoning belongs): CLUSTER C SAYS "EVERYWHERE" for web.**
Firecrawl puts LLM at extraction time (Interact), at navigation time (Agent),
and at query time (Search). Crawl4ai puts LLM at extraction time (natural
language questions). For web sources, LLM reasoning is not a discrete injection
point -- it pervades the entire extraction flow.

This contrasts with Cluster B's finding (LLM at extraction time vs analysis
time). For web sources, the answer is: LLM is integral to extraction, not an
optional augmentation. For documents, LLM is optional augmentation. For code
repos, LLM is primarily at analysis time.

Status: Partially answered. The answer is per-source-type, not universal. Web =
LLM-integral. Documents = LLM-optional. Code = LLM-at-analysis.

**Q9 (Depth tiers controlling backend selection): REINFORCED.** Firecrawl's
endpoint hierarchy (Scrape < Interact < Agent) maps to depth tiers. Quick scan =
scrape (fast, no LLM). Standard = scrape + interact (page-level AI). Deep =
agent (fully autonomous). This supports the Cluster B finding that depth tiers
should control not just analysis depth but extraction backend selection.

Status: Partially answered. Pattern confirmed. Per-source-type tier mapping
still needs definition.

---

## 4. The web crawling architectural lesson for T28

### 168K combined stars means web-for-AI extraction is a solved operational problem

Firecrawl (105K) and crawl4ai (63K) together have more stars than every Cluster
A and B repo combined. The web extraction for AI space is massive, mature, and
actively competing. Multiple production-grade solutions exist.

**The lesson is the same as Cluster B but stronger: T28 should not build web
extraction infrastructure.** These tools handle rotating proxies, JavaScript
rendering, bot detection, session management, rate limiting, and crash recovery.
Building any of this is wasted effort.

### What T28 should do with web sources

T28's role for web sources is:

1. **Orchestration:** Decide when and why to crawl. Apply depth tiers. Manage
   extraction budgets (how many pages, how deep).
2. **Intent specification:** Translate user goals into extraction intents. "I
   want to understand this company's technical approach" becomes extraction
   parameters for the web extraction backend.
3. **Output normalization:** Take markdown + metadata from crawlers and
   normalize into T28's unified schema.
4. **Cross-source synthesis:** Correlate web findings with findings from repos,
   documents, audio, and other sources. This is where T28 adds value that
   neither firecrawl nor crawl4ai provides.

### The "describe what you need" paradigm changes the user interface

Firecrawl's Agent endpoint and crawl4ai's natural language extraction both point
toward a user interaction model that T28 should adopt for web sources: instead
of asking the user to specify URLs, parameters, and extraction formats, ask them
what they want to learn. The extraction system figures out the rest.

This aligns with T28's position in the pipeline: the user interacts with T28 at
the intent level ("analyze this company"), not at the extraction level ("scrape
these 50 URLs with these selectors").

### License implications

| Tool      | License    | T28 usage                                                        |
| --------- | ---------- | ---------------------------------------------------------------- |
| firecrawl | AGPL-3.0   | Use as hosted service only. Cannot embed. Patterns transferable. |
| crawl4ai  | Apache-2.0 | Can use freely as a library or service.                          |

Crawl4ai's Apache-2.0 license makes it the natural choice for T28's web
extraction backend. Firecrawl's patterns (Map, Interact, Agent) are
architecturally valuable but must be reimplemented or accessed via API, not
linked.

---

## 5. Updated consolidated open questions for brainstorm

After all three clusters (A: multi-format extraction, B: PDF/document + OCR, C:
web crawling), here are the consolidated open questions.

### RESOLVED (can be stated as facts in the brainstorm)

**R1: Extraction is architecturally unifiable.** Five document tools + two web
tools all converge on the same high-level architecture. Extraction is a solved
problem. T28 treats it as a pluggable backend layer.

**R2: Markdown is the canonical text interchange format.** 4+ repos across all 3
clusters default to markdown output. The brainstorm assumes markdown + metadata
sidecar, not a custom format.

**R3: Extraction interface is simple.** Source in, markdown + metadata out.
Error/timeout handling. Optional progress. The complex machinery is inside the
backends, hidden from T28.

**R4: Depth tiers should control extraction backend selection.** MinerU's three
engines (Cluster B) + firecrawl's endpoint hierarchy (Cluster C) both confirm
this. Quick = fast/lightweight. Deep = model-heavy/agent-driven.

### PARTIALLY ADDRESSED (narrowed but need brainstorm decisions)

**P1: Output schema -- metadata sidecar design.** Text format is settled
(markdown). The metadata schema is not. Options: (a) Thin universal core
(source, timestamp, type, confidence) + opaque extension bag per source type.
(b) 3-5 schema families (document, code, web, audio, social) with shared core.
(c) One universal schema with mostly-null optional fields. Gap Agent A
recommended (a). Clusters B+C reinforce this. Brainstorm should confirm and
define the core fields.

**P2: URL classification -- partially bypassed by goal-driven extraction.**
Firecrawl Map solves site-scope discovery. Goal-driven extraction may make
cross-domain classification unnecessary (the AI figures it out). Brainstorm
should decide: does T28 need explicit URL-to-source-type routing, or can
goal-driven extraction handle classification implicitly?

**P3: Progressive extraction -- pattern proven, per-source implementation
needed.** Crawl4ai proves checkpoint-resume for web crawling. The pattern
transfers. But each source type needs its own resumability implementation: web =
crawl frontier, repo = commit cursor, document = page offset. Brainstorm should
decide: is resumability a universal T28 feature or a per-source optional
capability?

**P4: LLM placement -- answer is per-source-type, not universal.** Web =
LLM-integral to extraction. Documents = LLM-optional augmentation. Code = LLM
primarily at analysis time. Brainstorm should define the LLM boundary per
source-type family, not attempt a universal placement.

**P5: Two extraction paradigms needed.** Format-driven (parse this source) vs
goal-driven (find what I need from this target). Web sources need goal-driven.
Documents need format-driven. Some sources could use either. Brainstorm should
decide: are these two separate interfaces, or one interface with an optional
intent parameter?

### FULLY OPEN (need brainstorm exploration)

**O1: Cross-source synthesis primitives.** Zero prior art across all 3 clusters.
This is T28's unique value proposition. The brainstorm must define from scratch:
What are the basic synthesis operations? (Link, deduplicate, conflict-resolve,
chain, merge, compare?) What data structures support them? How does provenance
flow through synthesis?

**O2: Extraction confidence schema.** No repo in any cluster surfaces
per-element confidence. T28 needs it because: (a) LLM-augmented extraction can
hallucinate (Cluster B), (b) web extraction has access uncertainty (did we get
the real page?), (c) synthesis needs to weight sources by extraction quality.
Brainstorm must define the confidence schema and propagation model.

**O3: Hierarchy preservation threshold.** When does tree structure matter
(complex PDFs, nested web pages) vs when is flat markdown sufficient (tweets,
API responses)? Should this be configurable per source type or determined
automatically?

**O4: Analysis layer design.** The meta-question. Extraction is pluggable.
Synthesis has no prior art. What does the analysis layer -- the middle of the
pipeline -- actually do? What does it receive (markdown + metadata), and what
does it produce? Is it one unified analyzer or per-source-type analyzers with a
shared interface? This is the core design question for the brainstorm.

---

## Summary for brainstorm consumption

**Cluster C's contribution in one sentence:** Web extraction for AI is a massive
solved space (168K stars) with a fundamentally different extraction paradigm
(goal-driven, AI-navigated) that T28 must support alongside the format-driven
paradigm from Clusters A+B.

**Three things the brainstorm must resolve from Cluster C:**

1. Two extraction paradigms (format-driven vs goal-driven) -- one interface or
   two?
2. Whether URL classification is still needed or is bypassed by goal-driven
   extraction
3. Web-specific operational resilience (anti-bot, proxies, JS rendering) -- T28
   orchestration concern or encapsulated in adapter?

**Two things the brainstorm can skip because Cluster C settled them:**

1. Whether to build web crawling infrastructure (no -- use crawl4ai/firecrawl)
2. Whether markdown is the right interchange format (yes -- all clusters
   converge)

**Final state entering brainstorm:** 4 resolved facts, 5 partially-addressed
questions needing decisions, 4 fully open questions needing exploration. The
brainstorm's center of gravity should be O1 (synthesis primitives) and O4
(analysis layer design) -- these are where T28's actual value lives.
