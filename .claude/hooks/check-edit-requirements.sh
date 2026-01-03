#!/bin/bash
# check-edit-requirements.sh - PostToolUse hook for Edit and MultiEdit tools
# Addresses PR review feedback:
# - Input validation and sanitization
# - Test files prioritized over code files
# - Case-insensitive security keyword matching
# - Proper error handling for edge cases
# - Improved security detection (crypto libs, specific imports)

set -euo pipefail

# Validate input - handle empty/malformed arguments
FILE_PATH="${1:-}"

if [[ -z "$FILE_PATH" ]]; then
    echo "ok"
    exit 0
fi

# Reject path traversal attempts rather than rewriting (prevents security bypasses)
if [[ "$FILE_PATH" == *"../"* || "$FILE_PATH" == ../* || "$FILE_PATH" == *"/.."* || "$FILE_PATH" == ".." ]]; then
    echo "ok"
    exit 0
fi

# Sanitize file path - remove potentially dangerous characters
# Use printf instead of echo to prevent -n/-e option injection
SANITIZED_PATH=$(printf '%s' "$FILE_PATH" | tr -cd '[:alnum:]._/-')

# Handle case where sanitization strips everything
if [[ -z "$SANITIZED_PATH" ]]; then
    echo "ok"
    exit 0
fi

# Truncate excessively long paths
if [[ ${#SANITIZED_PATH} -gt 500 ]]; then
    SANITIZED_PATH="${SANITIZED_PATH:0:500}"
fi

# Extract filename for pattern matching
# Use -- to prevent paths starting with - from being interpreted as options
FILENAME=$(basename -- "$SANITIZED_PATH")
FILENAME_LOWER=$(printf '%s' "$FILENAME" | tr '[:upper:]' '[:lower:]')
PATH_LOWER=$(printf '%s' "$SANITIZED_PATH" | tr '[:upper:]' '[:lower:]')

# Priority 1: Security-sensitive files (HIGHEST priority per PR review)
# Case-insensitive matching for security keywords in path
# Use word boundaries to prevent false positives (e.g., "monkey" matching "key")
# Expanded list based on PR feedback about false negatives
if [[ "$PATH_LOWER" =~ (^|[^[:alnum:]])(auth|token|credential|secret|password|apikey|api-key|jwt|oauth|session|encrypt|crypto|keys?|cert|certificate|ssl|tls|hash|hmac)([^[:alnum:]]|$) ]]; then
    echo "POST-TASK: MUST run security-auditor agent before committing"
    exit 0
fi

# Also check for security-related filenames that might be missed
if [[ "$FILENAME_LOWER" =~ ^(\.env|secrets|credentials|auth|token|keys?|cert|certificate) ]]; then
    echo "POST-TASK: MUST run security-auditor agent before committing"
    exit 0
fi

# Priority 2: Test files (check BEFORE code files)
if [[ "$FILENAME_LOWER" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]]; then
    echo "POST-TASK: SHOULD run test-engineer agent to validate tests"
    exit 0
fi

# Also match test directories
if [[ "$PATH_LOWER" =~ /__tests__/|/test/|/tests/|/spec/ ]]; then
    echo "POST-TASK: SHOULD run test-engineer agent to validate tests"
    exit 0
fi

# Priority 3: Code files
if [[ "$FILENAME_LOWER" =~ \.(ts|tsx|js|jsx|py|sh|go|rs|rb|php|java|kt|swift)$ ]]; then
    echo "POST-TASK: MUST run code-reviewer agent before committing"
    exit 0
fi

# Priority 4: Markdown files
if [[ "$FILENAME_LOWER" =~ \.md$ ]]; then
    echo "POST-TASK: SHOULD run technical-writer agent for quality check"
    exit 0
fi

# No specific requirements
echo "ok"
