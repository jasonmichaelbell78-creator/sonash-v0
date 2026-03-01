/**
 * promote-patterns.ts — Merged promotion pipeline
 *
 * Detects patterns recurring N>=3 times across M>=2 distinct PRs from reviews.jsonl,
 * promotes them to CODE_PATTERNS.md with dedup, and generates enforcement rule skeletons.
 *
 * PIPE-05 (merged promotion), PIPE-06 (auto rule generation)
 *
 * Does NOT modify run-consolidation.js — both coexist during transition.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { readValidatedJsonl } from "./read-jsonl";
import { ReviewRecord, type ReviewRecordType } from "./schemas/review";

// Walk up from __dirname until we find package.json (works from both source and dist)
function findProjectRoot(startDir: string): string {
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

/** Result of recurrence detection for a single pattern. */
export interface RecurrenceResult {
  pattern: string;
  count: number;
  distinctPRs: Set<number>;
  reviewIds: string[];
}

/** Enforcement rule skeleton matching check-pattern-compliance.js format. */
export interface RuleSkeleton {
  id: string;
  pattern: string;
  message: string;
  fix: string;
  fileTypes: string[];
  severity: string;
}

/** Result of the full promotion pipeline. */
export interface PromotionResult {
  promoted: RecurrenceResult[];
  skipped: RecurrenceResult[];
  ruleSkeletons: RuleSkeleton[];
  alreadyPromoted: string[];
}

/** Accumulated data for a single normalized pattern. */
interface PatternAccumulator {
  count: number;
  distinctPRs: Set<number>;
  reviewIds: Set<string>;
}

/** Accumulate a single review's patterns into the pattern map. */
function accumulateReviewPatterns(
  review: ReviewRecordType,
  patternMap: Map<string, PatternAccumulator>
): void {
  if (!review.patterns || review.patterns.length === 0) return;

  for (const rawPattern of review.patterns) {
    const normalized = rawPattern.toLowerCase().trim();
    if (!normalized) continue;

    let entry = patternMap.get(normalized);
    if (!entry) {
      entry = { count: 0, distinctPRs: new Set(), reviewIds: new Set() };
      patternMap.set(normalized, entry);
    }

    // Only count once per review (same pattern in same review = 1 occurrence)
    if (!entry.reviewIds.has(review.id)) {
      entry.count++;
      entry.reviewIds.add(review.id);
    }

    // Track distinct PRs (null/undefined PR = skip)
    if (review.pr != null) {
      entry.distinctPRs.add(review.pr);
    }
  }
}

/** Filter pattern map to entries meeting both thresholds and convert to results. */
function filterAndSortPatterns(
  patternMap: Map<string, PatternAccumulator>,
  minOccurrences: number,
  minDistinctPRs: number
): RecurrenceResult[] {
  const results: RecurrenceResult[] = [];
  for (const [pattern, data] of patternMap) {
    if (data.count >= minOccurrences && data.distinctPRs.size >= minDistinctPRs) {
      results.push({
        pattern,
        count: data.count,
        distinctPRs: data.distinctPRs,
        reviewIds: Array.from(data.reviewIds),
      });
    }
  }

  // Sort by count descending, then alphabetically
  results.sort((a, b) => b.count - a.count || a.pattern.localeCompare(b.pattern));
  return results;
}

/**
 * Detect patterns recurring N>=minOccurrences times across M>=minDistinctPRs distinct PRs.
 *
 * Normalizes pattern strings to lowercase for comparison.
 * Returns results sorted by count descending.
 */
export function detectRecurrence(
  reviews: ReviewRecordType[],
  minOccurrences = 3,
  minDistinctPRs = 2
): RecurrenceResult[] {
  const patternMap = new Map<string, PatternAccumulator>();

  for (const review of reviews) {
    accumulateReviewPatterns(review, patternMap);
  }

  return filterAndSortPatterns(patternMap, minOccurrences, minDistinctPRs);
}

/**
 * Filter out patterns already present in CODE_PATTERNS.md.
 * Checks against existing headings and table rows using fuzzy matching.
 */
export function filterAlreadyPromoted(
  patterns: RecurrenceResult[],
  codePatternsContent: string
): { newPatterns: RecurrenceResult[]; alreadyPromoted: string[] } {
  const lowerContent = codePatternsContent.toLowerCase();
  const newPatterns: RecurrenceResult[] = [];
  const alreadyPromoted: string[] = [];

  for (const p of patterns) {
    // Normalize for comparison: lowercase, replace hyphens with spaces
    const normalizedPattern = p.pattern.toLowerCase().replaceAll("-", " ");
    if (lowerContent.includes(normalizedPattern)) {
      alreadyPromoted.push(p.pattern);
    } else {
      newPatterns.push(p);
    }
  }

  return { newPatterns, alreadyPromoted };
}

