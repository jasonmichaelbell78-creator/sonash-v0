#!/usr/bin/env node
/**
 * T29 Step 10.5 — Category J+K+L remediation (unenumerated drifts)
 *
 * Unblocked by Cat C UUID fix which surfaced root-level Zod failures.
 *
 * J — Normalize absence_patterns (5 repo sources): no data patch needed;
 *      schema relaxed in scripts/lib/analysis-schema.js to accept string OR
 *      {pattern, confidence, evidence} object. Script just audits.
 *
 * K — Map gist/website candidate shape → unified candidateSchema (5 sources):
 *      {id, title, type, confidence, effort, personal_fit, extraction_action,
 *       finding_refs, description}
 *      → {name, type, description, novelty, effort, relevance, tags, finding_refs}
 *      Mapping:
 *        title                → name
 *        confidence HIGH/MED/LOW (uppercase) → novelty high/medium/low
 *        personal_fit number  → relevance band: >=70 high, 40-69 medium, <40 low
 *        implementation-pattern → pattern (not in enum)
 *        extraction_action    → appended to description (don't lose the signal)
 *        finding_refs         → preserved
 *        id                   → dropped (not in unified schema)
 *
 * L — Backfill description on 3 repo sources whose value-map uses split
 *      categories (patternCandidates/knowledgeCandidates/contentCandidates/
 *      antiPatternCandidates). Match analysis.json candidates by name, copy
 *      description from the matching split entry.
 *
 * Idempotent. Atomic writes.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const ANALYSIS_DIR = path.join(ROOT, ".research", "analysis");

const K_SOURCES = [
  "docs-composio-dev",
  "farzaa-gist-c35ac0cf",
  "karpathy-gist-442a6bf",
  "kieranklaassen-gist-4f2aba89",
  "maharshi-pandya-gist-4aeccbe1",
];

const L_SOURCES = ["crawl4ai", "vikparuchuri-marker", "zedeus-nitter"];

const TYPE_REMAP = {
  "implementation-pattern": "pattern",
};

function atomicWriteJson(filePath, obj) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, filePath);
}

function confidenceToNovelty(c) {
  if (!c) return "medium";
  const s = String(c).toLowerCase();
  if (s === "high" || s === "medium" || s === "low") return s;
  return "medium";
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

function personalFitToRelevance(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "medium";
  if (v >= 70) return "high";
  if (v >= 40) return "medium";
  return "low";
}

function mapGistCandidate(c) {
  const rawType = c.type || "knowledge";
  const type = TYPE_REMAP[rawType] || rawType;
  const description = c.extraction_action
    ? `${c.description}\n\nExtraction action: ${c.extraction_action}`
    : c.description || "";
  const mapped = {
    name: c.title || c.name || "(untitled)",
    type,
    description,
    novelty: confidenceToNovelty(c.confidence),
    effort: normalizeEffort(c.effort),
    relevance: personalFitToRelevance(c.personal_fit),
    tags: Array.isArray(c.tags) ? c.tags : [],
  };
  if (Array.isArray(c.finding_refs) && c.finding_refs.length > 0) {
    mapped.finding_refs = c.finding_refs;
  }
  return mapped;
}

function mapKSource(slug) {
  const p = path.join(ANALYSIS_DIR, slug, "analysis.json");
  const a = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!Array.isArray(a.candidates) || a.candidates.length === 0) {
    return { slug, status: "SKIP", reason: "no candidates" };
  }
  // Detect: if already mapped, first candidate has `name` not `title`
  const first = a.candidates[0];
  if (first.name && !first.title) {
    return { slug, status: "SKIP", reason: "already mapped (has name)" };
  }
  const before = a.candidates.length;
  a.candidates = a.candidates.map(mapGistCandidate);
  atomicWriteJson(p, a);
  return { slug, status: "OK", count: before };
}

function normalizeKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function backfillDescriptionLSource(slug) {
  const dir = path.join(ANALYSIS_DIR, slug);
  const a = JSON.parse(fs.readFileSync(path.join(dir, "analysis.json"), "utf8"));
  const vm = JSON.parse(fs.readFileSync(path.join(dir, "value-map.json"), "utf8"));

  const splitKeys = [
    "patternCandidates",
    "knowledgeCandidates",
    "contentCandidates",
    "antiPatternCandidates",
  ];
  const vmEntries = [];
  for (const k of splitKeys) {
    const arr = vm[k];
    if (!Array.isArray(arr)) continue;
    for (const entry of arr) {
      if (entry.name && entry.description) {
        vmEntries.push({
          name: entry.name,
          norm: normalizeKey(entry.name),
          desc: entry.description,
        });
      }
    }
  }

  function findMatch(aName) {
    const aNorm = normalizeKey(aName);
    // 1. Exact normalized match
    let best = vmEntries.find((e) => e.norm === aNorm);
    if (best) return best;
    // 2. Prefix match: one starts with the other, with min overlap 10 chars
    best = vmEntries.find((e) => {
      const short = aNorm.length < e.norm.length ? aNorm : e.norm;
      const long = aNorm.length < e.norm.length ? e.norm : aNorm;
      return short.length >= 10 && long.startsWith(short);
    });
    if (best) return best;
    // 3. Shared first 12 normalized chars
    if (aNorm.length >= 12) {
      best = vmEntries.find(
        (e) => e.norm.length >= 12 && e.norm.slice(0, 12) === aNorm.slice(0, 12)
      );
      if (best) return best;
    }
    return null;
  }

  let patched = 0;
  let already = 0;
  let missing = 0;
  const missingNames = [];
  for (const c of a.candidates) {
    if (c.description && c.description.length > 0) {
      already++;
      continue;
    }
    const m = findMatch(c.name);
    if (m) {
      c.description = m.desc;
      patched++;
    } else {
      c.description = ""; // schema requires string; empty string satisfies Zod
      missing++;
      missingNames.push(c.name);
    }
  }
  atomicWriteJson(path.join(dir, "analysis.json"), a);
  return { slug, patched, already, missing, missingNames };
}

function auditJ() {
  // Audit-only — schema relaxation makes these pass; report for the log
  const J_SOURCES = [
    "archivebox-archivebox",
    "crawl4ai",
    "lux-video-downloader",
    "vikparuchuri-marker",
    "zedeus-nitter",
  ];
  const out = [];
  for (const slug of J_SOURCES) {
    const a = JSON.parse(fs.readFileSync(path.join(ANALYSIS_DIR, slug, "analysis.json"), "utf8"));
    const ap = a.absence_patterns || [];
    const shapes = new Set(ap.map((x) => (typeof x === "string" ? "string" : "object")));
    out.push(`  ${slug}: ${ap.length} entries, shapes=[${[...shapes].join(",")}]`);
  }
  return out;
}

function main() {
  console.log("T29 Step 10.5 — Cat J+K+L: schema drift remediation\n");

  console.log("== J: absence_patterns shape audit (schema-relaxed, no data patch) ==");
  auditJ().forEach((l) => console.log(l));

  console.log("\n== K: Map gist/website candidates → unified shape ==");
  for (const slug of K_SOURCES) {
    try {
      const r = mapKSource(slug);
      if (r.status === "SKIP") console.log(`  ${slug}: SKIP — ${r.reason}`);
      else console.log(`  ${slug}: OK — ${r.count} candidates mapped`);
    } catch (e) {
      console.log(`  ${slug}: ERROR — ${e.message}`);
    }
  }

  // Always-run post-pass: normalize effort on K sources (idempotent)
  console.log("\n== K-post: Normalize candidate.effort to E0-E3 enum ==");
  for (const slug of K_SOURCES) {
    try {
      const p = path.join(ANALYSIS_DIR, slug, "analysis.json");
      const a = JSON.parse(fs.readFileSync(p, "utf8"));
      let changed = 0;
      for (const c of a.candidates || []) {
        const before = c.effort;
        c.effort = normalizeEffort(c.effort);
        if (c.effort !== before) changed++;
      }
      if (changed > 0) atomicWriteJson(p, a);
      console.log(`  ${slug}: effort normalized on ${changed} candidate(s)`);
    } catch (e) {
      console.log(`  ${slug}: ERROR — ${e.message}`);
    }
  }

  console.log("\n== L: Backfill candidate description from split value-map ==");
  for (const slug of L_SOURCES) {
    try {
      const r = backfillDescriptionLSource(slug);
      console.log(
        `  ${slug}: patched=${r.patched} already=${r.already} missing=${r.missing}` +
          (r.missing > 0 ? ` [${r.missingNames.join(" | ")}]` : "")
      );
    } catch (e) {
      console.log(`  ${slug}: ERROR — ${e.message}`);
    }
  }

  console.log("\nDone.");
}

main();
