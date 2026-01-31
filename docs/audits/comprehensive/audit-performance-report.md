# Performance Audit Report

> **Last Updated:** 2026-01-30 **Previous Version:** 2026-01-27 **Auditor:**
> Performance Engineering Agent (Opus 4.5)

## Purpose

This document provides a comprehensive performance audit of the SoNash PWA,
analyzing Core Web Vitals, bundle optimization, React rendering patterns,
Firestore query efficiency, image optimization, caching strategies, and
performance monitoring recommendations.

---

## Executive Summary

| Severity          | Count  | Description                                          |
| ----------------- | ------ | ---------------------------------------------------- |
| **S0 (Critical)** | 3      | Immediate action required - blocking user experience |
| **S1 (High)**     | 8      | Should fix soon - significant impact on performance  |
| **S2 (Medium)**   | 9      | Plan to address - noticeable impact                  |
| **S3 (Low)**      | 6      | Nice to have - minor optimizations                   |
| **Total**         | **26** |                                                      |

### Key Performance Risks

1. **Image Assets**: 2MB+ images loaded without optimization, blocking LCP
2. **Bundle Size**: No code splitting for heavy libraries (framer-motion,
   leaflet, recharts)
3. **React Re-renders**: Only 87 memoization hooks across 375+ components
4. **No Service Worker**: No offline support or aggressive caching
5. **Firebase SDK**: Full SDK loaded eagerly instead of modular tree-shaking

---

## Findings Table

| ID           | Severity | Effort | File:Line                                                 | Impact        | Description                                                                            |
| ------------ | -------- | ------ | --------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------- |
| **PERF-001** | S0       | E2     | `/public/images/notebook-cover-blank.png`                 | LCP +2-4s     | Primary cover image is 2.0MB unoptimized PNG. Blocks First Contentful Paint.           |
| **PERF-002** | S0       | E1     | `/next.config.mjs:14-16`                                  | LCP +1-3s     | Image optimization disabled (`unoptimized: true`). All images served at original size. |
| **PERF-003** | S0       | E3     | N/A                                                       | TTI +3-5s     | No service worker for caching. Every visit fetches all assets anew.                    |
| **PERF-004** | S1       | E2     | `/components/notebook/pages/today-page.tsx:1-1200`        | Re-renders    | 23 useState/useEffect hooks in single 1200-line component. High re-render risk.        |
| **PERF-005** | S1       | E2     | `/components/maps/meeting-map.tsx:1-157`                  | Bundle +150KB | Leaflet CSS and JS not code-split. Loaded even when map not visible.                   |
| **PERF-006** | S1       | E1     | `/public/favicon.jpg`                                     | Load +200ms   | Favicon is 372KB. Should be 5-20KB max. Loaded on every page.                          |
| **PERF-007** | S1       | E2     | `/components/*/`                                          | Re-renders    | Only 87 useMemo/useCallback across 375 components. 0 React.memo wrappers found.        |
| **PERF-008** | S1       | E2     | `/lib/firebase.ts:43-96`                                  | TTI +500ms    | Firebase SDK initialized synchronously on module load. Blocks hydration.               |
| **PERF-009** | S1       | E1     | `/public/images/gemini-*.png`                             | Unused?       | 2.7MB + 1.4MB unused images in public folder. Verify if needed.                        |
| **PERF-010** | S1       | E2     | `/app/layout.tsx:86-90`                                   | Load +300ms   | reCAPTCHA script loaded on every page even when not used.                              |
| **PERF-011** | S1       | E2     | `/components/journal/entry-feed.tsx:258-373`              | Re-renders    | EntryFeed renders all entries without virtualization. O(n) for large lists.            |
| **PERF-012** | S2       | E2     | `/lib/db/meetings.ts:138-155`                             | Query cost    | `getAllMeetings()` deprecated but still available. Fetches entire collection.          |
| **PERF-013** | S2       | E1     | `/public/images/chips/*.jpg`                              | Load +500ms   | 11 chip images at 90-200KB each. No lazy loading or WebP format.                       |
| **PERF-014** | S2       | E2     | `/components/notebook/roadmap-modules.tsx:14-95`          | Bundle        | All page components imported eagerly. No route-level code splitting.                   |
| **PERF-015** | S2       | E1     | `/components/providers/auth-provider.tsx:38-49`           | Context       | Triple-nested providers cause cascading re-renders on any auth state change.           |
| **PERF-016** | S2       | E2     | `/components/notebook/notebook-shell.tsx:189-377`         | Re-renders    | Inline functions in JSX (onClick handlers) recreated every render.                     |
| **PERF-017** | S2       | E1     | `/public/pwa-icon.jpg`                                    | PWA install   | PWA icon is 380KB. Should be optimized for quick install prompt.                       |
| **PERF-018** | S2       | E2     | `/hooks/use-journal.ts:246-311`                           | Query         | Journal query runs on every auth state change. Consider stable listener.               |
| **PERF-019** | S2       | E1     | `/components/celebrations/celebration-provider.tsx:27-77` | Bundle        | Celebration overlay always mounted in DOM. Consider lazy portal.                       |
| **PERF-020** | S3       | E1     | `/lib/constants.ts:60-63`                                 | Config        | Auto-save debounce is 1s. Consider 2-3s to reduce Firestore writes.                    |
| **PERF-021** | S3       | E2     | `/components/notebook/pages/history-page.tsx:127-256`     | Re-renders    | History page re-filters on every render. Missing useMemo dependency optimization.      |
| **PERF-022** | S3       | E1     | `/app/layout.tsx:15-27`                                   | Font          | Local fonts loaded from node_modules path. Consider copying to public/fonts.           |
| **PERF-023** | S3       | E0     | `/public/manifest.json:10-20`                             | PWA           | Same icon for all sizes. Add proper 192x192 and 512x512 variants.                      |
| **PERF-024** | S3       | E2     | `/components/desktop/*.tsx`                               | Unused?       | Desktop decorative components may not be used. Verify usage.                           |
| **PERF-025** | S3       | E1     | `/lib/db/quotes.ts:33-34`                                 | Query         | Quotes fetched without limit. Add pagination for scalability.                          |
| **PERF-026** | S3       | E1     | `/components/notebook/pages/resources-page.tsx:169-172`   | Image         | External heroImage URL not validated or lazy-loaded.                                   |

