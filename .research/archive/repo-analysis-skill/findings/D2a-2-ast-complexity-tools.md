# Findings: AST Parsing and Complexity Measurement Tools for Automated Code Analysis

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** D2a-2

---

## Key Findings

### 1. AST vs. Text Analysis: The Fundamental Capability Gap [CONFIDENCE: HIGH]

Text-based tools (grep, sed) operate on raw character sequences and cannot
distinguish between a function call `foo()` in executable code vs. a comment or
string literal. AST-based analysis reveals what text search cannot:

- **Structural context**: Whether a pattern appears inside a function, class,
  conditional branch, or top-level scope
- **Type semantics**: Variable types, inferred return types, argument types
  (ts-morph/TypeScript-specific)
- **Dead code**: Unreachable branches, unused variables, uncalled functions
- **Call graph topology**: Which functions call which, depth of call chains
- **Complexity metrics**: Number of logical decision paths through a function
  (cyclomatic complexity), cognitive load (cognitive complexity), argument count
- **Cross-file references**: All call sites of a symbol across the entire
  project, not just the definition file
- **Duplication that survives renaming**: Code clone detection that ignores
  identifier names to find structurally identical logic

Sources: [1][2][3][9]

---

### 2. Tree-sitter — The Universal Foundation Layer [CONFIDENCE: HIGH]

**What it does:** Incremental, error-tolerant parser generator and parsing
library. Parses source files into concrete syntax trees (CST), updating the tree
efficiently on edits without full re-parse.

**Languages supported:** 900+ parsers listed in the community wiki [4],
including all major languages. Official organization-maintained parsers cover C,
C++, C#, Python, JavaScript, TypeScript, Java, Go, Rust, Ruby, HTML, CSS, JSON,
Bash, PHP, YAML. Community parsers cover nearly every language including niche
DSLs.

**How to invoke:**

- CLI: `tree-sitter parse <file>` — outputs S-expression CST
- Query API: `(tree-sitter query)` with S-expression pattern syntax
- Bindings: Rust, Python, Node.js, Go, C, WebAssembly
- Used as a library by downstream tools (ast-grep, rust-code-analysis, Neovim,
  VS Code)

**Output format:** S-expression tree by default; structured node objects via
bindings. Nodes carry: type, start/end byte offsets, line/column, children,
named vs anonymous distinction, field names per grammar.

**License:** MIT **GitHub stars:** 24.4k **Latest release:** v0.26.7 (March
14, 2026) — actively maintained, 6,276 commits, 97 releases **Unique repo
analysis value:** Foundation for all other language-agnostic analysis. Enables
writing queries that match syntax patterns across thousands of files in
parallel. The incremental model means analysis stays cheap even for large repos.

Sources: [4][5]

---

### 3. ts-morph — Deep TypeScript/JavaScript AST Manipulation [CONFIDENCE: HIGH]

**What it does:** Wrapper around the TypeScript Compiler API that makes
programmatic AST navigation and manipulation ergonomic. Works with `.ts`,
`.tsx`, `.js`, `.jsx` files.

**Languages supported:** TypeScript and JavaScript only.

**How to invoke:** Library API only (no standalone CLI). Use programmatically:

```js
import { Project } from "ts-morph";
const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const sourceFile = project.getSourceFileOrThrow("src/index.ts");
sourceFile.getClasses(); // get all class declarations
sourceFile.getFunction("myFunc")?.findReferences(); // all call sites
```

**Output format:** In-memory AST node objects with rich methods. Serialize to
JSON manually via node inspection APIs.

**License:** MIT **GitHub stars:** ~6,000 **Latest version:** 27.0.2 (October
12, 2025) — 219,000+ dependents, actively maintained, 2,337 commits **Weekly npm
downloads:** High (indirect — 219k dependents implies millions of installs
downstream)

**Unique repo analysis value:**

- **Type-aware analysis**: Resolves inferred types, not just declared types —
  unique among JS/TS AST tools
- **Find all references**: Locates every usage of a symbol across the project,
  distinguishing actual code references from comments/strings
- **Rename-safe refactoring**: Updates imports, paths, and re-exports when
  symbols are moved
- **Dead code detection**: Identifies exports with zero references across the
  whole project
