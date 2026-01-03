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

# Exit early if no arguments provided
if (( $# == 0 )); then
    echo "ok"
    exit 0
fi

# Check if CodeRabbit CLI is available (check once, not per-file)
if ! command -v coderabbit &> /dev/null; then
    # Silent skip if not installed - don't spam on every edit
    # User can install with: curl -fsSL https://cli.coderabbit.ai/install.sh | sh
    echo "ok"
    exit 0
fi

# Track if we found any issues across all files
FOUND_ISSUES=false
ALL_FINDINGS=""

# Iterate over all provided file arguments
for FILE_PATH in "$@"; do
    # Skip non-existent files (deleted, directories, etc.)
    if [[ ! -f "$FILE_PATH" ]]; then
        continue
    fi

    # Extract filename using parameter expansion (more efficient than basename)
    filename="${FILE_PATH##*/}"
    # Convert to lowercase using parameter expansion (Bash 4.0+)
    filename_lower="${filename,,}"

    # Only review code files (skip configs, docs, etc. to reduce noise)
    if ! [[ "$filename_lower" =~ \.(ts|tsx|js|jsx|py|sh|go|rs|rb|php|java|kt|swift)$ ]]; then
        continue
    fi

    # Run CodeRabbit review with timeout to prevent hangs (20s per file)
    # --plain: output without colors for easier parsing
    # --severity medium: focus on medium+ severity issues
    if command -v timeout >/dev/null 2>&1; then
        REVIEW_OUTPUT=$(timeout 20s coderabbit review "$FILE_PATH" --plain --severity medium 2>&1) || true
    else
        REVIEW_OUTPUT=$(coderabbit review "$FILE_PATH" --plain --severity medium 2>&1) || true
    fi

    # Check if there are any actionable findings
    # Use "Error:" prefix match instead of *"error"* to avoid filtering valid findings
    if [[ -n "$REVIEW_OUTPUT" && "$REVIEW_OUTPUT" != *"No issues found"* && "$REVIEW_OUTPUT" != "Error:"* ]]; then
        FOUND_ISSUES=true

        # Truncate very long output to prevent terminal spam (per file)
        if [[ ${#REVIEW_OUTPUT} -gt 1500 ]]; then
            REVIEW_OUTPUT="${REVIEW_OUTPUT:0:1500}... (truncated)"
        fi

        # Sanitize output (strip ANSI escapes even with --plain, just in case)
        REVIEW_OUTPUT=$(printf '%s' "$REVIEW_OUTPUT" | tr -cd '[:print:]\n\t')

        ALL_FINDINGS+="
--- $FILE_PATH ---
$REVIEW_OUTPUT
"
    fi
done

# Output all findings at once
if [[ "$FOUND_ISSUES" == true ]]; then
    # Cap total output length
    if [[ ${#ALL_FINDINGS} -gt 3000 ]]; then
        ALL_FINDINGS="${ALL_FINDINGS:0:3000}... (output truncated)"
    fi

    echo "CodeRabbit Review Findings:"
    echo "$ALL_FINDINGS"
    echo ""
    echo "Consider addressing these issues before committing."
fi

echo "ok"
