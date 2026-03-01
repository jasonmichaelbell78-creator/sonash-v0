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

/** Symlink guard: returns false if path is a symlink (blocks symlink-based write redirection). */
function isSafeToWrite(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return true;
    return !fs.lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

/** Parse the numeric prefix from a review ID like "rev-123-..." or legacy "123" */
function parseRevNumber(id: string): number | null {
  const rev = /^rev-(\d+)(?:-|$)/.exec(id);
  if (rev) return Number.parseInt(rev[1], 10);
  // Accept legacy state values like "406"
  if (/^\d+$/.test(id)) return Number.parseInt(id, 10);
  return null;
}

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
    const escaped = normalizedPattern.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const patternRegex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i");
    if (patternRegex.test(lowerContent)) {
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
  if (/typescript|eslint|type|nullable|error[\s-]?handling|try[\s.-]?catch/.test(p)) {
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
export function generateRuleSkeleton(
  result: RecurrenceResult,
  usedIds: Set<string> = new Set()
): RuleSkeleton {
  const base =
    result.pattern
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/^-|-$/g, "")
      .slice(0, 40) || "unnamed";
  let hash = 0;
  for (let i = 0; i < result.pattern.length; i++)
    hash = (hash * 31 + (result.pattern.codePointAt(i) ?? 0)) >>> 0;
  const suffix = hash.toString(16).padStart(8, "0").slice(0, 6);
  let id = `${base}-${suffix}`;
  while (usedIds.has(id)) id = `${id}x`;
  usedIds.add(id);

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

/** Find the insertion point after a section header (before next ## or ---). */
function findInsertPoint(content: string, startIdx: number): number {
  // Search from after the section header line to avoid inserting within the header
  const headerLineEnd = content.indexOf("\n", startIdx);
  const searchFrom = headerLineEnd >= 0 ? headerLineEnd + 1 : startIdx;

  const nextSection = content.indexOf("\n## ", searchFrom);
  if (nextSection >= 0) return nextSection;
  const hrSeparator = content.indexOf("\n---\n", searchFrom);
  if (hrSeparator >= 0) return hrSeparator;
  return content.length;
}

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

  const missingSections: string[] = [];

  for (const [catName, catPatterns] of byCategory) {
    const sectionHeader = CATEGORY_TO_SECTION[catName] || CATEGORY_TO_SECTION["General"];
    const sectionIdx = content.indexOf(sectionHeader);
    if (sectionIdx === -1) {
      missingSections.push(sectionHeader);
      continue;
    }

    const insertPoint = findInsertPoint(content, sectionIdx + sectionHeader.length);
    const entries = catPatterns.map((p) => buildCodePatternsEntry(p, catName)).join("");
    content = content.slice(0, insertPoint) + entries + content.slice(insertPoint);
  }

  if (missingSections.length > 0) {
    throw new Error(
      `[promote-patterns] CODE_PATTERNS.md is missing expected section(s): ${missingSections.join(", ")}`
    );
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
    if (!isSafeToWrite(statePath)) {
      console.warn(
        "[promote-patterns] Warning: consolidation state path is unsafe (symlink or unreadable), skipping"
      );
      return;
    }
    let state: Record<string, unknown> = {};
    if (fs.existsSync(statePath)) {
      state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    }
    state.lastPromotionProcessedId = lastProcessedId;
    state.lastPromotionDate = new Date().toISOString().split("T")[0];
    const dir = path.dirname(statePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${statePath}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2) + "\n", "utf8");
    try {
      fs.renameSync(tmpPath, statePath);
    } catch {
      if (!isSafeToWrite(statePath)) {
        console.warn(
          "[promote-patterns] Warning: consolidation state path became unsafe (symlink), skipping"
        );
        return;
      }
      fs.copyFileSync(tmpPath, statePath);
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* best-effort */
      }
    }
  } catch {
    // Non-fatal -- log warning
    console.warn("[promote-patterns] Warning: Could not save consolidation state");
  }
}

/**
 * Write promoted patterns to CODE_PATTERNS.md using atomic tmp-file rename.
 */
