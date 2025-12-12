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

---

### M6 — Prayers & Readings Module (AA-focused)

> **Goal:** Add a Prayers & Readings feature that reproduces in-app only what we can safely ship, uses direct official links for AAWS/Grapevine-controlled text we won't reproduce, and supports user practice via Favorites, Copy/Share, and Daily Practice shortcuts.

**Design Principles**
- **Copyright compliance:** Never reproduce AAWS/Grapevine copyrighted text in-app without explicit license.
- **Official sources:** Link directly to AA.org PDFs for Big Book prayers and AAWS literature.
- **Public domain first:** Ship public-domain text (Serenity Prayer, Lord's Prayer, St. Francis) as in-app content.
- **User control:** Allow user-entered text for custom prayers and personal wording preferences.
- **Privacy-first:** Share/export only on explicit user action; include privacy reminders.
- **Compliance by design:** Support remote toggle of displayMode without app update.

---

#### Content Policy Decisions (locked for v1)

**A) Ship as in-app text (default)**

1. **Serenity Prayer (short form)**
   - Store as in-app text (typed by us, not copied from AA PDFs)
   - Include optional "history" button linking to AA's official history page/PDF

2. **Lord's Prayer**
   - Include a public-domain translation (recommend KJV wording) OR ship as "user-entered text" with a default empty field for ultra-conservative posture

3. **Prayer of St. Francis**
   - Ship a public-domain version (or let user choose "my preferred wording")
   - Optional AA-related "context link" if desired (not required)

**B) Link-only (do not reproduce in-app without license)**

4. **Third Step Prayer** → link to AA.org Big Book Chapter 5 PDF
5. **Seventh Step Prayer** → link to AA.org Big Book Chapter 6 PDF
6. **Step 11 passages** ("On awakening…", "When we retire at night…", "When agitated or doubtful…") → link to AA.org Big Book Chapter 6 PDF
7. **A.A. Preamble** (Grapevine copyright) → link to AA.org Preamble PDF/page
8. **Responsibility Statement / Declaration of Unity** → link-only (AAWS copyright notice on AA.org)

**C) User-text-only (optional item)**

9. **Set Aside Prayer**
   - Default to user-text-only (common in fellowship culture but not AAWS canonical)
   - Optional: provide a "Find online" button that opens the user's browser search, rather than shipping a third-party PDF link

---

#### Direct Links Library

Store these raw URLs in seed data (shown in-app as "Open official source"):

- **AA Big Book Chapter 5 PDF** (Third Step Prayer): https://www.aa.org/sites/default/files/2021-11/en_bigbook_chapt5.pdf
- **AA Big Book Chapter 6 PDF** (Seventh Step Prayer + Step 11 passages): https://www.aa.org/sites/default/files/2021-11/en_bigbook_chapt6.pdf
- **Origin of the Serenity Prayer** (AA official history page):
  - https://www.aa.org/origin-serenity-prayer-historical-paper
  - https://www.aa.org/sites/default/files/literature/assets/smf-129_en.pdf
- **A.A. Preamble** (official PDF + page):
  - https://www.aa.org/sites/default/files/literature/smf-92_en.pdf
  - https://www.aa.org/aa-preamble
- **Declaration of Unity page** (includes Responsibility Statement / Unity context): https://www.aa.org/a-declaration-of-unity

---

#### Product Scope

**Routes (Next.js App Router)**
- `/prayers` (hub)
- `/prayers/[slug]` (detail)
- Optional: `/settings/prayers` (display preferences, defaults)

