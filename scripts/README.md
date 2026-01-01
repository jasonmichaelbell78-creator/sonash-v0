# Scripts Reference

This directory contains automation scripts for documentation, development, and migration tasks.

---

## Documentation Automation Scripts

### update-readme-status.js

**Purpose:** Syncs the README.md "Project Status" section with data from ROADMAP.md

**Activation:**
```bash
node scripts/update-readme-status.js [--dry-run] [--verbose]
# Or via npm:
npm run docs:update-readme
```

**Options:**
- `--dry-run` - Show what would change without writing files
- `--verbose` - Show detailed logging

**What it does:**
1. Parses ROADMAP.md milestones table
2. Calculates overall progress percentage
3. Identifies current focus and completed milestones
4. Updates README.md "Project Status" section
5. Preserves all other README.md content

**Exit codes:** 0 = success, 1 = error

---

### check-docs-light.js

**Purpose:** Light documentation linter that validates markdown files by tier

**Activation:**
```bash
node scripts/check-docs-light.js [file1.md] [file2.md] [--dry-run] [--verbose]
# Or via npm:
npm run docs:check
```

**Options:**
- `--dry-run` - Parse-only mode (same output, explicit about not modifying)
- `--verbose` - Show detailed logging

**What it does:**
1. Auto-detects document tier (1-5) based on filename or directory
2. Validates required sections for each tier:
   - Tier 1 (Canonical): Purpose + Version History required
   - Tier 2 (Foundation): Purpose + Version History required
   - Tier 3 (Active): Any heading required
   - Tier 4 (Reference): Any heading required
   - Tier 5 (Archive): Any content required
3. Checks "Last Updated" freshness (warns if > 90 days old)
4. Validates version number format (X.Y)
5. Checks for broken file links
6. Validates anchor links

**Exit codes:** 0 = all passed, 1 = errors found

---

### archive-doc.js

**Purpose:** Archives a document with full metadata preservation and cross-reference updating

**Activation:**
```bash
node scripts/archive-doc.js FILENAME.md [--reason "text"] [--update-log] [--dry-run] [--verbose]
# Or via npm:
npm run docs:archive -- FILENAME.md
```

**Options:**
- `--reason "text"` - Reason for archiving (default: "Superseded or outdated")
- `--update-log` - Also add entry to ROADMAP_LOG.md
- `--dry-run` - Show what would change without writing
- `--verbose` - Show detailed logging

**What it does:**
1. Reads source document
2. Adds YAML frontmatter (archived_date, original_path, archive_reason, last_updated)
3. Moves to docs/archive/
4. Scans all markdown files and updates cross-references
5. Optionally adds entry to ROADMAP_LOG.md

**Exit codes:** 0 = success, 1 = error

---

### check-review-needed.js

**Purpose:** Checks if code review trigger thresholds have been reached

**Activation:**
```bash
node scripts/check-review-needed.js [--update] [--json] [--dry-run] [--verbose]
# Or via npm:
npm run review:check
```

**Options:**
- `--update` - Update MULTI_AI_REVIEW_COORDINATOR.md with current metrics
- `--json` - Output as JSON instead of human-readable table
- `--dry-run` - Show what would change without writing
- `--verbose` - Show detailed logging

**What it does:**
1. Reads MULTI_AI_REVIEW_COORDINATOR.md for baseline metrics
2. Checks git history for commits, lines changed, files modified since last review
3. Counts new files and new components
4. Runs ESLint and compares warnings to baseline
5. Checks test coverage (if available)
6. Outputs trigger status with recommendation

**Thresholds:**
- Commits: 50
- Lines changed: 1000
- Files modified: 25
- New files: 10
- New components: 5
- Lint warning increase: 10
- Coverage drop: 5%

**Exit codes:** 0 = no review needed, 1 = review recommended, 2 = error

---

## npm Script Shortcuts

```bash
npm run docs:update-readme   # Update README status from ROADMAP
npm run docs:check           # Run documentation linter
npm run docs:archive         # Archive a document (pass filename as argument)
npm run review:check         # Check if code review is needed
```

---

## GitHub Actions Workflow

### docs-lint.yml

**Purpose:** Automatically lint documentation on PRs that modify markdown files

**Triggers:**
- Pull requests to main branch that modify:
  - Any `.md` file
  - Anything in `docs/` directory
  - The `check-docs-light.js` script itself

**What it does:**
1. Gets list of changed markdown files
2. Runs check-docs-light.js on each file
3. Posts results as a PR comment (updates existing comment if present)
4. Fails the check if any errors are found

---

## Migration Scripts

This directory also contains one-time migration scripts for database schema changes.

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
