/**
 * generate-fix-template-stubs.ts — FIX_TEMPLATES.md stub generator
 *
 * PIPE-08: Appends template skeletons to FIX_TEMPLATES.md for patterns
 * promoted by promote-patterns.ts that don't already have entries.
 *
 * Each stub includes: pattern name, description, occurrence count,
 * PR references, and placeholders for the actual fix example.
 */
import { type RecurrenceResult } from "./promote-patterns";
/**
 * Generate a fix template stub for a single pattern.
 *
 * @param pattern - The RecurrenceResult to generate a stub for
 * @param templateNumber - The template number to assign
 * @returns Markdown string for the template stub
 */
export declare function generateFixTemplateStub(pattern: RecurrenceResult, templateNumber: number): string;
/**
 * Append fix template stubs to FIX_TEMPLATES.md for patterns not already present.
 *
 * @param projectRoot - Project root directory
 * @param patterns - RecurrenceResult array of patterns to create stubs for
 * @param dryRun - If true, returns the stubs without writing
 * @returns Object with stubs generated and patterns skipped
 */
export declare function appendFixTemplateStubs(projectRoot: string, patterns: RecurrenceResult[], dryRun?: boolean): {
    generated: string[];
    skipped: string[];
};
/**
 * CLI entry point.
 */
export declare function main(args: string[]): void;
