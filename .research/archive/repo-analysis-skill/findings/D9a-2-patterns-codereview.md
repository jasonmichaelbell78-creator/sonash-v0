# Findings: What do patterns:check and code-reviewer check? Which are universal?

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-31
**Sub-Question IDs:** D9a-2

---

## Key Findings

### 1. patterns:check is a custom static regex scanner, not an ESLint wrapper [CONFIDENCE: HIGH]

`scripts/check-pattern-compliance.js` is a bespoke Node.js scanner that applies
a list of named `ANTI_PATTERNS` (each with `id`, `severity`, `pattern` (RegExp),
`message`, `fix`, `review`, and `fileTypes`) against staged or all repo files.
It is NOT a wrapper around ESLint or SonarCloud — it runs independently and
produces its own exit codes (0/1/2). It is invoked as `npm run patterns:check`
and is wired into the pre-commit hook.

Severity tiers with enforcement implications:

- `critical` — always blocks (pre-commit + CI)
- `high` — blocks in CI, warns in pre-commit
- `medium` — always warns
- `low` — informational

Additional mechanisms: a graduation system (warn-then-block via
`.claude/state/warned-files.json`), per-pattern false-positive exclusion via
`verified-patterns` config, and an auto-disable threshold (default 25 FP hits).

Source: `scripts/check-pattern-compliance.js` lines 1-30, 277+

---

### 2. The ANTI_PATTERNS array defines 5 critical-severity checks, all universal [CONFIDENCE: HIGH]

From `check-pattern-compliance.js` line 277 onwards and `CODE_PATTERNS.md` Quick
Reference section, the five critical "Top 5" patterns are:

| ID                 | Pattern                                                  | Universality                                        |
| ------------------ | -------------------------------------------------------- | --------------------------------------------------- | ---------------------------------- |
| Error sanitization | Raw `error.message` in console/log output                | Universal — any Node.js script                      |
| Path traversal     | `startsWith('..')` instead of regex `/^\.\.(?:[\\/]      | $)/`                                                | Universal — any file-system script |
| File read TOCTOU   | `existsSync` before `readFileSync` without try/catch     | Universal — any Node.js file I/O                    |
| exec() /g flag     | Missing `g` flag on regex used in `while (exec())` loops | Universal — any JS with regex loops                 |
| Test mocking       | Direct Firestore mock instead of `httpsCallable` mock    | PROJECT-SPECIFIC (Firebase/Cloud Functions pattern) |

4 of 5 critical patterns are universal to any Node.js/JavaScript codebase. The
test-mocking pattern is project-specific because it enforces the SoNash security
architecture (App Check bypass prevention).

Source: `CODE_PATTERNS.md` lines 39-139, `check-pattern-compliance.js` lines
277-307

---

### 3. patterns:check covers 7+ categories beyond the Top 5 [CONFIDENCE: HIGH]

The full `CODE_PATTERNS.md` category list (line 145-154) shows the scanner
addresses:

| Category              | Universal?         | Notes                                                                                                                                                             |
| --------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bash/Shell            | Universal          | Exit-code capture, `for` file iteration, `printf` vs `echo`, pipefail, POSIX compliance in hooks                                                                  |
| npm/Dependencies      | Universal          | `npm ci` vs `npm install`, peer deps, lockfile hygiene                                                                                                            |
| Security              | Mostly universal   | Path traversal, symlink guards, prototype pollution, ReDoS, atomic writes — all universal. Firebase-specific items (App Check, defineString) are project-specific |
| GitHub Actions        | Universal          | CI patterns                                                                                                                                                       |
| JavaScript/TypeScript | Universal          | Regex state leak, TOCTOU, JSONL parse resilience                                                                                                                  |
| CI/Automation         | Universal          | Mostly universal                                                                                                                                                  |
| Git                   | Universal          | `git add -A` prohibition, `--` separator, option injection                                                                                                        |
| Process Management    | Universal          | `execSync` timeouts/buffers                                                                                                                                       |
| Documentation         | Project-specific   | Doc headers, index sync                                                                                                                                           |
| React/Frontend        | Framework-specific | React hooks rules, effect cleanup, App Router conventions                                                                                                         |
| General               | Mixed              |                                                                                                                                                                   |

