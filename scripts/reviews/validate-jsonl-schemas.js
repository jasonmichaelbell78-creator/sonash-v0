#!/usr/bin/env node
/* global __dirname */
/**
 * Validate all ecosystem JSONL files against their Zod schemas.
 * Usage: node scripts/reviews/validate-jsonl-schemas.js [--file NAME]
 *
 * Reads compiled schemas from dist/lib/schemas/index.js (run `npx tsc` first).
 * Validates each record in every JSONL file against its corresponding schema.
 *
 * Source: PR #395 retro (DEBT-11312) --- JSONL schema drift caused silent data issues.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const SCRIPT_DIR = __dirname;
const ROOT = path.resolve(SCRIPT_DIR, "../..");
const DATA_DIR = path.join(ROOT, "data/ecosystem-v2");
const DIST_SCHEMAS = path.join(SCRIPT_DIR, "dist/lib/schemas/index.js");

// Parse args
const args = process.argv.slice(2);
const fileIdx = args.indexOf("--file");
const fileFilter = fileIdx >= 0 ? args[fileIdx + 1] : null;

// Load compiled schemas
let schemaModule;
try {
  schemaModule = require(DIST_SCHEMAS);
} catch (err) {
  console.error(`Failed to load compiled schemas from ${path.relative(ROOT, DIST_SCHEMAS)}`);
  console.error("Run first: cd scripts/reviews && npx tsc");
  console.error(`Detail: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

const SCHEMA_MAP = schemaModule.SCHEMA_MAP;
if (!SCHEMA_MAP || typeof SCHEMA_MAP !== "object") {
  console.error("SCHEMA_MAP not found in compiled schemas -- check schemas/index.ts exports");
  process.exit(1);
}

// Map JSONL file names to schema keys
const JSONL_FILES = {
  "reviews.jsonl": "reviews",
  "retros.jsonl": "retros",
  "deferred-items.jsonl": "deferred-items",
  "invocations.jsonl": "invocations",
  "warnings.jsonl": "warnings",
};

let totalRecords = 0;
let totalErrors = 0;
let filesChecked = 0;

console.log("=== JSONL Schema Validation ===\n");

for (const [filename, schemaKey] of Object.entries(JSONL_FILES)) {
  if (fileFilter && !filename.includes(fileFilter) && schemaKey !== fileFilter) {
    continue;
  }

  // Containment check: ensure resolved path stays within DATA_DIR
  const resolved = path.resolve(DATA_DIR, filename);
  const rel = path.relative(DATA_DIR, resolved);
  if (/^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
    console.error(`  ${filename}: path escapes data directory, skipping`);
    continue;
  }
  const filePath = resolved;
  if (!fs.existsSync(filePath)) {
    console.log(`  ${filename}: not found, skipping`);
    continue;
  }

  const schema = SCHEMA_MAP[schemaKey];
  if (!schema) {
    console.log(`  ${filename}: no schema mapped for key "${schemaKey}", skipping`);
    continue;
  }

  filesChecked++;
  let lines;
  try {
    lines = fs.readFileSync(filePath, "utf-8").trim().split("\n").filter(Boolean);
  } catch (err) {
    console.error(
      `  ${filename}: read error -- ${err instanceof Error ? err.message : String(err)}`
    );
    totalErrors++;
    continue;
  }

  let fileErrors = 0;
  for (let i = 0; i < lines.length; i++) {
    totalRecords++;
    let record;
    try {
      record = JSON.parse(lines[i]);
    } catch {
      fileErrors++;
      totalErrors++;
      console.error(`  ${filename} line ${i + 1}: JSON parse error`);
      continue;
    }

    const result = schema.safeParse(record);
    if (!result.success) {
      fileErrors++;
      totalErrors++;
      const id = (record && typeof record === "object" && record.id) || `line-${i + 1}`;
      const issues = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      console.error(`  ${filename} [${id}]: ${issues}`);
    }
  }

  const status = fileErrors === 0 ? "OK" : `${fileErrors} error(s)`;
  console.log(`  ${filename}: ${lines.length} records -- ${status}`);
}

console.log(
  `\nSummary: ${filesChecked} file(s), ${totalRecords} record(s), ${totalErrors} error(s)`
);
process.exitCode = totalErrors > 0 ? 1 : 0;
