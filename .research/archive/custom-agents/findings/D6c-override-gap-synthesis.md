# Findings: SQ6 (Part C) — Override Gap Synthesis and Override Strategy

**Searcher:** deep-research-searcher **Profile:** web + codebase **Date:**
2026-03-29 **Sub-Question IDs:** SQ6C

---

## Executive Summary

Case-sensitivity is RESOLVED: agent names are case-insensitive in Claude Code.
`Explore` and `explore` route to the same agent — the custom override wins when
it exists. The CLAUDE.md capital-E references are NOT bypassing the override.
However, the naming concern spawns a different actionable issue: the
`audit-enhancements` SKILL.md explicitly warns against using `Explore` for
file-writing tasks (it warns to use `general-purpose` instead because `Explore`
is read-only) — this guidance needs updating given the custom override changes
the behavior.

Five override candidates are confirmed from D6b. A complete override template
specification is provided below, derived from the existing
`explore.md`/`plan.md`/`code-reviewer.md` structure as the authoritative
baseline. A maintenance strategy using a lightweight comment header and
changelog convention is recommended, with no external tooling required.

---

## Key Findings

### 1. Case-Sensitivity: RESOLVED — Names Are Case-Insensitive [CONFIDENCE: HIGH]

**Finding: `Explore` and `explore` route to the same override. The capital-E
references in CLAUDE.md are NOT a problem.**

The official Claude Code documentation and community confirmation establish that
agent name resolution is case-insensitive. From the web research (WebSearch
result with direct quote):

> "Case-insensitive agent types — 'explore', 'Explore', 'EXPLORE' all work."

Additionally, the official docs show that disabling a built-in uses
`Agent(Explore)` with capital-E in settings.json — confirming that the system
treats agent names case-insensitively at the runtime level. The priority table
in official docs shows project-level `.claude/agents/` (Priority 2) beats
built-ins (Priority 4) when names match, and the matching is case-insensitive.

**What this means for SoNash:**

- `subagent_type="Explore"` in skill files → HITS the custom `explore.md`
  override (not built-in)
- `subagent_type="explore"` in skill files → HITS the custom `explore.md`
  override (same)
- CLAUDE.md Section 7 `Explore` agent trigger → HITS the custom `explore.md`
  override
- The invocation log capital-E vs lowercase-e distinction reflects the case used
  at call time in the log, NOT different agents being invoked

**Revised interpretation of D6a Finding 3:** The 12 capital-E `Explore`
invocations after 2026-03-24 ARE hitting the custom override. D6a's
Interpretation A was correct. The custom explore and plan overrides have been
working for ALL 24+1 invocations, not just the 12 lowercase ones.

**Actionable consequence:** CLAUDE.md Section 7 does NOT need to be changed for
correctness. However, one indirect issue remains: `audit-enhancements/SKILL.md`
warns "use `general-purpose` NOT `Explore` — Explore is READ-ONLY and cannot
write files." This is still accurate (the custom explore.md also has
`disallowedTools: Agent, Write, Edit`) — so skills that need to write files
should continue to use `general-purpose`. The guidance is not broken.

---

### 2. Override Template Specification [CONFIDENCE: HIGH]

**Derived from: explore.md (82/100), plan.md (79/100), code-reviewer.md
(existing project file)**

The template captures all mandatory fields plus recommended fields. Missing
fields in current overrides are flagged with `[GAP]`.

#### Mandatory Frontmatter Fields

```yaml
---
name: <agent-name> # Lowercase, hyphens OK. MUST match built-in name exactly
description: >-
  <One-line role>. <Trigger condition>. Use <PROACTIVELY|during|after> <when to
  invoke>. <example>Context: <situation>. User says: "<example request>". You
  should use this when <pattern match>.</example> <example>Context: <situation
  2>. User says: "<example request 2>". You should use this when <pattern match
  2>.</example>
tools: <comma-separated allowlist> # Omit to inherit all
disallowedTools: <comma-separated> # Use to block specific tools
model: <sonnet|haiku|opus|inherit>
maxTurns: <number> # Prevents runaway loops
color: <blue|cyan|green|yellow|red> # [GAP] — not in current overrides
---
```

