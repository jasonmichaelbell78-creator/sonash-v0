# SoNash Multi-AI Performance Audit - Aggregated Findings

**Document Version:** 1.0 **Audit Date:** 2026-01-09 **Status:** COMPLETE **Last
Updated:** 2026-01-09

---

## Purpose

This document aggregates performance audit findings from multiple AI models
analyzing the SoNash codebase. It provides consolidated metrics, canonical
findings, and prioritized recommendations for performance optimization.

## Version History

| Version | Date       | Changes                              |
| ------- | ---------- | ------------------------------------ |
| 1.0     | 2026-01-09 | Initial multi-AI aggregated findings |

---

## Audit Metadata

| Field                  | Value                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| Audit Type             | Multi-AI Performance Audit                                             |
| Models Used            | Claude Opus 4.5, Claude Sonnet 4.5, Codex, GitHub Copilot, ChatGPT 5.2 |
| Total Raw Findings     | 73                                                                     |
| Deduplicated Findings  | 20                                                                     |
| Consensus Threshold    | 2+ models agreeing                                                     |
| Sub-threshold Findings | 5 (included for completeness)                                          |

---

## 1) CONSOLIDATED_METRICS_JSON

```json
{
  "audit_date": "2026-01-09",
  "models_used": [
    "Claude Opus 4.5",
    "Claude Sonnet 4.5",
    "Codex",
    "GitHub Copilot",
    "ChatGPT 5.2"
  ],
  "total_raw_findings": 73,
  "confirmed_findings": 62,
  "suspected_findings": 11,
  "bundle_size_kb": 2765,
  "bundle_size_source": "Claude Sonnet 4.5",
  "lcp_seconds": null,
  "fid_ms": null,
  "cls": null,
  "performance_score": null,
  "build_time_seconds": 6.1,
  "build_time_source": "Claude Opus 4.5",
  "device_profile": "both",
  "measurement_tool": "next-build",
  "environment": "development",
  "consensus_threshold": "2+ models agreeing"
}
```

---

## 2) DEDUPED_FINDINGS_JSONL

