---
name: multi-ai-audit
description:
  Interactive orchestrator for multi-AI consensus audits with any-format input
  support
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-04
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Multi-AI Audit Orchestrator

**Purpose:** Single-entry-point skill that orchestrates the entire multi-AI
audit workflow with:

- Category-by-category progression (user-controlled)
- Template output for external AI systems
- Schema fixing/normalization for messy AI outputs
- Per-category aggregation with verification
- Final cross-category unification
- Context compaction survival via file-based state

**Invocation:** `/multi-ai-audit`

---

## Workflow State Machine

```
START → Check Session → [No Session] → Create New Session → Select Category
                      → [Has Session] → Offer Resume

Select Category → Output Template → Await Findings

Await Findings → [User: "add <source>"] → Prompt for Paste → Process Findings → Await Findings
              → [User: "done"] → Aggregate Category → Select Next Category
              → [User: "skip"] → Select Next Category
              → [User: "finish"] → Unify All Categories → COMPLETE
              → [User: "status"] → Show Status → Await Findings
```

---

## Phase 1: Session Initialization

**On skill invocation, execute these steps:**

### Step 1.1: Check for Existing Session

Read the state file:

```javascript
// Read: .claude/multi-ai-audit/session-state.json
```

**If session exists and status !== "complete":**

Present to user:

```
Found incomplete session: [session_id]
  Created: [date]
  Current category: [category or "none"]
  Completed: [list of completed categories]
  Pending: [list of pending categories]

Options:
1. Resume this session
2. Start fresh (new session)
```

Wait for user choice before proceeding.

**If no session or user chooses fresh:**

### Step 1.2: Create New Session

```bash
node scripts/multi-ai/state-manager.js create
```

This creates:

- Session ID: `maa-YYYY-MM-DD-<random6>`
- Directory: `docs/audits/multi-ai/<session-id>/`
  - `raw/` - For user-pasted findings
  - `canon/` - For aggregated findings
  - `final/` - For unified output
- State file: `.claude/multi-ai-audit/session-state.json`

### Step 1.3: Present Category Menu

```
=== Multi-AI Audit: [session_id] ===

Select a category to audit:

  1. code          - Code quality, hygiene, types, testing
  2. security      - Rate limiting, auth, Firebase, OWASP
  3. performance   - Bundle, rendering, memory, vitals
  4. refactoring   - Duplication, architecture, boundaries
  5. documentation - Links, staleness, coverage, tiers
  6. process       - CI/CD, hooks, scripts, triggers
  7. engineering-productivity - Golden path, debugging, DX

Enter category name or number (or "status" to see progress):
```

---

## Phase 2: Template Output

**When user selects a category:**

### Step 2.1: Read Template

Read the appropriate template file:

```
docs/multi-ai-audit/templates/<CATEGORY_TEMPLATE>.md
```

Template mapping: | Category | Template File | |----------|---------------| |
code | CODE_REVIEW_PLAN.md | | security | SECURITY_AUDIT_PLAN.md | | performance
| PERFORMANCE_AUDIT_PLAN.md | | refactoring | REFACTOR_PLAN.md or
REFACTOR_AUDIT_PROMPT.md | | documentation | DOCUMENTATION_AUDIT.md | | process
| PROCESS_AUDIT.md | | engineering-productivity |
ENGINEERING_PRODUCTIVITY_AUDIT.md |

### Step 2.2: Extract Main Prompt

Extract the section between "## Review Prompt" or "## Audit Prompt" and the next
major section. This is the part users paste into external AIs.

### Step 2.3: Output to User

```
=== TEMPLATE FOR: [Category] ===

Copy the prompt below and paste into each AI system (Claude, GPT, Gemini, etc.)
Each AI should analyze your codebase and output findings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[PROMPT CONTENT - The extracted main prompt section]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

=== END TEMPLATE ===

When you have findings from an AI, use these commands:
  • "add claude" - Add findings from Claude
  • "add gpt" - Add findings from GPT/ChatGPT
  • "add gemini" - Add findings from Gemini
  • "add <name>" - Add findings from any AI (use any name)
  • "done" - Aggregate this category and move on
  • "skip" - Skip this category
  • "status" - Show session status
```

### Step 2.4: Update State

```javascript
updateSession(sessionId, {
  current_category: category,
  workflow_phase: "collecting",
});
```

---

## Phase 3: Collect Findings

