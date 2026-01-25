# Comprehensive Refactoring Audit Report

**Date:** 2026-01-24 **Project:** SoNash Recovery Notebook (v0) **Scope:** Full
codebase (components, lib, functions, app) **Severity Scale:** S0 (Critical) →
S1 (High) → S2 (Medium) → S3 (Low) **Effort Scale:** E0 (Trivial) → E1 (Small) →
E2 (Medium) → E3 (Large)

---

## Executive Summary

The SoNash codebase demonstrates solid architectural fundamentals with clear
separation of concerns and good security practices. However, several refactoring
opportunities exist to reduce maintenance burden, improve code reusability, and
enable future feature development. The primary issues are:

1. **DRY Violations**: Duplicated error handling and form patterns
2. **Large Files**: Component bloat in complex pages (notebook-page, today-page)
3. **Code Duplication**: Similar form structures (daily-log-form, mood-form,
   etc.)
4. **Cognitive Complexity**: Nested ternaries and complex conditionals in
   rendering logic
5. **Missing Abstractions**: Repeated patterns for CRUD operations and data
   fetching
6. **Inconsistent Error Handling**: Multiple error handler implementations
7. **Hook Organization**: Some hooks could be extracted from components to
   improve testability

---

## 1. Technical Debt Identification

### 1.1 Error Handling Duplication [S1, E1]

**Location:** Multiple files

- `lib/firestore-service.ts` (Lines 40-90): `handleCloudFunctionCallError()`
- `lib/utils/callable-errors.ts` (Lines 145+): `getCloudFunctionErrorMessage()`
- `components/admin/admin-crud-table.tsx` (Line ~70): Error logging pattern

**Issue:** Error handling logic is duplicated across the codebase. Three
different error handlers perform similar tasks with slight variations:

- Extract user-friendly messages
- Log errors with context
- Determine error severity

**Impact:**

- Inconsistent error messages shown to users
- Difficult to update error handling globally
- Code duplication violates DRY principle (CANON-0006)

**Recommended Refactoring:** Create a unified error handler that consolidates
all error handling logic.

```typescript
// lib/utils/error-handler.ts
export function handleError(
  error: unknown,
  context: { operation: string; userId?: string }
) {
  // Single source of truth for all error handling
  logError(error, context);
  const userMessage = getUserFriendlyMessage(error, context.operation);
  return { success: false, error: userMessage };
}
```

**Effort:** E1 (2-3 hours) | **Impact:** High - Simplifies future changes

---

### 1.2 Form Handling Duplication [S2, E2]

**Location:** `components/journal/entry-forms/`

- `daily-log-form.tsx` (Lines 1-150+)
- `mood-form.tsx` (Lines 1-150+)
- `gratitude-form.tsx` (not examined, likely similar)
- `inventory-form.tsx` (not examined, likely similar)

**Issue:** All form components follow identical patterns:

1. State initialization for form fields
2. Validation before submission
3. `useJournal().addEntry()` call
4. Error handling with `logger.error()` and toast
5. Loading state management
6. Motion animations (identical setup)

**Code Similarity Score:** ~85% (excluding entry type)

**Example Duplication:**

```typescript
// Both daily-log-form.tsx and mood-form.tsx
const [isSubmitting, setIsSubmitting] = React.useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validation) {
    toast.error("message");
    return;
  }
  try {
    setIsSubmitting(true);
    await addEntry(entryType, data);
    onSuccess();
    onClose();
  } catch (error) {
    logger.error(`Failed to save ${entryType}`, { error });
    toast.error("User friendly message");
  } finally {
    setIsSubmitting(false);
  }
};
```

**Recommended Refactoring:** Extract a reusable form component factory or hook
that abstracts the common pattern.

```typescript
// lib/hooks/use-form-submission.ts
export function useFormSubmission<T>(
  onSubmit: (data: T) => Promise<void>,
  onSuccess: () => void
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: T) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      onSuccess();
    } catch (error) {
      // Unified error handling
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit, isSubmitting };
}
```

**Effort:** E2 (4-6 hours) | **Impact:** High - Reduces maintenance burden for
forms

---

### 1.3 CRUD Pattern Duplication [S1, E2]

**Location:** `components/admin/`

