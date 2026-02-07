# Multi-AI Audit Aggregator Template

**Document Version:** 2.7 **Last Updated:** 2026-02-04 **Tier:** 3 (Planning)

> **⚠️ Multi-Agent Capability Note:** This template assumes orchestration by
> Claude Code which can spawn parallel agents via the Task tool. Other AI
> systems (ChatGPT, Gemini, etc.) cannot call multiple agents and should execute
> sections sequentially or use external orchestration.

---

## Purpose

Aggregation prompt template for merging multiple AI audit outputs into canonical
findings. Supports both Tier-1 (per-category) and Tier-2 (cross-category)
aggregation modes.

## Version History

| Version | Date       | Changes                                                    |
| ------- | ---------- | ---------------------------------------------------------- |
| 2.4     | 2026-01-17 | Added Post-Aggregation Actions section with roadmap update |
| 2.3     | 2026-01-05 | Added evidence rules and consensus scoring                 |
| 1.0     | 2026-01-03 | Initial aggregator template                                |

---

## Model Recommendations (Current as of 2026-02-07)

You want: long-context + strict instruction following + reliable tool/terminal
behavior.

### Best Single-Model Aggregator

**Claude Opus 4.6** - Comprehensive aggregation brain with excellent
instruction-following and code review reliability. Positioned as most precise
with fewer tool-calling errors.

**Alternative:** Claude Sonnet 4.5 - Faster/leaner option with top coding/agent
performance.

### Best for Terminal + Verification

**GPT-5-Codex** - Explicitly optimized for long-horizon coding, large
refactors/migrations, and reliable tool calling.

**Alternative:** GPT-5 Thinking - Spare-no-compute option with strong
long-context.

### Best for Autonomous Execution

**Gemini 3 Pro** (in Jules) - Improved agentic reliability and intent alignment.
Great for implementing PR plans after aggregation.

### Recommended Setup

**For Tier-1 Aggregation (per-category):** Claude Sonnet 4.5 or GPT-5-Codex
**For Tier-2 Aggregation (cross-category):** Claude Opus 4.6 or GPT-5 Thinking

---

## Aggregation Modes

This template supports TWO distinct aggregation modes:

### Tier-1 Mode: Per-Category Aggregation

**Input:** Raw AI outputs from 3+ models for a SINGLE category

- FINDINGS_JSONL (one per model)
- SUSPECTED_FINDINGS_JSONL (one per model)
- HUMAN_SUMMARY (optional)

**Output:** Category-level CANON file (e.g., `CANON-CODE.jsonl`,
`CANON-SECURITY.jsonl`)

**Purpose:** Deduplicate and verify findings within ONE audit category before
moving to next category.

**Categories (7 total):**

1. Code Review (Hygiene, Types, Boundaries, Security, Testing)
2. Security Audit (Rate Limiting, Validation, Secrets, Auth, Firebase,
   Dependencies, OWASP)
3. Performance (Bundle, Rendering, Data Fetching, Memory, Web Vitals)
4. Refactoring (Duplication, Types, Architecture, Security Hardening, Testing)
5. Documentation (Cross-References, Staleness, Coverage, Tier Compliance,
   Frontmatter)
6. Process/Automation (CI/CD, Hooks, Scripts, Pattern Checker, Triggers,
   Documentation)
7. Engineering Productivity (Golden Path, Debugging Ergonomics, Offline Support,
   CI/CD Efficiency, Test Infrastructure)

### Tier-2 Mode: Cross-Category Unification

**Input:** 7 category-level CANON files (NOT raw AI outputs)

- CANON-CODE.jsonl
- CANON-SECURITY.jsonl
- CANON-PERF.jsonl
- CANON-REFACTOR.jsonl
- CANON-DOCS.jsonl
- CANON-PROCESS.jsonl
- CANON-ENG-PROD.jsonl

**Output:** Final unified DEDUPED_FINDINGS_JSONL + PR_PLAN_JSON

**Purpose:** Deduplicate across categories, identify cross-cutting issues,
produce coordinated PR plan.

**Important:** Tier-2 runs ONCE after ALL 7 categories complete Tier-1.

---

## AGGREGATION PROMPT

Use this prompt with your selected model. Specify which mode you're running.

