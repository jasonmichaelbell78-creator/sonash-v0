# 📋 COMPREHENSIVE JOURNAL SYSTEM PROPOSAL
**Date:** December 17, 2025  
**Status:** Awaiting User Decision

---

## Executive Summary

SoNash currently collects extensive personal recovery data across multiple features (mood check-ins, cravings, substance use, journal entries, spot checks, night reviews, gratitude lists, etc.). This proposal outlines a comprehensive, secure journal system to store, organize, and provide access to all user entries with robust privacy protections.

---

## 📊 Current Data Being Collected

### **Daily Check-In (Today Page)**
- ✅ Mood selection
- ✅ Cravings (boolean)
- ✅ Used substances (boolean)  
- ✅ Recovery Notepad (journal text)
- ✅ Timestamp (updatedAt)

### **Inventory Tools (Growth Page)**
- ✅ Spot Checks (action items, absolutes)
- ✅ Night Reviews (gratitude, surrender, tomorrow plan)
- ✅ Gratitude Lists
- ✅ Timestamps (createdAt)

### **Planned/Future Data Types**
- ❌ Nightly Inventory (full 10th step)
- ❌ Meeting notes
- ❌ Sponsor conversations
- ❌ Step work progress
- ❌ Trigger logs
- ❌ Prayer/meditation logs
- ❌ Emergency contact logs
- ❌ Relapse prevention plans

---

## 🏗️ PROPOSED ARCHITECTURE

### 1. Data Structure Enhancement

#### Current State
```typescript
// Separate collections with different structures
DailyLog {
  date, mood, cravings, used, content, updatedAt
}

InventoryEntry {
  type, data, createdAt
}
```

#### Proposed Unified Structure
```typescript
interface JournalEntry {
  id: string                    // Firestore auto-generated
  userId: string               // Owner
  type: 'daily-log' | 'spot-check' | 'night-review' | 'gratitude' | 
        'meeting-note' | 'step-work' | 'prayer-meditation' | 
        'trigger-log' | 'emergency-contact' | 'relapse-prevention'
  createdAt: Timestamp         // When created
  updatedAt: Timestamp         // Last modified
  date: string                 // YYYY-MM-DD for filtering by day
  
  // Type-specific data stored in flexible object
  data: {
    // For daily-log
    mood?: string
    cravings?: boolean
    used?: boolean
    content?: string
    
    // For spot-check
    action?: string
    absolutes?: string[]
    situation?: string
    
    // For night-review
    gratitude?: string
    surrender?: string
    tomorrowPlan?: string
    version?: number
    
    // For meeting-note
    meetingName?: string
    meetingType?: 'AA' | 'NA' | 'CA'
    notes?: string
    speaker?: string
    
    // For step-work
    stepNumber?: number
    questions?: {question: string, answer: string}[]
    reflections?: string
    
    // For trigger-log
    trigger?: string
    response?: string
    outcome?: string
    toolsUsed?: string[]
    
    // For prayer-meditation
    duration?: number
    type?: string
    insights?: string
    
    // Flexible for future expansion
    [key: string]: any
  }
  
  // Privacy & sharing
  isPrivate: boolean          // Hidden from shares
  sharedWith?: string[]       // UIDs of sponsors/accountability partners
  tags?: string[]             // User-defined tags for filtering
  attachments?: string[]      // Future: photo/document URLs
}
```

### 2. Firestore Collection Structure

```
users/{userId}/
  ├── profile/
  ├── journal/              ← NEW unified collection
  │   ├── {entryId}
  │   ├── {entryId}
  │   └── ...
  ├── dailyLogs/            ← MIGRATE to journal/ or keep for backward compat
  └── inventoryEntries/     ← MIGRATE to journal/ or keep for backward compat
```

**Migration Strategy:**
- **Option A (Clean Break):** Migrate all existing data to new `journal/` collection, archive old collections
- **Option B (Gradual):** Keep old collections, new entries go to `journal/`, merge in queries
- **Option C (Dual Write):** Write to both old and new for 30 days, then switch entirely

---

