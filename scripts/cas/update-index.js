"use strict";

/**
 * Content Analysis System — Incremental Index Update
 *
 * Updates the SQLite index for a single source after analysis completes.
 * Called by /analyze router after handler finishes.
 *
 * Usage: node scripts/cas/update-index.js --slug=<slug>
 *
 * NOTE: db.exec() calls below are SQLite operations, not child_process.
 *
 * @see .planning/content-analysis-system/DECISIONS.md (Decision #28)
 */

const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { sanitizeError } = require("../lib/security-helpers.js");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DB_PATH = path.join(PROJECT_ROOT, ".research", "content-analysis.db");
const ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "analysis");
const REPO_ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "repo-analysis");
const WEBSITE_ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "website-analysis");
const JOURNAL_PATH = path.join(PROJECT_ROOT, ".research", "extraction-journal.jsonl");

function parseArgs(argv) {
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--slug=")) return arg.slice(7);
  }
  return null;
}

function findAnalysisFile(slug) {
  const dirs = [ANALYSIS_DIR, REPO_ANALYSIS_DIR, WEBSITE_ANALYSIS_DIR];
  for (const dir of dirs) {
    const filePath = path.join(dir, slug, "analysis.json");
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

function loadAnalysis(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`Error parsing ${path.relative(PROJECT_ROOT, filePath)}: ${sanitizeError(err)}`);
    return null;
  }
}

function extractSourceRecord(data, slug) {
  const id = data.id || `generated-${slug}`;
  const sourceType = data.source_type || "repo";
  const source = data.source || data.meta?.repo || data.meta?.url || slug;
  const title = data.title || data.site?.title || data.repo?.description || slug;
  const analyzedAt = data.analyzed_at || data.meta?.scan_date || null;
  const depth = data.depth || data.meta?.scan_depth || "quick";

  let qualityBand = "Needs Work";
  let qualityScore = 50;
  let fitBand = "Needs Work";
  let fitScore = 50;
  let classification = "park-for-later";

  if (data.scoring) {
    qualityBand = data.scoring.quality_band || qualityBand;
    qualityScore = data.scoring.quality_score || qualityScore;
    fitBand = data.scoring.personal_fit_band || fitBand;
    fitScore = data.scoring.personal_fit_score || fitScore;
    classification = data.scoring.classification || classification;
  } else if (data.summary_bands) {
    const bands = Object.values(data.summary_bands);
    if (bands.length > 0) {
      qualityScore = bands.reduce((sum, b) => sum + (b.score ?? 0), 0) / bands.length;
      qualityBand =
        qualityScore >= 80
          ? "Excellent"
          : qualityScore >= 60
            ? "Healthy"
            : qualityScore >= 40
              ? "Needs Work"
              : "Critical";
    }
  }

  const summary = data.summary || data.creatorLens || "(no summary)";
  const tags = JSON.stringify(data.tags || data.ecosystem_tags || []);

  return {
    id,
    source_type: sourceType,
    source,
    slug,
    title,
    analyzed_at: analyzedAt,
    depth,
    quality_band: qualityBand,
    quality_score: qualityScore,
    personal_fit_band: fitBand,
    personal_fit_score: fitScore,
    classification,
    summary,
    tags,
    last_synthesized_at: data.last_synthesized_at || null,
  };
}

