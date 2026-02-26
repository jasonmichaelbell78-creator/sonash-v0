/**
 * ESLint Plugin SoNash Test Suite
 *
 * Tests all custom ESLint rules in eslint-plugin-sonash using ESLint's RuleTester.
 * Covers both Phase 1 (v2.0) and Phase 2 (v3.0) rules.
 *
 * Run: npx vitest run tests/eslint-plugin-sonash.test.js
 */

import { describe, test } from "vitest";
import { RuleTester } from "eslint";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const plugin = require("../eslint-plugin-sonash/index.js");

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

const jsxRuleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

// ═══════════════════════════════════════════════════
// Phase 1 Rules (v2.0) — existing rules
// ═══════════════════════════════════════════════════

describe("sonash/no-unsafe-innerhtml", () => {
  test("detects and allows correctly", () => {
    ruleTester.run("no-unsafe-innerhtml", plugin.rules["no-unsafe-innerhtml"], {
      valid: [
        'el.textContent = "safe text"',
        "el.innerText = value",
        "const innerHTML = 'just a variable name'",
      ],
      invalid: [
        {
          code: 'el.innerHTML = "<b>danger</b>"',
          errors: [{ messageId: "unsafeInnerHTML" }],
        },
        {
          code: "node.innerHTML = userInput",
          errors: [{ messageId: "unsafeInnerHTML" }],
        },
      ],
    });
  });
});

describe("sonash/no-catch-console-error", () => {
  test("detects and allows correctly", () => {
    ruleTester.run("no-catch-console-error", plugin.rules["no-catch-console-error"], {
      valid: [
        "promise.catch(e => console.error(sanitizeError(e)))",
        "promise.catch(handleError)",
        "promise.then(console.log)",
      ],
      invalid: [
        {
          code: "promise.catch(console.error)",
          errors: [{ messageId: "catchConsoleError" }],
        },
      ],
    });
  });
});

describe("sonash/no-trivial-assertions", () => {
  test("detects and allows correctly", () => {
    ruleTester.run("no-trivial-assertions", plugin.rules["no-trivial-assertions"], {
      valid: [
        "expect(result).toBe(true)",
        "expect(count).toBe(1)",
        "expect(value).toEqual(expected)",
      ],
      invalid: [
        {
          code: "expect(true).toBe(true)",
          errors: [{ messageId: "trivialAssertion" }],
        },
        {
          code: "expect(1).toEqual(1)",
          errors: [{ messageId: "trivialAssertion" }],
        },
      ],
    });
  });
});

describe("sonash/no-object-assign-json", () => {
  test("detects and allows correctly", () => {
    ruleTester.run("no-object-assign-json", plugin.rules["no-object-assign-json"], {
      valid: [
        "const obj = JSON.parse(data)",
        "Object.assign({}, defaults, overrides)",
        "const copy = { ...parsed }",
      ],
      invalid: [
        {
          code: "Object.assign({}, JSON.parse(data))",
          errors: [{ messageId: "objectAssignJson" }],
        },
      ],
    });
  });
});

describe("sonash/no-hallucinated-api", () => {
  test("detects and allows correctly", () => {
    ruleTester.run("no-hallucinated-api", plugin.rules["no-hallucinated-api"], {
      valid: ["crypto.createHash('sha256')", "React.useState()", "firestore.doc('users/123')"],
      invalid: [
        {
          code: "crypto.secureHash(data)",
          errors: [{ messageId: "hallucinatedAPI" }],
        },
        {
          code: "React.useServerState()",
          errors: [{ messageId: "hallucinatedAPI" }],
        },
      ],
    });
  });
});

// ═══════════════════════════════════════════════════
// Phase 2 Rules (v3.0) — new rules
// ═══════════════════════════════════════════════════