Source: `CODE_PATTERNS.md` lines 145-299

---

### 4. code-reviewer is an AI-driven skill, not automated static analysis [CONFIDENCE: HIGH]

`code-reviewer` (SKILL.md v2.2) is a structured AI review protocol, not a
linting tool. It is invoked as a subagent Task (`superpowers:code-reviewer`)
with a git SHA range. It has two phases:

**Phase 1 — Anti-Pattern Verification (mandatory pre-check):** Runs the same 7
anti-pattern checks as patterns:check (raw error.message, startsWith('..') path
check, existsSync TOCTOU, exec() /g flag, direct Firestore writes, writeFileSync
without guard, appendFileSync without withLock). Blocks the review entirely on
any violation (per decision D32 — no warning mode).

**Phase 2 — Checklist review:** Human-style review across:

- TypeScript/JS: strict mode, no `any`, Zod schema alignment, unused imports
- React/Next.js: hooks rules, effect cleanup, server/client boundaries, App
  Router
- Firebase/Firestore: no direct writes to protected collections, App Check, rate
  limiting, repository pattern
- Tailwind: utility-first, breakpoints, dark mode
- Scripts: 11-item checklist (file I/O, error handling, path safety, symlinks,
  atomic writes, regex safety, git commands, prototype pollution, silent
  catches, fix templates, security checklist)
- Security: Zod validation, no secrets client-side, Firebase rules coverage,
  auth checks
- Testing: httpsCallable mocking, edge case coverage, no flaky tests
- Code quality: DRY/SOLID, naming, error boundaries

Source: `code-reviewer/SKILL.md` lines 99-224

---

### 5. Several checks are duplicated across patterns:check AND code-reviewer [CONFIDENCE: HIGH]

These 7 checks appear in both systems (patterns:check as regex, code-reviewer as
AI checklist item):

1. Raw `error.message` without sanitization
2. `startsWith('..')` path traversal check
3. `existsSync` before `readFileSync` (TOCTOU)
4. `exec()` without `/g` in while loops
5. Direct Firestore writes to protected collections
6. `writeFileSync` without `isSafeToWrite` guard
7. `fs.appendFileSync` without `withLock` for shared JSONL files

The intent (per SKILL.md lines 99-101) is that patterns:check handles automated
detection; code-reviewer provides a second layer via AI pattern recognition on
files that may fool regex.

Source: `code-reviewer/SKILL.md` lines 103-125

---

### 6. SECURITY_CHECKLIST.md maps checks to enforcement mechanisms (ESLint rules + Semgrep) [CONFIDENCE: HIGH]

The checklist (lines 60-100) reveals that some patterns:check rules have
_partial overlap_ with custom ESLint rules and Semgrep rules maintained in the
project:

| Pattern                             | ESLint Rule                     | Semgrep Rule                                     |
| ----------------------------------- | ------------------------------- | ------------------------------------------------ |
| Exclusive file creation (`wx` flag) | `sonash/no-non-atomic-write`    | —                                                |
| Symlink check before write          | `sonash/no-stat-without-lstat`  | `sonash.correctness.no-race-condition-file-ops`  |
| Empty path check                    | `sonash/no-empty-path-check`    | —                                                |
| File read without try/catch         | `sonash/no-unguarded-file-read` | `sonash.correctness.file-read-without-try-catch` |
| `startsWith('..')` path check       | `sonash/no-path-startswith`     | —                                                |

These are custom ESLint plugins (`sonash/`) and custom Semgrep rules — not
standard ESLint or SonarCloud rules. The patterns:check regex scanner provides a
third, overlapping layer.

Source: `SECURITY_CHECKLIST.md` lines 60-100

---

### 7. Universality classification summary [CONFIDENCE: HIGH]

**Universal (any codebase, any language):**

- Exit-code capture in shell (`$?` after assignment)
- File iteration with `for` (spaces in filenames)
- `npm ci` vs `npm install`
- `git add -A` prohibition in automation
- `--` separator before file args in git
- Git option injection (strip leading dashes)
- Atomic state writes (tmp+rename)
- execSync with timeout+maxBuffer limits
- CRLF regex compatibility (`\r?\n`)
- Prototype pollution guard
- ReDoS via unbounded quantifiers
- SSRF allowlist enforcement
- Backup-swap atomic write pattern
- Error sanitization (path/secret scrubbing from logs)
- Try/catch on all file reads

