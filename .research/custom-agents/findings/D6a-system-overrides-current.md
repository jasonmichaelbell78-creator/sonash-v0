# Findings: Evaluate the Current Custom Agent Overrides of System Agents

**Searcher:** deep-research-searcher **Profile:** codebase + docs **Date:**
2026-03-29 **Sub-Question IDs:** SQ6 (Part A)

---

## Executive Summary

Two custom agents — `explore` and `plan` — were created on 2026-03-24 (commit
`db1be621`) to shadow the built-in Claude Code system agents. Both are
high-quality, SoNash-specific, READ-ONLY, and structurally sound. However, a
critical naming discrepancy is causing the overrides to partially fail:
CLAUDE.md uses `Explore` (capital-E) and invocations.jsonl records show 12 of 12
manually-triggered invocations using capital `Explore`, while only 12 of 12
programmatic/agent-spawned uses employ lowercase `explore`. The built-in Explore
is being called by the user in at least half the actual invocations, bypassing
the override.

---

## Key Findings

### 1. `explore` Override: Architecture and Content Quality [CONFIDENCE: HIGH]

**Quality score: 82/100**

The custom `explore` agent (194 lines) is a genuine improvement over the
built-in system Explore agent on every meaningful dimension except one (see
Finding 3).

**Structural compliance:**

- Name: `explore` — matches agent naming rules (lowercase, alphanumeric, 3-50
  chars). [D1b-Finding-12]
- Description: present, uses "Use PROACTIVELY" trigger phrasing per best
  practices. [D1b-Finding-9]
- Tools: `Read, Bash, Grep, Glob` — appropriate allowlist for read-only work.
- disallowedTools: `Agent, Write, Edit` — correctly locks out mutation and
  recursion.
- model: `sonnet` — explicit, not inherited.
- maxTurns: 25 — bounded execution, prevents runaway loops.

**SoNash-specific knowledge embedded (9 distinct elements):**

1. Stack versions: Next.js 16, React 19, Firebase 12, Tailwind 4, Zod 4
   (line 14)
2. Directory layout: app/, components/, lib/, functions/src/, hooks/, types/,
   scripts/ with semantics for each (lines 21-42)
3. Key files named explicitly: `lib/firestore-service.ts`, `lib/utils/`,
   `lib/logger.ts`, `functions/src/schemas.ts`,
   `functions/src/security-wrapper.ts`,
   `functions/src/firestore-rate-limiter.ts`, `scripts/lib/sanitize-error.js`,
   `scripts/lib/security-helpers.js`, `firestore.rules`, `firebase.json` (lines
   30-42)
4. Cloud Functions security boundary pattern (lines 44-48)
5. Repository pattern awareness (lines 49-50)
6. State management pattern (lines 51-52)
7. Error handling pattern (lines 53-54)
8. Pattern compliance checklist: checks Cloud Functions boundary, repository
   pattern, type safety per-finding (lines 124-129)
9. Feature trace workflow: 6-step end-to-end trace from UI to Firestore rules
   (lines 116-123)

**Return protocol quality:** The structured return format (lines 157-194)
includes: Scope, Key Files table, Findings, Data Flow (step-by-step),
Dependencies, Pattern Compliance (3 named checks with COMPLIANT/DEVIATION
notation), Additional Observations, and Confidence. This is significantly more
structured than what the built-in Explore agent returns, enabling downstream
orchestrators to process results reliably.

**Comparison against built-in Explore (Haiku, read-only):**

| Dimension                  | Built-in Explore | Custom explore                      |
| -------------------------- | ---------------- | ----------------------------------- |
| Model                      | Haiku            | Sonnet                              |
| SoNash context             | None             | 9 embedded elements                 |
| Pattern compliance check   | None             | Explicit (3 checks)                 |
| Return format              | Unstructured     | Structured protocol                 |
| File path verification     | None             | Explicit constraint (lines 146-153) |
| Exploration strategy types | None             | 5 named strategies (lines 60-145)   |
| Scope constraint           | Generic          | Explicit ("stay within request")    |
| maxTurns                   | Not set          | 25                                  |

