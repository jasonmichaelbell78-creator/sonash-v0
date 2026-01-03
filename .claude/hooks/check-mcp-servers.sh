#!/bin/bash
# check-mcp-servers.sh - SessionStart hook for MCP server availability
# Addresses PR review feedback:
# - No hardcoded tool names (dynamically reads from .mcp.json)
# - Does NOT expose URLs, tokens, headers, or other sensitive config
# - Only outputs server NAMES (safe information)
# - Proper error handling for missing/malformed config

set -euo pipefail

# Get project directory from environment or use current directory
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
MCP_CONFIG="$PROJECT_DIR/.mcp.json"

# Check if config file exists
if [[ ! -f "$MCP_CONFIG" ]]; then
    echo "No MCP servers configured"
    exit 0
fi

# Validate JSON and extract server names only
# SECURITY: Only extract the keys (server names), not values (which may contain secrets)
if ! command -v jq &> /dev/null; then
    # Fallback if jq not available - basic grep for server names
    # This is less reliable but safer than exposing full config
    SERVER_NAMES=$(grep -oP '"mcpServers"\s*:\s*\{[^}]*' "$MCP_CONFIG" 2>/dev/null | \
                   grep -oP '"\w+"(?=\s*:)' | tr -d '"' | tr '\n' ', ' | sed 's/,$//')
    if [[ -z "$SERVER_NAMES" ]]; then
        echo "No MCP servers configured"
        exit 0
    fi
    echo "Available MCP servers: $SERVER_NAMES. Use mcp__<server>__<tool> to invoke."
    exit 0
fi

# Use jq to safely extract only server names (keys)
SERVER_NAMES=$(jq -r '.mcpServers // {} | keys | join(", ")' "$MCP_CONFIG" 2>/dev/null)

if [[ -z "$SERVER_NAMES" || "$SERVER_NAMES" == "" ]]; then
    echo "No MCP servers configured"
    exit 0
fi

# Output only server names - no URLs, tokens, headers, or other config
echo "Available MCP servers: $SERVER_NAMES. Use mcp__<server>__<tool> to invoke."
