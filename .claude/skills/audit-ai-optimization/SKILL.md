---
name: audit-ai-optimization
description: Run a single-session AI optimization audit on the codebase
supports_parallel: true
fallback_available: true
estimated_time_parallel: 30 min
estimated_time_sequential: 90 min
---

# Single-Session AI Optimization Audit

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** ACTIVE
<!-- prettier-ignore-end -->

This audit evaluates the AI-related infrastructure for efficiency: token waste,
skill overlap, hook latency, context management, and automation gaps. It covers
**12 domains** across **3 stages** with parallel agent execution.

---

## Quick Reference

| Stage | Name              | Parallel Agents | Output                           |
| ----- | ----------------- | --------------- | -------------------------------- |
| 1     | Core Efficiency   | 3               | `stage-1-*.jsonl`                |
| 2     | Extended Analysis | 5 (2 waves)     | `stage-2-*.jsonl`                |
| 3     | Synthesis         | 3               | `stage-3-*.jsonl` + final report |

**Total: 11 agents across 3 stages**

---

## CRITICAL: Persistence Rules

**EVERY agent MUST write outputs directly to files. NEVER rely on conversation
context.**

1. **Agent outputs go to files, not conversation**
   - Each agent prompt MUST include:
     `Write findings to: ${AUDIT_DIR}/[filename].jsonl`
   - Agents must use Write tool or Bash to create files
   - If agent returns text instead of writing file, RE-RUN with explicit file
     instruction

2. **Verify after each stage**
   - After parallel agents complete, verify all output files exist
   - Check file sizes are non-zero: `wc -l ${AUDIT_DIR}/*.jsonl`
   - If any file missing, do NOT proceed to next stage

3. **CRITICAL RETURN PROTOCOL**
   - Agents must return ONLY: `COMPLETE: [id] wrote N findings to [path]`
   - Orchestrator checks completion via `wc -l` on JSONL files
   - Do NOT read agent output content into orchestrator context

---

## 12 Audit Domains

| #   | Domain                  | Stage | What to Check                                 |
| --- | ----------------------- | ----- | --------------------------------------------- |
| 1   | Dead documentation      | 1     | Stale/orphaned .md files, unused docs         |
| 2   | Dead scripts            | 1     | Never-called scripts, orphaned npm scripts    |
| 3   | Fragile parsing         | 1     | Regex-heavy parsing that should use AST/JSON  |
| 4   | Format waste            | 1     | Verbose output formats consuming extra tokens |
| 5   | AI instruction bloat    | 1     | Overly long SKILL.md, CLAUDE.md, hook prompts |
| 6   | Hook latency            | 2     | Slow hooks blocking user workflow             |
| 7   | Subprocess overhead     | 2     | Redundant child processes in hooks/scripts    |
| 8   | Skill overlap           | 2     | Skills doing the same thing differently       |
| 9   | Agent prompt quality    | 2     | Vague/missing agent prompts, no output format |
| 10  | MCP config efficiency   | 2     | Unused MCP servers, misconfigured tools       |
| 11  | Context optimization    | 2     | Excessive context loading, unnecessary reads  |
| 12  | Memory/state management | 2     | Bloated state files, missing cleanup          |

---

## Execution Mode Selection

| Condition                                 | Mode       | Time    |
| ----------------------------------------- | ---------- | ------- |
| Task tool available + no context pressure | Parallel   | ~30 min |
| Task tool unavailable                     | Sequential | ~90 min |
| Context running low (<20% remaining)      | Sequential | ~90 min |
| User requests sequential                  | Sequential | ~90 min |

---

## Pre-Audit Setup

### Step 0: Episodic Memory Search

```javascript
mcp__plugin_episodic -
  memory_episodic -
  memory__search({
    query: ["ai-optimization", "token waste", "hook performance"],
    limit: 5,
  });
```

### Step 1: Check Thresholds

```bash
npm run review:check
```

### Step 2: Create Audit Directory

```bash
AUDIT_DATE=$(date +%Y-%m-%d)
AUDIT_DIR="docs/audits/single-session/ai-optimization/audit-${AUDIT_DATE}"
mkdir -p "${AUDIT_DIR}"
```

