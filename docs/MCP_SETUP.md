# MCP Server Setup Guide

**Last Updated:** 2026-01-14

This guide explains how to configure MCP (Model Context Protocol) servers for the SoNash project.

---

## Quick Start

1. Copy the example config: `cp .mcp.json.example .mcp.json`
2. Update the filesystem path to your project directory
3. Set required environment variables (see below)
4. Restart Claude Code to load the new MCP servers

---

## Environment Variables

MCP servers that require secrets should get them from environment variables, NOT from `.mcp.json`.

### Setting Environment Variables

Add to your `~/.bashrc`, `~/.zshrc`, or `~/.profile`:

```bash
# MCP Server Secrets
export SONAR_TOKEN="your-sonarcloud-token"
export CONTEXT7_API_KEY="your-context7-key"
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your-github-pat"
```

Then reload: `source ~/.bashrc` (or restart your terminal).

---

## Server Configuration

### Firebase MCP (Recommended)

**No secrets needed** - uses Firebase CLI authentication.

```bash
# One-time setup
firebase login

# The MCP server will use this auth token automatically
```

**Capabilities:**
- Firestore queries and management
- Cloud Functions deployment
- Firebase Auth operations
- Secrets management (`firebase functions:secrets:set`)
- Hosting deployment

### SonarCloud MCP

Requires `SONAR_TOKEN` environment variable.

```bash
# Get token from: https://sonarcloud.io/account/security
export SONAR_TOKEN="your-token-here"
```

### Context7 MCP

Requires `CONTEXT7_API_KEY` environment variable.

```bash
export CONTEXT7_API_KEY="ctx7sk-xxx"
```

### GitHub MCP (Optional)

Requires `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable.

```bash
# Create PAT at: https://github.com/settings/tokens
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxx"
```

---

## Security Best Practices

1. **NEVER commit secrets** to `.mcp.json`
2. **Use empty strings** in config, provide values via environment
3. **Keep `.mcp.json` in git** (it's safe with empty secrets)
4. **Store secrets** in `~/.bashrc` or a password manager

### What's Safe to Commit

| Value | Safe to Commit? |
|-------|----------------|
| Server commands/args | ✅ Yes |
| Public URLs | ✅ Yes |
| API tokens/keys | ❌ No - use env vars |
| Service account paths | ❌ No - use CLI auth |

---

## Troubleshooting

### Firebase MCP not working

```bash
# Check if logged in
firebase login:list

# Re-authenticate if needed
firebase login --reauth
```

### Environment variables not loading

```bash
# Verify variable is set
echo $SONAR_TOKEN

# If empty, source your profile
source ~/.bashrc
```

### MCP server not appearing

1. Check `.mcp.json` syntax (valid JSON)
2. Restart Claude Code
3. Check Claude Code logs for errors

---

## Available MCP Servers

| Server | Purpose | Auth Method |
|--------|---------|-------------|
| `firebase` | Firebase/GCP operations | CLI login |
| `ccusage` | Usage tracking | None |
| `sonarcloud` | Code quality | Env var |
| `filesystem` | File operations | None |
| `puppeteer` | Browser automation | None |
| `playwright` | Browser testing | None |
| `context7` | Context management | Env var |
| `nextjs-devtools` | Next.js tools | None |

---

## Related Documentation

- [Firebase MCP Docs](https://firebase.google.com/docs/ai-assistance/mcp-server)
- [MCP Protocol Spec](https://modelcontextprotocol.io/)
