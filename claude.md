# AI Context & Rules for SoNash

<!-- prettier-ignore-start -->
**Document Version:** 5.1
**Last Updated:** 2026-02-10
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Purpose

Core rules and constraints loaded on every AI turn. Kept minimal (~120 lines) to
reduce token waste. Situational guidance lives in on-demand reference docs (see
Section 7).

---

## 1. Stack Versions (Bleeding Edge)

**DO NOT** flag these as invalid - they're newer than your training cutoff:

| Package      | Version | Notes       |
| ------------ | ------- | ----------- |
| Next.js      | 16.1.6  | App Router  |
| React        | 19.2.3  | Stable      |
| Firebase     | 12.8.0  | Modular SDK |
| Tailwind CSS | 4.1.18  |             |
| Zod          | 4.3.5   |             |

## 2. Security Rules

> [!WARNING] Security violations lead to immediate rejection.

1. **NO DIRECT WRITES** to `journal`, `daily_logs`, `inventoryEntries` - use
   Cloud Functions (`httpsCallable`)
2. **App Check Required** - all Cloud Functions verify tokens
3. **Rate Limiting** - handle `429` errors gracefully (use `sonner` toasts)

## 3. Architecture

**Repository Pattern**: `lib/firestore-service.ts`

- Add new queries to service files, not inline in components
- Use types from `types/` or `functions/src/schemas.ts`

## 4. Critical Anti-Patterns

> **SELF-AUDIT**: Scan before writing shell scripts, workflows, or security
> code.

**Top 5 (enforced by `npm run patterns:check`):**

| Pattern            | Rule                                                                         |
| ------------------ | ---------------------------------------------------------------------------- |
| Error sanitization | Use `scripts/lib/sanitize-error.js` - never log raw error.message            |
| Path traversal     | Use `/^\.\.(?:[\\/]&#124;$)/.test(rel)` NOT `startsWith('..')`               |
| Test mocking       | Mock `httpsCallable`, NOT direct Firestore writes                            |
| File reads         | Wrap ALL in try/catch (existsSync race condition)                            |
| exec() loops       | `/g` flag REQUIRED (no /g = infinite loop)                                   |
| Regex two-strikes  | If SonarCloud flags a regex twice, replace with string parsing — don't patch |

**Full Reference**:
[docs/agent_docs/CODE_PATTERNS.md](docs/agent_docs/CODE_PATTERNS.md) (230+
patterns with priority tiers from 347 reviews)

**Pre-Write Checklist**:
[docs/agent_docs/SECURITY_CHECKLIST.md](docs/agent_docs/SECURITY_CHECKLIST.md) -
Check BEFORE writing scripts that handle file I/O, git, CLI args, or shell
commands. Use helpers from `scripts/lib/security-helpers.js`.

**App-Specific:**

- `migrateAnonymousUserData` handles merges - don't merge manually
- Google OAuth requires COOP/COEP headers in `firebase.json`
- Meeting widget `setInterval`: define `useCallback` before effect

## 5. Coding Standards

- **TypeScript**: Strict mode, no `any`
- **Components**: Functional + Hooks
- **Styling**: Tailwind (utility-first)
- **State**: `useState` local, Context global, Firestore server
- **Validation**: Zod runtime matching TS interfaces

## 6. Agent/Skill Triggers

> [!CAUTION] Agents are REQUIRED when triggers match - not optional suggestions.

### PRE-TASK (before starting work)

| Trigger                       | Action                       | Tool  |
| ----------------------------- | ---------------------------- | ----- |
| Thorough planning requested   | `deep-plan` skill            | Skill |
| Bug/error/unexpected behavior | `systematic-debugging`       | Skill |
| Exploring unfamiliar code     | `Explore` agent              | Task  |
| Multi-step implementation     | `Plan` agent                 | Task  |
| Multi-file feature (3+ files) | Development team             | Team  |
| Security/auth (no S0/S1)      | `security-auditor` agent     | Task  |
| New documentation             | `documentation-expert` agent | Task  |
| UI/frontend work              | `frontend-design` skill      | Skill |
| New UI feature                | Generate `.protocol.json`    | Write |

### POST-TASK (before committing)

| What You Did        | Action                        | Tool  |
| ------------------- | ----------------------------- | ----- |
| Wrote/modified code | `code-reviewer` agent         | Task  |
| Built UI feature    | `/test-suite --protocol=NAME` | Skill |
| Security changes    | `security-auditor` agent      | Task  |
| PR ready for merge  | `/test-suite --smoke`         | Skill |

**Session End**: Run `/session-end` for full audit checklist.

**Detailed orchestration guidance** (parallelization, teams, capacity):
[docs/agent_docs/AGENT_ORCHESTRATION.md](docs/agent_docs/AGENT_ORCHESTRATION.md)

## 7. Reference Docs

| Document                                                                           | Purpose                                    |
| ---------------------------------------------------------------------------------- | ------------------------------------------ |
| [AI_WORKFLOW.md](./AI_WORKFLOW.md)                                                 | Session startup, navigation                |
| [ROADMAP.md](./ROADMAP.md)                                                         | Planned vs completed features              |
| [SESSION_CONTEXT.md](./SESSION_CONTEXT.md)                                         | Current sprint, recent context             |
| [docs/agent_docs/AGENT_ORCHESTRATION.md](docs/agent_docs/AGENT_ORCHESTRATION.md)   | Agent parallelization, teams, coordination |
| [docs/agent_docs/CONTEXT_PRESERVATION.md](docs/agent_docs/CONTEXT_PRESERVATION.md) | Compaction safety, state persistence       |

---

**Before refactoring**: Check `SESSION_CONTEXT.md` and `ROADMAP.md` first.
**Before adding features**: Align with ROADMAP.md vision (Privacy-First,
Evidence-Based).

## Version History

| Version | Date       | Change                                            |
| ------- | ---------- | ------------------------------------------------- |
| 5.1     | 2026-02-10 | Add Purpose/Version History for CI doc lint       |
| 5.0     | 2026-02-10 | 77% reduction: 497→118 lines, extract to ref docs |
| 4.2     | 2026-02-09 | Agent teams, compaction safety layers             |
