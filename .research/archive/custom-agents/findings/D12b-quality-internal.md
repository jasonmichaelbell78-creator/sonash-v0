# Findings: SQ12 (Part B) — Current Agent Quality Validation Processes and Recommended Improvements

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ12-internal

---

## Key Findings

### 1. audit-agent-quality Skill Exists and Has Run Once [CONFIDENCE: HIGH]

The skill `.claude/skills/audit-agent-quality/SKILL.md` (v1.2, 2026-03-17) is a
fully specified 3-stage hybrid audit: automated structural analysis (Stage 1),
interactive behavioral review via `audit-team` (Stage 2), and
convergence-verified synthesis (Stage 3). A Stage 4 was added for built-in agent
optimization.

Evidence of one production run:
`docs/audits/single-session/agent-quality/audit-2026-03-17/` contains all output
artifacts. The history JSONL records:

```json
{
  "date": "2026-03-17",
  "agents_total": 36,
  "agents_audited": 36,
  "ecosystem_grade": "F",
  "mean_score": 51,
  "post_improvement_mean": 54,
  "structural_findings": 59,
  "behavioral_findings": 36,
  "decisions": { "improve": 6, "skip": 18, "flag_upstream": 12 },
  "top_gap": "code-patterns",
  "cl_corrections": 4,
  "categories": 13
}
```

The skill has not been re-run since March 17 (12 days ago). No state file for a
current run exists (`.claude/state/task-audit-agent-quality.state.json` not
found).

