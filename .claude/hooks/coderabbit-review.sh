#!/bin/bash
# coderabbit-review.sh - PostToolUse hook for CodeRabbit AI review integration
# Triggers CodeRabbit review after significant code changes for Claude Code integration
# Creates autonomous loop: Claude writes → CodeRabbit reviews → Claude fixes
#
# Install CodeRabbit CLI:
#   curl -fsSL https://cli.coderabbit.ai/install.sh | sh
#   coderabbit auth login  # Required before first use
#
# See: https://docs.coderabbit.ai/cli/overview

set -euo pipefail

# Get the file path from arguments
FILE_PATH="${1:-}"

if [[ -z "$FILE_PATH" ]]; then
    echo "ok"
    exit 0
fi

# Only review code files (skip configs, docs, etc. to reduce noise)
FILENAME=$(basename -- "$FILE_PATH" 2>/dev/null || printf '%s' "$FILE_PATH")
FILENAME_LOWER=$(printf '%s' "$FILENAME" | tr '[:upper:]' '[:lower:]')

# Check if this is a reviewable code file
if ! [[ "$FILENAME_LOWER" =~ \.(ts|tsx|js|jsx|py|sh|go|rs|rb|php|java|kt|swift)$ ]]; then
    echo "ok"
    exit 0
fi

# Check if CodeRabbit CLI is available
if ! command -v coderabbit &> /dev/null; then
    # Silent skip if not installed - don't spam on every edit
    # User can install with: curl -fsSL https://cli.coderabbit.ai/install.sh | sh
    echo "ok"
    exit 0
fi

# Run CodeRabbit review on the specific file
# --plain: output without colors for easier parsing
# --severity medium: focus on medium+ severity issues
# Capture output but don't block on errors (review is advisory)
REVIEW_OUTPUT=$(coderabbit review "$FILE_PATH" --plain --severity medium 2>&1) || true

# Check if there are any actionable findings
if [[ -n "$REVIEW_OUTPUT" && "$REVIEW_OUTPUT" != *"No issues found"* && "$REVIEW_OUTPUT" != *"error"* ]]; then
    # Truncate very long output to prevent terminal spam
    if [[ ${#REVIEW_OUTPUT} -gt 2000 ]]; then
        REVIEW_OUTPUT="${REVIEW_OUTPUT:0:2000}... (truncated)"
    fi

    # Sanitize output (strip ANSI escapes even with --plain, just in case)
    REVIEW_OUTPUT=$(printf '%s' "$REVIEW_OUTPUT" | tr -cd '[:print:]\n\t')

    echo "CodeRabbit Review Findings:"
    echo "$REVIEW_OUTPUT"
    echo ""
    echo "Consider addressing these issues before committing."
fi

echo "ok"
