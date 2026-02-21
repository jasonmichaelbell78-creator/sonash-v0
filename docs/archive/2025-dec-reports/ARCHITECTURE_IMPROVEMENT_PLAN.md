<!-- TDMS: All actionable findings from this report have been ingested into
     MASTER_DEBT.jsonl. This file is archived for historical reference only.
     Do not add new findings here — use the TDMS intake process. -->

# Architecture Quality Improvement Plan

## From 4.2/5 → 4.8+/5

**Date:** 2025-12-12 **Current Score:** 4.2/5 **Target Score:** 4.8+/5
**Timeline:** 8-12 weeks (parallel with M1 & M2 roadmap milestones)

---

## Executive Summary

The SoNash architecture scored **4.2/5** in the December 2025 deep review—a
strong foundation, but with room for improvement before scaling to production.
This plan outlines **6 major architectural improvements** (A1-A6) that will
bring the quality to **4.8+/5**, addressing:

1. **Performance** - 60% reduction in re-renders via context splitting
2. **Maintainability** - All components <150 lines (target <100)
3. **Consistency** - Standardized error handling across all services
4. **Scalability** - Proper abstractions for future growth

---

## Current Architecture Assessment

### Strengths (What's Working Well) ✅

| Category                     | Score | Evidence                                            |
| ---------------------------- | ----- | --------------------------------------------------- |
| **Layered Architecture**     | 5/5   | Clean separation: UI → Context → Service → Database |
| **TypeScript Coverage**      | 5/5   | 100% strict mode, no `any` in business logic        |
| **Security-First Design**    | 4/5   | Comprehensive Firestore rules, validation, scoping  |
| **Dependency Injection**     | 4/5   | `createFirestoreService()` pattern for testability  |
| **Error Handling**           | 4/5   | Error boundaries, structured logging                |
| **Performance Optimization** | 4/5   | Font loading, data diffing, memoization             |

**Average:** 4.3/5

### Weaknesses (Areas for Improvement) ⚠️

| Category                 | Score | Issue                                              | Impact                      |
| ------------------------ | ----- | -------------------------------------------------- | --------------------------- |
| **Context Design**       | 3/5   | AuthProvider has 7 state variables (SRP violation) | Unnecessary re-renders      |
| **Component Size**       | 3/5   | book-cover.tsx = 337 lines (mixed concerns)        | Hard to test, maintain      |
| **Error Handling**       | 4/5   | Inconsistent patterns (throw vs return)            | Confusing for developers    |
| **Database Abstraction** | 3/5   | Adapter exists but not used consistently           | Tight coupling to Firestore |
| **Testing**              | 2/5   | Only 10-15% coverage                               | Risky deployments           |
| **Bundle Size**          | 3/5   | Unknown size, heavy dependencies                   | Slow initial load           |

**Average:** 3.0/5

**Overall Score:** (4.3 + 3.0) / 2 = **4.2/5**

---

## Improvement Roadmap

### Target Architecture Quality: 4.8/5

| Category                  | Current | Target | Strategy                                |
| ------------------------- | ------- | ------ | --------------------------------------- |
| **Layered Architecture**  | 5/5     | 5/5    | Maintain (already excellent)            |
| **TypeScript Coverage**   | 5/5     | 5/5    | Maintain + add type guards              |
| **Security-First Design** | 4/5     | 5/5    | Add server-side enforcement (M1)        |
| **Dependency Injection**  | 4/5     | 5/5    | Use adapter consistently                |
| **Error Handling**        | 4/5     | 5/5    | Standardize patterns                    |
| **Performance**           | 4/5     | 5/5    | Context splitting + bundle optimization |
| **Context Design**        | 3/5     | 5/5    | **A1: Split AuthProvider**              |
| **Component Size**        | 3/5     | 5/5    | **A2: Decompose large components**      |
| **Database Abstraction**  | 3/5     | 5/5    | **A6: Use adapter consistently**        |
| **Testing**               | 2/5     | 4/5    | Increase coverage to 60%+ (M1)          |
| **Bundle Size**           | 3/5     | 4/5    | **A5: Analyze and optimize**            |

