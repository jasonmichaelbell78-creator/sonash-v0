# SQ-005: CLI Tools for Web Scraping, Data Extraction, API Interaction, and Research

<!-- prettier-ignore -->
| Field       | Value                                |
| ----------- | ------------------------------------ |
| Question    | SQ-005                               |
| Searcher    | web                                  |
| Depth       | L1 (Exhaustive)                      |
| Queries run | 12 WebSearch + 16 WebFetch           |
| Date        | 2026-03-23                           |

---

## Category 1: HTTP Clients (Modern curl Alternatives)

### HTTPie

- **What:** Modern, user-friendly command-line HTTP client with intuitive
  syntax, JSON support, colorized output, sessions, and plugins
- **URL:** https://github.com/httpie/cli
- **Install:** `pip install httpie` / `brew install httpie` / Windows:
  `pip install httpie` or download from httpie.io
- **Stars/Activity:** 37.8k stars; latest release v3.2.4 (November 2024);
  Python-based
- **Windows:** Yes (via pip)
- **Output format:** Colorized JSON/text with syntax highlighting; raw output
  modes available
- **Beyond curl:** Human-readable syntax (`http GET url`), automatic JSON
  serialization, persistent sessions, built-in colorized output, plugin
  ecosystem
- **Workflow fit:** Claude can use `http` commands for more readable API
  interactions than raw curl. Great for quick API exploration where readability
  matters. Slightly slower startup than curl due to Python runtime.
- **Confidence:** HIGH

### xh

- **What:** Rust reimplementation of HTTPie -- same friendly syntax but ~30%
  faster with zero Python dependency
- **URL:** https://github.com/ducaale/xh
- **Install:** `scoop install xh` / `choco install xh` / `winget add ducaale.xh`
  / `cargo install xh`
- **Stars/Activity:** 7.7k stars; latest release v0.25.3 (December 2025); Rust
- **Windows:** Yes (scoop, choco, winget, prebuilt binaries)
- **Output format:** Colorized JSON/headers; same as HTTPie but faster
- **Beyond curl:** HTTPie-compatible syntax without Python dependency. Single
  static binary. `--curl` flag to translate commands to curl equivalents. HTTP/2
  support built-in.
- **Workflow fit:** Best HTTP client for Claude to direct the user to install.
  Fast, single binary, excellent Windows support. Same syntax as HTTPie
  tutorials. Ideal replacement for curl in research workflows where JSON
  readability matters.
- **Confidence:** HIGH

### curlie

- **What:** Frontend to curl that adds HTTPie-like ease of use while preserving
  full curl compatibility
- **URL:** https://github.com/rs/curlie
- **Install:** `scoop install curlie` / `brew install curlie` /
  `go install github.com/rs/curlie@latest`
- **Stars/Activity:** 3.6k stars; latest release v1.8.2 (March 2025); Go
- **Windows:** Yes (scoop, prebuilt binaries)
- **Output format:** Pretty-printed JSON in interactive mode; raw curl output
  otherwise
- **Beyond curl:** Keeps curl's full option set but adds pretty formatting
  automatically. `--curl` flag shows underlying curl command. Headers written to
  stderr (useful for piping).
- **Workflow fit:** Good bridge for users who know curl but want prettier
  output. Less valuable than xh for new adopters since xh is faster and more
  featureful.
- **Confidence:** HIGH

---

## Category 2: API Testing and Development

### Hurl

- **What:** CLI tool for running and testing HTTP requests defined in plain-text
  .hurl files, with assertions and chaining
- **URL:** https://github.com/Orange-OpenSource/hurl
- **Install:** `scoop install hurl` / `choco install hurl` /
  `winget install hurl` / Windows installer available
- **Stars/Activity:** 18.7k stars; latest release v7.1.0 (November 2025); Rust
  (libcurl-powered)
- **Windows:** Yes (scoop, choco, winget, installer, portable zip)
- **Output format:** JSON (`--json` flag), HTML reports, JUnit, TAP (Test
  Anything Protocol)
- **Beyond curl:** Declarative request files with assertions, request chaining
  with captured values, CI/CD integration, performance testing. Treats API tests
  as code. Built on libcurl so inherits its reliability.
