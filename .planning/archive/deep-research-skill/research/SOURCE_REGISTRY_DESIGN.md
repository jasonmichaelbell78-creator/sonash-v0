# Source Registry & Selection Intelligence

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Status:** RESEARCH COMPLETE
**Author:** Claude (research agent, source registry design task)
<!-- prettier-ignore-end -->

---

## Executive Summary

A deep-research skill needs more than "use WebSearch." It needs a complete model
of every information channel available, structured metadata about what each
source is good for, and an algorithm that selects the right combination of
sources for each research question. This document inventories every source
available in the current environment, defines a metadata schema for describing
sources, and designs a selection algorithm that routes research queries to the
optimal source combination.

**Key design principles:**

1. **Sources are typed, not generic.** A library documentation lookup is a
   fundamentally different operation from a web search for community patterns.
   The registry must capture this distinction.
2. **Selection is domain-driven.** A question about React 19 API should route
   through Context7 first; a question about industry trends should route through
   WebSearch first. The domain of the query determines the source priority
   order.
3. **Fallback chains prevent dead ends.** If Context7 has no entry for a
   library, the system falls back to WebFetch on official docs, then WebSearch.
   Failures are expected and planned for.
4. **Parallel access where possible.** Independent sources can be queried
   simultaneously. The system should distinguish parallel-safe sources from
   sequential-dependency sources.
5. **Confidence flows from sources.** A finding supported by Context7 official
   docs starts at HIGH confidence. A finding from a single WebSearch result
   starts at LOW. The source metadata directly informs the confidence scoring
   framework defined in SOURCE_VERIFICATION.md.

---

## Complete Source Inventory

### Native Claude Code Tools

#### WebSearch

- **Access method:** `WebSearch` tool with `query` parameter
- **What it searches:** Live web via search engine (similar to Google search).
  Returns result summaries with titles, URLs, and content excerpts.
- **Coverage:** Broad internet coverage. News, blogs, documentation sites,
  forums, social media, academic papers (abstracts), government sites.
- **Limitations:**
  - Results are summaries, not full page content (use WebFetch for full text)
  - Quality varies enormously --- blog spam sits alongside authoritative docs
  - No control over result ranking beyond query phrasing
  - Supports `allowed_domains` and `blocked_domains` filters for scoping
  - Only available in the US (per tool documentation)
  - Cannot search paywalled content
- **Best for:** Ecosystem discovery, finding what exists, community sentiment,
  recent news, identifying URLs to fetch in full
- **Not good for:** Authoritative API reference (use Context7), deep reading of
  specific pages (use WebFetch), local project information (use Grep/Read)

#### WebFetch

- **Access method:** `WebFetch` tool with `url` and `prompt` parameters
- **What it does:** Fetches a specific URL, converts HTML to markdown, processes
  content with a small model using the provided prompt, and returns extracted
  information.
- **Content types:** HTML pages (converted to markdown). Works with
  documentation sites, blog posts, GitHub pages, release notes.
- **Limitations:**
  - Will fail for authenticated/private URLs (Google Docs, Confluence, Jira)
  - Content may be summarized if very large
  - HTTP auto-upgraded to HTTPS
  - 15-minute cache (good for repeated access, bad for real-time data)
  - Domain restrictions in this project: only `github.com`, `alexop.dev`,
    `gist.github.com` are pre-approved; other domains require permission
  - Redirects require manual follow-up with the redirect URL
- **Best for:** Reading official documentation pages, release notes, GitHub
  READMEs, specific blog posts identified via WebSearch
- **Not good for:** Searching (use WebSearch first to find URLs), authenticated
  content, very large pages

#### Read

- **Access method:** `Read` tool with `file_path` parameter
- **What it reads:** Local filesystem files. Supports text files, images (PNG,
  JPG --- multimodal), PDFs (with `pages` parameter, max 20 pages/request),
  Jupyter notebooks (.ipynb).
- **Coverage:** Entire local filesystem accessible to the Claude Code process
- **Limitations:**
  - Cannot read directories (use `ls` via Bash)
  - Large PDFs require page ranges
  - Default limit of 2000 lines; use `offset`/`limit` for larger files
- **Best for:** Reading project source code, documentation, configuration files,
  planning artifacts, PDF research papers saved locally, screenshots
- **Not good for:** Remote content (use WebFetch), searching for content (use
  Grep), finding files by name (use Glob)

#### Grep

- **Access method:** `Grep` tool with `pattern` and optional
  `path`/`glob`/`type`
- **What it does:** Ripgrep-based content search across files. Full regex
  support. Output modes: content (matching lines), files_with_matches (paths
  only), count.
- **Coverage:** All files in the specified path, filterable by glob or file type
- **Best for:** Finding code patterns, searching documentation, locating
  configuration values, finding references to specific terms across a codebase
- **Not good for:** Semantic search (only literal/regex matching), remote
  content

#### Glob

- **Access method:** `Glob` tool with `pattern` parameter
- **What it does:** Fast file pattern matching. Returns file paths sorted by
  modification time.
- **Coverage:** Local filesystem within specified directory
- **Best for:** Finding files by name pattern, discovering file structure,
  locating configuration files
- **Not good for:** Content search (use Grep), reading file contents (use Read)

#### Bash

- **Access method:** `Bash` tool with `command` parameter
- **What it does:** Executes shell commands. Working directory persists between
  calls. Shell state does not persist.
