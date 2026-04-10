"use strict";

/**
 * Content Analysis System — Self-Audit
 *
 * Validates any handler's output directory against CONVENTIONS.md Section 13.
 * Run after any analysis completes to catch naming mismatches, missing artifacts,
 * schema failures, and extraction gaps BEFORE presenting results.
 *
 * Usage: node scripts/cas/self-audit.js --slug=<slug>
 *
 * Exit codes:
 *   0 = all checks pass
 *   1 = one or more checks failed (details printed)
 *
 * @see .claude/skills/shared/CONVENTIONS.md (Section 13: Handler Output Contract)
 */

const fs = require("node:fs");
const path = require("node:path");
const {
  sanitizeError,
  validatePathInDir,
  refuseSymlinkWithParents,
  slugify,
} = require("../lib/security-helpers.js");
const { safeReadText, safeReadJson, isValidArtifactFile } = require("../lib/safe-cas-io.js");

const PROJECT_ROOT = path.resolve(__dirname, "../.."); // validatePathInDir: constant-path (no user input)
const ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "analysis");
const JOURNAL_PATH = path.join(PROJECT_ROOT, ".research", "extraction-journal.jsonl");

// CONVENTIONS Section 13.1: MUST artifacts
// analysis.json = all depths. value-map + creator-view = Standard/Deep only.
const MUST_ALL_DEPTHS = [{ file: "analysis.json", description: "Unified schema record" }];
const MUST_STANDARD_DEEP = [
  { file: "value-map.json", description: "Candidates array (Phase 6)" },
  { file: "creator-view.md", description: "Creator View prose (Phase 4)" },
];

// SHOULD artifacts — Standard/Deep only (warn if missing = phase skip)
// Per CONVENTIONS Section 13.2
const SHOULD_ARTIFACTS = [
  { file: "findings.jsonl", description: "Findings (Phase 2/5)", phase: "2" },
  { file: "summary.md", description: "Summary (Phase 5)", phase: "5" },
  { file: "deep-read.md", description: "Deep Read (Phase 2b)", phase: "2b" },
  { file: "content-eval.jsonl", description: "Content Eval (Phase 4b)", phase: "4b" },
  { file: "coverage-audit.jsonl", description: "Coverage Audit (Phase 6b)", phase: "6b" },
];

// WRONG artifact names (fail if present — naming violation)
const WRONG_NAMES = [
  { file: "SITE-ANALYSIS.md", correct: "creator-view.md", reason: "CONVENTIONS Section 13" },
];

function parseArgs(argv) {
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--slug=")) return arg.slice(7);
  }
  return null;
}

function getDepth(dir) {
  const analysisPath = path.join(dir, "analysis.json");
  try {
    // safeReadJson refuses symlinks (final + parent chain) and rejects non-files.
    const data = safeReadJson(analysisPath);
    return data.depth || "quick";
  } catch {
    return "quick";
  }
}

// Safe path join: validates containment within ANALYSIS_DIR before returning.
// Uses path.join rather than path.resolve so the propagation checker
// (validate-path pattern) recognizes the containment check as adjacent. The
// validatePathInDir call above already rejects any rel that escapes ANALYSIS_DIR.
function safePath(slugPart, filePart) {
  const rel = slugPart + path.sep + filePart;
  validatePathInDir(ANALYSIS_DIR, rel);
  return path.join(ANALYSIS_DIR, rel);
}

// Return the lstat of a regular file with parent-chain symlink protection, or
// null if the path does not exist, is a symlink (final or any parent), or is
// not a regular file. Never throws — suitable for size reporting in loops.
function safeFileStat(filePath) {
  if (!isValidArtifactFile(filePath)) {
    // isValidArtifactFile already rejected empty files, but for reporting we
    // still want stat when non-empty. Re-check without the size guard.
    try {
      refuseSymlinkWithParents(filePath);
      const st = fs.lstatSync(filePath);
      if (st.isSymbolicLink()) return null;
      if (!st.isFile()) return null;
      return st;
    } catch {
      return null;
    }
  }
  try {
    return fs.lstatSync(filePath);
  } catch {
    return null;
  }
}