- `admin-crud-table.tsx` (Generic CRUD UI)
- Multiple tab components (glossary-tab, quotes-tab, etc.) with similar patterns

**Issue:** The admin tabs follow repetitive patterns:

1. Create service adapter with getAll/add/update/delete methods
2. Define CRUD config with columns, form, validation
3. Pass to AdminCrudTable component

While this is better than complete duplication, there's opportunity to reduce
the boilerplate further.

**Recommended Refactoring:** Create a factory function that reduces config
boilerplate:

```typescript
// lib/admin/crud-factory.ts
export function createAdminCrudConfig<T extends BaseEntity>(
  entityName: string,
  service: CrudService<T>,
  fields: { key: keyof T; label: string; render?: (item: T) => JSX.Element }[]
): AdminCrudConfig<T> {
  return {
    entityName,
    entityNamePlural: pluralize(entityName),
    service,
    columns: fields.map((f) => ({ ...f })),
    // Auto-generate form from fields
  };
}
```

**Effort:** E2 (3-5 hours) | **Impact:** Medium - Reduces config boilerplate

---

## 2. Code Complexity Hotspots

### 2.1 Cognitive Complexity in Today Page [S1, E2]

**Location:** `components/notebook/pages/today-page.tsx`

**Issue:** The component has high cognitive complexity due to:

1. Multiple nested state variables (mood, cravings, used, note, etc.)
2. Complex conditional rendering with nested ternaries
3. Multiple helper functions (`formatDurationPart`, `calculateCleanTimeParts`)
4. Large render output (likely 500+ lines)

**Specific Problem Areas:**

- Lines 50-85: ToggleButton component contains nested ternaries for style
  selection
- Lines 150+: Check-in question rendering with complex conditional styling
- Multiple conditional renders based on state combinations

**Example Complexity Issue:**

```typescript
// Nested ternary (SonarQube S3358)
const selectedStyle = getSelectedStyle(); // Better extracted to helper
const usedYesStyle = label === "Yes used" && isSelected ? "..." : selectedStyle;
```

**Recommended Refactoring:**

1. Extract ToggleButton styling to a separate utility
2. Create sub-components for major sections (CleanTimeDisplay, CheckInQuestions)
3. Extract conditional logic to helper functions

```typescript
// lib/utils/button-styles.ts
export function getToggleButtonStyle(
  isSelected: boolean,
  isYes: boolean,
  label: string
): string {
  if (label === "Yes used") {
    return getUsedYesStyle(isSelected);
  }
  return getStandardToggleStyle(isSelected, isYes);
}
```

**Effort:** E2 (4-6 hours) | **Impact:** Medium - Improves testability and
readability

---

### 2.2 Complex Entry Card Rendering [S2, E2]

**Location:** `components/journal/entry-card.tsx`

**Issue:** The EntryCard component handles rendering for 8+ different entry
types, each with unique styling and layout:

- mood, gratitude, free-write, meeting-note, inventory, spot-check,
  night-review, daily-log, step-1-worksheet

**Pattern:** Large lookup tables for styling and conditional rendering:

```typescript
const ENTRY_STYLES: Record<string, string> = {
  mood: "...",
  gratitude: "...",
  // ... 7 more entries
};
```

**Problem:**

- Hard to add new entry types (must modify lookup tables)
- Styling spread across multiple places
- Rendering logic varies significantly per type

**Recommended Refactoring:** Create entry type-specific components:

```typescript
// components/journal/entries/
// - MoodEntryCard.tsx
// - GratitudeEntryCard.tsx
// - etc.

// components/journal/entry-card.tsx (refactored)
export function EntryCard({ entry, index, onClick }: EntryCardProps) {
  const Component = ENTRY_COMPONENT_MAP[entry.type];
  return <Component entry={entry} index={index} onClick={onClick} />;
}
```

**Effort:** E3 (8-12 hours) | **Impact:** High - Enables easier feature addition
and type safety

---

### 2.3 AdminCrudTable Complexity [S2, E1]

**Location:** `components/admin/admin-crud-table.tsx`

**Issue:** Single component handles:

- Data fetching with optional service or direct Firestore
- Search/filtering with multiple filters
- Modal state for add/edit operations
- Delete confirmation
- Form rendering
- Pagination (implicit)

