# Findings: LOC Counting, Code Churn Analysis, and Architecture Analysis Tools

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** D2a-3

---

## Key Findings

### LOC Counting Tools

---

#### 1. scc (Sloc, Cloc and Code) [CONFIDENCE: HIGH]

**What it does:** Counts physical lines of code, blank lines, comment lines, and
code lines across many languages. Uniquely adds COCOMO/LOCOMO cost projections,
cyclomatic complexity estimates, and Unique Lines of Code (ULOC) detection. Can
identify minified or generated files.

**Languages supported:** 322 languages as of current master [1].

**Invocation:**

```sh
scc [flags] [files or directories]
scc                        # current directory
scc --by-file src/         # per-file output
scc -f json src/           # JSON output
scc -f html src/ > out.html
```

**Output formats:** tabular (default), wide, json, json2, csv, csv-stream,
cloc-yaml, html, html-table, sql, sql-insert, openmetrics [1].

**Needs local clone?** Yes for CLI. Docker alternative works on mounted
directories:
`docker run --rm -it -v "$PWD:/pwd" ghcr.io/boyter/scc:master scc /pwd`

**License:** MIT [1] **GitHub stars:** 8.2k [1] **Maintenance:** Active. v3.5.0
beta current (March 2026). 1,572 commits [1].

---

#### 2. tokei [CONFIDENCE: HIGH]

**What it does:** Fast Rust-based LOC counter. Reports files, total lines, code,
comments, and blanks grouped by language. Uses a state machine (not regex) for
accurate nested-comment handling.

**Languages supported:** 150+ [2].

**Invocation:**

```sh
tokei ./path
tokei --files ./src        # per-file breakdown
tokei --sort lines src/    # sort by column
tokei --output json src/   # JSON output
tokei --exclude "*.min.js" src/
```

**Output formats:** human-readable table (default), JSON, YAML, CBOR [2].

**Needs local clone?** No. Install via package manager or `cargo install tokei`.
Works on any local directory.

**License:** MIT and Apache License 2.0 (dual) [2] **GitHub stars:** 14.2k [2]
**Maintenance:** Active. v12.x stable, v11.0.0 documented on docs.rs. 1,114
commits [2].

---

#### 3. cloc (Count Lines of Code) [CONFIDENCE: HIGH]

**What it does:** Perl-based LOC counter. Counts blank, comment, and physical
code lines across many languages. Supports archives, git commits, and diff
between two versions. Extensible via custom language definition files.

**Languages supported:** Many — C, C++, Perl, Python, Java, Go, D, Fortran,
Pascal, YAML, XML, JSON, and many others. Users can add custom language
definitions [3].

**Invocation:**

```sh
cloc <file|directory|archive>
cloc --git HEAD~5           # analyze git commit
cloc --diff v1.0 v2.0       # diff two versions
cloc --csv --out report.csv src/
docker run --rm -v $PWD:/tmp aldanial/cloc .
```

**Output formats:** plain text, Markdown, SQL, JSON, XML, YAML, CSV [3].

**Needs local clone?** Yes. Processes git commits but does not download remote
repos.

**License:** GPL v2 [3] **GitHub stars:** 22.8k [3] **Maintenance:** Active.
Latest release v2.08, January 24, 2026 [3].

---

#### 4. loc [CONFIDENCE: HIGH]

**What it does:** Rust reimplementation of cloc, claiming 100x faster
performance. Counts code, blank, and comment lines per language.

**Languages supported:** 90+ [4].

**Invocation:**

```sh
loc                         # current directory
loc --files src/            # per-file breakdown
loc --sort Comment ci/      # sort by column
loc --include 'ts$' src/    # filter by extension
loc --exclude 'sh$'
```

**Output formats:** tabular display only (no structured output formats) [4].

**Needs local clone?** Yes. Precompiled binaries from releases page or
`cargo install loc`.

**License:** MIT [4] **GitHub stars:** 2.4k [4] **Maintenance:** INACTIVE.
Author explicitly recommends scc instead (2019 note). Last release October 2017.
Not recommended for new projects [4].

---

#### 5. polyglot [CONFIDENCE: MEDIUM]

**What it does:** ATS-written LOC tool. Goal is accurate summary of project
contents. Notable for disambiguation of filenames where other tools fail.

