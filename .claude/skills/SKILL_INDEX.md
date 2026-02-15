# Skill Index

**Version**: 1.8 **Last Updated**: 2026-02-14 **Total Skills**: 54

Quick reference for all available Claude Code skills organized by category.

---

## Usage

```
/skill-name [arguments]
```

---

## Categories

### Audit & Code Quality (16 skills)

| Skill                             | Description                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `/audit-comprehensive`            | Run all 9 audit domains in staged waves                                         |
| `/audit-code`                     | Code quality audit (complexity, patterns)                                       |
| `/audit-documentation`            | Documentation coverage and quality                                              |
| `/audit-enhancements`             | Enhancement audit across all domains                                            |
| `/audit-engineering-productivity` | Engineering productivity and DX audit                                           |
| `/audit-ai-optimization`          | AI infrastructure optimization audit                                            |
| `/audit-performance`              | Performance bottlenecks and optimization                                        |
| `/audit-process`                  | Multi-stage automation audit (16 types, 7 stages)                               |
| `/audit-refactoring`              | Refactoring opportunities                                                       |
| `/audit-security`                 | Security vulnerability audit                                                    |
| `/audit-aggregator`               | Aggregate multiple audit results                                                |
| `/create-audit`                   | Interactive wizard to scaffold new audit types                                  |
| `/code-reviewer`                  | Run code review on recent changes                                               |
| `/multi-ai-audit`                 | Multi-AI consensus audit orchestrator with any-format input                     |
| `/sonarcloud`                     | Fetch, sync, report, and resolve SonarCloud issues (replaces sonarcloud-sprint) |
| `/quick-fix`                      | Auto-suggest fixes for common issues                                            |

### Planning (1 skill)

| Skill        | Description                                        |
| ------------ | -------------------------------------------------- |
| `/deep-plan` | Discovery-first planning with exhaustive questions |

### Session Management (5 skills)

| Skill            | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| `/session-begin` | Start a new work session                                     |
| `/session-end`   | End session and update documentation                         |
| `/checkpoint`    | Save session state (local + optional MCP memory via `--mcp`) |
| `/task-next`     | Show dependency-resolved next tasks from active sprint       |
| `/alerts`        | View system health alerts                                    |

### Development Roles (7 skills)

| Skill                   | Description                         |
| ----------------------- | ----------------------------------- |
| `/senior-architect`     | Architecture guidance and decisions |
| `/senior-backend`       | Backend development expertise       |
| `/senior-devops`        | DevOps and infrastructure guidance  |
| `/senior-frontend`      | Frontend development expertise      |
| `/senior-fullstack`     | Full-stack development guidance     |
| `/senior-qa`            | QA and testing expertise            |
| `/systematic-debugging` | Systematic bug investigation        |

### Design & UX (3 skills)

| Skill                     | Description              |
| ------------------------- | ------------------------ |
| `/frontend-design`        | Frontend design patterns |
| `/ui-design-system`       | Design system components |
| `/ux-researcher-designer` | UX research and design   |

### Documentation & Content (4 skills)

| Skill                      | Description                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| `/doc-optimizer`           | Auto-fix + enhance all docs (13 agents, 5 waves)                         |
| `/docs-maintain`           | Check doc sync + auto-update artifacts (replaces docs-sync, docs-update) |
| `/content-research-writer` | Content research and writing                                             |
| `/markitdown`              | Convert various formats to markdown                                      |

### Testing (2 skills)

| Skill             | Description                                       |
| ----------------- | ------------------------------------------------- |
| `/test-suite`     | Multi-phase UI testing orchestration (Playwright) |
| `/webapp-testing` | Web application testing                           |

### Infrastructure & Setup (7 skills)

| Skill                     | Description                                 |
| ------------------------- | ------------------------------------------- |
| `/decrypt-secrets`        | Decrypt MCP secrets                         |
| `/find-skills`            | Discover and install agent skills           |
| `/gh-fix-ci`              | Fix GitHub CI issues                        |
| `/mcp-builder`            | Build MCP server configurations             |
| `/pre-commit-fixer`       | Auto-fix pre-commit hook failures and retry |
| `/skill-creator`          | Create new skills                           |
| `/validate-claude-folder` | Validate .claude folder structure           |

### Project Specific (6 skills)

| Skill                        | Description                                      |
| ---------------------------- | ------------------------------------------------ |
| `/add-debt`                  | Add technical debt items to MASTER_DEBT.jsonl    |
| `/developer-growth-analysis` | Analyze developer growth                         |
| `/pr-retro`                  | PR review retrospective with actionable analysis |
| `/pr-review`                 | Process PR review feedback                       |
| `/using-superpowers`         | Claude superpowers guide                         |
| `/verify-technical-debt`     | Verify and triage technical debt items           |

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
| Architecture decisions | `/senior-architect`                           |
| UI/UX work             | `/frontend-design`, `/ux-researcher-designer` |
| Doc repair + enhance   | `/doc-optimizer`                              |
| Ending work            | `/session-end`                                |
| CI failures            | `/gh-fix-ci`                                  |
| System health          | `/alerts`                                     |

---

## Maintenance

This index should be updated when:

- New skills are added
- Skills are renamed or removed
- Categories change

Run `ls .claude/skills/` to verify skill list.
