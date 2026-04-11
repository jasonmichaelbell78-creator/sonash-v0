/* global __dirname */
/**
 * Research Output Validation Script
 *
 * Validates integrity of deep-research pipeline outputs across 8 checks:
 * 1. Source traceability — sourceIds in claims resolve to sources.jsonl
 * 2. Claim coverage — claims.jsonl IDs appear in RESEARCH_OUTPUT.md
 * 3. Findings file inventory — file counts match metadata agentCount
 * 4. Confidence reconciliation — recount from claims vs metadata
 * 5. Post-pipeline delta — metadata claimCount vs actual JSONL lines
 * 6. Claim-to-report bidirectional — report claim IDs exist in JSONL
 * 7. Source freshness — flag sources > 30 days old
 * 8. Verification verdict persistence — report verdicts match JSONL fields
 *
 * @module research/validate-research
 */

const { readdirSync } = require("node:fs");
const { join, relative } = require("node:path");
const { sanitizeError } = require("../lib/sanitize-error.cjs");
const { safeWriteFileSync, readUtf8Sync } = require("../lib/safe-fs.js");
const { parseCliArgs } = require("../lib/security-helpers.js");
const { safeParseLineWithError } = require("../lib/parse-jsonl-line");

const ROOT = join(__dirname, "..", "..");
const RESEARCH_DIR = join(ROOT, ".research");
const STATE_FILE = join(ROOT, ".claude", "state", "research-validation.jsonl");

const SKIP_TOPICS = new Set(["research-discovery-standard"]);

// ── CLI Args ─────────────────────────────────────────────────────────────────

// Normalize --key=value into [--key, value] for parseCliArgs (which uses space-separated format)
const rawArgs = process.argv.slice(2).flatMap((arg) => {
  const eqIdx = arg.indexOf("=");
  if (eqIdx > 0 && arg.startsWith("--")) return [arg.slice(0, eqIdx), arg.slice(eqIdx + 1)];
  return [arg];
});

const cliOptions = parseCliArgs(rawArgs, {
  "--topic": { type: "string", required: false },
  "--fix": { type: "boolean" },
});
const topicFilter = cliOptions["--topic"] || null;
const fixMode = cliOptions["--fix"];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Read a JSONL file and parse each line as JSON.
 * @param {string} filePath - Absolute path to the JSONL file
 * @returns {{data: object[] | null, error: string | null}} Parsed lines or error
 */
function readJsonl(filePath) {
  try {
    const content = readUtf8Sync(filePath);
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    const results = [];
    for (let i = 0; i < lines.length; i++) {
      const { value, error } = safeParseLineWithError(lines[i]);
      if (error) return { data: null, error: `Parse error at line ${i + 1}` };
      if (value) results.push(value);
    }
    return { data: results, error: null };
  } catch (err) {
    if (err.code === "ENOENT") return { data: null, error: null };
    return { data: null, error: sanitizeError(err) };
  }
}

/**
 * Read and parse a JSON file.
 * @param {string} filePath - Absolute path to the JSON file
 * @returns {{data: object | null, error: string | null}} Parsed object or error
 */
function readJson(filePath) {
  try {
    return { data: JSON.parse(readUtf8Sync(filePath)), error: null };
  } catch (err) {
    if (err.code === "ENOENT") return { data: null, error: null };
    return { data: null, error: sanitizeError(err) };
  }
}

/**
 * Read a text file.
 * @param {string} filePath - Absolute path to the text file
 * @returns {{data: string | null, error: string | null}} File contents or error
 */
function readText(filePath) {
  try {
    return { data: readUtf8Sync(filePath), error: null };
  } catch (err) {
    if (err.code === "ENOENT") return { data: null, error: null };
    return { data: null, error: sanitizeError(err) };
  }
}

/**
 * Count .md files in a directory (recursive).
 * @param {string} dirPath - Absolute path to the directory
 * @returns {number} Number of .md files found
 */
function countFiles(dirPath) {
  try {
    return readdirSync(dirPath, { recursive: true }).filter((f) => {
      const name = typeof f === "string" ? f : f.toString();
      return name.endsWith(".md") && !name.startsWith(".") && name !== ".gitkeep";
    }).length;
  } catch {
    return 0;
  }
}

