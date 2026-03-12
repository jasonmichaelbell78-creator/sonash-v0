#!/usr/bin/env node
/* global process, require */
/* eslint-disable @typescript-eslint/no-require-imports, no-empty */
// Claude Code Statusline - GSD Edition
// Shows: model | branch | current task | directory | context usage

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Sanitize dynamic values: strip control chars, CSI/OSC escapes, cap length
/* eslint-disable no-control-regex -- Intentional control char sanitization */
const sanitize = (s) =>
  String(s ?? "")
    .replace(/[\x00-\x1f\x7f-\x9f]/g, "")
    .replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "")
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "")
    .slice(0, 80);
/* eslint-enable no-control-regex */

/**
 * Build context window display string from remaining percentage.
 */
function buildContextDisplay(remaining) {
  if (remaining == null) return "";
  const remRaw = Math.round(Number(remaining));
  const rem = Number.isFinite(remRaw) ? Math.max(0, Math.min(100, remRaw)) : 0;
  const used = 100 - rem;
  const filled = Math.max(0, Math.min(10, Math.floor(used / 10)));
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(10 - filled);
  if (used < 50) return ` \x1b[32m${bar} ${used}%\x1b[0m`;
  if (used < 65) return ` \x1b[33m${bar} ${used}%\x1b[0m`;
  if (used < 80) return ` \x1b[38;5;208m${bar} ${used}%\x1b[0m`;
  return ` \x1b[5;31m\uD83D\uDC80 ${bar} ${used}%\x1b[0m`;
}

/**
 * Find current in-progress task from todo files.
 */
function findCurrentTask(session, homeDir) {
  const todosDir = path.join(homeDir, ".claude", "todos");
  if (!session || !fs.existsSync(todosDir)) return "";
  const files = fs
    .readdirSync(todosDir)
    .filter((f) => f.startsWith(session) && f.includes("-agent-") && f.endsWith(".json"))
    .map((f) => {
      try {
        return { name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime };
      } catch {
        return null;
      }
    })
    .filter((f) => f !== null)
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) return "";
  try {
    const todoFilePath = path.join(todosDir, files[0].name);
    const resolved = path.resolve(todoFilePath);
    const rel = path.relative(todosDir, resolved);
    if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) return "";
    const todos = JSON.parse(fs.readFileSync(resolved, "utf8"));
    if (!Array.isArray(todos)) return "";
    const inProgress = todos.find((t) => t.status === "in_progress");
    if (!inProgress) return "";
    // eslint-disable-next-line no-control-regex -- Intentional control char sanitization
    return (inProgress.activeForm || "").replace(/[\x00-\x1f\x7f-\x9f]/g, "");
  } catch {
    return "";
  }
}

/**
 * Check if GSD update is available.
 */
function checkGsdUpdate(homeDir) {
  try {
    const cacheFile = path.join(homeDir, ".claude", "cache", "gsd-update-check.json");
    const cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
    return cache.update_available ? "\x1b[33m\u2B06 /gsd:update\x1b[0m \u2502 " : "";
  } catch {
    return "";
  }
}

// Read JSON from stdin
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const model = data.model?.display_name || "Claude";
    const dir = data.workspace?.current_dir || process.cwd();
    const session = data.session_id || "";
    const homeDir = os.homedir();

    const ctx = buildContextDisplay(data.context_window?.remaining_percentage);
    const task = findCurrentTask(session, homeDir);
    const gsdUpdate = checkGsdUpdate(homeDir);

    // Git branch
    let branch = "";
    try {
      branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
        cwd: dir,
        encoding: "utf8",
        timeout: 1000,
        windowsHide: true,
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();
    } catch {}

    // Output
    const safeBranch = sanitize(branch);
    const safeDirname = sanitize(path.basename(dir));
    const branchPart = safeBranch ? ` \u2502 \x1b[36m${safeBranch}\x1b[0m` : "";
    if (task) {
      process.stdout.write(
        `${gsdUpdate}\x1b[2m${model}\x1b[0m${branchPart} \u2502 \x1b[1m${task}\x1b[0m \u2502 \x1b[2m${safeDirname}\x1b[0m${ctx}`
      );
    } else {
      process.stdout.write(
        `${gsdUpdate}\x1b[2m${model}\x1b[0m${branchPart} \u2502 \x1b[2m${safeDirname}\x1b[0m${ctx}`
      );
    }
  } catch {
    // Silent fail - don't break statusline on parse errors
  }
});
