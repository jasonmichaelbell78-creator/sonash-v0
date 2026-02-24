#!/usr/bin/env node
/**
 * CC Regression Checker
 *
 * Reads a list of staged JS files from stdin, compares CC violation counts
 * between the staged (working) version and the HEAD version of each file.
 * Exits with code 1 if any file has MORE CC >15 violations than HEAD.
 *
 * PR #386 retro: ESLint CC is "warn" globally (82 pre-existing violations).
 * This script blocks NEW violations without false positives from pre-existing ones.
 *
 * Usage: echo "scripts/foo.js" | node scripts/check-cc-regression.js
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const CC_THRESHOLD = 15;
const CC_RULE = `complexity: ["error", ${CC_THRESHOLD}]`;

function countCCViolations(filePath) {
  try {
    const output = execFileSync("npx", ["eslint", "--rule", CC_RULE, "--", filePath], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return (output.match(/complexity/g) ?? []).length;
  } catch (err) {
    // ESLint exits non-zero when there are errors — parse stdout
    const stdout = err.stdout ?? "";
    return (stdout.match(/complexity/g) ?? []).length;
  }
}

function countCCViolationsFromStdin(filePath) {
  try {
    const headContent = execFileSync("git", ["show", `HEAD:${filePath}`], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const output = execFileSync(
      "npx",
      ["eslint", "--rule", CC_RULE, "--stdin", "--stdin-filename", filePath],
      { input: headContent, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    return (output.match(/complexity/g) ?? []).length;
  } catch (err) {
    if (err.stderr?.includes("fatal: Path") || err.status === 128) {
      return 0; // New file, no HEAD version
    }
    const stdout = err.stdout ?? "";
    return (stdout.match(/complexity/g) ?? []).length;
  }
}

function getViolationDetails(filePath) {
  try {
    execFileSync("npx", ["eslint", "--rule", CC_RULE, "--", filePath], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return "";
  } catch (err) {
    const stdout = err.stdout ?? "";
    return stdout
      .split("\n")
      .filter((line) => line.includes("complexity"))
      .slice(0, 5)
      .join("\n");
  }
}

// Read file list from stdin (cross-platform: fd 0 is more robust than process.stdin.fd)
const input = readFileSync(0, "utf8").trim();
if (!input) process.exit(0);

const files = input.split("\n").filter(Boolean);
let hasRegression = false;

for (const file of files) {
  const stagedCount = countCCViolations(file);
  if (stagedCount === 0) continue; // Fast path: no violations at all

  const headCount = countCCViolationsFromStdin(file);
  if (stagedCount > headCount) {
    console.log(`  ❌ CC regression in ${file} (${headCount} → ${stagedCount} violations)`);
    const details = getViolationDetails(file);
    if (details) console.log(details);
    hasRegression = true;
  }
}

process.exit(hasRegression ? 1 : 0);
