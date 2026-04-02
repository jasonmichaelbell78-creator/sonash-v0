# SQ-009: CLI Tools for the SoNash Stack

**Researched:** 2026-03-23 **Stack:** Next.js 16.2, React 19.2, Firebase 12.10,
Tailwind CSS 4.2, Zod 4.3, TypeScript 5.9 **Already installed:** ESLint 9,
oxlint, Prettier, c8, Playwright, Lighthouse, knip, madge, Husky+lint-staged,
firebase-tools, MSW, gitleaks, markdownlint-cli, fast-check

---

## Category 1: TypeScript Tooling

### tsgo (TypeScript Native Preview)

- **What:** Microsoft's Go-native TypeScript compiler — 10x faster type checking
  than tsc
- **URL:** https://github.com/microsoft/typescript-go
- **Install:** `npm install @typescript/native-preview --save-dev` then
  `npx tsgo --noEmit`
- **Stars/Activity:** 15k+ stars; nightly builds shipping (v7.0.0-dev.20260322.1
  as of March 2026)
- **Windows:** Yes
- **Already have equivalent?** Replaces `tsc --noEmit` in `type-check` script.
  Does NOT replace tsc for emit/build (Next.js handles that via Turbopack/SWC).
- **Additive value:** Drops type-check time from seconds to sub-second on
  SoNash-sized codebases. Zero-risk drop-in for `--noEmit` usage. 2.9x less
  memory. Incremental compilation and project references now supported.
- **Confidence:** HIGH — Microsoft-backed, active nightly releases,
  CLI-compatible with tsc flags. Already usable for type-checking; editor
  support coming mid-2026.

### type-coverage

- **What:** CLI tool that measures what percentage of your TypeScript
  identifiers are properly typed vs `any`
- **URL:** https://github.com/plantain-00/type-coverage
- **Install:** `npm install type-coverage --save-dev` then `npx type-coverage`
- **Stars/Activity:** ~2.6k stars; v2.29.7 (last published ~1 year ago, stable)
- **Windows:** Yes
- **Already have equivalent?** No. ESLint's `no-explicit-any` catches
  declarations but not implicit `any` from inference failures. This measures
  total type safety as a percentage.
- **Additive value:** Gives a single metric ("98.7% typed") that can be tracked
  over time and enforced in CI. Catches accidental `any` from type inference,
  not just explicit declarations. Useful for a strict-mode TypeScript project
  like SoNash.
- **Confidence:** HIGH — Stable, low maintenance burden, complements existing
  strict mode.

---

## Category 2: Next.js-Specific

### next experimental-analyze (Built-in Bundle Analyzer)

- **What:** Next.js 16.1+ built-in bundle analyzer with Turbopack integration,
  route filtering, import chain tracing
- **URL:** https://nextjs.org/docs/app/api-reference/cli/next (docs) /
  https://github.com/vercel/next.js/discussions/86731
- **Install:** Already available — `npx next experimental-analyze` (requires
  Next.js 16.1+, which SoNash has)
- **Stars/Activity:** Part of Next.js core (70k+ stars)
- **Windows:** Yes
- **Already have equivalent?** Partially — SoNash has Lighthouse for performance
  but no dedicated bundle analyzer. This replaces the need for
  `@next/bundle-analyzer` or `webpack-bundle-analyzer`.
- **Additive value:** Native Turbopack-aware analysis. Filter by route,
  client/server split, trace import chains across server-to-client boundaries.
  No config needed — just run the command. Output can be written to disk with
  `--output` flag for CI integration.
- **Confidence:** HIGH — First-party, zero-install, already available in the
  SoNash Next.js version.

### nextjs-bundle-analysis (GitHub Action)

- **What:** GitHub Action that comments bundle size diffs on PRs
- **URL:** https://github.com/hashicorp/nextjs-bundle-analysis
- **Install:** GitHub Action config (no npm install)
- **Stars/Activity:** ~3.5k stars; maintained by HashiCorp
- **Windows:** N/A (runs in GitHub Actions)
- **Already have equivalent?** No. SoNash has no automated bundle size
  regression tracking on PRs.
- **Additive value:** Automatically comments bundle size changes on every PR.
  Supports performance budgets. Catches accidental large dependency additions
  before merge.
- **Confidence:** MEDIUM — Valuable for CI, but requires GitHub Actions setup.
  May need Turbopack compatibility verification with Next.js 16.

### size-limit

- **What:** Performance budget tool — calculates real cost (download + parse
  time) of JS bundles, fails CI if budget exceeded
