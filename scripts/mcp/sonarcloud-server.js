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
async function sonarFetch(endpoint, params = {}) {
  const url = new URL(`${SONAR_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  const headers = {
    'Accept': 'application/json',
  };

  if (SONAR_TOKEN) {
    headers['Authorization'] = `Bearer ${SONAR_TOKEN}`;
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`SonarCloud API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
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
        const params = {
          projectKey: args.projectKey,
          pullRequest: args.pullRequest,
          status: args.status || 'TO_REVIEW',
          ps: 100, // Page size
        };

        const data = await sonarFetch('/api/hotspots/search', params);

        // Format hotspots with relevant details
        const hotspots = (data.hotspots || []).map(h => ({
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
                total: data.paging?.total || hotspots.length,
                hotspots,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_issues': {
        const params = {
          componentKeys: args.projectKey,
          pullRequest: args.pullRequest,
          types: args.types,
          severities: args.severities,
          ps: 100,
          resolved: 'false',
        };

        const data = await sonarFetch('/api/issues/search', params);

        const issues = (data.issues || []).map(i => ({
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
                total: data.total || issues.length,
                issues,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_quality_gate': {
        const params = {
          projectKey: args.projectKey,
          pullRequest: args.pullRequest,
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
        const data = await sonarFetch('/api/hotspots/show', {
          hotspot: args.hotspotKey,
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
