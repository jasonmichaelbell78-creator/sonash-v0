# Findings: SQ6 (Part B) — What Other Built-in System Agents Should Get Project-Specific Custom Overrides?

**Searcher:** deep-research-searcher **Profile:** codebase + web **Date:**
2026-03-29 **Sub-Question IDs:** SQ6B

---

## Prerequisite Clarification: What Counts as "Built-in System Agent"

Before assessing override candidates, a critical taxonomy distinction emerged
from research:

**True built-in system agents** (hardcoded into Claude Code runtime, Priority 4
lowest):

- `Explore` — Haiku, read-only, fast codebase search
- `Plan` — inherits model, read-only, plan mode research
- `general-purpose` — inherits model, all tools, complex multi-step
- `statusline-setup` — Sonnet, invoked by `/statusline`
- `Claude Code Guide` — Haiku, answers Claude Code questions
- `Bash` — inherits, terminal commands

**Plugin agents** (from installed plugins, also Priority 4, overridable by
project-level files):

- `code-simplifier` — from `code-simplifier@claude-plugins-official`
- `code-reviewer` (plugin version) — from `code-review@claude-plugins-official`
- `pr-test-analyzer` — from `pr-review-toolkit@claude-plugins-official`
- `silent-failure-hunter` — from `pr-review-toolkit@claude-plugins-official`
- `type-design-analyzer` — from `pr-review-toolkit@claude-plugins-official`
- `comment-analyzer` — from `pr-review-toolkit@claude-plugins-official`

**Override mechanism (confirmed from official docs):** Project-level
`.claude/agents/<name>.md` files at Priority 2 override BOTH built-in system
agents AND plugin agents when names match. The priority hierarchy is: CLI flag
(1) > `.claude/agents/` (2) > `~/.claude/agents/` (3) > Plugin `agents/` dir
(4).

**Key constraint from docs:** Plugin subagents do NOT support `hooks`,
`mcpServers`, or `permissionMode` frontmatter — these are ignored when loaded
from a plugin. However, a project-level override of the same name CAN use these
fields. This is an additional motivation for project overrides of plugin agents.

**Internal contradiction in project's own skill:** The `audit-agent-quality`
SKILL.md states "Built-in agents (Explore, Plan, general-purpose, Bash) cannot
be modified via `.claude/agents/` files" — but the official Claude Code
documentation says they CAN be overridden via `.claude/agents/`. This is a stale
belief in the project that should be corrected. The priority table in the
official docs explicitly shows project-level agents win over built-in agents.

---

## Current Override Status

**Already have project-level overrides:**

- `explore` — SoNash context, read-only, maxTurns: 25
- `plan` — SoNash context, read-only, maxTurns: 25

**Already have project-level overrides that also happen to override plugin
code-reviewer:**

- `code-reviewer` — full SoNash security patterns, return protocol

**Do NOT have project-level overrides (assessed below):**

- `general-purpose` — TRUE built-in, high invocation frequency
- `statusline-setup` — TRUE built-in, low frequency
- `Claude Code Guide` / `claude-code-guide` — TRUE built-in, informational
- `code-simplifier` — plugin agent, opus model
- `pr-test-analyzer` — plugin agent, inherit model
- `silent-failure-hunter` — plugin agent, inherit model
- `type-design-analyzer` — plugin agent, inherit model
- `comment-analyzer` — plugin agent, inherit model

---

## Key Findings

### 1. `general-purpose` Should Have a Project Override [CONFIDENCE: HIGH]

**Override recommended: YES — Priority: HIGH**

`general-purpose` is invoked by 8 different skill files in this project, with
13+ direct subagent_type calls identified. It is the most-used built-in agent
type after `explore`. Skills that invoke it include: `doc-optimizer` (13
invocations in prompts.md alone), `audit-process`, `audit-ai-optimization`,
`audit-enhancements`, `convergence-loop`, and `pre-commit-fixer`.

