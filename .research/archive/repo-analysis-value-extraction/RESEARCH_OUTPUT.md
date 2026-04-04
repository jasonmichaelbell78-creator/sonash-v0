# Repo Analysis Value-Extraction Lens — Supplemental Research Report

**Version:** Final **Date:** 2026-03-31 **Supplements:**
`.research/repo-analysis-skill/RESEARCH_OUTPUT.md` **Findings files processed:**
17 (D1a-1, D1a-2, D1b, D1c, D1d, D2a, D2b, D2c, D2d, D3a, D3b-1, D3b-2, D3c,
D4a, D4b, D4c, D5) **Confidence distribution:** HIGH: 89, MEDIUM: 18, LOW: 0,
UNVERIFIED: 2

---

## 1. Executive Summary

This report covers the "offensive lens" of repository analysis — not whether a
repo is healthy or safe to depend on (covered in the companion defensive
research), but what can be extracted from it: patterns worth copying,
architectural decisions worth studying, components worth adapting, and
conventions worth adopting. The research spans four gaps deliberately left open
after the defensive lens research: how to systematically extract value from
repos (Gap 1), how to discover repos worth analyzing in the first place (Gap 2),
how to assess whether patterns are portable to a new context (Gap 3), and how AI
capabilities can augment traditional static analysis for this purpose (Gap 4). A
fifth area (D5) audited the internal delta — what already exists in the SoNash
codebase that can be reused, and what must be built fresh.

The central finding across all four gaps is that **value extraction is a
structured pipeline, not a single-pass inspection**. Commercial tools like
Greptile and Sourcegraph Cody reveal that repo-level intelligence requires
whole-repo indexing, graph-based relationship modeling, and hybrid retrieval —
not file-by-file analysis. The same insight applies to AI-assisted value
extraction: structured multi-pass prompting with subagent delegation outperforms
single-context exploration by 20-50%, and context window management is the
binding constraint on analysis quality. [D1a-1, D1a-2, D4a, D4b]

Repo discovery is more tractable than expected. GitHub's search API, combined
with package registry APIs (npm, crates.io, deps.dev), awesome-list enumeration
via ecosyste.ms, and community signal aggregation (Hacker News Algolia API,
Stack Overflow SEDE), forms a coherent discovery stack. The critical caveat: raw
GitHub star counts are now a compromised signal — a CMU study found 6 million
suspected fake stars across 26,254 repos. Cross-referencing discovery signals
(stars + recent activity + fork ratio + community mentions) is necessary to
avoid low-quality targets. [D2a, D2b, D2c, D2d]

Pattern portability is assessable before extraction. A five-dimension rubric —
Dependency Profile, Coupling Profile, Configuration Surface, Cognitive
Portability, and Documentation Artifacts — can score any component 0-15 on
portable-vs-project-specific. The strongest single predictor of reusability is
documentation (specifically, undocumented public APIs as a negative signal),
which was the #1 predictor in a 2024 ML study of 526 Java Maven artifacts. The
critical failure mode is "architectural mismatch" — hidden assumptions about
component nature, connectors, global structure, and construction process that
API compatibility checking cannot surface. [D1c, D3a, D3b-1, D3b-2]

The internal delta analysis (D5) is encouraging: approximately 70% of the
orchestration infrastructure needed for a repo-analysis value-extraction skill
already exists internally (deep-research pipeline, gsd-codebase-mapper, explore
agent, ecosystem-health scoring model, TDMS schema conventions). What must be
built new is: a repo-discovery agent, a portability-scoring agent, an
adaptation-guide-writer agent, and a value-findings JSONL schema with intake
pipeline. The architecture is a 7-phase pipeline that reuses internal components
in Phase 1-3 and adds new components in Phase 4-7. [D1d, D5]

A cross-cutting finding — visible only by combining findings from all four gaps
— is the convergence on the same design principle from multiple directions:
**context quality determines output quality, at every level of the stack**.
Augment's finding that "Sonnet + MCP context > Opus without context" [D1a-2],
COCOMO II's finding that Software Understanding (SU) multiplies adaptation cost
by 5x [D3a], and Anthropic's finding that "context window fills up fast, and
performance degrades as it fills" [D4a, D4b] all point to the same truth: the
quality of context brought to any analysis or extraction task determines its
output quality, more than model capability or algorithmic sophistication. This
has direct implications for how the value-extraction skill should be designed.

---

## 2. Value Extraction Methodologies

_Synthesizes D1a-1, D1a-2, D1b, D1c, D1d_

### 2.1 Commercial AI Tools as the Reference Architecture

**Claim VE-01** [CONFIDENCE: HIGH]: Whole-repo indexing before query time is the
architectural prerequisite for any deep value extraction. Both Greptile and
Sourcegraph Cody reject the "analyze the diff" model in favor of precomputed
cross-repo context. [D1a-1]

Greptile builds a three-node dependency graph (files, functions, external
references) with edges encoding calls, imports, and variable usage. Every query
traverses this graph — not the code directly. Sourcegraph uses SCIP (a
Protobuf-based symbol indexing format) that enables compiler-accurate Find
References across all indexed repos. The key architectural insight: graph-based
representation enables the class of questions most relevant to value extraction
— "where is this pattern used?", "who calls this function?", "what changed
across the file graph?" — that vector similarity alone cannot answer. [D1a-1]

**Claim VE-02** [CONFIDENCE: HIGH]: Both tools catch problem classes that static
analysis fundamentally cannot: cross-file architectural drift, business logic
consistency, and intent-aware errors. [D1a-1]

The distinction is: static analysis applies rules to structure; repo-level AI
tools apply context to meaning. A tool that knows what the rest of the codebase
expects from any given change can surface value extraction candidates that
file-by-file analysis misses — specifically: patterns used consistently across
the whole codebase (convention candidates), patterns used inconsistently
(improvement candidates), and patterns from one architectural layer applied
across the wrong boundary (anti-pattern candidates). [D1a-1]

**Claim VE-03** [CONFIDENCE: HIGH]: Augment Code's finding that "a weaker model
with great context (Sonnet + MCP) outperforms a stronger model with poor context
(Opus without MCP)" is the central empirical validation of context quality as
the primary lever. [D1a-2]

Augment's benchmark on 300 Elasticsearch PRs showed +80% quality improvement for
Claude Code + Opus 4.5 with the Context Engine MCP vs. without. Cursor + Claude
Opus 4.5 saw +71% improvement. This is not about models — it is about retrieval
quality. [D1a-2]

**Claim VE-04** [CONFIDENCE: HIGH]: Sourcegraph deprecated vector embeddings at
Enterprise GA, replacing them with BM25F + transformer reranker, citing ~20%
improvement across all key metrics. The lesson: hybrid retrieval
(recall-optimized first stage + precision-optimized second stage) outperforms
pure semantic search for code. [D1a-1]

### 2.2 Repo-to-Text Tools: The Practical Entry Point

**Claim VE-05** [CONFIDENCE: HIGH]: Repomix (22.8k GitHub stars, ~45,500 weekly
npm downloads) is the dominant CLI tool for full-text repo flattening with four
output formats, Tree-sitter compression, Secretlint-based secret detection, MCP
server mode, and a full Node.js programmatic API. [D1b]

**Claim VE-06** [CONFIDENCE: HIGH]: Full-text flattening wins for holistic
reasoning; RAG wins for scale and precision on targeted queries. Best practice
for 2025/2026: use full-text for repos fitting within 200K tokens; use RAG for
anything larger or for production Q&A systems. [D1b]

The cost gap is significant: RAG is 1,250x lower cost per query than
full-context, but introduces "retrieval lottery" risk — if the relevant chunk is
not retrieved, the answer fails. For exploratory value extraction (where you
don't know what you're looking for), full-text has an advantage; for targeted
extraction (where you have a specific pattern question), RAG or agentic search
is more efficient. [D1b, D4b]

