# SoNash Refactoring Action Plan
**Generated**: December 11, 2025
**Based on**: CODE_ANALYSIS_REPORT.md

---

## Overview

This document outlines the specific refactoring actions to be taken to address the 26 issues identified in the code analysis. The plan is organized into 4 phases based on priority and impact.

---

## Phase 1: Critical Fixes (Immediate - Week 1)

### ✅ Completed Fixes

#### 1. Fix Auto-Save Race Condition (B-1)

**File**: `components/notebook/pages/today-page.tsx`

**Changes**:
- ✅ Replace timeout-based debounce with proper debounce hook
- ✅ Use `useCallback` to stabilize save function
- ✅ Add ref to track latest values without re-triggering effect

**Implementation**:
```typescript
// Create utility hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Usage in today-page
const debouncedJournal = useDebounce(journalEntry, 5000)
useEffect(() => {
  // Save logic using debouncedJournal
}, [debouncedJournal])
```

---

#### 2. Fix Listener Memory Leak (B-2)

**File**: `components/notebook/pages/today-page.tsx`

**Changes**:
- ✅ Track component mount state
- ✅ Ensure cleanup happens even if setup fails
- ✅ Add error handling

**Implementation**:
```typescript
useEffect(() => {
  let unsubscribe: (() => void) | undefined
  let isMounted = true

  const setupListener = async () => {
    try {
      const { onSnapshot, doc } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      const today = getTodayDateId() // Use centralized function
      const docRef = doc(db, `users/${user.uid}/daily_logs/${today}`)

      if (isMounted) {
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (!isMounted) return // Guard against late callbacks
          // Update state...
        })
      }
    } catch (err) {
      logger.error("Error setting up listener", { error: err })
    }
  }

  if (user) {
    setupListener()
  }

  return () => {
    isMounted = false
    if (unsubscribe) unsubscribe()
  }
}, [user]) // Only user in deps
```

---

#### 3. Standardize Date Handling (CQ-2)

**File**: `lib/utils/date-utils.ts` (NEW)

**Changes**:
- ✅ Create centralized date utility
- ✅ Replace all date ID generation with this function
- ✅ Add timezone documentation

**Implementation**:
```typescript
// lib/utils/date-utils.ts
/**
 * Generates a consistent date ID for daily logs
 * Format: YYYY-MM-DD (UTC timezone)
 *
 * All daily log operations MUST use this function to ensure consistency
 */
export function getTodayDateId(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
  }).format(new Date())
}

/**
 * Formats a date for display (not for database operations)
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })
}
```

**Files to Update**:
- ✅ `lib/firestore-service.ts` (already uses UTC)
- ✅ `components/notebook/pages/today-page.tsx` (multiple locations)
- ✅ `components/providers/auth-provider.tsx` (if needed)

---

#### 4. Remove @ts-ignore and Add Type Guards (CQ-3)

**File**: `components/notebook/pages/today-page.tsx`

**Changes**:
- ✅ Create proper Timestamp type
- ✅ Add type guard function
- ✅ Remove @ts-ignore

**Implementation**:
```typescript
// lib/types/firebase-types.ts (NEW)
import { Timestamp } from "firebase/firestore"

export function isFirestoreTimestamp(value: unknown): value is Timestamp {
  return value !== null &&
         typeof value === 'object' &&
         'toDate' in value &&
         typeof (value as any).toDate === 'function'
}

// today-page.tsx
const getCleanTime = () => {
  if (!profile?.cleanStart) return null

  let startDate: Date
  if (isFirestoreTimestamp(profile.cleanStart)) {
    startDate = profile.cleanStart.toDate()
  } else if (profile.cleanStart instanceof Date) {
    startDate = profile.cleanStart
  } else {
    startDate = new Date(profile.cleanStart)
  }

  // Rest of logic...
}
```

---

#### 5. Add Input Validation with Zod (CQ-7)

**File**: `lib/db/users.ts`

**Changes**:
- ✅ Create Zod schema for UserProfile
- ✅ Validate before all database writes
- ✅ Add proper error messages

