#!/usr/bin/env node

/**
 * SonarCloud MCP Server
 *
 * Provides tools for fetching SonarCloud/SonarQube analysis results:
 * - Security hotspots with line numbers
 * - Code issues and violations
 * - Quality gate status
 *
 * Requires SONAR_TOKEN environment variable for authentication.
 * Supports HTTP_PROXY/HTTPS_PROXY for environments behind a proxy.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { ProxyAgent, fetch as undiciFetch } from "undici";

const SONAR_BASE_URL = process.env.SONAR_URL || "https://sonarcloud.io";
const SONAR_TOKEN = process.env.SONAR_TOKEN;

// Proxy configuration - use HTTPS_PROXY for HTTPS URLs, HTTP_PROXY for HTTP
const PROXY_URL =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy;
const proxyAgent = PROXY_URL ? new ProxyAgent(PROXY_URL) : undefined;

// SSRF protection: Only allow known SonarCloud/SonarQube domains
// localhost/127.0.0.1 only allowed when SONAR_ALLOW_LOCAL=true (for development)
const ALLOW_LOCAL = process.env.SONAR_ALLOW_LOCAL === "true";
const ALLOWED_SONAR_HOSTS = [
  "sonarcloud.io",
  "sonarqube.com",
  ...(ALLOW_LOCAL ? ["localhost", "127.0.0.1"] : []),
];

function isAllowedSonarHost(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    const protocol = url.protocol.toLowerCase();

    // Enforce HTTPS for non-local hosts (security requirement)
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
    if (!isLocalHost && protocol !== "https:") {
      return false;
    }

    return ALLOWED_SONAR_HOSTS.some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

// Validate SONAR_BASE_URL at startup
if (!isAllowedSonarHost(SONAR_BASE_URL)) {
  console.error(`Error: SONAR_URL "${SONAR_BASE_URL}" is not in the allowed hosts list.`);
  console.error(`Allowed hosts: ${ALLOWED_SONAR_HOSTS.join(", ")}`);
  process.exit(1);
}

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 30000;

// Helper to make authenticated requests to SonarCloud API
// SonarCloud uses Basic auth: token as username, empty password
async function sonarFetch(endpoint, params = {}) {
  const url = new URL(`${SONAR_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const headers = {
    Accept: "application/json",
  };

  if (SONAR_TOKEN) {
    // SonarCloud API uses Basic auth with token as username, empty password
    const credentials = Buffer.from(`${SONAR_TOKEN}:`).toString("base64");
    headers["Authorization"] = `Basic ${credentials}`;
  }

  // Add timeout using AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    // Use undici fetch with proxy agent if configured
    const fetchOptions = {
      headers,
      signal: controller.signal,
      ...(proxyAgent && { dispatcher: proxyAgent }),
    };
    response = await undiciFetch(url.toString(), fetchOptions);
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("SonarCloud API error: Request timed out");
    }
    throw new Error(`SonarCloud API error: Network request failed - ${error.message || "unknown"}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    // Sanitize error response - don't expose full upstream error details
    const status = response.status;
    let message = "Request failed";
    if (status === 401) message = "Authentication failed - check SONAR_TOKEN";
    else if (status === 403) message = "Access denied - insufficient permissions";
    else if (status === 404) message = "Resource not found";
    else if (status >= 500) message = "SonarCloud server error";
    throw new Error(`SonarCloud API error: ${status} - ${message}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("SonarCloud API error: Invalid JSON response");
  }
}

// Helper to fetch all pages of paginated results
async function sonarFetchAll(endpoint, params = {}, itemsKey = "items") {
  const allItems = [];
  let page = 1;
  const pageSize = 100;
  let truncated = false;

  while (true) {
    const data = await sonarFetch(endpoint, { ...params, p: page, ps: pageSize });
    const items = data[itemsKey] || [];
    allItems.push(...items);

    // Check if we have more pages (use ?? for nullish coalescing to handle 0 correctly)
    const total = data.paging?.total ?? data.total ?? items.length;
    if (allItems.length >= total || items.length < pageSize) {
      break;
    }
    page++;

    // Safety limit to prevent infinite loops
    if (page > 100) {
      truncated = true;
      console.error(`Warning: Results truncated at ${allItems.length} items (page limit reached)`);
      break;
    }
  }

  return { items: allItems, truncated };
}

// Input validation constants
const MAX_INPUT_LENGTH = 500; // Maximum length for string inputs

// Input validation helper
function validateRequired(args, ...requiredFields) {
  // Guard against undefined/null args
  if (!args || typeof args !== "object") {
    throw new Error("Invalid request: missing arguments");
  }
  for (const field of requiredFields) {
    const value = args[field];
    if (!value || typeof value !== "string" || value.trim() === "") {
      throw new Error(`Missing or invalid required parameter: ${field}`);
    }
    if (value.length > MAX_INPUT_LENGTH) {
      throw new Error(`Parameter ${field} exceeds maximum length of ${MAX_INPUT_LENGTH}`);
    }
  }
}

// Create the MCP server
const server = new Server(
  {
    name: "sonarcloud",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_security_hotspots",
        description:
          "Get security hotspots for a project/PR with file paths, line numbers, and descriptions",
        inputSchema: {
          type: "object",
          properties: {
            projectKey: {
              type: "string",
              description: 'SonarCloud project key (e.g., "owner_repo")',
            },
            pullRequest: {
              type: "string",
              description: "Pull request number (optional, for PR-specific analysis)",
            },
            status: {
              type: "string",
              enum: ["TO_REVIEW", "ACKNOWLEDGED", "FIXED", "SAFE"],
              description: "Filter by hotspot status (default: TO_REVIEW)",
            },
          },
          required: ["projectKey"],
        },
      },
      {
        name: "get_issues",
        description: "Get code issues (bugs, vulnerabilities, code smells) for a project/PR",
        inputSchema: {
          type: "object",
          properties: {
            projectKey: {
              type: "string",
              description: "SonarCloud project key",
            },
            pullRequest: {
              type: "string",
              description: "Pull request number (optional)",
            },
            types: {
              type: "string",
              description: "Comma-separated issue types: BUG, VULNERABILITY, CODE_SMELL",
            },
            severities: {
              type: "string",
              description: "Comma-separated severities: BLOCKER, CRITICAL, MAJOR, MINOR, INFO",
            },
          },
          required: ["projectKey"],
        },
      },
      {
        name: "get_quality_gate",
        description: "Get quality gate status for a project/PR",
        inputSchema: {
          type: "object",
          properties: {
            projectKey: {
              type: "string",
              description: "SonarCloud project key",
            },
            pullRequest: {
              type: "string",
              description: "Pull request number (optional)",
            },
          },
          required: ["projectKey"],
        },
      },
      {
        name: "get_hotspot_details",
        description:
          "Get detailed information about a specific security hotspot including code context",
        inputSchema: {
          type: "object",
          properties: {
            hotspotKey: {
              type: "string",
              description: "The hotspot key/ID",
            },
          },
          required: ["hotspotKey"],
        },
      },
    ],
  };
});

// Helper to wrap JSON result into MCP text content
function jsonContent(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

// Tool handler: get_security_hotspots
async function handleGetSecurityHotspots(args) {
  validateRequired(args, "projectKey");

  const params = {
    projectKey: args.projectKey.trim(),
    pullRequest: args.pullRequest?.trim(),
    status: args.status || "TO_REVIEW",
  };

  const { items: allHotspots, truncated } = await sonarFetchAll(
    "/api/hotspots/search",
    params,
    "hotspots"
  );

  const hotspots = allHotspots.map((h) => ({
    key: h.key,
    message: h.message,
    file: h.component?.split(":").pop() || h.component,
    line: h.line,
    status: h.status,
    vulnerabilityProbability: h.vulnerabilityProbability,
    securityCategory: h.securityCategory,
    rule: h.ruleKey,
  }));

  return jsonContent({ total: hotspots.length, truncated, hotspots });
}

// Tool handler: get_issues
async function handleGetIssues(args) {
  validateRequired(args, "projectKey");

  const params = {
    componentKeys: args.projectKey.trim(),
    pullRequest: args.pullRequest?.trim(),
    types: args.types?.trim(),
    severities: args.severities?.trim(),
    resolved: "false",
  };

  const { items: allIssues, truncated } = await sonarFetchAll(
    "/api/issues/search",
    params,
    "issues"
  );

  const issues = allIssues.map((i) => ({
    key: i.key,
    type: i.type,
    severity: i.severity,
    message: i.message,
    file: i.component?.split(":").pop() || i.component,
    line: i.line,
    rule: i.rule,
    effort: i.effort,
  }));

  return jsonContent({ total: issues.length, truncated, issues });
}

// Tool handler: get_quality_gate
async function handleGetQualityGate(args) {
  validateRequired(args, "projectKey");

  const params = {
    projectKey: args.projectKey.trim(),
    pullRequest: args.pullRequest?.trim(),
  };

  const data = await sonarFetch("/api/qualitygates/project_status", params);

  return jsonContent({
    status: data.projectStatus?.status,
    conditions: data.projectStatus?.conditions?.map((c) => ({
      metric: c.metricKey,
      status: c.status,
      actualValue: c.actualValue,
      errorThreshold: c.errorThreshold,
    })),
  });
}

// Tool handler: get_hotspot_details
async function handleGetHotspotDetails(args) {
  validateRequired(args, "hotspotKey");

  const data = await sonarFetch("/api/hotspots/show", {
    hotspot: args.hotspotKey.trim(),
  });

  return jsonContent({
    key: data.key,
    message: data.message,
    file: data.component?.path,
    line: data.line,
    status: data.status,
    rule: {
      key: data.rule?.key,
      name: data.rule?.name,
      securityCategory: data.rule?.securityCategory,
      vulnerabilityProbability: data.rule?.vulnerabilityProbability,
      riskDescription: data.rule?.riskDescription,
      vulnerabilityDescription: data.rule?.vulnerabilityDescription,
      fixRecommendations: data.rule?.fixRecommendations,
    },
  });
}

// Tool handler dispatch map
const TOOL_HANDLERS = {
  get_security_hotspots: handleGetSecurityHotspots,
  get_issues: handleGetIssues,
  get_quality_gate: handleGetQualityGate,
  get_hotspot_details: handleGetHotspotDetails,
};

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const handler = TOOL_HANDLERS[name];
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }
    return await handler(args);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
try {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SonarCloud MCP server running on stdio");
  if (proxyAgent) {
    console.error("Using proxy for API requests");
  }
  if (!SONAR_TOKEN) {
    console.error(
      "Warning: SONAR_TOKEN not set. Set it via environment variable for authenticated access."
    );
  }
} catch (error) {
  // Sanitize error output - don't expose stack traces
  console.error(`Fatal error: ${error.message || "Unknown error"}`);
  process.exit(1);
}