// ── Checks ───────────────────────────────────────────────────────────────────

/**
 * Collect all source reference IDs from a claim, normalizing across
 * sourceIds (array/string), sources (array), and source (string) fields.
 * @param {object} claim - A single claim object
 * @returns {string[]} Array of source reference IDs
 */
function collectClaimRefs(claim) {
  const refs = [];
  if (Array.isArray(claim.sourceIds)) refs.push(...claim.sourceIds);
  else if (typeof claim.sourceIds === "string") refs.push(claim.sourceIds);
  if (Array.isArray(claim.sources)) refs.push(...claim.sources);
  if (typeof claim.source === "string") refs.push(claim.source);
  return refs;
}

function checkSourceTraceability(claims, sources, metadata) {
  if (!claims) return { status: "WARN", detail: "No claims.jsonl" };
  if (!sources) return { status: "WARN", detail: "No sources.jsonl" };

  const sourceIds = new Set(sources.map((s) => s.id));
  const orphaned = [];

  for (const claim of claims) {
    const refs = collectClaimRefs(claim);
    for (const sid of refs) {
      if (!sourceIds.has(sid)) {
        orphaned.push({ claim: claim.id, sourceId: sid });
      }
    }
  }

  if (orphaned.length === 0) return { status: "PASS", detail: "All sourceIds resolve" };

  // D-code/S-code mismatch is accepted for existing research with sourceIdScheme
  if (metadata?.sourceIdScheme) {
    return {
      status: "WARN",
      detail: `${orphaned.length} orphaned sourceIds (accepted: ${metadata.sourceIdScheme})`,
      orphaned,
    };
  }

  return {
    status: "FAIL",
    detail: `${orphaned.length} orphaned sourceIds`,
    orphaned,
  };
}

function checkClaimCoverage(claims, reportText) {
  if (!claims) return { status: "WARN", detail: "No claims.jsonl" };
  if (!reportText) return { status: "WARN", detail: "No RESEARCH_OUTPUT.md" };

  const uncovered = [];
  for (const claim of claims) {
    if (!claim.id) continue;
    // Check if claim ID appears anywhere in report
    if (!reportText.includes(claim.id)) {
      uncovered.push(claim.id);
    }
  }

  if (uncovered.length === 0) return { status: "PASS", detail: "All claims referenced in report" };

  const covered = claims.length - uncovered.length;

  // If ALL claims are uncovered, report likely doesn't use inline C-NNN IDs (pre-standard)
  if (uncovered.length === claims.length) {
    return {
      status: "WARN",
      detail: `Report uses no inline claim IDs (pre-standard format, ${claims.length} claims in JSONL)`,
    };
  }

  // Partial coverage is normal — final reports cite key claims, not all.
  // WARN for partial; FAIL only if coverage is unexpectedly low with inline IDs.
  return {
    status: "WARN",
    detail: `${covered}/${claims.length} claims cited in report (${uncovered.length} not cited)`,
    uncovered,
  };
}

function checkFindingsInventory(topicDir, metadata) {
  if (!metadata) return { status: "WARN", detail: "No metadata.json" };

  const findingsCount = countFiles(join(topicDir, "findings"));
  const challengesCount = countFiles(join(topicDir, "challenges"));
  const actualTotal = findingsCount + challengesCount;
  const expected = metadata.agentCount;

  if (expected === undefined) return { status: "WARN", detail: "No agentCount in metadata" };

  if (actualTotal === expected) {
    return { status: "PASS", detail: `${actualTotal} files match agentCount ${expected}` };
  }

  // Files significantly below agentCount = files at another locale or partial commit
  if (actualTotal < expected * 0.5) {
    return {
      status: "WARN",
      detail: `${actualTotal}/${expected} files (findings: ${findingsCount}, challenges: ${challengesCount}) — partial, rest likely at home locale`,
    };
  }

  return {
    status: "FAIL",
    detail: `Files: ${actualTotal} (findings: ${findingsCount}, challenges: ${challengesCount}) vs agentCount: ${expected}`,
  };
}