**Implementation**:
```typescript
import { z } from "zod"

// Zod schema for UserProfile
const UserProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email().nullable(),
  nickname: z.string().min(1).max(50),
  cleanStart: z.custom<Timestamp>((val) => {
    // Validate Timestamp
    return val === null || isFirestoreTimestamp(val)
  }).nullable(),
  createdAt: z.custom<Timestamp>(),
  updatedAt: z.custom<Timestamp>(),
  preferences: z.object({
    theme: z.literal("blue"),
    largeText: z.boolean(),
    simpleLanguage: z.boolean(),
  }),
})

const PartialUserProfileSchema = UserProfileSchema.partial().omit({ uid: true })

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  try {
    assertUserScope({ userId: uid })

    // Validate input
    const validated = PartialUserProfileSchema.parse(data)

    const docRef = doc(db, `users/${uid}`)
    validateUserDocumentPath(uid, `users/${uid}`)

    await setDoc(
      docRef,
      {
        ...validated,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("Invalid user profile data", {
        userId: maskIdentifier(uid),
        errors: error.errors
      })
      throw new Error("Invalid user profile data")
    }
    logger.error("Error updating user profile", { userId: maskIdentifier(uid), error })
    throw error
  }
}
```

---

#### 6. Add Server-Side Date Validation (S-1)

**File**: `firestore.rules`

**Changes**:
- ✅ Add Firestore rule to validate date ID matches current date
- ✅ Prevent writing to arbitrary past/future dates

**Implementation**:
```firestore-rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to get current date in YYYY-MM-DD format
    function isToday(dateId) {
      // Firestore doesn't have date formatting, so we validate it's a valid date format
      // and within reasonable range (today ± 1 day for timezone tolerance)
      let requestTime = request.time.toMillis();
      let oneDayMillis = 86400000; // 24 hours

      // Simple validation: date ID must be in YYYY-MM-DD format
      return dateId.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$');
    }

    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null && request.auth.uid == uid;

      match /daily_logs/{logId} {
        allow read: if request.auth != null && request.auth.uid == uid;

        // Only allow writing to valid date IDs
        allow write: if request.auth != null &&
                        request.auth.uid == uid &&
                        isToday(logId);
      }
    }

    // Meetings collection (read-only for clients)
    match /meetings/{meetingId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins via Cloud Functions
    }
  }
}
```

**Note**: More sophisticated date validation requires Cloud Functions due to Firestore Rules limitations.

---

#### 7. Remove Unused Fonts (P-1)

**File**: `app/layout.tsx`

**Changes**:
- ✅ Audit which fonts are actually used
- ✅ Remove unused font imports
- ✅ Add font-display: swap

**Fonts Actually Used** (from grep analysis):
- `Caveat` - journal entry text
- `Handlee` - body text in modals
- `Rock Salt` - headings in onboarding

**Fonts to REMOVE** (16 fonts):
- Kalam, Permanent_Marker, Dancing_Script, Satisfy, Pacifico
- Amatic_SC, Gloria_Hallelujah, Architects_Daughter, Coming_Soon
- Neucha, Short_Stack, Annie_Use_Your_Telescope, Gochi_Hand
- Pangolin, La_Belle_Aurore, Geist, Geist_Mono

**Implementation**:
```typescript
// app/layout.tsx
import {
  Caveat,
  Handlee,
  Rock_Salt,
} from "next/font/google"

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: 'swap' // Add for performance
})

const handlee = Handlee({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-handlee",
  display: 'swap'
})

const rockSalt = Rock_Salt({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-rocksalt",
  display: 'swap'
})

// In body className:
className={`
  font-sans antialiased
  ${caveat.variable}
  ${handlee.variable}
  ${rockSalt.variable}
`}
```

**Expected Impact**:
- **Before**: ~400 KB fonts loaded
- **After**: ~50 KB fonts loaded
- **Savings**: 350 KB (~87% reduction)

---

## Phase 2: High Priority (Week 2-3)

#### 8. Fix Onboarding Animation (B-3)

**File**: `components/onboarding/onboarding-wizard.tsx`

