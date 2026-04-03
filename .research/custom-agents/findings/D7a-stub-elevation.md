# Findings: Which Stub Agents Should Be Elevated to Full Agents?

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ7 (Part A)

---

## Research Methodology

Read all 13 agents under evaluation in full (9 Tier-B stubs + mcp-expert +
git-flow-manager + react-performance-optimization + markdown-syntax-formatter +
prompt-engineer). Cross-referenced invocation evidence across:

- CLAUDE.md Section 7 trigger tables (the authoritative invocation contract)
- AGENT_ORCHESTRATION.md (capacity/grouping reference)
- All 35 `.claude/skills/` SKILL.md files (skill-level agent spawning)
- Prior research findings: D3a (inventory), D3c (cross-cutting), D5a (workflow
  gaps)
- Full-quality reference agents (security-auditor, explore, plan) as elevation
  benchmarks

**Files read:** 13 agent files + CLAUDE.md + AGENT_ORCHESTRATION.md +
pre-commit-fixer/SKILL.md + pr-review/SKILL.md +
pr-review/reference/PARALLEL_AGENT_STRATEGY.md

- D3a + D3c + D5a

---

## Key Findings

### 1. Invocation Map: Active vs Orphaned Stubs [CONFIDENCE: HIGH]

Cross-referencing all agents against CLAUDE.md Section 7 and skill files:

| Agent                 | CLAUDE.md S7?         | AGENT_ORCHESTRATION.md?                | Skill spawn?                                       | Verdict               |
| --------------------- | --------------------- | -------------------------------------- | -------------------------------------------------- | --------------------- |
| backend-architect     | Example footnote only | YES — Architecture grouping + capacity | No                                                 | Quasi-referenced      |
| debugger              | Example footnote only | YES — capacity table (5-9/session)     | YES — pre-commit-fixer spawns it twice             | Active                |
| deployment-engineer   | No                    | No                                     | No                                                 | Orphan                |
| devops-troubleshooter | No                    | No                                     | No                                                 | Orphan                |
| error-detective       | No                    | No                                     | No                                                 | Orphan                |
| penetration-tester    | No                    | No                                     | No                                                 | Orphan                |
| performance-engineer  | Example footnote only | YES — Performance grouping + capacity  | YES — pr-review Step 3 dispatch                    | Active                |
| technical-writer      | No                    | No                                     | YES — pr-review/PARALLEL_AGENT_STRATEGY.md example | Marginally referenced |
| ui-ux-designer        | No                    | No                                     | No                                                 | Orphan                |

**Key qualifier on CLAUDE.md "example footnote":** The phrase is
`"27 agents available beyond this table (e.g., test-engineer, performance-engineer, debugger)"`.
This is a parenthetical illustration, not a mandate. Mandated agents have
dedicated table rows (e.g., `security-auditor`, `documentation-expert`,
`frontend-developer`).

---

### 2. Debugger: Active, Skill-Spawned, Needs Elevation [CONFIDENCE: HIGH]

`debugger` (37 lines) is the only stub with a confirmed skill-level invocation.
`pre-commit-fixer/SKILL.md` explicitly spawns it twice via
`subagent_type: "debugger"`:

- For ESLint error fixes
- For TypeScript error fixes

Its 37-line generic stub lacks SoNash context entirely. The pre-commit-fixer
compensates with inline constraints passed at call time ("Do NOT create new
files, do NOT add eslint-disable unless genuinely false positive") — these
compensations exist precisely because the agent has no SoNash knowledge of its
own.

**Decision: ELEVATE — Priority 1.**

Elevation scope: SoNash ESLint/TypeScript fix patterns, sanitize-error.js
awareness, patterns:check error categories, CLAUDE.md Section 5 anti-patterns,
return protocol for pre-commit-fixer consumption. Estimated: medium (200-300
lines).

---

### 3. Performance-Engineer: Actively Dispatched by pr-review, Needs Elevation [CONFIDENCE: HIGH]

`performance-engineer` (40 lines) is dispatched at Step 3 of
`pr-review/SKILL.md` for 20+ item PRs: "dispatch specialized agents:
security-auditor, test-engineer, performance-engineer, code-reviewer." It also
appears in AGENT_ORCHESTRATION.md's concern-grouping table (Performance →
`performance-engineer`) and capacity table (3-7 items/session).