function checkArtifacts(dir, slug) {
  const results = { pass: [], fail: [], warn: [] };
  const depth = getDepth(dir);
  const isStandardOrDeep = depth === "standard" || depth === "deep";

  // MUST artifacts (all depths)
  for (const { file, description } of MUST_ALL_DEPTHS) {
    const filePath = safePath(slug, file);
    const stat = safeFileStat(filePath);
    if (!stat) {
      results.fail.push(`MUST artifact missing: ${file} (${description})`);
    } else if (stat.size === 0) {
      results.fail.push(`MUST artifact empty: ${file} (${description})`);
    } else {
      results.pass.push(`${file} (${stat.size} bytes)`);
    }
  }

  // MUST artifacts (Standard/Deep only)
  if (isStandardOrDeep) {
    for (const { file, description } of MUST_STANDARD_DEEP) {
      const filePath = safePath(slug, file);
      const stat = safeFileStat(filePath);
      if (!stat) {
        results.fail.push(`MUST artifact missing: ${file} (${description})`);
      } else if (stat.size === 0) {
        results.fail.push(`MUST artifact empty: ${file} (${description})`);
      } else {
        results.pass.push(`${file} (${stat.size} bytes)`);
      }
    }
  }

  // SHOULD artifacts — only warn for Standard/Deep
  for (const { file, description, phase } of SHOULD_ARTIFACTS) {
    const filePath = safePath(slug, file);
    const stat = safeFileStat(filePath);
    if (stat && stat.size > 0) {
      results.pass.push(`${file} (${stat.size} bytes)`);
    } else if (isStandardOrDeep) {
      const reason = stat
        ? `SHOULD artifact empty: ${file} (${description}) — Phase ${phase} may have been skipped`
        : `SHOULD artifact missing: ${file} (${description}) — Phase ${phase} skipped`;
      results.warn.push(reason);
    }
  }

  // WRONG names (naming violations)
  for (const { file, correct, reason } of WRONG_NAMES) {
    if (safeFileStat(safePath(slug, file))) {
      results.fail.push(`Wrong artifact name: ${file} should be ${correct} (${reason})`);
    }
  }

  return results;
}

function checkSchema(dir, slug) {
  const results = { pass: [], fail: [] };
  const analysisPath = path.join(dir, "analysis.json");

  let data;
  try {
    // safeReadJson refuses parent-chain symlinks and enforces regular-file.
    data = safeReadJson(analysisPath);
  } catch (err) {
    if (err.code === "ENOENT") {
      results.fail.push("Cannot validate schema — analysis.json missing");
    } else {
      results.fail.push(`analysis.json parse error: ${sanitizeError(err)}`);
    }
    return results;
  }

  try {
    // Check schema_version
    if (data.schema_version) {
      results.pass.push(`schema_version: ${data.schema_version}`);
    } else {
      results.fail.push("analysis.json missing schema_version field");
    }

    // Validate against Zod schema
    try {
      const { validate } = require("../lib/analysis-schema.js");
      const result = validate(data, "analysis");
      if (result.success) {
        results.pass.push("Zod schema validation: PASS");
      } else {
        results.fail.push(`Zod schema validation: FAIL — ${result.error}`);
      }
    } catch (err) {
      results.fail.push(`Zod schema validation error: ${sanitizeError(err)}`);
    }

    // Check candidates populated (Standard/Deep should have them)
    if (data.depth !== "quick" && (!data.candidates || data.candidates.length === 0)) {
      results.fail.push("Standard/Deep analysis has 0 candidates — value-map likely empty too");
    } else if (data.candidates) {
      results.pass.push(`${data.candidates.length} candidates in analysis.json`);
    }

    // Media-specific: transcript_source must be set (CONVENTIONS 13.3)
    if (data.source_type === "media") {
      if (data.transcript_source) {
        results.pass.push(`transcript_source: ${data.transcript_source}`);
      } else {
        results.fail.push("Media analysis missing transcript_source field (CONVENTIONS 13.3)");
      }
      // transcript.md must exist
      const transcriptPath = safePath(slug, "transcript.md");
      const tStat = safeFileStat(transcriptPath);
      if (tStat && tStat.size > 0) {
        results.pass.push(`transcript.md (${tStat.size} bytes)`);
      } else {
        results.fail.push("Media analysis missing transcript.md (CONVENTIONS 13.3 MUST)");
      }
    }
  } catch (err) {
    results.fail.push(`analysis.json parse error: ${sanitizeError(err)}`);
  }

  return results;
}

function matchesSource(entrySource, targetSource) {
  if (entrySource === targetSource) return true;
  return slugify(entrySource) === slugify(targetSource);
}