### Step 2.5: Verify Output Directory Variable (CRITICAL)

```bash
echo "AUDIT_DIR is: ${AUDIT_DIR}"
ls -la "${AUDIT_DIR}" || echo "ERROR: AUDIT_DIR does not exist"

AUDIT_PATH=$(realpath "${AUDIT_DIR}" 2>/dev/null || echo "${AUDIT_DIR}")
REPO_ROOT=$(realpath "." 2>/dev/null || echo ".")
if [ -z "${AUDIT_DIR}" ] || [ "${AUDIT_PATH}" = "/" ] || [ "${AUDIT_PATH}" = "${REPO_ROOT}" ]; then
  echo "FATAL: AUDIT_DIR must be a proper subdirectory under the repo, not root"
  exit 1
fi
```

### Step 3: Load Baselines

```bash
# Read false positives
cat docs/technical-debt/FALSE_POSITIVES.jsonl 2>/dev/null

# Read prior audit results
ls docs/audits/single-session/ai-optimization/ 2>/dev/null

# Count baseline metrics for comparison
wc -l .claude/skills/*/SKILL.md 2>/dev/null | tail -1
wc -l .claude/hooks/*.js 2>/dev/null | tail -1
ls scripts/*.js | wc -l
```

---

## Stage 1: Core Efficiency (3 Agents, Parallel)

**Goal:** Identify dead assets, fragile parsing, and token waste.

### Agent 1A: Dead Assets

```
Task(subagent_type="Explore", prompt="""
Audit dead/orphaned documentation and scripts in this codebase:

**Dead Documentation:**
- Find .md files not referenced by any other file (grep for filename)
- Check docs/ for files with "DEPRECATED" or "ARCHIVED" that aren't in archive/
- Find docs with last-modified date >60 days old that aren't reference docs
- Check DOCUMENTATION_INDEX.md for entries pointing to missing files

**Dead Scripts:**
- Find scripts/*.js files not referenced in package.json, hooks, or other scripts
- Check npm scripts in package.json for commands that reference missing files
- Find scripts with no callers (grep for filename across repo)
- Check .claude/hooks/*.js for unused hook scripts

**Output Format:** JSONL with one finding per line:
{"category":"ai-optimization","title":"...","fingerprint":"ai-optimization::FILE::dead-TYPE","severity":"S2|S3","effort":"E0|E1","confidence":0-100,"files":["path"],"why_it_matters":"...","suggested_fix":"...","acceptance_tests":["..."]}

CRITICAL: Write findings to: ${AUDIT_DIR}/stage-1a-dead-assets.jsonl
Use the Write tool. Return ONLY: COMPLETE: 1A wrote N findings to ${AUDIT_DIR}/stage-1a-dead-assets.jsonl
""")
```

### Agent 1B: Fragile Parsing & Format Waste

```
Task(subagent_type="Explore", prompt="""
Audit fragile parsing patterns and format waste:

**Fragile Parsing (Domains 3-4):**
- Find regex-heavy markdown parsing that could use a library or line-split
- Check for multi-line regex with greedy quantifiers (ReDoS risk)
- Find scripts parsing JSON with regex instead of JSON.parse
- Check for string manipulation where path.join/path.resolve should be used

**Format Waste:**
- Find verbose console.log output in hooks (token cost per session)
- Check for redundant status messages that repeat information
- Find scripts generating human-readable output that's only machine-consumed
- Check JSONL files for fields that are always null/empty

**Output Format:** JSONL per finding:
{"category":"ai-optimization","title":"...","fingerprint":"ai-optimization::FILE::ISSUE","severity":"S1|S2|S3","effort":"E0|E1|E2","confidence":0-100,"files":["path"],"why_it_matters":"...","suggested_fix":"...","acceptance_tests":["..."]}

CRITICAL: Write findings to: ${AUDIT_DIR}/stage-1b-parsing-format.jsonl
Return ONLY: COMPLETE: 1B wrote N findings to ${AUDIT_DIR}/stage-1b-parsing-format.jsonl
""")
```

### Agent 1C: AI Instruction Bloat