- **Pattern detection**: Find functions with >N parameters, classes without
  constructors, files with circular imports

Sources: [6][7][8]

---

### 4. @babel/parser — JavaScript/TypeScript/JSX/Flow Parser [CONFIDENCE: HIGH]

**What it does:** JavaScript parser (formerly Babylon) that produces an ESTree-
compatible AST with Babel extensions. Used internally by Babel, ESLint, and many
static analysis tools.

**Languages supported:** JavaScript (ES2020+), TypeScript, JSX, Flow, plus all
Stage 0+ TC39 proposals via plugin system.

**How to invoke:**

```js
import { parse } from "@babel/parser";
const ast = parse(code, {
  sourceType: "module",
  plugins: ["typescript", "jsx"],
  errorRecovery: true, // keep parsing despite syntax errors
});
```

**Output format:** JSON AST conforming to Babel AST spec (ESTree-based). Node
types include `File`, `Program`, `FunctionDeclaration`, `ClassDeclaration`,
`ImportDeclaration`, etc. Nodes carry `start`, `end`, `loc` (line/column).

**License:** MIT (part of babel/babel monorepo) **GitHub stars (babel
monorepo):** 43,857 **Latest version:** 7.29.0 (published ~January 2026)
**Weekly npm downloads:** ~99 million (one of the most downloaded npm packages
globally)

**Unique repo analysis value:**

- Handles modern syntax including decorators, optional chaining, nullish
  coalescing, and experimental proposals — broader than standard ESTree parsers
- `errorRecovery: true` continues parsing broken files, generating partial ASTs
  useful for incomplete codebases
- Produces comment AST nodes, enabling analysis of documentation coverage
- JSX node types enable component tree analysis for React codebases

Sources: [10][11][12]

---

### 5. ast-grep — Structural Code Search, Lint, and Rewrite at Scale [CONFIDENCE: HIGH]

**What it does:** Rust-based CLI and library that uses tree-sitter to perform
pattern-based search, linting, and rewriting across multiple languages. "Like
grep but for AST nodes."

**Languages supported:** 30 languages with built-in support [13]: Bash, C, C++,
C#, CSS, Elixir, Go, Haskell, HCL, HTML, Java, JavaScript/JSX, JSON, Kotlin,
Lua, Nix, PHP, Python, Ruby, Rust, Scala, Solidity, Swift, TypeScript/TSX, YAML.
Custom languages loadable via tree-sitter dynamic plugins.

**How to invoke:**

```bash
# One-shot pattern search
ast-grep --pattern 'console.log($ARG)' --lang js

# Rewrite pattern
ast-grep -p '$A && $A()' -l ts -r '$A?.()'

# JSON output for tooling integration
ast-grep --pattern 'var $NAME = $EXPR' --lang js --json

# Repo-wide scan with YAML rules
ast-grep scan --rule ./rules/
```

**Output format:** Text (grep-style), JSON (`--json` flag with `pretty`,
`stream`, or `compact` modes). JSON fields: `text`, `range` (byteOffset +
line/col), `file`, `lines`, `replacement`, `language`, `metaVariables`. For lint
rules: additionally `ruleId`, `severity`, `message`.

**License:** MIT **GitHub stars:** 13.2k **Latest version:** 0.42.0 (March
16, 2026) — actively maintained

**Unique repo analysis value:**

- Metavariable syntax (`$UPPERCASE`) matches any AST node in that position —
  enables semantic patterns impossible with text regex
- `--json stream` output pipes cleanly to `jq` or custom aggregators for
  repo-wide statistics
- Multi-core parallel processing handles large monorepos efficiently
- YAML rule files enable persistent lint rules as code
- Node.js API for programmatic tree traversal with jQuery-style methods

Sources: [13][14][15]

---

### 6. comby — Language-Aware Structural Search/Replace [CONFIDENCE: HIGH]

**What it does:** Structural code search and replace that understands balanced
delimiters (parentheses, braces, brackets, string boundaries) rather than
treating code as flat text. Lighter-weight than full AST tools.

**Languages supported:** Designed for "every language." Explicit support for
JavaScript, TypeScript, Python, Java, Go, Rust, Swift, C, C++, C#, Ruby, PHP,
plus JSON, XML, and custom grammars. Recent additions: Zig, ABAP.

