# Implementation Plan: Framework Migration & Sync System

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Summary

Complete migration of reusable development infrastructure from sonash-v0 into a
standalone, sanitized framework repo. Establish CANON standards, close 42
identified gaps, build upstream sync mechanism, and validate across Windows +
Linux environments. This plan produces GSD milestone "Framework Migration v1.0."

**Decisions:** See [DECISIONS.md](DECISIONS.md) (68 decisions)
**Diagnosis:** See [DIAGNOSIS.md](DIAGNOSIS.md) (42 gaps, 13 domain scorecards)
**Effort Estimate:** XL (60-100 hours across 10 phases)

---

## Phase Structure

| Phase | Name                       | Gate | Effort | Parallelizable |
| ----- | -------------------------- | ---- | ------ | -------------- |
| 0     | Foundation (CANON)         | HARD | L      | No             |
| 1     | Sanitization & Cleanup     | HARD | M      | Partial        |
| 2     | Core Systems               | SOFT | M      | Yes            |
| 3     | Migration Wave             | SOFT | M      | Yes            |
| 4     | Quality Gates              | SOFT | L      | Partial        |
| 5     | Pipeline Completion        | SOFT | L      | Yes            |
| 6     | Upstream Sync Mechanism    | HARD | XL     | No             |
| 7     | PR Ecosystem Migration     | SOFT | M      | No             |
| 8     | Health, Monitoring, Polish | SOFT | M      | Yes            |
| 9     | Final Audit & Stabilize    | HARD | M      | No             |

**Hard gates** (Phases 0, 1, 6, 9): Must pass audit before next phase.
**Soft gates**: S0 findings block, others carry as TDMS debt. Per Decision #34.

---

## Files Overview

### New Directories

1. **`CANON/`** — Standards, schemas, templates (D14, D31)
2. **`CANON/schemas/`** — Zod schema definitions (D46)
3. **`CANON/standards/`** — Convention documents (D31)
4. **`CANON/templates/`** — Doc tier templates, genesis doc (D31, D47)
5. **`metrics/`** — Aggregated cross-system metrics (D30)

### New Files (Key)

- `framework.config.json` — Unified project config (D13)
- `CANON/CANON_INDEX.md` — Human-readable index (D31)
- `CANON/schemas/base-record.schema.ts` — Universal JSONL base (D46)
- `CANON/schemas/framework-config.schema.ts` — Config validation (D51)
- `CANON/standards/SKILL_STANDARDS.md` — From skill-creator audit (D44)
- `CANON/standards/AUDIT_STANDARD.md` — Full audit taxonomy (D18)
- `CANON/standards/AGENT_STANDARD.md` — Agent requirements (D41)
- `CANON/standards/HOOK_STANDARD.md` — Hook conventions
- `CANON/standards/DOC_STANDARD.md` — Tiers + size thresholds (D15, D45)
- `CANON/standards/NAMING_CONVENTIONS.md` — All naming + folder + output (D32)
- `CANON/standards/RECOVERY_STANDARD.md` — Recovery protocol (D40)
- `CANON/standards/JSONL_STANDARD.md` — Data integrity rules (D46)
- `CANON/standards/DEPENDENCY_STANDARD.md` — Registry format (D37)
- `CANON/standards/INTERACTION_STANDARD.md` — Skill UX pattern (D51)
- `DEPENDENCY_GRAPH.jsonl` — Cross-system dependency registry (D37)
- `DEPENDENCY_GRAPH.md` — Generated view
- `FRAMEWORK_CHANGELOG.jsonl` — Improvement tracking (D47)
- `sync-manifest.jsonl` — Sync file mappings (D57)
- `sync-state.json` — Current sync state (D62)
- `sync-history.jsonl` — Sync audit trail (D62)
- `SYNC_STATUS.md` — Generated sync health view (D62)
- `scripts/sanitization/check-sanitization.js` — Automated scanner (D28)

### New Skills

- `/config` — Interactive configuration browser (D51)
- `/sync` — Upstream sync with 8-step flow (D64)
- `/export-improvements` — Reverse sync to sonash (D65)
- `/recover` — Recovery from orphaned state (D40)
- `/setup-mcp` — MCP server configuration for new projects (D42)

### Modified Files (Key)

- `framework.config.json` — Grows as each system adds its config section
- `CLAUDE.md` — Rewritten to reference CANON (D24)
- `ROADMAP.md` — Rewritten to reflect actual scope (DIAGNOSIS §2)
- `.claude/hooks/session-start.js` — Configurable manifest (D50)
- `.claude/hooks/post-write-validator.js` — Registry pattern (D39)
- `.husky/pre-commit` — Tiered wave system (D38)
- `.husky/pre-push` — Missing gates added
- All 12 existing hooks — Sanitization pass
- All 12 configs in `scripts/config/` — Sanitization pass
- `.mcp.json` — Cleaned and committed (D42)
- `.claude/settings.json` — Cleaned and committed (D43)

