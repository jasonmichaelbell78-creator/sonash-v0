/* global __dirname */
"use strict";

/**
 * /document-analysis — Self-Audit (per-skill wrapper)
 *
 * Runs the shared CAS handler-output-contract check as a FLOOR, then adds
 * document-analysis specific checks:
 *   - analysis.json.source_type === "document"
 *   - Phase ordering for v2.0 layout: phase-2-deep-read < phase-3-dimension-wave,
 *     phase-3.5-content-eval < phase-4-creator-view, phase-6c-tags < self-audit
 *   - deep-read.md exists (MUST for Standard/Deep, now Phase 2)
 *
 * Usage:    node scripts/skills/document-analysis/self-audit.js --slug=<slug>
 * Pattern:  .claude/skills/_shared/SELF_AUDIT_PATTERN.md
 * Floor:    scripts/cas/self-audit.js (CONVENTIONS §13 contract)
 *
 * v2.0 phase-renumber note: accepts legacy labels (phase-4b-content-eval,
 * phase-2-dimension-wave) during the v2.0 → v2.2 transition window via the
 * includes() heuristic below — see SKILL.md state-file migration note.
 */

const path = require("node:path");
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const { sanitizeError, validatePathInDir } = require("../../lib/security-helpers.js");
const { safeReadText, safeReadJson } = require("../../lib/safe-cas-io.js");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "analysis");
const CAS_AUDIT = path.join(PROJECT_ROOT, "scripts", "cas", "self-audit.js");
const STATE_DIR = path.join(PROJECT_ROOT, ".claude", "state");

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
  const res = spawnSync("node", [CAS_AUDIT, `--slug=${slug}`], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
  });
  return {
    status: res.status === 0 ? "PASS" : "FAIL",
    exit: res.status,
    stdout: res.stdout || "",
    stderr: res.stderr || "",
  };
}

function checkDeepRead(slug) {
  try {
    validatePathInDir(ANALYSIS_DIR, slug);
    const deepPath = path.join(ANALYSIS_DIR, slug, "deep-read.md");
    if (!fs.existsSync(deepPath)) {
      return {
        status: "FAIL",
        details: "deep-read.md missing (MUST for Standard/Deep, now Phase 2)",
      };
    }
    const text = safeReadText(deepPath);
    if (!text || text.length < 50) {
      return { status: "FAIL", details: "deep-read.md present but too short (<50 bytes)" };
    }
    return { status: "PASS", details: `deep-read.md: ${text.length} bytes` };
  } catch (err) {
    return { status: "FAIL", details: `deep-read check: ${sanitizeError(err)}` };
  }
}

function checkSourceType(slug) {
  try {
    validatePathInDir(ANALYSIS_DIR, slug);
    const jsonPath = path.join(ANALYSIS_DIR, slug, "analysis.json");
    if (!fs.existsSync(jsonPath)) return { status: "FAIL", details: "analysis.json missing" };
    const json = safeReadJson(jsonPath);
    if (!json || json.source_type !== "document") {
      return {
        status: "FAIL",
        details: `source_type is '${json?.source_type}', expected 'document'`,
      };
    }
    return { status: "PASS", details: `source_type: document` };
  } catch (err) {
    return { status: "FAIL", details: `source_type check: ${sanitizeError(err)}` };
  }
}

function checkPhaseOrdering(slug) {
  try {
    const stateFile = `document-analysis.${slug}.state.json`;
    validatePathInDir(STATE_DIR, stateFile);
    const statePath = path.join(STATE_DIR, stateFile);
    if (!fs.existsSync(statePath)) {
      return { status: "WARN", details: "no state file found (skipping phase-ordering check)" };
    }
    const state = safeReadJson(statePath);
    if (!state) return { status: "WARN", details: "state file unreadable" };
    const phases = state.phases_completed || [];
    const idx = (needle) => phases.findIndex((p) => p.includes(needle));
    const iDeepRead = idx("deep-read");
    const iDim = idx("dimension-wave") >= 0 ? idx("dimension-wave") : idx("phase-3");
    const iContent = idx("content-eval");
    const iCreator = idx("creator-view");
    const i6c = idx("tag") >= 0 ? idx("tag") : idx("6c");
    const iAudit = idx("self-audit");
    const issues = [];
    if (iDeepRead >= 0 && iDim >= 0 && iDeepRead > iDim)
      issues.push("deep-read must precede dimension-wave");
    if (iContent >= 0 && iCreator >= 0 && iContent > iCreator)
      issues.push("content-eval must precede creator-view");
    if (i6c >= 0 && iAudit >= 0 && i6c > iAudit)
      issues.push("tag-suggestion must precede self-audit");
    if (issues.length) return { status: "FAIL", details: issues.join("; ") };
    return { status: "PASS", details: `phases: ${phases.length} completed, v2.0 ordering valid` };
  } catch (err) {
    return { status: "FAIL", details: `phase ordering check: ${sanitizeError(err)}` };
  }
}

function main() {
  const { slug, json } = parseArgs(process.argv);
  if (!slug) {
    console.error(
      "Usage: node scripts/skills/document-analysis/self-audit.js --slug=<slug> [--json]"
    );
    process.exit(2);
  }

  const floor = runFloor(slug);
  if (!json) {
    process.stdout.write(floor.stdout);
    if (floor.stderr) process.stderr.write(floor.stderr);
  }

  const results = {
    "cas-floor": { status: floor.status, details: `exit=${floor.exit}` },
    deep_read: checkDeepRead(slug),
    source_type: checkSourceType(slug),
    phase_ordering: checkPhaseOrdering(slug),
  };

  const mustFailed = Object.entries(results)
    .filter(([, v]) => v.status === "FAIL")
    .map(([k]) => k);
  const warned = Object.entries(results)
    .filter(([, v]) => v.status === "WARN")
    .map(([k]) => k);
  const overall = mustFailed.length === 0 ? "PASS" : "FAIL";

  const summary = {
    skill: "document-analysis",
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
