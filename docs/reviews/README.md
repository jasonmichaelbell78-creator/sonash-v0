# Multi-AI Reviews Directory

**Created:** 2026-01-06 **Updated:** 2026-01-15

---

## Purpose

This directory stores active and completed multi-AI review documents. It serves
as the central location for code reviews, security audits, performance audits,
and refactoring plans executed using multi-AI consensus methodology.

## AI Instructions

When working with reviews:

- Check appropriate year/quarter folder
- Use correct plan/findings templates
- Document systematically

---

## Usage

When running a multi-AI code review:

1. Copy the appropriate template from `docs/templates/`:
   - `MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md` - General code reviews
   - `MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md` - Security audits
   - `MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md` - Performance audits
   - `MULTI_AI_REFACTOR_PLAN_TEMPLATE.md` - Refactoring plans

2. Name the file: `[TYPE]_[YYYY-MM-DD].md`
   - Example: `CODE_REVIEW_2026-01-15.md`
   - Example: `SECURITY_AUDIT_2026-02-01.md`

3. Update [MULTI_AI_REVIEW_COORDINATOR.md](../MULTI_AI_REVIEW_COORDINATOR.md):
   - Add to "Currently Active Reviews" table
   - When complete, move to "Completed Reviews"

## File Naming Convention

```
[TYPE]_[YYYY-MM-DD].md

Types:
- CODE_REVIEW
- SECURITY_AUDIT
- PERFORMANCE_AUDIT
- REFACTOR_PLAN
```

## Archival

After 90 days, completed reviews may be moved to `docs/archive/reviews/`.

---

**See**: [MULTI_AI_REVIEW_COORDINATOR.md](../MULTI_AI_REVIEW_COORDINATOR.md) for
review coordination.

---

## Version History

| Version | Date       | Changes                                  |
| ------- | ---------- | ---------------------------------------- |
| 1.0     | 2026-01-06 | Initial multi-AI reviews directory setup |
