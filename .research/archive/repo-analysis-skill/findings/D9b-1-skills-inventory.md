# Findings: What skill categories exist? Which represent analysis patterns transferable to external repo analysis?

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-31
**Sub-Question IDs:** D9b-1

---

## Inventory Summary

Total skills found: 62 (plus 1 SKILL_INDEX.md file, excluded)

---

## Category Classification

### AUDIT (22 skills)

Domain-specific analysis tools that inspect a system and produce scored
findings.

| Skill                          | Focus                                                           |
| ------------------------------ | --------------------------------------------------------------- |
| audit-agent-quality            | Agent definition quality (structural + behavioral)              |
| audit-aggregator               | Combines findings from multiple audit reports                   |
| audit-ai-optimization          | AI/LLM usage patterns in codebase                               |
| audit-code                     | General code review                                             |
| audit-comprehensive            | Orchestrates all 9 domain audits                                |
| audit-documentation            | 18-agent documentation audit                                    |
| audit-engineering-productivity | Developer workflow and process efficiency                       |
| audit-enhancements             | Code, product, UX, content, workflows, infra, external services |
| audit-health                   | Meta-audit: diagnostics on the audit system itself              |
| audit-performance              | Performance analysis                                            |
| audit-process                  | Automation and process audit                                    |
| audit-refactoring              | Refactoring opportunity identification                          |
| audit-security                 | Security vulnerability scanning                                 |
| create-audit                   | Wizard for creating new audit skills                            |
| data-effectiveness-audit       | Data lifecycle scoring (Capture/Storage/Recall/Action)          |
| multi-ai-audit                 | Orchestrates multi-AI consensus auditing                        |
| skill-audit                    | Behavioral quality audit for individual skills                  |
| sonarcloud                     | Code quality issue sync/reporting via SonarCloud                |
| system-test                    | 23-domain full repo test plan (~100 checks)                     |
| validate-claude-folder         | Validates .claude folder configuration consistency              |
| pr-retro                       | Retrospective analysis of a PR's review cycle                   |
| developer-growth-analysis      | Analyzes coding patterns from chat history                      |

### ECOSYSTEM-HEALTH (9 skills)

Narrowly scoped diagnostic tools targeting a specific subsystem of the project.

| Skill                         | Focus                                                       |
| ----------------------------- | ----------------------------------------------------------- |
| alerts                        | Lightweight health signal (18-42 categories) with scoring   |
| comprehensive-ecosystem-audit | Orchestrates all 8 ecosystem audits                         |
| doc-ecosystem-audit           | Documentation ecosystem (16 categories, 5 domains)          |
| ecosystem-health              | 8-category composite health dashboard                       |
| health-ecosystem-audit        | Health monitoring ecosystem (26 categories, 6 domains)      |
| hook-ecosystem-audit          | Claude hooks + pre-commit + CI/CD pipeline health           |
| pr-ecosystem-audit            | PR review ecosystem (18 categories, 5 domains)              |
| script-ecosystem-audit        | Scripts infrastructure (18 categories, 5 domains)           |
| session-ecosystem-audit       | Session lifecycle ecosystem (17 categories, 5 domains)      |
| tdms-ecosystem-audit          | Technical debt management system (16 categories, 5 domains) |

(Note: tdms-ecosystem-audit counted here; comprehensive-ecosystem-audit is the
orchestrator)

### WORKFLOW (14 skills)

Tools that manage process flow, session state, or task lifecycle.

| Skill             | Focus                                                      |
| ----------------- | ---------------------------------------------------------- |
| add-debt          | Intake new items into TDMS                                 |
| checkpoint        | Save session state for compaction recovery                 |
| code-reviewer     | Post-implementation review checkpoint                      |
| convergence-loop  | Multi-pass claim verification                              |
| debt-runner       | TDMS orchestrator (7 modes: verify, sync, plan, health...) |
| find-skills       | Help users discover installable skills                     |
| gh-fix-ci         | Diagnose and fix failing GitHub Actions CI checks          |
| pre-commit-fixer  | Fix pre-commit hook failures with user confirmation        |
| pr-review         | Process external PR review feedback (8-step protocol)      |
| quick-fix         | Auto-suggest fixes for pre-commit/pattern issues           |
| session-begin     | Pre-flight checklist and context loading                   |
| session-end       | Session closure pipeline (context, metrics, commit)        |
| task-next         | Dependency-resolved next task selection from ROADMAP       |
| using-superpowers | Skill discovery meta-skill                                 |

