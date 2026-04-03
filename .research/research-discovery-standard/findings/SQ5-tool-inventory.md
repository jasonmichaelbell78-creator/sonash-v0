# SQ5: Complete Tool Inventory

**Sub-question:** Complete tool inventory -- MCP servers, search tools, analysis
capabilities, and where each is underused.

**Confidence:** HIGH (verified against filesystem, tool schemas, and
configuration files)

**Sources:** `.mcp.json`, `.claude/settings.json`,
`.claude/settings.local.json`, `.claude/REQUIRED_PLUGINS.md`, `.claude/agents/`,
`.claude/teams/`, `.claude/skills/`, `scripts/`, tool schema introspection via
ToolSearch

---

## 1. Built-in Claude Code Tools

### 1.1 Read

- **What it does:** Reads files from the local filesystem. Supports text files,
  images (PNG, JPG -- multimodal), PDFs (with page ranges), and Jupyter
  notebooks. Returns content with line numbers.
- **Research use:** Primary tool for understanding file contents, reading
  configuration, examining code. The foundation of all codebase investigation.
- **Right choice when:** You know the specific file path and want its contents.
  Reading images/screenshots, PDFs, notebooks.
- **Limitations:** Cannot read directories (use `ls` via Bash). Max 2000 lines
  by default. Large PDFs require `pages` parameter. Must use absolute paths.
- **Underuse:** Rarely used for PDF analysis or image inspection in research
  workflows. The multimodal capability (reading screenshots/diagrams) is
  available but not systematically leveraged by research skills.

### 1.2 Grep

- **What it does:** Ripgrep-powered content search. Supports regex, glob
  filtering, file type filtering, multiline matching, context lines, and three
  output modes (content, files_with_matches, count).
- **Research use:** Finding patterns, locating code constructs, counting
  occurrences, discovering where concepts are referenced across the codebase.
- **Right choice when:** Searching for text patterns, regex matching, counting
  occurrences, finding files containing specific content.