- **Workflow fit:** Claude could help write .hurl files for repeatable API test
  sequences. Excellent for testing the user's Firebase Cloud Functions or any
  REST API. The --json output lets Claude parse results. Version-controllable
  test files.
- **Confidence:** HIGH

### Posting

- **What:** Modern TUI (terminal UI) HTTP client -- Postman-like experience
  entirely in the terminal, with YAML-based request storage
- **URL:** https://github.com/darrenburns/posting
- **Install:** `uv tool install posting` / `pipx install posting` (works on
  Windows, macOS, Linux)
- **Stars/Activity:** 11.6k stars; latest release v2.9.2 (October 2025); Python
  (Textual framework)
- **Windows:** Yes (via uv or pipx)
- **Output format:** Visual TUI display; requests stored as YAML files
- **Beyond curl:** Full Postman-like GUI in the terminal. Vim keybindings,
  environments/variables, pre/post request Python scripts, cURL import/export,
  Postman/OpenAPI import, tree-sitter syntax highlighting. Usable over SSH.
- **Workflow fit:** Best for the user's interactive API exploration sessions.
  Not ideal for Claude to drive (TUI), but excellent for the user to manually
  test APIs while Claude watches. YAML request files are version-controllable.
- **Confidence:** HIGH

---

## Category 3: Web Scraping and Crawling

### Firecrawl CLI

- **What:** CLI and Agent Skill for turning websites into LLM-ready markdown or
  structured JSON data, with search, crawl, and extract capabilities
- **URL:** https://github.com/firecrawl/cli (CLI);
  https://github.com/firecrawl/firecrawl (core, 96.8k stars)
- **Install:** `npm install -g firecrawl-cli` /
  `npx -y firecrawl-cli@latest init -y --browser`
- **Stars/Activity:** CLI: 203 stars; Core: 96.8k stars; actively maintained
  with frequent releases
- **Windows:** Yes (npm/npx)
- **Output format:** Markdown, HTML, JSON, screenshots, structured data with
  custom schemas
- **Beyond curl:** JavaScript rendering, AI-powered extraction with natural
  language prompts, batch processing of thousands of URLs, site mapping, change
  monitoring, PDF/DOCX text extraction, browser automation (click/scroll/type).
  Claude Code plugin and MCP server available.
- **Workflow fit:** The most powerful research tool in this list. Claude could
  direct `firecrawl scrape URL` to get clean markdown from any page. The
  structured extraction mode (`firecrawl extract`) can pull specific data
  schemas. Requires API key (free tier available). The MCP server integration
  means it could plug directly into Claude Code.
- **Confidence:** HIGH

### shot-scraper

- **What:** CLI tool for automated screenshots and JavaScript-based web
  scraping, built on Playwright
- **URL:** https://github.com/simonw/shot-scraper
- **Install:** `pip install shot-scraper && shot-scraper install` (installs
  Playwright + Chromium)
- **Stars/Activity:** 2.3k stars; latest release v1.9.1 (February 2026); Python
- **Windows:** Yes (via pip; Playwright supports Windows)
- **Output format:** PNG/JPEG screenshots; JavaScript execution returns any
  format (JSON, text, etc.)
- **Beyond curl:** Renders JavaScript (full browser). Can execute arbitrary JS
  on pages to extract data. Takes screenshots of specific CSS selectors. Can
  scrape SPAs that curl cannot reach. Accessibility snapshot support.
- **Workflow fit:** Claude could use `shot-scraper javascript URL 'script'` to
  extract structured data from JS-heavy pages. The
  `shot-scraper accessibility URL` command produces a text representation of a
  page useful for AI analysis. Heavier install (Playwright + Chromium) but
  handles dynamic content that curl/WebFetch cannot.
- **Confidence:** HIGH

### Katana

- **What:** Next-generation web crawling and spidering framework by
  ProjectDiscovery, designed for security reconnaissance and automation
  pipelines
- **URL:** https://github.com/projectdiscovery/katana
- **Install:** `go install github.com/projectdiscovery/katana/cmd/katana@latest`
  / Docker available
- **Stars/Activity:** 16.3k stars; actively maintained; Go
- **Windows:** Partial (requires CGO_ENABLED=1 and Go toolchain; no prebuilt
  Windows binaries documented)
