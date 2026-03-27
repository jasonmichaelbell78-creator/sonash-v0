# Findings: How Every Operational Skill Routes Findings to TDMS

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-26
**Sub-Question IDs:** SQ3b

---

## Key Findings

### 1. TDMS Integration Classification Summary [CONFIDENCE: HIGH]

Of the 16 skills investigated, none routes findings to TDMS _automatically_
without user involvement. The real distinction is whether a skill has a
_structured pathway_ to TDMS or none at all.

| Skill            | Classification | TDMS Path                                                  | Notes                                                                    |
| ---------------- | -------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| add-debt         | INTEGRATED     | Direct — IS the intake mechanism                           | Runs `intake-pr-deferred.js` or `intake-manual.js`                       |
| sonarcloud       | INTEGRATED     | Automatic via `sync-sonarcloud.js`                         | Prompts user before applying but executes full pipeline                  |
| pr-review        | INTEGRATED     | Mandatory — deferred items MUST get DEBT IDs               | Step 5 calls `/add-debt`; Step 7 verifies TDMS sync                      |
| system-test      | PARTIAL        | User-gated TDMS sync in Domain 20                          | Can skip sync; "deferred" findings stay in JSONL only                    |
| pre-commit-fixer | PARTIAL        | User offered `/add-debt` for pre-existing errors           | Explicit menu option; never auto-routes                                  |
| alerts           | PARTIAL        | Phase 5 suggests `/add-debt` for deferred items            | "Defer items: log and suggest `/add-debt`" — not enforced                |
| pr-retro         | PARTIAL        | User-explicit only — STRONGLY discourages TDMS             | REFERENCE.md: "DEBT is NOT an option unless user explicitly requests it" |
| ecosystem-health | PARTIAL        | Recommends `/add-debt` for debt-aging dimension            | Not enforced; user decides per-dimension in triage loop                  |
| session-end      | PARTIAL        | Runs `consolidate-all.js` + `generate-metrics.js` silently | Consolidates existing debt but does NOT intake new findings              |
| debt-runner      | INTEGRATED     | IS the TDMS orchestrator                                   | Manages all TDMS pipeline operations                                     |
| code-reviewer    | DISCONNECTED   | No TDMS path exists                                        | Produces findings, no DEBT routing                                       |
| session-begin    | DISCONNECTED   | Reads TDMS snapshot (S0/S1 count) only                     | Read-only; no findings produced                                          |
| convergence-loop | DISCONNECTED   | No TDMS path exists                                        | Produces verified claims, not debt items                                 |
| gh-fix-ci        | DISCONNECTED   | No TDMS path exists                                        | CI failure fixes, no debt tracking                                       |
| quick-fix        | DISCONNECTED   | No TDMS path exists                                        | Advisory only; no DEBT routing                                           |
| simplify         | NOT FOUND      | Skill does not exist at `.claude/skills/simplify/`         | No SKILL.md found at this path                                           |

---

### 2. The "INTEGRATED" Skills: add-debt, sonarcloud, pr-review [CONFIDENCE: HIGH]

**add-debt** is the canonical intake mechanism. It is invoked by other skills
rather than routing on its own. It supports two paths:

- `intake-pr-deferred.js` — for items deferred during PR review (source ID:
  `PR-{number}-{seq}`)
- `intake-manual.js` — for ad-hoc items discovered during development

Both use `appendMasterDebtSync` which writes to `MASTER_DEBT.jsonl` and
`raw/deduped.jsonl` atomically. After writing, it runs `generate-views.js`. This
is the only skill that guarantees a DEBT-XXXX ID is returned.

**sonarcloud** has the most automated path of any skill. In `sync` mode it runs
`sync-sonarcloud.js --dry-run` (preview), presents to user, then `--force` to
apply. The full pipeline (Steps 1-8 in the SKILL.md) runs automatically upon
user approval. After sync it triggers a mandatory Post-Sync Placement phase
requiring user approval on roadmap assignments. Effectively: one user
confirmation gates full pipeline execution.

**pr-review** has the strongest enforcement language of any skill:

- Step 5 states "TDMS (MUST for deferred): Use `/add-debt`."
- Step 7 has an explicit check: "TDMS sync: every deferred item has a DEBT-XXXX
  ID"
