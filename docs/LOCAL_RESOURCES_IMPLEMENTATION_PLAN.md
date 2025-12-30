# Local Recovery Resources Implementation Plan

**Feature ID:** M1.6 Phase 7
**Priority:** Medium-High
**Effort:** 6-8 SP (9-12 hours)
**Status:** 📋 Planned
**Created:** 2025-12-30

---

## Overview

Implement a comprehensive Local Recovery Resources directory in the Growth tab, providing users with access to 60+ verified Nashville recovery resources across 8 categories. Includes admin panel management similar to Meetings and Sober Living features.

**Key Value Proposition:**
- Critical access to treatment centers, housing, food banks, legal services
- GPS-based "nearby" filtering for location-aware discovery
- Admin-managed content ensures accuracy and relevance
- Fills gap between peer support (meetings) and clinical care

---

## Current State

### ✅ Completed (Dec 28, 2025)

1. **Data Aggregation** (`data/local-resources.ts`):
   - 60+ verified Nashville resources compiled
   - 8 categories defined:
     - Clinical: Detox & Crisis (13 resources)
     - Clinical: Residential Treatment (17 resources)
     - Clinical: Outpatient (IOP/PHP) (7 resources)
     - Clinical: Harm Reduction (3 resources)
     - Community: Recovery Centers (2 resources)
     - Community: Essentials (9 resources)
     - Community: Jobs & Legal (4 resources)
     - Community: Wellness (3 resources)
   - Type-safe `LocalResource` interface with coordinates

2. **Review & Validation** (`local-resources-review.md`):
   - All resources verified with checkboxes
   - Addresses, phone numbers, websites validated
   - Services categorized and documented

### 🚧 Missing Components

1. **Firestore Collection** - No `/local_resources` collection exists
2. **Service Layer** - No CRUD operations for local resources
3. **User-Facing UI** - No display component in Growth tab
4. **Admin Panel** - No CRUD interface for resource management
5. **Map Integration** - Need to extend existing map component
6. **Data Migration** - Need seeding script to populate Firestore

---

## Technical Architecture

### Data Model

**Firestore Collection:** `/local_resources/{resourceId}`

```typescript
interface LocalResource {
  id: string;
  name: string;
  category: ResourceCategory;
  locationType: 'physical' | 'hotline' | 'multi-site' | 'virtual' | 'mobile';
  services?: string[];
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  notes: string;
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Admin fields (to be added)
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string; // Admin UID
  updatedBy?: string; // Admin UID
}

type ResourceCategory =
  | 'Clinical: Detox & Crisis'
  | 'Clinical: Residential Treatment'
  | 'Clinical: Outpatient (IOP/PHP)'
  | 'Clinical: Harm Reduction'
  | 'Community: Recovery Centers'
  | 'Community: Essentials'
  | 'Community: Jobs & Legal'
  | 'Community: Wellness';
```

### Firestore Security Rules

```javascript
// /local_resources/{resourceId}
match /local_resources/{resourceId} {
  // Public read access for all authenticated users
  allow read: if request.auth != null;

  // Only admins can write
  allow create, update, delete: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### Firestore Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "local_resources",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "active", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "local_resources",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "active", "order": "ASCENDING" },
        { "fieldPath": "city", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## Implementation Plan

### Phase 1: Service Layer & Data Migration (2 hours)

**Files to Create:**

1. **`lib/db/local-resources.ts`** - Service layer (pattern: `meetings.ts`, `sober-living.ts`)

```typescript
// Key functions to implement:
export async function getAllLocalResources(): Promise<LocalResource[]>
export async function getLocalResourcesByCategory(category: ResourceCategory): Promise<LocalResource[]>
export async function getLocalResourceById(id: string): Promise<LocalResource | null>
export async function addLocalResource(data: LocalResourceInput): Promise<string>
export async function updateLocalResource(id: string, data: Partial<LocalResourceInput>): Promise<void>
export async function deleteLocalResource(id: string): Promise<void>
export async function toggleLocalResourceActive(id: string): Promise<void>
```

2. **`scripts/seed-local-resources.ts`** - One-time migration script

```typescript
// Import from data/local-resources.ts
// Add active: true, createdAt, updatedAt fields
// Batch write to Firestore /local_resources collection
// Verify count: 60+ resources
```

**Tasks:**
- [ ] Create service layer with full CRUD operations
- [ ] Add type exports for LocalResource interfaces
- [ ] Implement error handling and logging
- [ ] Create seeding script
- [ ] Run migration: `npm run seed-local-resources`
- [ ] Verify in Firebase Console: 60+ documents in `/local_resources`

**Testing:**
```bash
# Test service layer
npm test -- local-resources.test.ts

