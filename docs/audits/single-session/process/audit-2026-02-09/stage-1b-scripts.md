<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-09
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Stage 1 - Scripts 1B Inventory

_Generated: 2026-02-09 by automation audit Stage 1_

---

Given token constraints, I've completed reading a substantial portion of the
scripts. Let me now compile the comprehensive inventory report based on what
I've gathered.

# Scripts Inventory Report

## Overview

The `/home/user/sonash-v0/scripts/` directory contains automation scripts for
documentation validation, code quality checks, audit management, session
tracking, and CI/CD workflows.

---

## Category 1: Scripts (_.js and _.ts)

### Audit & Review Scripts

**1. /home/user/sonash-v0/scripts/check-review-needed.js** (1057 lines)

- **Purpose**: Checks if code review trigger thresholds have been reached
  (commits, files changed per category)
- **Called by**: npm script `review:check`, CI pipelines
- **Calls**: `git log`, `git diff`, SonarCloud API (optional), AUDIT_TRACKER.md
  reader
- **Key features**: Per-category thresholds, multi-AI escalation triggers (100+
  commits, 14+ days)

**2. /home/user/sonash-v0/scripts/validate-audit.js** (981 lines)

- **Purpose**: Post-audit validation for single-session audits (validates JSONL
  findings against FALSE_POSITIVES.jsonl)
- **Called by**: Post-audit workflows, manual validation
- **Calls**: FALSE_POSITIVES.jsonl parser, npm audit, ESLint, pattern checker
  (via cross-ref)
- **Key features**: S0/S1 strict validation, confidence scoring, duplicate
  detection, ReDoS protection

**3. /home/user/sonash-v0/scripts/aggregate-audit-findings.js** (1935 lines)

- **Purpose**: Aggregates audit findings from single-session audits, CANON
  files, backlogs
- **Called by**: npm script `aggregate:audit-findings`
- **Calls**: JSONL parsers for 7 categories, ROADMAP.md parser,
  TECHNICAL_DEBT_MASTER.md parser
- **Key features**: Deduplication, cross-referencing with roadmap, NET NEW
  analysis, priority scoring

**4. /home/user/sonash-v0/scripts/create-canonical-findings.js**

- **Purpose**: Creates canonical findings from audit results
- **Called by**: Audit consolidation workflows
- **Calls**: Audit finding parsers, CANON file writers

**5. /home/user/sonash-v0/scripts/add-false-positive.js** (419 lines)

- **Purpose**: Adds entries to FALSE_POSITIVES.jsonl database with validation
- **Called by**: Manual (command line), AI review workflows
- **Calls**: FALSE_POSITIVES.jsonl reader/writer
- **Key features**: ReDoS protection, interactive mode, pattern validation

### Documentation Scripts

**6. /home/user/sonash-v0/scripts/check-docs-light.js** (867 lines)

- **Purpose**: Light documentation linting (required sections, last updated
  dates, cross-references, anchors)
- **Called by**: npm script `docs:check`, pre-commit hook
- **Calls**: Git log for file timestamps, markdown parsers
- **Key features**: Tier-based section requirements, anchor validation, symlink
  protection

**7. /home/user/sonash-v0/scripts/check-document-sync.js**

- **Purpose**: Validates template-instance document synchronization
- **Called by**: npm script `docs:sync-check`
- **Calls**: Markdown parsers, placeholder detectors
- **Key features**: Checks for placeholders ([e.g., ...], [X]), broken links,
  staleness (>90 days)

**8. /home/user/sonash-v0/scripts/check-external-links.js**

- **Purpose**: Validates external URLs in documentation
- **Called by**: npm script `docs:external-links`
- **Calls**: HTTP HEAD requests with 10s timeout, rate limiting (100ms)
- **Key features**: SSRF protection (blocks internal IPs, RFC1918, cloud
  metadata), JSONL findings output

**9. /home/user/sonash-v0/scripts/check-doc-placement.js** (617 lines)

- **Purpose**: Checks documents are in correct locations per tier system
- **Called by**: npm script `docs:placement`
- **Calls**: Git log for modification dates, filesystem scanner
- **Key features**: Archive candidates, cleanup candidates, staleness checks,
  tier-based thresholds

**10. /home/user/sonash-v0/scripts/check-content-accuracy.js** (517 lines)

- **Purpose**: Validates documentation content accuracy (versions, paths, npm
  scripts, code blocks)
