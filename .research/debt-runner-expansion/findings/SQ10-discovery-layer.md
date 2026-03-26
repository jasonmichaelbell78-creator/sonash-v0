# Findings: AI-Driven Debt Discovery Layer for Debt-Runner

**Searcher:** deep-research-searcher
**Profile:** codebase
**Date:** 2026-03-26
**Sub-Question IDs:** SQ-10

---

## Key Findings

### 1. Current Debt Discovery Mechanisms Are Entirely Mechanical (No AI Layer)

[CONFIDENCE: HIGH]

All current debt discovery is mechanical/static. The codebase has four discovery pathways,
none of which use AI agents for *finding* new debt:

**A. Code-comment scanner (`extract-scattered-debt.js`)**
Scans `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.css` in 8 directories
(`src`, `app`, `components`, `lib`, `hooks`, `types`, `scripts`, `.claude/hooks`,
`functions/src`) using a pure regex: `\b(TODO|FIXME|HACK|XXX|WORKAROUND)(?=[:(])`.
It applies a false-positive filter (variable names, quoted examples), assigns severity
from a static keyword→severity map (`FIXME`→S2, `TODO`→S3), and deduplicates against
existing MASTER_DEBT hashes. Produces `raw/scattered-intake.jsonl`.

Limitation: Captures only annotated comments. Silent complexity, dead code, test gaps,
missing error handling, and latent security issues are invisible.

**B. Audit report parser (`extract-audit-reports.js`)**
Parses 17 historical markdown reports from `docs/archive/2025-dec-reports/`. This was
a one-time migration script, not a recurring discovery mechanism. It does not run on
new audit outputs automatically.

**C. Context/agent output parser (`extract-context-debt.js`)**
Parses `.claude/state/agent-research-results.md` and
`.claude/state/system-test-gap-analysis-pass2.md` for structured `Gap:` items and
`FINDING-*` entries. This is triggered manually and depends on agents having already
surfaced issues — it is an *extraction* tool, not a discovery tool.

**D. SonarCloud sync (`sync-sonarcloud.js`)**
Fetches issues from the SonarCloud REST API (`https://sonarcloud.io/api`) filtered
by severity and type. This is an external tool integration — SonarCloud performs its
own static analysis, and this script pulls the results into TDMS. It detects resolutions
by comparing API results against MASTER_DEBT.

**Key gap**: None of these mechanisms can *reason* about the codebase. A complex
component with no TODOs and no SonarCloud flags can still have architectural debt that
only an AI agent (reading the code with judgment) would identify.

---

### 2. The Audit Skills Do Perform AI-Driven Discovery — But Are Not Wired to Debt-Runner

[CONFIDENCE: HIGH]

The 9 domain audit skills (`audit-code`, `audit-security`, `audit-performance`, etc.)
already employ AI agents for discovery. Each skill spawns subagents that:

- Read source files using Grep, Glob, Read, Bash
- Evaluate code against domain-specific criteria
- Apply the 4-level confidence model (90%+ HIGH, 70-89% MEDIUM, <70% LOW)
- Perform dual-pass verification for S0/S1 findings
- Output structured JSONL matching the TDMS schema

These are closer to "discovery agents" than the mechanical scripts. However they are
**standalone skills** invoked by the user via `/audit-comprehensive` or individually —
they are not callable from within `debt-runner` and they do not form a
"full debt refresh" workflow.

The `audit-comprehensive` skill is the closest analog to what is needed. It:
1. Spawns 9 domain audit agents in staged waves (4+3+2+1)
2. Aggregates findings
3. Deduplicates against MASTER_DEBT
4. Surfaces only net-new items for review

The missing piece: this is a separate, manually invoked skill, not integrated
into `debt-runner`'s mode menu.

---

### 3. Deep-Research Agent Model: Applicable Patterns for Debt Discovery

[CONFIDENCE: HIGH]

The `/deep-research` skill (`SKILL.md` v1.5) provides proven patterns directly
applicable to debt discovery:

**Decomposition model**: Deep-research decomposes a topic into MECE sub-questions
and assigns each to a typed agent (web/docs/codebase/academic profiles). For debt
discovery, the equivalent is decomposing the codebase into scan domains (security,
performance, patterns, dependencies, etc.) and assigning each to a typed scanner agent.

**Wave-based parallelism**: Deep-research uses `D + 3 + floor(D/5)` agents in waves of
max 4 concurrent. This pattern already exists in `audit-comprehensive` (4+3+2+1 stages).
The debt discovery model should follow this same concurrency pattern.

**Findings-to-disk protocol**: Searchers write structured `FINDINGS.md` files
immediately. The debt equivalent is agents writing structured JSONL to a staging
directory immediately — not buffering in context.

**Confidence-leveled output**: Deep-research assigns HIGH/MEDIUM/LOW/UNVERIFIED to
every claim. The audit template already mirrors this (HIGH 90%+, MEDIUM 70-89%,
LOW <70%). The debt discovery layer should emit confidence-annotated TDMS items.

**Synthesizer aggregation**: Deep-research has a dedicated synthesizer agent that
reads all FINDINGS.md files and produces a unified output. The debt equivalent is
`audit-aggregator` — but for discovery refreshes it needs to also produce a *delta*
(new vs. existing vs. resolved vs. false-positive).

**Gap**: Deep-research has a contrarian/OTB challenge phase (Phase 3) that
actively seeks disconfirming evidence. Current audit skills have no equivalent.
A "verify existing items" scan (are these MASTER_DEBT items still real?) is the
discovery-layer analog.

---

### 4. Agent Types Needed for a Debt Discovery Layer

[CONFIDENCE: HIGH — based on existing audit skill domain coverage]

Based on the 9 audit domains in `audit-comprehensive` and the gap in mechanical
discovery, the following agent types are needed:

| Agent Type | Discovery Scope | Current Coverage | Enhancement |
|---|---|---|---|
| `code-scanner` | TODOs, FIXMEs, dead code, unused exports, complexity hotspots | Partially (regex-only) | AI semantic analysis of complex files |
| `pattern-checker` | Anti-patterns from `CODE_PATTERNS.md` and `known-debt-baseline.json` | Partially (patterns:check script) | New pattern classes the script can't detect |
| `dependency-auditor` | Outdated dependencies, breaking changes, npm audit vulnerabilities | None in TDMS | `npm audit` + `npm outdated` + AI analysis |
| `security-scanner` | OWASP, Firebase security rules, auth gaps | Partially (audit-security) | Integration into discovery refresh |
| `complexity-scanner` | Cyclomatic complexity, large file hotspots | Partially (check-cyclomatic-cc.js) | Surface as debt items, not just metrics |
| `test-coverage-auditor` | Files with no tests, untested critical paths | None in TDMS | Diff coverage reports against source |
| `schema-drift-checker` | Zod schemas, Firestore field drift, type mismatches | None in TDMS | Compare runtime schema against declared types |
| `integration-verifier` | Existing MASTER_DEBT items — still valid? | verify-resolutions.js (file-exists only) | AI reads code to confirm issue still present |
| `doc-coverage-scanner` | Undocumented public APIs, outdated doc headers | Partially (audit-documentation) | Integration into discovery refresh |

The most novel agent — `integration-verifier` — replaces the mechanical
`verify-resolutions.js` (which only checks if the file exists and if keywords
are still near the original line) with an agent that *reads* the code and applies
judgment: "Has this issue been addressed, even if not explicitly marked resolved?"

---

### 5. Scripts and Skills That Need Discovery Agent Procedures

[CONFIDENCE: HIGH]

The following have shallow discovery that an AI agent would substantially improve:

**`extract-scattered-debt.js` — Regex-to-AI gap**
- Current: Regex scan for 5 keyword patterns. No understanding of context, severity
  appropriateness, or whether a TODO is in a critical vs trivial path.
- Enhancement: A `code-scanner` agent that reads the file context around each TODO,
  assesses actual severity (a `TODO:` in an auth function is S1; one in a formatting
  helper is S3), and identifies *implicit* debt that has no comment marker.
- Integration point: Agent produces an enhanced `scattered-intake.jsonl` with
  AI-assigned severity overrides and new implicit-debt items.

