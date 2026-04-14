# Findings: Agent Orchestration Patterns Comparison

**Searcher:** deep-research-searcher **Profile:** codebase **Date:**
2026-04-06T00:00:00Z **Sub-Question IDs:** SQ-003

---

## Key Findings

### 1. Agent Spawning — Analysis Skills Use It; Synthesis Skills Do Not [CONFIDENCE: HIGH]

The two analysis skills (`repo-analysis`, `website-analysis`) both spawn
subagents for parallel dimension work. The two synthesis skills
(`repo-synthesis`, `website-synthesis`) contain zero agent-spawning directives
in their SKILL.md or REFERENCE.md files — all synthesis phases run inline
(orchestrator only).

Sources: repo-analysis/REFERENCE.md §10 (line 1275),
website-analysis/REFERENCE.md §13 (line 1996), website-synthesis/SKILL.md (full
text — no agent spawn), repo-synthesis/SKILL.md (full text — no agent spawn).

---

### 2. Shared Hard Cap: 4 Concurrent Agents [CONFIDENCE: HIGH]

Both analysis skills share an explicit hard cap of 4 concurrent agents. The cap
is stated in both REFERENCE.md files using near-identical language:

- `repo-analysis/REFERENCE.md` §10, line 1297: "Hard cap: 4 concurrent agents.
  Wave staging required for pools larger than 4."
- `website-analysis/REFERENCE.md` §13, line 2035: "Hard cap: 4 concurrent agents
  (same as repo-analysis). Wave staging required for pools larger than 4."

The website-analysis text explicitly cross-references repo-analysis as its
precedent. Neither synthesis skill defines a cap (no agents are spawned).

---

### 3. Agent Count Formulas and Named Agent Types [CONFIDENCE: HIGH]

**repo-analysis** uses named custom agents from `.claude/agents/`:

- Always: `gsd-codebase-mapper`, `security-auditor`, `code-reviewer` (3 named)
- Conditional: `test-engineer`, `deployment-engineer`, `backend-architect`,
  `performance-engineer`, plus stack-specific agents (triggered by detection)
- Max concurrent: 4 (wave staging when pool > 4)

Source: repo-analysis/REFERENCE.md §10, lines 1279–1295

**website-analysis** uses anonymous spawned agents (no named custom agents):

- Standard mode: up to 2 spawned agents (Creator View agent, Engineer View
  agent) — conditional on "substantial content"
- Deep mode: up to 3 spawned agents (Creator View, Engineer View, Link
  scoring/value map — conditional on >20 scoreable links)
- Quick Scan: inline only, no spawning

Source: website-analysis/REFERENCE.md §13, lines 1998–2017

**Contrast:** repo-analysis uses purpose-built named agents with specific
specializations. website-analysis uses generic "spawned agent" roles with
functionally-described responsibilities but no named agent identities.

---

### 4. Wave Execution Strategy — Both Analysis Skills Use Phase-Gated Waves [CONFIDENCE: HIGH]

Both analysis skills use the same two-wave pattern, but with different wave
compositions:

**repo-analysis** — Two distinct named waves:

```
Phase 0:    Inline orchestrator — Quick Scan (no spawn)
Phase 1:    Inline orchestrator — clone
Phase 2:    Dimension Wave — up to 4 concurrent agents
Phase 3:    History Wave — up to 3 concurrent agents (Deep only, conditional)
Phase 4-5:  Inline orchestrator — aggregation + value map
```

Source: repo-analysis/REFERENCE.md §10, lines 1302–1311

**website-analysis** — Single wave (Phases 2-3):

```
VALIDATE/PREFLIGHT/Phase 0/GATE/Phase 1/1b: Inline orchestrator
Phase 2-3:  Agent Wave — up to 2-3 concurrent agents
Phase 4:    Inline orchestrator — value map aggregation
ROUTING:    Inline orchestrator
```

Source: website-analysis/REFERENCE.md §13, lines 2021–2033

Both are wave-based, not all-at-once or fully sequential. The synthesis skills
have no waves — they execute fully inline.

---

### 5. Agent Failure Handling — Identical Protocol in Both Analysis Skills [CONFIDENCE: HIGH]

Both analysis skills define a 5-step failure protocol with near-identical
wording, suggesting a shared design pattern:

1. After each agent completes, verify output file exists
2. If file is empty (0 bytes — Windows agent output bug): capture
   task-notification result text, write to output file
