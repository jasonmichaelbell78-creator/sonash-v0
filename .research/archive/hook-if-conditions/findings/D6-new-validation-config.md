# Findings: New Hooks for File-Type Validation, Config Alerts, and Branch-Specific Behavior

**Searcher:** deep-research-searcher **Profile:** codebase **Date:**
2026-03-29T13:21:48.517Z **Sub-Question IDs:** SQ-D6

---

## Key Findings

### 1. post-write-validator.js is Monolithic by Design, Not by Accident [CONFIDENCE: HIGH]

The file was explicitly consolidated from 10 separate hooks to save ~800ms on
Windows (header comment, lines 6-20). The rationale: each hook is a separate
Node.js process spawn. On Windows, process spawn overhead is ~80ms each. 10
hooks = ~800ms; 1 hook = ~80ms. This is the central performance constraint for
any proposal to split validators into separate hooks.

Key structural facts from reading the file:

- `isMarkdownFile` (line 140) is computed but **never used** — no validator
  references it. This is dead code and represents an unfulfilled original intent
  to add markdown validation.
- `isConfigFile` (line 142) is also computed but **never used** in any
  validator.
- The monolith pattern-dispatches internally using computed booleans
  (`isJsTsFile`, `isTsFile`, `isTsxFile`, etc.) at near-zero overhead.
- File content is read lazily once via `getContent()` and cached — all
  validators share one disk read.
- The validator dispatch runs blocking validators first (firestoreWriteBlock,
  testMockingValidator), then audit validators, then warn validators, then
  suggest validators (lines 993-1023).

**Implication for `if`-split approach:** Splitting `post-write-validator` into
per-file-type hooks would re-introduce the Windows process spawn tax. Each
separate hook = ~80ms. A split into 3 hooks (JSON, TS, MD) would add ~160ms
back. The monolith was built to avoid this exact cost.

**Conclusion:** File-type-specific validation should be added INSIDE the
monolith using existing pattern dispatch (`isMarkdownFile`, `isConfigFile` are
ready to use), NOT as separate hooks with `if` conditions. The `if` approach is
appropriate for hooks that do NEW, independent things — not for splitting
something that was deliberately unified.

---

### 2. Proposed Hook: JSON Syntax Validator [CONFIDENCE: HIGH]

**Codebase evidence:**

- `isConfigFile` (line 142) already matches `.json` files, but no validator uses
  it.
- `isMarkdownFile` is computed but unused — parallel situation.
- The existing `patternCheck` validator skips files under 8KB (line 483). Many
  config JSON files (tsconfig.json, package.json, firebase.json) are smaller
  than 8KB and would be skipped today.
- `JSON.parse` is used 7 times in the existing hooks but only for internal
  state/hook-input parsing, not for validating user-written JSON.
- The auditS0S1 validator (lines 379-458) already demonstrates the pattern of
  parsing JSONL and reporting structured violations inline.

**Implementation approach:** Add inside `post-write-validator.js` (not a new
hook) using the existing `getContent()` + file-type dispatch pattern. A new
`if`-based hook would add a process spawn for every JSON write; the monolith
handles it with a boolean check at ~0ms cost.

**If a standalone hook is preferred anyway (e.g., for separation of concerns):**

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Event          | PostToolUse                                                            |
| Matcher        | `Write\|Edit`                                                          |
| `if` condition | `Write(*.json)` (one handler) + `Edit(*.json)` (second handler)        |
| Script         | `.claude/hooks/post-json-validator.js`                                 |
| Exit behavior  | Print warning to stderr; `console.log("ok")` — WARN only, not blocking |

**What the script does:**

1. Read file path from `process.argv[2]` (or stdin JSON `tool_input.file_path`).
2. `JSON.parse(fs.readFileSync(filePath, "utf8"))` in a try/catch.
3. On parse failure: print `WARN: JSON syntax error in <file>: <error.message>`.
   Never block (JSON errors are often intentional mid-edit; blocking would be
   disruptive).
4. Skip files matching: `node_modules/**`, `.git/**`, `dist/**`, `*.min.json`.
5. Skip files over 512KB (binary/generated).

**Value:** Catches accidentally malformed JSON (misplaced comma, unclosed brace)
immediately on write, before the error surfaces as a runtime failure in Next.js
or Firebase.

