# Hookify Strategy & Implementation Plan

**Document Version:** 1.2 **Last Updated:** 2026-01-22 **Status:** PARTIALLY
IMPLEMENTED - Phase 1-4 hooks deployed, Hook Health Infrastructure added
(Session #91)

---

## 📋 Purpose

This document catalogs potential hookify hooks to improve code quality,
security, and developer experience. Each hook includes:

- **What it prevents** - The gap being addressed
- **When it triggers** - The detection criteria
- **What it does** - Block vs. warn vs. prompt
- **Time cost** - Added latency per operation
- **Technical debt** - Maintenance and false positive risk
- **Priority** - Tier 1 (critical) → Tier 3 (quality of life)

**Next Step:** Review and add selected hooks to current sprint planning.

---

## 🎯 Quick Decision Matrix

| Hook Name                     | Tier | Time Cost | False Positive Risk | Status               |
| ----------------------------- | ---- | --------- | ------------------- | -------------------- |
| Direct Firestore Write Block  | 🔴 1 | +50ms     | Low                 | ✅ IMPLEMENTED (P2)  |
| Test Mocking Validator        | 🔴 1 | +30ms     | Low                 | ✅ IMPLEMENTED (P2)  |
| Pre-Commit Pattern Check      | 🔴 1 | +2-5s     | Medium              | ✅ EXISTS (Husky)    |
| Error Sanitization Enforcer   | 🔴 1 | +40ms     | Medium              | ⚠️ MAYBE (Phase 4)   |
| App Check Validator           | 🔴 1 | +60ms     | Low                 | ✅ IMPLEMENTED (P2)  |
| Agent Trigger Enforcer        | 🟡 2 | +100ms    | Medium-High         | ✅ IMPLEMENTED (P4)  |
| SESSION_DECISIONS Auto-Save   | 🟡 2 | +10ms     | Low                 | ✅ IMPLEMENTED (P1)  |
| Repository Pattern Validator  | 🟡 2 | +80ms     | Medium              | ✅ IMPLEMENTED (P3)  |
| API Key/Secret Scanner        | 🟡 2 | +150ms    | High                | ⚠️ MAYBE (Phase 4)   |
| Session End Reminder          | 🟢 3 | +5ms      | None                | ✅ IMPLEMENTED (P1)  |
| Large Context Warning         | 🟢 3 | +20ms     | Low                 | ✅ IMPLEMENTED (P1)  |
| Plan Mode Suggestion          | 🟢 3 | +80ms     | Medium              | ✅ IMPLEMENTED (P4)  |
| TypeScript Strict Mode Check  | 🟡 2 | +100ms    | Low                 | ✅ IMPLEMENTED (P3)  |
| Zod Schema Sync Validator     | 🟡 2 | +120ms    | Medium              | ⚠️ MAYBE (Phase 4)   |
| Component File Size Limit     | 🟢 3 | +10ms     | Low                 | ✅ IMPLEMENTED (P1)  |
| Import Depth Limit            | 🟢 3 | +50ms     | Medium              | 🚫 NO (ESLint)       |
| Console.log Production Block  | 🟡 2 | +20ms     | Medium              | 🚫 NO (ESLint rule)  |
| Unused Import Detector        | 🟢 3 | +200ms    | High                | 🚫 NO (TypeScript)   |
| Commit Message Format         | 🟢 3 | +50ms     | Medium              | ⚠️ MAYBE (Phase 4)   |
| Documentation Freshness Check | 🟢 3 | +300ms    | High                | 🚫 NO (Manual audit) |

**Key:**

- ✅ IMPLEMENTED = Hook deployed and active
- ✅ EXISTS = Functionality exists via other mechanism
- ⚠️ MAYBE = Evaluate for Phase 4
- 🚫 NO = Better solved via ESLint/TypeScript/manual process

---

## 🔴 Tier 1: Critical Security & Correctness

### 1. Direct Firestore Write Prevention

**Gap:** CLAUDE.md Section 2 prohibits direct writes to `journal`, `daily_logs`,
`inventoryEntries` but no enforcement exists.

**Trigger:**

- PostToolUse hook on Write/Edit tools
- Scan for `addDoc()`, `setDoc()`, `updateDoc()`, `collection()` calls
- Check if target collection is in protected list:
  `['journal', 'daily_logs', 'inventoryEntries', 'goals', 'reflections']`

**Action:**

- **BLOCK** operation
- Output: "❌ Direct Firestore writes to protected collections are prohibited.
  Use Cloud Functions (httpsCallable) instead. See CLAUDE.md Section 2."
- Suggest correct pattern:
  `const addJournalEntry = httpsCallable(functions, 'addJournalEntry')`

**Time Cost:**

- Per Write/Edit: +50ms (file scan + regex match)
- Per Session: Negligible (only triggers on protected collection writes)

**Technical Debt:**

- **Maintenance:** Low - protected collection list is stable
- **False Positives:** Low - regex patterns are specific
  (`addDoc\(.*?['"]journal['"]`)
- **Bypass Risk:** Low - client-side code must call Firestore APIs by name
- **Update Frequency:** Quarterly (when adding new protected collections)

**Edge Cases:**

- Admin panel code may legitimately need direct writes (use allowlist:
  `app/admin/**`)
- Test files may mock Firestore (use allowlist: `**/*.test.ts`, `**/*.spec.ts`)

**Implementation Complexity:** 🟢 Low (30 lines of JS, similar to existing
pattern-check.js)

---

### 2. Test Mocking Validator

**Gap:** CODE_PATTERNS.md #5 requires mocking `httpsCallable`, not
`firebase/firestore`, but tests could bypass security layers.

**Trigger:**

- PostToolUse hook on Write/Edit tools
- File path matches `**/*.test.{ts,tsx,js,jsx}` or `**/*.spec.{ts,tsx,js,jsx}`
- Content contains `vi.mock("firebase/firestore")` or
  `jest.mock("firebase/firestore")`

**Action:**

- **BLOCK** operation
- Output: "❌ Tests must mock httpsCallable, not direct Firestore. This ensures
  tests validate security layers. See CODE_PATTERNS.md #5."
- Suggest:
  ```typescript
  vi.mock("firebase/functions", () => ({
    httpsCallable: vi.fn(() => vi.fn().mockResolvedValue({ data: {} })),
  }));
  ```

**Time Cost:**

- Per Write/Edit: +30ms (path check + simple string search)
- Per Session: ~500ms (if writing 10-15 test files)

**Technical Debt:**

- **Maintenance:** Very Low - mocking patterns are stable
- **False Positives:** Very Low - only triggers on exact
  `vi.mock("firebase/firestore")` string
- **Bypass Risk:** None - TypeScript compilation will fail if Firestore is used
  without mocking
- **Update Frequency:** Annually (if testing framework changes)

**Edge Cases:**

- Admin scripts that need Firestore for data migration (allowlist:
  `scripts/admin/**`)

**Implementation Complexity:** 🟢 Low (15 lines of JS)

---

### 3. Pre-Commit Pattern Check

**Gap:** `npm run patterns:check` exists but isn't automatically run before
commits.

**Trigger:**

- PreToolUse hook on Bash tool
- Command contains `git commit`

**Action:**

- **RUN** `npm run patterns:check` before allowing commit
- If violations found:
  - **WARN** (not block) - allow user to override
  - Output: "⚠️ Pattern violations detected. Fix before committing or use
    --no-verify to skip."
  - List violations with file:line references

**Time Cost:**

- Per Commit: +2-5s (runs ESLint-style checker on changed files)
- Per Session: +10-20s (if 4-5 commits per session)

**Technical Debt:**

- **Maintenance:** Medium - patterns file must stay in sync with
  CODE_PATTERNS.md
- **False Positives:** Medium - regex patterns may match valid code (mitigated
  by human review)
- **Bypass Risk:** Medium - users can use `git commit --no-verify`
- **Update Frequency:** Monthly (as new patterns are added from code reviews)

**Edge Cases:**

- Emergency hotfixes may need to bypass (document `--no-verify` escape hatch)
- Large refactors may produce too many warnings (add `patterns:check --fix`
  auto-fix mode)

**Implementation Complexity:** 🟡 Medium (integration with existing
pattern-check.js + git command detection)

---

### 4. Error Sanitization Enforcer

**Gap:** CODE_PATTERNS.md #1 requires `sanitize-error.js` but could be forgotten
in error handlers.

**Trigger:**

- PostToolUse hook on Write/Edit tools
- Content contains `console.error(error.message)`, `throw error`,
  `logger.error(error)`, `reject(error)` without `sanitizeError()`

**Action:**

- **WARN** (not block - may have valid reasons)
- Output: "⚠️ Error message may contain sensitive paths. Consider using
  sanitizeError(). See CODE_PATTERNS.md #1."
- Auto-suggest: `import { sanitizeError } from '@/scripts/lib/sanitize-error';`

**Time Cost:**

- Per Write/Edit: +40ms (AST parse to find error handlers)
- Per Session: ~300ms (if editing 7-8 files with error handling)

**Technical Debt:**

- **Maintenance:** Medium - must update detection as error handling patterns
  evolve
- **False Positives:** Medium-High - legitimate cases like
  `throw new CustomError(error)` may trigger
- **Bypass Risk:** Low - only a warning, not a blocker
- **Update Frequency:** Quarterly (as error handling patterns are reviewed)

**Edge Cases:**

- Errors that are already sanitized objects (check for
  `error instanceof SanitizedError`)
- Third-party library errors that don't expose paths (allowlist known libraries)

**Implementation Complexity:** 🟡 Medium-High (requires AST parsing or very
robust regex)

**Recommendation:** Start with WARN mode, gather false positive data for 2
weeks, then refine patterns.

---

### 5. App Check Validator

**Gap:** All Cloud Functions should verify App Check tokens, but no hook
validates this.

**Trigger:**

- PostToolUse hook on Write/Edit tools
- File path matches `functions/src/**/*.ts`
- Content contains `export const functionName = onCall(` without `context.app`
  check

**Action:**

- **BLOCK** operation
- Output: "❌ Cloud Functions must verify App Check. Add:
  `if (!context.app) { throw new HttpsError('failed-precondition', 'App Check required'); }`"
- Show example from existing function

**Time Cost:**

- Per Write/Edit: +60ms (regex check for onCall + context.app pattern)
- Per Session: Negligible (only 1-2 Cloud Function edits per session)

**Technical Debt:**

- **Maintenance:** Low - App Check pattern is stable
- **False Positives:** Low - can detect `context.app` anywhere in function body
- **Bypass Risk:** Medium - developer could add check then remove later
  (mitigated by testing)
- **Update Frequency:** Rarely (Firebase API changes)

**Edge Cases:**

- Test/development functions may skip App Check (use env check:
  `process.env.NODE_ENV === 'development'`)
- Scheduled functions (`onSchedule`) don't have `context.app` (only check
  `onCall` functions)

