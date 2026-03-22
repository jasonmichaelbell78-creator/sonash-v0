# Work Locale Sync Plan — 2026-03-23

**Context**: Session #232 added cross-locale state tracking. This is your
checklist for the first sync at the work computer. Run these steps in order.

---

## Step 1: Backup Local State (BEFORE pulling)

These 4 files are now git-tracked but may already exist locally with
work-locale-only data. Back them up before git overwrites them.

```bash
cd /path/to/sonash-v0
git checkout housecleaning

# Backup any existing local copies
mkdir -p .claude/state/.work-backup-2026-03-23
for f in consolidation.json velocity-log.jsonl health-score-log.jsonl hook-warnings-log.jsonl; do
  if [ -f ".claude/state/$f" ]; then
    cp ".claude/state/$f" ".claude/state/.work-backup-2026-03-23/$f"
    echo "Backed up: $f ($(wc -l < .claude/state/$f) lines)"
  else
    echo "No local copy: $f (nothing to back up)"
  fi
done
```

## Step 2: Pull

```bash
git pull origin housecleaning
```

Expect to see:

- 4 new tracked files (consolidation.json, velocity-log.jsonl,
  health-score-log.jsonl, hook-warnings-log.jsonl)
- 23 deleted \*.state.json files (now properly gitignored)
- Review lifecycle and TS fixes

## Step 3: Merge Local Data Into Tracked Files

After pull, the tracked files contain home-locale data only. If Step 1 found
local backups, merge them so no work-locale data is lost.

### For .jsonl files (append-only, deduplicate by timestamp)

```bash
for f in velocity-log.jsonl health-score-log.jsonl hook-warnings-log.jsonl; do
  BACKUP=".claude/state/.work-backup-2026-03-23/$f"
  TRACKED=".claude/state/$f"
  if [ -f "$BACKUP" ]; then
    # Combine both, sort by timestamp, deduplicate
    cat "$TRACKED" "$BACKUP" | sort -u > "$TRACKED.merged"
    mv "$TRACKED.merged" "$TRACKED"
    echo "Merged $f: $(wc -l < $TRACKED) total lines"
  fi
done
```

### For consolidation.json (keep higher counter)

```bash
BACKUP=".claude/state/.work-backup-2026-03-23/consolidation.json"
TRACKED=".claude/state/consolidation.json"
if [ -f "$BACKUP" ]; then
  HOME_NUM=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$TRACKED','utf8')).consolidationNumber||0)")
  WORK_NUM=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$BACKUP','utf8')).consolidationNumber||0)")
  echo "Home: #$HOME_NUM, Work: #$WORK_NUM"
  if [ "$WORK_NUM" -gt "$HOME_NUM" ]; then
    cp "$BACKUP" "$TRACKED"
    echo "Using work version (higher counter)"
  else
    echo "Using home version (higher or equal counter)"
  fi
fi
```

### Commit the merge (if any changes)

```bash
git diff --quiet .claude/state/ || {
  git add .claude/state/consolidation.json .claude/state/velocity-log.jsonl \
    .claude/state/health-score-log.jsonl .claude/state/hook-warnings-log.jsonl
  git commit -m "chore: merge work-locale state data into tracked files"
}
```

## Step 4: Dependency Health

Session #232 found corrupted native bindings (tsx, oxlint, hermes-parser). The
work locale may have the same issues.

```bash
npm install

# Verify critical tools
npx tsx --version        # expect: tsx v4.21.0
npx oxlint --version     # expect: 1.56.0
```

If either fails:

```bash
rm -rf node_modules/tsx node_modules/oxlint node_modules/@oxlint
npm install
```

## Step 5: Verify Reviews Pipeline

```bash
npm run reviews:archive
# Expected: SYNC 0 new entries, VALIDATE: PASS, RENDER: OK

npm run reviews:check-archive
# Expected: "All checks passed"
```

If SYNC shows entries being re-added, the archive dedup fix didn't take. Check
`scripts/review-lifecycle.js` ~line 320 for `archivedIds` logic.

## Step 6: Clean Up Backup

Once everything is verified:

```bash
rm -rf .claude/state/.work-backup-2026-03-23
```

## Step 7: Run Session Begin

```bash
/session-begin
```

The 4 tracked state files are now consistent across both locales. Future
sessions at either locale will read and write the same tracked state.

---

## What Changed in Session #232

| Change                              | Files                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| Now git-tracked (cross-locale sync) | consolidation.json, velocity-log.jsonl, health-score-log.jsonl, hook-warnings-log.jsonl |
| Now gitignored (were stale tracked) | 23 \*.state.json task/deep-plan files                                                   |
| tsx circular import fixed           | sanitize-error.ts → sanitize-error.d.ts                                                 |
| Review re-sync loop fixed           | review-lifecycle.js checks archive for dedup                                            |
| TS type errors fixed                | account-linking.ts, sentry.client.ts, errors.ts, auth-context.tsx                       |

## Files That Correctly Stay Local

| File                             | Why                                                      |
| -------------------------------- | -------------------------------------------------------- |
| alerts-baseline.json             | Same-day scoped — auto-discarded next day                |
| hook-warnings.json               | Cache view — ack state in tracked hook-warnings-ack.json |
| commit-log.jsonl                 | Self-healing — auto-seeds from git history               |
| session-notes.json, handoff.json | Per-session ephemeral                                    |
| .claude/hooks/.\*.json           | Hook runtime caches, regenerated each session            |