Its generic content (JMeter/k6, Redis, flamegraphs) has zero SoNash relevance.
SoNash performance concerns are: Next.js 16 Core Web Vitals, React 19 render
optimization, Firebase Firestore query efficiency, meeting widget setInterval,
bundle analysis. The agent cannot produce SoNash-relevant output in current
state.

Uses `model: opus` — the model selection is appropriate but wasted on generic
content.

**Decision: ELEVATE — Priority 1.** Absorb React.memo/useMemo/lazy patterns from
react-performance-optimization during elevation. Estimated: medium (200-350
lines).

---

### 4. Debugging Cluster: Consolidate Three Stubs into One [CONFIDENCE: HIGH]

Three stubs cover root-cause analysis with 80%+ overlap:

| Agent                 | Lines | Scope                                | Referenced?            |
| --------------------- | ----- | ------------------------------------ | ---------------------- |
| debugger              | 37    | Source code / stack traces           | YES — pre-commit-fixer |
| error-detective       | 40    | Log analysis / pattern detection     | Orphan                 |
| devops-troubleshooter | 40    | Infrastructure / deployment failures | Orphan                 |

All three share identical 5-step problem-solving approaches and output sections
(root cause, evidence, fix, prevention). All three descriptions say "Use
PROACTIVELY for debugging issues." This cluster was flagged in Session #227; no
action taken as of 2026-03-29 (D3c confirmed).

Differentiation potential exists conceptually (code vs logs vs infra) but is not
implemented in any of the three stubs, and the differentiation does not match
SoNash's actual debugging surface. SoNash has no distributed logs, no ELK, no
Datadog, no Kubernetes — the error-detective and devops-troubleshooter
specializations are irrelevant at SoNash's scale and deployment model.

**Decision: Elevate `debugger` (keeps the skill-referenced name). Remove
`error-detective` and `devops-troubleshooter`. Firebase-relevant Firebase
log-analysis guidance (Cloud Function logs, firebase functions:log) absorbed
into elevated debugger.**

---

### 5. Technical-Writer: Elevate as documentation-expert Complement [CONFIDENCE: HIGH]

`technical-writer` (41 lines) has an established non-redundant scope. The
`documentation-expert` P4.1 improvement explicitly created a scope boundary:

- documentation-expert handles: system docs (CLAUDE.md, SESSION_CONTEXT.md),
  agent docs, API docs, architecture docs, documentation index maintenance
- technical-writer handles: user guides, tutorials, README files, content
  accessibility, tutorial series

documentation-expert actively defers to technical-writer: "When your task
crosses into technical-writer territory (e.g., a README for a new feature), hand
off or flag it — do not combine concerns."

However, `technical-writer` cannot honor this handoff: it lacks the scope
boundary from its own perspective, has no SoNash document conventions, and has
no return protocol. It is also listed in PARALLEL_AGENT_STRATEGY.md as an
illustrative pr-review dispatch target for documentation issues.

**Decision: ELEVATE — Priority 2.** Light elevation required to establish
own-perspective scope boundary and SoNash conventions. Estimated: light (100-180
lines).

---

### 6. Backend-Architect: Defer [CONFIDENCE: MEDIUM]

`backend-architect` (39 lines) appears in AGENT_ORCHESTRATION.md's concern
grouping (Architecture → `backend-architect`) and capacity table (3-5
items/session, "Complex decisions"). It does not appear in CLAUDE.md Section 7's
mandate table — only in the illustrative footnote.

Its scope (RESTful APIs, microservices, horizontal scaling) partially overlaps
with `fullstack-developer` (1281 lines, frozen Jan 2026, generic).

The serendipitous finding from AGENT_ORCHESTRATION.md: the Architecture grouping
maps to `backend-architect` specifically, NOT to `fullstack-developer` or
`database-architect`. This suggests `backend-architect` was the intended
orchestration-visible architecture agent. Whether to elevate it as a
Firebase/Cloud Functions architecture specialist or merge it into a different
agent requires a broader decision about the architecture cluster.

**Decision: DEFER — Priority 3.** Needs cross-agent decision for the
architecture cluster before prescribing elevation scope.

---

### 7. Deployment-Engineer: Remove [CONFIDENCE: HIGH]