- **Output format:** STDOUT, file, JSONL with customizable field templates
- **Beyond curl:** Dual crawling modes (fast HTTP + headless browser with JS
  rendering), automatic form filling, scope control via regex, captcha solving
  (reCAPTCHA, Turnstile, hCaptcha), endpoint discovery from JavaScript
- **Workflow fit:** Primarily a security/recon tool. Useful if the user needs to
  discover all endpoints on a site or map a web application's structure. JSONL
  output is Claude-parseable. Windows support is weak.
- **Confidence:** MEDIUM

### Monolith

- **What:** CLI tool that saves complete web pages as single self-contained HTML
  files with all assets embedded
- **URL:** https://github.com/Y2Z/monolith
- **Install:** `scoop install monolith` / `choco install monolith` /
  `winget install Y2Z.Monolith` / `cargo install monolith`
- **Stars/Activity:** 14.9k stars; latest release v2.10.1 (March 2025); Rust
- **Windows:** Yes (scoop, choco, winget, prebuilt binaries)
- **Output format:** Single HTML file (all CSS/JS/images embedded as data URIs)
  or MHTML
- **Beyond curl:** Embeds all assets into a single file (curl only gets raw
  HTML). Handles CSS, images, fonts, JavaScript. Domain whitelist/blacklist.
  Works offline after save. Basic auth support.
- **Workflow fit:** Save complete web pages for offline analysis. Claude could
  use `monolith URL -o file.html` to capture a full page state for later review.
  Good for archiving research sources. The single-file output is portable and
  self-contained.
- **Confidence:** HIGH

---

## Category 4: HTML Parsing (jq for HTML)

### htmlq

- **What:** Like jq, but for HTML -- extracts content from HTML using CSS
  selectors
- **URL:** https://github.com/mgdm/htmlq
- **Install:** `scoop install htmlq` / `cargo install htmlq` /
  `brew install htmlq`
- **Stars/Activity:** 7.5k stars; latest release v0.4.0 (January 2022); Rust
- **Windows:** Yes (scoop)
- **Output format:** HTML fragments, plain text (`--text`), attribute values
  (`-a`)
- **Beyond curl:** Pipe curl output through htmlq with CSS selectors. Extract
  text, attributes, or HTML fragments. Remove unwanted nodes. Pretty print
  output.
- **Workflow fit:** Pairs perfectly with curl/xh for scraping pipelines:
  `curl -s URL | htmlq '.selector' --text`. Claude can chain these commands for
  targeted data extraction without needing a full scraping framework.
  Lightweight single binary.
- **Confidence:** HIGH

### pup

- **What:** HTML parser for the command line using CSS selectors, inspired by jq
- **URL:** https://github.com/ericchiang/pup
- **Install:** `brew install pup` /
  `go install github.com/ericchiang/pup@latest` / prebuilt binaries
- **Stars/Activity:** 8.4k stars; last commit March 2022; Go
- **Windows:** Partial (prebuilt binaries on releases page, no package manager)
- **Output format:** HTML, plain text (`text{}`), JSON (`json{}`), attribute
  values (`attr{name}`)
- **Beyond curl:** CSS selector filtering, JSON output mode (structured),
  pseudo-classes (`:nth-child`, `:contains`), auto-fixes malformed HTML. More
  output format options than htmlq.
- **Workflow fit:** The `json{}` display function makes pup output directly
  parseable by Claude. `curl -s URL | pup '.class json{}'` produces structured
  JSON from any HTML page. Slightly more versatile than htmlq for structured
  output, but less maintained.
- **Confidence:** MEDIUM (not actively maintained since 2022)

---

## Category 5: JSON/Structured Data Processing

### jq

- **What:** Lightweight, flexible command-line JSON processor -- the
  sed/awk/grep of JSON
- **URL:** https://github.com/jqlang/jq
- **Install:** Prebuilt Windows binaries from GitHub releases /
  `choco install jq` / `scoop install jq`
- **Stars/Activity:** 33.9k stars; latest release v1.8.1 (July 2025); C
- **Windows:** Yes (prebuilt binaries, choco, scoop)
- **Output format:** JSON (filtered/transformed)
- **Beyond curl:** The universal standard for JSON processing. Slice, filter,
  map, transform structured data. Zero runtime dependencies. Composes with every
  other tool in this list.
