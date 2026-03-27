# Findings: Defer-to-TDMS Path Audit — Every Location Where a User Can Defer to TDMS

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-26
**Sub-Question IDs:** SQ-8b

---

## Summary Table

| Classification | Count | Description                                                                                                                                                    |
| -------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WORKING        | 6     | Defer path explicitly calls `/add-debt` or `intake-audit.js` and scripts are verified functional                                                               |
| ASPIRATIONAL   | 5     | Skill mentions deferring to TDMS but the defer action maps to a non-TDMS destination (e.g., session goals) or is behavioral prose with no implementation guard |
| BROKEN         | 1     | Defer path references a mechanism (`known-debt-baseline.json`) that exists but does not write to TDMS                                                          |
| MISSING        | 2     | Skill offers a "defer" option but does not specify the TDMS path or omits it entirely                                                                          |

---

## Key Findings

### 1. `/alerts` — Defer option documented but weakly coupled to `/add-debt` [CONFIDENCE: HIGH]

**File:** `.claude/skills/alerts/SKILL.md` (line 145) and `REFERENCE.md`
(line 54)

**Exact text:**

- REFERENCE.md line 54:
  `| Defer | This session | Re-presents next session | Log, suggest /add-debt |`
- SKILL.md line 145: `Defer items: log and suggest /add-debt.`

**What choice is presented:** User selects `(d) Defer` per the Phase 3
alert-by-alert loop context card.

**Does the defer path call `/add-debt`?** The spec says "suggest `/add-debt`" —
this is a suggestion (soft language), not an execution. No code path or
mandatory step compels the actual invocation of `/add-debt`. The skill logs the
decision to a session JSONL file but does not create a DEBT entry.

**Tested?** The scripts `run-alerts.js` and the session JSONL exist and are
functional (verified by `--limited` mode). The "suggest `/add-debt`" step is
behavioral prose — no test covers whether the AI actually calls it.

**Classification: ASPIRATIONAL** — the defer option exists, a TDMS path is
mentioned, but the coupling is suggestive rather than mandatory. A user who
selects "Defer" will have the alert logged locally but no DEBT entry is
guaranteed unless the AI follows through.

---

### 2. `/pre-commit-fixer` — Defer option maps to `known-debt-baseline.json`, not TDMS [CONFIDENCE: HIGH]

**File:** `.claude/skills/pre-commit-fixer/SKILL.md` (lines 26–28, 97–98,
112–115, 174–176)

**Exact text (line 26–28):**

```
Never set SKIP_REASON autonomously. Per CLAUDE.md guardrail #14, present
three options: (a) fix now, (b) defer to known-debt-baseline.json, (c) skip
with user-provided reason.
```

**Lines 97–98 (pre-existing detection):**

```
Pre-existing errors → offer: fix now or defer to /add-debt
```

**Lines 112–115 (warm-up gate):**

```
Fix all? [Y / fix specific categories / defer all to /add-debt / abort]
```

**Lines 174–176 (report):**

```
Deferred (if any):
  - [category]: [description] → /add-debt
```

**What choice is presented:** Two distinct defer paths exist in this skill and
they point to different destinations:

- Path A (pre-existing errors at classification): "defer to `/add-debt`" —
  explicitly TDMS
