---
name: add-debt
description: >-
  Add technical debt items to MASTER_DEBT.jsonl. Supports two workflows:
  PR-context deferred debt (with PR number) and manual ad-hoc debt discovery.
  Automatically detects which workflow to use based on whether a PR number is
  provided.
---

# Add Technical Debt

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-13
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Purpose:** Track technical debt items in the canonical TDMS tracker, whether
discovered during PR review (deferred) or during ad-hoc development.

**When to Use:**

- During PR review when issues are deferred for later (provide PR number)
- When you discover tech debt during development outside formal audits
- When an item should be tracked but won't be fixed immediately

**Output Location:** `docs/technical-debt/MASTER_DEBT.jsonl`

---

## Workflow Detection

This skill automatically selects the appropriate workflow:

| Context               | Workflow     | Source ID Format    |
| --------------------- | ------------ | ------------------- |
| PR number provided    | **Deferred** | `PR-{number}-{seq}` |
| No PR number (ad-hoc) | **Manual**   | `manual`            |

---

## Common Fields

| Field         | Required | Description                                     | Example                     |
| ------------- | -------- | ----------------------------------------------- | --------------------------- |
| `file`        | Yes      | File path (relative to repo root)               | `components/auth/login.tsx` |
| `line`        | Yes      | Line number                                     | `145`                       |
| `title`       | Yes      | Short description (< 80 chars)                  | `Missing error boundary`    |
| `severity`    | Yes      | S0 (Critical), S1 (High), S2 (Medium), S3 (Low) | `S2`                        |
| `category`    | Yes      | security, performance, code-quality, docs, etc. | `code-quality`              |
| `effort`      | No       | E0 (<30m), E1 (<2h), E2 (<8h), E3 (>8h)         | `E1`                        |
| `description` | No       | Detailed description                            | `Component lacks error...`  |

### Deferred-Only Fields (when PR number is provided)

| Field       | Required | Description                       | Example              |
| ----------- | -------- | --------------------------------- | -------------------- |
| `pr_number` | Yes      | PR number                         | `325`                |
| `reason`    | Yes      | Why deferred (out of scope, etc.) | `Pre-existing issue` |

---

## Execution Steps

### Step 1: Gather Information

Collect fields from the user or current context. If a `pr_number` is provided,
this is a **deferred** item. Otherwise, it is a **manual** item.

### Step 2: Validate Inputs

**For ALL items:**

```bash
# Verify the file exists
ls -la {file}

# Check if line number is valid
wc -l {file}
```

If file doesn't exist or line exceeds file length, warn the user.

**For deferred items (with PR number):**

```
S0 items cannot be deferred!

If this is truly critical, it must be fixed before PR merges.
Options:
   [1] Downgrade to S1 and defer
   [2] Block PR until fixed
   [3] Cancel deferral
```

### Step 3: Check for Duplicates (Manual workflow only)

If a similar item already exists:

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

Show user what will be added:

```
Technical Debt Item Preview

ID:          DEBT-XXXX (auto-assigned)
Source:      {PR-325-001 | manual}
File:        components/auth/login.tsx:145
Severity:    S2 (Medium)
Category:    code-quality
Effort:      E1 (<2h)
Title:       Missing error boundary
{PR:         #325}              (deferred only)
{Reason:     Pre-existing issue} (deferred only)

Confirm? [Y/n]
```

### Step 5: Run Intake Script

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

**Script behavior (both):**

1. Validates all inputs (deferred rejects S0)
2. Checks for duplicates (same file:line)
3. Assigns next available DEBT-XXXX ID
4. Appends to MASTER_DEBT.jsonl
5. Logs to intake-log.jsonl
6. Deferred items generate `source_id` as `PR-{number}-{sequence}`

> **CRITICAL:** Both intake scripts append to
> `docs/technical-debt/raw/deduped.jsonl` in addition to MASTER_DEBT.jsonl. Any
> script that appends to MASTER_DEBT.jsonl MUST also append to
> `raw/deduped.jsonl` to prevent `generate-views.js` from overwriting new
> entries.

### Step 6: Regenerate Views

```bash
node scripts/debt/generate-views.js
```

### Step 7: Confirm Success

**Deferred item:**

```
Deferred Debt Item Added

   ID:       DEBT-0892
   PR:       #325
   File:     components/auth/login.tsx:145
   Severity: S2
   Status:   NEW (from PR review)

Updated files:
   - docs/technical-debt/MASTER_DEBT.jsonl
   - docs/technical-debt/raw/deduped.jsonl
   - docs/technical-debt/views/verification-queue.md

Reminder:
   - Add to PR description: "Defers: DEBT-0892"
   - Item will appear in next verification batch
```

**Manual item:**

```
Technical Debt Item Added

   ID:       DEBT-0891
   File:     components/auth/login.tsx:145
   Severity: S2
   Status:   NEW (pending verification)

Updated files:
   - docs/technical-debt/MASTER_DEBT.jsonl
   - docs/technical-debt/raw/deduped.jsonl
   - docs/technical-debt/views/verification-queue.md

Next steps:
   - Item is in verification queue (status: NEW)
   - Run 'verify-technical-debt' to verify this item
   - Or manually update status to VERIFIED after confirming issue exists
```

---

## Batch Deferral (PR context)

For multiple deferred items in one PR:

```bash
# Run for each item
node scripts/debt/intake-pr-deferred.js --pr 325 --file "file1.tsx" ...
node scripts/debt/intake-pr-deferred.js --pr 325 --file "file2.tsx" ...
```

---

## PR Description Update (Deferred items)

After adding deferred items, update the PR description:

```markdown
## Technical Debt

Defers: DEBT-0892, DEBT-0893

**Reason:** Pre-existing issues identified during review, out of scope for this
PR. Tracked for future cleanup.
```

---

## Severity Guidelines

| Severity | Criteria                                         |
| -------- | ------------------------------------------------ |
| **S0**   | Security vulnerability, data loss risk, crash    |
| **S1**   | Major functionality broken, significant perf hit |
| **S2**   | Code smell, minor bug, moderate tech debt        |
| **S3**   | Style issue, documentation, nice-to-have cleanup |

---

## Category Options

- `security` - Auth, input validation, OWASP
- `performance` - Load times, queries, caching
- `code-quality` - Types, patterns, hygiene
- `documentation` - README, API docs, comments
- `refactoring` - Tech debt, complexity, DRY
- `process` - CI/CD, testing, workflows

---

## Integration with pr-review Skill

The `pr-review` skill includes a mandatory section for deferred items:

```markdown
## Deferred Items (Mandatory Section)

If ANY items are deferred during review:

1. List each with: file, line, severity, description
2. Run `/add-debt` skill for each item (with PR number)
3. Verify items appear in MASTER_DEBT.jsonl

**No PR review is complete until deferred items are tracked.**
```

---

## Related

- `sonarcloud` - Import from SonarCloud (replaces deprecated
  `sync-sonarcloud-debt`)
- `verify-technical-debt` - Verify items in queue
- `pr-review` - Full PR review workflow
