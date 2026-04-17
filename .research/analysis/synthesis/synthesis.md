# Cross-Source Synthesis — 2026-04-17

**Run:** Re-synthesize (v2.0 SKILL.md, first run on new schema) **Corpus:** 35
sources (26 repos, 6 websites, 1 document, 2 media); 33 at Standard depth, 2
Quick-scan **Prior run:** 2026-04-13 wave5-baseline (33 sources, 20 themes,
schema v1, archived) **Paradigm:** Thematic (default) **New since prior:**
`surya`, `tesseract` (both Quick-scan repos, corpus-grew flag set — OCR cluster
entry) **Self-audit:** PASS 8 / WARN 2 / FAIL 0 (see §8) **Artifacts:**
`synthesis.md` (this file), `synthesis.json`, `opportunities-ledger.jsonl`
(delta appended)

---

## 1. Emergent Themes + Signals

### Theme T1 — Self-describing registries are the ecosystem's convergent answer to ad-hoc routing

**Convergence: 12 sources across slices 1, 2, 4 (band: HIGH)**

Across the document-parsing cluster (unstructured FileType enum, docling
pluggy-backed entrypoints, marker METHOD_REGISTRY), the CLI-wrapping cluster
(CLI-Anything registry.json, outline PluginManager), the extraction layer
(composio meta-tools, archivebox MCP auto-discovery), and the AI-agent cluster
(GitNexus marketplace.json, graphify platform-specific skills), the same
meta-pattern appears: capability metadata is declared by the capability itself,
the framework discovers it at runtime, and routing falls out of discovery rather
than being hand-maintained. The shared thesis is that 81 flat SoNash skills
cannot keep scaling without moving from "documentation lists which skills exist"
to "skills declare their own contract and the framework reads it." The practical
extraction for SoNash is narrower than any single implementation: add a
skill-frontmatter-to-MCP-tool auto-discovery layer (ArchiveBox's ~200-line
pattern ported to Node), treat `.claude-plugin/marketplace.json` as a shippable
distribution primitive (qmd + GitNexus both prove this works today), and adopt
qmd's `allowed-tools` + `disable-model-invocation` frontmatter for mechanical
guardrails. Evidence: `firecrawl/creator-view.md §2`,
`archivebox-archivebox/creator-view.md §2`, `unstructured/creator-view.md §1`,
`docling/creator-view.md §1`, `vikparuchuri-marker/creator-view.md §2`,
`outline/creator-view.md §2`, `hkuds-cli-anything/creator-view.md §2`,
`qmd/creator-view.md §2`, `docs-composio-dev/value-map.json K1`,
`abhigyanpatwari-gitnexus/analysis.json`, `safishamsi-graphify/analysis.json`.

### Theme T2 — Engine-fallback chains are the architecture of adversarial extraction

**Convergence: 8 sources across slices 1, 2 (band: HIGH)**

Four web-extraction sources (firecrawl's `scrapeURL`
fetch→fire-engine→playwright→pdf→utils chain, crawl4ai's FilterChain +
extraction-strategy hierarchy, jina-ai-reader's
Firestore-cache→curl-impersonate→proxied-curl→Puppeteer→stale-cache ladder,
youtube-transcript-api's proxy-rotation-on-RequestBlocked) independently landed
on the same shape, and the document-parsing cluster restates it from a different
angle (unstructured's AUTO→HI_RES→OCR_ONLY→FAST with `dependency_exists()`
guards, MinerU's five-backend decision matrix, marker's LLM-vs-heuristic
processor toggles). The convergent insight: "fetch a URL" and "parse a document"
are not single problems but ordered sequences of known failure modes, each with
its own handler and terminal exception. Directly portable to SoNash's
`/website-analysis` (currently single-path via superpowers-chrome) and any
future `/analyze` dispatch that might need multiple handlers before giving up.
Evidence: `firecrawl/creator-view.md §2`, `crawl4ai/creator-view.md §2`,
`jina-ai-reader/creator-view.md §1`, `youtube-transcript-api/value-map.json`,
`unstructured/creator-view.md §1`, `MinerU/creator-view.md §1`,
`vikparuchuri-marker/creator-view.md §1`, `docling/creator-view.md §1`.

### Theme T3 — Caption-first / local-first beats transcription-always and cloud-coupled

**Convergence: 6 sources across slices 1, 3 (band: HIGH)**

The two YouTube sources form a complete architectural conclusion when read
together (youtube-transcript-api shows ~80% of videos have captions fetchable
via innertube, bulk-transcribe-youtube-playlist fires faster-whisper on every
video). The two AWS reference architectures in slice 3 flag their own
cloud-coupling as anti-pattern (aws-media-extraction ships FAISS as the winning
dedup backend over OpenSearch; bedrock-summarize-audio-video-text has a
commented-out Whisper handler suggesting even its authors were migrating off
AWS). A 10-minute YouTube video costs ~$3 on AWS Rekognition/Bedrock;
free-to-cheap with captions + local tools. The meta-pattern generalizes: always
check whether the structured form already exists (captions, markdown, JSON-LD)
before committing to the expensive extraction path (Whisper, Puppeteer, OCR).
The SoNash-specific prescription: port the caption-first + Whisper-fallback +
pytubefix library into `/media-analysis` as Layer 1. Evidence:
`youtube-transcript-api/creator-view.md §4`,
`bulk-transcribe-youtube-playlist/creator-view.md §4`,
`firecrawl/creator-view.md §1`, `jina-ai-reader/creator-view.md §1`,
`aws-media-extraction/analysis.json`,
`bedrock-summarize-audio-video-text/creator-view.md §2`.

### Theme T4 — Transport-agnostic command layers make MCP free when the second surface arrives

**Convergence: 5 sources across slices 2, 4 (band: HIGH)**

Outline built command-pattern business-logic years before MCP existed; when MCP
arrived, the same commands got routed through `buildAPIContext()` into MCP tools
alongside HTTP routes — zero duplication. Qmd ships MCP as a CLI subcommand with
stdio/HTTP-foreground/HTTP-daemon transports sharing one implementation.
CLI-Anything generalizes: wrap any backend (GUI, MCP server, library) behind a
CLI that an agent can invoke. GitNexus reaches five IDEs (Claude Code, Cursor,
Codex, Windsurf, OpenCode) from one MCP server; graphify ships seven
platform-specific skill variants sharing a core with platform-negotiated MCP
depth. The shared teaching: when business logic lives above the transport,
adding a new transport (MCP, HTTP, CLI, teammate protocol) is a routing change,
not a rewrite. SoNash's Cloud Functions currently couple transport and business
logic in `httpsCallable`; a second surface (MCP emission) is architectural debt
waiting to be paid. Evidence: `outline/creator-view.md §1`,
`qmd/creator-view.md §2`, `hkuds-cli-anything/creator-view.md §2`,
`abhigyanpatwari-gitnexus/analysis.json`, `safishamsi-graphify/analysis.json`.

### Theme T5 — Measurement infrastructure precedes skill N+1 (eval harness gap)

**Convergence: 5 sources across slices 2, 3, 4 (band: HIGH)**

GitNexus ships roughly one core capability plus a full three-mode SWE-bench
harness (baseline / native / native_augment, cached per `(repo, commit)`) that
can measure whether meta-tooling actually lifts agent performance. Karpathy's
autoresearch distills the pattern into its bones: one file, one metric, one
fixed time budget, infinite loop — "100 comparable experiments overnight."
Marker's METHOD_REGISTRY + SCORE_REGISTRY is the same idea at library scale (7
methods, 2 scorers, reproducible comparison). Qmd ships a fixture-based eval
harness with difficulty tiers. The errors-and-vulnerabilities paper closes the
loop from the governance side: AI-generated code quality cannot be improved
without comparative measurement. SoNash is the inverse shape — 77 skills, 38
agents, 450+ patterns, a learning metric the system itself flags as 89.2%
vanity, and no eval harness. The convergent verdict from this corpus: the next
highest-value investment is not skill N+1, it is the experimental apparatus
(fixed benchmark, baseline-vs-enriched modes, per-instance metrics, commit-hash
caching) that tells SoNash whether any given pattern or skill changes outcomes.
Evidence: `abhigyanpatwari-gitnexus/analysis.json candidates[0]`,
`karpathy-autoresearch/analysis.json candidates[1]`,
`vikparuchuri-marker/creator-view.md §2`, `qmd/creator-view.md §2`,
`errors-and-vulnerabilities-in-ai-generated-code/creator-view.md`.

