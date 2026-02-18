<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-18
**Status:** DRAFT
<!-- prettier-ignore-end -->

# Comprehensive System/Repo Test Plan

## Context

The user wants a complete system/repository test that touches **every file** in
the sonash-v0 codebase. This is not a test of the app's user-facing
functionality — it's a test of every process, system, script, tool, hook, skill,
document, and configuration file in the repo. The goal is to produce a
comprehensive report organized by domain with severity ratings, then fix all
issues found in severity-based PRs (S0/S1 first, then S2/S3).

The repo contains ~500+ non-trivial files across: Next.js app code, Firebase
Cloud Functions, 100+ automation scripts, 55 AI skills, 19 hooks, 24 agent
definitions, 40+ docs, 10 CI/CD workflows, security rules, and configuration
files.

## Decision Record (from Q&A)

| Decision            | Choice                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| Goal                | Report first, then fix everything in severity-based PRs                |
| Code analysis       | Static + logical review + runtime execution                            |
| AI tooling scope    | Equal rigor as application code                                        |
| Documentation scope | Full audit (cross-refs, accuracy, freshness, formatting, completeness) |
| Output format       | By domain, severity-sorted within each domain                          |
| Existing tools      | Hybrid: run existing tools first, add targeted new checks              |
| Runtime scope       | Dry-run only (no real external service writes)                         |
| Fix timing          | Complete full report, then fix in second pass                          |
| Scripts testing     | Full execution test (run each script with mocked/empty inputs)         |
| CI/CD testing       | Full workflow audit (YAML + references + triggers + permissions)       |
| Security rules      | Full security audit (rules + code alignment + OWASP + rate limiting)   |
| Dependencies        | Full audit (npm audit + outdated + unused + licenses + bundle)         |
| TDMS overlap        | Full reconciliation of all 2,656 existing items + new findings         |
| Noise control       | Report everything, no thresholds                                       |
| Fix delivery        | Severity-based PRs (S0/S1 first, then S2/S3)                           |
| Roadmap audit       | Full reconciliation with code reality                                  |
| MCP secrets         | Decrypt first for SonarCloud/GitHub integration                        |
| Failing tests       | Include 2 failing tests in scope, fix them                             |
| Build strictness    | Zero errors + zero warnings                                            |
| ESLint plugin       | Test custom plugin rules for correctness                               |

## Finding Format

Every finding uses:

```
### [DOMAIN-NNN] Title
- **Severity:** S0|S1|S2|S3
- **File(s):** /path/to/file
- **Description:** What is wrong
- **Evidence:** Command output or code snippet
- **Remediation:** Specific fix
- **TDMS:** DEBT-XXXX (existing) | NEW
```

## Session Plan (5 sessions)

- **Session 1:** Domains 1-5 (Environment, Build, Tests, Static Analysis,
  Dependencies)
- **Session 2:** Domains 6-8 (App Code, Cloud Functions, Security)
- **Session 3:** Domains 9-12 (Scripts, Hooks, Skills, Agents)
- **Session 4:** Domains 13-17 (CI/CD, Docs, Config, TDMS, Roadmap)
- **Session 5:** Domains 18-20 (Integration, ESLint Plugin, Final Report)

Each domain writes a checkpoint. Resume = skip completed checkpoints.

---

## DOMAIN 1: Prerequisites (~8 files)

**Goal:** Verify environment, decrypt MCP secrets, validate dependency
installation.

**Steps:**

1. Verify Node.js v22.x, npm, TypeScript 5.9.x, git
2. Verify `node_modules/` and `functions/node_modules/` exist and are current
3. Decrypt MCP secrets: `node scripts/secrets/decrypt-secrets.js`
4. Verify `.env.local` has `GITHUB_TOKEN`, `SONAR_TOKEN`, `CONTEXT7_API_KEY`
5. Audit `.env.local.example` vs `.env.local` vs `.env.production` for
   completeness
6. Verify `.env.local` is in `.gitignore`, `.env.production` has no actual
   secrets
7. Verify lockfile integrity: `npm ls --all 2>&1 | grep "missing\|invalid"`

**Key files:** `package.json`, `functions/package.json`, `.env.local.example`,
`.env.production`, `scripts/secrets/decrypt-secrets.js`

---

## DOMAIN 2: Build & Compilation (~180 files)

**Goal:** Zero errors AND zero warnings from TypeScript + Next.js build.

**Steps:**