**Line Count:** Likely 300+ lines of logic in single component

**Recommended Refactoring:** Split into smaller, focused components:

```typescript
// components/admin/admin-crud-table.tsx (simplified)
// Orchestrator component that composes sub-components

// components/admin/admin-crud-table-toolbar.tsx
// Search and filter UI

// components/admin/admin-crud-form-modal.tsx
// Add/edit modal logic

// components/admin/admin-crud-data-fetcher.ts
// Data loading and caching
```

**Effort:** E2 (4-6 hours) | **Impact:** High - Improves testability

---

## 3. DRY Violations (Duplicated Code)

### 3.1 Rate Limiter Duplication [S2, E1]

**Location:**

- `lib/utils/rate-limiter.ts` (Client-side)
- `functions/src/firestore-rate-limiter.ts` (Server-side)

**Issue:** Similar rate limiting logic implemented in both client and server,
but independently:

- Client uses in-memory sliding window
- Server uses Firestore-backed rate limiter

**Risk:**

- Inconsistency between client and server thresholds
- Client limiter can be bypassed by advanced users

**Note:** This is actually good security practice (server is source of truth),
but the configuration should be synchronized.

**Recommended Refactoring:** Create shared constants for rate limiting config:

```typescript
// lib/constants.ts
export const RATE_LIMIT_CONFIG = {
  SAVE_DAILY_LOG: { MAX_CALLS: 10, WINDOW_MS: 60000 },
  // ... shared between client and server
};
```

**Effort:** E1 (1-2 hours) | **Impact:** Medium - Reduces configuration drift

---

### 3.2 Type Definitions Duplication [S2, E1]

**Location:**

- `types/journal.ts` - Client-side types
- `functions/src/schemas.ts` - Server-side Zod schemas

**Issue:** Journal entry types are defined twice:

- TypeScript interfaces on client
- Zod schemas on server
- No single source of truth

**Impact:**

- Type divergence between client and server
- Changes require updates in two places
- No generated types for type safety

**Recommended Refactoring:** Use Zod as single source of truth and generate
TypeScript types:

```typescript
// lib/schemas/journal.ts (shared)
export const DailyLogSchema = z.object({
  content: z.string(),
  mood: z.string().nullable(),
  // ...
});

export type DailyLog = z.infer<typeof DailyLogSchema>;
```

**Effort:** E2 (3-4 hours) | **Impact:** High - Improves type safety

---

### 3.3 Logger Configuration [S3, E0]

**Location:**

- `lib/logger.ts` - Main logger
- `functions/src/security-logger.ts` - Firestore security logging

**Issue:** Two separate logging implementations with different purposes but
overlapping concerns.

**Recommended Refactoring:** Consider unifying for consistency (optional - may
not be worth effort):

```typescript
// lib/logger.ts
export const logger = createLogger({
  client: true,
  secure: true,
  maskIdentifiers: true,
});
```

**Effort:** E0 (Not recommended) | **Impact:** Low

---

## 4. Large Files Needing Splits

### 4.1 firestore-service.ts [S2, E2]

**Location:** `lib/firestore-service.ts`

**Current Line Count:** 400+ lines (estimated from samples)

**Contents:**

- Daily log operations (save, get, history)
- Inventory entry operations
- Notebook journal entries (deprecated)
- Error handling function
- Dependencies injection type definition

**Issue:** Single "god service" file with multiple responsibilities:

- Daily logs management
- Inventory management
- Journal entries management (deprecated)

**Recommended Refactoring:** Split into focused service modules:

```typescript
// lib/services/daily-log.service.ts
export const DailyLogService = createDailyLogService();

// lib/services/inventory.service.ts
export const InventoryService = createInventoryService();

// lib/services/index.ts
export { DailyLogService, InventoryService };
```

**Effort:** E2 (4-6 hours) | **Impact:** High - Improves maintainability and
testing

---

### 4.2 TodayPage Component [S2, E3]

**Location:** `components/notebook/pages/today-page.tsx`

**Current Line Count:** 500+ lines (estimated)

**Contents:**

- Clean time calculation and display
- Mood tracking UI
- Check-in questions (cravings/used)
- Quote display widget
- Meeting countdown widget
- Quick actions FAB

