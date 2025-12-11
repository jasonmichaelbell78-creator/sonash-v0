# SoNash – Nashville Recovery Notebook

## Full Product & Development Roadmap (v2)

---

## 0. Overview

SoNash (working title: **Nashville Recovery Notebook**) is a **mobile-first web app (PWA)** designed for people in recovery in and around Nashville.

Core metaphor:

> The app *is* a personal recovery notebook. You see a blue notebook on a desk, flip it open, and move between sections (Today, Resources, Support, Growth, Work, More) using notebook tabs and a bookmark.

This roadmap describes:

- The **product vision & user experience**
- The **phased feature plan**
- The **data model & backend plan (Firebase)**
- The **admin backend** for managing content
- The **admin backend** for managing content
- A **Quality & Validation Schedule** to ensure stability
- Future, expansion-friendly **modules and ideas**

---

## 1. Quality & Validation Schedule

**Strategy:** We will not wait until the end to test. We will use a "Continuous Analysis" approach using multiple coding sources.

### Q1. Core Stability Check (End of Phase 3)

- **Static Analysis:** Strict TypeScript checks (no `any`), Linting.
- **Unit Tests:** Jest tests for `FirestoreService` and `AuthProvider`.
- **Manual QA:** "Airplane Mode" test (checking graceful failure).

### Q2. Security & Performance Audit (End of Phase 5)

- **Security:** Firestore Rules audit, sensitive data check (localStorage).
- **Performance:** Lighthouse audit (aiming for 90+ on mobile), Image optimization verification.
- **Automated Testing:** Basic E2E flows (Sign In -> Check In -> Sign Out).

---

## 1. Product Vision

### 1.1 Purpose

Help people in recovery (especially early recovery) to:

- Track their **sobriety time** (without shame).
- Do a simple **daily check-in** (mood, cravings, use, notes).
- **Find meetings and local resources** easily.
- **Reach their support circle** fast when things get rough.
- Build small, sustainable **recovery habits**.
- Keep a **secure vault** of their written and voice-to-text recovery work (journal, inventories, gratitude, step work).

### 1.2 Target Users

- People in early recovery (days to first few years).
- Primarily in **Nashville + surrounding areas**.
- Often juggling:
  - Unstable housing or work,
  - Court/legal obligations,
  - Transportation issues,
  - Mental health challenges.

The app must feel:

- **Warm, human, non-shaming**  
- **Simple and forgiving**, with room to grow  
- **Low-friction**, so it doesn’t feel like another chore

---

## 2. UX Metaphor & Navigation

### 2.1 Notebook Metaphor

- Realistic **blue, slightly worn notebook** on a **wooden desk**.
- Warm, soft lighting, rounded corners, subtle texture.
- Inside:
  - Off-white paper with faint lines.
  - Handwriting-style fonts (titles, notes, labels).
  - Right-edge **color tabs**.
  - A **blue bookmark ribbon** (“My Notebook”).

All major screens live **inside the notebook**.

### 2.2 Navigation Model

- **Closed cover** (Cover screen):
  - Shows clean time summary and “Turn to today’s page →”.
- **Open notebook**:
  - Two-page spreads (left & right pages).
  - Right-edge tabs (main sections):
    - **Today**
    - **Resources**
    - **Support**
    - **Growth** (future)
    - **Work** (future)
    - **More** (overflow/future modules)
- **Top-right bookmark:** `My Notebook`
  - Opens settings & personalization overlay.

### 2.3 Transitions

- Cover → Today:
  - Book-opening animation:
    - Cover lifts from spine.
    - Pages visible underneath.
- Between tabs:
  - Page-flip animation with a quick swipe/flip effect.
  - **Swipe left/right** on mobile also flips pages.

### 2.4 Architectural Note – Pages as Modules

Each section on a notebook page is treated as a **module** with:

- A **summary view** on the main spread (card, sticky note, box).
- A **dedicated detail screen** when tapped (for full interaction).

