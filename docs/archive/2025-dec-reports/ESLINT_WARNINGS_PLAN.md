# ESLint Warnings Remediation Plan

**Date:** 2025-12-12 **Current Status:** 0 errors, 29 warnings **Target:** 0
errors, 0 warnings (or explicitly suppressed with justification)

---

## Executive Summary

After fixing the critical React Compiler error and setState-in-effect issue, we
now have **29 ESLint warnings** that need to be addressed systematically. This
plan categorizes them by type and provides a remediation strategy.

---

## Warning Breakdown by Category

### Category 1: Unused Variables (10 warnings)

**Rule:** `@typescript-eslint/no-unused-vars`

| File                               | Line | Variable            | Action                             |
| ---------------------------------- | ---- | ------------------- | ---------------------------------- |
| `tab-navigation.tsx`               | 21   | `index`             | Prefix with `_index`               |
| `firestore-adapter.ts`             | 11   | `IDatabase`         | Remove unused import               |
| `lib/db/meetings.ts`               | 2    | `setDoc`            | Remove unused import               |
| `lib/db/meetings.ts`               | 2    | `orderBy`           | Remove unused import               |
| `lib/db/users.ts`                  | 55   | `UserProfileSchema` | Remove or export if used elsewhere |
| `scripts/seed-meetings.ts`         | 68   | `matches`           | Use or remove                      |
| `scripts/seed-meetings.ts`         | 71   | `parts`             | Use or remove                      |
| `tests/utils/logger.test.ts`       | 1    | `mock`              | Remove unused import               |
| `tests/utils/rate-limiter.test.ts` | 3    | `RateLimitConfig`   | Remove unused import               |

**Effort:** 30 minutes **Priority:** P2 (Medium - code cleanliness)

---

### Category 2: Explicit `any` Types (18 warnings)

**Rule:** `@typescript-eslint/no-explicit-any`

| File                        | Count | Context              | Action                           |
| --------------------------- | ----- | -------------------- | -------------------------------- |
| `sign-in-modal.tsx`         | 2     | Form event handlers  | Use `FormEvent<HTMLFormElement>` |
| `firebase-types.ts`         | 1     | Type guard parameter | Use `unknown` instead            |
| `auth-provider.test.ts`     | 5     | Test mocks           | Use proper mock types            |
| `firestore-service.test.ts` | 11    | Test mocks           | Use proper mock types            |

**Test File Strategy:** For test files, we have two options:

1. **Option A (Strict):** Define proper mock types for all Firebase interfaces
2. **Option B (Pragmatic):** Suppress warnings in test files with ESLint comment
   ```typescript
   /* eslint-disable @typescript-eslint/no-explicit-any */
   ```

**Recommendation:** Option B for test files (acceptable technical debt), Option
A for application code

**Effort:**

- Application code: 1 hour
- Test mocks (if doing Option A): 4 hours

**Priority:**

- Application code: P1 (High - affects type safety)
- Test files: P3 (Low - acceptable in tests)

---

### Category 3: React Hooks Dependencies (1 warning)

**Rule:** `react-hooks/exhaustive-deps`

| File             | Line | Issue                             | Action                           |
| ---------------- | ---- | --------------------------------- | -------------------------------- |
| `today-page.tsx` | 115  | Missing `journalEntry` dependency | Add to deps or use `useCallback` |

**Effort:** 15 minutes **Priority:** P1 (High - can cause stale closures)

---

## Remediation Strategy

### Phase 1: Quick Wins (30 minutes)

**Target:** Fix 10 unused variable warnings

```bash
# Remove unused imports/variables
- tab-navigation.tsx: Prefix index with _
- firestore-adapter.ts: Remove IDatabase import
- lib/db/meetings.ts: Remove setDoc, orderBy imports
- lib/db/users.ts: Remove UserProfileSchema or export
- scripts/seed-meetings.ts: Remove matches, parts
- tests: Remove mock, RateLimitConfig imports
```

### Phase 2: Application Code `any` Types (1 hour)

**Target:** Fix 3 warnings in application code

**File: `sign-in-modal.tsx`** (2 warnings)

```typescript
// BEFORE
const handleSubmit = (e: any) => {
  e.preventDefault();
};

// AFTER
import { FormEvent } from "react";

const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};
```

**File: `firebase-types.ts`** (1 warning)

```typescript
// BEFORE
export function toDate(value: any): Date | null {

// AFTER
export function toDate(value: unknown): Date | null {
```

### Phase 3: React Hooks Dependency (15 minutes)

**Target:** Fix 1 exhaustive-deps warning

**File: `today-page.tsx`** (line 115)

```typescript
// BEFORE
useEffect(() => {
  // Uses journalEntry
}, []); // Missing journalEntry

// AFTER
useEffect(() => {
  // Uses journalEntry
}, [journalEntry]); // Add dependency
```

### Phase 4: Test Files `any` Types (Optional - 4 hours OR 5 minutes)

**Target:** Fix 15 warnings in test files

**Option A: Proper Types (4 hours)** Create mock type definitions for all
Firebase interfaces

