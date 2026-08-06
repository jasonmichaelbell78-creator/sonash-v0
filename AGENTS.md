# SoNash Codex Instructions

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-08-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Scope

These instructions apply to Codex work in this repository. Claude Code remains a
separate, supported development system. Preserve `CLAUDE.md` and `.claude/`; do
not alter, migrate, or delete them unless the user explicitly requests it. Do
not copy Claude transcripts, caches, secrets, or runtime state into Codex files.

## Repository baseline

- Use Node.js 22 for the application and Functions work. The checked-in
  devcontainer is the reference environment.
- This is a Next.js App Router application backed by Firebase and Cloud
  Functions.
- Keep credentials in Codespaces secrets or ignored local files. Never commit
  `.env*.local`, Firebase service-account files, or tokens.
- Do not push branches or publish changes without explicit user approval.
- Keep dependency upgrades separate from Codex configuration work and use an
  isolated branch or worktree for major upgrades.

## Application rules

- Route journal, daily-log, and inventory writes through the approved Cloud
  Functions surface; do not add direct client Firestore writes for these data
  paths.
- Put shared Firestore queries in the repository service layer and use the
  existing domain types and runtime schemas.
- Follow the existing TypeScript, ESLint, Prettier, Tailwind, and Zod patterns.
- Treat generated files and `.claude/` runtime state as separate from product
  source changes. Do not clean or discard user changes to them without asking.

## Common commands

From the repository root:

```bash
npm ci
npm --prefix functions ci
npm run type-check
npm run lint
npm test
npm run build
```

For Functions-only validation:

```bash
npm --prefix functions run lint
npm --prefix functions run build
```

Use the Node 22 devcontainer for the full validation suite. If a host
environment produces different results, report the environment and failure
instead of rewriting the lockfile or weakening a check to make it pass.

For security-sensitive changes, run `npm run security:secrets` when gitleaks is
available. For hook or repository-automation changes, also run the relevant
`npm run hooks:test`, `npm run hooks:health`, or `npm run test:gates` command.

## Change workflow

1. Inspect the current worktree and relevant plan/context documents before
   editing.
2. Keep changes narrowly scoped and preserve unrelated user work.
3. Run proportionate validation and report any skipped checks with the reason.
4. Update durable project documentation when the supported workflow changes.
5. Review the final diff for secrets, generated-state churn, and accidental
   changes to Claude infrastructure.

## Codex-specific boundary

Codex configuration and hooks belong under `AGENTS.md` and `.codex/`. Do not
silently port Claude hooks, agents, skills, MCP settings, or session mechanics.
