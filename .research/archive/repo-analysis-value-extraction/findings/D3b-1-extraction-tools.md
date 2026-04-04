# Findings: Component Extraction Tools — bit.dev, Module Federation, PNPM Workspaces, git-subtree

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** D3b-1

---

## Key Findings

### 1. bit.dev — Component-Level Extraction with Versioning [CONFIDENCE: HIGH]

**What it does.** Bit treats individual components as first-class publishable
units. Rather than extracting a whole package, you track a folder with
`bit add <path> --id <scope>/<name>`, which registers it in a `.bitmap` file.
Bit then automatically resolves import-level dependencies, compiles in
isolation, versions via `bit tag`, and exports to a "Scope" (bit.dev cloud or
self-hosted) where the component is installable via standard npm/yarn.

**What makes a component extractable.** Any folder with a discrete entry point
(`index.ts`) and self-contained source is trackable. Bit's environment system
(replacing per-project tsconfig / .babelrc / .eslintrc) handles build without
extra config. Auto-detection of imports maps inter-component dependencies: if
`input.tsx` imports `button.tsx`, Bit wires the dependency graph automatically.

**When to use it.** Best for teams that want component-granularity sharing —
e.g., design systems where individual atoms need independent version histories.
Suits React/TS ecosystems; also supports Vue, Angular, Node modules.

**Key limitations.**

- No self-hosting in the free tier; paid plans required for on-prem/private
  scopes. [1]
- Versioning complexity: automated "always latest" dependency updates break
  intentional version pinning. [2]
- Publishing workflow differs from git: must specify the remote scope path on
  every export — not a simple `git push`. [1]
- Documentation inconsistencies and a small community make debugging harder than
  mainstream alternatives. [1]
- Decomposing tightly-coupled existing code is manual — Bit tracks clean
  boundaries, it does not create them. [3]

---

### 2. Module Federation (Webpack 5) — Runtime Sharing Across Deployed Apps [CONFIDENCE: HIGH]

**What it does.** Module Federation allows independently deployed Webpack builds
to share code at runtime. A "remote" build exposes modules via `exposes` config;
a "host" build consumes them via `remotes: { app1: "app1@http://..." }`. The
remote's `remoteEntry.js` is fetched on demand — no pre-bundling of the remote
into the host. Libraries like React can be declared `shared` so only one copy
loads even across applications.

**Architecture pattern.**

- Host (consumer): declares `remotes` pointing to deployed URLs
- Remote (provider): declares `exposes` listing available modules
- Shared: both sides declare common libs with version constraints to prevent
  duplicate React instances

Module Federation v2.0 adds dynamic TypeScript type hints, Chrome DevTools
integration, runtime plugins, and preloading — extending fitness for large-scale
micro-frontend architectures. [4]

**When to use it.** Right tool when you have multiple independently deployed
applications (micro-frontends) that need to share live, always-current
components without a publish/install cycle. Each team owns their remote and
deploys independently.

**Key limitations.**

- Version mismatches are a production hazard: different React versions between
  host and remote silently break hooks, context, and state. [5]
- Webpack-only by default (though Rspack and Vite plugins exist for MF v2). [4]
- Adds runtime HTTP requests per remote module — latency and error-handling
  complexity increase. [5]
- Routing conflicts and style collisions are common in multi-team setups. [5]
- No branches/tags visibility — the consuming app cannot pin to a specific
  remote version without deploying a separate URL. [5]
- SSR support is possible but significantly more complex than CSR. [UNVERIFIED]

---

### 3. PNPM Workspaces — Structured Extraction into a Monorepo [CONFIDENCE: HIGH]

**What it does.** PNPM workspaces colocate multiple packages in one git repo
while giving each its own `package.json`. A `pnpm-workspace.yaml` at the root
declares which directories are packages (e.g., `packages/*`, `apps/*`). The
`workspace:` protocol (`"ui": "workspace:*"`) ensures the local version is
always used and is converted to a real semver range at publish time.

**Extraction workflow.** To extract shared code: move it to `packages/ui/`, add
a `package.json`, then reference it from consumers via `workspace:*`. PNPM
symlinks (or hard-links with `injectWorkspacePackages`) the package into each
consumer's `node_modules`. No publish step needed during development; publish to
npm only when sharing externally.

**When to use it.** The standard choice when all consumers live in the same
repo. Works with Changesets for versioning. Efficient disk usage through
content-addressable store (hard links, ~60-80% disk reduction vs npm/yarn). [6]

**Key limitations.**

- Does not solve cross-repo sharing — publishing to npm is still required for
  external consumers. [6]
- Topological script ordering breaks with cyclic workspace dependencies —
  warnings surfaced but not enforced as errors. [7]
- `linkWorkspacePackages` defaults to `false`; teams must explicitly opt in to
  local linking or face registry fallback surprises. [7]
- Requires discipline in package boundary design — PNPM enforces strict
  resolution (only declared deps accessible), so sloppy imports fail at runtime.
  [7]

---

### 4. git-subtree / git-filter-repo — Surgical Repository Splitting [CONFIDENCE: HIGH]

**What they do.** Both tools split a directory out of a larger repo into its own
repository, preserving commit history relevant to that path.

**git-filter-repo** (recommended):