Examples:

- **Journal module**
  - Summary: “Last entry + ‘Add new’” on Today/Growth.
  - Detail: Full Journal index + entry viewer.
- **Meeting Finder module**
  - Summary: “Next few meetings today”.
  - Detail: Full list/map with filters.
- **Prayer & Meditation module**
  - Summary: favorite prayers on Spiritual page.
  - Detail: full prayer/meditation index.

This makes the app easy to **expand later** without cluttering the main notebook spreads.

---

## 3. Tech Stack Overview (Planned)

### 3.1 Frontend

- **React + TypeScript**
- **PWA** (Progressive Web App) – mobile-first but works on desktop.
- Styling:
  - Tailwind CSS (or equivalent) for layout.
  - Custom components for notebook visuals.
- Animations:
  - Framer Motion or CSS transitions for:
    - Book opening,
    - Page flips,
    - Micro-interactions (sticky notes, tabs).

### 3.2 Backend

- **Firebase Auth**
  - Sign-in with Google.
  - Sign-in with Email/Password.
- **Firestore**
  - Cloud document database for:
    - Users & profiles,
    - Check-ins,
    - Journal entries & step work,
    - Support contacts,
    - Meetings,
    - Resources & help links,
    - Challenges,
    - Admin-managed content.
- **Firebase Hosting**
  - Hosting for the PWA.
- Optional later:
  - Firebase Cloud Functions for admin tasks, exports, batch updates.

### 3.3 Security & Privacy (High-Level)

- Firestore security rules:
  - A user can only read/write docs under their own `/users/{uid}` subtree.
- Admin roles:
  - Separate admin-only collections & views for public content.
- Optional app lock:
  - PIN or biometric lock for the app itself (later).
- Clear “handle carefully” guidance for exports & shared content.

---

## 4. Phase 1 – Cover & Shell (Notebook + Desk)

**Status:** Core design done (can be polished).

### 4.1 Cover Screen

- Blue notebook on a wooden desk.
- Embossed title: **“Nashville Recovery Notebook”** / **SoNash**.
- Handwritten text:
  - `You’ve been clean for X days.` (will be dynamic).
  - `Turn to today’s page →`.
- The notebook itself is the tap target to open the app.

### 4.2 Cover → Today Transition

- Tap anywhere on notebook:
  - Play book-opening animation:
    - Cover lifts.
    - Interior pages fill the screen.
  - Land on **Today** two-page spread.

---

## 5. Phase 2 – Auth & User Profile

**Goal:** Everybody signs in; everyone gets a profile doc in Firestore.

### 5.1 Authentication

- **Sign-in methods:**
  - Google sign-in.
  - Email/Password sign-in.
- **Sign-out** from:
  - Cover page,
  - Today page header.

### 5.2 User Profile Data

Stored at `/users/{uid}`:

- `nickname` – used for greetings (“Hey Alex”).
- `cleanStart` – timestamp (sober date/time) or null if not set yet.
- `timeZone` – e.g., `"America/Chicago"`.
- `defaultReadingSource` – `"AA" | "NA" | "COMMUNITY"`.
- `theme` – `"blue"` (for now).
- `largeText` – boolean.
- `simpleLanguage` – boolean.
- `privacyMode` – `"cloudSync" | "localOnly"` (for future toggles).
- `createdAt`, `updatedAt` – timestamps.

### 5.3 First-Time Setup

After first sign-in:

- Ask for nickname (optional; default = part of email).
- Ask for clean date/time:
  - Simple date/time picker.
  - Can be edited later.
- Store in `/users/{uid}`.

---

## 6. Phase 3 – Today Page (Core Daily Screen)

**Tab:** Today

### 6.0 Technical Hardening (Immediate)

- **Error Handling:** Graceful UI fallback if data fails to load (no silent failures).
- **Debounce:** Autosave triggers max once every 3-5 seconds to save quota.
- **Data Integrity:** Strict TypeScript types for all log entries.

