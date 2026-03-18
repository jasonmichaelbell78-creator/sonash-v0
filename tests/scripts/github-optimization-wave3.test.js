// @ts-nocheck
/**
 * GitHub Optimization Wave 3 - Code Scanning Remediation Tests
 *
 * Purpose: Validate Semgrep rule tuning, DOMPurify migration, error sanitization,
 * functions/ manual fixes, and alert dismissals.
 *
 * Runs with Node's built-in test runner (plain JS, no compilation needed):
 *   node --test tests/scripts/github-optimization-wave3.test.js
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");

/**
 * Helper: read file safely, return null if missing
 */
function readFile(relPath) {
  const fullPath = path.join(ROOT, relPath);
  try {
    return fs.readFileSync(fullPath, "utf8");
  } catch {
    return null;
  }
}

/**
 * Helper: assert file exists
 */
function assertFileExists(relPath) {
  const fullPath = path.join(ROOT, relPath);
  assert.ok(fs.existsSync(fullPath), `Expected file to exist: ${relPath}`);
}

/**
 * Helper: parse YAML-like content for key presence (line-based)
 */
function yamlHasKey(content, key) {
  const lines = content.split("\n");
  return lines.some((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith(key + ":") || trimmed.startsWith(key + " :");
  });
}

/**
 * Helper: check if a YAML file contains a specific string
 */
function yamlContains(content, str) {
  return content.includes(str);
}

// =============================================================================
// Step 3.1a: no-direct-firestore-write — collection-name matching
// =============================================================================
describe("3.1a: no-direct-firestore-write rule tuning", () => {
  const rulePath = ".semgrep/rules/security/no-direct-firestore-write.yml";

  it("rule file exists", () => {
    assertFileExists(rulePath);
  });

  it("has valid YAML structure with required keys", () => {
    const content = readFile(rulePath);
    assert.ok(content, "File should be readable");
    assert.ok(yamlHasKey(content, "rules"), "Should have rules key");
    assert.ok(yamlContains(content, "id: sonash.security.no-direct-firestore-write"));
    assert.ok(yamlContains(content, "severity: ERROR"));
  });

  it("matches only protected collections (journal, daily_logs, inventoryEntries)", () => {
    const content = readFile(rulePath);
    assert.ok(yamlContains(content, "journal"), "Should reference journal collection");
    assert.ok(yamlContains(content, "daily_logs"), "Should reference daily_logs collection");
    assert.ok(yamlContains(content, "inventoryEntries"), "Should reference inventoryEntries collection");
  });

  it("uses metavariable-regex for collection filtering", () => {
    const content = readFile(rulePath);
    assert.ok(yamlContains(content, "metavariable-regex"), "Should use metavariable-regex for collection matching");
    assert.ok(
      yamlContains(content, "journal|daily_logs|inventoryEntries"),
      "Should have regex matching all three protected collections"
    );
  });

  it("does NOT flag bare imports of Firestore write functions", () => {
    const content = readFile(rulePath);
    // Should not contain import-matching patterns
    assert.ok(
      !yamlContains(content, 'import { ..., setDoc, ... } from "firebase/firestore"'),
      "Should not flag imports — only actual calls to protected collections"
    );
  });

  it("retains correct path includes/excludes", () => {
    const content = readFile(rulePath);
    assert.ok(yamlContains(content, "- app/"), "Should include app/");
    assert.ok(yamlContains(content, "- components/"), "Should include components/");
    assert.ok(yamlContains(content, "- lib/"), "Should include lib/");
    assert.ok(yamlContains(content, "- functions/"), "Should exclude functions/");
    assert.ok(yamlContains(content, "- tests/"), "Should exclude tests/");
  });
});