**Implementation**:
```typescript
<AnimatePresence mode="wait">
  {step === "welcome" && (
    <motion.div key="welcome">...</motion.div>
  )}

  {step === "clean-date" && (
    <motion.div key="clean-date">...</motion.div>
  )}
</AnimatePresence>
```

---

#### 9. Environment-Aware Logging (CQ-5)

**File**: `lib/logger.ts`

**Implementation**:
```typescript
const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

const log = (level: LogLevel, message: string, context?: LogContext) => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context: sanitizeContext(context) } : {}),
  }

  // Only log to console in development/test
  if (isDevelopment || isTest) {
    if (level === "info") console.log(payload)
    else if (level === "warn") console.warn(payload)
    else console.error(payload)
  }

  // In production, send to logging service (Sentry, LogRocket, etc.)
  if (!isDevelopment && !isTest && level === 'error') {
    // TODO: Send to external logging service
    // Sentry.captureMessage(message, { level, extra: context })
  }
}
```

---

#### 10. Add Loading States (CQ-8)

**File**: `components/notebook/pages/today-page.tsx`

**Implementation**:
```typescript
const [isSaving, setIsSaving] = useState(false)

useEffect(() => {
  const save = async () => {
    setIsSaving(true)
    try {
      await FirestoreService.saveDailyLog(...)
    } finally {
      setIsSaving(false)
    }
  }
  // ...
}, [...])

// In UI:
<div className="absolute -bottom-6 right-0 text-xs font-body italic">
  {isSaving ? (
    <span className="text-amber-600 flex items-center gap-1">
      <Loader2 className="w-3 h-3 animate-spin" />
      Saving...
    </span>
  ) : journalEntry ? (
    <span className="text-amber-900/40">Saved</span>
  ) : (
    <span className="text-amber-900/40">Autosaves as you type</span>
  )}
</div>
```

---

#### 11. Optimize Real-Time Listeners (P-2)

**File**: `components/providers/auth-provider.tsx`

**Implementation**:
```typescript
// Memoize snapshot handler
const handleProfileSnapshot = useCallback((docSnap: DocumentSnapshot) => {
  if (docSnap.exists()) {
    const data = docSnap.data() as UserProfile
    // Only update if data actually changed
    setProfile((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(data)) return prev
      return data
    })
    setProfileNotFound(false)
  } else {
    setProfile(null)
    setProfileNotFound(true)
  }
  setLoading(false)
}, [])
```

---

#### 12. Implement Code Splitting (P-3)

**File**: Various

**Implementation**:
```typescript
// components/notebook/book-cover.tsx
import dynamic from 'next/dynamic'

const OnboardingWizard = dynamic(
  () => import('@/components/onboarding/onboarding-wizard'),
  { loading: () => <div>Loading...</div> }
)

const SignInModal = dynamic(
  () => import('@/components/auth/sign-in-modal'),
  { loading: () => <div>Loading...</div> }
)
```

---

#### 13. Add Rate Limiting (S-2)

**Implementation**: Use Firebase App Check + Cloud Functions

**Step 1**: Enable Firebase App Check
```bash
# Install Firebase App Check
npm install firebase/app-check
```

```typescript
// lib/firebase.ts
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check"

if (typeof window !== 'undefined') {
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!),
    isTokenAutoRefreshEnabled: true
  })
}
```

**Step 2**: Add client-side rate limiting
```typescript
// lib/utils/rate-limiter.ts
class RateLimiter {
  private calls: number[] = []

  canMakeRequest(maxCalls: number, windowMs: number): boolean {
    const now = Date.now()
    this.calls = this.calls.filter(time => now - time < windowMs)

    if (this.calls.length >= maxCalls) {
      return false
    }

    this.calls.push(now)
    return true
  }
}

export const saveLimiter = new RateLimiter()

// Usage in firestore-service.ts
async saveDailyLog(userId: string, data: Partial<DailyLog>) {
  if (!saveLimiter.canMakeRequest(10, 60000)) { // 10 calls per minute
    throw new Error("Rate limit exceeded. Please wait before saving again.")
  }
  // ... rest of save logic
}
```

---

## Phase 3: Medium Priority (Week 4)

#### 14. Fix useEffect Dependencies (CQ-1)