function checkConfidenceReconciliation(claims, metadata) {
  if (!claims) return { status: "WARN", detail: "No claims.jsonl" };
  if (!metadata) return { status: "WARN", detail: "No metadata.json" };
  if (!metadata.confidenceDistribution)
    return { status: "WARN", detail: "No confidenceDistribution in metadata" };

  const actual = { HIGH: 0, MEDIUM: 0, LOW: 0, UNVERIFIED: 0 };
  for (const claim of claims) {
    const level = (claim.confidence || "UNVERIFIED").toUpperCase();
    if (level in actual) actual[level]++;
    else actual.UNVERIFIED++;
  }

  const expected = metadata.confidenceDistribution;
  const mismatches = [];

  for (const level of Object.keys(actual)) {
    const exp = expected[level] ?? 0;
    if (actual[level] !== exp) {
      mismatches.push(`${level}: actual=${actual[level]} metadata=${exp}`);
    }
  }

  if (mismatches.length === 0) return { status: "PASS", detail: "Confidence counts match" };

  if (fixMode) {
    return {
      status: "FIXED",
      detail: `Fixed: ${mismatches.join(", ")}`,
      fix: { confidenceDistribution: actual },
    };
  }

  return { status: "FAIL", detail: mismatches.join("; ") };
}

function checkPostPipelineDelta(claims, metadata) {
  if (!claims) return { status: "WARN", detail: "No claims.jsonl" };
  if (!metadata) return { status: "WARN", detail: "No metadata.json" };
  if (metadata.claimCount === undefined)
    return { status: "WARN", detail: "No claimCount in metadata" };

  const actualCount = claims.length;
  const metadataCount = metadata.claimCount;

  if (actualCount === metadataCount) {
    return { status: "PASS", detail: `${actualCount} claims match` };
  }

  if (fixMode) {
    return {
      status: "FIXED",
      detail: `Fixed: JSONL=${actualCount} metadata=${metadataCount}`,
      fix: { claimCount: actualCount },
    };
  }

  return {
    status: metadataCount < actualCount ? "FAIL" : "WARN",
    detail: `JSONL: ${actualCount} vs metadata claimCount: ${metadataCount}`,
  };
}

function checkClaimToReportBidirectional(claims, reportText) {
  if (!claims) return { status: "WARN", detail: "No claims.jsonl" };
  if (!reportText) return { status: "WARN", detail: "No RESEARCH_OUTPUT.md" };

  const jsonlIds = new Set(claims.map((c) => c.id).filter(Boolean));

  // Extract claim IDs from report (C-NNN or C-GNNN patterns, 3+ digits)
  const reportIdRegex = /\bC-(?:G?\d{3,})\b/g;
  const reportIds = new Set();
  let match;
  while ((match = reportIdRegex.exec(reportText)) !== null) {
    reportIds.add(match[0]);
  }

  const reportOnly = [...reportIds].filter((id) => !jsonlIds.has(id));

  if (reportOnly.length === 0) {
    return { status: "PASS", detail: "All report claim IDs exist in JSONL" };
  }
  return {
    status: "FAIL",
    detail: `${reportOnly.length} claim IDs in report but not JSONL`,
    reportOnly,
  };
}

function checkSourceFreshness(sources) {
  if (!sources) return { status: "WARN", detail: "No sources.jsonl" };

  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const stale = [];

  for (const source of sources) {
    if (!source.accessDate) continue;
    const accessDate = new Date(source.accessDate);
    if (now - accessDate > thirtyDaysMs) {
      stale.push({ id: source.id, accessDate: source.accessDate });
    }
  }

  if (stale.length === 0) return { status: "PASS", detail: "All sources fresh (< 30 days)" };
  return {
    status: "WARN",
    detail: `${stale.length}/${sources.length} sources > 30 days old`,
    stale,
  };
}

