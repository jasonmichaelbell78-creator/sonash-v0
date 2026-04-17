const fs = require("fs");
const now = new Date().toISOString();
const sources = JSON.parse(fs.readFileSync(".claude/state/synthesize.sources.json", "utf8"));
let updated = 0,
  errors = 0;
for (const s of sources) {
  const p = `.research/analysis/${s.slug}/analysis.json`;
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    j.last_synthesized_at = now;
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
    updated++;
  } catch (e) {
    errors++;
    console.error("Failed:", s.slug, e.message);
  }
}
console.log(
  `Updated last_synthesized_at on ${updated}/${sources.length} sources (${errors} errors)`
);