- **URL:** https://github.com/ai/size-limit
- **Install:** `npm install size-limit @size-limit/preset-app --save-dev`
- **Stars/Activity:** ~6.7k stars; actively maintained
- **Windows:** Yes
- **Already have equivalent?** No. Lighthouse measures runtime performance but
  not bundle cost as a CI gate.
- **Additive value:** Tracks bundle size in time-to-interactive (ms), not just
  bytes. GitHub Action integration posts size diffs on PRs. Modular — can target
  specific entry points. Works as a pre-commit or CI gate.
- **Confidence:** MEDIUM — Great concept, but may overlap with
  `next experimental-analyze` for Next.js apps. More useful if SoNash were also
  shipping an npm library.

### next-safe-action

- **What:** Type-safe Server Actions with Zod validation, middleware pipeline,
  and React hooks
- **URL:** https://github.com/TheEdoRan/next-safe-action
- **Install:** `npm install next-safe-action`
- **Stars/Activity:** ~4k stars; actively maintained, supports Next.js 16 + Zod
  4
- **Windows:** Yes (runtime library, not CLI)
- **Already have equivalent?** Partially — SoNash uses httpsCallable + Zod for
  Cloud Functions validation. Server Actions may use inline Zod.
- **Additive value:** Standardizes Server Action patterns with typed middleware
  (auth, rate limiting), composable `.use()` chains,
  `useAction`/`useOptimisticAction` hooks with status tracking. Eliminates
  boilerplate around Server Action error handling and validation. Aligns with
  SoNash's Zod-everywhere approach.
- **Confidence:** MEDIUM — Not a CLI tool per se, but a library that enforces
  type safety patterns. Only relevant if SoNash uses Server Actions (vs
  httpsCallable for everything).

---

## Category 3: Firebase Ecosystem

### Firebase MCP Server

- **What:** Model Context Protocol server for Firebase — AI-assisted Firestore
  queries, security rules validation, schema generation
- **URL:** https://firebase.blog/posts/2025/10/firebase-mcp-server-ga/
- **Install:** Via MCP configuration (not npm)
- **Stars/Activity:** GA as of Oct 2025; maintained by Firebase team
- **Windows:** Yes (runs as MCP server process)
- **Already have equivalent?** Partially — SoNash already uses MCP servers
  (memory, sonarcloud). Firebase MCP adds Firebase-specific AI tooling.
- **Additive value:** Validate security rules across Firestore/Storage/RTDB from
  one tool. Generate Data Connect schemas. AI-assisted Firestore operations from
  Claude Code. Consolidated tooling beyond what firebase-tools CLI offers.
- **Confidence:** MEDIUM — Depends on whether SoNash's Claude Code workflow
  would benefit from Firebase-specific MCP tools vs the existing firebase-tools
  CLI. Worth evaluating.

### fireseeder

- **What:** CLI tool for seeding Firestore with complex nested data including
  subcollections
- **URL:** https://github.com/nanopx/fireseeder
- **Install:** `npm install fireseeder --save-dev`
- **Stars/Activity:** ~150 stars; low activity
- **Windows:** Yes
- **Already have equivalent?** Partially — `firebase emulators:start --import`
  handles data loading, but requires pre-exported data snapshots.
- **Additive value:** Declarative seed data with random value generation.
  Supports nested subcollections. Useful for test fixtures and demo
  environments. Config via package.json.
- **Confidence:** LOW — Small community, low activity. SoNash's emulator import
  workflow may be sufficient. Custom seed scripts with firebase-admin are more
  flexible.

---

## Category 4: Tailwind CSS Tooling

### @tailwindcss/upgrade

- **What:** Official migration CLI that converts Tailwind v3 config/classes to
  v4 CSS-first format
- **URL:** https://tailwindcss.com/docs/upgrade-guide
- **Install:** `npx @tailwindcss/upgrade` (one-time migration)
- **Stars/Activity:** Part of Tailwind CSS core (90k+ stars)
- **Windows:** Yes
- **Already have equivalent?** No — but only relevant if SoNash hasn't fully
  migrated to v4 syntax yet.
- **Additive value:** Automated conversion of `@tailwind` directives to
  `@import`, JS config to CSS `@theme` directives, utility class renames (e.g.,
  `!flex` to `flex!`). One-time use.
- **Confidence:** HIGH (if migration needed) / N/A (if already on v4) — SoNash's
  package.json shows Tailwind 4.2.2, so migration may already be complete. Worth
  running to catch any remaining v3 patterns.

