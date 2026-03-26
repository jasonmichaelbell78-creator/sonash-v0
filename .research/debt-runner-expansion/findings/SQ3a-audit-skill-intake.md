# Findings: How Every AUDIT Skill Routes Findings to TDMS

**Searcher:** deep-research-searcher
**Profile:** codebase
**Date:** 2026-03-26
**Sub-Question IDs:** SQ3a

---

## Key Findings

### 1. The Shared AUDIT_TEMPLATE.md Defines the Canonical Intake Pattern [CONFIDENCE: HIGH]

Every single-session audit skill (audit-code, audit-security, audit-performance, audit-refactoring,
audit-engineering-productivity, audit-ai-optimization, audit-documentation, audit-process,
audit-enhancements, audit-aggregator) delegates TDMS intake to a shared template at
`.claude/skills/_shared/AUDIT_TEMPLATE.md`. The template mandates:

1. MASTER_DEBT cross-reference before interactive review
2. Interactive review (batches of 3-5 by severity)
3. TDMS intake via `node scripts/debt/intake-audit.js <output.jsonl> --source "audit-<type>-<date>"`

All single-session audits reference this template with an identical directive:
> "Read `.claude/skills/_shared/AUDIT_TEMPLATE.md` for: Evidence Requirements, Dual-Pass Verification,
> Cross-Reference Validation, JSONL Output Format, Context Recovery, Post-Audit Validation,
> MASTER_DEBT Cross-Reference, Interactive Review, TDMS Intake & Commit..."

Each skill also provides a skill-specific intake command (the exact JSONL file path varies per skill).

### 2. Six Single-Session Audits Are INTEGRATED (Intake Command Explicit in SKILL.md) [CONFIDENCE: HIGH]

These skills explicitly name the intake command in their SKILL.md, in addition to deferring to
AUDIT_TEMPLATE.md:

| Skill | Intake Command (from SKILL.md) | Output File Location |
|-------|-------------------------------|----------------------|
| audit-code | `node scripts/debt/intake-audit.js <output.jsonl> --source "audit-code-<date>"` | `docs/audits/single-session/code/audit-YYYY-MM-DD.jsonl` |
| audit-security | `node scripts/debt/intake-audit.js <output.jsonl> --source "audit-security-<date>"` | `docs/audits/single-session/security/audit-YYYY-MM-DD.jsonl` |
| audit-performance | `node scripts/debt/intake-audit.js <output.jsonl> --source "audit-performance-<date>"` | `docs/audits/single-session/performance/audit-YYYY-MM-DD.jsonl` |
| audit-refactoring | `node scripts/debt/intake-audit.js <output.jsonl> --source "audit-refactoring-<date>"` | `docs/audits/single-session/refactoring/audit-YYYY-MM-DD/findings.jsonl` |
| audit-engineering-productivity | `node scripts/debt/intake-audit.js docs/audits/single-session/engineering-productivity/audit-findings.jsonl --source "audit-engineering-productivity-$(date +%Y-%m-%d)"` | `docs/audits/single-session/engineering-productivity/audit-findings.jsonl` |
| audit-ai-optimization | `node scripts/debt/intake-audit.js ${AUDIT_DIR}/all-findings-deduped.jsonl --source "audit-ai-optimization-$(date +%Y-%m-%d)"` | `docs/audits/single-session/ai-optimization/audit-DATE/all-findings-deduped.jsonl` |

**TDMS intake for these skills is user-gated**: findings are presented in interactive review first, and only
accepted/deferred items proceed to `intake-audit.js`. Declined items are dropped.

### 3. audit-documentation Has an Explicit Inline TDMS Intake Section [CONFIDENCE: HIGH]

Unlike the others, `audit-documentation` has a full "TDMS Intake & Commit" section embedded in SKILL.md
(not just a reference to AUDIT_TEMPLATE.md). The exact intake command is:
```
node scripts/debt/intake-audit.js ${AUDIT_DIR}/all-findings.jsonl --source "audit-documentation-$(date +%Y-%m-%d)"
```
It also validates schema first (`node scripts/debt/validate-schema.js`). Category mapping is explicit:
all stages map to TDMS category `documentation`.