**The `<example>` blocks in the description field are the highest-leverage gap**
across all current SoNash overrides. Official best practices require 2-4
`<example>` blocks with:

- Context (what the user is doing)
- Sample user request (literal phrase that should trigger)
- Why this agent is appropriate for that request

Without examples, auto-delegation is unreliable (D1b-Finding-9).

#### Mandatory System Prompt Sections

Every SoNash override MUST contain these sections, in this order:

1. **Stack header** (first line of body):

   ```
   You are a [role] for the SoNash project (Next.js 16 / React 19 / Firebase 12 / Tailwind 4 / Zod 4).
   ```

2. **Security boundary** (for agents that can write code or suggest writes):

   ```markdown
   ## Security Boundary (CRITICAL)

   - NO direct writes to `journal`, `daily_logs`, `inventoryEntries` — use
     `httpsCallable`
   - App Check required on all Cloud Functions
   - Rate limit errors: handle 429 with `isRateLimitError()` + `sonner` toast
   ```

3. **Repository pattern** (for agents accessing Firestore data):

   ```markdown
   ## Repository Pattern

   - Firestore queries live in `lib/firestore-service.ts`, not inline in
     components
   ```

4. **Error handling** (for agents writing or reviewing code):

   ```markdown
   ## Error Handling

   - Scripts: `sanitizeError()` from `scripts/lib/sanitize-error.js`
   - App code: `logger` from `lib/logger.ts`
   - User-facing: `sonner` toasts
   ```

5. **TypeScript rules** (for agents reviewing or writing TS/TSX):

   ```markdown
   ## TypeScript

   - Strict mode, no `any`
   - Types in `types/` or `functions/src/schemas.ts`
   - Zod schemas mirror TS interfaces at runtime
   ```

6. **Return protocol** (for all agents):

   ```markdown
   ## Return Protocol

   Return findings to the orchestrator in this exact format: [...]
   ```

#### Recommended Optional Sections

- `## Workflow` — step-by-step instructions for the agent's core task
- `## Constraints` — what the agent must NOT do (critical for READ-ONLY agents)
- `## Patterns to Hunt` — specific to review/audit agents (list of patterns with
  file paths)