- **Coverage:** Any command-line operation the environment supports
- **Pre-approved commands in this project:** `git`, `npm`, `npx`, `node`,
  `bash`, `python3`, `ls`, `mkdir`, `rm`, `cp`, `cat`, `grep`, `find`, `wc`,
  `echo`, `gh`, `sort`, `diff`, `head`, `tail`, `jq`
- **Data access via Bash:**
  - `git log/blame/diff` --- project history, authorship, changes
  - `gh pr/issue/api/run/search` --- GitHub platform data
  - `npm view/audit/outdated/ls` --- package metadata, vulnerabilities
  - `node -e` --- JavaScript execution for data processing
  - `python3 -c` --- Python execution for data processing
  - `curl` --- not pre-approved but may be requestable for HTTP access
- **Best for:** Structured data extraction, running project scripts, accessing
  git history, GitHub API queries, package ecosystem data
- **Not good for:** Interactive commands, commands requiring stdin input

---

### MCP Servers

#### SonarCloud MCP (Project-Local)

- **Configuration:** Defined in `.mcp.json`, runs
  `scripts/mcp/sonarcloud-server.js`
- **Authentication:** `SONAR_TOKEN` environment variable
- **Project key:** `jasonmichaelbell78-creator_sonash-v0`
- **Tools exposed:**
  - `mcp__sonarcloud__get_issues` --- Code issues (bugs, vulnerabilities, code
    smells) filtered by project, PR, severity, type
  - `mcp__sonarcloud__get_quality_gate` --- Quality gate pass/fail status for
    project or PR
  - `mcp__sonarcloud__get_security_hotspots` --- Security hotspots with file
    paths, line numbers, descriptions, filtered by status
  - `mcp__sonarcloud__get_hotspot_details` --- Detailed info about a specific
    security hotspot including code context
- **Data accessible:** Static analysis results, code quality metrics, security
  vulnerability findings, quality gate status for PRs and the main branch
- **Best for:** Code quality research, security vulnerability analysis,
  understanding technical debt in the SoNash codebase
- **Not good for:** General research (project-specific only), real-time data

#### Memory MCP (Project-Local)

- **Configuration:** Defined in `.mcp.json`, runs
  `@modelcontextprotocol/server-memory` via npx
- **Authentication:** None required
- **Tools exposed:** Standard MCP memory tools for storing and retrieving
  key-value data across sessions
- **Data accessible:** Persistent key-value memory store
- **Best for:** Storing research state across compaction boundaries, caching
  intermediate findings, tracking research progress
- **Not good for:** Searching external information, querying structured data

#### Context7 MCP (Plugin-Provided)

- **Configuration:** Auto-discovered via `context7@claude-plugins-official`
  plugin
- **Authentication:** `CONTEXT7_API_KEY` environment variable
- **Tools exposed:**
  - `mcp__context7__resolve-library-id` --- Resolves a library name to a
    Context7 library ID
  - `mcp__context7__get-library-docs` (or `query-docs`) --- Retrieves
    documentation for a specific library given its resolved ID and a query
- **Data accessible:** Authoritative, current documentation for major libraries
  and frameworks. API references, configuration options, code examples,
  getting-started guides, version-specific information.
- **Coverage notes:** Major libraries well-covered. Niche or very new packages
  may not be indexed. The GSD agents document that Context7 may not have entries
  for some libraries --- always resolve first before assuming availability.
- **Best for:** Library API reference, framework feature documentation,
  version-specific capabilities, code examples with official attribution
- **Not good for:** Opinions, comparisons, community patterns, architectural
  decisions, anything beyond official library documentation

#### Gmail MCP (Google Integration)

- **Configuration:** Auto-discovered via Claude AI Google integration
- **Tools exposed:**
  - `mcp__claude_ai_Gmail__gmail_search_messages` --- Search emails
  - `mcp__claude_ai_Gmail__gmail_read_message` --- Read specific message
  - `mcp__claude_ai_Gmail__gmail_read_thread` --- Read email thread
  - `mcp__claude_ai_Gmail__gmail_create_draft` --- Create email draft
  - `mcp__claude_ai_Gmail__gmail_list_drafts` --- List drafts
  - `mcp__claude_ai_Gmail__gmail_list_labels` --- List labels
  - `mcp__claude_ai_Gmail__gmail_get_profile` --- Get profile info
- **Data accessible:** User's Gmail inbox, threads, drafts
- **Best for:** Searching for research-relevant emails, finding correspondence
  about technologies or decisions, locating shared links or documents referenced
  in email
- **Not good for:** General research (personal data only)

#### Google Calendar MCP (Google Integration)

- **Configuration:** Auto-discovered via Claude AI Google integration
- **Tools exposed:**
  - `mcp__claude_ai_Google_Calendar__gcal_list_events` --- List calendar events
  - `mcp__claude_ai_Google_Calendar__gcal_get_event` --- Get event details
  - `mcp__claude_ai_Google_Calendar__gcal_create_event` --- Create event
  - `mcp__claude_ai_Google_Calendar__gcal_find_meeting_times` --- Find available
    times
  - `mcp__claude_ai_Google_Calendar__gcal_find_my_free_time` --- Find free time
  - Others: update, delete, respond, list calendars
- **Data accessible:** User's Google Calendar events and availability
- **Research relevance:** Minimal. Could be used to find meetings where
  technology decisions were discussed, or to schedule research reviews.