```
Task(subagent_type="Explore", prompt="""
Audit AI instruction efficiency (Domain 5):

**SKILL.md Bloat:**
- Measure line counts of all .claude/skills/*/SKILL.md files
- Flag skills >500 lines — check for duplicated boilerplate
- Compare skills that share >50% content (should reference shared base)
- Check for example code blocks >20 lines (should be external files)

**CLAUDE.md Efficiency:**
- Check CLAUDE.md for content that could be in on-demand reference docs
- Verify the progressive disclosure model is working (Tier 1-4)
- Check if any Tier 1 content exceeds the ~120 line budget

**Hook Prompt Bloat:**
- Check .claude/hooks/*.js for inline prompts >10 lines
- Find hooks that read large files into prompt context unnecessarily
- Check SessionStart output size (tokens consumed per session start)

**Output Format:** JSONL per finding:
{"category":"ai-optimization","title":"...","fingerprint":"ai-optimization::FILE::ISSUE","severity":"S2|S3","effort":"E0|E1|E2","confidence":0-100,"files":["path"],"why_it_matters":"...","suggested_fix":"...","acceptance_tests":["..."]}

CRITICAL: Write findings to: ${AUDIT_DIR}/stage-1c-instruction-bloat.jsonl
Return ONLY: COMPLETE: 1C wrote N findings to ${AUDIT_DIR}/stage-1c-instruction-bloat.jsonl
""")
```

### Stage 1 Checkpoint

```bash
# Verify all Stage 1 outputs exist
for f in stage-1a-dead-assets.jsonl stage-1b-parsing-format.jsonl stage-1c-instruction-bloat.jsonl; do
  if [ ! -s "${AUDIT_DIR}/$f" ]; then
    echo "MISSING: $f — re-run agent"
  else
    echo "OK: $f ($(wc -l < "${AUDIT_DIR}/$f") findings)"
  fi
done
```

---

## Stage 2: Extended Analysis (5 Agents, 2 Waves)

**Goal:** Analyze hook performance, skill architecture, MCP config, context
usage, and state management.

### Wave 2A (3 agents, parallel)

#### Agent 2A: Hook Efficiency

```
Task(subagent_type="Explore", prompt="""
Audit hook efficiency (Domains 6-7):

**Hook Latency:**
- Read all .claude/hooks/*.js files
- Identify hooks that spawn child processes (execFileSync, execSync, spawnSync)
- Check for sequential operations that could be parallel
- Measure complexity: count file reads, external calls, JSON parses per hook
- Flag hooks with >3 sequential external calls

**Subprocess Overhead:**
- Find hooks that call `node scripts/...` for simple checks
- Check for redundant process spawning (same script called by multiple hooks)
- Find hooks that read large files (>10KB) synchronously
- Check if any hooks duplicate work done by other hooks

**Output Format:** JSONL per finding:
{"category":"ai-optimization","title":"...","fingerprint":"ai-optimization::FILE::ISSUE","severity":"S1|S2|S3","effort":"E0|E1|E2","confidence":0-100,"files":["path"],"why_it_matters":"...","suggested_fix":"...","acceptance_tests":["..."]}

CRITICAL: Write findings to: ${AUDIT_DIR}/stage-2a-hook-efficiency.jsonl
Return ONLY: COMPLETE: 2A wrote N findings to ${AUDIT_DIR}/stage-2a-hook-efficiency.jsonl
""")
```

#### Agent 2B: Skill Architecture

```
Task(subagent_type="Explore", prompt="""
Audit skill architecture (Domains 8-9):

**Skill Overlap:**
- Read all .claude/skills/*/SKILL.md frontmatter (name, description)
- Identify skills with overlapping purposes
- Check for skills that reference the same scripts/tools
- Flag skill pairs with >30% shared scope

**Agent Prompt Quality:**
- Check skills that define agent prompts (Task tool calls)
- Verify each agent prompt includes: output file path, JSONL format, evidence req
- Flag prompts missing the CRITICAL RETURN PROTOCOL
- Check for vague prompts ("analyze the code" without specific instructions)

**Output Format:** JSONL per finding:
{"category":"ai-optimization","title":"...","fingerprint":"ai-optimization::FILE::ISSUE","severity":"S2|S3","effort":"E0|E1|E2","confidence":0-100,"files":["path"],"why_it_matters":"...","suggested_fix":"...","acceptance_tests":["..."]}

CRITICAL: Write findings to: ${AUDIT_DIR}/stage-2b-skill-architecture.jsonl
Return ONLY: COMPLETE: 2B wrote N findings to ${AUDIT_DIR}/stage-2b-skill-architecture.jsonl
""")
```