**`verify-resolutions.js` — File-exists-to-judgment gap**
- Current: Step 3 checks if the referenced file exists and if the line count is
  still sufficient. Step 4 checks if keywords extracted from the title appear within
  ±10 lines of the original line. This is a heuristic, not a judgment.
- Enhancement: An `integration-verifier` agent that reads the file at the referenced
  location, compares against the MASTER_DEBT item's description, and makes a
  reasoned determination: confirmed present, confirmed absent, or uncertain.
- Integration point: Replaces the keyword-proximity heuristic in `classifyAuditItem()`.

**`validate-schema.js` — Schema-only-to-semantic gap**
- Current: Validates JSONL field formats (ID pattern, severity enum, date format, etc.)
  but cannot assess whether the item is semantically coherent or stale.
- Enhancement: A `schema-coherence-checker` agent that reads each item and flags:
  - File path exists but line number is wildly off (file was refactored)
  - Title describes an issue that is contradicted by the current file content
  - Severity does not match item category norms
- Integration point: New validation pass after schema validation, gated on
  `--with-ai-check` flag to avoid slowing pre-commit.

**Audit skills (`audit-code`, `audit-security`, etc.) — isolated-to-connected gap**
- Current: Each skill runs independently, with no memory of prior audit runs. A
  persistent pattern (same file flagged in 5 consecutive audits) is not surfaced
  as a systemic issue automatically.
- Enhancement: Before dispatching discovery agents, a `context-loader` agent reads
  prior audit results from `docs/audits/` and builds a hot-spot map. Discovery
  agents receive this map and flag when their findings match known hot spots.
- Integration point: Pre-flight step in the discovery workflow, before agent dispatch.

**`sync-sonarcloud.js` — API-pull-to-verification gap**
- Current: Fetches issues from SonarCloud API and maps them into TDMS format.
  No verification that SonarCloud's classification is accurate for this codebase.
- Enhancement: A `sonarcloud-verifier` agent that reads the code at the flagged
  location and confirms whether the SonarCloud finding is a true positive, false
  positive, or already addressed (open in SonarCloud but fixed in code).
- Integration point: Post-fetch verification step in `sync-sonarcloud.js` or
  in debt-runner's sync mode.

---

### 6. "Full Debt Refresh" Workflow Design

[CONFIDENCE: MEDIUM — design not yet implemented, based on inference from existing patterns]

The following workflow adapts the `audit-comprehensive` + `deep-research` patterns
into a debt-runner discovery mode:

```
DISCOVERY MODE: Full Debt Refresh

Step 1: Context Loader (sequential, before dispatch)
  Agent: context-loader
  Task: Read prior audit reports, build hot-spot map (files flagged 2+ times)
  Output: hot-spots.json in staging/

Step 2: Internal Discovery Wave 1 (4 agents parallel, wave respects max-4 limit)
  Agent A: code-scanner        → scans code for TODOs + implicit debt
  Agent B: pattern-checker     → checks CODE_PATTERNS.md anti-patterns + new patterns
  Agent C: security-scanner    → OWASP, Firebase rules, auth gaps
  Agent D: dependency-auditor  → npm audit, outdated packages, breaking changes

  Each agent:
    - Receives: hot-spots.json, MASTER_DEBT hashes (for dedup), scan scope
    - Produces: staging/discovery-<agent>-<date>.jsonl
    - Returns: "COMPLETE: <agent> wrote N findings to staging/..."

Step 3: Internal Discovery Wave 2 (4 agents parallel)
  Agent E: complexity-scanner   → cyclomatic complexity hotspots
  Agent F: test-coverage-auditor → untested critical paths
  Agent G: schema-drift-checker  → type/Zod/Firestore schema drift
  Agent H: doc-coverage-scanner  → undocumented public APIs

Step 4: External Source Verification (2 agents parallel)
  Agent I: sonarcloud-verifier  → fetch + verify SonarCloud issues
  Agent J: pr-debt-extractor    → extract deferred items from recent PRs not yet in TDMS

Step 5: Existing Debt Verification (up to 4 agents parallel, sliced by severity)
  Agent K: integration-verifier (slice S0+S1) → verifies MASTER_DEBT S0/S1 items still real
  Agent L: integration-verifier (slice S2)    → verifies MASTER_DEBT S2 items
  Agent M: integration-verifier (slice S3)    → verifies MASTER_DEBT S3 items (sample)

  Purpose: Identifies items to mark RESOLVED (issue no longer in code),
           FALSE_POSITIVE (was wrong), or STALE (item is real but context changed).

Step 6: Delta Synthesis (sequential)
  Reads all staging/discovery-*.jsonl files
  Deduplicates against MASTER_DEBT (exact hash + near-match)
  Produces delta report:
    - NEW items (not in MASTER_DEBT)
    - RESOLVED candidates (agents confirm issue gone)
    - FALSE_POSITIVE candidates (agents confirm was wrong)
    - UPGRADED severity suggestions (agent found S2 should be S1)
    - Hot spots (files appearing in 3+ agent findings)

Step 7: User Review Gate (interactive, MANDATORY)
  Present delta in batches of 5:
    Section A: Critical new items (S0/S1)
    Section B: Resolved candidates (confirm before marking)
    Section C: Other new items (S2/S3)
    Section D: Severity upgrades
  User approves/defers/rejects each batch

Step 8: Apply Approved Changes
  Via existing intake/resolve scripts:
    intake-audit.js → for approved new items
    resolve-bulk.js → for confirmed resolutions
    MASTER_DEBT direct edit (via debt-runner staging) → for severity upgrades
```

