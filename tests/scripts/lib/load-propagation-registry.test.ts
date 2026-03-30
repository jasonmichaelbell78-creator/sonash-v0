import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";

const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../../package.json"))
  ? path.resolve(__dirname, "../../..")
  : path.resolve(__dirname, "../../../..");

// eslint-disable-next-line @typescript-eslint/no-require-imports -- CJS module
const registry = require(path.join(PROJECT_ROOT, "scripts/lib/load-propagation-registry.js"));
const { loadRegistry, matchPatterns, findMisses, loadBaseline, isBaselined } = registry;

describe("load-propagation-registry", () => {
  describe("loadRegistry", () => {
    it("loads all patterns from canonical registry", () => {
      const patterns = loadRegistry({ verbose: true });
      assert.ok(patterns.length >= 10, `Expected >= 10, got ${patterns.length}`);
    });

    it("each entry has required fields", () => {
      const patterns = loadRegistry();
      for (const p of patterns) {
        assert.ok(p.id, "missing id");
        assert.ok(p.description, "missing description");
        assert.ok(p.pattern, "missing pattern");
        assert.ok(Array.isArray(p.searchGlob), "searchGlob not array");
        assert.ok(["BLOCK", "WARN"].includes(p.severity), `bad severity: ${p.severity}`);
        assert.ok(
          ["antiPattern", "patternAbsence"].includes(p.missDetection),
          `bad missDetection: ${p.missDetection}`
        );
      }
    });

    it("returns empty array for missing file", () => {
      const result = loadRegistry({ registryPath: "/nonexistent/file.json" });
      assert.deepEqual(result, []);
    });

    it("returns empty array for invalid JSON", () => {
      const tmp = path.join(os.tmpdir(), "bad-registry.json");
      try {
        fs.writeFileSync(tmp, "not json");
        const result = loadRegistry({ registryPath: tmp });
        assert.deepEqual(result, []);
      } finally {
        try {
          fs.unlinkSync(tmp);
        } catch {
          /* cleanup */
        }
      }
    });

    it("skips entries with invalid severity", () => {
      const tmp = path.join(os.tmpdir(), "bad-severity.json");
      try {
        fs.writeFileSync(
          tmp,
          JSON.stringify({
            patterns: [
              {
                id: "test",
                description: "test",
                pattern: "foo",
                searchGlob: ["**/*.js"],
                severity: "INVALID",
              },
            ],
          })
        );
        const result = loadRegistry({ registryPath: tmp, verbose: true });
        assert.equal(result.length, 0);
      } finally {
        try {
          fs.unlinkSync(tmp);
        } catch {
          /* cleanup */
        }
      }
    });
  });

  describe("matchPatterns", () => {
    it("triggers on matching diff lines", () => {
      const registry = loadRegistry();
      const lines = ["+  const result = sanitizeError(err);"];
      const triggered = matchPatterns(lines, registry);
      assert.ok(triggered.includes("sanitize-error"));
    });

    it("returns empty for unrelated lines", () => {
      const registry = loadRegistry();
      const triggered = matchPatterns(["+  const x = 42;"], registry);
      assert.deepEqual(triggered, []);
    });

    it("strips leading + from diff lines", () => {
      const registry = loadRegistry();
      const triggered = matchPatterns(["+ sanitizeError(err)"], registry);
      assert.ok(triggered.includes("sanitize-error"));
    });
  });

  describe("findMisses", () => {
    it("detects antiPattern mode misses", () => {
      const tmp = path.join(os.tmpdir(), "miss-test.js");
      try {
        fs.writeFileSync(tmp, "const msg = error.message;\n");
        const entry = {
          id: "test",
          pattern: "sanitizeError",
          antiPattern: "error\\.message",
          missDetection: "antiPattern",
        };
        const misses = findMisses(entry, [tmp]);
        assert.equal(misses.length, 1);
        assert.equal(misses[0].mode, "antiPattern");
      } finally {
        try {
          fs.unlinkSync(tmp);
        } catch {
          /* cleanup */
        }
      }
    });

    it("detects patternAbsence mode misses", () => {
      const tmp = path.join(os.tmpdir(), "absence-test.js");
      try {
        fs.writeFileSync(tmp, "const x = 1;\n");
        const entry = {
          id: "test",
          pattern: "refuseSymlink",
          antiPattern: null,
          missDetection: "patternAbsence",
        };
        const misses = findMisses(entry, [tmp]);
        assert.equal(misses.length, 1);
        assert.equal(misses[0].mode, "patternAbsence");
      } finally {
        try {
          fs.unlinkSync(tmp);
        } catch {
          /* cleanup */
        }
      }
    });

    it("returns empty when antiPattern not defined in antiPattern mode", () => {
      const entry = {
        id: "test",
        pattern: "foo",
        antiPattern: null,
        missDetection: "antiPattern",
      };
      const misses = findMisses(entry, ["/nonexistent"]);
      assert.deepEqual(misses, []);
    });

    it("handles unreadable files gracefully", () => {
      const entry = {
        id: "test",
        pattern: "foo",
        antiPattern: "bar",
        missDetection: "antiPattern",
      };
      const misses = findMisses(entry, ["/nonexistent/file.js"]);
      assert.deepEqual(misses, []);
    });
  });

  describe("loadBaseline", () => {
    it("returns array from canonical baseline", () => {
      const baseline = loadBaseline();
      assert.ok(Array.isArray(baseline));
    });

    it("returns empty for missing file", () => {
      const result = loadBaseline({ baselinePath: "/nonexistent.json" });
      assert.deepEqual(result, []);
    });
  });

  describe("isBaselined", () => {
    it("matches exact type+key+file", () => {
      const baseline = [{ type: "pattern", key: "sanitize-error", file: "scripts/foo.js" }];
      assert.ok(isBaselined(baseline, "pattern", "sanitize-error", "scripts/foo.js"));
    });

    it("does not match different key", () => {
      const baseline = [{ type: "pattern", key: "sanitize-error", file: "scripts/foo.js" }];
      assert.ok(!isBaselined(baseline, "pattern", "other-key", "scripts/foo.js"));
    });

    it("normalizes backslashes", () => {
      const baseline = [{ type: "pattern", key: "test", file: "scripts/foo.js" }];
      assert.ok(isBaselined(baseline, "pattern", "test", "scripts\\foo.js"));
    });
  });
});
