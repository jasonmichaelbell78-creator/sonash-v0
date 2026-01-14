# Architecture Documentation

**Document Version:** 2.0 **Last Updated:** 2026-01-02 **Status:** ACTIVE

---

## 🎯 Purpose

This document provides the **technical architecture reference** for SoNash. It
covers:

1. **System Overview** - Tech stack and infrastructure
2. **Data Architecture** - Firestore schema and data models
3. **Security Architecture** - Multi-layer security implementation
4. **Component Patterns** - Reusable code patterns

---

## 📊 Status

Current architecture is **production-ready** with:

- ✅ Firebase infrastructure complete
- ✅ Security layers implemented (App Check, Firestore Rules, Rate Limiting)
- ✅ Journal system consolidated
- ⏳ Optional Sentry integration (pending)

> **✅ Note:** Architecture improvements have been validated via the
> [INTEGRATED_IMPROVEMENT_PLAN.md](docs/archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md)
> (COMPLETE). Developer tooling (Prettier, madge, knip) is now active. Validated
> refactor items are tracked in ROADMAP.md M2.

---

## 🏛️ System Overview

SoNash is a privacy-first recovery journal app built on Firebase and Next.js,
designed to help individuals track their sobriety journey with secure, real-time
data synchronization.

### Tech Stack

| Layer              | Technology                       | Purpose                  |
| ------------------ | -------------------------------- | ------------------------ |
| **Frontend**       | Next.js 16.1 (App Router)        | React framework with SSR |
| **UI Framework**   | React 19.2.3                     | Component library        |
| **Styling**        | Tailwind CSS v4                  | Utility-first CSS        |
| **Animations**     | Framer Motion 12                 | Motion library           |
| **Type Safety**    | TypeScript 5.x                   | Static typing            |
| **Backend**        | Firebase                         | BaaS platform            |
| **Database**       | Cloud Firestore                  | NoSQL document database  |
| **Authentication** | Firebase Auth                    | User management          |
| **Functions**      | Cloud Functions v2               | Serverless compute       |
| **Security**       | App Check + reCAPTCHA Enterprise | Bot protection           |
| **Monitoring**     | Sentry (optional)                | Error tracking           |
| **Testing**        | Node test runner + c8            | Unit tests & coverage    |

---

## 📊 Data Architecture

### Firestore Schema

```
/users/{uid}
  - nickname: string
  - cleanStart: Timestamp
  - fellowship: string (AA/NA/CA/etc)
  - preferences: object
  - createdAt: Timestamp
  - updatedAt: Timestamp

/users/{uid}/daily_logs/{dateId}
  - id: string ("2025-12-19")
  - dateId: string
  - content: string (Recovery Notepad)
  - mood: string | null
  - cravings: boolean
  - used: boolean
  - updatedAt: Timestamp

/users/{uid}/journal/{entryId}
  - id: string (auto-generated)
  - type: 'mood' | 'daily-log' | 'free-write' | 'spot-check' | 'night-review' | 'gratitude'
  - content?: string
  - mood?: string
  - cravings?: boolean
  - used?: boolean
  - data?: object (for structured entries)
  - isSoftDeleted: boolean (default: false)
  - createdAt: Timestamp
  - updatedAt: Timestamp

/users/{uid}/inventoryEntries/{entryId}
  - id: string
  - userId: string
  - type: 'spot-check' | 'night-review' | 'gratitude'
  - data: object
    - For spot-check: { actionItems, absolutes }
    - For night-review: { gratitude, surrender, tomorrowPlan }
    - For gratitude: { items }
  - tags?: string[]
  - createdAt: Timestamp

/meetings/{meetingId}
  - name: string
  - fellowship: string
  - dayOfWeek: number (0-6)
  - time: string
  - address: string
  - city: string
  - state: string
  - zipCode: string
  - location: GeoPoint
  - meetingType: string[]
  - isActive: boolean
  - createdAt: Timestamp

/sober_living/{homeId}
  - name: string
  - address: string
  - city: string
  - phone: string
  - capacity: number
  - ...

/quotes/{quoteId}
  - text: string
  - author: string
  - category: string
  - createdAt: Timestamp
```

### Indexes

**firestore.indexes.json:**

```json
{
  "indexes": [
    {
      "collectionGroup": "journal",
      "queryScope": "COLLECTION",
      "fields": [{ "fieldPath": "createdAt", "order": "DESCENDING" }]
    },
    {
      "collectionGroup": "journal",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isSoftDeleted", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 🔐 Security Architecture

### Authentication Flow

```
1. User visits app
   ↓
2. Firebase Auth initializes
   ↓