- **Wrong choice when:** Trying to understand code semantics, analyzing
  relationships, or investigating meaning (per memory: "Grep finds matches, not
  meaning").
- **Limitations:** Line-oriented by default (use `multiline: true` for
  cross-line patterns). Ripgrep syntax, not grep -- literal braces need
  escaping. Cannot follow import chains or understand code structure.
- **Underuse:** The `count` output mode is excellent for quantitative research
  (e.g., "how many files use pattern X?") but rarely used in skills. The
  `multiline` mode enables cross-line pattern matching that no skill currently
  leverages for structural code analysis.

### 1.3 Glob

- **What it does:** Fast file pattern matching. Returns matching file paths
  sorted by modification time. Supports `**` recursive patterns.
- **Research use:** Discovering file structures, finding all files of a type,
  understanding project organization. The modification-time sorting reveals what
  was recently changed.
- **Right choice when:** Finding files by name/extension/location patterns.
  Mapping directory structures. Finding recently-modified files.
- **Limitations:** Pattern matching only on file paths, not content. Cannot
  filter by file size, permissions, or other metadata.
- **Underuse:** The modification-time sorting is a powerful but rarely exploited
  feature. "What files changed most recently in this subsystem?" is a natural
  research question that Glob answers directly, but no skill explicitly uses
  this.

### 1.4 Bash

- **What it does:** Executes shell commands. Working directory persists between
  calls but shell state does not. Supports timeout, background execution.
- **Research use:** Running analysis scripts, git operations, npm scripts, CLI
  tools (gh, firebase, gitleaks), arbitrary data processing pipelines.
- **Right choice when:** Running project scripts, CLI tools, git operations, or
  any analysis that requires composing multiple commands.
- **Limitations:** Shell state does not persist between calls (environment
  variables, aliases). 2-minute default timeout (10-minute max). Subject to
  permission allow-list in `.claude/settings.local.json`. Windows environment
  requires Unix shell syntax (Git Bash).
- **Underuse:** The `run_in_background` parameter enables non-blocking long
  analysis runs but is almost never used for research tasks. Could enable
  parallel script execution during research phases.

### 1.5 WebSearch

- **What it does:** Web search returning formatted result blocks with links.
  Supports domain allow/block filtering.
- **Research use:** Finding current documentation, researching APIs, discovering
  best practices, verifying claims against live web data.
- **Right choice when:** Need information beyond training cutoff, current
  events, or live documentation. Domain filtering useful for restricting to
  official sources.
- **Limitations:** US-only availability. Returns summaries, not full pages (use
  WebFetch for that). Must include Sources section in response.
- **Underuse:** Domain filtering (`allowed_domains`, `blocked_domains`) is
  powerful for research quality control but only the deep-research-searcher
  agent explicitly uses it. Skills doing ad-hoc web lookups rarely filter by
  domain.

### 1.6 WebFetch

- **What it does:** Fetches URL content, converts HTML to markdown, processes
  with a fast model using a provided prompt. 15-minute cache.
- **Research use:** Extracting specific information from documentation pages,
  analyzing web content, reading release notes, checking API references.
- **Right choice when:** You have a specific URL and want to extract particular
  information from it. Good for documentation deep-dives.
- **Limitations:** Fails on authenticated/private URLs. Content may be
  summarized if very large. Cannot handle JavaScript-rendered pages (use
  Playwright for those). Redirect handling requires manual follow-up.
- **Underuse:** The prompt-based extraction is more powerful than raw fetching
  but most invocations use simple "extract all information" prompts rather than
  targeted extraction queries. The cache is also underexploited -- multiple
  targeted prompts on the same URL within 15 minutes are essentially free.

### 1.7 Agent (Task/Subagent)

- **What it does:** Spawns a subagent with its own context window, tools, and
  instructions. Returns structured results. 27 specialized agents available plus
  13 global agents.
- **Research use:** Parallel investigation, specialized analysis (explore,
  security-auditor, code-reviewer), domain-specific deep dives.
- **Right choice when:** Task benefits from isolated context, parallel
  execution, or specialized knowledge. The `explore` agent is purpose-built for
  codebase research.
- **Limitations:** Cannot spawn nested agents. Returns results only (no
  progressive communication -- use Teams for that). Each agent gets its own
  context window (token cost multiplier). 5-6 tasks per agent maximum.
- **Underuse:** The `explore` agent is the designated codebase research tool but
  skills often use inline Grep/Read instead. The `plan` agent is rarely invoked
  by research skills even when investigation naturally leads to planning.

### 1.8 EnterWorktree / ExitWorktree

- **What it does:** Creates an isolated git worktree for parallel work. Switches
  session context to the worktree.
- **Research use:** Could isolate experimental analysis from main work, but
  primarily designed for parallel development branches.
- **Right choice when:** User explicitly requests worktree-based workflow.
- **Limitations:** Only when user says "worktree." One worktree per session.
- **Underuse:** Not used for research at all currently. Theoretical use case:
  isolating research branch artifacts from main development.

---

## 2. MCP Servers

### 2.1 Memory Server (`@modelcontextprotocol/server-memory`)

**Configured in:** `.mcp.json` **Status:** ACTIVE

**Tools exposed (9):**

| Tool                               | Purpose                            | Research Value                                 |
| ---------------------------------- | ---------------------------------- | ---------------------------------------------- |
| `mcp__memory__create_entities`     | Create entities in knowledge graph | Store research findings as structured entities |
| `mcp__memory__create_relations`    | Create relations between entities  | Map relationships between research subjects    |
| `mcp__memory__add_observations`    | Add observations to entities       | Annotate entities with new findings            |
| `mcp__memory__delete_entities`     | Remove entities                    | Clean up stale research entities               |
| `mcp__memory__delete_observations` | Remove observations                | Correct outdated findings                      |
| `mcp__memory__delete_relations`    | Remove relations                   | Correct relationship mappings                  |
| `mcp__memory__read_graph`          | Read entire knowledge graph        | Full research knowledge overview               |
| `mcp__memory__search_nodes`        | Search by query                    | Find relevant prior research entities          |
| `mcp__memory__open_nodes`          | Open specific entities by name     | Retrieve known research entities               |

**Research capabilities:**

- Build persistent knowledge graphs of research findings
- Map entity relationships (e.g., "Tool X depends on Service Y")
- Search across accumulated knowledge
- Survives session boundaries (persisted to disk)

**Underuse assessment: SEVERELY UNDERUSED for research.** The knowledge graph is
primarily used for project memory (user preferences, decisions) but not for
building structured research ontologies. A research workflow could:

- Create entities for each tool/capability discovered
- Map relations ("tool X is-alternative-to tool Y", "script A uses-tool B")
- Accumulate observations across research sessions
- Search prior research before starting new investigations

No skill currently uses the memory server for research knowledge management.

### 2.2 SonarCloud Server (custom, `scripts/mcp/sonarcloud-server.js`)

**Configured in:** `.mcp.json` **Status:** ACTIVE

**Tools exposed (4):**

| Tool                                     | Purpose                                | Research Value                          |
| ---------------------------------------- | -------------------------------------- | --------------------------------------- |
| `mcp__sonarcloud__get_issues`            | Get bugs, vulnerabilities, code smells | Code quality research baseline          |
| `mcp__sonarcloud__get_security_hotspots` | Get security hotspots by status        | Security posture research               |
| `mcp__sonarcloud__get_hotspot_details`   | Detailed hotspot with code context     | Deep-dive on specific security findings |
| `mcp__sonarcloud__get_quality_gate`      | Quality gate status for project/PR     | Overall health assessment               |

**Research capabilities:**

- Quantitative code quality baselines (bug counts, smell counts by severity)
- Security posture assessment (hotspot inventory)
- PR-specific analysis (quality gate pass/fail per PR)
- Trend analysis (comparing issues before/after changes)

**Underuse assessment: MODERATELY UNDERUSED.** The `/sonarcloud` skill uses
these tools, but they are rarely invoked during general research. Powerful for:

- Baseline research before refactoring ("what does SonarCloud say about this
  subsystem?")
- Security research input ("what hotspots exist in auth code?")
- Trend research ("has code quality improved over the last N PRs?")

### 2.3 Context7 (`context7@claude-plugins-official`)

**Configured in:** Auto-discovered plugin
(`.claude/settings.global-template.json`) **Status:** ACTIVE (conditionally
available -- plugin must be loaded)

**Tools exposed (2):**

| Tool                                | Purpose                             | Research Value                        |
| ----------------------------------- | ----------------------------------- | ------------------------------------- |
| `mcp__context7__resolve-library-id` | Resolve library name to Context7 ID | Prerequisite for documentation lookup |
| `mcp__context7__query-docs`         | Query library documentation         | Authoritative library documentation   |

**Research capabilities:**

- Look up documentation for any library in the Context7 database
- Get current, version-specific documentation (not training-cutoff stale)
- Source authority: ranked as tier 1 (HIGH trust) alongside official-docs in the
  deep-research domain config (`domains/technology.yaml`)

**Underuse assessment: SIGNIFICANTLY UNDERUSED.** Only the
deep-research-searcher agent, GSD phase-researcher, GSD planner, and GSD
project-researcher explicitly list Context7 in their tools. No other skill or
agent uses it. This means:

- Ad-hoc library questions default to WebSearch instead of Context7
- Skills that need library documentation (e.g., `frontend-design`,
  `systematic-debugging`) do not have Context7 in their tool lists
- The resolve-then-query two-step pattern is unknown to most workflows

### 2.4 Firebase (`firebase@claude-plugins-official`)

**Configured in:** Auto-discovered plugin, enabled in
`.claude/settings.local.json` **Status:** ACTIVE (conditionally available)

**Tools exposed (3 confirmed in permissions):**

| Tool                                              | Purpose                       | Research Value                        |
| ------------------------------------------------- | ----------------------------- | ------------------------------------- |
| `mcp__firebase__firebase_get_environment`         | Get Firebase environment info | Understand deployment configuration   |
| `mcp__firebase__firebase_init`                    | Initialize Firebase features  | Not research-relevant                 |
| `mcp__firebase__firebase_validate_security_rules` | Validate Firestore rules      | Security research on rule correctness |

**Research capabilities:**

- Validate Firestore security rules without deploying
- Get environment configuration for research context
- Could be used for security research on rule coverage

**Underuse assessment: UNDERUSED for research.** The
`firebase_validate_security_rules` tool could provide automated security rule
verification during research, but no skill currently invokes it for research
purposes. Security audits use manual rule reading instead.

### 2.5 Playwright (`playwright@claude-plugins-official`)

**Configured in:** Auto-discovered plugin **Status:** ACTIVE

**Tools exposed (20+):** Full browser automation suite including navigate,
click, type, extract, screenshot, eval, select, await_element, await_text,
new_tab, close_tab, keyboard_press, viewport control, and more.

**Research capabilities:**

- Navigate to and interact with the running application
- Take screenshots for visual research/documentation
- Extract page content in text/HTML/markdown
- Evaluate JavaScript in-page for runtime research
- Console message capture for debugging research

**Underuse assessment: MODERATELY USED for testing, UNDERUSED for research.**
Currently used by `webapp-testing` and `system-test` skills for functional
testing. Not used for:

- Visual regression research
- Accessibility research (could evaluate a11y properties)
- Performance research (could measure load times via eval)
- UX research (could capture user flows as screenshots)

### 2.6 Superpowers Chrome (`superpowers-chrome@superpowers-marketplace`)

**Configured in:** Plugin (`.claude/settings.json` `enabledPlugins`) **Status:**
ACTIVE

**Tools exposed (1):**

| Tool                                                 | Purpose                     | Research Value              |
| ---------------------------------------------------- | --------------------------- | --------------------------- |
| `mcp__plugin_superpowers-chrome_chrome__use_browser` | Full Chrome browser control | Rich browser-based research |

**Research capabilities:**

- Persistent Chrome browser with automatic page capture (PNG, MD, HTML, console)
- Navigate, click, type, extract, screenshot, eval, keyboard, viewport control
- Profile management, tab management
- Auto-captures every DOM action to session directory

**Underuse assessment: SEVERELY UNDERUSED for research.** Auto-capture of page
content as markdown is extremely powerful for research workflows -- navigate to
a documentation page, and the content is automatically saved as `.md` for later
analysis. No research skill currently uses this.

### 2.7 Episodic Memory (`episodic-memory@superpowers-marketplace`)

**Configured in:** Plugin (`.claude/settings.json` `enabledPlugins`) **Status:**
ACTIVE

**Tools exposed (2):**

| Tool                                                  | Purpose                                   | Research Value                            |
| ----------------------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| `mcp__plugin_episodic-memory_episodic-memory__search` | Semantic search across past conversations | Find prior research decisions and context |
| `mcp__plugin_episodic-memory_episodic-memory__read`   | Read full conversation transcripts        | Deep-dive into past research sessions     |

**Research capabilities:**

- Semantic search across ALL past conversations (vector + text modes)
- Date-range filtering for temporal research
- Read full conversation transcripts with pagination
- Recover decisions, solutions, and rationale from past sessions

**Underuse assessment: MODERATELY UNDERUSED for research.** The search tool is
used at session start for context recovery, but rarely invoked mid-research to
check "have we researched this before?" The deep-research skill has a `--recall`
flag that checks the research index, but does not search episodic memory for
informal prior research.

### 2.8 Sequential Thinking (`sequential-thinking` MCP)

**Configured in:** Available as deferred tool **Status:** ACTIVE

**Tools exposed (1):**

| Tool                                           | Purpose                         | Research Value                         |
| ---------------------------------------------- | ------------------------------- | -------------------------------------- |
| `mcp__sequential-thinking__sequentialthinking` | Structured multi-step reasoning | Complex research problem decomposition |

**Research capabilities:**

- Break complex problems into numbered thought steps
- Supports branching, revision, backtracking
- Hypothesis generation and verification
- Can adjust total_thoughts dynamically as understanding evolves
- Explicit uncertainty expression

**Underuse assessment: SEVERELY UNDERUSED.** This tool is purpose-built for the
kind of structured reasoning that research requires -- decomposing complex
questions, generating and testing hypotheses, revising understanding. No skill
or agent currently invokes it. It could significantly improve Phase 0
(decomposition) of deep-research and the verification loops of deep-plan.

### 2.9 21st.dev Magic (`magic` MCP)

**Configured in:** Available as deferred tool **Status:** ACTIVE

**Tools exposed (4):**

| Tool                                           | Purpose                    | Research Value        |
| ---------------------------------------------- | -------------------------- | --------------------- |
| `mcp__magic__21st_magic_component_builder`     | Generate UI components     | Not research-relevant |
| `mcp__magic__21st_magic_component_inspiration` | Browse component library   | UI pattern research   |
| `mcp__magic__21st_magic_component_refiner`     | Refine existing components | Not research-relevant |
| `mcp__magic__logo_search`                      | Search logos (JSX/TSX/SVG) | Not research-relevant |

**Research capabilities:** Limited. The `component_inspiration` tool could
support UI pattern research by browsing a curated component library, but this is
niche.

**Underuse assessment:** Not relevant for general research/discovery workflows.

### 2.10 Superpowers Core (`superpowers@claude-plugins-official`)

**Configured in:** Plugin (`.claude/settings.json` `enabledPlugins`) **Status:**
ACTIVE

**Tools exposed:** Unclear from configuration -- provides core superpowers
functionality. The plugin enables enhanced capabilities but its specific
research-relevant tools are not separately enumerated.

---

## 3. Agent Teams

### 3.1 `audit-review-team` (2 members)

**File:** `.claude/teams/audit-review-team.md` **Members:** reviewer (sonnet,
read-only) + fixer (sonnet, read+write) **Research use:** Structured audit
workflows across 3+ targets. The reviewer produces structured findings with
severity ratings, and cross-target pattern accumulation emerges after 3+
targets.

**When used for research:**

- Skill audits across multiple skills
- Comprehensive code audits
- Ecosystem audits (multi-domain)

**Underuse for research:** Currently only triggered by `/audit-*` commands. The
reviewer-fixer pipeline could also serve general research -- the "reviewer" role
maps naturally to "researcher" and the "fixer" role maps to "action planner."
Not currently repurposed this way.

### 3.2 `research-plan-team` (3 members)

**File:** `.claude/teams/research-plan-team.md` **Members:** researcher
(sonnet) + planner (opus) + verifier (sonnet) **Research use:** Purpose-built
for research-to-plan pipeline. The researcher investigates, the planner
structures, and the verifier challenges.

**When used for research:**

- `/deep-research` followed by `/deep-plan` on the same topic
- Research complexity L or XL (3+ sub-questions)
- Plan will drive multi-session implementation

**Key capability:** Inter-agent communication enables progressive handoff
(planner starts structuring before research is complete) and adversarial
verification (verifier challenges planner claims directly).

**Underuse:** Spawn criteria are strict (ALL conditions must be met). Simpler
research that would still benefit from researcher-verifier separation defaults
to solo subagents instead.

---

## 4. Specialized Agents (Research-Relevant)

### 4.1 `explore` agent

**File:** `.claude/agents/explore.md` **Model:** sonnet | **Tools:** Read, Bash,
Grep, Glob | **Max turns:** 25 **Purpose:** READ-ONLY codebase exploration.
Traces features end-to-end, maps dependencies, inventories patterns, analyzes
components and data flows. **Return protocol:** Structured report with Key
Files, Findings, Data Flow, Dependencies, Pattern Compliance, Confidence.
**Underuse:** CLAUDE.md Section 7 mandates this for "exploring unfamiliar code"
but skills often do inline Read/Grep instead of spawning explore.

### 4.2 `plan` agent

**File:** `.claude/agents/plan.md` **Model:** sonnet | **Tools:** Read, Bash,
Grep, Glob | **Max turns:** 25 **Purpose:** READ-ONLY implementation planning.
Investigates codebase, designs ordered plans with dependencies, risk assessment,
and effort estimates. **Underuse:** Rarely invoked by research workflows even
when research naturally leads to "what should we do about this?"

### 4.3 `deep-research-searcher` (global)

**File:** `.claude/agents/global/deep-research-searcher.md` **Model:** sonnet |
**Tools:** Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, Context7
**Purpose:** The workhorse of `/deep-research`. Executes search queries per
profile (web, docs, codebase, academic), writes structured FINDINGS.md files.
**Key feature:** Receives domain config (source_authority + verification_rules)
at spawn time. Treats Claude's training data as hypothesis, not fact.

### 4.4 `deep-research-synthesizer` (global)

**File:** `.claude/agents/global/deep-research-synthesizer.md` **Purpose:**
Synthesizes findings from multiple searcher agents into RESEARCH_OUTPUT.md with
claims.jsonl, sources.jsonl, metadata.json.

### 4.5 GSD Agents (global, 10 agents)

**Files:** `.claude/agents/global/gsd-*.md` **Agents:** codebase-mapper,
debugger, executor, integration-checker, phase-researcher, plan-checker,
planner, project-researcher, research-synthesizer, roadmapper, verifier
**Research value:** The GSD (Get Shit Done) system has its own research pipeline
(project-researcher, phase-researcher, research-synthesizer) with Context7
integration. These are only activated by `/gsd:*` commands.

### 4.6 Other Research-Relevant Agents

| Agent                  | Research Use                    |
| ---------------------- | ------------------------------- |
| `security-auditor`     | Security posture research       |
| `code-reviewer`        | Code quality research           |
| `debugger`             | Root cause research             |
| `error-detective`      | Error pattern research          |
| `performance-engineer` | Performance bottleneck research |
| `documentation-expert` | Documentation gap research      |
| `database-architect`   | Data model research             |
| `penetration-tester`   | Security vulnerability research |

---

## 5. Scripts as Research/Analysis Tools

### 5.1 Health Check System (`scripts/health/`)

**Entry point:** `npm run hooks:health` -> `scripts/health/run-health-check.js`
**11 checker modules** in `scripts/health/checkers/`:

| Checker                     | Research Value                  |
| --------------------------- | ------------------------------- |
| `code-quality.js`           | Code quality metrics            |
| `data-effectiveness.js`     | Data pipeline health            |
| `debt-health.js`            | Tech debt quantification        |
| `documentation.js`          | Documentation completeness      |
| `ecosystem-integration.js`  | Cross-system integration health |
| `hook-pipeline.js`          | Hook system health              |
| `learning-effectiveness.js` | Learning pipeline metrics       |
| `pattern-enforcement.js`    | Pattern compliance rates        |
| `security.js`               | Security posture metrics        |
| `session-management.js`     | Session management health       |
| `test-coverage.js`          | Test coverage metrics           |

**Underuse:** This is a comprehensive health research system but is only run via
`npm run hooks:health`. Individual checkers could be invoked for targeted
research (e.g., "what's the current debt health?") but no skill does this.

### 5.2 Pattern Analysis Scripts

| Script                          | npm Command         | Research Use                    |
| ------------------------------- | ------------------- | ------------------------------- |
| `check-pattern-compliance.js`   | `patterns:check`    | Pattern violation inventory     |
| `check-pattern-sync.js`         | `patterns:sync`     | Pattern propagation status      |
| `suggest-pattern-automation.js` | `patterns:suggest`  | Automation opportunity research |
| `promote-patterns.js`           | `patterns:promote`  | Pattern maturity assessment     |
| `check-propagation.js`          | `propagation:check` | Cross-file pattern spread       |

### 5.3 Documentation Analysis Scripts

| Script                            | npm Command           | Research Use                       |
| --------------------------------- | --------------------- | ---------------------------------- |
| `check-doc-headers.js`            | `docs:headers`        | Documentation standards compliance |
| `check-document-sync.js`          | `docs:sync-check`     | Cross-doc consistency              |
| `check-cross-doc-deps.js`         | `crossdoc:check`      | Documentation dependency graph     |
| `check-content-accuracy.js`       | `docs:accuracy`       | Content accuracy verification      |
| `check-external-links.js`         | `docs:external-links` | Link rot detection                 |
| `check-docs-light.js`             | `docs:check`          | Quick documentation health         |
| `generate-documentation-index.js` | `docs:index`          | Documentation inventory            |

### 5.4 Tech Debt Analysis (`scripts/debt/`)

30+ scripts for tech debt management. Research-relevant:

| Script                     | Research Use              |
| -------------------------- | ------------------------- |
| `generate-metrics.js`      | Quantitative debt metrics |
| `generate-views.js`        | Debt visualization data   |
| `sync-sonarcloud.js`       | SonarCloud debt import    |
| `extract-audit-reports.js` | Audit findings extraction |
| `reconcile-roadmap.js`     | Debt-roadmap alignment    |
| `dedup-multi-pass.js`      | Deduplication analysis    |

### 5.5 Learning & Metrics Analysis

| Script                              | npm Command         | Research Use              |
| ----------------------------------- | ------------------- | ------------------------- |
| `analyze-learning-effectiveness.js` | `learning:analyze`  | Learning pattern analysis |
| `surface-lessons-learned.js`        | `learning:surface`  | Lesson surfacing          |
| `hook-analytics.js`                 | `hooks:analytics`   | Hook usage statistics     |
| `review-lifecycle.js`               | `reviews:lifecycle` | Review process metrics    |

### 5.6 Audit Scripts (`scripts/audit/`)

| Script                          | npm Command           | Research Use             |
| ------------------------------- | --------------------- | ------------------------ |
| `compare-audits.js`             | `audit:compare`       | Cross-audit comparison   |
| `validate-audit-integration.js` | `audit:validate`      | Audit pipeline integrity |
| `generate-results-index.js`     | `audit:results-index` | Audit results inventory  |
| `track-resolutions.js`          | `audit:resolutions`   | Resolution tracking      |

### 5.7 Multi-AI Analysis (`scripts/multi-ai/`)

| Script                  | Research Use                     |
| ----------------------- | -------------------------------- |
| `aggregate-category.js` | Multi-source finding aggregation |
| `normalize-format.js`   | Cross-tool finding normalization |
| `unify-findings.js`     | Finding deduplication            |
| `state-manager.js`      | Multi-AI audit state management  |

### 5.8 Velocity & Session Analysis

| Script                        | npm Command    | Research Use                 |
| ----------------------------- | -------------- | ---------------------------- |
| `velocity/generate-report.js` | N/A            | Development velocity metrics |
| `velocity/track-session.js`   | `session:log`  | Session activity tracking    |
| `check-session-gaps.js`       | `session:gaps` | Session continuity research  |

### 5.9 Security Analysis

| Script                       | npm Command        | Research Use              |
| ---------------------------- | ------------------ | ------------------------- |
| `security-check.js`          | `security:check`   | Security posture scan     |
| `secrets/encrypt-secrets.js` | `security:secrets` | Secret management         |
| `check-agent-compliance.js`  | `agents:check`     | Agent security compliance |

### 5.10 Skill/Agent Analysis

| Script                        | npm Command           | Research Use                   |
| ----------------------------- | --------------------- | ------------------------------ |
| `search-capabilities.js`      | `capabilities:search` | Unified skill/plugin discovery |
| `validate-skill-config.js`    | `skills:validate`     | Skill configuration integrity  |
| `generate-skill-registry.js`  | `skills:registry`     | Skill inventory generation     |
| `check-skill-audit-status.js` | `skills:audit-status` | Audit coverage tracking        |

---

## 6. External CLI Tools (via Bash)

### 6.1 `gh` (GitHub CLI)

**Available:** Yes (permitted in `.claude/settings.local.json`) **Research
use:** PR analysis, issue research, CI run inspection, repository metadata, API
access to any GitHub resource. **Key commands for research:**

- `gh pr view` -- PR details, review status
- `gh pr list` -- PR inventory
- `gh run list/view` -- CI run analysis
- `gh api` -- arbitrary GitHub API queries
- `gh search` -- code/issue/repo search across GitHub

**Underuse:** `gh api` enables access to ANY GitHub API endpoint but skills
mostly use high-level commands. Repository insights (contributor stats, commit
frequency, PR merge times) are available via API but unused for research.

### 6.2 `git`

**Research use:** History analysis, blame, diff, log, show. Essential for
understanding code evolution. **Key commands for research:**

- `git log --oneline --since="2 weeks ago"` -- recent change research
- `git diff main...HEAD` -- branch delta analysis
- `git blame` -- authorship and change history
- `git show` -- specific commit analysis
- `git grep` -- content search (but prefer Grep tool)

### 6.3 `npm` / `npx`

**Research use:** Dependency analysis, script execution, tool invocation. **Key
commands:**

- `npm ls` -- dependency tree research
- `npm outdated` -- version currency research
- `npm audit` -- vulnerability research
- `npm run <script>` -- invoke any analysis script (100+ available)
- `npx knip` -- unused code detection
- `npx eslint` -- linting analysis

### 6.4 `firebase`

**Available:** Yes (permitted) **Research use:** Firebase configuration
research, function listing, log analysis, deployment state. **Key commands:**

- `firebase functions:list` -- Cloud Function inventory
- `firebase functions:log` -- Function execution research
- `firebase firestore:indexes` -- Index configuration research
- `firebase apps:sdkconfig` -- SDK configuration

### 6.5 Other CLI Tools

| Tool       | Research Use                 | Status                   |
| ---------- | ---------------------------- | ------------------------ |
| `gitleaks` | Secret detection research    | Permitted                |
| `python3`  | Custom analysis scripts      | Permitted                |
| `oxlint`   | Fast linting research        | Permitted (`npx oxlint`) |
| `knip`     | Dead code research           | Permitted (`npx knip`)   |
| `du`       | File/directory size research | Permitted                |
| `wc`       | Line/word counting           | Permitted                |

---

## 7. Gap Analysis

### 7.1 Tool Combinations That Are Powerful but Rarely Used

**GAP-1: Episodic Memory + Deep Research (cross-session research continuity)**

- Episodic memory can search past conversations for prior research, but
  `/deep-research` only checks `research-index.jsonl`, not episodic memory.
- A research session could start with `episodic-memory search` for informal
  prior research before checking the formal research index.
- **Impact:** Research is sometimes re-done because informal findings from past
  sessions are not recovered.
- **Confidence:** HIGH

**GAP-2: Memory Knowledge Graph + Research Findings (structured research
persistence)**

- The memory server's entity/relation graph could store research findings as
  structured entities with typed relations. Instead, all research is stored as
  flat markdown files.
- A research ontology (tools -> capabilities -> limitations -> gaps) would
  enable structured queries like "what tools have security limitations?"
- **Impact:** Research findings are narrative-only, not queryable.
- **Confidence:** HIGH

**GAP-3: Sequential Thinking + Deep Research Phase 0 (structured
decomposition)**

- Sequential thinking is purpose-built for the kind of structured reasoning that
  research decomposition requires -- branching, revision, hypothesis testing.
  Deep-research Phase 0 does this inline without structured support.
- **Impact:** Phase 0 decomposition quality depends entirely on the model's
  inline reasoning rather than a structured tool.
- **Confidence:** HIGH

**GAP-4: Context7 + Non-Research Skills (library documentation for all)**

- Context7 is only in the tool list of 4 agents (deep-research-searcher, 3 GSD
  agents). Skills like `frontend-design`, `systematic-debugging`,
  `pre-commit-fixer` often need library documentation but default to WebSearch.
- **Impact:** Library documentation lookups are less accurate and less current
  than they could be.
- **Confidence:** HIGH

**GAP-5: Health Checkers + Research Baselines (quantitative research
foundations)**

- The 11 health checkers produce quantitative metrics perfect for research
  baselines, but no research skill invokes them. A research task about "code
  quality trends" would benefit from `npm run hooks:health` as a starting point.
- **Impact:** Research starts from scratch rather than leveraging existing
  quantitative infrastructure.
- **Confidence:** HIGH

**GAP-6: SonarCloud MCP + Security Research (automated security baselines)**

- SonarCloud MCP tools can produce instant security posture data, but security
  research (via `security-auditor` agent) does not invoke them. The agent reads
  code manually instead of combining automated analysis with manual review.
- **Impact:** Security research misses low-hanging fruit that SonarCloud has
  already identified.
- **Confidence:** MEDIUM

**GAP-7: Chrome Superpowers + Documentation Research (auto-captured web
content)**

- The Chrome plugin auto-captures every navigated page as markdown. A research
  workflow could navigate documentation pages and get automatic structured
  markdown extraction, but no workflow uses this.
- **Impact:** Web documentation research uses WebFetch (which summarizes) rather
  than Chrome (which captures completely).
- **Confidence:** MEDIUM

**GAP-8: Glob Modification-Time Sorting + Change Research (what changed
recently?)**

- Glob returns results sorted by modification time, but no skill exploits this
  for research questions like "what files in this subsystem changed this week?"
- **Impact:** Temporal research questions require manual git log analysis when
  Glob could provide a quick first answer.
- **Confidence:** MEDIUM

**GAP-9: Firebase Validate Rules + Security Audits (automated rule
verification)**

- `mcp__firebase__firebase_validate_security_rules` can verify Firestore rules
  without deploying, but security audits read rules manually.
- **Impact:** Rule validation is manual rather than tool-assisted.
- **Confidence:** MEDIUM

**GAP-10: Grep Count Mode + Quantitative Research (pattern prevalence metrics)**

- Grep's `count` output mode can instantly quantify pattern prevalence (e.g.,
  "how many files use httpsCallable?") but research workflows use
  `files_with_matches` and count manually.
- **Impact:** Quantitative research questions take extra steps.
- **Confidence:** HIGH

### 7.2 MCP Capabilities Available but Unknown to Most Skills

| Capability                        | Available Via       | Known By                             | Unknown To                                            |
| --------------------------------- | ------------------- | ------------------------------------ | ----------------------------------------------------- |
| Library documentation             | Context7            | deep-research-searcher, 3 GSD agents | All other 23+ agents, all skills except deep-research |
| Knowledge graph persistence       | Memory server       | Session management                   | All research workflows                                |
| Structured multi-step reasoning   | Sequential Thinking | None                                 | All skills and agents                                 |
| Auto-captured page markdown       | Chrome Superpowers  | None for research                    | All research workflows                                |
| Security rule validation          | Firebase MCP        | None                                 | security-auditor, audit skills                        |
| Code quality metrics              | SonarCloud MCP      | /sonarcloud skill                    | Other research/audit skills                           |
| Cross-session conversation search | Episodic Memory     | Session-start hook                   | Mid-research workflows                                |

### 7.3 Quantitative Summary

| Category             | Total Tools           | Used in Research           | Underused                          | Unused           |
| -------------------- | --------------------- | -------------------------- | ---------------------------------- | ---------------- |
| Built-in Claude Code | 8                     | 6                          | 2                                  | 0                |
| MCP Servers          | 10 servers, ~45 tools | ~12 tools                  | ~18 tools                          | ~15 tools        |
| Agent Teams          | 2                     | 1 (research-plan-team)     | 1 (audit-review-team for research) | 0                |
| Specialized Agents   | 40 (27 + 13 global)   | ~8 regularly               | ~12 occasionally                   | ~20 rarely/never |
| Analysis Scripts     | 100+ npm scripts      | ~20 regularly              | ~40 occasionally                   | ~40+ rarely      |
| External CLI         | 6+ tools              | 3 regularly (gh, git, npm) | 3 (firebase, gitleaks, knip)       | 0                |

**Total research tool surface area:** ~200+ individual tools/scripts **Estimated
active utilization for research:** ~25% (50 tools) **Estimated
underutilization:** ~40% (80 tools available but rarely used for research)
**Estimated unused for research:** ~35% (70 tools never invoked in research
contexts)

---

## 8. Recommendations for Research & Discovery Standard

### Priority 1: Integrate Sequential Thinking into research decomposition

Sequential Thinking MCP is available, free to use, and purpose-built for the
structured reasoning that Phase 0 of deep-research needs. Zero-cost integration.

### Priority 2: Expand Context7 access to all research-adjacent agents

Add `mcp__context7__resolve-library-id` and `mcp__context7__query-docs` to agent
tool lists for: security-auditor, code-reviewer, explore, debugger,
frontend-developer, performance-engineer.

### Priority 3: Use Episodic Memory for research continuity

Before Phase 0 of deep-research, search episodic memory for informal prior
research on the topic. This catches research done outside the formal
`/deep-research` pipeline.

### Priority 4: Build research knowledge graph using Memory server

Create entities for research topics, findings, and tool capabilities. Map
relations. Enable structured queries across accumulated research.

### Priority 5: Surface health checkers as research baselines

Research workflows that assess code quality, security, documentation, or debt
should invoke the relevant health checker as a quantitative starting point.
