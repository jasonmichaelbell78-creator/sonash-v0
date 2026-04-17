const fs = require("fs");
const { sanitizeError } = require("../../scripts/lib/security-helpers.js");

const ledgerPath = ".research/analysis/synthesis/opportunities-ledger.jsonl";
let synthesis;
try {
  synthesis = JSON.parse(fs.readFileSync(".research/analysis/synthesis/synthesis.json", "utf8"));
} catch (err) {
  console.error("Cannot read synthesis.json:", sanitizeError(err));
  process.exit(1);
}

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);

let existing;
try {
  existing = fs
    .readFileSync(ledgerPath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
} catch (err) {
  if (err?.code === "ENOENT") {
    existing = [];
  } else {
    console.error("Cannot read ledger:", sanitizeError(err));
    process.exit(1);
  }
}

const existingByKey = new Map(existing.map((e) => [e.title_key, e]));
const runDate = new Date().toISOString().slice(0, 10);

const newKeys = [];
const bumpedKeys = [];

for (const opp of synthesis.opportunity_matrix) {
  const key = norm(opp.title);
  const existingEntry = existingByKey.get(key);
  if (existingEntry) {
    existingEntry.last_seen_in_run = runDate;
    existingEntry.runs_seen = (existingEntry.runs_seen || 1) + 1;
    bumpedKeys.push(key);
  } else {
    existingByKey.set(key, {
      title_key: key,
      rank: opp.rank,
      title: opp.title,
      first_seen_in_run: runDate,
      last_seen_in_run: runDate,
      runs_seen: 1,
      status: "pending",
      effort: opp.effort,
      impact: opp.impact,
      suggested_route: opp.route,
      evidence_sources: opp.evidence_sources,
      adopted_at: null,
      adopted_to: null,
      commit_sha: null,
      notes: opp.session_goal_boost ? `session_goal_boost: ${opp.session_goal_boost}` : null,
    });
    newKeys.push(key);
  }
}

// Write atomically via tmp file then rename
const all = Array.from(existingByKey.values());
const tmp = ledgerPath + ".tmp";
fs.writeFileSync(tmp, all.map((e) => JSON.stringify(e)).join("\n") + "\n");
fs.renameSync(tmp, ledgerPath);

console.log(
  `Ledger updated: ${newKeys.length} new, ${bumpedKeys.length} bumped, ${all.length} total.`
);
console.log("New:", newKeys.slice(0, 5).join(", ") + (newKeys.length > 5 ? ", ..." : ""));

// Also write delta back into synthesis.json
synthesis.opportunities_ledger_delta = { new_keys: newKeys, bumped_keys: bumpedKeys };
fs.writeFileSync(
  ".research/analysis/synthesis/synthesis.json",
  JSON.stringify(synthesis, null, 2) + "\n"
);
console.log("synthesis.json delta updated");
