#!/usr/bin/env node
/**
 * Encrypt Secrets Script
 *
 * Encrypts .env.local into .env.local.encrypted using AES-256-GCM
 * The encrypted file can be safely committed to the repository.
 *
 * Usage:
 *   node scripts/secrets/encrypt-secrets.js
 *   # You'll be prompted for a passphrase
 *
 * Or with passphrase:
 *   SECRETS_PASSPHRASE=mypass node scripts/secrets/encrypt-secrets.js
 */

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { safeWriteFileSync, safeRenameSync } = require("../lib/safe-fs");

// Use process.cwd() - scripts should be run from project root
const PROJECT_ROOT = process.cwd();
const ENV_LOCAL_PATH = path.join(PROJECT_ROOT, ".env.local");
const ENCRYPTED_PATH = path.join(PROJECT_ROOT, ".env.local.encrypted");

// Encryption settings
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const ITERATIONS = 100000;

// Secure file permissions (owner read/write only)
const SECURE_FILE_MODE = 0o600;

/**
 * Safely extract error message from unknown error type
 * @param {unknown} error - The caught error
 * @returns {string} - Safe error message
 */
function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function deriveKey(passphrase, salt) {
  return crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, KEY_LENGTH, "sha256");
}

function encrypt(plaintext, passphrase) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(passphrase, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Format: salt (32) + iv (16) + tag (16) + encrypted data
  return Buffer.concat([salt, iv, tag, encrypted]);
}

/**
 * Prompt for passphrase with hidden input
 * @param {string} prompt - The prompt to display
 * @returns {Promise<string>} - The entered passphrase
 */
async function promptPassphrase(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);

    // Check if we can use raw mode (TTY required)
    if (process.stdin.isTTY && process.stdin.setRawMode) {
      let passphrase = "";
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");

      // Cleanup function to restore terminal state
      const cleanup = () => {
        try {
          process.stdin.setRawMode(false);
        } catch {
          // Ignore errors during cleanup
        }
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
      };

      const onData = (char) => {
        // Handle Enter key
        if (char === "\n" || char === "\r") {
          cleanup();
          console.log(""); // New line after hidden input
          resolve(passphrase);
        }
        // Handle Backspace
        else if (char === "\u007F" || char === "\b") {
          if (passphrase.length > 0) {
            passphrase = passphrase.slice(0, -1);
          }
        }
        // Handle Ctrl+D (EOF)
        else if (char === "\u0004") {
          cleanup();
          console.log("");
          resolve("");
        }
        // Handle Ctrl+C
        else if (char === "\u0003") {
          cleanup();
          process.exit(1);
        }
        // Regular character
        else if (char.charCodeAt(0) >= 32) {
          passphrase += char;
        }
      };

      process.stdin.on("data", onData);
    } else {
      // Fallback for non-TTY (pipe input) - use readline
      const readline = require("node:readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question("", (answer) => {
        rl.close();
        console.log("");
        resolve(answer);
      });
    }
  });
}

async function main() {
  console.log("🔐 Encrypt Secrets");
  console.log("━".repeat(40));

  // Check if .env.local exists
  if (!fs.existsSync(ENV_LOCAL_PATH)) {
    console.error("❌ Error: .env.local not found");
    console.error("   Create .env.local with your tokens first, then run this script.");
    process.exit(1);
  }

  // Read .env.local with try/catch
  let envContent;
  try {
    envContent = fs.readFileSync(ENV_LOCAL_PATH, "utf8");
  } catch (error) {
    console.error(`❌ Error reading .env.local: ${getErrorMessage(error)}`);
    process.exit(1);
  }

  // Check if it has any actual tokens (not just placeholders)
  const hasTokens = /^(GITHUB_TOKEN|SONAR_TOKEN|CONTEXT7_API_KEY)=.+$/m.test(envContent);
  if (!hasTokens) {
    console.error("❌ Error: .env.local has no tokens set");
    console.error("   Add your actual tokens to .env.local first.");
    process.exit(1);
  }

  // Get passphrase
  let passphrase = process.env.SECRETS_PASSPHRASE;
  if (!passphrase) {
    passphrase = await promptPassphrase("Enter passphrase: ");
    const confirm = await promptPassphrase("Confirm passphrase: ");

    if (passphrase !== confirm) {
      console.error("❌ Passphrases do not match");
      process.exit(1);
    }
  }

  if (passphrase.length < 8) {
    console.error("❌ Passphrase must be at least 8 characters");
    process.exit(1);
  }

  // Encrypt
  console.log("\n🔒 Encrypting...");
  const encrypted = encrypt(envContent, passphrase);

  // Write encrypted file atomically with secure permissions
  // Use temp file + rename to prevent race condition on permissions
  const tmpPath = `${ENCRYPTED_PATH}.tmp`;
  safeWriteFileSync(tmpPath, encrypted, { mode: SECURE_FILE_MODE });
  fs.chmodSync(tmpPath, SECURE_FILE_MODE); // Ensure permissions even if mode flag ignored
  safeRenameSync(tmpPath, ENCRYPTED_PATH);

  console.log("✅ Encrypted successfully!");
  console.log(`   Output: .env.local.encrypted`);
  console.log("");
  console.log("📝 Next steps:");
  console.log("   1. Commit .env.local.encrypted to your repo");
  console.log("   2. Remember your passphrase!");
  console.log("   3. At session start, run: node scripts/secrets/decrypt-secrets.js");
}

main().catch((error) => {
  console.error(`❌ ${getErrorMessage(error)}`);
  process.exit(1);
});
