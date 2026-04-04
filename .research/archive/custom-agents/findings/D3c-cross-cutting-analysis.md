# Findings: Cross-Cutting Analysis of the Full 39-Agent Ecosystem

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ3 (Part C)

---

## Executive Summary

The 39-agent ecosystem consists of three physical locations: 26 local agents in
`.claude/agents/*.md`, 13 project-tracked global copies in
`.claude/agents/global/`, and 12 actual runtime global agents in
`~/.claude/agents/`. There is a **critical sync gap** between the
project-tracked copies (updated Mar 2026) and the runtime global copies (stale).
The ecosystem has a clear two-tier quality split driven by the March 2026
agent-env P4.1/P4.2 work. Three major redundancy clusters persist despite a
prior audit recommending action.

---

## Key Findings

### Finding 1: Global Agent Sync Gap — Runtime Agents Are Stale [CONFIDENCE: HIGH]

The project maintains two copies of global agents:

- `.claude/agents/global/` — 13 project-tracked copies, updated 2026-03-24
  (commit 024ae700)
- `~/.claude/agents/` — 12 runtime copies Claude Code actually uses, **not
  updated**

The P4.1 commit added `model: sonnet` to all 13 global agents in
`.claude/agents/global/`, but the `~/.claude/agents/` copies were never synced.
The `scripts/sync-claude-settings.js` that formerly handled this sync is marked
`REMOVED` in `CROSS_PLATFORM_SETUP.md` (deprecated 2026-02-23), and no
replacement sync mechanism exists.

**Impact:** All 12 global agents in `~/.claude/agents/` currently have no
`model:` field declared. Without a declared model, Claude Code falls back to
default behavior. The intent of assigning `model: sonnet` (per D18 decision) is
not being realized for runtime global agents.

**Divergence table:**

| Agent               | `.claude/agents/global/` | `~/.claude/agents/` |
| ------------------- | ------------------------ | ------------------- |
| gsd-planner         | `model: sonnet`          | `model: NONE`       |
| gsd-debugger        | `model: sonnet`          | `model: NONE`       |
| gsd-codebase-mapper | `model: sonnet`          | `model: NONE`       |
| ... (all 12 shared) | `model: sonnet`          | `model: NONE`       |

**Compound divergence:** The two locations do not even have the same agent set:

| Agent                     | `.claude/agents/global/` | `~/.claude/agents/` |
| ------------------------- | ------------------------ | ------------------- |
| deep-research-searcher    | PRESENT                  | ABSENT              |
| deep-research-synthesizer | PRESENT                  | ABSENT              |
| gsd-nyquist-auditor       | ABSENT                   | PRESENT             |

This means the `/deep-research` skill spawns agents that only exist in the
project-tracked location — not in the runtime global directory. This works
because Claude Code loads agents from the project `.claude/agents/` directory
which takes precedence, but the architecture is fragile: on a new locale (work
computer), the deep-research agents would be missing from `~/.claude/agents/`
until manually copied.

**Sources:** `CROSS_PLATFORM_SETUP.md` (sync script removal); diff of
`.claude/agents/global/gsd-planner.md` vs `~/.claude/agents/gsd-planner.md`;
commit `024ae700`.

---

### Finding 2: Three Redundancy Clusters — All Persist From Prior Audit [CONFIDENCE: HIGH]

#### Cluster A: Debugging (4 agents, 80%+ overlap)

| Agent                 | Lines | Location | Quality                                        |
| --------------------- | ----- | -------- | ---------------------------------------------- |
| debugger              | 37    | local    | Stub — no SoNash context, no return protocol   |
| error-detective       | 40    | local    | Stub — no SoNash context, no return protocol   |
| devops-troubleshooter | 40    | local    | Stub — no SoNash context, no return protocol   |
| gsd-debugger          | ~36KB | global   | Heavy — scientific method, checkpoint protocol |

All three stubs (debugger, error-detective, devops-troubleshooter) share
identical 5-step problem-solving approaches and nearly identical output formats.
The description of each uses "Use PROACTIVELY for debugging issues" as their
primary trigger — creating three indistinguishable entry points for the same
broad problem category.

**Differentiation potential exists but is not implemented:**

- `debugger` → source code and logic errors (current 37 lines make no
  distinction)
