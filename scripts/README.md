# Migration Scripts

This directory contains one-time migration scripts for database schema changes.

## Available Migrations

### migrate-meetings-dayindex.ts

Adds the `dayIndex` field to all existing meetings in Firestore.

**Why?** The `dayIndex` field (0=Sunday through 6=Saturday) enables proper week-order sorting in pagination queries without client-side re-sorting that breaks cursor-based pagination.

**Prerequisites:**
1. Download Firebase service account key:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in project root
   - ⚠️ **Never commit this file!** (It's in `.gitignore`)

2. Install tsx if not already installed:
   ```bash
   npm install -D tsx
   ```

**Usage:**
```bash
npx tsx scripts/migrate-meetings-dayindex.ts
```

**What it does:**
- Reads all documents from the `meetings` collection
- For each meeting, adds `dayIndex` based on the `day` field
- Uses batched writes (500 per batch) for efficiency
- Skips meetings that already have `dayIndex`
- Reports detailed progress and errors

**Safety:**
- ✅ Non-destructive (only adds field, doesn't modify existing data)
- ✅ Idempotent (safe to run multiple times)
- ✅ Validates all data before writing
- ✅ Uses batched writes for performance

**After migration:**
1. Deploy the new Firestore index:
   ```bash
   firebase deploy --only firestore:indexes
   ```
2. Test pagination in the app
3. Monitor for any issues

## Notes

- All migration scripts are written in TypeScript
- They use the Firebase Admin SDK (not client SDK)
- Service account credentials are required
- Each script is designed to be run once, but is idempotent for safety
