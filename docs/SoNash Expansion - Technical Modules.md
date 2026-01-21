# SoNash Expansion - Technical Modules

**Last Updated:** 2026-01-20 | **Source:** SoNash_Technical_Ideation_Multi_AI
1.20.26.md **AIs Consulted:** Gemini, ChatGPT, Claude, Kimi K2, Perplexity

---

## Overview

This document consolidates technical ideas from 5 AI perspectives into 9
structured modules (T1-T9) for evaluation alongside feature modules (F1-F12).

Each module aggregates recommendations from all AIs, with consensus notes and
key decision points.

---

## Module Index

| ID  | Title                     | Description                               | Ideas |
| --- | ------------------------- | ----------------------------------------- | ----- |
| T1  | System Architecture       | Offline-first PWA, IndexedDB, sync engine | ~18   |
| T2  | Data Model & Firestore    | Collection structure, security rules      | ~12   |
| T3  | Offline Queue & Conflict  | Mutation queue, conflict resolution       | ~15   |
| T4  | Encryption & Passcode     | AES-GCM, recovery keys, vault             | ~12   |
| T5  | Exports & PDF Generation  | Client-side PDF, metadata hygiene         | ~10   |
| T6  | Analytics Plan            | Privacy-forward telemetry                 | ~8    |
| T7  | Tech Debt & Quality Gates | SonarCloud, testing, feature flags        | ~10   |
| T8  | Native Path               | Capacitor vs Expo recommendations         | ~8    |
| T9  | Open Questions & Future   | Decisions for later, risks                | ~12   |

**Total:** ~105 technical ideas (with significant AI overlap/consensus)

---

## T1: System Architecture (Offline-First PWA)

### AI Consensus Summary

All 5 AIs agree on:

- **IndexedDB as primary store** (Dexie.js recommended)
- **Background sync engine** (custom, not relying on Firebase offline)
- **UI-visible queue status** (pending/syncing/failed states)
- **Service Worker for caching** (app shell + static assets)

### Individual Ideas

| ID    | Idea                              | Source(s)               | ROADMAP Overlap     |
| ----- | --------------------------------- | ----------------------- | ------------------- |
| T1.1  | Use Dexie.js for IndexedDB        | Gemini, ChatGPT, Claude | EFF-010 (partial)   |
| T1.2  | Custom mutation queue             | All 5                   | EFF-010             |
| T1.3  | UI always reads from local store  | Gemini, ChatGPT, Claude | New                 |
| T1.4  | Background sync worker            | All 5                   | EFF-010             |
| T1.5  | Sync-on-open strategy for iOS     | Gemini, ChatGPT         | New                 |
| T1.6  | Persisted Storage API request     | Gemini                  | New                 |
| T1.7  | Read pipeline with staleness      | Claude                  | New                 |
| T1.8  | Write pipeline (local-first)      | All 5                   | EFF-010             |
| T1.9  | Network detection + retry         | ChatGPT, Claude, Kimi   | New                 |
| T1.10 | Exponential backoff retries       | Claude, Kimi            | New                 |
| T1.11 | Queue depth visibility            | ChatGPT, Claude         | New                 |
| T1.12 | Sync & Storage settings panel     | All 5                   | New (high priority) |
| T1.13 | React Query integration           | Gemini                  | New                 |
| T1.14 | iOS PWA constraint mitigations    | All 5                   | EFF-011             |
| T1.15 | Storage quota management          | ChatGPT, Claude         | New                 |
| T1.16 | Export backup flow (protect data) | ChatGPT, Claude, Kimi   | New                 |
| T1.17 | useOfflineFirst hook abstraction  | Claude                  | New                 |
| T1.18 | Why not PouchDB/RxDB analysis     | Claude                  | Reference only      |

---

## T2: Data Model & Firestore Rules

### AI Consensus Summary

All AIs agree on:

- **User-scoped collections** (`/users/{uid}/**`)
- **Separate shared artifacts** (`/sharedPackets/` or `/sharedArtifacts/`)
- **Row-level security** (strict owner access)
- **Minimal PII** storage

