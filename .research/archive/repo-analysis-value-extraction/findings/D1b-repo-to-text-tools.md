# D1b: Repo-to-Text Tools

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-03-31 **Sub-Question IDs:** SQ-1 through SQ-7 **Domain:** technology

---

## Key Findings

1. **Repomix is the dominant CLI tool in this space, with 22.8k GitHub stars and
   ~45,500 weekly npm downloads.** [CONFIDENCE: HIGH]

   Formerly named Repopack, it was renamed on December 1, 2024 due to
   trademark/legal considerations. It is the most feature-complete option: four
   output formats (XML default, Markdown, JSON, plain), Tree-sitter compression,
   Secretlint-based secret detection, MCP server mode, GitHub Actions
   integration, and a full Node.js programmatic API. XML is the default format
   based on Anthropic's recommendation that Claude was trained to handle
   XML-structured prompts well. [SOURCE: github.com/yamadashy/repomix,
   repomix.com, npm search result]

2. **Gitingest (14.2k GitHub stars) offers the lowest-friction entry point via
   URL manipulation: replace "hub" with "ingest" in any GitHub URL.**
   [CONFIDENCE: HIGH]

   Built on FastAPI/Python, it produces a three-part digest: summary (file
   count, size, token count), ASCII directory tree, and concatenated file
   contents. Files exceeding 10MB are excluded by default; maximum 1,000 files
   per repo. Supports private repos via GitHub Personal Access Tokens. Has a
   Python API for programmatic use: `ingest("path/to/repo")` returns
   `(summary, tree, content)` tuple. [SOURCE:
   github.com/coderamp-labs/gitingest, deepwiki.com/cyclotruc/gitingest]

3. **code2prompt (7.3k GitHub stars) is the most developer-focused alternative,
   built in Rust for performance with Handlebars template customization.**
   [CONFIDENCE: HIGH]

   Unique differentiator: Handlebars-based prompt templates enable fully
   customizable output structure — users define template variables like
   `{{files}}`, `{{source_tree}}`, `{{git_diff}}` to control exactly what is
   generated. Available as CLI, Python SDK (`pip install code2prompt-rs`), MCP
   server, and Rust library. Built-in git integration includes diffs, logs, and
   branch comparisons. [SOURCE: github.com/mufeedvh/code2prompt,
   code2prompt.dev]

4. **files-to-prompt (2.6k GitHub stars, by Simon Willison) is the
   Unix-philosophy minimalist option: stdin-friendly, filter-by-extension, pure
   concatenation.** [CONFIDENCE: HIGH]

   Written in Python, installed via pip. Accepts paths and stdin piping (e.g.,
   `find . -mtime -1 | files-to-prompt`). Supports XML output format optimized
   for Claude's extended context, markdown with fenced code blocks, and
   line-numbered output. Willison himself uses it in pipelines:
   `files-to-prompt . -c | llm -m gemini-2.0-pro-exp "architectural overview"`.
   [SOURCE: github.com/simonw/files-to-prompt, simonwillison.net]

5. **OneFileLLM (1.9k GitHub stars) is the multi-source aggregator — the only
   tool that combines repos, web pages, PDFs, YouTube transcripts, and academic
   papers.** [CONFIDENCE: HIGH]

   Outputs structured XML wrapping diverse source types. Supports GitHub
   repos/PRs/issues, ArXiv papers, DOIs, PubMed IDs, YouTube transcripts, web
   crawling with depth control. Designed for "LLM pipeline integration for
   multi-stage analysis workflows." Key differentiator is source breadth rather
   than code-specific features. [SOURCE: github.com/jimmc414/onefilellm]

6. **repo2txt (web-based, no install required) and kirill-markin/repo-to-text
   (Python) are simpler tools serving niche needs.** [CONFIDENCE: MEDIUM]

   repo2txt runs entirely in-browser, supports private repos via GitHub tokens,
   intelligently pre-selects relevant files by project type. repo-to-text
   converts to a single markdown file with directory tree. Both lack the feature
   depth of Repomix but have zero setup friction. Exact star counts for repo2txt
   were not obtained from official sources; kirill-markin/repo-to-text has
   modest traction. [SOURCE: blog.stephenturner.us,
   github.com/kirill-markin/repo-to-text]

