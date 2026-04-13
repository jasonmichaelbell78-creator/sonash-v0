#!/usr/bin/env node
/**
 * T29 Step 10.5 — Category E remediation
 *
 * Bulk-backfill missing extraction-journal entries with decision: "defer"
 * for the 9 candidates across 6 sources where value-map has candidates
 * the journal is missing.
 *
 * Appends to .research/extraction-journal.jsonl (atomic via temp + rename).
 * Uses analysis.json.id as source_analysis_id (UUIDs already migrated).
 *
 * Name matching across value-map <-> journal uses normalized prefix logic
 * since journal sometimes has fuller names than value-map (e.g.,
 * "FilterChain + Scorer composition" vs "FilterChain + Scorer").
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const ANALYSIS_DIR = path.join(ROOT, ".research", "analysis");
const JOURNAL_PATH = path.join(ROOT, ".research", "extraction-journal.jsonl");

const SOURCES = [
  "crawl4ai",
  "lux-video-downloader",
  "safishamsi-graphify",
  "sidbharath-com-blog-claude-code-the-complete-guide",
  "vikparuchuri-marker",
  "youtube-transcript-api",
  // E-extend (surfaced by expanded self-audit check 6a, Session #277):
  "archivebox-archivebox",
  "public-apis_public-apis",
];

const TYPE_REMAP = {
  "implementation-pattern": "pattern",
  antiPattern: "anti-pattern",
};

function normalizeKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function tokens(s) {
  return new Set(
    String(s || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 0)
  );
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function matches(aRaw, bRaw) {
  const aNorm = normalizeKey(aRaw);
  const bNorm = normalizeKey(bRaw);
  if (aNorm === bNorm) return true;
  const short = aNorm.length < bNorm.length ? aNorm : bNorm;
  const long = aNorm.length < bNorm.length ? bNorm : aNorm;
  if (short.length >= 10 && long.startsWith(short)) return true;
  if (aNorm.length >= 12 && bNorm.length >= 12 && aNorm.slice(0, 12) === bNorm.slice(0, 12))
    return true;
  // Token-based Jaccard for paraphrased names
  if (jaccard(tokens(aRaw), tokens(bRaw)) >= 0.6) return true;
  return false;
}

function collectValueMapCandidates(vm) {
  const out = [];
  if (Array.isArray(vm.candidates)) {
    for (const c of vm.candidates) {
      out.push({ ...c });
    }
    return out;
  }
  const splitKeyToType = {
    patternCandidates: "pattern",
    knowledgeCandidates: "knowledge",
    contentCandidates: "content",
    antiPatternCandidates: "anti-pattern",
  };
  for (const [k, inferredType] of Object.entries(splitKeyToType)) {
    const arr = vm[k];
    if (!Array.isArray(arr)) continue;
    for (const entry of arr) {
      out.push({ ...entry, type: entry.type || inferredType });
    }
  }
  return out;
}

function normalizeEffort(e) {
  if (!e) return "E1";
  const s = String(e).trim();
  if (/^E[0-3]$/.test(s)) return s;
  const lo = s.toLowerCase();
  if (lo === "low") return "E0";
  if (lo === "medium") return "E1";
  if (lo === "high") return "E2";
  return "E1";
}

function normalizeConfidenceToNovelty(c) {
  if (!c) return "medium";
  const lo = String(c).toLowerCase();
  if (lo === "high" || lo === "medium" || lo === "low") return lo;
  return "medium";
}

function tierToRelevance(t) {
  const s = String(t || "").toLowerCase();
  if (s === "t1" || s === "1") return "high";
  if (s === "t2" || s === "2") return "medium";
  if (s === "t3" || s === "3") return "low";
  return "medium";
}

function normalizeType(t) {
  const raw = String(t || "pattern").trim();
  return TYPE_REMAP[raw] || raw;
}

function buildJournalEntry({ source, source_type, source_analysis_id, candidate }) {
  const name = candidate.name || candidate.title || "(untitled)";
  const description = candidate.description || candidate.extraction_action || "";
  const notes = `Backfilled by T29 Step 10.5 Cat E (decision: defer). ${description}`.trim();
  const novelty = candidate.novelty
    ? String(candidate.novelty).toLowerCase()
    : normalizeConfidenceToNovelty(candidate.confidence);
  const effort = normalizeEffort(candidate.effort);
  const relevance = candidate.relevance
    ? String(candidate.relevance).toLowerCase()
    : candidate.tier
      ? tierToRelevance(candidate.tier)
      : "medium";
  const tags = Array.isArray(candidate.tags) ? candidate.tags : [];
  return {
    schema_version: "2.0",
    source_type,
    source,
    source_analysis_id,
    candidate: name,
    type: normalizeType(candidate.type),
    decision: "defer",
    decision_date: new Date().toISOString().slice(0, 10),
    extracted_to: null,
    extracted_at: null,
    notes,
    novelty: ["high", "medium", "low"].includes(novelty) ? novelty : "medium",
    effort,
    relevance: ["high", "medium", "low"].includes(relevance) ? relevance : "medium",
    tags,
  };
}

function atomicAppendJsonl(filePath, newLines) {
  const current = fs.readFileSync(filePath, "utf8");
  const addition = newLines.map((l) => JSON.stringify(l)).join("\n") + "\n";
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, current + (current.endsWith("\n") ? "" : "\n") + addition, "utf8");
  fs.renameSync(tmp, filePath);
}

function main() {
  console.log("T29 Step 10.5 — Cat E: bulk journal backfill (decision: defer)\n");

  const journalRaw = fs.readFileSync(JOURNAL_PATH, "utf8");
  const journalEntries = journalRaw.split("\n").filter(Boolean).map(JSON.parse);

  const allNewEntries = [];
  for (const slug of SOURCES) {
    const analysisPath = path.join(ANALYSIS_DIR, slug, "analysis.json");
    const vmPath = path.join(ANALYSIS_DIR, slug, "value-map.json");
    const a = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
    const vm = JSON.parse(fs.readFileSync(vmPath, "utf8"));

    const source = a.source;
    const source_type = a.source_type;
    const source_analysis_id = a.id;

    const vmCandidates = collectValueMapCandidates(vm);
    const existingNames = journalEntries.filter((e) => e.source === source).map((e) => e.candidate);

    const missing = [];
    for (const vc of vmCandidates) {
      const vname = vc.name || vc.title || "(untitled)";
      const found = existingNames.find((x) => matches(x, vname));
      if (!found) missing.push(vc);
    }

    console.log(
      `${slug}: value-map=${vmCandidates.length} journal=${existingNames.length} missing=${missing.length}`
    );
    for (const m of missing) {
      const entry = buildJournalEntry({ source, source_type, source_analysis_id, candidate: m });
      allNewEntries.push(entry);
      console.log(`  + defer: ${entry.candidate} [${entry.type}]`);
    }
  }

  if (allNewEntries.length === 0) {
    console.log("\nNothing to backfill.");
    return;
  }

  // Validate all entries against Zod before writing
  const { validate } = require("../../lib/analysis-schema.js");
  for (const e of allNewEntries) {
    const r = validate(e, "extraction");
    if (!r.success) {
      console.log(`\nVALIDATION FAIL for ${e.candidate}: ${r.error}`);
      console.log(JSON.stringify(e, null, 2));
      process.exit(1);
    }
  }

  atomicAppendJsonl(JOURNAL_PATH, allNewEntries);
  console.log(`\nAppended ${allNewEntries.length} entries to ${path.relative(ROOT, JOURNAL_PATH)}`);
}

main();