**Issue:** Single mega-component handling multiple domains of functionality

**Recommended Refactoring:** Extract domain-specific sections into
sub-components:

```typescript
// components/notebook/sections/
// - clean-time-section.tsx
// - check-in-section.tsx
// - widgets-section.tsx

// components/notebook/pages/today-page.tsx (refactored)
export function TodayPage({ nickname, onNavigate }: TodayPageProps) {
  return (
    <div className="space-y-6">
      <CleanTimeSection startDate={startDate} />
      <CheckInSection onSave={onRefresh} />
      <WidgetsSection onNavigate={onNavigate} />
    </div>
  );
}
```

**Effort:** E3 (8-12 hours) | **Impact:** High - Enables testing and reusability

---

### 4.3 Admin CRUD Table [S2, E2]

**Location:** `components/admin/admin-crud-table.tsx`

**Current Line Count:** 300+ lines

**Contents:**

- Data fetching logic
- Search/filter state and logic
- Add/edit modal state
- Delete confirmation state
- Form rendering
- Table rendering with pagination

**Issue:** Too many responsibilities in single component

**Recommended Refactoring:** Already mentioned in section 2.3 above.

---

## 5. Coupling and Cohesion Issues

### 5.1 FirestoreService Over-Coupling [S2, E2]

**Location:** `lib/firestore-service.ts`

**Issue:** Service is tightly coupled to:

- `firebase/functions` (imports dynamically)
- `recaptcha.ts` (direct import)
- `logger.ts` (direct import)
- Firestore SDK directly

**Impact:**

- Hard to test (requires mocking multiple dependencies)
- Hard to swap Firebase with alternative backend
- Dynamic imports make static analysis difficult

**Recommended Refactoring:** Use dependency injection more consistently:

```typescript
export interface FirestoreDependencies {
  db: Database;
  getRecaptchaToken: (action: string) => Promise<string>;
  logger: Logger;
  // ... rest of deps
}

export function createFirestoreService(deps: FirestoreDependencies) {
  // Service implementation uses injected deps
}
```

**Note:** Already partially implemented - could be extended further.

**Effort:** E1 (2-3 hours) | **Impact:** Medium - Improves testability

---

### 5.2 Component-Context Coupling [S2, E1]

**Location:** Multiple components and `components/providers/`

**Issue:** Components directly import and use contexts:

```typescript
const { activeTab, setActiveTab } = useAdminTabContext();
const { todayLog, refreshTodayLog } = useDailyLog();
```

**Problem:**

- Components not reusable outside this context
- Hard to test components in isolation
- Context changes require cascading component updates

**Recommended Refactoring:** Props-based approach for reusability:

```typescript
interface AdminTabsProps {
  activeTab: AdminTabId;
  onTabChange: (tabId: AdminTabId) => void;
}

export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  // Component is now context-agnostic
}
```

**Effort:** E1 (2-3 hours, per component) | **Impact:** Medium - Improves
reusability

---

## 6. Deprecated Patterns and APIs

### 6.1 Deprecated Function: saveNotebookJournalEntry [S1, E1]

**Location:** `lib/firestore-service.ts` (Lines ~280-330)

**Status:** MARKED DEPRECATED - Routes through Cloud Function

**Issue:** Comment indicates: "DEPRECATED: Use hooks/use-journal.ts:addEntry
instead"

**Current Usage:**

- Still exported and potentially used
- Creates confusion about correct API to use

**Recommended Refactoring:**

1. Complete migration to `useJournal.addEntry`
2. Search codebase for all usages of `saveNotebookJournalEntry`
3. Replace with `addEntry` from `useJournal` hook
4. Remove deprecated function after confirming no usage

**Effort:** E1 (1-2 hours) | **Impact:** Low - Reduces confusion

**Action Items:**

```bash
# Find all usages
grep -r "saveNotebookJournalEntry" --include="*.ts" --include="*.tsx"

# Verify no usage exists
# Then remove from firestore-service.ts
```

---

### 6.2 Inconsistent Error Handling Patterns [S2, E1]

**Location:** Multiple files

**Issue:** Different error logging patterns used throughout:

```typescript
// Pattern 1: Direct logger.error with error object
logger.error("Failed to save daily log", { error });

// Pattern 2: Error with error type only (CANON-0076)
logger.error(`Error fetching items`, {
  errorType: error instanceof Error ? error.constructor.name : typeof error,
});

// Pattern 3: Cloud function errors
handleCloudFunctionCallError(error, userId, logger, {...});
```

**Recommended Refactoring:** Standardize on CANON-0076 pattern throughout:

- Never log raw error objects
- Always extract error type/code
- Mask sensitive information

**Effort:** E1 (2-3 hours to audit and fix) | **Impact:** Medium -
Security/consistency

---

## 7. Opportunities for Abstraction

### 7.1 Form Pattern Abstraction [S2, E2]

**Mentioned above in Section 1.2**

**Recommended Abstraction:** Create reusable form component factory:

```typescript
// lib/components/form-factory.tsx
export function createFormComponent<T>(config: FormConfig<T>) {
  return function FormComponent({ onClose, onSuccess }: FormProps) {
    const { handleSubmit, isSubmitting } = useFormSubmission(
      async (data) => config.onSubmit(data),
      onSuccess
    );

    return (
      <motion.div {...config.animationProps}>
        <form onSubmit={handleSubmit}>
          {/* Form fields from config */}
        </form>
      </motion.div>
    );
  };
}
```

**Effort:** E2 (4-6 hours) | **Impact:** High

---

### 7.2 Entry Type Handler Abstraction [S2, E2]

**Mentioned above in Section 2.2**

**Recommended Abstraction:** Create entry type handler registry:

```typescript
// lib/entry-types/registry.ts
export interface EntryTypeHandler<T extends JournalEntry = JournalEntry> {
  component: React.ComponentType<EntryCardProps>;
  icon: React.ComponentType;
  color: string;
  schema: ZodSchema<T['data']>;
}

export const ENTRY_TYPE_REGISTRY: Record<JournalEntryType, EntryTypeHandler> = {
  mood: { component: MoodEntryCard, ... },
  gratitude: { component: GratitudeEntryCard, ... },
  // ...
};
```

**Effort:** E2 (3-4 hours) | **Impact:** High - Enables feature additions

---

### 7.3 Data Fetching Abstraction [S2, E2]

**Issue:** Scattered data fetching patterns:

- FirestoreService methods
- AdminCrudTable fetching
- Individual component fetching

**Recommended Abstraction:** Create unified data fetching hooks:

```typescript
// lib/hooks/use-firestore-query.ts
export function useFirestoreQuery<T>(
  query: () => Promise<T>,
  options?: UseQueryOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Standard query pattern
  }, []);

  return { data, loading, error, refetch };
}
```

**Effort:** E2 (3-4 hours) | **Impact:** Medium - Improves consistency

---

## 8. Missing Test Coverage

### 8.1 Test Coverage Assessment [S1, E3]

**Current State:**

- Tests exist in `/tests/` directory
- Coverage configuration: `tsconfig.test.json`
- Coverage tool: `c8` (npm run test:coverage)

**Gap Analysis:**

**Not Covered:**

1. Error handling utilities (`lib/utils/errors.ts`)
2. Entry search matchers (entry-feed.tsx)
3. CRUD operation handlers (admin-crud-table.tsx)
4. Rate limiter logic
5. Cloud Function error handlers
6. Form validation logic

**Recommended Test Implementation:**

```typescript
// tests/lib/utils/errors.test.ts
describe("Error handling utilities", () => {
  describe("isFirebaseError", () => {
    it("should identify Firebase errors correctly", () => {
      // Test implementation
    });
  });
});

// tests/components/journal/entry-feed.test.ts
describe("Entry feed search matchers", () => {
  it("should match mood entries correctly", () => {
    // Test implementation
  });
});
```

**Effort:** E3 (12-16 hours total) | **Impact:** High - Prevents regressions

---

## 9. Performance Optimization Opportunities

### 9.1 Component Memoization [S3, E1]

**Location:** Multiple form components

**Issue:** Form components like `DailyLogForm` and `MoodForm` may re-render
unnecessarily when parent updates.

**Recommended Fix:**

```typescript
export const DailyLogForm = React.memo(function DailyLogForm({
  onClose,
  onSuccess,
}: DailyLogFormProps) {
  // Component implementation
});
```

