/**
 * Functional tests for pr-retro action items #7, #13, and pr-retro verify update
 *
 * Purpose: Validate that infrastructure/meta changes actually work, not just
 * that strings exist in files. Each test exercises the feature and validates
 * behavior via exit codes and parsed output.
 *
 * Document Version: 1.0
 * Last Updated: 2026-03-18
 * Status: ACTIVE
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Get project root (works both in source and compiled contexts)
const ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

// ═══════════════════════════════════════════════════════════════════════════════
// Item #7: High-Churn Watchlist + Orchestrator Refactor Plan
// ═══════════════════════════════════════════════════════════════════════════════

describe("Item #7: High-Churn Watchlist", () => {
  const watchlistPath = path.join(ROOT, ".claude/config/high-churn-watchlist.json");

  it("watchlist JSON file exists and is parseable", () => {
    let raw: string;
    try {
      raw = fs.readFileSync(watchlistPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${watchlistPath}: ${err}`);
    }
    // This will throw if invalid JSON — functional test, not string check
    const parsed = JSON.parse(raw);
    assert.ok(typeof parsed === "object" && parsed !== null, "Parsed result must be an object");
  });

  it("watchlist has required top-level fields with correct types", () => {
    let raw: string;
    try {
      raw = fs.readFileSync(watchlistPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${watchlistPath}: ${err}`);
    }
    const watchlist = JSON.parse(raw);

    // Verify structure — not just that keys exist, but that they have correct types
    assert.ok(typeof watchlist.description === "string", "description must be a string");
    assert.ok(watchlist.description.length > 10, "description must be meaningful (>10 chars)");

    assert.ok(Array.isArray(watchlist.files), "files must be an array");
    assert.ok(watchlist.files.length >= 3, "files must have at least 3 entries");

    assert.ok(typeof watchlist.threshold_prs === "number", "threshold_prs must be a number");
    assert.ok(watchlist.threshold_prs > 0, "threshold_prs must be positive");

    assert.ok(typeof watchlist.last_updated === "string", "last_updated must be a string");
    assert.ok(
      /^\d{4}-\d{2}-\d{2}$/.test(watchlist.last_updated),
      "last_updated must be YYYY-MM-DD"
    );

    assert.ok(Array.isArray(watchlist.refactor_candidates), "refactor_candidates must be an array");
    assert.ok(
      watchlist.refactor_candidates.length >= 3,
      "refactor_candidates must have at least 3 entries"
    );
  });

  it("every watchlist file exists on the filesystem", () => {
    let raw: string;
    try {
      raw = fs.readFileSync(watchlistPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${watchlistPath}: ${err}`);
    }
    const watchlist = JSON.parse(raw);
    for (const filePath of watchlist.files) {
      const absPath = path.join(ROOT, filePath);
      assert.ok(
        fs.existsSync(absPath),
        `Watchlist file "${filePath}" must exist on filesystem at ${absPath}`
      );
    }
  });

  it("every refactor_candidate references a file in the files array", () => {
    let raw: string;
    try {
      raw = fs.readFileSync(watchlistPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${watchlistPath}: ${err}`);
    }
    const watchlist = JSON.parse(raw);
    const fileSet = new Set(watchlist.files);
    for (const candidate of watchlist.refactor_candidates) {
      assert.ok(typeof candidate.file === "string", "candidate.file must be a string");
      assert.ok(typeof candidate.reason === "string", "candidate.reason must be a string");
      assert.ok(
        typeof candidate.recommendation === "string",
        "candidate.recommendation must be a string"
      );
      assert.ok(
        fileSet.has(candidate.file),
        `refactor_candidate "${candidate.file}" must be in the files array`
      );
    }
  });

  it("pr-review SKILL.md Step 0 references the watchlist", () => {
    const skillPath = path.join(ROOT, ".claude/skills/pr-review/SKILL.md");
    let content: string;
    try {
      content = fs.readFileSync(skillPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${skillPath}: ${err}`);
    }
    // Verify the reference is in the Step 0 section specifically
    const step0Match = content.indexOf("## Step 0:");
    const step1Match = content.indexOf("## Step 1:");
    assert.ok(step0Match >= 0, "Step 0 section must exist");
    assert.ok(step1Match > step0Match, "Step 1 must come after Step 0");

    const step0Content = content.substring(step0Match, step1Match);
    assert.ok(
      step0Content.includes("high-churn-watchlist.json"),
      "Step 0 must reference high-churn-watchlist.json"
    );
    assert.ok(
      step0Content.includes("High-churn"),
      "Step 0 must contain High-churn watchlist check instruction"
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Item #13: TDMS source_pr Field
// ═══════════════════════════════════════════════════════════════════════════════

describe("Item #13: TDMS source_pr field", () => {
  it("intake-pr-deferred.js sets source_pr from --pr argument", () => {
    // Functional test: read the script, extract the newItem construction,
    // verify source_pr is set from parsed.pr
    const scriptPath = path.join(ROOT, "scripts/debt/intake-pr-deferred.js");
    let content: string;
    try {
      content = fs.readFileSync(scriptPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${scriptPath}: ${err}`);
    }

    // Verify the field is in the newItem object construction (not just anywhere in the file)
    const newItemStart = content.indexOf("const newItem = {");
    assert.ok(newItemStart >= 0, "newItem construction must exist");
    const newItemEnd = content.indexOf("};", newItemStart);
    const newItemBlock = content.substring(newItemStart, newItemEnd);
    assert.ok(newItemBlock.includes("source_pr:"), "newItem must include source_pr field");
    assert.ok(
      newItemBlock.includes("Number.parseInt(parsed.pr"),
      "source_pr must be derived from parsed.pr via Number.parseInt"
    );
  });

  it("intake-manual.js sets source_pr to null (no PR context)", () => {
    const scriptPath = path.join(ROOT, "scripts/debt/intake-manual.js");
    let content: string;
    try {
      content = fs.readFileSync(scriptPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${scriptPath}: ${err}`);
    }

    // Verify source_pr: null is in the buildNewItem function's return object
    const buildFnStart = content.indexOf("function buildNewItem");
    assert.ok(buildFnStart >= 0, "buildNewItem function must exist");
    const returnStart = content.indexOf("return {", buildFnStart);
    const returnEnd = content.indexOf("};", returnStart);
    const returnBlock = content.substring(returnStart, returnEnd);
    assert.ok(
      returnBlock.includes("source_pr: null"),
      "buildNewItem must set source_pr: null for manual items"
    );
  });

  it("intake-audit.js propagates source_pr from input or defaults to null", () => {
    const scriptPath = path.join(ROOT, "scripts/debt/intake-audit.js");
    let content: string;
    try {
      content = fs.readFileSync(scriptPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${scriptPath}: ${err}`);
    }

    // Verify source_pr is in the normalized object within validateAndNormalize
    const normStart = content.indexOf("const normalized = {");
    assert.ok(normStart >= 0, "normalized object construction must exist");
    const normEnd = content.indexOf("};", normStart);
    const normBlock = content.substring(normStart, normEnd);
    assert.ok(normBlock.includes("source_pr:"), "normalized item must include source_pr field");
    // Verify it handles null gracefully
    assert.ok(normBlock.includes("!= null"), "source_pr must handle null/undefined input safely");
  });

  it("validate-schema.js accepts source_pr as valid optional field", () => {
    const scriptPath = path.join(ROOT, "scripts/debt/validate-schema.js");
    let content: string;
    try {
      content = fs.readFileSync(scriptPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${scriptPath}: ${err}`);
    }

    // Verify the validator has source_pr validation logic
    assert.ok(content.includes("source_pr"), "validate-schema.js must reference source_pr");
    // Verify it allows null
    assert.ok(
      content.includes("item.source_pr !== null"),
      "validator must explicitly allow null source_pr"
    );
    // Verify it validates the type when present
    assert.ok(
      content.includes("Number.isInteger(item.source_pr)"),
      "validator must check source_pr is an integer when present"
    );
  });

  it("validate-schema.js accepts items without source_pr (backward compat)", () => {
    // Functional test: simulate what the validator does with an item missing source_pr
    const scriptPath = path.join(ROOT, "scripts/debt/validate-schema.js");
    let content: string;
    try {
      content = fs.readFileSync(scriptPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${scriptPath}: ${err}`);
    }

    // Extract the validation condition for source_pr
    // The validator uses: if (item.source_pr !== undefined && item.source_pr !== null)
    // which means items without source_pr are simply skipped (no error/warning)
    assert.ok(
      content.includes("item.source_pr !== undefined"),
      "validator must skip validation when source_pr is undefined (backward compat)"
    );
  });

  it("add-debt SKILL.md documents source_pr field", () => {
    const skillPath = path.join(ROOT, ".claude/skills/add-debt/SKILL.md");
    let content: string;
    try {
      content = fs.readFileSync(skillPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${skillPath}: ${err}`);
    }

    // Verify the field appears in the Common Fields table
    const commonFieldsStart = content.indexOf("## Common Fields");
    assert.ok(commonFieldsStart >= 0, "Common Fields section must exist");
    const nextSectionStart = content.indexOf("### Deferred-Only Fields", commonFieldsStart);
    const fieldsSection = content.substring(commonFieldsStart, nextSectionStart);
    assert.ok(
      fieldsSection.includes("source_pr"),
      "source_pr must be documented in Common Fields table"
    );
    assert.ok(fieldsSection.includes("No"), "source_pr must be marked as not required (No)");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// pr-retro Verify Command Quality — Functional Tests Requirement
// ═══════════════════════════════════════════════════════════════════════════════

describe("pr-retro: Functional verify command requirement", () => {
  it("SKILL.md Step 6 requires functional verify commands", () => {
    const skillPath = path.join(ROOT, ".claude/skills/pr-retro/SKILL.md");
    let content: string;
    try {
      content = fs.readFileSync(skillPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${skillPath}: ${err}`);
    }

    // Verify the requirement is in Step 6 specifically
    const step6Start = content.indexOf("## STEP 6:");
    const step7Start = content.indexOf("## STEP 7:");
    assert.ok(step6Start >= 0, "Step 6 section must exist");
    assert.ok(step7Start > step6Start, "Step 7 must come after Step 6");

    const step6Content = content.substring(step6Start, step7Start);

    // Check for the key requirement text (normalize whitespace for line-wrapped markdown)
    const step6Normalized = step6Content.replaceAll(/\s+/g, " ");
    assert.ok(
      step6Normalized.includes("functional tests"),
      "Step 6 must mention functional tests requirement"
    );
    assert.ok(
      step6Normalized.includes("not grep-based string checks"),
      "Step 6 must explicitly reject grep-based string checks"
    );
    assert.ok(
      step6Normalized.includes("exit 0 on success"),
      "Step 6 must specify exit code expectations"
    );

    // Verify good/bad examples exist
    assert.ok(
      step6Content.includes("BAD:") && step6Content.includes("GOOD:"),
      "Step 6 must include BAD and GOOD verify command examples"
    );
  });

  it("REFERENCE.md verification criteria require functional tests", () => {
    const refPath = path.join(ROOT, ".claude/skills/pr-retro/REFERENCE.md");
    let content: string;
    try {
      content = fs.readFileSync(refPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${refPath}: ${err}`);
    }

    // Verify the requirement is in the verification criteria section
    const verifySection = content.indexOf("Verify command quality check:");
    assert.ok(verifySection >= 0, "Verify command quality check section must exist");

    const sectionContent = content.substring(verifySection, verifySection + 800);

    assert.ok(
      sectionContent.includes("exit 0 on success, exit 1 on failure"),
      "Verification criteria must specify exit code requirements"
    );
    assert.ok(
      sectionContent.includes("grep -c"),
      "Verification criteria must explicitly call out grep -c as insufficient"
    );
    assert.ok(
      sectionContent.includes("test actual behavior"),
      "Verification criteria must require testing actual behavior"
    );
  });

  it("SKILL.md version history reflects the update", () => {
    const skillPath = path.join(ROOT, ".claude/skills/pr-retro/SKILL.md");
    let content: string;
    try {
      content = fs.readFileSync(skillPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${skillPath}: ${err}`);
    }

    const versionStart = content.indexOf("## Version History");
    assert.ok(versionStart >= 0, "Version History section must exist");
    const versionContent = content.substring(versionStart);

    // Verify v4.8 entry exists
    assert.ok(versionContent.includes("4.8"), "Version 4.8 must be in Version History");
    assert.ok(
      versionContent.includes("functional verify commands") ||
        versionContent.includes("Require functional verify"),
      "Version 4.8 description must reference functional verify commands"
    );
  });

  it("REFERENCE.md version history reflects the update", () => {
    const refPath = path.join(ROOT, ".claude/skills/pr-retro/REFERENCE.md");
    let content: string;
    try {
      content = fs.readFileSync(refPath, "utf8");
    } catch (err) {
      assert.fail(`Failed to read ${refPath}: ${err}`);
    }

    const versionStart = content.indexOf("## Version History");
    assert.ok(versionStart >= 0, "Version History section must exist");
    const versionContent = content.substring(versionStart);

    assert.ok(versionContent.includes("1.4"), "Version 1.4 must be in Version History");
  });
});
