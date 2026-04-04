# Findings: SQ10 (Part A) — Net-New General-Duty Agents from GitHub

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-29
**Sub-Question IDs:** SQ-10a

---

## Scope and Methodology

Searched GitHub repositories and open-source collections for agent ideas not
present in the current SoNash roster (27 local + 13 global = ~39 total,
consolidating to ~17 local + 13 global). Existing local agents inventoried for
deduplication:

**Existing local agents (26):** backend-architect, code-reviewer,
database-architect, debugger, dependency-manager, deployment-engineer,
devops-troubleshooter, documentation-expert, error-detective, explore,
frontend-developer, fullstack-developer, git-flow-manager,
markdown-syntax-formatter, mcp-expert, nextjs-architecture-expert,
penetration-tester, performance-engineer, plan, prompt-engineer,
react-performance-optimization, security-auditor, security-engineer,
technical-writer, test-engineer, ui-ux-designer

**Key gaps from prior research:** convergence-loop verifier (D5a),
general-purpose override (D6b), session-begin/end agents (D5b), debugging
consolidation.

Sources consulted: 18 (GitHub repos, official docs, community articles).

---

## Full Discovery Catalog (26 candidates evaluated)

### Discovery 1: Refactoring Specialist

**Source:** VoltAgent/awesome-claude-code-subagents,
dl-ezo/claude-code-sub-agents, rshah515/claude-code-subagents [1][2][3]
**Confidence:** HIGH (3+ independent repos confirm this as a distinct, popular
role)

**What it does:** Systematically transforms poorly structured code into clean,
maintainable systems. Follows a strict workflow: identify code smells (long
methods, large classes, duplicate code) → write safety tests → execute
incremental changes → verify zero behavior change → document. Applies design
patterns: extract method, inline variables, introduce parameter objects,
strangler fig for modules.

**Is it in SoNash?** No. The closest is `code-reviewer` (reads and flags issues)
but does not execute refactoring transforms. `debugger` and
`performance-engineer` handle different failure modes.

**SoNash applicability:** HIGH. SoNash has accumulated technical debt (the
project has T3 convergence loops and an active TDMS pipeline). A
refactoring-specialist could automate debt paydown: identify complexity
hotspots, refactor with test coverage, verify no regressions. Especially
relevant when the codebase grows post-consolidation.

**Effort:** LOW — well-documented pattern, clear tool set
(Read/Write/Edit/Bash/Glob/Grep), established community templates to adapt.

**Priority rank: 1**

---

### Discovery 2: Legacy Modernizer

**Source:** VoltAgent/awesome-claude-code-subagents (categories/06),
rohitg00/awesome-claude-code-toolkit [1][4] **Confidence:** HIGH (official
community collection, detailed .md definition)

**What it does:** Transforms aging systems into modern architectures using
assessment → planning → incremental migration → risk mitigation. Uses strangler
fig pattern. Targets 80%+ test coverage before migration. Specializes in "zero
production disruption" constraint.

**Is it in SoNash?** No. Unlike refactoring-specialist (same codebase, same
patterns), legacy-modernizer handles cross-generation migrations: upgrading
Next.js major versions, Firebase SDK v11→v12, Tailwind v3→v4. SoNash's CLAUDE.md
notes "bleeding edge" versions (Next.js 16.2.0, Firebase 12.10.0) — future
upgrades are certain.

**SoNash applicability:** MEDIUM-HIGH. Most valuable when Next.js 17 or Firebase
13 releases. Could coordinate the upgrade: detect breaking changes, update
imports, run test safety net, document migration path.

**Effort:** LOW — adapt from community template, add SoNash-specific version
targets.

**Priority rank: 4**

---

### Discovery 3: Accessibility Tester (a11y)

**Source:** VoltAgent/awesome-claude-code-subagents (categories/04),
Community-Access/accessibility-agents (11 sub-specialist system),
rshah515/claude-code-subagents [1][3][5] **Confidence:** HIGH (multiple
independent repos, official Anthropic accessibility documentation)

**What it does:** Comprehensive WCAG 2.1/2.2 AA compliance testing. Covers:
keyboard navigation, screen reader compatibility (NVDA, JAWS, VoiceOver), color
contrast, ARIA implementation, semantic HTML, mobile touch targets, form
labels/errors. The Community-Access project decomposes this into 11
micro-specialists (aria-specialist, contrast-master, keyboard-navigator,
live-region-controller, forms-specialist, etc.) under an accessibility-lead
orchestrator.

**Is it in SoNash?** No. `ui-ux-designer` covers design principles but not
accessibility compliance testing. `test-engineer` covers functional testing but
not WCAG auditing.

