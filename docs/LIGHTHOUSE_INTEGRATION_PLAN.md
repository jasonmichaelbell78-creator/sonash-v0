# Lighthouse Integration Plan

**Document Version:** 1.1 **Created:** 2026-01-14 **Last Updated:** 2026-01-15
**Status:** ACTIVE (Part of Operational Visibility Sprint) **Priority:** P0
(Sprint Track B)

> **Parent Sprint:**
> [OPERATIONAL_VISIBILITY_SPRINT.md](./OPERATIONAL_VISIBILITY_SPRINT.md)
> **Sprint Tasks:** B2 (PERF-001), B3 (PERF-002), B4 (PERF-003), B5 (Dashboard
> Tab)

---

## Overview

This document defines the implementation plan for integrating Google Lighthouse
into the SoNash development and CI/CD workflow. The goal is to track
performance, accessibility, best practices, SEO, and PWA readiness across all
application routes.

**Key Decisions:**

- **Focus:** Tracking/monitoring (not blocking PRs initially)
- **Scope:** All pages
- **Strictness:** Warnings only (non-blocking)
- **PWA:** Future goal, baseline tracking now
- **Remote Access:** Dev Dashboard will be remote-accessible via Firestore
  backend

---

## Phase 1: Local Lighthouse Script (PERF-001)

**Milestone:** M1.5 - Quick Wins **Effort:** S (1-2 hours) **Priority:** P1

### Implementation

#### 1.1 Install Dependencies

```bash
npm install --save-dev lighthouse puppeteer
```

**Why Puppeteer?** Lighthouse can use Puppeteer for headless Chrome, which is
more reliable than the default Chrome launcher in CI environments.

#### 1.2 Create Audit Script

**File:** `scripts/lighthouse-audit.js`

