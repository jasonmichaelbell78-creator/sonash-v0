/**
 * Pattern Compliance Test Suite
 *
 * Tests that ANTI_PATTERNS regex/testFn patterns correctly detect violations
 * and do NOT false-positive on clean code.
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
// Critical Severity Patterns
// ═══════════════════════════════════════════════════

describe("Pattern: eval-usage [critical]", () => {
  const pattern = /\beval\s*\(/g;

  test("detects eval() usage", () => {
    testPattern(pattern, ["eval('alert(1)')"], []);
  });

  test("allows clean code", () => {
    testPattern(pattern, [], ["const evaluate = fn();", "evaluation(x)"]);
  });
});

describe("Pattern: unsafe-innerhtml [critical]", () => {
  const pattern = /\.innerHTML\s*=/g;

  test("detects innerHTML assignment", () => {
    testPattern(pattern, ['el.innerHTML = "<b>hi</b>"', "node.innerHTML = userInput"], []);
  });

  test("allows safe alternatives", () => {
    testPattern(pattern, [], ['el.textContent = "safe"', "el.innerText = value"]);
  });
});

describe("Pattern: hardcoded-api-key [critical]", () => {
  const pattern =
    /\b(?:api[_-]?key|apikey|secret|password|token)\b\s*[:=]\s*['"`][A-Z0-9_/+=-]{20,}['"`]/gi;

  test("detects hardcoded secrets", () => {
    testPattern(
      pattern,
      [
        'const api_key = "AKIAIOSFODNN7EXAMPLE12345"',
        'const secret = "abcdefghijklmnopqrstuvwxyz1234567890"',
      ],
      []
    );
  });

  test("allows env vars and placeholders", () => {
    testPattern(pattern, [], ["const key = process.env.API_KEY", 'const token = "short"']);
  });
});

describe("Pattern: sql-injection-risk [critical]", () => {
  const pattern =
    /(?:query|exec|execute|prepare|run|all|get)\s*\(\s*(?:`[^`]*\$\{|'[^']*\+\s*|"[^"]*\+\s*)/g;

  test("detects interpolation in queries", () => {
    testPattern(pattern, ["db.query(`SELECT * FROM users WHERE id = ${userId}`)"], []);
  });

  test("allows parameterized queries", () => {
    testPattern(
      pattern,
      [],
      ['db.query("SELECT * FROM users WHERE id = ?", [userId])', 'db.execute("SELECT 1")']
    );
  });
});

describe("Pattern: shell-command-injection [critical]", () => {
  const pattern = /exec(?:Sync)?\s*\(\s*(?:`[^`]*\$\{|['"`][^'"]*['"`]\s*\+\s*(?!['"`]))/g;

  test("detects interpolated shell commands", () => {
    testPattern(pattern, ["execSync(`git add ${file}`)", 'exec("rm " + userInput)'], []);
  });

  test("allows safe exec patterns", () => {
    testPattern(pattern, [], ['execFileSync("git", ["add", file])', 'execSync("git status")']);
  });
});

describe("Pattern: path-startswith [critical]", () => {
  const pattern = /\.startsWith\s*\(\s*['"`][./\\]+['"`]\s*\)/g;

  test("detects startsWith for path validation", () => {
    testPattern(
      pattern,
      ['filePath.startsWith("./")', 'rel.startsWith("..")', 'p.startsWith("/")'],
      []
    );
  });

  test("allows non-path startsWith", () => {
    testPattern(pattern, [], ['name.startsWith("hello")', 'str.startsWith("prefix")']);
  });
});

describe("Pattern: unsafe-error-message [critical]", () => {
  const pattern = /catch\s*\(\s*(\w+)\s*\)\s*\{(?![^}]*instanceof\s+Error)[^}]*?\b\1\b\.message/g;

  test("detects unsafe error.message", () => {
    testPattern(pattern, ["catch (err) { console.log(err.message) }"], []);
  });

  test("allows instanceof-guarded access", () => {
    testPattern(
      pattern,
      [],
      ["catch (err) { if (err instanceof Error) console.log(err.message) }"]
    );
  });
});

// ═══════════════════════════════════════════════════
// High Severity Patterns
// ═══════════════════════════════════════════════════

describe("Pattern: exec-without-global [high]", () => {
  const pattern = /while\s*\(\s*\(\s*\w+\s*=\s*(?:\w+)\.exec\s*\([^)]+\)\s*\)/g;

  test("detects exec in while loop", () => {
    testPattern(pattern, ["while ((match = regex.exec(content)) !== null)"], []);
  });
});

describe("Pattern: test-mock-firestore-directly [high]", () => {
  const pattern = /(?:vi|jest)\.mock\s*\(\s*['"`]firebase\/firestore['"`]/g;

  test("detects direct firestore mocking", () => {
    testPattern(pattern, ['vi.mock("firebase/firestore")', "jest.mock('firebase/firestore')"], []);
  });

  test("allows functions mocking", () => {
    testPattern(pattern, [], ['vi.mock("firebase/functions")', 'jest.mock("firebase/auth")']);
  });
});

describe("Pattern: unstable-list-key [high]", () => {
  const pattern = /key=\{[^}]*\bindex\b[^}]*\}/g;

  test("detects index as key", () => {
    testPattern(pattern, ["<li key={index}>", "<Item key={i + index} />"], []);
  });

  test("allows stable keys", () => {
    testPattern(pattern, [], ["<li key={item.id}>", "<Item key={item.canonId} />"]);
  });
});

describe("Pattern: hallucinated-apis [high]", () => {
  const pattern =
    /crypto\.secureHash\(|firebase\.verifyAppCheck\(|React\.useServerState\(|next\.getServerAuth\(|firestore\.atomicUpdate\(/g;

  test("detects non-existent APIs", () => {
    testPattern(
      pattern,
      ["crypto.secureHash(data)", "React.useServerState()", "firestore.atomicUpdate(doc)"],
      []
    );
  });

  test("allows real APIs", () => {
    testPattern(
      pattern,
      [],
      ["crypto.createHash('sha256')", "React.useState()", "firestore.doc('users/123')"]
    );
  });
});

// ═══════════════════════════════════════════════════
// Medium Severity Patterns (style/quality)
// ═══════════════════════════════════════════════════

describe("Pattern: trivial-assertions [medium]", () => {
  const pattern =
    /expect\(true\)\.toBe\(true\)|expect\(1\)\.toBe\(1\)|expect\(false\)\.toBe\(false\)|assert\.ok\(true\)|assert\.equal\(1,\s*1\)/g;

  test("detects trivial tests", () => {
    testPattern(pattern, ["expect(true).toBe(true)", "expect(1).toBe(1)", "assert.ok(true)"], []);
  });

  test("allows meaningful assertions", () => {
    testPattern(
      pattern,
      [],
      ["expect(result).toBe(true)", "expect(count).toBe(1)", "assert.ok(isValid)"]
    );
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
    // This was the #2 FP pattern (24 exclusions) - now removed from patterns
    // Verify the silent-catch-block pattern doesn't FP on intentional empty catches
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
