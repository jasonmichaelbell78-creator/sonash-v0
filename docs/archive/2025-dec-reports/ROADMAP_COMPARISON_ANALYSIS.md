<!-- TDMS: All actionable findings from this report have been ingested into
     MASTER_DEBT.jsonl. This file is archived for historical reference only.
     Do not add new findings here — use the TDMS intake process. -->

# Roadmap Comparison Analysis (Archived)

> **Status:** Archived / point-in-time reference (Dec 11, 2025)  
> **Superseded by:** `ROADMAP_V3.md` (canonical)

This document captured a comparison at a moment in time. Any actionable items
have been integrated into the canonical roadmap.

For the current plan, see:

- `ROADMAP_V3.md`

---

---

## Roadmap Comparison Analysis

**Date**: December 11, 2025 **Purpose**: Compare comprehensive recommendations
from code review session against existing ROADMAP.md

---

## Executive Summary

### Key Findings

✅ **Strong Alignment**: 75% of recommendations align with or enhance existing
roadmap ⚠️ **Critical Gaps Identified**: Crisis support, offline-first
architecture, HIPAA compliance 🔄 **No Major Contradictions**: Recommendations
complement rather than conflict with roadmap 📈 **Priority Shifts Recommended**:
Move crisis features earlier in phased rollout

---

## 1. Feature Comparison Matrix

### ✅ Already in Roadmap (Duplication - Good!)

| Feature                          | Roadmap Location      | Status   | Notes                                |
| -------------------------------- | --------------------- | -------- | ------------------------------------ |
| **Daily Check-In**               | Phase 3 (Section 6.4) | Planned  | Mood, cravings, used tracking        |
| **Clean Time Tracker**           | Phase 3 (Section 6.2) | Planned  | Real-time minutes display            |
| **Meeting Finder**               | Phase 4 (Section 7.2) | MVP Live | AA/NA meetings with map              |
| **Support Circle**               | Phase 5 (Section 8)   | Planned  | Contact management with tags         |
| **Journal Vault**                | Phase 7 (Section 10)  | Planned  | All written work centralized         |
| **10th/11th Step Inventories**   | Section 11            | Planned  | Daily and nightly reviews            |
| **Spot-Check Inventory**         | Section 11.3          | Planned  | In-the-moment tool                   |
| **My Story Builder**             | Section 11.4          | Planned  | "What it was like" structure         |
| **Prayer & Meditation**          | Section 12            | Planned  | Reference with external links        |
| **Speaker Tapes**                | Section 13.2          | Planned  | Audio player for recovery talks      |
| **Recovery Challenges**          | Section 15            | Planned  | Habit builders (meetings, check-ins) |
| **Early Recovery Guide**         | Section 14            | Planned  | First 72hr/7d/30d phases             |
| **Export to Sponsor**            | Section 16            | Planned  | Selected entry sharing               |
| **Voice-to-Text Journal**        | Section 10.2          | Planned  | `voiceJournal` entry type            |
| **Admin Backend**                | Section 17            | Planned  | Content management CRUD              |
| **Sober Events**                 | Section 13.3          | Planned  | Community bulletin board             |
| **Large Text / Simple Language** | Section 19            | Planned  | Accessibility modes                  |
| **PWA Architecture**             | Section 3.1           | Current  | Mobile-first web app                 |
| **Firebase Auth & Firestore**    | Section 3.2           | Current  | Backend stack                        |
| **Offline Persistence**          | Section 10.5          | Planned  | Firestore offline mode               |

### 🆕 Recommendations NOT in Roadmap (Gaps)

