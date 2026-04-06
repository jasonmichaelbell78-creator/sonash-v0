<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# MASTER_DEBT Internal Deduplication Report

**Date:** 2026-02-22 **Performed by:** Automated deduplication script

## Summary

- **Total entries before:** 4503
- **Duplicate groups found:** 90
- **Entries removed:** 92
- **Total entries after:** 4411
- **Reduction:** 2.0%

## Deduplication Strategies

| Strategy | Description                                                                  | Groups Found |
| -------- | ---------------------------------------------------------------------------- | ------------ |
| S1       | Same title + same file + same non-zero line                                  | 1            |
| S2       | Duplicate SonarCloud sonar_key                                               | 0            |
| S3       | Duplicate source_id (non-unknown, non-audit)                                 | 9            |
| S4       | DEBT-7xxx re-ingested with source_id=unknown matching existing tracked entry | 80           |

## Conservation Rules Applied

- RESOLVED entries were NOT removed in favor of non-RESOLVED entries (different
  lifecycle points)
- When in doubt (mixed lifecycle groups), both entries were kept
- Winner selection: highest severity > longest description > lowest DEBT-ID
  (oldest)
- SonarCloud entries with same rule but different files were NOT treated as
  duplicates
- SonarCloud entries with same rule but different lines in same file were NOT
  treated as duplicates

## Duplicate Groups Found

### S1: Same title + file + line

| Kept ID                                        | Kept Status | Removed IDs | Reason                                        |
| ---------------------------------------------- | ----------- | ----------- | --------------------------------------------- |
| DEBT-0682 (Prefer `globalThis` over `window`.) | VERIFIED    | DEBT-4373   | Same title + same file + same line (non-zero) |

### S3: Duplicate source_id

| Kept ID                                                        | Kept Status | Removed IDs                     | Reason                                                                           |
| -------------------------------------------------------------- | ----------- | ------------------------------- | -------------------------------------------------------------------------------- |
| DEBT-2192 (Add automatic ROADMAP.md completion detection)      | RESOLVED    | DEBT-2313, DEBT-2314, DEBT-2315 | Duplicate source_id: OPT-F001-gaps                                               |
| DEBT-3533 (Add limit(50) to queries in lib/db/meetings.ts and) | VERIFIED    | DEBT-7002                       | Duplicate source_id: dec-2025-report:AGGREGATED_6MODEL_REPORT.md:5               |
| DEBT-3550 (Inefficient Equality Checking)                      | NEW         | DEBT-7003                       | Duplicate source_id: dec-2025-report:ARCHITECTURAL_REFACTOR.md:22                |
| DEBT-3551 (Massive Context Provider (God Object))              | VERIFIED    | DEBT-7004                       | Duplicate source_id: dec-2025-report:ARCHITECTURAL_REFACTOR.md:23                |
| DEBT-6603 (Avoid non-native interactive elements)              | VERIFIED    | DEBT-6604                       | Duplicate source_id: sonarcloud-paste:reliability:components/journal/entry-detai |
| DEBT-6605 (Avoid non-native interactive elements)              | VERIFIED    | DEBT-6606                       | Duplicate source_id: sonarcloud-paste:reliability:components/journal/entry-detai |
| DEBT-6607 (Avoid non-native interactive elements)              | VERIFIED    | DEBT-6608                       | Duplicate source_id: sonarcloud-paste:reliability:components/journal/entry-feed. |
| DEBT-6609 (Avoid non-native interactive elements)              | VERIFIED    | DEBT-6610                       | Duplicate source_id: sonarcloud-paste:reliability:components/journal/entry-feed. |
| DEBT-6615 (Avoid non-native interactive elements)              | VERIFIED    | DEBT-6616                       | Duplicate source_id: sonarcloud-paste:reliability:components/widgets/compact-mee |

### S4: DEBT-7xxx re-ingested duplicates

