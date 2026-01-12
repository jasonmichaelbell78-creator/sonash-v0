# Unified Journal Architecture - Design Document

**Date:** December 18, 2025  
**Status:** Design Phase  
**Goal:** Consolidate all user input into a single, searchable journal system

---

## 🎯 Vision

**Single Source of Truth:** Every piece of user input (text, mood, selection,
checkbox) flows into the journal collection, creating a comprehensive,
searchable recovery timeline.

**Two-Tier Access:**

1. **Timeline View** (Visual/Emotional) - Daily scrapbook overview
2. **Deep Search View** (Clinical/Analytical) - Searchable database with
   insights

---

## 📊 Current State Analysis

### Existing Data Collections

**1. Daily Logs** (`/users/{uid}/daily_logs/{dateId}`)

```typescript
interface DailyLog {
  id: string; // "2025-12-18"
  dateId: string;
  content: string; // Recovery Notepad text
  mood: string | null;
  cravings: boolean;
  used: boolean;
  updatedAt: Timestamp;
}
```

**Used By:** Today page  
**Problem:** Isolated, not searchable with other entries

**2. Inventory Entries** (`/users/{uid}/inventoryEntries/{id}`)

```typescript
interface InventoryEntry {
  id: string;
  userId: string;
  type: "spot-check" | "night-review" | "gratitude";
  data: Record<string, any>;
  tags?: string[];
  createdAt: Timestamp;
}
```

**Used By:** Growth page (Spot Check, Night Review)  
**Problem:** Separate collection, different data model

**3. Journal Entries** (`/users/{uid}/journal/{id}`)

```typescript
type JournalEntryType =
  | "mood"
  | "gratitude"
  | "inventory"
  | "free-write"
  | "meeting-note"
  | "spot-check";
interface JournalEntry {
  id: string;
  userId: string;
  type: JournalEntryType;
  data: any;
  dateLabel: string; // "2025-12-18"
  isPrivate: boolean;
  isSoftDeleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Used By:** NEW journal page  
**Problem:** Incomplete, missing daily log data

---

## ✅ Proposed Unified Schema

### Expanded Entry Types

```typescript
export type JournalEntryType =
  // Quick Entries
  | "check-in" // Daily mood/cravings/used from Today page
  | "mood" // Standalone mood stamp
  | "gratitude" // Gratitude list

  // Written Content
  | "daily-log" // Recovery Notepad content
  | "free-write" // General notes
  | "meeting-note" // Meeting reflections

  // Structured Inventories
  | "spot-check" // Quick emotional check (feelings, absolutes, action)
  | "inventory" // Simple 4-question inventory
  | "night-review" // Full 4-step inventory (actions, traits, reflections, gratitude)

  // Future Additions (Expandable)
  | "prayer-log" // Prayer/meditation notes
  | "health-log" // Physical health tracking
  | "relationship" // Relationship check-ins
  | "trigger" // Trigger identification
  | "goal" // Goal setting/tracking
  | "milestone"; // Sobriety milestones
```

### Base Entry Interface

```typescript
interface BaseJournalEntry {
  id: string
  userId: string
  type: JournalEntryType

  // Timestamps
  createdAt: number       // Firestore timestamp in millis
  updatedAt: number
  dateLabel: string       // "2025-12-18" for grouping

  // Privacy & Lifecycle
  isPrivate: boolean      // Lock toggle
  isSoftDeleted: boolean  // Trash/recovery

  // Search & Organization
  tags: string[]          // Auto-generated + user-added
  searchableText: string  // Concatenated text for full-text search

  // Type-specific data
  data: CheckInData | MoodData | GratitudeData | DailyLogData | ... // Discriminated union
}
```

### Data Type Definitions

```typescript
// 1. CHECK-IN (from Today page toggles)
interface CheckInData {
  mood: string | null; // "😌", "😃", etc.
  moodIntensity?: number; // 1-10
  cravings: boolean;
  used: boolean;
  cleanDays?: number; // Calculated at time of entry
}

// 2. DAILY-LOG (Recovery Notepad)
interface DailyLogData {
  content: string; // Main notepad text
  wordCount: number; // For analytics
}

// 3. MOOD (Standalone stamp)
interface MoodData {
  mood: string; // Emoji
  intensity: number; // 1-10
  note?: string; // Optional context
}