---

## Phase 0: Foundation (CANON & Config)

**Gate: HARD — must pass before any other phase begins.**

### Step 0.1: Outside Resource Survey

Survey available tools across 5 categories before building custom solutions.
Per Decision #22 (timeboxed early survey).

- Plugins: Claude Code community/official plugins
- MCP servers: beyond current config
- GitHub Actions: marketplace workflows
- ESLint: community rules complementing our 23
- NPM packages: tooling that could replace custom scripts

**Done when:** Survey complete, findings documented, go/no-go on each candidate.
**Depends on:** None
**Triggers:** Findings may influence subsequent steps

### Step 0.2: Create `framework.config.json`

Create the unified config file with initial sections. Per Decision #13.

```json
{
  "$schema": "./CANON/schemas/framework-config.schema.ts",
  "project": {
    "name": "framework",
    "repo": "framework"
  },
  "session": {
    "startup_scripts": []
  },
  "precommit": {
    "preset": "full",
    "waves": {}
  },
  "validators": {
    "post_write": []
  },
  "sync": {
    "upstream_repo": "jasonmichaelbell78-creator/sonash-v0",
    "source_mode": "auto",
    "staleness_threshold_days": 14,
    "staleness_threshold_files": 20
  },
  "paths": {
    "tdms": "docs/technical-debt",
    "reviews": "data/ecosystem-v2",
    "metrics": "metrics"
  }
}
```

Sections grow as each system adds its configuration.
Create `.gitignore` entries for `framework.config.local.json` and
`settings.local.json`. Per Decisions #29, #43.

**Done when:** Config file exists, validates against schema, local override
pattern documented.
**Depends on:** None
**Triggers:** None

### Step 0.3: Create CANON Directory Structure

Build `CANON/` with subdirectories. Per Decisions #14, #31.

```
CANON/
├── schemas/
│   ├── base-record.schema.ts        # D46: universal JSONL base
│   └── framework-config.schema.ts   # D51: config validation
├── standards/
│   └── (created in Step 0.4)
├── templates/
│   └── (created in Step 0.5)
└── CANON_INDEX.md
```

Create `base-record.schema.ts` with universal fields:
`id`, `timestamp`, `source`, `version`. Per Decision #46.

Create `framework-config.schema.ts` for config validation. Per Decision #51.

**Done when:** Directory exists, base schemas validate, CANON_INDEX.md lists all
contents.
**Depends on:** Step 0.2 (config schema references config file)
**Triggers:** None

### Step 0.4: Write CANON Standards Documents

Create all standards documents. Source from sonash skill-creator audit (D44),
existing conventions, and decisions from this plan.

Documents to create:

1. `SKILL_STANDARDS.md` — Per D44, from skill-creator audit
2. `AUDIT_STANDARD.md` — Per D18, full taxonomy with required components
3. `AGENT_STANDARD.md` — Per D41, agent requirements
4. `HOOK_STANDARD.md` — Hook conventions and registration
5. `DOC_STANDARD.md` — Per D15/D45, tier system + size thresholds
6. `NAMING_CONVENTIONS.md` — Per D32, all naming + folder + output locations
7. `RECOVERY_STANDARD.md` — Per D40, recovery protocol per system
8. `JSONL_STANDARD.md` — Per D46, data integrity + quarantine pattern
9. `DEPENDENCY_STANDARD.md` — Per D37, registry format + typed edges
10. `INTERACTION_STANDARD.md` — Per D51, skill UX pattern (options +
    descriptions + recommendations + pros/cons)

Each standard must reference its source decisions and follow DOC_STANDARD.md
size thresholds for AI-consumed docs.

**Done when:** All 10 standards written, internally consistent, cross-referenced
in CANON_INDEX.md.
**Depends on:** Step 0.3
**Triggers:** None

### Step 0.5: Create CANON Templates

Migrate doc tier templates from sonash + create new framework templates.
Per Decisions #15, #47.

Templates:

1. `CANONICAL.template.md` — Highest-tier doc template
2. `FOUNDATION.template.md` — Foundation-level doc
3. `PLANNING.template.md` — Planning documents
4. `REFERENCE.template.md` — Reference documentation
5. `GUIDE.template.md` — How-to guides
6. `JSONL_SCHEMA.template.md` — JSONL schema documentation
7. `PROJECT_GENESIS.template.md` — Per D47, foundational initiative template
8. `AUDIT_TEMPLATE.md` — Per GAP-01, common audit boilerplate

**Done when:** All 8 templates created, referenced in CANON_INDEX.md.
**Depends on:** Step 0.4 (templates must follow DOC_STANDARD)
**Triggers:** None

### Step 0.6: Initialize Dependency Registry

