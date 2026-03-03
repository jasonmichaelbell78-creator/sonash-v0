# Diagnosis: Framework Migration & Sync System

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Date:** 2026-03-01
**Task:** Complete migration of reusable development infrastructure from sonash-v0
into a standalone, sanitized framework repo. Establish upstream sync mechanism.
Lay foundation for future interactive project scaffolding.

---

## 1. Executive Summary

**Migration Readiness Grade: C+** (62/100)

The framework repo contains a partial skeleton (~55%) of the sonash-v0
development infrastructure. Core systems exist but are incomplete — missing
agents, skills, CI workflows, pre-commit waves, scripts, and configuration
files. What HAS been migrated has not been fully sanitized; the current repo
carries implicit sonash assumptions in configs, path references, and
tech-stack-specific patterns.

The task encompasses 4 problem domains that must be addressed in order:

1. **Gap Closure** — Complete the migration of reusable systems (agents,
   scripts, workflows, hook waves)
2. **Deep Sanitization** — Remove explicit AND implicit sonash-specific content
   across 5 identified layers
3. **Framework Parameterization** — Make configs, triggers, and paths
   project-configurable
4. **Upstream Sync Mechanism** — Establish bidirectional sync for ongoing
   improvements

**Composite Scores by Domain:**

| Domain                 | Score | Grade | Key Issue                              |
| ---------------------- | ----- | ----- | -------------------------------------- |
| Hook System            | 75    | B-    | 12/14 hooks migrated, 2 missing        |
| Skill Ecosystem        | 68    | C+    | 48/59 skills, shared standards missing |
| Agent System           | 48    | D     | 12/25 agents migrated                  |
| ESLint Plugin          | 92    | A-    | 23/25 rules, 1 generic rule missing    |
| Pre-commit/Pre-push    | 30    | F     | 3/11 pre-commit waves, 4/7 pre-push    |
| CI/CD Workflows        | 56    | D+    | 9/16 workflows, several broken         |
| Scripts Infrastructure | 45    | D     | ~50/120+ scripts migrated              |
| Configuration System   | 55    | D+    | 12/12 configs present but unsanitized  |
| TDMS Ecosystem         | 60    | C-    | Pipeline exists but gaps in scripts    |
| PR Review Ecosystem    | 55    | D+    | TypeScript ecosystem partial           |
| Documentation System   | 40    | F     | Templates, standards docs missing      |
| State Management       | 70    | B-    | Core patterns present, needs testing   |
| Cross-Platform Support | 65    | C     | Code supports both, untested on Linux  |

---

## 2. ROADMAP Alignment

**Aligned but understated.** The current ROADMAP lists the initial skeleton as
"completed" and defines 5 phases. However:

- **Phase 1 (Stabilization)** assumes migration is complete — it is not (~55%)
- **Phase 3 (Upstream Sync)** is correctly identified but underscoped — the sync
  mechanism must account for sanitization, not just file copying
- **Phase 4 (Extended Hook Waves)** lists waves 3-11 but doesn't account for the
  scripts those waves depend on
- **Missing phase**: No phase for deep sanitization or parameterization

**Recommendation:** Rewrite ROADMAP after planning to reflect actual scope.

---

## 3. Ecosystem Inventory

### 3.1 Complete System Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRAMEWORK ECOSYSTEM                          │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ LAYER 1:     │ LAYER 2:     │ LAYER 3:     │ LAYER 4:          │
│ Development  │ Quality      │ Tracking     │ Meta/Audit        │
│ Workflow     │ Gates        │ & Data       │                   │
├──────────────┼──────────────┼──────────────┼───────────────────┤
│ 12 Agents    │ Pre-commit   │ TDMS         │ 7 Ecosystem       │
│ 48 Skills    │  (11 waves)  │  Pipeline    │   Audits          │
│ 14 Hooks     │ Pre-push     │ PR Review    │ Comprehensive     │
│ 6 Hook Libs  │  (7 gates)   │  Pipeline    │   Audit           │
│ Session      │ CI Workflows │ Sprint       │ Multi-AI          │
│  Lifecycle   │  (16 total)  │  Management  │   Audit           │
│ GSD System   │ ESLint       │ Pattern      │ Alerts/Health     │
│  (11 agents) │  (25 rules)  │  Promotion   │   Dashboard       │
└──────────────┴──────────────┴──────────────┴───────────────────┘
```

### 3.2 Data Flow: End-to-End Development Lifecycle

```
SESSION START
  │
  ├─ session-start.js: deps, builds, pattern check, state rotation
  ├─ check-mcp-servers.js: verify MCP availability
  ├─ check-remote-session-context.js: detect remote branch divergence
  └─ /session-begin skill: context loading, ROADMAP check, alerts
  │
  v
DEVELOPMENT WORK
  │
  ├─ [Every file write] → post-write-validator.js (10 validators)
  │   ├─ BLOCKING: Firestore write guard, test mock guard
  │   ├─ WARN/BLOCK: S0/S1 audit quality
  │   ├─ WARNING: patterns, component size, TypeScript strict, App Check
  │   └─ SUGGEST: agent requirements, trigger enforcer
  │
  ├─ [Every bash cmd] → block-push-to-main.js + commit-tracker.js
  ├─ [Every file read] → post-read-handler.js (context tracking)
  ├─ [Every agent call] → track-agent-invocation.js
  ├─ [Every decision] → decision-save-prompt.js
  └─ [Every user msg] → user-prompt-handler.js (routing, alerts, plan mode)
  │
  v
