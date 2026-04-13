#!/usr/bin/env node
/**
 * T29 Step 10.5 — Category C remediation
 *
 * UUID migration for 5 sources where analysis.json.id is "<slug>-YYYY-MM-DD"
 * instead of UUID v4. Zod schema v3.0 requires UUID.
 *
 * Pre-flight (run separately, see commit message): verified 0 journal entries
 * reference these slug-date IDs via source_analysis_id. Safe to regenerate.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const ANALYSIS_DIR = path.join(ROOT, ".research", "analysis");

const SOURCES = [
  "archivebox-archivebox",
  "crawl4ai",
  "lux-video-downloader",
  "vikparuchuri-marker",
  "zedeus-nitter",
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function atomicWriteJson(filePath, obj) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, filePath);
}

function migrate(slug) {
  const analysisPath = path.join(ANALYSIS_DIR, slug, "analysis.json");
  const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));

  const oldId = analysis.id;
  if (UUID_RE.test(oldId)) {
    return { slug, status: "SKIP", reason: `already UUID: ${oldId}` };
  }

  const newId = crypto.randomUUID();
  analysis.id = newId;
  atomicWriteJson(analysisPath, analysis);
  return { slug, status: "OK", oldId, newId };
}

function main() {
  console.log("T29 Step 10.5 — Category C: UUID migration\n");
  for (const slug of SOURCES) {
    try {
      const r = migrate(slug);
      if (r.status === "SKIP") {
        console.log(`  ${slug}: SKIP — ${r.reason}`);
      } else {
        console.log(`  ${slug}: ${r.oldId} → ${r.newId}`);
      }
    } catch (e) {
      console.log(`  ${slug}: ERROR — ${e.message}`);
    }
  }
  console.log("\nDone.");
}

main();
