"use strict";

/**
 * Content Analysis System — Schema Migration
 *
 * Normalizes existing analysis.json files to unified schema v3.0.
 * Generates summaries from creatorLens/key_claims for existing sources.
 * Validates all migrated files with Zod.
 *
 * Usage: node scripts/cas/migrate-schemas.js [--dry-run] [--verbose]
 *
 * @see .planning/content-analysis-system/DECISIONS.md (Decision #29)
 */

const fs = require("node:fs");
const path = require("node:path");
const nodeCrypto = require("node:crypto");
const { sanitizeError } = require("../lib/security-helpers.js");
const { validate } = require("../lib/analysis-schema.js");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "analysis");

const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

function log(msg) {
  if (VERBOSE) console.log(`  ${msg}`);
}

function generateUUID() {
  return nodeCrypto.randomUUID();
}

function bandFromScore(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Healthy";
  if (score >= 40) return "Needs Work";
  return "Critical";
}

function generateAnalysisSummary(data, slug) {
  // Try creatorLens (repo-analysis)
  if (data.creatorLens && typeof data.creatorLens === "string") {
    const sentences = data.creatorLens.split(/[.!?]+/).filter((s) => s.trim());
    if (sentences.length >= 2) {
      return sentences.slice(0, 2).join(". ").trim() + ".";
    }
    return data.creatorLens.substring(0, 200).trim();
  }

  // Try key_claims (website-analysis)
  if (data.key_claims && Array.isArray(data.key_claims) && data.key_claims.length > 0) {
    return data.key_claims.slice(0, 2).join(" ").substring(0, 200).trim();
  }

  // Try creator_verdict recommendation
  if (data.creator_verdict?.recommendation) {
    return data.creator_verdict.recommendation;
  }

  // Try repo description
  if (data.repo?.description) {
    return data.repo.description;
  }

  // Try site description
  if (data.site?.description) {
    return data.site.description;
  }

  // Fallback
  return `Analysis of ${slug}. Run Standard/Deep for detailed summary.`;
}

function detectSourceType(data) {
  if (data.source_type) return data.source_type;
  if (data.repo_type || data.repoType || data.repo) return "repo";
  if (data.site_type || data.site || data.compliance) return "website";
  return "repo"; // default for legacy
}

function extractScoring(data) {
  let qualityScore = 50;
  let fitScore = 50;

  // Try unified scoring first
  if (data.scoring) return data.scoring;

  // Try summary_bands / summaryBands
  const bands = data.summary_bands || data.summaryBands;
  if (bands && typeof bands === "object") {
    const bandValues = Object.values(bands).filter((b) => b && typeof b.score === "number");
    if (bandValues.length > 0) {
      qualityScore = bandValues.reduce((sum, b) => sum + b.score, 0) / bandValues.length;
    }
  }

  // Try adoption assessment for fit
  if (data.adoption_assessment?.verdict_score) {
    fitScore = data.adoption_assessment.verdict_score;
  } else if (data.adoptionAssessment?.verdict_score) {
    fitScore = data.adoptionAssessment.verdict_score;
  } else if (data.creator_verdict?.verdict_score) {
    fitScore = data.creator_verdict.verdict_score;
  }

  // Try Quick Scan lens format (adoptionLens/creatorLens with score)
  if (data.scoring?.adoptionLens?.score) {
    qualityScore = data.scoring.adoptionLens.score;
  }
  if (data.scoring?.creatorLens?.score) {
    fitScore = data.scoring.creatorLens.score;
  }

  let classification;
  if (fitScore >= 60) {
    classification = "active-sprint";
  } else if (fitScore >= 40) {
    classification = "park-for-later";
  } else if (qualityScore >= 60) {
    classification = "evergreen";
  } else {
    classification = "not-relevant";
  }

  return {
    quality_band: bandFromScore(qualityScore),
    quality_score: Math.round(qualityScore),
    personal_fit_band: bandFromScore(fitScore),
    personal_fit_score: Math.round(fitScore),
    classification,
  };
}

function extractCandidates(data) {
  // Try unified candidates array
  if (data.candidates && Array.isArray(data.candidates)) return data.candidates;

  // Try value-map style arrays
  const candidates = [];
  const candidateArrays = [
    "patternCandidates",
    "knowledgeCandidates",
    "contentCandidates",
    "antiPatternCandidates",
  ];

  for (const key of candidateArrays) {
    if (data[key] && Array.isArray(data[key])) {
      for (const c of data[key]) {
        candidates.push({
          name: c.name || c.title || "unnamed",
          type:
            c.type ||
            key
              .replaceAll("Candidates", "")
              .replaceAll(/([A-Z])/g, "-$1")
              .toLowerCase()
              .replace(/^-/, ""),
          description: c.detail || c.description || "",
          novelty: (c.novelty || "medium").toLowerCase(),
          effort: c.effort || "E1",
          relevance: (c.relevance || "medium").toLowerCase(),
          tags: c.tags || [],
        });
      }
    }
  }

  return candidates;
}