Create empty `DEPENDENCY_GRAPH.jsonl` with schema. Per Decision #37.

Record format:

```json
{
  "id": "dep-001",
  "timestamp": "2026-03-01T00:00:00Z",
  "source": "manual",
  "version": "1.0",
  "from": "skill:session-begin",
  "to": "skill:decrypt-secrets",
  "edge_type": "invokes",
  "description": "session-begin invokes decrypt-secrets for secret access"
}
```

Populate with known dependencies from DIAGNOSIS.md §D (Skill Dependency Graph).
Generate initial `DEPENDENCY_GRAPH.md` view.

**Done when:** Registry populated with known deps, MD view generates correctly.
**Depends on:** Step 0.3 (schema in CANON)
**Triggers:** None

### Step 0.7: Phase 0 Audit

Run code-reviewer agent on all new files. Verify CANON internal consistency.
Verify framework.config.json validates against schema.

**Done when:** All findings addressed or tracked as TDMS debt. HARD GATE passed.
**Depends on:** Steps 0.1–0.6
**Triggers:** Phase 1

---

## Phase 1: Sanitization & Cleanup

**Gate: HARD — framework must be clean of sonash content before building on it.**

### Step 1.1: Build Sanitization Checker

Create `scripts/sanitization/check-sanitization.js`. Per Decision #28.

Layer 1-3 automated checks:

- Regex for "sonash", "SoNash", "Sober Nashville", "sonash-v0", "sonash-app"
- Firebase project IDs, URLs, package names
- App-specific paths (`app/admin/`, `functions/src/`, etc.)
- Sonash-specific file references

Output: JSONL report of findings with file, line, layer, and suggested action.
Must be invokable as a skill or pre-commit gate. Per Decision #6.

**Done when:** Scanner finds all known Layer 1-3 references from DIAGNOSIS §5.
**Depends on:** Phase 0
**Triggers:** Step 1.2

### Step 1.2: Delete Firebase Content

Remove all Firebase-specific files, validators, configs, and references.
Per Decision #1.

- Delete 4 Firebase validators from post-write-validator.js (D39)
- Remove Firebase env vars from ci.yml
- Remove Firebase build steps from CI
- Remove Firebase patterns from ai-patterns.json
- Remove Firebase triggers from agent-triggers.json
- Remove Firebase security patterns from audit-config.json
- Remove Firestore collection references
- Remove `deploy-firebase.yml` if present

**Done when:** Sanitization checker reports zero Firebase references.
**Depends on:** Step 1.1
**Triggers:** Step 1.3

### Step 1.3: Fix Critical Sanitization (S0 Gaps)

Fix GAP-03: `normalize-file-path.js` hardcoded "sonash-v0" — read repo name
from `framework.config.json` or `package.json`.

Fix GAP-04: Post-write validator — implement configurable registry pattern.
Generalize `repositoryPatternCheck` to generic pattern validator. Per D39.

Fix GAP-15: `verified-patterns.json` — regenerate as empty/template.
Fix: `skill-registry.json` — regenerate for framework.

**Done when:** All S0 sanitization gaps resolved. Checker reports clean.
**Depends on:** Step 1.2
**Triggers:** Step 1.4

### Step 1.4: Sanitize Config Files (6 files)

Per GAP-14, sanitize:

1. `agent-triggers.json` — Remove Firebase triggers, add generic patterns
2. `ai-patterns.json` — Remove Firebase APIs, keep generic patterns
3. `audit-config.json` — Remove Firebase security patterns
4. `doc-dependencies.json` — Remove sonash app paths, add framework paths
5. `doc-generator-config.json` — Remove 30+ sonash file overrides
6. `skill-config.json` — Remove Firebase topic aliases

**Done when:** Sanitization checker reports zero findings in config files.
**Depends on:** Step 1.3
**Triggers:** Step 1.5

### Step 1.5: Sanitize Hooks & Scripts

Run sanitization checker on all migrated hooks and script libraries.
Present Layer 4-5 findings interactively per D28.

Files from DIAGNOSIS Appendix B (sanitization hotspots):

1. `session-start.js` — Remove hardcoded startup scripts
2. `compact-restore.js` — Remove sonash handoff conventions
3. `user-prompt-handler.js` — Remove hardcoded agent/skill names
4. `post-read-handler.js` — Check for sonash references
5. `check-docs-light.js` — Remove sonash skip/tier lists
6. `security-check.js` — Remove Firebase Cloud Functions checks

**Done when:** All hooks and scripts pass sanitization checker. Interactive
Layer 4-5 decisions recorded.
**Depends on:** Step 1.4
**Triggers:** Step 1.6

### Step 1.6: Phase 1 Audit

Run sanitization checker full scan. Run code-reviewer on all modified files.
Verify zero sonash/Firebase references remain.