### 6.1 Layout (Open Notebook Spread)

- **Header:**
  - `Sunday, Dec 7 – Hey Alex, one day at a time.`
  - Right: `My Notebook` bookmark (settings overlay).
- **Left page:**
  - Section A: `Tracker – Clean time`
  - Section B: `Today’s Reading` (AA/NA toggle)
- **Right page:**
  - Section C: `Check-In: How are you doing today?`
  - Optional quick links:
    - “Need a spot-check?”
    - “Need a grounding exercise?”
    - **New:** Motivation chips (e.g., “3 days strong!”).
    - **New:** Visual trends (mini sparkline for mood).

### 6.2 Clean Time Tracker (Section A)

- Uses `cleanStart` from profile.
- Displays:
  - `X years · Y months · Z days`
  - `… and N minutes so far today`
- Updates `N minutes` in real time.
- Margin note:
  - `Tap here if something happened today →` (opens slip/tough day form).

Tough day / slip log stored under `/users/{uid}/toughDays/{id}`.

### 6.3 Today’s Reading (Section B)

- Source toggle: `AA` | `NA` | `COMMUNITY` (room for more).
- **Persistence:** App remembers the last selected source.
- Sticky note preview:
  - A short line or paraphrase for today’s reading.
- “Open full reading” link:
  - Opens full reading page inside notebook.
- Licensing approach:
  - No full copyrighted texts unless permission obtained.
  - Use community-written readings or link to official sources.

### 6.4 Daily Check-In (Section C)

Stored under `/users/{uid}/checkins/{YYYY-MM-DD}`:

- `mood` – `"struggling" | "okay" | "hopeful" | "great"`.
- `cravings` – boolean.
- `used` – boolean.
- `note` – free text.
- `createdAt`, `updatedAt`.

UI:

- Mood faces row + labels.
- “Cravings? Yes/No”
- “Used? Yes/No”
- Lined note area: “Anything you want to jot down?”

---

## 7. Phase 4 – Resources Tab

**Tab:** Resources

### 7.1 Left Page – Resource Modules

Cards on left page:

1. **Meeting Finder** (MVP live)
2. **Sober Living Finder** (future)
3. **Local Resource Map** (detox, clinics, food, IDs, etc.) (future)
4. **Nashville Sober Events** (future)
5. **Help & Outreach Links** (local + national hotlines)

Each card:

- Title + short description.
- Tap to open module’s detail page.
- “Coming soon” label for not-yet-implemented modules.

### 7.2 Meeting Finder (MVP Resource Module)

Data in `/meetings/{meetingId}`:

- `name`
- `fellowship` – `"AA" | "NA" | "Other"`.
- `dayOfWeek` – 0–6.
- `timeOfDay` – `"HH:MM"` 24h.
- `neighborhood`
- `address`
- `lat`, `lng` (optional).
- `notes`
- `isActive` – boolean.

UI (Right page / Detail screen):

- Small map of Nashville with pins.
- List of today’s meetings:
  - `time – fellowship – neighborhood`.
- On tap:
  - Show meeting detail with address, notes, and “Open in Maps” link.

---

### 7.3 Help & Outreach Links (Local & National)

**Goal:** Clear, calm place for important help numbers and links.

Data:

- `/helpLinks/{linkId}`:
  - `name`
  - `scope` – `"local" | "national"`
  - `type` – `"crisis" | "support" | "info"`
  - `phone?`
  - `url?`
  - `description`
  - `notesForCaller` – what to expect, how to start the call.

UI:

- Left: grouped lists:
  - Local Nashville help,
  - National hotlines,
  - Online chat/text.
- Right: selected item detail:
  - Big number,
  - “Call now” / “Open chat” / “Visit site” button,
  - Plain language: “What happens when I call this?”

Safety copy:

- “This app cannot monitor emergencies.”
- “If you are in immediate danger, call emergency services (911 or your local equivalent).”

---

## 8. Phase 5 – Support Tab (My Support Circle)

**Tab:** Support

### 8.1 Left Page – Contacts List

Data under `/users/{uid}/contacts/{contactId}`:

- `name`
- `role` – `"Sponsor" | "Friend" | "Family" | "Counselor" | "Other"`.
- `tags` – e.g. `["good in a crisis", "rides", "just to talk"]`.
- `phone`
- `locationAddress?`
- `lat?`, `lng?`
- `talkNotes`
- `sortOrder`
- `createdAt`, `updatedAt`.

UI:

- Heading: `My Support Circle`
- Subtext: `The people I reach out to when things get rough.`
- Cards for each contact; tap selects a contact.

### 8.2 Right Page – Contact Detail

- Heading: `Jordan – Sponsor`
- Sub-line: `good in a crisis · just to talk`
- Buttons:
  - `Call`
  - `Text`
  - `Directions` (if location set)
- “Things I want to talk about” lined area (saved into `talkNotes`).
- Gentle footer text: `You don’t have to do this alone.`

Integration:

- Later, calling/texting could contribute to a **connection challenge** (e.g., “call support 3 times this week”).

---

## 9. Phase 6 – My Notebook Overlay (Settings & Personalization)

Opened via blue bookmark on top-right.

### 9.1 Overlay Menu

Items:

1. `Nickname & privacy`
2. `Home screen & favorites`
3. `Language & text size`

### 9.2 Behavior

- `Nickname & privacy`:
  - Edit nickname.
  - PrivacyMode (e.g., hide some details on cover).
- `Home screen & favorites`:
  - Pin/unpin modules to right tabs.
  - Choose which modules show on Today.
- `Language & text size`:
  - Toggle large text.
  - Toggle simple language.

All settings stored in `/users/{uid}`.

---

## 10. Phase 7 – Recovery Journal & Work Vault

**Goal:** Central, secure repository for **all written work** in the app.

### 10.1 Purpose

The Journal is:

- A regular **journal** (free writing, voice-to-text).
- A log of:
  - Cravings,
  - 10th step entries,
  - 11th step nightly inventories,
  - Spot-check inventories,
  - Gratitude lists,
  - Step work answers,
  - Other structured work.

Every module can **send work into the Journal vault**, tagged by type and source.

### 10.2 Journal Entry Types

Stored in `/users/{uid}/journalEntries/{entryId}`.

Possible `type` values:

- `freeJournal` – free text journal.
- `voiceJournal` – voice-to-text entries (plus audio metadata later).
- `cravingLog` – quick crave note.
- `tenthStep` – daily inventory.
- `eleventhStep` – nightly review.
- `spotCheck` – real-time inventory on a specific situation.
- `gratitudeList` – gratitude entries (“3 things I’m grateful for”).
- `stepWork` – step/story/worksheet writing.
- `myStory` – longer “what it was like / what happened / what it’s like now” stories.

Other fields:

- `title?`
- `text`
- `tags` – e.g. `["anger", "family"]`.
- `sourceModule` – `"today" | "steps" | "support" | "safetyPlan" | "learningStories"`.
- `sourceRef?` – ID of prompt/contact/story, etc.
- `createdAt`, `updatedAt`

### 10.3 Linking from Other Modules

Examples:

- Today page:
  - “Save today’s check-in note to my journal” → `freeJournal` or `cravingLog`.
- Steps & Recovery Work:
  - 10th/11th/spot-check forms → `tenthStep`, `eleventhStep`, `spotCheck`.
- Support Circle:
  - “Things I want to talk about” → optionally duplicated to Journal with link to contact.
- Safety Plan:
  - Updates → `safetyPlan`-tagged entries.
- Learning & Stories:
  - “Reflect in my journal” → `stepWork` or `freeJournal` with `sourceRef` pointing to a story/tape.