- **Best for:** Scheduling, finding past meeting context
- **Not good for:** Any form of information research

---

### Project-Specific Data Sources

#### Git History

- **Access method:** `git log`, `git blame`, `git diff`, `git show` via Bash
- **Data accessible:**
  - Full commit history with messages, authors, dates
  - File change history (when files were added, modified, deleted)
  - Blame information (who wrote each line and when)
  - Diff between any two points in history
  - Branch structure and merge history
  - Tag/release information
- **Best for:** Understanding project evolution, finding when decisions were
  made, tracing bug introductions, understanding code ownership
- **Not good for:** External research, current state of files (use Read)

#### GitHub Platform (via `gh` CLI)

- **Access method:** `gh` CLI commands via Bash
- **Repository:** `jasonmichaelbell78-creator/sonash-v0`
- **Data accessible:**
  - **Issues:** `gh issue list/view` --- bug reports, feature requests,
    discussions
  - **Pull Requests:** `gh pr list/view/diff/checks` --- code changes, review
    comments, CI status
  - **Actions/CI:** `gh run list/view` --- workflow runs, build status, test
    results
  - **Releases:** `gh release list/view` --- version history, changelogs
  - **API:** `gh api` --- raw GitHub REST/GraphQL API access for any data
  - **Search:** `gh search repos/issues/prs/code` --- cross-repo search
- **Best for:** Project management context, understanding decisions captured in
  PRs, CI/CD status, finding related issues across repos
- **Not good for:** Deep code analysis (use Read/Grep), general web research

#### npm Ecosystem

- **Access method:** `npm view/audit/outdated/ls/list` via Bash
- **Data accessible:**
  - `npm view <pkg>` --- package metadata, versions, dependencies, homepage,
    repository, license, maintainers, publish dates
  - `npm audit` --- known security vulnerabilities in dependencies
  - `npm outdated` --- packages with newer versions available
  - `npm ls` --- dependency tree showing all installed packages
  - `npx <tool>` --- run any npm-published tool on demand
- **Best for:** Package evaluation, dependency analysis, security vulnerability
  research, version compatibility checking
- **Not good for:** Qualitative assessment (use WebSearch for community reviews)

#### TDMS (Technical Debt Management System)

- **Access method:** Scripts in `scripts/debt/` via `npm run tdms:*`
- **Data accessible:**
  - `MASTER_DEBT.jsonl` --- all tracked technical debt items with IDs,
    categories, severity, status
  - `npm run tdms:metrics` --- debt metrics and trends
  - `npm run tdms:views` --- filtered views of debt by category/severity
- **Best for:** Understanding project technical debt landscape, prioritizing
  improvements, research into what's been deferred and why
- **Not good for:** External research

#### Project Documentation

- **Access method:** Read tool on files in `docs/`, `.planning/`, `.claude/`
- **Key sources:**
  - `ROADMAP.md` --- planned features, completed work, project vision
  - `SESSION_CONTEXT.md` --- current sprint, recent decisions
  - `docs/agent_docs/` --- 10 agent reference documents (security, patterns,
    testing, orchestration, etc.)
  - `.planning/` --- planning artifacts, research files, phase plans
  - `.claude/state/` --- JSONL state files (reviews, alerts, audit history,
    health scores, session logs)
  - `docs/AI_REVIEW_LEARNINGS_LOG.md` --- accumulated review learnings
- **Best for:** Project-internal research, understanding existing decisions and
  patterns, finding prior art within the project
- **Not good for:** External research, current industry practices

#### Project Health Scripts

- **Access method:** Various `npm run` commands via Bash
- **Key scripts:**
  - `npm run patterns:check` --- code pattern compliance (180+ patterns)
  - `npm run cc:check` --- cyclomatic complexity analysis
  - `npm run security:check` --- security audit
  - `npm run docs:check` --- documentation health
  - `npm run hooks:health` --- hook system health
  - `npm run ecosystem-audit` --- comprehensive ecosystem analysis
  - `npm run learning:analyze` --- learning effectiveness metrics
  - `npm run review:churn` --- review churn tracking
- **Best for:** Quantitative assessment of project health, finding areas needing
  attention, generating structured data about code quality
- **Not good for:** External research, qualitative analysis

---

### External Sources via Bash

#### Python (Available via `python3`)

- **Access method:** `python3 -c "..."` or `python3 script.py` via Bash
- **Capabilities:** Data processing, CSV/JSON parsing, mathematical computation,
  text analysis. Libraries depend on what's installed.
- **Best for:** Complex data transformation, statistical analysis of research
  data, parsing structured data formats
- **Not good for:** Web access (use WebSearch/WebFetch), heavy computation

#### Node.js (Available via `node`)

- **Access method:** `node -e "..."` or `node script.js` via Bash
- **Capabilities:** JavaScript execution, JSON processing, file manipulation,
  npm package access
- **Best for:** Processing JSON data, running project-specific scripts,
  evaluating JavaScript expressions, data transformation
- **Not good for:** Direct web access without explicit HTTP libraries

#### jq (Available)

- **Access method:** `jq` via Bash
- **Capabilities:** JSON processing and transformation
- **Best for:** Extracting specific fields from JSON API responses, filtering
  and transforming structured data
- **Not good for:** Anything beyond JSON processing

---

## Source Metadata Schema

### Schema Definition

