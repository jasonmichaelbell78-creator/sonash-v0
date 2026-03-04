#!/usr/bin/env node
/**
 * validate-jsonl-md-sync.js
 *
 * Checks that generated MD views match their JSONL sources.
 * Regenerates to temp files and compares to existing committed files.
 * Exits non-zero if any MD is stale.
 *
 * Per D84/D85: Enforced at pre-commit when planning JSONL files are staged.
 *
 * Usage:
 *   node scripts/planning/validate-jsonl-md-sync.js
 */

import { execSync } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..", "..");

const GENERATORS = [
  {
    script: "scripts/planning/generate-discovery-record.js",
    output: ".planning/system-wide-standardization/DISCOVERY_RECORD.md",
    name: "DISCOVERY_RECORD.md",
  },
  {
    script: "scripts/planning/generate-decisions.js",
    output: ".planning/system-wide-standardization/DECISIONS.md",
    name: "DECISIONS.md",
  },
];

let failures = 0;
const tmpDir = mkdtempSync(join(tmpdir(), "jsonl-md-sync-"));

try {
  for (const gen of GENERATORS) {
    const outputPath = join(ROOT, gen.output);

    // Read current MD
    let currentMd;
    try {
      currentMd = readFileSync(outputPath, "utf-8");
    } catch {
      console.error(`  ❌ ${gen.name} does not exist — run: node ${gen.script}`);
      failures++;
      continue;
    }

    // Regenerate to actual file, then read it back, then restore original
    // We use the generator in normal mode but redirect output to temp location
    // by temporarily swapping the output path. Simpler: use dry-run and strip trailer.
    let freshMd;
    try {
      const raw = execSync(`node ${join(ROOT, gen.script)} --dry-run`, {
        encoding: "utf-8",
        cwd: ROOT,
      });
      // Strip dry-run trailer lines (varies by generator)
      freshMd = raw.replace(/\n+--- DRY RUN[^\n]*---\s*$/, "");
    } catch (err) {
      console.error(`  ❌ ${gen.name} generator failed: ${err.message}`);
      failures++;
      continue;
    }

    // Compare (normalize trailing whitespace)
    const normalize = (s) => s.replace(/\s+$/gm, "").trimEnd();
    if (normalize(currentMd) !== normalize(freshMd)) {
      console.error(`  ❌ ${gen.name} is stale — regenerate with: node ${gen.script}`);
      failures++;
    } else {
      console.log(`  ✅ ${gen.name} is in sync`);
    }
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n  ${failures} MD file(s) out of sync with JSONL sources.`);
  console.error("  Run the generator scripts above, stage the updated MD, then commit.");
  process.exit(1);
} else {
  console.log("  ✅ All MD views match JSONL sources");
}