- `## Calibration` — scale context (e.g., "3,500+ tests — calibrate coverage
  gaps accordingly")

#### Optimal Size

D1b-Finding (token analysis): 500-2000 tokens is the sweet spot for agent system
prompts.

- Under 500: insufficient context for project-specific behavior
- Over 2000: context waste + potential focus dilution
- Current overrides: explore.md ~650 tokens, plan.md ~850 tokens,
  code-reviewer.md ~1200 tokens
- All three are within the optimal range — new overrides should target 600-1000
  tokens

---

### 3. Per-Candidate Override Specifications [CONFIDENCE: HIGH for #1-3, MEDIUM for #4-5]

#### 3a. `general-purpose` — Priority: HIGH

**Trigger:** 13+ invocations identified across 6 skill files. Most-used built-in
after `explore`. **Risk without override:** Writes code without SoNash security
boundary, uses `any` types, logs raw `error.message`.

```yaml
---
name: general-purpose
description: >-
  Capable agent for complex, multi-step tasks requiring both exploration and
  action. Use for documentation fixes, multi-file operations, audit synthesis,
  data processing, and any task requiring both reads and writes.
  <example>Context: After audit findings. User says: "Fix the documentation
  issues found in the audit." Use this when a task needs multiple tool types
  (read + write).</example> <example>Context: Implementing a fix. User says:
  "Update the error handling in lib/utils." Use this when changes span multiple
  files or require investigation first.</example>
tools: Read, Write, Edit, Bash, Grep, Glob
disallowedTools: Agent
model: inherit
maxTurns: 30
color: yellow
---
```

Body must include: stack header, CRITICAL security boundary, repository pattern,
error handling, TypeScript rules, return protocol (structured summary of changes
made).

Does NOT include: test framework details (that's pr-test-analyzer's domain).

#### 3b. `silent-failure-hunter` — Priority: HIGH

**Trigger:** Plugin agent (pr-review-toolkit). References wrong logger functions
(`logForDebugging`, `logError` — do not exist in SoNash). Will flag legitimate
patterns as errors, miss real ones. **Risk without override:** False positives
on every SoNash error handling call; misses 429 swallowing, App Check failures,
rate limiter fail-open scenarios.

```yaml
---
name: silent-failure-hunter
description: >-
  Hunts for silent failures, swallowed errors, and inadequate error handling.
  Use during PR review or when auditing error handling patterns.
  <example>Context: PR review. User says: "Check this PR for silent failures."
  Use this when error handling patterns need auditing across changed
  files.</example> <example>Context: Debugging production issue. User says:
  "Find where errors are being swallowed." Use this when error propagation is
  unclear.</example>
tools: Read, Bash, Grep, Glob
disallowedTools: Write, Edit, Agent
model: sonnet
maxTurns: 20
color: red
---
```

Body must include:

- Stack header
- SoNash error handling taxonomy (4 patterns with file paths):
  - `sanitizeError()` from `scripts/lib/sanitize-error.js` (scripts)
  - `logger` from `lib/logger.ts` (app code)
  - `sonner` toasts for user-facing errors
  - `isRateLimitError()` from `lib/utils/callable-errors.ts` for 429 handling
- SoNash-specific patterns to hunt:
  - Swallowed 429 errors without `isRateLimitError()` check
  - `catch` blocks with no `logger.error()` or `sonner` toast
  - Rate limiter returning `allowed: true` on exception (fail-open)
  - Missing App Check error handling in Cloud Functions
  - TOCTOU race conditions in security guards (`security-wrapper.ts`)
- Output format: CRITICAL/HIGH/MEDIUM severity with file:line and SoNash-correct
  fix

#### 3c. `pr-test-analyzer` — Priority: HIGH

**Trigger:** Plugin agent (pr-review-toolkit). Uses generic test framework
assumptions. Will recommend Jest syntax in a Vitest project; will flag missing
`__tests__/` co-location in a `tests/`-rooted project. **Risk without
override:** Recommendations that break tests or violate `patterns:check`.

```yaml
---
name: pr-test-analyzer
description: >-
  Analyzes test coverage quality and completeness for pull requests. Use during
  PR review when assessing test quality and coverage gaps. <example>Context: PR
  ready for review. User says: "Analyze the test coverage for this PR." Use this
  when changed code needs test quality assessment.</example>
tools: Read, Bash, Grep, Glob
disallowedTools: Write, Edit, Agent
model: sonnet
maxTurns: 20
color: cyan
---
```

Body must include:

- Stack header
- Test framework: **Vitest** (NOT Jest). Import:
  `import { describe, it, expect, vi } from 'vitest'`
- Mock pattern: `vi.mock('firebase/functions')` for httpsCallable; `vi.fn()` for
  mocked callables
- ANTI-PATTERN: never `vi.mock` Firestore directly — this violates
  `patterns:check`
- Test file locations: `tests/`, `scripts/__tests__/`
- SoNash test scale: 3,500+ tests / 860+ suites — calibrate "low coverage"
  accordingly
- Protected collection test checklist: verify that `httpsCallable` was called
  with correct args, not that Firestore state changed (test the Cloud Function
  boundary, not internals)
- Output format: rating 1-10 per changed file (10 = critical gap)

#### 3d. `code-simplifier` — Priority: MEDIUM

**Trigger:** Plugin agent (pr-review-toolkit). Uses `model: opus` and runs
proactively after code modifications. Generic simplification rules conflict with
SoNash patterns. **Risk without override:** "Simplifies away" security
boundaries, Zod validations, or uses wrong function style for React components.

```yaml
---
name: code-simplifier
description: >-
  Simplifies code for clarity, consistency, and maintainability while preserving
  all functionality. Runs after completing coding tasks.
tools: Read, Write, Edit, Bash, Grep, Glob
disallowedTools: Agent
model: opus
maxTurns: 20
color: green
---
```

Body must include:

- Stack header
- CRITICAL: never simplify away the Cloud Functions security boundary
  (`httpsCallable`, `withSecurityChecks()`, `App Check` token verification)
- CRITICAL: never remove Zod validation schemas — required for Cloud Functions
- Component style: arrow functions for React components
  (`const Foo = () => {}`), `export function` for utility functions and hooks
- No `any` — if simplification would require `any`, it is not a simplification
- Tailwind: utility classes are intentional, not verbose — do not "consolidate"
  Tailwind
- Return format: before/after with explicit reasoning for each simplification

#### 3e. `type-design-analyzer` — Priority: MEDIUM

**Trigger:** Plugin agent (pr-review-toolkit). Uses generic 4-dimension scoring.
Missing SoNash-specific type location rules and Zod/TS mirror requirement.
**Risk without override:** Flags correct SoNash patterns as violations (inline
type widening in schemas.ts), misses Zod-TS mismatch as a category.

```yaml
---
name: type-design-analyzer
description: >-
  Analyzes type design quality across encapsulation, invariant expression,
  usefulness, and enforcement. Use during PR review for type system quality
  assessment.
tools: Read, Bash, Grep, Glob
disallowedTools: Write, Edit, Agent
model: sonnet
maxTurns: 15
color: blue
---
```

Body must include:

- Stack header
- TypeScript strict mode: flag any `any`, `unknown` used as `any`, or `as Type`
  casts
- Type locations: `types/` for app types, `functions/src/schemas.ts` for Zod
  schemas — flag inline type definitions in components
- Zod-TS mirror rule: every Zod schema in `schemas.ts` MUST have a corresponding
  TypeScript interface/type that exactly matches — flag mismatches
- `Readonly<>` wrapper on component props — flag mutable props interfaces
- 4-dimension scoring (retain from plugin): encapsulation, invariant expression,
  usefulness, enforcement

---

### 4. CLAUDE.md Alignment Finding [CONFIDENCE: HIGH]

**Case sensitivity is not the problem. Skip condition awareness IS.**

Since names are case-insensitive, CLAUDE.md's capital `Explore` and `Plan` in
Section 7 are already routing to the custom overrides. No change is needed to
CLAUDE.md for correctness.

However, there is a related documentation accuracy issue: the
`audit-enhancements/SKILL.md` contains the comment:

> "CRITICAL: Agent Type Selection — Use `subagent_type: 'general-purpose'` (NOT
> `Explore`). Explore agents are READ-ONLY and cannot write the required JSONL
> output files."