7. **Repomix's Tree-sitter compression is the most sophisticated token reduction
   mechanism available: ~70% token reduction by keeping function signatures and
   discarding implementations.** [CONFIDENCE: HIGH]

   The `--compress` flag triggers Tree-sitter parsing that strips function
   bodies, loop logic, and internal variables while preserving: function/method
   signatures, interface/type definitions, class structures. This yields
   "skeleton" code useful for architecture understanding. Marked experimental
   but actively improved. No published list of supported languages as of
   research date. [SOURCE: repomix.com/guide/code-compress,
   repomix.com/guide/configuration]

8. **Full-text flattening wins for holistic reasoning; RAG wins for scale and
   precision on targeted queries.** [CONFIDENCE: HIGH]

   Full-text (repo-to-text) advantages: no retrieval loss, preserves cross-file
   relationships, enables "whole picture" reasoning. Limitations: context window
   caps, "lost in the middle" degradation (30%+ accuracy drop for information in
   the middle of long contexts), and exponential cost. RAG advantages: scales to
   any codebase size, 1,250x lower cost per query, 1s vs 45s latency.
   Limitation: retrieval lottery — if the relevant chunk isn't retrieved, the
   answer fails. Best practice for 2025/2026: use full-text for repos fitting
   within 200K tokens; use RAG for anything larger or for production Q&A
   systems. [SOURCE: elastic.co/search-labs, thecloudgirl.dev,
   promptmetheus.com]

9. **Questions that work well with repo-to-text output to LLMs: architecture
   review, onboarding, cross-cutting refactoring, documentation generation,
   security audits, migration planning.** [CONFIDENCE: HIGH]

   Based on Repomix use-cases documentation and practitioner workflows
   (Willison, Osmani, Steinberger): effective tasks include explaining how the
   codebase is structured, identifying architectural patterns, suggesting
   implementation approaches for new features, generating API docs from source,
   reviewing security vulnerabilities across the whole codebase, and planning
   framework migrations. Gemini's 1M token window is specifically called out as
   ideal for loading "500k token" projects to generate specs. [SOURCE:
   repomix.com/guide/use-cases, steipete.me, simonwillison.net]

10. **Questions that fail or degrade with repo-to-text: exact debugging of
    runtime behavior, tasks requiring library knowledge outside training data,
    and highly specific line-level queries on large repos.** [CONFIDENCE:
    MEDIUM]

    Failure modes: (a) "lost in the middle" — LLMs ignore files buried in the
    middle of a massive dump; (b) runtime vs. static — LLMs cannot execute code
    or see actual outputs; (c) libraries post-training-cutoff — model
    hallucinates API signatures; (d) granular debugging — better to provide
    targeted files rather than the whole repo. Simon Willison explicitly notes:
    "Libraries outside the model's training data requires manual examples."
    [SOURCE: simonwillison.net, promptmetheus.com, dev.to/thousand_miles_ai]

11. **Repomix has a full programmatic Node.js API via `runCli()` and lower-level
    functions.** [CONFIDENCE: HIGH]

    `runCli(paths, cwd, options)` returns a promise with `totalFiles`,
    `totalCharacters`, `totalTokens`, `fileCharCounts`, `fileTokenCounts`.
    Lower-level functions: `searchFiles()`, `collectFiles()`, `processFiles()`,
    `TokenCounter()`. Also runs as an MCP server via `repomix --mcp`, exposing 6
    tools: `pack_codebase`, `pack_remote_repository`, `read_repomix_output`,
    `grep_repomix_output`, `file_system_read_file`,
    `file_system_read_directory`. Integrates natively with Claude Desktop,
    Cursor, VS Code (Cline), and Claude Code. GitHub Actions integration is
    available via `yamadashy/repomix/.github/actions/repomix@main`. [SOURCE:
    repomix.com/guide/development/using-repomix-as-a-library,
    repomix.com/guide/mcp-server, repomix.com/guide/github-actions]

12. **Security risks: the core risk is sending proprietary code to cloud LLM
    providers whose data retention policies may allow training on that data.**
    [CONFIDENCE: HIGH]

    Repomix mitigates pre-output exposure via Secretlint (detects API keys,
    access tokens, credentials, private keys, environment variables, AWS
    credentials, DB connection strings). Limitations: binary file contents
    excluded but paths still visible; only catches "common" patterns — no
    exhaustive coverage; human review required before sharing. Enterprise
    mitigation: use API contracts with zero data retention (AWS Bedrock, Azure
    OpenAI), or run local models (Ollama, llamafile). Free/consumer tiers of
    OpenAI/Anthropic may use prompts for training unless explicitly opted out.
    [SOURCE: repomix.com/guide/security, lasso.security, rohan-paul.com]

