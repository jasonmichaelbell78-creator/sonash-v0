# AI Context & Rules for SoNash

<!-- prettier-ignore-start -->
**Document Version:** 6.0
**Last Updated:** 2026-04-12
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
| Next.js      | 16.2.0  | App Router  |
| React        | 19.2.4  | Stable      |
| Firebase     | 12.10.0 | Modular SDK |
| Tailwind CSS | 4.2.2   |             |
| Zod          | 4.3.6   |             |

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

> [!CAUTION] Non-negotiable. Violating these wastes the user's time.

1. **Ask on first confusion, not fourth.** Don't guess-and-retry.
2. **Never implement without explicit approval.** Present plan, wait for "go."
3. **Read SKILL.md before following any skill format.** Don't improvise from
   memory.
4. **"Stop and ask" = hard stop.** No action until clarification received.
5. **One correction = full stop.** Stop, ask what's wrong, confirm, then
   proceed.
6. **All surfaced data must force acknowledgment.** No fire-and-forget warnings.
7. **Never push without explicit approval.** `commit` is fine; `push` requires
   user say-so.
8. **Respect declared platform/shell.** Check system prompt before shell
   commands.
9. **On pre-commit failure, use `/pre-commit-fixer`.** After 2 attempts, ask.
10. **Question batches: 5-8 max** (unless `/deep-plan` exhaustive mode).
11. **Verify no untracked files** before PR, branch completion, or
    `/session-end`.
12. **Verify file state against filesystem**, not docs/memory/conversation.
13. **Review hook summary after every commit/push.** Present warnings with
    remediation options.
14. **Never set SKIP_REASON autonomously.** User must authorize exact wording.
15. **Never accept empty agent results silently.** Windows 0-byte bug — check
    `<result>` field, report failures.
16. **Follow skills exactly.** Never skip steps without explicit user approval.

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

**LSP & CLI tools**: Prefer LSP for symbol lookups, Grep for text search. See
[CODING_TOOLS_REFERENCE.md](docs/agent_docs/CODING_TOOLS_REFERENCE.md) for
preferred CLI tools (`bat`, `fd`, `eza`, `difft`, etc.).

## 7. Agent/Skill Triggers

> [!CAUTION] Agents are REQUIRED when triggers match - not optional suggestions.

### PRE-TASK (before starting work) `[BEHAVIORAL: no automated enforcement]`

| Trigger                                 | Action                                                                                    | Tool  |
| --------------------------------------- | ----------------------------------------------------------------------------------------- | ----- |
| Building/improving anything             | Scan `.research/EXTRACTIONS.md` for prior art, query `extraction-journal.jsonl` to filter | Read  |
| Creative exploration, ideation          | `brainstorm` skill                                                                        | Skill |
| Thorough planning requested             | `deep-plan` skill                                                                         | Skill |
| Domain/technology research              | `deep-research` skill                                                                     | Skill |
| Bug/error/unexpected behavior           | `systematic-debugging`                                                                    | Skill |
| Exploring unfamiliar code               | `Explore` agent                                                                           | Task  |
| Multi-step implementation               | `Plan` agent                                                                              | Task  |
| Multi-file feature (3+ files)           | Development team                                                                          | Team  |
| Multi-phase project                     | `/gsd:new-project` or `/gsd:plan-phase`                                                   | Skill |
| Security/auth (no S0/S1)                | `security-auditor` agent                                                                  | Task  |
| New documentation                       | `documentation-expert` agent                                                              | Task  |
| React/frontend component work           | `frontend-developer` agent                                                                | Task  |
| UI/frontend design                      | `frontend-design` skill                                                                   | Skill |
| New UI feature                          | Generate `.protocol.json`                                                                 | Write |
| Analyze any source (repo/web/doc/media) | `analyze` skill (auto-detects type, dispatches handler). Also: `/recall`, `/synthesize`   | Skill |

### POST-TASK (before committing) `[GATE: pre-commit hook + code-reviewer]`

| What You Did        | Action                        | Tool  |
| ------------------- | ----------------------------- | ----- |
| Wrote/modified code | `code-reviewer` agent         | Task  |
| Built UI feature    | `/test-suite --protocol=NAME` | Skill |
| Security changes    | `security-auditor` agent      | Task  |
| PR ready for merge  | `/test-suite --smoke`         | Skill |

**Session End**: Run `/session-end` for session closure pipeline (context,
metrics, commit).

**Agent Teams** (`.claude/teams/`): `audit-review-team` and
`research-plan-team`. Spawned through existing skill triggers (`/deep-research`,
`/deep-plan`, `/skill-audit`) when complexity thresholds are met — not invoked
directly.

**Specialized agents** (`.claude/agents/`): 34 agents available beyond this
table (e.g., `test-engineer`, `performance-engineer`, `debugger`). Invoke by
name when the task fits; the table above covers the most common triggers.

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

**Version:** 6.0 (2026-04-12) — Context optimization: compressed guardrails,
moved CLI/LSP to reference doc, collapsed analysis triggers.
[Full version history](docs/SESSION_HISTORY.md)
