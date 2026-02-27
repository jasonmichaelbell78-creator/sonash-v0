/**
 * Pattern Compliance Test Suite
 *
 * Tests that ANTI_PATTERNS regex/testFn patterns correctly detect violations
 * and do NOT false-positive on clean code.
 *
 * NOTE: Many patterns have been migrated to ESLint AST-based rules in
 * eslint-plugin-sonash (v3.0). See tests/eslint-plugin-sonash.test.js for
 * those tests. This file only tests patterns that remain in the regex checker.
 *
 * Migrated to ESLint (tests moved to eslint-plugin-sonash.test.js):
 * - eval-usage → no-eval, unsafe-innerhtml → no-unsafe-innerhtml
 * - hardcoded-api-key → no-hardcoded-secrets, sql-injection-risk → no-sql-injection
 * - shell-command-injection → no-shell-injection, path-startswith → no-path-startswith
 * - unsafe-error-message → no-unsafe-error-access, test-mock-firestore → no-test-mock-firestore
 * - unstable-list-key → no-index-key, hallucinated-apis → no-hallucinated-api
 * - trivial-assertions → no-trivial-assertions
 *
 * Run: npm run test:patterns
 */

import { describe, test, expect } from "vitest";

/**
 * Helper: test a regex pattern against code snippets
 * @param {RegExp} pattern - The pattern to test
 * @param {string[]} shouldMatch - Code that SHOULD trigger the pattern
 * @param {string[]} shouldNotMatch - Code that should NOT trigger the pattern
 */
function testPattern(pattern, shouldMatch, shouldNotMatch) {
  for (const code of shouldMatch) {
    const re = new RegExp(pattern.source, pattern.flags);
    expect(re.test(code), `Expected pattern to match: ${code.slice(0, 80)}`).toBe(true);
  }
  for (const code of shouldNotMatch) {
    const re = new RegExp(pattern.source, pattern.flags);
    expect(re.test(code), `Expected pattern NOT to match: ${code.slice(0, 80)}`).toBe(false);
  }
}

// ═══════════════════════════════════════════════════
// Active Regex Patterns (still in check-pattern-compliance.js)
// ═══════════════════════════════════════════════════

describe("Pattern: exec-without-global [high]", () => {
  const pattern = /while\s*\(\s*\(\s*\w+\s*=\s*(?:\w+)\.exec\s*\([^)]+\)\s*\)/g;

  test("detects exec in while loop", () => {
    testPattern(pattern, ["while ((match = regex.exec(content)) !== null)"], []);
  });
});

describe("Pattern: ai-todo-markers [medium]", () => {
  const pattern = /(?:TODO|FIXME)[^A-Z]*(?:AI|claude|LLM|GPT)|AI should fix|Claude will/gi;

  test("detects AI-related TODOs", () => {
    testPattern(
      pattern,
      [
        "// TODO: Claude should fix this",
        "// FIXME: AI needs to handle this",
        "// AI should fix this later",
      ],
      []
    );
  });

  test("allows normal TODOs", () => {
    testPattern(
      pattern,
      [],
      ["// TODO(PROJ-123): Fix the auth flow", "// FIXME[jason]: Handle edge case"]
    );
  });
});

describe("Pattern: overconfident-security [medium]", () => {
  const pattern =
    /(?:this is secure|security guaranteed|fully protected|completely safe|no vulnerabilities|unhackable)/gi;

  test("detects overconfident claims", () => {
    testPattern(
      pattern,
      [
        "// This is secure because we use HTTPS",
        "// Security guaranteed by our firewall",
        "// completely safe from XSS",
      ],
      []
    );
  });

  test("allows specific security notes", () => {
    testPattern(
      pattern,
      [],
      [
        "// Uses CSP headers to prevent XSS",
        "// Rate limited to 100 req/min",
        "// Input sanitized with DOMPurify",
      ]
    );
  });
});

describe("Pattern: exit-code-capture [high]", () => {
  const pattern = /\$\([^)]{1,500}\)\s*;\s*if\s+\[\s*\$\?\s/g;

  test("detects $? after assignment", () => {
    testPattern(pattern, ['OUT=$(some_command); if [ $? -ne 0 ]; then echo "fail"; fi'], []);
  });

  test("allows correct patterns", () => {
    testPattern(pattern, [], ['if ! OUT=$(some_command); then echo "fail"; fi']);
  });
});

describe("Pattern: npm-install-automation [high]", () => {
  const pattern = /npm\s+install\b[^\n]*/g;

  test("detects npm install in scripts", () => {
    testPattern(pattern, ["npm install express"], []);
  });

  test("allows npm ci", () => {
    testPattern(pattern, [], ["npm ci"]);
  });
});