### 4. audit-process Has Per-Stage TDMS Intake During Execution [CONFIDENCE: HIGH]

`audit-process` is unique: it runs `node scripts/debt/intake-audit.js ${AUDIT_DIR}/stage-N-*.jsonl` after
**each stage** (stages 2-6), not just at the end. The post-audit section also runs a full 6-step sequence:
1. `node scripts/debt/validate-schema.js`
2. `node scripts/debt/intake-audit.js`
3. `node scripts/debt/generate-views.js`
4. `node scripts/debt/generate-metrics.js`
5. Commit with `git add docs/audits/single-session/process/ docs/technical-debt/`

This is the most complete TDMS pipeline integration of any single skill.

### 5. audit-enhancements Has a Unique Inline Intake in Phase 3 Synthesis [CONFIDENCE: HIGH]

`audit-enhancements` integrates intake directly in Phase 3 synthesis (before interactive review), not as a
post-step:
```
node scripts/debt/intake-audit.js ${AUDIT_DIR}/merged-all.jsonl --source "audit-enhancements-YYYY-MM-DD"
```
The skill notes: "This automatically detects enhancement format, maps fields, runs dedup and generates views."
Items are ingested as `category: "enhancements"`, `type: "enhancement"` in TDMS.

A separate explicit TDMS Integration section also appears at the bottom of the skill:
```
node scripts/debt/intake-audit.js <findings.jsonl> --source "audit-enhancements-YYYY-MM-DD"
```

### 6. audit-aggregator Has a 5-Step TDMS Checklist [CONFIDENCE: HIGH]

The aggregator enforces a strict post-audit sequence:
1. `node scripts/debt/validate-schema.js <findings.jsonl>`
2. `node scripts/debt/intake-audit.js <findings.jsonl> --source "audit-comprehensive-YYYY-MM-DD"`
3. `node scripts/debt/generate-views.js`
4. `node scripts/debt/generate-metrics.js`
5. `node scripts/debt/sync-roadmap-refs.js`

All 5 must pass before aggregation is complete. This is called "5-Step TDMS Checklist" and is mandatory.
The aggregator also handles roadmap track assignment via `node scripts/debt/assign-roadmap-refs.js`.

### 7. audit-comprehensive Orchestrates TDMS via audit-aggregator [CONFIDENCE: HIGH]

`audit-comprehensive` itself does not directly call `intake-audit.js`. Instead, it:
1. Delegates TDMS intake to `audit-aggregator` (Stage 3)
2. Has a mandatory "MASTER_DEBT Deduplication" stage (Stage 3.5) before interactive review
3. After intake, calls `node scripts/reset-audit-triggers.js --type=comprehensive --apply`

The skill documentation references `intake-audit.js` in its "Documentation References" section but the
actual invocation is in `audit-aggregator`.

### 8. multi-ai-audit Has Full Automated TDMS Pipeline (Phase 7) [CONFIDENCE: HIGH]

`multi-ai-audit` has a dedicated Phase 7: TDMS Intake, which includes:
- Dry-run verification before execution
- `scripts/debt/intake-audit.js` invocation (called from referenced `templates.md`)
- Phase 8: Roadmap integration via `scripts/debt/assign-roadmap-refs.js` and
  `scripts/debt/sync-roadmap-refs.js`
- Phase 9: Final summary and session completion

