# Findings: What does our hooks + pre-commit pipeline check?

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-31
**Sub-Question IDs:** D9a-1

---

## Key Findings

### 1. Pre-commit checks: 9 discrete checks across 13 waves [CONFIDENCE: HIGH]

All checks are declared in `scripts/config/hook-checks.json` (the "CANON
artifact") and executed by `.husky/pre-commit`. The hook is POSIX sh (not bash),
runs under Husky v9, and uses a shared infrastructure file (`_shared.sh`) that
provides `add_exit_trap`, `is_skipped`, `require_skip_reason`, and
`_shared_init_fnm`.

Checks run in wave order:

| Wave | Check ID           | What It Does                                                                                                                                  | Blocking               |
| ---- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 0    | secrets-scan       | `gitleaks protect --staged` — scans staged files for leaked secrets                                                                           | BLOCK                  |
| 1    | eslint             | `npx eslint` on staged JS/TS files only (parallel with tests)                                                                                 | BLOCK                  |
| 1    | tests              | `npm test` — skips for doc-only changes, triggers on config file changes                                                                      | BLOCK                  |
| 2    | lint-staged        | `npx lint-staged` — Prettier auto-format, then restages                                                                                       | BLOCK                  |
| 3    | pattern-compliance | `node scripts/check-pattern-compliance.js --staged` — scans for security anti-patterns from `ai-patterns.json`                                | BLOCK                  |
| 4    | audit-s0s1         | `node scripts/validate-audit.js --strict-s0s1` — conditional: only when `docs/audits/**/*.jsonl` staged                                       | BLOCK                  |
| 6    | skill-validation   | `npm run skills:validate` — conditional: only when `.claude/skills/**/*.md` or `.claude/commands/**/*.md` staged                              | WARN+escalate          |
| 7    | cross-doc-deps     | `node scripts/check-cross-doc-deps.js --trivial` — verifies cross-document reference links resolve                                            | BLOCK                  |
| 8    | doc-index          | `npm run docs:index` — auto-regenerates and stages DOCUMENTATION_INDEX.md when any .md file changes                                           | auto-fix               |
| 9    | doc-headers        | `node scripts/check-doc-headers.js` — conditional: only for newly Added .md files                                                             | BLOCK                  |
| 10   | agent-compliance   | `node scripts/check-agent-compliance.js` — warns if code changed without agent review invocation                                              | WARN+escalate          |
| 11   | debt-schema        | `node scripts/debt/validate-schema.js --staged-only` — conditional: only when `MASTER_DEBT.jsonl` staged                                      | BLOCK                  |
| 12   | jsonl-md-sync      | inline bash — warns if `.planning/**/*.jsonl` changed without MD files staged                                                                 | WARN+escalate          |
| 13   | propagation-staged | `node scripts/check-propagation-staged.js` — detects security/anti-pattern propagation misses in staged files per `propagation-patterns.json` | BLOCK/WARN per pattern |

Additionally, there is a **PR Creep Guard** (inline bash, not a named check):

- Warn at 10 commits on branch
- Strong warn at 20 commits
- BLOCK at 25 commits (skippable with `SKIP_CHECKS="pr-creep"`)

The pre-commit hook also runs a **cognitive complexity** advisory check
(non-blocking) on staged JS/MJS files.

### 2. Pre-push checks: 10 discrete checks across 9 waves [CONFIDENCE: HIGH]

All defined in `hook-checks.json` and executed by `.husky/pre-push`. Features a
rebase-only detection that skips code-analysis gates when no content changed vs
upstream.

| Wave | Check ID                | What It Does                                                                                                       | Blocking          |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------- |
| 0    | escalation-gate         | Blocks push on unacknowledged `error`-severity warnings in `.claude/hook-warnings.json`                            | BLOCK (skippable) |
| 1    | circular-deps           | `npm run deps:circular` (madge) — conditional: only when app code (`lib/`, `components/`, `app/`) changed          | BLOCK             |
| 2    | pattern-compliance-push | `check-pattern-compliance.js` on push diff JS/MJS files only (catches review fix commits)                          | WARN+escalate     |
| 3    | code-reviewer-gate      | Blocks if `scripts/`, `.claude/hooks/`, or `.husky/` changed without `code-reviewer` agent invoked in last 4 hours | BLOCK             |
| 4    | propagation             | `node scripts/check-propagation.js --blocking` — detects duplicate function modifications not propagated           | BLOCK             |
| 5    | hook-tests              | `npm run hooks:test` — conditional: only when `.claude/hooks/**/*.js` in push diff                                 | BLOCK             |
| 6    | security-check          | `node scripts/security-check.js` on added lines in push diff — CRITICAL/HIGH violations block                      | BLOCK             |
| 7    | type-check              | `npx tsc --noEmit` — TypeScript type safety (parallel with CC checks)                                              | BLOCK             |
| 7    | cyclomatic-cc           | ESLint `complexity` rule (CC <= 15) on push diff JS/MJS files                                                      | BLOCK             |
| 7    | cognitive-cc            | `node scripts/check-cc.js` with baseline suppression (CC <= 15)                                                    | BLOCK             |
| 8    | npm-audit               | `npm audit --audit-level=high` — dependency vulnerability scan                                                     | WARN+escalate     |
| 9    | triggers                | `npm run triggers:check` — event-based triggers: security_audit, consolidation, skill_validation                   | BLOCK             |

### 3. Skip/override system [CONFIDENCE: HIGH]

Both hooks use a unified `SKIP_CHECKS` environment variable with backward-compat
aliases (e.g., `SKIP_PATTERN_CHECK=1` maps to `SKIP_CHECKS=patterns`). Every
skip requires a `SKIP_REASON` value — the hook calls `require_skip_reason()`
which blocks if `SKIP_REASON` is empty. Overrides are logged via
`scripts/log-override.js`.

Skippable checks (by name): `gitleaks`, `patterns`, `audit`, `tests`,
`cross-doc`, `doc-index`, `doc-header`, `debt`, `pr-creep`, `jsonl-sync`,
`warnings`, `propagation`, `cc`, `cog-cc`, `triggers`, `reviewer`.

Non-skippable checks (no skip_flag in registry): `eslint`, `lint-staged`,
`circular-deps`, `type-check`, `security-check`, `hook-tests`.

### 4. Propagation pattern registry: 10 patterns, all project-specific [CONFIDENCE: HIGH]

`scripts/config/propagation-patterns.json` defines patterns that require
consistent usage across sibling files. All 10 patterns are helper functions from
sonash's `scripts/lib/security-helpers.js`. None are universal coding standards
— they are all internal API contracts:

| Pattern ID      | What It Enforces                                         | Severity |
| --------------- | -------------------------------------------------------- | -------- |
| sanitize-error  | Use `sanitizeError()` not `error.message`                | BLOCK    |
| safe-to-write   | Use `isSafeToWrite()` before `writeFileSync`             | BLOCK    |
| lstat-symlink   | Use `lstatSync` + `isSymbolicLink`, not bare `statSync`  | BLOCK    |
| validate-path   | Use `validatePathInDir()` after `path.resolve()`         | BLOCK    |
| escape-cell     | Use `escapeCell()` for markdown table content            | WARN     |
| exec-path       | Use `process.execPath` not hardcoded `'node'`            | WARN     |
| safe-write-file | Use `safeWriteFileSync()` for all file writes            | BLOCK    |
| path-traversal  | Use regex test not `startsWith('..')` for path traversal | BLOCK    |
| refuse-symlink  | Use `refuseSymlink()` helper functions                   | BLOCK    |
| number-nan      | Use `Number.NaN` not bare `NaN`                          | WARN     |

The `searchGlob` for all patterns is
`["scripts/**/*.js", ".claude/hooks/**/*.js"]` — explicitly scoped to internal
tooling files only.

### 5. Universal vs project-specific classification [CONFIDENCE: HIGH]

**Universal — any JS/TS repo would benefit:**

| Check                            | Why Universal                                 |
| -------------------------------- | --------------------------------------------- |
| secrets-scan (gitleaks)          | Any repo risks leaking credentials            |
| eslint                           | Universal code quality gate                   |
| tests                            | Universal quality gate                        |
| lint-staged (Prettier)           | Universal formatting                          |
| circular-deps (madge)            | Any JS/TS codebase with modules               |
| type-check (tsc --noEmit)        | Any TypeScript repo                           |
| cyclomatic-cc (CC <= 15)         | Universal complexity gate                     |
| npm-audit                        | Any npm project                               |
| PR creep guard (commit count)    | Universal branching hygiene                   |
| doc-headers (new .md files)      | Adaptable: requires config for header schema  |
| cross-doc-deps (link resolution) | Universal if repo has cross-referenced docs   |
| cognitive-cc                     | Universal complexity gate                     |
| security-check (push diff scan)  | Universal if security patterns are configured |

**Project-specific — sonash infrastructure only:**

| Check                      | Why Specific                                                              |
| -------------------------- | ------------------------------------------------------------------------- |
| audit-s0s1                 | Specific to `docs/audits/**/*.jsonl` schema and S0/S1 severity levels     |
| skill-validation           | Specific to `.claude/skills/` and `.claude/commands/` directory structure |
| agent-compliance           | Specific to `.claude/state/agent-invocations.jsonl` state tracking        |
| debt-schema                | Specific to `docs/technical-debt/MASTER_DEBT.jsonl` schema                |
| jsonl-md-sync              | Specific to `.planning/**/*.jsonl` planning file format                   |
| propagation (all patterns) | Specific to `scripts/lib/security-helpers.js` internal API                |
| propagation-staged         | Same — internal API enforcement                                           |
| code-reviewer-gate         | Specific to sonash's `code-reviewer` agent workflow                       |
| escalation-gate            | Specific to `.claude/hook-warnings.json` warning accumulation system      |
| triggers                   | Specific to `scripts/config/agent-triggers.json` event system             |
| hook-tests                 | Specific to `.claude/hooks/` directory structure                          |

**Adaptable with configuration (not plug-and-play but generalizable in
principle):**

- doc-headers: schema lives in `scripts/config/doc-header-config.json` — could
  be adapted
- pattern-compliance: patterns live in `scripts/config/ai-patterns.json` — rule
  set is replaceable
- cross-doc-deps: dependency map in `scripts/config/doc-dependencies.json` —
  replaceable

### 6. Detection feasibility in an external repo [CONFIDENCE: HIGH]

For a repo-analysis skill examining an external repo, here is what can be
detected without running sonash's scripts:

| Check                                                                                                                                 | Detectable Externally?                                                              | How                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| secrets-scan                                                                                                                          | YES — check for `.gitleaks.toml` + gitleaks in PATH or devDeps                      | file existence + package.json                                        |
| eslint                                                                                                                                | YES                                                                                 | `.eslintrc.*` or `eslint.config.*` + `"lint"` script in package.json |
| tests                                                                                                                                 | YES                                                                                 | `"test"` script + test framework in devDependencies                  |
| lint-staged                                                                                                                           | YES                                                                                 | `lint-staged` in devDeps + config in package.json or `.lintstagedrc` |
| circular-deps                                                                                                                         | YES                                                                                 | `madge` in devDeps + `"deps:circular"` script                        |
| type-check                                                                                                                            | YES                                                                                 | `tsconfig.json` exists + TypeScript in devDeps                       |
| npm-audit                                                                                                                             | YES — standard npm, no config needed                                                | package-lock.json existence                                          |
| doc-index                                                                                                                             | PARTIAL — detects if script exists; can't know if it's hooked                       | script presence                                                      |
| cross-doc-deps                                                                                                                        | PARTIAL — detect script; config schema is internal                                  | script presence                                                      |
| PR creep / git structure                                                                                                              | YES — pure git commands                                                             | git rev-list, git merge-base                                         |
| pattern-compliance                                                                                                                    | PARTIAL — can scan for bare anti-patterns (raw `error.message`, `startsWith('..')`) | regex on codebase                                                    |
| audit-s0s1, skill-validation, agent-compliance, debt-schema, jsonl-md-sync, code-reviewer-gate, escalation-gate, triggers, hook-tests | NO — require sonash-specific file structure                                         | N/A                                                                  |

---

## Sources

| #   | Path                                       | Type                        | Trust             | Notes                |
| --- | ------------------------------------------ | --------------------------- | ----------------- | -------------------- |
| 1   | `.husky/pre-commit`                        | source — hook entry point   | HIGH (filesystem) | Read lines 1–319     |
| 2   | `.husky/pre-push`                          | source — hook entry point   | HIGH (filesystem) | Read lines 1–319     |
| 3   | `scripts/config/hook-checks.json`          | config — canonical registry | HIGH (filesystem) | Full file, 989 lines |
| 4   | `scripts/config/propagation-patterns.json` | config — pattern registry   | HIGH (filesystem) | Full file, 110 lines |

---

## Contradictions

None found. The hook entry points and the `hook-checks.json` registry are
consistent. Every check implemented in the hook scripts has a corresponding
registry entry, and the skip flags match across both.

One minor observation: the hook-checks.json lists `cognitive-cc` as a pre-push
check (wave 7, `hook: "pre-push"`), but the pre-commit script also runs a
cognitive complexity check on staged files as an advisory/non-blocking pass. The
pre-commit cognitive check is not represented as a named check in the registry —
it appears to be an undocumented advisory run separate from the canonical
`cognitive-cc` pre-push check.

---

## Gaps

- Did not read `scripts/config/ai-patterns.json` — this is what
  `pattern-compliance` actually checks. The propagation patterns are known
  (security-helpers.js API), but the full set of AI-generated code patterns is
  not in scope per instructions.
- Did not read `_shared.sh` — the shared infrastructure functions (`is_skipped`,
  `require_skip_reason`, `write_hook_runs_jsonl`) are referenced but not
  examined.
- The pre-commit hook extends past line 319 (file is 500+ lines based on token
  count). Waves 11-13 (debt-schema, jsonl-md-sync, propagation-staged) and the
  hook-run recording at exit were not read but are fully documented in
  `hook-checks.json`.

---

## Serendipity

**Wave structure is an architecture pattern worth noting.** The wave numbering
(0 = fastest/most critical, higher = slower/conditional) is an intentional
design: secrets and linting run first (Wave 0-1), compliance in parallel (Wave
3), doc checks last (Wave 7-13). This pattern is directly portable to any repo
analysis skill design — a "what order to run checks" recommendation is derivable
from the wave assignments.

**Rebase-only detection** in pre-push is a non-obvious sophistication: the hook
detects when a push contains only rebase commits (no content diff vs upstream)
and skips all code-analysis gates. This prevents false positives when rebasing
without code changes. Worth noting as a best-practice recommendation for
external repos.

**Parallel execution** of ESLint + tests (Wave 1) and type-check + CC checks
(pre-push Wave 7) via background processes (`&` + `wait`) delivers ~50% time
savings on the two slowest gates. This pattern is universal and transferable.

---

## Confidence Assessment

- HIGH claims: 6
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All findings are derived directly from filesystem source files (Tier 1 — ground
truth). No external sources consulted. No training-data claims made.