Complete orphan. Scope (Docker, Kubernetes, GitHub Actions, Terraform,
CloudFormation) is categorically wrong for SoNash which deploys via
`firebase deploy`. No elevation path without complete content replacement, and
the Firebase deployment concern is simple enough not to warrant a dedicated
agent.

**Decision: REMOVE — Priority 1.**

---

### 8. Devops-Troubleshooter: Remove [CONFIDENCE: HIGH]

Orphan. Scope (kubectl, ELK, Datadog, container debugging) does not apply to
SoNash's Firebase deployment model. Firebase-relevant log debugging guidance
absorbed into elevated debugger. Distributed infrastructure troubleshooting is
out of scope for SoNash.

**Decision: REMOVE — Priority 1.**

---

### 9. Error-Detective: Remove [CONFIDENCE: HIGH]

Orphan. Log pattern analysis capability (Elasticsearch, Splunk) assumes
distributed systems SoNash does not use. SoNash error patterns (Next.js runtime,
Firebase SDK error codes, Zod validation, TypeScript compilation) belong in the
elevated debugger under SoNash-specific error categories.

**Decision: REMOVE — Priority 1.**

---

### 10. Penetration-Tester: Remove [CONFIDENCE: HIGH]

Orphan. Uses `model: opus` — highest cost model, never invoked. Scope (network
penetration, wireless, mobile, red team) does not match SoNash's actual security
surface. `security-auditor` (Tier A, mandated, SoNash-specific) fully covers
SoNash security needs including OWASP Top 10 mapping, App Check verification,
Firestore rules, and Cloud Functions security. No gap exists.

**Decision: REMOVE — Priority 1.**

---

### 11. UI-UX-Designer: Defer [CONFIDENCE: MEDIUM]

Orphan. UI/UX work is covered by the mandated `frontend-developer` agent (Tier
A) and `frontend-design` skill. The gap between what `ui-ux-designer` could add
(accessibility standards, design system spec) vs what already exists is unclear
without a specific roadmap requirement.

**Decision: DEFER — Priority 3.**

---

### 12. mcp-expert: Replace (Full Rewrite) [CONFIDENCE: HIGH]

272 lines of content entirely describing workflows for a
`cli-tool components system` with paths to `cli-tool/components/mcps/` — a
directory that does not exist in SoNash. This is a copy-paste from another
project. The agent is harmful in current state: it will confidently create files
in a nonexistent location.

However, there IS a real MCP need at SoNash: the project uses context7, memory,
and sonarcloud MCP servers. Questions about configuring MCPs, adding new
servers, debugging MCP connectivity, and understanding MCP tool behaviors are
real tasks.

**Decision: REPLACE (full rewrite, keep name) — Priority 2.**

Rewrite scope:

- SoNash MCP server inventory (context7, memory, sonarcloud)
- MCP configuration locations (.mcp.json, settings.json env block)
- Adding new MCP servers to the project
- Diagnosing MCP connectivity failures
- Context7 usage patterns (resolve-library-id → query-docs flow)
- Memory MCP patterns (JSONL conventions, .claude/projects/\*/memory/ structure)
- Return protocol (configuration changes applied, restart required Y/N)
- Estimated: medium (150-250 lines), model: sonnet

---

### 13. Git-Flow-Manager: Remove [CONFIDENCE: HIGH]

Orphan (371 lines, confirmed by D3c). Generic GitFlow workflow describes
`feature/* → develop → main` with a `develop` branch. SoNash does NOT use
GitFlow — it uses `main` with `planning-*` and feature branches merging via PR.
No `develop` branch exists. The model described would be actively harmful if
applied.

The only SoNash-specific element (Conventional Commits format) is generic and
does not warrant a 371-line agent.

**Decision: REMOVE — Priority 2.**

---

### 14. React-Performance-Optimization: Remove (Consolidate) [CONFIDENCE: HIGH]

76 lines with good React performance content (React.memo, useMemo, React.lazy,
Core Web Vitals). However, this agent competes with `performance-engineer` which
is the canonical performance agent per AGENT_ORCHESTRATION.md and
pr-review/SKILL.md. Having both creates routing confusion.

The React-specific patterns (React.memo, useMemo, React.lazy) are a subset of
what an elevated `performance-engineer` should contain.

**Decision: REMOVE after elevating performance-engineer to absorb this content —
Priority 2.**

---

