# Findings: SQ10 (Part B) — Net-New Agent Ideas from Community Discovery

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-29
**Sub-Question IDs:** SQ10-B

---

## Research Scope

Investigated agent ideas not yet in SoNash's existing set (code-review,
security-audit, testing, frontend, debugging, documentation, dependency
management, explore, plan, research, synthesis). Sources spanned the skill.sh /
skills marketplaces, GitHub agent collections, official docs, dev blogs, HN
discussions, and Firebase/Next.js-specific resources.

---

## Key Findings

### 1. Firebase Official Agent Skills — 13 Purpose-Built Skills [CONFIDENCE: HIGH]

Firebase released an official set of 13 Agent Skills [1][2] that encode deep
platform expertise not available in generic agents. Skills include:

- `firebase-firestore-standard` — Firestore schema, Security Rules, query
  optimization
- `firebase-auth-basics` — Authentication setup and user management
- `firebase-app-hosting-basics` — Deployment of framework-backed apps
- `firebase-ai-logic-basics` — Gemini API integration with security guidance
- `developing-genkit-js` — Node.js/TypeScript AI agent and flow development
- `firebase-local-env-setup` — Dev environment configuration
- `firebase-data-connect-basics` — PostgreSQL-backed GraphQL apps

These use **progressive disclosure** — loading detailed instructions only when
needed, reducing token consumption vs. generic agents. They grade at 99/100 when
evaluated against the agent-skills specification [3].

**SoNash applicability: HIGH.** SoNash runs Firebase 12 with Firestore,
Authentication, and Cloud Functions. A dedicated Firebase agent encoding
security rules, cost-aware data modeling, and App Hosting patterns would prevent
the class of errors these skills are designed to catch.

---

### 2. Codebase Knowledge Graph Agent — Blast-Radius & Onboarding [CONFIDENCE: HIGH]

Two mature tools address pre-change impact analysis and codebase mapping:

**code-review-graph** [4]: Uses Tree-sitter to build a persistent SQLite graph
of all functions, classes, imports, and call relationships. Before any review,
traces the "blast radius" — all callers, dependents, and test files that could
be affected. Measured token reductions: 8.2x average across real repos (Flask:
9.1x, Gin: 16.4x).

**Understand-Anything** [5]: Multi-agent skill (5 sub-agents) that builds an
interactive knowledge graph with a React Flow dashboard. Commands:
`/understand-diff` (change impact), `/understand-chat` (architecture Q&A),
`/understand-onboard` (new developer guides), `/understand-dashboard` (visual
explorer).

**SoNash applicability: MEDIUM.** SoNash is a solo project with a single
developer who knows the codebase. However, the blast-radius pattern is valuable
before major refactors (e.g., Firebase SDK upgrades). The onboarding guide
generator is low-value for solo use but the impact analysis is worth having.

---

### 3. Parallel Code Review Panel — 9 Specialized Perspectives [CONFIDENCE: HIGH]

A community pattern [6] replaces single code-reviewer agents with 9 parallel
specialists, each with a narrow mandate:

1. **Test Runner** — executes tests, reports failures
2. **Linter & Static Analysis** — IDE diagnostics, type errors
3. **Code Reviewer** — top-5 concrete improvements by impact
4. **Security Reviewer** — injection, auth, credential exposure
5. **Quality & Style Reviewer** — complexity, dead code, duplication
6. **Test Quality Reviewer** — meaningful coverage, flakiness, over-mocking
7. **Performance Reviewer** — N+1 queries, memory leaks, blocking operations
8. **Dependency & Deployment Safety Reviewer** — breaking changes, migrations,
   backwards compatibility, observability gaps
9. **Simplification & Maintainability Reviewer** — premature abstractions,
   atomicity, YAGNI violations

SoNash already has `code-reviewer`. The **novel roles** not in SoNash's current
set are:

- **Dependency & Deployment Safety Reviewer** — checks breaking changes,
  database migrations, and observability before deploy
- **Test Quality Reviewer** — evaluates whether tests test behavior vs.
  implementation
- **Simplification & Maintainability Reviewer** — YAGNI/complexity police

**SoNash applicability: HIGH** for the Dependency Safety Reviewer. Firebase
schema migrations and Cloud Function breaking changes are a real risk in SoNash.

---

### 4. Self-Improving / Pattern-Promotion Agent [CONFIDENCE: MEDIUM]

