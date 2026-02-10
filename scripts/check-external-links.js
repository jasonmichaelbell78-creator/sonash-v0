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

// Validate --output has a value
const outputIdx = args.indexOf("--output");
if (outputIdx >= 0 && (outputIdx + 1 >= args.length || args[outputIdx + 1].startsWith("--"))) {
  console.error("Error: --output requires a file path argument");
  process.exit(2);
}
const OUTPUT_FILE = outputIdx >= 0 ? args[outputIdx + 1] : null;

// Validate --timeout has a value
const timeoutIdx = args.indexOf("--timeout");
if (timeoutIdx >= 0 && (timeoutIdx + 1 >= args.length || args[timeoutIdx + 1].startsWith("--"))) {
  console.error("Error: --timeout requires a numeric argument");
  process.exit(2);
}
const TIMEOUT_MS = timeoutIdx >= 0 ? Number.parseInt(args[timeoutIdx + 1], 10) : 10000;

// Validate timeout is a positive finite integer
if (
  timeoutIdx >= 0 &&
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
 * Sanitize URL for logging - removes query strings, fragments, and userinfo
 * to prevent leaking sensitive tokens/credentials in logs
 * @param {string} urlString - URL to sanitize
 * @returns {string} - Sanitized URL with only scheme, host, and path
 */
function sanitizeUrlForLogging(urlString) {
  try {
    const url = new URL(urlString);
    // Reconstruct URL with only safe parts (no userinfo, query, or fragment)
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    // If URL parsing fails, return a redacted version
    return "[invalid URL]";
  }
}

/**
 * Check if an IPv4 address is in a private/internal range
 * @param {string} ip - IPv4 address string
 * @returns {boolean} - true if internal
 */
function isInternalIPv4(ip) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) {
    return true; // Invalid IP format, block it
  }

  const [a, b] = parts;

  if (a === 127) return true; // 127.0.0.0/8 - Loopback
  if (a === 10) return true; // 10.0.0.0/8 - RFC1918
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 - RFC1918
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 - RFC1918
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 - Link-local
  if (a === 0) return true; // 0.0.0.0/8 - Current network
  if (a >= 224 && a <= 239) return true; // 224.0.0.0/4 - Multicast
  if (a >= 240) return true; // 240.0.0.0/4 - Reserved

  return false;
}

/**
 * Check if an IPv6 address is in a private/internal range
 * @param {string} ip - IPv6 address string
 * @returns {boolean} - true if internal
 */
function isInternalIPv6(ip) {
  const normalized = ip.toLowerCase();

  // Loopback
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

  // Unique local addresses (fc00::/7)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // Link-local (fe80::/10)
  if (/^fe[89ab]/.test(normalized)) return true;

  // Unspecified address
  if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  const ipv4MappedMatch = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (ipv4MappedMatch) {
    return isInternalIPv4(ipv4MappedMatch[1]);
  }

  return false;
}

/**
 * SSRF Protection: Check if an IP address is in a private/internal range
 * Blocks: localhost, RFC1918, link-local (cloud metadata), IPv6 equivalents
 * @param {string} ip - IP address to check
 * @returns {boolean} - true if IP is internal/blocked
 */
function isInternalIP(ip) {
  if (ip.includes(".")) return isInternalIPv4(ip);
  if (ip.includes(":")) return isInternalIPv6(ip);
  return false;
}

/**
 * Resolve hostname and check if it resolves to an internal IP (SSRF protection)
 * @param {string} hostname - Hostname to check
 * @returns {Promise<{safe: boolean, error?: string}>}
 */