function writePromotedPatterns(
  codePatternsPath: string,
  codePatternsContent: string,
  newPatterns: RecurrenceResult[]
): void {
  const updatedContent = insertPromotedPatterns(codePatternsContent, newPatterns);
  if (updatedContent === codePatternsContent) {
    throw new Error("[promote-patterns] Promotion insertion produced no changes.");
  }
  if (fs.existsSync(codePatternsPath) && fs.lstatSync(codePatternsPath).isSymbolicLink()) {
    throw new Error(
      "[promote-patterns] Refusing to write CODE_PATTERNS.md because it is a symlink."
    );
  }
  const tmpPath = `${codePatternsPath}.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, updatedContent, "utf8");
    try {
      fs.renameSync(tmpPath, codePatternsPath);
    } catch {
      // Cross-device fallback
      fs.copyFileSync(tmpPath, codePatternsPath);
    }
  } catch (err) {
    throw new Error(
      `[promote-patterns] Failed to write CODE_PATTERNS.md: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {
      /* best-effort cleanup */
    }
  }
}

/** Save consolidation state to the latest review ID in the batch. */
function updateConsolidationIfNeeded(projectRoot: string, reviews: ReviewRecordType[]): void {
  let best: { id: string; n: number } | null = null;
  for (const r of reviews) {
    const n = parseRevNumber(r.id);
    if (n === null) continue;
    if (!best || n > best.n) best = { id: r.id, n };
  }
  if (best) {
    saveConsolidationState(projectRoot, best.id);
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
  const { valid: allReviews } = readValidatedJsonl(reviewsPath, ReviewRecord, {
    quiet: true,
  });

  // 1b. Filter by consolidation state to only process new records
  const { lastProcessedId } = loadConsolidationState(projectRoot);
  const lastProcessedNum = parseRevNumber(lastProcessedId);

  // 2. Detect recurrence over the full corpus so thresholds are meaningful
  const recurringAll = detectRecurrence(allReviews, minOccurrences, minPRs);

  // Only consider patterns that appear in at least one newly-added review
  const recurring =
    lastProcessedNum === null
      ? recurringAll
      : recurringAll.filter((p) =>
          p.reviewIds.some((id) => {
            const n = parseRevNumber(id);
            return n === null ? true : n > lastProcessedNum;
          })
        );

  // Track which reviews are new (for state advancement later)
  const reviews =
    lastProcessedNum === null
      ? allReviews
      : allReviews.filter((r) => {
          const n = parseRevNumber(r.id);
          return n === null ? true : n > lastProcessedNum;
        });

  if (recurring.length === 0) {
    if (!options.dryRun && reviews.length > 0) {
      updateConsolidationIfNeeded(projectRoot, reviews);
    }
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
  let codePatternsReadable = true;
  try {
    codePatternsContent = fs.readFileSync(codePatternsPath, "utf8");
  } catch {
    codePatternsReadable = false;
  }

  const { newPatterns, alreadyPromoted } = filterAlreadyPromoted(recurring, codePatternsContent);

  // 4. Promote to CODE_PATTERNS.md (unless dry run)
  if (!options.dryRun && newPatterns.length > 0) {
    if (!codePatternsReadable) {
      throw new Error(
        `[promote-patterns] CODE_PATTERNS.md not found. Refusing to create/overwrite.`
      );
    }
    writePromotedPatterns(codePatternsPath, codePatternsContent, newPatterns);
  }

  // 5. Generate rule skeletons
  const usedIds = new Set<string>();
  const ruleSkeletons = newPatterns.map((p) => generateRuleSkeleton(p, usedIds));

  // 6. Update consolidation state (unless dry run)
  if (!options.dryRun && reviews.length > 0) {
    updateConsolidationIfNeeded(projectRoot, reviews);
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
  const minOccRaw =
    minOccIdx !== -1 && args[minOccIdx + 1] ? Number.parseInt(args[minOccIdx + 1], 10) : 3;
  const minOccurrences = Number.isFinite(minOccRaw) ? minOccRaw : 3;

  const minPRsIdx = args.indexOf("--min-prs");
  const minPRsRaw =
    minPRsIdx !== -1 && args[minPRsIdx + 1] ? Number.parseInt(args[minPRsIdx + 1], 10) : 2;
  const minPRs = Number.isFinite(minPRsRaw) ? minPRsRaw : 2;

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