### Individual Ideas

| ID    | Idea                               | Source(s)               | ROADMAP Overlap    |
| ----- | ---------------------------------- | ----------------------- | ------------------ |
| T2.1  | User-scoped journal entries        | All 5                   | Existing           |
| T2.2  | Separate sharedPackets collection  | Gemini, ChatGPT, Claude | M7 (partial)       |
| T2.3  | Push model (not pull) for sharing  | Gemini                  | New (key decision) |
| T2.4  | Sponsor relationship metadata only | Gemini, Claude          | M7                 |
| T2.5  | Packet immutability (snapshots)    | Claude                  | New                |
| T2.6  | Auto-expiry for shared packets     | Claude, Kimi            | New                |
| T2.7  | Revocation via status update       | All 5                   | M7                 |
| T2.8  | SyncState document per device      | Claude                  | New                |
| T2.9  | Telemetry daily counters (not raw) | ChatGPT, Claude         | New                |
| T2.10 | Step packets structured schema     | ChatGPT, Claude         | M5                 |
| T2.11 | localVersion field for conflicts   | Claude                  | T3 dependency      |
| T2.12 | Soft delete pattern (deletedAt)    | Claude                  | New                |

---

## T3: Offline Queue & Conflict Resolution

### AI Consensus Summary

All AIs agree on:

- **Mutation queue** with status tracking
- **Conflict detection** via hash comparison
- **User-facing conflict UI** for resolution
- **Last-write-wins** for settings, merge for journal

### Individual Ideas

| ID    | Idea                                  | Source(s)               | ROADMAP Overlap |
| ----- | ------------------------------------- | ----------------------- | --------------- |
| T3.1  | Queue item format (ULID, status, etc) | ChatGPT, Claude, Kimi   | EFF-010         |
| T3.2  | Mutation types enum                   | ChatGPT, Claude         | New             |
| T3.3  | Content hash comparison (SHA-256)     | ChatGPT, Claude         | New             |
| T3.4  | Append-only detection for journal     | Gemini, ChatGPT, Claude | New             |
| T3.5  | Row-level merge for Step 4            | ChatGPT, Claude         | New             |
| T3.6  | Last-write-wins for settings          | Gemini, Claude          | New             |
| T3.7  | Conflict banner in ribbon             | ChatGPT, Claude         | New             |
| T3.8  | Conflict resolution UI (keep/merge)   | All 5                   | New             |
| T3.9  | "Resolve later" option                | ChatGPT                 | New             |
| T3.10 | useOfflineQueue hook                  | Gemini, ChatGPT, Claude | New             |
| T3.11 | Sync worker single pass logic         | ChatGPT, Claude         | New             |
| T3.12 | Retry with backoff                    | Claude, Kimi            | New             |
| T3.13 | Dead letter queue for failed items    | Kimi                    | New             |
| T3.14 | Queue compaction for long offline     | ChatGPT                 | New             |
| T3.15 | Rev integer for simple versioning     | ChatGPT                 | New             |

---

## T4: Encryption & Passcode System

### AI Consensus Summary

All AIs agree on:

- **Web Crypto API** (PBKDF2 + AES-GCM)
- **Passcode gate** for app-level lock
- **Recovery key** (user must save)
- **Phase 1: Sensitive data only**

### Individual Ideas