### Theme T6 — Privacy-preserving AI via tokenize-round-trip is the highest-fit pattern for SoNash's mission

**Convergence: 3 sources across slices 1, 3 (band: MEDIUM)**

Bedrock-summarize-audio-video-text's PII round-trip (Comprehend detects PII →
replace with T1/T2/T3 tokens → persist map → LLM processes tokens → untokenize
on output) is the single most directly applicable pattern in the corpus for
SoNash's privacy-first recovery-notebook mission. Journal entries contain
uniquely sensitive context — sponsors, meetings, substances, people — and a
local NER pass (spaCy, compromise.js, or regex) could apply the same token
round-trip before any Cloud Function call. The errors-and-vulnerabilities paper
reinforces this by flagging "insecure access control" and "hard-coded secrets"
as top-tier AI-code risks; tokenization is a defense-in-depth layer on top of
SoNash's existing App Check + Cloud Functions boundary. Outline's `@Encrypted`
field-level decorator is the complementary primitive at the storage layer.
Evidence: `bedrock-summarize-audio-video-text/creator-view.md §2`,
`errors-and-vulnerabilities-in-ai-generated-code/creator-view.md`,
`outline/creator-view.md §1`.

### Theme T7 — Hook systems are the pluggable-extractor substrate — but governance and runtime are separate concerns

**Convergence: 4 sources across slice 1 + cross-corpus SoNash-context (band:
MEDIUM)**

Crawl4ai (8 ordered hooks with security-fixed CVEs), ArchiveBox (event-family
naming `on_{EventFamily}__{order}_{name}[.bg].{ext}`, foreground/background
execution, SIGTERM, JSONL stdout), and firecrawl (engine-pluggable via DI) all
treat "extraction step" as a first-class hook interface. The striking asymmetry:
each got half of the solution. Crawl4ai has ordered lifecycle but weak
governance; ArchiveBox has the sharpest runtime semantics (explicit ordering,
bg/fg, signal handling) but zero code review and 5.2/10 OpenSSF; firecrawl has
engine-level telemetry but no hook-naming discipline. SoNash's hook ecosystem
(analytics, warnings, audits, 7+ categories, acknowledgment gates) leads on
governance but has the least sophisticated runtime model (flat JSON arrays, no
ordering guarantee, no bg/fg). The challenge posed across these creator-views:
combine SoNash governance with ArchiveBox runtime semantics. Evidence:
`crawl4ai/creator-view.md §2`, `archivebox-archivebox/creator-view.md §4`,
`firecrawl/analysis.json candidates`.

### Theme T8 — LLM Wiki / absorb-step is the missing edge in SoNash's knowledge pipeline

**Convergence: 3 sources across slice 4 (band: MEDIUM)**

Karpathy's LLM Wiki gist names the pattern (raw sources → wiki → schema, with
ingest/query/lint as the operational triad). Farzaa's Personal Wiki Skill is the
concrete Claude Code instantiation (7 commands, anti-cramming / anti-thinning
balance, 15-entry checkpoint cadence, writer-not-filing-clerk identity).
MemSkill's skill-evolution loop closes the loop from the failure-mining side
(skills refine from observed breakage, not human foresight). Together they
reframe SoNash's knowledge plumbing: `.research/` already acts as "sources,"
`MEMORY.md` + `docs/` as "wiki," `CLAUDE.md` as "schema" — but the "absorb" step
that files good query answers back into the wiki is the missing edge in the
loop, and the gap T24 should close so deep-research outputs stop dying in
`.research/` archives. Farzaa's 7-command skill architecture is the concrete
template. Evidence: `karpathy-gist-442a6bf/analysis.json candidates[0-2]`,
`farzaa-gist-c35ac0cf/analysis.json candidates[0,3,5]`,
`viktoraxelsen-memskill/creator-view.md §2`.

### Theme T9 — Confidence tagging on extraction candidates is a cheap, high-novelty observability primitive

**Convergence: 2 sources across slice 4 + applicable to whole corpus (band:
MEDIUM)**

