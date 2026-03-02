# Phase 4: Enforcement Expansion - Research

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Researched:** 2026-03-01 **Domain:** Static analysis rule authoring (Semgrep,
ESLint, regex), enforcement tracking **Confidence:** HIGH

## Summary

Phase 4 requires expanding automated enforcement from ~24% to 55-60% by adding
20-30 Semgrep rules, 5-10 new ESLint AST rules, and 10-15 new regex rules, plus
building pattern lifecycle tracking across 7 enforcement mechanisms.

The codebase already has a mature foundation: 25 ESLint rules in
`eslint-plugin-sonash/rules/`, ~30 active regex patterns in
`scripts/check-pattern-compliance.js` (plus ~22 migrated to ESLint), a Semgrep
CI workflow (`.github/workflows/semgrep.yml`) using cloud-managed rules but no
local custom rules, and CODE_PATTERNS.md with ~100+ documented patterns across
12 categories.

The primary gap is Semgrep: no local `.semgrep/` rules directory exists, and
Semgrep is not installed as a local dependency. The existing ESLint plugin has
solid infrastructure (shared `ast-utils.js`, RuleTester-based tests, flat
config). The regex checker has sophisticated features (severity tiers, FP
reporting, verified-patterns exclusion system, testFn-based rules for multi-line
analysis).

**Primary recommendation:** Create 20-30 Semgrep YAML rules first (biggest
coverage jump for least code), then add ESLint rules for patterns requiring deep
AST analysis, then expand regex rules for simple string/import bans. Track
enforcement status per-pattern in a JSONL manifest.

## Standard Stack

### Core

| Library/Tool                | Version            | Purpose                                         | Why Standard                                                 |
| --------------------------- | ------------------ | ----------------------------------------------- | ------------------------------------------------------------ |
| Semgrep OSS                 | latest (pip/brew)  | YAML-based pattern matching with taint tracking | Multi-line patterns, data flow analysis, no custom JS needed |
| ESLint                      | 9.39.2 (installed) | AST-based JavaScript/TypeScript analysis        | Already has 25 custom rules, RuleTester infrastructure       |
| check-pattern-compliance.js | N/A (custom)       | Regex-based pattern scanning                    | Existing 30+ rules, severity tiers, FP reporting             |

### Supporting

| Library                | Version             | Purpose                           | When to Use                                               |
| ---------------------- | ------------------- | --------------------------------- | --------------------------------------------------------- |
| eslint-plugin-security | 3.0.1 (installed)   | Community security rules          | Already integrated, covers common Node.js security        |
| ESLint RuleTester      | bundled with ESLint | Testing custom ESLint rules       | Every new ESLint rule must have valid/invalid test cases  |
| vitest                 | installed           | Test runner for ESLint rule tests | Use existing `tests/eslint-plugin-sonash.test.js` pattern |

### Alternatives Considered

| Instead of                          | Could Use                     | Tradeoff                                                                                          |
| ----------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------- |
| Semgrep OSS                         | Semgrep Pro                   | Pro has interprocedural taint; OSS has intraprocedural only. Free tier sufficient for this phase  |
| Custom ESLint rules                 | typescript-eslint typed rules | Typed rules require tsconfig project setup. Current approach (untyped AST) is simpler and working |
| Regex (check-pattern-compliance.js) | Semgrep pattern-regex         | Keep regex checker for git-hook speed; Semgrep for CI-only deeper analysis                        |

**Installation:**

```bash
# Semgrep (Python-based, install globally or in CI)
pip install semgrep
# OR via Docker in CI (already in semgrep.yml workflow):
# uses: returntocorp/semgrep-action@sha
```

## Architecture Patterns

### Recommended Project Structure

