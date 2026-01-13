#!/bin/bash
set -euo pipefail

# =============================================================================
# SessionStart Hook for SoNash
# =============================================================================
# Purpose: Automatically prepare the development environment when Claude Code
#          starts a new session in a remote/web environment.
#
# What it does:
#   1. Installs npm dependencies (root and functions)
#   2. Builds Firebase Functions
#   3. Compiles test files
#
# Advantages:
#   - Automatic setup - no manual "npm install" needed
#   - Consistent state - every session starts with working builds
#   - Test-ready - can run tests immediately
#   - Web-only - skips on local CLI where deps exist
#
# Disadvantages:
#   - Adds ~10-15 seconds to session startup
#   - Requires network access for npm
#   - If hook fails, AI may not know why things break
#
# Timeout: Each npm command has a 120-second timeout to prevent hanging
# =============================================================================

# Only run in Claude Code on the web (remote environments)
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "🚀 SessionStart Hook for sonash-v0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Track warnings for accurate completion message
WARNINGS=0

# Log environment versions for debugging
echo "📋 Environment:"
echo "   Node: $(node -v 2>/dev/null || echo 'not found')"
echo "   npm:  $(npm -v 2>/dev/null || echo 'not found')"
echo "   PWD:  $(pwd)"
echo ""

# =============================================================================
# Dependency Cache Check
# =============================================================================
# Skip npm install if dependencies haven't changed since last successful install.
# Uses a checksum file to track when package-lock.json was last processed.
# This can save 15-25 seconds on session startup.

LOCKFILE_HASH_FILE=".claude/.lockfile-hash"
FUNCTIONS_LOCKFILE_HASH_FILE=".claude/.functions-lockfile-hash"

# Function to compute hash of a file (portable across systems)
compute_hash() {
  local file="$1"
  if command -v sha256sum &> /dev/null; then
    sha256sum "$file" 2>/dev/null | cut -d' ' -f1
  elif command -v shasum &> /dev/null; then
    shasum -a 256 "$file" 2>/dev/null | cut -d' ' -f1
  elif command -v md5sum &> /dev/null; then
    md5sum "$file" 2>/dev/null | cut -d' ' -f1
  else
    # Fallback: use file modification time
    stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null || echo "unknown"
  fi
}

# Check if root dependencies need install
needs_root_install() {
  # Always install if node_modules doesn't exist
  if [ ! -d "node_modules" ]; then
    return 0  # true - needs install
  fi

  # Always install if lockfile doesn't exist
  if [ ! -s "package-lock.json" ]; then
    return 0  # true - needs install
  fi

  # Check if lockfile hash matches cached hash
  if [ -f "$LOCKFILE_HASH_FILE" ]; then
    local current_hash
    current_hash=$(compute_hash "package-lock.json")
    local cached_hash
    cached_hash=$(cat "$LOCKFILE_HASH_FILE" 2>/dev/null || echo "")
    if [ "$current_hash" = "$cached_hash" ]; then
      return 1  # false - skip install
    fi
  fi

  return 0  # true - needs install
}

# Check if functions dependencies need install
needs_functions_install() {
  # Always install if functions/node_modules doesn't exist
  if [ ! -d "functions/node_modules" ]; then
    return 0  # true - needs install
  fi

  # Always install if lockfile doesn't exist
  if [ ! -s "functions/package-lock.json" ]; then
    return 0  # true - needs install
  fi

  # Check if lockfile hash matches cached hash
  if [ -f "$FUNCTIONS_LOCKFILE_HASH_FILE" ]; then
    local current_hash
    current_hash=$(compute_hash "functions/package-lock.json")
    local cached_hash
    cached_hash=$(cat "$FUNCTIONS_LOCKFILE_HASH_FILE" 2>/dev/null || echo "")
    if [ "$current_hash" = "$cached_hash" ]; then
      return 1  # false - skip install
    fi
  fi

  return 0  # true - needs install
}

# Save hash after successful install
save_root_hash() {
  mkdir -p "$(dirname "$LOCKFILE_HASH_FILE")"
  compute_hash "package-lock.json" > "$LOCKFILE_HASH_FILE"
}

