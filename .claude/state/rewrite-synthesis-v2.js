"use strict";
const fs = require("fs");
const path = require("path");
const { validatePathInDir } = require("../../scripts/lib/security-helpers.js");

const ANALYSIS_DIR = path.resolve(".research/analysis");

const now = new Date().toISOString();
const today = now.slice(0, 10);

// Normalize title_key to match self-audit.js/scripts/lib/analysis-schema.js.
const normalizeTitleKey = (title) =>
  String(title || "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9 ]/g, "")
    .trim()
    .replaceAll(/\s+/g, "_")
    .slice(0, 60);

// Load source inventory.
let sources;
try {
  sources = JSON.parse(fs.readFileSync(".claude/state/synthesize.sources.json", "utf8"));
} catch (err) {
  console.error("Cannot read synthesize.sources.json:", err.code || "unknown");
  process.exit(1);
}
const sourceBySlug = new Map();
for (const s of sources) {
  try {
    validatePathInDir(ANALYSIS_DIR, s.slug);
    const j = JSON.parse(fs.readFileSync(path.join(ANALYSIS_DIR, s.slug, "analysis.json"), "utf8"));
    sourceBySlug.set(s.slug, {
      slug: s.slug,
      source: j.source || j.repo || j.url || s.slug,
      source_type: j.source_type || "repo",
      source_tier: j.source_tier || "T1",
      depth: j.depth || "standard",
    });
  } catch (err) {
    console.error(`Skipping slug ${s.slug}: ${err.code || "invalid path"}`);
  }
}

// Load slice outputs.
const slices = [1, 2, 3, 4].map((i) => {
  try {
    return JSON.parse(fs.readFileSync(`.claude/state/synthesize.slice-${i}.json`, "utf8"));
  } catch (err) {
    console.error(`Cannot read slice-${i}.json: ${err.code || "unknown"}`);
    process.exit(1);
  }
});

// Convergence band helper.
const convergenceConfidence = (n) => (n >= 5 ? "strong" : n >= 3 ? "medium" : "weak");

// Transform themes. evidence_refs[string] → evidence[{source_slug, source_type, quote_or_ref}].
const transformedThemes = slices.flatMap((slice) =>
  slice.themes.map((t) => {
    const themeSources = Array.isArray(t.sources) ? t.sources : [];
    const typeSet = new Set();
    for (const slug of themeSources) {
      const info = sourceBySlug.get(slug);
      if (info) typeSet.add(info.source_type);
    }
    // Build evidence from evidence_refs, pairing with sources when possible.
    const refs = Array.isArray(t.evidence_refs) ? t.evidence_refs : [];
    const evidence = refs.map((ref, idx) => {
      const matchSlug = themeSources.find((s) => ref.startsWith(s));
      const slug = matchSlug || themeSources[idx] || themeSources[0] || "unknown";
      const info = sourceBySlug.get(slug);
      return {
        source_slug: slug,
        source_type: info?.source_type || "repo",
        quote_or_ref: ref,
      };
    });
    // If no evidence_refs, synthesize one per source.
    if (evidence.length === 0) {
      for (const slug of themeSources) {
        const info = sourceBySlug.get(slug);
        evidence.push({
          source_slug: slug,
          source_type: info?.source_type || "repo",
          quote_or_ref: `${slug}/creator-view.md`,
        });
      }
    }
    return {
      name: t.name,
      description: t.description,
      evidence,
      convergence_count: t.convergence_count || themeSources.length,
      convergence_confidence: convergenceConfidence(t.convergence_count || themeSources.length),
      source_types: Array.from(typeSet),
      signal_strength:
        (t.convergence_count || 0) >= 4
          ? "strong"
          : (t.convergence_count || 0) >= 2
            ? "medium"
            : "weak",
    };
  })
);

// Transform candidates. fit_hint → candidateTypeEnum mapping.
const fitHintToType = (h) => {
  switch (h) {
    case "adoption-candidate":
      return "tool";
    case "extraction-candidate":
      return "pattern";
    case "reference":
      return "knowledge";
    default:
      return "pattern";
  }
};
const qualityToNovelty = (q) => (q >= 85 ? "high" : q >= 70 ? "medium" : "low");
const qualityToRelevance = (q) => (q >= 80 ? "high" : q >= 65 ? "medium" : "low");
const guessEffort = (tags) => {
  const t = (tags || []).join(",");
  if (/infrastructure|architecture|harness|pipeline|migration/.test(t)) return "E3";
  if (/library|tool|plugin|marketplace|documentation/.test(t)) return "E1";
  return "E2";
};

const dedupCandidates = new Map();
for (const slice of slices) {
  for (const c of slice.candidates || []) {
    const key = (c.name || "").toLowerCase() + "|" + (c.tags || []).slice(0, 2).join(",");
    if (!dedupCandidates.has(key)) {
      dedupCandidates.set(key, {
        name: c.name,
        type: fitHintToType(c.fit_hint),
        description: c.name + (c.source ? ` (source: ${c.source})` : ""),
        novelty: qualityToNovelty(c.quality || 70),
        effort: guessEffort(c.tags),
        relevance: qualityToRelevance(c.quality || 70),
        tags: c.tags || [],
        url: null,
        finding_refs: c.source ? [c.source] : [],
      });
    }
  }
}
const transformedCandidates = Array.from(dedupCandidates.values());

// Transform gaps: add description.
const gaps = [
  {
    domain: "Absorb step in the knowledge pipeline",
    description:
      "SoNash has ingest/query/lint loop edges but no mechanism to file query answers back into the living knowledge base.",
    why_unfilled:
      "extraction-journal.jsonl graduation pipeline is the intended solution but is reportedly broken; deep-research/synthesize outputs archive to .research/ and do not flow back into MEMORY.md/CLAUDE.md/docs/.",
    suggested_action: "T24/T28 absorb-step skill using farzaa 7-command template.",
    home_context_source: "karpathy-gist-442a6bf, farzaa-gist-c35ac0cf",
  },
  {
    domain: "Eval harness / measurement infrastructure",
    description:
      "No reproducible benchmark for measuring whether SoNash patterns and skills actually lift agent outcomes.",
    why_unfilled:
      "77 skills + 38 agents + 450+ patterns + no eval harness; learning metric flagged 89.2% vanity; GitNexus and autoresearch both ship harnesses, SoNash does not.",
    suggested_action:
      "3-mode benchmark (baseline/pattern-aware/pattern-plus-skills) with per-instance commit-hash caching.",
    home_context_source: "SESSION_CONTEXT Goal #10",
  },
  {
    domain: "Confidence tagging on extraction candidates and /recall results",
    description:
      "Extraction artifacts do not distinguish observed-from-source vs inferred-by-agent.",
    why_unfilled:
      "extraction-journal.jsonl and /recall schema lack confidence dimension; graphify + GitNexus both demonstrate the value.",
    suggested_action:
      "Add confidence field (EXTRACTED/INFERRED/AMBIGUOUS or 0.7-1.0) to extraction-candidate schema; propagate through /analyze and surface in /recall.",
    home_context_source: null,
  },
  {
    domain: "Progressive / resumable extraction for long analyses",
    description: "No pattern pairs an in-memory task state machine with persistent resume state.",
    why_unfilled:
      "MinerU has state machine but ephemeral; docling has thread-safety but no resume; crawl4ai has resume_state but not paired with SoNash's .claude/state/*.state.json pattern.",
    suggested_action:
      "Pair MinerU state-machine shape with crawl4ai persistent resume_state when progressive extraction added to any handler.",
    home_context_source: null,
  },
  {
    domain: "Skill retirement / lifecycle discipline",
    description: "SoNash can create and audit skills but cannot retire them systematically.",
    why_unfilled:
      "No formal retirement process; codecrafters is the cautionary case at 486K stars + 462 issues + stagnation.",
    suggested_action:
      "Define retirement sub-flow in /skill-audit; move deprecated to .claude/skills/_archived/ with forwarding pointer.",
    home_context_source: null,
  },
  {
    domain: "Hallucinated-dependency (slopsquatting) detection",
    description: "No pre-commit check for AI-suggested but non-existent npm packages.",
    why_unfilled:
      "errors-and-vulnerabilities paper flags slopsquatting as high-priority; SoNash has no mitigation.",
    suggested_action:
      "Pre-commit check comparing new package.json entries against npm registry + minimum download threshold.",
    home_context_source: null,
  },
  {
    domain: "License compliance scanning",
    description: "SBOM exists but is not cross-checked against project license policy.",
    why_unfilled:
      "Document-parsing cluster is uniformly copyleft-encumbered; SoNash has no automated audit.",
    suggested_action:
      "License-audit checker reading SBOM + flagging copyleft or incompatible licenses.",
    home_context_source: null,
  },
  {
    domain: "External-contract monitoring",
    description:
      "No CI workflow watches external API contracts (Anthropic SDK, MCP servers, Firebase APIs) for drift.",
    why_unfilled:
      "notebooklm-py ships rpc-health.yml; SoNash has 17+ manually-maintained workflows but no equivalent.",
    suggested_action:
      "Port rpc-health.yml pattern; daily-ping external contracts + auto-file labeled issues on drift.",
    home_context_source: null,
  },
  {
    domain: "HTTP/MCP security defaults for locally-exposed agent tooling",
    description:
      "Ecosystem default is permissive; SoNash risks inheriting weak defaults when building any HTTP/MCP surface.",
    why_unfilled:
      "Only outline treats HTTP as adversarial; MinerU/marker/CLI-Anything all show weak defaults.",
    suggested_action:
      "Use outline OAuth-scoped tool registration + App Check-style gating as baseline when SoNash/JASON-OS builds any HTTP/MCP surface.",
    home_context_source: null,
  },
  {
    domain: "Subagent-vs-teammate lived experience",
    description:
      "SoNash uses fire-and-forget subagents exclusively; no corpus of when-to-use-what evidence.",
    why_unfilled:
      "kieranklaassen documents TeammateTool 13 operations + task auto-unblock + 6 patterns; SoNash has not prototyped persistent teammates.",
    suggested_action:
      "Prototype one long-horizon workflow (deep-research 40-agent pipeline) as persistent teammates; measure vs fire-and-forget; document in AGENT_ORCHESTRATION.md.",
    home_context_source: null,
  },
];

// Knowledge map.
const sourcesByType = { repo: [], website: [], document: [], media: [] };
for (const s of sourceBySlug.values()) {
  (sourcesByType[s.source_type] || sourcesByType.repo).push(s.slug);
}
const knowledgeMap = {
  covered: [
    {
      domain: "Web scraping / crawling / archival",
      sources: [
        "crawl4ai",
        "firecrawl",
        "archivebox-archivebox",
        "jina-ai-reader",
        "zedeus-nitter",
        "youtube-transcript-api",
        "bulk-transcribe-youtube-playlist",
      ],
      quality: "deep",
    },
    {
      domain: "Document / PDF / OCR processing",
      sources: ["MinerU", "docling", "surya", "tesseract", "unstructured", "vikparuchuri-marker"],
      quality: "deep",
    },
    {
      domain: "Media / video / audio extraction",
      sources: [
        "aws-media-extraction",
        "bedrock-summarize-audio-video-text",
        "lux-video-downloader",
        "teng-lin_notebooklm-py",
      ],
      quality: "deep",
    },
    {
      domain: "AI agent orchestration / MCP",
      sources: [
        "abhigyanpatwari-gitnexus",
        "safishamsi-graphify",
        "kieranklaassen-gist-4f2aba89",
        "outline",
        "qmd",
        "hkuds-cli-anything",
      ],
      quality: "deep",
    },
    {
      domain: "Knowledge management / wiki / retrieval",
      sources: [
        "karpathy-gist-442a6bf",
        "farzaa-gist-c35ac0cf",
        "viktoraxelsen-memskill",
        "youtube-oszdfnqmgrw",
        "youtube-qinuqwl4e-k",
      ],
      quality: "deep",
    },
    {
      domain: "Claude Code skill/plugin ecosystem",
      sources: [
        "qmd",
        "hkuds-cli-anything",
        "teng-lin_notebooklm-py",
        "abhigyanpatwari-gitnexus",
        "sidbharath-com-blog-claude-code-the-complete-guide",
      ],
      quality: "moderate",
    },
    {
      domain: "Security / AI-code vulnerabilities",
      sources: ["errors-and-vulnerabilities-in-ai-generated-code", "jina-ai-reader"],
      quality: "authoritative-source",
    },
    {
      domain: "Testing discipline / CI patterns",
      sources: [
        "firecrawl",
        "archivebox-archivebox",
        "MinerU",
        "vikparuchuri-marker",
        "outline",
        "docling",
      ],
      quality: "moderate",
    },
    {
      domain: "Benchmark / eval harness",
      sources: ["abhigyanpatwari-gitnexus", "karpathy-autoresearch", "vikparuchuri-marker", "qmd"],
      quality: "emerging",
    },
  ],
  gaps: [
    {
      domain: "Node.js/TypeScript media stack",
      home_context_source: "SoNash stack: Next.js/TypeScript/Firebase",
      suggested_scan: "@distube/ytdl-core, ffmpeg-static, node-whisper, hnswlib-node",
    },
    {
      domain: "SoNash-stack-compatible embedding/vector search",
      home_context_source: "SoNash Firebase backend",
      suggested_scan: "Firestore vector search beta, Pinecone serverless",
    },
    {
      domain: "Privacy-first local LLM deployment",
      home_context_source: "SoNash privacy-first mission",
      suggested_scan: "llama.cpp, ollama, localai",
    },
    {
      domain: "Recovery / sobriety domain knowledge",
      home_context_source: "SoNash actual mission domain",
      suggested_scan: "SAMHSA datasets, recovery.org, peer-support frameworks",
    },
    {
      domain: "Firebase Functions MCP patterns",
      home_context_source: "SoNash Cloud Functions architecture",
      suggested_scan: "Firebase Extensions + Cloud Functions MCP exploration",
    },
    {
      domain: "Offline-first sync (privacy stance composition)",
      home_context_source: "SoNash privacy-first + client-first architecture",
      suggested_scan: "PouchDB, RxDB, Legend-State",
    },
    {
      domain: "UI component libraries / accessibility patterns",
      home_context_source: "SoNash frontend (no frontend sources analyzed)",
      suggested_scan: "Radix UI, shadcn/ui, WAI-ARIA",
    },
  ],
};

// Opportunity matrix — conformant to opportunitySchema.
const opportunities = [
  {
    rank: 1,
    title: "Build SoNash eval harness (3-mode benchmark)",
    description:
      "Curate recurring scenarios from review-metrics.jsonl + extraction-journal.jsonl and implement a 3-mode harness (baseline / pattern-aware / pattern-plus-skills) with per-instance metrics cached by commit hash.",
    effort: "E3",
    impact: "high",
    evidence: [
      "abhigyanpatwari-gitnexus",
      "karpathy-autoresearch",
      "vikparuchuri-marker",
      "qmd",
      "errors-and-vulnerabilities-in-ai-generated-code",
    ],
    suggested_route: "/deep-plan",
  },
  {
    rank: 2,
    title: "Add confidence tagging to extraction-candidate schema",
    description:
      "Add confidence dimension (EXTRACTED/INFERRED/AMBIGUOUS or 0.7-1.0 numeric) to the extraction-candidate schema, populate during /analyze, surface in /recall output, filter by threshold in /synthesize.",
    effort: "E1",
    impact: "high",
    evidence: ["abhigyanpatwari-gitnexus", "safishamsi-graphify"],
    suggested_route: "/deep-plan",
  },
  {
    rank: 3,
    title: "Port PII tokenize round trip as Cloud Function middleware",
    description:
      "Prototype a tokenizeBeforeLLM utility (local NER via compromise.js or regex) that wraps any journal-entry Cloud Function call before it reaches an AI model — the highest-fit pattern for SoNash's privacy-first mission.",
    effort: "E2",
    impact: "high",
    evidence: [
      "bedrock-summarize-audio-video-text",
      "errors-and-vulnerabilities-in-ai-generated-code",
    ],
    suggested_route: "/brainstorm",
  },
  {
    rank: 4,
    title: "Port caption first pytubefix Whisper fallback into media analysis",
    description:
      "Audit /analyze media handler for caption-first routing; if absent, add youtube-transcript-api as Layer 1 with Whisper as documented fallback for uncaptioned videos.",
    effort: "E1",
    impact: "high",
    evidence: [
      "bulk-transcribe-youtube-playlist",
      "youtube-transcript-api",
      "bedrock-summarize-audio-video-text",
      "aws-media-extraction",
    ],
    suggested_route: "/deep-plan",
  },
  {
    rank: 5,
    title: "Ship SoNash as claude plugin marketplace json",
    description:
      "Bundle SoNash skills + MCP surface as .claude-plugin/marketplace.json for Claude Code ecosystem distribution. qmd + GitNexus both prove the shape works today.",
    effort: "E2",
    impact: "high",
    evidence: ["qmd", "abhigyanpatwari-gitnexus", "hkuds-cli-anything"],
    suggested_route: "/deep-plan",
  },
  {
    rank: 6,
    title: "Prototype skill frontmatter to MCP auto discovery",
    description:
      "Port ArchiveBox's ~200-line MCP auto-discovery pattern (introspect CLI metadata to generate MCP tools dynamically) to Node, sourcing from SoNash skill frontmatter.",
    effort: "E2",
    impact: "high",
    evidence: ["archivebox-archivebox", "docs-composio-dev"],
    suggested_route: "/deep-plan",
  },
  {
    rank: 7,
    title: "Define skill retirement sub flow in skill audit",
    description:
      "Identify deprecated/superseded skills via usage telemetry from write-invocation.ts; move to .claude/skills/_archived/ with forwarding pointer. codecrafters cautionary case.",
    effort: "E1",
    impact: "medium",
    evidence: [
      "codecrafters-io-build-your-own-x",
      "public-apis_public-apis",
      "teng-lin_notebooklm-py",
    ],
    suggested_route: "/brainstorm",
  },
  {
    rank: 8,
    title: "Add slopsquatting pre commit check",
    description:
      "Pre-commit check comparing new package.json entries against npm registry + minimum download threshold; consider Dep-Hallucinator integration.",
    effort: "E1",
    impact: "medium",
    evidence: ["errors-and-vulnerabilities-in-ai-generated-code"],
    suggested_route: "/deep-plan",
  },
  {
    rank: 9,
    title: "Add capability gated testing to Firebase Functions integration tests",
    description:
      "Adopt firecrawl's env-var-gated test pattern (TEST_SUITE_SELF_HOSTED, OPENAI_API_KEY, OLLAMA_BASE_URL) — 3 lines per file eliminates skip-in-CI flake.",
    effort: "E0",
    impact: "medium",
    evidence: ["firecrawl"],
    suggested_route: "/deep-plan",
  },
  {
    rank: 10,
    title: "Author analysis output contract md using MinerU template",
    description:
      "Create ANALYSIS_OUTPUT_CONTRACT.md as a versioned contract downstream consumers can read; MinerU's output_files.md is the template.",
    effort: "E1",
    impact: "medium",
    evidence: ["MinerU", "docling", "unstructured"],
    suggested_route: "/brainstorm",
  },
  {
    rank: 11,
    title: "Port rpc health yml to Anthropic MCP Firebase contract monitor",
    description:
      "Daily cron workflow pinging Anthropic messages API + Firebase rules API + any active MCP servers; auto-file labeled issues on drift.",
    effort: "E1",
    impact: "medium",
    evidence: ["teng-lin_notebooklm-py", "lux-video-downloader"],
    suggested_route: "/deep-plan",
  },
  {
    rank: 12,
    title: "Prototype persistent teammate mode for deep research pipeline",
    description:
      "Convert deep-research 40-agent pipeline from fire-and-forget subagents to persistent teammates with inbox messaging and blockedBy dependencies; measure coordination-mid-task tradeoff.",
    effort: "E3",
    impact: "medium",
    evidence: ["kieranklaassen-gist-4f2aba89"],
    suggested_route: "/brainstorm",
  },
  {
    rank: 13,
    title: "Add license audit checker SBOM policy",
    description:
      "License-audit checker reading SBOM + dependency tree; flag copyleft or incompatible licenses against project policy.",
    effort: "E1",
    impact: "low",
    evidence: ["MinerU", "vikparuchuri-marker", "errors-and-vulnerabilities-in-ai-generated-code"],
    suggested_route: "/deep-plan",
  },
  {
    rank: 14,
    title: "GitNexus trial use as is on throwaway branch",
    description:
      "Trial GitNexus as the code-intelligence layer for SoNash on a throwaway branch; use for one real task; adopt/extract decision.",
    effort: "E1",
    impact: "medium",
    evidence: ["abhigyanpatwari-gitnexus"],
    suggested_route: "/brainstorm",
  },
  {
    rank: 15,
    title: "T24 absorb step skill",
    description:
      "Reads /deep-research + /synthesize outputs, proposes targeted edits to MEMORY.md / CLAUDE.md patterns / docs/ entries with user approval gating. farzaa 7-command template.",
    effort: "E3",
    impact: "high",
    evidence: ["karpathy-gist-442a6bf", "farzaa-gist-c35ac0cf", "viktoraxelsen-memskill"],
    suggested_route: "/deep-plan",
  },
  {
    rank: 16,
    title: "Add Signs pattern auto evolving feedback to T4",
    description:
      "Mine PR review outcomes + hook-warnings-log.jsonl for recurring failures; propose new feedback_*.md entries automatically; human approves before canon.",
    effort: "E3",
    impact: "medium",
    evidence: ["viktoraxelsen-memskill", "abhigyanpatwari-gitnexus"],
    suggested_route: "/brainstorm",
  },
  {
    rank: 17,
    title: "Adopt qmd frontmatter guardrails across top 5 risk skills",
    description:
      "Adopt allowed-tools + disable-model-invocation frontmatter guardrails across the 5 highest-risk skills identified by T45.",
    effort: "E1",
    impact: "medium",
    evidence: ["qmd"],
    suggested_route: "/deep-plan",
  },
  {
    rank: 18,
    title: "Hook execution model upgrade ArchiveBox bg fg ordering",
    description:
      "Add bg/fg + explicit ordering semantics to SoNash hook system, combining existing governance with ArchiveBox's runtime semantics.",
    effort: "E2",
    impact: "low",
    evidence: ["archivebox-archivebox", "crawl4ai"],
    suggested_route: "/brainstorm",
  },
].map((o) => ({ ...o, title_key: normalizeTitleKey(o.title) }));

// Reading chain.
const readingChain = [
  {
    order: 1,
    source_slug: "karpathy-gist-442a6bf",
    source_type: "repo",
    rationale:
      "Start here; names the three-layer pattern (sources/wiki/schema) that every other source implements some subset of.",
    tier: "theory",
  },
  {
    order: 2,
    source_slug: "farzaa-gist-c35ac0cf",
    source_type: "repo",
    rationale:
      "Concrete instantiation of Karpathy's abstract pattern; introduces writer-not-filing-clerk identity and ingest/query/lint triad.",
    tier: "implementation",
  },
  {
    order: 3,
    source_slug: "abhigyanpatwari-gitnexus",
    source_type: "repo",
    rationale:
      "Graph-backed code intelligence + the SWE-bench 3-mode eval harness; sets the measurement-discipline bar.",
    tier: "implementation",
  },
  {
    order: 4,
    source_slug: "docs-composio-dev",
    source_type: "website",
    rationale:
      "Meta-tool pattern (6 tools vs 1000+ definitions) and 55K-token MCP-context-cost concrete number; frames the scaling problem.",
    tier: "tutorial",
  },
  {
    order: 5,
    source_slug: "archivebox-archivebox",
    source_type: "repo",
    rationale:
      "MCP auto-discovery + hook execution model; best runtime semantics in the corpus, CLAUDE.md as philosophy.",
    tier: "implementation",
  },
  {
    order: 6,
    source_slug: "outline",
    source_type: "repo",
    rationale:
      "Transport-agnostic command layer (MCP-for-free when built right); security-as-default; the mature adopter exemplar.",
    tier: "implementation",
  },
  {
    order: 7,
    source_slug: "qmd",
    source_type: "repo",
    rationale:
      "marketplace.json packaging + skill frontmatter guardrails + EBNF query DSL; the ship-it-today SoNash template.",
    tier: "implementation",
  },
  {
    order: 8,
    source_slug: "docling",
    source_type: "repo",
    rationale:
      "Plugin system via pluggy + ASR pipeline -> unified DoclingDocument; multi-format unified output exemplar with MIT license.",
    tier: "implementation",
  },
  {
    order: 9,
    source_slug: "unstructured",
    source_type: "repo",
    rationale:
      "FileType enum as self-describing registry; strategy fallback with dependency_exists(); production-grade partition() router.",
    tier: "implementation",
  },
  {
    order: 10,
    source_slug: "vikparuchuri-marker",
    source_type: "repo",
    rationale:
      "METHOD_REGISTRY + SCORE_REGISTRY; comparative benchmarks as first-class infrastructure.",
    tier: "implementation",
  },
  {
    order: 11,
    source_slug: "firecrawl",
    source_type: "repo",
    rationale: "scrapeURL engine-fallback chain; 19-line CLAUDE.md; capability-gated testing.",
    tier: "implementation",
  },
  {
    order: 12,
    source_slug: "crawl4ai",
    source_type: "repo",
    rationale:
      "FilterChain + 55+ extraction strategies; hook lifecycle; the Apache-2.0 alternative when other clusters are copyleft-blocked.",
    tier: "implementation",
  },
];

// Mental model.
const mentalModel = {
  interest_shifts: [
    "Self-describing registries went from niche to dominant recommendation (12 sources vs 2 in wave5-baseline)",
    "Eval harness moved from 'flagged gap' to 'concrete prior art' (GitNexus + autoresearch + marker + qmd)",
    "Local-first media stack consolidated (pytubefix + moviepy + FAISS + Whisper as cross-corpus consensus)",
    "Confidence tagging newly surfaced (graphify + GitNexus, not present in wave5-baseline)",
    "Absorb-step newly named as the missing pipeline edge (Karpathy + farzaa)",
  ],
  confidence_shifts: [
    { theme: "Self-describing registries", from: "weak", to: "strong" },
    { theme: "Eval harness as prerequisite to skill N+1", from: "weak", to: "medium" },
    { theme: "Transport-agnostic command layer", from: "medium", to: "strong" },
    { theme: "Caption-first local-first media", from: "medium", to: "strong" },
  ],
  emerging_focus_tags: [
    "evaluation-harness",
    "confidence-tagging",
    "absorb-step",
    "skill-retirement",
    "capability-gated-testing",
    "marketplace-json",
    "rpc-health-pattern",
    "pii-tokenize-round-trip",
    "ambient-orchestration",
    "signs-pattern",
  ],
  date_range: `2026-04-13 to ${today}`,
};

// Changes since previous (re-synthesis only).
const changesSincePrevious = {
  themes: {
    new: [
      "Confidence tagging on extraction candidates",
      "LLM Wiki / absorb step",
      "External-contract monitoring as CI pattern",
      "OCR unified-output thesis",
      "Meta-skills / Signs pattern",
    ],
    removed: [],
    strengthened: [
      "Self-describing registries (2 sources -> 12 sources)",
      "Eval harness (gap -> concrete prior art)",
      "Caption-first local-first (new convergence)",
    ],
    weakened: [],
  },
  candidates: {
    new: [
      "confidence_tagging_taxonomy",
      "three_layer_knowledge_architecture",
      "skill_install_plus_version_stamping",
      "llm_wiki_ingest_query_lint",
      "pii_tokenize_round_trip_pattern",
    ],
    promoted: ["scrapeurl_engine_fallback_chain", "mcp_auto_discovery_from_cli_metadata"],
    demoted: [],
  },
  gaps: {
    filled: [],
    new: [
      "absorb_step_in_knowledge_pipeline",
      "eval_harness_measurement_infrastructure",
      "confidence_tagging_on_extraction_candidates",
    ],
  },
  confidence_shifts: [
    { theme: "Self-describing registries", from: "weak", to: "strong" },
    { theme: "Transport-agnostic command layer", from: "medium", to: "strong" },
    { theme: "Caption-first local-first media", from: "medium", to: "strong" },
  ],
  contradictions: [],
  source_impact: [
    {
      source_slug: "surya",
      impact: "new (corpus-grew): contributed to OCR unified-output theme as Quick-scan stub",
    },
    {
      source_slug: "tesseract",
      impact: "new (corpus-grew): contributed to OCR unified-output theme as Quick-scan stub",
    },
    {
      source_slug: "abhigyanpatwari-gitnexus",
      impact: "high: keystone source for eval-harness + MCP-contract + Signs themes",
    },
    {
      source_slug: "karpathy-gist-442a6bf",
      impact: "high: named the LLM Wiki pattern that reframes SoNash knowledge plumbing",
    },
    {
      source_slug: "farzaa-gist-c35ac0cf",
      impact: "high: concrete Personal Wiki Skill template for T24 absorb-step work",
    },
  ],
};

// Build conformant synthesis object.
const synthesis = {
  schema_version: "2.0",
  generated_at: now,
  paradigm: "thematic",
  mode: "re-synthesis",
  sources_included: Array.from(sourceBySlug.values()),
  sources_excluded: [],
  themes: transformedThemes,
  ecosystem_gaps: gaps,
  fit_portfolio: {
    refreshed_at: now,
    candidates: transformedCandidates,
  },
  knowledge_map: knowledgeMap,
  opportunity_matrix: opportunities,
  reading_chain: readingChain,
  mental_model: mentalModel,
  changes_since_previous: changesSincePrevious,
};

// Validate against schema.
const { validate } = require(path.resolve("scripts/lib/analysis-schema.js"));
const result = validate(synthesis, "synthesis");
if (!result.success) {
  console.error("VALIDATION FAILED:");
  console.error(result.error);
  process.exit(1);
}

fs.writeFileSync(
  ".research/analysis/synthesis/synthesis.json",
  JSON.stringify(synthesis, null, 2) + "\n"
);
console.log(
  `synthesis.json PASSED schema validation: ${synthesis.themes.length} themes, ${synthesis.fit_portfolio.candidates.length} candidates (deduped), ${synthesis.ecosystem_gaps.length} gaps, ${synthesis.opportunity_matrix.length} opportunities`
);