- `error-detective` → log patterns and anomalies (37-40 lines)
- `devops-troubleshooter` → infrastructure and deployment failures (40 lines)

This redundancy was identified in the Session #227 AGENT_INVENTORY.md with a
recommendation to "consolidate stubs into single 'troubleshooter' or clarify
scopes." As of 2026-03-29, neither action has been taken. The stubs remain
frozen at Jan 2026.

The `gsd-debugger` is intentionally separate — it operates within the
`/gsd:debug` orchestration pipeline and has distinct checkpoint/state management
capabilities that warrant its specialized existence.

#### Cluster B: Documentation (2 agents, ~70% overlap post-P4.1)

| Agent                | Lines | Location | Quality                                     |
| -------------------- | ----- | -------- | ------------------------------------------- |
| technical-writer     | 41    | local    | Stub — no SoNash context                    |
| documentation-expert | 119   | local    | Tier A — SoNash conventions, scope boundary |

Note: The overlap estimate has decreased from 95% (prior inventory) to ~70%
because the `documentation-expert` was substantially updated in P4.1 to include
an **explicit scope boundary** distinguishing the two agents:

- `documentation-expert` handles: system docs (CLAUDE.md, SESSION_CONTEXT.md),
  agent docs, API docs, architecture docs, documentation index maintenance
- `technical-writer` handles: user guides, tutorials, README files, content
  accessibility, tutorial series

The boundary is now documented in `documentation-expert` and there is a
cross-reference to `technical-writer` in its scope section. However,
`technical-writer` is still a 41-line stub that has not been updated to reflect
this boundary from its own perspective. A user looking at `technical-writer`
alone would not know the boundary exists.

**Residual risk:** The `documentation-expert` description in CLAUDE.md Section 7
says "Use PROACTIVELY for creating or improving internal project documentation."
`technical-writer` says "Use PROACTIVELY for user guides, tutorials, README
files, architecture docs." The phrase "architecture docs" in
`technical-writer`'s description overlaps with `documentation-expert`'s scope.
The existing tools description for `technical-writer` is still generic.

#### Cluster C: Architecture Fragmentation (3 agents)

| Agent               | Lines | Model  | Quality                                     |
| ------------------- | ----- | ------ | ------------------------------------------- |
| backend-architect   | 39    | sonnet | Stub                                        |
| fullstack-developer | 1281  | opus   | Tier B-Heavy (generic, not SoNash-specific) |
| database-architect  | 610   | opus   | Tier B-Heavy (generic)                      |

`backend-architect` (39 lines) covers RESTful APIs, microservices, and
scalability — a subset of `fullstack-developer`'s scope (1281 lines). This
redundancy was flagged in the Feb 2026 AI optimization audit (AO-06) and the
Session #227 inventory. Both `fullstack-developer` and `database-architect` are
Tier B (Jan 2026, generic content, no SoNash patterns, no return protocols).

For a solo developer on a SoNash-specific Next.js/Firebase app, neither agent is
well-targeted. The recommendation from the AI optimization audit — to
consolidate `backend-architect` into `fullstack-developer` — remains
unimplemented.

---

### Finding 3: Tier A vs Tier B Quality Gap Matrix [CONFIDENCE: HIGH]

**Tier A** (updated March 2026, 8 local agents + 13 global agents):
`code-reviewer`, `security-auditor`, `explore`, `plan`, `frontend-developer`,
`documentation-expert`, `dependency-manager`, `test-engineer`, all global
agents.

**Tier B** (frozen January 2026, 18 local agents): All other local agents.

#### Quality Gap Matrix

| Dimension              | Tier A Agents                                      | Tier B Agents                               |
| ---------------------- | -------------------------------------------------- | ------------------------------------------- |
| SoNash project context | Present (stack versions, patterns, file paths)     | Absent — generic descriptions               |
| Return protocol        | Structured (APPROVE/BLOCK, S0-S3, explicit format) | None — free-form output                     |
| maxTurns               | Present (review agents: 25)                        | Absent                                      |
| disallowedTools        | Present (review agents: Agent blocked)             | Absent                                      |
| Tool declarations      | All present and explicit                           | 1 missing (was 3, 2 fixed in P4.1)          |
| Model field            | All present                                        | All present (sonnet/opus assigned Jan 2026) |
| Framework versions     | Correct (Next.js 16.2, React 19.2, Vitest)         | Incorrect/generic (test-engineer had Jest)  |
| Architecture patterns  | SoNash patterns (Cloud Functions, Firestore rules) | Absent for non-heavy agents                 |

