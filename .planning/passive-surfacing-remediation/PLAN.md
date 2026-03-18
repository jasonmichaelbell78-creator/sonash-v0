<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Implementation Plan: Passive Surfacing Remediation

## Summary

Fix 33 passive surfacing violations across 8 files to achieve full compliance
with CLAUDE.md Guardrail #6 ("All passive surfacing must force acknowledgment").
Apply pattern-level fixes with tiered severity routing, add "passive surfacing
compliance" category to 4 ecosystem audits, and run `/skill-audit alerts` to
validate sizing after routing changes.

**Decisions:** See DECISIONS.md (17 decisions) **Effort Estimate:** L (~6-8
hours) **Execution:** Single commit, executed in a separate session (Per D16,
D17)

## Files to Modify (8 + 4 audit skills)

### Hook/Script Files (8)

1. **`.claude/hooks/session-start.js`** — 7 violations (3 HIGH, 3 MEDIUM, 1 LOW)
2. **`.claude/hooks/post-write-validator.js`** — 9 violations (1 HIGH, 7 MEDIUM,
   1 LOW)
3. **`.claude/hooks/post-read-handler.js`** — 3 violations (3 HIGH)
4. **`.claude/hooks/user-prompt-handler.js`** — 4 violations (2 HIGH, 2 MEDIUM)
5. **`.claude/hooks/compact-restore.js`** — 1 violation (1 MEDIUM)
6. **`.claude/hooks/check-remote-session-context.js`** — 1 violation (1 MEDIUM)
7. **`.claude/hooks/decision-save-prompt.js`** — 1 violation (1 LOW)
8. **`.husky/pre-commit`** — 1 violation (1 MEDIUM)

### Scripts (6)

9. **`scripts/check-agent-compliance.js`** — 1 violation (MEDIUM)
10. **`scripts/check-review-needed.js`** — 1 violation (MEDIUM)
11. **`scripts/log-override.js`** — 1 violation (LOW)
12. **`scripts/check-backlog-health.js`** — 1 violation (MEDIUM)
13. **`scripts/check-document-sync.js`** — 1 violation (LOW-MEDIUM)
14. **`scripts/append-hook-warning.js`** — 1 violation (LOW)

### Ecosystem Audit Skills (4)

15. **`.claude/skills/hook-ecosystem-audit/SKILL.md`** — Add passive surfacing
    category
16. **`.claude/skills/script-ecosystem-audit/SKILL.md`** — Add passive surfacing
    category
17. **`.claude/skills/session-ecosystem-audit/SKILL.md`** — Add passive
    surfacing category
18. **`.claude/skills/health-ecosystem-audit/SKILL.md`** — Add passive surfacing
    category

### Skill to Update (1)

19. **`.claude/skills/session-begin/SKILL.md`** — Extend warning gate (Section
    4.2) to include build failure flags and HIGH-severity hook warnings

---

## Step 1: Fix session-start.js (7 violations)

Per D1 (pattern-level), D2 (tiered), D3 (session-begin gate), D6 (remove
wallpaper), D8 (extend session-begin gate).

### 1a. HIGH: Build failures "continuing anyway" (lines 415-425)

**Current:** `runCommand()` outputs "⚠️ X failed (continuing anyway)" **Fix:**
Write failure flag to `.claude/state/session-start-failures.json` with failed
command and suggested fix. Session-begin will gate on this file.

```javascript
// After line 419 (the warning)
writeFailureFlag(description, "Run: npm run build / npm ci");
```

### 1b. HIGH: Hook warnings summary no ack gate (lines 798-810)

**Current:** `console.log("Hook warnings: N errors, M warnings")` — no gate
**Fix:** Write error-level warnings to session-start-failures.json so
session-begin gates on them. Keep the console.log for immediate visibility but
mark as `[TRACKED]` per D15.

```javascript
console.log(
  `Hook warnings: ${parts.join(", ")} [TRACKED — will appear in /session-begin gate]`
);
```

### 1c. HIGH: Previous session warning auto-corrects silently (lines 140-154)

**Current:** Warning shown, session auto-closed silently **Fix:** Remove the
misleading warning (the code already handled it), OR change to informational:
"Previous session auto-closed (no session-end detected)." — no action needed
from user since it's already resolved.

