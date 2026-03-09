/**
 * sanitize-error.js Test Suite
 *
 * Tests the error sanitization utilities from scripts/lib/sanitize-error.js.
 * Validates that sensitive information is redacted and safe output is produced.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import * as path from "node:path";
import * as fs from "node:fs";

// Locate project root — tests live in tests/scripts/lib/ (source) or
// dist-tests/tests/scripts/lib/ (compiled), so walk up until package.json is found.
function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

// Use file:// URL so dynamic import works regardless of compiled output directory
const MODULE_URL =
  "file://" + path.resolve(PROJECT_ROOT, "scripts/lib/sanitize-error.js").replace(/\\/g, "/");

// The module uses ES module `export` syntax but is consumed via dynamic import
// We use a typed wrapper after the dynamic import settles.
let sanitizeError: (error: unknown, options?: Record<string, unknown>) => string;
let sanitizeErrorForJson: (
  error: unknown,
  options?: Record<string, unknown>
) => { error: true; message: string; type: string };
let createSafeLogger: (prefix?: string) => {
  error: (msg: string, err?: unknown) => void;
  warn: (msg: string, err?: unknown) => void;
  info: (msg: string) => void;
};
let safeErrorMessage: (error: unknown) => string;

before(async () => {
  // Use Function-wrapped import to force a true ESM dynamic import
  // (TypeScript compiles `import()` to `require()` in CJS mode, which
  //  doesn't support file:// URLs; the Function wrapper bypasses that)
  const dynamicImport = new Function("url", "return import(url)") as (
    url: string
  ) => Promise<unknown>;
  const mod = (await dynamicImport(MODULE_URL)) as {
    sanitizeError: typeof sanitizeError;
    sanitizeErrorForJson: typeof sanitizeErrorForJson;
    createSafeLogger: typeof createSafeLogger;
    safeErrorMessage: typeof safeErrorMessage;
  };
  sanitizeError = mod.sanitizeError;
  sanitizeErrorForJson = mod.sanitizeErrorForJson;
  createSafeLogger = mod.createSafeLogger;
  safeErrorMessage = mod.safeErrorMessage;
});

// =========================================================
// sanitizeError
// =========================================================

describe("sanitizeError", () => {
  it("accepts Error objects and returns their sanitized message", () => {
    const err = new Error("Something went wrong");
    const result = sanitizeError(err);
    assert.equal(result, "Something went wrong");
  });

  it("accepts plain strings", () => {
    const result = sanitizeError("plain string error");
    assert.equal(result, "plain string error");
  });

  it("accepts objects with a message property", () => {
    const result = sanitizeError({ message: "object error" });
    assert.equal(result, "object error");
  });

  it("converts non-string, non-Error, non-object values via String()", () => {
    const result = sanitizeError(42);
    assert.equal(result, "42");
  });

  it("redacts Linux home directory paths", () => {
    const err = new Error("Failed to open /home/johndoe/.ssh/id_rsa");
    const result = sanitizeError(err);
    assert.ok(!result.includes("/home/johndoe"), "Linux home path should be redacted");
    assert.ok(result.includes("[REDACTED]"), "Should contain [REDACTED]");
  });

  it("redacts macOS home directory paths", () => {
    const err = new Error("File at /Users/alice/Documents/config.json");
    const result = sanitizeError(err);
    assert.ok(!result.includes("/Users/alice"), "macOS home path should be redacted");
    assert.ok(result.includes("[REDACTED]"), "Should contain [REDACTED]");
  });

  it("redacts Windows user directory paths", () => {
    const err = new Error("Path: C:\\Users\\bob\\AppData\\Local\\file.txt");
    const result = sanitizeError(err);
    assert.ok(!result.includes("C:\\Users\\bob"), "Windows user path should be redacted");
    assert.ok(result.includes("[REDACTED]"), "Should contain [REDACTED]");
  });

  it("redacts Bearer tokens", () => {
    const err = new Error("Auth failed with Bearer ABCDEF123456");
    const result = sanitizeError(err);
    assert.ok(!result.includes("ABCDEF123456"), "Bearer token should be redacted");
    assert.ok(result.includes("[REDACTED]"), "Should contain [REDACTED]");
  });

  it("redacts MongoDB connection strings", () => {
    const err = new Error("Connection to mongodb://user:pass@host:27017/db failed");
    const result = sanitizeError(err);
    assert.ok(!result.includes("user:pass@host"), "MongoDB connection string should be redacted");
    assert.ok(result.includes("[REDACTED]"), "Should contain [REDACTED]");
  });

  it("redacts PostgreSQL connection strings", () => {
    const err = new Error("postgresql://admin:secret@db.example.com:5432/mydb");
    const result = sanitizeError(err);
    assert.ok(!result.includes("admin:secret"), "PostgreSQL connection string should be redacted");
    assert.ok(result.includes("[REDACTED]"), "Should contain [REDACTED]");
  });

  it("redacts private IP addresses (10.x.x.x)", () => {
    const err = new Error("Server at 10.0.1.5 is unreachable");
    const result = sanitizeError(err);
    assert.ok(!result.includes("10.0.1.5"), "Private IP should be redacted");
    assert.ok(result.includes("[REDACTED]"), "Should contain [REDACTED]");
  });

  it("redacts localhost URLs", () => {
    const err = new Error("Request to http://localhost:3000/api/secret failed");
    const result = sanitizeError(err);
    assert.ok(!result.includes("localhost:3000"), "Localhost URL should be redacted");
    assert.ok(result.includes("[REDACTED]"), "Should contain [REDACTED]");
  });

  it("does not redact safe generic messages", () => {
    const err = new Error("File not found");
    const result = sanitizeError(err);
    assert.equal(result, "File not found");
  });

  it("returns message as-is in verbose mode when NODE_ENV=development", () => {
    const env = process.env as Record<string, string | undefined>;
    const origEnv = env["NODE_ENV"];
    env["NODE_ENV"] = "development";
    try {
      const err = new Error("Path /home/user/secret should be visible in dev");
      const result = sanitizeError(err, { verbose: true });
      // In verbose+development mode, the original message is returned
      assert.equal(result, err.message);
    } finally {
      env["NODE_ENV"] = origEnv;
    }
  });

  it("still sanitizes in verbose mode when NODE_ENV is not development", () => {
    const env = process.env as Record<string, string | undefined>;
    const origEnv = env["NODE_ENV"];
    env["NODE_ENV"] = "production";
    try {
      const err = new Error("Path /home/user/secret");
      const result = sanitizeError(err, { verbose: true });
      assert.ok(!result.includes("/home/user"), "Should still redact in non-dev verbose mode");
    } finally {
      env["NODE_ENV"] = origEnv;
    }
  });
});

// =========================================================
// sanitizeErrorForJson
// =========================================================

describe("sanitizeErrorForJson", () => {
  it("returns an object with error:true, message, and type", () => {
    const err = new Error("Something failed");
    const result = sanitizeErrorForJson(err);
    assert.equal(result.error, true);
    assert.equal(typeof result.message, "string");
    assert.equal(result.type, "Error");
  });

  it("includes the sanitized message (not raw)", () => {
    const err = new Error("Failed at /home/alice/file.txt");
    const result = sanitizeErrorForJson(err);
    assert.ok(!result.message.includes("/home/alice"), "Message should be sanitized");
    assert.ok(result.message.includes("[REDACTED]"), "Message should contain [REDACTED]");
  });

  it("uses the error name as type for Error subclasses", () => {
    const err = new TypeError("type error");
    const result = sanitizeErrorForJson(err);
    assert.equal(result.type, "TypeError");
  });

  it("uses 'Error' as type for non-Error values", () => {
    const result = sanitizeErrorForJson("string error");
    assert.equal(result.type, "Error");
  });

  it("does not include stack trace in the output", () => {
    const err = new Error("error with stack");
    const result = sanitizeErrorForJson(err);
    assert.equal(Object.keys(result).length, 3);
    assert.ok(!("stack" in result), "Stack should not be included");
  });
});

// =========================================================
// createSafeLogger
// =========================================================

describe("createSafeLogger", () => {
  it("creates a logger with error, warn, and info methods", () => {
    const logger = createSafeLogger("test");
    assert.equal(typeof logger.error, "function");
    assert.equal(typeof logger.warn, "function");
    assert.equal(typeof logger.info, "function");
  });

  it("accepts an empty prefix", () => {
    const logger = createSafeLogger();
    // Should not throw
    assert.ok(logger, "Logger should be created without prefix");
  });

  it("calls console.error without throwing for error method", () => {
    const logger = createSafeLogger("MyScript");
    const originalConsoleError = console.error;
    let called = false;
    console.error = () => {
      called = true;
    };
    try {
      logger.error("Something went wrong");
      assert.ok(called, "console.error should have been called");
    } finally {
      console.error = originalConsoleError;
    }
  });

  it("sanitizes error passed to error() method", () => {
    const logger = createSafeLogger("MyScript");
    const sensitive = new Error("Failed at /home/user/secret");
    const captured: string[] = [];
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => captured.push(args.join(" "));
    try {
      logger.error("Operation failed", sensitive);
      const output = captured.join(" ");
      assert.ok(!output.includes("/home/user"), "Sensitive path should not appear in output");
    } finally {
      console.error = originalConsoleError;
    }
  });
});

// =========================================================
// safeErrorMessage
// =========================================================

describe("safeErrorMessage", () => {
  it("returns a sanitized string for Error objects", () => {
    const err = new Error("Simple error");
    const result = safeErrorMessage(err);
    assert.equal(result, "Simple error");
  });

  it("returns a sanitized string for plain strings", () => {
    const result = safeErrorMessage("raw string error");
    assert.equal(result, "raw string error");
  });

  it("redacts sensitive information", () => {
    const err = new Error("Connecting to redis://user:pass@192.168.1.10:6379");
    const result = safeErrorMessage(err);
    assert.ok(!result.includes("192.168.1.10"), "Private IP should be redacted");
    assert.ok(!result.includes("user:pass"), "Credentials should be redacted");
  });
});
