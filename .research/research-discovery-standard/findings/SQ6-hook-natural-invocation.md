# SQ6: Hook & Natural Invocation Analysis

<!-- prettier-ignore-start -->
**Sub-question:** What hooks detect research-worthy situations today, and what gaps exist for natural invocation of research/discovery?
**Researcher:** Claude Opus 4.6 (1M context)
**Date:** 2026-03-24
**Status:** COMPLETE
**Confidence:** HIGH (direct code analysis of all four hook files + settings + configs)
<!-- prettier-ignore-end -->

---

## 1. Current Hooks That Detect Complexity/Research-Worthy Situations

### 1.1 user-prompt-handler.js (UserPromptSubmit)

The primary detection hook. Runs on every user prompt. Six detection priorities:

| Priority        | What It Detects                                                              | Mechanism                                   | Output Type             | Research Relevance                                      |
| --------------- | ---------------------------------------------------------------------------- | ------------------------------------------- | ----------------------- | ------------------------------------------------------- |
| P1: Security    | Keywords: security, authentication, oauth, xss, injection, etc.              | `matchesWord()` on 14 strong + 4 weak terms | stdout directive (MUST) | **Indirect** -- triggers security-auditor, not research |
| P2: Bug/Debug   | Keywords: bug, broken, crash, debug, exception + phrases                     | `matchesWord()` + `matchesPhrase()`         | stdout directive (MUST) | **None** -- routes to systematic-debugging              |
| P3: Database    | Keywords: database, migration, sql, firestore+query                          | `matchesWord()`                             | stdout directive (MUST) | **None** -- routes to database-architect                |
| P4: UI/Frontend | Keywords: frontend, css, tailwind, component+create                          | `matchesWord()`                             | stdout directive (MUST) | **None** -- routes to frontend-design                   |
| P5: Planning    | Keywords: architect, implement feature, add feature, new feature             | `matchesWord()`                             | stderr hint (Consider)  | **Weak** -- suggests Plan agent, not research           |
| P6: Exploration | Phrases: "explore the", "understand how", "how does this", "walk me through" | `matchesPhrase()`                           | stderr hint (Consider)  | **Moderate** -- suggests Explore agent                  |

**Plan Mode Suggestion (Section 4):** Detects multi-step tasks via:

- Implementation keywords (implement, create, build, refactor, migrate, etc.)
- Complexity signals: multiple `and` clauses, comma-separated lists, numbered
  items, "across the codebase", "multiple files", "from scratch", "step by
  step", "phase N"
- Word count > 50
- Output: stderr banner suggesting Plan mode or `/deep-plan`

**Key observation:** The word "research" itself is NOT a trigger keyword in any
priority. Neither is "investigate", "discovery", "understand", "learn",
"unfamiliar", or "how should we approach."

### 1.2 post-write-validator.js (PostToolUse: Write/Edit)

The agent trigger enforcer (Validator 10) detects file patterns that should
trigger specific agents:

| File Pattern                                     | Suggested Agent  | Research Relevance |
| ------------------------------------------------ | ---------------- | ------------------ |
| `\.(ts\|tsx\|js\|jsx)$` (excl. tests, functions) | code-reviewer    | **None**           |
| `functions/src/.*\.ts$` (excl. tests)            | security-auditor | **None**           |
| `firestore\.rules$`                              | security-auditor | **None**           |

**Config source:** `scripts/config/agent-triggers.json` -- contains exactly 3
triggers, all for code-reviewer or security-auditor. No research or exploration
triggers.

**Review queue:** Tracks file modifications and queues `/code-reviewer` when
threshold (5 files) is reached. No research equivalent.

### 1.3 post-read-handler.js (PostToolUse: Read)

Tracks files read per session. Two functions:

1. **Context tracking:** Counts files read, warns at 15+ files, warns
   on >5000-line files
2. **Auto-save context:** At 20+ files read, triggers MCP memory save

**Research relevance:** **None direct.** The "many files read" signal could
indicate codebase exploration that might benefit from structured research, but
this is not detected or surfaced.

### 1.4 session-start.js (SessionStart)

Runs build checks, pattern compliance, consolidation, review lifecycle,
enforcement pipeline. Surfaces:

- Previous session incomplete warnings
- Dependency install status
- Pattern compliance violations
- Hook warnings from JSONL
- TDMS health metrics

**Research relevance:** **None.** Entirely focused on build health and
compliance. Does not detect research-worthy situations or suggest research based
on session context.

### 1.5 pre-commit-agent-compliance.js (PreToolUse: Bash)

Blocks commits if required agents (code-reviewer, security-auditor) were not
invoked. Checks `.claude/hooks/.session-agents.json` for invocation records.

**Research relevance:** **None.** Only enforces code-reviewer and
security-auditor.

---

## 2. Current Behavioral Rules in CLAUDE.md That Trigger Research

### 2.1 Section 7 PRE-TASK Triggers (Behavioral, Not Enforced by Hooks)

| Trigger                       | Action                                  | Enforcement                         |
| ----------------------------- | --------------------------------------- | ----------------------------------- |
| Thorough planning requested   | `deep-plan` skill                       | Behavioral only                     |
| Domain/technology research    | `deep-research` skill                   | Behavioral only                     |
| Bug/error/unexpected behavior | `systematic-debugging`                  | Hook-enforced (P2)                  |
| Exploring unfamiliar code     | `Explore` agent                         | Hook hint (P6)                      |
| Multi-step implementation     | `Plan` agent                            | Hook hint (P5) + banner (Section 4) |
| Multi-file feature (3+ files) | Development team                        | Behavioral only                     |
| Multi-phase project           | `/gsd:new-project` or `/gsd:plan-phase` | Behavioral only                     |
| Security/auth (no S0/S1)      | `security-auditor` agent                | Hook-enforced (P1)                  |

### 2.2 Research-Specific Triggers in CLAUDE.md

The only explicit research trigger: **"Domain/technology research" ->
`deep-research` skill.**

This is purely behavioral with `[BEHAVIORAL: no automated enforcement]`. There
is no hook, no pattern matcher, and no automated detection for when research
SHOULD be invoked.

### 2.3 research-plan-team Spawn Triggers

From `.claude/teams/research-plan-team.md`, the team spawns when:

1. `/deep-research` followed by `/deep-plan` on the same topic
2. Research complexity is L or XL (3+ sub-questions)
3. Plan will drive multi-session implementation
4. `/deep-plan` with `--research` flag
5. Plan phase involves domain the user explicitly flags as unfamiliar

All of these require the user to explicitly invoke `/deep-research` or
`/deep-plan` first. There is zero automatic detection of when these conditions
are met.

---

## 3. Gap Analysis: Situations That SHOULD Trigger Research But Don't

### Gap G1: Unfamiliar Code Navigation (Confidence: HIGH)

**Situation:** AI is asked to modify code in a subsystem it hasn't read before
in this session.

**Current state:** The Explore agent description says "Use PROACTIVELY when
navigating new subsystems" but no hook detects this condition. The
post-read-handler tracks files read but doesn't analyze whether the AI is
entering unfamiliar territory.

**Signal:** First read of files in a directory subtree that hasn't been touched
this session + modification request for that area. E.g., reading
`functions/src/` files for the first time in a session and then being asked to
modify them.

**Impact:** High. Without exploration first, the AI guesses at architecture and
makes errors.

### Gap G2: New Domain / Technology Questions (Confidence: HIGH)