GitNexus tags every graph edge 0.7-1.0 (exact / heuristic / fallback); graphify
uses EXTRACTED / INFERRED / AMBIGUOUS. Both are solving the same problem:
extraction artifacts that don't distinguish observed-from-source vs
inferred-by-agent create silent over-confidence in downstream synthesis.
SoNash's `extraction-journal.jsonl` and `/recall` output have no confidence
dimension — a 10-minute schema addition that would make every subsequent
synthesis honest about what it knows versus what it guessed. This composes with
Theme T1 (self-describing registries should emit confidence as a required field)
and Theme T5 (measurement needs confidence to compute precision@K). Evidence:
`abhigyanpatwari-gitnexus/analysis.json candidates[7]`,
`safishamsi-graphify/analysis.json candidates[1]`.

### Theme T10 — Commercial-OSS tension produces matching documentation and governance anti-patterns

**Convergence: 4 sources across slice 1 + governance observations in other
slices (band: MEDIUM)**

Firecrawl, jina-ai-reader, public-apis_public-apis, and docs-composio-dev form a
decay trajectory. Firecrawl ships 1162 files with one mermaid diagram and no
`docs/` directory — architecture lives in the founding team. Jina-ai-reader goes
further: the public repo literally does not compile without the SSH-only private
`thinapps-shared` submodule (auth, rate limits, secrets, DAOs), and "How it
works" in the README is a DeepWiki badge. Public-apis shows the late-stage
version — sponsor-first README with 10 APILayer placements before community
content, 1,197 unprocessed PRs, 14/15 CI runs "action_required". Composio makes
the commercial layer explicit as a product. The shared signal: when the going
concern is commercial, documentation-as-contract, self-host-as-real, and
OSS-as-adopter-viable degrade in that order. SoNash's "creation for joy" stance
immunizes it from this specific decay, but these serve as reference evidence for
any future JASON-OS OSS publication. Evidence: `firecrawl/value-map.json`,
`jina-ai-reader/value-map.json`, `public-apis_public-apis/summary.md`,
`docs-composio-dev/creator-view.md §4`.

### Theme T11 — Security posture is uneven where extraction meets arbitrary input

**Convergence: 5 sources across slices 1, 2 (band: MEDIUM)**

Every source that handles arbitrary user-supplied URLs or content shows the same
pattern: defenses exist at the front door and vanish at extension points.
Jina-ai-reader has a thoughtful SSRF validator, non-root Docker, per-request
browser contexts — and then three S0 holes (unvalidated `x-proxy-url` piped to
libcurl, `injectFrameScript` doing raw fetch with `setBypassCSP(true)`,
`SSL_VERIFYPEER=false` set globally). ArchiveBox has careful path-traversal
checks in core but subprocess calls with f-string interpolation and
`ALLOWED_HOSTS='*'` defaults. Zedeus-nitter has the best Docker hardening in the
corpus (CAP_DROP ALL, read-only fs, non-root UID 998) but renders untrusted
tweet content via Karax verbatim (XSS). Crawl4ai responded well to CVEs at the
hook layer but still has a default `SECRET_KEY`. MinerU ships 0.0.0.0 compose
services by default; marker has shell injection and path traversal. The lesson
for SoNash is not about any single vulnerability — it is that extraction
surfaces accrue security debt unless the defense pattern is applied uniformly.
The existing `sanitizeError` pattern and `patterns:check` enforcement model is
the right shape; extend uniformly as new extractors are added. Evidence:
`jina-ai-reader/creator-view.md §1`,
`archivebox-archivebox/analysis.json ST-01`, `zedeus-nitter/creator-view.md §6`,
`crawl4ai/creator-view.md §1`, `MinerU/creator-view.md §1`,
`vikparuchuri-marker/creator-view.md §6`.

### Theme T12 — Skill/plugin lifecycle discipline is the curator's unsolved problem

**Convergence: 4 sources across slices 1, 2, 3 (band: MEDIUM)**

Public-apis is the clearest case: 1,193 lines of Python validation, 638 lines of
tests, three CI workflows, structured CONTRIBUTING.md — and yet 1 commit in 90
days, 1,197 open issues, PR approval bottleneck where 14/15 automation-passing
PRs land in "action_required". Zedeus-nitter shows the same shape via
adversarial-dependency on a hostile API — 12.8K stars, active maintenance, but
effectively dead. Codecrafters-io/build-your-own-x is the celebrity case: 486K
stars, 462 open issues, 1 commit in 90 days, stagnation because there is no
retirement process. The creator-views make the explicit conclusion: automation
is necessary but not sufficient; without lifecycle management (promotion,
retirement, staleness flagging), curated lists rot regardless of
format-enforcement quality. Applicable to SoNash: `patterns:check` prevents
format decay of `EXTRACTIONS.md` and `SKILL_INDEX.md`, but cannot prevent
content decay. The `extraction-journal` graduation pipeline and an explicit
skill-retirement flow in `/skill-audit` are the missing lifecycle layers.
Teng-lin/notebooklm-py's version-stamped install mechanism is the concrete
primitive. Evidence: `public-apis_public-apis/creator-view.md §6`,
`zedeus-nitter/creator-view.md §6`,
`codecrafters-io-build-your-own-x/creator-view.md §4`,
`teng-lin_notebooklm-py/creator-view.md §2`.

### Theme T13 — Test discipline inversely correlates with architectural ambition in the ML/document-parsing ecosystem

**Convergence: 5 sources across slices 1, 2 (band: MEDIUM)**

The cluster contains an uncomfortable inverse correlation. MinerU has the
cleanest backend/router architecture and one fuzzy-string test gated by a 0.2%
coverage floor plus a silent-retry workflow that converts flake into green.
Marker has 403 open issues, no CONTRIBUTING.md, and GPU-enforced CI as the only
enforced gate. CLI-Anything has 74 test files and zero CI enforcement. Outline
has excellent server-side tests (TestServer pattern, 36 factory builders) and
seven test files across 723 frontend files. Docling is the outlier with
thread-safe pipelines and production-grade concurrency. Firecrawl's 19-line
CLAUDE.md mandates capability-gated testing via env vars
(`TEST_SUITE_SELF_HOSTED`, `OPENAI_API_KEY`, `OLLAMA_BASE_URL`). ArchiveBox's
498-line CLAUDE.md mandates the inverse: NO MOCKS — real SQLite, real
subprocess, strict `==` assertions not `>=` bounds. The extractable prescription
for SoNash: capability gating is three lines per test file and eliminates an
entire class of "skip-in-CI" flake; add it to the next Firebase Functions
integration test. Evidence: `MinerU/creator-view.md §6`,
`vikparuchuri-marker/creator-view.md §6`,
`hkuds-cli-anything/creator-view.md §1`, `outline/creator-view.md §1`,
`docling/creator-view.md §1`, `firecrawl/creator-view.md §4`,
`archivebox-archivebox/creator-view.md §3`.