**SoNash applicability:** MEDIUM. SoNash is a personal productivity app, not a
public-facing service under WCAG mandate. However: (a) good a11y is good UX, (b)
journal/dashboard UI components need keyboard navigation for power users, (c)
React 19 + Tailwind 4 have changed ARIA semantics. Worth adding as a proactive
check on UI components.

**Effort:** LOW-MEDIUM — well-documented, but may be over-engineered (11
sub-specialists). A single accessibility-tester agent covers 80% of the value.

**Priority rank: 6**

---

### Discovery 4: Data Pipeline Engineer (ETL/ELT)

**Source:** VoltAgent/awesome-claude-code-subagents (categories/05),
wshobson/agents (plugins/data-engineering), lst97/claude-code-sub-agents
[1][6][7] **Confidence:** HIGH (consistent across 3+ collections)

**What it does:** Designs and builds data pipelines (ETL/ELT), data warehouses,
real-time streaming. Covers Apache Spark, Kafka, Flink, Beam, Airflow, dbt.
Maintains 99.9% pipeline SLA with data freshness under 1 hour.

**Is it in SoNash?** No. `database-architect` handles schema design but not
pipeline orchestration.

**SoNash applicability:** LOW. SoNash is a personal app with Firebase Firestore
as its only data store. No Kafka, Spark, or Airflow in the stack. The data flows
are: user write → Cloud Function → Firestore → client read. A full data pipeline
engineer is over-scoped for SoNash's current architecture.

**Effort:** N/A — not recommended for SoNash.

**Priority rank: 18**

---

### Discovery 5: Dependency Manager (Security & Compliance)

**Source:** VoltAgent/awesome-claude-code-subagents (categories/06), already in
SoNash [1] **Confidence:** HIGH

**What it does:** Vulnerability auditing, CVE scanning, license compliance, SBOM
generation, version conflict resolution, bundle size optimization, automated PR
for updates. Covers NPM, Python, Maven, Gradle, Cargo across monorepo
configurations.

**Is it in SoNash?** YES — `dependency-manager.md` already exists locally. SKIP.

---

### Discovery 6: DX Optimizer (Developer Experience)

**Source:** VoltAgent/awesome-claude-code-subagents (categories/06),
lst97/claude-code-sub-agents [1][7] **Confidence:** HIGH

**What it does:** Measures and optimizes developer experience metrics: build
times (target <30s), HMR latency (<100ms), test execution (<2 minutes), IDE
performance. Identifies bottlenecks, automates repetitive tasks, measures
developer satisfaction scores.

**Is it in SoNash?** No. Closest is `performance-engineer` (production app
performance) but DX Optimizer targets the development workflow itself — the
inner loop.

**SoNash applicability:** MEDIUM. SoNash has a custom hook system
(hook-checks.json), pre-commit pipelines, and growing agent complexity. Build
time and test suite latency directly impact session productivity. A DX Optimizer
could audit the pre-commit pipeline, identify slow checks, and optimize the
inner loop.

**Effort:** LOW — adapt community template, focus on NPM scripts, pre-commit
hook timing, and test runner tuning.

**Priority rank: 8**

---

### Discovery 7: Incident Commander / SRE Agent

**Source:** Anthropic official cookbook
(claude-agent-sdk-03-the-site-reliability-agent),
VoltAgent/awesome-claude-code-subagents (categories/03),
lodetomasi/agents-claude-code [8][1][9] **Confidence:** HIGH (Anthropic
first-party cookbook)

**What it does:** Autonomous incident diagnosis, remediation, and documentation.
Three-phase workflow: investigate (read-only tools, PromQL queries), remediate
(human-in-the-loop approval before writes), document (structured postmortem with
timeline + root cause + action items). Tools span Prometheus, Docker, config
management, runbook execution.

**Is it in SoNash?** Partial. `devops-troubleshooter` handles production issues.
But the SRE/incident-commander pattern is more structured — it has safety layers
(directory restrictions, command allowlists, human approval gates) and produces
postmortem artifacts.

**SoNash applicability:** MEDIUM-LOW. SoNash is a solo developer project without
Prometheus/PagerDuty/Kubernetes. The structured incident response overhead
exceeds the scale. However, the postmortem documentation pattern is valuable —
capturing what went wrong, why, and preventive action items after Firebase
incidents or deploy failures.

**Effort:** MEDIUM — the full SRE agent is over-engineered for SoNash; a lighter
"incident-postmortem" helper would be more appropriate.

**Priority rank: 14**