3. Check for existing session
   ↓
4a. Existing user → Load profile
4b. New user → Anonymous auth → Onboarding
   ↓
5. User can upgrade anonymous → permanent (email/Google)
```

### Authorization Layers

**Layer 1: Transport (TLS 1.3)**

- All connections encrypted
- Certificate pinning via Firebase SDK

**Layer 2: App Check**

- reCAPTCHA Enterprise verification
- Blocks bots and automated attacks
- Required for production Firestore access

**Layer 3: Authentication**

- Firebase Auth tokens (JWT)
- Anonymous auth for privacy
- Permanent auth via email/Google OAuth

**Layer 4: Firestore Security Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // User profile - owner only
    match /users/{uid} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid;

      // Daily logs - owner only, date validation
      match /daily_logs/{logId} {
        allow read, write: if request.auth != null
                           && request.auth.uid == uid
                           && logId.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$');
      }

      // Journal entries - owner only, soft delete support
      match /journal/{entryId} {
        allow read: if request.auth != null
                    && request.auth.uid == uid;
        allow create, update: if request.auth != null
                              && request.auth.uid == uid
                              && request.resource.data.keys().hasAll(['type', 'createdAt']);
      }

      // Inventory entries - owner only
      match /inventoryEntries/{entryId} {
        allow read, write: if request.auth != null
                           && request.auth.uid == uid;
      }
    }

    // Meetings - read-only for authenticated users
    match /meetings/{meetingId} {
      allow read: if request.auth != null;
      allow write: if false; // Admin-only via Cloud Functions
    }

    // Admin-managed collections
    match /sober_living/{id} {
      allow read: if request.auth != null;
    }

    match /quotes/{id} {
      allow read: if request.auth != null;
    }
  }
}
```

**Layer 5: Application Validation**

- Client-side: `lib/security/firestore-validation.ts`
- Server-side: Zod schemas in Cloud Functions
- Path validation: Prevents traversal attacks
- User scope enforcement

**Layer 6: Rate Limiting**

- Cloud Functions: 10 requests/minute per user
- Tracked by authenticated UID
- 429 status code if exceeded

**Layer 7: Monitoring**

- Sentry error tracking
- Audit logging (GCP Cloud Logging)
- Security event types:
  - AUTH_FAILURE
  - RATE_LIMIT_EXCEEDED
  - APP_CHECK_FAILURE
  - VALIDATION_FAILURE
  - AUTHORIZATION_FAILURE

### Data Classification

| Level                      | Data Types                           | Protection                                   |
| -------------------------- | ------------------------------------ | -------------------------------------------- |
| **Red** (Highly Sensitive) | Inventories, daily logs, spot checks | Encrypted at rest, owner-only, audit logging |
| **Yellow** (Sensitive)     | Profile, gratitude, preferences      | Owner-only access, encrypted at rest         |
| **Green** (Public)         | Meetings, quotes                     | Authenticated read-only                      |

---

## 🎨 UI Architecture

### Component Hierarchy

```
App
├── Layout (fonts, theme, providers)
│   ├── AuthProvider (Firebase Auth context)
│   ├── ThemeProvider (dark mode, future)
│   └── Toaster (notifications)
│
├── HomePage (book cover)
│   └── BookCover
│       ├── LampGlow
│       ├── SobrietyChip
│       └── Pencil
│
└── NotebookShell (opened notebook)
    ├── RibbonNav (tab navigation)
    ├── NotebookPage (active tab)
    │   ├── TodayPage
    │   │   ├── MoodSelector
    │   │   ├── CravingTracker
    │   │   ├── UsedTracker
    │   │   └── RecoveryNotepad
    │   │
    │   ├── JournalHub
    │   │   ├── RibbonNav (filters)
    │   │   └── Timeline
    │   │       └── EntryCard[] (mood stamp, sticker, note)
    │   │
    │   ├── GrowthPage
    │   │   ├── SpotCheckCard
    │   │   ├── NightReviewCard
    │   │   └── GratitudeCard
    │   │
    │   ├── ResourcesPage
    │   └── SupportPage
    │
    └── FloatingPen (journal quick-add)
```

### State Management

**Global State (React Context):**

- `AuthContext` - User authentication state
- `ThemeContext` - Dark mode preferences (future)

**Local State (useState, useReducer):**

- Component-level UI state
- Form inputs
- Temporary data

**Server State (Firebase Realtime):**

- Firestore real-time listeners
- Automatic sync across devices
- Optimistic UI updates

**Custom Hooks:**

