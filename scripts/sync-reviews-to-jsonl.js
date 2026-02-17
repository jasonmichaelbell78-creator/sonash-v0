#!/usr/bin/env node
/* global __dirname */
/**
 * sync-reviews-to-jsonl.js
 *
 * Syncs reviews from AI_REVIEW_LEARNINGS_LOG.md to .claude/state/reviews.jsonl.
 * Parses #### Review #N entries AND ### PR #N Retrospective entries, extracts
 * structured fields, and appends any not already present in the JSONL file.
 *
 * This is the bridge between the markdown authoring surface and the JSONL
 * consumption surface used by run-consolidation.js.
 *
 * Usage:
 *   npm run reviews:sync              # Preview (dry run)
 *   npm run reviews:sync -- --apply   # Apply sync
 *   npm run reviews:sync -- --check   # Exit 1 if drift detected (for CI/hooks)
 *   npm run reviews:sync -- --repair  # Full rebuild of reviews.jsonl from markdown
 *
 * Exit codes:
 *   0 = Success (or no sync needed)
 *   1 = Drift detected (--check mode) or sync needed (dry run)
 *   2 = Error
 */

const { existsSync, readFileSync, appendFileSync, writeFileSync, lstatSync } = require("node:fs");
const { join } = require("node:path");

// Symlink guard (Review #316-#323)
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require(join(__dirname, "..", ".claude", "hooks", "lib", "symlink-guard")));
} catch {
  console.error("symlink-guard unavailable; refusing to write");
  isSafeToWrite = () => false;
}

