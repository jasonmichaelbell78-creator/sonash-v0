# Claude Code Command Reference

**Version:** 4.0 **Last Updated:** Session #140 **Purpose:** Comprehensive
reference for all CLI commands, agents, skills, MCP servers, hooks, and
shortcuts available in Claude Code

---

## Table of Contents

1. [Slash Commands (Custom)](#slash-commands-custom)
2. [Slash Commands (System/Built-in)](#slash-commands-systembuilt-in)
3. [Skills (Project-Specific)](#skills)
4. [Skills (Plugin/Global)](#skills-pluginglobal)
5. [Agents](#agents)
6. [MCP Servers](#mcp-servers)
7. [Keyboard Shortcuts](#keyboard-shortcuts)
8. [Claude Code Hooks](#hooks)
9. [Git Hooks (Pre-commit & Pre-push)](#git-hooks-pre-commit--pre-push)
10. [GitHub Actions](#github-actions)
11. [Environment Variables & Overrides](#environment-variables--overrides)
12. [Usage Examples](#usage-examples)
13. [Tips & Best Practices](#tips--best-practices)
14. [Quick Reference Tables](#quick-reference-tables)
15. [Version History](#version-history)

---

## Slash Commands (Custom)

Custom slash commands are now defined as skills in `.claude/skills/`.

> **Note (Session #120):** All custom commands have been migrated to skills
> format. The legacy command files in `.claude/commands/` have been **deleted**.
> Use `/command-name` which invokes the corresponding skill. See the
> [Skills](#skills) section for the authoritative list.

### `/audit-code`

**Description:** Run a single-session code review audit **When to use:** When
you need a quick code quality check without multi-AI consensus **Example:**
`/audit-code` **Parameters:** None **Output:** Code review findings in session
output **Note:** S0/S1 findings require `verification_steps` (Session #98)

### `/audit-documentation`

**Description:** Run multi-stage parallel documentation audit with 18 agents
**When to use:** Check for broken links, stale docs, coverage gaps, content
accuracy, lifecycle issues **Example:** `/audit-documentation` **Parameters:**
None **Output:** Staged findings with TDMS integration, priority action plan
**Note:** v2.0 (Session #124) - 6-stage parallel audit architecture

### `/audit-performance`

**Description:** Run a single-session performance audit **When to use:** Quick
performance check for bundle size, rendering, data fetching **Example:**
`/audit-performance` **Parameters:** None **Output:** Performance findings with
severity ratings

### `/audit-process`

**Description:** Run a comprehensive multi-stage automation audit with parallel
agents **When to use:** Full automation health check covering 16 types across 12
categories **Example:** `/audit-process` or `/audit-process stage 1`
**Parameters:** Optional stage number (1-7) or "full" **Output:** Staged
findings with TDMS integration, dependency graph, priority action plan **Note:**
v2.0 (Session #120)

- Expanded from single-session to 7-stage parallel audit

### `/audit-refactoring`

**Description:** Run a single-session refactoring audit **When to use:**
Identify duplication, complexity issues, architecture improvements **Example:**
`/audit-refactoring` **Parameters:** None **Output:** Refactoring suggestions
with SonarQube integration

### `/audit-security`

**Description:** Run a single-session security audit **When to use:** Quick
security review for auth, input validation, secrets management **Example:**
`/audit-security` **Parameters:** None **Output:** Security findings with OWASP
compliance check **Note:** S0/S1 findings require `verification_steps` (Session
#98)

### `/doc-optimizer`

**Description:** Scan all docs, auto-fix formatting/headers/links, report issues
as JSONL, and generate improvement recommendations **When to use:** Periodic doc
health maintenance, pre-release doc cleanup, after major doc changes
**Example:** `/doc-optimizer` **Parameters:** None **Output:** 5-wave, 13-agent
analysis with auto-fixes + JSONL findings + SUMMARY_REPORT.md

### `/docs-sync`

**Description:** Check document synchronization between templates and instances
**When to use:** Verify template-instance consistency, detect placeholder
content **Example:** `/docs-sync` **Parameters:** None **Output:** Sync status
and drift detection

### `/pr-review`

**Description:** Process AI-generated PR review feedback (CodeRabbit, Qodo,
SonarCloud, CI logs) **When to use:** After receiving PR review comments via
copy/paste **Example:** `/pr-review` then paste feedback **Parameters:** None -
paste feedback directly **Output:** Categorized feedback with action items,
auto-enriches SonarCloud issues via API

### `/session-begin`

**Description:** Complete verification steps before starting work session **When
to use:** **START OF EVERY SESSION** - validates environment and dependencies
**Example:** `/session-begin` **Parameters:** None **Output:** Validation status
(patterns:check, review:check, lessons:surface) **Note:** Includes automatic
secrets decryption check and references to SECURITY_CHECKLIST.md for pre-write
security patterns

### `/session-end`

**Description:** Complete verification steps before ending session **When to
use:** **END OF EVERY SESSION** - ensures all work is committed and tracked
**Example:** `/session-end` **Parameters:** None **Output:** Completion
checklist and session summary

### `/alerts`

**Description:** View system health alerts and pending issues **When to use:**
Check system health, review warnings, see pending actions **Example:** `/alerts`
or `/alerts --full` **Parameters:** `--full` for complete health check
**Output:** Categorized alerts (Code Health, Security, Session Context,
Documentation, Roadmap) **Added:** Session #113

### `/save-context`

**Description:** Save important session context to MCP memory **When to use:**
Before compaction, after complex investigations, when prompted by context
warnings **Example:** `/save-context` **Parameters:** None **Output:** Saved
entity confirmation with observations **Added:** Session #113

### `/docs-update`

**Description:** Update documentation artifacts after markdown file changes
**When to use:** After creating, moving, or deleting .md files; when pre-commit
blocks due to DOCUMENTATION_INDEX.md **Example:** `/docs-update` **Parameters:**
None **Output:** Regenerated index, cross-doc dependency check, suggested
updates **Added:** Session #113

### `/quick-fix`

**Description:** Auto-suggest fixes for common pre-commit failures **When to
use:** When lint, pattern compliance, or TypeScript checks fail **Example:**
`/quick-fix` or `/quick-fix [error output]` **Parameters:** Optional error
context **Output:** Categorized fixes with auto-fix commands **Added:** Session
#113

---

## Slash Commands (System/Built-in)

Built-in Claude Code commands. These are available in all projects.

### `/help`

**Description:** Get help with using Claude Code **When to use:** Need
information about Claude Code features **Example:** `/help` **Parameters:** None
**Output:** Help documentation and command list

### `/clear`

**Description:** Clear the conversation history **When to use:** Start fresh
conversation, remove context **Example:** `/clear` **Parameters:** None
**Output:** Cleared conversation

### `/commit`

**Description:** Create a git commit with AI-generated message **When to use:**
Ready to commit staged/unstaged changes **Example:** `/commit` **Parameters:**
Optional commit message **Output:** Git commit with Co-Authored-By attribution

### `/tasks`

**Description:** List all active background tasks **When to use:** Check on
running agents, background processes **Example:** `/tasks` **Parameters:** None
**Output:** List of task IDs and statuses

### `/remember`

**Description:** Save information for future sessions **When to use:** Store
important project-specific context **Example:** `/remember [information]`
**Parameters:** Information to remember **Output:** Confirmation of saved memory

### `/recall`

**Description:** Retrieve previously saved information **When to use:** Access
stored project context **Example:** `/recall [query]` **Parameters:** Search
query **Output:** Matching remembered information

### `/bug`

**Description:** Report a bug in Claude Code **When to use:** Encountered a bug
in the CLI tool itself **Example:** `/bug` **Parameters:** None **Output:**
Opens bug report flow

### `/compact`

**Description:** Compact conversation context to free up token space **When to
use:** When context is getting large, or before a complex task **Example:**
`/compact` **Parameters:** None **Output:** Compacted context summary

### `/config`

**Description:** View or modify Claude Code configuration **When to use:**
Checking or changing settings **Example:** `/config` **Parameters:** Optional
key/value to set **Output:** Current configuration or confirmation of change

### `/cost`

**Description:** Show token usage and cost for the current session **When to
use:** Monitoring usage and spend **Example:** `/cost` **Parameters:** None
**Output:** Token counts and estimated cost

### `/doctor`

**Description:** Check Claude Code health and diagnose issues **When to use:**
When something isn't working correctly **Example:** `/doctor` **Parameters:**
None **Output:** Health check results

### `/init`

**Description:** Initialize project configuration (CLAUDE.md, settings) **When
to use:** Setting up a new project for Claude Code **Example:** `/init`
**Parameters:** None **Output:** Created configuration files

### `/listen`

**Description:** Enter listen mode (read-only observation) **When to use:** When
you want Claude to observe without acting **Example:** `/listen` **Parameters:**
None **Output:** Enters passive mode

### `/login`

**Description:** Authenticate with Anthropic **When to use:** Initial setup or
re-authentication **Example:** `/login` **Parameters:** None **Output:**
Authentication flow

### `/logout`

**Description:** Sign out of Anthropic account **When to use:** Switching
accounts or ending access **Example:** `/logout` **Parameters:** None
**Output:** Signed out confirmation

### `/mcp`

**Description:** Manage MCP servers (list, add, remove) **When to use:**
Configuring or troubleshooting MCP servers **Example:** `/mcp` **Parameters:**
None **Output:** MCP server management interface

### `/model`

**Description:** Switch the AI model being used **When to use:** Changing
between Opus, Sonnet, Haiku **Example:** `/model sonnet` **Parameters:**
Optional model name **Output:** Model switch confirmation

### `/permissions`

**Description:** View or modify tool permissions **When to use:** Checking or
adjusting what actions are auto-approved **Example:** `/permissions`
**Parameters:** None **Output:** Permission settings

### `/pr-comments`

**Description:** View PR comments for the current branch **When to use:**
Reviewing feedback on a pull request **Example:** `/pr-comments` **Parameters:**
None **Output:** PR comment list

### `/review`

**Description:** Request AI code review of current changes **When to use:**
Before committing or merging changes **Example:** `/review` **Parameters:** None
**Output:** Code review feedback

### `/resume`

**Description:** Resume a background task **When to use:** Reconnecting to a
previously started background agent **Example:** `/resume [task-id]`
**Parameters:** Task ID **Output:** Resumed task output

### `/status`

**Description:** Show session status and context info **When to use:** Checking
current session state **Example:** `/status` **Parameters:** None **Output:**
Session status summary

### `/terminal-setup`

**Description:** Configure terminal for optimal Claude Code experience **When to
use:** Initial setup or fixing terminal display issues **Example:**
`/terminal-setup` **Parameters:** None **Output:** Terminal configuration guide

### `/vim`

**Description:** Toggle vim keybindings for input **When to use:** Prefer vim
editing mode **Example:** `/vim` **Parameters:** None **Output:** Vim mode
toggled

---

## Skills

Skills are invoked using the `Skill` tool. Format: `/skill-name` or via AI
suggestion.

### Core Development Skills

#### `artifacts-builder`

**Description:** Suite of tools for creating elaborate, multi-component
claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind
CSS, shadcn/ui) **When to use:** Complex artifacts requiring state management,
routing, or shadcn/ui components - not for simple single-file HTML/JSX artifacts
**Example:** User asks to build interactive dashboard with multiple components
**Parameters:** Via AI detection

#### `code-reviewer`

**Description:** Comprehensive code review for TypeScript, JavaScript, Python,
Swift, Kotlin, Go. Automated analysis, best practices, security scanning, review
checklist generation **When to use:** Reviewing PRs, providing code feedback,
identifying issues, ensuring quality standards **Example:** After completing
feature implementation **Parameters:** None (invoked by AI when appropriate)

#### `frontend-design`

**Description:** Create distinctive, production-grade frontend interfaces with
high design quality **When to use:** Building web components, pages, or
applications with polished UI **Example:** User asks to build web interface
**Parameters:** Via AI detection

#### `systematic-debugging`

**Description:** Systematic approach to debugging errors, test failures, and
unexpected behavior **When to use:** **BEFORE** proposing fixes for any bug or
error **Example:** Encountering test failure or runtime error **Parameters:**
None (invoked by AI proactively)

### Senior Role Skills

#### `senior-architect`

**Description:** Software architecture design for scalable, maintainable
systems. Architecture diagrams, system design patterns, tech stack decisions,
dependency analysis **When to use:** Designing system architecture, making
technical decisions, creating architecture diagrams, evaluating trade-offs,
defining integration patterns **Example:** Planning new microservice or major
refactoring **Parameters:** None

#### `senior-backend`

**Description:** Backend development for building scalable systems using NodeJS,
Express, Go, Python, Postgres, GraphQL, REST APIs. API scaffolding, database
optimization, security **When to use:** Designing APIs, optimizing database
queries, implementing business logic, handling auth/authorization, reviewing
backend code **Example:** Creating new API endpoint or optimizing performance
**Parameters:** None

#### `senior-devops`

**Description:** DevOps for CI/CD, infrastructure automation, containerization,
cloud platforms (AWS, GCP, Azure). Pipeline setup, IaC, deployment automation,
monitoring **When to use:** Setting up pipelines, deploying applications,
managing infrastructure, implementing monitoring, optimizing deployment
processes **Example:** Configuring GitHub Actions or Docker deployment
**Parameters:** None

#### `senior-frontend`

**Description:** Frontend development for modern, performant web applications
using ReactJS, NextJS, TypeScript, Tailwind CSS. Component scaffolding,
performance optimization **When to use:** Developing frontend features,
optimizing performance, implementing UI/UX designs, managing state, reviewing
frontend code **Example:** Building React component or optimizing bundle size
**Parameters:** None

#### `senior-fullstack`

**Description:** Full-stack development for complete web applications with
React, Next.js, Node.js, GraphQL, PostgreSQL. Project scaffolding, code quality
analysis, architecture patterns **When to use:** Building new projects,
analyzing code quality, implementing design patterns, setting up development
workflows **Example:** Starting new full-stack feature or project setup
**Parameters:** None

#### `senior-qa`

**Description:** QA and testing for quality assurance, test automation, testing
strategies. Test suite generation, coverage analysis, E2E testing setup, quality
metrics **When to use:** Designing test strategies, writing test cases,
implementing test automation, performing manual testing, analyzing test coverage
**Example:** Setting up test infrastructure or improving coverage
**Parameters:** None

### Specialized Skills

#### `content-research-writer`

**Description:** Assists in writing high-quality content by conducting research,
adding citations, improving hooks, iterating on outlines, providing real-time
feedback **When to use:** Writing documentation, articles, or content requiring
research **Example:** Creating technical blog post or comprehensive guide
**Parameters:** None

#### `developer-growth-analysis`

**Description:** Analyzes recent Claude Code chat history to identify coding
patterns, development gaps, areas for improvement, curates learning resources
from HackerNews **When to use:** Personal development insights, skill gap
analysis **Example:** Monthly development review **Parameters:** None

#### `excel-analysis`

**Description:** Analyze Excel spreadsheets, create pivot tables, generate
charts, perform data analysis **When to use:** Analyzing Excel files,
spreadsheets, tabular data, or .xlsx files **Example:** Processing data export
or financial report **Parameters:** File path to Excel file

#### `find-skills`

**Description:** Unified discovery across skills.sh ecosystem AND Claude Code
plugin marketplaces (6 registries, 100+ plugins). Searches installed plugins,
local skills, marketplace plugins, marketplace skills, and skills.sh by keyword.
Shows install status and commands. **When to use:** When looking for
functionality that might exist as an installable skill or plugin, extending
agent capabilities, starting a new project, or exploring an unfamiliar domain
**Example:** `/find-skills react performance` or user asks "is there a skill for
X?" **Parameters:** Search query (via AI detection) **Backend:**
`scripts/search-capabilities.js` + `npx skills find` **npm script:**
`npm run capabilities:search -- [query]`

#### `gh-fix-ci`

**Description:** Inspect GitHub PR checks with gh, pull failing GitHub Actions
logs, summarize failure context, create fix plan and implement after approval
**When to use:** Debugging or fixing failing PR CI/CD checks on GitHub Actions
**Example:** PR shows failed tests or build errors **Parameters:** None (uses gh
CLI)

#### `market-research-reports`

**Description:** Generate comprehensive market research reports (50+ pages) in
style of top consulting firms (McKinsey, BCG, Gartner). Professional LaTeX
formatting, extensive visuals **When to use:** Business analysis, market
research, strategic planning **Example:** Analyzing new market opportunity or
competitive landscape **Parameters:** Market/topic to research

#### `markitdown`

**Description:** Convert files and office documents to Markdown. Supports PDF,
DOCX, PPTX, XLSX, images (OCR), audio (transcription), HTML, CSV, JSON, XML,
ZIP, YouTube URLs, EPubs **When to use:** Converting documents to Markdown
format **Example:** Converting PDF documentation to Markdown **Parameters:**
File path to convert

#### `decrypt-secrets`

**Description:** Decrypt MCP tokens for remote sessions. Decrypts
`.env.local.encrypted` into `.env.local` using AES-256-GCM encryption. **When to
use:** At the start of remote/web sessions when MCP servers need tokens
**Example:** `/decrypt-secrets` then enter passphrase **Parameters:** None
(prompts for passphrase) **Setup:** First encrypt your tokens with
`node scripts/secrets/encrypt-secrets.js`

#### `mcp-builder`

**Description:** Guide for creating high-quality MCP (Model Context Protocol)
servers that enable LLMs to interact with external services **When to use:**
Building MCP servers to integrate external APIs or services, whether in Python
(FastMCP) or Node/TypeScript (MCP SDK) **Example:** Creating custom MCP server
for API integration **Parameters:** None

#### `requesting-code-review`

**Description:** Use when completing tasks, implementing major features, or
before merging to verify work meets requirements **When to use:** Before merging
significant changes **Example:** Feature complete, ready for final review
**Parameters:** None

#### `sonarcloud`

**Description:** Unified SonarCloud integration skill for fetching, syncing,
reporting, and resolving code quality issues. Consolidates `sonarcloud-sprint`
and `sync-sonarcloud-debt` into a single entry point. **When to use:** Any
SonarCloud workflow: syncing new issues to TDMS, generating reports with code
snippets, marking resolved items, running cleanup sprints, or checking quality
gate status **Example:** `/sonarcloud` **Parameters:** Modes: sync (default),
resolve, full, report, status, sprint **Added:** Session #133 **Updated:**
Session #134 (added interactive placement phase with severity-weighted analysis)

#### `sonarcloud-sprint` _(deprecated)_

**Description:** Run a SonarCloud cleanup sprint. **Deprecated:** Use
`/sonarcloud` instead, which consolidates sync, resolve, report, and sprint
modes in a unified interface. **When to use:** Use `/sonarcloud --mode sprint`
instead **Example:** `/sonarcloud` **Parameters:** None

#### `skill-creator`

**Description:** Guide for creating effective skills. Create new skills or
update existing ones that extend Claude's capabilities with specialized
knowledge, workflows, or tool integrations **When to use:** Creating or updating
a skill **Example:** Need custom workflow for specific task **Parameters:**
Skill requirements

#### `expansion-evaluation`

**Description:** Manage the SoNash expansion evaluation process for reviewing
~280 feature and technical ideas across 21 modules. Includes ROADMAP placement
discussion for all accepted/deferred items during evaluation. Supports commands:
begin, evaluate, status, decide, questions, push-to-roadmap, end. **When to
use:** Evaluating expansion ideas, tracking progress, making decisions, or
resuming evaluation session **Example:** `/expansion-evaluation begin` or
`/expansion-evaluation evaluate F1 5` **Parameters:** Subcommand (begin,
evaluate, status, decide, questions, push-to-roadmap, end) + optional
module/idea ID

#### `using-superpowers`

**Description:** Establishes how to find and use skills, requiring Skill tool
invocation before ANY response including clarifying questions **When to use:**
**START OF ANY CONVERSATION** - establishes skill usage patterns **Example:**
Auto-invoked at session start **Parameters:** None

#### `validate-claude-folder`

**Description:** Validate .claude folder configuration consistency. Checks MCP
servers, hooks, skills, documentation freshness, and secrets configuration.
**When to use:** After modifying .claude folder, during maintenance, when things
aren't working **Example:** `/validate-claude-folder` **Parameters:** None

### UI/UX Skills

#### `ui-design-system`

**Description:** UI design system toolkit including design token generation,
component documentation, responsive design calculations, developer handoff tools
**When to use:** Creating design systems, maintaining visual consistency,
design-dev collaboration **Example:** Building component library or design
tokens **Parameters:** None

#### `ux-researcher-designer`

**Description:** UX research and design toolkit including data-driven persona
generation, journey mapping, usability testing frameworks, research synthesis
**When to use:** User research, persona creation, journey mapping, design
validation **Example:** Planning user research or creating personas
**Parameters:** None

### Testing & Quality

#### `test-suite`

**Description:** Multi-phase UI testing orchestration. Runs smoke tests, feature
protocol tests, security checks, and performance checks against any deployment
URL using Playwright MCP or Chrome Extension. **When to use:** Smoke testing
deployments, running feature protocols, pre-merge validation, post-deploy checks
**Example:** `/test-suite --smoke`, `/test-suite --protocol=homepage`,
`/test-suite --full` **Parameters:**
`[scope] [--url=URL] [--protocol=NAME] [--chrome]`

#### `webapp-testing`

**Description:** Toolkit for interacting with and testing local web applications
using Playwright. Verify frontend functionality, debug UI behavior, capture
screenshots, view browser logs **When to use:** Testing web applications,
debugging UI issues **Example:** E2E testing or screenshot comparison
**Parameters:** Application URL

### Project-Specific Skills (SuperClaude)

#### `sc:agent`

**Description:** SuperClaude agent invocation **When to use:** Task delegation
to SuperClaude system **Example:** Complex multi-step automation **Parameters:**
Task description

#### `sc:analyze`

**Description:** Comprehensive code analysis across quality, security,
performance, architecture domains **When to use:** Full codebase analysis
**Example:** Pre-release code audit **Parameters:** None

#### `sc:brainstorm`

**Description:** Interactive requirements discovery through Socratic dialogue
and systematic exploration **When to use:** Requirements gathering, feature
planning **Example:** Starting new feature design **Parameters:** Topic to
explore

#### `sc:build`

**Description:** Build, compile, and package projects with intelligent error
handling and optimization **When to use:** Production build creation
**Example:** Preparing for deployment **Parameters:** Build target

#### `sc:cleanup`

**Description:** Systematically clean up code, remove dead code, optimize
project structure **When to use:** Code maintenance, refactoring **Example:**
After major feature completion **Parameters:** Cleanup scope

#### `sc:design`

**Description:** Design system architecture, APIs, component interfaces with
comprehensive specifications **When to use:** System design phase **Example:**
New feature architecture **Parameters:** Design scope

#### `sc:document`

**Description:** Generate focused documentation for components, functions, APIs,
features **When to use:** Documentation needs **Example:** API documentation
generation **Parameters:** Component/API to document

#### `sc:estimate`

**Description:** Provide development estimates for tasks, features, or projects
with intelligent analysis **When to use:** Planning and scoping **Example:**
Sprint planning **Parameters:** Task/feature to estimate

#### `sc:explain`

**Description:** Provide clear explanations of code, concepts, and system
behavior with educational clarity **When to use:** Understanding complex code
**Example:** Learning new codebase section **Parameters:** Code/concept to
explain

#### `sc:git`

**Description:** Git operations with intelligent commit messages and workflow
optimization **When to use:** Git workflow automation **Example:** Batch commits
or branch management **Parameters:** Git operation

#### `sc:help`

**Description:** List all available /sc commands and their functionality **When
to use:** Discovering SuperClaude capabilities **Example:** `/sc:help`
**Parameters:** None

#### `sc:implement`

**Description:** Feature and code implementation with intelligent persona
activation and MCP integration **When to use:** Feature implementation
**Example:** Implementing designed feature **Parameters:** Feature specification

#### `sc:improve`

**Description:** Apply systematic improvements to code quality, performance,
maintainability **When to use:** Code optimization **Example:** Performance
tuning or quality improvements **Parameters:** Improvement target

#### `sc:index`

**Description:** Generate comprehensive project documentation and knowledge base
with intelligent organization **When to use:** Project indexing **Example:**
Creating project overview **Parameters:** None

#### `sc:load`

**Description:** Session lifecycle management with Serena MCP integration for
project context loading **When to use:** Loading project context **Example:**
Session initialization **Parameters:** Context to load

#### `sc:recommend`

**Description:** Ultra-intelligent command recommendation engine - recommends
most suitable SuperClaude commands for any user input **When to use:** Finding
right SuperClaude command **Example:** Unsure which /sc command to use
**Parameters:** User intent

#### `sc:reflect`

**Description:** Task reflection and validation using Serena MCP analysis
capabilities **When to use:** Validating completed work **Example:** After major
implementation **Parameters:** Task to reflect on

#### `sc:research`

**Description:** Deep web research with adaptive planning and intelligent search
**When to use:** Research tasks **Example:** Technology evaluation or market
research **Parameters:** Research topic

#### `sc:save`

**Description:** Session lifecycle management with Serena MCP integration for
session context persistence **When to use:** Saving session state **Example:**
End of work session **Parameters:** Context to save

#### `sc:spawn`

**Description:** Meta-system task orchestration with intelligent breakdown and
delegation **When to use:** Complex multi-agent tasks **Example:** Large feature
with multiple components **Parameters:** Task breakdown

#### `sc:test`

**Description:** Execute tests with coverage analysis and automated quality
reporting **When to use:** Running test suites **Example:** Pre-commit testing
**Parameters:** Test scope

#### `sc:troubleshoot`

**Description:** Diagnose and resolve issues in code, builds, deployments,
system behavior **When to use:** Debugging system issues **Example:** Build
failures or deployment problems **Parameters:** Issue description

#### `sc:workflow`

**Description:** Generate structured implementation workflows from PRDs and
feature requirements **When to use:** Planning implementation **Example:**
Creating work breakdown **Parameters:** Feature requirements

### Audit Skills

#### `audit-aggregator`

**Description:** Aggregate and consolidate findings from multiple audit types
into a unified report **When to use:** After running multiple individual audits
to get a consolidated view **Example:** After completing code, security, and
performance audits **Parameters:** None **Added:** Session #114

#### `audit-code`

**Description:** Run code review audit with 3-agent parallel architecture
(hygiene-and-types, framework-and-testing, security-and-debugging). Includes
enhanced AI Code Patterns for hallucination detection, session consistency, and
test validity. **When to use:** Code quality check, AI codebase health
assessment **Example:** Pre-commit review or AI Health Score calculation
**Parameters:** None **Updated:** Session #125 - parallel architecture + AI Code
Patterns

#### `audit-comprehensive`

**Description:** Run all 7 audit types in staged waves (4+2+1 agents) with
checkpoints, S0/S1 escalation, and aggregated results. Stage 1: code, security,
performance, refactoring (4 parallel). Stage 2: documentation, process,
engineering-productivity (3 parallel). Stage 3: aggregation. **When to use:**
Full codebase health assessment **Example:** Before major release or quarterly
review **Parameters:** None **Updated:** Session #127 - v2.0 staged execution
with CLAUDE.md compliance

#### `audit-documentation`

**Description:** Run multi-stage parallel documentation audit with 18
specialized agents across 6 stages (Inventory, Link Validation, Content Quality,
Format & Structure, Placement & Lifecycle, Synthesis) **When to use:**
Documentation health check, quarterly doc review, link validation, staleness
detection **Example:** `/audit-documentation` **Parameters:** None **Updated:**
Session #124 - rewritten with parallel agent architecture

#### `audit-performance`

**Description:** Run performance audit with 2-agent parallel architecture
(bundle-and-rendering, data-and-memory). Includes Category 7: AI Performance
Patterns for naive data fetching, missing pagination, and unbounded queries.
**When to use:** Performance analysis, AI-generated code optimization
**Example:** Before release or AI Health Score calculation **Parameters:** None
**Updated:** Session #125 - parallel architecture + AI Performance Patterns

#### `audit-process`

**Description:** Run single-session process and automation audit on the codebase
**When to use:** CI/CD health check **Example:** Pipeline optimization
**Parameters:** None

#### `audit-refactoring`

**Description:** Run single-session refactoring audit on the codebase **When to
use:** Code quality assessment **Example:** Technical debt review
**Parameters:** None

#### `audit-security`

**Description:** Run security audit with 4-agent parallel architecture
(vulnerability-scanner, supply-chain-auditor, framework-security-auditor,
ai-code-security-auditor). Includes Category 13: AI Security Patterns for prompt
injection, hallucinated APIs, and AI-suggested insecure defaults. **When to
use:** Security review, AI-codebase security assessment **Example:**
Pre-production security check or AI Health Score calculation **Parameters:**
None **Updated:** Session #125 - parallel architecture + AI Security Patterns

#### `multi-ai-audit`

**Description:** Interactive orchestrator for multi-AI consensus audits with
any-format input support. Accepts findings from Claude, GPT, Gemini, etc. in any
format (JSONL, JSON arrays, markdown tables, numbered lists, headed sections,
prose) and normalizes them into a unified canonical schema. Features
category-by-category progression, per-category aggregation with deduplication
and consensus scoring, cross-category unification with cross-cutting file
detection, automated TDMS intake (MASTER_DEBT.jsonl integration with DEBT-XXXX
ID assignment), automated roadmap track assignment and validation, and context
compaction survival via file-based state. **When to use:** Multi-AI consensus
audits across 7 categories (code, security, performance, refactoring,
documentation, process, engineering-productivity) **Example:** `/multi-ai-audit`
then follow interactive prompts **Parameters:** None - interactive workflow
**Commands:** `add <source>` (add findings from an AI), `done` (aggregate
category), `skip` (skip category), `finish` (unify all), `status` (show
progress) **Output:** Unified findings in
`docs/audits/multi-ai/<session>/final/`, DEBT items in MASTER_DEBT.jsonl,
roadmap track assignments, metrics update **Added:** Session #130 **Updated:**
Session #134 (v1.2 - Phase 7 rewritten as interactive placement with
severity-weighted analysis, must-fix-now items, concentration risk)

### Technical Debt Management (TDMS)

#### `verify-technical-debt`

**Description:** Verify technical debt items in the verification queue **When to
use:** Verifying NEW items in MASTER_DEBT.jsonl to determine if they are real
issues or false positives **Example:** `/verify-technical-debt` **Parameters:**
None - processes items from verification queue **Output:** Updates
MASTER_DEBT.jsonl with VERIFIED, FALSE_POSITIVE, DUPLICATE, or RESOLVED status
**Added:** TDMS Phase 9

#### `sync-sonarcloud-debt` _(deprecated)_

**Description:** Sync technical debt items from SonarCloud API into
MASTER_DEBT.jsonl. **Deprecated:** Use `/sonarcloud` instead. **When to use:**
Use `/sonarcloud --mode sync` instead **Example:** `/sonarcloud` **Parameters:**
None **Added:** TDMS Phase 6

#### `add-manual-debt`

**Description:** Manually add a technical debt item to MASTER_DEBT.jsonl **When
to use:** Adding ad-hoc technical debt discovered during development
**Example:** `/add-manual-debt` **Parameters:** Prompts for file, line, title,
severity, category **Output:** New DEBT-XXXX entry in MASTER_DEBT.jsonl
**Added:** TDMS Phase 6

#### `add-deferred-debt`

**Description:** Add deferred technical debt items identified during PR review
**When to use:** During PR review when items are deferred for later **Example:**
`/add-deferred-debt` **Parameters:** Prompts for PR number, file, line,
description, severity **Output:** New DEBT-XXXX entry with `source_id: PR-N-X`
**Added:** TDMS Phase 6

### Session Management

#### `checkpoint`

**Description:** Create a checkpoint for the current session state. Saves
progress markers and context for session recovery or handoff. Also writes task
state to `.claude/state/task-*.state.json` for compaction recovery. **When to
use:** Before complex operations, mid-session saves, or preparing for handoff
**Example:** `/checkpoint` before major refactoring **Parameters:** None
**Added:** Session #114 (enhanced Session #133)

#### `pre-commit-fixer`

**Description:** Automatically fix pre-commit hook failures and retry the
commit. Classifies failures into Category A (auto-fixable: doc index, cross-doc
deps) and Category B (subagent-fixable: ESLint, pattern violations). Reduces
context waste from manual fix-commit-retry cycles. **When to use:** When
`git commit` fails due to pre-commit hook errors **Example:**
`/pre-commit-fixer` after commit failure **Parameters:** None **Added:** Session
#133

#### `session-begin`

**Description:** Complete verification steps before starting any work session.
Includes automatic secrets decryption check, session gap detection
(`npm run session:gaps`), and 4-layer compaction-resilient state persistence.
**When to use:** **START OF EVERY SESSION** **Example:** First action in new
session **Parameters:** None **Related npm scripts:** `session:gaps`,
`session:gaps:fix` (Session #138)

#### `session-end`

**Description:** Complete verification steps before ending the session. Includes
mandatory auto-commit script (`npm run session:end`) that commits and pushes
SESSION_CONTEXT.md updates to ensure session-end is never forgotten. **When to
use:** **END OF EVERY SESSION** **Example:** Final action before closing
**Parameters:** None **Added:** Auto-commit mechanism in Session #115

---

## Skills (Plugin/Global)

Plugin skills are installed globally and available across all projects. They are
invoked as `/plugin-name:skill-name`. Use `/sc:help` or `/gsd:help` for full
command lists within those ecosystems.

| Plugin               | Count | Key Skills                                                              | Invocation Prefix               |
| -------------------- | ----- | ----------------------------------------------------------------------- | ------------------------------- |
| GSD                  | ~30   | `help`, `plan-phase`, `execute-phase`, `new-project`, `debug`           | `/gsd:`                         |
| SuperClaude          | ~25   | `analyze`, `implement`, `test`, `help`, `design`, `workflow`            | `/sc:`                          |
| Superpowers          | ~13   | `brainstorming`, `systematic-debugging`, `writing-plans`                | `/superpowers:`                 |
| Sentry               | ~5    | `getIssues`, `seer`, `sentry-setup-tracing`                             | `/sentry:`                      |
| Episodic Memory      | 2     | `search-conversations`, `remembering-conversations`                     | `/episodic-memory:`             |
| Hookify              | 4     | `configure`, `help`, `list`, `hookify`                                  | `/hookify:`                     |
| PR Review Toolkit    | 4     | `review-pr`, `code-review`                                              | `/pr-review-toolkit:`           |
| Backend Development  | 9     | `api-design-principles`, `microservices-patterns`, `saga-orchestration` | `/backend-development:`         |
| Frontend/Mobile      | 4     | `nextjs-app-router-patterns`, `tailwind-design-system`                  | `/frontend-mobile-development:` |
| LLM Application Dev  | 8     | `rag-implementation`, `prompt-engineering-patterns`                     | `/llm-application-dev:`         |
| Framework Migration  | 4     | `react-modernization`, `database-migration`                             | `/framework-migration:`         |
| SEO Content Creation | ~3    | `seo-content-writer`, `seo-content-planner`, `seo-content-auditor`      | `/seo-content-creation:`        |
| SEO Technical        | ~4    | `seo-meta-optimizer`, `seo-snippet-hunter`, `seo-structure-architect`   | `/seo-technical-optimization:`  |
| SEO Analysis         | ~3    | `seo-authority-builder`, `seo-cannibalization-detector`                 | `/seo-analysis-monitoring:`     |
| Content Marketing    | 2     | `content-marketer`, `search-specialist`                                 | `/content-marketing:`           |
| Superpowers Chrome   | 1     | `browsing`                                                              | `/superpowers-chrome:`          |

---

## Agents

Agents are invoked using the `Task` tool. They run autonomous multi-step tasks.

### General Purpose

#### `general-purpose`

**Description:** General-purpose agent for researching complex questions,
searching for code, executing multi-step tasks **When to use:** Searching for
keywords/files when not confident in first few tries; complex multi-step
research **Example:** Finding obscure configuration or pattern across codebase
**Parameters:** Task description **Tools:** All available tools

#### `Explore`

**Description:** Fast agent specialized for exploring codebases. Find files by
patterns, search code for keywords, answer questions about codebase **When to
use:** Quickly finding files by patterns (e.g., "src/components/**/\*.tsx"),
searching code for keywords, answering codebase questions **Example:** "How do
API endpoints work?" or "Find all React components" **Parameters:** Search
query; thoroughness level ("quick", "medium", "very thorough") **Tools:\*\* All
tools

#### `Plan`

**Description:** Software architect agent for designing implementation plans.
Returns step-by-step plans, identifies critical files, considers architectural
trade-offs **When to use:** Planning implementation strategy for a task
**Example:** Planning multi-file feature implementation **Parameters:** Task to
plan **Tools:** All tools

### Development

#### `Bash`

**Description:** Command execution specialist for running bash commands **When
to use:** Git operations, command execution, terminal tasks **Example:** Complex
git workflows or system commands **Parameters:** Command to execute **Tools:**
Bash

#### `backend-architect`

**Description:** Backend system architecture and API design specialist **When to
use:** RESTful APIs, microservice boundaries, database schemas, scalability
planning, performance optimization **Example:** Designing new API or
microservice **Parameters:** Architecture task **Tools:** Read, Write, Edit,
Bash

#### `code-reviewer`

**Description:** Expert code review specialist for quality, security,
maintainability **When to use:** **PROACTIVELY** after writing or modifying code
to ensure high development standards **Example:** After implementing feature or
major changes **Parameters:** Code to review **Tools:** Read, Write, Edit, Bash,
Grep

#### `database-architect`

**Description:** Database architecture and design specialist **When to use:**
Database design decisions, data modeling, scalability planning, microservices
data patterns, database technology selection **Example:** Designing new database
schema or migration **Parameters:** Database design task **Tools:** Read, Write,
Edit, Bash

#### `debugger`

**Description:** Debugging specialist for errors, test failures, unexpected
behavior **When to use:** **PROACTIVELY** when encountering issues, analyzing
stack traces, investigating system problems **Example:** Test failures, runtime
errors, unexpected behavior **Parameters:** Error/issue to debug **Tools:**
Read, Write, Edit, Bash, Grep

#### `deployment-engineer`

**Description:** CI/CD and deployment automation specialist **When to use:**
Pipeline configuration, Docker containers, Kubernetes deployments, GitHub
Actions, infrastructure automation workflows **Example:** Setting up deployment
pipeline or optimizing CI/CD **Parameters:** Deployment task **Tools:** Read,
Write, Edit, Bash, AskUserQuestion

#### `devops-troubleshooter`

**Description:** Production troubleshooting and incident response specialist
**When to use:** Debugging issues, log analysis, deployment failures, monitoring
setup, root cause analysis **Example:** Production incident or deployment
failure **Parameters:** Issue to troubleshoot **Tools:** Read, Write, Edit,
Bash, Grep

#### `error-detective`

**Description:** Log analysis and error pattern detection specialist **When to
use:** **PROACTIVELY** for debugging issues, analyzing logs, investigating
production errors, identifying system anomalies **Example:** Analyzing
application logs or error patterns **Parameters:** Error/log to analyze
**Tools:** Read, Write, Edit, Bash, Grep

#### `frontend-developer`

**Description:** Frontend development specialist for React applications and
responsive design **When to use:** **PROACTIVELY** for UI components, state
management, performance optimization, accessibility implementation, modern
frontend architecture **Example:** Building React component or optimizing
frontend performance **Parameters:** Frontend task **Tools:** Read, Write, Edit,
Bash

#### `fullstack-developer`

**Description:** Full-stack development specialist covering frontend, backend,
database technologies **When to use:** **PROACTIVELY** for end-to-end
application development, API integration, database design, complete feature
implementation **Example:** Implementing full-stack feature **Parameters:**
Full-stack task **Tools:** Read, Write, Edit, Bash

#### `git-flow-manager`

**Description:** Git Flow workflow manager **When to use:** **PROACTIVELY** for
Git Flow operations including branch creation, merging, validation, release
management, pull request generation **Example:** Managing feature/release/hotfix
branches **Parameters:** Git Flow operation **Tools:** Read, Bash, Grep, Glob,
Edit, Write

#### `markdown-syntax-formatter`

**Description:** Markdown formatting specialist **When to use:** **PROACTIVELY**
for converting text to proper markdown syntax, fixing formatting issues,
ensuring consistent document structure **Example:** Formatting documentation or
fixing markdown issues **Parameters:** Content to format **Tools:** Read, Write,
Edit

#### `mcp-expert`

**Description:** Model Context Protocol (MCP) integration specialist for
cli-tool components system **When to use:** **PROACTIVELY** for MCP server
configurations, protocol specifications, integration patterns **Example:**
Configuring or troubleshooting MCP servers **Parameters:** MCP task **Tools:**
Read, Write, Edit

#### `nextjs-architecture-expert`

**Description:** Master of Next.js best practices, App Router, Server
Components, performance optimization **When to use:** **PROACTIVELY** for
Next.js architecture decisions, migration strategies, framework optimization
**Example:** Next.js architectural decisions or optimization **Parameters:**
Next.js task **Tools:** Read, Write, Edit, Bash, Grep, Glob

#### `penetration-tester`

**Description:** Penetration testing and ethical hacking specialist **When to
use:** **PROACTIVELY** for security assessments, vulnerability exploitation,
network penetration, security posture evaluation **Example:** Security audit or
penetration testing **Parameters:** Security assessment task **Tools:** Read,
Write, Edit, Bash

#### `performance-engineer`

**Description:** Profile applications, optimize bottlenecks, implement caching
strategies **When to use:** **PROACTIVELY** for performance issues, load
testing, CDN setup, query optimization **Example:** Performance bottleneck or
optimization **Parameters:** Performance task **Tools:** Read, Write, Edit, Bash

#### `prompt-engineer`

**Description:** Expert prompt optimization for LLMs and AI systems **When to
use:** **PROACTIVELY** when building AI features, improving agent performance,
crafting system prompts **Example:** Optimizing AI prompts or building AI
features **Parameters:** Prompt task **Tools:** Read, Write, Edit

#### `react-performance-optimization`

**Description:** React performance optimization specialist **When to use:**
**PROACTIVELY** for identifying and fixing performance bottlenecks, bundle
optimization, rendering optimization, memory leak resolution **Example:** React
performance issues **Parameters:** Performance optimization task **Tools:**
Read, Write, Edit, Bash

#### `security-auditor`

**Description:** Review code for vulnerabilities, implement secure
authentication, ensure OWASP compliance **When to use:** **PROACTIVELY** for
security reviews, auth flows, vulnerability fixes, JWT, OAuth2, CORS, CSP,
encryption **Example:** Security review or authentication implementation
**Parameters:** Security task **Tools:** Read, Write, Edit, Bash

#### `security-engineer`

**Description:** Security infrastructure and compliance specialist **When to
use:** **PROACTIVELY** for security architecture, compliance frameworks,
vulnerability management, security automation, incident response **Example:**
Security infrastructure or compliance **Parameters:** Security engineering task
**Tools:** Read, Write, Edit, Bash

#### `technical-writer`

**Description:** Technical writing and content creation specialist **When to
use:** **PROACTIVELY** for user guides, tutorials, README files, architecture
docs, improving content clarity and accessibility **Example:** Creating
documentation or improving technical content **Parameters:** Documentation task
**Tools:** Read, Write, Edit, Grep

#### `test-engineer`

**Description:** Test automation and quality assurance specialist **When to
use:** **PROACTIVELY** for test strategy, test automation, coverage analysis,
CI/CD testing, quality engineering practices **Example:** Test automation or
quality assurance **Parameters:** Testing task **Tools:** Read, Write, Edit,
Bash

#### `ui-ux-designer`

**Description:** UI/UX design specialist for user-centered design and interface
systems **When to use:** **PROACTIVELY** for user research, wireframes, design
systems, prototyping, accessibility standards, user experience optimization
**Example:** Design system or UX research **Parameters:** Design task **Tools:**
Read, Write, Edit

### Specialized Agents

#### `claude-code-guide`

**Description:** Expert guide for Claude Code CLI, Agent SDK, and Claude API
questions **When to use:** Questions about Claude Code features, hooks, slash
commands, MCP servers, settings, IDE integrations, keyboard shortcuts, Agent
SDK, or API usage **Example:** "How do I configure MCP servers?" or "What are
the available hooks?" **Parameters:** Question about Claude Code/API **Tools:**
Glob, Grep, Read, WebFetch, WebSearch

#### `debugging-toolkit:debugger`

**Description:** Debugging specialist for errors, test failures, unexpected
behavior **When to use:** **PROACTIVELY** when encountering any issues
**Example:** Test failures, runtime errors **Parameters:** Issue to debug
**Tools:** All tools

#### `debugging-toolkit:dx-optimizer`

**Description:** Developer Experience specialist. Improves tooling, setup,
workflows **When to use:** **PROACTIVELY** when setting up new projects, after
team feedback, or when development friction noticed **Example:** Improving
developer workflow or tooling **Parameters:** DX improvement task **Tools:** All
tools

#### `git-pr-workflows:code-reviewer`

**Description:** Elite code review expert specializing in modern AI-powered code
analysis, security vulnerabilities, performance optimization, production
reliability **When to use:** **PROACTIVELY** for code quality assurance
**Example:** PR review or code quality check **Parameters:** Code to review
**Tools:** All tools

#### `statusline-setup`

**Description:** Configure user's Claude Code status line setting **When to
use:** Customizing status line display **Example:** User wants different status
line format **Parameters:** Status line preferences **Tools:** Read, Edit

### Frontend/Mobile Development

#### `frontend-mobile-development:frontend-developer`

**Description:** Build React components, implement responsive layouts, handle
client-side state management **When to use:** **PROACTIVELY** when creating UI
components or fixing frontend issues **Example:** React component or frontend
feature **Parameters:** Frontend task **Tools:** All tools

#### `frontend-mobile-development:mobile-developer`

**Description:** Develop React Native, Flutter, or native mobile apps with
modern architecture patterns **When to use:** **PROACTIVELY** for mobile
features, cross-platform code, or app optimization **Example:** Mobile app
feature or optimization **Parameters:** Mobile development task **Tools:** All
tools

### Full-Stack Orchestration

#### `full-stack-orchestration:deployment-engineer`

**Description:** Expert deployment engineer for modern CI/CD pipelines, GitOps
workflows, advanced deployment automation **When to use:** **PROACTIVELY** for
CI/CD design, GitOps implementation, or deployment automation **Example:**
Setting up deployment pipeline **Parameters:** Deployment task **Tools:** All
tools

#### `full-stack-orchestration:performance-engineer`

**Description:** Expert performance engineer for modern observability,
application optimization, scalable system performance **When to use:**
**PROACTIVELY** for performance optimization, observability, or scalability
challenges **Example:** Performance bottleneck or monitoring setup
**Parameters:** Performance task **Tools:** All tools

#### `full-stack-orchestration:security-auditor`

**Description:** Expert security auditor for DevSecOps, comprehensive
cybersecurity, compliance frameworks **When to use:** **PROACTIVELY** for
security audits, DevSecOps, or compliance implementation **Example:** Security
audit or compliance **Parameters:** Security task **Tools:** All tools

#### `full-stack-orchestration:test-automator`

**Description:** Master AI-powered test automation with modern frameworks,
self-healing tests, comprehensive quality engineering **When to use:**
**PROACTIVELY** for testing automation or quality assurance **Example:** Test
automation or QA strategy **Parameters:** Testing task **Tools:** All tools

### Backend Development

#### `backend-development:backend-architect`

**Description:** Expert backend architect for scalable API design, microservices
architecture, distributed systems **When to use:** **PROACTIVELY** when creating
new backend services or APIs **Example:** API design or microservice
architecture **Parameters:** Backend architecture task **Tools:** All tools

#### `backend-development:temporal-python-pro`

**Description:** Master Temporal workflow orchestration with Python SDK **When
to use:** **PROACTIVELY** for workflow design, microservice orchestration, or
long-running processes **Example:** Workflow orchestration or distributed
transactions **Parameters:** Temporal workflow task **Tools:** All tools

### Testing & Quality

#### `unit-testing:debugger`

**Description:** Debugging specialist for errors, test failures, unexpected
behavior **When to use:** **PROACTIVELY** when encountering issues **Example:**
Test failures **Parameters:** Testing issue **Tools:** All tools

#### `unit-testing:test-automator`

**Description:** Master AI-powered test automation **When to use:**
**PROACTIVELY** for testing automation or quality assurance **Example:** Test
automation **Parameters:** Testing task **Tools:** All tools

### Code Review & Architecture

#### `code-review-ai:architect-review`

**Description:** Master software architect for modern architecture patterns,
clean architecture, microservices, event-driven systems, DDD **When to use:**
**PROACTIVELY** for architectural decisions **Example:** Architecture review or
design **Parameters:** Architecture task **Tools:** All tools

### Multi-Platform Apps

#### `multi-platform-apps:backend-architect`

**Description:** Expert backend architect for scalable API design, microservices
architecture, distributed systems **When to use:** **PROACTIVELY** when creating
new backend services or APIs **Example:** Multi-platform backend **Parameters:**
Backend task **Tools:** All tools

#### `multi-platform-apps:flutter-expert`

**Description:** Master Flutter development with Dart 3, advanced widgets,
multi-platform deployment **When to use:** **PROACTIVELY** for Flutter
architecture, UI implementation, or cross-platform features **Example:** Flutter
app development **Parameters:** Flutter task **Tools:** All tools

#### `multi-platform-apps:frontend-developer`

**Description:** Build React components, implement responsive layouts, handle
client-side state management **When to use:** **PROACTIVELY** when creating UI
components or fixing frontend issues **Example:** Multi-platform UI
**Parameters:** Frontend task **Tools:** All tools

#### `multi-platform-apps:ios-developer`

**Description:** Develop native iOS applications with Swift/SwiftUI **When to
use:** **PROACTIVELY** for iOS-specific features, App Store optimization, or
native iOS development **Example:** iOS app feature **Parameters:** iOS task
**Tools:** All tools

#### `multi-platform-apps:mobile-developer`

**Description:** Develop React Native, Flutter, or native mobile apps with
modern architecture patterns **When to use:** **PROACTIVELY** for mobile
features, cross-platform code, or app optimization **Example:** Mobile
development **Parameters:** Mobile task **Tools:** All tools

#### `multi-platform-apps:ui-ux-designer`

**Description:** Create interface designs, wireframes, design systems **When to
use:** **PROACTIVELY** for design systems, user flows, or interface optimization
**Example:** Design system **Parameters:** Design task **Tools:** All tools

### TDD Workflows

#### `tdd-workflows:code-reviewer`

**Description:** Elite code review expert **When to use:** **PROACTIVELY** for
code quality assurance **Example:** TDD code review **Parameters:** Code review
task **Tools:** All tools

#### `tdd-workflows:tdd-orchestrator`

**Description:** Master TDD orchestrator for red-green-refactor discipline,
multi-agent workflow coordination **When to use:** **PROACTIVELY** for TDD
implementation and governance **Example:** TDD workflow **Parameters:** TDD task
**Tools:** All tools

### Comprehensive Review

#### `comprehensive-review:architect-review`

**Description:** Master software architect **When to use:** **PROACTIVELY** for
architectural decisions **Example:** Comprehensive architecture review
**Parameters:** Architecture task **Tools:** All tools

#### `comprehensive-review:code-reviewer`

**Description:** Elite code review expert **When to use:** **PROACTIVELY** for
code quality assurance **Example:** Comprehensive code review **Parameters:**
Code review task **Tools:** All tools

#### `comprehensive-review:security-auditor`

**Description:** Expert security auditor **When to use:** **PROACTIVELY** for
security audits, DevSecOps, or compliance implementation **Example:**
Comprehensive security audit **Parameters:** Security task **Tools:** All tools

### Code Refactoring

#### `code-refactoring:code-reviewer`

**Description:** Elite code review expert **When to use:** **PROACTIVELY** for
code quality assurance **Example:** Refactoring review **Parameters:** Code
review task **Tools:** All tools

#### `code-refactoring:legacy-modernizer`

**Description:** Refactor legacy codebases, migrate outdated frameworks,
implement gradual modernization **When to use:** **PROACTIVELY** for legacy
system updates, framework migrations, or technical debt reduction **Example:**
Legacy modernization **Parameters:** Refactoring task **Tools:** All tools

### Error Debugging

#### `error-debugging:debugger`

**Description:** Debugging specialist **When to use:** **PROACTIVELY** when
encountering issues **Example:** Error debugging **Parameters:** Debugging task
**Tools:** All tools

#### `error-debugging:error-detective`

**Description:** Search logs and codebases for error patterns, stack traces,
anomalies **When to use:** **PROACTIVELY** when debugging issues, analyzing
logs, or investigating production errors **Example:** Error investigation
**Parameters:** Error analysis task **Tools:** All tools

### LLM Application Development

#### `llm-application-dev:ai-engineer`

**Description:** Build production-ready LLM applications, advanced RAG systems,
intelligent agents **When to use:** **PROACTIVELY** for LLM features, chatbots,
AI agents, or AI-powered applications **Example:** AI feature development
**Parameters:** AI task **Tools:** All tools

#### `llm-application-dev:prompt-engineer`

**Description:** Expert prompt engineer for advanced prompting techniques, LLM
optimization, AI system design **When to use:** Building AI features, improving
agent performance, crafting system prompts **Example:** Prompt optimization
**Parameters:** Prompt task **Tools:** All tools

### Agent Orchestration & Context Management

#### `agent-orchestration:context-manager`

**Description:** Elite AI context engineering specialist for dynamic context
management, vector databases, knowledge graphs, intelligent memory systems
**When to use:** **PROACTIVELY** for complex AI orchestration **Example:**
Context management for multi-agent system **Parameters:** Context task
**Tools:** All tools

#### `context-management:context-manager`

**Description:** Elite AI context engineering specialist **When to use:**
**PROACTIVELY** for complex AI orchestration **Example:** Context management
**Parameters:** Context task **Tools:** All tools

### Database & Cloud Optimization

#### `database-cloud-optimization:backend-architect`

**Description:** Expert backend architect **When to use:** **PROACTIVELY** when
creating new backend services or APIs **Example:** Database/cloud backend
**Parameters:** Backend task **Tools:** All tools

#### `database-cloud-optimization:cloud-architect`

**Description:** Expert cloud architect for AWS/Azure/GCP multi-cloud
infrastructure design, advanced IaC, FinOps cost optimization **When to use:**
**PROACTIVELY** for cloud architecture, cost optimization, migration planning,
or multi-cloud strategies **Example:** Cloud architecture **Parameters:** Cloud
task **Tools:** All tools

#### `database-cloud-optimization:database-architect`

**Description:** Expert database architect for data layer design from scratch,
technology selection, schema modeling **When to use:** **PROACTIVELY** for
database architecture, technology selection, or data modeling decisions
**Example:** Database design **Parameters:** Database task **Tools:** All tools

#### `database-cloud-optimization:database-optimizer`

**Description:** Expert database optimizer for modern performance tuning, query
optimization, scalable architectures **When to use:** **PROACTIVELY** for
database optimization, performance issues, or scalability challenges
**Example:** Database optimization **Parameters:** Optimization task **Tools:**
All tools

### Deployment Strategies

#### `deployment-strategies:deployment-engineer`

**Description:** Expert deployment engineer for modern CI/CD pipelines, GitOps
workflows, advanced deployment automation **When to use:** **PROACTIVELY** for
CI/CD design, GitOps implementation, or deployment automation **Example:**
Deployment strategy **Parameters:** Deployment task **Tools:** All tools

#### `deployment-strategies:terraform-specialist`

**Description:** Expert Terraform/OpenTofu specialist for advanced IaC
automation, state management, enterprise infrastructure patterns **When to
use:** **PROACTIVELY** for advanced IaC, state management, or infrastructure
automation **Example:** Terraform infrastructure **Parameters:** IaC task
**Tools:** All tools

### Backend API Security

#### `backend-api-security:backend-architect`

**Description:** Expert backend architect **When to use:** **PROACTIVELY** when
creating new backend services or APIs **Example:** Secure API design
**Parameters:** Backend security task **Tools:** All tools

#### `backend-api-security:backend-security-coder`

**Description:** Expert in secure backend coding practices for input validation,
authentication, API security **When to use:** **PROACTIVELY** for backend
security implementations or security code reviews **Example:** Secure backend
coding **Parameters:** Security coding task **Tools:** All tools

### Framework Migration

#### `framework-migration:architect-review`

**Description:** Master software architect **When to use:** **PROACTIVELY** for
architectural decisions **Example:** Framework migration architecture
**Parameters:** Migration task **Tools:** All tools

#### `framework-migration:legacy-modernizer`

**Description:** Refactor legacy codebases, migrate outdated frameworks **When
to use:** **PROACTIVELY** for legacy system updates, framework migrations, or
technical debt reduction **Example:** Framework migration **Parameters:**
Migration task **Tools:** All tools

### Additional Local Agents

#### `dependency-manager`

**Description:** Dependency analysis, vulnerability scanning, and license
compliance specialist **When to use:** Managing project dependencies, checking
for vulnerabilities, license audits **Example:** Analyzing dependency tree or
scanning for CVEs **Parameters:** Dependency task **Tools:** All tools

#### `documentation-expert`

**Description:** Create, improve, and maintain project documentation **When to
use:** Creating new docs, improving existing docs, generating docs from code
**Example:** Writing API docs or improving README **Parameters:** Documentation
task **Tools:** All tools

### GSD Agents (Plugin)

GSD (Get Stuff Done) agents are invoked via the Task tool with `subagent_type`.
They support the `/gsd:*` skill ecosystem.

| Agent                      | Purpose                                       | Tools                                              |
| -------------------------- | --------------------------------------------- | -------------------------------------------------- |
| `gsd-codebase-mapper`      | Explores codebase, writes structured analysis | Read, Bash, Grep, Glob, Write                      |
| `gsd-debugger`             | Scientific method debugging with checkpoints  | All tools                                          |
| `gsd-executor`             | Executes GSD plans with atomic commits        | All tools                                          |
| `gsd-integration-checker`  | Cross-phase integration verification          | Read, Bash, Grep, Glob                             |
| `gsd-phase-researcher`     | Pre-planning research, produces RESEARCH.md   | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch |
| `gsd-plan-checker`         | Goal-backward plan verification               | Read, Bash, Glob, Grep                             |
| `gsd-planner`              | Creates executable phase plans                | Read, Write, Bash, Glob, Grep, WebFetch            |
| `gsd-project-researcher`   | Domain ecosystem research                     | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch |
| `gsd-research-synthesizer` | Synthesizes parallel research outputs         | Read, Write, Bash                                  |
| `gsd-roadmapper`           | Creates project roadmaps with phase breakdown | Read, Write, Bash, Glob, Grep                      |
| `gsd-verifier`             | Phase goal achievement verification           | Read, Bash, Grep, Glob                             |

### Other Plugin Agents (Summary)

These agents come from various installed plugins and are available via the Task
tool:

| Plugin             | Agents                                                                                                                                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEO (3 plugins)    | `seo-content-auditor`, `seo-content-planner`, `seo-content-writer`, `seo-keyword-strategist`, `seo-meta-optimizer`, `seo-snippet-hunter`, `seo-structure-architect`, `seo-authority-builder`, `seo-cannibalization-detector`, `seo-content-refresher` |
| Content Marketing  | `content-marketer`, `search-specialist`                                                                                                                                                                                                               |
| Sentry             | `sentry:issue-summarizer`                                                                                                                                                                                                                             |
| Episodic Memory    | `episodic-memory:search-conversations`                                                                                                                                                                                                                |
| PR Review Toolkit  | `pr-review-toolkit:code-reviewer`, `pr-review-toolkit:code-simplifier`, `pr-review-toolkit:comment-analyzer`, `pr-review-toolkit:pr-test-analyzer`, `pr-review-toolkit:silent-failure-hunter`, `pr-review-toolkit:type-design-analyzer`               |
| Code Simplifier    | `code-simplifier:code-simplifier`                                                                                                                                                                                                                     |
| Hookify            | `hookify:conversation-analyzer`                                                                                                                                                                                                                       |
| Superpowers Chrome | `superpowers-chrome:browser-user`                                                                                                                                                                                                                     |
| Superpowers        | `superpowers:code-reviewer`                                                                                                                                                                                                                           |

---

## MCP Servers

MCP (Model Context Protocol) servers provide external integrations and
capabilities. Project-level servers are configured in `.mcp.json`. Plugin
servers are automatically provided by installed Claude Code plugins.

**Note:** Some servers require API tokens. Set tokens in `.env.local`
(gitignored). For remote sessions, use encrypted secrets:
`node scripts/secrets/decrypt-secrets.js`

### Active Project MCP Servers

These are configured in `.mcp.json` and enabled in `.claude/settings.json`.

#### `filesystem`

**Description:** Secure file operations with configurable access controls.
**When to use:** File operations within the project directory **Tools
Available:**

- `read_file` / `read_text_file` - Read file contents
- `read_media_file` - Read images/audio files
- `read_multiple_files` - Batch file reading
- `write_file` - Create or overwrite files
- `edit_file` - Make line-based edits
- `create_directory` - Create directories
- `list_directory` / `list_directory_with_sizes` - List directory contents
- `directory_tree` - Get recursive tree view
- `move_file` - Move or rename files
- `search_files` - Search for files by pattern
- `get_file_info` - Get file metadata
- `list_allowed_directories` - Show accessible paths

#### `playwright`

**Description:** Browser automation and testing server. Control browsers, take
screenshots, test web applications. **When to use:** E2E testing, web scraping,
UI testing, debugging web applications **Setup:** Run
`npx playwright install chrome` **Tools Available:**

- `browser_navigate` - Navigate to URL
- `browser_click` - Click element
- `browser_type` - Type text
- `browser_snapshot` - Accessibility snapshot (preferred over screenshot)
- `browser_take_screenshot` - Capture screenshot
- `browser_fill_form` - Fill form fields
- `browser_evaluate` - Execute JavaScript in browser
- `browser_console_messages` - Get console logs
- `browser_network_requests` - View network requests
- `browser_tabs` - Manage browser tabs
- `browser_wait_for` - Wait for conditions
- `browser_close` - Close browser

#### `memory`

**Description:** Knowledge graph-based persistent memory system. **When to
use:** Storing context that persists across sessions **Tools Available:**

- Knowledge graph storage
- Memory retrieval
- Context persistence

#### `git`

**Description:** Local Git repository operations. **When to use:** Advanced git
manipulation beyond standard commands **Tools Available:**

- Repository inspection
- Commit history analysis
- Branch operations

#### `sonarcloud`

**Description:** SonarCloud/SonarQube analysis results fetcher. **When to use:**
Fetching code quality issues, security hotspots, quality gate status
**Requires:** `SONAR_TOKEN` in `.env.local` **Tools Available:**

- `get_issues` - Fetch code issues with pagination
- `get_security_hotspots` - Fetch security hotspots
- `get_quality_gate` - Get quality gate status

### Plugin-Provided MCP Servers

These are automatically available via installed Claude Code plugins. Some
duplicate project-level servers (the plugin version is used).

| Server                                   | Purpose                    | Duplicate of Project |
| ---------------------------------------- | -------------------------- | -------------------- |
| `plugin:context7:context7`               | Library documentation      | `context7`           |
| `plugin:github:github`                   | GitHub API                 | N/A (no project)     |
| `plugin:playwright:playwright`           | Browser automation         | `playwright`         |
| `plugin:firebase:firebase`               | Firebase tools             | N/A (no project)     |
| `plugin:episodic-memory:episodic-memory` | Conversation memory search | N/A (unique)         |
| `plugin:superpowers-chrome:chrome`       | Chrome DevTools Protocol   | N/A (unique)         |

### Disabled MCP Servers

These are configured in `.mcp.json` but disabled in `.claude/settings.json`
(`disabledMcpjsonServers`):

- `serena` - Code analysis and semantic editing (disabled for performance)
- `rube` - Disabled
- `nextjs-devtools` - Disabled

---

## Keyboard Shortcuts

### Claude Code CLI Shortcuts

#### `Ctrl+C` / `Cmd+C`

**Description:** Interrupt current operation or cancel input **When to use:**
Stop long-running command or cancel prompt **Example:** Interrupt infinite loop
or unwanted operation

#### `Ctrl+D` / `Cmd+D`

**Description:** Exit Claude Code CLI **When to use:** End session and close CLI
**Example:** After completing work session

#### `Ctrl+L` / `Cmd+L`

**Description:** Clear screen (terminal clear) **When to use:** Clean up
terminal output **Example:** After long output, start fresh view

#### `Ctrl+R` / `Cmd+R`

**Description:** Search command history (reverse search) **When to use:** Find
previously used command **Example:** Reuse complex command from history

#### `Ctrl+Z` / `Cmd+Z`

**Description:** Suspend current process (background) **When to use:**
Temporarily suspend operation **Example:** Multi-tasking in terminal

#### `Tab`

**Description:** Auto-complete command or path **When to use:** Complete
partially typed command/path **Example:** Type `/sess` + Tab → `/session-begin`

#### `Up Arrow` / `Down Arrow`

**Description:** Navigate command history **When to use:** Recall previous
commands **Example:** Rerun recent command

#### `Ctrl+A` / `Cmd+A`

**Description:** Move cursor to beginning of line **When to use:** Edit command
from start **Example:** Fix typo at beginning of long command

#### `Ctrl+E` / `Cmd+E`

**Description:** Move cursor to end of line **When to use:** Add to end of
command **Example:** Append parameter to command

#### `Ctrl+K` / `Cmd+K`

**Description:** Delete from cursor to end of line **When to use:** Remove part
of command **Example:** Clear wrong parameters

#### `Ctrl+U` / `Cmd+U`

**Description:** Delete from cursor to beginning of line **When to use:** Clear
command before cursor **Example:** Start command over

#### `Ctrl+W` / `Cmd+W`

**Description:** Delete word before cursor **When to use:** Remove last word
**Example:** Remove incorrect parameter

### Multi-line Input

#### `Shift+Enter`

**Description:** New line in multi-line input mode **When to use:** Writing
multi-line prompts or code **Example:** Formatting complex prompt across lines

#### `Enter` (in multi-line mode)

**Description:** Submit multi-line input **When to use:** Send complete
multi-line prompt **Example:** After formatting multi-line request

---

## Hooks

Project hooks that automatically execute on specific events. Configured in
`.claude/settings.json`.

### SessionStart Hooks

#### `session-start.js`

**Description:** Main session startup hook. Runs validation scripts and
environment checks. **When triggered:** At the start of every Claude Code
session **What it does:**

- Validates project setup
- Checks dependencies
- Runs startup diagnostics
- **Cross-session validation**: Detects if previous session didn't run
  `/session-end`
- **Session state tracking**: Records session begin/end for health monitoring

**Location:** `.claude/hooks/session-start.js`

#### `check-mcp-servers.js`

**Description:** MCP server availability checker **When triggered:** At session
start (after session-start.js) **What it does:**

- Verifies MCP servers are accessible
- Reports unavailable servers
- Validates MCP configuration **Location:** `.claude/hooks/check-mcp-servers.js`
  **Status Message:** "Checking MCP availability..."

#### `check-remote-session-context.js`

**Description:** Remote session context validator **When triggered:** At session
start for remote/web sessions **What it does:**

- Validates remote session environment
- Checks for encrypted secrets needing decryption
- Ensures proper context for remote work **Location:**
  `.claude/hooks/check-remote-session-context.js` **Added:** Session #114

#### `stop-serena-dashboard.js`

**Description:** Serena dashboard cleanup **When triggered:** At session start
**What it does:**

- Checks for orphaned Serena dashboard processes
- Cleans up stale dashboard instances
- Prevents resource leaks **Location:** `.claude/hooks/stop-serena-dashboard.js`
  **Added:** Session #114

### PreCompact Hooks

#### `pre-compaction-save.js`

**Description:** Full state snapshot before compaction (Layer C of compaction
defense) **When triggered:** Automatically before context compaction **What it
does:**

- Saves task states, commit log, and git context to `.claude/state/handoff.json`
- Captures full session state for recovery
- Most reliable compaction defense layer (fires at exactly the right moment)
  **Location:** `.claude/hooks/pre-compaction-save.js` **Status Message:**
  "Saving state before compaction..." **Added:** Session #138

### SessionStart:compact Hooks

#### `compact-restore.js`

**Description:** Context recovery after compaction **When triggered:**
Automatically after context compaction (matcher: `compact`) **What it does:**

- Reads `.claude/state/handoff.json`
- Outputs structured recovery context (task progress, recent commits, git
  status)
- No manual action needed - automatic context injection **Location:**
  `.claude/hooks/compact-restore.js` **Status Message:** "Restoring context
  after compaction..." **Added:** Session #138

### PostToolUse:Write/Edit/MultiEdit Hooks

These hooks fire after Write, Edit, or MultiEdit tool usage on code files.

#### `check-write-requirements.js`

**Description:** Agent requirement validator for Write tool **When triggered:**
After Write tool is used **What it does:**

- Checks if required agents were invoked
- Validates file write requirements
- Ensures proper review process **Location:**
  `.claude/hooks/check-write-requirements.js` **Status Message:** "Checking
  agent requirements..."

#### `check-edit-requirements.js`

**Description:** Agent requirement validator for Edit/MultiEdit tools **When
triggered:** After Edit or MultiEdit tool is used **What it does:**

- Validates edit requirements
- Ensures proper code review
- Checks agent invocation **Location:**
  `.claude/hooks/check-edit-requirements.js` **Status Message:** "Checking agent
  requirements..."

#### `pattern-check.js`

**Description:** Anti-pattern compliance checker **When triggered:** After
Write, Edit, or MultiEdit tools **What it does:**

- Scans modified files for known anti-patterns
- Reports pattern violations
- Enforces code quality standards **Location:** `.claude/hooks/pattern-check.js`
  **Status Message:** "Checking pattern compliance..."

#### `agent-trigger-enforcer.js`

**Description:** Agent usage recommendation hook with phase evolution **When
triggered:** After Write, Edit, or MultiEdit tools on code files **What it
does:**

- Tracks file modifications and suggests appropriate agents
- Phase 1 (current): SUGGEST agent usage based on file patterns
- Phase 2 trigger: After 50 uses or 30 days, notifies to consider warnings
- Phase 3 trigger: After 100 uses or 60 days, notifies to consider blocking
- Recommends code-reviewer for TS/JS files
- Recommends security-auditor for Cloud Functions and Firestore rules
- Tracks state in `.claude/hooks/.agent-trigger-state.json` **Location:**
  `.claude/hooks/agent-trigger-enforcer.js` **Status Message:** "Checking agent
  recommendations..."

#### `app-check-validator.js`

**Description:** Firebase App Check validation **When triggered:** After edits
to Firebase-related files **What it does:**

- Validates App Check configuration
- Checks for security misconfigurations **Location:**
  `.claude/hooks/app-check-validator.js` **Added:** Session #114

#### `audit-s0s1-validator.js`

**Description:** Audit finding severity validator **When triggered:** After
Write to audit-related files **What it does:**

- Validates S0/S1 findings have required fields
- Ensures verification_steps are present
- Enforces audit quality standards **Location:**
  `.claude/hooks/audit-s0s1-validator.js` **Added:** Session #114

#### `component-size-check.js`

**Description:** React component size monitor **When triggered:** After edits to
React component files **What it does:**

- Checks component file sizes
- Warns when components exceed recommended limits
- Suggests splitting large components **Location:**
  `.claude/hooks/component-size-check.js` **Added:** Session #114

#### `firestore-write-block.js`

**Description:** Firestore write protection **When triggered:** After Firestore
rule modifications **What it does:**

- Validates Firestore security rules
- Blocks potentially dangerous write patterns
- Enforces security best practices **Location:**
  `.claude/hooks/firestore-write-block.js` **Added:** Session #114

#### `repository-pattern-check.js`

**Description:** Repository pattern validator **When triggered:** After edits to
repository/data access files **What it does:**

- Validates repository pattern compliance
- Checks for direct database access anti-patterns **Location:**
  `.claude/hooks/repository-pattern-check.js` **Added:** Session #114

#### `test-mocking-validator.js`

**Description:** Test mock pattern validator **When triggered:** After edits to
test files **What it does:**

- Validates proper test mocking patterns
- Checks for httpsCallable mocking (not Firestore directly)
- Ensures test isolation **Location:** `.claude/hooks/test-mocking-validator.js`
  **Added:** Session #114

#### `typescript-strict-check.js`

**Description:** TypeScript strict mode enforcer **When triggered:** After edits
to TypeScript files **What it does:**

- Validates strict TypeScript compliance
- Checks for any/unknown type usage
- Enforces type safety standards **Location:**
  `.claude/hooks/typescript-strict-check.js` **Added:** Session #114

### PostToolUse:Read Hooks

These hooks fire after the Read tool is used to read files.

#### `large-context-warning.js`

**Description:** Context size monitor and file read counter **When triggered:**
After Read tool is used **What it does:**

- Tracks number of files read in the session
- Warns at 25+ files read (approaching context limits)
- Suggests `/save-context` when needed **Location:**
  `.claude/hooks/large-context-warning.js` **Status Message:** "Tracking context
  size..." **Added:** Session #114

#### `auto-save-context.js`

**Description:** Automatic context saver **When triggered:** After Read tool is
used **What it does:**

- Monitors for important context changes
- Auto-saves to MCP memory when appropriate
- Prevents context loss **Location:** `.claude/hooks/auto-save-context.js`
  **Status Message:** "Checking context preservation..." **Added:** Session #114

#### `compaction-handoff.js`

**Description:** Layer B compaction defense **When triggered:** After Read tool
(fires when 25+ files have been read) **What it does:**

- Monitors file read count as proxy for context growth
- Writes compaction handoff state to `.claude/state/handoff.json`
- Part of the 4-layer compaction-resilient state persistence system
  **Location:** `.claude/hooks/compaction-handoff.js` **Status Message:**
  "Checking compaction handoff..." **Added:** Session #138

### PostToolUse:Bash Hooks

#### `commit-tracker.js`

**Description:** Git commit logger (Layer A of compaction defense) **When
triggered:** After Bash tool is used **What it does:**

- Detects git commit commands in bash output
- Logs every commit to `.claude/state/commit-log.jsonl` (append-only)
- Survives all failure modes including crashes
- Single source of truth for commit history across compactions **Location:**
  `.claude/hooks/commit-tracker.js` **Status Message:** "Tracking commits..."
  **Added:** Session #138

### PostToolUse:AskUserQuestion Hooks

#### `decision-save-prompt.js`

**Description:** Decision documentation prompter **When triggered:** After
AskUserQuestion tool is used (not broadly - specific to decision points) **What
it does:**

- Detects architectural/design decisions
- Prompts to document in decision log (SESSION_DECISIONS.md)
- Non-blocking **Location:** `.claude/hooks/decision-save-prompt.js` **Status
  Message:** "Checking decision documentation..." **Added:** Session #114

### PostToolUse:Task Hooks

#### `track-agent-invocation.js`

**Description:** Agent usage tracker **When triggered:** After Task tool
invocations **What it does:**

- Tracks which agents are invoked
- Records usage statistics
- Supports agent effectiveness analysis **Location:**
  `.claude/hooks/track-agent-invocation.js` **Status Message:** "Tracking agent
  invocation..." **Added:** Session #114

### Shared Hook Utilities

#### `state-utils.js`

**Description:** Shared utility module used by compaction hooks **Not a hook
itself** - provides common functions for state file I/O, timestamp formatting,
and git context gathering. Used by `pre-compaction-save.js`,
`compact-restore.js`, and `compaction-handoff.js`. **Location:**
`.claude/hooks/state-utils.js` **Added:** Session #138

### UserPromptSubmit Hooks

#### `alerts-reminder.js`

**Description:** Pending alerts notifier **When triggered:** When user submits a
prompt **What it does:**

- Checks for pending system alerts
- Reminds user of unaddressed warnings
- Non-blocking **Location:** `.claude/hooks/alerts-reminder.js` **Status
  Message:** "Checking alerts..." **Added:** Session #114

#### `analyze-user-request.js`

**Description:** Pre-task trigger analyzer **When triggered:** When user submits
a prompt **What it does:**

- Analyzes user request for trigger conditions
- Checks if specific agents/skills should be invoked
- Provides pre-task recommendations **Location:**
  `.claude/hooks/analyze-user-request.js` **Status Message:** "Checking PRE-TASK
  triggers..."

#### `plan-mode-suggestion.js`

**Description:** Complex task detector **When triggered:** When user submits a
prompt **What it does:**

- Detects implementation keywords + complexity indicators
- Suggests using Plan mode for multi-step tasks
- Non-blocking (just provides guidance) **Location:**
  `.claude/hooks/plan-mode-suggestion.js` **Status Message:** "Checking task
  complexity..."

#### `session-end-reminder.js`

**Description:** Session ending detector **When triggered:** When user submits a
prompt **What it does:**

- Detects phrases indicating session is ending ("done", "that's all", etc.)
- Reminds to run `/session-end` skill
- Non-blocking (just provides guidance) **Location:**
  `.claude/hooks/session-end-reminder.js` **Status Message:** "Checking session
  status..."

---

## Git Hooks (Pre-commit & Pre-push)

Git hooks run automatically via Husky. These are separate from Claude Code hooks
and enforce code quality at the git level.

### Pre-commit Chain (13 Steps)

Configured in `.husky/pre-commit`. Runs on every `git commit`.

| Step | Check                                         | Blocking     | Override                        |
| ---- | --------------------------------------------- | ------------ | ------------------------------- |
| 1    | ESLint (`npm run lint`)                       | Yes          | Fix errors first                |
| 2    | lint-staged / Prettier                        | Yes          | Auto-formats staged             |
| 3    | Pattern compliance (`npm run patterns:check`) | Yes          | Fix violations                  |
| 4    | Tests (`npm test`)                            | Yes          | `SKIP_TESTS=1`                  |
| 5    | CANON schema validation                       | No (warning) | N/A                             |
| 6    | Skill configuration validation                | No (warning) | N/A                             |
| 7    | Cross-document dependency check               | Yes          | `SKIP_CROSS_DOC_CHECK=1`        |
| 8    | Documentation Index staleness                 | Yes          | `SKIP_DOC_INDEX_CHECK=1`        |
| 8.5  | Document header validation (new docs)         | Yes          | `SKIP_DOC_HEADER_CHECK=1`       |
| 9    | Learning entry reminder                       | No (info)    | N/A                             |
| 10   | Audit file S0/S1 validation                   | Yes          | `SKIP_AUDIT_VALIDATION=1`       |
| 11   | Agent compliance check                        | No (warning) | `STRICT_AGENT_CHECK=1` to block |
| 12   | Technical debt schema validation              | Yes          | `SKIP_DEBT_VALIDATION=1`        |
| 13   | Canonical location check                      | No (warning) | N/A                             |

**Smart test skipping (Step 4):**

- Config file changes (package.json, tsconfig, next.config, lockfiles) always
  force tests
- Doc-only commits (all files are .md, .mdx, .txt, images, .jsonl) skip tests
- All other commits run tests normally

### Pre-push Chain (7 Steps)

Configured in `.husky/pre-push`. Runs on every `git push`.

| Step | Check                                         | Blocking            | Override          |
| ---- | --------------------------------------------- | ------------------- | ----------------- |
| 1    | Circular dependency check                     | Yes                 | Fix deps first    |
| 2    | Pattern compliance (`npm run patterns:check`) | Yes                 | Fix violations    |
| 3    | Security pattern check (per-file)             | Yes (CRITICAL/HIGH) | Fix security      |
| 4    | npm security audit                            | No (warning)        | N/A               |
| 5    | Type check (`tsc --noEmit`)                   | Yes                 | Fix type errors   |
| 6    | npm audit (high/critical vulns)               | No (warning)        | N/A               |
| 7    | Event-based trigger checker                   | Yes (security)      | `SKIP_TRIGGERS=1` |

### Git Hook Override Environment Variables

Set these before the git command to bypass specific checks:

```bash
# Pre-commit overrides
SKIP_TESTS=1 git commit -m "message"              # Skip test step
SKIP_CROSS_DOC_CHECK=1 git commit -m "message"    # Skip cross-doc deps
SKIP_DOC_INDEX_CHECK=1 git commit -m "message"    # Skip doc index check
SKIP_DOC_HEADER_CHECK=1 git commit -m "message"   # Skip header validation
SKIP_AUDIT_VALIDATION=1 git commit -m "message"   # Skip S0/S1 audit check
SKIP_DEBT_VALIDATION=1 git commit -m "message"     # Skip TDMS schema check
STRICT_AGENT_CHECK=1 git commit -m "message"       # Make agent check blocking

# Pre-push overrides
SKIP_TRIGGERS=1 git push                           # Skip event-based triggers
```

---

## GitHub Actions

CI/CD workflows in `.github/workflows/`. These run automatically on GitHub.

| Workflow            | File                         | Trigger         | Purpose                   |
| ------------------- | ---------------------------- | --------------- | ------------------------- |
| CI                  | `ci.yml`                     | Push/PR         | Lint, test, build         |
| Deploy Firebase     | `deploy-firebase.yml`        | Push to main    | Production deploy         |
| SonarCloud          | `sonarcloud.yml`             | Push/PR         | Code quality scan         |
| Docs Lint           | `docs-lint.yml`              | Push/PR         | Documentation linting     |
| Review Check        | `review-check.yml`           | PR              | Review requirements       |
| Auto Label          | `auto-label-review-tier.yml` | PR              | Auto-label by review tier |
| Resolve Debt        | `resolve-debt.yml`           | Schedule/manual | Auto-resolve TDMS items   |
| Backlog Enforcement | `backlog-enforcement.yml`    | PR              | Enforce backlog standards |
| Validate Plan       | `validate-plan.yml`          | PR              | Validate planning docs    |
| Sync README         | `sync-readme.yml`            | Push            | Keep README in sync       |

---

## Environment Variables & Overrides

Consolidated reference for all environment variables used across hooks, git
hooks, and settings.

### Git Hook Overrides (Pre-commit)

| Variable                  | Effect                                     |
| ------------------------- | ------------------------------------------ |
| `SKIP_TESTS=1`            | Skip test step in pre-commit               |
| `SKIP_CROSS_DOC_CHECK=1`  | Skip cross-document dependency check       |
| `SKIP_DOC_INDEX_CHECK=1`  | Skip documentation index staleness check   |
| `SKIP_DOC_HEADER_CHECK=1` | Skip document header validation (new docs) |
| `SKIP_AUDIT_VALIDATION=1` | Skip S0/S1 audit finding validation        |
| `SKIP_DEBT_VALIDATION=1`  | Skip technical debt schema validation      |
| `STRICT_AGENT_CHECK=1`    | Make agent compliance check blocking       |

### Git Hook Overrides (Pre-push)

| Variable          | Effect                           |
| ----------------- | -------------------------------- |
| `SKIP_TRIGGERS=1` | Skip event-based trigger checker |

### Claude Code Settings

| Variable                                 | Effect                     |
| ---------------------------------------- | -------------------------- |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | Enable agent teams feature |

### Build/Test Overrides

| Variable                  | Effect                                                          |
| ------------------------- | --------------------------------------------------------------- |
| `SKIP_AUDIT_VALIDATION=1` | Also used for eval artifacts with false-positive S0/S1 triggers |

---

## Usage Examples

### Example 1: Starting a Session

```bash
# Session start
/session-begin

# (Hooks automatically run: session-start.js, check-mcp-servers.js)
# Output shows validation results
```

### Example 2: Running an Audit

```bash
# Quick security check
/audit-security

# Or invoke via AI by saying:
"Run a security audit on the codebase"
```

### Example 3: Using an Agent

```bash
# AI detects need for agent and invokes:
"Explore the codebase to find all authentication-related files"

# This triggers the Explore agent with thoroughness="medium"
```

### Example 4: Using a Skill

```bash
# Direct invocation:
/systematic-debugging

# Or via AI detection:
"I'm getting a test failure in auth.test.ts"
# AI automatically invokes systematic-debugging skill
```

### Example 5: Using MCP Server

```bash
# AI uses context7 MCP automatically:
"Show me the latest Next.js App Router docs"

# This triggers: mcp__context7__resolve-library-id then mcp__context7__query-docs
```

### Example 6: Keyboard Shortcut

```bash
# Type partially:
/sess

# Press Tab → auto-completes to /session-begin
```

---

## Tips & Best Practices

### Command Discovery

1. Use `/help` to see available system commands
2. Type `/` and Tab to see slash command suggestions
3. Check `.claude/skills/` for project-specific skills
4. Ask AI: "What skills are available for X task?"

### Agent Usage

1. Let AI detect when agents are needed (proactive invocation)
2. Review agent descriptions to understand capabilities
3. Agents run autonomously - provide clear task descriptions
4. Check agent output for completion status

### Skill Usage

1. Skills are invoked automatically when relevant
2. Can explicitly request: "Use the code-reviewer skill"
3. Skills provide specialized workflows and knowledge
4. Multiple skills can be chained for complex tasks

### MCP Server Usage

1. MCP servers work transparently through AI
2. No direct invocation needed - AI selects appropriate tools
3. Check `.mcp.json` for project servers, `.claude/settings.json` for
   enabled/disabled
4. Plugin servers (context7, github, firebase, playwright) are always available

### Hook Management

1. Hooks run automatically - no manual invocation
2. Check hook output in session logs
3. Hooks can be disabled in `.claude/settings.json`
4. Custom hooks can be added following existing patterns

### Keyboard Shortcuts

1. Learn basic shortcuts (Ctrl+C, Tab, Up/Down) first
2. Use Tab completion to discover commands
3. Use Up arrow to recall recent commands
4. Multi-line mode (Shift+Enter) for complex prompts

---

## Quick Reference Tables

### Most Used Commands

| Command          | Type     | Purpose                  |
| ---------------- | -------- | ------------------------ |
| `/session-begin` | Skill    | Start session validation |
| `/session-end`   | Skill    | End session checklist    |
| `/commit`        | System   | Create git commit        |
| `/compact`       | System   | Compact conversation     |
| `/help`          | System   | Get help                 |
| `/model`         | System   | Switch AI model          |
| `/config`        | System   | View/modify config       |
| `Tab`            | Keyboard | Auto-complete            |
| `Ctrl+C`         | Keyboard | Cancel/interrupt         |

### Most Used Agents

| Agent                  | Purpose                        |
| ---------------------- | ------------------------------ |
| `Explore`              | Find files and search codebase |
| `debugger`             | Debug errors and failures      |
| `code-reviewer`        | Review code quality            |
| `Plan`                 | Design implementation plans    |
| `frontend-developer`   | Build UI components            |
| `backend-architect`    | Design APIs and services       |
| `documentation-expert` | Create/maintain documentation  |
| `security-auditor`     | Security reviews               |

### Most Used Skills

| Skill                  | Purpose                     |
| ---------------------- | --------------------------- |
| `systematic-debugging` | Debug issues systematically |
| `code-reviewer`        | Comprehensive code review   |
| `frontend-design`      | Build polished UI           |
| `senior-fullstack`     | Full-stack development      |
| `sonarcloud`           | Unified SonarCloud workflow |
| `session-begin`        | Session validation          |
| `session-end`          | Session completion          |

### Active MCP Servers

| Server       | Main Purpose                   |
| ------------ | ------------------------------ |
| `filesystem` | File operations                |
| `playwright` | Browser automation             |
| `memory`     | Persistent memory              |
| `git`        | Git repository operations      |
| `sonarcloud` | Code quality analysis          |
| `context7`   | Library documentation (plugin) |
| `github`     | GitHub API (plugin)            |
| `firebase`   | Firebase tools (plugin)        |

---

## Version History

| Version | Session | Changes                                                                                                                                                                 |
| ------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1     | #142    | Added `find-skills` skill (vercel-labs/skills ecosystem discovery)                                                                                                      |
| 4.0     | #140    | Major overhaul: added Git Hooks, GitHub Actions, Plugin Skills, Environment Variables sections; fixed MCP servers; added missing agents/hooks; expanded system commands |
| 3.3     | #134    | Updated `/sonarcloud` (interactive placement phase) and `/multi-ai-audit` (Phase 7 rewritten as interactive placement)                                                  |
| 3.2     | #134    | Review #250: Removed duplicate `/sonarcloud` entry; fixed deprecated command examples                                                                                   |
| 3.1     | #133    | Added `/pre-commit-fixer` skill; enhanced `/checkpoint`, `/session-end`, `/save-context` for state persistence and compaction handoff                                   |
| 3.0     | #133    | Added unified `/sonarcloud` skill consolidating sonarcloud-sprint and sync-sonarcloud-debt; deprecated individual skills                                                |
| 2.9     | #130    | Added multi-ai-audit skill - interactive orchestrator for multi-AI consensus audits                                                                                     |
| 2.8     | #129    | pr-review skill now MANDATES incrementing consolidation counter; added `npm run consolidation:sync`                                                                     |
| 2.7     | #125    | Updated audit-security (4 agents), audit-code (3 agents), audit-performance (2 agents) with parallel architecture                                                       |
| 2.6     | #124    | Updated audit-documentation to v2.0 with 6-stage parallel audit architecture (18 agents)                                                                                |
| 2.5     | #123    | Added TDMS skills section (verify-technical-debt, sync-sonarcloud-debt, add-manual-debt, add-deferred-debt)                                                             |
| 2.3     | #115    | Added auto-commit mechanism to session-end skill                                                                                                                        |
| 2.2     | #114    | Added 3 missing skills, documented 14 undocumented hooks, clarified commands→skills migration                                                                           |
| 2.1     | #112    | Updated session-end checklist to include DOCUMENTATION_INDEX.md                                                                                                         |
| 2.0     | #110    | Fix expansion-evaluation template per PR review (Review #195)                                                                                                           |
| 1.5     | #108    | Update MCP servers, add decrypt-secrets, remove CodeRabbit hook                                                                                                         |
| 1.0     | #100    | Initial comprehensive command reference created                                                                                                                         |

---

**END OF COMMAND_REFERENCE.md**

This document is maintained locally and should be updated when:

- New slash commands are added
- Skills are created or modified
- Agents are added or updated
- MCP servers are configured or changed
- Claude Code hooks are added or modified
- Git hooks (pre-commit/pre-push) are added or modified
- GitHub Actions workflows are added or modified
- Environment variables or overrides are added or changed
- New keyboard shortcuts are discovered
