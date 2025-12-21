# SoNash Product Roadmap

**Last Updated:** December 19, 2025  
**Status:** Canonical roadmap - supersedes all previous roadmap documents

---

## 🎯 Vision

Build a comprehensive, secure digital recovery notebook that helps individuals track their sobriety journey with privacy-first design and evidence-based recovery practices.

---

## 📊 Milestones Overview

| Milestone | Status | Progress | Target | Priority |
|-----------|--------|----------|--------|----------|
| **M0 - Baseline** | ✅ Complete | 100% | Q4 2025 | Foundation |
| **M1 - Foundation** | 🔄 In Progress | ~85% | Q1 2026 | P0 |
| **M1.5 - Quick Wins** | 🔄 In Progress | ~40% | Q1 2026 | P0 |
| **M2 - Architecture** | ⏸️ Optional | 0% | As needed | P2 |
| **M3 - Meetings** | 📋 Planned | 0% | Q2 2026 | P1 |
| **M4 - Expansion** | 📋 Planned | 0% | Q2 2026 | P1 |
| **M5 - Inventories** | 📋 Planned | 0% | Q3 2026 | P1 |
| **M6 - Prayers** | 📋 Planned | 0% | Q3 2026 | P2 |
| **M7 - Fellowship** | 📋 Planned | 0% | Q4 2026 | P1 |
| **M8 - Speakers** | 📋 Planned | 0% | Q4 2026 | P2 |
| **M10 - Monetization** | 🔬 Research | 0% | 2027 | P2 |

**Overall Progress:** ~18%

---

## 🚀 M0 - Baseline & Alignment (✅ Complete)

### Objectives

- Establish project documentation and success metrics
- Define owners and reporting cadence

### Deliverables

- ✅ Canonical roadmap published
- ✅ Definitions of Done for each milestone
- ✅ Initial KPI tracking

---

## 🏗️ M1 - Stabilize & De-Risk Foundation (🔄 In Progress)

**Goal:** Improve stability, reduce time-to-fix, establish engineering guardrails

### Week 1-3: Security Hardening (✅ Complete)

- ✅ Firebase App Check with reCAPTCHA v3
- ✅ Server-side validation (Zod schemas in Cloud Functions)
- ✅ Rate limiting (10 req/min per user)
- ✅ Firestore security rules hardened
- ✅ Audit logging for security events
- ✅ GDPR data export/deletion
- ✅ Account linking (anonymous → permanent)
- ✅ Billing alerts ($50, $100, $500)
- ✅ Incident response runbook

**Documentation:** See [docs/SECURITY.md](./docs/SECURITY.md), [docs/INCIDENT_RESPONSE.md](./docs/INCIDENT_RESPONSE.md), [docs/SERVER_SIDE_SECURITY.md](./docs/SERVER_SIDE_SECURITY.md)

### Week 4-6: Monitoring & Observability (✅ Foundation Complete)

- ✅ Sentry error monitoring configured
- ✅ Security audit logging (Cloud Logging)
- ⏸️ *Additional monitoring moved to M2 (Technical Debt)*

### Week 7-9: Code Quality (✅ Foundation Complete)

- ✅ ESLint configuration (0 errors, 29 warnings)
- ✅ TypeScript strict mode
- ✅ Test coverage: 97.8% (89/91 passing)
- ⏸️ *CI/CD and automation moved to M2 (Technical Debt)*

### Week 10-12: Code Remediation (📋 Planned)

*Based on December 2025 multi-model code analysis (6 AI reviewers)*

#### Critical Security Fixes (✅ Complete - Dec 20, 2025)

- ✅ Close Firestore rules bypass for `daily_logs` (remove direct client write)
- ✅ Fix rate limiter fail-open vulnerability (change to fail-closed)
- ✅ Protect admin reset functionality (dev-only mode)
- ✅ Refactor SSR unsafe exports in `lib/firebase.ts` (proxy guards)

#### High-Priority Bug Fixes (✅ Complete - Dec 20, 2025)

*Note: Most fixes were already implemented in prior sessions, verified during Dec 20 analysis*

- ✅ Date handling standardization (`getTodayDateId()` in `date-utils.ts`)
- ✅ Listener memory leak prevention (`isMounted` pattern in `today-page.tsx`)
- ✅ useEffect dependency optimization (`isEditingRef` instead of state)
- ✅ Auto-save race condition fix (`pendingSaveRef` + `saveScheduledRef` pattern)
- ✅ Resources page auth race condition (`if (authLoading) return` gate)
- ✅ Add pagination to large queries (meetings: 50, journal: 100)