- **Workflow fit:** Essential tool. Claude already uses jq concepts. Every API
  response, every JSONL file, every structured data pipeline benefits from jq.
  Must-have. `curl API | jq '.data[] | {name, value}'` is the core research
  pattern.
- **Confidence:** HIGH

### yq

- **What:** Lightweight YAML/JSON/XML/CSV/TOML processor using jq-like syntax
- **URL:** https://github.com/mikefarah/yq
- **Install:** `choco install yq` / `scoop install main/yq` /
  `winget install MikeFarah.yq`
- **Stars/Activity:** 15.1k stars; actively maintained (2,167 commits); Go
- **Windows:** Yes (choco, scoop, winget, prebuilt binaries)
- **Output format:** YAML, JSON, XML, CSV, TSV, TOML, properties
- **Beyond curl:** Processes YAML (which jq cannot), plus JSON, XML, CSV, TOML,
  HCL, INI. Format conversion between any supported types. In-place file
  editing. GitHub Actions integration.
- **Workflow fit:** Essential for the user's Next.js/Firebase workflow. Process
  YAML configs, Firebase rules, GitHub Actions workflows, package.json. Claude
  can use `yq '.field' file.yaml` for any config file query. Complements jq for
  non-JSON formats.
- **Confidence:** HIGH

### dasel

- **What:** Universal data selector -- query and modify JSON, YAML, TOML, XML,
  CSV with one tool and one syntax
- **URL:** https://github.com/TomWright/dasel
- **Install:** `brew install dasel` /
  `go install github.com/tomwright/dasel/v3/cmd/dasel@master` / prebuilt Windows
  binaries
- **Stars/Activity:** 7.9k stars; actively maintained; Go
- **Windows:** Yes (prebuilt binaries on releases page)
- **Output format:** Any of: JSON, YAML, TOML, XML, CSV (input and output
  formats can differ)
- **Beyond curl:** One tool, one syntax for all structured formats. Converts
  between formats. Recursive descent and conditional queries. Simpler syntax
  than jq for basic operations.
- **Workflow fit:** Alternative to jq+yq if the user wants a single tool.
  `echo '{"a":1}' | dasel -i json 'a'` works the same regardless of format. Good
  for format conversion tasks.
- **Confidence:** MEDIUM

### gron

- **What:** Makes JSON greppable by transforming it into discrete path=value
  assignments
- **URL:** https://github.com/tomnomnom/gron
- **Install:** `brew install gron` /
  `go install github.com/tomnomnom/gron@latest` / prebuilt binaries
- **Stars/Activity:** 14.4k stars; latest release v0.7.1 (April 2022); Go
- **Windows:** Yes (prebuilt binaries on releases page)
- **Output format:** Path assignments (greppable text), reversible back to JSON
  with `--ungron`
- **Beyond curl:** Converts nested JSON into flat `json.path = "value"` lines
  that grep can search. `--ungron` converts filtered results back to valid JSON.
  `--json` outputs JSON stream format. Perfect for exploring unknown API
  responses.
- **Workflow fit:** When Claude encounters a large unknown JSON response,
  `gron response.json | grep "field"` instantly finds where data lives. The
  `--ungron` round-trip is powerful:
  `gron data.json | grep pattern | gron --ungron` produces filtered JSON. Ideal
  for API discovery.
- **Confidence:** HIGH

### fx

- **What:** Terminal JSON viewer and processor with interactive navigation
- **URL:** https://github.com/antonmedv/fx
- **Install:** `brew install fx` / `snap install fx` / npm / prebuilt binaries
- **Stars/Activity:** 20.3k stars; latest release v39.2.0 (November 2025); Go
- **Windows:** Yes (prebuilt binaries, npm)
- **Output format:** Interactive TUI display; can apply JavaScript/Python
  transformations to output JSON
- **Beyond curl:** Interactive JSON exploration with keyboard navigation. Apply
  JS expressions to transform data. Themes and search. Streaming JSON support.
- **Workflow fit:** Interactive tool for the user, not for Claude to drive. When
  the user needs to visually explore a complex API response, `curl API | fx`
  provides a rich browsing experience. Complements jq (fx for exploration, jq
  for scripting).
- **Confidence:** HIGH

### jc

- **What:** Converts output from 75+ CLI tools (ps, ls, df, dig, etc.) and file
  types into JSON/YAML
