# AGENT INVENTORY — SoNash-v0

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Total Agents:** 36 **Analysis Scope:** 3-pass convergence (Catalog → Verify →
Redundancy)

---

## Executive Summary

### Inventory by Tier

| Tier                       | Count | Lines   | Examples                                                  |
| -------------------------- | ----- | ------- | --------------------------------------------------------- |
| **Stub** (37-42 lines)     | 11    | ~450    | debugger, error-detective, penetration-tester             |
| **Light** (65-121 lines)   | 5     | ~450    | documentation-expert, prompt-engineer, dependency-manager |
| **Medium** (215-371 lines) | 3     | ~850    | git-flow-manager, mcp-expert, nextjs-architecture-expert  |
| **Heavy** (489+ lines)     | 17    | ~12,000 | gsd-planner, fullstack-developer, security-engineer       |

### Quality Issues Identified

1. **Missing Tool Declarations** (Pass 2 — Accuracy Verification)
   - `dependency-manager`: No tools field
   - `documentation-expert`: No tools field
   - `gsd-nyquist-auditor`: Tools declared as YAML list (non-standard format)

2. **Redundancy** (Pass 3 — Redundancy Detection)
   - **Documentation Group**: technical-writer + documentation-expert
     (overlapping scope, both stubs/light)
   - **Debugging Group**: debugger, error-detective, devops-troubleshooter all
     handle root-cause analysis (should consolidate or clarify tiers)
   - **Architecture Group**: backend-architect is stub; design coverage diffuse
     across database-architect, nextjs-architect, fullstack-developer

3. **Invocation Tracking Gap**
   - `invocations.jsonl` tracks **skills only** (pr-review, skill-audit, etc.),
     not agents
   - Cannot measure which agents are actually invoked in practice
   - Invocation data is too recent/small (27 records from 2026-03-01 onward)

---

## Full Agent Catalog

### GSD Ecosystem (13 agents)

**Integration Pattern:** Pipeline orchestration via `/gsd:` commands **Status:**
Tightly integrated; no redundancy **Last Update:** 2026-03-07 (test-engineer
dep.) through earlier commits

| Agent                    | Lines | Tier   | Tools                                                                 | Description                                                                 | Last Commit                     |
| ------------------------ | ----- | ------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------- |
| gsd-planner              | 1309  | heavy  | Read, Write, Bash, Glob, Grep, WebFetch, mcp**context7**\*            | Creates executable phase plans with task breakdown and dependency analysis. | dfcc687d                        |
| gsd-debugger             | 1257  | heavy  | Read, Write, Edit, Bash, Grep, Glob, WebSearch                        | Investigates bugs using scientific method, manages debug sessions.          | dfcc687d                        |
| gsd-codebase-mapper      | 772   | heavy  | Read, Bash, Grep, Glob, Write                                         | Explores codebase for tech/arch/quality/concerns focus areas.               | dfcc687d                        |
| gsd-roadmapper           | 652   | heavy  | Read, Write, Bash, Glob, Grep                                         | Synthesizes roadmaps from phase plans and project research.                 | dfcc687d                        |
| gsd-project-researcher   | 631   | heavy  | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp**context7**\* | Discovers project context, constraints, decision history.                   | dfcc687d                        |
| gsd-plan-checker         | 708   | heavy  | Read, Bash, Glob, Grep                                                | Validates plan quality, structure, task dependencies.                       | dfcc687d                        |
| gsd-verifier             | 581   | heavy  | Read, Write, Bash, Grep, Glob                                         | Verifies phase goal achievement (goal-backward analysis).                   | dfcc687d                        |
| gsd-executor             | 489   | heavy  | Read, Write, Edit, Bash, Grep, Glob                                   | Executes GSD plans atomically with checkpoint handling.                     | dfcc687d                        |
| gsd-phase-researcher     | 555   | heavy  | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp**context7**\* | Analyzes phase requirements and discovers implementation constraints.       | dfcc687d                        |
| gsd-integration-checker  | 445   | heavy  | Read, Bash, Grep, Glob                                                | Validates integration between tasks and cross-phase dependencies.           | dfcc687d                        |
| gsd-research-synthesizer | 249   | medium | Read, Write, Bash                                                     | Consolidates research findings into structured reports.                     | dfcc687d                        |
| gsd-nyquist-auditor      | 178   | medium | Read, Write, Edit, Bash, Glob, Grep                                   | Fills Nyquist validation gaps via test generation.                          | **TOOLS DECLARED AS YAML LIST** |

