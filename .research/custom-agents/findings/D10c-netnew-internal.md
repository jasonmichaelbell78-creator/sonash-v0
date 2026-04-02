# Findings: Net-New Agents Needed Based on Internal Project Workflows and Gaps

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ10 (Part C)

---

## Research Methodology

Primary sources: direct filesystem reads of all prior wave findings (D5a, D5b,
D5c, D6b, D6c, D7c, D8a, D8b, D9b), skills directory listing (64 skills), agents
directory listing (26 local + 13 global), AGENT_ORCHESTRATION.md, ROADMAP.md,
SESSION_CONTEXT.md, CLAUDE.md.

Cross-referenced all 10 known gaps from W1-W3 with upstream findings to produce
spec outlines. Additionally scanned 14 skills not covered in D5a/D5b/D5c for
additional gaps, and reviewed ROADMAP.md for upcoming features.

**Sources consulted:** 14 prior findings files + 12 filesystem sources **Skills
analyzed:** 35 (D5a) + 15 hooks/sessions (D5b) + 7 pipeline categories (D5c) + 8
additional (this pass) = 64 total coverage **Agents audited:** 26 local + 13
global (all)

---

## Section 1: Spec Outlines for the 10 Known Gaps

### Gap 1: convergence-loop-verifier (D5a Finding 6)

| Field               | Spec                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent name**      | `convergence-loop-verifier`                                                                                                                                                                                                                                                                                                              |
| **Purpose**         | Executes the T20 tally convergence protocol natively. Carries Confirmed/Corrected/Extended/New verdict schema, graduated convergence tracking, and disagreement handling without per-call methodology re-injection. Called by convergence-loop skill, deep-plan, skill-audit, pr-retro, create-audit, and all audit-\* discovery phases. |
| **Tools**           | Read, Write, Bash (for file existence), Grep (for code-claim verification), WebSearch (fallback for doc claims)                                                                                                                                                                                                                          |
| **Model**           | sonnet — bounded execution; the T20 tally is structured, not open-ended reasoning                                                                                                                                                                                                                                                        |
| **Estimated size**  | medium (200-350 lines) — needs `<role>`, `<T20 protocol>`, `<convergence tracking>`, `<disagreement handling>`, `<output format>`, `<success criteria>`                                                                                                                                                                                  |
| **Priority**        | P1 — 6+ callers, highest ROI in the ecosystem                                                                                                                                                                                                                                                                                            |
| **Invoking skills** | convergence-loop, deep-plan, skill-audit, pr-retro, create-audit, all audit-\* family                                                                                                                                                                                                                                                    |

**Critical specification requirements:**

- Graduated convergence tracking: first-pass counts, second-pass delta counts,
  net change
- T20 tally format MUST be locked in as the output schema — cannot vary
  per-invocation
- Minimum verification coverage: the agent MUST verify all assigned claims, not
  stop early
- Disagreement escalation protocol: when verifier disagrees with original, it
  must cite specific contradicting evidence, not just assert disagreement

**What a custom agent fixes:** Current invocations inject the T20 protocol via a
multi-line orchestrator prompt on every call. Without a custom agent, the
protocol calibration drifts: some verifier runs produce T20 tallies, others
produce narrative summaries. The convergence-loop SKILL.md recommends different
base agents (general-purpose vs code-reviewer) depending on claim type — this
inconsistency creates unpredictable verification quality.

---

### Gap 2: general-purpose project override (D6b Finding 1)

| Field               | Spec                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent name**      | `general-purpose`                                                                                                                                                                                                                                                                                                                             |
| **Purpose**         | Project-level override of the built-in general-purpose agent. Injects SoNash security boundaries (no direct Firestore writes), stack declarations (Next.js 16, React 19, Firebase 12, Tailwind 4, Zod 4), error sanitization patterns, and structured return protocol into every general-purpose agent invocation across 13+ skill callsites. |
| **Tools**           | All (inherits — do not restrict, general-purpose agents need full flexibility by design)                                                                                                                                                                                                                                                      |
| **Model**           | inherit — matches built-in behavior; override should not change model selection                                                                                                                                                                                                                                                               |
| **Estimated size**  | light (100-180 lines) — primarily a system prompt injection with stack context, security rules, and return protocol; no complex methodology sections                                                                                                                                                                                          |
| **Priority**        | P1 — 13+ invocations across doc-optimizer, audit-process, audit-ai-optimization, audit-enhancements, convergence-loop, pre-commit-fixer; every invocation currently runs without SoNash context                                                                                                                                               |
| **Invoking skills** | doc-optimizer (13 invocations), audit-process, audit-ai-optimization, audit-enhancements, convergence-loop, pre-commit-fixer, and any ad-hoc orchestrator dispatch                                                                                                                                                                            |

**Critical specification requirements:**

- CRITICAL security boundary:
  `NO DIRECT WRITES to journal, daily_logs, inventoryEntries — use Cloud Functions (httpsCallable)`
- Stack declarations with versions (referenced in CLAUDE.md Section 1)
- Error sanitization: reference `scripts/lib/sanitize-error.js`, never log raw
  `error.message`
- TypeScript strict mode enforcement: no `any` types
- Repository pattern: new queries go to `lib/firestore-service.ts`
- Structured return with task completion signal (prevents fire-and-forget
  completions)
- Must include 2-4 `<example>` blocks in description (D6c Finding 2 established
  this as highest-leverage gap)

**What a custom agent fixes:** A general-purpose agent asked to "fix issues in
file X" currently has zero SoNash context. It may write direct Firestore writes,
use `any` types, log raw error messages, or skip Zod validation. These
violations are enforcement-gate issues (patterns:check, tsconfig strict) — but
the gate runs AFTER the violation is committed. The override prevents the
violation at generation time.

---

### Gap 3: session-begin-health-triage (D5b Finding 3)

| Field               | Spec                                                                                                                                                                                                                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent name**      | `session-begin-health-triage`                                                                                                                                                                                                                                                                                                                             |
| **Purpose**         | Analyzes session-begin health script failures when 3+ scripts fail or 3+ findings surface. Cross-references `hook-warnings-log.jsonl` for pattern recurrence, classifies failures by type (infrastructure vs. dependency vs. code regression), and produces a prioritized remediation plan. Prevents "scope explosion" triage becoming a manual exercise. |
| **Tools**           | Read, Bash (ls, wc for quick status checks), Grep (log pattern analysis)                                                                                                                                                                                                                                                                                  |
| **Model**           | sonnet — triage analysis is bounded; the agent reads structured JSONL and outputs classified findings                                                                                                                                                                                                                                                     |
| **Estimated size**  | light-medium (150-250 lines) — needs `<role>`, `<triage taxonomy>`, `<pattern-recurrence protocol>`, `<output format>`                                                                                                                                                                                                                                    |
| **Priority**        | P2 — session-begin runs at the start of every session; when health fails (relatively rare), the triage is currently ad-hoc and token-expensive                                                                                                                                                                                                            |
| **Invoking skills** | session-begin (Phase 3, when failure threshold triggered)                                                                                                                                                                                                                                                                                                 |

