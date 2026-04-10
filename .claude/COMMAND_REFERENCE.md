# Claude Code Command Reference (Index)

<!-- prettier-ignore-start -->
**Version:** 6.0
**Last Updated:** 2026-04-02
**Status:** ACTIVE
<!-- prettier-ignore-end -->

> Trimmed from 109KB to lightweight index (AI-5.1). Each entry links to its
> source file. For detailed documentation, read the source directly.

---

## Skills (Project-Specific)

Source: `.claude/skills/*/SKILL.md`

| Skill                             | Description                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| `/audit-code`                     | Single-session code review audit                                                           |
| `/audit-documentation`            | Multi-stage parallel documentation audit (18 agents)                                       |
| `/audit-performance`              | Single-session performance audit                                                           |
| `/audit-process`                  | Multi-stage automation/process audit                                                       |
| `/audit-refactoring`              | Single-session refactoring audit                                                           |
| `/audit-security`                 | Single-session security audit                                                              |
| `/audit-agent-quality`            | Hybrid agent audit — structural + behavioral review                                        |
| `/audit-enhancements`             | Comprehensive enhancement audit                                                            |
| `/audit-engineering-productivity` | Engineering productivity audit                                                             |
| `/audit-ai-optimization`          | AI optimization audit                                                                      |
| `/audit-comprehensive`            | Run all 9 domain audits in staged waves                                                    |
| `/system-test`                    | 23-domain interactive system/repo test plan                                                |
| `/audit-aggregator`               | Aggregate and deduplicate audit findings                                                   |
| `/audit-health`                   | Meta-check for audit system health                                                         |
| `/create-audit`                   | Interactive wizard to scaffold new audit type                                              |
| `/multi-ai-audit`                 | Multi-AI consensus audit orchestrator                                                      |
| `/brainstorm`                     | Creative discovery phase — explore directions before deep-plan or deep-research            |
| `/deep-plan`                      | Discovery-first planning with exhaustive Q&A and decision record                           |
| `/deep-research`                  | Multi-agent research engine with parallel search, verification, and downstream adapters    |
| `/document-analysis`              | Document analysis (PDF, gist, article, arxiv) — dual-lens, 3 tiers, part of CAS            |
| `/doc-optimizer`                  | Scan docs, auto-fix formatting/headers/links                                               |
| `/docs-maintain`                  | Check doc sync and auto-update artifacts                                                   |
| `/pr-review`                      | PR code review processor                                                                   |
| `/pr-retro`                       | PR review retrospective with interactive findings walkthrough                              |
| `/session-begin`                  | Session startup verification checklist                                                     |
| `/session-end`                    | Session end verification checklist                                                         |
| `/analyze`                        | Content Analysis System router — feed it anything, auto-detects type, dispatches handler   |
| `/alerts`                         | Intelligent health dashboard with scoring                                                  |
| `/ecosystem-health`               | 8-category composite health scoring with 13-dimension drill-down                           |
| `/pr-ecosystem-audit`             | PR ecosystem diagnostic (18 categories, 5 domains)                                         |
| `/health-ecosystem-audit`         | Health monitoring ecosystem diagnostic (25 categories, 6 domains)                          |
| `/hook-ecosystem-audit`           | Hook ecosystem diagnostic (19 categories, 6 domains)                                       |
| `/tdms-ecosystem-audit`           | TDMS pipeline diagnostic (16 categories, 5 domains)                                        |
| `/session-ecosystem-audit`        | Session system diagnostic (16 categories, 5 domains)                                       |
| `/skill-ecosystem-audit`          | Skill ecosystem diagnostic (21 categories, 5 domains)                                      |
| `/doc-ecosystem-audit`            | Documentation ecosystem diagnostic (16 categories, 5 domains)                              |
| `/script-ecosystem-audit`         | Script infrastructure diagnostic (18 categories, 5 domains)                                |
| `/comprehensive-ecosystem-audit`  | Run all 8 ecosystem audits in staged waves with unified report                             |
| `/convergence-loop`               | Multi-pass verification of claims via agent discovery, T20 tallies, composable behaviors   |
| `/data-effectiveness-audit`       | Lifecycle scoring audit for data system effectiveness (C/S/R/A, 0-12)                      |
| `/debt-runner`                    | Interactive TDMS orchestrator with 7 modes (verify, sync, plan, health, dedup, etc.)       |
| `/checkpoint`                     | Save session state for recovery                                                            |
| `/recall`                         | Query the Content Analysis System — search extractions, tags, sources, part of CAS         |
| `/quick-fix`                      | Auto-suggest fixes for pre-commit failures                                                 |
| `/pre-commit-fixer`               | Fix pre-commit hook failures and retry                                                     |
| `/code-reviewer`                  | Code review for SoNash                                                                     |
| `/content-research-writer`        | Research and write content                                                                 |
| `/developer-growth-analysis`      | Analyze Claude Code chat history for growth                                                |
| `/excel-analysis`                 | Analyze Excel spreadsheets                                                                 |
| `/find-skills`                    | Discover and install agent skills                                                          |
| `/frontend-design`                | Production-grade frontend interfaces                                                       |
| `/sonarcloud`                     | SonarCloud integration                                                                     |
| `/systematic-debugging`           | Systematic bug investigation                                                               |
| `/task-next`                      | Show next tasks from ROADMAP.md                                                            |
| `/test-suite`                     | Multi-phase UI testing orchestration                                                       |
| `/todo`                           | Cross-session todo management with JSONL persistence                                       |
| `/add-debt`                       | Add items to MASTER_DEBT.jsonl                                                             |
| `/skill-creator`                  | Structured workflow for creating or updating skills                                        |
| `/skill-audit`                    | Interactive behavioral quality audit for individual skills                                 |
| `/mcp-builder`                    | Guide for creating MCP servers                                                             |
| `/validate-claude-folder`         | Validate .claude folder consistency                                                        |
| `/artifacts-builder`              | Build multi-component claude.ai artifacts                                                  |
| `/decrypt-secrets`                | Decrypt MCP tokens for remote sessions                                                     |
| `/gh-fix-ci`                      | Fix failing GitHub CI actions                                                              |
| `/github-health`                  | 7-phase GitHub health assessment with per-finding triage and inline fixes                  |
| `/market-research-reports`        | Generate market research reports                                                           |
| `/media-analysis`                 | Media analysis (YouTube, podcast, audio) — transcription + dual-lens, part of CAS          |
| `/ui-design-system`               | Design system components toolkit                                                           |
| `/repo-analysis`                  | Dual-lens repo analysis: Creator View + Engineer View, 3 tiers, link mining, dual scoring  |
| `/repo-synthesis`                 | DEPRECATED — use `/synthesize` instead. Redirect expires next session.                     |
| `/synthesize`                     | Unified cross-source synthesis (T29) — all 4 source types, 8 sections, opportunity matrix  |
| `/using-superpowers`              | Claude skills usage guide                                                                  |
| `/ux-researcher-designer`         | UX research and design toolkit                                                             |
| `/webapp-testing`                 | Web application testing with Playwright                                                    |
| `/website-analysis`               | Creator-first website analysis: dual-lens, 3 tiers, 4 modes, superpowers-chrome extraction |
| `/website-synthesis`              | DEPRECATED — use `/synthesize` instead. Redirect expires next session.                     |
| `sonash-context`                  | Shared project context injected into agents via `skills:` field (not user-invocable)       |

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