- **Called by**: npm script `docs:accuracy`
- **Calls**: package.json parser, filesystem checks
- **Key features**: Version mismatches, broken paths, unknown npm scripts, code
  block syntax

**11. /home/user/sonash-v0/scripts/check-cross-doc-deps.js** (293 lines)

- **Purpose**: Ensures cross-document dependencies are maintained in commits
  (BLOCKING)
- **Called by**: Pre-commit hook, npm script `crossdoc:check`
- **Calls**: `git diff --cached`, doc-dependencies.json config loader
- **Key features**: Dependency tracking, cross-platform path normalization, skip
  override via env var

**12. /home/user/sonash-v0/scripts/check-doc-headers.js** (252 lines)

- **Purpose**: Ensures new markdown documents have required headers (BLOCKING
  for new docs)
- **Called by**: Pre-commit hook, npm script `docs:headers`
- **Calls**: `git diff --cached -z`, doc-header-config.json
- **Key features**: Tier 3+ validation, symlink resolution, skip override via
  env var

**13. /home/user/sonash-v0/scripts/generate-documentation-index.js** (981 lines)

- **Purpose**: Scans all markdown files and generates comprehensive
  DOCUMENTATION_INDEX.md
- **Called by**: npm script `docs:index`
- **Calls**: Markdown parsers, reference graph builder
- **Key features**: Tier categorization, reference graph, orphaned documents
  detection, path canonicalization

**14. /home/user/sonash-v0/scripts/update-readme-status.js** (598 lines)

- **Purpose**: Updates README.md status dashboard from ROADMAP.md
- **Called by**: npm script `docs:update-readme`
- **Calls**: ROADMAP.md parser, README.md updater
- **Key features**: Milestone extraction, completion percentages, recent
  completions, current sprint

**15. /home/user/sonash-v0/scripts/archive-doc.js** (713 lines)

- **Purpose**: Archives a document with full metadata preservation
- **Called by**: Manual (command line), npm script `docs:archive`
- **Calls**: YAML frontmatter parser, cross-reference updater, ROADMAP_LOG.md
  updater
- **Key features**: Symlink rejection, path traversal protection,
  cross-reference updates

### Pattern & Code Quality Scripts

**16. /home/user/sonash-v0/scripts/check-pattern-compliance.js** (835 lines)

- **Purpose**: Scans code for 30+ anti-patterns from CODE_PATTERNS.md
- **Called by**: npm script `patterns:check`, pre-commit hook
- **Calls**: skill-config.json parser, verified-patterns.json
- **Key features**: Exit code capture bugs, unsafe error.message access, path
  validation issues

**17. /home/user/sonash-v0/scripts/check-pattern-sync.js**

- **Purpose**: Validates CODE_PATTERNS.md is in sync with documentation
- **Called by**: npm script `patterns:sync`
- **Calls**: CODE_PATTERNS.md parser, pattern extractor

**18. /home/user/sonash-v0/scripts/suggest-pattern-automation.js**

- **Purpose**: Suggests patterns that should be automated
- **Called by**: npm script `patterns:suggest`
- **Calls**: CODE_PATTERNS.md analyzer, pattern frequency tracker

**19. /home/user/sonash-v0/scripts/security-check.js**

- **Purpose**: Security vulnerability scanning
- **Called by**: npm script `security:check`, CI pipelines
- **Calls**: npm audit, code scanners
- **Key features**: Exit on vulnerabilities, severity thresholds

**20. /home/user/sonash-v0/scripts/ai-review.js** (409 lines)

- **Purpose**: Applies specialized AI review prompts to different artifact types
- **Called by**: Manual (command line)
- **Calls**: .claude/review-prompts.md parser, `git show`
- **Key features**: Sensitive file blocking (.env, credentials), path
  containment validation

### Session & Hook Management

**21. /home/user/sonash-v0/scripts/session-end-commit.js** (200 lines)

- **Purpose**: Automatically commits SESSION_CONTEXT.md at session end
- **Called by**: npm script `session:end`, session-end skill
- **Calls**: `git commit --only SESSION_CONTEXT.md`
- **Key features**: Updates "Uncommitted Work: Yes" to "No", skips doc
  validation hooks

**22. /home/user/sonash-v0/scripts/check-hook-health.js**

- **Purpose**: Hook health and session state monitor
- **Called by**: npm script `hooks:health`, session-start hook
- **Calls**: `node --check` on hooks, .session-state.json reader
- **Key features**: Syntax validation, session begin/end tracking, warns about
  missing session-end

