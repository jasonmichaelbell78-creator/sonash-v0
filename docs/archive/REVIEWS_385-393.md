<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-27
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Archived Reviews #385-#393

Reviews archived from AI_REVIEW_LEARNINGS_LOG.md on 2026-02-27.

---

#### Review #385: PR #394 R2 (2026-02-26)

- **Source**: SonarCloud (7 new), Qodo PR Suggestions (~20), Qodo Compliance (5
  repeat), CI (393 blocking — all pre-existing)
- **PR**: PR #394 — Over-engineering resolution, ESLint AST migration
- **Items**: ~32 total → 8 fixed, 7 deferred (overlap with Enhancement Plan),
  ~17 rejected/skipped
- **Fixed**: (1) CC reduction: `containsCallTo` extracted `isCallToFunc` helper;
  (2) CC reduction: `walkAst` extracted `isAstNode` helper; (3) CC reduction:
  `ingestFromDeduped` extracted `appendNewItems` helper; (4) Optional chain in
  `no-non-atomic-write.js`; (5) Optional chain in `no-empty-path-check.js`; (6)
  Optional chain in `no-unsafe-error-access.js`; (7) `isInsideTryBlock`
  rewritten from range-based to parent-traversal (eliminates range dependency);
  (8) JSONL parse warnings with line numbers in `loadMasterItems`
- **Deferred to Enhancement Plan**: 7 items already tracked in
  `.claude/plans/ESLINT_ENHANCEMENT_SUGGESTIONS_PLAN.md` (empty check receiver,
  escaped regex dots, index key types, DOMPurify exemption, binary write FP,
  category trim, atomic write improvements)
- **Rejected**: 5 Compliance items repeat-rejected (same justification as R1),
  process.exit in library (CLI-only), shared path normalization (hash-breaking),
  Windows require paths (Linux-only CI), range:true in tests (eliminated by
  parent traversal fix), ~5 other low-value suggestions
- **Key Learning**: Parent-traversal (`prev === current.block`) is more robust
  than range-based checks for determining try-block containment. Range requires
  parser options and can fail silently.

---

#### Review #386: PR #394 R3 (2026-02-26)

- **Source**: SonarCloud (2 new + Quality Gate failure), Qodo PR Suggestions
  (~25 across R1-R3), Qodo Compliance (8 items, 5 repeat-rejected), Gemini (1
  comment), CI (393 blocking — all pre-existing)
- **PR**: PR #394 — Over-engineering resolution, ESLint AST migration
- **Items**: ~42 total → 8 fixed, ~10 deferred (overlap with Enhancement Plan),
  ~24 rejected/repeat
- **Fixed**: (1) walkAst CC 16→≤15 via `visitChild` extraction; (2)
  `no-empty-path-check.js` optional chain + same-variable receiver check (Plan
  Item 8); (3) `no-unbounded-regex.js` template literal join `""` not `"_"`; (4)
  `no-non-atomic-write.js` remove `/tmp/i` heuristic bypass; (5)
  `hasRenameSyncNearby` rewritten from range-based to parent traversal; (6)
  Remove `unlinkSync` as atomic write indicator; (7) Shared AST utilities
  extraction (`lib/ast-utils.js`) — `getCalleeName`, `getEnclosingScope`,
  `hasStringInterpolation` deduplicated across 8 rule files; (8) Updated tests
  for new `tmpPath` behavior
- **Deferred**: ~10 Qodo suggestions already tracked in Enhancement Plan (Items
  9-10, 14-18) or enhancement-level (computed property detection, scope
  analysis, JSX spread handling, Windows paths, custom error classes)
- **Rejected**: (1) Qodo "Fix rule file parse error" — FALSE POSITIVE (display
  truncation, not actual code issue); (2) 5 Qodo Compliance repeat-rejected
  (TOCTOU, silent parse, raw content — all addressed in R2); (3) CI 393 blockers
  — pre-existing, tracked in Phase 1 of fix plan; (4) ~10 low-value suggestions
  (library process.exit, binary write FP, timing attacks in tests)
