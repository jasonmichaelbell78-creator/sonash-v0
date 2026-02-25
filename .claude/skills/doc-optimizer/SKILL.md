---
name: doc-optimizer
description:
  Scan all docs, auto-fix formatting/headers/links, report issues as JSONL, and
  generate enhancement recommendations
supports_parallel: true
fallback_available: false
estimated_time_parallel: 40 min
estimated_time_sequential: 120 min
---

# Documentation Optimizer

**Version:** 1.4 **Last Updated:** 2026-02-24 **Status:** ACTIVE **Waves:** 5
waves with 13 agents **Output:** `.claude/state/doc-optimizer/`

**What This Does:** Wave-based orchestrator that deploys 13 parallel agents
across 5 waves to analyze, auto-fix, report, and recommend improvements for
every non-archived document in the repository.

**Differentiator from `/audit-documentation`:** That skill is a read-only
diagnostic (18 agents, report-only). This skill is a **repair + enhancement
tool** -- it auto-fixes formatting/headers/links, reports issues as JSONL, AND
generates actionable improvement recommendations.

---

## When to Use

- Tasks related to doc-optimizer
- User explicitly invokes `/doc-optimizer`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## Overview

```
Wave 0: Discovery (Orchestrator, sequential)
  Build file inventory, link graph, metadata index
  ~2 min

Wave 1: Independent Analysis (3 parallel + 1 sequential)
  1A: Format & Lint Fixer (AUTO-FIX)
  1C: External Link Validator (REPORT)
  1D: Content Accuracy Checker (MIXED)
  1B: Header & Metadata Fixer (AUTO-FIX) <- sequential after 1A
  ~8-12 min

Wave 2: Graph-Dependent Analysis (4 parallel)
  2A: Internal Link Fixer (MIXED)
  2B: Orphan & Connectivity (REPORT)
  2C: Freshness & Lifecycle (REPORT)
  2D: Cross-Ref & Deps (REPORT)
  ~8-12 min

Wave 3: Issue Synthesis (2 parallel)
  3A: Coherence & Duplication (REPORT)
  3B: Structure & Classification (REPORT)
  ~5 min

Wave 4: Enhancement & Optimization (3 parallel)
  4A: Quality & Readability Scorer (REPORT)
  4B: Content Gap & Consolidation (REPORT)
  4C: Visual & Navigation Enhancer (REPORT)
  ~8-12 min

Orchestrator: Unify -> Dedupe -> Report -> TDMS intake
  ~5 min

Post-Run: Cleanup
  Delete temp files (.claude/state/doc-optimizer/)
  Identify & remove obsolete audit/review artifacts from docs/
  ~2 min
```

---

## Agent Prompt Specifications

> Read `.claude/skills/doc-optimizer/prompts.md` for full agent prompt
> specifications.

### Agent Summary

| ID  | Name                        | Type     | Wave | Mode     |
| --- | --------------------------- | -------- | ---- | -------- |
| 1A  | Format & Lint Fixer         | AUTO-FIX | 1    | parallel |
| 1B  | Header & Metadata Fixer     | AUTO-FIX | 1    | after 1A |
| 1C  | External Link Validator     | REPORT   | 1    | parallel |
| 1D  | Content Accuracy Checker    | MIXED    | 1    | parallel |
| 2A  | Internal Link Fixer         | MIXED    | 2    | parallel |
| 2B  | Orphan & Connectivity       | REPORT   | 2    | parallel |
| 2C  | Freshness & Lifecycle       | REPORT   | 2    | parallel |
| 2D  | Cross-Ref & Dependency      | REPORT   | 2    | parallel |
| 3A  | Coherence & Duplication     | REPORT   | 3    | parallel |
| 3B  | Structure & Classification  | REPORT   | 3    | parallel |
| 4A  | Quality & Readability       | REPORT   | 4    | parallel |
| 4B  | Content Gap & Consolidation | REPORT   | 4    | parallel |
| 4C  | Visual & Navigation         | REPORT   | 4    | parallel |

---

## Context Safety (Prevents Context Overflow)

> [!CRITICAL] The previous run crashed because 8 agents returned full results to
> the orchestrator, overflowing the context window. These rules are mandatory.

### Agent Return Protocol

**Every agent prompt MUST end with this instruction** (append to all prompts):

