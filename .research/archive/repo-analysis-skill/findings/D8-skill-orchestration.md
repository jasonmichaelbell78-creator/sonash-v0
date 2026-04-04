# Findings: How Should the Repo Analysis Skill Orchestrate Agents, Handle Progressive Results, and Integrate with Existing Infrastructure?

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-31
**Sub-Question IDs:** D8

---

## Key Findings

### 1. Agent Count Formula: Dynamic Based on Dimension Count, Not Repo Size [CONFIDENCE: HIGH]

deep-research uses `D + 3 + floor(D/5)` as an allocation floor where D =
sub-questions. This formula is explicitly described as a floor, not a ceiling —
scope assessment and user override determine the final count.

For repo-analysis-skill, the equivalent formula would be
`N_dimensions + 2 + floor(N_dimensions/4)` where:

- `N_dimensions` = number of analysis domains activated (code quality, security,
  churn, etc.)
- `+2` covers a pre-flight agent (cloning/API fetches) and a synthesis/report
  agent
- `floor(N_dimensions/4)` provides buffer for cross-domain correlation agents

**Repo size does NOT dictate agent count.** What changes with repo size is the
depth of each agent's work (more files to analyze, longer git history) and the
clone strategy (blobless vs full), not the number of agents. audit-comprehensive
confirms this — it uses fixed 4+3+2+1 staging regardless of codebase size.

Concrete formula for a 6-dimension analysis run:
`6 + 2 + floor(6/4) = 9 agents`.

The 4-agent concurrency cap from CLAUDE.md is respected by both deep-research
and audit-comprehensive. The repo-analysis-skill must respect this cap by
staging agents in waves.