#### Agent 2C: MCP Config

```
Task(subagent_type="Explore", prompt="""
Audit MCP configuration efficiency (Domain 10):

**MCP Server Usage:**
- Read .claude/mcp.json (or mcp.json) for configured servers
- Check which MCP tools are actually called in skills/hooks
- Flag servers configured but never used
- Check for duplicate tool capabilities across servers

**MCP Tool Efficiency:**
- Find mcp__* calls in skills/hooks — are they necessary?
- Check for MCP calls that could be replaced by local operations
- Flag tools with high latency that have local alternatives

**Output Format:** JSONL per finding:
{"category":"ai-optimization","title":"...","fingerprint":"ai-optimization::FILE::ISSUE","severity":"S2|S3","effort":"E0|E1","confidence":0-100,"files":["path"],"why_it_matters":"...","suggested_fix":"...","acceptance_tests":["..."]}

CRITICAL: Write findings to: ${AUDIT_DIR}/stage-2c-mcp-config.jsonl
Return ONLY: COMPLETE: 2C wrote N findings to ${AUDIT_DIR}/stage-2c-mcp-config.jsonl
""")
```

### Wave 2B (2 agents, parallel)

#### Agent 2D: Context Optimization

```
Task(subagent_type="Explore", prompt="""
Audit context window optimization (Domain 11):

**Excessive Context Loading:**
- Check session-begin skill for how many files are read at startup
- Verify progressive disclosure tiers work (Tier 1 always, Tier 2-4 on-demand)
- Find skills that read entire large files when they only need a section
- Check for hooks that inject large blocks into conversation context

**Unnecessary Reads:**
- Find patterns where the same file is read multiple times in a skill
- Check for skills that read files not relevant to their domain
- Flag read operations for files >500 lines where only headers are needed

**Output Format:** JSONL per finding:
{"category":"ai-optimization","title":"...","fingerprint":"ai-optimization::FILE::ISSUE","severity":"S2|S3","effort":"E0|E1|E2","confidence":0-100,"files":["path"],"why_it_matters":"...","suggested_fix":"...","acceptance_tests":["..."]}

CRITICAL: Write findings to: ${AUDIT_DIR}/stage-2d-context-optimization.jsonl
Return ONLY: COMPLETE: 2D wrote N findings to ${AUDIT_DIR}/stage-2d-context-optimization.jsonl
""")
```

#### Agent 2E: Memory & State Management

```
Task(subagent_type="Explore", prompt="""
Audit memory and state management (Domain 12):

**Bloated State Files:**
- Check .claude/state/ for files >100KB
- Check .claude/hooks/ for state files that grow without bounds
- Find JSONL log files without rotation/archival logic
- Check if override-log.jsonl, commit-log.jsonl, etc. have size caps

**Missing Cleanup:**
- Check session-end skill for state cleanup completeness
- Find temporary files that persist across sessions
- Check for state files referenced in code but never created
- Verify handoff.json cleanup logic works

**Memory Files:**
- Check MEMORY.md size (should stay under 200 lines)
- Find topic memory files that are stale or redundant
- Check if memory files contradict current codebase state

**Output Format:** JSONL per finding:
{"category":"ai-optimization","title":"...","fingerprint":"ai-optimization::FILE::ISSUE","severity":"S2|S3","effort":"E0|E1|E2","confidence":0-100,"files":["path"],"why_it_matters":"...","suggested_fix":"...","acceptance_tests":["..."]}

CRITICAL: Write findings to: ${AUDIT_DIR}/stage-2e-memory-state.jsonl
Return ONLY: COMPLETE: 2E wrote N findings to ${AUDIT_DIR}/stage-2e-memory-state.jsonl
""")
```

### Stage 2 Checkpoint