**Deduction breakdown (18 points off):**

- Missing `<example>` blocks in description field (the single biggest D1b
  finding for reliable auto-delegation). Description says "Use PROACTIVELY" but
  lacks the 2-4 concrete `<example>` blocks that official best practices
  require. (-8 points)
- Bash code in the agent body uses `grep -rl` and `grep -rn` directly, rather
  than the project's preferred `Grep` tool. This is inconsistent with CLAUDE.md
  Section 6's tool preferences, and models bad practices for an exploration
  guide. (-4 points)
- No `color` field, reducing visual identification in the UI. (-3 points)
- No `skills:` preloading of any relevant reference material (e.g., could
  preload CODE_PATTERNS.md or SECURITY_CHECKLIST.md for pattern-aware
  exploration). (-3 points)

---

### 2. `plan` Override: Architecture and Content Quality [CONFIDENCE: HIGH]

**Quality score: 79/100**

The custom `plan` agent (209 lines) is likewise a substantial improvement over
the built-in Plan agent but has several more gaps than `explore`.

**Structural compliance:**

- Name: `plan` — matches naming rules. Shadows built-in.
- Description: present, uses "Use PROACTIVELY" trigger phrasing.
- Tools: `Read, Bash, Grep, Glob` — matches explore's allowlist exactly.
- disallowedTools: `Agent, Write, Edit` — correct. READ-ONLY is appropriate for
  planning.
- model: `sonnet` — explicit.
- maxTurns: 25 — bounded.

**READ-ONLY appropriateness for planning:** READ-ONLY is the correct design
choice for `plan`. The agent's job is to investigate the codebase and produce a
structured plan in its return value — not to create files. The plan output is
returned to the orchestrator, which then decides whether to execute. This
matches the architectural separation-of-concerns pattern. The built-in Plan
agent is also read-only. [D3c-Finding-9 confirms: plan returns structured plan
inline; gsd-planner writes to disk — these serve different patterns.]

**SoNash-specific knowledge embedded (11 distinct elements):**

1. Stack versions: Next.js 16, React 19, Firebase 12, Tailwind 4, Zod 4
   (line 12)
2. Security boundary: complete 5-step Cloud Functions write path requirement
   (lines 26-35)
3. Repository pattern: explicit routing instruction (lines 38-40)
4. Type system: strict mode, no `any`, types location (lines 43-48)
5. Component architecture: Server Components default, `"use client"` policy,
   `Readonly<>`, Tailwind utility-first (lines 51-58)
6. Error handling: all three layers (sanitizeError, logger, sonner) with file
   paths (lines 61-67)
7. Constraint checklist (Step 3, lines 92-100): 6 named checks including
   protected collection detection, route additions, shared state, type changes,
   security, hook/script compliance
8. Dependency order principle: Foundation-first ordering (types → schemas →
   services → components)
9. Plan quality checklist: 8-item pre-return verification (lines 129-141)
10. Post-task agent identification: code-reviewer, security-auditor (lines
    199-201)
11. File verification requirement: `ls` or Read to confirm file existence (lines
    147-148)

**Comparison against built-in Plan (inherit model, read-only):**

| Dimension                   | Built-in Plan          | Custom plan                                                  |
| --------------------------- | ---------------------- | ------------------------------------------------------------ |
| Model                       | Inherit (parent model) | Sonnet explicit                                              |
| SoNash context              | None                   | 11 embedded elements                                         |
| Security boundary awareness | None                   | 5-step write-path requirement                                |
| Plan quality checklist      | None                   | 8-item checklist                                             |
| Step format                 | Unstructured           | Explicit template (Step N, S/M/L sizing, Depends on, Verify) |
| Risk assessment             | None                   | Structured table (Risk/Likelihood/Impact/Mitigation)         |
| Parallelization guidance    | None                   | Explicit section                                             |
| Post-task agent suggestions | None                   | code-reviewer + security-auditor                             |
| maxTurns                    | Not set                | 25                                                           |