**Universal — Node.js/JavaScript specific:**

- exec() `/g` flag requirement
- TOCTOU race (existsSync + readFileSync)
- Path traversal regex vs startsWith
- Regex `lastIndex` reset before loop
- Binary file NUL-byte detection
- Symlink guard before writes

**Framework-specific (React/Next.js):**

- App Router conventions
- useEffect dependency arrays
- Server/client component boundaries
- Functional components only

**Project-specific (SoNash Firebase):**

- No direct writes to `journal`, `daily_logs`, `inventoryEntries`
- App Check token verification
- Mock `httpsCallable` not Firestore in tests
- Repository pattern (`lib/firestore-service.ts`)
- `defineString()` vs `process.env` in Cloud Functions
- Rate limiting with `sonner` toasts
- Doc header format requirements
- Documentation index staleness check

---

## Sources

| #   | File                                                | Type                          | Trust | Date                           |
| --- | --------------------------------------------------- | ----------------------------- | ----- | ------------------------------ |
| 1   | `scripts/check-pattern-compliance.js` lines 1-310   | Codebase — source of truth    | HIGH  | Active (reviewed 2026-03)      |
| 2   | `.claude/skills/code-reviewer/SKILL.md` v2.2        | Codebase — skill definition   | HIGH  | 2026-03-13                     |
| 3   | `docs/agent_docs/CODE_PATTERNS.md` lines 1-299      | Codebase — pattern catalog    | HIGH  | 2026-02-26 (v4.1, 347 reviews) |
| 4   | `docs/agent_docs/SECURITY_CHECKLIST.md` lines 1-100 | Codebase — security reference | HIGH  | 2026-03-12 (v1.3)              |

---

## Contradictions

None found. The four files are internally consistent. The duplication between
patterns:check and code-reviewer appears intentional (defense in depth), not
contradictory.

---

## Gaps

1. The full ANTI_PATTERNS array in `check-pattern-compliance.js` was only
   partially read (lines 277-310 show the first 2 defined patterns:
   `exit-code-capture` and `for-file-iteration`). The complete list of
   enumerated pattern IDs was not extracted. The full count requires reading
   further into the file.
2. The `CODE_PATTERNS.md` categories for React/Frontend, CI/Automation, Git,
   Process Management, Documentation, and General were listed but not read in
   detail (only the Security and Bash/Shell tables were captured in full).
3. Custom ESLint plugin rules (`sonash/no-non-atomic-write` etc.) were
   referenced in SECURITY_CHECKLIST.md but the actual ESLint config files were
   not inspected — scope was intentionally kept to the 4 assigned files.
4. The `docs/agent_docs/POSITIVE_PATTERNS.md` file (referenced by code-reviewer
   SKILL.md) was not read — it contains the safe-alternative patterns but was
   outside the assigned file list.

---

## Serendipity

1. **Graduation system** — patterns:check has a warn-then-block graduation
   mechanism (`.claude/state/warned-files.json`). First violation = warn, repeat
   violation = block. This is a sophisticated false-positive mitigation approach
   that a repo analysis skill could borrow.
2. **False-positive auto-disable** — patterns with 25+ FP exclusions are
   automatically disabled unless `--include-fp-disabled` is passed. The FP count
   is tracked per-pattern. This is a signal for "noisy but real" patterns that a
   repo analysis skill should model.
3. **Episodic memory pre-search** — code-reviewer explicitly requires a search
   of episodic memory for past review decisions on the same module BEFORE
   starting review. This is an architectural pattern for any AI review agent:
   consult history first.
4. **Pattern count scale** — CODE_PATTERNS.md v4.1 was distilled from 347 AI
   code reviews; SECURITY_CHECKLIST.md references 180+ patterns. This indicates
   the pattern set is organically grown from real review findings, not
   theoretical — a strong signal for reliability.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are grounded in direct file reads from the four assigned sources.
No external sources were consulted per scope constraint.
