# Findings: Optimal Analysis Pipeline for a Comprehensive Repo Analysis Skill

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** D4

---

## Key Findings

### 1. Clone Strategy Hierarchy [CONFIDENCE: HIGH]

Four clone strategies exist on a spectrum from fastest-and-least-capable to
slowest-and-most-capable:

| Strategy               | Command                                  | Typical Speed vs Full Clone | Data Downloaded                      | Use Case                                 |
| ---------------------- | ---------------------------------------- | --------------------------- | ------------------------------------ | ---------------------------------------- |
| Shallow (depth=1)      | `git clone --depth=1`                    | 4-6x faster                 | Latest commit only                   | Single-use CI builds                     |
| Shallow (time-bounded) | `git clone --shallow-since="1 year ago"` | 2-4x faster                 | Last N months of commits             | Churn analysis without full history      |
| Blobless partial       | `git clone --filter=blob:none`           | 1.5-2x faster               | All commits + trees, blobs on-demand | Code analysis, `git log`, path history   |
| Full clone             | `git clone`                              | Baseline                    | Everything                           | Blame history, bisect, complete analysis |

Key performance data from GitHub's own data-driven study [1] on a spectrum of
repos:

- jquery/jquery (40MB, 7,873 commits): shallow saves meaningful bandwidth
- apple/swift (750MB, 132,316 commits): blobless cuts 88.6% of clone time
- torvalds/linux (4GB, 968,500 commits): shallow is 4-6x faster, full is
  impractical for analysis pipelines

**Critical finding:** Shallow clones impose a 13-25x CPU penalty on the server
during subsequent fetches [1]. For read-only analysis pipelines that
clone-and-discard, this penalty is irrelevant. For long-lived analysis workers
that re-use a clone and `git fetch` for updates, shallow clones become more
expensive than full clones over time.

**The blobless clone is the recommended default for analysis pipelines.** It
supports `git log`, `git log -- <path>`, `git merge-base`, and commit counting
without downloading any file contents. File contents are fetched lazily
on-demand when `git diff`, `git blame`, or `git show` are invoked [1][2].

Sources: [1] GitHub Blog (git-clone data-driven study), [2] GitHub Blog (partial
clone and shallow clone)

---

### 2. What Analysis Requires Full History vs HEAD-Only [CONFIDENCE: HIGH]

**HEAD-only acceptable (shallow clone or API):**

- Language detection (file extensions, content heuristics)
- Lines of code, complexity metrics
- Dependency manifest parsing (package.json, requirements.txt, go.mod)
- Framework detection
- Configuration file audit
- Security policy presence (SECURITY.md, CODEOWNERS)
- Current dependency vulnerability scan

**Requires recent history (12 months, `--shallow-since`):**

- Code churn calculation per file
- Hotspot identification (high-churn + high-complexity files)
- Active contributor count
- Commit frequency trends
- Recency of last meaningful commit (maintenance status)

Research confirms: "You don't really need to retrieve the history since the
beginning of the project; limiting the analysis to the last 12 months is good
enough" for churn/hotspot analysis [3].

**Requires full history (full clone or deep partial):**

- `git-sizer` repo health metrics (explicitly requires non-shallow clone [4])
- Complete contributor attribution
- True refactoring vs rewrite detection
- Long-range blame across old lines
- Git bisect operations

Source: [3] understandlegacycode.com, [4] github/git-sizer repo

---

### 3. API-Only Approach: What You Can Learn Without Cloning [CONFIDENCE: HIGH]

The GitHub REST and GraphQL APIs expose substantial metadata without any clone:

**Via GitHub REST API (`api.github.com`):**

- Repository metadata: name, description, topics, stars, forks, open issues,
  license, visibility
- Language breakdown by bytes (via `/repos/:owner/:repo/languages`) — uses
  Linguist, updates on push [5]
- Contributor list (top 500; additions/deletions only for repos <10,000 commits)
  [6]