**Effort:** E1 (1-2 hours) | **Impact:** Low

---

### 9.2 useMemo for Derived State [S3, E1]

**Location:** `components/notebook/pages/today-page.tsx`

**Issue:** `calculateCleanTimeParts` is called every render without memoization

**Recommended Fix:**

```typescript
const cleanTimeParts = useMemo(
  () => calculateCleanTimeParts(startDate),
  [startDate]
);
```

**Effort:** E1 (1 hour) | **Impact:** Low

---

### 9.3 Search Matcher Optimization [S3, E1]

**Location:** `components/journal/entry-feed.tsx`

**Issue:** Search matchers recreated every render in `SEARCH_MATCHERS` object

**Recommended Fix:**

```typescript
const SEARCH_MATCHERS = useMemo(
  () => ({
    mood: matchMoodEntry,
    // ...
  }),
  []
);
```

**Effort:** E1 (30 minutes) | **Impact:** Low

---

## 10. Architecture and Design Improvements

### 10.1 Service Layer Consistency [S1, E2]

**Issue:** Services follow different patterns:

- `GlossaryService` - Class-based with static methods
- `FirestoreService` - Factory function pattern
- Direct Firestore calls in components

**Recommended Refactoring:** Standardize on factory pattern across all services:

```typescript
// lib/services/glossary.service.ts
export const GlossaryService = createGlossaryService({
  db,
  logger,
  // ... dependencies
});
```

**Effort:** E2 (3-4 hours) | **Impact:** Medium

---

### 10.2 Type Safety Improvements [S2, E2]

**Issue:** Some operations accept `Record<string, unknown>` instead of typed
data:

```typescript
// In FirestoreService.saveInventoryEntry
entry: {
  data: Record<string, unknown>; // ← Not type-safe
}
```

**Recommended Refactoring:** Define strict types for all entry data:

```typescript
interface InventoryEntryData {
  resentments: string[];
  dishonesty: string[];
  apologies: string[];
  successes: string[];
}

export function saveInventoryEntry(
  userId: string,
  entry: { data: InventoryEntryData }
) {
  // Now type-safe
}
```

**Effort:** E2 (4-6 hours) | **Impact:** High - Prevents runtime errors

---

### 10.3 Error Boundary Coverage [S2, E1]

**Location:** `components/providers/error-boundary.tsx`

**Current:** Single error boundary at root level

**Recommended Improvement:** Add strategic error boundaries at component
subtrees:

```typescript
// components/error-boundaries/
// - JournalErrorBoundary.tsx
// - AdminErrorBoundary.tsx
// - NotebookErrorBoundary.tsx

// Prevents entire app crash from single feature failure
```

**Effort:** E1 (2-3 hours) | **Impact:** Medium - Improves resilience

---

## 11. Documentation and Knowledge Base

### 11.1 Missing Component Documentation [S3, E1]

**Issue:** Many components lack JSDoc documentation:

- AdminCrudTable
- EntryCard
- TodayPage
- Entry form components

**Recommended Action:** Add comprehensive JSDoc to all public components:

````typescript
/**
 * Form component for entering daily check-in information
 *
 * @component
 * @example
 * ```tsx
 * <DailyLogForm onClose={() => {}} onSuccess={() => {}} />
 * ```
 *
 * @param {Function} onClose - Callback when user dismisses form
 * @param {Function} onSuccess - Callback when form submitted successfully
 * @returns {JSX.Element} Form dialog component
 */
export function DailyLogForm({ onClose, onSuccess }: DailyLogFormProps) {
  // ...
}
````

**Effort:** E1 (2-3 hours) | **Impact:** Medium - Improves discoverability

---

## Priority Implementation Roadmap

### Phase 1: High-Impact, Low-Effort (Weeks 1-2)

| Task                                         | Effort | Impact | Priority |
| -------------------------------------------- | ------ | ------ | -------- |
| Remove deprecated `saveNotebookJournalEntry` | E1     | Low    | P1       |
| Standardize error logging patterns           | E1     | Medium | P1       |
| Synchronize rate limit config                | E1     | Medium | P2       |
| Add component JSDoc                          | E1     | Medium | P2       |

### Phase 2: Medium-Impact, Medium-Effort (Weeks 3-5)