| Feature                          | Priority    | Why Missing is Critical                    | Recommendation                             |
| -------------------------------- | ----------- | ------------------------------------------ | ------------------------------------------ |
| **Crisis SOS Button**            | 🔴 CRITICAL | Users in crisis need instant help          | Add to Phase 3 (Today page)                |
| **Crisis Text Line Integration** | 🔴 CRITICAL | Not everyone can call; texting is safer    | Add to Phase 4 (Resources)                 |
| **Relapse Recovery Mode**        | 🔴 CRITICAL | Current design assumes linear progress     | Add "Reset Clean Date" flow                |
| **Anonymous Mode**               | 🟡 HIGH     | Users may share devices or fear discovery  | Add to Phase 6 (Settings)                  |
| **HIPAA Compliance Plan**        | 🟡 HIGH     | May partner with clinics/courts            | Add to Quality Schedule                    |
| **App Lock (PIN/Biometric)**     | 🟡 HIGH     | Roadmap says "later" but should be Phase 6 | Move up priority                           |
| **Panic Mode (Quick Exit)**      | 🟡 HIGH     | Domestic situations require fast exit      | Add to Phase 6                             |
| **Gratitude Journal**            | 🟢 MEDIUM   | Separate from general journal              | Already covered (type: `gratitudeList`) ✅ |
| **Craving Delay Timer**          | 🟢 MEDIUM   | "Surf the urge" guided tool                | Add to Phase 3 or Growth tab               |
| **Local Resource Map**           | 🟢 MEDIUM   | Listed as "future" in 7.1                  | Good; already planned                      |
| **Sober Living Finder**          | 🟢 MEDIUM   | Listed as "future" in 7.1                  | Good; already planned                      |
| **Court/Legal Tracking**         | 🔵 LOW      | For compliance documentation               | Consider for "Work" tab                    |
| **Medication Reminders**         | 🔵 LOW      | MAT (medication-assisted treatment) users  | Future consideration                       |
| **Peer Matching**                | 🔵 LOW      | Privacy/moderation concerns                | Defer (not in roadmap)                     |

### 🔄 Technical Recommendations NOT in Roadmap

| Recommendation                   | Current Roadmap               | Gap Analysis                             |
| -------------------------------- | ----------------------------- | ---------------------------------------- |
| **Offline-First Architecture**   | "Optional later" (10.5)       | Should be Phase 3 requirement            |
| **Service Worker Caching**       | Mentioned as PWA              | Not explicitly planned                   |
| **CSP Headers**                  | Not mentioned                 | Add to Quality Schedule (Q2)             |
| **Rate Limiting (Server-Side)**  | Not mentioned                 | Add Firebase App Check + Cloud Functions |
| **Error Boundary Components**    | Not mentioned                 | Add to Phase 3                           |
| **Sentry/LogRocket Integration** | Not mentioned                 | Add to Phase 5 launch prep               |
| **Performance Budget**           | Lighthouse 90+ (Q2)           | Good but needs bundle size limits        |
| **Automated E2E Testing**        | "Basic E2E flows" (Q2)        | Should include Playwright/Cypress setup  |
| **WCAG 2.1 AA Compliance**       | "Screen reader-friendly" (19) | Not specific enough; add audit           |
| **Data Encryption at Rest**      | Not mentioned                 | Add to Security Audit (Q2)               |

---

## 2. Contradictions & Conflicts

### ❌ No Major Contradictions Found

The recommendations **complement** rather than conflict with the roadmap.
However, there are **priority disagreements**:

| Recommendation      | Roadmap                     | Conflict Type | Resolution                         |
| ------------------- | --------------------------- | ------------- | ---------------------------------- |
| **App Lock**        | "Optional app lock (later)" | **PRIORITY**  | Move to Phase 6 instead of "later" |
| **Offline Support** | "Optional later"            | **PRIORITY**  | Make required in Phase 3           |
| **Crisis Features** | Not in any phase            | **OMISSION**  | Add Crisis Support to Phase 3-4    |
| **Anonymous Mode**  | Not mentioned               | **OMISSION**  | Add to Phase 6 privacy settings    |

---

## 3. Roadmap Phasing Analysis

### Current Roadmap Phases (Existing)

