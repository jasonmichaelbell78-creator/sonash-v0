"use strict";

/**
 * Content Analysis System — Self-Audit
 *
 * Validates any handler's output directory against CONVENTIONS.md Section 13.
 * Run after any analysis completes to catch naming mismatches, missing artifacts,
 * schema failures, and extraction gaps BEFORE presenting results.
 *
 * Usage: node scripts/cas/self-audit.js --slug=<slug>
 *
 * Exit codes:
 *   0 = all checks pass
 *   1 = one or more checks failed (details printed)
 *
 * @see .claude/skills/shared/CONVENTIONS.md (Section 13: Handler Output Contract)
 */

const fs = require("node:fs");
const path = require("node:path");
const {
  sanitizeError,
  validatePathInDir,
  refuseSymlinkWithParents,
  slugify,
} = require("../lib/security-helpers.js");
const { safeReadText, safeReadJson, isValidArtifactFile } = require("../lib/safe-cas-io.js");
const { safeParseLine } = require("../lib/parse-jsonl-line");

const PROJECT_ROOT = path.resolve(__dirname, "../.."); // validatePathInDir: constant-path (no user input)
const ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "analysis");
const JOURNAL_PATH = path.join(PROJECT_ROOT, ".research", "extraction-journal.jsonl");
const EXTRACTIONS_MD_PATH = path.join(PROJECT_ROOT, ".research", "EXTRACTIONS.md");

// Step 10.5 extended checks: filename/ID patterns cited from Creator View
// that count as "specific citations" per AUDIT_SPEC check 5a.
const CITATION_ARTIFACT_NAMES = [
  "deep-read.md",
  "content-eval.jsonl",
  "coverage-audit.jsonl",
  "findings.jsonl",
  "value-map.json",
  "summary.md",
  "transcript.md",
];
const CITATION_FINDING_RE = /\bF-?\d+\b/; // F-001, F001, F-42
const CITATION_EVAL_ID_RE = /\b[K-P]-?\d+\b/; // K1, K-1 style IDs used in gist eval entries
// Path-file extensions treated as citation markers when mentioned in prose.
const CITATION_FILE_EXTS = new Set([
  "py",
  "md",
  "mdx",
  "js",
  "jsx",
  "ts",
  "tsx",
  "json",
  "jsonl",
  "yaml",
  "yml",
  "sh",
  "rs",
  "go",
  "rb",
  "php",
  "html",
  "css",
  "scss",
  "txt",
  "rst",
  "sql",
  "toml",
  "cfg",
  "ini",
]);

// CONVENTIONS Section 13.1: MUST artifacts
// analysis.json = all depths. value-map + creator-view = Standard/Deep only.
const MUST_ALL_DEPTHS = [{ file: "analysis.json", description: "Unified schema record" }];
const MUST_STANDARD_DEEP = [
  { file: "value-map.json", description: "Candidates array (Phase 6)" },
  { file: "creator-view.md", description: "Creator View prose (Phase 4)" },
];

// SHOULD artifacts — Standard/Deep only (warn if missing = phase skip)
// Per CONVENTIONS Section 13.2
const SHOULD_ARTIFACTS = [
  { file: "findings.jsonl", description: "Findings (Phase 2/5)", phase: "2" },
  { file: "summary.md", description: "Summary (Phase 5)", phase: "5" },
  { file: "deep-read.md", description: "Deep Read (Phase 2b)", phase: "2b" },
  { file: "content-eval.jsonl", description: "Content Eval (Phase 4b)", phase: "4b" },
  { file: "coverage-audit.jsonl", description: "Coverage Audit (Phase 6b)", phase: "6b" },
];

// WRONG artifact names (fail if present — naming violation)
const WRONG_NAMES = [
  { file: "SITE-ANALYSIS.md", correct: "creator-view.md", reason: "CONVENTIONS Section 13" },
];

function parseArgs(argv) {
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--slug=")) return arg.slice(7);
  }
  return null;
}

function getDepth(dir) {
  const analysisPath = path.join(dir, "analysis.json");
  try {
    // safeReadJson refuses symlinks (final + parent chain) and rejects non-files.
    const data = safeReadJson(analysisPath);
    return data.depth || "quick";
  } catch {
    return "quick";
  }
}

