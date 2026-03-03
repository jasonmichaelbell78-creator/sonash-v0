/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Patch suggestion engine for Skill Ecosystem Audit.
 *
 * Generates specific, actionable fix suggestions for skill structure,
 * cross-reference, coverage, staleness, and orchestration issues.
 */

'use strict';

let fs, path;
try {
  fs = require('node:fs');
  path = require('node:path');
} catch (err) {
  const code = err instanceof Error && err.code ? err.code : 'UNKNOWN';
  console.error(`Fatal: failed to load core Node.js modules (${code})`);
  process.exit(1);
}

void fs;
void path;

const PATCH_TYPES = {
  config_fix: {
    description: 'Fix skill configuration or metadata',
    action: 'edit',
  },
  add_try_catch: {
    description: 'Add error handling to skill script',
    action: 'edit',
  },
  add_section: {
    description: 'Add missing required section to skill',
    action: 'insert',
  },
  fix_reference: {
    description: 'Fix broken cross-reference in skill',
    action: 'edit',
  },
  fix_frontmatter: {
    description: 'Fix frontmatter schema in skill',
    action: 'edit',
  },
  update_index: {
    description: 'Update SKILL_INDEX.md entry',
    action: 'edit',
  },
  archive_content: {
    description: 'Archive resolved/stale content from skill',
    action: 'edit',
  },
  fix_output_protocol: {
    description: 'Fix agent output protocol compliance',
    action: 'edit',
  },
  command: {
    description: 'Run fix command',
    action: 'command',
  },
};

function createPatchGenerator(rootDir) {
  void rootDir;

  function generate(finding) {
    if (!finding.patchType) return null;

    const patchConfig = PATCH_TYPES[finding.patchType];
    if (!patchConfig) return null;

    switch (finding.patchType) {
      case 'command':
        return generateCommandPatch(finding, finding.patchContent || "echo 'Manual fix required'");
      default:
        return {
          type: finding.patchType,
          description: patchConfig.description,
          target: finding.patchTarget || 'unknown',
          content: finding.patchContent || 'Manual action required',
          impact: finding.patchImpact || 'Addresses finding',
        };
    }
  }

  function generateCommandPatch(finding, command) {
    return {
      type: 'command',
      description: `Run: ${command}`,
      target: 'terminal',
      content: command,
      impact: finding.patchImpact || 'Fix skill ecosystem issue',
    };
  }

  return { generate, PATCH_TYPES };
}

module.exports = { createPatchGenerator };