**Languages supported:** Many. Full list in LANGUAGES.md in the repository [5].

**Invocation:**

```sh
poly                        # current directory
man poly                    # man page available
```

**Output formats:** formatted table (language, file count,
total/code/comment/blank lines) [5].

**Needs local clone?** No. Install script available without cloning.

**License:** BSD-3-Clause [5] **GitHub stars:** 256 [5] **Maintenance:**
DORMANT. Latest release 0.5.29 (January 10, 2020). ATS language limits
contribution pool. Benchmark performance comparable to scc [5, search results].

---

### Code Churn / Hotspot Tools

---

#### 6. git-of-theseus [CONFIDENCE: HIGH]

**What it does:** Python tool that analyzes Git repository history to visualize
code survival, cohort growth, author contributions, and file type statistics.
Produces graphs showing how old the surviving code is — i.e., how much of the
code written in year X is still present today.

**Languages supported:** Analysis is language-agnostic (operates on git history)
[6].

**Invocation:**

```sh
pip install git-of-theseus
git-of-theseus-analyze <path-to-repo>       # writes JSON data files
git-of-theseus-stack-plot cohorts.json      # stacked area chart
git-of-theseus-line-plot authors.json --normalize
git-of-theseus-survival-plot survival.json
```

**Output formats:** JSON data files (cohorts.json, authors.json, exts.json,
survival.json) consumed by matplotlib-based visualization scripts producing PNG
graphs [6].

**Needs local clone?** Yes. Requires access to the .git directory [6].

**License:** Apache License 2.0 [6] **GitHub stars:** 2.9k [6] **Maintenance:**
Active-ish. 160 commits, 2.9k stars, 18 open issues. Last checked March 2026.

---

#### 7. hercules [CONFIDENCE: MEDIUM]

**What it does:** Fast Go-based Git repository analysis engine. Produces line
burndown charts, developer contribution patterns, code ownership, file coupling,
structural hotspots, and comment sentiment. Reimplements git-of-theseus logic in
Go, claimed order of magnitude faster. Output piped to `labours` (Python) for
visualization.

**Languages supported:** Language-agnostic for most analyses. Some structural
analyses depended on Babelfish (now abandoned) [7].

**Invocation:**

```sh
hercules --burndown https://github.com/git/git | labours -m burndown-project
hercules --burndown --people /path/to/repo | labours -m burndown-people
hercules --couples --pb repo/ > output.pb   # protobuf format
```

**Output formats:** YAML (piped to labours), Protocol Buffers (--pb flag), JSON
export [7].

**Needs local clone?** No. Can accept remote URLs and clones automatically.
Caches repos for reuse [7].

**License:** Apache 2.0 [7] **GitHub stars:** 2.8k [7] **Maintenance:**
UNCERTAIN. Author returned from hiatus per November 2020 notice. Dependency on
Babelfish (now abandoned) is a known blocker for structural analyses. Some
analyses may be non-functional. Development described as "episodic." [7]

---

#### 8. git-fame [CONFIDENCE: HIGH]

**What it does:** Python tool that pretty-prints Git repository collaborators
sorted by contributions. Shows lines of code, commits, files modified, hours,
and months per author. Supports filtering by file extension (e.g., analyze only
C++ files).

**Languages supported:** Language-agnostic (operates on git log) [8].

**Invocation:**

```sh
pip install git-fame
git fame                          # current repo
git-fame                          # alternative invocation
python -m gitfame
git fame --sort=commits
git fame --loc=ins                # count insertions only
docker run --rm casperdcl/git-fame
# Web interface for public repos:
# git-fame.cdcl.ml/gh/{owner}/{repo}
```

**Output formats:** pipe tables (default), Markdown, JSON, CSV, TSV, YAML, SVG
[8].

**Needs local clone?** Yes for CLI. Web interface available for public GitHub
repos [8].

**License:** MPL-2.0 [8] **GitHub stars:** 808 [8] **Maintenance:** Active. 331
commits. Recent updates visible [8].

---

#### 9. git-quick-stats [CONFIDENCE: HIGH]

**What it does:** Shell-based tool providing a broad set of Git statistics:
commits by author, contributions by day/hour/weekday, heatmaps, detailed stats,
CSV exports. Both interactive and non-interactive modes.

