# **Multi - AI Aggregated Technical App Ideas**

**Last Updated:** 2026-01-20

**Document Type:** Ideation/Reference

---

## **GEMINI**

This is a comprehensive technical architecture proposal designed to evolve the
current SoNash Next.js PWA into a robust, offline-first, privacy-centric
recovery tool.

I have optimized for **resilience** (offline trust), **privacy**
(encryption/sharing controls), and **maintainability** (clean migration path).

---

### A) SYSTEM ARCHITECTURE PROPOSAL (Offline-First PWA)

To achieve true offline-first reliability without rewriting the application
logic for every interaction, we will move from a direct "Component → Firestore"
pattern to a **Repository Pattern with a Sync Engine**.

**Architecture Diagram:**

Code snippet flowchart TD subgraph Client ["Client (PWA/Native)"] UI["React UI
Components"] Hooks["Custom Hooks (useJournal, useInventory)"]

            subgraph DataLayer ["Data Access Layer"]
                Queue["Mutation Queue (IndexedDB)"]
                Cache["Local Read Cache (IndexedDB)"]
                Conflict["Conflict Resolver"]
            end

            Crypto["Encryption Service (WebCrypto API)"]
        end

        subgraph Cloud ["Firebase Backend"]
            FS["Firestore (Cloud Master)"]
            Auth["Firebase Auth"]
            Funcs["Cloud Functions (Sanitization, Aggregation)"]
        end

        UI --> Hooks
        Hooks --> Crypto
        Crypto --> Queue
        Queue --> Conflict
        Conflict <-->|Sync| FS
        FS -->|Realtime Listeners| Cache
        Cache --> Hooks

**Key Decisions:**

1. **Local Store (IndexedDB):** We will use **Dexie.js** (wrapper for IndexedDB)
   as the source of truth for the UI. The UI _always_ reads from Dexie.

2. **Sync Engine:** We will not rely solely on Firebase's native offline cache
   (which is a black box and can be aggressive about evicting writes). We will
   build a lightweight **Mutation Queue**.
   - _Read Pipeline:_ Firestore Snapshot Listeners $\rightarrow$ Update Dexie
     $\rightarrow$ React Query updates UI.
   - _Write Pipeline:_ UI Action $\rightarrow$ Write to Dexie (optimistic) + Add
     to Queue $\rightarrow$ Background Worker processes Queue to Firestore.

3. **iOS PWA Constraints & Mitigation:**
   - _Risk:_ iOS deletes IndexedDB/LocalStorage if the device is low on space
     (approx every 7 days if unused).
   - _Mitigation:_ **Persisted Storage API**. We must request
     `navigator.storage.persist()`.
   - _Mitigation:_ **"Sync on Open"**. The app must assume local data _might_ be
     stale/wiped on iOS and aggressively fetch the latest snapshot on boot.

---

### B) DATA MODEL + FIRESTORE RULES DIRECTION

To satisfy the "Sponsor Anti-Surveillance" requirement, we utilize a **"Push"
Model** (Snapshot Sharing), not a "Pull" Model (Permission Granting).

**Collection Structure:**

Plaintext /users/{userId} /profile // Public-ish (nickname, sobriety date)
/preferences // Settings, theme, sync config /journal // PRIVATE. Encrypted
content optional. /inventory // PRIVATE (Step 4). High encryption candidate.
/security_keys // PRIVATE. Wrapped encryption keys (recovery).

    /shared_packets/{packetId}
        // This is where "Sharing" happens.
        // User writes a COPY of data here.
        // Sponsor has READ access.
        // Owner is {userId}.
        // Fields: { content, type, sharedWith: [sponsorId], generatedAt, autoExpireAt }

    /sponsors/{sponsorId}
        /relationships/{userId}  // Metadata only: Status (Active/Revoked), Nickname.

**Security Posture (Firestore Rules Strategy):**

1. **Strict Owner Access:** `/users/{userId}/**` is
   `read, write: if request.auth.uid == userId`. No exceptions. Admins/Sponsors
   cannot read this via rules.

2. **Packet Sharing:** `/shared_packets/{packetId}` allows read if
   `request.auth.uid in resource.data.sharedWith`.

3. **Revocation:** To revoke access, the user deletes the document in
   `/shared_packets` or updates `sharedWith` to remove the sponsor. Access is
   instantly cut.

---

### C) OFFLINE QUEUE + CONFLICT RESOLUTION SPEC

We need a bespoke queue to handle the "Visible Status" requirement.

**Queue Item Format (Interface):**

TypeScript type MutationType = 'CREATE' | 'UPDATE' | 'DELETE';

    interface QueueItem {
      id: string;             // UUID
      timestamp: number;
      collection: string;
      docId: string;
      type: MutationType;
      payload: any;           // The data being written
      status: 'PENDING' | 'SYNCING' | 'FAILED' | 'RETRYING';
      retryCount: number;
      error?: string;
    }

**Conflict Resolution Strategy:**

- **Journal Entries:** `Append-Only` logic. If Server has text "A" and Client
  has text "B", and timestamps differ significantly, we merge to "A \n\n [Sync
  Conflict - Local Version]: B".

- **Settings/Profile:** `Last-Write-Wins` (LWW) based on server timestamp.

**Code Skeleton (Sync Worker):**

TypeScript // hooks/useOfflineQueue.ts export const useOfflineQueue = () => {
const processQueue = async () => { const pendingItems = await
db.queue.where('status').equals('PENDING').toArray();

        for (const item of pendingItems) {
          try {
            await db.queue.update(item.id, { status: 'SYNCING' });

            // Check for conflict before write
            const serverDoc = await firestoreService.get(item.collection, item.docId);
            if (serverDoc && hasConflict(serverDoc, item.payload)) {
                 // Trigger Conflict UI or Auto-Merge
                 const merged = autoMergeStrategies.journal(serverDoc, item.payload);
                 await firestoreService.set(item.collection, item.docId, merged);
            } else {
                 await firestoreService.set(item.collection, item.docId, item.payload);
            }

            await db.queue.delete(item.id); // Success
          } catch (err) {
            if (isNetworkError(err)) {
               await db.queue.update(item.id, { status: 'PENDING' }); // Back to pool
            } else {
               await db.queue.update(item.id, { status: 'FAILED', error: err.message });
            }
          }
        }
      };

      // Trigger on online event or interval
      useEventListener('online', processQueue);
    };

---

### D) ENCRYPTION & PASSCODE SYSTEM

Phase 1: Application-Level Encryption (ALE)

We will use WebCrypto API (native to browser/native).

1. **Passcode:** User sets a 6-digit PIN.

2. **Key Generation:** PBKDF2 derives a `MasterKey` from the PIN + Salt.

3. **Encryption:** Sensitive fields (e.g., Step 4 content) are encrypted with
   `MasterKey` (AES-GCM) _before_ saving to IndexedDB or Firestore.

4. **At Rest:** Firestore only sees ciphertext. If the DB is leaked, the data is
   garbage without the PIN.

**Recovery Model (The "Hybrid" Approach):**

- _Risk:_ User forgets PIN. Data is lost forever.

- _Solution:_ **Escrowed Recovery Key.**
  1. When setting up the PIN, we generate a random `RecoveryKey`.
  2. We encrypt the `MasterKey` with the `RecoveryKey`.
  3. We display the `RecoveryKey` to the user ("Write this down/Save to
     1Password").
  4. **Optional Cloud Escrow:** We allow the user to save an _encrypted bundle_
     of the `RecoveryKey` to Firestore, protected by _Security Questions_ (low
     security) or a separate _High-Entropy Password_ (high security).

**Threat Model:**

- _Sponsor Misuse:_ Impossible. Sponsor only sees what is explicitly decrypted
  and copied to `shared_packets`.

- _Database Leak:_ Protected by AES-256.

- _Passcode Forgotten:_ Recovery Key restores access.

---

### E) EXPORTS / PDF GENERATION / METADATA HYGIENE

Implementation:

Use @react-pdf/renderer. It renders PDFs entirely client-side (in the browser),
ensuring no sensitive data is sent to a server for generation.

Metadata Stripping:

Before passing data to the PDF generator, run a sanitizer function:

TypeScript function sanitizeForExport(data: any) { // Recursively remove
specific keys delete data.gpsCoordinates; delete data.ipAddress; delete
data.deviceInfo; return data; }

**Sponsor Packet UX:**

1. **Select:** User selects date range or specific items (e.g., "Step 4 -
   Resentments").

2. **Preview:** Renders HTML preview of the exact PDF content.

3. **Generate:** Creates PDF Blob.

4. **Share:**
   - _Mobile:_ `navigator.share({ files: [pdfBlob] })` opens native Share Sheet
     (Signal, iMessage, AirDrop).
   - _Desktop:_ Download to disk.

---

### F) ANALYTICS PLAN (Privacy-Forward)

We will use **PostHog** (Open Source/Cloud). It allows strict masking of inputs
and action-based tracking without capturing Personally Identifiable Information
(PII).

**Event Taxonomy (Examples):**

| **Event Name**      | **Properties (Safe)**                      | **Purpose**                        |
| ------------------- | ------------------------------------------ | ---------------------------------- |
| `app_session_start` | `is_offline: boolean`, `pwa_mode: boolean` | Usage frequency & offline reliance |
| `journal_write`     | `word_count_bucket: "0-50", "50+"`         | Engagement depth (not content)     |
| `sync_complete`     | `duration_ms`, `queue_size`                | Performance monitoring             |
| `conflict_detected` | `resolution_type: "auto"                   | "manual"`                          |
| `feature_accessed`  | `feature: "step4_wizard"`                  | Feature adoption                   |
| `sponsor_share`     | `type: "pdf"                               | "link"`                            |

User Choice:

"Analytics & Privacy" setting in the menu. Toggle for "Share Usage Statistics."
Defaults to Anonymous, but respects Off.

---

### G) TECH DEBT / QUALITY GATES

To integrate this without breaking the current sprint or quality gates:

1. **Feature Flags:** Wrap the new Write Queue in a flag:
   `NEXT_PUBLIC_ENABLE_OFFLINE_QUEUE=false`. Develop behind the flag.

2. **Testing Plan:**
   - _Unit:_ Test the Conflict Resolver logic with 100% coverage (it's pure
     logic).
   - _Integration:_ Use Firebase Emulators. Script a test that:
     1. Writes to DB.
     2. Simulates network disconnect.
     3. Writes more.
     4. Reconnects.
     5. Verifies Firestore state.

3. **SonarCloud Guardrails:** Do not merge the "Offline Queue" PR unless it
   passes the existing quality gate. Keep strict typing to satisfy the linter.

---

### H) FUTURE NATIVE PATH RECOMMENDATION

**Recommendation:** **Capacitor (Ionic ecosystem)**.

**Why?**

1. **No Rewrite:** Wraps your existing Next.js build. You keep 95% of your code.

2. **Native Plugins:** Capacitor provides access to Native Biometrics (FaceID),
   Filesystem (for secure storage), and Share Sheets via simple JS bridges.

3. **Offline:** The architecture proposed in (A) works identical in Capacitor.

**Tradeoffs:**

- It's not "Native UI" (it's still a WebView). However, for a "Notebook" app,
  CSS/DOM is actually superior for rendering text and complex layouts than
  native views.

- _Expo/React Native_ would require rewriting all your `<div>`s to `<View>`s and
  replacing your CSS with StyleSheet objects. Too expensive for this stage.

---

### I) "WHAT I’M MISSING" (Decisions for Later)

1. **Push Notification Strategy:** If we go offline-first, local notifications
   are easy. Remote notifications (e.g., "Sponsor viewed your packet") require
   FCM tokens. _Default: Stick to Local Notifications for now._

2. **Data Retention/Auto-Delete:** Do users want their 4th step to auto-destruct
   after 1 year? _Default: Keep forever until user deletes._

3. **Cross-Device Sync Race Conditions:** If a user is offline on iPad and
   iPhone simultaneously editing the same doc. _Default: Last-Write-Wins on the
   server timestamp._

4. **File Attachments:** If users want to attach photos to journals, offline
   syncing becomes much harder (Blob storage). _Default: Text only for V1._

5. **Search:** Client-side search (FlexSearch) vs. Server-side (Algolia).
   _Default: Client-side FlexSearch against the local Dexie DB._

---

### 9) OFFLINE-EVERYTHING QUESTION (Answered)

**Advantages:**

- **Speed:** Zero latency.

- **Trust:** User knows their data is there even in a basement meeting.

- **Search:** Searching local IndexedDB is instantaneous and free (no Algolia
  cost).

**Disadvantages/Risks:**

- **Initial Load:** Syncing _everything_ (years of journals) on first login
  takes time and bandwidth. _Mitigation: Pagination or "Last 90 Days" sync
  policy._

- **Storage Limits:** Browser storage is "Best Effort." If the user records 4K
  video, the OS might wipe your DB. _Mitigation: Text is tiny. Years of journals
  is <10MB. We are safe if we stick to text._

- **Complexity:** You are essentially building a database replication engine.

**Verdict:** For a text-heavy Recovery Notebook, **Offline-Everything is the
correct choice.** The data size is small enough that the storage risks are
minimal, and the UX benefit for "basement meetings" is massive.

## CHATGPT

### Assumptions (so we can move fast without scope blow-ups)

- You’ll keep the **Firebase/Next.js stack** as-is (Next.js 16.1 + Firebase
  12.7 + Functions v2 + App Check) DEVELOPMENT and you want an **additive
  offline layer** (not a rewrite).

- The **Operational Visibility sprint is currently blocked by SonarCloud
  cleanup** and we should design + implement the offline engine in small PRs
  that won’t worsen the gate ROADMAP .

- “Offline-first” is primarily about **journal/step-work writes** (high-volume
  text), plus some structured data for Step 4 / nightly review.

---

## A) SYSTEM ARCHITECTURE PROPOSAL (PWA now, Native later)

**(1) Recommended choice**  
Build a **local-first data layer** with:

- **IndexedDB “primary” store** (Dexie or `idb`) for documents + queue

- **Sync engine** that uploads to Firestore when online

- **UI-visible queue state** + a “Sync & Storage” settings surface

You can still use Firestore for:

- auth

- server persistence

- sponsor artifacts

- telemetry (non-sensitive)

- optional real-time reads (but never as the write source-of-truth)

**Why**

- Meets “writes land locally first” hard requirement.

- Avoids Firestore’s “offline magic” being opaque to users (you need explicit
  pending/sync/failed).

- Makes encryption and “never upload” data possible because your primary store
  is yours.

**Tradeoffs**

- More code than “turn on Firestore persistence.”

- You own conflict resolution.

- You must design for iOS PWA limitations (foreground-only sync; storage
  eviction rules).

**Implementation notes**

- **Write pipeline**
  1. user edits → **local doc upsert** (IndexedDB)
  2. enqueue “mutation” → mark doc `syncState=pending`
  3. UI shows status immediately (no network dependency)
  4. sync worker runs when online and app is active

- **Read pipeline**
  - Always render from IndexedDB (fast, consistent).
  - Optionally hydrate from Firestore on startup / refresh.
  - “Remote updates” become queued _merge candidates_ into local, not instant
    overwrites.

- **Background sync realities**
  - Safari/iOS does **not support Background Sync API** , so “true background”
    is not reliable on iPhone PWA.
  - Strategy: sync on **(a)** app open, **(b)** network regained, **(c)**
    periodic in-foreground timer, **(d)** user manual “Sync now”.

- **iOS PWA constraints + mitigations**
  - Storage policy: WebKit has a 7-day cap for script-writable storage in some
    contexts, but **Home Screen web apps are exempt** (and isolated) . Still:
    plan for **eviction under storage pressure** and quota management .
  - Push: iOS supports Web Push for **Home Screen web apps** (16.4+) — but don’t
    rely on push for syncing; use it for user-visible notifications only.

**ASCII diagram (core data flow)**
`UI (Notebook / Step Work / Night Review)                     |                     | local-first write                      v          IndexedDB "Primary Store" (docs)                     |                     | enqueue mutation                     v            IndexedDB "Offline Queue"                     |         +-----------+------------+          |                        |   online + active           offline / error         |                        |         v                        v Firestore (replica)        UI shows: pending/failed         |         v Sponsor artifacts / telemetry (no content)`

Also: your current roadmap already flags **offline queue as CRITICAL** and that
writes currently require network (risking data loss)

ROADMAP

— this architecture directly fixes that.

---

## B) DATA MODEL + FIRESTORE RULES DIRECTION (HIGH LEVEL, NOT FULL RULES)

**(1) Recommended choice**  
Use a **user-scoped Firestore model** with _separate collections_ for:

- private user data (never sponsor-readable)

- sponsor-shared artifacts (explicit snapshots only)

- telemetry (action-only)

- relationship edges (no data access implied)

This matches your existing rules posture: “all data user-scoped
(`request.auth.uid == uid`)”

DEVELOPMENT

and App Check enforced in prod

DEVELOPMENT

.

**(2) Proposed collections**

- `users/{uid}`
  - profile-lite (no real name required)
  - settings: privacy level, analytics opt-in, encryption enabled, storage mode

- `users/{uid}/journalEntries/{entryId}`
  - server replica of journal entry “atomic doc”
  - fields: `content`, `createdAt`, `updatedAt`, `deviceId`, `rev`,
    `contentHash`

- `users/{uid}/stepPackets/{packetId}`
  - structured worksheets (Step 4 inventories etc.)
  - fields: `schemaVersion`, `sections[]`, `rev`, `contentHash`, `updatedAt`

- `users/{uid}/syncLogs/{logId}` (non-sensitive)
  - queue depth, last sync time, error codes (no content)

- `sponsorLinks/{linkId}`
  - `sponseeUid`, `sponsorUid`, `status`, `createdAt`, `revokedAt`
  - **No access to any data** by default

- `sharedArtifacts/{artifactId}`
  - immutable “snapshot payload” (or references to it)
  - `ownerUid` (sponsee), `sponsorUid`, `type`, `createdAt`, `expiresAt?`
  - `payload` is either:
    - plaintext (if not sensitive) or
    - encrypted blob (if sensitive & user enabled encryption)

- `users/{uid}/exports/{exportId}` (metadata only)
  - type, size, createdAt, shareTarget type (email/share sheet), **no content**

- `telemetryDaily/{uid_yyyyMMdd}` (or `telemetryDaily/{yyyyMMdd}/users/{uid}`)
  - counters only: `journal_entry_created: 3`, `sync_failed: 1`, etc.

**(3) Security posture direction**

- **Row-level security everywhere**
  - `users/{uid}/**`: only `request.auth.uid == uid` DEVELOPMENT

- **Sponsor access only to `sharedArtifacts`**
  - rule: `request.auth.uid == sponsorUid` AND `status == active`

- **Revocation strategy**
  - “revoke” flips `sharedArtifacts.status=revoked` (deny reads)
  - optional: scheduled function deletes revoked/expired artifacts after
    retention window

- **Minimal PII**
  - don’t store names/emails unless user links account later
  - sponsor link can be established via short code / QR, but keep it
    pseudonymous

---

## C) OFFLINE QUEUE + CONFLICT RESOLUTION SPEC

**(1) Recommended choice**  
Use a **mutation queue** (event log) + **atomic docs** in local store:

- Local store holds the **current doc state** (“atomic doc”)

- Queue holds **mutations** to send upstream (append/edit/upsert/delete)

- Server stores atomic doc too (simple Firestore reads)

This avoids full event-sourcing complexity while still giving you reliable sync.

**Why**

- “Atomic doc only” is simplest, but conflict handling is harder because you
  lose intent.

- “Event-sourcing only” is robust but heavy.

- Hybrid gives you intent when you need it (queue), but keeps your data model
  simple.

**Tradeoffs**

- You must ensure idempotency (mutation IDs, retries).

- For long-lived offline periods, queue can grow; you’ll need compaction.

---

### Queue item format (concrete)

`type QueueStatus = "pending" | "syncing" | "failed" | "applied" | "dead";  type DocType = "journalEntry" | "stepPacket" | "nightReview";  type MutationKind =  | "UPSERT_DOC"          // replace full doc (small docs)   | "PATCH_FIELDS"        // structured updates   | "APPEND_TEXT"         // journal append optimization   | "DELETE_DOC";  type OfflineMutation = {  id: string;                 // ULID   uid: string;                // owner   deviceId: string;           // stable per install   docType: DocType;  docId: string;              // ULID   kind: MutationKind;  baseRev?: number;           // rev at time of edit   baseHash?: string;          // content hash at time of edit   payload: unknown;           // validated with Zod   createdAtMs: number;  attemptCount: number;  lastAttemptAtMs?: number;  status: QueueStatus;  lastError?: { code: string; message: string; atMs: number };};`

---

### Conflict resolution detection: “same / same+additional / meaningfully different”

**Rules**

1. If `localHash == remoteHash` → no conflict.

2. If “append-only”:
   - if `remoteText.startsWith(localText)` → remote has extra; take remote
   - if `localText.startsWith(remoteText)` → local has extra; keep local
   - else → conflict prompt

3. For structured docs (Step 4 sections/rows):
   - merge by stable row IDs; if same row edited on both sides → conflict prompt
     for that row (not whole packet)

**Implementation notes**

- Use a stable hash (SHA-256) of normalized content to compare quickly.

- Store `rev` integers and increment on each server write. (Simpler than vector
  clocks; good enough for a single-user-per-doc scenario with occasional
  multi-device.)

---

### Merge UX (non-blocking, user-controlled)

- Banner chip in notebook ribbon: **“Sync needs attention (2)”**

- Conflict screen per doc:
  - show Local vs Remote (diff-highlight for text)
  - actions:
    - Keep local
    - Keep remote
    - Keep both (duplicates remote into a new docId)
    - Merge (enabled when append-safe or structured row merge is possible)

- Always allow “resolve later” but keep status visible.

---

### Code skeletons (TypeScript-ish)

**1) `useOfflineQueue()` hook**

