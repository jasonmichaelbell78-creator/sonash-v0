/* global __dirname */
"use strict";

/**
 * /media-analysis — Self-Audit (per-skill wrapper)
 *
 * Runs the shared CAS handler-output-contract check as a FLOOR, then adds
 * media-analysis specific checks:
 *   - transcript.md exists AND non-empty (MUST per CONVENTIONS §13.3)
 *   - analysis.json.source_type === "media"
 *   - analysis.json.transcript_source ∈ {captions, whisper, manual}
 *
 * Usage:    node scripts/skills/media-analysis/self-audit.js --slug=<slug>
 * Pattern:  .claude/skills/_shared/SELF_AUDIT_PATTERN.md
 * Floor:    scripts/cas/self-audit.js (CONVENTIONS §13 contract)
 */

const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { sanitizeError, validatePathInDir } = require("../../lib/security-helpers.js");
const { safeReadText, safeReadJson } = require("../../lib/safe-cas-io.js");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "analysis");
const CAS_AUDIT = path.join(PROJECT_ROOT, "scripts", "cas", "self-audit.js");

const VALID_SOURCES = ["captions", "whisper", "manual"];

function parseArgs(argv) {
  let slug = null;
  let json = false;
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--slug=")) slug = arg.slice(7);
    else if (arg === "--json") json = true;
  }
  return { slug, json };
}

function runFloor(slug) {
  const res = spawnSync(process.execPath, [CAS_AUDIT, `--slug=${slug}`], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
  });
  const spawnErr = res.error ? sanitizeError(res.error) : null;
  const statusCode = typeof res.status === "number" ? res.status : null;
  const failedToRun = spawnErr || res.signal || statusCode === null;
  return {
    status: !failedToRun && statusCode === 0 ? "PASS" : "FAIL",
    exit: statusCode,
    stdout: res.stdout || "",
    stderr: (res.stderr || "") + (spawnErr ? `\nspawn error: ${spawnErr}` : ""),
  };
}

// Read analysis.json.depth once so transcript/source checks can gate on the
// quick-scan contract (Quick Scan runs without transcription — transcript.md
// and transcript_source are NOT required per SKILL.md "Quick Scan" section).
function readDepth(slug) {
  try {
    validatePathInDir(ANALYSIS_DIR, slug);
    const jsonPath = path.join(ANALYSIS_DIR, slug, "analysis.json");
    const json = safeReadJson(jsonPath);
    return json?.depth || null;
  } catch {
    return null;
  }
}

function checkTranscript(slug) {
  try {
    validatePathInDir(ANALYSIS_DIR, slug);
    const depth = readDepth(slug);
    const transcriptPath = path.join(ANALYSIS_DIR, slug, "transcript.md");
    let text;
    try {
      text = safeReadText(transcriptPath);
    } catch (err) {
      if (err && err.code === "ENOENT") {
        if (depth === "quick") {
          return { status: "PASS", details: "transcript.md not required for quick depth" };
        }
        return { status: "FAIL", details: "transcript.md missing — MUST per CONVENTIONS §13.3" };
      }
      throw err;
    }
    if (!text || text.length < 10) {
      if (depth === "quick") {
        return { status: "WARN", details: "quick depth: transcript.md present but empty" };
      }
      return { status: "FAIL", details: "transcript.md present but empty" };
    }
    return { status: "PASS", details: `transcript.md: ${text.length} bytes` };
  } catch (err) {
    return { status: "FAIL", details: `transcript check: ${sanitizeError(err)}` };
  }
}

function checkSourceTypeAndTranscriptSource(slug) {
  try {
    validatePathInDir(ANALYSIS_DIR, slug);
    const jsonPath = path.join(ANALYSIS_DIR, slug, "analysis.json");
    let json;
    try {
      json = safeReadJson(jsonPath);
    } catch (err) {
      if (err && err.code === "ENOENT") {
        return { status: "FAIL", details: "analysis.json missing" };
      }
      throw err;
    }
    if (!json) return { status: "FAIL", details: "analysis.json unreadable" };
    if (json.source_type !== "media") {
      return { status: "FAIL", details: `source_type is '${json.source_type}', expected 'media'` };
    }
    const depth = json.depth || null;
    const ts = json.transcript_source;
    if (depth === "quick") {
      // Quick Scan runs without transcription; transcript_source is optional.
      return {
        status: "PASS",
        details: `source_type: media, depth: quick (transcript_source optional)`,
      };
    }
    if (!ts) {
      return { status: "FAIL", details: "transcript_source missing — MUST per CONVENTIONS §13.3" };
    }
    if (!VALID_SOURCES.includes(ts)) {
      return {
        status: "FAIL",
        details: `transcript_source '${ts}' not in {${VALID_SOURCES.join(", ")}}`,
      };
    }
    return { status: "PASS", details: `source_type: media, transcript_source: ${ts}` };
  } catch (err) {
    return {
      status: "FAIL",
      details: `source_type/transcript_source check: ${sanitizeError(err)}`,
    };
  }
}

function main() {
  const { slug, json } = parseArgs(process.argv);
  if (!slug) {
    console.error("Usage: node scripts/skills/media-analysis/self-audit.js --slug=<slug> [--json]");
    process.exit(2);
  }

  const floor = runFloor(slug);
  if (!json) {
    process.stdout.write(floor.stdout);
    if (floor.stderr) process.stderr.write(floor.stderr);
  }

  const results = {
    "cas-floor": { status: floor.status, details: `exit=${floor.exit}` },
    transcript: checkTranscript(slug),
    source_type_and_transcript_source: checkSourceTypeAndTranscriptSource(slug),
  };

  const mustFailed = Object.entries(results)
    .filter(([, v]) => v.status === "FAIL")
    .map(([k]) => k);
  const warned = Object.entries(results)
    .filter(([, v]) => v.status === "WARN")
    .map(([k]) => k);
  const overall = mustFailed.length === 0 ? "PASS" : "FAIL";

  const summary = {
    skill: "media-analysis",
    target: slug,
    dimensions: results,
    overall,
    must_failed: mustFailed,
    should_warned: warned,
    timestamp: new Date().toISOString(),
  };

  if (!json) {
    for (const [name, r] of Object.entries(results)) {
      console.log(`[${name}] ${r.status}: ${r.details}`);
    }
    console.log("\n---SUMMARY---");
  }
  console.log(JSON.stringify(summary, null, 2));
  if (!json) console.log("---END---");

  process.exit(overall === "PASS" ? 0 : 1);
}

main();