- **URL:** https://github.com/kellyjonbrazil/jc
- **Install:** `pip3 install jc` / prebuilt binaries
- **Stars/Activity:** 8.6k stars; actively maintained (3,917 commits); Python
- **Windows:** Yes (pip, prebuilt binaries)
- **Output format:** JSON, YAML, Python dictionaries
- **Beyond curl:** Transforms unstructured CLI output into structured JSON.
  `dig example.com | jc --dig | jq '.answer'` turns any command's output into
  queryable data. 75+ parsers for common tools. Streaming mode for large
  datasets.
- **Workflow fit:** Extremely useful for Claude research workflows. Any command
  that produces text output can be piped through jc to get JSON that Claude can
  reason about. `git log | jc --git-log | jq` or `ls -la | jc --ls | jq`.
  Bridges the gap between text-output tools and structured processing.
- **Confidence:** HIGH

### jless

- **What:** Command-line JSON (and YAML) viewer with syntax highlighting,
  collapsible nodes, and vim navigation
- **URL:** https://github.com/PaulJuliusMartinez/jless
- **Install:** `brew install jless` / `cargo install jless` / prebuilt binaries
- **Stars/Activity:** 5.3k stars; latest release v0.9.0 (July 2023); Rust
- **Windows:** No (planned but not yet available)
- **Output format:** Interactive TUI viewer (read-only)
- **Beyond curl:** Clean syntax-highlighted JSON display. Expand/collapse
  objects and arrays. Vim-style navigation. Regex search. YAML support.
- **Workflow fit:** Not useful for Claude (interactive viewer). Good for user's
  manual JSON exploration but not available on Windows. fx is a better choice
  for this use case.
- **Confidence:** LOW (no Windows support)

### Miller (mlr)

- **What:** Like awk/sed/cut/join/sort but for name-indexed data (CSV, TSV,
  JSON, JSON Lines)
- **URL:** https://github.com/johnkerl/miller
- **Install:** `choco install miller` / `winget install Miller.Miller` /
  `scoop install main/miller`
- **Stars/Activity:** 9.8k stars; actively maintained (9,202 commits); Go
- **Windows:** Yes (choco, winget, scoop)
- **Output format:** CSV, TSV, JSON, JSON Lines, markdown tables, and more
- **Beyond curl:** Full data processing language for tabular data. Filter, sort,
  aggregate, join, reshape. Format conversion (CSV to JSON, etc.). Streaming
  (handles files larger than memory). Statistics (mean, median, percentiles).
  Far more capable than csvkit for complex operations.
- **Workflow fit:** When Claude or the user needs to process CSV/TSV data from
  APIs or exports, Miller is the tool. `mlr --icsv --ojson head -n 5 data.csv`
  converts CSV to JSON for Claude to parse. Analytics on structured data without
  leaving the terminal. Essential for data research.
- **Confidence:** HIGH

---

## Category 6: Web Search from Terminal

### googler

- **What:** Google search from the terminal with ad-free results
- **URL:** https://github.com/jarun/googler
- **Install:** Standalone Python script; `pip install googler`; WSL on Windows
- **Stars/Activity:** 6.2k stars; **ARCHIVED** (March 2022, last commit May
  2021); Python
- **Windows:** Partial (WSL only; no native Windows)
- **Output format:** Formatted text with titles, URLs, descriptions; JSON output
  mode available
- **Beyond curl:** Google search without browser, no ads, site-specific search,
  news/video modes
- **Workflow fit:** DEPRECATED/ARCHIVED. Claude Code's built-in WebSearch is a
  better alternative. Not recommended for new adoption.
- **Confidence:** LOW (archived, not maintained)

### ddgr

- **What:** DuckDuckGo search from the terminal with privacy-first design
- **URL:** https://github.com/jarun/ddgr
- **Install:** `pip install ddgr` / standalone Python script; works on Windows
  via Python
- **Stars/Activity:** 3.3k stars; latest release v2.2 (December 2023); Python
- **Windows:** Yes (via Python; clip utility for clipboard)
- **Output format:** Formatted text; JSON output available
- **Beyond curl:** DuckDuckGo Bangs integration, no tracking, region/time
  filtering, Tor support, REPL mode for continuous searching
