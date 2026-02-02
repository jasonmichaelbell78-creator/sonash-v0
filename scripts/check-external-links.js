#!/usr/bin/env node
/**
 * External Link Validation Script
 *
 * Checks external URLs in documentation for validity.
 *
 * Features:
 * - HTTP HEAD requests with 10-second timeout
 * - Rate limiting (100ms delay between same domain)
 * - Result caching (don't recheck same URL in same run)
 * - JSONL output with URL, status, redirect info, response time
 *
 * Usage: node scripts/check-external-links.js [options] [files...]
 *
 * Options:
 *   --output <file>   Output JSONL file (default: stdout)
 *   --verbose         Show detailed logging
 *   --quiet           Only output errors
 *   --timeout <ms>    Request timeout in ms (default: 10000)
 *   --json            Output as JSON array instead of JSONL
 *
 * Exit codes:
 *   0 - All links valid
 *   1 - Some links failed
 *   2 - Script error
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";
import http from "node:http";
import { sanitizeError } from "./lib/sanitize-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// Parse command line arguments
const args = process.argv.slice(2);
const VERBOSE = args.includes("--verbose");
const QUIET = args.includes("--quiet");
const JSON_OUTPUT = args.includes("--json");
const outputIdx = args.indexOf("--output");
const OUTPUT_FILE = outputIdx !== -1 ? args[outputIdx + 1] : null;
const timeoutIdx = args.indexOf("--timeout");
const TIMEOUT_MS = timeoutIdx !== -1 ? parseInt(args[timeoutIdx + 1], 10) : 10000;
const fileArgs = args.filter(
  (a, i) => !a.startsWith("--") && args[i - 1] !== "--output" && args[i - 1] !== "--timeout"
);

// URL cache to avoid rechecking same URL
const urlCache = new Map();

// Domain rate limiting - track last request time per domain
const domainLastRequest = new Map();
const RATE_LIMIT_MS = 100;

/**
 * Extract external URLs from markdown content
 * @param {string} content - Markdown content
 * @param {string} filePath - Source file path for reporting
 * @returns {Array<{url: string, line: number, text: string, file: string}>}
 */
function extractExternalUrls(content, filePath) {
  const urls = [];
  const lines = content.split("\n");
  const relPath = relative(ROOT, filePath);

  for (let i = 0; i < lines.length; i++) {
    // Match [text](url) links
    const linkPattern = /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
    linkPattern.lastIndex = 0;
    let match;

    while ((match = linkPattern.exec(lines[i])) !== null) {
      urls.push({
        url: match[2],
        line: i + 1,
        text: match[1] || "",
        file: relPath,
      });
    }

    // Match bare URLs (not in markdown link syntax)
    const bareUrlPattern = /(?<!\]\()https?:\/\/[^\s<>)\]]+/g;
    bareUrlPattern.lastIndex = 0;
    while ((match = bareUrlPattern.exec(lines[i])) !== null) {
      // Check if this URL is part of a markdown link (already captured above)
      const urlInLink = urls.some((u) => u.line === i + 1 && lines[i].includes(`](${match[0]}`));
      if (!urlInLink) {
        urls.push({
          url: match[0],
          line: i + 1,
          text: "",
          file: relPath,
        });
      }
    }
  }

  return urls;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Apply rate limiting for a domain
 */
async function rateLimitDomain(domain) {
  const lastRequest = domainLastRequest.get(domain);
  if (lastRequest) {
    const elapsed = Date.now() - lastRequest;
    if (elapsed < RATE_LIMIT_MS) {
      await sleep(RATE_LIMIT_MS - elapsed);
    }
  }
  domainLastRequest.set(domain, Date.now());
}

/**
 * Check a single URL with HTTP HEAD request
 * @param {string} urlString - URL to check
 * @returns {Promise<{status: number|string, ok: boolean, redirect?: string, responseTime: number, error?: string}>}
 */
