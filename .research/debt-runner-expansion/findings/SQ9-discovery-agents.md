# Findings: Discovery Agent Layer — Hybrid CLI + Web Integration Design

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-27
**Sub-Question IDs:** SQ-9

---

## Context: The 7 Net-New Agent Types (D10 Adjustment)

Per DECISIONS_PRE_PLAN.md, the original 9 proposed discovery agent types were
reduced to **7 net-new** after deduplication against existing agents:

- `dependency-auditor` REMOVED — duplicates `dependency-manager` agent (already
  handles npm audit, vulnerability scanning, outdated package detection)
- `security-scanner` REMOVED — duplicates `security-auditor` agent (already
  handles OWASP, Firebase security rules, auth gaps with SoNash-specific
  patterns)

The 7 net-new agent types are:

| #   | Agent Type                   | Domain                                                    |
| --- | ---------------------------- | --------------------------------------------------------- |
| 1   | `debt-code-scanner`          | TODOs, dead code, implicit complexity debt                |
| 2   | `debt-pattern-checker`       | Anti-patterns from CODE_PATTERNS.md not caught by scripts |
| 3   | `debt-complexity-scanner`    | Cyclomatic complexity hotspots as trackable debt items    |
| 4   | `debt-test-coverage-auditor` | Files with no tests, untested critical paths              |
| 5   | `debt-schema-drift-checker`  | Zod/Firestore/TypeScript schema drift                     |
| 6   | `debt-integration-verifier`  | Verifies existing MASTER_DEBT items are still real        |
| 7   | `debt-doc-coverage-scanner`  | Undocumented public APIs, outdated doc headers            |

The `debt-` prefix distinguishes these from the broader general-purpose agents
and signals they are TDMS-output agents (write staging JSONL, not
general-purpose tools).

---

## Key Findings

### 1. The Existing `intake-audit.js` Pipeline Is Sufficient for Discovery Agent Output [CONFIDENCE: HIGH]

`intake-audit.js` already handles three input formats:

- **TDMS native format** — direct field mapping
- **Doc Standards format** — `fingerprint`, `files[]`, `why_it_matters`,
  `suggested_fix`, `acceptance_tests` mapped automatically
- **Enhancement audit format** — `counter_argument`, `current_approach`,
  `proposed_outcome` preserved

For discovery agents, the **Doc Standards format** is the natural output schema
since the existing audit agents (spawned by `audit-comprehensive`) already
produce it. No new intake format is needed. Discovery agents should write Doc
Standards JSONL to
`docs/technical-debt/staging/discovery-<agent-type>-<YYYY-MM-DD>.jsonl`, then
`intake-audit.js` ingests as-is.

Key pipeline steps already implemented that discovery agents benefit from:

1. Exact hash dedup against MASTER_DEBT (line 3-4 of intake process)
2. DEBT-XXXX ID assignment
3. Multi-pass dedup (parametric, near, semantic, cross-source, systemic)
4. View regeneration
5. Roadmap reference assignment
6. Confidence logging to `intake-log.jsonl` (not stored in MASTER_DEBT —
   preserved as metadata only)

**Gap:** The `source_id` field (mapped from `fingerprint`) will be
`audit:<fingerprint>` for all discovery agent output. There is no
`source: discovery-<agent-type>` tag in the current schema. Adding a
`discovery_source` field to the discovery staging JSONL — passed through as
optional metadata by `intake-audit.js` — would enable web dashboard filtering
without schema changes to MASTER_DEBT core fields.

### 2. Agent Definition Design: `debt-*.md` Files [CONFIDENCE: HIGH]

Each discovery agent definition follows the same front-matter contract as
existing agents but with tightly scoped tools (read-only) and a mandatory TDMS
output protocol.

**Shared front-matter pattern for all 7:**

```yaml
---
name: debt-<type>
description: |
  TDMS discovery agent. Scans the codebase for [domain] debt and writes
  structured JSONL to staging/. Read-only. Returns COMPLETE summary only.
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit, Agent
model: sonnet
maxTurns: 30
---
```

The `disallowedTools: Write, Edit` is critical — discovery agents MUST NOT
modify any files. Their only output is the staging JSONL file written via their
Bash tool (using `node -e` or a dedicated writer helper to avoid raw writes).
The `Agent` tool is also disallowed — discovery agents are leaves, not
orchestrators.

All 7 agents share a **mandatory return protocol:**