A `self-improving-agent` skill [7][8] adds a meta-learning loop to Claude's
auto-memory:

- Analyzes MEMORY.md for patterns that have appeared 2-3+ times
- Promotes recurring patterns from MEMORY.md to CLAUDE.md as enforced rules
- Extracts proven solutions into reusable SKILL.md files
- Detects stale or obsolete memory entries

The `alirezarezvani/claude-skills` collection [9] includes a 7-skill
self-improving-agent pack: auto-memory curation, pattern promotion, skill
extraction.

**SoNash applicability: HIGH.** SoNash already has a rich MEMORY.md system and
CLAUDE.md behavioral rules. A pattern-promotion agent could automatically detect
when ad-hoc guidance in memory has stabilized into a rule worth formalizing.
This directly aligns with SoNash's existing session management architecture.

---

### 5. i18n / Localization Specialist Agent [CONFIDENCE: MEDIUM]

A dedicated i18n subagent [10] solves **context pollution** — translation
expertise polluting main Claude context. The pattern moves all `next-intl`
guidance, locale file conventions, and translation patterns into a dedicated
`.claude/agents/i18n-specialist.md`. The specialist runs in isolation whenever
translation tasks are delegated.

Community accessibility agents [11] extend this into RTL support, WCAG i18n
requirements, and multi-locale ARIA patterns across 79 specialized agents.

**SoNash applicability: LOW.** SoNash CLAUDE.md documents two-locale awareness
but no active i18n system is referenced in ROADMAP.md or SESSION_CONTEXT.md as a
priority feature.

---

### 6. Diagram / Architecture Visualization Agent [CONFIDENCE: HIGH]

Multiple production tools generate Excalidraw and Mermaid diagrams from code
[12][13]:

- **excalidraw-diagram-skill** [12]: Generates publication-ready architecture
  diagrams from code or natural language descriptions, includes a Playwright
  render pipeline for visual self-validation (catches overlapping text, broken
  arrows)
- **mcp_excalidraw** [13]: MCP server + Claude skill for real-time canvas sync,
  programmatic editing
- Listed in the "10 Must-Have Skills" article [14] as a top pick for
  communicating system design

**SoNash applicability: MEDIUM.** SoNash has no current diagram-generation
agent. Architecture decisions happen in planning docs. A diagram agent would
support `.planning/` artifacts and PR descriptions, but is not blocking any
active work.

---

### 7. Database Seed Data Generator Agent [CONFIDENCE: HIGH]

An official registry skill [15] on tessl.io enables Claude to:

- Analyze DB schema (tables, relationships, foreign keys)
- Generate realistic fake data using Faker libraries
- Maintain relational integrity (no orphaned records)
- Output SQL or JavaScript seed scripts

Triggered by: "seed database", "generate test data", "create seed script".

**SoNash applicability: MEDIUM.** SoNash's Firestore-based architecture does not
use relational schemas, but realistic test data generation for Firestore
collections (journal entries, inventory, daily logs) with valid references would
be valuable. The skill would need adaptation for Firestore document hierarchies
rather than SQL tables.

---

### 8. SRE Incident Response / Observability Agent [CONFIDENCE: HIGH]

Anthropic's official cookbook [16][17] documents two production-grade agents:

**Observability Agent**: Monitors GitHub/CI pipelines via MCP. Detects flaky
tests, failing CI runs, workflow anomalies, and provides actionable
recommendations. Uses Git MCP (13 tools) + GitHub MCP (100+ tools).

**SRE Incident Responder**: Full incident lifecycle — investigation → diagnosis
→ remediation → documentation. Queries Prometheus, reads configs, restarts
services via Docker, generates post-mortems. Safety via tool-level path scoping
and command allowlisting.

The VoltAgent `devops-incident-responder` subagent [18] provides a lighter-
weight version for non-infrastructure projects: production debugging, failure
diagnosis, postmortem generation.

**SoNash applicability: LOW.** SoNash is a solo hobby/side project without
Prometheus, PagerDuty, or production SRE infrastructure. However, the CI/CD
observability agent pattern (monitoring GitHub Actions health) could be adapted
for lightweight use.

---

### 9. React 19 / Server Components Specialist Agent [CONFIDENCE: MEDIUM]

The community has produced React 19-specific skills:

- **React-Claude-Skill-Package** [19]: 24 deterministic skills covering React
  18/19, hooks, Server Components, concurrent patterns, performance
- **Vercel's react-best-practices** [20]: Official Vercel Agent Skill encoding
  RSC patterns, minimizing Client Components, Server Action forms,
  `useActionState`
- MCPmarket's `react-19-patterns` skill: compiler-friendly code patterns,
  optimistic UI, TanStack Query vs. RSC tradeoffs

These are skills rather than agents, but can be wrapped into an agent with React
19-specific tool access (no network writes, read-only for auditing).

**SoNash applicability: HIGH.** SoNash runs React 19.2.4 — newer than training
data. A React 19 specialist agent that encodes the actual patterns for this
version (not hallucinated React 18 patterns) would directly improve code quality
for all frontend work.

---

### 10. Workflow Phase Agents (Requirement Analyzer, Scope Discoverer, Acceptance Test Generator) [CONFIDENCE: MEDIUM]

The `shinpr/claude-code-workflows` system [21] introduces agents not found in
SoNash's current set:

- **requirement-analyzer** — determines task complexity, selects appropriate
  workflow (1-file → direct, 3-5 files → design doc, 6+ → PRD)
- **scope-discoverer** — identifies functional scope from existing code
- **acceptance-test-generator** — creates test scaffolds from requirements
- **design-sync** — detects inconsistencies across multiple design documents
- **quality-fixer** — runs tests, fixes type errors, handles linting loops

The `zhsama/claude-sub-agent` system [22] adds quality gates (95% planning
threshold, 80% implementation threshold) enforced between phases.

**SoNash applicability: MEDIUM.** SoNash has plan/explore/synthesis but lacks
the quality-gate agents. A `quality-fixer` agent (run tests + fix lint loop) and
`acceptance-test-generator` could supplement the existing test-engineer without
overlapping it.

---

### 11. API Documentation / OpenAPI Generator Agent [CONFIDENCE: MEDIUM]

The `api-documenter` subagent [23] and `openapi-spec-generation` skill [24]
handle:

- Generating OpenAPI 3.1 specs from existing routes
- Creating SDK documentation with versioning examples
- Design-first spec → client generation pipeline

The VoltAgent collection includes this under "Specialized Domains".

**SoNash applicability: LOW.** SoNash uses Cloud Functions as its API layer.
Cloud Functions triggered by Firebase SDKs do not expose REST routes in a way
that benefits from OpenAPI generation. Low priority.

---

### 12. Prompt Engineer / LLM Integration Specialist Agent [CONFIDENCE: MEDIUM]

A dedicated `prompt-engineer` subagent [25][26] covers:

- Chain-of-Thought, Tree-of-Thoughts, ReAct, Self-Consistency techniques
- Structured output engineering for LLM responses
- Prompt evaluation and A/B comparison
- Multi-agent system design patterns

**SoNash applicability: LOW.** SoNash does not appear to have an LLM feature
layer or AI-powered user features in the current roadmap that would require
systematic prompt engineering.

---

### 13. Meta-Orchestration / Agent Organizer [CONFIDENCE: MEDIUM]

The `agent-organizer` pattern [27][28] is a master coordinator that:

- Analyzes project complexity to select 1-3 appropriate sub-agents
- Delegates tasks to specialist agents based on context
- Synthesizes results from multiple parallel agents
- Routes to correct team composition automatically

This is different from SoNash's existing orchestration patterns in that it
handles **auto-selection** of which agents to invoke rather than requiring
explicit invocation.

**SoNash applicability: MEDIUM.** SoNash already has a research-plan-team and
skill-based orchestration. An agent-organizer could reduce manual
skill-selection overhead for complex multi-file tasks.

---

### 14. Persistent Session Memory Agent (claude-mem pattern) [CONFIDENCE: MEDIUM]

The `claude-mem` plugin [29] implements progressive-disclosure session memory:

- Captures tool usage observations via lifecycle hooks during sessions
- Compresses sessions using Claude's Agent SDK (AI-generated summaries)
- Stores in SQLite + vector search (Chroma) for semantic retrieval
- Injects relevant past context on session start (50-100 tokens for index,
  500-1000 tokens per matched session)
- Achieves ~10x token savings vs. loading full history

