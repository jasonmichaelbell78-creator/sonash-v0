/**
 * Verify Enforcement Manifest
 *
 * Cross-references the enforcement manifest against actual rule files to detect drift.
 * Reports missing rules (manifest says active but rule not found) and
 * untracked rules (rule exists but not in manifest).
 *
 * Usage: npx ts-node scripts/reviews/verify-enforcement-manifest.ts
 * Exit code: 0 = PASS, 1 = drift detected
 */
import { EnforcementRecord } from "./lib/enforcement-manifest";
/**
 * Read the manifest JSONL file and parse into records.
 */
declare function readManifest(filePath: string): EnforcementRecord[];
/**
 * Get all regex rule IDs from check-pattern-compliance.js.
 */
declare function getActualRegexRules(projectRoot: string): Set<string>;
/**
 * Get all ESLint rule names from eslint-plugin-sonash/index.js.
 */
declare function getActualEslintRules(projectRoot: string): Set<string>;
/**
 * Get all Semgrep rule IDs from .semgrep/rules/**\/*.yml.
 */
declare function getActualSemgrepRules(projectRoot: string): Set<string>;
export { readManifest, getActualRegexRules, getActualEslintRules, getActualSemgrepRules };
