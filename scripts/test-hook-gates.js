#!/usr/bin/env node
/* global __dirname */

/**
 * test-hook-gates.js - Gate Test Harness (Per D14)
 *
 * Simulates PreToolUse/PostToolUse/PostToolUseFailure stdin payloads and invokes
 * hook scripts directly. Enables testing gate hooks without Claude Code session
 * restarts.
 *
 * Usage:
 *   node scripts/test-hook-gates.js \
 *     --hook=.claude/hooks/block-push-to-main.js \
 *     --event=PreToolUse \
 *     --tool=Bash \
 *     --input='{"command":"git push origin main"}'
 *
 * Options:
 *   --hook    Path to the hook script (required)
 *   --event   Hook event type: PreToolUse|PostToolUse|PostToolUseFailure (required)
 *   --tool    Tool name: Write|Edit|Bash|Read|etc. (required)
 *   --input   JSON string merged into tool_input (default: {})
 *   --env     Extra env vars as KEY=VALUE (repeatable)
 *
 * Exit codes from hooks:
 *   0 = PASS (allow)
 *   2 = BLOCK (deny with message)
 *   other = ERROR
 *
 * Run with: npm run test:gates -- --hook=... --event=... --tool=...
 */

const { spawn } = require("node:child_process");
const path = require("node:path");
const { sanitizeError } = require("./lib/sanitize-error.cjs");

// --- Constants ---

const VALID_EVENTS = ["PreToolUse", "PostToolUse", "PostToolUseFailure"];

const EXIT_LABELS = {
  0: "PASS",
  2: "BLOCK",
};

// ANSI colors for structured output
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

// --- Argument Parsing ---

/**
 * Parse --key=value style CLI arguments.
 * Supports repeatable flags (collected into arrays).
 *
 * @param {string[]} argv - Raw process.argv.slice(2)
 * @returns {{ hook: string, event: string, tool: string, input: string, env: string[] }}
 */
function parseArgs(argv) {
  /** @type {Record<string, string | string[]>} */
  const result = { hook: "", event: "", tool: "", input: "{}", env: [] };

  for (const arg of argv) {
    const eqIdx = arg.indexOf("=");
    if (!arg.startsWith("--") || eqIdx === -1) continue;

    const key = arg.slice(2, eqIdx);
    const value = arg.slice(eqIdx + 1);

    if (key === "env") {
      // --env is repeatable
      if (!Array.isArray(result.env)) {
        result.env = [];
      }
      result.env.push(value);
    } else if (key in result) {
      result[key] = value;
    }
  }

  return /** @type {{ hook: string, event: string, tool: string, input: string, env: string[] }} */ (
    result
  );
}

/**
 * Validate parsed arguments.
 *
 * @param {{ hook: string, event: string, tool: string, input: string, env: string[] }} args
 * @returns {string[]} Array of error messages (empty if valid)
 */
function validateArgs(args) {
  const errors = [];

  if (!args.hook) {
    errors.push("--hook is required (path to hook script)");
  }
  if (!args.event) {
    errors.push("--event is required (PreToolUse|PostToolUse|PostToolUseFailure)");
  } else if (!VALID_EVENTS.includes(args.event)) {
    errors.push(`--event must be one of: ${VALID_EVENTS.join(", ")}`);
  }
  if (!args.tool) {
    errors.push("--tool is required (Write|Edit|Bash|Read|etc.)");
  }

  // Validate --input is parseable JSON
  if (args.input) {
    try {
      JSON.parse(args.input);
    } catch {
      errors.push("--input must be valid JSON");
    }
  }

  // Validate --env entries are KEY=VALUE
  for (const entry of args.env) {
    if (!entry.includes("=")) {
      errors.push(`--env value must be KEY=VALUE, got: ${entry}`);
    }
  }

  return errors;
}

// --- Payload Construction ---

/**
 * Build the stdin JSON payload that Claude Code would send to a hook.
 *
 * @param {string} event - Hook event type
 * @param {string} toolName - Tool name
 * @param {Record<string, unknown>} inputObj - Parsed --input JSON
 * @returns {string} JSON string to pipe to stdin
 */
function buildPayload(event, toolName, inputObj) {
  /** @type {Record<string, unknown>} */
  const payload = {
    tool_name: toolName,
    tool_input: inputObj,
  };

  if (event === "PostToolUse") {
    // PostToolUse payloads include tool_output
    if (!("tool_output" in payload)) {
      payload.tool_output = inputObj.tool_output || "";
    }
  }

  if (event === "PostToolUseFailure") {
    // PostToolUseFailure payloads include an error field
    if (!("error" in payload)) {
      payload.error = inputObj.error || "simulated error";
    }
  }

  return JSON.stringify(payload);
}

// --- Hook Execution ---

/**
 * Invoke a hook script, piping the payload to stdin.
 *
 * @param {string} hookPath - Absolute path to hook script
 * @param {string} stdinPayload - JSON to write to stdin
 * @param {Record<string, string>} extraEnv - Additional environment variables
 * @returns {Promise<{ exitCode: number, stdout: string, stderr: string }>}
 */
function runHook(hookPath, stdinPayload, extraEnv) {
  return new Promise((resolve) => {
    const projectDir = path.resolve(__dirname, "..");

    const child = spawn(process.execPath, [hookPath], {
      env: {
        ...process.env,
        CLAUDE_PROJECT_DIR: projectDir,
        ...extraEnv,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    const timeoutMs = 15000;
    const timer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        /* ignore */
      }
      stderr += "\n[harness] Hook timed out after 15000ms";
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      stderr += sanitizeError(err);
      resolve({ exitCode: 1, stdout, stderr });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code === null ? 1 : code,
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
      });
    });

    // Write payload to stdin and close
    child.stdin.write(stdinPayload);
    child.stdin.end();
  });
}

