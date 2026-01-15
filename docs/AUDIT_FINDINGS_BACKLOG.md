# Audit Findings Backlog

**Document Version**: 3.3 **Created**: 2025-12-30 **Last Updated**: 2026-01-13
**Status**: ACTIVE **Total Items**: 9 (8-11 hours estimated effort)

---

## Quick Start

- **Purpose**: Track CANON findings from multi-AI audits for systematic
  remediation
- **Add new findings**: Use the standard format in
  [How to Use This Backlog](#how-to-use-this-backlog)
- **Triage items**: Sort by severity (S1→S2→S3), estimate effort (E0-E3)
- **Process workflow**: See
  [INTEGRATED_IMPROVEMENT_PLAN.md](./archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md)
  Step 4B
- **Related docs**: [AI_REVIEW_PROCESS.md](./AI_REVIEW_PROCESS.md),
  [MULTI_AI_REVIEW_COORDINATOR.md](./MULTI_AI_REVIEW_COORDINATOR.md)

---

## Purpose & Scope

### What This Document Covers

This document tracks non-blocking improvements, tech debt, and polish work
discovered during the **Multi-AI Audit process** (Step 4 of the Integrated
Improvement Plan). Items here are queued for remediation in Step 4B or deferred
to ROADMAP.md M2.

**Primary Goal**: Maintain a prioritized backlog of CANON findings from multi-AI
audits.

**Scope**:

- **In Scope**: CANON-verified items from audit aggregation, non-blocking
  improvements
- **Out of Scope**: Critical bugs (address immediately), blocking issues,
  security vulnerabilities (address in remediation sprint)

**Related To**:

- [INTEGRATED_IMPROVEMENT_PLAN.md](./archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md) -
  Master improvement roadmap
- [AI_REVIEW_LEARNINGS_LOG.md](./AI_REVIEW_LEARNINGS_LOG.md) - Review learnings
- [MULTI_AI_REVIEW_COORDINATOR.md](./MULTI_AI_REVIEW_COORDINATOR.md) - Audit
  coordination

**Key Principle**: Items here are tracked for systematic remediation.
Critical/Major items flow to Step 4B; Minor/Trivial items may be deferred to M2.

---

## Backlog Categories

Categories align with the 6-category audit framework:

| Category          | Description                                    | Typical Severity |
| ----------------- | ---------------------------------------------- | ---------------- |
| **Code Quality**  | Refactoring, cleanup, consistency, type safety | S2-S3            |
| **Security**      | Auth, input validation, secrets (non-critical) | S1-S2            |
| **Performance**   | Bundle size, rendering, data fetching          | S2-S3            |
| **Refactoring**   | Architecture, duplication, god objects         | S2-S3            |
| **Documentation** | Cross-refs, staleness, coverage gaps           | S2-S3            |
| **Process**       | CI/CD, hooks, scripts, automation              | S2-S3            |

**Severity Scale**:

- **S0 - Critical**: Security breach, data loss risk → Address immediately (NOT
  for backlog)
- **S1 - Major**: Significant bugs, auth issues → Step 4B remediation
- **S2 - Medium**: Quality issues, tech debt → Step 4B or M2
- **S3 - Minor**: Polish, nice-to-have → M2 or skip

**Effort Scale**:

- **E0**: < 30 minutes
- **E1**: 30 min - 2 hours
- **E2**: 2-4 hours
- **E3**: 4+ hours (consider breaking down)

---

## How to Use This Backlog

### Adding Items (During Audit)

When CANON findings are aggregated from Step 4, add them here with this format:

```markdown
### [Category] Item Name

**CANON-ID**: CANON-NNN or LEGACY-NNN (see ID conventions below) **Severity**:
S1/S2/S3 **Effort**: E0/E1/E2/E3 **Source**: Step 4.2.X (Category Audit)
**Status**: PENDING | IN_PROGRESS | DONE | DEFERRED

**Description**: Brief description of the finding.

**Files affected**:

- file1.ts:123
- file2.tsx:45

**Implementation notes**:

- Step 1: ...
- Step 2: ...

**Acceptance criteria**:

- [ ] Criterion 1
- [ ] Criterion 2
```

**ID Conventions:**

- `CANON-NNN` - New findings from Step 4 multi-AI audit (e.g., CANON-001,
  CANON-042)
- `LEGACY-NNN` - Pre-audit discoveries or findings from earlier phases (e.g.,
  LEGACY-001)

### Processing Items (Step 4B Remediation)

1. Sort by severity (S1 → S2 → S3)
2. Group by category for efficient PRs
3. Execute via PR_PLAN_JSON from aggregator
4. Update status as work progresses
5. Move completed items to "Completed" section

### Deferring Items (to ROADMAP.md M2)

Items may be deferred if:

- Requires architectural changes beyond scope (document in ADR)
- Blocked by external dependency (document blocker)
- Risk/effort ratio unfavorable (S3/E3 items)

Deferred items MUST be:

- Added to ROADMAP.md M2 backlog
- Marked DEFERRED here with reason
- Logged in AI_REVIEW_LEARNINGS_LOG.md

---

## Backlog Items

### [Code Quality] Retrofit SSR-Safe localStorage

**CANON-ID**: LEGACY-001 (pre-audit discovery) **Severity**: S3 **Effort**: E1
(1-2 hours) **Source**: Phase 3 (PR3) - Error guards and SSR safety **Status**:
PENDING

**Description**: Replace direct `localStorage` calls with SSR-safe utility
functions. Existing code works fine (client-only components), but using
utilities adds future-proofing.

**Why deferred**:

- Existing code works fine (client-only components)
- Not causing SSR crashes
- Defensive improvement, not fixing a bug

**Value**:

- Consistent use of SSR-safe utilities across codebase
- Future-proofs against accidental SSR rendering
- Removes 11 direct `localStorage` calls

**Risk if skipped**:

- Low - existing code won't break
- If components become server-rendered in the future, could cause SSR crashes
- New developers might copy old pattern instead of using utilities

**Files affected**:

- `components/notebook/hooks/use-smart-prompts.ts` (4 usages)
- `components/notebook/pages/today-page.tsx` (5 usages)
- `lib/utils/anonymous-backup.ts` (2 usages)

**Implementation notes**:

1. Replace `localStorage.getItem()` with `getLocalStorage()` from
   `lib/utils/storage.ts`
2. Replace `localStorage.setItem()` with `setLocalStorage()`
3. Replace `localStorage.removeItem()` with `removeLocalStorage()`
4. For JSON operations, use `getLocalStorageJSON<T>()` and
   `setLocalStorageJSON<T>()`
5. Update imports:
   `import { getLocalStorage, setLocalStorage, ... } from '@/lib/utils/storage'`
6. Test each file individually (no regressions expected)

**Acceptance criteria**:

- [ ] `grep -rn "localStorage\." components/ lib/ --include="*.ts" --include="*.tsx" --exclude="storage.ts"`
      → 0 results
- [ ] All existing functionality works (smart prompts, journal temp save,
      anonymous backup)
- [ ] No new TypeScript errors

---

### [Documentation] Missing "Quick Start" Sections

**CANON-ID**: CANON-0101 (Documentation Audit finding) **Severity**: S3
**Effort**: E2 (2-3 hours) **Source**: docs:check lint (Session #48 analysis)
**Status**: PENDING

**Description**: ~40 Tier 2 documents are missing recommended "Quick Start"
sections. These sections help users quickly understand how to use the document.

**Files affected**: Run `npm run docs:check` for full list (warning: "Missing
recommended section matching: /quick start/i")

**Implementation notes**:

1. Batch add "## Quick Start" sections with 3-5 bullet points
2. Prioritize high-traffic docs first (templates, guides)
3. Template docs with YYYY-MM-DD dates are false positives - exclude

**Acceptance criteria**:

- [ ] Core Tier 1-2 docs have Quick Start sections
- [ ] Warning count reduced by 50%+

---

### [Documentation] Missing "AI Instructions" Sections

**CANON-ID**: CANON-0102 (Documentation Audit finding) **Severity**: S3
**Effort**: E1 (1-2 hours) **Source**: docs:check lint (Session #48 analysis)
**Status**: PENDING

**Description**: ~25 Tier 2 documents are missing "AI Instructions" sections.
These sections guide AI assistants on how to use the document.

**Files affected**: Run `npm run docs:check` for full list (warning: "Missing
recommended section matching: /ai instructions/i")

**Implementation notes**:

1. Batch add "## AI Instructions" sections
2. Can use standard template: "When referencing this document: [context]. Key
   points: [bullets]"
3. Focus on docs AI is likely to reference

---

### [Process] Fix docs:check False Positives

**CANON-ID**: CANON-0103 (Process Audit finding) **Severity**: S2 **Effort**: E1
(1 hour) **Source**: Session #48 analysis **Status**: PENDING

**Description**: The docs:check linter reports false positive "broken links" for
instructional placeholder text like `[text]` + `(path)` in templates. This
creates noise in the validation output.

**Files affected**: `scripts/check-docs-light.js`

**Implementation notes**:

1. Add heuristic to skip links containing literal placeholders (`path`,
   `<path>`, `<http://`)
2. Or add template-specific exclusions for known instructional patterns
3. Alternatively, mark template placeholder sections with HTML comments

**Acceptance criteria**:

- [ ] `npm run docs:check` on template files doesn't report instructional
      placeholders as broken

---

### [Process] Add Missing Script Triggers to Session Start

**CANON-ID**: CANON-0104 (Process Audit finding) **Severity**: S2 **Effort**: E0
(15 min) **Source**: Session #48 script trigger audit **Status**: PENDING

**Description**: Two useful scripts run manually but should auto-run at session
start:

- `surface-lessons-learned.js` - Surfaces relevant past lessons
- `check-document-sync.js` - Checks template-instance sync (with --quick flag)

**Files affected**: `.claude/hooks/session-start.sh`

**Implementation notes**:

```bash
# Add after consolidation check in session-start.sh
echo "🔍 Surfacing relevant lessons..."
node scripts/surface-lessons-learned.js 2>/dev/null || true

echo "🔍 Checking document sync..."
node scripts/check-document-sync.js --quick 2>/dev/null || true
```

**Acceptance criteria**:

- [ ] Both scripts run during session start
- [ ] Failures are non-blocking (warnings only)

---

### [Process] Add CANON Validation to CI Pipeline

**CANON-ID**: CANON-0105 (Process Audit finding) **Severity**: S2 **Effort**: E1
(30 min) **Source**: Session #48 script trigger audit **Status**: PENDING

**Description**: CANON schema validation scripts exist but only run manually.
Should run in CI when CANON files change.

**Scripts**:

- `validate-canon-schema.js` - Validates CANON JSONL schema
- `validate-audit.js` - Validates audit file structure

**Files affected**: `.github/workflows/ci.yml`

**Implementation notes**:

```yaml
# Option 1: Use paths-filter action for conditional runs
- name: Check changed files
  uses: dorny/paths-filter@v3
  id: changes
  with:
    filters: |
      canon:
        - '**/CANON*.jsonl'
        - '**/canonical/**'
      audit:
        - '**/AUDIT*.md'
        - '**/audit/**'

- name: Validate CANON schema
  if: steps.changes.outputs.canon == 'true'
  run: node scripts/validate-canon-schema.js

- name: Validate audit files
  if: steps.changes.outputs.audit == 'true'
  run: node scripts/validate-audit.js

# Option 2: Always run validation (simpler, recommended for fast scripts)
- name: Validate CANON schema
  run: node scripts/validate-canon-schema.js
```

**Acceptance criteria**:

- [ ] CI runs validation on relevant file changes
- [ ] Invalid CANON files fail the build

---

### [Process] Add npm Commands for Undocumented Scripts

**CANON-ID**: CANON-0106 (Process Audit finding) **Severity**: S3 **Effort**: E0
(10 min) **Source**: Session #48 script trigger audit **Status**: PENDING

**Description**: Several scripts lack npm run commands, making them harder to
discover and use.

**Scripts needing npm commands**:

- `validate-audit.js` → `npm run audit:validate`
- `validate-canon-schema.js` → `npm run canon:validate`
- `normalize-canon-ids.js` → `npm run canon:normalize`

**Files affected**: `package.json`

**Acceptance criteria**:

- [ ] All validation scripts have npm run commands
- [ ] Commands documented in relevant docs

---

### [Security] Missing Security Headers

**CANON-ID**: CANON-0107 (Single-session security audit 2026-01-13)
**Severity**: S1 **Effort**: E0 (< 30 min) **Source**: Single-session security
audit 2026-01-13 **Status**: PENDING

**Description**: Critical security headers are missing from Firebase Hosting
configuration: Content-Security-Policy (CSP), X-Frame-Options,
X-Content-Type-Options, Strict-Transport-Security (HSTS), Referrer-Policy,
Permissions-Policy.

**CWE**: CWE-693, CWE-1021 **OWASP**: A05:2021 Security Misconfiguration

**Files affected**:

- `firebase.json:6-37`

**Implementation notes**:

1. Add security headers to firebase.json hosting configuration
2. Start with X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy,
   Permissions-Policy
3. Add CSP last in report-only mode, then tighten after testing

**Acceptance criteria**:

- [ ] X-Frame-Options: DENY added
- [ ] X-Content-Type-Options: nosniff added
- [ ] Strict-Transport-Security with max-age=31536000 added
- [ ] Referrer-Policy: strict-origin-when-cross-origin added
- [ ] Permissions-Policy configured appropriately
- [ ] All headers verified via curl or Lighthouse on deployed site

---

### [Security] No Firebase Storage Rules

**CANON-ID**: CANON-0108 (Single-session security audit 2026-01-13)
**Severity**: S2 **Effort**: E0 (< 30 min) **Source**: Single-session security
audit 2026-01-13 **Status**: PENDING

**Description**: No Firebase Storage security rules file exists. If Firebase
Storage is enabled for this project, default rules may allow public read/write
access.

**CWE**: CWE-862 **OWASP**: A01:2021 Broken Access Control

**Files affected**:

- `storage.rules` (file does not exist - needs creation)

**Implementation notes**:

1. Create `storage.rules` in project root with deny-all default
2. Update `firebase.json` to include storage rules reference if not present
3. Deploy rules via `firebase deploy --only storage`

**Recommended content**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Deny all access by default
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

**Acceptance criteria**:

- [ ] storage.rules file created with deny-all rules
- [ ] firebase.json references storage.rules
- [ ] Attempt to upload file to Firebase Storage returns permission denied

---

## Backlog Statistics

| Category      | Count | Effort |
| ------------- | ----- | ------ |
| Code Quality  | 1     | E1     |
| Security      | 2     | E0     |
| Performance   | 0     | -      |
| Refactoring   | 0     | -      |
| Documentation | 2     | E3     |
| Process       | 4     | E2     |

**Total items**: 9 **Total estimated effort**: 8-11 hours

---

## Completed Items

_(Items completed during Step 4B remediation move here)_

---

## Rejected Items (Won't Do)

### [Type Safety] Strengthen Index Signature Types

**Why rejected**:

- Index signatures are appropriate for Firestore dynamic data
- Not a bug or vulnerability
- Would add complexity without value
- Firestore documents have flexible schemas
- Marked as "VERIFIED - Acceptable" in Phase 3 review

**Decision**: Won't fix - this is not a problem

---

## Version History

| Version | Date       | Changes                                                                                                            | Author           |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------ | ---------------- |
| 3.3     | 2026-01-13 | Added CANON-0107 (security headers) and CANON-0108 (storage.rules) from single-session security audit              | Claude           |
| 3.0     | 2026-01-05 | Renamed from POST_PHASE_8_BACKLOG.md; updated for Step 4 audit framework; aligned categories with 6-category audit | Claude           |
| 2.0     | 2026-01-02 | Standardized structure per Phase 4 migration                                                                       | Claude           |
| 1.0     | 2025-12-30 | Initial backlog document                                                                                           | Development Team |

---

## AI Instructions

**For AI Assistants managing this backlog:**

1. **Add CANON findings** from Step 4 aggregator output
2. **Use the standard format** with CANON-ID when adding items
3. **Update statistics** when adding/removing items
4. **Move completed items** to the "Completed" section (don't delete)
5. **Document rejections** in the "Rejected" section with rationale
6. **Cross-reference** items with AI_REVIEW_LEARNINGS_LOG.md for patterns

**When adding an item:**

```bash
# 1. Add the item using the standard format with CANON-ID
# 2. Update the statistics section
# 3. Commit with descriptive message
git add docs/AUDIT_FINDINGS_BACKLOG.md
git commit -m "docs: Add CANON-XXX to audit findings backlog"
```

---

## Update Triggers

**Update this document when:**

- New CANON finding discovered during Step 4 audit
- Item is completed and needs to move to Completed section
- Item is rejected and needs documentation
- Statistics need updating
- Item is deferred to ROADMAP.md M2

---

**END OF DOCUMENT**