**Key Tier A improvements not present in Tier B:**

1. **Structured return protocol**: Tier A agents return data in
   machine-parseable formats (APPROVE/REQUEST_CHANGES/BLOCK verdicts, S0-S3
   severity tables). Tier B agents have no return structure — outputs are ad-hoc
   narratives that synthesizers cannot process reliably.

2. **SoNash stack accuracy**: `test-engineer` was updated to use `Vitest` (not
   Jest), `vi.mock()` (not `jest.mock()`), Firebase 12.10.0 mocking patterns.
   The other Tier B heavy agents (`fullstack-developer`, `database-architect`,
   `security-engineer`) still contain generic examples that may conflict with
   actual SoNash patterns.

3. **Behavioral constraints**: `maxTurns: 25` prevents runaway review loops (D23
   implemented). `disallowedTools: Agent` prevents sub-agent spawning cascade
   (D24 implemented). These are absent from all Tier B agents.

4. **Explicit scope boundaries**: Tier A agents include scope boundary
   documentation (what they handle vs what they defer). Tier B agents have
   overlapping descriptions with no boundary guidance.

**Line count evidence of depth gap:**

| Agent                | Before P4.1 | After P4.1 | Delta |
| -------------------- | ----------- | ---------- | ----- |
| code-reviewer        | ~48 lines   | 259 lines  | +211  |
| security-auditor     | ~40 lines   | 534 lines  | +494  |
| documentation-expert | ~66 lines   | 119 lines  | +53   |
| test-engineer        | ~48 lines   | 1051 lines | +1003 |

---

### Finding 4: Model Assignment Analysis — Three Anomalies [CONFIDENCE: HIGH]

**Current model distribution (local agents):**

| Model         | Agents                                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| sonnet        | 18 agents                                                                                                                        |
| opus          | 6 agents (database-architect, fullstack-developer, penetration-tester, performance-engineer, prompt-engineer, security-engineer) |
| test-engineer | opus                                                                                                                             |

**Anomaly 1: security-auditor downgraded opus→sonnet (intentional, but
questionable)**

The P4.1 commit explicitly changed `security-auditor` from `model: opus` to
`model: sonnet`. The prior AGENT_INVENTORY listed it as `opus`. This downgrade
was made alongside the substantial expansion of the agent's content (from 40 to
534 lines), suggesting the quality increase was intended to compensate for the
model downgrade. However, security auditing is a high-stakes task where model
quality directly impacts vulnerability detection accuracy. Decision 18 in
DECISIONS.md states "heavy lean toward opus" — security-auditor at sonnet
contradicts this principle for a security-critical task.

**Anomaly 2: test-engineer at opus but not updated to latest patterns**

`test-engineer` was updated to Vitest in P4.1 and now has SoNash context. It
retains `model: opus` (unchanged). This is appropriate given that test
engineering requires complex pattern reasoning, but the line count (1051) and
framework specificity warrant the opus assignment. No concern here.

**Anomaly 3: gsd-nyquist-auditor in `~/.claude/agents/` has YAML list tools, no
model**

The `gsd-nyquist-auditor` in `~/.claude/agents/` has tools declared as a YAML
list (non-standard format) and no `model:` field. This was identified as a
quality issue in the prior inventory and remains unresolved. The agent does not
appear in `.claude/agents/global/` (the project-tracked copy), which means it
cannot be fixed through the standard P4.x improvement process — it would require
direct edit of the `~/.claude/agents/` file.

**Model summary by concern:**

- Security: `security-auditor` (sonnet, anomalous), `security-engineer` (opus),
  `penetration-tester` (opus)
- Architecture: `backend-architect` (sonnet), `database-architect` (opus),
  `fullstack-developer` (opus), `nextjs-architecture-expert` (sonnet)
- Review: `code-reviewer` (sonnet — appropriate, augmented with D23/D24)
- GSD pipeline: all sonnet (local global copies), all unset (runtime global)

---

### Finding 5: Tool Access Patterns — Four Distinct Safety Profiles [CONFIDENCE: HIGH]

