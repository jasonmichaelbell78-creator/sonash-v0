# Custom Slash Commands Guide for SoNash v0

**Document Version:** 1.0 **Last Updated:** 2026-01-15 **Status:** ACTIVE

## Overview

This document provides a comprehensive list of custom slash commands that can be
implemented to enhance the development workflow for the SoNash Recovery Notebook
project. These commands are organized by category and prioritized based on
immediate value and workflow integration.

## Table of Contents

1. [Workflow-Specific Commands](#category-1-workflow-specific-commands)
2. [Firebase & Cloud Functions](#category-2-firebase--cloud-functions)
3. [Testing & Quality Assurance](#category-3-testing--quality-assurance)
4. [Documentation Management](#category-4-documentation-management)
5. [Security & Compliance](#category-5-security--compliance)
6. [Development Assistance](#category-6-development-assistance)
7. [Monitoring & Observability](#category-7-monitoring--observability)
8. [Integration Commands](#category-8-integration-commands)
9. [Data Management](#category-9-data-management)
10. [CI/CD & Deployment](#category-10-cicd--deployment)
11. [Session & Workflow Management](#category-11-session--workflow-management)
12. [Code Quality & Patterns](#category-12-code-quality--patterns)
13. [User Experience & Accessibility](#category-13-user-experience--accessibility)
14. [Emergency & Incident Response](#category-14-emergency--incident-response)
15. [Firebase-Specific Tools](#category-15-firebase-specific-tools)
16. [Implementation Roadmap](#implementation-roadmap)

---

## Category 1: Workflow-Specific Commands

### `/daily-log-test`

**Description:** Test the complete daily log workflow from UI to Firestore

**Use Case:** Quickly validate that the daily log feature works end-to-end after
changes

**What it does:**

- Validates daily log UI component rendering
- Tests `saveDailyLog` Cloud Function
- Checks Firestore rules enforcement
- Validates rate limiting (10 req/60s)
- Tests reCAPTCHA integration
- Verifies mood tracking and content storage

**Options:**

- `--ui-only` - Test only UI components
- `--function-only` - Test only Cloud Function
- `--full` - Full end-to-end test (default)

---

### `/journal-scaffold`

**Description:** Generate a new journal entry type with complete boilerplate

**Use Case:** When adding new journal types (like "spot-check" or "gratitude")

**What it does:**

- Creates Zod schema in `functions/src/schemas.ts`
- Adds TypeScript types in `lib/types/`
- Generates React component in `components/journal/`
- Creates Cloud Function handler
- Adds Firestore security rules
- Updates documentation

**Options:**

- `--type` - Entry type name (required)
- `--fields` - Comma-separated field definitions

**Example:**

```bash
/journal-scaffold --type="milestone" --fields="title:string,description:string,date:timestamp"
```

---

### `/meeting-sync`

**Description:** Sync meeting data from external source and validate

**Use Case:** When importing meeting directories or updating meeting data

**What it does:**

- Validates meeting schema (location, time, type)
- Checks geocoding for addresses
- Verifies clustering logic for map display
- Tests admin permissions for updates
- Validates public read access

**Options:**

- `--source` - CSV file path or external API
- `--dry-run` - Preview changes without applying
- `--fellowship` - Filter by fellowship type

---

### `/validate-workflow`

**Description:** Comprehensive validation of a specific user workflow

**Use Case:** Before releasing a feature, test the entire user journey

**What it does:**

- Runs unit tests for workflow
- Validates Cloud Functions
- Checks Firestore rules
- Tests UI components
- Verifies rate limiting
- Checks error handling

**Options:**

- `--workflow` - One of: `daily-log`, `journal`, `meeting`, `admin`, `auth`
- `--verbose` - Detailed output

---

## Category 2: Firebase & Cloud Functions

### `/firebase-deploy-check`

**Description:** Pre-deployment validation for Firebase

**Use Case:** Before running `firebase deploy` to catch issues early

**What it does:**

- Validates `firebase.json` configuration
- Checks for orphaned Cloud Functions
- Verifies Firestore rules syntax
- Tests security rules against test cases
- Validates indexes in `firestore.indexes.json`
- Checks for breaking changes in function signatures
- Reviews environment variables

**Options:**

- `--target` - Specific target: `functions`, `rules`, `hosting`, `all` (default)
- `--auto-fix` - Attempt to fix issues automatically

---

### `/function-scaffold`

**Description:** Generate a new Cloud Function with security best practices

**Use Case:** When creating new backend endpoints

**What it does:**

- Creates function in `functions/src/`
- Adds security wrapper with rate limiting
- Generates Zod validation schema
- Adds reCAPTCHA verification
- Creates unit tests
- Updates `functions/index.ts`
- Documents in API reference

**Options:**

- `--name` - Function name (required)
- `--auth-required` - Require authentication (default: true)
- `--admin-only` - Require admin custom claim
- `--rate-limit` - Requests per window (default: 10/60s)

**Example:**

```bash
/function-scaffold --name="saveReflection" --auth-required --rate-limit="5/60s"
```

---

### `/test-cloud-function`

**Description:** Test a specific Cloud Function with mock data

**Use Case:** Rapid iteration on Cloud Function logic

**What it does:**

- Runs function with valid test data
- Tests with invalid data (boundary testing)
- Validates error handling
- Checks rate limiting
- Verifies logging output
- Tests auth requirements

**Options:**

- `--function` - Function name (required)
- `--mock-data` - JSON file with test data
- `--scenarios` - Test specific scenarios: `happy`, `error`, `rate-limit`, `all`

---

### `/firestore-rules-test`

**Description:** Run comprehensive Firestore security rules tests

**Use Case:** After modifying `firestore.rules`

**What it does:**

- Tests read/write permissions for all collections
- Validates owner-only access patterns
- Tests admin custom claims
- Checks public read collections
- Tests soft-delete logic
- Generates coverage report

**Options:**

- `--collection` - Test specific collection only
- `--coverage` - Generate detailed coverage report

---

### `/firebase-emulator-start`

**Description:** Start Firebase emulators with optimal configuration

**Use Case:** Local development and testing

**What it does:**

- Starts Firestore, Auth, Functions emulators
- Seeds test data (users, meetings, quotes)
- Configures App Check debug token
- Sets up hot reload for Functions
- Opens emulator UI in browser

**Options:**

- `--seed` - Seed test data (default: true)
- `--ui` - Open emulator UI (default: true)
- `--only` - Start specific emulators: `firestore`, `auth`, `functions`

---

## Category 3: Testing & Quality Assurance

### `/test-suite-run`

**Description:** Run test suite with comprehensive reporting

**Use Case:** Before commits or when making significant changes

**What it does:**

- Runs all 17 test files
- Generates coverage report (c8)
- Highlights failing tests
- Shows coverage gaps
- Generates HTML report
- Updates test documentation

**Options:**

- `--coverage` - Include coverage report
- `--watch` - Watch mode for development
- `--filter` - Run tests matching pattern
- `--html` - Generate HTML coverage report

---

### `/fix-test-mocks`

**Description:** Diagnose and fix test mock issues

**Use Case:** Address the 12 failing logger mock tests

**What it does:**

- Analyzes mock.calls undefined issues
- Suggests mock implementation fixes
- Updates test utilities
- Validates mock structure
- Runs tests to confirm fixes

**Options:**

- `--file` - Target specific test file
- `--auto-fix` - Apply fixes automatically

---

### `/coverage-improve`

**Description:** Identify untested code paths and generate test cases

**Use Case:** Improving test coverage percentage

**What it does:**

- Runs coverage report
- Identifies uncovered lines/branches
- Suggests test cases for gaps
- Generates test scaffolding
- Prioritizes by code criticality

**Options:**

- `--threshold` - Minimum coverage target (default: 80%)
- `--generate` - Generate test scaffolding
- `--prioritize` - Focus on critical paths first

---

### `/pattern-violation-fix`

**Description:** Auto-fix code pattern violations

**Use Case:** Clean up the ~115 ESLint warnings incrementally

**What it does:**

- Runs `check-pattern-compliance.js`
- Identifies violations
- Applies auto-fixes where safe
- Generates PR with changes
- Updates CODE_PATTERNS.md if needed

**Options:**

- `--auto-fix` - Apply fixes automatically
- `--pattern` - Target specific pattern
- `--file` - Fix specific file only
- `--dry-run` - Preview changes only

---

### `/integration-test-generate`

**Description:** Generate integration tests for a feature

**Use Case:** Testing end-to-end workflows

**What it does:**

- Creates integration test file
- Mocks Firebase services
- Tests UI → Cloud Function → Firestore flow
- Validates error scenarios
- Tests rate limiting
- Documents test scenarios

**Options:**

- `--feature` - Feature name: `daily-log`, `journal`, `meeting`, `admin`
- `--scenarios` - Specific scenarios to test

---

## Category 4: Documentation Management

### `/doc-update`

**Description:** Intelligent documentation update assistant

**Use Case:** After code changes that affect documentation

**What it does:**

- Analyzes code changes
- Identifies affected documentation
- Suggests updates to README, ARCHITECTURE, etc.
- Updates CODE_PATTERNS.md if new patterns emerge
- Checks cross-document dependencies
- Updates DOCUMENTATION_INDEX.md

**Options:**

- `--files` - Changed files to analyze
- `--auto-update` - Apply suggested changes
- `--check-deps` - Check document dependencies

---

### `/doc-template-create`

**Description:** Create a new document from template

**Use Case:** Starting new documentation files

**What it does:**

- Copies template from `docs/templates/`
- Fills in metadata (date, version, status)
- Adds to document dependency graph
- Updates DOCUMENTATION_INDEX.md
- Creates PR checklist

**Options:**

- `--template` - Template type: `ADR`, `guide`, `reference`, `process`
- `--title` - Document title (required)
- `--location` - Output directory

---

### `/learning-extract`

**Description:** Extract learnings from recent AI reviews

**Use Case:** After code review or session, capture insights

**What it does:**

- Analyzes recent AI review comments
- Extracts new patterns
- Updates AI_REVIEW_LEARNINGS_LOG.md
- Checks for consolidation threshold
- Suggests pattern automation
- Updates CODE_PATTERNS.md

**Options:**

- `--reviews` - Number of recent reviews to analyze
- `--category` - Focus: `security`, `performance`, `patterns`
- `--consolidate` - Trigger consolidation if threshold reached

---

### `/roadmap-update`

**Description:** Update ROADMAP.md based on progress

**Use Case:** After completing features or pivoting priorities

**What it does:**

- Marks completed tasks
- Moves items between phases
- Validates phase completion criteria
- Updates status indicators
- Checks for orphaned tasks
- Generates progress report

**Options:**

- `--complete` - Mark task as complete
- `--move` - Move task to different phase
- `--report` - Generate progress report only

---

### `/adr-create`

**Description:** Create an Architecture Decision Record

**Use Case:** Documenting significant technical decisions

**What it does:**

- Creates ADR in `docs/decisions/`
- Follows ADR template format
- Auto-numbers ADR
- Links to related docs
- Updates decision index
- Adds to git

**Options:**

- `--title` - Decision title (required)
- `--status` - Status: `proposed`, `accepted`, `deprecated`, `superseded`

**Example:**

```bash
/adr-create --title="Use Zod for runtime validation" --status="accepted"
```

---

## Category 5: Security & Compliance

### `/security-scan-deep`

**Description:** Comprehensive security audit beyond `/audit-security`

**Use Case:** Before major releases or security reviews

**What it does:**

- Scans for OWASP Top 10 vulnerabilities
- Checks for exposed secrets/API keys
- Validates path traversal prevention
- Tests input sanitization
- Checks prototype pollution guards
- Reviews error message sanitization
- Tests rate limiting effectiveness
- Validates App Check integration
- Checks Firestore rules for leaks

**Options:**

- `--owasp` - Focus on OWASP Top 10
- `--secrets` - Scan for secrets only
- `--report` - Generate detailed report
- `--fix` - Auto-fix issues where possible

---

### `/appcheck-validate`

**Description:** Validate App Check configuration and status

**Use Case:** When re-enabling App Check after throttle clears

**What it does:**

- Checks reCAPTCHA Enterprise setup
- Validates debug tokens
- Tests token generation
- Verifies Cloud Function integration
- Checks enforcement level
- Tests fallback behavior
- Documents current status

**Options:**

- `--env` - Environment: `dev`, `staging`, `prod`
- `--test-token` - Test with specific token

---

### `/secrets-audit`

**Description:** Audit for hardcoded secrets and credentials

**Use Case:** Before commits and during security reviews

**What it does:**

- Scans for API keys, tokens, passwords
- Checks `.env.local` vs `.env.example`
- Validates `.gitignore` patterns
- Checks for accidentally committed secrets
- Suggests secret rotation if needed
- Validates environment variable usage

**Options:**

- `--scan-history` - Check git history
- `--patterns` - Custom patterns to search

---

### `/compliance-check`

**Description:** Verify compliance with security standards

**Use Case:** Before deployments and during audits

**What it does:**

- Validates against GLOBAL_SECURITY_STANDARDS.md
- Checks data classification requirements
- Verifies encryption at rest/transit
- Tests GDPR compliance (right to delete)
- Validates audit logging
- Checks authentication requirements
- Reviews authorization patterns

**Options:**

- `--standard` - Specific standard: `GDPR`, `OWASP`, `internal`
- `--report` - Generate compliance report

---

## Category 6: Development Assistance

### `/component-scaffold`

**Description:** Generate React component with best practices

**Use Case:** Creating new UI components

**What it does:**

- Creates component file with TypeScript
- Adds proper imports (React, Framer Motion, etc.)
- Includes shadcn/ui integration
- Generates prop types
- Creates test file
- Adds to component index
- Includes accessibility attributes

**Options:**

- `--type` - Component type: `page`, `component`, `layout`
- `--name` - Component name (required)
- `--path` - Output path (default: `components/`)

**Example:**

```bash
/component-scaffold --type="component" --name="RecoveryProgress" --path="components/dashboard/"
```

---

### `/hook-create`

**Description:** Generate custom React hook with testing

**Use Case:** Creating reusable React hooks

**What it does:**

- Creates hook in `hooks/` directory
- Adds TypeScript types
- Includes error handling
- Creates test file with test cases
- Documents usage examples
- Adds to hooks index

**Options:**

- `--name` - Hook name (required, must start with "use")
- `--dependencies` - External dependencies needed

---

### `/schema-generate`

**Description:** Generate Zod schema from TypeScript type or Firestore doc

**Use Case:** Creating validation schemas

**What it does:**

- Analyzes TypeScript interface or Firestore structure
- Generates Zod schema
- Adds validation constraints
- Creates type guards
- Generates test cases
- Documents schema

**Options:**

- `--from` - Source type: `type`, `firestore`
- `--source` - Source path or collection name
- `--output` - Output file path

---

### `/refactor-suggest`

**Description:** AI-powered refactoring suggestions

**Use Case:** Improving code quality and maintainability

**What it does:**

- Analyzes code structure
- Identifies code smells
- Suggests design pattern improvements
- Finds duplicate code
- Recommends abstractions
- Checks against CODE_PATTERNS.md
- Estimates impact

**Options:**

- `--file` - File to analyze (required)
- `--focus` - Focus area: `performance`, `readability`, `patterns`
- `--apply` - Apply suggestions automatically

---

### `/dependency-update-safe`

**Description:** Safely update dependencies with testing

**Use Case:** Regular dependency maintenance

**What it does:**

- Checks for updates
- Reviews changelogs for breaking changes
- Updates package.json
- Runs tests
- Checks for deprecations
- Tests build
- Creates PR with notes

**Options:**

- `--type` - Update type: `major`, `minor`, `patch`
- `--package` - Specific package name
- `--dry-run` - Check only, don't update

---

## Category 7: Monitoring & Observability

### `/error-dashboard`

**Description:** Generate error report from Sentry and logs

**Use Case:** Morning standup or incident response

**What it does:**

- Queries Sentry API for errors
- Analyzes Cloud Function logs
- Groups errors by type
- Shows error trends
- Highlights new errors
- Suggests fixes for common errors
- Creates GitHub issues for critical errors

**Options:**

- `--since` - Time range: `24h`, `7d`, `30d`
- `--severity` - Filter: `error`, `warning`, `all`
- `--create-issues` - Auto-create GitHub issues

---

### `/performance-report`

**Description:** Comprehensive performance analysis

**Use Case:** Regular performance monitoring

**What it does:**

- Runs Lighthouse audit (desktop/mobile)
- Analyzes Core Web Vitals
- Checks bundle size
- Reviews Cloud Function cold starts
- Analyzes Firestore query performance
- Generates optimization recommendations
- Compares to baselines

**Options:**

- `--device` - Device: `desktop`, `mobile`, `both`
- `--baseline` - Compare to baseline commit
- `--detailed` - Include detailed metrics

---

### `/lighthouse-compare`

**Description:** Compare Lighthouse scores over time

**Use Case:** Tracking performance improvements

**What it does:**

- Runs Lighthouse on both versions
- Compares scores (Performance, A11y, SEO, Best Practices)
- Shows metric changes
- Highlights regressions
- Generates visual report
- Suggests improvements

**Options:**

- `--baseline` - Baseline commit hash
- `--current` - Current commit hash (default: HEAD)
- `--output` - Output format: `json`, `html`, `markdown`

---

### `/sentry-triage`

**Description:** Triage and categorize Sentry errors

**Use Case:** Daily error management

**What it does:**

- Fetches unresolved Sentry issues
- Categorizes by severity
- Groups similar errors
- Suggests owner assignment
- Creates GitHub issues
- Adds to backlog
- Updates Sentry tags

**Options:**

- `--auto-triage` - Automatically categorize
- `--create-issues` - Create GitHub issues
- `--assign` - Auto-assign to team members

---

## Category 8: Integration Commands

### `/sonarcloud-analyze`

**Description:** Run SonarCloud analysis and review results

**Use Case:** Code quality checks before PRs

**What it does:**

- Triggers SonarCloud scan via MCP
- Fetches quality gate status
- Reviews code smells
- Checks security hotspots
- Analyzes technical debt
- Compares to previous scan
- Generates report

**Options:**

- `--branch` - Branch to analyze
- `--compare` - Compare with branch
- `--threshold` - Quality gate threshold

---

### `/recaptcha-test`

**Description:** Test reCAPTCHA Enterprise integration

**Use Case:** Validating bot protection

**What it does:**

- Tests token generation
- Validates token verification
- Checks score thresholds
- Tests action-specific tokens
- Validates Cloud Function integration
- Reviews assessment logs
- Tests fallback behavior

**Options:**

- `--action` - reCAPTCHA action to test
- `--env` - Environment: `dev`, `prod`

---

### `/mcp-server-health`

**Description:** Check health of all configured MCP servers

**Use Case:** Debugging MCP integration issues

**What it does:**

- Pings all 8 MCP servers
- Tests authentication
- Validates configurations
- Checks rate limits
- Tests sample operations
- Generates health report
- Suggests fixes for issues

**Options:**

- `--server` - Test specific server only
- `--verbose` - Detailed diagnostics

---

### `/github-metrics`

**Description:** Fetch GitHub repository metrics

**Use Case:** Sprint retrospectives and planning

**What it does:**

- Fetches PR statistics
- Analyzes commit frequency
- Reviews code review turnaround
- Checks issue closure rates
- Analyzes contributor activity
- Generates sprint report

**Options:**

- `--since` - Start date for metrics
- `--format` - Output format: `table`, `json`, `markdown`

---

## Category 9: Data Management

### `/schema-validate`

**Description:** Validate Firestore data against schemas

**Use Case:** After schema changes or data migrations

**What it does:**

- Queries Firestore collection
- Validates against Zod schemas
- Identifies invalid documents
- Suggests fixes
- Generates migration script
- Creates validation report

**Options:**

- `--collection` - Collection name (required)
- `--sample-size` - Documents to sample (default: 100)
- `--fix` - Auto-fix invalid documents

---

### `/data-migration-plan`

**Description:** Plan and execute Firestore data migration

**Use Case:** Schema changes requiring data updates

**What it does:**

- Analyzes schema differences
- Estimates affected documents
- Generates migration script
- Creates rollback plan
- Tests on sample data
- Validates post-migration
- Documents migration

**Options:**

- `--from-schema` - Source schema version
- `--to-schema` - Target schema version
- `--collection` - Collection to migrate
- `--dry-run` - Plan only, don't execute

---

### `/backup-create`

**Description:** Create Firestore backup with validation

**Use Case:** Before major changes or deployments

**What it does:**

- Triggers Firestore export
- Validates backup completion
- Tags backup with label
- Stores backup metadata
- Tests backup restore (dry run)
- Documents backup location

**Options:**

- `--collections` - Collections to backup: `all`, specific names
- `--label` - Backup label (e.g., `release-v1.2`)

---

### `/data-audit`

**Description:** Audit Firestore data for inconsistencies

**Use Case:** Regular data quality checks

**What it does:**

- Checks for orphaned documents
- Validates foreign key relationships
- Finds duplicate data
- Checks for missing required fields
- Validates data types
- Generates cleanup script

**Options:**

- `--collection` - Specific collection or `all`
- `--fix` - Auto-fix issues
- `--report` - Generate detailed report

---

## Category 10: CI/CD & Deployment

### `/deploy-preview`

**Description:** Preview deployment changes before deploying

**Use Case:** Before running `firebase deploy`

**What it does:**

- Shows functions to be deployed
- Lists rule changes
- Shows hosting file changes
- Estimates deployment time
- Checks for breaking changes
- Validates environment variables
- Generates deployment plan

**Options:**

- `--target` - Deployment target: `functions`, `rules`, `hosting`, `all`
- `--env` - Environment: `dev`, `staging`, `prod`

---

### `/deploy-rollback`

**Description:** Rollback to previous deployment

**Use Case:** When deployment causes issues

**What it does:**

- Lists recent deployments
- Identifies target version
- Executes rollback
- Validates rollback success
- Updates deployment log
- Creates incident report

**Options:**

- `--target` - Target: `functions`, `hosting`, `rules`
- `--version` - Version to rollback to

---

### `/build-analyze`

**Description:** Analyze Next.js build output

**Use Case:** After build, before deployment

**What it does:**

- Analyzes bundle sizes
- Identifies large dependencies
- Checks for duplicate code
- Reviews code splitting
- Validates static generation
- Suggests optimizations
- Compares to previous build

**Options:**

- `--baseline` - Compare to baseline build
- `--threshold` - Bundle size threshold (KB)

---

### `/ci-debug`

**Description:** Debug CI/CD pipeline failures

**Use Case:** When GitHub Actions workflows fail

**What it does:**

- Fetches workflow logs
- Identifies failure points
- Suggests fixes
- Tests locally if possible
- Checks for environment issues
- Reviews recent changes
- Creates debug report

**Options:**

- `--workflow` - Workflow name: `ci`, `deploy`, `docs-lint`
- `--run` - Run ID to debug

---

### `/release-prepare`

**Description:** Prepare for production release

**Use Case:** Before major version releases

**What it does:**

- Updates version in package.json
- Generates changelog from commits
- Runs full test suite
- Checks for breaking changes
- Validates documentation
- Creates release branch
- Generates release notes
- Prepares deployment checklist

**Options:**

- `--version` - Version number (required, e.g., `1.2.0`)
- `--branch` - Source branch (default: current)

---

## Category 11: Session & Workflow Management

### `/session-summary`

**Description:** Generate summary of current session work

**Use Case:** End of coding session

**What it does:**

- Lists files changed
- Summarizes commits
- Shows patterns learned
- Lists TODOs remaining
- Generates session report
- Suggests next session tasks
- Updates SESSION_CONTEXT.md

**Options:**

- `--format` - Output format: `markdown`, `json`
- `--update-context` - Update SESSION_CONTEXT.md

---

### `/consolidate-learnings`

**Description:** Consolidate AI review learnings

**Use Case:** When review count hits threshold (every 10 reviews)

**What it does:**

- Runs consolidation process
- Updates AI_REVIEW_LEARNINGS_LOG.md
- Archives old reviews
- Updates CODE_PATTERNS.md
- Suggests automation opportunities
- Creates consolidation PR

**Options:**

- `--force` - Force consolidation even if below threshold
- `--reviews` - Number of reviews to consolidate

---

### `/pattern-automation-suggest`

**Description:** Suggest automation for repeated patterns

**Use Case:** Identifying workflow improvements

**What it does:**

- Analyzes session logs
- Identifies repeated tasks
- Suggests automation scripts
- Estimates time savings
- Generates script scaffolding
- Documents in AI_WORKFLOW.md

**Options:**

- `--sessions` - Number of sessions to analyze
- `--generate` - Generate automation scripts

---

### `/blockers-review`

**Description:** Review and update active blockers

**Use Case:** Daily standup or sprint planning

**What it does:**

- Lists active blockers from SESSION_CONTEXT.md
- Checks if blockers resolved
- Updates blocker status
- Suggests workarounds
- Creates GitHub issues for blockers
- Assigns priorities

**Options:**

- `--resolve` - Mark blocker as resolved
- `--add` - Add new blocker

---

### `/skill-effectiveness`

**Description:** Analyze effectiveness of custom skills/commands

**Use Case:** Monthly workflow optimization

**What it does:**

- Reviews skill usage logs
- Calculates success rates
- Identifies unused skills
- Suggests improvements
- Measures time savings
- Generates optimization report

**Options:**

- `--period` - Analysis period: `week`, `month`, `all`
- `--skill` - Analyze specific skill

---

## Category 12: Code Quality & Patterns

### `/circular-deps-fix`

**Description:** Identify and fix circular dependencies

**Use Case:** When madge reports circular dependencies

**What it does:**

- Runs madge analysis
- Visualizes dependency graph
- Suggests refactoring
- Creates interface abstractions
- Tests changes
- Updates imports

**Options:**

- `--auto-fix` - Apply fixes automatically
- `--visualize` - Generate dependency graph

---

### `/unused-code-remove`

**Description:** Safely remove unused code

**Use Case:** Code cleanup and maintenance

**What it does:**

- Runs knip to find unused exports
- Identifies unused dependencies
- Checks for dead code
- Validates removal safety
- Creates cleanup PR
- Estimates bundle size savings

**Options:**

- `--aggressive` - Remove more aggressively
- `--dry-run` - Preview changes only

---

### `/type-coverage-improve`

**Description:** Improve TypeScript type coverage

**Use Case:** Eliminating `any` types and improving type safety

**What it does:**

- Finds `any` types
- Suggests proper types
- Identifies missing type guards
- Updates interfaces
- Validates changes
- Generates type documentation

**Options:**

- `--file` - Target specific file
- `--threshold` - Type coverage target

---

### `/eslint-config-update`

**Description:** Update ESLint configuration based on patterns

**Use Case:** Enforcing new code patterns automatically

**What it does:**

- Reviews CODE_PATTERNS.md
- Suggests ESLint rules
- Updates .eslintrc.json
- Tests against codebase
- Identifies violations
- Creates fix PR

**Options:**

- `--add-rule` - Specific rule to add
- `--test` - Test configuration only

---

## Category 13: User Experience & Accessibility

### `/a11y-audit`

**Description:** Comprehensive accessibility audit

**Use Case:** Regular accessibility checks

**What it does:**

- Runs Lighthouse accessibility audit
- Checks ARIA labels
- Tests keyboard navigation
- Validates color contrast
- Tests screen reader compatibility
- Checks focus management
- Generates remediation plan

**Options:**

- `--page` - Specific page to audit
- `--fix` - Auto-fix issues where possible

---

### `/ux-flow-test`

**Description:** Test complete user experience flow

**Use Case:** Validating user journeys

**What it does:**

- Uses Playwright to automate flow
- Captures screenshots at each step
- Tests error scenarios
- Validates messaging
- Checks loading states
- Tests mobile responsiveness
- Generates UX report

**Options:**

- `--flow` - Flow name: `onboarding`, `daily-use`, `recovery-journey`
- `--device` - Device type: `desktop`, `mobile`, `tablet`

---

## Category 14: Emergency & Incident Response

### `/incident-start`

**Description:** Initialize incident response

**Use Case:** When production issue detected

**What it does:**

- Creates incident document
- Assembles timeline
- Checks monitoring dashboards
- Reviews recent deployments
- Creates war room channel
- Follows INCIDENT_RESPONSE.md

**Options:**

- `--severity` - Severity level: `P0`, `P1`, `P2`, `P3`
- `--description` - Brief incident description

---

### `/health-check`

**Description:** Quick health check of all systems

**Use Case:** Daily health monitoring or incident investigation

**What it does:**

- Pings Firebase services
- Checks Cloud Function status
- Reviews error rates
- Tests authentication
- Validates Firestore access
- Checks external integrations
- Generates status report

**Options:**

- `--verbose` - Detailed diagnostics
- `--alert` - Alert on issues

---

## Category 15: Firebase-Specific Tools

### `/firestore-index-suggest`

**Description:** Suggest Firestore indexes based on queries

**Use Case:** Optimizing query performance

**What it does:**

- Analyzes Firestore query code
- Identifies missing indexes
- Generates index definitions
- Updates firestore.indexes.json
- Estimates performance improvement
- Tests index creation

**Options:**

- `--file` - Analyze specific file
- `--apply` - Apply index suggestions

---

### `/function-logs-analyze`

**Description:** Analyze Cloud Function logs for patterns

**Use Case:** Performance optimization and debugging

**What it does:**

- Fetches Cloud Function logs
- Identifies slow executions
- Finds error patterns
- Analyzes cold start frequency
- Suggests optimizations
- Generates performance report

**Options:**

- `--function` - Function name to analyze
- `--since` - Time range: `1h`, `24h`, `7d`

---

## Implementation Roadmap

### Phase 1: Immediate Value (Weeks 1-2)

**Priority:** Critical workflow enhancements

1. **`/firebase-deploy-check`** - Prevent deployment issues
2. **`/pattern-violation-fix`** - Clean up 115 ESLint warnings
3. **`/test-suite-run`** - Enhanced test reporting
4. **`/security-scan-deep`** - Before App Check re-enable
5. **`/error-dashboard`** - Daily error monitoring

**Expected Impact:**

- Reduce deployment failures by 80%
- Clean up technical debt
- Improve test visibility
- Enhanced security posture

---

### Phase 2: Workflow Enhancement (Weeks 3-4)

**Priority:** Development velocity

6. **`/validate-workflow`** - End-to-end testing
7. **`/function-scaffold`** - Speed up backend development
8. **`/component-scaffold`** - Speed up frontend development
9. **`/doc-update`** - Keep docs in sync
10. **`/learning-extract`** - Capture review insights

**Expected Impact:**

- 50% faster feature development
- Documentation always current
- Better knowledge capture

---

### Phase 3: Quality & Automation (Weeks 5-6)

**Priority:** Code quality and testing

11. **`/integration-test-generate`** - Improve test coverage
12. **`/refactor-suggest`** - Code quality improvements
13. **`/performance-report`** - Regular performance monitoring
14. **`/data-audit`** - Data quality assurance
15. **`/build-analyze`** - Bundle optimization

**Expected Impact:**

- Test coverage >90%
- Better code maintainability
- Optimized performance

---

### Phase 4: Advanced Features (Weeks 7-8)

**Priority:** Production readiness

16. **`/data-migration-plan`** - Schema evolution support
17. **`/incident-start`** - Production readiness
18. **`/sonarcloud-analyze`** - Automated code quality
19. **`/ux-flow-test`** - User experience validation
20. **`/consolidate-learnings`** - Knowledge management

**Expected Impact:**

- Production-ready infrastructure
- Better incident response
- Enhanced UX validation

---

## Command Implementation Structure

Each command should follow this standard structure:

### File Location

```
.claude/commands/{category}/{command-name}.md
```

### Template Format

```markdown
---
name: command-name
description: Brief one-line description
category: category-name
options:
  - name: option1
    required: false
    default: value
    description: Option description
---

# Command: /command-name

## Overview

[Detailed description of what this command does]

## Use Cases

- Use case 1
- Use case 2
- Use case 3

## Prerequisites

- Prerequisite 1
- Prerequisite 2

## Task Instructions

### Step 1: [First Step]

[Detailed instructions]

### Step 2: [Second Step]

[Detailed instructions]

### Step 3: [Validation]

[How to validate success]

## Output Format

[Expected output structure]
```

Output example

```

## Examples

### Example 1: Basic Usage
```bash
/command-name --option1=value1
```

### Example 2: Advanced Usage

```bash
/command-name --option1=value1 --option2=value2
```

## Error Handling

Common errors and solutions:

- Error 1: Solution 1
- Error 2: Solution 2

## Related Commands

- `/related-command-1`
- `/related-command-2`

## References

- [Link to related documentation]

```

---

## Integration with Existing Infrastructure

### Leveraging Existing Tools

**Scripts Directory (`/scripts/`):**
- Many commands can leverage existing scripts
- Examples: `check-pattern-compliance.js`, `surface-lessons-learned.js`
- Create wrapper commands around proven scripts

**MCP Servers:**
- Firebase MCP for Firebase operations
- SonarCloud MCP for code quality
- GitHub MCP for repository operations
- Playwright MCP for browser testing

**Existing Commands:**
Commands can build upon existing audit commands:
- `/audit-code`
- `/audit-security`
- `/audit-performance`
- `/audit-documentation`

### Registration Process

**1. Create Command File**
```bash
# Create command file
touch .claude/commands/{category}/{command-name}.md
```

**2. Update Settings**

```json
// .claude/settings.json
{
  "commands": {
    "command-name": {
      "path": ".claude/commands/{category}/{command-name}.md",
      "category": "category-name",
      "enabled": true
    }
  }
}
```

**3. Update Command Reference**

```bash
# Add to .claude/COMMAND_REFERENCE.md
```

**4. Test Command**

```bash
# Run command to validate
/command-name --help
```

---

## Best Practices for Command Development

### Design Principles

1. **Single Responsibility**
   - Each command should do one thing well
   - Avoid feature creep
   - Compose complex workflows from simple commands

2. **Idempotent Operations**
   - Commands should be safe to run multiple times
   - Check state before making changes
   - Provide `--dry-run` options

3. **Clear Output**
   - Use structured output (tables, lists)
   - Highlight important information
   - Provide actionable next steps

4. **Error Handling**
   - Graceful degradation
   - Clear error messages
   - Suggest solutions

5. **Documentation**
   - Clear usage examples
   - Document all options
   - Link to related resources

### Testing Strategy

**Unit Testing:**

- Test individual command logic
- Mock external services
- Validate output formats

**Integration Testing:**

- Test commands with real data
- Validate side effects
- Check command composition

**User Acceptance:**

- Test with real workflows
- Gather feedback
- Iterate based on usage

---

## Maintenance and Evolution

### Monitoring Command Effectiveness

**Metrics to Track:**

- Usage frequency
- Success rate
- Time saved
- Error rate
- User feedback

**Review Cycle:**

- Monthly effectiveness review
- Quarterly optimization
- Annual deprecation review

### Command Lifecycle

**Stages:**

1. **Proposal** - Idea and use case documentation
2. **Development** - Implementation and testing
3. **Beta** - Limited rollout with feedback
4. **Active** - Full production use
5. **Deprecated** - Marked for removal
6. **Archived** - Removed but documented

### Version Control

**Semantic Versioning:**

- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

**Changelog:** Maintain changelog for each command:

```markdown
## [1.2.0] - 2026-01-15

### Added

- New --auto-fix option

### Changed

- Improved error messages

### Fixed

- Fixed edge case with empty input
```

---

## Conclusion

This comprehensive guide provides 60 custom slash commands organized into 15
categories, designed to enhance every aspect of the SoNash v0 development
workflow. The phased implementation roadmap prioritizes commands that provide
immediate value while building toward a complete development automation suite.

### Key Benefits

**Immediate:**

- Faster development cycles
- Fewer deployment issues
- Better code quality
- Enhanced security

**Long-term:**

- Knowledge capture and reuse
- Workflow optimization
- Production readiness
- Team scalability

### Next Steps

1. Review Phase 1 commands with team
2. Begin implementation of top 5 priority commands
3. Establish command testing process
4. Create command usage documentation
5. Set up effectiveness monitoring

### Support and Feedback

For questions, issues, or suggestions:

- Create GitHub issue with label `enhancement:slash-command`
- Reference this document in implementation PRs
- Update roadmap as commands are implemented

---

**Document Version:** 1.0 **Last Updated:** 2026-01-15 **Maintainer:**
Development Team **Status:** ACTIVE
