/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Patch suggestion engine for Session Ecosystem Audit.
 *
 * Generates specific, actionable fix suggestions for session lifecycle,
 * state persistence, compaction resilience, and configuration issues.
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
  hook_register: {
    description: "Register missing hook in settings.json",
    action: "edit",
  },
  state_fix: {
    description: "Fix state file issue",
    action: "edit",
  },
  context_update: {
    description: "Update SESSION_CONTEXT.md",
    action: "edit",
  },
  gap_fix: {
    description: "Run session gap fix script",
    action: "command",
  },
  cleanup: {
    description: "Clean up stale state files",
    action: "command",
  },
  counter_fix: {
    description: "Fix session counter",
    action: "edit",
  },
  config_fix: {
    description: "Fix configuration issue",
    action: "edit",
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
      case "gap_fix":
      case "cleanup":
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

  function generateCommandPatch(finding, command) {
    return {
      type: "command",
      description: `Run: ${command}`,
      target: "terminal",
      content: command,
      impact: finding.patchImpact || "Fix session ecosystem issue",
    };
  }

  return { generate, PATCH_TYPES };
}

module.exports = { createPatchGenerator };