- **Phase 1**: Cover & Shell ✅ Done
- **Phase 2**: Auth & User Profile 🔄 In Progress
- **Phase 3**: Today Page (check-in, tracker, reading) 📋 Next
- **Phase 4**: Resources (meetings, help links) 📋 Planned
- **Phase 5**: Support Circle 📋 Planned
- **Phase 6**: Settings Overlay 📋 Planned
- **Phase 7**: Journal Vault 📋 Planned
- **Phases 8+**: Steps, Spiritual, Learning, Challenges, Admin

### Recommended Phase Adjustments

#### 🔴 Phase 3 - Add Crisis Support

**Current**: Today page with check-in, tracker, reading **Recommended
Addition**:

- Crisis SOS button (always visible)
- "Need help right now?" card
- Quick access to crisis contacts

**Rationale**: Users in early recovery (target audience) face frequent crises.
This should be available from day 1 of app usage, not deferred.

#### 🔴 Phase 3 - Make Offline-First Required

**Current**: "Optional later" **Recommended**: Core architectural requirement
**Rationale**: Target users have unstable housing, inconsistent data plans. App
must work offline or it won't work for them.

#### 🟡 Phase 4 - Add Crisis Text Line

**Current**: Help & Outreach Links (voice calls only) **Recommended**:
Text-based crisis support **Rationale**: Many users can't safely make calls
(shared spaces, domestic situations).

#### 🟡 Phase 6 - Prioritize App Lock

**Current**: "Optional app lock (later)" **Recommended**: PIN/biometric lock in
Phase 6 **Rationale**: Journal contains deeply personal step work. App lock
should launch with journal vault.

#### 🟢 Phase 7+ - Add Relapse Recovery Mode

**Current**: Not mentioned **Recommended**: Add to slip/tough day logging (6.2)
**Rationale**: Recovery is non-linear. App should gracefully handle relapse
without shame.

---

## 4. Business & Growth Strategies

### Not in Technical Roadmap (Expected)

The existing ROADMAP.md is **product/technical focused**. My recommendations
included business strategies that are appropriately **not** in a technical
roadmap:

- Partnership strategies (clinics, recovery houses, courts)
- Revenue models (freemium, B2B, grants)
- Marketing/growth tactics (SEO, community outreach, peer referrals)
- Legal compliance beyond security (HIPAA, 42 CFR Part 2, ADA)

**Recommendation**: Create separate `BUSINESS_ROADMAP.md` or `GO_TO_MARKET.md`
for non-technical planning.

---

## 5. Quality & Testing Comparison

### Existing Quality Schedule (ROADMAP.md Section 1)

**Q1 - End of Phase 3:**

- Static analysis (strict TypeScript, linting)
- Unit tests (FirestoreService, AuthProvider)
- Manual QA (Airplane Mode test)

**Q2 - End of Phase 5:**

- Security: Firestore rules audit, localStorage check
- Performance: Lighthouse 90+, image optimization
- Automated testing: Basic E2E flows

### Recommended Enhancements

| Gap                       | Add to Which Phase    | Details                                           |
| ------------------------- | --------------------- | ------------------------------------------------- |
| **Component Testing**     | Q1                    | Add React Testing Library tests for all modules   |
| **Security Testing**      | Q2                    | Add OWASP ZAP scan, dependency audits (npm audit) |
| **Accessibility Testing** | Q2                    | Add axe-core, manual screen reader testing        |
| **Performance Budget**    | Q2                    | Set hard limits: JS bundle < 200KB, FCP < 1.8s    |
| **Error Monitoring**      | Before Phase 5 Launch | Sentry for production error tracking              |
| **Analytics Setup**       | Before Phase 5 Launch | Privacy-respecting analytics (Plausible/Fathom)   |

---

## 6. Data Model Alignment

### Perfect Alignment ✅

The existing data model (Section 18) covers all core entities. My
recommendations align with:

- `/users/{uid}/checkins/{dateKey}` - Daily check-ins ✅
- `/users/{uid}/toughDays/{id}` - Slip logging ✅
- `/users/{uid}/contacts/{contactId}` - Support circle ✅
- `/users/{uid}/journalEntries/{entryId}` - Journal vault ✅
- `/users/{uid}/challenges/{userChallengeId}` - Challenges ✅

### Suggested Additions

| Collection                                  | Purpose                                         | Priority    |
| ------------------------------------------- | ----------------------------------------------- | ----------- |
| `/users/{uid}/settings/privacy`             | Anonymous mode, app lock settings               | 🟡 HIGH     |
| `/users/{uid}/crisisLog/{logId}`            | Track crisis button usage (for self-reflection) | 🟡 HIGH     |
| `/users/{uid}/achievements/{achievementId}` | Milestone tracking (30/60/90 days)              | 🟢 MEDIUM   |
| `/helpLinks/{linkId}`                       | **Add field**: `supportsChatText: boolean`      | 🔴 CRITICAL |

---

## 7. UI/UX Comparison

### Strong Alignment ✅

- **Notebook metaphor** - Roadmap is deeply committed; recommendations support
  this
- **Warm, non-shaming tone** - Both emphasize this
- **Page-flip animations** - Both describe this
- **Tab navigation** - Matches exactly

### Recommended Additions

| UI Element            | Roadmap Status       | Recommendation                                           |
| --------------------- | -------------------- | -------------------------------------------------------- |
| **Crisis SOS Button** | Not mentioned        | Add persistent FAB (floating action button) on all pages |
| **Offline Indicator** | "Sync status" (10.5) | Good; make prominent                                     |
| **Saving Indicators** | Not mentioned        | Add "Saving..." / "Saved" feedback                       |
| **Empty States**      | Not mentioned        | Add compassionate empty state messaging                  |
| **Dark Mode**         | Not mentioned        | Consider for users with migraines/sensitivity            |
| **Panic Mode Button** | Not mentioned        | Triple-tap to quick exit app                             |

---

## 8. Security & Privacy Comparison

### Existing (Roadmap Section 3.3)

- Firestore rules: user-scoped reads/writes ✅
- Admin roles ✅
- App lock: "later" ⚠️
- Export guidance ✅

### Critical Additions Needed

| Security Feature            | Priority    | Why Critical                                       |
| --------------------------- | ----------- | -------------------------------------------------- |
| **HIPAA Compliance**        | 🔴 CRITICAL | If partnering with clinics/courts                  |
| **CSP Headers**             | 🟡 HIGH     | Defense against XSS (already verified low risk)    |
| **Rate Limiting**           | 🟡 HIGH     | Prevent abuse (client-side done; need server-side) |
| **Data Encryption at Rest** | 🟡 HIGH     | Journal contains sensitive recovery work           |
| **Session Timeout**         | 🟢 MEDIUM   | Auto-lock after inactivity                         |
| **Audit Logging**           | 🟢 MEDIUM   | Track admin content changes ✅ (already planned)   |

---

## 9. Accessibility Comparison

### Existing (Roadmap Section 19)

- Large text mode ✅
- Simple language mode ✅
- Screen reader-friendly structure ✅
- Adjustable wording ("sober" vs "clean") ✅

### Gaps

| Feature                       | Priority  | Details                                   |
| ----------------------------- | --------- | ----------------------------------------- |
| **WCAG 2.1 AA Certification** | 🟡 HIGH   | Need formal audit and fixes               |
| **Keyboard Navigation**       | 🟡 HIGH   | Not mentioned; critical for desktop users |
| **Color Contrast**            | 🟡 HIGH   | Notebook aesthetic may have low contrast  |
| **Focus Indicators**          | 🟢 MEDIUM | Custom styling needed                     |
| **Alternative Text**          | 🟢 MEDIUM | For all images/icons                      |

---

## 10. Prioritized Action Items