// 4. GRATITUDE
interface GratitudeData {
  items: string[]; // ["My sponsor", "Coffee", "Sunshine"]
}

// 5. SPOT-CHECK (Quick emotional processing)
interface SpotCheckData {
  feelings: string[]; // Selected feelings
  absolutes: string[]; // "Always", "Never", etc.
  action: string; // Next right action
}

// 6. INVENTORY (Simple)
interface InventoryData {
  resentments: string;
  dishonesty: string;
  apologies: string;
  successes: string;
}

// 7. NIGHT-REVIEW (Comprehensive)
interface NightReviewData {
  step1_actions: Record<string, boolean>; // Prayer, reading, meeting, sponsor
  step2_traits: Record<string, number>; // Trait sliders (-5 to +5)
  step3_reflections: Record<string, string>; // 11 reflection questions
  step4_gratitude: string; // Gratitude text
  step4_surrender: string; // What to surrender
}

// 8. FREE-WRITE / MEETING-NOTE
interface NoteData {
  title: string;
  content: string;
  tags?: string[];
}

// Union type for type safety
export type JournalEntryData =
  | { type: "check-in"; data: CheckInData }
  | { type: "daily-log"; data: DailyLogData }
  | { type: "mood"; data: MoodData }
  | { type: "gratitude"; data: GratitudeData }
  | { type: "spot-check"; data: SpotCheckData }
  | { type: "inventory"; data: InventoryData }
  | { type: "night-review"; data: NightReviewData }
  | { type: "free-write"; data: NoteData }
  | { type: "meeting-note"; data: NoteData };
```

---

## 🔄 Data Migration Strategy

### Phase 1: Dual-Write (No Breaking Changes)

**Approach:** Write to BOTH old and new collections

**Today Page Changes:**

```typescript
// OLD: Only writes to daily_logs
await FirestoreService.saveDailyLog(userId, {
  content,
  mood,
  cravings,
  used,
});

// NEW: Also write to journal
await addJournalEntry(userId, {
  type: "check-in",
  data: { mood, cravings, used, cleanDays },
});

if (content.trim()) {
  await addJournalEntry(userId, {
    type: "daily-log",
    data: { content, wordCount: content.split(" ").length },
  });
}
```

**Growth Page Changes:**

```typescript
// Spot Check
await FirestoreService.saveInventoryEntry(userId, { ... }) // OLD
await addJournalEntry(userId, { type: 'spot-check', ... }) // NEW

// Night Review
await FirestoreService.saveInventoryEntry(userId, { ... }) // OLD
await addJournalEntry(userId, { type: 'night-review', ... }) // NEW
```

**Benefits:**

- No data loss
- Backward compatibility
- Can rollback if needed

### Phase 2: Migration Script (Background)

```typescript
// Migrate existing daily_logs to journal
async function migrateDailyLogs(userId: string) {
  const dailyLogs = await getDocs(collection(db, `users/${userId}/daily_logs`))

  for (const doc of dailyLogs.docs) {
    const log = doc.data() as DailyLog

    // Create check-in entry
    if (log.mood || log.cravings || log.used) {
      await addDoc(collection(db, `users/${userId}/journal`), {
        type: 'check-in',
        data: {
          mood: log.mood,
          cravings: log.cravings,
          used: log.used
        },
        dateLabel: log.dateId,
        createdAt: log.updatedAt || serverTimestamp(),
        // ... other fields
      })
    }

    // Create daily-log entry
    if (log.content?.trim()) {
      await addDoc(collection(db, `users/${userId}/journal`), {
        type: 'daily-log',
        data: { content: log.content },
        dateLabel: log.dateId,
        createdAt: log.updatedAt || serverTimestamp(),
        // ... other fields
      })
    }
  }
}

// Similar for inventoryEntries
async function migrateInventoryEntries(userId: string) { ... }
```

### Phase 3: Read from Journal (Transition)

**Update hooks to read from journal:**

```typescript
// useJournal hook gets ALL entries
const { entries } = useJournal();

// Derive daily log content
const todayLog = entries.find(
  (e) => e.dateLabel === today && e.type === "daily-log"
)?.data.content;