**Languages supported:** Language-agnostic [9].

**Invocation:**

```sh
# Interactive menu:
git-quick-stats

# Non-interactive:
git-quick-stats -T   # detailed contributor stats
git-quick-stats -C   # contributor list
git-quick-stats -a   # commits per author
git-quick-stats -w   # commits by weekday
git-quick-stats -H   # heatmap
```

**Output formats:** ASCII graphs, tables, CSV export, JSON-formatted logs,
heatmaps [9].

**Needs local clone?** Yes. Runs git commands against local .git directory [9].

**License:** MIT [9] **GitHub stars:** 7k [9] **Maintenance:** Active. Updated
September 2, 2025. 348 commits. Python port (git-py-stats) updated December 22,
2025 [9, search results].

---

#### 10. gitinspector [CONFIDENCE: MEDIUM]

**What it does:** Multi-threaded Python tool that generates author contribution
statistics for Git repositories. Supports timeline analysis, file extension
filtering, and code metric violations reporting.

**Languages supported:** Language-agnostic for attribution stats [10].

**Invocation:**

```sh
npm install -g gitinspector     # or pip install gitinspector
gitinspector -HTlrm             # common flags for full HTML report
gitinspector --format=json repo/
gitinspector --since=2020-01-01 .
```

**Output formats:** HTML (standard and embedded), JSON, XML, plain text [10].

**Needs local clone?** Yes. Analyzes local git repositories.

**License:** GNU GPL v3 [10] **GitHub stars:** 2,500 [10] **Maintenance:**
ABANDONED. Last commit October 2020. Last release v0.4.4 (February 3, 2016).
PyPI health check: inactive. Not recommended for new projects [10, search
results].

---

#### 11. CodeScene [CONFIDENCE: HIGH — commercial reference]

**What it does:** Commercial SaaS platform combining behavioral code analysis
with code health metrics. Identifies hotspots (files with high churn + low code
health), tracks technical debt, measures developer knowledge distribution,
performs AI-assisted code reviews, and flags security risk patterns. Academic
research from Adam Tornhill underpins the approach.

**Languages supported:** 30+ programming languages [pricing page].

**Invocation:** SaaS — connect via GitHub, GitLab, Bitbucket, or Azure DevOps
OAuth. Enterprise self-hosted option available [11].

**Output formats:** Web dashboard, PDF reports, IDE integration (Code Health
Monitor), GitHub/GitLab PR comments (automated review) [11].

**Needs local clone?** No. Connects via VCS integration APIs [11].

**License:** Commercial (proprietary) [11] **Pricing:** Standard €18/active
author/month; Pro €27/active author/month; Enterprise: custom. Free Community
Edition for open-source projects [11]. **Maintenance:** Actively developed
commercial product.

---

### Architecture Analysis Tools

---

#### 12. dependency-cruiser [CONFIDENCE: HIGH]

**What it does:** Validates and visualizes JavaScript/TypeScript dependency
graphs against configurable rules. Detects circular dependencies, forbidden
imports, orphaned modules, missing package.json dependencies, and architecture
layer violations. Generates DOT graphs for Graphviz rendering.

**Languages supported:** JavaScript, TypeScript, CoffeeScript, LiveScript;
module formats ES6, CommonJS, AMD; file types .jsx, .tsx, .vue, .svelte [12].

**Invocation:**

```sh
npm install --save-dev dependency-cruiser
npx depcruise --init           # generate config
npx depcruise src              # analyze directory
npx depcruise --output-type dot src | dot -T svg > graph.svg
npx depcruise --output-type html src > report.html
npx depcruise --validate src   # check against rules
```

**Output formats:** text (eslint-like), DOT, CSV, HTML, JSON, Mermaid, plain
text, ndjson [12].

**Needs local clone?** Yes. Node.js tool that must be run inside the project
[12].

**License:** MIT [12] **GitHub stars:** 6.5k [12] **Maintenance:** Very active.
Latest release v17.3.10 (March 2026). 2,388 commits. 381 releases [12].

---

#### 13. madge [CONFIDENCE: HIGH]

**What it does:** Generates visual dependency graphs for JavaScript/TypeScript
modules. Detects circular dependencies and orphaned modules. Supports
programmatic API in addition to CLI.

