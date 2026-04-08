"use strict";

/**
 * Content Analysis System — Recall (Query Interface)
 *
 * Query the SQLite search index for extraction candidates and sources.
 *
 * Usage:
 *   node scripts/cas/recall.js <query>                  # Free-text FTS5 search
 *   node scripts/cas/recall.js --tag=architecture       # Tag filter
 *   node scripts/cas/recall.js --type=repo              # Source type filter
 *   node scripts/cas/recall.js --sort=recent            # Sort by date
 *   node scripts/cas/recall.js --sort=novelty           # Sort by novelty
 *   node scripts/cas/recall.js --source=<slug>          # By specific source
 *   node scripts/cas/recall.js --limit=20               # Result limit
 *   node scripts/cas/recall.js --target=sources         # Query sources instead
 *   node scripts/cas/recall.js --stats                  # Show index statistics
 *
 * @see .planning/content-analysis-system/DECISIONS.md (Decisions #11, #27)
 */

const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { sanitizeError } = require("../lib/security-helpers.js");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DB_PATH = path.join(PROJECT_ROOT, ".research", "content-analysis.db");

function parseArgs(argv) {
  const args = {
    query: [],
    tag: null,
    type: null,
    sort: null,
    source: null,
    limit: 20,
    target: "extractions",
    stats: false,
  };

  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--tag=")) {
      args.tag = arg.slice(6).replace(/^#/, "").toLowerCase();
    } else if (arg.startsWith("--type=")) {
      args.type = arg.slice(7);
    } else if (arg.startsWith("--sort=")) {
      args.sort = arg.slice(7);
    } else if (arg.startsWith("--source=")) {
      args.source = arg.slice(9);
    } else if (arg.startsWith("--limit=")) {
      args.limit = parseInt(arg.slice(8), 10) || 20;
    } else if (arg === "--target=sources") {
      args.target = "sources";
    } else if (arg === "--stats") {
      args.stats = true;
    } else if (!arg.startsWith("--")) {
      args.query.push(arg);
    }
  }

  args.freeText = args.query.join(" ").trim();
  return args;
}

function showStats(db) {
  const sources = db.prepare("SELECT COUNT(*) as count FROM sources").get();
  const extractions = db.prepare("SELECT COUNT(*) as count FROM extractions").get();
  const tags = db.prepare("SELECT COUNT(*) as count FROM tags").get();

  const byType = db
    .prepare(
      "SELECT source_type, COUNT(*) as count FROM sources GROUP BY source_type ORDER BY count DESC"
    )
    .all();

  const byNovelty = db
    .prepare(
      "SELECT novelty, COUNT(*) as count FROM extractions GROUP BY novelty ORDER BY count DESC"
    )
    .all();

  const topTags = db
    .prepare(
      `
      SELECT t.name, COUNT(*) as count
      FROM extraction_tags et JOIN tags t ON et.tag_id = t.id
      GROUP BY t.name ORDER BY count DESC LIMIT 15
    `
    )
    .all();

  console.log(
    JSON.stringify(
      {
        summary: {
          sources: sources.count,
          extractions: extractions.count,
          unique_tags: tags.count,
        },
        by_source_type: byType,
        by_novelty: byNovelty,
        top_tags: topTags,
      },
      null,
      2
    )
  );
}

function queryExtractions(db, args) {
  const conditions = [];
  const params = [];

  if (args.freeText) {
    conditions.push(
      "e.rowid IN (SELECT rowid FROM search_extractions WHERE search_extractions MATCH ?)"
    );
    params.push(args.freeText);
  }

  if (args.tag) {
    conditions.push(`
      e.id IN (
        SELECT et.extraction_id FROM extraction_tags et
        JOIN tags t ON et.tag_id = t.id
        WHERE t.name = ?
      )
    `);
    params.push(args.tag);
  }

  if (args.type) {
    conditions.push("e.source_type = ?");
    params.push(args.type);
  }

  if (args.source) {
    conditions.push("e.source LIKE ?");
    params.push(`%${args.source}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy = "ORDER BY e.id DESC";
  if (args.sort === "recent") orderBy = "ORDER BY e.decision_date DESC";
  if (args.sort === "novelty")
    orderBy =
      "ORDER BY CASE e.novelty WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END";

  const sql = `
    SELECT e.candidate, e.type, e.source, e.source_type, e.novelty,
           e.effort, e.relevance, e.decision, e.decision_date, e.notes, e.tags
    FROM extractions e
    ${where}
    ${orderBy}
    LIMIT ?
  `;
  params.push(args.limit);

  return db.prepare(sql).all(...params);
}

function querySources(db, args) {
  const conditions = [];
  const params = [];

  if (args.freeText) {
    conditions.push("s.rowid IN (SELECT rowid FROM search_sources WHERE search_sources MATCH ?)");
    params.push(args.freeText);
  }

  if (args.tag) {
    conditions.push(`
      s.id IN (
        SELECT st.source_id FROM source_tags st
        JOIN tags t ON st.tag_id = t.id
        WHERE t.name = ?
      )
    `);
    params.push(args.tag);
  }

  if (args.type) {
    conditions.push("s.source_type = ?");
    params.push(args.type);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy = "ORDER BY s.analyzed_at DESC";
  if (args.sort === "recent") orderBy = "ORDER BY s.analyzed_at DESC";

  const sql = `
    SELECT s.title, s.source_type, s.source, s.slug, s.depth,
           s.quality_band, s.quality_score, s.personal_fit_band,
           s.personal_fit_score, s.classification, s.summary, s.tags
    FROM sources s
    ${where}
    ${orderBy}
    LIMIT ?
  `;
  params.push(args.limit);

  return db.prepare(sql).all(...params);
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error("Index not found. Run: node scripts/cas/rebuild-index.js");
    process.exit(1);
  }

  const args = parseArgs(process.argv);
  const db = new Database(DB_PATH, { readonly: true });
  db.pragma("journal_mode = WAL");

  if (args.stats) {
    showStats(db);
    db.close();
    return;
  }

  if (!args.freeText && !args.tag && !args.type && !args.source && !args.sort) {
    console.error(
      "Usage: node scripts/cas/recall.js <query> [--tag=X] [--type=X] [--sort=X] [--source=X] [--stats]"
    );
    process.exit(1);
  }

  const results = args.target === "sources" ? querySources(db, args) : queryExtractions(db, args);

  console.log(JSON.stringify(results, null, 2));
  console.error(`\n${results.length} results returned.`);

  db.close();
}

try {
  main();
} catch (err) {
  console.error(`Fatal: ${sanitizeError(err)}`);
  process.exit(1);
}
