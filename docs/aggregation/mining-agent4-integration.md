# Mining Agent 4: Integration & Automation

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-27
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Date:** 2026-02-27 **Scope:** Session hooks, pre-commit/pre-push gates,
override audit trail, agent invocation tracking, SonarCloud integration,
Qodo/Gemini config, workflow test inventory, review-related skills inventory.

---

## 1. Session Hooks

### 1.1 All Hook Files (`.claude/hooks/`)

| File                              | Purpose                                                                               | Review-Related?                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `session-start.js`                | Install deps, build, pattern compliance, consolidation, review sync, archive rotation | **Yes** — runs `reviews:sync --apply`, rotates `reviews.jsonl`, pattern compliance |
| `track-agent-invocation.js`       | PostToolUse hook for Task tool — logs agent type + timestamp                          | **Yes** — tracks code-reviewer invocations                                         |
| `commit-tracker.js`               | PostToolUse hook for Bash — logs git commits to JSONL                                 | Indirect — enables session gap detection                                           |
| `post-write-validator.js`         | Consolidated PostToolUse for Write/Edit/MultiEdit — 10 validators                     | **Yes** — agent trigger enforcer suggests code-reviewer                            |
| `user-prompt-handler.js`          | UserPromptSubmit hook — parses user prompts                                           | Indirect — detects skill invocations                                               |
| `decision-save-prompt.js`         | PostToolUse for AskUserQuestion                                                       | No                                                                                 |
| `post-read-handler.js`            | PostToolUse for Read                                                                  | No                                                                                 |
| `pre-compaction-save.js`          | PreCompact hook — saves state before compaction                                       | Indirect                                                                           |
| `compact-restore.js`              | SessionStart (compact matcher) — restores state after compaction                      | Indirect                                                                           |
| `check-mcp-servers.js`            | SessionStart — checks MCP server availability                                         | No                                                                                 |
| `check-remote-session-context.js` | SessionStart — checks remote branches                                                 | No                                                                                 |
| `stop-serena-dashboard.js`        | SessionStart — kills port 24282                                                       | No                                                                                 |
| `state-utils.js`                  | Shared utilities                                                                      | N/A (library)                                                                      |

**Backup directory:** `.claude/hooks/backup/` (exists but not enumerated)
**Library directory:** `.claude/hooks/lib/` (symlink-guard, sanitize-input,
rotate-state, git-utils)

### 1.2 Hook Registration (`.claude/settings.json`)

| Event                           | Hook(s)                                                                                                                       | Count  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ |
| `SessionStart` (default)        | session-start.js, check-mcp-servers.js, check-remote-session-context.js, stop-serena-dashboard.js, global/gsd-check-update.js | 5      |
| `SessionStart` (compact)        | compact-restore.js                                                                                                            | 1      |
| `PreCompact`                    | pre-compaction-save.js                                                                                                        | 1      |
| `PostToolUse` (Write)           | post-write-validator.js                                                                                                       | 1      |
| `PostToolUse` (Edit)            | post-write-validator.js                                                                                                       | 1      |
| `PostToolUse` (MultiEdit)       | post-write-validator.js                                                                                                       | 1      |
| `PostToolUse` (Read)            | post-read-handler.js                                                                                                          | 1      |
| `PostToolUse` (AskUserQuestion) | decision-save-prompt.js                                                                                                       | 1      |
| `PostToolUse` (Bash)            | commit-tracker.js                                                                                                             | 1      |
| `PostToolUse` (Task)            | track-agent-invocation.js                                                                                                     | 1      |
| `UserPromptSubmit`              | user-prompt-handler.js                                                                                                        | 1      |
| `Notification`                  | global/statusline.js                                                                                                          | 1      |
| **Total registered hooks**      |                                                                                                                               | **16** |

### 1.3 Session-Start Review Automation

The `session-start.js` hook automatically:

1. Runs `npm run reviews:sync -- --apply` (syncs markdown reviews to JSONL)
2. Rotates `reviews.jsonl` when it exceeds 50 entries (archive threshold)
3. Re-syncs after rotation to prevent data loss (PEA-501)
4. Runs `node scripts/check-pattern-compliance.js` (pattern gate)
5. Runs consolidation (`run-consolidation.js --auto`)

---

## 2. Pre-Commit Gates

### 2.1 Gate Inventory (`.husky/pre-commit`)