---

## 1. Bundle Size & Code Splitting

### S0 - Critical: No Route-Based Code Splitting

**Impact:** Initial bundle includes ALL components (~375+ files), causing slow
TTI and FCP.

**Evidence:**

- `next.config.mjs`: Static export with `output: "export"` (no automatic code
  splitting)
- Only 2 components use `dynamic()`: `notebook-shell.tsx:24-32`
  (AccountLinkModal, SettingsPage) and `book-cover.tsx:13-21` (SignInModal,
  OnboardingWizard)
- All 8 notebook pages imported synchronously in `roadmap-modules.tsx:1-108`

**Findings:**

| File                                           | Issue                                                                                | Severity | Effort |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ | -------- | ------ |
| `/components/notebook/roadmap-modules.tsx:1-8` | Imports TodayPage, ResourcesPage, HistoryPage, GrowthPage, LibraryPage synchronously | S0       | E2     |
| `/components/notebook/notebook-shell.tsx:6-13` | Tab navigation components loaded upfront                                             | S1       | E1     |
| `/app/page.tsx:1-2`                            | Imports LampGlow and HomeClient synchronously                                        | S1       | E1     |

**Recommended Actions:**

```typescript
// components/notebook/roadmap-modules.tsx - Use dynamic imports
import dynamic from 'next/dynamic';

const TodayPage = dynamic(() => import('./pages/today-page'), {
  loading: () => <TodayPageSkeleton />,
  ssr: false
});

const HistoryPage = dynamic(() => import('./pages/history-page'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
```

**Estimated Impact:** ~40-60% reduction in initial bundle size.

---

### S1 - High: Framer Motion Library Not Tree-Shaken

**Impact:** 177 usages of framer-motion across components, adding ~50KB gzipped
to bundle.

**Evidence:**

```bash
$ grep -rn "framer-motion|motion\." components/ | wc -l
177
```

**Heavily Animated Components:**

- `notebook-shell.tsx` - Page flip animations
- `book-cover.tsx` - Book open/close
- `celebration-overlay.tsx` - Confetti/fireworks
- `journal/*` - Entry animations

**Recommended Actions:**

1. Lazy load celebration animations
2. Replace simple animations with CSS transitions
3. Consider using CSS `@keyframes` for predictable animations

---

## 2. React Rendering Optimization

### S0 - Critical: Missing Memoization in High-Frequency Components

**Impact:** Expensive re-renders on every state change, causing janky UI and
poor FID/INP.

**Evidence:**

- `useMemo`: 87 occurrences across 24 files
- `useCallback`: Included in above count
- `React.memo`: **0 occurrences** (no component memoization found)

**Findings:**