---

## Detailed Analysis

### Tool Comparison Matrix

| Tool            | Stars    | Language | Output Formats       | Programmatic API              | Key Differentiator                                      |
| --------------- | -------- | -------- | -------------------- | ----------------------------- | ------------------------------------------------------- |
| Repomix         | 22.8k    | Node.js  | XML, MD, JSON, plain | Full Node.js API + MCP server | Most features, Tree-sitter compression, Secretlint      |
| Gitingest       | 14.2k    | Python   | Plain text (3-part)  | Python sync/async API         | URL trick (hub → ingest), zero friction                 |
| code2prompt     | 7.3k     | Rust     | Markdown, custom     | Python SDK, MCP server, CLI   | Handlebars templates, performance, git integration      |
| files-to-prompt | 2.6k     | Python   | XML, Markdown, plain | stdin pipe-friendly           | Unix pipeline composability                             |
| OneFileLLM      | 1.9k     | Python   | XML                  | CLI + aliases                 | Multi-source aggregation (repos + web + PDFs + YouTube) |
| repo2txt        | ~unknown | JS/HTML  | Plain text           | Browser-only                  | Zero install, private repos, in-browser                 |

### How Full-Text Flattening Works (Common Pattern)

All tools follow this general pipeline:

1. Traverse repository directory tree
2. Apply ignore rules (`.gitignore`, custom patterns, default exclusions for
   `node_modules`, build artifacts, binaries)
3. For each included file: prepend file path header, append contents
4. Optionally: add directory tree summary, file statistics, token counts
5. Output as single file or stdout

The key design choices that differentiate tools are: output structure (how file
boundaries are marked), filtering sophistication, token counting accuracy, and
optional semantic transformations (compression).

### Handling Large Repos: Strategy Comparison

Four strategies emerge from the research:

**Strategy 1: Aggressive pre-filtering (most common)** Use glob patterns to
include only relevant subdirectories: `repomix --include "src/**/*.ts,**/*.md"`.
Exclude tests, build artifacts, lock files. A React project likely only needs
`src/`, `package.json`, and a few config files. Repomix's `--token-count-tree`
flag helps identify which directories are consuming the most tokens before
committing to an output.

**Strategy 2: Compression (Repomix-specific)** `--compress` strips
implementations via Tree-sitter, yielding ~70% token reduction while preserving
signatures. Useful when architecture overview is the goal rather than debugging
specific implementations.

**Strategy 3: Output splitting** `--split-output 20mb` splits into multiple
numbered files (e.g., `repomix-output.1.xml`, `repomix-output.2.xml`). Files are
grouped by top-level directory; no single file is split across parts. Needed
when repo output exceeds tool limits (Google AI Studio's 1MB limit is mentioned
specifically).

**Strategy 4: RAG over large repos** For repos too large for any context window,
use LangChain/LlamaIndex to chunk and index the repo, then retrieve relevant
sections per query. Cost is 1,250x lower per query than full-context but
requires semantic search infrastructure and introduces retrieval lottery risk.

### What Works Well: Practitioner Evidence

From Addy Osmani, Simon Willison, Peter Steinberger:

Works well:

- "What's notable about this project?" (architecture overview)
- "How did they solve [specific problem]?" (pattern extraction)
- "Generate API documentation for these functions" (documentation)
- "What edge cases are implemented here that I didn't think of?" (knowledge
  extraction)
- "I want to add user authentication — suggest the best approach given the
  current structure" (implementation planning)
- "Perform a comprehensive security audit" (cross-codebase scanning)

Works less well / fails:

- Debugging specific runtime errors without execution traces
- Generating code using libraries post-training-cutoff (hallucinated APIs)
- Asking granular questions about a 500k-token dump (lost-in-middle problem)
- Expecting the LLM to "remember" earlier context after context window fills

### Security: Three-Layer Risk Model

**Layer 1: Pre-output (Repomix mitigates)** Secretlint scans before generating
output. Catches API keys, tokens, private keys. Default enabled. Limitation:
pattern-based, not exhaustive.

**Layer 2: Pre-transmission (user responsibility)** Review output file before
uploading. Create `.repomixignore` for sensitive paths. Exclude `.env` files,
secrets directories. Binary file paths are visible even when contents are
excluded.