const ROOT = join(__dirname, "..");
const LEARNINGS_LOG = join(ROOT, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
const REVIEWS_FILE = join(ROOT, ".claude", "state", "reviews.jsonl");

const args = new Set(process.argv.slice(2));
const applyMode = args.has("--apply");
const checkMode = args.has("--check");
const repairMode = args.has("--repair");
const quiet = args.has("--quiet");

function log(msg) {
  if (!quiet) console.log(msg);
}

function sanitizeError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg
    .replaceAll(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
    .replaceAll(/\/home\/[^/\s]+/gi, "[HOME]")
    .replaceAll(/\/Users\/[^/\s]+/gi, "[HOME]");
}

/**
 * Load existing review IDs from JSONL
 */
function loadExistingIds() {
  const ids = new Set();
  if (!existsSync(REVIEWS_FILE)) return ids;

  try {
    const content = readFileSync(REVIEWS_FILE, "utf8").replaceAll("\r\n", "\n").trim();
    if (!content) return ids;
    for (const line of content.split("\n")) {
      try {
        const obj = JSON.parse(line);
        if (typeof obj.id === "number") ids.add(obj.id);
      } catch {
        /* skip malformed */
      }
    }
  } catch (err) {
    console.error("Failed to read reviews.jsonl:", sanitizeError(err));
  }
  return ids;
}

/**
 * Parse reviews from the markdown learning log.
 * Extracts: id, date, title, source, pr, patterns, fixed, deferred, learnings
 */
function parseMarkdownReviews(content) {
  const reviews = [];
  const lines = content.split("\n");
  let current = null;
  let inFence = false;

  for (const line of lines) {
    // Skip content inside fenced code blocks to avoid parsing headers from examples
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // Match #### Review #N: Title (YYYY-MM-DD)
    const headerMatch = line.match(/^####\s+Review\s+#(\d+):?\s*(.*)/);
    if (headerMatch) {
      if (current) reviews.push(current);

      const id = Number.parseInt(headerMatch[1], 10);
      const titleAndDate = headerMatch[2].trim();
      const dateMatch = titleAndDate.match(/\((\d{4}-\d{2}-\d{2})\)\s*$/);
      const date = dateMatch ? dateMatch[1] : null;
      const title = dateMatch
        ? titleAndDate.slice(0, titleAndDate.lastIndexOf("(")).trim()
        : titleAndDate;

      current = {
        id,
        date,
        title,
        source: null,
        pr: null,
        patterns: [],
        fixed: 0,
        deferred: 0,
        rejected: 0,
        critical: 0,
        major: 0,
        minor: 0,
        trivial: 0,
        total: 0,
        learnings: [],
        _rawLines: [],
      };
      continue;
    }

    if (!current) continue;
    current._rawLines.push(line);
  }

  if (current) reviews.push(current);

  // Second pass: extract structured fields from raw lines
  for (const review of reviews) {
    const raw = review._rawLines.join("\n");

    // Source
    const sourceMatch = raw.match(/\*\*Source:\*\*\s*([^\n*]+)/);
    if (sourceMatch) {
      const src = sourceMatch[1].toLowerCase().trim();
      const parts = [];
      if (src.includes("sonarcloud") || src.includes("sonarqube")) parts.push("sonarcloud");
      if (src.includes("qodo")) parts.push("qodo");
      if (src.includes("ci") || src.includes("github")) parts.push("ci");
      if (src.includes("coderabbit")) parts.push("coderabbit");
      review.source = parts.length > 0 ? parts.join("+") : "manual";
    }

    // PR number
    const prMatch = raw.match(/PR\s*#(\d+)/);
    if (prMatch) review.pr = Number.parseInt(prMatch[1], 10);

    // Fixed count
    const fixedMatch = raw.match(/Fixed:\s*(\d+)/i) || raw.match(/fixed\s*(\d+)/i);
    if (fixedMatch) review.fixed = Number.parseInt(fixedMatch[1], 10);

    // Deferred count
    const deferredMatch = raw.match(/Deferred:\s*(\d+)/i) || raw.match(/deferred\s*(\d+)/i);
    if (deferredMatch) review.deferred = Number.parseInt(deferredMatch[1], 10);

    // Rejected count
    const rejectedMatch = raw.match(/Rejected:\s*(\d+)/i) || raw.match(/rejected\s*(\d+)/i);
    if (rejectedMatch) review.rejected = Number.parseInt(rejectedMatch[1], 10);

    // Severity breakdown — supports both "N CRITICAL" and "Critical: N" formats
    const criticalMatch = raw.match(/(\d+)\s*CRITICAL/i) || raw.match(/Critical:\s*(\d+)/i);
    if (criticalMatch) review.critical = Number.parseInt(criticalMatch[1], 10);
    const majorMatch = raw.match(/(\d+)\s*MAJOR/i) || raw.match(/Major:\s*(\d+)/i);
    if (majorMatch) review.major = Number.parseInt(majorMatch[1], 10);
    const minorMatch = raw.match(/(\d+)\s*MINOR/i) || raw.match(/Minor:\s*(\d+)/i);
    if (minorMatch) review.minor = Number.parseInt(minorMatch[1], 10);
    const trivialMatch = raw.match(/(\d+)\s*TRIVIAL/i) || raw.match(/Trivial:\s*(\d+)/i);
    if (trivialMatch) review.trivial = Number.parseInt(trivialMatch[1], 10);

    // Total items from "N total" or "N items" pattern
    const totalMatch = raw.match(/(\d+)\s*total/i) || raw.match(/(\d+)\s*items/i);
    if (totalMatch) review.total = Number.parseInt(totalMatch[1], 10);

    // If total found but no severity breakdown, derive from source counts
    // e.g., "SonarCloud (3) + Qodo Suggestions (6)" in Source line
    if (review.total > 0 && review.critical === 0 && review.major === 0 && review.minor === 0) {
      const sourceBreakdown = raw.match(/\*\*Source:\*\*\s*([^\n]+)/);
      if (sourceBreakdown) {
        const sourceCounts = [...sourceBreakdown[1].matchAll(/\((\d+)\)/g)];
        const sourceTotal = sourceCounts.reduce((sum, m) => sum + Number.parseInt(m[1], 10), 0);
        if (sourceTotal > 0) {
          review.sourceBreakdown = sourceBreakdown[1].trim();
        }
      }
    }

    // Patterns from numbered lists under "Patterns Identified" or "Key Patterns"
    const patternMatches = raw.matchAll(/^\d+\.\s+\*\*([^*]+)\*\*/gm);
    for (const m of patternMatches) {
      const pattern = m[1]
        .trim()
        .toLowerCase()
        .replaceAll(/[^a-z0-9\s-]/g, "")
        .replaceAll(/\s+/g, "-")
        .slice(0, 60);
      if (pattern && !review.patterns.includes(pattern)) {
        review.patterns.push(pattern);
      }
    }

    // Learnings from "Key Learnings" or "Lesson" sections
    // Skip metadata lines that aren't actual learnings
    const METADATA_MARKERS = [
      "**Source:**",
      "**PR/Branch:**",
      "**Suggestions:**",
      "**Resolution Stats:**",
      "**Patterns Identified:**",
      "**Rejected:**",
      "**Resolution:**",
      "**Deferred:**",
    ];
    const learningLines = raw.match(/[-*]\s+(?:`[^`]+`\s+)?[A-Z].{15,}/g) || [];
    const seenLearnings = new Set();
    for (const ll of learningLines.slice(0, 7)) {
      const cleaned = ll.replace(/^[-*]\s+/, "").trim();
      // Skip lines that are metadata headers, not learnings
      const isMetadata = METADATA_MARKERS.some((marker) => cleaned.includes(marker));
      if (
        !isMetadata &&
        cleaned.length > 20 &&
        cleaned.length < 300 &&
        !seenLearnings.has(cleaned)
      ) {
        review.learnings.push(cleaned);
        seenLearnings.add(cleaned);
      }
    }

    // Clean up
    delete review._rawLines;
    if (!review.date) review.date = "unknown";
    if (!review.source) review.source = "manual";
  }

  return reviews;
}

/**
 * Parse PR retrospective entries from the markdown.
 * Finds ### PR #N Retrospective sections and extracts structured data.
 */
function parseRetrospectives(content) {
  const retros = [];
  const lines = content.split("\n");
  let current = null;
  let inFence = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // Match ### PR #N Retrospective (YYYY-MM-DD)
    const retroMatch = line.match(/^###\s+PR\s+#(\d+)\s+Retrospective\s*\((\d{4}-\d{2}-\d{2})\)/);
    if (retroMatch) {
      if (current) retros.push(current);
      current = {
        id: `retro-${retroMatch[1]}`,
        type: "retrospective",
        pr: Number.parseInt(retroMatch[1], 10),
        date: retroMatch[2],
        rounds: 0,
        totalItems: 0,
        fixed: 0,
        rejected: 0,
        deferred: 0,
        churnChains: 0,
        automationCandidates: [],
        skillsToUpdate: [],
        processImprovements: [],
        learnings: [],
        _rawLines: [],
      };
      continue;
    }

    // Stop at next ### heading (but not ####)
    if (current && /^###\s+[^#]/.test(line) && !line.match(/^####/)) {
      retros.push(current);
      current = null;
      continue;
    }

    if (current) current._rawLines.push(line);
  }

  if (current) retros.push(current);

  // Second pass: extract structured fields
  for (const retro of retros) {
    const raw = retro._rawLines.join("\n");

    // Rounds — supports both "**Rounds:** N" and table "| Rounds | N (...) |"
    const roundsMatch =
      raw.match(/\*\*Rounds:\*\*\s*(\d+)/) || raw.match(/\|\s*Rounds\s*\|\s*(\d+)/);
    if (roundsMatch) retro.rounds = Number.parseInt(roundsMatch[1], 10);

    // Total items — supports both "**Items:** N" and table "| Total items | N |"
    const itemsMatch =
      raw.match(/\*\*(?:Items|Total items processed):\*\*\s*~?(\d+)/) ||
      raw.match(/\|\s*Total items\s*\|\s*~?(\d+)/);
    if (itemsMatch) retro.totalItems = Number.parseInt(itemsMatch[1], 10);

    // Fixed — supports bold, table, and inline parenthetical formats
    const fixedMatch =
      raw.match(/\*\*Fixed:\*\*\s*~?(\d+)/) ||
      raw.match(/\|\s*Fixed\s*\|\s*~?(\d+)/) ||
      raw.match(/Fixed:\s*~?(\d+)/);
    if (fixedMatch) retro.fixed = Number.parseInt(fixedMatch[1], 10);

    // Rejected — supports all formats
    const rejectedMatch =
      raw.match(/\*\*Rejected:\*\*\s*~?(\d+)/) ||
      raw.match(/\|\s*Rejected\s*\|\s*~?(\d+)/) ||
      raw.match(/Rejected:\s*~?(\d+)/);
    if (rejectedMatch) retro.rejected = Number.parseInt(rejectedMatch[1], 10);

    // Deferred — supports all formats
    const deferredMatch =
      raw.match(/\*\*Deferred:\*\*\s*~?(\d+)/) ||
      raw.match(/\|\s*Deferred\s*\|\s*~?(\d+)/) ||
      raw.match(/Deferred:\s*~?(\d+)/);
    if (deferredMatch) retro.deferred = Number.parseInt(deferredMatch[1], 10);

    // Churn chains — count ping-pong entries
    const churnMatches = raw.match(/\*\*.*?\*\*.*?\(ping-pong\)/gi) || [];
    retro.churnChains = churnMatches.length;
    // Also count from explicit "Ping-pong chains" section
    if (retro.churnChains === 0) {
      const chainBullets = raw.match(/^- \*\*[^*]+\*\*.*?R\d+-R\d+/gm) || [];
      retro.churnChains = chainBullets.length;
    }

    // Automation candidates from table rows or bullet points
    const autoRows = raw.matchAll(/\|\s*([^|]+?)\s*\|\s*R[\d,\s]+\s*\|/gm);
    for (const m of autoRows) {
      const name = m[1].trim();
      if (
        name &&
        !name.startsWith("---") &&
        !name.startsWith("Pattern") &&
        retro.automationCandidates.length < 10
      ) {
        retro.automationCandidates.push(name);
      }
    }
    // Also from "Automation candidates:" bullet/prose
    const autoBullet = raw.match(/\*\*Automation candidates:\*\*\s*([^\n]+)/);
    if (autoBullet && retro.automationCandidates.length === 0) {
      const items = autoBullet[1].split(/,\s*/);
      for (const item of items.slice(0, 10)) {
        const cleaned = item.replace(/\(~?\d+\s*min\)/, "").trim();
        if (cleaned) retro.automationCandidates.push(cleaned);
      }
    }

    // Skills to update
    const skillSection = raw.match(/#### Skills\/Templates to Update([\s\S]*?)(?=####|\n---\n|$)/);
    if (skillSection) {
      const skillBullets = skillSection[1].match(/^- \*\*([^*]+)\*\*/gm) || [];
      for (const sb of skillBullets) {
        const name = sb
          .replace(/^- \*\*/, "")
          .replace(/\*\*$/, "")
          .replace(/:$/, "")
          .trim();
        if (name) retro.skillsToUpdate.push(name);
      }
    }

    // Process improvements
    const processSection = raw.match(/#### Process Improvements([\s\S]*?)(?=####|\n---\n|$)/);
    if (processSection) {
      const procBullets = processSection[1].match(/^\d+\.\s+\*\*([^*]+)\*\*/gm) || [];
      for (const pb of procBullets) {
        const name = pb
          .replace(/^\d+\.\s+\*\*/, "")
          .replace(/\*\*$/, "")
          .trim();
        if (name) retro.processImprovements.push(name);
      }
    }

    // Learnings from verdict or key bullet points
    const METADATA_MARKERS = ["**Rounds:**", "**Items:**", "**Fixed:**", "**Rejected:**"];
    const verdictSection = raw.match(/\*\*Verdict[^*]*\*\*:?\s*([^\n]+)/);
    if (verdictSection) {
      retro.learnings.push(verdictSection[1].trim());
    }
    const highImpact = raw.match(/\*\*Highest-impact[^*]*\*\*:?\s*([^\n]+)/);
    if (highImpact) {
      retro.learnings.push(highImpact[1].trim());
    }

    delete retro._rawLines;
  }

  return retros;
}

/**
 * Check if a path is a symlink (safe — returns false on error)
 */
function isSymlink(filePath) {
  try {
    return lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

function main() {
  try {
    log("🔄 Review Sync: AI_REVIEW_LEARNINGS_LOG.md → reviews.jsonl\n");

    // Validate paths
    if (!existsSync(LEARNINGS_LOG)) {
      console.error("AI_REVIEW_LEARNINGS_LOG.md not found");
      process.exitCode = 2;
      return;
    }

    if (isSymlink(LEARNINGS_LOG)) {
      console.error("Refusing to read symlink");
      process.exitCode = 2;
      return;
    }

    const content = readFileSync(LEARNINGS_LOG, "utf8");

    // --repair mode: full rebuild of reviews.jsonl from markdown
    if (repairMode) {
      log("🔧 REPAIR MODE: Full rebuild of reviews.jsonl from markdown\n");

      if (!isSafeToWrite(REVIEWS_FILE)) {
        console.error("❌ Refusing to write: symlink detected at reviews.jsonl");
        process.exitCode = 2;
        return;
      }

      const stateDir = join(ROOT, ".claude", "state");
      if (!existsSync(stateDir)) {
        require("node:fs").mkdirSync(stateDir, { recursive: true });
      }

      // Back up existing file
      if (existsSync(REVIEWS_FILE)) {
        const bakPath = REVIEWS_FILE + ".bak";
        try {
          writeFileSync(bakPath, readFileSync(REVIEWS_FILE, "utf8"));
          log(`  📦 Backup: reviews.jsonl.bak`);
        } catch {
          log("  ⚠️ Could not create backup (continuing anyway)");
        }
      }

      const reviews = parseMarkdownReviews(content);
      const retros = parseRetrospectives(content);
      // Sort reviews by numeric id, retros go after reviews
      reviews.sort((a, b) => a.id - b.id);
      retros.sort((a, b) => a.pr - b.pr);

      const allLines = [...reviews, ...retros].map((r) => JSON.stringify(r));
      try {
        writeFileSync(REVIEWS_FILE, allLines.join("\n") + "\n");
      } catch (err) {
        console.error("❌ Failed to write reviews.jsonl:", sanitizeError(err));
        process.exitCode = 2;
        return;
      }

      log(`  ✅ Rebuilt reviews.jsonl:`);
      log(
        `     Reviews: ${reviews.length} (IDs: #${reviews[0]?.id || "?"}-#${reviews[reviews.length - 1]?.id || "?"})`
      );
      log(
        `     Retros:  ${retros.length} (PRs: ${retros.map((r) => "#" + r.pr).join(", ") || "none"})`
      );

      // Report severity coverage
      const withSeverity = reviews.filter((r) => r.critical + r.major + r.minor + r.trivial > 0);
      log(`     Severity data: ${withSeverity.length}/${reviews.length} entries have breakdown`);

      // Report learnings quality
      const withLearnings = reviews.filter((r) => r.learnings.length > 0);
      log(`     Learnings: ${withLearnings.length}/${reviews.length} entries have learnings`);

      process.exitCode = 0;
      return;
    }

    // Normal sync mode
    const existingIds = loadExistingIds();
    const mdReviews = parseMarkdownReviews(content);
    const mdRetros = parseRetrospectives(content);

    // Check for missing retros too
    const existingRetroIds = new Set();
    if (existsSync(REVIEWS_FILE)) {
      try {
        const jsonlContent = readFileSync(REVIEWS_FILE, "utf8").replaceAll("\r\n", "\n").trim();
        if (jsonlContent) {
          for (const line of jsonlContent.split("\n")) {
            try {
              const obj = JSON.parse(line);
              if (typeof obj.id === "string" && obj.id.startsWith("retro-"))
                existingRetroIds.add(obj.id);
            } catch {
              /* skip */
            }
          }
        }
      } catch {
        /* skip */
      }
    }

    log(`  Markdown reviews found: ${mdReviews.length}`);
    log(`  Markdown retros found:  ${mdRetros.length}`);
    log(`  JSONL reviews existing: ${existingIds.size}`);
    log(`  JSONL retros existing:  ${existingRetroIds.size}`);

    // Find missing reviews and retros
    const missingReviews = mdReviews.filter((r) => !existingIds.has(r.id));
    const missingRetros = mdRetros.filter((r) => !existingRetroIds.has(r.id));
    missingReviews.sort((a, b) => a.id - b.id);
    missingRetros.sort((a, b) => a.pr - b.pr);
    const missing = [...missingReviews, ...missingRetros];

    if (missing.length === 0) {
      log("\n✅ All reviews and retros are synced. No drift detected.");
      process.exitCode = 0;
      return;
    }

    log(`\n⚠️  ${missing.length} entries in markdown but not in JSONL:`);
    if (missingReviews.length > 0) {
      log(`  Reviews: ${missingReviews.map((r) => "#" + r.id).join(", ")}`);
    }
    if (missingRetros.length > 0) {
      log(`  Retros:  ${missingRetros.map((r) => r.id).join(", ")}`);
    }

    if (checkMode) {
      console.log(`\nDRIFT: ${missing.length} entries not synced to reviews.jsonl`);
      console.log(`Run: npm run reviews:sync -- --apply`);
      process.exitCode = 1;
      return;
    }

    if (applyMode) {
      if (!isSafeToWrite(REVIEWS_FILE)) {
        console.error("❌ Refusing to write: symlink detected at reviews.jsonl");
        process.exitCode = 2;
        return;
      }
      const stateDir = join(ROOT, ".claude", "state");
      if (!existsSync(stateDir)) {
        require("node:fs").mkdirSync(stateDir, { recursive: true });
      }
      const lines = missing.map((r) => JSON.stringify(r));
      try {
        appendFileSync(REVIEWS_FILE, lines.join("\n") + "\n");
      } catch (err) {
        console.error("❌ Failed to write reviews.jsonl:", sanitizeError(err));
        process.exitCode = 2;
        return;
      }
      log(`\n✅ Appended ${missing.length} entries to reviews.jsonl`);
      if (missingReviews.length > 0) {
        log(
          `  Reviews: #${missingReviews[0].id} - #${missingReviews[missingReviews.length - 1].id}`
        );
      }
      if (missingRetros.length > 0) {
        log(`  Retros: ${missingRetros.map((r) => r.id).join(", ")}`);
      }
      process.exitCode = 0;
    } else {
      log("\nDry run. Use --apply to sync.");
      if (missing.length > 0) {
        log("\nPreview (first entry):");
        log(JSON.stringify(missing[0], null, 2));
      }
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("Error:", sanitizeError(err));
    process.exitCode = 2;
  }
}

main();
