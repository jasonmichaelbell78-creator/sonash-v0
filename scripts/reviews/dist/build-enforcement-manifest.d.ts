/**
 * Build Enforcement Manifest
 *
 * CLI that scans CODE_PATTERNS.md, regex rules, ESLint rules, and Semgrep rules
 * to build a per-pattern enforcement manifest (JSONL).
 *
 * Usage: npx ts-node scripts/reviews/build-enforcement-manifest.ts [--dry-run]
 */
import { Mechanisms } from "./lib/enforcement-manifest";
interface PatternEntry {
    id: string;
    name: string;
    priority: "critical" | "important" | "edge";
    category: string;
}
/**
 * Slugify a pattern name for ID matching.
 */
declare function slugify(name: string): string;
/**
 * Parse CODE_PATTERNS.md to extract all patterns with their categories and priorities.
 */
declare function parseCodePatterns(filePath: string): PatternEntry[];
interface RuleSource {
    regexRules: Set<string>;
    eslintRules: Set<string>;
    semgrepRules: Map<string, string>;
    claudeMdPatterns: Set<string>;
}
/**
 * Extract regex rule IDs from check-pattern-compliance.js.
 */
declare function scanRegexRules(projectRoot: string): Set<string>;
/**
 * Extract ESLint rule names from eslint-plugin-sonash/index.js.
 */
declare function scanEslintRules(projectRoot: string): Set<string>;
/**
 * Scan Semgrep YAML rules for IDs and code-pattern-ref metadata.
 */
declare function scanSemgrepRules(projectRoot: string): Map<string, string>;
/**
 * Build mechanisms for a given pattern by checking all rule sources.
 */
declare function buildMechanisms(pattern: PatternEntry, sources: RuleSource): Mechanisms;
export { parseCodePatterns, scanRegexRules, scanEslintRules, scanSemgrepRules, buildMechanisms, slugify, };