**How to invoke:**

```bash
# Replace deprecated API pattern
comby 'failUnlessEqual(:[a], :[b])' 'assertEqual(:[a], :[b])' example.py

# Repo-wide with file type filtering
comby 'console.log(:[args])' 'logger.debug(:[args])' .js -d ./src

# Interactive review mode
comby 'old_pattern(:[x])' 'new_pattern(:[x])' .py -review
```

**Output format:** Diff-style terminal output by default. JSON output available
(`-json-lines` flag). Interactive review via `-review` flag.

**License:** Apache-2.0 **GitHub stars:** 2.6k **Latest release:** 1.8.1 (June
28, 2022) — **last release is ~3.5 years old**; repository shows 514 commits;
maintenance activity unclear after 2022

**Unique repo analysis value:**

- Hole syntax `:[name]` matches balanced nested expressions that regex cannot
  (e.g., deeply nested function arguments, multi-line blocks)
- Does NOT require a full grammar/parser — works on languages with no
  tree-sitter support
- Particularly strong for large-scale API migration patterns where the pattern
  spans multiple lines

**Warning:** The last tagged release is from mid-2022. The tool may still work
but appears to have reduced maintenance. Verify before depending on it in CI.

Sources: [16][17]

---

### 7. radon — Python Code Metrics Suite [CONFIDENCE: HIGH]

**What it does:** Computes multiple code quality metrics for Python source
files. Python-only.

**Languages supported:** Python only (2.7 through 3.12, PyPy, Jupyter notebooks
via optional `nbformat`).

**How to invoke:**

```bash
# Cyclomatic complexity with averages
radon cc -a src/

# Raw metrics (SLOC, comments, blanks)
radon raw src/

# Maintainability Index
radon mi src/

# Halstead metrics
radon hal src/

# JSON output
radon cc -j src/
radon raw --json src/
```

**Output format:** Text (human-readable with letter grades A-F for CC), JSON
(`--json` / `-j`), XML.

**Metrics computed:**

- **Cyclomatic Complexity (CC)**: McCabe's metric; counts decision paths
- **Raw**: SLOC, LLOC, CLOC (comment lines), blank lines, multi-line strings
- **Halstead**: Volume, difficulty, effort, vocabulary, bug estimate,
  implementation time estimate
- **Maintainability Index (MI)**: Visual Studio-style 0-100 score combining
  Halstead volume, CC, and SLOC

**License:** MIT **GitHub stars:** ~2,000 **Latest version:** 6.0.1 (March
26, 2023) **Maintenance status:** Last release 2023; 7,100+ dependent projects;
CI integrations with Codacy, Code Climate, CodeFactor. Active issues but no
recent releases — the Python codebase is stable so this may be intentional.

Sources: [18][19]

---

### 8. lizard — Multi-Language Cyclomatic Complexity Analyzer [CONFIDENCE: HIGH]

**What it does:** Lightweight cyclomatic complexity analyzer that works across
25+ languages without requiring header files or complete import resolution. Also
performs copy-paste detection via extension.

**Languages supported (26 languages):** C#, C/C++, Erlang, Fortran, GDScript,
Go, Java, JavaScript (ES6/JSX), Kotlin, Lua, Objective-C, Perl, PHP, PL/SQL,
Python, R, Ruby, Rust, Scala, Solidity, Structured Text, Swift, TTCN-3,
TypeScript (TSX), VueJS, Zig.

**How to invoke:**

```bash
# Analyze current directory
lizard

# Set CCN warning threshold (default: 15)
lizard -C 10 ./src

# Specific languages only
lizard -l cpp -l java ./src

# Exclude paths
lizard mySource/ -x"./tests/*"

# Warnings only
lizard -w

# JSON output
lizard --json ./src

# HTML report
lizard -H report.html ./src
```

**Output format:** Text (tabular per-function table), XML (cppncss style for
Jenkins), CSV, HTML (DataTables interactive), Checkstyle XML.

**Metrics computed per function:**

- NLOC (non-comment lines of code)
- CCN (cyclomatic complexity number)
- Token count
- Parameter count
- Function signature

