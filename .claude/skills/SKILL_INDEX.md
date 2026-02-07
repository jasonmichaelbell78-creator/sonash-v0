# Skill Index

**Version**: 1.3 **Last Updated**: 2026-02-07 **Total Skills**: 50

Quick reference for all available Claude Code skills organized by category.

---

## Usage

```
/skill-name [arguments]
```

---

## Categories

### Audit & Code Quality (10 skills)

| Skill                  | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `/audit-comprehensive` | Run all 7 audit domains in parallel               |
| `/audit-code`          | Code quality audit (complexity, patterns)         |
| `/audit-documentation` | Documentation coverage and quality                |
| `/audit-performance`   | Performance bottlenecks and optimization          |
| `/audit-process`       | Multi-stage automation audit (16 types, 7 stages) |
| `/audit-refactoring`   | Refactoring opportunities                         |
| `/audit-security`      | Security vulnerability audit                      |
| `/audit-aggregator`    | Aggregate multiple audit results                  |
| `/code-reviewer`       | Run code review on recent changes                 |
| `/quick-fix`           | Auto-suggest fixes for common issues              |

### Session Management (5 skills)

| Skill            | Description                          |
| ---------------- | ------------------------------------ |
| `/session-begin` | Start a new work session             |
| `/session-end`   | End session and update documentation |
| `/checkpoint`    | Save quick recovery checkpoint       |
| `/save-context`  | Save context to MCP memory           |
| `/alerts`        | View system health alerts            |

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

### Documentation & Content (5 skills)

| Skill                      | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `/doc-optimizer`           | Auto-fix + enhance all docs (13 agents, 5 waves) |
| `/docs-sync`               | Sync documentation across files                  |
| `/docs-update`             | Update doc artifacts after changes               |
| `/content-research-writer` | Content research and writing                     |
| `/markitdown`              | Convert various formats to markdown              |

### Testing (1 skill)

| Skill             | Description             |
| ----------------- | ----------------------- |
| `/webapp-testing` | Web application testing |

### Infrastructure & Setup (5 skills)

| Skill                     | Description                       |
| ------------------------- | --------------------------------- |
| `/decrypt-secrets`        | Decrypt MCP secrets               |
| `/gh-fix-ci`              | Fix GitHub CI issues              |
| `/mcp-builder`            | Build MCP server configurations   |
| `/skill-creator`          | Create new skills                 |
| `/validate-claude-folder` | Validate .claude folder structure |

### Project Specific (6 skills)

| Skill                        | Description                |
| ---------------------------- | -------------------------- |
| `/expansion-evaluation`      | Evaluate expansion ideas   |
| `/sonarcloud-sprint`         | SonarCloud cleanup sprint  |
| `/pr-review`                 | Process PR review feedback |
| `/requesting-code-review`    | Request code review        |
| `/developer-growth-analysis` | Analyze developer growth   |
| `/using-superpowers`         | Claude superpowers guide   |

### Data & Analysis (4 skills)

| Skill                      | Description                 |
| -------------------------- | --------------------------- |
| `/excel-analysis`          | Analyze Excel files         |
| `/artifacts-builder`       | Build artifacts             |
| `/market-research-reports` | Market research             |
| `/senior-fullstack`        | (Also in Development Roles) |

---

## Quick Reference by Task

| Task                   | Recommended Skill                             |
| ---------------------- | --------------------------------------------- |
| Starting a session     | `/session-begin`                              |
| Bug investigation      | `/systematic-debugging`                       |
| Code review            | `/code-reviewer`                              |
| Security concerns      | `/audit-security`                             |
| Performance issues     | `/audit-performance`                          |
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