### 15. Markdown-Syntax-Formatter: Remove [CONFIDENCE: MEDIUM]

Generic CommonMark/GFM formatter (75 lines). No SoNash references. No invocation
trigger. The formatting task is not complex enough for a dedicated agent. SoNash
doc conventions (prettier-ignore headers, no-emoji rule) live in
`documentation-expert`. The main agent handles generic markdown formatting
natively.

**Decision: REMOVE — Priority 3.**

---

### 16. Prompt-Engineer: Defer [CONFIDENCE: MEDIUM]

121 lines, `model: opus`, orphan. Generic prompt optimization content with no
SoNash workflow alignment. Latent value exists: as the agent ecosystem grows, a
prompt-engineer could serve as a quality gate for new agent definitions.
However, the `audit-agent-quality` skill already covers this function. Not
urgent.

**Decision: DEFER — Priority 3.**

---

## Consolidated Decision Table

| Agent                          | Lines | Decision | Priority | Key Rationale                                                             |
| ------------------------------ | ----- | -------- | -------- | ------------------------------------------------------------------------- |
| debugger                       | 37    | ELEVATE  | P1       | Skill-spawned by pre-commit-fixer; generic stub degrades active workflows |
| performance-engineer           | 40    | ELEVATE  | P1       | Skill-dispatched by pr-review Step 3; generic opus wasted                 |
| error-detective                | 40    | REMOVE   | P1       | Orphan; scope absorbed by elevated debugger                               |
| devops-troubleshooter          | 40    | REMOVE   | P1       | Orphan; Firebase-relevant scope absorbed by elevated debugger             |
| deployment-engineer            | 41    | REMOVE   | P1       | Orphan; wrong deployment model (Docker/K8s vs Firebase)                   |
| penetration-tester             | 42    | REMOVE   | P1       | Orphan; fully covered by security-auditor                                 |
| mcp-expert                     | 272   | REPLACE  | P2       | Wrong project refs throughout; full rewrite for SoNash MCP context        |
| technical-writer               | 41    | ELEVATE  | P2       | Scope boundary established by documentation-expert; needs own-perspective |
| git-flow-manager               | 371   | REMOVE   | P2       | Orphan; GitFlow model conflicts with SoNash branch strategy               |
| react-performance-optimization | 76    | REMOVE   | P2       | Absorb into elevated performance-engineer                                 |
| backend-architect              | 39    | DEFER    | P3       | Needs architecture cluster decision first                                 |
| markdown-syntax-formatter      | 75    | REMOVE   | P3       | No SoNash value; main agent handles natively                              |
| ui-ux-designer                 | 41    | DEFER    | P3       | Covered by frontend-developer + frontend-design skill                     |
| prompt-engineer                | 121   | DEFER    | P3       | Latent value; not urgent                                                  |

**Net ecosystem impact:** 4 agents removed (P1), 2 removed + 1 replaced (P2), 2
elevated. Stub count drops from 9 to 0 meaningful stubs. Orphan count drops from
3+ to 0.

---

## Debugging Cluster Consolidation Plan

**Current state:** 3 stubs (debugger 37L, error-detective 40L,
devops-troubleshooter 40L) with 80%+ overlap, one active invocation path
(debugger via pre-commit-fixer).

**Proposed state:** 1 elevated `debugger` (200-300 lines), 2 stubs removed.

**Elevated debugger structure:**

1. **Frontmatter additions:** `maxTurns: 15`, `disallowedTools: Agent` (prevent
   spawning cascade during pre-commit fixes)

2. **SoNash context block:** Stack versions, critical anti-patterns from
   CLAUDE.md Section 5, file paths for sanitize-error.js, security-helpers.js,
   patterns:check command

