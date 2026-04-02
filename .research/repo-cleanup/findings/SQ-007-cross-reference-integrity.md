# SQ-007: Cross-Reference Integrity Audit

**Audit Date:** 2026-03-23 **Scope:** All major index/registry files vs
filesystem

---

## Executive Summary

Most indexes are healthy. **3 issues found:** stale SKILL_INDEX.md, missing
memory file, COMMAND_REFERENCE.md skill count mismatch.

---

## Index Health Matrix

| Index/Registry                 | Entries   | Valid                 | Ghost     | Missing from Index | Last Updated | Status  |
| ------------------------------ | --------- | --------------------- | --------- | ------------------ | ------------ | ------- |
| DOCUMENTATION_INDEX.md         | 582       | 580+                  | 0-2       | <10                | 2026-03-23   | HEALTHY |
| CLAUDE.md Section 7 (Skills)   | 11        | 11                    | 0         | 0                  | embedded     | HEALTHY |
| CLAUDE.md Section 7 (Agents)   | 6         | 2 custom + 4 built-in | 0         | 0                  | embedded     | MINOR   |
| CLAUDE.md Section 8 (Ref Docs) | 5         | 5                     | 0         | 0                  | 2026-03-21   | HEALTHY |
| COMMAND_REFERENCE.md           | 61 skills | 61                    | 0         | 3 missing          | 2026-03-19   | MINOR   |
| SKILL_INDEX.md                 | Claims 67 | 64 actual             | 0         | ~3                 | 2026-03-13   | STALE   |
| SESSION_CONTEXT.md             | 7 links   | 7                     | 0         | 0                  | 2026-03-23   | HEALTHY |
| MEMORY.md                      | 25 refs   | 24                    | 1 missing | 0                  | 2026-03-18   | MINOR   |

---

## Findings

### Finding #1: SKILL_INDEX.md is Stale (MEDIUM)

- **Last updated:** 2026-03-13 (10 days old)
- **Claims:** 67 skills
- **Actual:** 64 skill directories
- **Action:** Regenerate SKILL_INDEX.md

### Finding #2: Missing Memory File (MEDIUM)

- **File:** `feedback_learnings_must_complete.md`
- **Referenced in:** MEMORY.md index
- **Status:** File does not exist in memory directory
- **Action:** Create the memory file or remove the index entry

### Finding #3: COMMAND_REFERENCE.md Skill Count Mismatch (LOW)

- **Listed:** 61 skills
- **Actual:** 64 skill directories
- **Missing from index:** `/debt-runner` and ~2 others
- **Action:** Update COMMAND_REFERENCE.md skill enumeration

### Finding #4: Built-in Agents in COMMAND_REFERENCE.md (INFORMATIONAL)

- 4 built-in Task tool agents (general-purpose, Explore, Plan, Bash) listed
  alongside custom agents
- These have no .md files because they're built into Claude Code
- **Action:** Add note in COMMAND_REFERENCE.md clarifying these are built-in,
  not custom agents

---

## Verified as Healthy

- CLAUDE.md Section 8 reference docs: 5/5 valid ✓
- SESSION_CONTEXT.md links: 7/7 valid ✓
- DOCUMENTATION_INDEX.md: auto-generated, current ✓
- All 24 agent .md files: exist ✓
- All 61 listed skill SKILL.md files: exist ✓
