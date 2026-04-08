#!/usr/bin/env node
/* global __dirname */
/**
 * reclassify-learning-routes.js — One-time migration script
 *
 * Reclassifies learning-routes.jsonl entries by enforcement layer:
 *   - verified-pattern / lint-rule → deterministic (keep as-is)
 *   - hook-gate                   → semi-deterministic, status → behavioral-acknowledged
 *   - claude-md-annotation        → probabilistic, status → behavioral-acknowledged
 *
 * Adds _reclassified and _reclassification_reason fields to changed entries.
 *
 * Usage: node scripts/reclassify-learning-routes.js
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { safeWriteFileSync } = require("./lib/safe-fs.js");
const { sanitizeError, validatePathInDir } = require("./lib/security-helpers.js");

const ROUTES_FILE = path.resolve(__dirname, "../.claude/state/learning-routes.jsonl"); // validatePathInDir: constant-path (no user input)

const RECLASSIFY_DATE = "2026-04-07";

/** Map route → enforcement_layer */
const ENFORCEMENT_LAYER_MAP = {
  "verified-pattern": "deterministic",
  "lint-rule": "deterministic",
  "hook-gate": "semi-deterministic",
  "claude-md-annotation": "probabilistic",
};

/** Routes whose status should move from "refined" to "behavioral-acknowledged" */
const BEHAVIORAL_ROUTES = new Set(["hook-gate", "claude-md-annotation"]);

/** Reason text per route type */
const RECLASSIFICATION_REASON = {
  "hook-gate":
    "hook-gate routes enforce cognitive/process patterns that cannot graduate to deterministic code enforcement; semi-deterministic layer is the correct home",
  "claude-md-annotation":
    "claude-md-annotation routes are probabilistic behavioral patterns; no deterministic enforcement path exists — acknowledged as behavioral",
};

function readRoutes() {
  try {
    const raw = fs.readFileSync(ROUTES_FILE, "utf8");
    const lines = raw.split("\n").filter((line) => line.trim().length > 0);
    const entries = [];
    for (let i = 0; i < lines.length; i++) {
      try {
        entries.push(JSON.parse(lines[i]));
      } catch {
        process.stderr.write(`[reclassify] WARNING: malformed JSONL at line ${i + 1} — skipping\n`);
      }
    }
    return entries;
  } catch (err) {
    throw new Error(`Failed to read routes file: ${sanitizeError(err)}`);
  }
}

function reclassifyEntry(entry) {
  const route = entry.route;
  const layer = ENFORCEMENT_LAYER_MAP[route];

  if (!layer) {
    // Unknown route type — leave untouched, report warning
    process.stderr.write(
      `[reclassify] WARNING: unknown route type "${route}" on entry ${entry.id} — skipping\n`
    );
    return { entry, changed: false };
  }

  // Deterministic routes (verified-pattern, lint-rule) — only add layer tag if missing
  if (layer === "deterministic") {
    if (entry.enforcement_layer === "deterministic") {
      return { entry, changed: false };
    }
    const updated = { ...entry, enforcement_layer: "deterministic" };
    return { entry: updated, changed: true };
  }

  // Behavioral routes (hook-gate, claude-md-annotation) — change status + add tags
  const isBehavioral = BEHAVIORAL_ROUTES.has(route);
  const needsStatusChange = isBehavioral && entry.status === "refined";
  const needsLayerTag = entry.enforcement_layer !== layer;

  if (!needsStatusChange && !needsLayerTag) {
    return { entry, changed: false };
  }

  const updated = { ...entry };
  updated.enforcement_layer = layer;

  if (needsStatusChange) {
    updated.status = "behavioral-acknowledged";
    updated._reclassified = RECLASSIFY_DATE;
    updated._reclassification_reason = RECLASSIFICATION_REASON[route];
  }

  return { entry: updated, changed: true };
}

function writeRoutes(entries) {
  try {
    const content = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
    safeWriteFileSync(ROUTES_FILE, content, "utf8");
  } catch (err) {
    throw new Error(`Failed to write routes file: ${sanitizeError(err)}`);
  }
}

function main() {
  let entries;
  try {
    entries = readRoutes();
  } catch (err) {
    process.stderr.write(`[reclassify] ERROR: ${sanitizeError(err)}\n`);
    process.exit(1);
  }

  const total = entries.length;
  let changedCount = 0;
  const byLayer = { deterministic: 0, "semi-deterministic": 0, probabilistic: 0, unknown: 0 };

  const updated = entries.map((entry) => {
    const { entry: result, changed } = reclassifyEntry(entry);
    if (changed) changedCount++;

    const layer = result.enforcement_layer || "unknown";
    if (layer in byLayer) byLayer[layer]++;
    else byLayer.unknown++;

    return result;
  });

  try {
    writeRoutes(updated);
  } catch (err) {
    process.stderr.write(`[reclassify] ERROR: ${sanitizeError(err)}\n`);
    process.exit(1);
  }

  // Report
  process.stdout.write(`\nLearning Routes Reclassification — ${RECLASSIFY_DATE}\n`);
  process.stdout.write(`${"=".repeat(55)}\n`);
  process.stdout.write(`Total entries processed : ${total}\n`);
  process.stdout.write(`Entries changed         : ${changedCount}\n`);
  process.stdout.write(`Entries unchanged       : ${total - changedCount}\n`);
  process.stdout.write(`\nBy enforcement layer:\n`);
  process.stdout.write(`  deterministic        : ${byLayer.deterministic}\n`);
  process.stdout.write(`  semi-deterministic   : ${byLayer["semi-deterministic"]}\n`);
  process.stdout.write(`  probabilistic        : ${byLayer.probabilistic}\n`);
  if (byLayer.unknown > 0) {
    process.stdout.write(`  unknown (skipped)    : ${byLayer.unknown}\n`);
  }
  process.stdout.write(`\nFile written: ${ROUTES_FILE}\n\n`);
}

main();