**Done when:** Clean scan. HARD GATE passed.
**Depends on:** Steps 1.1–1.5
**Triggers:** Phase 2

---

## Phase 2: Core Systems

**Gate: SOFT — S0 blocks, others carry as TDMS debt.**

### Step 2.1: Session Ecosystem Completion

Migrate all session lifecycle components. Per Decision #16.
Reference session-ecosystem-audit skill for requirements.

- Verify session-start hook works with configurable manifest (D50)
- Verify session-begin skill loads context correctly
- Verify session-end skill saves state
- Verify compact-restore/pre-compaction-save cycle
- Migrate session velocity tracking
- Verify check-remote-session and check-mcp-servers hooks
- Add recovery detection to session-start (D40)
- Add drift detection for sync (D56, D58)
- Add plugin dedup detection (D29)

**Done when:** Full session lifecycle works. Session-ecosystem-audit passes.
**Depends on:** Phase 1
**Triggers:** Step 2.4 (ecosystem audit)

### Step 2.2: Hook System Cleanup

Apply HOOK_STANDARD.md to all 12 hooks. Per CANON standards.

- Verify each hook follows standard structure
- Document global/plugin hooks as stubs (D49)
- Implement configurable session-start manifest (D50)
- Implement validator registry in post-write-validator (D39)
- Add health-check-lite to startup manifest (D25)
- Update settings.json with clean registrations (D43)

**Done when:** All hooks pass HOOK_STANDARD compliance. Hook-ecosystem-audit
passes.
**Depends on:** Phase 1
**Triggers:** Step 2.4

### Step 2.3: Script Library Sanitization

Verify all 11 `scripts/lib/` modules are clean. Fix identified issues:

- `ai-pattern-checks.js` — Remove Firebase auth patterns
- `generate-content-hash.js` — Fix normalize-file-path defaults
- `normalize-file-path.js` — Already fixed in Step 1.3

Reference script-ecosystem-audit skill. Per Decision #17.

**Done when:** All script libs clean. Script-ecosystem-audit passes for lib/.
**Depends on:** Phase 1
**Triggers:** Step 2.4

**Steps 2.1–2.3 can run in parallel.**

### Step 2.4: Phase 2 Ecosystem Audits

Run session-ecosystem-audit, hook-ecosystem-audit, and script-ecosystem-audit
on completed systems. Per Decision #52 (incremental audits).

**Done when:** Audits pass or findings tracked as TDMS debt.
**Depends on:** Steps 2.1–2.3
**Triggers:** Phase 3

---

## Phase 3: Migration Wave

**Gate: SOFT**

### Step 3.1: Agent Migration (13 agents)

Migrate 13 missing agents from sonash. Audit all 25 for AGENT_STANDARD
compliance. Per Decisions #41, #36.

Priority order:

1. security-auditor, security-engineer (High)
2. penetration-tester, performance-engineer, test-engineer (High)
3. markdown-syntax-formatter, mcp-expert, prompt-engineer, technical-writer (Medium)
4. ui-ux-designer, nextjs-architecture-expert, react-performance-optimization (Low)

All 25 agents in sonash are generic — no sanitization needed, just compliance
audit.

**Done when:** 25 agents present and AGENT_STANDARD compliant.
**Depends on:** Phase 2
**Triggers:** None

### Step 3.2: Skill Migration (missing generic skills)

Migrate missing generic skills. Per Decisions #36, #44.

1. `task-next` — Dependency-resolved task picker
2. `quick-fix` — Strip Firebase reference, keep generic
3. `decrypt-secrets` — Generic AES-256-GCM decryption (D21)
4. `artifacts-builder` — HTML artifact builder
5. `sonarcloud` — Parameterize project key/org via framework.config.json

Audit all migrated skills against SKILL_STANDARDS.md.

**Done when:** All generic skills migrated and SKILL_STANDARDS compliant.
**Depends on:** Phase 2
**Triggers:** None

### Step 3.3: ESLint Rule Migration

Migrate `no-unguarded-loadconfig` rule. Per GAP-24.
Skip `no-test-mock-firestore` (Firebase-specific, D1).

**Done when:** 24 rules in plugin (23 existing + 1 new). All pass.
**Depends on:** Phase 2
**Triggers:** None

### Step 3.4: Documentation Templates & Infrastructure

Migrate doc ecosystem infrastructure from sonash. Per Decision #15.

- Verify CANON templates (done in Phase 0 Step 0.5)
- Migrate `doc-header-config.json` (already present, verify clean)
- Sanitize `doc-generator-config.json` (done in Phase 1 Step 1.4)
- Sanitize `doc-dependencies.json` (done in Phase 1 Step 1.4)
- Migrate `.claude/` documentation: COMMAND_REFERENCE.md, HOOKS.md,
  REQUIRED_PLUGINS.md, STATE_SCHEMA.md (GAP-23)
