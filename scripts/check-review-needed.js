#!/usr/bin/env node
/**
 * Check if code review trigger thresholds have been reached
 *
 * Reads:
 * - AUDIT_TRACKER.md (per-category last audit dates)
 * - MULTI_AI_REVIEW_COORDINATOR.md (baseline metrics)
 * - git log since last review
 * - ESLint current warnings
 * - SonarCloud API (optional, when --sonarcloud flag is used)
 *
 * Checks per-category thresholds:
 * - Code: 25 commits OR 15 code files
 * - Security: ANY security file OR 20 commits
 * - Performance: 30 commits OR bundle change
 * - Refactoring: 40 commits OR complexity warnings
 * - Documentation: 20 doc files OR 30 commits
 * - Process: ANY CI/hook file OR 30 commits
 *
 * Multi-AI escalation triggers:
 * - 100+ total commits
 * - 14+ days since last multi-AI audit
 *
 * Usage: node scripts/check-review-needed.js [options]
 * Options:
 *   --category=X      Check specific category only (code|security|performance|refactoring|documentation|process)
 *   --json            Output as JSON instead of human-readable
 *   --verbose         Show detailed logging
 *   --sonarcloud      Query SonarCloud for issue counts (requires SONAR_TOKEN env var)
 *
 * Environment variables (for --sonarcloud):
 *   SONAR_TOKEN       SonarCloud authentication token
 *   SONAR_PROJECT_KEY Project key (default: jasonmichaelbell78-creator_sonash-v0)
 *   SONAR_URL         SonarCloud URL (default: https://sonarcloud.io)
 *
 * Exit codes: 0 = no review needed, 1 = review recommended, 2 = error
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { sanitizeError } from "./lib/sanitize-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// File paths
const TRACKER_PATH = join(ROOT, "docs", "AUDIT_TRACKER.md");
const _COORDINATOR_PATH = join(ROOT, "docs", "multi-ai-audit", "COORDINATOR.md"); // Reserved for future use

// Category-specific thresholds
// Updated 2026-01-20 (Session #85): Increased thresholds to reduce noise
// Previous values were too sensitive for active development pace
const CATEGORY_THRESHOLDS = {
  code: {
    commits: 75, // was 25
    files: 40, // was 15
    filePattern: /\.(tsx?|jsx?|js)$/,
    excludePattern: /^(docs|tests|\.)/,
  },
  security: {
    commits: 50, // was 20
    files: 5, // was 1 (ANY) - now requires meaningful changes
    // Targeted patterns: explicitly match critical security files by name or path
    // Includes: firestore.rules, middleware.ts, .env files, functions/, auth/firebase libs
    filePattern:
      /(^|\/)(firestore\.rules|middleware\.ts)$|(^|\/)\.env(\.|$)|(^|\/)functions\/|(^|\/)lib\/(auth|firebase)[^/]*\.(ts|tsx|js|jsx)$|\b(auth|security|secrets|credential|token)\b/i,
  },
  performance: {
    commits: 100, // was 30
    files: 30, // was 10
    filePattern: /\.(tsx?|jsx?)$/,
    checkBundle: true,
  },
  refactoring: {
    commits: 150, // was 40
    files: 50, // was 20
    filePattern: /\.(tsx?|jsx?)$/,
    checkComplexity: true,
  },
  documentation: {
    commits: 100, // was 30
    files: 50, // was 20
    filePattern: /\.md$/,
  },
  process: {
    commits: 75, // was 30
    files: 20, // was 10 - Session #101: increased to reduce noise from routine script updates
    filePattern: /(\.github|\.claude|\.husky|scripts\/)/,
  },
};

// Multi-AI escalation thresholds
// Updated 2026-02-07: Removed singleAuditCount — single audits no longer escalate to multi-AI
const MULTI_AI_THRESHOLDS = {
  totalCommits: 300, // Total commits across all categories
  daysSinceAudit: 30, // Days since last multi-AI audit
};

// Shared category section header patterns (bounded, no backtracking risk)
// Used by getCategoryAuditDates()
const CATEGORY_HEADERS = {
  code: /^### Code Audits/,
  security: /^### Security Audits/,
  performance: /^### Performance Audits/,
  refactoring: /^### Refactoring Audits/,
  documentation: /^### Documentation Audits/,
  process: /^### Process Audits/,
};

// Parse command line arguments
const args = process.argv.slice(2);
const JSON_OUTPUT = args.includes("--json");
const VERBOSE = args.includes("--verbose");
const SONARCLOUD_ENABLED = args.includes("--sonarcloud");
const CATEGORY_ARG = args.find((a) => a.startsWith("--category="));
const SPECIFIC_CATEGORY = CATEGORY_ARG ? CATEGORY_ARG.split("=")[1] || null : null;

// SonarCloud configuration
// SECURITY: Allowlist of valid SonarCloud/SonarQube hosts to prevent SSRF
const ALLOWED_SONAR_HOSTS = [
  "sonarcloud.io",
  "sonarqube.com",
  "localhost", // For local SonarQube instances
];

/**
 * Validate that SONAR_URL is a trusted host
 * @param {string} urlString - URL to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateSonarUrl(urlString) {
  try {
    const url = new URL(urlString);

    // Must be HTTPS (except localhost for local dev)
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      return { valid: false, error: "SONAR_URL must use HTTPS protocol" };
    }

    // Check against allowlist
    const isAllowed = ALLOWED_SONAR_HOSTS.some(
      (allowed) => url.hostname === allowed || url.hostname.endsWith(`.${allowed}`)
    );

    if (!isAllowed) {
      return {
        valid: false,
        error: `SONAR_URL host '${url.hostname}' not in allowlist. Allowed: ${ALLOWED_SONAR_HOSTS.join(", ")}`,
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "SONAR_URL is not a valid URL" };
  }
}

const SONAR_CONFIG = {
  token: process.env.SONAR_TOKEN,
  projectKey: process.env.SONAR_PROJECT_KEY || "jasonmichaelbell78-creator_sonash-v0",
  baseUrl: process.env.SONAR_URL || "https://sonarcloud.io",
  timeout: 30000,
};

/**
 * Safely log verbose messages (only when --verbose flag is set and not in JSON mode)
 * @param {...unknown} messages - Messages to log
 * @returns {void}
 */