```
.semgrep/
  rules/
    security/
      no-raw-error-response.yml
      no-unsanitized-path.yml
      taint-user-input-to-exec.yml
    correctness/
      try-catch-async-await.yml
      file-read-error-handling.yml
    style/
      no-session-boundary-comments.yml
  .semgrepignore              # Exclude test fixtures, docs

eslint-plugin-sonash/
  rules/                      # Existing 25 rules + 5-10 new
    no-use-effect-deps.js     # Example: hooks analysis
    no-unsafe-spread.js       # Example: spread on unknown types
  lib/
    ast-utils.js              # Shared utilities (existing)
  index.js                    # Rule registry (existing)

scripts/
  check-pattern-compliance.js # Existing + 10-15 new regex rules
  config/
    verified-patterns.json    # Existing FP exclusions
    enforcement-manifest.json # NEW: per-pattern enforcement status
```

### Pattern 1: Semgrep YAML Rule Structure

**What:** Declarative YAML rules matching code patterns without writing
JavaScript **When to use:** Multi-line patterns, data flow (taint), patterns
that regex cannot express **Example:**

```yaml
# Source: https://semgrep.dev/docs/writing-rules/rule-syntax
rules:
  - id: sonash.security.no-unsanitized-error-response
    languages: [javascript, typescript]
    severity: ERROR
    message: >
      Raw error message/stack exposed to client. Use sanitized error response.
    patterns:
      - pattern-either:
          - pattern: res.json({ ..., error: $ERR.message, ... })
          - pattern: res.send($ERR.stack)
          - pattern: res.status(...).json({ ..., message: $ERR.message, ... })
      - pattern-not-inside: |
          try { ... } catch($ERR) {
            ...
            const $SAFE = sanitizeError($ERR);
            ...
          }
    metadata:
      category: security
      code-pattern-ref: "unsanitized-error-response"
```

### Pattern 2: Semgrep Taint Mode Rule

**What:** Track untrusted data from source to sink with optional sanitizers
**When to use:** Injection detection, path traversal, data flow violations
**Example:**

```yaml
# Source: https://semgrep.dev/docs/writing-rules/data-flow/taint-mode/overview
rules:
  - id: sonash.security.taint-user-input-to-exec
    languages: [javascript, typescript]
    severity: ERROR
    message: >
      User input flows to shell execution without sanitization.
    mode: taint
    pattern-sources:
      - pattern: req.body.$FIELD
      - pattern: req.query.$FIELD
      - pattern: req.params.$FIELD
    pattern-sanitizers:
      - pattern: sanitize(...)
      - pattern: escapeShellArg(...)
    pattern-sinks:
      - pattern: execSync($CMD)
      - pattern: exec($CMD, ...)
```

### Pattern 3: ESLint AST Rule (existing project pattern)

**What:** JavaScript-based ESLint rules using AST visitor pattern **When to
use:** Patterns requiring parse-tree analysis (scope, type, context)
**Example:**

```javascript
// Source: eslint-plugin-sonash/rules/no-shell-injection.js (existing pattern)
"use strict";
const { getCalleeName, hasStringInterpolation } = require("../lib/ast-utils");

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "...", recommended: true },
    schema: [],
    messages: { ruleViolation: "..." },
  },
  create(context) {
    return {
      CallExpression(node) {
        // AST analysis logic
        const funcName = getCalleeName(node.callee);
        // ... check and report
        context.report({ node, messageId: "ruleViolation" });
      },
    };
  },
};
```

### Pattern 4: Regex Rule with testFn (existing project pattern)

**What:** Multi-line pattern matching using JavaScript function instead of regex
**When to use:** When regex cannot express the pattern (context-sensitive,
multi-line lookback) **Example:**

```javascript
// Source: scripts/check-pattern-compliance.js (existing testFn pattern)
{
  id: "pattern-name",
  severity: "high",
  testFn: (content, filePath) => {
    const lines = content.split("\n");
    const matches = [];
    for (let i = 0; i < lines.length; i++) {
      // Multi-line context analysis
      const context = lines.slice(Math.max(0, i - 15), i + 1).join("\n");
      if (/* violation detected */) {
        matches.push({ line: i + 1, match: lines[i].trim().slice(0, 120) });
      }
    }
    return matches;
  },
  message: "...",
  fix: "...",
  review: "...",
  fileTypes: [".js", ".ts"],
  pathFilter: /(?:^|\/)scripts\//,
}
```

