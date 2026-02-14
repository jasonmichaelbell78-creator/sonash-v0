# AI Optimization Audit Report (2026-02-14)

**Document Version:** 1.0 **Last Updated:** 2026-02-14 **Status:** ACTIVE

## Purpose

Executive summary of the AI Optimization audit covering hook efficiency, skill
architecture, MCP configuration, context optimization, memory/state management,
dead assets, parsing format, and instruction bloat across the SoNash AI
development environment.

---

## Executive Summary

**92 raw findings** across 8 audit stages were deduplicated into **83 unique
findings**.

9 findings were merged as duplicates or subsets (e.g., three separate findings
about session-start.js verbose output were consolidated into one).

### Findings by Severity

| Severity | Count | Description          |
| -------- | ----- | -------------------- |
| S0       | 0     | Critical / blocking  |
| S1       | 2     | High impact          |
| S2       | 37    | Medium impact        |
| S3       | 44    | Low impact / cleanup |

### Findings by Effort

| Effort | Count | Description             |
| ------ | ----- | ----------------------- |
| E0     | 31    | Immediate (< 15 min)    |
| E1     | 40    | Short-term (< 2 hours)  |
| E2     | 12    | Medium-term (2-8 hours) |
| E3     | 0     | Long-term (> 8 hours)   |

**No S0 (critical) findings.** The two S1 findings are high-impact performance
issues in PostToolUse hook chains that affect every Edit and Write operation.

---

## Domain Heatmap

| Domain        | Finding Count | Highest Severity | Key Concern                                                             |
| ------------- | ------------- | ---------------- | ----------------------------------------------------------------------- |
| Hooks         | 29            | S2               | Process spawn overhead, redundant file reads, decorative output         |
| Skills        | 23            | S2               | Agent prompt quality, boilerplate duplication, oversized SKILL.md files |
| Skill Index   | 12            | S2               | 9 orphaned skills missing from index, duplicate listings, wrong count   |
| MCP Config    | 5             | S2               | Unused/redundant servers, dead code paths, stale permissions            |
| Settings      | 5             | S1               | 10 sequential hook spawns per Write, duplicated hook lists              |
| State Files   | 4             | S2               | No rotation on append-only files, malformed data, stale entries         |
| Documentation | 2             | S3               | Completed plan not archived, missing index entries                      |
| Scripts       | 2             | S3               | Path concatenation, duplicated patterns                                 |
| Memory        | 1             | S3               | Stale COMPLETE entries in MEMORY.md                                     |

---

## Top 10 Highest-Impact Items

Sorted by severity (S1 first), then effort (E0 = quick wins first).

### 1. PostToolUse Write: 10 sequential hook processes per Write operation

- **Severity:** S1 | **Effort:** E2
- **Fix:** Consolidate into a single unified PostToolUse hook that runs all
  checks in-process. Each current hook does simple regex/string matching -- no
  reason to spawn separate processes. Saves ~9 process spawns (~270-450ms) per
  Write.

### 2. PostToolUse Edit: 9 sequential hook processes per Edit operation

- **Severity:** S1 | **Effort:** E2
- **Fix:** Same consolidation as Write hooks. Create a unified post-tool-use.js
  that accepts CLAUDE_TOOL as parameter. Share file content reads across checks.

### 3. compaction-handoff.js uses execSync (shell) instead of execFileSync

- **Severity:** S2 | **Effort:** E0
- **Fix:** Change execSync to execFileSync with array arguments. Simple
  find-and-replace matching the pattern already used in commit-tracker.js.

### 4. session-start.js outputs 40+ decorative lines with redundant checklist

- **Severity:** S2 | **Effort:** E1
- **Fix:** Move SESSION CHECKLIST to stderr. Keep only actionable warnings on
  stdout. Consolidate to summary table.

### 5. Multi-line regex with greedy quantifier in auto-save-context.js

- **Severity:** S2 | **Effort:** E1
- **Fix:** Replace [\s\S]\*? regex with line-split parsing per the two-strikes
  rule.