**License:** MIT **GitHub stars:** 2.3k **Latest version:** 1.21.3 (March
30, 2026) — actively maintained

**Unique capabilities:**

- Analyzes C/C++ without needing complete header resolution (unique advantage
  for large C/C++ codebases where radon or similar tools fail)
- `#lizard forgives` inline comment suppresses warnings for specific functions
- Extension system: `-Eduplicate` for clone detection, `-EWordCount` for tag
  clouds
- Default threshold 15 for CCN (configurable; McCabe originally recommended 10)

Sources: [20][21]

---

### 9. plato — JavaScript Complexity Visualizer [CONFIDENCE: HIGH — with strong deprecation warning]

**What it does:** Generates HTML reports with interactive complexity
visualizations for JavaScript projects. Uses escomplex/complexity-report as its
analysis backend.

**Languages supported:** JavaScript only (ES5; ES6 via fork `es6-plato`).

**How to invoke:**

```bash
npm install -g plato
plato -r -d report src/**/*.js
```

**Output format:** HTML report (interactive, with historical trend charts).
Example reports available for jQuery, Hapi, Marionette.js.

**Metrics reported:** Cyclomatic complexity, Halstead metrics, maintainability
index, lines of code, lint violations.

**License:** MIT **GitHub stars:** 4.6k (original `es-analysis/plato`) **Latest
version:** 1.2.1 (October 29, 2014) **Maintenance status:** ABANDONED. Last
release was 2014. README explicitly states "Needs active maintainer." The
`complexity-report` backend is also marked UNMAINTAINED. The `es6-plato` fork
adds ES6 support but is similarly dormant.

**Recommendation:** Do not use for new projects. Replace with lizard
(complexity), jscpd (duplication), or custom ast-grep pipelines.

Sources: [22][23]

---

### 10. complexity-report / escomplex — JavaScript Complexity Library [CONFIDENCE: MEDIUM]

**What it does:** escomplex is the underlying library that computes complexity
metrics for JavaScript ASTs. complexity-report is its CLI wrapper.

**Status:** Both are **UNMAINTAINED** (flagged in GitHub READMEs). Plato depends
on complexity-report which depends on escomplex.

**Metrics:** Cyclomatic complexity, Halstead metrics, maintainability index,
lines of code, parameter counts.

**Note:** For active JavaScript complexity analysis, use lizard or ast-grep with
custom rules instead.

Sources: [22][23]

---

### 11. rust-code-analysis — Mozilla's Multi-Metric AST Analyzer [CONFIDENCE: HIGH]

**What it does:** Mozilla-developed library and CLI for extracting code quality
metrics from source files. Based on tree-sitter.

**Languages supported (11):** C, C++, Mozcpp (Mozilla C++), Ccomment, Preproc (C
preprocessor), Java, JavaScript, Mozjs (SpiderMonkey JS), Python, Rust,
TypeScript.

**How to invoke:**

```bash
# Metrics to stdout (default: CBOR)
rust-code-analysis-cli -m -p ./src

# JSON output
rust-code-analysis-cli -m -p ./src -O json

# Pretty-printed JSON
rust-code-analysis-cli -m -p ./src -O json --pr

# Save to directory
rust-code-analysis-cli -m -p ./src -O json -o ./output/
```

**Output formats:** CBOR, JSON, TOML, YAML (with `--pr` for pretty-print).

**Metrics computed (15):**

- ABC (Assignments, Branches, Conditions)
- BLANK (blank lines)
- CC (cyclomatic complexity)
- CLOC (comment lines)
- COGNITIVE (cognitive complexity — how hard to understand, not just branches)
- HALSTEAD (effort, volume, difficulty, bug estimate, implementation time)
- LLOC (logical lines)
- MI (maintainability index)
- NARGS (argument count)
- NEXITS (exit point count)
- NOM (function/closure count)
- NPA (public attribute count)
- NPM (public method count)
- PLOC (physical lines)
- WMC (sum of CC across class methods)

**License:** Mozilla Public License v2.0 (grammar definitions: MIT) **GitHub
stars:** 396 **Latest release:** v0.0.25 (January 13, 2023) — last release 2+
years ago; active commit history suggests ongoing internal Mozilla use but no
public release since 2023