**SoNash applicability: MEDIUM.** SoNash already has MEMORY.md and a manual
memory system. The claude-mem approach would be additive — automating the
capture of session observations that currently require manual documentation. The
vector search retrieval is more sophisticated than SoNash's current file- based
memory. Could conflict with or complement existing memory patterns.

---

### 15. Accessibility Specialist Agent [CONFIDENCE: HIGH]

The `Community-Access/accessibility-agents` repo [11] provides 79 specialized
agents across teams:

- **Web Accessibility Team**: aria-specialist, modal-specialist,
  contrast-master, keyboard-navigator, live-region-controller, forms-specialist,
  alt-text-headings, link-checker
- **GitHub Workflow Team**: pr-review, issue-tracker, daily-briefing, repo-admin
- All enforce WCAG 2.2 AA compliance

The `accessibility-specialist` subagent on buildwithclaude.com is the simpler
single-agent version — audits WCAG compliance, generates appropriate ARIA
labels, checks color contrast, tab order, and focus management.

**SoNash applicability: MEDIUM.** SoNash has a frontend-developer agent but no
dedicated accessibility agent. Given React 19 + Tailwind 4, new components can
easily drift from WCAG compliance without automated checks. An accessibility
reviewer as a post-task agent (alongside code-reviewer) would catch regressions.

---

## TOP 10 Rankings by Value for SoNash

| Rank | Agent / Pattern                    | Applicability | Reasoning                                                                 |
| ---- | ---------------------------------- | ------------- | ------------------------------------------------------------------------- |
| 1    | Firebase Official Agent Skills     | HIGH          | Direct stack match; encodes Security Rules, Firestore, Auth patterns      |
| 2    | Self-Improving / Pattern Promotion | HIGH          | Directly enhances SoNash's existing MEMORY.md + CLAUDE.md system          |
| 3    | React 19 Specialist                | HIGH          | React 19.2.4 is post-training; specialist prevents version mismatch       |
| 4    | Dependency & Deployment Safety     | HIGH          | Firebase schema changes and Cloud Function breaking changes are real risk |
| 5    | Parallel Review Panel (extended)   | HIGH          | Test Quality + Simplification reviewers not in current set                |
| 6    | Codebase Knowledge Graph           | MEDIUM        | Blast-radius analysis before major refactors; onboarding docs             |
| 7    | Database Seed Data Generator       | MEDIUM        | Firestore-adapted test data generation for dev/testing environments       |
| 8    | Accessibility Specialist           | MEDIUM        | Post-task WCAG audit for React 19 + Tailwind 4 components                 |
| 9    | Acceptance Test Generator          | MEDIUM        | Scaffold tests from requirements; complements existing test-engineer      |
| 10   | Architecture Diagram Generator     | MEDIUM        | Excalidraw diagrams for planning docs and PR descriptions                 |

---

## Sources

