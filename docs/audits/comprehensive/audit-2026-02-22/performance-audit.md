<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Performance Audit — SoNash v0

<!-- prettier-ignore-start -->
**Audit Date:** 2026-02-22
**Auditor:** Performance Agent (claude-sonnet-4-6)
**Branch:** claude/fix-tool-use-ids-EfyvE
**Stack:** Next.js 16.1.1, React 19.2.3, Firebase 12.6.0, Tailwind CSS 4.1.9
**Scope:** Bundle size, rendering, Firestore, images, caching, Core Web Vitals, CSS, Server/Client boundaries
<!-- prettier-ignore-end -->

---

## 1. Executive Summary

| Severity  | Count  |
| --------- | ------ |
| S0        | 1      |
| S1        | 4      |
| S2        | 8      |
| S3        | 5      |
| **Total** | **18** |

The application has a solid foundation: good SSR/client split on the home page,
dynamic imports for heavy modals and maps, font loading optimized with
self-hosted `@fontsource` packages, and Firebase App Check architecture in
place. The most critical performance risk is `output: "export"` in
`next.config.mjs`, which forces full static export and disables Next.js image
optimization. Beyond that, the main concerns are framer-motion being loaded on
every client page (36 component files), multiple large unoptimized PNG images
(2–2.8 MB each), and `getAllMeetings()` being called without a limit on the
"Refresh" code path.

---

## 2. Top Findings Table

| ID   | Title                                                            | Severity | Effort | Area               |
| ---- | ---------------------------------------------------------------- | -------- | ------ | ------------------ |
| P-01 | `images.unoptimized: true` disables Next.js Image pipeline       | S0       | E2     | Image / Config     |
| P-02 | framer-motion imported in 36 non-lazy client components          | S1       | E2     | Bundle             |
| P-03 | 3 PNG images between 2–2.8 MB served uncompressed                | S1       | E1     | Image              |
| P-04 | No service worker — no offline support or asset caching          | S1       | E3     | Caching / PWA      |
| P-05 | `getAllMeetings()` called without limit on refresh path          | S1       | E1     | Firestore          |
| P-06 | `today-page.tsx` (1138 lines) — 5 separate `useEffect`s          | S2       | E2     | React rendering    |
| P-07 | `getAllSlogans()` and `getAllQuotes()` are unbounded queries     | S2       | E1     | Firestore          |
| P-08 | wood-table.jpg LCP background image not preloaded                | S2       | E0     | Core Web Vitals    |
| P-09 | `notebook-shell.tsx` mixes motion + tab switching state          | S2       | E2     | React rendering    |
| P-10 | No `React.memo` on `EntryCard` — re-renders on every feed update | S2       | E1     | React rendering    |
| P-11 | MoodSparkline fires separate Firestore read on every mount       | S2       | E1     | Firestore          |
| P-12 | Slogans/Quotes fetched without field projection                  | S2       | E1     | Firestore          |
| P-13 | `resources-page.tsx` duplicates time-parsing logic               | S3       | E1     | Bundle / Code size |
| P-14 | PWA manifest icon is JPEG, not PNG/WebP                          | S3       | E0     | PWA                |
| P-15 | Leaflet CSS imported at module level inside dynamic chunk        | S3       | E1     | CSS / Bundle       |
| P-16 | `compact-meeting-countdown.tsx` polls every 30 s                 | S3       | E0     | React rendering    |
| P-17 | `use-geolocation.ts` hook has no abort/cleanup                   | S3       | E1     | Memory             |
| P-18 | reCAPTCHA Enterprise script loaded `lazyOnload` in layout        | S3       | E0     | Bundle             |

---

## 3. Detailed Findings

### S0 — Critical

---

#### P-01 — `images.unoptimized: true` disables Next.js Image Optimization Pipeline

**File:** `next.config.mjs:12`

**Description:** The Next.js config sets `output: "export"` (static export for
Firebase Hosting) and consequently sets `images: { unoptimized: true }`. This
means:

1. `<Image>` components never generate WebP/AVIF variants.
2. No responsive `srcset` is generated — every device downloads the full
   resolution.
3. No lazy loading hints are injected by Next.js (though `loading="lazy"` can be
   set manually).
4. The 2 MB + 2.8 MB PNG notebook covers are served as-is.