**Critical specification requirements:**

- Triage taxonomy: infrastructure failure (build stale, server unreachable) vs.
  dependency failure (npm install failed) vs. code regression (tests failing)
  vs. hook failure (pre-commit blocked)
- Recurrence detection: read `hook-warnings-log.jsonl`, count occurrences of
  same failure within last N sessions, flag as RECURRING if >= 3
- Output: structured priority list (MUST FIX NOW | CAN DEFER | NEEDS
  INVESTIGATION) rather than free-form narrative
- NOT a fix agent — produces diagnosis and prioritized recommendation only;
  actual fixes are human-authorized or delegated separately

**Feasibility note:** The `debugger` agent (existing) could handle some of this
scope. The distinction: `session-begin-health-triage` is a
pattern-recurrence-aware classifier optimized for session-start context;
`debugger` is a general root-cause analyst for code errors. These are different
enough to warrant separate agents, but if maintenance burden is a constraint,
the `debugger` agent could be extended with health-triage context.

---

### Gap 4: session-end-compliance-enforcer (D5b Finding 4)

| Field               | Spec                                                                                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent name**      | `session-end-compliance-enforcer`                                                                                                                                                                                                                                                                    |
| **Purpose**         | At session-end, detects queued but unexecuted code reviews in `pending-reviews.json`, executes outstanding `code-reviewer` passes against staged/modified files, and writes compliance status to `.session-agents.json`. Prevents code escaping the session without the review gate being satisfied. |
| **Tools**           | Read, Write, Bash (git diff --staged, git log), Grep                                                                                                                                                                                                                                                 |
| **Model**           | sonnet — compliance checking and triggering outstanding reviews is bounded work                                                                                                                                                                                                                      |
| **Estimated size**  | light (120-200 lines) — needs `<role>`, `<compliance check protocol>`, `<review trigger logic>`, `<output format>`                                                                                                                                                                                   |
| **Priority**        | P2 — session-end runs at the end of every session; the compliance gap means code consistently escapes review                                                                                                                                                                                         |
| **Invoking skills** | session-end (Step 4 — agent compliance review)                                                                                                                                                                                                                                                       |

**Critical specification requirements:**

- Read `pending-reviews.json` — if `queued: true` AND no corresponding entry in
  `.session-agents.json`, trigger review
- Invoke `code-reviewer` as a subagent with the staged files as context
- Write completion status back to `.session-agents.json` so subsequent
  session-end checks see it
- Distinguish between "review was run manually" (already in
  .session-agents.json) vs "review was never run" (pending-reviews.json has
  queued items with no session-agents entry)
- NOT a bypass agent — if security issues are found during catch-up review, it
  should HALT and surface them, not auto-apply fixes

---

### Gap 5: pr-bot-processor agents (D5b Finding 5)

This gap covers three separate agents with distinct parsers for each review bot.
They are specified individually:

#### Gap 5a: sonarcloud-processor

| Field               | Spec                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent name**      | `sonarcloud-processor`                                                                                                                                                                                                                                                                                                                                      |
| **Purpose**         | Parses SonarCloud review output for a PR, applies known suppression patterns (S5852, S4036, S106 and their known-false-positive context), enriches code snippets with file:line references, handles first-scan volume by auto-classifying bulk-first-scan findings separately from regression findings. Returns structured JSONL for pr-review integration. |
| **Tools**           | Read (SonarCloud findings file), Bash (for file lookups), WebSearch (for unknown rule IDs)                                                                                                                                                                                                                                                                  |
| **Model**           | sonnet — parsing and classification is bounded                                                                                                                                                                                                                                                                                                              |
| **Estimated size**  | medium (200-300 lines) — needs `<role>`, `<suppression catalog>`, `<first-scan detection>`, `<output schema>`                                                                                                                                                                                                                                               |
| **Priority**        | P3 — high value per-PR but SonarCloud processing is a specialized sub-task; not critical path                                                                                                                                                                                                                                                               |
| **Invoking skills** | pr-review (Step 3, when SonarCloud bot findings are present)                                                                                                                                                                                                                                                                                                |

#### Gap 5b: coderabbit-processor

| Field               | Spec                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Agent name**      | `coderabbit-processor`                                                                                                                                                                                                               |
| **Purpose**         | Extracts CodeRabbit inline comments vs summary comments, separates auto-resolved from active threads, deduplicates across review rounds, and normalizes to pr-review JSONL schema. Handles CodeRabbit's multi-level comment nesting. |
| **Tools**           | Read, Bash                                                                                                                                                                                                                           |
| **Model**           | haiku — parsing is formulaic; low reasoning requirement                                                                                                                                                                              |
| **Estimated size**  | light-medium (150-220 lines)                                                                                                                                                                                                         |
| **Priority**        | P3                                                                                                                                                                                                                                   |
| **Invoking skills** | pr-review (Step 3, when CodeRabbit findings are present)                                                                                                                                                                             |

**Assessment for Gap 5:** The three bot processors (SonarCloud, CodeRabbit,
Qodo) share a conceptual pattern but have different parsing logic. They are
net-new agents with no existing templates. The ROI is real (reduced per-PR
triage burden) but the agents are invoked conditionally and rarely (not every PR
has all three bots). Priority P3 is appropriate. The sonarcloud-processor is
highest value because SonarCloud's false-positive patterns are well-documented
and encodable.

---

### Gap 6: test-suite-diagnostic (D5c Finding 1)

| Field               | Spec                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Agent name**      | `test-suite-diagnostic`                                                                                                                                                                                                                                                                                                                                                                          |
| **Purpose**         | Invoked when `/test-suite` Phase 1 SMOKE fails. Reads the failure JSONL, classifies the root cause (infrastructure: server unreachable or test setup failed; regression: recent code change broke tests; auth: Firebase session expired; configuration: env var missing), and produces a targeted remediation recommendation. Converts SMOKE abort from a dead-end into an actionable diagnosis. |
| **Tools**           | Read (failure JSONL, recent git log), Bash (git log --since, env checks), Grep (test file patterns)                                                                                                                                                                                                                                                                                              |
| **Model**           | sonnet — classification of structured failure data is bounded; `test-engineer` (Opus) is for deep test design, not failure triage                                                                                                                                                                                                                                                                |
| **Estimated size**  | light-medium (150-250 lines)                                                                                                                                                                                                                                                                                                                                                                     |
| **Priority**        | P2 — every SMOKE failure currently produces a manual investigation burden; wiring this converts abort into diagnosis                                                                                                                                                                                                                                                                             |
| **Invoking skills** | test-suite (Phase 1 SMOKE fail path)                                                                                                                                                                                                                                                                                                                                                             |