| #   | URL                                                                                                                            | Title                                                   | Type           | Trust  | CRAAP Avg | Date      |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | -------------- | ------ | --------- | --------- |
| 1   | https://firebase.google.com/docs/ai-assistance/agent-skills                                                                    | Firebase Agent Skills                                   | official-docs  | HIGH   | 4.8       | 2026-02   |
| 2   | https://firebase.blog/posts/2026/02/ai-agent-skills-for-firebase/                                                              | Better code, fewer tokens: Agent Skills for Firebase    | official-blog  | HIGH   | 4.6       | 2026-02   |
| 3   | https://github.com/SpillwaveSolutions/using-firebase/issues/13                                                                 | Agent Skill Grading Report: using-firebase Score 99/100 | community      | MEDIUM | 3.8       | 2026      |
| 4   | https://github.com/tirth8205/code-review-graph                                                                                 | code-review-graph: Persistent codebase map              | community      | MEDIUM | 4.2       | 2025-2026 |
| 5   | https://github.com/Lum1104/Understand-Anything                                                                                 | Understand-Anything: Interactive knowledge graph        | community      | MEDIUM | 4.0       | 2025-2026 |
| 6   | https://hamy.xyz/blog/2026-02_code-reviews-claude-subagents                                                                    | 9 Parallel AI Agents That Review My Code                | community-blog | MEDIUM | 4.0       | 2026-02   |
| 7   | https://github.com/alirezarezvani/claude-skills/tree/main/engineering-team/self-improving-agent                                | Self-Improving Agent Skills                             | community      | MEDIUM | 3.8       | 2026      |
| 8   | https://addyosmani.com/blog/self-improving-agents/                                                                             | Self-Improving Coding Agents (Addy Osmani)              | expert-blog    | HIGH   | 4.4       | 2026      |
| 9   | https://github.com/alirezarezvani/claude-skills                                                                                | +192 Claude Code Skills Collection                      | community      | MEDIUM | 4.0       | 2026      |
| 10  | https://www.solberg.is/i18n-subagent                                                                                           | Create an i18n specialist with Claude Code subagents    | community-blog | MEDIUM | 3.8       | 2025      |
| 11  | https://github.com/Community-Access/accessibility-agents                                                                       | Accessibility Agents: 79 WCAG specialists               | community      | MEDIUM | 4.0       | 2026      |
| 12  | https://github.com/coleam00/excalidraw-diagram-skill                                                                           | excalidraw-diagram-skill                                | community      | MEDIUM | 3.8       | 2026      |
| 13  | https://github.com/yctimlin/mcp_excalidraw                                                                                     | MCP server + Claude Code skill for Excalidraw           | community      | MEDIUM | 3.8       | 2026      |
| 14  | https://medium.com/@unicodeveloper/10-must-have-skills-for-claude-and-any-coding-agent-in-2026-b5451b013051                    | 10 Must-Have Skills for Claude in 2026                  | community-blog | MEDIUM | 3.6       | 2026-03   |
| 15  | https://tessl.io/registry/skills/github/jeremylongshore/claude-code-plugins-plus-skills/Generating%20Database%20Seed%20Data    | Generating Database Seed Data skill                     | community      | MEDIUM | 3.8       | 2026      |
| 16  | https://platform.claude.com/cookbook/claude-agent-sdk-02-the-observability-agent                                               | The Observability Agent (Anthropic Cookbook)            | official-docs  | HIGH   | 4.8       | 2026      |
| 17  | https://platform.claude.com/cookbook/claude-agent-sdk-03-the-site-reliability-agent                                            | The SRE Incident Response Agent (Anthropic Cookbook)    | official-docs  | HIGH   | 4.8       | 2026      |
| 18  | https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/03-infrastructure/devops-incident-responder.md | DevOps Incident Responder subagent                      | community      | MEDIUM | 3.8       | 2026      |
| 19  | https://github.com/OpenAEC-Foundation/React-Claude-Skill-Package                                                               | React 18 & 19 Skill Package (24 skills)                 | community      | MEDIUM | 4.0       | 2026      |
| 20  | https://vercel.com/blog/introducing-react-best-practices                                                                       | Vercel React Best Practices Agent Skill                 | official-blog  | HIGH   | 4.6       | 2026      |
| 21  | https://github.com/shinpr/claude-code-workflows                                                                                | claude-code-workflows: Phase-based agent system         | community      | MEDIUM | 4.0       | 2026      |
| 22  | https://github.com/zhsama/claude-sub-agent                                                                                     | AI-driven workflow with quality gates                   | community      | MEDIUM | 3.8       | 2025      |
| 23  | https://subagents.app/agents/api-docs                                                                                          | API Documentation subagent                              | community      | MEDIUM | 3.6       | 2026      |
| 24  | https://fastmcp.me/skills/details/448/openapi-spec-generation                                                                  | OpenAPI Spec Generation skill                           | community      | MEDIUM | 3.6       | 2026      |
| 25  | https://www.claudedirectory.org/agents/prompt-engineer                                                                         | Prompt Engineer agent                                   | community      | MEDIUM | 3.4       | 2026      |
| 26  | https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/05-data-ai/prompt-engineer.md                  | Prompt Engineer subagent definition                     | community      | MEDIUM | 3.6       | 2026      |
| 27  | https://github.com/lst97/claude-code-sub-agents                                                                                | Full-stack subagents with agent-organizer               | community      | MEDIUM | 4.0       | 2026      |
| 28  | https://github.com/wshobson/agents                                                                                             | Multi-agent orchestration for Claude Code               | community      | MEDIUM | 4.0       | 2026      |
| 29  | https://github.com/thedotmack/claude-mem                                                                                       | claude-mem: Persistent session memory plugin            | community      | MEDIUM | 3.8       | 2026      |
| 30  | https://github.com/VoltAgent/awesome-claude-code-subagents                                                                     | 127+ specialized Claude Code subagents (VoltAgent)      | community      | MEDIUM | 4.2       | 2026      |

