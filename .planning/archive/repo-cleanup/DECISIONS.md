# Repo Cleanup Implementation: DECISIONS

**Date:** 2026-03-23 **Questions asked:** 15 **Decisions captured:** 15

---

## Decision Table

| #   | Decision                     | Choice                                                                        | Rationale                                              |
| --- | ---------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | Phasing                      | Two commits: destructive (deletes+archives) then constructive (fixes+updates) | Clean risk separation                                  |
| 2   | Branch strategy              | New branch from main (`cleanup/repo-hygiene`)                                 | Clean diff for PR review                               |
| 3   | Oversized skills (7)         | Defer to `/skill-audit`                                                       | Will get fixed when skills go through audit            |
| 4   | Agent maxTurns (13)          | Skip — unnecessary                                                            | Agents work fine without it, system default sufficient |
| 5   | Unused devDeps (3)           | Remove from package.json AND knip.json ignoreDependencies                     | Dead deps confuse; npm install is trivial if needed    |
| 6   | Verification                 | Full suite after each commit                                                  | git status, crossdoc, patterns, tests, CI              |
| 7   | data/local-resources.ts      | KEEP                                                                          | User decision — not orphaned                           |
| 8   | MASTER_DEBT.jsonl.bak        | Delete                                                                        | Git history is the backup                              |
| 9   | knip.json                    | Partial fix — remove 3 dep suppressions only                                  | Aligns with dep removal; blanket ignores deferred      |
| 10  | Partial orphan test comments | Fix stale comments                                                            | 2-line edits, prevents future confusion                |
| 11  | validate-plan.yml            | Leave as-is                                                                   | Harmless, not worth diff noise                         |
| 12  | .mcp.json.bak                | Delete                                                                        | Git history is the backup                              |
| 13  | Husky v10 deprecation        | Defer                                                                         | Migration is its own task                              |
| 14  | Doc update scope             | All 7 stale docs                                                              | Research content at fix time if needed                 |
| 15  | Post-cleanup                 | Commit and push                                                               | User preference                                        |

---

## Deferred Items (tracked, not in this plan)

| Item                                  | Deferred To              | Rationale                     |
| ------------------------------------- | ------------------------ | ----------------------------- |
| 7 oversized skills → REFERENCE.md     | `/skill-audit` per skill | Content work, not cleanup     |
| 13 agents missing maxTurns            | N/A                      | Unnecessary per user          |
| Husky v10 migration                   | Separate task            | Own migration scope           |
| knip.json blanket test/script ignores | Future knip session      | May surface flood of findings |
| validate-plan.yml dormant workflow    | N/A                      | Harmless                      |
