#!/usr/bin/env node
/* global require, process */
/**
 * block-push-to-main.js - PreToolUse hook (Bash)
 *
 * Blocks git push commands that target main or master branches.
 * Fires before the command executes, so the push never happens.
 *
 * Exit 0 = allow, exit 2 = block with message.
 *
 * Session #197: Prevent accidental direct pushes to main.
 */

const PROTECTED_BRANCHES = ["main", "master"];

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const command = (data.tool_input && data.tool_input.command) || "";

    // Fast bail: only inspect commands that look like git push
    if (!/\bgit\b/.test(command) || !/\bpush\b/.test(command)) {
      process.exit(0);
    }

    // Normalize: collapse whitespace, strip comments
    const normalized = command.replace(/#.*/g, "").replace(/\s+/g, " ").trim();

    // Match patterns like:
    //   git push origin main
    //   git push --force origin main
    //   git push -f origin master
    //   git push origin HEAD:main
    //   git push origin HEAD:refs/heads/main
    for (const branch of PROTECTED_BRANCHES) {
      // Direct branch name as argument
      const directPattern = new RegExp(`\\bgit\\s+push\\b[^|;&]*\\b${branch}\\b`);
      // Refspec targeting protected branch (HEAD:main, feature:main, etc.)
      const refspecPattern = new RegExp(
        `\\bgit\\s+push\\b[^|;&]*:\\s*(?:refs/heads/)?${branch}\\b`
      );

      if (directPattern.test(normalized) || refspecPattern.test(normalized)) {
        process.stderr.write(
          `BLOCKED: Direct push to '${branch}' is not allowed. Use a feature branch and create a PR instead.\n`
        );
        process.exit(2);
      }
    }

    process.exit(0);
  } catch {
    // Parse errors should not block work — allow through
    process.exit(0);
  }
});
