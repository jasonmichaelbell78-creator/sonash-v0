/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Patch suggestion engine for TDMS Ecosystem Audit.
 *
 * Generates specific, actionable fix suggestions for TDMS pipeline,
 * data quality, file I/O safety, and metrics issues.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const PATCH_TYPES = {
  schema_fix: {
    description: "Fix schema compliance issue in MASTER_DEBT.jsonl",
    action: "edit",
  },
  pipeline_fix: {
    description: "Fix pipeline script issue",
    action: "edit",
  },
  sync_fix: {
    description: "Fix master-deduped sync issue",
    action: "command",
  },
  add_try_catch: {
    description: "Add error handling to debt script",
    action: "edit",
  },
  view_regenerate: {
    description: "Regenerate views from MASTER_DEBT.jsonl",
    action: "command",
  },
  metrics_regenerate: {
    description: "Regenerate metrics from MASTER_DEBT.jsonl",
    action: "command",
  },
  roadmap_fix: {
    description: "Fix roadmap cross-reference",
    action: "edit",
  },
  sprint_fix: {
    description: "Fix sprint file alignment",
    action: "edit",
  },
  debt_entry: {
    description: "Add DEBT entry to MASTER_DEBT.jsonl",
    action: "append",
  },
  command: {
    description: "Run fix command",
    action: "command",
  },
};

function createPatchGenerator(rootDir) {
  function generate(finding) {
    if (!finding.patchType) return null;

    const patchConfig = PATCH_TYPES[finding.patchType];
    if (!patchConfig) return null;

    switch (finding.patchType) {
      case "debt_entry":
        return generateDebtPatch(finding);
      case "command":
      case "sync_fix":
      case "view_regenerate":
      case "metrics_regenerate":
        return generateCommandPatch(finding, finding.patchContent || "echo 'Manual fix required'");
      default:
        return {
          type: finding.patchType,
          description: patchConfig.description,
          target: finding.patchTarget || "unknown",
          content: finding.patchContent || "Manual action required",
          impact: finding.patchImpact || "Addresses finding",
        };
    }
  }

  function generateDebtPatch(finding) {
    const debtPath = path.join("docs", "technical-debt", "MASTER_DEBT.jsonl");
    const nextId = getNextDebtId();

    const entry = {
      id: nextId,
      severity: finding.severity === "error" ? "S1" : "S2",
      title: finding.message,
      category: "engineering-productivity",
      source_id: `review:tdms-ecosystem-audit-${new Date().toISOString().slice(0, 10)}`,
      status: "open",
      created: new Date().toISOString().slice(0, 10),
      effort: finding.effort || "medium",
      description: finding.details || finding.message,
    };

    return {
      type: "debt_entry",
      description: `Create DEBT entry ${nextId}`,
      target: debtPath,
      content: JSON.stringify(entry),
      preview: `+ ${JSON.stringify(entry)}`,
      impact: finding.patchImpact || "Track finding for resolution",
    };
  }

  function generateCommandPatch(finding, command) {
    return {
      type: "command",
      description: `Run: ${command}`,
      target: "terminal",
      content: command,
      impact: finding.patchImpact || "Fix TDMS ecosystem issue",
    };
  }

  function getNextDebtId() {
    try {
      const debtPath = path.join(rootDir, "docs", "technical-debt", "MASTER_DEBT.jsonl");
      const stat = fs.statSync(debtPath);
      if (stat.size > 5 * 1024 * 1024) return `DEBT-${Date.now()}`;
      const content = fs.readFileSync(debtPath, "utf8");
      const lines = content.trim().split("\n").filter(Boolean);
      let maxId = 0;
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const match = (entry.id || "").match(/DEBT-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxId) maxId = num;
          }
        } catch {
          // skip malformed lines
        }
      }
      return `DEBT-${maxId + 1}`;
    } catch {
      return `DEBT-${Date.now()}`;
    }
  }

  return { generate, PATCH_TYPES };
}

module.exports = { createPatchGenerator };
