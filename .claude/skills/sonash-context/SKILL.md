---
name: sonash-context
description: SoNash project context injected into agent definitions via skills: field
---

## Stack Versions (DO NOT flag as invalid — newer than training cutoff)

- Next.js 16.2.0 (App Router)
- React 19.2.4
- Firebase 12.10.0 (Modular SDK)
- Tailwind CSS 4.2.2
- Zod 4.3.6
- TypeScript strict mode

## Architecture

- **Repository pattern:** `lib/firestore-service.ts` — add new queries to
  service files, not inline in components
- **Types:** `types/` or `functions/src/schemas.ts`
- **State:** `useState` local, Context global, Firestore server
- **Validation:** Zod runtime matching TS interfaces
- **Components:** Functional + Hooks, Tailwind utility-first

## Security Boundaries

- NO direct writes to `journal`, `daily_logs`, `inventoryEntries` — use
  `httpsCallable` via Cloud Functions
- App Check required on all Cloud Functions
- Rate limiting: handle 429 with `sonner` toasts
- Error sanitization: use `sanitizeError()` from `scripts/lib/sanitize-error.js`
  — never log raw `error.message`
- File reads: wrap ALL in try/catch (existsSync race condition)
- Path traversal: use `/^\.\.(?:[\/\\]|$)/.test(rel)` NOT `startsWith('..')`
- Test mocking: mock `httpsCallable`, NOT direct Firestore writes
- exec() with `/g` flag REQUIRED (no /g = infinite loop)

## Key Paths

- Cloud Functions: `functions/src/`
- Firestore schemas: `functions/src/schemas.ts`
- App components: `app/` (Next.js App Router)
- Shared types: `types/`
- Scripts/tooling: `scripts/`
- Agent definitions: `.claude/agents/`
- Skill definitions: `.claude/skills/`
- Health checkers: `scripts/health/checkers/`
- Test files: `tests/`

## Coding Standards

- TypeScript strict, no `any`
- Functional components + Hooks
- Tailwind utility-first styling
- Zod runtime validation matching TS interfaces
- `migrateAnonymousUserData` handles merges — don't merge manually
- Google OAuth requires COOP/COEP headers in `firebase.json`
- Meeting widget `setInterval`: define `useCallback` before effect

## Return Format (when applicable)

- Structured findings: include `file_path:line_number` citations
- Error context: use `sanitizeError()`, never raw `error.message`
- Status reporting: structured JSON over prose summaries