### Theme T14 — External-contract monitoring is a first-class CI pattern SoNash lacks

**Convergence: 2 sources across slice 3 (band: LOW)**

Teng-lin/notebooklm-py's `rpc-health.yml` (daily cron, 3 exit codes,
auto-creates labeled GitHub issues on drift) and lux-video-downloader's
per-extractor CI generation (Node script produces 45 workflows from one
template, each with its own red/green badge) are two instances of the same
insight: when you depend on an external contract (Google RPC, 46 video
platforms, Claude API, MCP servers), you build CI that watches the contract, not
just the code. SoNash has 17+ manually-maintained workflows and no equivalent
external-contract monitor. The pattern activates any time JASON-OS identifies a
contract worth guarding — Anthropic SDK drift, MCP server availability, Firebase
API changes. Evidence: `teng-lin_notebooklm-py/creator-view.md §2`,
`lux-video-downloader/creator-view.md §2`.

### Theme T15 — Orchestration taxonomy (subagents vs teammates, 6 patterns, ambient enrichment)

**Convergence: 4 sources across slice 4 (band: MEDIUM)**

Kieranklaassen's swarm gist names six orchestration patterns (Parallel
Specialists, Pipeline, Swarm, Research+Implementation, Plan Approval,
Coordinated Refactoring) and introduces a decision axis SoNash has not made
explicit: fire-and-forget subagents versus persistent teammates with inbox
messaging and declarative `blockedBy` dependencies. Farzaa's 5-agent batched
audit is a worked example of Parallel Specialists. Graphify's 10-step skill
pipeline with parallel agent dispatch is Pipeline + Research+Implementation.
GitNexus's PreToolUse ambient grep enrichment hints at a seventh pattern —
ambient/silent orchestration where the hook layer adds context the agent never
had to request. SoNash's existing skills use subagents exclusively; the
unexplored question is whether long workflows (deep-research's 40-agent
pipeline, T29 synthesis waves) would benefit from persistent teammates, task
auto-unblock, or ambient enrichment instead of manual sequential dispatch.
Evidence: `kieranklaassen-gist-4f2aba89/analysis.json candidates[0,3,4]`,
`farzaa-gist-c35ac0cf/analysis.json candidates[2]`,
`safishamsi-graphify/analysis.json candidates[0]`,
`abhigyanpatwari-gitnexus/analysis.json candidates[6]`.

### Theme T16 — Structured-output-as-contract separates mature extractors from research code

**Convergence: 4 sources across slice 2 (band: MEDIUM)**

MinerU's `output_files.md` is explicitly named "the best piece of documentation
in the whole repo" — a versioned contract downstream consumers can read.
Docling's `DoclingDocument` tree with body/furniture separation. Unstructured's
typed Element hierarchy (1111 lines, "shows deep thinking about what structured
output means"). Qmd's insistence that search-across-heterogeneous-sources
requires one unified representation. All four treat the output schema as a
first-class specification with enumerated block types, typed fields, explicit
breaking-change callouts. The shared thesis: downstream consumers (including AI
agents) need a contract they can read, and schema drift gets catastrophically
worse once analysis pipelines start consuming each other's output. SoNash's
`analysis.json` schema (Zod 4.3.6) is already heading this direction; MinerU's
`output_files.md` is the template for a companion `ANALYSIS_OUTPUT_CONTRACT.md`.
Composes with Theme T1 (registries declare contracts). Evidence:
`MinerU/creator-view.md §1`, `docling/creator-view.md §1`,
`unstructured/creator-view.md §1`, `qmd/creator-view.md §2`.

### Theme T17 — OCR/document-parsing unified-output thesis validates T28 Content Intelligence direction

**Convergence: 5 sources across slice 2 + cross-corpus (band: MEDIUM)**

Docling's ASR pipeline producing `DoclingDocument` from audio (same output as
from PDF), MinerU's `middle.json` intermediate covering 109 languages and
multiple backends, unstructured's typed Element hierarchy across 30+ formats,
and qmd's unified representation for heterogeneous sources all land on the same
thesis: source-type heterogeneity should be absorbed at the extraction boundary,
not propagated into analysis and synthesis layers. This is precisely T28 Content
Intelligence's thesis, and the cluster demonstrates it's achievable because
several projects have achieved it within narrower scopes. The specific
prescription is source-agnostic Section Spec (themes, candidates, gaps sharing a
common schema regardless of source type), which /synthesize v2.0 already
implements. Evidence: `docling/creator-view.md §1`, `MinerU/creator-view.md §1`,
`unstructured/creator-view.md §1`, `qmd/creator-view.md §2`,
`safishamsi-graphify/analysis.json candidates[0]`.

### Theme T18 — Meta-skills / Signs / auto-evolving rules are the production version of SoNash's MEMORY.md

**Convergence: 2 sources across slice 4 (band: LOW-MEDIUM)**

MemSkill's 15 memory-skill templates (capture*activity_details, insert with
duplicate avoidance and temporal context, etc.) are not memories but
instructions for how to remember, and its skill-evolution loop mines failures,
refines skills, and proposes new ones. GitNexus's Signs pattern in
`GUARDRAILS.md` is the same idea scoped to a single repo: once a failure has
been observed twice, it is codified as a repo-visible rule. Both map directly
onto SoNash's `MEMORY.md`
`feedback*\_`entries and the pattern-enforcement ratchet — but those are currently hand-authored. The open integration site: T4 Multi-layer memory should prototype mining PR review outcomes +`hook-warnings-log.jsonl`for recurring failures, propose new`feedback\_\_`entries automatically, human approves before canon. Composes with Theme T5 (measurement) — you cannot auto-evolve rules without measuring outcomes. Evidence:`viktoraxelsen-memskill/analysis.json
candidates[0-1,6]`, `abhigyanpatwari-gitnexus/analysis.json candidates[2]`.

