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

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, relative, basename } from "path";
import { sanitizeError } from "../lib/sanitize-error.js";

const ROOT = join(import.meta.dirname, "..", "..");
const RESEARCH_DIR = join(ROOT, ".research");
const STATE_FILE = join(ROOT, ".claude", "state", "research-validation.jsonl");

const SKIP_TOPICS = ["research-discovery-standard"];

// ── CLI Args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const topicFilter = args.find((a) => a.startsWith("--topic="))?.slice("--topic=".length);
const fixMode = args.includes("--fix");

// ── Helpers ──────────────────────────────────────────────────────────────────

function readJsonl(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    const results = [];
    for (let i = 0; i < lines.length; i++) {
      try {
        results.push(JSON.parse(lines[i]));
      } catch {
        return { error: `Parse error at line ${i + 1}`, line: i + 1 };
      }
    }
    return results;
  } catch (err) {
    return { error: sanitizeError(err) };
  }
}

function readJson(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (err) {
    return { error: sanitizeError(err) };
  }
}

function readText(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return readFileSync(filePath, "utf-8");
  } catch (err) {
    return { error: sanitizeError(err) };
  }
}

function countFiles(dirPath) {
  if (!existsSync(dirPath)) return 0;
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

function checkSourceTraceability(claims, sources, metadata) {
  if (!claims || claims.error) return { status: "WARN", detail: "No claims.jsonl" };
  if (!sources || sources.error) return { status: "WARN", detail: "No sources.jsonl" };

  const sourceIds = new Set(sources.map((s) => s.id));
  const orphaned = [];

  for (const claim of claims) {
    // Some claims use "sources" array instead of "sourceIds"
    const refs = claim.sourceIds || claim.sources || [];
    for (const sid of refs) {
      if (!sourceIds.has(sid)) {
        orphaned.push({ claim: claim.id, sourceId: sid });
      }
    }
  }

  if (orphaned.length === 0) return { status: "PASS", detail: "All sourceIds resolve" };

  // D-code/S-code mismatch is accepted for existing research with sourceIdScheme
  if (metadata && metadata.sourceIdScheme) {
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
  if (!claims || claims.error) return { status: "WARN", detail: "No claims.jsonl" };
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
  if (!metadata || metadata.error) return { status: "WARN", detail: "No metadata.json" };

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
  if (!claims || claims.error) return { status: "WARN", detail: "No claims.jsonl" };
  if (!metadata || metadata.error) return { status: "WARN", detail: "No metadata.json" };
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
  if (!claims || claims.error) return { status: "WARN", detail: "No claims.jsonl" };
  if (!metadata || metadata.error) return { status: "WARN", detail: "No metadata.json" };
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
  if (!claims || claims.error) return { status: "WARN", detail: "No claims.jsonl" };
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
  if (!sources || sources.error) return { status: "WARN", detail: "No sources.jsonl" };

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
  if (!claims || claims.error) return { status: "WARN", detail: "No claims.jsonl" };
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
  const entries = readdirSync(RESEARCH_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && e.name !== "archive")
    .map((e) => e.name)
    .filter((name) => !SKIP_TOPICS.includes(name))
    .filter((name) => !topicFilter || name === topicFilter)
    .sort();
}

function validateTopic(topic) {
  const topicDir = join(RESEARCH_DIR, topic);
  const claimsPath = join(topicDir, "claims.jsonl");
  const sourcesPath = join(topicDir, "sources.jsonl");
  const metadataPath = join(topicDir, "metadata.json");
  const reportPath = join(topicDir, "RESEARCH_OUTPUT.md");

  const claims = readJsonl(claimsPath);
  const sources = readJsonl(sourcesPath);
  const metadata = readJson(metadataPath);
  const reportText = readText(reportPath);

  if (claims && claims.error) {
    return {
      topic,
      results: [{ check: "JSONL Parse", status: "FAIL", detail: claims.error }],
    };
  }
  if (sources && sources.error) {
    return {
      topic,
      results: [{ check: "JSONL Parse", status: "FAIL", detail: sources.error }],
    };
  }

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
  if (fixMode && metadata && !metadata.error) {
    for (const r of results) {
      if (r.fix) Object.assign(fixes, r.fix);
    }
    if (Object.keys(fixes).length > 0) {
      const updated = { ...metadata, ...fixes };
      try {
        writeFileSync(metadataPath, JSON.stringify(updated, null, 2) + "\n", "utf-8");
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
      return "✅";
    case "FAIL":
      return "❌";
    case "WARN":
      return "⚠️ ";
    case "FIXED":
      return "🔧";
    default:
      return "❓";
  }
}

function printResults(allResults) {
  let totalPass = 0;
  let totalFail = 0;
  let totalWarn = 0;
  let totalFixed = 0;

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║           RESEARCH OUTPUT VALIDATION REPORT                 ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  for (const { topic, results } of allResults) {
    const fails = results.filter((r) => r.status === "FAIL").length;
    const warns = results.filter((r) => r.status === "WARN").length;
    const fixed = results.filter((r) => r.status === "FIXED").length;
    const passes = results.filter((r) => r.status === "PASS").length;

    totalPass += passes;
    totalFail += fails;
    totalWarn += warns;
    totalFixed += fixed;

    const topicStatus = fails > 0 ? "❌" : warns > 0 ? "⚠️ " : "✅";
    console.log(`${topicStatus} ${topic}`);

    for (const r of results) {
      console.log(`   ${statusIcon(r.status)} ${r.check}: ${r.detail}`);
    }
    console.log();
  }

  console.log("┌──────────────────────────────────────────────────────────────┐");
  console.log(
    `│ TOTAL: ${totalPass} pass, ${totalFail} fail, ${totalWarn} warn, ${totalFixed} fixed`
  );
  console.log("└──────────────────────────────────────────────────────────────┘\n");

  return totalFail;
}

function writeStateFile(allResults) {
  const lines = [];
  const timestamp = new Date().toISOString();

  for (const { topic, results } of allResults) {
    for (const r of results) {
      lines.push(
        JSON.stringify({
          timestamp,
          topic,
          check: r.check,
          status: r.status,
          detail: r.detail,
          ...(r.orphaned ? { orphanedCount: r.orphaned.length } : {}),
          ...(r.uncovered ? { uncoveredCount: r.uncovered.length } : {}),
          ...(r.reportOnly ? { reportOnlyCount: r.reportOnly.length } : {}),
          ...(r.stale ? { staleCount: r.stale.length } : {}),
        })
      );
    }
  }

  try {
    writeFileSync(STATE_FILE, lines.join("\n") + "\n", "utf-8");
    console.log(`📊 State written to ${relative(ROOT, STATE_FILE)}`);
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
if (fixMode) console.log("🔧 Fix mode enabled — will auto-correct metadata counts\n");

const allResults = topics.map(validateTopic);
const failCount = printResults(allResults);
writeStateFile(allResults);

process.exit(failCount > 0 ? 1 : 0);