**Impact:** LCP, CLS, bandwidth. On mobile connections, loading 5–6 MB of images
before the notebook opens causes significant FCP/LCP delay.

**Recommendation:** Since the project deploys to Firebase Hosting (CDN with
global edge), use a build-time image optimization step or serve images via
Firebase Storage with Cloud Storage image transforms. Short-term: compress
images manually (see P-03). Long-term: evaluate `@cloudinary/next` or a
CDN-level resize transform to restore responsive images.

**Effort:** E2 — requires image pipeline decision; immediate compression can be
done in E1.

---

### S1 — High

---

#### P-02 — framer-motion imported in 36 Client Components Without Code-Splitting

**Files:** `components/auth/`, `components/celebrations/`, `components/growth/`,
`components/journal/`, `components/notebook/`, `components/pwa/`

**Description:** `framer-motion` (v12.23.0, ~130 KB gzipped) is directly
imported in 36 component files using `"use client"`. Since all of these are
loaded eagerly through the notebook shell's tab system, the full framer-motion
bundle is included in the initial JS bundle for every route.

```tsx
// 36 files like this — none wrapped in dynamic()
import { motion, AnimatePresence } from "framer-motion";
```

Only modals (AccountLinkModal, SettingsPage, SignInModal, OnboardingWizard,
MeetingMap) are wrapped in `next/dynamic()`. The core notebook pages and entry
forms are not.

**Impact:** ~130 KB extra gzipped JS on first load, parsed synchronously before
interactivity.

**Recommendation:**

- Extract animation wrappers into a single `AnimatedWrapper` component loaded
  via `dynamic()` with `ssr: false`.
- For celebration animations (confetti, fireworks), wrap the entire
  `CelebrationOverlay` in a dynamic import — it only mounts on milestone
  triggers.
- For entry-form animations, consider CSS transitions instead (simpler, zero
  bundle cost).

**Effort:** E2

---

#### P-03 — Large Unoptimized PNG Images (2–2.8 MB each)

**Files:** `public/images/`

| File                             | Size     |
| -------------------------------- | -------- |
| `notebook-cover-blank.png`       | 2,012 KB |
| `notebook-cover-transparent.png` | 2,180 KB |
| `gemini-generated-image-*.png`   | 2,790 KB |
| `notebook-cover.png`             | 404 KB   |
| `leather-texture.jpg`            | 335 KB   |

The notebook cover (`notebook-cover-blank.png`, 2 MB) is loaded as a
`<Image fill>` with `priority` in `book-cover.tsx`. Because
`images.unoptimized: true` is set, this is served as raw PNG to every device. On
a 3G connection that is ~5+ seconds of load just for this one image.

**Impact:** Critical LCP. The cover image IS the LCP element for most users.

**Recommendation:**

1. Convert PNGs to WebP at 80% quality: `notebook-cover-blank.png` should
   compress to ~200–400 KB as WebP.
2. Delete or archive `gemini-generated-image-*.png` if not used in production
   pages.
3. Remove `notebook-cover.png` and `notebook-cover-transparent.png` if
   `notebook-cover-blank.png` covers both use cases.

**Effort:** E1 (image compression only)

---

#### P-04 — No Service Worker — No Offline Support or Asset Caching

**Files:** `public/` (no `sw.js`), `manifest.json`

**Description:** The PWA manifest is defined, the install prompt component
exists, and HSTS/cache headers are set in `firebase.json`. However, there is no
service worker. The app has no offline capability and no runtime cache for
Firestore reads.

Static assets (JS/CSS/fonts) are cached at the CDN level via
`Cache-Control: public, max-age=31536000, immutable`, which is correct. But
there is no precache for the app shell, meaning repeat visits still require a
network roundtrip before rendering.

**Impact:** Poor offline UX for a recovery app (users may need their data
without connectivity), and slower repeat-visit performance without an app shell
cache.

**Recommendation:** Add `next-pwa` (or `@ducanh2912/next-pwa`) with Workbox.
Precache the Next.js app shell. Add a `NetworkFirst` strategy for Firestore API
calls and a `CacheFirst` strategy for static assets.

**Effort:** E3

---

#### P-05 — `getAllMeetings()` Called Without Limit on the Refresh Code Path

**File:** `components/notebook/pages/resources-page.tsx:684`

