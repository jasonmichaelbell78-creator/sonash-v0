# SQ-001b: File Inventory — Skills, Agents, and Documentation

**Audit Date:** 2026-03-23 **Scope:** .claude/skills/, .claude/agents/, docs/,
root documentation

---

## Executive Summary

67 skills, 37 agents, 14 root docs, 582 active documents tracked. All skills and
agents are registered. No orphans detected in this layer.

---

## Skills Inventory (67 total)

### By Category

| Category                | Count | All Have SKILL.md? |           All Registered?            |
| ----------------------- | ----- | :----------------: | :----------------------------------: |
| Audit & Code Quality    | 28    |         ✓          |       ✓ (COMMAND_REFERENCE.md)       |
| Planning & Research     | 2     |         ✓          | ✓ (CLAUDE.md S7 + COMMAND_REFERENCE) |
| Session Management      | 5     |         ✓          |                  ✓                   |
| Code/Development        | 14    |         ✓          |                  ✓                   |
| Documentation & Content | 5     |         ✓          |                  ✓                   |
| Design & UX             | 3     |         ✓          |                  ✓                   |
| Testing & Analysis      | 6     |         ✓          |                  ✓                   |
| Miscellaneous           | 4     |         ✓          |                  ✓                   |

### Structural Completeness

- 67/67 have SKILL.md with YAML frontmatter ✓
- 67/67 have version history ✓
- ~40 have REFERENCE.md companion files ✓
- Standards enforced by SKILL_STANDARDS.md (v2.0)

### CLAUDE.md Trigger Registration

- **20 skills** in CLAUDE.md Section 7 PRE-TASK/POST-TASK tables (enforced
  triggers)
- **47 skills** in COMMAND_REFERENCE.md only (discoverable specialty tools)
- This split is intentional — not all skills need enforcement

---

## Agents Inventory (37 total)

| Type                 | Count | All Have .md? |       All Registered?        |
| -------------------- | ----- | :-----------: | :--------------------------: |
| Core agents          | 17    |       ✓       |   ✓ (COMMAND_REFERENCE.md)   |
| GSD pipeline agents  | 10    |       ✓       |    ✓ (via gsd-\* skills)     |
| Deep-research agents | 2     |       ✓       | ✓ (via /deep-research skill) |
| Specialty agents     | 8     |       ✓       |   ✓ (COMMAND_REFERENCE.md)   |

All 37 agents have complete YAML frontmatter (name, description, tools, model,
maxTurns).

### CLAUDE.md Trigger Registration

- **6 agents** explicitly in CLAUDE.md S7 triggers (code-reviewer,
  security-auditor, frontend-developer, documentation-expert, Explore, Plan)
- **31 agents** in COMMAND_REFERENCE.md (discoverable)

---

## Root Documentation (14 files)

| File                   | Version/Date     | Referenced In CLAUDE.md? | Status  |
| ---------------------- | ---------------- | :----------------------: | ------- |
| CLAUDE.md              | v5.6, 2026-03-17 |      (IS CLAUDE.md)      | CURRENT |
| AI_WORKFLOW.md         | 2026-03-19       |           S8 ✓           | CURRENT |
| ROADMAP.md             | 2026-03-19       |         S4, S8 ✓         | CURRENT |
| SESSION_CONTEXT.md     | 2026-03-23       |           S8 ✓           | CURRENT |
| DOCUMENTATION_INDEX.md | 2026-03-23       |        Generated         | CURRENT |
| ARCHITECTURE.md        | 2026-03-19       |            No            | CURRENT |
| DEVELOPMENT.md         | 2026-03-19       |            No            | CURRENT |
| CHANGELOG.md           | 2026-03-22       |            No            | CURRENT |
| README.md              | 2026-03-22       |            No            | CURRENT |
| CONTRIBUTING.md        | 2026-03-18       |            No            | CURRENT |
| SECURITY.md            | 2026-03-18       |            No            | CURRENT |
| CODE_OF_CONDUCT.md     | 2026-03-19       |            No            | CURRENT |
| ROADMAP_FUTURE.md      | 2026-03-19       |            No            | CURRENT |
| ROADMAP_LOG.md         | 2026-03-19       |            No            | CURRENT |

## .claude/ Documentation (7 files)

- COMMAND_REFERENCE.md (v5.8) ✓
- CROSS_PLATFORM_SETUP.md ✓
- HOOKS.md ✓
- REQUIRED_PLUGINS.md ✓
- STATE_SCHEMA.md ✓
- skills/SKILL_INDEX.md (v2.5) ✓
- skills/\_shared/SKILL_STANDARDS.md (v2.0) ✓

## docs/agent_docs/ (10 files)

All 10 files are actively referenced in CLAUDE.md:

- AGENT_ORCHESTRATION.md, CONTEXT_PRESERVATION.md, PRE_GENERATION_CHECKLIST.md
- CODE_PATTERNS.md, SECURITY_CHECKLIST.md, POSITIVE_PATTERNS.md
- TESTING_SYSTEM.md, FIX_TEMPLATES.md, SKILL_AGENT_POLICY.md
- SKILL_ECOSYSTEM_AUDIT_IDEAS.md

---

## Findings

### Finding #1: Skill-to-Reference Linkage Missing

SKILL.md files don't explicitly link to their REFERENCE.md companions. Discovery
is implicit via filesystem. **Recommendation:** Add "See also:" section in
SKILL.md files.

### Finding #2: Archive Discovery Risk

docs/archive/ contains ~100+ files creating discovery confusion.
**Recommendation:** Consider ARCHIVE_INDEX.md consolidation.

### Finding #3: DOCUMENTATION_INDEX.md Automation

Auto-generated by `npm run docs:index`. Verify this runs in pre-commit or CI.

### Finding #4: Skill Discovery Documentation Gap

No documentation explains which skills are "enforced triggers" vs "discoverable
specialty tools." **Recommendation:** Add section to CLAUDE.md or
COMMAND_REFERENCE.md.

---

## Summary Statistics

| Category                     | Count     |
| ---------------------------- | --------- |
| Skills (total)               | 67        |
| Skills with SKILL.md         | 67 (100%) |
| Skills with REFERENCE.md     | ~40       |
| Agents (total)               | 37        |
| Agents with .md              | 37 (100%) |
| Root docs                    | 14        |
| .claude/ docs                | 7         |
| docs/agent_docs/             | 10        |
| DOCUMENTATION_INDEX active   | 582       |
| DOCUMENTATION_INDEX archived | 104       |
| Orphaned skills              | 0         |
| Orphaned agents              | 0         |