**Unique repo analysis value:**

- COGNITIVE complexity metric is distinct from CC — measures human cognitive
  load, not just branching paths; particularly useful for identifying functions
  that are hard to understand even if structurally simple
- WMC enables class-level complexity analysis (sum complexity across all
  methods)
- NPA/NPM distinguish public API surface from internal implementation

Sources: [24][25][26]

---

### 12. jscpd — Copy/Paste Detector for 150+ Languages [CONFIDENCE: HIGH]

**What it does:** Detects duplicate code blocks across more than 150 programming
languages using the Rabin-Karp rolling hash algorithm. Generates HTML, JSON,
XML, SARIF reports.

**Languages supported:** 150+ languages and digital formats including all major
languages, markup formats (HTML, Markdown), configuration formats (YAML, JSON,
TOML), and specialized formats.

**How to invoke:**

```bash
npm install -g jscpd
jscpd ./src
jscpd --pattern "src/**/**.ts" --min-lines 3 --min-tokens 40
jscpd ./src --reporters html,json --output ./report/
```

**Configuration (`.jscpd.json`):**

```json
{
  "minLines": 5,
  "minTokens": 50,
  "threshold": 5,
  "reporters": ["console", "json", "html"],
  "ignore": ["**/__tests__/**"]
}
```

**Output formats:** Console, HTML, JSON, XML, SARIF, badge (shield.io format).

**License:** MIT **GitHub stars:** 5.5k **Latest version:** Active; monorepo
with @jscpd/core, @jscpd/finder, @jscpd/tokenizer packages **Maintenance
status:** Actively maintained; adopted by GitHub Super Linter, Mega-Linter,
Code-Inspector; 1,241+ commits; 3.7k dependent projects **Notable:** Implements
Model Context Protocol (MCP) — can be queried directly by AI assistants

Sources: [27][28]

---

### 13. PMD CPD — Enterprise-Grade Polyglot Duplication Detector [CONFIDENCE: HIGH]

**What it does:** PMD's Copy/Paste Detector (CPD) is part of the PMD static
analysis suite. Uses Karp-Rabin string matching for token-based duplicate
detection. Mature Java-ecosystem tool with broad language support.

**Languages supported for CPD (33+):** Coco, C/C++, C#, CSS, Dart, Fortran,
Gherkin, Go, Groovy, HTML, Java, JavaScript, JSP, Julia, Kotlin, Lua, Matlab,
Modelica, Objective-C, Perl, PHP, PL/SQL, Python, Ruby, Rust, Salesforce Apex,
Scala, Swift, T-SQL, TypeScript, Apache Velocity, WSDL, XML, XSL.

**How to invoke:**

```bash
# Basic scan
pmd cpd --minimum-tokens 100 --dir src/main/java

# Multiple directories
pmd cpd --minimum-tokens 100 --dir src/main/java --dir src/test/java

# Specific language
pmd cpd --minimum-tokens 100 --dir src/main/cpp --language cpp

# XML output
pmd cpd --minimum-tokens 100 --dir src/ --format xml

# GUI
pmd cpd-gui
```

**Output formats:** Text (default), XML, CSV, CSV with line counts, Visual
Studio, Markdown.

**Notable features:**

- `--ignore-identifiers`: Find duplicates that differ only in variable names
- `--ignore-literals`: Find duplicates that differ only in literal values
- `CPD-OFF` / `CPD-ON` comments for suppression
- `--minimum-tokens` controls granularity
- Exit code 4 = duplicates found (useful for CI gates)

**License:** BSD-style **GitHub stars:** 5.4k **Latest release:** PMD 7.23.0
(March 27, 2026) — very actively maintained **Maintenance status:** Active
releases every ~6 weeks; 312 contributors; enterprise-grade project

Sources: [29][30]

---

### 14. Simian — Commercial Similarity Analyzer [CONFIDENCE: MEDIUM]

**What it does:** Token-fingerprint-based duplicate code detector that ignores
whitespace, comments, imports, and braces to find genuine semantic duplication.
Runs on JVM.

**Languages supported:** Full: Java, C#, C++, C, Objective-C, JavaScript
(ECMAScript), COBOL, ABAP, Ruby, Lisp, SQL, Visual Basic, Groovy, Swift.
Partial: JSP, ASP, HTML, XML. Generic text file analysis for unsupported
formats.