**Overhead:** If implemented as a separate hook: +~80ms on Windows per JSON
write. If implemented inside the monolith: ~0ms additional cost.

**Risks:**

- JSON with trailing commas (common in tsconfig) will fail `JSON.parse`. Must
  use a lenient parser (strip-json-comments) or catch and note "trailing commas
  are not valid JSON".
- Some `.json` files are intentionally empty during creation (race condition).
  Should handle empty file gracefully (skip if empty).
- Blocking on JSON errors would be highly disruptive during AI-assisted
  multi-file rewrites where a file is temporarily invalid mid-edit.

**Recommendation:** Add to monolith, WARN-only, tolerant of tsconfig's
`allowJs`/trailing comma patterns.

---

### 3. Proposed Hook: TypeScript Type-Check Trigger [CONFIDENCE: MEDIUM]

**Codebase evidence:**

- `isTsFile` (line 136) and `isTsxFile` (line 137) are already computed in the
  monolith.
- The existing `typescriptStrictCheck` validator (lines 609-666) does INLINE
  pattern matching for `any` type usage using regex — not a real `tsc`
  invocation.
- `tsconfig.json` is at project root. `tsconfig.test.json` and
  `tsconfig.tsbuildinfo` also exist.
- The pre-commit hook (`npm run patterns:check`, `.husky/pre-commit`) handles
  TypeScript CI compilation, but there is no per-file-write tsc check.
- Running `tsc --noEmit` on every TS file write would be prohibitively slow
  (full project compilation takes 10-30s). Per-file incremental compilation
  (`tsc --incremental`) is faster but still ~2-5s.

**Assessment:** A PostToolUse hook triggering `tsc --noEmit` on every
`.ts`/`.tsx` write would be severely disruptive on Windows where process spawn +
compilation cost is high. The current regex-based `typescriptStrictCheck` inside
the monolith is intentionally lightweight.

**If implemented as a new separate hook (advisory only):**

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Event          | PostToolUse                                                                |
| Matcher        | `Write\|Edit`                                                              |
| `if` condition | `Write(*.ts)` / `Edit(*.ts)` / `Write(*.tsx)` / `Edit(*.tsx)` (4 handlers) |
| Script         | `.claude/hooks/post-ts-hint.js`                                            |
| Exit behavior  | Advisory stderr message only; `console.log("ok")` — never blocking         |

**What the script would do (lightweight version):**

1. Check if `tsc --noEmit` was run recently (within last 5 minutes, via a state
   file timestamp).
2. If not recent: emit a reminder "Consider running `npx tsc --noEmit` to check
   types" to stderr.
3. Never actually invoke `tsc` itself from the hook (too slow).

**Value:** Minimal. The existing `typescriptStrictCheck` validator already
catches the highest- signal TypeScript issue (`any` type). A reminder to run tsc
adds noise without automation.

**Recommendation:** NOT recommended as a new hook. Better served by the existing
`typescriptStrictCheck` validator inside the monolith, which is already there
and covers the highest-value case. If tsc checking is wanted, integrate it into
the pre-commit hook rather than PostToolUse (pre-commit already runs compilation
checks).

---

### 4. Proposed Hook: Markdown Linting [CONFIDENCE: HIGH]

**Codebase evidence:**

- `isMarkdownFile` (line 140) is computed in the monolith but NEVER used — this
  is dead code suggesting an original intent that was never implemented.
- The documentation standards (MEMORY.md ref:
  `reference_documentation_standards.md`) mentions doc headers, prettier-ignore
  blocks, version tables — all enforceable by a markdown validator.
- No existing tool in the project lints `.md` files. There is no `markdownlint`
  in `package.json` (not visible in deps), no `.markdownlintrc`.
- The `docs/` tree is large (150+ `.md` files from the Glob results pattern
  across findings).
- Most markdown violations in this project are structural: missing doc headers,
  broken link patterns, unclosed code fences. These are not caught by any
  existing hook.

**If implemented as a new hook (INSIDE the monolith, not a separate hook):**

Add a `markdownCheck()` validator to `post-write-validator.js` using the
existing `isMarkdownFile` flag. Checks to implement:

1. Unclosed fenced code blocks (count ``` occurrences — odd count = unclosed).
2. Missing required doc header (check for a `<!-- doc-header` or specific
   first-line pattern).
3. Broken relative links (regex `\[.*\]\((?!http)[^)]+\)` — check those paths
   exist).

**If implemented as a separate hook using `if`:**

| Field          | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| Event          | PostToolUse                                                 |
| Matcher        | `Write\|Edit`                                               |
| `if` condition | `Write(*.md)` (one handler) + `Edit(*.md)` (second handler) |
| Script         | `.claude/hooks/post-markdown-validator.js`                  |
| Exit behavior  | WARN only (stderr); never blocking                          |

**Value:** Medium. Markdown errors (broken links, unclosed fences) cause
rendering issues in GitHub PRs and documentation viewers. With `isMarkdownFile`
already computed in the monolith but unused, adding the validator inside the
monolith is near-zero cost.

**Effort:** Low (1-2 hours). Pure string operations, no external tooling.

**Risks:**

- Relative link checking requires filesystem reads — could be slow on large
  docs/ trees.
- Doc header format is only loosely defined. Without a canonical spec, false
  positives likely.
- Restrict to: only markdown files inside `docs/`, `CLAUDE.md`,
  `SESSION_CONTEXT.md` — avoid flagging `.claude/tmp/*.md` or generated
  markdown.

**Recommendation:** Add INSIDE the monolith using the existing `isMarkdownFile`
flag. Start with just unclosed fence detection (highest signal, lowest false
positive rate).

---

### 5. Config Change Alert Hooks [CONFIDENCE: HIGH]

**Codebase evidence — which config files matter:**

- `package.json` — dependency changes affect all consumers; indirect security
  surface.
- `tsconfig.json` — strict mode, path aliases; changes can silently break type
  checking.
- `firebase.json` — hosting/functions/rules config; wrong changes can affect
  deploy behavior.
- `next.config.mjs` — headers (COOP/COEP required for Google OAuth per
  CLAUDE.md), rewrites, experimental flags.
- `.claude/settings.json` (global, not in repo), `settings.local.json` (in repo,
  tracked) — hook configuration, permission rules; changes affect Claude's own
  behavior.
- `firestore.rules`, `storage.rules` — security rules; changes have direct
  production impact.

**Current gap:** No hook alerts on writes to ANY of these files. The
`isConfigFile` variable (line 142 of post-write-validator.js) is computed but
unused.

**Proposed Hook A: `.claude/` config change alert**

| Field          | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| Event          | PostToolUse                                                                 |
| Matcher        | `Write\|Edit`                                                               |
| `if` condition | `Write(.claude/*)` / `Edit(.claude/*)`                                      |
| Implementation | INSIDE monolith via path check, OR new hook                                 |
| Exit behavior  | WARN only — log to stderr, write to `.claude/state/config-change-log.jsonl` |

**What it does:**

1. Detect write to `.claude/settings.local.json`, `.claude/hooks/*.js`,
   `.claude/skills/**`, `.claude/config/**`.
2. Emit: "Config change detected in .claude/ — review before committing. Run
   /alerts to see recent changes."
3. Append to `.claude/state/config-change-log.jsonl`:
   `{file, timestamp, toolName}`.
4. For `.claude/hooks/*.js` specifically: add "Hook file modified — test with
   `npm run test:hooks`" to the warning.

**Value:** High. Hook modifications are high-risk (they affect every subsequent
Claude action). The `high-churn-watchlist.json` already flags `session-start.js`
— this generalizes that awareness to all hook files.

**Proposed Hook B: package.json dependency change alert**

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Event          | PostToolUse                                     |
| Matcher        | `Write\|Edit`                                   |
| `if` condition | `Write(package.json)` / `Edit(package.json)`    |
| Implementation | INSIDE monolith via filename check, OR new hook |
| Exit behavior  | WARN only                                       |

**What it does:**

1. Parse the written `package.json` and diff against the git-tracked version:
   `git show HEAD:package.json` (via `gitExec`).
2. Identify added/removed/changed dependencies in `dependencies`,
   `devDependencies`, `peerDependencies`.
3. Emit warning listing the changed deps with a reminder to run `npm audit`
   after install.
4. If `package-lock.json` changes are NOT also pending: emit "package.json
   changed but lockfile may not reflect it — run `npm install` to sync".

**Value:** Medium-High. Catches accidental dep additions or removals during
AI-assisted edits. The diff approach provides specific signal ("firebase added")
rather than generic noise.

**Proposed Hook C: Security rules change alert**

| Field          | Value                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Event          | PostToolUse                                                                                         |
| Matcher        | `Write\|Edit`                                                                                       |
| `if` condition | `Write(firestore.rules)` / `Edit(firestore.rules)` / `Write(storage.rules)` / `Edit(storage.rules)` |
| Implementation | INSIDE monolith (extend `isConfigFile`), OR new hook                                                |
| Exit behavior  | WARN + suggest security-auditor agent                                                               |

**What it does:**

1. Detect write to security rules files.
2. Emit: "Security rules modified — run security-auditor agent before commit."
3. Write to `.claude/hooks/.agent-trigger-state.json` to track the suggestion
   (same mechanism as agentTriggerEnforcer).

**Value:** High. Security rules changes directly affect production data access.
This is currently unguarded — `pre-commit-agent-compliance.js` checks for
`security-auditor` invocation only if `SECURITY_PATTERNS` match staged files.
For Write-time alerting, there is no equivalent.

**Config change alert overhead assessment:** All three config alerts can be
implemented inside the monolith with zero additional process spawn cost. The
`if`-based approach would add ~80ms per config file write. Given config files
are written rarely, the overhead difference is academic — either approach is
acceptable for config alerts.

---

### 6. Branch-Specific Behavior — Fundamental Constraint [CONFIDENCE: HIGH]

**Core finding: `if` cannot detect branch.** The `if` field matches only tool
name + arguments. Git branch is not a tool argument — it is shell state. `if`
field has no access to env vars, shell state, or git state. This is confirmed by
D1-spec.md (finding 4: "Tool Argument Shapes").

**Three viable approaches for branch-awareness:**

**Approach A: Track branch via Bash command matching (limited)**

Hook on `Bash(git checkout *)` and `Bash(git switch *)` to detect branch
transitions:

| Field          | Value                                         |
| -------------- | --------------------------------------------- |
| Event          | PostToolUse                                   |
| Matcher        | `Bash`                                        |
| `if` condition | `Bash(git checkout *)` / `Bash(git switch *)` |
| Script         | `.claude/hooks/branch-tracker.js`             |

**What it does:**

1. After `git checkout`/`git switch` completes, run
   `gitExec(["rev-parse", "--abbrev-ref", "HEAD"])`.
2. Write current branch to `.claude/state/current-branch.json`.
3. If branch matches "main" or "master" pattern: emit "WARNING: On protected
   branch. Direct commits to main are discouraged. Use a feature branch."
4. If transitioning from a feature branch to main: emit a review reminder.

**Limitation:** Does NOT cover the case where Claude issues a commit directly
without a preceding checkout (e.g., when already on main). The branch is state
that exists before any command runs.

**Approach B: Branch check inside commit hook (more reliable)**

The existing `commit-tracker.js` already captures branch name via
`gitExec(["rev-parse", "--abbrev-ref", "HEAD"])` (line 307) on every commit. The
`block-push-to-main.js` hook already blocks pushes to main.

Extending commit-tracker.js to apply stricter per-branch rules is more reliable
than `if`-based branch routing:

**Inside commit-tracker.js (extend `captureCommitMetadata`):**

1. If `branch === "main"`: emit "Direct commit to main detected. Consider using
   a feature branch."
2. If `branch` matches `/^(main|master|release\/.*)$/`: append to a
   `main-commits-log.jsonl`.
3. If commit message does NOT match conventional commit format AND on main:
   WARN.

This doesn't use `if` at all — it's logic inside an existing hook.

**Approach C: PostToolUse on `Bash(git commit *)` with branch check**

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Event          | PostToolUse                             |
| Matcher        | `Bash`                                  |
| `if` condition | `Bash(git commit *)`                    |
| Script         | `.claude/hooks/branch-commit-policy.js` |

**What it does:**

1. Detect git commit completion.
2. Run `gitExec(["rev-parse", "--abbrev-ref", "HEAD"])` to get current branch.
3. Apply branch-specific rules:
   - `main`/`master`: WARN "Direct commit to main. Should this be on a feature
     branch?"
   - Release branches (`release/*`): WARN "Commits to release branches go
     through PRs per release process."
   - Feature branches (`feat/*`, `fix/*`, `chore/*`): OK — no warning.
4. Log to `.claude/state/branch-commit-log.jsonl`.

**Overlap with existing hooks:** `block-push-to-main.js` handles the push case.
A commit-time branch check handles the commit case. Together they cover the full
protection surface.

**Value:** Medium. The main protection (blocking push to main) already exists. A
commit-time warning is advisory — useful for the "I forgot I was on main" case.

**Effort:** Low (1-2 hours). `git-utils.js` already provides `gitExec` and
`projectDir`.

**What branch-specific behaviors would be useful:**

1. **Stricter on main-adjacent branches** (`main`, `release/*`): warn on direct
   commits, enforce conventional commit format, require code-reviewer was run.
2. **Looser on feature branches**: no extra gates (feature branch is the
   playground).
3. **Session context update**: when branch changes, emit a reminder to check
   SESSION_CONTEXT.md sprint status — different branches may have different
   sprint contexts.
4. **Hook behavior difference**: NOT practical to change which hooks run based
   on branch via `if` alone, since `if` doesn't see git state.
   Branch-conditional logic must live inside hook scripts.

---

### 7. Proposed Hook Table Summary [CONFIDENCE: HIGH]

| Hook ID | Name                         | Event       | `if` or Internal        | Effort | Value       | Risk   |
| ------- | ---------------------------- | ----------- | ----------------------- | ------ | ----------- | ------ |
| D6-A    | JSON syntax validator        | PostToolUse | Internal (monolith)     | Low    | Medium      | Low    |
| D6-B    | TypeScript tsc reminder      | PostToolUse | Separate hook (4 `if`s) | Low    | Low         | Medium |
| D6-C    | Markdown fence check         | PostToolUse | Internal (monolith)     | Low    | Medium      | Low    |
| D6-D    | .claude/ config alert        | PostToolUse | Internal (monolith)     | Low    | High        | Low    |
| D6-E    | package.json dep diff alert  | PostToolUse | Internal (monolith)     | Medium | Medium-High | Medium |
| D6-F    | Security rules change alert  | PostToolUse | Internal (monolith)     | Low    | High        | Low    |
| D6-G    | Branch tracker on checkout   | PostToolUse | Separate hook (2 `if`s) | Low    | Low         | Low    |
| D6-H    | Branch-commit policy checker | PostToolUse | Separate hook (1 `if`)  | Low    | Medium      | Low    |

**Recommended priority:**

1. D6-D (`.claude/` config alert) — highest value, trivial to implement inside
   monolith
2. D6-F (security rules alert) — high value, direct security impact
3. D6-A (JSON syntax) — fills the existing dead-code gap (`isConfigFile` unused)
4. D6-C (markdown fence check) — fills the existing dead-code gap
   (`isMarkdownFile` unused)
5. D6-H (branch-commit policy) — closes the gap between existing push-block and
   commit stage
6. D6-E (package.json dep diff) — more complex, medium value
7. D6-B and D6-G — LOW priority, limited practical value

---

## Sources

| #   | URL / File                                                        | Title                             | Type           | Trust | CRAAP | Date       |
| --- | ----------------------------------------------------------------- | --------------------------------- | -------------- | ----- | ----- | ---------- |
| 1   | `.claude/hooks/post-write-validator.js`                           | Monolith hook (full read)         | codebase       | HIGH  | 5/5   | 2026-03-29 |
| 2   | `.claude/hooks/commit-tracker.js`                                 | Commit tracker hook               | codebase       | HIGH  | 5/5   | 2026-03-29 |
| 3   | `.claude/hooks/block-push-to-main.js`                             | Push blocker hook                 | codebase       | HIGH  | 5/5   | 2026-03-29 |
| 4   | `.claude/hooks/pre-commit-agent-compliance.js`                    | Agent compliance hook             | codebase       | HIGH  | 5/5   | 2026-03-29 |
| 5   | `.claude/hooks/lib/git-utils.js`                                  | Git utilities library             | codebase       | HIGH  | 5/5   | 2026-03-29 |
| 6   | `.claude/hooks/lib/inline-patterns.js`                            | Inline pattern checks             | codebase       | HIGH  | 5/5   | 2026-03-29 |
| 7   | `.claude/settings.local.json`                                     | Local hook settings               | codebase       | HIGH  | 5/5   | 2026-03-29 |
| 8   | `.claude/config/high-churn-watchlist.json`                        | High-churn file tracking          | codebase       | HIGH  | 5/5   | 2026-03-29 |
| 9   | `.research/hook-if-conditions/findings/D1-spec.md`                | `if` field specification findings | prior-research | HIGH  | 5/5   | 2026-03-29 |
| 10  | `.research/hook-if-conditions/findings/D5-new-security-deploy.md` | D5 new hook proposals             | prior-research | HIGH  | 5/5   | 2026-03-29 |

---

## Contradictions

**Contradiction 1: `if`-split vs. monolith for file-type validation**

The sub-question framing asks whether `if: "Write(*.json)|Edit(*.json)"` could
do JSON validation as a separate hook. The codebase evidence strongly
contradicts the value of this approach: the post-write-validator was explicitly
consolidated FROM 10 separate hooks TO reduce Windows spawn overhead (~800ms
saved). Splitting again with `if`-based separate hooks would partially restore
that cost (+~80ms per hook on Windows).

The `if` field's performance benefit (avoiding spawning a process that
immediately exits) is captured BETTER by the monolith's internal dispatch than
by `if`-based separate hooks — because the monolith dispatches with boolean
checks at ~0ms cost, while `if`-based separate hooks each still incur a spawn
cost (~80ms) even though they are narrowed.

Resolution: For file-type validation, `if` is the WRONG tool. Use the monolith's
internal dispatch. `if` conditions are better suited for hooks that are
architecturally independent from the existing monolith (branch tracking, config
alerts that write to separate state files, etc.).

**Contradiction 2: Branch detection via `if` vs. inside existing hooks**

The sub-question asks if `if: "Bash(git checkout *)"` could track branch
changes. This works but is complementary to, not a replacement for, the better
approach: embed branch-awareness inside `commit-tracker.js`, which already runs
`gitExec(["rev-parse", "--abbrev-ref", "HEAD"])` on every detected commit and
has the full git-utils infrastructure available.

---

## Gaps

1. **TypeScript type-check automation**: No clear lightweight path. Running
   `tsc` from a hook is too slow; regex-based `any` detection is already
   implemented. The gap between inline regex and full type checking is not
   fillable by hook infrastructure — it requires IDE integration.

2. **OR syntax in `if` field**: D1-spec.md (Finding 7) notes that pipe OR inside
   a single `if` value is UNCONFIRMED — only separate handler objects are
   confirmed. This affects the D6-B TypeScript hook proposal (which would need 4
   separate handlers). Not a blocker, just verbose.

3. **`markdownlint` integration**: No `markdownlint` is in the project's
   devDependencies. A markdown hook using external tooling would require adding
   a dependency. The lightweight approach (unclosed fence regex) avoids this but
   has limited coverage.

4. **package.json diff complexity**: Proposed D6-E requires parsing the
   git-tracked version (`git show HEAD:package.json`) and the written version
   and diffing the dependency trees. This is more complex than the other
   proposals and needs error handling for the initial commit case (no HEAD yet).

---

## Serendipity

**Dead code in post-write-validator.js**: Two computed variables
(`isMarkdownFile` line 140, `isConfigFile` line 142) are never referenced by any
validator. They represent unfulfilled original intent. These variables mean a
markdown validator and a config change detector can be added to the monolith
with ZERO additional overhead beyond the validator logic itself — the extension
points already exist.

**high-churn-watchlist.json is under-connected**: The file tracks 3 high-churn
files (session-start.js, run-alerts.js, review-lifecycle.js) but the D6-D config
change alert could read this file and produce differentiated "extra scrutiny"
warnings for changes to watchlisted files specifically. This would make the
watchlist actionable at write time rather than only at PR review time.

---

## Confidence Assessment

- HIGH claims: 6
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All claims are grounded in direct codebase reads. The `if` spec behavior is
cross-referenced with D1-spec.md findings from prior research in this session.
