#!/usr/bin/env node
/**
 * eval-sonarcloud-report.js - Generate scored evaluation report for SonarCloud skill
 *
 * Usage:
 *   node scripts/eval/eval-sonarcloud-report.js <session-path>
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
 *   - E1 (API), E2 (Dedup), E3 (Resolve) weighted 1.5x (core functionality)
 *   - E4 (Views), E5 (Report), E6 (Schema) weighted 1x
 *   - Overall pass: all stages ≥70 and overall ≥75
 */

/* global __dirname */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");

/**
 * Validate that a user-provided path is contained within the project root.
 * Prevents path traversal attacks (CWE-22).
 * Uses realpathSync to resolve symlinks and prevent symlink-based traversal.
 */
function validateSessionPath(sessionPath) {
  // Resolve symlinks to get canonical paths
  let projectRoot, resolved;
  try {
    projectRoot = fs.realpathSync(ROOT);
  } catch {
    console.error("Error: Cannot resolve project root path.");
    process.exit(1);
  }
  try {
    resolved = fs.realpathSync(path.resolve(sessionPath));
  } catch {
    console.error(`Error: session path "${sessionPath}" does not exist or cannot be resolved.`);
    process.exit(1);
  }

  const relative = path.relative(projectRoot, resolved);
  if (relative === "" || /^\.\.(?:[\\/]|$)/.test(relative) || path.isAbsolute(relative)) {
    console.error("Error: session path resolves outside the project root.");
    process.exit(1);
  }
  return resolved;
}

// Stage weights for overall score
const STAGE_WEIGHTS = {
  E1: 1.5, // API Fetch - core
  E2: 1.5, // Deduplication - core
  E3: 1.5, // Resolve Logic - core
  E4: 1, // View Regeneration
  E5: 1, // Report Generation
  E6: 1, // Schema Integrity
};

const STAGE_NAMES = {
  E1: "API Fetch",
  E2: "Deduplication",
  E3: "Resolve Logic",
  E4: "View Regeneration",
  E5: "Report Generation",
  E6: "Schema Integrity",
};

function loadJsonlResults(filePath) {
  if (!fs.existsSync(filePath)) return [];
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(
      `Warning: Failed to read ${filePath}: ${err instanceof Error ? err.message : String(err)}`
    );
    return [];
  }
  const lines = content.split("\n").filter((l) => l.trim());
  const results = [];
  let parseErrors = 0;
  for (const line of lines) {
    try {
      results.push(JSON.parse(line));
    } catch {
      parseErrors++;
    }
  }
  if (parseErrors > 0) {
    console.error(`Warning: ${parseErrors} malformed JSON line(s) skipped in ${filePath}`);
  }
  return results;
}

