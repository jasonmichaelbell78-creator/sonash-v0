<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-18
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Contributing to SoNash

## Purpose

Guidelines for contributing to SoNash. We welcome bug reports, feature
requests, documentation improvements, and code contributions.

## Getting Started

1. **Fork** the repository and clone your fork.
2. **Install dependencies** -- see
   [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for
   setup commands and prerequisites.
3. **Create a branch** from `main` using the naming convention:
   `<type>/<short-description>` (e.g., `feat/password-reset`,
   `fix/journal-save`).

## Development Workflow

### Before Writing Code

- Read [`CLAUDE.md`](CLAUDE.md) for project conventions, architecture, and
  coding standards.
- Check [`ROADMAP.md`](ROADMAP.md) to ensure your contribution aligns with
  planned work.
- For larger changes, open an issue first to discuss the approach.

### Code Standards

- **TypeScript** strict mode, no `any`.
- **Functional components** with hooks (no class components).
- **Tailwind CSS** for styling (utility-first).
- **Zod** for runtime validation matching TypeScript interfaces.
- All Firestore operations through `lib/firestore-service.ts` (repository
  pattern).
- Mock `httpsCallable` in tests, never direct Firestore writes.

### Validation Checklist

Before submitting a PR, ensure all checks pass:

```bash
npm run lint          # Fix all errors, warnings acceptable
npx tsc --noEmit      # Must pass with no errors
npm test              # Tests must pass
npm run build         # Must complete successfully
```

## Submitting a Pull Request

1. Fill out the
   [PR template](.github/pull_request_template.md) completely.
2. Use conventional commit format for the PR title:
   `<type>(<scope>): <description>` (e.g., `feat(auth): add password reset`).
3. Ensure CI passes on your PR before requesting review.
4. Link related issues using `Closes #123` syntax.

### PR Types

| Type       | Description                        |
| ---------- | ---------------------------------- |
| `feat`     | New feature                        |
| `fix`      | Bug fix                            |
| `docs`     | Documentation only                 |
| `refactor` | Code restructuring, no behavior change |
| `test`     | Adding or updating tests           |
| `chore`    | Maintenance, dependencies, CI      |
| `perf`     | Performance improvement            |
| `style`    | Formatting, whitespace             |

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) on GitHub.
Include steps to reproduce, expected vs. actual behavior, and your environment
details.

## Requesting Features

Use the
[feature request template](.github/ISSUE_TEMPLATE/feature_request.md) on
GitHub. Describe the problem you are trying to solve and your proposed solution.

## Security Vulnerabilities

Do **not** open a public issue. See [`SECURITY.md`](SECURITY.md) for
responsible disclosure instructions via GitHub Private Vulnerability Reporting.

## Code of Conduct

All contributors must follow our
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be licensed under the
[Apache License 2.0](LICENSE).

## Version History

| Version | Date       | Changes              |
| ------- | ---------- | -------------------- |
| 1.0     | 2026-03-18 | Initial contribution guide |