---

## Category 5: Zod Ecosystem

### ts-to-zod

- **What:** Generates Zod schemas from TypeScript type/interface definitions
- **URL:** https://github.com/fabien0102/ts-to-zod
- **Install:** `npm install ts-to-zod --save-dev`
- **Stars/Activity:** ~1.3k stars; v5.1.0 supports Zod v4
- **Windows:** Yes
- **Already have equivalent?** No. SoNash manually writes Zod schemas in
  `functions/src/schemas.ts` and `types/`.
- **Additive value:** Eliminates schema duplication by generating Zod schemas
  from existing TypeScript types. Supports JSDoc-based validators (@format,
  @minimum, etc.). Zod v4 compatible. Useful when types exist first and schemas
  need to stay in sync.
- **Confidence:** MEDIUM — Only valuable if SoNash has many types that lack
  corresponding Zod schemas, or if type-schema drift is a problem. The project's
  architecture (types/ + schemas.ts) suggests manual co-location works. May
  introduce a generation step that complicates the workflow.

### openapi-zod-client

- **What:** Generates Zod-validated TypeScript HTTP client from OpenAPI specs
- **URL:** https://github.com/astahmer/openapi-zod-client
- **Install:** `npm install openapi-zod-client --save-dev`
- **Stars/Activity:** ~1.2k stars; actively maintained
- **Windows:** Yes
- **Already have equivalent?** No.
- **Additive value:** If SoNash consumes any external APIs with OpenAPI specs,
  this auto-generates a typed client with runtime validation. Eliminates manual
  API client code.
- **Confidence:** LOW — SoNash primarily uses Firebase (httpsCallable), not REST
  APIs with OpenAPI specs. Only relevant if external API consumption grows.

---

## Category 6: Performance & Profiling

### Clinic.js

- **What:** Node.js performance profiling suite — Doctor (diagnostics),
  Bubbleprof (async), Flame (CPU)
- **URL:** https://github.com/clinicjs/node-clinic / https://clinicjs.org/
- **Install:** `npm install clinic --save-dev` then
  `npx clinic doctor -- node server.js`
- **Stars/Activity:** ~12k stars; actively maintained by NearForm
- **Windows:** Partial — requires native compilation; may have issues on Windows
- **Already have equivalent?** No. c8 covers code coverage, not runtime
  performance profiling.
- **Additive value:** Visual performance reports showing CPU bottlenecks, memory
  leaks, event loop delays, and async operation tracing. Doctor auto-diagnoses
  common issues. Flame generates CPU flame graphs.
- **Confidence:** LOW — SoNash is a Next.js app, not a standalone Node.js
  server. Cloud Functions run in Firebase's environment. Most useful for
  profiling custom scripts or build processes, not the web app itself. Windows
  support is uncertain.

### Unlighthouse

- **What:** Runs Google Lighthouse on your entire site automatically — discovers
  all routes, audits in parallel
- **URL:** https://github.com/harlan-zw/unlighthouse
- **Install:** `npx unlighthouse --site https://your-site.com`
- **Stars/Activity:** ~4.2k stars; actively maintained
- **Windows:** Yes
- **Already have equivalent?** Partially — SoNash has `lighthouse` and
  `lighthouse:desktop` scripts, but they audit single pages.
- **Additive value:** Automatic route discovery and parallel multi-page
  auditing. Smart sampling for similar pages. Static report generation for CI.
  Replaces running Lighthouse manually on each route.
- **Confidence:** HIGH — Directly extends the existing Lighthouse setup. Low
  effort to adopt. Generates site-wide performance reports instead of
  single-page snapshots.

---

## Category 7: Linting & Formatting (Alternatives)

### Biome

- **What:** Rust-based unified linter + formatter (replaces ESLint + Prettier in
  one tool), 10-25x faster
- **URL:** https://github.com/biomejs/biome / https://biomejs.dev/
- **Install:** `npm install @biomejs/biome --save-dev`
- **Stars/Activity:** ~17k stars; actively maintained, v2.x stable
- **Windows:** Yes
- **Already have equivalent?** Yes — ESLint 9 + oxlint + Prettier covers linting
  and formatting. Adding Biome would be a fourth tool.
- **Additive value:** Consolidates linting + formatting into one binary. 97%
  Prettier compatibility. 450+ rules. But SoNash already has a mature
  ESLint+oxlint+Prettier pipeline with custom configs, lint-staged integration,
  and pattern compliance checks.