The built-in `general-purpose` has all tools and inherits model — but no system
prompt beyond basic environment details. Every invocation receives a
task-specific prompt with zero awareness of SoNash's security boundary,
repository pattern, Zod conventions, or protected collections.

**Risk without override:** A `general-purpose` agent asked to "fix issues in
file X" might write direct Firestore writes bypassing Cloud Functions, use `any`
types, skip Zod validation, or log raw `error.message`. Without a project-level
system prompt, it falls back to generic coding patterns.

**What the override should contain:**

- SoNash stack declaration (Next.js 16, React 19, Firebase 12, Tailwind 4,
  Zod 4)
- Cloud Functions security boundary (CRITICAL: no direct writes to
  journal/daily_logs/inventoryEntries)
- Repository pattern reminder (queries in lib/firestore-service.ts)
- Error sanitization pattern (sanitizeError from scripts/lib/sanitize-error.js)
- Path safety requirement (regex check not startsWith)
- TypeScript strict mode (no any)
- Structured return protocol

**Model:** Should NOT be changed from `inherit` — these are complex multi-step
tasks that benefit from the session model (which may be Sonnet or Opus depending
on context).

**Tool constraint:** Keep all tools (general-purpose needs Write/Edit for
implementation). Consider `disallowedTools: Agent` (subagents cannot spawn
subagents anyway).

### 2. `silent-failure-hunter` Needs a Project Override [CONFIDENCE: HIGH]

**Override recommended: YES — Priority: HIGH**

`silent-failure-hunter` is a plugin agent (pr-review-toolkit) with a generic
system prompt referencing "logForDebugging, logError, logEvent" functions and
"constants/errorIds.ts" — none of which exist in SoNash. The agent references
project-specific logging conventions that are wrong for this codebase.

SoNash-specific error handling uses:

- `sanitizeError()` from `scripts/lib/sanitize-error.js` (scripts)
- `logger` from `lib/logger.ts` (app code)
- `sonner` toasts for user-facing errors
- `isRateLimitError()` from `lib/utils/callable-errors.ts` for 429 handling
- `withSecurityChecks()` wrapper in `functions/src/security-wrapper.ts`

Without an override, `silent-failure-hunter` will flag legitimate patterns as
errors (e.g., not using "logForDebugging") and miss real SoNash-specific silent
failure patterns (e.g., rate limiter errors swallowed without toast
notification).

**Additional motivation for override:** As a plugin agent,
`silent-failure-hunter` cannot use `hooks` or `permissionMode` fields. A
project-level override enables these capabilities.

**What the override should contain:**

- SoNash error handling taxonomy (sanitizeError, logger, sonner,
  isRateLimitError)
- Specific silent failure patterns to hunt: swallowed 429 errors, fail-open rate
  limiters, missing App Check error handling, TOCTOU race conditions in security
  guards
- References to actual SoNash files: `lib/utils/callable-errors.ts`,
  `lib/logger.ts`, `functions/src/security-wrapper.ts`
- The same severity format the existing pr-review-toolkit uses
  (CRITICAL/HIGH/MEDIUM)

### 3. `pr-test-analyzer` Needs a Project Override [CONFIDENCE: HIGH]

**Override recommended: YES — Priority: HIGH**

`pr-test-analyzer` (plugin agent) has a generic system prompt that knows nothing
about:

- SoNash uses Vitest NOT Jest (different import syntax, different mock API)
- Test files live in `tests/` and `scripts/__tests__/`, not `__tests__/`
  co-location
- Mock pattern: MUST mock `httpsCallable`, NEVER mock Firestore directly
- SoNash has 3,500+ tests across 860+ suites — "no tests" findings need
  calibration
- Test assertion style: `expect().toHaveBeenCalledWith()` on callable mocks

