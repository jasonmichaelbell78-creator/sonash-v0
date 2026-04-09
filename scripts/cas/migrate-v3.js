"use strict";

/**
 * Content Analysis System — v3.0 Schema Migration
 *
 * Fixes incomplete v3.0 migrations: fills missing fields, fixes scoring,
 * generates tags, validates against Zod. Idempotent — safe to run repeatedly.
 *
 * Usage: node scripts/cas/migrate-v3.js [--dry-run] [--verbose]
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

function log(msg) {
  if (VERBOSE) console.log("  " + msg);
}

function bandToScore(band) {
  const map = { Excellent: 85, Healthy: 70, "Needs Work": 45, Critical: 25 };
  return map[band] || 50;
}

function scoreToBand(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Healthy";
  if (score >= 40) return "Needs Work";
  return "Critical";
}

function scoreToClassification(fitScore) {
  if (fitScore >= 60) return "active-sprint";
  if (fitScore >= 40) return "park-for-later";
  return "evergreen";
}

function generateTags(data, dirName) {
  const tags = new Set(data.tags || []);

  // Source type tag
  if (data.source_type) tags.add(data.source_type);

  // Derive from slug/dirName
  const words = dirName
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/);
  for (const w of words) {
    if (w.length >= 4 && !["analysis", "the", "and", "for", "with", "from"].includes(w)) {
      tags.add(w);
    }
  }

  // From metadata
  if (data.metadata?.language) tags.add(String(data.metadata.language).toLowerCase());
  if (Array.isArray(data.metadata?.topics)) {
    for (const t of data.metadata.topics.slice(0, 5)) {
      if (t != null) tags.add(String(t).toLowerCase());
    }
  }

  // Ensure minimum 5
  if (tags.size < 5 && data.source_type === "repo") tags.add("repository");
  if (tags.size < 5 && data.source_type === "website") tags.add("web");
  if (tags.size < 5) tags.add("analysis");

  return [...tags].slice(0, 10);
}

function fixRecord(data, dirName, filePath) {
  const fixes = [];
  let changed = false;

  // 1. analyzed_at — from file mtime
  if (!data.analyzed_at) {
    try {
      const st = fs.lstatSync(filePath);
      if (st.isSymbolicLink()) throw new Error("symlink");
      data.analyzed_at = st.mtime.toISOString();
      fixes.push("analyzed_at from mtime");
      changed = true;
    } catch {
      /* skip */
    }
  }

  // 2. scoring — fix partial/missing, handle v2 format
  if (!data.scoring) {
    data.scoring = {
      quality_band: "Needs Work",
      quality_score: 50,
      personal_fit_band: "Needs Work",
      personal_fit_score: 50,
      classification: "park-for-later",
    };
    fixes.push("scoring created (defaults)");
    changed = true;
  } else if (data.scoring.adoptionLens || data.scoring.creatorLens) {
    // v2 format: adoptionLens/creatorLens → quality/personal_fit
    const qs = data.scoring.adoptionLens?.score ?? data.scoring.creatorLens?.score ?? 50;
    const fitScore = data.scoring.creatorLens?.score ?? data.scoring.adoptionLens?.score ?? 50;
    data.scoring = {
      quality_band: scoreToBand(qs),
      quality_score: qs,
      personal_fit_band: scoreToBand(fitScore),
      personal_fit_score: fitScore,
      classification: scoreToClassification(fitScore),
    };
    fixes.push("scoring migrated from v2 lenses");
    changed = true;
  } else {
    if (
      data.scoring.quality_band &&
      (data.scoring.quality_score === undefined || data.scoring.quality_score === null)
    ) {
      data.scoring.quality_score = bandToScore(data.scoring.quality_band);
      fixes.push("quality_score from band");
      changed = true;
    }
    if (
      data.scoring.personal_fit_band &&
      (data.scoring.personal_fit_score === undefined || data.scoring.personal_fit_score === null)
    ) {
      data.scoring.personal_fit_score = bandToScore(data.scoring.personal_fit_band);
      fixes.push("personal_fit_score from band");
      changed = true;
    }
    if (!data.scoring.quality_band && data.scoring.quality_score !== undefined) {
      data.scoring.quality_band = scoreToBand(data.scoring.quality_score);
      fixes.push("quality_band from score");
      changed = true;
    }
    if (!data.scoring.personal_fit_band && data.scoring.personal_fit_score !== undefined) {
      data.scoring.personal_fit_band = scoreToBand(data.scoring.personal_fit_score);
      fixes.push("personal_fit_band from score");
      changed = true;
    }
    if (!data.scoring.classification) {
      data.scoring.classification = scoreToClassification(data.scoring.personal_fit_score || 50);
      fixes.push("classification from fit score");
      changed = true;
    }
    // Fix band names that don't match enum
    const validBands = new Set(["Critical", "Needs Work", "Healthy", "Excellent"]);
    if (!validBands.has(data.scoring.quality_band)) {
      data.scoring.quality_band = scoreToBand(data.scoring.quality_score || 50);
      fixes.push("quality_band corrected");
      changed = true;
    }
    if (!validBands.has(data.scoring.personal_fit_band)) {
      data.scoring.personal_fit_band = scoreToBand(data.scoring.personal_fit_score || 50);
      fixes.push("personal_fit_band corrected");
      changed = true;
    }
  }

  // 3. tags — ensure 5+
  const newTags = generateTags(data, dirName);
  if (!data.tags || data.tags.length < 5) {
    data.tags = newTags;
    fixes.push("tags generated (" + newTags.length + ")");
    changed = true;
  }

  // 4. creator_view — fill from summary if empty
  if (!data.creator_view || data.creator_view.length < 20) {
    data.creator_view =
      data.summary || "(creator view not generated — re-analyze for full content)";
    fixes.push("creator_view from summary");
    changed = true;
  }

  // 5. candidates — ensure array exists
  if (!data.candidates) {
    data.candidates = [];
    fixes.push("candidates initialized []");
    changed = true;
  }

  // 6. last_synthesized_at — ensure exists
  if (data.last_synthesized_at === undefined) {
    data.last_synthesized_at = null;
    fixes.push("last_synthesized_at null");
    changed = true;
  }

  // 7. schema_version
  if (data.schema_version !== "3.0") {
    data.schema_version = "3.0";
    fixes.push("schema_version → 3.0");
    changed = true;
  }

  return { data, fixes, changed };
}

