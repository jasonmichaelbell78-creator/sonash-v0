# Security & Privacy Guide

**Document Version:** 2.1
**Last Updated:** 2026-01-05
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
5. [Key Rotation Policy](#key-rotation-policy)
6. [User Privacy Rights](#user-privacy-rights)
7. [Security Checklist](#security-checklist)
8. [Incident Response](#incident-response)

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
- **App Check**: reCAPTCHA Enterprise configured (⚠️ temporarily disabled in Cloud Functions due to Firebase 403 throttle - see EIGHT_PHASE_REFACTOR_PLAN.md CANON-0002)

### Layer 5: Monitoring & Audit
- **Sentry**: Error monitoring for client and Cloud Functions
- **Audit logging**: Security events logged to GCP Cloud Logging
- **Event types**: AUTH_FAILURE, RATE_LIMIT_EXCEEDED, APP_CHECK_FAILURE, VALIDATION_FAILURE, AUTHORIZATION_FAILURE
- **Related docs**: [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)

### Layer 6: Data at Rest
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
- ⚠️ Firebase App Check (configured, temporarily disabled due to throttle)
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

## Key Rotation Policy

### Overview

Regular key rotation is a critical security practice that limits the impact of compromised credentials. This section defines the rotation schedule and procedures for all application keys and secrets.

### Key Types & Rotation Schedule

| Key Type | Rotation Schedule | Owner | Critical Path |
|----------|------------------|-------|---------------|
| **Firebase Web API Key** | No rotation required* | Auto (Firebase) | No |
| **Service Account Private Key** | Every 90 days (or immediately if compromised) | Manual | **YES** |
| **reCAPTCHA Site Keys** | Every 12 months (or if compromised) | Manual | No |
| **Sentry DSN** | As needed (if compromised) | Manual | No |
| **Third-party API Keys** | Per provider policy | Manual | Depends |

*Firebase Web API Keys are designed to be public and don't require rotation. They're protected by Firestore Rules and App Check.

### Service Account Key Rotation

**CRITICAL:** Service account keys (`FIREBASE_ADMIN_PRIVATE_KEY`, `FIREBASE_ADMIN_CLIENT_EMAIL`) have full access to Firebase resources and MUST be rotated regularly.

#### Scheduled Rotation (Every 90 Days)

1. **Generate New Service Account Key**
   ```bash
   # Via Firebase Console:
   # 1. Go to Project Settings > Service Accounts
   # 2. Click "Generate New Private Key"
   # 3. Download JSON file
   # 4. NEVER commit to git
   ```

2. **Update Environment Variables**
   - Development: Update `.env.local` (local only, never committed)
   - Staging: Update hosting provider env vars (Vercel/Netlify/etc.)
   - Production: Update hosting provider env vars

   ```bash
   # Example: Vercel CLI
   vercel env add FIREBASE_ADMIN_PRIVATE_KEY production
   # Paste the new private key when prompted

   vercel env add FIREBASE_ADMIN_CLIENT_EMAIL production
   # Paste the new client email
   ```

3. **Deploy Updated Configuration**
   ```bash
   # Redeploy Cloud Functions with new keys
   firebase deploy --only functions

   # Redeploy web app (if using service account on client)
   npm run deploy
   ```

4. **Verify New Keys Working**
   - Test Cloud Functions authentication
   - Check error logs for auth failures
   - Verify Firestore operations succeed

5. **Revoke Old Service Account Key**
   ```bash
   # Via Firebase Console:
   # 1. Go to Project Settings > Service Accounts
   # 2. Find old key by creation date
   # 3. Click "Delete" to revoke
   ```

6. **Document Rotation**
   - Record rotation date in `docs/security/KEY_ROTATION_LOG.md` (create if needed)
   - Note any issues encountered
   - Update next rotation date (90 days from today)

#### Emergency Rotation (If Compromised)

If a service account key is compromised (committed to git, leaked in logs, etc.):

1. **IMMEDIATELY** generate new key (steps above)
2. **IMMEDIATELY** deploy to all environments
3. **IMMEDIATELY** revoke compromised key
4. **Assess impact:**
   - Review Firebase audit logs for unauthorized activity
   - Check for unusual database writes/reads
   - Verify no data was accessed or modified
5. **Document incident** per [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
6. **Update** [FIREBASE_CHANGE_POLICY.md](./FIREBASE_CHANGE_POLICY.md) if key exposure vector needs mitigation

**NEVER:**
- Commit service account keys to git (check with `git log -p | grep "private_key"`)
- Log service account keys (sanitize before logging)
- Share keys via Slack/email
- Store keys in unencrypted files

### Firebase Web API Key Management

**Firebase Web API Keys are designed to be public** - they're safe to include in client-side code. They're protected by:
- Firestore Security Rules (enforce user access control)
- App Check (verify requests come from legitimate app)
- Firebase Console domain restrictions (optional)

**No rotation required**, but you can regenerate if needed:

1. **Generate New Web API Key**
   ```bash
   # Via Firebase Console:
   # 1. Go to Project Settings > General
   # 2. Scroll to "Your apps"
   # 3. Add new web app (or regenerate key)
   ```

2. **Update Environment Variables**
   ```bash
   # .env.local (not committed)
   NEXT_PUBLIC_FIREBASE_API_KEY=new_key_here

   # Update in hosting provider for production
   ```

3. **Deploy** and verify functionality

4. **Optional:** Remove old web app from Firebase Console

### reCAPTCHA Key Rotation

reCAPTCHA keys (for App Check) should be rotated annually or if compromised:

1. **Create New reCAPTCHA Keys**
   - Go to [Google Cloud Console > reCAPTCHA Enterprise](https://console.cloud.google.com/security/recaptcha)
   - Create new site key and secret key

2. **Update Firebase App Check**
   ```bash
   # Via Firebase Console:
   # 1. Go to App Check
   # 2. Update reCAPTCHA Enterprise provider
   # 3. Enter new site key
   ```

3. **Update Client Configuration**
   ```typescript
   // Update in app initialization
   const appCheckInstance = initializeAppCheck(app, {
     provider: new ReCaptchaEnterpriseProvider('NEW_SITE_KEY_HERE'),
     isTokenAutoRefreshEnabled: true,
   });
   ```

4. **Deploy** and verify App Check working

5. **Revoke old keys** in Google Cloud Console

### Third-Party API Keys

For any third-party services (e.g., Sentry, analytics):

1. **Check provider's rotation policy** (some auto-rotate)
2. **Generate new key** in provider dashboard
3. **Update environment variables** in all environments
4. **Deploy** and verify integration working
5. **Revoke old key** in provider dashboard

### Key Rotation Checklist

Use this checklist for routine rotations:

- [ ] **30 days before rotation due:**
  - [ ] Review current key inventory
  - [ ] Verify rotation procedure is up-to-date
  - [ ] Notify team of upcoming rotation

- [ ] **Rotation day:**
  - [ ] Generate new keys (service account, reCAPTCHA, etc.)
  - [ ] Update all environment variables (dev, staging, prod)
  - [ ] Deploy to all environments
  - [ ] Verify functionality in each environment
  - [ ] Monitor error logs for 24 hours
  - [ ] Revoke old keys after 24-hour grace period
  - [ ] Document rotation in KEY_ROTATION_LOG.md
  - [ ] Schedule next rotation (90 days out)

- [ ] **If issues detected:**
  - [ ] Rollback to old keys immediately
  - [ ] Investigate root cause
  - [ ] Fix issue and retry rotation

### Key Storage Best Practices

**DO:**
- ✅ Store keys in environment variables (`.env.local`, hosting provider env config)
- ✅ Use secret managers (Firebase Secret Manager, Google Secret Manager, Vercel Secrets)
- ✅ Encrypt keys at rest if stored in files
- ✅ Restrict key access to minimum necessary personnel
- ✅ Use different keys for dev/staging/prod

**DON'T:**
- ❌ Commit keys to git (check with `git log -p | grep -i "private_key"`)
- ❌ Log keys in application logs
- ❌ Share keys via Slack, email, or unencrypted channels
- ❌ Store keys in plaintext files
- ❌ Reuse keys across environments

### Automated Rotation (Future Enhancement)

Consider implementing automated key rotation for critical keys:

```typescript
// Example: Cloud Function to auto-rotate service account key
export const rotateServiceAccountKey = functions
  .pubsub.schedule('0 0 1 */3 *') // Every 90 days
  .onRun(async (context) => {
    // 1. Generate new service account key via Admin SDK
    // 2. Update Secret Manager with new key
    // 3. Trigger redeployment with new keys
    // 4. Revoke old key after grace period
    // 5. Send notification to security team
  });
```

**Benefits:**
- Eliminates human error
- Ensures consistent rotation schedule
- Reduces key compromise window
- Provides audit trail

**Implementation priority:** Medium (after manual rotation process established)

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
| App Check | ⚠️ Disabled (temp) | reCAPTCHA configured; blocked by Firebase 403 throttle |
| Error monitoring | ✅ Sentry | Client + Functions |
| Audit logging | ✅ Enabled | GCP Cloud Logging |
| Billing alerts | ⚠️ Manual | See [BILLING_ALERTS_SETUP.md](./archive/2025-dec-reports/BILLING_ALERTS_SETUP.md) |
| Data export | ❌ Missing | Implement before launch |
| Data deletion | ❌ Missing | Implement before launch |
| Privacy policy | ❌ Missing | Create before launch |

**Bottom line:** Security posture significantly improved. Priority actions now:
1. ✅ ~~Deploy Cloud Functions rate limiting~~ Done
2. ⚠️ ~~Enable App Check~~ Configured but disabled (Firebase 403 throttle)
3. ✅ ~~Add monitoring (Sentry)~~ Done
4. ⚠️ Configure billing alerts (see [BILLING_ALERTS_SETUP.md](./archive/2025-dec-reports/BILLING_ALERTS_SETUP.md))
5. Implement account linking
6. Add data export/delete
7. Create privacy policy

---

## Related Documentation

- [SERVER_SIDE_SECURITY.md](./SERVER_SIDE_SECURITY.md) - Implementation details
- [FIREBASE_CHANGE_POLICY.md](./FIREBASE_CHANGE_POLICY.md) - Firebase security review requirements
- [BILLING_ALERTS_SETUP.md](./archive/2025-dec-reports/BILLING_ALERTS_SETUP.md) - GCP billing configuration
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) - Response procedures
- [GLOBAL_SECURITY_STANDARDS.md](./GLOBAL_SECURITY_STANDARDS.md) - Mandatory security standards

---

## 📝 Update Triggers

**Update this document when:**
- Adding new security controls or layers
- Changing authentication or authorization flows
- Modifying Firestore security rules
- Adding new data classification categories
- Updating incident response procedures
- Changing rate limiting or App Check configuration

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
| 2.1 | 2026-01-05 | Added comprehensive Key Rotation Policy section - service account, Firebase API keys, reCAPTCHA, procedures, checklists, automation roadmap (Task 4.1.10) |
| 2.0 | 2026-01-02 | Standardized structure per Phase 3 migration |
| 1.1 | 2025-12-19 | Added security checklist and current status |
| 1.0 | 2025-12-17 | Initial security documentation |