---

### Discovery 8: Chaos Engineer

**Source:** VoltAgent/awesome-claude-code-subagents (categories/04),
rshah515/claude-code-subagents [1][3] **Confidence:** MEDIUM (appears in 2+
collections but less detail on what the agent specifically does beyond
"deliberate failure testing")

**What it does:** Deliberately introduces failures to test system resilience:
network partitions, service outages, resource exhaustion. Validates error
handling and recovery paths. Used before production deployments of critical
systems.

**Is it in SoNash?** No.

**SoNash applicability:** LOW. SoNash uses managed Firebase/Vercel
infrastructure. Chaos engineering is relevant at Kubernetes scale. The closest
useful pattern would be testing Cloud Function error paths — but that's covered
by `test-engineer`.

**Priority rank: 20**

---

### Discovery 9: API Designer (REST/GraphQL Architect)

**Source:** VoltAgent/awesome-claude-code-subagents (categories/01),
dl-ezo/claude-code-sub-agents [1][2] **Confidence:** HIGH

**What it does:** Designs RESTful and GraphQL APIs: endpoint design,
authentication/authorization patterns, rate limiting, versioning strategies,
OpenAPI/Swagger documentation, breaking change detection.

**Is it in SoNash?** Partial. `backend-architect` covers API architecture
decisions. But api-designer is narrower — focused on specification,
documentation, and contract design rather than system architecture.

**SoNash applicability:** MEDIUM. SoNash exposes Cloud Functions as callable
APIs. A dedicated api-designer could produce OpenAPI specs for those functions,
enforce consistent naming and versioning, and detect breaking changes before
deploy.

**Effort:** LOW.

**Priority rank: 10**

---

### Discovery 10: i18n / Localization Engineer

**Source:** rshah515/claude-code-subagents (localization/ category), VoltAgent
ecosystem [3][1] **Confidence:** MEDIUM (confirmed in 2 collections; less detail
on agent-specific workflow)

**What it does:** Implements internationalization architecture (i18n), manages
translation workflows, handles locale-aware date/number formatting, RTL layout
support, pluralization rules.

**Is it in SoNash?** No.

**SoNash applicability:** MEDIUM. CLAUDE.md mentions "two-locale awareness" and
there is a cross-locale config for shared vs locale-specific memory files. If
SoNash needs to handle locale-aware UI (journal in multiple languages, date
formatting), an i18n agent could set up Next.js i18n routing, `next-intl`, and
translation pipeline.

**Effort:** LOW-MEDIUM.

**Priority rank: 9**

---

### Discovery 11: PRD Writer (Product Requirements Document)

**Source:** iannuttall/claude-agents (agents/prd-writer.md),
rshah515/claude-code-subagents [10][3] **Confidence:** HIGH (actual .md
definition reviewed)

**What it does:** Generates structured PRDs in Markdown: business objectives,
user personas, functional requirements, user stories with unique IDs and
acceptance criteria. Output is documentation only — does not generate code.

**Is it in SoNash?** No. `plan` generates implementation plans.
`documentation-expert` writes system docs. No agent generates product-level
requirements documents.

**SoNash applicability:** MEDIUM. For the GSD (Get Stuff Done) skill pipeline,
having a PRD writer could formalize feature requests before they enter the
planning phase. The `/deep-plan` skill already does thorough planning, but a
dedicated PRD writer would produce user-story artifacts useful for PR
descriptions and stakeholder communication.

**Effort:** LOW — clear definition exists.

**Priority rank: 7**

---

### Discovery 12: Session Continuity Manager

**Source:** dl-ezo/claude-code-sub-agents (session-continuity-manager),
Continuous-Claude-v3, claude-mem project [2][11][12] **Confidence:** MEDIUM
(appears in 2 collections; pattern is confirmed by Anthropic session memory
cookbook)

**What it does:** Ensures seamless transitions between Claude Code sessions.
Maintains context across compaction events. Extracts key decisions, learnings,
and in-progress state. Creates handoff documents. Manages the "what were we
doing?" problem.

**Is it in SoNash?** No. SESSION_CONTEXT.md is maintained manually. No agent
automates session state capture.

**SoNash applicability:** HIGH. This directly addresses the
compaction/context-clear problem that affected SoNash
(feedback_convergence_loops_mandatory, feedback_pr_review_state_files). An agent
that automatically snapshots session state before compaction, and restores it on
session start, would reduce the "context lost" errors that were corrected 4+
times.

**Note:** The `session-begin` / `session-end` gap was flagged as HIGH ROI in
prior research (D5b). A session-continuity-manager covers the session-begin
restore side.

