# Roadmap v3 (Canonical)

> **Status:** Canonical roadmap for this repository.
>
> This document **supersedes**:
> - `ROADMAP.md` (deprecated pointer)
> - `ROADMAP_COMPARISON_ANALYSIS.md` (point-in-time analysis)
> - `REFACTORING_ACTION_PLAN.md` (engineering implementation plan that supports this roadmap)

## Purpose

Roadmap v3 integrates product direction, platform/engineering priorities, and execution sequencing into a single source of truth.

## Guiding principles

- **User value first:** prioritize outcomes that improve reliability, speed, and clarity for users.
- **Reduce complexity:** simplify architecture and flows before adding new surface area.
- **Ship incrementally:** prefer thin vertical slices with measurable impact.
- **Operational excellence:** automation, observability, and guardrails are features.

## North Star outcomes

1. **Reliability:** fewer regressions, predictable releases.
2. **Performance:** faster load and response times.
3. **Maintainability:** clearer boundaries, easier iteration.
4. **Feature velocity:** quicker delivery of user-facing improvements.

## Milestones

### M0 — Baseline & alignment (now)

- Confirm canonical roadmap and supporting documents.
- Define success metrics and reporting cadence.
- Establish owners (product/engineering) for each milestone.

**Deliverables**
- Roadmap v3 published (this document).
- Definitions of Done for each milestone.
- Initial KPI dashboard or lightweight metrics doc.

---

### M1 — Stabilize & de-risk the foundation

**Objectives**
- Improve stability and reduce time-to-fix.
- Establish consistent engineering practices and guardrails.

**Key initiatives**
- Testing strategy: unit/integration coverage for critical paths.
- CI/CD hardening: linting, type checks, build verification.
- Error handling normalization and logging.
- Dependency review and security updates.

**Exit criteria**
- Reduced production issues/regressions.
- CI gates enforced and green by default.

---

### M2 — Architecture & refactoring for speed

**Objectives**
- Reduce coupling, clarify module boundaries.
- Make the system easier to extend with fewer unintended side effects.

**Key initiatives**
- Refactor high-churn modules into well-defined components.
- Improve state/data flow consistency.
- Standardize configuration and environment handling.
- Establish patterns for new features (templates, examples).

**Exit criteria**
- Clearer ownership boundaries and faster onboarding.
- Lower change failure rate for common modifications.

---

### M3 — Product experience improvements

**Objectives**
- Improve usability and user trust.
- Tighten core workflows and reduce friction.

**Key initiatives**
- UX polish on key flows.
- Documentation improvements (user + developer).
- Performance improvements driven by profiling.
- **Meeting Finder proximity feature** (see below).

**Exit criteria**
- Improved user satisfaction signals and funnel conversion (where applicable).
- Measurable performance improvements.

---

#### M3.1 — Meeting Finder: Proximity & Map Feature

> **Goal:** Help users find the closest meetings to their current location.

**Prerequisites**
- Geocoding API key (Google Maps Geocoding API or similar)
- One-time data migration to populate coordinates

**Tickets**

| Ticket | Description | Est |
|--------|-------------|-----|
| 3.1.1 | Create geocoding script to populate lat/lng for all 1,173 meeting addresses | 3 |
| 3.1.2 | Add `coordinates: { lat, lng }` to Firestore meeting documents | 1 |
| 3.1.3 | Implement browser geolocation hook with permission handling | 2 |
| 3.1.4 | Add Haversine distance calculation utility | 1 |
| 3.1.5 | Add "Nearest to me" sort option in Meeting Finder | 2 |
| 3.1.6 | Display distance (miles) on meeting cards when location available | 1 |
| 3.1.7 | (Optional) Interactive map view using Leaflet or Google Maps SDK | 5 |

**Subtotal: 15 SP** (10 SP without interactive map)

**Technical Notes**
- Geocoding is a one-time batch operation; store coordinates permanently
- Browser geolocation requires HTTPS and user permission
- Haversine formula provides accurate distance for Nashville-scale distances
- Consider caching user location to avoid repeated permission prompts

---

### M4 — Expansion & follow-on capabilities

**Objectives**
- Enable new use cases without compromising stability.

**Key initiatives**
- Add prioritized feature set based on user feedback.
- Integrations and extensibility (where applicable).
- Operational automation (backups, migrations, monitoring).
- **Inventories Hub foundation** (see M5 for full scope).

**Exit criteria**
- New features shipped with guardrails and metrics.
- No significant regression in reliability/performance.

---

### M5 — Inventories Hub (Major Feature)

> **Goal:** Comprehensive inventory system supporting Step 4, Step 10/11, and daily practice journaling aligned with 12-step recovery principles.

**Design Principles**
- Calm, non-judgmental UX throughout.
- AA-aligned wording/structure (NO copyrighted AA literature verbatim).
- ONE canonical template per inventory type (no alternates).
- Step 10 Spot-Check must be extremely fast (30–90 seconds).
- User-initiated export/share only (privacy-first).

---

