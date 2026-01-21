#!/usr/bin/env node
/**
 * Decrypt Secrets Script
 *
 * Decrypts .env.local.encrypted into .env.local using AES-256-GCM
 * Run this at the start of a remote session to restore your tokens.
 *
 * Usage:
 *   node scripts/secrets/decrypt-secrets.js
 *   # You'll be prompted for your passphrase
 *
 * Or with passphrase:
 *   SECRETS_PASSPHRASE=mypass node scripts/secrets/decrypt-secrets.js
 *
 * Or non-interactive (for hooks):
 *   echo "mypass" | node scripts/secrets/decrypt-secrets.js --stdin
 */

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

// Use process.cwd() - scripts should be run from project root
const PROJECT_ROOT = process.cwd();
const ENV_LOCAL_PATH = path.join(PROJECT_ROOT, ".env.local");
const ENCRYPTED_PATH = path.join(PROJECT_ROOT, ".env.local.encrypted");

// Encryption settings (must match encrypt script)
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
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

function decrypt(encryptedBuffer, passphrase) {
  // Extract components: salt (32) + iv (16) + tag (16) + encrypted data
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

async function readStdin() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  return new Promise((resolve) => {
    let data = "";
    rl.on("line", (line) => {
      data = line; // Take only first line
      rl.close();
    });
    rl.on("close", () => resolve(data.trim()));
  });
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

      const onData = (char) => {
        // Handle Enter key
        if (char === "\n" || char === "\r") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener("data", onData);
          console.log(""); // New line after hidden input
          resolve(passphrase);
        }
        // Handle Backspace
        else if (char === "\u007F" || char === "\b") {
          if (passphrase.length > 0) {
            passphrase = passphrase.slice(0, -1);
          }
        }
        // Handle Ctrl+C
        else if (char === "\u0003") {
          process.stdin.setRawMode(false);
          process.exit(1);
        }
        // Regular character
        else if (char.charCodeAt(0) >= 32) {
          passphrase += char;
        }
      };

      process.stdin.on("data", onData);
    } else {
      // Fallback for non-TTY (pipe input)
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
  const args = process.argv.slice(2);
  const useStdin = args.includes("--stdin");
  const quiet = args.includes("--quiet") || args.includes("-q");

  if (!quiet) {
    console.log("🔓 Decrypt Secrets");
    console.log("━".repeat(40));
  }

  // Check if encrypted file exists
  if (!fs.existsSync(ENCRYPTED_PATH)) {
    if (!quiet) {
      console.log("ℹ️  No encrypted secrets file found (.env.local.encrypted)");
      console.log("   Run encrypt-secrets.js first to create one.");
    }
    process.exit(0); // Not an error, just no encrypted file
  }

  // Check if .env.local already exists and has tokens
  if (fs.existsSync(ENV_LOCAL_PATH)) {
    try {
      const content = fs.readFileSync(ENV_LOCAL_PATH, "utf8");
      const hasTokens = /^(GITHUB_TOKEN|SONAR_TOKEN|CONTEXT7_API_KEY)=.+$/m.test(content);
      if (hasTokens) {
        if (!quiet) {
          console.log("✅ .env.local already exists with tokens");
        }
        process.exit(0);
      }
    } catch (error) {
      // File exists but can't be read - continue to decrypt
      if (!quiet) {
        console.log(`⚠️  Could not read existing .env.local: ${getErrorMessage(error)}`);
      }
    }
  }

  // Read encrypted file
  let encryptedBuffer;
  try {
    encryptedBuffer = fs.readFileSync(ENCRYPTED_PATH);
  } catch (error) {
    console.error(`❌ Failed to read encrypted file: ${getErrorMessage(error)}`);
    process.exit(1);
  }

  // Get passphrase
  let passphrase = process.env.SECRETS_PASSPHRASE;
  if (!passphrase) {
    if (useStdin) {
      passphrase = await readStdin();
    } else {
      passphrase = await promptPassphrase("Enter passphrase: ");
    }
  }

  if (!passphrase) {
    console.error("❌ No passphrase provided");
    process.exit(1);
  }

  // Decrypt
  if (!quiet) {
    console.log("\n🔓 Decrypting...");
  }

  try {
    const decrypted = decrypt(encryptedBuffer, passphrase);

    // Write .env.local with secure permissions
    fs.writeFileSync(ENV_LOCAL_PATH, decrypted);
    fs.chmodSync(ENV_LOCAL_PATH, SECURE_FILE_MODE);

    if (!quiet) {
      console.log("✅ Decrypted successfully!");
      console.log("   Your tokens are now available in .env.local");
      console.log("");
      console.log("💡 MCP servers will use these tokens automatically.");
    }
  } catch (error) {
    console.error(`❌ ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`❌ ${getErrorMessage(error)}`);
  process.exit(1);
});