1. `npx tsc --noEmit 2>&1` — capture all output (errors=S0, warnings=S2)
2. `npx tsc -p tsconfig.test.json && tsc-alias -p tsconfig.test.json 2>&1`
3. `cd functions && npx tsc 2>&1` — verify `functions/lib/` populated
4. `npm run build 2>&1` — full Next.js static export build
5. **Logical review of tsconfig files:**
   - Verify `tsconfig.test.json` include paths cover all test files
   - **Known S1:** `functions/package.json` says `"node": "20"` but
     `firebase.json` uses `nodejs24`
6. Review type declaration files: `next-env.d.ts`, `web-speech-api.d.ts`

**Key files:** `tsconfig.json`, `tsconfig.test.json`, `functions/tsconfig.json`,
`next.config.mjs`

---

## DOMAIN 3: Existing Test Suite (~50 files)

**Goal:** Run all tests, fix 2 failing tests, achieve 100% pass rate.

**Steps:**

1. `npm run test:build 2>&1` — compile tests to `dist-tests/`
2. `npm test 2>&1` — record individual pass/fail per test file
3. `npm run test:coverage 2>&1` — record line/function/branch coverage
4. Investigate and fix the 2 failing tests
5. **Coverage gap analysis:** Cross-reference test files vs source modules.
   Identify untested critical paths (security, auth, hooks)
6. **Test protocol audit:** Read all 27
   `.claude/test-protocols/*.protocol.json`, verify they reference valid
   component paths

**Key files:** All files in `tests/`, `tsconfig.test.json`, `dist-tests/`

---

## DOMAIN 4: Static Analysis (~300+ files)

**Goal:** Run all linters with zero errors, zero warnings.

**Steps:**

1. `npm run lint 2>&1` — ESLint full run, capture warnings
2. `cd functions && npm run lint 2>&1`
3. `npm run format:check 2>&1` — Prettier check
4. `npm run docs:lint 2>&1` — Markdown lint
5. `npm run deps:circular 2>&1` — madge circular dependency check (S1 each)
6. `npm run deps:unused 2>&1` — knip unused exports/dependencies
7. `npm run patterns:check-all 2>&1` — pattern compliance
8. `npm run validate:canon 2>&1` — CANON schema
9. `node scripts/debt/validate-schema.js 2>&1` — TDMS schema
10. `npm run audit:validate 2>&1` — audit templates
11. `npm run config:validate 2>&1` — JSON config files
12. Review knip.json `ignoreDependencies` — verify each entry is still needed

**Key files:** `eslint.config.mjs`, `.prettierrc`, `.markdownlint.json`,
`knip.json`

---

## DOMAIN 5: Dependency Health (~6 files)

**Goal:** Full dependency audit: security, outdated, unused, licenses, bundle.

**Steps:**

1. `npm audit 2>&1` (root) + `cd functions && npm audit 2>&1` —
   (Critical/High=S0/S1, Moderate=S2, Low=S3)
2. `npm outdated 2>&1` (root) + `cd functions && npm outdated 2>&1`
3. Audit `package.json` "overrides" — verify `"fast-xml-parser": "5.3.4"` is
   still needed
4. License compliance check: flag GPL/AGPL in production deps
5. Bundle size review: check heavy deps (firebase, recharts, framer-motion,
   leaflet)
6. Cross-package.json dedup: check `zod`, `typescript`, `eslint` version
   alignment between root and functions
7. Verify `@dataconnect/generated` (file: protocol) is actually imported
   somewhere
8. Check `scripts/mcp/package.json` dependencies

**Key files:** `package.json`, `package-lock.json`, `functions/package.json`

---

## DOMAIN 6: Application Code Review (~172 files)

**Goal:** Static + logical review of all app source code.

**Steps:**

1. **Component architecture review** — for each of 19 subdirs in `components/`:
   - Consistent export patterns, prop types, error boundaries, loading states
   - No hardcoded strings that should be constants
2. **lib/ module review** — each module for correctness:
   - `lib/firebase.ts`: config from env vars, not hardcoded
   - `lib/firestore-service.ts`: error handling
   - `lib/security/firestore-validation.ts`: rules match Firestore rules
   - `lib/utils/secure-caller.ts`, `rate-limiter.ts`, `callable-errors.ts`
   - `lib/auth/account-linking.ts`: edge cases
   - `lib/logger.ts`: no sensitive data leaks
3. **Hooks review** — `hooks/use-daily-quote.ts`, `use-geolocation.ts`,
   `use-journal.ts`, `use-speech-recognition.ts`
