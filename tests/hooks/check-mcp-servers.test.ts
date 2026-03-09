/**
 * Tests for .claude/hooks/check-mcp-servers.js
 *
 * The hook reads .mcp.json from the project directory and outputs
 * server names. It runs at SessionStart with no stdin.
 *
 * We test the output sanitization and path traversal guard logic inline.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as path from "node:path";
import * as os from "node:os";

// Extracted sanitization function for unit testing
function sanitizeOutput(str: string): string {
  return str.replace(/[^a-zA-Z0-9 ,_-]/g, "");
}

// Extracted path traversal check logic
function isProjectDirSafe(safeBaseDir: string, projectDir: string): boolean {
  const rel = path.relative(safeBaseDir, projectDir);
  if (rel.startsWith(".." + path.sep) || rel === ".." || path.isAbsolute(rel)) {
    return false;
  }
  return true;
}

// Extracted server name extraction logic
function extractServerNames(config: unknown): string[] | null {
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;
  const obj = config as Record<string, unknown>;
  const mcpServers = obj.mcpServers;
  if (
    !mcpServers ||
    typeof mcpServers !== "object" ||
    mcpServers === null ||
    Array.isArray(mcpServers)
  ) {
    return null;
  }
  return Object.keys(mcpServers as Record<string, unknown>).slice(0, 50);
}

describe("sanitizeOutput", () => {
  test("allows alphanumeric characters, spaces, commas, underscores, hyphens", () => {
    assert.equal(sanitizeOutput("my-server_1 test, other"), "my-server_1 test, other");
  });

  test("strips special characters and symbols", () => {
    const input = "server@host:8080/path?query=val&other";
    const result = sanitizeOutput(input);
    assert.ok(!result.includes("@"), "@ should be stripped");
    assert.ok(!result.includes(":"), "colon should be stripped");
    assert.ok(!result.includes("/"), "slash should be stripped");
    assert.ok(!result.includes("?"), "? should be stripped");
  });

  test("strips newlines and control characters", () => {
    assert.equal(sanitizeOutput("server\nname"), "servername");
    assert.equal(sanitizeOutput("server\tname"), "servername");
  });

  test("returns empty string for all-special-character input", () => {
    assert.equal(sanitizeOutput("!@#$%^&*()"), "");
  });

  test("handles empty string", () => {
    assert.equal(sanitizeOutput(""), "");
  });

  test("preserves underscores used in server names", () => {
    assert.equal(sanitizeOutput("my_mcp_server"), "my_mcp_server");
  });
});

describe("isProjectDirSafe: path traversal guard", () => {
  test("returns true when projectDir equals baseDir", () => {
    const base = "/home/user/project";
    assert.equal(isProjectDirSafe(base, base), true);
  });

  test("returns true when projectDir is a subdirectory of baseDir", () => {
    const base = "/home/user/project";
    const projectDir = "/home/user/project/subdir";
    assert.equal(isProjectDirSafe(base, projectDir), true);
  });

  test("returns false when projectDir escapes baseDir via ..", () => {
    const base = "/home/user/project";
    const projectDir = "/home/user/other-project";
    assert.equal(isProjectDirSafe(base, projectDir), false);
  });

  test("returns false for an absolute unrelated path", () => {
    const base = "/home/user/project";
    const projectDir = "/etc/passwd";
    // path.relative will produce ../../../etc/passwd
    assert.equal(isProjectDirSafe(base, projectDir), false);
  });

  test("handles Windows-style paths on the current platform", () => {
    // Use os-appropriate paths
    const base = path.resolve(os.tmpdir(), "project");
    const safe = path.resolve(base, "subdir");
    assert.equal(isProjectDirSafe(base, safe), true);
  });
});

describe("extractServerNames", () => {
  test("returns array of server names from valid config", () => {
    const config = {
      mcpServers: {
        "server-a": { command: "node", args: ["server-a.js"] },
        "server-b": { command: "python", args: ["server-b.py"] },
      },
    };
    const names = extractServerNames(config);
    assert.deepEqual(names, ["server-a", "server-b"]);
  });

  test("returns null when mcpServers is missing", () => {
    assert.equal(extractServerNames({ other: "value" }), null);
  });

  test("returns null for null input", () => {
    assert.equal(extractServerNames(null), null);
  });

  test("returns null for array input", () => {
    assert.equal(extractServerNames([]), null);
  });

  test("returns empty array when mcpServers is empty object", () => {
    const config = { mcpServers: {} };
    const names = extractServerNames(config);
    assert.deepEqual(names, []);
  });

  test("caps output at 50 server names", () => {
    const servers: Record<string, unknown> = {};
    for (let i = 0; i < 60; i++) {
      servers[`server-${i}`] = {};
    }
    const config = { mcpServers: servers };
    const names = extractServerNames(config);
    assert.ok(names !== null);
    assert.equal(names!.length, 50);
  });

  test("returns null when mcpServers is null", () => {
    const config = { mcpServers: null };
    assert.equal(extractServerNames(config), null);
  });

  test("returns null when mcpServers is an array", () => {
    const config = { mcpServers: ["server1"] };
    assert.equal(extractServerNames(config), null);
  });
});