| File                 | Lines | State Variables | useEffect Hooks | Memoization | Severity |
| -------------------- | ----- | --------------- | --------------- | ----------- | -------- |
| `today-page.tsx`     | 1200  | 14              | 10              | 2 useMemo   | S0       |
| `entry-feed.tsx`     | 374   | 2               | 0               | 2 useMemo   | S1       |
| `notebook-shell.tsx` | 378   | 8               | 0               | None        | S1       |
| `book-cover.tsx`     | 379   | 4               | 2               | 1 useMemo   | S2       |

**Critical Issues in `today-page.tsx`:**

Lines 232-275 show 14 useState declarations:

```typescript
const [mood, setMood] = useState<string | null>(null);
const [cravings, setCravings] = useState<boolean | null>(null);
const [used, setUsed] = useState<boolean | null>(null);
const [journalEntry, setJournalEntry] = useState("");
const [isSaving, setIsSaving] = useState(false);
// ... 9 more state variables
```

Lines 306-318 show useMemo for checkInSteps - but many other computations are
not memoized.

**Recommended Actions:**

1. **Wrap expensive child components:**

```typescript
const CheckInQuestion = React.memo(function CheckInQuestion({ ... }) { ... });
const ToggleButton = React.memo(function ToggleButton({ ... }) { ... });
```

2. **Extract HALT_ITEMS constant outside component:**

```typescript
// Move outside TodayPage function (lines 1065-1092)
const HALT_ITEMS = [
  { key: "hungry" as const, label: "Hungry?", icon: "..." },
  // ...
] as const;
```

3. **Memoize context values in providers:**

```typescript
// auth-context.tsx
const contextValue = useMemo(
  () => ({ user, loading, isAnonymous, showLinkPrompt }),
  [user, loading, isAnonymous, showLinkPrompt]
);
```

---

### S1 - High: Context Provider Cascade

**Impact:** Triple-nested providers cause cascading re-renders.

**Evidence in `/components/providers/auth-provider.tsx:38-49`:**

```typescript
export function AuthProvider({ children }: UnifiedAuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  return (
    <AuthProviderCore onUserChange={setCurrentUser}>   // Layer 1
      <ProfileProvider user={currentUser}>              // Layer 2
        <DailyLogProvider user={currentUser}>           // Layer 3
          {children}
        </DailyLogProvider>
      </ProfileProvider>
    </AuthProviderCore>
  );
}
```

**Recommended Actions:**

1. Consider using a single combined context with selective subscriptions
2. Use `useSyncExternalStore` for cross-context state sharing
3. Implement context selectors pattern

---

## 3. Firestore Query Efficiency

### S1 - High: Deprecated getAllMeetings Still Available

**Impact:** Unbounded query fetches entire meetings collection.

**Evidence in `/lib/db/meetings.ts:138-155`:**

```typescript
/**
 * Get all meetings (DEPRECATED)
 * Use getAllMeetingsPaginated for better performance on large datasets.
 * @deprecated
 */
async getAllMeetings(): Promise<Meeting[]> {
  const snapshot = await getDocs(meetingsRef); // UNBOUNDED
  // ...
}
```

**Recommended Actions:**

1. Remove deprecated method or make it throw an error
2. Ensure all callers use `getAllMeetingsPaginated`

---

### S2 - Medium: Journal Query Stability

**Evidence in `/hooks/use-journal.ts:256-311`:**

```typescript
useEffect(() => {
  if (authLoading) return;
  if (!user) {
    setJournalLoading(false);
    // ...
  }
  // Query setup...
}, [user, authLoading]); // Re-subscribes on auth changes
```

The listener re-establishes on every auth state change, including token
refreshes.

**Recommended Actions:**

Use a stable user ID reference instead of the full user object:

```typescript
const userId = user?.uid;
useEffect(() => {
  if (!userId) return;
  // ...
}, [userId]); // Only re-subscribe when user ID changes
```

---

## 4. Image Optimization

### S0 - Critical: Unoptimized Images (9.5MB+ Total)

**Impact:** Slow LCP (3-5s on 3G), excessive bandwidth consumption.

**Evidence:**

```
File                                              Size      Status
------------------------------------------------------------
notebook-cover-blank.png                          2.0MB     CRITICAL - Used with priority
notebook-cover-transparent.png                    2.1MB     LIKELY UNUSED
gemini-generated-image-n61yzln61yzln61y.png      2.7MB     LIKELY UNUSED
gemini-generated-image-gj5efogj5efogj5e.jpeg     1.4MB     LIKELY UNUSED
favicon.jpg                                       372KB     OVERSIZED
pwa-icon.jpg                                      380KB     OVERSIZED
notebook-cover.png                                395KB
notebook-cover-photo.png                          353KB
leather-texture.jpg                               328KB
wood-table.jpg                                    225KB     LCP ELEMENT
```