**Languages supported:** JavaScript (AMD, CommonJS, ES6), TypeScript; CSS
preprocessors (Sass, Stylus, Less) [13].

**Invocation:**

```sh
npm install -g madge
madge path/src/app.js             # list dependencies
madge --circular path/src/app.js  # find circular deps
madge --orphans path/src/          # show orphaned modules
madge --image graph.svg path/src/  # generate graph (requires Graphviz)
```

**Programmatic API:**

```js
const madge = require("madge");
madge("path/to/app.js").then((res) => console.log(res.obj()));
```

**Output formats:** JSON (dependency objects), DOT, SVG/PNG (with Graphviz),
console lists [13].

**Needs local clone?** No. Install globally via npm.

**License:** MIT [13, bestofjs] **GitHub stars:** 10k [13] **Maintenance:** LOW
ACTIVITY. Last commit approximately 2 years ago. Latest npm version v8.0.0.
5.7M+ monthly npm downloads suggests continued adoption but project is not
actively developed [13].

---

#### 14. dep-tree [CONFIDENCE: HIGH]

**What it does:** Visualizes code-base complexity using 3D force-directed graphs
in the browser or interactive terminal navigation. Validates file dependency
rules via `.dep-tree.yml` for CI enforcement. Focused on keeping architectures
decoupled.

**Languages supported:** JavaScript/TypeScript, Python, Rust, Go [14].

**Invocation:**

```sh
brew install dep-tree          # macOS/Linux
npm install @dep-tree/cli      # cross-platform
pip install python-dep-tree    # Python

dep-tree entropy src/index.ts  # 3D browser visualization
dep-tree tree my-file.py       # terminal tree view
dep-tree explain 'src/a/**' 'src/b/**'  # explain deps between modules
dep-tree check                 # validate .dep-tree.yml rules
```

**Output formats:** 3D browser visualization (force-directed graph), interactive
terminal tree, rule validation report [14].

**Needs local clone?** No. Install via package managers.

**License:** Not specified in fetched content [14] **GitHub stars:** 1.7k [14]
**Maintenance:** Active. 543 commits, active development [14].

---

#### 15. ArchUnit [CONFIDENCE: HIGH]

**What it does:** Java library for architecture testing. Checks dependencies
between packages and classes, validates layered/hexagonal architecture
constraints, detects cyclic dependencies, and enforces naming/annotation
conventions — all as standard unit tests.

**Languages supported:** Java (analyzes JVM bytecode) [15].

**Invocation:**

```java
// Add to Maven/Gradle test dependencies:
// com.tngtech.archunit:archunit:1.4.1

@ArchTest
static final ArchRule domainShouldNotDependOnInfra =
    noClasses().that().resideInAPackage("..domain..")
        .should().dependOnClassesThat()
        .resideInAPackage("..infrastructure..");
```

Run via standard test framework (JUnit 4/5, TestNG) — `mvn test` or
`gradle test`.

**Output formats:** Standard test failure assertions with violation details
[15].

**Needs local clone?** Yes. Tests run inside the project's test suite against
local bytecode [15].

**License:** Apache License 2.0 [15] **GitHub stars:** 3.6k [15]
**Maintenance:** Active. v1.4.1 released May 7, 2025. 2,581 commits [15].

---

### Dead Code Detection Tools

---

#### 16. Knip [CONFIDENCE: HIGH]

**What it does:** Mark-and-sweep algorithm that finds unused files, exports,
types, and dependencies (including devDependencies) in JavaScript/TypeScript
projects. 100+ plugins for frameworks (Next.js, Astro, Vite, Jest, ESLint,
GitHub Actions, etc.). VS Code extension and Language Server available.
Recommended successor to ts-prune and unimported.

**Languages supported:** JavaScript, TypeScript [16].

**Invocation:**

```sh
npx knip                    # single-run analysis
npx knip --fix              # auto-remove unused exports
npx knip --reporter json    # JSON output
npx knip --production       # exclude test files
```

**Output formats:** Terminal report (default), JSON, custom reporters [16].

**Needs local clone?** No. `npx knip` from project root.