### 1d. MEDIUM: Pattern compliance failure no action (line 520)

**Current:** "❌ Patterns: failed" with no remediation **Fix:** Add action
command: `"Fix: npm run patterns:check-all"`

### 1e. MEDIUM: Consolidation warning no action (line 546)

**Current:** "⚠️ exit code 1 (unexpected for --auto)" **Fix:** Add action
command: `"Fix: node scripts/consolidate-findings.js --verbose"` Route to
hook-warnings.jsonl per D10.

### 1f. MEDIUM: JSONL rotation error no action (line 612)

**Current:** Raw error message, no guidance **Fix:** Add action command:
`"Fix: Check disk space and file permissions. Run: node scripts/rotate-jsonl.js --verbose"`
Route to hook-warnings.jsonl per D10.

### 1g. LOW: Informational skip messages (lines 443, 468, 473, 506)

**Current:** "Skipping X (unchanged since last install)" **Fix:** Remove
entirely per D6. Nobody needs this information.

**Done when:** session-start.js has 0 fire-and-forget warnings. All HIGH items
write to session-start-failures.json. All MEDIUM items have action commands and
route to hook-warnings.jsonl. Skip messages removed. **Depends on:** None

---

## Step 2: Fix post-write-validator.js (9 violations)

Per D4 (keep non-blocking, add action commands), D11 (standardized format), D15
(mark as [TRACKED] when routed).

All 9 messages get the standardized format:

```
⚠️  [CATEGORY] WARNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Description]
Fix: [exact command or action]
Ref: [doc link]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Specific fixes:

| Violation                            | Current                  | Fix                                                                         |
| ------------------------------------ | ------------------------ | --------------------------------------------------------------------------- |
| Pattern check reminder (line ~448)   | "Review docs/..."        | `Fix: npm run patterns:check`                                               |
| Component size warning (line ~480)   | Suggestions only         | `Fix: Extract to smaller components. See: docs/agent_docs/CODE_PATTERNS.md` |
| App Check warning (line ~515)        | "Currently DISABLED"     | Remove or move to DEBUG per D6 (not actionable while disabled)              |
| TypeScript strict (line ~571)        | Lists `any` usage        | `Fix: Replace any with proper type. See: tsconfig.json strict mode`         |
| Repository pattern (line ~652)       | Shows correct pattern    | `Fix: Move query to lib/firestore-service.ts`                               |
| Agent suggestion Phase 1 (line ~911) | "Or run /code-reviewer"  | `Fix: Run /code-reviewer after completing changes` + mark `[TRACKED]`       |
| Phase transition (line ~927)         | Informational milestone  | Move to DEBUG per D6                                                        |
| Delegated review queued (line ~797)  | "Consider spawning Task" | `Fix: Spawn code-reviewer agent now` + mark `[TRACKED]`                     |
| Test registry reminder (line ~1011)  | Already has command      | COMPLIANT — no change needed                                                |

Route MEDIUM items to hook-warnings.jsonl via `append-hook-warning.js`. Mark
routed items with `[TRACKED]` per D15.

**Done when:** All 8 non-compliant messages have `Fix:` action commands. Phase
transition moved to DEBUG. App Check removed or DEBUG-only. **Depends on:** None

---

## Step 3: Fix post-read-handler.js (3 violations)

Per D2 (HIGH → blocking gate), D8 (session-begin gate pattern).

### 3a. HIGH: Large context warning (lines ~203-217)

**Current:** "LARGE CONTEXT WARNING" + "Tip: Use /save-context" — no gate
**Fix:** Write flag to `.claude/state/context-warnings.json`. Session-begin and
user-prompt-handler can gate on this. Add
`Fix: Run /save-context or /checkpoint`

### 3b. HIGH: Many files warning (lines ~191-201)

**Current:** "Consider using /save-context" — passive suggestion **Fix:** Same
as 3a — write flag, mark `[TRACKED]`, add explicit `Fix:` command.

### 3c. HIGH: Auto-save context prepared (lines ~345-354)

**Current:** "Please save..." — no gate **Fix:** Write flag, mark `[TRACKED]`,
add `Fix: Run /checkpoint --mcp`

**Done when:** All 3 warnings write state flags and have `Fix:` commands.
**Depends on:** None

---

## Step 4: Fix user-prompt-handler.js (4 violations)

Per D5 (keep cooldowns, exclude HIGH), D2 (tiered routing).

### 4a. HIGH: Alerts reminder cooldown suppresses critical items (lines ~44-54)

**Current:** 10-minute COOLDOWN_MS skips ALL alerts including critical **Fix:**
Split cooldown: HIGH severity alerts bypass cooldown entirely. MEDIUM+ LOW
respect the 10-minute window.

### 4b. HIGH: Security/debugging directives with dedup (lines ~220+)

**Current:** Deduplicated per 15-min window **Fix:** These are already COMPLIANT
per convergence (MUST directives). No change needed — just confirm dedup doesn't
suppress first occurrence.

### 4c. MEDIUM: Session ending suggestion (lines ~413-427)

**Current:** "Consider running /session-end" — passive **Fix:**
`Fix: Run /session-end before closing` + route to hook-warnings.jsonl

### 4d. MEDIUM: Multi-step task suggestion (lines ~486-506)

**Current:** "Consider planning" — passive **Fix:**
`Fix: Run /deep-plan or EnterPlanMode` + mark `[TRACKED]`

**Done when:** HIGH alerts bypass cooldown. All suggestions have `Fix:`
commands. **Depends on:** None

---

## Step 5: Fix remaining hooks (3 files, 3 violations)

### 5a. compact-restore.js (MEDIUM, lines ~134-160)

**Current:** Recovery header output, no ack requirement **Fix:** Add `[TRACKED]`
marker and write recovery flag for session-begin gate. Add:
`"Review recovery state above. Session-begin will verify.""`

