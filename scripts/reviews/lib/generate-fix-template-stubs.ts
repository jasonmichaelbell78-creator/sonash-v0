/**
 * generate-fix-template-stubs.ts — FIX_TEMPLATES.md stub generator
 *
 * PIPE-08: Appends template skeletons to FIX_TEMPLATES.md for patterns
 * promoted by promote-patterns.ts that don't already have entries.
 *
 * Each stub includes: pattern name, description, occurrence count,
 * PR references, and placeholders for the actual fix example.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { readValidatedJsonl } from "./read-jsonl";
import { ReviewRecord } from "./schemas/review";
import { detectRecurrence, type RecurrenceResult } from "./promote-patterns";

// Walk up from __dirname until we find package.json
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const { isSafeToWrite } = require(
  path.resolve(findProjectRoot(__dirname), "scripts/lib/safe-fs.js")
) as { isSafeToWrite: (p: string) => boolean };

/**
 * Generate a fix template stub for a single pattern.
 *
 * @param pattern - The RecurrenceResult to generate a stub for
 * @param templateNumber - The template number to assign
 * @returns Markdown string for the template stub
 */
export function generateFixTemplateStub(pattern: RecurrenceResult, templateNumber: number): string {
  const displayName = pattern.pattern
    .replaceAll("-", " ")
    .replaceAll(/\b\w/g, (ch) => ch.toUpperCase());

  const prList =
    pattern.distinctPRs.size > 0
      ? Array.from(pattern.distinctPRs)
          .map((pr) => `#${pr}`)
          .join(", ")
      : "N/A";

  return [
    "",
    `### Template ${templateNumber}: ${displayName}`,
    "",
    `**Pattern:** ${pattern.pattern.replaceAll("-", " ")}`,
    `**When to use:** [TODO: fill in]`,
    `**Fix:**`,
    "```",
    "// TODO: add fix example",
    "```",
    `**Source:** Auto-generated from ${pattern.count}x recurrence across ${pattern.distinctPRs.size} PRs (${prList})`,
    "",
  ].join("\n");
}

/**
 * Find the next template number by scanning FIX_TEMPLATES.md for existing entries.
 *
 * @param content - The current content of FIX_TEMPLATES.md
 * @returns The next template number to use
 */