**License:** ISC [16] **GitHub stars:** 10.8k [16] **Maintenance:** Very active.
v6.1.1 released March 31, 2026. 564 releases. Used by 12.5k dependents. Adopted
by Adobe, AWS, Google, Microsoft, Shopify [16].

---

#### 17. Vulture [CONFIDENCE: HIGH]

**What it does:** Static analysis tool for Python that finds unused imports,
variables, attributes, functions, and classes. Assigns confidence percentages
(60-100%) to each finding. Integrates with pre-commit hooks and VS Code.

**Languages supported:** Python only [17].

**Invocation:**

```sh
pip install vulture
vulture myscript.py
vulture myscript.py mypackage/
vulture myscript.py --min-confidence 100   # only 100% dead code
python3 -m vulture myscript.py
```

**Output format (pyflakes-compatible):**

```
dead_code.py:1: unused import 'os' (90% confidence)
dead_code.py:4: unused function 'greet' (60% confidence)
```

**Needs local clone?** No. `pip install vulture`.

**License:** MIT [17] **GitHub stars:** 4.4k [17] **Maintenance:** Very active.
v2.16 released March 25, 2026. 22 releases. Used by 6.3k dependent projects
[17].

---

#### 18. ts-prune [CONFIDENCE: HIGH — historical]

**What it does:** Finds potentially unused exports in TypeScript projects.
Reports file:line - exportName for each unused export. Simpler than Knip with
narrower scope.

**Languages supported:** TypeScript (and JavaScript) [18].

**Invocation:**

```sh
npx ts-prune
npx ts-prune -p tsconfig.json
npx ts-prune -i "src/index|types"   # ignore pattern
npx ts-prune -e                     # exit with error if unused found
```

**Output format:** `src/utils/math.ts:2 - subtract` [18].

**Needs local clone?** No. `npx ts-prune` from project root.

**License:** MIT (OSS) [18] **GitHub stars:** 2.1k [18] **Maintenance:**
ARCHIVED September 19, 2025. Maintenance mode since ~2023. No new features.
Official recommendation: migrate to Knip [18, search results].

---

#### 19. unimported [CONFIDENCE: HIGH — historical]

**What it does:** Traces import chains from entry files to find dangling source
files and unused package.json dependencies. Three-section report: unresolved
imports, unused dependencies, unimported files.

**Languages supported:** JavaScript, TypeScript (JS/JSX/TS/TSX) [19].

**Invocation:**

```sh
npx unimported           # analyze current project
npx unimported --fix     # auto-remove unimported files
npx unimported --init    # create config file
```

**Output formats:** terminal report with three sections [19].

**Needs local clone?** No. `npx unimported` from project root.

**License:** MIT [19] **GitHub stars:** 2k [19] **Maintenance:** ARCHIVED March
10, 2024. Maintainer recommends migrating to Knip [19].

---

#### 20. source-map-explorer [CONFIDENCE: HIGH]

**What it does:** Analyzes JavaScript bundle composition through source maps.
Determines which original source file contributed each byte to a minified
bundle. Primarily a bundle analysis tool rather than dead code detector.

**Languages supported:** JavaScript, Sass, LESS (via source maps) [20].

**Invocation:**

```sh
npm install -g source-map-explorer
source-map-explorer bundle.min.js
source-map-explorer bundle.min.js bundle.min.js.map
source-map-explorer --html report.html dist/js/*.js
source-map-explorer --json dist/bundle.js
```

**Output formats:** interactive HTML treemap, JSON, TSV [20].

**Needs local clone?** No. Install globally or use on local build artifacts.

**License:** MIT [20] **GitHub stars:** 3.9k [20] **Maintenance:** Active. 192
commits, steady maintenance [20].

---

#### 21. webpack-bundle-analyzer [CONFIDENCE: HIGH]

**What it does:** Webpack plugin and CLI utility that visualizes webpack bundle
composition as an interactive zoomable treemap. Shows stat, parsed, gzip,
brotli, and zstandard sizes. More webpack-specific than source-map-explorer.

**Languages supported:** JavaScript (webpack output) [21].

**Invocation:**

```js
// webpack.config.js:
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
module.exports = { plugins: [new BundleAnalyzerPlugin()] };
```

```sh
# CLI:
webpack-bundle-analyzer stats.json [bundleDir]
```