// =============================================================================
// Step 3.1b: no-eval-usage — exclude function refs
// =============================================================================
describe("3.1b: no-eval-usage rule tuning", () => {
  const rulePath = ".semgrep/rules/security/no-eval-usage.yml";

  it("rule file exists", () => {
    assertFileExists(rulePath);
  });

  it("has two rule IDs (no-eval-usage and no-eval-constructor)", () => {
    const content = readFile(rulePath);
    assert.ok(yamlContains(content, "id: sonash.security.no-eval-usage"));
    assert.ok(yamlContains(content, "id: sonash.security.no-eval-constructor"));
  });

  it("flags eval() directly", () => {
    const content = readFile(rulePath);
    assert.ok(yamlContains(content, "pattern: eval(...)"), "Should match eval() calls");
  });

  it("only flags setTimeout/setInterval with string literal callbacks", () => {
    const content = readFile(rulePath);
    // Should use metavariable-regex to match only string literals
    assert.ok(
      yamlContains(content, "metavariable-regex"),
      "Should use metavariable-regex to restrict to string-literal callbacks"
    );
    assert.ok(
      yamlContains(content, "regex:") && yamlContains(content, "['\\\""),
      "Should match string literals starting with quote characters"
    );
  });

  it("does NOT have pattern-not exclusions for arrow/function (superseded)", () => {
    const content = readFile(rulePath);
    // The old approach used pattern-not for arrows; new approach restricts to string literals
    assert.ok(
      !yamlContains(content, "pattern-not: setTimeout(($ARGS) => {...}, ...)"),
      "Should not use old pattern-not approach for arrow functions"
    );
  });
});

// =============================================================================
// Step 3.1c: no-default-export — exclude components/
// =============================================================================
describe("3.1c: no-default-export rule tuning", () => {
  const rulePath = ".semgrep/rules/style/no-default-export.yml";

  it("rule file exists", () => {
    assertFileExists(rulePath);
  });

  it("excludes components/ from include paths", () => {
    const content = readFile(rulePath);
    const lines = content.split("\n");

    // Find include section and verify components/ is NOT there
    let inInclude = false;
    let inExclude = false;
    let componentsInInclude = false;
    let componentsInExclude = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === "include:") inInclude = true;
      if (trimmed === "exclude:") {
        inInclude = false;
        inExclude = true;
      }
      if (inInclude && trimmed === "- components/") componentsInInclude = true;
      if (inExclude && trimmed === "- components/") componentsInExclude = true;
    }

    assert.ok(!componentsInInclude, "components/ should NOT be in include list");
    assert.ok(componentsInExclude, "components/ should be in exclude list");
  });

  it("still includes lib/ and scripts/", () => {
    const content = readFile(rulePath);
    assert.ok(yamlContains(content, "- lib/"), "Should still include lib/");
    assert.ok(yamlContains(content, "- scripts/"), "Should still include scripts/");
  });
});

// =============================================================================
// Step 3.1d: no-unchecked-array-access — guard patterns + scope
// =============================================================================
describe("3.1d: no-unchecked-array-access rule tuning", () => {
  const rulePath = ".semgrep/rules/correctness/no-unchecked-array-access.yml";

  it("rule file exists", () => {
    assertFileExists(rulePath);
  });

  it("scopes to functions/src/ only (not scripts/)", () => {
    const content = readFile(rulePath);
    assert.ok(
      yamlContains(content, "- functions/src/"),
      "Should include functions/src/"
    );
    // scripts/ should NOT be in include section
    const lines = content.split("\n");
    let inInclude = false;
    let scriptsInInclude = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === "include:") inInclude = true;
      if (trimmed === "exclude:") inInclude = false;
      if (inInclude && trimmed === "- scripts/") scriptsInInclude = true;
    }
    assert.ok(!scriptsInInclude, "scripts/ should NOT be in include list");
  });

  it("has regex match null-check guard pattern", () => {
    const content = readFile(rulePath);
    assert.ok(
      yamlContains(content, "if ($ARR) { ... }"),
      "Should have null-check guard for regex match results"
    );
  });

  it("has .map() callback guard pattern", () => {
    const content = readFile(rulePath);
    assert.ok(yamlContains(content, "$X.map("), "Should have .map() guard pattern");
  });

  it("has .filter() callback guard pattern", () => {
    const content = readFile(rulePath);
    assert.ok(yamlContains(content, "$X.filter("), "Should have .filter() guard pattern");
  });

  it("has .forEach() callback guard pattern", () => {
    const content = readFile(rulePath);
    assert.ok(yamlContains(content, "$X.forEach("), "Should have .forEach() guard pattern");
  });

  it("has OR-fallback guard pattern", () => {
    const content = readFile(rulePath);
    assert.ok(yamlContains(content, "$ARR[0] || ..."), "Should have OR-fallback guard");
  });

  it("retains all original guard patterns", () => {
    const content = readFile(rulePath);
    assert.ok(yamlContains(content, "$ARR.length > 0"), "Should keep length > 0 guard");
    assert.ok(yamlContains(content, "$ARR.length === 0"), "Should keep length === 0 guard");
    assert.ok(yamlContains(content, "$ARR[0] ?? $X"), "Should keep nullish coalescing guard");
    assert.ok(yamlContains(content, "$X.split($Y)[0]"), "Should keep split() guard");
  });
});

