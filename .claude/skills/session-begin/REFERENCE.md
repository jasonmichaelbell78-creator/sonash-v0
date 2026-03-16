<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-16
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Session Begin Reference

Supporting reference material for the session-begin skill. This content is
informational — consult during the session, not executed as part of the
pre-flight checklist.

---

## Skill Routing

For the canonical skill/agent trigger table, see **CLAUDE.md Section 7**. Quick
reference:

| Situation           | Skill/Agent                    |
| ------------------- | ------------------------------ |
| New project/domain  | `/find-skills`                 |
| Bug/error           | `systematic-debugging` (first) |
| Wrote/modified code | `code-reviewer` agent (after)  |
| Security work       | `security-auditor` agent       |
| UI/Frontend         | `frontend-design` skill        |
| Complex task        | Check available skills         |
| Multi-step task     | Use tasks to track progress    |

---

## Code Review Handling Procedures

**ALWAYS use `/pr-review` skill** when receiving code review feedback
(CodeRabbit, Qodo, SonarCloud, Gemini). Skipping the protocol causes cascading
issues in subsequent rounds. Evidence: PR #379 R8-R9 skipped protocol, causing 2
avoidable cleanup rounds.

Full procedure:

1. Invoke `/pr-review` — never process feedback without the full protocol
2. Analyze ALL suggestions — read through every comment multiple times
3. Create task checklist — track each suggestion
4. Address systematically — don't skip items; mark resolved or note why skipped
5. Verify CI impact — check if changes affect workflows (ci.yml, docs-lint.yml)
6. Test after changes — `npm test` and `npm run lint` before committing

---

## Anti-Pattern Awareness

For the full anti-pattern list, see **CLAUDE.md Section 5** and
[CODE_PATTERNS.md](../../../docs/agent_docs/CODE_PATTERNS.md) (lines 1-60 for
quick reference).

Key patterns to keep in mind:

- **Read before edit** — always read files before attempting to edit
- **Regex performance** — avoid greedy `.*`; use bounded `[\s\S]{0,N}?`
- **ESLint flat config** — spread plugin configs, don't use directly
- **Path-based filtering** — add pathFilter for directory-specific patterns
- **Archive exclusions** — historical docs excluded from strict linting

---

## Planning Awareness

- Archive files in `docs/archive/` are excluded from linting
- Completed plans are archived to `docs/archive/completed-plans/`

---

## Technical Debt Tracking

After resolving tech debt items during a session:

1. Mark item as resolved in `docs/technical-debt/MASTER_DEBT.jsonl`
2. Update ROADMAP.md if item was in a sprint track
3. Note in session summary

Key documents:

| Document                       | Purpose                                  |
| ------------------------------ | ---------------------------------------- |
| `docs/technical-debt/INDEX.md` | Single source of truth for all tech debt |
| `ROADMAP.md`                   | Sprint tracks and priorities             |

---

## Cross-Document Dependencies

Key dependencies to verify (automated by `npm run crossdoc:check`):

- ROADMAP.md <-> SESSION_CONTEXT.md (priorities match)
- `MASTER_DEBT.jsonl` <-> ROADMAP.md (tech debt section current)
- Audit findings <-> `MASTER_DEBT.jsonl` (new findings consolidated)

See [DOCUMENT_DEPENDENCIES.md](../../../docs/DOCUMENT_DEPENDENCIES.md) for full
matrix.