| ID    | Idea                               | Source(s)               | ROADMAP Overlap     |
| ----- | ---------------------------------- | ----------------------- | ------------------- |
| T4.1  | 6-digit PIN passcode               | Gemini                  | New                 |
| T4.2  | PBKDF2 key derivation              | Gemini, Claude          | New                 |
| T4.3  | AES-256-GCM encryption             | All 5                   | New                 |
| T4.4  | Encrypt Step 4 inventory           | Gemini, ChatGPT, Claude | New (high priority) |
| T4.5  | Encrypt sensitive journal entries  | ChatGPT, Claude         | New                 |
| T4.6  | Recovery key generation            | All 5                   | New (critical)      |
| T4.7  | DEK/KEK key wrapping model         | ChatGPT, Claude         | New                 |
| T4.8  | Optional cloud escrow (encrypted)  | Gemini                  | New (discuss)       |
| T4.9  | Auto-lock after X minutes          | Claude                  | New                 |
| T4.10 | Biometric unlock (native later)    | Claude, Kimi            | M8 (future)         |
| T4.11 | Phase 1 vs Phase 2 encryption plan | ChatGPT, Claude         | New                 |
| T4.12 | Security questions NOT recommended | ChatGPT                 | Reference           |

---

## T5: Exports & PDF Generation

### AI Consensus Summary

All AIs agree on:

- **Client-side PDF generation** (no server)
- **Metadata stripping** (EXIF, GPS, etc.)
- **Preview before export**
- **Native share sheet integration**

### Individual Ideas

| ID    | Idea                                | Source(s)               | ROADMAP Overlap |
| ----- | ----------------------------------- | ----------------------- | --------------- |
| T5.1  | Use @react-pdf/renderer or pdf-lib  | Gemini, ChatGPT, Claude | New             |
| T5.2  | Client-side only (privacy)          | All 5                   | M7              |
| T5.3  | EXIF stripping via canvas re-encode | ChatGPT, Claude         | New             |
| T5.4  | GPS/device info sanitization        | Gemini, Claude          | New             |
| T5.5  | Preview screen before generate      | Gemini, Claude          | New             |
| T5.6  | Sponsor packet builder UI           | Claude                  | M7              |
| T5.7  | Watermark option for sensitive      | Claude                  | New             |
| T5.8  | Web Share API integration           | Gemini, Claude, Kimi    | New             |
| T5.9  | Fallback download + mailto          | Claude                  | New             |
| T5.10 | PDF minimal metadata (no author)    | ChatGPT, Claude         | New             |

---

## T6: Analytics Plan (Privacy-Forward)

### AI Consensus Summary

All AIs agree on:

- **Action-based only** (no content)
- **Daily counters** (not raw streams)
- **Opt-out by default** or clear opt-in
- **Firebase Analytics or PostHog**

### Individual Ideas

| ID   | Idea                             | Source(s)             | ROADMAP Overlap |
| ---- | -------------------------------- | --------------------- | --------------- |
| T6.1 | PostHog recommendation           | Gemini                | New             |
| T6.2 | Firebase Analytics (existing)    | ChatGPT, Claude, Kimi | Existing        |
| T6.3 | Action event taxonomy            | All 5                 | New             |
| T6.4 | Word count buckets (not content) | Gemini, Claude        | New             |
| T6.5 | Sync performance tracking        | Gemini, Claude        | New             |
| T6.6 | Conflict detection events        | Claude                | New             |
| T6.7 | Analytics toggle in settings     | Gemini, Claude        | New             |
| T6.8 | 90-day retention for counters    | ChatGPT               | New             |

---

## T7: Tech Debt & Quality Gates

### AI Consensus Summary

All AIs agree on:

- **Feature flags** for rollout
- **Incremental PR approach**
- **Maintain SonarCloud quality gate**
- **Emulator-based testing**

### Individual Ideas

| ID    | Idea                                  | Source(s)               | ROADMAP Overlap       |
| ----- | ------------------------------------- | ----------------------- | --------------------- |
| T7.1  | Feature flag for offline queue        | Gemini, ChatGPT, Claude | New                   |
| T7.2  | PR0: Types/schemas only               | ChatGPT, Claude         | New                   |
| T7.3  | PR1: Queue + local writes (flagged)   | ChatGPT, Claude         | New                   |
| T7.4  | PR2: UI indicators + settings         | ChatGPT, Claude         | New                   |
| T7.5  | PR3: Sync worker + conflict detection | ChatGPT, Claude         | New                   |
| T7.6  | PR4: Conflict resolution UI           | ChatGPT, Claude         | New                   |
| T7.7  | PR5: Encryption Phase 1               | ChatGPT, Claude         | New                   |
| T7.8  | Unit tests for conflict resolver      | Gemini, ChatGPT, Claude | EFF-011               |
| T7.9  | Firebase emulator integration tests   | ChatGPT, Claude, Kimi   | EFF-011               |
| T7.10 | Strict typing (no any)                | Gemini, ChatGPT         | Existing (SonarCloud) |

