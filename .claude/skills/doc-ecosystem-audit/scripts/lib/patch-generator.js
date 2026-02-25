/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Patch suggestion engine for Doc Ecosystem Audit.
 *
 * Generates specific, actionable fix suggestions for documentation
 * index sync, link integrity, content quality, and pipeline issues.
 */

"use strict";

let fs, path;
try {
  fs = require("node:fs");
  path = require("node:path");
} catch (err) {
  const code = err instanceof Error && err.code ? err.code : "UNKNOWN";
  console.error(`Fatal: failed to load core Node.js modules (${code})`);
  process.exit(1);
}

const PATCH_TYPES = {
  add_to_index: {
    description: "Add missing document to DOCUMENTATION_INDEX.md",
    action: "edit",
  },
  remove_from_index: {
    description: "Remove stale entry from DOCUMENTATION_INDEX.md",
    action: "edit",
  },
  fix_link: {
    description: "Fix broken markdown link",
    action: "edit",
  },
  fix_anchor: {
    description: "Fix broken anchor reference",
    action: "edit",
  },
  fix_image_ref: {
    description: "Fix broken image reference",
    action: "edit",
  },
  add_header: {
    description: "Add required header/frontmatter to document",
    action: "insert",
  },
  fix_formatting: {
    description: "Fix document formatting issue",
    action: "edit",
  },
  update_content: {
    description: "Update stale document content",
    action: "edit",
  },
  fix_pipeline: {
    description: "Fix documentation pipeline configuration",
    action: "edit",
  },
  add_documentation: {
    description: "Add missing documentation for system",
    action: "append",
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
      source_id: `review:doc-ecosystem-audit-${new Date().toISOString().slice(0, 10)}`,
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
      impact: finding.patchImpact || "Fix documentation ecosystem issue",
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