4. **Data files** — verify content accuracy: `data/glossary.ts`,
   `data/local-resources.ts` (URLs/phones current?), `data/recovery-quotes.ts`,
   `data/slogans.ts`
5. **App routes** — metadata, auth guards on admin, missing
   error.tsx/loading.tsx
6. **Cross-cutting searches:**
   - `console.log` in production code (should use logger)
   - Direct Firestore writes from client (should use Cloud Functions)
   - Hardcoded Firebase config values
   - `any` type usage

**Key files:** `components/`, `lib/`, `hooks/`, `data/`, `app/`

---

## DOMAIN 7: Cloud Functions Review (~12 files)

**Goal:** Comprehensive review of all Cloud Functions for security and
correctness.

**Steps:**

1. **Function export inventory** — parse `functions/src/index.ts`,
   cross-reference with `firebase.json`
2. **Security wrapper review** — `functions/src/security-wrapper.ts`: verify
   auth + rate limiting + App Check + validation
   - **Known S1:** App Check is TEMPORARILY DISABLED on all functions
3. **Rate limiter review** — `functions/src/firestore-rate-limiter.ts`: verify
   Firestore-based limiting logic
4. **Schema validation** — `functions/src/schemas.ts`: Zod schemas match data
   models
5. **Admin functions** — `functions/src/admin.ts`: all admin endpoints check
   admin claim
6. **Scheduled jobs** — `functions/src/jobs.ts`: schedules, error handling,
   cleanup
7. **Engine version mismatch** — `functions/package.json` says `"node": "20"`,
   `firebase.json` says `nodejs24` → **S1**
8. **reCAPTCHA + security logger** — verify no sensitive data in logs

**Key files:** `functions/src/index.ts`, `functions/src/security-wrapper.ts`,
`functions/src/admin.ts`, `functions/src/jobs.ts`, `firebase.json`

---

## DOMAIN 8: Security Audit (~15 files)

**Goal:** Full security audit: Firestore/Storage rules, OWASP top 10, headers,
rate limiting.

**Steps:**

1. **Firestore rules audit** — `firestore.rules`: every collection has explicit
   rules, write-blocked collections truly block, user subcollections require
   `isOwner(userId)`
2. **Security tests** — run `tests/security/firestore-validation.test.ts`
3. **Storage rules audit** — `storage.rules`: default deny, size limits, uid
   match
4. **Hosting headers** — `firebase.json`: verify X-Frame-Options,
   X-Content-Type-Options, HSTS, CSP
   - **Likely S1:** Missing Content-Security-Policy header
5. **OWASP Top 10 mapping** — A01 through A10 checks against codebase
6. `npm run security:check-all 2>&1`
7. **Client-side security** — verify rate-limiter.ts is defense-in-depth,
   recaptcha.ts token handling

**Key files:** `firestore.rules`, `storage.rules`, `firebase.json`,
`lib/security/`, `functions/src/security-*.ts`

---

## DOMAIN 9: Automation Scripts (~90 files)

**Goal:** Execute every script in `scripts/` and verify it runs without errors.

**Steps:** Execute scripts by category, recording exit code, stderr, runtime for
each:

1. **Documentation scripts** (8): `check-docs-light.js`, `check-doc-headers.js`,
   `check-doc-placement.js`, `check-content-accuracy.js`,
   `check-document-sync.js`, `check-cross-doc-deps.js`,
   `check-external-links.js`, `generate-documentation-index.js`
2. **Roadmap scripts** (4): `check-roadmap-health.js`,
   `check-roadmap-hygiene.js`, `phase-complete-check.js`,
   `validate-phase-completion.js`
3. **Pattern scripts** (4): `check-pattern-compliance.js`,
   `check-pattern-sync.js`, `suggest-pattern-automation.js`,
   `promote-patterns.js`
4. **Review/Learning scripts** (8): `check-review-needed.js`,
   `sync-reviews-to-jsonl.js`, `archive-reviews.js`,
   `analyze-learning-effectiveness.js`, `surface-lessons-learned.js`,
   `assign-review-tier.js`, etc.
5. **Session scripts** (5): `log-session-activity.js`, `log-override.js`,
   `check-session-gaps.js`, `cleanup-alert-sessions.js`, `session-end-commit.js`
6. **Agent/Skill scripts** (5): `check-agent-compliance.js`,
   `validate-skill-config.js`, `verify-skill-usage.js`,
   `generate-skill-registry.js`, `search-capabilities.js`
