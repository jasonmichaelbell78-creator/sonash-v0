"use strict";

/**
 * Content Analysis System — Rebuild Index
 *
 * Idempotent rebuild of the SQLite search index from .research/ files.
 * Deletes existing DB and recreates from source files. Safe to run anytime.
 *
 * Usage: node scripts/cas/rebuild-index.js [--verbose] [--dry-run]
 *
 * @see .planning/content-analysis-system/DECISIONS.md (Decisions #9, #10, #24)
 */

const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { sanitizeError } = require("../lib/security-helpers.js");
const { isSafeToWrite } = require("../lib/safe-fs");
const readJsonl = require("../lib/read-jsonl.js");

const PROJECT_ROOT = path.resolve(__dirname, "../.."); // validatePathInDir: constant
const DB_PATH = path.join(PROJECT_ROOT, ".research", "content-analysis.db");
const ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "analysis");
const REPO_ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "repo-analysis");
const WEBSITE_ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "website-analysis");
const JOURNAL_PATH = path.join(PROJECT_ROOT, ".research", "extraction-journal.jsonl");

const VERBOSE = process.argv.includes("--verbose");
const DRY_RUN = process.argv.includes("--dry-run");

function log(msg) {
  if (VERBOSE) console.log(`  ${msg}`);
}

function createSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      source_type TEXT NOT NULL,
      source TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      analyzed_at TEXT,
      depth TEXT,
      quality_band TEXT,
      quality_score REAL,
      personal_fit_band TEXT,
      personal_fit_score REAL,
      classification TEXT,
      summary TEXT,
      tags TEXT DEFAULT '[]',
      last_synthesized_at TEXT
    );

    CREATE TABLE IF NOT EXISTS extractions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schema_version TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source TEXT NOT NULL,
      source_analysis_id TEXT,
      candidate TEXT NOT NULL,
      type TEXT NOT NULL,
      decision TEXT NOT NULL,
      decision_date TEXT,
      extracted_to TEXT,
      extracted_at TEXT,
      notes TEXT,
      novelty TEXT,
      effort TEXT,
      relevance TEXT,
      tags TEXT DEFAULT '[]',
      FOREIGN KEY (source_analysis_id) REFERENCES sources(id)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS source_tags (
      source_id TEXT NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (source_id, tag_id),
      FOREIGN KEY (source_id) REFERENCES sources(id),
      FOREIGN KEY (tag_id) REFERENCES tags(id)
    );

    CREATE TABLE IF NOT EXISTS extraction_tags (
      extraction_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (extraction_id, tag_id),
      FOREIGN KEY (extraction_id) REFERENCES extractions(id),
      FOREIGN KEY (tag_id) REFERENCES tags(id)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS search_sources USING fts5(
      title, summary, tags,
      tokenize = 'porter unicode61',
      content = 'sources',
      content_rowid = 'rowid'
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS search_extractions USING fts5(
      candidate, notes, tags,
      tokenize = 'porter unicode61',
      content = 'extractions',
      content_rowid = 'rowid'
    );
  `);
}

function bandFromScore(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Healthy";
  if (score >= 40) return "Needs Work";
  return "Critical";
}

function findAnalysisFiles() {
  const files = [];
  const dirs = [ANALYSIS_DIR, REPO_ANALYSIS_DIR, WEBSITE_ANALYSIS_DIR];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
        const analysisPath = path.join(dir, entry.name, "analysis.json");
        if (fs.existsSync(analysisPath)) {
          files.push({ slug: entry.name, path: analysisPath });
        }
      }
    } catch (err) {
      console.error(
        `Warning: could not read ${path.relative(PROJECT_ROOT, dir)}: ${sanitizeError(err)}`
      );
    }
  }
  return files;
}

function loadAnalysis(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(
      `Warning: could not parse ${path.relative(PROJECT_ROOT, filePath)}: ${sanitizeError(err)}`
    );
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
    qualityBand = data.scoring.quality_band ?? qualityBand;
    qualityScore = data.scoring.quality_score ?? qualityScore;
    fitBand = data.scoring.personal_fit_band ?? fitBand;
    fitScore = data.scoring.personal_fit_score ?? fitScore;
    classification = data.scoring.classification ?? classification;
  } else if (data.summary_bands) {
    const bands = Object.values(data.summary_bands);
    if (bands.length > 0) {
      qualityScore = bands.reduce((sum, b) => sum + (b.score ?? 0), 0) / bands.length;
      qualityBand = bandFromScore(qualityScore);
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

function loadExtractionJournal() {
  if (!fs.existsSync(JOURNAL_PATH)) return [];
  try {
    return readJsonl(JOURNAL_PATH, { safe: true });
  } catch (err) {
    console.error(`Warning: could not read journal: ${sanitizeError(err)}`);
    return [];
  }
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

function main() {
  console.log("Content Analysis System — Rebuild Index");
  console.log(`Database: ${path.relative(PROJECT_ROOT, DB_PATH)}`);

  if (DRY_RUN) {
    console.log("DRY RUN — no changes will be made");
    const files = findAnalysisFiles();
    const journal = loadExtractionJournal();
    console.log(`Would index: ${files.length} sources, ${journal.length} extractions`);
    return;
  }

  // Symlink guard — refuse to delete/create through symlinks (check unconditionally)
  const resolvedDb = path.resolve(DB_PATH); // validatePathInDir: constant
  if (!isSafeToWrite(resolvedDb)) {
    console.error("Refusing to operate on symlinked database path");
    process.exit(1);
  }

  // Delete existing DB
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    log("Deleted existing database");
  }

  const db = new Database(DB_PATH);
  try {
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma("foreign_keys = ON");
    db.pragma("temp_store = MEMORY");

    createSchema(db);

    const insertSource = db.prepare(`
    INSERT OR REPLACE INTO sources
    (id, source_type, source, slug, title, analyzed_at, depth,
     quality_band, quality_score, personal_fit_band, personal_fit_score,
     classification, summary, tags, last_synthesized_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    const insertExtraction = db.prepare(`
    INSERT INTO extractions
    (schema_version, source_type, source, source_analysis_id, candidate,
     type, decision, decision_date, extracted_to, extracted_at,
     notes, novelty, effort, relevance, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    const insertSourceTag = db.prepare(
      "INSERT OR IGNORE INTO source_tags (source_id, tag_id) VALUES (?, ?)"
    );
    const insertExtractionTag = db.prepare(
      "INSERT OR IGNORE INTO extraction_tags (extraction_id, tag_id) VALUES (?, ?)"
    );

    const tagCache = new Map();
    let sourceCount = 0;
    let extractionCount = 0;

    function indexSources(files) {
      for (const { slug, path: filePath } of files) {
        const data = loadAnalysis(filePath);
        if (!data) continue;

        const record = extractSourceRecord(data, slug);
        insertSource.run(
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
        sourceCount++;

        let parsedTags = [];
        try {
          const maybe = JSON.parse(record.tags);
          if (Array.isArray(maybe)) parsedTags = maybe.filter((t) => typeof t === "string");
        } catch {
          parsedTags = [];
        }
        for (const tag of parsedTags) {
          const tagId = ensureTag(db, tag, tagCache);
          if (tagId) insertSourceTag.run(record.id, tagId);
        }

        log(`Source: ${slug} (${record.source_type})`);
      }
    }

    function indexExtractions(journal) {
      for (const entry of journal) {
        const tags = JSON.stringify(entry.tags || []);
        const info = insertExtraction.run(
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
        extractionCount++;

        const parsedTags = entry.tags || [];
        for (const tag of parsedTags) {
          const tagId = ensureTag(db, tag, tagCache);
          if (tagId) insertExtractionTag.run(info.lastInsertRowid, tagId);
        }
      }
    }

    const rebuild = db.transaction(() => {
      indexSources(findAnalysisFiles());
      indexExtractions(loadExtractionJournal());
      // SQLite FTS rebuild — NOT child_process
      db.exec("INSERT INTO search_sources(search_sources) VALUES('rebuild')");
      db.exec("INSERT INTO search_extractions(search_extractions) VALUES('rebuild')");
    });

    rebuild();

    // Validation
    const sourceCheck = db.prepare("SELECT COUNT(*) as count FROM sources").get();
    const extractionCheck = db.prepare("SELECT COUNT(*) as count FROM extractions").get();
    const integrityCheck = db.pragma("integrity_check");
    const fkCheck = db.pragma("foreign_key_check");

    console.log(`\nResults:`);
    console.log(`  Sources: ${sourceCheck.count}`);
    console.log(`  Extractions: ${extractionCheck.count}`);
    console.log(`  Unique tags: ${tagCache.size}`);
    console.log(`  Integrity: ${integrityCheck[0].integrity_check}`);
    console.log(`  FK violations: ${fkCheck.length}`);

    if (integrityCheck[0].integrity_check !== "ok" || fkCheck.length > 0) {
      console.error("VALIDATION FAILED — database may be corrupt");
      process.exit(1);
    }

    console.log("\nIndex rebuilt successfully.");
  } finally {
    db.close();
  }
}

try {
  main();
} catch (err) {
  console.error(`Fatal: ${sanitizeError(err)}`);
  process.exit(1);
}
