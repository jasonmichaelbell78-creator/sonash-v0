# Shared Ecosystem Audit Library

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-25
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Shared markdown modules for the 8 ecosystem audit skills. Each module extracts
duplicated content that was previously copy-pasted across all audit SKILLs.

## Modules

| Module                      | What It Contains                                              | Used By      |
| --------------------------- | ------------------------------------------------------------- | ------------ |
| `CRITICAL_RULES.md`         | 8 critical rules (progress check, run script, dashboard, Q&A) | All 8 audits |
| `COMPACTION_GUARD.md`       | State file schema, resume/save/cleanup protocol               | All 8 audits |
| `FINDING_WALKTHROUGH.md`    | Finding card, decisions, patches, delegation, batching        | All 8 audits |
| `SUMMARY_AND_TRENDS.md`     | Summary template, trend report, verification re-run           | All 8 audits |
| `CLOSURE_AND_GUARDRAILS.md` | Learnings, invocation tracking, guard rails, benchmarks       | All 8 audits |

## How Skills Reference These Modules

Each ecosystem audit SKILL.md replaces its duplicated sections with a read
directive pointing to the shared module:

```markdown
> Read `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md` for the
> full walkthrough protocol (finding card, decisions, patches, delegation,
> batching).
```

The SKILL.md retains:

- **Frontmatter and description** (unique per skill)
- **When to Use / When NOT to Use** (unique per skill)
- **Routing Guide** (unique per skill)
- **Phase 1: Run & Parse** (unique script path)
- **Phase 2: Dashboard** (unique category table)
- **Category Reference** (unique domains and categories)
- **Data Sources** (unique per skill)
- **Version History** (unique per skill)

## Maintenance

When updating shared behavior (e.g., adding a new critical rule or changing the
finding card format), edit the shared module once. All 8 audit skills
automatically pick up the change.

When updating skill-specific behavior (e.g., adding a new domain or changing a
script path), edit only the individual SKILL.md.

---

## Version History

| Version | Date       | Description                            |
| ------- | ---------- | -------------------------------------- |
| 1.0     | 2026-03-25 | Initial extraction from 8 audit skills |