`export function useOfflineQueue(uid: string) {  const [queueDepth, setQueueDepth] = useState(0);  const [syncState, setSyncState] = useState<"idle"|"syncing"|"blocked"|"error">("idle");  const [lastError, setLastError] = useState<string | null>(null);  useEffect(() => {    // subscribe to IndexedDB queue changes     return offlineDb.queue.subscribeDepth(uid, setQueueDepth);  }, [uid]);  async function enqueue(m: Omit<OfflineMutation, "id"|"attemptCount"|"status"|"createdAtMs">) {    const mutation: OfflineMutation = {      ...m,      id: ulid(),      createdAtMs: Date.now(),      attemptCount: 0,      status: "pending",    };    await offlineDb.queue.add(mutation);    // IMPORTANT: write doc state locally FIRST (caller should do this before enqueue)     return mutation.id;  }  async function syncNow() {    setSyncState("syncing");    setLastError(null);    try {      const result = await runSyncWorkerOnce(uid);      setSyncState(result.blocked ? "blocked" : "idle");      if (result.error) setLastError(result.error);    } catch (e) {      setSyncState("error");      setLastError(e instanceof Error ? e.message : "unknown");    }  }  return { queueDepth, syncState, lastError, enqueue, syncNow };}`

**2) Conflict resolver (core logic)**

`type ConflictDecision =  | { kind: "NO_CONFLICT" }  | { kind: "AUTO_MERGE"; mergedDoc: any }  | { kind: "NEEDS_USER"; local: any; remote: any; reason: string };  export async function detectConflict(params: {  docType: DocType;  localDoc: any;  remoteDoc: any;}): Promise<ConflictDecision> {  const { docType, localDoc, remoteDoc } = params;  if (localDoc.contentHash === remoteDoc.contentHash) return { kind: "NO_CONFLICT" };  if (docType === "journalEntry") {    const l = String(localDoc.content ?? "");    const r = String(remoteDoc.content ?? "");    if (r.startsWith(l)) return { kind: "AUTO_MERGE", mergedDoc: remoteDoc }; // remote appended     if (l.startsWith(r)) return { kind: "AUTO_MERGE", mergedDoc: localDoc };  // local appended     return { kind: "NEEDS_USER", local: localDoc, remote: remoteDoc, reason: "meaningful_text_divergence" };  }  // Step packets: merge by row IDs where possible   if (docType === "stepPacket") {    const merged = tryMergeStepPacket(localDoc, remoteDoc);    if (merged.ok) return { kind: "AUTO_MERGE", mergedDoc: merged.value };    return { kind: "NEEDS_USER", local: localDoc, remote: remoteDoc, reason: "row_level_conflicts" };  }  return { kind: "NEEDS_USER", local: localDoc, remote: remoteDoc, reason: "unknown_doc_type" };}`

**3) Sync worker (single pass)**

`export async function runSyncWorkerOnce(uid: string): Promise<{ blocked: boolean; error?: string }> {  if (!navigator.onLine) return { blocked: true };  const batch = await offlineDb.queue.nextBatch(uid, { limit: 25 });  if (batch.length === 0) return { blocked: false };  for (const m of batch) {    try {      await offlineDb.queue.markSyncing(m.id);      // Fetch remote doc (if needed for conflict)       const remote = await fetchRemoteDocIfExists(uid, m.docType, m.docId);      // Compute local doc state to upload       const local = await offlineDb.docs.get(uid, m.docType, m.docId);      if (remote) {        const decision = await detectConflict({ docType: m.docType, localDoc: local, remoteDoc: remote });        if (decision.kind === "NEEDS_USER") {          await offlineDb.conflicts.record(uid, m, decision);          await offlineDb.queue.markFailed(m.id, { code: "CONFLICT", message: decision.reason });          continue;        }        if (decision.kind === "AUTO_MERGE") {          await offlineDb.docs.put(uid, m.docType, m.docId, decision.mergedDoc);        }      }      // Upload (idempotent)       await upsertFirestoreAtomicDoc(uid, m.docType, m.docId, await offlineDb.docs.get(uid, m.docType, m.docId));      await offlineDb.queue.markApplied(m.id);      await offlineDb.docs.markSynced(uid, m.docType, m.docId);    } catch (e) {      await offlineDb.queue.bumpFailure(m.id, normalizeError(e));      // retry strategy: exponential backoff, but never silent—surface "failed"       return { blocked: false, error: e instanceof Error ? e.message : "sync_error" };    }  }  return { blocked: false };}`

---

## D) ENCRYPTION & PASSCODE SYSTEM (WITH RECOVERY)

**(1) Recommended choice (phased)**

### Phase 1 (ship soon, safe default)

- **Passcode gate** (app-level lock)

- **Encrypted vault** only for selected categories:
  - Step 4 inventory
  - amends planning
  - “high sensitivity” journal entries (user-toggled)

- Crypto: Web Crypto API (PBKDF2 + AES-GCM)

### Phase 2 (expand if desired)

- Allow “encrypt all journal entries”

- Add biometric unlock in native wrapper (later)

- Optional: per-field encryption (more granular)

**Why**

- Phase 1 gives privacy wins without blocking the core offline queue milestone.

- Web Crypto is available in secure contexts and works in workers .

**Tradeoffs**

- PWA can’t rely on OS keychain the way native can.

- User experience risk: “I forgot my passcode” must be solved _now_.

---

### Default recovery model (no catastrophic lockout)

**Goal:** forgetting passcode must not equal total loss.

**Recommended default**

- Generate a random **Data Encryption Key (DEK)** for the vault.

- Wrap the DEK with:
  1. **Passcode-derived Key (KEK)** for daily use
  2. **Recovery Key (RK)** shown once to the user (print/save it)

- Store:
  - `wrappedDEK_passcode` locally
  - `wrappedDEK_recovery` locally **and optionally** in Firestore (safe because
    it’s encrypted _by RK_, which you never upload)

If passcode forgotten:

- user enters Recovery Key → unwrap DEK → set new passcode → rewrap

**Options + tradeoffs**

- Recovery key (recommended): strongest + simplest; user must store it.

- “Security questions”: weak (guessable), not recommended.

- Device-bound key (WebAuthn wrap): good UX, but more moving parts; make
  optional later.

- Cloud escrow of plaintext keys: **don’t**.

---

### Threat model (simple but real)

- **Device stolen**
  - passcode gate + encrypted vault prevents casual access
  - still assume device-level compromise is possible; don’t promise
    “nation-state safe”

- **Shared phone**
  - passcode gate prevents shoulder-surfing / family access
  - “auto-lock after X minutes”

- **Sponsor misuse**
  - sponsor never gets live data; only explicit artifacts
  - artifacts can be encrypted if user marks “sensitive”

- **Accidental export leaks**
  - export preview + redaction
  - watermark option + “contains sensitive info” warning

---

## E) EXPORTS / PDF GENERATION / METADATA HYGIENE

**(1) Recommended choice**

- **PWA now:** generate PDFs **locally** in-browser via `pdf-lib` (or similar),
  from your structured content model.

- **Native later:** use platform PDF renderers (Capacitor plugins / native
  APIs), but keep the same “packet schema”.

**Why**

- Avoid sending journal content to a server for PDF generation (privacy).

- Avoid metadata leaks from server logs.

**Tradeoffs**

- Local PDF generation can be slower on low-end phones.

- “Photoreal notebook” exact fidelity may be harder than HTML print; but you can
  style the PDF output as a _clean print packet_ (more sponsor-friendly anyway).

**Implementation notes**

- **Metadata hygiene**
  - For images: strip EXIF by re-encoding via `<canvas>` before
    storing/exporting (drops GPS/EXIF).
  - For PDFs: don’t set author/title/producer fields; keep minimal document info
    where possible.

- **Sponsor packet format guidance**
  - Packet builder UI:
    - checklist: include Step 4 rows? include summary only? include dates?
    - preview screen
    - “Sensitive” toggle: watermark + optional encryption

  - Export result types:
    - PDF
    - plaintext summary (copy/share)

- **Sharing**
  - PWA: Web Share API when available
  - fallback: download + “copy to clipboard” + mailto template
  - Native: share sheet (later)

---

## F) ANALYTICS PLAN (PRIVACY-FORWARD)

**(1) Recommended choice**  
Implement **first-party “action telemetry”**:

- a tiny client logger that records **events without content**

- store as **daily counters** (not raw streams) unless debugging is enabled

- upload to Firestore under strict schema + retention

This aligns with your existing tooling list (Firebase Analytics exists)

DEVELOPMENT

, but gives you more privacy control than “full GA-style analytics”.

**Why**

- Tracks what matters (sync failures, queue depth, exports) without journaling
  content.

- Easy to explain in “Sync & Storage” menu.

**Tradeoffs**

- Less out-of-the-box dashboards than GA/Firebase Analytics.

- You’ll build a small admin view for aggregated metrics later.

**(2) Event taxonomy examples (action-based)**

| Event                   | Properties (safe)         | Notes                                         |
| ----------------------- | ------------------------- | --------------------------------------------- |
| `journal_entry_created` | `{ chars, deviceType }`   | `chars` is number only                        |
| `step4_row_added`       | `{ section, count }`      | no row text                                   |
| `sync_started`          | `{ queueDepth }`          |                                               |
| `sync_failed`           | `{ code, queueDepth }`    | code like `NETWORK`, `CONFLICT`, `PERMISSION` |
| `conflict_detected`     | `{ docType }`             |                                               |
| `conflict_resolved`     | `{ resolution }`          | `keep_local/keep_remote/keep_both/merge`      |
| `export_pdf`            | `{ type, pages, sizeKb }` |                                               |
| `sponsor_link_created`  | `{ method }`              | invite code / qr                              |
| `sponsor_link_revoked`  | `{ reason? }`             | reason optional, controlled list              |
| `vault_enabled`         | `{ categoriesCount }`     | no details                                    |
| `vault_unlock_failed`   | `{ count }`               |                                               |

**(3) Opt-in/opt-out UX + retention**

- Place in **Sync & Storage**:
  - Analytics: Off / Basic (daily counters) / Debug (short-lived raw event
    stream)

- Retention suggestions:
  - Basic counters: 90 days
  - Debug raw stream: 7 days, and only if user opts in

- Never log content; never log sponsor packet bodies.

---

## G) TECH DEBT / QUALITY GATES

You’re explicitly blocked by SonarCloud cleanup before feature work resumes

ROADMAP

, so the plan below is designed to **not worsen** the quality gate.

**(1) Recommended incremental adoption plan**

1. **PR0 (no behavior change):** add offline DB module + types + Zod schemas +
   tests

2. **PR1:** implement queue + local writes behind feature flag
   (`OFFLINE_QUEUE_V1`)

3. **PR2:** UI indicators + Sync & Storage menu (read-only stats first)

4. **PR3:** sync worker + conflict detection (conflict UI stubbed)

5. **PR4:** conflict resolution UI + merge actions

6. **PR5:** encryption Phase 1 (vault only)

This maps cleanly to your roadmap’s Offline Support items (EFF-010/011)

ROADMAP

without forcing a “big bang” change.

**(2) Testing plan**

- Unit tests:
  - queue state transitions
  - conflict detection cases (identical / append-only / divergent)
  - retry backoff

- Emulator tests (Firebase emulator recommended in your dev guide) DEVELOPMENT :
  - sync worker against emulated Firestore
  - rules checks (user-scope; sponsor artifact access)

- “Offline test suite”
  - your roadmap already calls for offline tests (EFF-011) ROADMAP

- Guardrails for SonarCloud:
  - keep functions small/pure
  - strict typing (no `any`)
  - isolate crypto code + add misuse-resistant wrappers
  - add lint/test to PR gates (already expected in your tooling) DEVELOPMENT

**(3) Rollout plan**

- feature flag default OFF

- ship to yourself first

- add “Export local backup” early (protects you during beta)

- then gradually enable for a small cohort

---

## H) FUTURE NATIVE PATH RECOMMENDATION

**(1) Recommended option: (1) Continue web + add native wrapper (Capacitor)**

**Why**

- Lowest rewrite risk: you keep Next.js + TS + your offline DB + sync engine.

- Gains native capabilities exactly where you need them later:
  - secure storage/keychain for vault keys
  - biometric unlock
  - reliable share sheet
  - better file system access (encrypted backups)

- Lets you stay PWA-first while solving iOS constraints over time.

**Tradeoffs**

- Still not “pure native UX” everywhere.

- You’ll manage some platform plugin surface area.

**Implementation notes**

- Extract your offline layer into a shared package: `packages/offline-core`
  - queue, hashing, conflict detection, encryption primitives

- For native:
  - store DEK in Keychain/Keystore
  - background tasks become more feasible than PWA (platform-dependent)

**Comparisons**

- Expo/React Native:
  - Pros: full native UI, better background controls
  - Cons: higher rewrite; you’ll reimplement the notebook UI and likely the
    routing/layout model

- “Another approach” (e.g., Flutter):
  - Pros: strong native packaging
  - Cons: biggest rewrite; not aligned with current Next.js repo momentum

---

## I) “WHAT I’M MISSING”

Here are the key decisions/risks to park (defaults included) — none block
progress:

1. **Doc ID strategy** (default: ULID everywhere; stable across devices)

2. **Retention policy for local-only data** (default: user choice; “keep
   forever” vs “auto-archive after N days”)

3. **Max queue size + compaction** (default: compact per-doc: keep only latest
   UPSERT + last APPEND chain)

4. **Multi-device expectations** (default: supported, but conflicts expected;
   prioritize correctness over seamless merging)

5. **Step 4 schema** (default: structured rows with stable row IDs; text fields
   per row; attachments optional)

6. **Sponsor link UX** (default: invite code + confirm screen; sponsor sees
   nothing until first artifact shared)

7. **Encrypted artifact sharing** (default: if vault enabled + artifact marked
   sensitive → encrypt payload before upload)

8. **Telemetry posture** (default: opt-out by default; Basic counters only when
   user opts in)

9. **Backup UX** (default: “Export encrypted backup bundle” monthly reminder
   inside app; no cloud auto-backup unless user enables)

10. **Service worker caching policy** (default: cache app shell + static assets;
    never cache sensitive exports; keep caches small)

---

### Your “offline-everything” question (advantages / disadvantages)

**Advantages**

- Trust: app works anywhere; no “lost my Step 4 because subway.”

- Performance: instant reads/writes from IndexedDB.

- Privacy: user can choose “never upload” categories.

**Disadvantages / realities (especially iOS PWA)**

- **Storage limits & eviction:** quota and eviction rules exist; WebKit’s
  storage policy and eviction behavior can delete origin data under pressure or
  policy triggers . Home Screen web apps are exempt from some ITP deletion
  rules, but you still must plan for eviction/pressure .