```tsx
// viewMode === "date" or "all"
const data =
  viewMode === "date"
    ? await MeetingsService.getMeetingsByDay(queryDayName)
    : await MeetingsService.getAllMeetings(); // <-- unbounded, DEPRECATED
```

**Description:** `MeetingsService.getAllMeetings()` is explicitly marked
`@deprecated` in `lib/db/meetings.ts:138`, yet it is still called in
`resources-page.tsx` on the manual refresh path (`triggerRefresh`). The
paginated variant `getAllMeetingsPaginated(50)` is used for the initial load but
the refresh falls back to the unbounded query.

**Impact:** S1 — if the meetings collection grows large (1000+), this reads
every document on refresh, causing Firestore read cost spikes and slow response
times.

**Recommendation:** Replace the `getAllMeetings()` call with
`getAllMeetingsPaginated(50)` or a reset of the pagination cursor. The paginated
variant is already used elsewhere in the same file.

**Effort:** E1

---

### S2 — Medium

---

#### P-06 — `today-page.tsx` Has 5 Separate `useEffect` Blocks with Overlapping Dependencies

**File:** `components/notebook/pages/today-page.tsx` (1138 lines, 5 `useEffect`s
at lines 304, 507, 552, 680, 703, 721, 740)

**Description:** The today page has at minimum 7 `useEffect` hooks and 11+
`useState` declarations. Multiple effects depend on `user`, causing them all to
run on every auth state change. The auto-save and journal-save effects both fire
when mood/cravings/used change, with overlapping debounce timers.

The `loadWeeklyStats` call (inside a `useEffect` at line 740) fires every time
`user` changes — including on initial load — but there is no caching; the stats
are re-fetched each time the component mounts or user re-authenticates.

**Impact:** Unnecessary Firestore reads on mount, risk of cascading re-renders
when multiple state updates fire in sequence.

**Recommendation:**

- Extract the auto-save logic into a custom `useAutoSave` hook.
- Cache `weeklyStats` in `sessionStorage` or context for the session duration.
- Combine the auto-save and journal-save effects into a single effect with a
  unified debounce.

**Effort:** E2

---

#### P-07 — `getAllSlogans()` and `getAllQuotes()` Are Unbounded Firestore Queries

**Files:** `lib/db/slogans.ts:38`, `lib/db/quotes.ts:35`

```ts
// No limit() — reads entire collection
const snapshot = await getDocs(ref);
```

Both services fetch the entire collection without a limit. These are called from
admin tabs (`admin/slogans-tab.tsx`, `admin/quotes-tab.tsx`) but the pattern is
also a risk if re-used elsewhere.

**Impact:** If the collections grow to hundreds of documents (expected for a
curated recovery app), every admin page open incurs a full collection read.

**Recommendation:** Add `limit(200)` for the admin display queries. Implement
server-side filtering if quotes/slogans grow to support search-based fetching.

**Effort:** E1

---

#### P-08 — LCP Background Image (`wood-table.jpg`) Not Preloaded

**File:** `app/page.tsx:26`

```tsx
// Inline style — no <link rel="preload"> generated
style={{ backgroundImage: `url('/images/wood-table.jpg')` }}
```

**Description:** The wood table background image (230 KB) is set via CSS
`backgroundImage` inline style in a Server Component. Browsers cannot discover
CSS background images during HTML parse; they require layout to be computed
first. No `<link rel="preload">` is added.

**Impact:** LCP delay — the background is likely the LCP candidate for the
landing page. Every 100 ms delay in LCP lowers Lighthouse score and user
perception.

**Recommendation:** Add a
`<link rel="preload" as="image" href="/images/wood-table.jpg" />` in the
`<head>` via `app/layout.tsx` metadata or a `<Head>` component. Alternatively,
switch from `backgroundImage` to an `<Image>` with `priority` (though this
requires resolving P-01 first).

**Effort:** E0

---

#### P-09 — `notebook-shell.tsx` Manages Animation State and Tab State Together

**File:** `components/notebook/notebook-shell.tsx`

**Description:** `NotebookShell` holds `activeTab`, `direction`, `touchStart`,
`touchEnd`, `showSettings`, `showAccountLink`, `showSettingsPage` all in a
single component. Each tab change triggers `setDirection` and `setActiveTab`
sequentially (two state updates in one handler). While React 19 batches state
updates, the component also forces re-render of all children including the
motion wrapper, which re-calculates the 3D perspective transform.

