# Slash Commands & Skills Reference

<!-- prettier-ignore-start -->
**Document Version:** 3.1
**Last Updated:** 2026-02-23
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Purpose

Comprehensive reference for all slash commands and skills available in the
SoNash project. Skills are located in `.claude/skills/*/SKILL.md` and invoked
via `/skill-name`.

## Quick Start

1. Use `/help` to see built-in CLI commands
2. Run `/session-begin` at the start of each session
3. Use `/find-skills` to discover skills by keyword
4. Run `/session-end` before ending work

---

## Table of Contents

1. [System Commands](#1-system-commands)
2. [Skills by Category](#2-skills-by-category)
3. [npm Scripts Reference](#3-npm-scripts-reference)
4. [Skill Development](#4-skill-development)

---

## 1. System Commands

Built-in Claude Code CLI commands (not project-specific).

### Navigation & Session

| Command    | Description                          |
| ---------- | ------------------------------------ |
| `/help`    | Display available commands and usage |
| `/clear`   | Clear conversation history           |
| `/compact` | Compress conversation for efficiency |
| `/resume`  | Resume a previous session            |
| `/status`  | Show current session status          |

### Configuration

| Command           | Description                      |
| ----------------- | -------------------------------- |
| `/config`         | View/modify Claude Code settings |
| `/model`          | Switch between Claude models     |
| `/permissions`    | Manage tool permissions          |
| `/init`           | Initialize Claude Code project   |
| `/terminal-setup` | Configure terminal integration   |
| `/vim`            | Toggle vim keybindings           |

### Authentication & Tools

| Command   | Description                   |
| --------- | ----------------------------- |
| `/login`  | Authenticate with Anthropic   |
| `/logout` | End authentication session    |
| `/mcp`    | Manage MCP server connections |
| `/doctor` | Diagnose configuration issues |

### Code & Repository

| Command        | Description                  |
| -------------- | ---------------------------- |
| `/review`      | Request code review          |
| `/pr-comments` | View PR comments from GitHub |
| `/add-dir`     | Add directory to context     |
| `/ide`         | IDE integration commands     |
| `/cost`        | Display token/cost usage     |
| `/memory`      | Manage conversation memory   |

---

## 2. Skills by Category

All 58 skills in `.claude/skills/`. Invoke with `/skill-name`.

### Audit & Code Quality (18 skills)

| Skill                             | Description                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| `/audit-comprehensive`            | Run all 9 audit domains in staged waves                         |
| `/audit-code`                     | Code quality audit (3-agent parallel: hygiene, types, security) |
| `/audit-documentation`            | Documentation coverage audit (18 agents, 6 stages)              |
| `/audit-enhancements`             | Enhancement audit across all domains                            |
| `/audit-engineering-productivity` | Engineering productivity and DX audit                           |
| `/audit-ai-optimization`          | AI infrastructure optimization audit                            |
| `/audit-health`                   | Meta-check for audit system health and configuration            |
| `/audit-performance`              | Performance audit (2-agent parallel: bundle, data)              |
| `/audit-process`                  | Multi-stage automation audit (16 types, 7 stages)               |
| `/audit-refactoring`              | Refactoring opportunities audit                                 |
| `/audit-security`                 | Security audit (4-agent parallel: vuln, supply, framework, AI)  |
| `/audit-aggregator`               | Aggregate and deduplicate findings from multiple audits         |
| `/create-audit`                   | Interactive wizard to scaffold new audit types                  |
| `/code-reviewer`                  | Run code review on recent changes                               |
| `/multi-ai-audit`                 | Multi-AI consensus audit orchestrator                           |
| `/pr-ecosystem-audit`             | Comprehensive PR review ecosystem diagnostic                    |
| `/hook-ecosystem-audit`           | Hook system health diagnostic (16 categories, 5 domains)        |
| `/tdms-ecosystem-audit`           | TDMS pipeline health diagnostic (16 categories, 5 domains)      |
| `/session-ecosystem-audit`        | Session system health diagnostic (16 categories, 5 domains)     |
| `/sonarcloud`                     | Fetch, sync, report, and resolve SonarCloud issues              |
| `/quick-fix`                      | Auto-suggest fixes for common issues                            |

### Planning (1 skill)

| Skill        | Description                                        |
| ------------ | -------------------------------------------------- |
| `/deep-plan` | Discovery-first planning with exhaustive questions |

### Session Management (5 skills)

| Skill            | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| `/session-begin` | Pre-session verification and context loading                 |
| `/session-end`   | Post-session audit, documentation, and learning capture      |
| `/checkpoint`    | Save session state (local + optional MCP memory via `--mcp`) |
| `/task-next`     | Show dependency-resolved next tasks from active sprint       |
| `/alerts`        | Intelligent health dashboard with scoring and benchmarks     |

### Development Roles (7 skills)

| Skill                   | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `/senior-architect`     | Architecture guidance and design decisions       |
| `/senior-backend`       | Backend development expertise                    |
| `/senior-devops`        | DevOps and infrastructure guidance               |
| `/senior-frontend`      | Frontend development expertise                   |
| `/senior-fullstack`     | Full-stack development guidance                  |
| `/senior-qa`            | QA and testing expertise                         |
| `/systematic-debugging` | Systematic bug investigation (scientific method) |

### Design & UX (3 skills)

| Skill                     | Description                      |
| ------------------------- | -------------------------------- |
| `/frontend-design`        | Production-grade frontend design |
| `/ui-design-system`       | Design system components toolkit |
| `/ux-researcher-designer` | UX research and design           |

### Documentation & Content (4 skills)

| Skill                      | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `/doc-optimizer`           | Auto-fix + enhance all docs (13 agents, 5 waves) |
| `/docs-maintain`           | Check doc sync + auto-update artifacts           |
| `/content-research-writer` | Content research and writing assistant           |
| `/markitdown`              | Convert various file formats to markdown         |

### Testing (3 skills)

| Skill             | Description                                       |
| ----------------- | ------------------------------------------------- |
| `/system-test`    | 23-domain interactive system test plan            |
| `/test-suite`     | Multi-phase UI testing orchestration (Playwright) |
| `/webapp-testing` | Web application testing with Playwright           |

### Infrastructure & Setup (7 skills)

| Skill                     | Description                                 |
| ------------------------- | ------------------------------------------- |
| `/decrypt-secrets`        | Decrypt MCP tokens for remote sessions      |
| `/find-skills`            | Discover and install agent skills           |
| `/gh-fix-ci`              | Fix failing GitHub CI actions               |
| `/mcp-builder`            | Build MCP server configurations             |
| `/pre-commit-fixer`       | Auto-fix pre-commit hook failures and retry |
| `/skill-creator`          | Create new skills via wizard                |
| `/validate-claude-folder` | Validate .claude folder structure           |

### Project Specific (7 skills)

| Skill                        | Description                                      |
| ---------------------------- | ------------------------------------------------ |
| `/add-debt`                  | Add technical debt items to MASTER_DEBT.jsonl    |
| `/developer-growth-analysis` | Analyze developer growth patterns                |
| `/pr-retro`                  | PR review retrospective with actionable analysis |
| `/pr-review`                 | Process PR review feedback (CodeRabbit, Qodo)    |
| `/sprint`                    | TDMS sprint workflow automation                  |
| `/using-superpowers`         | Claude skills usage guide                        |
| `/verify-technical-debt`     | Verify and triage technical debt items           |

### Data & Analysis (3 skills)

| Skill                      | Description                                 |
| -------------------------- | ------------------------------------------- |
| `/excel-analysis`          | Analyze Excel spreadsheets and tabular data |
| `/artifacts-builder`       | Build multi-component claude.ai artifacts   |
| `/market-research-reports` | Generate comprehensive market research      |

---

## 3. npm Scripts Reference

All 96 npm scripts organized by domain. Run with `npm run <script>`.

### Documentation (12 scripts)

| Script                | Description                               |
| --------------------- | ----------------------------------------- |
| `docs:check`          | Light documentation health check          |
| `docs:index`          | Regenerate DOCUMENTATION_INDEX.md         |
| `docs:sync-check`     | Check template-instance synchronization   |
| `docs:headers`        | Validate document headers                 |
| `docs:lint`           | Run markdownlint on all docs              |
| `docs:external-links` | Check external URLs (HTTP HEAD)           |
| `docs:accuracy`       | Verify version/path/npm script references |
| `docs:placement`      | Check doc location and staleness          |
| `docs:archive`        | Archive documents                         |
| `docs:update-readme`  | Update README.md                          |
| `crossdoc:check`      | Cross-document dependency check           |
| `format`              | Run Prettier formatting                   |

### Patterns & Compliance (7 scripts)

| Script               | Description                               |
| -------------------- | ----------------------------------------- |
| `patterns:check`     | Check code against documented patterns    |
| `patterns:check-all` | Check all files (not just staged)         |
| `patterns:suggest`   | Suggest new patterns from recent reviews  |
| `patterns:sync`      | Verify pattern doc/automation consistency |
| `patterns:fp-report` | False positives report                    |
| `patterns:promote`   | Promote patterns to automation            |
| `test:patterns`      | Run pattern compliance tests              |

### Technical Debt (TDMS) (10 scripts)

| Script            | Description                                |
| ----------------- | ------------------------------------------ |
| `tdms:metrics`    | Generate TDMS metrics dashboard            |
| `tdms:views`      | Generate TDMS views from MASTER_DEBT.jsonl |
| `sprint:status`   | Show current sprint status                 |
| `sprint:complete` | Complete current sprint                    |
| `sprint:intake`   | Intake new items into sprint               |
| `sprint:sync`     | Sync sprint items                          |
| `sprint:wave`     | Process sprint wave                        |
| `backlog:check`   | Check backlog health                       |
| `validate:canon`  | Validate canonical IDs                     |
| `canon:normalize` | Normalize canonical IDs                    |

### Audits (11 scripts)

| Script                     | Description                             |
| -------------------------- | --------------------------------------- |
| `audit:health`             | Audit system health check               |
| `audit:validate`           | Validate audit configuration            |
| `audit:pre-check`          | Pre-audit validation                    |
| `audit:post`               | Post-audit processing                   |
| `audit:compare`            | Compare audit results                   |
| `audit:thresholds`         | Check audit thresholds                  |
| `audit:resolutions`        | Check audit resolutions                 |
| `audit:results-index`      | Index audit results                     |
| `audit:validate-templates` | Validate audit templates                |
| `audit:reset`              | Reset audit state                       |
| `aggregate:audit-findings` | Aggregate findings from multiple audits |

### Reviews & Learning (12 scripts)

| Script                  | Description                                 |
| ----------------------- | ------------------------------------------- |
| `review:check`          | Check if multi-AI review thresholds reached |
| `review:churn`          | Analyze review churn                        |
| `reviews:sync`          | Sync reviews/retros to JSONL                |
| `reviews:archive`       | Archive old reviews                         |
| `reviews:check-archive` | Check archive heading format                |
| `reviews:repair`        | Repair review data                          |
| `learning:analyze`      | Analyze learning effectiveness              |
| `learning:category`     | Analyze learning by category                |
| `learning:dashboard`    | Learning effectiveness dashboard            |
| `learning:detailed`     | Detailed learning analysis                  |
| `learning:since`        | Learning analysis since last review         |
| `lessons:surface`       | Surface past lessons for current work       |

### Session & Workflow (9 scripts)

| Script              | Description                   |
| ------------------- | ----------------------------- |
| `session:gaps`      | Detect undocumented sessions  |
| `session:gaps:fix`  | Fix session gaps              |
| `session:log`       | View session log              |
| `session:summary`   | Session summary               |
| `session:end`       | End session processing        |
| `alerts:cleanup`    | Clean up stale alert sessions |
| `consolidation:run` | Run pattern consolidation     |
| `override:log`      | Log override events           |
| `override:list`     | List overrides                |

### Skills & Agents (5 scripts)

| Script                | Description                    |
| --------------------- | ------------------------------ |
| `skills:validate`     | Validate skill configurations  |
| `skills:verify-usage` | Verify skill usage in sessions |
| `skills:registry`     | Show skills registry           |
| `agents:check`        | Check agent configurations     |
| `agents:check-strict` | Strict agent check             |

### Testing & Build (6 scripts)

| Script                 | Description                      |
| ---------------------- | -------------------------------- |
| `test`                 | Run full test suite              |
| `test:build`           | TypeScript compilation for tests |
| `test:coverage`        | Coverage report with c8          |
| `test:coverage:report` | HTML coverage output             |
| `build`                | Next.js production build         |
| `dev`                  | Next.js development server       |

### Code Quality (8 scripts)

| Script               | Description                          |
| -------------------- | ------------------------------------ |
| `lint`               | Run ESLint                           |
| `format`             | Run Prettier                         |
| `format:check`       | Check formatting without fixing      |
| `security:check`     | Security pattern check               |
| `security:check-all` | Full security check                  |
| `deps:circular`      | Detect circular dependencies (madge) |
| `deps:unused`        | Detect unused dependencies (knip)    |
| `config:validate`    | Validate project configuration       |

### Ecosystem & Hooks (7 scripts)

| Script                    | Description                         |
| ------------------------- | ----------------------------------- |
| `ecosystem-audit`         | Run ecosystem audit                 |
| `ecosystem-audit:check`   | Check ecosystem audit status        |
| `ecosystem-audit:summary` | Ecosystem audit summary             |
| `hooks:analytics`         | Hook usage analytics                |
| `hooks:test`              | Test hook configurations            |
| `hooks:health`            | Hook health check                   |
| `triggers:check`          | Check automation trigger thresholds |

### Other (10 scripts)

| Script                | Description                       |
| --------------------- | --------------------------------- |
| `roadmap:validate`    | Validate ROADMAP.md structure     |
| `roadmap:hygiene`     | Roadmap hygiene check             |
| `phase:complete`      | Complete a roadmap phase          |
| `phase:complete:auto` | Auto-complete phase (CI-friendly) |
| `phase:validate`      | Validate phase completion         |
| `lighthouse`          | Run Lighthouse audit (mobile)     |
| `lighthouse:desktop`  | Run Lighthouse audit (desktop)    |
| `capabilities:search` | Search project capabilities       |
| `prepare`             | Husky git hooks setup (lifecycle) |
| `start`               | Next.js production server         |

---

## 4. Skill Development

### Skill File Structure

All skills reside in `.claude/skills/<skill-name>/SKILL.md`:

```
.claude/skills/
  SKILL_INDEX.md           # Index of all 58 skills
  session-begin/SKILL.md   # Session start workflow
  session-end/SKILL.md     # Session end workflow
  audit-code/SKILL.md      # Code audit skill
  ...
```

### Creating New Skills

Use `/skill-creator` to scaffold a new skill with proper structure.

### Best Practices

1. Skills should be self-contained with clear step-by-step instructions
2. Include version history and last updated date
3. Reference related skills and npm scripts
4. Follow naming convention: `verb-noun` (e.g., `audit-code`, `session-begin`)
5. Update SKILL_INDEX.md when adding/removing skills

---

## Version History

| Version | Date       | Changes                                                            |
| ------- | ---------- | ------------------------------------------------------------------ |
| 3.1     | 2026-02-23 | Added 8 missing npm scripts, removed phantom verify-technical-debt |
| 3.0     | 2026-02-23 | Complete rewrite: 58 skills, 96 npm scripts, removed deprecated    |
| 2.3     | 2026-02-02 | Updated audit skills with parallel architecture                    |
| 2.0     | 2026-01-15 | Combined SLASH_COMMANDS.md and CUSTOM_SLASH_COMMANDS_GUIDE.md      |
| 1.0     | 2026-01-05 | Initial creation                                                   |