**Output formats:** server mode (HTTP interactive report), static HTML, JSON,
disabled (stats-only) [21].

**Needs local clone?** No. `npm install --save-dev webpack-bundle-analyzer`.

**License:** MIT [21] **GitHub stars:** 12.7k [21] **Maintenance:** Very active.
v5.3.0 released March 25, 2026. 2.4M dependents [21].

---

## Sources

| #   | URL                                                        | Title                          | Type          | Trust  | CRAAP | Date     |
| --- | ---------------------------------------------------------- | ------------------------------ | ------------- | ------ | ----- | -------- |
| 1   | https://github.com/boyter/scc                              | scc - Sloc, Cloc and Code      | Official repo | HIGH   | 4.4   | Mar 2026 |
| 2   | https://github.com/XAMPPRocky/tokei                        | tokei - Count your code        | Official repo | HIGH   | 4.4   | Mar 2026 |
| 3   | https://github.com/AlDanial/cloc                           | cloc - Count Lines of Code     | Official repo | HIGH   | 4.6   | Jan 2026 |
| 4   | https://github.com/cgag/loc                                | loc - Count lines of code      | Official repo | HIGH   | 4.0   | Mar 2026 |
| 5   | https://github.com/vmchale/polyglot                        | polyglot - LOC counter         | Official repo | HIGH   | 3.4   | Mar 2026 |
| 6   | https://github.com/erikbern/git-of-theseus                 | git-of-theseus                 | Official repo | HIGH   | 4.2   | Mar 2026 |
| 7   | https://github.com/src-d/hercules                          | hercules - Git analysis        | Official repo | HIGH   | 3.6   | Mar 2026 |
| 8   | https://github.com/casperdcl/git-fame                      | git-fame - contributor stats   | Official repo | HIGH   | 4.2   | Mar 2026 |
| 9   | https://github.com/git-quick-stats/git-quick-stats         | git-quick-stats                | Official repo | HIGH   | 4.4   | Sep 2025 |
| 10  | https://github.com/ejwa/gitinspector                       | gitinspector                   | Official repo | HIGH   | 3.2   | Oct 2020 |
| 11  | https://codescene.com/pricing                              | CodeScene pricing              | Official docs | HIGH   | 4.6   | Mar 2026 |
| 12  | https://github.com/sverweij/dependency-cruiser             | dependency-cruiser             | Official repo | HIGH   | 4.8   | Mar 2026 |
| 13  | https://github.com/pahen/madge                             | madge                          | Official repo | HIGH   | 4.0   | 2024     |
| 14  | https://github.com/gabotechs/dep-tree                      | dep-tree                       | Official repo | HIGH   | 4.2   | Mar 2026 |
| 15  | https://github.com/TNG/ArchUnit                            | ArchUnit                       | Official repo | HIGH   | 4.6   | May 2025 |
| 16  | https://github.com/webpro-nl/knip                          | Knip                           | Official repo | HIGH   | 4.8   | Mar 2026 |
| 17  | https://github.com/jendrikseipp/vulture                    | Vulture                        | Official repo | HIGH   | 4.8   | Mar 2026 |
| 18  | https://github.com/nadeesha/ts-prune                       | ts-prune (archived)            | Official repo | HIGH   | 4.2   | Sep 2025 |
| 19  | https://github.com/smeijer/unimported                      | unimported (archived)          | Official repo | HIGH   | 4.2   | Mar 2024 |
| 20  | https://github.com/danvk/source-map-explorer               | source-map-explorer            | Official repo | HIGH   | 4.4   | Mar 2026 |
| 21  | https://github.com/webpack-contrib/webpack-bundle-analyzer | webpack-bundle-analyzer        | Official repo | HIGH   | 4.8   | Mar 2026 |
| 22  | https://bestofjs.org/projects/madge                        | Best of JS - Madge stats       | Community     | MEDIUM | 3.6   | Feb 2026 |
| 23  | https://effectivetypescript.com/2023/07/29/knip/           | Effective TypeScript: Use knip | Community     | MEDIUM | 3.8   | Jul 2023 |
| 24  | https://snyk.io/advisor/python/gitinspector                | gitinspector PyPI health       | Tool analysis | MEDIUM | 3.6   | Mar 2026 |

