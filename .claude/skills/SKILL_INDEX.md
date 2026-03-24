# Skill Index

**Version**: 2.6 **Last Updated**: 2026-03-24 **Total Skills**: 64

Quick reference for all available Claude Code skills organized by category.

---

## Usage

```
/skill-name [arguments]
```

---

## Categories

### Audit & Code Quality (30 skills)

| Skill                             | Description                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `/audit-comprehensive`            | Run all 9 audit domains in staged waves                                         |
| `/audit-agent-quality`            | Hybrid agent audit — structural + behavioral review                             |
| `/audit-code`                     | Code quality audit (complexity, patterns)                                       |
| `/audit-documentation`            | Documentation coverage and quality                                              |
| `/audit-enhancements`             | Enhancement audit across all domains                                            |
| `/audit-engineering-productivity` | Engineering productivity and DX audit                                           |
| `/audit-ai-optimization`          | AI infrastructure optimization audit                                            |
| `/audit-health`                   | Meta-check for audit system health and configuration                            |
| `/audit-performance`              | Performance bottlenecks and optimization                                        |
| `/audit-process`                  | Multi-stage automation audit (16 types, 7 stages)                               |
| `/audit-refactoring`              | Refactoring opportunities                                                       |
| `/audit-security`                 | Security vulnerability audit                                                    |
| `/audit-aggregator`               | Aggregate multiple audit results                                                |
| `/create-audit`                   | Interactive wizard to scaffold new audit types                                  |
| `/code-reviewer`                  | Run code review on recent changes                                               |
| `/multi-ai-audit`                 | Multi-AI consensus audit orchestrator with any-format input                     |
| `/pr-ecosystem-audit`             | Comprehensive PR review ecosystem diagnostic                                    |
| `/health-ecosystem-audit`         | Health monitoring system diagnostic (25 categories, 6 domains, A-F scoring)     |
| `/hook-ecosystem-audit`           | Hook system health diagnostic (19 categories, 6 domains, A-F scoring)           |
| `/tdms-ecosystem-audit`           | TDMS pipeline health diagnostic (16 categories, 5 domains, A-F scoring)         |
| `/session-ecosystem-audit`        | Session system health diagnostic (16 categories, 5 domains, A-F scoring)        |
| `/skill-ecosystem-audit`          | Skill ecosystem health diagnostic (21 categories, 5 domains, A-F scoring)       |
| `/doc-ecosystem-audit`            | Documentation ecosystem diagnostic (16 categories, 5 domains, A-F scoring)      |
| `/script-ecosystem-audit`         | Script infrastructure diagnostic (18 categories, 5 domains, A-F scoring)        |
| `/comprehensive-ecosystem-audit`  | Run all 8 ecosystem audits in staged waves with unified report                  |
| `/ecosystem-health`               | 8-category composite health scoring with 13-dimension drill-down                |
| `/data-effectiveness-audit`       | Lifecycle scoring audit for data system effectiveness (C/S/R/A, 0-12)           |
| `/skill-audit`                    | Interactive behavioral quality audit for individual skills                      |
| `/sonarcloud`                     | Fetch, sync, report, and resolve SonarCloud issues (replaces sonarcloud-sprint) |
| `/quick-fix`                      | Auto-suggest fixes for common issues                                            |

### Planning & Research (2 skills)

| Skill            | Description                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| `/deep-plan`     | Discovery-first planning with exhaustive questions                           |
| `/deep-research` | Multi-agent research engine with parallel search, verification, and adaptors |

### Session Management (5 skills)

| Skill            | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| `/session-begin` | Start a new work session                                     |
| `/session-end`   | End session and update documentation                         |
| `/checkpoint`    | Save session state (local + optional MCP memory via `--mcp`) |
| `/task-next`     | Show dependency-resolved next tasks from active sprint       |
| `/alerts`        | View system health alerts                                    |

### Development Roles (1 skill)

| Skill                   | Description                  |
| ----------------------- | ---------------------------- |
| `/systematic-debugging` | Systematic bug investigation |

### Design & UX (3 skills)

| Skill                     | Description              |
| ------------------------- | ------------------------ |
| `/frontend-design`        | Frontend design patterns |
| `/ui-design-system`       | Design system components |
| `/ux-researcher-designer` | UX research and design   |

### Documentation & Content (3 skills)

