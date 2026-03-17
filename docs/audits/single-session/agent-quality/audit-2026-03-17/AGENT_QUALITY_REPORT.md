# Agent Quality Audit Report

**Date:** 2026-03-17 **Agents Audited:** 36 **Categories:** 13 (including 2
added mid-audit: Reference Code Patterns, Script Automation) **Ecosystem
Grade:** F (mean 51/100, post-improvement 54/100)

---

## Executive Summary

The agent ecosystem has a clear two-tier quality split. **Heavy agents** with
embedded code patterns and script automation (fullstack-developer,
test-engineer, security-engineer, database-architect) score 56-65. **Stub
agents** (38-44 lines of generic instructions) score 35-50. Most stubs are
generic templates that don't reflect the SoNash stack (Next.js 16 / React 19 /
Firebase 12).

6 agents were improved during this audit with measurable behavioral gains. 12
GSD agents are flagged upstream (missing model fields). 18 agents were skipped
as either already adequate or domain-mismatched with SoNash.

---

## Scoring Summary

### Pre-Improvement Scores

| Tier                          | Agents | Mean Score | Range     |
| ----------------------------- | ------ | ---------- | --------- |
| Priority (CLAUDE.md mandated) | 6      | 50         | 38-62     |
| Heavy (code-rich)             | 6      | 61         | 55-65     |
| Stub (generic)                | 12     | 44         | 35-46     |
| GSD (upstream)                | 12     | 53         | 49-58     |
| **All**                       | **36** | **51**     | **35-65** |

### Post-Improvement Scores (6 agents changed)

| Agent                | Before | After  | Delta  | Change                              |
| -------------------- | ------ | ------ | ------ | ----------------------------------- |
| code-reviewer        | 48     | ~72    | +24    | SoNash patterns + script workflow   |
| security-auditor     | 50     | ~75    | +25    | OWASP pairs + script workflow       |
| frontend-developer   | 44     | ~68    | +24    | React 19 + Tailwind patterns        |
| documentation-expert | 38     | ~48    | +10    | Fixed missing model/tools, boundary |
| test-engineer        | 56     | ~58    | +2     | Model sonnet→opus                   |
| dependency-manager   | 35     | ~42    | +7     | Fixed missing model/tools           |
| **Ecosystem mean**   | **51** | **54** | **+3** |                                     |

### Ecosystem Grade: F → F (trending toward D)

The 6 improvements raised the mean by 3 points. To reach D (60), the next
highest-impact action would be improving the 12 GSD agents' model fields
(upstream) and adding SoNash patterns to the 3-4 most-used remaining stubs.

---

## Decisions

| Decision      | Count | Agents                                                                                                       |
| ------------- | ----- | ------------------------------------------------------------------------------------------------------------ |
| Improve       | 6     | code-reviewer, security-auditor, documentation-expert, frontend-developer, test-engineer, dependency-manager |
| Skip          | 18    | All remaining custom agents                                                                                  |
| Flag upstream | 12    | All GSD agents                                                                                               |

---

## Top Systemic Findings

### 1. 70% of agents have zero code patterns (25/36)

Only 11 agents embed code examples. The agents that DO have code (fullstack-
developer at 72%, react-performance-optimization at 84%) produce measurably
better output. Adding project-specific patterns to code-reviewer and security-
auditor improved their behavioral test performance from generic checklists to
SoNash-specific issue detection.

### 2. 12 GSD agents missing model field

All GSD agents inherit the default model. Given prompt sizes ranging from 179 to
42KB lines, explicit model assignment would ensure appropriate reasoning
quality. Flagged as upstream issue for GSD framework maintainer.

### 3. Most stubs don't match SoNash's stack

Agents like backend-architect (Express/microservices), deployment-engineer
(Docker/K8s), and database-architect (PostgreSQL) describe a generic stack, not
SoNash's Firebase/Cloud Functions/Firestore architecture. They're functional but
provide generic guidance rather than project-specific value.