```
CRITICAL RETURN PROTOCOL: When you finish, return ONLY this single line:
COMPLETE: [agent-id] wrote N findings to [output-path]
Do NOT include finding details, file listings, summaries, or analysis in your
return message. All details belong in the JSONL output file, not your response.
```

### Orchestrator Must Not Read JSONL Files

The orchestrator checks agent completion via **file existence and line count
only**:

```bash
# CORRECT - check file exists and count lines
wc -l < ".claude/state/doc-optimizer/wave1-format.jsonl" 2>/dev/null || echo "0"

# WRONG - never do this in orchestrator context
# cat .claude/state/doc-optimizer/wave1-format.jsonl
```

### Wave Chunking (Max 2 Waves Per Invocation)

If context is running low (past ~60% usage), **stop after the current wave**,
save progress, and resume in a new invocation. The `progress.json` file tracks
exactly where to resume.

Recommended chunking: Wave 0+1 -> pause -> Wave 2 -> pause -> Wave 3+4 -> unify.

### Shared-State Size Cap

`shared-state.json` inventory entries should include ONLY: `path`, `size_bytes`,
`word_count`. Strip `version`, `last_updated`, `status` fields to reduce file
size. Agents that need metadata should extract it themselves from individual
files.

### Budget Check Between Waves

Before launching each wave, the orchestrator should estimate remaining context.
If the conversation already contains 3+ agent completions, consider saving state
and resuming in a new session rather than risking overflow.

---

## JSONL Finding Schema

Standard schema from `docs/templates/JSONL_SCHEMA_STANDARD.md` plus these
additional fields:

```json
{
  "category": "string",
  "title": "string",
  "fingerprint": "string (<category>::<file>::<id>)",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": "number (0-100)",
  "files": ["array of file paths"],
  "why_it_matters": "string",
  "suggested_fix": "string",
  "acceptance_tests": ["array"],
  "evidence": ["array (optional)"],
  "auto_fixed": "boolean -- whether agent already applied the fix",
  "agent": "string -- which agent produced finding (1A, 1B, etc.)",
  "wave": "number -- which wave (0-4)",
  "finding_type": "issue|enhancement -- distinguishes problems from improvement ideas"
}
```

---

## Output Structure

```
.claude/state/doc-optimizer/
  shared-state.json          # Wave 0: inventory, link graph, metadata
  wave1-format.jsonl         # Agent 1A findings
  wave1-headers.jsonl        # Agent 1B findings
  wave1-external-links.jsonl # Agent 1C findings
  wave1-accuracy.jsonl       # Agent 1D findings
  wave2-internal-links.jsonl # Agent 2A findings
  wave2-orphans.jsonl        # Agent 2B findings
  wave2-lifecycle.jsonl      # Agent 2C findings
  wave2-crossrefs.jsonl      # Agent 2D findings
  wave3-coherence.jsonl      # Agent 3A findings
  wave3-structure.jsonl      # Agent 3B findings
  wave4-quality.jsonl        # Agent 4A findings
  wave4-gaps.jsonl           # Agent 4B findings
  wave4-navigation.jsonl     # Agent 4C findings
  all-findings.jsonl         # Unified + deduped
  progress.json              # Wave/agent progress tracker
  SUMMARY_REPORT.md          # Final human-readable report
```

---

## Execution Flow

### STEP 1: Pre-Flight

```bash
# Create output directory
mkdir -p .claude/state/doc-optimizer

# Verify output directory is safe
STATE_DIR=".claude/state/doc-optimizer"
STATE_PATH=$(realpath "${STATE_DIR}" 2>/dev/null || echo "${STATE_DIR}")
if [ -z "${STATE_DIR}" ] || [ "${STATE_PATH}" = "/" ] || [[ "${STATE_DIR}" == ".."* ]]; then
  echo "FATAL: Invalid or unsafe STATE_DIR"
  exit 1
fi
```

Initialize `progress.json`:

```json
{
  "started": "<ISO datetime>",
  "lastUpdated": "<ISO datetime>",
  "waves": {
    "0": { "status": "pending" },
    "1": {
      "status": "pending",
      "agents": {
        "1A": "pending",
        "1B": "pending",
        "1C": "pending",
        "1D": "pending"
      }
    },
    "2": {
      "status": "pending",
      "agents": {
        "2A": "pending",
        "2B": "pending",
        "2C": "pending",
        "2D": "pending"
      }
    },
    "3": {
      "status": "pending",
      "agents": { "3A": "pending", "3B": "pending" }
    },
    "4": {
      "status": "pending",
      "agents": { "4A": "pending", "4B": "pending", "4C": "pending" }
    }
  },
  "unification": { "status": "pending" },
  "report": { "status": "pending" }
}
```

Load false positives if they exist:

```bash
if [ -f "docs/audits/FALSE_POSITIVES.jsonl" ]; then
  echo "Loaded false positives database"
else
  echo "No false positives database found (proceeding without filter)"
fi
```

### STEP 2: Wave 0 -- Discovery (Orchestrator, sequential)

Build the shared state that all subsequent waves depend on. This runs in the
orchestrator context (not a subagent).

**2.1: Build File Inventory** -- Glob all active .md files, exclude
node_modules, .git, docs/archive. For each, extract: path, size (bytes), word
count.

**2.2: Extract Link Graph** -- For each .md file, extract internal links,
external URLs, and anchor refs with source file and line number.

**2.3: Extract Metadata** -- For each .md file, parse version, lastUpdated,
tier, status from frontmatter or inline headers.

**2.4: Write shared-state.json** -- Inventory + link graph + metadata. Update
`progress.json`: Wave 0 = "completed".

### STEP 3: Wave 1 -- Independent Analysis

Launch 1A + 1C + 1D in parallel (3 agents), then 1B sequentially after 1A.

> Read `.claude/skills/doc-optimizer/prompts.md` -- Wave 1 section for agent
> prompts.

**Wave 1 Checkpoint** -- verify all 4 output files exist. Update progress.json.

### STEP 4: Wave 2 -- Graph-Dependent Analysis

Launch 2A + 2B + 2C + 2D in parallel (4 agents). All receive shared-state.json.

> Read `.claude/skills/doc-optimizer/prompts.md` -- Wave 2 section for agent
> prompts.

**Wave 2 Checkpoint** -- verify all 4 output files exist. Update progress.json.

### STEP 5: Wave 3 -- Issue Synthesis

Launch 3A + 3B in parallel (2 agents).

> Read `.claude/skills/doc-optimizer/prompts.md` -- Wave 3 section for agent
> prompts.

**Wave 3 Checkpoint** -- verify both output files exist. Update progress.json.

### STEP 6: Wave 4 -- Enhancement & Optimization

Launch 4A + 4B + 4C in parallel (3 agents). Each receives shared-state.json plus
awareness of Wave 1-3 finding counts.

> Read `.claude/skills/doc-optimizer/prompts.md` -- Wave 4 section for agent
> prompts.

**Wave 4 Checkpoint** -- verify all 3 output files exist. Update progress.json.

### STEP 7: Unification

Concatenate all 13 JSONL files, deduplicate by fingerprint (keep highest
severity), filter against FALSE_POSITIVES.jsonl, sort by finding_type >
severity > effort > files. Write to `all-findings.jsonl`.

### STEP 8: Report

Generate `SUMMARY_REPORT.md` with: executive summary, severity breakdown,
auto-fixes applied, top 20 issues, top 20 enhancements, per-wave breakdown,
bottom-20 quality scores, content gap analysis, navigation recommendations.

### STEP 9: TDMS Intake (User-Confirmed)

```bash
# Dry run first
node scripts/debt/intake-audit.js .claude/state/doc-optimizer/all-findings.jsonl --source "doc-optimizer-$(date +%Y-%m-%d)" --dry-run

# Real intake (after user approval)
node scripts/debt/intake-audit.js .claude/state/doc-optimizer/all-findings.jsonl --source "doc-optimizer-$(date +%Y-%m-%d)"

# CRITICAL: prevent generate-views.js from overwriting intake results
cp docs/technical-debt/MASTER_DEBT.jsonl docs/technical-debt/raw/deduped.jsonl
```

### STEP 10: Cleanup & Artifact Removal

1. Regenerate docs index: `npm run docs:index`
2. Stage & commit auto-fixed files (ask user first)
3. Delete temp files: `rm -rf .claude/state/doc-optimizer/`
4. Survey and offer to remove obsolete audit artifacts from docs/

