/* global __dirname */
/**
 * Ratchet Baselines Script (Wave 6.3 — Data Effectiveness Audit)
 *
 * Reads current violation counts from `npm run patterns:check -- --json`,
 * compares them against stored baselines, and ratchets down when violations
 * decrease. Regressions (current > baseline) cause exit code 1.
 *
 * Usage: node scripts/ratchet-baselines.js [--dry-run] [--json]
 *
 * Idempotent: running twice with no changes produces the same result (SWS T12).
 */

const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

// Import sanitizeError with fallback (CLAUDE.md Section 5)
let sanitizeError;
try {
  ({ sanitizeError } = require(path.join(__dirname, "lib", "security-helpers.js")));
} catch {
  sanitizeError = (err) => {
    const message = err instanceof Error ? err.message : String(err);
    return message
      .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replace(/\/home\/[^/\s]+/gi, "[HOME]")
      .replace(/\/Users\/[^/\s]+/gi, "[HOME]")
      .replace(/[A-Z]:\\[^\s]+/gi, "[PATH]");
  };
}

// Import safeWriteFileSync with fallback (symlink-guarded writes)
let safeWriteFileSync;
try {
  ({ safeWriteFileSync } = require(path.join(__dirname, "lib", "safe-fs.js")));
} catch {
  safeWriteFileSync = (filePath, data, options) => fs.writeFileSync(filePath, data, options);
}

const ROOT = path.join(__dirname, "..");
const BASELINE_PATH = path.join(ROOT, ".claude", "state", "known-debt-baseline.json");

/** Read and parse the baseline file. File reads wrapped in try/catch (CLAUDE.md S5). */
function readBaselines() {
  try {
    const raw = fs.readFileSync(BASELINE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error("Baseline file not found:", BASELINE_PATH);
      process.exit(2);
    }
    console.error("Failed to read baselines:", sanitizeError(err));
    process.exit(2);
  }
}

/** Run patterns:check --json and return { patternId: count }. */
function getCurrentViolations() {
  let stdout;
  try {
    stdout = execFileSync(
      process.execPath,
      [path.join(ROOT, "scripts", "check-pattern-compliance.js"), "--all", "--json"],
      { cwd: ROOT, encoding: "utf-8", maxBuffer: 10 * 1024 * 1024, timeout: 120_000 }
    );
  } catch (err) {
    // execFileSync throws on non-zero exit; stdout is still available
    if (err.stdout) {
      if (typeof err.stdout === "string") {
        stdout = err.stdout;
      } else if (Buffer.isBuffer(err.stdout)) {
        stdout = err.stdout.toString("utf-8");
      } else {
        stdout = String(err.stdout);
      }
    } else {
      console.error("Failed to run patterns:check:", sanitizeError(err));
      process.exit(2);
    }
  }

  try {
    const report = JSON.parse(stdout);

    // Merge warnings, blocks, violations into a single list
    const all = [
      ...(report.warnings || []),
      ...(report.blocks || []),
      ...(report.violations || []),
    ];

    // Count violations per pattern id
    const counts = {};
    for (const entry of all) {
      const id = entry.id;
      if (id) {
        counts[id] = (counts[id] || 0) + 1;
      }
    }
    return counts;
  } catch (parseErr) {
    console.error("Failed to parse patterns:check output:", sanitizeError(parseErr));
    process.exit(2);
  }
}

/** Record an improvement: update baseline, history, and recorded date. */
function recordImprovement(entry, today, stored, current) {
  // Defensive: ensure ratchet_history is an array before pushing
  if (!Array.isArray(entry.ratchet_history)) {
    entry.ratchet_history = [];
  }
  entry.ratchet_history.push({ date: today, from: stored, to: current });
  entry.baseline = current;
  entry.recorded = today;
}

/** Find pattern IDs in currentCounts that are not in baselines and have count > 0. */
function findNewPatternRegressions(baselines, currentCounts) {
  const regressions = [];
  for (const [patternId, current] of Object.entries(currentCounts)) {
    if (!Object.hasOwn(baselines, patternId) && current > 0) {
      regressions.push(patternId);
    }
  }
  return regressions;
}