// --- Output Formatting ---

/**
 * Print a structured result report.
 *
 * @param {{ hook: string, event: string, tool: string, exitCode: number, stdout: string, stderr: string }} result
 */
function printResult(result) {
  const exitLabel = EXIT_LABELS[result.exitCode] || "ERROR";
  let exitColor;
  if (result.exitCode === 0) exitColor = C.green;
  else if (result.exitCode === 2) exitColor = C.yellow;
  else exitColor = C.red;

  console.log("");
  console.log(`${C.bold}${C.cyan}Hook:${C.reset}      ${result.hook}`);
  console.log(`${C.bold}${C.cyan}Event:${C.reset}     ${result.event}`);
  console.log(`${C.bold}${C.cyan}Tool:${C.reset}      ${result.tool}`);
  console.log(
    `${C.bold}${C.cyan}Exit code:${C.reset} ${exitColor}${result.exitCode} (${exitLabel})${C.reset}`
  );
  console.log(
    `${C.bold}${C.cyan}Stdout:${C.reset}    ${result.stdout || C.dim + "(empty)" + C.reset}`
  );
  console.log(
    `${C.bold}${C.cyan}Stderr:${C.reset}    ${result.stderr || C.dim + "(empty)" + C.reset}`
  );
  console.log("");
}

/**
 * Print usage help.
 */
function printUsage() {
  console.log(`
${C.bold}Gate Test Harness${C.reset} - Simulate Claude Code hook events

${C.bold}Usage:${C.reset}
  node scripts/test-hook-gates.js --hook=<path> --event=<event> --tool=<tool> [options]

${C.bold}Required:${C.reset}
  --hook=<path>     Path to hook script (relative to project root)
  --event=<event>   PreToolUse | PostToolUse | PostToolUseFailure
  --tool=<tool>     Tool name (Write, Edit, Bash, Read, etc.)

${C.bold}Optional:${C.reset}
  --input=<json>    JSON merged into tool_input (default: {})
  --env=KEY=VALUE   Extra env var (repeatable)

${C.bold}Examples:${C.reset}
  ${C.dim}# Test block-push-to-main gate${C.reset}
  node scripts/test-hook-gates.js \\
    --hook=.claude/hooks/block-push-to-main.js \\
    --event=PreToolUse --tool=Bash \\
    --input='{"command":"git push origin main"}'

  ${C.dim}# Test with SKIP_GATES env var${C.reset}
  node scripts/test-hook-gates.js \\
    --hook=.claude/hooks/settings-guardian.js \\
    --event=PreToolUse --tool=Write \\
    --input='{"file_path":".claude/settings.json","content":"{}"}' \\
    --env=SKIP_GATES=1

  ${C.dim}# Test PostToolUseFailure event${C.reset}
  node scripts/test-hook-gates.js \\
    --hook=.claude/hooks/loop-detector.js \\
    --event=PostToolUseFailure --tool=Bash \\
    --input='{"command":"npm run build","error":"Module not found"}'

${C.bold}Exit code meanings:${C.reset}
  0 = PASS (hook allows the operation)
  2 = BLOCK (hook denies the operation)
  * = ERROR (unexpected failure)
`);
}

// --- Main ---

async function main() {
  const argv = process.argv.slice(2);

  // Show help
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  // Parse and validate arguments
  const args = parseArgs(argv);
  const errors = validateArgs(args);

  if (errors.length > 0) {
    console.error(`${C.red}Argument errors:${C.reset}`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(`\nRun with --help for usage information.`);
    process.exit(1);
  }

  // Resolve hook path relative to project root
  const projectDir = path.resolve(__dirname, "..");
  const hookPath = path.resolve(projectDir, args.hook);

  // Security: verify hook is within project directory
  const relPath = path.relative(projectDir, hookPath);
  if (/^\.\.(?:[\\/]|$)/.test(relPath) || path.isAbsolute(relPath)) {
    console.error(`${C.red}Error: Hook path must be within the project directory.${C.reset}`);
    process.exit(1);
  }

  // Verify hook file exists (wrap in try/catch per CODE_PATTERNS.md)
  try {
    require("node:fs").accessSync(hookPath, require("node:fs").constants.R_OK);
  } catch {
    console.error(`${C.red}Error: Hook not found or not readable: ${args.hook}${C.reset}`);
    process.exit(1);
  }

  // Parse input JSON
  /** @type {Record<string, unknown>} */
  let inputObj;
  try {
    inputObj = JSON.parse(args.input);
  } catch {
    console.error(`${C.red}Error: --input is not valid JSON${C.reset}`);
    process.exit(1);
  }

  // Parse extra env vars
  /** @type {Record<string, string>} */
  const extraEnv = {};
  for (const entry of args.env) {
    const eqIdx = entry.indexOf("=");
    if (eqIdx > 0) {
      extraEnv[entry.slice(0, eqIdx)] = entry.slice(eqIdx + 1);
    }
  }

  // Build payload
  const payload = buildPayload(args.event, args.tool, inputObj);

  // Show what we're sending
  console.log(`${C.dim}Payload: ${payload}${C.reset}`);

  // Execute hook
  const result = await runHook(hookPath, payload, extraEnv);

  // Print structured result
  printResult({
    hook: args.hook,
    event: args.event,
    tool: args.tool,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  });

  // Exit with the hook's exit code (clamped to 0/1/2 per CODE_PATTERNS.md)
  let exitCode;
  if (result.exitCode === 0) exitCode = 0;
  else if (result.exitCode === 2) exitCode = 2;
  else exitCode = 1;
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(`${C.red}Unexpected error: ${sanitizeError(err)}${C.reset}`);
  process.exit(1);
});
