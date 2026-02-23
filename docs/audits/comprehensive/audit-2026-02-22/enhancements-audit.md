<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# SoNash Enhancements Audit

**Date:** 2026-02-22 **Auditor:** enhancements-auditor agent **Scope:** UX
improvements, accessibility, mobile responsiveness, feature gaps, progressive
enhancement, onboarding, error states, data portability, localization readiness
**Stack:** Next.js 16.1.1, React 19.2.3, Firebase 12.6.0, Tailwind CSS 4.1.9

---

## 1. Executive Summary

SoNash is a well-crafted, privacy-first recovery companion with a distinctive
notebook aesthetic. The app demonstrates strong foundational quality in several
areas: good error boundary implementation, offline indicator, PWA install
prompt, smart prompts system, milestone celebrations, and a clean 5-step
onboarding flow.

However, significant enhancement opportunities exist across three broad
categories:

1. **Missing core recovery features** expected in recovery apps (sponsor contact
   management, crisis button, mood history charts, relapse prevention planning)
2. **Accessibility gaps** — ARIA coverage is sparse across most interactive
   components, tab navigation is entirely inaccessible to keyboard users, and
   the notebook UI's `role="group"` pattern is underused
3. **Data portability and localization** — no user data export, no account
   deletion flow, and no i18n infrastructure despite the onboarding privacy
   statement promising both

Overall risk: **medium-high** — the app is functional and usable, but
accessibility deficiencies could create legal exposure and exclude users with
disabilities who may disproportionately benefit from recovery support tools.

---

## 2. Top Findings Table

| ID      | Finding                                                                                 | Severity | Effort | Area                    |
| ------- | --------------------------------------------------------------------------------------- | -------- | ------ | ----------------------- |
| ENH-001 | Tab navigation is keyboard-inaccessible (no `aria-label`, no focus management)          | S1       | E1     | Accessibility           |
| ENH-002 | No crisis / emergency SOS button visible in app                                         | S1       | E2     | Feature Gap             |
| ENH-003 | Support page contacts are hardcoded demo data, not editable                             | S1       | E2     | Feature Gap             |
| ENH-004 | No user data export despite privacy screen promising it                                 | S1       | E2     | Data Portability        |
| ENH-005 | No account deletion flow in Settings                                                    | S1       | E2     | Data Portability        |
| ENH-006 | Sign-in modal lacks `aria-modal`, `role="dialog"`, focus trap                           | S2       | E1     | Accessibility           |
| ENH-007 | Onboarding wizard progress dots have no accessible labels                               | S2       | E1     | Accessibility           |
| ENH-008 | PWA manifest uses JPEG icons — PNG/WebP required for maskable icons                     | S2       | E1     | Progressive Enhancement |
| ENH-009 | JS-disabled users see blank page (no `<noscript>` fallback)                             | S2       | E1     | Progressive Enhancement |
| ENH-010 | No mood history visualization beyond 7-day sparkline                                    | S2       | E2     | Feature Gap             |
| ENH-011 | Clean date text "Tap to set clean date" is not tappable/linked                          | S2       | E1     | UX                      |
| ENH-012 | Notebook fixed width `340px/800px` breaks at non-standard viewports                     | S2       | E2     | Mobile Responsiveness   |
| ENH-013 | No i18n infrastructure despite Nashville having significant Spanish-speaking population | S3       | E3     | Localization            |
| ENH-014 | Step 4 Inventory and Step 8 List buttons in Growth are non-functional stubs             | S2       | E1     | Feature Gap             |
| ENH-015 | VoiceTextArea mic button has only `title` attr, no `aria-label`                         | S2       | E0     | Accessibility           |
| ENH-016 | Support circle Call/Text/Directions buttons not wired to actual contact data            | S1       | E2     | Feature Gap             |
| ENH-017 | History page shows only last 7 days; no way to browse older entries in notebook         | S2       | E1     | UX                      |
| ENH-018 | Settings page has Large Text toggle but it is not applied to any CSS classes            | S2       | E2     | UX                      |
| ENH-019 | No "forgot password" flow in sign-in modal                                              | S2       | E1     | UX                      |
| ENH-020 | Journal `lock-screen.tsx` exists but is never rendered in the active notebook           | S3       | E2     | Feature Gap             |
| ENH-021 | Swipe navigation on notebook has no visual affordance for discoverability               | S3       | E1     | UX                      |
| ENH-022 | Share meeting button calls `toast.success()` but does not actually copy anything        | S2       | E0     | Bug / UX                |
| ENH-023 | Color palette not audited against WCAG 2.1 AA contrast (amber-on-amber combos)          | S2       | E1     | Accessibility           |
| ENH-024 | No skip-to-content link for keyboard users                                              | S2       | E1     | Accessibility           |
| ENH-025 | PWA manifest `orientation: "portrait"` blocks desktop standalone usage                  | S3       | E0     | Progressive Enhancement |