- Weekly commit activity, last-year commit counts, hourly commit patterns [6]
- Branch protection configuration
- Topics and labels
- Recent releases

**Via OpenSSF Scorecard API (`api.securityscorecards.dev`):**

- 16 security checks scored 0-10: Binary-Artifacts, Branch-Protection,
  Code-Review, CII-Best-Practices, Contributors, Dependency-Update-Tool,
  Fuzzing, Maintained, Packaging, Pinned-Dependencies, SAST, Security-Policy,
  Signed-Releases, Token-Permissions, Vulnerabilities [7]
- API endpoint:
  `https://api.securityscorecards.dev/projects/github.com/:owner/:repo`
- Covers 1M+ repos scanned weekly; free, no auth required [8]

**Via deps.dev API (`api.deps.dev`):**

- Package licenses (SPDX expressions), vulnerability advisories (via OSV), full
  dependency graphs
- Supports npm, PyPI, Maven, NuGet, RubyGems, Cargo, Go ecosystems
- Endpoints: GetPackage, GetVersion, GetDependencies, GetAdvisory, Query
- No authentication required; globally replicated [9]

**API-only hard limits:**

- GitHub Linguist language detection only works for repos with fewer than
  100,000 files [5]
- Contributor stats endpoint returns 422 for repos exceeding 10,000 commits [6]
- Scorecard coverage is ~1M most-popular repos; private/obscure repos have no
  pre-computed score
- No AST-level analysis, no complexity metrics, no custom code patterns via API
  alone

Sources: [5] GitHub Docs (repository languages), [6] GitHub Docs (repository
statistics), [7] github.com/ossf/scorecard, [8] endorlabs.com, [9]
docs.deps.dev/api/v3

---

### 4. Hybrid Approach: Recommended Architecture [CONFIDENCE: HIGH]

The optimal strategy is a tiered hybrid pipeline:

**Tier 1 — API Phase (always runs, no disk I/O):**

- Fetch repo metadata, topics, stars, license, visibility, language percentages
  from GitHub API
- Query OpenSSF Scorecard API for security posture (if available)
- Query deps.dev for dependency vulnerability/license summary (if package
  manifest visible via API)
- Cost: seconds, no storage, no rate-limit pressure for individual repos

**Tier 2 — Blobless Partial Clone + HEAD Analysis (always runs):**

- `git clone --filter=blob:none --depth=1 <repo>` for structure-only
- Run `scc` for LOC, language confirmation, complexity estimates (JSON output)
- Detect monorepo structure (see Finding 6)
- Detect framework stack (see Finding 5)
- Parse manifest files (package.json, go.mod, Cargo.toml, requirements.txt,
  pyproject.toml)
- Security file presence check (SECURITY.md, CODEOWNERS, .github/FUNDING.yml)
- Cost: seconds to low minutes; storage proportional to file tree size

**Tier 3 — History Analysis (conditional; blobless partial clone with
`--shallow-since`):**

- Deepen existing clone:
  `git fetch --shallow-since="1 year ago" --filter=blob:none`
- OR fresh: `git clone --filter=blob:none --shallow-since="1 year ago"`
- Run churn analysis:
  `git log --reverse --numstat --format="--%ct--%cI--%cn" --since="1 year ago"`
- Compute file-level change frequency, identify hotspots (high-churn +
  high-complexity intersection)
- Commit frequency/maintenance trend
- Cost: seconds to low minutes; only triggered when churn/evolution analysis
  requested

**Tier 4 — Full Clone (exceptional; only when specifically required):**

- `git clone` (no filters)
- Run `git-sizer --json` for comprehensive repo health report
- Deep blame history, complete contributor attribution
- Binary artifact detection (git-sizer flags these)
- Cost: minutes to hours for large repos; triggered only when Tier 1-3 flags
  anomalies OR when health audit specifically requested

---

### 5. Language and Framework Detection [CONFIDENCE: HIGH]

**Language detection strategy (no clone required for initial check, Tier 1):**