| Kept ID                                                         | Kept Status | Removed IDs | Reason                                                            |
| --------------------------------------------------------------- | ----------- | ----------- | ----------------------------------------------------------------- |
| DEBT-3522 (Pass limit to FirestoreService when it supports co)  | VERIFIED    | DEBT-7006   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3523 (Refactor to reduce cognitive complexity (currently)  | VERIFIED    | DEBT-7007   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3524 (Create a userIdHash → uid lookup collection for be)  | VERIFIED    | DEBT-7008   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3525 (Consider pre-computing cohort retention in a daily)  | VERIFIED    | DEBT-7009   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3532 (AI Model Comparison)                                 | VERIFIED    | DEBT-7013   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3533 (Add limit(50) to queries in lib/db/meetings.ts and)  | VERIFIED    | DEBT-7014   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3544 (Unsafe Non-Null Assertions)                          | VERIFIED    | DEBT-7025   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3545 (Client-Side Security Theater)                        | VERIFIED    | DEBT-7026   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3546 (Anonymous Auth Data Loss)                            | NEW         | DEBT-7027   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3548 (No Server-Side Rate Limiting)                        | VERIFIED    | DEBT-7029   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3550 (Inefficient Equality Checking)                       | NEW         | DEBT-7031   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3551 (Massive Context Provider (God Object))               | VERIFIED    | DEBT-7032   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3552 (Large God Component)                                 | VERIFIED    | DEBT-7033   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3557 (Refactor #5: Split AuthProvider (Optional - Breaki)  | VERIFIED    | DEBT-7038   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3610 (`CleanDaysCalculator.tsx` (Pure Logic))              | NEW         | DEBT-7088   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3611 (`BookAnimation.tsx` (Animation Logic))               | NEW         | DEBT-7089   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3612 (`BookAuthGuard.tsx` (Auth Logic))                    | NEW         | DEBT-7090   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3613 (`BookCover.tsx` (Simplified Composition))            | VERIFIED    | DEBT-7091   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3618 (Define `Result<T>` Type)                             | NEW         | DEBT-7096   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3619 (Standardize Service Methods)                         | VERIFIED    | DEBT-7097   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3620 (Update Component Usage)                              | NEW         | DEBT-7098   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3621 (Error Handling Strategy Document)                    | NEW         | DEBT-7099   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3644 (Update all components to use adapter)                | NEW         | DEBT-7122   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3649 (Context Proliferation Risk)                          | NEW         | DEBT-7127   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3650 (No Offline Support)                                  | VERIFIED    | DEBT-7128   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3653 (CQ-1: useEffect Dependency Array Issues 🔴 CRITICAL) | VERIFIED    | DEBT-7131   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3655 (CQ-3: Missing Null Checks 🔴 CRITICAL)               | NEW         | DEBT-7133   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3657 (CQ-5: Console Logging in Production 🟡 HIGH)         | VERIFIED    | DEBT-7135   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3658 (CQ-6: Unused Dependencies 🟢 MEDIUM)                 | VERIFIED    | DEBT-7136   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3659 (CQ-7: Missing Input Validation 🔴 CRITICAL)          | VERIFIED    | DEBT-7137   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3660 (CQ-8: No Loading States for Mutations 🟡 HIGH)       | VERIFIED    | DEBT-7138   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3662 (CQ-10: Excessive Font Loading ⚪ LOW)                | VERIFIED    | DEBT-7140   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3664 (B-1: Race Condition in Auto-Save 🔴 CRITICAL)        | VERIFIED    | DEBT-7142   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3665 (B-2: Listener Cleanup Memory Leak 🔴 CRITICAL)       | VERIFIED    | DEBT-7143   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3666 (B-3: Onboarding Wizard AnimatePresence Issue 🟡 HIG) | VERIFIED    | DEBT-7144   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3667 (B-4: Meeting Time Sort Failure 🟡 HIGH)              | VERIFIED    | DEBT-7145   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3668 (B-5: Anonymous Session Edge Case 🟢 MEDIUM)          | NEW         | DEBT-7146   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3670 (P-1: All Fonts Loaded on Initial Page Load 🔴 CRITI) | VERIFIED    | DEBT-7148   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3673 (P-4: localStorage Sync on Every Keystroke 🟢 MEDIUM) | VERIFIED    | DEBT-7151   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3675 (S-1: Client-Side Date ID Manipulation 🔴 CRITICAL)   | VERIFIED    | DEBT-7153   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3677 (S-3: Exposed Firebase Config 🟢 MEDIUM)              | VERIFIED    | DEBT-7155   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3678 (S-4: No XSS Protection on User Input 🟡 HIGH)        | VERIFIED    | DEBT-7156   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3681 (A-1: Missing ARIA Labels 🟢 MEDIUM)                  | NEW         | DEBT-7159   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3722 (Refactor lib/firebase.ts exports)                    | VERIFIED    | DEBT-7200   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3758 (Risk Factor B: Node.js 24 Runtime in Cloud Functio)  | VERIFIED    | DEBT-7236   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3761 (Prefix with \_index)                                 | NEW         | DEBT-7239   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3762 (Remove unused import)                                | NEW         | DEBT-7240   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3763 (Remove or export if used elsewhere)                  | VERIFIED    | DEBT-7241   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3764 (Use or remove)                                       | NEW         | DEBT-7242   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3765 (Use FormEvent<HTMLFormElement>)                      | NEW         | DEBT-7243   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3766 (Use unknown instead)                                 | NEW         | DEBT-7244   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3768 (Add to deps or use useCallback)                      | NEW         | DEBT-7246   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3770 (Category 1: Unused Variables (10 warnings))          | NEW         | DEBT-7248   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3771 (Category 2: Explicit `any` Types (18 warnings))      | NEW         | DEBT-7249   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3772 (Category 3: React Hooks Dependencies (1 warning))    | NEW         | DEBT-7250   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3781 (Fix Auto-Save Race Condition (B-1))                  | VERIFIED    | DEBT-7259   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3782 (Fix Listener Memory Leak (B-2))                      | VERIFIED    | DEBT-7260   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3783 (Standardize Date Handling (CQ-2))                    | VERIFIED    | DEBT-7261   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3784 (Remove @ts-ignore and Add Type Guards (CQ-3))        | VERIFIED    | DEBT-7262   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3785 (Add Input Validation with Zod (CQ-7))                | VERIFIED    | DEBT-7263   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3786 (Add Server-Side Date Validation (S-1))               | VERIFIED    | DEBT-7264   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3787 (Remove Unused Fonts (P-1))                           | VERIFIED    | DEBT-7265   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3788 (Fix Onboarding Animation (B-3))                      | VERIFIED    | DEBT-7266   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3789 (Environment-Aware Logging (CQ-5))                    | VERIFIED    | DEBT-7267   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3790 (Add Loading States (CQ-8))                           | VERIFIED    | DEBT-7268   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3791 (Optimize Real-Time Listeners (P-2))                  | VERIFIED    | DEBT-7269   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3792 (Implement Code Splitting (P-3))                      | VERIFIED    | DEBT-7270   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3794 (Fix useEffect Dependencies (CQ-1))                   | VERIFIED    | DEBT-7272   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3795 (Extract Magic Strings (CQ-4))                        | VERIFIED    | DEBT-7273   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3796 (Remove Unused Dependencies (CQ-6))                   | VERIFIED    | DEBT-7274   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3799 (Reduce Firebase Coupling (CQ-9))                     | VERIFIED    | DEBT-7277   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3802 (Files Changed: 6)                                    | VERIFIED    | DEBT-7280   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3808 (Enhanced Validation)                                 | NEW         | DEBT-7286   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3811 (Future Test Coverage)                                | NEW         | DEBT-7289   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3820 (Add tests for firebase-guards.ts utilities)          | NEW         | DEBT-7298   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3825 (Critical (Logic/Security))                           | VERIFIED    | DEBT-7303   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3829 (Simplify `FirestoreService` (Remove Manual DI))      | VERIFIED    | DEBT-7306   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3830 (Decouple `AuthProvider`)                             | VERIFIED    | DEBT-7307   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3853 (Summary of Protections)                              | NEW         | DEBT-7330   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |
| DEBT-3863 (Claude Fix Bundle format - docs/CLAUDE_FIX_BUNDLE)   | NEW         | DEBT-7340   | DEBT-7xxx unknown re-ingested duplicate of existing tracked entry |

## External References to Removed IDs

The following removed DEBT IDs appear in external files and may need updating:

**DEBT-7027** referenced in:

- `C:\Users\jason\Workspace\dev-projects\sonash-v0\docs\technical-debt\INDEX.md`
  line 122: `- **DEBT-7027**: Anonymous Auth Data Loss`

**DEBT-7131** referenced in:

- `C:\Users\jason\Workspace\dev-projects\sonash-v0\docs\technical-debt\INDEX.md`
  line 131:
  `- **DEBT-7131**: CQ-1: useEffect Dependency Array Issues 🔴 CRITICAL`

**DEBT-7133** referenced in:

- `C:\Users\jason\Workspace\dev-projects\sonash-v0\docs\technical-debt\INDEX.md`
  line 135: `- **DEBT-7133**: CQ-3: Missing Null Checks 🔴 CRITICAL`

**DEBT-7137** referenced in:

- `C:\Users\jason\Workspace\dev-projects\sonash-v0\docs\technical-debt\INDEX.md`
  line 139:
  `- **DEBT-7137**: CQ-7: Missing Input Validation 🔴 CRITICAL (lib/db/users.ts:0)`

**DEBT-7142** referenced in:

- `C:\Users\jason\Workspace\dev-projects\sonash-v0\docs\technical-debt\INDEX.md`
  line 141: `- **DEBT-7142**: B-1: Race Condition in Auto-Save 🔴 CRITICAL`

**DEBT-7143** referenced in:

- `C:\Users\jason\Workspace\dev-projects\sonash-v0\docs\technical-debt\INDEX.md`
  line 145: `- **DEBT-7143**: B-2: Listener Cleanup Memory Leak 🔴 CRITICAL`

## Notes on Non-Removed "Apparent" Duplicates

The following patterns were detected but intentionally NOT deduplicated:

1. **Same SonarCloud rule, different files**: Entries sharing a title like
   "Refactor this function to reduce cognitive complexity from X to 15" but
   pointing to different files are distinct violations, not duplicates.
2. **Same SonarCloud rule, different lines in same file**: Multiple violations
   of the same rule within one file (e.g., `parseInt` without radix on lines 45
   and 223) are separate issues.
3. **RESOLVED vs NEW/VERIFIED**: Where one entry is RESOLVED and another tracks
   the same issue as open, both were kept to preserve lifecycle history.
4. **DEBT-7xxx with unique title+file combos**: 289 DEBT-7xxx entries
   (source_id=unknown) had no matching title+file in existing entries and were
   kept as potentially valid unique issues.