**How to invoke:** Java command-line with `.jar` file; Gradle integration; IDE
plugins.

**Output format:** Text showing fingerprint hashes, line ranges, file locations,
duplicate counts and processing time.

**License:** Free for academic/non-commercial use only. Commercial license
required for production use. Contact Quandary Peak Research for pricing.
**Latest version:** 4.0.0 (2022-2023) **Maintenance status:** Active commercial
development; v4.0 released 2022-2023 **Note:** Not open source — this is the key
differentiator from jscpd and PMD CPD.

Sources: [31][32]

---

## Sources

| #   | URL                                                             | Title                               | Type              | Trust  | CRAAP (avg) | Date    |
| --- | --------------------------------------------------------------- | ----------------------------------- | ----------------- | ------ | ----------- | ------- |
| 1   | https://github.com/analysis-tools-dev/static-analysis           | Static Analysis Tools Catalog       | Community         | MEDIUM | 3.4         | Ongoing |
| 2   | https://blog.lepine.pro/en/ast-metrics-static-analysis/         | Yet another static analysis tool    | Blog              | LOW    | 2.8         | 2023    |
| 3   | https://cycode.com/blog/static-code-analysis/                   | Static Code Analysis                | Official docs     | MEDIUM | 3.6         | 2024    |
| 4   | https://github.com/tree-sitter/tree-sitter                      | tree-sitter/tree-sitter             | Official repo     | HIGH   | 4.8         | 2026-03 |
| 5   | https://github.com/tree-sitter/tree-sitter/wiki/List-of-parsers | List of parsers                     | Official wiki     | HIGH   | 4.6         | 2026    |
| 6   | https://github.com/dsherret/ts-morph                            | dsherret/ts-morph                   | Official repo     | HIGH   | 4.8         | 2025-10 |
| 7   | https://ts-morph.com/navigation/                                | ts-morph Navigation Docs            | Official docs     | HIGH   | 4.7         | 2025    |
| 8   | https://kimmo.blog/posts/8-ast-based-refactoring-with-ts-morph/ | AST-based refactoring with ts-morph | Blog              | MEDIUM | 3.5         | 2024    |
| 9   | https://www.oligo.security/academy/static-code-analysis         | Static Code Analysis Academy        | Official docs     | MEDIUM | 3.8         | 2025    |
| 10  | https://babeljs.io/docs/babel-parser                            | @babel/parser official docs         | Official docs     | HIGH   | 4.9         | 2026    |
| 11  | https://github.com/babel/babel                                  | babel/babel monorepo                | Official repo     | HIGH   | 4.8         | 2026    |
| 12  | https://npmtrends.com/@babel/parser-vs-acorn                    | npm trends comparison               | Analytics         | MEDIUM | 3.6         | 2026    |
| 13  | https://ast-grep.github.io/reference/languages.html             | ast-grep language reference         | Official docs     | HIGH   | 4.8         | 2026    |
| 14  | https://ast-grep.github.io/guide/tools/json.html                | ast-grep JSON mode                  | Official docs     | HIGH   | 4.8         | 2026    |
| 15  | https://github.com/ast-grep/ast-grep                            | ast-grep/ast-grep                   | Official repo     | HIGH   | 4.8         | 2026-03 |
| 16  | https://github.com/comby-tools/comby                            | comby-tools/comby                   | Official repo     | HIGH   | 4.0         | 2022    |
| 17  | https://comby.dev/                                              | Comby official site                 | Official docs     | HIGH   | 3.8         | 2022    |
| 18  | https://pypi.org/project/radon/                                 | radon on PyPI                       | Official registry | HIGH   | 4.5         | 2023    |
| 19  | https://github.com/rubik/radon                                  | rubik/radon                         | Official repo     | HIGH   | 4.5         | 2023    |
| 20  | https://pypi.org/project/lizard/                                | lizard on PyPI                      | Official registry | HIGH   | 4.8         | 2026-03 |
| 21  | https://github.com/terryyin/lizard                              | terryyin/lizard                     | Official repo     | HIGH   | 4.8         | 2026-01 |
| 22  | https://github.com/es-analysis/plato                            | es-analysis/plato                   | Official repo     | HIGH   | 2.0         | 2014    |
| 23  | https://github.com/escomplex/complexity-report                  | escomplex/complexity-report         | Official repo     | HIGH   | 2.0         | ~2016   |
| 24  | https://github.com/mozilla/rust-code-analysis                   | mozilla/rust-code-analysis          | Official repo     | HIGH   | 3.8         | 2023    |
| 25  | https://mozilla.github.io/rust-code-analysis/metrics.html       | rust-code-analysis metrics docs     | Official docs     | HIGH   | 4.2         | 2023    |
| 26  | https://mozilla.github.io/rust-code-analysis/languages.html     | rust-code-analysis language support | Official docs     | HIGH   | 4.2         | 2023    |
| 27  | https://github.com/kucherenko/jscpd                             | kucherenko/jscpd                    | Official repo     | HIGH   | 4.7         | 2025    |
| 28  | https://jscpd.dev                                               | jscpd official site                 | Official docs     | HIGH   | 4.5         | 2025    |
| 29  | https://github.com/pmd/pmd                                      | pmd/pmd                             | Official repo     | HIGH   | 4.9         | 2026-03 |
| 30  | https://pmd.github.io/pmd/pmd_userdocs_cpd.html                 | PMD CPD user docs                   | Official docs     | HIGH   | 4.9         | 2026    |
| 31  | https://simian.quandarypeak.com/                                | Simian official site                | Official docs     | HIGH   | 3.8         | 2023    |
| 32  | https://simian.quandarypeak.com/features/                       | Simian features                     | Official docs     | HIGH   | 3.8         | 2023    |

