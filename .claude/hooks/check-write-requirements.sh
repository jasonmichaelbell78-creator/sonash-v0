#!/bin/bash
# check-write-requirements.sh - PostToolUse hook for Write tool
# Addresses PR review feedback:
# - Input validation and sanitization
# - Test files prioritized over code files
# - Consolidated markdown rules (can't reliably distinguish new vs existing)
# - Case-insensitive security matching
# - Proper error handling for edge cases

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
# Only allow alphanumeric, dots, dashes, underscores, slashes
# Use printf instead of echo to prevent -n/-e option injection
SANITIZED_PATH=$(printf '%s' "$FILE_PATH" | tr -cd '[:alnum:]._/-')

# Reject paths altered by sanitization - treat modification as potential security risk
if [[ "$SANITIZED_PATH" != "$FILE_PATH" ]]; then
    echo "ok"
    exit 0
fi

# Handle case where sanitization strips everything (redundant now but kept for defense in depth)
if [[ -z "$SANITIZED_PATH" ]]; then
    echo "ok"
    exit 0
fi

# Truncate excessively long paths (prevent DoS)
if [[ ${#SANITIZED_PATH} -gt 500 ]]; then
    SANITIZED_PATH="${SANITIZED_PATH:0:500}"
fi

# Extract just the filename for pattern matching
# Use -- to prevent paths starting with - from being interpreted as options
FILENAME=$(basename -- "$SANITIZED_PATH")

# Convert to lowercase for case-insensitive matching
FILENAME_LOWER=$(printf '%s' "$FILENAME" | tr '[:upper:]' '[:lower:]')
PATH_LOWER=$(printf '%s' "$SANITIZED_PATH" | tr '[:upper:]' '[:lower:]')

# Priority 1: Test files (check BEFORE code files to avoid misclassification)
# Matches: .test.ts, .test.js, .spec.ts, .spec.js, etc.
if [[ "$FILENAME_LOWER" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]]; then
    echo "POST-TASK: SHOULD run test-engineer agent to validate test strategy"
    exit 0
fi

# Priority 2: Security-sensitive files (case-insensitive path check)
# Check path for security-related keywords with word boundaries
# Prevents false positives (e.g., "monkey" matching "key")
if [[ "$PATH_LOWER" =~ (^|[^[:alnum:]])(auth|token|credential|secret|password|apikey|api-key|jwt|oauth|session|encrypt|crypto)([^[:alnum:]]|$) ]]; then
    echo "POST-TASK: MUST run security-auditor agent before committing"
    exit 0
fi

# Priority 3: Code files
if [[ "$FILENAME_LOWER" =~ \.(ts|tsx|js|jsx|py|sh|go|rs|rb|php|java|kt|swift)$ ]]; then
    echo "POST-TASK: MUST run code-reviewer agent before committing"
    exit 0
fi

# Priority 4: Markdown files (consolidated - can't reliably detect new vs existing)
if [[ "$FILENAME_LOWER" =~ \.md$ ]]; then
    echo "POST-TASK: SHOULD run technical-writer agent for quality check"
    exit 0
fi

# Priority 5: Config files that may contain secrets (combined condition)
# Use { ..; } instead of (..) to avoid subshell overhead (SC2235)
if [[ "$FILENAME_LOWER" =~ \.(env|env\..+|config|cfg|ini|yaml|yml|json)$ ]] && \
   { [[ "$FILENAME_LOWER" =~ (secret|credential|auth|key|token|password) ]] || \
     [[ "$FILENAME_LOWER" =~ ^\.env ]]; }; then
    echo "POST-TASK: SHOULD review for sensitive data exposure"
    exit 0
fi

# No specific requirements
echo "ok"