- **Key Learning**: Shared utility extraction (`lib/ast-utils.js`) is the
  correct approach for reducing SonarCloud duplication across ESLint rule files.
  A single `getCalleeName` function replaces 5+ inline callee resolution blocks.
  Quality Gate duplication threshold (3%) requires proactive deduplication when
  adding multiple structurally similar files.

---

#### Review #387: PR #394 R4 (2026-02-26)

- **Source**: Qodo PR Suggestions (8 new on R3 code), Qodo Compliance (repeat
  across 4 checkpoints), CI (393 blocking — same pre-existing), SonarCloud
  Quality Gate (11.7% duplication — same), Gemini (1 stale comment), ESLint
  (2390 warnings, 0 errors)
- **PR**: PR #394 — Over-engineering resolution, ESLint AST migration
- **Items**: ~20 total → 3 fixed, 5 deferred, ~12 rejected/repeat
- **Fixed**: (1) `hasStringInterpolation` made recursive — prevents injection
  rule bypass via nested `BinaryExpression` (Qodo importance 9/10); (2)
  `getCalleeName` handles `ChainExpression` for optional chaining
  (`fs?.readFileSync`) — prevents rule misses (importance 8/10); (3)
  `no-unbounded-regex` uses `q.value.cooked ?? q.value.raw` for accurate
  template literal analysis (importance 7/10)
- **Deferred**: (1) walkAst stopAtFunctionBoundary — enhancement, not a bug; (2)
  Recognize `!rel`/`rel.length === 0` in isEmptyStringCheck — enhancement; (3)
  Tie length guards to same array in no-math-max-spread — enhancement; (4)
  Cross-platform hash stabilization — Linux-only CI; (5) Windows absolute
  requires in no-unguarded-loadconfig — Linux-only CI
- **Rejected**: (1) All Qodo Compliance items — repeat-rejected from R1-R3
  (TOCTOU, silent parse, raw content, missing actor, sample secrets, weak
  validation); (2) CI 393 blockers — pre-existing, tracked in Phase 1; (3)
  Quality Gate duplication 11.7% — structural similarity in 25 rule files, not
  extractable; (4) Gemini hasRenameSyncNearby — stale, already fixed in R3
- **Key Learning**: Qodo batch rejection for R2+ rounds is effective — 12+ items
  repeat-rejected without re-investigation. Recursive `hasStringInterpolation`
  is a real correctness fix: `"SELECT " + (prefix + userInput)` was being
  missed.

---

#### Review #388: PR #394 R5 (2026-02-26)

- **Source**: Qodo PR Suggestions (~10 new on R4 code at 5176cdf), Qodo
  Compliance (repeat across 4 checkpoints), CI (393 blocking — same
  pre-existing), SonarCloud Quality Gate (11.6% duplication — same), Gemini (1
  stale comment)
- **PR**: PR #394 — Over-engineering resolution, ESLint AST migration
- **Items**: ~20 total → 5 fixed, 4 deferred, ~11 rejected/repeat
- **Fixed**: (1) `no-unescaped-regexp-input` extended to catch template literals
  with expressions and string concatenation — was only detecting
  Identifier/MemberExpression (Qodo importance 9/10); (2) `no-unbounded-regex`
  added negative lookbehind `(?<!\\)` to avoid false positives on escaped dots
  like `\.*` (importance 8/10); (3) `findMessageAccesses` in
  `no-unsafe-error-access` now unwraps ChainExpression for `err?.message` and
  handles computed `err["message"]` (importance 8/10); (4) `containsCallTo` in
  `no-non-atomic-write` replaced with generic AST walker — limited traversal
  missed renameSync in VariableDeclarations, ReturnStatements, finally blocks
  (importance 8/10); (5) `no-div-onclick-no-role` skips reporting when
  JSXSpreadAttribute present — `{...props}` could pass role (importance 7/10)
