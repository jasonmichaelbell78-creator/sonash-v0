#!/usr/bin/env node
/* global __dirname */
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
const { sanitizeError } = require("./lib/sanitize-error");

// Check scope metadata — which checks run on what
const CHECK_SCOPES = {
  // Pre-commit checks
  "secrets-scan": { scope: "staged", description: "Gitleaks secret detection" },
  eslint: { scope: "staged", description: "ESLint code quality" },
  tests: { scope: "staged (if code)", description: "Test suite" },
  "lint-staged": { scope: "staged", description: "Prettier auto-format" },
  "pattern-compliance": { scope: "staged", description: "SoNash pattern compliance" },
  "cross-doc": { scope: "staged", description: "Cross-document dependencies" },
  "doc-header": { scope: "staged", description: "Document header validation" },
  "agent-compliance": { scope: "session", description: "Agent invocation compliance" },
  "debt-schema": { scope: "staged", description: "TDMS schema validation" },
  "jsonl-md-sync": { scope: "staged", description: "JSONL/MD sync check" },
  "doc-index": { scope: "staged", description: "Documentation index staleness" },

  // Pre-push checks
  "escalation-gate": { scope: "global", description: "Unacknowledged error warnings" },
  "circular-deps": { scope: "push diff (app code)", description: "Circular dependency detection" },
  "pattern-check": { scope: "push diff", description: "Pattern compliance (push)" },
  "code-reviewer": { scope: "push diff (scripts)", description: "Code reviewer coverage" },
  propagation: { scope: "push diff (scripts)", description: "Function propagation check" },
  "hook-tests": { scope: "push diff (hooks)", description: "Hook test suite" },
  "security-patterns": { scope: "push diff", description: "Security pattern check" },
  "type-check": { scope: "push diff (TS)", description: "TypeScript type check" },
  "cyclomatic-cc": { scope: "push diff (JS)", description: "Cyclomatic complexity" },
  "cognitive-cc": { scope: "push diff (JS)", description: "Cognitive complexity" },
  tsc: { scope: "push diff (TS)", description: "TypeScript compilation" },
  "security-audit": { scope: "push diff", description: "Security audit" },
  triggers: { scope: "push diff", description: "Event-based trigger check" },
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
  const num = Number.parseInt(ms, 10) || 0;
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

const BOX_INNER = 61;
const boxedLine = (content) => {
  const s = String(content).slice(0, BOX_INNER);
  return `\u2502 ${s.padEnd(BOX_INNER)} \u2502`;
};

const VALID_STATUSES = new Set(["pass", "skip", "warn", "fail", "auto-fix"]);

function parseChecks(lines) {
  return lines
    .map((line) => {
      const parts = line
        .replaceAll("\r", "")
        .split("|")
        .map((p) => p.trim());
      if (parts.length < 2) return null;
      const [id, rawStatus, duration] = parts;
      const status = VALID_STATUSES.has(rawStatus) ? rawStatus : "warn";
      const meta = CHECK_SCOPES[id] || {
        scope: "unknown",
        description: id,
      };
      return { id, status, duration: Number.parseInt(duration, 10) || 0, ...meta };
    })
    .filter(Boolean);
}

function countStatuses(checks) {
  const passed = checks.filter((c) => c.status === "pass").length;
  const warned = checks.filter((c) => c.status === "warn").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const skipped = checks.filter((c) => c.status === "skip").length;
  const totalMs = checks.reduce((sum, c) => sum + c.duration, 0);
  return { passed, warned, failed, skipped, totalMs };
}

function buildConsoleRemediation(actionable) {
  const lines = [
    "\u251C\u2500 Remediation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524",
  ];
  for (const c of actionable) {
    const remed = REMEDIATIONS[c.id];
    lines.push(boxedLine(`${statusIcon(c.status)} ${c.id} (${c.status})`));
    if (remed) {
      if (remed.fix) lines.push(boxedLine(`  Fix: ${remed.fix}`));
      if (remed.investigate) lines.push(boxedLine(`  Investigate: ${remed.investigate}`));
      if (remed.defer) lines.push(boxedLine(`  Defer: ${remed.defer}`));
    } else {
      lines.push(boxedLine("  See hook output above for details"));
    }
  }
  return lines;
}

function buildConsoleReport(hookName, checks, counts) {
  const { passed, warned, failed, skipped, totalMs } = counts;
  const safeHookName = String(hookName ?? "")
    .replaceAll("\n", " ")
    .slice(0, 24);
  const report = [
    "",
    `\u250C\u2500 ${safeHookName} Report \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510`,
    "\u2502 Status  Check                     Scope                Duration \u2502",
    "\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524",
  ];

  const sanitizeCell = (v, maxLen) =>
    String(v ?? "")
      .replaceAll(/\p{C}+/gu, " ")
      .replaceAll("\n", " ")
      .slice(0, maxLen);

  for (const c of checks) {
    const icon = statusIcon(c.status);
    const name = sanitizeCell(c.description || c.id, 23).padEnd(23);
    const scope = sanitizeCell(c.scope || "", 18).padEnd(18);
    const dur = formatDuration(c.duration).padStart(8);
    report.push(`\u2502 ${icon} ${name}  ${scope}  ${dur} \u2502`);
  }

  const summary = `${passed} passed, ${warned} warned, ${failed} failed, ${skipped} skipped (${formatDuration(totalMs)})`;
  report.push(
    "\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524",
    boxedLine(summary)
  );

  const actionable = checks.filter((c) => c.status === "fail" || c.status === "warn");
  if (actionable.length > 0) report.push(...buildConsoleRemediation(actionable));

  report.push(
    "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518"
  );

  return { report, actionable };
}

function generateReport(hookName, checksFile) {
  let lines;
  try {
    const stat = fs.statSync(checksFile);
    if (stat.size > 1024 * 100) {
      console.error("Checks file too large, skipping report:", checksFile);
      process.exit(0);
    }
    lines = fs.readFileSync(checksFile, "utf8").trim().split("\n").filter(Boolean);
  } catch (err) {
    const safeFile = String(checksFile)
      .replaceAll(/\p{C}+/gu, " ")
      .slice(0, 300);
    console.error("Could not read checks file:", safeFile, sanitizeError(err));
    process.exit(0);
  }

  const checks = parseChecks(lines);
  const counts = countStatuses(checks);
  const { report } = buildConsoleReport(hookName, checks, counts);

  console.error(report.join("\n"));
}

// CLI
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node scripts/hook-report.js <hook-name> <checks-tmpfile>");
  process.exit(1);
}
generateReport(args[0], args[1]);