- `git filter-repo --subdirectory-filter FOLDER-NAME` — rewrites history so the
  subdirectory becomes the repo root, discarding all other history. [8]
- `git filter-repo --path src/ --to-subdirectory-filter my-module` — keeps the
  path but nested under a new root, plus renames tags. [9]
- Fast: ~20 seconds on large repos vs 12+ minutes for older tools. [10]
- Requires Git 2.22.0+ and manual installation (not in git core). [8]

**git subtree split** (built-in, older):

- `git subtree split --prefix=packages/ui -b ui-only` creates a branch
  containing only commits touching that path.
- Slower and less flexible; superseded by filter-repo for new work.
- `git subtree add/push/pull` also supports bidirectional syncing of a subtree
  between repos (distinct from the split operation). [10]

**When to use it.** Right tool when the goal is a one-time extraction of a
subdirectory into its own repository/package — moving from a megarepo to a
multi-repo structure. Also used for vendoring a dependency as a subtree (add,
then pull updates). Not suitable for ongoing real-time sharing (use PNPM
workspaces or Module Federation for that).

**Key limitations.**

- After filter-repo extraction, the new repo lacks branches and tags from the
  original — only the default branch carries over cleanly. [8]
- History rewrite is destructive to the source repo — always operate on a clone.
  [8]
- git subtree's bidirectional sync creates merge commits that complicate history
  readability over time. [10]
- Does not solve dependency management — after extraction, you still need to set
  up `package.json`, publishing, and consumer references manually. [UNVERIFIED]

---

## Sources

| #   | URL                                                                                              | Title                                                       | Type            | Trust  | CRAAP Avg | Date |
| --- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | --------------- | ------ | --------- | ---- |
| 1   | https://dev.to/slpixe/experience-with-bit-bit-dev-previously-bit-src-oji                         | Experience with Bit.dev                                     | Community       | MEDIUM | 3.6       | 2022 |
| 2   | https://bit.dev/reference/components/the-bit-component/                                          | The Bit Component — Reference                               | Official docs   | HIGH   | 4.4       | 2024 |
| 3   | https://bit.dev/blog/-extracting-and-reusing-pre-existing-components-using-bit-add-l28qlxpz/     | Extracting Pre-existing Components with bit add             | Official blog   | HIGH   | 4.2       | 2023 |
| 4   | https://webpack.js.org/concepts/module-federation/                                               | Module Federation — webpack docs                            | Official docs   | HIGH   | 4.8       | 2025 |
| 5   | https://blog.logrocket.com/solving-micro-frontend-challenges-module-federation/                  | Solving micro-frontend challenges with Module Federation    | Community       | MEDIUM | 3.8       | 2024 |
| 6   | https://jsdev.space/complete-monorepo-guide/                                                     | Complete Monorepo Guide: pnpm + Workspace + Changesets      | Community       | MEDIUM | 3.7       | 2025 |
| 7   | https://pnpm.io/workspaces                                                                       | Workspace — pnpm official docs                              | Official docs   | HIGH   | 4.8       | 2025 |
| 8   | https://docs.github.com/en/get-started/using-git/splitting-a-subfolder-out-into-a-new-repository | Splitting a subfolder out into a new repository             | Official docs   | HIGH   | 4.7       | 2025 |
| 9   | https://github.com/newren/git-filter-repo                                                        | git-filter-repo GitHub README                               | Official source | HIGH   | 4.6       | 2025 |
| 10  | https://jeffkreeftmeijer.com/git-extract/                                                        | Extract a subdirectory or single file from a Git repository | Community       | MEDIUM | 3.5       | 2023 |

---

## Contradictions

**bit.dev "zero config" vs real friction.** Official Bit docs emphasize "zero
configuration" development. Community experience reports documentation
inconsistencies and non-trivial setup for peerDependencies with npm 7+. Both are
true: the build env is zero-config but the publish/scope workflow has meaningful
friction that official docs understate.

**git subtree split vs filter-repo performance.** Multiple sources cite
12-minute vs 20-second performance gap in favor of filter-repo. The git-scm docs
still list `git filter-branch` as the primary method — this is outdated
guidance. filter-repo is the actual recommended tool per GitHub's own docs.

---

## Gaps

- **Bit.dev pricing for private scopes** (on-prem/self-hosted) — not confirmed
  with a current price point or whether Harmony self-hosted is viable in
  2025-2026.
- **Module Federation + non-Webpack bundlers** (Vite, Turbopack) — v2.0 claims
  broader support but specific maturity/limitations not verified from official
  sources.
- **PNPM workspaces + Changesets versioning integration** — referenced in
  community guides but not explored in depth here.
- **git-subtree bidirectional sync limitations** — specifically how diverging
  histories affect long-running subtree relationships.

---

## Serendipity

**PNPM hard-linking** (`injectWorkspacePackages: true`) is a less-known option
that avoids symlink issues in environments where symlinks cause problems (e.g.,
some Docker setups, certain CI environments). Worth noting for the debt-runner
packaging context.

**Module Federation v2.0 runtime plugins** allow dynamic remote registration at
runtime — meaning the URL of a remote does not need to be known at build time.
This is architecturally significant for plugin-style extensibility and may be
relevant to the SoNash debt dashboard's extension model.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 4
- LOW claims: 0
- UNVERIFIED claims: 2
- Overall confidence: HIGH