- **Deferred**: (1) hasRenameSyncNearby arg validation — complex, enhancement
  level; (2) read-jsonl.js throw instead of process.exit — callers need
  updating; (3) describe.sequential for RuleTester — no actual flakes observed;
  (4) normalizeFilePath in generate-content-hash.js — consistency only
- **Rejected**: All Qodo Compliance items — repeat-rejected from R1-R4; CI 393
  blockers — pre-existing; Quality Gate duplication — structural; Gemini
  hasRenameSyncNearby — stale (fixed in R3)
- **Key Learning**: The generic AST walker pattern (iterate Object.keys, skip
  "parent", recurse into nodes/arrays) is more robust than hand-enumerating
  statement types. Every new AST node type is automatically handled. Applied to
  containsCallTo — same pattern should be considered for future AST utilities.

---

#### Review #389: PR #394 R6 (2026-02-26)

- **Source**: SonarCloud (1 new — CC 19>15 on containsCallTo), Qodo PR
  Suggestions (12 new on R5 code at ef1bf7e)
- **PR**: PR #394 — Over-engineering resolution, ESLint AST migration
- **Items**: 13 total → 11 fixed, 1 deferred, 1 N/A (no-non-atomic-write
  renameSync arg validation re-raise)
- **Fixed**: (1) `containsCallTo` CC reduction via `walkAstNodes` extraction
  (SonarCloud Critical); (2) `no-unbounded-regex` replaced regex lookbehind with
  manual string scan — fixes subtle bug on `\\.*` (even backslash count) and
  adds BinaryExpression concat detection; (3) `no-div-onclick-no-role` added
  `JSXIdentifier` type check — prevents crash on JSXNamespacedName; (4)
  `no-hallucinated-api` added ChainExpression unwrap for `crypto?.secureHash()`;
  (5) `no-index-key` `containsIndexIdentifier` extended with MemberExpression
  (`index.toString()`), ChainExpression, and callee support; (6)
  `no-unsafe-division` `isGuarded` now verifies guard variable matches divisor
  name — catches `total > 0 ? items / count : 0`; (7-8)
  `no-sql-injection`/`no-shell-injection` null guards on `arguments[0]`; (9)
  `generate-views.js` `.filter(Boolean)` on masterIds; (10)
  `findMessageAccesses` ChainExpression dedup via WeakSet — prevents double
  report on `err?.message`; (11) Added tests for err?.message, concat regex,
  mismatched guard
- **Deferred**: hasRenameSyncNearby arg validation — complex, re-raised from R5
- **Key Learning**: (1) ChainExpression unwrap in AST walkers causes double
  reports — the walker visits both ChainExpression and its inner
  MemberExpression. Use WeakSet to dedup. (2) Regex lookbehinds with backslash
  counting are subtly broken — `(?<!\\)` only checks one position, but `\\` (two
  backslashes) means the preceding `\` escapes the OTHER `\`, leaving the dot
  literal. Manual scan with backslash parity check is more correct.

---

#### Review #390: PR #394 R7 (2026-02-26)

- **Source**: SonarCloud (5 new — CC 17>15, 2 move-to-outer-scope, 2 optional
  chain), Qodo PR Suggestions (14 new on R6 code at e23481f)
- **PR**: PR #394 — ESLint plugin robustness round
- **Items**: 19 total → 9 fixed, 2 rejected, 8 deferred
- **Fixed**: (1) `walkAstNodes` CC 17→≤15 via `visitAstChild` extraction +
  WeakSet cycle safety; (2-3) `hasUnboundedDot`/`getStaticParts` moved to outer
  module scope (SonarCloud `javascript:S1530`); (4) `no-div-onclick-no-role`
  optional chain `attr.name?.type` (SonarCloud); (5) `no-unsafe-division`
  optional chain `test.right?.value` + full `object.property` key for
  MemberExpression guards — prevents `total.length > 0 ? x / arr.length : 0`
  false negative; (6) `walkAst` in `no-unsafe-error-access` stops at function
  boundaries — prevents nested function accesses matching outer catch; (7)
  `isMessageMember` uses `typeof prop?.value === "string"` for parser compat;
  (8) Updated divisor extraction to full `obj.prop` key; (9) Added
  `arr.length > 0` valid test case
- **Rejected**: (a) Skip safe literals in shell/sql injection —
  `hasStringInterpolation` already returns false for Literals/plain templates,
  change is no-op; (b) Correct regex escaping in normalize-file-path.js —
  `String.raw\`\\$&\`` and
  `"\\$&"` produce identical strings, suggestion is
  incorrect