```json
{
  "source_id": "string (unique identifier, lowercase-hyphenated)",
  "name": "string (human-readable display name)",
  "type": "enum: native_tool | mcp_server | cli_tool | project_data | external_api",
  "access_method": "string (tool name or command pattern)",
  "access_parameters": {
    "required": ["array of required parameter names"],
    "optional": ["array of optional parameter names"],
    "example": "string showing typical invocation"
  },
  "domains": ["array of research domains this source serves"],
  "good_for": ["array of query types this source excels at"],
  "not_good_for": ["array of query types to avoid with this source"],
  "confidence_baseline": "enum: HIGH | MEDIUM | LOW",
  "confidence_notes": "string explaining why this baseline",
  "freshness": "enum: real-time | current | periodic | static | historical",
  "freshness_notes": "string explaining data currency",
  "latency": "enum: instant | fast (<5s) | moderate (5-30s) | slow (>30s)",
  "cost": "enum: free | low | moderate | high",
  "cost_notes": "string (e.g., 'counts against API rate limit')",
  "requires_auth": "boolean",
  "auth_method": "string | null",
  "rate_limited": "boolean",
  "rate_limit_notes": "string | null",
  "scope": "enum: global | project | personal",
  "output_format": "enum: text | json | markdown | html | mixed",
  "can_parallel": "boolean (safe to query in parallel with other sources)",
  "fallback_chain": ["array of source_ids to try if this source fails"],
  "prerequisites": ["array of source_ids that must be queried first"],
  "coverage_notes": "string describing coverage boundaries",
  "failure_modes": ["array of known failure scenarios"],
  "last_verified": "ISO date string (when this registry entry was last verified)"
}
```

### Schema Field Rationale

| Field                       | Why the Selector Needs It                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| `domains`                   | Maps query domain to candidate sources                                                        |
| `good_for` / `not_good_for` | Positive and negative matching for query intent                                               |
| `confidence_baseline`       | Sets the starting confidence for findings from this source                                    |
| `freshness`                 | Determines temporal appropriateness for time-sensitive queries                                |
| `latency`                   | Informs parallel vs sequential scheduling                                                     |
| `can_parallel`              | Whether this source can be queried simultaneously with others                                 |
| `fallback_chain`            | What to try when this source fails or returns nothing                                         |
| `prerequisites`             | Sources that must be consulted first (e.g., resolve library ID before querying Context7 docs) |
| `scope`                     | Distinguishes global knowledge sources from project-specific ones                             |
| `failure_modes`             | Enables proactive error handling                                                              |

---

## Source Selection Algorithm

### Phase 1: Query Analysis

Before selecting sources, the system must classify the query along several
dimensions:

```
INPUT: research_question (string)
OUTPUT: {
  domain:          enum [technology, architecture, security, ecosystem,
                        business, academic, project-internal, mixed],
  intent:          enum [factual-lookup, comparison, how-to, state-of-art,
                        opinion-survey, historical, evaluation, debugging],
  scope:           enum [specific (single library/tool),
                        categorical (class of solutions),
                        broad (entire domain)],
  temporal_need:   enum [current-only, recent (last 2 years),
                        historical, timeless],
  depth:           enum [surface, moderate, deep, exhaustive],
  project_relevant: boolean
}
```

### Phase 2: Candidate Source Filtering

Given the query classification, filter the registry to candidate sources:

```
candidates = registry.filter(source =>
  source.domains.intersects(query.domain) AND
  source.good_for.matches(query.intent) AND
  NOT source.not_good_for.matches(query.intent) AND
  source.freshness >= query.temporal_need AND
  source.scope matches query.project_relevant
)
```

### Phase 3: Priority Ordering

Candidate sources are ordered by a priority score computed from:

```
priority_score = (
  confidence_baseline_weight(source) * 0.35 +
  domain_specificity(source, query) * 0.25 +
  freshness_match(source, query) * 0.20 +
  latency_efficiency(source) * 0.10 +
  historical_success_rate(source, similar_queries) * 0.10
)
```

Where:

- **confidence_baseline_weight:** HIGH=1.0, MEDIUM=0.6, LOW=0.3
- **domain_specificity:** How specialized this source is for the query domain
  (Context7 is highly specific for library docs; WebSearch is generic)
- **freshness_match:** How well the source's freshness matches the query's
  temporal needs
- **latency_efficiency:** Faster sources score higher for surface queries;
  latency matters less for deep research
- **historical_success_rate:** If the system tracks which sources produced
  useful findings for similar past queries, this improves over time

### Phase 4: Source Plan Generation

The priority-ordered candidates are assembled into a source plan:

```
source_plan = {
  required:  [top N sources by priority where domain_specificity > threshold],
  optional:  [next M sources that could add value],
  parallel_groups: [
    [sources that can run simultaneously],
    [sources that depend on prior results]
  ],
  fallback_chains: {
    source_id: [ordered list of alternatives if source fails]
  },
  max_sources: computed from query.depth (surface=2, moderate=4, deep=6, exhaustive=all),
  cross_verification_minimum: 2 for factual claims, 1 for opinions
}
```

### Domain-Specific Source Priority Templates

These templates encode the default priority ordering for common research
domains:

#### Technology / Library Research