### 5b. check-remote-session-context.js (MEDIUM, lines ~234-249)

**Current:** "Consider checking out or merging" — passive **Fix:**
`Fix: git merge [branch] or git show [branch]:SESSION_CONTEXT.md` Route to
hook-warnings.jsonl.

### 5c. decision-save-prompt.js (LOW, lines ~87-103)

**Current:** Decision template shown, always exits 0 **Fix:** Add
`Fix: Document decision in docs/SESSION_DECISIONS.md` — keep non-blocking but
make action explicit.

**Done when:** All 3 have action commands. compact-restore writes recovery flag.
**Depends on:** None

---

## Step 6: Fix pre-commit (1 violation)

### 6a. Prettier formatting failed (MEDIUM, line ~526)

**Current:** "⚠️ Prettier formatting failed for DOCUMENTATION_INDEX.md
(non-blocking)" **Fix:** `Fix: npx prettier --write DOCUMENTATION_INDEX.md` +
route to hook-warnings.jsonl.

**Done when:** Warning has action command and is tracked. **Depends on:** None

---

## Step 7: Fix scripts (6 violations)

Per D1 (pattern-level), D4 (add action commands).

| Script                              | Fix                                                                                                |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `check-agent-compliance.js:164-187` | Add `Fix: Run recommended agents listed above` to non-STRICT warning                               |
| `check-review-needed.js:837`        | Change "Consider running" to `Fix: /multi-ai-audit or npm run audit:comprehensive`                 |
| `log-override.js:646`               | Change to `Fix: Add --reason="your reason" or set SKIP_REASON env var`                             |
| `check-backlog-health.js:237-239`   | Add specific DEBT IDs and `Fix: npm run debt:plan`                                                 |
| `check-document-sync.js:421-445`    | Include file paths in default output (not just --verbose). Add `Fix: npm run docs:check --verbose` |
| `append-hook-warning.js:76-117`     | Add `Fix: rm [symlink] && reset` or `Fix: npm run hooks:rotate-logs`                               |

**Done when:** All 6 scripts have explicit `Fix:` commands in their warnings.
**Depends on:** None

---

## Step 8: Update session-begin skill (Per D8, D14)

Extend `.claude/skills/session-begin/SKILL.md` Section 4.2 (warning gate) to
include:

1. Build failure flags from session-start-failures.json
2. HIGH-severity hook warnings from hook-warnings.jsonl
3. Context warnings from context-warnings.json
4. Recovery flags from compact-restore