async function checkUrl(urlString) {
  // Check cache first
  if (urlCache.has(urlString)) {
    return urlCache.get(urlString);
  }

  const startTime = Date.now();
  let result;

  try {
    const url = new URL(urlString);
    const isHttps = url.protocol === "https:";
    const httpModule = isHttps ? https : http;

    // Apply rate limiting
    await rateLimitDomain(url.hostname);

    result = await new Promise((resolve) => {
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: "HEAD",
        timeout: TIMEOUT_MS,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; DocLinkChecker/1.0)",
          Accept: "*/*",
        },
        // Allow self-signed certs in non-production
        rejectUnauthorized: true,
      };

      const req = httpModule.request(options, (res) => {
        const responseTime = Date.now() - startTime;
        const status = res.statusCode;
        const isRedirect = status >= 300 && status < 400;
        const redirect = isRedirect ? res.headers.location : undefined;

        // Follow one redirect to check final destination
        if (isRedirect && redirect) {
          resolve({
            status,
            ok: false,
            redirect,
            responseTime,
            note: `Redirects to: ${redirect}`,
          });
        } else {
          resolve({
            status,
            ok: status >= 200 && status < 400,
            responseTime,
          });
        }
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({
          status: "TIMEOUT",
          ok: false,
          responseTime: TIMEOUT_MS,
          error: `Request timed out after ${TIMEOUT_MS}ms`,
        });
      });

      req.on("error", (err) => {
        const responseTime = Date.now() - startTime;
        let error = err.message;

        // Categorize common errors
        if (err.code === "ENOTFOUND") {
          error = "DNS lookup failed";
        } else if (err.code === "ECONNREFUSED") {
          error = "Connection refused";
        } else if (err.code === "ECONNRESET") {
          error = "Connection reset";
        } else if (err.code === "CERT_HAS_EXPIRED") {
          error = "SSL certificate expired";
        } else if (err.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
          error = "SSL certificate verification failed";
        } else if (err.code === "DEPTH_ZERO_SELF_SIGNED_CERT") {
          error = "Self-signed certificate";
        }

        resolve({
          status: err.code || "ERROR",
          ok: false,
          responseTime,
          error,
        });
      });

      req.end();
    });
  } catch (err) {
    result = {
      status: "INVALID_URL",
      ok: false,
      responseTime: Date.now() - startTime,
      error: `Invalid URL: ${sanitizeError(err)}`,
    };
  }

  // Cache the result
  urlCache.set(urlString, result);
  return result;
}

/**
 * Find all markdown files recursively
 */
function findMarkdownFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    // Skip excluded directories
    if (
      entry.startsWith(".") ||
      entry === "node_modules" ||
      entry === "out" ||
      entry === "dist" ||
      entry === "archive"
    ) {
      continue;
    }

    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        findMarkdownFiles(fullPath, files);
      } else if (extname(entry) === ".md") {
        files.push(fullPath);
      }
    } catch {
      // Skip files we can't stat
    }
  }

  return files;
}

/**
 * Generate JSONL finding for a failed link
 */