- Migrate `.markdownlint.json` (GAP-28)

**Done when:** Doc infrastructure complete. Doc-ecosystem-audit passes.
**Depends on:** Phase 2
**Triggers:** Step 3.6

### Step 3.5: Build `/config` Skill

Create interactive configuration browser. Per Decision #51.

- Browse any `framework.config.json` section
- Show options with descriptions, recommendations, pros/cons
- Make changes interactively
- Validate changes against Zod schema before saving
- This interaction pattern becomes the standard for all skills (D51)

**Done when:** Skill works for all config sections. Follows INTERACTION_STANDARD.
**Depends on:** Phase 2
**Triggers:** None

### Step 3.6: Build `/recover` Skill

Create recovery skill. Per Decision #40.

- Read orphaned state files in `.claude/state/`
- Present recovery options with context
- Resume interrupted operations
- Clean up completed/stale state

**Done when:** Skill recovers from simulated compaction scenarios.
**Depends on:** Phase 2
**Triggers:** None

**Steps 3.1–3.6 can run in parallel.**

### Step 3.7: Phase 3 Audit

Run skill-ecosystem-audit on new skills. Update DEPENDENCY_GRAPH.jsonl with
new relationships.

**Done when:** Audits pass or findings tracked.
**Depends on:** Steps 3.1–3.6
**Triggers:** Phase 4

---

## Phase 4: Quality Gates

**Gate: SOFT**

### Step 4.1: Pre-commit Waves 4-11

Implement missing waves with tiered preset system. Per Decisions #38, GAP-02.

| Wave | Name                    | Script Needed                  |
| ---- | ----------------------- | ------------------------------ |
| 4    | Audit S0/S1 Validation  | `validate-audit.js`            |
| 5    | CANON Schema Validation | `validate-canon.js`            |
| 6    | Skill Config Validation | `validate-skill-config.js`     |
| 7    | Cross-Doc Dependencies  | `check-cross-doc-deps.js`      |
| 8    | Doc Index Auto-update   | `generate-documentation-index` |
| 9    | Doc Header Validation   | `check-doc-headers.js`         |
| 10   | Agent Compliance        | `check-agent-compliance.js`    |
| 11   | TDMS Schema Validation  | `validate-tdms-schema.js`      |

Implement preset system in `.husky/pre-commit`:

- Read `framework.config.json` for preset level
- "starter" runs waves 1-3, "standard" 1-7, "full" 1-11
- Per-wave override for fine-grained control

Each script must be independently invokable (D6).
Add `framework.config.json` validation to wave 5 (D51).
Add sanitization check as a gate (D28).

**Done when:** All 11 waves work. Preset system toggles correctly.
**Depends on:** Phase 3 (scripts reference CANON standards)
**Triggers:** Step 4.3

### Step 4.2: Pre-push Gates Completion

Implement missing gates. Per GAP-16.

- Gate 3c: Propagation check — migrate `check-propagation.js`
- Gate 4: Security patterns diff-only — migrate `security-check.js` (sanitized)
- Gate 7: Event-based triggers — migrate trigger checker

**Done when:** All 7 pre-push gates functional.
**Depends on:** Phase 3
**Triggers:** Step 4.3

### Step 4.3: CI Workflow Overhaul

Per Decision #23. Hybrid approach.

**Keep (verify working):**

- `dependency-review.yml`
- `auto-merge-dependabot.yml`
- `codeql.yml` (update v3→v4)

**Rewrite:**

- `ci.yml` — Remove Firebase, add CANON validation, cross-platform (D33)
- `sonarcloud.yml` — Fix action, parameterize (GAP-11)
- `auto-label-review-tier.yml` — Sanitize tier patterns
- `backlog-enforcement.yml` — Sanitize thresholds

**Migrate:**

- `cleanup-branches.yml` (GAP-09)
- `pattern-compliance-audit.yml` — Weekly full scan (GAP-09)
- `resolve-debt.yml` — Auto-resolve from PR body (GAP-09)
- `sync-readme.yml` — ROADMAP → README sync (GAP-09)

**Evaluate for new:**

- Cross-platform test workflow (ubuntu + windows, D33)
- CANON validation workflow
- Sanitization check workflow

**Defer:**

- `review-check.yml` — PR ecosystem, later (D2)
- `validate-plan.yml` — PR ecosystem, later (D2)

**Done when:** All non-PR workflows functional. CI passes on both platforms.
**Depends on:** Steps 4.1, 4.2
**Triggers:** Step 4.4

**Steps 4.1 and 4.2 can run in parallel.**

### Step 4.4: Phase 4 Audit

Run full pre-commit (all 11 waves) and pre-push (all 7 gates) on the repo.
Verify CI passes on both platforms.

**Done when:** All quality gates pass.
**Depends on:** Steps 4.1–4.3
**Triggers:** Phase 5

