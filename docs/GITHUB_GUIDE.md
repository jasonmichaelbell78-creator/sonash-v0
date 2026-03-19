# GitHub Repository Guide

## Purpose

Comprehensive guide to GitHub features, integrations, and workflows configured
for the SoNash repository. This document serves as the single reference for
understanding and maintaining the GitHub ecosystem.

---

## 1. Branch Protection

The `main` branch is protected with the following rules:

- **Required status checks**: CI workflow must pass (lint, type-check, test,
  build)
- **Required reviews**: At least 1 approving review from CODEOWNERS
- **Force push**: Disabled on main
- **Branch deletion**: Protected

### Branch Naming Convention

- `feat/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `chore/description` - Maintenance tasks

## 2. CI/CD Workflows

### CI (`.github/workflows/ci.yml`)

Runs on push to `main` and all PRs. Two jobs:

1. **Lint, Type Check & Test**: oxlint, ESLint, Prettier, circular deps, unused
   deps, pattern compliance, documentation check, CANON validation, type check,
   tests with coverage, coverage threshold enforcement (65% lines)
2. **Build**: Depends on test job passing. Builds Next.js static export.

### Deploy Firebase (`.github/workflows/deploy-firebase.yml`)

Runs on push to `main`. Deploys Cloud Functions and Firestore rules using
`FIREBASE_SERVICE_ACCOUNT` secret.

### OpenSSF Scorecard (`.github/workflows/scorecard.yml`)

Runs weekly and on push to main. Publishes security metrics to OpenSSF and
uploads SARIF results to GitHub Code Scanning.

### Release Please (`.github/workflows/release-please.yml`)

Runs on push to main. Creates automated release PRs based on conventional commit
messages and manages GitHub releases.

## 3. Dependabot

Configuration: `.github/dependabot.yml`

| Ecosystem      | Directory    | Schedule | Grouping              |
| -------------- | ------------ | -------- | --------------------- |
| npm            | `/`          | Weekly   | Minor + patch grouped |
| npm            | `/functions` | Weekly   | Minor + patch grouped |
| github-actions | `/`          | Monthly  | Minor + patch grouped |

PRs are labeled automatically (`dependencies` or `ci`) and use conventional
commit prefixes (`chore(deps)`, `chore(ci)`).

## 4. CODEOWNERS

File: `.github/CODEOWNERS`

All files require review from `@jasonmichaelbell78-creator`. Additional explicit
ownership for:

- `.github/workflows/` - CI/CD pipeline changes
- `functions/src/` - Cloud Functions (security-sensitive)
- `firestore.rules` - Database access control

## 5. Issue Templates

Directory: `.github/ISSUE_TEMPLATE/`

| Template              | File                  | Purpose                     |
| --------------------- | --------------------- | --------------------------- |
| Bug Report            | `bug_report.md`       | Structured bug reports      |
| Feature Request       | `feature_request.md`  | Feature proposals           |
| App Check Re-enable   | (linked via config)   | Firebase App Check tracker  |
| Blank Issue           | (enabled in config)   | Freeform issues             |

Configuration in `config.yml` enables blank issues and links to the App Check
re-enablement tracker and Security Policy.

## 6. Pull Request Template

File: `.github/pull_request_template.md`

Sections: What Changed, Why This Change, How It Works, Testing Done, Screenshots,
Related Issues, Technical Debt (TDMS integration), Breaking Changes, Risks &
Rollback, Pre-Merge Checklist.

PR titles follow conventional commits: `<type>(<scope>): <description>`

## 7. Release Notes

File: `.github/release.yml`

Auto-generated from merged PR labels. Categories: Breaking Changes, Security,
Features, Bug Fixes, Refactoring, Testing, Infrastructure & CI, Dependencies,
Documentation, Other Changes. PRs labeled `skip-changelog` are excluded.

Release Please (`.github/release-please-config.json`) manages semantic
versioning based on conventional commits.

## 8. Security & Supply Chain

### OpenSSF Scorecard

Weekly automated security posture assessment. Results visible in GitHub Code
Scanning tab.

### Dependabot

Automated dependency updates with grouping to reduce PR noise.

### SHA-Pinned Actions

All GitHub Actions in workflows are SHA-pinned with version comments for
supply-chain security. Example:
`actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2`

### Codecov

Coverage reporting via `codecov.yml`. Project threshold: 65% (matching CI).
Patch threshold: 70% (informational). Token stored in `CODECOV_TOKEN` secret.

### Socket.dev (Recommended)

Install the Socket GitHub App for real-time dependency risk analysis:

1. Visit https://socket.dev/dashboard
2. Sign in with GitHub
3. Enable for the `sonash-v0` repository
4. Socket will automatically comment on PRs with dependency changes

## 9. Copilot / AI Instructions

### Global Instructions

File: `.github/copilot-instructions.md` - Project overview, build commands, test
status, architecture patterns, and validation steps.

### Scoped Instructions

Directory: `.github/instructions/`

| File                          | Scope                              |
| ----------------------------- | ---------------------------------- |
| `security.instructions.md`   | Security paths (functions, rules)  |
| `tests.instructions.md`      | Test paths (tests/, *.test.*)      |

These provide context-aware guidance when Copilot operates in specific areas of
the codebase.

---

## Version History

| Version | Date       | Changes                                       |
| ------- | ---------- | --------------------------------------------- |
| 1.0     | 2026-03-18 | Initial release (GitHub Optimization Wave 4)  |
