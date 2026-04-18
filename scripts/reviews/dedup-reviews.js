#!/usr/bin/env node
/* global __dirname */
"use strict";

/**
 * dedup-reviews.js — resolve duplicate IDs in .claude/state/reviews.jsonl.
 *
 * Three resolution strategies (detected automatically per duplicate group):
 *
 *   1. True duplicate — identical title/pr/source/total/fixed/rejected.
 *      Keep the record with more learnings/patterns; drop the rest.
 *
 *   2. Progressive update — same title/pr but differing metrics.
 *      Keep the record with max(fixed + total); drop the rest.
 *
 *   3. Namespace collision — different title/source. Keep the older/original
 *      record; re-key the other (typically date:"unknown" or source:"manual")
 *      to the next available `rev-N` ID.
 *
 * Also backfills missing `title` on rev-94 (known good record from pre-scan).
 *
 * Safety: writes reviews.jsonl.bak before modifying; atomic rename via .tmp.
 * Idempotent: a second run on already-deduped data is a no-op.
 *
 * Usage:
 *   node scripts/reviews/dedup-reviews.js            # apply
 *   node scripts/reviews/dedup-reviews.js --dry-run  # preview only
 */

const fs = require("node:fs");
const path = require("node:path");
const { safeParseLine } = require("../lib/parse-jsonl-line.js");
const { sanitizeError } = require("../lib/sanitize-error.js");
const { safeAtomicWriteSync } = require("../lib/safe-fs.js");
const { refuseSymlinkWithParents } = require("../lib/security-helpers.js");

const DRY_RUN = process.argv.includes("--dry-run");
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const REVIEWS_PATH = path.join(PROJECT_ROOT, ".claude", "state", "reviews.jsonl");
const BACKUP_PATH = `${REVIEWS_PATH}.bak`;

function loadReviews() {
  let raw;
  try {
    raw = fs.readFileSync(REVIEWS_PATH, "utf8");
  } catch (err) {
    console.error(`[dedup] Failed to read ${REVIEWS_PATH}: ${sanitizeError(err)}`);
    process.exit(1);
  }
  const lines = raw.split(/\r?\n/);
  const records = [];
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const parsed = safeParseLine(trimmed);
    if (parsed && typeof parsed === "object") {
      records.push({ lineIndex: i, record: parsed });
    } else {
      console.warn(`[dedup] Skipping malformed line ${i + 1}`);
    }
  });
  return records;
}

function groupById(entries) {
  const byId = new Map();
  for (const entry of entries) {
    const id = String(entry.record.id);
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push(entry);
  }
  return byId;
}

function contentSignature(r) {
  return JSON.stringify({
    title: r.title || "",
    pr: r.pr ?? null,
    source: r.source || "",
    total: r.total ?? 0,
    fixed: r.fixed ?? 0,
    rejected: r.rejected ?? 0,
    deferred: r.deferred ?? 0,
  });
}

function weight(r) {
  const learnings = Array.isArray(r.learnings) ? r.learnings.length : 0;
  const patterns = Array.isArray(r.patterns) ? r.patterns.length : 0;
  const metrics = (r.fixed ?? 0) + (r.total ?? 0);
  return { learnings, patterns, metrics };
}

function pickKeeper(group, strategy) {
  if (strategy === "true-duplicate") {
    return group.slice().sort((a, b) => {
      const wa = weight(a.record);
      const wb = weight(b.record);
      return wb.learnings - wa.learnings || wb.patterns - wa.patterns || a.lineIndex - b.lineIndex;
    })[0];
  }
  if (strategy === "progressive-update") {
    return group.slice().sort((a, b) => {
      const wa = weight(a.record);
      const wb = weight(b.record);
      return wb.metrics - wa.metrics || b.lineIndex - a.lineIndex;
    })[0];
  }
  // namespace-collision: keep older / has-real-date
  return group.slice().sort((a, b) => {
    const aDate = a.record.date && a.record.date !== "unknown" ? 0 : 1;
    const bDate = b.record.date && b.record.date !== "unknown" ? 0 : 1;
    return aDate - bDate || a.lineIndex - b.lineIndex;
  })[0];
}

function classifyGroup(group) {
  if (group.length < 2) return { strategy: "none" };
  const sigs = new Set(group.map((e) => contentSignature(e.record)));
  if (sigs.size === 1) return { strategy: "true-duplicate" };

  const titles = new Set(group.map((e) => (e.record.title || "").trim()));
  const prs = new Set(group.map((e) => e.record.pr ?? null));
  if (titles.size === 1 && prs.size === 1) {
    return { strategy: "progressive-update" };
  }
  return { strategy: "namespace-collision" };
}

function nextRevId(records, used) {
  let max = 0;
  for (const { record } of records) {
    const id = String(record.id);
    const m = /^rev-(\d+)$/.exec(id);
    if (m) max = Math.max(max, Number.parseInt(m[1], 10));
  }
  for (const id of used) {
    const m = /^rev-(\d+)$/.exec(id);
    if (m) max = Math.max(max, Number.parseInt(m[1], 10));
  }
  return `rev-${max + 1}`;
}