```
COMPLETE: debt-<type> wrote N findings to staging/discovery-<type>-<date>.jsonl
(N new | N skipped as duplicates | N LOW-confidence items excluded)
```

Agents return ONLY this summary. They never return findings content inline.

### 3. Per-Agent Design: Output Schema + Orchestration Role [CONFIDENCE: HIGH]

#### Agent 1: `debt-code-scanner`

**Scope:** `src/`, `app/`, `components/`, `lib/`, `hooks/`, `types/`,
`functions/src/`, `.claude/hooks/`

**What it finds:**

- TODO/FIXME/HACK/XXX comments where the surrounding code context elevates
  severity beyond the regex-only classification (e.g., a `TODO` in an auth
  function → S1, not S3)
- Implicit debt: complex functions with no comment markers (reads file, assesses
  cyclomatic intent, flags as debt if context warrants)
- Unused exports detectable by reading imports across files
- Dead branches (`if (false)`, `/* disabled */` blocks left in production code)

**Output schema (Doc Standards format):**

```json
{
  "fingerprint": "code-scanner::app/api/auth/route.ts::implicit-missing-rate-limit",
  "files": ["app/api/auth/route.ts:45"],
  "title": "Auth route missing rate limiting on token refresh",
  "why_it_matters": "Unbounded token refresh calls enable credential stuffing without server-side throttling.",
  "suggested_fix": "Add FirestoreRateLimiter guard on token refresh endpoint, analogous to saveDailyLog pattern.",
  "acceptance_tests": [
    "npm run patterns:check -- app/api/auth/route.ts shows no rate-limit violations"
  ],
  "category": "security",
  "severity": "S1",
  "confidence": "MEDIUM",
  "discovery_source": "debt-code-scanner"
}
```

**Key design decisions:**

- Context window per file: agent reads the full file (not just the comment line)
  before assigning severity
- Dedup check: agent receives MASTER_DEBT `content_hash` set and skips items
  whose fingerprint already exists
- False-positive guard: agent applies the same false-positive filter as
  `extract-scattered-debt.js` (variable names, quoted examples) before elevating
  severity

#### Agent 2: `debt-pattern-checker`

**Scope:** `scripts/`, `app/`, `lib/`, `functions/src/`

**What it finds:**

- Violations of CODE_PATTERNS.md anti-patterns that the `patterns:check` script
  CANNOT catch because they require reading context across multiple lines or
  files:
  - Missing try/catch on file reads where the try/catch is present but doesn't
    handle the specific failure mode
  - `exec()` loop patterns where `/g` flag is absent but the variable is named
    to look like a loop counter
  - Path traversal checks that use `startsWith('..')` instead of the regex
    pattern — even when buried inside utility functions
- New pattern classes NOT yet in `patterns:check` (identified by agent reading
  CODE_PATTERNS.md and comparing against actual code)
- `known-debt-baseline.json` suppression entries that lack a `DEBT-XXXX`
  cross-reference (per DARK-01 reframe in D10)

**Output schema:** Same Doc Standards format. `category: "code-quality"`,
`type: "anti-pattern"`.

**Key design decision:** Agent receives `scripts/lib/security-helpers.js` and
`scripts/check-pattern-compliance.js` as context so it understands what IS
already checked and focuses only on the gaps.

#### Agent 3: `debt-complexity-scanner`

**Scope:** All TypeScript/JavaScript files in source directories

**What it finds:**

- Files with cyclomatic complexity above threshold (currently tracked by
  `check-cyclomatic-cc.js`) that are NOT already in MASTER_DEBT as complexity
  items
- The distinction from the existing script: this agent surfaces complexity as
  **actionable debt items with recommended remediation**, not just metrics. It
  reads the complex function, identifies the specific refactoring opportunity,
  and writes a titled debt item.
- Large files (>300 lines) where the agent judges the complexity is structural
  (mixed concerns), not just long

**Output schema:**

```json
{
  "fingerprint": "complexity-scanner::lib/firestore-service.ts::high-complexity-fetchUserData",
  "files": ["lib/firestore-service.ts:120"],
  "title": "fetchUserData cyclomatic complexity 18 — split into focused fetch functions",
  "why_it_matters": "High complexity increases maintenance risk and testing burden. Complexity 18 is 3x the S2 threshold of 6.",
  "suggested_fix": "Extract into fetchUserProfile, fetchUserPreferences, fetchUserSubscription. Each should be under complexity 5.",
  "category": "code-quality",
  "severity": "S2",
  "type": "refactoring",
  "confidence": "HIGH",
  "discovery_source": "debt-complexity-scanner"
}
```