// Safe path join: validates containment within ANALYSIS_DIR before returning.
// Uses path.join rather than path.resolve so the propagation checker
// (validate-path pattern) recognizes the containment check as adjacent. The
// validatePathInDir call above already rejects any rel that escapes ANALYSIS_DIR.
function safePath(slugPart, filePart) {
  const rel = slugPart + path.sep + filePart;
  validatePathInDir(ANALYSIS_DIR, rel);
  return path.join(ANALYSIS_DIR, rel);
}

// Return the lstat of a regular file with parent-chain symlink protection, or
// null if the path does not exist, is a symlink (final or any parent), or is
// not a regular file. Never throws — suitable for size reporting in loops.
function safeFileStat(filePath) {
  if (!isValidArtifactFile(filePath)) {
    // isValidArtifactFile already rejected empty files, but for reporting we
    // still want stat when non-empty. Re-check without the size guard.
    try {
      refuseSymlinkWithParents(filePath);
      const st = fs.lstatSync(filePath);
      if (st.isSymbolicLink()) return null;
      if (!st.isFile()) return null;
      return st;
    } catch {
      return null;
    }
  }
  try {
    return fs.lstatSync(filePath);
  } catch {
    return null;
  }
}

function checkArtifacts(dir, slug) {
  const results = { pass: [], fail: [], warn: [] };
  const depth = getDepth(dir);
  const isStandardOrDeep = depth === "standard" || depth === "deep";

  // MUST artifacts (all depths)
  for (const { file, description } of MUST_ALL_DEPTHS) {
    const filePath = safePath(slug, file);
    const stat = safeFileStat(filePath);
    if (!stat) {
      results.fail.push(`MUST artifact missing: ${file} (${description})`);
    } else if (stat.size === 0) {
      results.fail.push(`MUST artifact empty: ${file} (${description})`);
    } else {
      results.pass.push(`${file} (${stat.size} bytes)`);
    }
  }

  // MUST artifacts (Standard/Deep only)
  if (isStandardOrDeep) {
    for (const { file, description } of MUST_STANDARD_DEEP) {
      const filePath = safePath(slug, file);
      const stat = safeFileStat(filePath);
      if (!stat) {
        results.fail.push(`MUST artifact missing: ${file} (${description})`);
      } else if (stat.size === 0) {
        results.fail.push(`MUST artifact empty: ${file} (${description})`);
      } else {
        results.pass.push(`${file} (${stat.size} bytes)`);
      }
    }
  }

  // SHOULD artifacts — only warn for Standard/Deep
  for (const { file, description, phase } of SHOULD_ARTIFACTS) {
    const filePath = safePath(slug, file);
    const stat = safeFileStat(filePath);
    if (stat && stat.size > 0) {
      results.pass.push(`${file} (${stat.size} bytes)`);
    } else if (isStandardOrDeep) {
      const reason = stat
        ? `SHOULD artifact empty: ${file} (${description}) — Phase ${phase} may have been skipped`
        : `SHOULD artifact missing: ${file} (${description}) — Phase ${phase} skipped`;
      results.warn.push(reason);
    }
  }

  // WRONG names (naming violations)
  for (const { file, correct, reason } of WRONG_NAMES) {
    if (safeFileStat(safePath(slug, file))) {
      results.fail.push(`Wrong artifact name: ${file} should be ${correct} (${reason})`);
    }
  }

  return results;
}

