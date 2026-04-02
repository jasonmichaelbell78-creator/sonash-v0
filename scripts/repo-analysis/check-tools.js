#!/usr/bin/env node
/* global __dirname */
/**
 * check-tools.js - Check availability of repo-analysis tools
 *
 * Returns a JSON manifest of available/missing tools for the
 * /repo-analysis skill's graceful degradation (D6).
 *
 * Tier 1 (core analysis): scc, semgrep, lizard, jscpd, gitleaks,
 *   git-quick-stats, repomix
 * Tier 2 (language-conditional): knip, vulture, dependency-cruiser,
 *   madge, cloc, tokei
 *
 * Usage:
 *   node scripts/repo-analysis/check-tools.js          # JSON to stdout
 *   node scripts/repo-analysis/check-tools.js --pretty  # human-readable
 *
 * Created: Session #257 (repo-analysis Step 2)
 */

const { execFileSync } = require("node:child_process");
const path = require("node:path");

// Import sanitizeError for safe error handling (CODE_PATTERNS.md compliance)
const { sanitizeError } = require(path.join(__dirname, "..", "lib", "sanitize-error.cjs"));

// ── Tool definitions ───────────────────────────────────────────────
// Each entry: { command, args, tier, description }
// `command` is the binary name; `args` are passed to verify it runs.

const TOOL_DEFINITIONS = {
  // Tier 1 — Core analysis tools
  scc: {
    command: "scc",
    args: ["--version"],
    tier: 1,
    description: "Succinct Code Counter (LOC, complexity, cost estimation)",
  },
  semgrep: {
    command: "semgrep",
    args: ["--version"],
    tier: 1,
    description: "Static analysis / SAST scanning",
  },
  lizard: {
    command: "lizard",
    args: ["--version"],
    tier: 1,
    description: "Cyclomatic complexity analyzer",
  },
  jscpd: {
    command: "jscpd",
    args: ["--version"],
    tier: 1,
    description: "Copy/paste (duplication) detector",
  },
  gitleaks: {
    command: "gitleaks",
    args: ["version"],
    tier: 1,
    description: "Secret detection in git repos",
  },
  "git-quick-stats": {
    command: "git-quick-stats",
    args: ["--version"],
    tier: 1,
    description: "Git repository statistics",
  },
  repomix: {
    command: "repomix",
    args: ["--version"],
    tier: 1,
    description: "Repository context compression for LLMs",
  },

  // Tier 2 — Language-conditional tools
  knip: {
    command: "knip",
    args: ["--version"],
    tier: 2,
    description: "Dead code / unused exports detector (JS/TS)",
  },
  vulture: {
    command: "vulture",
    args: ["--version"],
    tier: 2,
    description: "Dead code detector (Python)",
  },
  "dependency-cruiser": {
    command: "depcruise",
    args: ["--version"],
    tier: 2,
    description: "Dependency graph analyzer (JS/TS)",
  },
  madge: {
    command: "madge",
    args: ["--version"],
    tier: 2,
    description: "Circular dependency detector (JS/TS)",
  },
  cloc: {
    command: "cloc",
    args: ["--version"],
    tier: 2,
    description: "Count Lines of Code (alternative to scc)",
  },
  tokei: {
    command: "tokei",
    args: ["--version"],
    tier: 2,
    description: "Code statistics (Rust-based, alternative to scc)",
  },
};

// ── Tool checking ──────────────────────────────────────────────────

/**
 * Check if a single tool is available by running its version command.
 *
 * @param {string} name - Tool name (key in TOOL_DEFINITIONS)
 * @param {object} def - Tool definition
 * @returns {{ available: boolean, version: string|null, error: string|null }}
 */
function checkTool(name, def) {
  try {
    const output = execFileSync(def.command, def.args, {
      encoding: "utf-8",
      timeout: 10000, // 10s timeout per tool
      stdio: ["ignore", "pipe", "pipe"],
    });
    const version = (output || "").trim().split("\n")[0] || "unknown";
    return { available: true, version, error: null };
  } catch (err) {
    // Use sanitizeError — never expose raw error.message
    return { available: false, version: null, error: sanitizeError(err) };
  }
}

/**
 * Check all tools and return the manifest.
 *
 * @returns {{ tools: object, summary: object, timestamp: string }}
 */
function checkAllTools() {
  const tools = {};
  let tier1Available = 0;
  let tier1Total = 0;
  let tier2Available = 0;
  let tier2Total = 0;

  for (const [name, def] of Object.entries(TOOL_DEFINITIONS)) {
    const result = checkTool(name, def);
    tools[name] = {
      available: result.available,
      version: result.version,
      tier: def.tier,
      description: def.description,
    };

    // Only include error in output if tool is missing (keeps manifest clean)
    if (!result.available && result.error) {
      tools[name].error = result.error;
    }

    if (def.tier === 1) {
      tier1Total++;
      if (result.available) tier1Available++;
    } else if (def.tier === 2) {
      tier2Total++;
      if (result.available) tier2Available++;
    }
  }

  return {
    tools,
    summary: {
      tier1: { available: tier1Available, total: tier1Total },
      tier2: { available: tier2Available, total: tier2Total },
      totalAvailable: tier1Available + tier2Available,
      totalChecked: tier1Total + tier2Total,
    },
    timestamp: new Date().toISOString(),
  };
}

// ── CLI entry point ────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const pretty = args.includes("--pretty");

  try {
    const manifest = checkAllTools();

    if (pretty) {
      // Human-readable output
      console.log("=== Repo Analysis Tool Manifest ===\n");

      console.log("Tier 1 (Core Analysis):");
      for (const [name, info] of Object.entries(manifest.tools)) {
        if (info.tier !== 1) continue;
        const status = info.available ? "OK" : "MISSING";
        const version = info.available ? info.version : "";
        console.log(`  ${name.padEnd(20)} ${status.padEnd(10)} ${version}`);
      }

      console.log("\nTier 2 (Language-Conditional):");
      for (const [name, info] of Object.entries(manifest.tools)) {
        if (info.tier !== 2) continue;
        const status = info.available ? "OK" : "MISSING";
        const version = info.available ? info.version : "";
        console.log(`  ${name.padEnd(20)} ${status.padEnd(10)} ${version}`);
      }

      const s = manifest.summary;
      console.log(
        `\nSummary: Tier 1: ${s.tier1.available}/${s.tier1.total} | Tier 2: ${s.tier2.available}/${s.tier2.total} | Total: ${s.totalAvailable}/${s.totalChecked}`
      );

      if (s.tier1.available < s.tier1.total) {
        console.log("\nNOTE: Missing Tier 1 tools will cause graceful degradation.");
        console.log("      Run: bash scripts/repo-analysis/install-tools.sh");
      }
    } else {
      // JSON output for programmatic consumption
      console.log(JSON.stringify(manifest, null, 2));
    }
  } catch (err) {
    // Sanitize error before output (CODE_PATTERNS.md compliance)
    console.error("check-tools failed:", sanitizeError(err));
    process.exit(1);
  }
}

main();