**Implementation Complexity:** 🟢 Low-Medium (25 lines of JS with regex)

---

## 🟡 Tier 2: Important Process & Architecture

### 6. Agent Trigger Enforcement

**Gap:** CLAUDE.md Section 6 says agents are "REQUIRED when triggers match" but
`analyze-user-request.js` only suggests ("MUST use...").

**Trigger:**

- UserPromptSubmit hook
- User request matches security/bug/database/UI patterns
- No corresponding agent invocation detected in next 3 messages

**Action:**

- **BLOCK** after 3 messages without agent
- Output: "🚫 This task requires the [agent-name] agent per CLAUDE.md Section 6.
  Please invoke it before proceeding."
- Provide invocation command: `/skill systematic-debugging` or Task tool call

**Time Cost:**

- Per User Message: +100ms (pattern matching + conversation analysis)
- Per Session: ~500ms (if 5-6 agent-requiring requests)

**Technical Debt:**

- **Maintenance:** High - must track conversation state across multiple messages
- **False Positives:** Medium-High - user may use agent but hook doesn't detect
  it (e.g., manual Task tool call vs. skill shortcut)
- **Bypass Risk:** High - user could rephrase request to avoid triggers
- **Update Frequency:** Monthly (as agent trigger patterns evolve)

**Edge Cases:**

