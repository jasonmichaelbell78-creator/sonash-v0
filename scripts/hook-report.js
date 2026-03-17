#!/usr/bin/env node
/**
 * hook-report.js — Post-hook summary report with remediation suggestions.
 *
 * Reads the checks temp file (check|status|duration_ms lines) and generates
 * a formatted report showing what ran, what passed, what failed, and what to
 * do about failures.
 *
 * Usage: node scripts/hook-report.js <hook-name> <checks-tmpfile> [--persist]
 *
 * --persist: Also save the report to .claude/state/last-hook-report.md
 *
 * Session #226: Hook scope improvements — always show the table.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

// Check scope metadata — which checks run on what
const CHECK_SCOPES = {
  // Pre-commit checks
  "secrets-scan": { scope: "staged", description: "Gitleaks secret detection" },
  eslint: { scope: "staged", description: "ESLint code quality" },
  tests: { scope: "staged (if code)", description: "Test suite" },
  "lint-staged": { scope: "staged", description: "Prettier auto-format" },
  "pattern-compliance": {
    scope: "staged",
    description: "SoNash pattern compliance",
  },
  "cross-doc": { scope: "staged", description: "Cross-document dependencies" },
  "doc-header": { scope: "staged", description: "Document header validation" },
  "agent-compliance": {
    scope: "session",
    description: "Agent invocation compliance",
  },
  "debt-schema": { scope: "staged", description: "TDMS schema validation" },
  "jsonl-md-sync": { scope: "staged", description: "JSONL/MD sync check" },
  "doc-index": { scope: "staged", description: "Documentation index staleness" },

  // Pre-push checks
  "escalation-gate": {
    scope: "global",
    description: "Unacknowledged error warnings",
  },
  "circular-deps": {
    scope: "push diff (app code)",
    description: "Circular dependency detection",
  },
  "pattern-check": {
    scope: "push diff",
    description: "Pattern compliance (push)",
  },
  "code-reviewer": {
    scope: "push diff (scripts)",
    description: "Code reviewer coverage",
  },
  propagation: {
    scope: "push diff (scripts)",
    description: "Function propagation check",
  },
  "hook-tests": {
    scope: "push diff (hooks)",
    description: "Hook test suite",
  },
  "security-patterns": {
    scope: "push diff",
    description: "Security pattern check",
  },
  "type-check": {
    scope: "push diff (TS)",
    description: "TypeScript type check",
  },
  "cyclomatic-cc": {
    scope: "push diff (JS)",
    description: "Cyclomatic complexity",
  },
  "cognitive-cc": {
    scope: "push diff (JS)",
    description: "Cognitive complexity",
  },
  tsc: { scope: "push diff (TS)", description: "TypeScript compilation" },
  "security-audit": { scope: "push diff", description: "Security audit" },
  triggers: {
    scope: "push diff",
    description: "Event-based trigger check",
  },
};

// Remediation suggestions per check
const REMEDIATIONS = {
  eslint: {
    fix: "npx eslint --fix <files>",
    investigate: "npm run lint",
    defer: "SKIP_CHECKS=eslint SKIP_REASON='...' git commit",
  },
  "pattern-compliance": {
    fix: "Review warnings in output above",
    investigate: "node scripts/check-pattern-compliance.js --all --verbose",
    defer: "node scripts/debt/intake-audit.js --source=hook --check=pattern-compliance",
  },
  "cross-doc": {
    fix: "Stage the missing dependent documents",
    investigate: "node scripts/check-cross-doc-deps.js",
    defer: "SKIP_CHECKS=cross-doc SKIP_REASON='...' git commit",
  },
  "doc-header": {
    fix: "Add required headers to new documents",
    investigate: "node scripts/check-doc-headers.js",
    defer: "SKIP_CHECKS=doc-header SKIP_REASON='...' git commit",
  },
  "circular-deps": {
    fix: "Refactor import chain",
    investigate: "npm run deps:circular",
    defer: null,
  },
  "type-check": {
    fix: "npx tsc --noEmit",
    investigate: "npx tsc --noEmit 2>&1 | head -30",
    defer: "SKIP_CC=1 SKIP_REASON='...' git push",
  },
  propagation: {
    fix: "Sync modified functions to duplicate copies",
    investigate: "node scripts/check-propagation.js --blocking",
    defer: "SKIP_PROPAGATION=1 SKIP_REASON='...' git push",
  },
  "cyclomatic-cc": {
    fix: "Extract helper functions (target CC < 15)",
    investigate: "npx eslint --rule 'complexity: [error, 15]' <file>",
    defer: "SKIP_CC=1 SKIP_REASON='...' git push",
  },
  "agent-compliance": {
    fix: "Run the required agent before committing",
    investigate: "node scripts/check-agent-compliance.js",
    defer: null,
  },
};

function formatDuration(ms) {
  const num = parseInt(ms, 10) || 0;
  if (num > 1000) return (num / 1000).toFixed(1) + "s";
  return num + "ms";
}

function statusIcon(status) {
  switch (status) {
    case "pass":
      return "\u2705";
    case "skip":
      return "\u23ED\uFE0F ";
    case "warn":
      return "\u26A0\uFE0F ";
    case "fail":
      return "\u274C";
    case "auto-fix":
      return "\uD83D\uDD27";
    default:
      return "  ";
  }
}

function generateReport(hookName, checksFile, persist) {
  let lines;
  try {
    lines = fs
      .readFileSync(checksFile, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    console.error("Could not read checks file:", checksFile);
    process.exit(0);
  }

  const checks = lines.map((line) => {
    const [id, status, duration] = line.replace(/\r/g, "").split("|");
    const meta = CHECK_SCOPES[id] || {
      scope: "unknown",
      description: id,
    };
    return { id, status, duration: parseInt(duration, 10) || 0, ...meta };
  });

  const passed = checks.filter((c) => c.status === "pass").length;
  const warned = checks.filter((c) => c.status === "warn").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const skipped = checks.filter((c) => c.status === "skip").length;
  const totalMs = checks.reduce((sum, c) => sum + c.duration, 0);

  // Always show the table
  const report = [];
  report.push("");
  report.push(
    `\u250C\u2500 ${hookName} Report \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510`
  );
  report.push(
    "\u2502 Status  Check                     Scope                Duration \u2502"
  );
  report.push(
    "\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524"
  );

  for (const c of checks) {
    const icon = statusIcon(c.status);
    const name = (c.description || c.id).substring(0, 23).padEnd(23);
    const scope = (c.scope || "").substring(0, 18).padEnd(18);
    const dur = formatDuration(c.duration).padStart(8);
    report.push(`\u2502 ${icon} ${name}  ${scope}  ${dur} \u2502`);
  }

  report.push(
    "\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524"
  );
  report.push(
    `\u2502 ${passed} passed, ${warned} warned, ${failed} failed, ${skipped} skipped (${formatDuration(totalMs)}) \u2502`
  );

  // Remediation section for failures/warnings
  const actionable = checks.filter(
    (c) => c.status === "fail" || c.status === "warn"
  );
  if (actionable.length > 0) {
    report.push(
      "\u251C\u2500 Remediation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524"
    );
    for (const c of actionable) {
      const remed = REMEDIATIONS[c.id];
      report.push(
        `\u2502 ${statusIcon(c.status)} ${c.id} (${c.status})`
      );
      if (remed) {
        if (remed.fix)
          report.push(`\u2502   Fix: ${remed.fix}`);
        if (remed.investigate)
          report.push(`\u2502   Investigate: ${remed.investigate}`);
        if (remed.defer)
          report.push(`\u2502   Defer: ${remed.defer}`);
      } else {
        report.push(`\u2502   See hook output above for details`);
      }
    }
  }

  report.push(
    "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518"
  );

  const output = report.join("\n");
  console.error(output);

  // Persist if requested
  if (persist) {
    const reportPath = path.join(
      ROOT,
      ".claude",
      "state",
      "last-hook-report.md"
    );
    const md = [
      `# ${hookName} Report`,
      `**Date:** ${new Date().toISOString()}`,
      `**Result:** ${failed > 0 ? "FAILED" : warned > 0 ? "WARNING" : "PASSED"}`,
      "",
      "| Check | Status | Scope | Duration |",
      "|-------|--------|-------|----------|",
    ];
    for (const c of checks) {
      md.push(
        `| ${c.description || c.id} | ${c.status} | ${c.scope} | ${formatDuration(c.duration)} |`
      );
    }
    md.push("");
    md.push(`**Total:** ${passed} passed, ${warned} warned, ${failed} failed, ${skipped} skipped (${formatDuration(totalMs)})`);

    if (actionable.length > 0) {
      md.push("");
      md.push("## Remediation");
      for (const c of actionable) {
        const remed = REMEDIATIONS[c.id];
        md.push(`### ${c.id} (${c.status})`);
        if (remed) {
          if (remed.fix) md.push(`- **Fix:** \`${remed.fix}\``);
          if (remed.investigate)
            md.push(`- **Investigate:** \`${remed.investigate}\``);
          if (remed.defer) md.push(`- **Defer:** \`${remed.defer}\``);
        }
      }
    }

    try {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, md.join("\n") + "\n");
    } catch {
      // Non-critical — don't block
    }
  }
}

// CLI
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node scripts/hook-report.js <hook-name> <checks-tmpfile> [--persist]");
  process.exit(0);
}
generateReport(args[0], args[1], args.includes("--persist"));