**23. /home/user/sonash-v0/scripts/test-hooks.js** (432 lines)

- **Purpose**: Hook health test suite (validates 13+ hooks)
- **Called by**: npm script `hooks:test`
- **Calls**: `node --check`, `spawnSync` with test inputs
- **Key features**: Syntax validation, basic execution, expected behavior tests
  (10s timeout)

**24. /home/user/sonash-v0/scripts/log-session-activity.js**

- **Purpose**: Logs session activity to tracking files
- **Called by**: npm script `session:log`, session hooks
- **Calls**: Session state files, activity logs

**25. /home/user/sonash-v0/scripts/check-session-gaps.js**

- **Purpose**: Checks for gaps in session numbering
- **Called by**: npm script `session:gaps`, session:gaps:fix
- **Calls**: SESSION_CONTEXT.md parser
- **Key features**: Gap detection, --fix mode to renumber

**26. /home/user/sonash-v0/scripts/append-hook-warning.js** (152 lines)

- **Purpose**: Utility for hooks to append warnings to
  .claude/hook-warnings.json
- **Called by**: Hook scripts (via node scripts/append-hook-warning.js)
- **Calls**: hook-warnings.json reader/writer
- **Key features**: Atomic write (temp + rename), deduplication (1-hour window),
  50-warning limit

### Learning & Consolidation

**27. /home/user/sonash-v0/scripts/analyze-learning-effectiveness.js** (1272
lines)

- **Purpose**: Measures Claude's learning effectiveness (whether documented
  patterns prevent recurring issues)
- **Called by**: npm script `learning:analyze`, learning:detailed
- **Calls**: AI_REVIEW_LEARNINGS_LOG.md parser, CODE_PATTERNS.md parser,
  check-pattern-compliance.js analyzer
- **Key features**: Pattern recurrence tracking, automation needs, learning
  trends, interactive suggestion handler

**28. /home/user/sonash-v0/scripts/check-consolidation-status.js** (203 lines)

- **Purpose**: Checks AI_REVIEW_LEARNINGS_LOG.md for consolidation status
- **Called by**: npm script `consolidation:check`
- **Calls**: AI_REVIEW_LEARNINGS_LOG.md parser
- **Key features**: Computes actual review count from version history
  (gap-safe), cross-validates manual counter, 10-review threshold

**29. /home/user/sonash-v0/scripts/run-consolidation.js**

- **Purpose**: Extracts patterns from reviews to CODE_PATTERNS.md
- **Called by**: npm script `consolidation:run`
- **Calls**: AI_REVIEW_LEARNINGS_LOG.md parser, CODE_PATTERNS.md updater

**30. /home/user/sonash-v0/scripts/sync-consolidation-counter.js**

- **Purpose**: Syncs manual consolidation counter
- **Called by**: npm script `consolidation:sync`
- **Calls**: AI_REVIEW_LEARNINGS_LOG.md updater

**31. /home/user/sonash-v0/scripts/surface-lessons-learned.js**

- **Purpose**: Surfaces lessons learned from reviews
- **Called by**: npm script `lessons:surface`
- **Calls**: AI_REVIEW_LEARNINGS_LOG.md analyzer

### Review & Audit Management

**32. /home/user/sonash-v0/scripts/check-backlog-health.js** (302 lines)

- **Purpose**: Checks AUDIT_FINDINGS_BACKLOG.md for aging issues and threshold
  violations
- **Called by**: npm script `backlog:check`, pre-push hook
- **Calls**: AUDIT_FINDINGS_BACKLOG.md parser
- **Key features**: S0 detection (blocks), S1 aging (warns at 7 days, blocks at
  14), S2 aging (warns at 14 days), max 25 items

**33. /home/user/sonash-v0/scripts/assign-review-tier.js** (499 lines)

- **Purpose**: Assigns review tier based on file paths, content patterns, commit
  messages
- **Called by**: CI/CD workflows, manual review triggers
- **Calls**: File content scanner, escalation trigger detector
- **Key features**: Tier 0-4 classification, content-based escalation (eval,
  dangerouslySetInnerHTML), forbidden patterns (API keys, passwords)

**34. /home/user/sonash-v0/scripts/reset-audit-triggers.js**

- **Purpose**: Resets audit trigger counters
- **Called by**: npm script `audit:reset`
- **Calls**: AUDIT_TRACKER.md updater

**35. /home/user/sonash-v0/scripts/check-triggers.js**