**Claim VE-07** [CONFIDENCE: HIGH]: Repomix's `--compress` flag uses Tree-sitter
parsing to strip function bodies while preserving signatures, yielding
approximately 70% token reduction. This is the correct approach for
architecture-level value extraction — the skeleton code shows the patterns
without the implementation noise. [D1b]

Note: the 70% figure appears in Repomix's MCP docs but is marked experimental in
the compression guide itself; the specific percentage has LOW confidence but the
significant reduction is HIGH confidence. [D1b - contradiction]

**Claim VE-08** [CONFIDENCE: HIGH]: Questions that work well with repo-to-text
output: architecture review, onboarding, cross-cutting refactoring,
documentation generation, security audits, migration planning. Questions that
fail or degrade: exact debugging of runtime behavior, tasks requiring library
knowledge outside training data, granular debugging on large repos ("lost in the
middle" problem). [D1b]

### 2.3 Code Reuse Assessment Frameworks

**Claim VE-09** [CONFIDENCE: HIGH]: NASA's Reuse Readiness Levels (RRL) provide
a 9-dimension scoring ladder (Documentation, Extensibility, IP, Modularity,
Packaging, Portability, Standards Compliance, Support, Verification/Testing)
scored 1-9 per dimension. RRL 1-2 = not ready for reuse; RRL 8-9 = demonstrated
multi-organization reuse. [D1c]

**Claim VE-10** [CONFIDENCE: HIGH]: CHAOSS OSS Viability model is the most
operationally complete framework for evaluating open source components for
adoption, with four pillars (Compliance + Security, Governance, Community,
Strategy) and specific tooling support via GrimoireLab 2.0. Key thresholds:
Libyears > 3 years signals elevated vulnerability risk; Elephant Factor = 1
signals existential single-company dependency risk. [D1c]

**Claim VE-11** [CONFIDENCE: HIGH]: Garlan, Allen & Ockerbloom's "Architectural
Mismatch" (1995, revisited 2009) identifies four assumption categories that
cause reuse failure: (1) nature of components, (2) nature of connectors, (3)
global architectural structure, (4) construction process. API compatibility
checking misses all four. [D1c]

**Claim VE-12** [CONFIDENCE: HIGH]: Empirical evidence strongly supports reuse
improving quality (lower defect density) and productivity. Reused components
show lower defect density than newly written code, with defect density reduction
estimated to reduce total effort by ~20%. A 2023 model explained 58-66% of
variance in productivity and bug density outcomes. [D1c]

**Claim VE-13** [CONFIDENCE: HIGH]: Code reuse initiative failure follows
predictable patterns: NIH syndrome, funding model mismatch, framework
over-engineering, and maintenance cost underestimation. The consistent
recommendation: start with concrete working systems and generalize, not with
top-down reusable designs. [D1c]

### 2.4 Internal Capabilities (Existing Assets)

**Claim VE-14** [CONFIDENCE: HIGH]: Approximately 70% of the orchestration
infrastructure needed for a repo-analysis value-extraction skill already exists
internally. The deep-research parallel searcher/synthesizer pipeline,
gsd-codebase-mapper (4-axis analysis), explore agent (read-only investigation),
ecosystem-health scoring model (weighted categories with benchmarks), and TDMS
schema conventions are all directly reusable or adaptable with low-medium
effort. [D1d, D5]

**Claim VE-15** [CONFIDENCE: HIGH]: Six capabilities must be built new: (1)
repo-discovery agent (GitHub + registry + community signal search), (2)
portability-scoring agent (dependency coupling analysis), (3)
adaptation-guide-writer agent (transplant instructions), (4) value-findings
JSONL schema + intake pipeline, (5) external-repo domain config for
deep-research, and (6) summary vs. extraction mode switch. [D1d, D5]

---

## 3. Repo Discovery and Search

_Synthesizes D2a, D2b, D2c, D2d_

### 3.1 GitHub Search API

**Claim RD-01** [CONFIDENCE: HIGH]: Seven REST search endpoints exist
(`/search/repositories`, `/search/code`, `/search/commits`, `/search/issues`,
`/search/labels`, `/search/topics`, `/search/users`) with authenticated limits
of 30 req/min (10 req/min for code search). A hard 1,000-result cap applies
across REST and GraphQL — `total_count` may show millions but only 1,000 are
accessible. Date-range slicing (iterating over `created:` or `pushed:` windows)
is the validated workaround. [D2a]

**Claim RD-02** [CONFIDENCE: HIGH]: GitHub Trending and Explore have NO official
API. GitHub explicitly confirmed these are UI-only views citing abuse
prevention, dynamic ranking logic, and CDN optimization. Third-party scrapers
(github-trending-api, GiTrends) fill the gap by parsing HTML, but carry shutdown
risk. [D2a, D2c]

**Claim RD-03** [CONFIDENCE: HIGH]: The `pushed:` qualifier tracks last code
commit push; `updated:` tracks any repository object change. For finding
actively maintained code, `pushed:` is more reliable. A practical repo quality
validation scoring approach: combine `pushed:` recency + fork-to-star ratio >
0.1 + has CONTRIBUTING.md/CHANGELOG + CI/CD badge presence. [D2a, D2d]

**Claim RD-04** [CONFIDENCE: HIGH]: API and web interface search results are
provably inconsistent. Documented cases show the same query returning 225
results via API vs 123,000 via web interface. GitHub acknowledged code search
API should be treated as "best effort." [D2a — contradiction noted]

**Claim RD-05** [CONFIDENCE: HIGH]: The new GitHub code search
(github.com/search) uses Tree-sitter indexing with regex, boolean operators, and
symbol search. The `symbol:functionName` qualifier enables function/class
definition search across 21+ languages. This is architecturally separate from
the legacy REST `/search/code` endpoint and has different (and richer) query
syntax. [D2a]

### 3.2 Package Registry Search

**Claim RD-06** [CONFIDENCE: HIGH]: npm search API (`GET /-/v1/search`) is the
most feature-rich among language registries with full-text search, weighted
scoring (quality/popularity/maintenance), and qualifiers including `is:insecure`
and `is:unstable`. The npms.io API (`api.npms.io/v2/search`) provides richer
0-10 scoring across three categories with biweekly updates. [D2b]

**Claim RD-07** [CONFIDENCE: HIGH]: PyPI has NO search API. The XML-RPC
`search()` method was permanently decommissioned September 2024. The JSON API at
`pypi.org/pypi/{package}/json` requires knowing the package name. PyPI's
BigQuery dataset is the only way to run aggregate queries across the full
corpus. [D2b]

**Claim RD-08** [CONFIDENCE: HIGH]: Go modules are architecturally different —
the module path IS the source URL, providing near-100% source URL accuracy by
design. pkg.go.dev has NO public search API (issue #36785 open since January
2020, milestone "pkgsite/unplanned"). [D2b]

**Claim RD-09** [CONFIDENCE: HIGH]: deps.dev (Google Open Source Insights) is
the best cross-registry API, covering 7 ecosystems (Go, npm, PyPI, Cargo, Maven,
NuGet, RubyGems) with 5M+ packages, computed transitive dependency graphs,
OpenSSF Scorecard per package, OSV advisory integration, and SLSA provenance
attestations. Free, no auth required. A unique capability: hash-based lookup to
find which package versions contain a specific file by content hash. [D2b]

**Claim RD-10** [CONFIDENCE: MEDIUM-HIGH]: libraries.io covers 31+ registries
with dependent-count metadata not available in individual APIs. The bulk dataset
on Zenodo (2020, 5GB compressed) covering 2.5M components and 100M declared
dependencies is the most comprehensive single-source for large-scale ecosystem
analysis, though stale. The live API continues to update. [D2b]

### 3.3 Curated Discovery Vectors

**Claim RD-11** [CONFIDENCE: HIGH]: The awesome-lists ecosystem has ~9,924 repos
on GitHub and is fully API-accessible via ecosyste.ms (5,000 req/hr, OpenAPI
spec, CC BY-SA 4.0). Quality is enforced by `awesome-lint` with ~33 checks. Best
approach: ecosyste.ms API to enumerate lists → fetch `/lists/{id}/projects` →
cross-reference with `ecosyste.ms/packages` for download/dependency data. [D2c]

**Claim RD-12** [CONFIDENCE: HIGH]: The Algolia HN API (`hn.algolia.com/api/v1`)
provides full-text search over Hacker News with 10,000 req/hr, no auth required.
For Show HN repo discovery:
`GET /search_by_date?query=github.com&tags=show_hn&numericFilters=points>50`.
Research confirms the average Show HN repo gains 121 stars in 24 hours, 289
after a week. [D2c]

Note: The algolia/hn-search GitHub project was archived in 2025, but the API
itself appears still operational. Future availability is uncertain. [D2c — gap]

**Claim RD-13** [CONFIDENCE: HIGH]: A cross-vector compound discovery strategy —
repos appearing in multiple signals (awesome list + HN Show HN + TLDR mention)
within a rolling 90-day window — is the highest-quality approach. Intersection
across vectors dramatically reduces false positives from single-signal
discovery. [D2c]

**Claim RD-14** [CONFIDENCE: HIGH]: Fake GitHub stars are a massive
signal-pollution problem. A CMU study (ICSE 2026) detected 6 million suspected
fake stars across 26,254 repos, with ~30% of repos with fake star campaigns
being active spam/malware. Stars alone are now an unreliable quality signal.
Cross-reference with download/dependency data from ecosyste.ms or deps.dev to
reduce false positives. [D2c, D2d]

### 3.4 Web Search and AI-Assisted Discovery

**Claim RD-15** [CONFIDENCE: HIGH]: The Bing Web Search API was fully retired
August 11, 2025. The primary alternatives are: Brave Search API (independent
40B-page index, SOC 2 Type II), Serper.dev (Google SERP, $0.30-1.00/1k), Exa.ai
(semantic, $1.50/1k), and GitHub's native search API (free, rate limited). [D2d]

**Claim RD-16** [CONFIDENCE: MEDIUM]: Phind outperforms Perplexity for
code-specific repo discovery (95% vs 80% accuracy in API documentation
searches). Perplexity wins for broader "why use this" queries. Power users in
2026 use a hybrid stack: Perplexity (research context) + Phind
(code/implementation). [D2d]

**Claim RD-17** [CONFIDENCE: HIGH]: Stack Overflow SEDE (weekly snapshot, free
SQL) and BigQuery (quarterly update) enable SQL queries against all answer
bodies for GitHub links. A practical pattern:
`SELECT TOP 200 Body, Score FROM Posts WHERE PostTypeId=2 AND Score>50 AND Body LIKE '%github.com%' ORDER BY Score DESC`.
High-score accepted answers with GitHub links are especially high-signal
discovery candidates. [D2c]

---

## 4. Pattern Portability Assessment

_Synthesizes D3a, D3b-1, D3b-2, D3c_

### 4.1 Portability Metrics and Framework

**Claim PP-01** [CONFIDENCE: HIGH]: Robert Martin's package metrics provide the
quantitative portability baseline. Key metrics: Afferent Coupling (Ca = inbound
dependencies), Efferent Coupling (Ce = outbound dependencies), Instability (I =
Ce/(Ce+Ca), range 0-1), Abstractness (A = ratio of abstract types), and Distance
from Main Sequence (D = |A+I-1|). Ideal portable reusable components: A≈1, I≈0
(stable abstract packages). Zone of Pain (A≈0, I≈0): concrete and stable, hard
to change. Zone of Uselessness (A≈1, I≈1): abstract but unstable, nobody depends
on it. [D3a, D3b-2, D1c]

**Claim PP-02** [CONFIDENCE: HIGH]: A 2024 PLOS One ML study of 526 Java Maven
artifacts found the five top reusability predictors: (1) PUA (Public
Undocumented API) < 450 — documentation is the #1 predictor, (2) Number of Files
< 250, (3) NII (Number of Incoming Invocations) max < 80 per class, (4) NL
(Nesting Level) sum < 450, (5) CBO (Coupling Between Objects) std dev 2-8. [D3a]

**Claim PP-03** [CONFIDENCE: HIGH]: Framework coupling vs. library coupling is
the decisive architectural portability boundary. Library coupling: your code
calls the library, you control the call flow — the library can be swapped if an
abstraction layer exists. Framework coupling: the framework calls your code via
Inversion of Control — migrating away requires restructuring the entire call
graph. Hexagonal Architecture (ports and adapters) converts framework coupling
to library coupling, maximizing portability. [D3a]

**Claim PP-04** [CONFIDENCE: HIGH]: COCOMO II's Software Understanding (SU)
factor provides a quantified adaptation cost model. SU is rated 10-50% penalty
on three criteria (Structure, Applications Clarity, Self-Descriptiveness). A
component with Low SU multiplies adaptation cost by 5x even for trivial changes.
A NASA study of ~3,000 reused modules showed a base cost of ~5% just to assess,
select, and assimilate a component, before any modification. [D3a]

**Claim PP-05** [CONFIDENCE: HIGH]: The "blank project test" is the most
practically useful portability heuristic: imagine copying a component into a
blank project and listing all imports. Any import that is not (a) standard
library, (b) a well-known general-purpose library, or (c) an abstracted
interface is a portability risk. Framework-specific imports (Next.js server
actions, Firebase-specific calls, platform SDK methods) are portability killers
unless behind an interface. [D3a]

**Claim PP-06** [CONFIDENCE: HIGH]: A proposed 5-dimension portability rubric
(scored 0-15): (1) Dependency Profile (0-3: standard lib only to invasive
framework), (2) Coupling Profile (0-3: Ce<3 to Ce>12), (3) Configuration Surface
(0-3: zero-config to requires global state), (4) Cognitive Portability (0-3:
nameable without parent context to name requires system reference), (5)
Documentation Artifacts (0-3: full API reference to no documentation). Score >=
10 = strong portable candidate; 6-9 = conditional; < 6 = project-specific,
extraction not recommended. [D3a]

### 4.2 Extraction Candidate Heuristics

**Claim PP-07** [CONFIDENCE: HIGH]: The strongest signal for an extraction
candidate is a component with high internal cohesion AND high change frequency
(Tornhill's "hotspot" composite metric). High-churn, high-complexity components
in isolation from the core domain are ideal extraction targets — they suffer
disproportionate maintenance burden and would benefit from clear boundary
enforcement. [D3b-2]

**Claim PP-08** [CONFIDENCE: HIGH]: Change coupling is a more reliable
extraction signal than static dependency analysis alone. When two files
consistently change together in the same commits but live in different modules,
this is an empirical signal that those files belong together — or that the
abstraction boundary is wrong. [D3b-2]

**Claim PP-09** [CONFIDENCE: HIGH]: The Rule of Three governs extraction timing:
extract when a pattern appears three times, not two. Critical nuance: even with
three occurrences, do not extract if you cannot name the abstraction clearly, if
it requires boolean parameters to handle variants, or if coupling would create
worse problems than duplication. [D3b-2]

**Claim PP-10** [CONFIDENCE: HIGH]: Shopify's 7-step Strangler Fig process: (1)
define public interface, (2) replace callers, (3) create new data source, (4)
dual-write with transactions, (5) backfill historical data, (6) migrate reads,
(7) remove legacy code. A 2025 insight adds: implement stranglers in
outputs-first order (pure outputs → input/output combinations → pure inputs) to
avoid the "Writeback anti-pattern." [D3b-2]

**Claim PP-11** [CONFIDENCE: HIGH]: DDD Bounded Contexts are the canonical
service extraction unit. Signals for a bounded context boundary: same term has
different meanings in different areas (ubiquitous language divergence), business
rules differ significantly across areas, different teams own different areas.
[D3b-2]

**Claim PP-12** [CONFIDENCE: HIGH]: Micro-frontend extraction requires 4+
independent teams to justify the overhead. 2025 consensus: "For most teams, a
monolithic frontend is the right choice." Modular monolith is the recommended
mid-ground — Feature-sliced design and strict module boundaries achieve team
autonomy without distribution overhead. [D3b-2]

### 4.3 Component Extraction Tools

**Claim PP-13** [CONFIDENCE: HIGH]: bit.dev enables component-level extraction
with versioning — tracks any folder with a discrete entry point as a publishable
component, auto-resolves import dependencies, and exports to a Scope installable
via standard npm/yarn. Best for design system atoms needing independent version
histories. Limitations: no free-tier self-hosting for private scopes,
documentation inconsistencies. [D3b-1]

**Claim PP-14** [CONFIDENCE: HIGH]: git-filter-repo
(`git filter-repo --subdirectory-filter FOLDER-NAME`) is the recommended tool
for surgical repository splitting — ~20 seconds on large repos vs 12+ minutes
for older tools. The built-in `git subtree split` is slower and less flexible
but supports bidirectional syncing. [D3b-1]

**Claim PP-15** [CONFIDENCE: HIGH]: PNPM workspaces is the standard choice for
extracting shared code within a monorepo. Move code to `packages/<name>/`, add
`package.json`, reference via `workspace:*`. Efficient disk usage through
content-addressable store (~60-80% disk reduction vs npm/yarn). Does not solve
cross-repo sharing — npm publish still required for external consumers. [D3b-1]

### 4.4 Architectural Pattern Mining

**Claim PP-16** [CONFIDENCE: HIGH]: Tier 1 detectable architectural patterns
(high accuracy, high value): circular dependencies (dependency-cruiser/Madge),
God Components (LOC + FanIn/FanOut, Arcan approach), Hub-Like Dependencies
(FanIn+FanOut metrics), Hotspots (Code Maat: high churn × high complexity), and
Temporal Coupling (git log co-change detection). [D3c]

**Claim PP-17** [CONFIDENCE: HIGH]: LLMs achieve only 38% accuracy on design
pattern classification (GoF), with GPT-4o and LLaMA-3 as top performers. LLMs
are useful for description/explanation tasks and generating architectural
knowledge, but not for precise automated pattern detection. LLMs hallucinate
patterns confidently at a 62% false-positive rate. [D3c]

**Claim PP-18** [CONFIDENCE: HIGH]: Code Maat (open source, Adam Tornhill)
detects hotspots, logical coupling, ownership patterns, code age, and temporal
coupling from git history. The 2025 "Source Code Hotspots" study validated
line-level hotspot detection at 90% accuracy. A key finding: 73.9% of hotspot
commits are from bots (configuration churn) — a repo analysis tool must filter
bot commits before computing hotspots. [D3c]

**Claim PP-19** [CONFIDENCE: HIGH]: Higher-order architectural patterns (CQRS,
hexagonal, event-driven) lack dedicated automated detection tools. Detection
requires combining naming convention analysis, dependency direction analysis
(dependency-cruiser/ArchUnit rules), import analysis, and structural heuristics.
All such findings should be reported as "detected pattern intent" with
confidence percentage, not as definitive detections. [D3c]

**Claim PP-20** [CONFIDENCE: HIGH]: Conway's Law alignment is measurable via
CodeScene (git authorship + architectural boundary comparison). Misalignment
predicts defect density and delivery slowdowns. A repo where team ownership
boundaries do not align with module boundaries is a value extraction risk — the
organizational coupling will follow you. [D3c]

---

## 5. AI-Driven Content Analysis

_Synthesizes D4a, D4b, D4c_

### 5.1 Prompting Strategies

**Claim AI-01** [CONFIDENCE: HIGH]: Structured dimension-by-dimension analysis
beats open-ended exploration for analytical tasks (20-50% accuracy improvement
cited). Open-ended exploration is specifically recommended for serendipitous
discovery. Optimal approach: structured pass for known dimensions + open-ended
pass for discovery, executed in separate phases. [D4a]

**Claim AI-02** [CONFIDENCE: HIGH]: Anthropic's own pattern is Explore → Plan →
Implement: enter Plan Mode, read files and answer questions without making
changes, identify relevant files and explain dependencies, then produce
structured output. The explore.md agent in this codebase implements this exact
5-step pattern. [D4a]

**Claim AI-03** [CONFIDENCE: HIGH]: Context window is the binding constraint —
most best practices for codebase analysis are based on one constraint: Claude's
context window fills up fast, and performance degrades as it fills. Three
anti-patterns: kitchen-sink sessions mixing analysis with unrelated tasks,
unscoped "investigate this" prompts reading hundreds of files, over-specified
CLAUDE.md that gets ignored. The recommended fix for large codebases is
subagents — delegate investigation to separate context windows that report
summaries back. [D4a]

**Claim AI-04** [CONFIDENCE: HIGH]: Multi-pass analysis with phase separation
produces significantly better results than single-pass. The canonical
three-phase pattern: (1) Structure pass (map topology, tech stack, entry points,
boundaries), (2) Pattern pass (coding conventions, data flow, architectural
decisions, cross-cutting concerns), (3) Quality/Concerns pass (debt, gaps,
security surface, test coverage). Each pass writes documents to disk rather than
accumulating in context. [D4a]

**Claim AI-05** [CONFIDENCE: HIGH]: Structured output via JSON Schema/JSONL
reduces format errors by up to 70% and achieves up to 99% reliability with
API-native structured outputs. For machine-parseable analysis, JSONL with
fingerprint-based dedup (SHA-256 content hash), severity/effort/confidence
fields, and file:line references is the battle-tested pattern. [D4a]

**Claim AI-06** [CONFIDENCE: MEDIUM]: "What's interesting here" prompts require
explicit permission and scaffolding: (a) give explicit permission to deviate
from standard quality metrics, (b) prime with categories of insight (unusual
design decisions, contradictions, evidence of evolution, innovative approaches),
(c) use survey methodology — design high-level questions first, then drill.
[D4a]

### 5.2 Multi-File Understanding Strategies

**Claim AI-07** [CONFIDENCE: HIGH]: Claude Code uses progressive on-demand
retrieval, not pre-indexing. Three-tier tool hierarchy: Glob (file-path pattern
matching, near-zero token cost), Grep (regex content search via ripgrep,
lightweight), and Read (full file load, 500-1,500 tokens per 200-line file).
"Just-in-time retrieval" — explore cheaply with Glob/Grep, then Read only
confirmed-relevant files. [D4b]

**Claim AI-08** [CONFIDENCE: HIGH]: Naively loading large repos into 1M token
context windows degrades quality measurably. A 17-point retrieval accuracy
decline (93% to 76%) was measured as context fills on Claude Opus 4.6 at 1M
tokens. Optimized 200K-token retrieval beats raw 1M-token dumps. Token pricing
exacerbates the problem: Claude's input tokens double in cost beyond 200K ($3/M
to $6/M). [D4b]

**Claim AI-09** [CONFIDENCE: HIGH]: Four distinct context failure modes are
documented: (1) Context Poisoning (errors compound in context), (2) Context
Distraction (agents repeat past actions past 100K tokens), (3) Context Confusion
(superfluous information degrades function-calling — every added tool hurts),
(4) Context Clash (sharded information across turns causes 39% performance
drop). [D4b]

**Claim AI-10** [CONFIDENCE: HIGH]: Aider's PageRank approach on a tree-sitter
dependency graph provides compressed structural orientation without vector
infrastructure. Files currently in chat receive weight 100/N; other files
receive 1/N. Default 1,024 tokens; expands to 8,192 when no files are in chat.
Advantage over RAG: deterministic, explicit dependency tracing. Limitation:
misses semantic/conceptual relationships without explicit symbol references.
[D4b]

**Claim AI-11** [CONFIDENCE: HIGH]: JetBrains Research (2025, SWE-bench
Verified) found observation masking outperforms LLM summarization for context
management — 2.6% higher solve rates at 52% lower cost. The common wisdom that
intelligent summarization preserves more useful context than simple masking is
empirically wrong. [D4b]

**Claim AI-12** [CONFIDENCE: HIGH]: Amazon Science (arXiv 2602.23368, Feb 2026)
found keyword search achieves 90%+ of RAG-level performance for most coding
tasks without a vector database. This validates Claude Code's Grep-first
approach as not merely a simplification but a near-optimal strategy for most
tasks. [D4b]

### 5.3 Claude Code Ecosystem and Comparable Systems

**Claim AI-13** [CONFIDENCE: HIGH]: The Claude Code skill/agent ecosystem has
exploded to 2,300+ skills, 770+ MCP servers, and 95+ curated marketplaces as of
March 2026. The most starred single project (`everything-claude-code`) has
82,000+ GitHub stars. Anthropic released the Agent Skills specification as an
open standard in December 2025; OpenAI adopted the same format for Codex CLI,
signaling cross-platform convergence. [D4c]

**Claim AI-14** [CONFIDENCE: HIGH]: SoNash's architecture (skills + agents +
hooks + state files + slash commands) mirrors the community consensus pattern
but at depth that outpaces most public repos. Most public repos implement 2-3 of
these layers. SoNash implements all layers plus cross-session state persistence,
hook warning logs, TDMS, propagation enforcement, pattern registries with
automated gate checking, multi-agent teams, and convergence loops. [D4c]