### 🔴 Critical - Add to Roadmap Now

1. **Phase 3: Add Crisis Support**
   - SOS button on Today page
   - Quick access to crisis contacts
   - "Need help right now?" card

2. **Phase 3: Make Offline-First Mandatory**
   - Enable Firestore offline persistence
   - Service worker caching
   - Offline indicator UI

3. **Phase 4: Add Crisis Text Line**
   - Update `/helpLinks` schema with `supportsChatText`
   - Text-based crisis resources (Crisis Text Line, SAMHSA)

4. **Phase 6: Move App Lock to Required**
   - PIN/biometric authentication
   - Session timeout
   - Anonymous mode toggle

5. **Quality Schedule: Add HIPAA Compliance Review**
   - Business Associate Agreements (BAA) with Firebase
   - Data encryption at rest
   - Audit logging

### 🟡 High Priority - Add Soon

6. **Phase 7: Add Relapse Recovery Mode**
   - Compassionate "Reset clean date" flow
   - "What I learned" reflection prompt
   - Link to crisis/support resources

7. **Quality Schedule: Expand Testing**
   - Component tests (React Testing Library)
   - E2E tests (Playwright)
   - Accessibility audit (axe-core)

8. **Phase 5: Add Error Monitoring**
   - Sentry integration
   - Privacy-respecting analytics

### 🟢 Medium Priority - Consider for Future Phases

9. **Growth Tab: Add Craving Delay Timer**
   - Guided "surf the urge" tool
   - Distraction techniques
   - Success logging

10. **Work Tab: Add Court/Legal Tracking**
    - Document compliance for users with legal obligations
    - Attendance verification exports

---

## 11. Architecture Recommendations vs. Roadmap

### Current Stack (Roadmap Section 3)

- React + TypeScript ✅
- PWA ✅
- Tailwind CSS ✅
- Framer Motion ✅
- Firebase Auth + Firestore ✅
- Firebase Hosting ✅

### Recommended Additions

| Technology                 | Purpose                 | Priority    | Roadmap Status               |
| -------------------------- | ----------------------- | ----------- | ---------------------------- |
| **Workbox**                | Service worker caching  | 🔴 CRITICAL | Not mentioned                |
| **React Error Boundaries** | Graceful error handling | 🟡 HIGH     | Not mentioned                |
| **Zod**                    | Runtime validation      | ✅ ADDED    | Added in Phase 1 refactoring |
| **Sentry**                 | Error monitoring        | 🟡 HIGH     | Not mentioned                |
| **Playwright**             | E2E testing             | 🟡 HIGH     | "Basic E2E" mentioned        |
| **React Testing Library**  | Component testing       | 🟡 HIGH     | Not mentioned                |
| **Lighthouse CI**          | Performance monitoring  | 🟢 MEDIUM   | Manual Lighthouse mentioned  |
| **Husky + lint-staged**    | Pre-commit hooks        | 🟢 MEDIUM   | Not mentioned                |

---

## 12. Compliance & Legal

### Not in Roadmap (But Needed)

| Requirement           | Status                              | Action                                      |
| --------------------- | ----------------------------------- | ------------------------------------------- |
| **HIPAA Compliance**  | ❌ Not mentioned                    | Add compliance plan if B2B strategy pursued |
| **42 CFR Part 2**     | ❌ Not mentioned                    | Federal substance use privacy regulations   |
| **ADA Compliance**    | ⚠️ Partial (accessibility features) | Add WCAG 2.1 AA certification goal          |
| **GDPR**              | ❌ Not mentioned                    | If expanding outside Nashville/US           |
| **Terms of Service**  | ❌ Not mentioned                    | Draft before public launch                  |
| **Privacy Policy**    | ❌ Not mentioned                    | Draft before public launch                  |
| **Crisis Disclaimer** | ⚠️ Brief mention (Section 7.3)      | Expand legal disclaimer for crisis features |