**Option B: Suppress (5 minutes - RECOMMENDED)** Add to top of each test file:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
```

**Justification for Option B:**

- Test files are not production code
- Mock typing is tedious and low value
- Tests still verify behavior correctly
- Can revisit if tests become hard to maintain

---

## Implementation Timeline

### Week 1 (This Week)

- [x] Fix critical error (book-cover.tsx useMemo) - DONE
- [x] Fix setState-in-effect (history page) - DONE
- [ ] Phase 1: Fix unused variables (30 min)
- [ ] Phase 2: Fix application `any` types (1 hour)
- [ ] Phase 3: Fix React hooks dependency (15 min)

**Total Effort:** ~2 hours **Result:** 0 errors, 0 warnings (or 15 if we
suppress test files)

### Week 2 (Optional)

- [ ] Phase 4 (Option A): Properly type all test mocks (if desired)

---

## ESLint Configuration Improvements

### Recommendation 1: Stricter Rules for Application Code

Update `eslint.config.mjs`:

```javascript
export default [
  // Existing config...
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["**/*.test.ts", "**/*.test.tsx"], // Exclude tests
    rules: {
      "@typescript-eslint/no-explicit-any": "error", // Change from 'warn' to 'error'
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"], // Test files
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Allow any in tests
    },
  },
];
```

### Recommendation 2: Pre-commit Hook

Add lint to pre-commit hook:

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run type-check"
    }
  }
}
```

### Recommendation 3: CI Enforcement

Update `.github/workflows/ci.yml`:

```yaml
- name: Lint
  run: npm run lint -- --max-warnings 0 # Fail on any warnings
```

---

## Success Metrics

### Before

- Errors: 1 (React Compiler)
- Warnings: 31
- Status: ❌ Lint failing

### After Phase 1-3 (Application Code)

- Errors: 0 ✅
- Warnings: 15 (test files only)
- Status: ✅ Lint passing

### After Phase 4 (All Code)

- Errors: 0 ✅
- Warnings: 0 ✅
- Status: ✅ Perfect lint score

---

## Long-Term Maintenance

### Prevent Future Warnings

1. **Enable ESLint in IDE**
   - VSCode: Install ESLint extension
   - Configure auto-fix on save

2. **Add to Code Review Checklist**
   - ✅ No new ESLint warnings introduced
   - ✅ All variables used or prefixed with `_`
   - ✅ No `any` types in application code

3. **Monthly Cleanup**
   - Review and fix any accumulated warnings
   - Update this plan with new patterns

---

## Decision Log

| Date       | Decision                                            | Rationale                                  |
| ---------- | --------------------------------------------------- | ------------------------------------------ |
| 2025-12-12 | Allow `any` in test files                           | Pragmatic trade-off, tests verify behavior |
| 2025-12-12 | Change `profile?.cleanStart` → `profile` in useMemo | React Compiler requirement                 |
| 2025-12-12 | Restructure history page effect                     | Avoid setState in effect body              |

---

## Appendix: Full Warning List

```
/home/user/sonash-v0/components/auth/sign-in-modal.tsx
  29:23  warning  Unexpected any. Specify a different type
  48:23  warning  Unexpected any. Specify a different type

/home/user/sonash-v0/components/notebook/pages/today-page.tsx
  115:6  warning  React Hook useEffect has a missing dependency: 'journalEntry'

/home/user/sonash-v0/components/notebook/tab-navigation.tsx
  21:23  warning  'index' is defined but never used

/home/user/sonash-v0/lib/database/firestore-adapter.ts
  11:3  warning  'IDatabase' is defined but never used

/home/user/sonash-v0/lib/db/meetings.ts
  2:50  warning  'setDoc' is defined but never used
  2:58  warning  'orderBy' is defined but never used

/home/user/sonash-v0/lib/db/users.ts
  55:7  warning  'UserProfileSchema' is assigned a value but never used

/home/user/sonash-v0/lib/types/firebase-types.ts
  23:22  warning  Unexpected any. Specify a different type

/home/user/sonash-v0/scripts/seed-meetings.ts
  68:15  warning  'matches' is assigned a value but never used
  71:15  warning  'parts' is assigned a value but never used

/home/user/sonash-v0/tests/auth-provider.test.ts
  16:15  warning  Unexpected any. Specify a different type [5x]

/home/user/sonash-v0/tests/firestore-service.test.ts
  17:18  warning  Unexpected any. Specify a different type [11x]

/home/user/sonash-v0/tests/utils/logger.test.ts
  1:24  warning  'mock' is defined but never used

/home/user/sonash-v0/tests/utils/rate-limiter.test.ts
  3:28  warning  'RateLimitConfig' is defined but never used
```

---

## Next Steps

1. **Review and approve this plan**
2. **Execute Phase 1-3 this week** (2 hours total)
3. **Decide on Phase 4** (suppress test warnings OR properly type mocks)
4. **Update ESLint config** for stricter rules
5. **Add to M1 roadmap** if desired

---

**Owner:** Engineering Team **Review Cycle:** After each phase **Last Updated:**
2025-12-12