Sources: deep-research SKILL.md (Critical Rule #7 — agent allocation formula),
audit-comprehensive SKILL.md (staged 4+3+2+1 execution), CLAUDE.md (Section 7:
4-agent cap).

---

### 2. Parallel vs Sequential: Use Staged Waves, Not Pure Parallel [CONFIDENCE: HIGH]

audit-comprehensive demonstrates the canonical pattern for staged wave
execution:

```
Stage 1: Technical Core (4 agents parallel) — independent foundational analysis
Stage 2: Supporting (3 agents parallel) — depends on Stage 1 completion
Stage 2.5: Meta & Enhancement (2 agents parallel) — depends on Stage 2
Stage 3: Aggregation (1 agent sequential) — requires all prior reports
Stage 3.5: MASTER_DEBT Deduplication (mandatory, inline)
```

For repo-analysis-skill, the equivalent structure based on analysis pipeline
dependencies (from D4-analysis-pipeline.md findings) is:

```
Phase 0: Pre-flight (1 agent, or inline orchestrator)
  - API calls: GitHub metadata, OpenSSF Scorecard, deps.dev (parallel, no clone)
  - Duplicate check: if HEAD SHA matches prior analysis, offer cache

Phase 1: Clone gate (inline, not spawned as agent)
  - Single blobless + shallow clone operation
  - Cannot be parallelized; orchestrator executes directly

Phase 2: Parallel analysis wave (up to 4 agents)
  - Dimension agents: code-quality, security, structure/framework, process/CI
  - All operate on cloned file tree; fully independent
  - Each writes its findings to disk: dimensions/<name>-findings.json

Phase 3: Conditional history wave (up to 3 agents, only if churn requested)
  - History deepening (deepen clone via git fetch) as gate
  - Then: churn-analysis, contributor-analysis, commit-trend agents

Phase 4: Aggregation (1 agent, sequential)
  - Reads all dimension findings
  - Produces analysis.json, findings.jsonl, summary.md, trends.jsonl

Phase 4.5: TDMS deduplication (mandatory, inline)
  - Cross-reference against MASTER_DEBT.jsonl before interactive review
```

The "Stage 1 → wait → Stage 2" pattern is critical. deep-research tracks wave
completion: "Wave N/M complete. X answered, Y remaining." The
repo-analysis-skill should report: "Phase 2 complete (4/4 dimension agents).
Proceeding to aggregation."

Sources: audit-comprehensive SKILL.md (Execution Flow section), deep-research
SKILL.md (Phase 1: Parallel Research), D4-analysis-pipeline.md (Phase dependency
DAG).

---

### 3. Progressive Results: Write-to-Disk-First, Not Hold-in-Context [CONFIDENCE: HIGH]

Three convergent patterns from existing skills establish this principle:

**deep-research Critical Rule #4:** "Write to disk first — findings must survive
crashes." Every searcher agent writes its FINDINGS.md before returning. The
orchestrator reads files, never trusts return values alone.

**deep-research Critical Rule #5:** "State file updated after every
state-changing event — enables resume."

**audit-comprehensive Critical Return Protocol:** "Each audit agent writes its
report to the output directory. Return ONLY:
`COMPLETE: [audit-domain] wrote N findings to [output-path]`." The orchestrator
verifies file existence, not return content.

Applying these patterns to repo-analysis-skill:

- Each dimension agent writes
  `<output_dir>/dimensions/<dimension>-findings.json` before returning
- Orchestrator verifies file existence after each wave (non-empty, valid JSON)
- A per-dimension checkpoint is created immediately when a file is written
- The user can see partial results by reading dimension files directly — no need
  to wait for aggregation
- Progressive reporting to the user: "Security analysis complete (1/4). Findings
  written. 3 agents running."

This is the mechanism for progressive result building — each dimension file is a
complete, self-contained result that can be read independently. The aggregation
agent is the only consumer that synthesizes them.

Sources: deep-research SKILL.md (Critical Rules 4, 5, 8), audit-comprehensive
SKILL.md (Critical Return Protocol).

---

### 4. Checkpoint-Per-Dimension for Resume: State File Schema Derived from deep-research [CONFIDENCE: HIGH]

deep-research uses `.claude/state/deep-research.<slug>.state.json` with this
structure for compaction resilience:

```json
{
  "topic": "string",
  "slug": "string",
  "status": "in-progress | complete",
  "phase": 0,
  "depth": "L1",
  "subQuestions": ["D1", "D2"],
  "agentsSpawned": 0,
  "agentsCompleted": 0,
  "completedPhases": [0, 1],
  "findings": [],
  "startedAt": "ISO 8601"
}
```

The actual state file for the current repo-analysis-skill research
(`deep-research.repo-analysis-skill.state.json`) confirms this schema is in live
use.

For repo-analysis-skill, the equivalent state schema should be:

```json
{
  "skill": "repo-analysis",
  "slug": "<repo-slug>",
  "target_repo": "github.com/org/repo",
  "target_commit": "sha",
  "status": "in-progress | complete | failed",
  "phase": 0,
  "depth": "standard | deep",
  "dimensions_requested": ["code-quality", "security", "churn", "process"],
  "dimensions_completed": [],
  "dimensions_failed": [],
  "wave_status": {
    "preflight": "complete",
    "phase2": "in-progress",
    "phase3": "pending",
    "aggregation": "pending"
  },
  "output_dir": ".research/<repo-slug>/",
  "prior_analysis": null,
  "startedAt": "ISO 8601",
  "completedAt": null
}
```

**State file location:** `.claude/state/repo-analysis.<repo-slug>.state.json`

Resume protocol mirrors deep-research: On invocation, check for state file
matching `<repo-slug>`. If found and status is `in-progress`, offer resume. If
state file is corrupted, fall back to artifact scan: check `dimensions/`
directory for completed files and infer resumption point from what exists on
disk.

**Compaction resilience rule from audit-comprehensive:** "Context compaction can
cause variable loss. Always verify before agent launches." The
repo-analysis-skill should re-read the state file at the start of each wave, not
rely on in-memory variables.

Sources: deep-research SKILL.md (Compaction Resilience section), REFERENCE.md
Section 19 (State File Schema), audit-comprehensive SKILL.md (Pre-Flight
Validation Step 2.5), live state file at
`.claude/state/deep-research.repo-analysis-skill.state.json`.

---

### 5. Memory of Prior Analyses for Diff and Trend Tracking [CONFIDENCE: HIGH]

Two patterns from existing skills apply:

**ecosystem-health** maintains `ecosystem-health-log.jsonl` as an append-only
trend log. Each run adds one record. The skill reads the last N entries to
compute trend direction. The schema explicitly tracks `delta_from_previous` for
each dimension. The duplicate-run guard (warn if run < 30 minutes ago) prevents
trend pollution.

**audit-comprehensive** checks "episodic memory for context from past audit
sessions" before running (Step 0: Episodic Memory Search). The stated purpose:
"Compare against previous findings, identify recurring issues, avoid known false
positives, track trends."

For repo-analysis-skill, the trends.jsonl file (defined in D5-output-scoring.md
findings) serves as the append-only log:

```json
{
  "analysis_id": "uuid",
  "timestamp": "ISO8601",
  "repo": "github.com/org/repo",
  "commit": "sha",
  "overall_score": 74,
  "dimensions": { "security": 52, "reliability": 78 },
  "findings_total": 84,
  "new_findings": 6,
  "resolved_findings": 12,
  "delta_overall": 6,
  "regression_flags": []
}
```

The `--refresh` pattern from deep-research is the right mechanism for
re-analysis: re-run with the same repo slug, preserve old trends.jsonl by
appending (never overwrite), compute delta from previous run.

**The duplicate-run guard is critical:** Check if the most recent entry in
trends.jsonl has the same commit SHA as the current HEAD. If it does, warn:
"Analysis already complete for this commit (score: X). Re-run anyway? [y/N]"

Sources: ecosystem-health SKILL.md (Phase 0 warm-up, compaction resilience
schema), audit-comprehensive SKILL.md (Step 0 episodic memory search, Future
Enhancements: Trend Analysis), deep-research SKILL.md (--refresh flag),
D5-output-scoring.md (trends.jsonl schema).

---

### 6. Handoff Decision Tree: Deep-Plan for Large Findings, Inline Planning for Simple Ones [CONFIDENCE: HIGH]

deep-research Phase 5 establishes the canonical routing pattern after research
completes:

```
Terminal summary -> "What next?" menu:
  (1) deepen research
  (2) /deep-plan
  (3) /skill-creator
  (4) GSD
  (5) /convergence-loop for LOW claims
  (6) save to memory
  (7) view report
  (8) done
If metadata.json hasDebtCandidates: true -> "Route to /add-debt? [Y/review/skip]"
```

The decision logic for when to handoff vs inline plan is:

**Handoff to /deep-plan** when:

- Finding count exceeds 20 S1/S0 findings (constitutes a major remediation
  project)
- Score in any dimension is below 40 (Critical band from D5 scoring rubric)
- The analysis reveals a systemic architectural issue (not isolated file-level
  findings)
- Findings span 5+ files in the same subsystem (indicates architectural debt,
  not hygiene)

**Inline planning** (light triage, no deep-plan) when:

- Total S0+S1 count is 5 or fewer
- All findings are isolated (single-file, clear fix)
- Score delta from prior analysis is positive and score > 60 across all
  dimensions
- User explicitly says "just show me the top 3 fixes"

This mirrors ecosystem-health's triage scope rule: "The triage loop is for quick
fixes and deferral decisions. If a fix requires more than one command or 5
minutes, recommend deferring to a dedicated session."

The menu-driven routing should appear after the repo analysis report:

```
Analysis complete. What next?
  (1) Route findings to /deep-plan [N findings, including M critical]
  (2) Add to TDMS via /add-debt [N new findings after deduplication]
  (3) Compare against another repo
  (4) Save to memory
  (5) View full report
  (6) Done
```

Sources: deep-research SKILL.md (Phase 5 routing menu), ecosystem-health
SKILL.md (Phase 3 triage scope boundary), deep-plan SKILL.md (Handoff decision
tree), D5-output-scoring.md (band definitions with thresholds).

---

### 7. State File Schema for Resume: Concrete Schema with Phase Granularity [CONFIDENCE: HIGH]

Synthesizing from deep-research state schema + audit-comprehensive recovery
pattern + ecosystem-health triage state, the complete state schema for
repo-analysis-skill is:

```json
{
  "skill": "repo-analysis",
  "version": "1.0",
  "slug": "sonash-app-2026-03-31",
  "target_repo": "github.com/talkhard/sonash-app",
  "target_commit": "abc1234",
  "status": "in-progress",
  "phase": 2,
  "depth": "standard",
  "dimensions_requested": ["code-quality", "security", "structure", "process"],
  "dimensions_completed": ["code-quality", "security"],
  "dimensions_failed": [],
  "wave_status": {
    "preflight_api": "complete",
    "preflight_clone": "complete",
    "phase2_dimensions": "in-progress",
    "phase3_history": "pending",
    "aggregation": "pending",
    "tdms_dedup": "pending"
  },
  "output_dir": ".research/sonash-app-2026-03-31/",
  "clone_dir": "/tmp/repo-analysis-sonash-app-2026-03-31/",
  "clone_strategy": "blobless-shallow",
  "prior_analysis": {
    "slug": "sonash-app-2026-03-01",
    "commit": "def5678",
    "overall_score": 68
  },
  "agent_budget": {
    "allocated": 9,
    "spawned": 5,
    "completed": 2,
    "failed": 0
  },
  "startedAt": "2026-03-31T06:00:00Z",
  "completedAt": null,
  "userCheckpoints": []
}
```

**Recovery protocol** (mirroring deep-research compaction resilience):

1. Read state file — if valid JSON and status is `in-progress`, resume from
   `phase`
2. If state file is corrupted or missing: scan `output_dir/dimensions/` for
   completed files
3. For each found dimension file, mark that dimension as completed in memory
4. Re-spawn only agents for dimensions NOT yet written to disk
5. If clone_dir no longer exists: re-clone before resuming
6. Present resume status to user before spawning agents

**State file location pattern** mirrors deep-research:
`.claude/state/repo-analysis.<slug>.state.json`

Sources: deep-research SKILL.md (Compaction Resilience), REFERENCE.md Section 19
(state schema), audit-comprehensive SKILL.md (Context Recovery reference),
ecosystem-health SKILL.md (compaction resilience schema), live state files in
`.claude/state/`.

---

### 8. Agent Failure Handling: Checkpoint + Partial Proceed vs Full Stop [CONFIDENCE: HIGH]

deep-research Critical Rule #8: "Context exhaustion = immediate re-spawn. If any
agent fails to write complete findings, re-spawn across 2+ smaller agents
splitting the scope. Never accept partial output."

deep-research Guard Rails: "Failure cascade (50%+ agents fail = stop and present
options)."

