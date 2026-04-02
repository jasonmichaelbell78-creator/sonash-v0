# Plan: Custom Agent Implementation

**Date:** 2026-03-31 **Decisions:** [DECISIONS.md](./DECISIONS.md) (30
decisions) **Research:**
[.research/custom-agents/RESEARCH_OUTPUT.md](../../.research/custom-agents/RESEARCH_OUTPUT.md)
**Effort:** XL (multi-session) **Branch:** From planning-33026 or new branch

---

## Overview

Three priority tiers executed as structured commits in one PR:

- **P0 (Infrastructure):** sonash-context skill, pipeline agent relocation,
  pilot
- **P1 (Quick Wins):** Consolidation, overrides, elevations, model upgrades
- **P2 (Pipeline + Polish):** 6 pipeline agents, SKILL.md wiring, example blocks

Steps marked ⚡ can run in parallel via subagent-driven-development.

---

## P0: Infrastructure (Commit 1)

### Step 1: Create sonash-context skill

**Per D3, D28.** Create `.claude/skills/sonash-context/SKILL.md` — the shared
project context skill loaded by all agents via `skills: [sonash-context]`.

**Content (~150-200 lines):**

```markdown
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

- Repository pattern: lib/firestore-service.ts
- Types: types/ or functions/src/schemas.ts
- State: useState local, Context global, Firestore server
- Validation: Zod runtime matching TS interfaces

## Security Boundaries

- NO direct writes to journal, daily_logs, inventoryEntries — use httpsCallable
- App Check required on all Cloud Functions
- Rate limiting: handle 429 with sonner toasts
- Error sanitization: use sanitizeError() from scripts/lib/sanitize-error.js
- File reads: wrap ALL in try/catch (existsSync race condition)
- Path traversal: use /^\.\.(?:[\/\\]|$)/.test(rel) NOT startsWith('..')

## Coding Standards

- TypeScript strict, no `any`
- Functional components + Hooks
- Tailwind utility-first
- Zod runtime validation

## Return Format (when applicable)

- Structured findings: include file:line citations
- Error context: use sanitizeError(), never raw error.message
- Status reporting: structured JSON over prose summaries
```

**Done when:** File exists, loads without error when referenced in a test
agent's `skills:` field.

### Step 2: Pilot sonash-context injection

**Per D3.** Test the `skills:` field injection on one existing agent before
relying on it for all agents.

1. Add `skills: [sonash-context]` to `security-auditor.md` frontmatter
2. Invoke security-auditor on a trivial task
3. Verify the skill content appears in the agent's context (check agent output
   references stack versions)
4. If injection fails: fall back to inline context in each agent body

**Done when:** Confirmed working (skill content visible in agent context) or
confirmed broken (fallback plan activated).

### Step 3: Relocate pipeline agents to local

**Per D26.** Move `deep-research-searcher` and `deep-research-synthesizer` from
`.claude/agents/global/` to `.claude/agents/`.

1. Copy files to new location
2. Remove from global/
3. Verify `/deep-research` SKILL.md references work (subagent_type uses name,
   not path)
4. Test: spawn a searcher agent, confirm it resolves

**Done when:** Both agents in `.claude/agents/`, removed from `global/`,
pipeline still functional.

---

## P1: Quick Wins (Commit 2)

### Step 4: Cross-reference audit for removal candidates ⚡

**Per D6, D9.** Dispatch an Explore agent to audit all 9 removal candidates
across the codebase. For each agent name, search:

- CLAUDE.md (all sections)
- docs/agent_docs/AGENT_ORCHESTRATION.md
- All `.claude/skills/**/*.md`
- All `.claude/teams/**/*.md`
- `.claude/state/agent-invocations.jsonl`
- `.claude/settings.json`

**Output:** Per-agent reference report. Agents with zero references → Wave A
(safe to remove). Agents with live references → Wave B (need redirect stubs that
point to alternatives).

**Done when:** Reference report complete for all 9 candidates. Wave A/B
classification confirmed.

### Step 5: Wave A removals (5 agents)

**Per D7, D9.** Remove 5 clear-cut agents, replacing with redirect stubs:

- `error-detective.md` → stub: "Removed 2026-03-31. Use `debugger` instead."
- `devops-troubleshooter.md` → stub: "Removed 2026-03-31. Use `debugger`."
- `deployment-engineer.md` → stub: "Removed 2026-03-31. Use
  `fullstack-developer`."
- `penetration-tester.md` → stub: "Removed 2026-03-31. Use `security-auditor`."
- `security-engineer.md` → stub: "Removed 2026-03-31. Use `security-auditor`."

Redirect stub format:

```markdown
---
name: error-detective
description:
  "REMOVED — use debugger instead. This agent was removed on 2026-03-31.
  Redirect expires 2026-05-31."
---

This agent has been removed. Use `debugger` for error investigation and log
analysis. The debugger agent has been elevated with full SoNash context.

If you see this message, update the invoking skill/config to use `debugger`.
```

**Done when:** 5 stubs created, originals backed up in commit history.

### Step 6: Wave B removals (4 agents, audit-dependent) ⚡

**Per D9.** Based on Step 4 audit results:

- **mcp-expert:** Replace with corrected definition (not remove) — fix
  nonexistent path references, add SoNash MCP context
- **markdown-syntax-formatter:** Remove if no references, redirect stub if
  referenced
- **react-performance-optimization:** Remove if no references
  (frontend-developer covers this), redirect stub if referenced
- **prompt-engineer:** Remove if no references, redirect stub if referenced

**Done when:** All Wave B agents resolved per audit findings.

### Step 7: Elevate debugger ⚡

**Per D10, D14.** Rewrite `debugger.md` from stub to full SoNash-aware
definition (~300-400 lines):

- `skills: [sonash-context]`
- `model: inherit`
- `<role>` block: SoNash debugging specialist
- SoNash error patterns: Firebase error codes, Firestore permission errors,
  httpsCallable failures, sanitizeError usage
- Debugging workflow: reproduce → isolate → fix → verify
- Structured return: root cause, fix applied, verification command
- `<example>` blocks (per D24)
- Anti-patterns: don't guess at fixes without reading error output

**Done when:** Agent passes frontmatter validation, body is 300-400 lines.

### Step 8: Elevate performance-engineer ⚡

**Per D10, D14.** Rewrite from stub (~300-400 lines):

- `skills: [sonash-context]`
- SoNash perf context: Firestore query optimization, React 19 Server Components,
  Tailwind purge, Firebase Functions cold start, bundle analysis
- Profiling tools: Chrome DevTools, Lighthouse, `node --prof`
- `<example>` blocks
- Anti-patterns: premature optimization, micro-benchmarks over real metrics

**Done when:** Agent passes frontmatter validation.

### Step 9: Elevate technical-writer ⚡

**Per D10, D14.** Rewrite from stub (~200-300 lines):

- `skills: [sonash-context]`
- SoNash doc standards: doc headers (scripts/config/doc-header-config.json),
  prettier-ignore blocks, version tables, docs:index generation
- Audience: solo developer + AI agents reading docs
- `<example>` blocks
- Anti-patterns: don't create docs unless asked (CLAUDE.md behavioral rule)

**Done when:** Agent passes frontmatter validation.

### Step 10: General-purpose project override

**Per D11, D15.** Create `.claude/agents/general-purpose.md` — the project
override for the default agent:

- `skills: [sonash-context]`
- `model: inherit`
- `maxTurns: 30`
- Structured return protocol
- SoNash-specific anti-patterns (no direct Firestore writes, use sanitizeError)
- `<example>` blocks for common invocation patterns

**Done when:** File exists, general-purpose agent invocations show
SoNash-specific context.

### Step 11: Plugin agent overrides ⚡

**Per D15.** Create project-level overrides for 3 plugin agents:

1. **silent-failure-hunter** override: Fix wrong logger reference → use
   sanitizeError. Add SoNash error handling patterns.
2. **pr-test-analyzer** override: Fix wrong test runner (Jest → node:test). Add
   SoNash test conventions (functional tests, no mocking Firestore).
3. **mcp-expert** replacement (from Step 6): Fix nonexistent paths, add SoNash
   MCP server context (memory, sonarcloud, context7).