- User may invoke agent via different method (Task tool vs. Skill tool)
- Agent may fail and user falls back to manual work (need override mechanism)
- Multi-turn conversations may lose context (need persistent state)

**Implementation Complexity:** 🔴 High (requires stateful tracking across
messages, complex detection logic)

**Recommendation:** Start with soft reminders (WARN mode) rather than blocking.
Gather metrics on false positive rate for 1 month before enabling BLOCK mode.

---

### 7. SESSION_DECISIONS.md Auto-Save Prompt

**Gap:** CLAUDE.md Section 7 says "Auto-save when presenting 3+ options" but
this isn't enforced.

**Trigger:**

- PostToolUse hook on AskUserQuestion tool
- `questions` array has 3+ items OR single question with 3+ options

**Action:**

- **PROMPT** (not block)
- Output: "📝 Detected multi-option decision. Consider saving to
  docs/SESSION_DECISIONS.md per CLAUDE.md Section 7."
- Provide template snippet

**Time Cost:**

- Per AskUserQuestion: +10ms (count questions/options)
- Per Session: Negligible (1-2 multi-option prompts per session)

**Technical Debt:**

- **Maintenance:** Very Low - detection is trivial (count array length)
- **False Positives:** Very Low - only triggers on actual multi-option questions
- **Bypass Risk:** None - just a reminder, not enforcement
- **Update Frequency:** Never (logic is stable)

