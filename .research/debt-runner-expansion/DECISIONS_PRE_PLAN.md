# Pre-Plan Decisions: debt-runner Expansion

**Date:** 2026-03-26 (Session #241) **Context:** Decisions made during
deep-research Q&A and post-research discussion, before /deep-plan begins. These
MUST be consumed by /deep-plan as settled decisions.

---

## Research Phase Q&A Decisions (Phase 0.4)

| #   | Decision                   | User's Direction                                                                                                           |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| D1  | External sources scope     | Use everything currently available. No manual paste (use add-debt for that). PR-review copy/paste is untenable for volume. |
| D2  | Debt refresh model         | Additive reconciliation — preserve DEBT-XXXXX IDs, history, resolution records. NOT destructive rebuild.                   |
| D3  | Script documentation depth | Full documentation of all 30 scripts (not just entry points).                                                              |
| D4  | Audit skill mapping        | Full mapping of ALL audit skills' findings paths to TDMS.                                                                  |
| D5  | Defer-path tracing         | Trace ALL "defer to TDMS" locations. System will be deeply interactive with menus and submenus.                            |

## Architecture Decisions (Post-Research)

| #   | Decision              | User's Direction                                                                                                                                                                                        |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D6  | Architecture          | **Hybrid CLI + Web Dashboard** (Option C). Web dashboard at `/dev/debt` for browse/filter/trends (read side). CLI skill for AI operations (write side — verify, sync, plan, refresh, triage, discover). |
| D7  | Web dashboard context | This is ONE tab of the broader dev dashboard (Track B in ROADMAP). Not a standalone site. Sits alongside planned Lighthouse, Error Tracing, Session Activity, Document Sync, Override Audit tabs.       |
| D8  | /deep-plan scope      | **Option B: Plan both workstreams together** — CLI expansion + web dashboard + ALL downstream changes/issues + integrations. Not just one workstream.                                                   |
| D9  | Interactivity         | Even with the web dashboard handling browsing, the CLI skill will still need significant interactivity — "menus and submenus and so forth." The CLI is not reduced to a thin wrapper.                   |
| D10 | Downstream scope      | ALL downstream changes are in scope: 6 bugs, integration gap closures, defer-path repairs, script fixes, adjacent skill updates, discovery agent layer.                                                 |

## Challenge-Adjusted Findings

These adjustments were made based on contrarian and OTB challenges:

| Original Claim                              | Adjustment            | Reason                                                                                                                        |
| ------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| GAP-01: code-reviewer CRITICAL gap          | Downgrade to MODERATE | Auto-routing would flood TDMS. Add selective defer option, not auto-routing.                                                  |
| GAP-09: npm audit HIGH gap                  | Downgrade to MEDIUM   | Overlaps with Dependabot coverage.                                                                                            |
| GAP-13: ecosystem audit "Fix Now" gap       | REMOVE as gap         | Correct design — fixed items shouldn't create debt entries.                                                                   |
| DARK-01: known-debt-baseline "shadow store" | Reframe               | It's a pre-commit suppression list, not a shadow store. Needs DEBT-XXXX cross-reference but isn't "dark."                     |
| BUG-02: dedup --dry-run severity            | Weakened              | Script writes to staging (raw/deduped.jsonl), not MASTER_DEBT directly.                                                       |
| Discovery agent types: 9 proposed           | Reduce to 7 net-new   | dependency-auditor duplicates existing dependency-manager agent. security-scanner duplicates existing security-auditor agent. |
| Full refresh: "single user gate"            | Corrected to 2 gates  | Pre-dispatch confirmation + Step 7 review gate.                                                                               |

## Key Open Questions for /deep-plan

1. Bug-fix-first sequencing — fix 6 bugs in pre-expansion PR before any new
   modes?
2. SQLite timing — expand on JSONL now or wait for SQLite migration (DEBT-7593)?
3. New mode list — which of the 6 proposed CLI modes are must-have vs
   nice-to-have?
4. Discovery agent layer — 7 net-new agent types: all at once or phased?
5. Guided vs expert mode — outcome language for director vs script-level detail
6. Menu depth — how deep do CLI sub-menus go given web handles browsing?
7. Integration priority — which disconnected sources to bridge first?
8. Resolution rate — OTB flagged that more intake without fixing resolution
   worsens backlog
9. Web dashboard API design — API routes vs direct file reads vs SQLite queries
10. Dev dashboard tab coordination — how does /dev/debt interact with other
    planned tabs?
