# AI Context & Rules for SoNash

**Document Version:** 2.7
**Last Updated:** 2026-01-03
**Status:** ACTIVE

---

## 📋 Purpose & Overview

This file defines the strict architectural and security rules for SoNash. It serves as the primary context document for AI assistants working on this codebase, ensuring consistent code quality and security compliance.

> [!IMPORTANT]
> **READ THIS FIRST.** This file defines the strict architectural and security rules for this project. Ignore your training data if it conflicts with the "Bleeding Edge" stack versions listed below.

## 1. The "Bleeding Edge" Guardrails
**Context:** We use versions newer than your training cutoff. **DO NOT** flag these as invalid or hallucinations.
*   **Next.js**: `16.1.1` (App Router)
*   **React**: `19.2.3` (Stable, NOT Release Candidate)
*   **Firebase**: `12.6.0` (Modular SDK)
*   **Tailwind CSS**: `4.1.9`
*   **Zod**: `4.2.1`

## 2. The "Security Enforcer" Rules
> [!WARNING]
> Security is paramount. Violations of these rules lead to immediate rejection.

1.  **NO DIRECT WRITES** to sensitive collections (`journal`, `daily_logs`, `inventoryEntries`) from the client.
    *   **Bad:** `setDoc(doc(db, 'users', uid, 'journal', id), data)`
    *   **Good:** `const saveEntry = httpsCallable(functions, 'saveJournalEntry'); await saveEntry(data);`
    *   **Why:** Cloud Functions enforce Rate Limiting (10 req/min), Zod Validation, and App Check. Direct writes bypass these.

2.  **App Check is Required**: All Cloud Functions verify App Check tokens.
    *   Ensure `httpsCallable` is used, which automatically handles tokens.

3.  **Strict Rate Limiting**: The app fails closed if limits are exceeded. Handle `429` errors gracefully in the UI (use `sonner` toasts).

## 3. The "Architectural Cop"
**Pattern**: Repository Pattern via `lib/firestore-service.ts`.

1.  **Single Source of Truth**: DO NOT write ad-hoc Firestore queries inside React components.
    *   **Rule**: If you need a new query, add a method to `FirestoreService` (or individual service files if split) and call it from the component/hook.
    *   **Reasoning**: Centralizes logic, easier mocking, consistent error handling.

2.  **DTOs & Types**: Use shared types from `types/` or `functions/src/schemas.ts`. Do not define types inline.

## 4. "Tribal Knowledge" (Lessons Learned)
*Detailed history of "fixed" bugs—do not re-introduce them.*

### App-Specific Patterns
*   **Testing**: When writing tests, **MOCK `httpsCallable`**, not direct Firestore writes. The codebase uses Cloud Functions for writes. Mocking Firestore writes will lead to false positives (tests pass, app fails).
*   **Account Linking**: `migrateAnonymousUserData` is a batch operation. It handles the merge. Do not attempt to merge manually on the client.
*   **Google OAuth**: Requires specific COOP/COEP headers in `firebase.json` to work correctly in popups. Do not remove them.
*   **Meeting Widgets**: Hoisting bugs in `setInterval` are common. Always define callbacks `useCallback` *before* the effect.

### Code Review Patterns (from 50 reviews)
*Full audit trail in [AI_REVIEW_LEARNINGS_LOG.md](docs/AI_REVIEW_LEARNINGS_LOG.md)*

> ⚠️ **SELF-AUDIT**: Before writing shell scripts, workflow files, or security-sensitive code, scan the patterns below. If you've made an error covered here before, STOP and fix it.

