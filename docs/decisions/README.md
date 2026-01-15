# Architecture Decision Records (ADRs)

**Created:** 2026-01-03 **Updated:** 2026-01-15

---

## Purpose

This directory contains Architecture Decision Records (ADRs) that document
significant technical decisions for the SoNash project. ADRs preserve the
context and rationale behind architectural choices, enabling future developers
to understand why decisions were made.

## AI Instructions

When creating ADRs:

- Use TEMPLATE.md as base
- Number sequentially (ADR-NNN)
- Update this index after adding new ADRs

---

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important
architectural decision made along with its context and consequences. ADRs help:

- **Preserve context** for why decisions were made
- **Onboard new team members** quickly
- **Enable future reviews** of past decisions
- **Avoid repeating discussions** that have already been resolved

## When to Write an ADR

Create an ADR when:

- Making a significant architectural choice
- Choosing between multiple valid approaches
- Changing an existing pattern or convention
- Introducing new tooling or dependencies
- Pivoting project direction or methodology

## ADR Format

Each ADR follows this structure:

1. **Title** - Short descriptive title with ADR number
2. **Status** - Proposed | Accepted | Deprecated | Superseded
3. **Context** - What is the issue/situation?
4. **Decision** - What was decided?
5. **Consequences** - What results from this decision?
6. **Alternatives Considered** - What other options were evaluated?

See [TEMPLATE.md](./TEMPLATE.md) for the full template.

## ADR Index

| ADR                                                          | Title                                | Status   | Date       |
| ------------------------------------------------------------ | ------------------------------------ | -------- | ---------- |
| [ADR-001](./ADR-001-integrated-improvement-plan-approach.md) | Integrated Improvement Plan Approach | Accepted | 2026-01-03 |

## Naming Convention

ADR files follow the pattern: `ADR-NNN-short-descriptive-title.md`

- `NNN` = Zero-padded sequential number (001, 002, etc.)
- Title uses lowercase with hyphens
- Example: `ADR-001-integrated-improvement-plan-approach.md`

## References

- [Michael Nygard's ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub Organization](https://adr.github.io/)

---

## Version History

| Version | Date       | Changes                            |
| ------- | ---------- | ---------------------------------- |
| 1.0     | 2026-01-03 | Initial ADR directory with ADR-001 |