**Claim AI-15** [CONFIDENCE: HIGH]: GSD (Get Shit Done) at 23k GitHub stars is
the closest public equivalent to SoNash's SWS. GSD solves context rot through
phase-based execution: each phase gets a fresh 200K-token context, plans run in
parallel "waves," and every task gets an atomic git commit. SoNash adds:
canonical artifact enforcement, hook integration, cross-doc dependency tracking,
and a separate PR review pipeline. [D4c]

**Claim AI-16** [CONFIDENCE: HIGH]: The SoNash codebase has unique capabilities
with no public equivalent: TDMS full pipeline (MASTER_DEBT + DEBT-XXXXX IDs +
intake/dedup/views), propagation enforcement (3-layer system), CANON artifact
enforcement (hook-checks.json), T3 convergence loop doctrine,
review-metrics.jsonl RECONCILE step. [D4c]

**Claim AI-17** [CONFIDENCE: HIGH]: The ecosystem has capabilities SoNash lacks:
autonomous multi-agent swarms (Loki Mode: 37 agents across 8 swarms; Ruflo: 100+
agents with Byzantine fault-tolerant voting), cross-harness config portability
(AGENTS.md standard), OS-level sandboxing (Trail of Bits Seatbelt/bubblewrap),
and credential protection deny rules in settings.json. [D4c]

