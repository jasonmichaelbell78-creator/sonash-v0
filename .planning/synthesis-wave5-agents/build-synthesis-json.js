#!/usr/bin/env node
/**
 * Build .research/analysis/synthesis/synthesis.json from
 * META_THEMES.json + SOURCES.json + the prose choices already made in
 * synthesis.md. Conforms to synthesisRecord Zod schema.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const BASE = ".planning/synthesis-wave5-agents";
const mt = JSON.parse(fs.readFileSync(path.join(BASE, "META_THEMES.json"), "utf8"));
const merged = JSON.parse(fs.readFileSync(path.join(BASE, "MERGED.json"), "utf8"));
const sources = JSON.parse(fs.readFileSync(path.join(BASE, "SOURCES.json"), "utf8"));
const { validate } = require("../../scripts/lib/analysis-schema.js");

const sourceMap = Object.fromEntries(sources.map((s) => [s.slug, s]));
const TYPE_MAP = { repo: "repo", website: "website", media: "media", document: "document" };

// sources_included = the 32 Standard sources in the synthesis scope
const sourcesIncluded = sources.map((s) => ({
  slug: s.slug,
  source: s.source,
  source_type: TYPE_MAP[s.source_type] || "repo",
  source_tier: s.source_tier || "T2",
  depth: s.depth,
}));

const sourcesExcluded = [
  { slug: "surya", reason: "Quick-depth preview per Step 10 skip decision" },
  { slug: "tesseract", reason: "Quick-depth preview per Step 10 skip decision" },
];

// Themes: convert meta-theme clusters into themeSchema records
const confidenceEnum = { strong: "strong", medium: "medium", weak: "weak" };
const themes = mt.meta_themes.map((c) => ({
  name: c.name,
  description: c.sample_themes[0]?.description || c.name,
  evidence: c.sample_evidence.slice(0, 5).map((e) => ({
    source_slug: e.slug,
    source_type: TYPE_MAP[sourceMap[e.slug]?.source_type] || "repo",
    quote_or_ref: (e.quote || "").slice(0, 480),
  })),
  convergence_count: c.source_count,
  convergence_confidence: confidenceEnum[c.confidence] || "weak",
  source_types: c.source_types.map((t) => TYPE_MAP[t] || "repo"),
  signal_strength: confidenceEnum[c.confidence] || "weak",
}));

// Ecosystem gaps — consolidate from merged.absence_signals with prose-validated subset
const ecosystem_gaps = [
  {
    domain: "Recovery-community UX / sober-living product patterns",
    description:
      "SoNash is Sober Nashville — a recovery notebook for the sobriety community. The 32-source corpus contains zero references to recovery-specific UX, peer-support workflows, trauma-informed design, or harm-reduction content patterns.",
    why_unfilled:
      "User has been building SoNash's infrastructure layer via JASON-OS research; product-layer sources were not prioritized in early analysis waves.",
    suggested_action:
      "Queue /website-analysis on Sober Grid, InTheRooms, I Am Sober, and 12-step digital tool references. Add /document-analysis on 42 CFR Part 2 (SUD confidentiality) policy docs.",
    home_context_source: "SoNash identity (memory: project_sonash_identity.md)",
  },
  {
    domain: "Firebase-native architecture (App Check, Firestore rules, Cloud Functions)",
    description:
      "SoNash's stack is Firebase 12.10 (Firestore + Auth + App Check + Functions). Zero sources in the corpus are Firebase-native.",
    why_unfilled:
      "Corpus skews to Python/Rust/Go infrastructure repos and Node-agnostic tool ecosystems.",
    suggested_action:
      "Add one high-quality Firebase production reference (e.g., Next.js+Firebase SaaS starter with App Check enforced, or Firebase Extensions gallery) to Wave 6.",
    home_context_source: "CLAUDE.md §1 Stack Versions",
  },
  {
    domain: "Privacy-first on-device fetch / extraction",
    description:
      "SoNash vision is Privacy-First. Corpus extraction sources all send content to third parties (r.jina.ai, Google Innertube, AWS Rekognition, Webshare proxies).",
    why_unfilled:
      "Extraction-as-SaaS is the dominant ecosystem model; privacy-first is a minority posture.",
    suggested_action:
      "Queue whisper.cpp, monolith, SingleFile, readable-cli for Wave 6 local-first extraction coverage.",
    home_context_source: "SoNash Privacy-First vision (ROADMAP.md)",
  },
  {
    domain: "HIPAA-adjacent / 42 CFR Part 2 SUD confidentiality",
    description:
      "Sobriety data is regulated under 42 CFR Part 2 (substance-use disorder confidentiality). Bedrock's tokenize/untokenize pattern is the closest corpus reference but covers only the LLM boundary.",
    why_unfilled:
      "Regulatory content is not typically analyzed through /analyze skills; requires targeted document sourcing.",
    suggested_action:
      "Add a policy-document analysis of 42 CFR Part 2 or a privacy-first journal app case study (e.g., Signal protocol implementation walkthrough).",
    home_context_source: "SoNash identity + recovery-data regulatory landscape",
  },
  {
    domain: "TypeScript/Node MCP server implementations",
    description:
      "Corpus MCP patterns are all Python (archivebox, hkuds, graphify) or Ruby/ES (outline). JASON-OS targets Node/TS.",
    why_unfilled: "MCP adoption in 2026 is Python-heavy; TS reference implementations are newer.",
    suggested_action:
      "Analyze @modelcontextprotocol/typescript-sdk reference servers or TS-based FastMCP equivalents.",
    home_context_source: "JASON-OS Domain 02a (memory: project_os_vision.md)",
  },
  {
    domain: "Hallucinated-dependency (slopsquatting) detection tooling",
    description:
      "errors-and-vulnerabilities document flags slopsquatting as a real AI-native supply-chain risk. No corpus source shows a production detection implementation.",
    why_unfilled: "Pre-install package verification tooling is nascent (2025+).",
    suggested_action:
      "Analyze Dep-Hallucinator or equivalent; draft a pre-commit/pre-install gate.",
    home_context_source: "errors-and-vulnerabilities-in-ai-generated-code analysis",
  },
  {
    domain: "License-compliance / SBOM tooling",
    description: "No corpus source covers SBOM generation or license scanning.",
    why_unfilled: "Compliance tooling is outside the current corpus focus.",
    suggested_action: "Pick one tool (cyclonedx, license-checker) for targeted analysis.",
    home_context_source: "errors-and-vulnerabilities compliance gap",
  },
  {
    domain: "Skill retirement / deprecation workflows",
    description:
      "codecrafters + hkuds expose the failure mode (entries grow without retirement). No corpus source demonstrates a working deprecation process.",
    why_unfilled:
      "Retirement patterns are typically undocumented; only visible in changelog archaeology.",
    suggested_action:
      "Analyze projects with mature deprecation (Rails deprecation_warning, PEP 387, npm deprecate CLI).",
    home_context_source: "SoNash .claude/skills/ growth projection",
  },
  {
    domain: "Pre-commit hook / TDMS-style governance ecosystems",
    description:
      "SoNash has 14 pre-commit checks + TDMS tech-debt pipeline. firecrawl's CLAUDE.md capability-gating is close but narrower. No corpus source covers a full governance pipeline comparable to SoNash's.",
    why_unfilled: "Governance-pipeline repos are fewer than application repos in 2026 ecosystem.",
    suggested_action: "Analyze pre-commit/pre-commit, lefthook, or husky ecosystem patterns.",
    home_context_source: "SoNash pre-commit infrastructure",
  },
  {
    domain: "Progressive/resumable extraction with persistent state",
    description:
      "crawl4ai has resume_state but it's in-memory-only. T28 Gap Agent A Q5 asks for progressive extraction with durable state.",
    why_unfilled:
      "Most extraction pipelines run to completion in-process; durable execution is a separate ecosystem.",
    suggested_action:
      "Analyze Temporal.io workflow engine, durable-execution pattern, or EventStore architecture references.",
    home_context_source: "T28 Gap Agent A Q5",
  },
  {
    domain: "Local-first voice/transcription stack (Whisper-native)",
    description:
      "Bedrock repo flags local-first as the right direction; corpus has no Whisper-native reference.",
    why_unfilled: "Local-first ML is a minority posture.",
    suggested_action: "Analyze whisper.cpp or mlx-whisper as a direct reference.",
    home_context_source: "bedrock-summarize-audio-video-text absence signal",
  },
];

// Fit portfolio: flatten top N candidates per bucket into candidateSchema-compatible records
const portfolioCandidates = [];
const seen = new Set();
for (const bucket of mt.candidate_buckets) {
  for (const c of bucket.top_candidates.slice(0, 8)) {
    const key = c.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    // Map to candidateSchema: name, type, description, novelty, effort, relevance, tags, url?, finding_refs?
    // Infer novelty/effort/relevance from sources[0] (the first-appearing instance)
    const firstSource = merged.candidates.find((m) => m.name === c.name)?.sources?.[0];
    portfolioCandidates.push({
      name: c.name,
      type: c.type || "knowledge",
      description: c.description || "",
      novelty: firstSource?.novelty || "medium",
      effort: firstSource?.effort || "E1",
      relevance: firstSource?.relevance || "medium",
      tags: merged.candidates.find((m) => m.name === c.name)?.tags || [],
    });
  }
}

// Knowledge map: from META_THEMES meta_themes (covered) + gaps
const covered = mt.meta_themes.map((c) => ({
  domain: c.name,
  sources: c.source_slugs,
  quality: c.confidence,
}));
const gapsForMap = ecosystem_gaps.map((g) => ({
  domain: g.domain,
  home_context_source: g.home_context_source || "unspecified",
  suggested_scan: g.suggested_action || null,
}));

// Opportunity matrix
const opportunities = [
  {
    rank: 1,
    title: "Publish SoNash /llms.txt from CLAUDE.md + SKILL.md corpus",
    description:
      "One-shot script that generates llms.txt from existing docs. Makes SoNash discoverable by other LLM systems without custom integration.",
    effort: "E1",
    impact: "medium",
    evidence: ["docs-composio-dev"],
    suggested_route: "/deep-plan",
  },
  {
    rank: 2,
    title: "Add slopsquatting gate to pre-commit (package-name verification)",
    description:
      "Pre-install check: verify npm package names against registry + dep-hallucinator-style heuristics. Closes an AI-native supply-chain risk SoNash currently does not gate.",
    effort: "E1",
    impact: "high",
    evidence: ["errors-and-vulnerabilities-in-ai-generated-code"],
    suggested_route: "/deep-plan",
  },
  {
    rank: 3,
    title: "Adopt .claude-plugin/marketplace.json as SoNash skill distribution format",
    description:
      "If SoNash ever distributes skills outside the single repo, the emerging marketplace.json format is the standard. Cheap to preemptively adopt.",
    effort: "E1",
    impact: "medium",
    evidence: ["sidbharath-com-blog-claude-code-the-complete-guide", "hkuds-cli-anything"],
    suggested_route: "/deep-plan",
  },
  {
    rank: 4,
    title: "Queue 3-5 recovery-community UX sources for Wave 6 /analyze",
    description:
      "Biggest gap in corpus. Sober Grid, I Am Sober, InTheRooms, peer-support UX. Fills the single most critical absence (3-agent confirmation).",
    effort: "E0",
    impact: "high",
    evidence: ["absence-signal:recovery-community-ux"],
    suggested_route: "/analyze",
  },
  {
    rank: 5,
    title: "Add bidirectional doc-feature validator to SoNash pre-commit",
    description:
      "Inward check (cross-doc-deps) already exists. Outward check (code feature has doc reference) closes the drift loop.",
    effort: "E2",
    impact: "medium",
    evidence: ["crawl4ai", "jina-ai-reader"],
    suggested_route: "/deep-plan",
  },
  {
    rank: 6,
    title: "Prototype zero-schema MCP server from SoNash scripts/ CLI introspection",
    description:
      "SoNash has 100+ scripts/ with argparse/yargs. An MCP server introspecting them eliminates the schema-drift class entirely. JASON-OS Domain 02a candidate.",
    effort: "E2",
    impact: "high",
    evidence: ["archivebox-archivebox"],
    suggested_route: "/brainstorm",
  },
  {
    rank: 7,
    title: "Research OAuth-scope-filtered MCP tool registration for JASON-OS",
    description:
      "Outline's production pattern. Before JASON-OS adds any MCP tool, this is the security model worth studying in depth.",
    effort: "E2",
    impact: "high",
    evidence: ["outline"],
    suggested_route: "/deep-research",
  },
  {
    rank: 8,
    title: "Prototype meta-tool pattern for SoNash skill/agent discovery",
    description:
      "72+ skills + 38 agents. Loading all at session start is expensive. A meta-skill that searches and loads on demand follows composio's playbook.",
    effort: "E2",
    impact: "high",
    evidence: ["docs-composio-dev"],
    suggested_route: "/brainstorm",
  },
  {
    rank: 9,
    title: "Design SoNash Firebase-native reference doc",
    description:
      "Architectural write-up + diagrams. App Check posture, Firestore rules, httpsCallable gateway, emulator patterns. Becomes SoNash's reference for onboarding AI agents to the stack.",
    effort: "E2",
    impact: "high",
    evidence: ["absence-signal:firebase-native"],
    suggested_route: "/deep-plan",
  },
  {
    rank: 10,
    title: "Explore privacy-first on-device extraction for SoNash content analysis",
    description:
      "whisper.cpp for local ASR, monolith/SingleFile for local HTML, readable-cli for local Reader-mode. If SoNash ever analyzes user-provided content, privacy-first local-first is the vision statement commitment.",
    effort: "E3",
    impact: "high",
    evidence: ["absence-signal:privacy-first-on-device"],
    suggested_route: "/deep-research",
  },
  {
    rank: 11,
    title: "Design 42 CFR Part 2 / HIPAA-adjacent data-handling architecture for SoNash",
    description:
      "Compliance question, not coding. Should be scoped before SoNash adds any storage pattern that touches sobriety-specific data.",
    effort: "E3",
    impact: "high",
    evidence: ["absence-signal:sud-confidentiality"],
    suggested_route: "/deep-research",
  },
  {
    rank: 12,
    title: "Spec a skill retirement workflow for SoNash .claude/skills/",
    description:
      "As SoNash accumulates skills (72+ today), retirement has to be a first-class motion. Draft a deprecation process: warning phase, deprecation_warning-style surface, removal.",
    effort: "E2",
    impact: "medium",
    evidence: ["codecrafters-io-build-your-own-x", "hkuds-cli-anything"],
    suggested_route: "/deep-plan",
  },
];

// Reading chain — 32 entries ordered by pedagogical tier
const readingChain = [
  // overview tier
  {
    order: 1,
    source_slug: "karpathy-gist-442a6bf",
    tier: "overview",
    rationale: "Rhetorical framing: ingest/query/lint vocabulary for CAS-like systems.",
  },
  {
    order: 2,
    source_slug: "errors-and-vulnerabilities-in-ai-generated-code",
    tier: "overview",
    rationale: "AI-code risk taxonomy. Sets the 'what could go wrong' frame.",
  },
  {
    order: 3,
    source_slug: "karpathy-autoresearch",
    tier: "overview",
    rationale: "Minimalist orchestration thesis. Read before kieranklaassen-gist for counterpoint.",
  },
  {
    order: 4,
    source_slug: "kieranklaassen-gist-4f2aba89",
    tier: "overview",
    rationale: "Swarm 6-pattern orchestration taxonomy. Counter-thesis to karpathy-autoresearch.",
  },
  {
    order: 5,
    source_slug: "sidbharath-com-blog-claude-code-the-complete-guide",
    tier: "overview",
    rationale: "Comprehensive Claude Code as platform overview.",
  },
  {
    order: 6,
    source_slug: "codecrafters-io-build-your-own-x",
    tier: "overview",
    rationale: "Curated catalog of build-your-own projects. Meta-source for discovery.",
  },
  {
    order: 7,
    source_slug: "docs-composio-dev",
    tier: "overview",
    rationale:
      "Meta-tool architecture + native vs MCP tradeoff + llms.txt standard. Essential for JASON-OS Domain 02a thinking.",
  },
  // tutorial tier
  {
    order: 8,
    source_slug: "farzaa-gist-c35ac0cf",
    tier: "tutorial",
    rationale: "Personal knowledge wiki skill building tutorial. Short-form.",
  },
  {
    order: 9,
    source_slug: "maharshi-pandya-gist-4aeccbe1",
    tier: "tutorial",
    rationale: "Exploration-over-conclusion design principle. Low-signal but fast read.",
  },
  {
    order: 10,
    source_slug: "youtube-oszdfnqmgrw",
    tier: "tutorial",
    rationale: "Skill-building video overview. Self-referential confirmation of SoNash practices.",
  },
  {
    order: 11,
    source_slug: "youtube-qinuqwl4e-k",
    tier: "tutorial",
    rationale:
      "Obsidian attachment tutorial. Low direct relevance; read only if considering file-based retrieval systems.",
  },
  {
    order: 12,
    source_slug: "public-apis_public-apis",
    tier: "tutorial",
    rationale:
      "Catalog of 1000+ public APIs. Useful as a feature-hook reference for SoNash extensions.",
  },
  // implementation tier
  {
    order: 13,
    source_slug: "docling",
    tier: "implementation",
    rationale: "Extraction pipeline reference architecture. Start here for extraction topic.",
  },
  {
    order: 14,
    source_slug: "unstructured",
    tier: "implementation",
    rationale: "Type-detection + auto-partitioning. Pairs with docling.",
  },
  {
    order: 15,
    source_slug: "firecrawl",
    tier: "implementation",
    rationale: "Engine-fallback scraping. Pairs with crawl4ai.",
  },
  {
    order: 16,
    source_slug: "crawl4ai",
    tier: "implementation",
    rationale: "Strategy hierarchy + filter/scorer composition.",
  },
  {
    order: 17,
    source_slug: "vikparuchuri-marker",
    tier: "implementation",
    rationale: "3-stage pipeline + benchmark registry. PDF-specific.",
  },
  {
    order: 18,
    source_slug: "MinerU",
    tier: "implementation",
    rationale: "Async task state machine + VLM integration.",
  },
  {
    order: 19,
    source_slug: "jina-ai-reader",
    tier: "implementation",
    rationale: "'LLM-friendly URL extraction' as product. Anti-pattern examples included.",
  },
  {
    order: 20,
    source_slug: "aws-media-extraction",
    tier: "implementation",
    rationale: "Multi-granularity media pipeline (frame->shot->scene). Novel architecture.",
  },
  {
    order: 21,
    source_slug: "bedrock-summarize-audio-video-text",
    tier: "implementation",
    rationale: "PII tokenize/untokenize pattern (high SoNash relevance).",
  },
  {
    order: 22,
    source_slug: "bulk-transcribe-youtube-playlist",
    tier: "implementation",
    rationale: "Caption-first + Whisper fallback.",
  },
  {
    order: 23,
    source_slug: "lux-video-downloader",
    tier: "implementation",
    rationale: "Per-site plugin pattern.",
  },
  {
    order: 24,
    source_slug: "youtube-transcript-api",
    tier: "implementation",
    rationale: "Adopt-as-library (rare pattern).",
  },
  {
    order: 25,
    source_slug: "outline",
    tier: "implementation",
    rationale:
      "Production MCP server + command pattern + plugin system. Primary MCP implementation reference.",
  },
  {
    order: 26,
    source_slug: "archivebox-archivebox",
    tier: "implementation",
    rationale: "Zero-schema MCP + hooks model + CLAUDE.md philosophy.",
  },
  {
    order: 27,
    source_slug: "hkuds-cli-anything",
    tier: "implementation",
    rationale: "CLI as MCP transport.",
  },
  {
    order: 28,
    source_slug: "qmd",
    tier: "implementation",
    rationale: "MCP as CLI subcommand + local-first inference.",
  },
  {
    order: 29,
    source_slug: "safishamsi-graphify",
    tier: "implementation",
    rationale: "Stateless token-budgeted MCP server + knowledge graph.",
  },
  {
    order: 30,
    source_slug: "viktoraxelsen-memskill",
    tier: "implementation",
    rationale: "Flat memory skill approach.",
  },
  {
    order: 31,
    source_slug: "teng-lin_notebooklm-py",
    tier: "implementation",
    rationale: "Notebooklm-style doc chat.",
  },
  {
    order: 32,
    source_slug: "zedeus-nitter",
    tier: "implementation",
    rationale:
      "Docker hardening + ADVERSARIAL_DEPENDENCY anti-pattern. Read last for the cautionary framing.",
  },
].map((n) => ({ ...n, source_type: TYPE_MAP[sourceMap[n.source_slug]?.source_type] || "repo" }));

const out = {
  schema_version: "1.0",
  generated_at: new Date().toISOString(),
  paradigm: "thematic",
  mode: "full",
  sources_included: sourcesIncluded,
  sources_excluded: sourcesExcluded,
  themes,
  ecosystem_gaps,
  fit_portfolio: {
    refreshed_at: new Date().toISOString(),
    candidates: portfolioCandidates,
  },
  knowledge_map: {
    covered,
    gaps: gapsForMap,
  },
  opportunity_matrix: opportunities,
  reading_chain: readingChain,
  mental_model: {
    interest_shifts: [
      {
        from: "tooling research (what a system should look like)",
        to: "tooling consolidation (how specific production systems actually work)",
      },
      {
        from: "Claude Code as tool",
        to: "Claude Code as platform with skills, plugins, hooks, marketplaces",
      },
    ],
    confidence_shifts: [
      {
        topic: "MCP as integration surface",
        from: "weak",
        to: "strong (7 independent sources, convergent patterns)",
      },
      {
        topic: "agent orchestration paradigm",
        from: "unclear",
        to: "multi-directional (sources disagree; field unsettled)",
      },
    ],
    emerging_focus_tags: [
      "skill-design",
      "hook-governance",
      "testing",
      "privacy",
      "meta-tooling",
      "claude-code-platform",
    ],
    date_range: "2026-03-31 to 2026-04-13",
  },
};

// Validate against Zod
const result = validate(out, "synthesis");
if (!result.success) {
  console.error("Zod validation FAILED:");
  console.error(result.error);
  process.exit(1);
}

const outPath = path.join(".research/analysis/synthesis", "synthesis.json");
const tmp = outPath + ".tmp";
fs.writeFileSync(tmp, JSON.stringify(out, null, 2) + "\n");
fs.renameSync(tmp, outPath);
console.log("Wrote", outPath);
console.log("Zod: PASS");
console.log("themes:", out.themes.length);
console.log("gaps:", out.ecosystem_gaps.length);
console.log("portfolio candidates:", out.fit_portfolio.candidates.length);
console.log("opportunities:", out.opportunity_matrix.length);
console.log("reading chain:", out.reading_chain.length);