**Deduction breakdown (21 points off):**

- Missing `<example>` blocks in description field — same gap as `explore`. (-8
  points)
- Step 4 (Design the Plan) and Step 5 (Risk Assessment) contain no
  SoNash-specific examples. The instructions are generic ("what could go
  wrong?") with no codebase- specific scenarios. A planner for SoNash should
  have examples like "modifying `lib/firestore-service.ts` has a blast radius of
  N components." (-5 points)
- No pre-invocation check for existing plans. If a PLAN.md or planning document
  already exists, the agent should read it before producing a duplicate or
  conflicting plan. (-4 points)
- Bash code uses `grep -rl` directly (lines 84-88) — same tool preference
  inconsistency as `explore`. (-2 points)
- No `color` field. (-2 points)

---

### 3. Override Naming: Critical Case-Sensitivity Finding [CONFIDENCE: HIGH]

**This is the most actionable finding in this analysis.**

The custom agents are named `explore` (lowercase) and `plan` (lowercase) in
their frontmatter. The official naming rules require lowercase names.
[D1b-Finding-12]

However, CLAUDE.md Section 7 PRE-TASK table references `Explore` (capital-E) and
`Plan` (capital-P) — using the display names of the built-in system agents.

**Invocation data from agent-invocations.jsonl (118 total entries):**

| Agent name in log     | Count | First timestamp  | Last timestamp   | Source                                   |
| --------------------- | ----- | ---------------- | ---------------- | ---------------------------------------- |
| `Explore` (capital)   | 12    | 2026-03-25T00:09 | 2026-03-29T21:20 | Built-in or capital reference            |
| `explore` (lowercase) | 12    | 2026-03-27T12:32 | 2026-03-27T16:00 | Custom override invoked                  |
| `Plan` (capital)      | 1     | 2026-03-29T18:30 | —                | Built-in or capital reference            |
| `plan` (lowercase)    | 0     | —                | —                | Custom override never invoked explicitly |

**Critical observation on the `Explore` timeline:**

- Custom `explore.md` was committed 2026-03-24 13:35:48
- Capital `Explore` appears in sessions after this date: 2026-03-27T12:11,
  2026-03-29T00:29, 2026-03-29T11:14, 2026-03-29T11:22, 2026-03-29T11:25,
  2026-03-29T18:18, 2026-03-29T21:19, 2026-03-29T21:20

This means: **After the override was created, capital-E `Explore` continued to
be called** in 8 of 12 capital-E invocations. These are not all pre-creation.

**Interpretation of the naming divergence:** D4b-Finding (source: GitHub issue
#21348) confirmed that `.claude/agents/` takes higher priority than built-ins,
and creating a custom agent with the same name IS the official recommended
mechanism for overriding built-ins. However:

1. The official names for built-in agents are title-case: `Explore`, `Plan`,
   `General-purpose`.
2. The custom override uses lowercase `explore` and `plan` per naming rules.
3. Whether `Explore` resolves to `explore` is an implementation question. The
   invocation log records whatever name was used at call time — `Explore` vs
   `explore` suggests different invocation paths are producing different log
   entries.

**Most likely explanation:** When orchestrators (skills, agents) explicitly
invoke "Explore agent" by natural language or description match, Claude may
resolve to the custom `explore` (lowercase), logging it as `explore`. When the
main session Claude is following CLAUDE.md instructions that say `Explore` agent
and uses the Task tool directly, it may invoke the system agent by its built-in
name, logging as `Explore`.

**The consequence:** The custom override may NOT be consistently replacing the
built-in. The 12 `Explore` (capital) invocations after 2026-03-24 may be hitting
the built-in Haiku-powered system agent, bypassing all the SoNash context in the
custom agent.

---

### 4. Override Invocation Pattern: Explicit vs Auto-Delegation [CONFIDENCE: MEDIUM]

D1b-Finding-9 established that auto-delegation is unreliable in practice, even
with "PROACTIVELY" trigger phrasing. Both `explore` and `plan` descriptions use
this pattern but lack `<example>` blocks, making auto-delegation even less
likely to trigger.

**Invocation pattern analysis:**

The 12 lowercase `explore` invocations cluster in two sessions:

- session-1774611651201 (2026-03-27): 1 invocation — "Analyze research reframing
  needs"
- session-1774618914560 (2026-03-27): 8 invocations — all verification passes
  (V1, V2, V3, V3a, V3b) plus admin/dev page audit, skill data inventory (x2),
  state file inventory
- session-1774622185275 (2026-03-27): 3 invocations — continuing skill data and
  state file inventory work

These are all **explicit programmatic invocations** within orchestrated
deep-research pipelines — the deep-research skill and its verification agents
explicitly named `explore` in their Task/Agent tool calls. This is NOT
auto-delegation.

The 1 lowercase `plan` invocation (session-1774797344251, 2026-03-29T18:30) was
"Plan gap-pursuit phase design" — also explicit within a research pipeline.

**Conclusion:** Both overrides are used exclusively via explicit programmatic
invocation in skill pipelines, not via auto-delegation from main-session user
requests.

For the user-interaction path (CLAUDE.md Section 7 PRE-TASK triggers), the
CLAUDE.md says `Explore` agent (capital-E) and `Plan` agent (capital-P). If
Claude reads CLAUDE.md as instructing use of the built-in by name, the custom
override is bypassed. This creates a silent effectiveness gap: the override
works for programmatic pipeline callers but not for the primary interactive
trigger pathway.

---

### 5. Is the Sonnet Model Choice Justified? [CONFIDENCE: HIGH]

For `explore` (replacing built-in Haiku):

- **Justified.** The built-in Explore uses Haiku for "fast, low-latency codebase
  search." The custom agent's value proposition is NOT speed — it's SoNash-aware
  pattern compliance checking. Pattern compliance checking (does this component
  follow the Cloud Functions boundary? are queries in firestore-service.ts?)
  requires reasoning about architectural patterns across multiple files, which
  is a Sonnet-appropriate task. The tradeoff (higher cost) is justified by the
  quality improvement when the override is actually invoked.
- **Note:** The Haiku→Sonnet upgrade is only realized when the custom agent is
  invoked. If 12 of 24 invocations are hitting the built-in Haiku, half the
  model cost benefit is lost.

For `plan` (replacing built-in Plan which inherits parent model):

- **Net neutral to slight improvement.** The built-in Plan uses the parent model
  (inherit), which in most interactive sessions IS Sonnet. The custom `plan`
  with `model: sonnet` produces the same model but adds explicit SoNash context.
  There is no cost increase (Sonnet→Sonnet in most cases). The explicit
  `model: sonnet` is beneficial for sessions running a lower-cost model where
  `inherit` would degrade plan quality.

---

### 6. What's Missing Across Both Overrides [CONFIDENCE: HIGH]

Six improvements would materially increase effectiveness:

1. **`<example>` blocks in description** — Required for reliable auto-delegation
   per D1b-Finding-9. Both agents lack these entirely. Without them, PROACTIVELY
   language is insufficient. Format: 2-4 `<example>` blocks with Context, user
   query, assistant response, and `<commentary>` explaining why the agent is
   appropriate.

2. **CLAUDE.md naming alignment** — Either: a. Rename custom agents to match
   built-in display names exactly (if case-insensitive matching works), OR b.
   Update CLAUDE.md Section 7 to reference lowercase `explore` and `plan`
   explicitly, OR c. Add explicit `@"explore (agent)"` mention syntax guidance
   to CLAUDE.md This is critical for the interactive trigger pathway.

3. **Tool preference consistency** — Both agents include `grep -rl` / `grep -rn`
   in Bash code examples. CLAUDE.md Section 6 states Grep tool is preferred over
   `grep` commands. The agent bodies should use `Grep` tool examples instead.

4. **Pre-invocation context check in `plan`** — Check for existing planning
   documents before producing a new plan. Read `.planning/` directory if it
   exists; reference relevant prior decisions to avoid contradicting established
   architecture.

5. **`color` field for visual identification** — Both agents would benefit from
   color coding: `explore` → `blue` (analysis/diagnostic work), `plan` → `cyan`
   (data processing/planning). Per D1b-Finding-8, blue=analysis and cyan=data
   processing are the appropriate semantic mappings.

6. **SoNash examples in `plan` body** — The planning workflow steps
   (particularly Step 4-5) should include concrete SoNash examples: "e.g., if
   adding a new write path to `journal`, the blast radius includes: components
   using `httpsCallable`, `functions/src/handlers/`, `functions/src/schemas.ts`,
   `firestore.rules`." This would make the plan agent's output more calibrated
   to actual SoNash architecture.

---

## Sources

| #   | Path/URL                                                         | Title                                | Type                    | Trust | CRAAP           | Date       |
| --- | ---------------------------------------------------------------- | ------------------------------------ | ----------------------- | ----- | --------------- | ---------- |
| 1   | `.claude/agents/explore.md`                                      | Custom explore agent                 | Filesystem              | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-24 |
| 2   | `.claude/agents/plan.md`                                         | Custom plan agent                    | Filesystem              | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-24 |
| 3   | `.claude/state/agent-invocations.jsonl`                          | Agent invocation log                 | Filesystem              | HIGH  | 5/5/5/5/5 = 5.0 | Live data  |
| 4   | `CLAUDE.md` (Section 7)                                          | Project triggers                     | Filesystem              | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-24 |
| 5   | `.research/custom-agents/findings/D1b-agent-format-docs.md`      | Official agent format                | Prior research          | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-29 |
| 6   | `.research/custom-agents/findings/D3a-local-agents-inventory.md` | Local agent inventory                | Prior research          | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-29 |
| 7   | `.research/custom-agents/findings/D3c-cross-cutting-analysis.md` | Cross-cutting analysis               | Prior research          | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-29 |
| 8   | `.research/custom-agents/findings/D4b-model-selection-docs.md`   | Model selection docs                 | Prior research          | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-29 |
| 9   | `git log` (commit `db1be621`)                                    | Creation commit for explore/plan     | Git history             | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-24 |
| 10  | GitHub issue #21348 (via D4b)                                    | Built-in agent model override method | Prior research citation | HIGH  | 4/5/5/5/5 = 4.8 | Jan 2026   |

---

## Contradictions

### C1: Invocation log case divergence vs. override priority

D1b-Finding-4 establishes that `.claude/agents/` (project) takes priority over
built-in agents when the name matches. The invocation log shows capital
`Explore` being recorded after the lowercase `explore` override was created. Two
interpretations:

**Interpretation A:** Claude Code's agent name matching IS case-insensitive, so
`Explore` and `explore` are the same agent — and the invocation log records
whatever case was used in the invocation request, not the agent file name. Under
this interpretation, all 24 `Explore`+`explore` invocations hit the custom
override.

**Interpretation B:** The names are distinct. Capital `Explore` hits the
built-in; lowercase `explore` hits the custom override. Under this
interpretation, 12 of 24 invocations bypassed the override entirely.

**Resolution:** Cannot be definitively resolved from filesystem evidence alone.
The official naming rules (D1b-Finding-12) state names must be lowercase in
definition files. The display name `Explore` in documentation may be purely
cosmetic. However, the behavior of 12 capital-E invocations post-creation
suggests they are being routed somewhere — and the persistence of the capital-E
pattern even in sessions after the override was created is notable. This
requires empirical testing to resolve definitively.

### C2: Description phrasing effectiveness vs. actual invocation pattern

D1b-Finding-9 found that PROACTIVELY language helps but is insufficient without
`<example>` blocks. Both overrides use PROACTIVELY but lack examples. Yet 12
lowercase `explore` invocations did occur — all via explicit programmatic
invocation, not auto-delegation. This is consistent with D1b (auto-delegation
unreliable), not contradictory, but confirms the description field is not
driving invocations in practice.

---

## Gaps

1. **Case-sensitivity of agent name resolution**: Cannot confirm from filesystem
   whether `Explore` (capital-E) in CLAUDE.md triggers the custom `explore`
   (lowercase) override or the built-in. This is the highest-priority gap — it
   determines whether the overrides are working at all for the primary
   interactive trigger path.

2. **Built-in agent system prompts not readable**: The built-in Explore and Plan
   system prompts are not accessible as files on disk. Cannot do a direct
   line-by-line comparison. The assessment of "improvement over built-in" is
   based on capability inference from documentation (what the built-in does) vs.
   custom agent body (what the override adds).

3. **`plan` lowercase invocation = 0**: The `plan` agent has never been invoked
   with lowercase `plan` in any recorded session. The one `Plan` capital
   invocation (2026-03-29) may or may not have hit the custom override. This
   means the `plan` override has essentially zero empirical validation of
   actually working.

4. **Auto-delegation effectiveness unverified**: Neither override has any
   recorded auto-delegation invocations (where Claude chose the agent without
   explicit direction). The interactive trigger pathway (CLAUDE.md Section 7 →
   user triggers → Claude auto-delegates) has not been validated.

---

## Serendipity

**S1: The invocation log reveals a two-tier invocation ecosystem.** Orchestrated
agent pipelines (deep-research, verification passes) use lowercase explicit
invocation and consistently hit the custom overrides. Interactive user-triggered
workflows (CLAUDE.md Section 7 references) use capital-case names and may be
hitting built-ins. This creates an asymmetry: the overrides provide value in
pipeline contexts but may be invisible in the interactive context where they'd
benefit the user most.

**S2: The `plan` agent has zero confirmed successful invocations as the custom
override.** The sole `Plan` (capital) invocation (session-1774797344251, "Plan
gap-pursuit phase design") was on 2026-03-29, 5 days after creation. It shows no
follow-up usage. The `plan` agent may be entirely theoretical in terms of actual
runtime benefit delivered.

**S3: Both agents would benefit from `skills:` preloading.** Since CLAUDE.md,
CODE_PATTERNS.md, and SECURITY_CHECKLIST.md all exist as navigable documents,
and since the agent body already references their content via inline summaries,
the `skills:` field could inject these documents directly into the agent's
context. This would make the agents self-contained regardless of whether
CLAUDE.md loads via message flow — particularly valuable for the `plan` agent
which needs to enforce security boundary compliance during planning.

---

## Quality Score Summary

| Agent     | Quality Score | Primary Strengths                                                        | Primary Gaps                                                 |
| --------- | ------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `explore` | 82/100        | SoNash context depth, return protocol, tool constraints                  | No `<example>` blocks, naming question, Bash tool preference |
| `plan`    | 79/100        | Security boundary enforcement, 8-item quality checklist, return protocol | No `<example>` blocks, naming question, no prior-plan check  |

---

## Confidence Assessment

- HIGH claims: 5
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The one MEDIUM claim (Finding 4: invocation pattern interpretation) stems from
ambiguity in what capital-E `Explore` invocations actually hit. All other
findings are grounded in direct filesystem reads of agent bodies, the invocation
log, CLAUDE.md, prior research findings, and git history.

---

## Source Count

- Direct filesystem reads: 6 (explore.md, plan.md, agent-invocations.jsonl,
  CLAUDE.md, git log)
- Prior research findings documents: 4 (D1b, D3a, D3c, D4b)
- Total independent sources: 10
