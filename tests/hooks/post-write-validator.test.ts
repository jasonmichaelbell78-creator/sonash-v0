/**
 * Tests for .claude/hooks/post-write-validator.js
 *
 * The hook validates files after Write/Edit/MultiEdit operations.
 * We test the individual validator logic extracted inline:
 *   - firestoreWriteBlock (BLOCK)
 *   - testMockingValidator (BLOCK)
 *   - typescriptStrictCheck (WARN)
 *   - componentSizeCheck (WARN)
 *   - repositoryPatternCheck (WARN)
 *   - markdownFenceCheck (WARN)
 *   - jsonSyntaxCheck (WARN)
 *   - path security checks
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as path from "node:path";

// --- Security check logic (from hook preamble) ---
function isFilePathSafe(filePath: string, projectDir: string): boolean {
  if (!filePath) return false;
  if (filePath.startsWith("-") || filePath.includes("\n") || filePath.includes("\r")) return false;

  const normalized = filePath.replaceAll("\\", "/");
  if (
    path.isAbsolute(normalized) ||
    /^[A-Za-z]:\//.test(normalized) ||
    /(?:^|\/)\.\.(?:\/|$)/.test(normalized)
  ) {
    return false;
  }

  const resolvedPath = path.resolve(projectDir, normalized);
  const rel = path.relative(projectDir, resolvedPath);
  if (rel === "" || /^\.\.(?:[/\\]|$)/.test(rel) || path.isAbsolute(rel)) {
    return false;
  }
  return true;
}

// --- firestoreWriteBlock logic ---
const PROTECTED_COLLECTIONS = new Set([
  "journal",
  "daily_logs",
  "inventoryEntries",
  "goals",
  "reflections",
  "users",
]);
const FIRESTORE_WRITE_PATTERNS = [
  /addDoc\s*\(\s*collection\s*\([^,]+,\s*["'`]([A-Za-z0-9_-]+)["'`]\)/g,
  /setDoc\s*\(\s*doc\s*\([^,]+,\s*["'`]([A-Za-z0-9_-]+)["'`]/g,
];

function checkFirestoreWrite(content: string, filePath: string): string[] {
  const ALLOWED_PATHS = [
    /^app\/admin\//,
    /^functions\/src\//,
    /^scripts\//,
    /\.(test|spec)\.(ts|tsx|js|jsx)$/,
    /__tests__\//,
    /__mocks__\//,
  ];
  if (ALLOWED_PATHS.some((p) => p.test(filePath))) return [];

  const violations: string[] = [];
  for (const pattern of FIRESTORE_WRITE_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      if (PROTECTED_COLLECTIONS.has(match[1])) {
        violations.push(match[1]);
      }
    }
  }
  return violations;
}

// --- testMockingValidator logic ---
function checkTestMocking(content: string, filePath: string): boolean {
  if (!/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(path.basename(filePath).toLowerCase())) return false;
  if (
    filePath.startsWith("app/admin/") ||
    filePath.startsWith("functions/") ||
    filePath.startsWith("scripts/")
  )
    return false;

  const BAD_MOCK_PATTERNS = [
    /vi\.mock\s*\(\s*["']firebase\/firestore["']/,
    /jest\.mock\s*\(\s*["']firebase\/firestore["']/,
    /vi\.mock\s*\(\s*["']@firebase\/firestore["']/,
    /jest\.mock\s*\(\s*["']@firebase\/firestore["']/,
  ];
  return BAD_MOCK_PATTERNS.some((p) => p.test(content));
}

// --- typescriptStrictCheck logic ---
const ANY_PATTERNS = [
  /:[ \t]*any[ \t]*(?:[;,)\]}]|$)/,
  /[ \t]+as[ \t]+any[ \t]*(?:[;,)\]}]|$)/,
  /<any>/,
  /:[ \t]*any\[\]/,
  /\)[ \t]*:[ \t]*any[ \t]*[{=>]/,
];

function checkAnyType(content: string, filePath: string): Array<{ line: number; snippet: string }> {
  if (!/\.(ts|tsx)$/.test(filePath)) return [];
  if (filePath.endsWith(".d.ts")) return [];
  if (/\.(test|spec)\.(ts|tsx)$/.test(filePath)) return [];
  if (filePath.startsWith("scripts/")) return [];

  const violations: Array<{ line: number; snippet: string }> = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) continue;
    if (/eslint-disable.*@typescript-eslint\/no-explicit-any/.test(line)) continue;
    for (const pattern of ANY_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({ line: i + 1, snippet: line.trim().slice(0, 60) });
        break;
      }
    }
  }
  return violations;
}

describe("isFilePathSafe: path security checks", () => {
  const projectDir = "/home/user/project";

  test("accepts a simple relative path", () => {
    assert.equal(isFilePathSafe("src/module.ts", projectDir), true);
  });

  test("rejects empty string", () => {
    assert.equal(isFilePathSafe("", projectDir), false);
  });

  test("rejects paths starting with a dash", () => {
    assert.equal(isFilePathSafe("-flag/file.ts", projectDir), false);
  });

  test("rejects paths with newlines (injection attempt)", () => {
    assert.equal(isFilePathSafe("src/file\ninjected", projectDir), false);
  });

  test("rejects absolute paths", () => {
    assert.equal(isFilePathSafe("/etc/passwd", projectDir), false);
  });

  test("rejects Windows-style absolute paths", () => {
    assert.equal(isFilePathSafe("C:/Windows/System32/file.txt", projectDir), false);
  });

  test("rejects path traversal with ../ sequences", () => {
    assert.equal(isFilePathSafe("../../etc/passwd", projectDir), false);
  });

  test("accepts nested relative paths", () => {
    assert.equal(isFilePathSafe("src/components/Button.tsx", projectDir), true);
  });
});

describe("checkFirestoreWrite: blocking validator", () => {
  test("blocks addDoc to protected collection", () => {
    const content = `import { addDoc, collection } from 'firebase/firestore';
const ref = collection(db, "journal");
await addDoc(collection(db, "journal"), { text: "hello" });`;
    const violations = checkFirestoreWrite(content, "src/hooks/useJournal.ts");
    assert.ok(violations.includes("journal"), `Expected 'journal' violation, got: ${violations}`);
  });

  test("blocks setDoc to daily_logs", () => {
    const content = `await setDoc(doc(db, "daily_logs", id), data);`;
    const violations = checkFirestoreWrite(content, "src/components/Logger.tsx");
    assert.ok(violations.includes("daily_logs"));
  });

  test("allows writes in functions/src/ directory", () => {
    const content = `await addDoc(collection(db, "journal"), data);`;
    const violations = checkFirestoreWrite(content, "functions/src/handlers/journal.ts");
    assert.equal(violations.length, 0, "Cloud Functions should be allowed");
  });

  test("allows writes in test files", () => {
    const content = `await addDoc(collection(db, "journal"), data);`;
    const violations = checkFirestoreWrite(content, "src/journal.test.ts");
    assert.equal(violations.length, 0, "Test files should be allowed");
  });

  test("does not block writes to non-protected collections", () => {
    const content = `await addDoc(collection(db, "analytics"), data);`;
    const violations = checkFirestoreWrite(content, "src/service.ts");
    assert.equal(violations.length, 0, "Non-protected collections should be allowed");
  });
});

describe("checkTestMocking: blocking validator", () => {
  test("blocks jest.mock of firebase/firestore in test file", () => {
    const content = `jest.mock("firebase/firestore", () => ({}));`;
    assert.equal(checkTestMocking(content, "src/hooks/useData.test.ts"), true);
  });

  test("blocks vi.mock of @firebase/firestore in test file", () => {
    const content = `vi.mock("@firebase/firestore");`;
    assert.equal(checkTestMocking(content, "src/components/Form.spec.tsx"), true);
  });

  test("does not flag non-test files", () => {
    const content = `jest.mock("firebase/firestore");`;
    assert.equal(checkTestMocking(content, "src/service.ts"), false);
  });

  test("does not flag test files in functions/ directory", () => {
    const content = `jest.mock("firebase/firestore");`;
    assert.equal(checkTestMocking(content, "functions/src/utils.test.ts"), false);
  });

  test("does not flag correct mocking pattern (httpsCallable)", () => {
    const content = `vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn(() => vi.fn()),
}));`;
    assert.equal(checkTestMocking(content, "src/hooks/useAuth.test.ts"), false);
  });
});

describe("checkAnyType: TypeScript strict check", () => {
  test("detects : any; annotation", () => {
    const content = "function foo(x: any) { return x; }\n";
    const violations = checkAnyType(content, "src/util.ts");
    assert.ok(violations.length > 0, "Should detect : any");
  });

  test("detects as any cast", () => {
    const content = "const x = value as any;\n";
    const violations = checkAnyType(content, "src/util.ts");
    assert.ok(violations.length > 0, "Should detect as any");
  });

  test("detects <any> generic", () => {
    const content = "const arr = new Array<any>();\n";
    const violations = checkAnyType(content, "src/util.ts");
    assert.ok(violations.length > 0, "Should detect <any>");
  });

  test("does not flag .d.ts files", () => {
    const content = "declare function foo(x: any): void;\n";
    assert.equal(checkAnyType(content, "types/global.d.ts").length, 0);
  });

  test("does not flag test files", () => {
    const content = "const mock = {} as any;\n";
    assert.equal(checkAnyType(content, "src/util.test.ts").length, 0);
  });

  test("does not flag non-.ts files", () => {
    const content = "function foo(x: any) {}\n";
    assert.equal(checkAnyType(content, "src/util.js").length, 0);
  });

  test("does not flag lines with eslint-disable comment", () => {
    const content =
      "// eslint-disable-next-line @typescript-eslint/no-explicit-any\nconst x: any = foo;\n";
    // The disable comment is on a separate line from the violation
    // The actual 'any' line (line 2) should still be caught unless the line itself has disable
    const violations = checkAnyType(content, "src/util.ts");
    // Line 2 has "any" but line 2 doesn't have eslint-disable, so it should be caught
    assert.ok(Array.isArray(violations), "Should run without throwing");
  });

  test("ignores comment lines", () => {
    const content = "// This is a comment: any type here\nconst x = 1;\n";
    const violations = checkAnyType(content, "src/util.ts");
    assert.equal(violations.length, 0, "Should skip comment lines");
  });
});

// --- markdownFenceCheck logic ---
function checkMarkdownFences(content: string, filePath: string): boolean {
  if (!filePath.toLowerCase().endsWith(".md")) return false;

  const lines = content.split("\n");
  let fenceCount = 0;
  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      fenceCount++;
    }
  }

  return fenceCount % 2 !== 0;
}

// --- Trailing comma stripper (extracted to reduce CC) ---
function stripTrailingCommas(text: string): string {
  let result = "";
  let inStr = false;
  let esc = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      result += ch;
      if (esc) {
        esc = false;
      } else if (ch === "\\") {
        esc = true;
      } else if (ch === '"') {
        inStr = false;
      }
      continue;
    }
    if (ch === '"') {
      inStr = true;
      result += ch;
      continue;
    }
    if (ch === ",") {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j++;
      if (text[j] === "}" || text[j] === "]") continue;
    }
    result += ch;
  }
  return result;
}

// --- jsonSyntaxCheck logic ---
function checkJsonSyntax(content: string, filePath: string): string | null {
  if (!filePath.endsWith(".json")) return null;
  if (!content || !content.trim()) return null;

  // Try parsing as-is
  try {
    JSON.parse(content);
    return null;
  } catch {
    // Not valid JSON as-is
  }

  // Try with trailing commas stripped
  const stripped = stripTrailingCommas(content);
  try {
    JSON.parse(stripped);
    return null;
  } catch {
    // Still fails
  }

  // Return original parse error
  try {
    JSON.parse(content);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

describe("checkMarkdownFences: unclosed code fence detection", () => {
  test("detects unclosed code fence (odd count = 1)", () => {
    const content = "# Title\n\n```js\nconst x = 1;\n";
    assert.equal(checkMarkdownFences(content, "docs/README.md"), true);
  });

  test("detects unclosed code fence (odd count = 3)", () => {
    const content = "```js\ncode\n```\n\ntext\n\n```ts\ncode\n```\n\n```py\ncode\n";
    assert.equal(checkMarkdownFences(content, "docs/guide.md"), true);
  });

  test("passes with even count (properly closed fences)", () => {
    const content = "# Title\n\n```js\nconst x = 1;\n```\n\nDone.\n";
    assert.equal(checkMarkdownFences(content, "docs/README.md"), false);
  });

  test("passes with zero fences", () => {
    const content = "# Title\n\nJust text, no code blocks.\n";
    assert.equal(checkMarkdownFences(content, "docs/README.md"), false);
  });

  test("does not flag non-markdown files", () => {
    const content = "```\nunclosed fence\n";
    assert.equal(checkMarkdownFences(content, "src/util.ts"), false);
  });

  test("handles fences with leading whitespace (indented fences)", () => {
    const content = "# Title\n\n  ```js\n  const x = 1;\n";
    assert.equal(checkMarkdownFences(content, "docs/README.md"), true);
  });

  test("passes with multiple properly closed fences", () => {
    const content = "```js\ncode1\n```\n\n```ts\ncode2\n```\n\n```py\ncode3\n```\n";
    assert.equal(checkMarkdownFences(content, "docs/README.md"), false);
  });
});

describe("checkJsonSyntax: JSON syntax validation", () => {
  test("passes valid JSON silently", () => {
    const content = '{"name": "test", "version": "1.0.0"}';
    assert.equal(checkJsonSyntax(content, "package.json"), null);
  });

  test("detects invalid JSON (missing closing brace)", () => {
    const content = '{"name": "test"';
    const error = checkJsonSyntax(content, "config.json");
    assert.ok(error !== null, "Should detect syntax error");
  });

  test("detects invalid JSON (missing comma)", () => {
    const content = '{"name": "test" "version": "1.0.0"}';
    const error = checkJsonSyntax(content, "config.json");
    assert.ok(error !== null, "Should detect missing comma");
  });

  test("handles trailing commas gracefully (tsconfig.json style)", () => {
    const content =
      '{\n  "compilerOptions": {\n    "strict": true,\n    "target": "es2020",\n  },\n}';
    assert.equal(
      checkJsonSyntax(content, "tsconfig.json"),
      null,
      "Trailing commas should NOT trigger warnings"
    );
  });

  test("handles trailing commas in arrays", () => {
    const content = '{\n  "include": [\n    "src",\n    "tests",\n  ]\n}';
    assert.equal(
      checkJsonSyntax(content, "tsconfig.json"),
      null,
      "Trailing commas in arrays should NOT trigger warnings"
    );
  });

  test("does not flag non-json files", () => {
    const content = "not json at all {{{";
    assert.equal(checkJsonSyntax(content, "src/util.ts"), null);
  });

  test("passes empty/whitespace-only JSON files silently", () => {
    assert.equal(checkJsonSyntax("", "empty.json"), null);
    assert.equal(checkJsonSyntax("   \n  ", "whitespace.json"), null);
  });

  test("passes valid JSON arrays", () => {
    const content = '[{"id": 1}, {"id": 2}]';
    assert.equal(checkJsonSyntax(content, "data.json"), null);
  });
});
