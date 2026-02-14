---
name: verify-technical-debt
description:
  Verify and triage technical debt items - classify, then place into ROADMAP
  sprints
---

# Verify & Triage Technical Debt

**Purpose:** Two-phase skill that (1) verifies items in the NEW status queue,
then (2) triages VERIFIED items into the appropriate ROADMAP.md sprint/milestone
for user approval.

**When to Use:**

- Session-start alert shows >25 NEW items
- More than 3 days since last verification
- After bulk import from SonarCloud or audits
- Manual verification of specific items

---

## Overview

**Phase 1 (Verify):** Walk through NEW items, check if each issue still exists
in the codebase, classify as VERIFIED/FALSE_POSITIVE/DUPLICATE/RESOLVED.

**Phase 2 (Triage):** Group all VERIFIED items by category and severity, map
them to existing ROADMAP.md sprints/milestones, and present placement proposals
for user approval before writing.

**Input:** `docs/technical-debt/views/verification-queue.md` **Output:** Updated
`docs/technical-debt/MASTER_DEBT.jsonl` + Updated `ROADMAP.md`

---

## Verification Triggers

The session-start hook checks for:

```
IF verification-queue.md has >25 NEW items:
  Alert: "Verification backlog at {count} items"

IF >3 days since last verification:
  Alert: "Verification overdue ({days} days)"
```

---

## Phase 1: Verification

### Step 1: Load Verification Queue

```bash
# Check queue size
node scripts/debt/generate-views.js --queue-only
cat docs/technical-debt/views/verification-queue.md | head -50
```

### Step 2: Select Batch

Ask user which batch to verify:

```
Select verification batch:
   [1] S0 Critical only (N items) - RECOMMENDED
   [2] S0 + S1 High (N items)
   [3] All items (N items)
   [4] Specific IDs (enter DEBT-XXXX,DEBT-YYYY)
```

### Step 3: Verify Each Item

For each item in the batch:

#### 3a. Read the JSONL entry and referenced code

```bash
grep "DEBT-XXXX" docs/technical-debt/MASTER_DEBT.jsonl
# Then read the referenced file/line to check if issue exists
```

#### 3b. Classify using parallel Explore agents for efficiency

Spawn parallel agents to batch-verify items. Each agent:

1. Reads the JSONL entries for its batch
2. Checks referenced files in the codebase
3. Returns a classification table: ID | Classification | Brief Reason

Classifications:

- **VERIFIED** - Issue exists and should be fixed
- **FALSE_POSITIVE** - Not actually an issue (provide reason)
- **DUPLICATE** - Same as existing item (provide DEBT-XXXX)
- **RESOLVED** - Issue was already fixed

#### 3c. Apply classifications to MASTER_DEBT.jsonl

Update each item's `status` field and add `verified_by` timestamp. Use a Python
script to batch-update the JSONL file for efficiency.

### Step 4: Verification Summary

```
Phase 1 Complete: Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  VERIFIED: N items
  FALSE_POSITIVE: N items
  DUPLICATE: N items
  RESOLVED: N items

Proceeding to Phase 2: Triage...
```

### Step 5: Regenerate Views

```bash
node scripts/debt/generate-views.js
```

---

## Phase 2: Triage (Roadmap Placement)

After verification, all VERIFIED items need to be placed into ROADMAP.md. This
phase maps items to the appropriate sprint/milestone.

### Step 6: Read Current ROADMAP Structure

```bash
# Understand current milestones and sprints
cat ROADMAP.md
```

Identify:

- Active milestones and their sprint structure
- GRAND PLAN sprint numbering and categories
- Which sprints are active vs planned vs complete

### Step 7: Group VERIFIED Items by Category

Map each verified item to a ROADMAP category:

| Debt Category  | ROADMAP Location                   |
| -------------- | ---------------------------------- |
| security       | GRAND PLAN > Security Sprint       |
| code-quality   | GRAND PLAN > Code Quality Sprint   |
| testing        | GRAND PLAN > Testing Sprint        |
| performance    | GRAND PLAN > Performance Sprint    |
| accessibility  | M1.5 Quick Wins or M2 Architecture |
| ux-copy        | M1.5 Quick Wins                    |
| documentation  | GRAND PLAN > Documentation Sprint  |
| infrastructure | GRAND PLAN > Infrastructure Sprint |
| ci-cd          | GRAND PLAN > CI/CD Sprint          |
| refactoring    | M2 Architecture or GRAND PLAN      |