7. **Audit scripts** (11): `validate-audit.js`, `audit-health-check.js`,
   `pre-audit-check.js`, `validate-templates.js`, `generate-results-index.js`,
   `compare-audits.js`, `count-commits-since.js`, `track-resolutions.js`,
   `transform-jsonl-schema.js`, `validate-audit-integration.js`,
   `reset-audit-triggers.js`
8. **Debt/TDMS scripts** (8): `validate-schema.js`, `generate-metrics.js`,
   `generate-views.js`, `sync-roadmap-refs.js`, `check-phase-status.js`,
   `dedup-multi-pass.js`, `validate-canon-schema.js`, `normalize-canon-ids.js`
9. **Multi-AI scripts** (6): `state-manager.js`, `normalize-format.js`,
   `fix-schema.js`, `aggregate-category.js`, `extract-agent-findings.js`,
   `unify-findings.js`
10. **Security/Hook scripts** (4): `security-check.js`, `check-triggers.js`,
    `test-hooks.js`, `check-hook-health.js`
11. **Other scripts** (8): `update-readme-status.js`, `run-consolidation.js`,
    `aggregate-audit-findings.js`, `sync-claude-settings.js`, etc.
12. **Lib modules** (static review only, ~11): `sanitize-error.js`,
    `security-helpers.js`, `validate-paths.js`, etc.

**Criteria:** Crashes=S1, non-zero exit (unexpected)=S2, >10s runtime=S3

**Key files:** Everything in `scripts/`

---

## DOMAIN 10: AI Tooling — Hooks (~30 files)

**Goal:** Verify all hooks are syntactically valid, logically correct, properly
configured.

**Steps:**

1. **Settings.json registry audit** — verify every hook path in
   `.claude/settings.json` exists on disk, no orphaned hooks
2. **Syntax check every hook:** `node --check .claude/hooks/<file>.js` for all
   17 hooks + 5 lib modules + 2 global hooks
3. **Hook logic review** — deep review of critical hooks:
   - `session-start.js`: npm install, functions build, test compile, TDMS check
   - `post-write-validator.js`: security validation on writes
   - `commit-tracker.js`: git commit logging
   - `pre-compaction-save.js` / `compact-restore.js`: state preservation
4. **State files audit** — parse all `.claude/state/*.json` and `*.jsonl` for
   valid JSON
5. **Hook documentation cross-reference** — compare `.claude/HOOKS.md` vs
   `settings.json`
6. `npm run hooks:health 2>&1` + `npm run hooks:test 2>&1`

**Key files:** `.claude/settings.json`, `.claude/hooks/`, `.claude/state/`,
`.claude/HOOKS.md`

---

## DOMAIN 11: AI Tooling — Skills (~100+ files)

**Goal:** Verify all 55 skills are correctly structured, documented, functional.

**Steps:**

1. **Structure audit** — for each of 55 skill directories: verify `SKILL.md`
   exists, has required sections
2. `npm run skills:validate 2>&1`, `npm run skills:verify-usage 2>&1`,
   `npm run skills:registry 2>&1`
3. **SKILL_INDEX.md freshness** — compare against actual directories
4. **Config/registry consistency** — cross-reference
   `scripts/config/skill-config.json` and `skill-registry.json` against
   directories
5. **Deep review of complex skills** — audit-comprehensive (reference files),
   code-reviewer, markitdown, mcp-builder, pr-review, decrypt-secrets,
   webapp-testing
6. **Skill-to-script cross-reference** — verify all script references resolve

**Key files:** `.claude/skills/*/SKILL.md`, `SKILL_INDEX.md`,
`scripts/config/skill-config.json`

---

## DOMAIN 12: AI Tooling — Agents (~25 files)

**Goal:** Verify all 25 agent definitions are valid and current.

**Steps:**

1. **File structure audit** — 14 root agents + 11 global agents, verify markdown
   structure
2. `npm run agents:check 2>&1` + `npm run agents:check-strict 2>&1`
3. **Content review** — verify referenced file paths exist, instructions aren't
   contradictory
4. **GSD agents** — verify each of 11 has distinct purpose, no overlap
5. **Agent-to-skill cross-reference** — verify skill mentions exist

**Key files:** `.claude/agents/*.md`, `.claude/agents/global/*.md`

---

## DOMAIN 13: CI/CD Workflows (~13 files)

**Goal:** Full audit of all 10 GitHub Actions workflows.

**Steps:**