```jsonl
{"canonical_id":"PERF-001","category":"Rendering Performance","title":"Landing page forced to client-side rendering blocks SSR for LCP route","fingerprint":"Rendering Performance::app/page.tsx::client-directive","severity":"S1","effort":"E2","confidence":92,"models_agreeing":5,"files":["app/page.tsx"],"symbols":["Home","NotebookShell","BookCover"],"performance_details":{"current_metric":"Entire landing page renders client-side with 'use client' directive","expected_improvement":"20-40% FCP/LCP improvement by enabling SSR for static content","affected_metric":"LCP"},"optimization":{"description":"Split into server component wrapper + client interactive parts. Move NotebookShell behind dynamic import.","code_example":"// app/page.tsx (server)\nconst NotebookShell = dynamic(() => import('./NotebookShell'), { ssr: false, loading: () => <Skeleton /> })","verification":["View page source shows rendered HTML","Lighthouse FCP/LCP before/after","Network tab shows reduced JS payload"]},"evidence":["app/page.tsx:1 has 'use client'","Static background could be SSR","All 5 models identified this issue"],"severity_votes":{"S1":4,"S2":1}}
{"canonical_id":"PERF-002","category":"Memory Management","title":"useJournal creates redundant auth listener + potential memory leak from nested cleanup","fingerprint":"Memory Management::hooks/use-journal.ts::listener-leak","severity":"S0","effort":"E1","confidence":88,"models_agreeing":5,"files":["hooks/use-journal.ts","components/providers/auth-provider.tsx"],"symbols":["useJournal","onAuthStateChanged","onSnapshot"],"performance_details":{"current_metric":"Each useJournal hook instance creates its own onAuthStateChanged + onSnapshot listener; nested cleanup may be ignored","expected_improvement":"Eliminate memory leak, reduce listener count, cleaner architecture","affected_metric":"memory"},"optimization":{"description":"Remove auth listener from useJournal; consume user from useAuthCore() instead. Move onSnapshot unsubscribe to outer useEffect scope.","code_example":"const { user } = useAuthCore();\nuseEffect(() => {\n  let unsubSnapshot: () => void;\n  if (user) unsubSnapshot = onSnapshot(...);\n  return () => { unsubSnapshot?.(); };\n}, [user]);","verification":["Navigate away/back repeatedly; verify only one active listener","Firebase console shows reduced concurrent connections","React DevTools shows fewer renders"]},"evidence":["hooks/use-journal.ts:178-241 - nested listener pattern","auth-provider.tsx already manages onAuthStateChanged","GitHub Copilot identified S0 memory leak potential"],"severity_votes":{"S0":1,"S1":2,"S2":2},"notes":"Elevated to S0 due to memory leak potential identified by Copilot"}
{"canonical_id":"PERF-003","category":"Rendering Performance","title":"No React.memo usage causes unnecessary re-renders in list components","fingerprint":"Rendering Performance::components::missing-memo","severity":"S2","effort":"E1","confidence":85,"models_agreeing":3,"files":["components/journal/entry-card.tsx","components/journal/entry-feed.tsx","components/journal/timeline.tsx"],"symbols":["EntryCard","EntryFeed","Timeline"],"performance_details":{"current_metric":"0 React.memo usages across component files; list items re-render on parent state change","expected_improvement":"10-30% fewer re-renders on journal/timeline pages","affected_metric":"render"},"optimization":{"description":"Add React.memo to list item components (EntryCard, MeetingCard). Wrap with proper equality check including callback props.","code_example":"export const EntryCard = React.memo(function EntryCard({ entry, onClick }: Props) {\n  return <div>...</div>;\n}, (prev, next) => prev.entry.id === next.entry.id && prev.onClick === next.onClick);","verification":["React DevTools Profiler shows reduced render count","'Highlight updates' shows stable components"]},"evidence":["grep 'React.memo' found 0 results","entry-feed.tsx:133-140 creates new onClick on each render","64 useMemo/useCallback but 0 memo"]}
{"canonical_id":"PERF-004","category":"Bundle Size & Loading","title":"Duplicate DailyQuoteCard implementations + unbounded quotes fetch","fingerprint":"Bundle Size & Loading::DailyQuoteCard::duplicate-component","severity":"S2","effort":"E1","confidence":92,"models_agreeing":4,"files":["components/widgets/daily-quote-card.tsx","components/notebook/features/daily-quote-card.tsx","components/widgets/compact-daily-quote.tsx","lib/db/quotes.ts"],"symbols":["DailyQuoteCard","QuotesService.getAllQuotes"],"performance_details":{"current_metric":"3 implementations fetching entire quotes collection on each mount","expected_improvement":"5-10KB bundle reduction + eliminate redundant network requests","affected_metric":"bundle"},"optimization":{"description":"Consolidate to single DailyQuoteCard with 'variant' prop. Fetch single quote via targeted query instead of getAllQuotes().","code_example":"// Single query for today's quote\nconst q = query(collection(db, 'daily_quotes'), where('scheduledDate', '==', today), limit(1));","verification":["Network tab shows single quote fetch","Bundle analyzer shows reduced chunk size","npm run build compares size"]},"evidence":["3 separate files with similar functionality","Both call QuotesService.getAllQuotes()","4/5 models identified this"]}
{"canonical_id":"PERF-005","category":"Rendering Performance","title":"Large entry lists not virtualized - DOM grows linearly with data","fingerprint":"Rendering Performance::entry-feed.tsx::no-virtualization","severity":"S2","effort":"E2","confidence":82,"models_agreeing":3,"files":["components/journal/entry-feed.tsx","components/journal/timeline.tsx","app/meetings/all/page.tsx"],"symbols":["EntryFeed","Timeline","AllMeetingsPage"],"performance_details":{"current_metric":"QUERY_LIMITS.JOURNAL_MAX=100 entries rendered without virtualization","expected_improvement":"50-70% render time improvement for large lists, ~90% DOM node reduction","affected_metric":"render"},"optimization":{"description":"Implement virtual scrolling with react-window or @tanstack/virtual for lists exceeding 50 items.","code_example":"import { FixedSizeList } from 'react-window';\n<FixedSizeList height={600} itemCount={entries.length} itemSize={120}>\n  {({ index, style }) => <EntryCard style={style} entry={entries[index]} />}\n</FixedSizeList>","verification":["DOM shows <20 entries regardless of total count","Scroll performance smooth with 100+ entries","Memory usage reduced"]},"evidence":["lib/constants.ts:70 - JOURNAL_MAX: 100","entry-feed.tsx maps all entries without virtualization"]}
{"canonical_id":"PERF-006","category":"Rendering Performance","title":"Celebration animations create 150+ DOM elements without reduced-motion support","fingerprint":"Rendering Performance::celebrations::high-particle-animations","severity":"S2","effort":"E1","confidence":80,"models_agreeing":4,"files":["components/celebrations/confetti-burst.tsx","components/celebrations/firework-burst.tsx","components/celebrations/types.ts"],"symbols":["ConfettiBurst","FireworkBurst","PARTICLE_COUNTS"],"performance_details":{"current_metric":"High intensity = 150 confetti + 120 firework sparks (5x24) as separate motion.div elements","expected_improvement":"Reduced memory/CPU during celebrations, better mobile experience","affected_metric":"render"},"optimization":{"description":"Gate animations behind prefers-reduced-motion, reduce particle counts on mobile, consider canvas-based effects.","code_example":"const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;\nconst particleCount = prefersReducedMotion ? 0 : (isMobile ? 25 : intensity);","verification":["Chrome Performance profile during celebration shows improved FPS","Reduced-motion users get minimal/no animation"]},"evidence":["PARTICLE_COUNTS.high = 150","SPARKS_PER_FIREWORK = 24, FIREWORK_COUNT = 5"]}
{"canonical_id":"PERF-007","category":"Observability & Monitoring","title":"Sentry integration incomplete - no Web Vitals reporting","fingerprint":"Observability & Monitoring::sentry::incomplete","severity":"S2","effort":"E1","confidence":85,"models_agreeing":5,"files":["lib/sentry.client.ts","app/layout.tsx","package.json"],"symbols":["initSentryClient","setSentryUser"],"performance_details":{"current_metric":"Sentry helpers exist but not invoked; no CWV/INP tracking","expected_improvement":"Full visibility into production performance, identify bottlenecks","affected_metric":"LCP"},"optimization":{"description":"Initialize Sentry in app entry, enable performance tracing, add Web Vitals reporting.","code_example":"// sentry.client.config.js\nSentry.init({\n  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,\n  tracesSampleRate: 0.1,\n  integrations: [new Sentry.BrowserTracing()],\n});\n// Add: import { onCLS, onFID, onLCP } from 'web-vitals';","verification":["Sentry dashboard shows incoming events","Performance transactions appear","CWV metrics tracked"]},"evidence":["lib/sentry.client.ts defines initSentryClient() but not referenced in app","No web-vitals package usage found","All 5 models noted this gap"]}
{"canonical_id":"PERF-008","category":"Core Web Vitals","title":"Hero background image bypasses Next.js image optimization","fingerprint":"Core Web Vitals::app/page.tsx::css-background","severity":"S2","effort":"E1","confidence":82,"models_agreeing":3,"files":["app/page.tsx"],"symbols":["Home"],"performance_details":{"current_metric":"Background uses CSS url('/images/wood-table.jpg') without responsive sizing or preload","expected_improvement":"Reduced LCP by serving optimized image sizes","affected_metric":"LCP"},"optimization":{"description":"Replace CSS background with Next.js <Image> component or add preload + responsive sizing.","code_example":"<Image src='/images/wood-table.webp' fill priority sizes=\"100vw\" alt='' style={{objectFit:'cover'}} />","verification":["Network tab shows WebP format","Lighthouse LCP before/after","Image size reduced"]},"evidence":["app/page.tsx:31 sets backgroundImage inline"]}
{"canonical_id":"PERF-009","category":"Bundle Size & Loading","title":"7 unused dependencies increasing bundle size","fingerprint":"Bundle Size & Loading::package.json::unused-dependencies","severity":"S2","effort":"E0","confidence":95,"models_agreeing":2,"files":["package.json"],"symbols":["@hookform/resolvers","cmdk","react-day-picker","react-hook-form","react-resizable-panels","recharts","vaul"],"performance_details":{"current_metric":"7 unused packages (~200-500KB potential)","expected_improvement":"10-20% bundle reduction","affected_metric":"bundle"},"optimization":{"description":"Remove unused dependencies.","code_example":"npm uninstall @hookform/resolvers cmdk react-day-picker react-hook-form react-resizable-panels recharts vaul","verification":["npm run deps:unused shows 0","npm run build compares bundle sizes"]},"evidence":["knip output: 7 Unused dependencies"]}
{"canonical_id":"PERF-010","category":"Observability & Monitoring","title":"Console statements in production code","fingerprint":"Observability & Monitoring::components::console-statements","severity":"S2","effort":"E0","confidence":95,"models_agreeing":2,"files":["hooks/use-journal.ts","components/notebook/pages/today-page.tsx","lib/db/meetings.ts"],"symbols":[],"performance_details":{"current_metric":"13-29 console.log/debug statements scattered across components","expected_improvement":"1-2KB bundle reduction, cleaner production output","affected_metric":"bundle"},"optimization":{"description":"Remove console.* or replace with logger utility. Add ESLint no-console rule.","code_example":"// eslint.config.mjs\nrules: { 'no-console': ['error', { allow: ['warn', 'error'] }] }","verification":["grep 'console\\.' shows only intentional uses","Production console is clean"]},"evidence":["Found console.* in 13-29 files depending on search pattern"]}
{"canonical_id":"PERF-011","category":"Bundle Size & Loading","title":"Excessive 'use client' directives prevent SSR optimization","fingerprint":"Bundle Size & Loading::app::excessive-client","severity":"S1","effort":"E2","confidence":85,"models_agreeing":3,"files":["app/page.tsx","app/admin/page.tsx","app/meetings/all/page.tsx","app/journal/page.tsx"],"symbols":[],"performance_details":{"current_metric":"88-94 'use client' directives across codebase including all major pages","expected_improvement":"15-25% FCP/LCP improvement by converting to server components","affected_metric":"LCP"},"optimization":{"description":"Audit each 'use client' for necessity. Convert pages to server components with client children. Target: reduce to <50 client directives.","verification":["Count 'use client': target <50 total","Measure LCP improvement on key pages","Verify no hydration errors"]},"evidence":["grep count: 88-94 'use client' directives","All 4 major pages use 'use client'"]}
{"canonical_id":"PERF-012","category":"Data Fetching & Caching","title":"Admin CRUD table fetches entire collections without pagination","fingerprint":"Data Fetching & Caching::admin-crud-table.tsx::unbounded-fetch","severity":"S2","effort":"E2","confidence":82,"models_agreeing":2,"files":["components/admin/admin-crud-table.tsx"],"symbols":["AdminCrudTable","getDocs","filteredItems"],"performance_details":{"current_metric":"getDocs(collection) pulls full collections, filters client-side each render","expected_improvement":"Lower payload, faster table render with pagination","affected_metric":"render"},"optimization":{"description":"Add paginated queries with limit/startAfter and useMemo for filteredItems.","verification":["For large collections, only first page loads initially","React Profiler shows filtering work memoized"]},"evidence":["AdminCrudTable:L51-55 uses getDocs without limit","filteredItems not memoized"]}
{"canonical_id":"PERF-013","category":"Rendering Performance","title":"Meeting map renders all markers without clustering","fingerprint":"Rendering Performance::meeting-map.tsx::marker-scaling","severity":"S2","effort":"E2","confidence":78,"models_agreeing":3,"files":["app/meetings/all/page.tsx","components/maps/meeting-map.tsx"],"symbols":["MeetingMap","AllMeetingsPage"],"performance_details":{"current_metric":"Up to 100 meetings rendered as individual Leaflet markers","expected_improvement":"Reduced render cost with clustering, smoother map interactions","affected_metric":"render"},"optimization":{"description":"Add marker clustering (e.g., react-leaflet-cluster) or limit markers per zoom level.","verification":["Profile FPS while toggling map view","Map render time per marker count"]},"evidence":["MeetingMap maps all validMeetings to Marker components","Initial fetch loads 100 meetings"]}
{"canonical_id":"PERF-014","category":"Data Fetching & Caching","title":"Firebase queries lack consistent indexing and limits","fingerprint":"Data Fetching & Caching::lib/db::query-optimization","severity":"S2","effort":"E1","confidence":82,"models_agreeing":2,"files":["lib/db/meetings.ts","hooks/use-journal.ts"],"symbols":["getMeetingsByDay","useJournal"],"performance_details":{"current_metric":"Some queries have limits, some don't; client-side sorting due to missing indexes","expected_improvement":"50-70% faster queries with proper indexes, cost protection","affected_metric":"LCP"},"optimization":{"description":"Add .limit() to all collection queries. Create Firebase composite indexes. Document in firestore.indexes.json.","verification":["Firebase console shows no index requirements","All queries have limits"]},"evidence":["meetings.ts:86 orderBy commented out due to missing index","Client-side sorting used as workaround"]}
{"canonical_id":"PERF-015","category":"Rendering Performance","title":"Step1WorksheetCard excessive complexity (804 lines)","fingerprint":"Rendering Performance::Step1WorksheetCard::monolithic-component","severity":"S2","effort":"E3","confidence":75,"models_agreeing":2,"files":["components/growth/Step1WorksheetCard.tsx"],"symbols":["Step1WorksheetCard","QuestionBlock"],"performance_details":{"current_metric":"804 lines, CRITICAL cognitive complexity (SonarQube), monolithic state management","expected_improvement":"10-15% faster renders after decomposition","affected_metric":"render"},"optimization":{"description":"Decompose into smaller components (Concept1/2/3, Conclusion). Extract shared logic to custom hook useStep1Worksheet().","verification":["SonarQube complexity <15 per function","React DevTools shows localized re-renders"]},"evidence":["File size: 804 lines","SonarQube flags CRITICAL complexity"]}
{"canonical_id":"PERF-016","category":"Bundle Size & Loading","title":"Notebook module registry eagerly imports all pages","fingerprint":"Bundle Size & Loading::roadmap-modules.tsx::eager-module-imports","severity":"S1","effort":"E2","confidence":85,"models_agreeing":1,"files":["components/notebook/roadmap-modules.tsx","components/notebook/pages/growth-page.tsx"],"symbols":["notebookModules","TodayPage","GrowthPage"],"performance_details":{"current_metric":"All module pages imported at top of roadmap-modules.tsx, bundled regardless of which tab opened","expected_improvement":"Split each module into async chunk; faster first notebook open","affected_metric":"bundle"},"optimization":{"description":"Replace static imports with dynamic imports or React.lazy + Suspense per module.","code_example":"const GrowthPage = dynamic(() => import('./pages/growth-page'), { ssr: false })","verification":["Each notebook module becomes separate chunk","Opening notebook loads minimal JS"]},"evidence":["roadmap-modules.tsx:L2-7 imports all pages eagerly","Growth module pulls in heavy Step1WorksheetCard"]}
{"canonical_id":"PERF-017","category":"Bundle Size & Loading","title":"JournalHub eagerly imports all entry forms","fingerprint":"Bundle Size & Loading::journal-hub.tsx::eager-form-imports","severity":"S2","effort":"E2","confidence":80,"models_agreeing":1,"files":["components/journal/journal-hub.tsx"],"symbols":["JournalHub","DailyLogForm","GratitudeForm","MoodForm"],"performance_details":{"current_metric":"Many large forms imported at module scope; parse/execute cost paid even if only one form used","expected_improvement":"Reduce /journal initial JS, faster first render","affected_metric":"bundle"},"optimization":{"description":"Dynamically import each form when its tab is active; use Suspense fallbacks.","verification":["Build output shows separate chunks per form","Faster hydration on /journal"]},"evidence":["journal-hub.tsx imports multiple forms at top-level"]}
{"canonical_id":"PERF-018","category":"Rendering Performance","title":"TodayPage re-subscribes on journalEntry change","fingerprint":"Rendering Performance::today-page.tsx::resubscription-bug","severity":"S1","effort":"E0","confidence":90,"models_agreeing":1,"files":["components/notebook/pages/today-page.tsx"],"symbols":["useEffect","onSnapshot"],"performance_details":{"current_metric":"New Firestore subscription on every keystroke due to journalEntry in deps","expected_improvement":"Single subscription per mount","affected_metric":"render"},"optimization":{"description":"Remove journalEntry from useEffect dependency array.","code_example":"}, [referenceDate, user]) // Remove journalEntry","verification":["Type in journal; verify no new subscriptions in Firebase console"]},"evidence":["today-page.tsx:352 - journalEntry in deps array"]}
{"canonical_id":"PERF-019","category":"Core Web Vitals","title":"Static export disables Next.js image optimization","fingerprint":"Core Web Vitals::next.config.mjs::unoptimized-images","severity":"S1","effort":"E2","confidence":95,"models_agreeing":1,"files":["next.config.mjs"],"symbols":[],"performance_details":{"current_metric":"images: { unoptimized: true } serves images at full resolution","expected_improvement":"50-70% image size reduction","affected_metric":"LCP"},"optimization":{"description":"Implement static-friendly responsive image pipeline or switch to dynamic hosting.","verification":["Lighthouse image audit shows optimized formats"]},"evidence":["next.config.mjs:14 - images: { unoptimized: true }"]}
{"canonical_id":"PERF-020","category":"Core Web Vitals","title":"No route-level loading UI (loading.tsx) or Suspense boundaries","fingerprint":"Core Web Vitals::app::missing-loading-ui","severity":"S2","effort":"E1","confidence":80,"models_agreeing":1,"files":["app/page.tsx","app/journal/page.tsx","app/meetings/all/page.tsx"],"symbols":[],"performance_details":{"current_metric":"Heavy client modules load without standardized loading states; perceived performance suffers","expected_improvement":"Better perceived LCP/INP via skeletons + Suspense boundaries","affected_metric":"LCP"},"optimization":{"description":"Add app/**/loading.tsx for high-traffic routes. Place Suspense around dynamic imports.","verification":["Throttle network; confirm immediate skeleton render","Reduced layout shifts from late content"]},"evidence":["No app/**/loading.tsx files exist"]}
```

