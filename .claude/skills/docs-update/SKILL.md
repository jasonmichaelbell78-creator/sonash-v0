# docs-update Skill

Automatically update documentation artifacts when markdown files change.

## When to Use

- After creating, moving, or deleting markdown files
- When pre-commit blocks due to DOCUMENTATION_INDEX.md not staged
- After archiving documents
- When adding new skills or hooks

## What It Does

1. **Regenerate Documentation Index**
   - Runs `npm run docs:index` to update DOCUMENTATION_INDEX.md
   - Scans for all .md files in the repository
   - Updates file counts and link references

2. **Check Cross-Document Dependencies**
   - Reviews docs/DOCUMENT_DEPENDENCIES.md for affected triggers
   - Identifies documents that need updating based on your changes
   - Shows specific actions needed

3. **Verify Archive Requirements**
   - Checks if moved docs need README.md in archive folder
   - Validates archive folder structure

4. **Suggest Updates**
   - Lists documents that reference moved/deleted files
   - Provides specific edit suggestions

## Usage

```
/docs-update
```

Or manually trigger after doc changes:

```bash
npm run docs:index && git add DOCUMENTATION_INDEX.md
```

## Hook Integration

This skill can be triggered automatically by the pre-commit hook when .md files
are changed but DOCUMENTATION_INDEX.md isn't staged.

### Pre-commit Trigger (existing)

The pre-commit hook (step 8) already blocks if:

- .md files changed but DOCUMENTATION_INDEX.md not staged
- Resolution: Run `npm run docs:index && git add DOCUMENTATION_INDEX.md`

### PostToolUse Suggestion

When Write/Edit tools touch .md files, Claude should consider:

1. Does this doc need to be in DOCUMENT_DEPENDENCIES.md?
2. Will DOCUMENTATION_INDEX.md need regenerating?
3. Are there cross-references to update?

## Output Format

```
/docs-update Results
====================

Documentation Index:
  ✅ DOCUMENTATION_INDEX.md regenerated
  📊 276 active documents, 96 archived

Cross-Doc Dependencies:
  ⚠️ 2 triggers activated:
    - docs/DOCUMENT_DEPENDENCIES.md → Update SESSION_HISTORY entry
    - .claude/COMMAND_REFERENCE.md → Add new skill entry

Archive Verification:
  ✅ All archive folders have README.md

Suggested Actions:
  1. Stage DOCUMENTATION_INDEX.md
  2. Update DOCUMENT_DEPENDENCIES.md (line 320)
```

## Related

- DOCUMENTATION_INDEX.md - Auto-generated doc index
- docs/DOCUMENT_DEPENDENCIES.md - Cross-doc triggers
- Pre-commit hook (step 8) - Doc index enforcement
