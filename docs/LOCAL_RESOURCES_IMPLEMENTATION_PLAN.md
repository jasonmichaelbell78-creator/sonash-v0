# Local Recovery Resources Implementation Plan

**Document Version**: 2.0 **Created**: 2025-12-30 **Last Updated**: 2026-01-02
**Status**: PLANNING **Overall Completion**: 20% (2/10 tasks - data aggregation
& review complete) **Target Completion**: Q1 2026

---

## 📋 Purpose & Scope

### What This Plan Covers

This document provides the complete planning, tracking, and implementation guide
for the Local Recovery Resources feature.

**Primary Goal**: Implement a comprehensive Local Recovery Resources directory
in the Growth tab, providing users with access to 60+ verified Nashville
recovery resources across 8 categories.

**Scope**:

- ✅ **In Scope**:
  - Firestore collection and service layer
  - User-facing list and map views in Growth tab
  - Admin panel CRUD interface
  - GPS-based "nearby" filtering
  - Data migration from existing `data/local-resources.ts`
- ❌ **Out of Scope**:
  - User reviews/ratings
  - Real-time bed availability
  - Insurance filtering
  - Multilingual support

**Related To**:

- [M1.6 Admin Panel](../ROADMAP.md#m16---admin-panel--today-page-enhancement)
- Meetings feature (`lib/db/meetings.ts`)
- Sober Living feature (`lib/db/sober-living.ts`)

**Key Value Proposition**:

- Critical access to treatment centers, housing, food banks, legal services
- GPS-based "nearby" filtering for location-aware discovery
- Admin-managed content ensures accuracy and relevance
- Fills gap between peer support (meetings) and clinical care

---

## Quick Start

1. Review implementation phases
2. Check current milestone progress
3. Follow phase-specific tasks

---

## 🗺️ STATUS DASHBOARD

| Task/Phase                 | ID   | Description                                   | Status          | Est. Hours | Dependencies     |
| -------------------------- | ---- | --------------------------------------------- | --------------- | ---------- | ---------------- |
| **Phase 0: Data Prep**     |      |                                               |                 |            |                  |
| Data Aggregation           | T0.1 | Compile 60+ Nashville resources               | **✅ COMPLETE** | 4h         | None             |
| Review & Validation        | T0.2 | Verify addresses, phones, websites            | **✅ COMPLETE** | 2h         | T0.1             |
| **Phase 1: Service Layer** |      |                                               |                 |            |                  |
| Firestore Collection       | T1.1 | Create `/local_resources` collection          | **PENDING**     | 0.5h       | PR1 complete     |
| Service Layer              | T1.2 | CRUD operations (`lib/db/local-resources.ts`) | **PENDING**     | 1h         | T1.1             |
| Seed Script                | T1.3 | Migration script to populate Firestore        | **PENDING**     | 0.5h       | T1.2             |
| **Phase 2: User UI**       |      |                                               |                 |            |                  |
| List View                  | T2.1 | Filterable list in Growth tab                 | **PENDING**     | 3h         | T1.3             |
| Map View                   | T2.2 | Map with category-coded markers               | **PENDING**     | 2h         | T1.3             |
| **Phase 3: Admin**         |      |                                               |                 |            |                  |
| Admin Tab                  | T3.1 | CRUD interface in admin panel                 | **PENDING**     | 2.5h       | T1.2             |
| **Phase 4: Polish**        |      |                                               |                 |            |                  |
| Testing                    | T4.1 | E2E testing, mobile verification              | **PENDING**     | 1.5h       | T2.1, T2.2, T3.1 |

**Progress Summary**:

- **Completed**: 2 tasks (20%)
- **In Progress**: 0 tasks
- **Blocked**: 8 tasks (waiting for Documentation Standardization)
- **Not Started**: 0 tasks

**Timeline**:

- **Data Prep Completed**: 2025-12-28
- **Current Sprint**: N/A (blocked)
- **Target Completion**: Q1 2026
- **Actual Completion**: TBD

---

## 🎯 Current State

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

| Component            | Status     | Notes                                     |
| -------------------- | ---------- | ----------------------------------------- |
| Firestore Collection | ❌ Missing | No `/local_resources` collection exists   |
| Service Layer        | ❌ Missing | No CRUD operations for local resources    |
| User-Facing UI       | ❌ Missing | No display component in Growth tab        |
| Admin Panel          | ❌ Missing | No CRUD interface for resource management |
| Map Integration      | ❌ Missing | Need to extend existing map component     |
| Data Migration       | ❌ Missing | Need seeding script to populate Firestore |

---

## 🔀 Dependencies

### Prerequisite Work

**Must be complete before starting**:

- [x] Data aggregation complete (`data/local-resources.ts`) - ✅ Complete
- [x] Map component exists (can reuse `MeetingMap`) - ✅ Available
- [x] Geolocation hook exists (`hooks/use-geolocation.ts`) - ✅ Available
- [ ] Documentation Standardization Phase 6 complete - 🔄 In Progress
- [ ] PR1 complete (Firestore rules stability) - ✅ Complete

**Blockers**:

- Documentation Standardization Initiative blocks new feature development

### Downstream Impact

**This work will enable**:

- User reviews/ratings (future)
- Resource analytics (future)
- Insurance filtering (future)

---

## 📐 Technical Architecture

### Data Model

**Firestore Collection:** `/local_resources/{resourceId}`

```typescript
interface LocalResource {
  id: string;
  name: string;
  category: ResourceCategory;
  locationType: "physical" | "hotline" | "multi-site" | "virtual" | "mobile";
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

  // Admin fields
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string; // Admin UID
  updatedBy?: string; // Admin UID
}

type ResourceCategory =
  | "Clinical: Detox & Crisis"
  | "Clinical: Residential Treatment"
  | "Clinical: Outpatient (IOP/PHP)"
  | "Clinical: Harm Reduction"
  | "Community: Recovery Centers"
  | "Community: Essentials"
  | "Community: Jobs & Legal"
  | "Community: Wellness";
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

## 📋 Implementation Plan

### Phase 1: Service Layer & Data Migration (2 hours)

**Goal**: Create Firestore collection and service layer

**Tasks**:

- [ ] **Task 1.1**: Create Firestore collection and rules (0.5h)
  - Add `/local_resources` rules to `firestore.rules`
  - Add indexes to `firestore.indexes.json`

- [ ] **Task 1.2**: Create service layer (1h)
  - **File**: `lib/db/local-resources.ts`
  - Functions: `getAllLocalResources()`, `getByCategory()`, `getById()`,
    `add()`, `update()`, `delete()`, `toggleActive()`
  - Follow patterns from `meetings.ts`, `sober-living.ts`

- [ ] **Task 1.3**: Create seeding script (0.5h)
  - **File**: `scripts/seed-local-resources.ts`
  - Import from `data/local-resources.ts`
  - Add `active: true`, timestamps
  - Batch write to Firestore

### Phase 2: User-Facing UI (5 hours)

**Goal**: Display resources in Growth tab with list and map views

**Tasks**:

- [ ] **Task 2.1**: Create list view components (3h)
  - `components/growth/local-resources-card.tsx` - Resource card
  - `components/growth/local-resources-list.tsx` - Filterable list
  - `components/growth/local-resources-section.tsx` - Main section with tabs
  - Integrate into `growth-page.tsx`

- [ ] **Task 2.2**: Create map view (2h)
  - `components/growth/local-resources-map.tsx`
  - Category-coded markers (8 colors)
  - Marker clustering for performance
  - Info popups with resource details

### Phase 3: Admin Panel (2.5 hours)

**Goal**: Enable admin CRUD operations

**Tasks**:

- [ ] **Task 3.1**: Create admin CRUD interface (2.5h)
  - `components/admin/local-resources-tab.tsx`
  - Table view with filters
  - Add/Edit/Delete dialogs
  - Form validation (coordinates, phone, URL)
  - Add tab to `admin-panel.tsx`

### Phase 4: Testing & Polish (1.5 hours)

**Goal**: Verify all functionality and polish UX

**Tasks**:

- [ ] **Task 4.1**: Comprehensive testing (1.5h)
  - User flow testing (list, map, filters)
  - Admin flow testing (CRUD)
  - Mobile testing (call, directions)
  - Performance testing (60+ markers)

---

## ✅ Acceptance Criteria

### User Stories

1. **As a user**, I can view local recovery resources in the Growth tab
2. **As a user**, I can filter resources by category (8 categories)
3. **As a user**, I can search resources by name or services
4. **As a user**, I can view resources on a map with category-based markers
5. **As a user**, I can sort resources by distance from my location
6. **As a user**, I can call a resource with one tap (mobile)
7. **As a user**, I can get directions to a resource (Google Maps)
8. **As an admin**, I can add, edit, delete, and toggle resources

### Technical Criteria

- [ ] Firestore collection `/local_resources` created with 60+ documents
- [ ] Firestore security rules allow user read, admin write
- [ ] Service layer implements all CRUD operations
- [ ] Growth tab displays resources section below sober living
- [ ] Map view uses existing Leaflet infrastructure
- [ ] Admin panel has Resources tab with full CRUD
- [ ] All form inputs validated
- [ ] No TypeScript errors, no ESLint warnings

---

## 🚨 Risks & Mitigation

| Risk                             | Likelihood | Impact | Mitigation                            |
| -------------------------------- | ---------- | ------ | ------------------------------------- |
| Map performance with 60+ markers | MEDIUM     | MEDIUM | Implement marker clustering           |
| GPS coordinate accuracy          | LOW        | LOW    | Admin panel allows coordinate editing |
| Firestore rules conflict         | LOW        | HIGH   | Wait for PR1 stability                |

---

## 📚 Files Summary

### New Files (8 total)

1. `lib/db/local-resources.ts` - Service layer
2. `components/growth/local-resources-card.tsx` - Resource card UI
3. `components/growth/local-resources-list.tsx` - Filterable list
4. `components/growth/local-resources-map.tsx` - Map view
5. `components/growth/local-resources-section.tsx` - Main section
6. `components/admin/local-resources-tab.tsx` - Admin CRUD
7. `scripts/seed-local-resources.ts` - Data migration

### Modified Files (4 total)

1. `components/notebook/pages/growth-page.tsx` - Add resources section
2. `components/admin/admin-panel.tsx` - Add Resources tab
3. `firestore.rules` - Add `/local_resources` rules
4. `firestore.indexes.json` - Add category/city indexes

---

## 📚 Related Documentation

- **Data Source**: `data/local-resources.ts`
- **Review Checklist**: `local-resources-review.md`
- **Similar Features**:
  - Meetings: `lib/db/meetings.ts`
  - Sober Living: `lib/db/sober-living.ts`
  - Admin Links: `components/admin/links-tab.tsx`

---

## 🗓️ Version History

| Version | Date       | Changes                                      | Author           |
| ------- | ---------- | -------------------------------------------- | ---------------- |
| 2.0     | 2026-01-02 | Standardized structure per Phase 4 migration | Claude           |
| 1.0     | 2025-12-30 | Initial plan created                         | Development Team |

---

## 🤖 AI Instructions

**For AI Assistants implementing this plan:**

1. **Read this entire document** before starting any task
2. **Check dependencies** - Ensure PR1 and Doc Standardization complete
3. **Follow existing patterns** - Reference `meetings.ts` and `sober-living.ts`
4. **Start with Phase 1** - Service layer enables all other work
5. **Run seed script** after service layer complete
6. **Update status dashboard** as you complete tasks
7. **Test with 60+ resources** - Verify performance
8. **Follow admin panel patterns** - Reference `links-tab.tsx`

**When completing a task:**

```bash
# 1. Implement the feature
# 2. Update this document (check off task)
# 3. Commit with descriptive message
git add docs/LOCAL_RESOURCES_IMPLEMENTATION_PLAN.md
git commit -m "docs: Update Local Resources plan - completed task [ID]"
```

---

## 📝 Update Triggers

**Update this document when:**

- ✅ Task status changes
- ✅ Blockers discovered or resolved
- ✅ New resources added to data file
- ✅ Technical approach changes
- ✅ Dependencies change status

---

## 📊 Post-Launch Enhancements

**Future Features (out of scope for M1.6):**

1. User Reviews/Ratings
2. Favorites/Save resources
3. Share via SMS/email
4. Real-time bed availability
5. Multilingual support (Spanish)
6. Insurance filtering
7. Walk-in hours/open status
8. Facility photos
9. Verified badge
10. Resource analytics

---

**END OF DOCUMENT**
