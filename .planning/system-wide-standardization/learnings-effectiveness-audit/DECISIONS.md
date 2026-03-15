# Data Effectiveness Audit — DECISIONS

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-13
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Date:** 2026-03-13 **Deep-Plan Topic:** data-effectiveness-audit **Questions
Asked:** 35 **Decisions Made:** 35 **Batches:** 6

---

## Overarching Principles

These govern ALL decisions and implementation:

1. **No passive surfacing** — all data surfaces must require action
2. **AUTOMATION ALWAYS** — manual processes are a bug, not a feature
3. **Warnings are calls to action** — deferrals are last resort (D18: no
   deferral unless user explicitly asks)
4. **CRITICAL REFRAME (D8/D9):** User orchestrates, AI writes/reviews code.
   Learnings must become AUTOMATED ENFORCEMENT (hooks, gates, checks), not
   human-facing surfaces. Pipeline: learning → automated check → AI prevented
   from repeating mistake.
5. **Actionable = results** — not acknowledgment, not informational surfacing
6. **AI-optimized** — all formats, scoring, and outputs optimized for AI
   consumption (D24/D25/D30)

---

## Decision Table

| #   | Topic                                      | Choice                                                                                                                                                                                          | Rationale                                                                                                                                                                   |
| --- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Output directory                           | Keep `.planning/system-wide-standardization/learnings-effectiveness-audit/` as-is                                                                                                                                           | Already established during Phase 0                                                                                                                                          |
| D2  | Audit scope content                        | All tooling/infrastructure data + opportunities section. Exclude app code.                                                                                                                      | App code has its own audit skills. Opportunities section captures what SHOULD exist.                                                                                        |
| D3  | Audit skill relationship                   | Standalone skill + health integration. Skill is byproduct. Results/changes are deliverable. Skill-audit refinement before use.                                                                  | The audit itself produces the skill, but the real deliverable is fixes and enforcement.                                                                                     |
| D4  | Scoring model                              | 4-stage lifecycle: Capture/Storage/Recall/Action (0-3 each, 0-12 total). Action=3 = AUTOMATED ENFORCEMENT.                                                                                      | Maps the full data journey. Action=3 is the only score that means "truly effective."                                                                                        |
| D5  | Scope breadth                              | EVERYTHING — leave no stone unturned                                                                                                                                                            | User directive. PR-review, pr-retro, alerts, audits, skills, scripts, hooks, all internal data.                                                                             |
| D6  | Orphaned JSONL handling                    | Wire up retros.jsonl + invocations.jsonl to consumers. Delete enforcement-manifest.jsonl + dedup-log.jsonl.                                                                                     | Orphaned files are write-eager, read-lazy. Wire or delete.                                                                                                                  |
| D7  | Pattern recurrence                         | Populate `pattern_recurrence` at creation time. Auto-escalate at >=3.                                                                                                                           | Field existed but was always 0. Fix at source, escalate automatically.                                                                                                      |
| D8  | Enforcement timing (REFRAME)               | Real fix is at CODE CREATION time, not review time. Issues prevented when AI writes code.                                                                                                       | Review-time context is secondary. AI writes the code — enforce during generation.                                                                                           |
| D9  | Auto-learnings pipeline (REFRAME)          | Auto-learnings must become AUTOMATED CHANGES (new hooks/checks/gates), not human acknowledgment.                                                                                                | Human acknowledgment is passive surfacing in disguise. Only automated gates are actionable.                                                                                 |
| D10 | CLAUDE.md restructure                      | Config stays. Automatable rules → hooks/scripts. Rest → enforced differently. Annotate enforcement status.                                                                                      | Make enforcement gaps visible without deleting content.                                                                                                                     |
| D11 | JSONL rotation policy                      | Tiered: 30d operational, 90d historical, metrics never. Unified rotation script automated via session-start.                                                                                    | Unbounded JSONL is a growth/performance problem. Tiers match data utility half-lives.                                                                                       |
| D12 | review-metrics.jsonl consumers             | Wire into /alerts AND pr-retro                                                                                                                                                                  | Zero readers currently. Two natural consumers exist.                                                                                                                        |
| D13 | Learning-to-automation router              | Route by pattern type: code → verified-patterns + lint, process → hook gate, behavioral → enforced differently. Pipeline needs a ROUTER.                                                        | Different pattern types need different enforcement mechanisms.                                                                                                              |
| D14 | Enforcement creation approach              | Hybrid: AI identifies + categorizes, script scaffolds, AI refines.                                                                                                                              | Pure AI misses structure. Pure script misses nuance. Hybrid gets both.                                                                                                      |
| D15 | Non-automatable pattern handling           | Proxy metrics for measurement, AI self-check prompt for prevention.                                                                                                                             | Judgment calls can't be gated but CAN be measured and prompted.                                                                                                             |
| D16 | Audit checker domains                      | 8 domains confirmed. Plan implementation MUST cover these domains too — not just the audit skill.                                                                                               | Domains: capture completeness, consumer coverage, feedback loop closure, automation coverage, orphan detection, growth management, cross-system integration, opportunities. |
| D17 | Ecosystem-health integration               | Replace learning-effectiveness checker with lifecycle scoring + add full Data Effectiveness dimension.                                                                                          | Existing checker is ineffective. Lifecycle model is more rigorous.                                                                                                          |
| D18 | Deferral policy                            | No deferral unless user explicitly asks. Warn of difficulty, user has final say.                                                                                                                | User directive. No automated deferral — fix or DEBT immediately.                                                                                                            |
| D19 | CLAUDE.md enforcement annotations          | Annotate each rule with enforcement mechanism: `[HOOK: X]`, `[GATE: X]`, `[BEHAVIORAL: no enforcement]`. Don't delete content.                                                                  | Makes gaps visible. Rules without enforcement become automation candidates.                                                                                                 |
| D20 | Opportunities section content              | All gaps: missing capture, missing enforcement, missing integrations. This audit itself must produce opportunities.                                                                             | Broadest category. Router (D13) categorizes for implementation.                                                                                                             |
| D21 | Audit skill naming                         | `data-effectiveness-audit` — user-named, clear, cross-cutting                                                                                                                                   | Doesn't force-fit into ecosystem-audit naming. Cross-cutting concern.                                                                                                       |
| D22 | Router location                            | Shared library: `scripts/lib/learning-router.js`. Importable by any consumer.                                                                                                                   | Router logic is the same regardless of who discovers the learning.                                                                                                          |
| D23 | Execution approach                         | Wave-based, dependency-ordered, one commit per wave, independently revertable.                                                                                                                  | Proven approach from hook audit (35 decisions → 8 waves → PR #427).                                                                                                         |
| D24 | Lifecycle scoring rubric                   | 0=none, 1=manual/ad-hoc, 2=semi-automated, 3=fully automated. AI-optimized.                                                                                                                     | Clear criteria per level. Optimized for AI to score consistently.                                                                                                           |
| D25 | JSONL tier classification                  | 30d: hook-warnings, override, commit, invocations. 90d: reviews, retros, review-metrics, audit histories. Never: health-scores, MASTER_DEBT, velocity. Delete: enforcement-manifest, dedup-log. | Classification by data utility half-life.                                                                                                                                   |
| D26 | Broken flow wiring specifics               | retros→pr-review (backward flow), invocations→session-end, review-metrics→/alerts+pr-retro, pattern_recurrence at creation. All automated, actionable.                                          | Each flow has a natural consumer. Wire them, don't create new ones.                                                                                                         |
| D27 | Moment-of-creation enforcement             | Defense in depth: positive templates (primary prevention), verification agent (safety net), checklist (behavioral).                                                                             | Three layers: prevent, catch, remind. Covers code + behavioral patterns.                                                                                                    |
| D28 | Scale desensitization strategy             | B+C hybrid: absolute thresholds for security/data-loss (zero new violations), ratcheting baselines for everything else.                                                                         | Prevents gate fatigue. Security gets zero tolerance. Others ratchet down over time.                                                                                         |
| D29 | Cross-skill learnings aggregation          | Event-driven routing via shared library. Skills call router immediately. Router IS the aggregation.                                                                                             | No orphaned state files, no sweep lag. Immediate routing.                                                                                                                   |
| D30 | Scaffolding templates                      | Per enforcement type: verified-pattern entry, hook gate stub, ESLint/Semgrep skeleton, CLAUDE.md annotation. Must be trackable + actionable.                                                    | Each enforcement type gets a template the script produces and AI refines.                                                                                                   |
| D31 | Enforcement verification                   | Both tests + metrics. Tests verify mechanism works. Metrics verify real-world effect.                                                                                                           | Tests catch enforcement regressions. Metrics catch bypass patterns. Different failure modes.                                                                                |
| D32 | Rollout strategy                           | Immediate enforcement. No warning mode. If gate has false positives, fix the gate.                                                                                                              | Warning mode is passive surfacing in disguise. Per overarching principles.                                                                                                  |
| D33 | Audit frequency                            | Periodic (via comprehensive-ecosystem-audit) + trigger-based (health score drop or learning accumulation without enforcement).                                                                  | Periodic catches drift. Triggers catch acute degradation. Warnings without action = useless.                                                                                |
| D34 | Conflict resolution (existing enforcement) | Verify existing enforcement works (run tests, check metrics). If pattern recurs despite enforcement, widen enforcement scope.                                                                   | Existence of enforcement ≠ effective enforcement. Verify, then strengthen.                                                                                                  |
| D35 | Ecosystem-health weight                    | 15% for Data Effectiveness dimension                                                                                                                                                            | Significant but not dominant. Value comes from specific findings, not composite score weight.                                                                               |

---

## Key Cross-References

- **D8/D9** reframe ALL downstream decisions — every "surface to human" became
  "automate enforcement"
- **D13/D22/D29** form the router pipeline: shared library, event-driven,
  type-based routing
- **D27** layers three enforcement strategies for the hardest problem
  (creation-time prevention)
- **D16** requires the plan to cover all 8 audit domains, not just build a skill
- **D23** sets execution strategy: waves, like the hook audit
- **D31/D32/D34** form the verification loop: test it, measure it, enforce
  immediately, strengthen if insufficient
- **Must re-score and fix ALL existing systems** — not just build new
  infrastructure

---

## DIAGNOSIS Reference

See `DIAGNOSIS.md` in this directory for:

- Landscape summary (12 capture categories, 30+ files)
- Evidence of failure (7 quantified failure patterns)
- Root cause: "Write-eager, read-lazy"
- CLAUDE.md effectiveness scoring
- JSONL consumption analysis