- Step 7 also checks: "DAS compliance: pre-existing item count matches DAS block
  count"
- Step 8 summary shows "TDMS: [DEBT IDs or 'none']"
- The DAS block format (`[A] Fix now [B] Defer to DEBT [C] Need more context`)
  is the canonical user choice UI for pre-existing items.

---

### 3. The "PARTIAL" Skills: system-test, pre-commit-fixer, alerts, pr-retro, ecosystem-health, session-end [CONFIDENCE: HIGH]

**system-test** has a dedicated TDMS Sync phase (Domain 20 / Section 8 of
WORKFLOW.md). It previews how many new findings would be added, deduplicates
against existing MASTER_DEBT using 80% fuzzy match, and presents four options:
"Sync all / Preview diff first / Sync S0+S1 only / Skip sync." The "Skip sync"
option means all findings remain in per-domain JSONL files only, never reaching
MASTER_DEBT. This is a user-gated batch sync, not individual `/add-debt` calls.

**pre-commit-fixer** explicitly offers `/add-debt` at three points:

1. Step 2 (classify): pre-existing errors → "offer: fix now or defer to
   `/add-debt`"
2. Step 3 (warm-up): "Fix all? [Y / fix specific categories / defer all to
   /add-debt / abort]"
3. Step 7 (closure): "[3] Symptom — defer to /add-debt" No auto-routing occurs;
   every path requires user choice.

**alerts** references `/add-debt` in Phase 5: "Defer items: log and suggest
`/add-debt`." The REFERENCE.md shows "Defer" as a decision category with "Log,
suggest `/add-debt`" as the resulting action. Findings are surfaced
alert-by-alert; TDMS intake is suggested but not enforced. The integration note
says "Debt -> `/add-debt`" in the skill routing table.

**pr-retro** has the most restrictive TDMS policy of all skills. REFERENCE.md
Section "DEBT/TDMS Rules" states explicitly: "DEBT is NOT an option unless the
user explicitly requests it. Do not offer 'defer to DEBT' as a choice. Do not
create TDMS entries unless the user says words like 'defer', 'create DEBT', or
'add to TDMS.'" The first-class options for action items are: implement now or
plan it (add to SESSION_CONTEXT.md/ROADMAP.md). TDMS is a third option only on
explicit user request.

**ecosystem-health** mentions `/add-debt` only in its REFERENCE.md for the
`debt-aging` dimension: "Resolve via TDMS pipeline, `/add-debt`." In the
per-dimension Q&A flow, "Defer — add to next session goals" is an option, but
the text says "add to next session goals" (SESSION_CONTEXT.md) — not
automatically to TDMS. TDMS is mentioned as the eventual destination for debt
dimensions, not directly routed.

**session-end** runs `consolidate-all.js` (Step 7d) every session without user
choice ("Never skip"). However, `consolidate-all.js` is a
consolidation/normalization/dedup pipeline — it processes existing intake
sources (audit JSONL files, review data) and normalizes them into
MASTER_DEBT.jsonl. It does NOT intake new findings. It is a maintenance step,
not a new-finding intake step. Session-end does NOT call `/add-debt` and
produces no new DEBT items itself.

---

### 4. The "DISCONNECTED" Skills [CONFIDENCE: HIGH]

**code-reviewer** produces a review checklist with violations, but has no TDMS
path in its SKILL.md. It mentions patterns to look for and blocks on
anti-pattern violations, but all dispositions are "fix immediately" — there is
no deferred/TDMS track. If a finding cannot be fixed inline during the review,
it is the caller's responsibility to route it.

**session-begin** reads the Technical Debt INDEX (Step 4.4, SHOULD) for
situational awareness — noting S0/S1 counts in the summary. This is read-only.
It produces no new findings and routes nothing to TDMS.

**convergence-loop** produces verified claims and a convergence report. These
are inputs to other skills that may then route to TDMS. The skill itself has no
`/add-debt` calls or TDMS intake paths. It does mention TDMS in REFERENCE.md as
a use case ("TDMS verification") but only as a consumer of CL output, not as a
target.

**gh-fix-ci** inspects CI failures, proposes a fix plan, and implements it after
user approval. No debt tracking, no TDMS routing, no `/add-debt` reference
anywhere in the skill.

