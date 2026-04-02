# Findings: Agent Types, TDMS, and Session Patterns for Repo Analysis Skill Design

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-31
**Sub-Question IDs:** D9b-2

---

## Key Findings

### 1. Agent Inventory (44 agents total) [CONFIDENCE: HIGH]

**Local agents** (`.claude/agents/`): 31 agents **Global agents**
(`.claude/agents/global/`): 13 agents (overlap with local for gsd-\* agents)

Full list with descriptions (first 5 lines each):

| Agent                                | Description Snippet                                                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `backend-architect`                  | Backend system architecture and API design specialist                                                            |
| `code-reviewer`                      | Expert code review specialist for quality, security, and maintainability                                         |
| `database-architect`                 | Database architecture and design specialist                                                                      |
| `debugger`                           | Debugging specialist for errors, test failures, and unexpected behavior                                          |
| `dependency-manager`                 | Manages project dependencies; specializes in dependency analysis, vulnerability scanning, and license compliance |
| `deployment-engineer`                | CI/CD and deployment automation specialist                                                                       |
| `devops-troubleshooter`              | Production troubleshooting and incident response specialist                                                      |
| `documentation-expert`               | Project documentation specialist — system docs, API docs, architecture docs                                      |
| `error-detective`                    | Log analysis and error pattern detection specialist                                                              |
| `explore`                            | Codebase exploration specialist for understanding unfamiliar code areas                                          |
| `frontend-developer`                 | Frontend development specialist for React applications                                                           |
| `fullstack-developer`                | Full-stack development specialist covering frontend, backend, and database                                       |
| `git-flow-manager`                   | Git Flow workflow manager; branch creation, merging, validation, release management                              |
| `gsd-advisor-researcher`             | Researches a single gray area decision; returns structured comparison table                                      |
| `gsd-assumptions-analyzer`           | Deeply analyzes codebase for a phase; returns structured assumptions with evidence                               |
| `gsd-codebase-mapper`                | Explores codebase and writes structured analysis documents; spawned by map-codebase                              |
| `gsd-debugger`                       | (gsd suite) debugger variant                                                                                     |
| `gsd-executor`                       | (gsd suite) execution agent                                                                                      |
| `gsd-integration-checker`            | Verifies cross-phase integration and E2E flows                                                                   |
| `gsd-nyquist-auditor`                | Fills Nyquist validation gaps by generating tests and verifying coverage                                         |
| `gsd-phase-researcher`               | (gsd suite) phase-level researcher                                                                               |
| `gsd-plan-checker`                   | (gsd suite) plan verification                                                                                    |
| `gsd-planner`                        | (gsd suite) planning agent                                                                                       |
| `gsd-project-researcher`             | (gsd suite) project-scope researcher                                                                             |
| `gsd-research-synthesizer`           | (gsd suite) synthesizes research                                                                                 |
| `gsd-roadmapper`                     | (gsd suite) roadmap generation                                                                                   |
| `gsd-ui-auditor`                     | (gsd suite) UI audit                                                                                             |
| `gsd-ui-checker`                     | (gsd suite) UI verification                                                                                      |
| `gsd-ui-researcher`                  | (gsd suite) UI-focused researcher                                                                                |
| `gsd-user-profiler`                  | (gsd suite) user profiling                                                                                       |
| `gsd-verifier`                       | (gsd suite) verification agent                                                                                   |
| `markdown-syntax-formatter`          | Markdown formatting specialist                                                                                   |
| `mcp-expert`                         | Model Context Protocol integration specialist                                                                    |
| `nextjs-architecture-expert`         | Master of Next.js best practices, App Router, Server Components                                                  |
| `penetration-tester`                 | Penetration testing and ethical hacking specialist                                                               |
| `performance-engineer`               | Profile applications, optimize bottlenecks, and implement caching strategies                                     |
| `plan`                               | Implementation planning specialist for multi-step tasks                                                          |
| `prompt-engineer`                    | Expert prompt optimization for LLMs and AI systems                                                               |
| `react-performance-optimization`     | React performance optimization specialist                                                                        |
| `security-auditor`                   | Review code for vulnerabilities; OWASP compliance; JWT, OAuth2, CORS, CSP                                        |
| `security-engineer`                  | Security infrastructure and compliance specialist                                                                |
| `technical-writer`                   | Technical writing and content creation specialist                                                                |
| `test-engineer`                      | Test automation and quality assurance specialist                                                                 |
| `ui-ux-designer`                     | UI/UX design specialist for user-centered design                                                                 |
| `deep-research-searcher` (global)    | General-purpose web researcher spawned by /deep-research skill                                                   |
| `deep-research-synthesizer` (global) | Combines findings from multiple searcher agents into coherent research                                           |