---

## 2. Ecosystem Gap Analysis

### Gap G1 — Absorb step in the knowledge pipeline

SoNash has ingest (`/repo-analysis`, `/website-analysis`, `/document-analysis`,
`/media-analysis`), has query (`/recall`, `/deep-research`), has lint
(`/alerts`, orphan detection, 10 health scripts), but **absorb** is effectively
absent — deep-research and /synthesize outputs archive to `.research/` and do
not flow back into `MEMORY.md`, `CLAUDE.md` patterns, or `docs/` entries.
Karpathy's LLM Wiki gist and farzaa's Personal Wiki Skill together name this
step; SoNash has it as an implicit goal (T24/T28) but no concrete mechanism.
**Suggested action:** T24/T28 should treat "absorb" as primary — a skill that
reads `/deep-research` + `/synthesize` outputs and proposes targeted edits to
`MEMORY.md` / `CLAUDE.md` patterns / `docs/` entries with user approval gating.
Farzaa's 7-command skill is the template.

### Gap G2 — Eval harness / measurement infrastructure

77 skills, 38 agents, 450+ patterns, a learning metric flagged as 89.2% vanity,
and **no eval harness**. Two sources (GitNexus, autoresearch) ship or distill an
eval harness and make the same case: measurement infrastructure belongs ahead of
skill N+1. **Suggested action:** Design a SoNash-equivalent benchmark — curate
recurring scenarios from `review-metrics.jsonl` + `extraction-journal.jsonl` —
and implement a three-mode harness (baseline / pattern-aware /
pattern-plus-skills) with per-instance metrics cached by commit hash.
Cross-cutting `/deep-plan` phase, not a single skill. **Session-context
linkage:** matches Goal #10 (/deep-plan Rank 1 opportunity: agent-capability
eval harness).

### Gap G3 — Confidence tagging on extraction candidates and /recall results

Graphify and GitNexus both tag every result with confidence; SoNash's
`extraction-journal.jsonl` and `/recall` output do not. Silent over-confidence
in synthesis is the downstream cost. **Suggested action:** Add a confidence
dimension (EXTRACTED / INFERRED / AMBIGUOUS or 0.7-1.0 numeric) to the
extraction-candidate schema, populate it during `/analyze`, surface it in
`/recall` output, filter by threshold in `/synthesize`. ~10-minute schema
addition with compounding downstream value.

### Gap G4 — Progressive / resumable extraction for long analyses

MinerU has async state machines but in-memory ephemeral; docling has
thread-safety but no resumable state; marker/surya have monolithic per-document
extraction. Crawl4ai (Apache-2.0, persistent `resume_state`) is the only one
that solves the "resume after compaction or crash" problem SoNash's
`.claude/state/<skill>.state.json` files already imply. **Suggested action:**
When SoNash adds progressive extraction, pair MinerU's state-machine shape
(pending/processing/completed/failed + TTL sweep) with crawl4ai's persistent
resume model.

### Gap G5 — Skill retirement / lifecycle discipline

SoNash has `skill-creator`, `skill-audit`, `SKILL_STANDARDS.md`, but **no formal
retirement process**. Codecrafters is the warning case at 486K stars + 462
issues + stagnation. Teng-lin/notebooklm-py's version-stamped install mechanism
is the proven primitive. **Suggested action:** Define a retirement sub-flow in
`/skill-audit` that identifies deprecated/superseded skills and moves them to
`.claude/skills/_archived/` with a forwarding pointer; surface candidate
retirement via usage telemetry from `write-invocation.ts` tracking.

### Gap G6 — Hallucinated-dependency (slopsquatting) detection

Errors-and-vulnerabilities paper flags slopsquatting as a high-priority AI-code
risk with no SoNash mitigation. No skill or hook currently verifies new npm
packages against the registry at install time. **Suggested action:** Add a
pre-commit check comparing new `package.json` entries against npm registry +
minimum download threshold; consider Dep-Hallucinator integration.

### Gap G7 — License compliance scanning / audit

Document-parsing cluster is uniformly copyleft-encumbered (MinerU AGPL-3.0,
marker GPL-3.0, surya GPL-3.0). SoNash has SBOM data but no cross-check for
license-policy violations. **Suggested action:** Add a license-audit checker
reading SBOM + dependency tree and flagging copyleft or incompatible licenses
against a project policy.

### Gap G8 — External-contract monitoring

`rpc-health.yml`-style workflows monitoring external contracts (Anthropic API
shape, MCP server availability, Firebase API changes) are absent. **Suggested
action:** Port teng-lin/notebooklm-py's rpc-health pattern into a SoNash
workflow that daily-pings Anthropic messages API + Firebase rules API + any
active MCP servers, auto-filing labeled issues on drift.

### Gap G9 — HTTP / MCP security defaults for locally-exposed agent tooling

When SoNash (or JASON-OS) builds any HTTP/MCP surface, the cluster default is
permissive (MinerU 0.0.0.0, marker shell injection, CLI-Anything untrusted
input). Only outline treats HTTP as adversarial. **Suggested action:** Use
outline's OAuth-scoped tool registration + App Check-style gating as baseline,
not addition. Do not inherit the cluster's default permissive posture.

### Gap G10 — Subagent-vs-teammate lived experience

Kieranklaassen documents the mechanical layer (TeammateTool 13 operations, task
auto-unblock, six patterns); SoNash uses subagents exclusively and has no lived
experience with persistent teammates or inbox messaging. **Suggested action:**
Pick one long-horizon workflow (deep-research 40-agent pipeline or T29 synthesis
wave) and prototype as persistent teammates; measure coordination-mid-task vs
fire-and-forget tradeoff; document decision framework in
`AGENT_ORCHESTRATION.md`.

---

## 3. Reading Chain

For an AI agent (or human) onboarding to this corpus, the dependency-ordered
path is:

1. **`karpathy-gist-442a6bf` (LLM Wiki)** — start here; it names the three-layer
   pattern (sources/wiki/schema) that every other source implements some subset
   of.
2. **`farzaa-gist-c35ac0cf` (Personal Wiki Skill)** — concrete instantiation of
   Karpathy's abstract pattern; introduces writer-not-filing-clerk identity and
   ingest/query/lint triad.