---

## Phase 5: Pipeline Completion

**Gate: SOFT**

### Step 5.1: TDMS Pipeline Completion

Complete TDMS migration. Per Decisions #27, GAP-07/13/20.

Missing scripts to migrate:

- Sprint management: `sprint-intake.js`, `sprint-wave.js`,
  `sprint-complete.js`, `sprint-status.js`
- Resolution: `resolve-item.js`, `resolve-bulk.js`
- Extraction: `extract-scattered-debt.js`, `extract-audit-reports.js`,
  `extract-roadmap-debt.js`
- SonarCloud sync: `sync-sonarcloud.js` (parameterize project key)
- Clean intake: `clean-intake.js`
- Grand plan: `generate-grand-plan.js`

Add TDMS-specific Zod schema to CANON/schemas/ (D46).
Add TDMS metrics to local domain metrics (D30).
Wire up `/sprint` skill to migrated scripts.

**Done when:** Full TDMS pipeline functional. TDMS-ecosystem-audit passes.
**Depends on:** Phase 4 (TDMS schema validation is wave 11)
**Triggers:** Step 5.4

### Step 5.2: Audit Infrastructure Migration

Migrate audit scripts. Per GAP-17, Decision #18.

- 10 scripts in `scripts/audit/` — checkers, lib, runners
- Shared audit architecture (per AUDIT_STANDARD.md from Phase 0)
- Comprehensive-ecosystem-audit orchestrator (7 audits in 2 waves)
- Comprehensive-audit orchestrator (9 single-system audits)
- All audit skills already migrated; verify script dependencies

**Done when:** All audit types run successfully.
**Depends on:** Phase 4
**Triggers:** Step 5.4

### Step 5.3: Multi-AI Audit Migration

Migrate 6 scripts in `scripts/multi-ai/`. Per GAP-19, Decision #48.

- Sanitize all prompts — apply CANON template + config assembly pattern (D48)
- Verify multi-ai-audit skill works with sanitized prompts
- Test cross-AI consensus aggregation

**Done when:** Multi-AI audit runs with sanitized prompts.
**Depends on:** Phase 4
**Triggers:** Step 5.4

**Steps 5.1–5.3 can run in parallel.**

### Step 5.4: Standalone Script Migration

Migrate remaining non-PR standalone scripts. Per GAP-27.

Includes: `hook-analytics.js`, `check-propagation.js`,
`check-agent-compliance.js`, `log-override.js`, session velocity scripts,
review churn tracker, secrets encryption scripts.

Every script must be invokable through a procedure/skill (D6).

**Done when:** All generic standalone scripts migrated and invokable.
**Depends on:** Steps 5.1–5.3
**Triggers:** Step 5.5

### Step 5.5: Phase 5 Audit

Run TDMS-ecosystem-audit, script-ecosystem-audit (full), and comprehensive
audit infrastructure self-check (audit-health).

**Done when:** All pipeline audits pass or findings tracked.
**Depends on:** Steps 5.1–5.4
**Triggers:** Phase 6

---

## Phase 6: Upstream Sync Mechanism

**Gate: HARD — sync must work before PR migration uses it.**

### Step 6.1: Sync Manifest Bootstrap

Build manifest generator that compares both repos. Per Decision #68.

- Scan sonash via GitHub API (D59, remote is canonical)
- Scan framework local files
- Match by path/name similarity
- Generate draft `sync-manifest.jsonl`
- Present mappings interactively for confirmation (D68)
- Categorize: synced / framework-only / diverged

**Done when:** Confirmed manifest exists covering all syncable files.
**Depends on:** Phase 5
**Triggers:** Step 6.2

### Step 6.2: Drift Detection System

Build session-start drift detection. Per Decisions #56, #58.

- Store last-synced sonash commit SHA in `sync-state.json`
- Session-start: single GitHub API call to compare SHAs
- If drift detected, check staleness thresholds (D66)
- Alert: informational if under threshold, recommended action if over

**Done when:** Drift detection fires correctly at session-start.
**Depends on:** Step 6.1
**Triggers:** Step 6.3

### Step 6.3: Build `/sync` Skill

Implement the 8-step sync flow. Per Decision #64.

1. Check drift (compare SHA, show summary)
2. Show categorized changes (clean/conflict/new)
3. Auto-sanitize clean updates (Layers 1-2) via D60
4. Present conflicts one-by-one (three-way merge) via D61
5. Present new files for inclusion decision
6. Run sanitization validator on all changes (D67)
7. Show summary, confirm commit
8. Update sync-state.json, sync-history.jsonl, SYNC_STATUS.md (D62)

Support dual modes: file-diff (routine) and commit-history (major). Per D55.
Implement rollback on validation failure (D67).
Configure sonash access method per framework.config.json (D59).