```
1. Context7           — authoritative library docs (if library is indexed)
2. WebFetch           — official documentation site, GitHub README, changelog
3. npm view           — package metadata, versions, dependencies
4. WebSearch          — community patterns, tutorials, comparison articles
5. GitHub (gh search) — code examples in real projects, issue discussions
6. npm audit          — security vulnerability data
```

#### Architecture / Design Patterns

```
1. WebSearch          — pattern catalogs, architecture articles, conference talks
2. WebFetch           — specific architecture documentation pages
3. Context7           — framework-specific architectural guidance
4. Project docs       — existing architecture decisions in this project
5. Git history        — how the project evolved architecturally
```

#### Security Research

```
1. SonarCloud MCP     — project-specific vulnerability data
2. npm audit          — dependency vulnerability data
3. WebSearch          — CVE databases, security advisories, OWASP references
4. WebFetch           — specific advisory pages, vendor security bulletins
5. Project patterns   — npm run patterns:check, security:check
6. GitHub Actions     — CI security scan results
```

#### Project-Internal Research

```
1. Grep/Read          — codebase search and file reading
2. Git history        — commit history, blame, change tracking
3. Project docs       — ROADMAP.md, SESSION_CONTEXT.md, planning artifacts
4. TDMS              — technical debt items and their status
5. State files        — .claude/state/ JSONL files for metrics and history
6. Health scripts     — npm run alerts, ecosystem-health, patterns:check
7. SonarCloud MCP     — static analysis findings
8. GitHub PRs/Issues  — discussion context, review comments
```

#### Ecosystem / Market Research

```
1. WebSearch          — broad ecosystem surveys, market analysis
2. WebFetch           — specific vendor pages, comparison sites, reports
3. npm view           — package ecosystem data (download counts, dependencies)
4. GitHub (gh search) — repository activity, star counts, contributor counts
5. Context7           — documentation for specific tools being evaluated
```

---

## Source Combination Patterns

### When to Use One Source vs. Many

| Scenario                                                          | Source Count | Rationale                                                      |
| ----------------------------------------------------------------- | ------------ | -------------------------------------------------------------- |
| Simple factual lookup ("What is the React 19 useFormStatus API?") | 1 (Context7) | Single authoritative source is sufficient                      |
| Library comparison ("React vs Svelte for our use case")           | 3-5          | Need multiple perspectives + project context                   |
| Architecture decision                                             | 4-6          | Need patterns, anti-patterns, project history, community input |
| Security vulnerability assessment                                 | 3-4          | Need SonarCloud + npm audit + advisory databases               |
| State-of-the-art survey                                           | 5-8          | Need broad web search + multiple specific sources              |
| Project-internal investigation                                    | 2-4          | Codebase search + git history + documentation                  |

### Cross-Verification Patterns

**Minimum verification requirements by claim type:**

| Claim Type               | Min Independent Sources                  | Example                                                       |
| ------------------------ | ---------------------------------------- | ------------------------------------------------------------- |
| API behavior             | 1 authoritative (Context7/official docs) | "React 19 useTransition returns [isPending, startTransition]" |
| Best practice            | 2 independent                            | "Use server components for data fetching"                     |
| Performance claim        | 2 + benchmark data                       | "Next.js 16 is 40% faster than 15"                            |
| Security claim           | 2 + authoritative source                 | "CVE-2025-XXXX affects firebase <12.5"                        |
| Market/adoption claim    | 3 independent                            | "React is used by 65% of web developers"                      |
| Causal/explanatory claim | 3 + primary source                       | "React Server Components reduce bundle size because..."       |

### Complementary Source Patterns

Sources are complementary when they provide different types of information about
the same topic:

| Pattern                 | Sources                               | What Each Provides                                             |
| ----------------------- | ------------------------------------- | -------------------------------------------------------------- |
| **API + Community**     | Context7 + WebSearch                  | Official API reference + real-world usage patterns and gotchas |
| **Code + History**      | Grep + Git blame                      | Current implementation + why it was written that way           |
| **Metrics + Context**   | SonarCloud + GitHub PRs               | Quality metrics + discussion about tradeoffs                   |
| **Package + Ecosystem** | npm view + WebSearch                  | Package metadata + community reputation and alternatives       |
| **Docs + Practice**     | Read (project docs) + Grep (codebase) | Documented intent + actual implementation                      |

### Contradictory Source Handling

When sources contradict each other, the system follows the resolution protocol
from SOURCE_VERIFICATION.md Section 4:

1. **Detect** --- identify the specific contradiction
2. **Classify** --- determine the type (factual disagreement, different time
   periods, different scopes, opinion vs fact)
3. **Apply authority weighting** --- higher-authority sources take precedence
   when the authority gap is clear
4. **Present both sides** --- for conflicts between comparable-authority
   sources, surface both with evidence basis
5. **Reduce confidence** --- any contradicted claim drops to LOW confidence
   minimum, regardless of how authoritative one source is

---

## Dynamic Source Discovery

### Handling Unknown Source Needs

The registry is not exhaustive. Research questions may need sources not yet in
the registry. The system should handle this through:

**1. Gap Detection**

During research, if the current source plan produces insufficient results (fewer
than `cross_verification_minimum` findings), the system should:

- Re-analyze the query to identify what type of source is missing
- Check if any unused registry sources could help
- Attempt WebSearch to discover new source types (databases, APIs, tools)
- Report the gap explicitly: "Insufficient data from available sources. The
  following would improve results: [specific source type needed]"

**2. Runtime Source Discovery**