**When user says "add <source>":**

### Step 3.1: Prompt for Paste

```
Paste the findings from [source].
(Any format: JSONL, JSON array, markdown table, numbered list, or plain text)

[Waiting for paste...]
```

### Step 3.2: User Pastes Content

The user will paste raw output from the external AI. This could be:

- Valid JSONL (ideal)
- JSON array wrapped in `[]`
- Markdown table with findings
- Numbered list
- Headed sections with `###`
- Plain prose describing findings
- JSON wrapped in \`\`\`json fences

### Step 3.3: Process the Pasted Content

**Run format normalizer:**

```javascript
import { normalizeFormat } from "scripts/multi-ai/normalize-format.js";
const { findings: normalized, report: normalizeReport } = normalizeFormat(
  pastedContent,
  category
);
```

**Run schema fixer:**

```javascript
import { fixSchema } from "scripts/multi-ai/fix-schema.js";
const { fixed, report: schemaReport } = fixSchema(normalized, category);
```

### Step 3.4: Save Results

**Save normalized findings:**

```
docs/audits/multi-ai/<session>/raw/<category>-<source>.jsonl
```

**Save original for debugging:**

```
docs/audits/multi-ai/<session>/raw/<category>-<source>.original.txt
```

### Step 3.5: Report to User

```
✓ Processed findings from [source]

  Format detected: [markdown_table|jsonl|json_array|etc.]
  Findings extracted: [count]
  Schema adjustments: [count]
  Low confidence (<50): [count]

  Stored: raw/[category]-[source].jsonl

Add another source or say "done" to aggregate this category.
```

### Step 3.6: Update State

```javascript
addSourceToCategory(sessionId, category, source, findingCount);
```

---

## Phase 4: Category Aggregation

**When user says "done":**

### Step 4.1: Check Sources

```javascript
const { sources, total_findings } = getCategorySources(sessionPath, category);
```

**If only 1 source:**

```
⚠️ Warning: Only 1 source for [category].
   Multi-AI consensus works best with 2+ sources.

Continue with aggregation anyway? (yes/no)
```

### Step 4.2: Run Aggregation

```bash
node scripts/multi-ai/aggregate-category.js <session-path> <category>
```

This:

- Loads all `raw/<category>-*.jsonl` files
- Deduplicates by fingerprint → file+line → title similarity
- Calculates consensus scores
- Verifies file existence
- Assigns CANON-XXXX IDs
- Outputs to `canon/CANON-<CATEGORY>.jsonl`

### Step 4.3: Report Results

```
=== [Category] Aggregation Complete ===

Sources: [count] ([list of source names])
Raw findings: [count]
After dedup: [count]
Verified: [count], Unverified: [count]

Severity breakdown:
  S0 Critical: [count]
  S1 High: [count]
  S2 Medium: [count]
  S3 Low: [count]

Output: docs/audits/multi-ai/<session>/canon/CANON-[CATEGORY].jsonl

Select next category (1-7) or say "finish" to unify all.
```

### Step 4.4: Update State

```javascript
updateCategoryState(sessionId, category, {
  status: "aggregated",
  finding_count: aggregatedCount,
});
```

### Step 4.5: Return to Category Selection

Present the category menu again, showing which are complete.

---

## Phase 5: Cross-Category Unification

**When user says "finish":**

### Step 5.1: Check Completion

```javascript
const session = loadSession();
const completed = Object.entries(session.categories).filter(
  ([_, state]) => state.status === "aggregated"
);
const pending = Object.entries(session.categories).filter(
  ([_, state]) => state.status === "pending"
);
```

**If any pending categories:**

```
⚠️ Warning: [count] categories not yet audited:
   [list of pending categories]

These will not be included in the unified output.
Continue anyway? (yes/no)
```

### Step 5.2: Run Unification

```bash
node scripts/multi-ai/unify-findings.js <session-path>
```

This:

- Loads all `canon/CANON-*.jsonl` files
- Detects cross-cutting issues (same file in multiple categories)
- Merges related findings
- Identifies dependency chains
- Calculates priority scores
- Outputs to:
  - `final/UNIFIED-FINDINGS.jsonl`
  - `final/SUMMARY.md`

### Step 5.3: Final Report

```
=== MULTI-AI AUDIT COMPLETE ===

Session: [session_id]
Categories completed: [count]/7