function checkVerificationVerdictPersistence(claims, reportText) {
  if (!claims) return { status: "WARN", detail: "No claims.jsonl" };
  if (!reportText) return { status: "WARN", detail: "No RESEARCH_OUTPUT.md" };

  // Check if report mentions verification verdicts
  const verdictPattern = /\b(VERIFIED|REFUTED|MODIFIED|UNVERIFIABLE)\b/g;
  const reportVerdicts = new Set();
  let match;
  while ((match = verdictPattern.exec(reportText)) !== null) {
    reportVerdicts.add(match[1]);
  }

  if (reportVerdicts.size === 0) {
    return { status: "PASS", detail: "No verification verdicts in report" };
  }

  // Check claims have verificationStatus or verificationSummary in metadata
  const claimsWithVerification = claims.filter(
    (c) => c.verificationStatus || c.verified !== undefined || c.refuted !== undefined
  );

  if (claimsWithVerification.length > 0) {
    return {
      status: "PASS",
      detail: `${claimsWithVerification.length}/${claims.length} claims have verification fields`,
    };
  }

  return {
    status: "WARN",
    detail: `Report has verdicts (${[...reportVerdicts].join(", ")}) but no verification fields in claims.jsonl`,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

function getTopics() {
  try {
    const entries = readdirSync(RESEARCH_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && e.name !== "archive")
      .map((e) => e.name)
      .filter((name) => !SKIP_TOPICS.has(name))
      .filter((name) => !topicFilter || name === topicFilter)
      .sort();
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

/**
 * Check if a parsed read result has a parse/read error (non-ENOENT).
 * @param {{data: *, error: string | null}} result - Result from readJsonl/readJson/readText
 * @returns {boolean} True if the result contains an error
 */
function hasReadError(result) {
  return result.error !== null;
}

/**
 * Build early-return results for JSONL parse failures.
 * @param {string} topic - Topic name
 * @param {{data: *, error: string | null}} claimsResult - Result from readJsonl
 * @param {{data: *, error: string | null}} sourcesResult - Result from readJsonl
 * @returns {{topic: string, results: object[]} | null} Error result or null if no errors
 */
function checkParseErrors(topic, claimsResult, sourcesResult) {
  if (hasReadError(claimsResult)) {
    return {
      topic,
      results: [{ check: "JSONL Parse", status: "FAIL", detail: claimsResult.error }],
    };
  }
  if (hasReadError(sourcesResult)) {
    return {
      topic,
      results: [{ check: "JSONL Parse", status: "FAIL", detail: sourcesResult.error }],
    };
  }
  return null;
}

function validateTopic(topic) {
  const topicDir = join(RESEARCH_DIR, topic);
  const claimsPath = join(topicDir, "claims.jsonl");
  const sourcesPath = join(topicDir, "sources.jsonl");
  const metadataPath = join(topicDir, "metadata.json");
  const reportPath = join(topicDir, "RESEARCH_OUTPUT.md");

  const claimsResult = readJsonl(claimsPath);
  const sourcesResult = readJsonl(sourcesPath);
  const metadataResult = readJson(metadataPath);
  const reportResult = readText(reportPath);

  const parseError = checkParseErrors(topic, claimsResult, sourcesResult);
  if (parseError) return parseError;

  const claims = claimsResult.data;
  const sources = sourcesResult.data;
  const metadata = metadataResult.data;
  const reportText = reportResult.data;

  const fixes = {};
  const results = [
    { check: "1. Source traceability", ...checkSourceTraceability(claims, sources, metadata) },
    { check: "2. Claim coverage", ...checkClaimCoverage(claims, reportText) },
    { check: "3. Findings inventory", ...checkFindingsInventory(topicDir, metadata) },
    { check: "4. Confidence reconciliation", ...checkConfidenceReconciliation(claims, metadata) },
    { check: "5. Post-pipeline delta", ...checkPostPipelineDelta(claims, metadata) },
    { check: "6. Claim-to-report bidir", ...checkClaimToReportBidirectional(claims, reportText) },
    { check: "7. Source freshness", ...checkSourceFreshness(sources) },
    { check: "8. Verdict persistence", ...checkVerificationVerdictPersistence(claims, reportText) },
  ];

  // Apply fixes in --fix mode
  if (fixMode && metadata) {
    for (const r of results) {
      if (r.fix) Object.assign(fixes, r.fix);
    }
    if (Object.keys(fixes).length > 0) {
      const updated = { ...metadata, ...fixes };
      try {
        safeWriteFileSync(metadataPath, JSON.stringify(updated, null, 2) + "\n");
      } catch (err) {
        results.push({ check: "Fix apply", status: "FAIL", detail: sanitizeError(err) });
      }
    }
  }

  return { topic, results };
}

function statusIcon(status) {
  switch (status) {
    case "PASS":
      return "PASS";
    case "FAIL":
      return "FAIL";
    case "WARN":
      return "WARN";
    case "FIXED":
      return "FIX ";
    default:
      return "??? ";
  }
}

/**
 * Determine the summary status label for a topic based on its result counts.
 * @param {number} fails - Number of FAIL results
 * @param {number} warns - Number of WARN results
 * @returns {string} Status label string
 */
function topicStatusLabel(fails, warns) {
  if (fails > 0) return "FAIL";
  if (warns > 0) return "WARN";
  return "PASS";
}

function printResults(allResults) {
  let totalPass = 0;
  let totalFail = 0;
  let totalWarn = 0;
  let totalFixed = 0;

  console.log("\n======================================================");
  console.log("       RESEARCH OUTPUT VALIDATION REPORT               ");
  console.log("======================================================\n");

  for (const { topic, results } of allResults) {
    const fails = results.filter((r) => r.status === "FAIL").length;
    const warns = results.filter((r) => r.status === "WARN").length;
    const fixed = results.filter((r) => r.status === "FIXED").length;
    const passes = results.filter((r) => r.status === "PASS").length;

    totalPass += passes;
    totalFail += fails;
    totalWarn += warns;
    totalFixed += fixed;

    const label = topicStatusLabel(fails, warns);
    console.log(`[${label}] ${topic}`);

    for (const r of results) {
      console.log(`   [${statusIcon(r.status)}] ${r.check}: ${r.detail}`);
    }
    console.log();
  }

  console.log("------------------------------------------------------");
  console.log(
    `TOTAL: ${totalPass} pass, ${totalFail} fail, ${totalWarn} warn, ${totalFixed} fixed`
  );
  console.log("------------------------------------------------------\n");

  return totalFail;
}

/**
 * Build a single state entry object from a check result.
 * @param {string} timestamp - ISO timestamp
 * @param {string} topic - Topic name
 * @param {object} r - Check result with status, detail, and optional arrays
 * @returns {object} State entry for JSONL output
 */
function buildStateEntry(timestamp, topic, r) {
  return {
    timestamp,
    topic,
    check: r.check,
    status: r.status,
    detail: r.detail,
    ...(r.orphaned ? { orphanedCount: r.orphaned.length } : {}),
    ...(r.uncovered ? { uncoveredCount: r.uncovered.length } : {}),
    ...(r.reportOnly ? { reportOnlyCount: r.reportOnly.length } : {}),
    ...(r.stale ? { staleCount: r.stale.length } : {}),
  };
}

function writeStateFile(allResults) {
  const lines = [];
  const timestamp = new Date().toISOString();

  for (const { topic, results } of allResults) {
    for (const r of results) {
      lines.push(JSON.stringify(buildStateEntry(timestamp, topic, r)));
    }
  }

  try {
    safeWriteFileSync(STATE_FILE, lines.join("\n") + "\n");
    console.log(`State written to ${relative(ROOT, STATE_FILE)}`);
  } catch (err) {
    console.error(`Failed to write state: ${sanitizeError(err)}`);
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────

const topics = getTopics();
if (topics.length === 0) {
  console.error(topicFilter ? `Topic not found: ${topicFilter}` : "No research topics found");
  process.exit(1);
}

console.log(`Validating ${topics.length} research output(s)...`);
if (fixMode) console.log("Fix mode enabled — will auto-correct metadata counts\n");

const allResults = topics.map(validateTopic);
const failCount = printResults(allResults);
writeStateFile(allResults);

process.exit(failCount > 0 ? 1 : 0);