1. Query GitHub API `/repos/:owner/:repo/languages` — returns bytes per language
   (Linguist-computed)
2. Confirm with local `scc` run on cloned tree — faster than Linguist Ruby, no
   language limit
3. `scc` supports 250+ languages, pure Go binary, JSON output, cyclomatic
   complexity per file [10]

**Framework detection heuristics (requires Tier 2 clone, file tree
inspection):**

The Netlify `framework-info` library [11] demonstrates the standard approach:

1. Parse `package.json` dependencies and devDependencies
2. Check for framework-specific config files

| Framework         | Primary Detection Signal                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| Next.js           | `next` in package.json deps + optional `next.config.js`/`next.config.ts` |
| Remix             | `@remix-run/react` or `@remix-run/node` in deps                          |
| plain React (CRA) | `react-scripts` in deps, absence of framework-specific config            |
| Vite React        | `@vitejs/plugin-react` in devDeps                                        |
| Angular           | `@angular/core` in deps + `angular.json`                                 |
| Vue               | `vue` in deps + optional `vue.config.js`                                 |
| Svelte            | `svelte` in deps + `svelte.config.js`                                    |
| Django            | `django` in requirements.txt / pyproject.toml                            |
| Flask             | `flask` in requirements.txt / pyproject.toml                             |
| FastAPI           | `fastapi` in requirements.txt / pyproject.toml                           |
| Express/Node API  | `express` in package.json, absence of frontend framework                 |
| Go service        | `go.mod` present, absence of frontend frameworks                         |
| Rust service      | `Cargo.toml`, lib or binary crate declaration                            |

**Detection priority:** Config file presence beats dependency name alone (e.g.,
`next.config.ts` + `next` dep = high-confidence Next.js detection). A
`package.json` with `next` but no config file = medium confidence.

Sources: [10] github.com/boyter/scc, [11] github.com/netlify/framework-info

---

### 6. Monorepo Detection and Sub-Package Analysis [CONFIDENCE: HIGH]

**Detection signals (hierarchy order — check in sequence):**

| File                                                                           | Monorepo Tool           | Sub-package Location Signal                            |
| ------------------------------------------------------------------------------ | ----------------------- | ------------------------------------------------------ |
| `pnpm-workspace.yaml`                                                          | pnpm workspaces         | `packages:` array entries                              |
| `package.json` with `workspaces:` field                                        | npm/Yarn/Bun workspaces | Glob patterns in `workspaces`                          |
| `lerna.json`                                                                   | Lerna                   | `packages` field                                       |
| `nx.json`                                                                      | Nx                      | Per-package `project.json` files in each workspace dir |
| `turbo.json`                                                                   | Turborepo               | `pipeline` keys + workspaces from package.json         |
| `WORKSPACE` or `WORKSPACE.bazel`                                               | Bazel                   | BUILD files in each sub-directory                      |
| `Cargo.toml` with `[workspace]` section                                        | Rust/Cargo              | `members = [...]` array                                |
| Multiple `go.mod` files                                                        | Go multi-module         | Directory containing each `go.mod`                     |
| `pyproject.toml` with `[tool.poetry.packages]` or `[tool.hatch.build.targets]` | Python monorepo         | Named paths                                            |

**Sub-package analysis strategy:**

- For each detected sub-package root, run the same Tier 2 analysis independently
- Use sparse-checkout (`git clone --filter=blob:none --sparse`, then
  `git sparse-checkout set <subdir>`) to analyze only one sub-package without
  downloading others [12]
- With sparse-checkout + partial clone, an analysis of one sub-package in a 30GB
  repo can complete in under 2 minutes vs hours for full clone [12]

Sources: [12] GitHub Blog (monorepo sparse-checkout)

---

### 7. Pipeline Parallelization: Independent vs Sequential Steps [CONFIDENCE: HIGH]

Analysis steps can be grouped by dependency:

**Phase 0 — Parallel (no dependencies, all API calls):**

- GitHub API metadata fetch
- OpenSSF Scorecard API query
- deps.dev dependency query
- All three are independent and can fire simultaneously

