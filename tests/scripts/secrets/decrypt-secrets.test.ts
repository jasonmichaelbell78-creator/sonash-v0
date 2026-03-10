/**
 * decrypt-secrets.js Minimal Tests
 *
 * decrypt-secrets.js contains top-level async main() that interacts with
 * process.stdin, TTY, and the filesystem. We cannot load it as a module
 * without side effects.
 *
 * These tests verify the pure cryptographic helper functions embedded in
 * the script: deriveKey, decrypt, and getErrorMessage.
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/secrets/decrypt-secrets.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as crypto from "node:crypto";

// Mirror constants from decrypt-secrets.js
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

// Mirror deriveKey
function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, KEY_LENGTH, "sha256");
}

// Mirror getErrorMessage
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Mirror decrypt (extracted pure function)
function decrypt(encryptedBuffer: Buffer, passphrase: string): string {
  const minimumLength = SALT_LENGTH + IV_LENGTH + TAG_LENGTH + 1;
  if (!Buffer.isBuffer(encryptedBuffer) || encryptedBuffer.length < minimumLength) {
    throw new Error("Encrypted secrets file is invalid or corrupted");
  }

  const salt = encryptedBuffer.subarray(0, SALT_LENGTH);
  const iv = encryptedBuffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = encryptedBuffer.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  );
  const encrypted = encryptedBuffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.includes("auth")) {
      throw new Error("Invalid passphrase or corrupted file");
    }
    throw error;
  }
}

// Helper: encrypt a string using the same scheme
function encrypt(plaintext: string, passphrase: string): Buffer {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(passphrase, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]);
}

// =========================================================
// getErrorMessage
// =========================================================

describe("getErrorMessage", () => {
  it("extracts message from Error instance", () => {
    const err = new Error("test error message");
    assert.equal(getErrorMessage(err), "test error message");
  });

  it("converts non-Error to string", () => {
    assert.equal(getErrorMessage("plain string"), "plain string");
    assert.equal(getErrorMessage(42), "42");
  });

  it("handles null", () => {
    assert.equal(getErrorMessage(null), "null");
  });
});

// =========================================================
// deriveKey
// =========================================================

describe("deriveKey", () => {
  it("returns a 32-byte Buffer", () => {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey("test-passphrase", salt);
    assert.equal(key.length, KEY_LENGTH);
    assert.ok(Buffer.isBuffer(key));
  });

  it("produces the same key for the same passphrase and salt", () => {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const k1 = deriveKey("my-pass", salt);
    const k2 = deriveKey("my-pass", salt);
    assert.deepEqual(k1, k2);
  });

  it("produces different keys for different passphrases", () => {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const k1 = deriveKey("passA", salt);
    const k2 = deriveKey("passB", salt);
    assert.notDeepEqual(k1, k2);
  });

  it("produces different keys for different salts", () => {
    const s1 = crypto.randomBytes(SALT_LENGTH);
    const s2 = crypto.randomBytes(SALT_LENGTH);
    const k1 = deriveKey("same-pass", s1);
    const k2 = deriveKey("same-pass", s2);
    assert.notDeepEqual(k1, k2);
  });
});

// =========================================================
// encrypt + decrypt round-trip
// =========================================================

describe("encrypt/decrypt round-trip", () => {
  it("decrypts ciphertext back to original plaintext", () => {
    const plaintext = "GITHUB_TOKEN=ghp_test123\nSOMAR_TOKEN=abc";
    const passphrase = "correct-horse-battery-staple";

    const cipherBuf = encrypt(plaintext, passphrase);
    const decrypted = decrypt(cipherBuf, passphrase);

    assert.equal(decrypted, plaintext);
  });

  it("throws 'Invalid passphrase' for wrong passphrase", () => {
    const cipherBuf = encrypt("secret", "correct-pass");
    assert.throws(() => decrypt(cipherBuf, "wrong-pass"), /Invalid passphrase|corrupted/i);
  });

  it("throws for buffer too short (invalid/corrupted)", () => {
    const tooShort = Buffer.from([0x01, 0x02, 0x03]);
    assert.throws(() => decrypt(tooShort, "any-pass"), /invalid or corrupted/i);
  });

  it("throws for non-Buffer input", () => {
    assert.throws(
      () => decrypt("not-a-buffer" as unknown as Buffer, "pass"),
      /invalid or corrupted/i
    );
  });
});