**Next.js Config Issue in `/next.config.mjs:14-16`:**

```typescript
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true, // CRITICAL: Disables all image optimization
  },
};
```

**Recommended Actions:**

1. **Delete unused images:**
   - `gemini-generated-image-*.{jpeg,png}` (4.1MB total)
   - `notebook-cover-transparent.png` (2.1MB) if unused

2. **Convert to WebP:**

   ```bash
   # Install sharp and create optimization script
   npm install -D sharp
   ```

3. **Optimize favicon:**
   - Convert to ICO format
   - Resize to 32x32 (standard favicon size)
   - Target size: <20KB

4. **Preload LCP image:**
   ```html
   <link
     rel="preload"
     as="image"
     href="/images/wood-table.webp"
     fetchpriority="high"
   />
   ```

**Estimated Impact:**

- Image size: **-8MB** (from 9.5MB to ~1.5MB)
- LCP: **-2-4 seconds** improvement

---

### S2 - Medium: Chip Images Not Optimized

**Evidence in `/public/images/chips/`:**

```
chip-18mo.jpg    135KB
chip-1yr.jpg      95KB
chip-24hr.jpg    192KB
chip-2yr.jpg     190KB
chip-30.jpg       89KB
chip-60.jpg      102KB
chip-6mo.jpg     210KB
chip-90.jpg      111KB
chip-9mo.jpg      92KB
chip-multi.jpg    60KB
chip-welcome.jpg  90KB
Total: ~1.4MB
```

**Recommended Actions:**

1. Convert to WebP format
2. Implement lazy loading
3. Create responsive variants (100px, 200px widths)

---

## 5. Caching Strategies

### S0 - Critical: No Service Worker

**Impact:** PWA cannot work offline despite manifest.json.

**Evidence:**

- `/public/manifest.json` exists with PWA configuration
- No service worker file found in codebase
- No `next-pwa` or Workbox configuration

**Recommended Actions:**

1. **Install next-pwa:**

   ```bash
   npm install next-pwa
   ```

2. **Configure in next.config.mjs:**

   ```typescript
   import withPWA from "next-pwa";

   export default withPWA({
     dest: "public",
     disable: process.env.NODE_ENV === "development",
     runtimeCaching: [
       // Cache configuration...
     ],
   })(nextConfig);
   ```

3. **Implement offline fallback page**

---

### S2 - Medium: PWA Manifest Issues

**Evidence in `/public/manifest.json:10-20`:**

```json
"icons": [
  {
    "src": "/pwa-icon.jpg",
    "sizes": "192x192 512x512",  // Single file for multiple sizes
    "type": "image/jpeg"
  }
]
```

**Recommended Actions:**

1. Create separate icon files for each size
2. Add maskable icon for Android adaptive icons
3. Convert to PNG for better PWA compatibility

---

## 6. Core Web Vitals Estimates

### Predicted Metrics (3G Network)

| Metric                         | Current Estimate | Target | Gap        |
| ------------------------------ | ---------------- | ------ | ---------- |
| FCP (First Contentful Paint)   | 3-5s             | <1.8s  | -2s        |
| LCP (Largest Contentful Paint) | 6-10s            | <2.5s  | -4s+       |
| TTI (Time to Interactive)      | 8-12s            | <3.8s  | -5s+       |
| CLS (Cumulative Layout Shift)  | 0.1-0.2          | <0.1   | Acceptable |
| TBT (Total Blocking Time)      | 1-2s             | <200ms | -1s        |

### Root Causes

1. **LCP**: 2MB notebook cover image loaded with `priority={true}`
2. **TTI**: Firebase SDK + all components loaded synchronously
3. **TBT**: 177 framer-motion animations, heavy useEffect chains

---

## 7. Quick Wins (E0 - Less than 30 minutes)

| ID  | Action                               | File                      | Impact       |
| --- | ------------------------------------ | ------------------------- | ------------ |
| 1   | Delete unused gemini images          | `/public/images/`         | -4.1MB       |
| 2   | Optimize favicon to 32x32            | `/public/`                | -350KB       |
| 3   | Remove deprecated `getAllMeetings()` | `/lib/db/meetings.ts:138` | Code hygiene |
| 4   | Add proper PWA icon sizes            | `/public/manifest.json`   | PWA quality  |
| 5   | Increase auto-save debounce to 2s    | `/lib/constants.ts:61`    | Fewer writes |

---

## 8. Performance Budget Proposal