save_functions_hash() {
  mkdir -p "$(dirname "$FUNCTIONS_LOCKFILE_HASH_FILE")"
  compute_hash "functions/package-lock.json" > "$FUNCTIONS_LOCKFILE_HASH_FILE"
}

# Helper function for npm commands with timeout
# Uses 'timeout' command if available, otherwise falls back to running without timeout
run_npm_with_timeout() {
  local description="$1"
  local command="$2"
  local timeout_seconds="${3:-120}"

  echo "📦 $description..."

  # Check if timeout command is available
  if command -v timeout &> /dev/null; then
    if timeout "$timeout_seconds" bash -c "$command" 2>&1; then
      echo "   ✓ $description complete"
      return 0
    else
      local exit_code=$?
      if [ $exit_code -eq 124 ]; then
        echo "   ⚠️ $description timed out after ${timeout_seconds}s (continuing anyway)"
      else
        echo "   ⚠️ $description failed with exit code $exit_code (continuing anyway)"
      fi
      WARNINGS=$((WARNINGS + 1))
      return 0  # Don't fail the hook, just warn
    fi
  else
    # Fallback: run without timeout
    if bash -c "$command" 2>&1; then
      echo "   ✓ $description complete"
      return 0
    else
      echo "   ⚠️ $description failed (continuing anyway)"
      WARNINGS=$((WARNINGS + 1))
      return 0  # Don't fail the hook, just warn
    fi
  fi
}

# Install root dependencies
# Use 'npm ci' instead of 'npm install' to:
#   1. Never modify package-lock.json (prevents CI sync issues)
#   2. Install exactly what's in lockfile (reproducible builds)
#   3. Fail fast if lockfile is out of sync (surfaces real issues)
# Falls back to 'npm install' if lockfile is missing (new repos, etc.)
# OPTIMIZATION: Skip install if lockfile hash matches cached version
if needs_root_install; then
  if [ -s "package-lock.json" ]; then
    if run_npm_with_timeout "Installing root dependencies" \
      "npm ci --prefer-offline --no-audit --no-fund" 120; then
      save_root_hash
    fi
  else
    echo "   ⚠️ package-lock.json not found or empty, falling back to npm install"
    WARNINGS=$(( ${WARNINGS:-0} + 1 ))
    if run_npm_with_timeout "Installing root dependencies (no lockfile)" \
      "npm install --prefer-offline --no-audit --no-fund" 120; then
      # Don't cache if no lockfile - always reinstall
      :
    fi
  fi
else
  echo "📦 Skipping root dependencies (unchanged since last install)"
fi

# Install Firebase Functions dependencies and build
# Use --legacy-peer-deps for functions/ to preserve original dependency resolution
# OPTIMIZATION: Skip install if lockfile hash matches cached version
if [ -d "functions" ]; then
  if needs_functions_install; then
    if [ -s "functions/package-lock.json" ]; then
      if run_npm_with_timeout "Installing Firebase Functions dependencies" \
        "cd functions && npm ci --prefer-offline --no-audit --no-fund --legacy-peer-deps" 120; then
        save_functions_hash
      fi
    else
      echo "   ⚠️ functions/package-lock.json not found or empty, falling back to npm install"
      WARNINGS=$(( ${WARNINGS:-0} + 1 ))
      run_npm_with_timeout "Installing Firebase Functions dependencies (no lockfile)" \
        "cd functions && npm install --prefer-offline --no-audit --no-fund --legacy-peer-deps" 120
    fi

    run_npm_with_timeout "Building Firebase Functions" \
      "cd functions && npm run build" 60
  else
    echo "📦 Skipping Firebase Functions dependencies (unchanged since last install)"
    # Still need to build if lib/ doesn't exist or is stale
    if [ ! -d "functions/lib" ] || [ "functions/src" -nt "functions/lib" ]; then
      run_npm_with_timeout "Building Firebase Functions" \
        "cd functions && npm run build" 60
    else
      echo "📦 Skipping Firebase Functions build (already up to date)"
    fi
  fi
fi

# Build test files (required for npm test to work)
run_npm_with_timeout "Building test files" \
  "npm run test:build" 60

echo ""