- **Service worker complexity:** caching + versioning + migrations are real
  engineering work.

- **IndexedDB backup realities:** the OS can still wipe app storage; you need
  explicit **export/backup** flows.

- **Conflict burden:** “offline everywhere” implies more multi-device
  divergence; you need polished conflict UX.

- **Security implications:** more sensitive data at rest on device; encryption +
  passcode + recovery become mandatory.

- **Background sync gaps on iOS:** Safari/iOS lacks Background Sync API , so
  “offline-everything” must still assume sync happens mostly when the app is
  foregrounded.

---

If you want the next thin-slice that ships safely (and aligns with your current
roadmap), it’s:

1. implement **IndexedDB primary store + queue + UI status** (EFF-010) ROADMAP

2. add **offline test coverage** (EFF-011) ROADMAP

3. only then add Step 4 builder + sponsor export loops.

## CLAUDE

# SoNash Technical Co-Design Specification

**Version:** 1.0  
**Date:** 2026-01-20  
**Author:** Claude (Senior Staff Engineer / Security-Privacy Architect /
UX-minded Product Engineer)  
**Status:** DRAFT – For Review  
**Audience:** Technical decision-maker, solo developer context

---

## Executive Summary

This document provides a comprehensive technical specification for evolving
SoNash from its current PWA state to a production-grade, offline-first recovery
notebook with sponsor tooling, encryption, and a clear native app path.

**Key Recommendations (TL;DR):**

| Area           | Recommendation                                                  | Confidence      |
| -------------- | --------------------------------------------------------------- | --------------- |
| Offline-First  | IndexedDB + background sync with Firestore                      | **High**        |
| Sync Engine    | Event-sourcing hybrid with last-write-wins + conflict UI        | **High**        |
| Encryption     | Per-document AES-256-GCM with device-bound key + recovery key   | **Medium-High** |
| Sponsor Model  | Explicit share-packet architecture, no live access              | **High**        |
| PDF Generation | Client-side jsPDF + html2canvas (PWA), native print (Capacitor) | **High**        |
| Analytics      | Firebase Analytics, action-only events, no content              | **High**        |
| Native Path    | Capacitor wrapper over existing Next.js PWA                     | **High**        |

**Scope Guardrails:** This spec is designed to be implemented incrementally.
Nothing here requires abandoning the SonarCloud cleanup or Operational
Visibility sprint. I've tagged each section with estimated effort and suggested
phase.

---

## Table of Contents