**quick-fix** is an advisory skill for pre-commit and pattern compliance issues.
It suggests auto-fixes and asks "Apply auto-fixes? [Y/n]". No TDMS path exists.
It does reference the scenario of being "suggested by hooks when failures occur"
but no DEBT routing is mentioned.

**simplify** does not exist as a skill directory at `.claude/skills/simplify/`.
Searching the codebase found one reference to "simplify" in
`.research/cli-tools/challenges/OUTSIDE_THE_BOX.md` (unrelated) and one in MCP
builder evaluation (also unrelated). This skill appears to have been listed in
the investigation prompt but does not exist in the current codebase.

---

### 5. All "Defer to TDMS" Choice Blocks Across Skills [CONFIDENCE: HIGH]

Every location where a user is explicitly presented with a "defer to TDMS"
choice:

| Location                            | Format                                                                    | Context                                               |
| ----------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| `pr-review/SKILL.md:238`            | `[A] Fix now [B] Defer to DEBT [C] Need more context`                     | DAS block for every pre-existing item                 |
| `pr-review/SKILL.md:329`            | "TDMS (MUST for deferred): Use `/add-debt`"                               | Step 5 enforcement                                    |
| `pre-commit-fixer/SKILL.md:97`      | "fix now or defer to `/add-debt`"                                         | Pre-existing errors in Step 2                         |
| `pre-commit-fixer/SKILL.md:111`     | "Fix all? [Y / fix specific categories / defer all to /add-debt / abort]" | Step 3 warm-up                                        |
| `pre-commit-fixer/SKILL.md:115`     | "fix all, fix staged-only, or defer to `/add-debt`?"                      | Scope threshold check                                 |
| `pre-commit-fixer/SKILL.md:219`     | "[3] Symptom — defer to /add-debt"                                        | Step 7 closure                                        |
| `alerts/REFERENCE.md:54`            | "Log, suggest `/add-debt`"                                                | Defer decision in Phase 5                             |
| `system-test WORKFLOW.md:736`       | "Sync findings to TDMS? [Sync all / Preview / S0+S1 only / Skip]"         | Domain 20 decision                                    |
| `ecosystem-health/REFERENCE.md:114` | "Resolve via TDMS pipeline, `/add-debt`"                                  | Debt-aging dimension action                           |
| `pr-retro/REFERENCE.md:594`         | "TDMS via `/add-debt`"                                                    | Only for "Systemic issue" category, user must request |

---

### 6. session-end's consolidate-all.js Is a Maintenance Step, Not New Intake [CONFIDENCE: HIGH]

This is a critical distinction. `consolidate-all.js` runs these steps in
sequence:

1. Extract SonarCloud issues (deprecated)
2. Extract audit findings (from existing JSONL files)
3. Extract review/aggregation findings
4. Normalize all extractions
5. Multi-pass deduplication

This script consolidates _already-written_ findings from audit JSONL files and
review records into MASTER_DEBT.jsonl. It does not accept new findings from
session-end's own work. New findings from the session would need to have been
written to an audit JSONL or through `/add-debt` before session-end runs.

---

### 7. pr-review Has the Most Robust TDMS Integration of Any Skill [CONFIDENCE: HIGH]

The verification gate at Step 7 is the strongest enforcement mechanism in any
skill: it explicitly checks that "fixed + deferred + rejected = total parsed
items" and that every deferred item has a DEBT-XXXX ID before the skill can
proceed to Step 8. This makes silent item loss structurally impossible if the
skill is followed.

The DAS (Defer/Act Score) framework in pr-review is also the most sophisticated
routing mechanism — it scores items on Signal (0-2), Dependency (0-2), and Risk
(0-2) to produce a 0-6 score that determines whether to auto-accept, require
user decision, or auto-defer. DAS 3-4 items MUST always be presented to the
user; they cannot be auto-routed.

---

### 8. The Shared Audit Template vs. Operational Skills [CONFIDENCE: HIGH]