---

## Contradictions

**Hercules maintenance:** The tool is described as "actively maintained" in its
README (post-2020 note from author). However, a known blocking issue is the
abandoned Babelfish dependency used for code parsing in structural analyses. The
net result is unclear: Go-based burndown/churn analyses work, but some
language-specific structural features may be broken. The project is neither
clearly alive nor clearly dead.

**madge activity vs. adoption:** madge has not received a commit in
approximately 2 years, but still has 6.35M monthly npm downloads (Feb 2026) and
10k stars. Some community sources describe it as "not actively maintained" while
others treat it as the standard JS visualization tool. A successor project
(Skott) was announced in a DEV Community post but has not displaced madge.

**loc vs. performance claims:** loc claims 100x speed over cloc; scc benchmarks
from March 2026 show scc -c is faster than polyglot by 1.78x and tokei by 2.68x,
but loc is excluded from that comparison (it is unmaintained). Performance
ordering appears to be: scc ≈ tokei > cloc >> polyglot, with loc having been
fast but unmaintained since 2017.

---

## Gaps

1. **dep-tree license:** License details were not captured in the fetched
   content. The repository exists at gabotechs/dep-tree but the license file was
   not surfaced. Would need direct check of LICENSE file in the repo.

2. **Hercules current breakage scope:** Could not determine exactly which
   analyses in Hercules are currently broken due to the abandoned Babelfish
   dependency. The burndown/churn analyses likely work; structural/hotness
   analyses may not.

3. **gitinspector Python 3 compatibility:** The latest release is v0.4.4
   from 2016. It is unknown whether it runs on Python 3.12+. Community forks
   exist but were not evaluated.

4. **CodeScene self-hosted deployment details:** The pricing page confirms SaaS
   and Enterprise options exist but the exact deployment architecture (Docker,
   Kubernetes, etc.) and whether it requires a local code clone or uses
   API-based access was not fully confirmed from public documentation.

5. **polyglot Windows support:** The tool is described as "best on Linux
   systems" and written in ATS, an obscure language. Windows support status is
   unverified.

6. **import-graph as a named tool:** The scope references "import-graph" as a
   distinct tool. No standalone tool with this exact name was found. The concept
   is covered by dep-tree, dependency-cruiser, madge, and pyan (Python). This
   may be a generic term rather than a specific package.

---

## Serendipity

**Skott as madge successor:** A DEV Community post announced "Skott" as the new
Madge (gabotechs/dep-tree may also be part of this space). Worth tracking for
the architecture visualization category.

**dep-tree CI enforcement:** dep-tree's `dep-tree check` subcommand with
`.dep-tree.yml` rules is notably CI-friendly — essentially architecture-as-code
with pass/fail for pipelines. Similar to dependency-cruiser's validation mode
but with multi-language support including Python/Rust/Go.

**Knip MCP integration:** Knip v6 has released an MCP server (`@knip/mcp`),
making it AI-assistant-accessible for dead code queries. Notable for the
project's AI-tooling context.

**CodeScene academic foundation:** The hotspot methodology is backed by Adam
Tornhill's book "Your Code as a Crime Scene" (2015) and follow-up "Software
Design X-Rays" (2018). The behavioral code analysis approach (coupling churn
frequency with code health) has peer-reviewed backing, distinguishing it from
pure metrics tools.

**scc complexity metric uniqueness:** scc is the only tool in the LOC category
that computes cyclomatic complexity estimates per file. The tokei maintainer
explicitly ruled out adding complexity calculations, making scc the de-facto
choice when complexity data is needed alongside line counts.

---

## Comparison Tables

### LOC Counting Tools

| Tool     | Stars | Language | Speed        | Languages | Complexity   | Output Formats                             | License        | Status   |
| -------- | ----- | -------- | ------------ | --------- | ------------ | ------------------------------------------ | -------------- | -------- |
| scc      | 8.2k  | Go       | Fastest (v3) | 322       | Yes (unique) | tabular, json, csv, html, sql, openmetrics | MIT            | Active   |
| tokei    | 14.2k | Rust     | Fast         | 150+      | No           | table, json, yaml, cbor                    | MIT/Apache-2.0 | Active   |
| cloc     | 22.8k | Perl     | Slow         | Many      | No           | text, json, xml, yaml, csv, sql, md        | GPL v2         | Active   |
| loc      | 2.4k  | Rust     | Fast         | 90+       | No           | tabular only                               | MIT            | INACTIVE |
| polyglot | 256   | ATS      | Fast         | Many      | No           | tabular only                               | BSD-3-Clause   | Dormant  |

