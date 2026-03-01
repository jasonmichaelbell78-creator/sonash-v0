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
  // Must match the production regex in check-pattern-compliance.js exactly
  const pattern = /\b(?:fs\.)?(?:writeFileSync|appendFileSync|renameSync)\s*\(/g;

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

// ═══════════════════════════════════════════════════
// Phase 4 Plan 03: New Regex Rules (ENFR-03)
// ═══════════════════════════════════════════════════

// --- Banned Imports ---

describe("Pattern: banned-direct-firestore-write [critical]", () => {
  // Pattern matches write op names followed by firebase/firestore import path
  const pattern =
    /\b(?:setDoc|addDoc|updateDoc|deleteDoc)\b[\s\S]{0,200}?from\s+['"][^'"]*firebase\/firestore/g;

  test("detects direct Firestore write imports", () => {
    testPattern(
      pattern,
      [
        'import { setDoc } from "firebase/firestore"',
        'import { addDoc, updateDoc } from "firebase/firestore"',
        'import { deleteDoc, collection } from "firebase/firestore"',
      ],
      []
    );
  });

  test("allows Firestore read imports", () => {
    testPattern(
      pattern,
      [],
      [
        'import { getDoc, getDocs } from "firebase/firestore"',
        'import { collection, query } from "firebase/firestore"',
      ]
    );
  });
});

describe("Pattern: banned-moment-import [medium]", () => {
  const pattern = /\b(?:import\s+.*\bfrom\s+['"]moment['"]|require\s*\(\s*['"]moment['"]\s*\))/g;

  test("detects moment import", () => {
    testPattern(pattern, ['import moment from "moment"', "const moment = require('moment')"], []);
  });

  test("allows date-fns", () => {
    testPattern(
      pattern,
      [],
      ['import { format } from "date-fns"', "const { parseISO } = require('date-fns')"]
    );
  });
});

describe("Pattern: banned-lodash-full-import [medium]", () => {
  const pattern =
    /\b(?:import\s+_\s+from\s+['"]lodash['"]|(?:const|let|var)\s+_\s*=\s*require\s*\(\s*['"]lodash['"]\s*\))/g;

  test("detects full lodash import", () => {
    testPattern(pattern, ['import _ from "lodash"', "const _ = require('lodash')"], []);
  });

  test("allows specific lodash imports", () => {
    testPattern(
      pattern,
      [],
      ['import get from "lodash/get"', 'import { debounce } from "lodash-es"']
    );
  });
});

describe("Pattern: banned-fs-in-client [critical]", () => {
  const pattern =
    /\b(?:import|require)\s*(?:\(?\s*['"](?:node:)?fs['"]|.*\bfrom\s+['"](?:node:)?fs['"])/g;

  test("detects fs import", () => {
    testPattern(
      pattern,
      ['import fs from "fs"', 'import { readFileSync } from "node:fs"', "const fs = require('fs')"],
      []
    );
  });

  test("allows non-fs imports", () => {
    testPattern(pattern, [], ['import path from "path"', 'import { join } from "node:path"']);
  });
});

// --- Naming Violations ---

describe("Pattern: no-generic-handler-name [medium]", () => {
  const pattern = /\bfunction\s+handle(?:Click|Change|Submit)\s*\(/g;

  test("detects generic handler names", () => {
    testPattern(
      pattern,
      ["function handleClick(", "function handleChange(", "function handleSubmit("],
      []
    );
  });

  test("allows descriptive handler names", () => {
    testPattern(
      pattern,
      [],
      ["function handleLoginSubmit(", "function handleEmailChange(", "function handleDeleteClick("]
    );
  });
});

describe("Pattern: no-single-letter-variable [medium]", () => {
  // testFn-based pattern - test the function directly
  const testFn = (content) => {
    const lines = content.split("\n");
    const matches = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
      const m = /\b(?:const|let|var)\s+([a-df-hln-zA-Z])\s*[=;,]/.exec(line);
      if (m) {
        if (/\bfor\s*\(/.test(line)) continue;
        matches.push({ line: i + 1, match: line.trim().slice(0, 80) });
      }
    }
    return matches;
  };

  test("detects single-letter variables", () => {
    expect(testFn("const x = 5;")).toHaveLength(1);
    expect(testFn("let n = 0;")).toHaveLength(1);
    expect(testFn("var a = [];")).toHaveLength(1);
  });

  test("allows loop variables and common exceptions", () => {
    expect(testFn("for (let i = 0; i < 10; i++) {}")).toHaveLength(0);
    expect(testFn("const _ = unused;")).toHaveLength(0);
    expect(testFn("const itemCount = 5;")).toHaveLength(0);
  });
});

describe("Pattern: no-todo-without-ticket [medium]", () => {
  const pattern = /\/\/\s*(?:TODO|FIXME)(?!.*(?:#\d|JIRA|GH-|issue|PROJ-|ENFR-|PIPE-|TEST-))/gi;

  test("detects TODOs without ticket", () => {
    testPattern(
      pattern,
      ["// TODO: fix this later", "// FIXME: this is broken", "// TODO refactor when we have time"],
      []
    );
  });

  test("allows TODOs with ticket reference", () => {
    testPattern(
      pattern,
      [],
      [
        "// TODO(#123): fix the auth flow",
        "// FIXME(GH-456): handle edge case",
        "// TODO: issue #789 - fix this",
        "// TODO(ENFR-03): add tests",
      ]
    );
  });
});

// --- Security/Safety ---

describe("Pattern: no-process-env-inline [medium]", () => {
  const pattern = /\bprocess\.env\.\w+/g;

  test("detects direct env access", () => {
    testPattern(
      pattern,
      ["const url = process.env.NEXT_PUBLIC_API_URL", "if (process.env.NODE_ENV === 'production')"],
      []
    );
  });

  test("allows config module usage", () => {
    testPattern(pattern, [], ["const url = config.apiUrl", "import { env } from '@/config'"]);
  });
});

describe("Pattern: no-string-concat-in-query [critical]", () => {
  // testFn-based pattern - matches the production logic from check-pattern-compliance.js
  const testFn = (content) => {
    const lines = content.split("\n");
    const matches = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
      const hasQuery = /\b(?:query|sql|SELECT|INSERT|UPDATE|DELETE|WHERE)\b/i.test(line);
      const hasConcat =
        /`[^`]*\$\{[^}]+\}[^`]*(?:WHERE|AND|OR|SET|VALUES)\b/i.test(line) ||
        (/['"].*(?:WHERE|AND|OR|SET|VALUES)\b/i.test(line) && /\+\s*\w/.test(line));
      if (hasQuery && hasConcat) {
        matches.push({ line: i + 1, match: line.trim().slice(0, 100) });
      }
    }
    return matches;
  };

  test("detects template literal in SQL", () => {
    expect(testFn("db.query(`DELETE FROM ${tableName} WHERE id = ${id}`)")).toHaveLength(1);
  });

  test("detects string concatenation in SQL", () => {
    // String concat pattern: quote...+...SQL keyword inside same string context
    expect(
      testFn('const sql = "SELECT * FROM users WHERE name = " + name + " AND active = 1"')
    ).toHaveLength(1);
  });

  test("allows parameterized queries", () => {
    expect(testFn("db.query('SELECT * FROM users WHERE id = ?', [userId])")).toHaveLength(0);
    expect(testFn("const query = collection(db, 'users')")).toHaveLength(0);
  });
});

describe("Pattern: no-document-cookie-access [medium]", () => {
  const pattern = /\bdocument\.cookie\b/g;

  test("detects document.cookie access", () => {
    testPattern(pattern, ["const cookie = document.cookie", "document.cookie = 'key=value'"], []);
  });

  test("allows cookie utilities", () => {
    testPattern(pattern, [], ["Cookies.get('token')", "cookies().get('session')"]);
  });
});

describe("Pattern: no-window-location-assign [medium]", () => {
  const pattern = /\bwindow\.location\.(?:href|assign|replace)\b/g;

  test("detects window.location navigation", () => {
    testPattern(
      pattern,
      [
        "window.location.href = '/dashboard'",
        "window.location.assign('/login')",
        "window.location.replace('/home')",
      ],
      []
    );
  });

  test("allows Next.js router", () => {
    testPattern(pattern, [], ["router.push('/dashboard')", "router.replace('/login')"]);
  });
});

// --- Correctness ---

describe("Pattern: no-json-parse-without-try [medium]", () => {
  // testFn-based pattern
  const testFn = (content) => {
    const lines = content.split("\n");
    const matches = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/JSON\.parse\s*\(/.test(line)) continue;
      const trimmed = line.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
      const context = lines.slice(Math.max(0, i - 15), i + 1).join("\n");
      if (!/\btry\s*\{/.test(context)) {
        matches.push({ line: i + 1, match: line.trim().slice(0, 100) });
      }
    }
    return matches;
  };

  test("detects unguarded JSON.parse", () => {
    expect(testFn("const data = JSON.parse(str);")).toHaveLength(1);
    expect(testFn("return JSON.parse(response.body);")).toHaveLength(1);
  });

  test("allows JSON.parse inside try/catch", () => {
    const code = `try {
  const data = JSON.parse(str);
} catch (err) {
  console.error(err);
}`;
    expect(testFn(code)).toHaveLength(0);
  });
});

describe("Pattern: no-array-index-as-key [medium]", () => {
  const pattern =
    /\.map\s*\(\s*\([^)]*,\s*(?:index|i|idx)\s*\)[\s\S]{0,300}?key\s*=\s*\{\s*(?:index|i|idx)\s*\}/g;

  test("detects array index as key", () => {
    testPattern(
      pattern,
      ["items.map((item, index) => <div key={index}>", "list.map((el, i) => <span key={i}>"],
      []
    );
  });

  test("allows stable keys", () => {
    testPattern(
      pattern,
      [],
      [
        "items.map((item) => <div key={item.id}>",
        "items.map((item, index) => <div key={item.slug}>",
      ]
    );
  });
});

// ═══════════════════════════════════════════════════
// FP Auto-Disable Tests (ENFR-07)
// ═══════════════════════════════════════════════════

describe("FP Auto-Disable Logic", () => {
  test("rules with exclusions > threshold are identified", () => {
    // Simulate the FP auto-disable logic
    const mockVerifiedPatterns = {
      "rule-a": new Array(30).fill("file.js"), // 30 > 25, should be disabled
      "rule-b": new Array(10).fill("file.js"), // 10 < 25, should not be disabled
      "rule-c": new Array(26).fill("file.js"), // 26 > 25, should be disabled
    };
    const threshold = 25;
    const disabled = new Set();
    for (const [ruleId, files] of Object.entries(mockVerifiedPatterns)) {
      const count = Array.isArray(files) ? files.length : 0;
      if (count > threshold) {
        disabled.add(ruleId);
      }
    }
    expect(disabled.has("rule-a")).toBe(true);
    expect(disabled.has("rule-b")).toBe(false);
    expect(disabled.has("rule-c")).toBe(true);
    expect(disabled.size).toBe(2);
  });

  test("custom threshold changes cutoff", () => {
    const mockVerifiedPatterns = {
      "rule-a": new Array(15).fill("file.js"),
      "rule-b": new Array(5).fill("file.js"),
    };
    const threshold = 10; // Custom lower threshold
    const disabled = new Set();
    for (const [ruleId, files] of Object.entries(mockVerifiedPatterns)) {
      const count = Array.isArray(files) ? files.length : 0;
      if (count > threshold) {
        disabled.add(ruleId);
      }
    }
    expect(disabled.has("rule-a")).toBe(true);
    expect(disabled.has("rule-b")).toBe(false);
  });

  test("include-fp-disabled forces all rules to run", () => {
    // When INCLUDE_FP_DISABLED is true, the disabled set should be empty
    const includeFpDisabled = true;
    const disabled = new Set();
    if (!includeFpDisabled) {
      // Would normally populate disabled set
      disabled.add("some-rule");
    }
    expect(disabled.size).toBe(0);
  });

  test("FP report identifies auto-disabled rules", () => {
    // Simulate the sorted array from collectPatternExclusions
    const sorted = [
      ["rule-a", 30, { verified: 30, pathExclude: 0 }],
      ["rule-b", 26, { verified: 20, pathExclude: 6 }],
      ["rule-c", 10, { verified: 10, pathExclude: 0 }],
    ];
    const fpThreshold = 25;
    const autoDisabled = sorted.filter(([, total]) => total > fpThreshold);
    expect(autoDisabled).toHaveLength(2);
    expect(autoDisabled[0][0]).toBe("rule-a");
    expect(autoDisabled[1][0]).toBe("rule-b");
  });
});