### 10.4 Journal UI (Notebook Style)

- **Left page:**
  - List of recent entries grouped by date.
  - Filters:
    - By type: All / Journal / 10th / 11th / Spot-check / Gratitude / Step work.
    - By tag (future).
- **Right page:**
  - Selected entry:
    - Type badge (“10th step inventory”).
    - Date/time.
    - Main text on lined, paper-like background.
    - For voice: small audio player + note “Transcribed on [date]”.

Security:

- All stored under `/users/{uid}/journalEntries`.
- Firestore rules: only that `uid` can read/write.
- Optional app lock later.

- Optional app lock later.

### 10.5 Journal Reliability & Draft UX (New)

- **Sync Status:** Visible indicator (cloud checkmark or "saved locally").
- **Local-First Drafts:**
  - Content saves to local storage immediately while typing.
  - Prevents data loss if network fails or app closes.
- **Prompt Memory:**
  - If a user starts a "Review my day" prompt but navigates away, the draft state persists across modules until submitted or discarded.
- **Security:**
  - Sensitive journal data in localStorage must be encrypted or cleared on logout.
- **Offline Support (Priority):**
  - Enable Firestore offline persistence.
  - UI indicator for "Syncing..." vs "Saved".

---

## 11. Steps & Recovery Work – Inventories & Story

**Tab:** Work (future), plus tie-ins on Today.

### 11.1 10th Step Inventory (Ongoing Daily)

- Simple guided form:
  - “Anything you feel uneasy or guilty about today?”
  - “Anyone you feel resentment or anger toward?”
  - “Is there something you need to set right tomorrow?”
- Saves as `tenthStep` entries in Journal.

### 11.2 11th Step Inventory (Nightly Review)

- Nightly prompts:
  - “What went well today?”
  - “Anything you want to do differently tomorrow?”
  - “Anything you want to hand over / let go of?”
- Saves as `eleventhStep` entries.

### 11.3 Spot-Check Inventory (In-the-Moment Tool)

- Fast form:
  - “What happened?”
  - “How did you feel?”
  - “What can you do now that’s in line with recovery?”
- Saves as `spotCheck` entries.

### 11.4 My Story Builder

- Prompts:
  - “What it was like”
  - “What happened”
  - “What it’s like now”
- Save each section as `myStory` / `stepWork` entries in Journal.

---

## 12. Spiritual / Reflection Space & Prayer Reference

**Tab:** Growth (future, with spiritual sub-section)

### 12.1 Spiritual / Reflection Space

- Daily short reflection prompts.
- Space to type thoughts, prayers, intentions.
- Option to send reflections into Journal.

### 12.2 Prayer & Meditation Reference

**Goal:** Gentle index of common recovery prayers/meditations and how they’re used (without reproducing copyrighted texts illegally).

Data (admin-managed):

- `name`
- `shortDescription`
- `suggestedUse` (morning, evening, in crisis)
- `tags` (acceptance, surrender, willingness)
- `externalLinks` (official sources)

UI:

- Left page: prayer list with descriptions.
- Right page: selected prayer’s:
  - Explanation of when/how people use it.
  - Very short permitted text/snippet or paraphrase (if allowed).
  - Link to official literature/app where appropriate.

Users can favorite prayers and optionally pin one to Today.

---

## 13. Learning & Stories – Stories, Speaker Tapes, Community

**Tab:** Growth

### 13.1 Submit Your Story

- Users can:
  - Write their story in sections.
  - Or record a voice note and transcribe to text (voice-to-text).
- Stories saved to Journal as `myStory` / `stepWork` entries.
- Options:
  - Private only (default).
  - Export to sponsor (later).
  - Submit for anonymous sharing (if curated).

### 13.2 Speaker Tapes

- Admin-curated list of recovery talks:
  - Local Nashville speakers where possible.
  - Other approved recordings.