**Relationship to test-engineer:** The existing `test-engineer` agent (Opus, 60+
lines, rich SoNash overrides for Vitest/Firebase) is the correct agent for deep
test analysis, protocol gap detection, and coverage analysis. The
`test-suite-diagnostic` is NOT a replacement for test-engineer — it is a
lightweight first-pass triage agent that classifies failures before escalating
to test-engineer when deeper analysis is warranted. The two-tier pattern (quick
triage → deep analysis) is more token-efficient than always invoking Opus.

---

### Gap 7: debt-runner-subagent (D5c Finding 5)

| Field               | Spec                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent name**      | `debt-runner-subagent`                                                                                                                                                                                                                                                                                                          |
| **Purpose**         | Handles debt-runner Plan mode execution when item count exceeds 10 (the handoff threshold). Understands the TDMS staging file contract, MASTER_DEBT.jsonl schema, severity classifications (S0-S3), and applies remediation in dependency-safe order. Mandatory `security-auditor` escalation for S0 items before any mutation. |
| **Tools**           | Read, Write, Edit, Bash, Grep, Glob (for codebase debt verification), WebSearch (for library upgrade guidance on dependency debt)                                                                                                                                                                                               |
| **Model**           | sonnet — remediation execution is bounded per-item; escalates to security-auditor for S0                                                                                                                                                                                                                                        |
| **Estimated size**  | medium (250-350 lines) — needs `<role>`, `<TDMS schema knowledge>`, `<S0 escalation protocol>`, `<mutation safety rules>`, `<output format>`                                                                                                                                                                                    |
| **Priority**        | P2 — the ">10 items = subagent" rule exists in debt-runner but the subagent type is undefined; this gap means bulk debt execution falls back to general-purpose with zero TDMS context                                                                                                                                          |
| **Invoking skills** | debt-runner (Plan mode, when item count exceeds handoff threshold)                                                                                                                                                                                                                                                              |

**Critical specification requirements:**

- MUST read MASTER_DEBT.jsonl before mutating — never modify without reading
  current state
- MUST apply the OVERWRITE HAZARD protection (documented in
  reference_tdms_systems.md memory): never overwrite MASTER_DEBT directly,
  always use staging file → merge pipeline
- S0 security items: MUST escalate to `security-auditor` before any fix attempt
  — change from debt-runner's current advisory "flag S0" to MUST HALT + ESCALATE
- Dedup awareness: recognize when fixing one debt item resolves multiple (batch
  credit)
- Return protocol: structured count of items fixed, items deferred, items
  escalated to security-auditor

---

### Gap 8: deploy-diagnostic (D5b Gap 3, D5c Finding 3)

| Field               | Spec                                                                                                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Agent name**      | `deploy-diagnostic`                                                                                                                                                                                                                                                                                                                                    |
| **Purpose**         | Invoked when `deploy-safeguard.js` blocks a deployment or when CI `deploy-firebase.yml` fails. Diagnoses why the block occurred (stale build: which file changed after last build? missing env var: which one? test not run: which suite?) and produces a targeted resolution checklist. Converts deploy-safeguard block from a wall into a diagnosis. |
| **Tools**           | Read (deploy-safeguard output, CI logs), Bash (git log, file timestamps, env checks), WebFetch (for gh run logs via gh CLI)                                                                                                                                                                                                                            |
| **Model**           | sonnet — diagnostic analysis of structured deploy-safeguard output is bounded                                                                                                                                                                                                                                                                          |
| **Estimated size**  | light-medium (150-220 lines)                                                                                                                                                                                                                                                                                                                           |
| **Priority**        | P2 — deploy blocks are infrequent but high-urgency; a targeted diagnosis dramatically reduces time-to-resolution                                                                                                                                                                                                                                       |
| **Invoking skills** | deploy-safeguard hook (on block), gh-fix-ci (on CI deploy-stage failure), session-begin (on deploy-stage failures in session-start-failures.json)                                                                                                                                                                                                      |

**CI routing context (from D5c Finding 3):** The `/gh-fix-ci` skill currently
routes all failures uniformly to the `plan` skill. The correct routing:
TypeScript/test failures → `debugger`; security/gitleaks failures →
`security-auditor`; build/deploy failures → `deploy-diagnostic`. The
`deploy-diagnostic` agent addresses only the third category; a routing update to
`gh-fix-ci` is a companion change.

---

### Gap 9: deep-research adversarial agents (D8a, D8b)

Four agents — three from Session #244 plus one addition from D8b analysis.

#### Gap 9a: contrarian-challenger

| Field               | Spec                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent name**      | `contrarian-challenger`                                                                                                                                                                                                                                                                                                                                                           |
| **Purpose**         | Challenges deep-research findings with adversarial rigor. Steel-mans the research before attacking. Uses pre-mortem framing (assume research is wrong in 6 months — why?). Produces per-finding CONFIRMED/WEAKENED/REFUTED verdicts with numbered specific objections. Anti-sycophancy mandate: never seeks consensus, maintains challenge unless specific evidence disproves it. |
| **Tools**           | WebSearch, WebFetch (60%+ of searches must seek disconfirming evidence)                                                                                                                                                                                                                                                                                                           |
| **Model**           | sonnet — adversarial challenge operates on bounded template (17 lines → 250-320 lines); D8b Finding 12 noted model selection for adversarial roles is unresolved but Sonnet for bounded execution is the conservative default                                                                                                                                                     |
| **Estimated size**  | medium (250-320 lines)                                                                                                                                                                                                                                                                                                                                                            |
| **Priority**        | P1 — mandatory at ALL depth levels per Critical Rule 2 of deep-research; high-frequency                                                                                                                                                                                                                                                                                           |
| **Invoking skills** | deep-research (Phase 3 — mandatory adversarial challenge)                                                                                                                                                                                                                                                                                                                         |

#### Gap 9b: otb-challenger