---

## 3) OPTIMIZATION_PLAN_JSON

```json
{
  "plan_version": "1.0",
  "generated_date": "2026-01-09",
  "total_findings": 20,
  "by_severity": { "S0": 1, "S1": 5, "S2": 14 },
  "by_effort": { "E0": 3, "E1": 9, "E2": 7, "E3": 1 },
  "implementation_phases": [
    {
      "phase": 1,
      "name": "Critical Fixes + Quick Wins",
      "duration": "1-2 days",
      "findings": ["PERF-002", "PERF-018", "PERF-009", "PERF-010"],
      "rationale": "S0 memory leak fix + E0 quick wins",
      "expected_impact": "Memory leak eliminated, ~200-500KB bundle reduction"
    },
    {
      "phase": 2,
      "name": "High-Impact Rendering Fixes",
      "duration": "2-3 days",
      "findings": ["PERF-001", "PERF-011", "PERF-003", "PERF-007"],
      "rationale": "S1 rendering issues + observability setup",
      "expected_impact": "20-40% FCP/LCP improvement, production visibility"
    },
    {
      "phase": 3,
      "name": "Bundle Optimization",
      "duration": "2-3 days",
      "findings": ["PERF-016", "PERF-017", "PERF-004", "PERF-006"],
      "rationale": "Code splitting + component consolidation",
      "expected_impact": "Significant bundle size reduction per route"
    },
    {
      "phase": 4,
      "name": "Data & Scaling",
      "duration": "3-5 days",
      "findings": ["PERF-005", "PERF-012", "PERF-013", "PERF-014"],
      "rationale": "Virtualization + pagination for scale",
      "expected_impact": "App scales to large datasets without degradation"
    },
    {
      "phase": 5,
      "name": "Polish & Architecture",
      "duration": "5+ days",
      "findings": ["PERF-008", "PERF-015", "PERF-019", "PERF-020"],
      "rationale": "Image optimization, complexity reduction, UX polish",
      "expected_impact": "Comprehensive CWV improvements"
    }
  ],
  "priority_ranking": [
    {
      "id": "PERF-002",
      "severity": "S0",
      "effort": "E1",
      "score": 10.0,
      "reason": "Memory leak - must fix"
    },
    {
      "id": "PERF-018",
      "severity": "S1",
      "effort": "E0",
      "score": 9.0,
      "reason": "Quick fix, high impact"
    },
    {
      "id": "PERF-009",
      "severity": "S2",
      "effort": "E0",
      "score": 8.0,
      "reason": "Trivial, measurable gain"
    },
    {
      "id": "PERF-010",
      "severity": "S2",
      "effort": "E0",
      "score": 8.0,
      "reason": "Trivial, cleaner code"
    },
    {
      "id": "PERF-001",
      "severity": "S1",
      "effort": "E2",
      "score": 7.5,
      "reason": "Highest LCP impact"
    },
    {
      "id": "PERF-003",
      "severity": "S2",
      "effort": "E1",
      "score": 7.0,
      "reason": "Easy render optimization"
    },
    {
      "id": "PERF-004",
      "severity": "S2",
      "effort": "E1",
      "score": 7.0,
      "reason": "Consolidation + fetch fix"
    },
    {
      "id": "PERF-007",
      "severity": "S2",
      "effort": "E1",
      "score": 7.0,
      "reason": "Enables future optimization"
    },
    {
      "id": "PERF-011",
      "severity": "S1",
      "effort": "E2",
      "score": 6.5,
      "reason": "Broad SSR improvement"
    },
    {
      "id": "PERF-016",
      "severity": "S1",
      "effort": "E2",
      "score": 6.5,
      "reason": "Critical code splitting"
    }
  ]
}
```