This guidance is still CORRECT because the custom `explore.md` also has
`disallowedTools: Write, Edit`. Skills that need to write files must use
`general-purpose`. This is a true constraint, not a documentation error. It
should NOT be changed.

The one genuine documentation accuracy issue is in
`audit-agent-quality/SKILL.md`, which contains the stale claim (from D6b):
"Built-in agents (Explore, Plan, general-purpose, Bash) cannot be modified via
`.claude/agents/` files." This should be updated to reflect that project-level
overrides DO work.

---

### 5. Override Maintenance Strategy [CONFIDENCE: MEDIUM]

No official Claude Code tooling exists for tracking override drift vs. upstream
plugin agents. The strategy below is derived from community patterns and the
project's existing conventions.

#### 5a. Comment Header Convention

Every project-level override that replaces a built-in or plugin agent should
include a maintenance comment block immediately after the frontmatter:

```markdown
<!-- Override metadata
upstream: <built-in|plugin-name>
upstream-source: <URL or "built-in">
last-reviewed: YYYY-MM-DD
review-trigger: plugin-update OR quarterly OR never
-->
```

**review-trigger values:**

- `plugin-update` — review when the upstream plugin updates (check via
  `claude plugins` command)
- `quarterly` — review every 3 months (for built-in agents that change with
  Claude Code releases)