**Do NOT remove:** `docs/technical-debt/`, `docs/archive/completed-plans/`,
`docs/templates/`, `docs/agent_docs/`, `docs/decisions/`

---

## Recovery & Error Handling

### progress.json Recovery

If context compacts mid-run, read `progress.json` to determine current state:

| Progress State                       | Resume Action        |
| ------------------------------------ | -------------------- |
| Wave 0 pending                       | Start from beginning |
| Wave 0 complete, Wave 1 pending      | Run Wave 1           |
| Wave 1 complete, Wave 2 pending      | Run Wave 2           |
| Wave 2 complete, Wave 3 pending      | Run Wave 3           |
| Wave 3 complete, Wave 4 pending      | Run Wave 4           |
| Wave 4 complete, unification pending | Run Step 7           |
| Unification complete, report pending | Run Step 8           |

### Agent Failure Handling

- **Empty output:** Log warning, continue. Note in SUMMARY_REPORT.md.
- **Agent crash:** Log in progress.json, continue.
- **Script failure:** Capture stderr, create meta-finding, continue.
- **Edit conflicts:** Agent 1B runs after 1A to avoid this.
- **Wave 4 failures:** Purely additive, don't block unification.

### Context Recovery

```bash
cat .claude/state/doc-optimizer/progress.json 2>/dev/null
ls -1 .claude/state/doc-optimizer/wave*.jsonl 2>/dev/null | wc -l
ls -la .claude/state/doc-optimizer/shared-state.json 2>/dev/null
```

Resume from the last completed wave.

---

## Usage

```
/doc-optimizer
```

No arguments needed. The skill scans all non-archived docs automatically.

---

## Related Skills

- `/audit-documentation` -- Read-only diagnostic audit (18 agents, report-only)
- `/audit-comprehensive` -- Full 7-domain audit including documentation
- `/docs-maintain` -- Quick document sync check

---

## Documentation References

### TDMS Integration (Required for Step 9)

- [PROCEDURE.md](docs/technical-debt/PROCEDURE.md) -- Full TDMS workflow
- [MASTER_DEBT.jsonl](docs/technical-debt/MASTER_DEBT.jsonl) -- Canonical debt
  store

### Documentation Standards

- [JSONL_SCHEMA_STANDARD.md](docs/templates/JSONL_SCHEMA_STANDARD.md) -- Output
  format
- [DOCUMENTATION_STANDARDS.md](docs/DOCUMENTATION_STANDARDS.md) -- 5-tier
  hierarchy

### Scripts Leveraged

| Script                              | Used By  | Purpose                 |
| ----------------------------------- | -------- | ----------------------- |
| `scripts/check-doc-headers.js`      | Agent 1B | Header validation       |
| `scripts/check-docs-light.js`       | Agent 1B | Light doc check         |
| `scripts/check-external-links.js`   | Agent 1C | External URL validation |
| `scripts/check-content-accuracy.js` | Agent 1D | Accuracy checks         |
| `scripts/check-document-sync.js`    | Agent 2D | Template-instance sync  |
| `scripts/check-cross-doc-deps.js`   | Agent 2D | Dependency rules        |
| `scripts/check-doc-placement.js`    | Agent 2C | Placement/archival      |

---

## Update Dependencies

When modifying this skill, also update:

| Document                           | Section                  |
| ---------------------------------- | ------------------------ |
| `docs/SLASH_COMMANDS_REFERENCE.md` | /doc-optimizer reference |
| `.claude/skills/SKILL_INDEX.md`    | Add doc-optimizer entry  |

---

## Version History

| Version | Date       | Description                                                     |
| ------- | ---------- | --------------------------------------------------------------- |
| 1.4     | 2026-02-24 | Extract 13 agent prompts to prompts.md (71% size reduction)     |
| 1.3     | 2026-02-14 | Dedupe CRITICAL RETURN PROTOCOL (13x inline -> 1 shared ref)    |
| 1.2     | 2026-02-07 | Step 10 expanded: temp file cleanup + obsolete artifact removal |
| 1.1     | 2026-02-07 | Context safety: return protocol, wave chunking, budget checks   |
| 1.0     | 2026-02-07 | Initial version: 5-wave, 13-agent doc optimizer                 |