### ROLE

You are the Multi-AI Audit Aggregator. Your job is to merge multiple AI audit
outputs into one deduped, ranked backlog and a staged PR plan — while actively
verifying and filtering hallucinations using repo access + lightweight tooling.

### NON-NEGOTIABLE PRINCIPLES

- You are an AGGREGATOR-FIRST system, not a fresh auditor
- You MUST NOT invent files, symbols, or claims not supported by (a) auditor
  outputs OR (b) your verification searches/tests
- You MAY expand a reported duplication cluster by discovering additional
  instances during verification (same pattern), but you must not introduce
  unrelated new findings
- In Tier-2 mode, you ONLY work with pre-aggregated CANON files, never with raw
  AI outputs

### AGGREGATION MODE

**Specify which mode before starting:**

MODE: <TIER-1 | TIER-2>

**If TIER-1:**

- Category: <CODE | SECURITY | PERF | REFACTOR | DOCS | PROCESS>
- Input sources: <List model names, e.g., "Claude Opus 4.6, GPT-5-Codex, Gemini
  3 Pro">

**If TIER-2:**

- Input: 6 CANON-\*.jsonl files (already category-aggregated)
- Focus: Cross-category deduplication and PR coordination

### REPO CONTEXT

Repo URL: <PASTE REPO URL HERE> Branch/commit: <PASTE HERE OR "default">

### PRE-AGGREGATION CONTEXT (TIER-1 ONLY)

Before processing raw AI outputs, review project-specific baselines:

1. **Pattern Compliance:** npm run patterns:check (baseline violations)
2. **Dependency Health:**
   - Circular dependencies: npm run deps:circular (expect 0)
   - Unused exports: npm run deps:unused
3. **Static Analysis:** SonarCloud baseline
   - 778 total issues (47 CRITICAL cognitive complexity) as of 2026-01-05
4. **SonarCloud MCP (if available):** Query real-time issue counts via MCP
   server
   - `mcp__sonarcloud__get_issues` with `types: "CODE_SMELL,BUG,VULNERABILITY"`
     and `severities: "CRITICAL,MAJOR"`
   - `mcp__sonarcloud__get_security_hotspots` with `status: "TO_REVIEW"`
   - Compare current counts against manifest baseline to identify drift
   - Server config: `scripts/mcp/sonarcloud-server.js` (requires SONAR_TOKEN)
5. **AI Learnings:** claude.md Section 4, docs/AI_REVIEW_LEARNINGS_LOG.md

### INPUT YOU WILL RECEIVE

**TIER-1 Mode:** N auditor outputs (N >= 3 recommended). Each output contains:

- CAPABILITIES line
- FINDINGS_JSONL (1 JSON object per line)
- SUSPECTED_FINDINGS_JSONL (1 JSON object per line)
- HUMAN_SUMMARY (optional, non-canonical)

**TIER-2 Mode:** 6 CANON files (JSONL format). Each line is already a canonical
finding with:

- canonical_id
- All standard CANON fields (see schema below)

### FIRST: CAPABILITIES (REQUIRED)

Before processing, print exactly:

```
AGG_CAPABILITIES: repo_checkout=<yes/no>, run_commands=<yes/no>, can_search_code=<yes/no>, limitations="<one sentence>"
```

**If repo_checkout=no OR can_search_code=no:**

- Run in "NO-REPO MODE": dedupe only; no verification
- Still follow all output formats

**Otherwise:** Continue in VERIFICATION MODE (default)

### SETUP (VERIFICATION MODE)

Goal: do not install heavy tools unless already present.

1. Ensure you have a local checkout of the repo (clone if needed)
2. Install dependencies ONLY if needed to run repo scripts:
   - Prefer `npm ci` if package-lock.json exists; otherwise `npm install`
3. Determine available scripts via package.json and prefer existing commands

### COMMAND CHECKLIST (run if available; do not fail if one fails)

**Quality gates:**

- npm run lint (or closest lint script)
- npm run typecheck (or `tsc --noEmit`)
- npm test (or closest test script)

**Project-specific:**

- npm run patterns:check (anti-pattern violations)
- npm run deps:circular (circular dependency check)
- npm run deps:unused (unused export check)

