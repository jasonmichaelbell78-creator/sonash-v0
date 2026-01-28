---
Last Updated: 2026-01-27
---

# SoNash Expansion: Module 2 – Sponsor Tooling & Connection

## Purpose

Expansion module ideation document exploring sponsor tooling and connection
features for the SoNash app, bridging digital isolation with human
accountability.

## Version History

| Version | Date       | Description           |
| ------- | ---------- | --------------------- |
| 1.0     | 2026-01-27 | Initial documentation |

---

**Core Philosophy:** "The Bridge." The app is a private sanctuary, but recovery
requires connection. These tools bridge the gap between digital isolation and
human accountability without creating a "surveillance state."

---

## Category 1: Sponsee Enacted (The Push)

_Tools the user initiates to share data, ask for help, or manage the
relationship._

### 1. Sponsor Export & "Redaction Pre-Flight"

_Merged: "Sponsor Export (PDF)" + "Redaction Pre-Flight Check"_

- **Expanded Description:** Sharing a journal is terrifying. This tool acts as a
  "security clearance" for the user's own thoughts. It generates a clean,
  printable PDF of specific worksheets or journals but gives the user absolute
  control _before_ the file is generated.
- **The Workflow:**
  1. **Select Scope:** User chooses a specific Step (e.g., "Step 4") or date
     range.
  2. **Scan:** The app presents a scrollable, document-style preview of exactly
     what will be shared.
  3. **Redact:** User swipes across sensitive paragraphs to visually "black them
     out" or taps "Exclude" to remove sections entirely.
  4. **Annotate:** User adds a "Cover Note" (e.g., "I'm ready to talk about the
     blacked-out parts in person, just not in writing").
  5. **Send:** Generates the sanitized PDF to share via system native sheet
     (Signal, iMessage, etc.).

### 2. The "Hard Conversation" Script Library & Drafts

_Merged: "Ask Sponsor Draft" + "Script Library"_

- **Expanded Description:** When a sponsee is in trouble (relapse, resentment,
  fear), shame often causes silence. This tool lowers the friction of reaching
  out by providing pre-written, non-shaming templates for high-stakes moments.
- **The Tool:** A "Compose" screen with a "Template" button.
- **Template Examples:**
  - _The "I Slipped" Text:_ "I need to be honest. I drank/used. I'm safe, but I
    need to talk when you're free."
  - _The "I'm Stuck" Text:_ "I'm spinning my wheels on Step 4. Can we schedule
    15 mins to unblock me?"
  - _The "Resentment" Text:_ "I'm angry at you right now and I don't want to be.
    Can we talk about it?"
- **Action:** Tapping a template copies it to the system clipboard or opens the
  user's preferred messaging app, keeping the actual chat outside of SoNash for
  privacy.

### 3. "Mood-Stamped" Check-In & Quick Dial

_Merged: "Sponsee Help Request" + "Mood-Stamped Check-In"_

- **Expanded Description:** A text saying "I'm fine" is often a lie. This tool
  allows the user to communicate their emotional state instantly using visual
  data rather than paragraphs, paired with immediate access to support.
- **The Tool:** A "Check-In" generator.
- **The Workflow:**
  1. **Input:** User taps their current **HALT** status (Hungry, Angry, Lonely,
     Tired) and a **Willingness** slider (1–10).
  2. **Generate:** The app creates a small, clean image card (visualizing the
     data like a Spotify Share card).
  3. **Action:** The user can "Send Image" to their sponsor or tap the **"Quick
     Dial" FAB** (Floating Action Button) to call them immediately if the stats
     are in the danger zone.

### 4. Next Call Agenda ("The Parking Lot")

_Merged: "Next Call Agenda Builder" + "The Parking Lot"_

- **Expanded Description:** Sponsees often forget the critical issues they faced
  midweek by the time their scheduled sponsor call happens. This is a global
  "quick capture" system to ensure nothing important is lost.
- **The Tool:** A "Park for Sponsor" button available on every worksheet and
  journal entry.
- **The Workflow:**
  - _During the Week:_ If a user hits a block or has a breakthrough, they tap
    "Park for Sponsor."
  - _During the Call:_ The user opens the **"Agenda Mode."** All parked items
    are presented as a checklist (e.g., "Discuss fear from Tuesday," "Clarify
    Step 6 definition").
  - _After the Call:_ User checks them off as "Discussed."

### 5. "Circle of Trust" & Invite Manager

_Merged: "Sponsor Invite Link" + "Circle of Trust"_

- **Expanded Description:** Recovery often involves more than one support person
  (Service Sponsor, Step Sponsor, Therapist). This permissions manager reflects
  that reality.
- **The Tool:** A contact management screen where the user assigns roles.
- **The Roles:**
  - _Primary Sponsor:_ Access to shared Step Work & Safety Plans.
  - _Accountability Partner:_ Access to Meeting Attendance & Daily Check-in
    stats only.
  - _Therapist:_ Access to Mood Logs & specific journals only.
- **Action:** Generates unique, role-specific invite links that grant these
  specific read-only permissions (if the cloud sync feature is active) or sets
  defaults for manual exports.

### 6. The Sponsor Vetting Guide

_New Feature_

- **Expanded Description:** Newcomers often pick the wrong sponsor (predatory,
  unavailable, or incompatible) out of desperation. This private decision matrix
  helps them pause and evaluate safety.
- **The Tool:** A private checklist the user fills out _about_ a potential
  sponsor.
- **The Checklist:**
  - _Do they have what I want?_
  - _Do they speak the language of recovery?_
  - _Do they respect boundaries?_
  - _Did they mention the Steps (or just their own opinions)?_
- **Outcome:**
  - _Mostly "Yes":_ Offers the **"Script to Ask"** template.
  - _Mostly "No":_ Displays a warning: "Take your time. You don't have to decide
    today."

---

## Category 2: Sponsor Enacted (The Pull/Collaborative)

_Tools designed to help the sponsor understand data, collaborate, or provide
accountability. (Note: These are "Sponsor-Facing" but often
generated/facilitated by the User's app)._

### 1. Sponsor Summary & "The Cheat Sheet"

_Merged: "Sponsor Summary Report" + "Sponsor's Cheat Sheet"_

- **Expanded Description:** Sponsors are often busy and don't know how to
  interpret raw app data. This feature turns a "Data Dump" into a "Training
  Manual" for the sponsor.
- **The Tool:** A one-page aggregate report with an educational footer.
- **The Report:** High-level stats (Days Sober, Meetings This Week, Mood Trend
  line) without private details.
- **The Cheat Sheet (Footer):** A static guide appended to the export:
  - _"How to read this: Look for patterns in the 'Time of Day' column on the
    mood log."_
  - _"Red Flags: If 'Resentment' counts are up, ask about their
    prayer/meditation routine."_
  - _"Safety Note: This user has flagged 'Trauma' on page 4—approach with
    care."_

### 2. The "Relapse Autopsy" Worksheet (Collaborative)

_New Feature_

- **Expanded Description:** After a relapse, the sponsor/sponsee relationship is
  often strained or chaotic. This tool provides a structured, neutral ground for
  debriefing, designed to be filled out _during_ a call.
- **The Tool:** A specific worksheet locked until a "Reset" event occurs.
- **The Questions (Collaborative):**
  - _The Setup:_ "What happened 24 hours _before_ the event?" (e.g., skipped
    meal, argument).
  - _The Trigger:_ "What was the exact moment the mental decision was made?"
  - _The Barrier:_ "Why didn't I pick up the phone?" (Identifies the failure
    point).
  - _The Plan:_ "What is ONE thing we change for next time?"
- **Output:** Generates a **"Safety Plan V2"** image card that saves to the
  user's home screen.

### 3. Shared Commitments ("The Digital Handshake")

_Merged: "Shared Commitments Board" + "Co-Sponsor Handshake"_

- **Expanded Description:** A mechanism for accountability that relies on
  integrity rather than gamified streaks. It digitally mimics looking someone in
  the eye and saying, "I did it."
- **The Tool:** A 2-way toggle board (requires linked accounts or manual
  "Witness" entry).
- **The Workflow:**
  1. **Agreement:** Sponsor and Sponsee agree on a goal (e.g., "90 meetings in
     90 days" or "Call daily").
  2. **The Log:** Sponsee taps "Did it."
  3. **The Witness:** The Sponsor sees the update and taps "Witnessed" (a
     checkmark or 'fist bump' icon).
  4. **Offline Fallback:** If not digitally linked, the user manually checks a
     box: _"I reported this to [Sponsor Name] at [Time]."_

### 4. Sponsor Prompt Library

_Expansion of "Sponsor Prompt Library"_

- **Expanded Description:** Sometimes sponsors want to reach out but don't want
  to be overbearing. This resource provides them with gentle, effective
  questions to send to the user.
- **The Tool:** A web-viewable or exportable list of prompts the user can send
  to their sponsor: _"Here is a list of questions I respond well to."_
- **The Prompts:**
  - _"What is the loudest thought in your head right now?"_
  - _"Have you eaten something nutritious today?"_
  - _"Where did you see your Higher Power today?"_
  - _"Are you holding onto anything you need to let go of?"_

### 5. One-Time Share Code

_Expansion of "One-Time Share Code"_

- **Expanded Description:** A security feature for sponsors who do not have the
  app. It allows them to view a specific document securely without receiving a
  permanent file that could be leaked.
- **The Tool:** A link generator.
- **The Action:** User selects a document (e.g., "Step 4 - Fears"). App
  generates a URL.
- **The Security:**
  - **Time-Limited:** The link expires automatically in 24 hours.
  - **Read-Only:** The document cannot be edited.
  - **Revocable:** The user can tap "Kill Link" at any time to immediately
    revoke access.