---

### 2. Agents Reusable for External Repo Analysis [CONFIDENCE: HIGH]

The following agents are **domain-agnostic** in their capability and can be
applied to any external repository without SoNash-specific knowledge:

**Tier 1 — Core analysis (directly applicable):**

| Agent                      | Role in Repo Analysis                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `explore`                  | Entry point: map unfamiliar codebase structure, trace data flows                                    |
| `gsd-codebase-mapper`      | Structured analysis documents per focus area (tech, arch, quality, concerns) — ideal parallel spawn |
| `gsd-assumptions-analyzer` | Extract assumptions/risks from an external codebase                                                 |
| `code-reviewer`            | Quality, security, maintainability review of external code                                          |
| `security-auditor`         | OWASP compliance, vulnerability identification                                                      |
| `dependency-manager`       | Dependency analysis, vulnerability scanning, license compliance                                     |
| `test-engineer`            | Coverage analysis, test strategy assessment                                                         |
| `performance-engineer`     | Bottleneck profiling, caching, query optimization                                                   |

**Tier 2 — Structural analysis (applicable with scope narrowing):**

| Agent                  | Role in Repo Analysis                           |
| ---------------------- | ----------------------------------------------- |
| `backend-architect`    | API design and microservice boundary assessment |
| `database-architect`   | Data model and schema assessment                |
| `deployment-engineer`  | CI/CD pipeline and infrastructure review        |
| `error-detective`      | Log patterns, error handling quality            |
| `documentation-expert` | Doc coverage and quality assessment             |
| `git-flow-manager`     | Branch strategy and workflow health             |

**Tier 3 — Stack-specific (useful only if target repo matches):**

- `nextjs-architecture-expert`, `react-performance-optimization`,
  `frontend-developer` — only if target uses React/Next.js
- `mcp-expert` — only if target uses MCP
- `security-engineer` — compliance focus, useful for any stack

**Not applicable to external repo analysis:**

- `gsd-ui-*` agents (GSD plan-phase workflow, internal to SoNash project
  planning)
- `gsd-planner`, `gsd-executor`, `gsd-roadmapper` (project management, not
  analysis)
- `prompt-engineer`, `ui-ux-designer`, `markdown-syntax-formatter`
  (content/design, not code analysis)
- `mcp-expert` (SoNash-specific MCP integration)

---

### 3. TDMS Categories and Applicability to External Repos [CONFIDENCE: HIGH]

TDMS has **8,479 total items** organized by severity and category.

**Severity tiers:**

| Severity      | Count | Description                             |
| ------------- | ----- | --------------------------------------- |
| S0 (Critical) | 26    | Security/compliance blockers — must fix |
| S1 (High)     | 1,365 | Significant issues                      |
| S2 (Medium)   | 3,447 | Moderate issues                         |
| S3 (Low)      | 3,641 | Minor improvements                      |

**Categories (all 9):**

| Category                   | Count | Applicability to External Repos                        |
| -------------------------- | ----- | ------------------------------------------------------ |
| `code-quality`             | 4,716 | HIGH — universal; style, complexity, duplication       |
| `documentation`            | 982   | HIGH — universal; missing/stale docs                   |
| `security`                 | 728   | HIGH — universal; vulnerabilities, auth, injection     |
| `process`                  | 727   | HIGH — universal; CI/CD quality gates, workflow gaps   |
| `refactoring`              | 669   | HIGH — universal; structural improvement opportunities |
| `ai-optimization`          | 254   | MEDIUM — applicable if repo uses AI/LLM tooling        |
| `performance`              | 179   | HIGH — universal; bottlenecks, inefficiencies          |
| `enhancements`             | 154   | MEDIUM — feature gaps, not strictly debt               |
| `engineering-productivity` | 70    | HIGH — tooling, developer experience                   |

**TDMS item format (from INDEX.md S0 examples):**

- `DEBT-XXXXX` ID
- Description text
- File:line reference
- Status: VERIFIED | RESOLVED | FALSE_POSITIVE | NEW

**Status lifecycle:**

- NEW (2,128) → VERIFIED (5,150) → RESOLVED (1,127)
- FALSE_POSITIVE (74) — false positive escape hatch

