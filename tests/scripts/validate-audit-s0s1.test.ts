import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { spawnSync } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";

// Get project root (works both in source and compiled contexts)
const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

const SCRIPT_PATH = path.resolve(PROJECT_ROOT, "scripts/validate-audit.js");

/**
 * Helper to run the validate-audit script and capture output
 */
function runScript(
  args: string[] = [],
  options: { cwd?: string } = {}
): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const cwd = options.cwd || PROJECT_ROOT;
  const result = spawnSync("node", [SCRIPT_PATH, ...args], {
    cwd,
    encoding: "utf-8",
    timeout: 60000,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, NODE_ENV: "test" },
  });

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    exitCode: result.status ?? 1,
  };
}

/**
 * Helper to create a temporary JSONL audit file
 */
function createTempAuditFile(findings: object[]): { path: string; cleanup: () => void } {
  const tempDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".temp-test-audit-"));
  const filePath = path.join(tempDir, "test-audit.jsonl");

  const content = findings.map((f) => JSON.stringify(f)).join("\n");
  fs.writeFileSync(filePath, content);

  return {
    path: filePath,
    cleanup: () => fs.rmSync(tempDir, { recursive: true, force: true }),
  };
}

/**
 * Create a compliant S0 finding with all required verification_steps
 */
function createCompliantS0Finding(id: string = "SEC-001"): object {
  return {
    id,
    category: "Auth",
    severity: "S0",
    effort: "E1",
    confidence: "HIGH",
    verified: "DUAL_PASS_CONFIRMED",
    file: "package.json", // Use a file that exists
    line: 1,
    title: "Test S0 finding",
    description: "Detailed description",
    recommendation: "How to fix",
    evidence: ["evidence item 1", "evidence item 2"],
    cross_ref: "npm_audit",
    verification_steps: {
      first_pass: {
        method: "grep",
        evidence_collected: ["initial code snippet"],
      },
      second_pass: {
        method: "contextual_review",
        confirmed: true,
        notes: "Verified in context",
      },
      tool_confirmation: {
        tool: "npm_audit",
        reference: "CVE-2024-1234",
      },
    },
  };
}

/**
 * Create a compliant S1 finding
 */
function createCompliantS1Finding(id: string = "SEC-002"): object {
  return {
    ...createCompliantS0Finding(id),
    id,
    severity: "S1",
    confidence: "MEDIUM",
  };
}