| Resource Type         | Budget | Current (Est.) | Status |
| --------------------- | ------ | -------------- | ------ |
| JavaScript (gzipped)  | <200KB | ~450KB         | OVER   |
| CSS (gzipped)         | <50KB  | ~30KB          | OK     |
| Images (initial load) | <300KB | ~2.5MB         | OVER   |
| Fonts                 | <100KB | ~50KB          | OK     |
| Total Initial Load    | <750KB | ~3MB           | OVER   |
| LCP                   | <2.5s  | ~6-10s         | OVER   |
| TTI                   | <3.8s  | ~8-12s         | OVER   |

---

## 9. Recommendations Summary

### Priority 1 - Critical (S0) - Fix This Week

| ID       | Action                                            | Effort | Impact          |
| -------- | ------------------------------------------------- | ------ | --------------- |
| PERF-001 | Convert notebook-cover to WebP, resize to 600x850 | E1     | LCP -2s         |
| PERF-002 | Enable Next.js image optimization                 | E0     | Auto-optimize   |
| PERF-003 | Implement service worker with Workbox             | E3     | Offline support |

### Priority 2 - High (S1) - Fix This Sprint

| ID       | Action                                       | Effort | Impact            |
| -------- | -------------------------------------------- | ------ | ----------------- |
| PERF-004 | Split today-page.tsx into smaller components | E3     | Reduce re-renders |
| PERF-005 | Dynamic import Leaflet/MeetingMap            | E1     | Bundle -150KB     |
| PERF-006 | Optimize favicon                             | E0     | Load -350KB       |
| PERF-007 | Add React.memo to list components            | E2     | Reduce re-renders |
| PERF-008 | Lazy initialize Firebase                     | E2     | TTI -500ms        |

### Priority 3 - Medium (S2) - Plan for Next Cycle

| ID       | Action                                     | Effort | Impact               |
| -------- | ------------------------------------------ | ------ | -------------------- |
| PERF-010 | Load reCAPTCHA only when needed            | E1     | Load -300ms          |
| PERF-011 | Implement virtual scrolling for entry feed | E3     | Handle 1000+ entries |
| PERF-012 | Remove deprecated getAllMeetings()         | E0     | Code hygiene         |
| PERF-013 | Convert chip images to WebP                | E1     | Load -400KB          |

---

## Appendix A: File Size Inventory

### Large Files (>100KB)

```
/public/images/gemini-generated-image-n61yzln61yzln61y.png  2.7MB  UNUSED?
/public/images/notebook-cover-transparent.png              2.1MB  UNUSED?
/public/images/notebook-cover-blank.png                    2.0MB  CRITICAL
/public/images/gemini-generated-image-gj5efogj5efogj5e.jpeg 1.4MB UNUSED?
/public/images/notebook-cover.png                          395KB
/public/pwa-icon.jpg                                       380KB
/public/favicon.jpg                                        372KB  CRITICAL
/public/images/notebook-cover-photo.png                    353KB
/public/images/leather-texture.jpg                         328KB
/public/images/wood-table.jpg                              225KB  LCP
/public/images/chips/chip-6mo.jpg                          210KB
/public/images/chips/chip-2yr.jpg                          190KB
/public/images/chips/chip-24hr.jpg                         190KB
```

### Component Complexity

```
/components/notebook/pages/today-page.tsx     1200 lines  23 hooks
/components/notebook/pages/resources-page.tsx  700 lines
/lib/db/meetings.ts                            627 lines  (includes seed data)
/lib/firestore-service.ts                      477 lines
/hooks/use-journal.ts                          437 lines
/components/notebook/notebook-shell.tsx        378 lines
/components/notebook/book-cover.tsx            379 lines
/components/journal/entry-feed.tsx             374 lines
```

---

## Appendix B: Dependency Analysis

### Heavy Dependencies

| Package       | Size (gzipped) | Usage Count | Tree-Shakeable |
| ------------- | -------------- | ----------- | -------------- |
| firebase      | ~200KB         | Core        | Partial        |
| framer-motion | ~100KB         | 177 usages  | Yes            |
| recharts      | ~150KB         | 1 file      | Partial        |
| leaflet       | ~140KB         | 1 file      | No             |
| date-fns      | ~20KB          | Many        | Yes            |
| lucide-react  | ~50KB          | Many        | Yes            |

---

## Version History

| Version | Date       | Changes                                                   |
| ------- | ---------- | --------------------------------------------------------- |
| 2.0     | 2026-01-30 | Updated with comprehensive analysis, added findings table |
| 1.0     | 2026-01-24 | Initial version                                           |

---

_Report generated by Performance Engineering Agent_ _Session:
claude/new-session-U1Jou_
