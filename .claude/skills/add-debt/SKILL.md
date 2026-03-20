---
name: add-debt
description: >-
  Add technical debt items to MASTER_DEBT.jsonl. Supports two workflows:
  PR-context deferred debt (with PR number) and manual ad-hoc debt discovery.
  Detects which workflow to use based on whether a PR number is provided.
---

# Add Technical Debt

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-20
**Last Validated:** 2026-03-20
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Purpose:** Track technical debt items in the canonical TDMS tracker, whether
discovered during PR review (deferred) or during ad-hoc development.

**Quick Reference:** Minimum fields: file, line, title, severity (S0-S3),
category. For PR deferrals: also provide PR number and reason. If all fields are
provided in one message, skip to Step 4 (preview).

## When to Use

- During PR review when issues are deferred for later (provide PR number)
- When you discover tech debt during development outside formal audits
- When an item should be tracked but won't be fixed immediately

## When NOT to Use

- When running a formal audit — audits use `intake-audit.js` directly for bulk
  import
- When adding items from automated sources (hooks, CI) — use
  `scripts/debt/intake-audit.js` directly
- When items should be fixed immediately rather than tracked
- When the item is already tracked in MASTER_DEBT.jsonl (check first)

**Output Location:** `docs/technical-debt/MASTER_DEBT.jsonl`

---

## Workflow Detection

This skill selects the appropriate workflow:

| Context               | Workflow     | Source ID Format    |
| --------------------- | ------------ | ------------------- |
| PR number provided    | **Deferred** | `PR-{number}-{seq}` |
| No PR number (ad-hoc) | **Manual**   | `manual`            |

---

## Common Fields

| Field         | Required | Description                                                                  | Example                     |
| ------------- | -------- | ---------------------------------------------------------------------------- | --------------------------- |
| `file`        | Yes      | File path (relative to repo root)                                            | `components/auth/login.tsx` |
| `line`        | Yes      | Line number                                                                  | `145`                       |
| `title`       | Yes      | Short description (< 80 chars)                                               | `Missing error boundary`    |
| `severity`    | Yes      | S0 (Critical), S1 (High), S2 (Medium), S3 (Low)                              | `S2`                        |
| `category`    | Yes      | See Category Options below                                                   | `code-quality`              |
| `type`        | No       | bug, code-smell, vulnerability, hotspot, tech-debt, process-gap, enhancement | `tech-debt` (default)       |
| `effort`      | No       | E0 (<30m), E1 (<2h), E2 (<8h), E3 (>8h)                                      | `E1`                        |
| `description` | No       | Detailed description                                                         | `Component lacks error...`  |
| `source_pr`   | No       | Originating PR number (auto-set for deferred items, null for manual/audit)   | `325`                       |

### Deferred-Only Fields (when PR number is provided)

| Field       | Required | Description                       | Example              |
| ----------- | -------- | --------------------------------- | -------------------- |
| `pr_number` | Yes      | PR number                         | `325`                |
| `reason`    | Yes      | Why deferred (see examples below) | `Pre-existing issue` |

**Good deferral reasons:**

- "Out of scope — requires architectural change"
- "Pre-existing — predates this PR's scope"
- "Blocked — depends on upstream library update"
- "Time-boxed — fix exceeds sprint budget"

---

## Execution Steps

### Step 1: Gather Information

Collect fields from the user or current context. If a `pr_number` is provided,
this is a **deferred** item. Otherwise, it is a **manual** item.

If all required fields are provided in one message (e.g., during `/pr-review`),
skip to Step 4 (preview).

Validate category against: security, performance, code-quality, documentation,
refactoring, process, engineering-productivity, enhancements, ai-optimization.
If the user provides something else, suggest the closest match.

### Step 2: Validate Inputs

**For ALL items:**

Verify the file exists using the Read tool. Check that the line number doesn't
exceed the file length. If file doesn't exist or line is invalid, warn the user.

**For deferred items (with PR number):**

```
S0 items cannot be deferred!

If this is truly critical, it must be fixed before PR merges.
Options:
   [1] Downgrade to S1 and defer
   [2] Block PR until fixed
   [3] Cancel deferral
```

### Step 3: Check for Duplicates

Both intake scripts check for duplicates automatically using content-hash dedup
(SHA256 of normalized file + line + title + description). If the script detects
a duplicate, it exits cleanly with a message.

As a courtesy pre-check, you MAY search MASTER_DEBT.jsonl for similar items:

```
Potential Duplicate Detected

Existing item:
   ID:    DEBT-0234
   File:  components/auth/login.tsx:142
   Title: Missing error handling in login

Your item:
   File:  components/auth/login.tsx:145
   Title: Missing error boundary

Options:
   [A] Add anyway (different issue)
   [M] Merge with existing (update DEBT-0234)
   [C] Cancel
```

### Step 4: Preview Item