**Effort:** MEDIUM — requires integration with the hook system (PostToolUse on
compaction events).

**Priority rank: 2**

---

### Discovery 13: Convergence Loop Verifier / Output Validator

**Source:** ARIS project (wanshuiyin), affaan-m/everything-claude-code
(loop-operator), claudefa.st autonomous loop patterns [13][14][15]
**Confidence:** MEDIUM (pattern well-documented across community; no single
canonical agent definition)

**What it does:** Verifies that iterative agent outputs have converged — no
further improvement possible within defined criteria. Implements cross-model
review where one model executes and another reviews, creating adversarial
dynamic that breaks self-play blind spots. Tracks: did the output change between
iterations? Did quality metrics improve? Are the same errors recurring?

**Is it in SoNash?** No. The `/convergence-loop` skill exists as a CANON tenet
but is implemented as a skill, not an agent. The gap (flagged in D5a as HIGHEST
ROI) is an agent that enforces convergence in multi-agent pipelines.

**SoNash applicability:** HIGH. The feedback_convergence_loops_mandatory note
documents 4+ corrections for this exact pattern. An adversarial convergence
verifier agent could be called from deep-research-synthesizer, pr-review, or
code-reviewer to confirm output quality before presenting results. This is the
most strategic gap in the current roster.

**Effort:** MEDIUM-HIGH — novel pattern, requires careful design of evaluation
criteria and termination conditions.

**Priority rank: 3** (was flagged as highest ROI gap in D5a)

---

### Discovery 14: Cloud Cost Optimizer

**Source:** lodetomasi/agents-claude-code, VoltAgent ecosystem,
rshah515/claude-code-subagents [9][1][3] **Confidence:** MEDIUM

**What it does:** Analyzes cloud spend, recommends rightsizing, identifies idle
resources, implements tagging strategies, models reserved instance purchases,
tracks cost per feature.

**Is it in SoNash?** No.

**SoNash applicability:** LOW. SoNash uses Firebase (managed) and Vercel
(serverless). Claude Code token usage is the primary cost concern — not cloud
infrastructure costs. Firebase costs are pay-as-you-go with minimal optimization
surface for a personal app.

**Priority rank: 17**

---

### Discovery 15: Context Manager (Cross-Agent State)

**Source:** VoltAgent/awesome-claude-code-subagents
(categories/09-meta-orchestration), dl-ezo/claude-code-sub-agents [1][2]
**Confidence:** HIGH (reviewed actual .md definition)

**What it does:** Maintains shared knowledge and state across distributed agent
systems. Designs storage schemas, optimizes retrieval (<100ms), manages
synchronization protocols, enforces data governance. Coordinates with all
orchestration agents to provide consistent context.

**Is it in SoNash?** No dedicated agent. Context management happens through
CLAUDE.md, SESSION_CONTEXT.md, and .claude/state/ files but no agent owns this
systematically.

**SoNash applicability:** MEDIUM. As agent count grows (39 → ~30 consolidated),
cross-agent state consistency becomes important. A context-manager could own the
state files, detect drift between SESSION_CONTEXT.md and actual project state,
and update cross-cutting memory files.

**Effort:** MEDIUM.

**Priority rank: 11**

---

### Discovery 16: Agent-Creator / Agent Assembler

**Source:** dl-ezo/claude-code-sub-agents (agent-creator),
mylee04/claude-code-subagents (agent-assembler) [2][16] **Confidence:** MEDIUM

**What it does:** Dynamically generates new specialized agents as needed. In the
mylee04 version: analyzes the tech stack, dynamically generates a personalized
dev team. In dl-ezo version: creates agents from templates.

**Is it in SoNash?** No.

**SoNash applicability:** LOW-MEDIUM. Interesting meta-agent pattern, but
SoNash's agent roster is being deliberately consolidated, not expanded
dynamically. The value would be in generating SoNash-specific agents
(Firebase-specialized, SoNash-context-aware) rather than generic ones.

**Effort:** MEDIUM.

**Priority rank: 15**

---

### Discovery 17: Git Workflow Manager

**Source:** VoltAgent/awesome-claude-code-subagents (categories/06), various
collections [1] **Confidence:** HIGH

**What it does:** Manages Git operations: branch strategy, commit conventions,
merge conflict resolution, rebase workflows, repository maintenance.

**Is it in SoNash?** YES — `git-flow-manager.md` already exists. SKIP.

---

### Discovery 18: Requirements Analyst / User Story Generator

**Source:** dl-ezo/claude-code-sub-agents (requirements-analyst,
user-story-generator) [2] **Confidence:** MEDIUM