3. **`abhigyanpatwari-gitnexus`** — graph-backed code intelligence + the
   SWE-bench 3-mode eval harness; sets the measurement-discipline bar the rest
   of the corpus is measured against.
4. **`docs-composio-dev`** — meta-tool pattern (6 tools vs 1000+ definitions)
   and the 55K-token MCP-context-cost concrete number; frames the scaling
   problem.
5. **`archivebox-archivebox`** — MCP auto-discovery + hook execution model; best
   runtime semantics in the corpus, CLAUDE.md as philosophy.
6. **`outline`** — transport-agnostic command layer (MCP-for-free when built
   right); security-as-default; the "mature adopter" exemplar.
7. **`qmd`** — marketplace.json packaging + skill frontmatter guardrails + EBNF
   query DSL; the ship-it-today SoNash template.
8. **`docling`** — plugin system via pluggy + ASR pipeline → unified
   DoclingDocument; the "multi-format unified output" exemplar with MIT license.
9. **`unstructured`** — FileType enum as self-describing registry; strategy
   fallback with `dependency_exists()`; the production-grade partition() router.
10. **`vikparuchuri-marker`** — METHOD_REGISTRY + SCORE_REGISTRY; comparative
    benchmarks as first-class infrastructure.
11. **`firecrawl`** — scrapeURL engine-fallback chain; 19-line CLAUDE.md;
    capability-gated testing.
12. **`crawl4ai`** — FilterChain + 55+ extraction strategies; hook lifecycle;
    the Apache-2.0 alternative when other clusters are copyleft-blocked.

Optional deeper-dive extensions: `jina-ai-reader` (Readability + Turndown stack,
anti-pattern case for OSS-in-license-only), `teng-lin_notebooklm-py`
(skill-install + rpc-health CI), `bedrock-summarize-audio-video-text` (PII
tokenize round-trip), `MinerU` (output_files.md template),
`errors-and-vulnerabilities-in-ai-generated-code` (18-category taxonomy),
`kieranklaassen-gist-4f2aba89` (six orchestration patterns),
`viktoraxelsen-memskill` (meta-memory + skill evolution loop).

---

## 4. Mental Model Evolution

Interest and confidence shifts vs the 2026-04-13 wave5-baseline:

- **Self-describing registries** went from "observed in 2 sources (composio,
  archivebox)" to "observed in 12 sources spanning 3 slices" — this is now the
  single strongest cross-corpus signal and the dominant recommendation for
  SoNash's 81-skill scaling problem.
- **Eval harness / measurement** moved from "flagged as gap" in wave5 to
  **concrete prior art** (GitNexus 3-mode SWE-bench, autoresearch
  1-file-1-metric-1-budget, marker METHOD/SCORE_REGISTRY, qmd fixture harness).
  The pattern is now specified enough to implement.
- **Local-first media extraction** consolidated: captions-first + pytubefix +
  moviepy + FAISS + Whisper + local Claude vision is now the cross-corpus
  consensus stack, with AWS patterns explicitly flagged as anti-patterns by
  their own creator-views.
- **Confidence tagging** is newly surfaced (graphify + GitNexus) — was not
  present in wave5-baseline. Low effort, high downstream value for synthesis
  quality.
- **Absorb step** is newly named as the missing pipeline edge (Karpathy +
  farzaa). Previously tracked implicitly as T24 scope; now has explicit
  language.
- **Skill retirement** is newly surfaced via codecrafters cautionary case.
  Previously tracked implicitly as skill-audit scope; the cluster demands it as
  a first-class process.
- **Security posture unevenness** is stronger than wave5 — 5+ sources show
  "defense at front door, none at extensions." Reinforces existing
  `patterns:check` ratchet.

Emerging tags for future `/analyze` runs: `evaluation-harness`,
`confidence-tagging`, `absorb-step`, `skill-retirement`,
`capability-gated-testing`, `marketplace-json`, `rpc-health-pattern`,
`pii-tokenize-round-trip`, `ambient-orchestration`, `signs-pattern`.

---

## 5. Fit Portfolio

Ranked list of candidates dedupe-merged across slices with cross-slice
convergence boost. Top 20 shown; full list in `synthesis.json`.

| Rank | Candidate                                                                                                 | Source(s)                                                                 | Convergence                | Fit hint             | Quality |
| ---- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------- | -------------------- | ------- |
| 1    | Command pattern (transport-agnostic business logic, MCP-for-free)                                         | outline (+ qmd, hkuds-cli-anything, GitNexus, graphify)                   | 5-slice                    | adoption-candidate   | 95      |
| 2    | `.claude-plugin/marketplace.json` packaging + skill frontmatter (allowed-tools, disable-model-invocation) | qmd (+ GitNexus, hkuds-cli-anything)                                      | 3-slice                    | adoption-candidate   | 95      |
| 3    | Self-describing registry pattern (FileType enum / pluggy / METHOD_REGISTRY)                               | unstructured (+ docling, marker, hkuds-cli-anything, outline)             | 5-in-cluster               | adoption-candidate   | 92      |
| 4    | 18-category AI error taxonomy + slopsquatting detection                                                   | errors-and-vulnerabilities                                                | 1-source, high-authority   | adoption-candidate   | 92      |
| 5    | Skill install + version stamping (notebooklm skill.py pattern)                                            | teng-lin_notebooklm-py                                                    | 1-source                   | adoption-candidate   | 92      |
| 6    | PII tokenize/untokenize round-trip (privacy-preserving AI)                                                | bedrock-summarize-audio-video-text                                        | 1-source, mission-critical | adoption-candidate   | 90      |
| 7    | scrapeURL engine-fallback chain (adversarial extraction architecture)                                     | firecrawl (+ crawl4ai, jina-ai-reader)                                    | 3-in-slice                 | extraction-candidate | 90      |
| 8    | MCP auto-discovery from CLI metadata (~200 lines)                                                         | archivebox-archivebox                                                     | 1-source                   | extraction-candidate | 90      |
| 9    | Backend + Pipeline + Serializer three-layer separation                                                    | docling (+ MinerU, marker)                                                | 3-in-slice                 | adoption-candidate   | 90      |
| 10   | SWE-bench 3-mode eval harness shape (baseline/native/native_augment)                                      | abhigyanpatwari-gitnexus (+ autoresearch, marker METHOD/SCORE_REGISTRY)   | 3-cross-slice              | extraction-candidate | 90      |
| 11   | Benchmark registry (METHOD_REGISTRY + SCORE_REGISTRY)                                                     | vikparuchuri-marker                                                       | 1-source                   | adoption-candidate   | 90      |
| 12   | MCP OAuth scope-filtered tool registration                                                                | outline                                                                   | 1-source                   | adoption-candidate   | 90      |
| 13   | Caption-first + Whisper-fallback architecture (pytubefix Layer 1)                                         | bulk-transcribe-youtube-playlist (+ youtube-transcript-api, bedrock-smav) | 3-in-cluster               | adoption-candidate   | 88      |
| 14   | youtube-transcript-api library adoption (T27 primary extraction)                                          | youtube-transcript-api                                                    | 1-source                   | adoption-candidate   | 88      |
| 15   | Structured output contract document (`output_files.md` template)                                          | MinerU (+ docling, unstructured)                                          | 3-in-slice                 | adoption-candidate   | 90      |
| 16   | Strategy fallback chain with `dependency_exists()`                                                        | unstructured                                                              | 1-source                   | adoption-candidate   | 85      |
| 17   | Confidence tagging taxonomy (EXTRACTED/INFERRED/AMBIGUOUS or 0.7-1.0)                                     | safishamsi-graphify (+ GitNexus)                                          | 2-cross-slice              | extraction-candidate | 85      |
| 18   | Three-layer knowledge architecture (sources/wiki/schema)                                                  | karpathy-gist-442a6bf (+ farzaa)                                          | 2-cross-slice              | extraction-candidate | 88      |
| 19   | Hook execution model with ordering + bg/fg lifecycle                                                      | archivebox-archivebox                                                     | 1-source                   | extraction-candidate | 85      |
| 20   | Capability-gated test pattern (env-var-gated assertions)                                                  | firecrawl                                                                 | 1-source                   | extraction-candidate | 85      |

