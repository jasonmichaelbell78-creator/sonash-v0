#!/usr/bin/env node
/**
 * eval-report.js - Generate scored evaluation report from stage results
 *
 * Usage:
 *   node scripts/multi-ai/eval-report.js <session-path>
 *
 * Reads:
 *   <session-path>/eval/stage-results.jsonl
 *   <session-path>/eval/pre-snapshot.json
 *   <session-path>/eval/post-snapshot.json
 *
 * Outputs:
 *   <session-path>/eval/EVALUATION-REPORT.md
 *
 * Scoring:
 *   - Each stage scored 0-100
 *   - Weighted average: E3-E5 weighted 2x (novel components)
 *   - Overall pass: all stages ≥70 and overall ≥75
 */

const fs = require("fs");
const path = require("path");

// Stage weights for overall score (E3-E5 are 2x because they're the novel components)
const STAGE_WEIGHTS = {
  E1: 1,
  E2: 1,
  E3: 2,
  E4: 2,
  E5: 2,
  E6: 1.5,
  E7: 1.5,
  E8: 1,
};

function loadJsonlResults(filePath) {
  if (!fs.existsSync(filePath)) return [];
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return [];
  }
  const lines = content.split("\n").filter((l) => l.trim());
  const results = [];
  for (const line of lines) {
    try {
      results.push(JSON.parse(line));
    } catch {
      // Skip
    }
  }
  return results;
}