function verbose(...messages) {
  if (VERBOSE && !JSON_OUTPUT) {
    console.log("[VERBOSE]", ...messages);
  }
}

/**
 * Validate and sanitize ISO date string
 * @param {string|null|undefined} dateString - Date string to validate (ISO format: YYYY-MM-DD or ISO 8601)
 * @returns {string} Sanitized date string or default '2025-01-01' if invalid
 */
function sanitizeDateString(dateString) {
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;

  if (!dateString || typeof dateString !== "string") {
    return "2025-01-01";
  }

  const trimmed = dateString.trim();
  if (!isoDatePattern.test(trimmed)) {
    return "2025-01-01";
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return "2025-01-01";
  }

  return trimmed;
}

/**
 * Get the day after a given date (for exclusive date filtering)
 * This ensures we only count commits made AFTER the audit day, not on the same day.
 * Fixes false positives where commits earlier on the audit day were counted as "since" the audit.
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {string} ISO date string for the next day
 */
function getNextDay(dateString) {
  // Parse as UTC midnight to avoid timezone-related off-by-one errors (Review #198)
  const date = new Date(dateString + "T00:00:00Z");
  if (isNaN(date.getTime())) {
    // Review #204: Fail closed - return empty string so callers treat as no-op
    // This prevents command injection if sanitizeDateString somehow fails
    return "";
  }
  // Use UTC methods to ensure consistent behavior across environments
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().split("T")[0];
}

/**
 * Safely read a file with error handling
 * @param {string} filePath - Absolute path to the file to read
 * @param {string} description - Human-readable description for error messages
 * @returns {{success: boolean, content?: string, error?: string}} Result object with content or error
 */
function safeReadFile(filePath, description) {
  verbose(`Reading ${description} from ${filePath}`);

  if (!existsSync(filePath)) {
    return { success: false, error: `${description} not found` };
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    return { success: true, content };
  } catch (error) {
    return { success: false, error: sanitizeError(error) };
  }
}

/**
 * Run a shell command safely with error handling
 * @param {string} command - Shell command to execute
 * @param {string} description - Human-readable description for logging
 * @returns {{success: boolean, output?: string, error?: string}} Result object with output or error
 */