// Derive check-in status
const todayCheckIn = entries.find(
  (e) => e.dateLabel === today && e.type === "check-in"
)?.data;
```

### Phase 4: Deprecate Old Collections (After 30 days)

- Stop dual-writing
- Archive old collections
- Remove old Firestore service methods

---

## 🎨 UI/UX Design: Two-Tier System

### Tier 1: Timeline View (Existing, Enhanced)

**Route:** `/journal`

**Style:** Warm, visual, scrapbook-like

**Features:**

- Colored ribbons for filtering
- Entry cards with visual variety (stamps, sticky notes, etc.)
- "Today", "Yesterday", older grouping
- Floating pen for quick entry
- Click entries for detail view

**Enhancements Needed:**

1. Show check-in data (mood, cravings, used) as subtle badges
2. Display daily-log content in a "notepad" card
3. Include spot-check and night-review entries with unique styling

---

### Tier 2: Deep Search View (NEW)

**Route:** `/journal/search` or `/journal/insights`

**Style:** Clinical warmth - clean data tables with recovery color accents

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Search & Insights              [Timeline View] [Export] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🔎 Search: [________________________] [Search]       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────┐  ┌──────────────────────────────────────┐ │
│  │  FILTERS    │  │        RESULTS (142 entries)          │ │
│  │             │  │                                        │ │
│  │ Date Range  │  │  ┌──────────────────────────────────┐│ │
│  │ [From] [To] │  │  │ Dec 18 • Check-in + Daily Log   ▼││ │
│  │             │  │  │ 😌 Calm • No cravings            ││ │
│  │ Entry Type  │  │  │ "Feeling grateful today..."      ││ │
│  │ □ Check-in  │  │  └──────────────────────────────────┘│ │
│  │ □ Daily Log │  │                                        │ │
│  │ □ Mood      │  │  ┌──────────────────────────────────┐│ │
│  │ □ Gratitude │  │  │ Dec 17 • Night Review           ▼││ │
│  │ □ Inventory │  │  │ Completed all 4 steps            ││ │
│  │ □ Spot Check│  │  │ 18 traits tracked                ││ │
│  │             │  │  └──────────────────────────────────┘│ │
│  │ Mood Filter │  │                                        │ │
│  │ 😃 😌 😐 😢│  │  [Load More...]                        │ │
│  │             │  │                                        │ │
│  │ □ Cravings  │  └──────────────────────────────────────┘ │
│  │ □ Used      │                                             │
│  │             │                                             │
│  │ [Clear All] │                                             │
│  └─────────────┘                                             │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📊 INSIGHTS                                          │  │
│  │  ├─ 23 days logged this month                        │  │
│  │  ├─ Current streak: 7 days                            │  │
│  │  ├─ Most common mood: 😌 Calm (45%)                  │  │
│  │  └─ 3 days with cravings (13%)                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Color Scheme (Warm Clinical)

**Primary Colors:**

- Background: `#f9f7f4` (warm white)
- Cards: `#ffffff` with `#f0eadd` borders
- Accent: Amber/gold for highlights
- Text: `#4a3f35` (warm dark brown)

**Data Visualization:**

- Charts use recovery ribbon colors (red, green, blue, yellow, purple)
- Hover states: subtle amber glow
- Active filters: amber background

**Typography:**

- Headers: Font Heading (current handwritten)
- Data/metrics: Clean sans-serif (Inter or similar)
- Quotes/content: Font Handlee (current)

#### Search Functionality

**Full-Text Search:**

```typescript
// Search across concatenated text fields
const searchableText = [
  entry.data.content,
  entry.data.title,
  entry.data.note,
  entry.data.items?.join(" "),
  entry.data.reflections?.values().join(" "),
]
  .filter(Boolean)
  .join(" ")
  .toLowerCase();

// Client-side filter
entries.filter((e) => e.searchableText.includes(searchQuery.toLowerCase()));
```

**Advanced Filters:**

```typescript
interface SearchFilters {
  dateFrom?: Date;
  dateTo?: Date;
  types?: JournalEntryType[];
  moods?: string[];
  hasCravings?: boolean;
  hasUsed?: boolean;
  tags?: string[];
}
```

#### Export Options

**PDF Export:**

- Date range selection
- Include/exclude entry types
- Formatted with recovery styling
- Option to include charts

**CSV Export:**