#### Epic 5.1 — Infrastructure & Data Model (Foundation)
*Dependency: M2 complete (architecture patterns established)*

| Ticket | Description | Est |
|--------|-------------|-----|
| 5.1.1 | Define Firestore schema: `users/{uid}/inventoryEntries/{entryId}` with `type`, `title`, `data`, `tags`, `createdAt`, `updatedAt`, `dateKey` | 2 |
| 5.1.2 | Implement linking system: `users/{uid}/inventoryLinks/{linkId}` with `fromId`, `toId`, `fromType`, `toType` | 3 |
| 5.1.3 | Create inventory CRUD service with DI pattern (matching existing `createFirestoreService`) | 3 |
| 5.1.4 | Write Firestore security rules: owner-only access, schema validation | 2 |
| 5.1.5 | Create shared TypeScript types for all 8 inventory templates | 2 |
| 5.1.6 | Add inventory entry validation (Zod schemas) | 2 |

**Subtotal: 14 SP**

---

#### Epic 5.2 — Step 4 Inventories

| Ticket | Description | Est |
|--------|-------------|-----|
| **5.2.1 — Resentments (4-column)** | | |
| 5.2.1a | UI: Form with `resentfulAt`, `because`, `affectsMy` (chip multi-select), `myPartText`, optional `myPartChecks` | 3 |
| 5.2.1b | Default chips: self-esteem, security, ambitions, personal relationships, sex relations, financial/pocketbook, pride, emotional wellbeing, peace of mind, other (with text field) | 1 |
| 5.2.1c | List view with search/filter (date, tags) | 2 |
| 5.2.1d | Detail view with edit capability | 2 |
| **5.2.2 — Fears** | | |
| 5.2.2a | UI: Form with `fear`, `why`, `showsUp`, `newResponse` | 2 |
| 5.2.2b | **Required linking** to Resentments and/or Harms (picker UI) | 3 |
| 5.2.2c | List/detail views | 2 |
| **5.2.3 — Sex/Relationship Conduct** | | |
| 5.2.3a | Guided Q&A form: situation, facts, selfishWhere, dishonestWhere, inconsiderateWhere, whoHarmedHow, repeatingPattern, idealGoingForward, oneConcreteChange | 3 |
| 5.2.3b | Optional linking to Harms | 1 |
| 5.2.3c | List/detail views | 2 |
| **5.2.4 — Harms / Other Wrongs** | | |
| 5.2.4a | UI: Form with `whoHarmed`, `whatIDid`, `impact`, `responsibility`, `whatICanDoNow`, `flagStep8_9` | 2 |
| 5.2.4b | Status field: unreviewed → reviewed_with_sponsor → on_step8_list | 1 |
| 5.2.4c | Optional linking to Resentments/Fears | 2 |
| 5.2.4d | List/detail views with Step 8/9 filter | 2 |

**Subtotal: 28 SP**

---

#### Epic 5.3 — Daily Practice Inventories

| Ticket | Description | Est |
|--------|-------------|-----|
| **5.3.1 — Step 10 Spot-Check (FAST flow)** | | |
| 5.3.1a | Wizard/progressive disclosure UI optimized for 30–90 sec completion | 3 |
| 5.3.1b | `feelings` multi-select + other, `trigger`, `story` fields | 2 |
| 5.3.1c | Quick checks: selfish, dishonest, self-seeking, frightened (toggle) | 1 |
| 5.3.1d | `oweApology` boolean + notes, `nextRightAction`, `reachOutTo` | 2 |
| 5.3.1e | "Quick save" functionality | 1 |
| **5.3.2 — Step 11 Morning Planning** | | |
| 5.3.2a | Form: `topPriorities` (3 items), `needHelpWithMotives`, `onePersonToHelp`, `ifAgitatedPlan`, `intention` | 2 |
| 5.3.2b | Shortcut button to create Spot-Check | 1 |
| 5.3.2c | List/detail views | 2 |
| **5.3.3 — Night Review (merged 10/11)** | | |
| 5.3.3a | 9 YES/NO questions with collapsible notes | 3 |
| 5.3.3b | Questions: resentful, selfish, dishonest, afraid, owe apology, kept something, kind/loving, could do better, did well | 1 |
| 5.3.3c | `tomorrowDifferent`, `gratitudeHighlight` fields | 1 |
| 5.3.3d | List view by date | 2 |
| **5.3.4 — Gratitude List** | | |
| 5.3.4a | Simple list by date: `items[{text, why?}]` | 2 |
| 5.3.4b | "Why it matters" toggle per item | 1 |
| 5.3.4c | List/detail views | 2 |

**Subtotal: 26 SP**

---

#### Epic 5.4 — Export & Share

| Ticket | Description | Est |
|--------|-------------|-----|
| 5.4.1 | PDF generation utility using `@react-pdf/renderer` (chosen for React component model, clean output) | 3 |
| 5.4.2 | Per-entry PDF export with consistent layout, optional "include linked items" toggle | 3 |
| 5.4.3 | "Copy as text" button | 1 |
| 5.4.4 | Web Share API with fallback to clipboard | 2 |
| 5.4.5 | "Email" button using `mailto:` with URL-encoded subject/body | 1 |
| 5.4.6 | Privacy reminder modal on share/export initiation | 1 |