A key finding from the grep of defer patterns is that
`_shared/ecosystem-audit/CRITICAL_RULES.md` and `_shared/AUDIT_TEMPLATE.md` have
a Rule 7: "Create TDMS entries (MUST) — for deferred findings via `/add-debt`."
This rule is referenced in _audit_ skills (health-ecosystem-audit,
hook-ecosystem-audit, pr-ecosystem-audit, etc.) but NOT in the operational
skills investigated here.

This confirms a structural gap: the audit skill ecosystem has a TDMS intake MUST
rule baked into a shared template, but operational skills like code-reviewer,
gh-fix-ci, and quick-fix have no analogous shared rule or template enforcing
TDMS routing.

---

## Sources

| #   | Path                                                       | Title                               | Type            | Trust | CRAAP     | Date       |
| --- | ---------------------------------------------------------- | ----------------------------------- | --------------- | ----- | --------- | ---------- |
| 1   | `.claude/skills/add-debt/SKILL.md`                         | Add Technical Debt                  | Skill file      | HIGH  | 5/5/5/5/5 | 2026-03-20 |
| 2   | `.claude/skills/sonarcloud/SKILL.md`                       | SonarCloud Integration              | Skill file      | HIGH  | 5/5/5/5/5 | 2026-02-25 |
| 3   | `.claude/skills/pr-review/SKILL.md`                        | PR Code Review Processor            | Skill file      | HIGH  | 5/5/5/5/5 | 2026-03-18 |
| 4   | `.claude/skills/pr-retro/SKILL.md`                         | PR Review Retrospective             | Skill file      | HIGH  | 5/5/5/5/5 | 2026-03-18 |
| 5   | `.claude/skills/pr-retro/REFERENCE.md`                     | PR Retro Reference                  | Reference doc   | HIGH  | 5/5/5/5/5 | 2026-03-18 |
| 6   | `.claude/skills/alerts/SKILL.md`                           | Alerts — Lightweight Health Signal  | Skill file      | HIGH  | 5/5/5/5/5 | 2026-03-24 |
| 7   | `.claude/skills/alerts/REFERENCE.md`                       | Alerts Reference                    | Reference doc   | HIGH  | 5/5/5/5/5 | 2026-03-24 |
| 8   | `.claude/skills/session-end/SKILL.md`                      | Session End Pipeline                | Skill file      | HIGH  | 5/5/5/5/5 | 2026-03-13 |
| 9   | `.claude/skills/session-begin/SKILL.md`                    | Session Begin Pre-Flight            | Skill file      | HIGH  | 5/5/5/5/5 | 2026-03-16 |
| 10  | `.claude/skills/code-reviewer/SKILL.md`                    | Code Reviewer                       | Skill file      | HIGH  | 5/5/5/5/5 | 2026-03-13 |
| 11  | `.claude/skills/debt-runner/SKILL.md`                      | Debt Runner                         | Skill file      | HIGH  | 5/5/5/5/5 | 2026-03-15 |
| 12  | `.claude/skills/ecosystem-health/SKILL.md`                 | Ecosystem Health Dashboard          | Skill file      | HIGH  | 5/5/5/5/5 | 2026-03-11 |
| 13  | `.claude/skills/ecosystem-health/REFERENCE.md`             | Ecosystem Health Reference          | Reference doc   | HIGH  | 5/5/5/5/5 | 2026-03-11 |
| 14  | `.claude/skills/system-test/SKILL.md`                      | System Test — 23-Domain Interactive | Skill file      | HIGH  | 5/5/5/5/5 | 2026-02-18 |
| 15  | `.claude/skills/system-test/reference/WORKFLOW.md`         | System Test Workflow                | Reference doc   | HIGH  | 5/5/5/5/5 | 2026-02-18 |
| 16  | `.claude/skills/pre-commit-fixer/SKILL.md`                 | Pre-Commit Fixer                    | Skill file      | HIGH  | 5/5/5/5/5 | 2026-03-22 |
| 17  | `.claude/skills/quick-fix/SKILL.md`                        | Quick Fix                           | Skill file      | HIGH  | 5/5/5/5/5 | 2026-02-25 |
| 18  | `.claude/skills/gh-fix-ci/SKILL.md`                        | Gh Pr Checks Plan Fix               | Skill file      | HIGH  | 5/5/5/5/5 | 2026-02-25 |
| 19  | `.claude/skills/convergence-loop/SKILL.md`                 | Convergence Loop                    | Skill file      | HIGH  | 5/5/5/5/5 | 2026-03-15 |
| 20  | `scripts/debt/consolidate-all.js`                          | TDMS Master Consolidation Pipeline  | Script          | HIGH  | 5/5/5/5/5 | unknown    |
| 21  | `.claude/skills/_shared/ecosystem-audit/CRITICAL_RULES.md` | Shared Audit Critical Rules         | Shared template | HIGH  | 5/5/5/5/5 | unknown    |

