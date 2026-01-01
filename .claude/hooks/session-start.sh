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
run_npm_with_timeout "Installing root dependencies" \
  "npm ci --prefer-offline --no-audit --no-fund" 120

# Install Firebase Functions dependencies and build
if [ -d "functions" ]; then
  run_npm_with_timeout "Installing Firebase Functions dependencies" \
    "cd functions && npm ci --prefer-offline --no-audit --no-fund" 120

  run_npm_with_timeout "Building Firebase Functions" \
    "cd functions && npm run build" 60
fi

# Build test files (required for npm test to work)
run_npm_with_timeout "Building test files" \
  "npm run test:build" 60

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$WARNINGS" -eq 0 ]; then
  echo "✅ SessionStart hook completed successfully!"
else
  echo "⚠️ SessionStart hook completed with $WARNINGS warning(s)"
  echo "   Some steps may have failed - check output above."
fi
echo ""
echo "💡 Tip: If you encounter issues, check that all npm commands succeeded above."
echo "   See AI_WORKFLOW.md → 'Available AI Capabilities' for skills/agents."