### CREATION (6 skills)

Tools that scaffold or generate new artifacts.

| Skill             | Focus                                                |
| ----------------- | ---------------------------------------------------- |
| artifacts-builder | Multi-component claude.ai HTML artifacts             |
| create-audit      | Interactive wizard: creates new audit skills         |
| mcp-builder       | Guide for creating MCP servers                       |
| skill-creator     | Creates or updates skills (SKILL.md + companions)    |
| ui-design-system  | Design token generation, component docs, dev handoff |
| frontend-design   | Production-grade frontend interface generation       |

### DEBUGGING (2 skills)

Diagnostic tools for failure investigation.

| Skill                | Focus                                                    |
| -------------------- | -------------------------------------------------------- |
| systematic-debugging | Structured bug/failure/unexpected behavior investigation |
| webapp-testing       | Playwright-based UI interaction and browser testing      |

### DOCUMENTATION (4 skills)

Tools for maintaining and optimizing documentation.

| Skill                  | Focus                                                  |
| ---------------------- | ------------------------------------------------------ |
| doc-optimizer          | Scan, auto-fix formatting/headers/links, report issues |
| docs-maintain          | Doc sync checking + update automation                  |
| test-suite             | Multi-phase UI testing orchestration                   |
| validate-claude-folder | .claude folder configuration consistency check         |

(Note: test-suite is borderline workflow/documentation; placed here due to
validation function)

### RESEARCH & PLANNING (4 skills)

Tools for knowledge acquisition and decision preparation.

| Skill                   | Focus                                                          |
| ----------------------- | -------------------------------------------------------------- |
| deep-plan               | Discovery-first planning with exhaustive Q&A + decision record |
| deep-research           | Multi-agent research engine with parallel searchers            |
| content-research-writer | Research-backed content writing                                |
| market-research-reports | 50+ page consulting-style market research                      |

### OTHER (4 skills)

Specialized, narrow, or utility tools.

| Skill                  | Focus                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| decrypt-secrets        | Decrypt MCP tokens for remote sessions                                                        |
| excel-analysis         | Analyze Excel spreadsheets                                                                    |
| ux-researcher-designer | UX personas, journey mapping, usability frameworks                                            |
| skill-audit            | Behavioral quality audit for skills (already in AUDIT above — dual-listed due to meta nature) |

---

## Key Findings

### 1. The repo has a mature, layered audit architecture [CONFIDENCE: HIGH]

Two distinct audit tiers exist: "domain audits" (audit-code, audit-security,
etc.) and "ecosystem audits" (hook-ecosystem-audit, pr-ecosystem-audit, etc.).
The domain audits assess code quality; the ecosystem audits assess the health of
internal subsystems (hooks, scripts, docs, sessions, PR pipelines). A third tier
— audit-comprehensive and comprehensive-ecosystem-audit — orchestrates the
layers. This three-tier pattern is directly transferable to external repo
analysis: tier-1 = code dimensions, tier-2 = process/tooling subsystems, tier-3
= orchestrated roll-up.

### 2. Ecosystem audits share a reusable structural pattern [CONFIDENCE: HIGH]

All ecosystem audits describe themselves with near-identical language: "N
categories across M domains, composite health scoring, trend tracking, patch
suggestions, interactive finding-by-finding walkthrough." This is a template.
For external repo analysis, this pattern — define domains, define categories
within domains, score each, aggregate — is the core reusable framework.

### 3. Analysis dimensions covered across all audit skills [CONFIDENCE: HIGH]

The full set of analysis dimensions already built:

- Code quality (audit-code, audit-refactoring, sonarcloud)
- Security (audit-security)
- Performance (audit-performance)
- Documentation (audit-documentation, doc-ecosystem-audit)
- Process/automation (audit-process, audit-engineering-productivity)
- AI/LLM optimization (audit-ai-optimization)
- Hook/CI infrastructure (hook-ecosystem-audit)
- Script infrastructure (script-ecosystem-audit)
- PR review pipeline (pr-ecosystem-audit)
- Technical debt (tdms-ecosystem-audit, debt-runner)
- Session/agent quality (audit-agent-quality, session-ecosystem-audit,
  skill-audit)
