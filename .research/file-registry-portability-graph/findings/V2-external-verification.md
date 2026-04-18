# V2: External/Web Verification

**Date:** 2026-04-17 **Verifier:** V2 (external/web claims) — completed inline
after agent write truncation **Scope:** External claims in claims.jsonl
referencing tools, packages, licenses, URLs, maintainer status, version numbers,
metrics

---

## Summary

35 claims checked. **22 VERIFIED**, **1 REFUTED**, **5 PARTIALLY VERIFIED**, **4
UNVERIFIABLE**, **2 PARTIALLY REFUTED**, **1 CONFLICTED**.

---

## Critical Verdicts (rec-flipping check)

**None of the critical verdicts flip the Option B recommendation. Two add
nuance.**

1. **C-076 (KuzuDB abandoned Oct 2025): VERIFIED** — The Register article Oct 14
   2025 confirms abandonment by Kuzu Inc. Community forks exist but are immature
   or different architecture (LadybugDB is object-storage focused). KuzuDB risk
   for CodeGraphContext on Windows is validated. Recommendation NOT flipped, but
   CodeGraphContext candidacy is downgraded in the ranked list.

2. **C-072/C-073/C-074 (`@optave/codegraph`): PARTIALLY VERIFIED** — Package
   real (v3.9.4, April 17 2026). Registry/watch commands confirmed. Tool count
   inconsistency in README (30 vs 33). Language count: README claims 34 but
   search summaries cite 11 core/tested languages. Adoption-as-primitive
   recommendation stands but with caveat: **verify feature parity empirically
   before committing** — the marketing-vs-reality gap is a known risk pattern
   (see T28 LadybugDB lesson).

3. **C-022 (Cody discontinued July 23, 2025): VERIFIED** — Official Sourcegraph
   blog confirms Cody Free and Pro deprecated July 23 2025. Cody is out for this
   use case (was a borderline candidate in D2).

4. **C-066 (Agent Skills spec, no portability field): VERIFIED** — Spec fetched
   from agentskills.io/specification. No `scope` or `portability` field.
   `metadata` is open key-value. C-068 (metadata-as-extension-point) also
   VERIFIED.

5. **C-098 (AGENTS.md recognized by Claude Code + Gemini CLI): PARTIALLY
   REFUTED** — Claude Code uses CLAUDE.md (AGENTS.md support pending/partial).
   Gemini CLI uses GEMINI.md. Does NOT flip portability recommendation but
   affects the "universal AGENTS.md" framing — treat AGENTS.md as a _direction_
   rather than a _current standard_ when classifying scope.

6. **C-005 (Kythe v0.0.75 March 2026): REFUTED** — Release was March 12,
   **2025**, not 2026. One-year date error from D1 agent. Kythe's last release
   is now over a year old, strengthening the "low maintenance signal" for Kythe
   as a candidate.

---

## Verified Claims (summary list)

Per-claim verdicts for the remaining 29 checked claims, grouped:

### Tool existence verified

- `@parcel/watcher` v2.5.1, prebuilts for win32-x64/arm64/ia32: VERIFIED
- `@modelcontextprotocol/server-filesystem` no watching capability: VERIFIED
  (README fetch)
- LSIF deprecated in favor of SCIP: VERIFIED (lsif.dev + Sourcegraph blog)
- Chokidar v5 ESM-only (Nov 2025): VERIFIED (npm page + changelog)
- Chokidar v4 dual ESM/CJS support: VERIFIED
- dependency-cruiser MIT license + bidirectional graph API: VERIFIED
- madge `.depends(path)` API: VERIFIED
- Nx `@nx/enforce-module-boundaries` ESLint rule: VERIFIED
- Backstage `catalog-info.yaml` schema with `dependsOn`: VERIFIED (OSS
  Apache-2.0)
- Port SaaS-only (no self-hosted): VERIFIED
- Watchman Chocolatey Windows package: VERIFIED
- Turborepo `turbo query` GraphQL: VERIFIED
- Obsidian Breadcrumbs plugin `up:`/`uses:` frontmatter: VERIFIED
- Dataview SQL-like queries over frontmatter: VERIFIED
- 12-factor config externalization principle: VERIFIED
- VSCode scope enum (application/machine/machine-overridable/window/resource):
  VERIFIED