For items that don't fit existing sprints, propose a new sprint or backlog
placement.

### Step 8: Generate Triage Proposal

Present a grouped proposal to the user:

```
Phase 2: Triage Proposal
━━━━━━━━━━━━━━━━━━━━━━━━

GRAND PLAN Sprint 5 (CI/CD & Hooks):
  - DEBT-2748: Duplicate hook validation (S2)
  - DEBT-2754: Pre-push duplicates pre-commit checks (S2)
  - DEBT-2785: Pre-commit hook parallelization (S2)
  - DEBT-2786: CI non-blocking checks should block (S2)

GRAND PLAN Sprint 6 (Testing):
  - DEBT-2764: Missing Cloud Functions integration tests (S2)
  - DEBT-2765: No visual regression testing (S2)
  - DEBT-2766: Coverage thresholds not enforced (S2)

M1.5 Quick Wins (UX Copy):
  - DEBT-2788: Generic button labels (S2)
  - DEBT-2789: Error messages not helpful (S2)
  - DEBT-2790: Inconsistent terminology (S2)

[Approve all] [Modify placements] [Skip triage]
```

### Step 9: User Approval

Present the full triage proposal using AskUserQuestion:

- **Approve all** - Write all placements to ROADMAP.md
- **Modify** - User adjusts specific placements, then approve
- **Skip** - Items stay as VERIFIED in MASTER_DEBT.jsonl without roadmap
  placement (can be triaged later)

### Step 10: Write to ROADMAP.md

After approval, add the debt items to their designated sprints in ROADMAP.md:

- Add `- [ ] DEBT-XXXX: Title (severity, file)` entries under the appropriate
  sprint section
- Update sprint item counts
- Update the GRAND PLAN progress numbers
- Set `roadmap_ref` field in MASTER_DEBT.jsonl for each placed item

### Step 11: Final Report

```
Verification & Triage Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1 - Verification:
  VERIFIED: N | FALSE_POSITIVE: N | DUPLICATE: N | RESOLVED: N

Phase 2 - Triage:
  Placed in ROADMAP: N items across M sprints
  Deferred: N items (no roadmap placement)

Updated files:
  - docs/technical-debt/MASTER_DEBT.jsonl
  - docs/technical-debt/views/*.md (regenerated)
  - ROADMAP.md
```

---

## Verification Guidelines

### VERIFIED

Mark as VERIFIED when:

- The issue clearly exists in the code
- It matches the description
- It's a real problem that should be fixed

### FALSE_POSITIVE

Mark as FALSE_POSITIVE when:

- The code pattern is intentional
- The tool misunderstood the context
- The issue doesn't apply (e.g., test file)

**Always provide a reason!**

### DUPLICATE

Mark as DUPLICATE when:

- Same file:line as existing item
- Same underlying issue, different wording
- Subset of a larger tracked issue

**Merge into the existing item with lower ID.**

### RESOLVED

Mark as RESOLVED when:

- The code was already fixed
- The file no longer exists
- The issue is no longer applicable

**Include resolution details if known.**

---

## Triage Guidelines

### Sprint Placement Rules

1. **Match by category first** - Use the category-to-ROADMAP mapping table
2. **Check for existing sprints** - Prefer adding to existing sprints over
   creating new ones
3. **Respect sprint size** - Sprints should have 10-25 items; split if larger
4. **Group related items** - Items touching the same files should be in the same
   sprint
5. **S0/S1 items get priority** - Place in the next available sprint, not
   backlog

### When to Create New Sprints

- 5+ verified items in a category with no existing sprint
- Items that don't fit any existing milestone category
- Security items that need urgent dedicated attention

---

## Batch Processing Tips

1. **Start with S0/S1** - Highest priority items first
2. **Group by file** - Verify all items in one file together
3. **Use parallel agents** - Spawn Explore agents to batch-verify for speed
4. **Checkpoint results** - Write partial results to a temp file after each
   batch so nothing is lost if the session drops
5. **Don't over-verify** - If clearly valid, mark VERIFIED quickly
6. **Document false positives** - Future audits may flag the same thing

---

## Related

- `sonarcloud` - Import from SonarCloud
- `add-debt` - Add items manually or from PR reviews
- `task-next` - Show next prioritized tasks from ROADMAP.md
