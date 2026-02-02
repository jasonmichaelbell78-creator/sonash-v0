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
import { join, dirname, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import dns from "node:dns/promises";
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
const TIMEOUT_MS = timeoutIdx !== -1 ? Number.parseInt(args[timeoutIdx + 1], 10) : 10000;

// Validate timeout is a positive finite integer
if (
  timeoutIdx !== -1 &&
  (!Number.isFinite(TIMEOUT_MS) || TIMEOUT_MS <= 0 || !Number.isInteger(TIMEOUT_MS))
) {
  console.error("Error: --timeout must be a positive integer");
  process.exit(2);
}

const fileArgs = args.filter(
  (a, i) => !a.startsWith("--") && args[i - 1] !== "--output" && args[i - 1] !== "--timeout"
);

// URL cache to avoid rechecking same URL
const urlCache = new Map();

// Domain rate limiting - track last request time per domain
const domainLastRequest = new Map();
const RATE_LIMIT_MS = 100;

/**
 * SSRF Protection: Check if an IP address is in a private/internal range
 * Blocks: localhost, RFC1918, link-local (cloud metadata), IPv6 equivalents
 * @param {string} ip - IP address to check
 * @returns {boolean} - true if IP is internal/blocked
 */
function isInternalIP(ip) {
  // IPv4 checks
  if (ip.includes(".")) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) {
      return true; // Invalid IP format, block it
    }

    const [a, b, c, d] = parts;

    // 127.0.0.0/8 - Loopback (localhost)
    if (a === 127) return true;

    // 10.0.0.0/8 - RFC1918 Private
    if (a === 10) return true;

    // 172.16.0.0/12 - RFC1918 Private (172.16.x.x - 172.31.x.x)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.168.0.0/16 - RFC1918 Private
    if (a === 192 && b === 168) return true;

    // 169.254.0.0/16 - Link-local (AWS/GCP/Azure metadata at 169.254.169.254)
    if (a === 169 && b === 254) return true;

    // 0.0.0.0/8 - Current network
    if (a === 0) return true;

    // 224.0.0.0/4 - Multicast
    if (a >= 224 && a <= 239) return true;

    // 240.0.0.0/4 - Reserved
    if (a >= 240) return true;
  }

  // IPv6 checks
  if (ip.includes(":")) {
    const normalized = ip.toLowerCase();

    // ::1 - IPv6 loopback
    if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

    // fc00::/7 - Unique local addresses (fd00::/8 and fc00::/8)
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

    // fe80::/10 - Link-local
    if (
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb")
    )
      return true;

    // :: - Unspecified address
    if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

    // IPv4-mapped IPv6 (::ffff:x.x.x.x)
    const ipv4MappedMatch = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (ipv4MappedMatch) {
      return isInternalIP(ipv4MappedMatch[1]);
    }
  }

  return false;
}

/**
 * Resolve hostname and check if it resolves to an internal IP (SSRF protection)
 * @param {string} hostname - Hostname to check
 * @returns {Promise<{safe: boolean, error?: string}>}
 */
async function checkHostnameSafe(hostname) {
  try {
    // Resolve hostname to IP addresses
    const addresses = await dns.resolve4(hostname).catch(() => []);
    const addresses6 = await dns.resolve6(hostname).catch(() => []);
    const allAddresses = [...addresses, ...addresses6];

    if (allAddresses.length === 0) {
      // Could not resolve - will fail later with DNS error
      return { safe: true };
    }

    // Check all resolved IPs
    for (const ip of allAddresses) {
      if (isInternalIP(ip)) {
        return {
          safe: false,
          error: `SSRF blocked: ${hostname} resolves to internal IP ${ip}`,
        };
      }
    }

    return { safe: true };
  } catch (err) {
    // DNS resolution error - let the actual request handle it
    return { safe: true };
  }
}

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
 * Make an HTTP request with the specified method
 * @param {URL} url - Parsed URL object
 * @param {string} method - HTTP method (HEAD or GET)
 * @param {number} startTime - Request start timestamp for timing
 * @returns {Promise<{status: number|string, ok: boolean, redirect?: string, responseTime: number, error?: string}>}
 */
function makeRequest(url, method, startTime) {
  const isHttps = url.protocol === "https:";
  const httpModule = isHttps ? https : http;

  return new Promise((resolve) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
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

      // Redirects (3xx) are valid responses - the link works, it just redirects
      // We note the redirect destination but mark it as ok: true
      if (isRedirect && redirect) {
        resolve({
          status,
          ok: true,
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

      // Consume response data to free up memory
      res.resume();
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
}

/**
 * Check a single URL with HTTP HEAD request (falls back to GET on 405)
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

    // SSRF Protection: Check if hostname resolves to internal IP
    const ssrfCheck = await checkHostnameSafe(url.hostname);
    if (!ssrfCheck.safe) {
      result = {
        status: "SSRF_BLOCKED",
        ok: false,
        responseTime: Date.now() - startTime,
        error: ssrfCheck.error,
      };
      urlCache.set(urlString, result);
      return result;
    }

    // Apply rate limiting
    await rateLimitDomain(url.hostname);

    // Try HEAD first
    result = await makeRequest(url, "HEAD", startTime);

    // If server returns 405 Method Not Allowed, retry with GET
    if (result.status === 405) {
      if (VERBOSE) {
        console.log(`  HEAD rejected (405), retrying with GET...`);
      }
      result = await makeRequest(url, "GET", Date.now());
    }
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
    description: checkResult.error
      ? `External link to ${urlInfo.url} failed: ${checkResult.error}`
      : `External link to ${urlInfo.url} returned status ${checkResult.status}`,
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
      const errorSuffix = checkResult.error ? ` (${checkResult.error})` : "";
      console.log(`  ❌ ${url.substring(0, 50)}... → ${checkResult.status}${errorSuffix}`);
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

// Run main function with top-level await (ESM)
try {
  await main();
} catch (error) {
  console.error("Unexpected error:", sanitizeError(error));
  process.exit(2);
}
