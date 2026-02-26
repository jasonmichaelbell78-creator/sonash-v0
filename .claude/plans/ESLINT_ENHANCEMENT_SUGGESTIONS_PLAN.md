# ESLint Enhancement Suggestions — PR #394 R1 Qodo Review

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-26
**Status:** READY (not started)
**Source:** PR #394 R1 — Qodo code suggestions (16 of 18, minus 2 already fixed)
**Scope:** 11 actionable items from 16 enhancement suggestions (3 skipped, 2 deferred to TDMS)
**Session Created:** #190
<!-- prettier-ignore-end -->

---

## Context

During PR #394 R1 (SonarCloud + Qodo + Gemini + CI review), Qodo flagged 18 code
improvement suggestions for the `eslint-plugin-sonash` ESLint rules and
`generate-views.js`. Two were fixed immediately (hasRenameSyncNearby ordering,
isInsideTryBlock range check). Of the remaining 16, analysis recommended:

- **11 to implement** (8 full, 3 partial)
- **3 to skip** (already implemented, too many FPs, or unreliable)
- **2 to defer** (tracked as DEBT-7595, DEBT-7596)

---

## Implementation Items (priority order)

### Item 1: Match empty check to same receiver variable

- **Rule:** `no-empty-path-check.js`
- **Type:** Correctness fix
- **What:** The rule checks for `rel === ''` in an OR chain with
  `.startsWith('..')` but doesn't verify both checks use the same variable.
  `a === '' || b.startsWith('..')` would wrongly suppress the warning.
- **Fix:** Compare `node.callee.object` identifier with the binary expression's
  identifier in `isEmptyStringCheck`.
- **Effort:** E1 (small)
- **Priority:** P1 — this is a correctness bug, not just an enhancement

### Item 2: Escaped quantifier false positives in regex patterns

- **Rule:** `no-unbounded-regex.js`
- **Type:** False positive reduction
- **What:** Pattern `/\.[*+](?!\?)/` flags `\\.+` (escaped dot + quantifier =
  safe) the same as `.+` (wildcard = unsafe).
- **Fix:** Change detection pattern to `/(?<!\\)\.[*+](?!\?)/` (negative
  lookbehind for backslash). Add test cases for `\\.+` (safe) vs `.+` (unsafe).
- **Effort:** E1 (small)
- **Priority:** P1 — simple regex change, high FP elimination

### Item 3: Fix incorrect variable name check in no-unescaped-regexp-input

- **Rule:** `no-unescaped-regexp-input.js`
- **Type:** False positive reduction
- **What:** Rule checks if the _result_ variable name contains "escape" but
  should check the _input_ identifier passed to `new RegExp()`. Currently
  `const pattern = new RegExp(escapedInput)` gets flagged.
- **Fix:** Check `firstArg.name` (the input) for "escape" patterns instead of
  `parent.id.name` (the output).
- **Effort:** E1 (small)
- **Priority:** P1 — logic is backwards, easy fix

### Item 4: Prevent duplicate items during ingestion

- **File:** `scripts/debt/generate-views.js`
- **Type:** Data integrity
- **What:** In `ingestFromDeduped()`, the `masterHashes` set isn't updated
  inside the loop. Two items with the same hash in one batch both get appended.
- **Fix:** Add `masterHashes.add(hash)` inside the ingestion loop after
  accepting an item.
- **Effort:** E0 (trivial, one line)
- **Priority:** P1 — data integrity

### Item 5: Guard ingest file append failures with try/catch

- **File:** `scripts/debt/generate-views.js`
- **Type:** File safety
- **What:** `appendFileSync` in `--ingest` mode is unguarded. Disk-full or
  permission errors leave partial JSONL lines.
- **Fix:** Wrap `appendFileSync` in try/catch, log error + the failed line,
  continue processing remaining items.
- **Effort:** E1 (small)
- **Priority:** P2

### Item 6: Warn on invalid JSON lines with line numbers and errors

- **File:** `scripts/debt/generate-views.js` (and `scripts/lib/read-jsonl.js`)
- **Type:** Debuggability
- **What:** JSONL parsing silently skips invalid lines. No way to know which
  line or what error.
- **Fix:** In the catch block, `console.warn(`Warning: invalid JSON at line
  ${lineNum}: ${line.slice(0, 80)}...`)`.
- **Effort:** E1 (small)
- **Priority:** P2

