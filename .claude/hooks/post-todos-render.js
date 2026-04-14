#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports */

// PostToolUse Write/Edit hook: when .planning/todos.jsonl is written, regenerate
// the human-readable .planning/TODOS.md view and stage it so the .md never
// drifts from the canonical JSONL. Mirrors the doc-index pre-commit pattern.
// Failures are non-blocking (log + ok exit) — drift is bad, but blocking write
// tools because of a render error is worse.

"use strict";

const { execFileSync } = require("node:child_process");
const path = require("node:path");

const TODOS_JSONL = ".planning/todos.jsonl";
const TODOS_MD = ".planning/TODOS.md";
const RENDERER = "scripts/planning/render-todos.js";

function ok() {
  console.log("ok");
  process.exit(0);
}

const rawArg = process.argv[2] || "";
if (!rawArg) ok();

let filePath = "";
if (rawArg.trimStart().startsWith("{")) {
  try {
    filePath = JSON.parse(rawArg).file_path || "";
  } catch {
    filePath = rawArg;
  }
} else {
  filePath = rawArg;
}

if (!filePath) ok();

// Normalize the path. Match anything ending in .planning/todos.jsonl
// (handles absolute, relative, and windows-style paths).
const normalized = filePath.replaceAll("\\", "/");
if (!normalized.endsWith(TODOS_JSONL)) ok();

let projectDir = process.cwd();
try {
  projectDir = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
    timeout: 5000,
  }).trim();
} catch {
  // Not in a git repo — re-render is still useful, just skip staging
}

// Re-render — non-blocking on failure.
try {
  execFileSync("node", [path.resolve(projectDir, RENDERER)], {
    cwd: projectDir,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
  });
} catch (err) {
  console.error(
    "[post-todos-render] Renderer failed (non-blocking): " +
      String(err && err.message ? err.message : err).slice(0, 200)
  );
  ok();
}

// Stage the regenerated MD so it lands in the same commit as the JSONL change.
// Failure is non-blocking — user can stage manually later.
try {
  execFileSync("git", ["add", TODOS_MD], {
    cwd: projectDir,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 5000,
  });
} catch {
  // Not in git, file unchanged, or other transient — ignore
}

ok();