### 6. Fragile markdown field parsing regex repeated across 3+ scripts

- **Severity:** S2 | **Effort:** E1
- **Fix:** Extract to scripts/lib/parse-markdown-field.js shared helper.

### 7. PostToolUse Read: 3 hooks with redundant state file reads

- **Severity:** S2 | **Effort:** E1
- **Fix:** Consolidate into single context-monitor.js hook. Read
  .context-tracking-state.json once.

### 8. Duplicate file content reads across 7 PostToolUse hooks

- **Severity:** S2 | **Effort:** E1
- **Fix:** In consolidated hook, read file once and pass content to all check
  functions.

### 9. SessionStart: check-remote-session-context.js runs git fetch on critical path

- **Severity:** S2 | **Effort:** E1
- **Fix:** Cache git fetch result with TTL of 5+ minutes. Move to
  background/async.

### 10. UserPromptSubmit: 4 hooks run on every user message

- **Severity:** S2 | **Effort:** E1
- **Fix:** Consolidate into single user-prompt-handler.js. Read all state files
  once. Run pattern matching in single pass.

---

## Quick Wins (S2+ with E0 Effort)

These items can be fixed immediately with minimal effort (under 15 minutes
each).

| #   | Title                                                       | Severity | Fix                                       |
| --- | ----------------------------------------------------------- | -------- | ----------------------------------------- |
| 1   | compaction-handoff.js uses execSync instead of execFileSync | S2       | Change to execFileSync with array args    |
| 2   | Orphaned skill: find-skills not in SKILL_INDEX.md           | S2       | Add to Infrastructure & Setup category    |
| 3   | Orphaned skill: pre-commit-fixer not in SKILL_INDEX.md      | S2       | Add to Audit & Code Quality category      |
| 4   | Orphaned skill: task-next not in SKILL_INDEX.md             | S2       | Add to Planning category                  |
| 5   | Orphaned skill: multi-ai-audit not in SKILL_INDEX.md        | S2       | Add to Audit & Code Quality category      |
| 6   | Orphaned skill: add-debt not in SKILL_INDEX.md              | S2       | Add to Project Specific category          |
| 7   | Orphaned skill: verify-technical-debt not in SKILL_INDEX.md | S2       | Add to Project Specific category          |
| 8   | Orphaned skill: pr-retro not in SKILL_INDEX.md              | S2       | Add to Project Specific category          |
| 9   | Orphaned skill: sonarcloud not in SKILL_INDEX.md            | S2       | Replace sonarcloud-sprint with sonarcloud |
| 10  | Orphaned skill: test-suite not in SKILL_INDEX.md            | S2       | Add to Testing category                   |

**Total S2/E0 items: 10** (all fixable in under 30 minutes combined -- most are
single-line additions to SKILL_INDEX.md)

---

## Recommended Action Plan

### Phase 1: Immediate (E0 -- under 2 hours total)

31 findings. Focus on quick wins and cleanup.

**Skill Index Fixes (10 items, ~30 min):**

1. Add 9 orphaned skills to SKILL_INDEX.md (find-skills, pre-commit-fixer,
   task-next, multi-ai-audit, add-debt, verify-technical-debt, pr-retro,
   sonarcloud, test-suite)
2. Remove duplicate listings (code-reviewer, senior-fullstack)
3. Update total skill count

**MCP/Settings Cleanup (6 items, ~20 min):** 4. Remove git entry from
.mcp.json 5. Remove github from enabledMcpjsonServers 6. Remove
mcp**filesystem**_ permissions from settings.local.json 7. Remove mcp**serena**_
permissions from settings.local.json 8. Update mcp.global-template.json:
puppeteer -> playwright 9. Document firebase MCP dependency or remove

**State/File Cleanup (5 items, ~15 min):** 10. Delete stale
task-audit-template-overhaul.state.json 11. Delete .claude/tmp-alerts.json 12.
Add ephemeral state cleanup to session-end (.session-agents.json,
.agent-trigger-state.json) 13. Remove COMPLETE entries from MEMORY.md 14. Remove
unused fields from commit-tracker.js output