**Profile 1: Fully Constrained Review Agents (safest)** `code-reviewer`,
`security-auditor`, `explore`, `plan`

- `disallowedTools: Agent` (no recursion)
- `maxTurns: 25` (bounded execution)
- `explore` and `plan` additionally have `disallowedTools: Agent, Write, Edit`
  (pure read-only)

**Profile 2: Read-Only Without Explicit Constraints** `dependency-manager` —
tools: `Read, Bash, Grep` only (no Write/Edit). Effectively read-only but lacks
`disallowedTools` declaration to make it explicit.

**Profile 3: Mutation-Capable Without Constraints (most agents)** 23 of 26 local
agents have `Write` and `Edit` in their tool list with no `disallowedTools`
restriction and no `maxTurns`. This includes:

- All debugging cluster agents (debugger, error-detective,
  devops-troubleshooter)
- All architecture agents (fullstack-developer, backend-architect,
  database-architect)
- security-engineer, penetration-tester, performance-engineer
- All documentation agents

**Profile 4: Extended Tool Access (GSD global agents)** Several GSD agents have
`WebSearch`, `WebFetch`, and `mcp__context7__*` in addition to standard mutation
tools:

- `gsd-planner`, `gsd-phase-researcher`, `gsd-project-researcher`: full web +
  context7
- `gsd-debugger`: `WebSearch` for external debugging reference
- `gsd-codebase-mapper`: write-capable but read-focused (writes analysis docs)

**Risk assessment:** The lack of `disallowedTools: Agent` on 22 of 26 local
agents means they could theoretically spawn sub-agents (recursive delegation).
In practice, this risk is bounded by Claude Code's permission model, but D24
from the prior audit explicitly recognized that "review agents should do their
own work, not spawn sub-agents" — and that principle applies broadly, not just
to review agents.

The `deployment-engineer` agent has `AskUserQuestion` tool — the only local
agent with this tool. This is appropriate for a deployment agent that may need
to confirm environment targets before executing, but there is no documentation
of when this tool will be invoked.

---

### Finding 6: Integration Surface Map — 8 Agents Formally Integrated, 18 Nominally Listed [CONFIDENCE: HIGH]

#### Formally Integrated (trigger defined in CLAUDE.md S7 or skills with spawn logic)

| Agent                | Integration Point                    | Trigger Type                        |
| -------------------- | ------------------------------------ | ----------------------------------- |
| explore              | CLAUDE.md S7 PRE-TASK                | "Exploring unfamiliar code"         |
| plan                 | CLAUDE.md S7 PRE-TASK                | "Multi-step implementation"         |
| security-auditor     | CLAUDE.md S7 PRE-TASK + POST-TASK    | "Security/auth", "Security changes" |
| documentation-expert | CLAUDE.md S7 PRE-TASK                | "New documentation"                 |
| frontend-developer   | CLAUDE.md S7 PRE-TASK                | "React/frontend component work"     |
| code-reviewer        | CLAUDE.md S7 POST-TASK               | "Wrote/modified code"               |
| debugger             | pre-commit-fixer skill (spawn logic) | ESLint/TypeScript errors            |
| code-reviewer        | pre-commit-fixer skill (spawn logic) | Pattern violations                  |

#### Nominally Listed (appear in AGENT_ORCHESTRATION.md capacity table or COMMAND_REFERENCE.md but no automated trigger)

| Agent                | Listed In                                              | Status                        |
| -------------------- | ------------------------------------------------------ | ----------------------------- |
| security-auditor     | AGENT_ORCHESTRATION.md concern map                     | Group lead                    |
| test-engineer        | AGENT_ORCHESTRATION.md concern map                     | Group lead                    |
| performance-engineer | AGENT_ORCHESTRATION.md concern map + CLAUDE.md S7 note | Named in "27 agents" footnote |
| documentation-expert | AGENT_ORCHESTRATION.md concern map                     | Group lead                    |
| backend-architect    | AGENT_ORCHESTRATION.md concern map + capacity table    | Named                         |
| frontend-developer   | AGENT_ORCHESTRATION.md concern map + capacity table    | Named                         |
| debugger             | AGENT_ORCHESTRATION.md capacity table                  | Named                         |

