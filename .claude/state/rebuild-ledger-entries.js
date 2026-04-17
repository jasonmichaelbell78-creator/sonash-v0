"use strict";
const fs = require("fs");
const { sanitizeError } = require("../../scripts/lib/security-helpers.js");

const ledgerPath = ".research/analysis/synthesis/opportunities-ledger.jsonl";
let synth;
try {
  synth = JSON.parse(fs.readFileSync(".research/analysis/synthesis/synthesis.json", "utf8"));
} catch (err) {
  console.error("Cannot read synthesis.json:", sanitizeError(err));
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);

// Load existing ledger; drop any row whose title_key is from today (the bad ones).
let existing;
try {
  existing = fs
    .readFileSync(ledgerPath, "utf8")
    .trim()
    .split(/\r?\n/)
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
const historic = existing.filter((r) => r.first_seen_in_run !== today);
console.log(
  `Keeping ${historic.length} historic ledger rows; rebuilding ${existing.length - historic.length} today rows.`
);

// Rebuild today's rows from synthesis.opportunity_matrix (which already has conformant title_key).
const historicByKey = new Map(historic.map((r) => [r.title_key, r]));
const rebuilt = [];
let newCount = 0;
let bumpedCount = 0;
for (const opp of synth.opportunity_matrix) {
  const prior = historicByKey.get(opp.title_key);
  if (prior) {
    prior.last_seen_in_run = today;
    prior.runs_seen = (prior.runs_seen || 1) + 1;
    bumpedCount++;
  } else {
    rebuilt.push({
      title_key: opp.title_key,
      rank: opp.rank,
      title: opp.title,
      first_seen_in_run: today,
      last_seen_in_run: today,
      runs_seen: 1,
      status: "pending",
      effort: opp.effort,
      impact: opp.impact, // already lowercase from rewrite script
      suggested_route: opp.suggested_route,
      evidence_sources: opp.evidence,
      adopted_at: null,
      adopted_to: null,
      commit_sha: null,
      deferred_to: null,
      notes: null,
    });
    newCount++;
  }
}

const all = [...historic, ...rebuilt];
fs.writeFileSync(ledgerPath + ".tmp", all.map((r) => JSON.stringify(r)).join("\n") + "\n");
fs.renameSync(ledgerPath + ".tmp", ledgerPath);
console.log(`Ledger rewritten: ${newCount} new, ${bumpedCount} bumped, ${all.length} total.`);