---

## Contradictions

**radon version vs activity:** PyPI shows latest version 6.0.1 from March 2023,
but GitHub shows 7,100+ dependents and active issues. This suggests the codebase
is mature/stable rather than abandoned, but CI integrations reference it as
current. No contradiction in the data — just a stable, infrequently released
tool.

**comby maintenance:** The last GitHub release is June 2022 (v1.8.1), but
comby.dev marketing site and some blog posts describe it as active. The tool
continues to work but the release cadence suggests reduced investment. Users
should verify before depending on it for CI pipelines.

**plato stars vs maintenance:** plato has 4.6k GitHub stars (high) yet is
completely unmaintained since 2014. Stars reflect historical interest, not
current viability.

**simian license ambiguity:** The features page says "available for academic and
commercial purposes" without pricing detail. The changelog and older
documentation mention free academic use. Commercial pricing is not public. Treat
as commercial/proprietary for enterprise use.

---

## Gaps

1. **radon recent maintenance**: The last PyPI release was March 2023. It is
   unclear whether active bugs are being fixed or the tool is in maintenance-
   only mode. Could not locate a 2025 release.

2. **comby output formats**: The `-json-lines` flag exists but documentation for
   the exact JSON schema was not found. The comby.dev site does not document
   output structure in detail.

3. **rust-code-analysis JSON schema**: The full JSON output schema structure
   (field names, nesting) for per-file metrics was not retrieved — only the CLI
   flags. The documentation site was accessible but sparse.

4. **simian CLI syntax**: Exact command-line invocation flags for simian v4.0
   were not obtained. The docs page on simian.quandarypeak.com/docs/ was not
   fetched in this research pass.

5. **ts-morph performance at scale**: No benchmarks found for how ts-morph
   performs on very large TypeScript codebases (100k+ files). This is relevant
   for repo-analysis tooling.

6. **ast-grep custom language loading**: The mechanism for loading custom
   tree-sitter grammars beyond the 30 built-in was referenced but not fully
   documented in the sources fetched.

7. **@babel/parser vs acorn/espree performance**: npm trends showed download
   comparison data but no performance benchmarks for large-file parsing.

---

## Serendipity

1. **jscpd implements MCP (Model Context Protocol)**: jscpd now exposes an MCP
   server, meaning AI assistants can query it directly for duplication analysis
   without scripting. This is a notable integration for AI-driven repo analysis
   workflows.

2. **lizard's `#lizard forgives` comment**: The ability to suppress per-function
   warnings with an inline comment is a UX feature that aids gradual adoption —
   teams can acknowledge known complexity debt without blocking CI.

