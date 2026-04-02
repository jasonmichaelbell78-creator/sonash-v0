# SQ-006: Archive Candidates

**Audit Date:** 2026-03-23 **Scope:** All non-archived files checked for
completion/staleness

---

## Executive Summary

4 definite archive candidates, 2 probable (pending execution completion). All
active planning directories are legitimately active.

---

## Definite Archive Candidates

| File                                                  | Reason                                               | Action                |
| ----------------------------------------------------- | ---------------------------------------------------- | --------------------- |
| `.claude/state/deep-plan-review-lifecycle.state.json` | Completed: 9/9 steps done, marked COMPLETE           | Archive or delete     |
| `data/ecosystem-v2/retros.jsonl.archived-20260318`    | Already marked .archived, still in main dir          | Move to data/archive/ |
| `data/ecosystem-v2/reviews.jsonl.archived-20260318`   | Already marked .archived, still in main dir          | Move to data/archive/ |
| `.claude/override-log-1772919008171.jsonl`            | Old session log (~2026-03-21), superseded by current | Archive or delete     |

---

## Probable Archive Candidates (verify after execution)

| File                                          | Reason                                                                                       | When to Archive                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `.planning/statusline-research/`              | Research complete, superseded by .research/custom-statusline/ + .planning/custom-statusline/ | After statusline implementation ships         |
| Ecosystem audit history state files (6 files) | Superseded by newer audit runs                                                               | After next audit cycle confirms data captured |

---

## Verified as Active (Keep)

### Planning Directories — All Legitimately Active

| Directory                     | Status   | Why Keep                                      |
| ----------------------------- | -------- | --------------------------------------------- |
| agent-environment-analysis    | ACTIVE   | Phase 1 research complete, Phases 2-5 pending |
| cli-tools-implementation      | APPROVED | Phase 1-3 about to execute                    |
| custom-statusline             | ACTIVE   | Just approved, implementation pending         |
| passive-surfacing-remediation | ACTIVE   | 33 violations to fix                          |
| propagation-research          | APPROVED | 4 waves planned                               |
| system-wide-standardization   | ACTIVE   | Core SWS coordination hub                     |

### State Files — Active Plans

- deep-plan-ecosystem-expansion.state.json — approved, not yet executed
- deep-plan-hook-overhaul.state.json — approved, 10 waves planned
- deep-plan.custom-statusline.state.json — active discovery
- deep-plan.memory-system-audit.state.json — executing, 3 batches done
- skill-creator.state.json — planning phase for debt-runner
- sws-reevaluation.state.json — research complete, awaiting deep-plan

### Other

- .claude/override-log.jsonl — current session log, keep
- .research/ directories — referenced by active plans, keep

---

## Summary

| Category               | Count                           |
| ---------------------- | ------------------------------- |
| Definite archives      | 4                               |
| Probable archives      | 2                               |
| Verified active (keep) | 6 planning dirs + 6 state files |