The invocations.jsonl file records one audit-agent-quality invocation on
2026-03-17 (session #226). No subsequent invocations recorded.

Sources: SKILL.md [1], REFERENCE.md [2], history JSONL [3], invocations.jsonl
[4], audit report [5]

---

### 2. The Skill Evaluates 13 Categories with Weighted Scoring [CONFIDENCE: HIGH]

The REFERENCE.md defines 13 behavioral/structural categories:

| #   | Category                   | Weight |
| --- | -------------------------- | ------ |
| 1   | Prompt Quality             | 15%    |
| 2   | Model Appropriateness      | 10%    |
| 3   | Tool List Correctness      | 10%    |
| 4   | Return Protocol Compliance | 5%     |
| 5   | Redundancy                 | 10%    |
| 6   | External Benchmark         | 5%     |
| 7   | Usage Frequency            | 5%     |
| 8   | Integration Surface        | 10%    |
| 9   | Frontmatter Completeness   | 10%    |
| 10  | Attention Management       | 10%    |
| 11  | Agent Teams Readiness      | 10%    |
| 12  | Reference Code Patterns    | 5%     |
| 13  | Script Automation          | 5%     |

Scores are 0-10 per category, weighted composite produces 0-100 per agent.
Ecosystem grade is mean of all composites mapped A-F.

Note: SKILL.md header says "13 categories" but the routing table mentions
"11-category hybrid audit" — a version artifact; 13 is confirmed current by
REFERENCE.md.

TDMS integration is defined: findings flow through `validate-schema.js`,
`intake-audit.js`, `generate-views.js`, and `generate-metrics.js`.

Sources: REFERENCE.md [2], SKILL.md [1]

---

### 3. check-agent-compliance.js Validates Agent INVOCATION, Not Agent QUALITY [CONFIDENCE: HIGH]

This is the most important scope distinction in the quality system. The two
components serve completely different purposes:

**check-agent-compliance.js** (`scripts/check-agent-compliance.js`, 197 lines):

- Checks whether required agents were INVOKED during a session before committing
- Triggered at pre-commit via `pre-commit-agent-compliance.js` hook
- Decision #27 (Session #226): runs in strict mode (exit 2 = blocking)
- Checks: `code-reviewer` for `.ts/.tsx/.js/.jsx` files, `security-auditor` for
  auth/firestore files
- Reads `.claude/hooks/.session-agents.json` to verify invocation history
- Does NOT inspect agent frontmatter, prompt quality, or schema validity

**audit-agent-quality** skill:

- Evaluates structural and behavioral quality of agent definitions
- Manual invocation only (`/audit-agent-quality`)
- Produces scored report, JSONL for TDMS

There is no automated frontmatter schema validation running at any time. The
compliance checker's test file (`tests/scripts/check-agent-compliance.test.ts`)
re-implements trigger-pattern detection for agent invocations — it does not test
frontmatter parsing.

Sources: check-agent-compliance.js [6], pre-commit-agent-compliance.js [7],
compliance test [8], settings.json [9]

---

### 4. Agent Invocation Tracking Infrastructure Is Present But Incomplete [CONFIDENCE: HIGH]

Two tracking layers exist:

**Layer 1 — Session-scoped** (`.claude/hooks/.session-agents.json`):

- Written by `track-agent-invocation.js` via PostToolUse hook on Agent/Task tool
- Tracks: agent name, description (sanitized), timestamp
- Scoped to current session via `sessionId` comparison
- Consumed by: `pre-commit-agent-compliance.js` for session compliance check
- Rotates: capped at 200 entries per session

**Layer 2 — Persistent** (`.claude/state/agent-invocations.jsonl`):

- Appended by same hook, survives across sessions
- Tracks: agent, description, sessionId, timestamp
- Rotates at 32KB keeping last 100 entries
- Currently has 135 entries spanning 2026-03-25 to 2026-03-29

**Layer 3 — Skill/audit tracking** (`data/ecosystem-v2/invocations.jsonl`):

- Separate JSONL, 32 records, covers skills AND some agents (code-reviewer since
  2026-03-17)
- Schema: `{skill, type:"skill"|"agent", agent_name, model, context}`
- Consumed by: `/alerts`, Stage 1C redundancy scanner (Category 7 — Usage
  Frequency)

**Gaps identified:**

- `data/ecosystem-v2/invocations.jsonl` is manually populated — most agents have
  zero records despite being invoked (agent-invocations.jsonl shows
  deep-research- searcher used 50+ times in current session, but ecosystem
  invocations file only has 2 agent entries total)
- `agent-invocations.jsonl` does not record model used, success/failure,
  duration, or output quality — no performance data
- No cross-session frequency rollup exists; Category 7 (Usage Frequency) scoring
  in the audit skill must rely on incomplete data

The March 2026 audit report explicitly noted: "Invocations file tracks skills
only, not agents" [5] — this gap has been partially closed by the new
`agent-invocations.jsonl` file, but ecosystem-level data is still not
auto-populated.

Sources: track-agent-invocation.js [10], .session-agents.json [11],
agent-invocations.jsonl [12], invocations.jsonl [4], audit report [5]

---

### 5. Gap Analysis: What's Checked vs. What Should Be Checked [CONFIDENCE: HIGH]

Based on D1 findings (17 frontmatter fields documented by official docs), the
current compliance checker validates 0 of 17 fields. The audit skill covers them
qualitatively in Stage 1 but only runs manually.

**Currently automated (pre-commit hook):**

- Was code-reviewer invoked for code changes? (binary yes/no)
- Was security-auditor invoked for auth/firestore changes? (binary yes/no)

**Currently manual (audit skill only, last run 12 days ago):**

- Frontmatter field presence (name, description, model, tools)
- Model appropriateness for complexity tier
- Tool list vs. actual prompt references
- Redundancy/overlap detection
- Usage frequency (Category 7)
- Prompt quality across 9 other categories

**Not checked anywhere:**

- Prompt size bounds (D1 found 500-2000 token sweet spot; fullstack-developer is
  1281 lines, security-engineer is 985 lines — no upper bound enforcement)
- Schema validity (no Zod schema exists for frontmatter fields — Decision #22
  noted as "not implemented")
- `color` field usage (audit found non-standard field in dependency-manager,
  documentation-expert — no automated removal)
- `effort` field validity (new field in 17-field schema, not in 13-field audit
  schema)
- `initialPrompt` field validation
- Cross-locale consistency (local vs global agent duplication — GSD agents in
  both `.claude/agents/global/` and referenced elsewhere)
- Agent version history (no versioning system exists)
- Golden test cases (no baseline test corpus for any agent)

**Status of D1 gap (model field for GSD agents):** RESOLVED since March 17.
Verification shows all 13 global agents now have `model: sonnet`. The audit
report flagged these as "upstream" issues — they were subsequently fixed. This
is the one major gap from the last audit that was closed.

Sources: check-agent-compliance.js [6], D1b findings [13], audit report [5],
REFERENCE.md [2], verified frontmatter scan [14]

---

### 6. Post-Improvement Agent Scores Remain at "F" Grade (Mean 54/100) [CONFIDENCE: HIGH]

Despite 6 improvements, the March 2026 audit left the ecosystem at grade F (mean
54). The report identified specific paths to improvement:

- 18 agents were skipped (not necessarily low-quality, but unreviewed since
  audit)
- 12 GSD agents were "flag-upstream" — now have model fields but other gaps
  remain
- Priority agents (code-reviewer, security-auditor, frontend-developer) saw
  +24-25 point gains from adding code patterns and script workflows

The ecosystem has grown since March 17. Agent count at time of writing:

- Local agents: 26 (.claude/agents/\*.md, excluding global/)
- Global agents: 13 (.claude/agents/global/)
- Total: 39 agents (up from 36 at audit)

Three new agents added post-audit (deploy-safeguard-related, research searcher/
synthesizer variants) have not been audited.

Sources: audit report [5], directory listing [15]

---

### 7. No Golden Test Cases Exist for Any Agent [CONFIDENCE: HIGH]

The audit skill defines a behavioral testing protocol in Stage 2.5: "invoke the
improved agent on the test task, evaluate output against expected quality."

The March 2026 audit executed this for 6 agents (behavioral tests documented in
report), but no persistent test fixtures or expected output records were
retained. Each test was ad-hoc during the audit session.

There is no directory structure for agent test cases (e.g., `tests/agents/`) and
no test runner infrastructure for agent quality regression testing.

The compliance test file (`tests/scripts/check-agent-compliance.test.ts`) only
tests the invocation-tracking logic, not agent output quality.

Sources: audit report [5], Glob search [16]

---

### 8. TDMS Integration Is Defined But Partially Wired [CONFIDENCE: MEDIUM]

The audit skill post-audit flow calls:

```
node scripts/debt/validate-schema.js ...
node scripts/debt/intake-audit.js ...
node scripts/debt/generate-views.js
node scripts/debt/generate-metrics.js
```

The March 2026 audit produced `all-findings-deduped.jsonl` but no evidence
exists that the TDMS intake pipeline ran after the audit. The state file for the
audit was not found (`.claude/state/task-audit-agent-quality.state.json`),
suggesting session state was cleared after the audit completed.

The `/alerts` integration is defined as SHOULD (not MUST), meaning alert
surfacing of agent quality data is optional. It is unclear whether the history
JSONL is actively consumed by `/alerts`.

Sources: SKILL.md [1], audit directory listing [17]

---

## Recommendations

### R1. Add Lightweight Automated Frontmatter Validation [HIGH PRIORITY]

Extend `check-agent-compliance.js` (or create a separate
`validate-agent-schema.js`) to run at pre-commit when agent files are staged.
Minimum checks:

1. `name` field present and matches filename (kebab-case)
2. `description` field present and non-empty
3. `model` field present (not silently inherited)
4. `tools` field present (least-privilege enforcement)
5. No unknown frontmatter fields (flag `color` as non-standard)

This would catch the class of issues that required a manual Stage 1A scan. These
are deterministic O(1) checks requiring no LLM.

Decision #22 (Zod schema for frontmatter) should be implemented here. The
17-field schema from D1b provides the exact spec. Required fields: `name`,
`description`. Optional with validation: `model` (enum), `permissionMode`
(enum), `maxTurns` (positive integer), `tools` (array of valid tool names).

---

### R2. Add Prompt Size Bounds Check [MEDIUM PRIORITY]

D1 research found a 500-2000 token sweet spot for effective agent prompts.
Current extremes: `fullstack-developer` (1281 lines), `security-engineer` (985
lines), `test-engineer` (1051 lines), `gsd-planner` (1477 lines).

Add a soft warning (not blocking) when agent files exceed 2000 lines or fall
below 30 lines (likely a stub). This surfaces quality signals without creating a
gate for large legitimate agents.

---

### R3. Auto-Populate ecosystem invocations.jsonl from agent-invocations.jsonl [HIGH PRIORITY]

The `data/ecosystem-v2/invocations.jsonl` file is manually written and covers
only 2 agent invocations total. The `agent-invocations.jsonl` state file
captures agent-level data automatically but with minimal fields.

Recommendation: Modify `track-agent-invocation.js` to also append to
`data/ecosystem-v2/invocations.jsonl` with the standard schema (`type:"agent"`,
`agent_name`, `model` if available, `success`, `context`). This would make
Category 7 (Usage Frequency) scoring in future audits data-driven rather than
inference-based.

---

### R4. Add Audit Cadence Trigger [MEDIUM PRIORITY]

The audit skill specifies: "After 50 commits touching agent files." No
automation enforces this. The last audit was 12 days ago; 3 new agents have been
added.

Options:

- Add a commit-tracker hook condition that counts `.claude/agents/*.md` changes
  and flags when threshold reached
- Add a CLAUDE.md condition check: "if >50 commits since last
  audit-agent-quality, surface recommendation"
- Wire into `/alerts` using the history JSONL (current date vs last audit date)

The lowest-friction option is wiring the history JSONL into `/alerts` — already
defined as SHOULD in the skill, just not implemented.

---

### R5. Create Persistent Golden Test Fixtures for Priority Agents [LOW PRIORITY]

For the 7 CLAUDE.md-mandated agents (code-reviewer, security-auditor,
frontend-developer, documentation-expert, test-engineer, fullstack-developer,
exploration agents), create:

1. Input fixtures: known-bad code files with planted issues
2. Expected findings: structured checklist of what the agent MUST catch
3. Optional: minimum quality threshold score

Store in `tests/agents/<agent-name>/`. Run as part of Stage 2.5 in future audits
rather than ad-hoc behavioral tests. This makes quality regression detectable.

---

### R6. Connect Quality Grades to TDMS Workflow [LOW PRIORITY]

The audit skill defines TDMS integration (`intake-audit.js`,
`generate-views.js`) but evidence suggests this pipeline did not run after the
March 2026 audit. Findings with severity S2/S3 from Stage 1 should appear as
MASTER_DEBT entries.

Ensure post-audit TDMS commands are run as a mandatory step (currently listed in
Post-Audit section but not in a MUST-annotated step). Consider adding to the
artifact contract table.

---

### R7. Resolve Agent Versioning Gap [LOW PRIORITY]

No agent has a version field or version history. When `code-reviewer` was
improved from 38 to 191 lines in March 2026, there is no record of what changed
or what the previous state was.

Options:

- Git blame is sufficient for file-level history (already available)
- Add optional `version` comment at top of agent body (not frontmatter — not a
  standard field)
- Track improvement decisions in the audit state file (already partially done)

Git history is likely adequate; this is low-priority unless the team finds
itself re-litigating past decisions.

---

## Sources

| #   | Path/URL                                                                            | Title                                | Type             | Trust | CRAAP     | Date       |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------ | ---------------- | ----- | --------- | ---------- |
| 1   | `.claude/skills/audit-agent-quality/SKILL.md`                                       | Audit Agent Quality Skill            | project-file     | HIGH  | 5/5/5/5/5 | 2026-03-17 |
| 2   | `.claude/skills/audit-agent-quality/REFERENCE.md`                                   | Audit Agent Quality Reference        | project-file     | HIGH  | 5/5/5/5/5 | 2026-03-17 |
| 3   | `.claude/state/audit-agent-quality-history.jsonl`                                   | Audit history (1 record)             | state-file       | HIGH  | 5/5/5/5/5 | 2026-03-17 |
| 4   | `data/ecosystem-v2/invocations.jsonl`                                               | Ecosystem invocations (32 records)   | state-file       | HIGH  | 4/5/5/5/5 | 2026-03-29 |
| 5   | `docs/audits/single-session/agent-quality/audit-2026-03-17/AGENT_QUALITY_REPORT.md` | Agent Quality Report                 | audit-artifact   | HIGH  | 5/5/5/5/5 | 2026-03-17 |
| 6   | `scripts/check-agent-compliance.js`                                                 | Agent compliance checker             | project-file     | HIGH  | 5/5/5/5/5 | 2026-03-17 |
| 7   | `.claude/hooks/pre-commit-agent-compliance.js`                                      | Pre-commit compliance hook           | project-file     | HIGH  | 5/5/5/5/5 | 2026-03-17 |
| 8   | `tests/scripts/check-agent-compliance.test.ts`                                      | Compliance test suite                | project-file     | HIGH  | 5/5/5/5/5 | 2026-03-17 |
| 9   | `.claude/settings.json`                                                             | Hook configuration                   | project-file     | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 10  | `.claude/hooks/track-agent-invocation.js`                                           | Agent invocation tracker             | project-file     | HIGH  | 5/5/5/5/5 | 2026-03-17 |
| 11  | `.claude/hooks/.session-agents.json`                                                | Current session agents state         | state-file       | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 12  | `.claude/state/agent-invocations.jsonl`                                             | Persistent invocations (135 entries) | state-file       | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 13  | `.research/custom-agents/findings/D1b-agent-format-docs.md`                         | Official 17-field frontmatter schema | research-finding | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 14  | Direct frontmatter scan via Bash                                                    | GSD model field verification         | filesystem       | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 15  | `ls .claude/agents/`                                                                | Agent directory listing              | filesystem       | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 16  | Glob `tests/agents/`                                                                | Golden test search                   | filesystem       | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 17  | `ls docs/audits/single-session/agent-quality/audit-2026-03-17/`                     | Audit artifact listing               | filesystem       | HIGH  | 5/5/5/5/5 | 2026-03-29 |

---

## Contradictions

**Audit skill header vs REFERENCE.md category count:** SKILL.md header says "11
evaluation categories" (routing table) but the body says 13 categories, and
REFERENCE.md defines 13. The routing table is a v1.1 artifact not updated when
v1.2 added Categories 12-13. Resolved: 13 is current.

**GSD model gap — resolved vs open:** The March 2026 audit report marked 12 GSD
agents as missing model fields and flagged them "upstream." Current filesystem
scan shows all 13 global agents now have `model: sonnet`. The gap was closed
post-audit, but the audit history JSONL still shows this as
`top_gap:"code-patterns"` which is accurate (code-patterns was the #1 gap by
volume, model-fields was #2 gap by severity).

---

## Gaps

1. **Why the audit hasn't re-run in 12 days:** The skill specifies "after 50
   commits touching agent files" as a trigger. No data exists on how many
   agent-touching commits have occurred since March 17. Cannot assess whether
   the trigger threshold has been reached.

2. **TDMS pipeline execution verification:** No evidence found that
   `intake-audit.js` ran after the March 2026 audit. MASTER_DEBT entries from
   the audit's 59 structural findings cannot be confirmed to exist.

3. **Audit state file missing:**
   `.claude/state/task-audit-agent-quality.state.json` not found. Cannot resume
   a prior audit or check prior score baselines.

4. **Post-audit regression:** The 6 improved agents have not been re-scored
   since March 17. The 26-line `fullstack-developer` growth (now 1281 lines)
   adds risk of score regression in categories 9-10 (frontmatter completeness,
   attention management).

5. **3 new agents unaudited:** Agents added after March 17 have no quality
   scores. Which 3 are new is not confirmed (agent count went from 36 to 39 —
   some may be renames or splits).

---

## Serendipity

**The compliance test is testing the wrong thing.**
`tests/scripts/check-agent- compliance.test.ts` implements AGENT_TRIGGERS
pattern matching (keyword → required agent mapping), but the actual
`check-agent-compliance.js` does NOT implement this pattern-matching logic. The
real script detects staged file types and checks session invocation history. The
test is testing a reimplemented version that diverges from production behavior.
This is a test correctness gap that could give false confidence in the
compliance system.

**track-agent-invocation.js records `general-purpose` as an agent name.**
Multiple entries in agent-invocations.jsonl show `"agent":"general-purpose"` —
these are unnamed Task tool invocations where no custom agent file was
specified. The compliance checker and audit skill treat this as a valid agent
name, but it provides no quality signal. Filtering these out of Category 7
scoring would give a more accurate usage picture.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are directly verified against filesystem artifacts (agent files,
hook scripts, audit reports, JSONL state files). No web sources required; this
is a pure internal codebase analysis.