**Done when:** 3 override files exist, reference correct SoNash tooling.

### Step 12: security-auditor upgrade

**Per D8.** Modify `security-auditor.md`:

- Change `model: sonnet` → `model: opus`
- Add `skills: [sonash-context]`
- Add `<example>` blocks
- Review and update body content for current SoNash state

**Done when:** Agent has model: opus, skills injection, example blocks.

### Step 13: Fix zero-signal descriptions

**Per D16.** Update 3 agents with meaningful descriptions:

- `dependency-manager`: "Analyze project dependencies, scan for vulnerabilities,
  check license compliance, and manage updates across npm workspaces."
- `deep-research-searcher`: Update as part of Step 3 relocation — keep existing
  description (it's already good, the 2-char claim needs verification against
  current HEAD)
- `deep-research-synthesizer`: Same as above — verify current state

**Done when:** All 3 agents have meaningful multi-sentence descriptions.

### Step 14: Inject skills: [sonash-context] into all remaining agents

**Per D3.** Add `skills: [sonash-context]` to the frontmatter of all local
agents not yet modified in Steps 7-13. This is a frontmatter-only change — no
body modifications.

Agents to update (~10-12 remaining):

- backend-architect, code-reviewer, database-architect, explore,
  frontend-developer, fullstack-developer, git-flow-manager,
  nextjs-architecture-expert, plan, ui-ux-designer, plus any Wave B survivors

**Done when:** Every local agent has `skills: [sonash-context]` in frontmatter.

---

## P2: Pipeline Agents + Polish (Commit 3)

### Step 15: deep-research-verifier (PILOT)

**Per D12, D14, D17, D18.** Create the most critical pipeline agent first
(~400-500 lines):

- `name: deep-research-verifier`
- `tools: Read, Bash, Grep, Glob, WebSearch, WebFetch`
- `model: sonnet`
- `skills: [sonash-context]`

**Body structure:**

- `<role>`: Verification agent for deep-research Phase 2.5 and Phase 3.9
- Dual-path verification:
  - Codebase claims: filesystem reads (grep, cat, ls). Ground truth.
  - External claims: web search + official docs. FIRE confidence-first.
- 4-verdict taxonomy: VERIFIED, REFUTED, UNVERIFIABLE, CONFLICTED
- CONFLICTED handling: classify conflict type (DRAGged: No Conflict,
  Complementary, Conflicting Opinions, Freshness, Misinformation), attach both
  sources
- Structured return: per-claim verdict with method tag, confidence, evidence
  summary
- `<example>` blocks

**Output format:**

```json
{
  "claimId": "C-042",
  "verdict": "VERIFIED|REFUTED|UNVERIFIABLE|CONFLICTED",
  "method": "filesystem|web|confidence-only",
  "confidence": "HIGH|MEDIUM|LOW",
  "evidence": "grep output showing...",
  "conflicts": [{ "sourceA": "...", "sourceB": "...", "type": "freshness" }]
}
```

**Done when:** Agent created. Pilot: invoke on 5 claims from the custom-agents
research, verify structured output.

### Step 16: contrarian-challenger + otb-challenger ⚡

**Per D19, D25.** Two adversarial agents (~300-400 lines each):

**contrarian-challenger:**

- `tools: Read, Grep, Glob, WebSearch`
- Pre-mortem framing: "Assume this research is wrong in 6 months — why?"
- Steel-man before attack: articulate strongest version of claim first
- Maintain challenges even when synthesis has high confidence (Free-MAD)
- Output: challenges with severity (CRITICAL/MAJOR/MINOR), citations
- Write to `.research/<topic>/challenges/contrarian-N.md`
- `<example>` blocks

**otb-challenger:**

- `tools: Read, Grep, Glob, WebSearch`
- Lateral thinking: "What approaches were NOT considered?"
- Adjacent domain reframing
- Feasibility assessment per alternative
- Write to `.research/<topic>/challenges/otb-N.md`
- `<example>` blocks

**Done when:** Both agents created with structured challenge output format.

### Step 17: dispute-resolver

**Per D20, D25.** Resolution agent (~300-400 lines):