- **Deferred**: 8 items (UNC paths, base ID on master, hash normalization, fail
  fast JSON, escaped-input FPs, shadowing FPs, compliance TOCTOU/atomic/logging)
- **Key Learning**: (1) Extracting a `visitAstChild` helper from `walkAstNodes`
  is the cleanest way to split CC without changing behavior — the outer loop and
  inner child-type dispatch go into separate functions. (2) AST walkers must
  stop at function boundaries (FunctionDeclaration/Expression/Arrow) to respect
  scope — `err.message` inside `() => { err.message }` is a different `err`. (3)
  For MemberExpression guard matching, use full `object.property` key (e.g.
  `arr.length`) not just the property name — prevents unrelated guards matching.

---

#### Review #391: PR #394 R8 (2026-02-26)

- **Source**: SonarCloud (1 — optional chain), Qodo Compliance (4), Qodo PR
  Suggestions (14), CI Pattern Compliance (blocking — pre-existing)
- **PR**: PR #394 — ESLint plugin + TDMS script robustness round
- **Items**: 17 unique → 13 fixed, 3 rejected, 1 pre-existing (CI)
- **Fixed**: (1) `no-unsafe-division` optional chain cleanup (SonarCloud); (2)
  `hasStringInterpolation()` no longer false-positives on `"a" + "b"` static
  concatenation; (3) `getCalleeName()` now handles computed members
  `obj["prop"]`; (4) `getCalleeName()` unwraps TS-ESTree wrapper nodes
  (TSNonNullExpression, TSAsExpression, etc.); (5) `no-non-atomic-write`
  `walkAstNodes` stops at function boundaries — nested function renameSync no
  longer falsely satisfies outer writeFileSync; (6) `no-empty-path-check` skips
  non-identifier receivers to avoid false positives on expressions; (7)
  `no-unescaped-regexp-input` allows `escapeRegExp()` helper calls; (8)
  `no-unsafe-innerhtml` allows `DOMPurify.sanitize()` on RHS; (9)
  `normalize-file-path.js` preserves UNC `//server/share` paths + re-strips
  leading slash after org prefix removal; (10) `normalize-category.js` coerces
  non-string input to String before `.toLowerCase()`; (11)
  `generate-content-hash.js` now uses shared `normalizeFilePath()` instead of
  inline regex; (12) `generate-views.js` ingest loop warns on invalid JSON lines
  instead of silently swallowing; (13) `generate-views.js` `appendNewItems`
  checks if MASTER_DEBT.jsonl ends with newline before appending to prevent
  JSONL line merge corruption
- **Rejected**: (a) Qodo Compliance "secure logging" — internal CLI, line slice
  is safe and aids debugging; (b) Qodo Compliance "path exposure" — internal
  CLI, filesystem paths are expected output; (c) Qodo Compliance "untrusted JSON
  ingestion" — internal TDMS tooling, schema validation already handled by
  `ensureDefaults()`