function backfillMissingTitle(record) {
  if (record.id !== "rev-94" || record.title) return false;
  const origin = record.origin || {};
  const pr = origin.pr || record.pr;
  const round = origin.round ? ` R${origin.round}` : "";
  const tool = origin.tool || record.source || "";
  const toolLabel = tool
    .split(/[+-]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      const map = {
        sonarcloud: "SonarCloud",
        qodo: "Qodo",
        gemini: "Gemini",
        ci: "CI",
        coderabbit: "CodeRabbit",
        manual: "Manual",
      };
      return map[t.toLowerCase()] || t;
    })
    .join(" + ");
  record.title = `PR #${pr}${round} — ${toolLabel}`;
  return true;
}

// Produce re-key and drop actions for a single group. Returns the list of
// action entries so caller can update toDrop/toRekey Sets in place.
function actionsForGroup(id, group, keeper, strategy, entries, usedNewIds, toDrop, toRekey) {
  const out = [];
  for (const entry of group) {
    if (entry === keeper) continue;
    if (strategy === "namespace-collision") {
      const newId = nextRevId(entries, usedNewIds);
      usedNewIds.add(newId);
      toRekey.set(entry.lineIndex, newId);
      out.push({
        kind: "rekey",
        oldId: id,
        newId,
        lineIndex: entry.lineIndex,
        title: entry.record.title,
      });
    } else {
      toDrop.add(entry.lineIndex);
      out.push({
        kind: "drop",
        strategy,
        id,
        lineIndex: entry.lineIndex,
        title: entry.record.title,
      });
    }
  }
  return out;
}

function computeEdits(byId, entries) {
  const toDrop = new Set();
  const toRekey = new Map();
  const usedNewIds = new Set();
  const actions = [];
  for (const [id, group] of byId) {
    if (group.length < 2) continue;
    const { strategy } = classifyGroup(group);
    const keeper = pickKeeper(group, strategy);
    actions.push(
      ...actionsForGroup(id, group, keeper, strategy, entries, usedNewIds, toDrop, toRekey)
    );
  }
  return { toDrop, toRekey, actions };
}

function findTitleBackfill(entries) {
  for (const entry of entries) {
    if (backfillMissingTitle(entry.record)) {
      return { id: entry.record.id, title: entry.record.title };
    }
  }
  return null;
}

function printDedupReport(entries, byId, toDrop, toRekey, actions, titleBackfilled) {
  console.log(`[dedup] Loaded ${entries.length} records, ${byId.size} unique IDs`);
  console.log(
    `[dedup] Actions: ${toDrop.size} drop, ${toRekey.size} re-key, ${titleBackfilled ? 1 : 0} title backfill`
  );
  for (const a of actions) {
    if (a.kind === "rekey") {
      console.log(`  re-key id=${a.oldId} -> ${a.newId} (${a.title || "(no title)"})`);
    } else {
      console.log(`  drop   id=${a.id} (${a.strategy}) line=${a.lineIndex + 1}`);
    }
  }
  if (titleBackfilled) {
    console.log(`  title  id=${titleBackfilled.id} -> "${titleBackfilled.title}"`);
  }
}

function writeBackup() {
  // Qodo Security R1 #14: reject symlinks at source and destination (defense-
  // in-depth, consistent with safeAtomicWriteSync guard below).
  refuseSymlinkWithParents(REVIEWS_PATH);
  refuseSymlinkWithParents(BACKUP_PATH);
  fs.copyFileSync(REVIEWS_PATH, BACKUP_PATH);
  console.log(`[dedup] Backup: ${BACKUP_PATH}`);
}

function serializeEntries(entries, toDrop, toRekey) {
  const outLines = [];
  for (const entry of entries) {
    if (toDrop.has(entry.lineIndex)) continue;
    if (toRekey.has(entry.lineIndex)) entry.record.id = toRekey.get(entry.lineIndex);
    outLines.push(JSON.stringify(entry.record));
  }
  return outLines;
}

function main() {
  const entries = loadReviews();
  const byId = groupById(entries);

  const { toDrop, toRekey, actions } = computeEdits(byId, entries);
  const titleBackfilled = findTitleBackfill(entries);

  printDedupReport(entries, byId, toDrop, toRekey, actions, titleBackfilled);

  if (DRY_RUN) {
    console.log("[dedup] --dry-run: no changes written");
    return;
  }
  if (toDrop.size === 0 && toRekey.size === 0 && !titleBackfilled) {
    console.log("[dedup] No changes needed (idempotent). Exiting without touching file.");
    return;
  }

  try {
    writeBackup();
  } catch (err) {
    console.error(`[dedup] Failed to create backup: ${sanitizeError(err)}`);
    process.exit(1);
  }

  const outLines = serializeEntries(entries, toDrop, toRekey);

  try {
    safeAtomicWriteSync(REVIEWS_PATH, outLines.join("\n") + "\n", { encoding: "utf8" });
  } catch (err) {
    console.error(`[dedup] Failed to write output: ${sanitizeError(err)}`);
    console.error(`[dedup] Backup preserved at ${BACKUP_PATH}`);
    process.exit(1);
  }

  console.log(`[dedup] Wrote ${outLines.length} records to ${REVIEWS_PATH}`);
  console.log(`[dedup] Next: npm run reviews:render && npm run reviews:check-archive`);
}

main();
