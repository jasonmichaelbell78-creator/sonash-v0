import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

// Re-implements core logic from scripts/test-hooks.js (medium template)

describe("test-hooks: path containment validation", () => {
  function isPathContained(targetDir: string, baseDir: string): boolean {
    const rel = path.relative(baseDir, targetDir);
    return !(/^\.\.(?:[\\/]|$)/.test(rel) || rel === "" || path.isAbsolute(rel));
  }

  it("hooksDir within projectDir passes", () => {
    const projectDir = "/project";
    const hooksDir = "/project/.claude/hooks";
    assert.strictEqual(isPathContained(hooksDir, projectDir), true);
  });

  it("path escaping project dir fails", () => {
    const projectDir = "/project";
    const outsideDir = "/other";
    assert.strictEqual(isPathContained(outsideDir, projectDir), false);
  });

  it("same directory fails (empty rel)", () => {
    assert.strictEqual(isPathContained("/project", "/project"), false);
  });
});

describe("test-hooks: HOOK_TESTS structure validation", () => {
  interface HookTest {
    description: string;
    skipBasicExecution?: boolean;
    tests: Array<{ name: string; input: string; expectOk: boolean }>;
  }

  const HOOK_TESTS: Record<string, HookTest> = {
    "block-push-to-main.js": {
      description: "Blocks direct pushes to main/master branches",
      skipBasicExecution: true,
      tests: [],
    },
    "component-size-check.js": {
      description: "Component size validator",
      tests: [
        {
          name: "Skip - non-component path",
          input: JSON.stringify({ file_path: "lib/utils.ts" }),
          expectOk: true,
        },
      ],
    },
  };

  it("all hooks have descriptions", () => {
    for (const [name, hook] of Object.entries(HOOK_TESTS)) {
      assert.ok(hook.description.length > 0, `Hook ${name} missing description`);
    }
  });

  it("hooks with skipBasicExecution have empty tests array", () => {
    const skipHooks = Object.values(HOOK_TESTS).filter((h) => h.skipBasicExecution);
    for (const hook of skipHooks) {
      assert.strictEqual(hook.tests.length, 0);
    }
  });

  it("test cases have valid structure", () => {
    for (const hook of Object.values(HOOK_TESTS)) {
      for (const test of hook.tests) {
        assert.ok(test.name.length > 0, "Test missing name");
        assert.ok(typeof test.input === "string", "Test input must be string");
        assert.ok(typeof test.expectOk === "boolean", "expectOk must be boolean");
      }
    }
  });
});

function isValidHookInput(input: string): boolean {
  try {
    const parsed = JSON.parse(input) as unknown;
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed);
  } catch {
    return false;
  }
}

describe("test-hooks: JSON input validation for hooks", () => {
  it("accepts valid JSON object input", () => {
    assert.strictEqual(isValidHookInput(JSON.stringify({ file_path: "src/app.tsx" })), true);
  });

  it("rejects non-JSON input", () => {
    assert.strictEqual(isValidHookInput("not json"), false);
  });

  it("rejects JSON array input", () => {
    assert.strictEqual(isValidHookInput("[]"), false);
  });

  it("rejects null JSON", () => {
    assert.strictEqual(isValidHookInput("null"), false);
  });
});
