# CLAUDE.md - Framework Project

## Project Overview

Reusable development workflow framework for building applications and websites. Provides standardized tooling, quality gates, and development practices that can be shared across projects.

## Architecture

### Directory Structure

```
framework/
├── .claude/              # Claude Code configuration
│   ├── agents/           # 12 specialized AI agents
│   ├── hooks/            # 12 automation hooks + shared libraries
│   │   └── lib/          # Hook shared libraries (6 modules)
│   ├── skills/           # 50+ development workflow skills
│   ├── state/            # Runtime state (gitignored)
│   └── settings.json     # Hook registrations and env config
├── .github/workflows/    # 9 CI/CD workflows
├── .husky/               # Git hooks (pre-commit, pre-push)
├── eslint-plugin-framework/ # 23 custom ESLint rules
├── scripts/
│   ├── lib/              # Shared script libraries (11 modules)
│   ├── config/           # Configuration files (12 configs)
│   ├── debt/             # TDMS ecosystem scripts
│   └── reviews/          # PR review ecosystem scripts
├── CLAUDE.md             # This file
├── ROADMAP.md            # Project roadmap (human-readable)
└── ROADMAP.jsonl         # Project roadmap (machine-readable)
```

### Key Systems

- **Hook System**: Event-driven automation (SessionStart, PreToolUse, PostToolUse, PreCompact, UserPromptSubmit)
- **Skill System**: Reusable development workflows invoked via `/skill-name`
- **Agent System**: Specialized AI agents for code review, debugging, architecture, etc.
- **ESLint Plugin**: 23 custom rules for security, correctness, and style enforcement
- **TDMS**: Technical Debt Management System with JSONL-based tracking
- **Review Tiers**: Automated PR review tier assignment (Tier 0-4)

## Standards and Patterns

### Code Quality

- TypeScript strict mode for all new code
- ESLint with custom framework rules (23 rules)
- Prettier for formatting (100 char width, single quotes, trailing commas)
- Pre-commit: ESLint + tests in parallel, lint-staged, circular dep check
- Pre-push: Type check, security audit, code-reviewer gate

### File Operations

- **Atomic writes**: Always use tmp+rename pattern (never write directly to target)
- **Symlink guard**: Validate paths before writing (lib/symlink-guard.js)
- **Advisory locking**: Use safe-fs.js withLock() for concurrent file access
- **Secret redaction**: Use sanitize-input.js for any logged/persisted data

### State Management

- JSONL as source of truth for append-only data (audits, reviews, debt tracking)
- Markdown views generated from JSONL (never edit markdown views directly)
- State rotation via rotate-state.js (cap files, archive old entries)
- Compaction resilience: save state before compaction, restore after

### Error Handling

- Never access `.message` or `.stack` on caught errors without type checking
- Use sanitize-error.js for safe error serialization
- Empty catch blocks must have a comment explaining why
- Wrap JSON.parse of user input in try/catch

### Security

- No hardcoded secrets (use .env + process.env)
- No eval() or Function() constructor
- Validate redirect targets against allowlists
- Sanitize all user input before shell execution
- No unrestricted CORS (Access-Control-Allow-Origin: \*)

## Anti-Patterns (Do NOT Do)

1. **TOCTOU races**: Don't check existsSync() then operate on the file. Use try/catch around the operation.
2. **Path.startsWith for containment**: Use path.resolve() + normalized comparison, not string prefix matching.
3. **console.log in production**: Use structured logging or remove debug output.
4. **any type in TypeScript**: Use specific types, `unknown`, or generics.
5. **TODO without ticket**: Always reference a ticket: `// TODO(PROJ-123)`
6. **Dual-source truth**: One canonical source (JSONL), generated views (MD). Never maintain two independent copies.
7. **Hardcoded localhost URLs**: Use environment variables for all URLs.

## Workflow Lessons

### Schema-First Validation

Define data contracts with Zod schemas before implementation. Validate at boundaries (input/output), trust internal code.

### Completeness Tiers

Label work products: full (comprehensive), partial (known gaps), stub (placeholder). This prevents false confidence.

### Contract Tests Over Integration Tests

Test the interface, not the implementation. Mock at service boundaries, not internal functions.

### State Persistence Every Batch

Save progress after each logical batch of work. Compaction can happen at any time - your work must survive it.

### Primacy Bias Accounting

Put critical instructions both at the beginning AND end of long prompts. LLMs weight first and last content more heavily.

## npm Scripts (Key Commands)

```
npm run lint          # ESLint with framework rules
npm run format:check  # Prettier check
npm run deps:circular # Check circular dependencies (madge)
npm run deps:unused   # Check unused exports (knip)
npm test              # Run test suite
npm run test:coverage # Tests with c8 coverage
```