- [A. System Architecture Proposal](https://claude.ai/chat/78589497-0a26-4f5f-93b7-0b8356619792#a-system-architecture-proposal)
- [B. Data Model + Firestore Rules Direction](https://claude.ai/chat/78589497-0a26-4f5f-93b7-0b8356619792#b-data-model--firestore-rules-direction)
- [C. Offline Queue + Conflict Resolution Spec](https://claude.ai/chat/78589497-0a26-4f5f-93b7-0b8356619792#c-offline-queue--conflict-resolution-spec)
- [D. Encryption & Passcode System](https://claude.ai/chat/78589497-0a26-4f5f-93b7-0b8356619792#d-encryption--passcode-system)
- [E. Exports / PDF Generation / Metadata Hygiene](https://claude.ai/chat/78589497-0a26-4f5f-93b7-0b8356619792#e-exports--pdf-generation--metadata-hygiene)
- [F. Analytics Plan](https://claude.ai/chat/78589497-0a26-4f5f-93b7-0b8356619792#f-analytics-plan)
- [G. Tech Debt / Quality Gates](https://claude.ai/chat/78589497-0a26-4f5f-93b7-0b8356619792#g-tech-debt--quality-gates)
- [H. Future Native Path Recommendation](https://claude.ai/chat/78589497-0a26-4f5f-93b7-0b8356619792#h-future-native-path-recommendation)
- [I. What You're Missing](https://claude.ai/chat/78589497-0a26-4f5f-93b7-0b8356619792#i-what-youre-missing)

---

## A. System Architecture Proposal

**Phase:** Foundation (can start after SonarCloud cleanup)  
**Effort:** 3-4 weeks for core offline layer  
**Confidence:** High

### A.1 Recommended Architecture Overview

    ┌────────────────────────────────────────────────────────────────────────┐
    │                         SoNash PWA (Next.js)                          │
    ├────────────────────────────────────────────────────────────────────────┤
    │  UI Layer (React)                                                      │
    │  ├── components/notebook/*                                            │
    │  ├── components/journal/*                                             │
    │  └── components/growth/*                                              │
    ├────────────────────────────────────────────────────────────────────────┤
    │  Data Access Layer (NEW)                                              │
    │  ├── useOfflineFirst(collection)  ← unified read hook                 │
    │  ├── useOfflineWrite()            ← unified write hook                │
    │  └── useSyncStatus()              ← queue visibility hook             │
    ├────────────────────────────────────────────────────────────────────────┤
    │  Sync Engine (NEW)                                                     │
    │  ├── OfflineQueue (IndexedDB)                                         │
    │  ├── SyncWorker (background)                                          │
    │  ├── ConflictResolver                                                 │
    │  └── NetworkDetector                                                  │
    ├────────────────────────────────────────────────────────────────────────┤
    │  Local Storage Layer                                                   │
    │  ├── IndexedDB (primary store for documents)                          │
    │  ├── LocalStorage (small settings, queue metadata)                    │
    │  └── Encrypted Vault (optional, for sensitive docs)                   │
    ├────────────────────────────────────────────────────────────────────────┤
    │  Remote Layer                                                          │
    │  ├── Firestore (cloud persistence)                                    │
    │  ├── Cloud Functions v2                                               │
    │  └── Firebase Auth (anonymous + upgradeable)                          │
    └────────────────────────────────────────────────────────────────────────┘

### A.2 Write Pipeline (Local-First)

**Principle:** Every write succeeds immediately, locally. Network is async. User
Action → Optimistic Update → IndexedDB Write → Queue Entry → UI Confirms │ ▼
[Background Sync Worker] │ ┌──────────────┼──────────────┐ ▼ ▼ ▼ Network OK
Network Fail Conflict │ │ │ ▼ ▼ ▼ Firestore Write Retry Queue User Prompt │ │ │
▼ ▼ ▼ Mark Synced Exp. Backoff Resolution

**Implementation Notes:**

1. **Optimistic UI:** Update React state immediately via `useOfflineFirst` hook
2. **Durability:** Write to IndexedDB before returning control to user
3. **Queue:** Add sync entry with `pending` status
4. **Background:** Service Worker or `requestIdleCallback` processes queue
5. **Status:** UI shows sync indicator (✓ synced, ⏳ pending, ⚠️ failed)

### A.3 Read Pipeline

    User Opens View → Check IndexedDB → Render Immediately
                             │
                             ▼ (if online + stale)
                  Background Fetch from Firestore
                             │
                             ▼
                  Merge/Update IndexedDB → Re-render if different

**Staleness Policy:**

- Journal entries: Fetch if > 5 minutes since last sync
- Meetings: Fetch if > 1 hour
- Static content (prayers, steps): Fetch if > 24 hours
- User can force-refresh via pull-to-refresh gesture

### A.4 Background Sync Strategy

    // Retry with exponential backoff
    const RETRY_INTERVALS = [1000, 5000, 15000, 60000, 300000]; // ms
    const MAX_RETRIES = 5;

    // When online detected:
    // 1. Process queue in FIFO order
    // 2. On success: remove from queue, update local with server timestamp
    // 3. On conflict: pause queue, surface to user
    // 4. On network error: increment retry, use backoff
    // 5. On permanent error (auth, validation): mark failed, notify user

### A.5 iOS PWA Constraints and Mitigations

| Constraint              | Impact                                  | Mitigation                                               |
| ----------------------- | --------------------------------------- | -------------------------------------------------------- |
| No Background Sync API  | Can't sync when app is closed           | Sync on app foreground + aggressive sync when online     |
| IndexedDB eviction      | Safari may clear after 7 days of no use | Warn users; encourage regular use; export backup prompts |
| No Push Notifications   | Can't notify of sync failures           | In-app notification queue on next open                   |
| Service Worker limits   | Unpredictable lifecycle                 | Keep SW minimal; do sync in main thread                  |
| 50MB localStorage limit | May hit ceiling                         | Use IndexedDB (larger quota); compress old entries       |
| No beforeinstallprompt  | Can't prompt PWA install                | Manual "Add to Home Screen" instructions                 |

**Critical Mitigation:** Implement a "Sync & Storage" settings panel (per
requirement) that:

- Shows estimated local storage used
- Explains what's stored locally vs. cloud
- Allows user to export backup
- Shows last successful sync timestamp
- Allows force-sync attempt

### A.6 Why Not [Alternative]?

| Alternative                      | Why Not                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| **PouchDB/CouchDB**              | Adds complexity; Firestore is already our backend; PouchDB sync model differs from Firestore |
| **RxDB**                         | Good option but overkill; simpler custom layer fits our needs                                |
| **Firebase offline persistence** | Too opaque; no queue visibility; poor conflict handling; silent failures                     |
| **localStorage only**            | 5-10MB limit; no good querying; not suitable for journal volume                              |

---

## B. Data Model + Firestore Rules Direction

**Phase:** Foundation  
**Effort:** 1-2 weeks  
**Confidence:** High

### B.1 Proposed Collection Structure

    firestore/
    ├── users/{uid}/
    │   ├── profile                 # User settings, preferences
    │   ├── journalEntries/         # All journal content
    │   │   └── {entryId}
    │   ├── stepWork/               # Step worksheets/packets
    │   │   └── {stepId}/
    │   │       └── worksheets/{worksheetId}
    │   ├── sponsors/               # Sponsor relationships (this user is sponsee)
    │   │   └── {relationshipId}
    │   ├── sponsees/               # Sponsee relationships (this user is sponsor)
    │   │   └── {relationshipId}
    │   ├── sharedPackets/          # Packets shared TO this user
    │   │   └── {packetId}
    │   └── syncState/              # Sync metadata (non-sensitive)
    │       └── {deviceId}
    │
    ├── sharedPackets/{packetId}/   # Root collection for shared content
    │   ├── metadata                # Who shared, when, access status
    │   └── content                 # Actual shared content (copy, not reference)
    │
    └── meetings/{meetingId}        # Public meetings directory

### B.2 Key Document Schemas

    // Journal Entry (simplified)
    interface JournalEntry {
      id: string;
      uid: string;
      type: 'mood_stamp' | 'check_in' | 'note' | 'spot_check' | 'night_review' | 'gratitude';
      content: Record<string, unknown>; // Type-specific content
      createdAt: Timestamp;
      updatedAt: Timestamp;
      localVersion: number;         // For conflict detection
      isEncrypted: boolean;         // Future: encryption flag
      encryptionKeyId?: string;     // Future: which key encrypted this
      deletedAt?: Timestamp;        // Soft delete
    }

    // Sponsor Relationship
    interface SponsorRelationship {
      id: string;
      sponsorUid: string;
      sponseeUid: string;
      status: 'pending' | 'active' | 'revoked';
      createdAt: Timestamp;
      nickname: string;             // Sponsee's display name for sponsor
      allowedShareTypes: string[];  // What categories sponsee can share
      revokedAt?: Timestamp;
    }

    // Shared Packet
    interface SharedPacket {
      id: string;
      fromUid: string;              // Sponsee
      toUid: string;                // Sponsor
      type: 'step_work' | 'inventory' | 'custom';
      title: string;
      contentSnapshot: object;      // Copy at time of share (immutable)
      sharedAt: Timestamp;
      viewedAt?: Timestamp;         // When sponsor first viewed
      expiresAt?: Timestamp;        // Optional auto-expiry
      revoked: boolean;
    }

    // Sync State (per device)
    interface SyncState {
      deviceId: string;
      lastSyncAt: Timestamp;
      pendingCount: number;
      failedCount: number;
      queueDepth: number;
    }

### B.3 Firestore Security Rules Direction

**Principles:**

1. **Row-level security:** Users can only read/write their own data
2. **App Check required:** Production requires valid App Check token
3. **Sponsor access is explicit:** Sponsors can only read `sharedPackets` where
   `toUid == request.auth.uid`
4. **Revocation is immediate:** Once `revoked: true`, no further reads
5. **Minimal PII:** No names, emails, or phone numbers in document content

**Pseudocode Rules:** // Journal entries: owner only match
/users/{uid}/journalEntries/{entryId} { allow read, write: if request.auth.uid
== uid; }

    // Shared packets: both parties can read, only sender can write
    match /sharedPackets/{packetId} {
      allow read: if resource.data.fromUid == request.auth.uid
                  || (resource.data.toUid == request.auth.uid && resource.data.revoked == false);
      allow create: if request.auth.uid == request.resource.data.fromUid;
      allow update: if request.auth.uid == resource.data.fromUid; // Only sender can revoke
      allow delete: if false; // Soft delete only
    }

    // Sponsor relationships
    match /users/{uid}/sponsors/{relationshipId} {
      allow read: if request.auth.uid == uid;
      allow write: if request.auth.uid == uid;
    }

### B.4 Revocation Strategy

When sponsee revokes access:

1. Update `sharedPackets/{packetId}.revoked = true`
2. Update `sponsorRelationship.status = 'revoked'`
3. Security rules immediately block sponsor reads
4. Sponsor's UI shows "Access revoked" on next load
5. Consider Cloud Function to clean up sponsor's local cache reference

**Tradeoffs:**

- Sponsor still saw content before revocation (unavoidable)
- Could add expiration timestamps for auto-revoke
- No way to "unsend" — this is by design (matches real-world)

---

## C. Offline Queue + Conflict Resolution Spec

**Phase:** Foundation  
**Effort:** 2-3 weeks  
**Confidence:** High

### C.1 Queue Item Format

    interface QueueItem {
      id: string;                   // UUID
      operation: 'create' | 'update' | 'delete';
      collection: string;           // e.g., 'journalEntries'
      documentId: string;
      payload: Record<string, unknown>;
      localVersion: number;         // Increments on each local change
      timestamp: number;            // Local timestamp (ms)
      status: 'pending' | 'syncing' | 'failed' | 'conflict';
      retryCount: number;
      lastError?: string;
      createdAt: number;
    }

### C.2 Atomic Doc vs Event Sourcing: Hybrid Approach

**Recommendation:** Atomic document with version vector

**Why not pure event sourcing:**

- Overkill for journal entries
- Increases storage and complexity
- Harder to query and display

**Why not pure last-write-wins:**

- Loses data silently
- Bad UX for concurrent edits

**Hybrid approach:**

- Store full document state (atomic)
- Include `localVersion` counter
- On conflict: compare versions, prompt user if needed

### C.3 Conflict Detection Algorithm

    function detectConflict(
      localDoc: Document,
      remoteDoc: Document
    ): 'identical' | 'mergeable' | 'conflict' {
      // Case 1: Identical
      if (deepEqual(localDoc.content, remoteDoc.content)) {
        return 'identical';
      }

      // Case 2: Local is superset (append-only)
      // e.g., local has everything remote has, plus more at the end
      if (isAppendOnly(localDoc, remoteDoc)) {
        return 'mergeable'; // Keep local
      }

      // Case 3: Remote is superset (we're behind)
      if (isAppendOnly(remoteDoc, localDoc)) {
        return 'mergeable'; // Keep remote
      }

      // Case 4: True conflict
      return 'conflict';
    }

    function isAppendOnly(newer: Document, older: Document): boolean {
      // For text fields: check if newer starts with older's content
      // For arrays: check if newer contains all of older's items in order
      // Implementation depends on document structure
      const olderText = extractText(older);
      const newerText = extractText(newer);
      return newerText.startsWith(olderText);
    }

### C.4 Merge UX Flow

    ┌──────────────────────────────────────────────────────────────┐
    │                    Sync Conflict Detected                    │
    │                                                              │
    │  Your note has been edited on another device.               │
    │                                                              │
    │  ┌─────────────────┐    ┌─────────────────┐                 │
    │  │   Your Version  │    │  Other Version  │                 │
    │  │                 │    │                 │                 │
    │  │  "I felt calm   │    │  "I felt calm   │                 │
    │  │   today after   │    │   today. Called │                 │
    │  │   the meeting"  │    │   my sponsor."  │                 │
    │  │                 │    │                 │                 │
    │  └─────────────────┘    └─────────────────┘                 │
    │                                                              │
    │  ┌──────────┐ ┌──────────┐ ┌──────────────┐                │
    │  │Keep Mine │ │Keep Other│ │ Keep Both    │                │
    │  └──────────┘ └──────────┘ └──────────────┘                │
    └──────────────────────────────────────────────────────────────┘

**Keep Both:** Creates a merged document with both versions separated by
timestamp markers.

### C.5 Code Skeletons

#### useOfflineQueue Hook

    // hooks/use-offline-queue.ts
    import { useState, useEffect, useCallback } from 'react';
    import { openDB, IDBPDatabase } from 'idb';

    interface QueueState {
      pending: number;
      syncing: number;
      failed: number;
      conflicts: QueueItem[];
    }

    export function useOfflineQueue() {
      const [db, setDb] = useState<IDBPDatabase | null>(null);
      const [state, setState] = useState<QueueState>({
        pending: 0,
        syncing: 0,
        failed: 0,
        conflicts: [],
      });

      // Initialize IndexedDB
      useEffect(() => {
        const initDb = async () => {
          const database = await openDB('sonash-offline', 1, {
            upgrade(db) {
              // Queue store
              const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
              queueStore.createIndex('status', 'status');
              queueStore.createIndex('timestamp', 'timestamp');

              // Documents store (local cache)
              const docsStore = db.createObjectStore('documents', { keyPath: 'id' });
              docsStore.createIndex('collection', 'collection');
              docsStore.createIndex('updatedAt', 'updatedAt');
            },
          });
          setDb(database);
        };
        initDb();
      }, []);

      // Enqueue a write operation
      const enqueue = useCallback(async (
        operation: 'create' | 'update' | 'delete',
        collection: string,
        documentId: string,
        payload: Record<string, unknown>
      ): Promise<void> => {
        if (!db) throw new Error('Database not initialized');

        const item: QueueItem = {
          id: crypto.randomUUID(),
          operation,
          collection,
          documentId,
          payload,
          localVersion: Date.now(), // Simplified version
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          createdAt: Date.now(),
        };

        // Write to queue
        await db.add('queue', item);

        // Also update local document cache
        await db.put('documents', {
          id: `${collection}/${documentId}`,
          collection,
          documentId,
          data: payload,
          updatedAt: Date.now(),
          syncStatus: 'pending',
        });

        // Update state
        setState(prev => ({ ...prev, pending: prev.pending + 1 }));
      }, [db]);

      // Get queue status
      const getStatus = useCallback(async (): Promise<QueueState> => {
        if (!db) return state;

        const pending = await db.countFromIndex('queue', 'status', 'pending');
        const syncing = await db.countFromIndex('queue', 'status', 'syncing');
        const failed = await db.countFromIndex('queue', 'status', 'failed');
        const conflicts = await db.getAllFromIndex('queue', 'status', 'conflict');

        const newState = { pending, syncing, failed, conflicts };
        setState(newState);
        return newState;
      }, [db, state]);

      // Resolve a conflict
      const resolveConflict = useCallback(async (
        itemId: string,
        resolution: 'keep_local' | 'keep_remote' | 'keep_both'
      ): Promise<void> => {
        if (!db) throw new Error('Database not initialized');

        const item = await db.get('queue', itemId);
        if (!item || item.status !== 'conflict') return;

        // Handle resolution based on choice
        // ... implementation depends on resolution type

        // Remove from queue after resolution
        await db.delete('queue', itemId);
        await getStatus();
      }, [db, getStatus]);

      return {
        enqueue,
        getStatus,
        resolveConflict,
        state,
        isReady: !!db,
      };
    }

#### Sync Worker

    // lib/sync/sync-worker.ts
    import { db as firestore } from '@/lib/firebase';
    import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

    const RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000];

    export class SyncWorker {
      private db: IDBPDatabase;
      private isProcessing = false;
      private networkStatus: 'online' | 'offline' = 'online';

      constructor(db: IDBPDatabase) {
        this.db = db;
        this.setupNetworkListener();
      }

      private setupNetworkListener() {
        window.addEventListener('online', () => {
          this.networkStatus = 'online';
          this.processQueue();
        });
        window.addEventListener('offline', () => {
          this.networkStatus = 'offline';
        });
      }

      async processQueue(): Promise<void> {
        if (this.isProcessing || this.networkStatus === 'offline') return;
        this.isProcessing = true;

        try {
          const pendingItems = await this.db.getAllFromIndex('queue', 'status', 'pending');

          for (const item of pendingItems) {
            await this.processItem(item);
          }
        } finally {
          this.isProcessing = false;
        }
      }

      private async processItem(item: QueueItem): Promise<void> {
        // Mark as syncing
        await this.db.put('queue', { ...item, status: 'syncing' });

        try {
          // Check for conflicts first
          const conflict = await this.checkConflict(item);
          if (conflict) {
            await this.db.put('queue', { ...item, status: 'conflict' });
            return;
          }

          // Perform Firestore operation
          const docRef = doc(firestore, `users/${item.payload.uid}/${item.collection}/${item.documentId}`);

          switch (item.operation) {
            case 'create':
            case 'update':
              await setDoc(docRef, {
                ...item.payload,
                updatedAt: serverTimestamp(),
                localVersion: item.localVersion,
              }, { merge: item.operation === 'update' });
              break;
            case 'delete':
              await deleteDoc(docRef);
              break;
          }

          // Success: remove from queue
          await this.db.delete('queue', item.id);

          // Update local doc status
          const localDocKey = `${item.collection}/${item.documentId}`;
          const localDoc = await this.db.get('documents', localDocKey);
          if (localDoc) {
            await this.db.put('documents', { ...localDoc, syncStatus: 'synced' });
          }

        } catch (error) {
          await this.handleError(item, error);
        }
      }

      private async checkConflict(item: QueueItem): Promise<boolean> {
        const docRef = doc(firestore, `users/${item.payload.uid}/${item.collection}/${item.documentId}`);
        const remoteSnap = await getDoc(docRef);

        if (!remoteSnap.exists()) {
          return false; // No remote doc, no conflict
        }

        const remoteData = remoteSnap.data();
        const remoteVersion = remoteData.localVersion || 0;

        // If remote version is newer than what we based our edit on
        // AND content differs meaningfully, it's a conflict
        if (remoteVersion > item.localVersion) {
          // Run conflict detection algorithm
          return detectConflict(item.payload, remoteData) === 'conflict';
        }

        return false;
      }

      private async handleError(item: QueueItem, error: unknown): Promise<void> {
        const newRetryCount = item.retryCount + 1;

        if (newRetryCount >= RETRY_DELAYS.length) {
          // Max retries reached
          await this.db.put('queue', {
            ...item,
            status: 'failed',
            retryCount: newRetryCount,
            lastError: String(error),
          });
        } else {
          // Schedule retry
          await this.db.put('queue', {
            ...item,
            status: 'pending',
            retryCount: newRetryCount,
            lastError: String(error),
          });

          // Delay next attempt
          setTimeout(() => this.processQueue(), RETRY_DELAYS[newRetryCount]);
        }
      }
    }

---

## D. Encryption & Passcode System

**Phase:** Phase 2 (after offline-first is stable)  
**Effort:** 3-4 weeks  
**Confidence:** Medium-High

### D.1 Threat Model

| Threat                   | Likelihood | Impact   | Mitigation                                  |
| ------------------------ | ---------- | -------- | ------------------------------------------- |
| Device stolen (unlocked) | Medium     | High     | Passcode gate before sensitive content      |
| Device stolen (locked)   | High       | Low      | iOS/Android encryption handles this         |
| Shared phone (family)    | Medium     | Medium   | Passcode gate, biometric unlock             |
| Sponsor misuse           | Low        | High     | No live access, explicit sharing only       |
| Accidental export leak   | Medium     | Medium   | Metadata stripping, user confirmation       |
| Cloud provider breach    | Low        | High     | Client-side encryption for sensitive fields |
| User forgets passcode    | High       | Critical | Recovery key required                       |

### D.2 Phased Implementation Plan

#### Phase 1: Passcode Gate (Ship First)

**What it does:**

- User sets a 4-6 digit PIN when enabling "Vault Mode"
- Sensitive areas (Step 4, Amends List) require PIN entry
- Optional: FaceID/TouchID bypass after initial PIN setup

**Implementation:**

- Store PIN hash in device Keychain (iOS) / Keystore (Android)
- For PWA: Use `window.crypto.subtle` to derive key from PIN
- Session timeout: 5 minutes of inactivity = re-lock
- No cloud storage of PIN or derived key

**No encryption yet** — just access control. This ships fast and validates UX.

#### Phase 2: Document-Level Encryption

**What it does:**

- Sensitive documents encrypted at rest in IndexedDB
- Same content encrypted before upload to Firestore
- Decryption requires passcode/biometric

**Architecture:** User PIN → PBKDF2 (100k iterations) → Master Key (AES-256) │ ▼
Encrypt Document Key (per doc) │ ▼ Document Key encrypts content

**Why per-document keys:**

- Rotating master key doesn't require re-encrypting everything
- Can share specific docs without exposing others
- Smaller blast radius if one key leaked

### D.3 Recovery Model (Critical)

**Recommendation:** Recovery Key + Optional Export Bundle

**On Vault Setup:**

1. Generate 256-bit recovery key
2. Display as 24-word BIP39 mnemonic OR QR code
3. User MUST acknowledge they've saved it (checkbox)
4. Store recovery key encrypted with master key (for verification)

**Recovery Flow:**

1. User enters recovery key
2. System verifies against stored hash
3. User sets new PIN
4. Re-derive master key from new PIN
5. Re-encrypt all document keys with new master

**Alternative Considered: Cloud Escrow**

| Approach               | Pros                        | Cons                                     |
| ---------------------- | --------------------------- | ---------------------------------------- |
| Recovery key only      | Zero trust, user controls   | User can lose key                        |
| Cloud escrow           | Can recover via email/phone | Privacy concern, single point of failure |
| Both (optional escrow) | Flexibility                 | Complexity, may confuse users            |

**Recommendation:** Recovery key only, with strong UX around saving it. Consider
optional export-encrypted-backup as fallback.

### D.4 Key Storage by Platform

| Platform         | Master Key Storage   | Recovery Key          |
| ---------------- | -------------------- | --------------------- |
| PWA (iOS)        | localStorage (risky) | User saves externally |
| PWA (Android)    | localStorage (risky) | User saves externally |
| Native (iOS)     | Keychain Services    | User saves externally |
| Native (Android) | Android Keystore     | User saves externally |

**PWA Limitation:** No secure key storage. `localStorage` can be read by any JS
on the page. Mitigations:

- Clear key on page unload
- Short session timeouts
- Require PIN re-entry frequently

**This is a strong argument for native apps for users who want encryption.**

### D.5 What Gets Encrypted

**Phase 1 (Passcode Gate Only):**

- Nothing encrypted, just access-controlled

**Phase 2 (Selective Encryption):**

- Step 4 inventory entries (resentments, fears, sex conduct)
- Step 8/9 amends lists
- Any entry user explicitly marks "sensitive"

**Phase 3 (Optional Full Encryption):**

- All journal entries
- All step work

**Trade-off:** More encryption = more complexity = harder recovery. Default to
selective.

---

## E. Exports / PDF Generation / Metadata Hygiene

**Phase:** Can ship incrementally with each feature  
**Effort:** 2 weeks for core PDF system  
**Confidence:** High

### E.1 PDF Generation Approach

**PWA (Recommended): jsPDF + html2canvas** import jsPDF from 'jspdf'; import
html2canvas from 'html2canvas';

    async function exportToPdf(elementId: string, filename: string): Promise<void> {
      const element = document.getElementById(elementId);
      if (!element) throw new Error('Element not found');

      // Render HTML to canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
    }

**Alternative: pdf-lib (for structured PDFs)**

Better for multi-page documents with consistent styling: import { PDFDocument,
StandardFonts } from 'pdf-lib';

    async function createStepWorkPdf(stepWork: StepWork): Promise<Uint8Array> {
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);

      const page = pdf.addPage([612, 792]); // Letter size
      const { height } = page.getSize();

      page.drawText(stepWork.title, {
        x: 50,
        y: height - 50,
        size: 18,
        font,
      });

      // ... add content

      return pdf.save();
    }

**Native (Capacitor):** Use native print dialog: import { Printer } from
'@capacitor-community/printer';

    async function printDocument(html: string): Promise<void> {
      await Printer.print({ content: html });
    }

### E.2 Metadata Hygiene

**Required Stripping:**

| Metadata Type          | Risk                 | Action                 |
| ---------------------- | -------------------- | ---------------------- |
| EXIF GPS               | Location leak        | Strip before export    |
| EXIF timestamps        | Pattern analysis     | Strip                  |
| PDF creator metadata   | Software fingerprint | Set generic value      |
| PDF modification dates | Usage patterns       | Set to creation date   |
| Filename patterns      | Content inference    | User-controlled naming |

**Implementation:** // For images embedded in exports async function
stripImageMetadata(imageBlob: Blob): Promise<Blob> { const img = await
createImageBitmap(imageBlob); const canvas = document.createElement('canvas');
canvas.width = img.width; canvas.height = img.height; const ctx =
canvas.getContext('2d')!; ctx.drawImage(img, 0, 0); return new Promise(resolve
=> canvas.toBlob(resolve!, 'image/jpeg', 0.9)); }

    // For PDFs
    function setPdfMetadata(pdf: jsPDF): void {
      pdf.setProperties({
        title: 'Recovery Document', // Generic
        subject: '',
        author: 'SoNash', // App name only
        keywords: '',
        creator: 'SoNash',
      });
    }

### E.3 Sponsor Packet Format

    interface SponsorPacket {
      id: string;
      title: string;
      type: 'step_work' | 'inventory' | 'journal_excerpt';
      createdAt: Date;
      sections: PacketSection[];
      includedItems: string[]; // IDs of included entries
      excludedFields: string[]; // Fields user chose to omit
      watermark?: string; // "Shared with [sponsor name] on [date]"
    }

    interface PacketSection {
      heading: string;
      content: string | StructuredContent;
      order: number;
    }

**User Selection Flow:**
┌─────────────────────────────────────────────────────────────┐ │ Create Packet
for Sponsor │ ├─────────────────────────────────────────────────────────────┤ │
│ │ Select what to include: │ │ │ │ ☑ Step 4 Resentment Inventory │ │ ☑
Names/People │ │ ☐ Specific incidents (exclude) │ │ ☑ My part │ │ │ │ ☐ Step 4
Fear Inventory │ │ │ │ ☑ Journal entries (Jan 15-20) │ │ ☑ Mood stamps │ │ ☑
Notes │ │ ☐ Check-ins (exclude) │ │ │ │ ┌──────────────────┐
┌──────────────────────────┐ │ │ │ Preview Packet │ │ Share with [Sponsor] │ │ │
└──────────────────┘ └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

### E.4 Sharing Integration

**PWA (Web Share API):** async function sharePacket(packet: SponsorPacket,
pdfBlob: Blob): Promise<void> { const file = new File([pdfBlob],
`${packet.title}.pdf`, { type: 'application/pdf' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: packet.title,
          text: `Recovery work from SoNash`,
          files: [file],
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${packet.title}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }

**Native (Capacitor Share):** import { Share } from '@capacitor/share';

    await Share.share({
      title: packet.title,
      text: 'Recovery work from SoNash',
      url: fileUri, // Local file URI
      dialogTitle: 'Share with sponsor',
    });

---

## F. Analytics Plan

**Phase:** Can implement immediately (low effort)  
**Effort:** 1 week  
**Confidence:** High

### F.1 Tooling Recommendation

**Primary:** Firebase Analytics (already in stack)

**Why Firebase Analytics:**

- Already integrated with Firebase
- Free tier is generous
- Automatic session/engagement tracking
- Works offline (queues events)
- Privacy controls available

**Alternative Considered:**

| Tool      | Pros                         | Cons                    |
| --------- | ---------------------------- | ----------------------- |
| PostHog   | Self-hostable, feature flags | Extra infrastructure    |
| Mixpanel  | Great funnels                | Cost, privacy concerns  |
| Plausible | Privacy-first                | Limited custom events   |
| Custom    | Full control                 | Build/maintain overhead |

### F.2 Event Taxonomy

**Principles:**

- Track ACTIONS, not CONTENT
- No PII in event properties
- No journal text, no names
- Aggregate where possible

| Event Name               | Properties                            | Purpose             |
| ------------------------ | ------------------------------------- | ------------------- |
| `journal_entry_created`  | `type`, `has_mood`, `has_text` (bool) | Feature usage       |
| `journal_entry_viewed`   | `type`, `age_days`                    | Engagement patterns |
| `step_work_started`      | `step_number`                         | Funnel tracking     |
| `step_work_saved`        | `step_number`, `section_count`        | Completion tracking |
| `sponsor_link_created`   | (none)                                | Feature adoption    |
| `sponsor_packet_shared`  | `packet_type`, `item_count`           | Sharing patterns    |
| `sponsor_packet_revoked` | `age_days`                            | Revocation patterns |
| `export_pdf`             | `content_type`, `page_count`          | Export usage        |
| `sync_started`           | `queue_depth`                         | Sync health         |
| `sync_completed`         | `duration_ms`, `items_synced`         | Sync performance    |
| `sync_failed`            | `error_type`, `retry_count`           | Error tracking      |
| `conflict_detected`      | `collection`, `resolution_type`       | Conflict patterns   |
| `encryption_enabled`     | (none)                                | Security adoption   |
| `passcode_set`           | (none)                                | Security adoption   |
| `app_opened`             | `days_since_last_open`                | Retention           |
| `onboarding_completed`   | `fellowship`, `has_clean_date`        | Funnel              |
| `meeting_searched`       | `filter_type`                         | Feature usage       |
| `crisis_resource_viewed` | `resource_type`                       | Safety tracking     |

### F.3 Implementation Example

    // lib/analytics.ts
    import { logEvent, setUserProperties, setUserId } from 'firebase/analytics';
    import { analytics } from '@/lib/firebase';

    export const Analytics = {
      // Never log content, only actions
      journalEntryCreated(type: string, hasMood: boolean, hasText: boolean) {
        logEvent(analytics, 'journal_entry_created', {
          type,
          has_mood: hasMood,
          has_text: hasText,
        });
      },

      syncFailed(errorType: string, retryCount: number) {
        logEvent(analytics, 'sync_failed', {
          error_type: errorType,
          retry_count: retryCount,
        });
      },

      // Set user properties (aggregate, not PII)
      setUserContext(fellowship: string, hasCleanDate: boolean) {
        setUserProperties(analytics, {
          fellowship,
          has_clean_date: hasCleanDate,
        });
      },
    };

### F.4 Opt-In/Opt-Out UX

**Default:** Analytics ON (with disclosure in onboarding)

**Settings Screen:**
┌─────────────────────────────────────────────────────────────┐ │ Privacy
Settings │ ├─────────────────────────────────────────────────────────────┤ │ │ │
📊 Usage Analytics [ON] │ │ Help improve SoNash by sharing anonymous usage data.
│ │ We never collect your journal content or personal info. │ │ │ │ What we
collect: │ │ • Which features you use │ │ • App performance and errors │ │ •
Sync success/failure rates │ │ │ │ What we never collect: │ │ • Journal entries
or notes │ │ • Names, locations, or contact info │ │ • Sponsor relationships │ │
│ │ [View Privacy Policy] │ │ │
└─────────────────────────────────────────────────────────────┘

### F.5 Retention Policy

| Data Type           | Retention | Reason           |
| ------------------- | --------- | ---------------- |
| Event data          | 14 months | Firebase default |
| User properties     | 14 months | Firebase default |
| Crash reports       | 90 days   | Sentry default   |
| Performance metrics | 30 days   | Rolling window   |

---

## G. Tech Debt / Quality Gates

**Phase:** Ongoing (start now)  
**Effort:** Continuous  
**Confidence:** High

### G.1 Incremental Adoption Plan

**Principle:** No big bang rewrites. Each feature ships behind a flag. //
lib/feature-flags.ts export const FeatureFlags = { OFFLINE_FIRST:
process.env.NEXT_PUBLIC_FF_OFFLINE_FIRST === 'true', ENCRYPTION:
process.env.NEXT_PUBLIC_FF_ENCRYPTION === 'true', SPONSOR_SHARING:
process.env.NEXT_PUBLIC_FF_SPONSOR_SHARING === 'true', PDF_EXPORT:
process.env.NEXT_PUBLIC_FF_PDF_EXPORT === 'true', };

    // Usage
    if (FeatureFlags.OFFLINE_FIRST) {
      return useOfflineFirst('journalEntries');
    } else {
      return useLegacyFirestore('journalEntries');
    }

**Rollout Order:**

1. ✅ SonarCloud cleanup (current blocker)
2. Offline-first for journal (behind flag)
3. Sync status UI
4. PDF export (standalone, no dependencies)
5. Sponsor model (data layer)
6. Encryption (highest risk, ship last)

### G.2 Testing Plan

**Unit Tests (Jest):** // tests/sync/conflict-resolver.test.ts
describe('ConflictResolver', () => { it('detects identical documents', () => {
const local = { content: 'hello', version: 1 }; const remote = { content:
'hello', version: 1 }; expect(detectConflict(local, remote)).toBe('identical');
});

      it('detects append-only as mergeable', () => {
        const local = { content: 'hello world', version: 2 };
        const remote = { content: 'hello', version: 1 };
        expect(detectConflict(local, remote)).toBe('mergeable');
      });

      it('detects true conflict', () => {
        const local = { content: 'hello world', version: 2 };
        const remote = { content: 'hello universe', version: 2 };
        expect(detectConflict(local, remote)).toBe('conflict');
      });
    });

**Emulator Tests (Firebase):** // tests/firestore/sync.emulator.test.ts import {
initializeTestEnvironment } from '@firebase/rules-unit-testing';

    describe('Sync with Firestore', () => {
      let testEnv;

      beforeAll(async () => {
        testEnv = await initializeTestEnvironment({
          projectId: 'sonash-test',
          firestore: { host: 'localhost', port: 8080 },
        });
      });

      it('syncs offline queue when online', async () => {
        // ... test implementation
      });
    });

**E2E Tests (Playwright):** // e2e/offline-sync.spec.ts test('survives offline
then syncs', async ({ page, context }) => { // Go offline await
context.setOffline(true);

      // Create journal entry
      await page.fill('[data-testid="journal-input"]', 'Test entry');
      await page.click('[data-testid="save-entry"]');

      // Verify pending status
      await expect(page.locator('[data-testid="sync-status"]')).toContainText('Pending');

      // Go online
      await context.setOffline(false);

      // Verify synced
      await expect(page.locator('[data-testid="sync-status"]')).toContainText('Synced');
    });

### G.3 SonarCloud Guardrails

**Pre-merge Checks:** # .github/workflows/quality.yml jobs: quality: runs-on:
ubuntu-latest steps: - uses: actions/checkout@v4 - uses: actions/setup-node@v4

          - name: Install dependencies
            run: npm ci

          - name: Type check
            run: npm run type-check

          - name: Lint
            run: npm run lint

          - name: Test
            run: npm test -- --coverage

          - name: SonarCloud Scan
            uses: SonarSource/sonarcloud-github-action@master
            env:
              GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
              SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

**Quality Gate Rules:**

- No new bugs
- No new vulnerabilities
- No new security hotspots
- Coverage on new code > 80%
- Duplication on new code < 3%

### G.4 Rollout Plan with Feature Flags

| Feature         | Flag Name         | Phase  | Rollout % | Criteria to Expand                     |
| --------------- | ----------------- | ------ | --------- | -------------------------------------- |
| Offline Queue   | `OFFLINE_FIRST`   | Alpha  | 5%        | 0 data loss reports, <1% sync failures |
| Sync UI         | `SYNC_STATUS_UI`  | Alpha  | 5%        | Positive feedback, no confusion        |
| PDF Export      | `PDF_EXPORT`      | Beta   | 25%       | Works on iOS Safari                    |
| Sponsor Linking | `SPONSOR_SHARING` | Beta   | 10%       | Security review passed                 |
| Encryption      | `ENCRYPTION`      | Stable | 1%        | Recovery flow tested extensively       |

---

## H. Future Native Path Recommendation

**Phase:** After PWA is stable (Q2-Q3 2026)  
**Effort:** 4-6 weeks for initial Capacitor wrapper  
**Confidence:** High

### H.1 Recommendation: Capacitor

**Why Capacitor:**

| Factor             | Capacitor               | React Native       | Flutter           |
| ------------------ | ----------------------- | ------------------ | ----------------- |
| Code reuse         | 90%+ (existing Next.js) | 30% (new codebase) | 0% (new codebase) |
| Learning curve     | Low (web skills)        | Medium             | High (Dart)       |
| Native APIs        | Good plugins            | Excellent          | Excellent         |
| Performance        | Good (web view)         | Excellent          | Excellent         |
| Offline/encryption | Good                    | Excellent          | Excellent         |
| Time to ship       | 4-6 weeks               | 3-4 months         | 4-6 months        |

### H.2 How Capacitor Works with Current Stack

    ┌────────────────────────────────────────────────────────────────┐
    │                     Native App Shell                           │
    │                 (iOS: Swift/Capacitor)                         │
    │                 (Android: Kotlin/Capacitor)                    │
    ├────────────────────────────────────────────────────────────────┤
    │                    Capacitor Bridge                            │
    │              (JS ↔ Native communication)                       │
    ├────────────────────────────────────────────────────────────────┤
    │                  Next.js PWA (exported)                        │
    │              (Runs in native WebView)                          │
    ├────────────────────────────────────────────────────────────────┤
    │                   Native Plugins                               │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
    │  │ Keychain │ │ Biometrics│ │ Share   │ │ Storage │         │
    │  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
    └────────────────────────────────────────────────────────────────┘

### H.3 Key Native Features Enabled

| Feature            | Capacitor Plugin                          | Benefit                    |
| ------------------ | ----------------------------------------- | -------------------------- |
| Secure Key Storage | `@capacitor-community/secure-storage`     | Real encryption at rest    |
| Biometrics         | `@capacitor/local-notifications` + native | FaceID/TouchID unlock      |
| Share Sheet        | `@capacitor/share`                        | Native share UI            |
| Push Notifications | `@capacitor/push-notifications`           | Sync reminders             |
| Background Sync    | Custom native code                        | Sync when app backgrounded |
| File System        | `@capacitor/filesystem`                   | Larger offline storage     |

### H.4 iOS Build Reality

**Requirements:**

- Mac with Xcode 15+
- Apple Developer Account ($99/year)
- Provisioning profiles and certificates

**Options if No Mac:**

- GitHub Actions with macOS runners
- Cloud Mac services (MacStadium, MacinCloud)
- Friend/contractor with Mac

**CI/CD Pipeline:** # .github/workflows/ios.yml jobs: ios: runs-on: macos-latest
steps: - uses: actions/checkout@v4

          - name: Setup Node
            uses: actions/setup-node@v4

          - name: Install dependencies
            run: npm ci

          - name: Build web
            run: npm run build && npx cap sync ios

          - name: Build iOS
            run: |
              cd ios/App
              xcodebuild -workspace App.xcworkspace -scheme App \
                -configuration Release -archivePath build/App.xcarchive archive

### H.5 Migration Path

**Phase 1: Capacitor Wrapper (4-6 weeks)**

- Export Next.js as static site
- Add Capacitor to project
- Replace web crypto with native secure storage
- Replace Web Share API with native share
- Test on real devices

**Phase 2: Native Features (2-4 weeks)**

- Add biometric unlock
- Add push notifications
- Add background sync (iOS limitations apply)

**Phase 3: Store Submission (2-3 weeks)**

- App Store Connect setup
- Privacy policy, screenshots
- Review process (1-2 weeks)

---

## I. What You're Missing

**Questions/risks to decide later, with reasonable defaults provided.**

### I.1 Open Questions

| #   | Question                                                               | Default                                            | Decide By                    |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------- |
| 1   | **Step 4 structure:** Columned like traditional Big Book or free-form? | Start columned (resentments, fears, sex)           | Before M5-Inventories        |
| 2   | **Sponsor invitation flow:** Email/link/QR/manual code?                | Link + QR code                                     | Before sponsor feature ships |
| 3   | **Multi-device sync:** Explicit device registration or implicit?       | Implicit (any authed device can sync)              | Before offline-first ships   |
| 4   | **Backup export format:** JSON, encrypted bundle, or both?             | JSON (unencrypted) + encrypted bundle option       | Before encryption ships      |
| 5   | **Session timeout:** How long before passcode re-required?             | 5 minutes, user-configurable                       | Before encryption ships      |
| 6   | **Sponsor packet expiration:** Auto-expire shared content?             | No expiration by default, manual revoke            | Before sponsor feature ships |
| 7   | **Offline storage limit:** Warn user at what threshold?                | 100MB, suggest cleanup/export at 80%               | Before offline-first ships   |
| 8   | **Conflict resolution auto-merge:** How aggressive?                    | Conservative: prompt on any substantive difference | Before offline-first ships   |
| 9   | **Analytics consent:** GDPR/CCPA-style consent flow needed?            | Simple opt-out in settings (US-first)              | Before public launch         |
| 10  | **Native app pricing:** Same features as PWA or premium?               | Same features, native is convenience               | Before native ships          |

### I.2 Known Risks

| Risk                                          | Likelihood | Impact   | Mitigation                                    |
| --------------------------------------------- | ---------- | -------- | --------------------------------------------- |
| IndexedDB data loss (Safari)                  | Medium     | High     | Aggressive backup prompts, cloud sync         |
| User forgets recovery key                     | High       | Critical | Multiple save prompts, optional export backup |
| Sponsor misuse of shared data                 | Low        | High     | Clear sharing UI, revocation, no live access  |
| Complex conflict UX confuses users            | Medium     | Medium   | Default to "keep both," minimize prompts      |
| iOS PWA limitations frustrate users           | Medium     | Medium   | Clear expectations, push toward native        |
| SonarCloud cleanup takes longer than expected | Medium     | Low      | Parallelize where possible                    |

### I.3 Decisions Punted (Intentionally)

- **AI features:** Not implementing now. Design allows for future addition.
- **Multiple sponsor support:** Data model supports it, UI can come later.
- **Group/family sharing:** Not in scope. Individual recovery focus.
- **Web dashboard for sponsors:** Mobile-first. Web can come later.
- **Internationalization:** English only initially. Structure allows i18n later.

---

## Appendix A: Diagram — Full System Architecture

    ┌─────────────────────────────────────────────────────────────────────────────────┐
    │                              USER DEVICE                                        │
    │  ┌───────────────────────────────────────────────────────────────────────────┐  │
    │  │                         SoNash PWA / Native App                           │  │
    │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
    │  │  │   Today     │  │   Journal   │  │   Growth    │  │  Settings   │      │  │
    │  │  │    Tab      │  │    Tab      │  │    Tab      │  │    Tab      │      │  │
    │  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │  │
    │  │         │                │                │                │              │  │
    │  │         └────────────────┴────────────────┴────────────────┘              │  │
    │  │                                   │                                       │  │
    │  │                          ┌───────┴───────┐                               │  │
    │  │                          │  Data Access  │                               │  │
    │  │                          │    Layer      │                               │  │
    │  │                          │  (Hooks)      │                               │  │
    │  │                          └───────┬───────┘                               │  │
    │  │                                  │                                        │  │
    │  │         ┌────────────────────────┼────────────────────────┐              │  │
    │  │         │                        │                        │              │  │
    │  │    ┌────┴────┐            ┌──────┴──────┐          ┌──────┴──────┐      │  │
    │  │    │ Offline │            │    Sync     │          │  Encrypted  │      │  │
    │  │    │  Queue  │◄──────────►│   Worker    │          │    Vault    │      │  │
    │  │    │(IndexDB)│            │             │          │  (optional) │      │  │
    │  │    └────┬────┘            └──────┬──────┘          └──────┬──────┘      │  │
    │  │         │                        │                        │              │  │
    │  │         └────────────────────────┼────────────────────────┘              │  │
    │  │                                  │                                        │  │
    │  │                          ┌───────┴───────┐                               │  │
    │  │                          │  IndexedDB    │                               │  │
    │  │                          │  (Primary     │                               │  │
    │  │                          │   Store)      │                               │  │
    │  │                          └───────────────┘                               │  │
    │  └───────────────────────────────────────────────────────────────────────────┘  │
    └──────────────────────────────────────┬──────────────────────────────────────────┘
                                           │
                                  ┌────────┴────────┐
                                  │    Network      │
                                  │   (when avail)  │
                                  └────────┬────────┘
                                           │
    ┌──────────────────────────────────────┴──────────────────────────────────────────┐
    │                              FIREBASE CLOUD                                      │
    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
    │  │   Firestore     │  │   Cloud Funcs   │  │   Firebase      │                 │
    │  │   Database      │  │   (v2)          │  │   Auth          │                 │
    │  │                 │  │                 │  │                 │                 │
    │  │  • User data    │  │  • Validation   │  │  • Anonymous    │                 │
    │  │  • Journal      │  │  • Aggregation  │  │  • Email link   │                 │
    │  │  • Shared pkts  │  │  • Cleanup jobs │  │  • Upgrade path │                 │
    │  │  • Meetings     │  │  • Admin APIs   │  │                 │                 │
    │  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
    │                                                                                  │
    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
    │  │   App Check     │  │   Analytics     │  │   Sentry        │                 │
    │  │   (reCAPTCHA)   │  │   (events)      │  │   (errors)      │                 │
    │  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
    └──────────────────────────────────────────────────────────────────────────────────┘

---

## Appendix B: Implementation Priority Matrix

| Feature                   | User Value  | Technical Risk | Effort  | Priority Score | Ship Order |
| ------------------------- | ----------- | -------------- | ------- | -------------- | ---------- |
| Offline queue + status UI | 🔴 Critical | Medium         | 3 weeks | **95**         | 1          |
| PDF export                | 🟠 High     | Low            | 1 week  | **85**         | 2          |
| Sync & Storage settings   | 🟠 High     | Low            | 1 week  | **80**         | 3          |
| Sponsor data model        | 🟡 Medium   | Medium         | 2 weeks | **70**         | 4          |
| Conflict resolution UI    | 🟡 Medium   | Medium         | 2 weeks | **65**         | 5          |
| Passcode gate             | 🟡 Medium   | Medium         | 2 weeks | **60**         | 6          |
| Sponsor sharing UI        | 🟡 Medium   | Low            | 2 weeks | **55**         | 7          |
| Document encryption       | 🟢 Nice     | High           | 3 weeks | **45**         | 8          |
| Native (Capacitor)        | 🟢 Nice     | Medium         | 5 weeks | **40**         | 9          |

---

## Document Metadata

**Change Log:**

| Version | Date       | Author | Changes               |
| ------- | ---------- | ------ | --------------------- |
| 1.0     | 2026-01-20 | Claude | Initial specification |

**Review Status:**

- [ ] Technical review
- [ ] Security review
- [ ] UX review
- [ ] Owner approval

**Next Steps:**

1. Review and approve this specification
2. Complete SonarCloud cleanup (current blocker)
3. Begin offline-first implementation (Section C)
4. Ship behind feature flag
5. Iterate based on real-world testing

## KIMI K2

# SoNash Technical Co-Design Proposal

## A) SYSTEM ARCHITECTURE PROPOSAL (PWA now, Native later)

### Recommended Architecture: "Offline-First with Transparent Sync"

Copy ┌─────────────────────────────────────────────────────────────────┐ │
CLIENT LAYER │
├─────────────────────────────────────────────────────────────────┤ │ UI
Components (React) │ │ ├── Notebook Shell │ │ ├── Journal Timeline │ │ └── Step
Work Builder │
├─────────────────────────────────────────────────────────────────┤ │ State
Management (Zustand + TanStack Query) │ │ ├── Local Store (IndexedDB via Dexie)
│ │ ├── Sync Engine (Conflict Resolution) │ │ └── Offline Queue (Pending
Operations) │
├─────────────────────────────────────────────────────────────────┤ │ Service
Layer │ │ ├── useOfflineQueue() Hook │ │ ├── SyncWorker (Background Sync) │ │
└── Encryption Service (Vault) │
└─────────────────────────────────────────────────────────────────┘ │ ▼
┌─────────────────────────────────────────────────────────────────┐ │ SYNC
ADAPTER LAYER │
├─────────────────────────────────────────────────────────────────┤ │ Firebase
Sync Adapter │ │ ├── Batch Write Operations │ │ ├── Conflict Detection │ │ └──
Retry Strategy (Exponential Backoff) │
└─────────────────────────────────────────────────────────────────┘ │ ▼
┌─────────────────────────────────────────────────────────────────┐ │ FIREBASE
BACKEND │ ├─────────────────────────────────────────────────────────────────┤ │
Cloud Functions v2 │ │ ├── Security Validation (App Check + reCAPTCHA) │ │ ├──
Conflict Resolution API │ │ └── Export Generation (Server-side PDF) │ │ │ │
Firestore │ │ ├── users/{uid}/journal/{entryId} │ │ ├──
users/{uid}/stepwork/{stepId} │ │ └── shared/{shareId} (Sponsor Shares) │
└─────────────────────────────────────────────────────────────────┘

### Data Flow Architecture

Copy WRITE FLOW: User Input → Local Store (IndexedDB) → Offline Queue →
Background Sync → Firebase → Conflict Resolution → Local Update

    READ FLOW:
    User Request → Local Store (immediate) →
    Background Refresh → Firebase (if online) → Local Update

### iOS PWA Constraints & Mitigation

**Constraint 1: 50MB IndexedDB Limit**

- **Mitigation**: Implement LRU cache with user-configurable retention

- **Code**: Size-aware eviction in sync worker

- **UX**: "Storage Settings" shows usage breakdown

**Constraint 2: No Background Sync**

- **Mitigation**: Aggressive sync on app focus + beforeunload handler

- **Code**: `visibilitychange` listener triggers sync

- **UX**: "Sync Pending" badge when leaving app

**Constraint 3: Service Worker Installation Prompt**

- **Mitigation**: Custom install UI with clear value proposition

- **Code**: `beforeinstallprompt` handler with custom UI

- **UX**: "Install for Offline Access" banner

### Implementation Notes

TypeScript

Copy // Core offline queue structure interface OfflineQueueItem { id: string;
operation: 'create' | 'update' | 'delete'; collection: string; docId: string;
data: any; timestamp: number; retryCount: number; status: 'pending' | 'syncing'
| 'failed' | 'resolved'; conflictResolution?: 'local' | 'remote' | 'both'; }

    // Sync status for UI
    interface SyncStatus {
      status: 'online' | 'offline' | 'syncing' | 'error';
      pendingCount: number;
      lastSync: number | null;
      error: string | null;
    }

## B) DATA MODEL + FIRESTORE RULES DIRECTION

### Firestore Collection Structure

Copy users/{uid}/ ├── profile/ # Minimal profile data │ ├── createdAt: timestamp
│ ├── lastSeen: timestamp │ ├── settings: { │ │ ├── offlineRetentionDays: number
(default: 90) │ │ ├── syncEnabled: boolean (default: true) │ │ └──
encryptionEnabled: boolean (default: false) │ │ } │ └── stats: { │ ├──
totalEntries: number │ ├── lastEntryDate: timestamp │ └── syncStatus: string │ }
│ ├── journal/{entryId}/ # Journal entries │ ├── type: 'mood' | 'note' |
'spotcheck' | 'inventory' │ ├── content: string # Encrypted if vault enabled │
├── metadata: { │ │ ├── mood?: number │ │ ├── craving?: number │ │ └──
location?: GeoPoint (approximate) │ │ } │ ├── localTimestamp: timestamp │ ├──
syncedAt?: timestamp │ └── encryption?: 'vault' | 'none' │ ├──
stepwork/{stepId}/ # Step work packets │ ├── stepNumber: number # 1-12 │ ├──
title: string │ ├── content: string # Encrypted for Step 4/5/8/9 │ ├── status:
'draft' | 'ready' | 'shared' | 'completed' │ ├── sharedWith?: string[] # sponsor
UIDs │ ├── shareExpiry?: timestamp │ └── encryption: 'vault' | 'none' │ ├──
offlinequeue/{itemId}/ # Offline queue (auto-cleaned) │ └── [OfflineQueueItem
structure] │ └── syncstate/ # Sync metadata ├── lastFullSync: timestamp ├──
pendingCount: number └── conflictCount: number

    shared/{shareId}/               # Sponsor sharing (immutable)
    ├── sponsorId: string           # Who shared with
    ├── sponseeId: string           # Who it's from
    ├── type: 'stepwork' | 'journal' | 'inventory'
    ├── itemId: string              # Original item ID
    ├── content: string             # Decrypted content at share time
    ├── sharedAt: timestamp
    ├── expiresAt?: timestamp
    └── revokedAt?: timestamp       # If revoked

    analytics/events/{eventId}/     # Anonymous analytics
    ├── event: string               # 'journal_entry_created'
    ├── timestamp: timestamp
    ├── userIdHash: string          # Hashed UID (not reversible)
    ├── properties: object          # Non-sensitive properties
    └── sessionId: string           # Anonymous session

### Security Posture

**Row-Level Security:**

- Users access only their `users/{uid}` subtree

- Sponsor access only via explicit `shared/{shareId}` documents

- No collection-level queries across users

**Sponsor Access Control:**

- Sponsee creates `shared/{shareId}` with `sponsorId`

- Sponsor can read only active (non-revoked) shares

- Revocation = set `revokedAt: timestamp`

- Automatic expiry via `expiresAt`

**Minimal PII:**

- No email, phone, or real names in Firestore

- Anonymous auth UIDs only

- Location data approximate (city-level)

## C) OFFLINE QUEUE + CONFLICT RESOLUTION SPEC

### Queue Implementation Strategy: "Event Sourcing Lite"

We use an append-only event log with deterministic conflict resolution:

TypeScript

Copy // Event-based offline operations interface OfflineEvent { id: string;
type: 'journal_create' | 'journal_update' | 'stepwork_update'; payload: any;
timestamp: number; // Local timestamp vectorClock: number; // Monotonic counter
userId: string; }

    // Conflict resolution result
    interface ConflictResolution {
      strategy: 'auto_merge' | 'user_choice' | 'duplicate';
      resolution: any;
      explanation: string;
    }

### Conflict Detection Algorithm

TypeScript

Copy function detectConflict(local: any, remote: any): ConflictType { // Same
content = no conflict if (deepEqual(local, remote)) return 'none';

      // Local has remote + additional content = auto-merge
      if (isSuperset(local, remote)) return 'local_superset';
      if (isSuperset(remote, local)) return 'remote_superset';

      // Meaningful difference = user choice needed
      return 'meaningful_diff';
    }

    function isSuperset(a: any, b: any): boolean {
      // For text: a contains all of b's content
      // For objects: a has all of b's fields + possibly more
      // For arrays: a contains all of b's items in order
      return containsContent(a, b) && !hasSignificantChanges(a, b);
    }

### useOfflineQueue Hook Skeleton

TypeScript

Copy export function useOfflineQueue() { const [queue, setQueue] =
useState<OfflineQueueItem[]>([]); const [syncStatus, setSyncStatus] =
useState<SyncStatus>({ status: 'online', pendingCount: 0, lastSync: null, error:
null });

      // Add item to queue
      const queueOperation = useCallback(async (operation: QueueOperation) => {
        const item: OfflineQueueItem = {
          id: generateId(),
          ...operation,
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending'
        };

        // Save to IndexedDB
        await db.offlineQueue.add(item);

        // Update local state immediately
        await applyOperationLocally(item);

        // Trigger background sync
        triggerSync();
      }, []);

      // Background sync worker
      const syncWorker = useCallback(async () => {
        const pending = await db.offlineQueue
          .where('status').equals('pending')
          .toArray();

        for (const item of pending) {
          try {
            await syncItem(item);
          } catch (error) {
            await handleSyncError(item, error);
          }
        }
      }, []);

      return {
        queueOperation,
        syncStatus,
        pendingCount: queue.filter(q => q.status === 'pending').length
      };
    }

### Conflict Resolution UI Component

TypeScript

Copy function ConflictResolver({ conflict, onResolve }: Props) { const [choice,
setChoice] = useState<'local' | 'remote' | 'both' | null>(null);

      return (
        <div className="conflict-resolution-ui">
          <h3>Sync Conflict Detected</h3>
          <p>Your local version differs from the cloud version.</p>

          <div className="conflict-comparison">
            <div className="local-version">
              <h4>Your Local Version</h4>
              <pre>{conflict.localContent}</pre>
              <small>Modified: {formatDate(conflict.localTimestamp)}</small>
            </div>

            <div className="remote-version">
              <h4>Cloud Version</h4>
              <pre>{conflict.remoteContent}</pre>
              <small>Modified: {formatDate(conflict.remoteTimestamp)}</small>
            </div>
          </div>

          <div className="resolution-options">
            <button onClick={() => onResolve('local')}>
              Keep Local Version
            </button>
            <button onClick={() => onResolve('remote')}>
              Keep Cloud Version
            </button>
            <button onClick={() => onResolve('both')}>
              Keep Both (Append)
            </button>
          </div>
        </div>
      );
    }

## D) ENCRYPTION & PASSCODE SYSTEM (WITH RECOVERY)

### Phased Encryption Plan

**Phase 1: Vault-Based Encryption (Months 1-2)**

- Optional encrypted "vault" for sensitive categories

- Passcode-protected with recovery key

- AES-256-GCM encryption with PBKDF2 key derivation

**Phase 2: Extended Encryption (Months 3-4)**

- Expand to more field types based on user feedback

- Biometric unlock option

- Secure export with encryption

### Recovery Model: "Recovery Key + Device Keychain"

TypeScript

Copy interface EncryptionConfig { // Master encryption key (never stored
directly) masterKey: CryptoKey;

      // Recovery key (shown once to user)
      recoveryKey: string; // 24-word mnemonic

      // Device-specific key (stored in keychain)
      deviceKey: CryptoKey;

      // Key derivation function
      kdf: {
        salt: Uint8Array;
        iterations: 100000;
        algorithm: 'PBKDF2';
      };
    }

### Implementation Approach

TypeScript

Copy class EncryptionService { private masterKey: CryptoKey | null = null;

      async initialize(passcode: string, recoveryKey?: string): Promise<void> {
        if (recoveryKey) {
          // Existing user with recovery key
          this.masterKey = await this.deriveKeyFromRecovery(recoveryKey);
        } else {
          // New user - generate recovery key
          const newRecoveryKey = this.generateRecoveryKey();
          this.masterKey = await this.deriveKeyFromPasscode(passcode);

          // Show recovery key to user (one-time)
          await this.showRecoveryKey(newRecoveryKey);
        }

        // Store encrypted version in device keychain
        await this.storeInKeychain(this.masterKey);
      }

      async encryptVault(data: string): Promise<EncryptedData> {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          this.masterKey!,
          new TextEncoder().encode(data)
        );

        return {
          ciphertext: new Uint8Array(encrypted),
          iv,
          algorithm: 'AES-256-GCM'
        };
      }

      // Recovery process
      async recoverFromRecoveryKey(recoveryKey: string): Promise<boolean> {
        try {
          this.masterKey = await this.deriveKeyFromRecovery(recoveryKey);
          await this.storeInKeychain(this.masterKey);
          return true;
        } catch {
          return false;
        }
      }
    }

### Threat Model & Mitigation

**Device Theft:**

- ✅ Passcode required on app launch

- ✅ Device keychain encryption

- ✅ Optional biometric protection

**Shared Phone:**

- ✅ Separate app passcode (not device PIN)

- ✅ Auto-lock after 5 minutes

- ✅ No sensitive data in notifications

**Sponsor Misuse:**

- ✅ Explicit sharing only (no live access)

- ✅ Share expiry dates

- ✅ Revocation capability

**Accidental Export Leaks:**

- ✅ PDF watermarking with user name/date

- ✅ No metadata in exports

- ✅ Optional password protection on PDFs

## E) EXPORTS / PDF GENERATION / METADATA HYGIENE

### Local PDF Generation Approach

**Web (PWA): jsPDF + html2canvas**

TypeScript

Copy import jsPDF from 'jspdf'; import html2canvas from 'html2canvas';

    async function generateLocalPDF(content: string, options: PDFOptions): Promise<Blob> {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add content with proper formatting
      pdf.setFontSize(12);
      pdf.setFont('helvetica');

      // Split content into pages
      const lines = pdf.splitTextToSize(content, 180);
      let yPosition = 20;

      for (const line of lines) {
        if (yPosition > 280) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, 20, yPosition);
        yPosition += 5;
      }

      // Add watermark and metadata
      addWatermark(pdf, options);
      stripMetadata(pdf);

      return pdf.output('blob');
    }

    function addWatermark(pdf: jsPDF, options: PDFOptions): void {
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Generated by ${options.userName} on ${formatDate(options.generatedAt)}`,
        20,
        290
      );
    }

    function stripMetadata(pdf: jsPDF): void {
      // jsPDF doesn't include EXIF/GPS by default
      // Ensure no creation date metadata leaks
      pdf.setCreationDate(new Date(0));
    }

### Sponsor Packet Format

TypeScript

Copy interface SponsorPacket { title: string; sponseeName: string; generatedAt:
string; sections: PacketSection[]; watermark?: string; }

    interface PacketSection {
      title: string;
      type: 'stepwork' | 'inventory' | 'journal';
      content: string;
      dateRange: { start: string; end: string };
      sharedOn: string;
    }

    function generateSponsorPacket(packet: SponsorPacket): Promise<Blob> {
      const pdf = new jsPDF();

      // Title page
      pdf.setFontSize(18);
      pdf.text(packet.title, 20, 30);
      pdf.setFontSize(12);
      pdf.text(`From: ${packet.sponseeName}`, 20, 50);
      pdf.text(`Generated: ${packet.generatedAt}`, 20, 60);

      if (packet.watermark) {
        addConfidentialWatermark(pdf, packet.watermark);
      }

      // Content sections
      let pageNumber = 2;
      for (const section of packet.sections) {
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.text(section.title, 20, 30);
        pdf.setFontSize(10);
        pdf.text(`Date range: ${section.dateRange.start} - ${section.dateRange.end}`, 20, 40);
        pdf.text(`Shared on: ${section.sharedOn}`, 20, 45);

        // Content
        pdf.setFontSize(12);
        const contentLines = pdf.splitTextToSize(section.content, 180);
        pdf.text(contentLines, 20, 60);
      }

      return Promise.resolve(pdf.output('blob'));
    }

### Native Sharing Integration Path

**PWA (Web Share API):**

TypeScript

Copy async function sharePDF(pdfBlob: Blob, filename: string): Promise<void> {
if (navigator.share && navigator.canShare) { const file = new File([pdfBlob],
filename, { type: 'application/pdf' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My Recovery Work',
            text: 'Recovery journal export'
          });
        }
      } else {
        // Fallback: download
        downloadFile(pdfBlob, filename);
      }
    }

**Native (Capacitor/Expo):**

- Use native share sheet

- Integrate with system email/messaging

- Handle large files via system file providers

## F) ANALYTICS PLAN (PRIVACY-FORWARD)

### Recommended Tooling: Firebase Analytics + Custom Events

**Why Firebase Analytics:**

- Already integrated with Firebase stack

- Privacy-forward by default (no personal data)

- Free tier sufficient for our needs

- GDPR compliant with proper configuration

### Event Taxonomy (Action-Based Only)

Table

Copy

| Event Name              | Properties                           | Description                      |
| ----------------------- | ------------------------------------ | -------------------------------- |
| `journal_entry_created` | `type`, `word_count`, `has_location` | New journal entry created        |
| `step_work_started`     | `step_number`, `type`                | User begins step work            |
| `step_work_completed`   | `step_number`, `word_count`          | User finishes step work          |
| `sync_failed`           | `error_type`, `retry_count`          | Sync operation failed            |
| `sync_recovered`        | `queue_depth`, `time_to_recover`     | Sync recovered after failure     |
| `queue_depth`           | `depth`, `oldest_item_age`           | Queue depth metric (periodic)    |
| `export_pdf`            | `type`, `page_count`, `word_count`   | PDF export generated             |
| `export_shared`         | `type`, `share_method`               | Export shared via system         |
| `sponsor_link_created`  | `relationship_type`                  | Sponsor relationship established |
| `sponsor_link_revoked`  | `duration_days`                      | Sponsor access revoked           |
| `vault_enabled`         | `recovery_method`                    | Encryption vault enabled         |
| `offline_mode_used`     | `duration_hours`                     | User worked offline              |
| `conflict_resolution`   | `strategy`, `type`                   | Conflict resolved by user        |

### Implementation Code

TypeScript

Copy // Analytics service wrapper class PrivacyAnalytics { private analytics:
FirebaseAnalytics;

      constructor() {
        this.analytics = getAnalytics(app);
      }

      // Journal entry created
      trackJournalEntry(type: string, content: string): void {
        logEvent(this.analytics, 'journal_entry_created', {
          type,
          word_count: content.split(' ').length,
          has_location: false, // Never store actual location
          has_encryption: content.includes('[ENCRYPTED]')
        });
      }

      // Sync events
      trackSyncFailed(error: string, retryCount: number): void {
        logEvent(this.analytics, 'sync_failed', {
          error_type: this.sanitizeError(error),
          retry_count: retryCount
        });
      }

      // Export events
      trackExport(type: string, pageCount: number, wordCount: number): void {
        logEvent(this.analytics, 'export_pdf', {
          type,
          page_count: pageCount,
          word_count: wordCount
        });
      }

      // Sanitize error messages to remove PII
      private sanitizeError(error: string): string {
        return error
          .replace(/\/users\/[^\/]+\//g, '/users/[UID]/')
          .replace(/Error: .*/, 'Error: [REDACTED]');
      }
    }

### Opt-in/Opt-out UX

TypeScript

Copy function AnalyticsConsent() { const [consent, setConsent] =
useState<'pending' | 'granted' | 'denied'>('pending');

      if (consent === 'pending') {
        return (
          <div className="analytics-consent">
            <h3>Help Improve SoNash</h3>
            <p>
              We'd like to collect anonymous usage data to improve the app.
              This includes feature usage, performance metrics, and error reports.
              No personal content or identifying information is collected.
            </p>
            <div className="consent-buttons">
              <button onClick={() => setConsent('granted')}>
                Allow Analytics
              </button>
              <button onClick={() => setConsent('denied')}>
                Decline
              </button>
            </div>
            <small>You can change this anytime in Settings > Privacy</small>
          </div>
        );
      }

      return null;
    }

### Data Retention Policy

- Analytics events: 14 months (Firebase default)

- Error logs: 90 days

- Sync metadata: 30 days

- All data anonymized (no IP addresses, no user IDs)

## G) TECH DEBT / QUALITY GATES

### Incremental Adoption Plan

**Phase 1: Foundation (Weeks 1-2)**

- Set up IndexedDB with Dexie

- Implement basic offline queue

- Add sync status UI

- **Quality Gates**: Unit tests for queue operations, no SonarCloud regressions

**Phase 2: Sync Engine (Weeks 3-4)**

- Implement conflict detection

- Add background sync worker

- Basic conflict resolution UI

- **Quality Gates**: Integration tests with Firebase emulator, performance
  benchmarks

**Phase 3: Encryption (Weeks 5-6)**

- Add vault encryption service

- Implement recovery key flow

- Encrypt sensitive step work

- **Quality Gates**: Security audit, recovery testing, accessibility review

**Phase 4: Advanced Features (Weeks 7-8)**

- PDF generation

- Sponsor sharing

- Analytics integration

- **Quality Gates**: End-to-end tests, privacy audit, user acceptance testing

### Testing Strategy

TypeScript

Copy // Unit test example for offline queue describe('useOfflineQueue', () => {
it('should queue operation when offline', async () => { // Mock offline state
mockNetworkStatus(false);

        const { queueOperation } = renderHook(() => useOfflineQueue());

        await queueOperation({
          type: 'create',
          collection: 'journal',
          data: { content: 'Test entry' }
        });

        const queuedItems = await db.offlineQueue.toArray();
        expect(queuedItems).toHaveLength(1);
        expect(queuedItems[0].status).toBe('pending');
      });

      it('should auto-merge identical content', async () => {
        const local = { content: 'Hello world', mood: 5 };
        const remote = { content: 'Hello world', mood: 5 };

        const result = detectConflict(local, remote);
        expect(result.type).toBe('none');
      });
    });

### Feature Flags Implementation

TypeScript

Copy // Feature flag service class FeatureFlags { private flags: Record<string,
boolean> = { 'offlineQueue': false, 'encryptionVault': false, 'sponsorSharing':
false, 'localPDF': false };

      async initialize(): Promise<void> {
        // Check remote config or use local defaults
        const config = await remoteConfig.fetch();

        this.flags.offlineQueue = config.getBoolean('offline_queue_enabled');
        this.flags.encryptionVault = config.getBoolean('encryption_vault_enabled');
        // etc.
      }

      isEnabled(flag: string): boolean {
        return this.flags[flag] || false;
      }
    }

    // Usage in components
    function JournalEntry() {
      const flags = useFeatureFlags();

      if (!flags.isEnabled('offlineQueue')) {
        return <LegacyJournalEntry />;
      }

      return <OfflineJournalEntry />;
    }

### SonarCloud Quality Gates

yaml

Copy # .github/workflows/quality-gates.yml name: Quality Gates

    on: [push, pull_request]

    jobs:
      quality-check:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v2

          - name: Run SonarCloud analysis
            uses: sonarcloud/github-action@master
            env:
              GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
              SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

          - name: Check quality gate
            run: |
              # Fail if new critical issues introduced          if [ ${{ steps.sonarcloud.outputs.quality-gate-status }} == 'ERROR' ]; then            echo "Quality gate failed - new critical issues detected"            exit 1          fi

## H) FUTURE NATIVE PATH RECOMMENDATION

### Recommended Approach: Expo React Native

**Why Expo over Capacitor:**

- Better offline-first support (SQLite, secure storage)

- Superior biometric integration

- More predictable performance

- Better debugging tools

- Easier native module integration

**Migration Strategy: "Shared Core, Native Shell"**

Copy Shared Business Logic (80%) ├── hooks/useOfflineQueue.ts ├──
lib/encryptionService.ts ├── lib/syncEngine.ts └── utils/conflictResolution.ts

    Platform-Specific (20%)
    ├── Storage: IndexedDB → SQLite
    ├── Sharing: Web Share API → Native Share Sheet
    ├── Biometrics: WebAuthn → TouchID/FaceID
    └── PDF: jsPDF → Native PDFKit

### Implementation Path

**Phase 1: Core Extraction (Weeks 1-3)**

- Extract business logic to platform-agnostic modules

- Create React Native compatible components

- Set up shared TypeScript configuration

**Phase 2: Native Shell (Weeks 4-6)**

- Create Expo app with same routing structure

- Implement platform-specific storage layer

- Add biometric authentication

**Phase 3: Feature Parity (Weeks 7-10)**

- Port all features to native

- Ensure data format compatibility

- Test cross-platform sync

### Code Example: Platform Abstraction

TypeScript

Copy // Shared interface interface IStorage { getItem(key: string):
Promise<string | null>; setItem(key: string, value: string): Promise<void>;
removeItem(key: string): Promise<void>; clear(): Promise<void>; }

    // Web implementation
    class IndexedDBStorage implements IStorage {
      async getItem(key: string): Promise<string | null> {
        return await db.keyValue.get(key);
      }

      async setItem(key: string, value: string): Promise<void> {
        await db.keyValue.put({ key, value });
      }
    }

    // Native implementation
    class SQLiteStorage implements IStorage {
      async getItem(key: string): Promise<string | null> {
        const result = await db.execAsync(
          'SELECT value FROM key_value WHERE key = ?',
          [key]
        );
        return result.rows[0]?.value || null;
      }

      async setItem(key: string, value: string): Promise<void> {
        await db.execAsync(
          'INSERT OR REPLACE INTO key_value (key, value) VALUES (?, ?)',
          [key, value]
        );
      }
    }

### Biometric Integration

TypeScript

Copy // Shared biometric interface interface IBiometrics { isAvailable():
Promise<boolean>; authenticate(reason: string): Promise<boolean>; storeKey(key:
string): Promise<void>; retrieveKey(): Promise<string | null>; }

    // Native implementation (Expo)
    class ExpoBiometrics implements IBiometrics {
      async authenticate(reason: string): Promise<boolean> {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: reason,
          fallbackLabel: 'Use passcode',
          disableDeviceFallback: false
        });
        return result.success;
      }

      async storeKey(key: string): Promise<void> {
        await SecureStore.setItemAsync('encryption_key', key, {
          requireAuthentication: true
        });
      }
    }