**Claim AI-18** [CONFIDENCE: HIGH]: 24 CVEs have been identified in the Claude
Code ecosystem and 655 malicious skills detected in supply chain attacks.
SoNash's internal-only skill system avoids this risk entirely — an implicit
security advantage worth explicitly preserving when considering adopting
external skills. [D4c]

---

## 6. Internal Capabilities Delta

_Synthesizes D5, D1d_

### 6.1 Direct Reuse (Zero Adaptation Cost)

**Claim IC-01** [CONFIDENCE: HIGH]: The following internal capabilities transfer
directly to a value-extraction skill with no modification: (1)
`scripts/health/lib/scoring.js` — `scoreMetric()`, `computeGrade()`,
`sparkline()`, `compositeScore()`, `computeTrend()` — self-contained, no project
dependencies; (2) write-to-disk-first principle — every analysis agent writes to
`<output-dir>/dimensions/<name>-findings.json` and returns only a completion
signal; (3) 4-agent concurrency cap + staged-wave pattern from
`audit-comprehensive`; (4) CRAAP+SIFT source evaluation framework; (5) MECE
coverage verification (convergence-loop quick-pass). [D1d]

**Claim IC-02** [CONFIDENCE: HIGH]: The deep-research parallel
searcher/synthesizer architecture is directly applicable to external repo
analysis at depth. The `codebase` search profile already uses Read, Grep, Glob,
and Bash — exactly the tools needed for repo analysis. The claims.jsonl routing
schema can be extended with `adoption_candidate`, `portability`, and
`effort_to_adapt` flags without breaking existing consumers. [D5]

