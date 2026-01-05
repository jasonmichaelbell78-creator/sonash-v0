# Firebase Change Policy

**Document Version:** 1.0
**Created:** 2026-01-05
**Last Updated:** 2026-01-05
**Status:** ACTIVE

---

## Purpose

This document defines the mandatory security review process for all changes to Firebase infrastructure, including:
- Firestore Security Rules (`firestore.rules`)
- Cloud Functions (`functions/`)
- Firebase App Check configuration
- Firebase Authentication settings
- Firebase Storage rules
- Firebase Realtime Database rules (if applicable)

**Objective:** Prevent security regressions and ensure all Firebase changes undergo appropriate review before deployment.

---

## Scope

### In Scope
- **Firestore Rules**: Any modification to `firestore.rules`
- **Cloud Functions**: New functions, modifications to existing functions, dependency changes
- **Firebase Configuration**: Changes to `firebase.json`, `.firebaserc`
- **App Check**: Configuration changes, token management, throttle settings
- **Authentication**: Auth provider changes, custom claims, security rule integration
- **Storage Rules**: Any modification to Firebase Storage security rules
- **Environment Variables**: Changes to Cloud Functions environment variables (`.env`, Firebase config)

### Out of Scope
- Client-side Firebase SDK usage (covered by general code review)
- Firebase Hosting static content (unless security-related)
- Firebase Performance Monitoring configuration
- Firebase Analytics configuration

---

## Security Review Requirements

### When security-auditor Agent is REQUIRED

The `security-auditor` agent **MUST** be used for PR review when ANY of the following conditions apply:

1. **Firestore Rules Changes**
   - Any modification to `firestore.rules`
   - Changes to collection/document access patterns
   - New security rule conditions
   - Rule simplification or refactoring

2. **Cloud Functions - High Risk Changes**
   - Functions handling authentication or authorization
   - Functions processing sensitive user data (PII, payment info, credentials)
   - Functions with database write permissions
   - New CORS configurations
   - Changes to IAM roles or service account permissions

3. **Authentication Changes**
   - Custom authentication flows
   - Custom claims implementation
   - Auth provider additions/modifications
   - Token refresh logic changes

4. **App Check Configuration**
   - Enabling/disabling App Check
   - Changing enforcement levels
   - Modifying throttle quotas
   - Debug token management

5. **Security-Critical Dependencies**
   - Updating `firebase-admin` SDK
   - Adding new authentication libraries
   - Updating encryption libraries
   - Changes to security-related packages

### When Manual Security Review is REQUIRED

In addition to `security-auditor` agent review, **human security review** is required for:

1. **Production Firestore Rules Deployment**
   - Final approval before deploying rules to production
   - Verification of test coverage for new rules

2. **Privilege Escalation**
   - Any change that grants broader access than previous rules
   - Adding admin/elevated permission checks

3. **Cross-Tenant Data Access**
   - Functions or rules accessing data across user boundaries
   - Shared collection access patterns

4. **External API Integration**
   - Cloud Functions calling external APIs with credentials
   - Webhook endpoints receiving external data

---

## Firestore Rules Change Process

### Pre-PR Checklist

Before submitting a PR that modifies `firestore.rules`:

- [ ] **Local Testing Complete**
  - Rules tested with Firebase Emulator Suite
  - Test coverage includes: authenticated users, anonymous users, admin users
  - Negative tests verify unauthorized access is blocked

- [ ] **Documentation Updated**
  - Document why the rule change is needed
  - Explain the security model for new collections
  - Update `docs/FIREBASE_ARCHITECTURE.md` if collection structure changes

- [ ] **Test Coverage**
  - Unit tests added/updated for affected rules
  - Tests cover edge cases (missing fields, invalid data types, boundary conditions)
  - Verify existing tests still pass

### PR Requirements

All PRs modifying `firestore.rules` **MUST** include:

1. **PR Description**
   ```markdown
   ## Firestore Rules Change

   **Type:** [New Collection | Access Pattern Change | Bug Fix | Refactoring]

   **Collections Affected:**
   - `collection_name`: [description of change]

   **Security Impact:**
   [Describe who can now access what, and why this is safe]

   **Testing:**
   - [ ] Emulator tests pass
   - [ ] Negative tests added
   - [ ] Manual verification completed

   **Related Issues:** #[issue_number]
   ```

2. **Test Evidence**
   - Console output showing `npm run test:rules` passing
   - Screenshot or log excerpt showing negative test cases

3. **Deployment Plan**
   - Which Firebase project(s) will be updated
   - Rollback plan if issues detected post-deployment

