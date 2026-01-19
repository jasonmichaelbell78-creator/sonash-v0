#!/bin/bash
# Pattern Compliance Check Hook
# Runs pattern checker on modified files during the session
# Non-blocking: outputs warnings but doesn't fail the operation
#
# Security: Only processes files within PROJECT_DIR (path containment enforced)

set -euo pipefail

# Get the project directory (this script is in .claude/hooks/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Parse file path from arguments (JSON format: {"file_path": "..."})
if [ -z "${1:-}" ]; then
  exit 0
fi

# Check if node is available (required for JSON parsing and pattern checker)
if ! command -v node >/dev/null 2>&1; then
  exit 0  # Node not available, skip silently
fi

# Extract file_path from JSON robustly using node (handles escapes/backslashes)
FILE_PATH="$(
  node -e 'try { const o = JSON.parse(process.argv[1] || "{}"); process.stdout.write(String(o.file_path || "")); } catch { process.stdout.write(""); }' \
    "$1" 2>/dev/null
)"

# If no file path found, exit silently
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# SECURITY: Reject option-like and multiline paths to prevent bypass/spoofing
case "$FILE_PATH" in
  -* | *$'\n'* | *$'\r'* )
    exit 0
    ;;
esac

# SECURITY: Normalize backslashes to forward slashes for consistent checks
FILE_PATH="${FILE_PATH//\\//}"

# SECURITY: Block absolute paths and traversal segments
# Using specific patterns to avoid false positives (e.g., files with ".." in name)
# Note: Backslashes are normalized to / above, so check for Windows/UNC paths too
case "$FILE_PATH" in
  /* | //* | [A-Za-z]:/* )
    # Absolute path (Unix), UNC path (//server), or Windows drive path (C:/)
    exit 0
    ;;
  *"/../"* | "../"* | *"/.." )
    # Traversal segment - reject (POSIX-style)
    exit 0
    ;;
esac

# Only check JS/TS files and shell scripts
case "$FILE_PATH" in
  *.js|*.ts|*.tsx|*.jsx|*.sh|*.yml|*.yaml)
    ;;
  *)
    exit 0
    ;;
esac

# Change to project directory
cd "$PROJECT_DIR" || exit 0

# SECURITY: Compute relative path with proper quoting (SC2295)
# If FILE_PATH starts with PROJECT_DIR/, strip that prefix
REL_PATH="${FILE_PATH#"$PROJECT_DIR/"}"

# SECURITY: Verify the resolved path is within PROJECT_DIR
# Use Node.js for portable path resolution (realpath -m not available on all systems)
if [ -f "$REL_PATH" ]; then
  REAL_PATH="$(
    node -e 'const fs=require("fs"); try { process.stdout.write(fs.realpathSync(process.argv[1])); } catch { process.stdout.write(""); }' \
      "$REL_PATH" 2>/dev/null
  )"
  REAL_PROJECT="$(
    node -e 'const fs=require("fs"); try { process.stdout.write(fs.realpathSync(process.argv[1])); } catch { process.stdout.write(""); }' \
      "$PROJECT_DIR" 2>/dev/null
  )"

  # Verify containment: REAL_PATH must start with REAL_PROJECT/
  # Also reject if REAL_PROJECT is root (/) to prevent bypass
  if [ -z "$REAL_PATH" ] || [ -z "$REAL_PROJECT" ] || [ "$REAL_PROJECT" = "/" ]; then
    exit 0
  fi
  case "$REAL_PATH" in
    "$REAL_PROJECT"/*) ;;
    *) exit 0 ;;  # Path escapes project directory
  esac
else
  # File doesn't exist (may have been deleted)
  exit 0
fi

# Run pattern checker and capture output (limit to 20KB to prevent terminal spam)
OUTPUT=$(node scripts/check-pattern-compliance.js "$REL_PATH" 2>&1 | head -c 20000 || true)

# Sanitize for terminal safety (strip ANSI escape sequences + control chars except \t\n\r)
SAFE_OUTPUT="$(
  printf '%s' "$OUTPUT" \
    | sed -E $'s/\x1B\\[[0-9;]*[A-Za-z]//g' \
    | tr -d '\000-\010\013\014\016-\037\177'
)"

# If violations found, output them
if printf '%s' "$SAFE_OUTPUT" | grep -q "potential pattern violation"; then
  echo ""
  echo "⚠️  PATTERN CHECK REMINDER"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  printf '%s' "$SAFE_OUTPUT" | grep -E -A3 "📄|Line|✓ Fix|📚 See" || true
  echo ""
  echo "Review docs/agent_docs/CODE_PATTERNS.md (🔴 = critical) for documented patterns."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

# Always exit 0 to not block the operation
exit 0