describe("sonash/no-shell-injection", () => {
  test("detects template literal interpolation in exec", () => {
    ruleTester.run("no-shell-injection", plugin.rules["no-shell-injection"], {
      valid: [
        'execFileSync("git", ["add", file])',
        'execSync("git status")',
        'exec("ls -la")',
        'child_process.execFile("cmd", args)',
      ],
      invalid: [
        {
          code: "execSync(`git add ${file}`)",
          errors: [{ messageId: "shellInjection" }],
        },
        {
          code: 'exec("rm " + userInput)',
          errors: [{ messageId: "shellInjection" }],
        },
        {
          code: "child_process.execSync(`command ${arg}`)",
          errors: [{ messageId: "shellInjection" }],
        },
      ],
    });
  });
});

describe("sonash/no-sql-injection", () => {
  test("detects string interpolation in queries", () => {
    ruleTester.run("no-sql-injection", plugin.rules["no-sql-injection"], {
      valid: [
        'db.query("SELECT * FROM users WHERE id = ?", [userId])',
        'db.execute("SELECT 1")',
        'db.prepare("INSERT INTO users VALUES (?, ?)")',
        'db.all("SELECT * FROM logs")',
      ],
      invalid: [
        {
          code: "db.query(`SELECT * FROM users WHERE id = ${userId}`)",
          errors: [{ messageId: "sqlInjection" }],
        },
        {
          code: 'db.execute("SELECT * FROM " + table)',
          errors: [{ messageId: "sqlInjection" }],
        },
        {
          code: "db.prepare(`DELETE FROM ${tableName} WHERE id = ${id}`)",
          errors: [{ messageId: "sqlInjection" }],
        },
      ],
    });
  });
});

describe("sonash/no-index-key", () => {
  test("detects array index as key in JSX", () => {
    jsxRuleTester.run("no-index-key", plugin.rules["no-index-key"], {
      valid: [
        "const el = <li key={item.id}>text</li>",
        "const el = <Item key={item.canonId} />",
        "const el = <div key={uuid}>content</div>",
      ],
      invalid: [
        {
          code: "const el = <li key={index}>text</li>",
          errors: [{ messageId: "indexKey" }],
        },
        {
          code: "const el = <Item key={`item-${index}`} />",
          errors: [{ messageId: "indexKey" }],
        },
        {
          code: 'const el = <div key={"prefix" + index}>content</div>',
          errors: [{ messageId: "indexKey" }],
        },
      ],
    });
  });
});

describe("sonash/no-div-onclick-no-role", () => {
  test("requires role on clickable divs", () => {
    jsxRuleTester.run("no-div-onclick-no-role", plugin.rules["no-div-onclick-no-role"], {
      valid: [
        'const el = <div role="button" onClick={handler}>click</div>',
        "const el = <button onClick={handler}>click</button>",
        "const el = <div className='static'>text</div>",
        'const el = <span onClick={handler} role="link">link</span>',
      ],
      invalid: [
        {
          code: "const el = <div onClick={handler}>click</div>",
          errors: [{ messageId: "missingRole" }],
        },
        {
          code: 'const el = <div className="btn" onClick={fn}>text</div>',
          errors: [{ messageId: "missingRole" }],
        },
      ],
    });
  });
});

describe("sonash/no-path-startswith", () => {
  test("detects path validation with startsWith", () => {
    ruleTester.run("no-path-startswith", plugin.rules["no-path-startswith"], {
      valid: [
        'name.startsWith("hello")',
        'str.startsWith("prefix")',
        'url.startsWith("https")',
        String.raw`const result = /^\\.\\./.test(rel)`,
      ],
      invalid: [
        {
          code: 'filePath.startsWith(".")',
          errors: [{ messageId: "pathStartsWith" }],
        },
        {
          code: 'rel.startsWith("..")',
          errors: [{ messageId: "pathStartsWith" }],
        },
        {
          code: 'p.startsWith("/")',
          errors: [{ messageId: "pathStartsWith" }],
        },
        {
          code: 'p.startsWith("./")',
          errors: [{ messageId: "pathStartsWith" }],
        },
        {
          code: String.raw`p.startsWith("\\")`,
          errors: [{ messageId: "pathStartsWith" }],
        },
      ],
    });
  });
});