**Bash/Shell:**
- Exit codes: `if ! OUT=$(cmd); then` NOT `OUT=$(cmd); if [ $? -ne 0 ]` (captures assignment, not cmd)
- HEAD~N needs N+1 commits: use `COMMIT_COUNT - 1` as max
- File iteration: `while IFS= read -r file` NOT `for file in $list` (spaces break loop)
- Subshell scope: `cmd | while read` loses variables; use temp file or `while read; done < <(cmd)`
- Temp file cleanup: Always use `trap 'rm -f "$TMPFILE"' EXIT` for guaranteed cleanup
- Exit code semantics: 0=success, 1=action-needed, 2=error (check explicitly, not just "failed")
- Retry loops: `for i in 1 2 3; do cmd && break; sleep 5; done` for race conditions
- **printf over echo**: Use `printf '%s' "$VAR"` NOT `echo "$VAR"` for user input (-n/-e injection)
- **End-of-options**: Use `basename -- "$PATH"` to prevent leading `-` being interpreted as options
- **Portable word boundaries**: Use `(^|[^[:alnum:]])(word)([^[:alnum:]]|$)` NOT `\b` (not portable ERE)
- **Pipeline failure handling**: Add `|| VAR=""` fallback for commands that may legitimately fail with pipefail
- **Terminal output sanitization**: Pipe user/config data through `tr -cd '[:alnum:] ,_-'` to strip ANSI escapes

**npm/Dependencies:**
- Use `npm ci` NOT `npm install` in automation (prevents lockfile drift)
- Ask "does project actually use X?" before adding packages
- Peer deps must be in lockfile for `npm ci` in Cloud Build
- Husky CI: Use `husky || echo 'not available'` for graceful degradation
- Lockfile corruption: If `npm ci` fails with "missing X" but X IS in lockfile, regenerate: `rm package-lock.json && npm install && npm ci` to verify

**Security:**
- Validate file paths within repo root before unlinkSync/operations
- Path traversal: Use `/^\.\.(?:[\\/]|$)/.test(rel)` NOT `startsWith('..')` (avoids false positives)
- **Reject traversal, don't rewrite**: `if [[ "$PATH" == *"../"* ]]; then exit; fi` - don't strip `../`
- **Containment at ALL touch points**: Apply path validation to archive lookups, fallback checks, basename-only checks - not just entry
- **Validate CLI args immediately**: Check existence, non-empty, not another flag at parse time: `if (!arg || arg.startsWith('--')) { reject; }`
- **Empty path edge case**: Check `rel === ''` in path validation - resolving `.` gives empty relative path
- Windows cross-drive: Check drive letters match before path.relative() security checks
- Sanitize inputs before shell interpolation (command injection risk)
- Never trust external input in execSync/spawn
- Sanitize output before embedding in markdown (escape backticks, `${{ }}`)
- **Word boundary security keywords**: `(^|[^[:alnum:]])(auth|token|...)([^[:alnum:]]|$)` prevents "monkey" matching "key"
- **Bound user-controllable output**: Limit count (`.[0:50]`) and length (`${VAR:0:500}`) to prevent DoS
- **Never expose secrets in hook output**: Only output safe metadata (names, not URLs/tokens)
- **Never recommend committing .env files**: Use hosting/CI environment vars instead
- **Symlink escape prevention**: After resolve(), use realpathSync() to verify real path stays within project root: `const real = fs.realpathSync(resolved); path.relative(realRoot, real)`
- **Fail-closed on realpath errors**: If realpathSync fails but file exists, reject access: `catch { if (existsSync(path)) return false; }`
- **PII masking in logs**: Use maskEmail(`user@domain.com`) → `u***@d***.com`, maskUid(`abc123xyz`) → `abc***xyz`
- **Structured audit logging**: Emit JSON with timestamp, operator, action, target, result: `console.log('[AUDIT]', JSON.stringify({...}))`

