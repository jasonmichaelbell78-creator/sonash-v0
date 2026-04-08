#!/usr/bin/env node
/* global __dirname */
/**
 * sync-warnings-ack.js — Sync lastCleared with per-type acknowledgments
 *
 * The statusline reads lastCleared to count unacked warnings.
 * Session-begin and /alerts write per-type acks to acknowledged[type].
 * This script checks: if every current warning type has a per-type ack,
 * bump lastCleared to now so the statusline reflects the true state.
 *
 * Usage: node scripts/sync-warnings-ack.js
 * Safe to run multiple times — idempotent.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const JSONL_PATH = path.join(ROOT, ".claude", "state", "hook-warnings-log.jsonl");
const ACK_PATH = path.join(ROOT, ".claude", "state", "hook-warnings-ack.json");

// Read ack state
let ack;
try {
  ack = JSON.parse(fs.readFileSync(ACK_PATH, "utf8"));
} catch {
  console.log("No ack file — nothing to sync");
  process.exit(0);
}

if (!ack.acknowledged || typeof ack.acknowledged !== "object") {
  console.log("No acknowledged entries — nothing to sync");
  process.exit(0);
}

// Read JSONL entries
let lines;
try {
  lines = fs.readFileSync(JSONL_PATH, "utf8").trim().split("\n").filter(Boolean);
} catch {
  console.log("No warnings log — nothing to sync");
  process.exit(0);
}

// Find unresolved, unacked-by-lastCleared entries
const lastCleared = ack.lastCleared ? new Date(ack.lastCleared).getTime() : 0;
const acknowledged = ack.acknowledged;

const unresolvedTypes = new Set();
let allTypesAcked = true;

for (const line of lines) {
  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    continue;
  }

  // Skip resolved
  if (entry.resolved) continue;

  const entryTime = new Date(entry.timestamp).getTime();

  // Skip entries already covered by lastCleared
  if (entryTime <= lastCleared) continue;

  // This entry is after lastCleared — check if its type has a per-type ack
  const type = entry.type;
  if (!type) continue;

  unresolvedTypes.add(type);

  const typeAckTime = acknowledged[type] ? new Date(acknowledged[type]).getTime() : 0;
  if (entryTime > typeAckTime) {
    allTypesAcked = false;
  }
}

if (unresolvedTypes.size === 0) {
  console.log("No unresolved warnings after lastCleared — already synced");
  process.exit(0);
}

if (!allTypesAcked) {
  const unacked = [];
  for (const type of unresolvedTypes) {
    const typeAckTime = acknowledged[type] ? new Date(acknowledged[type]).getTime() : 0;
    // Check if any entry of this type is after the type ack
    const hasUnacked = lines.some((line) => {
      try {
        const e = JSON.parse(line);
        if (e.resolved || e.type !== type) return false;
        const t = new Date(e.timestamp).getTime();
        return t > lastCleared && t > typeAckTime;
      } catch {
        return false;
      }
    });
    if (hasUnacked) unacked.push(type);
  }
  console.log(
    "Not all types acknowledged — " +
      unacked.length +
      " type(s) still unacked: " +
      unacked.join(", ")
  );
  process.exit(0);
}

// All types are per-type acked — bump lastCleared
const now = new Date().toISOString();
ack.lastCleared = now;
fs.writeFileSync(ACK_PATH, JSON.stringify(ack, null, 2) + "\n");
console.log(
  "Synced lastCleared to " + now + " (" + unresolvedTypes.size + " type(s) all acknowledged)"
);