- Tabular data for Excel analysis
- Columns: Date, Type, Mood, Cravings, Used, Content (truncated)

**Share with Sponsor:**

- Generate secure link with expiration
- Select specific entries or date range
- Privacy controls

---

## 🔥 Firestore Queries & Indexes

### Required Composite Indexes

**1. Timeline Query (Existing)**

```
Collection: journal (subcollection under users/{uid})
Fields: isSoftDeleted (Ascending), createdAt (Descending)
```

**2. Date Range Query**

```
Collection: journal
Fields: isSoftDeleted (Ascending), dateLabel (Ascending)
```

**3. Type + Date Query**

```
Collection: journal
Fields: type (Ascending), dateLabel (Descending)
```

**4. Mood Filter**

```
Collection: journal
Fields: type (Ascending), data.mood (Ascending), createdAt (Descending)
```

### Query Patterns

```typescript
// Get all entries for a date range
const q = query(
  collection(db, `users/${userId}/journal`),
  where("isSoftDeleted", "==", false),
  where("dateLabel", ">=", fromDate),
  where("dateLabel", "<=", toDate),
  orderBy("createdAt", "desc")
);

// Get specific entry types
const q = query(
  collection(db, `users/${userId}/journal`),
  where("type", "in", ["check-in", "daily-log"]),
  where("isSoftDeleted", "==", false),
  orderBy("createdAt", "desc")
);

// Get entries with cravings (requires data structure change)
// Note: Firestore can't query nested fields easily
// Solution: Denormalize into top-level fields
interface JournalEntry {
  // ... existing fields
  hasCravings?: boolean; // Denormalized from data.cravings
  hasUsed?: boolean; // Denormalized from data.used
  mood?: string; // Denormalized from data.mood
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal:** Update types and dual-write system

**Tasks:**

1. ✅ Update `types/journal.ts` with new entry types
2. ✅ Create helper functions for journal entry creation
3. ✅ Update Today page to dual-write (daily_logs + journal)
4. ✅ Update Growth page to dual-write (inventoryEntries + journal)
5. ✅ Add searchableText generation
6. ✅ Add denormalized fields (hasCravings, hasUsed, mood)

**Deliverables:**

- All user input flows to journal collection
- Backward compatibility maintained
- No breaking changes

### Phase 2: Enhanced Timeline (Week 2)

**Goal:** Improve visual timeline with new entry types

**Tasks:**

1. Create entry cards for check-in, daily-log, night-review
2. Update Timeline to show all unified entries
3. Enhance entry detail dialog with type-specific rendering
4. Add quick stats widget (days logged, streak)

**Deliverables:**

- Timeline shows all user activity
- Visual variety maintained
- Better daily overview

### Phase 3: Deep Search Page (Week 3-4)

**Goal:** Build clinical analysis interface

**Tasks:**

1. Create `/journal/search` route and page component
2. Build filter panel with all options
3. Implement search functionality
4. Create expandable result cards
5. Add pagination/infinite scroll
6. Build insights widget

**Deliverables:**

- Fully functional search interface
- Advanced filtering
- Data insights

### Phase 4: Analytics & Export (Week 5)

**Goal:** Add visualization and export features

**Tasks:**

1. Create charts (mood trends, streak tracking)
2. Build PDF export functionality
3. Implement CSV export
4. Add sponsor sharing feature
5. Create insights dashboard

**Deliverables:**

- Visual analytics
- Export options
- Sharing capabilities

### Phase 5: Migration & Cleanup (Week 6)

**Goal:** Transition fully to unified system

**Tasks:**

1. Run migration scripts for all users
2. Update all reads to use journal collection
3. Remove dual-write code
4. Archive old collections
5. Update documentation

**Deliverables:**

- Single source of truth active
- Old collections deprecated
- Clean codebase

---

## 📋 Technical Decisions

### Auto-Tagging System

```typescript
function generateTags(entry: JournalEntry): string[] {
  const tags: string[] = [entry.type];

  // Mood-based tags
  if (entry.mood === "😢") tags.push("sad", "difficult-day");
  if (entry.mood === "🤩") tags.push("great", "milestone");

  // Status tags
  if (entry.hasCravings) tags.push("cravings");
  if (entry.hasUsed) tags.push("relapse");

  // Content-based (NLP in future)
  if (entry.searchableText.includes("sponsor")) tags.push("sponsor");
  if (entry.searchableText.includes("meeting")) tags.push("meeting");

  // Date-based
  const date = new Date(entry.createdAt);
  tags.push(`${date.getFullYear()}`, `${date.getMonth() + 1}`);

  return [...new Set(tags)]; // Deduplicate
}
```

### Searchable Text Generation

```typescript
function generateSearchableText(entry: JournalEntry): string {
  const parts: string[] = [];

  switch (entry.type) {
    case "daily-log":
      parts.push(entry.data.content);
      break;
    case "gratitude":
      parts.push(...entry.data.items);
      break;
    case "night-review":
      parts.push(
        ...Object.values(entry.data.step3_reflections),
        entry.data.step4_gratitude,
        entry.data.step4_surrender
      );
      break;
    // ... other types
  }

  return parts.filter(Boolean).join(" ").toLowerCase().trim();
}
```

### Privacy Considerations

**Private Entries:**

- `isPrivate = true` entries require extra authentication to share
- Not included in exports by default
- Sponsor sharing requires explicit consent per entry

**Soft Delete:**

- `isSoftDeleted = true` entries hidden from UI
- Recoverable from trash for 30 days
- Permanent deletion after 30 days (Cloud Function)

---

## 🎯 Success Metrics

**User Engagement:**

- Average entries per day (goal: 3+)
- Variety of entry types used (goal: 4+ types)
- Days with at least one entry (goal: 90%)

**Feature Adoption:**

- Deep search usage (goal: 50% of users monthly)
- Export feature usage (goal: 20% of users monthly)
- Insights page views (goal: 60% of users weekly)

**Data Quality:**

- Complete daily logs (check-in + notepad) (goal: 70%)
- Night reviews completed (goal: 40%)
- Gratitude entries (goal: 50%)

---

## 🔮 Future Enhancements

### Advanced Analytics

- Sentiment analysis of text entries
- Correlation analysis (cravings vs. meetings attended)
- Predictive alerts (pattern recognition for risk)

### AI Features

- Smart suggestions based on patterns
- Auto-tagging with ML
- Weekly summaries generated by AI

### Social Features

- Anonymous group insights (aggregated data)
- Sponsor collaboration tools
- Meeting attendance tracking with others

### Integrations

- Calendar sync for meetings
- Health app integration (sleep, exercise)
- Reminder notifications (time for inventory!)

---

## ✅ Decisions Made

**Date:** December 18, 2025

1. **Night Review Form:** ✅ **Full 4-step version** - Use EXACTLY the
   NightReviewCard from growth page, save all data (actions, traits,
   reflections, gratitude)

2. **Timeline vs Search Balance:** ✅ **Option C - Group by day** in Timeline
   for clean overview, BUT Deep Search allows separation for mood tracking,
   craving analysis, etc.

3. **Privacy Default:** ✅ **ON by default** - Entries are private unless user
   explicitly makes them shareable

4. **Export Frequency:** ✅ **Hybrid** - Auto-generate weekly summaries, store
   in Reports section, user downloads on-demand

5. **Mobile vs Desktop:** ✅ **Different layouts (Option B)** - Enhanced web
   functionality with desktop-specific features, mobile gets optimized
   simplified UI

6. **Sponsor Access:** ✅ **Share links first** - Start with export/share
   functionality, add sponsor portal in Phase 2 if requested

7. **Data Retention:** ✅ **Forever + User Choice** - Keep all entries, allow
   users to manually archive/delete if desired

---

## 🖥️ Enhanced Web Functionality Brainstorm

**Goal:** Leverage desktop screen space and capabilities for power-user features
unavailable on mobile

## ✅ Next Steps

**Immediate Actions:**

1. User review and approval of this architecture
2. Answer open questions above
3. Begin Phase 1 implementation (dual-write)
4. Create Firestore indexes
5. Update TypeScript types

**First Pull Request:**

- Update `types/journal.ts` with expanded types
- Add helper functions to `hooks/use-journal.ts`
- Modify Today page to dual-write
- Add tests for new entry creation

---

**Document Version:** 1.0  
**Last Updated:** December 18, 2025  
**Status:** Awaiting user approval to proceed
