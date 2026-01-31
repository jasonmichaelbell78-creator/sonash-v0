#!/usr/bin/env node
/**
 * Migrate existing ROADMAP findings to canonical location
 * Session #116 - Full canonicalization
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MASTER_FILE = join(__dirname, "..", "docs/audits/canonical/MASTER_FINDINGS.jsonl");
const ROADMAP_FILE = join(__dirname, "..", "ROADMAP.md");
const REFACTOR_BACKLOG = join(
  __dirname,
  "..",
  "docs/reviews/2026-Q1/canonical/tier2-output/REFACTOR_BACKLOG.md"
);

// Read existing canonical findings with safe parsing
let existingFindings = [];
try {
  if (existsSync(MASTER_FILE)) {
    const raw = readFileSync(MASTER_FILE, "utf-8");
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    existingFindings = lines
      .map((l, idx) => {
        try {
          return JSON.parse(l);
        } catch (e) {
          console.warn(`Warning: Invalid JSON at line ${idx + 1}, skipping`);
          return null;
        }
      })
      .filter(Boolean);
  }
} catch (e) {
  if (e && typeof e === "object" && "code" in e && e.code === "ENOENT") {
    console.log("MASTER_FINDINGS.jsonl not found, starting fresh");
    existingFindings = [];
  } else {
    throw e;
  }
}

console.log(`Existing canonical findings: ${existingFindings.length}`);

// Get max CANON ID
let maxCanonId = 0;
existingFindings.forEach((f) => {
  // Guard against missing id field to prevent crash
  const match = String(f.id || "").match(/CANON-(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num > maxCanonId) maxCanonId = num;
  }
});
console.log(`Max CANON ID: CANON-${String(maxCanonId).padStart(4, "0")}`);

// Define existing findings to migrate from ROADMAP
// These are findings with non-CANON IDs that need to be migrated
// Includes file:line references where known
const legacyFindings = [
  // DEDUP findings (from REFACTOR_BACKLOG.md)
  {
    original_id: "DEDUP-0001",
    title: "Re-enable App Check on Cloud Functions",
    severity: "S0",
    effort: "E2",
    category: "security",
    file: "lib/firebase.ts",
    line: 45,
    description:
      "Re-enable Firebase App Check on Cloud Functions after reCAPTCHA and rate limiting prerequisites",
    roadmap_section: "M4.5",
  },
  {
    original_id: "DEDUP-0002",
    title: "Close legacy journalEntries write path",
    severity: "S0",
    effort: "E2",
    category: "security",
    file: "lib/firestore-service.ts",
    line: 156,
    description: "Close the legacy direct journalEntries Firestore write path",
    roadmap_section: "M2.3-REF",
  },
  {
    original_id: "DEDUP-0003",
    title: "Make reCAPTCHA fail-closed",
    severity: "S1",
    effort: "E1",
    category: "security",
    file: "functions/src/security-wrapper.ts",
    line: 89,
    description: "reCAPTCHA should fail-closed (block request) when token missing",
    roadmap_section: "M4.5",
  },
  {
    original_id: "DEDUP-0004",
    title: "Complete rate limiting (IP + admin)",
    severity: "S1",
    effort: "E2",
    category: "security",
    file: "functions/src/security-wrapper.ts",
    line: 45,
    description: "Add IP-based throttling and admin endpoint rate limiting",
    roadmap_section: "M4.5",
  },
  {
    original_id: "DEDUP-0005",
    title: "Replace console.* with logger",
    severity: "S1",
    effort: "E1",
    category: "code",
    file: "lib/db/library.ts",
    line: 23,
    description: "Replace all console.* usage with standardized logger",
    roadmap_section: "M2.1",
  },
  {
    original_id: "DEDUP-0011",
    title: "Fix useJournal memory leak",
    severity: "S0",
    effort: "E1",
    category: "code",
    file: "hooks/use-journal.ts",
    line: 156,
    description: "Fix memory leak in useJournal hook cleanup",
    roadmap_section: "M2.1",
  },
  {
    original_id: "DEDUP-0012",
    title: "Enable SSR for landing page",
    severity: "S1",
    effort: "E2",
    category: "performance",
    file: "app/page.tsx",
    line: 1,
    description: "Landing page is client-only, blocking SSR benefits",
    roadmap_section: "Track P",
  },

  // EFF findings (Engineering Productivity)
  {
    original_id: "EFF-006",
    title: "Add Correlation IDs to Logger",
    severity: "S2",
    effort: "E2",
    category: "engineering-productivity",
    file: "lib/logger.ts",
    line: 1,
    description: "Generate unique correlation ID per request for tracing",
    roadmap_section: "M2.2",
  },
  {
    original_id: "EFF-007",
    title: "Add Network Status to Logs",
    severity: "S2",
    effort: "E2",
    category: "engineering-productivity",
    file: "lib/logger.ts",
    line: 45,
    description: "Add isOnline to logger context and Sentry tags",
    roadmap_section: "M2.2",
  },
  {
    original_id: "EFF-008",
    title: "Create Smoke Test Script",
    severity: "S2",
    effort: "E2",
    category: "process",
    file: "scripts/smoke-test.js",
    line: 1,
    description: "Create npm run smoke that hits homepage, auth endpoint, Cloud Function",
    roadmap_section: "Track D",
  },
  {
    original_id: "EFF-009",
    title: "Add Bug Report GitHub Template",
    severity: "S2",
    effort: "E2",
    category: "process",
    file: ".github/ISSUE_TEMPLATE/bug_report.md",
    line: 1,
    description: "Create bug report template with repro steps, env, offline status, Sentry link",
    roadmap_section: "Track D",
  },
  {
    original_id: "EFF-010",
    title: "Offline Queue Infrastructure",
    severity: "S1",
    effort: "E3",
    category: "engineering-productivity",
    file: "hooks/use-journal.ts",
    line: 319,
    description: "Implement offline queue for journal entries - merged into M5",
    roadmap_section: "M5",
  },
  {
    original_id: "EFF-011",
    title: "Offline Tests",
    severity: "S2",
    effort: "E2",
    category: "engineering-productivity",
    file: "tests/offline/",
    line: 1,
    description: "Add tests for offline mode functionality - moved to M5",
    roadmap_section: "M5",
  },
  {
    original_id: "EFF-012",
    title: "Network Failure Error Handling Tests",
    severity: "S2",
    effort: "E2",
    category: "process",
    file: "tests/admin/network-failure.test.ts",
    line: 1,
    description: "Test admin panel network failure scenarios",
    roadmap_section: "M2.2",
  },

  // PERF findings
  {
    original_id: "PERF-001",
    title: "Unoptimized images (11MB)",
    severity: "S1",
    effort: "E2",
    category: "performance",
    file: "public/images/gemini-generated/",
    line: 1,
    description: "Remove unused gemini-generated images, convert to WebP",
    roadmap_section: "Track P",
  },
  {
    original_id: "PERF-002",
    title: "No code splitting",
    severity: "S1",
    effort: "E2",
    category: "performance",
    file: "app/notebook/[notebookId]/page.tsx",
    line: 1,
    description: "Add dynamic imports for notebook pages",
    roadmap_section: "Track P",
  },
  {
    original_id: "PERF-003",
    title: "Historical Score Tracking",
    severity: "S2",
    effort: "E2",
    category: "performance",
    file: ".lighthouse/history.json",
    line: 1,
    description: "Store Lighthouse scores for trending",
    roadmap_section: "M2.2",
  },
  {
    original_id: "PERF-004",
    title: "Performance Budgets",
    severity: "S2",
    effort: "E1",
    category: "performance",
    file: "lighthouserc.js",
    line: 1,
    description: "Define LCP < 2.5s, FID < 100ms budgets",
    roadmap_section: "M2.2",
  },
  {
    original_id: "PERF-005",
    title: "Development Dashboard Integration",
    severity: "S2",
    effort: "E3",
    category: "performance",
    file: "app/dev/page.tsx",
    line: 1,
    description: "Display Lighthouse scores in Development Dashboard",
    roadmap_section: "Track B",
  },
  {
    original_id: "PERF-006",
    title: "PWA Audit Baseline",
    severity: "S2",
    effort: "E1",
    category: "performance",
    file: "app/manifest.ts",
    line: 1,
    description: "Document current PWA score and gaps",
    roadmap_section: "M2.2",
  },
  {
    original_id: "PERF-007",
    title: "Missing cache headers",
    severity: "S2",
    effort: "E1",
    category: "performance",
    file: "firebase.json",
    line: 15,
    description: "Add HTTP cache headers",
    roadmap_section: "Track P",
  },

  // M2.3-REF findings (God Objects) - with specific line references from ROADMAP
  {
    original_id: "M2.3-REF-001",
    title: "Split admin.ts (3,111 lines)",
    severity: "S1",
    effort: "E3",
    category: "refactoring",
    file: "functions/src/admin.ts",
    line: 143, // ReDoS regex location
    description:
      "Split into admin-users.ts, admin-content.ts, admin-monitoring.ts, admin-jobs.ts. Key lines: 143 (ReDoS), 1388 (nested templates), 1726/1835 (complexity)",
    roadmap_section: "M2.3-REF",
  },
  {
    original_id: "M2.3-REF-002",
    title: "Split users-tab.tsx (2,092 lines)",
    severity: "S1",
    effort: "E2",
    category: "refactoring",
    file: "components/admin/users-tab.tsx",
    line: 84, // complexity hotspot
    description:
      "Split into UserTable, UserFilters, UserActions, UserDetailDialog, UserBulkActions. Key line: 84 (complexity)",
    roadmap_section: "M2.3-REF",
  },
  {
    original_id: "M2.3-REF-003",
    title: "Split today-page.tsx (1,199 lines)",
    severity: "S2",
    effort: "E2",
    category: "refactoring",
    file: "components/notebook/pages/today-page.tsx",
    line: 396, // debug logs
    description:
      "Split into TodayContainer, DailyCheckIn, WeeklyStats, QuickActionsPanel. Key line: 396 (debug logs)",
    roadmap_section: "M2.3-REF",
  },
  {
    original_id: "M2.3-REF-004",
    title: "Split dashboard-tab.tsx (1,031 lines)",
    severity: "S2",
    effort: "E2",
    category: "refactoring",
    file: "components/admin/dashboard-tab.tsx",
    line: 1,
    description: "Split into SystemHealthCard, UserMetricsCard, JobStatusCard, StorageCard",
    roadmap_section: "M2.3-REF",
  },
  {
    original_id: "M2.3-REF-005",
    title: "Repository pattern violations",
    severity: "S2",
    effort: "E2",
    category: "refactoring",
    file: "lib/firestore-service.ts",
    line: 1,
    description: "Fix repository pattern violations across codebase",
    roadmap_section: "M2.3-REF",
  },

  // M4.5-SEC findings (Security Hardening)
  {
    original_id: "M4.5-SEC-001",
    title: "Rate limiting on public endpoints",
    severity: "S1",
    effort: "E2",
    category: "security",
    file: "functions/src/security-wrapper.ts",
    line: 45,
    description: "Add rate limiting to all public-facing endpoints",
    roadmap_section: "M4.5",
  },
  {
    original_id: "M4.5-SEC-002",
    title: "Restrict CORS origins",
    severity: "S2",
    effort: "E1",
    category: "security",
    file: "functions/src/index.ts",
    line: 23,
    description: "Restrict CORS to only allowed origins",
    roadmap_section: "M4.5",
  },
  {
    original_id: "M4.5-SEC-003",
    title: "Admin privilege hardening",
    severity: "S2",
    effort: "E2",
    category: "security",
    file: "functions/src/admin.ts",
    line: 89,
    description: "Harden admin privilege checks",
    roadmap_section: "M4.5",
  },
  {
    original_id: "M4.5-SEC-004",
    title: "Token rotation for long-lived sessions",
    severity: "S2",
    effort: "E2",
    category: "security",
    file: "lib/auth-context.tsx",
    line: 156,
    description: "Implement token rotation for long-lived sessions",
    roadmap_section: "M4.5",
  },
  {
    original_id: "M4.5-SEC-005",
    title: "Security rules for new collections",
    severity: "S2",
    effort: "E2",
    category: "security",
    file: "firestore.rules",
    line: 45,
    description: "Add security rules for new collections",
    roadmap_section: "M4.5",
  },

  // LEGACY findings
  {
    original_id: "LEGACY-001",
    title: "Retrofit SSR-Safe localStorage",
    severity: "S3",
    effort: "E1",
    category: "code",
    file: "components/notebook/pages/today-page.tsx",
    line: 89,
    description: "Replace direct localStorage calls with SSR-safe utilities - COMPLETED",
    roadmap_section: "M2.1",
    status: "resolved",
  },
];

// Check for duplicates with existing findings
const existingOriginalIds = new Set(existingFindings.map((f) => f.original_id).filter(Boolean));

// Filter out findings that are already in canonical (by original_id)
const newFindings = legacyFindings.filter((f) => !existingOriginalIds.has(f.original_id));

console.log(`Legacy findings to migrate: ${newFindings.length}`);
console.log(`Already in canonical (skipped): ${legacyFindings.length - newFindings.length}`);

// Assign new CANON IDs
let nextCanonId = maxCanonId + 1;
const migratedFindings = newFindings.map((f) => ({
  id: `CANON-${String(nextCanonId++).padStart(4, "0")}`,
  original_id: f.original_id,
  category: f.category,
  severity: f.severity,
  effort: f.effort,
  file: f.file ?? "N/A",
  line: f.line ?? 1,
  title: f.title,
  description: f.description,
  roadmap_section: f.roadmap_section,
  roadmap_track: f.roadmap_section,
  status: f.status ?? "active",
  sources: [{ type: "legacy-migration", id: f.original_id, date: "2026-01-30" }],
  created: "2026-01-30",
  updated: "2026-01-30",
}));

// Merge with existing
const allFindings = [...existingFindings, ...migratedFindings];

// Ensure canonical output directory exists (fresh clone / CI)
const canonicalDir = dirname(MASTER_FILE);
if (!existsSync(canonicalDir)) {
  try {
    mkdirSync(canonicalDir, { recursive: true });
  } catch {
    // Let the subsequent write throw a clearer error
  }
}

// Write updated MASTER_FINDINGS.jsonl
writeFileSync(MASTER_FILE, allFindings.map((f) => JSON.stringify(f)).join("\n") + "\n");
console.log(`\nUpdated: ${MASTER_FILE}`);
console.log(`Total findings: ${allFindings.length}`);

// Create ID mapping for ROADMAP updates
const idMapping = {};
migratedFindings.forEach((f) => {
  idMapping[f.original_id] = f.id;
});

console.log("\n=== ID Mapping (for ROADMAP updates) ===");
Object.entries(idMapping).forEach(([old, newId]) => {
  console.log(`  ${old} → ${newId}`);
});

// Write mapping file for reference
const mappingFile = join(__dirname, "..", "docs/audits/canonical/LEGACY_ID_MAPPING.json");
writeFileSync(mappingFile, JSON.stringify(idMapping, null, 2));
console.log(`\nMapping file: ${mappingFile}`);

// Summary by category
const byCategory = {};
allFindings.forEach((f) => {
  byCategory[f.category] = (byCategory[f.category] || 0) + 1;
});

console.log("\n=== Final Summary by Category ===");
Object.entries(byCategory)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

// Summary by severity
const bySeverity = { S0: 0, S1: 0, S2: 0, S3: 0 };
allFindings.forEach((f) => {
  if (bySeverity[f.severity] !== undefined) bySeverity[f.severity]++;
});

console.log("\n=== Final Summary by Severity ===");
Object.entries(bySeverity).forEach(([sev, count]) => {
  console.log(`  ${sev}: ${count}`);
});
