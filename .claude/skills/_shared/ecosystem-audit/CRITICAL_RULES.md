# Ecosystem Audit: Critical Rules

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-25
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Shared critical rules for all ecosystem audit skills. Referenced from each
`*-ecosystem-audit/SKILL.md` to eliminate duplication.

**Usage:** Add this to your ecosystem audit SKILL.md:

```markdown
## CRITICAL RULES (Read First)

> Read `.claude/skills/_shared/ecosystem-audit/CRITICAL_RULES.md` and follow all
> 8 rules. The rules below are summaries — the shared file is authoritative.
```

---

## The 8 Critical Rules

1. **CHECK for saved progress first** (MUST) -- resume from
   `.claude/tmp/{audit-name}-audit-progress.json` if it exists and is < 2 hours
   old. Never re-present findings that were already decided.
2. **ALWAYS run the script first** (MUST) -- never generate findings without
   data. If no saved progress, run the audit script before anything else.
3. **ALWAYS display the dashboard** (MUST) -- show the dashboard to the user
   before starting the walkthrough.
4. **Use conversational Q&A for decisions** (MUST) -- present findings in
   batches, collect decisions via conversation. NEVER use AskUserQuestion.
5. **SAVE progress after every decision** (MUST) -- write updated state to
   progress file immediately.
6. **Show patch suggestions inline** (SHOULD) -- with each patchable finding.
7. **Create TDMS entries** (MUST) -- for deferred findings via `/add-debt`.
8. **Save decisions** (MUST) -- to session log for audit trail.

---

## Rule Clarifications

### Rule 1: Resume Protocol

- Progress file path convention: `.claude/tmp/{audit-name}-audit-progress.json`
- Staleness threshold: 2 hours (files older than 2 hours are treated as stale)
- On resume: display dashboard from saved data, show "Resuming audit from
  finding {n}/{total} ({n-1} already reviewed)", list prior decisions

### Rule 4: Conversational Q&A

All ecosystem audits adopted conversational Q&A in the v2 rewrite (2026-03-08).
Skills still referencing AskUserQuestion should be updated.

### Rule 7: TDMS Entry Format

Deferred findings create DEBT entries via `/add-debt` with:

- severity: S1 (errors) or S2 (warnings)
- category: `engineering-productivity`
- source_id: `review:{audit-name}-ecosystem-audit-{date}`

---

## Version History

| Version | Date       | Description                             |
| ------- | ---------- | --------------------------------------- |
| 1.0     | 2026-03-25 | Extracted from 8 ecosystem audit skills |