### Review Checklist (For Reviewers)

When reviewing Firestore Rules changes, verify:

- [ ] **Access Control**
  - [ ] Rules follow principle of least privilege
  - [ ] No overly permissive wildcards (e.g., `allow read, write: if true;`)
  - [ ] User can only access their own data (unless multi-tenant is intentional)
  - [ ] Admin checks use secure custom claims (not client-provided fields)

- [ ] **Data Validation**
  - [ ] Required fields are validated (`request.resource.data.field != null`)
  - [ ] Data types are checked (`is string`, `is number`, etc.)
  - [ ] String lengths validated for user input fields
  - [ ] No SQL injection vectors in query construction

- [ ] **Authentication**
  - [ ] `request.auth != null` checked for protected resources
  - [ ] Anonymous access intentional (if `request.auth` not checked)
  - [ ] Custom claims validated correctly (`request.auth.token.admin == true`)

- [ ] **Performance**
  - [ ] No expensive operations in rules (`get()` calls minimized)
  - [ ] Rules won't cause query denial due to complexity

- [ ] **Testing**
  - [ ] Test coverage adequate (all branches of rule logic)
  - [ ] Negative tests present (verify unauthorized access blocked)
  - [ ] Edge cases covered (missing fields, null values, wrong types)

- [ ] **Documentation**
  - [ ] Comments explain complex rule logic
  - [ ] Security model documented in FIREBASE_ARCHITECTURE.md
  - [ ] Breaking changes noted in PR description

### Deployment Process

1. **Staging Deployment**
   ```bash
   firebase deploy --only firestore:rules --project=staging
   ```
   - Monitor logs for 24 hours
   - Verify no unexpected permission errors

2. **Production Deployment**
   ```bash
   firebase deploy --only firestore:rules --project=production
   ```
   - **Requires:** Approval from security reviewer + project maintainer
   - **Timing:** Avoid deployments on Friday/weekends (unless urgent security fix)
   - **Monitoring:** Watch Firebase Console for errors for 2 hours post-deployment

3. **Rollback Procedure**
   ```bash
   # Revert to previous rules version
   git revert [commit-sha]
   firebase deploy --only firestore:rules --project=production
   ```

---

## Cloud Functions Security Review

### Pre-PR Checklist for Cloud Functions

Before submitting a PR that modifies `functions/`:

- [ ] **Security Considerations Documented**
  - Function purpose and security model explained in code comments
  - Input validation strategy documented
  - Authentication/authorization approach documented

- [ ] **Local Testing Complete**
  - Function tested with Firebase Emulator Suite
  - Error handling tested (invalid input, missing auth, etc.)
  - Performance tested (timeouts, memory limits)

- [ ] **Dependencies Reviewed**
  - Run `npm audit` and address high/critical vulnerabilities
  - No unnecessary dependencies added
  - License compliance verified

### Security Checklist for Cloud Functions

When reviewing Cloud Functions changes, verify:

- [ ] **Authentication & Authorization**
  - [ ] Function verifies user identity (`context.auth` or `admin.auth().verifyIdToken()`)
  - [ ] Function checks user permissions before data access
  - [ ] Service-to-service calls use proper authentication (service accounts)
  - [ ] No hardcoded credentials or API keys in code

- [ ] **Input Validation**
  - [ ] All user input validated (type, length, format)
  - [ ] No dangerous operations on unvalidated input (SQL, shell commands, eval)
  - [ ] File uploads validated (type, size, content)
  - [ ] Request size limits enforced

- [ ] **Data Handling**
  - [ ] Sensitive data encrypted at rest and in transit
  - [ ] PII logged minimally (no PII in error messages)
  - [ ] Database queries use parameterized queries (no string concatenation)
  - [ ] User can only access their own data

- [ ] **Error Handling**
  - [ ] Errors don't leak sensitive information (stack traces, internal paths)
  - [ ] Generic error messages for authentication failures
  - [ ] Errors logged appropriately for debugging (but no PII in logs)

- [ ] **Rate Limiting & DoS Protection**
  - [ ] Expensive operations protected by rate limiting
  - [ ] Large payload handling (streaming, chunking)
  - [ ] Timeouts configured appropriately
  - [ ] Memory limits set based on function requirements

- [ ] **CORS Configuration**
  - [ ] CORS allows only expected origins (no `*` in production)
  - [ ] Credentials handling appropriate for CORS policy

- [ ] **Environment Variables**
  - [ ] Secrets stored in Firebase Config or Secret Manager (not in code)
  - [ ] `.env` file not committed to git (in `.gitignore`)
  - [ ] Environment variable naming follows convention