The system can discover new sources during research through:

- **WebSearch meta-queries:** "Where to find data about [topic]" or "[topic]
  database" or "[topic] API"
- **npm package discovery:** `npm search [topic]` to find CLI tools that provide
  data access
- **GitHub discovery:** `gh search repos [topic] tool` to find data-generating
  tools
- **Documentation link following:** WebFetch on a found page may reveal links to
  more authoritative sources

**3. User-Provided Sources**

The system must accept and integrate user-specified sources:

- **"Check this URL"** --- add as a one-time WebFetch source with user-provided
  authority assessment
- **"Look at this repo"** --- clone or browse via `gh` and treat as a project
  data source
- **"Search this database"** --- if accessible via HTTP, add as a WebFetch
  target
- **"Use this API"** --- if accessible via curl/node, add as a Bash-mediated
  source

User-provided sources should be treated as MEDIUM confidence baseline (the user
considered them relevant, but they haven't been authority-assessed by the
system).

### Source Freshness and Reliability

**Staleness detection:**

| Source       | Staleness Signal                                     | Action                                          |
| ------------ | ---------------------------------------------------- | ----------------------------------------------- |
| Context7     | Library has a newer major version than docs cover    | Fall back to WebFetch on official changelog     |
| WebSearch    | Top results are >2 years old for a fast-moving topic | Add current year to query, try again            |
| npm view     | Package marked deprecated                            | Flag to user, search for replacement            |
| SonarCloud   | Last analysis date is old                            | Note in findings, suggest re-run                |
| Project docs | Doc header `Last Updated` is >6 months old           | Cross-check with git log for actual last change |
| WebFetch     | Page returns 404 or redirect                         | Try Wayback Machine URL or alternative source   |

**Bad data detection:**

- If a source returns results that contradict 2+ other sources, flag the source
  as potentially unreliable for this query
- If a WebSearch result leads to a page that WebFetch reveals is satire,
  opinion, or promotional content, downgrade all findings from that page to LOW
  confidence
- If Context7 returns documentation for a different version than the project
  uses, note the version mismatch and reduce confidence to MEDIUM

**Reliability tracking over time:**

The system should maintain a lightweight reliability log:

```json
{
  "source_id": "websearch",
  "query_count": 150,
  "useful_result_count": 120,
  "contradiction_count": 8,
  "failure_count": 5,
  "effective_rate": 0.8,
  "last_updated": "2026-03-20"
}
```

This enables the selection algorithm's `historical_success_rate` factor to
improve source selection over time.

---

## Industry Approaches

### Perplexity AI Source Selection

Perplexity AI maintains a curated pool of trusted sources and selects from this
collection when generating answers. Its selection is based on four evaluation
criteria: **credibility** (publisher authority and expertise), **recency**
(content freshness), **relevance** (direct match to user queries), and
**clarity** (structured, easily extractable content). The system crawls the live
web during each query rather than relying on cached indexes, and shifts source
emphasis based on query type --- current events route to news agencies and
official announcements; background knowledge routes to academic references and
documentation.

**Applicable insight for our system:** The four-criteria model (credibility,
recency, relevance, clarity) is a good foundation for source ranking within a
priority tier. Our system adds a fifth criterion: **verifiability** (can
findings from this source be cross-checked with another independent source?).

### Adaptive RAG (Self-Routing RAG)

The Self-Routing RAG framework (Wu et al., 2025, arXiv:2504.01018) treats the
LLM itself as a knowledge source alongside external retrieval. It learns to
select an appropriate knowledge source, optionally verbalize parametric
knowledge, and answer using the selected source, all within a single generation
pass. SR-RAG outperforms selective retrieval baselines by 2-8% while performing
21-40% fewer retrievals.

**Applicable insight for our system:** The principle of treating the model's own
knowledge as a source (with appropriate confidence weighting) is valuable. For
well-established, timeless facts (e.g., "HTTP status 404 means not found"),
retrieval adds latency without value. The source selection algorithm should
include a "parametric knowledge" source with LOW confidence baseline that can be
elevated to MEDIUM if the claim is common knowledge in the model's training
domain.

### Enterprise RAG as Knowledge Runtime

Industry analyses of enterprise RAG systems (2026) describe the evolution toward
treating RAG as a "knowledge runtime" --- an orchestration layer that manages
retrieval, verification, reasoning, access control, and audit trails as
integrated operations. This aligns with our registry-plus-selector architecture
where the source registry is the knowledge inventory and the selection algorithm
is the orchestration layer.

### OSINT Source Hierarchy Management

Intelligence analysis uses a structured source hierarchy with six categories of
information flow (media, internet, government, professional/academic,
commercial, grey literature). The intelligence cycle includes preparation
(assessing needs and identifying best sources), collection, processing, and
analysis. Key practices:

- **Collection management:** Aligning collection efforts to avoid duplication
- **Source evaluation:** Cross-referencing across multiple source types
- **Tiered confidence:** Primary intelligence sources vs secondary reporting vs
  open source

**Applicable insight:** The tiered source hierarchy with explicit confidence
assignment per tier maps directly to our source_hierarchy pattern already used
in the GSD research agents.

### AI Agent Tool Selection (LangGraph, AutoGen, Google ADK)

Modern AI agent frameworks handle tool/source selection through:

- **LangGraph:** Graph-based state machines with conditional routing. Nodes
  represent actions, edges represent decision logic, enabling parallel execution
  and persistent state.