---

## 3. Detailed Findings by Severity

### S1 — High Priority

#### ENH-001: Tab Navigation Keyboard Inaccessibility

**File:** `components/notebook/tab-navigation.tsx` **Lines:** 22–58

The right-side tab ribbon (`TabNavigation`) renders `<motion.button>` elements
with no `aria-label`, no `aria-selected`, and no `role="tab"` or
`role="tablist"` semantics. Users navigating by keyboard cannot identify which
tab is active, and the tab ribbon itself requires visual context (rotated text
in `writingMode: "vertical-rl"`) to understand.

**Current state:**

```tsx
<motion.button
  key={tab.id}
  onClick={() => onTabChange(tab.id)}
  // No aria-label, no aria-selected, no role
>
  <span style={{ transform: "rotate(180deg)" }}>{tab.label}</span>
</motion.button>
```

**Fix:** Add `role="tab"`, `aria-selected={activeTab === tab.id}`,
`aria-label={tab.label}` to each button, and wrap the container with
`role="tablist"` and `aria-label="Notebook sections"`.

---

#### ENH-002: No Crisis / Emergency SOS Button

**Files:** `components/notebook/pages/today-page.tsx`,
`components/notebook/pages/library-page.tsx`

The Library page includes "Crisis Hotlines" in the Quick Links section (loaded
from Firestore), but crisis resources are buried 3 taps deep. Users experiencing
acute craving or suicidal ideation need a persistent, immediately visible crisis
button. No 988 Suicide & Crisis Lifeline or SAMHSA hotline shortcut exists on
the Today page or as a persistent UI element.

**Recommendation:** Add a persistent crisis resource link/button (e.g., floating
button or pinned card on the Today page) that dials 988 or routes directly to
the crisis hotlines list.

---

#### ENH-003: Support Circle Contacts Are Hardcoded Demo Data

**File:** `components/notebook/pages/support-page.tsx` **Lines:** 17–39

The "My Support Circle" page renders three hardcoded contacts (Jordan, Maya, Dr.
Lopez). There is no mechanism to add, edit, or delete contacts. The
Call/Text/Directions buttons exist visually but are not wired to `tel:`, `sms:`,
or maps URLs.

**Current state:**

```tsx
const contacts: Contact[] = [
  { id: "1", name: "Jordan", role: "Sponsor", ... },
  { id: "2", name: "Maya", role: "Friend", ... },
  { id: "3", name: "Dr. Lopez", role: "Counselor", ... },
];
```

**Fix:** Implement CRUD for sponsor/support contacts stored in Firestore under
the user's profile. Wire Call/Text buttons to `href="tel:"` and `href="sms:"`
anchors.

---

#### ENH-004: No User Data Export Despite Privacy Promise

**Files:** `components/onboarding/onboarding-wizard.tsx` (line 419),
`components/settings/settings-page.tsx`

The onboarding privacy screen explicitly states: "Export or delete your data
anytime from Settings. You're in control." The Settings page
(`settings-page.tsx`) contains only nickname, clean date, and two preference
toggles. No export or delete functionality is present.

This is a broken user promise and a GDPR/CCPA compliance risk.

**Fix:** Add a "Download My Data" button in Settings that exports journal
entries, daily logs, and profile as JSON or CSV via a Cloud Function.

---

#### ENH-005: No Account Deletion Flow

Same as ENH-004 context. The Settings page has no "Delete My Account" option.
The `AuthProvider` and Firebase support this, but it is not exposed in the UI.

**Fix:** Add a "Delete Account" section in Settings with a confirmation modal
that deletes all user Firestore data and the Firebase Auth account.

---

#### ENH-016: Support Circle Action Buttons Not Wired

**File:** `components/notebook/pages/support-page.tsx` **Lines:** 84–103

The Call, Text, and Directions buttons in the support contact detail panel are
rendered as `<button>` elements with no `onClick` handlers and no `href` links.
They are completely non-functional.

```tsx
<button className="flex-1 py-2 px-4 ...">Call</button>
<button className="flex-1 py-2 px-4 ...">Text</button>
<button className="flex-1 py-2 px-4 ...">Directions</button>
```

---

### S2 — Medium Priority

#### ENH-006: Sign-In Modal Lacks Accessibility Semantics

**File:** `components/auth/sign-in-modal.tsx` **Lines:** 70–80

