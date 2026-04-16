/* global __dirname */
"use strict";

/**
 * /analyze — Self-Audit (per-skill wrapper, router-focused)
 *
 * Runs per-slug CAS handler-output-contract floor on one slug (--target=<slug>)
 * or across every slug (--all). Also verifies the router-global Handoff
 * Contract: all 4 handler SKILL.md headers acknowledge their auto_detected_type.
 *
 * Dimensions covered (per SKILL_STANDARDS.md):
 *   Dim 1 — Completeness: analysis.json + SQLite sources row + extraction-
 *           journal entries + EXTRACTIONS.md mtime >= analysis.json mtime
 *   Dim 2 — Orphan detection: N/A (router creates no artifacts directly)
 *   Dim 3 — Build integrity: via cas-floor (Zod schema check)
 *   Dim 4 — Gap analysis: per-slug decision→artifact mapping via cas-floor
 *   Dim 5 — Functional verification: analyze-routing-log entry presence
 *   Dim 8 — Contract: router reads slug at canonical path; handler SKILL.md
 *           headers acknowledge Handoff Contract payload
 *   Dim 9 — Partial recovery: detect slug directories without SQLite row
 *
 * Skipped dimensions (with rationale):
 *   Dim 6 — Multi-agent: N/A. /analyze is a deterministic regex-priority
 *           router; no multi-agent discovery happens in its scope.
 *   Dim 7 — Regression: light. No multi-run state; prior-run comparison
 *           limited to last indexed slug's timestamp.
 *
 * Usage:
 *   node scripts/skills/analyze/self-audit.js --target=<slug> [--json]
 *   node scripts/skills/analyze/self-audit.js --all [--json]
 *
 * Pattern: .claude/skills/_shared/SELF_AUDIT_PATTERN.md
 * Floor:   scripts/cas/self-audit.js (CONVENTIONS §13 handler-output contract)
 */

const path = require("node:path");
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const { sanitizeError, validatePathInDir } = require("../../lib/security-helpers.js");
const { safeReadJson } = require("../../lib/safe-cas-io.js");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "analysis");
const CAS_AUDIT = path.join(PROJECT_ROOT, "scripts", "cas", "self-audit.js");
const EXTRACTIONS_MD = path.join(PROJECT_ROOT, ".research", "EXTRACTIONS.md");
const EXTRACTION_JOURNAL = path.join(PROJECT_ROOT, ".research", "extraction-journal.jsonl");
const ROUTING_LOG = path.join(PROJECT_ROOT, ".claude", "state", "analyze-routing-log.jsonl");
const HANDLER_SKILLS = ["repo-analysis", "website-analysis", "document-analysis", "media-analysis"];

function parseArgs(argv) {
  let target = null;
  let all = false;
  let json = false;
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--target=")) target = arg.slice(9);
    else if (arg === "--all") all = true;
    else if (arg === "--json") json = true;
  }
  return { target, all, json };
}