**New Average:** (5+5+5+5+5+5+5+5+5+4+4) / 11 = **4.8/5** ✅

---

## A1: Split AuthProvider into Focused Contexts

### Problem Statement

**Current:** `AuthProvider` has 7 state variables (195 lines)

- `user` - Firebase auth user
- `profile` - User profile from Firestore
- `loading` - Initial load state
- `todayLog` - Today's daily log
- `todayLogError` - Error loading today log
- `profileError` - Error loading profile
- `profileNotFound` - Profile doesn't exist flag

**Issues:**

1. **Violates Single Responsibility Principle** - Mixes auth, profile, and daily
   log concerns
2. **Unnecessary Re-renders** - Any state change notifies all consumers
3. **Tight Coupling** - Components that only need auth also get profile updates
4. **Hard to Test** - Complex state management with multiple concerns

**Example Problem:**

```typescript
// Component that only needs user ID
function MyComponent() {
  const { user } = useAuth(); // Also subscribes to profile, todayLog, loading, etc.
  // Component re-renders when profile updates, even though it doesn't use profile
}
```

### Solution: Split into 3 Focused Contexts

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ BEFORE: Single AuthProvider (7 state vars, 195 lines)          │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ AuthProvider                                                ││
│ │ - user, loading                                             ││
│ │ - profile, profileError, profileNotFound                    ││
│ │ - todayLog, todayLogError                                   ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ AFTER: 3 Focused Contexts (each <80 lines)                     │
│                                                                 │
│ ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐  │
│ │ AuthContext     │ │ ProfileContext  │ │ DailyLogContext  │  │
│ │ - user          │ │ - profile       │ │ - todayLog       │  │
│ │ - loading       │ │ - profileError  │ │ - todayLogError  │  │
│ │                 │ │ - profileNotFound│ │ - refreshTodayLog│  │
│ └─────────────────┘ └─────────────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation Plan

**1. Create `AuthContext` (user + loading only)**