describe("Pattern: regex-global-test-loop [high]", () => {
  const pattern =
    /new\s+RegExp\s*\([^)]{1,500},\s*['"`][^'"]{0,200}g[^'"]{0,200}['"`]\s*\)[\s\S]{0,200}\.test\s*\(/g;

  test("detects global regex with .test() in loop", () => {
    testPattern(pattern, ["new RegExp('pattern', 'g'); regex.test(str)"], []);
  });
});

describe("Pattern: unsanitized-error-response [critical]", () => {
  const pattern =
    /res\.(?:json|send|status\s*\([^)]*\)\s*\.json)\s*\(\s*\{[\s\S]{0,300}?(?:error|err|e|exception)\.(?:message|stack|toString\s*\()/g;

  test("detects raw error in response", () => {
    testPattern(pattern, ["res.json({ error: err.message })"], []);
  });

  test("allows sanitized responses", () => {
    testPattern(pattern, [], ['res.json({ error: "An error occurred" })']);
  });
});

describe("Pattern: naive-data-fetch [high]", () => {
  const pattern =
    /(?:\.get\(\)\.then\([^)]{0,100}\.filter\(|getDocs\([^)]{0,100}\)[^;]{0,100}\.filter\()/g;

  test("detects fetch-all-then-filter", () => {
    testPattern(pattern, [".get().then(docs => docs.filter(d => d.type === 'active'))"], []);
  });
});

// ═══════════════════════════════════════════════════
// Phase 1 Compliance Patterns (Session #192)
// ═══════════════════════════════════════════════════

describe("Pattern: no-raw-fs-write [medium]", () => {
  // Matches the regex from check-pattern-compliance.js
  const pattern = /(?:fs\.(?:writeFileSync|appendFileSync|renameSync)\s*\()/g;

  test("detects fs.writeFileSync(", () => {
    testPattern(
      pattern,
      [
        'fs.writeFileSync(filePath, data, "utf-8")',
        "fs.writeFileSync(output, JSON.stringify(obj))",
      ],
      []
    );
  });

  test("detects fs.appendFileSync(", () => {
    testPattern(pattern, [String.raw`fs.appendFileSync(logFile, line + "\n")`], []);
  });

  test("detects fs.renameSync(", () => {
    testPattern(pattern, ["fs.renameSync(tmpPath, finalPath)"], []);
  });

  test("detects destructured writeFileSync(", () => {
    testPattern(
      pattern,
      [
        'writeFileSync(filePath, data, "utf-8")',
        "appendFileSync(logFile, line)",
        "renameSync(tmpPath, finalPath)",
      ],
      []
    );
  });

  test("does NOT flag safeWriteFileSync(", () => {
    testPattern(
      pattern,
      [],
      [
        'safeWriteFileSync(filePath, data, "utf-8")',
        "safeWriteFileSync(output, JSON.stringify(obj))",
      ]
    );
  });

  test("does NOT flag safeAppendFileSync(", () => {
    testPattern(pattern, [], [String.raw`safeAppendFileSync(logFile, line + "\n")`]);
  });

  test("does NOT flag safeRenameSync(", () => {
    testPattern(pattern, [], ["safeRenameSync(tmpPath, finalPath)"]);
  });

  test("does NOT flag readFileSync or other read operations", () => {
    testPattern(
      pattern,
      [],
      [
        'fs.readFileSync(filePath, "utf-8")',
        "fs.existsSync(filePath)",
        "fs.mkdirSync(dir, { recursive: true })",
        "fs.unlinkSync(tmpFile)",
        "fs.copyFileSync(src, dest)",
      ]
    );
  });
});

// ═══════════════════════════════════════════════════
// Known False Positive Cases (regression tests)
// These caused the pre-commit disaster and MUST pass
// ═══════════════════════════════════════════════════

describe("Known FP: readFileSync inside try/catch", () => {
  test("should NOT trigger unsafe-error-message when readFileSync is in try/catch", () => {
    // This was the #1 FP pattern (92 exclusions) - now removed from patterns
    // but we test the error-message pattern doesn't match proper error handling
    const pattern = /catch\s*\(\s*(\w+)\s*\)\s*\{(?![^}]*instanceof\s+Error)[^}]*?\b\1\b\.message/g;
    const code = `
try {
  const data = readFileSync(file, 'utf-8');
} catch (err) {
  if (err instanceof Error) {
    console.error(err.message);
  }
}`;
    const re = new RegExp(pattern.source, pattern.flags);
    expect(re.test(code)).toBe(false);
  });
});

describe("Known FP: JSON.parse inside try/catch", () => {
  test("should NOT trigger when properly wrapped in try/catch", () => {
    const silentCatch = /catch\s*\(\w*\)\s*\{\}/g;
    const code = `
try {
  JSON.parse(data);
} catch (err) {
  console.warn('Invalid JSON:', err instanceof Error ? err.message : String(err));
}`;
    const re = new RegExp(silentCatch.source, silentCatch.flags);
    expect(re.test(code)).toBe(false);
  });

  test("SHOULD trigger on truly empty catch", () => {
    const silentCatch = /catch\s*\(\w*\)\s*\{\}/g;
    const code = "try { JSON.parse(x); } catch (e) {}";
    const re = new RegExp(silentCatch.source, silentCatch.flags);
    expect(re.test(code)).toBe(true);
  });
});
