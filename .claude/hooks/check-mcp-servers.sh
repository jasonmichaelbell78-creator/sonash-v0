#!/bin/bash
# check-mcp-servers.sh - SessionStart hook for MCP server availability
# Addresses PR review feedback:
# - No hardcoded tool names (dynamically reads from .mcp.json)
# - Does NOT expose URLs, tokens, headers, or other sensitive config
# - Only outputs server NAMES (safe information)
# - Proper error handling for missing/malformed config
# - Terminal escape injection protection (strips ANSI sequences)
# - Requires jq for safe JSON parsing (no unreliable grep fallback)

set -euo pipefail

# Get project directory from environment or use current directory
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

# Reject path traversal in PROJECT_DIR
if [[ "$PROJECT_DIR" == *".."* ]]; then
    echo "No MCP servers configured"
    exit 0
fi

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
# jq is required for safe JSON parsing - grep-based fallback was unreliable
if ! command -v jq &> /dev/null; then
    echo "MCP config detected but 'jq' is unavailable; unable to list MCP servers safely"
    exit 0
fi

# Use jq to safely extract only server names (keys)
# First validate that the JSON is parseable
if ! jq -e . "$MCP_CONFIG" >/dev/null 2>&1; then
    echo "Invalid .mcp.json (unable to parse)"
    exit 0
fi

# Sanitize output to prevent terminal escape injection from malicious config
# Limit to first 50 server names to prevent DoS from large config
# Handle unexpected JSON shapes (e.g., .mcpServers is not an object)
SERVER_NAMES=$(
    jq -r '(.mcpServers // {}) | (if type == "object" then keys else [] end) | .[0:50] | join(", ")' "$MCP_CONFIG" \
    | sanitize_output
) || SERVER_NAMES=""

if [[ -z "$SERVER_NAMES" ]]; then
    echo "No MCP servers configured"
    exit 0
fi

# Cap final output length to prevent terminal spam (DoS prevention)
if [[ ${#SERVER_NAMES} -gt 500 ]]; then
    SERVER_NAMES="${SERVER_NAMES:0:500}..."
fi

# Output only server names - no URLs, tokens, headers, or other config
echo "Available MCP servers: $SERVER_NAMES. Use mcp__<server>__<tool> to invoke."