/** Core ratchet logic: compare current counts against baselines. */
function ratchet(baselineData, currentCounts, opts = {}) {
  const { dryRun = false } = opts;
  const today = new Date().toISOString().slice(0, 10);
  const regressions = [];
  const improvements = [];
  const unchanged = [];

  // Defensive: validate baselines is an object
  const baselines =
    baselineData && typeof baselineData.baselines === "object" && baselineData.baselines !== null
      ? baselineData.baselines
      : {};

  for (const [patternId, entry] of Object.entries(baselines)) {
    const current = currentCounts[patternId] || 0;
    // Defensive: default baseline to 0 if not a number
    const stored = typeof entry.baseline === "number" ? entry.baseline : 0;

    if (current > stored) {
      regressions.push(patternId);
    } else if (current < stored) {
      improvements.push(patternId);
      if (!dryRun) {
        recordImprovement(entry, today, stored, current);
      }
    } else {
      unchanged.push(patternId);
    }
  }

  // New pattern IDs not present in baselines: treat as regression (baseline assumed 0)
  regressions.push(...findNewPatternRegressions(baselines, currentCounts));

  // Write updated baselines if there were improvements and not dry-run
  if (improvements.length > 0 && !dryRun) {
    baselineData.updated = today;
    try {
      safeWriteFileSync(BASELINE_PATH, JSON.stringify(baselineData, null, 2) + "\n", "utf-8");
    } catch (err) {
      console.error("Failed to write baselines:", sanitizeError(err));
      process.exit(2);
    }
  }

  return { regressions, improvements, unchanged };
}

/** Build the JSON output object for --json mode. */
function buildJsonOutput(result, dryRun) {
  return {
    dryRun,
    regressions: result.regressions,
    improvements: result.improvements,
    unchanged: result.unchanged,
    exitCode: result.regressions.length > 0 ? 1 : 0,
  };
}

/** Print human-readable improvement details. */
function reportImprovements(result, baselineData, dryRun) {
  if (result.improvements.length === 0) return;
  console.log(`Improvements (ratcheted${dryRun ? " — dry-run, not saved" : ""}):`);
  for (const id of result.improvements) {
    const entry = baselineData.baselines[id];
    const hist = Array.isArray(entry?.ratchet_history) ? entry.ratchet_history : [];
    const last = hist.length > 0 ? hist[hist.length - 1] : null;
    if (last) {
      console.log(`  ${id}: ${last.from} -> ${last.to}`);
    } else {
      console.log(`  ${id}: improved`);
    }
  }
}

/** Print human-readable regression details. */
function reportRegressions(result, baselineData, currentCounts) {
  if (result.regressions.length === 0) return;
  console.error("REGRESSIONS detected (current > baseline):");
  for (const id of result.regressions) {
    const entry = baselineData.baselines?.[id];
    let stored = 0;
    if (entry && typeof entry.baseline === "number") {
      stored = entry.baseline;
    }
    const current = currentCounts[id] || 0;
    console.error(`  ${id}: baseline=${stored}, current=${current}`);
  }
}

function run(argv) {
  const args = argv || process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const jsonOut = args.includes("--json");

  const baselineData = readBaselines();
  const currentCounts = getCurrentViolations();
  const result = ratchet(baselineData, currentCounts, { dryRun });

  if (jsonOut) {
    console.log(JSON.stringify(buildJsonOutput(result, dryRun), null, 2));
  } else {
    reportImprovements(result, baselineData, dryRun);

    if (result.unchanged.length > 0) {
      console.log(`Unchanged: ${result.unchanged.join(", ")}`);
    }

    reportRegressions(result, baselineData, currentCounts);
  }

  if (result.regressions.length > 0) {
    process.exit(1);
  }
}

// Run if invoked directly
if (require.main === module) {
  run();
}

module.exports = { run, readBaselines, ratchet };