## 🔒 SECURITY ARCHITECTURE

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Journal entries - strict user isolation
    match /users/{userId}/journal/{entryId} {
      
      // Only owner can read their own entries
      allow read: if request.auth != null 
        && request.auth.uid == userId;
      
      // Only owner can create their own entries
      allow create: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.data.userId == userId
        && request.resource.data.createdAt == request.time
        && request.resource.data.updatedAt == request.time;
      
      // Only owner can update, preserve creation timestamp
      allow update: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.data.userId == userId
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.updatedAt == request.time;
      
      // NO DELETION - preserve recovery history
      // If deletion needed, use "soft delete" flag instead
      allow delete: if false;
    }
    
    // Shared journal entries (Future: sponsor access)
    match /sharedJournal/{shareId} {
      allow read: if request.auth != null 
        && request.auth.uid in resource.data.sharedWith;
      
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.ownerId;
    }
    
    // Analytics aggregates (anonymous, read-only for users)
    match /userStats/{userId} {
      allow read: if request.auth != null 
        && request.auth.uid == userId;
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

### Client-Side Security Measures

1. **Transmission Security**
   - ✅ All data over HTTPS only
   - ✅ Firebase SDK encryption in transit
   - ✅ No unencrypted local storage

2. **Authentication**
   - ✅ Firebase Authentication required
   - ✅ Session timeout after 30 minutes inactivity
   - ✅ Re-authentication for sensitive operations

3. **Rate Limiting**
   - ✅ Max 100 writes per minute per user
   - ✅ Max 500 reads per minute per user
   - ✅ Exponential backoff on quota exceeded

4. **Data Handling**
   - ✅ No client-side caching of entries
   - ✅ Clear data on logout
   - ✅ Secure context required (no embedding)

5. **Privacy Controls**
   - ✅ Per-entry privacy toggles
   - ✅ Explicit consent for sharing
   - ✅ Audit log of access (future)

---

## 🎨 USER EXPERIENCE PROPOSALS

### Option A: Dedicated Journal Page (RECOMMENDED)

**History Tab** → Click → **Navigate to `/journal` page**

#### Layout
```
┌──────────────────────────────────────────────────────┐
│  MY RECOVERY JOURNAL                    [Settings ⚙️] │
│  ┌────────────────────────────────────────────────┐  │
│  │ [🔍 Search entries...]  [📅 Calendar] [Export]│  │
│  │ Filters: [All ▼] [This Week ▼] [Tags ▼]      │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  📅 December 17, 2025                                │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🌤️ Daily Check-in                   10:30 AM │   │
│  │ "Feeling hopeful today. Meeting was great."  │   │
│  │ 😊 Hopeful • No cravings • Clean              │   │
│  │ [View Full Entry →]                           │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ ⚡ Spot Check                         2:30 PM │   │
│  │ "Noticed trigger at work - called sponsor"   │   │
│  │ Action: Called sponsor                        │   │
│  │ [View Full Entry →]                           │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🌙 Night Review                      10:00 PM │   │
│  │ Gratitude: "Grateful for my sponsor's support"│  │
│  │ Tomorrow: Continue daily meditation           │   │
│  │ [View Full Entry →]                           │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  📅 December 16, 2025                                │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🌤️ Daily Check-in                    9:15 AM │   │
│  │ ...                                           │   │
│                                                      │
│  [Load More ↓]                                       │
└──────────────────────────────────────────────────────┘
```

#### Features
- **Timeline View:** Reverse chronological, infinite scroll
- **Search:** Full-text search across all entries
- **Filters:** 
  - By type (daily logs, spot checks, etc.)
  - By date range (today, this week, this month, custom)
  - By mood/status
  - By tags
- **Calendar View:** Toggle to month/week calendar with entry indicators
- **Export Options:**
  - PDF report
  - Text file
  - Email to sponsor/therapist
  - Shareable link (temporary, expiring)
- **Privacy Indicators:** Lock icon on private entries
- **Quick Actions:** Edit, delete (soft), share, tag

### Option B: Enhanced History Tab (Alternative)

Keep History tab but transform it into **Interactive Expandable Timeline**

```
┌─────────────────────────────────────┐
│ HISTORY                             │
│ [Search] [Filter ▼]                 │
├─────────────────────────────────────┤
│                                     │
│ ▼ December 17, 2025 (3 entries)    │
│   ├─ 🌤️ Daily Check-in     [Expand]│
│   ├─ ⚡ Spot Check         [Expand]│
│   └─ 🌙 Night Review       [Expand]│
│                                     │
│ ▼ December 16, 2025 (2 entries)    │
│   ...                               │
└─────────────────────────────────────┘
```

Clicking expands inline, no navigation needed.

### Option C: Hybrid Approach

- **History Tab:** Quick 7-day timeline
- **"View Full Journal" button** → `/journal` for deep access

---

## 🔐 PRIVACY & SECURITY TRANSPARENCY FOR USERS

### First-Time Modal (Shown on first journal access)

```
┌────────────────────────────────────────────────┐
│  🔒 YOUR PRIVACY & SECURITY                    │
├────────────────────────────────────────────────┤
│                                                │
│  Your recovery journal is completely private.  │
│                                                │
│  ✓ Only YOU can access your entries           │
│  ✓ All data encrypted in transit & at rest    │
│  ✓ Stored securely with Google Firebase       │
│  ✓ No ads, no tracking, no data selling       │
│  ✓ You control sharing with sponsors          │
│  ✓ Export or delete your data anytime         │
│  ✓ Anonymous usage - we never share identity  │
│                                                │
│  We follow HIPAA-aligned best practices for    │
│  sensitive health data.                        │
│                                                │
│  [ View Full Privacy Policy ]                  │
│                                                │
│  [ I Understand & Agree ]                      │
└────────────────────────────────────────────────┘
```

### Ongoing Privacy Features

1. **Privacy Badge on Journal Tab**
   - Small lock icon indicator
   - Tooltip: "Your entries are secure"

2. **Settings Page Section**
   ```
   PRIVACY & DATA
   
   [x] Require re-authentication for journal access
   [x] Auto-lock after 15 minutes inactivity
   [ ] Enable sponsor sharing (optional)
   
   Data Management:
   - Export All Data (JSON/PDF)
   - Delete Account & All Data
   - Download Privacy Report
   ```

3. **Per-Entry Privacy Toggle**
   ```
   When creating/editing entry:
   
   [ ] Mark as Private
       (Hidden from all shares, export-only)
   ```

---

## 📊 IMPLEMENTATION ROADMAP

### **Phase 1: Foundation (Week 1 - This Week)**
**Objective:** Establish secure infrastructure

- [ ] Design final JournalEntry interface
- [ ] Create Firestore `journal/` collection structure
- [ ] Write comprehensive security rules
- [ ] Add rate limiting for journal operations
- [ ] Create privacy notice modal component
- [ ] Set up data migration script (if needed)

**Deliverables:**
- Updated Firestore rules deployed
- Privacy modal implemented
- Backend ready for journal entries

---

### **Phase 2: Journal Page MVP (Week 2)**
**Objective:** Build core journal viewing experience

- [ ] Create `/journal` route and page component
- [ ] Implement timeline component
  - [ ] Entry cards with type icons
  - [ ] Timestamp display
  - [ ] Preview text
- [ ] Add entry detail modal/page
- [ ] Implement infinite scroll/pagination
- [ ] Add basic filtering (by type, by date)
- [ ] Connect to Firestore journal collection

**Deliverables:**
- Working journal page accessible from History tab
- Users can view all their entries
- Responsive design (mobile + desktop)

---

### **Phase 3: Search & Organization (Week 3)**
**Objective:** Add powerful discovery tools

- [ ] Implement full-text search
- [ ] Add advanced filters
  - [ ] Date range picker
  - [ ] Mood filter
  - [ ] Tag filter
- [ ] Create calendar view toggle
- [ ] Add tagging system
  - [ ] Add/remove tags on entries
  - [ ] Tag suggestions
- [ ] Sort options (newest, oldest, type)

**Deliverables:**
- Search functionality
- Multiple view modes
- Tag organization system

---

### **Phase 4: Export & Sharing (Week 4)**
**Objective:** Enable data portability and accountability

- [ ] PDF export
  - [ ] Date range selection
  - [ ] Template design
  - [ ] Generate PDF client-side or server-side
- [ ] Text export (Markdown/Plain text)
- [ ] Email sharing
  - [ ] Compose email with selection
  - [ ] Temporary share links
- [ ] Sponsor access (optional)
  - [ ] Invite system
  - [ ] Granular permissions
  - [ ] Revoke access
- [ ] Privacy controls refinement

**Deliverables:**
- Export to PDF/text
- Sharing capabilities
- Sponsor/accountability features

---

### **Phase 5: Analytics & Insights (Week 5+)**
**Objective:** Derive meaning from data

- [ ] Mood trend charts
- [ ] Streak tracking (clean days, journal consistency)
- [ ] Insights dashboard
  - [ ] Most common triggers
  - [ ] Gratitude themes
  - [ ] Pattern recognition
- [ ] Aggregate statistics
- [ ] Goal tracking integration

**Deliverables:**
- Visual analytics
- Personalized insights
- Motivation tools

---

## ❓ DECISION POINTS FOR USER

### 1. **Page Structure Preference**
**Question:** Do you prefer:
- **Option A:** Dedicated `/journal` page (separate from History tab)
- **Option B:** Enhanced History tab (inline expansions, no navigation)
- **Option C:** Hybrid (7-day preview in History, full journal elsewhere)

**Recommendation:** Option A for scalability and feature richness.

---

### 2. **Data Migration Strategy**
**Question:** Should we:
- **Migrate:** Move all existing DailyLog and InventoryEntry data to new unified `journal/` collection
- **Dual Collection:** Keep old collections, add new `journal/` alongside
- **Gradual:** New entries to `journal/`, old data stays put, merge in queries

**Recommendation:** Migrate for clean architecture, with backup of old data.

---

### 3. **Export Formats Priority**
**Question:** Which export formats matter most? (Rank 1-5)
- [ ] PDF report (formatted, printable)
- [ ] Plain text file (raw data)
- [ ] JSON (developer-friendly, backup)
- [ ] Email to sponsor/therapist
- [ ] Shareable web link (temporary, expiring)

**Recommendation:** Start with PDF + Email in Phase 4.

---

### 4. **Sponsor/Accountability Access**
**Question:** When should sponsor sharing be available?
- **Phase 1:** Core feature from start
- **Phase 4:** After export/sharing infrastructure built
- **Later:** Not a priority for initial launch

**Recommendation:** Phase 4 to avoid complexity in early stages.

---

### 5. **Entry Editability**
**Question:** Should journal entries be:
- **Fully Editable:** Users can edit/update anytime
- **Append-Only:** Can add notes/updates but not change original
- **Locked After 24h:** Grace period for edits, then immutable

**Recommendation:** Fully editable for user flexibility, with edit history log.

---

### 6. **Deletion Policy**
**Question:** Can users delete journal entries?
- **Hard Delete:** Permanent removal (not recommended for recovery data)
- **Soft Delete:** Mark as deleted, hide from view, keep in DB
- **No Deletion:** Archive-only (can hide but not remove)

**Recommendation:** Soft delete - allows recovery from mistakes, preserves data integrity.

---

### 7. **Privacy Concerns from Recovery Apps**
**Question:** Any specific privacy features based on your experience with other recovery apps?

Examples:
- Panic button to lock app
- Biometric authentication
- Decoy mode (fake empty journal)
- Self-destruct messages
- Anonymous usage analytics

**Your Input Needed**

---

## 🛡️ COMPLIANCE & BEST PRACTICES

### Standards We Follow
- ✅ HIPAA-aligned security (though not medical records, treat as PHI)
- ✅ GDPR data protection principles
- ✅ COPPA compliance (if users < 13, though unlikely)
- ✅ ADA accessibility guidelines
- ✅ OWASP security best practices

### Third-Party Integrations
- **Firebase/Google Cloud:** SOC 2, ISO 27001 certified
- **No other third parties** have access to journal data

### Data Retention Policy
- **Active users:** Data retained indefinitely while account active
- **Deleted accounts:** 30-day grace period, then permanent deletion
- **Backups:** Encrypted, 90-day retention

---

## 📈 SUCCESS METRICS

How we'll measure if the journal system is working:

1. **Engagement:**
   - % of users who access journal weekly
   - Average entries per user per week
   - Time spent in journal section

2. **Security:**
   - Zero data breaches
   - Zero unauthorized access incidents
   - <1% error rate on permissions

3. **User Satisfaction:**
   - User feedback surveys
   - Feature requests related to journal
   - App store reviews mentioning journal

4. **Recovery Outcomes:**
   - Correlation between journal usage and clean time
   - User-reported value of journaling

---

## 🚀 NEXT STEPS

Once you provide answers to the decision points:

1. **Immediate:** Create technical specification document
2. **This Week:** Implement Phase 1 (Foundation)
3. **Next Week:** Build Phase 2 (Journal Page MVP)
4. **Ongoing:** Iterate based on user feedback

---

## 📞 CONTACT & QUESTIONS

For clarification on any technical details or to discuss implementation:
- Review this proposal
- Answer decision point questions
- Provide any additional requirements
- Set priority for phases

---

**Document Version:** 1.0  
**Last Updated:** December 17, 2025  
**Next Review:** After user decision