**Situation:** User asks about a technology or domain the AI may have stale
training data on (e.g., "how does Next.js 16 handle X?" or "what's the best
approach for Firebase 12 feature Y?").

**Current state:** No hook detects version-specific questions or technology
queries. The stack versions table in CLAUDE.md warns not to flag them as invalid
but doesn't trigger research.

**Signal:** Mention of specific technology + version number, "how to", "best
practice", "recommended approach", "what's the pattern for" -- especially when
combined with bleeding-edge stack versions.

**Impact:** High. The AI's training data is May 2025; the stack versions in
CLAUDE.md are from 2026. Any implementation advice may be outdated.

### Gap G3: Conflicting Information Encountered (Confidence: HIGH)

**Situation:** AI reads documentation or code that contradicts other
documentation or code it has already read in the session.

**Current state:** No hook or behavioral rule detects contradictions. The AI may
silently choose one interpretation.

**Signal:** Reading files where content conflicts with previously read content
(e.g., ROADMAP says feature is planned, but code shows it's partially
implemented; two docs describe different approaches to the same problem).

**Impact:** Medium-high. Silently resolving contradictions leads to subtle bugs
or wrong architectural decisions.

### Gap G4: Security-Sensitive Design Decisions (Confidence: MEDIUM)

**Situation:** User asks the AI to design a new feature that involves auth, data
access, or privacy -- not just modify existing security code.

**Current state:** P1 security detection triggers `security-auditor` for
keywords like "authentication", "oauth", etc. But the security-auditor reviews
existing code; it doesn't research best practices for new designs. No trigger
for `/deep-research` on security topics.

**Signal:** Security keywords + design keywords (design, architect, plan, new
feature, add) in combination.

**Impact:** Medium. The auditor catches violations but doesn't prevent bad
design decisions upstream.

### Gap G5: Multi-Session / Multi-Phase Work Starting (Confidence: HIGH)

**Situation:** User begins a large project that will span multiple sessions
(e.g., "we need to build a new reporting module" or "let's overhaul the auth
system").

**Current state:** The Plan Mode Suggestion banner fires for complex requests,
suggesting `/deep-plan`. But it does not suggest `/deep-research` before
`/deep-plan`. The `research-plan-team` requires explicit invocation.

**Signal:** Complexity signals from the existing plan-mode detection +
indicators of duration ("over the next few sessions", "multi-phase", "big
project", "major feature").

**Impact:** High. Without research first, plans are built on assumptions that
may be wrong.

### Gap G6: Repeated Failures / Debugging Dead Ends (Confidence: MEDIUM)

**Situation:** AI has been debugging for multiple turns without resolution, or a
fix attempt fails repeatedly.

**Current state:** P2 bug detection triggers `systematic-debugging` on the FIRST
mention of a bug. But there's no escalation to research when debugging stalls.
The `systematic-debugging` skill itself may not invoke research.

**Signal:** Multiple failed fix attempts in conversation history, or AI
expressing uncertainty ("I'm not sure why", "this is unexpected").

**Impact:** Medium. Research could uncover known issues, version-specific bugs,
or alternative approaches.

### Gap G7: First Touch of External Integrations (Confidence: MEDIUM)

**Situation:** Task involves integrating with an external API, service, or
library that the codebase hasn't used before.

**Current state:** No detection. The AI might implement based on training data
which may be outdated.

**Signal:** Import statements or package references not found in `package.json`,
mentions of APIs not previously used in the codebase.

**Impact:** Medium. External integrations are a common source of bugs from
outdated documentation.

---

## 4. How to Add Research-Tier Detection Without Over-Triggering

### 4.1 Alert Fatigue Risk Assessment

The current hook system already generates significant noise:

- **Guardrails message:** ~63 tokens on EVERY non-trivial prompt
- **Alerts reminder:** Every 10 minutes if pending alerts exist
- **Plan mode banner:** On any complex + implementation request
- **Agent suggestions:** On every file write matching triggers
- **Context warnings:** At 15+ files read

Adding research triggers to this mix risks wallpaper effect (Guardrail #6).

### 4.2 Recommended Anti-Fatigue Mechanisms

1. **Tiered output (already proven):**
   - `emitDirective()` (stdout, forces action) -- for MUST-research situations
   - `suggestStderr()` (stderr, hint only) -- for SHOULD-consider-research
     situations
   - Session-level dedup prevents repeat suggestions within 4-hour windows

2. **Compound signal thresholds:** Don't trigger on single keywords. Require 2+
   signals converging:
   - Unfamiliar code (G1): new directory + modification intent + no prior
     session reads
   - New domain (G2): technology keyword + version mention + "how to" or "best
     practice"
   - Conflicting info (G3): requires runtime contradiction detection (hardest to
     implement)

3. **Cooldown per research tier:**
   - Quick lookup suggestion: once per topic per session
   - Full research suggestion: once per day per topic area

4. **User control:**
   - A `"researchSensitivity": "low"|"medium"|"high"` setting in
     `.agent-trigger-state.json`
   - Low = only MUST triggers; Medium = MUST + exploration suggestions; High =
     all suggestions

### 4.3 Implementation Approach

**Phase 1 (Low risk, high value):** Add research keywords to
`user-prompt-handler.js`

- New Priority 5.5 between Planning and Exploration
- Trigger words: "research", "investigate", "what are the options", "compare
  approaches", "best practice for", "recommended way to"
- Output:
  `suggestStderr("Hint: Consider using /deep-research for domain investigation")`
- Implementation: ~30 lines added to `runAnalyze()`

**Phase 2 (Medium risk, high value):** Add research detection to plan-mode
suggestion

- When the multi-step banner fires, check if the topic involves unfamiliar
  technology
- If so, add: "Consider running /deep-research before /deep-plan for this topic"
- Modify existing `runPlanSuggestion()` with a technology-familiarity check

**Phase 3 (Higher complexity):** Add exploration-to-research escalation

- In `post-read-handler.js`, track directory subtrees being read for the first
  time
- After 5+ files in a new subtree, suggest: "You're exploring an unfamiliar
  area. Consider using Explore agent or /deep-research."
- Requires new state tracking in `.context-tracking-state.json`

---

## 5. Trigger Signal Taxonomy by Research Tier

### Tier 1: Quick Lookup (5-minute task, single source)

**Description:** Simple factual question that can be answered by checking one
authoritative source.

| Signal                            | Detection Point              | Example                                             |
| --------------------------------- | ---------------------------- | --------------------------------------------------- |
| "What is the syntax for X?"       | user-prompt-handler keyword  | "What's the Zod 4 syntax for discriminated unions?" |
| "How do I use X in this project?" | user-prompt-handler phrase   | "How do I use the rate limiter?"                    |
| Stack version + API question      | user-prompt-handler compound | "Does Next.js 16 support X?"                        |

**Appropriate response:** Read relevant docs/code. No formal research needed.
Maybe Explore agent.

### Tier 2: Focused Investigation (30-60 minutes, multiple sources)

**Description:** Question requiring comparison of approaches, evaluation of
tradeoffs, or synthesis from multiple sources.

| Signal                         | Detection Point              | Example                                                       |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------- |
| "What are the options for X?"  | user-prompt-handler phrase   | "What are the options for server-side caching in Next.js 16?" |
| "Compare X vs Y"               | user-prompt-handler phrase   | "Compare Zod vs Valibot for our validation layer"             |
| "Best practice for X"          | user-prompt-handler phrase   | "Best practice for Firebase auth token refresh"               |
| Security design + new feature  | user-prompt-handler compound | "Design the auth flow for the new admin panel"                |
| Technology not in package.json | post-write-validator pattern | New import of unknown package                                 |

**Appropriate response:** `/deep-research` with 2-3 sub-questions, or a focused
Explore + WebSearch combo.

### Tier 3: Full Research Campaign (2+ hours, structured output)

**Description:** Complex domain investigation requiring structured methodology,
multiple perspectives, and confidence-rated findings.

| Signal                       | Detection Point                | Example                                                                       |
| ---------------------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| Multi-phase project start    | user-prompt-handler complexity | "Build a new analytics dashboard with real-time updates"                      |
| Domain unfamiliarity flagged | user-prompt-handler phrase     | "I don't know much about WebSocket patterns"                                  |
| Architecture decision        | user-prompt-handler compound   | "Should we migrate from Firestore to Postgres?"                               |
| 3+ sub-questions identified  | behavioral (AI self-detection) | Any topic where the AI identifies it needs to answer multiple questions first |
| Previous research referenced | behavioral (AI self-detection) | "Based on the research from last session..." (needs verification)             |

**Appropriate response:** `/deep-research` (possibly with `research-plan-team`),
followed by `/deep-plan`.

---

## 6. How Hooks and Behavioral Rules Complement Each Other

### 6.1 Current Complementarity Model

```
    USER PROMPT
         |
         v
  [user-prompt-handler.js]     <-- Hook: keyword/phrase detection
  Detects: security, bugs,         Outputs: stdout directives, stderr hints
  UI, planning, exploration
         |
         v
  [CLAUDE.md Section 7]         <-- Behavioral: AI reads and follows
  Covers: research, debugging,     No automated enforcement
  exploration, teams, skills
         |
         v
  [post-write-validator.js]    <-- Hook: file-pattern detection
  Detects: code files,             Outputs: agent suggestions
  security files
         |
         v
  [pre-commit-agent-compliance] <-- Hook: commit-time gate
  Enforces: code-reviewer,        Outputs: block if agents missing
  security-auditor
```

### 6.2 The Enforcement Spectrum

| Level                             | Mechanism                       | Current Coverage                                 | Research Coverage                                                 |
| --------------------------------- | ------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| **BLOCK** (hard gate)             | Hook stdout "block:" or exit(2) | Firestore writes, test mocking, agent compliance | **NONE**                                                          |
| **DIRECTIVE** (strong suggestion) | Hook stdout, AI must act        | Security, bugs, database, UI                     | **NONE**                                                          |
| **HINT** (soft suggestion)        | Hook stderr, AI may act         | Planning, exploration, testing                   | **NONE**                                                          |
| **BEHAVIORAL** (AI follows rules) | CLAUDE.md Section 7             | Research, teams, multi-file, security            | **SOLE mechanism**                                                |
| **UNDETECTED** (gap)              | Nothing                         | N/A                                              | Unfamiliar code, conflicting info, new domains, stalled debugging |

### 6.3 Why Both Are Needed

**Hooks catch what the AI forgets.** The AI's context window is finite and
subject to compaction. After compaction, behavioral rules from CLAUDE.md are
preserved but the AI's "memory" of what it was doing is reduced. Hooks fire
every time regardless of context state.

**Behavioral rules cover nuance.** Hooks operate on keyword matching and file
patterns -- they can't understand context, intent, or the evolving state of a
conversation. The AI can detect when it's confused, uncertain, or entering
unfamiliar territory. Behavioral rules capture these judgment-based triggers.

**The gap:** Research is ENTIRELY in the behavioral-rule layer. This means:

- After compaction, research triggers may be forgotten
- The AI can rationalize skipping research ("I know enough to proceed")
- There is no external check that research was considered for appropriate
  situations
- No state tracking of what was researched vs. what was assumed

### 6.4 Recommended Layering for Research

| Tier                               | Hook Role                                                            | Behavioral Rule Role                                          |
| ---------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Tier 1** (Quick Lookup)          | Detect keywords, suggest Explore agent                               | AI recognizes knowledge gaps and acts                         |
| **Tier 2** (Focused Investigation) | Detect compound signals, suggest `/deep-research`                    | AI detects uncertainty, conflicting info, or new integrations |
| **Tier 3** (Full Campaign)         | Detect multi-phase + unfamiliar domain, suggest `research-plan-team` | AI identifies 3+ sub-questions, flags insufficient knowledge  |

The hook provides the safety net; the behavioral rule provides the judgment.
Neither alone is sufficient.

---

## 7. Summary: Current State vs. Desired State

### Current State

- **Hooks detect 0 research-worthy situations.** The word "research" appears
  nowhere in hook detection logic.
- **`/deep-research` is never suggested by any hook.** It only appears as a
  stderr message inside the `/deep-plan` banner ("Exhaustive discovery").
- **The Explore agent is suggested weakly** (stderr hint) for 6 specific
  phrases.
- **Behavioral rules are the SOLE mechanism** for triggering research, making
  research invocation fragile (depends on AI memory, not automated detection).
- **No research-related entries in `agent-triggers.json`.** The config only
  covers code-reviewer and security-auditor.
- **No research tracking in any state file.** No `.session-agents.json` entries
  for research activities, no escalation from exploration to research.

### Desired State

- **Hooks detect at least 3 tiers of research-worthy situations** (quick lookup,
  focused investigation, full campaign).
- **`/deep-research` is suggested when compound signals indicate domain
  uncertainty.**
- **Exploration escalates to research** when the AI is reading many files in
  unfamiliar areas.
- **Multi-phase projects automatically suggest research-before-plan.**
- **Research activities are tracked** for compliance checking (did we research
  before implementing in unfamiliar territory?).
- **Alert fatigue is controlled** through compound signals, cooldowns, and
  user-configurable sensitivity.