1. **YAML syntax validation** — parse each workflow file
2. **Workflow-by-workflow audit:**
   - `ci.yml`: verify all npm scripts exist, action SHAs are current,
     `continue-on-error` appropriate
   - `deploy-firebase.yml`: verify Firebase project, credentials cleanup,
     deprecated function list
   - `docs-lint.yml`: **S2:** uses `tj-actions/changed-files@v46` (tag, not
     SHA-pinned unlike ci.yml)
   - `sonarcloud.yml`: verify SHA-pinned actions, SONAR_TOKEN reference
   - `review-check.yml`: verify JSON parsing robustness
   - `backlog-enforcement.yml`: verify TDMS migration handling
   - `auto-label-review-tier.yml`: **S2:** has stale TODO comment about
     uncommenting script
   - `resolve-debt.yml`: verify PR body parsing security
   - `sync-readme.yml`: verify push retry logic, `--no-verify` justification
   - `validate-plan.yml`: verify narrow trigger is still relevant
3. **Action version audit** — list all `uses:` entries, verify SHA vs tag
   consistency
4. **Permissions audit** — verify least-privilege for each workflow
5. **Secret reference audit** — list all `secrets.*` and `vars.*` references
6. **PR template review** — `.github/pull_request_template.md` includes DEBT ID
   section

**Key files:** `.github/workflows/*.yml`, `.github/pull_request_template.md`

---

## DOMAIN 14: Documentation Audit (~150+ files)

**Goal:** Full doc audit: cross-refs, accuracy, freshness, formatting,
completeness.

**Steps:**

1. **Run all doc check scripts:**
   - `npm run docs:check`, `docs:headers`, `docs:sync-check`, `crossdoc:check`,
     `docs:accuracy`, `docs:placement`, `docs:lint`, `docs:external-links`
2. **Root-level docs deep review** (10 files):
   - `README.md`: badges, links, feature list vs actual code
   - `ARCHITECTURE.md`: architecture vs actual file structure
   - `DEVELOPMENT.md`: setup instructions accuracy
   - `AI_WORKFLOW.md`: workflow vs actual hooks/skills
   - `SESSION_CONTEXT.md`: current accuracy
   - `DOCUMENTATION_INDEX.md` (217KB): verify every listed doc exists
   - `claude.md`: system prompt accuracy
3. **docs/ directory deep review** (~30 files): headers, internal links, code
   examples, stale dates
4. **.claude/ docs review** (5 files): `COMMAND_REFERENCE.md`, `HOOKS.md`,
   `STATE_SCHEMA.md`, etc.
5. **Archive completeness** — verify `docs/archive/ARCHIVE_INDEX.md` lists all
   archived docs
6. **Template validation** — `docs/templates/` syntactically valid
7. **AI Review Learnings Log** (492KB): structure integrity

**Key files:** All `.md` files in root, `docs/`, `.claude/`

---

## DOMAIN 15: Configuration Audit (~30 files)

**Goal:** Verify every config file is valid, consistent, appropriate.

**Steps:**

1. **JSON validity** — parse all JSON configs
2. **package.json audit** — verify all 86 npm scripts reference existing files
3. **Firebase config** — `firebase.json` hosting matches Next.js output,
   `.firebaserc` project correct, `firestore.indexes.json` matches query
   patterns
4. **MCP config** — `.mcp.json` server commands valid, cross-check with
   `.mcp.json.example`
   - **S3:** Two MCP example files exist (`.mcp.json.example` and
     `mcp.json.example`)
5. **PR agent config** — **S2:** Two files exist (`.pr-agent.toml` and
   `.pr_agent.toml`)
6. **ESLint config** — verify ignore patterns, custom plugin loading
7. **Husky hooks** — `.husky/pre-commit` and `.husky/pre-push` are executable
8. **PWA manifest** — `public/manifest.json` icons reference existing files
9. **Other configs** — `.qodo/`, `.serena/`, `.vscode/`
10. **gitignore** — verify sensitive patterns covered

**Key files:** All config files in root

---

## DOMAIN 16: TDMS Reconciliation (~20 files)

**Goal:** Full reconciliation of all 2,656 MASTER_DEBT.jsonl items.

**Steps:**

1. `node scripts/debt/validate-schema.js 2>&1` — schema validation
2. **Status distribution** — count by status (NEW, TRIAGED, RESOLVED, etc.) and
   severity (S0-S3)
3. **ID uniqueness** — no duplicate DEBT-XXXX IDs
4. **Resolved item verification** — sample 20 RESOLVED items, verify fix exists
   in code
5. **Open S0/S1 verification** — for every open S0 and S1: verify it's a real
   current issue