/**
 * Categorize a pattern into one of: Security, JavaScript/TypeScript, Bash/Shell,
 * CI/Automation, Documentation, General.
 *
 * Uses keyword-based matching similar to run-consolidation.js categorizePatterns.
 */
export function categorizePattern(pattern: string): string {
  const p = pattern.toLowerCase();
  if (/security|injection|ssrf|xss|traversal|redos|sanitiz|escape|prototype|symlink/.test(p)) {
    return "Security";
  }
  if (/typescript|eslint|type|nullable|error.handling|try.catch/.test(p)) {
    return "JavaScript/TypeScript";
  }
  if (/shell|bash|cross-platform|crlf/.test(p)) {
    return "Bash/Shell";
  }
  if (/ci|github.actions|pre-commit|pre-push|automation|workflow/.test(p)) {
    return "CI/Automation";
  }
  if (/documentation|markdown|link|docs/.test(p)) {
    return "Documentation";
  }
  return "General";
}

/**
 * Generate an enforcement rule skeleton for check-pattern-compliance.js.
 */
export function generateRuleSkeleton(result: RecurrenceResult): RuleSkeleton {
  const rawId = result.pattern
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const id = rawId || "unnamed";

  return {
    id,
    pattern: "TODO_REGEX",
    message: result.pattern,
    fix: `TODO: describe the correct pattern (${result.count}x recurrence across ${result.distinctPRs.size} PRs)`,
    fileTypes: [".js", ".ts"],
    severity: result.count >= 5 ? "error" : "warning",
  };
}

/**
 * Build a CODE_PATTERNS.md entry for a promoted pattern.
 */
function buildCodePatternsEntry(result: RecurrenceResult, category: string): string {
  const title = result.pattern.replaceAll("-", " ").replaceAll(/\b\w/g, (ch) => ch.toUpperCase());

  const prRefs =
    result.distinctPRs.size > 0
      ? `PRs: #${Array.from(result.distinctPRs).join(", #")}`
      : `Reviews: ${result.reviewIds.join(", ")}`;

  return [
    "",
    `### ${title}`,
    "",
    `**Rule:** ${title} -- recurring pattern from ${result.count} reviews (${prRefs})`,
    "",
    `**Enforcement status:** pending`,
    "",
    `**Source:** Auto-promoted by promote-patterns pipeline`,
    "",
  ].join("\n");
}

/**
 * Map category name to CODE_PATTERNS.md section header.
 */
const CATEGORY_TO_SECTION: Record<string, string> = {
  Security: "## Security",
  "JavaScript/TypeScript": "## JavaScript/TypeScript",
  "Bash/Shell": "## Bash/Shell",
  "CI/Automation": "## CI/Automation",
  Documentation: "## Documentation",
  General: "## General",
};

/**
 * Insert promoted patterns into CODE_PATTERNS.md content, grouped by category.
 * Returns the updated content.
 */
function insertPromotedPatterns(content: string, patterns: RecurrenceResult[]): string {
  // Group by category
  const byCategory = new Map<string, RecurrenceResult[]>();
  for (const p of patterns) {
    const cat = categorizePattern(p.pattern);
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(p);
  }

  for (const [catName, catPatterns] of byCategory) {
    const sectionHeader = CATEGORY_TO_SECTION[catName] || CATEGORY_TO_SECTION["General"];
    const sectionIdx = content.indexOf(sectionHeader);
    if (sectionIdx === -1) continue;

    // Find the next ## section after this one to insert before it
    const afterSection = content.indexOf("\n## ", sectionIdx + sectionHeader.length);
    const insertPoint =
      afterSection === -1 ? content.indexOf("\n---\n", sectionIdx + 100) : afterSection;
    if (insertPoint === -1) continue;

    const entries = catPatterns.map((p) => buildCodePatternsEntry(p, catName)).join("");
    content = content.slice(0, insertPoint) + entries + content.slice(insertPoint);
  }

  return content;
}

/**
 * Load and update consolidation state for idempotency.
 */
function loadConsolidationState(projectRoot: string): { lastProcessedId: string } {
  const statePath = path.join(projectRoot, ".claude", "state", "consolidation.json");
  try {
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
      return {
        lastProcessedId: String(
          state.lastPromotionProcessedId || state.lastConsolidatedReview || 0
        ),
      };
    }
  } catch {
    // State file missing or corrupt -- start fresh
  }
  return { lastProcessedId: "0" };
}