The inline SVG noise texture in the spine
(`style={{ backgroundImage: "url(data:image/svg+xml...)" }}`) is a large data
URL (~200 chars) that is re-computed every render.

**Impact:** S2 — minor jank on tab switches on low-end devices.

**Recommendation:**

- Memoize the spine texture value outside the component (as a module-level
  const).
- Consider `useReducer` to batch direction + activeTab into a single dispatch.

**Effort:** E2

---

#### P-10 — `EntryCard` Is Not Memoized — Re-renders on Every Feed Update

**File:** `components/journal/entry-card.tsx`

**Description:** `EntryCard` receives an `entry` object prop and an `index`
prop. The `EntryFeed` parent re-renders when any entry in the `onSnapshot`
listener changes (even unrelated entries). Since `EntryCard` is not wrapped in
`React.memo`, all visible cards re-render on every Firestore update.

The `useJournal` hook uses `onSnapshot` which fires on every write. In practice,
this means every journal save causes all rendered `EntryCard` components to
re-render.

**Impact:** Noticeable on journal feeds with 20+ entries; each save triggers 20+
re-renders.

**Recommendation:** Wrap `EntryCard` in `React.memo`. Since the entry object
comes from Firestore, consider stabilizing identity with a custom comparator or
converting timestamps to primitives before passing as props.

**Effort:** E1

---

#### P-11 — `MoodSparkline` Fires a Separate Firestore Read on Every Mount

**File:** `components/notebook/visualizations/mood-sparkline.tsx:16`

**Description:** `MoodSparkline` calls `FirestoreService.getHistory(user.uid)`
inside its own `useEffect`. This fires every time the today page is visited. The
`getHistory` call fetches the last 30 `daily_logs` documents. The data is not
cached; it is re-fetched every mount.

The today page (`today-page.tsx`) also has access to `todayLog` from the
`useDailyLog` context. The history (last 7 days for the sparkline) could be
co-located with the weekly stats fetch already in `today-page.tsx`.

**Impact:** 1 extra Firestore read (30 docs) every time the today tab is opened.

**Recommendation:** Pass the history data as a prop from `today-page.tsx` to
`MoodSparkline`, or use the `weekStats` already being loaded. Alternatively,
cache the last 7 daily logs in `sessionStorage` for the session.

**Effort:** E1

---

#### P-12 — Slogans and Quotes Fetched Without Field Projection

**Files:** `lib/db/slogans.ts`, `lib/db/quotes.ts`

**Description:** Both services fetch entire documents. Slogans have fields:
`text`, `author`, `source`, `scheduledDate`, `scheduledTimeOfDay`, `createdAt`.
Quotes have additional `tags` arrays. For the display use-case (daily
quote/slogan widget), only `text`, `author`, `scheduledDate`,
`scheduledTimeOfDay` are needed.

Firestore does not support server-side field projection in the client SDK
(projection is a Cloud Firestore Admin SDK feature). However, the collection
sizes should be bounded and the documents are small, so this is lower priority.
The real issue is fetching all documents when only one is needed at a time for
display.

**Impact:** S2 — wasted bandwidth and memory when collections exceed 50 items.

**Recommendation:** For the widget use-case, cache the full slogan/quote list in
memory (or sessionStorage) after the first fetch, rather than re-fetching on
every component mount. The admin tabs already do a one-time `getAll()`, but the
widget hooks (DailySloganWidget, daily-quote-card) should share that cached
result.

**Effort:** E1

---

### S3 — Low

---

#### P-13 — `resources-page.tsx` Duplicates Time-Parsing Logic from `lib/db/meetings.ts`

**File:** `components/notebook/pages/resources-page.tsx:47–63`

**Description:** The resources page re-implements `parse12HourTime` and
`parse24HourTime` functions that are already in `lib/db/meetings.ts`. This is
dead weight in the client bundle.

**Recommendation:** Import from a shared utility in `lib/utils/time-utils.ts`.

**Effort:** E1

---

#### P-14 — PWA Manifest Icon Is JPEG

**File:** `public/manifest.json`

```json
{ "src": "/pwa-icon.jpg", "type": "image/jpeg" }
```

**Description:** The PWA spec recommends PNG or WebP for icons. JPEG does not
support transparency, which can cause rendering artifacts on Android home screen
and in Chromium PWA install dialogs. Some browsers reject JPEG icons for
maskable icon slots.

