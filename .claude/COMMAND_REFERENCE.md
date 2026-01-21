# Claude Code Command Reference

**Version:** 1.3 **Last Updated:** 2026-01-21 **Purpose:** Comprehensive
reference for all CLI commands, agents, skills, MCP servers, and shortcuts
available in Claude Code

---

## Table of Contents

1. [Slash Commands (Custom)](#slash-commands-custom)
2. [Slash Commands (System/Built-in)](#slash-commands-systembuilt-in)
3. [Skills](#skills)
4. [Agents](#agents)
5. [MCP Servers](#mcp-servers)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Hooks](#hooks)

---

## Slash Commands (Custom)

Custom slash commands defined in `.claude/commands/`. These are project-specific
commands.

> **Note (2026-01-20):** All custom commands have been migrated to skills format
> in `.claude/skills/` for better discoverability. Both `/command-name` and the
> skill invocation work identically.

### `/audit-code`

**Description:** Run a single-session code review audit **When to use:** When
you need a quick code quality check without multi-AI consensus **Example:**
`/audit-code` **Parameters:** None **Output:** Code review findings in session
output

### `/audit-documentation`

**Description:** Run a single-session documentation audit **When to use:** Check
for broken links, stale docs, coverage gaps **Example:** `/audit-documentation`
**Parameters:** None **Output:** Documentation issues and recommendations

### `/audit-performance`

**Description:** Run a single-session performance audit **When to use:** Quick
performance check for bundle size, rendering, data fetching **Example:**
`/audit-performance` **Parameters:** None **Output:** Performance findings with
severity ratings

### `/audit-process`

**Description:** Run a single-session process/automation audit **When to use:**
Check CI/CD pipelines, hooks, scripts effectiveness **Example:**
`/audit-process` **Parameters:** None **Output:** Process improvement
recommendations

### `/audit-refactoring`

**Description:** Run a single-session refactoring audit **When to use:**
Identify duplication, complexity issues, architecture improvements **Example:**
`/audit-refactoring` **Parameters:** None **Output:** Refactoring suggestions
with SonarQube integration

### `/audit-security`

**Description:** Run a single-session security audit **When to use:** Quick
security review for auth, input validation, secrets management **Example:**
`/audit-security` **Parameters:** None **Output:** Security findings with OWASP
compliance check

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
(patterns:check, review:check, lessons:surface)

### `/session-end`

**Description:** Complete verification steps before ending session **When to
use:** **END OF EVERY SESSION** - ensures all work is committed and tracked
**Example:** `/session-end` **Parameters:** None **Output:** Completion
checklist and session summary

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

#### `sonarcloud-sprint`

**Description:** Run a SonarCloud cleanup sprint. Fetches fresh issues via
public API (with dynamic pagination), generates a detailed report with code
snippets, creates cleanup branches following 5-PR structure, tracks fixes with
TodoWrite, runs pre-commit verification, and extracts post-PR learnings to
AI_LESSONS_LOG.md. Requires: `jq` for JSON parsing. **When to use:** Starting a
code quality cleanup sprint or when you need current snapshot of SonarCloud
issues **Example:** `/sonarcloud-sprint` or `/sonarcloud-sprint --report`
**Parameters:** Optional `--report` flag for report-only mode (no branch
creation)

#### `skill-creator`

**Description:** Guide for creating effective skills. Create new skills or
update existing ones that extend Claude's capabilities with specialized
knowledge, workflows, or tool integrations **When to use:** Creating or updating
a skill **Example:** Need custom workflow for specific task **Parameters:**
Skill requirements

#### `using-superpowers`

**Description:** Establishes how to find and use skills, requiring Skill tool
invocation before ANY response including clarifying questions **When to use:**
**START OF ANY CONVERSATION** - establishes skill usage patterns **Example:**
Auto-invoked at session start **Parameters:** None

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

#### `audit-code`

**Description:** Run single-session code review audit on the codebase **When to
use:** Quick code quality check **Example:** Pre-commit review **Parameters:**
None

#### `audit-documentation`

**Description:** Run single-session documentation audit on the codebase **When
to use:** Documentation health check **Example:** Quarterly doc review
**Parameters:** None

#### `audit-performance`

**Description:** Run single-session performance audit on the codebase **When to
use:** Performance analysis **Example:** Before release **Parameters:** None

#### `audit-process`

**Description:** Run single-session process and automation audit on the codebase
**When to use:** CI/CD health check **Example:** Pipeline optimization
**Parameters:** None

#### `audit-refactoring`

**Description:** Run single-session refactoring audit on the codebase **When to
use:** Code quality assessment **Example:** Technical debt review
**Parameters:** None

#### `audit-security`

**Description:** Run single-session security audit on the codebase **When to
use:** Security review **Example:** Pre-production security check
**Parameters:** None

### Session Management

#### `session-begin`

**Description:** Complete verification steps before starting any work session
**When to use:** **START OF EVERY SESSION** **Example:** First action in new
session **Parameters:** None

#### `session-end`

**Description:** Complete verification steps before ending the session **When to
use:** **END OF EVERY SESSION** **Example:** Final action before closing
**Parameters:** None

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

---

## MCP Servers

MCP (Model Context Protocol) servers provide external integrations and
capabilities.

### Active MCP Servers

#### `serena`

**Description:** Semantic code analysis and manipulation server. Provides
symbol-based code navigation, search, and editing capabilities. Essential for
intelligent codebase understanding. **When to use:** Code exploration, symbol
search, semantic editing, finding references **Tools Available:**

- `list_dir` - List directory contents
- `find_file` - Find files by pattern
- `search_for_pattern` - Search code with regex
- `get_symbols_overview` - Get file symbol overview
- `find_symbol` - Find code symbols by name path
- `find_referencing_symbols` - Find symbol references
- `replace_symbol_body` - Replace symbol code
- `insert_after_symbol` - Insert code after symbol
- `insert_before_symbol` - Insert code before symbol
- `rename_symbol` - Rename symbol across codebase
- `write_memory` - Save project context
- `read_memory` - Load project context
- `list_memories` - List saved memories
- `delete_memory` - Remove memory
- `edit_memory` - Update memory content
- `activate_project` - Switch project
- `get_current_config` - View configuration
- `check_onboarding_performed` - Check setup status
- `onboarding` - Initialize project
- `think_about_collected_information` - Reflection tool
- `think_about_task_adherence` - Task validation
- `think_about_whether_you_are_done` - Completion check
- `initial_instructions` - Get Serena manual

#### `sequential-thinking`

**Description:** Advanced problem-solving through structured chain-of-thought
reasoning. Enables dynamic, reflective thinking with revision and branching.
**When to use:** Complex problem-solving, multi-step analysis, situations
requiring course correction **Tools Available:**

- `sequentialthinking` - Execute structured reasoning with thought chains

#### `magic`

**Description:** UI component generation and logo search server. Creates React
components from descriptions and finds brand logos. **When to use:** Building UI
components, finding logos, getting design inspiration **Tools Available:**

- `21st_magic_component_builder` - Generate UI components from natural language
- `21st_magic_component_inspiration` - Get UI component inspiration from
  21st.dev
- `21st_magic_component_refiner` - Refine/improve existing UI components
- `logo_search` - Search and retrieve brand logos in JSX/TSX/SVG format

#### `context7`

**Description:** Library documentation and code example provider. Access
up-to-date documentation for any programming library or framework. **When to
use:** Learning new libraries, finding code examples, checking latest API
documentation **Tools Available:**

- `resolve-library-id` - Find Context7 library ID from package name
- `query-docs` - Retrieve documentation and examples for library

#### `playwright`

**Description:** Browser automation and testing server. Control browsers, take
screenshots, test web applications. **When to use:** E2E testing, web scraping,
UI testing, debugging web applications **Tools Available:**

- `browser_close` - Close browser
- `browser_resize` - Resize browser window
- `browser_console_messages` - Get console logs
- `browser_handle_dialog` - Handle browser dialogs
- `browser_evaluate` - Execute JavaScript in browser
- `browser_file_upload` - Upload files
- `browser_fill_form` - Fill form fields
- `browser_install` - Install browser
- `browser_press_key` - Keyboard input
- `browser_type` - Type text
- `browser_navigate` - Navigate to URL
- `browser_navigate_back` - Go back
- `browser_network_requests` - View network requests
- `browser_run_code` - Execute Playwright code
- `browser_take_screenshot` - Capture screenshot
- `browser_snapshot` - Accessibility snapshot
- `browser_click` - Click element
- `browser_drag` - Drag and drop
- `browser_hover` - Hover element
- `browser_select_option` - Select dropdown option
- `browser_tabs` - Manage browser tabs
- `browser_wait_for` - Wait for conditions

#### `ide`

**Description:** IDE integration server. Access VS Code diagnostics and execute
Jupyter notebook code. **When to use:** Getting language diagnostics, running
Python notebooks, IDE integration **Tools Available:**

- `getDiagnostics` - Get VS Code language diagnostics
- `executeCode` - Execute Python in Jupyter kernel

### Disabled MCP Servers

#### `rube` (DISABLED)

**Description:** Composio MCP server connecting 500+ apps (Slack, GitHub, Gmail,
etc.) for cross-app automation. **Currently disabled in settings.** **When to
use:** (Not available - disabled) **Tools Available:** (Server disabled)
**Note:** To enable, modify `.claude/settings.json` and remove from
`disabledMcpjsonServers` array

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

#### `session-start.sh`

**Description:** Main session startup hook. Runs validation scripts and
environment checks. **When triggered:** At the start of every Claude Code
session **What it does:**

- Validates project setup
- Checks dependencies
- Runs startup diagnostics **Location:** `.claude/hooks/session-start.sh`

#### `check-mcp-servers.sh`

**Description:** MCP server availability checker **When triggered:** At session
start (after session-start.sh) **What it does:**

- Verifies MCP servers are accessible
- Reports unavailable servers
- Validates MCP configuration **Location:** `.claude/hooks/check-mcp-servers.sh`
  **Status Message:** "Checking MCP availability..."

### PostToolUse Hooks

#### `check-write-requirements.sh`

**Description:** Agent requirement validator for Write tool **When triggered:**
After Write tool is used **What it does:**

- Checks if required agents were invoked
- Validates file write requirements
- Ensures proper review process **Location:**
  `.claude/hooks/check-write-requirements.sh` **Status Message:** "Checking
  agent requirements..."

#### `check-edit-requirements.sh`

**Description:** Agent requirement validator for Edit/MultiEdit tools **When
triggered:** After Edit or MultiEdit tool is used **What it does:**

- Validates edit requirements
- Ensures proper code review
- Checks agent invocation **Location:**
  `.claude/hooks/check-edit-requirements.sh` **Status Message:** "Checking agent
  requirements..."

#### `pattern-check.sh`

**Description:** Anti-pattern compliance checker **When triggered:** After
Write, Edit, or MultiEdit tools **What it does:**

- Scans modified files for known anti-patterns
- Reports pattern violations
- Enforces code quality standards **Location:** `.claude/hooks/pattern-check.sh`
  **Status Message:** "Checking pattern compliance..."

#### `coderabbit-review.sh`

**Description:** Automated CodeRabbit review invocation **When triggered:**
After Write, Edit, or MultiEdit tools **What it does:**

- Triggers CodeRabbit AI review
- Analyzes code changes
- Generates review feedback **Location:** `.claude/hooks/coderabbit-review.sh`
  **Status Message:** "Running CodeRabbit review..." **Note:** Uses `set -f` to
  prevent glob expansion

### UserPromptSubmit Hooks

#### `analyze-user-request.sh`

**Description:** Pre-task trigger analyzer **When triggered:** When user submits
a prompt **What it does:**

- Analyzes user request for trigger conditions
- Checks if specific agents/skills should be invoked
- Provides pre-task recommendations **Location:**
  `.claude/hooks/analyze-user-request.sh` **Status Message:** "Checking PRE-TASK
  triggers..."

---

## Usage Examples

### Example 1: Starting a Session

```bash
# Session start
/session-begin

# (Hooks automatically run: session-start.sh, check-mcp-servers.sh)
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
# AI uses serena MCP automatically:
"Find all usages of the UserAuth class"

# This triggers: mcp__serena__find_symbol with appropriate parameters
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
3. Check `.claude/commands/` for custom commands
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
3. Check `.claude/settings.json` for enabled/disabled servers
4. Serena MCP is essential for code navigation

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
| `/session-begin` | Slash    | Start session validation |
| `/session-end`   | Slash    | End session checklist    |
| `/commit`        | System   | Create git commit        |
| `/help`          | System   | Get help                 |
| `Tab`            | Keyboard | Auto-complete            |
| `Ctrl+C`         | Keyboard | Cancel/interrupt         |

### Most Used Agents

| Agent                | Purpose                        |
| -------------------- | ------------------------------ |
| `Explore`            | Find files and search codebase |
| `debugger`           | Debug errors and failures      |
| `code-reviewer`      | Review code quality            |
| `Plan`               | Design implementation plans    |
| `frontend-developer` | Build UI components            |
| `backend-architect`  | Design APIs and services       |

### Most Used Skills

| Skill                  | Purpose                     |
| ---------------------- | --------------------------- |
| `systematic-debugging` | Debug issues systematically |
| `code-reviewer`        | Comprehensive code review   |
| `frontend-design`      | Build polished UI           |
| `senior-fullstack`     | Full-stack development      |
| `sonarcloud-sprint`    | SonarCloud cleanup sprint   |
| `/session-begin`       | Session validation          |
| `/session-end`         | Session completion          |

### Active MCP Servers

| Server                | Main Purpose                       |
| --------------------- | ---------------------------------- |
| `serena`              | Code analysis and semantic editing |
| `sequential-thinking` | Complex problem-solving            |
| `magic`               | UI components and logos            |
| `context7`            | Library documentation              |
| `playwright`          | Browser automation                 |
| `ide`                 | IDE integration                    |

---

## Version History

| Version | Date       | Changes                                            |
| ------- | ---------- | -------------------------------------------------- |
| 1.3     | 2026-01-21 | Fix pr-review skill per Qodo review suggestions    |
| 1.2     | 2026-01-20 | Note custom commands migrated to skills format     |
| 1.1     | 2026-01-19 | Update sonarcloud-sprint with learnings extraction |
| 1.0     | 2026-01-10 | Initial comprehensive command reference created    |

---

**END OF COMMAND_REFERENCE.md**

This document is maintained locally and should be updated when:

- New slash commands are added
- Skills are created or modified
- Agents are added or updated
- MCP servers are configured or changed
- Hooks are added or modified
- New keyboard shortcuts are discovered