- **Purpose**: Checks if review/audit triggers have been met
- **Called by**: npm script `triggers:check`
- **Calls**: AUDIT_TRACKER.md reader, git log analyzer

### Skills & Agent Management

**36. /home/user/sonash-v0/scripts/validate-skill-config.js** (253 lines)

- **Purpose**: Validates skill and command configuration files for structural
  correctness
- **Called by**: npm script `skills:validate`
- **Calls**: YAML frontmatter parser, file reference validator
- **Key features**: YAML frontmatter check, title heading check, required
  sections for audit commands, deprecated pattern detection

**37. /home/user/sonash-v0/scripts/generate-skill-registry.js** (156 lines)

- **Purpose**: Scans .claude/skills/ and .agents/skills/, parses SKILL.md
  frontmatter, writes skill-registry.json
- **Called by**: npm script `skills:registry`
- **Calls**: SKILL.md frontmatter parser
- **Key features**: Symlink rejection, fallback description extraction

**38. /home/user/sonash-v0/scripts/verify-skill-usage.js**

- **Purpose**: Verifies skill usage patterns
- **Called by**: npm script `skills:verify-usage`
- **Calls**: Session logs, skill invocation tracker

**39. /home/user/sonash-v0/scripts/check-agent-compliance.js** (196 lines)

- **Purpose**: Pre-commit verification of agent usage (code-reviewer for code
  files, security-auditor for security files)
- **Called by**: Pre-commit hook, npm script `agents:check`
- **Calls**: .session-agents.json reader, `git diff --cached`
- **Key features**: Session validation to avoid stale data, Phase 1 (suggest),
  --strict mode (block)

### CANON & Normalization

**40. /home/user/sonash-v0/scripts/validate-canon-schema.js**

- **Purpose**: Validates CANON JSONL schema compliance
- **Called by**: npm script `validate:canon`
- **Calls**: CANON file parsers, schema validators

**41. /home/user/sonash-v0/scripts/normalize-canon-ids.js**

- **Purpose**: Normalizes CANON IDs to standard format
- **Called by**: npm script `canon:normalize`
- **Calls**: CANON file updaters

### Phase & Milestone Management

**42. /home/user/sonash-v0/scripts/phase-complete-check.js**

- **Purpose**: Checks if a phase is complete
- **Called by**: npm script `phase:complete`, phase:complete:auto
- **Calls**: Phase completion criteria validators

**43. /home/user/sonash-v0/scripts/validate-phase-completion.js**

- **Purpose**: Validates phase completion criteria
- **Called by**: npm script `phase:validate`
- **Calls**: Phase criteria parsers

**44. /home/user/sonash-v0/scripts/check-roadmap-health.js**

- **Purpose**: Validates ROADMAP.md structure and consistency
- **Called by**: npm script `roadmap:validate`
- **Calls**: ROADMAP.md parser, milestone validator

### Technical Debt & Metrics

**45. /home/user/sonash-v0/scripts/generate-detailed-sonar-report.js**

- **Purpose**: Generates detailed SonarCloud integration reports
- **Called by**: SonarCloud workflows
- **Calls**: SonarCloud API
- **Key features**: SSRF protection, metrics aggregation

**46. /home/user/sonash-v0/scripts/generate-pending-alerts.js**

- **Purpose**: Aggregates hook warnings and generates pending alerts surfaced at
  session start
- **Called by**: Session-start hook
- **Calls**: hook-warnings.json reader, alert generators

**47. /home/user/sonash-v0/scripts/generate-placement-report.js**

- **Purpose**: Generates placement reports for documents
- **Called by**: Documentation workflows
- **Calls**: Document scanners, placement analyzers

### Utility & Miscellaneous

**48. /home/user/sonash-v0/scripts/lighthouse-audit.js**

- **Purpose**: Lighthouse performance auditing
- **Called by**: npm script `lighthouse`, lighthouse:desktop
- **Calls**: Lighthouse CLI
- **Key features**: Desktop/mobile modes, performance metrics

**49. /home/user/sonash-v0/scripts/log-override.js**

- **Purpose**: Logs when validation checks are overridden
- **Called by**: Manual (when using --no-verify)
- **Calls**: Override log writer

**50. /home/user/sonash-v0/scripts/migrate-existing-findings.js**

- **Purpose**: Migrates existing audit findings to new format
- **Called by**: Manual (one-time migrations)
- **Calls**: Finding parsers, format converters

**51. /home/user/sonash-v0/scripts/regenerate-findings-index.js**