```bash
for f in stage-2a-hook-efficiency.jsonl stage-2b-skill-architecture.jsonl stage-2c-mcp-config.jsonl stage-2d-context-optimization.jsonl stage-2e-memory-state.jsonl; do
  if [ ! -s "${AUDIT_DIR}/$f" ]; then
    echo "MISSING: $f — re-run agent"
  else
    echo "OK: $f ($(wc -l < "${AUDIT_DIR}/$f") findings)"
  fi
done
```

---

## Stage 3: Synthesis (3 Agents, Parallel)

**Goal:** Identify automation gaps, cross-cutting patterns, and priority
ranking.

### Agent 3A: Automation Gaps

```
Task(subagent_type="Explore", prompt="""
Analyze automation coverage gaps (Domain: Automation Gaps):

Read ALL Stage 1 and Stage 2 findings from ${AUDIT_DIR}/stage-*.jsonl.

**Identify:**
- Manual processes that should be automated
- Checks that exist but aren't wired into hooks/CI
- Scripts that are run manually but could be hook-triggered
- Missing quality gates in the pre-commit/pre-push chain
- Pattern compliance rules that should be added

**Output Format:** JSONL per finding:
{"category":"ai-optimization","title":"...","fingerprint":"ai-optimization::FILE::ISSUE","severity":"S1|S2|S3","effort":"E1|E2|E3","confidence":0-100,"files":["path"],"why_it_matters":"...","suggested_fix":"...","acceptance_tests":["..."]}

CRITICAL: Write findings to: ${AUDIT_DIR}/stage-3a-automation-gaps.jsonl
Return ONLY: COMPLETE: 3A wrote N findings to ${AUDIT_DIR}/stage-3a-automation-gaps.jsonl
""")
```

### Agent 3B: Cross-Cutting Patterns

```
Task(subagent_type="Explore", prompt="""
Analyze cross-cutting patterns across all audit findings:

Read ALL Stage 1 and Stage 2 findings from ${AUDIT_DIR}/stage-*.jsonl.

**Identify:**
- Patterns that appear across multiple domains (e.g., same issue in hooks AND skills)
- Systemic issues (e.g., all scripts missing error handling)
- Root causes that explain multiple findings
- Cascading issues (fixing A would also fix B, C)

**Output Format:** JSONL per pattern:
{"category":"ai-optimization","title":"Cross-cutting: ...","fingerprint":"ai-optimization::cross-cutting::PATTERN","severity":"S1|S2","effort":"E1|E2|E3","confidence":0-100,"files":["file1","file2"],"why_it_matters":"...","suggested_fix":"...","acceptance_tests":["..."]}

CRITICAL: Write findings to: ${AUDIT_DIR}/stage-3b-cross-cutting.jsonl
Return ONLY: COMPLETE: 3B wrote N findings to ${AUDIT_DIR}/stage-3b-cross-cutting.jsonl
""")
```

### Agent 3C: Synthesis & Priority Ranking

```
Task(subagent_type="general-purpose", prompt="""
Synthesize all findings into a prioritized report:

Read ALL findings from ${AUDIT_DIR}/stage-*.jsonl.

**Create two outputs:**

1. **Deduplicated findings JSONL** — Merge all stage findings, remove duplicates
   (same fingerprint), merge related findings into composite items where appropriate.
   Write to: ${AUDIT_DIR}/all-findings-deduped.jsonl

2. **Executive summary report** with:
   - Total findings by severity (S0/S1/S2/S3)
   - Top 10 highest-impact items (sorted by severity then effort)
   - Domain heatmap: which of the 12 domains has most findings
   - Quick wins: S2+ items with E0 effort
   - Recommended action plan (grouped by sprint/phase)

   Write to: ${AUDIT_DIR}/AI_OPTIMIZATION_AUDIT_REPORT.md

CRITICAL: Write BOTH files. Return ONLY: COMPLETE: 3C wrote N deduped findings + report
""")
```

### Stage 3 Checkpoint

```bash
for f in stage-3a-automation-gaps.jsonl stage-3b-cross-cutting.jsonl all-findings-deduped.jsonl AI_OPTIMIZATION_AUDIT_REPORT.md; do
  if [ ! -s "${AUDIT_DIR}/$f" ]; then
    echo "MISSING: $f — re-run agent"
  else
    echo "OK: $f"
  fi
done
```