- **Confidence:** LOW — Migration cost outweighs benefit. SoNash's existing
  three-tool setup (ESLint for deep rules, oxlint for speed, Prettier for
  formatting) is well-established. Biome would require rebuilding all custom
  ESLint configs and plugin integrations. Not recommended as an addition
  alongside existing tools.

### Oxlint (already installed — upgrade note)

- **What:** High-performance Rust linter, now supporting 699 rules including
  type-aware linting
- **URL:** https://oxc.rs/docs/guide/usage/linter.html
- **Install:** Already installed (v1.56.0)
- **Stars/Activity:** Part of OXC project (~14k stars); very active
- **Windows:** Yes
- **Already have equivalent?** Already installed. But SoNash may not be using
  type-aware linting or the new JS plugins feature.
- **Additive value:** Type-aware linting (59/61 typescript-eslint rules) is now
  available and can run 20-40x faster when paired with tsgo. JS plugins (alpha)
  allow running existing ESLint plugins inside oxlint. Multi-file analysis for
  cross-file import checking. Could potentially replace more ESLint rules,
  reducing the need to run ESLint at all.
- **Confidence:** HIGH — Already installed. Enabling type-aware mode and
  expanding rule coverage is a configuration change, not a new tool. Check if
  the current .oxlintrc.json enables type-aware rules.

---

## Category 8: Testing Ecosystem

### MSW (already installed — usage note)

- **What:** API mocking library for browser and Node.js — intercepts HTTP,
  GraphQL, and WebSocket
- **URL:** https://mswjs.io/ / https://github.com/mswjs/msw
- **Install:** Already installed (v2.12.13)
- **Stars/Activity:** ~16k stars; actively maintained
- **Windows:** Yes
- **Already have equivalent?** Already installed.
- **Additive value:** SoNash already has MSW. Verify it's being used in tests —
  particularly for mocking httpsCallable responses (per CLAUDE.md pattern
  requirements). Consider msw-storybook-addon if Storybook is adopted.
- **Confidence:** N/A — Already present. Ensure usage aligns with the project's
  test mocking patterns.

### Storybook

- **What:** UI component development, testing, and documentation environment
  with Playwright-powered test runner
- **URL:** https://storybook.js.org/
- **Install:** `npx storybook@latest init`
- **Stars/Activity:** ~85k stars; actively maintained
- **Windows:** Yes
- **Already have equivalent?** No. SoNash uses Playwright for E2E and node:test
  for unit tests, but has no component-level visual testing or isolated
  component development environment.
- **Additive value:** Isolated component development and testing. Visual
  regression testing with Chromatic. Reuses MSW mocks for API simulation.
  Auto-generates documentation from component props. Playwright-powered test
  runner for component stories.
- **Confidence:** MEDIUM — High value for component-heavy development, but
  significant setup cost. SoNash is a solo developer project where the overhead
  may not justify the benefit. More relevant if the component library grows
  significantly.

### generate-react-cli

- **What:** Zero-config component scaffolding — generates component, styles,
  test files from templates
- **URL:** https://github.com/arminbro/generate-react-cli
- **Install:** `npx generate-react-cli component MyComponent`
- **Stars/Activity:** ~1.5k stars; maintained
- **Windows:** Yes
- **Already have equivalent?** No dedicated scaffolding tool.
- **Additive value:** Consistent component file structure (component, CSS
  module, test, types). Configurable templates. Zero-config or full
  customization via generate-react-cli.json.
- **Confidence:** LOW — In a Claude Code workflow, the AI generates components
  directly. A scaffolding CLI adds little value when the AI can create files to
  match the project's conventions. More useful for teams without AI-assisted
  development.

---

## Category 9: Deployment

### Vercel CLI

- **What:** Deploy, preview, and manage Next.js apps from the command line.
  Pre-built deployment support.
- **URL:** https://vercel.com/docs/cli
- **Install:** `npm install vercel --save-dev` or `npm i -g vercel`
- **Stars/Activity:** Part of Vercel platform
- **Windows:** Yes
- **Already have equivalent?** Depends on deployment target. SoNash uses
  Firebase hosting (per firebase.json mention in CLAUDE.md), not Vercel.
- **Additive value:** If deploying to Vercel: instant preview deployments, edge
  function support, built-in analytics, seamless Next.js integration. Pre-built
  deploy support lets you build locally and deploy without Vercel rebuilding.