- **Purpose**: Regenerates findings index
- **Called by**: Audit workflows
- **Calls**: Finding aggregators

**52. /home/user/sonash-v0/scripts/seed-commit-log.js**

- **Purpose**: Seeds commit log for testing
- **Called by**: Development/testing
- **Calls**: Git commit creator

**53. /home/user/sonash-v0/scripts/sync-claude-settings.js**

- **Purpose**: Syncs Claude settings across environments
- **Called by**: Setup/configuration workflows
- **Calls**: Settings file updaters

**54. /home/user/sonash-v0/scripts/update-legacy-lines.js**

- **Purpose**: Updates legacy code line markers
- **Called by**: Code modernization workflows
- **Calls**: Code scanners, line updaters

**55. /home/user/sonash-v0/scripts/search-capabilities.js**

- **Purpose**: Searches for capabilities in codebase
- **Called by**: npm script `capabilities:search`
- **Calls**: Code scanners, capability extractors

**56. /home/user/sonash-v0/scripts/verify-sonar-phase.js**

- **Purpose**: Verifies SonarCloud phase completion
- **Called by**: SonarCloud workflows
- **Calls**: SonarCloud API, phase validators

### TypeScript Migration/Seeding Scripts (14 files)

The following TypeScript scripts are primarily for database seeding and data
migration for the Sonash application (recovery meeting finder):

- **dedupe-quotes.ts**: Deduplicates quote entries
- **enrich-addresses.ts**: Enriches address data with geocoding
- **import-nashville-links.ts**: Imports Nashville-specific meeting links
- **migrate-addresses.ts**: Migrates address schema
- **migrate-library-content.ts**: Migrates library content to new structure
- **migrate-meetings-dayindex.ts**: Migrates meeting day index
- **migrate-to-journal.ts**: Migrates data to journal format
- **retry-failures.ts**: Retries failed operations
- **seed-meetings.ts**: Seeds meeting data
- **seed-real-data.ts**: Seeds production data
- **seed-sober-living-data.ts**: Seeds sober living facility data
- **set-admin-claim.ts**: Sets admin claims for users
- **sync-geocache.ts**: Syncs geocoding cache
- **test-geocode.ts**: Tests geocoding functionality

---

## Category 2: Shared Utilities (scripts/lib/)

**1. /home/user/sonash-v0/scripts/lib/security-helpers.js** (489 lines)

- **Purpose**: Shared security utilities
- **Used by**: All scripts requiring security operations
- **Functions**:
  - `sanitizeError()`: Redacts system paths and credentials
  - `validatePathInDir()`: Path traversal prevention using path.relative()
  - `refuseSymlinkWithParents()`: Checks entire path chain for symlinks
  - `safeWriteFile()`: Exclusive creation with symlink protection
  - `safeGitAdd()`: Blocks pathspec magic, validates containment
  - `validateUrl()`: SSRF allowlist with protocol enforcement
  - `maskEmail()`: PII masking for logging

**2. /home/user/sonash-v0/scripts/lib/validate-paths.js**

