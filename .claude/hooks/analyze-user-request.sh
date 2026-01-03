#!/bin/bash
# analyze-user-request.sh - UserPromptSubmit hook for routing user requests
# Addresses PR review feedback:
# - Security rules PRIORITIZED over bug rules (prevents "fix auth bug" misrouting)
# - Input validation and sanitization
# - Case-insensitive matching
# - Proper error handling for edge cases
# - Word boundary matching to reduce false positives

set -euo pipefail

# Validate input - handle empty/malformed arguments
USER_REQUEST="${1:-}"

if [[ -z "$USER_REQUEST" ]]; then
    echo "ok"
    exit 0
fi

# Truncate excessively long input to prevent DoS
MAX_LENGTH=2000
if [[ ${#USER_REQUEST} -gt $MAX_LENGTH ]]; then
    USER_REQUEST="${USER_REQUEST:0:$MAX_LENGTH}"
fi

# Convert to lowercase for case-insensitive matching
REQUEST_LOWER=$(echo "$USER_REQUEST" | tr '[:upper:]' '[:lower:]')

# Helper function for word boundary matching
# This reduces false positives like "token" in "authentication"
matches_word() {
    local pattern="$1"
    # Use grep's built-in \b word boundary token for robust matching
    echo "$REQUEST_LOWER" | grep -qiE "\\b$pattern\\b"
}

# Priority 1: SECURITY (HIGHEST - per PR review, must come before bugs)
# A request like "fix the authentication bug" should trigger security, not debugging
if matches_word "security" || matches_word "auth" || matches_word "authentication" || \
   matches_word "token" || matches_word "password" || matches_word "credential" || \
   matches_word "secret" || matches_word "oauth" || matches_word "jwt" || \
   matches_word "encrypt" || matches_word "decrypt" || matches_word "api.?key" || \
   matches_word "session" || matches_word "permission" || matches_word "access.?control"; then
    echo "PRE-TASK: MUST use security-auditor agent"
    exit 0
fi

# Priority 2: Bug/Error/Debugging
# Only matches if not already caught by security
if matches_word "bug" || matches_word "error" || matches_word "fix" || \
   matches_word "broken" || matches_word "not.?working" || matches_word "crash" || \
   matches_word "fail" || matches_word "issue" || matches_word "problem" || \
   matches_word "debug"; then
    echo "PRE-TASK: MUST use systematic-debugging skill FIRST"
    exit 0
fi

# Priority 3: Database
if matches_word "database" || matches_word "query" || matches_word "schema" || \
   matches_word "migration" || matches_word "sql" || matches_word "postgres" || \
   matches_word "mysql" || matches_word "firestore" || matches_word "mongodb"; then
    echo "PRE-TASK: MUST use database-architect agent"
    exit 0
fi

# Priority 4: UI/Frontend
if matches_word "ui" || matches_word "frontend" || matches_word "component" || \
   matches_word "css" || matches_word "styling" || matches_word "design" || \
   matches_word "layout" || matches_word "responsive" || matches_word "tailwind" || \
   matches_word "react" || matches_word "button" || matches_word "form"; then
    echo "PRE-TASK: MUST use frontend-design skill"
    exit 0
fi

# Priority 5: Planning/Architecture
if matches_word "plan" || matches_word "design" || matches_word "architect" || \
   matches_word "implement.?feature" || matches_word "add.?feature" || \
   matches_word "new.?feature" || matches_word "refactor"; then
    echo "PRE-TASK: SHOULD use Plan agent for multi-step work"
    exit 0
fi

# Priority 6: Exploration/Understanding
if matches_word "explore" || matches_word "understand" || matches_word "find" || \
   matches_word "where.?is" || matches_word "how.?does" || matches_word "what.?is" || \
   matches_word "explain" || matches_word "show.?me"; then
    echo "PRE-TASK: SHOULD use Explore agent for codebase exploration"
    exit 0
fi

# Priority 7: Testing
if matches_word "test" || matches_word "testing" || matches_word "coverage" || \
   matches_word "jest" || matches_word "cypress" || matches_word "playwright"; then
    echo "PRE-TASK: SHOULD use test-engineer agent"
    exit 0
fi

# No specific trigger matched
echo "ok"
