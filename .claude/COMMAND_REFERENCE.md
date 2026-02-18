# Claude Code Command Reference (Index)

<!-- prettier-ignore-start -->
**Version:** 5.0
**Last Updated:** 2026-02-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

> Trimmed from 109KB to lightweight index (AI-5.1). Each entry links to its
> source file. For detailed documentation, read the source directly.

---

## Skills (Project-Specific)

Source: `.claude/skills/*/SKILL.md`

| Skill                             | Description                                          |
| --------------------------------- | ---------------------------------------------------- |
| `/audit-code`                     | Single-session code review audit                     |
| `/audit-documentation`            | Multi-stage parallel documentation audit (18 agents) |
| `/audit-performance`              | Single-session performance audit                     |
| `/audit-process`                  | Multi-stage automation/process audit                 |
| `/audit-refactoring`              | Single-session refactoring audit                     |
| `/audit-security`                 | Single-session security audit                        |
| `/audit-enhancements`             | Comprehensive enhancement audit                      |
| `/audit-engineering-productivity` | Engineering productivity audit                       |
| `/audit-ai-optimization`          | AI optimization audit                                |
| `/audit-comprehensive`            | All 9 domain audits in staged waves                  |
| `/audit-aggregator`               | Aggregate and deduplicate audit findings             |
| `/audit-health`                   | Meta-check for audit system health                   |
| `/create-audit`                   | Interactive wizard to scaffold new audit type        |
| `/multi-ai-audit`                 | Multi-AI consensus audit orchestrator                |
| `/deep-plan`                      | Structured discovery-first planning                  |
| `/doc-optimizer`                  | Scan docs, auto-fix formatting/headers/links         |
| `/docs-maintain`                  | Check doc sync and auto-update artifacts             |
| `/pr-review`                      | PR code review processor                             |
| `/pr-retro`                       | PR review retrospective analysis                     |
| `/session-begin`                  | Session startup verification checklist               |
| `/session-end`                    | Session end verification checklist                   |
| `/alerts`                         | Intelligent health dashboard with scoring            |
| `/checkpoint`                     | Save session state for recovery                      |
| `/quick-fix`                      | Auto-suggest fixes for pre-commit failures           |
| `/pre-commit-fixer`               | Fix pre-commit hook failures and retry               |
| `/code-reviewer`                  | Code review for SoNash                               |
| `/content-research-writer`        | Research and write content                           |
| `/developer-growth-analysis`      | Analyze Claude Code chat history for growth          |
| `/excel-analysis`                 | Analyze Excel spreadsheets                           |
| `/find-skills`                    | Discover and install agent skills                    |
| `/frontend-design`                | Production-grade frontend interfaces                 |
| `/sonarcloud`                     | SonarCloud integration                               |
| `/systematic-debugging`           | Systematic bug investigation                         |
| `/task-next`                      | Show next tasks from ROADMAP.md                      |
| `/test-suite`                     | Multi-phase UI testing orchestration                 |
| `/verify-technical-debt`          | Verify and triage technical debt items               |
| `/add-debt`                       | Add items to MASTER_DEBT.jsonl                       |
| `/skill-creator`                  | Guide for creating effective skills                  |
| `/mcp-builder`                    | Guide for creating MCP servers                       |
| `/validate-claude-folder`         | Validate .claude folder consistency                  |

## System Commands

Built-in Claude Code commands (not skills):

`/help` `/clear` `/commit` `/tasks` `/remember` `/recall` `/bug` `/compact`
`/config` `/cost` `/doctor` `/init` `/listen` `/login` `/logout` `/mcp` `/model`
`/permissions` `/pr-comments` `/review` `/resume` `/status` `/terminal-setup`
`/vim`

## Agents

Source: Task tool `subagent_type` parameter

| Category       | Agents                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| General        | `general-purpose`, `Explore`, `Plan`, `Bash`                           |
| Development    | `frontend-developer`, `fullstack-developer`, `backend-architect`       |
| Quality        | `code-reviewer`, `test-engineer`, `security-auditor`                   |
| Infrastructure | `deployment-engineer`, `devops-troubleshooter`, `performance-engineer` |
| Documentation  | `documentation-expert`, `technical-writer`                             |
| Other          | `debugger`, `error-detective`, `prompt-engineer`, `ui-ux-designer`     |

## MCP Servers

Source: `.mcp.json` + auto-discovered plugins

| Server                     | Purpose                           |
| -------------------------- | --------------------------------- |
| `playwright`               | Browser automation and testing    |
| `memory`                   | MCP persistent memory             |
| `sonarcloud`               | SonarCloud code quality API       |
| `github` (plugin)          | GitHub API integration            |
| `context7` (plugin)        | Library documentation lookup      |
| `firebase` (plugin)        | Firebase project management       |
| `serena` (plugin)          | Semantic code analysis            |
| `episodic-memory` (plugin) | Cross-session conversation memory |

## Claude Code Hooks

Source: `.claude/settings.json` → `hooks`

| Event                       | Hook                        | Purpose                               |
| --------------------------- | --------------------------- | ------------------------------------- |
| SessionStart                | `session-start.js`          | Deps, builds, patterns, TDMS check    |
| SessionStart:compact        | `compact-restore.js`        | Restore context after compaction      |
| PreCompact                  | `pre-compaction-save.js`    | Save state snapshot before compaction |
| PostToolUse:Write/Edit      | `post-write-validator.js`   | Schema, lint, pattern validation      |
| PostToolUse:Read            | `post-read-handler.js`      | Context tracking, auto-save, handoff  |
| PostToolUse:Bash            | `commit-tracker.js`         | Auto-log commits to state             |
| PostToolUse:Task            | `track-agent-invocation.js` | Track agent usage                     |
| PostToolUse:AskUserQuestion | `decision-save-prompt.js`   | Decision documentation                |
| UserPromptSubmit            | `user-prompt-handler.js`    | Process user prompts                  |

## Git Hooks

Source: `.husky/`

| Hook       | Steps                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| pre-commit | ESLint, lint-staged, pattern compliance, cross-doc deps, doc index, doc headers, S0/S1 audit, schema validation |

## Environment Variables

| Variable                | Purpose                        |
| ----------------------- | ------------------------------ |
| `SKIP_AUDIT_VALIDATION` | Skip S0/S1 audit in pre-commit |
| `CLAUDE_PROJECT_DIR`    | Override project directory     |
| `CLAUDE_CODE_REMOTE`    | Detect remote session          |

---

## Version History

| Version | Date         | Change                                     |
| ------- | ------------ | ------------------------------------------ |
| 5.0     | 2026-02-17   | Trimmed to index format (109KB → <10KB)    |
| 4.0     | Session #140 | Added all plugins, GSD, SuperClaude skills |
| 3.0     | Session #135 | Added multi-AI audit, comprehensive audit  |
| 2.0     | Session #110 | Fix expansion-evaluation template          |
| 1.0     | Session #100 | Initial comprehensive reference            |
