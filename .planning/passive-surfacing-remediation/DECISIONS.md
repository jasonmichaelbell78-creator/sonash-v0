<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Decision Record: Passive Surfacing Remediation

**Date:** 2026-03-17 **Questions Asked:** 17 **Decisions Captured:** 17
**Discovery Method:** 4-agent research team + convergence verification (5 agents
total) **Violations Found:** 33 (10 HIGH, 16 MEDIUM, 7 LOW)

---

| #   | Decision                             | Choice                                                                                                                      | Rationale                                                                                               |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| D1  | Fix strategy                         | Per-pattern (5 root cause patterns, apply uniformly)                                                                        | 33 violations across 5 patterns — pattern-level fixes are efficient and consistent                      |
| D2  | Acknowledgment gate mechanism        | Tiered: HIGH → blocking gate, MEDIUM → route to /alerts, LOW → inline command or remove                                     | Matches severity to disruption. Don't block file writes for MEDIUM warnings.                            |
| D3  | "Continuing anyway" build failures   | Surface with retry option via session-begin gate                                                                            | Hooks can't prompt interactively; session-begin skill CAN gate interactively                            |
| D4  | post-write-validator.js approach     | Keep non-blocking, add explicit action commands to each message                                                             | PostToolUse hooks fire every write. Blocking would destroy flow. Action commands are sufficient.        |
| D5  | Cooldown/dedup suppression           | Keep cooldowns but exclude HIGH severity                                                                                    | Without cooldowns = alert fatigue. But HIGH severity should never be silently suppressed.               |
| D6  | Informational wallpaper              | Remove skip messages entirely. Move phase transitions to DEBUG-only.                                                        | Nobody needs "Skipping root dependencies (unchanged)" every session.                                    |
| D7  | /alerts audit                        | Run `/skill-audit alerts` at end with focus on size, flow, category count, duplication                                      | Routing 33 violations to /alerts could make it unwieldy. Audit validates sizing after fixes land.       |
| D8  | Hook → session-begin gate mechanism  | Hooks write failure flags; session-begin extends existing warning gate (Section 4.2) to include them                        | Session-begin already has the ack gate pattern. Reuse, don't reinvent.                                  |
| D9  | Ecosystem audit updates              | All 4: hook-ecosystem-audit, script-ecosystem-audit, session-ecosystem-audit, health-ecosystem-audit                        | All 4 have violations in their scope. Adding "passive surfacing compliance" catches this going forward. |
| D10 | Tiered severity routing confirmation | HIGH → session-begin gate or flag. MEDIUM → /alerts via hook-warnings.jsonl + inline action. LOW → inline action or remove. | Clear routing prevents ambiguity during implementation.                                                 |
| D11 | post-write-validator message format  | Standardized: `⚠️ [CATEGORY] WARNING` + description + `Fix: [exact command]` + `Ref: [doc link]`                            | Replaces "Consider running..." with actionable commands. Consistent format across all 9 messages.       |
| D12 | Execution approach                   | Single pass per file (edit each file once with all fixes)                                                                   | Pattern-level fixes mean each file needs one editing pass. No reason to touch same file twice.          |
| D13 | /skill-audit alerts focus areas      | Category count, per-alert interaction time, grouping/pagination needs, duplicate detection + standard audit                 | Expanded focus beyond normal skill-audit to catch sizing issues from routed violations.                 |
| D14 | Session-begin gate presentation      | Extend existing Section 4.2 warning gate with build failures and HIGH-severity hook warnings                                | Reuse existing pattern. One gate, more items.                                                           |
| D15 | Duplicate surfacing mitigation       | Mark inline warnings as "[TRACKED]" when also routed to /alerts                                                             | User sees warning in context (helpful) AND knows it's tracked (won't wallpaper).                        |
| D16 | Execution location                   | Plan in worktree, execute elsewhere                                                                                         | Consistent with GitHub optimization and insights plans.                                                 |
| D17 | Commit strategy                      | Single commit for all fixes + ecosystem audit updates                                                                       | One coherent initiative. No benefit to splitting.                                                       |

---

## Scope Items (non-decision, recorded for plan)

- **Scope A:** Add "passive surfacing compliance" category to 4 ecosystem audits
- **Scope B:** Run `/skill-audit alerts` at end with expanded focus on size and
  flow