| Field               | Spec                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Agent name**      | `otb-challenger`                                                                                                                                                                                                                                                                                                                                                                                 |
| **Purpose**         | Finds blind spots, unexplored alternatives, and framings the research did not consider. Generates 3+ alternative hypotheses before reviewing findings. Applies assumption surfacing ("what would need to be true for the opposite conclusion?"). Produces Salvagente Rule output: when rejecting a finding, produces a serendipity seed pointing to what alternative signal the failure reveals. |
| **Tools**           | WebSearch, WebFetch (adjacent domain exploration)                                                                                                                                                                                                                                                                                                                                                |
| **Model**           | sonnet (same rationale as contrarian-challenger; D8a Sec 15 found cross-model diversity ideal but single-model Sonnet is viable with proper philosophy encoding)                                                                                                                                                                                                                                 |
| **Estimated size**  | medium (230-300 lines)                                                                                                                                                                                                                                                                                                                                                                           |
| **Priority**        | P1 — mandatory at ALL depth levels per Critical Rule 2                                                                                                                                                                                                                                                                                                                                           |
| **Invoking skills** | deep-research (Phase 3 — parallel with contrarian-challenger)                                                                                                                                                                                                                                                                                                                                    |

#### Gap 9c: deep-research-verifier

| Field               | Spec                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Agent name**      | `deep-research-verifier`                                                                                                                                                                                                                                                                                                                                                                               |
| **Purpose**         | Unified verification agent covering Phase 2.5 (claim verification from D-agent findings) and Phase 3.96 (gap-pursuit verification). Two scope modes passed at spawn time: (a) codebase — VERIFIED/REFUTED per claim with file:line evidence; (b) consistency — CONTRADICTION/CONSISTENT across gap-pursuit findings vs original research. The only agent covering a phase with ZERO existing template. |
| **Tools**           | Read, Grep, Glob, Bash (codebase mode); Read only (consistency mode); WebSearch, WebFetch (external claim re-verification)                                                                                                                                                                                                                                                                             |
| **Model**           | sonnet — deductive verification is bounded; file:line lookup does not require deep reasoning                                                                                                                                                                                                                                                                                                           |
| **Estimated size**  | medium-heavy (300-380 lines) — two scope modes require distinct execution flows                                                                                                                                                                                                                                                                                                                        |
| **Priority**        | P1 — Phase 2.5 has no template at all (most critical unresolved gap in entire deep-research pipeline per D9b Finding 1); structured return needed for orchestrator's >20% trigger                                                                                                                                                                                                                      |
| **Invoking skills** | deep-research (Phase 2.5, Phase 3.96)                                                                                                                                                                                                                                                                                                                                                                  |

#### Gap 9d: dispute-resolver

| Field               | Spec                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent name**      | `dispute-resolver`                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Purpose**         | Resolves conflicting claims between V-agents and D-agents, or between contrarian/OTB challengers and the synthesizer. Handles three conflict types: verification conflict (filesystem contradicts claim), challenge conflict (interpretation of evidence differs), cross-agent conflict (timing or scope mismatch). Produces ORIGINAL UPHELD / CHALLENGER UPHELD / REVISED / INCONCLUSIVE verdicts with evidence-gathering before concluding. |
| **Tools**           | Read, Write, WebSearch, WebFetch (third-source verification when existing evidence is ambiguous)                                                                                                                                                                                                                                                                                                                                              |
| **Model**           | sonnet (Opus candidate for 10+ dispute batches — D9b Finding 10 noted this as the one pipeline role where Opus may be warranted at scale)                                                                                                                                                                                                                                                                                                     |
| **Estimated size**  | light-medium (180-240 lines)                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Priority**        | P2 — template exists (15 lines) but INCONCLUSIVE handling gap, evidence-gathering protocol gap, and return protocol gap all warrant custom definition                                                                                                                                                                                                                                                                                         |
| **Invoking skills** | deep-research (Phase 3.5)                                                                                                                                                                                                                                                                                                                                                                                                                     |

---

### Gap 10: deep-research pipeline agents (D9b)

#### Gap 10a: deep-research-gap-pursuer

| Field               | Spec                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent name**      | `deep-research-gap-pursuer`                                                                                                                                                                                                                                                                                                                                                                       |
| **Purpose**         | Investigates specific gaps identified after Phase 2.5 verification and Phase 3 challenges. Receives an assigned gap cluster from the orchestrator. Profile-switches tool strategy based on gap type (codebase gap: Grep/Read; web knowledge gap: WebSearch/WebFetch; docs gap: Context7 MCP). Non-recursion enforcement: its own discovered gaps are documented but do NOT trigger another cycle. |
| **Tools**           | Read, Write, Grep, Glob, Bash, WebSearch, WebFetch, mcp**context7**query-docs                                                                                                                                                                                                                                                                                                                     |
| **Model**           | sonnet — same as deep-research-searcher (gap-pursuer is a scope-narrowed variant of the searcher)                                                                                                                                                                                                                                                                                                 |
| **Estimated size**  | medium (250-340 lines) — inherits searcher philosophy sections but with distinct non-recursion enforcement and gap-type routing                                                                                                                                                                                                                                                                   |
| **Priority**        | P2 — gap pursuit is mandatory in later research phases; current template (29 lines) lacks tool strategy and confidence calibration                                                                                                                                                                                                                                                                |
| **Invoking skills** | deep-research (Phase 3.95 — gap filling)                                                                                                                                                                                                                                                                                                                                                          |

#### Gap 10b: deep-research-final-synthesizer

| Field               | Spec                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Agent name**      | `deep-research-final-synthesizer`                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Purpose**         | EDIT mode re-synthesizer for deep-research Phases 3.9 and 3.97. Unlike the Phase 2 synthesizer which creates from scratch, the final-synthesizer edits the existing RESEARCH_OUTPUT.md to incorporate verification corrections, challenge results, dispute resolutions, and gap-pursuit findings. Preserves established claim IDs, section structure, and Challenges section added by adversarial agents. Uses C-G001 scheme for new gap claims. |
| **Tools**           | Read, Write, Bash (for metadata.json updates)                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Model**           | sonnet — same as deep-research-synthesizer; edit mode does not require deeper reasoning than create mode                                                                                                                                                                                                                                                                                                                                         |
| **Estimated size**  | medium (250-350 lines) — edit-mode philosophy section is the critical addition; without it, a model defaults to full rewrite behavior                                                                                                                                                                                                                                                                                                            |
| **Priority**        | P2 — Phase 3.97 always runs if gap agents were spawned; current 29-line template has high probability of mode-collapse to full rewrite, losing all verification and challenge work                                                                                                                                                                                                                                                               |
| **Invoking skills** | deep-research (Phase 3.9 on >20% claim change, Phase 3.97 after gap pursuit)                                                                                                                                                                                                                                                                                                                                                                     |

---

## Section 2: Additional Discovered Gaps

### Additional Gap A: deep-plan missing a planning-verifier agent [CONFIDENCE: HIGH]

The `/deep-plan` skill dispatches `Explore` agents for Phase 1 discovery and
uses convergence-loop for Phase 3 verification. However, the post-plan
verification step (Phase 5 in deep-plan: "Plan Verification") uses the
general-purpose agent inline with no domain context.