- **Confidence:** LOW — SoNash appears to deploy on Firebase Hosting, not
  Vercel. Only relevant if considering a platform migration. Firebase + Next.js
  via Cloud Functions is the current architecture.

---

## Summary: Prioritized Recommendations

### Tier 1 — High Value, Low Effort (Adopt Now)

| Tool                                | Why                                                                    | Effort                    |
| ----------------------------------- | ---------------------------------------------------------------------- | ------------------------- |
| `tsgo` (@typescript/native-preview) | 10x faster type-check, drop-in replacement for `tsc --noEmit`          | 5 min — change one script |
| `next experimental-analyze`         | Built-in bundle analysis, already available, zero install              | 0 min — just run it       |
| Unlighthouse                        | Site-wide Lighthouse instead of single-page, extends existing setup    | 10 min — npx one-liner    |
| Oxlint type-aware mode              | Already installed, enable type-aware rules for 20-40x faster type-lint | 15 min — config change    |
| `type-coverage`                     | Track type safety percentage, catch implicit `any`                     | 10 min — install + run    |

### Tier 2 — Medium Value, Medium Effort (Evaluate)

| Tool                               | Why                                                | Effort                       |
| ---------------------------------- | -------------------------------------------------- | ---------------------------- |
| nextjs-bundle-analysis (GH Action) | Automated bundle size regression on PRs            | 30 min — GH Action config    |
| Firebase MCP Server                | AI-assisted Firebase operations from Claude Code   | 30 min — MCP config          |
| next-safe-action                   | Standardized type-safe Server Actions with Zod     | 1-2 hours — library adoption |
| @tailwindcss/upgrade               | One-time migration check for remaining v3 patterns | 15 min — run once            |

### Tier 3 — Low Priority (Skip or Defer)

| Tool               | Why Skip                                                                       |
| ------------------ | ------------------------------------------------------------------------------ |
| Biome              | Would replace working ESLint+oxlint+Prettier pipeline; migration cost too high |
| Storybook          | High setup cost for solo developer; AI generates components directly           |
| generate-react-cli | Redundant with AI-assisted development in Claude Code                          |
| Clinic.js          | Not applicable to Next.js web app architecture; Windows support uncertain      |
| size-limit         | Overlaps with `next experimental-analyze` for Next.js apps                     |
| fireseeder         | Low community; emulator import workflow sufficient                             |
| openapi-zod-client | SoNash doesn't consume OpenAPI-spec'd APIs                                     |
| ts-to-zod          | Manual Zod schema co-location works well for the project's scale               |
| Vercel CLI         | SoNash deploys on Firebase, not Vercel                                         |

---

## Tools Already Installed — Usage Optimization Notes

These tools are already in package.json. Notes on maximizing their value:

1. **oxlint (v1.56.0)** — Enable type-aware linting if not already configured.
   Check .oxlintrc.json for typescript rule categories. JS plugins (alpha) may
   allow consolidating more ESLint rules.
2. **MSW (v2.12.13)** — Verify test files mock httpsCallable (per CLAUDE.md
   security patterns), not direct Firestore writes.
3. **knip (v5.88.0)** — Already handles unused deps/exports. No need for
   depcheck or ts-prune.
4. **madge (v8.0.0)** — Already handles circular dependency detection.
5. **gitleaks** — Already in security:secrets script. Consider adding to
   pre-push hook if not already there.
6. **Lighthouse (v13.0.1)** — Unlighthouse extends this to site-wide audits
   without replacing it.

---

## Redundancy Analysis

| Existing Tool              | Proposed Tool            | Verdict                                      |
| -------------------------- | ------------------------ | -------------------------------------------- |
| tsc --noEmit               | tsgo --noEmit            | REPLACE (10x faster, same output)            |
| ESLint + oxlint + Prettier | Biome                    | KEEP EXISTING (migration cost)               |
| knip                       | depcheck / ts-prune      | KEEP EXISTING (knip is superior)             |
| madge                      | dependency-cruiser       | KEEP EXISTING (madge is simpler, sufficient) |
| Lighthouse (single page)   | Unlighthouse (site-wide) | ADD (complementary, not replacement)         |
| c8                         | vitest coverage          | KEEP EXISTING (c8 works with node:test)      |
| firebase-tools             | Firebase MCP             | ADD (complementary, different interface)     |

---

_Research confidence: HIGH for Tier 1 tools (verified against SoNash's actual
package.json and workflow). MEDIUM for Tier 2 (depends on workflow preferences).
Sources verified March 2026._