### Pattern 5: Enforcement Manifest (NEW)

**What:** JSONL file tracking enforcement status of every CODE_PATTERNS.md
pattern **When to use:** Pattern lifecycle tracking across all 7 mechanisms
**Example:**

```jsonl
{"pattern_id":"error-sanitization","priority":"critical","mechanisms":{"regex":"active:unsanitized-error-response","eslint":"active:no-raw-error-log","semgrep":"active:sonash.security.no-raw-error","cross_doc":"linked","hooks":"pre-commit","ai":"claude.md-s4","manual":"code-review"},"coverage":"automated","last_verified":"2026-03-01"}
{"pattern_id":"path-traversal-check","priority":"critical","mechanisms":{"regex":"active:simple-path-traversal-check","eslint":"active:no-path-startswith","semgrep":"none","cross_doc":"linked","hooks":"pre-commit","ai":"claude.md-s4","manual":"code-review"},"coverage":"automated","last_verified":"2026-03-01"}
```

### Anti-Patterns to Avoid

- **Writing Semgrep rules as regex:** Use Semgrep's pattern syntax (with `...`
  ellipsis for wildcards), not `pattern-regex`, unless matching literal strings.
  Semgrep understands code structure.
- **Duplicating ESLint rules in Semgrep:** The 25 existing ESLint rules cover
  AST patterns well. Use Semgrep for multi-line/taint patterns that ESLint
  cannot express.
- **Adding regex rules for patterns that have many exclusions:** The existing FP
  report (`--fp-report`) shows patterns with >20 exclusions. Do not add more
  regex rules for inherently context-sensitive patterns; migrate them to ESLint
  or Semgrep instead.
- **Semgrep rules without `metadata.code-pattern-ref`:** Every Semgrep rule must
  link back to CODE_PATTERNS.md for traceability.

## Don't Hand-Roll

| Problem                     | Don't Build                                       | Use Instead                                              | Why                                                              |
| --------------------------- | ------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| Multi-line pattern matching | Custom regex with `[\s\S]` lookaheads             | Semgrep `patterns` with `pattern-inside`                 | Regex cannot understand code nesting; Semgrep parses AST         |
| Data flow / taint tracking  | Custom function-call graph walker                 | Semgrep `mode: taint` with sources/sinks                 | Taint analysis is a solved problem in Semgrep                    |
| AST-based code structure    | String-based `testFn` in check-pattern-compliance | ESLint custom rule with visitor pattern                  | ESLint already parses the AST; regex approximation has FP        |
| FP tracking / auto-disable  | Custom per-rule counters                          | Extend existing `--fp-report` + `verified-patterns.json` | System already counts exclusions per pattern and flags >20       |
| Rule testing (Semgrep)      | Manual `semgrep --test` invocations               | Semgrep's built-in test annotation syntax in YAML        | `# ruleid: rule-name` / `# ok: rule-name` comments in test files |
| Rule testing (ESLint)       | Manual ESLint runs                                | RuleTester with valid/invalid arrays                     | Already used in `tests/eslint-plugin-sonash.test.js`             |

**Key insight:** Semgrep is the biggest force multiplier here. Each YAML rule
file is ~20-40 lines and can match patterns that would require 50+ lines of
regex or ESLint code. The existing project already has 22 patterns that were too
noisy as regex and got migrated to ESLint -- Semgrep can handle many of the
remaining hard-to-match patterns.

## Common Pitfalls

### Pitfall 1: Semgrep Rule Overmatch (False Positives)

