#!/bin/bash
# check-mcp-servers.sh - SessionStart hook for MCP server availability
# Addresses PR review feedback:
# - No hardcoded tool names (dynamically reads from .mcp.json)
# - Does NOT expose URLs, tokens, headers, or other sensitive config
# - Only outputs server NAMES (safe information)
# - Proper error handling for missing/malformed config
# - Terminal escape injection protection (strips ANSI sequences)
# - Portable fallback (no PCRE grep requirement)

set -euo pipefail

# Get project directory from environment or use current directory
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
MCP_CONFIG="$PROJECT_DIR/.mcp.json"

# Function to sanitize output - strips ANSI escape sequences and control characters
sanitize_output() {
    # Remove ANSI escape sequences (ESC[...m patterns) and control characters
    # Only allow alphanumeric, spaces, commas, underscores, hyphens
    tr -cd '[:alnum:] ,_-'
}

# Check if config file exists
if [[ ! -f "$MCP_CONFIG" ]]; then
    echo "No MCP servers configured"
    exit 0
fi

# Validate JSON and extract server names only
# SECURITY: Only extract the keys (server names), not values (which may contain secrets)
if ! command -v jq &> /dev/null; then
    # Fallback if jq not available - use portable grep (no -P flag)
    # This is less reliable but safer than exposing full config
    # The || true prevents script exit on no matches due to set -o pipefail
    SERVER_NAMES=$(grep -o '"[^"]*"[[:space:]]*:' "$MCP_CONFIG" 2>/dev/null | \
                   grep -v 'mcpServers' | \
                   head -20 | \
                   tr -d '":' | \
                   tr -s '[:space:]' | \
                   tr '\n' ',' | \
                   sed 's/,$//' | \
                   sanitize_output) || SERVER_NAMES=""

    if [[ -z "$SERVER_NAMES" ]]; then
        echo "No MCP servers configured"
        exit 0
    fi
    echo "Available MCP servers: $SERVER_NAMES. Use mcp__<server>__<tool> to invoke."
    exit 0
fi

# Use jq to safely extract only server names (keys)
# First validate that the JSON is parseable
if ! jq -e . "$MCP_CONFIG" >/dev/null 2>&1; then
    echo "Invalid .mcp.json (unable to parse)"
    exit 0
fi

# Sanitize output to prevent terminal escape injection from malicious config
SERVER_NAMES=$(jq -r '.mcpServers // {} | keys | join(", ")' "$MCP_CONFIG" | sanitize_output)

if [[ -z "$SERVER_NAMES" ]]; then
    echo "No MCP servers configured"
    exit 0
fi

# Output only server names - no URLs, tokens, headers, or other config
echo "Available MCP servers: $SERVER_NAMES. Use mcp__<server>__<tool> to invoke."
