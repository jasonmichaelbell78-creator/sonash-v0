/* eslint-disable no-undef */

/**
 * Patch suggestion engine for Hook Ecosystem Audit.
 *
 * Generates specific, actionable fix suggestions for hook configuration,
 * pre-commit pipeline, and code quality issues.
 */

'use strict';

const PATCH_TYPES = {
  config_fix: {
    description: 'Fix hook configuration in settings.json',
    action: 'edit',
  },
  add_try_catch: {
    description: 'Add error handling to hook file',
    action: 'edit',
  },
  add_sanitize_import: {
    description: 'Add sanitize-error.js import to hook',
    action: 'insert',
  },
  fix_regex: {
    description: 'Fix regex safety issue in hook',
    action: 'edit',
  },
  fix_pipeline_stage: {
    description: 'Fix pre-commit pipeline stage',
    action: 'edit',
  },
  add_test: {
    description: 'Add test case for untested hook',
    action: 'append',
  },
  fix_output_protocol: {
    description: 'Fix hook output protocol compliance',
    action: 'edit',
  },
  fix_state_file: {
    description: 'Fix state file issue',
    action: 'command',
  },
  command: {
    description: 'Run fix command',
    action: 'command',
  },
};

function createPatchGenerator(rootDir) {
  // rootDir available for future use in generating project-relative paths
  void rootDir;

  function generate(finding) {
    if (!finding.patchType) return null;

    const patchConfig = PATCH_TYPES[finding.patchType];
    if (!patchConfig) return null;

    if (finding.patchType === 'command') {
      return generateCommandPatch(finding, finding.patchContent || "echo 'Manual fix required'");
    }

    return {
      type: finding.patchType,
      description: patchConfig.description,
      target: finding.patchTarget || 'unknown',
      content: finding.patchContent || 'Manual action required',
      impact: finding.patchImpact || 'Addresses finding',
    };
  }

  function generateCommandPatch(finding, command) {
    return {
      type: 'command',
      description: `Run: ${command}`,
      target: 'terminal',
      content: command,
      impact: finding.patchImpact || 'Fix hook ecosystem issue',
    };
  }

  return { generate, PATCH_TYPES };
}

module.exports = { createPatchGenerator };