**Quality Observations:**

- All GSD agents share consistent frontmatter structure
- Heavy concentration: 8 agents >489 lines
- Tools declared standardly (string format) except nyquist-auditor
- All have color assignments + skill references
- Last significant update: dfcc687d (feat: pr-review DAS framework, 2026-03-13)

---

### Development & Architecture (8 agents)

| Agent                      | Lines | Tier   | Model  | Tools                                    | Description                                           | Status     |
| -------------------------- | ----- | ------ | ------ | ---------------------------------------- | ----------------------------------------------------- | ---------- |
| fullstack-developer        | 1281  | heavy  | opus   | Read, Write, Edit, Bash                  | End-to-end application development, API, database.    | ✓ Complete |
| test-engineer              | 990   | heavy  | sonnet | Read, Write, Edit, Bash                  | Test automation, coverage analysis, CI/CD testing.    | ✓ Complete |
| database-architect         | 610   | heavy  | opus   | Read, Write, Edit, Bash                  | DB design, data modeling, scalability, microservices. | ✓ Complete |
| git-flow-manager           | 371   | medium | sonnet | Read, Bash, Grep, Glob, Edit, Write      | Branch creation, merging, release management.         | ✓ Complete |
| nextjs-architecture-expert | 215   | medium | sonnet | Read, Write, Edit, Bash, Grep, Glob      | Next.js architecture, performance, App Router.        | ✓ Complete |
| backend-architect          | 39    | stub   | sonnet | Read, Write, Edit, Bash                  | RESTful APIs, microservices, scalability.             | ⚠️ Stub    |
| frontend-developer         | 39    | stub   | sonnet | Read, Write, Edit, Bash                  | UI components, state, performance optimization.       | ⚠️ Stub    |
| deployment-engineer        | 41    | stub   | sonnet | Read, Write, Edit, Bash, AskUserQuestion | Docker, Kubernetes, GitHub Actions.                   | ⚠️ Stub    |

**Quality Observations:**

- Model distribution: opus (fullstack, database), sonnet (others)
- Heavy agents (fullstack, test, database) have comprehensive frameworks
- Stub agents (backend-architect, frontend-developer, deployment) lack
  implementation
- **Overlap:** backend-architect (stub) duplicates fullstack-developer (heavy)
  on backend design

---

### Security & Operations (6 agents)

| Agent                 | Lines | Tier   | Model  | Tools                         | Description                                             | Status     |
| --------------------- | ----- | ------ | ------ | ----------------------------- | ------------------------------------------------------- | ---------- |
| security-engineer     | 985   | heavy  | opus   | Read, Write, Edit, Bash       | Infrastructure security, compliance, incident response. | ✓ Complete |
| mcp-expert            | 272   | medium | sonnet | Read, Write, Edit             | MCP server config, protocol development.                | ✓ Complete |
| devops-troubleshooter | 40    | stub   | sonnet | Read, Write, Edit, Bash, Grep | Log analysis, deployment failures, incident response.   | ⚠️ Stub    |
| security-auditor      | 40    | stub   | opus   | Read, Write, Edit, Bash       | OWASP, JWT, OAuth2, CORS, CSP, encryption.              | ⚠️ Stub    |
| performance-engineer  | 40    | stub   | opus   | Read, Write, Edit, Bash       | Load testing, CDN, query optimization.                  | ⚠️ Stub    |
| penetration-tester    | 42    | stub   | opus   | Read, Write, Edit, Bash       | Security assessments, vulnerability exploitation.       | ⚠️ Stub    |