Aggregation Summary:
  Total AI sources: [count]
  Total raw findings: [count]
  After category dedup: [count]
  After cross-category unification: [count]

Cross-Cutting Issues: [count] files appear in 2+ categories

Severity Breakdown:
  S0 Critical: [count]
  S1 High: [count]
  S2 Medium: [count]
  S3 Low: [count]

Output Files:
  • Unified findings: docs/audits/multi-ai/<session>/final/UNIFIED-FINDINGS.jsonl
  • Summary report: docs/audits/multi-ai/<session>/final/SUMMARY.md

Next Steps:
  1. Review SUMMARY.md for priority findings
  2. Ingest to TDMS: node scripts/debt/intake-audit.js <path-to-unified>
  3. Archive session when done
```

### Step 5.4: Complete Session

```javascript
completeSession(sessionId, finalOutputPath);
```

---

## Status Command

**When user says "status" at any point:**

```
=== Session Status: [session_id] ===

Created: [date]
Phase: [collecting|aggregating|unifying]
Current category: [category or none]

Category Progress:
  ✓ code          - 34 findings from 3 sources
  ✓ security      - 28 findings from 2 sources
  ○ performance   - collecting (1 source so far)
  - refactoring   - pending
  - documentation - pending
  - process       - pending
  - engineering-productivity - pending

Legend: ✓ complete, ○ in progress, - pending

Commands:
  • Select category: Enter name or number (1-7)
  • Add findings: "add <source>"
  • Aggregate: "done"
  • Skip: "skip"
  • Finish: "finish"
```

---

## Error Recovery

### Context Compaction Recovery

If the skill is invoked after context compaction:

1. The state file persists at `.claude/multi-ai-audit/session-state.json`
2. Backup state at `docs/audits/multi-ai/<session>/state.json`
3. All raw findings are saved to disk
4. Skill automatically offers to resume

### Parse Error Recovery

If normalize-format.js encounters issues:

- Partial results are saved
- Low confidence is assigned to uncertain extractions
- Original input is saved for manual review

### Validation Failures

Schema fixer never rejects findings - it always produces output:

- Missing fields get defaults
- Invalid values get normalized
- Confidence is reduced for uncertain data

---

## Input Format Support

The skill accepts **any format** from external AIs:

| Format          | Detection             | Example                           |
| --------------- | --------------------- | --------------------------------- |
| JSONL           | Lines start with `{`  | `{"title":"...","severity":"S1"}` |
| JSON Array      | Starts with `[`       | `[{"title":"..."},...]`           |
| Fenced JSON     | Has \`\`\`json        | Code block with JSON              |
| Markdown Table  | Has `\|` and `---`    | `\| Title \| Severity \|`         |
| Numbered List   | Lines start with `1.` | `1. **Finding:** ...`             |
| Headed Sections | Has `###` headers     | `### SEC-001: Title`              |
| Plain Text      | Fallback              | Free-form description             |

Users can paste whatever the AI outputs - the skill handles conversion.

---

## Files Created by This Skill

| File                                                          | Purpose                        |
| ------------------------------------------------------------- | ------------------------------ |
| `.claude/multi-ai-audit/session-state.json`                   | Primary state file             |
| `docs/audits/multi-ai/<session>/state.json`                   | Backup state                   |
| `docs/audits/multi-ai/<session>/raw/*.jsonl`                  | Normalized findings per source |
| `docs/audits/multi-ai/<session>/raw/*.original.txt`           | Original pasted content        |
| `docs/audits/multi-ai/<session>/canon/CANON-*.jsonl`          | Aggregated per category        |
| `docs/audits/multi-ai/<session>/final/UNIFIED-FINDINGS.jsonl` | Final unified output           |
| `docs/audits/multi-ai/<session>/final/SUMMARY.md`             | Summary report                 |

---

## Related Documentation

- [JSONL_SCHEMA_STANDARD.md](docs/templates/JSONL_SCHEMA_STANDARD.md) - Field
  definitions
- [docs/multi-ai-audit/templates/](docs/multi-ai-audit/templates/) - Audit
  templates
- [scripts/multi-ai/](scripts/multi-ai/) - Processing scripts
- [docs/technical-debt/PROCEDURE.md](docs/technical-debt/PROCEDURE.md) - TDMS
  intake

---

## Version History

| Version | Date       | Changes                |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-04 | Initial skill creation |