describe("sonash/no-hardcoded-secrets", () => {
  test("detects hardcoded API keys and secrets", () => {
    ruleTester.run("no-hardcoded-secrets", plugin.rules["no-hardcoded-secrets"], {
      valid: [
        "const key = process.env.API_KEY",
        'const token = "short"',
        'const api_key = "test_placeholder_value"',
        'const password = "fake_password_for_mock"',
        "const secret = computeSecret()",
      ],
      invalid: [
        {
          code: 'const api_key = "AKIAIOSFODNN7EXAMPLE12345"',
          errors: [{ messageId: "hardcodedSecret" }],
        },
        {
          code: 'const secret = "abcdefghijklmnopqrstuvwxyz1234567890"',
          errors: [{ messageId: "hardcodedSecret" }],
        },
        {
          code: 'const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"',
          errors: [{ messageId: "hardcodedSecret" }],
        },
      ],
    });
  });

  test("detects secrets in object properties", () => {
    ruleTester.run("no-hardcoded-secrets", plugin.rules["no-hardcoded-secrets"], {
      valid: ['const config = { apiUrl: "https://example.com" }'],
      invalid: [
        {
          code: 'const config = { password: "SuperSecretPassword12345" }',
          errors: [{ messageId: "hardcodedSecret" }],
        },
      ],
    });
  });
});

describe("sonash/no-test-mock-firestore", () => {
  test("detects direct firestore mocking", () => {
    ruleTester.run("no-test-mock-firestore", plugin.rules["no-test-mock-firestore"], {
      valid: [
        'vi.mock("firebase/functions")',
        'jest.mock("firebase/auth")',
        'vi.mock("firebase/app")',
        'vi.mock("./my-module")',
      ],
      invalid: [
        {
          code: 'vi.mock("firebase/firestore")',
          errors: [{ messageId: "mockFirestore" }],
        },
        {
          code: 'jest.mock("firebase/firestore")',
          errors: [{ messageId: "mockFirestore" }],
        },
      ],
    });
  });
});

describe("sonash/no-writefile-missing-encoding", () => {
  test("requires encoding parameter", () => {
    ruleTester.run("no-writefile-missing-encoding", plugin.rules["no-writefile-missing-encoding"], {
      valid: [
        'writeFileSync(path, data, "utf-8")',
        'fs.writeFileSync(path, data, { encoding: "utf-8" })',
        "writeFileSync(path, buffer, null)",
      ],
      invalid: [
        {
          code: "writeFileSync(path, data)",
          errors: [{ messageId: "missingEncoding" }],
        },
        {
          code: "fs.writeFileSync(outFile, content)",
          errors: [{ messageId: "missingEncoding" }],
        },
      ],
    });
  });
});

describe("sonash/no-unbounded-regex", () => {
  test("detects unbounded quantifiers in dynamic RegExp", () => {
    ruleTester.run("no-unbounded-regex", plugin.rules["no-unbounded-regex"], {
      valid: [
        'new RegExp("pattern")',
        'new RegExp("a.{0,100}?b")',
        'new RegExp("test.*?end")',
        'new RegExp("lazy.+?match")',
        "/greedy.*/",
      ],
      invalid: [
        {
          code: 'new RegExp("start.*end")',
          errors: [{ messageId: "unboundedRegex" }],
        },
        {
          code: 'new RegExp("prefix.+suffix")',
          errors: [{ messageId: "unboundedRegex" }],
        },
      ],
    });
  });
});

describe("sonash/no-unescaped-regexp-input", () => {
  test("detects variable input in RegExp", () => {
    ruleTester.run("no-unescaped-regexp-input", plugin.rules["no-unescaped-regexp-input"], {
      valid: [
        'new RegExp("literal")',
        "new RegExp(`template`)",
        "new RegExp(/regex/)",
        "const escapedRegex = new RegExp(escapedStr)",
      ],
      invalid: [
        {
          code: "new RegExp(userInput)",
          errors: [{ messageId: "unescapedInput" }],
        },
        {
          code: "new RegExp(config.pattern)",
          errors: [{ messageId: "unescapedInput" }],
        },
      ],
    });
  });
});