3. **Pre-commit-fixer mode (primary use case):** ESLint error categories and
   fixes, TypeScript strict mode violations, constraints ("do NOT create new
   files", "do NOT add eslint-disable unless genuinely false positive"),
   `npm run patterns:check` for pattern compliance errors

4. **Runtime debugging mode:** Next.js 16 common errors (RSC hydration, App
   Router constraints), Firebase SDK error codes, Zod validation failure
   patterns, React 19 hook rules violations

5. **Firebase deployment debugging (absorbed from devops-troubleshooter):**
   firebase functions:log, Cloud Function error codes, cold start issues

6. **Return protocol:** Fix summary (files changed N, errors resolved N,
   patterns:check pass/fail)

**What is NOT absorbed from removed stubs:**

- Elasticsearch/Splunk log queries (error-detective) — out of scope for SoNash
- kubectl/Kubernetes commands (devops-troubleshooter) — no K8s in SoNash
- Distributed system log correlation — irrelevant at SoNash scale

---

## mcp-expert Rewrite Scope

**Problem:** All 272 lines reference `cli-tool/components/mcps/` — a path from
another project. The agent is harmful: it will create files in a nonexistent
directory.

**Rewrite contents (150-250 lines):**

1. **SoNash MCP inventory** — List and purpose of each active MCP server:
   context7, memory, sonarcloud. Configuration locations: .mcp.json,
   settings.json

2. **Adding new MCP servers** — Configuration format, environment variable
   handling, restart requirements

3. **Diagnosing MCP failures** — Connectivity errors, authentication failures,
   tool call errors and their meanings

4. **Context7 usage patterns** — resolve-library-id flow, query-docs
   specificity, when to prefer context7 vs web search

5. **Memory MCP patterns** — JSONL read/write conventions, memory file structure
   in `.claude/projects/*/memory/`

6. **Return protocol** — Configuration changes applied, restart required Y/N,
   test command to verify

---

## Elevation Specifications

### debugger (P1 — Elevate)

- **Lines estimate:** 200-300 (medium)
- **Model:** sonnet (keep)
- **maxTurns:** 15
- **Tools:** Read, Write, Edit, Bash, Grep (keep)
- **disallowedTools:** Agent
- **Key additions:** SoNash stack, sanitize-error.js, patterns:check, ESLint
  rule categories, TypeScript strict mode violations, CLAUDE.md Section 5
  anti-patterns, Firebase SDK error codes, Next.js App Router error taxonomy,
  constraint (no new files, no eslint-disable without justification)
- **Return protocol:** Fix summary (files changed, errors resolved,
  patterns:check status)

### performance-engineer (P1 — Elevate)

- **Lines estimate:** 200-350 (medium)
- **Model:** opus (keep)
- **maxTurns:** 20
- **Tools:** Read, Write, Edit, Bash (keep)
- **Key additions:** Next.js 16 App Router performance (RSC vs client
  boundaries, streaming, Suspense), React 19 concurrent features (useTransition,
  useDeferredValue), Firebase Firestore query optimization and index
  recommendations, npm run build bundle analysis, React.memo/useMemo/React.lazy
  patterns (absorbed from react-performance-optimization), Core Web Vitals for
  SoNash routes (INP for meeting widget, LCP for dashboard, CLS),
  setInterval/useCallback pattern from CLAUDE.md App-Specific section
- **Return protocol:** Performance audit report (metric baseline, bottlenecks
  ranked by impact, fixes with before/after estimates)

### technical-writer (P2 — Elevate)

- **Lines estimate:** 100-180 (light)
- **Model:** sonnet (keep)
- **maxTurns:** 15
- **Tools:** Read, Write, Edit, Grep (keep)
- **Key additions:** Scope boundary from own perspective (what this handles vs
  documentation-expert), SoNash doc conventions (prettier-ignore headers, no
  emojis, version tables), `npm run docs:index` awareness, when to hand off to
  documentation-expert
- **Return protocol:** Docs written/updated, index regeneration needed Y/N

---

## Sources

| #   | Source                                                           | Type           | Trust | Notes                                            |
| --- | ---------------------------------------------------------------- | -------------- | ----- | ------------------------------------------------ |
| 1   | `.claude/agents/debugger.md`                                     | filesystem     | HIGH  | Ground truth — agent body                        |
| 2   | `.claude/agents/error-detective.md`                              | filesystem     | HIGH  | Ground truth                                     |
| 3   | `.claude/agents/devops-troubleshooter.md`                        | filesystem     | HIGH  | Ground truth                                     |
| 4   | `.claude/agents/deployment-engineer.md`                          | filesystem     | HIGH  | Ground truth                                     |
| 5   | `.claude/agents/penetration-tester.md`                           | filesystem     | HIGH  | Ground truth                                     |
| 6   | `.claude/agents/performance-engineer.md`                         | filesystem     | HIGH  | Ground truth                                     |
| 7   | `.claude/agents/technical-writer.md`                             | filesystem     | HIGH  | Ground truth                                     |
| 8   | `.claude/agents/backend-architect.md`                            | filesystem     | HIGH  | Ground truth                                     |
| 9   | `.claude/agents/ui-ux-designer.md`                               | filesystem     | HIGH  | Ground truth                                     |
| 10  | `.claude/agents/mcp-expert.md`                                   | filesystem     | HIGH  | Wrong project refs confirmed                     |
| 11  | `.claude/agents/git-flow-manager.md`                             | filesystem     | HIGH  | GitFlow model confirmed                          |
| 12  | `.claude/agents/react-performance-optimization.md`               | filesystem     | HIGH  | Ground truth                                     |
| 13  | `.claude/agents/markdown-syntax-formatter.md`                    | filesystem     | HIGH  | Ground truth                                     |
| 14  | `.claude/agents/prompt-engineer.md`                              | filesystem     | HIGH  | Ground truth                                     |
| 15  | `CLAUDE.md` Section 7                                            | filesystem     | HIGH  | Authoritative invocation mandate                 |
| 16  | `docs/agent_docs/AGENT_ORCHESTRATION.md`                         | filesystem     | HIGH  | Capacity and grouping reference                  |
| 17  | `.claude/skills/pre-commit-fixer/SKILL.md`                       | filesystem     | HIGH  | Confirms debugger invocation                     |
| 18  | `.claude/skills/pr-review/SKILL.md`                              | filesystem     | HIGH  | Confirms performance-engineer + technical-writer |
| 19  | `.claude/skills/pr-review/reference/PARALLEL_AGENT_STRATEGY.md`  | filesystem     | HIGH  | technical-writer example confirmed               |
| 20  | `.research/custom-agents/findings/D3a-local-agents-inventory.md` | prior research | HIGH  | Corroborates frozen dates and tier assignments   |
| 21  | `.research/custom-agents/findings/D3c-cross-cutting-analysis.md` | prior research | HIGH  | Orphan and cluster confirmation                  |
| 22  | `.research/custom-agents/findings/D5a-workflow-gaps-skills.md`   | prior research | HIGH  | Workflow gap context                             |

---

## Contradictions

None. Invocation evidence from filesystem sources is consistent across
CLAUDE.md, AGENT_ORCHESTRATION.md, and skill files. Prior research findings
(D3a, D3c) are corroborated by direct file reads.

One ambiguity acknowledged: `backend-architect` appears in
AGENT_ORCHESTRATION.md capacity table with concrete estimates (3-5
items/session), suggesting historical use. But no CLAUDE.md mandate or skill
spawn confirms current active use. The DEFER decision reflects this ambiguity —
neither fully active nor clearly orphaned.

---

## Gaps

1. **Invocation history unavailable.** The `data/ecosystem-v2/invocations.jsonl`
   path was not found during prior research. Actual runtime invocation counts
   would sharpen confidence on "never invoked" claims. Orphan determination is
   based on integration surface (CLAUDE.md, skills), not empirical invocation
   counts.

2. **fullstack-developer / database-architect decision deferred.** The
   `backend-architect` DEFER decision awaits a broader resolution of the
   architecture cluster. This is a separate decision point.

3. **prompt-engineer vs convergence-loop-verifier overlap.** D5a identified
   convergence-loop verifier as the highest-ROI new agent. Whether
   `prompt-engineer` should be repurposed for this role vs a fresh agent
   requires SQ5/SQ8 synthesis.

---

## Serendipity

AGENT_ORCHESTRATION.md's concern-grouping table maps Architecture →
`backend-architect` specifically, not `fullstack-developer` or
`database-architect`. This implies the AGENT_ORCHESTRATION.md author considered
`backend-architect` the canonical orchestration-visible architecture agent, even
though `fullstack-developer` is 33x larger. This would shift the DEFER decision
toward a lighter SoNash-focused elevation of `backend-architect` as a
Firebase/Cloud Functions architecture specialist, rather than consolidation into
the heavier generic `fullstack-developer`. Flagged for the synthesizer as an
input to the architecture cluster decision.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 4
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

High confidence is grounded in direct filesystem reads with no ambiguity on
invocation evidence. MEDIUM claims are the three DEFER decisions where the gap
requires cross-SQ synthesis.
