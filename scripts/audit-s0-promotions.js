#!/usr/bin/env node
/* global __dirname */
/**
 * audit-s0-promotions.js
 *
 * Audits items promoted to S0 during sprint categorization.
 * Demotes non-critical items back to S1 or S2.
 *
 * Uses git baseline (commit 08763212, which had 53 S0 items) to find items
 * that were promoted to S0 during later pipeline steps. The current deduped.jsonl
 * was already synced with MASTER, so we need the git history to find original severities.
 *
 * S0 criteria (KEEP): security vulns, auth bypass, data exposure, crashes,
 *   infinite loops, missing error handling on critical paths
 * DEMOTE: cognitive complexity, code duplication, missing tests, code style,
 *   naming conventions, refactoring suggestions
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const MASTER_PATH = path.join(__dirname, "..", "docs", "technical-debt", "MASTER_DEBT.jsonl");
const DEDUPED_PATH = path.join(__dirname, "..", "docs", "technical-debt", "raw", "deduped.jsonl");

// Git baseline: commit before the S0 inflation (53 S0 items at this point)
const BASELINE_COMMIT = "08763212";

function readJsonl(filePath) {
  try {
    return fs
      .readFileSync(filePath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .flatMap((l, idx) => {
        try {
          return [JSON.parse(l)];
        } catch {
          console.warn(
            `  WARN: malformed JSON at ${path.basename(filePath)}:${idx + 1} — skipping`
          );
          return [];
        }
      });
  } catch (err) {
    console.error(`Failed to read ${filePath}: ${err.message}`);
    process.exit(1);
  }
}

function readJsonlFromGit(commit, relPath) {
  try {
    const cwd = path.join(__dirname, "..");
    const stdout = execFileSync("git", ["show", `${commit}:${relPath}`], {
      cwd,
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    });
    return stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .flatMap((l, idx) => {
        try {
          return [JSON.parse(l)];
        } catch {
          console.warn(`  WARN: malformed JSON at git:${commit}:${relPath}:${idx + 1} — skipping`);
          return [];
        }
      });
  } catch (err) {
    console.error(`Failed to read ${relPath} from git commit ${commit}: ${err.message}`);
    process.exit(1);
  }
}

// Patterns that indicate NON-critical items (should be demoted)
const DEMOTE_PATTERNS = {
  // Cognitive complexity - always demote (code style, not a crash/security risk)
  cognitiveComplexity: {
    titlePatterns: [/cognitive complexity/i, /reduce its cognitive complexity/i],
    rulePatterns: [/S3776/],
    demoteTo: "S1",
  },
  // Code duplication
  codeDuplication: {
    titlePatterns: [/duplicat/i, /identical sub-expression/i, /same expression/i],
    rulePatterns: [/S1871/, /S3923/],
    demoteTo: "S1",
  },
  // Nesting depth
  nestingDepth: {
    titlePatterns: [/not nest functions more than/i, /nesting.*deep/i],
    rulePatterns: [/S2004/],
    demoteTo: "S1",
  },
  // Code style / naming
  codeStyle: {
    titlePatterns: [
      /use '?\[\[/i, // use [[ instead of [
      /use 'const' instead/i,
      /exporting mutable/i,
      /compare function/i,
      /unnecessary boolean/i,
      /remove this redundant/i,
      /unused import/i,
      /unused variable/i,
      /dead code/i,
      /unreachable code/i,
      /empty block/i,
      /deprecated/i,
      /naming convention/i,
      /rename this/i,
      /void.*operator/i,
      /use of the "void"/i,
    ],
    rulePatterns: [/S6861/, /S7688/, /S2871/, /S1125/, /S1186/],
    demoteTo: "S2",
  },
  // Missing tests (not a runtime risk)
  missingTests: {
    titlePatterns: [/missing test/i, /no test/i, /test coverage/i],
    rulePatterns: [],
    demoteTo: "S2",
  },
  // Refactoring suggestions (not bugs)
  refactoring: {
    titlePatterns: [
      /refactor this function/i,
      /extract this/i,
      /simplify this/i,
      /reduce the number of/i,
      /too many/i,
    ],
    rulePatterns: [/S107/, /S138/],
    demoteTo: "S1",
  },
  // Promise / async style (not crashes)
  asyncStyle: {
    titlePatterns: [/use.*await.*instead of.*then/i, /promise.*chain/i],
    rulePatterns: [],
    demoteTo: "S1",
  },
};

// Patterns that indicate CRITICAL items (should KEEP S0)
const KEEP_S0_PATTERNS = {
  titlePatterns: [
    /security/i,
    /vulnerab/i,
    /auth.*bypass/i,
    /data.*loss/i,
    /data.*expos/i,
    /crash/i,
    /infinite.*loop/i,
    /denial.*of.*service/i,
    /injection/i,
    /xss/i,
    /csrf/i,
    /privilege.*escalat/i,
    /unhandled.*reject/i,
    /uncaught.*exception/i,
    /memory.*leak/i,
    /race.*condition/i,
    /buffer.*overflow/i,
    /null.*pointer/i,
    /null.*dereference/i,
    /command.*injection/i,
    /path.*traversal/i,
    /sensitive.*data/i,
    /hardcoded.*secret/i,
    /hardcoded.*password/i,
    /hardcoded.*credential/i,
    /open.*redirect/i,
    /prototype.*pollut/i,
    /unsafe.*deserializ/i,
    /missing.*auth/i,
    /broken.*access/i,
    /insecure.*direct/i,
    /ssrf/i,
    /missing.*validation/i,
    /sanitiz/i,
    /unsanitiz/i,
    /unchecked.*input/i,
    /error.*handling.*critical/i,
    /atomic.*write/i,
    /toctou/i,
    /time.of.check/i,
    /file.*overwrite/i,
  ],
  categoryPatterns: [/security/i],
  typePatterns: [/vulnerability/i],
};

function shouldKeepS0(item) {
  const title = item.title || "";
  const desc = item.description || "";
  const category = item.category || "";
  const type = item.type || "";
  const combined = title + " " + desc;

  // Check if any KEEP pattern matches
  for (const pat of KEEP_S0_PATTERNS.titlePatterns) {
    if (pat.test(combined)) return true;
  }
  for (const pat of KEEP_S0_PATTERNS.categoryPatterns) {
    if (pat.test(category)) return true;
  }
  for (const pat of KEEP_S0_PATTERNS.typePatterns) {
    if (pat.test(type)) return true;
  }

  return false;
}

function getDemoteSeverity(item) {
  const title = item.title || "";
  const desc = item.description || "";
  const rule = item.rule || "";
  const combined = title + " " + desc;

  for (const [name, config] of Object.entries(DEMOTE_PATTERNS)) {
    for (const pat of config.titlePatterns) {
      if (pat.test(combined)) return { demoteTo: config.demoteTo, reason: name };
    }
    for (const pat of config.rulePatterns) {
      if (pat.test(rule)) return { demoteTo: config.demoteTo, reason: name };
    }
  }

  return null;
}

function main() {
  const master = readJsonl(MASTER_PATH);
  const deduped = readJsonl(DEDUPED_PATH);

  // Load baseline from git to find original severities before promotion
  console.log(`Loading baseline from git commit ${BASELINE_COMMIT}...`);
  const baseline = readJsonlFromGit(BASELINE_COMMIT, "docs/technical-debt/MASTER_DEBT.jsonl");

  // Build lookup by ID for baseline
  const baselineMap = new Map(baseline.map((i) => [i.id, i]));

  // Stats
  const masterS0 = master.filter((i) => i.severity === "S0");
  const baselineS0 = baseline.filter((i) => i.severity === "S0");

  console.log("");
  console.log("=== Pre-Audit Stats ===");
  console.log(`MASTER total: ${master.length}`);
  console.log(`MASTER S0: ${masterS0.length}`);
  console.log(`MASTER S1: ${master.filter((i) => i.severity === "S1").length}`);
  console.log(`MASTER S2: ${master.filter((i) => i.severity === "S2").length}`);
  console.log(`BASELINE (${BASELINE_COMMIT}) total: ${baseline.length}`);
  console.log(`BASELINE S0: ${baselineS0.length}`);
  console.log("");

  // Audit ALL current S0 items, not just promoted ones.
  // Items that were S0 in baseline but are cognitive complexity still don't meet S0 criteria.
  const promotedFromExisting = [];
  const newS0Items = [];
  const baselineS0Items = [];

  for (const item of masterS0) {
    const base = baselineMap.get(item.id);
    if (!base) {
      newS0Items.push(item);
    } else if (base.severity === "S0") {
      baselineS0Items.push(item);
    } else {
      promotedFromExisting.push(item);
    }
  }

  console.log(
    `Items promoted to S0 (existed in baseline with different severity): ${promotedFromExisting.length}`
  );
  console.log(`New items assigned S0 (not in baseline): ${newS0Items.length}`);
  console.log(`Original S0 items from baseline: ${baselineS0Items.length}`);
  console.log("");

  // Combine ALL S0 items for auditing (including baseline ones that may be cognitive complexity)
  const allToAudit = [
    ...promotedFromExisting.map((i) => ({
      item: i,
      origSev: baselineMap.get(i.id).severity,
      source: "promoted",
    })),
    ...newS0Items.map((i) => ({ item: i, origSev: "NEW", source: "new" })),
    ...baselineS0Items.map((i) => ({ item: i, origSev: "S0-baseline", source: "baseline" })),
  ];

  // Audit each item
  const kept = [];
  const demotedToS1 = [];
  const demotedToS2 = [];

  for (const { item, origSev, source } of allToAudit) {
    // First check: is it genuinely critical?
    if (shouldKeepS0(item)) {
      kept.push({ item, reason: "Matches critical pattern", origSev, source });
      continue;
    }

    // Second check: does it match a demote pattern?
    const demoteResult = getDemoteSeverity(item);
    if (demoteResult) {
      const entry = { item, reason: demoteResult.reason, origSev, source };
      if (demoteResult.demoteTo === "S1") {
        demotedToS1.push(entry);
      } else {
        demotedToS2.push(entry);
      }
      continue;
    }

    // Conservative: when in doubt, keep S0
    kept.push({ item, reason: "No matching demote pattern (conservative keep)", origSev, source });
  }

  // Report
  console.log("=== Audit Results ===");
  console.log(`Total audited: ${allToAudit.length}`);
  console.log(`Kept S0: ${kept.length}`);
  console.log(`Demoted to S1: ${demotedToS1.length}`);
  console.log(`Demoted to S2: ${demotedToS2.length}`);
  console.log("");

  if (demotedToS1.length > 0) {
    console.log("--- Demoted to S1 ---");
    for (const { item, reason, origSev } of demotedToS1) {
      console.log(`  ${item.id}: [${origSev}->S0->S1] (${reason}) ${item.title.substring(0, 70)}`);
    }
    console.log("");
  }

  if (demotedToS2.length > 0) {
    console.log("--- Demoted to S2 ---");
    for (const { item, reason, origSev } of demotedToS2) {
      console.log(`  ${item.id}: [${origSev}->S0->S2] (${reason}) ${item.title.substring(0, 70)}`);
    }
    console.log("");
  }

  if (kept.length > 0) {
    console.log("--- Kept S0 ---");
    for (const { item, reason, origSev } of kept) {
      console.log(`  ${item.id}: [orig:${origSev}] ${item.title.substring(0, 60)} (${reason})`);
    }
    console.log("");
  }

  // Apply demotions to master
  const demotionMap = new Map();
  for (const { item } of demotedToS1) {
    demotionMap.set(item.id, "S1");
  }
  for (const { item } of demotedToS2) {
    demotionMap.set(item.id, "S2");
  }

  let changedCount = 0;
  const updatedMaster = master.map((item) => {
    const newSev = demotionMap.get(item.id);
    if (newSev) {
      changedCount++;
      return { ...item, severity: newSev };
    }
    return item;
  });

  // Write updated MASTER_DEBT.jsonl
  const masterOutput = updatedMaster.map((i) => JSON.stringify(i)).join("\n") + "\n";
  fs.writeFileSync(MASTER_PATH, masterOutput, "utf8");
  console.log(`Wrote ${MASTER_PATH} (${changedCount} items modified)`);

  // Also update deduped.jsonl per MEMORY.md requirement
  const updatedDeduped = deduped.map((item) => {
    const newSev = demotionMap.get(item.id);
    if (newSev) {
      return { ...item, severity: newSev };
    }
    return item;
  });
  const dedupedOutput = updatedDeduped.map((i) => JSON.stringify(i)).join("\n") + "\n";
  fs.writeFileSync(DEDUPED_PATH, dedupedOutput, "utf8");
  console.log(`Wrote ${DEDUPED_PATH} (synced)`);

  // Post-audit stats
  console.log("");
  console.log("=== Post-Audit Stats ===");
  console.log(`S0: ${updatedMaster.filter((i) => i.severity === "S0").length}`);
  console.log(`S1: ${updatedMaster.filter((i) => i.severity === "S1").length}`);
  console.log(`S2: ${updatedMaster.filter((i) => i.severity === "S2").length}`);
}

main();
