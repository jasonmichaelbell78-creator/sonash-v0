# Findings: Static Analysis and Linting Tools for Automated Code Analysis of GitHub Repos

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** D2a-1

---

## Key Findings

### Individual Language Linters

---

**1. ESLint — JavaScript/TypeScript** [CONFIDENCE: HIGH]

ESLint is the dominant linter for JavaScript and TypeScript. It is pluggable —
every rule is a plugin — and supports the full ECMAScript/JSX surface area via
Espree parsing. It requires Node.js (^20.19.0, ^22.13.0, or >=24).

- **CLI invocation:** `eslint [files]` with `--format json` or `--format html`
  flags.
- **Output formats (built-in):** `stylish` (default human-readable), `json`,
  `json-with-metadata`, `html`. SARIF is **not built-in**; requires
  `@microsoft/eslint-formatter-sarif` plugin (265k weekly downloads).
- **Programmatic API:** Full Node.js API via `ESLint` class. `lintText(code)`
  can lint a string in memory without touching the filesystem — meaning it can
  analyze fetched file content without a local clone.
- **License:** MIT
- **GitHub stars:** 27.2k [1]
- **Current version:** v9/v10 (as of early 2026)
- **Maintenance:** Extremely active; biweekly scheduled releases.
- **Requires clone:** For CLI usage, yes. For programmatic `lintText()` API, no
  — can lint arbitrary strings.
- **Unique strengths:** Largest plugin ecosystem of any linter. Flat config
  (`eslint.config.js`) since v9. typescript-eslint extends it to full TypeScript
  coverage.

---

**2. Pylint — Python** [CONFIDENCE: HIGH]

Pylint performs deep static analysis of Python code using type inference. It
finds errors, enforces coding standards, and identifies code smells.

- **CLI invocation:** `pylint [files]` with `--output-format=<format>`.
- **Output formats (built-in):** `text` (default), `json`, `parseable`,
  `colorized`, `msvs`. SARIF is **not built-in**; requires `pylint-sarif`
  external converter (GrammaTech).
- **License:** GPLv2
- **GitHub stars:** 5.7k [2]
- **Current version:** v4.0.5 (released February 2026)
- **Maintenance:** Active; 9,990+ commits, 480,000+ dependents.
- **Requires clone:** Yes — runs locally against Python source files.
- **Unique strengths:** Deepest Python static analysis available. Infers types,
  detects attribute errors, undefined variables. Slower than Ruff/Flake8 but
  catches more issues.

---

**3. Flake8 — Python** [CONFIDENCE: HIGH]

Flake8 is a wrapper combining PyFlakes (logic errors), pycodestyle (PEP 8), and
McCabe (complexity). Lightweight and fast.

- **CLI invocation:** `flake8 [files]` — default output is
  `file:line:col: code message`.
- **Output formats (built-in):** `default` and `pylint` text formats only. JSON
  via `flake8-json` plugin (PyCQA-maintained). SARIF via
  `flake8-sarif-formatter` plugin (GitHub Advanced Security team, MIT license).
- **License:** MIT
- **GitHub stars:** 3.8k [3]
- **Current version:** 7.3.0
- **Maintenance:** Active, maintained by PyCQA.
- **Requires clone:** Yes.
- **Unique strengths:** Massive plugin ecosystem. Extremely fast for style
  enforcement. Note: Ruff is now a popular drop-in replacement that is 10-100x
  faster.

---

**4. RuboCop — Ruby** [CONFIDENCE: HIGH]

RuboCop is the primary Ruby static analyzer and formatter, based on the
community Ruby Style Guide.

- **CLI invocation:** `rubocop [files]` with `--format <formatter>` flag.
- **Output formats (built-in):** progress (default), simple, clang, fuubar,
  worst, tap, quiet, json, html, files, offenses, github (GitHub Actions
  format). SARIF via external `code-scanning-rubocop` gem.
- **License:** MIT
- **GitHub stars:** 12.8k [4]
- **Maintenance:** Very active; 16,106+ commits, 42+ open PRs.
- **Requires clone:** Yes — gem installed, runs against Ruby files locally.
- **Unique strengths:** Autocorrect for most offenses (`--autocorrect`).
  Built-in LSP server for editor integration. Extensive cop ecosystem
  (rubocop-rails, rubocop-rspec, etc.).

---

**5. Clippy — Rust** [CONFIDENCE: HIGH]