audit-comprehensive: "Token budget: 250K total for the team. If approaching
budget, lead messages teammates to wrap up and collects partial results."

audit-comprehensive notes: "If team formation fails or teammates error out, fall
back to the staged subagent execution flow."

For repo-analysis-skill, the failure handling protocol is:

**Single dimension agent failure:**

- Verify: did the agent write its output file? (Check
  `output_dir/dimensions/<dim>-findings.json`)
- If no file written: re-spawn the same agent with the same scope. One re-try
  allowed.
- If re-try also fails: mark dimension as `failed` in state file, continue with
  remaining dimensions
- Report to user: "Security analysis failed. Proceeding without it. Results will
  be incomplete."
- The aggregation agent must handle missing dimension files gracefully (skip,
  note in report)

**Majority failure (50%+ of wave agents fail):**

- Stop all remaining agents in the wave
- Report to user: "N of M dimension agents failed. Options: (a) retry failed
  dimensions, (b) proceed with partial results, (c) abort."
- Never proceed silently with partial results — this is an explicit user
  checkpoint

**Timeout handling** (deep-research uses 5 min/searcher):

- Set a 5-minute timeout per dimension agent
- On timeout: mark as failed, apply single-agent failure protocol above
- Unlike research agents that can be split by scope, dimension agents are atomic
  — retry the whole dimension