| #               | Gate                                                         | Type                                         | Skippable? | Skip Key     |
| --------------- | ------------------------------------------------------------ | -------------------------------------------- | ---------- | ------------ |
| 1a              | ESLint (`npm run lint`)                                      | **BLOCKING**                                 | No         | —            |
| 1b              | Tests (`npm test`)                                           | **BLOCKING**                                 | Yes        | `tests`      |
| 2               | lint-staged (Prettier auto-format)                           | **BLOCKING**                                 | No         | —            |
| 3               | Pattern compliance (`check-pattern-compliance.js --staged`)  | **BLOCKING**                                 | Yes        | `patterns`   |
| 4               | Audit S0/S1 validation (`validate-audit.js --strict-s0s1`)   | **BLOCKING**                                 | Yes        | `audit`      |
| 5               | CANON schema validation (`validate:canon`)                   | Warning                                      | No         | —            |
| 6               | Skill configuration validation (`skills:validate`)           | Warning                                      | No         | —            |
| 7               | Cross-document dependency check (`check-cross-doc-deps.js`)  | **BLOCKING**                                 | Yes        | `cross-doc`  |
| 8               | Documentation index auto-update (`docs:index`)               | Auto-fix                                     | Yes        | `doc-index`  |
| 9               | Document header validation (new docs)                        | **BLOCKING**                                 | Yes        | `doc-header` |
| 10              | Agent compliance check (`check-agent-compliance.js`)         | Warning (blocking with `STRICT_AGENT_CHECK`) | No         | —            |
| 11              | Technical debt schema validation (`debt/validate-schema.js`) | **BLOCKING**                                 | Yes        | `debt`       |
| **Total gates** |                                                              |                                              | **11**     |              |

**Blocking gates:** 7 (ESLint, tests, lint-staged, patterns, audit S0/S1,
cross-doc, doc-header, debt schema) **Warning/auto-fix gates:** 4 (CANON, skill
config, doc index, agent compliance) **Review-pipeline-touching gates:** 5
(pattern compliance, audit S0/S1, CANON validation, agent compliance, cross-doc)

### 2.2 Pre-Push Gates (`.husky/pre-push`)

| #               | Gate                                  | Type                                            | Review-Related?                          |
| --------------- | ------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| 1               | Circular dependency check             | **BLOCKING**                                    | No                                       |
| 2               | Pattern compliance (push diff only)   | Warning                                         | **Yes**                                  |
| 3a              | Code-reviewer gate for script changes | **BLOCKING** (bypassable with SKIP_REVIEWER)    | **Yes** — checks agent-invocations.jsonl |
| 3b              | Propagation check                     | **BLOCKING** (bypassable with SKIP_PROPAGATION) | **Yes**                                  |
| 3c              | Hook test suite (when hooks changed)  | **BLOCKING**                                    | Indirect                                 |
| 4               | Security pattern check (diff-only)    | **BLOCKING**                                    | Indirect                                 |
| 5               | Type check (`tsc --noEmit`)           | **BLOCKING**                                    | No                                       |
| 6               | Security audit (`npm audit`)          | Warning                                         | No                                       |
| 7               | Event-based trigger checker           | **BLOCKING** for security, Warning for others   | **Yes**                                  |
| **Total gates** |                                       | **9**                                           |                                          |

**Key integration point:** Gate 3a checks
`.claude/state/agent-invocations.jsonl` to verify code-reviewer was invoked
before allowing script pushes. This is the primary enforcement mechanism tying
the agent invocation tracker to the commit pipeline.

### 2.3 Skip Override Architecture

All skips require:

- `SKIP_CHECKS="check1,check2"` consolidated variable
- `SKIP_REASON="meaningful reason"` (mandatory, 10-500 chars, single line, no
  control chars)
- Backward compat: individual `SKIP_PATTERN_CHECK=1` etc. mapped to
  `SKIP_CHECKS`
- Overrides logged via `scripts/log-override.js`

---

## 3. Hook Override Audit

### 3.1 Override Log Location

File: `.claude/override-log.jsonl` (131 entries total)

### 3.2 Override Frequency by Check Type

| Check                | Count   | % of Total |
| -------------------- | ------- | ---------- |
| `cross-doc-deps`     | 36      | 27.5%      |
| `cross-doc`          | 28      | 21.4%      |
| `pattern-compliance` | 21      | 16.0%      |
| `audit-s0s1`         | 20      | 15.3%      |
| `triggers`           | 8       | 6.1%       |
| `reviewer`           | 6       | 4.6%       |
| `doc-index`          | 6       | 4.6%       |
| `doc-header`         | 6       | 4.6%       |
| **Total**            | **131** | **100%**   |

