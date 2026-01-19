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

# Portable lowercase function (Bash 4.0+ has ${var,,}, macOS ships Bash 3.2)
to_lower() {
    if ( set +u; : "${1,,}" ) 2>/dev/null; then
        printf '%s' "${1,,}"
    else
        printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
    fi
}

# Track if we found any issues across all files
FOUND_ISSUES=false
ALL_FINDINGS=""

# Bound hook runtime: limit files to prevent stalling on large changes
MAX_FILES=10
reviewed=0

# Iterate over all provided file arguments
for FILE_PATH in "$@"; do
    # Skip non-existent files (deleted, directories, etc.)
    if [[ ! -f "$FILE_PATH" ]]; then
        continue
    fi

    # Extract filename using parameter expansion (more efficient than basename)
    filename="${FILE_PATH##*/}"
    # Convert to lowercase (portable across Bash versions)
    filename_lower=$(to_lower "$filename")

    # Only review code files (skip configs, docs, etc. to reduce noise)
    if ! [[ "$filename_lower" =~ \.(ts|tsx|js|jsx|py|sh|go|rs|rb|php|java|kt|swift)$ ]]; then
        continue
    fi

    # Check file limit AFTER filtering to code files (don't count non-code files)
    ((reviewed++)) || true
    if (( reviewed > MAX_FILES )); then
        ALL_FINDINGS+="
--- (skipped remaining code files, limit: $MAX_FILES) ---
"
        break
    fi

    # Run CodeRabbit review with timeout to prevent hangs (20s per file)
    # --plain: output without colors for easier parsing
    # --severity medium: focus on medium+ severity issues
    # Use -- to prevent filenames starting with - being interpreted as options
    # Capture exit status to distinguish timeouts/errors from findings
    REVIEW_STATUS=0
    if command -v timeout >/dev/null 2>&1; then
        REVIEW_OUTPUT=$(timeout 20s coderabbit review -- "$FILE_PATH" --plain --severity medium 2>&1) || REVIEW_STATUS=$?
    elif command -v gtimeout >/dev/null 2>&1; then
        # macOS with coreutils installed has gtimeout
        REVIEW_OUTPUT=$(gtimeout 20s coderabbit review -- "$FILE_PATH" --plain --severity medium 2>&1) || REVIEW_STATUS=$?
    else
        REVIEW_OUTPUT=$(coderabbit review -- "$FILE_PATH" --plain --severity medium 2>&1) || REVIEW_STATUS=$?
    fi

    # Skip timeouts (exit code 124) - don't block workflow
    if [[ "$REVIEW_STATUS" -eq 124 ]]; then
        ALL_FINDINGS+="
--- $FILE_PATH ---
(review timed out after 20s)
"
        continue
    fi

    # Skip CLI errors (non-zero exit, or output starts with Error:)
    # But capture the error for visibility
    if [[ "$REVIEW_STATUS" -ne 0 ]]; then
        # Only note errors if output is short (likely an error message)
        if [[[ ${#REVIEW_OUTPUT} -lt 200 ]]; then
            ALL_FINDINGS+="
--- $FILE_PATH ---
(review failed: exit $REVIEW_STATUS)
"
        fi
        continue
    fi

    # Check if there are any actionable findings
    # Use case-insensitive regex for "Error:" prefix to avoid filtering valid findings
    if [[ -n "$REVIEW_OUTPUT" && "$REVIEW_OUTPUT" != *"No issues found"* && ! "$REVIEW_OUTPUT" =~ ^[[:space:]]*[Ee][Rr][Rr][Oo][Rr]: ]]; then
        FOUND_ISSUES=true

        # Truncate very long output to prevent terminal spam (per file)
        if [[[ ${#REVIEW_OUTPUT} -gt 1500 ]]; then
            REVIEW_OUTPUT="${REVIEW_OUTPUT:0:1500}... (truncated)"
        fi

        # Sanitize output: strip ANSI escapes while preserving UTF-8 text
        # Use sed instead of tr to avoid removing valid non-ASCII characters
        REVIEW_OUTPUT=$(printf '%s' "$REVIEW_OUTPUT" | sed $'s/\x1b\\[[0-9;]*[[:alpha:]]//g')

        ALL_FINDINGS+="
--- $FILE_PATH ---
$REVIEW_OUTPUT
"
    fi
done

# Output findings to stderr to keep stdout clean for hook protocol
if [[ "$FOUND_ISSUES" == true || -n "$ALL_FINDINGS" ]]; then
    # Cap total output length
    if [[[ ${#ALL_FINDINGS} -gt 3000 ]]; then
        ALL_FINDINGS="${ALL_FINDINGS:0:3000}... (output truncated)"
    fi

    {
        echo "CodeRabbit Review Findings:"
        echo "$ALL_FINDINGS"
        echo ""
        echo "Consider addressing these issues before committing."
    } >&2
fi

# Protocol: stdout only contains "ok"
echo "ok"