- **Workflow fit:** Privacy-conscious alternative to WebSearch. Claude could use
  `ddgr --json "query"` to get structured search results. However, Claude Code's
  built-in WebSearch is more convenient. Only recommended if privacy is a
  priority or WebSearch is unavailable.
- **Confidence:** MEDIUM

---

## Category 7: Download Managers

### aria2

- **What:** Lightweight multi-protocol, multi-source CLI download utility
  supporting HTTP(S), FTP, SFTP, BitTorrent, and Metalink
- **URL:** https://github.com/aria2/aria2
- **Install:** Prebuilt Windows binaries / `choco install aria2` /
  `scoop install aria2`
- **Stars/Activity:** 40.4k stars; actively maintained with monthly releases;
  C++
- **Windows:** Yes (prebuilt binaries, choco, scoop)
- **Output format:** Downloaded files; JSON-RPC and XML-RPC control interfaces
- **Beyond curl:** Multi-connection parallel downloading (segments single files
  across multiple connections), multi-source downloads, BitTorrent support,
  metalink support, JSON-RPC interface for programmatic control, resume support.
  Only 4MB memory for HTTP downloads.
- **Workflow fit:** When Claude needs to download large files (datasets,
  research archives, multiple files), aria2 is dramatically faster than
  curl/wget. `aria2c -x 16 URL` downloads with 16 connections. The JSON-RPC
  interface enables programmatic download management.
- **Confidence:** HIGH

### wget2

- **What:** GNU Wget successor with HTTP/2, parallel downloads, and modern
  compression support
- **URL:** https://github.com/rockdaboot/wget2
- **Install:** Cross-compile via Docker for Windows; native on Linux package
  managers
- **Stars/Activity:** 729 stars; latest release v2.2.1 (December 2025); C
- **Windows:** Partial (Docker cross-compilation required; no simple installer)
- **Output format:** Downloaded files; same as wget
- **Beyond curl:** HTTP/2 multiplexing, multi-threaded parallel downloads,
  brotli/zstd/lzip compression, RSS/Atom/Sitemap parsing, HSTS support,
  supercookie detection. Drop-in replacement for wget.
- **Workflow fit:** Better wget for recursive site downloads. The
  RSS/Atom/Sitemap parsing is unique. However, Windows support is poor and aria2
  is more practical for most use cases.
- **Confidence:** LOW (weak Windows support)

---

## Category 8: LLM-Powered Research Tools

### llm (Simon Willison)

- **What:** CLI tool for interacting with multiple LLM providers (OpenAI,
  Anthropic, Google, local models) from the terminal, with SQLite storage and
  tool use
- **URL:** https://github.com/simonw/llm
- **Install:** `pip install llm` / `pipx install llm` / `uv tool install llm` /
  `brew install llm`
- **Stars/Activity:** 11.4k stars; actively maintained; Python
- **Windows:** Yes (pip, pipx, uv)
- **Output format:** Text, JSON (structured extraction), SQLite database for
  history
- **Beyond curl:** Prompt any LLM from CLI. Store all prompts/responses in
  SQLite for searchable history. Generate embeddings. Plugin system for 50+
  model providers. Tool use support (v0.26+). MCP client support (planned).
  Templates for reusable prompts.
- **Workflow fit:** Complements Claude Code for tasks where you want to pipe
  data through an LLM. `cat file | llm "summarize this"` or
  `curl API | llm "extract the key findings"`. The SQLite history means all
  research is automatically logged and searchable. Claude could direct the user
  to use llm for parallel research streams.
- **Confidence:** HIGH

### Firecrawl CLI (also listed in Category 3)

- **What:** Web data API for AI -- turns websites into LLM-ready
  markdown/structured data
- **URL:** https://github.com/firecrawl/cli
- **Install:** `npm install -g firecrawl-cli`
- **Stars/Activity:** Core: 96.8k stars; CLI: 203 stars; very actively
  maintained
- **Windows:** Yes (npm)
- **Output format:** Markdown, HTML, JSON, screenshots, structured schemas
- **Beyond curl:** Purpose-built for AI/LLM research workflows. Natural language
  extraction prompts. MCP server available for Claude Code integration.
- **Workflow fit:** See Category 3 entry. The strongest web-to-structured-data
  tool for AI research pipelines.
- **Confidence:** HIGH

---

## Top Recommendations for This User's Workflow