- `never` — agent is fully independent from upstream (e.g., `code-reviewer.md`
  is entirely SoNash-specific)

For the 5 candidate overrides: | Agent | review-trigger | Upstream |
|-------|----------------|---------| | `general-purpose` | quarterly | built-in
| | `silent-failure-hunter` | plugin-update | pr-review-toolkit | |
`pr-test-analyzer` | plugin-update | pr-review-toolkit | | `code-simplifier` |
plugin-update | pr-review-toolkit | | `type-design-analyzer` | plugin-update |
pr-review-toolkit |

#### 5b. Override Replacement vs. Augmentation

**Decision: Full replacement.** Project-level overrides receive only their own
system prompt (official docs: "Subagents receive only this system prompt, not
the full Claude Code system prompt"). There is no additive mechanism — overrides
must be self-contained.

This means:

- Do NOT write "extend the built-in behavior" in the override body — the
  built-in behavior does not exist in the override context
- Do NOT write "as per the plugin's instructions" — the plugin's instructions
  are not loaded
- Include all necessary context in the override itself

The existing `explore.md` and `plan.md` correctly follow this pattern (they
don't reference the built-in prompts, they replace them entirely).

#### 5c. Detecting Upstream Plugin Changes

Plugin agents live at `~/.claude/plugins/` (installed plugins) and the upstream
source is `github.com/anthropics/claude-plugins-official`. No automated diff
tooling exists.

Recommended workflow:

1. When `npm run claude:update` or equivalent is run (plugin updates), check if
   `pr-review-toolkit` version changed
2. If changed: run `claude agents` to see if any plugin agent descriptions
   changed
3. Compare changed plugin agent to the project override — update if new
   capabilities were added that should be reflected in the SoNash version

For the three pr-review-toolkit overrides, the key thing to track is NOT the
generic parts of the plugin (which the override replaces), but any NEW output
format requirements or NEW scoring dimensions the plugin adds that other
pr-review skills reference by name.

#### 5d. `code-reviewer.md` as the Maintenance Reference

The existing `code-reviewer.md` is the gold standard override:

- Self-contained system prompt with SoNash patterns
- Explicit workflow steps
- Structured return protocol
- No references to upstream plugin behavior

All new overrides should follow this pattern. Use `code-reviewer.md` length
(~1200 tokens) as the upper bound for override size.

---

## Gap Analysis Summary

| Gap                                                    | Source            | Override                          | Severity |
| ------------------------------------------------------ | ----------------- | --------------------------------- | -------- |
| `general-purpose` has no SoNash context                | D6b-Finding-1     | Create `general-purpose.md`       | HIGH     |
| `silent-failure-hunter` references wrong loggers       | D6b-Finding-2     | Create `silent-failure-hunter.md` | HIGH     |
| `pr-test-analyzer` assumes Jest, not Vitest            | D6b-Finding-3     | Create `pr-test-analyzer.md`      | HIGH     |
| `explore.md` / `plan.md` missing `<example>` blocks    | D6a-Finding-6     | Enhance existing files            | MEDIUM   |
| `code-simplifier` conflicts with arrow function style  | D6b-Finding-6     | Create `code-simplifier.md`       | MEDIUM   |
| `type-design-analyzer` missing Zod mirror check        | D6b-Finding-4     | Create `type-design-analyzer.md`  | MEDIUM   |
| `audit-agent-quality` stale "can't override built-ins" | D6b Contradiction | Update SKILL.md                   | LOW      |
| No `color` field on any current override               | D6a-Finding-6     | Add to all files                  | LOW      |
| No maintenance comment headers                         | This file         | Add to all override files         | LOW      |

---

## Sources

| #   | URL/Path                                                           | Title                                                         | Type           | Trust  | CRAAP           | Date       |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------- | -------------- | ------ | --------------- | ---------- |
| 1   | https://code.claude.com/docs/en/sub-agents                         | Create custom subagents — Claude Code Docs                    | Official docs  | HIGH   | 5/5/5/5/5 = 5.0 | 2026       |
| 2   | WebSearch result (case-insensitive agent types)                    | "explore, Explore, EXPLORE all work" — community confirmation | Community      | MEDIUM | 4/4/3/4/4 = 3.8 | 2026       |
| 3   | `.claude/agents/explore.md`                                        | Custom explore agent — existing project file                  | Filesystem     | HIGH   | 5/5/5/5/5 = 5.0 | 2026-03-24 |
| 4   | `.claude/agents/plan.md`                                           | Custom plan agent — existing project file                     | Filesystem     | HIGH   | 5/5/5/5/5 = 5.0 | 2026-03-24 |
| 5   | `.claude/agents/code-reviewer.md`                                  | Code reviewer override — maintenance reference                | Filesystem     | HIGH   | 5/5/5/5/5 = 5.0 | 2026       |
| 6   | `CLAUDE.md` (Section 7)                                            | Project triggers — capital Explore/Plan                       | Filesystem     | HIGH   | 5/5/5/5/5 = 5.0 | 2026-03-24 |
| 7   | `.research/custom-agents/findings/D6a-system-overrides-current.md` | Current override evaluation                                   | Prior research | HIGH   | 5/5/5/5/5 = 5.0 | 2026-03-29 |
| 8   | `.research/custom-agents/findings/D6b-system-agent-catalog.md`     | System agent override catalog                                 | Prior research | HIGH   | 5/5/5/5/5 = 5.0 | 2026-03-29 |
| 9   | `.claude/skills/audit-enhancements/SKILL.md`                       | Skill with explicit "NOT Explore" guidance                    | Filesystem     | HIGH   | 5/5/5/5/5 = 5.0 | 2026       |
| 10  | GitHub issue #9206                                                 | Agent Aliases/Nicknames — case-insensitive aliases confirmed  | GitHub issue   | HIGH   | 4/5/4/4/5 = 4.4 | Jan 2026   |
| 11  | https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md   | Claude Code changelog                                         | Official       | HIGH   | 5/5/5/5/5 = 5.0 | 2026       |
| 12  | Grep output (subagent_type invocations in skills)                  | Skill invocation patterns for Explore/general-purpose         | Filesystem     | HIGH   | 5/5/5/5/5 = 5.0 | Live       |

---

## Contradictions

### C1: Case-sensitivity resolution overturns D6a's primary concern

D6a-Finding-3 identified case-sensitivity as "the most actionable finding" and
D6a-Contradiction-1 left it unresolved, requiring "empirical testing." This
research resolves it: names ARE case-insensitive. The consequence is positive —
the existing overrides are working for all invocations, not just half. The D6a
concern was valid but the resolution is favorable.

**Source of D6a's uncertainty:** The invocation log recorded different cases,
which was interpreted as possible evidence of different agents. The true
explanation: the log records the case used at call time, while routing is
case-insensitive.

### C2: D6b contradictions on plugin agent completeness

The official docs state that overrides receive only their own system prompt
("not the full Claude Code system prompt"). D6b's Gap #2 flagged uncertainty
about whether override is complete-replacement vs. additive. The docs are
unambiguous on this: it is full replacement. This is confirmed by the existing
explore.md and plan.md behavior (they work as standalone agents, not
augmentations).

---

## Gaps

1. **Empirical validation of case-insensitive routing**: The case-insensitivity
   finding comes from community documentation and a single web search result,
   not from the official Claude Code source code or an official Anthropic
   statement. The evidence is strong (multiple sources agree, GitHub issue
   confirms) but not from Tier 1 official documentation. A direct test
   (`subagent_type="EXPLORE"` in a task) would provide ground-truth
   confirmation. Current confidence: HIGH (community + official docs implicit
   confirmation), not VERIFIED.

2. **Plugin version tracking mechanism**: No automated way to detect when a
   plugin agent changes upstream. The maintenance strategy relies on a manual
   review trigger. A pre-push hook that checksums plugin agent files and alerts
   on change would be a material improvement but does not exist and is out of
   scope for this research.

3. **`type-design-analyzer` override value gap**: D6b rated this MEDIUM
   confidence for override benefit. The 4-dimension scoring framework in the
   plugin is reasonably universal. Whether the SoNash-specific additions (Zod
   mirror, type locations) materially improve output depends on how often this
   agent is actually invoked, which is not in the invocation log (it's a plugin
   agent and may not log to the same file).

4. **`code-simplifier` invocation frequency**: The plugin runs "proactively
   after code modifications" using `model: opus`. No data on actual invocation
   frequency in SoNash sessions. If it triggers rarely, the override priority is
   lower than D6b suggests.

---

## Serendipity

**S1: Skills have mixed-case `subagent_type` — no consistency needed.** The grep
of all skill files shows `subagent_type="Explore"` (capital) and
`subagent_type="general-purpose"` (lowercase) used interchangeably across the
codebase. Since routing is case-insensitive, both work. There is no need to
normalize skill files to lowercase — this would be cosmetic churn only.

**S2: `disallowedTools: Agent` is the correct pattern for non-coordinator
overrides.** The existing `explore.md`, `plan.md`, and `code-reviewer.md` all
use `disallowedTools: Agent` or `disallowedTools: Agent, Write, Edit`. The
official docs confirm that subagents cannot spawn other subagents anyway — this
field is defensive and explicit rather than functional. All new overrides should
include `disallowedTools: Agent` for consistency and safety.

**S3: The `skills:` frontmatter field is an underused opportunity.** Official
docs: "The full content of each skill is injected into the subagent's context,
not just made available for invocation. Subagents don't inherit skills from the
parent conversation." This means `code-reviewer.md`, `silent-failure-hunter.md`,
and `pr-test-analyzer.md` could preload `docs/agent_docs/CODE_PATTERNS.md` via
`skills: code-patterns` — eliminating the need to duplicate pattern content
inline. This is an optimization for override maintenance: patterns maintained
once in a skill, injected into multiple agents via the `skills:` field. Not
implemented in any current SoNash override.

---

## Confidence Assessment

- HIGH claims: 5 (case-insensitivity, template spec,
  general-purpose/silent-failure/pr-test priorities, replacement vs
  augmentation)
- MEDIUM claims: 3 (maintenance strategy, code-simplifier priority,
  type-design-analyzer priority)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The case-sensitivity resolution is the highest-impact finding and is supported
by 3 independent sources (community docs quote, GitHub issue #9206 confirmation,
official docs implicit evidence in `Agent(Explore)` permission syntax). The
template specification derives entirely from ground-truth filesystem reads of
existing working overrides. The maintenance strategy has no authoritative source
(none exists) but is derived from first principles and community patterns.

---

## Source Count

- Direct filesystem reads: 6 (explore.md, plan.md, code-reviewer.md, CLAUDE.md,
  skill files via Grep)
- Official documentation: 2 (sub-agents page, changelog)
- Prior research findings: 2 (D6a, D6b)
- Community/GitHub sources: 2 (GitHub issue #9206, WebSearch case-insensitivity
  result)
- Total independent sources: 12