Record failures as SHORT evidence bullets (paths + brief message), not full
logs.

### NORMALIZATION (TIER-1 Mode)

**Categories** must map to canonical set based on audit type:

- Code Review: Hygiene/Duplication | Types/Correctness | Next/React Boundaries |
  Security | Testing
- Security Audit: Rate Limiting | Input Validation | Secrets Management |
  Authentication | Firebase Security | Dependency Security | OWASP
- Performance: Bundle Size | Rendering | Data Fetching | Memory | Core Web
  Vitals
- Refactoring: Hygiene/Duplication | Types/Correctness | Architecture/Boundaries
  | Security Hardening | Testing Infrastructure
- Documentation: Cross-Reference | Staleness | Coverage Gaps | Tier Compliance |
  Frontmatter
- Process: CI/CD | Hooks | Scripts | Pattern Checker | Triggers | Workflow Docs

**Severity:** S0–S3 **Effort:** E0–E3

If a JSONL line is invalid JSON: drop it and record it in PARSE_ERRORS_JSON.

### EVIDENCE RULES (anti-hallucination)

A canonical finding can be CONFIRMED only if it has:

- files[] non-empty AND
- EITHER:
  - symbols[] non-empty (code findings), OR
  - for docs/process findings: a concrete locator in evidence (e.g., Markdown
    heading/anchor, broken link target, workflow name + job/step id, script
    name + command) AND
- verification finds those files exist (and ideally the symbol/locator appears
  via search)

Otherwise it is SUSPECTED.

### DEDUPLICATION RULES

**TIER-1 Mode (within single category):**

1. Primary merge key: fingerprint (exact match) when well-formed
2. Secondary merge (if fingerprints differ): merge if ALL true:
   - same category
   - overlap: >=1 shared file OR >=1 shared symbol
   - titles + suggested_fix describe the same refactor direction
3. Duplication clusters:
   - Merge by union of instances (unique by file+symbol)
   - During verification, you may add more instances only if the same pattern is
     clearly present
4. Never merge purely "similar vibes" without evidence overlap

**TIER-2 Mode (across categories):**

1. Primary merge: Same file + same root issue (even if categorized differently)
2. Cross-cutting detection: Findings that appear in multiple categories likely
   need coordination
3. Dependency chains: Map prerequisites across categories (e.g., refactor before
   security fix)
4. Never merge if remediation approaches conflict

### CONSENSUS + SCORING (for each canonical finding)

**TIER-1 Mode:** Compute:

- sources: contributing model names
- confirmations: count of sources that listed it in FINDINGS_JSONL
- suspects: count of sources that listed it in SUSPECTED_FINDINGS_JSONL
- tool_confirmed_sources: sources where that model had run_commands=yes AND
  provided meaningful evidence[]
- consensus_score (0–5):
  - +2 if >=2 confirmed sources
  - +1 if >=3 total sources mention (confirmed or suspected)
  - +1 if any tool_confirmed_sources >=1
  - +1 if shared evidence overlap across sources (shared file/symbol)
- final_confidence:
  - Start with max(confidence) among contributing lines, then adjust:
    - if only 1 source and no tool confirmation: cap at 60 unless you verify
      strongly
    - if all mentions are suspected: cap at 40 unless you verify strongly
    - if >=2 confirmed + evidence overlap: floor at 70
- cross_cutting_bonus: +1 if duplication_cluster.instances >= 3

**TIER-2 Mode:** Consensus already established in Tier-1. Focus on:

- Cross-category duplication: Same issue reported in multiple categories
- Impact escalation: Issue more severe when considering cross-category effects
- Coordination needs: Which PRs need to happen together

### VERIFICATION MODE (repo access available)

**DO THIS FOR:**

- All duplication clusters
- All S0/S1 items
- Top 25 remaining items by preliminary rank

**Verification procedure per canonical finding:**

1. FILE EXISTENCE:
   - Confirm each file path exists in repo
   - For non-file locators (workflow names, script names): verify via
     `ls .github/workflows/` or `ls scripts/`

2. SYMBOL/LOCATOR PRESENCE:
   - For code findings: search for each symbol in the referenced files (prefer
     rg; fallback grep)
   - For docs/process findings: verify the locator exists (heading anchor,
     workflow job/step, script command)