- **Key Learning**: (1) AST utility functions should handle both JS and TS node
  wrappers — TS-ESTree wraps nodes in TSNonNullExpression etc. which breaks bare
  type checks. Use a while-loop unwrapper. (2) `BinaryExpression` with `+`
  operator needs deeper inspection — two static string literals concatenated
  (`"a" + "b"`) is NOT interpolation, only dynamic values are. (3) JSONL append
  operations must check trailing newline — `appendFileSync` doesn't add a
  separator, so missing trailing newline in the master file corrupts the
  boundary.

---

#### Review #392: PR #394 R9 (2026-02-26)

- **Source**: SonarCloud (4), CI (1 — SEC-004 false positive), Qodo Compliance
  (2), Qodo PR Suggestions (8)
- **PR**: PR #394 — ESLint plugin + TDMS script robustness round
- **Items**: 15 unique → 13 fixed, 2 rejected (stale)
- **Fixed**: (1) SEC-004 false positive — add eslint-plugin-sonash to exclude
  list; (2) CC 16→15 on `getCalleeName()` — extract `unwrapNode()` helper; (3)
  CC 22→15 on `no-unescaped-regexp-input` — extract `isEscapedInput()` and
  `isEscapeHelper()` helpers; (4) `hasRenameSyncNearby()` now validates rename
  is from .tmp file; (5) `no-unbounded-regex` also checks `RegExp()` call form;
  (6) `no-unsafe-innerhtml` catches computed `el['innerHTML']`; (7)
  `hasStringInterpolation` if-then-else → single return; (8)
  `no-unsafe-division` optional chain; (9) generate-views.js swallowed error →
  log error info; (10) `normalizeCategory()` trims input; (11)
  `hasInstanceofErrorCheck` recognizes Error subclass guards; (12)
  `ingestFromDeduped` derives maxId from in-memory masterItems; (13)
  generate-views.js JSONL log sanitized
- **Rejected**: (A) `hasStringInterpolation` "incomplete" — function was already
  complete (stale review); (B) "Fix escaping guidance" — regex in message was
  already correctly escaped
- **Patterns**: CC reduction via helper extraction; security scanner exclusion
  for rule files; optional chaining simplification

---

#### Review #393: PR #394 R10 (2026-02-26)

- **Source**: CI (1 — test file false positives), Qodo Compliance (3), Qodo PR
  Suggestions (19)
- **PR**: PR #394 — ESLint plugin + TDMS script robustness round
- **Items**: 24 unique → 20 fixed, 4 rejected (3 Qodo Compliance repeats, 1
  correct code)
- **Fixed**: (1) SEC-003/007/010 test file excludes in security-check.js; (2)
  SEC-004 cross-platform path separator `[\\/]`; (3) SKIP_PATTERNS add
  backup/out dirs; (4) `hasInstanceofErrorCheck` require IfStatement wrapper;
  (5) `isEscapedVariable` check arg name not result var; (6) `getCheckedName`
  expand to truthy/!== 0/>= 1/negated guards; (7) `isLocalRequireCall` add
  Windows abs/UNC paths; (8) `containsRenameSyncFromTmp` recognize tmp-path
  variables; (9) `getEnclosingTryStatement` for finally-block atomic renames;
  (10) `no-empty-path-check` optional chain via unwrapNode; (11)
  `no-path-startswith` optional chain via unwrapNode; (12)
  `no-hardcoded-secrets` skip computed keys; (13)
  `no-writefile-missing-encoding` only flag string data; (14) generate-views.js
  trim JSONL lines; (15) normalize-category.js hasOwnProperty.call; (16)
  generate-content-hash.js null guard + normalize text; (17-20) test updates for
  new behaviors
- **Rejected**: (A) normalize-file-path.js regex — `String.raw` is correct; (B)
  Qodo Compliance x3 — repeat of R9 rejections (internal tooling)
- **Patterns**: Cross-platform path separators in regex excludes; backup/out
  dirs should always be skipped; parallel agents effective for 20+ items
- **Process**: Parallel agent execution (2 agents, 20 items) completed all fixes
  correctly; one test needed adjustment for writefile-missing-encoding behavior
  change

---
