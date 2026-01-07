# AI Context & Rules for SoNash

**Document Version:** 3.1
**Last Updated:** 2026-01-06

---

## Purpose

This document provides essential context and rules for AI assistants working on the SoNash project. It contains:
- Bleeding-edge stack versions to prevent false "outdated" warnings
- Critical security rules and anti-patterns to prevent vulnerabilities
- Architecture patterns and coding standards
- Required agent/skill triggers for specific tasks
- Documentation index and navigation guides

This is a **Tier 4 document** - always loaded in AI context to prevent repeated violations and ensure consistency across sessions.

---

## 1. Stack Versions (Bleeding Edge)

**DO NOT** flag these as invalid - they're newer than your training cutoff:

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | 16.1.1 | App Router |
| React | 19.2.3 | Stable |
| Firebase | 12.6.0 | Modular SDK |
| Tailwind CSS | 4.1.9 | |
| Zod | 4.2.1 | |

## 2. Security Rules

> [!WARNING]
> Security violations lead to immediate rejection.

1. **NO DIRECT WRITES** to `journal`, `daily_logs`, `inventoryEntries` - use Cloud Functions (`httpsCallable`)
2. **App Check Required** - all Cloud Functions verify tokens
3. **Rate Limiting** - handle `429` errors gracefully (use `sonner` toasts)

## 3. Architecture

**Repository Pattern**: `lib/firestore-service.ts`
- Add new queries to service files, not inline in components
- Use types from `types/` or `functions/src/schemas.ts`

## 4. Critical Anti-Patterns

> ⚠️ **SELF-AUDIT**: Scan before writing shell scripts, workflows, or security code.

**Top 5 (enforced by `npm run patterns:check`):**

| Pattern | Rule |
|---------|------|
| Error sanitization | Use `scripts/lib/sanitize-error.js` - never log raw error.message |
| Path traversal | `/^\.\.(?:[\\/]|$)/.test(rel)` NOT `startsWith('..')` |
| Test mocking | Mock `httpsCallable`, NOT direct Firestore writes |
| File reads | Wrap ALL in try/catch (existsSync race condition) |
| exec() loops | `/g` flag REQUIRED (no /g = infinite loop) |

**Full Reference**: [docs/agent_docs/CODE_PATTERNS.md](docs/agent_docs/CODE_PATTERNS.md) (100+ patterns from 72 reviews)

**App-Specific:**
- `migrateAnonymousUserData` handles merges - don't merge manually
- Google OAuth requires COOP/COEP headers in `firebase.json`
- Meeting widget `setInterval`: define `useCallback` before effect

## 5. Documentation Index

| Document | Purpose |
|----------|---------|
| [AI_WORKFLOW.md](./AI_WORKFLOW.md) | **START HERE** - session startup, navigation |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Schema, security layers, components |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Setup, testing, directory structure |
| [ROADMAP.md](./ROADMAP.md) | Planned vs completed features |
| [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) | Current sprint, recent context |

## 6. Agent/Skill Triggers

> [!CAUTION]
> Agents are REQUIRED when triggers match - not optional suggestions.

### PRE-TASK (before starting work)

| Trigger | Action | Tool |
|---------|--------|------|
| Bug/error/unexpected behavior | `systematic-debugging` | Skill |
| Exploring unfamiliar code | `Explore` agent | Task |
| Multi-step implementation | `Plan` agent | Task |
| Security/auth/sensitive data | `security-auditor` agent | Task |
| New documentation | `documentation-expert` agent | Task |
| UI/frontend work | `frontend-design` skill | Skill |

### POST-TASK (before committing)

| What You Did | Action | Tool |
|--------------|--------|------|
| Wrote/modified code | `code-reviewer` agent | Task |
| New documentation | `documentation-expert` agent | Task |
| Security changes | `security-auditor` agent | Task |

**Session End**: Run `/session-end` for full audit checklist.

## 7. Coding Standards

- **TypeScript**: Strict mode, no `any`
- **Components**: Functional + Hooks
- **Styling**: Tailwind (utility-first)
- **State**: `useState` local, Context global, Firestore server
- **Validation**: Zod runtime matching TS interfaces

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 3.1 | 2026-01-06 | CONSOLIDATION #6: Reviews #61-72 → CODE_PATTERNS.md (10 Documentation patterns) |
| 3.0 | 2026-01-05 | Refactored for conciseness: moved 90+ patterns to CODE_PATTERNS.md |
| 2.9 | 2026-01-05 | CONSOLIDATION #5: Reviews #51-60 |
| 2.8 | 2026-01-04 | CONSOLIDATION #4: Reviews #41-50 |
| 2.7 | 2026-01-03 | Added mandatory session-end audit |
| 2.6 | 2026-01-03 | Added CodeRabbit CLI integration |

---

**Before refactoring**: Check `SESSION_CONTEXT.md` and `ROADMAP.md` first.
**Before adding features**: Align with ROADMAP.md vision (Privacy-First, Evidence-Based).