describe("validate-audit.js S0/S1 strict validation", () => {
  describe("--strict-s0s1 flag", () => {
    test("shows help with --strict-s0s1 option documented", () => {
      const result = runScript(["--help"]);

      assert.ok(result.stdout.includes("--strict-s0s1"), "Help should document --strict-s0s1 flag");
      assert.ok(
        result.stdout.includes("BLOCKING"),
        "Help should mention BLOCKING mode for strict S0/S1"
      );
    });

    test("enables strict mode message when flag is provided", () => {
      const { path: auditPath, cleanup } = createTempAuditFile([createCompliantS0Finding()]);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          result.stdout.includes("Strict S0/S1 mode ENABLED"),
          "Should show strict mode enabled message"
        );
      } finally {
        cleanup();
      }
    });
  });

  describe("LOW confidence S0/S1 blocking", () => {
    test("blocks S0 finding with LOW confidence", () => {
      const finding = {
        ...createCompliantS0Finding(),
        confidence: "LOW",
      };

      const { path: auditPath, cleanup } = createTempAuditFile([finding]);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          result.stdout.includes("LOW confidence not allowed") ||
            result.stdout.includes("LOW_CONFIDENCE"),
          "Should flag LOW confidence S0"
        );
        assert.equal(result.exitCode, 1, "Should exit with code 1 for LOW confidence S0");
      } finally {
        cleanup();
      }
    });

    test("blocks S1 finding with LOW confidence", () => {
      const finding = {
        ...createCompliantS1Finding(),
        confidence: "LOW",
      };

      const { path: auditPath, cleanup } = createTempAuditFile([finding]);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          result.stdout.includes("LOW confidence not allowed") ||
            result.stdout.includes("LOW_CONFIDENCE"),
          "Should flag LOW confidence S1"
        );
        assert.equal(result.exitCode, 1, "Should exit with code 1 for LOW confidence S1");
      } finally {
        cleanup();
      }
    });

    test("allows S2 finding with LOW confidence", () => {
      const finding = {
        id: "SEC-003",
        category: "Auth",
        severity: "S2",
        file: "package.json",
        title: "Test S2 finding",
        description: "Detailed description",
        recommendation: "How to fix",
        confidence: "LOW",
      };

      const { path: auditPath, cleanup } = createTempAuditFile([finding]);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          !result.stdout.includes("BLOCKING violations"),
          "Should not have blocking violations for S2"
        );
      } finally {
        cleanup();
      }
    });
  });

  describe("MANUAL_ONLY S0/S1 blocking", () => {
    test("blocks S0 finding with MANUAL_ONLY cross_ref", () => {
      const finding = {
        ...createCompliantS0Finding(),
        cross_ref: "MANUAL_ONLY",
      };

      const { path: auditPath, cleanup } = createTempAuditFile([finding]);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          result.stdout.includes("MANUAL_ONLY not allowed") ||
            result.stdout.includes("MANUAL_ONLY_S0S1"),
          "Should flag MANUAL_ONLY S0"
        );
        assert.equal(result.exitCode, 1, "Should exit with code 1 for MANUAL_ONLY S0");
      } finally {
        cleanup();
      }
    });

    test("blocks S1 finding with MANUAL_ONLY cross_ref", () => {
      const finding = {
        ...createCompliantS1Finding(),
        cross_ref: "MANUAL_ONLY",
      };

      const { path: auditPath, cleanup } = createTempAuditFile([finding]);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          result.stdout.includes("MANUAL_ONLY not allowed") ||
            result.stdout.includes("MANUAL_ONLY_S0S1"),
          "Should flag MANUAL_ONLY S1"
        );
        assert.equal(result.exitCode, 1, "Should exit with code 1 for MANUAL_ONLY S1");
      } finally {
        cleanup();
      }
    });
  });

  describe("verification_steps validation", () => {
    test("blocks S0 finding missing verification_steps", () => {
      const finding = createCompliantS0Finding();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (finding as any).verification_steps;

      const { path: auditPath, cleanup } = createTempAuditFile([finding]);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          result.stdout.includes("Missing") && result.stdout.includes("verification_steps"),
          "Should flag missing verification_steps"
        );
        assert.equal(result.exitCode, 1, "Should exit with code 1 for missing verification_steps");
      } finally {
        cleanup();
      }
    });

    test("blocks S0 finding with second_pass.confirmed = false", () => {
      const finding = {
        ...createCompliantS0Finding(),
        verification_steps: {
          first_pass: {
            method: "grep",
            evidence_collected: ["snippet"],
          },
          second_pass: {
            method: "contextual_review",
            confirmed: false, // Not confirmed!
            notes: "Could not confirm",
          },
          tool_confirmation: {
            tool: "NONE",
            reference: "Manual review only",
          },
        },
      };

      const { path: auditPath, cleanup } = createTempAuditFile([finding]);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          result.stdout.includes("confirmed must be true") ||
            result.stdout.includes("SECOND_PASS_NOT_CONFIRMED"),
          "Should flag unconfirmed second_pass"
        );
        assert.equal(result.exitCode, 1, "Should exit with code 1 for unconfirmed second_pass");
      } finally {
        cleanup();
      }
    });

    test("blocks S0 finding with invalid first_pass.method", () => {
      const finding = {
        ...createCompliantS0Finding(),
        verification_steps: {
          first_pass: {
            method: "invalid_method",
            evidence_collected: ["snippet"],
          },
          second_pass: {
            method: "contextual_review",
            confirmed: true,
            notes: "Confirmed",
          },
          tool_confirmation: {
            tool: "eslint",
            reference: "no-unused-vars",
          },
        },
      };

      const { path: auditPath, cleanup } = createTempAuditFile([finding]);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          result.stdout.includes("Invalid first_pass.method") ||
            result.stdout.includes("INVALID_FIRST_PASS_METHOD"),
          "Should flag invalid first_pass.method"
        );
        assert.equal(result.exitCode, 1, "Should exit with code 1 for invalid method");
      } finally {
        cleanup();
      }
    });

    test("blocks S0 finding with missing tool_confirmation", () => {
      const finding = {
        ...createCompliantS0Finding(),
        verification_steps: {
          first_pass: {
            method: "grep",
            evidence_collected: ["snippet"],
          },
          second_pass: {
            method: "contextual_review",
            confirmed: true,
            notes: "Confirmed",
          },
          // Missing tool_confirmation
        },
      };

      const { path: auditPath, cleanup } = createTempAuditFile([finding]);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          result.stdout.includes("Missing") && result.stdout.includes("tool_confirmation"),
          "Should flag missing tool_confirmation"
        );
        assert.equal(result.exitCode, 1, "Should exit with code 1 for missing tool_confirmation");
      } finally {
        cleanup();
      }
    });
  });

  describe("evidence requirements", () => {
    test("blocks S0 finding with < 2 evidence items", () => {
      const finding = {
        ...createCompliantS0Finding(),
        evidence: ["only one item"],
      };

      const { path: auditPath, cleanup } = createTempAuditFile([finding]);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          result.stdout.includes("at least 2 evidence") ||
            result.stdout.includes("INSUFFICIENT_EVIDENCE"),
          "Should flag insufficient evidence"
        );
        assert.equal(result.exitCode, 1, "Should exit with code 1 for insufficient evidence");
      } finally {
        cleanup();
      }
    });

    test("blocks S0 finding with empty evidence array", () => {
      const finding = {
        ...createCompliantS0Finding(),
        evidence: [],
      };

      const { path: auditPath, cleanup } = createTempAuditFile([finding]);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          result.stdout.includes("evidence") || result.stdout.includes("INSUFFICIENT_EVIDENCE"),
          "Should flag empty evidence"
        );
        assert.equal(result.exitCode, 1, "Should exit with code 1 for empty evidence");
      } finally {
        cleanup();
      }
    });
  });

  describe("compliant findings", () => {
    test("allows compliant S0 finding", () => {
      const finding = createCompliantS0Finding();

      const { path: auditPath, cleanup } = createTempAuditFile([finding]);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          result.stdout.includes("All S0/S1 findings pass strict validation") ||
            !result.stdout.includes("BLOCKING violations"),
          "Should pass for compliant S0 finding"
        );
        // Note: exitCode might be 1 due to other validation issues (e.g., false positives)
        // but there should be no S0/S1 violations
        assert.ok(
          !result.stdout.includes("S0/S1 STRICT VALIDATION") ||
            result.stdout.includes("pass strict validation"),
          "Should not have S0/S1 blocking violations"
        );
      } finally {
        cleanup();
      }
    });

    test("allows compliant S1 finding", () => {
      const finding = createCompliantS1Finding();

      const { path: auditPath, cleanup } = createTempAuditFile([finding]);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          result.stdout.includes("All S0/S1 findings pass strict validation") ||
            !result.stdout.includes("BLOCKING violations"),
          "Should pass for compliant S1 finding"
        );
      } finally {
        cleanup();
      }
    });

    test("allows mixed S0/S1/S2/S3 findings when S0/S1 are compliant", () => {
      const findings = [
        createCompliantS0Finding("SEC-001"),
        createCompliantS1Finding("SEC-002"),
        {
          id: "SEC-003",
          category: "Auth",
          severity: "S2",
          file: "package.json",
          title: "S2 finding",
          description: "Low severity",
          recommendation: "Optional fix",
          confidence: "LOW", // LOW is ok for S2
        },
        {
          id: "SEC-004",
          category: "Auth",
          severity: "S3",
          title: "S3 finding",
          description: "Minor issue",
        },
      ];

      const { path: auditPath, cleanup } = createTempAuditFile(findings);

      try {
        const result = runScript([auditPath, "--strict-s0s1"]);

        assert.ok(
          result.stdout.includes("All S0/S1 findings pass strict validation") ||
            !result.stdout.includes("BLOCKING violations"),
          "Should pass when S0/S1 are compliant regardless of S2/S3"
        );
      } finally {
        cleanup();
      }
    });
  });

  describe("without --strict-s0s1 flag", () => {
    test("does not perform S0/S1 strict validation", () => {
      const finding = {
        ...createCompliantS0Finding(),
        confidence: "LOW", // Would fail in strict mode
      };

      const { path: auditPath, cleanup } = createTempAuditFile([finding]);

      try {
        const result = runScript([auditPath]); // No --strict-s0s1

        assert.ok(
          !result.stdout.includes("S0/S1 STRICT VALIDATION"),
          "Should not perform S0/S1 strict validation without flag"
        );
        assert.ok(
          !result.stdout.includes("LOW confidence not allowed"),
          "Should not flag LOW confidence without --strict-s0s1"
        );
      } finally {
        cleanup();
      }
    });
  });
});