Key design decisions:
- Steps 2-5 are ALL parallel-within-wave, write to disk immediately (compaction-safe)
- Step 7 is the only human gate — everything before is automated discovery
- Step 8 uses *existing* scripts — no new write paths to MASTER_DEBT
- The "existing debt verification" (Step 5) is the most novel addition: this
  is not present in any current workflow

---

### 7. Agent Coordination Patterns

[CONFIDENCE: HIGH — based on team files and audit-comprehensive]

The existing coordination patterns in this codebase are:

**Pattern 1: Staged subagent waves (audit-comprehensive model)**
- 4-concurrent-agent limit enforced by staging (Wave 1: 4 agents, Wave 2: 3, etc.)
- Each agent writes to a unique output file; orchestrator checks completion via `wc -l`
- Agents return only `COMPLETE: <id> wrote N findings to <path>` — never full content
- Orchestrator reads from disk after all agents in a wave complete
- This is the recommended pattern for discovery agents.

**Pattern 2: Reviewer-fixer team (audit-review-team)**
- 2-member team: reviewer (read-only) → fixer (write-only after reviewer finishes)
- Sequential per-target pipeline
- Effective for single-domain audits on 3-5 targets
- Token cost ~3x solo
- NOT recommended for broad discovery (too many targets, sequential bottleneck)