**Hub sections**
- AA Step Prayers (Step 3, Step 7, Step 11 references)
- Meeting Prayers (Serenity, Lord's Prayer, St. Francis)
- My Custom (Set Aside + user-added items)

**Detail view actions**
- Read
- Favorite
- Copy
- Share (Web Share API; fallback copy)
- Email (`mailto:`)
- Export PDF
- If link-only: "Open official source"

---

#### Epic P1 — Prayers Catalog + Hub UI

| Ticket | Description | Est |
|--------|-------------|-----|
| P1.1 | Define Firestore schema: `prayersCatalog/{id}` with `slug`, `title`, `category`, `stepTags`, `displayMode`, `inAppText?`, `officialLink?`, `rightsNotes` | 2 |
| P1.2 | Seed `prayersCatalog` with 9 items (Serenity, Lord's Prayer, St. Francis, Third Step, Seventh Step, Step 11 passages, Preamble, Responsibility Statement, Set Aside) | 2 |
| P1.3 | Create `/prayers` hub page with sections: AA Step Prayers, Meeting Prayers, My Custom | 3 |
| P1.4 | Build prayer card component with title, category, favorite indicator | 2 |
| P1.5 | Implement favorites pin/unpin functionality | 2 |
| P1.6 | Create `/prayers/[slug]` detail view with conditional rendering by `displayMode` | 3 |
| P1.7 | Build "IN_APP_TEXT" display component (readable typography, optional history/context link) | 2 |
| P1.8 | Build "LINK_ONLY" display component (official source button, context about copyright) | 2 |
| P1.9 | Build "USER_TEXT_ONLY" display component (editable text area, friendly empty state) | 2 |

**Subtotal: 20 SP**

**Exit Criteria**
- Users can browse, favorite, open detail, and see correct "in-app vs link-only" behavior
- No AAWS/Grapevine copyrighted text stored in `inAppText` fields
- Link-only items open AA.org PDFs correctly on mobile

---

#### Epic P2 — User Text + Preferences

| Ticket | Description | Est |
|--------|-------------|-----|
| P2.1 | Define Firestore schema: `users/{uid}/prayersUser/{id}` with `favorite`, `myText?`, `lastUsedAt?` | 1 |
| P2.2 | Implement `myText` override for IN_APP_TEXT items ("My preferred wording" toggle) | 2 |
| P2.3 | Implement `myText` requirement for USER_TEXT_ONLY items (show friendly empty state until user supplies text) | 2 |
| P2.4 | Add "Privacy reminder" banner on share/export | 1 |
| P2.5 | Create `/settings/prayers` page with display preferences (font size, theme) | 2 |
| P2.6 | Implement user-added custom prayers (title, text, category) | 3 |

**Subtotal: 11 SP**

**Exit Criteria**
- User text saves reliably to Firestore
- No content is shared automatically
- Users can add custom prayers to "My Custom" section

---

#### Epic P3 — Share / Email / PDF Export

| Ticket | Description | Est |
|--------|-------------|-----|
| P3.1 | Implement "Copy to clipboard" functionality | 1 |
| P3.2 | Implement Web Share API with feature detection and fallback | 2 |
| P3.3 | Implement `mailto:` email sharing with URL-encoded subject/body | 1 |
| P3.4 | PDF export utility using `@react-pdf/renderer` (consistent layout, metadata) | 3 |
| P3.5 | PDF export for IN_APP_TEXT items (include text + optional official source link) | 2 |
| P3.6 | PDF export for LINK_ONLY items (context + official source link, NO copyrighted text) | 2 |
| P3.7 | PDF export for USER_TEXT_ONLY items (user's text only) | 1 |

**Subtotal: 12 SP**

**Exit Criteria**
- Each item can export/share in a predictable format across devices
- PDF export doesn't include copyrighted excerpts for link-only items
- Web Share fallback works on desktop browsers

---

#### Epic P4 — Compliance Toggles (future-proof for licensing)

| Ticket | Description | Est |
|--------|-------------|-----|
| P4.1 | Add admin-only flags in catalog: `displayMode` switch capability | 2 |
| P4.2 | Add per-item boolean flags: `allowCopy`, `allowShare`, `allowPDF` | 1 |
| P4.3 | Implement remote toggle logic (Firebase Remote Config or catalog update) | 2 |
| P4.4 | Add optional "Report rights concern" link in detail view | 1 |
| P4.5 | Write Firestore security rules: catalog is read-only for users, admin-write only | 1 |

**Subtotal: 7 SP**

**Exit Criteria**
- You can remotely flip an item from IN_APP_TEXT → LINK_ONLY without app update
- Security rules prevent unauthorized catalog modifications

---

#### Epic P5 — Testing & Documentation

| Ticket | Description | Est |
|--------|-------------|-----|
| P5.1 | Unit tests for prayers catalog CRUD service | 2 |
| P5.2 | Unit tests for user text override functionality | 2 |
| P5.3 | Integration tests for share/export (copy, mailto, PDF) | 3 |
| P5.4 | QA checklist: verify no Big Book/AAWS text in inAppText fields | 1 |
| P5.5 | QA checklist: verify link-only items open AA.org PDFs correctly on mobile | 1 |
| P5.6 | User documentation for each prayer type and how to use features | 2 |
| P5.7 | Developer documentation (data model, adding new prayers, compliance guidelines) | 2 |

**Subtotal: 13 SP**

**Exit Criteria**
- All critical paths covered by tests
- QA checklist completed and documented
- User and developer documentation published

---

#### M6 Summary

| Epic | Story Points |
|------|--------------|
| P1 Catalog + Hub UI | 20 |
| P2 User Text + Preferences | 11 |
| P3 Share / Email / PDF | 12 |
| P4 Compliance Toggles | 7 |
| P5 Testing & Docs | 13 |
| **Total** | **63 SP** |

**Suggested phasing:**
1. **Phase A (MVP):** Epic P1 (Catalog + Hub) + P2.1-2.4 (User text basics) → ~27 SP
2. **Phase B:** Epic P3 (Share/Export) + P2.5-2.6 (Preferences + Custom prayers) → ~17 SP
3. **Phase C:** Epic P4 (Compliance) + Epic P5 (Testing/Docs) → ~20 SP

**Exit Criteria**
- All 9 prayer items functional with correct copyright compliance
- Copy, share, email, and PDF export working for all item types
- Remote compliance toggles functional
- No copyrighted AA content in any in-app text field
- Security rules deployed and tested

---

#### M6 Technical Decisions

**Data Model: Firestore**

**Catalog (global, read-only for users)**
```
prayersCatalog/{id}
  - slug: string (URL-safe identifier)
  - title: string
  - category: "step_prayers" | "meeting_prayers" | "custom"
  - stepTags?: number[] (e.g., [3, 7, 11])
  - displayMode: "IN_APP_TEXT" | "LINK_ONLY" | "USER_TEXT_ONLY"
  - inAppText?: string (only when IN_APP_TEXT)
  - officialLink?: string (when LINK_ONLY)
  - allowCopy: boolean (default true)
  - allowShare: boolean (default true)
  - allowPDF: boolean (default true)
  - rightsNotes: string (internal compliance notes)
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

**Per-user overrides**
```
users/{uid}/prayersUser/{id}
  - favorite: boolean
  - myText?: string (always allowed; especially for USER_TEXT_ONLY)
  - lastUsedAt?: Timestamp
```

**PDF Library: `@react-pdf/renderer`**
- *Rationale:* Same library used in M5 (Inventories Hub); consistent React component model; produces clean output; good TypeScript support.
- *Trade-off:* Slightly larger bundle size vs. jspdf, but consistency and developer experience outweigh.

**Compliance Strategy: Remote Config**
- *Rationale:* Allow instant compliance changes (e.g., displayMode toggle) without app deployment.
- *Implementation:* Firebase Remote Config OR direct Firestore catalog updates with admin-only access.

---