| Skill                      | Description                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| `/doc-optimizer`           | Auto-fix + enhance all docs (13 agents, 5 waves)                         |
| `/docs-maintain`           | Check doc sync + auto-update artifacts (replaces docs-sync, docs-update) |
| `/content-research-writer` | Content research and writing                                             |

### Testing (3 skills)

| Skill             | Description                                       |
| ----------------- | ------------------------------------------------- |
| `/system-test`    | 23-domain interactive system test plan            |
| `/test-suite`     | Multi-phase UI testing orchestration (Playwright) |
| `/webapp-testing` | Web application testing                           |

### Infrastructure & Setup (8 skills)

| Skill                     | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `/convergence-loop`       | Multi-pass verification of claims via agent discovery and tallies |
| `/decrypt-secrets`        | Decrypt MCP secrets                                               |
| `/find-skills`            | Discover and install agent skills                                 |
| `/gh-fix-ci`              | Fix GitHub CI issues                                              |
| `/mcp-builder`            | Build MCP server configurations                                   |
| `/pre-commit-fixer`       | Auto-fix pre-commit hook failures and retry                       |
| `/skill-creator`          | Create new skills                                                 |
| `/validate-claude-folder` | Validate .claude folder structure                                 |

### Project Specific (6 skills)

| Skill                        | Description                                                           |
| ---------------------------- | --------------------------------------------------------------------- |
| `/add-debt`                  | Add technical debt items to MASTER_DEBT.jsonl                         |
| `/debt-runner`               | Interactive TDMS orchestrator with 7 modes (verify, sync, plan, etc.) |
| `/developer-growth-analysis` | Analyze developer growth                                              |
| `/pr-retro`                  | PR review retrospective with actionable analysis                      |
| `/pr-review`                 | Process PR review feedback                                            |
| `/using-superpowers`         | Claude superpowers guide                                              |

### Data & Analysis (3 skills)

| Skill                      | Description         |
| -------------------------- | ------------------- |
| `/excel-analysis`          | Analyze Excel files |
| `/artifacts-builder`       | Build artifacts     |
| `/market-research-reports` | Market research     |

---

## Quick Reference by Task

| Task                   | Recommended Skill                             |
| ---------------------- | --------------------------------------------- |
| Starting a session     | `/session-begin`                              |
| Bug investigation      | `/systematic-debugging`                       |
| Code review            | `/code-reviewer`                              |
| Enhancement discovery  | `/audit-enhancements`                         |
| AI infrastructure      | `/audit-ai-optimization`                      |
| Scaffold new audit     | `/create-audit`                               |
| Security concerns      | `/audit-security`                             |
| Performance issues     | `/audit-performance`                          |
| Complex task planning  | `/deep-plan`                                  |
| Domain/tech research   | `/deep-research`                              |
| Claim verification     | `/convergence-loop`                           |
| TDMS orchestration     | `/debt-runner`                                |
| Agent quality audit    | `/audit-agent-quality`                        |
| Skill quality audit    | `/skill-audit`                                |
| Ecosystem composite    | `/ecosystem-health`                           |
| UI/UX work             | `/frontend-design`, `/ux-researcher-designer` |
| Doc repair + enhance   | `/doc-optimizer`                              |
| Ending work            | `/session-end`                                |
| CI failures            | `/gh-fix-ci`                                  |
| System health          | `/alerts`                                     |
| System testing         | `/system-test`                                |
| PR ecosystem health    | `/pr-ecosystem-audit`                         |
| Health monitoring      | `/health-ecosystem-audit`                     |
| Hook ecosystem health  | `/hook-ecosystem-audit`                       |
| TDMS pipeline health   | `/tdms-ecosystem-audit`                       |
| Session system health  | `/session-ecosystem-audit`                    |
| Skill ecosystem health | `/skill-ecosystem-audit`                      |
| Doc ecosystem health   | `/doc-ecosystem-audit`                        |
| Script infra health    | `/script-ecosystem-audit`                     |
| All ecosystems at once | `/comprehensive-ecosystem-audit`              |
| Audit system health    | `/audit-health`                               |
| Data effectiveness     | `/data-effectiveness-audit`                   |

---

## Maintenance

This index should be updated when:

- New skills are added
- Skills are renamed or removed
- Categories change

Run `ls .claude/skills/` to verify skill list.
