/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Patch suggestion engine for PR Ecosystem Audit.
 *
 * Generates specific, actionable code diffs for skill files,
 * hook configs, and pattern rules based on findings.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

/**
 * Patch types with their targets and actions.
 */
const PATCH_TYPES = {
  debt_entry: {
    description: "Add DEBT entry to MASTER_DEBT.jsonl",
    action: "append",
  },
  pattern_rule: {
    description: "Add pattern to check-pattern-compliance.js",
    action: "insert",
  },
  fix_template: {
    description: "Add template to FIX_TEMPLATES.md",
    action: "append",
  },
  qodo_config: {
    description: "Update .qodo/pr-agent.toml suppression config",
    action: "edit",
  },
  skill_update: {
    description: "Update skill SKILL.md",
    action: "edit",
  },
  pre_check: {
    description: "Add pre-check to pr-review Step 0.5",
    action: "insert",
  },
  config_update: {
    description: "Update configuration file",
    action: "edit",
  },
  archive_command: {
    description: "Run archive command",
    action: "command",
  },
  sync_command: {
    description: "Run sync command",
    action: "command",
  },
};

/**
 * Create a patch generator instance.
 * @param {string} rootDir - Project root directory
 * @returns {object} Patch generator API
 */
function createPatchGenerator(rootDir) {
  /**
   * Generate a patch suggestion for a finding.
   * @param {object} finding - The finding to generate a patch for
   * @returns {object|null} Patch suggestion or null if not patchable
   */
  function generate(finding) {
    if (!finding.patchType) return null;

    const patchConfig = PATCH_TYPES[finding.patchType];
    if (!patchConfig) return null;

    switch (finding.patchType) {
      case "debt_entry":
        return generateDebtPatch(finding);
      case "pattern_rule":
        return generatePatternRulePatch(finding);
      case "qodo_config":
        return generateQodoConfigPatch(finding);
      case "skill_update":
        return generateSkillUpdatePatch(finding);
      case "archive_command":
        return generateCommandPatch(finding, "npm run reviews:archive -- --apply");
      case "sync_command":
        return generateCommandPatch(finding, "npm run reviews:sync -- --apply");
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

  /**
   * Generate a DEBT entry patch.
   */
  function generateDebtPatch(finding) {
    const debtPath = path.join("docs", "technical-debt", "MASTER_DEBT.jsonl");
    const nextId = getNextDebtId();

    const entry = {
      id: nextId,
      severity: finding.severity === "error" ? "S1" : "S2",
      title: finding.message,
      category: "engineering-productivity",
      source_id: `review:pr-ecosystem-audit-${new Date().toISOString().slice(0, 10)}`,
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

  /**
   * Generate a pattern rule patch.
   */
  function generatePatternRulePatch(finding) {
    return {
      type: "pattern_rule",
      description: `Add pattern rule for "${finding.patternName || finding.message}"`,
      target: "scripts/check-pattern-compliance.js",
      content: finding.patchContent || `// Pattern: ${finding.message}`,
      impact: finding.patchImpact || "Automate detection of this pattern",
    };
  }

  /**
   * Generate a Qodo config patch.
   */
  function generateQodoConfigPatch(finding) {
    return {
      type: "qodo_config",
      description: `Update Qodo suppression: ${finding.message}`,
      target: ".qodo/pr-agent.toml",
      content: finding.patchContent || "# Suppression rule needed",
      impact: finding.patchImpact || "Reduce false positive noise",
    };
  }

  /**
   * Generate a skill update patch.
   */
  function generateSkillUpdatePatch(finding) {
    return {
      type: "skill_update",
      description: `Update skill: ${finding.patchTarget || "SKILL.md"}`,
      target: finding.patchTarget || "SKILL.md",
      content: finding.patchContent || "# Update needed",
      impact: finding.patchImpact || "Improve skill compliance",
    };
  }

  /**
   * Generate a command execution patch.
   */
  function generateCommandPatch(finding, command) {
    return {
      type: "command",
      description: `Run: ${command}`,
      target: "terminal",
      content: command,
      impact: finding.patchImpact || "Fix data state issue",
    };
  }

  /**
   * Get next DEBT ID by scanning MASTER_DEBT.jsonl.
   */
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