Clippy is the official Rust linter maintained by the Rust language team. It runs
as a Cargo subcommand.

- **CLI invocation:** `cargo clippy` or
  `cargo clippy --all-targets --all-features`. `--message-format=json` flag
  outputs machine-readable JSON.
- **Output formats (native):** Terminal text warnings. JSON via
  `--message-format=json` (Cargo's own format). SARIF via `clippy-sarif` crate:
  pipe `cargo clippy --message-format=json | clippy-sarif`.
- **License:** Apache-2.0 / MIT (dual)
- **GitHub stars:** 13k [5]
- **Maintenance:** Extremely active — part of the rust-lang org, updated with
  every Rust release.
- **Number of lints:** 800+ organized by category (correctness, style,
  complexity, performance, pedantic, restriction).
- **Requires clone:** Yes — runs against a Cargo project. Cannot analyze Rust
  code without a local project/clone.
- **Unique strengths:** 800+ machine-checked lints covering correctness errors
  that would compile but behave wrong. Autocorrect via `cargo clippy --fix`.

---

**6. golangci-lint — Go** [CONFIDENCE: HIGH]

golangci-lint is a meta-linter aggregator for Go that runs 100+ Go linters in
parallel with caching.

- **CLI invocation:** `golangci-lint run`. In v2:
  `--output.sarif.path=results.sarif`, `--output.json.path=results.json`, etc.
- **Output formats (built-in, v2):** `text` (colored, default), `json`, `tab`,
  `html`, `checkstyle`, `code-climate`, `junit-xml`, `junit-xml-extended`,
  `teamcity`, `sarif`. (Note: v2 released 2025-03-24 changed output config from
  `--out-format` flag to `--output.<format>.path` syntax.)
- **License:** GPL-3.0
- **GitHub stars:** 18.7k [6]
- **Current version:** v2.11.4 (March 2026)
- **Maintenance:** Very active. v2 is a major rewrite with
  `golangci-lint migrate` for upgrading from v1.
- **Requires clone:** Yes — analyzes Go source with build cache; requires local
  filesystem.
- **Unique strengths:** Only meta-linter for Go. Parallel execution, caching.
  Native SARIF output. `golangci-lint fmt` command in v2 for formatting.

---

**7. PHPStan — PHP** [CONFIDENCE: HIGH]

PHPStan is a PHP static analysis tool focusing on finding bugs without running
code. Used by ~130,000 projects.

- **CLI invocation:** `phpstan analyse [paths] --error-format=<format>`.
- **Output formats (built-in):** `table` (default), `raw`, `checkstyle`, `json`,
  `prettyJson`, `junit`, `github`, `gitlab`, `teamcity`. SARIF via external
  `phpstan-sarif-formatter` package (not bundled).
- **License:** MIT
- **GitHub stars:** 13.9k [7]
- **Maintenance:** Active; ~130k dependent projects.
- **Requires clone:** Yes — runs against PHP source locally.
- **Unique strengths:** Rule levels 0–9 allow gradual adoption. PHPDoc type
  inference. PHPStan Pro offers web UI and watch mode (paid feature).

---

**8. Checkstyle — Java** [CONFIDENCE: HIGH]

Checkstyle enforces Java coding standards — Google Java Style Guide and Sun Code
Conventions by default.

- **CLI invocation:**
  `java -jar checkstyle-<version>-all.jar -f <format> -c <config> [files]`. `-f`
  accepts `plain`, `xml`, `sarif`.
- **Output formats (built-in):** `plain` (default text), `xml` (Checkstyle XML
  format), `sarif` (native SARIF support via `SarifLogger` class — added in
  version 10.x). **Note: SARIF is natively built-in, unlike most linters in this
  list.**
- **License:** LGPL-2.1 and Apache-2.0
- **GitHub stars:** 8.9k [8]
- **Current version:** 13.4.0 (March 2026); GSoC 2025 and 2026 ideas listed.
- **Maintenance:** Active; participates in GSoC yearly.
- **Requires clone:** Yes — standalone JAR requires source files locally.
- **Unique strengths:** Only tool on this list with built-in SARIF output (no
  plugin needed). Highly configurable XML config. Ant and Maven plugin
  integrations.

---

**9. SwiftLint — Swift** [CONFIDENCE: HIGH]

SwiftLint enforces Swift style and conventions, using SwiftSyntax, Clang, and
SourceKit.

- **CLI invocation:** `swiftlint lint` with `--reporter <format>`.
- **Output formats (built-in):** `xcode` (default), `json`, `csv`, `checkstyle`,
  `codeclimate`, `emoji`, `github-actions-logging`, `gitlab`, `html`, `junit`,
  `markdown`, `relative-path`, `sarif`, `sonarqube`, `summary`. **SARIF is
  natively built-in.**
- **License:** MIT (per GitHub repo; LICENSE file present)
- **GitHub stars:** 19.5k [9]
- **Maintenance:** Active.
- **Requires clone:** Yes — requires Swift toolchain (SwiftSyntax). Can be
  installed via Homebrew, SPM, or Mint without Xcode, but Xcode is the standard
  host. Cannot lint Swift remotely without local toolchain.
- **Unique strengths:** `swiftlint analyze` uses full type-checked AST (requires
  compiler log). Most comprehensive Swift-only linter. 19.5k stars makes it the
  highest-starred single-language linter on this list.

---

**10. ktlint — Kotlin** [CONFIDENCE: HIGH]

ktlint is an "anti-bikeshedding" Kotlin linter and formatter, inspired by Go's
gofmt. No configuration required by default.

- **CLI invocation:** `ktlint [--format]` or `ktlint --reporter=<format>`.
- **Output formats (built-in):** `plain`, `json`, `html`, `checkstyle`, `sarif`,
  `baseline`. **SARIF is natively built-in.**
- **License:** MIT
- **GitHub stars:** 6.7k [10]
- **Current version:** v1.8.0 (November 2025)
- **Maintenance:** Active.
- **Requires clone:** Yes.
- **Unique strengths:** Zero-configuration by default. `.editorconfig` support.
  Opinionated — deliberate anti-bikeshedding philosophy. Extensible with custom
  rulesets.

---

### Multi-Language Meta-Linters

---

**11. MegaLinter** [CONFIDENCE: HIGH]

MegaLinter is a Python-based meta-linter that aggregates 100+ linters for 69
languages, 23 formats, and 21 tooling formats. Maintained by OX Security.

- **CLI/invocation:** GitHub Action (`oxsecurity/megalinter@v9`), Docker
  (`docker run oxsecurity/megalinter`), or `mega-linter-runner` npm package for
  local runs.
- **Output formats:** Text logs, JSON, Markdown summaries, SARIF. Reporters for
  GitHub/GitLab/Azure/Bitbucket PR comments, Grafana API, email.
- **License:** AGPL-3.0
- **GitHub stars:** 2.4k [11]
- **Current version:** v9 (latest major)
- **Maintenance:** Very active; 6,220+ commits.
- **Requires clone:** Yes — runs as Docker container against mounted source
  directory. The codebase must be present in the container (via git checkout or
  volume mount).
- **Unique strengths vs super-linter:**
  - Parallel linter execution (Python multiprocessing vs super-linter's
    sequential Bash)
  - "Flavors" — smaller Docker images per project type
  - Auto-fix capability (applies fixes and pushes/PR)
  - LLM Advisor feature (v9) for AI-guided remediation
  - More languages than super-linter (69 vs 50+)
  - Environment variable protection (security)
  - More reporters and accurate per-file error counting
- **Docker pull count:** 5.5M+

---

**12. super-linter** [CONFIDENCE: HIGH]

super-linter is GitHub's original multi-language linter, now independently
maintained. Combines 100+ linters into a single Docker container.

- **CLI/invocation:** GitHub Action (`super-linter/super-linter@v8.5.0`) or
  Docker container on any OCI runtime. **Note: originally required GitHub
  Actions; now runs standalone via Docker.**
- **Output formats:** Console text, GitHub Actions status checks, optional PR
  summary comments, job summaries. No native SARIF output documented.
- **License:** MIT
- **GitHub stars:** 10.4k [12]
- **Current version:** v8.5.0
- **Maintenance:** Active; 5,307+ commits, independent maintainers since GitHub
  handed off the project.
- **Requires clone:** Yes — Docker container mounts repository content.
- **Unique strengths vs MegaLinter:**
  - Higher GitHub star count (10.4k vs 2.4k) — broader adoption
  - MIT license (less restrictive than AGPL-3.0)
  - Simpler setup; "highly curated" linter set avoids redundant checks
  - Since v6, runs linters in parallel

---

**13. Trunk Code Quality (Trunk Check)** [CONFIDENCE: MEDIUM]

Trunk Check is a meta-linter CLI and daemon that manages 100+ linters with a
"Hold The Line" (HTL) approach — only reports new issues on changed code, not
pre-existing issues. This makes it uniquely suited for incremental adoption.

- **CLI invocation:** `trunk check` (runs background daemon).
  `trunk check --all` for full repo scan.
- **Output formats:** CLI text output. JSON output via configuration. Note: the
  web-based CI Analytics and Code Quality web issue browser were **deprecated
  and shut down July 27, 2025**. The CLI itself remains active.
- **License:** Plugins repo is MIT. Core CLI binary is proprietary. Free for
  public repos and private repos with <5 active committers; paid for larger
  teams.
- **GitHub stars:** trunk-action repo: 232 stars; plugins repo: 153 stars [13]
- **Maintenance:** Active CLI development. Web product sunset July 2025.
- **Requires clone:** Yes — CLI requires local codebase.
- **Unique strengths:**
  - "Hold The Line" — lints only new/changed code vs upstream, enabling
    incremental adoption without blocking on pre-existing debt
  - Background daemon pre-computes results for fast feedback
  - IDE integration (VS Code, Neovim)
  - Hermetic tool installation — installs exact linter versions per project
  - Best-in-class for teams adopting linting into existing codebases with debt

---

## API-Only / Without-Clone Assessment

All tools in this list are **primarily designed to run against local source
code**. None provide a public REST API for submitting code remotely. The key
differentiators are:

| Tool                   | Can Run Without Clone | Method                                                        |
| ---------------------- | --------------------- | ------------------------------------------------------------- |
| ESLint                 | PARTIAL               | `lintText()` Node.js API can analyze string content in memory |
| All others (CLI tools) | NO                    | Require filesystem access to source files                     |
| MegaLinter (Docker)    | NO                    | Docker volume mount required                                  |
| super-linter (Docker)  | NO                    | Docker volume mount required                                  |
| Trunk Check (CLI)      | NO                    | Local daemon model                                            |

In a GitHub repo analysis context, **all tools require at least a shallow clone
or equivalent file access**. The typical approach is `git clone --depth=1`
before running analysis. GitHub Actions-native tools (MegaLinter, super-linter)
run after the `actions/checkout` step.

ESLint is the notable exception: its `lintText()` API can process content
fetched via GitHub's Contents API without a local clone, making it uniquely
usable for in-process analysis of JavaScript/TypeScript.

---

## Sources

| #   | URL                                                                                   | Title                           | Type                | Trust | CRAAP | Date    |
| --- | ------------------------------------------------------------------------------------- | ------------------------------- | ------------------- | ----- | ----- | ------- |
| 1   | https://github.com/eslint/eslint                                                      | ESLint GitHub Repository        | Official repo       | HIGH  | 4.8   | 2026-03 |
| 2   | https://github.com/pylint-dev/pylint                                                  | Pylint GitHub Repository        | Official repo       | HIGH  | 4.8   | 2026-03 |
| 3   | https://github.com/PyCQA/flake8                                                       | Flake8 GitHub Repository        | Official repo       | HIGH  | 4.8   | 2026-03 |
| 4   | https://github.com/rubocop/rubocop                                                    | RuboCop GitHub Repository       | Official repo       | HIGH  | 4.8   | 2026-03 |
| 5   | https://github.com/rust-lang/rust-clippy                                              | Clippy GitHub Repository        | Official repo       | HIGH  | 4.8   | 2026-03 |
| 6   | https://github.com/golangci/golangci-lint                                             | golangci-lint GitHub Repository | Official repo       | HIGH  | 4.8   | 2026-03 |
| 7   | https://github.com/phpstan/phpstan                                                    | PHPStan GitHub Repository       | Official repo       | HIGH  | 4.8   | 2026-03 |
| 8   | https://github.com/checkstyle/checkstyle                                              | Checkstyle GitHub Repository    | Official repo       | HIGH  | 4.8   | 2026-03 |
| 9   | https://github.com/realm/SwiftLint                                                    | SwiftLint GitHub Repository     | Official repo       | HIGH  | 4.8   | 2026-03 |
| 10  | https://github.com/pinterest/ktlint                                                   | ktlint GitHub Repository        | Official repo       | HIGH  | 4.8   | 2026-03 |
| 11  | https://github.com/oxsecurity/megalinter                                              | MegaLinter GitHub Repository    | Official repo       | HIGH  | 4.8   | 2026-03 |
| 12  | https://github.com/super-linter/super-linter                                          | super-linter GitHub Repository  | Official repo       | HIGH  | 4.8   | 2026-03 |
| 13  | https://github.com/trunk-io/trunk-action                                              | Trunk Action GitHub Repository  | Official repo       | HIGH  | 4.5   | 2026-03 |
| 14  | https://eslint.org/docs/latest/integrate/nodejs-api                                   | ESLint Node.js API Docs         | Official docs       | HIGH  | 5.0   | 2026-03 |
| 15  | https://eslint.org/docs/latest/use/formatters/                                        | ESLint Formatters Reference     | Official docs       | HIGH  | 5.0   | 2026-03 |
| 16  | https://golangci-lint.run/                                                            | golangci-lint Official Site     | Official docs       | HIGH  | 4.8   | 2026-03 |
| 17  | https://ldez.github.io/blog/2025/03/23/golangci-lint-v2/                              | golangci-lint v2 Blog Post      | Official maintainer | HIGH  | 4.5   | 2025-03 |
| 18  | https://phpstan.org/user-guide/output-format                                          | PHPStan Output Format Docs      | Official docs       | HIGH  | 5.0   | 2026-03 |
| 19  | https://megalinter.io/v8/mega-linter-vs-super-linter/                                 | MegaLinter vs super-linter      | Official docs       | HIGH  | 4.8   | 2025    |
| 20  | https://trunk.io/changelog/sunsetting-ci-analytics-and-code-quality-web-issue-browser | Trunk sunset announcement       | Official blog       | HIGH  | 5.0   | 2025-07 |
| 21  | https://docs.trunk.io/code-quality/licensing                                          | Trunk Licensing Docs            | Official docs       | HIGH  | 4.8   | 2025    |
| 22  | https://crates.io/crates/clippy-sarif                                                 | clippy-sarif crate              | Official registry   | HIGH  | 4.5   | 2026-03 |

---

## Contradictions

1. **Trunk Check status**: The web app and nightly CI workflows were sunset July
   27, 2025. One search result implied the entire product was deprecated.
   However, the official Trunk changelog clarifies the CLI and local/CI
   integrations remain fully operational; only the server-side web issue browser
   was shut down. The CLI value prop continues.

2. **MegaLinter star count vs adoption**: MegaLinter has only 2.4k GitHub stars
   but claims 5.5M Docker pulls and 2,180+ dependent projects. This suggests the
   Docker pull metric is more representative of actual usage than the star
   count, possibly because many enterprise/CI users pull Docker images without
   starring.

3. **Flake8 vs Ruff**: Multiple sources suggest Ruff (not in scope but flagged
   as serendipitous) is a superset replacement for Flake8 that is 10-100x
   faster. Flake8 is actively maintained but may be in gradual decline among
   Python projects favoring Ruff.

---

## Gaps

1. **Trunk Check output format specifics**: Could not access `docs.trunk.io`
   directly (404 errors). Output format documentation is incomplete; confirmed
   CLI works but exact format flags are unclear.

2. **SwiftLint license confirmation**: License type (MIT) was stated in search
   results but the GitHub repo content did not explicitly surface the license
   type text. Cross-referenced via community sources.

3. **Pylint SARIF roadmap**: Found discussion of native SARIF support being
   planned for Pylint but no confirmed implementation. Status as of 2026 is:
   SARIF still requires external `pylint-sarif` converter.

4. **RuboCop formatters full list**: The official formatters page at
   docs.rubocop.org returned a redirect with no extractable content. The list
   was reconstructed from search results and community sources; may be
   incomplete.

5. **golangci-lint API vs file-based**: Could not confirm whether golangci-lint
   has any in-memory/API linting mode. All evidence points to file-only
   analysis.

6. **Checkstyle SARIF version**: Confirmed SARIF is built-in via `SarifLogger`,
   but could not confirm SARIF specification version (2.1.0 or earlier).

---

## Serendipity

1. **Ruff (not in scope)**: Ruff (https://github.com/astral-sh/ruff) is a
   Rust-based Python linter that replaces both Flake8 and isort, and partially
   Pylint. It is 10-100x faster and has SARIF support. As of 2025 it may be the
   recommended default for new Python projects. Worth evaluating as an
   alternative to Flake8.

2. **golangci-lint v2 breaking change (March 2025)**: The `--out-format` flag
   was removed in v2 (released 2025-03-24). Any tooling built on v1 CLI flags
   will break. Migration is handled by `golangci-lint migrate` command.

3. **Trunk Code Quality web sunset (July 2025)**: The server-side aggregation
   and web UI for Trunk Code Quality was shut down. Teams relying on Trunk's
   cloud issue tracking need to migrate to local/CI-only workflows.

4. **MegaLinter AGPL risk**: MegaLinter is AGPL-3.0, which may create license
   compliance concerns when integrated into commercial tooling. super-linter
   (MIT) is more permissive for proprietary use cases.

5. **Checkstyle native SARIF**: Checkstyle is the only single-language linter in
   this list with built-in SARIF output (no plugin needed) — via `-f sarif` CLI
   flag. This makes it uniquely easy to integrate with GitHub Code Scanning for
   Java projects.

---

## Comparison Table

| Tool          | Language(s)   | License                          | Stars | SARIF Support                                     | JSON Output                       | Requires Clone                 | Meta-Linter | CI Integration                                 |
| ------------- | ------------- | -------------------------------- | ----- | ------------------------------------------------- | --------------------------------- | ------------------------------ | ----------- | ---------------------------------------------- |
| ESLint        | JS/TS         | MIT                              | 27.2k | Plugin only (`@microsoft/eslint-formatter-sarif`) | Built-in (`--format json`)        | CLI: Yes; `lintText()` API: No | No          | Any (npm)                                      |
| Pylint        | Python        | GPLv2                            | 5.7k  | External only (`pylint-sarif`)                    | Built-in (`--output-format=json`) | Yes                            | No          | Any                                            |
| Flake8        | Python        | MIT                              | 3.8k  | Plugin (`flake8-sarif-formatter`)                 | Plugin (`flake8-json`)            | Yes                            | No          | Any                                            |
| RuboCop       | Ruby          | MIT                              | 12.8k | External (`code-scanning-rubocop` gem)            | Built-in (`--format json`)        | Yes                            | No          | Any                                            |
| Clippy        | Rust          | Apache-2/MIT                     | 13k   | Via `clippy-sarif` pipe                           | Via `--message-format=json`       | Yes                            | No          | Any (cargo)                                    |
| golangci-lint | Go            | GPL-3.0                          | 18.7k | Built-in (`--output.sarif.path`)                  | Built-in (`--output.json.path`)   | Yes                            | Yes (Go)    | Any                                            |
| PHPStan       | PHP           | MIT                              | 13.9k | External (`phpstan-sarif-formatter`)              | Built-in (`--error-format=json`)  | Yes                            | No          | Any                                            |
| Checkstyle    | Java          | LGPL-2.1/Apache-2                | 8.9k  | **Built-in** (`-f sarif`)                         | Not natively (XML is default)     | Yes                            | No          | Ant, Maven, standalone                         |
| SwiftLint     | Swift         | MIT                              | 19.5k | **Built-in** (`--reporter sarif`)                 | **Built-in** (`--reporter json`)  | Yes (needs toolchain)          | No          | Xcode, SPM, CI                                 |
| ktlint        | Kotlin        | MIT                              | 6.7k  | **Built-in** (`--reporter=sarif`)                 | **Built-in** (`--reporter=json`)  | Yes                            | No          | Gradle, Maven, standalone                      |
| MegaLinter    | 69 languages  | AGPL-3.0                         | 2.4k  | Built-in                                          | Built-in                          | Yes (Docker)                   | **YES**     | GitHub Actions, GitLab, Azure, Jenkins, Docker |
| super-linter  | 50+ languages | MIT                              | 10.4k | Not documented                                    | Not documented                    | Yes (Docker)                   | **YES**     | GitHub Actions, Docker                         |
| Trunk Check   | 100+ tools    | MIT (plugins); Proprietary (CLI) | ~232  | Via underlying tools                              | Via config                        | Yes (local daemon)             | **YES**     | GitHub Actions, local CLI                      |

---

## Confidence Assessment

- HIGH claims: 11
- MEDIUM claims: 2 (Trunk specifics, RuboCop formatter list)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

Sources are primarily official GitHub repositories and project documentation
sites, cross-referenced across multiple queries. Star counts are from direct
GitHub page fetches and are current as of March 2026.