**Overlap management:** Agent receives current MASTER_DEBT hashes and the output
of `check-cyclomatic-cc.js` to avoid creating duplicate items for
already-tracked complexity debt.

#### Agent 4: `debt-test-coverage-auditor`

**Scope:** `src/`, `app/`, `components/`, `lib/`, `hooks/`, `functions/src/`

**What it finds:**

- Source files with no corresponding test file (`*.test.ts`, `*.test.tsx`,
  `*.spec.ts`) and which export non-trivial logic (not just type exports or pure
  config)
- Critical paths (auth flows, Cloud Functions, data mutations) with test files
  present but where the agent judges coverage is structurally incomplete (e.g.,
  test file only tests the happy path, no error branch)
- Cloud Functions with no integration tests

**Output schema:** `category: "testing"`, `type: "missing-test"`. The
`suggested_fix` field names the specific test cases needed, not just "add
tests."

**Limitation (document in findings):** This agent cannot read actual coverage
reports (no Jest coverage data in repo). It works from file presence + code
reading. Coverage instrumentation would give higher-precision findings. This is
a gap.

#### Agent 5: `debt-schema-drift-checker`

**Scope:** `functions/src/schemas.ts`, `types/`, `firestore.rules`, Zod schema
files, `lib/firestore-service.ts`

**What it finds:**

- TypeScript interfaces that have no matching Zod schema (or vice versa)
- Zod schemas where the field list diverges from the TypeScript interface
- Firestore collection paths in `lib/firestore-service.ts` that reference fields
  not present in the declared schema
- `functions/src/schemas.ts` Zod schemas that don't match the Cloud Function's
  expected input structure

**Output schema:** `category: "architecture"`, `type: "schema-drift"`. Findings
reference both the TypeScript file and the Zod schema file in the `files[]`
array.

**Key constraint:** This agent requires reading multiple files in concert — the
TypeScript type, the Zod schema, and the usage site. It should request ALL
relevant files before making any drift determination. Single-file readings
produce false positives.

#### Agent 6: `debt-integration-verifier`

**Scope:** MASTER_DEBT.jsonl items — verifies existing items, does not find new
ones

**What it does (different role from agents 1-5):**

- Reads each MASTER_DEBT item's `file` and `line` fields
- Reads the actual source code at that location
- Applies judgment: "Is the described issue still present, or has it been
  addressed?"
- Produces three classification outcomes:
  - `CONFIRMED` — issue is still present, item valid
  - `RESOLVED` — issue is gone; recommend marking as resolved
  - `UNCERTAIN` — file changed substantially; manual review needed
- Does NOT produce new debt items — produces a verification report

**Output schema (distinct from Doc Standards — this is a verification report):**

```json
{
  "debt_id": "DEBT-1234",
  "verification_result": "RESOLVED",
  "evidence": "Function now uses withSecurityChecks() wrapper; original missing App Check check no longer present at line 45. File refactored to line 67.",
  "confidence": "HIGH",
  "verified_by": "debt-integration-verifier",
  "verified_date": "2026-03-27",
  "discovery_source": "debt-integration-verifier"
}
```

**Integration point:** This output does NOT go through `intake-audit.js`. It
goes through `resolve-bulk.js` for RESOLVED items, and produces a review queue
for UNCERTAIN items. The orchestrator presents RESOLVED candidates to the user
for confirmation before applying.

**Concurrency note:** This agent is the most expensive — it reads every
MASTER_DEBT item's source file. Run in severity slices: one agent per slice
(S0/S1, S2, S3-sample). The S3 slice should sample 20% of items, not run
exhaustively.

#### Agent 7: `debt-doc-coverage-scanner`

**Scope:** `scripts/`, `lib/`, `functions/src/`, exported TypeScript types in
`types/`

**What it finds:**

- Exported functions without JSDoc headers in scripts (scripts are the primary
  documentation-gap area per the existing `audit-documentation` skill)
- Files missing the standard doc header block (per
  `reference_documentation_standards.md`: doc type, version, date, purpose)
- Public-facing TypeScript types/interfaces with no explanatory comment
- `PROCEDURE.md` or `REFERENCE.md` files that reference script behavior but
  haven't been updated since the script was last modified (detectable by
  comparing git modification dates — agent reads git log via Bash)