async function checkHostnameSafe(hostname) {
  // SSRF Protection: If hostname is an IP literal, validate directly
  // This prevents bypass where attacker uses http://127.0.0.1/ or http://169.254.169.254/
  //
  // Known limitation: DNS rebinding attacks
  // This pre-flight check resolves DNS once, but the actual HTTP request resolves again.
  // An attacker could theoretically have a DNS record that alternates between external and
  // internal IPs (rebinding). Mitigating this fully would require making requests to the
  // resolved IP directly with Host header override, which is more complex and breaks some
  // sites. For a documentation link checker, this risk is acceptable.
  const ipv4Literal = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
  const ipv6Literal = hostname.includes(":") && /^[0-9a-fA-F:]+$/.test(hostname);
  if (ipv4Literal || ipv6Literal) {
    if (isInternalIP(hostname)) {
      return { safe: false, error: `SSRF blocked: URL targets internal IP ${hostname}` };
    }
    return { safe: true };
  }

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
    // Empty catch is intentional: DNS errors shouldn't block URL checking,
    // as the actual HTTP request will properly report the DNS failure
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
    const linkPattern = /\[([^\]]{0,1000})\]\((https?:\/\/[^)\s]{1,1000})\)/g;
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

    const req = httpModule.request(options, async (res) => {
      const responseTime = Date.now() - startTime;
      const status = res.statusCode;
      const isRedirect = status >= 300 && status < 400;
      const redirect = isRedirect ? res.headers.location : undefined;

      // Redirects (3xx) are valid responses - the link works, it just redirects
      // We note the redirect destination but mark it as ok: true
      if (isRedirect && redirect) {
        // SSRF Protection: Validate redirect target to prevent redirect-based SSRF attacks
        // An attacker could use a safe-looking URL that redirects to 169.254.169.254
        try {
          const redirectUrl = new URL(redirect, url.href);
          const redirectHostname = redirectUrl.hostname;

          // Check if redirect hostname is an IP literal
          const ipv4Literal = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(redirectHostname);
          const ipv6Literal =
            redirectHostname.includes(":") && /^[0-9a-fA-F:]+$/.test(redirectHostname);

          if (ipv4Literal || ipv6Literal) {
            // Direct IP literal - check immediately
            if (isInternalIP(redirectHostname)) {
              resolve({
                status: "SSRF_BLOCKED",
                ok: false,
                responseTime,
                redirect,
                error: `SSRF blocked: Redirect targets internal IP ${redirectHostname}`,
              });
              res.resume();
              return;
            }
          } else {
            // Hostname - resolve and check
            const ssrfCheck = await checkHostnameSafe(redirectHostname);
            if (!ssrfCheck.safe) {
              resolve({
                status: "SSRF_BLOCKED",
                ok: false,
                responseTime,
                redirect,
                error: ssrfCheck.error,
              });
              res.resume();
              return;
            }
          }
        } catch {
          // Invalid redirect URL - let it fail naturally
        }

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
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    // Skip directories we can't read (permissions, etc.)
    return files;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    // Skip excluded directories (hidden files/folders start with .)
    if (
      entry[0] === "." ||
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
  // Sanitize URL to prevent leaking query strings/tokens in logs
  const safeUrl = sanitizeUrlForLogging(urlInfo.url);
  const safeRedirect = checkResult.redirect ? sanitizeUrlForLogging(checkResult.redirect) : null;

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
      ? `External link to ${safeUrl} failed: ${checkResult.error}`
      : `External link to ${safeUrl} returned status ${checkResult.status}`,
    recommendation: safeRedirect
      ? `Update link to: ${safeRedirect}`
      : "Remove or update the broken link",
    evidence: [
      `URL: ${safeUrl}`,
      `Status: ${checkResult.status}`,
      `Response time: ${checkResult.responseTime}ms`,
      checkResult.error ? `Error: ${checkResult.error}` : null,
      safeRedirect ? `Redirect: ${safeRedirect}` : null,
    ].filter(Boolean),
    cross_ref: "external_link_check",
  };
}

/**
 * Extract all URLs from the given files
 * @returns {Array<{url: string, line: number, text: string, file: string}>}
 */
function collectUrlsFromFiles(filesToCheck) {
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
  return allUrls;
}

/**
 * Check all unique URLs and build results array
 * @returns {Promise<{results: object[], failed: number}>}
 */
async function checkAllUrls(allUrls, uniqueUrls) {
  const results = [];
  let checked = 0;
  let failedUrls = 0;

  for (const url of uniqueUrls) {
    checked++;
    if (VERBOSE) {
      console.log(`[${checked}/${uniqueUrls.length}] Checking: ${sanitizeUrlForLogging(url)}...`);
    }

    const checkResult = await checkUrl(url);
    const urlRefs = allUrls.filter((u) => u.url === url);

    for (const urlInfo of urlRefs) {
      results.push({
        url: urlInfo.url,
        file: urlInfo.file,
        line: urlInfo.line,
        text: urlInfo.text,
        status: checkResult.status,
        ok: checkResult.ok,
        responseTime: checkResult.responseTime,
        redirect: checkResult.redirect,
        error: checkResult.error,
      });
    }

    if (!checkResult.ok) failedUrls++;

    if (!checkResult.ok && !QUIET) {
      const errorSuffix = checkResult.error ? ` (${checkResult.error})` : "";
      console.log(`  ❌ ${sanitizeUrlForLogging(url)} → ${checkResult.status}${errorSuffix}`);
    }
  }

  return { results, failed: failedUrls };
}

/**
 * Write findings output to file or stdout
 */
function outputFindings(findings) {
  if (OUTPUT_FILE) {
    const output = JSON_OUTPUT
      ? JSON.stringify(findings, null, 2)
      : findings.map((f) => JSON.stringify(f)).join("\n");
    writeFileSync(OUTPUT_FILE, output + "\n");
    if (!QUIET) console.log(`\n📄 Results written to: ${OUTPUT_FILE}`);
  } else if (JSON_OUTPUT) {
    console.log(JSON.stringify(findings, null, 2));
  } else if (findings.length > 0) {
    console.log("\n📋 JSONL Findings:\n");
    for (const finding of findings) {
      console.log(JSON.stringify(finding));
    }
  }
}

/**
 * Print summary of link check results
 */
function printLinkSummary(uniqueUrlCount, totalRefCount, results, failed) {
  if (QUIET) return;
  console.log("\n─".repeat(50));
  console.log("\n📊 Summary:");
  console.log(`   URLs checked: ${uniqueUrlCount}`);
  console.log(`   Total references: ${totalRefCount}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Passed: ${results.filter((r) => r.ok).length}`);
  console.log(
    failed === 0 ? "\n✅ All external links are valid!" : `\n❌ ${failed} broken link(s) found.`
  );
}

/**
 * Main function
 */
async function main() {
  if (!QUIET) {
    console.log("🔗 Checking external links in documentation...\n");
  }

  const filesToCheck =
    fileArgs.length > 0 ? fileArgs.filter((f) => existsSync(f)) : findMarkdownFiles(ROOT);

  if (filesToCheck.length === 0) {
    console.log("No markdown files found to check.");
    process.exit(0);
  }

  if (!QUIET) {
    console.log(`Scanning ${filesToCheck.length} file(s) for external URLs...\n`);
  }

  const allUrls = collectUrlsFromFiles(filesToCheck);
  const uniqueUrls = [...new Set(allUrls.map((u) => u.url))];

  if (!QUIET) {
    console.log(`Found ${allUrls.length} URL references (${uniqueUrls.length} unique URLs)\n`);
  }

  const { results, failed } = await checkAllUrls(allUrls, uniqueUrls);
  const findings = results.filter((r) => !r.ok).map((r) => generateFinding(r, r));

  outputFindings(findings);
  printLinkSummary(uniqueUrls.length, allUrls.length, results, failed);

  process.exit(failed > 0 ? 1 : 0);
}

// Run main function with top-level await (ESM)
try {
  await main();
} catch (error) {
  console.error("Unexpected error:", sanitizeError(error));
  process.exit(2);
}