# Run seeding (one-time)
npm run seed-local-resources
```

---

### Phase 2: User-Facing UI - List View (3-4 hours)

**Files to Create:**

1. **`components/growth/local-resources-card.tsx`** - Individual resource card

```tsx
interface LocalResourceCardProps {
  resource: LocalResource;
  userLocation?: { lat: number; lng: number };
}

// Features:
// - Display name, category badge, services
// - Show address, phone, website
// - "Call" button (tel: link)
// - "Get Directions" button (Google Maps link)
// - Distance badge if userLocation provided
```

2. **`components/growth/local-resources-list.tsx`** - Filterable list

```tsx
// Features:
// - Category filter dropdown (8 categories + "All")
// - Search input (name, services)
// - Sort by: Name, Distance, Category
// - Virtual scrolling for performance (60+ items)
// - Empty state for no results
```

3. **`components/growth/local-resources-section.tsx`** - Main section component

```tsx
// Features:
// - Tab switcher: List View | Map View
// - Filter controls at top
// - Request location permission for "Nearby" sorting
// - Loading states
// - Error states
```

**Files to Modify:**

4. **`components/notebook/pages/growth-page.tsx`**

```tsx
// Add after Sober Living section:
import LocalResourcesSection from "@/components/growth/local-resources-section"

// In render:
<section className="space-y-3">
  <div className="flex items-center gap-2 mb-2">
    <div className="h-px flex-1 bg-amber-900/10" />
    <span className="text-xs font-body text-amber-900/40 uppercase tracking-widest">
      Local Resources
    </span>
    <div className="h-px flex-1 bg-amber-900/10" />
  </div>
  <LocalResourcesSection />
</section>
```

**Tasks:**
- [ ] Create resource card component
- [ ] Create filterable list component
- [ ] Create main section component with tab switcher
- [ ] Integrate into Growth page
- [ ] Add category badge styling (8 colors for 8 categories)
- [ ] Implement geolocation hook integration
- [ ] Add empty states and loading states

**UI/UX Notes:**
- **Category badges:** Use color coding (e.g., red for crisis, blue for clinical, green for community)
- **Phone links:** `tel:` protocol for one-tap calling
- **Directions:** `https://maps.google.com/?q=${lat},${lng}` or `geo:${lat},${lng}`
- **Nearby sorting:** Only show distance if user grants location permission

---

### Phase 3: User-Facing UI - Map View (1-2 hours)

**Files to Create:**

1. **`components/growth/local-resources-map.tsx`** - Map component

**Option A: Extend Existing MeetingMap**
```tsx
// Modify components/maps/meeting-map.tsx to accept generic markers
// Add LocalResource support via type union or generics
```

**Option B: Create New Component**
```tsx
// Clone and adapt meeting-map.tsx for local resources
// Simpler if map behaviors differ significantly
```

**Map Features:**
- Markers for each resource (color-coded by category)
- Info popup on marker click (name, category, services)
- "Get Directions" link in popup
- User location marker (blue dot)
- Auto-zoom to fit all visible markers
- Cluster markers when zoomed out (performance)

**Tasks:**
- [ ] Decide: Extend MeetingMap vs. create new component
- [ ] Add category-based marker colors
- [ ] Implement marker clustering for performance
- [ ] Add info popups with resource details
- [ ] Test with 60+ markers on map

**Performance Considerations:**
- Use marker clustering (e.g., `react-leaflet-markercluster`)
- Lazy load map component (already done for MeetingMap)
- Limit visible markers to 100 at a time

---

### Phase 4: Admin Panel CRUD (2-3 hours)

**Files to Create:**

1. **`components/admin/local-resources-tab.tsx`** - Admin CRUD interface