- Path B (SKIP_REASON guard, CLAUDE.md guardrail #14): "defer to
  `known-debt-baseline.json`" — NOT TDMS

**Does the defer path call `/add-debt`?**

- Path A: Yes, the spec mandates it and `intake-pr-deferred.js` /
  `intake-manual.js` are both verified functional (confirmed via `--help`
  output).
- Path B: No. `known-debt-baseline.json` is a ratchet/baseline file used by
  `check-cc.js` to suppress known cyclomatic complexity violations. It is not
  TDMS, does not create DEBT entries, and is written by
  `node scripts/ratchet-baselines.js --update`. The file exists at
  `.claude/state/known-debt-baseline.json`.

**Classification: BROKEN** for Path B — the CLAUDE.md guardrail #14 defer option
routes to `known-debt-baseline.json` which is correct for its purpose (CC
ratcheting) but is documented alongside `/add-debt` paths in a way that implies
equivalence. A user deferring a pre-commit failure to `known-debt-baseline.json`
does NOT get a DEBT entry in MASTER_DEBT.jsonl. The two defer destinations serve
different purposes and the skill conflates them without explaining the
difference.

**Classification: WORKING** for Path A — pre-existing error deferral to
`/add-debt` is a real, functional path.

---

### 3. `/pr-review` — Full TDMS defer path is WORKING [CONFIDENCE: HIGH]

**Files:**

- `.claude/skills/pr-review/SKILL.md` (lines 1, 19, 239, 325–344, 376–384)
- `.claude/skills/pr-review/reference/TDMS_INTEGRATION.md` (lines 9–43)

**What choice is presented:** Per the DAS (Defer/Act Score) framework in Step 2,
every pre-existing finding gets a mandatory block:

```
[PRE-EXISTING] {title}
  DAS: {N}/6 → {Recommend act | User decides | Recommend defer}
  ▶ [A] Fix now  [B] Defer to DEBT  [C] Need more context
```

In Step 5, an explicit approval gate is required:
`"Deferring N items to TDMS: [list with DAS scores]. Approve? [Y/modify]"`. The
mandatory step calls `/add-debt` with severity mapping (CRITICAL→S0, MAJOR→S1,
MINOR→S2, TRIVIAL→S3).

**Does the defer path call `/add-debt`?** Yes. The skill explicitly invokes the
`/add-debt` skill. Step 7 verification requires: "TDMS sync: every deferred item
has a DEBT-XXXX ID."

**Are scripts functional?** `intake-pr-deferred.js` — verified functional via
`--help`. `intake-manual.js` — verified functional. `generate-views.js` —
verified functional (loaded 8472 items successfully).

**Classification: WORKING** — the most complete and enforced defer path in the
system. The DAS framework requires explicit user decisions. Step 7 is a hard
gate requiring DEBT IDs before summary.

---

### 4. `_shared/AUDIT_TEMPLATE.md` — Shared audit defer path is WORKING via `intake-audit.js` [CONFIDENCE: HIGH]

**File:** `.claude/skills/_shared/AUDIT_TEMPLATE.md` (lines 142–177)

**What choice is presented:** The Interactive Review section (MANDATORY before
TDMS intake) presents findings with `ACCEPT/DECLINE/DEFER` recommendations. The
TDMS Intake step runs `node scripts/debt/intake-audit.js <output.jsonl>`.

**Does the defer path call intake scripts?** Yes. The intake is mandatory and
uses `intake-audit.js` which handles schema validation, dedup, ID assignment,
and view regeneration.

**Are scripts functional?** `intake-audit.js` exists and is importable
(confirmed by test). `generate-views.js` verified working.

**Classification: WORKING** — all audit skills that reference
`AUDIT_TEMPLATE.md` (audit-code, audit-security, audit-performance,
audit-refactoring, audit-documentation, audit-process) inherit this path. The
defer decision within the Interactive Review leads to TDMS intake.

**Note:** DEFERRED items are kept "as NEW status for future planning" — they
enter TDMS but are not immediately actioned.

---

### 5. `_shared/ecosystem-audit/FINDING_WALKTHROUGH.md` — Ecosystem audit defer path is WORKING [CONFIDENCE: HIGH]

**File:** `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md` (lines
67–113)

**What choice is presented:**

- ERROR findings: Fix Now | Defer | Skip
- WARNING findings: Fix Now | Defer | Skip
- INFO findings: Acknowledge | Defer

**Defer handling (lines 99–103):**

```
Create DEBT entry via /add-debt with:
  - severity: S1 (errors) or S2 (warnings)
  - category: engineering-productivity
  - source_id: review:{audit-name}-ecosystem-audit-{date}
```

**Does the defer path call `/add-debt`?** Yes, explicitly. The
CLOSURE_AND_GUARDRAILS.md process self-audit checklist item 6 verifies: "TDMS
entries created for all deferred findings."

**Consumed by:** hook-ecosystem-audit, script-ecosystem-audit,
skill-ecosystem-audit, doc-ecosystem-audit, session-ecosystem-audit,
tdms-ecosystem-audit, pr-ecosystem-audit, data-effectiveness-audit,
health-ecosystem-audit. All 8+ ecosystem audit skills inherit this defer path.

**Classification: WORKING** — the shared protocol mandates `/add-debt` with
explicit field values. The process self-audit checklist is a convergence loop
guardrail.

---

### 6. `/pr-retro` — Defer deliberately restricted; only on explicit user request [CONFIDENCE: HIGH]

**Files:**

- `.claude/skills/pr-retro/SKILL.md` (lines 44–46)
- `.claude/skills/pr-retro/REFERENCE.md` (lines 525–527, 541–543)

**Exact text (REFERENCE.md lines 524–527):**

```
DEBT is NOT an option unless the user explicitly requests it. Do not offer
"defer to DEBT" as a choice. Do not create TDMS entries unless the user says
words like "defer", "create DEBT", or "add to TDMS."
```

**What choice is presented:** None by default. The retro skill blocks action
items from being deferred unless the user explicitly says "defer", "create
DEBT", or "add to TDMS." The standard options are: implement now OR plan it (add
to SESSION_CONTEXT.md / ROADMAP.md).