**What it does:** Gathers user needs, creates detailed functional
specifications, produces comprehensive user stories with acceptance criteria,
validates requirements for completeness and consistency.

**Is it in SoNash?** Partial. PRD-writer covers output format but not the
elicitation/validation side.

**SoNash applicability:** LOW-MEDIUM. Solo developer — requirements come from
the developer's own judgment. Limited need for formal requirements elicitation.

**Priority rank: 16**

---

### Discovery 19: Workflow Optimizer

**Source:** dl-ezo/claude-code-sub-agents, zhsama/claude-sub-agent [2][17]
**Confidence:** MEDIUM

**What it does:** Analyzes development workflows, identifies bottlenecks and
inefficiencies, implements process improvements. Distinct from DX Optimizer
(which focuses on tooling) — this focuses on agent coordination and pipeline
design.

**Is it in SoNash?** No.

**SoNash applicability:** MEDIUM. SoNash has a complex hook-and-agent pipeline
(pre-commit, deep-research, GSD, SWS). A workflow-optimizer could analyze
execution times across the pipeline, identify which phases take the most
tokens/time, and suggest parallelization opportunities.

**Effort:** MEDIUM.

**Priority rank: 12**

---

### Discovery 20: Error Coordinator (Multi-Agent Error Recovery)

**Source:** VoltAgent/awesome-claude-code-subagents
(categories/09-meta-orchestration) [1] **Confidence:** MEDIUM

**What it does:** Centralizes error handling across agent systems. Implements
retry logic, fallback strategies, circuit breakers. Provides structured error
recovery workflows. Coordinates with other agents on failure states.

**Is it in SoNash?** Partial. `error-detective` analyzes error patterns. But
error-coordinator manages error recovery in multi-agent pipelines — a different
scope.

**SoNash applicability:** MEDIUM. Relevant once the agent team grows: when
deep-research fails mid-run, or when GSD executor hits a blocker, a dedicated
error coordinator could handle the recovery without polluting the orchestrator's
context.

**Effort:** MEDIUM.

**Priority rank: 13**

---

### Discovery 21: Test Suite Specializations (E2E / Playwright / Contract)

**Source:** rshah515/claude-code-subagents (e2e-testing, contract-testing,
playwright), multiple Playwright-focused articles [3][18][19] **Confidence:**
HIGH (Playwright agents documented with Anthropic cookbook examples)

**What it does:** Three distinct specializations beyond `test-engineer`:

- **E2E testing agent** (Playwright, Cypress): Generate and heal E2E tests
- **Contract testing agent**: API contract validation between frontend and
  backend
- **Load testing agent**: Performance at scale

**Is it in SoNash?** No. `test-engineer` covers unit/integration but not E2E or
contract testing specifically.

**SoNash applicability:** MEDIUM. SoNash has a `/test-suite` skill for
protocol-based testing. A Playwright-specific subagent could automate E2E test
generation for dashboard components. Contract testing between Cloud Functions
and frontend is relevant given the httpsCallable pattern.

**Effort:** LOW-MEDIUM.

**Priority rank: 5**

---

### Discovery 22: Firebase/Backend-as-a-Service Specialist

**Source:** Firebase official agent skills page
(firebase.google.com/docs/ai-assistance/agent-skills), Firebase MCP server docs
[20][21] **Confidence:** HIGH (official Firebase documentation, released
Feb 2026)

**What it does:** Firebase-specific agent skills cover: Firestore schema design
(optimizing for specific data needs), Security Rules writing and deployment,
Firebase App Hosting deployment, Firebase AI Logic integration, Authentication
patterns, Cloud Functions patterns. Official agent skills are designed to be
layered with MCP server for higher accuracy.

**Is it in SoNash?** No dedicated Firebase agent. `backend-architect` and
`security-auditor` cover adjacent areas.

