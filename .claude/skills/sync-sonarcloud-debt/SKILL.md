---
name: sync-sonarcloud-debt
description: |
  Sync technical debt items from SonarCloud API into MASTER_DEBT.jsonl.
  DEPRECATED: Use the unified /sonarcloud skill instead, which consolidates
  sync, resolve, report, and sprint workflows into a single entry point.
---

# SonarCloud Debt Sync (Deprecated)

> **This skill is deprecated.** Use `/sonarcloud` instead, which provides sync,
> resolve, report, and sprint modes in a unified interface.

**Purpose:** Synchronize SonarCloud issues with the canonical technical debt
tracker.

---

## Quick Reference

```bash
# Sync new issues (preview first)
node scripts/debt/sync-sonarcloud.js --dry-run

# Sync new issues (apply)
node scripts/debt/sync-sonarcloud.js --force

# Resolve stale items
node scripts/debt/sync-sonarcloud.js --resolve --force

# Full pass: sync + resolve
node scripts/debt/sync-sonarcloud.js --full --force

# Filter by severity
node scripts/debt/sync-sonarcloud.js --severity BLOCKER,CRITICAL --force
```

---

## Prerequisites

1. `SONAR_TOKEN` environment variable (required)
2. `SONAR_ORG` environment variable (required)
3. Existing `docs/technical-debt/MASTER_DEBT.jsonl`

---

## Available Flags

| Flag                | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| `--project <key>`   | SonarCloud project key (default: from env)     |
| `--org <name>`      | SonarCloud organization                        |
| `--severity <list>` | Filter: BLOCKER,CRITICAL,MAJOR,MINOR,INFO      |
| `--type <list>`     | Filter: BUG,VULNERABILITY,CODE_SMELL           |
| `--resolve`         | Mark items no longer in SonarCloud as RESOLVED |
| `--full`            | Sync new + resolve old in one pass             |
| `--dry-run`         | Preview changes without writing                |
| `--force`           | Skip confirmation prompt                       |

---

## Related

- `/sonarcloud` - Unified SonarCloud skill (recommended)
- `add-manual-debt` - Add items manually
- `verify-technical-debt` - Verify items in queue