function generateFinding(urlInfo, checkResult) {
  const severity = checkResult.status === 404 ? "S1" : "S2";
  const effort = "E0"; // Fixing a broken link is trivial

  return {
    id: `DOC-LINK-EXT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    category: "documentation",
    severity,
    effort,
    confidence: "HIGH",
    verified: "TOOL_VALIDATED",
    file: urlInfo.file,
    line: urlInfo.line,
    title: `Broken external link: ${checkResult.status}`,
    description: `External link to ${urlInfo.url} ${checkResult.error ? `failed: ${checkResult.error}` : `returned status ${checkResult.status}`}`,
    recommendation: checkResult.redirect
      ? `Update link to: ${checkResult.redirect}`
      : "Remove or update the broken link",
    evidence: [
      `URL: ${urlInfo.url}`,
      `Status: ${checkResult.status}`,
      `Response time: ${checkResult.responseTime}ms`,
      checkResult.error ? `Error: ${checkResult.error}` : null,
      checkResult.redirect ? `Redirect: ${checkResult.redirect}` : null,
    ].filter(Boolean),
    cross_ref: "external_link_check",
  };
}

/**
 * Main function
 */
async function main() {
  if (!QUIET) {
    console.log("🔗 Checking external links in documentation...\n");
  }

  // Determine files to check
  const filesToCheck =
    fileArgs.length > 0 ? fileArgs.filter((f) => existsSync(f)) : findMarkdownFiles(ROOT);

  if (filesToCheck.length === 0) {
    console.log("No markdown files found to check.");
    process.exit(0);
  }

  if (!QUIET) {
    console.log(`Scanning ${filesToCheck.length} file(s) for external URLs...\n`);
  }

  // Extract all URLs from all files
  const allUrls = [];
  for (const file of filesToCheck) {
    try {
      const content = readFileSync(file, "utf-8");
      const urls = extractExternalUrls(content, file);
      allUrls.push(...urls);
    } catch (err) {
      if (!QUIET) {
        console.warn(`Warning: Could not read ${relative(ROOT, file)}: ${sanitizeError(err)}`);
      }
    }
  }

  // Deduplicate URLs for checking (but keep all references for reporting)
  const uniqueUrls = [...new Set(allUrls.map((u) => u.url))];

  if (!QUIET) {
    console.log(`Found ${allUrls.length} URL references (${uniqueUrls.length} unique URLs)\n`);
  }

  // Check each unique URL
  const results = [];
  let checked = 0;
  let failed = 0;

  for (const url of uniqueUrls) {
    checked++;

    if (VERBOSE) {
      console.log(`[${checked}/${uniqueUrls.length}] Checking: ${url.substring(0, 60)}...`);
    }

    const checkResult = await checkUrl(url);

    // Find all references to this URL
    const urlRefs = allUrls.filter((u) => u.url === url);

    for (const urlInfo of urlRefs) {
      const finding = {
        url: urlInfo.url,
        file: urlInfo.file,
        line: urlInfo.line,
        text: urlInfo.text,
        status: checkResult.status,
        ok: checkResult.ok,
        responseTime: checkResult.responseTime,
        redirect: checkResult.redirect,
        error: checkResult.error,
      };

      results.push(finding);

      if (!checkResult.ok) {
        failed++;
      }
    }

    if (!checkResult.ok && !QUIET) {
      console.log(
        `  ❌ ${url.substring(0, 50)}... → ${checkResult.status}${checkResult.error ? ` (${checkResult.error})` : ""}`
      );
    }
  }

  // Generate JSONL findings for failed links
  const findings = results.filter((r) => !r.ok).map((r) => generateFinding(r, r));

  // Output results
  if (OUTPUT_FILE) {
    const output = JSON_OUTPUT
      ? JSON.stringify(findings, null, 2)
      : findings.map((f) => JSON.stringify(f)).join("\n");

    writeFileSync(OUTPUT_FILE, output + "\n");

    if (!QUIET) {
      console.log(`\n📄 Results written to: ${OUTPUT_FILE}`);
    }
  } else if (JSON_OUTPUT) {
    console.log(JSON.stringify(findings, null, 2));
  } else if (findings.length > 0) {
    console.log("\n📋 JSONL Findings:\n");
    for (const finding of findings) {
      console.log(JSON.stringify(finding));
    }
  }

  // Summary
  if (!QUIET) {
    console.log("\n─".repeat(50));
    console.log("\n📊 Summary:");
    console.log(`   URLs checked: ${uniqueUrls.length}`);
    console.log(`   Total references: ${allUrls.length}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Passed: ${results.filter((r) => r.ok).length}`);

    if (failed === 0) {
      console.log("\n✅ All external links are valid!");
    } else {
      console.log(`\n❌ ${failed} broken link(s) found.`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run main function
try {
  main();
} catch (error) {
  console.error("❌ Unexpected error:", sanitizeError(error));
  process.exit(2);
}
