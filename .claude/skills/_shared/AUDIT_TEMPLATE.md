# Shared Audit Template

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Common boilerplate for all single-session audit skills. Referenced via:
`Read .claude/skills/_shared/AUDIT_TEMPLATE.md for standard audit procedures.`

---

## Evidence Requirements (MANDATORY)

**All findings MUST include:**

1. **File:Line Reference** - Exact location (e.g., `lib/utils.ts:45`)
2. **Code Snippet** - The actual problematic code (3-5 lines of context)
3. **Verification Method** - How you confirmed this is an issue
4. **Standard Reference** - ESLint rule, TypeScript error, or best practice
   citation

**Confidence Levels:**

- **HIGH (90%+)**: Confirmed by external tool, verified file exists, code
  snippet matches
- **MEDIUM (70-89%)**: Found via pattern search, file verified, but no tool
  confirmation
- **LOW (<70%)**: Pattern match only, needs manual verification

**S0/S1 findings require:**

- HIGH or MEDIUM confidence (LOW confidence S0/S1 must be escalated)
- Dual-pass verification (re-read the code after initial finding)
- Cross-reference with tool output

---

## Dual-Pass Verification (S0/S1 Only)

For all S0 (Critical) and S1 (High) findings:

1. **First Pass**: Identify the issue, note file:line and initial evidence
2. **Second Pass**: Re-read the actual code in context
   - Verify the issue is real and not a false positive
   - Check for existing handling or intentional patterns
   - Confirm file and line still exist
3. **Decision**: Mark as CONFIRMED or DOWNGRADE (with reason)

Document dual-pass result in finding: `"verified": "DUAL_PASS_CONFIRMED"` or
`"verified": "DOWNGRADED_TO_S2"`

---

## Cross-Reference Validation

Before finalizing findings, cross-reference with:

1. **Tool output** - Mark findings as "TOOL_VALIDATED" if tools flagged same
   issue
2. **Prior audits** - Check `docs/audits/single-session/<type>/` for duplicate
   findings

Findings without tool validation should note: `"cross_ref": "MANUAL_ONLY"`

---

## JSONL Output Format

**CRITICAL - Use JSONL_SCHEMA_STANDARD.md format:**

```json
{
  "category": "<audit-category>",
  "title": "Short specific title",
  "fingerprint": "<category>::<primary_file>::<identifier>",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": 90,
  "files": ["path/to/file.ts:123"],
  "why_it_matters": "1-3 sentences explaining impact",
  "suggested_fix": "Concrete remediation direction",
  "acceptance_tests": ["Array of verification steps"],
  "evidence": ["code snippet", "grep output", "tool output"]
}
```

**For S0/S1 findings, ALSO include:**

```json
{
  "verification_steps": {
    "first_pass": { "method": "...", "evidence_collected": ["..."] },
    "second_pass": { "method": "...", "confirmed": true, "notes": "..." },
    "tool_confirmation": { "tool": "...", "reference": "..." }
  }
}
```

**Required fields:** `category`, `fingerprint`, `files` (array with
`file.ts:123`), `confidence` (number 0-100), `acceptance_tests` (non-empty
array).

---

## Context Recovery

If the session is interrupted (compaction, timeout, crash):

1. Check for state file: `.claude/state/audit-<type>-<date>.state.json`
2. If state file exists and < 24 hours old: Resume from last completed stage
3. If stale (> 24 hours): Start fresh
4. Always preserve any partial findings already written

---

## Post-Audit Validation

Before finalizing:

1. Run: `node scripts/validate-audit.js <output.jsonl>`
2. Checks: required fields present, no FALSE_POSITIVES matches, no duplicates,
   all S0/S1 have HIGH/MEDIUM confidence with DUAL_PASS_CONFIRMED
3. If validation fails: review, fix, re-run

---

## MASTER_DEBT Cross-Reference (MANDATORY - before Interactive Review)

**Do NOT present findings for review until cross-referenced against
MASTER_DEBT.jsonl.**

1. Read `docs/technical-debt/MASTER_DEBT.jsonl`
2. For each finding, search by: same file path, similar title, same root cause
3. Classify: **Already Tracked** (skip), **New** (review), **Possibly Related**
   (flag)
4. Present only New + Possibly Related in Interactive Review

---

## Interactive Review (MANDATORY - before TDMS intake)

Present findings in **batches of 3-5**, grouped by severity (S0 first). Each
shows:

```
### DEBT-XXXX: [Title]
**Severity:** S_ | **Effort:** E_ | **Confidence:** _%
**Current:** [What exists now]
**Suggested Fix:** [Concrete remediation]
**Counter-argument:** [Why NOT to do this]
**Recommendation:** ACCEPT/DECLINE/DEFER
```

Track decisions in `docs/audits/single-session/<type>/REVIEW_DECISIONS.md`.
After ALL findings reviewed, proceed to TDMS Intake with accepted + deferred
only.

---

## TDMS Intake & Commit

1. Display summary to user
2. Confirm files saved to `docs/audits/single-session/<type>/`
3. Run `node scripts/validate-audit.js` on JSONL file
4. Validate CANON schema if applicable: `npm run validate:canon`
5. Update AUDIT_TRACKER.md with entry
6. Run threshold reset:
   `node scripts/reset-audit-triggers.js --type=single --category=<type> --apply`
7. **TDMS Integration (MANDATORY)**:
   ```bash
   node scripts/debt/intake-audit.js <output.jsonl> --source "audit-<type>-<date>"
   ```
8. Ask: "Would you like me to fix any of these issues now?"

---

## Documentation References

- [PROCEDURE.md](docs/technical-debt/PROCEDURE.md) - Full TDMS workflow
- [MASTER_DEBT.jsonl](docs/technical-debt/MASTER_DEBT.jsonl) - Canonical debt
  store
- [JSONL_SCHEMA_STANDARD.md](docs/templates/JSONL_SCHEMA_STANDARD.md) - Output
  format requirements
- [CODE_PATTERNS.md](docs/agent_docs/CODE_PATTERNS.md) - Anti-patterns reference

---

## Agent Return Protocol

**CRITICAL**: All agents spawned by audit skills MUST return ONLY:

```
COMPLETE: [agent-id] wrote N findings to [output-path]
```

Do NOT return full findings content. The orchestrator checks completion via
`wc -l` on JSONL files.

---

## Honesty Guardrails

- **No hallucinated file paths** - verify every file:line reference with
  Read/Grep before including
- **No inflated severity** - S0/S1 require dual-pass confirmation
- **No duplicate findings** - cross-reference MASTER_DEBT before intake
- **Confidence must be honest** - if unsure, use LOW and escalate