**Edge Cases:**

- Trivial multi-option questions (e.g., "Which color: red, blue, green?") don't
  need documentation
  - Mitigation: Only trigger if question text contains "architecture",
    "feature", "implement", "approach"

**Implementation Complexity:** 🟢 Very Low (10 lines of JS)

---

### 8. Repository Pattern Validator

**Gap:** CLAUDE.md Section 3 says "Add queries to service files, not inline in
components" but no validation exists.

**Trigger:**

- PostToolUse hook on Write/Edit tools
- File path matches `app/**/*.{tsx,jsx}` (React components)
- Content contains Firestore query methods: `collection()`, `doc()`, `query()`,
  `getDocs()`, `getDoc()`

**Action:**

- **WARN** (not block - may be temporary during refactoring)
- Output: "⚠️ Firestore queries detected in React component. Consider moving to
  lib/firestore-service.ts per CLAUDE.md Section 3."
- Suggest pattern:
  `import { getJournalEntries } from '@/lib/firestore-service';`

**Time Cost:**

- Per Write/Edit: +80ms (path check + regex scan for Firestore APIs)
- Per Session: ~300ms (if editing 3-4 components)

**Technical Debt:**

- **Maintenance:** Low - Firestore API surface is stable
- **False Positives:** Medium - valid use cases exist (admin panel, one-off
  reads)
- **Bypass Risk:** Low - warning only, not blocker
- **Update Frequency:** Quarterly (when architecture patterns change)

**Edge Cases:**

- Admin panel components may need direct Firestore access (allowlist:
  `app/admin/**`)
- One-time migration scripts (allowlist: `scripts/**`)
- Test files mocking Firestore (allowlist: `**/*.test.tsx`)

**Implementation Complexity:** 🟢 Low-Medium (30 lines of JS, similar to
pattern-check.js)

---

### 9. API Key/Secret Scanner

**Gap:** Pattern check runs post-write, but secrets could be committed to git.

**Trigger:**

- PreToolUse hook on Bash tool
- Command contains `git add` or `git commit`
- Scan staged files for patterns: `apiKey`, `secret`, `password`, `token`,
  `API_KEY`, `FIREBASE_CONFIG`

**Action:**

- **WARN** with high severity
- Output: "🚨 Potential secret detected in staged files. Review before
  committing. Use .env files instead."
- List files and line numbers with matches

**Time Cost:**

- Per git add/commit: +150ms (scan all staged files)
- Per Session: ~600ms (if 4 commits per session)

**Technical Debt:**

- **Maintenance:** Medium - must maintain secret pattern list
- **False Positives:** High - many matches are benign (e.g., TypeScript
  interfaces: `apiKey: string`)
  - Mitigation: Check if value is a string literal (regex: `apiKey\s*=\s*['"]`)
- **Bypass Risk:** Medium - users may ignore warnings
- **Update Frequency:** Monthly (as new secret types are identified)

**Edge Cases:**

- `.env.example` files should be allowed (they contain placeholders, not real
  secrets)
- Test fixtures may contain fake secrets (allowlist: `**/__fixtures__/**`)
- Documentation may reference secret names (allowlist: `docs/**/*.md`)