| Task                               | Effort | Impact | Priority |
| ---------------------------------- | ------ | ------ | -------- |
| Consolidate error handlers         | E1     | High   | P1       |
| Extract form submission hook       | E2     | High   | P1       |
| Split firestore-service.ts         | E2     | High   | P2       |
| Improve AdminCrudTable testability | E2     | High   | P2       |

### Phase 3: Large-Scale Refactoring (Weeks 6-10)

| Task                             | Effort | Impact | Priority |
| -------------------------------- | ------ | ------ | -------- |
| Refactor TodayPage into sections | E3     | High   | P1       |
| Extract entry type components    | E3     | High   | P2       |
| Expand test coverage             | E3     | High   | P1       |
| Unify service layer patterns     | E2     | Medium | P3       |

---

## Quick Wins (Can be done immediately)

1. **Add @memo to form components** (15 min)
   - `components/journal/entry-forms/*.tsx`
   - Files: daily-log-form.tsx, mood-form.tsx, etc.

2. **Standardize logger.error patterns** (1 hour)
   - Replace all `logger.error(msg, { error })` with type-safe version
   - Files: admin-crud-table.tsx, daily-log-context.tsx, etc.

3. **Document entry types** (30 min)
   - Add JSDoc to `types/journal.ts`
   - Clarify required vs optional fields

4. **Fix nested ternaries in ToggleButton** (15 min)
   - Extract `getToggleButtonStyle()` function
   - File: components/notebook/pages/today-page.tsx

---

## Metrics and Success Criteria

### Before Refactoring

- Largest file: 400+ lines (firestore-service.ts)
- Code duplication: ~15% (estimated)
- Test coverage: Unknown (needs measurement)
- Cyclomatic complexity: High in several files

### After Refactoring (Target)

- No file > 200 lines (with exceptions for pages)
- Code duplication: < 5%
- Test coverage: > 70% for lib/ and components/
- Cyclomatic complexity: < 10 per function

---

## Risks and Mitigation

| Risk                                     | Probability | Impact | Mitigation                        |
| ---------------------------------------- | ----------- | ------ | --------------------------------- |
| Breaking changes during refactoring      | Medium      | High   | Add tests before refactoring      |
| Performance regression from abstractions | Low         | Medium | Profile before/after              |
| Context reset with large changes         | Low         | High   | Use /checkpoint before major work |
| Type safety issues from generics         | Medium      | Medium | Use strict TypeScript checking    |

---

## Appendix: Code Pattern References

### Pattern 1: Error Handling (Recommended)

```typescript
try {
  // operation
} catch (error) {
  const message = getCloudFunctionErrorMessage(error, {
    operation: "save journal entry",
    defaultMessage: "Failed to save your entry",
  });
  toast.error(message);
  throw new Error(message, { cause: error });
}
```

### Pattern 2: Form Submission (Recommended)

```typescript
const { handleSubmit, isSubmitting } = useFormSubmission(
  async (data) => {
    await FirestoreService.save(userId, data);
  },
  () => {
    toast.success("Saved!");
    onSuccess();
    onClose();
  }
);
```

### Pattern 3: Entry Component Abstraction (Recommended)

```typescript
export const ENTRY_COMPONENTS = {
  mood: MoodEntryCard,
  gratitude: GratitudeEntryCard,
  // ... etc
} as const;

export function EntryCard({ entry, onClick }: EntryCardProps) {
  const Component = ENTRY_COMPONENTS[entry.type];
  if (!Component) return null;
  return <Component entry={entry} onClick={onClick} />;
}
```

---

## Conclusion

The SoNash codebase has a solid foundation with clear architectural decisions
and good security practices. The identified refactoring opportunities focus on:

1. **Reducing duplication** (error handling, forms, CRUD patterns)
2. **Splitting large components** (TodayPage, AdminCrudTable)
3. **Improving type safety** (entry data types, service generics)
4. **Enhancing testability** (dependency injection, smaller components)

Implementation of Phase 1 recommendations would yield immediate benefits with
minimal risk. Phases 2-3 should be scheduled across future sprints to maintain
velocity while incrementally improving code quality.

**Estimated Total Effort:** 40-60 hours across 3 phases **Estimated ROI:**
High - significantly improves maintainability and feature velocity
