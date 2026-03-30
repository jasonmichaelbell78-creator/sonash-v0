<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-30
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# DIAGNOSIS: 3-Layer Propagation Enforcement

## ROADMAP Alignment

**Aligned.** This is infrastructure/tooling work that directly supports the
project's pattern-based quality enforcement pipeline. Propagation misses are the
#1 source of avoidable review rounds (6+ retros, 13+ PRs affected). No ROADMAP
conflict.

## Prior Research

`.planning/archive/propagation-research/` — completed 4-wave research (Session
#239). Key outputs: TDMS data-loss fix, CI security gate, doc-index
optimization, gitleaks CI, baseline support. The 3-layer propagation enforcement
was explicitly deferred as "too large for the research execution session."

## Existing Infrastructure

### What Already Exists

| Component                | File                                              | Status                                                                                |
| ------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Pre-commit staged check  | `scripts/check-propagation-staged.js` (387 lines) | Advisory only (exits 0), 6 hardcoded security patterns, directory-scoped              |
| Pre-push diff check      | `scripts/check-propagation.js` (616 lines)        | Blocking (`--blocking`), function-name diffing + 4 hardcoded pattern rules            |
| Baseline suppression     | `scripts/config/known-propagation-baseline.json`  | Empty (`entries: []`), scaffolded but unused                                          |
| Hook wiring (pre-commit) | `.husky/pre-commit` line 431                      | Calls `check-propagation-staged.js`, non-blocking                                     |
| Hook wiring (pre-push)   | `.husky/pre-push` line 262                        | Calls `check-propagation.js --blocking`, blocking                                     |
| CANON registry           | `scripts/config/hook-checks.json` line 649        | `propagation` (pre-push) registered; `propagation-staged` (pre-commit) NOT registered |

### Key Gaps

1. **No external pattern registry** — all patterns are hardcoded inline in two
   separate scripts. Adding a pattern requires editing source code.
2. **Pre-commit is advisory-only** — never blocks, even on clear misses.
3. **Pre-push scope gate too narrow** — only fires when `scripts/**/*.js` is in
   the diff. Misses `lib/`, `app/`, `.claude/hooks/`, `.claude/skills/`.
4. **Two scripts have independent pattern lists** —
   `check-propagation-staged.js` has 6 SECURITY_PATTERNS, `check-propagation.js`
   has 4 KNOWN_PATTERN_RULES. No shared source of truth.
5. **DEBT-45524/45525** — propagation overridden 31-33x in 14 days (skip flag
   abuse because the check was too noisy/broad).
6. **False-positive bug** — PR #448 R1 found grep pattern `"propagation miss"`
   was matching its own success message `"no propagation misses"`.

## Evidence: Propagation Miss Patterns (from 13+ PRs)

| Pattern                                      | PRs Affected           | Recurrences |
| -------------------------------------------- | ---------------------- | ----------- |
| Path traversal guards (`startsWith` → regex) | #374, #388, #389, #448 | 6x          |
| Symlink guards (`isSafeToWrite`/`lstatSync`) | #368, #374, #397       | 6x          |
| `escapeCell()` wrapping                      | #415, consolidation    | 6x          |
| Truthy filter (`\|\|` falsy-unsafe)          | #374, #381, #388       | 6x          |
| `sanitizeError` / sanitization               | #431, #448             | 6x          |
| `process.execPath` consistency               | #420                   | 4x          |
| S5852 regex → string parsing                 | #397, #448             | 4x          |
| CRLF normalization                           | #379                   | 2x          |

## Reframe Check

The task is exactly what it appears to be: a 3-layer enforcement system that
externalizes the pattern knowledge into a registry and makes both hook stages
(commit + push) actually block on propagation misses. No reframing needed.