**Subtotal: 11 SP**

---

#### Epic 5.5 — Inventories Hub UI

| Ticket | Description | Est |
|--------|-------------|-----|
| 5.5.1 | Hub landing page `/inventories` with section cards | 2 |
| 5.5.2 | Step 4 section: `/inventories/step-4/*` routes | 2 |
| 5.5.3 | Daily section: `/inventories/daily/*` routes | 2 |
| 5.5.4 | Consistent navigation, breadcrumbs, back buttons | 2 |
| 5.5.5 | Search/filter component (date range, tags, linked items) | 3 |
| 5.5.6 | Linking UI component (picker for cross-referencing entries) | 3 |
| 5.5.7 | Empty states and onboarding hints | 1 |

**Subtotal: 15 SP**

---

#### Epic 5.6 — Testing & Documentation

| Ticket | Description | Est |
|--------|-------------|-----|
| 5.6.1 | Unit tests for inventory service CRUD | 3 |
| 5.6.2 | Unit tests for linking system | 2 |
| 5.6.3 | Integration tests for export/share | 2 |
| 5.6.4 | User documentation for each inventory type | 2 |
| 5.6.5 | Developer documentation (data model, adding new inventory types) | 2 |

**Subtotal: 11 SP**

---

#### M5 Summary

| Epic | Story Points |
|------|--------------|
| 5.1 Infrastructure | 14 |
| 5.2 Step 4 Inventories | 28 |
| 5.3 Daily Practice | 26 |
| 5.4 Export & Share | 11 |
| 5.5 Hub UI | 15 |
| 5.6 Testing & Docs | 11 |
| **Total** | **105 SP** |

**Suggested phasing:**
1. **Phase A (MVP):** Epic 5.1 + Resentments (5.2.1) + Spot-Check (5.3.1) + basic Export (5.4.1-2) → ~35 SP
2. **Phase B:** Remaining Step 4 inventories (5.2.2-4) → ~18 SP
3. **Phase C:** Remaining Daily Practice (5.3.2-4) + Hub UI (5.5) → ~29 SP
4. **Phase D:** Full Export/Share (5.4.3-6) + Testing/Docs (5.6) → ~23 SP

**Exit criteria**
- All 8 inventory types functional with CRUD, search, and linking.
- PDF export and share working for all entry types.
- Security rules deployed and tested.
- No copyrighted AA content in any template.
- Spot-Check completable in under 90 seconds.

---

#### M5 Technical Decisions

**PDF Library: `@react-pdf/renderer`**
- *Rationale:* React component model matches existing stack; produces clean, consistent output; good TypeScript support; active maintenance.
- *Alternative considered:* `jspdf` — more flexible but requires manual layout; less ergonomic for React.

**Linking Strategy: Dedicated collection (`inventoryLinks`)**
- *Rationale:* Clean separation of concerns; efficient queries for "what's linked to X"; easier to add link metadata (e.g., link type, notes) later.
- *Trade-off:* Extra writes/reads vs. embedded arrays; worth it for referential integrity.

**Firestore Structure**
```
users/{uid}/
  inventoryEntries/{entryId}
    - type: "resentment" | "fear" | "relationship" | "harm" | "spotCheck" | "morning" | "nightReview" | "gratitude"
    - title: string (computed: resentfulAt, fear, whoHarmed, date, etc.)
    - data: { ...template-specific fields }
    - tags: string[]
    - createdAt: Timestamp
    - updatedAt: Timestamp
    - dateKey?: "YYYY-MM-DD" (for daily items)

  inventoryLinks/{linkId}
    - fromId: string
    - toId: string
    - fromType: string
    - toType: string
    - createdAt: Timestamp
```

---

## Backlog themes (ongoing)

- Observability (metrics, traces, structured logs)
- Developer Experience (local setup, scripts, templates)
- Security hardening (secrets handling, dependency updates)
- Documentation (architecture decision records, runbooks)

## Governance & cadence

- **Monthly:** milestone review, KPI check, reprioritization.
- **Weekly:** engineering execution review.
- **Per release:** retrospective and action items.

## How to use this roadmap

- Product priorities map to **Milestones (M1–M5)**.
- **M5 (Inventories Hub)** is a major feature milestone with detailed epics and tickets.
- Engineering work items live in `REFACTORING_ACTION_PLAN.md` (implementation details) and issues/PRs.
- If a conflict exists, **this document is the source of truth**.

## Non-Goals (Explicitly Out of Scope for M5)

The following inventory types are intentionally excluded:
- Instincts inventory
- Weekly/monthly periodic reviews
- Values-based inventory
- HALT/trigger inventory
- Boundary inventory
- Amends-readiness inventory

These may be considered in future milestones based on user feedback.