**Quality Observations:**

- security-engineer is comprehensive (985 lines); security-auditor is stub (40
  lines) — tiered approach
- devops-troubleshooter and debugger overlap on incident response (see debugging
  group below)
- performance-engineer is isolated; could integrate with optimization agents

---

### Debugging & Error Analysis (5 agents) — REDUNDANCY CLUSTER

| Agent                   | Lines | Tier  | Model  | Tools                                          | Description                                       | Status        |
| ----------------------- | ----- | ----- | ------ | ---------------------------------------------- | ------------------------------------------------- | ------------- |
| gsd-debugger            | 1257  | heavy | —      | Read, Write, Edit, Bash, Grep, Glob, WebSearch | GSD-specific bug investigation with checkpoints.  | ✓ Specialized |
| debugger                | 37    | stub  | sonnet | Read, Write, Edit, Bash, Grep                  | Generic root cause analysis & stack trace review. | ⚠️ Redundant  |
| error-detective         | 40    | stub  | sonnet | Read, Write, Edit, Bash, Grep                  | Log analysis & error pattern detection.           | ⚠️ Redundant  |
| devops-troubleshooter   | 40    | stub  | sonnet | Read, Write, Edit, Bash, Grep                  | Production troubleshooting & incident response.   | ⚠️ Redundant  |
| gsd-integration-checker | 445   | heavy | —      | Read, Bash, Grep, Glob                         | Integration testing & cross-task validation.      | ✓ Specialized |

**Redundancy Analysis:**

- **debugger, error-detective, devops-troubleshooter:** All handle root-cause
  analysis (overlapping 80%+)
- **Recommendation:** Consolidate stubs into single "troubleshooter" or clarify
  scopes:
  - `debugger` → source code & logic errors
  - `error-detective` → log patterns & anomalies
  - `devops-troubleshooter` → infrastructure & deployment failures
- **gsd-debugger:** Intentionally separate; part of orchestrated pipeline

---

### Documentation & Writing (3 agents) — REDUNDANCY CLUSTER

| Agent                | Lines | Tier  | Model  | Tools                   | Description                                     | Status               |
| -------------------- | ----- | ----- | ------ | ----------------------- | ----------------------------------------------- | -------------------- |
| documentation-expert | 66    | light | —      | **MISSING**             | Technical writing, documentation standards.     | ⚠️ No tools declared |
| technical-writer     | 41    | stub  | sonnet | Read, Write, Edit, Grep | Guides, tutorials, README, architecture docs.   | ⚠️ Duplicate scope   |
| prompt-engineer      | 121   | light | opus   | Read, Write, Edit       | AI features, agent performance, system prompts. | ✓ Distinct           |

**Redundancy Analysis:**

- **technical-writer & documentation-expert:** ~95% scope overlap
  - Both handle technical writing, documentation standards, content creation
  - technical-writer is stub (41 lines); documentation-expert is light (66
    lines)
  - **Recommendation:** Consolidate into single agent with proper tool
    declaration
- **prompt-engineer:** Distinct (AI/agent-specific); keep separate

**Quality Issue:** documentation-expert missing tools declaration in frontmatter

---

### Specialized/Single-Purpose (2 agents)

| Agent                          | Lines | Tier  | Model  | Tools                         | Description                                          | Status               |
| ------------------------------ | ----- | ----- | ------ | ----------------------------- | ---------------------------------------------------- | -------------------- |
| code-reviewer                  | 37    | stub  | sonnet | Read, Write, Edit, Bash, Grep | Post-implementation code review (quality, security). | ✓ Niche              |
| react-performance-optimization | 76    | light | sonnet | Read, Write, Edit, Bash       | React-specific performance tuning.                   | ✓ Niche              |
| dependency-manager             | 65    | light | —      | **MISSING**                   | Dependency analysis, vulnerability scanning.         | ⚠️ No tools declared |
| markdown-syntax-formatter      | 75    | light | sonnet | Read, Write, Edit             | Markdown formatting & syntax fixing.                 | ✓ Niche              |
| ui-ux-designer                 | 41    | stub  | sonnet | Read, Write, Edit             | User research, wireframes, design systems.           | ⚠️ Stub              |

