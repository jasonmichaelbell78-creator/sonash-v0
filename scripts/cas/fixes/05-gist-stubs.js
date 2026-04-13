#!/usr/bin/env node
/**
 * T29 Step 10.5 — Category F remediation (gist portion)
 *
 * Per F4 decision: document the deep-read skip for gist sources rather
 * than re-running analysis (short-form content; deep-read adds no value).
 *
 * For each of 3 gists:
 *  - Set analysis.json.deep_read_skipped = true
 *  - Replace placeholder deep-read.md with policy-explicit stub
 *  - Replace placeholder content-eval.jsonl / coverage-audit.jsonl with
 *    policy-explicit single entries
 *
 * docs-composio-dev is NOT handled here — user will invoke /analyze on it.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const ANALYSIS_DIR = path.join(ROOT, ".research", "analysis");

const GIST_SOURCES = [
  "farzaa-gist-c35ac0cf",
  "karpathy-gist-442a6bf",
  "kieranklaassen-gist-4f2aba89",
];

const DEEP_READ_STUB = (title) => `# Deep Read — ${title}

**Status:** Deep Read skipped per T29 Step 10.5 Cat F4 decision.

## Why skipped

This source is a single-file gist / short-form content. Deep Read is a
pass designed for repositories with multiple artifacts (READMEs, docs,
code, tests). For single-file sources, the creator-view summary and
candidate list already capture the full analysis surface.

Candidates, tags, and findings are complete and remain the canonical
output for this source. See:

 - \`analysis.json\` — unified summary + candidates + scoring
 - \`value-map.json\` — full candidate objects with descriptions
 - \`creator-view.md\` — 6-section conversational analysis
 - \`findings.jsonl\` — F# findings referenced by candidates
 - Extraction journal entries (\`.research/extraction-journal.jsonl\`)

## Machine-readable flag

\`analysis.json.deep_read_skipped: true\`

Downstream consumers (\`/synthesize\`, self-audit) should treat this as
PASS for Deep Read artifact checks.
`;

const CONTENT_EVAL_STUB = {
  category: "policy",
  name: "Deep Read skipped (short-form source)",
  url: "",
  relevance: "n/a",
  applicability:
    "Source is a single-file gist; Deep Read pass adds no value beyond creator-view + value-map. See analysis.json.deep_read_skipped=true.",
  home_connection: "",
};

const COVERAGE_AUDIT_STUB = {
  category: "policy",
  item: "Deep Read skipped (short-form source)",
  status: "skipped-by-policy",
  note: "T29 Step 10.5 Cat F4: single-file gists do not receive Deep Read pass. Candidates + tags + scoring are complete in analysis.json and value-map.json.",
};

function atomicWriteJson(filePath, obj) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, filePath);
}

function atomicWrite(filePath, content) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content, "utf8");
  fs.renameSync(tmp, filePath);
}

function main() {
  console.log("T29 Step 10.5 — Cat F4 (gist portion): document deep-read skip\n");
  for (const slug of GIST_SOURCES) {
    const dir = path.join(ANALYSIS_DIR, slug);
    const aPath = path.join(dir, "analysis.json");
    const a = JSON.parse(fs.readFileSync(aPath, "utf8"));
    const title = a.title || slug;

    a.deep_read_skipped = true;
    atomicWriteJson(aPath, a);

    atomicWrite(path.join(dir, "deep-read.md"), DEEP_READ_STUB(title));
    atomicWrite(path.join(dir, "content-eval.jsonl"), JSON.stringify(CONTENT_EVAL_STUB) + "\n");
    atomicWrite(path.join(dir, "coverage-audit.jsonl"), JSON.stringify(COVERAGE_AUDIT_STUB) + "\n");

    console.log(`  ${slug}: deep_read_skipped=true, stubs replaced`);
  }

  console.log(`
F4 note for docs-composio-dev (NOT handled by this script):
  User to invoke: /analyze https://docs.composio.dev/docs

  Or equivalent URL resolved from analysis.json.source.
`);
}

main();
