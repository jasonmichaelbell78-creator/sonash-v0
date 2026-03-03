# Diagnosis: System-Wide Standardization — Ecosystem Mapping

**Date:** 2026-03-02 **Task:** Map all sonash-v0 ecosystems, ingest framework
repo research, establish sequencing for system-wide standardization using PR
ecosystem v2 patterns as the reference implementation.

---

## ROADMAP Alignment

**New Direction** — This initiative is not currently in ROADMAP.md. It emerged
from Session #201's 14-question review of the PR Ecosystem v2 overhaul, which
revealed that the architectural patterns proven there (Zod schemas, JSONL-first,
completeness tiers, health monitoring, enforcement, testing tiers) need to be
applied system-wide.

This aligns with the project's "Evidence-Based" and "Privacy-First" vision by
strengthening the infrastructure that ensures code quality, security, and
operational visibility. It supersedes the "Operational Visibility Sprint" (~75%
complete) by subsuming it into a broader framework.

---

## Relevant Existing Systems

| System                     | Relationship                           | Pattern to Follow                                                                                  |
| -------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| PR Review Ecosystem v2     | Reference implementation               | Zod schemas, JSONL-first, completeness tiers, health checkers, enforcement manifest, testing tiers |
| TDMS                       | Master data system, needs v2 treatment | 37 scripts, legacy schema (no Zod), feeds audits + roadmap + sprints                               |
| Ecosystem Health Dashboard | Already system-wide (10 checkers)      | Composite scoring, warning lifecycle, session persistence                                          |
| Alerts System              | Separate interactive triage dashboard  | 16-36 categories, suppression model, baseline deltas                                               |
| Framework Repo             | Parallel extraction project            | 68 decisions, 42 gaps, 10-phase plan, 53 skills bootstrapped                                       |
| Session Management         | Cross-cutting concern                  | State files, handoff, compaction resilience                                                        |
| Consolidation Pipeline     | Already v2 JSONL-based                 | Atomic state, promotion pipeline, threshold triggers                                               |
| Sprint System              | Already JSONL-first, untouched by v2   | FOCUS_MAP auto-placement, compatible as-is                                                         |

---

## 13 Ecosystems Identified (500+ components)

### Process Layer (Infrastructure)

1. **PR Review** — v2 COMPLETE. 5 Zod schemas, JSONL-first, 10 health checkers,
   enforcement manifest, 56 test files. Reference implementation.

2. **TDMS** — Legacy. 37 scripts, no Zod schema for MASTER_DEBT.jsonl, no
   completeness tiers. Largest script ecosystem. Needs full v2 treatment.

3. **Sessions** — Partial automation. State files in .claude/state/, manual
   counter increment, session-begin/end skills. Needs schema + automation.

4. **Hooks** — Well-automated (14 hooks + 6 shared libs). No Zod schemas for
   state. Pre-commit has 12 checks (4 blocking). Needs schema standardization.

5. **Skills** — 65 skills across 7 categories. Validated via hooks. No JSONL
   tracking of skill invocations or outcomes. Needs tracking layer.

6. **Agents** — 35 agent definitions across 7 categories. Invocations tracked in
   agent-invocations.jsonl. Partially v2-compatible.

7. **Scripts** — 70+ scripts forming the infrastructure backbone. Pattern
   compliance enforced. No ecosystem-level health. Needs cohesion.

8. **Docs** — 100+ files. Cross-doc deps exist. No health scoring. Staleness
   checks partial. Needs comprehensive ecosystem treatment.

9. **Audits** — 22 quality audit skills + 7 ecosystem audit skills + multi-AI
   consensus. Well-structured but results fragmented across history JSONL files.

10. **CI/CD** — 9+ GitHub workflows. Build, deploy, security scanning, quality
    gates, dependency management. Partially integrated with hook system.

### App Layer (Product)

11. **Frontend/App** — Next.js 16 App Router, React 19, Tailwind 4. Components,
    pages, providers, lib/. Follows its own patterns (repository pattern, Zod
    validation, functional components).

12. **Firebase/Backend** — Cloud Functions (8), Firestore rules, Storage rules,
    Auth. Modular SDK. App Check required. httpsCallable pattern.

### Cross-Cutting

13. **Analytics/Health** — Ecosystem Health dashboard (10 checkers, 64 metrics),
    Alerts system (16-36 categories), override analytics, hook analytics,
    velocity tracking. Partially unified.

---

## Reframe Check

**The task is bigger than it appeared.** What started as "review the PR
ecosystem overhaul" became "standardize everything." This is correct — the user
explicitly confirmed this vision. However, deep-plan should scope to:

1. **Ecosystem mapping** — what exists, what state it's in (THIS PLAN)
2. **Standards definition** — what "v2 treatment" means, codified
3. **Sequencing** — what order to tackle ecosystems
4. **Framework repo ingestion** — what decisions/patterns transfer

Implementation of individual ecosystem overhauls should be separate deep-plans
or GSD milestones.

**Recommendation:** Proceed as a DISCOVERY + MAPPING deep-plan. The output is a
roadmap for the roadmap — not an implementation plan. Each ecosystem overhaul
gets its own deep-plan later.

---

## Source Materials Available

| Source                   | Location                                                                                          | Contents                                |
| ------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Discovery Record         | `.planning/system-wide-standardization/DISCOVERY_RECORD.md`                                       | 14 questions, 11 decisions, vision      |
| Agent Research (9 files) | `.planning/system-wide-standardization/reference/agent-research/`                                 | 2.2MB raw findings                      |
| Sonash Planning Docs     | `.planning/system-wide-standardization/reference/sonash-source/`                                  | 7 key docs from ecosystem v2            |
| Framework Repo (full)    | `.planning/system-wide-standardization/reference/framework-repo/`                                 | 68 decisions, 42 gaps, 10-phase plan    |
| Ecosystem Mapping        | `.planning/system-wide-standardization/reference/agent-research/ecosystem-mapping-inventory.json` | 500+ components mapped to 13 ecosystems |