**Implementation Complexity:** 🟡 Medium (50 lines of JS + git integration)

**Recommendation:** Start conservative (only flag high-confidence patterns like
`apiKey = "sk-..."`), expand gradually based on false positive rate.

---

### 10. TypeScript Strict Mode Check

**Gap:** New files may be created without `strict: true` compliance.

**Trigger:**

- PostToolUse hook on Write tool (new files only)
- File extension is `.ts` or `.tsx`
- Content contains `any` type or missing return types on functions

**Action:**

- **WARN** (not block - refactoring may introduce temporary `any`)
- Output: "⚠️ TypeScript strict mode violations detected: `any` types or missing
  return types. See tsconfig.json."
- Suggest: "Add explicit types or use `unknown` instead of `any`"

**Time Cost:**

- Per new file: +100ms (TypeScript AST parse or regex scan)
- Per Session: ~200ms (if creating 2 new files)

**Technical Debt:**

- **Maintenance:** Low - TypeScript syntax is stable
- **False Positives:** Low - detection is straightforward
- **Bypass Risk:** Low - warning only, tsc will catch violations at compile time
- **Update Frequency:** Rarely (TypeScript version upgrades)

**Edge Cases:**

- Migration from JS to TS may require temporary `any` (add
  `// eslint-disable-next-line @typescript-eslint/no-explicit-any` for
  exceptions)
- Third-party library types may force `any` (allowlist known libraries)

**Implementation Complexity:** 🟢 Low-Medium (regex for `any` keyword, function
signature parsing)

---

### 11. Zod Schema Sync Validator

**Gap:** TypeScript interfaces and Zod schemas may drift out of sync.

**Trigger:**

- PostToolUse hook on Write/Edit tools
- File path matches `types/**/*.ts` or `functions/src/schemas.ts`
- Content contains both `interface` and `z.object()` for same entity

**Action:**

- **WARN** (not block - intentional divergence may exist)
- Output: "⚠️ TypeScript interface and Zod schema found for same entity. Ensure
  they're in sync or use `z.infer<>`."
- Suggest: `type User = z.infer<typeof userSchema>;` (derive TS from Zod)

**Time Cost:**

- Per Write/Edit: +120ms (AST parse to find interfaces/schemas)
- Per Session: ~240ms (if editing 2 schema files)

**Technical Debt:**

- **Maintenance:** Medium - must maintain entity name mapping (interface User ↔
  userSchema)
- **False Positives:** Medium - not all interfaces need Zod schemas (internal
  types)
- **Bypass Risk:** Low - warning only, runtime validation will catch drift
- **Update Frequency:** Quarterly (as schema patterns evolve)

**Edge Cases:**

- Some interfaces are client-only (no Zod schema needed)
- Some schemas are server-only (no interface needed)
- Intentional divergence (interface has extra fields for UI state)

**Implementation Complexity:** 🔴 High (requires AST parsing, entity name
normalization, sophisticated diffing)

**Recommendation:** Defer until schema management becomes a pain point. Current
manual review is adequate for small codebase.

---

### 12. Console.log Production Block

**Gap:** `console.log()` may be left in production code.

**Trigger:**

- PostToolUse hook on Write/Edit tools
- File path matches `app/**/*.{ts,tsx}` (not in `scripts/` or tests)
- Content contains `console.log(`, `console.debug(`

**Action:**

- **WARN** (not block - may be intentional for debugging)
- Output: "⚠️ console.log() detected in application code. Use logger or remove
  before production."
- Suggest: `import { logger } from '@/lib/logger';`

**Time Cost:**

- Per Write/Edit: +20ms (simple string search)
- Per Session: ~100ms (if editing 5 files)

**Technical Debt:**

- **Maintenance:** Very Low - detection is trivial
- **False Positives:** Medium - legitimate use cases exist (debugging, temporary
  logs)
- **Bypass Risk:** Low - ESLint can catch this at build time
- **Update Frequency:** Never

**Edge Cases:**

- Development utilities may need console.log (allowlist: `lib/dev-tools.ts`)
- Error boundaries may log to console (allowlist: error handling contexts)

**Implementation Complexity:** 🟢 Very Low (5 lines of JS)

**Recommendation:** Add as ESLint rule (`no-console`) with auto-fix instead of
hook. Hook adds latency without providing auto-fix.