describe("sonash/no-unsafe-division", () => {
  test("detects division by potentially-zero variables", () => {
    ruleTester.run("no-unsafe-division", plugin.rules["no-unsafe-division"], {
      valid: [
        "const result = total > 0 ? (count / total) * 100 : 0",
        "const avg = n / 2",
        "const half = x / fixedDivisor",
        "if (total > 0) { const pct = count / total; }",
      ],
      invalid: [
        {
          code: "const pct = count / total",
          errors: [{ messageId: "unsafeDivision" }],
        },
        {
          code: "const avg = sum / count",
          errors: [{ messageId: "unsafeDivision" }],
        },
        {
          code: "const ratio = items / arr.length",
          errors: [{ messageId: "unsafeDivision" }],
        },
      ],
    });
  });
});

describe("sonash/no-unguarded-loadconfig", () => {
  test("requires try/catch around loadConfig", () => {
    ruleTester.run("no-unguarded-loadconfig", plugin.rules["no-unguarded-loadconfig"], {
      valid: [
        'try { loadConfig("verified-patterns"); } catch (e) { console.error(e); }',
        'try { require("./config.js"); } catch (e) { /* fallback */ }',
        'const fs = require("fs")',
        'const path = require("path")',
      ],
      invalid: [
        {
          code: 'loadConfig("verified-patterns")',
          errors: [{ messageId: "unguardedConfig" }],
        },
        {
          code: 'require("./local-config.js")',
          errors: [{ messageId: "unguardedConfig" }],
        },
      ],
    });
  });
});

describe("sonash/no-empty-path-check", () => {
  test("requires empty string check with startsWith('..')", () => {
    ruleTester.run("no-empty-path-check", plugin.rules["no-empty-path-check"], {
      valid: [
        'rel === "" || rel.startsWith("..")',
        'name.startsWith("prefix")',
        'str.startsWith("hello")',
      ],
      invalid: [
        {
          code: 'rel.startsWith("..")',
          errors: [{ messageId: "missingEmptyCheck" }],
        },
      ],
    });
  });
});

describe("sonash/no-non-atomic-write", () => {
  test("requires atomic write pattern", () => {
    ruleTester.run("no-non-atomic-write", plugin.rules["no-non-atomic-write"], {
      valid: [
        // Writing to .tmp suffix file (this IS the atomic pattern)
        'writeFileSync(path + ".tmp", data, "utf-8")',
        // Template literal ending in .tmp
        "writeFileSync(`${path}.tmp`, data, 'utf-8')",
        // Block with renameSync nearby
        '{ writeFileSync(path + ".tmp", data, "utf-8"); renameSync(path + ".tmp", path); }',
      ],
      invalid: [
        {
          code: 'writeFileSync(outputPath, data, "utf-8")',
          errors: [{ messageId: "nonAtomicWrite" }],
        },
        {
          // Variable name containing "tmp" is NOT sufficient — must use .tmp suffix
          code: 'writeFileSync(tmpPath, data, "utf-8")',
          errors: [{ messageId: "nonAtomicWrite" }],
        },
      ],
    });
  });
});

// ═══════════════════════════════════════════════════
// Edge Cases and Regression Tests
// ═══════════════════════════════════════════════════

describe("Edge cases: comments and strings", () => {
  test("no-shell-injection ignores string-only exec calls", () => {
    ruleTester.run("no-shell-injection", plugin.rules["no-shell-injection"], {
      valid: ['execSync("git status")', "execSync('npm ci')"],
      invalid: [],
    });
  });

  test("no-sql-injection ignores parameterized queries", () => {
    ruleTester.run("no-sql-injection", plugin.rules["no-sql-injection"], {
      valid: [
        'db.query("SELECT * FROM users WHERE id = ?", [id])',
        'stmt.run("INSERT INTO logs (msg) VALUES (?)", [msg])',
      ],
      invalid: [],
    });
  });

  test("no-hardcoded-secrets ignores short values", () => {
    ruleTester.run("no-hardcoded-secrets", plugin.rules["no-hardcoded-secrets"], {
      valid: ['const token = "abc"', 'const api_key = ""', 'const password = "12345"'],
      invalid: [],
    });
  });
});