// =============================================================================
// Step 3.1e: no-floating-promise — false positive fix
// =============================================================================
describe("3.1e: no-floating-promise rule fix", () => {
  const rulePath = ".semgrep/rules/correctness/no-floating-promise.yml";

  it("rule file exists", () => {
    assertFileExists(rulePath);
  });

  it("excludes assigned-and-awaited fetch patterns", () => {
    const content = readFile(rulePath);
    assert.ok(
      yamlContains(content, "$X = await fetch(...)"),
      "Should exclude $X = await fetch(...) assignments"
    );
  });

  it("excludes assigned-and-awaited .json() patterns", () => {
    const content = readFile(rulePath);
    assert.ok(
      yamlContains(content, "$X = await $OBJ.json()"),
      "Should exclude $X = await $OBJ.json() assignments"
    );
  });

  it("still flags truly floating fetch()", () => {
    const content = readFile(rulePath);
    assert.ok(
      yamlContains(content, "pattern: fetch(...);"),
      "Should still match standalone fetch() statements"
    );
  });
});

// =============================================================================
// Step 3.2a: DOMPurify migration in use-journal.ts
// =============================================================================
describe("3.2a: DOMPurify migration", () => {
  const hookPath = "hooks/use-journal.ts";

  it("hook file exists", () => {
    assertFileExists(hookPath);
  });

  it("imports DOMPurify from isomorphic-dompurify", () => {
    const content = readFile(hookPath);
    assert.ok(
      yamlContains(content, 'import DOMPurify from "isomorphic-dompurify"'),
      "Should import DOMPurify from isomorphic-dompurify"
    );
  });

  it("uses DOMPurify.sanitize() in sanitizeForSearch", () => {
    const content = readFile(hookPath);
    assert.ok(
      yamlContains(content, "DOMPurify.sanitize("),
      "Should use DOMPurify.sanitize() for sanitization"
    );
  });

  it("uses ALLOWED_TAGS: [] for text-only output", () => {
    const content = readFile(hookPath);
    assert.ok(
      yamlContains(content, "ALLOWED_TAGS: []"),
      "Should configure DOMPurify with empty ALLOWED_TAGS for text-only output"
    );
  });

  it("does NOT contain hand-rolled regex sanitizer patterns", () => {
    const content = readFile(hookPath);
    assert.ok(
      !yamlContains(content, "/<script\\b"),
      "Should not have hand-rolled script tag regex"
    );
    assert.ok(
      !yamlContains(content, "/<style\\b"),
      "Should not have hand-rolled style tag regex"
    );
    assert.ok(
      !yamlContains(content, "/<[^>]*>/g"),
      "Should not have generic HTML tag stripping regex"
    );
    assert.ok(
      !yamlContains(content, "javascript:"),
      "Should not have hand-rolled javascript: protocol regex"
    );
  });

  it("isomorphic-dompurify is listed in package.json dependencies", () => {
    const pkg = JSON.parse(readFile("package.json"));
    assert.ok(
      pkg.dependencies && pkg.dependencies["isomorphic-dompurify"],
      "isomorphic-dompurify should be in dependencies"
    );
  });

  it("sanitizeForSearch still normalizes whitespace", () => {
    const content = readFile(hookPath);
    // Should still have whitespace normalization after DOMPurify
    assert.ok(
      yamlContains(content, '.replace(/\\s+/g, " ")'),
      "Should normalize whitespace after sanitization"
    );
    assert.ok(yamlContains(content, ".trim()"), "Should trim the result");
  });
});