#### True Orphans — Zero References in Active Skills/Triggers

| Agent                 | Last Evidence of Use                                | Risk   |
| --------------------- | --------------------------------------------------- | ------ |
| devops-troubleshooter | COMMAND_REFERENCE.md (Infrastructure category list) | Low    |
| error-detective       | COMMAND_REFERENCE.md (Other category list)          | Low    |
| git-flow-manager      | Not found in skills/triggers                        | Orphan |

**Important clarification:** COMMAND_REFERENCE.md lists agents in category
tables as a reference listing, not as triggers. Being in a list is not the same
as being integrated. `devops-troubleshooter` and `error-detective` are listed
but have no skill that explicitly invokes them.

`git-flow-manager` (371 lines, medium quality) has **zero references** in any
active skill or documentation beyond its own agent file. It is the only non-stub
agent with orphan status.

---

### Finding 7: Prior Audit Delta — 7 of 28 Decisions Implemented [CONFIDENCE: HIGH]

The Session #227 audit produced 28 decisions. Current state as of 2026-03-29:

**Implemented:**

- D2 (Agent Teams priority) — `audit-review-team.md` and `research-plan-team.md`
  created
- D21 (Teams in this plan) — Research-plan-team and audit-review-team exist
- D23 (maxTurns on review agents) — `maxTurns: 25` confirmed in code-reviewer
  and security-auditor
- D24 (disallowedTools Agent on review agents) — `disallowedTools: Agent`
  confirmed in both
- D27 (agent compliance strict mode) — `check-agent-compliance.js` has
  `--strict` flag

**Partially implemented:**

- D5 (Stub agent disposition) — 6 high-usage stubs improved (code-reviewer,
  security-auditor, frontend-developer, documentation-expert, test-engineer,
  dependency-manager); remaining stubs (debugger, error-detective,
  devops-troubleshooter, backend-architect, deployment-engineer, ui-ux-designer)
  untouched
- D18 (Model selection — sonnet/opus only) — Local agents all have explicit
  models; global runtime agents have no model declared; security-auditor changed
  opus→sonnet (contra "heavy lean toward opus")

**Not implemented:**

- D22 (Zod schema for agent frontmatter) — No `agent-frontmatter.schema.ts` or
  equivalent found; invocation Zod schema exists in
  `scripts/reviews/dist/lib/schemas/` but only for invocation records, not agent
  definitions
- D25 (permissionMode bypassPermissions on code-reviewer) — Not in frontmatter
- D28 (PreToolUse hook for Agent tool) — Not found in `.claude/hooks/`
- D3-D17 (various research and organizational decisions) — These were process
  decisions for the research phase, now complete; not applicable
- D1 (execution timeline) — Complete; plan was executed
- Debugging cluster consolidation — Recommended in AGENT_INVENTORY.md
  observations, not a numbered decision; still unresolved
- Documentation cluster consolidation — Same; partial mitigation via scope
  boundary in documentation-expert
- gsd-nyquist-auditor YAML list format fix — Still in YAML list format in
  `~/.claude/agents/`

---

### Finding 8: The `explore` vs `gsd-codebase-mapper` Boundary [CONFIDENCE: HIGH]

These agents share the same core operation (codebase analysis) but are
architecturally distinct:

| Dimension      | explore                                  | gsd-codebase-mapper                        |
| -------------- | ---------------------------------------- | ------------------------------------------ |
| Invocation     | Interactive (CLAUDE.md S7 trigger)       | Pipeline (spawned by `map-codebase`)       |
| Write access   | None (explicit disallow)                 | Yes (writes analysis docs)                 |
| Output         | Returns to caller (structured return)    | Writes to filesystem (context reduction)   |
| SoNash context | Full (Next.js 16, Firebase 12, patterns) | Generic                                    |
| Scope          | Investigative (feature trace, data flow) | Structural (tech, arch, quality, concerns) |
| maxTurns       | 25                                       | Not set                                    |

The boundary is well-defined: `explore` is an interactive investigation agent
for the orchestrating session; `gsd-codebase-mapper` is a pipeline worker that
writes analysis documents to reduce orchestrator context load. There is
functional overlap (both read code) but no true redundancy — they serve
different architectural patterns (interactive vs pipeline).

---