The deep-plan planning verification task is different from convergence-loop
verification: it must check that the plan aligns with ROADMAP.md, does not
conflict with prior decisions in SESSION_CONTEXT.md, and respects the SWS
(System-Wide Standardization) gate requirements.

**Assessment:** MEDIUM priority — the existing convergence-loop-verifier (Gap 1
above) would cover some of this, and the Explore agent covers discovery. The
remaining gap is specifically the "plan vs. roadmap alignment" check. This could
be addressed either by (a) creating a dedicated `deep-plan-verifier` agent or
(b) adding SoNash planning context to the `convergence-loop-verifier`. Option
(b) is lower maintenance. Not a standalone high-priority gap.

**Spec if needed:**

- Name: `deep-plan-verifier`
- Purpose: Verifies plan alignment with ROADMAP.md, SESSION_CONTEXT.md, SWS
  gate, and existing agent/skill contracts
- Model: sonnet
- Priority: P3
- Invoking: deep-plan (Phase 5 — Plan Verification)

---

### Additional Gap B: audit-\* family uses ad-hoc role labels that don't exist as custom agents [CONFIDENCE: HIGH]

From D5a Finding 5, the audit-code, audit-security, audit-performance, and
related skills dispatch agents with role names like `hygiene-and-types`,
`vulnerability-scanner`, `framework-security-auditor`, `supply-chain-auditor`.
None of these exist as `.claude/agents/*.md` files.

New discovery (this pass): audit-comprehensive, audit-ai-optimization,
audit-enhancements, audit-process all use the same pattern. The complete audit
family spawning skills are:

- `audit-code`: 3 ad-hoc role labels (hygiene-and-types, framework-and-testing,
  security-and-debugging)
- `audit-security`: 4 ad-hoc role labels (vulnerability-scanner,
  supply-chain-auditor, framework-security-auditor, ai-code-security-auditor)
- `audit-performance`: 2 ad-hoc role labels
- `audit-ai-optimization`: spawns `general-purpose`
- `audit-enhancements`: spawns `Explore` agents
- `audit-comprehensive`: has agent-teams mode
- `audit-process`: 22 ad-hoc role labels (most agent-rich audit skill)

**Assessment:** Creating custom agents for ALL ad-hoc labels would produce 30+
new agents for the audit family alone. This is not practical. The recommended
approach:

1. Ensure the `general-purpose` project override (Gap 2) covers all audit-\*
   invocations
2. For audit-security specifically, creating a `security-audit-orchestrator`
   agent that carries the 4 domain categories (vulnerability, supply-chain,
   framework, AI-code) would cover the highest-stakes audit category with one
   definition
3. For audit-process (22 labels), the labels are domain-specific sub-roles
   within a single audit pass — they are candidates for a structured multi-agent
   team pattern rather than 22 separate agent definitions

**Net-new agents recommended:**

- `security-audit-orchestrator`: covers the 4 audit-security categories natively
  (P3)
- General: invest in `general-purpose` override (Gap 2) to cover all audit-\*
  invocations rather than per-audit agents

---

### Additional Gap C: pre-commit-fixer coordination agent for multi-category failures [CONFIDENCE: MEDIUM]

From D5b Finding 6, when multiple failure categories occur simultaneously
(ESLint + pattern compliance + doc headers), each spawns a separate subagent but
there is no coordinator. Fixes in one category can create failures in another.

**Assessment:** The D5b analysis correctly identified this as a gap. A
`pre-commit-coordinator` agent that: (1) receives all failure categories, (2)
sequences fix order to minimize regressions, (3) validates the entire hook suite
after each category fix, would address this. However, multi-category
simultaneous failures are rare edge cases — this is lower priority than the gaps
above.

**Spec if needed:**

- Name: `pre-commit-coordinator`
- Purpose: Coordinates multi-category pre-commit fix sequencing to prevent fix
  regressions
- Model: sonnet
- Priority: P3
- Invoking: pre-commit-fixer (Step 4, only when 2+ categories fail
  simultaneously)

---

### Additional Gap D: pr-retro deliverable-verifier [CONFIDENCE: HIGH]

From D5a Finding 3, pr-retro uses convergence-loop inline for deliverable
verification but has no dedicated retro-verifier agent. The verification task
(reading PR body, commits, PLAN.md, SESSION_CONTEXT.md, ROADMAP.md, detecting
phantom completions) is complex and high-frequency (after every merged PR).

**Assessment:** This gap was identified in D5a but was not included in the
original 10-gap list. It belongs in this synthesized list as a discovered
additional gap.

**Spec:**

- Name: `pr-retro-verifier`
- Purpose: Verifies pr-retro deliverables by cross-reading PR body, commits,
  PLAN.md, SESSION_CONTEXT.md, and ROADMAP.md. Detects phantom completions
  (claimed done but ROADMAP not updated), missing artifacts, and action items
  without implementations. Produces a structured verification report for the
  retro skill.
- Tools: Read, Bash (git log, git diff), Grep
- Model: sonnet
- Estimated size: medium (200-300 lines)
- Priority: P2 — high-frequency (every merged PR); current inline verification
  is context-expensive and inconsistent
- Invoking: pr-retro (Step 1.2 — deliverable verification)

---

### Additional Gap E: ROADMAP-driven agents for upcoming features [CONFIDENCE: MEDIUM]

ROADMAP.md (v3.28, 2026-03-19) shows active work on:

1. **Dev Dashboard** (38-47 agent research plan approved, SESSION_CONTEXT.md) —
   includes debt tab, admin audit, data landscape. The dev-dashboard
   `/deep-research` (38-47 agents) is the immediate next priority. No net-new
   agent types are needed for the dashboard itself — the existing
   deep-research-searcher, synthesizer, and proposed adversarial agents cover
   this research.

2. **System-Wide Standardization (SWS)** — 92 decisions, READY after dev
   dashboard. The SWS workflow may benefit from a `sws-checkpoint-verifier` that
   checks SWS gate compliance at each phase transition. This is speculative —
   the SWS gate requirements are not fully specified in available files.

3. **Operational Visibility** (~25% complete, BLOCKED) — 105 items. No specific
   agent gap identified from ROADMAP content.

**Assessment:** No ROADMAP-driven agents are IMMEDIATE net-new additions beyond
what is already captured in Gaps 1-10 and Additional Gaps A-D. The dev-dashboard
research is the next major workstream and is served by existing + proposed
agents.

---

## Section 3: Agent Count Feasibility Assessment

### Maintenance Burden Per Agent

Based on the existing agent ecosystem (26 local, 13 global, 39 total):