function main() {
  if (!fs.existsSync(ANALYSIS_DIR)) {
    console.error("Analysis directory not found.");
    process.exit(1);
  }

  const dirs = fs
    .readdirSync(ANALYSIS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"));

  let totalFixed = 0;
  let totalValid = 0;
  let totalInvalid = 0;
  let totalSkipped = 0;

  for (const dir of dirs) {
    const ap = path.join(ANALYSIS_DIR, dir.name, "analysis.json");
    if (!fs.existsSync(ap)) {
      totalSkipped++;
      continue;
    }

    try {
      const st = fs.lstatSync(ap);
      if (st.isSymbolicLink()) {
        console.warn("SKIP:", dir.name, "— symlinked analysis.json");
        totalSkipped++;
        continue;
      }
      const raw = fs.readFileSync(ap, "utf8");
      const data = JSON.parse(raw);
      const { data: fixed, fixes, changed } = fixRecord(data, dir.name, ap);

      if (!changed) {
        const result = validate(fixed, "analysis");
        if (result.success) {
          totalValid++;
        } else {
          totalInvalid++;
          console.log("STILL INVALID:", dir.name, result.error);
        }
        continue;
      }

      // Validate after fixes
      const result = validate(fixed, "analysis");
      if (!result.success) {
        totalInvalid++;
        console.log("INVALID after fixes:", dir.name, "—", fixes.join(", "));
        log("Validation: " + result.error);
        continue;
      }

      totalFixed++;
      console.log("FIXED:", dir.name, "—", fixes.join(", "));

      if (!DRY_RUN) {
        if (!isSafeToWrite(ap)) {
          console.error("Refusing to write symlinked path:", ap);
          continue;
        }
        safeWriteFileSync(ap, JSON.stringify(fixed, null, 2) + "\n", "utf8");
      }
    } catch (err) {
      console.error("ERROR:", dir.name, sanitizeError(err));
      totalSkipped++;
    }
  }

  console.log("\n--- Migration Summary ---");
  console.log(
    "Fixed:",
    totalFixed,
    "| Already valid:",
    totalValid,
    "| Still invalid:",
    totalInvalid,
    "| Skipped:",
    totalSkipped
  );
  if (DRY_RUN) console.log("(dry run — no files written)");
}

try {
  main();
} catch (err) {
  console.error("Fatal:", sanitizeError(err));
  process.exit(1);
}