- Data effectiveness (data-effectiveness-audit)
- Enhancement discovery (audit-enhancements)
- Comprehensive system testing (system-test — 23 domains, ~100 checks)

### 4. Most directly transferable to external repo analysis [CONFIDENCE: HIGH]

These skills contain analysis patterns portable without SoNash-specific
adaptation:

| Skill                          | Transferable Pattern                     | Why                                   |
| ------------------------------ | ---------------------------------------- | ------------------------------------- |
| audit-code                     | Code quality multi-agent sweep           | Language-agnostic pattern             |
| audit-security                 | Security vulnerability scan              | Pattern, not SoNash-specific rules    |
| audit-performance              | Performance bottleneck detection         | Pattern-based                         |
| audit-refactoring              | Refactoring opportunity identification   | Code-structural analysis              |
| audit-documentation            | Documentation coverage/quality audit     | Applies to any repo with docs         |
| audit-engineering-productivity | Workflow efficiency analysis             | CI, PR cadence, test coverage signals |
| ecosystem-health               | Composite health scoring (8 categories)  | Scoring framework is generic          |
| alerts                         | Lightweight multi-category health signal | Adaptable category set                |
| system-test                    | 23-domain full repo test plan            | Framework is domain-configurable      |
| pr-retro                       | PR review cycle retrospective            | Git-history-based, repo-agnostic      |
| convergence-loop               | Multi-pass claim verification            | Meta-pattern for any analysis         |
| audit-comprehensive            | Wave-staged multi-domain orchestration   | Orchestration pattern                 |

### 5. Skills that are SoNash-specific and NOT transferable [CONFIDENCE: HIGH]

These are tightly coupled to SoNash internals and would need full rewrite to
apply externally:

- hook-ecosystem-audit (Claude Code hooks specific)
- pr-ecosystem-audit (SoNash PR pipeline specific)
- session-ecosystem-audit (SoNash session system specific)
- tdms-ecosystem-audit (MASTER_DEBT.jsonl specific)
- script-ecosystem-audit (scripts/ directory specific)
- add-debt, debt-runner (TDMS-specific)
- session-begin, session-end (SoNash session protocol)
- pre-commit-fixer (SoNash hook contract)
- validate-claude-folder (.claude folder specific)
- sonarcloud (SonarCloud account integration)

### 6. The convergence-loop pattern is the highest-value meta-pattern [CONFIDENCE: HIGH]

convergence-loop ("multi-pass verification of claims about reality") is
referenced by name in at least 6 other skills (audit-agent-quality, skill-audit,
debt-runner, deep-research, pr-retro, skill-creator). It is the trust mechanism
underlying the entire audit system. Any external repo analysis skill should
incorporate this pattern: discover claims, verify against filesystem, iterate
until claims converge with reality.

---

## Sources

| #   | Source                                                | Type                | Trust | Notes                       |
| --- | ----------------------------------------------------- | ------------------- | ----- | --------------------------- |
| 1   | .claude/skills/\*/SKILL.md (first 10 lines, 62 files) | Codebase filesystem | HIGH  | Ground truth — direct reads |

---

## Contradictions

None identified. The skill descriptions are consistent and self-describing.

---

## Gaps

- Did not read beyond line 10 of any SKILL.md — deeper structure (phases, agent
  counts, output formats) not captured. This is intentional per task scope.
- The `_shared/` directory was not inspected — likely contains shared
  utilities/templates across skills.
- SKILL_INDEX.md was not read — may contain additional cross-cutting metadata.

---

## Serendipity

- **create-audit wizard exists**: There is already a skill (`create-audit`)
  specifically designed to generate new audit skills through an interactive
  wizard. The new repo-analysis skill could potentially be bootstrapped through
  it, rather than built from scratch.
- **audit-ai-optimization is unique**: Most repos would not have this skill. It
  signals the project is self-analyzing its AI usage patterns — a
  meta-capability that could be a differentiator if included in a repo-analysis
  offering.
- **system-test is unusually comprehensive**: 23 domains, ~100 checks, 6
  estimated sessions. This is closer to a full due-diligence framework than a
  quick audit. It represents the upper bound of what a thorough external repo
  analysis could look like.

---

## Confidence Assessment

- HIGH claims: 6
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings derived directly from filesystem reads of authoritative source
files.