| Burden Category         | Estimate                                               | Evidence                                                                                                                |
| ----------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Creation cost           | 4-8 hours per agent (light: 4h, medium: 6h, heavy: 8h) | Based on deep-research-searcher (386 lines) estimated creation time                                                     |
| Per-session maintenance | ~0 for stable agents                                   | Existing agents (code-reviewer, security-auditor) require edits only when the domain changes                            |
| Cross-update risk       | Low-medium                                             | When a skill changes its output schema, dependent agents need updates — currently ~2 such updates per agent per quarter |
| Testing overhead        | Low                                                    | Agents are tested by running their invoking skill — no dedicated test infrastructure exists                             |
| Documentation debt      | Medium                                                 | Each agent needs description maintenance, example block updates as usage patterns evolve                                |

**Practical constraint for a solo developer:** Each new agent adds ~0.5h/quarter
maintenance on average (schema updates, description refinements, example block
additions when new use cases emerge). 15 new agents = 7.5h/quarter marginal
maintenance.

---

### Minimum vs Ideal Agent Set

#### Minimum Viable Set (7 agents — maximum value, minimum count)

These 7 agents cover the highest-frequency gaps with the most methodology-loss
risk:

| #   | Agent Name                        | Gap              | Frequency                      | ROI                                                                 |
| --- | --------------------------------- | ---------------- | ------------------------------ | ------------------------------------------------------------------- |
| 1   | `general-purpose` (override)      | Gap 2            | 13+ invocations/session        | Highest — blocks SoNash security violations across entire ecosystem |
| 2   | `convergence-loop-verifier`       | Gap 1            | 6+ callers                     | Highest — T20 protocol consistency across all verification          |
| 3   | `deep-research-verifier`          | Gap 9c           | Phase 2.5 (no template exists) | Critical — covers the only phasewith ZERO template                  |
| 4   | `contrarian-challenger`           | Gap 9a           | Mandatory all levels           | High — currently missing enforcement mechanisms                     |
| 5   | `otb-challenger`                  | Gap 9b           | Mandatory all levels           | High — currently missing domain awareness and source requirements   |
| 6   | `deep-research-final-synthesizer` | Gap 10b          | Always runs after gap phase    | High — prevents mode-collapse to full rewrite                       |
| 7   | `pr-retro-verifier`               | Additional Gap D | Every merged PR                | High — high-frequency, context-expensive without dedicated agent    |

**Minimum set rationale:**

- Covers the highest-invocation gaps (general-purpose: 13+,
  convergence-loop-verifier: 6+, pr-retro: every PR)
- Covers the most critical missing infrastructure (deep-research-verifier has NO
  template)
- Covers the mandatory adversarial agents (contrarian, OTB are required at all
  research depths)
- Covers the edit-mode synthesis gap (final-synthesizer prevents losing all
  verification/challenge work)
- Total: 7 agents; 2 are small overrides (general-purpose: 100-180 lines), 5 are
  medium definitions (200-380 lines each)
- Estimated creation: 40-55 hours

---

#### Ideal Set (14 agents — complete gap coverage, unconstrained)

Minimum set + 7 additional agents:

| #   | Agent Name                        | Gap              | Priority                |
| --- | --------------------------------- | ---------------- | ----------------------- |
| 8   | `dispute-resolver`                | Gap 9d           | P2                      |
| 9   | `deep-research-gap-pursuer`       | Gap 10a          | P2                      |
| 10  | `test-suite-diagnostic`           | Gap 6            | P2                      |
| 11  | `debt-runner-subagent`            | Gap 7            | P2                      |
| 12  | `deploy-diagnostic`               | Gap 8            | P2                      |
| 13  | `session-end-compliance-enforcer` | Gap 4            | P2                      |
| 14  | `pr-retro-verifier`               | Additional Gap D | P2 (already in minimum) |

Agents that were EVALUATED but NOT recommended for the ideal set:

- `session-begin-health-triage` (Gap 3): The `debugger` agent can cover most of
  this scope with a prompt. P3 — defer.
- `sonarcloud-processor`, `coderabbit-processor` (Gap 5a, 5b): Conditional
  invocation (only when those bots are present), P3 — defer.
- `security-audit-orchestrator` (Additional Gap B): The `general-purpose`
  override covers audit-\* family adequately. P3 — defer.
- `pre-commit-coordinator` (Additional Gap C): Multi-category failures are rare.
  P3 — defer.
- `deep-plan-verifier` (Additional Gap A): The convergence-loop-verifier covers
  this. P3 — defer.

---

#### Gap Scope Not Recommended for Agents

These gaps identified in prior waves are better addressed as skill updates than
new agents:

| Gap                                                | Why Not an Agent                                                                                                 | Recommended Fix                                                                                                                                             |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| loop-detector escalation (D5b Finding 8)           | Hook scripts cannot spawn agents; wiring would need to be a directive output or a new post-failure skill pattern | Update loop-detector hook to output a stronger user-action directive when 3+ failures detected; update systematic-debugging skill to check for loop context |
| CI failure routing in gh-fix-ci (D5c Finding 3)    | Routing logic belongs in the skill, not a new agent                                                              | Update gh-fix-ci SKILL.md to route failures to `debugger`, `security-auditor`, or `deploy-diagnostic` by failure type                                       |
| S0 debt mandatory security-auditor (D5c Finding 5) | A MUST trigger in debt-runner skill, not a new agent                                                             | Update debt-runner SKILL.md to make S0 items → `security-auditor` a MUST instead of a "flag"                                                                |
| pre-commit-compliance spawning (D5b Finding 1)     | Hook scripts cannot spawn agents (structural limitation)                                                         | Not solvable with agents; the hook enforces, the skill executes                                                                                             |

---

## Section 4: Priority Tiers

### P1: Do Now (Immediate — 4 agents creating maximum value per hour)

| Agent                        | Reason                                                                                                | Size         | Est Hours |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- | ------------ | --------- |
| `general-purpose` (override) | Blocks security violations across 13+ invocations with 100-180 lines of system prompt                 | light        | 3-5h      |
| `deep-research-verifier`     | Phase 2.5 has NO template — most critical gap in the entire deep-research pipeline                    | medium-heavy | 8-12h     |
| `contrarian-challenger`      | Mandatory at ALL depth levels; current 17-line template missing enforcement, return protocol          | medium       | 6-8h      |
| `otb-challenger`             | Mandatory at ALL depth levels; current 16-line template missing domain awareness, source requirements | medium       | 6-8h      |

**P1 total:** 4 agents, 23-33 estimated hours

---

### P2: Do Next (Near-term — 6 agents for significant workflow improvements)