---

## Interactive Review (MANDATORY — before TDMS intake)

**Do NOT ingest findings into TDMS until the user has reviewed them.**

### Presentation Format

Present findings in **batches of 3-5 items**, grouped by severity (S0 first,
then S1, S2, S3). Within each severity, group by theme for coherence. Each item
shows:

```
### DEBT-XXXX: [Title]
**Severity:** S_ | **Effort:** E_ | **Confidence:** _%
**Current:** [What exists now]
**Suggested Fix:** [Concrete remediation]
**Acceptance Tests:** [How to verify]
**Counter-argument:** [Why NOT to do this]
**Recommendation:** ACCEPT/DECLINE/DEFER — [Reasoning]
```

Do NOT present all items at once — batches of 3-5 keep decisions manageable.
Wait for user decisions on each batch before presenting the next.

### Decision Tracking (Compaction-Safe)

Create `${AUDIT_DIR}/REVIEW_DECISIONS.md` after the first batch to track all
decisions. Update after each batch. This file survives context compaction.

### Processing Decisions

After each batch:

- Record decisions in REVIEW_DECISIONS.md
- If DECLINED: remove from findings before TDMS intake
- If DEFERRED: keep in TDMS as NEW status for future planning
- If ACCEPTED: proceed to TDMS intake

### Post-Review Summary

After ALL findings reviewed, summarize:

- Total accepted / declined / deferred
- Proceed to TDMS Intake with accepted + deferred items only

---

## Post-Audit

### 1. Validate Schema

```bash
node scripts/debt/validate-schema.js ${AUDIT_DIR}/all-findings-deduped.jsonl
```

### 2. TDMS Intake

```bash
node scripts/debt/intake-audit.js ${AUDIT_DIR}/all-findings-deduped.jsonl \
  --source "audit-ai-optimization-$(date +%Y-%m-%d)"
```

### 3. Regenerate Views

```bash
node scripts/debt/generate-views.js
node scripts/debt/generate-metrics.js
```

### 4. Update AUDIT_TRACKER.md

Update the AI Optimization row with audit date and finding counts.

### 5. Commit Results

```bash
git add ${AUDIT_DIR}/ docs/technical-debt/
git commit -m "audit(ai-optimization): $(wc -l < ${AUDIT_DIR}/all-findings-deduped.jsonl) findings across 12 domains"
```

---

## Sequential Fallback

If parallel execution is not available, run agents sequentially in this order:

1. Agent 1A (Dead Assets)
2. Agent 1B (Parsing & Format)
3. Agent 1C (Instruction Bloat)
4. Agent 2A (Hook Efficiency)
5. Agent 2B (Skill Architecture)
6. Agent 2C (MCP Config)
7. Agent 2D (Context Optimization)
8. Agent 2E (Memory & State)
9. Agent 3A (Automation Gaps)
10. Agent 3B (Cross-Cutting)
11. Agent 3C (Synthesis)

Run checkpoints after agents 3, 8, and 11.

---

## Context Recovery

If the session is interrupted (compaction, timeout, crash):

1. **Check for state file:**
   `.claude/state/audit-ai-optimization-<date>.state.json`
2. **If state file exists and is < 24 hours old:** Resume from last completed
   stage
3. **If state file is stale (> 24 hours):** Start fresh — findings may be
   outdated
4. **Always preserve:** Any partial findings already written to the output
   directory
5. **Re-derive AUDIT_DIR:** Look at the most recent
   `docs/audits/single-session/ai-optimization/audit-*` directory
6. **Re-read this SKILL.md** for agent prompts

### State File Format

```json
{
  "audit_type": "ai-optimization",
  "date": "YYYY-MM-DD",
  "stage_completed": "analysis|review|report",
  "partial_findings_path": "docs/audits/single-session/ai-optimization/audit-YYYY-MM-DD/",
  "last_updated": "ISO-8601"
}
```

---

## Version History

| Version | Date       | Change           |
| ------- | ---------- | ---------------- |
| 1.0     | 2026-02-14 | Initial creation |
