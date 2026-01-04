#!/bin/bash
# Pattern Compliance Check Hook
# Runs pattern checker on modified files during the session
# Non-blocking: outputs warnings but doesn't fail the operation

set -euo pipefail

# Get the project directory (this script is in .claude/hooks/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Parse file path from arguments (JSON format: {"file_path": "..."})
if [ -z "${1:-}" ]; then
  exit 0
fi

# Extract file_path from JSON (defensive parsing)
FILE_PATH=$(echo "$1" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

# If no file path found, exit silently
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only check JS/TS files and shell scripts
case "$FILE_PATH" in
  *.js|*.ts|*.tsx|*.jsx|*.sh|*.yml|*.yaml)
    ;;
  *)
    exit 0
    ;;
esac

# Run pattern check on the specific file (non-blocking, suppress errors)
cd "$PROJECT_DIR" || exit 0

# Get relative path from project root
REL_PATH="${FILE_PATH#$PROJECT_DIR/}"
# If still absolute, just use the provided path
if [[ "$REL_PATH" == /* ]]; then
  REL_PATH="$FILE_PATH"
fi

# Check if file exists (may have been deleted)
if [ ! -f "$REL_PATH" ]; then
  exit 0
fi

# Run pattern checker and capture output
OUTPUT=$(node scripts/check-pattern-compliance.js "$REL_PATH" 2>/dev/null || true)

# If violations found, output them
if echo "$OUTPUT" | grep -q "potential pattern violation"; then
  echo ""
  echo "⚠️  PATTERN CHECK REMINDER"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$OUTPUT" | grep -A3 "📄\|Line\|✓ Fix\|📚 See" || true
  echo ""
  echo "Review claude.md Section 4 (Tribal Knowledge) for documented patterns."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

# Always exit 0 to not block the operation
exit 0
