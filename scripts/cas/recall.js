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
const {
  sanitizeError,
  validatePathInDir,
  refuseSymlinkWithParents,
} = require("../lib/security-helpers.js");
const { readTextWithSizeGuard } = require("../lib/safe-fs");
// propagation: isSafeToWrite() compliance — read-only query module (refuse-symlink)

const PROJECT_ROOT = path.resolve(__dirname, "../.."); // validatePathInDir: constant-path (no user input)
const DB_PATH = path.join(PROJECT_ROOT, ".research", "content-analysis.db");
const VOCAB_PATH = path.join(PROJECT_ROOT, ".research", "tag-vocabulary.json");

function loadVocabulary() {
  // Direct-read pattern (no existsSync precheck) per CODE_PATTERNS.md —
  // avoids the TOCTOU between existsSync and read. readTextWithSizeGuard
  // also imposes a size ceiling to prevent local DoS from an oversized
  // vocabulary file.
  let text;
  try {
    text = readTextWithSizeGuard(VOCAB_PATH);
  } catch (err) {
    if (err?.code === "ENOENT") return null;
    // Surface non-ENOENT failures (size limit, EACCES, etc.) rather than
    // swallowing silently — missing diagnostics have historically masked
    // real vocabulary corruption.
    console.warn(`warning: failed to read tag vocabulary: ${sanitizeError(err)}`);
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    console.warn(`warning: tag vocabulary is not valid JSON: ${sanitizeError(err)}`);
    return null;
  }
}

/**
 * Flatten vocab.forbidden into a Set for O(1) membership checks.
 */
function buildForbiddenFlatSet(vocab) {
  const set = new Set();
  if (vocab.forbidden) {
    for (const arr of Object.values(vocab.forbidden)) {
      if (Array.isArray(arr)) for (const t of arr) set.add(t);
    }
  }
  return set;
}

/**
 * Place a single classified canonical tag into the semantic or taxonomic
 * bucket. Used by classifyTagsForDisplay to keep the main loop flat.
 */
function placeClassifiedTag(canonical, info, semantic, taxonomic) {
  if (info.category === "taxonomic") {
    if (!taxonomic.includes(canonical)) taxonomic.push(canonical);
    return;
  }
  if (!semantic[info.category]) semantic[info.category] = [];
  if (!semantic[info.category].includes(canonical)) {
    semantic[info.category].push(canonical);
  }
}

/**
 * Split a tag list into semantic (grouped by category), taxonomic, and orphan
 * buckets. Applies synonym resolution. Per CONVENTIONS.md §14.
 */
function classifyTagsForDisplay(tags, vocab) {
  const semantic = {};
  const taxonomic = [];
  const orphan = [];
  // Guard against null, partial, or malformed vocab — loadVocabulary may
  // return null (missing/invalid), and even a valid vocab may be missing
  // .tags if the file was written by an old migration.
  if (!vocab?.tags || typeof vocab.tags !== "object") {
    return { semantic, taxonomic, orphan };
  }
  const forbiddenFlat = buildForbiddenFlatSet(vocab);
  for (const raw of tags || []) {
    const trimmed = String(raw).trim();
    if (!trimmed) continue;
    const canonical = vocab.synonyms?.[trimmed] ?? trimmed;
    const info = vocab.tags[canonical];
    if (!info || forbiddenFlat.has(canonical)) {
      if (!orphan.includes(canonical)) orphan.push(canonical);
      continue;
    }
    placeClassifiedTag(canonical, info, semantic, taxonomic);
  }
  return { semantic, taxonomic, orphan };
}

function enrichResult(row, vocab) {
  let tags = [];
  if (Array.isArray(row.tags)) {
    tags = row.tags;
  } else if (typeof row.tags === "string" && row.tags.trim()) {
    try {
      const parsed = JSON.parse(row.tags);
      tags = Array.isArray(parsed) ? parsed : [];
    } catch {
      tags = [];
    }
  }
  const classified = classifyTagsForDisplay(tags, vocab);
  return {
    ...row,
    tags,
    semantic_tags: classified.semantic,
    taxonomic_tags: classified.taxonomic,
    orphan_tags: classified.orphan,
  };
}