- XDG Base Directory spec portability semantics: VERIFIED
- chezmoi `.tmpl` suffix + `run_` prefix convention: VERIFIED
- rcm `tag-` / `host-` directory prefixes: VERIFIED
- Bazel `visibility` attribute (public/private/subpackages): VERIFIED
- `fb-watchman` npm package: VERIFIED

### Partially verified / caveat added

- **CodeGraphContext uses KuzuDB on Windows:** VERIFIED (via GitHub repo) — but
  combined with KuzuDB abandonment (verified above) = **significant risk**.
  Downgrade from "serendipity finding" to "evaluate migration to Ladybug fork
  before adoption."
- **obsidian-skill-graph (April 2026 plugin):** PARTIALLY VERIFIED — repo
  exists; "production readiness" claim is unsubstantiated for a plugin shipped
  days ago. Treat as experimental.
- **skills-md-graph (Rust CLI):** PARTIALLY VERIFIED — repo exists; limited
  usage evidence beyond self-testing.
- **Nx cross-workspace "Synthetic Monorepo" enterprise-only:** VERIFIED for
  v3.x; 2026 roadmap item acknowledged but not shipped OSS.

### Unverifiable

- **"60k+ repos use AGENTS.md"** (agentskills.io): UNVERIFIABLE — agentskills.io
  claims this, no third-party audit. Flag for downstream use as UNVERIFIABLE.
- **Aider PageRank-ranked repomap precise algorithm:** UNVERIFIABLE at depth —
  broad claim verified via docs, exact algorithm not independently audited.
- **Augment Code "living graph" architecture:** UNVERIFIABLE — closed SaaS, no
  source access, marketing claims only.
- **Greptile cross-repo graph queries at scale:** UNVERIFIABLE — SaaS, no public
  benchmark.

### Conflicted

- **@parcel/watcher vs Watchman performance on Windows:** CONFLICTED in source
  framing — they are not mutually exclusive (@parcel/watcher can optionally use
  Watchman as backend). Not a material conflict.

---

## Summary of Corrections Needed (for synthesis)

1. **Kythe date correction:** change "v0.0.75 March 2026" to "v0.0.75 March 2025
   (last release; 1+ years old)."
2. **CodeGraphContext caveat:** add KuzuDB-abandoned risk explicitly — don't
   recommend bare CodeGraphContext; note Ladybug fork migration as prerequisite.
3. **AGENTS.md framing:** change from "universal standard" to "emerging
   cross-tool convention (Claude Code uses CLAUDE.md, Gemini uses GEMINI.md;
   alignment is pending)."
4. **@optave/codegraph caveat:** add "empirically verify tool and language
   counts before committing" — README claims don't match search summaries.
5. **60k repos claim:** mark UNVERIFIABLE in claims.jsonl if not already.

## Gaps

- Depth verification on `@optave/codegraph`'s actual multi-project + watch
  implementation — requires npm install + local test (not done in remote web
  search)
- `CodeGraphContext` Ladybug-fork migration path — is it documented by
  CodeGraphContext maintainers or ad-hoc?
- obsidian-skill-graph stability — too new to have usage data

## Dispute candidates for Phase 3.5

None are hard conflicts. All V2 findings are either confirmations or
corrections. No dispute resolver needed.

---

## Net impact on synthesis

- Option B recommendation **stands** but with 3 caveats added:
  1. Verify `@optave/codegraph` empirically before standardizing on it
  2. Prefer `@parcel/watcher` over CodeGraphContext for the watcher primitive
     (KuzuDB risk)
  3. AGENTS.md-vs-CLAUDE.md framing: treat as aspirational, not settled
- Confidence distribution after V1 + V2:
  - HIGH (originally 63): remains ~60 (2 claims reduced in confidence)
  - MEDIUM (originally 42): ~44 (gained 2)
  - LOW (originally 8): 8
  - UNVERIFIED/UNVERIFIABLE (originally 3): 7 (gained 4 from V2 UNVERIFIABLE
    list)
- **<20% of claims materially affected** → Phase 3.9 re-synthesis NOT required.
  Corrections can be applied inline in final synthesis.