**What goes wrong:** Semgrep patterns match too broadly, flagging correct code
as violations. **Why it happens:** Using `...` ellipsis too liberally, not using
`pattern-not` or `pattern-not-inside` to exclude valid patterns. **How to
avoid:** Always include `pattern-not-inside` for known-safe wrappers (try/catch,
guard functions). Test with `semgrep --test` on real codebase files. **Warning
signs:** Rule fires on >5 files in the first CI run.

### Pitfall 2: Semgrep Not Installed Locally (Windows)

**What goes wrong:** Semgrep is Python-based and may not be trivially available
on Windows dev machines. **Why it happens:** The project runs on Windows (per
env info). Semgrep is primarily Linux/macOS native. **How to avoid:** Run
Semgrep only in CI (already have `semgrep.yml` workflow). For local testing, use
`semgrep --test` via WSL or Docker. Do not require Semgrep in pre-commit hooks.
**Warning signs:** Dev trying to run `npx semgrep` and failing.

### Pitfall 3: ESLint Rule Without Tests Causes Silent Breakage

**What goes wrong:** New ESLint rule has a bug in the visitor, silently fails or
crashes ESLint. **Why it happens:** AST node structures are easy to get wrong
(optional chaining, TypeScript-specific nodes). **How to avoid:** Every new rule
must have RuleTester cases covering: valid code (should not flag), invalid code
(should flag), edge cases (comments, template literals, optional chaining). Use
the existing `unwrapNode()` utility for TypeScript AST wrappers. **Warning
signs:** ESLint passes with 0 findings on code that should be flagged.

### Pitfall 4: Regex Rule with Too Many Exclusions

**What goes wrong:** New regex rule has >10 false positives, requiring
pathExcludeList entries. **Why it happens:** Regex cannot understand code
context (try/catch nesting, scope, imports). **How to avoid:** Before adding a
regex rule, check if the pattern is context-sensitive. If it is, write an ESLint
rule or Semgrep rule instead. The existing codebase already has 22 "MIGRATED"
comments showing patterns that moved from regex to ESLint. **Warning signs:**
`--fp-report` shows the new rule in "HIGH FP RISK" or "CONSIDER REMOVAL" status.

### Pitfall 5: Enforcement Manifest Drifts from Reality

**What goes wrong:** Enforcement manifest says a pattern is "automated" but the
rule was disabled or removed. **Why it happens:** Manual tracking of enforcement
status without automated verification. **How to avoid:** Build a verification
script that cross-references the manifest against actual rule files (check IDs
exist in Semgrep YAMLs, ESLint plugin index, and check-pattern-compliance.js).
**Warning signs:** Coverage percentage does not match actual rule count.

### Pitfall 6: Overlapping Rules Across Mechanisms

**What goes wrong:** Same pattern is enforced by regex, ESLint, AND Semgrep,
causing triple-reporting. **Why it happens:** No tracking of which mechanism
owns which pattern. **How to avoid:** The enforcement manifest (ENFR-04) must be
the single source of truth. When migrating a regex rule to Semgrep, add a
`// MIGRATED to Semgrep sonash.xxx` comment (follow existing convention).
**Warning signs:** CI output shows the same violation from multiple tools.

## Code Examples

### Semgrep: Try/Catch Wrapping for Async Functions

```yaml
# .semgrep/rules/correctness/async-without-try-catch.yml
rules:
  - id: sonash.correctness.async-without-try-catch
    languages: [javascript, typescript]
    severity: WARNING
    message: >
      Async function with await but no try/catch error handling. Wrap await
      calls in try/catch to handle errors.
    patterns:
      - pattern: |
          async function $FUNC(...) {
            ...
            await $EXPR
            ...
          }
      - pattern-not-inside: |
          async function $FUNC(...) {
            ...
            try { ... } catch(...) { ... }
            ...
          }
    metadata:
      category: correctness
      code-pattern-ref: "happy-path-only"
    paths:
      include:
        - "lib/"
        - "app/"
        - "components/"
```