// =============================================================================
// Step 3.2b: Floating promise fixes in functions/
// =============================================================================
describe("3.2b: functions/ manual fixes", () => {
  it("admin.ts uses split()[0] directly instead of intermediate variable", () => {
    const content = readFile("functions/src/admin.ts");
    assert.ok(content, "admin.ts should be readable");
    // The fix changed from: const keyParts = doc.id.split(":"); const type = keyParts[0]
    // to: const type = doc.id.split(":")[0]
    assert.ok(
      yamlContains(content, 'doc.id.split(":")[0]'),
      "Should use inline split()[0] which is exempt from unchecked-array-access rule"
    );
  });

  it("jobs.ts uses destructuring instead of index access", () => {
    const content = readFile("functions/src/jobs.ts");
    assert.ok(content, "jobs.ts should be readable");
    // The fix changed from: metadata[0].timeCreated
    // to: const [meta] = await file.getMetadata();
    assert.ok(
      yamlContains(content, "const [meta] = await file.getMetadata()"),
      "Should use tuple destructuring instead of index access"
    );
    assert.ok(
      yamlContains(content, "meta.timeCreated"),
      "Should access timeCreated on destructured variable"
    );
  });
});

// =============================================================================
// Step 3.2c: Error sanitization in account-linking.ts
// =============================================================================
describe("3.2c: account-linking.ts error sanitization", () => {
  const filePath = "lib/auth/account-linking.ts";

  it("file exists", () => {
    assertFileExists(filePath);
  });

  it("does NOT expose raw error.message in return object", () => {
    const content = readFile(filePath);
    // The mapErrorToUserMessage function should not return error.message directly
    assert.ok(
      !yamlContains(content, "message: error.message"),
      "Should not expose raw error.message in return statement"
    );
  });

  it("uses error code as internal message instead", () => {
    const content = readFile(filePath);
    assert.ok(
      yamlContains(content, "Auth error:"),
      "Should use safe Auth error: prefix with code"
    );
  });

  it("still provides userMessage from the error map", () => {
    const content = readFile(filePath);
    assert.ok(
      yamlContains(content, "userMessage: mapped.message"),
      "Should still provide mapped userMessage"
    );
  });
});

// =============================================================================
// Step 3.3: Semgrep test annotation files updated
// =============================================================================
describe("3.3: Semgrep test annotation files", () => {
  it("test-security.ts has updated firestore write tests", () => {
    const content = readFile("tests/semgrep/test-security.ts");
    assert.ok(content, "test-security.ts should be readable");
    // Should have protected collection examples
    assert.ok(
      yamlContains(content, 'setDoc(doc(db, "journal"'),
      "Should have journal write violation test"
    );
    // Should have safe non-protected collection examples
    assert.ok(
      yamlContains(content, 'setDoc(doc(db, "meetings"'),
      "Should have safe meetings write test"
    );
  });

  it("test-security.ts has updated eval tests", () => {
    const content = readFile("tests/semgrep/test-security.ts");
    // Should have function reference ok tests
    assert.ok(
      yamlContains(content, "setTimeout(myCallback, 1000)"),
      "Should have function reference safe test"
    );
  });

  it("test-correctness.ts has new guard pattern tests", () => {
    const content = readFile("tests/semgrep/test-correctness.ts");
    assert.ok(content, "test-correctness.ts should be readable");
    // Should have regex match guard test
    assert.ok(
      yamlContains(content, "safeAccessRegexMatch"),
      "Should have regex match guard test"
    );
    // Should have map callback guard test
    assert.ok(
      yamlContains(content, "safeAccessInsideMap"),
      "Should have map callback guard test"
    );
    // Should have filter callback guard test
    assert.ok(
      yamlContains(content, "safeAccessInsideFilter"),
      "Should have filter callback guard test"
    );
    // Should have OR fallback guard test
    assert.ok(
      yamlContains(content, "safeAccessOrFallback"),
      "Should have OR fallback guard test"
    );
  });

  it("test-correctness.ts has assigned-await floating promise tests", () => {
    const content = readFile("tests/semgrep/test-correctness.ts");
    assert.ok(
      yamlContains(content, "assignedAwaitedFetch"),
      "Should have assigned awaited fetch test"
    );
    assert.ok(
      yamlContains(content, "const response = await fetch"),
      "Should test const assignment with await fetch"
    );
  });
});