- Each tape:
  - Title, description, tags, length, audio URL.
- In-app audio player:
  - Play, pause, scrub, playback speed.

Consent & anonymity are required for any content.

### 13.3 Community Postings

- Curated bulletin board for:
  - Sober events,
  - Service opportunities,
  - New meeting announcements.
- Read-only for users; updated via admin backend.

### 13.4 Journal Integration

- From a story or tape:
  - “Reflect in my journal” → creates Journal entry linked to that content.

- From a story or tape:
  - “Reflect in my journal” → creates Journal entry linked to that content.

---

## 13.5 Export & Data Portability (New)

**Goal:** Allow users to safeguard their data.

- **Export to JSON/CSV:** Full dump of user data.
- **Generate Report:** PDF for sponsors (sharing selected entries only).

---

## 14. Early Recovery Guide & Starter Kit

**Goal:** Friendly roadmap for the first days/weeks/month of recovery.

### 14.1 Phases

1. **First 72 Hours**
2. **First 7 Days**
3. **First 30 Days**

Each phase:

- Short explanation.
- Action checklist.
- Links into other modules (Today, Resources, Support, Journal, Challenges).

### 14.2 First 72 Hours

Checklist ideas:

- Get to a meeting (via Meeting Finder).
- Sleep and hydrate as you can.
- Eat something small regularly.
- Add safe people to Support Circle.
- Write how you feel in the Journal.

### 14.3 First 7 Days

- Aim for a few meetings.
- Use Daily Check-In once a day.
- Write one gratitude entry in Journal.
- Save key Help & Outreach links.

### 14.4 First 30 Days

- Maintain meeting frequency (e.g., 3/week).
- Start a simple Recovery Challenge.
- Fill out Safety Plan (once implemented).
- Try a 10th or 11th step entry.

Data:

- `/users/{uid}/starterKitProgress/{phaseId}`:
  - `phaseId` = `"first72"`, `"first7"`, `"first30"`.
  - `completedSteps` (array of item IDs)
  - `createdAt`, `updatedAt`

---

## 15. Recovery Challenges

**Goal:** Gentle, non-shaming habit builders.

### 15.1 Challenge Templates (Admin-Defined)

Stored at `/challengeTemplates/{challengeId}`:

- `name`
- `description`
- `durationDays`
- `type` – `"meetings" | "checkins" | "journal" | "gratitude" | "calls" | "custom"`.
- `targetCount` – e.g., 3 meetings.
- `moduleLinks` – which modules it ties into.
- `isActive`
- Optional: `suggestedPhase` (`"first30"`, etc.)

### 15.2 User Challenges

Stored at `/users/{uid}/challenges/{userChallengeId}`:

- `templateId`
- `status` – `"notStarted" | "inProgress" | "completed" | "expired"`.
- `startDate`, `endDate`
- `currentCount`
- `lastUpdated`

### 15.3 UI & Integration

- “Challenges” card on Today page.
- Dedicated Challenges view under Growth/Work.
- Activities that increment progress:
  - Attending a meeting.
  - Logging a daily check-in.
  - Creating a gratitude/Journal entry.
  - Calling a support contact (if enabled).

Tone: always encouraging, never punishing.

---

## 16. Export to Sponsor / Trusted People

**Goal:** Let users share selected pieces of their written work with a sponsor or trusted person, in a controlled way.

### 16.1 What Can Be Exported

- Selected Journal entries:
  - `tenthStep`, `eleventhStep`, `spotCheck`, `gratitudeList`, `stepWork`, `myStory`, `freeJournal`.
- Range:
  - Specific dates or last N entries.

### 16.2 Export Formats (Future)

- **On-screen Sponsor View:**
  - Show entries in a clean, readable layout on the user’s device.
- **PDF Export:**
  - Simple PDF with dates, types, and text.
- **Plain-text Export:**
  - For manual copy/paste.