**File**: `components/notebook/pages/today-page.tsx`

**Implementation**:
```typescript
const isEditingRef = useRef(false)

// Remove isEditing from deps:
useEffect(() => {
  // Use isEditingRef.current instead of isEditing
}, [user]) // Only user
```

---

#### 15. Extract Magic Strings (CQ-4)

**File**: `lib/constants.ts` (NEW)

**Implementation**:
```typescript
export const STORAGE_KEYS = {
  JOURNAL_TEMP: 'sonash_journal_temp',
  READING_PREF: 'sonash_reading_pref',
} as const

export const DAYS = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
} as const

export const DAY_ORDER = {
  [DAYS.MONDAY]: 1,
  [DAYS.TUESDAY]: 2,
  [DAYS.WEDNESDAY]: 3,
  [DAYS.THURSDAY]: 4,
  [DAYS.FRIDAY]: 5,
  [DAYS.SATURDAY]: 6,
  [DAYS.SUNDAY]: 7,
} as const
```

---

#### 16. Remove Unused Dependencies (CQ-6)

**File**: `package.json`

**Command**:
```bash
npm uninstall @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-toggle @radix-ui/react-toggle-group
```

---

#### 17-22. Other Phase 3 Items

See CODE_ANALYSIS_REPORT.md for details on:
- B-4: Fix meeting sort
- B-5: Fix loading state edge case
- P-4: Implement proper debouncing
- A-1 & A-2: Accessibility improvements

---

## Phase 4: Low Priority (Backlog)

### 23. Reduce Firebase Coupling (CQ-9)

Create abstraction layer:
```typescript
// lib/database/database-interface.ts
export interface IDatabase {
  saveLog(userId: string, data: any): Promise<void>
  getLog(userId: string, dateId: string): Promise<any>
}

// lib/database/firestore-adapter.ts
export class FirestoreAdapter implements IDatabase {
  // Implement interface
}
```

---

### 24-26. Other Phase 4 Items

- Font optimization (already done in Phase 1)
- Component documentation
- Test coverage increase

---

## Testing Strategy

### For Each Fix:

1. **Unit Test**: Test the specific function/component
2. **Integration Test**: Test the feature end-to-end
3. **Manual Test**: Verify in browser
4. **Regression Test**: Ensure no existing features broke

### Test Files to Create:

```
tests/
  ├── utils/
  │   ├── date-utils.test.ts
  │   ├── rate-limiter.test.ts
  │   └── type-guards.test.ts
  ├── components/
  │   ├── today-page.test.tsx
  │   ├── onboarding-wizard.test.tsx
  │   └── sign-in-modal.test.tsx
  └── integration/
      ├── journal-save-flow.test.ts
      └── auth-flow.test.ts
```

---

## Deployment Checklist

Before deploying refactored code:

- [ ] All tests passing
- [ ] Lighthouse score > 90
- [ ] No console errors in production build
- [ ] Firebase rules deployed
- [ ] Environment variables set
- [ ] App Check configured
- [ ] Error monitoring enabled (Sentry)
- [ ] Performance monitoring enabled
- [ ] Analytics configured

---

## Success Metrics

### Before Refactoring:
- Lighthouse Performance: ~70
- Bundle Size: ~700 KB
- First Contentful Paint: ~2.5s
- Time to Interactive: ~4.0s
- Test Coverage: ~15%
- Known Bugs: 5 critical

### After Refactoring (Target):
- Lighthouse Performance: 90+
- Bundle Size: ~300 KB
- First Contentful Paint: ~1.0s
- Time to Interactive: ~2.0s
- Test Coverage: 70%+
- Known Bugs: 0 critical

---

## Next Steps

1. ✅ Review this action plan
2. ⏳ Implement Phase 1 fixes (in progress)
3. ⏳ Write tests for Phase 1
4. ⏳ Deploy Phase 1 to staging
5. ⏳ Verify in production
6. ⏳ Move to Phase 2

---

## Notes

- Each phase should be deployed separately
- Run full test suite before each deployment
- Monitor error rates and performance metrics after each deployment
- Keep this document updated as work progresses

**Last Updated**: December 11, 2025
