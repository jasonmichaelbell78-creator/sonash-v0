# Audit Findings Procedure

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-01-30
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Session:** #116

---

## Purpose

This document defines the **canonical procedure** for managing audit findings in
SoNash. It ensures all findings are:

1. Captured in a single source of truth
2. Properly deduplicated
3. Cross-referenced with ROADMAP.md
4. Tracked through resolution

## Canonical Location

**All audit findings ultimately live in:**

```
docs/audits/canonical/
├── MASTER_FINDINGS.jsonl        # Active findings
├── MASTER_FINDINGS_INDEX.md     # Human-readable index
└── RESOLVED_FINDINGS.jsonl      # Archived resolved findings
```

This is the **SINGLE SOURCE OF TRUTH**. All other audit locations feed into
this.

---

## Audit Types and Their Outputs

### 1. Single-Session Audits (`/audit-*` commands)

**Output Location:** `docs/audits/single-session/{category}/`

**Files Produced:**

- `audit-YYYY-MM-DD.md` - Human-readable report
- `audit-YYYY-MM-DD.jsonl` - Machine-readable findings

**When to Run:** On-demand, between multi-AI audits

### 2. Multi-AI Canon Audits

**Output Location:** `docs/reviews/YYYY-QX/canonical/`

**Files Produced:**

- `CANON-{CATEGORY}.jsonl` - Consensus findings from multiple AI models

**When to Run:** Quarterly or when thresholds are triggered

### 3. Comprehensive Audits

**Output Location:** `docs/audits/comprehensive/`

**Files Produced:**

- `COMPREHENSIVE_AUDIT_REPORT.md` - Full report
- `audit-{category}-report.md` - Category-specific reports

**When to Run:** Major releases, significant codebase changes

---

## End-to-End Audit Procedure

### Step 1: Run Audit(s)

```bash
# Single-session audit (choose category)
/audit-code
/audit-security
/audit-performance
/audit-refactoring
/audit-documentation
/audit-process

# Or comprehensive audit
/audit-comprehensive
```

### Step 2: Validate Findings

```bash
# Validate individual audit
node scripts/validate-audit.js docs/audits/single-session/{category}/audit-YYYY-MM-DD.jsonl

# Required fields check (automated during aggregation)
# - id, category, severity, file, line, title, description
```

### Step 3: Run Aggregation

```bash
# Aggregate all audit sources
node scripts/aggregate-audit-findings.js
```

This script:

1. Reads all audit sources (single-session, canon, comprehensive)
2. Normalizes to common schema
3. Deduplicates (exact ID, file match, file:line proximity, semantic similarity)
4. Cross-references with ROADMAP.md tracked items
5. Outputs to `docs/aggregation/`:
   - `normalized-findings.jsonl` - All findings normalized
   - `unique-findings.jsonl` - After deduplication
   - `net-new-findings.jsonl` - Not already in ROADMAP

### Step 4: Review NET NEW Findings

```bash
# Generate placement suggestions
node scripts/generate-placement-report.js
```

Review `docs/aggregation/NET_NEW_ROADMAP_PLACEMENT.md` for suggested placements.

### Step 5: Update Canonical Location

Copy final unique findings to canonical location:

```bash
# Copy unique findings to canonical
cp docs/aggregation/unique-findings.jsonl docs/audits/canonical/MASTER_FINDINGS.jsonl

# Or merge with existing (if partial update)
# Use scripts/merge-findings.js (if implemented)
```

### Step 6: Update ROADMAP.md

For each NET NEW finding:

1. **S0 Critical:** Add to "Immediate Hotfixes" section
2. **S1 High:** Add to appropriate Active Sprint track
3. **S2/S3:** Add to appropriate milestone/track based on category

**Required format for ROADMAP entries:**

```markdown
- [ ] **{ID}:** {Title} `{file}:{line}` [Effort: {E0-E3}]
```

Example:

```markdown
- [ ] **CODE-001:** Fix failing check-docs tests
      `tests/scripts/check-docs-light.test.ts:199` [Effort: E1]
```

### Step 7: Update Index

Regenerate the human-readable index:

```bash
# Generate index from MASTER_FINDINGS.jsonl
node scripts/generate-findings-index.js
```

---

## Finding Lifecycle

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   NEW        │ ──> │   ACTIVE     │ ──> │  IN_PROGRESS │
│ (discovered) │     │ (in backlog) │     │  (being fixed)│
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  v
                                          ┌──────────────┐
                                          │   RESOLVED   │
                                          │  (archived)  │
                                          └──────────────┘
```

### Status Transitions

| From        | To          | Trigger                         |
| ----------- | ----------- | ------------------------------- |
| NEW         | ACTIVE      | Added to ROADMAP.md             |
| ACTIVE      | IN_PROGRESS | Work begins (PR opened)         |
| IN_PROGRESS | RESOLVED    | PR merged, verified             |
| ACTIVE      | RESOLVED    | Determined to be false positive |

---

## Resolution Process

When a finding is resolved:

1. **Verify the fix:**

   ```bash
   # Run relevant tests
   npm test

   # Run validation
   node scripts/validate-audit.js --check-resolved {finding-id}
   ```

2. **Update MASTER_FINDINGS.jsonl:**
   - Set `status: "resolved"`
   - Add `resolved_date`, `resolved_by`, `resolved_pr`

3. **Move to archive:**

   ```bash
   # Extract resolved findings
   node scripts/archive-resolved-findings.js
   ```

4. **Update ROADMAP.md:**
   - Mark item as complete: `[x]` or archive to ROADMAP_LOG.md

---

## Deduplication Rules

The aggregator uses these rules to identify duplicates:

### 1. Exact ID Match

- Same `original_id` across sources

### 2. File + Line Exact Match

- Same `file` and `line` number

### 3. File + Line Proximity Match

- Same `file`, lines within 15 of each other
- Similar title (>60% word overlap)

### 4. Semantic Similarity

- Synonym expansion (correlation↔tracing, offline↔persistence, etc.)
- Title/description similarity scoring

### 5. ROADMAP Cross-Reference

- Match against existing ROADMAP.md tracked items
- File:line references in ROADMAP entries

---

## Required Fields by Severity

| Field          | S0                     | S1       | S2       | S3       |
| -------------- | ---------------------- | -------- | -------- | -------- |
| id             | Required               | Required | Required | Required |
| category       | Required               | Required | Required | Required |
| severity       | Required               | Required | Required | Required |
| file           | Required               | Required | Required | Required |
| line           | Required               | Required | Required | Required |
| title          | Required               | Required | Required | Required |
| description    | Required               | Required | Required | Optional |
| recommendation | Required               | Required | Required | Optional |
| evidence       | Required               | Required | Optional | Optional |
| confidence     | Required (HIGH/MEDIUM) | Required | Optional | Optional |
| verified       | Required (DUAL_PASS)   | Required | Optional | Optional |

---

## Automation Hooks

### Pre-Commit

- Validates JSONL schema for any audit file changes
- Checks for duplicate IDs

### Session-End

- Reminds to run aggregation if audits were performed
- Checks for unprocessed findings

### Scheduled (Weekly)

- Auto-generate findings summary
- Alert on stale S0/S1 findings (>7 days unresolved)

---

## Related Documents

- [docs/audits/canonical/README.md](audits/canonical/README.md) - Canonical
  location documentation
- [docs/audits/single-session/README.md](audits/single-session/README.md) -
  Single-session audit guide
- [ROADMAP.md](../ROADMAP.md) - Product roadmap with tracked items
- [docs/TRIGGERS.md](TRIGGERS.md) - Enforcement triggers

---

## Version History

| Version | Date       | Changes                                        |
| ------- | ---------- | ---------------------------------------------- |
| 1.0     | 2026-01-30 | Initial procedure documentation (Session #116) |
