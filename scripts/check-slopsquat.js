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
 *   node scripts/check-slopsquat.js              # check ALL deps in package.json + functions/package.json
 *   node scripts/check-slopsquat.js --json       # machine-readable output
 *
 * Exit codes:
 *   0 = no suspicious packages
 *   1 = one or more packages flagged (soft-warn mode; caller decides to block)
 *   2 = tool failure (e.g., network error)
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

function parseArgs(argv) {
  const flags = { json: false };
  for (const a of argv.slice(2)) {
    if (a === "--json") flags.json = true;
  }
  return flags;
}

function extractDeps(pkgPath) {
  try {
    const raw = fs.readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(raw);
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
  } catch {
    return new Set();
  }
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
    console.log(`Slopsquat check (all deps): ${names.size} package(s)`);
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

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("Fatal:", sanitizeError(err));
    process.exit(2);
  });