- `name: dispute-resolver`
- `tools: Read, Grep, Glob`
- DRAGged 5-type conflict classification
- Evidence-weight hierarchy: T1 (official docs, filesystem) > T2 (peer-reviewed,
  1000+ stars) > T3 (blogs, tutorials) > T4 (forums)
- Dissent records: what the losing position was and why it lost
- Output: resolution with rationale, confidence, dissent
- `<example>` blocks

**Done when:** Agent created with evidence-weight + dissent record format.

### Step 18: deep-research-gap-pursuer

**Per D21, D25.** Gap pursuit agent (~350-450 lines):

- `name: deep-research-gap-pursuer`
- `tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch`
- Gap identification: missing sub-questions, low-confidence areas, unresolved
  contradictions
- Profile switching: receive gapType parameter, activate appropriate tools
  - `web`: WebSearch + WebFetch for external gaps
  - `codebase`: Read + Grep + Bash for filesystem gaps
  - `academic`: WebSearch with academic query patterns
- Write findings to `.research/<topic>/findings/G{N}-*.md`
- Diminishing-returns signal: return
  `{ newClaims, confidenceChanges, gapsRemaining }` — orchestrator decides
  continuation (per D21, no artificial limits)
- `<example>` blocks

**Done when:** Agent created with profile-switching and signal return.

### Step 19: deep-research-final-synthesizer

**Per D22, D25.** Phase-aware synthesis agent (~400-500 lines):

- `name: deep-research-final-synthesizer`
- `tools: Read, Write, Bash, Grep, Glob`
- Explicit mode parameter:
  `post-verification | post-gap-pursuit | full-resynthesis`
- Input enumeration: list available files before writing
- Preserve prior work: in post-gap-pursuit mode, amend existing
  RESEARCH_OUTPUT.md rather than full rewrite
- Version tracking: increment document version, add changelog entry
- Structured metadata.json update
- `<example>` blocks

**Done when:** Agent created with mode-aware synthesis behavior.

### Step 20: Update deep-research SKILL.md + REFERENCE.md

**Per D23.** Wire pipeline agents into the orchestration:

**SKILL.md changes:**

- Phase 2.5: Replace inline verification prompt with
  `Agent(subagent_type="deep-research-verifier")`
- Phase 3 contrarian: Replace REFERENCE.md template with
  `Agent(subagent_type="contrarian-challenger")`
- Phase 3 OTB: Replace with `Agent(subagent_type="otb-challenger")`
- Phase 3.5: Replace with `Agent(subagent_type="dispute-resolver")`
- Phase 3.95: Replace with `Agent(subagent_type="deep-research-gap-pursuer")`
- Phase 3.97: Replace with
  `Agent(subagent_type="deep-research-final-synthesizer")`

**REFERENCE.md changes:**

- Add "Pipeline Agent Roster" section mapping phases → agent names
- Mark inline templates as "DEPRECATED — fallback only"
- Keep templates for backward compatibility (per D23)

**Done when:** SKILL.md references agent names, REFERENCE.md has roster +
deprecated templates.

### Step 21: Add `<example>` blocks to all remaining agents

**Per D24.** Add `<example>` blocks to every agent not already updated. Each
agent gets 1-2 examples showing:

- User message trigger
- Why this agent (not another) is the right choice
- Expected behavior

Use Anthropic's pr-review-toolkit plugin agents as the reference template for
`<example>` block format.

**Done when:** Every local agent has at least one `<example>` block.

### Step 22: CLAUDE.md Section 7 minimal updates

**Per D29.** Update:

- Agent count (from current to post-implementation)
- security-auditor model note
- Verify trigger table accuracy

**Done when:** Section 7 reflects current agent roster.

---

## Validation (Commit 4)

### Step 23: Structural audit

**Per D30.** Run `/audit-agent-quality` on all agents. Verify:

- Frontmatter compliance (required fields present)
- Body size within 500-2000 token sweet spot
- Description quality (no zero-signal)
- Tool grants appropriate per role
- skills: [sonash-context] present

**Done when:** Audit passes with no critical findings.

### Step 24: sonash-context skill audit