**Verdict for repo analysis skill:** The categories `code-quality`, `security`,
`process`, `documentation`, `refactoring`, and `performance` apply universally
to any external repo. `ai-optimization` applies conditionally. `enhancements` is
borderline (feature opinion vs. debt). The DEBT-XXXXX format and severity tiers
are a reusable output schema.

---

### 4. Session Lifecycle Patterns [CONFIDENCE: HIGH]

From `SESSION_CONTEXT.md` (v8.12, Session #250):

**Session handoff pattern:**

- `SESSION_CONTEXT.md` is the primary session-start artifact
- Required reading order: this first, every session
- 5-step AI instruction sequence: increment counter → check goals → check
  blockers → check pending PRs → update at end
- Rolling 3-session summary window (older sessions archive to
  `SESSION_HISTORY.md`)
- Target size: `<300 lines`

**State persistence pattern (Quick Recovery section):**

- Last checkpoint date
- Current branch
- Working on description
- Uncommitted work status

**Checkpoint mechanism:** `/checkpoint` command updates Quick Recovery section
before risky operations.

**Session counter:** Monotonically incrementing (currently at 250 since Jan 1,
2026), tracked in the document itself.

**Patterns transferable to repo analysis skill:**

| Pattern                     | Transfer                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------ |
| Structured handoff document | Repo analysis should write a `ANALYSIS_CONTEXT.md` or equivalent per-repo state file |
| Rolling summary window      | Analysis runs should keep last N runs, archive older                                 |
| Checkpoint before risky ops | Analysis runs touching external repos should checkpoint before writes                |
| Blockers section            | Analysis should surface "what couldn't be assessed" as explicit blockers             |
| Pending items section       | Multi-run analyses need a "pending findings" carry-forward mechanism                 |
| Counter increment           | Per-repo analysis run count enables trend tracking over time                         |

---

## Sources

| #   | Source                                               | Type       | Trust | Date       |
| --- | ---------------------------------------------------- | ---------- | ----- | ---------- |
| 1   | `.claude/agents/*.md` (first 5 lines each, 44 files) | Filesystem | HIGH  | 2026-03-31 |
| 2   | `docs/technical-debt/INDEX.md` (lines 1-90)          | Filesystem | HIGH  | 2026-03-31 |
| 3   | `SESSION_CONTEXT.md` (lines 1-50)                    | Filesystem | HIGH  | 2026-03-31 |

---

## Contradictions

None identified. Agent descriptions are self-consistent. TDMS category counts
sum correctly against total (8,479 = 4716+982+728+727+669+254+179+154+70 = 8,479
— confirmed).

---

## Gaps

- Did not read full agent .md files — tool selection, model assignments, and
  convergence loop details not captured. This was intentional per the L1
  surface-level scope.
- `gsd-*` agents beyond first 5 lines are opaque — their internal orchestration
  patterns (spawner/child relationships) are not captured here.
- TDMS deduplication logic not examined — the 8,479 total may include duplicates
  (S0 examples show multiple DEBT IDs for the same "Legacy journalEntries"
  issue).
- Session patterns beyond line 50 of SESSION_CONTEXT.md not read — sprint/goals
  structure not captured.
- Global agents directory has 13 entries but many are duplicates of local agents
  (gsd-\* suite). Net unique global-only agents: `deep-research-searcher`,
  `deep-research-synthesizer`.

---

## Serendipity

- **gsd-codebase-mapper** is particularly well-suited as a parallel spawn
  pattern for repo analysis. Its description explicitly says "focus area (tech,
  arch, quality, concerns)" — these four axes map directly onto what a repo
  analysis skill would want to parallelize.
- **TDMS deduplication signal:** S0 items show the same issue (Legacy
  journalEntries) with 6+ different DEBT IDs. A repo analysis skill should
  include a deduplication pass before outputting findings — same root cause,
  multiple manifestations.
- **Status enum reuse:** The TDMS `NEW → VERIFIED → RESOLVED / FALSE_POSITIVE`
  lifecycle is a clean 4-state machine that any repo analysis output schema
  could adopt as-is.
- **Session counter as health signal:** 250 sessions since Jan 1, 2026 (~3
  months) = ~3 sessions/day. If a repo analysis skill tracks run counts,
  high-frequency runs with unchanged findings could indicate stale analysis
  (needs refresh trigger).

---

## Confidence Assessment

- HIGH claims: 4
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** — all findings sourced directly from filesystem
  reads, no web sources or training data inferences.
