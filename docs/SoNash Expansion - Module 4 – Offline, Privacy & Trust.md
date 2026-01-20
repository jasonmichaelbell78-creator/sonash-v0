# SoNash Expansion: Module 4 – Offline, Privacy & Trust

**Core Philosophy:** "Your Phone is the Vault."
We assume the user is writing things that could ruin their reputation, relationships, or legal standing if leaked. Therefore, the architecture prioritizes **Local-First** storage and **Visible Security**.

---

## Part 1: Expansions of Existing Ideas

### 1. The Offline Queue ("The Trust Indicator")

* **The Concept:** Users stop writing if they think their data will vanish in a church basement with bad reception. This UI proves their work is safe.
* **The Tool:** A persistent status pill in the header.
* **The States:**
  * **Green Check:** "Encrypted & Synced."
  * **Amber Cloud:** "Saved to Device (Waiting for Signal)."
  * **Red Lock:** "Local Only (Sync Disabled)."
* **The "Flight Mode" Assurance:** If a user tries to save while offline, a toast message explicitly says: *"Saved to local storage. We'll upload this when you're back online."*

### 2. "Burn After Reading" (Ephemeral Worksheets)

* **The Concept:** For the 5th Step or highly sensitive inventories, the user may need to write it to get it out, but never want it saved.
* **The Tool:** A specific mode for the Text Editor.
* **The Feature:**
  * **The Shredder:** When the user hits "Done," the text is not saved to the DB. It is optionally converted to a PDF (for immediate export) or simply "shredded" with a visual animation.
  * **The Promise:** The app explicitly overwrites that memory block, ensuring it cannot be recovered.

### 3. The Biometric "Step Vault"

* **The Concept:** A user might hand their phone to a friend to show a photo, but they don't want that friend seeing their Step 4 inventory.
* **The Tool:** Folder-level locking.
* **The Feature:**
  * The "Journal" and "Tracker" might be open.
  * The "Step 4" and "Amends" folders have a **FaceID/TouchID** lock icon.
  * Trying to open them triggers the OS-level biometric prompt.
  * **Panic Timeout:** If the app is backgrounded for more than 30 seconds, the Vault re-locks automatically.

### 4. Stealth Mode ("The Chameleon")

* **The Concept:** Avoiding questions like "Why do you have a rehab app?" from nosy bosses or dates.
* **The Tool:** App Icon & Name Switcher.
* **The Options:**
  * *Default:* SoNash (Notebook logo).
  * *Stealth 1:* "Calc Pro" (Calculator icon).
  * *Stealth 2:* "Notes" (Generic notepad icon).
  * *Stealth 3:* "System Utilities" (Gear icon).
* **Notification Masking:** When in Stealth Mode, push notifications read: *"System Update: Daily Check"* instead of *"SoNash: Did you stay sober?"*

### 5. The "Sandbox" (Guest Mode)

* **The Concept:** Addicts are skeptical. They don't want to give an email address just to see if the app sucks.
* **The Tool:** A fully functional "Try Before You Sign Up" flow.
* **The Feature:**
  * User gets a locally generated `Guest_ID`.
  * All data saves to `IndexedDB` (browser storage).
  * **The Upgrade:** If they decide to create an account later, the app asks: *"Merge your guest data?"*

### 6. Conflict-Safe Sync ("The Merge Assistant")

* **The Concept:** The nightmare scenario: A user writes a heartfelt journal on their iPad, then opens their phone and it overwrites the entry with an old blank version.
* **The Tool:** A "Diff" (Difference) Reviewer.
* **The Feature:**
  * If the cloud sees two different versions of "Step 1," it **never** overwrites.
  * It presents a screen: *"We found two versions. Which one do you want?"*
  * Option A (Phone version), Option B (Tablet version), or **"Keep Both"** (Saves one as a copy).

### 7. Selective Sync ("The Hybrid Model")

