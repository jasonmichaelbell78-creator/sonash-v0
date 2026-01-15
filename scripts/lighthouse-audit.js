#!/usr/bin/env node
/**
 * Lighthouse Multi-Page Audit Script
 * Runs Lighthouse audits against all application routes
 *
 * Usage:
 *   npm run lighthouse              # Audit all pages
 *   npm run lighthouse -- --url /   # Audit single page
 *   npm run lighthouse -- --json    # Output JSON only
 *   npm run lighthouse -- --desktop # Use desktop configuration
 *
 * PERF-001: Part of Operational Visibility Sprint
 */

const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");
const fs = require("fs");
const path = require("path");

// Configuration
const BASE_URL = process.env.LIGHTHOUSE_BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), ".lighthouse");

// Routes to audit (public application pages only)
// Note: Auth-protected routes (/admin, /dev) excluded - they require login
const ROUTES = [
  { path: "/", name: "landing" },
  { path: "/today", name: "today" },
  { path: "/journal", name: "journal" },
  { path: "/growth", name: "growth" },
  { path: "/more", name: "more" },
  { path: "/login", name: "login" },
];

// Lighthouse configuration (mobile by default)
const MOBILE_CONFIG = {
  extends: "lighthouse:default",
  settings: {
    onlyCategories: ["performance", "accessibility", "best-practices", "seo", "pwa"],
    formFactor: "mobile",
    throttling: {
      // Simulated slow 4G connection
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
    },
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
    },
  },
};

// Desktop configuration variant
const DESKTOP_CONFIG = {
  extends: "lighthouse:default",
  settings: {
    onlyCategories: ["performance", "accessibility", "best-practices", "seo", "pwa"],
    formFactor: "desktop",
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
    },
  },
};

async function runLighthouse(url, config, chromePort) {
  const result = await lighthouse(
    url,
    {
      port: chromePort,
      output: ["json", "html"],
      logLevel: "error",
    },
    config
  );

  return result;
}

async function auditPage(route, chromePort, options = {}) {
  const url = `${BASE_URL}${route.path}`;
  const config = options.desktop ? DESKTOP_CONFIG : MOBILE_CONFIG;

  console.log(`  Auditing ${route.name} (${url})...`);

  try {
    const result = await runLighthouse(url, config, chromePort);

    // Extract scores (some categories like PWA can be absent depending on context)
    const scoreFor = (categoryKey) => {
      const score = result?.lhr?.categories?.[categoryKey]?.score;
      return typeof score === "number" ? Math.round(score * 100) : 0;
    };

    const scores = {
      performance: scoreFor("performance"),
      accessibility: scoreFor("accessibility"),
      bestPractices: scoreFor("best-practices"),
      seo: scoreFor("seo"),
      pwa: scoreFor("pwa"),
    };

    // Save reports
    const timestamp = new Date().toISOString().split("T")[0];
    const device = options.desktop ? "desktop" : "mobile";
    const baseName = `${route.name}-${device}-${timestamp}`;

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${baseName}.json`),
      JSON.stringify(result.lhr, null, 2)
    );

    fs.writeFileSync(path.join(OUTPUT_DIR, `${baseName}.html`), result.report[1]);

    return { route: route.name, url, scores, success: true };
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : String(error);
    console.error(`  Error auditing ${route.name}: ${message}`);
    return { route: route.name, url, error: message, success: false };
  }
}

function printScoreTable(results) {
  console.log("");
  console.log("Page           | Perf | A11y | Best | SEO  | PWA");
  console.log("---------------|------|------|------|------|-----");

  for (const result of results) {
    if (result.success) {
      const { scores } = result;
      console.log(
        `${result.route.padEnd(14)} | ${String(scores.performance).padStart(4)} | ${String(scores.accessibility).padStart(4)} | ${String(scores.bestPractices).padStart(4)} | ${String(scores.seo).padStart(4)} | ${String(scores.pwa).padStart(4)}`
      );
    } else {
      console.log(`${result.route.padEnd(14)} | ERROR: ${result.error}`);
    }
  }
}

async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  const urlArg = args.find((arg) => arg.startsWith("--url="));
  const singleUrl = urlArg ? urlArg.split("=")[1] : null;
  const jsonOnly = args.includes("--json");
  const desktop = args.includes("--desktop");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Filter routes if single URL specified
  const routesToAudit = singleUrl ? ROUTES.filter((r) => r.path === singleUrl) : ROUTES;

  if (routesToAudit.length === 0) {
    console.error(`No route found for: ${singleUrl}`);
    console.error(`Available routes: ${ROUTES.map((r) => r.path).join(", ")}`);
    process.exit(1);
  }

  if (!jsonOnly) {
    console.log("Lighthouse Performance Audit");
    console.log("============================");
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Device: ${desktop ? "Desktop" : "Mobile"}`);
    console.log(`Routes: ${routesToAudit.length}`);
    console.log("");
  }

  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox"],
  });

  try {
    const results = [];

    for (const route of routesToAudit) {
      const result = await auditPage(route, chrome.port, { desktop });
      results.push(result);
    }

    // Output results
    if (jsonOnly) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log("");
      console.log("Results Summary");
      console.log("---------------");
      printScoreTable(results);

      console.log("");
      console.log(`Reports saved to: ${OUTPUT_DIR}/`);
    }

    // Save summary JSON
    const summary = {
      timestamp: new Date().toISOString(),
      commit: process.env.GITHUB_SHA?.substring(0, 7) || null,
      branch: process.env.GITHUB_REF_NAME || process.env.GITHUB_HEAD_REF || null,
      baseUrl: BASE_URL,
      device: desktop ? "desktop" : "mobile",
      results,
    };

    const summaryPath = path.join(OUTPUT_DIR, "summary.json");
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    // Exit with error if any audits failed
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0 && !jsonOnly) {
      console.log("");
      console.log(`Warning: ${failures.length} route(s) failed to audit.`);
    }

    // Always exit 0 for now (warning mode only)
    // Change to process.exit(1) when ready to block on failures
  } finally {
    await chrome.kill();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