3. CLUSTER VERIFICATION (if duplication_cluster.is_cluster=true):
   - Run targeted searches to confirm repeated pattern
   - Expand instances ONLY if same pattern is present

4. QUALITY-GATE CORRELATION:
   - If lint/type/test output supports the finding, add a short evidence bullet

**Set:**

- verification_status: VERIFIED | PARTIALLY_VERIFIED | UNVERIFIED | SKIPPED
- verification_notes: short reason (e.g., "file exists; symbol not found",
  "verified via rg occurrences=7")

### RANKING

Rank canonical findings by:

1. severity (S0 highest)
2. consensus_score (higher first)
3. final_confidence (higher first)
4. effort (lower first if ties)
5. cross_cutting_bonus (higher first if ties)

### PR PLANNING

Goal: small, reviewable PRs.

**TIER-1 Mode:** Group within category

- Primary grouping: pr_bucket_suggestion
- Secondary: file overlap + dependencies

**TIER-2 Mode:** Coordinate across categories

- Identify prerequisite chains (refactor → security → performance)
- Group related fixes across categories
- Avoid conflicts (same file in multiple PRs)

**Rules (both tiers):**

- Each PR should ideally touch <=10 files (estimate using union of files
  referenced)
- If bigger, split into staged PRs (PR1a/PR1b/PR1c)
- Respect dependencies (a PR may depend on prior PRs)
- Front-load low-risk duplication/hygiene that unlocks later work
- Always include acceptance_tests per PR (at least lint + typecheck + tests if
  available)

### OUTPUT FORMAT (STRICT ORDER)

**Important:** Output each section in order. **Output rules:**

- Machine-readable sections (JSON and JSONL): output raw JSON without
  surrounding code fences.
- JSONL sections: output one raw JSON object per line.
- Markdown sections (summaries): normal Markdown formatting is acceptable.

**TIER-1 Mode Output:**

1. PARSE_ERRORS_JSON (if any) { "parse_errors":
   [{"model":"...","line":"...","reason":"..."}], "dropped_count": <int> }

2. CANON-<CATEGORY>.jsonl (e.g., CANON-CODE.jsonl) One JSON object per line.
   Schema (fenced here for readability; actual output has no fences):

```json
{
  "canonical_id": "CANON-0001",
  "category": "...",
  "title": "...",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "status": "CONFIRMED|SUSPECTED",
  "final_confidence": 0-100,
  "consensus_score": 0-5,
  "sources": ["model1", "model2"],
  "confirmations": <int>,
  "suspects": <int>,
  "tool_confirmed_sources": <int>,
  "verification_status": "VERIFIED|PARTIALLY_VERIFIED|UNVERIFIED|SKIPPED",
  "verification_notes": "...",
  "files": ["path1", "path2"],
  "symbols": ["SymbolA", "SymbolB"],
  "duplication_cluster": {
    "is_cluster": true/false,
    "cluster_summary": "...",
    "instances": [{"file":"...","symbol":"..."}],
    "consolidation_target": "..."
  },
  "why_it_matters": "...",
  "suggested_fix": "...",
  "acceptance_tests": ["..."],
  "pr_bucket_suggestion": "...",
  "dependencies": ["CANON-0003"],
  "evidence_summary": ["..."],
  "notes": "..."
}
```

3. CATEGORY_SUMMARY.md

- Top 10 findings for this category
- Quick wins (E0-E1)
- High-risk items (S0-S1)
- Recommended within-category PR sequence

**TIER-2 Mode Output:**

1. PARSE_ERRORS_JSON (if cross-category conflicts found)

2. DEDUPED_FINDINGS_JSONL (unified, cross-category deduplicated) Same schema as
   CANON-\*.jsonl but with:

- Cross-category notes in "notes" field
- Updated dependencies showing cross-category prerequisites

**CANONICAL_ID ASSIGNMENT (DETERMINISTIC; BOTH TIERS)**

- Recompute IDs from the final deduped set every run (do not preserve source
  IDs).
- Sort findings by: severity (S0→S3), consensus_score (desc), final_confidence
  (desc), effort (E0→E3), category (asc), title (asc), files[0] or "" if empty
  (asc). Final tiebreaker ensures deterministic ordering.