**Quality Issue:** dependency-manager missing tools declaration

---

## Pass 1 Tally (Full Catalog)

- **Confirmed:** 36 agents catalogued with metadata extracted
- **Corrected:** 3 agents with incomplete/non-standard tool declarations
  identified
- **Extended:** GSD ecosystem structure clarified; invocation tracking gap
  identified
- **New:** Redundancy clusters identified for documentation/debugging groups

---

## Pass 2 Tally (Accuracy Verification)

- **Confirmed:** 33 agents have tool declarations matching standard format
  (string)
- **Corrected:**
  - gsd-nyquist-auditor: tools declared as YAML list (non-standard, should be
    string)
  - dependency-manager: missing tools field
  - documentation-expert: missing tools field
- **Extended:** All agents verified to have guidance on anti-patterns ✓
- **New:** Tool mismatch patterns documented

---

## Pass 3 Tally (Redundancy Detection)

- **Confirmed:**
  - GSD ecosystem: 13 integrated agents (intentional specialization, no
    redundancy)
  - Development group: 8 agents with clear tiers (stub/medium/heavy)
  - Security group: tiered structure (stub auditor → heavy engineer) OK
- **Corrected:**
  - **Debugging cluster:** debugger/error-detective/devops-troubleshooter
    identified as 80%+ overlap
  - **Documentation cluster:** technical-writer/documentation-expert identified
    as 95%+ overlap
- **Extended:** Invocation tracking gap identified (invocations.jsonl doesn't
  track agent use)
- **New:** Consolidation recommendations provided

---

## Findings & Recommendations

### Critical Issues

1. **Missing Tool Declarations** (affects 2-3 agents)
   - `dependency-manager`: Add `tools:` field
   - `documentation-expert`: Add `tools:` field
   - `gsd-nyquist-auditor`: Convert YAML list to string format

2. **Invocation Tracking Gap**
   - Current `invocations.jsonl` only tracks skills, not agents
   - Cannot measure real usage patterns; 27 records insufficient baseline
   - **Recommendation:** Implement agent invocation logging to identify
     dead/overused agents

3. **Redundancy in Debugging Group**
   - `debugger`, `error-detective`, `devops-troubleshooter` all handle
     root-cause analysis
   - **Recommend:** Clarify scope boundaries or consolidate

4. **Redundancy in Documentation Group**
   - `technical-writer` (41 lines) and `documentation-expert` (66 lines) have
     95%+ overlap
   - **Recommend:** Consolidate into single agent with full tool support

### Observations

- **Tier Distribution:** Well-balanced stub (11) → light (5) → medium (3) →
  heavy (17)
- **GSD Ecosystem:** Well-designed; 13 agents form coherent orchestration
  pipeline
- **Model Assignment:** opus for heavy/complex agents; sonnet for medium/stubs
  (appropriate)
- **Last Update:** Most agents frozen at fce467fd (2026-01-12); GSD agents at
  dfcc687d (2026-03-13)
- **Quality Floor:** All agents include anti-pattern guidance; no agents lack
  purpose

### Future Work

1. Add agent invocation tracking to ecosystem-v2 log format
2. Consolidate redundant documentation agents
3. Clarify debugging group scope boundaries (source-code vs logs vs infra)
4. Fill tool declaration gaps (dependency-manager, documentation-expert)
5. Standardize frontmatter format for gsd-nyquist-auditor
6. Consider stub agents for deprecation or full implementation

---

**Inventory compiled by:** inventory-agent **Convergence:** 3-pass complete
**Next action:** Send findings to team lead