**Output schema:** `category: "documentation"`, `type: "missing-docs"`. Lower
severity by default (S3) unless the undocumented function is in a
security-critical path (S2).

---

### 4. Web Dashboard: Discovery Panel Design [CONFIDENCE: MEDIUM]

The web dashboard at `/dev/debt` (D6) needs a **Discovery** tab/panel alongside
the main debt table. Under the hybrid architecture, the web side is read-only —
it displays discovery results, it does NOT trigger discovery runs.

#### Discovery Panel: Three Sub-Sections

**Section A: Discovery History**

- Table:
  `Run Date | Agent Type | Items Found | Items Ingested | Items Rejected | Duration`
- Data source: `docs/technical-debt/logs/intake-log.jsonl` filtered by
  `source_file` matching `discovery-*`
- Supplemented by a new `docs/technical-debt/logs/discovery-runs.jsonl` state
  file (written by the CLI orchestrator)

**Section B: Pending Review Queue**

- Items in staging files (`discovery-*.jsonl`) that have NOT yet been ingested
- Displayed as a filterable table:
  `Agent Type | Severity | Title | File | Confidence`
- "Source" badge (e.g., "debt-code-scanner") on each row enables per-agent
  filtering
- Action: Each row shows "Accept" / "Reject" labels — but these are READ-ONLY
  badges, not clickable buttons (write side stays in CLI per D6)
- The "Accept" / "Reject" state is resolved in CLI by the user, then reflected
  here on next refresh

**Section C: "Run Discovery" Handoff**

- Displays: `Last discovery run: [date or Never]`, `Pending staging files: [N]`
- "Run Discovery" button generates the CLI command string:
  `/debt-runner discover` and copies to clipboard
- Alternatively shows the specific agent command if user selects a scope filter
  from a dropdown
- This is a **clipboard handoff** — exactly the pattern described in
  SQ5-cli-web-handoff.md for the hybrid architecture

**Tag/filter integration:** Discovery results ingested into MASTER_DEBT should
carry a `discovery_source` field in their `source_id` prefix:
`discovery-debt-code-scanner::<fingerprint>`. This enables the web table's
filter bar to support `source: discovery-*` as a filter preset, showing only
AI-discovered items vs. manually-added vs. SonarCloud-synced.

#### Web Visibility After Ingestion

After `intake-audit.js` processes a discovery staging file, the results appear
in the **main debt table** with no special treatment — they are normal
MASTER_DEBT items. The discovery origin is preserved via `source_id` prefix,
which the web table can surface as a badge or filter. There is no separate
"discovered items" table after ingestion; they merge into the main queue.

This is the correct design: the user reviews before ingestion (CLI gate), so by
the time items appear on the web dashboard they are already approved and belong
alongside all other debt.

---

### 5. CLI Orchestration: Discover Mode Sub-Menu Design [CONFIDENCE: HIGH]

The discover mode extends the existing debt-runner menu as mode 8. It has its
own sub-menu:

```
Debt Runner — Discover Mode
Last discovery: [date or Never] | Staging files: [N pending]
Estimated time: ~45 min (7 scan agents + verify agents + synthesis)

1. Full discovery     — Run all 7 agents (sequential priority waves)
2. Targeted discovery — Select specific agent type(s)
3. Scoped discovery   — Run all agents within a directory scope
4. Review pending     — Review existing staging files before ingestion
5. Resume discovery   — Continue interrupted discovery session
6. Verify existing    — Run debt-integration-verifier only

← Back to main menu
```

#### Sub-Menu Option 1: Full Discovery

Execution sequence:

```
[PRE-FLIGHT]  Load hot-spots.json, build MASTER_DEBT hash set
[GATE 1]      "Run full discovery? This will spawn 7 agents across 2 waves. ~45 min. Confirm? [Y/N]"

[WAVE 1 — 4 agents parallel]
  Agent A: debt-code-scanner
  Agent B: debt-pattern-checker
  Agent C: debt-complexity-scanner
  Agent D: debt-test-coverage-auditor

  → Wait for all 4 to report COMPLETE

[WAVE 2 — 3 agents parallel]
  Agent E: debt-schema-drift-checker
  Agent F: debt-doc-coverage-scanner
  Agent G: debt-integration-verifier (S0/S1 slice only in full mode)

  → Wait for all 3 to report COMPLETE

[SYNTHESIS]   Merge staging files, deduplicate, produce delta report
[GATE 2]      Present delta in batches (see Step 7 from SQ10):
              - Critical new items (S0/S1) first
              - Resolved candidates (confirm before marking)
              - Other new items (S2/S3)
              - Severity upgrade suggestions
[INTAKE]      For approved items: node scripts/debt/intake-audit.js staging/discovery-*.jsonl
[RESOLVE]     For confirmed resolutions: node scripts/debt/resolve-bulk.js
[POST-SYNC]   CL sync check (Critical Rule #3 from debt-runner SKILL.md)
```