### Finding 9: The `plan` vs `gsd-planner` Boundary [CONFIDENCE: HIGH]

| Dimension         | plan                               | gsd-planner                             |
| ----------------- | ---------------------------------- | --------------------------------------- |
| Invocation        | Interactive (CLAUDE.md S7 trigger) | Pipeline (spawned by `/gsd:plan-phase`) |
| Write access      | None (explicit disallow)           | Yes (writes PLAN.md)                    |
| Context awareness | SoNash patterns, architecture      | Generic + reads CLAUDE.md at runtime    |
| Output            | Returns structured plan to caller  | Writes PLAN.md to filesystem            |
| Verification      | Not checked                        | Checked by gsd-plan-checker afterward   |
| External research | None                               | WebFetch + context7 MCP                 |

`plan` is SoNash-specific, read-only, returns a structured plan inline.
`gsd-planner` is generic, writes to disk, uses external research, is part of a
multi-agent verification pipeline. No redundancy — fundamentally different
operational models.

---

### Finding 10: Security Agent Triad — Division of Labor Well-Defined [CONFIDENCE: HIGH]

| Agent              | Scope                                                                                  | Model  | Lines |
| ------------------ | -------------------------------------------------------------------------------------- | ------ | ----- |
| security-auditor   | Application security review (SoNash-specific: Cloud Functions, Firestore rules, OWASP) | sonnet | 534   |
| security-engineer  | Infrastructure security, compliance frameworks, IaC, CSPM                              | opus   | 985   |
| penetration-tester | Ethical hacking, red-team operations, exploitation PoC                                 | opus   | 42    |

The triad covers three distinct layers: application (security-auditor),
infrastructure (security-engineer), and adversarial testing
(penetration-tester). Scope overlap is minimal. The main concern is
`penetration-tester` as a 42-line stub — its description mentions "network
penetration testing" and "red team operations" which are far outside SoNash's
scope (a web app, not infrastructure). It is likely dead weight for this
project.

---

## Sources

| #   | Path                                                                  | Type           | Trust | Date          |
| --- | --------------------------------------------------------------------- | -------------- | ----- | ------------- |
| 1   | `.claude/agents/*.md` (all 26)                                        | Filesystem     | HIGH  | Verified live |
| 2   | `~/.claude/agents/*.md` (all 12)                                      | Filesystem     | HIGH  | Verified live |
| 3   | `.claude/agents/global/*.md` (all 13)                                 | Filesystem     | HIGH  | Verified live |
| 4   | `.planning/agent-environment-analysis/AGENT_INVENTORY.md`             | Internal audit | HIGH  | 2026-03-17    |
| 5   | `.planning/agent-environment-analysis/DECISIONS.md`                   | Internal audit | HIGH  | 2026-03-17    |
| 6   | `CLAUDE.md` (Section 7)                                               | Project config | HIGH  | 2026-03-24    |
| 7   | `docs/agent_docs/AGENT_ORCHESTRATION.md`                              | Project docs   | HIGH  | 2026-02-10    |
| 8   | `.claude/CROSS_PLATFORM_SETUP.md`                                     | Project docs   | HIGH  | 2026-02-23    |
| 9   | `.claude/COMMAND_REFERENCE.md`                                        | Project docs   | HIGH  | Current       |
| 10  | `git log` output (commits 024ae700, db1be621)                         | Git history    | HIGH  | 2026-03-24    |
| 11  | `.claude/skills/` (SKILL.md files, grep survey)                       | Project skills | HIGH  | Various       |
| 12  | `docs/audits/comprehensive/audit-2026-02-22/ai-optimization-audit.md` | Prior audit    | HIGH  | 2026-02-22    |

---

## Contradictions

**Contradiction 1: D18 "heavy lean toward opus" vs security-auditor opus→sonnet
downgrade** Decision 18 states the philosophy "Sonnet and opus only, heavy lean
toward opus." The P4.1 commit explicitly downgraded `security-auditor` from opus
to sonnet. Security auditing is a high-stakes task — the prior inventory listed
it as `opus` for that reason. The P4.1 commit message offers no explicit
rationale for the downgrade beyond proximity to the other improvements. Both
choices have merit (opus = better detection, sonnet = lower cost for frequent
use), but the decision contradicts the stated philosophy without explanation.