PRE-COMMIT (11 waves)
  │
  ├─ Wave 1: ESLint + Tests (parallel)
  ├─ Wave 2: Lint-staged (Prettier)
  ├─ Wave 3: Pattern compliance
  ├─ Wave 4: Audit S0/S1 validation
  ├─ Wave 5: CANON schema validation
  ├─ Wave 6: Skill config validation
  ├─ Wave 7: Cross-document dependencies
  ├─ Wave 8: Doc index auto-update
  ├─ Wave 9: Doc header validation
  ├─ Wave 10: Agent compliance
  └─ Wave 11: TDMS schema validation
  │
  v
PR CREATION & REVIEW
  │
  ├─ auto-label-review-tier.yml → Tier 0-4 assignment
  ├─ review-check.yml → threshold-based review triggers
  ├─ External reviews (CodeRabbit, Qodo, SonarCloud, Gemini)
  ├─ /pr-review skill (10-step protocol)
  │   ├─ Step 7.5: write-review-record.ts → reviews.jsonl
  │   ├─ Step 7.5: write-deferred-items.ts → deferred-items.jsonl
  │   └─ Step 6.5: /add-debt → MASTER_DEBT.jsonl
  │
  v
PRE-PUSH (7 gates)
  │
  ├─ Gate 1: Circular dependencies
  ├─ Gate 2: Pattern compliance (diff-only)
  ├─ Gate 3b: Code-reviewer gate
  ├─ Gate 3c: Propagation check
  ├─ Gate 3d: Hook test suite
  ├─ Gate 4: Security patterns (diff-only)
  ├─ Gate 5: Type check (tsc --noEmit)
  ├─ Gate 6: Security audit (npm audit)
  └─ Gate 7: Event-based triggers
  │
  v
CI PIPELINE (16 workflows)
  │
  ├─ ci.yml: lint, typecheck, test, patterns, TDMS, coverage
  ├─ sonarcloud.yml, semgrep.yml, codeql.yml: security scanning
  ├─ backlog-enforcement.yml: S0 block, total item cap
  ├─ pattern-compliance-audit.yml: weekly full scan
  └─ docs-lint.yml, dependency-review.yml, etc.
  │
  v
POST-MERGE
  │
  ├─ resolve-debt.yml: auto-resolve DEBT-XXXX from PR body
  ├─ /pr-retro skill (6-step retrospective)
  │   ├─ write-retro-record.ts → retros.jsonl
  │   ├─ Suppression sync → .gemini/styleguide.md, .qodo/pr-agent.toml
  │   └─ /add-debt for action items
  ├─ promote-patterns.ts → CODE_PATTERNS.md + rule skeletons
  └─ sync-readme.yml: ROADMAP → README sync
  │
  v