#### Code Quality Improvements (✅ Complete - Dec 20, 2025)

- ✅ Refactor monolithic components - *Extracted: CleanTimeDisplay, MoodSelector, CheckInQuestions, RecoveryNotepad*
- ✅ App Check debug token production guard (in `lib/firebase.ts`)
- ✅ Onboarding AnimatePresence fix - *Verified correct*

#### Phase 4 Backlog (✅ Complete - Dec 20, 2025)

*All items completed during comprehensive December 2025 code remediation*

- ✅ Font loading optimization (3 fonts with `display: swap`, reduced from 20+)
- ✅ Code splitting (dynamic imports for MeetingMap and heavy components)
- ✅ Unused dependencies cleanup (removed `embla-carousel-react`, `input-otp`)
- ✅ Production-aware logging (logger.ts only logs errors in production)
- ✅ Component documentation (JSDoc) - *Added to extracted components, firestore-service.ts*
- ✅ Accessibility improvements (ARIA labels) - *Added rolegroup, radiogroup, live regions*

**Analysis Report:** See [docs/archive/2025-dec-reports/CONSOLIDATED_CODE_ANALYSIS.md](./docs/archive/2025-dec-reports/CONSOLIDATED_CODE_ANALYSIS.md)

**Testing Guide:** See [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md), [docs/TESTING_PLAN.md](./docs/TESTING_PLAN.md)

### Week 13+: Multi-AI Security Review Remediation (🔄 In Progress - Dec 21, 2025)

*Based on December 21, 2025 multi-AI code review (5 models: CODEX, GEMINI, JULES, CLAUDE, CLAUDE CODE)*

**Analysis Results:**
- **Total Issues Identified:** 95 → **71 TRUE OPEN** (after verification)
- **Sources:** 5 new AI models + baseline 6-model aggregation
- **Report:** See artifacts - `AUTHORITATIVE_ISSUE_REPORT.md`

#### Critical Security Fixes (Week 13 - Immediate)