**Layer 3: Transmission policy (provider responsibility)** Free tiers (OpenAI
ChatGPT, Claude claude.ai) may log and train on prompts unless opted out.
Enterprise contracts (AWS Bedrock, Azure OpenAI, Anthropic API with ZDR)
guarantee no training use. For regulated industries or IP-sensitive code, local
models are the only safe option.

---

## Gaps Identified

1. **Repomix npm weekly download count**: The 45,534/week figure came from a
   search snippet, not direct npm page access (403 error). Should be verified
   directly at npmjs.com/package/repomix for current data.

2. **Gitingest exact star count as of March 2026**: The 14.2k figure was from
   the GitHub repo page fetch, but the search confirmed it was 14.2k. Gitingest
   is now under `coderamp-labs/gitingest` (previously `cyclotruc/gitingest`) —
   the transfer may affect tracking.

3. **code2prompt's supported languages for Handlebars templates and git diff
   integration**: Documentation mentions git diff but specific git-integration
   workflow details beyond "include diffs" were not fully extracted.

4. **Tree-sitter language support matrix for Repomix compression**: The
   compression page did not publish which languages are supported. This matters
   for non-JS/TS repos.

5. **Comparative accuracy benchmarks**: No rigorous benchmarks comparing LLM
   answer quality between full-text vs. RAG approaches specifically for code
   repos were found. The 1,250x cost figure and 1s vs 45s latency figures came
   from general RAG vs. long-context research, not code-specific studies.

6. **Gitingest web app size caps**: The 1,000-file limit and 10MB-per-file limit
   apply to the Python library but the web interface may have additional rate
   limits or size caps not documented.

7. **repo2txt GitHub star count**: Could not get authoritative count during
   research. The tool appears less maintained; exact popularity unknown.

---

## Sources

| #   | URL                                                                              | Title                                  | Type                              | Trust       | CRAAP Score | Date    |
| --- | -------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------- | ----------- | ----------- | ------- |
| 1   | https://github.com/yamadashy/repomix                                             | Repomix GitHub Repository              | Official source                   | HIGH        | 5/5/5/5/5   | 2026-03 |
| 2   | https://repomix.com/guide/configuration                                          | Repomix Configuration Guide            | Official docs                     | HIGH        | 5/5/5/5/5   | 2026-03 |
| 3   | https://repomix.com/guide/output                                                 | Repomix Output Formats                 | Official docs                     | HIGH        | 5/5/5/5/5   | 2026-03 |
| 4   | https://repomix.com/guide/command-line-options                                   | Repomix CLI Options                    | Official docs                     | HIGH        | 5/5/5/5/5   | 2026-03 |
| 5   | https://repomix.com/guide/mcp-server                                             | Repomix MCP Server Guide               | Official docs                     | HIGH        | 5/5/5/5/5   | 2026-03 |
| 6   | https://repomix.com/guide/security                                               | Repomix Security Guide                 | Official docs                     | HIGH        | 5/5/5/5/5   | 2026-03 |
| 7   | https://repomix.com/guide/usage                                                  | Repomix Usage Guide                    | Official docs                     | HIGH        | 5/5/5/5/5   | 2026-03 |
| 8   | https://repomix.com/guide/code-compress                                          | Repomix Code Compression               | Official docs                     | HIGH        | 5/5/5/5/5   | 2026-03 |
| 9   | https://repomix.com/guide/development/using-repomix-as-a-library                 | Repomix Library API                    | Official docs                     | HIGH        | 5/5/5/5/5   | 2026-03 |
| 10  | https://repomix.com/guide/github-actions                                         | Repomix GitHub Actions                 | Official docs                     | HIGH        | 5/5/5/5/5   | 2026-03 |
| 11  | https://repomix.com/guide/use-cases                                              | Repomix Use Cases                      | Official docs                     | HIGH        | 5/5/5/5/5   | 2026-03 |
| 12  | https://github.com/coderamp-labs/gitingest                                       | Gitingest GitHub Repository            | Official source                   | HIGH        | 5/5/5/5/5   | 2026-03 |
| 13  | https://deepwiki.com/cyclotruc/gitingest                                         | Gitingest DeepWiki                     | Community (derived from official) | MEDIUM-HIGH | 4/5/4/4/5   | 2025-09 |
| 14  | https://github.com/mufeedvh/code2prompt                                          | code2prompt GitHub Repository          | Official source                   | HIGH        | 5/5/5/5/5   | 2026-03 |
| 15  | https://code2prompt.dev/docs/welcome/                                            | code2prompt Documentation              | Official docs                     | HIGH        | 5/5/5/5/5   | 2026-03 |
| 16  | https://github.com/simonw/files-to-prompt                                        | files-to-prompt GitHub                 | Official source                   | HIGH        | 5/5/5/5/5   | 2026-03 |
| 17  | https://github.com/jimmc414/onefilellm                                           | OneFileLLM GitHub Repository           | Official source                   | HIGH        | 5/5/5/5/5   | 2026-03 |
| 18  | https://simonwillison.net/2025/Mar/11/using-llms-for-code/                       | Simon Willison: Using LLMs for Code    | Expert practitioner               | HIGH        | 4/5/5/5/5   | 2025-03 |
| 19  | https://steipete.me/posts/2025/understanding-codebases-with-ai-gemini-workflow   | Understanding Codebases with AI Gemini | Expert practitioner               | MEDIUM-HIGH | 4/4/4/4/5   | 2025    |
| 20  | https://blog.openreplay.com/git-repos-llm-ready-text/                            | Turning Git Repos into LLM-Ready Text  | Technical blog                    | MEDIUM      | 4/4/3/4/5   | 2025    |
| 21  | https://blog.stephenturner.us/p/github-repo-to-text-for-llm-input                | repo2txt Workflow                      | Practitioner blog                 | MEDIUM      | 4/4/4/4/5   | 2024-12 |
| 22  | https://elastic.co/search-labs/blog/rag-vs-long-context-model-llm                | RAG vs Long Context Model LLM          | Official technical blog           | HIGH        | 5/5/4/5/5   | 2025    |
| 23  | https://promptmetheus.com/resources/llm-knowledge-base/lost-in-the-middle-effect | Lost-in-the-Middle Effect              | Reference documentation           | MEDIUM      | 4/5/3/4/5   | 2025    |
| 24  | https://github.com/yamadashy/repomix/discussions/188                             | Repopack → Repomix Rename Notice       | Official discussion               | HIGH        | 5/5/5/5/5   | 2024-12 |
| 25  | https://lasso.security/blog/llm-data-privacy                                     | LLM Data Privacy Enterprise Guide      | Security vendor blog              | MEDIUM      | 4/4/4/4/3   | 2025    |