TDMS PIPELINE (Technical Debt Management)
  │
  ├─ 6 Intake Channels:
  │   ├─ Audit intake (intake-audit.js)
  │   ├─ Manual intake (intake-manual.js)
  │   ├─ PR-deferred intake (intake-pr-deferred.js)
  │   ├─ SonarCloud sync (sync-sonarcloud.js)
  │   └─ Extraction (5 extract-*.js scripts)
  │
  ├─ Normalization (normalize-all.js)
  ├─ 6-Pass Deduplication (dedup-multi-pass.js)
  │   ├─ Pass 0: Parametric (numbers → #)
  │   ├─ Pass 1: Exact hash
  │   ├─ Pass 2: Near match (file+line±5, title >80%)
  │   ├─ Pass 3: Semantic (title >90%)
  │   ├─ Pass 4: Cross-source (SonarCloud ↔ audit)
  │   └─ Pass 5: Systemic patterns (annotate, don't merge)
  │
  ├─ View Generation → INDEX.md, by-severity.md, by-category.md, etc.
  ├─ Metrics → metrics.json, METRICS.md
  └─ Sprint Management → sprint-intake.js, sprint-wave.js, sprint-complete.js
  │
  v
ECOSYSTEM HEALTH MONITORING
  │
  ├─ /alerts skill: 36-category health dashboard
  ├─ 7 Individual Ecosystem Audits (hook, skill, TDMS, PR, script, session, doc)
  ├─ /comprehensive-ecosystem-audit: orchestrates all 7 in 2 waves
  └─ /multi-ai-audit: cross-AI consensus auditing (9-phase state machine)
```

---

## 4. System-by-System Scorecards

### 4.1 Hook System (Score: 75/100, Grade: B-)

| Component               | Sonash | Framework | Status        | Sanitization |
| ----------------------- | ------ | --------- | ------------- | ------------ |
| session-start.js        | YES    | YES       | Migrated      | NEEDED       |
| block-push-to-main      | YES    | YES       | Clean         | None         |
| check-mcp-servers       | YES    | YES       | Clean         | None         |
| check-remote-session    | YES    | YES       | Migrated      | Minor        |
| commit-tracker          | YES    | YES       | Migrated      | Minor        |
| compact-restore         | YES    | YES       | Migrated      | NEEDED       |
| decision-save-prompt    | YES    | YES       | Migrated      | Minor        |
| post-read-handler       | YES    | YES       | Migrated      | NEEDED       |
| post-write-validator    | YES    | YES       | Migrated      | HEAVY        |
| pre-compaction-save     | YES    | YES       | Migrated      | NEEDED       |
| track-agent-invoke      | YES    | YES       | Migrated      | Minor        |
| user-prompt-handler     | YES    | YES       | Migrated      | NEEDED       |
| stop-serena-dashboard   | YES    | NO        | Excluded      | N/A (skip)   |
| gsd-check-update        | YES    | NO        | Global/Plugin | N/A          |
| statusline              | YES    | NO        | Global/Plugin | N/A          |
| **lib/git-utils**       | YES    | YES       | Clean         | None         |
| **lib/inline-patterns** | YES    | YES       | Migrated      | Minor        |
| **lib/rotate-state**    | YES    | YES       | Clean         | None         |
| **lib/sanitize-input**  | YES    | YES       | Clean         | None         |
| **lib/state-utils**     | YES    | YES       | Clean         | None         |
| **lib/symlink-guard**   | YES    | YES       | Clean         | None         |

**Key Gaps:**

- post-write-validator has 10 validators; 4 are Firebase/sonash-specific
  (firestoreWriteBlock, testMockingValidator, appCheckValidator,
  repositoryPatternCheck) — need parameterization or removal
- session-start.js runs sonash-specific scripts (pattern compliance,
  consolidation, review sync, TDMS metrics) — need configurable script list
- compact-restore.js handoff schema references sonash conventions
- user-prompt-handler.js agent routing hardcodes sonash agent/skill names

### 4.2 Skill Ecosystem (Score: 68/100, Grade: C+)

**Migrated: 48 | Missing: ~11 | Total in Sonash: 59+**

| Missing Skill       | Generic? | Recommendation                                |
| ------------------- | -------- | --------------------------------------------- |
| task-next           | YES      | Migrate — dependency-resolved task picker     |
| quick-fix           | MOSTLY   | Migrate — strip Firestore pattern reference   |
| sonarcloud          | PARTIAL  | Migrate — parameterize project key/org        |
| decrypt-secrets     | YES      | Migrate — generic AES-256-GCM decryption      |
| artifacts-builder   | YES      | Migrate — HTML artifact builder for claude.ai |
| using-superpowers   | YES      | ALREADY in framework (loaded as plugin)       |
| test-suite          | NO       | Skip — sonash-specific UI routes              |
| market-research     | YES      | Deferred per ROADMAP                          |
| excel-analysis      | YES      | Deferred per ROADMAP                          |
| dev-growth-analysis | YES      | Deferred per ROADMAP                          |

**Missing Infrastructure:**

- `_shared/SKILL_STANDARDS.md` — Canonical skill structure standard (NOT migrated)
- `_shared/AUDIT_TEMPLATE.md` — Common audit boilerplate (NOT migrated)
- `skill-config.json` topics have Firebase-specific aliases
- `skill-registry.json` needs regeneration after migration

### 4.3 Agent System (Score: 48/100, Grade: D)

**Migrated: 12 | Missing: 13 | Total in Sonash: 25 (+ 11 GSD global)**

| Missing Agent                  | Generic? | Priority |
| ------------------------------ | -------- | -------- |
| markdown-syntax-formatter      | YES      | Medium   |
| mcp-expert                     | YES      | Medium   |
| penetration-tester             | YES      | High     |
| performance-engineer           | YES      | High     |
| prompt-engineer                | YES      | Medium   |
| security-auditor               | YES      | High     |
| security-engineer              | YES      | High     |
| technical-writer               | YES      | Medium   |
| test-engineer                  | YES      | High     |
| ui-ux-designer                 | YES      | Low      |
| nextjs-architecture-expert     | YES      | Low      |
| react-performance-optimization | YES      | Low      |

**All 25 agents in sonash are generic** — none contain sonash-specific content.
The 11 GSD global agents are loaded via plugin, not repo-local.

### 4.4 ESLint Plugin (Score: 92/100, Grade: A-)

**Migrated: 23 | Missing: 2 | Total in Sonash: 25**

| Missing Rule            | Generic? | Action                    |
| ----------------------- | -------- | ------------------------- |
| no-test-mock-firestore  | NO       | Skip — Firebase-specific  |
| no-unguarded-loadconfig | YES      | Migrate — generic utility |

Plugin already renamed from `eslint-plugin-sonash` to `eslint-plugin-framework`.
`ast-utils.js` helper already migrated.

### 4.5 Pre-commit / Pre-push (Score: 30/100, Grade: F)

**Pre-commit: 3/11 waves migrated**

| Wave | Name                    | Migrated | Script Dependency            |
| ---- | ----------------------- | -------- | ---------------------------- |
| 1    | ESLint + Tests          | YES      | npm run lint, npm test       |
| 2    | Lint-staged             | YES      | npx lint-staged              |
| 3    | Pattern Compliance      | YES      | check-pattern-compliance.js  |
| 4    | Audit S0/S1 Validation  | NO       | validate-audit.js            |
| 5    | CANON Schema Validation | NO       | npm run validate:canon       |
| 6    | Skill Config Validation | NO       | npm run skills:validate      |
| 7    | Cross-Doc Dependencies  | NO       | check-cross-doc-deps.js      |
| 8    | Doc Index Auto-update   | NO       | generate-documentation-index |
| 9    | Doc Header Validation   | NO       | check-doc-headers.js         |
| 10   | Agent Compliance        | NO       | check-agent-compliance.js    |
| 11   | TDMS Schema Validation  | NO       | validate-schema.js           |

**Pre-push: 4/7 gates migrated** (circular deps, type check, security audit,
code-reviewer gate) — missing propagation check, security patterns diff-only,
event-based triggers.

### 4.6 CI/CD Workflows (Score: 56/100, Grade: D+)

| Workflow                     | Migrated | Status    | Sanitization     |
| ---------------------------- | -------- | --------- | ---------------- |
| ci.yml                       | YES      | BROKEN    | HEAVY (Firebase) |
| sonarcloud.yml               | YES      | BROKEN    | NEEDED (action)  |
| semgrep.yml                  | YES      | Needs fix | Minor            |
| codeql.yml                   | YES      | Works     | Minor (v3→v4)    |
| docs-lint.yml                | YES      | Needs fix | Minor            |
| dependency-review.yml        | YES      | Works     | None             |
| auto-label-review-tier.yml   | YES      | Needs fix | NEEDED           |
| auto-merge-dependabot.yml    | YES      | Works     | None             |
| backlog-enforcement.yml      | YES      | Needs fix | NEEDED           |
| deploy-firebase.yml          | NO       | Excluded  | N/A (app-only)   |
| cleanup-branches.yml         | NO       | Missing   | None needed      |
| pattern-compliance-audit.yml | NO       | Missing   | Minor            |
| resolve-debt.yml             | NO       | Missing   | Minor            |
| review-check.yml             | NO       | Missing   | NEEDED           |
| sync-readme.yml              | NO       | Missing   | Minor            |
| validate-plan.yml            | NO       | Missing   | HEAVY            |

### 4.7 Scripts Infrastructure (Score: 45/100, Grade: D)

**scripts/lib/ — 10/10 migrated (but need sanitization check)**

| Module                | Clean? | Issue                               |
| --------------------- | ------ | ----------------------------------- |
| ai-pattern-checks.js  | NO     | Firebase auth patterns in config    |
| generate-content-hash | NO     | normalize-file-path defaults sonash |
| normalize-category    | YES    | Clean                               |
| normalize-file-path   | NO     | Hardcoded "sonash-v0" fallback      |
| read-jsonl            | YES    | Clean                               |
| safe-fs               | YES    | Clean (TDMS paths are structural)   |
| sanitize-error        | YES    | Clean                               |
| security-helpers      | YES    | Clean                               |
| validate-paths        | YES    | Clean                               |
| validate-skip-reason  | YES    | Clean                               |

**scripts/config/ — 12/12 present but sanitization needed**

| Config                 | Clean? | Issue                               |
| ---------------------- | ------ | ----------------------------------- |
| agent-triggers.json    | NO     | Firebase Cloud Functions triggers   |
| ai-patterns.json       | NO     | Firebase hallucinated APIs          |
| audit-config.json      | NO     | Firebase security file patterns     |
| audit-schema.json      | YES    | Clean                               |
| category-mappings.json | YES    | Clean                               |
| doc-dependencies.json  | NO     | Sonash app paths (admin, functions) |
| doc-generator-config   | NO     | Heavily sonash-specific categories  |
| doc-header-config      | YES    | Clean                               |
| load-config.js         | YES    | Clean                               |
| skill-config.json      | NO     | Firebase topic aliases              |
| skill-registry.json    | NO     | Auto-generated — will regenerate    |
| verified-patterns.json | NO     | Entirely sonash file paths          |

**scripts/debt/ — ~30 TDMS scripts partially migrated**
**scripts/reviews/ — TypeScript ecosystem partially migrated**
**scripts/audit/ — 10 audit scripts NOT migrated**
**scripts/multi-ai/ — 6 scripts NOT migrated**
**Standalone scripts — ~40 NOT migrated**

### 4.8 TDMS Ecosystem (Score: 60/100, Grade: C-)

The TDMS is the most complex subsystem. Sonash has 8,350 debt items across a
sophisticated 7-phase pipeline:

**What's migrated:** Core pipeline scripts (intake, dedup, views, metrics,
validate), configuration (audit-schema, category-mappings), MASTER_DEBT.jsonl
structure.

**What's missing:**

- Sprint management scripts (sprint-intake, sprint-wave, sprint-complete,
  sprint-status)
- SonarCloud sync (sync-sonarcloud.js)
- Extraction scripts (extract-scattered-debt, extract-audit-reports, etc.)
- Resolution scripts (resolve-item, resolve-bulk)
- Clean intake (clean-intake.js)
- Grand plan generation (generate-grand-plan.js)
- The resolve-debt.yml CI workflow

**Sanitization needed:** The `normalize-file-path.js` hardcodes "sonash-v0" as
the default repo name.

### 4.9 PR Review Ecosystem (Score: 55/100, Grade: D+)

**What's migrated:** Core skill files (pr-review, pr-retro, code-reviewer),
partial TypeScript ecosystem.

**What's missing:**

- Full Zod schema definitions (5 record types: Review, Retro, Deferred,
  Invocation, Warning)
- Pattern promotion pipeline (promote-patterns.ts,
  generate-claude-antipatterns.ts, generate-fix-template-stubs.ts)
- Backfill script (backfill-reviews.ts)
- The review-check.yml workflow
- The assign-review-tier.js script
- data/ecosystem-v2/ directory structure
- Completeness tier model (full/partial/stub)

---

## 5. Sanitization Complexity Analysis

### 5.1 Five Layers of Sonash-Specific Content

**Layer 1 — Explicit Name References** (easiest)

- "sonash", "SoNash", "Sober Nashville", "sonash-v0", "sonash-app"
- Firebase project IDs, URLs (`sonash-app.web.app`, `sonash-app.firebaseapp.com`)
- Package names (`eslint-plugin-sonash`)
- 47 occurrences estimated across configs and scripts

**Layer 2 — Tech-Stack Assumptions** (moderate)

- Firebase/Firestore validators in post-write-validator.js (4 of 10 validators)
- Cloud Functions path patterns (`functions/src/`)
- Next.js/React-specific checks (component size, Suspense, App Router)
- `httpsCallable` enforcement pattern
- Agent triggers for `firestore.rules` and `functions/src/*.ts`

**Layer 3 — Path References to App Structure** (moderate)

- `app/admin/`, `components/`, `lib/firestore-service.ts`
- `docs/AI_REVIEW_LEARNINGS_LOG.md`, `docs/SESSION_DECISIONS.md`
- Protected Firestore collections list
- doc-dependencies.json with app-specific trigger/dependent paths
- doc-generator-config.json with 30+ sonash-specific file overrides

**Layer 4 — Domain Terminology** (harder)

- Recovery journal concepts in test protocols
- App-specific test routes (`/notebook`, `/admin`, `/journal`, `/meetings/all`)
- Content data references (glossary, quotes, slogans)
- These are mostly in excluded skills (test-suite) and app code (not migrated)

**Layer 5 — Cross-Reference Assumptions** (hardest)

- Skills referencing other skills by sonash-specific configurations
- Audit checkers that assume specific directory structures
- PR review protocol referencing sonash-specific tools (Qodo, Gemini configs)
- Pattern promotion pipeline assuming CODE_PATTERNS.md and FIX_TEMPLATES.md
- Sprint management assuming specific file → sprint mappings
- CI workflows referencing app-specific npm scripts and build steps

### 5.2 Sanitization Strategy Matrix

| Layer | Count | Approach                                         |
| ----- | ----- | ------------------------------------------------ |
| 1     | ~47   | Find/replace + manual verification               |
| 2     | ~15   | Parameterize into config or remove validators    |
| 3     | ~25   | Move to project-level config, framework defaults |
| 4     | ~5    | Already excluded or in deferred skills           |
| 5     | ~20   | Requires understanding intent, then refactoring  |

---

## 6. Cross-Platform Considerations

The codebase must work in two environments:

| Concern          | Windows CLI (Home)        | Linux Claude Code (Work) |
| ---------------- | ------------------------- | ------------------------ |
| Shell            | Git Bash / bash           | Native bash              |
| Path separators  | Backslash (normalized)    | Forward slash            |
| Case sensitivity | Case-insensitive FS       | Case-sensitive FS        |
| npm/Node         | Windows Node              | Linux Node               |
| Git              | Git for Windows           | Native git               |
| Symlinks         | Limited support           | Full support             |
| Process mgmt     | PowerShell for PID lookup | lsof/kill                |

**Already handled in sonash:**

- `normalize-file-path.js`: `\` → `/`, Windows drive letters
- `validate-paths.js`: Cross-platform path separators
- `safe-fs.js`: EXDEV fallback for cross-drive rename
- `git-utils.js`: Case-insensitive path comparison on Windows
- `stop-serena-dashboard.js`: Full Windows/Linux branching (PowerShell vs lsof)
- `check-propagation.js`: `toPosixPath`, `toFsPath` helpers
- Pre-commit hook: POSIX sh (not bash) for Husky v9 compatibility

**Not yet verified:** Whether the framework repo's migrated hooks actually run
correctly in both environments.

---

## 7. Gap Catalog

### 7.1 Severity Definitions

- **S0 (Critical):** Blocks core framework functionality
- **S1 (High):** Significant capability missing, workaround available
- **S2 (Medium):** Nice-to-have capability missing
- **S3 (Low):** Polish, optimization, or future-proofing

### 7.2 Full Gap Catalog (42 gaps identified)

#### S0 — Critical (5 gaps)

| ID     | Gap                                          | System        |
| ------ | -------------------------------------------- | ------------- |
| GAP-01 | Shared skill standards missing               | Skills        |
|        | `_shared/SKILL_STANDARDS.md` and             |               |
|        | `_shared/AUDIT_TEMPLATE.md` not migrated.    |               |
|        | All audit skills depend on these.            |               |
| GAP-02 | Pre-commit waves 4-11 missing                | Quality Gates |
|        | Only 3 of 11 waves. Missing waves include    |               |
|        | TDMS schema validation, cross-doc deps,      |               |
|        | and doc index auto-update.                   |               |
| GAP-03 | normalize-file-path hardcodes "sonash-v0"    | Scripts       |
|        | Default repo name affects TDMS content       |               |
|        | hashing and deduplication across the system. |               |
| GAP-04 | post-write-validator has 4 Firebase-specific | Hooks         |
|        | validators without parameterization.         |               |
|        | These will block or warn incorrectly in      |               |
|        | non-Firebase projects.                       |               |
| GAP-05 | No upstream sync mechanism exists            | Sync          |
|        | No way to pull improvements from sonash      |               |
|        | without manual file-by-file comparison.      |               |

#### S1 — High (12 gaps)

| ID     | Gap                                          | System        |
| ------ | -------------------------------------------- | ------------- |
| GAP-06 | 13 agents not migrated                       | Agents        |
|        | security-auditor, test-engineer,             |               |
|        | penetration-tester, performance-engineer     |               |
|        | are high-priority generic agents.            |               |
| GAP-07 | TDMS sprint management scripts missing       | TDMS          |
|        | sprint-intake, sprint-wave, sprint-complete, |               |
|        | sprint-status — the /sprint skill depends    |               |
|        | on all of these.                             |               |
| GAP-08 | PR review TypeScript schemas incomplete      | PR Review     |
|        | 5 Zod record types (Review, Retro, Deferred  |               |
|        | Invocation, Warning) partially ported.       |               |
| GAP-09 | 7 CI workflows not migrated                  | CI/CD         |
|        | cleanup-branches, resolve-debt, review-check |               |
|        | pattern-compliance-audit, sync-readme,       |               |
|        | validate-plan.                               |               |
| GAP-10 | ci.yml broken — Firebase env vars, actions   | CI/CD         |
|        | References sonash-specific build steps,      |               |
|        | Firebase env vars, outdated action versions. |               |
| GAP-11 | sonarcloud.yml broken — wrong action         | CI/CD         |
| GAP-12 | Pattern promotion pipeline missing           | PR Review     |
|        | promote-patterns.ts, generate-claude-        |               |
|        | antipatterns.ts, generate-fix-template-      |               |
|        | stubs.ts — the review→enforcement pipeline.  |               |
| GAP-13 | Resolution scripts missing                   | TDMS          |
|        | resolve-item.js, resolve-bulk.js —           |               |
|        | the resolve-debt.yml workflow depends on.    |               |
| GAP-14 | 6 config files need sanitization             | Config        |
|        | agent-triggers, ai-patterns, audit-config,   |               |
|        | doc-dependencies, doc-generator-config,      |               |
|        | skill-config all have sonash content.        |               |
| GAP-15 | verified-patterns.json entirely sonash       | Config        |
|        | Must be regenerated (empty/template).        |               |
| GAP-16 | Pre-push gates 3c, 4, 7 missing              | Quality Gates |
|        | Propagation check, security patterns diff,   |               |
|        | event-based triggers.                        |               |
| GAP-17 | Audit infrastructure scripts missing         | Audits        |
|        | 10 scripts in scripts/audit/ not migrated.   |               |

#### S2 — Medium (15 gaps)

| ID     | Gap                                           | System    |
| ------ | --------------------------------------------- | --------- |
| GAP-18 | 5 generic skills not migrated                 | Skills    |
|        | task-next, quick-fix, decrypt-secrets,        |           |
|        | artifacts-builder, sonarcloud.                |           |
| GAP-19 | Multi-AI audit scripts missing                | Audits    |
|        | 6 scripts in scripts/multi-ai/ not ported.    |           |
| GAP-20 | TDMS extraction scripts missing               | TDMS      |
|        | extract-scattered-debt, extract-audit-        |           |
|        | reports, extract-roadmap-debt, etc.           |           |
| GAP-21 | session-start.js runs sonash-specific scripts | Hooks     |
|        | Pattern compliance, consolidation, review     |           |
|        | sync, seed commit log — need configurable     |           |
|        | startup script list.                          |           |
| GAP-22 | Documentation templates missing               | Docs      |
|        | 6 tier templates (CANONICAL, FOUNDATION,      |           |
|        | PLANNING, REFERENCE, GUIDE, JSONL_SCHEMA).    |           |
| GAP-23 | .claude/ documentation missing                | Docs      |
|        | COMMAND_REFERENCE.md, HOOKS.md,               |           |
|        | REQUIRED_PLUGINS.md, STATE_SCHEMA.md.         |           |
| GAP-24 | no-unguarded-loadconfig ESLint rule missing   | ESLint    |
| GAP-25 | assign-review-tier.js not migrated            | PR Review |
| GAP-26 | check-review-needed.js not migrated           | PR Review |
| GAP-27 | Standalone utility scripts missing            | Scripts   |
|        | hook-analytics, check-propagation,            |           |
|        | check-agent-compliance, log-override, etc.    |           |
| GAP-28 | .markdownlint.json missing                    | Config    |
| GAP-29 | knip.json needs sanitization                  | Config    |
| GAP-30 | .mcp.json.example has sonash paths            | Config    |
| GAP-31 | .env.example incomplete                       | Config    |
| GAP-32 | Ecosystem audit checker scripts need sync     | Audits    |
|        | verify each ecosystem audit's scripts/        |           |
|        | checkers/ and lib/ are migrated & clean.      |           |

#### S3 — Low (10 gaps)

| ID     | Gap                                          | System    |
| ------ | -------------------------------------------- | --------- |
| GAP-33 | SonarCloud MCP server not migrated           | MCP       |
| GAP-34 | Review backfill script not relevant          | PR Review |
|        | backfill-reviews.ts — sonash-specific data.  |           |
| GAP-35 | 3 deferred skills not migrated               | Skills    |
|        | market-research, excel-analysis, dev-growth. |           |
| GAP-36 | GSD global agents are plugin-based           | Agents    |
|        | 11 GSD agents loaded externally, not local.  |           |
| GAP-37 | Session velocity tracking not migrated       | Scripts   |
| GAP-38 | Review churn tracker not migrated            | Scripts   |
| GAP-39 | Secrets encryption scripts not migrated      | Scripts   |
| GAP-40 | doc-ecosystem-audit checkers need sync       | Audits    |
| GAP-41 | init_skill.py / package_skill.py missing     | Skills    |
| GAP-42 | search-capabilities.js missing               | Skills    |

---

## 8. Upstream Sync Analysis

### 8.1 The Problem

Sonash is "constantly being improved" — skills, hooks, scripts, and configs
evolve. The framework needs a mechanism to:

1. **Detect** when sonash has changes to framework-relevant files
2. **Diff** those changes against the framework's versions
3. **Sanitize** incoming changes (can't just copy — sonash-specific content
   may have been added)
4. **Apply** sanitized changes to the framework
5. **Validate** the framework still works after sync

### 8.2 Sync Strategy Options

| Strategy         | Pros                        | Cons                         |
| ---------------- | --------------------------- | ---------------------------- |
| Git subtree      | Native git, bidirectional   | Doesn't handle sanitization  |
| Periodic diff    | Flexible, manual review     | Labor-intensive, error-prone |
| Hash manifest    | Detects drift automatically | Doesn't apply changes        |
| npm package      | Versioned, clean interface  | Requires package publication |
| Hybrid: manifest | Best of detection + manual  | Needs tooling to build       |
| + guided sync    | review with sanitization    |                              |

### 8.3 Sync Scope

Not everything syncs. The framework has 3 file categories:

1. **Synced from sonash:** Skills, hooks, scripts, ESLint rules, CI workflows
   — these originated in sonash and should receive upstream improvements
2. **Framework-only:** CLAUDE.md, ROADMAP.md, sync tooling, parameterization
   layer, project scaffolding — these don't exist in sonash
3. **Diverged:** Files that started from sonash but have been modified for the
   framework (configs, validators with parameterization) — these need 3-way
   merge or manual review

---

## 9. Framework Parameterization Requirements

For the framework to work with ANY project (not just sonash-shaped ones), these
items need to become configurable:

| Item                       | Current State (Hardcoded)       | Target (Configurable)          |
| -------------------------- | ------------------------------- | ------------------------------ |
| Post-write validators      | 10 validators, 4 Firebase       | Validator registry in config   |
| Protected collections      | journal, daily_logs, etc.       | User-defined in config         |
| Agent triggers             | functions/src/, firestore.rules | Project-specific file patterns |
| Session startup scripts    | Hardcoded script list           | Configurable startup manifest  |
| Pre-commit waves           | Hardcoded wave list             | Configurable wave manifest     |
| TDMS doc paths             | docs/technical-debt/            | Configurable base path         |
| Review data paths          | data/ecosystem-v2/              | Configurable data directory    |
| AI pattern configs         | Firebase-specific APIs          | Project-specific pattern file  |
| Doc dependency rules       | Sonash app structure            | Project-specific dep rules     |
| Review tier file patterns  | Sonash directory structure      | Project-specific tier config   |
| Repository name default    | "sonash-v0"                     | Read from package.json/env     |
| Branch prefix for sessions | "claude/"                       | Configurable prefix            |

---

## 10. Recommendations

### Phase 0: Foundation (Effort: S — 2-4 hours)

1. Fix S0 gaps that block everything else:
   - Migrate `_shared/SKILL_STANDARDS.md` and `_shared/AUDIT_TEMPLATE.md`
   - Fix `normalize-file-path.js` hardcoded "sonash-v0"
   - Create framework parameterization config file (`framework.config.json` or
     similar) for project-specific overrides
2. Sanitize the 6 config files with explicit sonash references
3. Regenerate `verified-patterns.json` as empty/template
4. Regenerate `skill-registry.json`

### Phase 1: Agent & Skill Completion (Effort: M — 4-8 hours)

5. Migrate 13 missing agents (all generic, copy + verify)
6. Migrate 5 missing generic skills (task-next, quick-fix, decrypt-secrets,
   artifacts-builder, sonarcloud with parameterization)
7. Add missing ESLint rule (no-unguarded-loadconfig)
8. Migrate documentation templates (6 tier templates)
9. Migrate .claude/ documentation files

### Phase 2: Quality Gate Completion (Effort: L — 8-16 hours)

10. Implement pre-commit waves 4-11 with configurable enable/disable
11. Implement pre-push gates 3c, 4, 7
12. Parameterize post-write-validator (validator registry pattern)
13. Migrate standalone utility scripts (check-propagation, hook-analytics,
    check-agent-compliance, log-override, etc.)
14. Migrate audit infrastructure scripts (10 in scripts/audit/)

### Phase 3: Pipeline Completion (Effort: L — 8-16 hours)

15. Complete TDMS migration (sprint scripts, resolution scripts, extraction
    scripts, SonarCloud sync)
16. Complete PR review TypeScript ecosystem (schemas, promotion pipeline,
    write scripts)
17. Migrate multi-AI audit scripts (6 scripts)
18. Migrate 7 missing CI workflows (sanitize as you go)
19. Fix broken existing CI workflows (ci.yml, sonarcloud.yml)

### Phase 4: Upstream Sync (Effort: XL — 16-32 hours)

20. Design sync architecture (recommend: hash manifest + guided sync)
21. Build manifest generator (hashes of all synced files in both repos)
22. Build diff viewer (shows changes with sanitization warnings)
23. Build sync applier (applies changes with sanitization rules)
24. Build validation runner (tests framework after sync)
25. Document sync workflow for ongoing use

### Phase 5: Stabilization & Testing (Effort: M — 4-8 hours)

26. Run full validation suite in both environments (Windows + Linux)
27. Fix cross-platform issues discovered
28. Run comprehensive ecosystem audit
29. Address audit findings
30. Update ROADMAP.md to reflect actual state

**Total Estimated Effort: 42-84 hours across 5 phases**

---

## 11. Appendices

### A. File Counts Comparison

| Category             | Sonash | Framework | Migrated % |
| -------------------- | ------ | --------- | ---------- |
| Agents               | 25     | 12        | 48%        |
| Skills               | 59     | 48        | 81%        |
| Hooks                | 14     | 12        | 86%        |
| Hook libs            | 6      | 6         | 100%       |
| ESLint rules         | 25     | 23        | 92%        |
| Pre-commit waves     | 11     | 3         | 27%        |
| Pre-push gates       | 7      | 4         | 57%        |
| CI workflows         | 16     | 9         | 56%        |
| Scripts (lib)        | 11     | 11        | 100%       |
| Scripts (config)     | 12     | 12        | 100%       |
| Scripts (debt)       | 36     | ~20       | ~56%       |
| Scripts (reviews)    | 11     | ~6        | ~55%       |
| Scripts (audit)      | 10     | 0         | 0%         |
| Scripts (multi-ai)   | 6      | 0         | 0%         |
| Scripts (standalone) | ~40    | ~15       | ~38%       |
| Doc templates        | 6      | 0         | 0%         |

### B. Sanitization Hotspot Map

Files requiring the most sanitization work:

1. `post-write-validator.js` — 4 Firebase validators to parameterize
2. `session-start.js` — Hardcoded startup scripts, Firebase build
3. `doc-generator-config.json` — 30+ sonash file overrides
4. `doc-dependencies.json` — Sonash app paths
5. `ai-patterns.json` — Firebase hallucinated APIs
6. `agent-triggers.json` — Firebase triggers
7. `check-docs-light.js` — Sonash skip lists and tier file lists
8. `security-check.js` — Firebase Cloud Functions checks
9. `audit-config.json` — Firebase security file patterns
10. `ci.yml` — Firebase env vars and build steps

### C. Cross-Platform Test Matrix

| Test                          | Windows | Linux | Status   |
| ----------------------------- | ------- | ----- | -------- |
| npm install                   | ?       | ?     | Untested |
| ESLint runs                   | ?       | ?     | Untested |
| Pre-commit hook fires         | ?       | ?     | Untested |
| Pre-push hook fires           | ?       | ?     | Untested |
| Hooks fire on Claude events   | ?       | ?     | Untested |
| TDMS pipeline runs            | ?       | ?     | Untested |
| State rotation works          | ?       | ?     | Untested |
| Compaction save/restore works | ?       | ?     | Untested |
| Path normalization correct    | ?       | ?     | Untested |
| Atomic writes succeed         | ?       | ?     | Untested |

### D. Skill Dependency Graph (Key Chains)

```
/session-begin → /decrypt-secrets → /alerts → [work]
/comprehensive-ecosystem-audit → 7× /X-ecosystem-audit → /add-debt
/pr-review → /add-debt → MASTER_DEBT.jsonl
/pr-retro → /add-debt, promote-patterns.ts → CODE_PATTERNS.md
/sprint → sprint-intake → sprint-wave → sprint-complete
/sonarcloud → /decrypt-secrets → /verify-technical-debt → /add-debt
/skill-creator → /skill-audit
/using-superpowers → [any skill via Skill tool]
```

---

## Version History

| Version | Date       | Description                                             |
| ------- | ---------- | ------------------------------------------------------- |
| 1.0     | 2026-03-01 | Initial diagnosis draft                                 |
| 2.0     | 2026-03-01 | Comprehensive rewrite — 13 domains, 42 gaps, scorecards |
