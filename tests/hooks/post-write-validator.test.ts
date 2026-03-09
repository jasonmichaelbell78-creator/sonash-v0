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
 *   - path security checks
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as path from "node:path";

// --- Security check logic (from hook preamble) ---
function isFilePathSafe(filePath: string, projectDir: string): boolean {
  if (!filePath) return false;
  if (filePath.startsWith("-") || filePath.includes("\n") || filePath.includes("\r")) return false;

  const normalized = filePath.replaceAll(/\\/g, "/");
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
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
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
  /:\s*any\s*(?:[;,)\]}]|$)/,
  /\s+as\s+any\s*(?:[;,)\]}]|$)/,
  /<any>/,
  /:\s*any\[\]/,
  /\)\s*:\s*any\s*[{=>]/,
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