# Run pattern compliance check to surface known anti-patterns
# This helps prevent repeating mistakes documented in AI_REVIEW_LEARNINGS_LOG.md
echo "🔍 Checking for known anti-patterns..."
PATTERN_ERR_TMP="$(mktemp)"
trap 'rm -f "$PATTERN_ERR_TMP"' EXIT
if node scripts/check-pattern-compliance.js 2>"$PATTERN_ERR_TMP"; then
  echo "   ✓ No pattern violations found"
else
  EXIT_CODE=$?
  if [ "$EXIT_CODE" -ge 2 ]; then
    echo "   ❌ Pattern checker failed (exit $EXIT_CODE)"
    if [ -s "$PATTERN_ERR_TMP" ]; then
      echo "   stderr:"
      sed 's/^/   /' "$PATTERN_ERR_TMP"
    fi
  else
    echo "   ⚠️ Pattern violations detected - see docs/agent_docs/CODE_PATTERNS.md"
    echo "   Run: npm run patterns:check-all for details"
  fi
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Check consolidation status (alerts if reviews need consolidation or log needs archiving)
echo "🔍 Checking consolidation status..."
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
OUTPUT=$(node "$REPO_ROOT/scripts/check-consolidation-status.js" 2>&1)
EXIT_CODE=$?
if [ "$EXIT_CODE" -eq 0 ]; then
  echo "$OUTPUT"
elif [ "$EXIT_CODE" -eq 1 ]; then
  echo "$OUTPUT"
  echo "   ⚠️ Consolidation or archiving action needed - see output above"
  WARNINGS=$((WARNINGS + 1))
else # exit code >= 2
  echo "   ❌ Consolidation checker failed (exit $EXIT_CODE):"
  echo "$OUTPUT" | sed 's/^/     /'
  WARNINGS=$((WARNINGS + 1))
fi

# =============================================================================
# Surface Relevant Past Learnings (~1-2s)
# =============================================================================
# Surfaces past AI review learnings relevant to current session context
echo "🔍 Checking for relevant past learnings..."
if node "$REPO_ROOT/scripts/surface-lessons-learned.js" --quiet 2>/dev/null; then
  echo "   ✓ Lessons check complete"
else
  # Non-blocking - just note if it fails
  echo "   ⚠️ Lessons surface check skipped (script may be missing)"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# =============================================================================
# Document Sync Check (~1-3s)
# =============================================================================
# Validates that template instances are in sync with their templates
echo "🔍 Checking document sync status..."
if node "$REPO_ROOT/scripts/check-document-sync.js" --quick 2>/dev/null; then
  echo "   ✓ Documents are in sync"
else
  DOC_SYNC_EXIT=$?
  if [ "$DOC_SYNC_EXIT" -eq 1 ]; then
    echo "   ⚠️ Some documents may be out of sync - run: npm run docs:sync-check"
    WARNINGS=$((WARNINGS + 1))
  else
    echo "   ⚠️ Document sync check skipped (script may be missing)"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$WARNINGS" -eq 0 ]; then
  echo "✅ SessionStart hook completed successfully!"
else
  echo "⚠️ SessionStart hook completed with $WARNINGS warning(s)"
  echo "   Some steps may have failed - check output above."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 SESSION CHECKLIST (from AI_WORKFLOW.md):"
echo ""
echo "  1. ☐ Read SESSION_CONTEXT.md (current status, next goals)"
echo "  2. ☐ Increment session counter in SESSION_CONTEXT.md"
echo "  3. ☐ Check ROADMAP.md for priority changes"
echo "  4. ☐ Check available skills BEFORE starting:"
echo ""
echo "      SKILL DECISION TREE:"
echo "      ├─ Bug/Error? → Use 'systematic-debugging' skill FIRST"
echo "      ├─ Writing code? → Use 'code-reviewer' agent AFTER"
echo "      ├─ Security work? → Use 'security-auditor' agent"
echo "      ├─ UI/Frontend? → Use 'frontend-design' skill"
echo "      └─ Complex task? → Check ls .claude/skills/ for matches"
echo ""
echo "  5. ☐ Review active blockers before starting work"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tips:"
echo "   - Review claude.md + docs/agent_docs/CODE_PATTERNS.md for anti-patterns"
echo "   - Use TodoWrite for complex tasks (3+ steps)"
echo "   - Update SESSION_CONTEXT.md at end of session"