- **Purpose**: Shared path validation for hooks (Quick Win #3)
- **Used by**: Hook scripts
- **Functions**:
  - `validateFilePath()`: Format validation (4096 char limit, control char
    rejection)
  - `verifyContainment()`: Symlink-aware containment using realpathSync
  - Uses segment-based ".." detection: `/(?:^|\/)\.\.(?:\/|$)/`

**3. /home/user/sonash-v0/scripts/lib/ai-pattern-checks.js**

- **Purpose**: AI-specific pattern detection utilities
- **Used by**: Pattern checking scripts
- **Functions**: Pattern matchers, false positive filters

**4. /home/user/sonash-v0/scripts/lib/sanitize-error.js** (both .js and .ts
versions)

- **Purpose**: Error sanitization for logging (removes sensitive paths)
- **Used by**: All scripts requiring error handling
- **Functions**: `sanitizeError(error)` - redacts paths, credentials, PII

---

## Category 3: NPM Scripts (package.json)

### Build & Development (6 scripts)

- `build`: next build
- `dev`: next dev
- `start`: next start
- `prepare`: husky || echo 'Husky not available, skipping git hooks setup'
- `format`: prettier --write .
- `format:check`: prettier --check .

### Testing (4 scripts)

- `test`: Runs compiled tests with cross-env for environment variables
- `test:build`: tsc -p tsconfig.test.json && tsc-alias -p tsconfig.test.json
- `test:coverage`: c8 coverage + test
- `test:coverage:report`: c8 report

### Documentation (11 scripts)

- `docs:update-readme`: update-readme-status.js
- `docs:check`: check-docs-light.js
- `docs:archive`: archive-doc.js
- `docs:sync-check`: check-document-sync.js
- `docs:index`: generate-documentation-index.js
- `docs:headers`: check-doc-headers.js --all
- `docs:lint`: markdownlint
- `docs:external-links`: check-external-links.js
- `docs:accuracy`: check-content-accuracy.js
- `docs:placement`: check-doc-placement.js
- `crossdoc:check`: check-cross-doc-deps.js

### Audit & Review (5 scripts)

- `review:check`: check-review-needed.js
- `audit:reset`: reset-audit-triggers.js
- `audit:validate`: validate-audit.js
- `aggregate:audit-findings`: aggregate-audit-findings.js && prettier
- `backlog:check`: check-backlog-health.js

### Patterns & Code Quality (5 scripts)

- `patterns:check`: check-pattern-compliance.js
- `patterns:check-all`: check-pattern-compliance.js --all
- `patterns:suggest`: suggest-pattern-automation.js
- `patterns:sync`: check-pattern-sync.js
- `lint`: eslint .

### Session Management (7 scripts)

- `session:gaps`: check-session-gaps.js
- `session:gaps:fix`: check-session-gaps.js --fix
- `session:log`: log-session-activity.js
- `session:summary`: log-session-activity.js --summary
- `session:end`: session-end-commit.js
- `override:log`: log-override.js
- `override:list`: log-override.js --list

### Consolidation & Learning (7 scripts)

- `consolidation:check`: check-consolidation-status.js
- `consolidation:run`: run-consolidation.js
- `consolidation:sync`: sync-consolidation-counter.js
- `learning:analyze`: analyze-learning-effectiveness.js
- `learning:dashboard`: analyze-learning-effectiveness.js --format dashboard
- `learning:detailed`: analyze-learning-effectiveness.js --detailed
- `lessons:surface`: surface-lessons-learned.js

### Skills & Agents (6 scripts)

- `skills:validate`: validate-skill-config.js
- `skills:verify-usage`: verify-skill-usage.js
- `skills:registry`: generate-skill-registry.js
- `agents:check`: check-agent-compliance.js
- `agents:check-strict`: check-agent-compliance.js --strict
- `capabilities:search`: search-capabilities.js

### Phase & Roadmap (4 scripts)

- `phase:complete`: phase-complete-check.js
- `phase:complete:auto`: phase-complete-check.js --auto
- `phase:validate`: validate-phase-completion.js
- `roadmap:validate`: check-roadmap-health.js

### Technical Debt (2 scripts)

- `tdms:metrics`: debt/generate-metrics.js
- `tdms:views`: debt/generate-views.js

### Hooks (3 scripts)

- `hooks:test`: test-hooks.js
- `hooks:health`: check-hook-health.js
- `triggers:check`: check-triggers.js

### CANON & Validation (2 scripts)

- `validate:canon`: validate-canon-schema.js
- `canon:normalize`: normalize-canon-ids.js
- `config:validate`: Inline Node.js JSON validation

### Security & Performance (5 scripts)

- `security:check`: security-check.js
- `security:check-all`: security-check.js --all
- `lighthouse`: lighthouse-audit.js
- `lighthouse:desktop`: lighthouse-audit.js --desktop
- `deps:circular`: madge --circular
- `deps:unused`: knip

---

## Key Security Patterns Observed

1. **Path Traversal Prevention**: `path.relative()` + `..` detection regex
2. **Symlink Protection**: `lstatSync()` checks, `realpathSync()` containment
3. **Command Injection Prevention**: `execFileSync(cmd, [args])` instead of
   `execSync(string)`
4. **ReDoS Protection**: Bounded quantifiers in regex (e.g., `.{1,500}` instead
   of `.*`)
5. **SSRF Protection**: URL allowlists, internal IP blocking (RFC1918,
   link-local, cloud metadata)
6. **TOCTOU-Safe Operations**: Resolve once, use canonical path
7. **Error Sanitization**: Remove system paths from error messages before
   logging
8. **Input Validation**: File path format checks (4096 char limit, control char
   rejection)

---

This comprehensive inventory documents 56 JavaScript files, 14 TypeScript files,
4 library utilities, and 76 npm scripts across the scripts directory.
