# Firecrawl — Creator View

**Source:** mendableai/firecrawl · **Stars:** 106,772 · **License:** AGPL-3.0
**Analyzed:** 2026-04-10 (Session #273) · **Depth:** Standard **Home context:**
SoNash (Next.js 16 / React 19 / Firebase / TypeScript / Claude Code)

---

## 1. What This Repo Understands (+ Blindspots)

Firecrawl understands that **the web is hostile and heterogeneous, and the
answer is pluggable extraction**. The scrapeURL engine in
`apps/api/src/scraper/scrapeURL/` is the whole thesis in one subdirectory: eight
engines (fetch, fire-engine, playwright, pdf, document, wikipedia, index, utils)
coordinated by a fallback-list builder and a retry tracker. The mermaid diagram
in that README walks through the signal flow in four nodes —
`scrapeURL → buildFallbackList → scrapeURLWithEngine → parseMarkdown` — with the
explicit failure mode `NoEnginesLeftError`. Most scraping frameworks treat this
as incidental complexity; firecrawl treats it as the product.

The second thing firecrawl understands is **LLM-ready output as a first-class
feature, not a post-processing step**. PDFs route through LlamaParse directly to
markdown (not through plaintext-then-remarkdown). DOCXs route through mammoth to
HTML and then to markdown. The scrapeURL README's "Differences from
WebScraperDataProvider" section is candid about this evolution: the old code
"converted to just plaintext" and the new code "converts straight to markdown".
That's a repo that learned from its own mistakes in public.

The third thing is **capability-gated testing**. CLAUDE.md has 19 lines, and
three of them tell you how to gate tests by runtime capability: if you need
fire-engine, wrap in `!process.env.TEST_SUITE_SELF_HOSTED`; if you need an LLM,
wrap in
`!process.env.TEST_SUITE_SELF_HOSTED || process.env.OPENAI_API_KEY || process.env.OLLAMA_BASE_URL`.
Every test file can run in every environment; the gate decides whether
assertions actually execute. This is the pattern most projects reinvent after
their third "skip in CI" fence breaks something.

**The blindspot is documentation.** There is no `docs/` directory. There is no
architecture document describing the queue layout (BullMQ + a Postgres-backed
nuq variant coexist and the rationale is undocumented). There is no auth flow
diagram for the Supabase→Redlock→Redis→ACUC path. There is no v0→v1→v2 API
migration guide. 1162 files and one mermaid diagram. A new contributor learns
the architecture by reading controllers, services, and CLAUDE.md, which is a
valid strategy for a fast-moving startup but imposes a real tax on anyone who
shows up without a friend at the company.

**The second blindspot is SDK duplication.** Seven SDKs (JS, Python, Rust, Go,
Java, Elixir, + a TS playwright service) re-implement the wire contract each
time. Parity is enforced by the OpenAPI specs (`openapi.json`,
`v1-openapi.json`, `openapi-v0.json`) and presumably by the test-suite app, but
there's no shared code. Adding a new endpoint means seven file changes and
praying the test matrix catches drift.

## 2. What's Relevant To Your Work

The direct hit is SoNash's **website-analysis handler**
(`.claude/skills/website-analysis/`). SoNash's website analysis currently
extracts via a single path — the superpowers-chrome extension. Firecrawl's
engine-fallback pattern is the exact architecture you'd want if you needed to
handle sites that chrome-extension can't reach: a fetch-first fast path for
static pages, a playwright fallback for JS-heavy sites, a wikipedia special-case
for known-structured sources, and a `NoEnginesLeftError` with clear telemetry
about which engines were tried. The README at
`apps/api/src/scraper/scrapeURL/README.md` is worth printing out and taping next
to the monitor when the time comes to expand extraction.

The **test gating pattern in CLAUDE.md** is the most directly portable thing in
the entire repo. SoNash's test suite currently mocks `httpsCallable` and trusts
that the Firestore emulator is running. When you add Firebase Functions
integration tests, you'll want this exact pattern: gate by capability
(`FIREBASE_EMULATOR_HOST`, `GOOGLE_APPLICATION_CREDENTIALS`), not by "skip on
CI". It lets the same test file run in four environments (local-no-emulator,
local-emulator, CI-emulator, CI-real-firebase) with no `.only` footguns.