3. If agent failed entirely: log failure, re-dispatch with narrower scope
4. If retry also fails: report to user, continue with available data
5. NEVER silently accept missing analysis data

repo-analysis/REFERENCE.md §15.2, lines 1588–1596 website-analysis/REFERENCE.md
§13, lines 2038–2045

Both reference the Windows 0-byte agent output bug explicitly and mandate the
task-notification result-capture workaround (CLAUDE.md guardrail #15).

---

### 6. Agent Spawn Parameters — File Output as Primary Contract [CONFIDENCE: HIGH]

In both analysis skills the orchestrator's contract with spawned agents is:

- Each agent writes its output file to disk before returning
- The orchestrator verifies file existence after each agent completes
- The orchestrator does NOT trust return values — file existence is the
  verification signal

**repo-analysis:** Agents write to `dimensions/<dim>-findings.json`
(repo-analysis/REFERENCE.md §10, line 1306)

**website-analysis:** Each spawned agent "writes its artifacts before returning"
(website-analysis/REFERENCE.md §13, line 2029)

The synthesis skills have no agent output contracts because they spawn no
agents.

---

### 7. State File Tracks Agent Progress in Analysis Skills [CONFIDENCE: HIGH]

Both analysis skills track agent spawning counts in their state files:

**website-analysis** state schema includes:

- `agents_spawned` (number)
- `agents_completed` (number) Source: website-analysis/REFERENCE.md §14, lines
  2079–2080

**repo-analysis** state schema includes:

- `agent_budget.allocated` (number)
- `agent_budget.spawned` (number)
- `agent_budget.completed` (number) Source: repo-analysis/REFERENCE.md §8, lines
  1145–1148

Note: repo-analysis uses the term `agent_budget` (with `allocated` field), while
website-analysis uses flat `agents_spawned`/`agents_completed` fields. This
naming difference may reflect an older convention in repo-analysis (the feedback
file `feedback_no_agent_budgets.md` indicates "allocation formula is a planning
floor, not a spending cap").

---

### 8. repo-analysis Has a Conditional Small-Repo Path That Bypasses Agents [CONFIDENCE: HIGH]

repo-analysis explicitly prohibits agent spawning for small repos. The SKILL.md
and REFERENCE.md both state:

- Small repos (<20 files): analyze inline via Bash
- "Subagents cannot access temp directories — do NOT spawn agents for small
  repos"
- Large repos (20+ files): copy clone to project workspace, THEN spawn agents

Source: repo-analysis/SKILL.md lines 137–143, repo-analysis/REFERENCE.md §15.2
lines 1581–1586

website-analysis has a parallel conditional: agents are spawned "If content is
substantial" (Standard mode) — but the REFERENCE.md does not define a
quantitative threshold analogous to the 20-file cutoff. Source:
website-analysis/REFERENCE.md §13, line 2003

---

### 9. code-reviewer Agent Used in website-analysis Self-Audit Phase [CONFIDENCE: HIGH]

website-analysis SKILL.md §Self-Audit (line 302) specifies: "Multi-agent —
dispatch code-reviewer on SITE-ANALYSIS.md (Standard/Deep)"

This is distinct from the main analysis agent wave. It is a post-analysis
quality check, not a parallel dimension worker. The `code-reviewer` is a named
custom agent (`.claude/agents/code-reviewer`) used as a quality gate.

repo-analysis also uses `code-reviewer` as part of its standard Dimension Wave
pool (repo-analysis/REFERENCE.md §10, line 1284) — but there it is a primary
analysis agent, not a post-analysis reviewer.

---

### 10. No TeamCreate / Team Usage in Any of the 4 Skills [CONFIDENCE: HIGH]

None of the four skills (website-analysis, repo-analysis, website-synthesis,
repo-synthesis) uses a team (TeamCreate) pattern. Teams in this codebase are
used by other skills such as `audit-agent-quality` (spawns `audit-team` with
reviewer + fixer members). The 4 target skills all spawn individual agents
directly from the orchestrator without team infrastructure.

Source: Full text review of all 4 SKILL.md files and targeted grep across all 4
REFERENCE.md files — zero TeamCreate or `audit-team` references found.

---

### 11. Background vs Foreground Agent Usage — No Explicit Background Declarations [CONFIDENCE: MEDIUM]

None of the 4 skill files uses explicit `run_in_background` or background agent
terminology. All agent spawning is described as "concurrent" or "wave" but no
skill distinguishes foreground vs background agent execution in its
specification. The Skills describe the logical intent (parallel dimension
analysis) without specifying Claude Code's background agent parameter.

This is an absence finding — the skills specify what agents do, not the
technical spawn mechanism parameter.

---

### 12. Synthesis Skills Are Fully Inline (Orchestrator-Only Execution) [CONFIDENCE: HIGH]

Both `website-synthesis` and `repo-synthesis` execute all phases inline with the
orchestrator. No agent spawning is described in their SKILL.md or REFERENCE.md
files.

repo-synthesis phases: VALIDATE, WARM-UP, PHASE 1 (Load), PHASE 2 (Synthesize),
PHASE 2.5 (Verify), PHASE 3 (Self-Audit), PHASE 4 (Present), RETRO — all inline.
Source: repo-synthesis/SKILL.md lines 87–94

website-synthesis phases: VALIDATE, PHASE 1 (Load), PHASE 2 (Synthesize), PHASE
3 (Signals), PHASE 4 (Present) — all inline. Source: website-synthesis/SKILL.md
lines 124–130

Rationale for this design (inferred from skill text): synthesis skills "read,
don't re-analyze" — they consume artifact files that previous analysis runs
already produced. There is no parallel dimension work to distribute; synthesis
is a sequential interpretive process.

---

## Agent Orchestration Comparison Table

| Dimension                     | website-analysis                                | repo-analysis                                                                                                                                   | website-synthesis | repo-synthesis |
| ----------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------- |
| **Spawns agents?**            | Yes (Standard/Deep)                             | Yes (Standard/Deep)                                                                                                                             | No                | No             |
| **Agent type**                | Anonymous spawned (2-3)                         | Named custom agents (3+ named)                                                                                                                  | N/A               | N/A            |
| **Named agents used**         | `code-reviewer` (self-audit)                    | `gsd-codebase-mapper`, `security-auditor`, `code-reviewer`, `test-engineer`, `deployment-engineer`, `backend-architect`, `performance-engineer` | None              | None           |
| **Max concurrent agents**     | 4 (hard cap)                                    | 4 (hard cap)                                                                                                                                    | N/A               | N/A            |
| **Max spawned per run**       | 3 (Deep mode)                                   | 4+ via wave staging                                                                                                                             | N/A               | N/A            |
| **Parallelization**           | Wave-based (1 wave)                             | Wave-based (2 waves: Dimension + History)                                                                                                       | N/A               | N/A            |
| **Quick Scan agents**         | None (inline)                                   | None (inline)                                                                                                                                   | N/A               | N/A            |
| **Small-repo bypass**         | Conditional (no threshold)                      | <20 files → inline only                                                                                                                         | N/A               | N/A            |
| **Agent count formula**       | Standard: 0-2, Deep: 0-3 based on content/links | 3 always + conditional per detected features                                                                                                    | N/A               | N/A            |
| **Team usage**                | None                                            | None                                                                                                                                            | None              | None           |
| **Failure handling**          | 5-step protocol (MUST)                          | 5-step protocol (MUST)                                                                                                                          | N/A               | N/A            |
| **0-byte Windows workaround** | Yes (explicit)                                  | Yes (explicit)                                                                                                                                  | N/A               | N/A            |
| **Agent output contract**     | File to disk before return                      | File to disk before return                                                                                                                      | N/A               | N/A            |
| **State tracks agents?**      | Yes (spawned/completed)                         | Yes (budget: allocated/spawned/completed)                                                                                                       | No                | No             |
| **Background agents?**        | Not specified                                   | Not specified                                                                                                                                   | Not specified     | Not specified  |
| **Execution model**           | Inline + wave                                   | Inline + 2 waves                                                                                                                                | Fully inline      | Fully inline   |

---

## Sources

| #   | File Path                                       | Title                               | Type           | Trust | CRAAP           | Date       |
| --- | ----------------------------------------------- | ----------------------------------- | -------------- | ----- | --------------- | ---------- |
| 1   | `.claude/skills/website-analysis/SKILL.md`      | website-analysis SKILL.md v1.0      | project-source | HIGH  | 5/5/5/5/5 = 5.0 | 2026-04-06 |
| 2   | `.claude/skills/website-analysis/REFERENCE.md`  | website-analysis REFERENCE.md v1.0  | project-source | HIGH  | 5/5/5/5/5 = 5.0 | 2026-04-06 |
| 3   | `.claude/skills/repo-analysis/SKILL.md`         | repo-analysis SKILL.md v4.2         | project-source | HIGH  | 5/5/5/5/5 = 5.0 | 2026-04-06 |
| 4   | `.claude/skills/repo-analysis/REFERENCE.md`     | repo-analysis REFERENCE.md v3.0     | project-source | HIGH  | 5/5/5/5/5 = 5.0 | 2026-04-06 |
| 5   | `.claude/skills/website-synthesis/SKILL.md`     | website-synthesis SKILL.md v1.0     | project-source | HIGH  | 5/5/5/5/5 = 5.0 | 2026-04-06 |
| 6   | `.claude/skills/website-synthesis/REFERENCE.md` | website-synthesis REFERENCE.md v1.0 | project-source | HIGH  | 5/5/5/5/5 = 5.0 | 2026-04-06 |
| 7   | `.claude/skills/repo-synthesis/SKILL.md`        | repo-synthesis SKILL.md v1.2        | project-source | HIGH  | 5/5/5/5/5 = 5.0 | 2026-04-06 |
| 8   | `.claude/skills/repo-synthesis/REFERENCE.md`    | repo-synthesis REFERENCE.md v1.2    | project-source | HIGH  | 5/5/5/5/5 = 5.0 | 2026-04-06 |

---

## Contradictions

**Naming inconsistency — "agent_budget" vs flat counts:** repo-analysis state
schema uses `agent_budget: { allocated, spawned, completed }` while
website-analysis uses flat `agents_spawned` / `agents_completed` fields. The
MEMORY.md feedback entry `feedback_no_agent_budgets.md` states "allocation
formula is a planning floor, not a spending cap. Never track 'budget used.'"
This suggests the `agent_budget.allocated` field in repo-analysis's state schema
may be in tension with the no-budget-tracking behavioral rule, though it is
technically a state-tracking field, not an enforced cap.

**Substantial content threshold undefined:** website-analysis spawns agents "If
content is substantial" but does not define what "substantial" means
quantitatively (unlike repo-analysis's explicit 20-file threshold). This is an
internal inconsistency within website-analysis, not a cross-skill contradiction.

---

## Gaps

1. **Background vs foreground parameter:** No skill specifies whether agents are
   spawned as background or foreground. The actual Claude Code
   `run_in_background` parameter usage is not documented in any of the 4 skills.

2. **Agent spawn context/prompt:** No skill documents the specific prompt or
   context passed to spawned agents. The skills describe what agents DO
   (role/output) but not what they RECEIVE (input context, system prompt,
   working directory).

3. **Wave concurrency mechanism:** "Up to N concurrent agents" is stated as a
   rule but no skill documents HOW concurrency is implemented (parallel Task()
   calls, staggered, etc.).

4. **website-analysis "substantial content" threshold:** Never quantified.
   Leaves agent spawning decision to orchestrator judgment.

5. **History Wave in repo-analysis (Phase 3):** Described as "up to 3 concurrent
   agents" but the agents used are not named or specified in the REFERENCE.md
   §10 table (which only covers the Dimension Wave). The History Wave agent
   types are a gap.

6. **Cross-type synthesis agent pattern:** website-synthesis REFERENCE.md §5
   documents a planned "Cross-Type Synthesis" (repos + websites together) as
   PLANNED/NOT IMPLEMENTED. When that ships, it may require agent orchestration
   that currently does not exist.

---

## Serendipity

**Identical failure protocol across sibling skills:** The 5-step agent failure
protocol (including the Windows 0-byte bug workaround) is copy-equivalent
between repo-analysis and website-analysis. This is unusually precise
cross-skill consistency — suggesting a shared behavioral rule (CLAUDE.md
guardrail #15) was backported into both skills deliberately, rather than
discovered independently.

**repo-analysis uses the most named-agent diversity of any skill reviewed:** It
references 7 distinct named agents by identity (`gsd-codebase-mapper`,
`security-auditor`, `code-reviewer`, `test-engineer`, `deployment-engineer`,
`backend-architect`, `performance-engineer`), making it the most agent-rich
skill in this set. website-analysis uses 1 named agent (`code-reviewer`) and
assigns the others as anonymous roles.

**Synthesis skills contain zero orchestration complexity:** Both synthesis
skills are architecturally simpler than their analysis counterparts — they are
sequential readers of pre-built artifacts, not coordinators of parallel work.
This is a deliberate design choice explicitly stated in their Critical Rules
("Read, don't re-analyze"). This means orchestration debt is zero for synthesis.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All findings are directly sourced from filesystem artifacts (highest trust tier
for codebase profile). No external sources or training data were used.