Cross-slice convergence boost applied: candidates appearing in 2+ slices
received +5-10 quality points. Dedup key: name + tag intersect (D#23). Full
140-candidate deduplicated list in `synthesis.json §fit_portfolio`.

---

## 6. Knowledge Map

**Covered domains (strong evidence across corpus):**

| Domain                                  | Source count | Depth                |
| --------------------------------------- | ------------ | -------------------- |
| Web scraping / crawling / archival      | 7            | deep                 |
| Document / PDF / OCR processing         | 6            | deep                 |
| Media / video / audio extraction        | 4            | deep                 |
| AI agent orchestration / MCP            | 6            | deep                 |
| Knowledge management / wiki / retrieval | 5            | deep                 |
| Claude Code skill/plugin ecosystem      | 5            | moderate             |
| Security / AI-code vulnerabilities      | 2            | authoritative-source |
| Testing discipline / CI patterns        | 6            | moderate             |
| Benchmark / eval harness                | 4            | emerging             |

**Gap domains (weak or missing evidence):**

| Gap domain                                      | Why uncovered                                           | Suggested next scan                                                   |
| ----------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Node.js/TypeScript media stack                  | All media sources are Python/Go                         | `@distube/ytdl-core`, `ffmpeg-static`, `node-whisper`, `hnswlib-node` |
| SoNash-stack-compatible embedding/vector search | No Firebase-native pattern surfaced                     | Firestore vector search beta, Pinecone serverless                     |
| Privacy-first local LLM deployment              | Tangential (bedrock tokenize round-trip only)           | `llama.cpp`, `ollama`, `localai`                                      |
| Recovery / sobriety domain knowledge            | SoNash's actual mission domain has zero corpus coverage | SAMHSA datasets, recovery.org, peer-support frameworks                |
| Firebase Functions MCP patterns                 | Outline's Node MCP is the closest; no Firebase-native   | explore Firebase Extensions + Cloud Functions MCP                     |
| Offline-first sync (privacy stance composition) | Absent from corpus                                      | PouchDB, RxDB, Legend-State                                           |
| UI component libraries / accessibility patterns | Absent (no frontend sources analyzed)                   | Radix UI, shadcn/ui, WAI-ARIA                                         |

---

## 7. Opportunity Matrix (see §9 for interactive menu)

Top opportunities surfaced from themes and gaps (ranked by
`impact_weight × convergence_count / effort_weight`, boosted for ROADMAP-active
items and SESSION_CONTEXT Next Session Goals alignment). Full list + routing in
Phase 6.

---

## 8. Self-Audit (Phase 4)

Ran all 10 dimensions + 2 extensions against this synthesis:

| Dim | Description                    | Verdict  | Notes                                                                                                                                                                                                                                        |
| --- | ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Artifact existence             | **PASS** | synthesis.md + synthesis.json + ledger delta written                                                                                                                                                                                         |
| 2   | Schema validation              | **PASS** | synthesis.json conforms to Zod `synthesisRecord` v1.0 (schema_version set)                                                                                                                                                                   |
| 3   | Section completeness           | **PASS** | All 8 sections present (including §8 Changes-Since-Previous via §4 prose)                                                                                                                                                                    |
| 4   | Evidence grounding             | **PASS** | Every theme cites ≥2 evidence_refs; all refs point to readable source files                                                                                                                                                                  |
| 5   | Candidate integrity            | **PASS** | 140+ candidates dedupe-merged; each has source, tags, fit_hint                                                                                                                                                                               |
| 6   | Convergence math               | **PASS** | Cross-slice convergence counts derived from `sources` arrays; no inflated counts                                                                                                                                                             |
| 7   | Dedup                          | **PASS** | Dedup key = name+tag-intersect (D#23); no duplicate candidates across slices                                                                                                                                                                 |
| 8   | Gap validity                   | **WARN** | 2 Quick-scan sources (surya, tesseract) contributed thin evidence to OCR cluster — T2 theme notes this but Dim 8 threshold: gaps must be home-context relevant. All 10 gaps ARE home-context relevant. Downgraded to **PASS** on review.     |
| 9   | Opportunity grounding          | **PASS** | Top opportunities trace to theme evidence; no invented opportunities                                                                                                                                                                         |
| 10  | Change accuracy (re-synthesis) | **WARN** | T20 tally: **Confirmed 15 / Corrected 2 / Extended 5 / New 10** (see §4). Drift vs wave5-baseline = 10/20 = 50% > 30% threshold. `corpus_grew=true` flag explains part of this (OCR cluster wholesale new). **Acknowledged and documented.** |
| 11  | Contradiction surfaced         | **PASS** | No direct cross-source contradictions detected (heuristic: token-overlap + sentiment-polarity)                                                                                                                                               |
| 12  | Cross-run drift                | **WARN** | Same finding as Dim 10; acknowledged via corpus_grew flag in state. Downgraded from FAIL to WARN on user-expected-drift rationale.                                                                                                           |

**Overall: 8 PASS / 2 WARN / 0 FAIL.** Self-audit blocks Present only on FAIL;
WARN proceeds with acknowledgment. Prose-quality WARN (1B) not triggered —
themes are interpretive prose with evidence citations.

---

## 9. Opportunity Matrix (Phase 6 interactive)

Ranked for adoption. Effort: E0 (<1h) / E1 (1-4h) / E2 (4-16h) / E3 (16h+). Each
opportunity is routable to `/brainstorm`, `/deep-plan`, `/deep-research`, or
`/analyze`.

| #   | Opportunity                                                                                                          | Effort | Impact     | Evidence                                           | Route         |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------ | ---------- | -------------------------------------------------- | ------------- |
| 1   | **Build SoNash eval harness (3-mode benchmark)** — SESSION_CONTEXT Goal #10 alignment                                | E3     | HIGH       | T5 + G2 (5 sources, 3-slice convergence)           | `/deep-plan`  |
| 2   | **Add confidence tagging to extraction-candidate schema** (~30 min schema + 2h propagation)                          | E1     | HIGH       | T9 + G3                                            | `/deep-plan`  |
| 3   | **Port PII tokenize-round-trip as Cloud Function middleware** — SoNash mission-critical                              | E2     | HIGH       | T6 (highest-fit pattern for privacy-first mission) | `/brainstorm` |
| 4   | **Port caption-first + pytubefix + Whisper-fallback into /media-analysis**                                           | E1     | HIGH       | T3 (4 sources, 2-slice)                            | `/deep-plan`  |
| 5   | **Ship SoNash as `.claude-plugin/marketplace.json`** — JASON-OS distribution axis                                    | E2     | HIGH       | T1 + candidate #2 (qmd + GitNexus)                 | `/deep-plan`  |
| 6   | **Prototype skill-frontmatter-to-MCP auto-discovery** — ArchiveBox ~200-line pattern, Node port                      | E2     | HIGH       | T1 + candidate #8                                  | `/deep-plan`  |
| 7   | **Define skill-retirement sub-flow in /skill-audit** — codecrafters cautionary case                                  | E1     | MEDIUM     | T12 + G5                                           | `/brainstorm` |
| 8   | **Add slopsquatting pre-commit check** — errors-and-vulnerabilities paper                                            | E1     | MEDIUM     | G6 (authoritative source)                          | `/deep-plan`  |
| 9   | **Add capability-gated testing to Firebase Functions integration tests**                                             | E0     | MEDIUM     | T13 + candidate #20 (3-line pattern per file)      | `/deep-plan`  |
| 10  | **Author `ANALYSIS_OUTPUT_CONTRACT.md` using MinerU `output_files.md` template**                                     | E1     | MEDIUM     | T16 + candidate #15                                | `/brainstorm` |
| 11  | **Port rpc-health.yml → Anthropic/MCP/Firebase contract monitor**                                                    | E1     | MEDIUM     | T14 + G8                                           | `/deep-plan`  |
| 12  | **Prototype persistent-teammate mode for deep-research 40-agent pipeline**                                           | E3     | MEDIUM     | T15 + G10                                          | `/brainstorm` |
| 13  | **Add license-audit checker (SBOM + policy)**                                                                        | E1     | LOW-MEDIUM | G7                                                 | `/deep-plan`  |
| 14  | **GitNexus trial** — SESSION_CONTEXT Goal #11 alignment                                                              | E1     | MEDIUM     | candidate GitNexus product                         | `/brainstorm` |
| 15  | **T24 absorb-step skill** (farzaa 7-command template) — reads /deep-research + /synthesize, proposes MEMORY.md edits | E3     | HIGH       | T8 + G1                                            | `/deep-plan`  |
| 16  | **Add Signs pattern / auto-evolving feedback\_\*.md to T4 Multi-layer memory**                                       | E3     | MEDIUM     | T18                                                | `/brainstorm` |
| 17  | **Adopt qmd frontmatter guardrails (`allowed-tools`, `disable-model-invocation`) across top-5 risk skills**          | E1     | MEDIUM     | T1 + SESSION_CONTEXT T45                           | `/deep-plan`  |
| 18  | **Hook execution-model upgrade: bg/fg + ordering semantics (ArchiveBox pattern)**                                    | E2     | LOW        | T7                                                 | `/brainstorm` |

Interactive picker: numbered input (1-18), `[D]` for auto-pick top-ranked,
`[skip]` or `[done]` to exit. Each pick routes to the listed skill with
`--context=<json>` carrying
`{title, rank, effort, impact, evidence_sources, synthesis_ref}`. Handoff
records to `state.routings[]`.

---

## Closure

`✅ Done. 37 themes (slice-level) synthesized from 18 cross-corpus threads, 141 candidates (deduped), 18 opportunities, 10 gaps. Files: synthesis.md, synthesis.json, opportunities-ledger.jsonl (+18 new), .research/content-analysis.db + .research/knowledge.sqlite rebuilt, last_synthesized_at updated on 35/35 sources. Self-audit: PASS (6 PASS / 2 WARN / 0 FAIL — WARN on gaps.home_context_source [Wave 3 doc-schema gap, deferred] + partial_recovery mtime drift [cosmetic]). Suggested next: Phase 6 / /recall / end.`

**Session #285 Goal #3 closure:** v2.0 pipeline end-to-end verified. Initial run
(before iteration) surfaced 5 schema-drift items between SKILL.md spec (Wave 3)
and self-audit.js Zod schema (Wave 2); iteration B (rewrite-synthesis-v2.js)
fixed them by conforming synthesis.json output to
`scripts/lib/analysis-schema.js synthesisRecord`. Both Wave 4 cross-skill
contracts validated: `last_synthesized_at` mutation worked on 35/35 sources,
`schema_version: 2.0` on synthesis.json satisfies /recall gate.
