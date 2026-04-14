/**
 * Tests for .claude/hooks/post-todos-render.js
 *
 * The hook fires PostToolUse on Write/Edit. It:
 *   1. Bails fast when the written file is not .planning/todos.jsonl
 *   2. Runs scripts/planning/render-todos.js to regenerate TODOS.md
 *   3. Stages the regenerated TODOS.md
 *   4. Emits an audit-log entry in .claude/state/post-todos-render-audit.jsonl
 *
 * These tests cover the pure helpers (JSON/path parsing, error formatting,
 * audit writes). End-to-end render/stage flow is covered by the
 * pre-commit integration check that runs the renderer on each commit.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

const HOOK_PATH = path.resolve(PROJECT_ROOT, ".claude/hooks/post-todos-render.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const hook = require(HOOK_PATH) as {
  extractFilePath: (raw: string) => string;
  isTodosJsonl: (filePath: string) => boolean;
  formatRendererError: (err: unknown) => {
    message: string;
    exitStatus: number | null;
    safeMsg: string;
  };
  writeAudit: (projectDir: string, entry: Record<string, unknown>) => void;
  AUDIT_LOG: string;
  TODOS_JSONL: string;
};

describe("extractFilePath", () => {
  test("extracts file_path from JSON argument", () => {
    const arg = JSON.stringify({ file_path: ".planning/todos.jsonl" });
    assert.equal(hook.extractFilePath(arg), ".planning/todos.jsonl");
  });

  test("returns raw string when arg is not JSON", () => {
    assert.equal(hook.extractFilePath(".planning/todos.jsonl"), ".planning/todos.jsonl");
  });

  test("returns empty string for empty input", () => {
    assert.equal(hook.extractFilePath(""), "");
  });

  test("returns empty string when JSON has no file_path field", () => {
    const arg = JSON.stringify({ other: "value" });
    assert.equal(hook.extractFilePath(arg), "");
  });

  test("falls back to raw string when JSON is malformed", () => {
    const arg = "{ not valid json";
    assert.equal(hook.extractFilePath(arg), "{ not valid json");
  });

  test("handles leading whitespace before JSON", () => {
    const arg = '  {"file_path":"foo.jsonl"}';
    assert.equal(hook.extractFilePath(arg), "foo.jsonl");
  });
});

describe("isTodosJsonl", () => {
  test("matches exact relative path", () => {
    assert.ok(hook.isTodosJsonl(".planning/todos.jsonl"));
  });

  test("matches absolute unix-style path ending in todos.jsonl", () => {
    assert.ok(hook.isTodosJsonl("/repo/.planning/todos.jsonl"));
  });

  test("matches windows-style backslash path", () => {
    assert.ok(hook.isTodosJsonl("C:\\Users\\dev\\repo\\.planning\\todos.jsonl"));
  });

  test("rejects other jsonl files", () => {
    assert.ok(!hook.isTodosJsonl(".planning/other.jsonl"));
  });

  test("rejects non-jsonl files", () => {
    assert.ok(!hook.isTodosJsonl(".planning/TODOS.md"));
  });

  test("rejects empty string", () => {
    assert.ok(!hook.isTodosJsonl(""));
  });

  test("rejects files that merely contain todos.jsonl as substring", () => {
    assert.ok(!hook.isTodosJsonl(".planning/todos.jsonl.bak"));
  });
});

describe("formatRendererError", () => {
  test("extracts exit status when present", () => {
    const err = { message: "exit 1", status: 1, stderr: "", stdout: "" };
    const result = hook.formatRendererError(err);
    assert.equal(result.exitStatus, 1);
    assert.ok(result.message.includes("[exit=1]"));
  });

  test("handles error without exit status", () => {
    const err = new Error("something broke");
    const result = hook.formatRendererError(err);
    assert.equal(result.exitStatus, null);
    assert.ok(!result.message.includes("[exit="));
  });

  test("includes stderr tail when present", () => {
    const err = {
      message: "failed",
      status: 1,
      stderr: "SyntaxError: unexpected token",
      stdout: "",
    };
    const result = hook.formatRendererError(err);
    assert.ok(result.message.includes("--- stderr ---"));
    assert.ok(result.message.includes("SyntaxError"));
  });

  test("includes stdout tail when present", () => {
    const err = { message: "failed", status: 2, stderr: "", stdout: "partial output" };
    const result = hook.formatRendererError(err);
    assert.ok(result.message.includes("--- stdout ---"));
    assert.ok(result.message.includes("partial output"));
  });

  test("truncates long error messages", () => {
    const err = new Error("x".repeat(500));
    const result = hook.formatRendererError(err);
    // safeMsg is capped at 200 chars
    assert.ok(result.safeMsg.length <= 200);
  });

  test("sanitizes Windows user paths in error message", () => {
    const err = new Error("failed at C:\\Users\\secretname\\repo\\file.js");
    const result = hook.formatRendererError(err);
    assert.ok(!result.safeMsg.includes("secretname"), "user path leaked in safeMsg");
  });

  test("sanitizes Unix home paths in stderr tail", () => {
    const err = {
      message: "failed",
      status: 1,
      stderr: "Error at /home/secretuser/project/file.js",
      stdout: "",
    };
    const result = hook.formatRendererError(err);
    assert.ok(!result.message.includes("secretuser"), "home path leaked in message");
  });

  test("handles non-Error values without throwing", () => {
    assert.doesNotThrow(() => hook.formatRendererError("string error"));
    assert.doesNotThrow(() => hook.formatRendererError(null));
    assert.doesNotThrow(() => hook.formatRendererError(undefined));
    assert.doesNotThrow(() => hook.formatRendererError(42));
  });
});

describe("writeAudit", () => {
  function mkTmp(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), "post-todos-render-test-"));
  }

  test("appends a JSONL line to the audit log", () => {
    const tmp = mkTmp();
    hook.writeAudit(tmp, { action: "rendered", success: true });
    const logPath = path.join(tmp, hook.AUDIT_LOG);
    const content = fs.readFileSync(logPath, "utf8");
    const lines = content.trim().split("\n");
    assert.equal(lines.length, 1);
    const entry = JSON.parse(lines[0]);
    assert.equal(entry.action, "rendered");
    assert.equal(entry.success, true);
    assert.ok(typeof entry.timestamp === "string");
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("appends to existing audit log without clobbering", () => {
    const tmp = mkTmp();
    hook.writeAudit(tmp, { action: "rendered", success: true });
    hook.writeAudit(tmp, { action: "staged", success: true });
    const logPath = path.join(tmp, hook.AUDIT_LOG);
    const content = fs.readFileSync(logPath, "utf8");
    const lines = content.trim().split("\n");
    assert.equal(lines.length, 2);
    assert.equal(JSON.parse(lines[0]).action, "rendered");
    assert.equal(JSON.parse(lines[1]).action, "staged");
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("creates parent directory if missing", () => {
    const tmp = mkTmp();
    // Remove the .claude/state subdir so writeAudit must mkdir
    const stateDir = path.join(tmp, ".claude", "state");
    if (fs.existsSync(stateDir)) {
      fs.rmSync(stateDir, { recursive: true, force: true });
    }
    hook.writeAudit(tmp, { action: "rendered", success: true });
    assert.ok(fs.existsSync(path.join(tmp, hook.AUDIT_LOG)));
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("includes ISO-8601 timestamp in entry", () => {
    const tmp = mkTmp();
    hook.writeAudit(tmp, { action: "rendered", success: true });
    const logPath = path.join(tmp, hook.AUDIT_LOG);
    const entry = JSON.parse(fs.readFileSync(logPath, "utf8").trim());
    // ISO-8601 format: YYYY-MM-DDTHH:MM:SS.sssZ
    assert.match(entry.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("is non-blocking when project dir is unwritable", () => {
    // Pass a path that cannot be created (on most systems). The function
    // swallows errors silently — we only verify it doesn't throw.
    assert.doesNotThrow(() => {
      hook.writeAudit("\0invalid\0path", { action: "rendered", success: true });
    });
  });
});

describe("module exports", () => {
  test("exports the expected helper functions", () => {
    assert.equal(typeof hook.extractFilePath, "function");
    assert.equal(typeof hook.isTodosJsonl, "function");
    assert.equal(typeof hook.formatRendererError, "function");
    assert.equal(typeof hook.writeAudit, "function");
  });

  test("exports canonical constants", () => {
    assert.equal(hook.TODOS_JSONL, ".planning/todos.jsonl");
    assert.equal(hook.AUDIT_LOG, ".claude/state/post-todos-render-audit.jsonl");
  });
});