function loadSnapshot(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(
      `Warning: Failed to parse snapshot: ${err instanceof Error ? err.message : String(err)}`
    );
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
  // Ensure eval directory exists before writing
  if (!fs.existsSync(evalDir)) {
    fs.mkdirSync(evalDir, { recursive: true });
  }

  const resultsFile = path.join(evalDir, "stage-results.jsonl");
  const preSnapshot = loadSnapshot(path.join(evalDir, "pre-snapshot.json"));
  const postSnapshot = loadSnapshot(path.join(evalDir, "post-snapshot.json"));

  const allResults = loadJsonlResults(resultsFile);

  // Deduplicate: keep last result per stage
  const latestByStage = new Map();
  for (const result of allResults) {
    latestByStage.set(result.stage, result);
  }
  const stageResults = Array.from(latestByStage.values()).sort((a, b) =>
    a.stage.localeCompare(b.stage)
  );

  if (stageResults.length === 0) {
    console.error("No stage results found; cannot generate evaluation report.");
    console.error(
      "Run stage checks first: node scripts/eval/eval-sonarcloud-stage.js <session> all"
    );
    process.exit(1);
  }

  // Verify all required stages are present
  const requiredStages = Object.keys(STAGE_WEIGHTS);
  const missingStages = requiredStages.filter((s) => !latestByStage.has(s));
  if (missingStages.length > 0) {
    console.error(`Missing stage result(s): ${missingStages.join(", ")}`);
    console.error(
      "Run all stage checks first: node scripts/eval/eval-sonarcloud-stage.js <session> all"
    );
    process.exit(1);
  }

  const overallScore = computeOverallScore(stageResults);
  const overallGrade = getGrade(overallScore);
  const allPassed = stageResults.every((r) => r.passed);

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
  report += `# SonarCloud Skill Evaluation Report\n\n`;
  report += `<!-- prettier-ignore-start -->\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Session:** ${path.basename(sessionPath)}\n`;
  report += `**Overall Score:** ${overallScore}/100 (${overallGrade})\n`;
  report += `**Status:** ${allPassed ? "✅ PASS" : "❌ NEEDS IMPROVEMENT"}\n`;
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
    const itemsResolved =
      (postSnapshot.master_debt.status_counts?.RESOLVED || 0) -
      (preSnapshot.master_debt.status_counts?.RESOLVED || 0);
    report += `| Items Added | +${itemsAdded} |\n`;
    report += `| Items Resolved | +${Math.max(0, itemsResolved)} |\n`;
    report += `| Pre-Run MASTER_DEBT Count | ${preSnapshot.master_debt.item_count} |\n`;
    report += `| Post-Run MASTER_DEBT Count | ${postSnapshot.master_debt.item_count} |\n`;
  }

  report += `\n---\n\n`;

  // Stage Scorecard
  report += `## Stage Scorecard\n\n`;
  report += `| Stage | Name | Score | Weight | Status | Issues |\n`;
  report += `|-------|------|-------|--------|--------|--------|\n`;

  for (const result of stageResults) {
    const icon = result.passed ? "✅" : "❌";
    const weight = STAGE_WEIGHTS[result.stage] || 1;
    const weightLabel = weight > 1 ? `${weight}x` : "1x";
    const name = STAGE_NAMES[result.stage] || result.name;
    report += `| ${result.stage} | ${name} | ${result.score}/100 | ${weightLabel} | ${icon} | ${(result.issues || []).length} |\n`;
  }

  report += `\n---\n\n`;

  // Detailed Stage Results
  report += `## Detailed Stage Results\n\n`;

  for (const result of stageResults) {
    const icon = result.passed ? "✅" : "❌";
    const name = STAGE_NAMES[result.stage] || result.name;
    report += `### ${icon} ${result.stage}: ${name} — ${result.score}/100\n\n`;

    if (result.metadata && Object.keys(result.metadata).length > 0) {
      report += `**Metrics:**\n\n`;
      report += `| Metric | Value |\n`;
      report += `|--------|-------|\n`;
      for (const [key, value] of Object.entries(result.metadata)) {
        if (typeof value === "object" && value !== null) {
          if (Array.isArray(value) && value.length === 0) {
            report += `| ${key} | (empty) |\n`;
          } else {
            report += `| ${key} | \`${JSON.stringify(value)}\` |\n`;
          }
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
      report += `**Recommendations:**\n\n`;
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
  report += `## Consolidated Recommendations\n\n`;

  if (allRecommendations.length === 0) {
    report += `No recommendations — all stages performing well.\n\n`;
  } else {
    // Group by category
    const categories = {
      api: [],
      dedup: [],
      schema: [],
      pipeline: [],
    };

    for (const { stage, recommendation } of allRecommendations) {
      const rec = `[${stage}] ${recommendation}`;
      if (
        recommendation.toLowerCase().includes("api") ||
        recommendation.toLowerCase().includes("token") ||
        recommendation.toLowerCase().includes("connectivity")
      ) {
        categories.api.push(rec);
      } else if (
        recommendation.toLowerCase().includes("dedup") ||
        recommendation.toLowerCase().includes("hash") ||
        recommendation.toLowerCase().includes("duplicate")
      ) {
        categories.dedup.push(rec);
      } else if (
        recommendation.toLowerCase().includes("schema") ||
        recommendation.toLowerCase().includes("field") ||
        recommendation.toLowerCase().includes("format")
      ) {
        categories.schema.push(rec);
      } else {
        categories.pipeline.push(rec);
      }
    }

    if (categories.api.length > 0) {
      report += `### API & Connectivity\n\n`;
      for (const rec of categories.api) {
        report += `- ${rec}\n`;
      }
      report += `\n`;
    }

    if (categories.dedup.length > 0) {
      report += `### Deduplication Issues\n\n`;
      for (const rec of categories.dedup) {
        report += `- ${rec}\n`;
      }
      report += `\n`;
    }

    if (categories.schema.length > 0) {
      report += `### Schema & Data Quality\n\n`;
      for (const rec of categories.schema) {
        report += `- ${rec}\n`;
      }
      report += `\n`;
    }

    if (categories.pipeline.length > 0) {
      report += `### Pipeline & Integration\n\n`;
      for (const rec of categories.pipeline) {
        report += `- ${rec}\n`;
      }
      report += `\n`;
    }
  }

  report += `---\n\n`;

  // Data Integrity Summary
  report += `## Data Integrity Summary\n\n`;
  report += `| Check | Result |\n`;
  report += `|-------|--------|\n`;

  const e2 = latestByStage.get("E2");
  const e6 = latestByStage.get("E6");

  if (e2) {
    report += `| Duplicate Content Hashes | ${e2.metadata?.duplicate_content_hashes || 0} |\n`;
    report += `| Duplicate SonarCloud Keys | ${e2.metadata?.duplicate_sonar_keys || 0} |\n`;
  }

  if (e6) {
    report += `| JSON Parse Errors | ${e6.metadata?.json_errors || 0} |\n`;
    report += `| Missing Required Fields | ${e6.metadata?.missing_required_fields || 0} |\n`;
    report += `| Invalid ID Format | ${e6.metadata?.invalid_id_format || 0} |\n`;
    report += `| Invalid Severity | ${e6.metadata?.invalid_severity || 0} |\n`;
    report += `| Invalid Status | ${e6.metadata?.invalid_status || 0} |\n`;
  }

  report += `\n---\n\n`;

  // Pre/Post Comparison
  if (preSnapshot && postSnapshot) {
    report += `## Pre/Post State Comparison\n\n`;
    report += `| Metric | Before | After | Delta |\n`;
    report += `|--------|--------|-------|-------|\n`;
    report += `| MASTER_DEBT items | ${preSnapshot.master_debt.item_count} | ${postSnapshot.master_debt.item_count} | +${postSnapshot.master_debt.item_count - preSnapshot.master_debt.item_count} |\n`;
    report += `| Last DEBT ID | ${preSnapshot.master_debt.last_id || "none"} | ${postSnapshot.master_debt.last_id || "none"} | |\n`;
    report += `| SonarCloud items | ${preSnapshot.master_debt.sonar_sync_items} | ${postSnapshot.master_debt.sonar_sync_items} | +${postSnapshot.master_debt.sonar_sync_items - preSnapshot.master_debt.sonar_sync_items} |\n`;
    report += `| Items with sonar_key | ${preSnapshot.master_debt.sonar_key_count} | ${postSnapshot.master_debt.sonar_key_count} | +${postSnapshot.master_debt.sonar_key_count - preSnapshot.master_debt.sonar_key_count} |\n`;
    report += `| Intake log lines | ${preSnapshot.logs.intake.lines} | ${postSnapshot.logs.intake.lines} | +${postSnapshot.logs.intake.lines - preSnapshot.logs.intake.lines} |\n`;
    report += `| Resolution log lines | ${preSnapshot.logs.resolution.lines} | ${postSnapshot.logs.resolution.lines} | +${postSnapshot.logs.resolution.lines - preSnapshot.logs.resolution.lines} |\n`;

    // Severity comparison
    for (const sev of ["S0", "S1", "S2", "S3"]) {
      const pre = preSnapshot.master_debt.severity_counts[sev] || 0;
      const post = postSnapshot.master_debt.severity_counts[sev] || 0;
      const delta = post - pre;
      if (delta !== 0) {
        report += `| ${sev} items | ${pre} | ${post} | ${delta > 0 ? "+" : ""}${delta} |\n`;
      }
    }

    // Status comparison
    const allStatuses = new Set([
      ...Object.keys(preSnapshot.master_debt.status_counts || {}),
      ...Object.keys(postSnapshot.master_debt.status_counts || {}),
    ]);
    for (const status of allStatuses) {
      const pre = preSnapshot.master_debt.status_counts?.[status] || 0;
      const post = postSnapshot.master_debt.status_counts?.[status] || 0;
      const delta = post - pre;
      if (delta !== 0) {
        report += `| Status: ${status} | ${pre} | ${post} | ${delta > 0 ? "+" : ""}${delta} |\n`;
      }
    }

    report += `\n`;
  }

  report += `---\n\n`;

  // Remediation Guide (if failed)
  if (!allPassed) {
    report += `## Remediation Guide\n\n`;
    report += `The following stages need attention:\n\n`;

    for (const result of stageResults.filter((r) => !r.passed)) {
      report += `### Fix ${result.stage}: ${STAGE_NAMES[result.stage]}\n\n`;

      switch (result.stage) {
        case "E1":
          report += `1. Verify SONAR_TOKEN is set: \`[ -n "$SONAR_TOKEN" ] && echo "Token set (length: \${#SONAR_TOKEN})" || echo "Token NOT set"\`\n`;
          report += `2. Test API connectivity via sync script (handles auth internally):\n`;
          report += `   \`node scripts/debt/sync-sonarcloud.js --dry-run\`\n`;
          report += `3. Verify project key: \`grep -E '^\\s*sonar\\.projectKey' sonar-project.properties\`\n`;
          report += `4. Re-run full sync: \`node scripts/debt/sync-sonarcloud.js\`\n\n`;
          break;
        case "E2":
          report += `1. Check for duplicate entries: \`grep -o '"content_hash":"[^"]*"' docs/technical-debt/MASTER_DEBT.jsonl | sort | uniq -d\`\n`;
          report += `2. Review dedup logic in \`sync-sonarcloud.js\` lines 544-560\n`;
          report += `3. Consider running \`node scripts/debt/deduplicate-master.js\` if available\n\n`;
          break;
        case "E3":
          report += `1. Run resolve phase: \`node scripts/debt/sync-sonarcloud.js --resolve\`\n`;
          report += `2. Check resolution-log.jsonl for errors\n`;
          report += `3. Verify SonarCloud API returns current issue list\n\n`;
          break;
        case "E4":
          report += `1. Regenerate views: \`node scripts/debt/generate-views.js\`\n`;
          report += `2. Check \`docs/technical-debt/views/\` directory exists\n`;
          report += `3. Verify write permissions on views directory\n\n`;
          break;
        case "E5":
          report += `1. Generate report: \`node scripts/generate-detailed-sonar-report.js\`\n`;
          report += `2. Check \`.sonar/\` directory has cached API responses\n`;
          report += `3. Verify \`docs/audits/\` directory exists with write access\n\n`;
          break;
        case "E6":
          report += `1. Validate schema: \`node scripts/debt/validate-schema.js\`\n`;
          report += `2. Fix malformed JSON: Check MASTER_DEBT.jsonl for parse errors\n`;
          report += `3. Ensure all items have: id, title, severity, category, status\n\n`;
          break;
      }
    }
  }

  report += `---\n\n`;
  report += `**END OF EVALUATION REPORT**\n`;

  // Write report
  const reportFile = path.join(evalDir, "EVALUATION-REPORT.md");
  fs.writeFileSync(reportFile, report);

  // Console summary
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  SONARCLOUD EVAL: ${overallGrade} (${overallScore}/100)`);
  console.log(`${"═".repeat(50)}\n`);
  console.log(
    `  Stages: ${stageResults.filter((r) => r.passed).length}/${stageResults.length} passed`
  );
  console.log(`  Issues: ${allIssues.length}`);
  console.log(`  Recommendations: ${allRecommendations.length}`);

  if (preSnapshot && postSnapshot) {
    const added = postSnapshot.master_debt.item_count - preSnapshot.master_debt.item_count;
    console.log(`  Items Added: +${added}`);
  }

  console.log(`\n  Report: ${reportFile}\n`);

  // Return non-zero if evaluation failed
  if (!allPassed || overallScore < 75) {
    process.exit(1);
  }
}

function main() {
  const sessionPath = process.argv[2];
  if (!sessionPath) {
    console.error("Usage: node scripts/eval/eval-sonarcloud-report.js <session-path>");
    process.exit(1);
  }

  // Validate path stays within project root (CWE-22 path traversal prevention)
  const safeSessionPath = validateSessionPath(sessionPath);
  if (!fs.existsSync(safeSessionPath)) {
    console.error(`Session path does not exist: ${safeSessionPath}`);
    process.exit(1);
  }

  generateReport(safeSessionPath);
}

main();