- **AutoGen:** Adaptive units with flexible routing and asynchronous
  communication. Agents can dynamically select which tools to use.
- **Google ADK:** Workflow agents (Sequential, Parallel, Loop) for predictable
  pipelines, plus LLM-driven dynamic routing for adaptive behavior.

**Applicable insight:** The distinction between **predictable routing**
(domain-specific templates with known source priorities) and **dynamic routing**
(LLM-driven selection when the domain is ambiguous or novel) should be built
into our system. Default to template routing for known domains; fall back to
dynamic routing when query analysis produces a `mixed` domain classification.

---

## Design Recommendations

### R1: Registry as a JSON Configuration File

Implement the source registry as a JSON file (e.g.,
`.claude/config/source-registry.json`) that can be version-controlled,
validated, and updated without code changes. Each source entry follows the
schema defined in this document. This enables:

- Validation via `npm run config:validate`
- Diffable changes when sources are added or modified
- Consumption by the selection algorithm at runtime
- Testing of selection logic against known registry states

### R2: Domain-Specific Template Library

Pre-define source priority templates for the 5 most common research domains
(technology, architecture, security, project-internal, ecosystem). These
templates are the fast path --- when query analysis maps cleanly to a known
domain, the system uses the template without running the full scoring algorithm.

### R3: Two-Phase Selection (Template + Scoring)

```
if query.domain in TEMPLATE_LIBRARY:
    source_plan = TEMPLATE_LIBRARY[query.domain]
    adjust for query specifics (scope, depth, temporal need)
else:
    source_plan = full_scoring_algorithm(query, registry)
```

This gives fast, predictable routing for common cases and flexible, intelligent
routing for novel cases.

### R4: Source Plan as a First-Class Artifact

Before executing any research, the system should produce a source plan document
that lists which sources will be consulted and why. This plan:

- Enables the user to add or remove sources before research begins
- Creates an audit trail for the research methodology
- Can be referenced during verification to ensure all planned sources were
  actually consulted

### R5: Failure-Aware Execution

Every source access should be wrapped in error handling that:

- Logs the failure (source, query, error type)
- Triggers the fallback chain automatically
- Adjusts the source plan in real-time
- Reports failures in the final research output ("Context7 did not have an entry
  for this library; fell back to official docs via WebFetch")

### R6: Confidence Flows from Source Metadata

The confidence scoring system in SOURCE_VERIFICATION.md should consume the
`confidence_baseline` from the source registry rather than assigning confidence
ad-hoc. This creates a principled chain:

```
Source registry → confidence_baseline per source →
  Source selection → findings per source →
    Verification → cross-reference findings →
      Final confidence = f(source baselines, verification result, conflict status)
```

### R7: Progressive Source Expansion

For deep/exhaustive research, start with the `required` sources, analyze
results, then decide whether `optional` sources add value. This prevents
unnecessary source access for queries that are answered well by the first tier.

### R8: Integration with Existing GSD Source Hierarchy

The GSD agents (`gsd-project-researcher`, `gsd-phase-researcher`) already define
a 3-tier source hierarchy (Context7 > Official Docs > WebSearch). The source
registry should be a superset of this hierarchy, adding the project-specific and
MCP sources that the GSD agents do not currently use. When the deep-research
skill is invoked within a GSD pipeline, the registry should be filtered to match
the GSD agent's tool list.

---

## Source Inventory Table

The complete source inventory with metadata for the selection algorithm:

| Source ID        | Name                       | Type         | Confidence Baseline | Freshness  | Latency  | Scope    | Domains                      |
| ---------------- | -------------------------- | ------------ | ------------------- | ---------- | -------- | -------- | ---------------------------- |
| `context7`       | Context7 Library Docs      | mcp_server   | HIGH                | current    | fast     | global   | technology                   |
| `websearch`      | Web Search                 | native_tool  | LOW                 | real-time  | moderate | global   | all                          |
| `webfetch`       | Web Fetch (URL)            | native_tool  | MEDIUM              | real-time  | moderate | global   | all                          |
| `read-local`     | Local File Read            | native_tool  | HIGH                | static     | instant  | project  | project-internal             |
| `grep-local`     | Codebase Search            | native_tool  | HIGH                | static     | fast     | project  | project-internal             |
| `glob-local`     | File Pattern Match         | native_tool  | HIGH                | static     | instant  | project  | project-internal             |
| `sonarcloud`     | SonarCloud Analysis        | mcp_server   | HIGH                | periodic   | fast     | project  | security, technology         |
| `memory-mcp`     | Memory MCP Server          | mcp_server   | MEDIUM              | static     | instant  | project  | project-internal             |
| `gmail`          | Gmail Search               | mcp_server   | MEDIUM              | real-time  | fast     | personal | all                          |
| `gcal`           | Google Calendar            | mcp_server   | MEDIUM              | real-time  | fast     | personal | scheduling                   |
| `git-history`    | Git Log/Blame/Diff         | cli_tool     | HIGH                | current    | fast     | project  | project-internal             |
| `github-cli`     | GitHub API (gh)            | cli_tool     | HIGH                | real-time  | moderate | global   | technology, project-internal |
| `npm-view`       | npm Package Metadata       | cli_tool     | HIGH                | current    | fast     | global   | technology, ecosystem        |
| `npm-audit`      | npm Security Audit         | cli_tool     | HIGH                | current    | moderate | project  | security                     |
| `npm-outdated`   | npm Outdated Check         | cli_tool     | HIGH                | current    | fast     | project  | technology                   |
| `node-exec`      | Node.js Execution          | cli_tool     | HIGH                | n/a        | fast     | project  | data-processing              |
| `python-exec`    | Python Execution           | cli_tool     | HIGH                | n/a        | fast     | project  | data-processing              |
| `jq`             | JSON Processing            | cli_tool     | HIGH                | n/a        | instant  | project  | data-processing              |
| `project-docs`   | Project Documentation      | project_data | MEDIUM              | periodic   | instant  | project  | project-internal             |
| `project-state`  | State Files (JSONL)        | project_data | HIGH                | current    | instant  | project  | project-internal             |
| `tdms`           | Tech Debt System           | project_data | HIGH                | current    | fast     | project  | project-internal             |
| `health-scripts` | Health Check Scripts       | project_data | HIGH                | current    | moderate | project  | project-internal             |
| `parametric`     | Model Parametric Knowledge | special      | LOW                 | historical | instant  | global   | all                          |

### Fallback Chain Reference

| Primary Source | Fallback 1                     | Fallback 2            | Fallback 3                  |
| -------------- | ------------------------------ | --------------------- | --------------------------- |
| `context7`     | `webfetch` (official docs URL) | `websearch`           | `parametric`                |
| `webfetch`     | `websearch`                    | `parametric`          | (report gap)                |
| `websearch`    | `webfetch` (top result URLs)   | `github-cli` (search) | (report gap)                |
| `sonarcloud`   | `npm-audit`                    | `health-scripts`      | `websearch` (CVE databases) |
| `npm-view`     | `github-cli` (repo info)       | `websearch`           | `webfetch` (npmjs.com page) |
| `grep-local`   | `read-local` (specific files)  | `git-history`         | `project-docs`              |
| `github-cli`   | `webfetch` (github.com URL)    | `websearch`           | (report gap)                |

### Source-to-Domain Mapping Matrix

| Domain                             | Primary Sources                     | Secondary Sources                 | Tertiary Sources        |
| ---------------------------------- | ----------------------------------- | --------------------------------- | ----------------------- |
| **Technology (Library/Framework)** | context7, npm-view                  | webfetch, websearch               | github-cli, parametric  |
| **Architecture**                   | websearch, webfetch                 | context7, project-docs            | git-history, parametric |
| **Security**                       | sonarcloud, npm-audit               | websearch, health-scripts         | webfetch, github-cli    |
| **Project-Internal**               | grep-local, read-local, git-history | project-docs, tdms, project-state | github-cli, sonarcloud  |
| **Ecosystem/Market**               | websearch, npm-view                 | github-cli, webfetch              | context7, parametric    |
| **Academic**                       | websearch                           | webfetch                          | parametric              |
| **Business**                       | websearch, gmail                    | webfetch                          | parametric              |

---

## Sources

### RAG and Source Selection

- [Azure AI Search: Agentic Retrieval and RAG Pipeline](https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview)
- [Adaptive RAG Explained: What to Know in 2026](https://www.meilisearch.com/blog/adaptive-rag)
- [Self-Routing RAG: Binding Selective Retrieval with Knowledge Verbalization (arXiv 2504.01018)](https://arxiv.org/abs/2504.01018)
- [RAG in 2026: How Retrieval-Augmented Generation Works for Enterprise AI](https://www.techment.com/blogs/rag-in-2026/)
- [The Next Frontier of RAG: How Enterprise Knowledge Systems Will Evolve (2026-2030)](https://nstarxinc.com/blog/the-next-frontier-of-rag-how-enterprise-knowledge-systems-will-evolve-2026-2030/)

### Perplexity AI Source Selection

- [How Perplexity AI Selects Sources: Best Guide For 2026](https://www.trysight.ai/blog/how-perplexity-ai-selects-sources)
- [How Does Perplexity Work? (Perplexity Help Center)](https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work)
- [How Does Perplexity Choose and Rank Its Information Sources?](https://www.datastudios.org/post/how-does-perplexity-choose-and-rank-its-information-sources-algorithm-and-transparency)

### OSINT and Intelligence Analysis

- [The IC OSINT Strategy 2024-2026 (DNI)](https://www.dni.gov/files/ODNI/documents/IC_OSINT_Strategy.pdf)
- [How to use Open-Source Intelligence (OSINT) for Investigations](https://www.moodys.com/web/en/us/insights/compliance-tprm/open-source-intelligence-osint-types-tools-and-methods.html)
- [How to Use the OSINT Framework: Sources, Tools, & Steps](https://www.bitsight.com/learn/cti/osint-framework)

### AI Agent Routing and Tool Selection

- [AI Agent Routing: Tutorial & Best Practices (Patronus AI)](https://www.patronus.ai/ai-agent-development/ai-agent-routing)
- [Google Agent Development Kit (ADK)](https://developers.googleblog.com/en/agent-development-kit-easy-to-build-multi-agent-applications/)
- [Top 5 Open-Source Agentic AI Frameworks in 2026](https://aimultiple.com/agentic-frameworks)
- [The Complete Guide to Choosing an AI Agent Framework in 2025 (Langflow)](https://www.langflow.org/blog/the-complete-guide-to-choosing-an-ai-agent-framework-in-2025)