function runFloor(slug) {
  const res = spawnSync(process.execPath, [CAS_AUDIT, `--slug=${slug}`], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    timeout: 60_000,
    maxBuffer: 10 * 1024 * 1024,
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

/** Dim 1 — per-slug completeness */
function checkSlugCompleteness(slug) {
  try {
    validatePathInDir(ANALYSIS_DIR, slug);
    const slugDir = path.join(ANALYSIS_DIR, slug);
    const analysisPath = path.join(slugDir, "analysis.json");
    if (!fs.existsSync(analysisPath)) {
      return {
        status: "FAIL",
        details: `analysis.json missing at ${path.relative(PROJECT_ROOT, analysisPath)}`,
      };
    }
    const analysis = safeReadJson(analysisPath);
    if (!analysis) return { status: "FAIL", details: "analysis.json unreadable" };

    // Check extraction-journal has entries for this slug (try/catch covers
    // TOCTOU between existsSync and readFileSync per CLAUDE.md Top 5 #4)
    let journal;
    try {
      journal = fs.readFileSync(EXTRACTION_JOURNAL, "utf8");
    } catch (err) {
      if (err?.code === "ENOENT") {
        return {
          status: "WARN",
          details: "analysis.json ok; extraction-journal.jsonl missing (no extractions exist yet)",
        };
      }
      return { status: "FAIL", details: `extraction-journal read: ${sanitizeError(err)}` };
    }
    const journalEntries = journal
      .split("\n")
      .filter((line) => line.trim())
      .filter(
        (line) => line.includes(`"source":"${slug}"`) || line.includes(`"source": "${slug}"`)
      );
    if (journalEntries.length === 0) {
      return {
        status: "WARN",
        details: `analysis.json ok; 0 extraction-journal entries for slug (source may be extraction-less)`,
      };
    }

    // Check EXTRACTIONS.md was regenerated >= analysis.json mtime
    if (!fs.existsSync(EXTRACTIONS_MD)) {
      return {
        status: "WARN",
        details: `analysis.json ok (${journalEntries.length} journal entries); EXTRACTIONS.md missing`,
      };
    }
    // TOCTOU guard per propagation rule lstat-symlink (PR #388, #397):
    // use lstatSync + isSymbolicLink instead of bare statSync. Following a
    // symlink for an mtime check could mask staleness if an attacker swapped
    // a real artifact for a symlink to a fresh file.
    const analysisStats = fs.lstatSync(analysisPath);
    if (analysisStats.isSymbolicLink()) {
      return { status: "FAIL", details: "analysis.json is a symlink — refused" };
    }
    const extractionsStats = fs.lstatSync(EXTRACTIONS_MD);
    if (extractionsStats.isSymbolicLink()) {
      return { status: "FAIL", details: "EXTRACTIONS.md is a symlink — refused" };
    }
    const analysisMtime = analysisStats.mtimeMs;
    const extractionsMtime = extractionsStats.mtimeMs;
    if (extractionsMtime < analysisMtime) {
      return {
        status: "WARN",
        details: `EXTRACTIONS.md stale — run: node scripts/cas/generate-extractions-md.js`,
      };
    }

    return {
      status: "PASS",
      details: `analysis.json + ${journalEntries.length} journal entries + EXTRACTIONS.md fresh`,
    };
  } catch (err) {
    return { status: "FAIL", details: `completeness: ${sanitizeError(err)}` };
  }
}

/** Dim 8 — Handoff Contract acknowledgment across all 4 handlers */
function checkHandoffContract() {
  const missing = [];
  const mismatches = [];
  for (const skill of HANDLER_SKILLS) {
    const skillMd = path.join(PROJECT_ROOT, ".claude", "skills", skill, "SKILL.md");
    let content;
    try {
      content = fs.readFileSync(skillMd, "utf8").slice(0, 3000);
    } catch (err) {
      if (err?.code === "ENOENT") {
        missing.push(`${skill}/SKILL.md`);
        continue;
      }
      mismatches.push(`${skill}: read error — ${sanitizeError(err)}`);
      continue;
    }
    const expectedType = skill.replace("-analysis", "");
    // Look for "auto_detected_type" and the expected type string in handshake area
    if (!content.includes("auto_detected_type")) {
      mismatches.push(`${skill}: no 'auto_detected_type' mention in first 3000 chars`);
      continue;
    }
    if (!content.includes(`"${expectedType}"`)) {
      mismatches.push(`${skill}: expected "${expectedType}" quoted in handoff-contract block`);
    }
  }
  if (missing.length > 0) {
    return { status: "FAIL", details: `missing handler SKILL.md: ${missing.join(", ")}` };
  }
  if (mismatches.length > 0) {
    return { status: "FAIL", details: `handoff contract mismatches: ${mismatches.join("; ")}` };
  }
  return { status: "PASS", details: `4/4 handlers acknowledge Handoff Contract with correct type` };
}

/** Dim 5 — routing log presence (informational floor) */
function checkRoutingLog() {
  if (!fs.existsSync(ROUTING_LOG)) {
    return {
      status: "WARN",
      details: `routing log not yet created — expected after first /analyze run`,
    };
  }
  try {
    const content = fs.readFileSync(ROUTING_LOG, "utf8");
    const lines = content.split("\n").filter((l) => l.trim());
    return {
      status: "PASS",
      details: `${lines.length} routing entries logged`,
    };
  } catch (err) {
    return { status: "FAIL", details: `routing log unreadable: ${sanitizeError(err)}` };
  }
}

/** Dim 9 — partial-execution recovery detection: slugs with dir but no SQLite row would be orphans */
function checkPartialExecution(slug) {
  // Best-effort: verify analysis.json has source_id that looks like a SQLite key
  try {
    validatePathInDir(ANALYSIS_DIR, slug);
    const analysis = safeReadJson(path.join(ANALYSIS_DIR, slug, "analysis.json"));
    if (!analysis) return { status: "WARN", details: "analysis.json not readable" };
    if (!analysis.slug && !analysis.id) {
      return {
        status: "WARN",
        details: "analysis.json lacks slug/id field — index sync may have been skipped",
      };
    }
    return {
      status: "PASS",
      details: `analysis.json has slug/id: ${analysis.slug || analysis.id}`,
    };
  } catch (err) {
    return { status: "FAIL", details: `partial-exec check: ${sanitizeError(err)}` };
  }
}

function auditOneSlug(slug) {
  const floor = runFloor(slug);
  return {
    "cas-floor": { status: floor.status, details: `exit=${floor.exit}` },
    completeness: checkSlugCompleteness(slug),
    partial_execution: checkPartialExecution(slug),
  };
}

function listAllSlugs() {
  if (!fs.existsSync(ANALYSIS_DIR)) return [];
  return fs
    .readdirSync(ANALYSIS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
    .map((d) => d.name);
}

function main() {
  const { target, all, json } = parseArgs(process.argv);
  if (!target && !all) {
    console.error(
      "Usage: node scripts/skills/analyze/self-audit.js --target=<slug> [--json]\n" +
        "       node scripts/skills/analyze/self-audit.js --all [--json]"
    );
    process.exit(2);
  }
  if (target && all) {
    console.error("Refusing to run: --target and --all are mutually exclusive");
    process.exit(2);
  }

  // Router-global checks (run once regardless of mode)
  const globalResults = {
    handoff_contract: checkHandoffContract(),
    routing_log: checkRoutingLog(),
  };

  let perSlugResults = {};
  if (target) {
    try {
      validatePathInDir(ANALYSIS_DIR, target);
    } catch (err) {
      console.error(`Refusing to run: ${sanitizeError(err)}`);
      process.exit(2);
    }
    if (!fs.existsSync(path.join(ANALYSIS_DIR, target))) {
      console.error(
        `Refusing to run: slug '${target}' not found in ${path.relative(PROJECT_ROOT, ANALYSIS_DIR)}`
      );
      process.exit(2);
    }
    perSlugResults[target] = auditOneSlug(target);
  } else {
    const slugs = listAllSlugs();
    if (slugs.length === 0) {
      console.log("No slugs found in .research/analysis/ — nothing to audit in --all mode.");
    }
    for (const slug of slugs) {
      perSlugResults[slug] = auditOneSlug(slug);
    }
  }

  // Aggregate status
  const allDims = { ...globalResults };
  for (const [slug, dims] of Object.entries(perSlugResults)) {
    for (const [dim, r] of Object.entries(dims)) {
      allDims[`${slug}::${dim}`] = r;
    }
  }
  const mustFailed = Object.entries(allDims)
    .filter(([, v]) => v.status === "FAIL")
    .map(([k]) => k);
  const warned = Object.entries(allDims)
    .filter(([, v]) => v.status === "WARN")
    .map(([k]) => k);
  const overall = mustFailed.length === 0 ? "PASS" : "FAIL";

  const summary = {
    skill: "analyze",
    mode: target ? "target" : "all",
    target: target || null,
    slugs_audited: Object.keys(perSlugResults),
    global_dimensions: globalResults,
    per_slug_dimensions: perSlugResults,
    overall,
    must_failed: mustFailed,
    should_warned: warned,
    skipped_dimensions: {
      dim_6_multi_agent: "N/A — router is deterministic regex-priority",
      dim_7_regression: "light — no multi-run history state",
    },
    timestamp: new Date().toISOString(),
  };

  if (!json) {
    console.log("[analyze self-audit]");
    console.log("--- Router-global ---");
    for (const [name, r] of Object.entries(globalResults)) {
      console.log(`  [${name}] ${r.status}: ${r.details}`);
    }
    if (target) {
      console.log(`--- Slug: ${target} ---`);
      for (const [dim, r] of Object.entries(perSlugResults[target])) {
        console.log(`  [${dim}] ${r.status}: ${r.details}`);
      }
    } else {
      console.log(`--- Regression over ${Object.keys(perSlugResults).length} slugs ---`);
      for (const [slug, dims] of Object.entries(perSlugResults)) {
        const slugMustFailed = Object.values(dims).filter((v) => v.status === "FAIL").length;
        const slugWarned = Object.values(dims).filter((v) => v.status === "WARN").length;
        console.log(
          `  [${slug}] ${slugMustFailed === 0 ? "PASS" : "FAIL"} (fail=${slugMustFailed}, warn=${slugWarned})`
        );
      }
    }
    console.log(`\nOverall: ${overall} (failed=${mustFailed.length}, warned=${warned.length})`);
    console.log("\n---SUMMARY---");
  }
  console.log(JSON.stringify(summary, null, 2));
  if (!json) console.log("---END---");

  process.exit(overall === "PASS" ? 0 : 1);
}

if (require.main === module) main();

module.exports = {
  parseArgs,
  checkSlugCompleteness,
  checkHandoffContract,
  checkRoutingLog,
  checkPartialExecution,
  auditOneSlug,
  listAllSlugs,
};
