# Home Context Brief for /synthesize Subagents

**Written:** 2026-04-13 (Session #277, Wave 5) **Scope:** what each agent needs
to know about SoNash / JASON-OS / T28-T29 CAS to judge "relevance-to-home" for
themes, candidates, and gaps. Keep this file small — if an agent needs more
detail on a specific area, it can read the referenced files directly.

---

## SoNash — the product

- **SoNash = Sober Nashville.** A recovery-notebook web app for the sobriety
  community. Single-tenant per-user. NOT a multi-tenant SaaS.
- **Stack:** Next.js 16.2 (App Router), React 19.2, Firebase 12.10 (Firestore +
  Auth + App Check + Functions + Hosting), Zod 4.3, Tailwind 4.2, TypeScript
  strict.
- **Architecture:** Repository pattern (`lib/firestore-service.ts`). Mutations
  go through Cloud Functions (`httpsCallable`) — NO direct Firestore writes from
  client. App Check enforced.
- **What SoNash does NOT currently need:** multi-service OAuth orchestration,
  sandboxed tool execution, multi-tenant isolation, pricing tiers,
  webhook/trigger ecosystems, white-label branding.
- **Engineering posture:** heavy emphasis on pattern compliance, error
  sanitization, path traversal guards, JSONL safety, hook governance, pre-commit
  gates. See `CLAUDE.md` §5 (Critical Anti-Patterns).

## JASON-OS — the meta-tooling project

- **JASON-OS** = a portable "Claude Code OS" the user is building _alongside_
  SoNash. Research-driven, 16-domain roadmap, 3 tiers of domains (infrastructure
  / capability / experience).
- **Domain 02a — MCP infrastructure** is actively being researched. Sources
  analyzed in this corpus that intersect: outline (production MCP server with
  OAuth scope filtering), docs-composio-dev (meta-tool architecture over 1000+
  toolkits + native vs MCP tradeoff), docling (docling-mcp), archivebox
  (zero-schema MCP server from CLI introspection).
- **User's orchestration style:** no-code orchestrator. Builds through AI
  orchestration. Values meta-tooling patterns over end-product code. Creates for
  joy, not shipping — frame findings as craft/exploration, not MVP/delivery.

## T28 — Content Analysis System (CAS)

- **T28** unified 4 handler skills: `/repo-analysis`, `/website-analysis`,
  `/document-analysis`, `/media-analysis`, under a single router `/analyze` with
  shared `scripts/cas/` tooling.
- **Canonical data:** extraction-journal.jsonl (318 entries, mostly `defer` —
  see below), per-source `analysis.json` (UUID ids, v3.0 Zod), per-source
  `value-map.json` (candidates), `creator-view.md` (6-section prose per source).
- **Shared conventions:** `.claude/skills/shared/CONVENTIONS.md` §13 (Handler
  Output Contract), §14 (Tagging), §16 (Pipeline Tail), §17 (Synthesis).

## T29 — /synthesize (this skill) — and where Wave 5 sits

- **Wave 5 = THIS synthesis run.** First-time synthesis of the full corpus.
- Preceded by: Wave 4 Step 10 (batch-upgraded 10 quick-scan repos to Standard);
  Step 10.5 (full-corpus audit — 31 sources, 8 categories of fixes, 13 commits,
  self-audit expansion).
- **Every candidate in the DB is currently deferred.** Per user statement: "I
  haven't acted on or synthesized any of them yet. I've been refining the
  process." So synthesis is the consolidation pass that tells the user what to
  act on FIRST.

## What agents should optimize for

1. **Themes that converge across source types.** A pattern seen in repo +
   website + document is a strong signal. A pattern in one repo is weak.
   Convergence counts matter.
2. **Candidates that connect to JASON-OS Domain 02a (MCP), meta-tooling, or
   hook/skill governance.** These have the highest home-relevance right now.
3. **Gaps = domains present in home context (SoNash / JASON-OS) but MISSING from
   the analyzed corpus.** Examples: recovery-community UX patterns
   (SoNash-relevant, no sources); Firebase-specific architecture (no sources).
4. **Anti-patterns that match SoNash's existing anti-pattern guardrails.**
   Confirm or challenge `CLAUDE.md` §5 patterns (error sanitization, path
   traversal, test mocking, exec() /g, regex two-strikes).

## What agents should NOT do

- **Do NOT re-analyze sources.** Read the handler outputs that exist
  (`analysis.json`, `creator-view.md`, `value-map.json`, etc.). Don't re-derive
  from source.
- **Do NOT synthesize across YOUR slice.** Return per-source extractions and
  initial clusters. Final synthesis is inline in the parent.
- **Do NOT cap candidates or themes.** Maximum thoroughness. User explicitly
  values surface area over brevity.
- **Do NOT invent.** Evidence-grounded only. Every theme/candidate/gap must
  trace to a specific source artifact.

## Reference files agents may read if needed

- `.claude/skills/shared/CONVENTIONS.md` — shared schemas + tagging
- `CLAUDE.md` — behavioral guardrails + anti-patterns
- `.research/research-index.jsonl` — deep-research topic history
- `.research/tag-vocabulary.json` — canonical tag list (T40 output)
- `docs/agent_docs/` — project-internal documentation

## Don't-read files

- `node_modules/`, `functions/node_modules/` — dependencies
- `.git/` — version control internals
- `.research/cas-index.sqlite` — derived index
- Other sources' creator-view.md / deep-read.md **outside your slice** — that's
  another agent's job