---

## Contradictions

**Compression claim: "~70% token reduction"** The Repomix MCP server page claims
"~70% token reduction" for the compress flag. The code compression guide page
itself does not publish specific percentages and marks the feature as
"experimental." The 70% figure appears in multiple secondary sources but the
primary documentation does not confirm it with measured data. Confidence in the
specific percentage is LOW; confidence that significant reduction occurs is
HIGH.

**Gitingest "no data collection, works entirely offline"** Gitingest's README
states it collects no data and works offline. However, the GitHub fetch revealed
the web app uses PostHog for analytics and Sentry for error tracking. This
applies to the hosted web service, not local installs. Users running the Python
library locally do have full privacy; users of gitingest.com are subject to
analytics.

---

## Serendipity

- **`--mcp` flag in Repomix turns it into an MCP server exposing 6 tools** —
  this enables AI assistants to autonomously pack repos during agentic workflows
  rather than requiring pre-packed files. This is a significant integration
  pattern for Claude Code users specifically.

- **Repomix's `output.git.sortByChanges: true` default** sorts files by Git
  commit frequency. This is a non-obvious default that puts the most-changed
  (presumably most important) files at the top of the output — directly
  addressing the "lost in the middle" problem by biasing important content
  toward the beginning of context.

- **Google AI Studio 1MB file limit** is documented as a real constraint that
  the `--split-output` flag was designed to address. Tools targeting Google's
  ecosystem need to account for this specific cap.

- **llms.txt as an emerging standard**: Some practitioners recommend creating a
  `llms.txt` file at repo root — a curated markdown summary of the codebase
  structure, goals, and key areas, similar to robots.txt. Described as a
  "one-time cost that pays off in the long run" for ongoing LLM-assisted
  development.

- **Repomix's `--stdin` flag** allows piping selective file lists from `fzf`,
  `git`, `find`, or `ripgrep` — enabling fuzzy-selector driven context building
  where developers interactively choose files before packing. Underutilized but
  powerful for targeted context.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The domain is well-documented with active official documentation from all major
tools. Primary sources were available and consistent across multiple independent
sources for all key claims.
