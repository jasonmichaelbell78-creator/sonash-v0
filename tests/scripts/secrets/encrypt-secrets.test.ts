/**
 * encrypt-secrets.js Test Suite
 *
 * Tests the crypto helper functions from scripts/secrets/encrypt-secrets.js.
 * We extract deriveKey and encrypt without triggering the main() async IIFE.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

interface EncryptModule {
  deriveKey: (passphrase: string, salt: Buffer) => Buffer;
  encrypt: (plaintext: string, passphrase: string) => Buffer;
  getErrorMessage: (error: unknown) => string;
}

let mod: EncryptModule;

before(() => {
  const srcPath = path.resolve(PROJECT_ROOT, "scripts/secrets/encrypt-secrets.js");
  let src = fs.readFileSync(srcPath, "utf-8");

  // The file ends with `main().catch(...)` — remove it to prevent execution
  src = src.replace(/^main\(\)\.catch[\s\S]*$/m, "// main() removed for test isolation");

  // Expose internal helpers
  src += `\nmodule.exports = { deriveKey, encrypt, getErrorMessage };\n`;

  // Write wrapper alongside source so relative require()s resolve correctly.
  // Use PID in filename to avoid collisions; cleanup in finally block.
  const wrapperFile = path.join(path.dirname(srcPath), `.encrypt-secrets-test-${process.pid}.js`);
  fs.writeFileSync(wrapperFile, src, "utf-8");

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require(wrapperFile) as EncryptModule;
  } finally {
    try {
      fs.unlinkSync(wrapperFile);
    } catch {
      /* best effort */
    }
  }
});

// =========================================================
// getErrorMessage
// =========================================================

describe("encrypt-secrets.getErrorMessage", () => {
  it("returns message string from Error objects", () => {
    const err = new Error("test error");
    assert.equal(mod.getErrorMessage(err), "test error");
  });

  it("converts non-Error values via String()", () => {
    assert.equal(mod.getErrorMessage("raw string"), "raw string");
    assert.equal(mod.getErrorMessage(42), "42");
  });

  it("handles null gracefully", () => {
    const result = mod.getErrorMessage(null);
    assert.equal(typeof result, "string");
  });
});

// =========================================================
// deriveKey
// =========================================================

describe("encrypt-secrets.deriveKey", () => {
  it("returns a Buffer of 32 bytes (256 bits)", () => {
    const salt = crypto.randomBytes(32);
    const key = mod.deriveKey("mypassphrase", salt);
    assert.ok(Buffer.isBuffer(key), "Key should be a Buffer");
    assert.equal(key.length, 32, "Key should be 32 bytes");
  });

  it("produces deterministic output for the same passphrase and salt", () => {
    const salt = crypto.randomBytes(32);
    const key1 = mod.deriveKey("deterministic-pass", salt);
    const key2 = mod.deriveKey("deterministic-pass", salt);
    assert.ok(key1.equals(key2), "Same passphrase+salt should produce same key");
  });

  it("produces different keys for different passphrases", () => {
    const salt = crypto.randomBytes(32);
    const key1 = mod.deriveKey("passphrase-one", salt);
    const key2 = mod.deriveKey("passphrase-two", salt);
    assert.ok(!key1.equals(key2), "Different passphrases should produce different keys");
  });

  it("produces different keys for different salts", () => {
    const salt1 = crypto.randomBytes(32);
    const salt2 = crypto.randomBytes(32);
    const key1 = mod.deriveKey("same-passphrase", salt1);
    const key2 = mod.deriveKey("same-passphrase", salt2);
    assert.ok(!key1.equals(key2), "Different salts should produce different keys");
  });
});

// =========================================================
// encrypt
// =========================================================

describe("encrypt-secrets.encrypt", () => {
  it("returns a Buffer", () => {
    const result = mod.encrypt("hello world", "mypassphrase");
    assert.ok(Buffer.isBuffer(result), "Encrypted result should be a Buffer");
  });

  it("returns a buffer larger than the plaintext (includes salt+iv+tag overhead)", () => {
    const plaintext = "hello world";
    const result = mod.encrypt(plaintext, "mypassphrase");
    // salt(32) + iv(16) + tag(16) = 64 bytes minimum overhead
    assert.ok(result.length > plaintext.length + 60, "Encrypted buffer should include overhead");
  });

  it("produces different output for the same plaintext (due to random salt+iv)", () => {
    const plaintext = "same plaintext";
    const enc1 = mod.encrypt(plaintext, "mypassphrase");
    const enc2 = mod.encrypt(plaintext, "mypassphrase");
    // Very unlikely to be equal since salt and iv are random
    assert.ok(!enc1.equals(enc2), "Two encryptions of same plaintext should differ");
  });

  it("encrypts empty string without throwing", () => {
    assert.doesNotThrow(() => mod.encrypt("", "mypassphrase"));
  });

  it("handles a long passphrase", () => {
    const longPass = "a".repeat(1000);
    assert.doesNotThrow(() => mod.encrypt("data", longPass));
  });
});