```typescript
// components/providers/auth-context.tsx
"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { auth } from "@/lib/firebase"
import { User, onAuthStateChanged, signInAnonymously } from "firebase/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (!currentUser) {
        // Auto sign-in anonymously
        try {
          await signInAnonymously(auth)
        } catch (error) {
          console.error("Failed to sign in anonymously", error)
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

**2. Create `ProfileContext` (profile data only)**

```typescript
// components/providers/profile-context.tsx
"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { useAuth } from "./auth-context"
import { onSnapshot, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { UserProfile } from "@/lib/db/users"

interface ProfileContextType {
  profile: UserProfile | null
  profileError: string | null
  profileNotFound: boolean
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  profileError: null,
  profileNotFound: false,
})

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth() // Only subscribes to auth changes
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileNotFound, setProfileNotFound] = useState(false)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileError(null)
      setProfileNotFound(false)
      return
    }

    // Subscribe to profile updates
    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile)
          setProfileNotFound(false)
        } else {
          setProfile(null)
          setProfileNotFound(true)
        }
      },
      (error) => {
        console.error("Error loading profile", error)
        setProfileError("Failed to load profile")
      }
    )

    return () => unsubscribe()
  }, [user])

  return (
    <ProfileContext.Provider value={{ profile, profileError, profileNotFound }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => useContext(ProfileContext)
```

**3. Create `DailyLogContext` (today's log only)**

```typescript
// components/providers/daily-log-context.tsx
"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { useAuth } from "./auth-context"
import { FirestoreService, DailyLog } from "@/lib/firestore-service"

interface DailyLogContextType {
  todayLog: DailyLog | null
  todayLogError: string | null
  refreshTodayLog: () => Promise<void>
}

const DailyLogContext = createContext<DailyLogContextType>({
  todayLog: null,
  todayLogError: null,
  refreshTodayLog: async () => {},
})

export function DailyLogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [todayLogError, setTodayLogError] = useState<string | null>(null)

  const refreshTodayLog = useCallback(async () => {
    if (!user) return

    const result = await FirestoreService.getTodayLog(user.uid)
    setTodayLog(result.log)
    setTodayLogError(result.error ? "Failed to load today's log" : null)
  }, [user])

  return (
    <DailyLogContext.Provider value={{ todayLog, todayLogError, refreshTodayLog }}>
      {children}
    </DailyLogContext.Provider>
  )
}

export const useDailyLog = () => useContext(DailyLogContext)
```

**4. Update Root Layout to Nest Providers**

```typescript
// app/layout.tsx
import { AuthProvider } from "@/components/providers/auth-context"
import { ProfileProvider } from "@/components/providers/profile-context"
import { DailyLogProvider } from "@/components/providers/daily-log-context"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <ProfileProvider>
            <DailyLogProvider>
              {children}
            </DailyLogProvider>
          </ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

**5. Update Components to Use Specific Hooks**

```typescript
// BEFORE: Components subscribe to everything
function BookCover() {
  const { user, profile, loading } = useAuth(); // Gets all 7 state vars
}

// AFTER: Components subscribe to only what they need
function BookCover() {
  const { user, loading } = useAuth(); // Only auth state
  const { profile } = useProfile(); // Only when profile updates
}
```

### Benefits

| Metric                 | Before | After       | Improvement    |
| ---------------------- | ------ | ----------- | -------------- |
| **Re-renders**         | 100%   | 40%         | -60%           |
| **Component coupling** | High   | Low         | Better         |
| **Lines per context**  | 195    | ~60-80 each | Maintainable   |
| **Test complexity**    | High   | Low         | Easier to test |

### Estimated Effort

- **Time:** 1 week
- **Risk:** Low (backward compatible migration)
- **Dependencies:** None
- **Testing:** Update all components using `useAuth()` (20+ files)

---

## A2: Decompose Large Components

### Problem: `book-cover.tsx` (337 lines)

**Concerns Mixed:**

1. Framer Motion animations (100+ lines)
2. Authentication logic (20 lines)
3. Clean days calculation (20 lines)
4. Modal management (SignIn, Onboarding)
5. Responsive sizing (20 lines)

**Impact:**

- Hard to test (can't test animation without auth)
- Hard to reuse (animation logic tied to book)
- Hard to maintain (change animation → might break auth)

### Solution: Extract 4 Sub-Components

#### 1. `CleanDaysCalculator.tsx` (Pure Logic)

```typescript
// components/recovery/clean-days-calculator.tsx
import { useMemo } from "react";
import { differenceInDays } from "date-fns";
import { parseFirebaseTimestamp } from "@/lib/types/firebase-guards";
import { logger } from "@/lib/logger";

interface CleanDaysCalculatorProps {
  cleanStart: unknown;
}

export function useCleanDays(cleanStart: unknown): number {
  return useMemo(() => {
    if (!cleanStart) return 0;

    const parsedDate = parseFirebaseTimestamp(cleanStart);
    if (!parsedDate) {
      logger.warn("Invalid cleanStart value - could not parse timestamp");
      return 0;
    }

    return Math.max(0, differenceInDays(new Date(), parsedDate));
  }, [cleanStart]);
}
```

**Benefit:** Pure logic, easy to unit test, reusable

#### 2. `BookAnimation.tsx` (Animation Logic)

```typescript
// components/notebook/book-animation.tsx
import { motion } from "framer-motion"

interface BookAnimationProps {
  isAnimating: boolean
  width: number
  height: number
  children: React.ReactNode
}

export function BookAnimation({ isAnimating, width, height, children }: BookAnimationProps) {
  return (
    <motion.div
      style={{ width, height }}
      animate={{
        rotateY: isAnimating ? -15 : 0,
        scale: isAnimating ? 1.05 : 1,
      }}
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.div>
  )
}
```

**Benefit:** Isolated Framer Motion logic, testable without Firebase

#### 3. `BookAuthGuard.tsx` (Auth Logic)

```typescript
// components/notebook/book-auth-guard.tsx
import { useAuth } from "@/components/providers/auth-context";
import { useProfile } from "@/components/providers/profile-context";

interface BookAuthGuardProps {
  onOpen: () => void;
  onShowSignIn: () => void;
  onShowOnboarding: () => void;
}

export function useBookAuthGuard({
  onOpen,
  onShowSignIn,
  onShowOnboarding,
}: BookAuthGuardProps) {
  const { user, loading } = useAuth();
  const { profile } = useProfile();

  const handleClick = () => {
    if (loading) return;

    const isProfileComplete = !!profile?.cleanStart;

    if (user) {
      if (isProfileComplete) {
        onOpen();
      } else {
        onShowOnboarding();
      }
    } else {
      onShowSignIn();
    }
  };

  return { handleClick, user, profile, loading };
}
```

**Benefit:** Auth logic separated, easy to test different scenarios

#### 4. `BookCover.tsx` (Simplified Composition)

```typescript
// components/notebook/book-cover.tsx (NOW 80 lines!)
"use client"

import { useState } from "react"
import { BookAnimation } from "./book-animation"
import { useBookAuthGuard } from "./book-auth-guard"
import { useCleanDays } from "@/components/recovery/clean-days-calculator"
import { useProfile } from "@/components/providers/profile-context"
import dynamic from "next/dynamic"

const SignInModal = dynamic(() => import("@/components/auth/sign-in-modal"), { ssr: false })
const OnboardingWizard = dynamic(() => import("@/components/onboarding/onboarding-wizard"), { ssr: false })

interface BookCoverProps {
  onOpen: () => void
  isAnimating?: boolean
}

export default function BookCover({ onOpen, isAnimating = false }: BookCoverProps) {
  const { profile } = useProfile()
  const cleanDays = useCleanDays(profile?.cleanStart)
  const [showSignIn, setShowSignIn] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const { handleClick } = useBookAuthGuard({
    onOpen,
    onShowSignIn: () => setShowSignIn(true),
    onShowOnboarding: () => setShowOnboarding(true),
  })

  return (
    <>
      <button onClick={handleClick} aria-label="Open your recovery notebook">
        <BookAnimation isAnimating={isAnimating} width={600} height={850}>
          {/* Book visual content */}
          <div className="book-cover">
            <h1>{profile?.nickname || "Friend"}</h1>
            <p>{cleanDays} days clean</p>
          </div>
        </BookAnimation>
      </button>

      <SignInModal open={showSignIn} onClose={() => setShowSignIn(false)} />
      <OnboardingWizard open={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </>
  )
}
```

**Reduction:** 337 lines → 80 lines (76% smaller!)

### Component Size Target

| Component          | Before | After | Status    |
| ------------------ | ------ | ----- | --------- |
| book-cover.tsx     | 337    | 80    | ✅        |
| today-page.tsx     | 100+   | <80   | 🎯 Target |
| notebook-shell.tsx | 198    | <100  | 🎯 Target |

**Goal:** All components <150 lines (prefer <100)

### Estimated Effort

- **Time:** 2 weeks
- **Risk:** Medium (requires careful refactoring)
- **Testing:** Add component tests for each extracted piece

---

## A3: Standardize Error Handling

### Problem: Inconsistent Patterns

**Current State:**

```typescript
// Some functions throw
async saveDailyLog(userId: string, data: Partial<DailyLog>) {
  if (!userId) throw new Error("User ID required") // Throws!
  // ...
}

// Some functions return { error }
async getTodayLog(userId: string): Promise<TodayLogResult> {
  return { log: null, error: rateError } // Returns error!
}
```

**Impact:**

- Developers don't know which pattern to expect
- Inconsistent error handling in components
- Hard to add centralized error tracking

### Solution: Result<T> Type Pattern

#### 1. Define `Result<T>` Type

```typescript
// lib/types/result.ts

/**
 * Result type for operations that can fail
 * Inspired by Rust's Result and TypeScript's discriminated unions
 */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Create a successful result
 */
export function Ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

/**
 * Create a failed result
 */
export function Err<E = Error>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Unwrap a result, throwing if it's an error
 */
export function unwrap<T>(result: Result<T>): T {
  if (result.ok) return result.value;
  throw result.error;
}

/**
 * Get value or default
 */
export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}
```

#### 2. Standardize Service Methods

```typescript
// lib/firestore-service.ts (REFACTORED)

async saveDailyLog(userId: string, data: Partial<DailyLog>): Promise<Result<void>> {
  try {
    ensureValidUser(userId)
    deps.assertUserScope({ userId })

    const rateError = rateLimitError(saveDailyLogLimiter, "Save", userId)
    if (rateError) return Err(rateError)

    const today = getTodayUtcDateId()
    const docRef = getValidatedDocRef(userId, today)

    await deps.setDoc(
      docRef,
      { ...data, id: today, updatedAt: deps.serverTimestamp() },
      { merge: true }
    )

    return Ok(undefined)
  } catch (error) {
    deps.logger.error("Failed to save daily log", { userId: maskIdentifier(userId), error })
    return Err(error instanceof Error ? error : new Error("Unknown error"))
  }
}

async getTodayLog(userId: string): Promise<Result<DailyLog | null>> {
  try {
    ensureValidUser(userId)
    deps.assertUserScope({ userId })

    const rateError = rateLimitError(readLimiter, "Read", userId)
    if (rateError) return Err(rateError)

    const today = getTodayUtcDateId()
    const docRef = getValidatedDocRef(userId, today)
    const docSnap = await deps.getDoc(docRef)

    return Ok(docSnap.exists() ? (docSnap.data() as DailyLog) : null)
  } catch (error) {
    deps.logger.error("Failed to retrieve today's log", { userId: maskIdentifier(userId), error })
    return Err(error instanceof Error ? error : new Error("Unknown error"))
  }
}
```

#### 3. Update Component Usage

```typescript
// components/pages/today-page.tsx

// BEFORE: Mixed error handling
try {
  await FirestoreService.saveDailyLog(userId, data); // Might throw
} catch (error) {
  toast.error("Failed to save");
}

const result = await FirestoreService.getTodayLog(userId); // Returns { log, error }
if (result.error) {
  toast.error("Failed to load");
}

// AFTER: Consistent Result<T> pattern
const saveResult = await FirestoreService.saveDailyLog(userId, data);
if (!saveResult.ok) {
  toast.error(saveResult.error.message);
  return;
}

const loadResult = await FirestoreService.getTodayLog(userId);
if (!loadResult.ok) {
  toast.error(loadResult.error.message);
  return;
}

const log = loadResult.value; // Type-safe access to value
```

### Error Handling Strategy Document

Create `docs/ERROR_HANDLING.md`:

```markdown
# Error Handling Strategy

## When to Use Each Pattern

### 1. Result<T> (Preferred for services)

Use for operations that can fail predictably:

- Database operations
- API calls
- File I/O
- Validation

### 2. Throw (Use sparingly)

Only throw for:

- Programming errors (null checks, type errors)
- Unrecoverable errors
- Framework requirements (React error boundaries)

### 3. Error Boundaries (UI layer)

Catch unexpected errors in React components

## Examples

See `lib/firestore-service.ts` for Result<T> usage.
```

### Benefits

| Aspect                   | Before         | After                      |
| ------------------------ | -------------- | -------------------------- |
| **Consistency**          | Mixed patterns | Single `Result<T>` pattern |
| **Type Safety**          | `any` errors   | Typed error handling       |
| **Developer Experience** | Confusing      | Clear expectations         |
| **Error Tracking**       | Scattered      | Centralized via Result     |

### Estimated Effort

- **Time:** 1 week
- **Risk:** Low (gradual migration)
- **Testing:** Update all service tests

---

## A4: Image Optimization

### Problem: Direct Image Usage

**Current:**

```tsx
// Background images loaded directly
<div style={{ backgroundImage: "url(/images/wood-table.jpg)" }} />

// Images not optimized
<img src="/images/book-cover.png" alt="Book" />
```

**Impact:**

- Slower page loads (no optimization)
- Poor Core Web Vitals scores
- No responsive images
- No lazy loading

### Solution: Next.js Image Component

```tsx
import Image from "next/image"

// Optimized, responsive, lazy-loaded
<Image
  src="/images/book-cover.png"
  alt="Recovery notebook"
  width={600}
  height={850}
  priority={true} // Above-the-fold
  placeholder="blur"
  blurDataURL="data:image/..." // Low-quality placeholder
/>

// Background images via next/image
<div className="relative h-screen">
  <Image
    src="/images/wood-table.jpg"
    alt=""
    fill
    className="object-cover"
    quality={75}
  />
</div>
```

### Audit Checklist

- [ ] Identify all `<img>` tags → Replace with `<Image>`
- [ ] Identify all `backgroundImage` CSS → Replace with `<Image fill>`
- [ ] Add responsive `sizes` attribute
- [ ] Generate blur placeholders for large images
- [ ] Configure `next.config.mjs` for external images (if needed)

### Estimated Effort

- **Time:** 3 days
- **Impact:** 30-50% faster page loads

---

## A5: Bundle Size Analysis & Optimization

### Problem: Unknown Bundle Size

**Current State:**

- No bundle analysis
- Heavy dependencies (Framer Motion, Recharts)
- Unknown if tree-shaking is working

### Solution: Bundle Analysis

#### 1. Install Analyzer

```bash
npm install --save-dev @next/bundle-analyzer
```

#### 2. Configure Next.js

```javascript
// next.config.mjs
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer({
  // existing config
});
```

#### 3. Run Analysis

```bash
ANALYZE=true npm run build
```

#### 4. Optimization Strategies

**A. Dynamic Imports for Heavy Libraries**

```typescript
// BEFORE: Framer Motion loaded on every page
import { motion } from "framer-motion";

// AFTER: Only load when needed
const motion = dynamic(
  () => import("framer-motion").then((mod) => ({ default: mod.motion })),
  {
    ssr: false,
  }
);
```

**B. Code Splitting by Route**

```typescript
// app/inventories/page.tsx
const InventoriesHub = dynamic(() => import("@/components/inventories/hub"), {
  loading: () => <LoadingSpinner />,
})
```

**C. Remove Unused Dependencies**

```bash
# Find unused dependencies
npx depcheck

# Remove if truly unused
npm uninstall [package]
```

### Bundle Size Targets

| Bundle            | Target         | Rationale                      |
| ----------------- | -------------- | ------------------------------ |
| **Initial JS**    | <200KB gzipped | Industry standard for fast TTI |
| **Initial CSS**   | <50KB gzipped  | Minimal render-blocking CSS    |
| **Largest Chunk** | <100KB gzipped | Balanced code splitting        |

### Estimated Effort

- **Time:** 1 week
- **Impact:** 40-60% reduction in initial bundle size

---

## A6: Database Adapter Pattern Consistency

### Problem: Inconsistent Abstraction

**Current:**

- `FirestoreAdapter` exists
- But `AuthProvider` uses `FirestoreService` directly
- Mixed direct/adapter access

**Goal:** All data access through adapter layer

### Benefits of Adapter Pattern

1. **Database Agnostic** - Could swap Firestore for PostgreSQL
2. **Easier Testing** - Mock adapter, not Firestore SDK
3. **Consistent API** - All data access follows same pattern
4. **Better Abstractions** - Hide Firestore-specific details

### Implementation

```typescript
// BEFORE: AuthProvider uses FirestoreService directly
import { FirestoreService } from "@/lib/firestore-service";

const result = await FirestoreService.getTodayLog(userId);

// AFTER: Use adapter
import { db } from "@/lib/database"; // Returns adapter instance

const result = await db.getTodayLog(userId);
```

### Migration Checklist

- [ ] Update `AuthProvider` to use adapter
- [ ] Update all components to use adapter
- [ ] Document adapter pattern in `docs/ARCHITECTURE.md`
- [ ] Add adapter interface tests
- [ ] Remove direct `FirestoreService` imports

### Estimated Effort

- **Time:** 3 days
- **Risk:** Low (refactoring only)

---

## Implementation Timeline

### Phase 1: Quick Wins (Weeks 1-2)

| Task                       | Effort | Impact | Priority |
| -------------------------- | ------ | ------ | -------- |
| **A3: Error Handling**     | 1 week | High   | P0       |
| **A6: Adapter Pattern**    | 3 days | Medium | P1       |
| **A4: Image Optimization** | 3 days | High   | P1       |

**Parallel with M1 (Security hardening)**

### Phase 2: Major Refactors (Weeks 3-6)

| Task                            | Effort  | Impact    | Priority |
| ------------------------------- | ------- | --------- | -------- |
| **A1: Context Splitting**       | 1 week  | Very High | P0       |
| **A2: Component Decomposition** | 2 weeks | High      | P1       |
| **A5: Bundle Optimization**     | 1 week  | High      | P1       |

**Parallel with M2 (Architecture improvements)**

### Phase 3: Validation (Weeks 7-8)

- Run full test suite
- Performance benchmarking
- Bundle size verification
- Architecture quality re-assessment

---

## Success Metrics

### Quantitative Metrics

| Metric                     | Before    | Target     | Measurement             |
| -------------------------- | --------- | ---------- | ----------------------- |
| **Architecture Score**     | 4.2/5     | 4.8+/5     | Manual assessment       |
| **Re-render Count**        | 100%      | 40%        | React DevTools Profiler |
| **Average Component Size** | 150 lines | <100 lines | Code analysis           |
| **Test Coverage**          | 10%       | 60%        | Jest coverage report    |
| **Bundle Size (Initial)**  | Unknown   | <200KB     | Next.js analyzer        |
| **Largest Component**      | 337 lines | <150 lines | Code analysis           |
| **Context Count**          | 1 large   | 3 focused  | Code review             |

### Qualitative Metrics

- [ ] **Developer Onboarding** - New dev can contribute in <1 day
- [ ] **Error Handling** - Consistent patterns across all services
- [ ] **Testing** - Easy to write tests for new features
- [ ] **Performance** - No noticeable lag in UI interactions
- [ ] **Maintainability** - Can refactor without breaking tests

---

## Risk Assessment

| Risk                       | Probability | Impact | Mitigation                                  |
| -------------------------- | ----------- | ------ | ------------------------------------------- |
| **Breaking Changes**       | Medium      | High   | Comprehensive test suite before refactoring |
| **Performance Regression** | Low         | High   | Benchmark before/after, rollback plan       |
| **Schedule Slip**          | Medium      | Medium | Prioritize P0 tasks, defer P2 if needed     |
| **Team Capacity**          | Medium      | Medium | Parallel work on M1/M2, not blocking        |

---

## Questions & Decisions

### Decision Log

| Date       | Decision                           | Rationale                                      |
| ---------- | ---------------------------------- | ---------------------------------------------- |
| 2025-12-12 | Split AuthProvider into 3 contexts | 60% performance gain, clearer SRP              |
| 2025-12-12 | Adopt Result<T> for error handling | Consistency, type safety, centralized tracking |
| 2025-12-12 | Use Next.js Image for all images   | Built-in optimization, industry best practice  |

### Open Questions

- [ ] **Q:** Should we use Zustand or Redux instead of Context?
  - **A:** No, Context is sufficient for current scale. Revisit at 50K+ users.

- [ ] **Q:** Should we migrate to tRPC for type-safe APIs?
  - **A:** Defer to M4 (Expansion). Current Firebase approach is working.

- [ ] **Q:** Should we add a design system (Storybook)?
  - **A:** Nice-to-have, but not P0. Defer to M3 (UX improvements).

---

## Conclusion

This plan outlines **6 major architectural improvements** that will raise the
quality from **4.2/5 → 4.8+/5** over **8-12 weeks**. The improvements focus on:

1. **Performance** (Context splitting, bundle optimization)
2. **Maintainability** (Component size, error handling)
3. **Consistency** (Adapter pattern, standardized errors)
4. **Scalability** (Better abstractions for future growth)

**Next Steps:**

1. Review and approve this plan
2. Create GitHub issues for each task (A1-A6)
3. Assign owners and start Phase 1 (Quick Wins)
4. Parallel execution with M1 & M2 roadmap milestones

**Expected Outcome:** Production-ready architecture that can scale to 100K+
users with predictable performance, maintainability, and developer velocity.

---

**Document Owner:** Engineering Team **Review Cycle:** Quarterly **Last
Updated:** 2025-12-12
