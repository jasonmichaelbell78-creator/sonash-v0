# Ecosystem Audit: Compaction Guard

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-25
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Shared compaction guard protocol for all ecosystem audit skills. Audits are
long-running interactive workflows vulnerable to context compaction. This module
defines the state persistence pattern to survive compaction.

**Usage:** Add this to your ecosystem audit SKILL.md:

```markdown
## Compaction Guard

> Read `.claude/skills/_shared/ecosystem-audit/COMPACTION_GUARD.md` for the full
> compaction guard protocol (state file schema, resume, save, cleanup).

State file path: `.claude/tmp/{audit-name}-audit-progress.json`
```

---

## State File Schema

Path convention: `.claude/tmp/{audit-name}-audit-progress.json`

```json
{
  "auditTimestamp": "ISO timestamp of audit run",
  "score": 85,
  "grade": "B",
  "totalFindings": 42,
  "currentFindingIndex": 8,
  "decisions": [
    {
      "findingIndex": 1,
      "category": "category_key",
      "message": "finding description",
      "decision": "fix|defer|skip|acknowledge|suppress",
      "note": "reason or context"
    }
  ],
  "fixesApplied": ["description of fix applied"],
  "findingsData": []
}
```

### Optional Extended Fields

Some audits extend the base schema with additional fields:

- `currentDomain` (string) -- for domain-based chunking (skill-ecosystem-audit)
- `domainsCompleted` (string[]) -- tracks completed domains

---

## On Skill Start (Before Phase 1) (MUST)

1. Check if `.claude/tmp/{audit-name}-audit-progress.json` exists and is < 2
   hours old
2. If yes: **resume from saved position**
   - Display the dashboard from saved data (skip re-running the audit script)
   - Show: "Resuming audit from finding {n}/{total} ({n-1} already reviewed)"
   - List prior decisions briefly: "{n} fixed, {n} skipped, {n} deferred"
   - Continue the walkthrough from `currentFindingIndex`
3. If no (or stale): proceed to Phase 1 normally

---

## After Each Decision (During Phase 3) (MUST)

After each decision, immediately save progress:

1. Update `currentFindingIndex` to the next finding
2. Append the decision to the `decisions` array
3. If "Fix Now" was chosen, append to `fixesApplied`
4. Write the updated JSON to `.claude/tmp/{audit-name}-audit-progress.json`

This ensures that if compaction occurs mid-walkthrough, the next invocation
resumes exactly where it left off -- no repeated questions, no lost decisions.

---

## On Audit Completion

After the closure summary, delete the progress file (audit is complete).

---

## Domain-Based Chunking (Optional)

For audits with many findings (100+), process findings domain by domain:

1. Process all D1 findings, save progress
2. Process D2 findings, save progress
3. Continue through all domains

**Budget check between domains:** If context is running low after completing a
domain, save progress and tell the user: "Context budget is running low.
Progress saved at domain {N}. Re-invoke `/{audit-name}` to continue from where
we left off."

---

## Version History

| Version | Date       | Description                             |
| ------- | ---------- | --------------------------------------- |
| 1.0     | 2026-03-25 | Extracted from 8 ecosystem audit skills |