### Semgrep: Taint - Path Traversal via User Input

```yaml
# .semgrep/rules/security/taint-path-traversal.yml
rules:
  - id: sonash.security.taint-path-traversal
    languages: [javascript, typescript]
    severity: ERROR
    message: >
      User input flows to file system operation without path containment check.
    mode: taint
    pattern-sources:
      - pattern: req.body.$FIELD
      - pattern: req.query.$FIELD
      - pattern: process.argv[...]
    pattern-sanitizers:
      - pattern: validatePathInDir(...)
      - pattern: isPathContained(...)
    pattern-sinks:
      - pattern: readFileSync($PATH, ...)
      - pattern: writeFileSync($PATH, ...)
      - pattern: path.join($BASE, $PATH)
    metadata:
      category: security
      code-pattern-ref: "path-join-without-containment"
```

### ESLint: useEffect Missing Cleanup

```javascript
// eslint-plugin-sonash/rules/no-effect-missing-cleanup.js
"use strict";
const { getCalleeName } = require("../lib/ast-utils");

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Detect useEffect with setInterval/setTimeout but no cleanup return",
      recommended: true,
    },
    schema: [],
    messages: {
      missingCleanup:
        "useEffect sets interval/timeout but returns no cleanup function. Add return () => clearInterval/clearTimeout.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (getCalleeName(node.callee) !== "useEffect") return;
        const callback = node.arguments[0];
        if (
          !callback ||
          (callback.type !== "ArrowFunctionExpression" &&
            callback.type !== "FunctionExpression")
        )
          return;
        const body = callback.body;
        if (body.type !== "BlockStatement") return;

        // Check if body contains setInterval/setTimeout
        const source = context.sourceCode.getText(body);
        const hasTimer = /\bset(?:Interval|Timeout)\s*\(/.test(source);
        if (!hasTimer) return;

        // Check if there is a return statement with a cleanup function
        const hasReturn = body.body.some(
          (stmt) => stmt.type === "ReturnStatement" && stmt.argument
        );
        if (!hasReturn) {
          context.report({ node, messageId: "missingCleanup" });
        }
      },
    };
  },
};
```

### New Regex Rule: Banned Import Pattern

```javascript
// Addition to ANTI_PATTERNS array in check-pattern-compliance.js
{
  id: "banned-direct-firestore-write",
  severity: "critical",
  pattern: /import\s+\{[^}]*(?:setDoc|addDoc|updateDoc|deleteDoc)[^}]*\}\s+from\s+['"]firebase\/firestore['"]/g,
  message: "Direct Firestore write import -- all writes must go through Cloud Functions (httpsCallable)",
  fix: "Remove direct write import. Use httpsCallable wrapper from lib/firebase-functions.ts",
  review: "CLAUDE.md Section 2 - Security Rules",
  fileTypes: [".ts", ".tsx", ".js", ".jsx"],
  pathFilter: /(?:^|\/)(?:lib|app|components|pages)\//,
  // Exclude functions/ directory where server-side writes are valid
  pathExclude: /(?:^|[\\/])functions\//,
}
```

## State of the Art

| Old Approach                | Current Approach                     | When Changed         | Impact                                    |
| --------------------------- | ------------------------------------ | -------------------- | ----------------------------------------- |
| All patterns as regex       | Regex + ESLint AST (25 rules)        | Phase 2 (Feb 2026)   | 22 patterns migrated, reduced FP          |
| Cloud-managed Semgrep only  | Cloud + local custom rules           | Phase 4 (this phase) | 20-30 new rules covering multi-line/taint |
| Manual enforcement tracking | JSONL enforcement manifest           | Phase 4 (this phase) | Per-pattern status across 7 mechanisms    |
| FP as pathExclude regex     | verified-patterns.json + --fp-report | Session #151+        | Centralized, quantified FP tracking       |

**Deprecated/outdated:**