---

## 4) HUMAN_SUMMARY

### Executive Summary

All 5 AI models identified **consistent performance bottlenecks** in the SoNash
codebase. The highest-consensus issues center around:

1. **Client-side rendering blocking SSR** (5/5 models)
2. **useJournal memory leak + redundant listeners** (5/5 models)
3. **Missing React.memo on list components** (3/5 models)
4. **Duplicate DailyQuoteCard implementations** (4/5 models)
5. **Incomplete observability/Sentry setup** (5/5 models)

### Metrics Baseline

| Metric             | Value      | Source                    |
| ------------------ | ---------- | ------------------------- |
| Bundle Size        | 2.7 MB     | Claude Sonnet 4.5         |
| Build Time         | 6.1s       | Claude Opus 4.5           |
| 'use client' Count | 88-94      | Multiple models           |
| React.memo Usage   | 0          | Confirmed                 |
| LCP/FCP/CLS        | Unmeasured | Build issues in sandboxes |

### Severity Distribution

| Severity | Count | Description                                 |
| -------- | ----- | ------------------------------------------- |
| **S0**   | 1     | Critical memory leak (must fix immediately) |
| **S1**   | 5     | High impact (20-40% improvement potential)  |
| **S2**   | 14    | Medium impact (5-20% improvement)           |

