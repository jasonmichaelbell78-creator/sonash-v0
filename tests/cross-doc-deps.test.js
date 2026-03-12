/**
 * Tests for cross-doc dependency checker: diffPattern filtering and auto-fix logic
 *
 * Uses node:test (project convention for gate scripts).
 */

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

// Import the functions under test
const {
  attemptAutoFix,
  matchesTrigger,
  isDependentStaged,
} = require("../scripts/check-cross-doc-deps");

describe("attemptAutoFix", () => {
  let tmpDir;
  let originalCwd;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cross-doc-test-"));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
    // Init a git repo so git add works
    const { execFileSync } = require("node:child_process");
    execFileSync("git", ["init"], { cwd: tmpDir, stdio: "pipe" });
    execFileSync("git", ["config", "user.email", "test@test.com"], {
      cwd: tmpDir,
      stdio: "pipe",
    });
    execFileSync("git", ["config", "user.name", "Test"], {
      cwd: tmpDir,
      stdio: "pipe",
    });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns fixed=true for a doc file with sync comment support", () => {
    // Create a doc file
    const docPath = path.join(tmpDir, "SESSION_CONTEXT.md");
    fs.writeFileSync(docPath, "# Session Context\n\nSome content here.\n");

    const result = attemptAutoFix({
      trigger: "ROADMAP.md",
      dependent: docPath,
      reason: "Session context reflects current roadmap focus",
    });

    assert.equal(result.fixed, true);
    assert.ok(result.action.includes("sync comment"));

    // Verify the file was updated
    const content = fs.readFileSync(docPath, "utf-8");
    assert.match(content, /<!-- Last synced: \d{4}-\d{2}-\d{2} -->/);
  });

  it("updates existing sync comment instead of appending", () => {
    const docPath = path.join(tmpDir, "SESSION_CONTEXT.md");
    fs.writeFileSync(docPath, "# Session Context\n\nContent.\n<!-- Last synced: 2025-01-01 -->\n");

    const result = attemptAutoFix({
      trigger: "ROADMAP.md",
      dependent: docPath,
      reason: "test",
    });

    assert.equal(result.fixed, true);

    const content = fs.readFileSync(docPath, "utf-8");
    // Should have exactly one sync comment
    const matches = content.match(/<!-- Last synced:/g);
    assert.equal(matches.length, 1);
    // Should NOT be the old date
    assert.ok(!content.includes("2025-01-01"));
  });

  it("returns fixed=false for ROADMAP.md dependents", () => {
    const result = attemptAutoFix({
      trigger: "app/admin/page.tsx",
      dependent: "ROADMAP.md",
      reason: "Admin Panel changes must update Track A status in ROADMAP.md",
    });

    assert.equal(result.fixed, false);
    assert.ok(result.action.includes("suggestion"));
    assert.ok(result.action.includes("ROADMAP.md"));
  });

  it("returns fixed=false for COMMAND_REFERENCE.md dependents", () => {
    const result = attemptAutoFix({
      trigger: ".claude/commands/foo.md",
      dependent: ".claude/COMMAND_REFERENCE.md",
      reason: "Skill/command registry must be complete",
    });

    assert.equal(result.fixed, false);
    assert.ok(result.action.includes("suggestion"));
    assert.ok(result.action.includes("COMMAND_REFERENCE.md"));
  });

  it("returns fixed=false when dependent file does not exist", () => {
    const result = attemptAutoFix({
      trigger: "foo.md",
      dependent: path.join(tmpDir, "nonexistent.md"),
      reason: "test",
    });

    assert.equal(result.fixed, false);
    assert.ok(result.action.includes("not found"));
  });
});

describe("matchesTrigger", () => {
  it("matches directory triggers", () => {
    assert.equal(matchesTrigger([".claude/hooks/pre-commit.js"], ".claude/hooks/"), true);
  });

  it("does not match non-matching directory triggers", () => {
    assert.equal(matchesTrigger(["src/hooks/foo.js"], ".claude/hooks/"), false);
  });

  it("matches bare name triggers", () => {
    assert.equal(matchesTrigger(["ROADMAP.md"], "ROADMAP.md"), true);
  });

  it("matches bare name at end of path", () => {
    assert.equal(matchesTrigger(["docs/ROADMAP.md"], "ROADMAP.md"), true);
  });
});

describe("isDependentStaged", () => {
  it("finds exact match", () => {
    assert.equal(isDependentStaged(["SESSION_CONTEXT.md"], "SESSION_CONTEXT.md"), true);
  });

  it("finds bare name at end of path", () => {
    assert.equal(isDependentStaged(["docs/TRIGGERS.md"], "docs/TRIGGERS.md"), true);
  });

  it("returns false for non-staged file", () => {
    assert.equal(isDependentStaged(["src/app.js"], "SESSION_CONTEXT.md"), false);
  });
});

describe("diffPattern filtering", () => {
  it("correctly identifies rules that should be skipped when diff has no matching pattern", () => {
    // This tests the concept: a diffPattern regex should NOT match trivial changes
    const roadmapDiffPattern =
      /Phase \d|Sprint|Status.*(COMPLETE|NOT STARTED)|Current Focus|\d+\/\d+/i;

    // Trivial diff -- should NOT match
    const trivialDiff = "+- Fixed a typo in the description\n-  Fixed a type in the description";
    assert.equal(roadmapDiffPattern.test(trivialDiff), false);

    // Substantive diff -- SHOULD match
    const substantiveDiff = "+Phase 6: Gate Recalibration - Status: COMPLETE";
    assert.equal(roadmapDiffPattern.test(substantiveDiff), true);
  });

  it("hooks diffPattern only matches code logic changes", () => {
    const hooksDiffPattern = /function|module\.exports|require\(|addEventListener/;

    // Comment change -- should NOT match
    assert.equal(hooksDiffPattern.test("// Updated comment text"), false);

    // Code change -- SHOULD match
    assert.equal(hooksDiffPattern.test("+function handleNewEvent() {"), true);
    assert.equal(hooksDiffPattern.test("+module.exports = { foo }"), true);
  });

  it("technical debt diffPattern only matches significant changes", () => {
    const debtDiffPattern = /MASTER_DEBT|S0|S1|critical|blocker/i;

    // Routine append -- should NOT match
    assert.equal(
      debtDiffPattern.test('+{"id":"td-99","severity":"S2","title":"Minor issue"}'),
      false
    );

    // Critical change -- SHOULD match
    assert.equal(
      debtDiffPattern.test('+{"id":"td-100","severity":"S0","title":"Security flaw"}'),
      true
    );
    assert.equal(debtDiffPattern.test("+MASTER_DEBT.jsonl updated"), true);
  });
});