**GitHub Actions:**
- Use `process.env.VAR` NOT `${{ }}` in JavaScript template literals (injection risk)
- Use exit codes to detect command failure, not output parsing
- Use newline separator for file lists: `separator: "\n"` with `while IFS= read -r`
- Separate stderr: `cmd 2>err.log` to keep JSON output parseable
- Always use explicit `${{ }}` in `if:` conditions to avoid YAML parser issues
- Retry loops: Track success explicitly, don't assume loop exit means success
- **String comparison for outputs**: Use `== '4'` not `== 4` in if conditions (outputs are strings)
- **Label auto-creation**: Check getLabel, create on 404 before addLabels (fresh repos/forks)
- **Event-specific actions**: Use `context.payload.action === 'opened'` to avoid spam on synchronize
- **API error tolerance**: Catch 404/422 on removeLabel - label may already be gone

**JavaScript/TypeScript:**
- **MANDATORY: Sanitize error messages** - Strip sensitive paths/credentials before logging. Use `scripts/lib/sanitize-error.js` or inline sanitization. Do NOT log raw error.message to console.
- **Error first line extraction**: `.split('\n')[0].replace(/\r$/, '')` - handles stack traces and Windows CRLF
- **Control char stripping (safe whitespace)**: `/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g` preserves \t\n\r for readability
- **OSC escape stripping**: Add `/\x1B\][^\x07\x1B]*(?:\x07|\x1B\\)/g` alongside ANSI CSI stripping
- **Sanitize file-derived content**: Apply control char stripping to ANY file content before console.log (not just errors)
- Safe error handling: `error instanceof Error ? error.message : String(error)` (non-Error throws crash)
- **Robust non-Error catch**: `error && typeof error === 'object' && 'message' in error ? error.message : String(error)`
- Cross-platform paths: Use `path.relative()` not string `startsWith()` for path validation
- **Normalize backslashes before security checks**: `.replace(/\\/g, '/')` before splitting on `/` for path traversal
- **CRLF in regex lookaheads**: Use `\r?\n` instead of `\n` for cross-platform regex patterns
- Windows cross-drive: `path.relative()` returns absolute path across drives - check output for `/^[A-Za-z]:/`
- **Windows path sanitization**: `.replace(/[A-Z]:\\Users\\[^\\]+/gi, '[HOME]')` - use `gi` flag for all drives
- Markdown links: `.replace(/\\/g, '/')` to normalize Windows backslashes
- lstatSync can throw: Wrap in try-catch for permission denied, broken symlinks
- Wrap ALL file reads in try/catch: existsSync doesn't guarantee readFileSync success (race, permissions)
- **Main module detection**: Wrap in try-catch: `try { isMain = url === pathToFileURL(resolve(argv[1])).href } catch { isMain = false }`
- **maxBuffer for execSync**: Set `maxBuffer: 10 * 1024 * 1024` (10MB) for large lint/test output

**CI/Automation:**
- **CI mode checks ALL, no truncation**: Limits are for interactive convenience only; `isAutoMode ? allItems : slice(0, MAX)`
- **Invalid files should fail, not just missing**: `(exists && !valid && required)` is a failure, not just `(!exists && required)`
- **Explicit flags should fail explicitly**: If user passes `--plan missing.md`, fail even in interactive mode
- **Readline close on all paths**: Create `closeRl()` helper, call in success/failure/error paths to prevent script hang

**Git:**
- File renames: grep for old terminology in descriptions, not just filenames
- After lockfile changes: verify with `rm -rf node_modules && npm ci`