### 6.2 Low-Cost Forks (Context Change, Keep Structure)

**Claim IC-03** [CONFIDENCE: HIGH]: The `explore` agent requires removing 2
context blocks (~50 lines) to become a generic external repo investigator. The
gsd-codebase-mapper requires an output path change and stack-detection
generalization for non-JS repos (medium effort). The deep-research domain module
system requires one new `external-repo.yaml` file (~50 lines) defining source
authority tiers for code analysis. [D1d]

**Claim IC-04** [CONFIDENCE: HIGH]: The `gsd-project-researcher` Mode 3
(Comparison) output format (comparison matrix + "Choose X when" recommendation)
is directly applicable for "this pattern vs my current approach" analysis, with
addition of a Portability Assessment section. [D5]

### 6.3 Medium-Cost Forks (Significant Prompt Work)

**Claim IC-05** [CONFIDENCE: HIGH]: The `code-reviewer` 7-category framework is
reusable for external repos with one structural change: add a fourth tier
("ADOPT") to the existing CRITICAL/WARNING/SUGGESTION tiers, and replace the 10
SoNash-specific pattern rules with domain-agnostic quality signals (TypeScript
strictness, test coverage, error handling discipline, OWASP Top 10 variants,
cognitive complexity). The AICode category needs zero changes — it is
framework-agnostic by design. [D1d]

**Claim IC-06** [CONFIDENCE: HIGH]: The ecosystem-health interactive triage loop
(Phase 3 Q&A format, per-dimension decisions, state persistence) provides the UX
model for presenting value-extraction findings. What needs to change: replace 13
internal health dimensions with value-extraction dimensions (pattern-novelty,
code-portability, adoption-readiness, quality-signal) and remap actions from fix
commands to adoption actions ("Copy pattern to lib/", "Adapt and rewrite",
"Study only — not portable", "Add to backlog"). [D5]

### 6.4 Must Build New

**Claim IC-07** [CONFIDENCE: HIGH]: Six new capabilities have no internal
precedent: (1) Repo Discovery Agent — GitHub API + registry + community signal
search returning ranked shortlist; (2) Portability Scoring Agent — dependency
coupling analysis comparing external pattern against own package.json and
architectural constraints; (3) Adaptation Guide Writer — concrete transplant
instructions (rename checklist, dependency swap list, refactoring steps, test
strategy); (4) Value-Findings JSONL schema + intake pipeline (mirroring TDMS
conventions); (5) External-repo domain config YAML; (6) Summary vs. extraction
mode switch on the skill itself. [D1d, D5]

### 6.5 Recommended Architecture (7-Phase Pipeline)

**Claim IC-08** [CONFIDENCE: HIGH]: The recommended architecture for the
value-extraction skill is a 7-phase pipeline:

- Phase 0: Discovery (optional, new capability needed — if no URL provided)
- Phase 1: Broad Mapping (reuse gsd-codebase-mapper, 4 parallel agents, redirect
  output to `.research/<repo-slug>/mapping/`)
- Phase 2: Value Scan (reuse deep-research-searcher agents, codebase profile,
  3-6 agents with value-extraction sub-questions)
- Phase 3: Value Synthesis (adapt deep-research-synthesizer — new routing flags
  on claims.jsonl)
- Phase 4: Portability Analysis (new build — spawn portability-analyzer per
  HIGH/MEDIUM value claim)
- Phase 5: Adaptation Recipe (new build — spawn adaptation-guide-writer for
  findings passing portability threshold)
- Phase 6: Value-Findings JSONL Intake (new build —
  `scripts/value/intake-value-finding.js`)