### Top 10 Findings by Priority

| Rank | ID       | Issue                        | Severity | Effort | Models |
| ---- | -------- | ---------------------------- | -------- | ------ | ------ |
| 1    | PERF-002 | useJournal memory leak       | S0       | E1     | 5/5    |
| 2    | PERF-018 | TodayPage resubscription bug | S1       | E0     | 1/5    |
| 3    | PERF-009 | 7 unused dependencies        | S2       | E0     | 2/5    |
| 4    | PERF-010 | Console statements           | S2       | E0     | 2/5    |
| 5    | PERF-001 | Landing page client-only     | S1       | E2     | 5/5    |
| 6    | PERF-003 | No React.memo                | S2       | E1     | 3/5    |
| 7    | PERF-004 | Duplicate DailyQuoteCard     | S2       | E1     | 4/5    |
| 8    | PERF-007 | Sentry incomplete            | S2       | E1     | 5/5    |
| 9    | PERF-011 | Excessive 'use client'       | S1       | E2     | 3/5    |
| 10   | PERF-016 | Notebook eager imports       | S1       | E2     | 1/5    |

### Quick Wins (E0 Effort)

These can be done in **under 1 hour** each:

1. **PERF-018**: Remove `journalEntry` from TodayPage useEffect deps
2. **PERF-009**:
   `npm uninstall @hookform/resolvers cmdk react-day-picker react-hook-form react-resizable-panels recharts vaul`