---

## 🟢 Tier 3: Quality of Life & Developer Experience

### 13. Session End Reminder

**Gap:** CLAUDE.md mentions `/session-end` but there's no hook enforcing it.

**Trigger:**

- Idle detection (no tool use for 10 minutes) OR
- User says "done", "finished", "that's all" OR
- Session exceeds 2 hours

**Action:**

- **PROMPT** (not block)
- Output: "📋 Session ending? Consider running `/session-end` checklist per
  CLAUDE.md."

**Time Cost:**

- Per Session: +5ms (one-time check)
- Negligible impact

**Technical Debt:**

- **Maintenance:** Very Low - detection is simple
- **False Positives:** None - just a reminder
- **Bypass Risk:** None - user can ignore
- **Update Frequency:** Never

**Edge Cases:**

- Short sessions (<30 min) may not need full checklist (skip reminder if <30
  min)

**Implementation Complexity:** 🟢 Very Low (5 lines of JS)

---

### 14. Large Context Warning

**Gap:** No warning when operations might cause context issues.

**Trigger:**

- PostToolUse hook on Read/Glob tools
- Single read >5000 lines OR
- Session has read >15 files in last 5 messages

**Action:**

- **WARN** (informational)
- Output: "⚠️ Large context detected. Consider creating a checkpoint with
  `/checkpoint` before proceeding."

**Time Cost:**

- Per Read/Glob: +20ms (line count, track file count)
- Per Session: ~100ms (if 5 large reads)

**Technical Debt:**

- **Maintenance:** Very Low - thresholds may need tuning
- **False Positives:** Low - can adjust thresholds based on feedback
- **Bypass Risk:** None - informational only
- **Update Frequency:** Quarterly (as context limits change)

**Edge Cases:**

- Exploration sessions legitimately read many files (raise threshold after
  warning once)

**Implementation Complexity:** 🟢 Low (15 lines of JS + stateful counter)

---

### 15. Plan Mode Suggestion

**Gap:** Multi-step implementations should use Plan mode, but no hook suggests
this.

**Trigger:**

- UserPromptSubmit hook
- User request contains "implement", "add feature", "refactor" AND
- Request is >50 words OR contains "and" 3+ times (suggesting multi-step)

**Action:**

- **SUGGEST** (not block)
- Output: "💡 Multi-step task detected. Consider entering Plan mode with
  EnterPlanMode tool for better organization."

**Time Cost:**

- Per User Message: +80ms (word count, keyword detection)
- Per Session: ~300ms (if 4 multi-step requests)

**Technical Debt:**

- **Maintenance:** Low - detection heuristics are stable
- **False Positives:** Medium - short multi-step tasks may not need planning
- **Bypass Risk:** None - suggestion only
- **Update Frequency:** Quarterly (refine heuristics based on feedback)

**Edge Cases:**

- Simple multi-step tasks (e.g., "fix A and B") don't need planning (check for
  complexity keywords like "architecture", "design")

**Implementation Complexity:** 🟢 Low-Medium (30 lines of JS)

---

### 16. Component File Size Limit

**Gap:** Components can grow unwieldy without size warnings.

**Trigger:**

- PostToolUse hook on Write/Edit tools
- File path matches `app/**/*.tsx`
- Line count >300 OR function count >5

**Action:**

- **WARN** (not block)
- Output: "⚠️ Large component detected (>300 lines). Consider splitting into
  smaller components."
- Suggest: Extract sub-components or custom hooks

**Time Cost:**

- Per Write/Edit: +10ms (line count)
- Per Session: ~50ms (if editing 5 components)

**Technical Debt:**

- **Maintenance:** Very Low - thresholds rarely change
- **False Positives:** Low - 300-line limit is generous
- **Bypass Risk:** Low - informational only
- **Update Frequency:** Rarely

**Edge Cases:**

- Complex forms may legitimately exceed 300 lines (raise threshold to 500 for
  `app/**/*Form.tsx` pattern)

**Implementation Complexity:** 🟢 Very Low (10 lines of JS)

---

### 17. Commit Message Format Check

**Gap:** Commit messages may not follow conventional commits standard.

**Trigger:**

- PreToolUse hook on Bash tool
- Command contains `git commit -m`
- Message doesn't match pattern:
  `^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:.+`