function checkSchema(dir, slug) {
  const results = { pass: [], fail: [] };
  const analysisPath = path.join(dir, "analysis.json");

  let data;
  try {
    // safeReadJson refuses parent-chain symlinks and enforces regular-file.
    data = safeReadJson(analysisPath);
  } catch (err) {
    if (err.code === "ENOENT") {
      results.fail.push("Cannot validate schema — analysis.json missing");
    } else {
      results.fail.push(`analysis.json parse error: ${sanitizeError(err)}`);
    }
    return results;
  }

  try {
    // Check schema_version
    if (data.schema_version) {
      results.pass.push(`schema_version: ${data.schema_version}`);
    } else {
      results.fail.push("analysis.json missing schema_version field");
    }

    // Validate against Zod schema
    try {
      const { validate } = require("../lib/analysis-schema.js");
      const result = validate(data, "analysis");
      if (result.success) {
        results.pass.push("Zod schema validation: PASS");
      } else {
        results.fail.push(`Zod schema validation: FAIL — ${result.error}`);
      }
    } catch (err) {
      results.fail.push(`Zod schema validation error: ${sanitizeError(err)}`);
    }

    // Check candidates populated (Standard/Deep should have them)
    if (data.depth !== "quick" && (!data.candidates || data.candidates.length === 0)) {
      results.fail.push("Standard/Deep analysis has 0 candidates — value-map likely empty too");
    } else if (data.candidates) {
      results.pass.push(`${data.candidates.length} candidates in analysis.json`);
    }

    // Media-specific: transcript_source must be set (CONVENTIONS 13.3)
    if (data.source_type === "media") {
      if (data.transcript_source) {
        results.pass.push(`transcript_source: ${data.transcript_source}`);
      } else {
        results.fail.push("Media analysis missing transcript_source field (CONVENTIONS 13.3)");
      }
      // transcript.md must exist
      const transcriptPath = safePath(slug, "transcript.md");
      const tStat = safeFileStat(transcriptPath);
      if (tStat && tStat.size > 0) {
        results.pass.push(`transcript.md (${tStat.size} bytes)`);
      } else {
        results.fail.push("Media analysis missing transcript.md (CONVENTIONS 13.3 MUST)");
      }
    }
  } catch (err) {
    results.fail.push(`analysis.json parse error: ${sanitizeError(err)}`);
  }

  return results;
}

function matchesSource(entrySource, targetSource) {
  if (entrySource === targetSource) return true;
  return slugify(entrySource) === slugify(targetSource);
}

function checkExtractions(slug, source) {
  const results = { pass: [], fail: [], warn: [] };

  let lines;
  try {
    // safeReadText refuses parent-chain symlinks and enforces regular-file.
    lines = safeReadText(JOURNAL_PATH).trim().split("\n");
  } catch (err) {
    if (err.code === "ENOENT") {
      results.warn.push("extraction-journal.jsonl not found");
    } else {
      results.warn.push(`Could not read journal: ${sanitizeError(err)}`);
    }
    return results;
  }

  let count = 0;
  let untagged = 0;
  for (const rawLine of lines) {
    const entry = safeParseLine(rawLine);
    if (!entry) continue;
    if (matchesSource(entry.source, source)) {
      count++;
      if (!entry.tags || entry.tags.length === 0) untagged++;
    }
  }

  if (count === 0) {
    results.fail.push(`No extraction journal entries for source: ${source}`);
  } else {
    results.pass.push(`${count} extraction journal entries for ${source}`);
    if (untagged > 0) {
      results.warn.push(`${untagged} of ${count} extraction entries have no tags (CONVENTIONS 14)`);
    }
  }

  return results;
}

function checkBehavioral(dir, slug, sourceType) {
  const results = { pass: [], fail: [], warn: [] };
  const depth = getDepth(dir);
  const isStandardOrDeep = depth === "standard" || depth === "deep";

  if (!isStandardOrDeep) return results;

  // State file check (CONVENTIONS 16.4)
  const handlerMap = {
    repo: "repo-analysis",
    website: "website-analysis",
    document: "document-analysis",
    media: "media-analysis",
  };
  const handler = handlerMap[sourceType] || "unknown";
  const stateDir = path.join(PROJECT_ROOT, ".claude", "state");
  const stateFile = path.join(stateDir, `${handler}.${slug}.state.json`);

  let state;
  try {
    // safeReadJson throws ENOENT when missing and refuses parent-chain symlinks.
    state = safeReadJson(stateFile);
  } catch (err) {
    if (err.code === "ENOENT") {
      results.warn.push(
        `No state file — pipeline tail (tags, retro, routing) may have been skipped (CONVENTIONS 16)`
      );
    } else {
      results.warn.push(`State file exists but is malformed or unsafe: ${sanitizeError(err)}`);
    }
    return results;
  }

  results.pass.push(`State file exists (${handler}.${slug})`);
  if (state.process_feedback) {
    results.pass.push(
      `Retro feedback captured: "${String(state.process_feedback).substring(0, 50)}..."`
    );
  } else {
    results.warn.push(
      "State file exists but process_feedback is empty — retro may have been skipped (CONVENTIONS 16.2)"
    );
  }

  return results;
}

