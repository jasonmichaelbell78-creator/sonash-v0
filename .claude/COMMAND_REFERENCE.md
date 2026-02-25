# Claude Code Command Reference (Index)

<!-- prettier-ignore-start -->
**Version:** 5.4
**Last Updated:** 2026-02-23
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
| `/audit-comprehensive`            | Run all 9 domain audits in staged waves              |
| `/system-test`                    | 23-domain interactive system/repo test plan          |
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
| `/pr-ecosystem-audit`             | PR ecosystem diagnostic (18 categories, 5 domains)   |
| `/hook-ecosystem-audit`           | Hook ecosystem diagnostic (19 categories, 6 domains) |
| `/tdms-ecosystem-audit`           | TDMS pipeline diagnostic (16 categories, 5 domains)  |
| `/session-ecosystem-audit`        | Session system diagnostic (16 categories, 5 domains) |
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
| `/artifacts-builder`              | Build multi-component claude.ai artifacts            |
| `/decrypt-secrets`                | Decrypt MCP tokens for remote sessions               |
| `/gh-fix-ci`                      | Fix failing GitHub CI actions                        |
| `/market-research-reports`        | Generate market research reports                     |
| `/markitdown`                     | Convert file formats to markdown                     |
| `/senior-architect`               | Architecture guidance and decisions                  |
| `/senior-backend`                 | Backend development expertise                        |
| `/senior-devops`                  | DevOps and infrastructure guidance                   |
| `/senior-frontend`                | Frontend development expertise                       |
| `/senior-fullstack`               | Full-stack development guidance                      |
| `/senior-qa`                      | QA and testing expertise                             |
| `/sprint`                         | TDMS sprint workflow automation                      |
| `/ui-design-system`               | Design system components toolkit                     |
| `/using-superpowers`              | Claude skills usage guide                            |
| `/ux-researcher-designer`         | UX research and design toolkit                       |
| `/webapp-testing`                 | Web application testing with Playwright              |

## System Commands

Built-in Claude Code commands (not skills):

`/help` `/clear` `/commit` `/tasks` `/remember` `/recall` `/bug` `/compact`
`/config` `/cost` `/doctor` `/init` `/listen` `/login` `/logout` `/mcp` `/model`
`/permissions` `/pr-comments` `/review` `/resume` `/status` `/terminal-setup`
`/vim`

## Agents

Source: Task tool `subagent_type` parameter

| Category       | Agents                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| General        | `general-purpose`, `Explore`, `Plan`, `Bash`                                                                                     |
| Development    | `frontend-developer`, `fullstack-developer`, `backend-architect`, `nextjs-architecture-expert`, `react-performance-optimization` |
| Quality        | `code-reviewer`, `test-engineer`, `security-auditor`, `security-engineer`, `penetration-tester`                                  |
| Infrastructure | `deployment-engineer`, `devops-troubleshooter`, `performance-engineer`, `dependency-manager`, `git-flow-manager`                 |
| Documentation  | `documentation-expert`, `technical-writer`, `markdown-syntax-formatter`                                                          |
| Data           | `database-architect`, `mcp-expert`                                                                                               |
| Other          | `debugger`, `error-detective`, `prompt-engineer`, `ui-ux-designer`                                                               |

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
| `serena` (plugin)          | Semantic code analysis (disabled) |
| `episodic-memory` (plugin) | Cross-session conversation memory |

## Claude Code Hooks

Source: `.claude/settings.json` → `hooks`

| Event                       | Hook                         | Purpose                               |
| --------------------------- | ---------------------------- | ------------------------------------- |
| SessionStart                | `session-start.js`           | Deps, builds, patterns, TDMS check    |
| SessionStart:compact        | `compact-restore.js`         | Restore context after compaction      |
| PreCompact                  | `pre-compaction-save.js`     | Save state snapshot before compaction |
| PostToolUse:Write/Edit      | `post-write-validator.js`    | Schema, lint, pattern validation      |
| PostToolUse:Read            | `post-read-handler.js`       | Context tracking, auto-save, handoff  |
| PostToolUse:Bash            | `commit-tracker.js`          | Auto-log commits to state             |
| PostToolUse:Bash            | `commit-failure-reporter.js` | Report commit failures to audit log   |
| PostToolUse:Task            | `track-agent-invocation.js`  | Track agent usage                     |
| PostToolUse:AskUserQuestion | `decision-save-prompt.js`    | Decision documentation                |
| UserPromptSubmit            | `user-prompt-handler.js`     | Process user prompts                  |

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

| Version | Date         | Change                                                      |
| ------- | ------------ | ----------------------------------------------------------- |
| 5.4     | 2026-02-23   | Added /tdms-ecosystem-audit + /session-ecosystem-audit (61) |
| 5.3     | 2026-02-23   | Added /hook-ecosystem-audit skill (59)                      |
| 5.2     | 2026-02-23   | Added 17 missing skills (58 total)                          |
| 5.1     | 2026-02-20   | Added /pr-ecosystem-audit skill                             |
| 5.0     | 2026-02-17   | Trimmed to index format (109KB → <10KB)                     |
| 4.0     | Session #140 | Added all plugins, GSD, SuperClaude skills                  |
| 3.0     | Session #135 | Added multi-AI audit, comprehensive audit                   |
| 2.0     | Session #110 | Fix expansion-evaluation template                           |
| 1.0     | Session #100 | Initial comprehensive reference                             |