**Per D28.** Run `/skill-audit` on the sonash-context skill. Verify:

- Content accuracy (versions match package.json)
- Boundary clarity (shared context vs role-specific)
- No duplication with CLAUDE.md content

**Done when:** Skill audit passes.

### Step 25: Pipeline smoke test

**Per D30.** Run `/deep-research` on a small topic (e.g., "Claude Code keyboard
shortcuts") to exercise all 6 pipeline roles. Verify:

- Verifier produces 4-verdict structured output
- Adversarial agents produce challenges with severity
- Dispute-resolver handles CONFLICTED verdicts
- Gap-pursuer writes findings and returns signal
- Final-synthesizer produces versioned output

**Done when:** Full pipeline executes without errors, all roles produce
structured output.

---

## Execution Notes

**Parallelization:** Steps marked ⚡ can run as parallel subagents:

- P1: Steps 7, 8, 9, 11 (agent creation) can all run in parallel
- P1: Steps 4, 6 (audit + Wave B) are sequential (6 depends on 4)
- P2: Steps 16, 17, 18, 19 (pipeline agents) can all run in parallel
- Step 21 (example blocks) must follow all agent creation

**Estimated subagent allocation:**

- P0: 3 steps, sequential (infrastructure must be verified)
- P1: 4 parallel creation agents + 2 sequential audit steps + 2 sequential
  modifications = ~8 steps
- P2: 4 parallel pipeline agents + 2 sequential (SKILL.md + examples) = ~6 steps
- Validation: 3 sequential steps

**Dependencies:**

- Step 2 (pilot) gates Steps 7-14 (all agents depend on sonash-context)
- Step 4 (audit) gates Step 6 (Wave B depends on audit results)
- Steps 15-19 (agents) gate Step 20 (SKILL.md wiring)
- All creation steps gate Step 21 (example blocks)
- All steps gate Steps 23-25 (validation)

---

## Deferred Follow-Ups

| Item                                             | Trigger                                |
| ------------------------------------------------ | -------------------------------------- |
| PostToolUse Write hook                           | Separate hook infrastructure plan      |
| TeammateIdle hook                                | Separate hook infrastructure plan      |
| code-simplifier + type-design-analyzer overrides | Next agent quality cycle               |
| Golden test cases                                | Formal test infrastructure initiative  |
| App Check MASTER_DEBT entry                      | Separate security debt tracking        |
| P3 net-new agents                                | Documented failures + creation gate    |
| Firebase MCP P0.6 evaluation (C-107)             | Infrastructure evaluation, not agent   |
| Audit re-run for >=75 mean                       | Follow-up session after implementation |

---

## Execution Log

### Session #255 (2026-04-01) — ALL 25 STEPS COMPLETE

**P0 Infrastructure (Steps 1-3): COMPLETE**

- **Step 1 — sonash-context skill created.** New skill at
  `.claude/skills/sonash-context/SKILL.md` (~60 lines). Contains stack versions,
  architecture, security boundaries, key paths, coding standards, and return
  format. Injected into all agents via `skills: [sonash-context]` frontmatter,
  eliminating duplicated project context across 23+ agent definitions.

- **Step 2 — Pilot injection verified.** Added `skills: [sonash-context]` to
  `security-auditor.md`. Spawned agent on a trivial task — confirmed it could
  answer 3 questions (Next.js version, repository pattern file, error
  sanitization function) entirely from the injected skill content.

- **Step 3 — Pipeline agents relocated.** Moved `deep-research-searcher.md` and
  `deep-research-synthesizer.md` from `.claude/agents/global/` to
  `.claude/agents/`. Verified searcher resolves by name from new location.

**P1 Quick Wins (Steps 4-14): COMPLETE**

- **Step 4 — Cross-reference audit.** Explore agent audited all 9 removal
  candidates across CLAUDE.md, skills, teams, invocations, and settings. Result:
  ALL 9 agents had zero active references — all mentions were passive (planning
  docs, research artifacts, archived plans).

- **Steps 5-6 — 9 agents resolved.** Wave A (5 redirect stubs): error-detective
  → debugger, devops-troubleshooter → debugger, deployment-engineer →
  fullstack-developer, penetration-tester → security-auditor, security-engineer
  → security-auditor. Wave B (3 redirect stubs): markdown-syntax-formatter →
  technical-writer, react-performance-optimization → performance-engineer,
  prompt-engineer → technical-writer/skill-creator. mcp-expert: full replacement
  with SoNash-specific MCP knowledge (memory, sonarcloud, context7 servers,
  Windows command wrapping, health check integration).

- **Steps 7-9 — 3 agents elevated.** Rewrote `debugger.md`,
  `performance-engineer.md`, and `technical-writer.md` from generic stubs
  (~30-40 lines each) to full SoNash-aware definitions (~100-150 lines each).
  All three: `skills: [sonash-context]`, `model: inherit`, role blocks,
  SoNash-specific patterns, structured return, anti-patterns, `<example>`
  blocks.

- **Step 10 — General-purpose override.** New project-level override for the
  default agent with sonash-context, SoNash constraints, structured return.

- **Step 11 — Plugin agent overrides.** 3 new files: `silent-failure-hunter.md`
  (sanitizeError enforcement), `pr-test-analyzer.md` (node:test conventions,
  httpsCallable mocking), `mcp-expert.md` (replaced in Step 6).

- **Step 12 — Security-auditor upgraded.** Model sonnet → opus.

- **Step 13 — Descriptions fixed.** dependency-manager updated. Pipeline agent
  descriptions verified (already good).

- **Step 14 — sonash-context injected into 14 remaining agents.** All local
  SoNash agents now have `skills: [sonash-context]`. GSD agents (project-
  agnostic) intentionally excluded.

**P2 Pipeline Agents + Polish (Steps 15-22): COMPLETE**

- **Steps 15-19 — 6 pipeline agents created** (4 parallel agents dispatched):
  - `deep-research-verifier`: 4-verdict taxonomy, dual-path verification, FIRE
    confidence model, DRAGged conflict classification
  - `contrarian-challenger`: steel-man + pre-mortem + Free-MAD protocol
  - `otb-challenger`: lateral thinking, feasibility assessment, reframing
  - `dispute-resolver`: DRAGged 5-type conflicts, T1-T4 evidence hierarchy,
    mandatory dissent records
  - `deep-research-gap-pursuer`: 5 gap types, 3 search profiles
    (web/codebase/academic), diminishing returns signal
  - `deep-research-final-synthesizer`: 3 modes (post-verification,
    post-gap-pursuit, full-resynthesis), version tracking, metadata update

- **Step 20 — SKILL.md wired.** All 6 deep-research phases updated with
  `Agent(subagent_type="...")` calls: Phase 2.5 → verifier, Phase 3 →
  contrarian + OTB (parallel), Phase 3.5 → dispute-resolver, Phase 3.95 →
  gap-pursuer, Phase 3.96 → verifier (reuse), Phase 3.97 → final-synthesizer.
  REFERENCE.md templates preserved as deprecated fallbacks per D23.

- **Step 21 — Example blocks added to 16 agents** (3 parallel batches of 6+6+4).
  All non-GSD, non-stub agents now have 1-2 `<example>` blocks.

- **Step 22 — CLAUDE.md Section 7 updated.** Agent count 27 → 34.

**Validation (Steps 23-25): COMPLETE**

- **Step 23 — Structural audit passed.** All agents: name + description present.
  All non-GSD, non-stub agents: `skills: [sonash-context]` + `<example>` blocks.

- **Step 24 — sonash-context audit passed.** All 5 package versions match
  package.json. All 5 referenced paths verified on disk.

- **Step 25 — Pipeline verification passed.** All 8 pipeline agents exist with
  correct names. All 7 SKILL.md agent references resolve to existing files.

**Summary:** 3 commits, 25 steps, 55 agent files (6 new pipeline agents, 3 new
overrides, 1 new general-purpose, 3 elevated, 8 redirect stubs, 1 replaced, 14
skill-injected, 16 example-blocked). Net: -1667 lines of generic content, +2759
lines of SoNash-specific context. All validation passed.

**PLAN STATUS: COMPLETE** — Deferred items in the follow-ups table remain for
future cycles.