- [ ] **Dependencies**
  - [ ] `npm audit` shows no high/critical vulnerabilities
  - [ ] Dependencies up to date or exceptions documented
  - [ ] No deprecated packages

### When to Use security-auditor Agent for Cloud Functions

**ALWAYS USE** for:
- New authentication/authorization logic
- Functions accessing user data
- Functions with database write permissions
- CORS configuration changes
- Environment variable changes with secrets

**OPTIONAL** for:
- Pure utility functions (no user data, no auth)
- Logging/monitoring functions
- Non-security refactoring (code style, performance)

---

## App Check Configuration Changes

### Requirements

All App Check configuration changes **MUST**:

1. **Document Intent**
   - Why is App Check being enabled/disabled?
   - What is the expected impact on legitimate users?
   - What is the threat model being addressed?

2. **Test with Debug Tokens**
   - Verify debug tokens work in development
   - Document debug token lifecycle (creation, rotation, deletion)

3. **Monitor Throttling**
   - Check Firebase Console for throttle events before/after change
   - Document baseline throttle rates
   - Set up alerts for abnormal throttle rates

4. **Gradual Rollout** (when enabling App Check)
   - Start with `UNENFORCED` mode to monitor impact
   - Monitor for 1 week before switching to `ENFORCED`
   - Have rollback plan ready

### Review Checklist

- [ ] App Check enforcement level appropriate for environment (dev/staging/prod)
- [ ] Debug tokens managed securely (not committed to git)
- [ ] Throttle quotas set appropriately
- [ ] Impact on legitimate users assessed
- [ ] Monitoring/alerting configured
- [ ] Rollback plan documented

---

## PR Template for Firebase Changes

Use this template for all Firebase-related PRs:

```markdown
## Firebase Change Summary

**Change Type:** [Firestore Rules | Cloud Functions | App Check | Auth | Storage Rules]

**Security Impact:** [High | Medium | Low]

**Affected Components:**
- [ ] Firestore Rules (`firestore.rules`)
- [ ] Cloud Functions (`functions/`)
- [ ] App Check configuration
- [ ] Firebase Authentication
- [ ] Storage Rules
- [ ] Environment Variables

---

## Security Review

- [ ] `security-auditor` agent review REQUIRED (check if any conditions met above)
- [ ] Human security review REQUIRED (check if any conditions met above)

**security-auditor Agent Summary:**
[Paste agent findings or state "Not required for this change"]

---

## Changes Description

### Firestore Rules (if applicable)
**Collections Affected:**
- `collection_name`: [description]

**Access Pattern Changes:**
[Describe who can access what, before and after this change]

### Cloud Functions (if applicable)
**Functions Modified:**
- `functionName`: [description of change]

**Security Considerations:**
- Authentication: [how function verifies user identity]
- Authorization: [how function checks permissions]
- Input Validation: [how user input is validated]
- Data Access: [what data function can read/write]

---

## Testing

### Firestore Rules Testing
- [ ] Emulator tests pass (`npm run test:rules`)
- [ ] Negative tests added (unauthorized access blocked)
- [ ] Manual verification completed

**Test Evidence:**
```
[Paste test output or link to test run]
```

### Cloud Functions Testing
- [ ] Unit tests pass
- [ ] Integration tests pass with emulator
- [ ] Error handling tested
- [ ] Performance tested (timeouts, memory)

**Test Evidence:**
```
[Paste test output]
```

---

## Deployment Plan

**Target Projects:**
- [ ] Development
- [ ] Staging
- [ ] Production

**Deployment Steps:**
1. Deploy to staging
2. Monitor for 24 hours
3. Deploy to production (with approval)

**Rollback Plan:**
[Describe how to rollback if issues detected]

---

## Documentation

- [ ] `docs/FIREBASE_ARCHITECTURE.md` updated (if applicable)
- [ ] Comments added for complex logic
- [ ] Environment variables documented
- [ ] Migration guide provided (if breaking change)

---

## Related Issues

Closes #[issue_number]
```

---

## Testing Requirements

### Firestore Rules Testing

**Minimum test coverage:**
- Authenticated user accessing own data (should succeed)
- Authenticated user accessing other user's data (should fail)
- Unauthenticated user accessing protected data (should fail)
- Admin user with custom claims accessing protected data (should succeed if applicable)
- Invalid data types rejected (should fail)
- Missing required fields rejected (should fail)