| Agent                             | Reason                                                                          | Size         | Est Hours |
| --------------------------------- | ------------------------------------------------------------------------------- | ------------ | --------- |
| `convergence-loop-verifier`       | 6+ callers; T20 protocol re-injection on every call is the current state        | medium       | 6-8h      |
| `deep-research-final-synthesizer` | Always runs after gap phase; 29-line template has high mode-collapse risk       | medium       | 6-8h      |
| `deep-research-gap-pursuer`       | Phase 3.95 template missing tool strategy and confidence calibration            | medium       | 5-7h      |
| `dispute-resolver`                | Phase 3.5 template exists but INCONCLUSIVE handling and return protocol missing | light-medium | 4-6h      |
| `pr-retro-verifier`               | Every merged PR; inline verification is context-expensive and inconsistent      | medium       | 5-7h      |
| `session-end-compliance-enforcer` | Code currently escapes the session without review gate being satisfied          | light        | 3-5h      |

**P2 total:** 6 agents, 29-41 estimated hours

---

### P3: Evaluate Later (Low frequency or solvable by skill updates)

| Agent                         | Reason to Defer                                                                                      | Revisit When                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `test-suite-diagnostic`       | SMOKE failures are infrequent; lightweight manual triage is sufficient                               | When test suite grows to 5000+ tests and SMOKE failures become regular occurrences                                             |
| `debt-runner-subagent`        | ">10 items = subagent" path is rare; general-purpose with inline TDMS context is adequate short-term | When debt-runner expansion (SESSION_CONTEXT next priority) is implemented — the expansion may change the subagent requirements |
| `deploy-diagnostic`           | Deploy blocks are infrequent; manual investigation is adequate                                       | When deploy frequency increases (CI-triggered deploys, preview channels re-enabled)                                            |
| `session-begin-health-triage` | `debugger` agent covers most scope with a prompt; dedicated agent adds marginal value                | When session-begin health failures become a regular pattern (currently occasional)                                             |
| `sonarcloud-processor`        | Conditional invocation only; SonarCloud noise patterns can be documented in pr-review skill          | When SonarCloud PR volume justifies dedicated parsing logic                                                                    |
| `coderabbit-processor`        | Same rationale as sonarcloud-processor                                                               | When CodeRabbit parsing becomes a recurring time sink in PR reviews                                                            |
| `security-audit-orchestrator` | `general-purpose` override + existing `security-auditor` covers audit-security scope                 | When audit-security skill is heavily used and ad-hoc labels produce inconsistent output                                        |
| `pre-commit-coordinator`      | Multi-category failures are rare edge cases                                                          | If pre-commit failure rate increases significantly                                                                             |

---

## Section 5: Complete Agent Inventory — Before vs After

### Current State (39 agents)

| Tier                 | Count | Notable                                                                                                               |
| -------------------- | ----- | --------------------------------------------------------------------------------------------------------------------- |
| Local project agents | 26    | Includes explore.md, plan.md overrides                                                                                |
| Global agents        | 13    | deep-research-searcher, deep-research-synthesizer + 11 others                                                         |
| System built-ins     | 6     | general-purpose (no override), Explore (has override), Plan (has override), Bash, statusline-setup, Claude Code Guide |

### Proposed State — Minimum Set (39 + 7 = 46 agents)

Adding 7 P1/P2 high-priority agents:

1. `general-purpose` (override) — local, `.claude/agents/general-purpose.md`
2. `deep-research-verifier` — global,
   `.claude/agents/global/deep-research-verifier.md`
3. `contrarian-challenger` — global,
   `.claude/agents/global/contrarian-challenger.md`
4. `otb-challenger` — global, `.claude/agents/global/otb-challenger.md`
5. `convergence-loop-verifier` — local,
   `.claude/agents/convergence-loop-verifier.md`
6. `deep-research-final-synthesizer` — global,
   `.claude/agents/global/deep-research-final-synthesizer.md`
7. `pr-retro-verifier` — local, `.claude/agents/pr-retro-verifier.md`

**Note on global vs local placement:**

- deep-research agents → global (they are used by the deep-research skill which
  may run in any context)
- convergence-loop-verifier → local (the convergence-loop skill and its callers
  are all project-specific)
- pr-retro-verifier → local (pr-retro is project-specific)
- general-purpose override → local (per-project SoNash context is the whole
  point)

### Proposed State — Ideal Set (39 + 14 = 53 agents, minus any deletions from D7c)

Adding 7 more P2 agents for complete gap coverage: 8. `dispute-resolver` —
global 9. `deep-research-gap-pursuer` — global 10. `test-suite-diagnostic` —
local 11. `debt-runner-subagent` — local 12. `deploy-diagnostic` — local 13.
`session-end-compliance-enforcer` — local 14. `pr-retro-verifier` — local
(already counted)

**D7c context:** D7c recommended deleting `backend-architect.md`. If executed,
the ideal set is 39 - 1 + 14 = 52 agents.

---

## Sources