### 4. 14 custom agents are orphaned

No CLAUDE.md triggers, no skill spawns, no invocation records. They exist but
aren't discoverable. This is a Phase 5 (Process Integration) concern, not a
prompt quality issue.

### 5. Invocations file tracks skills only, not agents

`data/ecosystem-v2/invocations.jsonl` has 27 records — all skill invocations.
Agent invocations are not tracked at all, making usage-based quality decisions
impossible.

### 6. Duplicate GSD agents in global/ directory

11 GSD agents are duplicated in `.claude/agents/global/` with divergent
frontmatter (missing `skills:` field). Creates canonical ambiguity.

---

## Improvements Implemented & Tested

### code-reviewer (38→191 lines)

- Added 10 SoNash-specific code patterns with good/bad examples
- Added 4-step script workflow (git diff → patterns:check → semantic review →
  structured output)
- Behavioral test: caught 3/3 planted critical issues + 3 warnings + 2
  suggestions

### security-auditor (41→346 lines)

- Added 8 SoNash security patterns with before/after code
- Added 5-step script workflow (npm audit → patterns:check → grep scans → manual
  review → report)
- Behavioral test: caught 6/6 planted issues with OWASP refs + complete secure
  rewrite

### frontend-developer (39→166 lines)

- Added 11 SoNash-specific React patterns from actual codebase components
- Behavioral test: caught 6 SoNash issues + produced corrected component

### documentation-expert (frontmatter fix)

- Added model: sonnet, tools: [Read, Write, Edit, Grep]
- Clarified boundary with technical-writer in description

### test-engineer (model change)

- Changed model: sonnet → model: opus (990-line prompt exceeds sonnet's
  effective window)

### dependency-manager (frontmatter fix)

- Added model: sonnet, tools: [Read, Bash, Grep]

---

## Recommendations for Next Steps

1. **GSD framework maintainer:** Add model fields to all 12 GSD agents. Resolve
   global/ directory duplication.
2. **Phase 5 (Process Integration):** Wire orphaned agents to CLAUDE.md triggers
   or retire them. Add agent invocation tracking.
3. **Future audits:** Consider retiring agents that don't match SoNash's stack
   (backend-architect, deployment-engineer) or rewriting them for Firebase/Cloud
   Functions.

---

## Audit Process Notes

- **Categories expanded mid-audit:** Added Category 12 (Reference Code Patterns)
  and Category 13 (Script Automation) based on user feedback that the original
  11 categories missed a critical quality dimension.
- **Value filter added:** Critical Rule #7 prevents cosmetic recommendations.
  Only changes that measurably improve output quality or fix broken workflows.
- **Team-leader write pattern:** Explore agents scan, orchestrator writes JSONL.
  Documented in skill for future runs.
- **Stage 2.5 added:** Batch implementation + structural/behavioral testing
  before synthesis. All 6 improvements passed both validation types.

---

## Artifact Manifest

| Artifact          | Path                                                |
| ----------------- | --------------------------------------------------- |
| Stage 1a findings | `audit-2026-03-17/stage-1a-frontmatter.jsonl`       |
| Stage 1b findings | `audit-2026-03-17/stage-1b-tools.jsonl`             |
| Stage 1c findings | `audit-2026-03-17/stage-1c-redundancy.jsonl`        |
| Stage 1d findings | `audit-2026-03-17/stage-1d-code-patterns.jsonl`     |
| Stage 1e findings | `audit-2026-03-17/stage-1e-script-automation.jsonl` |
| Stage 1 merged    | `audit-2026-03-17/stage-1-merged.jsonl`             |
| This report       | `audit-2026-03-17/AGENT_QUALITY_REPORT.md`          |
| State file        | `.claude/state/task-audit-agent-quality.state.json` |
| History entry     | `.claude/state/audit-agent-quality-history.jsonl`   |