### Code Churn / Hotspot Tools

| Tool            | Stars | Language | What It Measures                         | Remote?             | Output                      | License    | Status    |
| --------------- | ----- | -------- | ---------------------------------------- | ------------------- | --------------------------- | ---------- | --------- |
| git-of-theseus  | 2.9k  | Python   | Code age/survival, author cohorts        | No                  | PNG graphs via matplotlib   | Apache 2.0 | Active    |
| hercules        | 2.8k  | Go       | Burndown, ownership, coupling, sentiment | Yes (auto-clone)    | YAML/protobuf → viz         | Apache 2.0 | Uncertain |
| git-fame        | 808   | Python   | Author LOC/commit/file attribution       | No (Web for public) | table, json, csv, svg       | MPL-2.0    | Active    |
| git-quick-stats | 7k    | Shell    | Commits by time/author, heatmaps         | No                  | ASCII, CSV, JSON            | MIT        | Active    |
| gitinspector    | 2.5k  | Python   | Author timeline, violations              | No                  | HTML, JSON, XML             | GPL v3     | ABANDONED |
| CodeScene       | N/A   | SaaS     | Hotspots, churn+health, knowledge        | Yes (API)           | Dashboard, PDF, PR comments | Commercial | Active    |

### Architecture Analysis Tools

| Tool               | Stars | Language Scope          | What It Checks                       | Remote? | Output                   | License    | Status       |
| ------------------ | ----- | ----------------------- | ------------------------------------ | ------- | ------------------------ | ---------- | ------------ |
| dependency-cruiser | 6.5k  | JS/TS/CS                | Dependency rules, circular, orphans  | No      | DOT, HTML, JSON, Mermaid | MIT        | Very active  |
| madge              | 10k   | JS/TS                   | Circular deps, orphans, graphs       | No      | JSON, DOT, SVG/PNG       | MIT        | Low activity |
| dep-tree           | 1.7k  | JS/TS, Python, Rust, Go | Dependency entropy, rule validation  | No      | 3D browser viz, terminal | Unknown    | Active       |
| ArchUnit           | 3.6k  | Java (JVM)              | Layer rules, cycle detection, naming | No      | JUnit test failures      | Apache 2.0 | Active       |

### Dead Code Detection Tools

| Tool       | Stars | Language Scope | What It Finds                                                | Remote? | License | Status              |
| ---------- | ----- | -------------- | ------------------------------------------------------------ | ------- | ------- | ------------------- |
| Knip       | 10.8k | JS/TS          | Files, exports, types, deps, devDeps                         | No      | ISC     | Very active         |
| Vulture    | 4.4k  | Python         | Unused imports, vars, functions, classes (with confidence %) | No      | MIT     | Very active         |
| ts-prune   | 2.1k  | TypeScript     | Unused exports only                                          | No      | MIT     | ARCHIVED (Sep 2025) |
| unimported | 2k    | JS/TS          | Unimported files, unused deps                                | No      | MIT     | ARCHIVED (Mar 2024) |

### Bundle Analysis (related)

| Tool                    | Stars | What It Does                 | Integration         | Output                  | License | Status      |
| ----------------------- | ----- | ---------------------------- | ------------------- | ----------------------- | ------- | ----------- |
| source-map-explorer     | 3.9k  | Source map byte attribution  | CLI, Node API       | HTML treemap, JSON, TSV | MIT     | Active      |
| webpack-bundle-analyzer | 12.7k | Webpack bundle visualization | Webpack plugin, CLI | Interactive HTML, JSON  | MIT     | Very active |

---

## Confidence Assessment

- HIGH claims: 18
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

Most findings are from official GitHub repositories fetched directly (Tier 1),
cross-referenced with search results from multiple sources. The primary areas of
lower confidence are the current functional state of hercules (uncertain
dependency breakage) and polyglot's maintenance trajectory (dormant but not
formally archived).