---

## T8: Future Native Path

### AI Consensus Summary

Split recommendation:

- **4/5 recommend Capacitor** (Gemini, ChatGPT, Claude, Perplexity)
- **1/5 recommends Expo/React Native** (Kimi)

### Individual Ideas

| ID   | Idea                            | Source(s)               | ROADMAP Overlap |
| ---- | ------------------------------- | ----------------------- | --------------- |
| T8.1 | Capacitor wrapper (no rewrite)  | Gemini, ChatGPT, Claude | New             |
| T8.2 | Expo/React Native (full native) | Kimi                    | New             |
| T8.3 | Keep Next.js + wrap             | Gemini, ChatGPT, Claude | New             |
| T8.4 | Native biometrics via Capacitor | Claude                  | New             |
| T8.5 | Native secure storage/keychain  | Claude, Kimi            | New             |
| T8.6 | Native share sheet              | Claude                  | New             |
| T8.7 | Extract offline-core package    | ChatGPT                 | New             |
| T8.8 | Flutter NOT recommended         | ChatGPT                 | Reference       |

---

## T9: Open Questions & Future Decisions

### AI Consensus Summary

These are acknowledged unknowns to decide later:

### Individual Ideas

| ID    | Idea                                 | Source(s)       | Decision Needed |
| ----- | ------------------------------------ | --------------- | --------------- |
| T9.1  | Push notification strategy           | Gemini, ChatGPT | Later           |
| T9.2  | Data retention / auto-delete policy  | Gemini          | User choice     |
| T9.3  | Cross-device sync race conditions    | Gemini          | LWW default     |
| T9.4  | File attachments (photos in journal) | Gemini          | V2+ if ever     |
| T9.5  | Search: FlexSearch vs Algolia        | Gemini          | FlexSearch      |
| T9.6  | Multi-device expectations            | ChatGPT         | Conflicts OK    |
| T9.7  | Max queue size + compaction          | ChatGPT         | Compact per-doc |
| T9.8  | Step 4 schema (stable row IDs)       | ChatGPT         | M5 decision     |
| T9.9  | Sponsor link UX (code vs QR)         | ChatGPT         | Both            |
| T9.10 | Encrypted artifact sharing           | ChatGPT         | If vault on     |
| T9.11 | Telemetry posture (opt-in default)   | ChatGPT         | Basic opt-in    |
| T9.12 | Backup UX (monthly reminder)         | ChatGPT         | Yes             |

---

## Cross-References to Feature Modules

| Technical Module    | Related Feature Modules  | Notes                |
| ------------------- | ------------------------ | -------------------- |
| T1 (Architecture)   | F4 (Offline/Privacy)     | Core dependency      |
| T2 (Data Model)     | F2 (Sponsor), F5 (Steps) | Schema alignment     |
| T3 (Queue/Conflict) | F4 (Offline/Privacy)     | Core dependency      |
| T4 (Encryption)     | F4 (Offline/Privacy)     | Privacy layer        |
| T5 (Exports)        | F7 (Exports & Reports)   | Direct overlap       |
| T6 (Analytics)      | F4 (Offline/Privacy)     | Privacy implications |
| T7 (Tech Debt)      | All                      | Enabler for all      |
| T8 (Native Path)    | F4, F11 (Visionary)      | Future capability    |
| T9 (Open Questions) | Various                  | Decisions needed     |

---

## Version History

| Version | Date       | Description                            |
| ------- | ---------- | -------------------------------------- |
| 1.0     | 2026-01-20 | Initial parsing from Multi-AI document |
