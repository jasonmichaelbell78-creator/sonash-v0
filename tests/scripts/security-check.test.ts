import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/security-check.js

describe("security-check: SECURITY_PATTERNS", () => {
  const SECURITY_PATTERNS = [
    {
      id: "SEC-001",
      name: "execSync with shell interpolation",
      pattern: /execSync\s*\(\s*`[^`]*\$\{/g,
      severity: "HIGH",
    },
    {
      id: "SEC-002",
      name: "Unsafe eval usage",
      pattern: /\beval\s*\(/g,
      severity: "CRITICAL",
    },
    {
      id: "SEC-003",
      name: "innerHTML assignment",
      pattern: /\.innerHTML\s*=/g,
      severity: "MEDIUM",
    },
    {
      id: "SEC-004",
      name: "Hardcoded secrets",
      pattern: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
      severity: "CRITICAL",
    },
  ];

  it("SEC-001 detects execSync with template literal interpolation", () => {
    const code = "execSync(`git checkout ${branch}`)";
    const pattern = new RegExp(SECURITY_PATTERNS[0].pattern.source);
    assert.ok(pattern.test(code));
  });

  it("SEC-001 does not flag safe execSync", () => {
    const code = "execSync('git status', { encoding: 'utf8' })";
    const pattern = new RegExp(SECURITY_PATTERNS[0].pattern.source);
    assert.ok(!pattern.test(code));
  });

  it("SEC-002 detects eval()", () => {
    const code = "const result = eval(userInput)";
    const pattern = new RegExp(SECURITY_PATTERNS[1].pattern.source);
    assert.ok(pattern.test(code));
  });

  it("SEC-003 detects innerHTML assignment", () => {
    const code = "element.innerHTML = userContent";
    const pattern = new RegExp(SECURITY_PATTERNS[2].pattern.source);
    assert.ok(pattern.test(code));
  });

  it("SEC-003 does not flag innerHTML property access (read-only)", () => {
    const code = "const html = element.innerHTML;";
    const pattern = new RegExp(SECURITY_PATTERNS[2].pattern.source);
    assert.ok(!pattern.test(code));
  });

  it("SEC-004 detects hardcoded API key", () => {
    const code = 'const apiKey = "abc123def456ghi"';
    const pattern = new RegExp(SECURITY_PATTERNS[3].pattern.source, "gi");
    assert.ok(pattern.test(code));
  });
});

describe("security-check: file type filtering", () => {
  const CHECKED_EXTENSIONS = new Set([".js", ".ts", ".tsx", ".jsx"]);

  function shouldCheckFile(filename: string): boolean {
    const ext = filename.slice(filename.lastIndexOf("."));
    return CHECKED_EXTENSIONS.has(ext);
  }

  it("checks TypeScript files", () => {
    assert.strictEqual(shouldCheckFile("src/app.tsx"), true);
  });

  it("checks JavaScript files", () => {
    assert.strictEqual(shouldCheckFile("scripts/run.js"), true);
  });

  it("skips markdown files", () => {
    assert.strictEqual(shouldCheckFile("README.md"), false);
  });

  it("skips JSON files", () => {
    assert.strictEqual(shouldCheckFile("config.json"), false);
  });
});

describe("security-check: violation severity reporting", () => {
  type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

  interface Violation {
    id: string;
    severity: Severity;
    file: string;
    line: number;
  }

  function hasBlockingViolations(violations: Violation[]): boolean {
    return violations.some((v) => v.severity === "CRITICAL" || v.severity === "HIGH");
  }

  it("blocks on CRITICAL violations", () => {
    const violations: Violation[] = [
      { id: "SEC-002", severity: "CRITICAL", file: "app.ts", line: 10 },
    ];
    assert.strictEqual(hasBlockingViolations(violations), true);
  });

  it("blocks on HIGH violations", () => {
    const violations: Violation[] = [{ id: "SEC-001", severity: "HIGH", file: "app.ts", line: 5 }];
    assert.strictEqual(hasBlockingViolations(violations), true);
  });

  it("does not block on MEDIUM violations", () => {
    const violations: Violation[] = [
      { id: "SEC-003", severity: "MEDIUM", file: "app.ts", line: 20 },
    ];
    assert.strictEqual(hasBlockingViolations(violations), false);
  });

  it("does not block with empty violations", () => {
    assert.strictEqual(hasBlockingViolations([]), false);
  });
});

describe("security-check: path containment", () => {
  function isPathTraversal(rel: string): boolean {
    return /^\.\.(?:[\\/]|$)/.test(rel);
  }

  it("detects ../escape", () => {
    assert.strictEqual(isPathTraversal("../etc"), true);
  });

  it("allows safe relative paths", () => {
    assert.strictEqual(isPathTraversal("src/utils.ts"), false);
  });
});