### 3.3 Override Reason Patterns

Common reasons observed (sample):

- "Sprint 2 mechanical refactoring only — no auth logic changes"
- "PR review fixes only"
- "Hook/skill changes are internal logging additions"
- "Automated session-end commit"
- "PR #394 R12 — pre-existing triggers not related to this PR"

**Finding:** Cross-doc deps and cross-doc account for 48.9% of all overrides.
This suggests the cross-document dependency system generates high friction
relative to value, or the checks fire too broadly.

**Finding:** 6 code-reviewer overrides (4.6%) — the reviewer gate is rarely
bypassed, suggesting it is well-calibrated.

---

## 4. Agent Invocation Tracking

### 4.1 Tracking Mechanism

- **Hook:** `track-agent-invocation.js` (PostToolUse for Task tool)
- **Session state:** `.claude/hooks/.session-agents.json` (reset per session)
- **Persistent log:** `.claude/state/agent-invocations.jsonl` (append-only,
  rotated at 64KB)
- **Invocation cap:** 200 per session (array sliced)
- **Data sanitized:** Descriptions truncated to 100 chars,
  tokens/emails/sensitive keywords redacted

### 4.2 Agent Invocation Frequency (current JSONL, 16 entries)

| Agent           | Count  | %        |
| --------------- | ------ | -------- |
| `code-reviewer` | 8      | 50%      |
| `Explore`       | 8      | 50%      |
| **Total**       | **16** | **100%** |

**Finding:** Only `code-reviewer` and `Explore` agents appear in the tracked
invocations. No `pr-review` agent invocations are tracked — the `pr-review`
skill is invoked via `/pr-review` (UserPromptSubmit), not the Task tool, so it
bypasses this tracker entirely.

**Finding:** The pre-push gate (3a) checks for `"code-reviewer"` in
agent-invocations.jsonl. Since pr-review uses a different invocation path, the
gate only validates code-reviewer usage, not pr-review usage.

### 4.3 Session-End Compliance Review

The session-end skill (`.claude/skills/session-end/SKILL.md` Section 4)
requires:

1. Compare `agentsInvoked` from `.session-agents.json` against
   `.agent-trigger-state.json`
2. Report gaps (suggested but never invoked)
3. Check `pending-reviews.json` for queued but unexecuted reviews

---

## 5. SonarCloud Integration

### 5.1 Analysis Pipeline

| Component      | Location                                  | Purpose                                                     |
| -------------- | ----------------------------------------- | ----------------------------------------------------------- |
| GitHub Action  | `.github/workflows/sonarcloud.yml`        | Runs SonarCloud analysis on push/PR to main                 |
| Project config | `sonar-project.properties`                | Project key, exclusions, false-positive suppressions        |
| Sync script    | `scripts/debt/sync-sonarcloud.js`         | Fetches SonarCloud issues + hotspots into MASTER_DEBT.jsonl |
| SonarCloud MCP | `.claude/settings.local.json` (reference) | MCP tools for querying SonarCloud directly                  |
| Skill          | `.claude/skills/sonarcloud/SKILL.md`      | Guided SonarCloud interaction                               |

### 5.2 Data Flow: SonarCloud -> Review Pipeline

```
SonarCloud API
  |
  v
sync-sonarcloud.js (CLI: --dry-run, --resolve, --full)
  |-- Fetches issues (paginated, up to 10K)
  |-- Fetches security hotspots (separate API)
  |-- Deduplicates by sonar_key + content_hash
  |-- Maps severity: BLOCKER/CRITICAL -> S0, MAJOR -> S1, MINOR -> S2, INFO -> S3
  |-- Post-intake correction: cognitive complexity BLOCKER -> S1 (not S0)
  |-- Appends to MASTER_DEBT.jsonl + raw/deduped.jsonl
  |-- Logs to logs/intake-log.jsonl
  |-- Regenerates views (generate-views.js)
  |
  v (--resolve or --full)
  |-- Fetches active keys from SonarCloud
  |-- Marks stale items as RESOLVED in MASTER_DEBT.jsonl
  |-- Logs to logs/resolution-log.jsonl
```

### 5.3 SonarCloud Project Configuration