The plugin agent uses `model: inherit` (no override needed), but it will produce
recommendations that are wrong for SoNash (e.g., "add Jest.mock for Firestore"
which violates SoNash's anti-pattern enforcement).

**What the override should contain:**

- Test framework: Vitest (not Jest) with correct import:
  `import { describe, it, expect, vi } from 'vitest'`
- Mock pattern: `vi.mock('firebase/functions')` targeting httpsCallable, never
  Firestore
- Test file locations: `tests/`, `scripts/__tests__/`
- SoNash test scale context (3,500+ tests — this is a mature suite, don't flag
  "low coverage" broadly)
- Protected collection test patterns: verify Cloud Function mock behavior, not
  Firestore state

### 4. `type-design-analyzer` — Conditional Override [CONFIDENCE: MEDIUM]

**Override recommended: MAYBE — Priority: MEDIUM**

`type-design-analyzer` (plugin agent) uses a generic 4-dimension scoring
framework. Its core function (encapsulation, invariant expression, usefulness,
enforcement) is reasonably universal. However, SoNash-specific type conventions
would improve output quality:

- TypeScript strict mode (no `any`) — flag types that use `any`
- Types live in `types/` or `functions/src/schemas.ts` — flag inline types in
  components
- Zod schemas must match TS interfaces exactly (runtime validation mirror)
- Readonly<> wrapper on component props

The benefit is moderate: the 4-dimension framework is sound, and most type
issues would be caught regardless. An override would primarily redirect findings
to SoNash-specific type locations and patterns.

**Recommendation:** Yes to override, but lower priority than
`silent-failure-hunter` and `pr-test-analyzer`.

### 5. `comment-analyzer` — Low Priority Override [CONFIDENCE: MEDIUM]

**Override recommended: NO (for now) — Priority: LOW**

`comment-analyzer` (plugin agent) checks comment accuracy against code. This is
largely language-agnostic and the core function (comment rot, accuracy
verification) works well without project context.

The only SoNash-specific context that would help: awareness that `"use client"`
directives are intentional (Server Component architecture), and that certain
patterns like `withSecurityChecks()` have specific calling conventions worth
documenting.

However, the upside of an override is marginal. The agent's output quality for
SoNash would not materially differ. Defer unless comment quality becomes a
consistent pain point.

### 6. `code-simplifier` — Override Beneficial but Not Urgent [CONFIDENCE: MEDIUM]

**Override recommended: YES — Priority: MEDIUM**

`code-simplifier` uses `model: opus` and has a generic simplification system
prompt. Its current prompt references "ES modules with sorted imports, function
keyword preference, explicit return type annotations" — some of which conflicts
with SoNash patterns (SoNash uses both `function` declarations and arrow
functions, preferring arrow for components).

Key SoNash pattern conflicts in the generic prompt:

- "function keyword preference" — SoNash uses `export function` for utilities
  but arrow functions for React components (standard Next.js 16 pattern)
- No awareness of Tailwind utility-first styling (might "simplify" Tailwind
  class strings incorrectly)
- No awareness of Cloud Functions boundary (might "simplify" away security
  calls)
- `any` is forbidden in strict TypeScript — the generic prompt doesn't enforce
  this

The `opus` model is appropriate for this task. An override would add SoNash
coding standards and prevent "simplifications" that break security patterns.

**Critical flag:** This agent runs proactively after code modifications. Wrong
simplifications touching Cloud Functions or security patterns would be
high-impact errors.

### 7. `statusline-setup` — No Override Needed [CONFIDENCE: HIGH]

**Override recommended: NO — Priority: SKIP**

`statusline-setup` is invoked by the user-facing `/statusline` command to
configure the terminal status line. It is a utility agent for UI configuration.
There is no SoNash application context that would improve its output. The
project's statusline setup involves a Go binary (`sonash-statusline.exe`) with
project-specific API integrations — but this is handled by the statusline
configuration skill and documentation, not by injecting context into the agent's
system prompt.

### 8. `Claude Code Guide` / `claude-code-guide` — No Override Needed [CONFIDENCE: HIGH]

**Override recommended: NO — Priority: SKIP**

`Claude Code Guide` answers questions about Claude Code features using Haiku.
Overriding it with project context would be counterproductive — it should
continue to answer generic Claude Code feature questions accurately.
Project-specific questions are better directed at the main conversation with
CLAUDE.md context already loaded.

---

## Per-Agent Override Assessment Summary

| Agent                   | Type     | Override? | Priority | Key Reason                                                    |
| ----------------------- | -------- | --------- | -------- | ------------------------------------------------------------- |
| `general-purpose`       | Built-in | YES       | HIGH     | 13+ invocations, no project context, writes code              |
| `silent-failure-hunter` | Plugin   | YES       | HIGH     | Wrong logger references, misses SoNash error patterns         |
| `pr-test-analyzer`      | Plugin   | YES       | HIGH     | Wrong test framework (Jest vs Vitest), wrong mock pattern     |
| `code-simplifier`       | Plugin   | YES       | MEDIUM   | Potential pattern conflicts, opus model, proactive invocation |
| `type-design-analyzer`  | Plugin   | YES       | MEDIUM   | Zod/TypeScript strict conventions missing                     |
| `comment-analyzer`      | Plugin   | NO        | LOW      | Generic function works; marginal upside                       |
| `statusline-setup`      | Built-in | NO        | SKIP     | Utility UI tool; context irrelevant                           |
| `claude-code-guide`     | Built-in | NO        | SKIP     | Should stay generic; project context would degrade answers    |

---

## Recommended Override Content Outlines

### `general-purpose` Override Outline

```yaml
name: general-purpose
description: >-
  Capable agent for complex, multi-step tasks requiring both exploration and
  action. Use for documentation fixes, multi-file operations, audit synthesis,
  and any task requiring both reads and writes.
tools: Read, Write, Edit, Bash, Grep, Glob
model: inherit
maxTurns: 30
```

System prompt body should include:

1. SoNash stack version header (same as explore/plan agents)
2. Security boundary (CRITICAL section first): no direct writes to
   journal/daily_logs/inventoryEntries
3. Repository pattern: queries in lib/firestore-service.ts
4. Error handling: sanitizeError for scripts, logger for app, sonner for
   user-facing
5. TypeScript strict: no any, types from types/ or functions/src/schemas.ts
6. Return protocol: structured summary of what was done

### `silent-failure-hunter` Override Outline

```yaml
name: silent-failure-hunter
description: >-
  Hunts for silent failures, swallowed errors, and inadequate error handling.
  Use during PR review or when error handling patterns need auditing.
tools: Read, Bash, Grep, Glob
disallowedTools: Write, Edit
model: sonnet
```

System prompt body should include:

1. SoNash error handling taxonomy (4 patterns: sanitizeError, logger, sonner,
   isRateLimitError)
2. Specific patterns to hunt: swallowed 429s, fail-open rate limiters, missing
   App Check error handling, TOCTOU gaps, catch blocks without logger/toast
3. File reference guide: which files handle which error pattern
4. Output format: CRITICAL/HIGH/MEDIUM with file:line and SoNash-correct fix
   examples

### `pr-test-analyzer` Override Outline

```yaml
name: pr-test-analyzer
description: >-
  Analyzes test coverage quality and completeness for pull requests. Use during
  PR review or when test coverage needs assessment.
tools: Read, Bash, Grep, Glob
disallowedTools: Write, Edit
model: sonnet
```

System prompt body should include:

1. SoNash test framework: Vitest (NOT Jest). Import:
   `import { describe, it, expect, vi } from 'vitest'`
2. Mock pattern: `vi.mock('firebase/functions')` for httpsCallable; never mock
   Firestore directly
3. Test file locations: `tests/`, `scripts/__tests__/`
4. SoNash test scale: 3,500+ tests / 860+ suites. Calibrate "coverage gaps"
   accordingly
5. Protected collection test checklist: must test that callable is called, not
   Firestore state

### `code-simplifier` Override Outline

```yaml
name: code-simplifier
description: >-
  Simplifies code for clarity, consistency, and maintainability while preserving
  all functionality. Runs after completing coding tasks.
tools: Read, Write, Edit, Bash, Grep, Glob
model: opus
```

System prompt body should include:

1. SoNash coding standards (TypeScript strict, no any, Tailwind utility-first)
2. Component patterns: arrow functions for React components, function
   declarations for utilities
3. CRITICAL: never simplify away security boundary (httpsCallable,
   withSecurityChecks)
4. Never remove Zod validation schemas — they are required for Cloud Functions
5. SoNash-correct simplification examples (what to simplify, what not to touch)

---

## Sources

| #   | URL                                                                                                                     | Title                                              | Type               | Trust  | CRAAP           | Date |
| --- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------ | ------ | --------------- | ---- |
| 1   | https://code.claude.com/docs/en/sub-agents                                                                              | Create custom subagents - Claude Code Docs         | Official docs      | HIGH   | 5/5/5/5/5 = 5.0 | 2026 |
| 2   | https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/pr-review-toolkit/agents/silent-failure-hunter.md | Silent Failure Hunter Agent                        | Official source    | HIGH   | 4/5/5/5/4 = 4.6 | 2026 |
| 3   | https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/pr-review-toolkit/agents/pr-test-analyzer.md      | PR Test Analyzer Agent                             | Official source    | HIGH   | 4/5/5/5/4 = 4.6 | 2026 |
| 4   | https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/pr-review-toolkit/agents/type-design-analyzer.md  | Type Design Analyzer Agent                         | Official source    | HIGH   | 4/5/5/5/4 = 4.6 | 2026 |
| 5   | https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/pr-review-toolkit/agents/comment-analyzer.md      | Comment Analyzer Agent                             | Official source    | HIGH   | 4/5/5/5/4 = 4.6 | 2026 |
| 6   | https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/pr-review-toolkit/agents/code-simplifier.md       | Code Simplifier Agent                              | Official source    | HIGH   | 4/5/5/5/4 = 4.6 | 2026 |
| 7   | .claude/agents/explore.md (filesystem)                                                                                  | Explore agent override — existing project file     | Ground truth       | HIGH   | 5/5/5/5/5 = 5.0 | 2026 |
| 8   | .claude/agents/plan.md (filesystem)                                                                                     | Plan agent override — existing project file        | Ground truth       | HIGH   | 5/5/5/5/5 = 5.0 | 2026 |
| 9   | .claude/agents/code-reviewer.md (filesystem)                                                                            | Code reviewer override — existing project file     | Ground truth       | HIGH   | 5/5/5/5/5 = 5.0 | 2026 |
| 10  | .claude/skills/audit-agent-quality/SKILL.md (filesystem)                                                                | Audit agent quality skill                          | Ground truth       | HIGH   | 5/5/5/5/5 = 5.0 | 2026 |
| 11  | .claude/REQUIRED_PLUGINS.md (filesystem)                                                                                | Plugin inventory                                   | Ground truth       | HIGH   | 5/5/5/5/5 = 5.0 | 2026 |
| 12  | https://samanvya.dev/blog/claude-code-pr-review-toolkit                                                                 | PR Review Toolkit: Five Agents Reviewing Your Code | Community blog     | MEDIUM | 3/4/3/4/4 = 3.6 | 2025 |
| 13  | https://deepwiki.com/anthropics/claude-plugins-official/7.2.2-code-simplifier-and-pr-review-toolkit                     | code-simplifier and PR Review Toolkit - DeepWiki   | Community analysis | MEDIUM | 3/4/3/3/4 = 3.4 | 2025 |

---

## Contradictions

**Major contradiction — built-in agent overridability:**

- `audit-agent-quality` SKILL.md (project file) states: "Built-in agents
  (Explore, Plan, general-purpose, Bash) cannot be modified via
  `.claude/agents/` files."
- Official Claude Code documentation (code.claude.com/docs/en/sub-agents)
  explicitly shows the priority hierarchy: `.claude/agents/` (Priority 2) wins
  over built-in agents.
- The project already has `explore` and `plan` overrides in `.claude/agents/` —
  which contradicts the skill's own claim.
- **Resolution:** The official docs are authoritative. The `audit-agent-quality`
  skill contains stale information. The existing explore.md and plan.md files
  are evidence that the override mechanism works.

**Minor contradiction — code-reviewer naming collision:**

- The project has `.claude/agents/code-reviewer.md` (project override).
- The `pr-review-toolkit` plugin also provides a `code-reviewer` agent.
- The `code-review@claude-plugins-official` plugin ALSO provides a
  `code-reviewer` agent.
- Result: 3 agents named `code-reviewer` but the project file (Priority 2) wins.
  This is the correct behavior, but creates potential confusion about which
  agent is active.

---

## Gaps

1. **Cannot verify whether `general-purpose` built-in has a system prompt beyond
   environment details.** The official docs say "Subagents receive only this
   system prompt (plus basic environment details like working directory), not
   the full Claude Code system prompt." For built-in agents without a
   user-defined file, what exactly is their system prompt? The docs do not
   expose the built-in prompts. This is UNVERIFIED.

2. **Plugin agent behavior when overridden is not fully documented.** The docs
   confirm project-level files override plugins at Priority 2, but do not
   specify whether the override is complete (replaces entire prompt) or
   additive. Based on the fact that explore.md and plan.md are already
   project-level overrides of built-in agents, and they work as complete
   replacements — this is likely full replacement. MEDIUM confidence.

3. **`code-simplifier` opus model cost impact.** The agent runs proactively
   after code modifications and uses `model: opus`. No data on how frequently
   this triggers in a typical SoNash development session. If it triggers on
   every write, the cost could be significant. A project override might want to
   change the model or add an invocation condition.

4. **`audit-agent-quality` skill contains stale belief.** The skill's Stage 4
   section should be updated to reflect that built-in agents CAN be overridden.
   This is an indirect finding, not a gap in research scope.

---

## Serendipity

**Plugin agent hooks limitation is a strong motivation for overrides.** Official
docs state: "plugin subagents do not support the `hooks`, `mcpServers`, or
`permissionMode` frontmatter fields." This means ALL pr-review-toolkit agents
(silent-failure-hunter, pr-test-analyzer, type-design-analyzer,
comment-analyzer, code-simplifier) cannot have hooks or permission modes unless
overridden at project level. For a project with a sophisticated hook system,
this is significant — the project's pre-commit hook infrastructure can only
interact with agents that have project-level overrides.

**The `code-reviewer` project override already addresses this** — the existing
`.claude/agents/code-reviewer.md` effectively replaces both the
`code-review@claude-plugins-official` agent AND the `pr-review-toolkit` version
with a project-specific version that CAN use hooks.

**`audit-agent-quality` skill needs a correction.** Stage 4 currently advises
optimizing "around" built-in agents because they "cannot be modified." This is
incorrect per official docs. The skill should be updated to recommend direct
`.claude/agents/` overrides for built-in agents as well.

---

## Confidence Assessment

- HIGH claims: 4 (general-purpose override justified, silent-failure-hunter
  justified, pr-test-analyzer justified, statusline/guide no-override justified)
- MEDIUM claims: 3 (code-simplifier override, type-design-analyzer, override
  completeness mechanism)
- LOW claims: 0
- UNVERIFIED claims: 1 (built-in agent default system prompt content)
- Overall confidence: HIGH

The core findings — which agents should be overridden and why — are supported by
(a) official documentation on the priority mechanism, (b) direct reading of
existing project agent files showing current patterns, (c) direct reading of
plugin agent source from the Anthropics GitHub repository, and (d) filesystem
evidence of what skills invoke general-purpose agents and how frequently.
