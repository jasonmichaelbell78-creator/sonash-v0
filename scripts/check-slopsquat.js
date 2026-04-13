#!/usr/bin/env node
/**
 * Slopsquat gate — prototype (T29 Wave 5 Opportunity #2).
 *
 * Detects potentially-hallucinated npm package names by verifying each
 * dependency in package.json / functions/package.json against the npm
 * registry. A 404 response means the package does not exist — a strong
 * signal that the name was hallucinated by an AI code generator and may
 * later be squatted by a malicious actor (hence "slopsquatting").
 *
 * Reference: errors-and-vulnerabilities-in-ai-generated-code (T29 CAS corpus).
 *
 * Usage:
 *   node scripts/check-slopsquat.js --private-ok         # check ALL deps in package.json + functions/package.json
 *   node scripts/check-slopsquat.js --private-ok --json  # machine-readable output
 *
 * Opt-in requirement:
 *   Every run transmits every dependency name to https://registry.npmjs.org/.
 *   For repositories that may contain private/internal package names, this
 *   leaks those names to a public service. The --private-ok flag is an
 *   explicit acknowledgment that the caller has reviewed the dep list and
 *   accepts this disclosure. Without it the script refuses to run (exit 2).
 *
 * Exit codes:
 *   0 = no suspicious packages
 *   1 = one or more packages flagged (soft-warn mode; caller decides to block)
 *   2 = tool failure OR --private-ok not provided
 *
 * Prototype scope: always scans all deps. A future iteration can add
 * staged-diff detection for pre-commit use; for now the prototype is
 * ad-hoc: run manually when adding new dependencies.
 *
 * NOT YET wired into pre-commit. User opts in explicitly when ready.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { sanitizeError } = require("./lib/sanitize-error.js");

const ROOT = path.resolve(__dirname, "..");
const PACKAGE_FILES = [
  path.join(ROOT, "package.json"),
  path.join(ROOT, "functions", "package.json"),
];

const REGISTRY_BASE = "https://registry.npmjs.org/";
const REQUEST_TIMEOUT_MS = 5000;
const CHECK_CONCURRENCY = 6;

const PRIVATE_OK_MESSAGE =
  "Refusing to run: every dependency name in package.json files would be sent " +
  "to https://registry.npmjs.org/ (public service). Re-run with --private-ok " +
  "to acknowledge that disclosure, or skip this check if the dep list contains " +
  "private/internal package names you do not want published.";

function parseArgs(argv) {
  const flags = { json: false, privateOk: false };
  for (const a of argv.slice(2)) {
    if (a === "--json") flags.json = true;
    else if (a === "--private-ok") flags.privateOk = true;
  }
  return flags;
}

function extractDeps(pkgPath) {
  let raw;
  try {
    raw = fs.readFileSync(pkgPath, "utf8");
  } catch (err) {
    // Read failure (permission, transient I/O). Report and return empty — the
    // alternative is terminating the whole check when one of several
    // package.json files is unreadable, which is too blunt.
    console.warn(
      `  Warning: could not read ${path.basename(pkgPath)}: ${sanitizeError(err).slice(0, 160)}`
    );
    return new Set();
  }
  let pkg;
  try {
    pkg = JSON.parse(raw);
  } catch (err) {
    console.warn(
      `  Warning: could not parse ${path.basename(pkgPath)} as JSON: ${sanitizeError(err).slice(0, 160)}`
    );
    return new Set();
  }
  const names = new Set();
  for (const key of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    if (pkg[key] && typeof pkg[key] === "object") {
      for (const name of Object.keys(pkg[key])) names.add(name);
    }
  }
  return names;
}

function getAllDeps() {
  const all = new Set();
  for (const pkgPath of PACKAGE_FILES) {
    if (!fs.existsSync(pkgPath)) continue;
    for (const name of extractDeps(pkgPath)) all.add(name);
  }
  return all;
}

function classifyVerdict(status) {
  if (status === 200) return "ok";
  if (status === 404) return "not-found";
  return `http-${status}`;
}

async function checkOne(name) {
  const encoded = encodeURIComponent(name).replace(/^%40/, "@"); // keep scoped-package @ prefix
  const url = REGISTRY_BASE + encoded;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    return { name, status: res.status, verdict: classifyVerdict(res.status) };
  } catch (err) {
    return { name, status: null, verdict: "error", error: sanitizeError(err).slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
}

async function checkAll(names) {
  const list = [...names];
  const results = [];
  for (let i = 0; i < list.length; i += CHECK_CONCURRENCY) {
    const batch = list.slice(i, i + CHECK_CONCURRENCY);
    const batchResults = await Promise.all(batch.map(checkOne));
    results.push(...batchResults);
  }
  return results;
}

function verdictTag(verdict) {
  if (verdict === "not-found") return "NOT FOUND";
  if (verdict === "error") return "NETWORK ERROR";
  return verdict.toUpperCase();
}

function printFlaggedReport(flagged, total) {
  const ok = total - flagged.length;
  console.log(`  ${ok}/${total} verified against npm registry.`);
  if (flagged.length === 0) {
    console.log("  No suspicious packages. PASS.");
    return;
  }
  console.log(`\n  ⚠ ${flagged.length} flagged package(s):`);
  for (const f of flagged) {
    const tag = verdictTag(f.verdict);
    const errPart = f.error ? ` — ${f.error}` : "";
    console.log(`    ${tag}  ${f.name}${errPart}`);
  }
  console.log(
    `\n  Soft-warn only — this check is not wired into pre-commit.` +
      ` 'NOT FOUND' is the signal worth attention (possible hallucinated package name).` +
      ` 'NETWORK ERROR' = inconclusive, re-run when online.`
  );
}

async function main() {
  const flags = parseArgs(process.argv);

  if (!flags.privateOk) {
    if (flags.json) {
      console.log(
        JSON.stringify({
          mode: "all",
          checked: 0,
          flagged: [],
          error: "private-ok-required",
          message: PRIVATE_OK_MESSAGE,
        })
      );
    } else {
      console.error(`  ${PRIVATE_OK_MESSAGE}\n`);
    }
    return 2;
  }

  const names = getAllDeps();

  if (names.size === 0) {
    if (flags.json) {
      console.log(JSON.stringify({ mode: "all", checked: 0, flagged: [] }));
    } else {
      console.log("Slopsquat check: no deps found in package.json files.");
    }
    return 0;
  }

  if (!flags.json) {
    console.log(
      `Slopsquat check (all deps): ${names.size} package(s) — transmitting dep names to npm registry`
    );
  }

  const results = await checkAll(names);
  const flagged = results.filter((r) => r.verdict !== "ok");

  if (flags.json) {
    console.log(JSON.stringify({ mode: "all", checked: results.length, flagged }, null, 2));
  } else {
    printFlaggedReport(flagged, results.length);
  }
  return flagged.length > 0 ? 1 : 0;
}

module.exports = {
  parseArgs,
  extractDeps,
  getAllDeps,
  classifyVerdict,
  verdictTag,
  printFlaggedReport,
  PRIVATE_OK_MESSAGE,
};

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error("Fatal:", sanitizeError(err));
      process.exit(2);
    });
}
