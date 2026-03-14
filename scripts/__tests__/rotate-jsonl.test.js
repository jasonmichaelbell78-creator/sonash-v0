/* global __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * rotate-jsonl.test.js — Tests for the unified JSONL rotation script
 * Part of Data Effectiveness Audit (Wave 0.2)
 */

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const projectRoot = path.resolve(__dirname, "..", "..");

// Import the module under test
const { validateConfig, detectTimestampField, KNOWN_DATE_FIELDS } = require(
  path.resolve(projectRoot, "scripts", "rotate-jsonl.js")
);

// Import expireJsonlByAge for integration test
let expireJsonlByAge;
try {
  ({ expireJsonlByAge } = require(
    path.resolve(projectRoot, ".claude", "hooks", "lib", "rotate-state.js")
  ));
} catch {
  // If rotate-state.js is unavailable, skip integration tests
  expireJsonlByAge = null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "rotate-jsonl-test-"));
}

function cleanTempDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup
  }
}

// ---------------------------------------------------------------------------
// 1. Config validation tests
// ---------------------------------------------------------------------------

describe("rotation-policy.json config validation", () => {
  it("should load and parse the actual config file", () => {
    const configPath = path.resolve(projectRoot, "config", "rotation-policy.json");

    const content = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(content);

    assert.ok(config, "config should be defined");
    assert.equal(config.schema_version, 1);
    assert.ok(config.tiers, "tiers should be defined");
    assert.equal(typeof config.tiers, "object");
  });

  it("should have valid structure per validateConfig()", () => {
    const configPath = path.resolve(projectRoot, "config", "rotation-policy.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    const result = validateConfig(config);
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });

  it("should contain expected tiers: operational, historical, permanent", () => {
    const configPath = path.resolve(projectRoot, "config", "rotation-policy.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    assert.ok(config.tiers.operational, "operational tier should exist");
    assert.ok(config.tiers.historical, "historical tier should exist");
    assert.ok(config.tiers.permanent, "permanent tier should exist");
  });

  it("should have maxAgeDays as number for operational and historical", () => {
    const configPath = path.resolve(projectRoot, "config", "rotation-policy.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    assert.equal(typeof config.tiers.operational.maxAgeDays, "number");
    assert.ok(config.tiers.operational.maxAgeDays > 0, "operational maxAgeDays > 0");
    assert.equal(typeof config.tiers.historical.maxAgeDays, "number");
    assert.ok(config.tiers.historical.maxAgeDays > 0, "historical maxAgeDays > 0");
  });

  it("should have maxAgeDays as null for permanent tier", () => {
    const configPath = path.resolve(projectRoot, "config", "rotation-policy.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    assert.equal(config.tiers.permanent.maxAgeDays, null);
  });

  it("should reject invalid config structures", () => {
    assert.equal(validateConfig(null).valid, false);
    assert.equal(validateConfig("string").valid, false);
    assert.equal(validateConfig({}).valid, false);
    assert.equal(validateConfig({ schema_version: 2, tiers: {} }).valid, false);

    // Missing files array
    assert.equal(
      validateConfig({
        schema_version: 1,
        tiers: { bad: { maxAgeDays: 10 } },
      }).valid,
      false
    );

    // Negative maxAgeDays
    assert.equal(
      validateConfig({
        schema_version: 1,
        tiers: { bad: { maxAgeDays: -5, files: [] } },
      }).valid,
      false
    );

    // Path traversal
    assert.equal(
      validateConfig({
        schema_version: 1,
        tiers: { bad: { maxAgeDays: 10, files: ["../../etc/passwd"] } },
      }).valid,
      false
    );
  });

  it("should accept a valid minimal config", () => {
    const result = validateConfig({
      schema_version: 1,
      tiers: {
        test: {
          maxAgeDays: 7,
          description: "test tier",
          files: ["some/file.jsonl"],
        },
      },
    });
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });
});

// ---------------------------------------------------------------------------
// 2. Timestamp field detection tests
// ---------------------------------------------------------------------------

describe("timestamp field detection", () => {
  it("should have known fields for reviews.jsonl and retros.jsonl", () => {
    assert.equal(KNOWN_DATE_FIELDS["reviews.jsonl"], "date");
    assert.equal(KNOWN_DATE_FIELDS["retros.jsonl"], "date");
  });

  it("should detect 'timestamp' from a file with timestamp field", () => {
    let tempDir;
    try {
      tempDir = makeTempDir();
      const filePath = path.join(tempDir, "test-ts.jsonl");
      fs.writeFileSync(filePath, '{"timestamp":"2026-01-01T00:00:00Z","msg":"hello"}\n', "utf-8");

      const field = detectTimestampField(filePath);
      assert.equal(field, "timestamp");
    } finally {
      if (tempDir) cleanTempDir(tempDir);
    }
  });

  it("should detect 'date' from a file with date field", () => {
    let tempDir;
    try {
      tempDir = makeTempDir();
      const filePath = path.join(tempDir, "test-date.jsonl");
      fs.writeFileSync(filePath, '{"date":"2026-01-01","title":"test"}\n', "utf-8");

      const field = detectTimestampField(filePath);
      assert.equal(field, "date");
    } finally {
      if (tempDir) cleanTempDir(tempDir);
    }
  });

  it("should default to 'timestamp' for missing files", () => {
    const field = detectTimestampField(path.join(os.tmpdir(), "nonexistent-file.jsonl"));
    assert.equal(field, "timestamp");
  });

  it("should default to 'timestamp' for empty files", () => {
    let tempDir;
    try {
      tempDir = makeTempDir();
      const filePath = path.join(tempDir, "empty.jsonl");
      fs.writeFileSync(filePath, "", "utf-8");

      const field = detectTimestampField(filePath);
      assert.equal(field, "timestamp");
    } finally {
      if (tempDir) cleanTempDir(tempDir);
    }
  });

  it("should use known field map over file probing", () => {
    let tempDir;
    try {
      tempDir = makeTempDir();
      const filePath = path.join(tempDir, "reviews.jsonl");
      // Write a file that has "timestamp" — but the known map says "date"
      fs.writeFileSync(filePath, '{"timestamp":"2026-01-01T00:00:00Z","data":"test"}\n', "utf-8");

      const field = detectTimestampField(filePath);
      assert.equal(field, "date");
    } finally {
      if (tempDir) cleanTempDir(tempDir);
    }
  });

  it("should verify all config files have resolvable timestamp fields", () => {
    const configPath = path.resolve(projectRoot, "config", "rotation-policy.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    for (const [, tier] of Object.entries(config.tiers)) {
      if (tier.maxAgeDays === null) continue;

      for (const relFile of tier.files) {
        const absPath = path.resolve(projectRoot, relFile);
        const field = detectTimestampField(absPath);

        assert.ok(
          ["timestamp", "date"].includes(field),
          `${relFile} should resolve to timestamp or date, got: ${field}`
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Integration test: actual rotation with temp files
// ---------------------------------------------------------------------------

describe("expireJsonlByAge integration", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    if (tempDir) cleanTempDir(tempDir);
  });

  it("should remove entries older than maxAgeDays", { skip: !expireJsonlByAge }, () => {
    const filePath = path.join(tempDir, "test-rotation.jsonl");

    const now = new Date();
    const oldDate = new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000);

    const lines = [
      JSON.stringify({ timestamp: oldDate.toISOString(), msg: "old-1" }),
      JSON.stringify({ timestamp: oldDate.toISOString(), msg: "old-2" }),
      JSON.stringify({ timestamp: now.toISOString(), msg: "new-1" }),
      JSON.stringify({ timestamp: now.toISOString(), msg: "new-2" }),
      JSON.stringify({ timestamp: now.toISOString(), msg: "new-3" }),
    ];

    fs.writeFileSync(filePath, lines.join("\n") + "\n", "utf-8");

    const result = expireJsonlByAge(filePath, 30, "timestamp");

    assert.equal(result.expired, true);
    assert.equal(result.before, 5);
    assert.equal(result.after, 3);

    const remaining = fs
      .readFileSync(filePath, "utf-8")
      .split("\n")
      .filter((l) => l.trim().length > 0);

    assert.equal(remaining.length, 3);
    for (const line of remaining) {
      const entry = JSON.parse(line);
      assert.match(entry.msg, /^new-/);
    }
  });

  it("should be idempotent — no changes on second run", { skip: !expireJsonlByAge }, () => {
    const filePath = path.join(tempDir, "test-idempotent.jsonl");

    const now = new Date();
    const lines = [
      JSON.stringify({ timestamp: now.toISOString(), msg: "recent-1" }),
      JSON.stringify({ timestamp: now.toISOString(), msg: "recent-2" }),
    ];

    fs.writeFileSync(filePath, lines.join("\n") + "\n", "utf-8");

    const result1 = expireJsonlByAge(filePath, 30, "timestamp");
    assert.equal(result1.expired, false);
    assert.equal(result1.before, 2);
    assert.equal(result1.after, 2);

    const result2 = expireJsonlByAge(filePath, 30, "timestamp");
    assert.equal(result2.expired, false);
    assert.equal(result2.before, 2);
    assert.equal(result2.after, 2);
  });

  it("should handle the 'date' timestamp field", { skip: !expireJsonlByAge }, () => {
    const filePath = path.join(tempDir, "test-date-field.jsonl");

    const now = new Date();
    const oldDate = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000);

    const lines = [
      JSON.stringify({ date: oldDate.toISOString().split("T")[0], title: "old" }),
      JSON.stringify({ date: now.toISOString().split("T")[0], title: "new" }),
    ];

    fs.writeFileSync(filePath, lines.join("\n") + "\n", "utf-8");

    const result = expireJsonlByAge(filePath, 30, "date");

    assert.equal(result.expired, true);
    assert.equal(result.before, 2);
    assert.equal(result.after, 1);
  });

  it("should handle empty file gracefully", { skip: !expireJsonlByAge }, () => {
    const filePath = path.join(tempDir, "empty.jsonl");
    fs.writeFileSync(filePath, "", "utf-8");

    const result = expireJsonlByAge(filePath, 30, "timestamp");

    assert.equal(result.expired, false);
    assert.equal(result.before, 0);
    assert.equal(result.after, 0);
  });

  it("should keep entries with unparseable timestamps", { skip: !expireJsonlByAge }, () => {
    const filePath = path.join(tempDir, "bad-timestamps.jsonl");

    const lines = [
      JSON.stringify({ timestamp: "not-a-date", msg: "kept" }),
      JSON.stringify({ msg: "no-timestamp-field" }),
      '{"malformed json',
    ];

    fs.writeFileSync(filePath, lines.join("\n") + "\n", "utf-8");

    const result = expireJsonlByAge(filePath, 30, "timestamp");

    assert.equal(result.expired, false);
    assert.equal(result.before, 3);
    assert.equal(result.after, 3);
  });

  it("should return graceful result for nonexistent file", { skip: !expireJsonlByAge }, () => {
    const filePath = path.join(tempDir, "does-not-exist.jsonl");
    const result = expireJsonlByAge(filePath, 30, "timestamp");

    assert.equal(result.expired, false);
    assert.equal(result.before, 0);
    assert.equal(result.after, 0);
  });
});
