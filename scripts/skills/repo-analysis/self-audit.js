/* global __dirname */
"use strict";

/**
 * /repo-analysis — Self-Audit (per-skill wrapper)
 *
 * Runs the shared CAS handler-output-contract check as a FLOOR, then adds
 * repo-analysis specific checks:
 *   - repomix-output.txt exists (required for Extract routing)
 *   - Phase ordering in state file shows 3.5 → 4 → 6c → self-audit
 *   - analysis.json.source_type === "repo"
 *
 * Usage:    node scripts/skills/repo-analysis/self-audit.js --slug=<slug>
 * Pattern:  .claude/skills/_shared/SELF_AUDIT_PATTERN.md
 * Floor:    scripts/cas/self-audit.js (CONVENTIONS §13 contract)
 *
 * Exit codes:
 *   0 = floor PASS + all skill-specific checks PASS
 *   1 = any MUST check FAIL
 *   2 = script failed to run (missing args, security refusal)
 *
 * Skipped from full dimension coverage:
 *   - Dim 6 multi-agent: deterministic checks (counter + file_modified) suffice
 *     per Session #281 D11. Prose review in Phase 5 covers edge cases.
 *   - Dim 7 regression: deferred to Phase 5 interactive prompt (compare trend).
 */

const path = require("node:path");
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

function checkRepomix(slug) {
  try {
    validatePathInDir(ANALYSIS_DIR, slug);
    const repomixPath = path.join(ANALYSIS_DIR, slug, "repomix-output.txt");
    let text;
    try {
      text = safeReadText(repomixPath);
    } catch (err) {
      if (err && err.code === "ENOENT") {
        return {
          status: "FAIL",
          details: "repomix-output.txt missing — required for Extract routing",
        };
      }
      throw err;
    }
    if (!text || text.length === 0) {
      return { status: "FAIL", details: "repomix-output.txt present but empty" };
    }
    return { status: "PASS", details: `repomix-output.txt: ${text.length} bytes` };
  } catch (err) {
    return { status: "FAIL", details: `repomix check: ${sanitizeError(err)}` };
  }
}

function checkSourceType(slug) {
  try {
    validatePathInDir(ANALYSIS_DIR, slug);
    const dir = path.join(ANALYSIS_DIR, slug);
    let json;
    try {
      json = safeReadJson(path.join(dir, "analysis.json"));
    } catch (err) {
      if (err && err.code === "ENOENT") {
        return { status: "FAIL", details: "analysis.json missing" };
      }
      throw err;
    }
    if (json?.source_type !== "repo") {
      return { status: "FAIL", details: `source_type is '${json?.source_type}', expected 'repo'` };
    }
    return { status: "PASS", details: `source_type: repo` };
  } catch (err) {
    return { status: "FAIL", details: `source_type check: ${sanitizeError(err)}` };
  }
}

function checkPhaseOrdering(slug) {
  try {
    const stateFile = `repo-analysis.${slug}.state.json`;
    validatePathInDir(STATE_DIR, stateFile);
    const statePath = path.join(STATE_DIR, stateFile);
    let state;
    try {
      state = safeReadJson(statePath);
    } catch (err) {
      if (err && err.code === "ENOENT") {
        return { status: "WARN", details: "no state file found (skipping phase-ordering check)" };
      }
      throw err;
    }
    if (!state) return { status: "WARN", details: "state file present but empty" };
    const phases = state.phases_completed || [];
    const idxAny = (needles) => {
      for (const n of needles) {
        const i = phases.findIndex((p) => p.includes(n));
        if (i >= 0) return i;
      }
      return -1;
    };
    // Accept both the current label (phase-3.5-content-eval) and the legacy
    // label (phase-4b-content-eval) during the documented migration window.
    const iContent = idxAny(["phase-3.5-content-eval", "phase-4b-content-eval", "content-eval"]);
    const iCreator = idxAny(["phase-4-creator-view", "creator-view"]);
    const i6c = idxAny(["phase-6c-tags", "6c-tags", "phase-6c", "6c"]);
    const iAudit = idxAny(["self-audit"]);
    if (iContent >= 0 && iCreator >= 0 && iContent > iCreator) {
      return { status: "FAIL", details: "content-eval must precede creator-view" };
    }
    if (i6c >= 0 && iAudit >= 0 && i6c > iAudit) {
      return { status: "FAIL", details: "phase-6c-tags must precede self-audit" };
    }
    return { status: "PASS", details: `phases: ${phases.length} completed, ordering valid` };
  } catch (err) {
    return { status: "FAIL", details: `phase ordering check: ${sanitizeError(err)}` };
  }
}

function main() {
  const { slug, json } = parseArgs(process.argv);
  if (!slug) {
    console.error("Usage: node scripts/skills/repo-analysis/self-audit.js --slug=<slug> [--json]");
    process.exit(2);
  }

  const floor = runFloor(slug);
  if (!json) {
    process.stdout.write(floor.stdout);
    if (floor.stderr) process.stderr.write(floor.stderr);
  }

  const results = {
    "cas-floor": { status: floor.status, details: `exit=${floor.exit}` },
    repomix: checkRepomix(slug),
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
    skill: "repo-analysis",
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
