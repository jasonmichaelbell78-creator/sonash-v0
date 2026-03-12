# Diagnosis: Tooling & Infrastructure Audit

**Date:** 2026-03-12 **Task:** Research and produce an implementation plan for
optimizing the plugin/skill/agent ecosystem, GitHub workflows/actions/connected
apps, and overall tooling infrastructure.

## ROADMAP Alignment

**Aligned.** ROADMAP emphasizes "Privacy-First, Evidence-Based" development with
strong AI-assisted workflows. Optimizing the tooling layer that powers daily
AI-driven development directly supports this. The System-Wide Standardization
Initiative (Session #201) already identified bloat and consolidation needs
across ecosystems — this audit is a natural next step.

---

## Current Inventory Summary

### Hooks (14 project-level + 2 global)

| Hook                                 | Trigger                            | Purpose                                                     |
| ------------------------------------ | ---------------------------------- | ----------------------------------------------------------- |
| session-start.js                     | SessionStart                       | Full session initialization (deps, build, patterns, health) |
| check-mcp-servers.js                 | SessionStart                       | Verify MCP server availability                              |
| check-remote-session-context.js      | SessionStart                       | Check remote branches for session context                   |
| stop-serena-dashboard.js             | SessionStart                       | Kill Serena dashboard on port 24282                         |
| gsd-check-update.js (global)         | SessionStart                       | Check for GSD updates                                       |
| compact-restore.js                   | SessionStart (compact)             | Restore context after compaction                            |
| block-push-to-main.js                | PreToolUse (Bash)                  | Prevent direct pushes to main                               |
| pre-compaction-save.js               | PreCompact                         | Save state before compaction                                |
| post-write-validator.js              | PostToolUse (write/edit/multiedit) | Validate file writes                                        |
| post-read-handler.js                 | PostToolUse (read)                 | Process read operations                                     |
| decision-save-prompt.js              | PostToolUse (AskUserQuestion)      | Prompt for decision documentation                           |
| commit-tracker.js                    | PostToolUse (bash)                 | Track git commits                                           |
| track-agent-invocation.js            | PostToolUse (task)                 | Track agent invocations                                     |
| user-prompt-handler.js               | UserPromptSubmit                   | Process user prompts (guardrails)                           |
| gsd-check-update.js (global user)    | SessionStart                       | Duplicate of project-level                                  |
| gsd-context-monitor.js (global user) | PostToolUse                        | GSD context monitoring                                      |

### Skills (63 directories, 66 listed in index)

| Category             | Count | Skills                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit & Code Quality | 23    | audit-comprehensive, audit-code, audit-documentation, audit-enhancements, audit-engineering-productivity, audit-ai-optimization, audit-health, audit-performance, audit-process, audit-refactoring, audit-security, audit-aggregator, create-audit, code-reviewer, multi-ai-audit, 8 ecosystem audits, sonarcloud, quick-fix |
| Session Management   | 5     | session-begin, session-end, checkpoint, task-next, alerts                                                                                                                                                                                                                                                                    |
| Development Roles    | 7     | systematic-debugging + 6 "senior-\*" roles (listed in index but directories not found)                                                                                                                                                                                                                                       |
| Design & UX          | 3     | frontend-design, ui-design-system, ux-researcher-designer                                                                                                                                                                                                                                                                    |
| Documentation        | 4     | doc-optimizer, docs-maintain, content-research-writer, markitdown                                                                                                                                                                                                                                                            |
| Testing              | 3     | system-test, test-suite, webapp-testing                                                                                                                                                                                                                                                                                      |
| Infrastructure       | 7     | decrypt-secrets, find-skills, gh-fix-ci, mcp-builder, pre-commit-fixer, skill-creator, validate-claude-folder                                                                                                                                                                                                                |
| Project Specific     | 7     | add-debt, developer-growth-analysis, pr-retro, pr-review, sprint, using-superpowers, verify-technical-debt                                                                                                                                                                                                                   |
| Data & Analysis      | 3     | excel-analysis, artifacts-builder, market-research-reports                                                                                                                                                                                                                                                                   |
| Planning             | 1     | deep-plan                                                                                                                                                                                                                                                                                                                    |

### Custom Agents (24 in .claude/agents/)

backend-architect, code-reviewer, database-architect, debugger,
dependency-manager, deployment-engineer, devops-troubleshooter,
documentation-expert, error-detective, frontend-developer, fullstack-developer,
git-flow-manager, markdown-syntax-formatter, mcp-expert,
nextjs-architecture-expert, penetration-tester, performance-engineer,
prompt-engineer, react-performance-optimization, security-auditor,
security-engineer, technical-writer, test-engineer, ui-ux-designer

### Plugins (13 user-level)

| Plugin             | Source                  | Status                   |
| ------------------ | ----------------------- | ------------------------ |
| superpowers        | claude-plugins-official | Enabled                  |
| episodic-memory    | superpowers-marketplace | Enabled (project + user) |
| superpowers-chrome | superpowers-marketplace | Enabled (project only)   |
| code-simplifier    | claude-plugins-official | Enabled (user only)      |
| code-review        | claude-plugins-official | Enabled (user only)      |
| pr-review-toolkit  | claude-plugins-official | Enabled (user only)      |
| github             | claude-plugins-official | Enabled (user only)      |
| security-guidance  | claude-plugins-official | Enabled (user only)      |
| claude-code-setup  | claude-plugins-official | Enabled (user only)      |
| skill-creator      | claude-plugins-official | Enabled (user only)      |
| coderabbit         | claude-plugins-official | Enabled (user only)      |
| semgrep            | claude-plugins-official | Enabled (user only)      |
| qodo-skills        | claude-plugins-official | Enabled (user only)      |
| hookify            | claude-plugins-official | **Disabled**             |

### Marketplaces (5 configured)

1. claude-plugins-official (anthropics/claude-plugins-official)
2. anthropic-agent-skills (anthropics/skills)
3. claude-code-plugins (anthropics/claude-code)
4. claude-code-plugins-plus (jeremylongshore/claude-code-plugins)
5. superpowers-marketplace (obra/superpowers-marketplace)

### MCP Servers

| Server     | Type            | Purpose                             |
| ---------- | --------------- | ----------------------------------- |
| memory     | npm package     | @modelcontextprotocol/server-memory |
| sonarcloud | custom          | scripts/mcp/sonarcloud-server.js    |
| context7   | auto-discovered | Library documentation               |
| serena     | auto-discovered | Semantic code tools                 |

### GitHub Workflows (16 custom + 3 dynamic)

| Workflow                     | State        | Purpose                                               |
| ---------------------------- | ------------ | ----------------------------------------------------- |
| ci.yml                       | active       | **FAILING** on main + testing-31126                   |
| deploy-firebase.yml          | active       | Firebase deployment                                   |
| codeql.yml                   | active       | CodeQL security scanning                              |
| semgrep.yml                  | active       | Semgrep security scanning                             |
| sonarcloud.yml               | **DISABLED** | SonarCloud analysis (bot still active via GitHub App) |
| dependency-review.yml        | active       | Dependency vulnerability review                       |
| auto-merge-dependabot.yml    | active       | Auto-merge minor/patch Dependabot PRs                 |
| cleanup-branches.yml         | active       | Stale branch cleanup                                  |
| docs-lint.yml                | active       | Documentation linting                                 |
| pattern-compliance-audit.yml | active       | Pattern compliance checks                             |
| resolve-debt.yml             | active       | Technical debt resolution                             |
| review-check.yml             | active       | Review trigger checking                               |
| auto-label-review-tier.yml   | active       | PR review tier labeling                               |
| backlog-enforcement.yml      | active       | Backlog enforcement                                   |
| sync-readme.yml              | active       | README status sync                                    |
| validate-plan.yml            | active       | Phase completion validation                           |
| Copilot code review          | active       | Dynamic - GitHub Copilot reviews                      |
| Copilot coding agent         | active       | Dynamic - Copilot SWE agent                           |
| Dependabot Updates           | active       | Dynamic - version updates                             |

### Connected Review Bots (on PRs)

1. **github-advanced-security[bot]** — CodeQL + Semgrep findings
2. **gemini-code-assist[bot]** — Google Gemini code review
3. **qodo-code-review[bot]** — Qodo (ex-CodiumAI) code review
4. **sonarqubecloud[bot]** — SonarCloud quality/security
5. **Copilot code review** — GitHub Copilot review (dynamic workflow)

### npm Scripts (~140)

Full list available. Major categories: audit (14), test (14), docs (12),
health/hooks (8), debt/sprint (10), patterns (7), reviews (7), session (7),
skills (4), ecosystem (3), roadmap (3), security (3), misc (remaining).

---

## Critical Findings

### Security Gaps

1. **No branch protection on main** — direct pushes possible
   (block-push-to-main.js hook only protects Claude Code sessions, not git CLI
   or GitHub UI)
2. **Dependabot vulnerability alerts DISABLED** — version updates are
   configured, but security alerts are off
3. **Vulnerability alerts DISABLED** — GitHub security advisory alerts are off
4. **30 open code scanning alerts** — CodeQL + Semgrep findings unresolved

### Configuration Issues

5. **SonarCloud workflow disabled** — but SonarCloud GitHub App still runs.
   Workflow and App may be redundant; need to decide which stays
6. **CI failing on main** — most recent CI runs are failing
7. **CodeRabbit plugin enabled but unused** — no .coderabbit.yaml config, no
   CodeRabbit bot seen on recent PRs
8. **Hookify plugin disabled** — dead config entry, should be removed
9. **No Qodo config file** — qodo-skills plugin enabled but no .qodo.yaml for
   repo-specific rules
10. **GSD check-update hook duplicated** — runs in both project settings.json
    AND user settings.json

### Scale / Bloat Concerns

11. **63+ skills** — 23 are audit-related alone. 8 ecosystem audits +
    comprehensive-ecosystem-audit (which orchestrates them) = 9 skills for one
    function
12. **24 custom agents** — many overlap with plugin-provided agents (e.g.,
    code-reviewer agent vs code-review plugin, security-auditor vs
    security-guidance plugin)
13. **~140 npm scripts** — significant overlap and potentially dead scripts
    (memory note: "6 dead npm scripts found")
14. **5 review bots on every PR** — review fatigue risk. Gemini + Qodo +
    Copilot + SonarCloud + GitHub Advanced Security all comment
15. **5 marketplace sources** — unclear which are actively providing useful
    plugins vs unused discovery channels
16. **Development Role skills listed in index but directories missing** —
    "senior-architect", "senior-backend", etc. not found as skill directories

### Opportunities

17. **Public repo with no topics** — GitHub discoverability zero
18. **No GitHub Pages, Wiki, or Discussions** — community features unused
19. **oxlint in devDeps alongside eslint** — two linters running; oxlint is
    faster for what it covers
20. **Custom eslint-plugin-sonash** — project-specific rules; should be verified
    as adding value vs. maintenance cost
21. **Serena MCP active** — powerful semantic code tools but unclear if utilized
    effectively
22. **Plugin/agent deduplication opportunity** — plugins that provide agents +
    custom agents + skills that wrap agents = three layers for similar functions

---

## Reframe Check

The task as stated covers three areas: (1) process/plugin/skill optimization,
(2) GitHub infra audit, (3) bloat reduction. Based on what I've found, I'd
suggest a slight reframe:

**The core issue is layered redundancy.** You have plugins that provide agents,
custom agents that do the same things, skills that orchestrate those agents, and
GitHub Apps/workflows that overlap with each other. The audit should be
organized around **deduplication and consolidation** rather than just add/remove
decisions.

Additionally, the **security gaps** (no branch protection, disabled
vulnerability alerts) should be elevated to immediate action items rather than
part of the "plan for later" bucket.

**Recommendation:** Proceed with the reframe — organize discovery around
deduplication layers + security hardening + opportunities. The three original
areas remain but the lens shifts from "what to add/remove" to "what's the right
layer for each function."