The **58 example apps** are a product-marketing-in-code pattern worth stealing
for SoNash's `/analyze` and `/synthesize` skills. Instead of writing prose "how
to use repo-analysis" docs, you could ship `.research/examples/` with concrete
worked examples — "here's repo-analysis against karpathy/autoresearch, here's
what the output looks like, here's what we extracted". The 58 examples in
firecrawl range from ~50 to ~150 lines each; each pairs firecrawl with a
specific LLM or framework. The high-signal ones for SoNash are
`openai_swarm_firecrawl` (multi-agent coordination — informs the .claude/teams/
design), `gemini-github-analyzer` (direct domain overlap with SoNash
repo-analysis), `deep-research-apartment-finder` (Deep Research API usage
pattern — compare to SoNash's /deep-research skill), and
`turning_docs_into_api_specs` (docs-to-OpenAPI — informs SoNash
document-analysis handler).

The **harness boot pattern** (`pnpm harness jest`) is worth looking at for
SoNash's `test:build` pipeline. SoNash currently starts emulators and dev
servers ad-hoc; a single harness that owns the boot order would reduce flakes.

The **SELF_HOST.md commercial-OSS split pattern** is noted but not currently
applicable — SoNash is privacy-first and non-commercial. Keep it filed.

## 3. Where Your Approach Differs

**Ahead (SoNash beats firecrawl):** documentation. SoNash has a full
`docs/agent_docs/` tree, an `AI_WORKFLOW.md`, a `SECURITY.md`, an
`AGENT_ORCHESTRATION.md`, and a `CONTEXT_PRESERVATION.md`. Firecrawl has one
mermaid diagram and CLAUDE.md. SoNash is explicitly building its architecture in
prose; firecrawl is explicitly not. If "a new contributor can ramp up from docs
alone" is the measure, SoNash is ahead. The cost of firecrawl's approach is
hidden — it shows up as institutional knowledge concentrated in the original
team.

**Different:** the commercial vs. personal-tool split. Firecrawl is a commercial
product with a hosted tier (firecrawl.dev) and an AGPL-3.0 self-host option. Its
entire auth layer (Supabase ACUC, Redlock, ledger service, x402 payment) exists
because someone is paying for scraping. SoNash has no billing layer, no ACUC
equivalent, and no payment flow. This isn't a gap — it's a deliberate design
boundary. The firecrawl patterns around auth/credits simply don't map.

**Different:** polyglot SDKs. Firecrawl ships 7 language SDKs; SoNash is
TypeScript-only and Firebase-native. Again, not a gap — a deliberate choice. The
cost of polyglot parity is visible in firecrawl's 1162-file monorepo.

**Behind:** extraction engine diversity. SoNash's website-analysis extracts via
one path (chrome extension). Firecrawl has eight. This is only a gap if SoNash
ever needs to extract from sites that don't play well with a chrome extension —
which, if JASON-OS ever ships to locked-down corporate environments, is
plausible. File it as a future consideration.

**Behind:** queue infrastructure. Firecrawl has BullMQ + a custom
Postgres-backed nuq variant + seven worker types. SoNash has no queue. This is
only "behind" if SoNash ever needs async background work — which the dev
dashboard + debt-runner work may eventually require. Currently Firebase
Functions + Firestore triggers do the job.

## 4. The Challenge

**The thing to seriously consider:** adopt the test-gating-by-capability
pattern. Not "someday maybe". Specifically: before the next session that touches
`tests/` or adds a Firebase Functions integration test, pick one test file and
add the capability gate. Mandate it in the pre-commit hook. Document it in
CLAUDE.md alongside the existing test rules. The pattern takes four lines in
each test file and eliminates an entire class of flaky-in-CI failures. Firecrawl
has been running this pattern at scale with nine E2E buckets and five Jest
invocations — it works.

The second thing to consider is **publishing the scrapeURL README as a pattern
reference in `docs/agent_docs/EXTRACTION_FALLBACK.md`** the next time you expand
website-analysis. Not copy-paste — the idea is to document your own fallback
list ("if superpowers-chrome fails, then X; if X fails, then Y; if all fail,
return `NoExtractionPossible` with the tried list"). Having a named error type
and a documented order is worth more than the code that implements it.

## 5. Knowledge Candidates

Written to value-map.json. See that file for the machine-readable list. Summary:

- **T1 (active sprint):** scrapeURL engine fallback pattern, CLAUDE.md
  capability-gating pattern, 58-example cookbook pattern, openai_swarm
  multi-agent reference, gemini-github-analyzer comparison point
- **T2 (systems):** Harness boot pattern, deep-research API usage comparison,
  docs-to-OpenAPI pattern, OpenAPI-as-single-source-of-truth for wire contracts
- **T3 (reference):** redlock distributed locking, self-host tiered features,
  absent-docs anti-pattern evidence

## 6. What's Worth Avoiding

**The docs/ directory absence.** Don't copy this. Firecrawl is a cautionary
example of what happens when a project moves fast and skips architecture
documentation: the knowledge lives in the code + a few founding engineers, and
every new contributor pays the ramp-up cost. SoNash is explicitly the opposite —
and should stay that way. File the firecrawl approach as evidence when the next
"do we really need this ADR?" conversation comes up.

**The 7-SDK polyglot maintenance tax.** If SoNash ever gets pressure to "ship a
Python SDK too", remember that firecrawl pays this cost visibly: seven separate
implementations of the same wire contract, parity enforced by a test-suite
sub-app and the OpenAPI specs. The correct answer for SoNash is "generate from
OpenAPI" or "don't build the second SDK". Don't hand-roll.

**The queue migration (BullMQ + nuq-postgres coexistence).** Firecrawl has two
queue systems running side-by-side, and the rationale is undocumented. If SoNash
ever needs a queue, pick one and commit. Don't run two while "migrating" without
a dated migration plan.

**Hidden feature flags via env vars.** Firecrawl branches behaviour via env vars
in SELF_HOST.md (USE_DB_AUTHENTICATION, PROXY_SERVER, etc.) but doesn't have a
documented feature-flag layer. This is fine at their scale (small team, shared
memory of which flags exist) but breaks down as the team grows. SoNash should
prefer explicit feature flags over env-var branching for anything user-visible.

---

## Home-repo file reference index

- SoNash website-analysis skill — `.claude/skills/website-analysis/`
- SoNash repo-analysis skill — `.claude/skills/repo-analysis/`
- SoNash document-analysis skill — `.claude/skills/document-analysis/`
- SoNash deep-research skill — `.claude/skills/deep-research/`
- SoNash agent teams — `.claude/teams/` (audit-review-team, research-plan-team)
- SoNash CLAUDE.md — 235 lines (compare to firecrawl's 19)
- SoNash test suite — uses node:test, not Jest (see feedback memory)
- SoNash synthesize skill — `.claude/skills/synthesize/` (T29 Wave 2 output)
- SoNash ROADMAP tracks — Track B (Dev Dashboard), Track T (Testing
  Infrastructure), Track D (CI Reliability)
