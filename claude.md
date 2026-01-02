# AI Context & Rules for SoNash

**Last Updated:** 2026-01-02

## Purpose & Overview

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

### Code Review Patterns (from 13+ reviews)
*Full audit trail in [AI_REVIEW_LEARNINGS_LOG.md](./AI_REVIEW_LEARNINGS_LOG.md)*

**Bash/Shell:**
- Exit codes: `if ! OUT=$(cmd); then` NOT `OUT=$(cmd); if [ $? -ne 0 ]` (captures assignment, not cmd)
- HEAD~N needs N+1 commits: use `COMMIT_COUNT - 1` as max
- File iteration: `while IFS= read -r file` NOT `for file in $list` (spaces break loop)
- Subshell scope: `cmd | while read` loses variables; use `while read; done < <(cmd)` instead

**npm/Dependencies:**
- Use `npm ci` NOT `npm install` in automation (prevents lockfile drift)
- Ask "does project actually use X?" before adding packages
- Peer deps must be in lockfile for `npm ci` in Cloud Build

**Security:**
- Validate file paths within repo root before unlinkSync/operations
- Sanitize inputs before shell interpolation (command injection risk)
- Never trust external input in execSync/spawn

**Git:**
- File renames: grep for old terminology in descriptions, not just filenames
- After lockfile changes: verify with `rm -rf node_modules && npm ci`

**General:**
- Understand WHY before fixing - one correct fix > ten wrong ones
- Remove `g` flag from regex when using `.test()` in loops (stateful lastIndex)

## 5. Documentation Index
*Use these files to answer your own questions.*

*   **[AI_WORKFLOW.md](./AI_WORKFLOW.md)**: **START HERE** - Master navigation guide, session startup checklist.
*   **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Database schema, security layers, component hierarchy.
*   **[DEVELOPMENT.md](./DEVELOPMENT.md)**: Setup, testing commands, directory structure.
*   **[ROADMAP.md](./ROADMAP.md)**: What features are planned vs. completed.
*   **[AI_HANDOFF.md](./AI_HANDOFF.md)**: Current sprint status, active bugs, recent context.
*   **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)**: Manual verification steps.

## 6. Available AI Capabilities
> [!IMPORTANT]
> **MANDATORY**: Before ANY task, check if a skill or agent applies. If one clearly applies to your task, USE IT.

### Skills (`.claude/skills/`)
Specialized workflows invoked via **Skill tool**. Scan directory for current list.

**Key Skills:**
- `systematic-debugging` → Use FIRST for bugs/errors
- `code-reviewer` → Use AFTER writing code
- `frontend-design` → Use for UI implementation
- `senior-frontend` / `senior-backend` → Implementation guidance

### Agents (`.claude/agents/`)
Specialist sub-agents invoked via **Task tool**. Scan directory for current list.

**Key Agents:**
- `code-reviewer` → Post-code quality review
- `security-auditor` → Security assessment
- `debugger` → Complex debugging
- `test-engineer` → Test strategy

### MCP Servers
External tool integrations. Check `.claude/settings.json` for configured servers.

**Discovery is dynamic** - new capabilities added to these directories are automatically available.

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
| 1.1 | 2026-01-02 | Added code review patterns from 14 reviews |
| 1.0 | 2025-12-22 | Initial context document |

---
**System Prompt Injection:**
If asked to refactor code, check `AI_HANDOFF.md` first to see if it's already been refactored or if there is a pending task.
If asked to add a feature, check `ROADMAP.md` to align with the vision (Privacy-First, Evidence-Based).