### Item 7: Allow `instanceof` with custom error classes

- **Rule:** `no-unsafe-error-access.js`
- **Type:** False positive reduction
- **What:** Only recognizes `instanceof Error` as a valid guard.
  `instanceof AppError`, `instanceof HttpError` etc. are not accepted even
  though they extend Error.
- **Fix:** Accept any `instanceof` check in a catch block as a valid guard (not
  just `instanceof Error`).
- **Effort:** E1 (small)
- **Priority:** P2

### Item 8: Exempt sanitized innerHTML (DOMPurify.sanitize())

- **Rule:** `no-unsafe-innerhtml.js`
- **Type:** False positive reduction
- **What:** Flags ALL `.innerHTML` assignments including
  `el.innerHTML = DOMPurify.sanitize(html)`.
- **Fix:** Check if the RHS is a `CallExpression` where callee is
  `DOMPurify.sanitize`. Only exempt this exact pattern.
- **Effort:** E1 (small)
- **Priority:** P2

### Item 9: Detect any map index variable name (partial)

- **Rule:** `no-index-key.js`
- **Type:** False negative reduction
- **What:** Only catches `key={index}`, misses `key={i}`, `key={idx}`,
  `key={k}`.
- **Fix (option A — simple):** Expand identifier set to `["index", "i", "idx"]`
  as a configurable list.
- **Fix (option B — robust):** Check if the JSX key expression uses the second
  parameter of an enclosing `.map()` callback (scope analysis).
- **Effort:** E1 (option A) / E2 (option B)
- **Priority:** P3 — option A first, option B as follow-up

### Item 10: Refine tmp identifier regex (partial)

- **Rule:** `no-non-atomic-write.js`
- **Type:** False negative reduction
- **What:** Regex `/tmp/i` matches any variable with "tmp" anywhere (e.g.,
  `attemptPath` won't match but `computeTmpResult` would false-negative).
- **Fix:** Change to `/(?:^tmp|tmp$)/i` — matches variables starting or ending
  with "tmp" (e.g., `tmpPath`, `pathTmp`).
- **Effort:** E0 (trivial)
- **Priority:** P3

### Item 11: Trim and coerce category inputs (partial)

- **File:** `scripts/debt/generate-views.js`
- **Type:** Data quality
- **What:** Category values used as-is. Whitespace or case differences create
  duplicate groups.
- **Fix:** Apply `.trim()` always. Use existing `normalize-category.js` utility
  if not already integrated. Do NOT lowercase (preserve original case).
- **Effort:** E1 (small)
- **Priority:** P3

---

## Skipped Items (not implementing)

### Skip 1: Include `"../"` literal check in no-path-startswith

- **Reason:** Already implemented — `"../"` is in the `pathPrefixes` set.

### Skip 2: Match any literal starting with unsafe path prefixes

- **Reason:** Would generate too many false positives. `startsWith("./src")` is
  valid path matching in build tools, not security validation.

### Skip 3: Avoid false positives for binary writes (Buffer/Uint8Array)

- **Reason:** Static type detection is unreliable. Binary writes can still
  corrupt on crash. Use `eslint-disable` for specific exemptions.

---

## Deferred Items (tracked in TDMS)

### DEBT-7595: Template literal cross-boundary pattern detection in no-unbounded-regex

- **What:** Iterating each template literal static part individually instead of
  joining with `_` for more accurate regex analysis.
- **Why deferred:** Complex to implement correctly; cross-boundary patterns are
  extremely rare in practice.

### DEBT-7596: Length guards matching specific spread arrays in no-math-max-spread

- **What:** Extend rule to catch `Math.max(...items.filter(...))` where filtered
  result could be empty.
- **Why deferred:** Complex expressions have unclear guard patterns; the most
  dangerous case (spreading a variable array) is already caught.

---

## Estimated Total Effort

- **E0 items:** 2 (Items #4, #10)
- **E1 items:** 9 (Items #1-3, #5-9, #11)
- **Total:** ~2-3 hours for a single implementation session
- **Test updates:** Each rule change needs corresponding test case updates in
  `tests/eslint-plugin-sonash.test.js`

---

## Acceptance Criteria

1. All 11 items implemented with passing tests
2. No new ESLint violations introduced
3. `npm test` passes (293+ tests)
4. `npm run patterns:check` passes
5. PR created with review-ready commit history