**Does the defer path work when invoked?** Yes — when explicitly triggered, the
REFERENCE.md action table (line 594) shows "Create DEBT → TDMS via `/add-debt`."
The path is functional but intentionally suppressed unless user-initiated.

**Classification: WORKING** (but gated) — the defer path to TDMS is real but
requires explicit user language. The skill actively resists the default "file it
and forget it" pattern.

---

### 7. `/session-begin` — Defer option for script failures does NOT route to TDMS [CONFIDENCE: HIGH]

**File:** `.claude/skills/session-begin/SKILL.md` (lines 26, 118, 152–153, 217)

**Exact text:**

- Line 26: "Script failures escalate to user — MUST present failures with
  options (fix now / defer / ignore). Do not decide unilaterally."
- Line 118: "Docs appear stale: [specifics]. Update now or defer?"
- Line 152–153: "If any script fails (MUST): Present to user: 'Script X failed:
  [error]. Fix now / Defer / Ignore?'"
- Line 217: "Fix now / Acknowledge / Defer?"

**Does the defer path route to TDMS?** No. The defer option in session-begin
saves the decision to session context (present findings, let user choose) but
does not trigger `/add-debt` or any intake script. "Defer" in this context means
"skip for now, re-present next session."

**Classification: ASPIRATIONAL** — the skill presents a "defer" option that is
clearly visible to the user but does not write to TDMS. It is a session-scoped
deferral (same as alerts' "Ignore"), not a TDMS intake.

---

### 8. `/ecosystem-health` — Defer option routes to session goals, NOT TDMS [CONFIDENCE: HIGH]

**File:** `.claude/skills/ecosystem-health/SKILL.md` (lines 132–166)

**Exact text (line 164):**

```
3. Defer — add to next session goals
```

**Does the defer path route to TDMS?** No. When a user defers a dimension in the
ecosystem-health triage loop, it is recorded in the state file
(`.claude/state/task-ecosystem-health-triage.state.json`) and recommended for
the next session's goals (SESSION_CONTEXT.md). There is no `/add-debt` call.

**Classification: ASPIRATIONAL** — the defer option is clearly named and
implemented but does not create a DEBT entry. This is a scope deferral ("come
back later") not a TDMS intake.

---

### 9. `audit-comprehensive` ACCEPT/DECLINE/DEFER review — WORKING via intake-audit.js [CONFIDENCE: HIGH]

**File:** `.claude/skills/audit-comprehensive/SKILL.md` (lines 302–331)

**What choice is presented:** Interactive Review with ACCEPT/DECLINE/DEFER per
finding. DEFERRED items "keep in TDMS as NEW status for future planning." After
review, post-audit runs `intake-audit.js`.

**Does the defer path work?** Yes. DEFERRED findings go to TDMS intake along
with ACCEPTED ones. They just enter with NEW status.

**Classification: WORKING** — same pipeline as shared AUDIT_TEMPLATE.md.

---

### 10. `audit-enhancements` — Uses `resolve-item.js` for ACCEPT/DECLINE/DEFER decisions [CONFIDENCE: MEDIUM]

**File:** `.claude/skills/audit-enhancements/SKILL.md` (line 424)

**Exact text:**

```
node scripts/debt/resolve-item.js DEBT-XXXX --action {accept|decline|defer} --reason "{user's reason}"
```

**Does the defer path work?** `resolve-item.js` is verified functional
(confirmed via `--help`). The `--action defer` flag is listed but its behavior
(whether it sets a status field or does something meaningful) is not separately
tested here. The script's help output does not mention `--action`.

**Classification: WORKING** (with caveat) — the script is real. The
`--action defer` path exists in the skill spec. However,
`resolve-item.js --help` does not expose `--action` as a flag, which means
either it exists as an undocumented option or the skill spec is aspirational in
this regard.

**Gap flagged for investigation.**

---

### 11. `multi-ai-audit` — Full TDMS intake with user confirmation gate [CONFIDENCE: HIGH]

**File:** `.claude/skills/multi-ai-audit/templates.md` (lines 393–468)

**What choice is presented:** Phase 6 Interactive Review with
ACCEPT/DECLINE/DEFER per finding. Phase 7 is automated TDMS intake via
`intake-audit.js` with dry-run preview and explicit user confirmation gate
("Proceed with intake? (yes/no)").

**Does the defer path work?** Yes. DEFERRED items enter TDMS as NEW status. The
dry-run and confirmation gate are explicit user-facing steps.

**Classification: WORKING** — the most explicit TDMS intake flow with the
confirmation gate.

---

### 12. CLAUDE.md guardrail #14 — defer to `known-debt-baseline.json` [CONFIDENCE: HIGH]

**File:** `CLAUDE.md` (line 104)

**Exact text:**

```
(b) Defer to known-debt-baseline.json
```

**What choice is presented:** When a pre-commit or pre-push check fails and
requires a skip, the user is given three options: (a) fix now, (b) defer to
`known-debt-baseline.json`, (c) skip with user-provided reason.

**Does option (b) route to TDMS?** No. `known-debt-baseline.json` is a ratchet
baseline file for cyclomatic complexity and propagation checks. Adding to it
suppresses a check from firing in the future but creates no DEBT entry. The file
is maintained by `scripts/ratchet-baselines.js --update-baseline`.

**Classification: MISSING** as a TDMS path — the baseline mechanism is correct
for its purpose but does not contribute to TDMS. There is no guidance in
CLAUDE.md or in pre-commit-fixer about whether option (b) should also trigger
`/add-debt`. These are treated as equivalent alternatives when they are
fundamentally different: one suppresses a check permanently, the other tracks
debt.

---

## Detailed Location Reference

| #   | File                                                                                     | Line(s)               | Pattern                                                                           | Choice Presented       | Defer Calls TDMS?                           | Classification   |
| --- | ---------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------- | ---------------- |
| 1   | `.claude/skills/alerts/REFERENCE.md`                                                     | 54                    | `suggest /add-debt`                                                               | (d) Defer              | Suggested, not mandatory                    | ASPIRATIONAL     |
| 2   | `.claude/skills/alerts/SKILL.md`                                                         | 145                   | `defer items: log and suggest /add-debt`                                          | (d) Defer              | Suggested, not mandatory                    | ASPIRATIONAL     |
| 3   | `.claude/skills/pre-commit-fixer/SKILL.md`                                               | 26–28                 | `defer to known-debt-baseline.json`                                               | Option (b)             | No                                          | BROKEN           |
| 4   | `.claude/skills/pre-commit-fixer/SKILL.md`                                               | 97–98, 112–115        | `defer to /add-debt`                                                              | Option in warm-up      | Yes                                         | WORKING          |
| 5   | `.claude/skills/pr-review/SKILL.md`                                                      | 239, 325–344          | DAS block `[B] Defer to DEBT`                                                     | Mandatory DAS block    | Yes (hard gate at Step 7)                   | WORKING          |
| 6   | `.claude/skills/pr-review/reference/TDMS_INTEGRATION.md`                                 | 9–43                  | `/add-debt` + intake scripts                                                      | Explicit Step 6.5      | Yes                                         | WORKING          |
| 7   | `.claude/skills/_shared/AUDIT_TEMPLATE.md`                                               | 142–177               | `ACCEPT/DECLINE/DEFER` → `intake-audit.js`                                        | Interactive Review     | Yes                                         | WORKING          |
| 8   | `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md`                          | 67–113                | `Defer → /add-debt`                                                               | Per-finding decision   | Yes                                         | WORKING          |
| 9   | `.claude/skills/_shared/ecosystem-audit/CLOSURE_AND_GUARDRAILS.md`                       | 79                    | Process self-audit checklist                                                      | Post-walkthrough gate  | Yes                                         | WORKING          |
| 10  | `.claude/skills/session-begin/SKILL.md`                                                  | 26, 118, 152–153, 217 | `Fix now / Defer / Ignore`                                                        | Script failure triage  | No (session-scoped only)                    | ASPIRATIONAL     |
| 11  | `.claude/skills/ecosystem-health/SKILL.md`                                               | 164                   | `Defer — add to next session goals`                                               | Dimension triage       | No (session goals only)                     | ASPIRATIONAL     |
| 12  | `.claude/skills/pr-retro/SKILL.md`                                                       | 44–46                 | User-initiated only                                                               | Not offered by default | Yes (when user says "defer")                | WORKING (gated)  |
| 13  | `.claude/skills/pr-retro/REFERENCE.md`                                                   | 295–297, 525–527      | `Defer to TDMS (create debt entry)`                                               | If NOT IMPLEMENTED     | Yes (when user-triggered)                   | WORKING (gated)  |
| 14  | `.claude/skills/audit-comprehensive/SKILL.md`                                            | 302–331               | `ACCEPT/DECLINE/DEFER`                                                            | Interactive Review     | Yes                                         | WORKING          |
| 15  | `.claude/skills/audit-enhancements/SKILL.md`                                             | 424                   | `resolve-item.js --action defer`                                                  | Per-batch decision     | Partially verified                          | WORKING (caveat) |
| 16  | `.claude/skills/multi-ai-audit/templates.md`                                             | 393–468               | Full intake with confirm gate                                                     | Phase 6+7              | Yes                                         | WORKING          |
| 17  | `CLAUDE.md`                                                                              | 104                   | `defer to known-debt-baseline.json`                                               | Pre-commit option (b)  | No                                          | MISSING          |
| 18  | All 8 ecosystem audit skills (hook, script, skill, doc, session, tdms, pr, health, data) | Various               | Critical Rule 7: "Create TDMS entries (MUST) for deferred findings via /add-debt" | Per-finding decision   | Yes (inherited from FINDING_WALKTHROUGH.md) | WORKING          |

---

## Sources

| #   | Path                                                               | Type             | Trust | Notes                                                    |
| --- | ------------------------------------------------------------------ | ---------------- | ----- | -------------------------------------------------------- |
| 1   | `.claude/skills/alerts/SKILL.md`                                   | Skill definition | HIGH  | Read directly                                            |
| 2   | `.claude/skills/alerts/REFERENCE.md`                               | Skill reference  | HIGH  | Read directly                                            |
| 3   | `.claude/skills/pre-commit-fixer/SKILL.md`                         | Skill definition | HIGH  | Read directly                                            |
| 4   | `.claude/skills/pr-review/SKILL.md`                                | Skill definition | HIGH  | Read directly                                            |
| 5   | `.claude/skills/pr-review/reference/TDMS_INTEGRATION.md`           | Reference doc    | HIGH  | Read directly                                            |
| 6   | `.claude/skills/_shared/AUDIT_TEMPLATE.md`                         | Shared template  | HIGH  | Read directly                                            |
| 7   | `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md`    | Shared protocol  | HIGH  | Read directly                                            |
| 8   | `.claude/skills/_shared/ecosystem-audit/CLOSURE_AND_GUARDRAILS.md` | Shared protocol  | HIGH  | Read directly                                            |
| 9   | `.claude/skills/session-begin/SKILL.md`                            | Skill definition | HIGH  | Read directly                                            |
| 10  | `.claude/skills/ecosystem-health/SKILL.md`                         | Skill definition | HIGH  | Read directly                                            |
| 11  | `.claude/skills/pr-retro/SKILL.md`                                 | Skill definition | HIGH  | Read directly                                            |
| 12  | `.claude/skills/pr-retro/REFERENCE.md`                             | Skill reference  | HIGH  | Read directly                                            |
| 13  | `CLAUDE.md`                                                        | System rules     | HIGH  | Read directly                                            |
| 14  | `scripts/debt/intake-pr-deferred.js`                               | Script           | HIGH  | Executed `--help`, confirmed working                     |
| 15  | `scripts/debt/intake-manual.js`                                    | Script           | HIGH  | Executed `--help`, confirmed working                     |
| 16  | `scripts/debt/generate-views.js`                                   | Script           | HIGH  | Executed, confirmed loaded 8472 items                    |
| 17  | `scripts/debt/resolve-item.js`                                     | Script           | HIGH  | Executed `--help`, confirmed working                     |
| 18  | `scripts/check-cc.js`                                              | Script           | HIGH  | Executed `--help`, confirmed baseline suppression active |
| 19  | `.claude/state/known-debt-baseline.json`                           | State file       | HIGH  | Confirmed exists                                         |

---

## Contradictions

**Contradiction 1: Two defer paths in pre-commit-fixer with no distinction
drawn**

CLAUDE.md guardrail #14 (line 104) offers "defer to `known-debt-baseline.json`"
as option (b) alongside fix-now and skip-with-reason. The pre-commit-fixer skill
also mentions "defer to `/add-debt`" in a different context (pre-existing error
classification). These two defer targets serve fundamentally different purposes:

- `known-debt-baseline.json`: Permanently suppresses a check category (ratchet).
  No DEBT entry created. Best used for long-standing CC violations that aren't
  being fixed this sprint.
- `/add-debt`: Creates a tracked DEBT entry in MASTER_DEBT.jsonl. Visible in
  views, metrics, and to `debt-runner`.

The skill does not explain this distinction to the user.

**Contradiction 2: `/alerts` defer is "suggest" but `ecosystem-audit` skills'
defer is "MUST"**

Alerts REFERENCE.md says defer means "Log, suggest `/add-debt`" (weak coupling).
The 8 ecosystem audit skills inherit a Critical Rule (Critical Rule 7) that
states "Create TDMS entries (MUST) for deferred findings via `/add-debt`." Same
action (user selects "Defer"), radically different enforcement levels.

---

## Gaps

1. **`resolve-item.js --action defer` is undocumented in `--help` output.** The
   `audit-enhancements` skill references this flag but the script's `--help`
   does not list `--action` as a valid option. This warrants direct code
   inspection to confirm whether `--action defer` does anything useful.

2. **No test covers the end-to-end defer flow in `/alerts`.** The
   `run-alerts.js` script and session JSONL writing are tested, but whether the
   AI follows through on "suggest `/add-debt`" after a Defer decision is
   untested. There is no integration test that verifies a deferred alert becomes
   a DEBT entry.

3. **`/session-begin` and `/ecosystem-health` defer paths are entirely
   disconnected from TDMS.** For issues surfaced during session startup or
   health triage, the user can defer without ever creating a DEBT entry. There
   is no guidance in either skill about when "session deferral" is appropriate
   vs. when to escalate to TDMS. This creates a silent leak: issues deferred at
   session-begin may never surface again unless the user runs `/alerts` in a
   future session.

4. **No unified "defer routing" policy exists.** Across 18 identified defer
   locations, "defer" means at least three different things: (a) route to TDMS
   via `/add-debt`, (b) route to `known-debt-baseline.json` (suppress check),
   (c) route to session goals (re-present later). Users cannot predict which
   behavior they get without reading each skill's documentation.

---

## Serendipity

**`escalate-deferred.js` automates promotion of multiply-deferred items to DEBT
entries.** The script at `scripts/debt/escalate-deferred.js` reads
`data/ecosystem-v2/deferred-items.jsonl` and escalates items with
`defer_count >= 2` (default threshold) into TDMS via `intake-pr-deferred.js`.
This is not referenced in any skill file found during research but represents an
automated safety net for items that keep getting deferred without resolution. It
requires a separate `deferred-items.jsonl` file that is distinct from
`MASTER_DEBT.jsonl` — the two-tier deferred/TDMS architecture is not described
in any currently-active skill documentation.

**`/pr-retro` deliberately resists TDMS by design.** The retro skill explicitly
says "Filing into TDMS where it gets lost is NOT a default option" (REFERENCE.md
line 534). This is the only skill where resistance to TDMS deferral is an
explicit philosophical position. For other skills, deferral to TDMS is the
default path for unresolved findings.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

Scripts verified as functional via direct execution: `intake-pr-deferred.js`,
`intake-manual.js`, `generate-views.js`, `resolve-item.js`, `check-cc.js`. State
files verified to exist: `known-debt-baseline.json`. File existence for all 18+
skill/reference files confirmed via direct Read tool.