**Hook Quick Fixes (4 items, ~20 min):** 15. Change compaction-handoff.js
execSync -> execFileSync 16. Cache project directory realpathSync in
pattern-check.js 17. Delete orphaned check-edit-requirements.js and
check-write-requirements.js 18. Use fs.statSync for line estimation in
large-context-warning.js

**Documentation (2 items, ~10 min):** 19. Move completed TDMS plan to
archive 20. Run npm run docs:index for missing files

### Phase 2: Short-term (E1 -- 1-2 weeks)

40 findings. Focus on hook consolidation and context reduction.

**Hook Consolidation (highest impact, ~8 items):**

1. Consolidate 4 UserPromptSubmit hooks into single user-prompt-handler.js
2. Consolidate 3 PostToolUse Read hooks into single context-monitor.js
3. Cache git fetch in check-remote-session-context.js with TTL
4. Add fast-path to alerts-reminder.js (skip when no pending-alerts.json)
5. Use combined hook matcher in settings.json for Write/Edit/MultiEdit
6. Add cooldown to alerts-reminder.js context injection
7. Add session-level deduplication to analyze-user-request.js
8. Move session-start.js checklist from stdout to stderr

**Skill Architecture (~9 items):** 9. Add CRITICAL RETURN PROTOCOL to
audit-process agent prompts 10. Add JSONL schema to audit-documentation agent
prompts 11. Add JSONL schema to audit-enhancements agent prompts 12. Add
FALSE_POSITIVES.jsonl to audit-process and audit-enhancements 13. Delete
superseded sonarcloud-sprint skill 14. Merge checkpoint + save-context
skills 15. Merge docs-sync + docs-update skills 16. Add structured prompts to
pre-commit-fixer

**Context Optimization (~6 items):** 17. session-begin: read only Active Sprint
from ROADMAP.md (offset/limit) 18. session-begin: read only Quick Reference from
CODE_PATTERNS.md 19. session-begin: make Steps 8-9 conditional 20. Remove
redundant sections 0b/1b from session-begin SKILL.md 21. Add staleness check to
compact-restore.js 22. Remove generic boilerplate from code-reviewer SKILL.md

**State Management (~7 items):** 23. Add rotation to commit-log.jsonl (cap
at 200) 24. Limit handoff.json commitLog to 15 entries 25. Add rotation to
reviews.jsonl (cap at 50) 26. Add expiry to warned-files.json (30-day) 27. Add
rotation to override-log.jsonl 28. Add rotation to agent-invocations.jsonl 29.
Fix sprint extraction regex in velocity track-session.js

**Other (~3 items):** 30. Add lightweight cleanup to session-start.js for
begin/end imbalance 31. Extract markdown field parsing to shared helper 32.
Extract JSONL line counting to shared helper

### Phase 3: Medium-term (E2 -- 2-4 weeks)

12 findings. Focus on architectural improvements.

**Hook Architecture (3 items, highest ROI):**

1. Consolidate 10 PostToolUse Write hooks into single unified hook (S1)
2. Consolidate 9 PostToolUse Edit hooks into same unified hook (S1)
3. Parallelize session-start.js execSync calls with Promise.all

**Skill Architecture (6 items):** 4. Extract CRITICAL RETURN PROTOCOL to shared
template in doc-optimizer 5. Create audit-shared-base.md for common audit skill
content 6. Split pr-review SKILL.md into core + reference 7. Split
audit-comprehensive SKILL.md into core + reference 8. Create design skill
decision tree (frontend-design/ui-design-system/ux-researcher) 9. Merge
webapp-testing into test-suite

**Other (3 items):** 10. Convert hook error output to structured JSON
(decorative -> machine-readable) 11. Extract pattern-check.js inline patterns to
external config 12. Convert audit-process Stage 1 from markdown to JSONL

---

## Version History

| Version | Date       | Change                                                  |
| ------- | ---------- | ------------------------------------------------------- |
| 1.0     | 2026-02-14 | Initial audit report from 8-stage AI optimization audit |