function checkExtractions(slug, source) {
  const results = { pass: [], fail: [], warn: [] };

  let lines;
  try {
    // safeReadText refuses parent-chain symlinks and enforces regular-file.
    lines = safeReadText(JOURNAL_PATH).trim().split("\n");
  } catch (err) {
    if (err.code === "ENOENT") {
      results.warn.push("extraction-journal.jsonl not found");
    } else {
      results.warn.push(`Could not read journal: ${sanitizeError(err)}`);
    }
    return results;
  }

  let count = 0;
  let untagged = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (matchesSource(entry.source, source)) {
        count++;
        if (!entry.tags || entry.tags.length === 0) untagged++;
      }
    } catch {
      // skip malformed
    }
  }

  if (count === 0) {
    results.fail.push(`No extraction journal entries for source: ${source}`);
  } else {
    results.pass.push(`${count} extraction journal entries for ${source}`);
    if (untagged > 0) {
      results.warn.push(`${untagged} of ${count} extraction entries have no tags (CONVENTIONS 14)`);
    }
  }

  return results;
}

function checkBehavioral(dir, slug, sourceType) {
  const results = { pass: [], fail: [], warn: [] };
  const depth = getDepth(dir);
  const isStandardOrDeep = depth === "standard" || depth === "deep";

  if (!isStandardOrDeep) return results;

  // State file check (CONVENTIONS 16.4)
  const handlerMap = {
    repo: "repo-analysis",
    website: "website-analysis",
    document: "document-analysis",
    media: "media-analysis",
  };
  const handler = handlerMap[sourceType] || "unknown";
  const stateDir = path.join(PROJECT_ROOT, ".claude", "state");
  const stateFile = path.join(stateDir, `${handler}.${slug}.state.json`);

  let state;
  try {
    // safeReadJson throws ENOENT when missing and refuses parent-chain symlinks.
    state = safeReadJson(stateFile);
  } catch (err) {
    if (err.code === "ENOENT") {
      results.warn.push(
        `No state file — pipeline tail (tags, retro, routing) may have been skipped (CONVENTIONS 16)`
      );
    } else {
      results.warn.push(`State file exists but is malformed or unsafe: ${sanitizeError(err)}`);
    }
    return results;
  }

  results.pass.push(`State file exists (${handler}.${slug})`);
  if (state.process_feedback) {
    results.pass.push(
      `Retro feedback captured: "${String(state.process_feedback).substring(0, 50)}..."`
    );
  } else {
    results.warn.push(
      "State file exists but process_feedback is empty — retro may have been skipped (CONVENTIONS 16.2)"
    );
  }

  return results;
}

function main() {
  const slug = parseArgs(process.argv);
  if (!slug) {
    console.error("Usage: node scripts/cas/self-audit.js --slug=<slug>");
    process.exit(1);
  }

  // Validate slug doesn't escape ANALYSIS_DIR (path containment)
  validatePathInDir(ANALYSIS_DIR, slug);
  const dir = path.join(ANALYSIS_DIR, slug);
  if (!fs.existsSync(dir)) {
    console.error(`Output directory not found: ${dir}`);
    process.exit(1);
  }

  // Determine source name and type from analysis.json if possible
  let source = slug;
  let sourceType = "repo";
  const analysisPath = path.join(dir, "analysis.json");
  try {
    // safeReadJson refuses parent-chain symlinks and throws ENOENT if missing.
    const data = safeReadJson(analysisPath);
    if (data.source) source = data.source;
    if (data.source_type) sourceType = data.source_type;
  } catch {
    // fall through — use slug as fallback identifier
  }

  console.log(`CAS Self-Audit: ${slug}`);
  console.log(`Source: ${source}`);
  console.log("---");

  const artifacts = checkArtifacts(dir, slug);
  const schema = checkSchema(dir, slug);
  const extractions = checkExtractions(slug, source);
  const behavioral = checkBehavioral(dir, slug, sourceType);

  const allPass = [...artifacts.pass, ...schema.pass, ...extractions.pass, ...behavioral.pass];
  const allFail = [...artifacts.fail, ...schema.fail, ...extractions.fail, ...behavioral.fail];
  const allWarn = [...artifacts.warn, ...extractions.warn, ...behavioral.warn];

  if (allPass.length > 0) {
    console.log(`\nPASS (${allPass.length}):`);
    for (const p of allPass) console.log(`  + ${p}`);
  }

  if (allWarn.length > 0) {
    console.log(`\nWARN (${allWarn.length}):`);
    for (const w of allWarn) console.log(`  ~ ${w}`);
  }

  if (allFail.length > 0) {
    console.log(`\nFAIL (${allFail.length}):`);
    for (const f of allFail) console.log(`  x ${f}`);
  }

  console.log(
    `\n---\nResult: ${allFail.length === 0 ? "PASS" : "FAIL"} (${allPass.length} pass, ${allWarn.length} warn, ${allFail.length} fail)`
  );
  process.exit(allFail.length > 0 ? 1 : 0);
}

try {
  main();
} catch (err) {
  console.error(`Fatal: ${sanitizeError(err)}`);
  process.exit(1);
}