## I) "WHAT I'M MISSING" - Technical Risks & Decisions

### 1. **IndexedDB Reliability on Mobile**

**Risk**: iOS Safari clears IndexedDB in low storage scenarios **Default**:
Implement aggressive backup to cloud + warn users about storage **Decision
Needed**: Define backup frequency and user communication strategy

### 2. **Encryption Key Rotation**

**Risk**: Long-term key exposure without rotation **Default**: Annual rotation
with user notification **Decision Needed**: Whether to implement automatic
rotation

### 3. **GDPR/Data Deletion Compliance**

**Risk**: User right to be forgotten vs. encrypted backups **Default**: Allow
account deletion, keep encrypted backups for 30 days **Decision Needed**: Legal
review of retention policies

### 4. **Sync Performance at Scale**

**Risk**: Queue performance degradation with 1000+ pending items **Default**:
Implement queue pagination + background processing **Decision Needed**:
Performance benchmarks and optimization triggers

### 5. **Sponsor Relationship Abuse**

**Risk**: Sponsors pressuring sponsees for access **Default**: No live access,
explicit sharing only, easy revocation **Decision Needed**: Whether to add
relationship counseling resources

### 6. **Export File Size Limits**

**Risk**: Large exports failing on mobile devices **Default**: Chunk exports
into 5MB pieces, compress where possible **Decision Needed**: Maximum export
size and user expectations

