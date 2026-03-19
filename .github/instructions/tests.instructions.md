# Test Instructions for Copilot

## Purpose

Scoped guidance for AI assistance in test paths: `tests/`, `dist-tests/`,
`**/*.test.ts`, `**/*.test.js`, and test configuration files.

## Test Runner

- SoNash uses **Node's built-in test runner** (`node --test`), NOT Jest
- TypeScript tests must be compiled first: `npm run test:build`
- Compiled output goes to `dist-tests/` via `tsconfig.test.json`
- Use `describe()`, `it()`, and `assert` from `node:test` and `node:assert`

## Commands

```bash
npm test                    # Build + run all tests
npm run test:build          # Compile tests only
npm run test:coverage       # Build + run with c8 coverage
npm run test:infra          # Infrastructure tests only
npm run test:hooks          # Git hook tests only
npm run test:debt           # Technical debt system tests only
```

## Writing Tests

### File Naming

- TypeScript tests: `tests/**/*.test.ts` (compiled to `dist-tests/`)
- Plain JS tests: `scripts/health/**/*.test.js` (run directly)
- Skill tests: `.claude/skills/*/scripts/__tests__/*.test.js`

### Required Patterns

- Mock `httpsCallable`, NOT direct Firestore writes (enforced by patterns:check)
- Wrap file reads in try/catch (existsSync has race conditions)
- Use `/g` flag on exec() regex to prevent infinite loops
- Set Firebase env vars for any test touching Firebase (see package.json)

### Test Environment Variables

```bash
NODE_ENV=test
NEXT_PUBLIC_FIREBASE_API_KEY=test
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=test
NEXT_PUBLIC_FIREBASE_PROJECT_ID=test
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=test
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=test
NEXT_PUBLIC_FIREBASE_APP_ID=test
```

### Coverage

- Coverage threshold: 65% line coverage (enforced in CI)
- Coverage tool: `c8` with text and HTML reporters
- New scripts must have corresponding tests (enforced by test registry check)
- Test baseline is tracked in `.test-baseline.json`

## Anti-Patterns

- Never use Jest APIs (`jest.fn()`, `jest.mock()`) - use Node test runner mocks
- Never run `node --test` directly without compiling TypeScript first
- Never import from `dist-tests/` in source code
- Never skip compilation when debugging test failures - stale dist-tests/ causes
  confusing errors

## Version History

| Version | Date       | Changes         |
| ------- | ---------- | --------------- |
| 1.0     | 2026-03-18 | Initial release |