- Phase 7: Interactive Triage (reuse ecosystem-health UX pattern — user decides
  adopt/defer/investigate further/skip) [D5]

---

## 7. Revised Mode Architecture

_Based on all findings, how the skill modes should be structured for the
value-extraction lens_

The defensive lens research established a 4-tier analysis pipeline (Quick Scan →
Blobless Clone → History Clone → Full Clone). The value-extraction lens requires
a parallel dimension of _intent_, producing a 2×4 matrix of modes:

### 7.1 Mode Dimension 1: Extraction Intent

**Survey Mode** — "What's worth looking at in this repo?" No specific target;
produce ranked list of top 5-10 value findings by value density × portability.
Uses: Phase 0-3 of the 7-phase pipeline. Output: VALUE_SUMMARY.md. Best for:
initial exploration of an unfamiliar repo or ecosystem. Claim: [AI-01], [IC-08]

**Extraction Mode** — "I want to extract pattern X from this repo." Specific
target identified (by finding ID from Survey Mode, or directly specified). Uses:
Phases 4-7 of the 7-phase pipeline. Output: ADOPTION_RECIPE.md +
VALUE_FINDINGS.jsonl entry. Best for: acting on a specific value finding.
[IC-07, IC-08]

### 7.2 Mode Dimension 2: Analysis Depth (from defensive lens, carry forward)

**Quick Scan (QS)** — API-only pre-flight. 30 seconds, no clone. Produces
adoption viability signal from metadata alone. Applicable to value extraction:
star/fork/activity signals, license compatibility, tech stack compatibility from
manifest inference via GitHub contents API.

**Deep Scan (DS)** — Blobless partial clone + full static analysis. The standard
value-extraction mode. Enables Phases 1-3 of the 7-phase pipeline.

**Temporal Scan (TS)** — 12-month history clone. Required for hotspot and
temporal coupling analysis (Claims PP-07, PP-08, PP-16, PP-18). Adds Code Maat /
git log analysis to the value scan.

### 7.3 Claim: Mode Architecture

**Claim MA-01** [CONFIDENCE: HIGH]: The recommended default entry point for
value extraction is Survey Mode + Deep Scan. Quick Scan is the correct
pre-flight (under 30 seconds, answers license/activity/stack compatibility
before investing in a clone). Temporal Scan is opt-in for repos where behavioral
signals (hotspots, temporal coupling, ownership health) are needed. Extraction
Mode is invoked after Survey Mode identifies a specific value finding worth
acting on. [D1d, D3b-2, D4a, D5]

**Claim MA-02** [CONFIDENCE: MEDIUM]: The 7-phase pipeline is sequential by
default but parallelizable in Phase 1 (4 codebase-mapper agents) and Phase 2
(3-6 value-scan searcher agents). Phase 4-5 (portability + adaptation) can be
parallelized per finding. Total elapsed time estimate for Survey Mode + Deep
Scan on a medium repo: 5-15 minutes. [D5, D1d]

---

## 8. Contrarian Challenges Expected

_Pre-identifying likely challenges to the findings above_

**Challenge C-01: "The 7-phase pipeline is too heavyweight for practical use"**
The defensive lens research showed the contrarian was correct that a 30-tool
stack creates unsustainable maintenance overhead. The same risk applies here: a
7-phase pipeline with 5 new agents may collapse under its own complexity.
Resolution: Phase 0 (discovery), 4 (portability), 5 (adaptation), 6 (intake),
and 7 (triage) are all optional. A minimum viable value-extraction skill is
Phases 1-3 only (broad mapping + value scan + synthesis), which is entirely
composed of existing internal components. The additional phases are progressive
enhancement. [D1d, D5]

**Challenge C-02: "LLM-based pattern detection at 38% accuracy is too unreliable
to base extraction decisions on"** The 38% accuracy claim [PP-17] is for
zero-shot GoF classification — the hardest possible task. For value extraction,
the LLM is not being asked to classify patterns but to identify them in context,
describe them, and assess their portability. These are easier tasks with higher
expected accuracy. However, the finding should be incorporated as a design
constraint: all LLM-identified patterns should be labeled "requires review" in
the output, and Tier 1 automated signals (circular deps, God Components,
hotspots) should be presented as higher-confidence than LLM-identified patterns.
[D3c]

**Challenge C-03: "The portability rubric is not validated against real-world
adoption outcomes"** Gap 1 in D3a explicitly notes: "No unified empirical study
combining all five rubric dimensions." Each dimension is independently
evidence-backed, but the composite 0-15 score is proposed rather than
empirically validated. Resolution: the rubric is a hypothesis to be tested. The
value-extraction skill should log portability scores alongside actual adoption
decisions to build an empirical validation dataset over time. [D3a]

**Challenge C-04: "Fake star contamination makes GitHub discovery unreliable"**
The CMU finding that 16% of repos have suspected fake stars [RD-14] is a real
concern, but not a disqualifier. The cross-vector compound strategy [RD-13]
(awesome list + HN + TLDR intersection) is specifically designed to reduce
star-count dependence. A repo that appears in an awesome list AND receives
genuine HN traction AND has ecosystem-validated download counts (via deps.dev or
libraries.io) has passed multiple independent quality filters. [D2c, D2d]

**Challenge C-05: "Internal capability reuse at 70% is overoptimistic"** D5's
reuse claims are based on reading agent/skill definitions, not on actually
running the components against external repos. Real adaptation may reveal more
SoNash-specific assumptions than catalogued. The specific risks:
gsd-codebase-mapper assumes JavaScript/TypeScript layouts; code-reviewer's
automated check layer assumes npm scripts exist; the ecosystem-health triage
loop assumes internal state file paths. These are bounded risks with known
mitigation steps, not unknown unknowns. [D1d, D5]

---

## 9. Gaps and Future Work

_Aggregated gaps from all 17 findings files_

### 9.1 Discovery Gaps

- No official statistics on what fraction of public GitHub repos have topics
  assigned — affects topic-based discovery completeness. [D2a]
- GitHub index freshness / lag timing not documented (community reports suggest
  4-28 day range for external search engines). [D2d]
- No validated benchmark comparing programmatic search API result quality
  (Serper vs. Brave vs. Exa) specifically for GitHub-specific queries. [D2d]