**Recommendation**: Create `COMPLIANCE_CHECKLIST.md` before Phase 5 launch.

---

## 13. Comparison Summary by Category

### ✅ Strong Alignment (Keep As-Is)

- Core feature set (check-in, tracker, journal, support circle)
- Notebook UI metaphor and navigation
- Firebase backend architecture
- Privacy-first design (user-scoped Firestore rules)
- Recovery-specific features (steps, prayers, challenges)
- Admin content management system
- Accessibility commitment (large text, simple language)

### 🔄 Good Foundation, Needs Enhancement

- **Offline support** - Mentioned but not prioritized high enough
- **App lock** - Planned for "later" but should be Phase 6
- **Testing strategy** - Good start but needs component/E2E expansion
- **Security** - Strong rules but missing CSP, encryption, HIPAA

### 🆕 Critical Gaps to Address

1. **Crisis support features** - Not in roadmap at all
2. **Anonymous mode** - Privacy concern not addressed
3. **Relapse recovery flow** - Assumes linear progress
4. **Offline-first architecture** - Not mandatory
5. **HIPAA compliance** - Required for partnerships
6. **Business/growth strategy** - Separate from tech roadmap (expected)

### ❌ No Contradictions

Recommendations **enhance** rather than conflict with existing roadmap.

---

## 14. Recommended Next Steps

### Immediate (This Sprint)

1. ✅ **Review this comparison document**
2. 📝 **Update ROADMAP.md**:
   - Add crisis support to Phase 3
   - Move offline support to mandatory in Phase 3
   - Move app lock to Phase 6 (not "later")
   - Add relapse recovery mode
3. 📝 **Create `COMPLIANCE_CHECKLIST.md`**:
   - HIPAA requirements
   - ADA/WCAG 2.1 AA
   - Terms of Service / Privacy Policy
4. 📝 **Create `BUSINESS_ROADMAP.md`** (optional):
   - Separate business/growth strategies from technical roadmap

### Near-Term (Next 2-4 Weeks)

5. 🔧 **Phase 3 Implementation**:
   - Add crisis SOS button to Today page
   - Enable Firestore offline persistence
   - Add offline indicator UI
6. 🧪 **Expand Testing**:
   - Set up Playwright for E2E
   - Add React Testing Library for components
7. 🔒 **Security Hardening**:
   - Add CSP headers (from XSS verification doc)
   - Plan data encryption at rest

### Long-Term (Next Quarter)

8. 🏥 **HIPAA Compliance** (if pursuing B2B):
   - Firebase BAA setup
   - Encryption audit
   - Compliance documentation
9. 📊 **Analytics & Monitoring**:
   - Sentry for errors
   - Privacy-respecting analytics (Plausible/Fathom)
10. ♿ **Accessibility Audit**:
    - WCAG 2.1 AA compliance
    - Screen reader testing
    - Color contrast fixes

---

## 15. Conclusion

### Overall Assessment: Strong Foundation, Key Gaps

The existing ROADMAP.md demonstrates:

- ✅ **Deep user empathy** for people in early recovery
- ✅ **Thoughtful feature design** covering core recovery needs
- ✅ **Clear phased approach** to implementation
- ✅ **Privacy-first architecture** with user-scoped data

However, it is **missing critical safety features** that could be the difference
between relapse and recovery:

- 🔴 Crisis support (SOS button, text-based help)
- 🔴 Offline-first architecture (for users with unstable access)
- 🔴 Relapse recovery mode (non-shaming reset flow)
- 🟡 App lock prioritization (protect deeply personal content)
- 🟡 HIPAA compliance (required for clinic/court partnerships)

**Recommendation**: Integrate crisis support and offline-first features into
Phase 3 as **non-negotiable requirements**. These are not "nice to have"
features for the target population—they are essential for the app to fulfill its
mission of supporting people in early recovery.

---

**Last Updated**: December 11, 2025 **Next Review**: After ROADMAP.md updates