6. **Views freshness** — `node scripts/debt/generate-views.js`, check for diffs
7. **Metrics freshness** — `npm run tdms:metrics`
8. **FALSE_POSITIVES.jsonl review** — verify justifications, spot-check 5
9. **LEGACY_ID_MAPPING.json** — verify old IDs map to valid current IDs
10. **Cross-reference with new findings** — as domains 1-15 produce findings,
    check against MASTER_DEBT

**Key files:** `docs/technical-debt/MASTER_DEBT.jsonl`, `FALSE_POSITIVES.jsonl`,
`LEGACY_ID_MAPPING.json`

---

## DOMAIN 17: Roadmap Reconciliation (~5 files, cross-referencing ~200+ source files)

**Goal:** Full reconciliation of ROADMAP.md with code reality.

**Steps:**

1. `npm run roadmap:validate 2>&1` + `npm run roadmap:hygiene 2>&1`
2. **Phase status verification** — for each COMPLETE phase: verify deliverables
   exist. For IN_PROGRESS: verify some work done. For NOT_STARTED: verify no
   orphaned code
3. **Feature existence** — sample 10 "COMPLETE" features, verify
   component/route/function exists
4. **DEBT-XXXX reference integrity** — every DEBT ref in ROADMAP exists in
   MASTER_DEBT
5. **ROADMAP_FUTURE.md consistency** — no duplication with ROADMAP.md
6. **ROADMAP_LOG.md** — chronological, matches git history

**Key files:** `ROADMAP.md`, `ROADMAP_FUTURE.md`, `ROADMAP_LOG.md`

---

## DOMAIN 18: Cross-System Integration (~cross-cutting)

**Goal:** Verify all systems work together.

**Steps:**

1. **Pre-commit end-to-end** — make a test change, run pre-commit, verify all 14
   checks execute
2. **CI pipeline simulation** — trace `ci.yml` step by step, verify every npm
   script works locally
3. **Hook-to-script integration** — verify every script called by pre-commit
   exists and runs
4. **MCP server integration** — verify `scripts/mcp/sonarcloud-server.js` starts
5. **Skill-to-script integration** — verify all skill-referenced scripts exist
6. **TDMS-to-CI integration** — verify `resolve-debt.yml` calls correct scripts
7. **Documentation-to-code sync** — verify automation keeps docs in sync

---

## DOMAIN 19: Custom ESLint Plugin (~4 files)

**Goal:** Verify 3 custom rules detect what they claim to detect.

**Steps:**

1. `node --check eslint-plugin-sonash/index.js` + each rule file
2. **Test `no-unguarded-file-read`** — craft code that should warn (bare
   readFileSync) and should pass (in try/catch)
3. **Test `no-stat-without-lstat`** — craft code that should warn (statSync
   without lstatSync)
4. **Test `no-toctou-file-ops`** — craft code that should warn (existsSync then
   readFileSync)
5. **Edge cases** — nested functions, async patterns, arrow functions
6. **Integration verification** — rules apply only to `scripts/**/*.js`,
   `.claude/hooks/**/*.js`, `.husky/**/*.js`

**Key files:** `eslint-plugin-sonash/index.js`,
`eslint-plugin-sonash/rules/*.js`, `eslint.config.mjs`

---

## DOMAIN 20: Final Report Compilation

**Steps:**

1. Aggregate all findings from domains 1-19 with sequential IDs (SYSAUDIT-001+)
2. Severity summary: total S0, S1, S2, S3
3. TDMS cross-reference: confirmed, resolved, new, missed
4. Domain pass/fail summary table
5. Fix priority plan for severity-based PRs

---

## Known Issues (Pre-Identified)

These will be confirmed/denied during execution:

- `functions/package.json` engine `"node": "20"` vs `firebase.json` `nodejs24` →
  S1
- 2 failing tests (to be identified and fixed) → S0
- Missing Content-Security-Policy header → S1
- App Check TEMPORARILY DISABLED → S1
- `tj-actions/changed-files` pinning inconsistency → S2
- Duplicate `.pr-agent.toml` / `.pr_agent.toml` → S2
- Duplicate MCP example files → S3
- `auto-label-review-tier.yml` stale TODO → S2

## Verification

After the report phase, verification of fixes:

1. Re-run all tools from Domains 2-5 (build, test, lint, audit)
2. Verify S0/S1 PR passes CI
3. Verify S2/S3 PR passes CI
4. Re-run TDMS reconciliation to confirm new items added correctly
5. Final `npm run build && npm test` clean run
