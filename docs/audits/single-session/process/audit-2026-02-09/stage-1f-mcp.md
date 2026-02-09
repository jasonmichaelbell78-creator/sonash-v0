<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-09
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Stage 1 - Mcp 1F Inventory

_Generated: 2026-02-09 by automation audit Stage 1_

---

## MCP Server Inventory Summary

### Configuration Files Found

1. **`.mcp.json`** - Active config with 5 servers
2. **`mcp.json.example`** - Template with 9 servers
3. **`.vscode/mcp.json`** - VS Code config with 3 servers
4. **`.claude/mcp.global-template.json`** - Global template with 2 servers
5. **`.claude/settings.json`** - Controls enabled/disabled servers

### Active Servers (in .mcp.json)

1. **filesystem**
   - Source: `@modelcontextprotocol/server-filesystem` (npm)
   - Purpose: File system operations
   - Status: ✅ ENABLED

2. **playwright**
   - Source: `@playwright/mcp@latest` (npm)
   - Purpose: Cross-browser automation and testing
   - Status: ✅ ENABLED

3. **memory**
   - Source: `@modelcontextprotocol/server-memory` (npm)
   - Purpose: Persistent memory storage
   - Status: ⚠️ CONFIGURED BUT NOT ENABLED

4. **git**
   - Source: `@modelcontextprotocol/server-git` (npm)
   - Purpose: Git operations via MCP
   - Status: ⚠️ CONFIGURED BUT NOT ENABLED

5. **sonarcloud** (Custom Implementation)
   - Source: Local script at
     `/home/user/sonash-v0/scripts/mcp/sonarcloud-server.js`
   - Purpose: SonarCloud/SonarQube analysis (security hotspots, code issues,
     quality gates)
   - Status: ✅ ENABLED
   - Features: SSRF protection, proxy support, line number tracking

### Template-Only Servers (mcp.json.example)

6. **ccusage** - Claude Code usage tracking - ❌ DISABLED (removed 2026-01-22)
7. **github** - GitHub API operations - ✅ IN TEMPLATE
8. **puppeteer** - Browser automation - ❌ DISABLED (redundant with playwright)
9. **firebase** - Firebase/Firestore operations - ✅ IN TEMPLATE (critical)
10. **context7** - Context management - ❌ DISABLED (unused)
11. **nextjs-devtools** - Next.js debugging - ❌ EXPLICITLY DISABLED

### Explicitly Disabled (in .claude/settings.json)

- **rube** - Purpose unknown, no config found
- **serena** - Code search/symbols, briefly tested
- **nextjs-devtools** - Next.js development tools

### Key Findings

**Custom MCP Server:**

- `/home/user/sonash-v0/scripts/mcp/sonarcloud-server.js` (415 lines)
- Built with `@modelcontextprotocol/sdk` v1.0.0
- Implements SSRF protection and proxy support
- Provides tools: `get_issues`, `get_security_hotspots`, quality gate checks

**Configuration Strategy:**

- `enableAllProjectMcpServers: false` (lazy loading enabled)
- Reduced from 8 to 5 active servers (per 2026-01-22 audit)
- 40-60% context token reduction achieved

**Total Unique Servers Across All Configs:** 18

The existing audit document at `/home/user/sonash-v0/docs/MCP_SERVER_AUDIT.md`
contains detailed historical analysis from 2026-01-22.