The modal backdrop and container have no `role="dialog"`, no
`aria-modal="true"`, no `aria-labelledby`, and no focus trap. Screen readers
will not announce it as a dialog, and keyboard users may be able to navigate
behind the modal overlay.

The close button (X) also lacks an `aria-label`:

```tsx
<button onClick={onClose} className="absolute top-2 right-2 ...">
  <X className="w-5 h-5 text-stone-600" />
  {/* No aria-label */}
</button>
```

---

#### ENH-007: Onboarding Progress Dots Have No Labels

**File:** `components/onboarding/onboarding-wizard.tsx` **Lines:** 187–201

The step indicator dots are rendered as `<div>` elements (not buttons), and they
have no `aria-label` or screen reader text. A screen reader user has no way to
know which step they're on or how many steps remain.

**Fix:** Add a visually-hidden text or convert to `<button>` with
`aria-label="Step X of 5"`.

---

#### ENH-008: PWA Manifest Uses JPEG Icons

**File:** `public/manifest.json`

```json
{
  "icons": [
    { "src": "/pwa-icon.jpg", "sizes": "192x192 512x512", "type": "image/jpeg" }
  ]
}
```

PWA install prompts and adaptive icons require PNG or WebP format with
`"purpose": "maskable"` for proper system integration. JPEG icons lack
transparency support needed for maskable icon backgrounds. Android Chrome may
reject or display incorrectly.

---

#### ENH-009: No Noscript Fallback

**File:** `app/layout.tsx`

The app has no `<noscript>` element. Users with JavaScript disabled (unlikely
for the primary audience, but relevant for screen readers and certain privacy
tools) see a completely blank page. A basic `<noscript>` message should be
added.

---

#### ENH-010: No Long-Term Mood History Visualization

**Files:** `components/notebook/visualizations/mood-sparkline.tsx`,
`components/notebook/pages/today-page.tsx`

The MoodSparkline component shows a 7-day trend. There is no 30-day, 90-day, or
lifetime mood chart. Recovery apps like Sober Grid and WEconnect provide rich
mood history to help users and sponsors identify patterns. The `History` page
shows 7-day entry list only.

---

#### ENH-011: "Tap to Set Clean Date" Is Not Interactive

**File:** `components/notebook/pages/today-page.tsx` **Lines:** 877–890

When no clean date is set, the app renders:

```tsx
<p className="font-body text-sm text-amber-900/60 mt-1 cursor-pointer hover:underline">
  You haven't set your clean date yet.
</p>
```

This paragraph has `cursor-pointer` and `hover:underline` but no `onClick`
handler, no link, and no button semantics. Clicking it does nothing. Users are
told to "Tap to set clean date" but that action has no effect.

---

#### ENH-012: Fixed Notebook Width Breaks at Non-Standard Viewport Widths

**File:** `components/notebook/notebook-shell.tsx` **Lines:** 200–202

```tsx
<div className="relative w-[340px] h-[520px] md:w-[800px] md:h-[560px] ...">
```

The notebook renders at exactly 340px on mobile and 800px on desktop. On small
tablets (~600px wide), or wide phones in landscape, neither breakpoint applies
cleanly. The `md:` breakpoint is 768px, leaving a 428px–767px viewport range
where the 340px notebook looks cramped but 800px doesn't trigger. Content within
the notebook also has fixed height `h-[520px]` / `h-[560px]`, which can cause
overflow on very small displays.

---

#### ENH-014: Step 4 and Step 8 Growth Buttons Are Non-Functional

**File:** `components/notebook/pages/growth-page.tsx` **Lines:** 88–120

The Step 4 Inventory and Step 8 List are rendered as clickable-looking
`<motion.button>` elements with no `onClick` handler. They appear interactive
but do nothing.

---

#### ENH-015: VoiceTextArea Mic Button Missing Aria-Label

**File:** `components/ui/voice-text-area.tsx` **Line:** 97

```tsx
<button
  type="button"
  onClick={toggleListening}
  title={isListening ? "Stop recording" : "Start voice input"}
  // No aria-label — title attr is not reliably read by screen readers
>
```

`title` attributes are not consistently announced by screen readers. An
`aria-label` is required.

---

#### ENH-017: History Page Shows Only 7-Day Window

**File:** `components/notebook/pages/history-page.tsx` **Lines:** 131–133

```tsx
const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
return entries.filter((entry) => ... entryDate >= sevenDaysAgo ...)
```

The notebook's History tab is hard-limited to the last 7 days. Older entries
exist in Firestore but are invisible in this view. The "View Full Journal" link
goes to `/journal` which is a separate full-screen route. This UX split is
confusing — the notebook tab feels incomplete.

