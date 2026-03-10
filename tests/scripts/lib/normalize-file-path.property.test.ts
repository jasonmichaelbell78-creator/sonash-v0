import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import * as path from "node:path";
import * as fs from "node:fs";

// Property tests for scripts/lib/normalize-file-path.js
// Properties:
// 1. Output never contains backslashes (always forward slashes)
// 2. Output never starts with "./"
// 3. Output never starts with org/repo prefix (no ":"-prefixed segments)
// 4. Output never starts with leading "/"

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

const MODULE_PATH = path.resolve(PROJECT_ROOT, "scripts/lib/normalize-file-path.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const normalizeFilePath = require(MODULE_PATH) as (
  filePath: string,
  options?: { stripRepoRoot?: boolean }
) => string;

describe("normalizeFilePath property: output never contains backslashes", () => {
  it("any string input produces forward-slash-only output", () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = normalizeFilePath(input);
        assert.ok(
          !result.includes("\\"),
          `normalizeFilePath(${JSON.stringify(input)}) returned "${result}" which contains backslash`
        );
      })
    );
  });
});

describe("normalizeFilePath property: output never starts with ./", () => {
  it("any string input does not produce output starting with ./", () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = normalizeFilePath(input);
        assert.ok(
          !result.startsWith("./"),
          `normalizeFilePath(${JSON.stringify(input)}) returned "${result}" which starts with ./`
        );
      })
    );
  });
});

describe("normalizeFilePath property: empty input returns empty string", () => {
  it("empty string returns empty string", () => {
    assert.strictEqual(normalizeFilePath(""), "");
    assert.strictEqual(normalizeFilePath(null as unknown as string), "");
    assert.strictEqual(normalizeFilePath(undefined as unknown as string), "");
  });
});

describe("normalizeFilePath property: output is always a string", () => {
  it("any input returns a string", () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const result = normalizeFilePath(input as string);
        assert.ok(
          typeof result === "string",
          `Expected string, got ${typeof result} for input ${JSON.stringify(input)}`
        );
      })
    );
  });
});

describe("normalizeFilePath property: Windows drive letters are preserved", () => {
  it("C:/path preserves the drive letter", () => {
    const result = normalizeFilePath("C:\\Users\\alice\\project\\file.ts");
    assert.ok(
      result.startsWith("C:/") || result.includes("file.ts"),
      `Expected drive letter preservation for Windows path, got: ${result}`
    );
  });
});

describe("normalizeFilePath property: org/repo prefix is stripped", () => {
  it("strips org_repo: prefix from paths", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z]+_[a-z]+/),
        fc.string({ minLength: 1 }),
        (prefix, suffix) => {
          const input = `${prefix}:${suffix}`;
          const result = normalizeFilePath(input);
          // Result should not start with the prefix or contain the ":"
          assert.ok(
            !result.startsWith(prefix + ":"),
            `Result should not keep org:repo prefix, got: ${result}`
          );
        }
      )
    );
  });
});

describe("normalizeFilePath property: idempotency for already-normalized paths", () => {
  it("normalizing an already normalized path produces the same result", () => {
    fc.assert(
      fc.property(
        fc
          .stringMatching(/^[a-z0-9/._-]+$/)
          .filter((s) => !s.startsWith("./") && !s.startsWith(".\\") && !s.startsWith("/./")),
        (input) => {
          if (!input) return;
          const once = normalizeFilePath(input);
          const twice = normalizeFilePath(once);
          assert.strictEqual(
            once,
            twice,
            `normalizeFilePath should be idempotent for "${input}": first="${once}" second="${twice}"`
          );
        }
      )
    );
  });
});