- ✅ **Journal Collection Security Gap** (JULES #3) - ✅ **FIXED (Verified Dec 21, 2025)**
  - **Issue:** `journal` collection allows direct client writes while `daily_logs` properly blocks them
  - **Impact:** Bypasses rate limiting and App Check completely
  - **Fix:** Block direct writes in `firestore.rules:35-40`, create `saveJournalEntry` Cloud Function
  - **Status:** Verified complete - identical security to daily_logs
  - **Priority:** ~~IMMEDIATE~~ COMPLETE

- ✅ **Account Linking Data Loss** (CODEX #5) - ✅ **FIXED Dec 21, 2025**
  - **Issue:** When credential-already-in-use, signs into existing account WITHOUT migrating anonymous data
  - **Impact:** Users lose anonymous journal data
  - **Fix:** ✅ Implemented data migration Cloud Function with smart conflict resolution
  - **Status:** Deployed to production (sonash-app)
  - **Future Enhancement:** Full conflict resolution UI (see M1.5 Planned)

#### High-Priority Fixes (Week 13-14)

- ✅ **Test Assertions Don't Match Implementation** (CLAUDE CODE #1) - ⏳ **DEFERRED**
  - Tests mock direct Firestore but implementation uses Cloud Functions
  - Impact: False confidence - tests pass but don't reflect actual behavior
  - Fix: Rewrite tests to mock `httpsCallable`
  - Status: Deferred - not blocking production, can address in future sprint

- ✅ **Feature Flag System Non-Functional** (CLAUDE CODE #3) - ✅ **FIXED Dec 21, 2025**
  - Issue: `featureFlagEnabled()` always returns true (was hardcoded)
  - Impact: Cannot gate features, staged rollouts impossible
  - Fix: ✅ Implemented proper environment variable reading with Next.js integration
  - Status: Working - supports `NEXT_PUBLIC_*` flags for staged rollouts

- ✅ **Timeline Array Mutation** - ✅ **FIXED Dec 21, 2025**
  - One-line fix (`[...entries].sort()`)
  - Status: Deployed

- ✅ **Error Handling Missing** - ✅ **FIXED Dec 21, 2025**
  - Added try/finally to links-tab, prayers-tab
  - Status: Deployed

- ❌ **Daily Log History Ordering** - ✅ **VERIFIED CORRECT Dec 21, 2025**
  - Reviewed alignment of dateId vs date field
  - Status: Already working correctly, no action needed
- ❌ **Missing Rate Limiting** - saveInventoryEntry, getHistory, getInventoryEntries
- ❌ **Onboarding Overwrites Profiles** - Check existing profile before recreate
- ❌ **Composite Indexes Missing** - Library queries need indexes

#### Medium Priority (Week 15-16)

- Firestore rules overly permissive for user profiles
- Delete operations without GDPR audit logging
- Date validation missing in Cloud Function
- localStorage unencrypted for journal data
- Inefficient meeting sorting (parseTime regex)
- Nested context providers cause re-renders
- Monolithic components remain (ResourcesPage, AllMeetingsPage)
- TypeScript strict flags missing (noUncheckedIndexedAccess)
- useAuth deprecated but still used
- *[32 total medium priority issues - see report for complete list]*

#### Low Priority (Week 17+)

- Debug console.log statements in production code
- Console logs expose configuration
- README lacks setup instructions
- *[24 total low priority issues - see report for complete list]*

**Total Remediation Estimate:** ~110-120 hours across all priorities

---

## ⚡ M1.5 - Quick Wins (🔄 In Progress)

**Goal:** High-impact, low-effort features that improve user experience

### Completed

- ✅ Journal system consolidation (single-save architecture)
- ✅ Entry type separation (mood stamps, stickers, notes)
- ✅ Timeline filter ribbons
- ✅ User error notifications (Sonner toasts)
- ✅ Firestore indexes for performance
- ✅ UI Polish (Notebook Cover typography, Recovery Prayers formatting)

**Documentation:** See [docs/JOURNAL_SYSTEM_UPDATE.md](./docs/JOURNAL_SYSTEM_UPDATE.md) for complete changelog

### In Progress

- 🔄 Settings page UI
- 🔄 Profile management
- 🔄 Clean date picker improvements
- ✅ **The Library Tab** (10 SP) - Content hub consolidating:
  - ✅ Glossary (searchable recovery terms)
  - ✅ Meeting Etiquette guide
  - ✅ Quick Links (AA/NA sites, hotlines)
  - ✅ Prayers (CMS-managed)

### Planned Quick Wins (Priority Order)

#### P0 - Critical UX

1. **Recovery Library** (✅ Complete)
   - ✅ Glossary of recovery terms, slogans, abbreviations
   - ✅ Meeting etiquette guide for first-timers
   - ✅ Searchable reference material

2. **Expanded Onboarding Wizard** (8-13 SP)
   - Program selection (AA/NA/CA/Smart Recovery)
   - Sobriety/clean date setup with guidance
   - Stage-of-recovery assessment
   - Notification preferences
   - Privacy walkthrough (what data is collected)
   - Home screen customization (choose visible widgets)
   - Sponsor contact setup (optional)
   - Skip option for returning users

3. **Sponsor Personalization System** (8-13 SP)
   - **Leverages:** `hasSponsor` data from onboarding
   - **Sponsor Contact Management:**
     - Add sponsor name, phone, email
     - Quick-dial from app
     - Track last contact date
     - Set reminder frequency
   - **Personalized Prompts:**
     - "Have you called your sponsor today?" (if `hasSponsor === 'yes'`)
     - "Consider finding a sponsor" nudges (if `hasSponsor === 'no'`)
     - Meeting etiquette tips for sponsor-seekers (if `hasSponsor === 'looking'`)
   - **Step Work Integration:**
     - Encourage sponsor involvement for Step 4-9
     - "Share with sponsor" quick action for inventory entries
   - **Analytics Tracking:**
     - Sponsor contact frequency
     - Retention comparison (sponsored vs non-sponsored users)
     - Feature usage by sponsor status
   - **Why:** Fulfills onboarding promise of personalization, proven retention booster

4. **Stage-of-Recovery Selector** (4 SP)
   - Adjusts app emphasis based on user stage
   - Newcomer vs old-timer focus

4. **"I Made It Through Today" Button** (2 SP)
   - End-of-day celebration/affirmation
   - Builds positive reinforcement

#### P1 - High Value

5. **HALT Check** (4 SP)
   - Hungry/Angry/Lonely/Tired assessment
   - User-initiated button for self-check

6. **User Documentation & Help System** (5-8 SP)
   - Getting started guide for new users
   - Feature explanations (daily check-in, journal, growth tools)
   - Recovery program primer (12 steps overview)
   - FAQ section (account, privacy, data)
   - In-app tooltips for key features
   - Optional: Interactive tutorial/walkthrough on first launch
   - **Why:** Reduces confusion, improves onboarding, helps users get value faster

7. **Sober Fun Ideas Generator** (3 SP)
   - Random activities for boredom
   - Relapse prevention tool

7. **"Meetings Starting Soon" Filter** (3 SP)
   - Shows meetings within next hour
   - Location-based proximity

#### P2 - Nice to Have

8. **Sobriety Clock with Minutes** (2 SP)
   - Important for early recovery (0-90 days)
   - Feasibility check required

9. **"Too Tired" Mode** (3 SP)
   - Reduces night review to 3 questions
   - Prevents fatigue-based abandonment

10. **Disguised App Icon + Name** (5 SP)

- Privacy layer for device sharing
- "Journal" or neutral branding

---

## 🏛️ M2 - Architecture Refactor (⏸️ Optional)

**Goal:** Reduce technical debt only if friction prevents progress

### Deferred Foundation Work

**From M1 - Monitoring & Observability:**
- ⏳ Performance monitoring (page load times, API latency)
- ⏳ User analytics baseline (DAU, retention, feature usage)
- ⏳ Alert thresholds defined (automated error/performance alerts)

**From M1 - Code Quality & Automation:**
- ⏳ CI/CD pipeline setup (GitHub Actions or similar)
- ⏳ Automated testing in PR workflow
- ⏳ Client-side rate limiting in firestore-service.ts

### Potential Architecture Work

- ⏳ Component library consolidation
- ⏳ State management standardization
- ⏳ API abstraction layer
- ⏳ Database schema optimization
- ⏳ Admin route middleware (server-side protection for `/admin/*`)

**Trigger:** Only pursue if M3+ blocked by technical limitations or if scaling reveals performance issues

**Priority:** Low - Foundation is solid, focus on features first

---

## 🗓️ M3 - Meetings & Location (📋 Planned - Q2 2026)

**Story Points:** 84 SP | **Priority:** P1

### Features

#### F1: Meeting Proximity Detection (21 SP)

- Real-time "meetings near me" based on GPS
- Distance calculation and sorting
- Map view integration
- Filter by fellowship type (AA/NA/CA/etc)

#### F2: Meeting Notes (13 SP)

- In-app note capture during meetings
- "What did you commit to?" prompts
- Auto-link to journal timeline
- Export/share capabilities

#### F3: Calendar Integration (26 SP)

- Sync favorite meetings to device calendar
- Reminder notifications
- iCal export for external apps
- Recurring event support

#### F4: Virtual Meeting Support (13 SP)

- Zoom/Google Meet link integration
- Online meeting directory
- One-tap join from app
- Hybrid in-person/virtual tracking

#### F5: Enhanced Meeting Data (11 SP)

- User reviews and ratings
- Accessibility information
- Special requirements (smoking, childcare, etc)
- Meeting type badges (Step Study, Big Book, Speaker)

**Dependencies:**

- Google Maps API integration
- Calendar API permissions
- Meeting data scraping/partnership

---

## 🎯 M4 - Feature Expansion (📋 Planned - Q2 2026)

**Goal:** Extend core functionality based on M1-M3 learnings

### Potential Features (TBD)

- Multiple sobriety dates (separate counters per substance)
- Tone/language settings (firm vs gentle)
- Craving countdown timer ("ride it out" feature)
- Auto-carry-forward task nudges

---

## 📝 M5 - Nightly Inventories (📋 Planned - Q3 2026)

**Story Points:** 116 SP | **Priority:** P1

### Features

#### F1: 10th Step Inventory Tool (47 SP)

- Structured inventory prompts (AA Big Book format)
- Character defects checklist
- Assets vs defects tracking
- Progress over time visualization

#### F2: Inventory Templates (21 SP)

- Multiple formats (AA, NA, custom)
- User-created templates
- Share templates with sponsor

#### F3: Amends Tracker (26 SP)

- List of people harmed
- Amends completion status
- Notes and reflections
- Privacy controls (sponsor-only sharing)

#### F4: Pattern Recognition (22 SP)

- AI-powered theme detection
- Recurring character defects
- Trigger identification
- Insights dashboard

**Dependencies:**

- Secure storage (encrypted at rest)
- Sponsor sharing permissions
- AI/ML analysis (optional)

---

## 🙏 M6 - Prayers & Meditations (📋 Planned - Q3 2026)

**Story Points:** 63 SP | **Priority:** P2

### Features

#### F1: Prayer Library (21 SP)

- AA-approved prayers (Serenity Prayer, 3rd Step, 7th Step)
- NA prayers and meditations
- Custom prayer creation
- Favorites and bookmarks

#### F2: Daily Meditation (16 SP)

- Just for Today (NA)
- Daily Reflections (AA)
- 24 Hours a Day
- Push notification reminders

#### F3: Guided Meditation (26 SP)

- Audio meditation tracks
- Mindfulness exercises
- Breath work timers
- Progress tracking

**Content Licensing:**

- Requires AA/NA permissions for copyrighted material
- Partnership with publishers (Hazelden, NA World Services)

---

## 🤝 M7 - Fellowship & Support (📋 Planned - Q4 2026)

**Story Points:** 100 SP | **Priority:** P1

### Features

#### F1: Sponsor Connection (32 SP)

- Sponsor contact quick-dial
- "I need help" emergency button
- Sponsor chat/messaging
- Sponsor dashboard (view sponsee progress)

#### F2: Phone List (21 SP)

- Fellowship phone directory
- Favorites and groups
- One-tap calling
- SMS integration

#### F3: Support Network (26 SP)

- Create accountability circles
- Group check-ins
- Shared gratitude lists
- Peer encouragement system

#### F4: Milestone Celebrations (11 SP)

- Auto-detect sobriety milestones (30/60/90 days, 1 year)
- Shareable celebration graphics
- Notify sponsor/support network
- Digital chips and badges

#### F5: Gamification (Optional) (10 SP)

- Principle-based badges (honesty, service)
- Streak tracking (journal entries, meeting attendance)
- No shame/punishment mechanics
- Focus on growth, not competition

**Privacy Considerations:**

- Optional feature (opt-in only)
- User controls visibility settings
- Anonymous participation option

---

## 🎤 M8 - Speaker Recordings (📋 Planned - Q4 2026)

**Story Points:** 63 SP | **Priority:** P2

### Features

#### F1: Speaker Library (26 SP)

- Curated AA/NA speaker recordings
- Search by topic (resentments, relationships, Step 4)
- Favorites and playlists
- Download for offline listening

#### F2: Personal Recording (21 SP)

- Record own shares/qualifications
- Private journal audio entries
- Transcription (AI-powered)
- Organize by topic/date

#### F3: Audio Player (16 SP)

- Playback controls
- Speed adjustment
- Sleep timer
- Resume from last position

**Content Licensing:**

- AA/NA speaker permissions
- Copyright compliance
- Content moderation

---

## 💰 M10 - Monetization Strategy (🔬 Research - 2027)

**Goal:** Sustainable revenue model without exploiting vulnerable users

**Detailed Research:** See [docs/MONETIZATION_RESEARCH.md](./docs/MONETIZATION_RESEARCH.md)

### Research Findings (December 2025)

#### Rejected Models

- ❌ Freemium with paywalls (blocks critical recovery tools)
- ❌ Ads (privacy violations, triggers)
- ❌ Data monetization (unethical, illegal in recovery context)

#### Viable Options

**1. Premium Features (Ethical Freemium)**

- ✅ Free: All core recovery tools (journal, meetings, inventories)
- 💰 Premium: Advanced analytics, speaker library, offline mode
- **Pricing:** $2.99/month or $19.99/year
- **Positioning:** "Support SoNash, unlock extras"

**2. Donation Model**

- ✅ "Pay what you can" philosophy (AA 7th Tradition)
- Optional recurring donations
- Transparent expense reporting
- No feature gating

**3. B2B Licensing**

- Treatment centers license app for clients
- Sober living facilities bulk subscriptions
- Institutional pricing ($5-10/user/month)
- White-label options

**4. Hybrid Approach (Recommended)**

- Free tier: 100% of core features
- Optional premium: $2.99/month (power users)
- Institutional partnerships: Recurring revenue
- Donation option: Community support

**Next Steps:**

1. Launch free product to build user base
2. Measure engagement and retention (M3-M8)
3. Survey users about willingness to pay
4. Pilot premium tier Q1 2027

---

## 🖥️ Desktop/Web Enhancements

**Goal:** Leverage full browser capabilities for power users

### Multi-Panel Layout (21 SP)

- Split-screen views (timeline + detail)
- Dashboard mode (4-panel grid)
- Resizable panels
- Keyboard shortcuts

### Advanced Visualizations (34 SP)

- Mood heat map (calendar view)
- Correlation matrix (meetings ↔ mood)
- Trend lines (multiple metrics)
- Word clouds from journal entries
- Export charts as PNG/SVG

### Keyboard Shortcuts (8 SP)

- `J/K`: Navigate timeline
- `N`: New journal entry
- `G + T`: Go to Today tab
- `?`: Keyboard shortcuts help
- Vim-style navigation (optional)

### Export & Backup (13 SP)

- CSV/JSON/PDF export
- Automated cloud backup
- Local file download
- Sponsor report generation

### Search & Filter (21 SP)

- Full-text search across all entries
- Advanced filters (date range, mood, type)
- Saved searches
- Search suggestions

---

## 🎨 Feature Decisions (Quick Reference)

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Recovery Library | ✅ Approved | P0 | Combine glossary + etiquette |
| HALT Check | ✅ Approved | P1 | User-initiated button |
| God Box | ❌ Deferred | P3 | Maybe never |
| Complacency Detector | ⏳ Needs Review | P2 | Engagement drop alerts |
| Tone Settings | ⏳ Needs Review | P1 | Firm vs gentle language |
| Multiple Sobriety Dates | ⏳ Needs Review | P2 | Separate counters per substance |
| Principle-Based Badges | ✅ Approved | P2 | Honesty/service vs streaks |

---

## 📏 Success Metrics

### User Engagement

- Daily Active Users (DAU)
- Weekly journal entries per user
- Average session duration
- Feature adoption rate

### Retention

- 7-day retention rate (target: >40%)
- 30-day retention rate (target: >25%)
- 90-day retention rate (target: >15%)

### Recovery Outcomes

- Days clean tracking
- Meeting attendance frequency
- Journal consistency (entries per week)
- Spot check completion rate

### Technical Health

- Error rate (target: <1%)
- API response time (target: <200ms)
- App crash rate (target: <0.1%)
- Security incidents (target: 0)

---

## 🔄 Agile Process

### Sprint Cadence

- **Sprint Length:** 2 weeks
- **Planning:** Every other Monday
- **Retrospective:** Every other Friday
- **Daily Standups:** Async (Slack/Discord)

### Story Point Scale

- 1-2 SP: <1 day
- 3-5 SP: 1-2 days
- 8 SP: 1 week
- 13 SP: 1-2 weeks
- 21+ SP: Break into smaller stories

### Definition of Done

- ✅ Code reviewed
- ✅ Tests written and passing
- ✅ Documentation updated
- ✅ Deployed to staging
- ✅ Manual QA complete
- ✅ Security review (if applicable)

---

## 📚 References

### Core Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture and design patterns
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Developer setup and testing guide
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - QA testing procedures
- **[AI_HANDOFF.md](./AI_HANDOFF.md)** - Current sprint focus

### Detailed Documentation (in /docs)

- **[SECURITY.md](./docs/SECURITY.md)** - Security layers, data classification, privacy protections
- **[INCIDENT_RESPONSE.md](./docs/INCIDENT_RESPONSE.md)** - Security incident procedures
- **[MONETIZATION_RESEARCH.md](./docs/MONETIZATION_RESEARCH.md)** - Revenue model research and recommendations (M10)
- **[JOURNAL_SYSTEM_UPDATE.md](./docs/JOURNAL_SYSTEM_UPDATE.md)** - December 2025 journal refactor changelog
- **[TESTING_PLAN.md](./docs/TESTING_PLAN.md)** - Comprehensive testing strategy and multi-phase fixes
- **[SERVER_SIDE_SECURITY.md](./docs/SERVER_SIDE_SECURITY.md)** - Cloud Functions security patterns
- **[ANTIGRAVITY_GUIDE.md](./docs/ANTIGRAVITY_GUIDE.md)** - AI agent collaboration guide
- **[LIBRARY_ANALYSIS.md](./docs/LIBRARY_ANALYSIS.md)** - Dependency documentation (192k+ code snippets)
- **[firestore-rules.md](./docs/firestore-rules.md)** - Firestore security rules documentation

### Archived Documentation

- **[docs/archive/](./docs/archive/)** - Historical documents, proposals, and status reports

---

**Document History:**

- December 19, 2025: Consolidated from ROADMAP_V3.md, WEB_ENHANCEMENTS_ROADMAP.md, FEATURE_DECISIONS.md
- December 18, 2025: M1 security hardening completed
- December 17, 2025: Journal system refactor completed