```tsx
// Features (pattern: components/admin/links-tab.tsx):
// - Table view of all resources
// - Filter by category, active status
// - Search by name
// - Add Resource dialog
// - Edit Resource dialog
// - Delete confirmation dialog
// - Active/Inactive toggle
// - Bulk actions (activate, deactivate, delete)
// - GPS coordinate validation (lat: -90 to 90, lng: -180 to 180)
// - Phone number formatting
// - URL validation for websites
```

**Files to Modify:**

2. **`components/admin/admin-panel.tsx`**

```tsx
// Add new tab:
const tabs = [
  // ...existing tabs
  { id: "local-resources", label: "Local Resources", icon: MapPin }
]

// In render:
{activeTab === "local-resources" && <LocalResourcesTab />}
```

**Tasks:**
- [ ] Create admin CRUD component (follow `links-tab.tsx` pattern)
- [ ] Add Resources tab to admin panel
- [ ] Implement form validation (coordinates, phone, URL)
- [ ] Add bulk actions (activate/deactivate multiple)
- [ ] Test CRUD operations in admin panel
- [ ] Verify Firestore rules prevent non-admin writes

**Form Validation Rules:**
- **Name:** Required, 3-100 characters
- **Category:** Required, one of 8 predefined categories
- **Location Type:** Required, one of 5 types
- **Phone:** Optional, format: `(XXX) XXX-XXXX` or `XXX-XXX-XXXX`
- **Website:** Optional, valid URL format
- **Coordinates:** Optional, lat: -90 to 90, lng: -180 to 180
- **Address:** Required if locationType is 'physical'

---

### Phase 5: Testing & Polish (1-2 hours)

**Testing Checklist:**

**User-Facing:**
- [ ] Resources display correctly in Growth tab
- [ ] Category filtering works (8 categories + All)
- [ ] Search filters by name and services
- [ ] Distance sorting works (with location permission)
- [ ] Map view displays all resources with correct markers
- [ ] "Call" and "Get Directions" buttons work
- [ ] Empty states display when no results
- [ ] Loading states display during fetch

**Admin Panel:**
- [ ] Can create new resource
- [ ] Can edit existing resource
- [ ] Can delete resource (with confirmation)
- [ ] Can toggle active/inactive status
- [ ] Form validation works (coordinates, phone, URL)
- [ ] Bulk actions work
- [ ] Non-admin users cannot access CRUD operations

**Data Integrity:**
- [ ] All 60+ resources migrated to Firestore
- [ ] No duplicate IDs
- [ ] GPS coordinates valid for all physical locations
- [ ] Phone numbers formatted consistently
- [ ] Websites accessible (spot check)

**Performance:**
- [ ] List view renders 60+ items without lag
- [ ] Map view handles 60+ markers (with clustering)
- [ ] Search/filter operations are instantaneous

**Mobile:**
- [ ] Cards display correctly on mobile
- [ ] Map gestures work (pinch-zoom, pan)
- [ ] "Call" button works on mobile (tel: protocol)
- [ ] "Get Directions" opens native maps app

---

## Acceptance Criteria

**User Stories:**

1. **As a user**, I can view local recovery resources in the Growth tab
2. **As a user**, I can filter resources by category (8 categories)
3. **As a user**, I can search resources by name or services
4. **As a user**, I can view resources on a map with category-based markers
5. **As a user**, I can sort resources by distance from my location
6. **As a user**, I can call a resource with one tap (mobile)
7. **As a user**, I can get directions to a resource (Google Maps)

8. **As an admin**, I can add new local resources
9. **As an admin**, I can edit existing resources
10. **As an admin**, I can delete resources
11. **As an admin**, I can activate/deactivate resources
12. **As an admin**, I can bulk-activate or bulk-deactivate resources

**Technical Criteria:**

- [ ] Firestore collection `/local_resources` created with 60+ documents
- [ ] Firestore security rules allow user read, admin write
- [ ] Service layer (`lib/db/local-resources.ts`) implements all CRUD operations
- [ ] Growth tab displays local resources section below sober living
- [ ] Map view uses existing map infrastructure (Leaflet)
- [ ] Admin panel has Resources tab with full CRUD interface
- [ ] All form inputs validated (phone, URL, coordinates)
- [ ] No TypeScript errors
- [ ] No ESLint warnings

---

## Dependencies & Risks

### ✅ Dependencies Met

1. **Data aggregation complete** - `data/local-resources.ts` ready
2. **Map component exists** - Can reuse `MeetingMap` with modifications
3. **Admin panel framework exists** - Follow established patterns
4. **Geolocation hook exists** - `hooks/use-geolocation.ts` already implemented