#### Sub-Menu Option 2: Targeted Discovery

Presents a checklist:

```
Select agent(s) to run [space to toggle, enter to confirm]:
[ ] debt-code-scanner
[ ] debt-pattern-checker
[ ] debt-complexity-scanner
[ ] debt-test-coverage-auditor
[ ] debt-schema-drift-checker
[ ] debt-doc-coverage-scanner
[ ] debt-integration-verifier
```

Selected agents run in parallel (up to 4 concurrent limit). If >4 selected, they
run in waves of 4.

#### Sub-Menu Option 3: Scoped Discovery

```
Enter scope (directory or file glob):
Examples: scripts/   app/api/   lib/firestore-service.ts   "**/*.tsx"

Agents that support scope filtering: code-scanner, pattern-checker, complexity-scanner, doc-coverage-scanner
Agents that ignore scope (run full): test-coverage-auditor, schema-drift-checker, integration-verifier
```

Scope is passed to each agent in its spawn prompt as a `--scope` parameter
restricting which files to read.

#### Sub-Menu Option 4: Review Pending

Lists existing staging files:

```
Pending discovery staging files:
  staging/discovery-debt-code-scanner-2026-03-25.jsonl  (12 items)
  staging/discovery-debt-complexity-scanner-2026-03-25.jsonl  (5 items)

1. Review all (17 items)
2. Review by agent type
3. Intake all without review
4. Discard all staging files
```

Presents items in batches of 5 for user approval before `intake-audit.js` runs.

#### Sub-Menu Option 5: Resume Discovery

Reads `docs/technical-debt/staging/discover-session.json` state file:

```json
{
  "session_id": "discover-2026-03-25-1430",
  "started": "2026-03-25T14:30:00Z",
  "wave_status": {
    "wave_1": {
      "debt-code-scanner": "COMPLETE",
      "debt-pattern-checker": "RUNNING",
      "debt-complexity-scanner": "PENDING",
      "debt-test-coverage-auditor": "PENDING"
    },
    "wave_2": {
      "debt-schema-drift-checker": "PENDING",
      "debt-doc-coverage-scanner": "PENDING",
      "debt-integration-verifier": "PENDING"
    }
  },
  "staging_files": ["staging/discovery-debt-code-scanner-2026-03-25.jsonl"]
}
```

Resume skips already-COMPLETE agents, re-runs PENDING agents.

---

### 6. Concurrency Design: 4-Agent Limit Compliance [CONFIDENCE: HIGH]

The existing 4-agent concurrency limit (established by `audit-comprehensive`
precedent and CLAUDE.md Section 7) is respected by the wave design:

- **Wave 1:** 4 agents (code-scanner, pattern-checker, complexity-scanner,
  test-coverage-auditor) — exactly at the limit
- **Wave 2:** 3 agents (schema-drift-checker, doc-coverage-scanner,
  integration-verifier) — under limit
- **Integration-verifier slices:** If running full integration-verifier (all
  severities), it splits into 3 parallel agents (S0/S1, S2, S3-sample) — also
  under limit

The targeted discovery path handles overselection: if user selects all 7, the
orchestrator automatically staggers into Wave 1 (4 agents), then Wave 2 (3
agents) without user intervention.

No discovery agent may spawn sub-agents (enforced by `disallowedTools: Agent`).
This keeps the total agent count bounded and predictable.

---

### 7. State File Additions for Discover Mode [CONFIDENCE: HIGH]

The existing `.claude/state/debt-runner.state.json` gains a `discover_mode`
section:

```json
{
  "discover_mode": {
    "last_run": "2026-03-25T14:30:00Z",
    "last_run_result": {
      "new_items_found": 17,
      "items_ingested": 12,
      "items_rejected": 3,
      "items_deferred": 2,
      "resolved_candidates": 5,
      "confirmed_resolutions": 4
    },
    "session_in_progress": null,
    "staging_files": []
  }
}
```

