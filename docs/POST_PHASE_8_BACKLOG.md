# Post-Phase-8 Backlog

**Purpose**: Track nice-to-have improvements, tech debt, and polish work to be done AFTER completing all 8 phases of the refactoring plan.

**Status**: Items here are NOT blockers for the 8-phase plan
**Priority**: All items are P3-P4 (nice-to-have)
**Last Updated**: 2025-12-30

---

## 📋 How to Use This Backlog

### Adding Items

When you identify follow-up work during any phase that is:
- ✅ Out of scope for current phase
- ✅ Not blocking any other phase
- ✅ Nice-to-have improvement (not critical)
- ✅ Low-medium effort (< 4 hours)

Add it here with this format:

```markdown
### [Category] Item Name (Effort estimate)

**Source**: Phase/PR where discovered
**Why deferred**: Brief explanation
**Value**: What this improves
**Risk if skipped**: What happens if we never do this

**Files affected**:
- file1.ts
- file2.tsx

**Implementation notes**:
- Step 1: ...
- Step 2: ...
```

### Prioritizing

After Phase 8 complete, review this backlog and:
1. Group by category (Security, Performance, UX, Code Quality)
2. Assess ROI (value / effort)
3. Pick top 3-5 items
4. Create mini-PRs for each

---

## 🗂️ Backlog Categories

- **Code Quality** - Refactoring, cleanup, consistency
- **Type Safety** - Stricter types, remove any/unknown
- **Test Coverage** - Additional tests beyond PR7
- **Performance** - Optimizations
- **UX Polish** - Small UX improvements
- **Documentation** - Code comments, guides

---

## 📝 Backlog Items

### [Code Quality] Retrofit SSR-Safe localStorage (1-2 hours)

**Source**: Phase 3 (PR3) - Error guards and SSR safety
**Added**: 2025-12-30
**Priority**: P3 (Nice to have)

**Why deferred**:
- Existing code works fine (client-only components)
- Not causing SSR crashes
- Canonical surface locked (new code will use utilities)
- Defensive improvement, not fixing a bug

**Value**:
- Consistent use of SSR-safe utilities across codebase
- Future-proofs against accidental SSR rendering
- Removes 11 direct `localStorage` calls

**Risk if skipped**:
- Low - existing code won't break
- If components become server-rendered in future, could cause SSR crashes
- New developers might copy old pattern instead of using utilities

**Files affected**:
- `components/notebook/hooks/use-smart-prompts.ts` (4 usages)
- `components/notebook/pages/today-page.tsx` (5 usages)
- `lib/utils/anonymous-backup.ts` (2 usages)

**Implementation notes**:
1. Replace `localStorage.getItem()` with `getLocalStorage()` from `lib/utils/storage.ts`
2. Replace `localStorage.setItem()` with `setLocalStorage()`
3. Replace `localStorage.removeItem()` with `removeLocalStorage()`
4. For JSON operations, use `getLocalStorageJSON<T>()` and `setLocalStorageJSON<T>()`
5. Update imports: `import { getLocalStorage, setLocalStorage, ... } from '@/lib/utils/storage'`
6. Test each file individually (no regressions expected)

**Acceptance criteria**:
- `grep -r "localStorage\." components/notebook/ lib/utils/anonymous-backup.ts` → 0 results
- All existing functionality works (smart prompts, journal temp save, anonymous backup)
- No new TypeScript errors

**Estimated effort**: 1-2 hours

---

## 📊 Backlog Statistics

**Total items**: 1
**By category**:
- Code Quality: 1
- Type Safety: 0
- Test Coverage: 0
- Performance: 0
- UX Polish: 0
- Documentation: 0

**By effort**:
- < 1 hour: 0
- 1-2 hours: 1
- 2-4 hours: 0
- > 4 hours: 0

**Total estimated effort**: 1-2 hours

---

## ✅ Completed Items (Moved from Backlog)

(None yet - this backlog is for post-Phase-8 work)

---

## 🚫 Rejected Items (Won't Do)

### [Type Safety] Strengthen Index Signature Types (1-2 hours)

**Why rejected**:
- Index signatures are appropriate for Firestore dynamic data
- Not a bug or vulnerability
- Would add complexity without value
- Firestore documents have flexible schemas
- Marked as "VERIFIED - Acceptable" in Phase 3 review

**Decision**: Won't fix - this is not a problem

---

**Document Version**: 1.0
**Related**: EIGHT_PHASE_REFACTOR_PLAN.md, PR_WORKFLOW_CHECKLIST.md