### 16.3 Flow

1. User goes to Journal/Steps.
2. Chooses “Share with sponsor” or “Prepare for meeting.”
3. Selects entries/time range.
4. Reviews preview.
5. Chooses:
   - Show on-screen,
   - or Export to PDF/text.

### 16.4 Safety & Privacy

- App does not auto-send to anyone.
- User always decides where exported file/text goes.
- Clear warnings about sensitivity and data hygiene.

---

## 17. Admin Backend & Content Management

**Goal:** Let trusted admins manage all shared app content without touching code.

### 17.1 Roles

- **User:** Normal app user, no admin access.
- **Admin:** Manage content (meetings, resources, learning content, challenges, etc.).
- **Super-admin:** Manage admins + see audit logs.

Roles stored in Firestore (e.g., `/admins/{uid}` with role fields).

### 17.2 Admin UI

- Separate admin area (e.g., `/admin` route).
- Auth via Firebase; access restricted by role.
- Sections:

1. **Meetings:**
   - CRUD for `/meetings`.
   - Mark online/in-person, active/inactive.
2. **Resources & Help Links:**
   - CRUD for `/resources` and `/helpLinks`.
3. **Prayer & Meditation:**
   - Manage prayer reference entries.
4. **Learning & Stories:**
   - Manage speaker tapes.
   - Curate community stories and postings.
5. **Starter Kit / Early Recovery Guide:**
   - Edit text and checklists.
6. **Recovery Challenges:**
   - Manage challenge templates.
7. **Events:**
   - Manage `/events` for sober events.

### 17.3 Audit & Safety

- Content docs store:
  - `createdByAdmin`, `updatedByAdmin`,
  - `createdAt`, `updatedAt`.
- Optional `/adminLogs/{logId}` for important changes.
- Admins never see private user data (journal entries, check-ins).

---

## 18. Data Model Summary (High-Level)

### 18.1 Users & Profiles

- `/users/{uid}` – profile & settings.
- `/users/{uid}/checkins/{dateKey}` – daily check-ins.
- `/users/{uid}/toughDays/{id}` – slips/tough days.
- `/users/{uid}/contacts/{contactId}` – support circle.
- `/users/{uid}/journalEntries/{entryId}` – all journal/inventory/story entries.
- `/users/{uid}/starterKitProgress/{phaseId}` – early recovery guide progress.
- `/users/{uid}/challenges/{userChallengeId}` – user challenge progress.

### 18.2 Shared Content

- `/meetings/{meetingId}`
- `/resources/{resourceId}`
- `/helpLinks/{linkId}`
- `/events/{eventId}`
- `/prayerEntries/{prayerId}`
- `/speakerTapes/{tapeId}`
- `/communityPosts/{postId}`
- `/challengeTemplates/{challengeId}`

---

## 19. Accessibility, Language & Safety

- Large text mode.
- Simple language mode:
  - Short sentences,
  - Less text per screen.
- Adjustable wording:
  - “sober” vs “clean” vs “in recovery”.
- Screen reader-friendly structure.
- Clear warnings around:
  - Not an emergency service,
  - Handling of sensitive data,
  - Export/sharing.

---

## 20. Phase Status Summary

- **Phase 1 – Cover & Shell:** core visual concept done; needs polish.
- **Phase 2 – Auth & Profile:** sign-in and user doc creation in progress.
- **Phase 3 – Today Page:** design defined; implementation next.
- **Phase 4 – Resources:** Meeting Finder MVP + Help & Outreach planned.
- **Phase 5 – Support:** Support Circle defined; to be wired.
- **Phase 6 – My Notebook Overlay:** structure planned.
- **Phase 7 – Journal & Work Vault:** data model + behavior planned.
- **Steps, Spiritual, Learning, Starter Kit, Challenges:** all specified at a design level for later phases.
- **Admin Backend:** planned; to be implemented after core user flows.
