/**
 * Build Enforcement Manifest
 *
 * CLI that scans CODE_PATTERNS.md, regex rules, ESLint rules, and Semgrep rules
 * to build a per-pattern enforcement manifest (JSONL).
 *
 * Usage: npx ts-node scripts/reviews/build-enforcement-manifest.ts [--dry-run]
 */

import * as fs from "node:fs";
import * as path from "node:path";

// Walk up from __dirname until we find package.json (forward-declared for isSafeToWrite)
function findProjectRootEarly(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition -- continue walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { isSafeToWrite } = require(
  path.resolve(findProjectRootEarly(__dirname), "scripts/lib/safe-fs.js")
) as {
  isSafeToWrite: (filePath: string) => boolean;
};

import {
  EnforcementRecord,
  EnforcementRecordSchema,
  Mechanisms,
  classifyCoverage,
  isStale,
} from "./lib/enforcement-manifest";
import { appendRecord } from "./lib/write-jsonl";

const PROJECT_ROOT = findProjectRootEarly(__dirname);
const DRY_RUN = process.argv.includes("--dry-run");
const TODAY = new Date().toISOString().slice(0, 10);

// --- Pattern Categories from CODE_PATTERNS.md ---

interface PatternEntry {
  id: string;
  name: string;
  priority: "critical" | "important" | "edge";
  category: string;
}

/**
 * Slugify a pattern name for ID matching.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Map priority emoji to tier.
 */
function parsePriority(emoji: string): "critical" | "important" | "edge" {
  if (emoji.includes("\uD83D\uDD34") || emoji.includes("critical")) return "critical"; // red circle
  if (emoji.includes("\uD83D\uDFE1") || emoji.includes("important")) return "important"; // yellow circle
  return "edge";
}

/**
 * Parse CODE_PATTERNS.md to extract all patterns with their categories and priorities.
 */
function parseCodePatterns(filePath: string): PatternEntry[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    throw new Error(
      `Failed to read CODE_PATTERNS.md: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const patterns: PatternEntry[] = [];
  const lines = content.split(/\r?\n/);

  // Track current category (## heading)
  let currentCategory = "";
  // Skip meta sections
  const skipSections = new Set([
    "Purpose",
    "Quick Start",
    "Priority Tiers",
    "Pattern Categories",
    "Version History",
  ]);

  // First pass: extract Critical Patterns Quick Reference (### N. Name)
  const criticalPatternSection = "Critical Patterns";

  for (const line of lines) {
    // Detect ## category headings
    const catMatch = /^## (.+)$/.exec(line);
    if (catMatch) {
      const rawCat = catMatch[1]
        .replace(/\u{1F534}/gu, "")
        .replace(/\u{1F7E1}/gu, "")
        .replace(/\u26AA/gu, "")
        .replace(/\uFE0F/gu, "")
        .trim();
      if (skipSections.has(rawCat)) {
        currentCategory = "";
        continue;
      }
      // Handle the critical patterns section specially
      if (rawCat.includes("Critical Patterns Quick Reference")) {
        currentCategory = criticalPatternSection;
      } else {
        currentCategory = rawCat;
      }
      continue;
    }

    if (!currentCategory) continue;

    // Detect ### N. Name (critical patterns section)
    if (currentCategory === criticalPatternSection) {
      const critMatch = /^### (\d+)\. (.+)$/.exec(line);
      if (critMatch) {
        const name = critMatch[2].trim();
        patterns.push({
          id: slugify(name),
          name,
          priority: "critical",
          category: criticalPatternSection,
        });
      }
      continue;
    }

    // Detect ### subsection headings (e.g., "### Cross Platform", "### Refactor")
    const subMatch = /^### (.+)$/.exec(line);
    if (subMatch) {
      const subName = subMatch[1].trim();
      patterns.push({
        id: slugify(subName),
        name: subName,
        priority: "important",
        category: currentCategory,
      });
      continue;
    }

    // Detect table rows: | Priority | Pattern | Rule | Why |
    const tableMatch = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/.exec(
      line
    );
    if (tableMatch) {
      const priorityCell = tableMatch[1].trim();
      const patternName = tableMatch[2].trim();

      // Skip header row and separator
      if (
        patternName === "Pattern" ||
        patternName.startsWith("---") ||
        priorityCell.startsWith("---")
      )
        continue;

      // Parse priority from emoji
      const priority = parsePriority(priorityCell);

      patterns.push({
        id: slugify(patternName),
        name: patternName,
        priority,
        category: currentCategory,
      });
    }
  }

  return patterns;
}

// --- Rule Source Scanning ---

interface RuleSource {
  regexRules: Set<string>; // IDs from check-pattern-compliance.js
  eslintRules: Set<string>; // Rule names from eslint-plugin-sonash
  semgrepRules: Map<string, string>; // code-pattern-ref -> rule ID
  claudeMdPatterns: Set<string>; // Pattern names from CLAUDE.md Section 4
}

/**
 * Extract regex rule IDs from check-pattern-compliance.js.
 */
function scanRegexRules(projectRoot: string): Set<string> {
  const filePath = path.join(projectRoot, "scripts/check-pattern-compliance.js");
  const rules = new Set<string>();

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // Match id: "rule-name" in ANTI_PATTERNS array
    const idRegex = /id:\s*"([^"]+)"/g;
    let match: RegExpExecArray | null;
    while ((match = idRegex.exec(content)) !== null) {
      rules.add(match[1]);
    }
  } catch (err) {
    console.warn(
      `Warning: Could not scan regex rules: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return rules;
}

/**
 * Extract ESLint rule names from eslint-plugin-sonash/index.js.
 */
function scanEslintRules(projectRoot: string): Set<string> {
  const filePath = path.join(projectRoot, "eslint-plugin-sonash/index.js");
  const rules = new Set<string>();

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // Match "rule-name": ruleVar in the rules object
    const ruleRegex = /"([^"]+)":\s*\w+/g;
    let match: RegExpExecArray | null;
    while ((match = ruleRegex.exec(content)) !== null) {
      rules.add(match[1]);
    }
  } catch (err) {
    console.warn(
      `Warning: Could not scan ESLint rules: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return rules;
}

/**
 * Scan Semgrep YAML rules for IDs and code-pattern-ref metadata.
 */
function scanSemgrepRules(projectRoot: string): Map<string, string> {
  const rulesDir = path.join(projectRoot, ".semgrep/rules");
  const refToId = new Map<string, string>();

  function scanDir(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith(".yml") || entry.name.endsWith(".yaml")) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          // Extract rule ID
          const idMatch = content.match(/- id:\s*(.+)/);
          // Extract code-pattern-ref
          const refMatch = content.match(/code-pattern-ref:\s*"?([^"\n]+)"?/);
          if (idMatch && refMatch) {
            const ruleId = idMatch[1].trim();
            const ref = refMatch[1].trim();
            // Store: ref -> ruleId (may have multiple rules per ref)
            const existing = refToId.get(ref);
            if (existing) {
              refToId.set(ref, existing + "," + ruleId);
            } else {
              refToId.set(ref, ruleId);
            }
          }
        } catch {
          // Skip unreadable files
        }
      }
    }
  }

  scanDir(rulesDir);
  return refToId;
}

/**
 * Extract pattern names referenced in CLAUDE.md Section 4.
 */
function scanClaudeMd(projectRoot: string): Set<string> {
  const filePath = path.join(projectRoot, "CLAUDE.md");
  const patterns = new Set<string>();

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // Find Section 4 content
    const section4Match = content.match(/## 4\. Critical Anti-Patterns([\s\S]*?)(?=\n## \d|$)/);
    if (section4Match) {
      const section = section4Match[1];
      // Extract pattern names from the table
      const rowRegex = /^\|\s*([^|]+?)\s*\|/gm;
      let match: RegExpExecArray | null;
      while ((match = rowRegex.exec(section)) !== null) {
        const name = match[1].trim();
        if (name && name !== "Pattern" && !name.startsWith("---")) {
          patterns.add(name.toLowerCase());
        }
      }
    }
  } catch (err) {
    console.warn(
      `Warning: Could not scan CLAUDE.md: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return patterns;
}

// --- Matching Logic ---

/**
 * Fuzzy match: check if a rule ID contains the pattern slug or vice versa.
 */
function fuzzyMatch(ruleId: string, patternSlug: string): boolean {
  const normalizedRule = ruleId.toLowerCase().replace(/[_-]/g, "");
  const normalizedSlug = patternSlug.replace(/[_-]/g, "");

  // Direct containment
  if (normalizedRule.includes(normalizedSlug)) return true;
  if (normalizedSlug.includes(normalizedRule)) return true;

  // Check significant words (3+ chars) -- split BEFORE normalization to preserve word boundaries
  const slugWords = patternSlug
    .toLowerCase()
    .split(/[-_]+/)
    .filter((w) => w.length >= 3);
  const ruleWords = ruleId
    .toLowerCase()
    .split(/[-_]+/)
    .filter((w) => w.length >= 3);
  const slugMatchCount = slugWords.filter((w) => normalizedRule.includes(w)).length;
  const ruleMatchCount = ruleWords.filter((w) => normalizedSlug.includes(w)).length;

  // Match if 60% of either side's words appear in the other
  if (slugWords.length > 0 && slugMatchCount >= Math.ceil(slugWords.length * 0.6)) return true;
  if (ruleWords.length > 0 && ruleMatchCount >= Math.ceil(ruleWords.length * 0.6)) return true;

  return false;
}

/**
 * Build mechanisms for a given pattern by checking all rule sources.
 */
function buildMechanisms(pattern: PatternEntry, sources: RuleSource): Mechanisms {
  const mechanisms: Mechanisms = {
    regex: "none",
    eslint: "none",
    semgrep: "none",
    cross_doc: "none",
    hooks: "none",
    ai: "none",
    manual: "code-review",
  };

  const slug = pattern.id;

  // Check regex rules
  for (const ruleId of sources.regexRules) {
    if (fuzzyMatch(ruleId, slug)) {
      mechanisms.regex = `active:${ruleId}`;
      break;
    }
  }

  // Check ESLint rules
  for (const ruleName of sources.eslintRules) {
    if (fuzzyMatch(ruleName, slug)) {
      mechanisms.eslint = `active:${ruleName}`;
      break;
    }
  }

  // Check Semgrep rules -- exact slug match only (no category-level or fuzzy matching)
  for (const [ref, ruleId] of sources.semgrepRules) {
    const refSlug = slugify(ref);
    if (refSlug === slug) {
      mechanisms.semgrep = `active:${ruleId}`;
      break;
    }
  }

  // Hooks: if regex or ESLint is active, hooks = pre-commit
  if (mechanisms.regex !== "none" || mechanisms.eslint !== "none") {
    mechanisms.hooks = "pre-commit";
  }

  // AI: check CLAUDE.md Section 4
  const slugLower = pattern.name.toLowerCase();
  for (const claudePattern of sources.claudeMdPatterns) {
    if (slugLower.includes(claudePattern) || claudePattern.includes(slugLower.slice(0, 10))) {
      mechanisms.ai = "claude-md";
      break;
    }
  }

  return mechanisms;
}

// --- Main ---

function main(): void {
  console.log("Building enforcement manifest...\n");

  // 1. Parse CODE_PATTERNS.md
  const codePatternsPath = path.join(PROJECT_ROOT, "docs/agent_docs/CODE_PATTERNS.md");
  const patterns = parseCodePatterns(codePatternsPath);
  console.log(`Parsed ${patterns.length} patterns from CODE_PATTERNS.md`);

  // 2. Scan all rule sources
  const sources: RuleSource = {
    regexRules: scanRegexRules(PROJECT_ROOT),
    eslintRules: scanEslintRules(PROJECT_ROOT),
    semgrepRules: scanSemgrepRules(PROJECT_ROOT),
    claudeMdPatterns: scanClaudeMd(PROJECT_ROOT),
  };

  console.log(`Found ${sources.regexRules.size} regex rules`);
  console.log(`Found ${sources.eslintRules.size} ESLint rules`);
  console.log(`Found ${sources.semgrepRules.size} Semgrep rule refs`);
  console.log(`Found ${sources.claudeMdPatterns.size} CLAUDE.md patterns\n`);

  // 3. Build manifest records
  const records: EnforcementRecord[] = [];
  for (const pattern of patterns) {
    const mechanisms = buildMechanisms(pattern, sources);
    const coverage = classifyCoverage(mechanisms);

    const record: EnforcementRecord = {
      pattern_id: pattern.id,
      pattern_name: pattern.name,
      priority: pattern.priority,
      category: pattern.category,
      mechanisms,
      coverage,
      status: "active",
      last_verified: TODAY,
    };

    // Detect staleness
    if (isStale(record)) {
      record.status = "stale";
    }

    records.push(record);
  }

  // 4. Write manifest
  const manifestPath = path.join(PROJECT_ROOT, "data/ecosystem-v2/enforcement-manifest.jsonl");

  if (DRY_RUN) {
    console.log("[DRY RUN] Would write to:", manifestPath);
    console.log("[DRY RUN] Sample records:");
    for (const r of records.slice(0, 3)) {
      console.log(JSON.stringify(r));
    }
  } else {
    // Clear existing manifest before writing (with symlink guard)
    if (!isSafeToWrite(manifestPath)) {
      throw new Error(`Refusing to write to unsafe path: ${path.basename(manifestPath)}`);
    }
    try {
      fs.writeFileSync(manifestPath, "", "utf-8");
    } catch {
      // File may not exist yet
    }

    for (const record of records) {
      appendRecord(manifestPath, record, EnforcementRecordSchema);
    }
    console.log(`Wrote ${records.length} records to ${path.relative(PROJECT_ROOT, manifestPath)}`);
  }

  // 5. Print summary
  const automated = records.filter((r) => r.coverage === "automated").length;
  const aiAssisted = records.filter((r) => r.coverage === "ai-assisted").length;
  const manualOnly = records.filter((r) => r.coverage === "manual-only").length;
  const noCoverage = records.filter((r) => r.coverage === "none").length;
  const staleCount = records.filter((r) => r.status === "stale").length;
  const total = records.length;

  const pct = (n: number) => (total > 0 ? ((n / total) * 100).toFixed(1) : "0.0");

  console.log("\nEnforcement Manifest Built:");
  console.log(`  - Total patterns: ${total}`);
  console.log(`  - Automated (regex/eslint/semgrep/hooks): ${automated} (${pct(automated)}%)`);
  console.log(`  - AI-assisted: ${aiAssisted} (${pct(aiAssisted)}%)`);
  console.log(`  - Manual-only: ${manualOnly} (${pct(manualOnly)}%)`);
  console.log(`  - No enforcement: ${noCoverage} (${pct(noCoverage)}%)`);
  console.log(`  - Stale patterns: ${staleCount}`);
}

// CLI entry point
if (require.main === module) {
  main();
}

export {
  parseCodePatterns,
  scanRegexRules,
  scanEslintRules,
  scanSemgrepRules,
  buildMechanisms,
  slugify,
};