- **Project key:** `jasonmichaelbell78-creator_sonash-v0`
- **Organization:** `jasonmichaelbell78-creator`
- **False-positive suppressions:** 5 multicriteria rules (console in functions,
  env vars, test passwords, migration scripts, dev scripts)
- **Duplication exclusions:** generated files, config files
- **Baseline (2026-01-13):** 778 issues
- **Quality gate:** No new critical/blocker, gradual reduction of major

### 5.4 SonarCloud MCP Integration

SonarCloud MCP tools are available (referenced in
`.claude/settings.local.json`). Available MCP tools include:

- `sonarcloud__get_issues`
- `sonarcloud__get_quality_gate`
- `sonarcloud__get_security_hotspots`
- `sonarcloud__get_hotspot_details`

These allow direct querying from within Claude Code sessions without running the
CLI sync script.

---

## 6. Qodo/Gemini Configuration

### 6.1 Qodo PR-Agent Configuration

File: `.qodo/pr-agent.toml`

**Suppression rules (8 items in `[pr_reviewer]`):**

| #   | Suppressed Pattern                                   | Evidence                            |
| --- | ---------------------------------------------------- | ----------------------------------- |
| 1   | "Missing actor context" in JSON output               | PRs #370-#371, 5+ rounds            |
| 2   | "Unstructured console logs" in CLI scripts           | PRs #370-#371, tracked as DEBT-0455 |
| 3   | Data quality issues in JSONL pipeline output         | ~100 rejections PRs #366-#371       |
| 4   | "Sensitive log persistence" for override audit trail | PR #368 R3-R6                       |
| 5   | "Silent parse errors" in JSONL parsing               | PRs #371 R1+R2                      |
| 6   | "Absolute path leakage" in TDMS data files           | PR #371 R2                          |
| 7   | "Missing actor/outcome" in intake logs               | PR #379, 5+ rounds                  |
| 8   | Date/RegExp/Map/Set/BigInt in JSON.parse output      | PR #379, 5 rounds R3-R7             |

**Suppression rules (4 items in `[pr_code_suggestions]`):**

| #   | Suppressed Pattern                                 |
| --- | -------------------------------------------------- |
| 1   | Placeholder titles in JSONL pipeline output        |
| 2   | Recomputing content_hash values                    |
| 3   | Adding line numbers to directory-level file fields |
| 4   | Date/RegExp/Map/Set/BigInt in JSON.parse code      |

**Compliance checker suppressions (7 items in `[pr_compliance_checker]`):**

| #   | Suppressed Pattern                                 | Evidence                  |
| --- | -------------------------------------------------- | ------------------------- |
| 1   | "Swallowed parse errors" in JSONL code             | PRs #371                  |
| 2   | "Missing audit context" in CLI tools               | —                         |
| 3   | "Unstructured logging" in CLI scripts              | DEBT-0455                 |
| 4   | "Absolute path leakage" in TDMS files              | —                         |
| 5   | "Raw error details" in dev scripts                 | PR #382 R3                |
| 6   | TOCTOU in single-user CLI scripts                  | PRs #395-#396, 6+ rounds  |
| 7   | S4036 PATH Binary Hijacking for hardcoded binaries | PRs #392-#396, 10+ rounds |

**Total Qodo suppression rules: 19** across 3 sections.

### 6.2 Gemini Configuration

- No `.gemini/` directory or dedicated config file found in the repository
- Gemini review is likely configured at the GitHub repository settings level
  (not in-repo)
- Evidence of Gemini reviews referenced in commit messages and hook comments
  (e.g., "Gemini review #379" in pre-commit hook)

---

## 7. Workflow Test Inventory

### 7.1 GitHub Actions Workflows

| Workflow                     | File                           | Review-Related?                                    |
| ---------------------------- | ------------------------------ | -------------------------------------------------- |
| CI                           | `ci.yml`                       | Indirect — runs tests, lint                        |
| SonarCloud analysis          | `sonarcloud.yml`               | **Yes** — triggers SonarCloud scan                 |
| Review Trigger Check         | `review-check.yml`             | **Yes** — checks review thresholds, comments on PR |
| Auto-Label Review Tier       | `auto-label-review-tier.yml`   | **Yes** — assigns tier-0 through tier-4 labels     |
| Pattern Compliance Audit     | `pattern-compliance-audit.yml` | **Yes** — pattern enforcement                      |
| Docs Lint                    | `docs-lint.yml`                | Indirect                                           |
| Deploy Firebase              | `deploy-firebase.yml`          | No                                                 |
| Backlog Enforcement          | `backlog-enforcement.yml`      | Indirect                                           |
| Resolve Debt                 | `resolve-debt.yml`             | Indirect                                           |
| Semgrep                      | `semgrep.yml`                  | Indirect (security)                                |
| Sync README                  | `sync-readme.yml`              | No                                                 |
| Validate Plan                | `validate-plan.yml`            | No                                                 |
| **Total workflows**          |                                | **12**                                             |
| **Review-related workflows** |                                | **4**                                              |