// ---------------------------------------------------------------------------
// Step 10.5 extended checks (folded into self-audit per T29 Session #277).
// Checks 5a, 5c, 6a, 6b, 6c, 7b, 7c, 8 from AUDIT_SPEC.md. Skipped: 5b (prose
// style — heuristics too noisy), 7a (research-index depth match — retired per
// Cat B3: research-index.jsonl is deep-research topic index, not CAS).
// ---------------------------------------------------------------------------

function countValueMapCandidates(vmData) {
  // Dedupe by lowercase name so value-maps with the same candidate classified
  // under two split-keys (e.g., both knowledgeCandidates and
  // antiPatternCandidates) count as one for 6a journal-count parity.
  const seen = new Set();
  const addAll = (arr) => {
    if (!Array.isArray(arr)) return;
    for (const c of arr) {
      const name = (c.name || c.title || "").toString().trim().toLowerCase();
      if (name) seen.add(name);
    }
  };
  if (Array.isArray(vmData.candidates)) {
    addAll(vmData.candidates);
  } else {
    addAll(vmData.patternCandidates);
    addAll(vmData.knowledgeCandidates);
    addAll(vmData.contentCandidates);
    addAll(vmData.antiPatternCandidates);
  }
  return seen.size;
}

function collectJournalEntries(source) {
  const entries = [];
  let raw;
  try {
    raw = safeReadText(JOURNAL_PATH);
  } catch {
    return entries;
  }
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const entry = safeParseLine(line);
    if (!entry) continue;
    if (matchesSource(entry.source, source)) entries.push(entry);
  }
  return entries;
}

