# Sentry Integration Guide for SoNash Admin Panel

**Document Tier:** 2 (Active Reference) **Status:** Active
**Last Updated:** 2026-01-03

---

## Purpose

Step-by-step guide to integrate Sentry error tracking into the SoNash admin
panel (Phase 4 of Admin Panel Enhancement).

**Time Required:** ~30 minutes **Skill Level:** Beginner-friendly (no CLI
required)

---

## Quick Start

1. Sign up at [sentry.io](https://sentry.io) (free plan)
2. Create a Node.js project named `sonash-app`
3. Create an API token with read-only scopes
4. Add 4 secrets to GitHub: `SENTRY_DSN`, `SENTRY_API_TOKEN`, `SENTRY_ORG`,
   `SENTRY_PROJECT`
5. Deploy and test the Errors tab in admin panel

---

## Overview

This guide will help you:

- Set up a Sentry account and project
- Create an API token for server-side access
- Add secrets to GitHub for automatic deployment
- Integrate Sentry error tracking into the admin panel

**Security Note:** We use a Cloud Function to call Sentry's API (server-side) so
the API token is never exposed to the browser.

---

## Part 1: Create Sentry Account & Project (10 minutes)

### Step 1: Sign Up for Sentry

1. Go to https://sentry.io
2. Click **"Get Started"** (top right corner)
3. Choose one:
   - **"Sign up with GitHub"** (recommended - faster)
   - OR create account with email/password
4. If using GitHub, click **"Authorize Sentry"**
5. Select the **FREE** plan (should be pre-selected)
6. Click **"Continue"**

### Step 2: Create Your Project

1. On the "Create a new project" screen:
   - **Platform:** Click **"Node.js"** (in Backend/Server section)
   - **Alert frequency:** Leave as **"Alert on every new issue"**
   - **Project name:** Type `sonash-app` (match your Firebase project name)
   - **Team:** Select your personal team (default)
2. Click **"Create Project"**

### Step 3: Note Your Organization Slug

1. Look at the browser URL after creating the project
2. URL format: `https://sentry.io/organizations/YOUR-ORG-SLUG/...`
3. **COPY** the `YOUR-ORG-SLUG` part (usually your username in lowercase with
   dashes)
4. **Save this** - you'll need it as `SENTRY_ORG`

**Example:**

- URL: `https://sentry.io/organizations/jasonmichaelbell78/...`
- Org slug: `jasonmichaelbell78`

---

## Part 2: Collect Required Credentials (10 minutes)

### Credential 1: SENTRY_DSN

**What it is:** Data Source Name - tells your app where to send error reports

**How to get it:**

1. After creating the project, you'll see "Configure SDK" instructions
2. Look for: `dsn: "https://abc123...@o123.ingest.sentry.io/456"`
3. Click the **"Copy"** button next to the DSN
4. **Save this value**

**Alternative method if you don't see it:**

1. Click **"Settings"** in the left sidebar (gear icon)
2. Click **"Projects"** in the left menu
3. Click on **"sonash-app"**
4. Click **"Client Keys (DSN)"** in the left menu
5. Copy the **"DSN"** value

### Credential 2: SENTRY_ORG

**What it is:** Your organization identifier

**Value:** The slug you copied in Part 1, Step 3 (e.g., `jasonmichaelbell78`)

### Credential 3: SENTRY_PROJECT

**What it is:** Your project name

**Value:** `sonash-app` (the name you chose when creating the project)

### Credential 4: SENTRY_API_TOKEN (CRITICAL)

**What it is:** Authentication token for server-side API access

**⚠️ SECURITY:** This token gives read access to your error data. Never share it
or commit it to git!

**How to create it:**

1. Click your **profile icon** (top-right corner)
2. Click **"User Settings"**
3. In the left sidebar, click **"Auth Tokens"**
4. Click **"Create New Token"** button (top right)

**Configure the token:**

- **Name:** `SoNash Admin Panel API`
- **Scopes:** Check ONLY these three boxes:
  - ✅ `event:read` - Read access to issue and event data
  - ✅ `org:read` - Read access to organization details
  - ✅ `project:read` - Read access to project details
- **DO NOT** check `event:admin`, `event:write`, or any write/admin scopes

5. Click **"Create Token"**
6. **CRITICAL:** A popup will say "This is your only chance to copy the token!"
7. Click **"Copy"** button
8. **IMMEDIATELY** paste this into a safe place (Notepad, password manager,
   etc.)
9. **Save this** as `SENTRY_API_TOKEN`
10. Click **"I understand, continue"**

**⚠️ If you lose this token, you cannot recover it - you'll need to create a new
one.**

---

## Part 3: Add Secrets to GitHub (5 minutes)

### Why GitHub Secrets?

We store these in GitHub so they're:

- Encrypted and secure
- Available to GitHub Actions during deployment
- Never exposed in your code or git history

### Steps to Add Secrets

1. Go to your repository:
   https://github.com/jasonmichaelbell78-creator/sonash-v0
2. Click the **"Settings"** tab (top menu)
3. In the left sidebar, expand **"Secrets and variables"**
4. Click **"Actions"**
5. You should see a list of existing secrets

**Add each secret by clicking "New repository secret" and filling in:**

#### Secret 1: SENTRY_DSN

- **Name:** `SENTRY_DSN` (all caps, exactly)
- **Secret:** Paste your DSN (e.g.,
  `https://abc123...@o123.ingest.sentry.io/456`)
- Click **"Add secret"**

#### Secret 2: SENTRY_API_TOKEN

- **Name:** `SENTRY_API_TOKEN` (all caps, exactly)
- **Secret:** Paste your API token (starts with `sntrys_` or similar long
  string)
- Click **"Add secret"**

#### Secret 3: SENTRY_ORG

- **Name:** `SENTRY_ORG` (all caps, exactly)
- **Secret:** Your organization slug (e.g., `jasonmichaelbell78`)
- Click **"Add secret"**

#### Secret 4: SENTRY_PROJECT

- **Name:** `SENTRY_PROJECT` (all caps, exactly)
- **Secret:** `sonash-app`
- Click **"Add secret"**

**Verify:** You should now see 4 new secrets in the list (values are hidden,
that's normal)

---

## Part 4: What Happens Next (Automatic)

Once the Sentry integration code is deployed:

### Cloud Function: `adminGetSentryErrorSummary`

A new Cloud Function will be created that:

- Calls Sentry's API (server-side only - keeps token secure)
- Fetches recent errors from the last 24 hours (configurable)
- Returns error count and top 10 recent errors
- Provides deep links to Sentry for detailed investigation

### Admin Panel Errors Tab

A new tab in the admin panel that shows:

- **Error count badge** - Total unresolved errors
- **Recent errors list** - Last 10 errors in plain English
- **Error details** - Count, last seen time, severity
- **Deep links** - Click to view full details in Sentry
- **User correlation** - Link errors to specific users (if available)
- **Refresh button** - Reload error data

### What You'll See

```
┌─────────────────────────────────────────────────┐
│ Errors Tab                                      │
├─────────────────────────────────────────────────┤
│ 🔴 12 Unresolved Errors (Last 24h)             │
│                                                 │
│ Recent Errors:                                  │
│ ┌─────────────────────────────────────────┐   │
│ │ TypeError: Cannot read property 'uid'   │   │
│ │ 8 events • Last seen 2 hours ago        │   │
│ │ [View in Sentry →]                       │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ FirebaseError: Permission denied        │   │
│ │ 3 events • Last seen 5 hours ago        │   │
│ │ [View in Sentry →]                       │   │
│ └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Part 5: Testing After Deployment

### Test 1: Access the Errors Tab

1. Go to https://sonash-app.web.app/admin
2. Click the **"Errors"** tab (should be 4th tab)
3. You should see:
   - Error count (may be 0 if no errors yet)
   - List of recent errors (empty if none)
   - "Refresh" button

### Test 2: Verify Sentry Connection

1. In Sentry dashboard (sentry.io), navigate to your project
2. Click **"Issues"** in the left sidebar
3. Check if errors are appearing (they will come from your Cloud Functions)

### Test 3: Click a Deep Link

1. If you have any errors showing in the admin panel
2. Click **"View in Sentry →"** on any error
3. Should open the full error details in Sentry in a new tab

---

## Troubleshooting

### "Failed to fetch error summary"

**Possible causes:**

1. API token expired or invalid
2. Incorrect SENTRY_ORG or SENTRY_PROJECT values
3. API token doesn't have correct scopes

**Fix:**

1. Verify GitHub secrets are set correctly
2. Check that API token has `event:read`, `org:read`, `project:read` scopes
3. Create a new API token if needed

### "No errors showing but I know there are errors"

**Possible causes:**

1. Errors are marked as "resolved" in Sentry
2. Errors are older than 24 hours (default timeframe)
3. Errors are in a different project

**Fix:**

1. In Sentry, go to Issues and check filters
2. Look for "Status: Unresolved" filter
3. Adjust time range in Sentry query if needed

### "CORS error when loading errors tab"

**Cause:** Cloud Function not deployed or not exported

**Fix:**

1. Check GitHub Actions deployment logs
2. Verify `adminGetSentryErrorSummary` is in the exports in
   `functions/src/index.ts`
3. Redeploy if needed

---

## Security Best Practices

### ✅ DO:

- Keep API token secret (never commit to git)
- Use minimal scopes (read-only access)
- Rotate API tokens periodically (every 90 days)
- Use GitHub Secrets for all sensitive values
- Review Sentry audit logs occasionally

### ❌ DON'T:

- Share API token with anyone
- Commit secrets to git
- Give write/admin scopes unless absolutely necessary
- Hardcode secrets in code or environment files
- Use the same token for multiple projects

---

## Reference: Quick Values Checklist

Before implementation, make sure you have:

| Secret Name        | Example Format                             | Where to Find                        |
| ------------------ | ------------------------------------------ | ------------------------------------ |
| `SENTRY_DSN`       | `https://abc123@o123.ingest.sentry.io/456` | Sentry → Settings → Client Keys      |
| `SENTRY_API_TOKEN` | `sntrys_eyJpYXQ...` (long string)          | Sentry → User Settings → Auth Tokens |
| `SENTRY_ORG`       | `jasonmichaelbell78`                       | Browser URL bar                      |
| `SENTRY_PROJECT`   | `sonash-app`                               | Project name you created             |

---

## Next Steps

Once you've added all 4 secrets to GitHub:

1. **Notify your development team** that secrets are ready
2. **Implement Phase 4 code** (Cloud Function + Errors Tab UI)
3. **Deploy to production** via GitHub Actions
4. **Test the Errors tab** in the admin panel
5. **Monitor errors** in both admin panel and Sentry dashboard

---

## Support Resources

- **Sentry Documentation:** https://docs.sentry.io/
- **Sentry API Reference:** https://docs.sentry.io/api/
- **GitHub Secrets Docs:**
  https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **SoNash Admin Panel Enhancement Spec:** See
  `SoNash__AdminPanelEnhancement__v1_2__2025-12-22.md`

---

## AI Instructions

When helping with Sentry integration:

1. Verify all 4 GitHub secrets are configured correctly
2. Check API token has read-only scopes: `event:read`, `org:read`,
   `project:read`
3. For "Failed to fetch" errors, verify Cloud Function is deployed
4. Never expose or log API tokens in client-side code

---

## Version History

| Version | Date       | Changes                                                                        |
| ------- | ---------- | ------------------------------------------------------------------------------ |
| 1.1     | 2026-01-03 | Added Tier 2 sections (Purpose, Quick Start, AI Instructions, Version History) |
| 1.0     | 2025-12-23 | Initial creation                                                               |
