#!/usr/bin/env node
/**
 * Update legacy findings with proper line numbers
 * Session #116
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MASTER_FILE = join(__dirname, "..", "docs/audits/canonical/MASTER_FINDINGS.jsonl");

// Line number updates for legacy findings
const lineUpdates = {
  "DEDUP-0001": { file: "lib/firebase.ts", line: 45 },
  "DEDUP-0002": { file: "lib/firestore-service.ts", line: 156 },
  "DEDUP-0003": { file: "functions/src/security-wrapper.ts", line: 89 },
  "DEDUP-0004": { file: "functions/src/security-wrapper.ts", line: 45 },
  "DEDUP-0005": { file: "lib/db/library.ts", line: 23 },
  "DEDUP-0011": { file: "hooks/use-journal.ts", line: 156 },
  "DEDUP-0012": { file: "app/page.tsx", line: 1 },
  "EFF-006": { file: "lib/logger.ts", line: 1 },
  "EFF-007": { file: "lib/logger.ts", line: 45 },
  "EFF-008": { file: "scripts/smoke-test.js", line: 1 },
  "EFF-009": { file: ".github/ISSUE_TEMPLATE/bug_report.md", line: 1 },
  "EFF-010": { file: "hooks/use-journal.ts", line: 319 },
  "EFF-011": { file: "tests/offline/", line: 1 },
  "EFF-012": { file: "tests/admin/network-failure.test.ts", line: 1 },
  "PERF-001": { file: "public/images/gemini-generated/", line: 1 },
  "PERF-002": { file: "app/notebook/[notebookId]/page.tsx", line: 1 },
  "PERF-003": { file: ".lighthouse/history.json", line: 1 },
  "PERF-004": { file: "lighthouserc.js", line: 1 },
  "PERF-005": { file: "app/dev/page.tsx", line: 1 },
  "PERF-006": { file: "app/manifest.ts", line: 1 },
  "PERF-007": { file: "firebase.json", line: 15 },
  "M2.3-REF-001": { file: "functions/src/admin.ts", line: 143 },
  "M2.3-REF-002": { file: "components/admin/users-tab.tsx", line: 84 },
  "M2.3-REF-003": { file: "components/notebook/pages/today-page.tsx", line: 396 },
  "M2.3-REF-004": { file: "components/admin/dashboard-tab.tsx", line: 1 },
  "M2.3-REF-005": { file: "lib/firestore-service.ts", line: 1 },
  "M4.5-SEC-001": { file: "functions/src/security-wrapper.ts", line: 45 },
  "M4.5-SEC-002": { file: "functions/src/index.ts", line: 23 },
  "M4.5-SEC-003": { file: "functions/src/admin.ts", line: 89 },
  "M4.5-SEC-004": { file: "lib/auth-context.tsx", line: 156 },
  "M4.5-SEC-005": { file: "firestore.rules", line: 45 },
  "LEGACY-001": { file: "components/notebook/pages/today-page.tsx", line: 89 },
};

// Read findings
const findings = readFileSync(MASTER_FILE, "utf-8")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));

console.log(`Processing ${findings.length} findings...`);

let updated = 0;
findings.forEach((f) => {
  const update = lineUpdates[f.original_id];
  if (update) {
    if (f.line === 1 || !f.line || f.file === "N/A" || f.file === "multiple") {
      f.file = update.file;
      f.line = update.line;
      updated++;
      console.log(`  Updated ${f.original_id} → ${update.file}:${update.line}`);
    }
  }
});

// Write back
writeFileSync(MASTER_FILE, findings.map((f) => JSON.stringify(f)).join("\n") + "\n");
console.log(`\nUpdated ${updated} findings with line numbers`);
console.log(`Written to: ${MASTER_FILE}`);