function loadSnapshot(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function computeOverallScore(stageResults) {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const result of stageResults) {
    const weight = STAGE_WEIGHTS[result.stage] || 1;
    totalWeight += weight;
    weightedSum += result.score * weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

function getGrade(score) {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function generateReport(sessionPath) {
  const evalDir = path.join(sessionPath, "eval");
  const resultsFile = path.join(evalDir, "stage-results.jsonl");
  const preSnapshot = loadSnapshot(path.join(evalDir, "pre-snapshot.json"));
  const postSnapshot = loadSnapshot(path.join(evalDir, "post-snapshot.json"));

  const allResults = loadJsonlResults(resultsFile);

  // Deduplicate: keep last result per stage (in case of re-runs)
  const latestByStage = new Map();
  for (const result of allResults) {
    latestByStage.set(result.stage, result);
  }
  const stageResults = Array.from(latestByStage.values()).sort((a, b) =>
    a.stage.localeCompare(b.stage)
  );

  const hasNoStages = stageResults.length === 0;
  const hasInvalidStages = stageResults.some(
    (r) => !r?.stage || typeof r.score !== "number" || Number.isNaN(r.score)
  );
  const overallScore = computeOverallScore(stageResults);
  const overallGrade = getGrade(overallScore);
  const allPassed = !hasNoStages && !hasInvalidStages && stageResults.every((r) => r.passed);

  if (hasNoStages) {
    console.error("No stage results found; cannot generate a valid evaluation report.");
    process.exit(1);
  }
  if (hasInvalidStages) {
    console.error("Invalid stage results found (missing stage and/or non-numeric score).");
    process.exit(1);
  }

  // Collect all issues and recommendations
  const allIssues = [];
  const allRecommendations = [];
  for (const result of stageResults) {
    for (const issue of result.issues || []) {
      allIssues.push({ stage: result.stage, issue });
    }
    for (const rec of result.recommendations || []) {
      allRecommendations.push({ stage: result.stage, recommendation: rec });
    }
  }

  // Build the report
  let report = "";

  // Header
  report += `# Multi-AI Audit Evaluation Report\n\n`;
  report += `<!-- prettier-ignore-start -->\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Session:** ${path.basename(sessionPath)}\n`;
  report += `**Overall Score:** ${overallScore}/100 (${overallGrade})\n`;
  report += `**Status:** ${allPassed ? "PASS" : "NEEDS IMPROVEMENT"}\n`;
  report += `<!-- prettier-ignore-end -->\n\n`;

  report += `---\n\n`;

  // Overall Summary
  report += `## Overall Summary\n\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Overall Score | **${overallScore}/100** (${overallGrade}) |\n`;
  report += `| Stages Passed | ${stageResults.filter((r) => r.passed).length}/${stageResults.length} |\n`;
  report += `| Total Issues | ${allIssues.length} |\n`;
  report += `| Total Recommendations | ${allRecommendations.length} |\n`;

  if (preSnapshot && postSnapshot) {
    const itemsAdded = postSnapshot.master_debt.item_count - preSnapshot.master_debt.item_count;
    report += `| Items Ingested to TDMS | ${itemsAdded} |\n`;
    report += `| Pre-Audit MASTER_DEBT Count | ${preSnapshot.master_debt.item_count} |\n`;
    report += `| Post-Audit MASTER_DEBT Count | ${postSnapshot.master_debt.item_count} |\n`;
  }

  report += `\n---\n\n`;

  // Stage Scorecard
  report += `## Stage Scorecard\n\n`;
  report += `| Stage | Name | Score | Weight | Passed | Issues |\n`;
  report += `|-------|------|-------|--------|--------|--------|\n`;

  for (const result of stageResults) {
    const icon = result.passed ? "✅" : "❌";
    const weight = STAGE_WEIGHTS[result.stage] || 1;
    const weightLabel = weight > 1 ? `${weight}x` : "1x";
    report += `| ${result.stage} | ${result.name} | ${result.score}/100 | ${weightLabel} | ${icon} | ${(result.issues || []).length} |\n`;
  }

  report += `\n---\n\n`;

  // Detailed Stage Results
  report += `## Detailed Stage Results\n\n`;

  for (const result of stageResults) {
    const icon = result.passed ? "✅" : "❌";
    report += `### ${icon} ${result.stage}: ${result.name} — ${result.score}/100\n\n`;

    if (result.metadata && Object.keys(result.metadata).length > 0) {
      report += `**Metrics:**\n\n`;
      report += `| Metric | Value |\n`;
      report += `|--------|-------|\n`;
      for (const [key, value] of Object.entries(result.metadata)) {
        if (typeof value === "object" && value !== null) {
          report += `| ${key} | ${JSON.stringify(value)} |\n`;
        } else {
          report += `| ${key} | ${value} |\n`;
        }
      }
      report += `\n`;
    }

    if ((result.issues || []).length > 0) {
      report += `**Issues Found:**\n\n`;
      for (const issue of result.issues) {
        report += `- ⚠️ ${issue}\n`;
      }
      report += `\n`;
    }

    if ((result.recommendations || []).length > 0) {
      report += `**Stage Recommendations:**\n\n`;
      for (const rec of result.recommendations) {
        report += `- 💡 ${rec}\n`;
      }
      report += `\n`;
    }

    if ((result.issues || []).length === 0 && (result.recommendations || []).length === 0) {
      report += `No issues found.\n\n`;
    }

    report += `---\n\n`;
  }

  // Consolidated Recommendations
  report += `## Recommendations\n\n`;

  if (allRecommendations.length === 0) {
    report += `No recommendations — all stages performing well.\n\n`;
  } else {
    // Group by category
    const categories = {
      pipeline: [],
      mapping: [],
      format: [],
      process: [],
    };

    for (const { stage, recommendation } of allRecommendations) {
      const rec = `[${stage}] ${recommendation}`;
      if (
        recommendation.includes("mapping") ||
        recommendation.includes("fallback") ||
        recommendation.includes("assign")
      ) {
        categories.mapping.push(rec);
      } else if (
        recommendation.includes("format") ||
        recommendation.includes("normalize") ||
        recommendation.includes("extraction") ||
        recommendation.includes("parsing")
      ) {
        categories.format.push(rec);
      } else if (
        recommendation.includes("generate") ||
        recommendation.includes("intake") ||
        recommendation.includes("views") ||
        recommendation.includes("metrics")
      ) {
        categories.pipeline.push(rec);
      } else {
        categories.process.push(rec);
      }
    }

    if (categories.pipeline.length > 0) {
      report += `### Pipeline Improvements\n\n`;
      for (const rec of categories.pipeline) {
        report += `- ${rec}\n`;
      }
      report += `\n`;
    }

    if (categories.mapping.length > 0) {
      report += `### Mapping Rule Corrections\n\n`;
      for (const rec of categories.mapping) {
        report += `- ${rec}\n`;
      }
      report += `\n`;
    }

    if (categories.format.length > 0) {
      report += `### Schema & Format Gaps\n\n`;
      for (const rec of categories.format) {
        report += `- ${rec}\n`;
      }
      report += `\n`;
    }

    if (categories.process.length > 0) {
      report += `### Process Improvements\n\n`;
      for (const rec of categories.process) {
        report += `- ${rec}\n`;
      }
      report += `\n`;
    }
  }

  report += `---\n\n`;

  // Data Integrity Check
  report += `## Data Integrity Check\n\n`;
  report += `| Check | Result |\n`;
  report += `|-------|--------|\n`;

  // Nothing left behind check
  const e6 = latestByStage.get("E6");
  const e7 = latestByStage.get("E7");
  if (e6 && e7) {
    const unifiedCount = e6.metadata?.unified_count || 0;
    const newItems = e7.metadata?.new_items || 0;
    const expectedDelta = unifiedCount - newItems;
    if (expectedDelta > 0) {
      report += `| Items not ingested (duplicates/errors) | ${expectedDelta} |\n`;
    } else {
      report += `| Items not ingested | 0 (all unified findings ingested) |\n`;
    }
    report += `| Duplicate content hashes | ${e7.metadata?.duplicate_hashes || 0} |\n`;
    report += `| Items without file path | ${e7.metadata?.items_without_file || 0} |\n`;
    report += `| Items without description | ${e7.metadata?.items_without_description || 0} |\n`;
  }

  const e8 = latestByStage.get("E8");
  if (e8) {
    report += `| Items without roadmap_ref | ${(e8.metadata?.new_items || 0) - (e8.metadata?.with_roadmap_ref || 0)} |\n`;
    report += `| Items hitting default fallback (M2.1) | ${e8.metadata?.default_fallback_count || 0} |\n`;
  }

  report += `\n---\n\n`;

  // Pre/Post Comparison
  if (preSnapshot && postSnapshot) {
    report += `## Pre/Post State Comparison\n\n`;
    report += `| Metric | Before | After | Delta |\n`;
    report += `|--------|--------|-------|-------|\n`;
    report += `| MASTER_DEBT items | ${preSnapshot.master_debt.item_count} | ${postSnapshot.master_debt.item_count} | +${postSnapshot.master_debt.item_count - preSnapshot.master_debt.item_count} |\n`;
    report += `| Last DEBT ID | ${preSnapshot.master_debt.last_id || "none"} | ${postSnapshot.master_debt.last_id || "none"} | |\n`;
    report += `| Roadmap DEBT refs | ${preSnapshot.roadmap.debt_ref_count} | ${postSnapshot.roadmap.debt_ref_count} | +${postSnapshot.roadmap.debt_ref_count - preSnapshot.roadmap.debt_ref_count} |\n`;

    // Severity comparison
    for (const sev of ["S0", "S1", "S2", "S3"]) {
      const pre = preSnapshot.master_debt.severity_counts[sev] || 0;
      const post = postSnapshot.master_debt.severity_counts[sev] || 0;
      if (post - pre > 0) {
        report += `| ${sev} items | ${pre} | ${post} | +${post - pre} |\n`;
      }
    }

    report += `\n`;
  }

  report += `---\n\n`;
  report += `**END OF EVALUATION REPORT**\n`;

  // Write report
  const reportFile = path.join(evalDir, "EVALUATION-REPORT.md");
  fs.writeFileSync(reportFile, report);

  // Console summary
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  EVALUATION REPORT: ${overallGrade} (${overallScore}/100)`);
  console.log(`${"═".repeat(50)}\n`);
  console.log(
    `  Stages: ${stageResults.filter((r) => r.passed).length}/${stageResults.length} passed`
  );
  console.log(`  Issues: ${allIssues.length}`);
  console.log(`  Recommendations: ${allRecommendations.length}`);
  console.log(`\n  Report: ${reportFile}\n`);

  // Return non-zero if evaluation failed
  if (!allPassed || overallScore < 75) {
    process.exit(1);
  }
}

function main() {
  const sessionPath = process.argv[2];
  if (!sessionPath) {
    console.error("Usage: node scripts/multi-ai/eval-report.js <session-path>");
    process.exit(1);
  }

  generateReport(sessionPath);
}

main();
