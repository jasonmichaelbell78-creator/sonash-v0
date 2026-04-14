#!/usr/bin/env node
/**
 * Wave 5 merge script: aggregate slice-1..4 outputs into a single
 * consolidated data model for inline synthesis by the parent.
 *
 * Produces: .planning/synthesis-wave5-agents/MERGED.json
 *   - candidates (deduped by name, with convergence source list)
 *   - themes (clustered by name similarity, with convergence)
 *   - absence_signals (deduped)
 *   - notes (flattened)
 *   - by_source_tier weights applied
 */

"use strict";

const fs = require("fs");
const path = require("path");

const BASE = ".planning/synthesis-wave5-agents";
const SRC = path.join(BASE, "SOURCES.json");

function normKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function tokens(s) {
  return new Set(
    String(s || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 3)
  );
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function findSimilar(list, nameKey, tokenSet, threshold = 0.5) {
  for (const e of list) {
    if (e.normKey === nameKey) return e;
    const j = jaccard(e.tokens, tokenSet);
    if (j >= threshold) return e;
  }
  return null;
}

const sources = JSON.parse(fs.readFileSync(SRC, "utf8"));
const sourceMap = Object.fromEntries(sources.map((s) => [s.slug, s]));

// Load all 4 slices
const slices = [];
for (let i = 1; i <= 4; i++) {
  const p = path.join(BASE, `slice-${i}-output.json`);
  slices.push(JSON.parse(fs.readFileSync(p, "utf8")));
}

// --- Candidates dedup ---
// Group by normalized name. Keep all source attributions. Apply convergence boost.
const candidateIndex = []; // [{normKey, tokens, name, type, description, sources: [{slug, novelty, effort, relevance, tags}], convergence}]
for (const slice of slices) {
  for (const [slug, data] of Object.entries(slice.per_source || {})) {
    for (const c of data.raw_candidates || []) {
      const key = normKey(c.name);
      const toks = tokens(c.name);
      let hit = findSimilar(candidateIndex, key, toks, 0.55);
      if (!hit) {
        hit = {
          normKey: key,
          tokens: toks,
          name: c.name,
          type: c.type || "knowledge",
          description: c.description || "",
          sources: [],
        };
        candidateIndex.push(hit);
      }
      hit.sources.push({
        slug,
        source_type: sourceMap[slug]?.source_type,
        tier: sourceMap[slug]?.source_tier,
        novelty: c.novelty,
        effort: c.effort,
        relevance: c.relevance,
        tags: c.tags || [],
        original_name: c.name,
      });
    }
  }
}
// Compute convergence (tier-weighted unique source count)
const TIER_WEIGHT = { T1: 1.0, T2: 0.8, T3: 0.5, T4: 0.25 };
for (const c of candidateIndex) {
  const uniqSlugs = new Set(c.sources.map((s) => s.slug));
  c.source_count = uniqSlugs.size;
  c.weighted = c.sources.reduce((sum, s) => sum + (TIER_WEIGHT[s.tier] || 0.8), 0);
  // Aggregate tags
  const tagSet = new Set();
  c.sources.forEach((s) => (s.tags || []).forEach((t) => tagSet.add(t)));
  c.tags = [...tagSet];
}
candidateIndex.sort((a, b) => b.weighted - a.weighted);

// --- Themes cluster ---
// Start with agent-provided initial_clusters (within-slice), then merge across slices
const themeIndex = []; // [{normKey, tokens, name, sources: [{slug, evidence_quote, strength}]}]
for (const slice of slices) {
  // Per-source raw_themes first
  for (const [slug, data] of Object.entries(slice.per_source || {})) {
    for (const t of data.raw_themes || []) {
      const key = normKey(t.name);
      const toks = tokens(t.name);
      let hit = findSimilar(themeIndex, key, toks, 0.45);
      if (!hit) {
        hit = {
          normKey: key,
          tokens: toks,
          name: t.name,
          descs: [],
          evidence: [],
          source_slugs: new Set(),
        };
        themeIndex.push(hit);
      }
      hit.source_slugs.add(slug);
      if (t.short_desc) hit.descs.push(t.short_desc);
      if (t.evidence_quote)
        hit.evidence.push({
          slug,
          quote: t.evidence_quote,
          strength: t.strength_signal || "medium",
        });
    }
  }
}
// Materialize convergence
for (const t of themeIndex) {
  const uniq = [...t.source_slugs];
  const types = new Set(uniq.map((s) => sourceMap[s]?.source_type));
  t.source_count = uniq.length;
  t.source_types = [...types];
  t.sources = uniq;
  t.confidence = t.source_count >= 5 ? "strong" : t.source_count >= 3 ? "medium" : "weak";
  // Choose a representative description: first non-empty
  t.description = t.descs.find((d) => d && d.length > 0) || "";
  delete t.source_slugs;
  delete t.descs;
  delete t.tokens;
  delete t.normKey;
}
themeIndex.sort((a, b) => b.source_count - a.source_count);

// --- Absence signals dedup ---
const absenceIndex = [];
for (const slice of slices) {
  for (const a of slice.absence_signals || []) {
    const key = normKey(a.domain);
    const toks = tokens(a.domain);
    let hit = findSimilar(absenceIndex, key, toks, 0.5);
    if (!hit) {
      hit = {
        normKey: key,
        tokens: toks,
        domain: a.domain,
        reasons: [],
        suggestions: [],
      };
      absenceIndex.push(hit);
    }
    if (a.expected_because) hit.reasons.push(a.expected_because);
    if (a.suggestion) hit.suggestions.push(a.suggestion);
  }
}
for (const a of absenceIndex) {
  a.reasons = [...new Set(a.reasons)];
  a.suggestions = [...new Set(a.suggestions)];
  delete a.tokens;
  delete a.normKey;
}

// --- Notes flatten ---
const notes = [];
slices.forEach((s, i) => (s.notes || []).forEach((n) => notes.push({ slice: i + 1, note: n })));

// --- Write merged output ---
const merged = {
  generated_at: new Date().toISOString(),
  source_count: sources.length,
  totals: {
    raw_themes: slices.reduce(
      (sum, s) =>
        sum +
        Object.values(s.per_source || {}).reduce((m, d) => m + (d.raw_themes || []).length, 0),
      0
    ),
    raw_candidates: slices.reduce(
      (sum, s) =>
        sum +
        Object.values(s.per_source || {}).reduce((m, d) => m + (d.raw_candidates || []).length, 0),
      0
    ),
    unique_themes: themeIndex.length,
    unique_candidates: candidateIndex.length,
  },
  themes: themeIndex.map((t) => ({
    name: t.name,
    description: t.description,
    source_count: t.source_count,
    sources: t.sources,
    source_types: t.source_types,
    confidence: t.confidence,
    evidence: t.evidence.slice(0, 5),
  })),
  candidates: candidateIndex.map((c) => ({
    name: c.name,
    type: c.type,
    description: c.description,
    source_count: c.source_count,
    sources: c.sources,
    weighted: Number(c.weighted.toFixed(3)),
    tags: c.tags,
  })),
  absence_signals: absenceIndex,
  notes,
};

const out = path.join(BASE, "MERGED.json");
const tmp = out + ".tmp";
fs.writeFileSync(tmp, JSON.stringify(merged, null, 2) + "\n");
fs.renameSync(tmp, out);
console.log(`Wrote ${out}`);
console.log(`  raw_themes=${merged.totals.raw_themes} -> unique=${merged.totals.unique_themes}`);
console.log(
  `  raw_candidates=${merged.totals.raw_candidates} -> unique=${merged.totals.unique_candidates}`
);
console.log(`  absence_signals=${merged.absence_signals.length}`);
console.log(`  notes=${merged.notes.length}`);
console.log("\nTop 10 themes by source_count:");
merged.themes
  .slice(0, 10)
  .forEach((t) => console.log(`  ${t.source_count}x [${t.confidence}] ${t.name}`));
console.log("\nTop 10 candidates by weighted convergence:");
merged.candidates
  .slice(0, 10)
  .forEach((c) =>
    console.log(`  ${c.weighted.toFixed(2)} (${c.source_count}x) ${c.name} [${c.type}]`)
  );
