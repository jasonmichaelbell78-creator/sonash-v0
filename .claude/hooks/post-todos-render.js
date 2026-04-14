#!/usr/bin/env node
/* global require, process, console, module, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */

// PostToolUse Write/Edit hook: when .planning/todos.jsonl is written, regenerate
// the human-readable .planning/TODOS.md view and stage it so the .md never
// drifts from the canonical JSONL. Mirrors the doc-index pre-commit pattern.
// Failures are non-blocking (log + ok exit) — drift is bad, but blocking write
// tools because of a render error is worse.

"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const TODOS_JSONL = ".planning/todos.jsonl";
const TODOS_MD = ".planning/TODOS.md";
const RENDERER = "scripts/planning/render-todos.js";
const AUDIT_LOG = ".claude/state/post-todos-render-audit.jsonl";

// sanitize-error helper — required by CLAUDE.md §5. Fallback preserves
// non-blocking semantics if the helper is unavailable mid-refactor.
let sanitizeError;
try {
  ({ sanitizeError } = require(
    path.join(__dirname, "..", "..", "scripts", "lib", "sanitize-error.cjs")
  ));
} catch {
  sanitizeError = (err) => (err instanceof Error ? err.constructor.name : "unknown error");
}

function parseHookFilePath(rawArg) {
  if (!rawArg) return "";
  const trimmed = String(rawArg);
  if (trimmed.trimStart().startsWith("{")) {
    try {
      return JSON.parse(trimmed).file_path || "";
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function isTodosJsonl(filePath) {
  if (!filePath) return false;
  return String(filePath).replaceAll("\\", "/").endsWith(TODOS_JSONL);
}

// Resolve symlinks if present, otherwise return the lexical resolved path.
// Silently tolerates ENOENT (file may not exist yet in some code paths).
function realpathIfExists(absPath) {
  try {
    return fs.realpathSync(absPath);
  } catch {
    return absPath;
  }
}

// Containment check — strict. The resolved file_path must match exactly
// {projectDir}/.planning/todos.jsonl. Defends against crafted paths that
// merely end in the expected suffix but resolve outside the expected dir.
// Uses realpathSync to defeat symlink redirects AND rejects any symlink at
// the file path itself (matches security-helpers.js refuseSymlinkWithParents
// pattern) — a symlink pointing inside the repo is still suspicious here
// because the canonical `.planning/todos.jsonl` is never a symlink in
// normal operation.
function isCanonicalTodosPath(projectDir, filePath) {
  if (!projectDir || !filePath) return false;
  try {
    const absActual = path.resolve(filePath);
    // Reject symlinks outright — only the real, canonical file should trigger.
    try {
      if (fs.lstatSync(absActual).isSymbolicLink()) return false;
    } catch {
      // ENOENT is fine — the tool may be creating the file. Fall through.
    }
    const expected = realpathIfExists(path.resolve(projectDir, TODOS_JSONL));
    const actual = realpathIfExists(absActual);
    const norm = (p) => (process.platform === "win32" ? p.toLowerCase() : p);
    return norm(expected) === norm(actual);
  } catch {
    return false;
  }
}

// Convert to project-relative path for logging — strips user-specific
// absolute path prefixes that would leak into the committed audit log.
// Resolves symlinks before computing the relative path so a symlink inside
// .planning/ can't produce a clean-looking relative path that hides an
// out-of-repo target.
function toSafeRelPath(projectDir, filePath) {
  if (!filePath) return "";
  try {
    const resolvedAbs = realpathIfExists(path.resolve(filePath));
    const resolvedBase = realpathIfExists(path.resolve(projectDir));
    const rel = path.relative(resolvedBase, resolvedAbs);
    // If relative escapes projectDir, redact rather than leak the abs path.
    if (!rel || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
      return "[outside-project]";
    }
    return rel.replaceAll("\\", "/");
  } catch {
    return "[unresolvable]";
  }
}

function writeAudit(projectDir, entry) {
  try {
    const auditPath = path.join(projectDir, AUDIT_LOG);
    fs.mkdirSync(path.dirname(auditPath), { recursive: true });
    // Actor context: pid + platform. Deliberately NOT including USER/hostname
    // to avoid reintroducing PII that toSafeRelPath strips out.
    const record = {
      timestamp: new Date().toISOString(),
      pid: process.pid,
      platform: process.platform,
      ...entry,
    };
    fs.appendFileSync(auditPath, JSON.stringify(record) + "\n");
  } catch {
    // Non-blocking: audit failure must never block hook completion.
  }
}

function formatRendererError(err) {
  const stderrTail = err && err.stderr ? String(err.stderr).slice(-2000) : "";
  const stdoutTail = err && err.stdout ? String(err.stdout).slice(-1000) : "";
  const exitStatus = err && typeof err.status === "number" ? err.status : null;
  const safeMsg = sanitizeError(err).slice(0, 200);
  const safeStderr = sanitizeError(stderrTail).slice(-800);
  const safeStdout = sanitizeError(stdoutTail).slice(-400);

  const message =
    "[post-todos-render] Renderer failed (non-blocking): " +
    safeMsg +
    (exitStatus !== null ? " [exit=" + exitStatus + "]" : "") +
    (safeStderr ? "\n--- stderr ---\n" + safeStderr : "") +
    (safeStdout ? "\n--- stdout ---\n" + safeStdout : "");

  return { message, exitStatus, safeMsg };
}

function resolveGitRoot(cwd) {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      timeout: 5000,
      cwd,
    }).trim();
  } catch {
    return cwd;
  }
}

function ok() {
  console.log("ok");
  process.exit(0);
}

function main(rawArg) {
  if (!rawArg) return ok();

  const filePath = parseHookFilePath(rawArg);
  if (!filePath) return ok();
  if (!isTodosJsonl(filePath)) return ok();

  const projectDir = resolveGitRoot(process.cwd());

  // Strict containment — rejects crafted paths that merely end in the
  // expected suffix but resolve outside {projectDir}/.planning/todos.jsonl.
  if (!isCanonicalTodosPath(projectDir, filePath)) return ok();

  const safeRelPath = toSafeRelPath(projectDir, filePath);

  // Re-render — non-blocking on failure.
  try {
    execFileSync("node", [path.resolve(projectDir, RENDERER)], {
      cwd: projectDir,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30_000,
    });
    writeAudit(projectDir, { action: "rendered", file_path: safeRelPath, success: true });
  } catch (err) {
    const { message, exitStatus, safeMsg } = formatRendererError(err);
    console.error(message);
    writeAudit(projectDir, {
      action: "render_failed",
      file_path: safeRelPath,
      success: false,
      exit_status: exitStatus,
      error: safeMsg,
    });
    return ok();
  }

  // Stage the regenerated MD so it lands in the same commit as the JSONL change.
  try {
    execFileSync("git", ["add", TODOS_MD], {
      cwd: projectDir,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5000,
    });
    writeAudit(projectDir, { action: "staged", file_path: TODOS_MD, success: true });
  } catch (err) {
    writeAudit(projectDir, {
      action: "stage_failed",
      file_path: TODOS_MD,
      success: false,
      error: sanitizeError(err).slice(0, 200),
    });
    // Not in git, file unchanged, or other transient — ignore
  }

  return ok();
}

module.exports = {
  parseHookFilePath,
  isTodosJsonl,
  isCanonicalTodosPath,
  toSafeRelPath,
  formatRendererError,
  writeAudit,
  resolveGitRoot,
  AUDIT_LOG,
  TODOS_JSONL,
  TODOS_MD,
  RENDERER,
};

if (require.main === module) {
  main(process.argv[2] || "");
}