### 7. **Offline Map Data for Meetings**

**Risk**: Meeting finder requires online maps **Default**: Cache meeting list
offline, show addresses only when offline **Decision Needed**: Whether to bundle
offline map tiles

### 8. **Biometric Fallback Strategy**

**Risk**: Biometric sensor failure locking users out **Default**: Always allow
passcode fallback, recovery key option **Decision Needed**: Whether to require
passcode setup with biometrics

### 9. **Cross-Platform Data Migration**

**Risk**: Users switching between web and native apps **Default**: Cloud sync
handles migration automatically **Decision Needed**: Whether to provide manual
export/import tools

### 10. **Crisis Resource Integration**

**Risk**: Offline users unable to access crisis resources **Default**: Bundle
essential crisis resources offline **Decision Needed**: Which resources to
include and update frequency

---

## Summary Recommendations

1. **Start with IndexedDB + Firebase sync** - proven, reliable, good PWA support

2. **Implement vault encryption early** - builds user trust, differentiates
   product

3. **Use Expo for native path** - best offline support, shared codebase

4. **Focus on sponsor sharing UX** - explicit controls build trust

5. **Keep analytics minimal** - privacy-first approach aligns with recovery
   values

6. **Plan for incremental rollout** - feature flags prevent quality regressions

The architecture proposed balances offline-first reliability with cloud sync
convenience, maintains privacy-sacred principles, and provides a clear path to
native apps without major rewrites.