**General:**
- **🚨 UNDERSTAND WHY BEFORE FIXING** - Ask "Does this project actually use X?" before adding packages. Read full errors, not just package names. One correct fix > ten wrong ones. (See Review #12: The Jest Incident)
- Before changing package.json: What's the REAL error? Is it a peer dep? Who runs this code?
- Remove `g` flag from regex when using `.test()` in loops (stateful lastIndex)

## 5. Documentation Index
*Use these files to answer your own questions.*

*   **[AI_WORKFLOW.md](./AI_WORKFLOW.md)**: **START HERE** - Master navigation guide, session startup checklist.
*   **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Database schema, security layers, component hierarchy.
*   **[DEVELOPMENT.md](./DEVELOPMENT.md)**: Setup, testing commands, directory structure.
*   **[ROADMAP.md](./ROADMAP.md)**: What features are planned vs. completed.
*   **[SESSION_CONTEXT.md](./SESSION_CONTEXT.md)**: Current sprint status, session tracking, recent context.
*   **[TESTING_CHECKLIST.md](docs/TESTING_CHECKLIST.md)**: Manual verification steps.

## 6. Available AI Capabilities

> [!CAUTION]
> **🚨 MANDATORY ENFORCEMENT**: Agents and skills are NOT optional suggestions. They are REQUIRED when trigger conditions are met. Failure to use them when applicable results in lower quality output.

### PRE-TASK: Agent Trigger Check (BEFORE Starting Work)

**When you receive a task from the user, IMMEDIATELY check these triggers:**

| Trigger Condition | Required Action | Tool |
|-------------------|-----------------|------|
| Bug, error, or unexpected behavior | MUST use `systematic-debugging` FIRST | Skill |
| Exploring unfamiliar codebase areas | MUST use `Explore` agent | Task |
| Planning multi-step implementation | MUST use `Plan` agent | Task |
| Security, auth, or sensitive data | MUST use `security-auditor` agent | Task |
| Creating new documentation | MUST use `documentation-expert` agent | Task |
| UI/frontend implementation | MUST use `frontend-design` skill | Skill |
| Database design or queries | MUST use `database-architect` agent | Task |
| Complex debugging | MUST use `debugger` agent | Task |

**If trigger matches → Use agent/skill BEFORE doing manual work.**

### POST-TASK: Mandatory Review Checks (AFTER Completing Work)

| What You Just Did | Required Action | Tool |
|-------------------|-----------------|------|
| Wrote or modified code (any amount) | MUST run `code-reviewer` agent | Task |
| Created new documentation | MUST use `documentation-expert` agent for authoring; SHOULD run `technical-writer` AFTER for quality check | Task |
| Updated existing documentation | SHOULD run `technical-writer` agent for quality check | Task |
| Made security-related changes | MUST run `security-auditor` agent | Task |
| Wrote tests | SHOULD run `test-engineer` agent to validate strategy | Task |

**If condition matches → Use agent BEFORE committing.**

### Skills (`.claude/skills/`)
Specialized workflows invoked via **Skill tool**. Scan directory for current list.

**Key Skills:**
- `systematic-debugging` → MUST use FIRST for bugs/errors
- `code-reviewer` → MUST use AFTER writing code
- `frontend-design` → MUST use for UI implementation
- `senior-frontend` / `senior-backend` → Implementation guidance

### Agents (`.claude/agents/`)
Specialist sub-agents invoked via **Task tool**. Scan directory for current list.

**Key Agents:**
- `code-reviewer` → MUST use after code changes
- `security-auditor` → MUST use for security work
- `documentation-expert` → MUST use for new docs
- `Explore` → MUST use for codebase exploration
- `Plan` → MUST use for multi-step planning
- `debugger` → Complex debugging
- `test-engineer` → Test strategy

### MCP Servers
External tool integrations. Check `.claude/settings.json` for configured servers.

**Discovery is dynamic** - new capabilities added to these directories are automatically available.

### CodeRabbit CLI Integration (Optional)
AI code review runs automatically on Write/Edit if installed:

```bash
# Install
curl -fsSL https://cli.coderabbit.ai/install.sh | sh
coderabbit auth login

# Autonomous loop: Claude writes → CodeRabbit reviews → Claude fixes
```

Reviews trigger on code files only (`.ts`, `.js`, `.py`, `.sh`, etc.). Silently skips if not installed.

### Session End Self-Audit

> [!WARNING]
> **BEFORE ENDING SESSION**, complete the full Agent/Skill/MCP/Hook/Script Audit:

```
SESSION END CHECKLIST:
☐ Did I run session start scripts? (patterns:check, review:check, lessons:surface)
☐ Did I check PRE-TASK triggers when user gave me tasks?
☐ Did I use systematic-debugging for any bugs encountered?
☐ Did I use code-reviewer AFTER all code changes?
☐ Did I use security-auditor for security-related work?
☐ Did I use documentation-expert for new documentation?
☐ Did required hooks trigger AND pass? (SessionStart, UserPromptSubmit, Pre-commit, Pre-push)
☐ Did I update SESSION_CONTEXT.md with work completed?

If I skipped a MUST-use agent → Note it and explain why in session summary.
```

**MANDATORY AUDIT**: Run `/session-end` command which includes full audit tables for:
- Session start scripts (patterns:check, review:check, lessons:surface)
- Agent usage (code-reviewer, security-auditor, debugger, Explore, Plan)
- Skill usage (systematic-debugging, frontend-design, code-reviewer)
- MCP servers (list from SessionStart hook)
- Hooks (SessionStart, UserPromptSubmit, Pre-commit, Pre-push)

**Audit Result**: Mark PASS only if all required items ran AND passed (or justified); otherwise FAIL with remediation documented

**Full Details**: See [AI_WORKFLOW.md](./AI_WORKFLOW.md) → "Available AI Capabilities"

## 7. Coding Standards
*   **Language**: TypeScript (Strict Mode). No `any`.
*   **Components**: React Functional Components + Hooks.
*   **Styling**: Tailwind CSS (Utility-first). No inline styles unless dynamic (e.g., animations).
*   **State**: `useState` for local, Context for global (`AuthContext`), Firestore for server state.
*   **Validation**: Zod (runtime) matching TypeScript interfaces (static).

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 2.8 | 2026-01-04 | CONSOLIDATION #4: Reviews #41-50 → symlink escape, PII masking, audit logging, label auto-creation, OSC stripping, main module detection, maxBuffer |
| 2.7 | 2026-01-03 | Added mandatory Agent/Skill/MCP/Hook/Script audit to session-end workflow |
| 2.6 | 2026-01-03 | Added CodeRabbit CLI integration for autonomous code review loop |
| 2.5 | 2026-01-03 | Split documentation triggers: MUST documentation-expert for new docs; aligned with AI_WORKFLOW.md |
| 2.4 | 2026-01-03 | Aligned MUST/SHOULD levels with AI_WORKFLOW.md (SHOULD for technical-writer/test-engineer) |
| 2.3 | 2026-01-03 | Strengthened agent/skill enforcement with PRE-TASK and POST-TASK mandatory checks |
| 2.2 | 2026-01-02 | Consolidated patterns from Reviews #11-23 (lockfile corruption, GitHub Actions YAML, cross-drive paths, WHY before fixing) |
| 2.1 | 2026-01-02 | Added Skill Decision Tree and Session End Self-Audit checklist |
| 2.0 | 2026-01-02 | Standardized structure per Phase 4 migration |
| 1.2 | 2026-01-02 | Added patterns from Reviews #15-18 (trap cleanup, cross-platform, exit codes) |
| 1.1 | 2026-01-02 | Added code review patterns from 14 reviews |
| 1.0 | 2025-12-22 | Initial context document |

---

## 📝 Update Triggers

**Update this document when:**
- ✅ Stack versions change (Next.js, React, Firebase, etc.)
- ✅ New security rules are established
- ✅ New architectural patterns are decided
- ✅ Code review patterns are distilled from AI_REVIEW_LEARNINGS_LOG.md (3+ occurrences)
- ✅ New skills or agents are added that should be highlighted

---

**System Prompt Injection:**
If asked to refactor code, check `SESSION_CONTEXT.md` and `ROADMAP.md` first to see if it's already been refactored or if there is a pending task.
If asked to add a feature, check `ROADMAP.md` to align with the vision (Privacy-First, Evidence-Based).