- `testFn`-based rules in check-pattern-compliance.js for patterns that can be
  expressed in Semgrep: migrate to Semgrep YAML for maintainability
- Individual `pathExclude` regex per pattern: prefer `pathExcludeList` from
  verified-patterns.json (centralized)

## Open Questions

1. **Semgrep OSS taint analysis depth**
   - What we know: OSS supports intraprocedural taint. Pro adds
     interprocedural + cross-file.
   - What's unclear: How many of the 20-30 target rules actually need
     interprocedural analysis.
   - Recommendation: Start with OSS intraprocedural taint. If >5 rules need
     cross-function tracking, evaluate Pro.

2. **Semgrep Windows local development**
   - What we know: Semgrep is Python-based, primarily Linux/macOS. Project runs
     on Windows.
   - What's unclear: Whether WSL or Docker is the preferred local dev path.
   - Recommendation: Run Semgrep only in CI. Do not add to pre-commit hooks. For
     local testing, use `semgrep --test` via WSL if needed.

3. **Coverage calculation methodology**
   - What we know: Current 24% coverage, target 55-60%. CODE_PATTERNS.md has
     ~100+ patterns.
   - What's unclear: Exact denominator (total pattern count) and how each
     mechanism's coverage is weighted.
   - Recommendation: Define coverage as: (patterns with at least one automated
     mechanism) / (total patterns in CODE_PATTERNS.md). Build the enforcement
     manifest first to establish baseline.

4. **FP auto-disable threshold**
   - What we know: Existing `--fp-report` flags patterns with >20 exclusions as
     "CONSIDER REMOVAL".
   - What's unclear: Whether ENFR-07 wants runtime auto-disable or just
     reporting.
   - Recommendation: Start with reporting (existing infrastructure). Add
     auto-disable (skip rule if >N exclusions) as a separate enhancement if
     needed.

## Sources

### Primary (HIGH confidence)

- `eslint-plugin-sonash/index.js` - 25 existing ESLint rules, flat config, rule
  registry
- `eslint-plugin-sonash/lib/ast-utils.js` - Shared AST utilities (getCalleeName,
  unwrapNode, hasStringInterpolation, getEnclosingScope)
- `scripts/check-pattern-compliance.js` - 1902 lines, ~30 active regex rules, 22
  MIGRATED, severity tiers, FP reporting, testFn pattern
- `docs/agent_docs/CODE_PATTERNS.md` - 703 lines, ~100+ documented patterns
  across 12 categories
- `.github/workflows/semgrep.yml` - Existing Semgrep CI workflow (cloud-managed
  rules only)
- `tests/eslint-plugin-sonash.test.js` - RuleTester-based test suite

### Secondary (MEDIUM confidence)

- [Semgrep Rule Syntax](https://semgrep.dev/docs/writing-rules/rule-syntax) -
  Official rule structure documentation
- [Semgrep Taint Mode](https://semgrep.dev/docs/writing-rules/data-flow/taint-mode/overview) -
  Taint analysis syntax
- [Semgrep JS Deep Dive](https://semgrep.dev/blog/2025/a-technical-deep-dive-into-semgreps-javascript-vulnerability-detection/) -
  2025 JS analysis capabilities
- [ESLint Custom Rules](https://eslint.org/docs/latest/extend/custom-rules) -
  Official ESLint rule development guide

### Tertiary (LOW confidence)

- Semgrep Pro interprocedural capabilities - not verified firsthand, based on
  marketing docs

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - verified against existing project files and installed
  dependencies
- Architecture: HIGH - based on existing project patterns (ESLint plugin
  structure, regex checker, CI workflow)
- Pitfalls: HIGH - derived from actual project history (22 MIGRATED patterns, FP
  report system, testFn evolution)
- Semgrep specifics: MEDIUM - syntax verified via official docs, but no local
  rules exist yet to validate against

**Research date:** 2026-03-01 **Valid until:** 2026-03-31 (stable domain, tools
evolve slowly)
