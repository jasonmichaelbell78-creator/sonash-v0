"use strict";

/**
 * Content Analysis System — Fix Depth Mislabel (T29 Wave 4 Step 8.5)
 *
 * Session #272 pre-Wave-4 audit discovered 9 repos mislabeled as depth="quick"
 * in analysis.json that actually have full Standard artifact sets (7/7) plus
 * extraction journal entries.
 *
 * Root cause: scripts/cas/migrate-schemas.js:223 fallback chain only checked
 * `data.depth || data.meta?.scan_depth || "quick"` — it missed the v2 legacy
 * root-level `data.scanDepth` (camelCase). Six of the nine repos have that
 * field present with value "standard"; the other three never had any depth
 * metadata and fell through to the "quick" default.
 *
 * Evidence: each of the 9 repos has 7/7 Standard artifacts (findings.jsonl,
 * summary.md, deep-read.md, content-eval.jsonl, coverage-audit.jsonl,
 * creator-view.md, value-map.json) and extraction journal entries. Per the
 * "extractions are canon" principle: metadata is fixed under the hood, not by
 * re-running the analysis pipeline.
 *
 * aws-media-extraction was EXCLUDED from this fix: it has meta.scan_depth
 * "quick", only 5/7 Standard artifacts (missing content-eval.jsonl and
 * coverage-audit.jsonl), and a self-consistent quick-scan profile. Its 8
 * journal entries are an unrelated anomaly filed separately.
 *
 * Usage:
 *   node scripts/cas/fix-depth-mislabel.js [--dry-run] [--verbose]
 */

const fs = require("node:fs");
const path = require("node:path");
const { sanitizeError } = require("../lib/security-helpers.js");
const { safeWriteFileSync, isSafeToWrite } = require("../lib/safe-fs");
const { validate } = require("../lib/analysis-schema.js");

const PROJECT_ROOT = path.resolve(__dirname, "../.."); // validatePathInDir: constant-path (no user input)
const ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "analysis");
const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

// The 9 repos mislabeled depth="quick" but with full Standard artifacts.
// See file-header comment for scope rationale.
const MISLABELED_SLUGS = [
  "bedrock-summarize-audio-video-text",
  "bulk-transcribe-youtube-playlist",
  "codecrafters-io-build-your-own-x",
  "hkuds-cli-anything",
  "karpathy-autoresearch",
  "public-apis_public-apis",
  "teng-lin_notebooklm-py",
  "viktoraxelsen-memskill",
  "youtube-transcript-api",
];

const REQUIRED_STANDARD_ARTIFACTS = [
  "findings.jsonl",
  "summary.md",
  "deep-read.md",
  "content-eval.jsonl",
  "coverage-audit.jsonl",
  "creator-view.md",
  "value-map.json",
];

function log(msg) {
  if (VERBOSE) console.log("  " + msg);
}

function hasFullStandardArtifacts(slug) {
  const dir = path.join(ANALYSIS_DIR, slug);
  const missing = [];
  for (const artifact of REQUIRED_STANDARD_ARTIFACTS) {
    const p = path.join(dir, artifact);
    try {
      const st = fs.lstatSync(p);
      if (st.isSymbolicLink()) {
        missing.push(artifact + " (symlink)");
      }
    } catch {
      missing.push(artifact);
    }
  }
  return { ok: missing.length === 0, missing };
}

function fixAnalysisJson(slug) {
  const ap = path.join(ANALYSIS_DIR, slug, "analysis.json");

  let st;
  try {
    st = fs.lstatSync(ap);
  } catch (err) {
    return { status: "MISSING", reason: sanitizeError(err) };
  }
  if (st.isSymbolicLink()) {
    return { status: "SKIP", reason: "symlinked analysis.json" };
  }

  let raw;
  try {
    raw = fs.readFileSync(ap, "utf8");
  } catch (err) {
    return { status: "ERROR", reason: "read failed: " + sanitizeError(err) };
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return { status: "ERROR", reason: "parse failed: " + sanitizeError(err) };
  }

  // Sanity check: this script only fixes the specific known mislabeling.
  if (data.depth !== "quick") {
    return { status: "SKIP", reason: `depth already "${data.depth}"` };
  }

  // Verify Standard artifacts exist before flipping depth.
  const artifactCheck = hasFullStandardArtifacts(slug);
  if (!artifactCheck.ok) {
    return {
      status: "SKIP",
      reason: "incomplete Standard artifacts: missing " + artifactCheck.missing.join(", "),
    };
  }

  data.depth = "standard";

  // Validate against Zod schema before writing.
  const result = validate(data, "analysis");
  if (!result.success) {
    return { status: "INVALID", reason: result.error };
  }

  if (!DRY_RUN) {
    if (!isSafeToWrite(ap)) {
      return { status: "ERROR", reason: "isSafeToWrite refused (symlink?)" };
    }
    try {
      safeWriteFileSync(ap, JSON.stringify(data, null, 2) + "\n", "utf8");
    } catch (err) {
      return { status: "ERROR", reason: "write failed: " + sanitizeError(err) };
    }
  }

  return { status: "FIXED", reason: null };
}

function main() {
  console.log("CAS fix-depth-mislabel" + (DRY_RUN ? " (dry run)" : ""));
  console.log("Scope: " + MISLABELED_SLUGS.length + " repos");
  console.log("---");

  let fixed = 0;
  let skipped = 0;
  let errored = 0;

  for (const slug of MISLABELED_SLUGS) {
    const result = fixAnalysisJson(slug);
    const label = result.status.padEnd(8);
    const suffix = result.reason ? " — " + result.reason : "";
    console.log(label + slug + suffix);

    if (result.status === "FIXED") fixed++;
    else if (result.status === "SKIP") skipped++;
    else errored++;
  }

  console.log("---");
  console.log(`Fixed: ${fixed} | Skipped: ${skipped} | Errored: ${errored}`);
  if (DRY_RUN) console.log("(dry run — no files written)");

  if (errored > 0) process.exit(1);
}

try {
  main();
} catch (err) {
  console.error("Fatal:", sanitizeError(err));
  process.exit(1);
}