function ensureTag(db, tagName, tagCache) {
  const normalized = tagName.toLowerCase().replace(/^#/, "").trim();
  if (!normalized) return null;
  if (tagCache.has(normalized)) return tagCache.get(normalized);

  let row = db.prepare("SELECT id FROM tags WHERE name = ?").get(normalized);
  if (!row) {
    const info = db.prepare("INSERT INTO tags (name) VALUES (?)").run(normalized);
    row = { id: info.lastInsertRowid };
  }
  tagCache.set(normalized, row.id);
  return row.id;
}

function rebuildFTS(db) {
  // SQLite FTS rebuild — NOT child_process
  db.prepare("INSERT INTO search_sources(search_sources) VALUES('rebuild')").run();
  db.prepare("INSERT INTO search_extractions(search_extractions) VALUES('rebuild')").run();
}

function main() {
  const slug = parseArgs(process.argv);
  if (!slug) {
    console.error("Usage: node scripts/cas/update-index.js --slug=<slug>");
    process.exit(1);
  }

  // Path traversal guard (CLAUDE.md §5)
  const rel = path.relative(PROJECT_ROOT, path.resolve(ANALYSIS_DIR, slug));
  if (/^\.\.(?:[/\\]|$)/.test(rel) || path.isAbsolute(slug)) {
    console.error("Invalid slug: path traversal detected");
    process.exit(1);
  }

  if (!fs.existsSync(DB_PATH)) {
    console.error("Index not found. Run: node scripts/cas/rebuild-index.js first");
    process.exit(1);
  }

  const filePath = findAnalysisFile(slug);
  if (!filePath) {
    console.error(`No analysis.json found for slug: ${slug}`);
    process.exit(1);
  }

  const data = loadAnalysis(filePath);
  if (!data) process.exit(1);

  const record = extractSourceRecord(data, slug);
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const tagCache = new Map();

  const update = db.transaction(() => {
    // Upsert source
    db.prepare(
      `
      INSERT OR REPLACE INTO sources
      (id, source_type, source, slug, title, analyzed_at, depth,
       quality_band, quality_score, personal_fit_band, personal_fit_score,
       classification, summary, tags, last_synthesized_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      record.id,
      record.source_type,
      record.source,
      record.slug,
      record.title,
      record.analyzed_at,
      record.depth,
      record.quality_band,
      record.quality_score,
      record.personal_fit_band,
      record.personal_fit_score,
      record.classification,
      record.summary,
      record.tags,
      record.last_synthesized_at
    );

    // Update source tags
    db.prepare("DELETE FROM source_tags WHERE source_id = ?").run(record.id);
    const parsedTags = JSON.parse(record.tags);
    for (const tag of parsedTags) {
      const tagId = ensureTag(db, tag, tagCache);
      if (tagId) {
        db.prepare("INSERT OR IGNORE INTO source_tags (source_id, tag_id) VALUES (?, ?)").run(
          record.id,
          tagId
        );
      }
    }

    // Remove old extractions for this source and re-insert from journal
    db.prepare("DELETE FROM extractions WHERE source = ? OR source LIKE ?").run(
      record.source,
      `%${slug}%`
    );

    if (fs.existsSync(JOURNAL_PATH)) {
      const lines = fs.readFileSync(JOURNAL_PATH, "utf8").trim().split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          if (entry.source !== record.source && !entry.source?.includes(slug)) continue;

          const tags = JSON.stringify(entry.tags || []);
          const info = db
            .prepare(
              `
            INSERT INTO extractions
            (schema_version, source_type, source, source_analysis_id, candidate,
             type, decision, decision_date, extracted_to, extracted_at,
             notes, novelty, effort, relevance, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
            )
            .run(
              entry.schema_version || "2.0",
              entry.source_type || "repo",
              entry.source || "",
              entry.source_analysis_id || null,
              entry.candidate || "",
              entry.type || "knowledge",
              entry.decision || "defer",
              entry.decision_date || null,
              entry.extracted_to || null,
              entry.extracted_at || null,
              entry.notes || "",
              entry.novelty || "medium",
              entry.effort || "E1",
              entry.relevance || "medium",
              tags
            );

          const entryTags = entry.tags || [];
          for (const tag of entryTags) {
            const tagId = ensureTag(db, tag, tagCache);
            if (tagId) {
              db.prepare(
                "INSERT OR IGNORE INTO extraction_tags (extraction_id, tag_id) VALUES (?, ?)"
              ).run(info.lastInsertRowid, tagId);
            }
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    rebuildFTS(db);
  });

  update();

  const count = db
    .prepare("SELECT COUNT(*) as count FROM extractions WHERE source = ? OR source LIKE ?")
    .get(record.source, `%${slug}%`);

  console.log(`Updated index for ${slug}: source upserted, ${count.count} extractions synced.`);
  db.close();
}

try {
  main();
} catch (err) {
  console.error(`Fatal: ${sanitizeError(err)}`);
  process.exit(1);
}