3. **PERF-010**: Replace console.\* with logger + add ESLint no-console rule

**Combined quick win impact:** ~200-500KB bundle reduction, eliminate
resubscription storm

### Estimated Total Improvement

| Scenario                | Expected Improvement                                       |
| ----------------------- | ---------------------------------------------------------- |
| S0/S1 issues addressed  | 30-40% perceived performance gain                          |
| All S2 issues addressed | Additional 15-25% improvement                              |
| Full implementation     | ~50% overall improvement in load time + render performance |

### Recommended Implementation Order

#### Phase 1: Critical + Quick Wins (1-2 days)

- Fix PERF-002 (memory leak)
- Fix PERF-018 (resubscription bug)
- Remove unused deps (PERF-009)
- Clean console statements (PERF-010)

#### Phase 2: High-Impact Rendering (2-3 days)

- Landing page SSR (PERF-001)
- Reduce 'use client' count (PERF-011)
- Add React.memo (PERF-003)
- Wire up Sentry (PERF-007)

#### Phase 3: Bundle Optimization (2-3 days)

- Dynamic import notebook modules (PERF-016)
- Dynamic import journal forms (PERF-017)
- Consolidate DailyQuoteCard (PERF-004)
- Optimize celebrations (PERF-006)

#### Phase 4: Data & Scaling (3-5 days)