**Done when:** Full sync flow works end-to-end with test data.
**Depends on:** Steps 6.1, 6.2, and sanitization checker (Step 1.1)
**Triggers:** Step 6.4

### Step 6.4: Build `/export-improvements` Skill

Implement reverse sync. Per Decision #65.

- Track framework improvements in `FRAMEWORK_CHANGELOG.jsonl` (D47)
- Generate human-readable summary of changes
- Generate machine-applicable git patch
- User chooses format based on complexity

**Done when:** Skill generates both summary and patch for a test improvement.
**Depends on:** Step 6.3
**Triggers:** Step 6.5

### Step 6.5: Phase 6 Audit

Test sync mechanism with a small known change. Verify drift detection,
sync flow, sanitization, and rollback all work. Run code-reviewer on all
sync-related code.

**Done when:** Sync mechanism proven functional. HARD GATE passed.
**Depends on:** Steps 6.1–6.4
**Triggers:** Phase 7

---

## Phase 7: PR Ecosystem Migration

**Gate: SOFT — first real test of sync mechanism.**

### Step 7.1: Sync PR Ecosystem Overhaul

Use `/sync` skill in commit-history mode (D55) to pull PR ecosystem overhaul
from sonash. PRs #398, #407, #411. Per Decision #54.

This is the first real test case for the sync mechanism.

- Run `/sync` with commit-history mode targeting the 3 PRs
- Three-stage sanitization (D60): auto L1-2, interactive L3-5, validate
- Resolve any conflicts via three-way merge (D61)
- Post-sync validation (D67)

**Done when:** PR ecosystem migrated via sync mechanism. Sync mechanism validated
in production use.
**Depends on:** Phase 6, PR #411 merged in sonash
**Triggers:** Step 7.2

### Step 7.2: Wire PR-Dependent Systems

Connect systems that were deferred pending PR work:

- Pattern promotion pipeline (D20): `promote-patterns.ts`,
  `generate-claude-antipatterns.ts`, `generate-fix-template-stubs.ts`
- `review-check.yml` CI workflow
- `validate-plan.yml` CI workflow
- `assign-review-tier.js` script
- Review-related pre-push gates

**Done when:** PR ecosystem fully integrated with pattern promotion and CI.
**Depends on:** Step 7.1
**Triggers:** Step 7.3

### Step 7.3: Phase 7 Audit

Run PR-ecosystem-audit. Verify all Zod schemas validate. Test full PR review
workflow end-to-end.

**Done when:** PR ecosystem audit passes.
**Depends on:** Steps 7.1–7.2
**Triggers:** Phase 8

---

## Phase 8: Health, Monitoring & Polish

**Gate: SOFT**

### Step 8.1: Health Monitoring System

Migrate `/alerts` skill with 36-category dashboard. Per Decision #25.

- Migrate and sanitize alerts skill
- Add persistent health history (`health-history.jsonl`, D25)
- Add lightweight session-start health check (D25)
- Integrate with metrics aggregation (D30)
- Verify `audit-health` skill works with all audit types

**Done when:** `/alerts` produces accurate dashboard. Health history tracks.
**Depends on:** Phase 7 (all systems must exist for full health check)
**Triggers:** Step 8.3

### Step 8.2: Metrics Aggregation

Build periodic aggregation from domain metrics to unified `metrics/`.
Per Decision #30.

- Define aggregation schedule (session-start or skill-invoked)
- Collect from TDMS, session, hook, script, audit, sync domains
- Generate cross-system reports
- Create `/metrics` skill or integrate into `/alerts`

**Done when:** Unified metrics view available.
**Depends on:** Phase 7
**Triggers:** Step 8.3

### Step 8.3: Rewrite CLAUDE.md

Rewrite as concise operational guide referencing CANON. Per Decision #24.

- Architecture overview (updated for actual state)
- Key commands
- Anti-patterns
- Workflow rules
- References to CANON for standards, schemas, conventions
- Keep within effective token budget

**Done when:** CLAUDE.md is concise, accurate, and references CANON correctly.
**Depends on:** Steps 8.1, 8.2 (need to know final system state)
**Triggers:** Step 8.4

### Step 8.4: Rewrite ROADMAP.md

Update to reflect actual state post-migration. Per DIAGNOSIS §2.

- Mark completed phases
- Add upstream sync milestone (separate, D35)
- Add interactive creation layer milestone (separate, D35)
- Explicit scope boundaries documented

**Done when:** ROADMAP accurately reflects project state and future direction.
**Depends on:** Step 8.3
**Triggers:** Step 8.5

### Step 8.5: Create Project Genesis Document

Fill in `CANON/templates/PROJECT_GENESIS.template.md` instance for this
project. Per Decision #47.

Captures: original vision, 26 user comments, 68 decisions, diagnosis findings,
lessons learned, guidance for future similar efforts.

