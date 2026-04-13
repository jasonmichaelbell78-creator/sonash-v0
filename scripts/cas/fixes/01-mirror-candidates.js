#!/usr/bin/env node
/**
 * T29 Step 10.5 — Category A+D+G remediation
 *
 * A: Copy candidates from value-map.json → analysis.json.candidates (8 sources)
 * D: Include description field (bundled with A)
 * G: Patch outline legacy enum values (personal_fit_band, classification)
 *
 * Idempotent. Atomic writes. One-shot — delete scripts/cas/fixes/ after sprint.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const ANALYSIS_DIR = path.join(ROOT, ".research", "analysis");

const MIRROR_SOURCES = [
  "docling",
  "docs-composio-dev",
  "farzaa-gist-c35ac0cf",
  "karpathy-gist-442a6bf",
  "kieranklaassen-gist-4f2aba89",
  "maharshi-pandya-gist-4aeccbe1",
  "unstructured",
  "outline",
];

const ENUM_PATCH_SOURCES = {
  outline: {
    personal_fit_band: { from: "Good", to: "Healthy" },
    classification: { from: "extract", to: "park-for-later" },
  },
};

function atomicWriteJson(filePath, obj) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, filePath);
}

function mirrorCandidates(slug) {
  const analysisPath = path.join(ANALYSIS_DIR, slug, "analysis.json");
  const vmPath = path.join(ANALYSIS_DIR, slug, "value-map.json");

  const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
  const vm = JSON.parse(fs.readFileSync(vmPath, "utf8"));

  if (!Array.isArray(vm.candidates)) {
    return { slug, status: "SKIP", reason: "value-map has no candidates array" };
  }

  const before = Array.isArray(analysis.candidates) ? analysis.candidates.length : 0;
  const beforeIsObjects = before > 0 && typeof analysis.candidates[0] === "object";

  // Deep-copy value-map candidates into analysis.json.candidates
  analysis.candidates = JSON.parse(JSON.stringify(vm.candidates));

  atomicWriteJson(analysisPath, analysis);

  return {
    slug,
    status: "OK",
    before,
    beforeIsObjects,
    after: analysis.candidates.length,
    sampleFields: Object.keys(analysis.candidates[0] || {}),
  };
}

function patchEnums(slug) {
  const patches = ENUM_PATCH_SOURCES[slug];
  if (!patches) return null;

  const analysisPath = path.join(ANALYSIS_DIR, slug, "analysis.json");
  const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));

  const applied = [];
  for (const [field, { from, to }] of Object.entries(patches)) {
    const current = analysis.scoring?.[field];
    if (current === from) {
      analysis.scoring[field] = to;
      applied.push(`${field}: "${from}" → "${to}"`);
    } else if (current === to) {
      applied.push(`${field}: already "${to}" (idempotent)`);
    } else {
      applied.push(`${field}: UNEXPECTED "${current}" — not patched`);
    }
  }

  atomicWriteJson(analysisPath, analysis);
  return { slug, applied };
}

function main() {
  console.log("T29 Step 10.5 — Category A+D+G remediation\n");

  console.log("== A+D: Mirror candidates from value-map → analysis.json ==");
  for (const slug of MIRROR_SOURCES) {
    try {
      const r = mirrorCandidates(slug);
      console.log(
        `  ${slug}: ${r.status} before=${r.before}(objects=${r.beforeIsObjects}) after=${r.after} fields=[${r.sampleFields?.join(",")}]`
      );
    } catch (e) {
      console.log(`  ${slug}: ERROR — ${e.message}`);
    }
  }

  console.log("\n== G: Patch outline legacy enum values ==");
  for (const slug of Object.keys(ENUM_PATCH_SOURCES)) {
    try {
      const r = patchEnums(slug);
      console.log(`  ${slug}: ${r.applied.join(", ")}`);
    } catch (e) {
      console.log(`  ${slug}: ERROR — ${e.message}`);
    }
  }

  console.log("\nDone.");
}

main();
