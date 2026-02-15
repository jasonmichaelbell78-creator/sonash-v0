---
name: docs-maintain
description: |
  Check documentation sync and auto-update doc artifacts. Combines sync checking
  (template-instance validation) with update automation (index regeneration,
  cross-doc dependencies, archive verification).
metadata:
  short-description: Check doc sync and auto-update doc artifacts
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Documentation Maintenance

Unified skill for checking doc sync and updating doc artifacts.

## Usage

```
/docs-maintain            # Run both check + update
/docs-maintain --check    # Check only (no changes)
/docs-maintain --update   # Update only (regenerate + fix)
```

---

## Check Mode (from docs-sync)

Validate template-instance synchronization.

### Execution

```bash
npm run docs:sync-check
# With details: npm run docs:sync-check -- --verbose
# As JSON: npm run docs:sync-check -- --json
```

### What It Checks

1. Template-derived documents are properly synchronized
2. No placeholder content remains (`[e.g., ...]`, `[X]`, `[TODO]`, etc.)
3. All relative links point to existing files
4. Sync dates are recent (<90 days)

### Exit Codes

- **0**: All documents synced
- **1**: Sync issues found
- **2**: Error during check

---

## Update Mode (from docs-update)

Auto-update documentation artifacts after file changes.

### Execution

```bash
npm run docs:index && git add DOCUMENTATION_INDEX.md
```

### What It Does

1. **Regenerate Documentation Index** - runs `npm run docs:index` to update
   DOCUMENTATION_INDEX.md
2. **Check Cross-Document Dependencies** - reviews
   `docs/DOCUMENT_DEPENDENCIES.md` for affected triggers
3. **Verify Archive Requirements** - checks moved docs have README.md in archive
   folders
4. **Suggest Updates** - lists documents referencing moved/deleted files

---

## When to Use

- After creating, moving, or deleting markdown files
- When pre-commit blocks due to DOCUMENTATION_INDEX.md not staged
- Before multi-AI audits (ensure audit plans are synced)
- After updating templates (verify instances were updated)
- After archiving documents

## Related

- `DOCUMENTATION_INDEX.md` - Auto-generated doc index
- `docs/DOCUMENT_DEPENDENCIES.md` - Cross-doc triggers and sync protocols
- Pre-commit hook (step 8) - Doc index enforcement