- Assign sequential IDs: CANON-0001, CANON-0002, ...
- In Tier-1, IDs are still `CANON-0001` style (the filename indicates the
  category); do NOT embed category into the ID.

3. PR_PLAN_JSON (fenced for readability; output raw JSON)

```json
{
  "prs": [
    {
      "pr_id": "PR1",
      "title": "...",
      "goal": "...",
      "categories_involved": ["CODE", "SECURITY"],
      "included_canonical_ids": ["CANON-0007", "CANON-0012"],
      "staging": ["PR1a", "PR1b"],
      "risk_level": "low|medium|high",
      "estimated_effort": "E0|E1|E2|E3",
      "prerequisites": ["PR0"],
      "acceptance_tests": ["npm run lint", "npm run typecheck", "npm test"],
      "notes": "review guidance + pitfalls"
    }
  ],
  "execution_order": ["PR1", "PR2", "PR3"],
  "parallel_groups": [
    ["PR2a", "PR2b"],
    ["PR3a", "PR3b", "PR3c"]
  ]
}
```

4. HUMAN_SUMMARY.md

- Overall audit summary across all 6 categories
- Top 10 quick wins (lowest effort, highest impact)
- Top 5 high-risk/high-payoff refactors
- Key duplication clusters to consolidate
- Items demoted as hallucinations
- Recommended implementation order

5. AI_HEALTH_SCORE.json (NEW - 2026-02-02)

For AI-generated codebases, calculate and output:

```json
{
  "overall_score": 0-100,
  "factors": {
    "hallucination_rate": {
      "score": 0-100,
      "weight": 0.30,
      "details": "X imports verified, Y APIs validated"
    },
    "test_validity": {
      "score": 0-100,
      "weight": 0.25,
      "details": "X tests with meaningful assertions"
    },
    "error_handling": {
      "score": 0-100,
      "weight": 0.20,
      "details": "X% of functions have try/catch"
    },
    "consistency_score": {
      "score": 0-100,
      "weight": 0.15,
      "details": "Pattern consistency across files"
    },
    "documentation_drift": {
      "score": 0-100,
      "weight": 0.10,
      "details": "X% of docs match actual code"
    }
  },
  "high_risk_areas": ["file1.ts", "file2.tsx"],
  "recommendations": ["Fix hallucinated imports", "Add error handling"]
}
```

**Cross-Reference AI Findings:**

- Deduplicate hallucinations found by multiple audits
- Merge consistency findings across code/security/performance
- Calculate composite AI Health Score (with dependencies)

---

## Post-Aggregation Actions

After completing aggregation (either Tier-1 or Tier-2), perform these updates:

1. **Update AUDIT_TRACKER.md** - Add entry to "Multi-AI Audit Log" table:
   - Date: Today's date
   - Categories: Categories included in this aggregation
   - Models Used: List of AI models that contributed
   - Total Findings: Canonical finding count
   - Aggregated To: Path to output CANON file(s)

2. **Update Technical Debt Backlog** - Re-aggregate all findings:

   ```bash
   npm run aggregate:audit-findings
   ```

   This updates `docs/aggregation/MASTER_ISSUE_LIST.md` and the Technical Debt
   Backlog section in `ROADMAP.md`. Review the updated counts and ensure new
   findings are properly categorized and prioritized.

3. **Update Version History** - If template changes were needed during this
   aggregation, update the Version History table at the bottom of this document.

---

## Triage & Roadmap Integration

After TDMS intake, triage new items into the roadmap:

### 1. Review New Items

Check newly added DEBT-XXXX items:

```bash
# View recent additions
tail -50 docs/technical-debt/MASTER_DEBT.jsonl | jq -r '[.id, .severity, .category, .title[:60]] | @tsv'
```

### 2. Priority Scoring

Beyond S0-S3 severity, use composite scoring:

| Factor         | Weight | Calculation                  |
| -------------- | ------ | ---------------------------- |
| Severity       | 40%    | S0=100, S1=50, S2=20, S3=5   |
| Cross-domain   | 20%    | +50% per additional domain   |
| Effort inverse | 20%    | E0=4x, E1=2x, E2=1x, E3=0.5x |
| Dependency     | 10%    | +25% if blocks other items   |
| File hotspot   | 10%    | +25% if file has 3+ findings |