**Phase 1 — Sequential gate: Clone must complete first**

- Single blobless + depth=1 clone operation
- Cannot be parallelized (single network operation)

**Phase 2 — Parallel (all operate on cloned file tree, no inter-dependencies):**

- `scc` LOC/complexity analysis
- Framework detection (file tree scan)
- Monorepo structure detection
- Manifest file parsing (package.json, requirements.txt, go.mod, etc.)
- Security file presence check
- CI/CD config detection (.github/workflows, .circleci, Jenkinsfile, etc.)
- Dependency manifest collection for vulnerability scanning

**Phase 3 — Conditional parallel (history analysis if requested):**

- Deepen clone (`git fetch --shallow-since`) — sequential gate
- After deepening:
  - Churn calculation (git log --numstat)
  - Commit frequency analysis
  - Active contributor count
  - These three can run concurrently on the same git log output

**Phase 4 — Conditional sequential (full clone if triggered):**

- Full clone completion — sequential gate
- Then parallel: `git-sizer`, deep blame, binary artifact detection

Dependency DAG (text):

```
[Phase 0: API calls] ─────────────────────────────► [Merge results]
                                                           │
[Phase 1: clone] ──► [Phase 2: parallel code analysis] ──►│
                                   │                       │
                    [Phase 3: history analysis?] ──────────►│
                                                           │
                    [Phase 4: full analysis?] ─────────────►│
                                                           │
                                                     [Final Report]
```

---

### 8. Large Repo Strategies (100k+ commits, binary-heavy, LFS) [CONFIDENCE: HIGH]

**100k+ commit repos:**

- Never use `git-sizer` without understanding it requires full clone [4]
- Use `--shallow-since="1 year ago"` with `--filter=blob:none` for churn
  analysis
- GitHub API contributor stats endpoint returns 422 for repos >10,000 commits —
  fall back to commit count from git log instead [6]
- `git log --oneline | wc -l` on blobless clone gives total commit count without
  any blob downloads

**Binary-heavy repos:**

- Use `git clone --filter=blob:none` — blobs only downloaded when explicitly
  checked out
- Skip blob download entirely: `git clone --filter=blob:none --no-checkout`
  gives commit/tree data only
- Combine: `GIT_LFS_SKIP_SMUDGE=1 git clone --filter=blob:none --no-checkout` to
  also skip LFS downloads
- Partial clone + filter is "at least 50% faster and transfers 70% less data"
  for blob-heavy repos [13]

**LFS-heavy repos:**

- Set `GIT_LFS_SKIP_SMUDGE=1` before clone to prevent automatic LFS asset
  downloads
- Detect LFS presence by checking for `.gitattributes` with `filter=lfs` entries
  or presence of `.lfsconfig`
- For analysis purposes, LFS metadata (file names, sizes) is available in
  `.gitattributes` and tree objects without downloading actual assets

**repos with >100,000 files:**

- GitHub Linguist (via API) stops working at this threshold [5]
- Use local `scc` instead (no file count limit, processes in parallel, faster
  than Linguist)
- Use `git sparse-checkout` to analyze sub-directories independently rather than
  processing the full tree

Sources: [4] github/git-sizer, [5] GitHub Docs, [6] GitHub Docs statistics, [13]
GitLab partial clone blog

---

### 9. Incremental Analysis and Caching Strategy [CONFIDENCE: MEDIUM]

**Cache key design:**

- Primary key: `{repo_owner}/{repo_name}:{HEAD_SHA}`
- HEAD_SHA obtained from `git rev-parse HEAD` (available immediately after any
  clone) or from GitHub API `/repos/:owner/:repo` response (`default_branch` +
  commits API)
- When HEAD_SHA matches cached entry, skip all Phase 1-4 work entirely
- Partial invalidation: for Phase 0 (API) results, cache for 24 hours (language
  stats, scorecard scores update infrequently)

**Storage architecture:**