---

## Contradictions

**pr-retro vs. pr-review on TDMS as default option:**

- `pr-review` treats TDMS deferral as a MUST path: every item must be either
  fixed or tracked with a DEBT ID.
- `pr-retro` REFERENCE.md says "DEBT is NOT an option unless the user explicitly
  requests it" and that "filing into TDMS where it gets lost is NOT a default
  option." These two skills have opposite stances on whether TDMS is a default
  or a user-explicit option. This is not a data error — it reflects different
  design philosophies for the two skills. pr-review deals with code issues that
  need tracking; pr-retro deals with process action items that should be
  implemented immediately.

**alerts "defer" language is ambiguous:** The SKILL.md says "Defer items: log
and suggest `/add-debt`" but the REFERENCE.md decision semantics show "Defer" as
re-presenting the alert next session (not a permanent TDMS record). It is
unclear whether deferred alerts become TDMS entries or just
session-carry-forward notes. The phrasing "suggest `/add-debt`" implies it is
optional, not enforced.

---

## Gaps

1. **simplify skill does not exist.** The directory `.claude/skills/simplify/`
   does not exist. It was listed in the investigation prompt but is not present
   in the skills directory. This skill may have been renamed, not yet created,
   or was a future plan. No TDMS routing can be assessed for it.

2. **code-reviewer has no TDMS path but produces findings.** This is a genuine
   gap. A code reviewer can identify issues that can't be immediately fixed
   (architectural problems, pre-existing issues), but there is no structured
   path to TDMS. The SKILL.md does not mention `/add-debt`. Findings that can't
   be fixed inline are effectively lost.

3. **gh-fix-ci produces no permanent record.** When a CI failure is fixed, there
   is no mechanism for the root cause (if it's a systemic debt issue) to be
   captured in TDMS. The skill focuses on immediate fix execution.

4. **consolidate-all.js write path unclear.** The session-end step 7d runs this
   script on every session end. Whether it can silently overwrite or corrupt
   MASTER_DEBT.jsonl with stale data from old audit JSONL files is not
   investigated here. It is noted as a potential hazard in memory file
   `project_reviews_system_health.md`.

5. **pre-commit-fixer "defer to /add-debt" is menu option, not enforced.** If
   the user selects "abort" or closes the session without choosing the defer
   option, pre-existing errors that were identified but not addressed have no
   TDMS record. The closure step at Step 7 offers the choice but cannot enforce
   it.

---

## Serendipity

- The `_shared/ecosystem-audit/CRITICAL_RULES.md` template has a standard Rule 7
  requiring TDMS entries for deferred findings that is explicitly NOT applied to
  operational skills. If the debt-runner expansion aims to increase TDMS intake
  coverage, adapting this shared rule into operational skills would be a direct
  mechanism.

- The `pr-retro` skill's strong anti-TDMS stance ("filing into TDMS where it
  gets lost is NOT a default option") is an interesting design counter-signal.
  It suggests that TDMS intake quality matters more than intake quantity — a
  finding with "unknown" roadmap placement provides little value.

- The `system-test` TDMS sync is the only skill (besides sonarcloud) with a
  batch-sync mechanism. Both have "skip sync" as an explicit option. This
  pattern — preview count, user confirms, bulk write — may be worth replicating
  in other skills.

- `quick-fix` is version 1.0 from 2026-02-25 with no updates. It has no
  structural TDMS awareness and appears to predate the TDMS system's current
  design. It may be a candidate for deprecation in favor of `pre-commit-fixer`
  (which does have TDMS routing).

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are based on direct filesystem reads of the actual SKILL.md files
and reference documents. No training data was used. Every claim is anchored to a
specific file and line.
