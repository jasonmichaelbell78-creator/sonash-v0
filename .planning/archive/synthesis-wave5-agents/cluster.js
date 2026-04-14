#!/usr/bin/env node
/**
 * Wave 5 meta-theme clustering.
 *
 * Takes MERGED.json (196 raw themes, mostly singleton because agents named
 * their themes specifically) and groups them into META-THEMES using
 * keyword-topic buckets. Writes META_THEMES.json.
 *
 * Also groups candidates by topic for the Fit Portfolio section.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const BASE = ".planning/synthesis-wave5-agents";
const merged = JSON.parse(fs.readFileSync(path.join(BASE, "MERGED.json"), "utf8"));
const sources = JSON.parse(fs.readFileSync(path.join(BASE, "SOURCES.json"), "utf8"));
const sourceMap = Object.fromEntries(sources.map((s) => [s.slug, s]));

// Meta-theme definitions: name, match_patterns (regex on theme.name+description)
const META_THEMES = [
  {
    id: "mcp-surface",
    name: "MCP as a first-class integration surface",
    match: /\bmcp\b/i,
  },
  {
    id: "meta-tools",
    name: "Meta-tool / dynamic tool discovery over static tool registries",
    match: /\bmeta[- ]?tool|dynamic.*discover|tool.*discover|search.*tool|discovery.*tool/i,
  },
  {
    id: "plugin-hook-governance",
    name: "Plugin systems & hook/lifecycle governance",
    match: /\bplugin|hook(?!s?\b.*\b(ai|up|into|for))|lifecycle|registry|pluggy|event[- ]?trigger/i,
  },
  {
    id: "extraction-pipelines",
    name: "Multi-stage extraction pipelines (fallback-based)",
    match:
      /\bextract|engine[- ]?fallback|fallback.*chain|multi.*format.*parse|caption[- ]?first|whisper[- ]?fallback/i,
  },
  {
    id: "claude-code-tooling",
    name: "Claude Code as a platform (skills, plugins, commands, CLAUDE.md)",
    match: /\bclaude[- ]code|claude\.md|skill.*md|plugin.*manifest|marketplace\.json|skills?\.sh/i,
  },
  {
    id: "cli-ergonomics",
    name: "CLI ergonomics and build-your-own patterns",
    match: /\bcli\b|click|argparse|build[- ]your[- ]own|learn[- ]by[- ]build|getopt|typer/i,
  },
  {
    id: "agent-orchestration",
    name: "Agent orchestration / multi-agent patterns",
    match: /\bagent|subagent|orchestr|swarm|multi[- ]agent|agent.*pipeline|autoresearch/i,
  },
  {
    id: "docs-as-ai-readable",
    name: "AI-readable documentation standards (llms.txt, CLAUDE.md, SKILL.md)",
    match:
      /\bllms[- ]?\.?txt|ai[- ]readable|claude\.md.*philosophy|structured.*developer|ai.*code[- ]gen/i,
  },
  {
    id: "zod-schema-validation",
    name: "Schema-first validation (Zod, type safety, runtime contracts)",
    match: /\bzod|schema.*valid|runtime.*type|contract.*valid|oauth.*scope/i,
  },
  {
    id: "error-safety-patterns",
    name: "Error handling, sanitization, and safety patterns",
    match:
      /\berror.*sanit|sanit.*error|swallow|silent.*fail|safe[- ]?read|safe[- ]?parse|path.*travers|safe.*expression/i,
  },
  {
    id: "testing-coverage",
    name: "Testing, coverage, and verification approaches",
    match:
      /\btest(?!s? (mocking|missing))|coverage|golden[- ]?file|snapshot|fixture|mocks?|no[- ]tests|validation.*without/i,
  },
  {
    id: "ai-code-risks",
    name: "AI-generated code risks and anti-patterns",
    match:
      /\bai[- ]generat|hallucin|slopsquat|prompt.*inject|ai.*specif|ai.*anti|context.*momentum|severity.*blind/i,
  },
  {
    id: "media-pipeline",
    name: "Media/audio/video extraction pipelines",
    match:
      /\b(frame|subtitle|transcript|whisper|asr|shot.*scene|audio|video|bedrock|youtube|tiktok|playlist).*\b|media.*extract/i,
  },
  {
    id: "docker-security",
    name: "Container / deployment security hardening",
    match:
      /\bdocker|container.*harden|cap_drop|ro[- ]?fs|read[- ]?only.*fs|non[- ]root|alpine|csp|hsts|security.*header/i,
  },
  {
    id: "architectural-separation",
    name: "Architectural separation (backend/pipeline, command pattern, presenter)",
    match:
      /\bcommand.*pattern|presenter.*pattern|backend.*pipeline|repository.*pattern|service.*layer|abstract.*base|strategy.*abc|hierarch.*composition/i,
  },
  {
    id: "scraping-adversarial",
    name: "Scraping / adversarial-API patterns",
    match:
      /\bscrap|firecrawl|adversarial|anti[- ]bot|rate[- ]?limit|proxy.*rotat|session.*pool|nitter|scrap.*hostile/i,
  },
  {
    id: "doc-code-drift",
    name: "Documentation-code drift and stale-docs anti-pattern",
    match:
      /\bdoc.*drift|docs.*code|stale.*doc|documentation.*promis|code.*gap|deepwiki|archit.*doc/i,
  },
  {
    id: "governance-solo",
    name: "Solo-maintainer / adoption-hostile governance",
    match:
      /\bsolo.*maint|governance|contributor[- ]?hostile|cla[- ]?only|community.*health|permissive.*default|license.*trap/i,
  },
  {
    id: "memory-knowledge",
    name: "Memory / knowledge-graph / note-taking systems",
    match:
      /\bmemory|memskill|knowledge[- ]graph|notebook|note[- ]taking|obsidian|graph.*format|embedd.*graph/i,
  },
  {
    id: "convention-over-configuration",
    name: "Convention over configuration (filename, grep-friendly, unique-names)",
    match:
      /\bconvention|grep[- ]friendly|minimize[- ]unique|filename.*convention|nam.*convention|structured.*developer/i,
  },
];

function matchMetaTheme(theme) {
  const hay = (theme.name + " " + (theme.description || "")).toLowerCase();
  const matched = [];
  for (const mt of META_THEMES) {
    if (mt.match.test(hay)) matched.push(mt.id);
  }
  return matched;
}

// Build meta-theme clusters
const clusters = {};
for (const mt of META_THEMES)
  clusters[mt.id] = { ...mt, member_themes: [], source_slugs: new Set(), source_types: new Set() };
const unmatchedThemes = [];
for (const t of merged.themes) {
  const ids = matchMetaTheme(t);
  if (ids.length === 0) {
    unmatchedThemes.push(t);
    continue;
  }
  for (const id of ids) {
    clusters[id].member_themes.push(t);
    t.sources.forEach((s) => {
      clusters[id].source_slugs.add(s);
      clusters[id].source_types.add(sourceMap[s]?.source_type || "unknown");
    });
  }
}
for (const c of Object.values(clusters)) {
  c.source_slugs = [...c.source_slugs].sort();
  c.source_types = [...c.source_types];
  c.source_count = c.source_slugs.length;
  c.confidence = c.source_count >= 5 ? "strong" : c.source_count >= 3 ? "medium" : "weak";
  delete c.match;
}

// Sort clusters by source_count desc
const orderedClusters = Object.values(clusters)
  .filter((c) => c.source_count > 0)
  .sort((a, b) => b.source_count - a.source_count);

// --- Candidate topic buckets for Fit Portfolio ---
// Reuse META_THEMES matchers on candidate name+description
const candidateBuckets = {};
for (const mt of META_THEMES)
  candidateBuckets[mt.id] = { id: mt.id, name: mt.name, candidates: [] };
const unbucketedCandidates = [];
for (const c of merged.candidates) {
  const hay = (c.name + " " + (c.description || "")).toLowerCase();
  let matched = false;
  for (const mt of META_THEMES) {
    if (mt.match.test(hay)) {
      candidateBuckets[mt.id].candidates.push(c);
      matched = true;
    }
  }
  if (!matched) unbucketedCandidates.push(c);
}

const out = {
  generated_at: new Date().toISOString(),
  source_count: merged.source_count,
  meta_themes: orderedClusters.map((c) => ({
    id: c.id,
    name: c.name,
    source_count: c.source_count,
    source_slugs: c.source_slugs,
    source_types: c.source_types,
    confidence: c.confidence,
    member_theme_count: c.member_themes.length,
    sample_themes: c.member_themes
      .slice(0, 6)
      .map((t) => ({ name: t.name, description: t.description })),
    sample_evidence: c.member_themes
      .flatMap((t) => (t.evidence || []).map((e) => ({ slug: e.slug, quote: e.quote })))
      .slice(0, 4),
  })),
  candidate_buckets: Object.values(candidateBuckets)
    .filter((b) => b.candidates.length > 0)
    .sort((a, b) => b.candidates.length - a.candidates.length)
    .map((b) => ({
      id: b.id,
      name: b.name,
      count: b.candidates.length,
      unique_sources: new Set(b.candidates.flatMap((c) => c.sources.map((s) => s.slug))).size,
      top_candidates: b.candidates.slice(0, 8).map((c) => ({
        name: c.name,
        type: c.type,
        description: c.description,
        source_count: c.source_count,
        weighted: c.weighted,
        sources: c.sources.map((s) => s.slug),
      })),
    })),
  unmatched_themes: unmatchedThemes.length,
  unbucketed_candidates: unbucketedCandidates.length,
};

const outPath = path.join(BASE, "META_THEMES.json");
const tmp = outPath + ".tmp";
fs.writeFileSync(tmp, JSON.stringify(out, null, 2) + "\n");
fs.renameSync(tmp, outPath);
console.log(`Wrote ${outPath}`);
console.log(`\nMeta-theme clusters (sorted by source_count):`);
for (const c of out.meta_themes) {
  console.log(`  ${c.source_count}x [${c.confidence}] ${c.name}`);
}
console.log(`\nCandidate buckets (sorted by count):`);
for (const b of out.candidate_buckets) {
  console.log(`  ${b.count} candidates / ${b.unique_sources} unique sources — ${b.name}`);
}
console.log(`\nUnmatched: ${out.unmatched_themes} themes, ${out.unbucketed_candidates} candidates`);