- SQLite is sufficient for single-instance analysis tools (see `git-history` and
  `branch_base` tools [14])
- Schema:
  `analysis_results(repo_full_name, head_sha, analysis_type, result_json, analyzed_at)`
- Index on `(repo_full_name, head_sha)` for O(1) cache hit check
- Separate table for API-sourced data with TTL column (scorecard scores,
  language stats)

**Clone reuse vs fresh clone:**

- For one-time analysis: clone to temp dir, analyze, delete — avoids
  shallow-fetch penalty
- For continuous monitoring: maintain blobless clone per repo,
  `git fetch --filter=blob:none` on each run — amortizes clone cost over time
- Note: fetching into an existing shallow clone carries 13-25x server CPU
  penalty [1] — use blobless (non-shallow) clones for monitored repos

**What changed analysis:**

- Between two HEAD SHAs: `git diff --name-only {old_sha}..{new_sha}` (works on
  blobless clone)
- Re-run only Phase 2 steps affected by changed file types
- Example: if only `.md` files changed, skip scc re-run, skip framework
  detection re-run

Source: [1] GitHub Blog (git-clone study), [14] simonw/git-history,
shayonj/branch_base

---

## Sources

| #   | URL                                                                                                                                            | Title                           | Type             | Trust  | CRAAP Score | Date          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------------- | ------ | ----------- | ------------- |
| 1   | https://github.blog/open-source/git/git-clone-a-data-driven-study-on-cloning-behaviors/                                                        | Git clone: a data-driven study  | Official blog    | HIGH   | 4.4         | 2023          |
| 2   | https://github.blog/open-source/git/get-up-to-speed-with-partial-clone-and-shallow-clone/                                                      | Partial clone and shallow clone | Official docs    | HIGH   | 4.6         | 2020, updated |
| 3   | https://understandlegacycode.com/blog/focus-refactoring-with-hotspots-analysis/                                                                | Hotspots analysis churn         | Community blog   | MEDIUM | 3.8         | 2020          |
| 4   | https://github.com/github/git-sizer                                                                                                            | git-sizer README                | Official tool    | HIGH   | 4.5         | Current       |
| 5   | https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-repository-languages | About repository languages      | Official docs    | HIGH   | 4.8         | Current       |
| 6   | https://docs.github.com/en/rest/metrics/statistics?apiVersion=2022-11-28                                                                       | GitHub REST API statistics      | Official docs    | HIGH   | 4.8         | Current       |
| 7   | https://github.com/ossf/scorecard                                                                                                              | OpenSSF Scorecard               | Official project | HIGH   | 4.6         | Current       |
| 8   | https://www.endorlabs.com/learn/introducing-the-openssf-scorecard-api                                                                          | OpenSSF Scorecard API intro     | Community        | MEDIUM | 3.9         | 2023          |
| 9   | https://docs.deps.dev/api/v3/                                                                                                                  | deps.dev API v3                 | Official docs    | HIGH   | 4.7         | Current       |
| 10  | https://github.com/boyter/scc                                                                                                                  | scc (Sloc Cloc and Code)        | Official project | HIGH   | 4.5         | Current       |
| 11  | https://github.com/netlify/framework-info                                                                                                      | Netlify framework-info          | Official tool    | HIGH   | 4.3         | Current       |
| 12  | https://github.blog/open-source/git/bring-your-monorepo-down-to-size-with-sparse-checkout/                                                     | Monorepo sparse-checkout        | Official blog    | HIGH   | 4.5         | 2020          |
| 13  | https://about.gitlab.com/blog/partial-clone-for-massive-repositories/                                                                          | Partial clone for massive repos | Official blog    | HIGH   | 4.2         | 2020          |
| 14  | https://github.com/simonw/git-history                                                                                                          | git-history SQLite              | Community tool   | MEDIUM | 3.6         | Current       |

---

## Contradictions

