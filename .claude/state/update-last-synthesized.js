const fs = require("fs");
const path = require("path");
const { sanitizeError, validatePathInDir } = require("../../scripts/lib/security-helpers.js");

const ANALYSIS_DIR = path.resolve(".research/analysis");
const now = new Date().toISOString();

let sources;
try {
  sources = JSON.parse(fs.readFileSync(".claude/state/synthesize.sources.json", "utf8"));
} catch (err) {
  console.error("Cannot read synthesize.sources.json:", err.code || "unknown");
  process.exit(1);
}
let updated = 0,
  errors = 0;
for (const s of sources) {
  try {
    validatePathInDir(ANALYSIS_DIR, s.slug);
    const p = path.join(ANALYSIS_DIR, s.slug, "analysis.json");
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    j.last_synthesized_at = now;
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
    updated++;
  } catch (e) {
    errors++;
    console.error("Failed:", s.slug, sanitizeError(e));
  }
}
console.log(
  `Updated last_synthesized_at on ${updated}/${sources.length} sources (${errors} errors)`
);