This powers the web dashboard's "Last discovery run" display without requiring a
separate log file scan.

Additionally, `docs/technical-debt/logs/discovery-runs.jsonl` is appended after
each complete run:

```json
{
  "run_id": "discover-2026-03-25-1430",
  "completed": "2026-03-25T16:15:00Z",
  "agents_run": [
    "debt-code-scanner",
    "debt-pattern-checker",
    "debt-complexity-scanner",
    "debt-test-coverage-auditor",
    "debt-schema-drift-checker",
    "debt-doc-coverage-scanner"
  ],
  "new_items": 12,
  "resolved_items": 4,
  "duration_minutes": 45
}
```

This JSONL file is the data source for the web dashboard's Discovery History
table.

---

### 8. Existing `intake-audit.js` Gaps for Discovery Use Case [CONFIDENCE: HIGH]

The intake pipeline is sufficient but has two gaps relevant to discovery agents:

**Gap A: No `discovery_source` field in normalized schema**

The `validateAndNormalize()` function in `intake-audit.js` does not preserve a
`discovery_source` field. The normalized MASTER_DEBT item will carry the
`source_id` prefix (`audit:<fingerprint>`) but not an explicit tag identifying
the originating discovery agent.

**Recommended fix:** Add `discovery_source` to the `preserveEnhancementFields`
style passthrough — preserve it from the input JSON if present, store it in
MASTER_DEBT as optional metadata. This is a 3-line addition to
`validateAndNormalize()`.

Without this, web dashboard filtering by discovery agent type requires parsing
the `source_id` prefix, which is fragile.

**Gap B: No batch-source label for the `source_file` field**

The `source_file` field is set to the input filename (e.g.,
`discovery-debt-code-scanner-2026-03-25.jsonl`). This is sufficient to trace
origin from logs, but the web dashboard's filter bar would need to parse
filenames to identify discovery-sourced items. A cleaner approach: add
`source_type: "discovery"` as a passthrough field alongside
`discovery_source: "debt-code-scanner"`.

These two gaps are minor and fixable in the bug-fix-first PR (per D10's
pre-expansion sequencing).

---

### 9. Integration Verifier vs. Existing `verify-resolutions.js` [CONFIDENCE: HIGH]

The `debt-integration-verifier` agent is designed to SUPPLEMENT, not replace,
`verify-resolutions.js`. The existing script:

- Checks if the file still exists
- Checks if the line count is sufficient
- Checks if keywords from the title appear within ±10 lines of original line

The agent adds:

- Reads the actual code at the referenced location
- Applies judgment about whether the described issue is still present
- Detects cases where the file was refactored (line numbers shifted but issue
  persists)
- Identifies cases where the issue was fixed as a side effect of other work (no
  explicit resolution record)

The recommended integration: run `verify-resolutions.js` first (fast,
mechanical). For items it classifies as `UNRESOLVED` (issue still present), the
agent confirms. For items it classifies as `RESOLVED` (keyword gone, file
changed), the agent does a secondary read to verify the resolution is genuine
and not just a rename.

This two-phase approach reduces the agent's workload: it only needs to read
files where the mechanical check has uncertainty, not every MASTER_DEBT item.

---

## Sources

| #   | File Path                                                             | Type             | Trust | Date       |
| --- | --------------------------------------------------------------------- | ---------------- | ----- | ---------- |
| 1   | `.research/debt-runner-expansion/findings-v1/SQ10-discovery-layer.md` | Prior research   | HIGH  | 2026-03-26 |
| 2   | `.research/debt-runner-expansion/DECISIONS_PRE_PLAN.md`               | Decision record  | HIGH  | 2026-03-26 |
| 3   | `scripts/debt/intake-audit.js`                                        | Source code      | HIGH  | In repo    |
| 4   | `.claude/agents/dependency-manager.md`                                | Agent definition | HIGH  | In repo    |
| 5   | `.claude/agents/security-auditor.md`                                  | Agent definition | HIGH  | In repo    |
| 6   | `.claude/agents/performance-engineer.md`                              | Agent definition | HIGH  | In repo    |
| 7   | `.claude/agents/test-engineer.md`                                     | Agent definition | HIGH  | In repo    |
| 8   | `.claude/skills/debt-runner/SKILL.md`                                 | Skill definition | HIGH  | 2026-03-15 |
| 9   | `CLAUDE.md` Section 7                                                 | Project rules    | HIGH  | 2026-03-24 |