3. **lizard latest release was March 30, 2026**: Despite being a smaller project
   (2.3k stars), lizard is very actively maintained and released the day before
   this research was conducted.

4. **tree-sitter has 900+ community parsers**: The scale of the parser ecosystem
   dramatically exceeds what most practitioners realize — covering niche DSLs,
   config formats, and even non-programming languages. This means tree-sitter-
   based tools can cover nearly any file type in a modern repository.

5. **PMD CPD exit code 4 for duplicates found**: This makes PMD CPD trivially
   usable as a CI gate (non-zero = fail) without additional parsing.

6. **comby last release was 2022**: The gap between popularity/documentation and
   maintenance reality is significant. The Apache-2.0 license means consumers
   could fork if needed.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

---

## Comparison Table

| Tool               | Type                   | Languages                           | Stars         | License    | Last Release     | Actively Maintained | Output Formats                  | Key Differentiator                                                        |
| ------------------ | ---------------------- | ----------------------------------- | ------------- | ---------- | ---------------- | ------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| tree-sitter        | AST parser lib         | 900+ (community)                    | 24.4k         | MIT        | v0.26.7 Mar 2026 | YES                 | S-expr, bindings                | Foundation layer; incremental; used by all others                         |
| ts-morph           | TS/JS AST API          | TypeScript, JavaScript              | ~6k           | MIT        | v27.0.2 Oct 2025 | YES                 | In-memory objects               | Type-aware analysis; find-all-references with type resolution             |
| @babel/parser      | JS/TS parser           | JS, TS, JSX, Flow                   | 43.8k (babel) | MIT        | 7.29.0 Jan 2026  | YES                 | JSON AST (ESTree+)              | ~99M weekly downloads; broadest JS syntax support incl. proposals         |
| ast-grep           | Structural search/lint | 30 languages                        | 13.2k         | MIT        | 0.42.0 Mar 2026  | YES                 | Text, JSON (3 modes)            | Pattern matching on AST; parallel Rust; YAML lint rules                   |
| comby              | Structural search      | ~every language                     | 2.6k          | Apache-2.0 | 1.8.1 Jun 2022   | UNCERTAIN           | Diff, JSON lines                | Balanced-delimiter matching without full parser; `-review` interactive    |
| radon              | Complexity             | Python only                         | ~2k           | MIT        | 6.0.1 Mar 2023   | STABLE              | Text, JSON, XML                 | Halstead + MI + CC in one tool; Python-native AST                         |
| lizard             | Complexity             | 26 languages                        | 2.3k          | MIT        | 1.21.3 Mar 2026  | YES                 | Text, XML, CSV, HTML            | C/C++ without headers; `#lizard forgives` suppression; most up-to-date    |
| plato              | Complexity viz         | JavaScript (ES5)                    | 4.6k          | MIT        | 1.2.1 Oct 2014   | NO (ABANDONED)      | HTML report                     | Do not use — replaced by lizard + ast-grep                                |
| complexity-report  | Complexity             | JavaScript                          | ~500          | MIT        | ~2016            | NO (UNMAINTAINED)   | JSON                            | Do not use — superseded                                                   |
| rust-code-analysis | Complexity             | 11 languages (C/JS/Rust/TS/Py/Java) | 396           | MPL-2.0    | 0.0.25 Jan 2023  | STABLE              | JSON, YAML, TOML, CBOR          | COGNITIVE complexity metric; WMC class-level metric; Mozilla internal use |
| jscpd              | Duplication            | 150+ formats                        | 5.5k          | MIT        | Active           | YES                 | Console, HTML, JSON, XML, SARIF | MCP server; broadest language coverage; Rabin-Karp                        |
| PMD CPD            | Duplication            | 33+ languages                       | 5.4k          | BSD        | 7.23.0 Mar 2026  | YES                 | Text, XML, CSV, Markdown        | Enterprise-grade; --ignore-identifiers for semantic clones; CI exit codes |
| Simian             | Duplication            | 14+ languages                       | N/A (closed)  | Commercial | 4.0.0 2022-2023  | YES                 | Text                            | Non-open-source; fingerprint ignores whitespace/braces; JVM-based         |