The gate should present these with the existing Y/R (Yes/Review) pattern and
require acknowledgment before proceeding to work.

**Done when:** Session-begin gates on all HIGH-severity infrastructure flags.
**Depends on:** Steps 1-5 (flags must be written before session-begin can read
them)

---

## Step 9: Add "Passive Surfacing Compliance" to Ecosystem Audits (Per D9)

Add a new category to each of these 4 ecosystem audit skills:

### Category definition (same for all 4, adapted to scope):

```markdown
### Category N: Passive Surfacing Compliance

**What it checks:**

- All warnings/errors surfaced to users have explicit action paths (`Fix: X`)
- HIGH severity warnings route to session-begin gate or /alerts
- MEDIUM warnings route to hook-warnings.jsonl with `[TRACKED]` marker
- No "Consider running..." without explicit command
- No "continuing anyway" without decision gate
- No informational wallpaper (skip messages, phase transitions in non-DEBUG)
- Cooldowns do not suppress HIGH severity items

**Scoring:**

- A: 0 violations
- B: 1-2 LOW violations
- C: 3-5 violations or 1 MEDIUM
- D: 6+ violations or 1+ HIGH
- F: Systemic non-compliance

**How to check:**

- Grep for `console.log.*⚠️`, `console.error.*⚠️`, `echo.*⚠️` without
  corresponding `Fix:` action
- Grep for "continuing anyway", "non-blocking", "Consider running"
- Verify HIGH items write to state flags
- Verify MEDIUM items call append-hook-warning.js
```

Files to modify:

1. `.claude/skills/hook-ecosystem-audit/SKILL.md`
2. `.claude/skills/script-ecosystem-audit/SKILL.md`
3. `.claude/skills/session-ecosystem-audit/SKILL.md`
4. `.claude/skills/health-ecosystem-audit/SKILL.md`

**Done when:** All 4 skills have the new category. Category count updated in
skill headers. **Depends on:** None

---

## Step 10: Audit Checkpoint

Run code-reviewer on all modified files (~18 files).

**Done when:** All findings addressed or tracked. **Depends on:** Steps 1-9

---

## Step 11: Run `/skill-audit alerts` (Per D7, D13)

After all fixes land, run `/skill-audit alerts` with these focus areas:

1. **Category count** — how many categories now? (was 16 limited / 36 full)
2. **Per-alert interaction time** — is the walkthrough too long?
3. **Category grouping** — does /alerts need pagination or severity filtering?
4. **Duplicate detection** — do routed hook-warnings create duplicates with
   existing /alerts categories?
5. **Size/flow** — is the skill becoming unwieldy? Does it need splitting?
6. **Standard skill-audit categories** — all 11 quality categories as usual

**Done when:** Skill-audit produces decision record. Any sizing issues addressed
or tracked. **Depends on:** Steps 1-10

---

## Parallelization Guidance

**Steps 1-7** can ALL run in parallel (different files, no dependencies). **Step
8** depends on Steps 1-5 (needs to know what flags are written). **Step 9** can
run in parallel with Steps 1-8 (different files). **Step 10** depends on Steps
1-9. **Step 11** depends on Step 10.

**Optimal execution:** Launch Steps 1-7 + Step 9 in parallel (8 agents). Then
Step 8. Then Step 10. Then Step 11.

---

## Violation-to-Step Mapping

| Violation # | File                            | Severity   | Step    |
| ----------- | ------------------------------- | ---------- | ------- |
| V1-V7       | session-start.js                | 3H, 3M, 1L | Step 1  |
| V8-V16      | post-write-validator.js         | 1H, 7M, 1L | Step 2  |
| V17-V19     | post-read-handler.js            | 3H         | Step 3  |
| V20-V23     | user-prompt-handler.js          | 2H, 2M     | Step 4  |
| V24         | compact-restore.js              | 1M         | Step 5a |
| V25         | check-remote-session-context.js | 1M         | Step 5b |
| V26         | decision-save-prompt.js         | 1L         | Step 5c |
| V27         | pre-commit                      | 1M         | Step 6  |
| V28-V33     | scripts (6 files)               | 3M, 3L     | Step 7  |