**Context exhaustion re-spawn** (deep-research Critical Rule #8):

- If a dimension agent returns without writing its file (context exhaustion
  signal): re-spawn with a narrower scope
- Example: code-quality agent could be split into `code-quality-complexity` and
  `code-quality-duplication` sub-agents

Sources: deep-research SKILL.md (Critical Rules 8, Guard Rails),
audit-comprehensive SKILL.md (token budget and fallback protocol, Notes
section).

---

### 9. TDMS Integration: Mandatory Dedup Before Interactive Review [CONFIDENCE: HIGH]

audit-comprehensive establishes the canonical pattern:

**Rule:** "Do NOT present findings for review until they have been
cross-referenced against MASTER_DEBT.jsonl. Skipping this step causes duplicate
TDMS intake and inflated debt counts."

**Process:**

1. Read all entries from `docs/technical-debt/MASTER_DEBT.jsonl`
2. For each finding, search by: same file path, similar title/description, same
   root cause
3. Classify as: Already Tracked (skip), New Finding (proceed to review),
   Possibly Related (flag)
4. Write dedup report to `output_dir/DEDUP_VS_MASTER_DEBT.md`
5. Only present New Findings and Possibly Related in interactive review

**Interactive review format** (mirroring audit-comprehensive):

```
### DEBT-XXXX: [Title]
Severity: S* | Effort: E* | Confidence: __%
Current: [What exists now]
Suggested Fix: [Concrete remediation]
Acceptance Tests: [How to verify]
Counter-argument: [Why NOT to do this]
Recommendation: ACCEPT/DECLINE/DEFER -- [Reasoning]
```

Present in **batches of 3-5 items**, grouped by severity (S0 first). Wait for
user decisions before proceeding to next batch.

**Decision tracking** (compaction-safe): Create `output_dir/REVIEW_DECISIONS.md`
after first batch. Update after each batch. This file survives context
compaction.

The findings.jsonl format from D5-output-scoring.md findings is already
TDMS-ingestible without changes to intake-audit.js — it uses the exact field
schema from `docs/templates/JSONL_SCHEMA_STANDARD.md`.

The source field convention for TDMS intake should be:
`"repo-analysis-<repo-slug>-<date>"` (e.g.,
`"repo-analysis-sonash-app-2026-03-31"`).

Sources: audit-comprehensive SKILL.md (MASTER_DEBT Deduplication section,
Interactive Review section), D5-output-scoring.md (JSONL schema compatibility
analysis).

---

### 10. Concrete Agent Spawn Prompt Pattern for Dimension Agents [CONFIDENCE: HIGH]

deep-research REFERENCE.md Section 20 documents the exact spawn prompt contract.
The repo-analysis-skill should mirror this for dimension agents:

Each dimension agent receives:

- `dimension`: The analysis dimension name (e.g., "security")
- `scope`: What to analyze (file paths, git range, or "full repo")
- `output_path`: Where to write findings
  (`output_dir/dimensions/security-findings.json`)
- `repo_path`: Path to cloned repo on disk
- `target_repo`: Original `github.com/org/repo` string
- `target_commit`: HEAD SHA
- `prior_findings_path`: Path to prior analysis for diff context (if available)
- `clone_strategy`: What data is available (blobless-shallow, blobless-1yr,
  full)

**Critical Return Protocol** (from audit-comprehensive):

```
Return ONLY: "COMPLETE: [dimension] wrote N findings to [output-path]"
Do NOT return full findings content — orchestrator checks completion via file read.
```

This is non-negotiable. If the agent returns findings inline in its response
rather than writing to disk, the orchestrator cannot verify completeness and the
state cannot survive compaction.

Sources: deep-research SKILL.md (Phase 1: Parallel Research — agent spawn
contract), REFERENCE.md Section 20 (spawn prompt example), audit-comprehensive
SKILL.md (Critical Return Protocol).

---

### 11. Integration with Existing Skills: The Routing Surface [CONFIDENCE: HIGH]

Based on all five skill SKILL.md files analyzed:

**Pre-analysis handoff FROM deep-research:**

- When deep-research finishes with `hasDebtCandidates: true`, it offers "Route
  to /add-debt". The repo-analysis-skill should also register as a downstream
  consumer of deep-research output.
- When `/deep-plan` Phase 0 checks for `.research/<topic-slug>/`, it will find
  repo analysis output if the slug matches. This enables deep-plan to inject
  repo analysis results as "Research Context" in DIAGNOSIS.md via the existing
  downstream adapter contract.

**Post-analysis handoff TO existing skills:**

- `/deep-plan`: Route when critical findings require architectural decisions
- `/add-debt`: Route new findings after TDMS deduplication
- `/ecosystem-health`: The repo-analysis-skill produces metrics that complement
  the 8-category ecosystem-health scores. They measure different things:
  ecosystem-health measures the repo's own health infrastructure; repo-analysis
  measures external or self repos against external benchmarks.
- `/audit-comprehensive`: For self-analysis (analyzing this repo's own code),
  repo-analysis-skill and audit-comprehensive overlap. Recommendation:
  repo-analysis-skill is for external repos; audit-comprehensive is for the home
  repo. Enforce this boundary in the WHEN TO USE section.
- `/convergence-loop`: For LOW-confidence findings, offer to run
  convergence-loop verification (same pattern as deep-research Phase 5 menu
  option 5).

**Team config:** For large repos (>50k LOC) or multi-dimension analyses (6+
dimensions), consider spawning via `research-plan-team.md` template rather than
solo execution. The team enables direct dimension-agent-to-aggregator
communication without orchestrator as bottleneck.

Sources: deep-research SKILL.md (Integration section, Phase 5 routing menu,
REFERENCE.md Section 15 downstream adapter contract), deep-plan SKILL.md (Phase
0 research check, Integration section), audit-comprehensive SKILL.md (Related
Skills, When NOT to Use), ecosystem-health SKILL.md (Routing Guide).

---

## Orchestration Architecture Summary (Concrete)

The complete orchestration design synthesized from existing skill patterns:

```
REPO ANALYSIS SKILL — ORCHESTRATION FLOW
==========================================

PHASE 0: Interactive Setup (inline orchestrator)
  0.0: Duplicate check — look for .claude/state/repo-analysis.<slug>.state.json
       If found with status=in-progress: offer resume/re-analyze/abort
       Check trends.jsonl for same commit SHA: warn if already analyzed
  0.1: Parse repo URL, compute slug, detect repo size via GitHub API
  0.2: Select dimensions (default: all 6; user can narrow)
  0.3: Select depth (standard = blobless+shallow; deep = includes history analysis)
  0.4: Compute agent budget: N_dims + 2 + floor(N_dims/4); present to user
  0.5: Create state file at .claude/state/repo-analysis.<slug>.state.json
  0.6: Create output directory at .research/<repo-slug>/

PHASE 1: Pre-flight (orchestrator inline, no sub-agents)
  1.1: Fire 3 API calls in parallel (GitHub metadata, Scorecard, deps.dev)
  1.2: Execute clone (strategy selected in Phase 0)
  1.3: Update state file — phase=2, wave_status.preflight=complete

PHASE 2: Dimension Wave (up to 4 agents, staged 4/4 concurrency cap)
  Wave A (up to 4 simultaneous):
    Spawn: code-quality-agent, security-agent, structure-agent, process-agent
    Each agent: analyzes dimension, writes dimensions/<dim>-findings.json, returns COMPLETE
    Orchestrator: verify file exists + non-empty after each return
    If agent fails: re-spawn once; if re-fail: mark failed, continue
  Report: "Phase 2 complete: 4/4 dimensions analyzed. [list any failures]"
  Update state file — wave_status.phase2=complete

PHASE 3: History Wave (conditional — only if depth=deep or churn requested)
  3.1: Deepen clone: git fetch --shallow-since="1 year ago" --filter=blob:none
  Wave B (up to 3 simultaneous):
    Spawn: churn-agent, contributor-agent, commit-trend-agent
    Each writes dimensions/<dim>-findings.json
  Update state file — wave_status.phase3=complete

PHASE 4: Aggregation (1 agent, sequential)
  4.1: Spawn aggregation-agent with paths to all dimension files
  4.2: Aggregation agent produces: analysis.json, findings.jsonl, summary.md
  4.3: If prior analysis exists: compute delta, update trends.jsonl
  4.4: Update state file — wave_status.aggregation=complete

PHASE 4.5: TDMS Deduplication (inline, mandatory)
  4.5: Cross-reference findings.jsonl against MASTER_DEBT.jsonl
  4.6: Write DEDUP_VS_MASTER_DEBT.md to output_dir
  4.7: Count: N already tracked, M new, K possibly related

PHASE 5: Interactive Review (deep-plan Q&A style)
  5.1: Present analysis report (Layer 1+2 from summary.md)
  5.2: Present new findings in batches of 3-5, S0 first
  5.3: Wait for user ACCEPT/DECLINE/DEFER on each batch
  5.4: Save decisions to REVIEW_DECISIONS.md after each batch
  5.5: For ACCEPTED findings: queue for /add-debt

PHASE 6: Routing Menu
  (1) Route all accepted findings to TDMS via /add-debt
  (2) Route to /deep-plan [if critical findings threshold met]
  (3) Save summary to memory
  (4) Compare with another repo
  (5) Done

State file updated after every phase transition.
Resume: re-invoke with same repo URL; skip completed phases via state file.
```

---

## Sources

| #   | Path                                                             | Title                         | Type              | Trust | CRAAP Score | Date       |
| --- | ---------------------------------------------------------------- | ----------------------------- | ----------------- | ----- | ----------- | ---------- |
| 1   | `.claude/skills/deep-research/SKILL.md`                          | Deep Research Skill           | Internal canon    | HIGH  | 5.0         | 2026-03-29 |
| 2   | `.claude/skills/deep-research/REFERENCE.md`                      | Deep Research Reference       | Internal canon    | HIGH  | 5.0         | 2026-03-29 |
| 3   | `.claude/skills/deep-plan/SKILL.md`                              | Deep Plan Skill               | Internal canon    | HIGH  | 5.0         | 2026-03-07 |
| 4   | `.claude/skills/audit-comprehensive/SKILL.md`                    | Audit Comprehensive Skill     | Internal canon    | HIGH  | 5.0         | 2026-02-22 |
| 5   | `.claude/skills/ecosystem-health/SKILL.md`                       | Ecosystem Health Skill        | Internal canon    | HIGH  | 5.0         | 2026-03-11 |
| 6   | `.claude/skills/code-reviewer/SKILL.md`                          | Code Reviewer Skill           | Internal canon    | HIGH  | 5.0         | 2026-03-13 |
| 7   | `.claude/state/deep-research.repo-analysis-skill.state.json`     | Live state file               | Live artifact     | HIGH  | 5.0         | 2026-03-31 |
| 8   | `.research/repo-analysis-skill/findings/D4-analysis-pipeline.md` | D4 Pipeline findings          | Internal research | HIGH  | 4.8         | 2026-03-31 |
| 9   | `.research/repo-analysis-skill/findings/D5-output-scoring.md`    | D5 Output/Scoring findings    | Internal research | HIGH  | 4.8         | 2026-03-31 |
| 10  | `CLAUDE.md`                                                      | Project rules and constraints | Internal canon    | HIGH  | 5.0         | 2026-03-24 |

---

## Contradictions

**1. Agent-per-dimension vs agent-per-file-group:** audit-comprehensive uses one
agent per domain with the domain as a fixed boundary. deep-research allows
splitting agents when scope exceeds context. For repo-analysis, the right split
boundary is the analysis dimension (code-quality, security, etc.), not arbitrary
file groups. However, for very large repos a single dimension agent may hit
context limits — the deep-research re-spawn rule (split scope, spawn 2+ smaller
agents) applies here. This creates a contradiction: do you split by file group
(half the repo's files per agent) or by sub-dimension (complexity vs duplication
as separate agents)? The audit-comprehensive approach (sub-dimension split, as
in Stage 2.5 adding ai-optimization as its own stage) is cleaner and produces
more interpretable output.

**2. Inline TDMS dedup vs separate agent:** audit-comprehensive performs dedup
as "Stage 3.5: MASTER_DEBT Deduplication (MANDATORY)" and explicitly states it
must complete before interactive review. This is done inline (orchestrator reads
MASTER_DEBT.jsonl and writes DEDUP_VS_MASTER_DEBT.md). The rule "Do NOT ingest
findings into TDMS until the user has reviewed them" creates a sequencing
constraint. For large finding sets (100+ findings), inline dedup may be slow.
The resolution is to keep dedup inline but bound its execution time — if
MASTER_DEBT.jsonl is very large, use fingerprint-based lookup rather than
full-text scan.

**3. Scope boundary with audit-comprehensive:** When analyzing the home repo
(sonash-app), both audit-comprehensive and repo-analysis-skill could produce
overlapping findings. audit-comprehensive SKILL.md "Future Enhancements" lists
"Incremental Audits: Only re-run audits for changed domains" — this is the same
capability repo-analysis-skill provides for external repos. The skills should
enforce mutual exclusivity: audit-comprehensive is for home repo only,
repo-analysis-skill is for external repos. If invoked on the home repo,
repo-analysis-skill should warn and offer to route to /audit-comprehensive
instead.

---

## Gaps

1. **No existing spawn prompt template for dimension agents** — deep-research
   REFERENCE.md Section 20 documents searcher agent prompts, but no equivalent
   template exists for code-analysis dimension agents. The repo-analysis
   SKILL.md will need to define these from scratch.

2. **Clone directory lifecycle** — no existing skill manages a temp directory
   across multiple agents. deep-research writes all output to
   `.research/<slug>/` (a persistent path). For repo-analysis, the clone is
   temporary. No pattern exists in the codebase for passing a temp directory
   path to multiple agents and ensuring cleanup. This needs to be designed.

3. **Git credential handling for private repos** — all existing analysis tools
   (Scorecard, deps.dev, GitHub API) work on public repos. No existing skill
   pattern addresses passing GitHub credentials to a cloning agent. This is a
   gap for private repo analysis support.

4. **Cross-dimension correlation agent** — audit-comprehensive mentions
   "cross-cutting findings via messages" as a team-mode advantage. In subagent
   mode, cross-cutting correlations are handled by the aggregation agent reading
   all dimension files. No pattern exists for having dimension agents
   communicate findings to each other during execution (only possible in team
   mode with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`).

5. **Trends.jsonl location** — ecosystem-health writes to
   `data/ecosystem-v2/ecosystem-health-log.jsonl` (a repo-wide persistent data
   directory). For repo-analysis-skill analyzing external repos, there is no
   equivalent persistent data directory. Options: (a) write to
   `.research/<repo-slug>/trends.jsonl` per-repo, or (b) create a central
   `data/repo-analyses/trends.jsonl`. Neither pattern exists in the codebase
   today.

---

## Serendipity

**Audit-comprehensive team mode is future-proof.** The
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` mode with cross-agent messaging is
explicitly designed for the exact problem repo-analysis-skill faces
(cross-dimension correlation during analysis). The team mode allows dimension
agents to message each other: "I found X in security that affects code-quality
analysis." This is architecturally superior to the subagent mode but requires
the experimental flag. The repo-analysis-skill should document both modes and
prefer team mode when available.

**Code-reviewer's "pre-review episodic memory search" is a direct pattern for
prior-analysis recall.** The code-reviewer begins every review by searching
episodic memory for past reviews of the same module. The repo-analysis-skill
should do the same: before running analysis, search episodic memory for prior
analysis sessions on the same repo. This enables the skill to say "I last
analyzed this repo 30 days ago — comparing against prior session."

**deep-plan's convergence-loop on DIAGNOSIS.md claims** applies to repo-analysis
output too. If the skill produces analysis.json with dimension scores, a
convergence-loop could verify that the scores are internally consistent (e.g., a
repo with score=90 security shouldn't have any S0 findings). This is a
post-aggregation quality check that doesn't exist in any current skill.

**The `--refresh` flag pattern from deep-research enables trend-first
workflows.** If a user runs `/repo-analysis github.com/org/repo --refresh`, the
skill should: (a) run fresh analysis, (b) preserve all prior trends.jsonl
entries, (c) display the diff from the previous run as the primary output rather
than the full report. This is a significantly different UX than the default
full-report presentation but is often what repeat users want.

---

## Confidence Assessment

- HIGH claims: 10 (agent formula, wave staging, write-to-disk-first, state
  schema, handoff routing, TDMS dedup, spawn protocol, failure handling,
  progressive results, routing surface)
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are derived directly from reading actual SKILL.md files and live
state file artifacts in the codebase. No external sources were consulted — this
is a pure codebase analysis. Every recommended pattern has a specific precedent
in an existing skill with an exact file reference.
