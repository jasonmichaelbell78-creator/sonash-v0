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
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const SONAR_BASE_URL = process.env.SONAR_URL || 'https://sonarcloud.io';
const SONAR_TOKEN = process.env.SONAR_TOKEN;

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
    'Accept': 'application/json',
  };

  if (SONAR_TOKEN) {
    // SonarCloud API uses Basic auth with token as username, empty password
    const credentials = Buffer.from(`${SONAR_TOKEN}:`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`SonarCloud API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
  }

  return response.json();
}

// Helper to fetch all pages of paginated results
async function sonarFetchAll(endpoint, params = {}, itemsKey = 'items') {
  const allItems = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const data = await sonarFetch(endpoint, { ...params, p: page, ps: pageSize });
    const items = data[itemsKey] || [];
    allItems.push(...items);

    // Check if we have more pages
    const total = data.paging?.total || data.total || items.length;
    if (allItems.length >= total || items.length < pageSize) {
      break;
    }
    page++;

    // Safety limit to prevent infinite loops
    if (page > 100) {
      break;
    }
  }

  return allItems;
}

// Input validation helper
function validateRequired(args, ...requiredFields) {
  for (const field of requiredFields) {
    if (!args[field] || typeof args[field] !== 'string' || args[field].trim() === '') {
      throw new Error(`Missing or invalid required parameter: ${field}`);
    }
  }
}

// Create the MCP server
const server = new Server(
  {
    name: 'sonarcloud',
    version: '1.0.0',
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
        name: 'get_security_hotspots',
        description: 'Get security hotspots for a project/PR with file paths, line numbers, and descriptions',
        inputSchema: {
          type: 'object',
          properties: {
            projectKey: {
              type: 'string',
              description: 'SonarCloud project key (e.g., "owner_repo")',
            },
            pullRequest: {
              type: 'string',
              description: 'Pull request number (optional, for PR-specific analysis)',
            },
            status: {
              type: 'string',
              enum: ['TO_REVIEW', 'ACKNOWLEDGED', 'FIXED', 'SAFE'],
              description: 'Filter by hotspot status (default: TO_REVIEW)',
            },
          },
          required: ['projectKey'],
        },
      },
      {
        name: 'get_issues',
        description: 'Get code issues (bugs, vulnerabilities, code smells) for a project/PR',
        inputSchema: {
          type: 'object',
          properties: {
            projectKey: {
              type: 'string',
              description: 'SonarCloud project key',
            },
            pullRequest: {
              type: 'string',
              description: 'Pull request number (optional)',
            },
            types: {
              type: 'string',
              description: 'Comma-separated issue types: BUG, VULNERABILITY, CODE_SMELL',
            },
            severities: {
              type: 'string',
              description: 'Comma-separated severities: BLOCKER, CRITICAL, MAJOR, MINOR, INFO',
            },
          },
          required: ['projectKey'],
        },
      },
      {
        name: 'get_quality_gate',
        description: 'Get quality gate status for a project/PR',
        inputSchema: {
          type: 'object',
          properties: {
            projectKey: {
              type: 'string',
              description: 'SonarCloud project key',
            },
            pullRequest: {
              type: 'string',
              description: 'Pull request number (optional)',
            },
          },
          required: ['projectKey'],
        },
      },
      {
        name: 'get_hotspot_details',
        description: 'Get detailed information about a specific security hotspot including code context',
        inputSchema: {
          type: 'object',
          properties: {
            hotspotKey: {
              type: 'string',
              description: 'The hotspot key/ID',
            },
          },
          required: ['hotspotKey'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_security_hotspots': {
        // Validate required inputs
        validateRequired(args, 'projectKey');

        const params = {
          projectKey: args.projectKey.trim(),
          pullRequest: args.pullRequest?.trim(),
          status: args.status || 'TO_REVIEW',
        };

        // Use pagination to get all hotspots
        const allHotspots = await sonarFetchAll('/api/hotspots/search', params, 'hotspots');

        // Format hotspots with relevant details
        const hotspots = allHotspots.map(h => ({
          key: h.key,
          message: h.message,
          file: h.component?.split(':').pop() || h.component,
          line: h.line,
          status: h.status,
          vulnerabilityProbability: h.vulnerabilityProbability,
          securityCategory: h.securityCategory,
          rule: h.ruleKey,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                total: hotspots.length,
                hotspots,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_issues': {
        // Validate required inputs
        validateRequired(args, 'projectKey');

        const params = {
          componentKeys: args.projectKey.trim(),
          pullRequest: args.pullRequest?.trim(),
          types: args.types?.trim(),
          severities: args.severities?.trim(),
          resolved: 'false',
        };

        // Use pagination to get all issues
        const allIssues = await sonarFetchAll('/api/issues/search', params, 'issues');

        const issues = allIssues.map(i => ({
          key: i.key,
          type: i.type,
          severity: i.severity,
          message: i.message,
          file: i.component?.split(':').pop() || i.component,
          line: i.line,
          rule: i.rule,
          effort: i.effort,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                total: issues.length,
                issues,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_quality_gate': {
        // Validate required inputs
        validateRequired(args, 'projectKey');

        const params = {
          projectKey: args.projectKey.trim(),
          pullRequest: args.pullRequest?.trim(),
        };

        const data = await sonarFetch('/api/qualitygates/project_status', params);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: data.projectStatus?.status,
                conditions: data.projectStatus?.conditions?.map(c => ({
                  metric: c.metricKey,
                  status: c.status,
                  actualValue: c.actualValue,
                  errorThreshold: c.errorThreshold,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'get_hotspot_details': {
        // Validate required inputs
        validateRequired(args, 'hotspotKey');

        const data = await sonarFetch('/api/hotspots/show', {
          hotspot: args.hotspotKey.trim(),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
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
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SonarCloud MCP server running on stdio');
}

main().catch(console.error);