**Recommendation:** Convert `pwa-icon.jpg` to PNG (or WebP). Also add a separate
`maskable` icon variant for Android adaptive icons.

**Effort:** E0

---

#### P-15 — Leaflet CSS Imported at Module Level Inside a Dynamic Chunk

**File:** `components/maps/meeting-map.tsx:7–9`

```tsx
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
```

**Description:** `meeting-map.tsx` is correctly loaded via
`dynamic(..., { ssr: false })`. However, Leaflet's CSS imports at the top of the
module may cause Next.js to extract them into the global CSS bundle depending on
the bundler configuration. If extracted, Leaflet CSS (~8 KB) loads on every page
even when the map is never opened.

**Recommendation:** Verify in the build output (`.next/static/css/`) whether
Leaflet CSS ends up in the global bundle. If so, use a dynamic CSS import inside
a `useEffect` or move the CSS import to a dedicated Leaflet wrapper component
loaded only when the map renders.

**Effort:** E1

---

#### P-16 — `compact-meeting-countdown.tsx` Polls Every 30 Seconds

**File:** `components/widgets/compact-meeting-countdown.tsx:238`

```tsx
const interval = setInterval(updateTimer, 30000);
```

**Description:** The compact countdown widget updates every 30 seconds. For a
countdown that shows hours/minutes, updating every 60 seconds (like the
non-compact version) is sufficient. The 30-second interval causes unnecessary
re-renders during the today page session.

**Recommendation:** Change to 60,000 ms to match the full countdown widget.

**Effort:** E0

---

#### P-17 — `use-geolocation.ts` Has No Cleanup for `getCurrentPosition`

**File:** `hooks/use-geolocation.ts`

**Description:** `navigator.geolocation.getCurrentPosition` is a one-shot API
and cannot be directly cancelled, but if the hook is unmounted before the
callback fires, the stale closure will attempt to call `setState` on an
unmounted component (React 18+ suppresses the warning but React 19 may not). The
hook has no abort flag or cleanup guard.

**Recommendation:** Add an `isMounted` ref guard in the callback:

```ts
let isMounted = true;
navigator.geolocation.getCurrentPosition((pos) => {
  if (!isMounted) return;
  setLocation(pos);
});
return () => {
  isMounted = false;
};
```

**Effort:** E1

---

#### P-18 — reCAPTCHA Enterprise Script Loaded `lazyOnload` in Root Layout

**File:** `app/layout.tsx:69`

```tsx
<Script
  src={`https://www.google.com/recaptcha/enterprise.js?render=...`}
  strategy="lazyOnload"