---

## Contradictions

**Contradiction 1: SQ10 assumes `integration-verifier` is a discovery agent
(finds new items); this analysis clarifies it is a verification agent (confirms
existing items).**

SQ10-discovery-layer.md placed `integration-verifier` in Wave 5 alongside scan
agents. On closer analysis, its output schema is fundamentally different — it
produces verification records against DEBT-XXXX IDs, not new debt item JSONL. It
should NOT go through `intake-audit.js`. This is a design refinement, not a
conflict, but it affects the wave design: `integration-verifier` runs in Wave 2
alongside scan agents, but its output routes to `resolve-bulk.js`, not the
intake pipeline.

**Contradiction 2: 4-agent wave limit vs. SQ10's wave design.**

SQ10 proposed Waves 1-5 with up to 4 agents each, including a separate "external
source" wave and multiple integration-verifier slices. Under the D10 reduction
to 7 net-new agents, this simplifies to 2 waves (4+3) plus optional
integration-verifier slices. The 5-wave design from SQ10 was appropriate for the
original 9-agent scope but is over-engineered for 7.

---

## Gaps

1. **No `discovery_source` field in MASTER_DEBT schema** — requires a small
   intake-audit.js change to enable per-agent-type filtering on the web
   dashboard. Minor gap, fixable in bug-fix-first PR.

2. **No Jest coverage data in repo** — `debt-test-coverage-auditor` cannot use
   actual coverage percentages. It works from file presence + code reading,
   which is lower precision. A future enhancement would feed
   `jest --coverage --json` output to the agent.

3. **Hot-spots pre-flight step not implemented** — SQ10 described a
   context-loader agent that builds a hot-spots map from prior audit reports.
   This is beneficial but not yet designed in detail. It is an optional
   pre-flight step, not a blocker.

4. **`discover-session.json` resume protocol not tested** — The resume design
   assumes agents write their status to the session file. No existing agent in
   the codebase uses this pattern. The resume feature would need explicit
   implementation in the debt-runner skill and testing.

5. **Token cost estimate** — No empirical estimate for a full 7-agent discovery
   run. Based on `audit-comprehensive` (65 min, 9 agents), estimate 50-60 min
   for 7 agents. The `debt-integration-verifier` cost scales with MASTER_DEBT
   size — currently ~800 items, which is substantial if reading all.

6. **`discovery-runs.jsonl` schema not yet defined** — The web dashboard's
   Discovery History table requires this log file. Its schema is designed here
   but not yet registered in `scripts/config/audit-schema.json` or the TDMS
   PROCEDURE.md.

---

## Serendipity

**`intake-audit.js` already logs `confidence` values from Doc Standards format
to `intake-log.jsonl`** (line 30 of its header comment: "confidence → logged to
intake-log.jsonl (not stored in MASTER_DEBT)"). This means discovery agent
confidence levels (HIGH/MEDIUM/LOW) are automatically persisted to the intake
log without any changes — they just won't appear in MASTER_DEBT items directly.
The web dashboard could read `intake-log.jsonl` to show confidence distributions
for discovery runs.

**The `source_id` prefix pattern is already in use.** `audit:<fingerprint>`
prefixes are set by `intake-audit.js` for all audit-sourced items. A
`discovery-<agent-type>:<fingerprint>` prefix for discovery items follows the
same convention and immediately makes discovery items filterable in the web
dashboard's existing filter bar without any new UI work — the filter bar already
supports `source_id` prefix matching if the API layer surfaces it.

**`debt-integration-verifier` could feed the health dashboard, not just the
resolve pipeline.** If the verifier agent runs in its own periodic "debt health"
sub-mode (separate from full discovery), its UNCERTAIN classification output
could populate the health mode's "stale items needing manual review" metric,
which is currently a gap in the health mode (it uses a 90-day staleness
heuristic, not code-verified staleness).

---

## Confidence Assessment

- HIGH claims: 7 (agent definition pattern, intake sufficiency, 4-agent limit,
  concurrency design, state file additions, verifier vs. verify-resolutions.js,
  source_id prefix)
- MEDIUM claims: 2 (web dashboard Discovery panel design, token cost estimate)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are grounded in direct codebase reading. The design decisions
follow existing patterns (audit-comprehensive concurrency, debt-runner CL rules,
hybrid architecture from D6) without requiring external validation.