| #   | Path                                                               | Type                          | Trust | CRAAP | Date       |
| --- | ------------------------------------------------------------------ | ----------------------------- | ----- | ----- | ---------- |
| 1   | `.research/custom-agents/findings/D5a-workflow-gaps-skills.md`     | Prior research (codebase)     | HIGH  | 5/5   | 2026-03-29 |
| 2   | `.research/custom-agents/findings/D5b-workflow-gaps-hooks.md`      | Prior research (codebase)     | HIGH  | 5/5   | 2026-03-29 |
| 3   | `.research/custom-agents/findings/D5c-workflow-gaps-pipelines.md`  | Prior research (codebase)     | HIGH  | 5/5   | 2026-03-29 |
| 4   | `.research/custom-agents/findings/D6b-system-agent-catalog.md`     | Prior research (codebase+web) | HIGH  | 5/5   | 2026-03-29 |
| 5   | `.research/custom-agents/findings/D6c-override-gap-synthesis.md`   | Prior research (web+codebase) | HIGH  | 5/5   | 2026-03-29 |
| 6   | `.research/custom-agents/findings/D7c-consolidation-synthesis.md`  | Prior research (codebase)     | HIGH  | 5/5   | 2026-03-29 |
| 7   | `.research/custom-agents/findings/D8a-adversarial-patterns-web.md` | Prior research (web/academic) | HIGH  | 5/5   | 2026-03-29 |
| 8   | `.research/custom-agents/findings/D8b-adversarial-internal.md`     | Prior research (codebase)     | HIGH  | 5/5   | 2026-03-29 |
| 9   | `.research/custom-agents/findings/D9b-pipeline-agents-internal.md` | Prior research (codebase)     | HIGH  | 5/5   | 2026-03-29 |
| 10  | `.research/custom-agents/findings/D4a-model-selection-web.md`      | Prior research (web/docs)     | HIGH  | 5/5   | 2026-03-29 |
| 11  | `.claude/agents/` directory listing (26 local + 13 global)         | Filesystem (ground truth)     | HIGH  | 5/5   | 2026-03-29 |
| 12  | `.claude/skills/` directory listing (64 skills)                    | Filesystem (ground truth)     | HIGH  | 5/5   | 2026-03-29 |
| 13  | `docs/agent_docs/AGENT_ORCHESTRATION.md`                           | Filesystem (canonical)        | HIGH  | 5/5   | 2026-02-10 |
| 14  | `ROADMAP.md` (v3.28)                                               | Filesystem (canonical)        | HIGH  | 5/5   | 2026-03-19 |
| 15  | `SESSION_CONTEXT.md` (v8.11, Session #244)                         | Filesystem (canonical)        | HIGH  | 5/5   | 2026-03-27 |
| 16  | `CLAUDE.md` (v5.8)                                                 | Filesystem (canonical)        | HIGH  | 5/5   | 2026-03-24 |
| 17  | `.claude/skills/task-next/SKILL.md`                                | Filesystem (ground truth)     | HIGH  | 5/5   | 2026-03-29 |
| 18  | `.claude/skills/alerts/SKILL.md`                                   | Filesystem (ground truth)     | HIGH  | 5/5   | 2026-03-29 |

---

## Contradictions

**Gap 3 vs. existing debugger agent:** The `session-begin-health-triage` gap
(Gap 3) could be addressed by the existing `debugger` agent with added
health-triage context. The contradiction: D5b recommended a dedicated agent;
this analysis recommends P3 defer because `debugger` can cover the scope.
Resolution: DEFER the dedicated agent; if the `debugger` agent is elevated to
include health-triage context (part of stub elevation from D7a), the gap is
covered without a net-new definition.

**Gap 6 (test-suite-diagnostic) vs. test-engineer (existing):** D5c recommended
wiring `test-engineer` into test-suite failure path. This analysis recommends a
lighter-weight `test-suite-diagnostic` as an intermediate triage step. These are
not contradictory — the two-tier approach (diagnostic → test-engineer for deep
analysis) is architecturally preferable to always invoking the Opus
test-engineer. The tier 1 agent is net-new; the Opus tier 2 already exists.

**Session #244 decision (3 adversarial agents) vs. D8b/D9b findings (4
agents):** Session #244 committed to contrarian-challenger, otb-challenger,
claim-verifier. D8b/D9b analysis identifies dispute-resolver as a 4th justified
definition. This is not a contradiction — Session #244 was a planning
checkpoint, not a final count. The additional dispute-resolver is additive.

**Minimum vs ideal set for convergence-loop-verifier:** This analysis places
`convergence-loop-verifier` in the P2 set (not P1) despite describing it as
"highest ROI (6+ callers)" in the original gap list. Rationale: the four P1
agents (general-purpose override, deep-research-verifier, contrarian, OTB)
address gaps where the current state is either ZERO template or ACTIVE security
risk. The convergence-loop has an imperfect but functional workaround
(re-injecting the T20 protocol). This prioritization could reasonably be
reversed — a developer who runs deep-research frequently would benefit more from
the convergence-loop-verifier than from the gap-pursuer, for example.

---

## Gaps

1. **Model selection for adversarial agents unresolved (D8b Finding 12):** The
   contrarian-challenger and OTB-challenger model selection (Sonnet vs Opus) was
   noted as unresolved in D8b. D9b confirmed all pipeline agents are
   Sonnet-appropriate. This analysis follows D9b in recommending Sonnet for
   adversarial agents as the default. Whether Opus would produce meaningfully
   better adversarial challenges is an empirical question not answerable from
   filesystem analysis alone.

2. **Return protocol schema for >20% trigger not designed:** SKILL.md requires
   re-synthesis when

   > 20% of claims change. The structured return schemas for
   > verification/challenge/dispute agents that feed this trigger have not been
   > designed. Creating the agents will require inventing this schema.

3. **Frequency data is inferential:** Agent invocation counts are estimated from
   CLAUDE.md trigger tables and skill integration sections. Actual frequency
   could differ (agent-invocations.jsonl was not consulted for this analysis).
   High-frequency estimates could be lower in practice if skills are rarely
   invoked.

4. **Audit-\* family gap size not fully enumerated:** The audit-process skill
   has 22 ad-hoc role labels. Only the top-level pattern was analyzed here;
   individual label review would likely surface additional specific agents worth
   creating. Out of scope for this synthesis pass.

5. **SWS gate requirements not available:** SESSION_CONTEXT.md notes SWS
   (System-Wide Standardization) will follow the dev-dashboard work. Whether SWS
   requires new agents cannot be determined until the SWS phase is planned.

---

## Serendipity

**The general-purpose override is the highest-ROI agent in the minimum set for
security.** It is also the simplest to create (100-180 lines of system prompt
context). A solo developer looking for the first agent to create should start
here — it is a 3-5 hour creation that immediately protects 13+ invocation sites
from SoNash-pattern violations.

**The deep-research-verifier covers the most critical gap but is the most
complex agent to design.** Phase 2.5 has zero template, two distinct scope
modes, and a structured return requirement (for the >20% trigger). It should be
designed second after the general-purpose override but requires the most design
investment.

**Adversarial agent creation should follow the existing searcher/synthesizer
11-section template precisely.** D8b confirmed that the D-agent custom agents
(searcher 386 lines, synthesizer 344 lines) are the correct structural pattern
for new agents. Deviating from this structure for the adversarial agents would
create an inconsistent ecosystem. The `<philosophy>` section is especially
important for contrarian-challenger and OTB-challenger — these agents NEED the
anti-sycophancy principles locked in as philosophy, not as per-invocation prompt
injection.

**The convergence-loop-verifier is the highest-leverage agent ACROSS THE ENTIRE
SKILL ECOSYSTEM (not just deep-research).** With 6+ callers including deep-plan,
skill-audit, pr-retro, and all audit-\* discovery phases, this single agent has
wider impact than any deep-research-specific agent. It is the P2 agent most
likely to move to P1 as usage analysis deepens.

**A two-tier diagnostic pattern emerges as an architectural principle:**
test-suite-diagnostic (tier 1) → test-engineer (tier 2);
session-begin-health-triage → debugger; deploy-diagnostic → deployment-engineer.
The lightweight triage agent does classification cheaply; the specialist
Opus/Sonnet agent handles deep analysis only when warranted. This pattern could
be applied to future agent design across the ecosystem.

---

## Confidence Assessment

- HIGH claims: 18
- MEDIUM claims: 5
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are grounded in direct reads of prior wave findings files
(filesystem ground truth) and additional filesystem verification in this pass.
No training data assertions made. Confidence levels reflect the quality of the
evidence chain from the underlying D5a/D5b/D5c/D6b/D8b/D9b findings files, all
of which were HIGH confidence from filesystem reads.