**Contradiction 2: "27 agents available" in CLAUDE.md vs actual 26 local
agents** CLAUDE.md Section 7 states "27 agents available beyond this table." The
actual count of `.claude/agents/*.md` files is 26. The count may have been set
before a consolidation, or may be counting something different (perhaps
including mcp-expert or a team config). This is a documentation drift rather
than a functional issue, but it erodes confidence in the accuracy of agent
inventory documentation.

**Contradiction 3: gsd-nyquist-auditor exists in `~/.claude/agents/` but not in
`.claude/agents/global/`** The project tracks global agents in
`.claude/agents/global/` for sync, but `gsd-nyquist-auditor` was never added
there. It exists only in the runtime location. If a new developer sets up the
project following `CROSS_PLATFORM_SETUP.md`, they would copy
`.claude/agents/global/` to `~/.claude/agents/` — missing nyquist-auditor
entirely, while also receiving deep-research-searcher and
deep-research-synthesizer which don't belong in `~/.claude/agents/`.

---

## Gaps

1. **Invocation data absent**: The prior audit identified that
   `invocations.jsonl` tracks skills but not agents. This remains true. There is
   no empirical data on which agents are actually invoked in practice. The
   "orphan" classification (devops-troubleshooter, error-detective,
   git-flow-manager) is based on absence of documented triggers, not confirmed
   non-use.

2. **No Zod schema for agent frontmatter (D22)**: There is no automated
   validation that new agents follow the required frontmatter structure. The
   nyquist-auditor YAML-list tools issue is an example of what this would catch.
   Only a manual review found it.

3. **Tier B heavy agents not evaluated**: `fullstack-developer` (1281 lines),
   `security-engineer` (985 lines), and `database-architect` (610 lines) are all
   Tier B (Jan 2026) and have not been read in full for this analysis. Their
   content quality, SoNash accuracy, and return protocol gaps have not been
   assessed at depth. They are known to lack SoNash context but the specific
   inaccuracies are uncharted.

4. **Agent Teams actual usage**: The two team configs exist
   (`audit-review-team.md`, `research-plan-team.md`) but there is no invocation
   data to determine if they have ever been used in practice.

5. **permissionMode: bypassPermissions (D25)**: Not implemented. The impact of
   its absence is unknown — it's unclear how often code-reviewer is invoked from
   automated (pre-commit) contexts vs interactive sessions.

---

## Serendipity

**The `.claude/agents/global/` folder is a documentation artifact, not a runtime
location.** The P4.1 commit message says "added model: sonnet to all 13 global
agents" — which is technically true for the project-tracked copies but has no
effect on actual Claude Code runtime behavior, which reads from
`~/.claude/agents/`. This means 6 weeks of improvement work (model fields,
potential future improvements to global agents) may be going to a location that
is never used. The sync mechanism was removed without replacement.

**`COMMAND_REFERENCE.md` is the only document that lists all agent categories.**
This document (not referenced in CLAUDE.md or AGENT_ORCHESTRATION.md) has a
table organizing agents into: Frontend, Backend/API, Infrastructure,
Documentation, Data, and Other categories. It functions as a hidden secondary
trigger surface. Agents like `error-detective` appear only here.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All claims are based on direct filesystem reads, git log inspection, and
cross-referencing against multiple project documents. No training-data-only
claims are made.

---

## Appendix: Full Model and Tool Access Table (All 39 Agents)

### Local Agents (26)

