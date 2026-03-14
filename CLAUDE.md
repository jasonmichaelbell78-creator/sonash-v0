# AI Context & Rules for SoNash

<!-- prettier-ignore-start -->
**Document Version:** 5.5
**Last Updated:** 2026-03-13
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Purpose

Core rules and constraints loaded on every AI turn. Kept minimal (~135 lines) to
reduce token waste. Situational guidance lives in on-demand reference docs (see
Section 8).

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
   `[GATE: patterns:check + Cloud Functions runtime]`
2. **App Check Required** - all Cloud Functions verify tokens
   `[GATE: Cloud Functions runtime enforcement]`
3. **Rate Limiting** - handle `429` errors gracefully (use `sonner` toasts)
   `[BEHAVIORAL: code-reviewer check only]`

## 3. Architecture

**Repository Pattern**: `lib/firestore-service.ts`

- Add new queries to service files, not inline in components
- Use types from `types/` or `functions/src/schemas.ts`

## 4. Behavioral Guardrails

> [!CAUTION] These are non-negotiable. Violating these wastes the user's time.

1. **Ask on first confusion, not fourth.** If you don't understand an
   instruction or format, ask immediately. Do NOT guess-and-retry multiple
   times. `[BEHAVIORAL: proxy metric — PRE_GENERATION_CHECKLIST.md]`
2. **Never implement without explicit approval.** Present the plan, wait for
   "go", then execute. No matter how obvious the fix seems.
   `[BEHAVIORAL: proxy metric — impl-before-plan count]`
3. **When told to follow a skill's format, read the skill first.** Do not
   improvise a format from memory. Read the actual SKILL.md, match it exactly.
   `[BEHAVIORAL: proxy metric — format-deviation count]`
4. **"Stop and ask" is a hard stop.** If the user says this, stop all action
   immediately and ask for clarification before proceeding.
   `[BEHAVIORAL: no automated enforcement]`
5. **One correction = full stop.** If corrected on approach or format, do not
   make a small adjustment and retry. Stop, ask what's wrong, confirm the
   correct approach, then proceed. `[BEHAVIORAL: no automated enforcement]`
6. **All passive surfacing must force acknowledgment.** Never fire-and-forget
   warnings or data summaries. If data is surfaced (session-start, /alerts,
   session-end), it must require the user to acknowledge or act on it.
   Unacknowledged warnings become wallpaper.
   `[BEHAVIORAL: no automated enforcement]`

## 5. Critical Anti-Patterns

> **SELF-AUDIT**: Scan before writing shell scripts, workflows, or security
> code.

**Top 5 (enforced by `npm run patterns:check`):**

| Pattern            | Rule                                                                         | Enforcement              |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------ |
| Error sanitization | Use `scripts/lib/sanitize-error.js` - never log raw error.message            | `[GATE: patterns:check]` |
| Path traversal     | Use `/^\.\.(?:[\\/]&#124;$)/.test(rel)` NOT `startsWith('..')`               | `[GATE: patterns:check]` |
| Test mocking       | Mock `httpsCallable`, NOT direct Firestore writes                            | `[GATE: patterns:check]` |
| File reads         | Wrap ALL in try/catch (existsSync race condition)                            | `[GATE: patterns:check]` |
| exec() loops       | `/g` flag REQUIRED (no /g = infinite loop)                                   | `[GATE: patterns:check]` |
| Regex two-strikes  | If SonarCloud flags a regex twice, replace with string parsing — don't patch | `[GATE: SonarCloud CI]`  |

**Full Reference** (consult only when writing scripts or hooks):
[docs/agent_docs/CODE_PATTERNS.md](docs/agent_docs/CODE_PATTERNS.md)

**Pre-Write Checklist**:
[docs/agent_docs/SECURITY_CHECKLIST.md](docs/agent_docs/SECURITY_CHECKLIST.md) -
Check BEFORE writing scripts that handle file I/O, git, CLI args, or shell
commands. Use helpers from `scripts/lib/security-helpers.js`.

**Behavioral Checklist** (consult before writing new code):
[docs/agent_docs/PRE_GENERATION_CHECKLIST.md](docs/agent_docs/PRE_GENERATION_CHECKLIST.md)

**App-Specific:**

- `migrateAnonymousUserData` handles merges - don't merge manually
- Google OAuth requires COOP/COEP headers in `firebase.json`
- Meeting widget `setInterval`: define `useCallback` before effect

## 6. Coding Standards

- **TypeScript**: Strict mode, no `any` `[GATE: tsconfig strict + CI build]`
- **Components**: Functional + Hooks `[BEHAVIORAL: code-reviewer]`
- **Styling**: Tailwind (utility-first) `[BEHAVIORAL: code-reviewer]`
- **State**: `useState` local, Context global, Firestore server
  `[BEHAVIORAL: no automated enforcement]`
- **Validation**: Zod runtime matching TS interfaces
  `[BEHAVIORAL: code-reviewer]`

### Code Navigation (LSP)

Native LSP is configured via `.lsp.json` (typescript-language-server). **Prefer
LSP tools over Grep for symbol lookups:**

- **Go-to-definition, find-references, rename** → Use LSP
- **Text/pattern search, regex matching** → Use Grep
- Do NOT use Grep to find class definitions, function implementations, or type
  declarations when LSP can resolve them directly

## 7. Agent/Skill Triggers

> [!CAUTION] Agents are REQUIRED when triggers match - not optional suggestions.

### PRE-TASK (before starting work) `[BEHAVIORAL: no automated enforcement]`

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

### POST-TASK (before committing) `[GATE: pre-commit hook + code-reviewer]`

| What You Did        | Action                        | Tool  |
| ------------------- | ----------------------------- | ----- |
| Wrote/modified code | `code-reviewer` agent         | Task  |
| Built UI feature    | `/test-suite --protocol=NAME` | Skill |
| Security changes    | `security-auditor` agent      | Task  |
| PR ready for merge  | `/test-suite --smoke`         | Skill |

**Session End**: Run `/session-end` for session closure pipeline (context,
metrics, commit).

**Detailed orchestration guidance** (parallelization, teams, capacity):
[docs/agent_docs/AGENT_ORCHESTRATION.md](docs/agent_docs/AGENT_ORCHESTRATION.md)

## 8. Reference Docs

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

---

## Version History

| Version | Date       | Changes                               |
| ------- | ---------- | ------------------------------------- |
| 5.5     | 2026-03-13 | Enforcement annotations on all rules  |
| 5.4     | 2026-03-13 | Add LSP code navigation preference    |
| 5.3     | 2026-03-05 | Add behavioral guardrails (Section 4) |
| 5.2     | 2026-02-26 | Agent triggers, reference docs table  |
| 5.1     | 2026-02-10 | Initial versioned release             |

[Full version history](docs/SESSION_HISTORY.md)