**Done when:** Genesis doc complete and serves as "starting block."
**Depends on:** Step 8.4
**Triggers:** Step 8.6

**Steps 8.1 and 8.2 can run in parallel.**

### Step 8.6: MCP & Plugin Configuration

Clean and commit `.mcp.json` (D42). Create `/setup-mcp` skill.
Verify plugin dedup mechanism works (D29).

**Done when:** Both environments work out of box.
**Depends on:** Phase 7
**Triggers:** Step 8.7

### Step 8.7: Phase 8 Audit

Run doc-ecosystem-audit on updated docs. Verify health monitoring detects
real issues. Verify cross-platform config.

**Done when:** Audit passes.
**Depends on:** Steps 8.1–8.6
**Triggers:** Phase 9

---

## Phase 9: Final Audit & Stabilization

**Gate: HARD — framework must be production-ready.**

### Step 9.1: Cross-Platform Validation

Run full test matrix from DIAGNOSIS Appendix C on both platforms.
Per Decision #33.

| Test                        | Windows | Linux |
| --------------------------- | ------- | ----- |
| npm install                 | ?       | ?     |
| ESLint runs                 | ?       | ?     |
| Pre-commit hook fires (all) | ?       | ?     |
| Pre-push hook fires (all)   | ?       | ?     |
| Claude hooks fire           | ?       | ?     |
| TDMS pipeline runs          | ?       | ?     |
| State rotation works        | ?       | ?     |
| Compaction save/restore     | ?       | ?     |
| Path normalization          | ?       | ?     |
| Atomic writes               | ?       | ?     |
| Sync mechanism works        | ?       | ?     |

**Done when:** All tests pass on both platforms.
**Depends on:** Phase 8
**Triggers:** Step 9.2

### Step 9.2: Comprehensive Ecosystem Audit (Final)

Run BOTH orchestrators. Per Decision #52.

1. comprehensive-ecosystem-audit — all 7 ecosystem audits in 2 waves
2. comprehensive-audit — all 9 single-system audits

**Done when:** Both comprehensive audits pass.
**Depends on:** Step 9.1
**Triggers:** Step 9.3

### Step 9.3: Final Sanitization Scan

Run sanitization checker one final time across entire repo.
Per Decision #28.

**Done when:** Zero sonash/Firebase references. Zero Layer 4-5 ambiguities.
**Depends on:** Step 9.2
**Triggers:** Step 9.4

### Step 9.4: DEPENDENCY_GRAPH Completeness Check

Verify dependency registry covers all systems built during migration.
Generate final `DEPENDENCY_GRAPH.md`.

**Done when:** Graph is complete and accurate.
**Depends on:** Step 9.3
**Triggers:** Step 9.5

### Step 9.5: Address Findings

Fix all S0/S1 findings from Steps 9.1–9.4. Track S2/S3 as TDMS debt for
future sprints. Per Decision #34.

**Done when:** Zero S0/S1 open findings.
**Depends on:** Steps 9.1–9.4
**Triggers:** Step 9.6

### Step 9.6: Final Sign-off

Present final state to user:

- Migration completeness score (target: 95%+)
- Sanitization status (target: 100% clean)
- Cross-platform status (target: all pass)
- Open debt items (S2/S3 only)
- Updated ROADMAP.md with next milestones

**Done when:** User approves. HARD GATE passed. Milestone complete.
**Depends on:** Step 9.5
**Triggers:** GSD milestone "Framework Migration v1.0" marked complete.

---

## Post-Migration

These are NOT part of this plan — they are separate milestones per D35:

1. **Upstream Sync Milestone** — Ongoing sync cadence, sync skill refinement
2. **Interactive Creation Layer Milestone** — Own deep-plan (D5)

---

## Appendix: Decision Cross-Reference by Phase

| Phase | Key Decisions Referenced                                   |
| ----- | ---------------------------------------------------------- |
| 0     | D13, D14, D15, D18, D22, D31, D32, D37, D40, D44, D45, D46 |
| 1     | D1, D3, D6, D28, D39                                       |
| 2     | D16, D17, D25, D29, D39, D43, D49, D50                     |
| 3     | D36, D40, D41, D42, D44, D51                               |
| 4     | D23, D33, D38                                              |
| 5     | D6, D18, D27, D30, D46, D48                                |
| 6     | D4, D55, D56, D57, D58, D59, D60, D61, D62, D63, D64, D65  |
|       | D66, D67, D68                                              |
| 7     | D2, D20, D54                                               |
| 8     | D24, D25, D30, D35, D42, D47                               |
| 9     | D12, D28, D33, D34, D37, D52                               |

---

## Version History

| Version | Date       | Description                                      |
| ------- | ---------- | ------------------------------------------------ |
| 1.0     | 2026-03-01 | Initial plan — 10 phases, 39 steps, 68 decisions |