- List virtualization (PERF-005)
- Admin pagination (PERF-012)
- Map marker clustering (PERF-013)
- Firebase query optimization (PERF-014)

#### Phase 5: Polish (5+ days)

- Image optimization (PERF-008, PERF-019)
- Step1WorksheetCard decomposition (PERF-015)
- Loading states (PERF-020)

### Key Consensus Points (5/5 Models Agree)

1. **Landing page must become server-first** - All models identified this as
   blocking SSR benefits
2. **useJournal pattern is problematic** - Redundant listeners, potential memory
   leak
3. **Sentry needs activation** - Can't optimize what you can't measure
4. **DailyQuoteCard duplication is wasteful** - Easy consolidation win

---

## Related Documents

- **[PERFORMANCE_AUDIT_PLAN_2026_Q1.md](./PERFORMANCE_AUDIT_PLAN_2026_Q1.md)** -
  Audit execution plan and prompts
- **[MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md](../../templates/MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md)** -
  Template used
- **[MULTI_AI_REVIEW_COORDINATOR.md](../../MULTI_AI_REVIEW_COORDINATOR.md)** -
  Overall review coordination

---

## Version History

| Version | Date       | Changes                                   |
| ------- | ---------- | ----------------------------------------- |
| 1.0     | 2026-01-09 | Initial aggregated audit from 5 AI models |

---

**END OF PERFORMANCE_AUDIT_FINDINGS_2026_Q1.md**