**Test structure:**
```javascript
// Example test structure
describe('users collection', () => {
  describe('authenticated users', () => {
    it('can read their own user document', async () => {
      // Test implementation
    });

    it('cannot read other users documents', async () => {
      // Test implementation
    });

    it('can update their own profile', async () => {
      // Test implementation
    });

    it('cannot update other users profiles', async () => {
      // Test implementation
    });
  });

  describe('unauthenticated users', () => {
    it('cannot read any user documents', async () => {
      // Test implementation
    });

    it('cannot create user documents', async () => {
      // Test implementation
    });
  });
});
```

### Cloud Functions Testing

**Minimum test coverage:**
- Happy path (valid input, authorized user)
- Authentication failure (missing token, invalid token)
- Authorization failure (valid token, insufficient permissions)
- Input validation failure (invalid data types, missing fields, oversized input)
- Error handling (database errors, external API failures)

---

## Monitoring & Alerts

After deploying Firebase changes, monitor:

1. **Firebase Console Metrics**
   - Error rates (Functions)
   - Permission denied errors (Firestore)
   - App Check throttle events
   - Function execution times and memory usage

2. **Application Logs**
   - Authentication failures (spike indicates rule issue)
   - Permission errors (may indicate overly restrictive rules)
   - Function errors (check for regressions)

3. **User Reports**
   - Access denied errors
   - Functionality not working (may indicate rule issue)

**Set up alerts for:**
- Firestore permission denied rate > baseline + 50%
- Cloud Function error rate > 5%
- App Check throttle events > baseline + 100%
- Authentication failure rate > baseline + 50%

---

## Emergency Security Patch Process

For **critical security vulnerabilities** requiring immediate fix:

1. **Identify Issue**
   - Document vulnerability details
   - Assess severity (CVSS score or equivalent)
   - Determine blast radius (affected users/data)

2. **Immediate Mitigation**
   - If Firestore Rules: Deploy restrictive rules immediately (block access to vulnerable collection)
   - If Cloud Function: Disable function via Firebase Console
   - If App Check: Enable enforcement to block unverified clients

3. **Develop Fix**
   - Create fix in emergency branch
   - Test thoroughly (even under time pressure)
   - Get expedited review (security-auditor agent + senior developer)

4. **Deploy Fix**
   - Deploy to production immediately after review
   - Monitor closely for 2 hours
   - Notify stakeholders

5. **Post-Mortem**
   - Document incident in `docs/incidents/`
   - Identify how vulnerability was introduced
   - Update this policy to prevent recurrence
   - Update `security-auditor` agent context if needed

---

## Compliance & Audit Trail

All Firebase changes are tracked via:

1. **Git History**
   - All changes committed to version control
   - Commit messages reference issue numbers
   - PR descriptions document security rationale

2. **Firebase Console Logs**
   - Deployment logs retained for 90 days
   - Function execution logs retained per Firebase settings

3. **Security Review Record**
   - `security-auditor` agent findings archived in PR
   - Human review approvals tracked via GitHub PR reviews

---

## Related Documents

- **[GLOBAL_SECURITY_STANDARDS.md](./GLOBAL_SECURITY_STANDARDS.md)** - Global security policy (this policy is a specialization)
- **[FIREBASE_ARCHITECTURE.md](./FIREBASE_ARCHITECTURE.md)** - Firebase architecture and data model
- **[SECURITY.md](./SECURITY.md)** - Security vulnerability reporting and key rotation
- **[MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md](./templates/MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md)** - Security audit template (references this policy)
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development workflow and testing procedures

---

## Exemptions

Exemptions to this policy require:
- **Written justification** (documented in PR)
- **Approval from project maintainer**
- **Security risk assessment** (document accepted risks)
- **Compensating controls** (alternative security measures)

**Example valid exemption:**
> "Disabling App Check enforcement in development environment to facilitate testing. Compensating control: Development environment uses separate Firebase project with test data only."

**Example invalid exemption:**
> "Skipping security review because PR is urgent." (Urgency does not justify skipping security review)

---

## Policy Updates

This policy should be reviewed and updated:
- **Quarterly** (as part of security posture review)
- **After security incidents** (incorporate lessons learned)
- **When Firebase features change** (new services, deprecated features)
- **When new vulnerabilities discovered** (e.g., new OWASP Top 10)

**Update process:**
1. Propose changes via PR
2. Get review from security-auditor agent
3. Get approval from project maintainer
4. Update version number and Last Updated date
5. Announce policy changes to team

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-05 | Initial policy creation - Firestore rules, Cloud Functions, App Check coverage | Claude (Session #25) |

---

**END OF FIREBASE_CHANGE_POLICY.md**