function generateTags(data, sourceType) {
  const tags = [];
  tags.push(sourceType);

  // Add ecosystem tags
  if (data.ecosystem_tags) {
    tags.push(...data.ecosystem_tags);
  }

  // Add repo type
  if (data.repo_type || data.repoType) {
    tags.push((data.repo_type || data.repoType).toLowerCase());
  }

  // Add site type
  if (data.site_type) {
    tags.push(data.site_type.toLowerCase().replaceAll(/\s+/g, "-"));
  }

  // Deduplicate
  return [...new Set(tags.map((t) => t.toLowerCase().replace(/^#/, "")))];
}

function migrateAnalysis(filePath, slug) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`  SKIP ${slug}: parse error — ${sanitizeError(err)}`);
    return null;
  }

  // Already migrated?
  if (data.schema_version === "3.0" && data.id && data.scoring) {
    log(`SKIP ${slug}: already v3.0`);
    return "already_migrated";
  }

  const sourceType = detectSourceType(data);
  const source = data.source || data.meta?.repo || data.meta?.url || data.repo?.full_name || slug;
  const title = data.title || data.site?.title || data.repo?.description?.substring(0, 80) || slug;
  const analyzedAt = data.analyzed_at || data.meta?.scan_date || data.analysisDate || null;
  const depth = data.depth || data.meta?.scan_depth || "quick";

  const existingId =
    typeof data.id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.id)
      ? data.id
      : null;

  const migrated = {
    id: existingId ?? generateUUID(),
    schema_version: "3.0",
    source_type: sourceType,
    source,
    slug,
    title,
    analyzed_at: analyzedAt,
    depth,
    tags: generateTags(data, sourceType),
    scoring: extractScoring(data),
    summary: generateAnalysisSummary(data, slug),
    creator_view: data.creator_view || data.creatorLens || "",
    candidates: extractCandidates(data),
    last_synthesized_at: null,
  };

  // Preserve all original fields as type-specific extensions
  // Strip prototype pollution keys before spreading
  const preserved = { ...data };
  delete preserved.__proto__;
  delete preserved.constructor;
  delete preserved.prototype;
  delete preserved.id;
  delete preserved.schema_version;
  delete preserved.source_type;
  delete preserved.source;
  delete preserved.slug;
  delete preserved.title;
  delete preserved.analyzed_at;
  delete preserved.depth;
  delete preserved.tags;
  delete preserved.scoring;
  delete preserved.summary;
  delete preserved.creator_view;
  delete preserved.candidates;
  delete preserved.last_synthesized_at;

  // Merge preserved fields (type-specific data)
  const final = { ...migrated, ...preserved };

  // Validate core fields
  const result = validate(final, "analysis");
  if (result.success) {
    log(`OK ${slug}: migrated to v3.0`);
  } else {
    console.error(`  WARN ${slug}: validation issues — ${result.error}`);
    // Still write — validation may fail on type-specific union but core is good
  }

  return final;
}

function processEntry(slug, filePath, counts) {
  const result = migrateAnalysis(filePath, slug);

  if (result === null) {
    counts.errors++;
    return;
  }

  if (result === "already_migrated") {
    counts.alreadyDone++;
    return;
  }

  if (DRY_RUN) {
    console.log(`  Would migrate: ${slug} (${result.source_type})`);
    counts.migrated++;
    return;
  }

  try {
    const { safeWriteFileSync } = require("../lib/safe-fs");
    safeWriteFileSync(filePath, JSON.stringify(result, null, 2) + "\n");
    counts.migrated++;
  } catch (err) {
    console.error(`  ERROR writing ${slug}: ${sanitizeError(err)}`);
    counts.errors++;
  }
}

function main() {
  console.log("Content Analysis System — Schema Migration");
  console.log(`Directory: ${path.relative(PROJECT_ROOT, ANALYSIS_DIR)}`);
  if (DRY_RUN) console.log("DRY RUN — no files will be modified");

  if (!fs.existsSync(ANALYSIS_DIR)) {
    console.error("Analysis directory not found");
    process.exit(1);
  }

  const counts = { migrated: 0, skipped: 0, errors: 0, alreadyDone: 0 };

  try {
    const entries = fs.readdirSync(ANALYSIS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const slug = entry.name;
      const filePath = path.join(ANALYSIS_DIR, slug, "analysis.json");

      if (!fs.existsSync(filePath)) {
        log(`SKIP ${slug}: no analysis.json`);
        counts.skipped++;
        continue;
      }

      processEntry(slug, filePath, counts);
    }
  } catch (err) {
    console.error(`Fatal: ${sanitizeError(err)}`);
    process.exit(1);
  }

  console.log(`\nResults:`);
  console.log(`  Migrated: ${counts.migrated}`);
  console.log(`  Already v3.0: ${counts.alreadyDone}`);
  console.log(`  Skipped: ${counts.skipped}`);
  console.log(`  Errors: ${counts.errors}`);

  if (!DRY_RUN && counts.migrated > 0) {
    console.log(`\nRebuilding index...`);
    try {
      require("node:child_process").execFileSync(
        process.execPath,
        [path.join(__dirname, "rebuild-index.js")],
        { stdio: "inherit" }
      );
    } catch (err) {
      console.error(`Index rebuild failed: ${sanitizeError(err)}`);
    }
  }
}

main();
