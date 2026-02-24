#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * check-mcp-servers.js - SessionStart hook for MCP server availability
 *
 * Cross-platform replacement for check-mcp-servers.sh
 * Works on Windows, macOS, and Linux (no jq dependency)
 *
 * Addresses PR review feedback:
 * - No hardcoded tool names (dynamically reads from .mcp.json)
 * - Does NOT expose URLs, tokens, headers, or other sensitive config
 * - Only outputs server NAMES (safe information)
 * - Proper error handling for missing/malformed config
 */

const fs = require("node:fs");
const path = require("node:path");

// Get and validate project directory
const safeBaseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || safeBaseDir;
const projectDir = path.resolve(safeBaseDir, projectDirInput);

// Security: Ensure projectDir is within baseDir using path.relative() (prevent path traversal)
// Note: rel === '' means projectDir equals baseDir, which is valid for directory containment
const rel = path.relative(safeBaseDir, projectDir);
if (rel.startsWith(".." + path.sep) || rel === ".." || path.isAbsolute(rel)) {
  console.log("No MCP servers configured");
  process.exit(0);
}

const mcpConfigPath = path.join(projectDir, ".mcp.json");

// Check if config file exists and is safe to read
if (!fs.existsSync(mcpConfigPath)) {
  console.log("No MCP servers configured");
  process.exit(0);
}

// Security: Avoid DoS - refuse to read extremely large config files
try {
  const stat = fs.statSync(mcpConfigPath);
  if (!stat.isFile() || stat.size > 1024 * 1024) {
    console.log("No MCP servers configured");
    process.exit(0);
  }
} catch {
  console.log("No MCP servers configured");
  process.exit(0);
}

// Function to sanitize output - only allow safe characters
function sanitizeOutput(str) {
  return str.replace(/[^a-zA-Z0-9 ,_-]/g, "");
}

try {
  // Read and parse the config
  const configContent = fs.readFileSync(mcpConfigPath, "utf8");
  const config = JSON.parse(configContent);

  // Extract server names only (keys, not values which may contain secrets)
  const mcpServers = config.mcpServers || {};

  if (typeof mcpServers !== "object" || mcpServers === null) {
    console.log("No MCP servers configured");
    process.exit(0);
  }

  // Get server names, limit to 50 to prevent DoS
  const serverNames = Object.keys(mcpServers).slice(0, 50);

  if (serverNames.length === 0) {
    console.log("No MCP servers configured");
    process.exit(0);
  }

  // Sanitize and join server names (filter out empty after sanitization)
  let output = serverNames
    .map(sanitizeOutput)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join(", ");

  // Handle case where all names became empty after sanitization
  if (output.length === 0) {
    console.log("No MCP servers configured");
    process.exit(0);
  }

  // Cap output length to prevent terminal spam
  if (output.length > 500) {
    output = output.substring(0, 500) + "...";
  }

  // Output only server names - no URLs, tokens, headers, or other config
  console.log(`Available MCP servers: ${output}. Use mcp__<server>__<tool> to invoke.`);
  console.log("ok");
} catch (error) {
  if (error instanceof SyntaxError) {
    console.log("Invalid .mcp.json (unable to parse)");
  } else {
    console.log("No MCP servers configured");
  }
  process.exit(0);
}