Referenced scripts (from SKILL.md's Related Documentation section): `scripts/debt/intake-audit.js`,
`scripts/debt/assign-roadmap-refs.js`, `scripts/debt/sync-roadmap-refs.js`,
`scripts/debt/generate-metrics.js`.

### 9. Ecosystem Audits Use a Different TDMS Mechanism: /add-debt Instead of intake-audit.js [CONFIDENCE: HIGH]

The 8 ecosystem audits (hook, session, tdms, pr, skill, doc, script, health) use a fundamentally
different TDMS pathway:
- Findings are surfaced one-by-one in interactive walkthrough
- **Deferred findings** create TDMS entries via `/add-debt` (not `intake-audit.js`)
- The shared FINDING_WALKTHROUGH.md specifies: "Create DEBT entry via `/add-debt` with: severity: S1
  (errors) or S2 (warnings), category: `engineering-productivity`, source_id: `review:{audit-name}-{date}`"
- Fixed and skipped findings do NOT create TDMS entries
- There is NO batch JSONL intake from ecosystem audits

This is a structural difference: single-session audits write JSONL then batch-ingest; ecosystem audits
create individual TDMS entries on the fly during interactive review.

### 10. comprehensive-ecosystem-audit Aggregates but Does NOT Feed TDMS [CONFIDENCE: HIGH]

`comprehensive-ecosystem-audit` aggregates results from 8 ecosystem audits into a unified report
(`COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md`) but has NO TDMS intake step. The skill only produces:
- A health report (markdown)
- Cross-audit insights
- No `intake-audit.js` invocation anywhere in the skill

Individual ecosystem audits create TDMS entries via `/add-debt` during their interactive walkthroughs
(independently, when the user defers a finding). The orchestrator does not touch TDMS.

### 11. data-effectiveness-audit Uses /add-debt for Deferred Findings [CONFIDENCE: HIGH]

`data-effectiveness-audit` follows the ecosystem-audit TDMS pattern:
- Rule 7: "Create TDMS entries (MUST) — for deferred findings via `/add-debt`"
- Phase 5 routes gaps through `scripts/route-lifecycle-gaps.js` and `scripts/route-enforcement-gaps.js`
  (not TDMS scripts directly)
- No `intake-audit.js` invocation found

This skill is closer to the ecosystem audit model than the single-session audit model for TDMS integration.

### 12. audit-agent-quality Uses intake-audit.js in Post-Audit TDMS Integration [CONFIDENCE: HIGH]

Despite being a "hybrid" audit type, `audit-agent-quality` explicitly uses `intake-audit.js`:
```bash
node scripts/debt/validate-schema.js AUDIT_DIR/all-findings-deduped.jsonl
node scripts/debt/intake-audit.js AUDIT_DIR/all-findings-deduped.jsonl --source "audit-agent-quality-$(date +%Y-%m-%d)"
node scripts/debt/generate-views.js
node scripts/debt/generate-metrics.js
```
This follows the full single-session audit TDMS pipeline (validate → intake → generate-views →
generate-metrics).

### 13. audit-health Has No TDMS Integration [CONFIDENCE: HIGH]

`audit-health` is a meta-check skill that runs diagnostic scripts on the audit infrastructure:
- `node scripts/audit/audit-health-check.js`
- `node scripts/audit/count-commits-since.js`
- `node scripts/audit/validate-templates.js`
- `node scripts/audit/pre-audit-check.js`

No `intake-audit.js`, no MASTER_DEBT cross-reference, no findings JSONL output. Findings are reported
to the user as text recommendations only. This is by design — it's a meta-check, not an audit that
produces findings.

### 14. create-audit Enforces TDMS Pipeline in Generated Skills [CONFIDENCE: HIGH]

`create-audit` has a Critical Rule (#8): "TDMS pipeline scripts — generated audits MUST use:
`validate-schema.js`, `intake-audit.js`, `generate-views.js`, `generate-metrics.js`". The Phase 5
validation checklist verifies TDMS pipeline scripts are correctly invoked before completing. This
ensures new audits created via the wizard are born with proper TDMS integration.

### 15. The "Defer" Path in All Audits Routes to TDMS [CONFIDENCE: HIGH]

Across all skill types, "Defer" consistently means TDMS:
- Single-session audits: deferred items go to TDMS via `intake-audit.js`
- Ecosystem audits: deferred items create TDMS entries via `/add-debt` immediately
- Interactive review in all skills: ACCEPTED + DEFERRED items proceed to intake; DECLINED items
  do not

The AUDIT_TEMPLATE.md confirms: "After ALL findings reviewed, proceed to TDMS Intake with
accepted + deferred only."

---

## Classification Summary

| Skill | Classification | TDMS Mechanism | Notes |
|-------|---------------|----------------|-------|
| audit-code | INTEGRATED | `intake-audit.js` | Via AUDIT_TEMPLATE + explicit intake command |
| audit-security | INTEGRATED | `intake-audit.js` | Via AUDIT_TEMPLATE + explicit intake command |
| audit-performance | INTEGRATED | `intake-audit.js` | Via AUDIT_TEMPLATE + explicit intake command |
| audit-refactoring | INTEGRATED | `intake-audit.js` | Via AUDIT_TEMPLATE + explicit intake command |
| audit-engineering-productivity | INTEGRATED | `intake-audit.js` | Via AUDIT_TEMPLATE + explicit intake command |
| audit-ai-optimization | INTEGRATED | `intake-audit.js` | Via AUDIT_TEMPLATE + explicit intake command |
| audit-documentation | INTEGRATED | `intake-audit.js` | Inline + AUDIT_TEMPLATE; schema validation before intake |
| audit-process | INTEGRATED | `intake-audit.js` (per stage + post-audit) | Most complete: per-stage + 6-step post-audit pipeline |
| audit-enhancements | INTEGRATED | `intake-audit.js` | Intake in Phase 3 synthesis AND explicit TDMS section |
| audit-aggregator | INTEGRATED | `intake-audit.js` + 5-script pipeline | 5-step TDMS checklist mandatory |
| audit-comprehensive | INTEGRATED | Delegates to audit-aggregator | No direct call; aggregator owns TDMS |
| multi-ai-audit | INTEGRATED | `intake-audit.js` (Phase 7) + roadmap scripts | Most automated pipeline |
| audit-agent-quality | INTEGRATED | `intake-audit.js` | validate → intake → generate-views → generate-metrics |
| hook-ecosystem-audit | PARTIAL | `/add-debt` (deferred findings only) | Per-finding via /add-debt, no batch intake |
| session-ecosystem-audit | PARTIAL | `/add-debt` (deferred findings only) | Per-finding via /add-debt, no batch intake |
| tdms-ecosystem-audit | PARTIAL | `/add-debt` (deferred findings only) | Audits TDMS itself; deferred go via /add-debt |
| pr-ecosystem-audit | PARTIAL | `/add-debt` (deferred findings only) | Per-finding via /add-debt, no batch intake |
| skill-ecosystem-audit | PARTIAL | `/add-debt` (deferred findings only) | Per-finding via /add-debt, no batch intake |
| doc-ecosystem-audit | PARTIAL | `/add-debt` (deferred findings only) | Per-finding via /add-debt, no batch intake |
| script-ecosystem-audit | PARTIAL | `/add-debt` (deferred findings only) | Per-finding via /add-debt, no batch intake |
| health-ecosystem-audit | PARTIAL | `/add-debt` (deferred findings only) | Per-finding via /add-debt, no batch intake |
| comprehensive-ecosystem-audit | DISCONNECTED | None | Aggregates reports; no TDMS integration |
| data-effectiveness-audit | PARTIAL | `/add-debt` (deferred findings only) | Lifecycle routing scripts; no batch intake |
| audit-health | DISCONNECTED | None | Meta-check only; no findings output |
| create-audit | N/A (wizard) | Enforces TDMS in generated skills | Creates TDMS-integrated audits; itself produces no findings |

---

## The Two TDMS Pathways

### Pathway A: Batch JSONL Intake (single-session audits)
```
Audit runs → Writes JSONL findings file → MASTER_DEBT cross-reference →
Interactive review (accept/defer/decline) → intake-audit.js ingests JSONL →
generate-views.js → generate-metrics.js
```

Used by: audit-code, audit-security, audit-performance, audit-refactoring,
audit-engineering-productivity, audit-ai-optimization, audit-documentation,
audit-process, audit-enhancements, audit-aggregator, multi-ai-audit, audit-agent-quality

### Pathway B: Per-Finding /add-debt (ecosystem audits)
```
Audit script runs → Dashboard presented → Finding-by-finding walkthrough →
User defers → /add-debt creates single TDMS entry immediately →
Continue walkthrough
```

Used by: all 8 ecosystem audits + data-effectiveness-audit

**Key distinction:** Pathway A processes findings as a batch after the audit completes.
Pathway B creates TDMS entries one at a time, on the fly, during the walkthrough. In
Pathway B, only deferred findings reach TDMS — fixed and skipped findings do not.

---

## Findings Format Reference

| Skill Type | Format | Schema Location |
|------------|--------|-----------------|
| Single-session audits | JSONL, one finding per line | `docs/templates/JSONL_SCHEMA_STANDARD.md` |
| Ecosystem audits | Script produces v2 JSON (stdout) | Internal to each audit script |
| Interactive review output | JSONL session log + markdown | Per-audit tmp files |
| TDMS canonical | JSONL in MASTER_DEBT.jsonl | `scripts/config/audit-schema.json` |

The JSONL_SCHEMA_STANDARD.md format requires: `category`, `fingerprint`, `files` (array with
`file.ts:123`), `confidence` (number 0-100), `acceptance_tests` (non-empty array).

---

## Sources

| # | Path | Title | Type | Trust |
|---|------|-------|------|-------|
| 1 | `.claude/skills/_shared/AUDIT_TEMPLATE.md` | Shared Audit Template | Canonical source | HIGH |
| 2 | `.claude/skills/audit-code/SKILL.md` | Single-Session Code Review Audit | Skill definition | HIGH |
| 3 | `.claude/skills/audit-security/SKILL.md` | Single-Session Security Audit | Skill definition | HIGH |
| 4 | `.claude/skills/audit-performance/SKILL.md` | Single-Session Performance Audit | Skill definition | HIGH |
| 5 | `.claude/skills/audit-refactoring/SKILL.md` | Single-Session Refactoring Audit | Skill definition | HIGH |
| 6 | `.claude/skills/audit-engineering-productivity/SKILL.md` | Engineering Productivity Audit | Skill definition | HIGH |
| 7 | `.claude/skills/audit-ai-optimization/SKILL.md` | AI Optimization Audit | Skill definition | HIGH |
| 8 | `.claude/skills/audit-documentation/SKILL.md` | Documentation Audit | Skill definition | HIGH |
| 9 | `.claude/skills/audit-process/SKILL.md` | Comprehensive Automation Audit | Skill definition | HIGH |
| 10 | `.claude/skills/audit-enhancements/SKILL.md` | Enhancement Audit | Skill definition | HIGH |
| 11 | `.claude/skills/audit-comprehensive/SKILL.md` | Comprehensive Multi-Domain Audit Orchestrator | Skill definition | HIGH |
| 12 | `.claude/skills/audit-aggregator/SKILL.md` | Audit Aggregator Agent | Skill definition | HIGH |
| 13 | `.claude/skills/multi-ai-audit/SKILL.md` | Multi-AI Audit Orchestrator | Skill definition | HIGH |
| 14 | `.claude/skills/comprehensive-ecosystem-audit/SKILL.md` | Comprehensive Ecosystem Audit | Skill definition | HIGH |
| 15 | `.claude/skills/hook-ecosystem-audit/SKILL.md` | Hook Ecosystem Audit | Skill definition | HIGH |
| 16 | `.claude/skills/session-ecosystem-audit/SKILL.md` | Session Ecosystem Audit | Skill definition | HIGH |
| 17 | `.claude/skills/tdms-ecosystem-audit/SKILL.md` | TDMS Ecosystem Audit | Skill definition | HIGH |
| 18 | `.claude/skills/pr-ecosystem-audit/SKILL.md` | PR Ecosystem Audit | Skill definition | HIGH |
| 19 | `.claude/skills/skill-ecosystem-audit/SKILL.md` | Skill Ecosystem Audit | Skill definition | HIGH |
| 20 | `.claude/skills/doc-ecosystem-audit/SKILL.md` | Doc Ecosystem Audit | Skill definition | HIGH |
| 21 | `.claude/skills/script-ecosystem-audit/SKILL.md` | Script Ecosystem Audit | Skill definition | HIGH |
| 22 | `.claude/skills/health-ecosystem-audit/SKILL.md` | Health Ecosystem Audit | Skill definition | HIGH |
| 23 | `.claude/skills/data-effectiveness-audit/SKILL.md` | Data Effectiveness Audit | Skill definition | HIGH |
| 24 | `.claude/skills/audit-agent-quality/SKILL.md` | Hybrid Agent Quality Audit | Skill definition | HIGH |
| 25 | `.claude/skills/audit-health/SKILL.md` | Audit System Health Check | Skill definition | HIGH |
| 26 | `.claude/skills/create-audit/SKILL.md` | Create Audit Wizard | Skill definition | HIGH |
| 27 | `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md` | Ecosystem Audit Finding Walkthrough | Shared protocol | HIGH |

---

## Contradictions

**None found.** All skills are internally consistent in their TDMS routing. The two pathways (batch
JSONL intake vs per-finding /add-debt) are architecturally distinct but do not contradict each other —
they are used by different skill types.

One notable tension: `tdms-ecosystem-audit` audits the TDMS system itself, yet deferred findings from
that audit are routed back into TDMS via `/add-debt`. This creates a mild self-referential loop
(auditing the system you also report into), but is not a contradiction — it is the intended design.

---

## Gaps

1. **`comprehensive-ecosystem-audit` has no TDMS integration at all.** It produces a unified report
   but relies entirely on individual ecosystem audits having already created TDMS entries during their
   interactive walkthroughs. If a user runs `/comprehensive-ecosystem-audit` without having previously
   run individual audits, no TDMS entries are created.

2. **Ecosystem audit "Fix Now" findings are lost to TDMS.** When a user chooses "Fix Now" in an
   ecosystem audit walkthrough, the fix is applied but no TDMS record is created. Only "Defer"
   creates a TDMS entry. This means successfully-fixed items leave no audit trail in MASTER_DEBT.

3. **`intake-audit.js` is invoked by skills but its implementation was not reviewed.** This research
   analyzed SKILL.md files only; the actual script behavior (dedup logic, schema mapping) was not
   verified.

4. **audit-health uses scripts in `scripts/audit/` not in `scripts/debt/`.** The relationship between
   `scripts/audit/` and `scripts/debt/` pipelines was not investigated. It is unclear whether
   `audit-health-check.js` writes to any data store.

5. **data-effectiveness-audit routes gaps through `scripts/route-lifecycle-gaps.js` and
   `scripts/route-enforcement-gaps.js`.** These scripts were not examined; their relationship to
   TDMS/MASTER_DEBT is unknown. They may or may not create TDMS entries.

---

## Serendipity

1. **`audit-process` runs TDMS intake per stage, not just post-audit.** This is the only skill that
   feeds TDMS incrementally as the audit progresses, making it resilient to context compaction losses.
   Finding: if an audit is interrupted mid-run, earlier stages are already ingested.

2. **`create-audit` enforces TDMS integration as a mandatory gate.** Any new audit type scaffolded
   through the wizard will have TDMS pipeline scripts wired in — the wizard validates this in Phase 5.
   This means the TDMS integration pattern is self-propagating.

3. **`audit-enhancements` ingests into TDMS with a distinct type.** All findings land in TDMS as
   `category: "enhancements"`, `type: "enhancement"` — not the usual `type: "debt"`. If the
   debt-runner expansion needs to distinguish enhancement items from defect items, this field provides
   that signal.

4. **The MASTER_DEBT cross-reference step is mandatory in all single-session audits, explicitly gated
   before interactive review.** This is a dedup step at intake time, not a post-hoc check. It prevents
   duplicate entries accumulating in MASTER_DEBT from repeated audits of the same files.

5. **Ecosystem audits hardcode `category: "engineering-productivity"` for all deferred items
   regardless of finding domain.** A hook latency finding from `hook-ecosystem-audit`, a JSONL sync
   issue from `pr-ecosystem-audit`, and a dead skill from `skill-ecosystem-audit` all land in TDMS
   under `engineering-productivity`. This may cause misleading TDMS category distributions.

---

## Confidence Assessment

- HIGH claims: 15
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are based on direct filesystem reads of SKILL.md files. No inference was required.