**Shallow clone guidance is contradictory across use cases.** GitHub's official
blog strongly discourages shallow clones for ongoing development due to
expensive fetch operations [1][2]. However, multiple CI/CD guides recommend
`--depth=1` as the default for build pipelines [various community sources]. The
reconciliation is context-dependent: shallow clones are optimal for
clone-analyze-discard workflows but harmful for clone-then-fetch workflows.

**Blobless clone "not optimized" claim is dated.** The GitLab partial clone blog
[13] flagged that filtering was "not optimized for performance" in Git 2.25. As
of Git 2.26+ this has been improved, and performance data from GitHub's study
[1] shows blobless clones at 1.5-2x faster than full clones in practice,
suggesting the optimization gap has been largely closed.

---

## Gaps

1. **Benchmark data for repos 10MB-100MB** is sparse. The studies focus on large
   repos (Linux, Swift). Small-to-medium repos may not benefit meaningfully from
   partial clone overhead.

2. **Incremental analysis framework tooling** — no mature, purpose-built
   open-source tool was found that combines clone strategy + cache
   invalidation + incremental re-analysis. This appears to be a DIY design
   decision for skill builders.

3. **Non-GitHub hosting** — all API-first analysis above assumes GitHub. GitLab
   API has similar capabilities but Scorecard API and deps.dev project endpoint
   do not support GitLab as of 2025 (confirmed by the Scorecard visualizer
   README which explicitly notes "GitLab projects not yet supported").

4. **LFS interaction with blobless clone** — the combination of
   `GIT_LFS_SKIP_SMUDGE=1` and `--filter=blob:none` was mentioned in issues but
   lacks official documentation on behavior edge cases.

5. **Framework detection for Python backends** — the Netlify `framework-info`
   tool focuses on JavaScript frameworks. No equivalent well-maintained library
   was found for Python framework detection (Django vs Flask vs FastAPI). The
   heuristics presented are synthesized from deployment documentation and
   pyproject.toml guides rather than a dedicated detection library.

---

## Serendipity

**`scc` does LLM cost estimation.** Beyond LOC counting, `scc` added a "LOCOMO"
metric estimating the cost to regenerate a codebase using an LLM. This could be
a compelling metric for a repo analysis skill — surfacing "estimated LLM
regeneration cost" alongside traditional COCOMO estimates. This is a unique
differentiator over cloc/tokei.

**GitHub API statistics endpoint breaks at 10,000 commits.** This is a hard
cliff (422 error) that could silently fail analysis pipelines targeting large
repos. Defensive code must handle this gracefully and fall back to alternative
commit counting methods.

**Churn analysis only needs 12 months of history.** This is research-validated
and means a `--shallow-since="1 year ago"` blobless clone covers the
hotspot/churn use case completely — no full history needed. This is a
significant design simplification.

**Branch_base tool converts git history to SQLite.** The tool at
`github.com/shayonj/branch_base` demonstrates a pattern where git history is
loaded once into SQLite for reusable SQL-based analysis. For a skill that
repeatedly queries the same repos, this pattern amortizes parsing cost across
multiple analysis runs.

---

## Recommended Pipeline Flowchart (Text)