**Formula:**

```
priority = severity_score × cross_domain_mult × effort_inv × dep_mult × hotspot_mult
```

### 3. Track Assignment Rules

Items auto-assign based on category + file patterns:

| Category      | File Pattern            | Track    |
| ------------- | ----------------------- | -------- |
| security      | \*                      | Track-S  |
| performance   | \*                      | Track-P  |
| process       | \*                      | Track-D  |
| refactoring   | \*                      | M2.3-REF |
| documentation | \*                      | M1.5     |
| code-quality  | scripts/, .claude/      | Track-E  |
| code-quality  | .github/                | Track-D  |
| code-quality  | tests/                  | Track-T  |
| code-quality  | functions/              | M2.2     |
| code-quality  | components/, lib/, app/ | M2.1     |

See `docs/technical-debt/views/unplaced-items.md` for current assignments.

### 4. Update ROADMAP.md

Add DEBT-XXXX references to appropriate tracks:

**Individual items:**

```markdown
- [ ] DEBT-0875: Firebase credentials written to disk (S1)
```

**Bulk items:**

```markdown
- [ ] DEBT-0869 through DEBT-0880: Process automation gaps (S2, bulk)
```

### 5. Consistency Check

```bash
node scripts/debt/sync-roadmap-refs.js --check-only
```

Reports orphaned refs, unplaced items, and status mismatches.

### 6. Review Cadence

| Trigger                  | Action                            |
| ------------------------ | --------------------------------- |
| After multi-AI audit     | Full triage of all new items      |
| After single-model audit | Triage items from that audit      |
| Weekly                   | Check unplaced-items.md for drift |
| Before sprint planning   | Review S0/S1 items for inclusion  |

---

## Version History

| Version | Date       | Changes                                                                                                                                                                                                                                                                                                                                                                   | Author   |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 2.7     | 2026-02-04 | Added Tier 3 designation and multi-agent capability caveat; Added Engineering Productivity as 7th category (CANON-ENG-PROD.jsonl)                                                                                                                                                                                                                                         | Claude   |
| 2.6     | 2026-02-03 | Added Triage & Roadmap Integration section with priority scoring formula, track assignment rules, and review cadence                                                                                                                                                                                                                                                      | Claude   |
| 2.5     | 2026-02-02 | Added AI_HEALTH_SCORE.json output with factor weights (hallucination rate, test validity, error handling, consistency, documentation drift). Added cross-reference AI findings section.                                                                                                                                                                                   | Claude   |
| 2.4     | 2026-01-17 | Added Post-Aggregation Actions section with roadmap update instructions; linked to `npm run aggregate:audit-findings` for automatic MASTER_ISSUE_LIST.md and ROADMAP.md updates                                                                                                                                                                                           | Claude   |
| 2.3     | 2026-01-06 | Review #68: Added empty files[] fallback to sorting; Varied bullet starters in output format section; Capitalized Markdown consistently                                                                                                                                                                                                                                   | Claude   |
| 2.2     | 2026-01-06 | Review #67: Added deterministic tiebreaker (files[0]) to ID sorting; Clarified verification for non-file locators; Capitalized Markdown proper noun                                                                                                                                                                                                                       | Claude   |
| 2.1     | 2026-01-05 | Review #66: Fixed model name (GPT-5-Codex), clarified evidence rules for docs/process findings, removed code fences from JSON output examples, fixed deterministic ID sort (removed fingerprint), renamed Process subcategory to Workflow Docs                                                                                                                            | Claude   |
| 2.0     | 2026-01-05 | Major rewrite for 2-tier aggregation (per-category → cross-category); Added 6-category framework; Updated AI models (Opus 4.5, Sonnet 4.5, GPT-5-Codex, Gemini 3 Pro); Added tooling references (patterns:check, deps:circular, deps:unused, SonarQube); Explicit TIER-1 and TIER-2 modes with different inputs/outputs; Updated schema to match JSONL_SCHEMA_STANDARD.md | Claude   |
| 1.0     | 2025-12-28 | Initial aggregator prompt creation                                                                                                                                                                                                                                                                                                                                        | Original |

---

**END OF AGGREGATOR.md**