function safeExec(command, description) {
  verbose(`Running: ${command}`);

  try {
    const output = execSync(command, {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { success: true, output: output.trim() };
  } catch (error) {
    // grep/git commands return exit code 1 for "no matches" with empty or partial stdout
    // Only treat this specific case as success; other failures should be reported
    if (error.status === 1 && error.stdout !== undefined) {
      return { success: true, output: error.stdout.trim() };
    }
    return { success: false, error: sanitizeError(error) };
  }
}

/**
 * Map HTTP status codes to user-friendly error messages
 * @param {number} status - HTTP status code
 * @returns {string} Error message
 */
function getIssueApiErrorMessage(status) {
  if (status === 401) return "Authentication failed - check SONAR_TOKEN";
  if (status === 403) return "Access denied - insufficient permissions";
  if (status === 404) return "Project not found";
  return "Request failed";
}

/**
 * Parse issues response and extract type counts
 * @param {object} issuesData - Raw issues API response
 * @returns {{total: number, bugs: number, vulnerabilities: number, codeSmells: number}}
 */
function parseIssuesResponse(issuesData) {
  // Review #187: Guard against malformed API payloads
  const paging =
    issuesData && typeof issuesData === "object" && !Array.isArray(issuesData)
      ? issuesData.paging
      : null;
  // Review #197: Apply robust number coercion to total (same as facet counts)
  const rawTotal = paging?.total ?? 0;
  const totalNum = typeof rawTotal === "number" ? rawTotal : Number(rawTotal);
  const total = Number.isFinite(totalNum) ? totalNum : 0;
  const facets = Array.isArray(issuesData?.facets) ? issuesData.facets : [];
  const typeFacet = facets.find((f) => f?.property === "types");
  const typeValues = Array.isArray(typeFacet?.values) ? typeFacet.values : [];

  // Review #188: Safely coerce API facet counts to numbers (may be strings in some responses)
  const getCount = (val) => {
    const raw = typeValues.find((v) => v?.val === val)?.count ?? 0;
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    total,
    bugs: getCount("BUG"),
    vulnerabilities: getCount("VULNERABILITY"),
    codeSmells: getCount("CODE_SMELL"),
  };
}

/**
 * Parse hotspots response
 * @param {Response} hotspotsResponse - Fetch response
 * @param {string[]} warnings - Array to push warnings to
 * @returns {Promise<number>} Hotspot count
 */
async function parseHotspotsResponse(hotspotsResponse, warnings) {
  if (!hotspotsResponse.ok) {
    warnings.push(`Hotspots API returned ${hotspotsResponse.status} - count unavailable`);
    return 0;
  }
  try {
    const hotspotsData = await hotspotsResponse.json();
    // Review #189: Safely coerce hotspot total to number (consistency with issues parsing)
    const raw = hotspotsData?.paging?.total ?? 0;
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    warnings.push(`Hotspots API returned invalid JSON - count unavailable`);
    return 0;
  }
}

/**
 * Parse quality gate response
 * @param {Response} gateResponse - Fetch response
 * @param {string[]} warnings - Array to push warnings to
 * @returns {Promise<string>} Quality gate status
 */
async function parseQualityGateResponse(gateResponse, warnings) {
  if (!gateResponse.ok) {
    warnings.push(`Quality gate API returned ${gateResponse.status} - status unavailable`);
    return "UNKNOWN";
  }
  try {
    const gateData = await gateResponse.json();
    return gateData.projectStatus?.status || "UNKNOWN";
  } catch {
    warnings.push(`Quality gate API returned invalid JSON - status unavailable`);
    return "UNKNOWN";
  }
}

/**
 * Fetch issue counts from SonarCloud API
 * @returns {Promise<{success: boolean, data?: {bugs: number, vulnerabilities: number, codeSmells: number, hotspots: number, qualityGate: string}, error?: string}>}
 */
async function fetchSonarCloudData() {
  if (!SONARCLOUD_ENABLED) {
    return { success: false, error: "SonarCloud not enabled (use --sonarcloud flag)" };
  }

  if (!SONAR_CONFIG.token) {
    return { success: false, error: "SONAR_TOKEN environment variable not set" };
  }

  // SECURITY: Validate SONAR_URL before sending token
  const urlValidation = validateSonarUrl(SONAR_CONFIG.baseUrl);
  if (!urlValidation.valid) {
    return { success: false, error: `Security: ${urlValidation.error}` };
  }

  verbose(`Fetching SonarCloud data for project: ${SONAR_CONFIG.projectKey}`);

  const headers = {
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(`${SONAR_CONFIG.token}:`).toString("base64")}`,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SONAR_CONFIG.timeout);

  try {
    // Build URLs for all three API calls
    const issuesUrl = new URL(`${SONAR_CONFIG.baseUrl}/api/issues/search`);
    issuesUrl.searchParams.append("componentKeys", SONAR_CONFIG.projectKey);
    issuesUrl.searchParams.append("resolved", "false");
    issuesUrl.searchParams.append("ps", "1"); // Only need counts, not items
    issuesUrl.searchParams.append("facets", "types,severities");

    const hotspotsUrl = new URL(`${SONAR_CONFIG.baseUrl}/api/hotspots/search`);
    hotspotsUrl.searchParams.append("projectKey", SONAR_CONFIG.projectKey);
    hotspotsUrl.searchParams.append("status", "TO_REVIEW");
    hotspotsUrl.searchParams.append("ps", "1");

    const gateUrl = new URL(`${SONAR_CONFIG.baseUrl}/api/qualitygates/project_status`);
    gateUrl.searchParams.append("projectKey", SONAR_CONFIG.projectKey);

    // PERFORMANCE: Run all API calls in parallel with AbortSignal.timeout()
    const fetchOptions = { headers, signal: controller.signal };
    const [issuesResponse, hotspotsResponse, gateResponse] = await Promise.all([
      fetch(issuesUrl.toString(), fetchOptions),
      fetch(hotspotsUrl.toString(), fetchOptions),
      fetch(gateUrl.toString(), fetchOptions),
    ]);

    // Collect warnings for partial failures (don't silently ignore)
    const warnings = [];

    // Process issues response (primary - fail if this fails)
    if (!issuesResponse.ok) {
      const status = issuesResponse.status;
      const message = getIssueApiErrorMessage(status);
      return { success: false, error: `SonarCloud API: ${status} - ${message}` };
    }

    // Wrap JSON parsing in try-catch to handle malformed responses (Review #184 - Qodo)
    let issuesData;
    try {
      issuesData = await issuesResponse.json();
    } catch {
      return { success: false, error: "SonarCloud API: Issues returned invalid JSON" };
    }
    const {
      total: totalIssues,
      bugs,
      vulnerabilities,
      codeSmells,
    } = parseIssuesResponse(issuesData);

    // Process hotspots and quality gate responses in parallel
    const [hotspots, qualityGate] = await Promise.all([
      parseHotspotsResponse(hotspotsResponse, warnings),
      parseQualityGateResponse(gateResponse, warnings),
    ]);

    return {
      success: true,
      data: {
        bugs,
        vulnerabilities,
        codeSmells,
        hotspots,
        qualityGate,
        total: totalIssues, // Use paging.total for accuracy
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    };
  } catch (error) {
    if (error.name === "AbortError") {
      return { success: false, error: "SonarCloud API: Request timed out" };
    }
    return { success: false, error: `SonarCloud API: ${error.message || "Network error"}` };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extract section content between a header and the next section
 * Uses bounded line-by-line matching to avoid regex backtracking DoS (SonarQube S5852)
 * @param {string} content - Full file content to search
 * @param {RegExp} headerPattern - Pattern to match section header (e.g., /^### Code Audits/)
 * @returns {string} Section content (empty string if section not found)
 */
function extractSection(content, headerPattern) {
  const lines = content.split("\n");
  let inSection = false;
  const sectionLines = [];

  for (const line of lines) {
    if (headerPattern.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      // Stop at next section header (### or ##)
      if (/^#{2,3}\s/.test(line)) {
        break;
      }
      sectionLines.push(line);
    }
  }

  return sectionLines.join("\n");
}

/**
 * Parse AUDIT_TRACKER.md to get per-category last audit dates
 * @param {string} content - Full content of AUDIT_TRACKER.md
 * @returns {Object<string, string|null>} Map of category names to ISO date strings (null if never audited)
 */
function getCategoryAuditDates(content) {
  const categories = {
    code: null,
    security: null,
    performance: null,
    refactoring: null,
    documentation: null,
    process: null,
  };

  for (const [category, headerPattern] of Object.entries(CATEGORY_HEADERS)) {
    const sectionContent = extractSection(content, headerPattern);
    if (sectionContent) {
      // Find the most recent date in the table
      const dateMatches = sectionContent.match(/\d{4}-\d{2}-\d{2}/g);
      if (dateMatches && dateMatches.length > 0) {
        // Get the most recent date, filtering out invalid dates
        const dates = dateMatches.map((d) => new Date(d).getTime()).filter((t) => !Number.isNaN(t));
        if (dates.length === 0) continue;
        const mostRecent = new Date(Math.max(...dates));
        categories[category] = mostRecent.toISOString().split("T")[0];
        verbose(`Found ${category} last audit: ${categories[category]}`);
      }
    }
  }

  return categories;
}

/**
 * Get the most recent multi-AI audit date from the Multi-AI Audit Log table
 * @param {string} content - Full content of AUDIT_TRACKER.md
 * @returns {string|null} ISO date string or null if no multi-AI audits found
 */
function getLastMultiAIAuditDate(content) {
  const sectionContent = extractSection(content, /^## Multi-AI Audit Log/);
  if (!sectionContent) return null;

  const dateMatches = sectionContent.match(/\d{4}-\d{2}-\d{2}/g);
  if (!dateMatches || dateMatches.length === 0) return null;

  const validTimestamps = dateMatches
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t));
  if (validTimestamps.length === 0) return null;

  return new Date(Math.max(...validTimestamps)).toISOString().split("T")[0];
}

/**
 * Get count of commits since a specific date (exclusive - starts from day AFTER the date)
 * Uses getNextDay() to fix false positives where commits earlier on the audit day were counted.
 * @param {string} sinceDate - ISO date string (YYYY-MM-DD) to count commits from
 * @returns {number} Number of commits since the date (0 if error or none)
 */
function getCommitsSince(sinceDate) {
  // Use next day to ensure we only count commits AFTER the audit day
  const afterDate = getNextDay(sinceDate);
  const result = safeExec(`git rev-list --count --since="${afterDate}" HEAD`, "count commits");
  return result.success ? Number.parseInt(result.output, 10) || 0 : 0;
}

/**
 * Get files modified since a date that match a given pattern (exclusive - starts from day AFTER the date)
 * Uses getNextDay() to fix false positives where commits earlier on the audit day were counted.
 * @param {string} sinceDate - ISO date string (YYYY-MM-DD) to find modifications from
 * @param {RegExp} pattern - Regex pattern to filter file paths
 * @returns {string[]} Array of matching file paths
 */
function getFilesModifiedSince(sinceDate, pattern) {
  // Use next day to ensure we only count files modified AFTER the audit day
  const afterDate = getNextDay(sinceDate);
  // Use git native output and JavaScript for filtering (more portable than shell pipes)
  const result = safeExec(
    `git log --since="${afterDate}" --name-only --pretty=format:`,
    "files modified"
  );

  if (!result.success || !result.output) {
    return [];
  }

  // Use Set for deduplication (replaces | sort -u)
  // Filter empty lines (replaces | grep -v "^$")
  const uniqueFiles = new Set(
    result.output
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean)
  );

  // Reset pattern.lastIndex before each test to prevent stateful regex issues
  return [...uniqueFiles].filter((f) => {
    pattern.lastIndex = 0;
    return pattern.test(f);
  });
}

/**
 * Get security-sensitive file changes since a date
 * @param {string} sinceDate - ISO date string (YYYY-MM-DD) to find changes from
 * @returns {string[]} Array of security-related file paths that changed
 */
function getSecuritySensitiveChanges(sinceDate) {
  // Use JavaScript filtering for cross-platform portability (no shell pipes)
  // Broad pattern to cast a wide net for security-sensitive changes
  const files = getFilesModifiedSince(sinceDate, /.*/);
  const securityPattern = /(auth|security|firebase|api|secrets|env|token|credential|\.env)/i;
  return files.filter((f) => securityPattern.test(f));
}

/**
 * Get CI/CD and hook file changes since a date
 * @param {string} sinceDate - ISO date string (YYYY-MM-DD) to find changes from
 * @returns {string[]} Array of process-related file paths that changed
 */
function getProcessChanges(sinceDate) {
  // Use JavaScript filtering for cross-platform portability (no shell pipes)
  const files = getFilesModifiedSince(sinceDate, /.*/);
  const processPattern = /(\.github|\.claude|\.husky|scripts\/)/;
  return files.filter((f) => processPattern.test(f));
}

/**
 * Check triggers for a specific category
 * Refactored to use generic file matching for all categories (removes special-case logic)
 * @param {string} category - Category name (code, security, performance, etc.)
 * @param {string} sinceDate - ISO date string of last audit for this category
 * @param {Object} thresholds - Category-specific threshold configuration
 * @param {number} thresholds.commits - Commit count threshold
 * @param {number} thresholds.files - File count threshold
 * @param {RegExp} thresholds.filePattern - Pattern to match relevant files
 * @param {RegExp} [thresholds.excludePattern] - Optional pattern to exclude files
 * @param {boolean} [thresholds.checkBundle] - Whether to check bundle config changes
 * @param {boolean} [thresholds.checkComplexity] - Whether to check for complexity warnings
 * @returns {{category: string, triggered: boolean, commits: number, filesChanged: number, reasons: string[], sinceDate: string}}
 */
function checkCategoryTriggers(category, sinceDate, thresholds) {
  const commits = getCommitsSince(sinceDate);
  let files = [];
  let triggered = false;
  const reasons = [];

  // Get files matching the category's file pattern (generic for all categories)
  files = getFilesModifiedSince(sinceDate, thresholds.filePattern);
  if (thresholds.excludePattern) {
    files = files.filter((f) => !thresholds.excludePattern.test(f));
  }

  // Check file threshold
  if (files.length >= thresholds.files) {
    triggered = true;
    reasons.push(`${files.length} ${category} file(s) changed (threshold: ${thresholds.files})`);
  }

  // Check commit threshold
  if (commits >= thresholds.commits) {
    triggered = true;
    reasons.push(`${commits} commits (threshold: ${thresholds.commits})`);
  }

  // Check bundle changes for performance category
  if (thresholds.checkBundle && isBundleChanged(sinceDate)) {
    triggered = true;
    reasons.push("Bundle configuration changed");
  }

  // Check complexity warnings for refactoring category
  if (thresholds.checkComplexity && hasComplexityWarnings()) {
    triggered = true;
    reasons.push("Complexity warnings detected");
  }

  return {
    category,
    triggered,
    commits,
    filesChanged: files.length,
    reasons,
    sinceDate,
  };
}

/**
 * Check if bundle configuration files changed since a date
 * Session #101: Removed package.json from check - it changes too frequently for non-bundle reasons
 * (e.g., adding npm scripts). Only check actual bundler config files.
 * @param {string} sinceDate - ISO date string (YYYY-MM-DD) to check from
 * @returns {boolean} True if next.config.* or webpack.config.js changed
 */
function isBundleChanged(sinceDate) {
  const bundleFiles = getFilesModifiedSince(
    sinceDate,
    /^(next\.config\.(js|mjs|ts)|webpack\.config\.js|vite\.config\.(js|ts)|rollup\.config\.(js|mjs))$/
  );
  return bundleFiles.length > 0;
}

/**
 * Check for complexity warnings via ESLint output
 * Searches for complexity-related warnings in lint output
 * @returns {boolean} True if complexity warnings detected
 */
function hasComplexityWarnings() {
  // Use String.raw to avoid escaping backslashes (SonarQube S6610)
  const result = safeExec(
    String.raw`npm run lint 2>&1 | grep -iE "(\bcomplexity\b|cyclomatic)" | head -1`,
    "complexity warnings"
  );

  if (!result.success) return false;
  return Boolean(result.output && result.output.trim());
}

/**
 * Check multi-AI escalation triggers (total commits, days since last multi-AI audit)
 * Single-session audits do NOT count toward multi-AI escalation.
 * @param {string|null} lastMultiAIDate - Date of last multi-AI audit (from Multi-AI Audit Log)
 * @param {Object<string, string|null>} categoryDates - Map of category names to last audit dates
 * @returns {Array<{type: string, daysSince?: number, commits?: number, threshold: number, message: string}>}
 */
function checkMultiAITriggers(lastMultiAIDate, categoryDates) {
  const triggers = [];

  // Check days since last multi-AI audit (not any audit)
  if (lastMultiAIDate) {
    const multiAITimestamp = new Date(lastMultiAIDate).getTime();
    if (!Number.isNaN(multiAITimestamp)) {
      const daysSince = Math.floor((Date.now() - multiAITimestamp) / (1000 * 60 * 60 * 24));
      if (daysSince >= MULTI_AI_THRESHOLDS.daysSinceAudit) {
        triggers.push({
          type: "time_elapsed",
          daysSince,
          threshold: MULTI_AI_THRESHOLDS.daysSinceAudit,
          message: `${daysSince} days since last multi-AI audit (threshold: ${MULTI_AI_THRESHOLDS.daysSinceAudit})`,
        });
      }
    }
  }

  // Check total commits since last multi-AI audit
  // Use multi-AI date if available, otherwise fall back to oldest category date
  const allDates = Object.values(categoryDates).filter((d) => d !== null);
  const validTimestamps = allDates
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t));
  const lastMultiAITs = lastMultiAIDate ? new Date(lastMultiAIDate).getTime() : NaN;
  const usingFallbackDate = Number.isNaN(lastMultiAITs);
  const sinceDate = !usingFallbackDate
    ? new Date(lastMultiAITs).toISOString().split("T")[0]
    : validTimestamps.length > 0
      ? new Date(Math.min(...validTimestamps)).toISOString().split("T")[0]
      : null;

  if (sinceDate) {
    const totalCommits = getCommitsSince(sinceDate);
    if (totalCommits >= MULTI_AI_THRESHOLDS.totalCommits) {
      const sinceLabel = usingFallbackDate ? "oldest category audit" : "last multi-AI audit";
      triggers.push({
        type: "total_commits",
        commits: totalCommits,
        threshold: MULTI_AI_THRESHOLDS.totalCommits,
        message: `${totalCommits} total commits since ${sinceLabel} (${sinceDate}) (threshold: ${MULTI_AI_THRESHOLDS.totalCommits})`,
      });
    }
  }

  return triggers;
}

/**
 * Print category results as formatted table
 * Extracted to reduce cognitive complexity of formatTextOutput (SonarQube S3776)
 * @param {Array<{category: string, triggered: boolean, commits: number, filesChanged: number, sinceDate: string}>} categoryResults - Results for each category
 * @returns {void}
 */
function printCategoryTable(categoryResults) {
  const rows = [["Category", "Last Audit", "Commits", "Files", "Status"]];

  for (const result of categoryResults) {
    const categoryName = result.category.charAt(0).toUpperCase() + result.category.slice(1);
    // Use hadPriorAudit flag instead of comparing to hardcoded date
    const lastAudit = result.hadPriorAudit ? result.sinceDate : "Never";
    const status = result.triggered ? "⚠️  TRIGGERED" : "✅ OK";
    rows.push([
      categoryName,
      lastAudit,
      result.commits.toString(),
      result.filesChanged.toString(),
      status,
    ]);
  }

  const colWidths = rows[0].map((_, i) => Math.max(...rows.map((r) => r[i].length)) + 2);
  for (const row of rows) {
    console.log(row.map((cell, i) => cell.padEnd(colWidths[i])).join(""));
  }
}

/**
 * Print triggered category details with reasons
 * Extracted to reduce cognitive complexity of formatTextOutput (SonarQube S3776)
 * @param {Array<{category: string, reasons: string[]}>} triggeredCategories - Categories with triggered thresholds
 * @returns {void}
 */
function printTriggeredDetails(triggeredCategories) {
  if (triggeredCategories.length === 0) return;

  console.log("\n--- Triggered Categories ---");
  for (const result of triggeredCategories) {
    console.log(`\n📋 ${result.category.toUpperCase()}:`);
    for (const reason of result.reasons) {
      console.log(`   - ${reason}`);
    }
    console.log(`   → Run: /audit-${result.category}`);
  }
}

/**
 * Print multi-AI escalation section
 * Extracted to reduce cognitive complexity of formatTextOutput (SonarQube S3776)
 * @param {Array<{message: string}>} multiAITriggers - Active multi-AI triggers
 * @returns {void}
 */
function printMultiAISection(multiAITriggers) {
  console.log("\n=== Multi-AI Audit Escalation ===\n");

  if (multiAITriggers.length > 0) {
    console.log("⚠️  Multi-AI Audit Recommended:");
    for (const trigger of multiAITriggers) {
      console.log(`   - ${trigger.message}`);
    }
  } else {
    console.log("✅ No multi-AI escalation triggers active.");
  }
}

/**
 * Print final recommendation summary
 * Extracted to reduce cognitive complexity of formatTextOutput (SonarQube S3776)
 * @param {Array<{category: string}>} triggeredCategories - Categories with triggered thresholds
 * @param {Array<Object>} multiAITriggers - Active multi-AI triggers
 * @returns {void}
 */
function printRecommendation(triggeredCategories, multiAITriggers) {
  console.log("\n--- Recommendation ---");

  if (triggeredCategories.length === 0 && multiAITriggers.length === 0) {
    console.log("✅ No review triggers active. Continue development.");
    return;
  }

  if (multiAITriggers.length > 0) {
    console.log(`🔴 ${multiAITriggers.length} multi-AI trigger(s) active!`);
    console.log("   Consider running full multi-AI audit.");
    return;
  }

  console.log(`🟡 ${triggeredCategories.length} single-session trigger(s) active.`);
  const commands = triggeredCategories.map((c) => `/audit-${c.category}`).join(", ");
  console.log(`   Run: ${commands}`);
}

/**
 * Print SonarCloud metrics section
 * @param {{bugs: number, vulnerabilities: number, codeSmells: number, hotspots: number, qualityGate: string, total: number}|null} sonarData - SonarCloud data or null if unavailable
 * @param {string|null} sonarError - Error message if fetch failed
 * @returns {void}
 */
function printSonarCloudSection(sonarData, sonarError) {
  console.log("\n=== SonarCloud Metrics ===\n");

  if (sonarError) {
    console.log(`⚠️  ${sonarError}`);
    return;
  }

  if (!sonarData) {
    console.log("ℹ️  SonarCloud not queried (use --sonarcloud flag)");
    return;
  }

  const gateIcon =
    sonarData.qualityGate === "OK" ? "✅" : sonarData.qualityGate === "ERROR" ? "❌" : "⚠️";
  console.log(`Quality Gate: ${gateIcon} ${sonarData.qualityGate}`);
  console.log(`\nIssue Counts:`);
  console.log(`  Bugs:            ${sonarData.bugs}`);
  console.log(`  Vulnerabilities: ${sonarData.vulnerabilities}`);
  console.log(`  Code Smells:     ${sonarData.codeSmells}`);
  console.log(`  Security Hotspots: ${sonarData.hotspots} (TO_REVIEW)`);
  console.log(`  Total Issues:    ${sonarData.total}`);

  // Show warnings for partial API failures
  if (sonarData.warnings && sonarData.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    for (const warning of sonarData.warnings) {
      console.log(`   - ${warning}`);
    }
  }
}

/**
 * Format human-readable output to console
 * Refactored to reduce cognitive complexity by extracting helper functions (SonarQube S3776)
 * @param {Array<{category: string, triggered: boolean, commits: number, filesChanged: number, reasons: string[], sinceDate: string}>} categoryResults - Results for each category
 * @param {Array<{type: string, message: string, threshold: number}>} multiAITriggers - Active multi-AI triggers
 * @param {{data?: Object, error?: string}|null} sonarResult - SonarCloud fetch result (optional)
 * @returns {void}
 */
function formatTextOutput(categoryResults, multiAITriggers, sonarResult = null) {
  console.log("🔍 Checking Review Triggers...\n");
  console.log("=== Per-Category Single-Session Audit Triggers ===\n");

  printCategoryTable(categoryResults);

  const triggeredCategories = categoryResults.filter((r) => r.triggered);
  printTriggeredDetails(triggeredCategories);
  printMultiAISection(multiAITriggers);

  // Show SonarCloud section if enabled or data available
  if (SONARCLOUD_ENABLED || sonarResult) {
    printSonarCloudSection(sonarResult?.data || null, sonarResult?.error || null);
  }

  printRecommendation(triggeredCategories, multiAITriggers);
}

/**
 * Build recommendation string based on trigger state
 * @param {boolean} reviewNeeded - Whether any review is needed
 * @param {Array} multiAITriggers - Multi-AI escalation triggers
 * @param {Array} triggeredCategories - Categories with active triggers
 * @returns {string} Recommendation message
 */
function buildRecommendation(reviewNeeded, multiAITriggers, triggeredCategories) {
  if (!reviewNeeded) {
    return "No review triggers active. Continue development.";
  }
  if (multiAITriggers.length > 0) {
    return `${multiAITriggers.length} multi-AI trigger(s) active. Consider running full multi-AI audit.`;
  }
  const commands = triggeredCategories.map((c) => `/audit-${c.category}`).join(", ");
  return `${triggeredCategories.length} single-session trigger(s) active. Run: ${commands}`;
}

/**
 * Build workflow-compatible triggers object for JSON output
 * @param {Array} categoryResults - Results from category checks
 * @returns {object} Triggers object with metrics
 */
function buildTriggersObject(categoryResults) {
  const triggers = {};
  for (const result of categoryResults) {
    const thresholds = CATEGORY_THRESHOLDS[result.category];
    // Use optional chaining to handle missing thresholds gracefully (Review #184 - Qodo)
    triggers[result.category] = {
      triggered: result.triggered,
      hadPriorAudit: result.hadPriorAudit,
      commits: { value: result.commits, threshold: thresholds?.commits ?? null },
      files: { value: result.filesChanged, threshold: thresholds?.files ?? null },
      reasons: result.reasons,
    };
  }
  return triggers;
}

/**
 * Get the repository's first commit date as a fallback baseline
 * Prevents false-positive triggers when AUDIT_TRACKER.md is missing
 * @returns {string} ISO date string of first commit, or '2025-01-01' if unavailable
 */
function getRepoStartDate() {
  // Use git native -1 flag instead of shell pipe (more portable)
  const result = safeExec("git log --reverse -1 --format=%cs", "repository start date");
  return result.success && result.output ? sanitizeDateString(result.output) : "2025-01-01";
}

/**
 * Main function - orchestrates review trigger checking
 * Reads AUDIT_TRACKER.md, checks per-category thresholds, and outputs results
 * @returns {Promise<void>} Exits with code 0 (no review needed), 1 (review recommended), or 2 (error)
 */
async function main() {
  // Read AUDIT_TRACKER.md
  const trackerResult = safeReadFile(TRACKER_PATH, "AUDIT_TRACKER.md");
  const trackerContent = trackerResult.success ? trackerResult.content : "";

  if (!trackerResult.success && !JSON_OUTPUT) {
    console.warn(`⚠️  Warning: ${trackerResult.error}`);
    console.warn("   Using default baseline values (no prior audits)\n");
  }

  // Get repository start date as fallback for missing audit dates
  const repoStartDate = getRepoStartDate();

  // Get per-category audit dates and last multi-AI audit date
  const categoryDates = getCategoryAuditDates(trackerContent);
  const lastMultiAIDate = getLastMultiAIAuditDate(trackerContent);

  // Check each category
  const categoriesToCheck = SPECIFIC_CATEGORY
    ? [SPECIFIC_CATEGORY]
    : Object.keys(CATEGORY_THRESHOLDS);

  const categoryResults = [];

  for (const category of categoriesToCheck) {
    const thresholds = CATEGORY_THRESHOLDS[category];
    if (!thresholds) {
      if (JSON_OUTPUT) {
        console.log(JSON.stringify({ error: `Unknown category: ${category}` }));
      } else {
        console.error(`Unknown category: ${category}`);
      }
      process.exit(2);
    }

    // Use repo start date as fallback instead of hardcoded '2025-01-01'
    const hadPriorAudit = categoryDates[category] !== null;
    const baselineDate = categoryDates[category] || repoStartDate;
    const sinceDate = sanitizeDateString(baselineDate);
    const result = checkCategoryTriggers(category, sinceDate, thresholds);
    result.hadPriorAudit = hadPriorAudit;
    categoryResults.push(result);
  }

  // Check multi-AI escalation (uses multi-AI audit date, not single-session dates)
  const multiAITriggers = checkMultiAITriggers(lastMultiAIDate, categoryDates);

  // Fetch SonarCloud data if enabled
  let sonarResult = null;
  if (SONARCLOUD_ENABLED) {
    sonarResult = await fetchSonarCloudData();
  }

  // Calculate review needed
  const reviewNeeded = categoryResults.some((r) => r.triggered) || multiAITriggers.length > 0;
  const triggeredCategories = categoryResults.filter((r) => r.triggered);
  const recommendation = buildRecommendation(reviewNeeded, multiAITriggers, triggeredCategories);

  // Output results
  if (JSON_OUTPUT) {
    const triggers = buildTriggersObject(categoryResults);

    const output = {
      // Workflow-compatible fields
      triggers,
      recommendation,
      // Detailed fields
      categoryResults,
      multiAITriggers,
      reviewNeeded,
    };

    // Include SonarCloud data if available
    if (sonarResult) {
      output.sonarcloud = sonarResult.success
        ? { success: true, data: sonarResult.data }
        : { success: false, error: sonarResult.error };
    }

    console.log(JSON.stringify(output, null, 2));
  } else {
    formatTextOutput(categoryResults, multiAITriggers, sonarResult);
  }

  // Exit code
  process.exit(reviewNeeded ? 1 : 0);
}

// Run
main().catch((error) => {
  const msg = sanitizeError(error);
  if (JSON_OUTPUT) {
    console.log(JSON.stringify({ error: msg }));
  } else {
    console.error("❌ Unexpected error:", msg);
  }
  process.exit(2);
});