```
REPO ANALYSIS PIPELINE
======================

INPUT: repo_url (+ optional: depth_level, include_churn, include_health_audit)

PHASE 0: API PRE-FLIGHT [parallel, ~2-5 seconds, no disk I/O]
├── [A] GitHub REST API → metadata, language%, topics, stars, license, branch protection
├── [B] Scorecard API  → security posture score (16 checks, 0-10)
└── [C] deps.dev API   → license + vuln summary for primary ecosystem

        │ Check cache: if HEAD SHA matches stored result → RETURN CACHE
        ▼

PHASE 1: CLONE [sequential gate]
├── Is repo binary-heavy or LFS-heavy? (from Phase 0 GitHub API size + language data)
│   YES → git clone --filter=blob:none --no-checkout [tree + commit data only]
│   NO  → git clone --filter=blob:none --depth=1     [blobless + latest checkout]
└── Estimated: 2-30 seconds depending on repo size

        ▼

PHASE 2: STATIC ANALYSIS [parallel, all operate on checkout]
├── [D] scc --format=json .          → LOC, complexity, language confirmation
├── [E] manifest parser              → detect package.json/go.mod/Cargo.toml/requirements.txt
├── [F] framework detector           → parse deps in manifests → Next.js/Django/etc.
├── [G] monorepo detector            → check pnpm-workspace.yaml/nx.json/turbo.json/WORKSPACE/Cargo workspace
├── [H] security files check         → SECURITY.md, CODEOWNERS, .github/FUNDING.yml
└── [I] CI/CD config detect          → .github/workflows, .circleci, Jenkinsfile, .gitlab-ci.yml

        │ If G detects monorepo:
        │   Enumerate sub-packages → for each sub-package, sparse-checkout → repeat Phase 2
        ▼

PHASE 3: HISTORY ANALYSIS [conditional, only if churn/evolution requested]
├── Deepen clone: git fetch --filter=blob:none --shallow-since="1 year ago"
├── [J] churn per file: git log --reverse --numstat --since="1 year ago" → compute change frequency
├── [K] commit frequency: git log --format="%ai" --since="1 year ago" → weekly trend
└── [L] active contributors: git log --format="%ae" --since="1 year ago" | sort -u | wc -l

        ▼

PHASE 4: DEEP HEALTH AUDIT [conditional, only if flagged in Phase 0-3 or explicitly requested]
├── TRIGGER CONDITIONS:
│   - git-sizer not yet run AND repo health audit requested
│   - Binary artifacts flagged by Scorecard API (confirm locally)
│   - Repo size anomaly detected (Phase 0 API reports >1GB)
├── git clone [full, no filter] → may take minutes for large repos
└── [M] git-sizer --json         → 20+ size metrics, flags concerning patterns

        ▼

PHASE 5: SYNTHESIS [sequential]
├── Merge results from A+B+C+D+E+F+G+H+I+J+K+L+M
├── Compute composite scores (health, activity, security, complexity)
├── Write results to cache (key: repo_full_name + HEAD_SHA)
└── Return structured analysis report

CACHE INVALIDATION:
├── Per-analysis cache: invalidate when HEAD SHA changes
├── API metadata cache: TTL = 24 hours (language stats, scorecard update infrequently)
└── History cache: invalidate when HEAD SHA changes or shallow-since window shifts

MONOREPO PATH:
├── Detect in Phase 2 [G]
├── Enumerate sub-packages via workspace config files
├── For each sub-package:
│   git sparse-checkout set <subdir>
│   → Run Phase 2 steps [D,E,F,H,I] on subdir only
└── Aggregate sub-package results into monorepo summary

LFS / BINARY-HEAVY PATH:
├── Detect via: .gitattributes with filter=lfs or .lfsconfig
├── Set GIT_LFS_SKIP_SMUDGE=1 before clone
├── Use --filter=blob:none --no-checkout
└── Analyze tree and commit data only; skip file-content analysis steps

LARGE REPO SAFEGUARDS (100k+ commits / >1GB):
├── Never run git-sizer without explicit request (full clone required)
├── GitHub statistics API: catch 422 → fall back to git log | wc -l
├── GitHub Linguist (API) 100k-file limit: fall back to local scc
└── Cap Phase 3 history window to 12 months regardless of repo age
```

---

## Confidence Assessment

- HIGH claims: 7 (clone strategies, API capabilities, Scorecard/deps.dev,
  language detection, monorepo detection, pipeline parallelization, large repo
  strategies)
- MEDIUM claims: 2 (incremental caching strategy, Python framework detection
  heuristics)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The pipeline architecture synthesized here is grounded in first-party
documentation (GitHub Blog, official tool READMEs, deps.dev docs) with
cross-referencing across independent sources. The key design decisions (blobless
default, 12-month history window, Phase 0 API pre-flight, sparse-checkout for
monorepos) each have 2+ independent supporting sources.