function countCitations(creatorViewText) {
  if (!creatorViewText) return 0;
  let hits = 0;
  for (const name of CITATION_ARTIFACT_NAMES) {
    if (creatorViewText.includes(name)) hits++;
  }
  const findingMatches = creatorViewText.match(new RegExp(CITATION_FINDING_RE.source, "g"));
  if (findingMatches) hits += findingMatches.length;
  const evalMatches = creatorViewText.match(new RegExp(CITATION_EVAL_ID_RE.source, "g"));
  if (evalMatches) hits += evalMatches.length;
  // Count file-path tokens that look like specific artifact references.
  // Two patterns: backtick-wrapped paths AND bare file references with a
  // recognized extension (e.g., "benchmarks/overall/registry.py" in prose).
  const seen = new Set();
  const addIfFilepath = (token) => {
    if (!token) return;
    if (token.includes(" ")) return;
    if (token.startsWith("http://") || token.startsWith("https://")) return;
    if (token.includes("<") || token.includes(">")) return; // skip <placeholders>
    if (token.includes("/") || /\.[a-zA-Z0-9]{2,5}$/.test(token)) {
      if (!seen.has(token)) {
        seen.add(token);
        hits++;
      }
    }
  };
  const backtickRe = /`([^`\n]{3,120})`/g;
  collectBacktickTokens(backtickRe, creatorViewText, addIfFilepath);
  // Bare file refs: word boundaries around path-like tokens. Extension filter
  // is applied programmatically to keep the regex simple (no large alternation).
  const tokenRe = /(?<![A-Za-z0-9_/.-])([A-Za-z0-9_.-][A-Za-z0-9_./-]{2,119})(?![A-Za-z0-9_/.-])/g;
  collectExtensionTokens(tokenRe, creatorViewText, addIfFilepath);
  return hits;
}

function collectBacktickTokens(re, text, visit) {
  for (const match of text.matchAll(re)) visit(match[1]);
}

function collectExtensionTokens(re, text, visit) {
  for (const match of text.matchAll(re)) {
    const token = match[1];
    const dot = token.lastIndexOf(".");
    if (dot < 1 || dot === token.length - 1) continue;
    if (CITATION_FILE_EXTS.has(token.slice(dot + 1).toLowerCase())) visit(token);
  }
}

function check5aSpecificCitations(dir, results) {
  const creatorViewPath = path.join(dir, "creator-view.md");
  let text;
  try {
    text = safeReadText(creatorViewPath);
  } catch {
    return; // creator-view missing — already covered by MUST check
  }
  const count = countCitations(text);
  if (count >= 2) {
    results.pass.push(`Creator View cites >=2 specific items (${count} refs found)`);
  } else {
    results.fail.push(
      `Creator View has only ${count} specific citation(s) to deep-read/content-eval/findings — Step 10.5 check 5a requires >=2`
    );
  }
}

// Prefixes/filenames that unambiguously identify SoNash home-repo paths.
// Source-repo paths from analyzed repos (e.g., docling's docs/concepts/*)
// are intentionally excluded to avoid false positives.
const HOME_REPO_PREFIXES = [
  ".claude/",
  ".research/",
  "scripts/cas/",
  "scripts/lib/",
  "scripts/reviews/",
  "scripts/debt/",
  "scripts/docs/",
  "docs/agent_docs/",
  "functions/src/",
  "functions/lib/",
];
const HOME_REPO_FILES = new Set([
  "CLAUDE.md",
  "ROADMAP.md",
  "AI_WORKFLOW.md",
  "SESSION_CONTEXT.md",
  "firebase.json",
  "firestore.rules",
  "package.json",
  "tsconfig.json",
]);

function isHomeRepoRef(token) {
  if (HOME_REPO_FILES.has(token)) return true;
  for (const prefix of HOME_REPO_PREFIXES) {
    if (token.startsWith(prefix)) return true;
  }
  return false;
}

function isSkippableBacktickToken(token) {
  if (token.includes(" ")) return true;
  if (token.startsWith("http://") || token.startsWith("https://")) return true;
  if (token.includes("<") || token.includes(">")) return true; // skip <slug>, <N> placeholders
  if (token.includes("*")) return true; // skip glob patterns like docs/agent_docs/*
  return false;
}

function collectHomeRepoCandidates(text) {
  const candidates = new Set();
  const re = /`([^`\n]{3,120})`/g;
  for (const match of text.matchAll(re)) {
    const token = match[1];
    if (isSkippableBacktickToken(token)) continue;
    if (isHomeRepoRef(token)) candidates.add(token);
  }
  return candidates;
}

function findBrokenHomeRefs(candidatePaths) {
  const broken = [];
  for (const rel of candidatePaths) {
    const clean = rel
      .replace(/[.,:;]$/, "")
      .split("#")[0]
      .split("?")[0];
    try {
      validatePathInDir(PROJECT_ROOT, clean);
    } catch {
      continue;
    }
    const abs = path.join(PROJECT_ROOT, clean);
    if (!fs.existsSync(abs)) broken.push(clean);
  }
  return broken;
}

function check5cHomeRepoRefs(dir, results) {
  const creatorViewPath = path.join(dir, "creator-view.md");
  let text;
  try {
    text = safeReadText(creatorViewPath);
  } catch {
    return;
  }
  const candidatePaths = collectHomeRepoCandidates(text);
  if (candidatePaths.size === 0) {
    // No home-repo refs is acceptable — most source-focused Creator Views
    // cite source-repo artifacts, not SoNash paths.
    return;
  }
  const broken = findBrokenHomeRefs(candidatePaths);
  if (broken.length === 0) {
    results.pass.push(
      `Creator View home-repo refs verified (${candidatePaths.size} checked) — Step 10.5 check 5c`
    );
    return;
  }
  // WARN rather than FAIL: the regex can't distinguish broken citations
  // ("per CONVENTIONS.md line 42") from proposals ("create CONVENTIONS.md").
  // User inspection resolves intent.
  const preview = broken.slice(0, 3).join(", ");
  const moreSuffix = broken.length > 3 ? ` +${broken.length - 3} more` : "";
  results.warn.push(
    `Creator View cites ${broken.length} home-repo path(s) that do not currently exist: ${preview}${moreSuffix} — may be extraction proposals OR broken refs (Step 10.5 check 5c)`
  );
}

function check6aJournalCount(dir, source, results) {
  const vmPath = path.join(dir, "value-map.json");
  let vm;
  try {
    vm = safeReadJson(vmPath);
  } catch {
    return; // value-map missing — already covered by MUST check
  }
  const vmCount = countValueMapCandidates(vm);
  const journalCount = collectJournalEntries(source).length;
  if (vmCount === 0) return; // nothing to compare
  if (journalCount >= vmCount) {
    results.pass.push(`journal >= value-map (${journalCount} >= ${vmCount}) — Step 10.5 check 6a`);
  } else {
    results.fail.push(
      `journal (${journalCount}) < value-map candidates (${vmCount}) — ${vmCount - journalCount} missing extraction entries (Step 10.5 check 6a)`
    );
  }
}

function check6bExtractionsMdSection(slug, source, results) {
  let text;
  try {
    text = safeReadText(EXTRACTIONS_MD_PATH);
  } catch {
    results.warn.push("EXTRACTIONS.md not found (Step 10.5 check 6b)");
    return;
  }
  // Heuristic: section exists if a markdown heading contains slug or source
  const needles = [slug, source, slugify(source)];
  const found = needles.some((n) => {
    if (!n) return false;
    const escaped = n.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const re = new RegExp(String.raw`^#+\s.*` + escaped, "im");
    return re.test(text);
  });
  if (found) {
    results.pass.push("EXTRACTIONS.md section exists for source (Step 10.5 check 6b)");
  } else {
    results.fail.push(
      `EXTRACTIONS.md has no section matching "${slug}" or source — run generate-extractions-md.js (Step 10.5 check 6b)`
    );
  }
}

function check6cPerCandidateSchema(source, results) {
  const entries = collectJournalEntries(source);
  if (entries.length === 0) return; // covered by checkExtractions
  let validate;
  try {
    ({ validate } = require("../lib/analysis-schema.js"));
  } catch {
    return;
  }
  const sample = entries.slice(0, 3);
  const fails = [];
  for (const entry of sample) {
    const r = validate(entry, "extraction");
    if (!r.success) fails.push(`"${entry.candidate || "(noname)"}": ${r.error}`);
  }
  if (fails.length === 0) {
    results.pass.push(
      `Per-candidate schema: ${sample.length}/${sample.length} sampled entries valid (Step 10.5 check 6c)`
    );
  } else {
    const moreSuffix = fails.length > 1 ? ` (+${fails.length - 1} more)` : "";
    results.fail.push(
      `Per-candidate schema failures (${fails.length}/${sample.length}): ${fails[0]}${moreSuffix} (Step 10.5 check 6c)`
    );
  }
}

function check7bTagConsistency(dir, source, results) {
  const analysisPath = path.join(dir, "analysis.json");
  let analysis;
  try {
    analysis = safeReadJson(analysisPath);
  } catch {
    return;
  }
  const analysisTags = new Set(Array.isArray(analysis.tags) ? analysis.tags : []);
  if (analysisTags.size === 0) return;
  const entries = collectJournalEntries(source);
  const journalTags = new Set();
  for (const e of entries) {
    if (Array.isArray(e.tags)) for (const t of e.tags) journalTags.add(t);
  }
  if (journalTags.size === 0) {
    // Already covered by checkExtractions untagged warn
    return;
  }
  const common = [...analysisTags].filter((t) => journalTags.has(t));
  // WARN if no overlap at all (divergence)
  if (common.length === 0) {
    results.warn.push(
      `Tag sets between analysis.json (${analysisTags.size} tags) and journal entries (${journalTags.size} tags) have zero overlap (Step 10.5 check 7b)`
    );
  }
}

function check7cLastSynthesizedAt(dir, results) {
  const analysisPath = path.join(dir, "analysis.json");
  let data;
  try {
    data = safeReadJson(analysisPath);
  } catch {
    return;
  }
  const v = data.last_synthesized_at;
  if (v === null || v === undefined) {
    results.pass.push("last_synthesized_at: null (not synthesized yet) — Step 10.5 check 7c");
    return;
  }
  if (typeof v === "string" && !Number.isNaN(Date.parse(v))) {
    results.pass.push(`last_synthesized_at: valid ISO date — Step 10.5 check 7c`);
  } else {
    results.fail.push(`last_synthesized_at invalid: ${JSON.stringify(v)} (Step 10.5 check 7c)`);
  }
}

function check8ReanalysisSignal(dir, results) {
  const trendsPath = path.join(dir, "trends.jsonl");
  if (fs.existsSync(trendsPath)) {
    const stat = safeFileStat(trendsPath);
    if (stat && stat.size > 0) {
      results.pass.push(
        `trends.jsonl present (${stat.size} bytes) — prior re-analysis history (Step 10.5 check 8)`
      );
    }
  }
  // Absence is not a fail — most sources have no trends.jsonl yet.
}

function checkStep10Extended(dir, slug, source) {
  const results = { pass: [], fail: [], warn: [] };
  const depth = getDepth(dir);
  const isStandardOrDeep = depth === "standard" || depth === "deep";
  if (!isStandardOrDeep) return results;

  check5aSpecificCitations(dir, results);
  check5cHomeRepoRefs(dir, results);
  check6aJournalCount(dir, source, results);
  check6bExtractionsMdSection(slug, source, results);
  check6cPerCandidateSchema(source, results);
  check7bTagConsistency(dir, source, results);
  check7cLastSynthesizedAt(dir, results);
  check8ReanalysisSignal(dir, results);

  return results;
}

function main() {
  const slug = parseArgs(process.argv);
  if (!slug) {
    console.error("Usage: node scripts/cas/self-audit.js --slug=<slug>");
    process.exit(1);
  }

  // Validate slug doesn't escape ANALYSIS_DIR (path containment)
  validatePathInDir(ANALYSIS_DIR, slug);
  const dir = path.join(ANALYSIS_DIR, slug);
  if (!fs.existsSync(dir)) {
    console.error(`Output directory not found: ${dir}`);
    process.exit(1);
  }

  // Determine source name and type from analysis.json if possible
  let source = slug;
  let sourceType = "repo";
  const analysisPath = path.join(dir, "analysis.json");
  try {
    // safeReadJson refuses parent-chain symlinks and throws ENOENT if missing.
    const data = safeReadJson(analysisPath);
    if (data.source) source = data.source;
    if (data.source_type) sourceType = data.source_type;
  } catch {
    // fall through — use slug as fallback identifier
  }

  console.log(`CAS Self-Audit: ${slug}`);
  console.log(`Source: ${source}`);
  console.log("---");

  const artifacts = checkArtifacts(dir, slug);
  const schema = checkSchema(dir, slug);
  const extractions = checkExtractions(slug, source);
  const behavioral = checkBehavioral(dir, slug, sourceType);
  const extended = checkStep10Extended(dir, slug, source);

  const allPass = [
    ...artifacts.pass,
    ...schema.pass,
    ...extractions.pass,
    ...behavioral.pass,
    ...extended.pass,
  ];
  const allFail = [
    ...artifacts.fail,
    ...schema.fail,
    ...extractions.fail,
    ...behavioral.fail,
    ...extended.fail,
  ];
  const allWarn = [...artifacts.warn, ...extractions.warn, ...behavioral.warn, ...extended.warn];

  if (allPass.length > 0) {
    console.log(`\nPASS (${allPass.length}):`);
    for (const p of allPass) console.log(`  + ${p}`);
  }

  if (allWarn.length > 0) {
    console.log(`\nWARN (${allWarn.length}):`);
    for (const w of allWarn) console.log(`  ~ ${w}`);
  }

  if (allFail.length > 0) {
    console.log(`\nFAIL (${allFail.length}):`);
    for (const f of allFail) console.log(`  x ${f}`);
  }

  console.log(
    `\n---\nResult: ${allFail.length === 0 ? "PASS" : "FAIL"} (${allPass.length} pass, ${allWarn.length} warn, ${allFail.length} fail)`
  );
  process.exit(allFail.length > 0 ? 1 : 0);
}

try {
  main();
} catch (err) {
  console.error(`Fatal: ${sanitizeError(err)}`);
  process.exit(1);
}