### ⚠️ Risks & Mitigations

**Risk 1: Firestore Rules Conflict with PR1**
- **Issue:** PR1 (refactoring) is also modifying Firestore rules
- **Mitigation:** Wait until PR1 complete before adding `/local_resources` rules
- **Timeline:** Dec 31+ (after App Check decision)

**Risk 2: Map Performance with 60+ Markers**
- **Issue:** Rendering 60+ markers may lag on low-end devices
- **Mitigation:** Implement marker clustering, lazy load map component
- **Fallback:** Limit visible markers to nearest 50 if performance issues

**Risk 3: GPS Coordinate Accuracy**
- **Issue:** Some resources may have incorrect coordinates
- **Mitigation:** Admin panel allows coordinate editing, add "Report Issue" button
- **Testing:** Spot-check coordinates in map view during QA

---

## Files Summary

### New Files (8 total)

1. `lib/db/local-resources.ts` - Service layer
2. `components/growth/local-resources-card.tsx` - Resource card UI
3. `components/growth/local-resources-list.tsx` - Filterable list
4. `components/growth/local-resources-map.tsx` - Map view (or extend MeetingMap)
5. `components/growth/local-resources-section.tsx` - Main section
6. `components/admin/local-resources-tab.tsx` - Admin CRUD
7. `scripts/seed-local-resources.ts` - Data migration
8. `docs/LOCAL_RESOURCES_IMPLEMENTATION_PLAN.md` - This document

### Modified Files (4 total)

1. `components/notebook/pages/growth-page.tsx` - Add resources section
2. `components/admin/admin-panel.tsx` - Add Resources tab
3. `firestore.rules` - Add `/local_resources` rules
4. `firestore.indexes.json` - Add category/city indexes
5. `components/maps/meeting-map.tsx` (optional) - Extend for LocalResource type

---

## Timeline & Effort

**Total Effort:** 9-12 hours (6-8 SP)

| Phase | Tasks | Effort | Dependencies |
|-------|-------|--------|--------------|
| **Phase 1** | Service layer + migration | 2 hours | None |
| **Phase 2** | List view UI | 3-4 hours | Phase 1 complete |
| **Phase 3** | Map view | 1-2 hours | Phase 1 complete |
| **Phase 4** | Admin panel | 2-3 hours | Phase 1 complete |
| **Phase 5** | Testing + polish | 1-2 hours | Phases 2-4 complete |

**Recommended Order:**
1. Phase 1 (service + data) - enables all other work
2. Phase 2 (list view) - core user-facing feature
3. Phase 4 (admin panel) - enables content management
4. Phase 3 (map view) - nice-to-have enhancement
5. Phase 5 (testing) - final polish

**Blocker:** Wait until PR1 complete (Firestore rules stability) - **Dec 31+**

---

## Post-Launch Enhancements

**Future Features (out of scope for M1.6):**

1. **User Reviews/Ratings** - Allow users to rate resources
2. **Favorites** - Save frequently accessed resources
3. **Share Resources** - Share via SMS/email
4. **Resource Availability** - Real-time bed availability for treatment centers
5. **Multilingual Support** - Spanish translations for Nashville's Latino recovery community
6. **Insurance Filter** - Filter by accepted insurance (TennCare, Medicaid, etc.)
7. **Walk-in Hours** - Real-time open/closed status
8. **Photos** - Add facility photos
9. **Verified Badge** - Mark resources verified by admins
10. **Resource Analytics** - Track which resources users access most

---

## Related Documentation

- **Data Source:** `data/local-resources.ts`
- **Review Checklist:** `local-resources-review.md`
- **Roadmap Entry:** `ROADMAP.md` - M1.6 Phase 7
- **Similar Features:**
  - Meetings: `lib/db/meetings.ts`, `components/notebook/pages/resources-page.tsx`
  - Sober Living: `lib/db/sober-living.ts`
  - Admin Meetings: `components/admin/meetings-tab.tsx` (if exists)
  - Admin Links: `components/admin/links-tab.tsx`

---

**Document Version:** 1.0
**Last Updated:** 2025-12-30
**Owner:** Development Team
**Status:** Ready for Implementation (waiting for PR1 completion)