**Action:**

- **WARN** (not block - emergency commits may skip formatting)
- Output: "⚠️ Commit message should follow conventional commits:
  `type(scope): message`. See https://conventionalcommits.org"
- Example: `feat(auth): add password reset functionality`

**Time Cost:**

- Per Commit: +50ms (regex match)
- Per Session: ~200ms (if 4 commits)

**Technical Debt:**

- **Maintenance:** Very Low - conventional commits spec is stable
- **False Positives:** Medium - users may prefer different formats
- **Bypass Risk:** High - users can easily ignore
- **Update Frequency:** Rarely

**Edge Cases:**

- Merge commits have different format (allowlist: starts with "Merge")
- Revert commits (allowlist: starts with "Revert")

**Implementation Complexity:** 🟢 Low (10 lines of JS)

**Recommendation:** Only enable if team agrees on conventional commits.
Otherwise, skip to avoid friction.

---

## 🚫 Tier 4: Not Recommended (Better Alternatives Exist)

### 18. Import Depth Limit (❌ Skip)

**Why Skip:** ESLint rule `import/no-cycle` already detects circular
dependencies. Adding a hook is redundant and adds latency (+50ms per edit).

**Alternative:** Configure ESLint `import/max-dependencies` rule instead.

---

### 19. Unused Import Detector (❌ Skip)

**Why Skip:** TypeScript compiler and ESLint `@typescript-eslint/no-unused-vars`
already catch this. Hook would add +200ms per edit for minimal value.

**Alternative:** Enable `"noUnusedLocals": true` in tsconfig.json.

---

### 20. Documentation Freshness Check (❌ Skip)

**Why Skip:** High false positive rate (legitimate stale docs) and expensive to
compute (+300ms per edit). Better to rely on manual review during code reviews.

**Alternative:** Add quarterly "documentation audit" sprint task instead.

---

## 📊 Implementation Roadmap

### Phase 1: Quick Wins ✅ COMPLETE (Session #90)

**Goal:** Implement 4 high-value, low-complexity hooks

