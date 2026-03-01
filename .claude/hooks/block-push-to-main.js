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
process.stdin.on("error", () => {
  // Transport errors should not block work — allow through
  process.exit(0);
});
process.stdin.on("data", (chunk) => {
  input += chunk;
  // Fail-open on unexpectedly large payloads (avoid memory blowups)
  if (input.length > 1024 * 1024) {
    process.exit(0);
  }
});
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const command = (data.tool_input && data.tool_input.command) || "";

    // Fast bail: only inspect commands that look like git push
    if (!/\bgit\b/i.test(command) || !/\bpush\b/i.test(command)) {
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
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    for (const branch of PROTECTED_BRANCHES) {
      const escaped = escapeRegex(branch);
      // Direct branch name as argument (use (?:\\s|^) to avoid matching substrings like "feature-main")
      const directPattern = new RegExp(
        `\\bgit\\s+push\\b[^|;&]*(?:\\s|^)(?:refs/heads/)?${escaped}(?=\\s|$)`
      );
      // Refspec targeting protected branch (HEAD:main, feature:main, etc.)
      const refspecPattern = new RegExp(
        `\\bgit\\s+push\\b[^|;&]*:\\s*(?:refs/heads/)?${escaped}(?=\\s|$)`
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
