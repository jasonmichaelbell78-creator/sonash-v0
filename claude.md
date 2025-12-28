# AI Context & Rules for SoNash

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

*   **Testing**: When writing tests, **MOCK `httpsCallable`**, not direct Firestore writes. The codebase uses Cloud Functions for writes. Mocking Firestore writes will lead to false positives (tests pass, app fails).
*   **Account Linking**: `migrateAnonymousUserData` is a batch operation. It handles the merge. Do not attempt to merge manually on the client.
*   **Google OAuth**: Requires specific COOP/COEP headers in `firebase.json` to work correcty in popups. Do not remove them.
*   **Meeting Widgets**: Hoisting bugs in `setInterval` are common. Always define callbacks `useCallback` *before* the effect.

## 5. Documentation Index
*Use these files to answer your own questions.*

*   **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Database schema, security layers, component hierarchy.
*   **[DEVELOPMENT.md](./DEVELOPMENT.md)**: Setup, testing commands, directory structure.
*   **[ROADMAP.md](./ROADMAP.md)**: What features are planned vs. completed.
*   **[AI_HANDOFF.md](./AI_HANDOFF.md)**: Current sprint status, active bugs, recent context.
*   **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)**: Manual verification steps.

## 6. Coding Standards
*   **Language**: TypeScript (Strict Mode). No `any`.
*   **Components**: React Functional Components + Hooks.
*   **Styling**: Tailwind CSS (Utility-first). No inline styles unless dynamic (e.g., animations).
*   **State**: `useState` for local, Context for global (`AuthContext`), Firestore for server state.
*   **Validation**: Zod (runtime) matching TypeScript interfaces (static).

---
**System Prompt Injection:**
If asked to refactor code, check `AI_HANDOFF.md` first to see if it's already been refactored or if there is a pending task.
If asked to add a feature, check `ROADMAP.md` to align with the vision (Privacy-First, Evidence-Based).