describe("Edge cases: false positive prevention", () => {
  test("no-unsafe-division allows guarded divisions", () => {
    ruleTester.run("no-unsafe-division", plugin.rules["no-unsafe-division"], {
      valid: [
        "const pct = total > 0 ? (n / total) * 100 : 0",
        "const result = 100 / 3",
        "const half = x / 2",
      ],
      invalid: [],
    });
  });

  test("no-path-startswith allows non-path strings", () => {
    ruleTester.run("no-path-startswith", plugin.rules["no-path-startswith"], {
      valid: ['name.startsWith("abc")', 'url.startsWith("http")', 'msg.startsWith("Error:")'],
      invalid: [],
    });
  });

  test("no-unguarded-loadconfig allows node_modules requires", () => {
    ruleTester.run("no-unguarded-loadconfig", plugin.rules["no-unguarded-loadconfig"], {
      valid: [
        'const express = require("express")',
        'const _ = require("lodash")',
        'const path = require("path")',
      ],
      invalid: [],
    });
  });

  test("no-shell-injection detects nested interpolation in conditional/logical", () => {
    ruleTester.run("no-shell-injection", plugin.rules["no-shell-injection"], {
      valid: [],
      invalid: [
        {
          code: 'exec(debug ? ("rm " + userInput) : "echo safe")',
          errors: [{ messageId: "shellInjection" }],
        },
        {
          code: "exec(fallback || `cmd ${arg}`)",
          errors: [{ messageId: "shellInjection" }],
        },
      ],
    });
  });

  test("no-unbounded-regex detects unbounded in template literals", () => {
    ruleTester.run("no-unbounded-regex", plugin.rules["no-unbounded-regex"], {
      valid: [],
      invalid: [
        {
          code: "new RegExp(`prefix.*${suffix}`)",
          errors: [{ messageId: "unboundedRegex" }],
        },
      ],
    });
  });

  test("no-unbounded-regex allows escaped dots", () => {
    ruleTester.run("no-unbounded-regex", plugin.rules["no-unbounded-regex"], {
      valid: [String.raw`new RegExp("prefix\\.*suffix")`],
      invalid: [],
    });
  });

  test("no-unescaped-regexp-input catches template literals and concatenation", () => {
    ruleTester.run("no-unescaped-regexp-input", plugin.rules["no-unescaped-regexp-input"], {
      valid: [
        'new RegExp("literal")',
        "new RegExp(`no-expressions`)",
        "const escapedRegex = new RegExp(escapedStr)",
      ],
      invalid: [
        {
          code: "new RegExp(`${userInput}`)",
          errors: [{ messageId: "unescapedInput" }],
        },
        {
          code: 'new RegExp("^" + userInput)',
          errors: [{ messageId: "unescapedInput" }],
        },
      ],
    });
  });

  test("no-div-onclick-no-role allows spread attributes", () => {
    jsxRuleTester.run("no-div-onclick-no-role", plugin.rules["no-div-onclick-no-role"], {
      valid: ["const el = <div onClick={handler} {...props}>click</div>"],
      invalid: [],
    });
  });

  test("no-unsafe-error-access detects optional chaining message access", () => {
    ruleTester.run("no-unsafe-error-access", plugin.rules["no-unsafe-error-access"], {
      valid: ["try { f() } catch (err) { if (err instanceof Error) { console.log(err.message) } }"],
      invalid: [
        {
          code: 'try { f() } catch (err) { console.log(err["message"]) }',
          errors: [{ messageId: "unsafeErrorAccess" }],
        },
      ],
    });
  });
});