function parseRecallArgs(argv) {
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
      const n = Number.parseInt(arg.slice(8), 10);
      args.limit = Number.isFinite(n) && n > 0 ? Math.min(n, 200) : 20;
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

function fetchBasicStats(db) {
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
  const allTagsWithCounts = db
    .prepare(
      `
      SELECT t.name, COUNT(*) as count
      FROM extraction_tags et JOIN tags t ON et.tag_id = t.id
      GROUP BY t.name ORDER BY count DESC
    `
    )
    .all();
  return { sources, extractions, tags, byType, byNovelty, allTagsWithCounts };
}

function computeVocabularyByCategory(vocab, categories) {
  const byCategory = {};
  for (const cat of Object.keys(categories)) byCategory[cat] = 0;
  for (const info of Object.values(vocab.tags)) {
    byCategory[info.category] = (byCategory[info.category] || 0) + 1;
  }
  return byCategory;
}

function computeTopTagsByCategory(vocab, categories) {
  const topTagsByCategory = {};
  for (const cat of Object.keys(categories)) {
    topTagsByCategory[cat] = Object.entries(vocab.tags)
      .filter(([, info]) => info.category === cat)
      .map(([name, info]) => ({ name, count: info.count ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
  return topTagsByCategory;
}

function computeOrphanAndLegacyTags(allTagsWithCounts, vocab) {
  const vocabTagSet = new Set(Object.keys(vocab.tags));
  const synonymSet = new Set(Object.keys(vocab.synonyms || {}));
  const forbiddenFlat = buildForbiddenFlatSet(vocab);
  const orphanTags = allTagsWithCounts.filter(
    (t) => !vocabTagSet.has(t.name) && !synonymSet.has(t.name) && !forbiddenFlat.has(t.name)
  );
  const legacyTags = allTagsWithCounts.filter(
    (t) => forbiddenFlat.has(t.name) || synonymSet.has(t.name)
  );
  return { orphanTags, legacyTags };
}

function attachVocabStats(output, vocab, allTagsWithCounts) {
  if (!vocab?.tags || typeof vocab.tags !== "object") return;
  const hasCategories =
    vocab.categories &&
    typeof vocab.categories === "object" &&
    Object.keys(vocab.categories).length > 0;
  const categories = hasCategories
    ? vocab.categories
    : Object.fromEntries(
        Array.from(
          new Set(
            Object.values(vocab.tags)
              .map((info) => info?.category)
              .filter(Boolean)
          )
        ).map((c) => [c, {}])
      );
  output.vocabulary = {
    total_size: Object.keys(vocab.tags).length,
    by_category: computeVocabularyByCategory(vocab, categories),
  };
  output.top_tags_by_category = computeTopTagsByCategory(vocab, categories);
  const { orphanTags, legacyTags } = computeOrphanAndLegacyTags(allTagsWithCounts, vocab);
  output.orphan_tags_in_journal = {
    count: orphanTags.length,
    sample: orphanTags.slice(0, 10),
  };
  output.legacy_tags_in_journal = {
    count: legacyTags.length,
    sample: legacyTags.slice(0, 10),
    note: "Forbidden tags + synonyms-not-yet-resolved. Will clear after retag.",
  };
}

function showStats(db, vocab) {
  const { sources, extractions, tags, byType, byNovelty, allTagsWithCounts } = fetchBasicStats(db);
  const output = {
    summary: {
      sources: sources.count,
      extractions: extractions.count,
      unique_tags: tags.count,
    },
    by_source_type: byType,
    by_novelty: byNovelty,
    top_tags: allTagsWithCounts.slice(0, 15),
  };
  attachVocabStats(output, vocab, allTagsWithCounts);
  console.log(JSON.stringify(output, null, 2));
}

function queryExtractions(db, args) {
  const conditions = [];
  const params = [];

  if (args.freeText) {
    // Sanitize FTS5 input: tokenize, quote terms, limit tokens, join with AND
    const tokens = args.freeText
      .substring(0, 500)
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20)
      .map((t) => `"${t.replaceAll('"', "")}"`);
    const ftsQuery = tokens.join(" AND ");
    if (ftsQuery) {
      conditions.push(
        "e.rowid IN (SELECT rowid FROM search_extractions WHERE search_extractions MATCH ?)"
      );
      params.push(ftsQuery);
    }
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

  try {
    return db.prepare(sql).all(...params);
  } catch (err) {
    console.error(`Query failed: ${sanitizeError(err)}`);
    process.exit(1);
  }
}

function querySources(db, args) {
  const conditions = [];
  const params = [];

  if (args.freeText) {
    const tokens = args.freeText
      .substring(0, 500)
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20)
      .map((t) => `"${t.replaceAll('"', "")}"`);
    const ftsQuery = tokens.join(" AND ");
    if (ftsQuery) {
      conditions.push("s.rowid IN (SELECT rowid FROM search_sources WHERE search_sources MATCH ?)");
      params.push(ftsQuery);
    }
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

  const orderBy = "ORDER BY s.analyzed_at DESC";

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

  // Symlink guard for DB path — checks full parent chain (refuse-symlink
  // compliance + PR #505 security-auditor finding #18: the prior lstat-only
  // check missed parent-chain redirection). better-sqlite3 opens the file via
  // its C binding, so we cannot fd-pin the open; the parent-chain guard
  // covers the realistic attack vector (planting a symlink in a parent dir).
  try {
    refuseSymlinkWithParents(DB_PATH);
    const st = fs.lstatSync(DB_PATH);
    if (st.isSymbolicLink()) {
      console.error("Refusing to open symlinked database path");
      process.exit(1);
    }
  } catch (err) {
    console.error(`Fatal: ${sanitizeError(err)}`);
    process.exit(1);
  }

  const args = parseRecallArgs(process.argv);
  const db = new Database(DB_PATH, { readonly: true });
  try {
    db.pragma("journal_mode = WAL");

    const vocab = loadVocabulary();

    if (args.stats) {
      showStats(db, vocab);
      return;
    }

    // --target=sources is a valid standalone mode (lists all sources);
    // no free-text / tag / type / source / sort required.
    if (
      !args.freeText &&
      !args.tag &&
      !args.type &&
      !args.source &&
      !args.sort &&
      args.target !== "sources"
    ) {
      console.error(
        "Usage: node scripts/cas/recall.js <query> [--tag=X] [--type=X] [--sort=X] [--source=X] [--limit=N] [--target=sources] [--stats]"
      );
      process.exit(1);
    }

    const rawResults =
      args.target === "sources" ? querySources(db, args) : queryExtractions(db, args);
    const results = rawResults.map((row) => enrichResult(row, vocab));

    console.log(JSON.stringify(results, null, 2));
    console.error(`\n${results.length} results returned.`);
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