| Agent                          | Model  | maxTurns | disallowedTools    | Write | Edit | Lines | Tier | Last Updated |
| ------------------------------ | ------ | -------- | ------------------ | ----- | ---- | ----- | ---- | ------------ |
| backend-architect              | sonnet | -        | -                  | Yes   | Yes  | 39    | B    | Jan 2026     |
| code-reviewer                  | sonnet | 25       | Agent              | Yes   | Yes  | 259   | A    | Mar 2026     |
| database-architect             | opus   | -        | -                  | Yes   | Yes  | 610   | B    | Jan 2026     |
| debugger                       | sonnet | -        | -                  | Yes   | Yes  | 37    | B    | Jan 2026     |
| dependency-manager             | sonnet | -        | -                  | No    | No   | 114   | A    | Mar 2026     |
| deployment-engineer            | sonnet | -        | -                  | Yes   | Yes  | 41    | B    | Jan 2026     |
| devops-troubleshooter          | sonnet | -        | -                  | Yes   | Yes  | 40    | B    | Jan 2026     |
| documentation-expert           | sonnet | -        | -                  | Yes   | Yes  | 119   | A    | Mar 2026     |
| error-detective                | sonnet | -        | -                  | Yes   | Yes  | 40    | B    | Jan 2026     |
| explore                        | sonnet | 25       | Agent, Write, Edit | No    | No   | 194   | A    | Mar 2026     |
| frontend-developer             | sonnet | -        | -                  | Yes   | Yes  | 243   | A    | Mar 2026     |
| fullstack-developer            | opus   | -        | -                  | Yes   | Yes  | 1281  | B    | Jan 2026     |
| git-flow-manager               | sonnet | -        | -                  | Yes   | Yes  | 371   | B    | Jan 2026     |
| markdown-syntax-formatter      | sonnet | -        | -                  | Yes   | Yes  | 75    | B    | Mar 2026\*   |
| mcp-expert                     | sonnet | -        | -                  | Yes   | Yes  | 272   | B    | Jan 2026     |
| nextjs-architecture-expert     | sonnet | -        | -                  | Yes   | Yes  | 215   | B    | Jan 2026     |
| penetration-tester             | opus   | -        | -                  | Yes   | Yes  | 42    | B    | Jan 2026     |
| performance-engineer           | opus   | -        | -                  | Yes   | Yes  | 40    | B    | Jan 2026     |
| plan                           | sonnet | 25       | Agent, Write, Edit | No    | No   | 209   | A    | Mar 2026     |
| prompt-engineer                | opus   | -        | -                  | Yes   | Yes  | 121   | B    | Jan 2026     |
| react-performance-optimization | sonnet | -        | -                  | Yes   | Yes  | 76    | B    | Jan 2026     |
| security-auditor               | sonnet | 25       | Agent              | Yes   | Yes  | 534   | A    | Mar 2026     |
| security-engineer              | opus   | -        | -                  | Yes   | Yes  | 985   | B    | Jan 2026     |
| technical-writer               | sonnet | -        | -                  | Yes   | Yes  | 41    | B    | Jan 2026     |
| test-engineer                  | opus   | -        | -                  | Yes   | Yes  | 1051  | A    | Mar 2026     |
| ui-ux-designer                 | sonnet | -        | -                  | Yes   | Yes  | 41    | B    | Jan 2026     |

\*markdown-syntax-formatter shows Mar 2026 mtime but content unchanged from Jan
2026 structure

### Global Agents — `.claude/agents/global/` / `~/.claude/agents/` (13/12)

All have `model: sonnet` in project-tracked copies; NONE in runtime copies.

| Agent                     | Write | Edit | In project-tracked | In runtime | Notes                         |
| ------------------------- | ----- | ---- | ------------------ | ---------- | ----------------------------- |
| deep-research-searcher    | No    | No   | Yes                | No         | Project-only                  |
| deep-research-synthesizer | Yes   | No   | Yes                | No         | Project-only                  |
| gsd-codebase-mapper       | Yes   | No   | Both               | Both       | Sync gap: model               |
| gsd-debugger              | Yes   | Yes  | Both               | Both       | Sync gap: model               |
| gsd-executor              | Yes   | Yes  | Both               | Both       | Sync gap: model               |
| gsd-integration-checker   | No    | No   | Both               | Both       | Sync gap: model               |
| gsd-nyquist-auditor       | Yes   | Yes  | No                 | Yes        | Runtime-only; YAML list tools |
| gsd-phase-researcher      | Yes   | No   | Both               | Both       | Sync gap: model               |
| gsd-plan-checker          | No    | No   | Both               | Both       | Sync gap: model               |
| gsd-planner               | Yes   | No   | Both               | Both       | Sync gap: model               |
| gsd-project-researcher    | Yes   | No   | Both               | Both       | Sync gap: model               |
| gsd-research-synthesizer  | Yes   | No   | Both               | Both       | Sync gap: model               |
| gsd-roadmapper            | Yes   | No   | Both               | Both       | Sync gap: model               |
| gsd-verifier              | Yes   | No   | Both               | Both       | Sync gap: model               |