function saveConsolidationState(projectRoot: string, lastProcessedId: string): void {
  const statePath = path.join(projectRoot, ".claude", "state", "consolidation.json");
  try {
    let state: Record<string, unknown> = {};
    if (fs.existsSync(statePath)) {
      state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    }
    state.lastPromotionProcessedId = lastProcessedId;
    state.lastPromotionDate = new Date().toISOString().split("T")[0];
    const dir = path.dirname(statePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", "utf8");
  } catch {
    // Non-fatal -- log warning
    console.warn("[promote-patterns] Warning: Could not save consolidation state");
  }
}

/**
 * Full promotion pipeline orchestrator.
 *
 * 1. Reads reviews.jsonl
 * 2. Detects recurrence
 * 3. Filters already-promoted
 * 4. Promotes to CODE_PATTERNS.md
 * 5. Generates rule skeletons
 * 6. Updates consolidation state
 */
export function promotePatterns(options: {
  projectRoot?: string;
  dryRun?: boolean;
  minOccurrences?: number;
  minPRs?: number;
}): PromotionResult {
  const projectRoot = options.projectRoot || findProjectRoot(__dirname);
  const minOccurrences = options.minOccurrences ?? 3;
  const minPRs = options.minPRs ?? 2;

  // 1. Read reviews
  const reviewsPath = path.join(projectRoot, "data", "ecosystem-v2", "reviews.jsonl");
  const { valid: reviews } = readValidatedJsonl(reviewsPath, ReviewRecord, {
    quiet: true,
  });

  // 2. Detect recurrence
  const recurring = detectRecurrence(reviews, minOccurrences, minPRs);

  if (recurring.length === 0) {
    return {
      promoted: [],
      skipped: [],
      ruleSkeletons: [],
      alreadyPromoted: [],
    };
  }

  // 3. Filter already-promoted
  const codePatternsPath = path.join(projectRoot, "docs", "agent_docs", "CODE_PATTERNS.md");
  let codePatternsContent = "";
  try {
    codePatternsContent = fs.readFileSync(codePatternsPath, "utf8");
  } catch {
    // File missing -- all patterns are new
  }

  const { newPatterns, alreadyPromoted } = filterAlreadyPromoted(recurring, codePatternsContent);

  // 4. Promote to CODE_PATTERNS.md (unless dry run)
  if (!options.dryRun && newPatterns.length > 0) {
    const updatedContent = insertPromotedPatterns(codePatternsContent, newPatterns);
    try {
      fs.writeFileSync(codePatternsPath, updatedContent, "utf8");
    } catch (err) {
      console.warn(
        `[promote-patterns] Warning: Could not write CODE_PATTERNS.md: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // 5. Generate rule skeletons
  const ruleSkeletons = newPatterns.map(generateRuleSkeleton);

  // 6. Update consolidation state (unless dry run)
  if (!options.dryRun && reviews.length > 0) {
    const lastId = reviews.at(-1)!.id;
    saveConsolidationState(projectRoot, lastId);
  }

  return {
    promoted: newPatterns,
    skipped: recurring.filter((r) => alreadyPromoted.includes(r.pattern)),
    ruleSkeletons,
    alreadyPromoted,
  };
}

/**
 * CLI entry point -- called when script is run directly.
 */
export function main(args: string[]): void {
  const dryRun = args.includes("--dry-run");

  const minOccIdx = args.indexOf("--min-occurrences");
  const minOccurrences =
    minOccIdx !== -1 && args[minOccIdx + 1] ? Number.parseInt(args[minOccIdx + 1], 10) : 3;

  const minPRsIdx = args.indexOf("--min-prs");
  const minPRs =
    minPRsIdx !== -1 && args[minPRsIdx + 1] ? Number.parseInt(args[minPRsIdx + 1], 10) : 2;

  console.log("=== Promote Patterns Pipeline ===");
  console.log(`Config: minOccurrences=${minOccurrences}, minPRs=${minPRs}, dryRun=${dryRun}`);
  console.log("");

  const result = promotePatterns({
    dryRun,
    minOccurrences,
    minPRs,
  });

  console.log(`Recurring patterns found: ${result.promoted.length + result.skipped.length}`);
  console.log(`Already promoted (skipped): ${result.alreadyPromoted.length}`);
  console.log(`New patterns to promote: ${result.promoted.length}`);
  console.log("");

  if (result.promoted.length > 0) {
    console.log("--- Promoted Patterns ---");
    for (const p of result.promoted) {
      console.log(
        `  ${p.pattern} (${p.count}x, ${p.distinctPRs.size} PRs, reviews: ${p.reviewIds.join(", ")})`
      );
    }
    console.log("");
  }

  if (result.alreadyPromoted.length > 0) {
    console.log("--- Already in CODE_PATTERNS.md (skipped) ---");
    for (const name of result.alreadyPromoted) {
      console.log(`  ${name}`);
    }
    console.log("");
  }

  if (result.ruleSkeletons.length > 0) {
    console.log("--- Rule Skeletons (JSON) ---");
    console.log(JSON.stringify(result.ruleSkeletons, null, 2));
  }

  if (dryRun) {
    console.log("\n[DRY RUN] No files were modified.");
  } else if (result.promoted.length > 0) {
    console.log("\nCODE_PATTERNS.md updated. Consolidation state saved.");
  }
}