* **The Concept:** "I want my day count backed up, but I want my 4th Step on this phone ONLY."
* **The Tool:** Granular privacy toggles in Settings.
* **The Toggles:**
  * *Sync Profile & Days:* [ON/OFF]
  * *Sync Meeting History:* [ON/OFF]
  * *Sync Journal & Steps:* [ON/OFF]
* **Visual Cue:** Items that are "Local Only" have a small "device-only" icon next to them.

### 8. The Metadata Scrubber

* **The Concept:** A PDF export might accidentally contain the GPS coordinates of where the user wrote the entry (e.g., a domestic violence shelter).
* **The Tool:** An automatic sanitizer on export.
* **The Feature:**
  * Strips EXIF data from images.
  * Removes "Location" tags from journal entries.
  * Standardizes timestamps to "Date Only" (removing specific time, which can reveal patterns).

### 9. The "Flip-to-Hide" Gesture

* **The Concept:** A user is journaling on the bus. Someone sits next to them. They need to hide the screen instantly.
* **The Tool:** Accelerometer-based privacy trigger.
* **The Feature:**
  * User flips the phone face down.
  * The app instantly switches to a "Neutral Screen" (e.g., a calm landscape photo or a fake "Settings" menu).
  * Requires a PIN to return to the Journal.

### 10. The "Nuclear Option"

* **The Concept:** The ultimate exit strategy.
* **The Tool:** A 3-step deletion process to prevent accidents but ensure total erasure.
* **The Feature:**
  * Step 1: Tap "Delete Account."
  * Step 2: Enter Password.
  * Step 3: Type the word "DELETE" (to prevent accidental clicks).
  * **Result:** Triggers a Firebase Cloud Function that wipes the user record, deletes all sub-collections, purges storage buckets, and clears local storage.

---

## Part 2: New Ideas (Privacy & Trust)

### 11. The "Shoulder Surf" Blur

* **The Problem:** Using the app in a meeting or coffee shop where people are sitting close by.
* **The Tool:** A "Privacy Mode" toggle in the header.
* **The Feature:**
  * When active, all body text (journal entries, inventory details) is blurred out by default.
  * The user must **press and hold** a paragraph to reveal it for reading.
  * Headings remain visible so navigation is still possible.

### 12. The "No-Tracking" Dashboard

* **The Problem:** Users are used to apps selling their data. They assume SoNash does too.
* **The Tool:** A transparency report in the Settings.
* **The Feature:**
  * A static screen showing: *"Trackers Blocked: N/A (We don't use them)."*
  * A clear, plain-English summary of what is sent to the cloud: *"We sync your text so you don't lose it. We do not sync your location history. We do not sell data to advertisers."*

### 13. The "Inactivity Lock" (Dead Man's Switch Lite)

* **The Problem:** A user relapses or leaves the phone unlocked in a shared living environment (sober living).
* **The Tool:** An auto-lock based on inactivity.
* **The Feature:**
  * If the app hasn't been opened in [X] minutes (user configurable), it requires Biometrics/PIN to re-enter.
  * This prevents a roommate from picking up a phone left on the couch and reading a diary entry.

### 14. "Snapshot Protection" (OS Level)

* **The Problem:** When you swipe up to switch apps on iOS/Android, the "preview" card shows the content of the last screen (potentially sensitive text).
* **The Tool:** A privacy curtain code snippet.
* **The Feature:**
  * Detects when the app moves to the background state.
  * Instantly overlays a generic branding screen (SoNash Logo) over the UI.
  * Ensures the app switcher preview shows the logo, not the journal entry.

### 15. The "Local Network" Cloak

* **The Problem:** On iOS/Android, apps often ask to "Find devices on local network." This feels invasive.
* **The Tool:** Intentional permission denial.
* **The Feature:**
  * The app explicitly *does not* request Local Network permissions.
  * It explains why in the onboarding: *"We don't need to know what other devices are in your house. We just need an internet connection."* This builds massive goodwill with tech-savvy users.