/>
```

**Description:** `lazyOnload` loads the script after the page is fully idle.
This is correct for performance, but since App Check is currently disabled (the
code block is commented out), this external script is loaded on every page load
without serving any security purpose. Until App Check is re-enabled, this is ~60
KB of unnecessary third-party script.

**Recommendation:** Add a feature flag or env check to conditionally load the
reCAPTCHA script only when App Check is active. When App Check is disabled
(current state), skip the script load entirely.

**Effort:** E0

---

## 4. Bundle Analysis

**Large Dependencies** (estimated gzipped sizes based on known bundle profiles):

| Package                 | Est. gzip size | Notes                                             |
| ----------------------- | -------------- | ------------------------------------------------- |
| `firebase` (modular)    | ~170 KB        | Firestore + Auth + Functions. Modular SDK, good.  |
| `framer-motion`         | ~130 KB        | Loaded eagerly in 36 client components — see P-02 |
| `leaflet`               | ~45 KB         | Dynamic import via `next/dynamic` — good          |
| `react-leaflet`         | ~15 KB         | Dynamic import — good                             |
| `leaflet.markercluster` | ~30 KB         | Dynamic import — good                             |
| `recharts`              | ~85 KB         | Not used in production pages (admin-only tabs)    |
| `date-fns`              | ~25 KB         | Imported per-function (tree-shaking works well)   |
| `@radix-ui/*`           | ~30 KB total   | Modular, tree-shaken well                         |
| `lucide-react`          | ~variable      | Per-icon imports — good practice already used     |
| `@sentry/nextjs`        | ~50 KB         | Initialized on client, acceptable                 |
| `cmdk`                  | ~18 KB         | Used in command palette                           |
| `vaul`                  | ~12 KB         | Drawer component                                  |

**Recharts Note:** `recharts` (~85 KB) is imported in admin analytics
components. These are admin-only routes. If the admin panel is lazy-loaded
behind an auth guard, the recharts bundle may not land in the main chunk. Verify
in build output.

**Optimization opportunity:** If `framer-motion` usage is reduced (replacing
simple page transitions with CSS animations), the bundle could shrink by ~100 KB
gzipped.

---

## 5. Core Web Vitals Assessment

| Metric   | Risk Level | Primary Cause                                                                                      |
| -------- | ---------- | -------------------------------------------------------------------------------------------------- |
| **LCP**  | HIGH       | 2 MB cover image served unoptimized (P-03), wood-table.jpg not preloaded (P-08)                    |
| **INP**  | MEDIUM     | framer-motion JS parse on first interaction (P-02), 5 useEffects in today-page (P-06)              |
| **CLS**  | LOW        | Fonts use `display: swap` — potential FOUT shift, but fixed-height containers prevent layout shift |
| **FCP**  | MEDIUM     | Static export + CDN edge caching should deliver fast FCP. Risk: large JS parse budget              |
| **TTFB** | LOW        | Firebase Hosting with CDN provides fast TTFB globally                                              |

---

## 6. Caching Strategy Assessment

**Strengths:**

- Static assets (`js|css|png|jpg|woff2`) served with
  `max-age=31536000, immutable` — optimal
- Fonts self-hosted via `@fontsource` — no Google Fonts DNS lookup
- Firebase Lazy initialization guards against SSR re-initialization
- `useJournal` keeps `onSnapshot` open — real-time without polling

**Gaps:**

- No service worker (P-04) — no offline cache
- No in-memory cache for slogan/quote data between component mounts (P-12)
- `MoodSparkline` re-reads 30 documents on each today-page visit (P-11)
- Weekly stats re-fetched on every page mount with no session cache (P-06)

---

## 7. Server Component vs Client Component Boundaries

**Good patterns observed:**

| Pattern                                     | File                                   | Note                                        |
| ------------------------------------------- | -------------------------------------- | ------------------------------------------- |
| SSR home page with Client Interactive shell | `app/page.tsx` + `home-client.tsx`     | Correct split per CANON-0045                |
| Root layout is Server Component             | `app/layout.tsx`                       | Correct — providers only in client boundary |
| Dynamic imports for heavy modals            | `notebook-shell.tsx`, `book-cover.tsx` | Good use of code splitting                  |

**Issues observed:**

- `app/admin/layout.tsx` has `"use client"` at the top of the layout — entire
  admin subtree is client-rendered with no SSR benefit.
- The `AuthProvider` context tree
  (`AuthProvider > ProfileProvider > DailyLogProvider`) wraps the entire app,
  forcing hydration of all providers on every page. For a static-export app this
  is unavoidable, but worth noting for future architecture decisions.
- 98 components have `"use client"` — while expected for a highly interactive
  PWA, there is no intermediate Server Component layer between the notebook
  shell and individual page components. All notebook pages hydrate immediately
  when the shell mounts.

---

## 8. Recommendations Priority Order

1. **Compress images** (P-03) — highest ROI, pure content work, no code changes.
   Target: WebP conversion, ~90% size reduction for PNG covers.
2. **Add LCP preload hint** (P-08) — one-line change in `layout.tsx`, immediate
   LCP improvement.
3. **Replace deprecated `getAllMeetings()` call** (P-05) — one-line change,
   prevents Firestore cost spike.
4. **Fix the 30-second polling interval** (P-16) and **reCAPTCHA conditional
   load** (P-18) — trivial fixes.
5. **Memoize `EntryCard`** (P-10) — 30-minute change, reduces re-renders on
   every journal write.
6. **Add limit to slogans/quotes queries** (P-07) — adds `limit(200)` guard.
7. **Cache MoodSparkline data** (P-11) — pass as prop from parent or use
   sessionStorage.
8. **Evaluate framer-motion chunking** (P-02) — medium-effort, highest bundle
   impact if resolved.
9. **Add service worker** (P-04) — largest effort but critical for the PWA use
   case.
10. **Refactor today-page.tsx** (P-06) — long-term maintainability and rendering
    health.