## PERPLEXITY

A) SYSTEM ARCHITECTURE PROPOSAL (PWA now, Native later)  
(offline-first data layer, sync engine, queues)

**(1) Recommended choice**  
Use a “local-first core” in the browser: IndexedDB + an outbox queue + Firestore
as the cloud source of truth, with a thin sync engine and explicit status
surfaced in the notebook UI.​​

**(2) Why**

- IndexedDB can store structured objects and large volumes (hundreds of MB on
  most platforms), making it appropriate for heavy journaling and step work.​

- A dedicated outbox avoids coupling UX to Firestore’s built-in offline
  persistence, which is good but opaque and LWW-only; you need deterministic
  conflict policies and visible queue state for
  trust.​[](https://wild.codes/candidate-toolkit-question/how-do-you-design-offline-first-sync-conflict-resolution-on-firebase)​

**(3) Tradeoffs**

- IndexedDB is less reliable on iOS PWAs (quota ~50 MB cache, aggressive
  eviction, IndexedDB bugs), so you must treat offline as “best-effort” on iOS
  and message that clearly.​

- Maintaining your own sync engine adds complexity (queue, conflict resolver,
  retries) but gives you the control you need for sensitive, user-controlled
  recovery
  data.[](https://wild.codes/candidate-toolkit-question/how-do-you-design-offline-first-sync-conflict-resolution-on-firebase)​​

**(4) Implementation notes**

**Architecture sketch (PWA)**

text
`┌─────────────────────────────┐              │   React / Next.js UI        │              │  (journal, step4, exports)  │              └─────────────┬───────────────┘                            │             Reads          │      Writes (intent)                            ▼                 ┌────────────────────┐                 │   Data Layer       │                 │                    │                 │  - localStore      │                 │    (IndexedDB)     │                 │  - outbox queue    │                 │  - sync engine     │                 └─────────┬──────────┘                           │                 Online    │       Offline                           ▼                 ┌─────────────────────┐                 │   Firestore         │                 │ (Auth + Rules)      │                 └─────────────────────┘`

- **Data layer (client)**
  - `localStore`: IndexedDB wrapper with typed stores
    (`journalEntries`, `stepPackets`, `sponsorShares`, `outbox`, `syncLog`).
  - `syncEngine`: monitors network + auth; flushes `outbox` to Firestore with
    retry/backoff and conflict detection.
  - `statusBus`: in-memory store (e.g., Zustand or simple context) that exposes
    per-item sync state for UI badges.​

- **Write pipeline**
  1. User action → create “intent” mutation
     (`operationId`, `docId`, `type`, `payload`, `baseVersion`).
  2. Immediately apply optimistic update to IndexedDB + in-memory store, mark
     status `pending`.
  3. Outbox worker attempts upload when `navigator.onLine && userAuthReady`.
  4. On success → update local doc `version`, mark `synced`. On conflict → run
     resolver (see
     C).​[](https://wild.codes/candidate-toolkit-question/how-do-you-design-offline-first-sync-conflict-resolution-on-firebase)​

- **Read pipeline**
  - Default reads hit IndexedDB; Firestore is used as a background “hydration”
    source, streaming changes into localStore when online.
  - For newly signed-in users or re-installs, run a one-time “warm sync”: pull
    recent docs from Firestore, merge into local.​

- **Background sync & retries**
  - Use a dedicated `syncWorker` (custom hook + possibly Background Sync API
    when supported) that:
    - Flushes outbox in small batches (e.g., 10 ops) with exponential backoff.
    - Marks items `failed` after N attempts and exposes them to the “Sync &
      Storage” screen for user actions (retry /
      discard).[](https://dev.to/tianyaschool/pwa-offline-storage-strategies-indexeddb-and-cache-api-3570)​​

- **Queue visibility UX**
  - Global indicator in notebook chrome: e.g., “All changes synced”, “3 items
    pending”, “1 failed”.
  - Per-entry pill: `pending`, `synced`, `conflict`.
  - “Sync & Storage” screen exposing: local size estimate, last sync time, queue
    depth, and a “Retry all” button.​

- **iOS PWA constraints & mitigation**
  - iOS may evict PWA storage (Cache + IndexedDB) if unused for ~7–30 days;
    quota is low and behavior inconsistent.​
  - Mitigations:
    - Encourage “install to Home Screen” and regular use; clearly message risk
      in “Sync & Storage” on iOS.
    - Keep assets cache small; prioritize data in IndexedDB vs Cache API.
    - Provide explicit “Export encrypted backup” so users can backup locally
      (e.g., to Files) before OS
      wipes.[](https://vinova.sg/navigating-safari-ios-pwa-limitations/)​​

- **Native later**
  - Same conceptual model: replace IndexedDB with SQLite/EncryptedStore and keep
    Firestore + outbox pattern; see H.​

B) DATA MODEL + FIRESTORE RULES DIRECTION

**(1) Recommended choice**  
Model user data as mostly user-scoped collections with “share artifacts” for
sponsors; avoid direct sponsor read of primary journals. Use minimal PII on user
documents.​

**(2) Why**

- User-scoped collections align with current rules (“all data user-scoped by
  uid”) and keep row-level isolation simple.​

- A separate “share” layer lets you define exactly what a sponsor sees, with
  revocation and audit-friendly metadata.​

**(3) Tradeoffs**

- Slight duplication for derived views (e.g., summary packets) but far simpler
  than complex row-level sharing inside core docs.

- More collections mean more indices and some higher read costs, but volume is
  likely modest versus trust benefits.​

**(4) Implementation notes**

**Collections (high level)**

- `users/{uid}`
  - Fields: `nickname`, `createdAt`, `stageOfRecovery`, `hasSponsor`, `quickActionsPreferences`,
    minimal contact info.​
  - No email/phone unless absolutely needed; rely on Firebase Auth for email.

- `users/{uid}/journalEntries/{entryId}`
  - For all “timeline” items: moods, nightly review, notes; field `entryType` to
    distinguish.​
  - Peer to `inventoryEntries` if you decide to separate Step 4 (but start with
    a single journal collection + `category` for simplicity).

- `users/{uid}/stepPackets/{packetId}`
  - Structured Step 4 (and later 8–9) worksheets with sections
    (`resentments`, `fears`, etc.) stored as arrays/objects,
    plus `version`, `updatedAt`, `sensitive: true`.

- `users/{uid}/sponsorProfiles/{sponsorId}`
  - Sponsee’s view of sponsor contact info, preferences; not visible to sponsor
    directly (informational only).

- `users/{uid}/exports/{exportId}`
  - Metadata only: `type` (pdf, text), `createdAt`, `scope` (packet, date
    range), `sizeBytes`, `destination` (local, share sheet). No content.​

- `users/{uid}/syncEvents/{eventId}`
  - Non-sensitive sync
    telemetry: `type` (`sync_success`, `sync_failed`, `conflict`), `queueDepth`,
    timestamps.​

- `sponsorLinks/{linkId}`
  - Represents a sponsee↔sponsor relationship and explicit share scope.
  - Fields: `sponseeUid`, `sponsorUid`, `status` (`active`, `revoked`), `scopes` (e.g., `["step4_summary", "nightly_review_summary"]`), `createdAt`, `revokedAt`.

- `sponsorShares/{shareId}`
  - Concrete artifacts created at export/share time.
  - Fields: `sponseeUid`, `sponsorUid`, `linkId`, `type` (`step4_packet`, `summary_pdf`, `note`), `dataRef` (Firestore
    path or blob id), `createdAt`, `expiresAt`, `revoked` flag.

**Rules direction (pseudo)**

- **User-scoped collections**

js

`match /users/{uid} {   allow read, write: if request.auth.uid == uid && appCheckValid();     match /journalEntries/{entryId} {    allow read, write: if request.auth.uid == uid && appCheckValid();  }   match /stepPackets/{packetId} {    allow read, write: if request.auth.uid == uid && appCheckValid();  }   match /exports/{exportId} {    allow read, write: if request.auth.uid == uid && appCheckValid();  }   match /syncEvents/{eventId} {    allow read, write: if request.auth.uid == uid && appCheckValid();  } }`

- **Sponsor relationships**

js

`match /sponsorLinks/{linkId} {   allow read: if request.auth.uid in [resource.data.sponseeUid, resource.data.sponsorUid] && appCheckValid();  allow create: if request.auth.uid == request.resource.data.sponseeUid && appCheckValid();  allow update: if request.auth.uid == resource.data.sponseeUid && appCheckValid();  allow delete: if request.auth.uid == resource.data.sponseeUid && appCheckValid(); }`

- **Sponsor shares**

js

`match /sponsorShares/{shareId} {   allow read: if appCheckValid() &&    (request.auth.uid == resource.data.sponseeUid ||     (request.auth.uid == resource.data.sponsorUid && resource.data.revoked == false));  allow create, update, delete: if request.auth.uid == request.resource.data.sponseeUid && appCheckValid(); }`

- **Security posture**
  - Require App Check + auth on all user data reads/writes (re-enable App Check
    once prerequisites done).​
  - No direct queries from sponsor into `users/{sponseeUid}/journalEntries`;
    sponsor only reads `sponsorShares` that reference derived or filtered data.
  - Revocation: set `revoked: true` and optionally delete referenced artifact;
    sponsor dashboard hides revoked shares by default.​
  - PII minimization: keep recovery content and sponsor contact separate from
    identities used for auth and analytics.​

C) OFFLINE QUEUE + CONFLICT RESOLUTION SPEC

**(1) Recommended choice**  
Use “atomic document with versioning + intent-based ops” rather than pure event
sourcing, with a per-doc conflict strategy: auto-append when one side is strict
prefix, otherwise user-assisted
merge.[](https://wild.codes/candidate-toolkit-question/how-do-you-design-offline-first-sync-conflict-resolution-on-firebase)​

**(2) Why**

- Step work and journal entries are document-like objects that users think of as
  a page, not a stream of low-level ops.

- Versioned atomic docs with a small, typed outbox are easier to reason about
  and test in your current codebase.​

**(3) Tradeoffs**

- You lose some fine-grained CRDT-style merges but gain simplicity and
  maintainable UI.

- Some rare conflicts will require user intervention; acceptable given the data
  sensitivity and need for
  explicitness.[](https://wild.codes/candidate-toolkit-question/how-do-you-design-offline-first-sync-conflict-resolution-on-firebase)​

**(4) Implementation notes**

**Queue item format**

ts

`type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'; interface OutboxItem {   id: string;                 // uuid  docId: string;              // journal/stepPacket id  collection: 'journal' | 'stepPackets';  opType: 'create' | 'update' | 'delete';  payload: any;               // full doc or partial update  baseVersion?: number;       // version observed when editing  createdAt: number;          // client timestamp  retries: number;  status: SyncStatus;  lastError?: string; }`

**Conflict detection**

- Each doc has `version` and `updatedAt`.

- When flushing an outbox item:
  - Fetch remote doc; compare `remote.version` vs `baseVersion`.
  - If no remote doc and opType `create` → simple create.
  - If `remote.version === baseVersion` → safe update.
  - If `remote.version > baseVersion` → potential
    conflict.[](https://wild.codes/candidate-toolkit-question/how-do-you-design-offline-first-sync-conflict-resolution-on-firebase)​

**“Same or same+additional” detection**

For text fields (e.g., `body`):

ts

`function classifyTextConflict(local: string, remote: string) {   if (local === remote) return 'identical';   if (local.startsWith(remote)) return 'local_extends_remote';  if (remote.startsWith(local)) return 'remote_extends_local';   return 'diverged'; }`

- If `identical` → mark `synced`.

- If `local_extends_remote` → auto-merge: keep `local` as authoritative; send
  full doc with incremented `version`.

- If `remote_extends_local` → update local doc from remote; mark outbox
  item `synced`.

- If `diverged` → mark `conflict` and surface in UI.

For structured Step 4 packets, run per-field comparison where possible (e.g.,
arrays of resentments by id; “append-only” lists get union semantics).

**Merge UX**

- Show “Conflict detected” banner on the entry or packet, with three choices:
  - “Keep my version” (apply local over remote, bump `version`).
  - “Keep cloud version” (overwrite local from Firestore, clear outbox item).
  - “Keep both (duplicate)” (create a new entry with suffix “(copy)” and store
    both).

- For complex packets, present side-by-side diff at section level; default to
  “Keep my version” but make it explicit tap.

**Code skeletons**

`useOfflineQueue()` hook:

ts

`type QueueFilter = { status?: SyncStatus; collection?: string }; export function useOfflineQueue(filter?: QueueFilter) {   const [items, setItems] = useState<OutboxItem[]>([]);  const [isSyncing, setIsSyncing] = useState(false);   useEffect(() => {    // subscribe to IndexedDB outbox store    const unsubscribe = outboxStore.subscribe(filter, setItems);    return unsubscribe;  }, [filter]);   const enqueue = useCallback(async (item: Omit<OutboxItem, 'id' | 'status' | 'retries'>) => {    const newItem: OutboxItem = {      ...item,      id: crypto.randomUUID(),      status: 'pending',      retries: 0,    };    await outboxStore.put(newItem);    return newItem.id;  }, []);   const markItem = useCallback(async (id: string, patch: Partial<OutboxItem>) => {    await outboxStore.update(id, patch);  }, []);   return { items, isSyncing, setIsSyncing, enqueue, markItem }; }`

Conflict resolver:

ts

`interface ConflictResolutionInput {   localDoc: any;  remoteDoc: any;  outboxItem: OutboxItem; } interface ConflictResolutionResult {   resolvedDoc?: any;  resolution: 'keep_local' | 'keep_remote' | 'duplicate' | 'manual_required'; } export function resolveConflict(input: ConflictResolutionInput): ConflictResolutionResult {   const { localDoc, remoteDoc } = input;   // Simple case: text body  const localBody = localDoc.body ?? '';  const remoteBody = remoteDoc.body ?? '';   const classification = classifyTextConflict(localBody, remoteBody);   if (classification === 'identical') {    return { resolution: 'keep_remote' };  }   if (classification === 'local_extends_remote') {    return {      resolution: 'keep_local',      resolvedDoc: {        ...localDoc,        version: (remoteDoc.version ?? 0) + 1,      },    };  }   if (classification === 'remote_extends_local') {    return { resolution: 'keep_remote', resolvedDoc: remoteDoc };  }   return { resolution: 'manual_required' }; }`

Sync worker (simplified):

ts

`export async function runSyncCycle(userId: string) {   const pendingItems = await outboxStore.list({ status: 'pending' });   for (const item of pendingItems) {    try {      await outboxStore.update(item.id, { status: 'syncing' });       const remoteDoc = await firestoreService.getDoc(item.collection, userId, item.docId);       const result = await applyOutboxItemWithConflict(item, remoteDoc, userId);       if (result.status === 'ok') {        await outboxStore.update(item.id, { status: 'synced' });      } else if (result.status === 'conflict') {        await outboxStore.update(item.id, { status: 'conflict', lastError: result.reason });      }    } catch (err: any) {      const retries = item.retries + 1;      await outboxStore.update(item.id, {        status: retries >= 5 ? 'failed' : 'pending',        retries,        lastError: err?.message ?? 'Unknown error',      });    }  } }`

D) ENCRYPTION & PASSCODE SYSTEM (WITH RECOVERY)

**(1) Recommended choice**  
Phase 1: app-level passcode gate + category-based encrypted vault in IndexedDB
for especially sensitive docs; Phase 2: extend vault coverage and add optional
encrypted cloud backup with user-held recovery key.​

**(2) Why**

- Many users need extra protection for Step 4/8–9 but full end-to-end encryption
  for everything would complicate sync, analytics, and recovery.

- A vault model lets you encrypt content fields while leaving some metadata
  (timestamps, types) usable for sync and action-based analytics.​

**(3) Tradeoffs**

- You must manage keys carefully; too strict (no recovery) = catastrophic
  lockout, too lax = weaker privacy.

- Some operations (full-text search, AI later) will not work on encrypted
  content without additional client-side work.

**(4) Implementation notes**

**Phase 1**

- **Passcode gate**
  - On first use of “Protected content” (e.g., Step 4 inventory), prompt user to
    create a 6–10 digit passcode.
  - Derive a key with PBKDF2/scrypt and store a verifier hash in
    IndexedDB/localStorage; keep the actual content-encryption key
    in `crypto.subtle`-encrypted form.

- **Vault data model**
  - For Step 4 docs:
    - Store `encryptedBody` (ciphertext), `nonce`, `encryptionVersion`, plus
      non-sensitive metadata (`createdAt`, `updatedAt`, `category`).
    - Local vault key decrypts body when passcode validated.

- **Recovery model (default)**
  - Generate a random 256-bit master key.
  - Wrap it with a key derived from the passcode (for local use) AND separately
    with a random “recovery key” shown to the user once as a 12-word phrase or
    encoded string.
  - Store the recovery-wrapped key in Firestore
    under `users/{uid}/keyEscrow/recoveryKeyWrapped` (encrypted blob), with
    strict rules (only user can read).
  - UX: “If you forget your passcode, you can restore using this recovery key;
    store it somewhere safe. This key is never sent to sponsors or third
    parties.”

Threat model in Phase 1 (baseline):

- Device stolen: attacker cannot open app vault without passcode or recovery
  key; OS-level biometrics and device encryption still help.

- Shared phone: passcode gate prevents casual snooping; optionally hide app
  name/icon per roadmap.​

- Sponsor misuse: sponsors never get vault keys or raw content through the app;
  only see explicit exports.​

- Accidental export leaks: PDF exports can be optionally passcode-protected (see
  E) and clearly labeled.

**Phase 2**

- Optionally:
  - Allow encrypted cloud backup of vault to Firestore: encrypted bundle of all
    protected docs plus key-wrapped with recovery key.
  - Device-bound keys (using platform keychain) in native apps later, while
    keeping recovery key path consistent.

**Safe default**

- Require passcode for vault; offer biometric unlock where available, but never
  as sole factor.

- Show clear, repeated explanation:
  - “If you lose both your passcode and recovery key, SoNash cannot recover
    encrypted entries.”
  - Provide easy export of recovery key to password manager / printed sheet.

E) EXPORTS / PDF GENERATION / METADATA HYGIENE

**(1) Recommended choice**  
Generate PDFs client-side (e.g., via a browser PDF generator or `pdf-lib`–style
library) using in-memory data only; strip metadata and never upload the
generated file to Firestore by
default.[](https://dev.to/tianyaschool/pwa-offline-storage-strategies-indexeddb-and-cache-api-3570)​​

**(2) Why**

- Client-side PDF avoids sending sensitive inventory text to third-party
  services; no need for a server renderer for this use case.

- A local-generation baseline works both for PWA and later native, where you can
  map the same packet structure into native PDF APIs.

**(3) Tradeoffs**

- Heavy PDFs (many pages, images) may be slow to generate on low-end devices.

- Accessibility and pagination layout require care; you must design for simple
  text-first layouts.

**(4) Implementation notes**

- **PDF generation** (web)
  - Use a lightweight client-side library that lets you feed text and basic
    layout.
  - Build a “Sponsor Packet” view as a React component, then render data into a
    PDF template, not by rasterizing the DOM; avoid canvas-based prints that
    might leak styling-specific metadata.

- **Metadata hygiene**
  - Do not embed GPS, EXIF, or custom metadata; keep only the content plus
    minimal header/footer (e.g., app name, date).
  - Ensure the PDF library does not add author/creator metadata; if it does, set
    them to neutral values or blank.

- **Sponsor packet format**
  - Sections:
    - Header (user-chosen nickname only, never real name mandatory).
    - Optional statement: “This packet contains sensitive recovery work; do not
      redistribute without consent.”
    - Per-entry sections summarizing Step 4 or nightly review, only including
      fields user selected.

  - Options in UI:
    - Include/exclude “causes”, “effects”, “my part” columns.
    - An optional **watermark** string like “For sponsor review only” toggled by
      user.

- **Native sharing path**
  - PWA: use Web Share API when available to share PDF blob or text; fallback:
    download link and “open in…”
    instructions.[](https://dev.to/tianyaschool/pwa-offline-storage-strategies-indexeddb-and-cache-api-3570)​
  - Native: generate PDF with the same JSON structure; use platform share sheets
    (iOS `UIActivityViewController`, Android `Intent`).

- **Tokenized links (later)**
  - If needed, create temporary download URLs from Storage secured by tokens,
    but still make “export to device + OS share” the first-class path.​

F) ANALYTICS PLAN (PRIVACY-FORWARD)

**(1) Recommended choice**  
Use Firebase Analytics with a strict client-side event schema that never
includes content; optionally add PostHog or similar later for richer product
analytics, keeping volume modest and documented.​

**(2) Why**

- Firebase Analytics is already integrated in the stack and can capture action
  events with low overhead.​

- Your roadmap already mentions PostHog as an evaluated option; starting with
  Firebase only keeps cognitive load lower while honoring privacy.​

**(3) Tradeoffs**

- Firebase Analytics has limited querying compared to dedicated tools, but
  sufficient for action counts and funnels.

- PostHog or similar adds complexity and risk of over-collection; must be
  carefully configured and clearly disclosed.​

**(4) Implementation notes**

- **Principles**
  - Only log events about actions, never content: no text snippets, no Step
    details.
  - Hash or generalize anything that could be identifying (e.g., sizes, counts).
  - Make analytics opt-in where possible, with a simple toggle in Settings that
    clearly states what is collected.​

- **Retention**
  - Default: keep raw analytics for 6–12 months; aggregate for longer-term
    trends if needed.
  - Document retention policy in privacy screen and ROADMAP/SECURITY docs.​

**Event taxonomy (example)**

| Event name              | Description                             | Properties (non-sensitive)                       |
| ----------------------- | --------------------------------------- | ------------------------------------------------ |
| `journal_entry_created` | User creates any journal entry          | `entryType`, `hasStep4Flags`, `wordCountBucket`  |
| `journal_entry_edited`  | User edits existing entry               | `entryType`, `editLatencyBucket`                 |
| `step_packet_created`   | New Step packet created                 | `stepNumber`, `packetTemplateId`                 |
| `step_packet_completed` | User marks packet as complete           | `stepNumber`, `durationDaysBucket`               |
| `sync_started`          | Sync loop begins                        | `queueDepth`, `isOnline`                         |
| `sync_completed`        | Sync loop completes successfully        | `queueDepth`, `durationMsBucket`                 |
| `sync_failed`           | Sync loop hit errors                    | `queueDepth`, `errorType`                        |
| `conflict_detected`     | Conflict flagged on document            | `collection`, `resolutionType` (when resolved)   |
| `export_pdf`            | User generated a PDF export             | `scope` (step4, nightlyRange), `pageCountBucket` |
| `export_share_started`  | User tapped share button                | `scope`, `shareChannel` (email, sms, other)      |
| `sponsor_link_created`  | Sponsee links a sponsor                 | `hasExistingSponsor`, `scopesCount`              |
| `sponsor_link_revoked`  | Sponsee revokes sponsor link            | `scopesCount`, `durationDaysBucket`              |
| `vault_enabled`         | User enabled encryption vault           | `categories` (step4Only, step4PlusAmends, all)   |
| `vault_locked`          | Vault locked due to timeout/manual lock | `autoLock` (true/false)                          |
| `vault_unlock_failed`   | Failed passcode attempt                 | `attemptCountBucket` (never log passcode)        |

G) TECH DEBT / QUALITY GATES

**(1) Recommended choice**  
Introduce offline queue + sync as a well-contained feature module and ship
behind feature flags, aligning with existing CI, SonarCloud, and audit
processes.​

**(2) Why**

- Your roadmap already has “EFF-010 Implement Offline Queue” marked critical;
  building a dedicated module matches that and keeps blast radius small.​

- Existing tooling (tests, pattern checks, CI) is strong; piggyback on it rather
  than introducing new infra.​

**(3) Tradeoffs**

- Slight duplication of local data handling logic (IndexedDB vs
  Firestore-service) until refactor, but manageable.

- Feature flags can add branching; ensure they are removed once stable.

**(4) Implementation notes**

- **Incremental adoption plan**
  1. Implement `localStore` (IndexedDB wrapper) and `outboxStore`, with unit
     tests and emulator tests focusing on data safety.​
  2. Add `useOfflineQueue` and `syncWorker`; behind a dev feature flag (env or
     Firestore-config flag).
  3. Wire journal writes to queue while leaving some less-critical paths (e.g.,
     growth tools) online-only until stable.​

- **Testing**
  - Unit tests for queue operations, conflict detection, and merge; reuse
    existing test harness patterns.​
  - Emulator tests simulating offline/online transitions as a dedicated suite
    (fulfilling EFF-011).​

- **SonarCloud / quality gates**
  - Keep sync engine small and split:
    - `offline-queue.ts` (pure data)
    - `sync-worker.ts` (side-effects)
    - `conflict-resolver.ts` (pure logic).

  - Add tests for complex branches to keep cognitive complexity in check.​

- **Rollout**
  - Feature flag path: `users/{uid}/featureFlags/offlineQueueEnabled`.
  - Start with internal dogfooding + a small beta group;
    monitor `sync_failed`, `conflict_detected`, `queue_depth` analytics.​

H) FUTURE NATIVE PATH RECOMMENDATION

**(1) Recommended choice**  
Go with Expo/React Native as the primary native path, with a shared “local-first
core” module reused between web and native.​

**(2) Why**

- You already use React/TS; RN + Expo lets you reuse business logic and even
  some UI concepts.​

- Native RN apps can use secure storage (Keychain/Keystore), local encrypted DBs
  (WatermelonDB, SQLite-based) and OS-level biometrics reliably, which PWAs
  cannot on iOS
  today.[](https://vinova.sg/navigating-safari-ios-pwa-limitations/)​

**(3) Tradeoffs**

- Separate RN app means some duplication of UI and integration code vs. a pure
  web+wrapper approach (Capacitor).

- You’ll maintain two builds and deployment pipelines (web + stores).

**(4) Implementation notes**

- **Option 1 – Web + Capacitor wrapper**
  - Pros: minimal extra work; reuse PWA as-is, add push + some native APIs.
  - Cons: iOS PWA limitations still apply inside wrapper (WebView); offline
    storage and biometric support remain
    subpar.[](https://vinova.sg/navigating-safari-ios-pwa-limitations/)​

- **Option 2 – Expo/React Native (recommended)**
  - Shared modules:
    - `core-data` (TypeScript): outbox types, conflict resolution, sync
      protocols.
    - `core-models`: journal and step packet schemas, encryption helpers.

  - Platform-adapted parts:
    - Storage: IndexedDB (web) vs SQLite/AsyncStorage (native).
    - Encryption: WebCrypto vs native crypto + secure key storage.
    - Sharing: Web Share API vs native share sheet.

- **Option 3 – Different stack (e.g., Flutter)**
  - Pros: strong rendering, good offline;
  - Cons: heavy rewrite, no React reuse; not aligned with current stack.

Practical path:

- 2026: ship robust offline-first PWA with queue and vault.

- Parallel: extract shared logic into a library, target RN integration in a
  later milestone (M3/M4) once PWA stable.​

I) “WHAT I’M MISSING” (non-blocking questions + defaults)

**1. How big can a single Step 4 packet be?**

- Default: cap per-doc size to ~100–200 KB of text and encourage multiple
  packets for very large inventories to keep sync fast and conflicts manageable.

**2. Do you want per-device vs per-account vault keys?**

- Default: account-level vault key with device-bound cached key; easier to move
  between devices while still using OS security.

**3. How aggressive should auto-lock be?**

- Default: lock vault after 10 minutes of inactivity or app backgrounding;
  configurable in settings with clear warning that longer times reduce privacy.

**4. Should sponsor see real-time progress or only snapshots?**

- Default: snapshots only (exports/shares) to avoid surveillance feel; later
  consider opt-in aggregate progress indicators (e.g., “completed X items”).​

**5. Are anonymous users allowed to use the encrypted vault?**

- Default: yes, but strongly encourage setting a recovery key, since no
  email-based recovery is possible.

**6. Do you want device-level backups (iCloud/Google Drive) integrated?**

- Default: provide manual encrypted backup export that users can store anywhere;
  postpone native cloud integrations until later.

**7. How strict should analytics opt-in be?**

- Default: analytics on with minimal collection, but prominent toggle +
  onboarding explanation; no analytics inside vault flows.

**8. How much of the app should be “offline-everything”?**

- Default: make all personal content tools (journal, Step work, nightly review)
  available offline; treat heavy external data (meeting directory, maps, speaker
  recordings) as online-first with graceful fallbacks.​

**9. Should you allow sponsor messaging inside SoNash?**

- Default: not initially; use exports + OS-level channels (email/SMS) until you
  have a clear moderation and abuse model.

**10. What’s the policy for deleted content recovery?**

- Default: soft-delete with local undo window and optional server-side "trash"
  with 30-day retention (non-encrypted metadata only; encrypted content subject
  to vault policies).

---

## Version History

| Version | Date       | Changes                                       |
| ------- | ---------- | --------------------------------------------- |
| 1.0     | 2026-01-20 | Initial multi-AI aggregated ideation document |
