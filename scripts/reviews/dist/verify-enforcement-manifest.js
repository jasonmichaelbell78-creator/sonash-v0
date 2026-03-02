"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.readManifest = readManifest;
exports.getActualRegexRules = getActualRegexRules;
exports.getActualEslintRules = getActualEslintRules;
exports.getActualSemgrepRules = getActualSemgrepRules;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const enforcement_manifest_1 = require("./lib/enforcement-manifest");
// Walk up from __dirname until we find package.json
function findProjectRoot(startDir) {
    let dir = startDir;
    for (;;) {
        try {
            if (fs.existsSync(path.join(dir, "package.json")))
                return dir;
        }
        catch {
            // existsSync race condition -- continue walking
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            throw new Error("Could not find project root");
        dir = parent;
    }
}
const PROJECT_ROOT = findProjectRoot(__dirname);
/**
 * Read the manifest JSONL file and parse into records.
 */
function readManifest(filePath) {
    const records = [];
    let content;
    try {
        content = fs.readFileSync(filePath, "utf-8");
    }
    catch (err) {
        throw new Error(`Failed to read manifest: ${err instanceof Error ? err.message : String(err)}`);
    }
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    for (const line of lines) {
        try {
            const parsed = JSON.parse(line);
            const validated = enforcement_manifest_1.EnforcementRecordSchema.parse(parsed);
            records.push(validated);
        }
        catch {
            console.warn(`Warning: skipping invalid manifest line: ${line.slice(0, 80)}...`);
        }
    }
    return records;
}
/**
 * Get all regex rule IDs from check-pattern-compliance.js.
 */
function getActualRegexRules(projectRoot) {
    const filePath = path.join(projectRoot, "scripts/check-pattern-compliance.js");
    const rules = new Set();
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        const idRegex = /id:\s*"([^"]+)"/g;
        let match;
        while ((match = idRegex.exec(content)) !== null) {
            rules.add(match[1]);
        }
    }
    catch {
        // File may not exist
    }
    return rules;
}
/**
 * Get all ESLint rule names from eslint-plugin-sonash/index.js.
 */
function getActualEslintRules(projectRoot) {
    const filePath = path.join(projectRoot, "eslint-plugin-sonash/index.js");
    const rules = new Set();
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        // Match rule names in the rules: { ... } object
        const ruleRegex = /"([^"]+)":\s*\w+/g;
        let match;
        while ((match = ruleRegex.exec(content)) !== null) {
            rules.add(match[1]);
        }
    }
    catch {
        // File may not exist
    }
    return rules;
}
/**
 * Get all Semgrep rule IDs from .semgrep/rules/**\/*.yml.
 */
function getActualSemgrepRules(projectRoot) {
    const rulesDir = path.join(projectRoot, ".semgrep/rules");
    const rules = new Set();
    function scanDir(dir) {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                scanDir(fullPath);
            }
            else if (entry.name.endsWith(".yml") || entry.name.endsWith(".yaml")) {
                try {
                    const content = fs.readFileSync(fullPath, "utf-8");
                    const idMatch = content.match(/- id:\s*(.+)/);
                    if (idMatch) {
                        rules.add(idMatch[1].trim());
                    }
                }
                catch {
                    // Skip unreadable files
                }
            }
        }
    }
    scanDir(rulesDir);
    return rules;
}
/**
 * Extract the rule ID from an "active:rule-id" mechanism value.
 */
function extractActiveId(value) {
    if (value.startsWith("active:")) {
        return value.slice(7);
    }
    return null;
}
// --- Main ---
function main() {
    console.log("Verifying enforcement manifest...\n");
    const manifestPath = path.join(PROJECT_ROOT, "data/ecosystem-v2/enforcement-manifest.jsonl");
    const records = readManifest(manifestPath);
    console.log(`Loaded ${records.length} manifest records`);
    // Get actual rules from all sources
    const actualRegex = getActualRegexRules(PROJECT_ROOT);
    const actualEslint = getActualEslintRules(PROJECT_ROOT);
    const actualSemgrep = getActualSemgrepRules(PROJECT_ROOT);
    console.log(`Actual regex rules: ${actualRegex.size}`);
    console.log(`Actual ESLint rules: ${actualEslint.size}`);
    console.log(`Actual Semgrep rules: ${actualSemgrep.size}\n`);
    // Track referenced rules (to find untracked)
    const referencedRegex = new Set();
    const referencedEslint = new Set();
    const referencedSemgrep = new Set();
    let validRefs = 0;
    const missingRules = [];
    // Check each manifest record
    for (const record of records) {
        // Check regex
        const regexId = extractActiveId(record.mechanisms.regex);
        if (regexId) {
            // Regex IDs may have commas for multiple matches
            const ids = regexId.split(",");
            for (const id of ids) {
                referencedRegex.add(id);
                if (actualRegex.has(id)) {
                    validRefs++;
                }
                else {
                    missingRules.push(`[regex] ${record.pattern_id}: ${id} not found`);
                }
            }
        }
        // Check ESLint
        const eslintId = extractActiveId(record.mechanisms.eslint);
        if (eslintId) {
            referencedEslint.add(eslintId);
            if (actualEslint.has(eslintId)) {
                validRefs++;
            }
            else {
                missingRules.push(`[eslint] ${record.pattern_id}: ${eslintId} not found`);
            }
        }
        // Check Semgrep
        const semgrepId = extractActiveId(record.mechanisms.semgrep);
        if (semgrepId) {
            // Semgrep IDs may have commas for multiple rules
            const ids = semgrepId.split(",");
            for (const id of ids) {
                referencedSemgrep.add(id);
                if (actualSemgrep.has(id)) {
                    validRefs++;
                }
                else {
                    missingRules.push(`[semgrep] ${record.pattern_id}: ${id} not found`);
                }
            }
        }
    }
    // Find untracked rules (exist in source but not in manifest)
    const untrackedRules = [];
    for (const id of actualRegex) {
        if (!referencedRegex.has(id)) {
            untrackedRules.push(`[regex] ${id}`);
        }
    }
    for (const id of actualEslint) {
        if (!referencedEslint.has(id)) {
            untrackedRules.push(`[eslint] ${id}`);
        }
    }
    for (const id of actualSemgrep) {
        if (!referencedSemgrep.has(id)) {
            untrackedRules.push(`[semgrep] ${id}`);
        }
    }
    // Print report
    const totalChecked = records.length;
    const driftCount = missingRules.length;
    const untrackedCount = untrackedRules.length;
    const pass = driftCount === 0;
    console.log("Enforcement Manifest Verification:");
    console.log(`  - Records checked: ${totalChecked}`);
    console.log(`  - Valid references: ${validRefs}`);
    console.log(`  - Missing rules (drift): ${driftCount}`);
    console.log(`  - Untracked rules: ${untrackedCount}`);
    console.log(`  - ${pass ? "PASS" : "FAIL"}`);
    if (driftCount > 0) {
        console.log("\nMissing rules (manifest references non-existent rules):");
        for (const m of missingRules) {
            console.log(`  - ${m}`);
        }
    }
    if (untrackedCount > 0) {
        console.log("\nUntracked rules (exist but not in manifest):");
        for (const u of untrackedRules) {
            console.log(`  - ${u}`);
        }
    }
    process.exit(pass ? 0 : 1);
}
// CLI entry point
if (require.main === module) {
    main();
}
