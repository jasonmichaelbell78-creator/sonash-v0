# Required Plugins for Claude Code

This document lists all plugins required for full functionality in this project.

## Installation

Plugins are managed through `~/.claude/settings.json` under `enabledPlugins`.
Manually merge `.claude/settings.global-template.json` into
`~/.claude/settings.json` to get the recommended configuration.

## Plugin Categories

### Claude Code Workflows (21 plugins)

Comprehensive workflow automation for development tasks.

| Plugin                                              | Purpose                      |
| --------------------------------------------------- | ---------------------------- |
| `debugging-toolkit@claude-code-workflows`           | Systematic debugging tools   |
| `git-pr-workflows@claude-code-workflows`            | Git and PR management        |
| `frontend-mobile-development@claude-code-workflows` | Frontend/mobile dev agents   |
| `full-stack-orchestration@claude-code-workflows`    | Full-stack coordination      |
| `backend-development@claude-code-workflows`         | Backend architecture agents  |
| `unit-testing@claude-code-workflows`                | Testing automation           |
| `code-review-ai@claude-code-workflows`              | AI-powered code reviews      |
| `multi-platform-apps@claude-code-workflows`         | Cross-platform development   |
| `tdd-workflows@claude-code-workflows`               | Test-driven development      |
| `comprehensive-review@claude-code-workflows`        | Multi-aspect code review     |
| `code-refactoring@claude-code-workflows`            | Refactoring assistance       |
| `error-debugging@claude-code-workflows`             | Error analysis and debugging |
| `llm-application-dev@claude-code-workflows`         | LLM app development          |
| `agent-orchestration@claude-code-workflows`         | Multi-agent coordination     |
| `context-management@claude-code-workflows`          | Context window optimization  |
| `database-cloud-optimization@claude-code-workflows` | DB and cloud optimization    |
| `deployment-strategies@claude-code-workflows`       | Deployment automation        |
| `backend-api-security@claude-code-workflows`        | API security auditing        |
| `framework-migration@claude-code-workflows`         | Framework upgrades           |
| `seo-content-creation@claude-code-workflows`        | SEO content tools            |
| `seo-technical-optimization@claude-code-workflows`  | Technical SEO                |
| `seo-analysis-monitoring@claude-code-workflows`     | SEO monitoring               |
| `content-marketing@claude-code-workflows`           | Content marketing            |

### Claude Plugins Official (10 plugins)

Official Anthropic-supported plugins.

| Plugin                                      | Purpose                      |
| ------------------------------------------- | ---------------------------- |
| `context7@claude-plugins-official`          | Library documentation lookup |
| `github@claude-plugins-official`            | GitHub API integration       |
| `serena@claude-plugins-official`            | Semantic code analysis       |
| `playwright@claude-plugins-official`        | Browser automation           |
| `firebase@claude-plugins-official`          | Firebase integration         |
| `sentry@claude-plugins-official`            | Error tracking integration   |
| `hookify@claude-plugins-official`           | Custom hooks system          |
| `code-simplifier@claude-plugins-official`   | Code simplification          |
| `code-review@claude-plugins-official`       | Code review tools            |
| `pr-review-toolkit@claude-plugins-official` | PR review automation         |

### Superpowers Marketplace (3 plugins)

Community-powered extensions.

| Plugin                                       | Purpose                        |
| -------------------------------------------- | ------------------------------ |
| `superpowers@superpowers-marketplace`        | Core superpowers functionality |
| `episodic-memory@superpowers-marketplace`    | Cross-session memory           |
| `superpowers-chrome@superpowers-marketplace` | Chrome DevTools integration    |

## Disabled Plugins

These plugins are intentionally disabled:

| Plugin                                 | Reason                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------ |
| `hookify@claude-code-plugins`          | **BROKEN** - Incompatible import structure. Use `hookify@claude-plugins-official` instead. |
| `ralph-wiggum@claude-plugins-official` | Not needed                                                                                 |
| `ralph-loop@claude-plugins-official`   | Not needed                                                                                 |

## Troubleshooting

### "No module named 'hookify'" Error

This error occurs when `hookify@claude-code-plugins` is enabled. It has an
incompatible import structure that expects a `hookify` Python package.

**Fix:** Disable `hookify@claude-code-plugins` and keep
`hookify@claude-plugins-official` enabled.

```json
{
  "enabledPlugins": {
    "hookify@claude-plugins-official": true,
    "hookify@claude-code-plugins": false
  }
}
```

### Plugin Not Found

If a plugin is not found during Claude Code startup:

1. Check that the plugin marketplace is configured
2. Run `claude plugins sync` to refresh available plugins
3. Verify the plugin name and publisher match exactly

### Conflicts Between Plugins

Some plugins may register the same hooks. If you see duplicate hook execution:

1. Check for overlapping plugins (e.g., two hookify plugins)
2. Disable the older/broken version
3. Use `--diff` to compare your settings with the template

## Global vs Project Plugins

**Global plugins** (`~/.claude/settings.json`):

- Applied to all projects
- Good for general-purpose tools
- Managed via this template

**Project plugins** (`.claude/settings.json` in repo):

- Project-specific configurations
- Override global settings
- Committed to version control

This project uses global plugin management with repo templates for portability.
