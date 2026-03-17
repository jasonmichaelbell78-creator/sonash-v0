<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Decision Record: Insight Report — Work Locale

**Date:** 2026-03-17 **Questions Asked:** 16 **Decisions Captured:** 16

---

| #   | Decision                        | Choice                                                                                                          | Rationale                                                                                                     | Scope       |
| --- | ------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------- |
| D1  | CLAUDE.md section placement     | Fold into existing Section 4 (Behavioral Guardrails) as items 7-11                                              | These are behavioral rules, same as existing 6. Avoids new section overhead.                                  | UNIVERSAL   |
| D2  | Push enforcement method         | CLAUDE.md rule only (no hook)                                                                                   | Hook blocking all pushes is disruptive. Behavioral rule is sufficient. System prompt already says to confirm. | UNIVERSAL   |
| D3  | Windows/platform guidance       | Universal rule: "Respect the declared platform and shell from system prompt"                                    | Works on all platforms. Real issue is Claude ignoring system prompt info, not lacking it.                     | UNIVERSAL   |
| D4  | Question batching limit         | Soft rule: 5-8 max unless user requests exhaustive questioning                                                  | Hard cap of 6 would conflict with deep-plan's 5-8. Softer guideline covers general case.                      | UNIVERSAL   |
| D5  | Pre-PR file verification        | CLAUDE.md rule: run `git status` before PR/branch finish                                                        | Pre-push hook already extensive. Behavioral rule is sufficient, low overhead.                                 | UNIVERSAL   |
| D6  | settings.local.json cleanup     | Prune stale SKIP\_\* push permissions, keep generic ones                                                        | ~25 one-off lines are stale from past sessions. Generic permissions are fine.                                 | WORK-LOCALE |
| D7  | Pre-commit-fixer auto-trigger   | CLAUDE.md rule: invoke `/pre-commit-fixer` on hook failure, don't retry manually                                | Skill exists but Claude doesn't auto-use it. Behavioral rule is simpler than a hook.                          | UNIVERSAL   |
| D8  | Push rule wording               | "Never push to remote without explicit approval. `git commit` is fine. `git push` requires user to say 'push'." | Clear separation of commit (autonomous) vs push (requires approval).                                          | UNIVERSAL   |
| D9  | Platform rule wording           | "Respect the declared platform and shell. Do not assume Linux-only tools. Check system prompt."                 | Universal, harmless on any platform, addresses the root cause.                                                | UNIVERSAL   |
| D10 | Pre-commit-fixer rule wording   | "On hook failure, use `/pre-commit-fixer`. Don't manually retry. After 2 fixer attempts, ask user."             | Directs Claude to existing tool instead of guess-and-retry loops.                                             | UNIVERSAL   |
| D11 | Question batching rule wording  | "Batch questions 5-8 max unless user requested exhaustive questioning (e.g., `/deep-plan`)."                    | Soft enough to not conflict with skills, firm enough to prevent 15-question dumps.                            | UNIVERSAL   |
| D12 | Stale permission identification | Remove lines with specific PR numbers, SKIP_REASON strings, one-off bash commands (~25 lines)                   | These are artifacts of past sessions, not reusable permissions.                                               | WORK-LOCALE |
| D13 | Enforcement annotations         | All new rules get `[BEHAVIORAL: no automated enforcement]`                                                      | Consistent with existing guardrails 4-6. No automated gate exists for these.                                  | UNIVERSAL   |
| D14 | Execution strategy              | Single commit for both CLAUDE.md + settings.local.json                                                          | Small enough change that splitting adds overhead. Plan artifacts document scope classification.               | BOTH        |
| D15 | Pre-PR verification placement   | CLAUDE.md Section 4 as item 11 (alongside other new rules)                                                      | Clearly universal, real friction point, low cost to add now.                                                  | UNIVERSAL   |
| D16 | Merge protocol                  | Plan includes Merge Instructions section. Home-locale plan compares, dedupes, then finalizes.                   | Clear protocol for the two-locale workflow. Universal items execute once, locale items separately.            | META        |
| D17 | Home insights: verify file state | Add Rule 12: "Verify file state against filesystem, not docs." 3 friction examples from home insights.           | Strong signal from home /insights — multiple incidents of Claude trusting docs over reality causing data loss. | UNIVERSAL   |