```javascript
#!/usr/bin/env node
/**
 * Lighthouse Multi-Page Audit Script
 * Runs Lighthouse audits against all application routes
 *
 * Usage:
 *   npm run lighthouse              # Audit all pages
 *   npm run lighthouse -- --url /   # Audit single page
 *   npm run lighthouse -- --json    # Output JSON only
 */

const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");
const fs = require("fs");
const path = require("path");

// Configuration
const BASE_URL = process.env.LIGHTHOUSE_BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), ".lighthouse");

// Routes to audit (all application pages)
const ROUTES = [
  { path: "/", name: "landing" },
  { path: "/today", name: "today" },
  { path: "/journal", name: "journal" },
  { path: "/growth", name: "growth" },
  { path: "/more", name: "more" },
  { path: "/admin", name: "admin" },
  { path: "/login", name: "login" },
];

// Lighthouse configuration
const LIGHTHOUSE_CONFIG = {
  extends: "lighthouse:default",
  settings: {
    onlyCategories: [
      "performance",
      "accessibility",
      "best-practices",
      "seo",
      "pwa",
    ],
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
  ...LIGHTHOUSE_CONFIG,
  settings: {
    ...LIGHTHOUSE_CONFIG.settings,
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

async function runLighthouse(url, config, chrome) {
  const result = await lighthouse(
    url,
    {
      port: chrome.port,
      output: ["json", "html"],
      logLevel: "error",
    },
    config
  );

  return result;
}

async function auditPage(route, chrome, options = {}) {
  const url = `${BASE_URL}${route.path}`;
  const config = options.desktop ? DESKTOP_CONFIG : LIGHTHOUSE_CONFIG;

  console.log(`  Auditing ${route.name} (${url})...`);

  try {
    const result = await runLighthouse(url, config, chrome);

    // Extract scores
    const scores = {
      performance: Math.round(result.lhr.categories.performance.score * 100),
      accessibility: Math.round(
        result.lhr.categories.accessibility.score * 100
      ),
      bestPractices: Math.round(
        result.lhr.categories["best-practices"].score * 100
      ),
      seo: Math.round(result.lhr.categories.seo.score * 100),
      pwa: Math.round(result.lhr.categories.pwa.score * 100),
    };

    // Save reports
    const timestamp = new Date().toISOString().split("T")[0];
    const device = options.desktop ? "desktop" : "mobile";
    const baseName = `${route.name}-${device}-${timestamp}`;

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${baseName}.json`),
      JSON.stringify(result.lhr, null, 2)
    );

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${baseName}.html`),
      result.report[1]
    );

    return { route: route.name, url, scores, success: true };
  } catch (error) {
    console.error(`  Error auditing ${route.name}: ${error.message}`);
    return { route: route.name, url, error: error.message, success: false };
  }
}

async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  const singleUrl = args.find((arg) => arg.startsWith("--url="))?.split("=")[1];
  const jsonOnly = args.includes("--json");
  const desktop = args.includes("--desktop");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Filter routes if single URL specified
  const routesToAudit = singleUrl
    ? ROUTES.filter((r) => r.path === singleUrl)
    : ROUTES;

  if (routesToAudit.length === 0) {
    console.error(`No route found for: ${singleUrl}`);
    process.exit(1);
  }

  console.log("Lighthouse Performance Audit");
  console.log("============================");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Device: ${desktop ? "Desktop" : "Mobile"}`);
  console.log(`Routes: ${routesToAudit.length}`);
  console.log("");

  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox"],
  });

  try {
    const results = [];

    for (const route of routesToAudit) {
      const result = await auditPage(route, chrome, { desktop });
      results.push(result);
    }

    // Summary
    console.log("");
    console.log("Results Summary");
    console.log("---------------");

    if (jsonOnly) {
      console.log(JSON.stringify(results, null, 2));
    } else {
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

      console.log("");
      console.log(`Reports saved to: ${OUTPUT_DIR}/`);
    }

    // Save summary JSON
    const summaryPath = path.join(OUTPUT_DIR, "summary.json");
    fs.writeFileSync(
      summaryPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          baseUrl: BASE_URL,
          device: desktop ? "desktop" : "mobile",
          results,
        },
        null,
        2
      )
    );

    // Exit with error if any audits failed
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      process.exit(1);
    }
  } finally {
    await chrome.kill();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

#### 1.3 Add npm Script

**File:** `package.json` (add to scripts)

```json
{
  "scripts": {
    "lighthouse": "node scripts/lighthouse-audit.js",
    "lighthouse:desktop": "node scripts/lighthouse-audit.js --desktop"
  }
}
```

#### 1.4 Add to .gitignore

```gitignore
# Lighthouse reports
.lighthouse/
```

### Verification

```bash
# Start dev server in one terminal
npm run dev

# Run audit in another terminal
npm run lighthouse

# Expected output:
# Lighthouse Performance Audit
# ============================
# Base URL: http://localhost:3000
# Device: Mobile
# Routes: 7
#
# Results Summary
# ---------------
# Page           | Perf | A11y | Best | SEO  | PWA
# ---------------|------|------|------|------|-----
# landing        |   85 |   92 |   95 |   90 |   30
# today          |   78 |   88 |   90 |   85 |   30
# ...
```

---

## Phase 2: CI Integration (PERF-002)

**Milestone:** M1.5 - Quick Wins **Effort:** M (2-3 hours) **Priority:** P1

### Implementation

#### 2.1 Install CI Dependencies

Add `start-server-and-test` for running server during CI:

```bash
npm install --save-dev start-server-and-test
```

#### 2.2 Add CI npm Script

```json
{
  "scripts": {
    "lighthouse:ci": "start-server-and-test 'npm run build && npm run start' http://localhost:3000 'npm run lighthouse'"
  }
}
```

#### 2.3 GitHub Actions Workflow

**File:** `.github/workflows/lighthouse.yml`

```yaml
name: Lighthouse Audit

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  workflow_dispatch: # Allow manual triggers

jobs:
  lighthouse:
    name: Lighthouse Performance Audit
    runs-on: ubuntu-latest
    continue-on-error: true # Non-blocking (warnings only)

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          # Add any required env vars for build
          NEXT_PUBLIC_FIREBASE_API_KEY:
            ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
          # ... other env vars

      - name: Run Lighthouse audit
        run: npm run lighthouse:ci
        env:
          LIGHTHOUSE_BASE_URL: http://localhost:3000

      - name: Upload Lighthouse reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: lighthouse-reports
          path: .lighthouse/
          retention-days: 30

      - name: Comment PR with scores
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const summary = JSON.parse(fs.readFileSync('.lighthouse/summary.json', 'utf8'));

            let comment = '## Lighthouse Audit Results\n\n';
            comment += '| Page | Performance | Accessibility | Best Practices | SEO | PWA |\n';
            comment += '|------|-------------|---------------|----------------|-----|-----|\n';

            for (const result of summary.results) {
              if (result.success) {
                const { scores } = result;
                const perfEmoji = scores.performance >= 90 ? '🟢' : scores.performance >= 50 ? '🟡' : '🔴';
                const a11yEmoji = scores.accessibility >= 90 ? '🟢' : scores.accessibility >= 50 ? '🟡' : '🔴';
                comment += `| ${result.route} | ${perfEmoji} ${scores.performance} | ${a11yEmoji} ${scores.accessibility} | ${scores.bestPractices} | ${scores.seo} | ${scores.pwa} |\n`;
              } else {
                comment += `| ${result.route} | Error | - | - | - | - |\n`;
              }
            }

            comment += '\n📊 [View full reports](../actions/runs/' + context.runId + ')';

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### Verification

1. Push a PR to the repository
2. Check GitHub Actions for Lighthouse job
3. Verify artifacts contain HTML/JSON reports
4. Verify PR comment shows score summary

---

## Phase 3: Historical Tracking (PERF-003)

**Milestone:** M2 - Architecture **Effort:** M (3-4 hours) **Priority:** P2
**Prerequisite:** PERF-001, PERF-002 complete

### Implementation

#### 3.1 History Storage Schema

**File:** `.lighthouse/history.json` (gitignored, but could be stored in
Firestore for persistence)

```json
{
  "version": 1,
  "entries": [
    {
      "timestamp": "2026-01-14T10:30:00Z",
      "commit": "abc123",
      "branch": "main",
      "device": "mobile",
      "results": [
        {
          "route": "landing",
          "scores": {
            "performance": 85,
            "accessibility": 92,
            "bestPractices": 95,
            "seo": 90,
            "pwa": 30
          }
        }
      ]
    }
  ]
}
```

#### 3.2 History Tracking Script

**File:** `scripts/lighthouse-history.js`

- Append new results to history file
- Detect regressions (>10 point drop)
- Generate trend report

#### 3.3 Regression Detection

Alert when any category drops >10 points from the previous run:

```javascript
function detectRegressions(current, previous) {
  const regressions = [];

  for (const route of current.results) {
    const prevRoute = previous.results.find((r) => r.route === route.route);
    if (!prevRoute) continue;

    for (const [category, score] of Object.entries(route.scores)) {
      const prevScore = prevRoute.scores[category];
      const delta = score - prevScore;

      if (delta <= -10) {
        regressions.push({
          route: route.route,
          category,
          previous: prevScore,
          current: score,
          delta,
        });
      }
    }
  }

  return regressions;
}
```

---

## Phase 4: Performance Budgets (PERF-004)

**Milestone:** M2 - Architecture **Effort:** S (1-2 hours) **Priority:** P2
**Prerequisite:** PERF-002 complete

### Implementation

#### 4.1 Lighthouse CI Configuration

**File:** `lighthouserc.js`

```javascript
module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/today",
        "http://localhost:3000/journal",
        "http://localhost:3000/growth",
        "http://localhost:3000/more",
        "http://localhost:3000/login",
      ],
      numberOfRuns: 3, // Run 3 times for more stable results
    },
    assert: {
      assertions: {
        // Core Web Vitals
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "first-input-delay": ["warn", { maxNumericValue: 100 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],

        // Category scores
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
      },
    },
    upload: {
      target: "temporary-public-storage", // Free Lighthouse CI storage
    },
  },
};
```

#### 4.2 Update CI to Use Lighthouse CI

```bash
npm install --save-dev @lhci/cli
```

```json
{
  "scripts": {
    "lhci": "lhci autorun"
  }
}
```

---

## Phase 5: Dashboard Integration (PERF-005)

**Milestone:** M2 - Architecture **Effort:** L (6-8 hours) **Priority:** P3
**Prerequisite:** Development Dashboard exists, PERF-003 complete

### Implementation

This phase integrates Lighthouse scores into the Development Dashboard (not the
production Admin Panel).

#### 5.1 Dashboard Component

**File:** `components/dev/lighthouse-dashboard.tsx` (or standalone page)

Features:

- Current scores for all routes (table view)
- Historical trend chart (line chart per category)
- Score comparison (current vs previous run)
- Links to full HTML reports
- Regression alerts

#### 5.2 Data Source

Read from `.lighthouse/history.json` or Firestore collection
`dev/lighthouse/history`.

---

## Phase 6: PWA Baseline (PERF-006)

**Milestone:** M2 - Architecture **Effort:** S (1-2 hours) **Priority:** P2
**Prerequisite:** PERF-001 complete

### Implementation

#### 6.1 Document Current PWA Score

Run Lighthouse and document:

- Current PWA score (expected: ~30-40 without service worker)
- Missing PWA requirements
- Gap analysis

#### 6.2 PWA Checklist

| Requirement      | Status              | Blocking?     |
| ---------------- | ------------------- | ------------- |
| HTTPS            | Yes (in production) | No            |
| Service Worker   | No                  | Yes           |
| Web App Manifest | Partial             | Yes           |
| Offline Support  | No                  | Yes (EFF-010) |
| Installability   | No                  | Yes           |

#### 6.3 Remediation Plan

1. Complete EFF-010 (Offline Queue) - prerequisite for offline support
2. Add service worker with Workbox
3. Complete web app manifest
4. Test installability

---

## Pages to Audit

| Route      | Page          | Priority | Notes                           |
| ---------- | ------------- | -------- | ------------------------------- |
| `/`        | Landing page  | P0       | First impression, SEO critical  |
| `/today`   | Today page    | P0       | Daily use, performance critical |
| `/journal` | Journal page  | P1       | Heavy data, list rendering      |
| `/growth`  | Growth page   | P1       | Maps, external resources        |
| `/more`    | More/Settings | P2       | Lower traffic                   |
| `/admin`   | Admin panel   | P2       | Internal use only               |
| `/login`   | Auth pages    | P1       | Onboarding critical             |

---

## Success Criteria

### Phase 1-2 (M1.5)

- [ ] `npm run lighthouse` runs successfully
- [ ] All 7 routes audited
- [ ] HTML/JSON reports generated
- [ ] CI job runs on PRs
- [ ] Artifacts uploaded to GitHub

### Phase 3-6 (M2)

- [ ] Historical data tracked over 7+ days
- [ ] Regressions detected and alerted
- [ ] Performance budgets defined
- [ ] Dashboard shows scores and trends
- [ ] PWA gaps documented

---

## Related Documents

- [OPERATIONAL_VISIBILITY_SPRINT.md](./OPERATIONAL_VISIBILITY_SPRINT.md) -
  Parent sprint (Track B tasks)
- [ROADMAP.md](../ROADMAP.md) - Active Sprint section, PERF-001 through PERF-006
- [EFF-010: Offline Queue](../ROADMAP.md#offline-support-critical) - PWA
  prerequisite
- Development Dashboard - Sprint Track B deliverable

---

## Version History

| Version | Date       | Changes                                                         |
| ------- | ---------- | --------------------------------------------------------------- |
| 1.1     | 2026-01-14 | Linked to Operational Visibility Sprint, updated priority to P0 |
| 1.0     | 2026-01-14 | Initial plan created (Session #66)                              |