- `useAuth()` - Authentication helpers
- `useJournal()` - Journal CRUD operations
- `useGeolocation()` - Location services
- `useSpeechRecognition()` - Voice input

---

## 📝 Journal System Architecture

### Design Principles

**Single Source of Truth:**

- All user input flows to `/users/{uid}/journal`
- Unified timeline of recovery journey
- Searchable, filterable, exportable

**Entry Types:**

| Type           | Visual Style            | Use Case         | Data Structure                                     |
| -------------- | ----------------------- | ---------------- | -------------------------------------------------- |
| `mood`         | 🎫 Stamp (red dashed)   | Mood selection   | `{ mood: string }`                                 |
| `daily-log`    | 🏷️ Sticker (sky blue)   | Cravings/used    | `{ cravings: boolean, used: boolean }`             |
| `free-write`   | 📝 Sticky note (yellow) | Recovery notepad | `{ content: string }`                              |
| `spot-check`   | 🚨 Crisis card          | Spot check       | `{ data: { actionItems, absolutes } }`             |
| `night-review` | 🌙 Review card          | Night review     | `{ data: { gratitude, surrender, tomorrowPlan } }` |
| `gratitude`    | ✨ Gratitude card       | Gratitude list   | `{ data: { items: string[] } }`                    |

### Data Flow

```
User Input (Today/Growth tabs)
        ↓
  Debounced Save (1-2 seconds)
        ↓
  Duplicate Check (content hash + lock)
        ↓
  firestore-service.ts
        ↓
  saveNotebookJournalEntry()
        ↓
  Firestore: /users/{uid}/journal/{id}
        ↓
  Real-time Listener (Timeline component)
        ↓
  Filter & Sort (ribbon-nav.tsx)
        ↓
  Render EntryCard[]
```

### Deduplication Strategy

**Problem:** User typing triggers multiple saves → duplicate entries

**Solution:**

```typescript
// today-page.tsx
const lastJournalContentRef = useRef<string>("");
const journalSaveInProgressRef = useRef<boolean>(false);

useEffect(() => {
  // Debounce 2 seconds
  const timer = setTimeout(async () => {
    const currentContent = JSON.stringify({ mood, cravings, used, content });

    // Skip if content unchanged or save in progress
    if (
      currentContent === lastJournalContentRef.current ||
      journalSaveInProgressRef.current
    ) {
      return;
    }

    journalSaveInProgressRef.current = true;
    lastJournalContentRef.current = currentContent;

    await saveToJournal();

    journalSaveInProgressRef.current = false;
  }, 2000);

  return () => clearTimeout(timer);
}, [mood, cravings, used, content]);
```

### Dual Save Pattern (Growth Tab)

**Problem:** Inventories need archival storage + timeline visibility

**Solution:**

```typescript
// SpotCheckCard.tsx
const handleSubmit = async () => {
  // Save 1: Archive in inventoryEntries
  await saveInventoryEntry(userId, {
    type: "spot-check",
    data: { actionItems, absolutes },
  });

  // Save 2: Display in journal timeline
  await saveNotebookJournalEntry(userId, {
    type: "spot-check",
    data: { actionItems, absolutes },
  });
};
```

**Benefits:**

- Structured queries on `inventoryEntries` (reporting, analytics)
- Unified timeline in `journal` (user-facing)
- Data duplication acceptable (storage is cheap, UX is priceless)

---

## 🔧 Cloud Functions Architecture

### Function Structure

```
functions/
├── src/
│   ├── index.ts              # Function exports
│   ├── journal/
│   │   └── validators.ts     # Zod schemas
│   ├── admin/
│   │   └── setAdminClaim.ts  # Admin privilege management
│   └── utils/
│       ├── rateLimiter.ts    # Rate limiting
│       └── logger.ts         # Structured logging
└── package.json
```

### Rate Limiting Implementation

```typescript
// rateLimiter.ts
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string, limit = 10): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (userLimit.count >= limit) {
    return false; // Rate limit exceeded
  }

  userLimit.count++;
  return true;
}
```

### Validation Pattern

```typescript
// validators.ts
import { z } from "zod";

export const JournalEntrySchema = z.object({
  type: z.enum([
    "mood",
    "daily-log",
    "free-write",
    "spot-check",
    "night-review",
    "gratitude",
  ]),
  content: z.string().max(10000).optional(),
  mood: z.string().optional(),
  cravings: z.boolean().optional(),
  used: z.boolean().optional(),
  data: z.record(z.any()).optional(),
});

// In Cloud Function
export const createJournalEntry = onCall(async (request) => {
  const { auth, data } = request;

  // Validate authentication
  if (!auth) throw new HttpsError("unauthenticated", "Must be logged in");

  // Validate rate limit
  if (!checkRateLimit(auth.uid)) {
    throw new HttpsError("resource-exhausted", "Rate limit exceeded");
  }

  // Validate schema
  const validatedData = JournalEntrySchema.parse(data);

  // Business logic
  await firestore
    .collection("users")
    .doc(auth.uid)
    .collection("journal")
    .add({
      ...validatedData,
      createdAt: FieldValue.serverTimestamp(),
    });

  return { success: true };
});
```