**Pattern 3: Research-plan team (research-plan-team)**
- 3-member: researcher → planner → verifier with direct inter-agent messaging
- Best for complex research → plan pipeline
- Token cost ~4x solo
- NOT recommended for discovery (researcher role maps to scanner agents, but the
  planner and verifier don't add value in a discovery context)

**Recommended pattern for discovery layer: Staged Subagent Waves**
- Use Pattern 1 (audit-comprehensive model) for Waves 1-5
- Do NOT use Pattern 2 or 3 — sequential bottlenecks harm a parallel discovery task
- The research-plan-team's "verifier" role maps conceptually to the
  "integration-verifier" agents (Step 5), but as parallel subagents, not a team member

**Avoiding duplicate work between agents:**
- Each agent receives its scan scope explicitly (list of files or file patterns)
- Cross-cutting agents (e.g., security-scanner and code-scanner may both read `auth.ts`)
  are acceptable — deduplication happens in Step 6 (delta synthesis), not during scanning
- Each agent also receives MASTER_DEBT hashes to skip already-tracked items

**Handling conflicting findings:**
- If two agents produce the same finding (same file:line, different severity), the
  delta synthesizer takes the higher severity and notes the conflict
- The user review gate (Step 7) surfaces severity conflicts explicitly

**Concurrency limits:**
- Max 4 agents per wave (CLAUDE.md Section 7 + audit-comprehensive precedent)
- Integration-verifier agents are the most expensive (AI reads and judges each
  MASTER_DEBT item) — limit to 3 parallel, slice by severity

---

### 8. Integration Points Into Debt-Runner

[CONFIDENCE: HIGH]

Debt-runner currently has 7 modes: verify, sync, plan, health, dedup, validate, cleanup.

The discovery layer adds one new mode:

**Mode 8: Discover (CL standard preset)**

This fits naturally into the menu:
```
8. discover — AI-driven full debt refresh (find new, verify existing)
```

Warm-up additions for discover mode:
- "Last discovery run: [date or never]"
- "Estimated: ~45 min (9 scan agents + 3 verify agents + synthesis)"
- Discovery mode triggers a confirmation gate before dispatch (>potential mutations)

Integration with existing modes:
- `discover` should NOT merge into `verify` mode — discovery finds NEW items;
  `verify` confirms EXISTING items. They have different purposes.
- After `discover` completes the delta, the user can optionally chain into
  `plan` mode with the newly surfaced items.
- SonarCloud agents in discover mode overlap with `sync` mode — offer user
  the choice: "Run full discover (includes SonarCloud fetch) or run discover
  excluding SonarCloud? (use sync mode for SonarCloud only)"

State file additions for discover mode:
- `.claude/state/debt-runner.state.json` gains `discover_mode` section:
  `{ "last_run": "<date>", "wave_status": {...}, "staging_files": [...] }`

---

### 9. Discovery Agent Spawning Prompt Template

[CONFIDENCE: MEDIUM — design based on audit-comprehensive + deep-research patterns]

Each discovery agent should be spawned with:

```
You are a [code-scanner|pattern-checker|security-scanner|...] discovery agent.

Your task: Discover NEW technical debt in the SoNash codebase.

Scope: [list of directories or file patterns assigned to this agent]

Context:
- Hot spots (files flagged in prior audits): [hot-spots.json content]
- Already tracked in MASTER_DEBT (skip these hashes): [hash set]
- Scan profile: [code-quality|security|performance|...]

Process:
1. Scan assigned scope for issues in your domain
2. For each finding:
   - Verify: read the actual code at file:line
   - Assess severity: S0-S3 based on impact (not keyword alone)
   - Check against provided MASTER_DEBT hashes (skip duplicates)
   - Assign confidence: HIGH (verified, pattern confirmed) | MEDIUM | LOW
3. Write findings to: staging/discovery-<agent>-<date>.jsonl
4. Use TDMS JSONL format (Doc Standards schema with fingerprint, files[], etc.)

Return ONLY: COMPLETE: <agent-name> wrote N findings to <path>
Do NOT return findings content.
```

---

### 10. What Does NOT Change

[CONFIDENCE: HIGH]

The discovery layer is additive — it does NOT replace existing mechanisms:

- `extract-scattered-debt.js` continues to run in pre-commit hooks (fast, mechanical)
- `sync-sonarcloud.js` continues as the canonical SonarCloud sync path
- `verify-resolutions.js` continues as the fast mechanical verification
- Audit skills continue as standalone tools for focused domain audits
- The AI-driven discovery layer is opt-in via `discover` mode in debt-runner,
  not automatic

The AI layer enhances coverage and judgment; it does not own the write path.
All mutations still go through staging → existing scripts → MASTER_DEBT.

---

## Sources

| # | File Path | Type | Trust | Date |
|---|---|---|---|---|
| 1 | `scripts/debt/extract-scattered-debt.js` | Source code | HIGH | In repo |
| 2 | `scripts/debt/verify-resolutions.js` | Source code | HIGH | In repo |
| 3 | `scripts/debt/validate-schema.js` | Source code | HIGH | In repo |
| 4 | `scripts/debt/sync-sonarcloud.js` | Source code | HIGH | In repo |
| 5 | `scripts/debt/intake-audit.js` | Source code | HIGH | In repo |
| 6 | `scripts/debt/extract-context-debt.js` | Source code | HIGH | In repo |
| 7 | `.claude/skills/debt-runner/SKILL.md` | Skill doc | HIGH | 2026-03-15 |
| 8 | `.claude/skills/audit-comprehensive/SKILL.md` | Skill doc | HIGH | In repo |
| 9 | `.claude/skills/_shared/AUDIT_TEMPLATE.md` | Shared template | HIGH | 2026-02-24 |
| 10 | `.claude/skills/deep-research/SKILL.md` | Skill doc | HIGH | 2026-03-23 |
| 11 | `.claude/teams/audit-review-team.md` | Team config | HIGH | 2026-03-24 |
| 12 | `.claude/teams/research-plan-team.md` | Team config | HIGH | 2026-03-24 |
| 13 | `docs/technical-debt/PROCEDURE.md` | Procedure doc | HIGH | 2026-02-23 |
| 14 | `.claude/skills/comprehensive-ecosystem-audit/SKILL.md` | Skill doc | HIGH | 2026-02-24 |

---

## Contradictions

**None found.**

The deep-research agent model and the audit skill model are complementary. The
staged parallel agent pattern is used consistently in both `audit-comprehensive`
and `comprehensive-ecosystem-audit` — there is no inconsistency in how to
coordinate discovery agents.

One tension to note (not a contradiction): the `audit-comprehensive` skill already
does AI-driven discovery, but is not wired to debt-runner. A naive integration might
just call `/audit-comprehensive` from within debt-runner's discover mode. This is
a valid approach, but it does not add the novel "verify existing MASTER_DEBT items"
step (Steps 5 of the workflow above) — which requires a different agent design than
a domain audit.

---

## Gaps

1. **No existing "full debt refresh" workflow has ever been run** — there is no prior
   state file or completion record to reference. The workflow design above is entirely
   new, not derived from prior usage.

2. **npm audit and outdated deps discovery** — `sync-sonarcloud.js` handles SonarCloud
   but there is no existing script for `npm audit` or `npm outdated` intake into TDMS.
   A `dependency-auditor` agent would be the first to surface this category of debt.

3. **Test coverage gaps** — No current mechanism surfaces untested files as debt.
   `check-cyclomatic-cc.js` tracks complexity but not coverage. A
   `test-coverage-auditor` would be entirely new.

4. **Deep-research domain config for codebase scanning** — Deep-research has domain
   modules in `.claude/skills/deep-research/domains/`. There is no
   `tech-debt-discovery.yaml` domain config. One would need to be created to apply
   codebase-profile verification rules (recency, minimum sources) to debt discovery.

5. **Token cost for full refresh** — No estimate exists. Based on audit-comprehensive
   (65 min parallel, ~9 agents), a full discovery refresh with 9-12 scan agents +
   3 verify agents + synthesis would be substantially larger. User should be warned.

---

## Serendipity

**`audit-comprehensive` already has a "dedup vs MASTER_DEBT" step (Stage 3.5)**
that is exactly the delta synthesis step needed for the discovery layer. The
DEDUP_VS_MASTER_DEBT.md format it produces (Already Tracked / New Finding / Possibly
Related) is the exact output structure needed at Step 6 of the discovery workflow.
Debt-runner's discover mode can reuse this step directly.

**`extract-context-debt.js` is a prototype of the intake pattern**
This script already parses gap analysis files from `.claude/state/` — the same
files that discovery agents would produce. The intake pipeline for discovery agent
output could reuse or extend this script's parsing logic.

**`comprehensive-ecosystem-audit` runs 8 ecosystem audits, not codebase audits**
There is a naming distinction worth preserving: `audit-comprehensive` audits the
*codebase* (code quality, security, etc.); `comprehensive-ecosystem-audit` audits
the *AI tooling ecosystem* (hook health, skill health, TDMS health, etc.). The
discovery layer spans both — it needs to find debt in the codebase AND verify
the tooling ecosystem is not introducing debt through hook failures or stale
skill configurations.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are grounded in direct codebase reading. No external sources were
required — the architecture, agent patterns, and discovery mechanisms are all
verifiable from the files listed in the Sources table.