### 7.2 Test Files Covering Review Pipeline

#### Project test files (`tests/`)

| Test File                                       | Covers                                      |
| ----------------------------------------------- | ------------------------------------------- |
| `tests/scripts/validate-audit-s0s1.test.ts`     | Audit S0/S1 validation (pre-commit gate #4) |
| `tests/scripts/pattern-compliance.test.ts`      | Pattern compliance (pre-commit gate #3)     |
| `tests/pattern-compliance.test.js`              | Pattern compliance (duplicate/alt)          |
| `tests/scripts/surface-lessons-learned.test.ts` | Lessons learned surfacing                   |
| `tests/scripts/verified-patterns.test.ts`       | Verified patterns system                    |
| `tests/scripts/safe-fs.test.ts`                 | safe-fs library (used by sync-sonarcloud)   |
| `tests/eslint-plugin-sonash.test.js`            | Custom ESLint plugin                        |
| `tests/scripts/check-docs-light.test.ts`        | Docs checking                               |
| `tests/scripts/update-readme-status.test.ts`    | README status updates                       |
| `tests/scripts/phase-complete-check.test.ts`    | Phase completion checks                     |

#### Hook-specific tests

| Test File                                                                          | Covers                    |
| ---------------------------------------------------------------------------------- | ------------------------- |
| `.claude/skills/hook-ecosystem-audit/scripts/__tests__/checker-regression.test.js` | Hook ecosystem regression |

### 7.3 Test Coverage Gaps

| Component                          | Has Tests? | Notes                                            |
| ---------------------------------- | ---------- | ------------------------------------------------ |
| `check-pattern-compliance.js`      | **Yes**    | 2 test files                                     |
| `validate-audit.js` (S0/S1)        | **Yes**    | 1 test file                                      |
| `safe-fs.js`                       | **Yes**    | 1 test file                                      |
| `sync-sonarcloud.js`               | **No**     | No dedicated test file                           |
| `check-cross-doc-deps.js`          | **No**     | No test — yet it is overridden 48.9% of the time |
| `check-agent-compliance.js`        | **No**     | No test                                          |
| `check-review-needed.js`           | **No**     | No test (drives review-check.yml workflow)       |
| `assign-review-tier.js`            | **No**     | No test (drives auto-label workflow)             |
| `log-override.js`                  | **No**     | No test                                          |
| `check-propagation.js`             | **No**     | No test (pre-push gate 3b)                       |
| `session-start.js` (hook)          | **No**     | No test                                          |
| `track-agent-invocation.js` (hook) | **No**     | No test                                          |
| `post-write-validator.js` (hook)   | **No**     | No test (validates 10 sub-checks)                |
| `commit-tracker.js` (hook)         | **No**     | No test                                          |

**Finding:** 10 of 14 review-pipeline-critical scripts/hooks have **no dedicated
tests**. Only pattern-compliance and audit S0/S1 validation have test coverage.

---

## 8. Review-Related Skills Inventory

| Skill                            | Directory                                        | Purpose                                                                                                   |
| -------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `code-reviewer`                  | `.claude/skills/code-reviewer/`                  | Post-implementation code review agent. Has `references/` and `scripts/` subdirs.                          |
| `pr-review`                      | `.claude/skills/pr-review/`                      | Handles external PR review feedback (Qodo, CodeRabbit, Gemini). Has `reference/` subdir and `ARCHIVE.md`. |
| `pr-retro`                       | `.claude/skills/pr-retro/`                       | Post-merge retrospective analysis. Has `ARCHIVE.md`.                                                      |
| `pr-ecosystem-audit`             | `.claude/skills/pr-ecosystem-audit/`             | Audits the PR review ecosystem. Has `scripts/` subdir.                                                    |
| `multi-ai-audit`                 | `.claude/skills/multi-ai-audit/`                 | Multi-AI review orchestration. Has `templates.md`.                                                        |
| `sonarcloud`                     | `.claude/skills/sonarcloud/`                     | SonarCloud interaction guide.                                                                             |
| `test-suite`                     | `.claude/skills/test-suite/`                     | Test execution with protocol support.                                                                     |
| `audit-code`                     | `.claude/skills/audit-code/`                     | Code quality auditing.                                                                                    |
| `audit-security`                 | `.claude/skills/audit-security/`                 | Security auditing.                                                                                        |
| `audit-comprehensive`            | `.claude/skills/audit-comprehensive/`            | Comprehensive system audit.                                                                               |
| `audit-process`                  | `.claude/skills/audit-process/`                  | Process auditing.                                                                                         |
| `audit-ai-optimization`          | `.claude/skills/audit-ai-optimization/`          | AI optimization auditing.                                                                                 |
| `audit-documentation`            | `.claude/skills/audit-documentation/`            | Documentation auditing.                                                                                   |
| `audit-engineering-productivity` | `.claude/skills/audit-engineering-productivity/` | Engineering productivity auditing.                                                                        |
| `audit-enhancements`             | `.claude/skills/audit-enhancements/`             | Enhancement auditing.                                                                                     |
| `audit-health`                   | `.claude/skills/audit-health/`                   | Health auditing.                                                                                          |
| `audit-performance`              | `.claude/skills/audit-performance/`              | Performance auditing.                                                                                     |
| `audit-refactoring`              | `.claude/skills/audit-refactoring/`              | Refactoring auditing.                                                                                     |
| `audit-aggregator`               | `.claude/skills/audit-aggregator/`               | Aggregates audit findings.                                                                                |
| `create-audit`                   | `.claude/skills/create-audit/`                   | Creates new audit instances.                                                                              |
| `hook-ecosystem-audit`           | `.claude/skills/hook-ecosystem-audit/`           | Audits the hook system. Has test files.                                                                   |
| `comprehensive-ecosystem-audit`  | `.claude/skills/comprehensive-ecosystem-audit/`  | Full ecosystem audit.                                                                                     |
| `doc-ecosystem-audit`            | `.claude/skills/doc-ecosystem-audit/`            | Documentation ecosystem audit.                                                                            |
| `script-ecosystem-audit`         | `.claude/skills/script-ecosystem-audit/`         | Script ecosystem audit.                                                                                   |
| `session-ecosystem-audit`        | `.claude/skills/session-ecosystem-audit/`        | Session ecosystem audit.                                                                                  |
| `skill-ecosystem-audit`          | `.claude/skills/skill-ecosystem-audit/`          | Skill ecosystem audit.                                                                                    |
| `tdms-ecosystem-audit`           | `.claude/skills/tdms-ecosystem-audit/`           | TDMS ecosystem audit.                                                                                     |

**Total review-related skills: 27** (6 core review + 21 audit variants)

---

## Summary of Key Findings

| #   | Finding                                                                                                                            | Impact                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | **20 pre-commit + pre-push gates** (11 + 9) with 7 skippable checks                                                                | High gate density — 131 overrides logged                |
| 2   | **Cross-doc deps overridden 48.9%** of the time (64 of 131 overrides)                                                              | Gate may be miscalibrated or too broad                  |
| 3   | **pr-review invocations not tracked** by agent tracker (skill path vs Task tool path)                                              | Gap in compliance verification                          |
| 4   | **10 of 14 critical scripts have no tests**                                                                                        | High risk of regression in pipeline infrastructure      |
| 5   | **19 Qodo suppression rules** accumulated from PR review friction                                                                  | Suppression debt — rules reference PRs #366-#396        |
| 6   | **SonarCloud data flows into TDMS** via sync-sonarcloud.js with severity mapping and deduplication                                 | Well-integrated but no test coverage for sync script    |
| 7   | **27 review-related skills** (6 core + 21 audit variants)                                                                          | Potential skill sprawl — audit variants may overlap     |
| 8   | **4 GitHub workflows** directly serve review pipeline (review-check, auto-label-review-tier, sonarcloud, pattern-compliance-audit) | Good CI integration                                     |
| 9   | **Code-reviewer gate in pre-push** checks invocations.jsonl — only 6 overrides (4.6%)                                              | Well-calibrated, rarely bypassed                        |
| 10  | **Session-start automatically syncs reviews** and rotates archives                                                                 | Automation prevents drift but adds session startup cost |