| Event                       | Hook                        | Purpose                               |
| --------------------------- | --------------------------- | ------------------------------------- |
| SessionStart                | `session-start.js`          | Deps, builds, patterns, TDMS check    |
| SessionStart:compact        | `compact-restore.js`        | Restore context after compaction      |
| PreCompact                  | `pre-compaction-save.js`    | Save state snapshot before compaction |
| PostToolUse:Write/Edit      | `post-write-validator.js`   | Schema, lint, pattern validation      |
| PostToolUse:Read            | `post-read-handler.js`      | Context tracking, auto-save           |
| PostToolUse:Bash            | `commit-tracker.js`         | Auto-log commits + report failures    |
| PostToolUse:Task            | `track-agent-invocation.js` | Track agent usage                     |
| PostToolUse:AskUserQuestion | `decision-save-prompt.js`   | Decision documentation                |
| UserPromptSubmit            | `user-prompt-handler.js`    | Process user prompts                  |

## Git Hooks

Source: `.husky/`

| Hook       | Steps                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pre-commit | gitleaks secrets scan, ESLint, lint-staged (oxlint + prettier), pattern compliance, cross-doc deps, doc index, doc headers, S0/S1 audit, schema validation |

## Environment Variables

| Variable                | Purpose                        |
| ----------------------- | ------------------------------ |
| `SKIP_AUDIT_VALIDATION` | Skip S0/S1 audit in pre-commit |
| `CLAUDE_PROJECT_DIR`    | Override project directory     |
| `CLAUDE_CODE_REMOTE`    | Detect remote session          |

---

## Version History

| Version | Date         | Change                                                                                                                                            |
| ------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8.2     | 2026-04-10   | T29 Wave 3 Steps 7-8: 14 upstream refs updated (analyze/repo/website skills + CONVENTIONS §17), synthesis-schema.ts removed, backup files cleaned |
| 8.1     | 2026-04-06   | Skill convergence: shared CONVENTIONS.md, Zod schemas, 4-skill alignment                                                                          |
| 8.0     | 2026-04-06   | Added /website-analysis, /website-synthesis (68 skills)                                                                                           |
| 7.0     | 2026-04-05   | Added /repo-synthesis, updated /repo-analysis v4.1 (66 skills)                                                                                    |
| 6.0     | 2026-04-02   | Added /repo-analysis skill (65 skills)                                                                                                            |
| 5.9     | 2026-03-24   | Added convergence-loop, data-effectiveness-audit, debt-runner (64)                                                                                |
| 5.5     | 2026-02-24   | Added skill/doc/script/comprehensive ecosystem audits (65)                                                                                        |
| 5.4     | 2026-02-23   | Added /tdms-ecosystem-audit + /session-ecosystem-audit (61)                                                                                       |
| 5.3     | 2026-02-23   | Added /hook-ecosystem-audit skill (59)                                                                                                            |
| 5.2     | 2026-02-23   | Added 17 missing skills (58 total)                                                                                                                |
| 5.1     | 2026-02-20   | Added /pr-ecosystem-audit skill                                                                                                                   |
| 5.0     | 2026-02-17   | Trimmed to index format (109KB → <10KB)                                                                                                           |
| 4.0     | Session #140 | Added all plugins, GSD, SuperClaude skills                                                                                                        |
| 3.0     | Session #135 | Added multi-AI audit, comprehensive audit                                                                                                         |
| 2.0     | Session #110 | Fix expansion-evaluation template                                                                                                                 |
| 1.0     | Session #100 | Initial comprehensive reference                                                                                                                   |