function findNextTemplateNumber(content: string): number {
  let maxNum = 0;
  // Match "### Template NN:" or "## Template NN:" patterns
  const lines = content.split("\n");
  for (const line of lines) {
    const match = /^#{2,3}\s+Template\s+(\d+)/.exec(line);
    if (match) {
      const num = Number.parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return maxNum + 1;
}

/** Check if a pattern already has a template entry in FIX_TEMPLATES.md content. */
function isPatternAlreadyTemplated(lowerContent: string, patternName: string): boolean {
  const normalizedName = patternName.toLowerCase().replaceAll("-", " ");
  const escaped = normalizedName.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const headingPattern = new RegExp(String.raw`#{2,3}\s+template\s+\d+:.*` + escaped, "i");
  return (
    headingPattern.test(lowerContent) || lowerContent.includes(`**pattern:** ${normalizedName}`)
  );
}

/** Write FIX_TEMPLATES.md atomically with cross-drive fallback. */
function writeFixTemplatesAtomic(
  fixTemplatesPath: string,
  existingContent: string,
  appendContent: string
): void {
  try {
    if (!isSafeToWrite(fixTemplatesPath)) {
      console.warn(
        "[generate-fix-template-stubs] Warning: FIX_TEMPLATES.md is unsafe (symlink), skipping write"
      );
      return;
    }

    const updatedContent = existingContent.trimEnd() + "\n" + appendContent + "\n";
    const tmpPath = `${fixTemplatesPath}.tmp-${process.pid}-${Date.now()}`;
    const fd = fs.openSync(tmpPath, "wx", 0o644);
    try {
      fs.writeFileSync(fd, updatedContent, "utf8");
    } finally {
      try {
        fs.closeSync(fd);
      } catch {
        /* best-effort */
      }
    }
    try {
      fs.renameSync(tmpPath, fixTemplatesPath);
    } catch {
      if (!isSafeToWrite(fixTemplatesPath)) {
        console.warn(
          "[generate-fix-template-stubs] Warning: FIX_TEMPLATES.md became unsafe (symlink), skipping write"
        );
        return;
      }
      if (fs.existsSync(fixTemplatesPath)) {
        const st = fs.lstatSync(fixTemplatesPath);
        if (st.isSymbolicLink() || !st.isFile()) {
          console.warn(
            "[generate-fix-template-stubs] Warning: FIX_TEMPLATES.md destination is not a regular file, skipping write"
          );
          return;
        }
      }
      fs.copyFileSync(tmpPath, fixTemplatesPath);
    } finally {
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {
        /* best-effort */
      }
    }
  } catch (err) {
    console.warn(
      `[generate-fix-template-stubs] Warning: Could not write FIX_TEMPLATES.md: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/**
 * Append fix template stubs to FIX_TEMPLATES.md for patterns not already present.
 *
 * @param projectRoot - Project root directory
 * @param patterns - RecurrenceResult array of patterns to create stubs for
 * @param dryRun - If true, returns the stubs without writing
 * @returns Object with stubs generated and patterns skipped
 */
export function appendFixTemplateStubs(
  projectRoot: string,
  patterns: RecurrenceResult[],
  dryRun = false
): { generated: string[]; skipped: string[] } {
  const fixTemplatesPath = path.join(projectRoot, "docs", "agent_docs", "FIX_TEMPLATES.md");

  let content: string;
  try {
    content = fs.readFileSync(fixTemplatesPath, "utf8");
  } catch {
    throw new Error("FIX_TEMPLATES.md not found at " + fixTemplatesPath);
  }

  const lowerContent = content.toLowerCase();
  const generated: string[] = [];
  const skipped: string[] = [];

  let nextNum = findNextTemplateNumber(content);
  let appendContent = "";

  for (const p of patterns) {
    if (isPatternAlreadyTemplated(lowerContent, p.pattern)) {
      skipped.push(p.pattern);
      continue;
    }

    const stub = generateFixTemplateStub(p, nextNum);
    appendContent += stub;
    generated.push(p.pattern);
    nextNum++;
  }

  if (!dryRun && appendContent) {
    writeFixTemplatesAtomic(fixTemplatesPath, content, appendContent);
  }

  return { generated, skipped };
}

/**
 * CLI entry point.
 */
export function main(args: string[]): void {
  const dryRun = args.includes("--dry-run");
  const projectRoot = findProjectRoot(__dirname);

  console.log("=== Generate FIX_TEMPLATE Stubs ===");
  console.log(`Mode: ${dryRun ? "dry-run" : "write"}`);
  console.log("");

  // Load reviews and detect recurrence
  const reviewsPath = path.join(projectRoot, "data", "ecosystem-v2", "reviews.jsonl");
  const { valid: reviews } = readValidatedJsonl(reviewsPath, ReviewRecord, {
    quiet: true,
  });

  // Use same thresholds as promote-patterns default
  const recurring = detectRecurrence(reviews, 1, 1);
  console.log(`Total recurring patterns: ${recurring.length}`);

  const result = appendFixTemplateStubs(projectRoot, recurring, dryRun);

  console.log(`\nStubs generated: ${result.generated.length}`);
  if (result.generated.length > 0) {
    for (const name of result.generated) {
      console.log(`  + ${name}`);
    }
  }

  console.log(`Skipped (already in FIX_TEMPLATES): ${result.skipped.length}`);
  if (result.skipped.length > 0) {
    for (const name of result.skipped) {
      console.log(`  - ${name}`);
    }
  }

  if (dryRun) {
    console.log("\n[DRY RUN] FIX_TEMPLATES.md not modified.");

    // Show a preview of what would be generated
    if (result.generated.length > 0) {
      console.log("\n--- Preview (first stub) ---");
      const firstGeneratedName = result.generated[0];
      const firstPattern = recurring.find((p) => p.pattern === firstGeneratedName);
      if (firstPattern) {
        const preview = generateFixTemplateStub(firstPattern, 46);
        console.log(preview);
      }
    }
  } else if (result.generated.length > 0) {
    console.log("\nFIX_TEMPLATES.md updated.");
  }
}