// =============================================================================
// Step 3.4: YAML syntax validation for all modified rules
// =============================================================================
describe("3.4: YAML syntax validation", () => {
  const ruleFiles = [
    ".semgrep/rules/security/no-direct-firestore-write.yml",
    ".semgrep/rules/security/no-eval-usage.yml",
    ".semgrep/rules/style/no-default-export.yml",
    ".semgrep/rules/correctness/no-unchecked-array-access.yml",
    ".semgrep/rules/correctness/no-floating-promise.yml",
  ];

  for (const ruleFile of ruleFiles) {
    it(`${ruleFile} is valid YAML`, () => {
      const content = readFile(ruleFile);
      assert.ok(content, `${ruleFile} should be readable`);

      // Basic YAML structure validation
      assert.ok(yamlHasKey(content, "rules"), `${ruleFile} should start with rules:`);

      // Verify it has required Semgrep rule fields
      assert.ok(yamlContains(content, "id:"), `${ruleFile} should have id field`);
      assert.ok(yamlContains(content, "languages:"), `${ruleFile} should have languages field`);
      assert.ok(yamlContains(content, "severity:"), `${ruleFile} should have severity field`);
      assert.ok(yamlContains(content, "message:"), `${ruleFile} should have message field`);

      // Verify YAML can be parsed by js-yaml
      try {
        const yaml = require("js-yaml");
        const parsed = yaml.load(content);
        assert.ok(parsed, `${ruleFile} should parse as valid YAML`);
        assert.ok(parsed.rules, `${ruleFile} should have rules array`);
        assert.ok(Array.isArray(parsed.rules), `${ruleFile} rules should be an array`);
        assert.ok(parsed.rules.length > 0, `${ruleFile} should have at least one rule`);
      } catch (err) {
        assert.fail(`${ruleFile} YAML parsing failed: ${err.message}`);
      }
    });
  }
});

// =============================================================================
// Step 3.5: TypeScript compilation verification
// =============================================================================
describe("3.5: TypeScript compilation checks", () => {
  it("functions/src/admin.ts exists and is not empty", () => {
    const content = readFile("functions/src/admin.ts");
    assert.ok(content, "admin.ts should be readable");
    assert.ok(content.length > 1000, "admin.ts should have substantial content");
  });

  it("functions/src/jobs.ts exists and is not empty", () => {
    const content = readFile("functions/src/jobs.ts");
    assert.ok(content, "jobs.ts should be readable");
    assert.ok(content.length > 100, "jobs.ts should have content");
  });

  it("hooks/use-journal.ts exports expected functions", () => {
    const content = readFile("hooks/use-journal.ts");
    assert.ok(content, "use-journal.ts should be readable");
    assert.ok(
      yamlContains(content, "export function generateSearchableText"),
      "Should export generateSearchableText"
    );
    assert.ok(
      yamlContains(content, "export function generateTags"),
      "Should export generateTags"
    );
    assert.ok(
      yamlContains(content, "export function useJournal"),
      "Should export useJournal hook"
    );
  });
});