1. ✅ Session End Reminder (#13) - `session-end-reminder.js`
2. ✅ Large Context Warning (#14) - `large-context-warning.js`
3. ✅ SESSION_DECISIONS Auto-Save (#7) - `decision-save-prompt.js`
4. ✅ Component File Size Limit (#16) - `component-size-check.js`

**Status:** All hooks deployed to `.claude/hooks/` and wired in `settings.json`

---

### Phase 2: Security Foundation ✅ COMPLETE (Session #90)

**Goal:** Implement critical security hooks

1. ✅ Direct Firestore Write Block (#1) - `firestore-write-block.js` (BLOCKING)
2. ✅ Test Mocking Validator (#2) - `test-mocking-validator.js` (BLOCKING)
3. ✅ App Check Validator (#5) - `app-check-validator.js` (WARNING - until App
   Check re-enabled)

**Status:** All hooks deployed. Security hooks BLOCK operations on violations.

---

### Phase 3: Code Quality ✅ COMPLETE (Session #90)

**Goal:** Implement quality enforcement hooks

1. ✅ Pre-Commit Pattern Check (#3) - Already exists via Husky +
   `pattern-check.js`
2. ✅ TypeScript Strict Mode Check (#10) - `typescript-strict-check.js`
3. ✅ Repository Pattern Validator (#8) - `repository-pattern-check.js`

**Status:** All hooks deployed. Quality hooks WARN but don't block.

---

### Phase 4: Advanced (Week 4+)

**Goal:** Evaluate complex hooks after gathering metrics

1. ⚠️ Error Sanitization Enforcer (#4) - 4 hours (includes AST parsing)
2. ⚠️ Agent Trigger Enforcer (#6) - 6 hours (stateful, complex)
3. ⚠️ Zod Schema Sync (#11) - 8 hours (requires sophisticated diffing)

**Total Time:** ~18 hours **Expected Impact:** Catch edge cases, but high false
positive risk

**Recommendation:** Gather metrics from Phases 1-3 before investing in Phase 4.
May not be worth the complexity.

---

## 🎯 Prioritization Criteria

When deciding which hooks to implement, consider:

### ✅ High Priority If:

- Prevents security vulnerabilities (Tier 1 security hooks)
- Addresses frequently violated CLAUDE.md rules (check
  AI_REVIEW_LEARNINGS_LOG.md for patterns)
- Low implementation complexity (<2 hours)
- Low false positive risk (<10%)
- Low latency overhead (<100ms per operation)

### ⚠️ Medium Priority If:

- Improves code quality but doesn't prevent bugs
- Moderate implementation complexity (2-4 hours)
- Moderate false positive risk (10-25%)
- Moderate latency overhead (100-200ms)

### 🚫 Low Priority / Skip If:

- Already covered by ESLint/TypeScript/existing tools
- High false positive risk (>25%)
- High latency overhead (>200ms)
- Complex stateful logic (maintenance burden)
- Better solved by documentation/training

---

## 📈 Success Metrics

Track these metrics to evaluate hook effectiveness:

### Per Hook:

- **Trigger Rate:** How often does it fire? (daily/weekly)
- **Block Rate:** How often does it block operations? (% of triggers)
- **False Positive Rate:** How often is it wrong? (% of blocks that are invalid)
- **Bypass Rate:** How often do users override/ignore? (% of blocks bypassed)
- **Resolution Time:** How long to fix the issue? (median time from block to
  fix)

### Overall:

- **Code Review Cycle Time:** Decrease in rounds of feedback (target: -30%)
- **Security Incidents:** Decrease in security pattern violations (target: -80%)
- **Developer Satisfaction:** Survey AI assistant users (target: >4.0/5.0
  rating)
- **Session Productivity:** Increase in features shipped per session (target:
  +20%)

### Red Flags (Consider Disabling Hook):

- False positive rate >25%
- Bypass rate >50% (users ignore it)
- Negative developer feedback (<3.0/5.0 rating)
- Latency overhead >500ms per session

---

## 🔧 Technical Implementation Notes

### Hook Architecture:

```javascript
// Standard hook template
module.exports = {
  name: "hook-name",
  trigger: "PostToolUse", // or PreToolUse, UserPromptSubmit
  matcher: "^(?i)write$", // optional regex for tool name

  async execute(context) {
    // 1. Early exit if not applicable
    if (!shouldApply(context)) {
      return { status: "ok" };
    }

    // 2. Validate
    const violations = await validate(context);

    // 3. Return result
    if (violations.length > 0) {
      return {
        status: "block", // or 'warn', 'prompt'
        message: formatViolations(violations),
      };
    }

    return { status: "ok" };
  },
};
```

### Performance Optimization:

1. **Early exits:** Check file extension/path before expensive operations
2. **Caching:** Cache regex patterns, compiled ASTs
3. **Incremental:** Only scan changed lines (use git diff for edits)
4. **Parallel:** Run multiple hooks concurrently where possible
5. **Timeouts:** Fail gracefully if hook takes >500ms

### Error Handling:

```javascript
try {
  const result = await validate(context);
  return result;
} catch (error) {
  // Never block on hook errors - fail open
  console.error(`Hook ${name} failed:`, sanitizeError(error));
  return { status: "ok" };
}
```

**Principle:** Hooks should NEVER cause operations to fail due to hook bugs.
Always fail open (allow operation) on hook errors.

---

## 📚 References

- CLAUDE.md - Primary AI context and rules
- CODE_PATTERNS.md - Distilled patterns from 179 code reviews
- AI_REVIEW_LEARNINGS_LOG.md - Historical pattern violations
- .claude/hooks/ - Existing hook implementations
- SESSION_DECISIONS.md - Decision log for context preservation

---

## 🔄 Review Schedule

- **Weekly:** Review trigger/block metrics for Phase 1-2 hooks
- **Bi-weekly:** Tune thresholds based on false positive feedback
- **Monthly:** Evaluate Phase 3-4 candidates based on data
- **Quarterly:** Full audit of all hooks (disable low-value, high-friction
  hooks)

---

## Version History

| Version | Date       | Changes                                               |
| ------- | ---------- | ----------------------------------------------------- |
| 1.1     | 2026-01-22 | Phase 1-3 IMPLEMENTED: 9 hooks deployed (Session #90) |
| 1.0     | 2026-01-21 | Initial document with 20 hook proposals               |