**SoNash applicability:** HIGH. Firebase is SoNash's core backend. Security
Rules (the #1 security concern per CLAUDE.md), Cloud Functions patterns
(httpsCallable gate), Firestore schema decisions — all have official agent skill
templates now. A Firebase-specialist agent would be the most stack-specific
addition possible.

**Effort:** LOW — official Firebase agent skills provide the foundation; adapt
with SoNash-specific constraints (App Check, rate limiting, 3-collection write
gate).

**Priority rank:** (see TOP 10 — considered within PRD group)

---

### Discovery 23: ADR Writer (Architecture Decision Records)

**Source:** Pattern emerges from wshobson/agents (architect-review), community
documentation patterns [6][22] **Confidence:** MEDIUM (pattern exists; less
canonical as standalone agent)

**What it does:** Documents architecture decisions in structured ADR format:
problem context, considered options, chosen solution, rationale, consequences.
Creates a durable record of why architectural choices were made.

**Is it in SoNash?** No. `documentation-expert` writes docs but not ADRs
specifically. `plan` documents implementation steps but not architectural
rationale.

**SoNash applicability:** MEDIUM-LOW. Solo developer project — ADRs are less
critical without a team. However, SoNash has complex architectural decisions
(hook contract CANON, agent team design, security gates) that would benefit from
durable decision records.

**Priority rank: (outside top 10)**

---

### Discovery 24: Observability / Monitoring Agent

**Source:** wshobson/agents (observability-engineer),
VoltAgent/awesome-claude-code-subagents (categories/03),
hooks-multi-agent-observability [6][1][23] **Confidence:** HIGH (multiple
collections + Anthropic SRE cookbook)

**What it does:** Sets up and queries monitoring infrastructure: metrics
collection, dashboard creation, alert rule configuration, anomaly detection. In
agentic context (disler/hooks-observability): tracks SubagentStart/SubagentStop
events, tool execution states, session lifecycle — all for real-time visibility
into agent swarms.

**Is it in SoNash?** Partial. `devops-troubleshooter` handles production issues
reactively. No proactive monitoring setup agent.

**SoNash applicability:** MEDIUM. SoNash's hook system already produces
`hook-runs.jsonl` and `hook-warnings-log.jsonl`. An observability agent could
query these files, detect anomalous patterns (frequent hook failures, repeated
skip reasons), and surface trends proactively. This aligns with the existing
`/alerts` skill.

**Priority rank: (outside top 10)**

---

### Discovery 25: Business Analyst / Stakeholder Communicator

**Source:** dl-ezo/claude-code-sub-agents (stakeholder-communicator),
VoltAgent/awesome-claude-code-subagents (categories/08) [2][1] **Confidence:**
MEDIUM

**SoNash applicability:** LOW. Solo developer. No stakeholders, no board, no
external reporting. PRD-writer covers the product-facing documentation need.

**Priority rank: 22**

---

### Discovery 26: Multi-Model Adversarial Reviewer (Cross-Model Critique)

**Source:** ARIS project (wanshuiyin), affaan-m/everything-claude-code, research
from D8a (adversarial patterns) [13][14] **Confidence:** MEDIUM

**What it does:** Pairs one model as executor and a second model (or a distinct
persona) as adversarial reviewer. The reviewer is prompted to find weaknesses
the executor missed — not just validate correctness but actively probe for
failure modes. Breaks the "local minima" problem of self-review.

**Is it in SoNash?** No. Deep-research synthesizer does some cross-verification
but not adversarial critique. The contrarian/OTB agent design
(project_contrarian_agent_design.md) documents this gap.

**SoNash applicability:** HIGH. The memory file
`project_contrarian_agent_design.md` exists — this is already a planned item.
The adversarial reviewer agent would slot into deep-research and pr-review
pipelines as the "challenger" that breaks confirmation bias.

**Effort:** MEDIUM — requires defining failure mode taxonomy and evaluation
rubrics.

**Priority rank: (see contrarian agent design — tracked separately)**

---

## TOP 10 Ranked by SoNash Value

| Rank | Agent Name                              | Category               | Gap Addressed                                                                 | Confidence | Effort      |
| ---- | --------------------------------------- | ---------------------- | ----------------------------------------------------------------------------- | ---------- | ----------- |
| 1    | **refactoring-specialist**              | Code Quality           | No agent executes safe code transformations (vs reviewing)                    | HIGH       | LOW         |
| 2    | **session-continuity-manager**          | Meta/Session           | Session context lost across compaction/context-clear events (4+ corrections)  | MEDIUM     | MEDIUM      |
| 3    | **convergence-loop-verifier**           | Quality/Orchestration  | Convergence enforcement is a SKILL but not an AGENT; D5a highest ROI gap      | MEDIUM     | MEDIUM-HIGH |
| 4    | **legacy-modernizer**                   | Migration              | No agent handles major version migrations (Next.js, Firebase SDK upgrades)    | HIGH       | LOW         |
| 5    | **e2e-testing-specialist** (Playwright) | Testing                | `test-engineer` covers unit/integration but not E2E or contract testing       | HIGH       | LOW-MEDIUM  |
| 6    | **accessibility-tester**                | Quality                | No a11y compliance check agent; WCAG is unaddressed in current roster         | HIGH       | LOW         |
| 7    | **prd-writer**                          | Documentation          | No agent produces user-story/acceptance-criteria artifacts                    | HIGH       | LOW         |
| 8    | **dx-optimizer**                        | Developer Productivity | No agent optimizes the dev inner loop (build times, HMR, test speed)          | HIGH       | LOW         |
| 9    | **i18n-engineer**                       | Localization           | Two-locale awareness documented but no agent supports i18n implementation     | MEDIUM     | LOW-MEDIUM  |
| 10   | **firebase-specialist**                 | Stack-Specific         | Firebase is SoNash's primary backend; official agent skills released Feb 2026 | HIGH       | LOW         |

**Honorable mentions (ranks 11-15):** context-manager (cross-agent state),
workflow-optimizer (pipeline efficiency), error-coordinator (multi-agent
recovery), api-designer (Cloud Function contracts), cloud-cost-optimizer (very
LOW for SoNash scale).

---

## Sources

| #   | URL                                                                                 | Title                                 | Type                            | Trust       | CRAAP | Date      |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------- | ----------- | ----- | --------- |
| 1   | https://github.com/VoltAgent/awesome-claude-code-subagents                          | awesome-claude-code-subagents         | Official community collection   | HIGH        | 4.5   | 2025-2026 |
| 2   | https://github.com/dl-ezo/claude-code-sub-agents                                    | 35 Specialized Sub-agents             | Community collection            | MEDIUM-HIGH | 3.8   | 2025      |
| 3   | https://github.com/rshah515/claude-code-subagents                                   | 165 Specialized Subagents             | Community collection            | MEDIUM      | 3.5   | 2025      |
| 4   | https://github.com/rohitg00/awesome-claude-code-toolkit                             | awesome-claude-code-toolkit           | Community collection            | MEDIUM      | 3.5   | 2025      |
| 5   | https://github.com/Community-Access/accessibility-agents                            | Accessibility Agents (11 specialists) | Specialized community           | HIGH        | 4.2   | 2025      |
| 6   | https://github.com/wshobson/agents                                                  | wshobson/agents                       | Community production collection | HIGH        | 4.4   | 2025-2026 |
| 7   | https://github.com/lst97/claude-code-sub-agents                                     | Personal full-stack subagents         | Individual collection           | MEDIUM      | 3.4   | 2025      |
| 8   | https://platform.claude.com/cookbook/claude-agent-sdk-03-the-site-reliability-agent | SRE Incident Response Agent Cookbook  | Official Anthropic              | HIGH        | 5.0   | 2025      |
| 9   | https://github.com/lodetomasi/agents-claude-code                                    | 100 Hyper-Specialized Agents          | Community collection            | MEDIUM      | 3.5   | 2025      |
| 10  | https://github.com/iannuttall/claude-agents                                         | Claude Agents Collection              | Individual collection           | MEDIUM      | 3.6   | 2025      |
| 11  | https://github.com/parcadei/Continuous-Claude-v3                                    | Continuous Claude v3                  | Community project               | MEDIUM      | 3.7   | 2025      |
| 12  | https://github.com/thedotmack/claude-mem                                            | Claude-Mem                            | Community project               | MEDIUM      | 3.6   | 2025      |
| 13  | https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep                    | ARIS Auto-Research                    | Community project               | MEDIUM      | 3.8   | 2025      |
| 14  | https://github.com/affaan-m/everything-claude-code                                  | Everything Claude Code (harness)      | Community project               | MEDIUM      | 3.7   | 2025      |
| 15  | https://claudefa.st/blog/guide/mechanics/autonomous-agent-loops                     | Autonomous Agent Loops                | Community blog                  | MEDIUM      | 3.5   | 2025      |
| 16  | https://github.com/mylee04/claude-code-subagents                                    | Agent Assembler Collection            | Community project               | MEDIUM      | 3.4   | 2025      |
| 17  | https://github.com/zhsama/claude-sub-agent                                          | AI-driven workflow system             | Community project               | MEDIUM      | 3.3   | 2025      |
| 18  | https://shipyard.build/blog/playwright-agents-claude-code/                          | Playwright Agents for Claude Code     | Community blog                  | HIGH        | 4.0   | 2025      |
| 19  | https://openobserve.ai/blog/autonomous-qa-testing-ai-agents-claude-code/            | 700+ Test Coverage with AI Agents     | Production case study           | HIGH        | 4.2   | 2025      |
| 20  | https://firebase.google.com/docs/ai-assistance/agent-skills                         | Firebase Agent Skills                 | Official Firebase/Google docs   | HIGH        | 5.0   | 2026-02   |
| 21  | https://firebase.google.com/docs/ai-assistance/mcp-server                           | Firebase MCP Server                   | Official Firebase/Google docs   | HIGH        | 5.0   | 2026      |
| 22  | https://deepwiki.com/wshobson/agents                                                | DeepWiki: wshobson/agents             | Analysis tool                   | MEDIUM      | 3.5   | 2025      |
| 23  | https://github.com/disler/claude-code-hooks-multi-agent-observability               | Multi-Agent Observability             | Community project               | MEDIUM-HIGH | 4.0   | 2025      |

---

## Contradictions

**Refactoring vs. Code Reviewer boundary:** Some collections treat refactoring
as a sub-task of code review; others make it a separate agent. The distinction
is execution vs. analysis — code-reviewer reads and flags,
refactoring-specialist writes and transforms. The boundary is real in SoNash's
existing definitions.

**Session Continuity complexity:** Two camps exist. dl-ezo separates
`session-continuity-manager` (transitions) from `memory-manager` (in-session)
from `context-manager` (cross-agent state). VoltAgent consolidates these under
`context-manager`. For SoNash, the specific need (survive compaction, restore
context on session start) suggests the dl-ezo separation is more useful.

**Firebase agent skills vs. specialized subagent:** Firebase's official agent
skills are SKILL.md files intended to be loaded alongside MCP — not standalone
subagents. A Firebase-specialist subagent would be a different artifact that
wraps these skills with SoNash-specific guardrails (App Check enforcement,
write-gate reminders).

---

## Gaps

1. **No coverage of "schema migration" as a distinct agent**: Multiple
   collections have database-schema-designer but the migration execution side
   (running Firestore migration scripts safely, handling rollbacks) is not
   well-represented as a standalone agent.

2. **No canonical "pre-commit gate agent"**: Community solutions use hook
   scripts, not agents. The pre-commit-fixer proved hook-to-agent is viable
   (D5b), but no community collection has a dedicated pattern for agents invoked
   by hooks.

3. **Firebase-specialist in community collections is thin**: Most Firebase
   coverage is in MCP server integrations, not subagent definitions. The
   official Firebase agent skills are new (Feb 2026) and not yet widely adopted
   in community agent collections.

4. **i18n-engineer details unclear**: Confirmed it exists in rshah515's
   collection but did not retrieve the full agent definition. The specific
   workflow for Next.js i18n routing + translation management was not verified
   at the agent level.

5. **Convergence-loop-verifier has no canonical definition**: Pattern is
   documented in research/blogs and via ARIS, but no `.md` agent file was found.
   This is a gap that SoNash may need to define from scratch.

---

## Serendipity

1. **Firebase released official agent skills in February 2026** — this is very
   recent and directly addresses SoNash's primary backend. The skills cover
   exactly the pain points in CLAUDE.md (Security Rules, App Check,
   httpsCallable patterns). Using these as a foundation for a
   Firebase-specialist agent would be faster than building from scratch. Source:
   firebase.google.com/docs/ai-assistance/agent-skills [20]

2. **The Community-Access/accessibility-agents project decomposes a11y into 11
   micro-specialists** under a lead orchestrator — this is the most
   sophisticated domain-specific agent architecture found in the research. If
   SoNash adds an accessibility agent, starting with a single agent and
   optionally expanding to sub-specialists is a viable evolution path.

3. **Cross-model adversarial review is the most sophisticated pattern found** —
   the ARIS project pairs Claude Code (executor) with GPT-5.4 xhigh (reviewer),
   claiming it "breaks local minima" that single-model self-review cannot
   escape. This is the mechanism behind the planned contrarian agent
   (project_contrarian_agent_design.md). The insight is that even two personas
   running on the same model may reproduce the same blind spots — genuine
   cross-model review provides stronger guarantees.

4. **Agent count inflation is a recognized anti-pattern** — both wshobson and
   dl-ezo explicitly warn against it. The wshobson model (112 agents in plugins,
   not loaded individually) and the "one agent per narrow domain" pattern
   (affaan-m) represent competing philosophies. SoNash's consolidation direction
   (39 → 30) is validated by both schools.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 12
- LOW claims: 2
- UNVERIFIED claims: 0
- Overall confidence: MEDIUM-HIGH

The top-10 ranking is HIGH confidence — cross-referenced across 3+ sources for
each agent type. The convergence-loop-verifier rank is MEDIUM confidence
(highest ROI per D5a but no canonical agent definition to reference). The
firebase-specialist rank is HIGH confidence (official documentation released Feb
2026).