---

#### ENH-018: Large Text Preference Is Not Applied

**File:** `components/settings/settings-page.tsx` **Lines:** 238, 379–380

The "Large Text" toggle saves to Firestore via `preferences.largeText`, but no
component reads this value to apply larger text styles. The preference is saved
but never consumed, making it a dead setting.

---

#### ENH-019: No Forgot Password Flow

**File:** `components/auth/sign-in-modal.tsx`

The email/password sign-in form has no "Forgot password?" link. Firebase Auth
supports `sendPasswordResetEmail()`. Users who created accounts with email and
forget their password have no recovery path.

---

#### ENH-022: Share Meeting Button Is Broken

**File:** `components/notebook/pages/resources-page.tsx` **Lines:** 497–499

```tsx
const handleShare = () => {
  toast.success("Link copied to clipboard!");
  // Nothing is actually copied
};
```

The Share button on meeting details toasts a success message without calling
`navigator.clipboard.writeText()` or any actual sharing mechanism.

---

#### ENH-023: WCAG Color Contrast Not Verified

The app uses amber-on-amber color combinations extensively (e.g.,
`text-amber-900/60` on `bg-amber-50`). The `/60` opacity creates a computed
color of approximately `rgba(120, 53, 15, 0.6)` on a light amber background.
This may fail WCAG 2.1 AA contrast ratio of 4.5:1 for normal text. A formal
contrast audit has not been performed against the actual rendered colors.

**High-risk combinations:**

- `text-amber-900/60` on `bg-amber-50` (used throughout Today page)
- `text-amber-900/40` on `bg-white/50` (journal entry previews)
- `text-amber-900/50` on `bg-[#f5f0e6]` (notebook background)

---

#### ENH-024: No Skip-to-Content Link

**File:** `app/layout.tsx`

No skip-to-main-content link exists. Keyboard users must tab through the entire
navigation before reaching page content. WCAG 2.4.1 (Bypass Blocks) requires a
mechanism to skip repeated navigation.

---

### S3 — Low Priority

#### ENH-013: No i18n Infrastructure

No translation framework (next-intl, react-i18next) is installed. All strings
are hardcoded in English. Nashville has a significant Spanish-speaking
population (~15%), and Spanish-language recovery resources are underserved.

---

#### ENH-020: Journal Lock Screen Exists but Is Never Used

**File:** `components/journal/lock-screen.tsx`

A lock screen component exists in the journal feature directory but is never
imported or rendered. The privacy-first messaging could benefit from a
PIN/biometric lock for the journal.

---

#### ENH-021: Swipe Navigation Has No Visual Affordance

**File:** `components/notebook/notebook-shell.tsx` **Lines:** 1132–1134

The only hint is a footer text: "Swipe left for more →". Swipe navigation
between tabs is not obvious on first use. Consider adding a subtle swipe
indicator animation or onboarding hint.

---

#### ENH-025: PWA Manifest Forces Portrait Orientation

**File:** `public/manifest.json` **Line:** 9

```json
"orientation": "portrait"
```

This blocks the app from rotating to landscape on tablets and wide phones in
standalone mode. Removing this restriction (or setting to `"any"`) would improve
usability on tablets.

---

## 4. Feature Gap Analysis

### Compared to Leading Recovery Apps

| Feature                          | SoNash                      | Sober Grid | WEconnect | I Am Sober |
| -------------------------------- | --------------------------- | ---------- | --------- | ---------- |
| Daily check-in (mood + cravings) | YES                         | YES        | YES       | YES        |
| Clean time counter               | YES                         | YES        | YES       | YES        |
| Meeting finder                   | YES                         | YES        | YES       | NO         |
| Journaling                       | YES                         | YES        | NO        | YES        |
| Sponsor contact management       | NO                          | YES        | YES       | YES        |
| Emergency/crisis SOS button      | NO                          | NO         | YES       | NO         |
| Community/social features        | NO                          | YES        | YES       | NO         |
| Mood trend charts (30/90-day)    | NO                          | YES        | YES       | YES        |
| Sobriety chips/milestone badges  | YES (celebration)           | YES        | YES       | YES        |
| Step work guides                 | Partial (Steps 1,4,8 stubs) | NO         | YES       | NO         |
| Data export                      | NO                          | NO         | NO        | YES        |
| Account deletion in app          | NO                          | YES        | YES       | YES        |
| Offline journaling               | YES (localStorage)          | NO         | NO        | NO         |
| Voice journaling                 | YES (VoiceTextArea)         | NO         | NO        | NO         |
| Prayer/meditation section        | YES                         | NO         | NO        | NO         |
| Sober living finder              | YES                         | NO         | NO        | NO         |

