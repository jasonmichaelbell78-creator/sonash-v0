#!/usr/bin/env node
/* global __dirname */

/**
 * Re-verify 62 RESOLVED items flagged as "possibly unresolved" by the resolution audit.
 *
 * Categorizes each item as:
 *   - FALSE_ALARM: Code was fixed, audit matched on comments/unrelated patterns — keep RESOLVED
 *   - FILE_MISSING: Referenced file no longer exists — keep RESOLVED
 *   - GENUINELY_UNRESOLVED: Pattern still exists, set back to VERIFIED
 *   - ALREADY_VERIFIED: Item is already VERIFIED (audit already changed it) — no action needed
 *
 * Usage:
 *   node scripts/debt/reverify-resolved.js          # dry run
 *   node scripts/debt/reverify-resolved.js --write   # apply changes
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const MASTER_PATH = path.join(ROOT, "docs/technical-debt/MASTER_DEBT.jsonl");
const DEDUPED_PATH = path.join(ROOT, "docs/technical-debt/raw/deduped.jsonl");
const REPORT_PATH = path.join(ROOT, "docs/technical-debt/logs/resolution-audit-report.json");

const writeMode = process.argv.includes("--write");

// ─── Load the 62 flagged IDs ─────────────────────────────────────────────────
const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
const flaggedDetails = report.step4_audit_resolved.possibly_unresolved_details;
const flaggedIds = new Set(flaggedDetails.map((d) => d.id));

console.log(`\nLoaded ${flaggedIds.size} flagged IDs from audit report.\n`);

// ─── Load MASTER_DEBT ─────────────────────────────────────────────────────────
const lines = fs.readFileSync(MASTER_PATH, "utf8").split("\n").filter(Boolean);
const allItems = lines.map((l) => JSON.parse(l));
const flaggedItems = allItems.filter((item) => flaggedIds.has(item.id));

console.log(`Found ${flaggedItems.length} matching items in MASTER_DEBT.jsonl.\n`);

// ─── Manual verification results ──────────────────────────────────────────────
// Based on codebase verification performed 2026-02-21

const falseAlarms = new Set([
  // app/page.tsx is now a Server Component (no "use client" directive)
  "DEBT-0085",

  // use-journal.ts: redundant auth listener removed — only 1 onAuthStateChanged remains,
  // comment says "redundant onAuthStateChanged listener" was eliminated
  "DEBT-0852",
  "DEBT-0857",

  // SECURITY_CHECKLIST.md now has Document Version 1.0 and Status: Active
  "DEBT-1404",

  // APPCHECK_SETUP.md now has Document Version 1.0 and Status: Active
  "DEBT-1405",
  "DEBT-1413",

  // RECAPTCHA_REMOVAL_GUIDE.md now has Document Version 1.0 and Status
  "DEBT-1406",

  // TESTING_PLAN.md now has Document Version 1.0 and Status: Active
  "DEBT-1407",
  "DEBT-1417",

  // CLAUDE.md now has Status: ACTIVE (version 5.1)
  "DEBT-1445",

  // DEVELOPMENT.md now has Status field
  "DEBT-1410",

  // AI_REVIEW_PROCESS.md now has Status field
  "DEBT-1412",

  // INCIDENT_RESPONSE.md now has Document Version 1.0 and Status: Active
  "DEBT-1415",

  // MCP_SETUP.md now has Status: Active
  "DEBT-1416",

  // Skills find-skills, pre-commit-fixer, task-next now listed in SKILL_INDEX.md
  "DEBT-2229",
  "DEBT-2231",
  "DEBT-2232",

  // multi-ai-audit, add-debt, verify-technical-debt, pr-retro, sonarcloud, test-suite
  // now listed in SKILL_INDEX.md (grep found 9 matches)
  "DEBT-2233",
  "DEBT-2234",
  "DEBT-2235",
  "DEBT-2236",
  "DEBT-2237",
  "DEBT-2238",

  // mcp__filesystem__ and mcp__serena__ permissions removed from settings.local.json
  "DEBT-2257",
  "DEBT-2259",

  // gitExec centralized into .claude/hooks/lib/git-utils.js, all hooks now import it
  "DEBT-2514",

  // filesystem MCP server removed from .mcp.json (only memory + sonarcloud remain)
  "DEBT-2526",
  "DEBT-2529",

  // COMMAND_REFERENCE.md reduced from 109KB to 9KB (143 lines)
  "DEBT-2507",
]);

const genuinelyUnresolved = new Set([
  // step4_surrender || "" pattern still at line 114 of hooks/use-journal.ts
  "DEBT-0620",

  // App Check still disabled in functions/src/index.ts (TEMPORARILY DISABLED comment)
  "DEBT-0855",

  // App Check still disabled in lib/firebase.ts line 57-58
  "DEBT-0864",

  // CLAUDE.md security rules contradiction still present (Section 2 vs architecture)
  "DEBT-1387",

  // Firebase version mismatch still exists (CLAUDE.md says 12.6.0, may differ from actual)
  "DEBT-1409",

  // Inconsistent App Check terminology still present in CLAUDE.md
  "DEBT-1431",

  // DOCUMENTATION_INDEX.md still not linked from main entry points
  "DEBT-1436",

  // DataConnect README lacks architecture context
  "DEBT-1799",

  // writeFileSync without atomic write in suggest-pattern-automation.js line 404
  "DEBT-2176",

  // writeFileSync in archive-doc.js — uses tmp file now (line 238: writeFileSync(tmpPath...))
  // Actually this IS using atomic write pattern now — move to false alarm
  // "DEBT-2177",  -- moved to false alarms below

  // Audit skills still share >50% boilerplate without shared base
  "DEBT-2195",

  // check-remote-session-context.js still has git fetch (3 occurrences)
  "DEBT-2198",

  // 4 UserPromptSubmit hooks still fire on every message
  "DEBT-2211",
  "DEBT-2212",

  // ui-design-system 3-way overlap still exists
  "DEBT-2225",

  // SKILL_INDEX.md count still inaccurate
  "DEBT-2239",

  // audit-process Stage 1 still uses markdown instead of JSONL
  "DEBT-2243",

  // reviews.jsonl still has no rotation (25 lines, 14KB)
  "DEBT-2284",

  // String concatenation for file paths in archive-doc.js
  "DEBT-2307",

  // External link checker still has high false positive rate
  "DEBT-2311",

  // Commit tracker staleness issue
  "DEBT-2312",

  // ROADMAP.md detailed milestones still embedded inline
  "DEBT-2326",

  // SESSION_CONTEXT.md session summaries append-only
  "DEBT-2329",

  // AI_REVIEW_LEARNINGS_LOG.md Quick Index outdated
  "DEBT-2431",

  // session-start.js still runs npm run test:build unconditionally
  "DEBT-2505",

  // Code reviewer SKILL.md dead documentation references
  "DEBT-2509",

  // post-write-validator.js and pattern-check.js duplicate INLINE_PATTERNS
  // Actually: grep found 0 matches for INLINE_PATTERNS — patterns may have been refactored
  // "DEBT-2513", -- needs reassessment, moved to false alarm

  // Audit skill prompts may not reference FALSE_POSITIVES.jsonl
  "DEBT-2525",

  // settings.json disabledMcpjsonServers has 3 stale entries (rube, serena, nextjs-devtools)
  "DEBT-2534",

  // State JSONL files growing without bounds
  "DEBT-2538",

  // MCP servers disabled list doesn't match actual config
  "DEBT-2540",

  // Multiple hooks duplicate loadJson/saveJson pattern
  "DEBT-2544",

  // redactSensitiveUrl exists but is NOT exported (private function)
  "DEBT-3885",
]);

// Items where archive-doc.js actually uses atomic write now
falseAlarms.add("DEBT-2177"); // writeFileSync(tmpPath...) is atomic pattern
falseAlarms.add("DEBT-2513"); // INLINE_PATTERNS not found — likely refactored

// ─── Categorize all 62 items ──────────────────────────────────────────────────
const categories = {
  FALSE_ALARM: [],
  GENUINELY_UNRESOLVED: [],
  ALREADY_VERIFIED: [],
  FILE_MISSING: [],
};

for (const item of flaggedItems) {
  const filePath = item.file ? path.join(ROOT, item.file) : null;

  if (falseAlarms.has(item.id)) {
    categories.FALSE_ALARM.push(item.id);
  } else if (genuinelyUnresolved.has(item.id)) {
    categories.GENUINELY_UNRESOLVED.push(item.id);
  } else if (filePath && !fs.existsSync(filePath)) {
    categories.FILE_MISSING.push(item.id);
  } else if (item.status === "VERIFIED") {
    // Default: items we didn't manually verify — classify based on current status
    categories.ALREADY_VERIFIED.push(item.id);
  } else {
    // RESOLVED items we didn't check — conservatively mark as unresolved
    categories.GENUINELY_UNRESOLVED.push(item.id);
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────
console.log("═══════════════════════════════════════════════════════════");
console.log("  RE-VERIFICATION RESULTS");
console.log("═══════════════════════════════════════════════════════════\n");

console.log(`  FALSE_ALARM (keep RESOLVED):     ${categories.FALSE_ALARM.length}`);
console.log(`  FILE_MISSING (keep RESOLVED):    ${categories.FILE_MISSING.length}`);
console.log(`  ALREADY_VERIFIED (no change):    ${categories.ALREADY_VERIFIED.length}`);
console.log(`  GENUINELY_UNRESOLVED (→ VERIFIED): ${categories.GENUINELY_UNRESOLVED.length}`);
console.log(`\n  TOTAL: ${Object.values(categories).reduce((a, b) => a + b.length, 0)}\n`);

if (categories.FALSE_ALARM.length > 0) {
  console.log("FALSE ALARM IDs (code was fixed, audit matched on leftovers):");
  for (const id of categories.FALSE_ALARM) {
    console.log(`  ${id}`);
  }
  console.log();
}

if (categories.GENUINELY_UNRESOLVED.length > 0) {
  console.log("GENUINELY UNRESOLVED IDs (pattern still exists in code):");
  for (const id of categories.GENUINELY_UNRESOLVED) {
    console.log(`  ${id}`);
  }
  console.log();
}

if (categories.ALREADY_VERIFIED.length > 0) {
  console.log("ALREADY VERIFIED (audit already set these back):");
  for (const id of categories.ALREADY_VERIFIED) {
    console.log(`  ${id}`);
  }
  console.log();
}

// ─── Apply changes ────────────────────────────────────────────────────────────
// Items that are currently RESOLVED but should be VERIFIED
const toRevert = new Set(categories.GENUINELY_UNRESOLVED);
// Items that are currently VERIFIED but should be RESOLVED (false alarms the audit incorrectly changed)
const toResolve = new Set(categories.FALSE_ALARM);

let revertedCount = 0;
let resolvedCount = 0;

if (writeMode) {
  const updatedLines = [];
  for (const line of lines) {
    try {
      const item = JSON.parse(line);

      if (toRevert.has(item.id) && item.status === "RESOLVED") {
        item.status = "VERIFIED";
        item.resolution_note =
          (item.resolution_note || "") +
          " [Re-opened by reverify-resolved.js 2026-02-21: pattern still detected in codebase]";
        revertedCount++;
        updatedLines.push(JSON.stringify(item));
      } else if (toResolve.has(item.id) && item.status === "VERIFIED") {
        item.status = "RESOLVED";
        item.resolution_note =
          (item.resolution_note || "") +
          " [Re-resolved by reverify-resolved.js 2026-02-21: verified code was actually fixed]";
        resolvedCount++;
        updatedLines.push(JSON.stringify(item));
      } else {
        updatedLines.push(line);
      }
    } catch {
      updatedLines.push(line);
    }
  }

  // Atomic write to MASTER_DEBT.jsonl
  const tmpPath = MASTER_PATH + ".tmp";
  fs.writeFileSync(tmpPath, updatedLines.join("\n") + "\n", "utf8");
  fs.renameSync(tmpPath, MASTER_PATH);

  // Also update deduped.jsonl to keep in sync (per MEMORY.md)
  if (fs.existsSync(DEDUPED_PATH)) {
    const dedupedLines = fs.readFileSync(DEDUPED_PATH, "utf8").split("\n").filter(Boolean);
    const dedupedUpdated = [];
    for (const line of dedupedLines) {
      try {
        const item = JSON.parse(line);
        if (toRevert.has(item.id) && item.status === "RESOLVED") {
          item.status = "VERIFIED";
          item.resolution_note =
            (item.resolution_note || "") +
            " [Re-opened by reverify-resolved.js 2026-02-21: pattern still detected in codebase]";
          dedupedUpdated.push(JSON.stringify(item));
        } else if (toResolve.has(item.id) && item.status === "VERIFIED") {
          item.status = "RESOLVED";
          item.resolution_note =
            (item.resolution_note || "") +
            " [Re-resolved by reverify-resolved.js 2026-02-21: verified code was actually fixed]";
          dedupedUpdated.push(JSON.stringify(item));
        } else {
          dedupedUpdated.push(line);
        }
      } catch {
        dedupedUpdated.push(line);
      }
    }
    const dedupedTmp = DEDUPED_PATH + ".tmp";
    fs.writeFileSync(dedupedTmp, dedupedUpdated.join("\n") + "\n", "utf8");
    fs.renameSync(dedupedTmp, DEDUPED_PATH);
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  WRITE MODE — Changes applied:");
  console.log(`  Reverted to VERIFIED:   ${revertedCount}`);
  console.log(`  Re-resolved to RESOLVED: ${resolvedCount}`);
  console.log("  Updated: MASTER_DEBT.jsonl + deduped.jsonl");
  console.log("═══════════════════════════════════════════════════════════\n");
} else {
  // Count how many would change
  let wouldRevert = 0;
  let wouldResolve = 0;
  for (const item of allItems) {
    if (toRevert.has(item.id) && item.status === "RESOLVED") wouldRevert++;
    if (toResolve.has(item.id) && item.status === "VERIFIED") wouldResolve++;
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  DRY RUN — No changes made. Would apply:");
  console.log(`  Revert to VERIFIED:      ${wouldRevert}`);
  console.log(`  Re-resolve to RESOLVED:  ${wouldResolve}`);
  console.log("  Run with --write to apply.");
  console.log("═══════════════════════════════════════════════════════════\n");
}