- Algolia HN API archived in 2025 — future availability uncertain. [D2c]
- pkg.go.dev has no public search API (issue #36785 open since 2020). [D2b]

### 9.2 Portability Assessment Gaps

- No unified empirical study validates the 5-dimension composite portability
  rubric against real-world adoption outcomes. [D3a]
- No cross-language detection tool exists for higher-order patterns (CQRS,
  hexagonal, event-driven) — current tools are Java-heavy. [D3c]
- LLM accuracy for GoF pattern detection remains 38% with no clear path to
  improvement without fine-tuning on labeled datasets. [D3c]
- Microservice architecture recovery tools (Code2DFD, RAD) are validated only on
  Java Spring REST — GraphQL, gRPC, and event-driven stacks are out of scope.
  [D3c]
- Quantitative hotspot thresholds are proprietary to CodeScene — no open
  equivalent with published numeric thresholds. [D3b-2]

### 9.3 AI Analysis Gaps

- No clear thresholds for when to switch from full-repo-in-context to
  RAG/subagent approaches (e.g., "above X tokens, switch strategies"). [D4a]
- No controlled studies specifically comparing structured vs. open-ended for
  codebase analysis output quality. [D4a]
- Multi-pass coordination between agents is solved internally (write to disk,
  load specific files in next pass) but not well-documented in public sources.
  [D4a]
- Windsurf/Cognition Codemaps architecture documentation was inaccessible (SSL
  certificate issues). [D4b]
- Greptile's exact graph traversal algorithm is not documented publicly. [D1a-1]

### 9.4 Tool and Ecosystem Gaps

- Repomix Tree-sitter language support matrix for the `--compress` flag is not
  published. [D1b]
- Bit.dev pricing for private scopes (on-prem/self-hosted) not confirmed for
  2025-2026. [D3b-1]
- crates.io has no quality or maintenance score equivalent to npms.io's 0-10
  scoring. [D2b]
- Snyk Security Database (post-Advisor) health scores appear to be UI-only with
  no documented public API. [D2b]

### 9.5 Internal Build Requirements

- Repo discovery agent: GitHub API + registry + community signal search (~200
  lines). [D5]
- Portability scoring agent: dependency coupling analysis, two-repo comparison
  mode (~250 lines). [D5]
- Adaptation guide writer: transplant instructions with rename checklist,
  dependency swap list, refactoring steps (~150 lines synthesis logic). [D5]
- Value-findings JSONL schema + intake pipeline: 3-4 new scripts (~100 lines
  each), 1 JSONL file, 1 markdown view. [D5]
- External-repo domain config YAML: ~50 lines. [D5]
- Summary vs. extraction mode switch on the skill definition. [D5]

---

## 10. Serendipity Catalog

_All unexpected findings worth preserving, aggregated from all 17 findings
files_

**S-01: Augment MCP + Claude Code hybrid outperforms either alone** The Context
Engine MCP is explicitly compatible with Claude Code. "Sonnet + MCP context >
Opus without context" (+80% quality improvement on 300 Elasticsearch PRs). For
large repos, this is a significant quality lever available today without
building new infrastructure. [D1a-2, D4b]

**S-02: Repomix sorts files by Git commit frequency by default**
`output.git.sortByChanges: true` is Repomix's default — puts the most-changed
(most important) files at the top of output, directly addressing the "lost in
the middle" problem. This is non-obvious and high-value. [D1b]

**S-03: llms.txt as an emerging standard** Some practitioners recommend creating
a `llms.txt` file at repo root — a curated markdown summary of codebase
structure, goals, and key areas, analogous to robots.txt. A high-value signal
when present in an analyzed repo; worth creating for SoNash. [D1b]

**S-04: Observation masking beats LLM summarization (JetBrains Research 2025)**
Replacing older context observations with placeholders, rather than summarizing
them, achieves 2.6% higher solve rates at 52% lower cost on SWE-bench. Intuition
about intelligent summarization being better is empirically wrong. [D4b]

**S-05: crates.io deliberately avoids advisory count as quality signal**
"Well-maintained packages get MORE advisories due to scrutiny." This inverts the
naive assumption and is a useful calibration for any quality scoring system —
high advisory count may signal active maintenance, not poor quality. [D2b]

**S-06: 73.9% of hotspot commits are from bots** Configuration churn and
formatter runs dominate commit frequency in most repos. Any hotspot detection
system that doesn't filter bot commits will flag the wrong files. [D3c]

**S-07: GH Archive + BigQuery custom trending** The most powerful custom
trending approach: query `WatchEvent` (stars) events by time window to compute
custom trending. 1 TB/month free. Can outperform GitHub's own Trending for
narrow topical focus. [D2c]

**S-08: The documentation paradox** Virginia Tech empirical study found
documentation as a discrete artifact did NOT significantly affect ease of reuse
— interface clarity did. PLOS One ML study found undocumented public APIs (PUA)
was the #1 reuse predictor. Reconciliation: documentation is a discovery and
trust gate (whether reuse happens at all), not an integration difficulty factor
(ease of reuse given access). Both are needed in a portability rubric. [D3a —
contradiction surfaced]

**S-09: Variability debt as a distinct concept** The 2024 variability debt study
is specifically about the cost of insufficient designed variability — not
general technical debt. If a pattern requires cloning and modification to adapt
(rather than configuration or composition), it generates variability debt in the
adopter's codebase. The test: does adapting the pattern require forking, or only
configuring? [D3a]

**S-10: Aider's PageRank repo-map is being independently replicated** The
RepoMapper MCP server and several GitHub issues implement Aider-style PageRank
repo maps as standalone tools. The pattern is broadly applicable and could be
incorporated into the value-extraction skill without pulling in Aider itself.
[D4b]

**S-11: The "outputs-first strangler fig" insight** When a legacy system has
multiple integration points, the correct extraction order is outputs first → I/O
combinations → inputs last. Starting with inputs forces the "Writeback
anti-pattern." This is rarely documented explicitly and is a high-value
operational detail. [D3b-2]

**S-12: Boris Cherny treats CLAUDE.md instructions as technical debt** "Delete
rules when the model matures enough to not need them." SoNash's CLAUDE.md has
grown to ~135 lines (v5.8). This principle suggests periodically auditing for
rules that are now redundant. [D4c]

**S-13: DevHunt — GitHub-authenticated Product Hunt for dev tools** Smaller
community but higher signal for developer-facing tools. No API found but
browseable. Worth including in a discovery workflow for tooling-category repos.
[D2c]

**S-14: ROSE pipeline reaches 96.9% F1 for refactoring recommendations** Not for
smell detection itself, but for recommending specific refactoring moves after a
smell is detected (detect smell with Arcan → recommend refactoring with
ROSE/CodeT5). This suggests a viable feature: not just "you have a God Class"
but "here are specific refactoring moves." [D3c]

**S-15: Stack Overflow is a primary source for architectural knowledge mining**
33 of 151 MSR4SA academic studies mine Stack Overflow. This implies the
community's architectural knowledge about patterns is accessible and mineable —
potentially useful for matching a repo's patterns to known community discussions
about those patterns. [D3c]

---

## 11. Contradictions and Open Questions

### 11.1 Contradictions

| #      | Claim A                                                                                  | Claim B                                                                                                                | Source | Resolution                                                                                                                                                                                            |
| ------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CON-01 | "~70% token reduction" from Repomix compress (MCP docs)                                  | Feature marked "experimental," no published measurement (compress guide)                                               | D1b    | Significant reduction is HIGH confidence; specific 70% figure has LOW confidence. Use "significant reduction" in output.                                                                              |
| CON-02 | Documentation has NO significant effect on ease of reuse (Virginia Tech empirical study) | PUA (undocumented API) is the #1 predictor of reuse (PLOS One ML study)                                                | D3a    | Not contradictory: documentation is a discovery/trust gate (whether reuse occurs) vs. integration difficulty factor (ease once discovered). Both dimensions needed in portability rubric.             |
| CON-03 | Extract high-change components first (Tornhill: target hotspots for cleanup)             | Extract stable components first (Newman: start with low-risk for proof of concept)                                     | D3b-2  | These serve different goals: Tornhill targets components for cleanup/refactoring; Newman targets components for first microservice extraction as proof of concept. Both are correct in their context. |
| CON-04 | "Micro-frontends are the natural evolution for large teams" (2019-2022 guidance)         | "For most teams, a monolithic frontend is the right choice" (2025 consensus)                                           | D3b-2  | Practice maturation, not factual contradiction. MFEs are now positioned as solution to a specific organizational scaling problem (4+ independent teams), not a default.                               |
| CON-05 | Larger context windows solve the context problem (Cursor/Augment marketing)              | Larger contexts actively degrade performance (Chroma research, Anthropic context engineering docs)                     | D4b    | Retrieval (RAG/repo-map) is correct precisely because it prevents large contexts, not because it enables them.                                                                                        |
| CON-06 | LLM summarization preserves context better (intuition)                                   | Observation masking outperforms summarization (JetBrains Research 2025: 2.6% higher solve rate, 52% lower cost)        | D4b    | Summarization creates false confidence that important context was preserved, leading agents to run longer and encounter more failure modes. Empirical finding should override intuition.              |
| CON-07 | API and web interface search results are consistent                                      | Same query returns 225 results via API vs 123,000 via web (documented cases)                                           | D2a    | GitHub acknowledged code search API as "best effort." API results should be treated as a subset, not a complete count. Unresolved at source level.                                                    |
| CON-08 | Structured prompts improve accuracy 20-50%                                               | "Simpler prompting techniques like zero-shot prompting may outperform more advanced ones" for some code analysis tasks | D4a    | Task-dependent: zero-shot works better for classification/labeling; rich structured prompts work better for multi-dimensional analysis. Not a general contradiction.                                  |

### 11.2 Open Questions

- **OQ-01**: What is the optimal token budget threshold for switching from
  full-context repo loading to subagent-based retrieval? No source provides
  quantified thresholds. The 200K token suggestion is a ceiling, not a
  threshold.
- **OQ-02**: Does the 5-dimension portability rubric (0-15 scale) correlate with
  actual adoption success rates when tested empirically? This is a hypothesis to
  be validated over time.
- **OQ-03**: At what point does the deep-research codebase searcher profile hit
  its 25-turn limit on large repos? What is the practical file-count ceiling per
  searcher agent?
- **OQ-04**: Is the Algolia HN Search API still operational in March 2026, given
  the archival of the github project in 2025?
- **OQ-05**: How do the 5 new agents required (discovery, portability,
  adaptation, intake, mode switch) interact with the existing 57 agents — does
  this exceed the documented team capacity guidance?

---

## 12. Sources

All sources cited in this report are inherited from the 17 findings files. Below
is a consolidated tier-1 reference list of the most authoritative sources.

### Tier 1: Official Documentation and Peer-Reviewed Research

| Citation Key | Source                                                                     | Type                | Trust       |
| ------------ | -------------------------------------------------------------------------- | ------------------- | ----------- |
| [D1a-1-S1]   | greptile.com/docs/how-greptile-works/graph-based-codebase-context.md       | Official docs       | HIGH        |
| [D1a-1-S8]   | github.com/sourcegraph/scip (SCIP Code Intelligence Protocol)              | Official source     | HIGH        |
| [D1a-1-S10]  | arxiv.org/html/2408.05344v1 (AI-assisted Coding with Cody)                 | Academic paper      | HIGH        |
| [D1a-2-S3]   | augmentcode.com/blog/repo-scale-100M-line-codebase-quantized-vector-search | Official blog       | HIGH        |
| [D1b-S1]     | github.com/yamadashy/repomix                                               | Official source     | HIGH        |
| [D1c-S1]     | dl.acm.org/doi/10.1145/234528.234531 (Frakes & Terry 1996)                 | Academic (ACM)      | HIGH        |
| [D1c-S3]     | wiki.earthdata.nasa.gov — NASA RRL                                         | Official government | HIGH        |
| [D1c-S4]     | chaoss.community/practitioner-guide-viability/                             | Official framework  | HIGH        |
| [D1c-S6]     | github.com/ossf/scorecard/blob/main/docs/checks.md                         | Official tool docs  | HIGH        |
| [D1c-S13]    | dl.acm.org/doi/10.1109/MS.2009.86 (Garlan et al. 2009)                     | Peer-reviewed IEEE  | HIGH        |
| [D1c-S16]    | sciencedirect.com/science/article/pii/S0950584924000569 (SLR 2024)         | Peer-reviewed       | HIGH        |
| [D2a-S1]     | docs.github.com/en/rest/search/search                                      | Official docs       | HIGH        |
| [D2b-S16]    | docs.deps.dev/api/v3/                                                      | Official docs       | HIGH        |
| [D2c-S9]     | github.com/HackerNews/API                                                  | Official docs       | HIGH        |
| [D2c-S10]    | hn.algolia.com/api                                                         | Official service    | HIGH        |
| [D2d-S9]     | arxiv.org/abs/2412.13459 (Six Million Fake Stars)                          | Academic            | HIGH        |
| [D3a-S3]     | pmc.ncbi.nlm.nih.gov/articles/PMC11824963/ (PLOS One 2024)                 | Peer-reviewed       | HIGH        |
| [D3b-2-S3]   | martinfowler.com/bliki/StranglerFigApplication.html                        | Authoritative ref   | HIGH        |
| [D3b-2-S5]   | learn.microsoft.com/azure/architecture/microservices/model/domain-analysis | Official docs       | HIGH        |
| [D3c-S4]     | research.chalmers.se/publication/545339/ (Chalmers 2025)                   | Peer-reviewed       | HIGH        |
| [D3c-S5]     | arxiv.org/html/2501.04835v1 (Do LLMs understand patterns?)                 | arXiv preprint      | MEDIUM-HIGH |
| [D3c-S16]    | arxiv.org/html/2412.08352v1 (MSR registered report 2024)                   | arXiv/journal       | HIGH        |
| [D4a-S1]     | code.claude.com/docs/en/best-practices                                     | Official docs       | HIGH        |
| [D4b-S2]     | code.claude.com/docs/en/how-claude-code-works                              | Official docs       | HIGH        |
| [D4b-S4]     | platform.claude.com/docs/en/build-with-claude/compaction                   | Official docs       | HIGH        |
| [D4b-S5]     | anthropic.com/engineering/effective-context-engineering-for-ai-agents      | Official blog       | HIGH        |
| [D4b-S19]    | blog.jetbrains.com/research/2025/12/efficient-context-management/          | Peer research       | HIGH        |
| [D4c-S13]    | infoq.com/news/2026/01/claude-code-creator-workflow/                       | InfoQ               | HIGH        |

### Tier 2: High-Quality Community and Industry Sources

| Citation Key | Source                                             | Type                 | Trust |
| ------------ | -------------------------------------------------- | -------------------- | ----- |
| [D1a-2-S7]   | cognition.ai/blog/swe-grep (SWE-grep)              | Official blog        | HIGH  |
| [D1b-S18]    | simonwillison.net/2025/Mar/11/using-llms-for-code/ | Expert practitioner  | HIGH  |
| [D2c-S12]    | arxiv.org/html/2511.04453v1 (HN impact study)      | Academic preprint    | HIGH  |
| [D3a-S6]     | 12factor.net                                       | Official methodology | HIGH  |
| [D3c-S11]    | github.com/adamtornhill/code-maat                  | Official GitHub      | HIGH  |
| [D3c-S14]    | github.com/sverweij/dependency-cruiser             | Official GitHub      | HIGH  |
| [D4c-S4]     | github.com/hesreallyhim/awesome-claude-code        | Community list       | HIGH  |
| [D4c-S18]    | addyosmani.com/blog/code-agent-orchestra/          | Expert blog          | HIGH  |

---

## 13. Methodology

**Research approach:** 4-gap structure with an internal delta analysis (D5) as
the fifth area. Each gap was assigned 3-5 specialist searcher agents working in
parallel with distinct sub-questions. A single synthesizer (this report)
integrates all 17 findings files.

**Searcher profiles used:**

- `web`: D1a-1, D1a-2, D2c, D2d, D3b-1, D3b-2, D4a, D4c
- `docs + web`: D2a, D2b, D4b
- `academic + web`: D1c, D3a, D3c
- `codebase`: D1d, D5

**Agent count:** 17 searcher agents + 1 synthesizer = 18 total agents

**Source count:** ~200+ sources across 17 findings files (consolidated to ~28
Tier 1 sources above)

**Confidence methodology:**

- Claims appearing in multiple findings files: confidence increased one level if
  consistent
- Claims with contradictions across files: confidence capped at MEDIUM
- Claims relying on single searcher + primary source: confidence kept as
  reported by searcher
- Claims marked UNVERIFIED by searcher: kept UNVERIFIED regardless of other
  signals

**Known limitations:**

- Several primary sources were inaccessible as PDFs (Garlan 1995 original, NASA
  RRL rubric detailed criteria, Copilot Workspace sunset docs)
- Windsurf/Cognition Codemaps technical architecture not accessible (SSL issues)
- Algolia HN API operational status post-2025 archival unconfirmed
- The portability rubric (Section 4.1) is proposed, not empirically validated —
  this is explicitly noted

**Supplements:**

- Defensive lens research: `.research/repo-analysis-skill/RESEARCH_OUTPUT.md`
- This report covers the offensive lens only; adoption decisions should be
  informed by both lenses jointly