### Tier 1: Install Now (high-impact, easy setup, excellent Windows support)

| Tool      | Category          | Why                                                                    |
| --------- | ----------------- | ---------------------------------------------------------------------- |
| **jq**    | JSON processing   | Universal standard. Everything produces JSON; jq queries it.           |
| **xh**    | HTTP client       | Fast, single binary, HTTPie syntax. Better than raw curl for API work. |
| **yq**    | Multi-format data | YAML/JSON/XML/CSV in one tool. Essential for config files.             |
| **hurl**  | API testing       | Declarative API test files. Version-controllable. JSON output.         |
| **htmlq** | HTML parsing      | `curl URL \| htmlq '.selector' --text` for quick scraping.             |
| **gron**  | JSON exploration  | Makes unknown JSON instantly greppable. Pairs with jq.                 |

### Tier 2: Install When Needed (powerful but specialized)

| Tool              | Category          | Why                                                                 |
| ----------------- | ----------------- | ------------------------------------------------------------------- |
| **firecrawl-cli** | Web scraping/AI   | Most powerful scraping tool. Needs API key. MCP integration.        |
| **miller**        | Data processing   | When CSV/TSV data needs analysis. Replaces awk for structured data. |
| **jc**            | Output conversion | Turns any CLI output into JSON. Bridges text tools to jq.           |
| **aria2**         | Downloads         | When downloading large files or many files in parallel.             |
| **llm**           | LLM research      | When you need to pipe data through LLMs outside Claude Code.        |
| **shot-scraper**  | JS-heavy scraping | When curl cannot reach JS-rendered content.                         |

### Tier 3: Nice to Have (user preference)

| Tool         | Category        | Why                                                            |
| ------------ | --------------- | -------------------------------------------------------------- |
| **fx**       | JSON viewer     | Interactive JSON exploration (user-facing, not Claude-driven). |
| **posting**  | API testing TUI | Postman-in-terminal experience (user-facing).                  |
| **monolith** | Web archiving   | Save complete pages as single files for offline research.      |
| **curlie**   | HTTP client     | Only if user prefers curl compatibility over xh.               |
| **dasel**    | Data processing | Only if user wants one tool instead of jq+yq.                  |

### Not Recommended

| Tool        | Why                                                                       |
| ----------- | ------------------------------------------------------------------------- |
| **googler** | Archived since 2022. Claude Code's WebSearch replaces this.               |
| **wget2**   | Poor Windows support. aria2 is better for downloads.                      |
| **jless**   | No Windows support. fx is the alternative.                                |
| **katana**  | Security-focused, weak Windows support. Firecrawl is better for research. |

---

## Claude Code Integration Patterns

### Pattern 1: API Research Pipeline

```bash
# Fetch API data, process with jq, explore with gron
xh GET https://api.example.com/data | jq '.results' > data.json
gron data.json | grep "name"  # Find where names live
gron data.json | grep "name" | gron --ungron | jq  # Extract just names as JSON
```

### Pattern 2: Web Scraping Pipeline

```bash
# Scrape a page, extract structured data
curl -s https://example.com | htmlq '.article-title' --text
# Or with firecrawl for JS-heavy sites
firecrawl scrape https://example.com --format markdown
```

### Pattern 3: Multi-format Config Processing

```bash
# Query YAML config
yq '.services.web.ports' docker-compose.yml
# Convert between formats
yq -o=json '.rules' firestore.rules > rules.json
```

### Pattern 4: CLI Output to Structured Data

```bash
# Turn any command output into JSON for analysis
git log --oneline -20 | jc --git-log | jq '.[].message'
```

### Pattern 5: Bulk Research with LLM

```bash
# Scrape multiple sources, summarize with LLM
for url in url1 url2 url3; do
  firecrawl scrape "$url" --format markdown >> research.md
done
cat research.md | llm "summarize the key findings across these sources"
```

---

## Methodology Notes

- 12 WebSearch queries across all categories
- 16 WebFetch calls to GitHub repos for precise star counts, install methods,
  and feature verification
- All star counts and release dates verified directly from GitHub as of
  2026-03-23
- Windows compatibility verified from official installation documentation
- Confidence ratings based on: maintenance activity, Windows support, structured
  output capability, and relevance to user's CLI+AI research workflow