---

## Contradictions

**Agent auto-delegation reliability**: The HN discussion on subagent
introduction [ref: HN item 44686726] surfaced a persistent contradiction between
the documentation promise ("Claude automatically delegates when it matches an
agent's description") and practitioner experience ("Claude often completes the
task itself rather than delegating"). This creates uncertainty about how
reliably novel agents would be invoked without explicit user prompting. **This
affects all agent applicability ratings** — agents are only valuable if they are
actually invoked.

**Context pollution vs. context isolation**: Blog posts praise subagents for
solving context pollution, but practitioners note that spawning multiple agents
multiplies token usage 4-7x. For SoNash as a solo project on a usage-limited
plan, the token cost of extensive agent delegation may outweigh the context
isolation benefit in some scenarios.

---

## Gaps

- **Reddit r/ClaudeAI thread search** returned no direct community discussion
  links — Reddit content is not indexable by web search in a granular way. The
  HN discussion (item 44686726) provided the closest community signal.
- **skill.sh itself** — the original query target — does not appear to be a live
  marketplace as of March 2026. Several marketplaces have emerged (SkillsMP,
  SkillHub, claudemarketplaces.com, tessl.io) with 500k+ to 7k+ skills
  respectively, but none appears to be operating under the domain "skill.sh".
  The closest matches are GitHub-hosted collections.
- **Tailwind 4-specific agents** — no dedicated Tailwind 4 / CSS variables /
  @theme agent was found. The Tailwind CSS expert agent in the flyingwebie
  collection appears to be Tailwind 3-era. A Tailwind 4 specialist for the
  CSS-variable-based configuration system would need custom authoring.
- **Next.js 16-specific agents** — Next.js 16 is newer than most agent
  collections. The available Next.js agents (VoltAgent, Vercel skills) target
  Next.js 13-15 App Router patterns. The gap between available agents and
  SoNash's actual Next.js 16.2.0 version means any Next.js agent would require
  verification and possibly custom updates.
- **Firebase 12 agent specifics** — Firebase's official 13 skills target the
  current Firebase SDK but may not have been updated for Firebase 12.10.0
  specifically. This was not confirmed.
- **Discord channel content** — Claude Code Discord is not publicly searchable
  and was not accessible in this research pass.

---

## Serendipity

**code-review-graph blast-radius analysis** — this is more than an agent; it is
a fundamentally different architecture for how Claude reads code. The 8-49x
token reduction by tracing only affected files before review has implications
for SoNash's existing code-reviewer agent. The pattern of "build a structural
graph before reviewing" could be incorporated into SoNash's existing review
workflow without creating a new agent.

**Quality gates between workflow phases** — the `zhsama/claude-sub-agent`
system's 95% threshold for planning and 80% threshold for implementation before
proceeding represents a convergence-loop pattern implemented at the agent level.
This is philosophically aligned with SoNash's T3 convergence loops and the
feedback that "every significant pass must loop internally until converged."
Implementing quality-gate thresholds as explicit agent contracts (not just
behavioral rules) may be a useful pattern to adopt.

**Self-Improving Agent as SoNash MEMORY.md enhancement** — the pattern-promotion
agent (MEMORY.md → CLAUDE.md promotion) directly addresses a known SoNash gap:
behavioral rules are manually authored. The `alirezarezvani/claude-skills`
self-improving pack could provide the automation layer that SoNash's session-end
workflow currently lacks for systematic rule graduation.

**Accessibility as a hidden debt vector** — the Community-Access accessibility
repo notes that AI coding tools "stop generating inaccessible code" as their
mission. Given SoNash's frontend development velocity with React 19 + Tailwind
4, WCAG regressions introduced during rapid UI iteration represent a silent debt
accumulation that no current SoNash agent catches.

---

## Confidence Assessment

- HIGH claims: 7 (Firebase skills, blast-radius graph, 9-panel review, diagram
  agent, seed data generator, SRE agents, React 19 specialist)
- MEDIUM claims: 8 (self-improving, i18n, phase agents, API docs, prompt
  engineer, meta-orchestrator, session memory, accessibility)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **MEDIUM-HIGH** (most findings backed by 2+ sources
  including official docs or high-quality community posts from 2026; main
  uncertainty is around agent auto-delegation reliability in practice)