---

## 🎯 Performance Optimizations

### Firestore Query Optimization

**Indexes:** All queries have composite indexes defined in
`firestore.indexes.json`

**Query patterns:**

```typescript
// Good: Indexed query with limit
const entries = await getDocs(
  query(
    collection(db, `users/${uid}/journal`),
    where("isSoftDeleted", "==", false),
    orderBy("createdAt", "desc"),
    limit(50) // Always limit!
  )
);

// Bad: No limit, fetches all documents
const entries = await getDocs(
  query(collection(db, `users/${uid}/journal`), orderBy("createdAt", "desc"))
);
```

### Client-Side Caching

**Real-time listeners:**

```typescript
// timeline.tsx
useEffect(() => {
  const q = query(
    collection(db, `users/${userId}/journal`),
    where("isSoftDeleted", "==", false),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  // Firestore SDK automatically caches results
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setEntries(entries);
  });

  return unsubscribe;
}, [userId]);
```

### Code Splitting

**Next.js automatic:**

- Each page is a separate bundle
- Components lazy-loaded on demand
- Tree-shaking removes unused code

**Manual lazy loading:**

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // Disable server-side rendering if needed
});
```

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/images/notebook.jpg"
  alt="Notebook"
  width={800}
  height={600}
  quality={85}
  priority // For above-the-fold images
  placeholder="blur" // For better UX
/>
```

---

## 🧩 Design Patterns

### Repository Pattern

**firestore-service.ts:**

```typescript
export class FirestoreService {
  // User profile operations
  async getUserProfile(userId: string): Promise<UserProfile | null> {...}
  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {...}

  // Journal operations
  async saveNotebookJournalEntry(userId: string, entry: JournalEntry): Promise<string> {...}
  async getJournalEntries(userId: string, limit: number): Promise<JournalEntry[]> {...}
  async softDeleteJournalEntry(userId: string, entryId: string): Promise<void> {...}

  // Inventory operations
  async saveInventoryEntry(userId: string, entry: InventoryEntry): Promise<string> {...}
}
```

**Benefits:**

- Centralized data access logic
- Easy to test (mock the service)
- Consistent error handling
- Single source of truth for queries

### Custom Hooks Pattern

**useJournal.ts:**

```typescript
export function useJournal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToJournal(user.uid, (newEntries) => {
      setEntries(newEntries);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addEntry = async (entry: Partial<JournalEntry>) => {
    await firestoreService.saveNotebookJournalEntry(user!.uid, entry);
  };

  return { entries, loading, addEntry };
}
```

**Benefits:**

- Reusable logic across components
- Encapsulates Firebase complexity
- Easier testing
- Separation of concerns

### Error Boundary Pattern

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

---

## 📚 Related Documentation

- **Product:** [ROADMAP.md](./ROADMAP.md)
- **Development:** [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Security:** [docs/SECURITY.md](./docs/SECURITY.md)
- **Testing:** [docs/TESTING_PLAN.md](./docs/TESTING_PLAN.md)
- **Incident Response:**
  [docs/INCIDENT_RESPONSE.md](./docs/INCIDENT_RESPONSE.md)

---

## 📝 Update Triggers

**Update this document when:**

- Adding new Firebase collections or schemas
- Changing security architecture or rules
- Adding new component patterns
- Modifying tech stack (adding/removing dependencies)
- Changing data flow or system architecture

---

## 🤖 AI Instructions

When working with this architecture:

1. **Follow established patterns** documented in Component Patterns section
2. **Check security constraints** before adding new data paths
3. **Update schemas** in this doc when modifying Firestore structure
4. **Test security rules** after any changes to data architecture
5. **Document new patterns** when creating reusable components

---

## 🗓️ Version History

| Version | Date       | Changes                                           |
| ------- | ---------- | ------------------------------------------------- |
| 2.0     | 2026-01-02 | Standardized structure per Phase 3 migration      |
| 1.2     | 2025-12-19 | Consolidated from multiple architecture documents |
| 1.1     | 2025-12-18 | Journal system refactor completed                 |
| 1.0     | 2025-12-17 | Security hardening documentation added            |