Show user what will be added. Consider running with `--dry-run` first:

```bash
node scripts/debt/intake-manual.js --dry-run \
  --file "components/auth/login.tsx" --line 145 \
  --title "Missing error boundary" --severity S2 --category code-quality
```

If the user declines the preview, ask what to change and loop back to Step 1.

### Step 5: Run Intake Script

Wrap all arguments (title, description, reason) in double quotes. Escape
internal quotes with backslash.

**For deferred items (with PR number):**

```bash
node scripts/debt/intake-pr-deferred.js \
  --pr 325 \
  --file "components/auth/login.tsx" \
  --line 145 \
  --title "Missing input validation" \
  --severity S2 \
  --category security \
  --reason "Pre-existing issue, out of scope for this PR"
```

**For manual items (no PR number):**

```bash
node scripts/debt/intake-manual.js \
  --file "components/auth/login.tsx" \
  --line 145 \
  --title "Missing error boundary" \
  --severity S2 \
  --category code-quality \
  --effort E1 \
  --description "Component lacks error boundary, crashes propagate to parent"
```

**After running:** Parse the script's stdout to extract the assigned DEBT-XXXX
ID. Use this actual ID in the confirmation — do not fabricate IDs.

**If the script fails:** Read the error output. Common failures: duplicate hash
(already exists), invalid severity/category, file not found. Do NOT retry
without addressing the error.

**Batch mode (multiple items):** Run the intake script for each item but skip
view regeneration until all items are added. Run `generate-views.js` once at the
end.

> **Note:** Both intake scripts use `appendMasterDebtSync` which writes to
> MASTER_DEBT.jsonl and raw/deduped.jsonl atomically. If writing a new intake
> script, use this function to maintain consistency.

### Step 6: Verify & Regenerate Views

Verify the item was written:

```bash
grep 'DEBT-XXXX' docs/technical-debt/MASTER_DEBT.jsonl | tail -1
```

Regenerate views:

```bash
node scripts/debt/generate-views.js
```

If view regeneration fails, the item is still in MASTER_DEBT.jsonl. Run
`generate-views.js` manually later to fix.

### Step 7: Confirm Success

**Deferred item:** Include reminder to update PR description.

```
Deferred Debt Item Added

   ID:       DEBT-0892
   PR:       #325
   File:     components/auth/login.tsx:145
   Severity: S2
   Status:   NEW (from PR review)

   Add to PR description: "Defers: DEBT-0892"
```

**Manual item:**

```
Technical Debt Item Added

   ID:       DEBT-0891
   File:     components/auth/login.tsx:145
   Severity: S2
   Status:   NEW (pending verification)
```

**Batch summary (>1 item):**

| ID        | File          | Severity | Title                  |
| --------- | ------------- | -------- | ---------------------- |
| DEBT-0892 | login.tsx:145 | S2       | Missing error boundary |
| DEBT-0893 | auth.ts:88    | S1       | No rate limiting       |

---

## Severity Guidelines

| Severity | Criteria                                         |
| -------- | ------------------------------------------------ |
| **S0**   | Security vulnerability, data loss risk, crash    |
| **S1**   | Major functionality broken, significant perf hit |
| **S2**   | Code smell, minor bug, moderate tech debt        |
| **S3**   | Style issue, documentation, nice-to-have cleanup |

## Category Options

- `security` — Auth, input validation, OWASP
- `performance` — Load times, queries, caching
- `code-quality` — Types, patterns, hygiene
- `documentation` — README, API docs, comments
- `refactoring` — Tech debt, complexity, DRY
- `process` — CI/CD, testing, workflows
- `engineering-productivity` — Developer tooling, automation
- `enhancements` — Feature improvements, UX
- `ai-optimization` — AI/ML pipeline, prompt engineering

---

## Compaction Resilience

This skill typically completes in 1-2 messages. If context is lost
mid-execution, re-gather the fields from the user and restart from Step 1.

---

## Integration

- **Upstream:** `pr-review` (deferred items), manual invocation
- **Downstream:** `debt-runner` (verify/plan modes consume MASTER_DEBT.jsonl),
  `generate-views.js` (regenerates markdown views)
- **Neighbors:** `sonarcloud` (bulk import via `intake-audit.js`), `debt-runner`
  (orchestrates remediation)

---

## Maintenance

When updating this skill, verify script interfaces still match:

```bash
node scripts/debt/intake-manual.js --help
node scripts/debt/intake-pr-deferred.js --help
```

## Version History

| Version | Date       | Description                                                            |
| ------- | ---------- | ---------------------------------------------------------------------- |
| 2.0     | 2026-03-20 | Skill audit (32 decisions): guard rails, quick path, integration, UX   |
| 1.1     | 2026-03-18 | Add optional `source_pr` field to all intake paths for PR traceability |
| 1.0     | 2026-02-13 | Initial implementation                                                 |
