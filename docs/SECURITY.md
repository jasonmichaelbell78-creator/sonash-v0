# Security & Privacy Guide

**Document Version:** 2.0
**Last Updated:** 2026-01-02
**Status:** ACTIVE

---

## 🎯 Purpose & Scope

This document outlines security measures, privacy protections, and data handling practices for the SoNash recovery app.

**Scope:**
- ✅ Data classification and handling
- ✅ Security layers and implementation
- ✅ Privacy rights and GDPR compliance
- ✅ Incident response procedures

**See also:**
- [SERVER_SIDE_SECURITY.md](./SERVER_SIDE_SECURITY.md) - Cloud Functions security patterns
- [GLOBAL_SECURITY_STANDARDS.md](./GLOBAL_SECURITY_STANDARDS.md) - Mandatory standards for all code

---

## Table of Contents

1. [Data Classification](#data-classification)
2. [Security Layers](#security-layers)
3. [Authentication](#authentication)
4. [Data Protection](#data-protection)
5. [User Privacy Rights](#user-privacy-rights)
6. [Security Checklist](#security-checklist)
7. [Incident Response](#incident-response)

---

## Data Classification

### Highly Sensitive (Red)
Data that could cause significant harm if exposed:
- **Inventory entries** (resentments, fears, harms, relationships)
- **Daily logs** (mood, substance use, cravings)
- **Spot checks** (emotional states, apology notes)

### Sensitive (Yellow)
Personal but less critical:
- **User profile** (nickname, clean date, preferences)
- **Gratitude lists**
- **Morning/night reviews**

### Non-Sensitive (Green)
- **Meeting schedules** (public data)
- **App preferences** (theme, text size)

---

## Security Layers

### Layer 1: Transport Security
- **TLS 1.3**: All Firebase connections use TLS encryption
- **Certificate pinning**: Handled by Firebase SDK
- **No HTTP**: All endpoints are HTTPS-only

### Layer 2: Authentication
- **Firebase Auth**: Manages user identity
- **Anonymous auth**: Default for privacy (see risks below)
- **Token refresh**: Automatic session management

### Layer 3: Authorization (Firestore Rules)
```
users/{uid}/                    → Owner-only access
  ├── daily_logs/{logId}        → Owner-only, date validated
  ├── inventoryEntries/{id}     → Owner-only, type validated
  └── inventoryLinks/{id}       → Owner-only, immutable
meetings/{id}                   → Authenticated read, no write
```

### Layer 4: Application Security
- **Input validation**: Zod schemas on client AND server (Cloud Functions)
- **Path validation**: `validateUserDocumentPath()` prevents traversal
- **User scope**: `assertUserScope()` enforces ownership
- **Rate limiting**: Server-side via Cloud Functions (10 req/min per user)
- **App Check**: reCAPTCHA Enterprise verification blocks bots

### Layer 5: Monitoring & Audit
- **Sentry**: Error monitoring for client and Cloud Functions
- **Audit logging**: Security events logged to GCP Cloud Logging
- **Event types**: AUTH_FAILURE, RATE_LIMIT_EXCEEDED, APP_CHECK_FAILURE, VALIDATION_FAILURE, AUTHORIZATION_FAILURE
- **Related docs**: [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)

### Layer 5: Data at Rest
- **Encryption**: Google encrypts all Firestore data at rest
- **Key management**: Managed by Google Cloud KMS
- **Backups**: Firestore automatic backups (7-day retention)

---

## Authentication

### Current: Anonymous Authentication

**How it works:**
1. User opens app → Firebase creates anonymous UID
2. UID stored in browser/device
3. All data associated with that UID

**Risks:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Device lost | Data orphaned forever | Account linking (planned) |
| Browser cleared | Data orphaned | Local backup warning |
| No password | Can't recover on new device | Email/OAuth linking (planned) |

### Planned: Account Linking (Priority: P0)

```typescript
// Future implementation
async function linkAnonymousAccount(email: string, password: string) {
  const credential = EmailAuthProvider.credential(email, password);
  await linkWithCredential(auth.currentUser, credential);
  // Anonymous data now accessible via email login
}
```

**Recommendation:** Implement account linking before storing significant user data.

---

## Data Protection

### What Firebase Provides Automatically
- ✅ TLS for all connections
- ✅ At-rest encryption (AES-256)
- ✅ Automatic key rotation
- ✅ SOC 2 / ISO 27001 compliance
- ✅ GDPR data processing agreement available

### What We Implement
- ✅ Owner-only Firestore rules
- ✅ Input validation (client + server)
- ✅ PII redaction in logs
- ✅ Document size limits
- ✅ Server-side rate limiting (Cloud Functions)
- ✅ Firebase App Check (reCAPTCHA Enterprise)
- ✅ Sentry error monitoring
- ✅ Security audit logging
- ❌ End-to-end encryption (not implemented)
- ❌ Client-side encryption (not implemented)

### Optional: Client-Side Encryption

For maximum privacy, consider encrypting sensitive fields before storage:

```typescript
// Example: Encrypt before save
import { encrypt, decrypt } from './crypto-utils';

async function saveEncryptedEntry(userId: string, entry: InventoryEntry) {
  const encryptedData = await encrypt(JSON.stringify(entry.data), userKey);
  await setDoc(docRef, { ...entry, data: encryptedData, encrypted: true });
}
```

**Trade-offs:**
- Pro: Even Firebase/Google can't read data
- Con: No server-side search
- Con: Key management complexity
- Con: Data unrecoverable if key lost

---

## User Privacy Rights

### Data Export (Planned)

Users must be able to export all their data:

```typescript
async function exportAllUserData(userId: string): Promise<UserDataExport> {
  const profile = await getUserProfile(userId);
  const dailyLogs = await getAllDailyLogs(userId);
  const inventories = await getAllInventoryEntries(userId);
  const links = await getAllInventoryLinks(userId);

  return {
    exportedAt: new Date().toISOString(),
    profile,
    dailyLogs,
    inventories,
    links,
  };
}
```

### Data Deletion (Planned)

Users must be able to delete all their data:

```typescript
async function deleteAllUserData(userId: string): Promise<void> {
  // Delete in order: links → entries → logs → profile
  await deleteCollection(`users/${userId}/inventoryLinks`);
  await deleteCollection(`users/${userId}/inventoryEntries`);
  await deleteCollection(`users/${userId}/daily_logs`);
  await deleteDoc(doc(db, 'users', userId));

  // Optionally: delete auth account
  await auth.currentUser?.delete();
}
```

### Data Portability

Export formats:
- **JSON**: Complete data export
- **PDF**: Human-readable per-entry export
- **Plain text**: For email/messaging

---

## Security Checklist

### Before Launch

- [ ] Deploy Firestore security rules to production
- [ ] Enable Firebase App Check
- [ ] Implement account linking (email/OAuth)
- [ ] Add data export functionality
- [ ] Add data deletion functionality
- [ ] Create privacy policy page
- [ ] Create terms of service page
- [ ] Set up error monitoring (without PII)
- [ ] Configure backup retention policy
- [ ] Document incident response plan

### Ongoing

- [ ] Monthly: Review Firestore rules
- [ ] Monthly: Check for Firebase SDK updates
- [ ] Quarterly: Security audit
- [ ] Quarterly: Review access logs
- [ ] Annually: Penetration testing (if applicable)

---

## Incident Response

### If Data Breach Suspected

1. **Contain**: Disable write access via Firestore rules
2. **Assess**: Check Firebase console for unusual activity
3. **Notify**: If user data exposed, notify affected users within 72 hours
4. **Remediate**: Patch vulnerability, rotate keys if needed
5. **Document**: Create incident report

### If Account Compromised

1. User reports unauthorized access
2. Invalidate all sessions: `auth.currentUser.getIdToken(true)`
3. Review recent activity in Firestore
4. Help user secure account (password reset, etc.)

### Emergency Contacts

- Firebase Support: [Firebase Console](https://console.firebase.google.com/support)
- Security Issues: [security@your-domain.com] (configure this)

---

## Firebase Security Best Practices

### Enable These in Firebase Console

1. **App Check** (Priority: P1)
   - Prevents unauthorized apps from accessing your backend
   - Enable reCAPTCHA Enterprise for web

2. **Authentication Settings**
   - Disable unused sign-in providers
   - Enable email enumeration protection
   - Set password policy (when email auth added)

3. **Firestore Settings**
   - Enable audit logging
   - Set appropriate TTL for backups

### Environment Variables

Never commit these to git:
```
NEXT_PUBLIC_FIREBASE_API_KEY      # Public, but keep in env
FIREBASE_ADMIN_PRIVATE_KEY        # NEVER commit - server only
FIREBASE_ADMIN_CLIENT_EMAIL       # NEVER commit - server only
```

---

## Summary

| Category | Current Status | Recommendation |
|----------|----------------|----------------|
| Transport | ✅ Secure | No action needed |
| At-rest encryption | ✅ Secure | No action needed |
| Auth | ⚠️ Anonymous only | Add account linking |
| Firestore rules | ✅ Deployed | Maintained |
| Rate limiting | ✅ Server-side | Deployed via Cloud Functions |
| App Check | ✅ Enabled | reCAPTCHA Enterprise active |
| Error monitoring | ✅ Sentry | Client + Functions |
| Audit logging | ✅ Enabled | GCP Cloud Logging |
| Billing alerts | ⚠️ Manual | See BILLING_ALERTS_SETUP.md |
| Data export | ❌ Missing | Implement before launch |
| Data deletion | ❌ Missing | Implement before launch |
| Privacy policy | ❌ Missing | Create before launch |

**Bottom line:** Security posture significantly improved. Priority actions now:
1. ✅ ~~Deploy Cloud Functions rate limiting~~ Done
2. ✅ ~~Enable App Check~~ Done
3. ✅ ~~Add monitoring (Sentry)~~ Done
4. ⚠️ Configure billing alerts (see [BILLING_ALERTS_SETUP.md](./archive/2025-dec-reports/BILLING_ALERTS_SETUP.md))
5. Implement account linking
6. Add data export/delete
7. Create privacy policy

---

## Related Documentation

- [SERVER_SIDE_SECURITY.md](./SERVER_SIDE_SECURITY.md) - Implementation details
- [BILLING_ALERTS_SETUP.md](./archive/2025-dec-reports/BILLING_ALERTS_SETUP.md) - GCP billing configuration
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) - Response procedures

---

## 🤖 AI Instructions

When working with security-related code:

1. **Follow [GLOBAL_SECURITY_STANDARDS.md](./GLOBAL_SECURITY_STANDARDS.md)** - mandatory for all code
2. **Check data classification** before logging or exposing data
3. **Test Firestore rules** after any schema changes
4. **Update this document** when adding new security controls
5. **Never expose Red/Yellow data** in logs, errors, or API responses

---

## 🗓️ Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-01-02 | Standardized structure per Phase 3 migration |
| 1.1 | 2025-12-19 | Added security checklist and current status |
| 1.0 | 2025-12-17 | Initial security documentation |