**Key gaps relative to competitors:**

1. **Sponsor contact management** — core recovery feature, currently demo-only
2. **Long-term mood visualization** — users cannot see 30/90-day trends
3. **Community/accountability features** — SoNash is fully private/solo; no
   accountability partner features
4. **Step work completion** — only Steps 1, 4, 8 present and Step 4/8 are
   non-functional stubs

### Nashville-Specific Gaps

- No crisis hotline phone numbers prominently displayed (988, SAMHSA, Nashville
  Crisis Line)
- No Spanish-language resources
- No LGBTQ+-specific meeting filter (LGBTQ+ meetings are common in Nashville)
- Sober events calendar is a stub with no data

---

## 5. Recommendations

### Immediate (S1) — Address Before Wider Rollout

1. **Wire Support Circle**: Implement real contact CRUD with `tel:` and `sms:`
   links. Store contacts in Firestore. **(ENH-003, ENH-016)**

2. **Add Data Export and Account Deletion**: Implement Cloud Functions for data
   export (JSON download) and account + data deletion. Add both to Settings page
   to fulfill the onboarding privacy promise. **(ENH-004, ENH-005)**

3. **Add Crisis Resource Shortcut**: Add a persistent "Crisis Help" button or
   card on the Today page that links directly to crisis hotline resources.
   **(ENH-002)**

4. **Fix Tab Navigation Accessibility**: Add `role="tablist"`, `role="tab"`,
   `aria-selected`, and `aria-label` to the tab ribbon. **(ENH-001)**

### Short-Term (S2) — Next Sprint

5. **Fix Sign-In Modal Accessibility**: Add `role="dialog"`, `aria-modal`,
   `aria-labelledby`, and focus trap. **(ENH-006)**

6. **Fix Broken UX Bugs**:
   - Make "Tap to set clean date" actually navigate to Settings. **(ENH-011)**
   - Fix Share meeting button to actually copy to clipboard. **(ENH-022)**
   - Wire Step 4 / Step 8 buttons or mark them clearly as coming soon.
     **(ENH-014)**

7. **Fix PWA Icons**: Replace JPEG icons with PNG/WebP with
   `"purpose": "any maskable"`. **(ENH-008)**

8. **Add VoiceTextArea aria-label**: One-line fix for the mic button.
   **(ENH-015)**

9. **Implement Large Text Preference**: Read `profile.preferences.largeText` in
   the root layout and conditionally apply a `text-lg` or `large-text` CSS
   class. **(ENH-018)**

10. **Add Forgot Password**: Add `sendPasswordResetEmail()` flow to the sign-in
    modal. **(ENH-019)**

11. **Conduct WCAG Contrast Audit**: Use a tool like Axe or Lighthouse to verify
    amber-on-amber color combinations meet 4.5:1 ratio. **(ENH-023)**

12. **Add Skip-to-Content Link**: Add a visually-hidden skip link as the first
    focusable element. **(ENH-024)**

### Medium-Term (E2-E3) — Roadmap

13. **Mood History Charts**: Implement 30/90-day mood visualization on the
    History tab or a new "Insights" page.

14. **Expand Step Work**: Complete functional Step 4 Inventory and Step 8 List
    forms.

15. **Community Accountability**: Consider optional accountability partner
    sharing (sponsor can view summary stats).

16. **i18n Foundation**: Install `next-intl`, extract English strings to locale
    files as a foundation for future translation.

17. **Nashville Events Calendar**: Build out the sober events section with a
    Firestore-backed event listing.

---

## 6. Positive Findings (Strengths to Preserve)

- **Error boundary** is thorough with retry, reload, and debug export options.
- **Offline indicator** is clean and informative with reconnection feedback.
- **PWA install prompt** works for both Android and iOS with appropriate
  instructions.
- **Milestone celebrations** (confetti, fireworks at 7/30/60/90/180/365 days)
  are a genuine differentiator.
- **Smart prompts** (check-in reminders, HALT suggestions, streak celebrations)
  show thoughtful UX design.
- **Autosave with localStorage fallback** prevents data loss during connectivity
  issues.
- **WCAG 2.1 zoom compliance** — viewport meta correctly allows user scaling.
- **Onboarding flow** is warm, friendly, and appropriately brief (5 steps).
- **Anonymous auth with account linking** removes friction for first-time users.
- **Voice input** in journal is a standout accessibility/UX feature.
- **Server-side rendering** of the landing page background for fast FCP is
  well-implemented.

---

_Report generated by enhancements-auditor agent | 2026-02-22_
