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
const readline = require("node:readline");

// Use process.cwd() - scripts should be run from project root
const PROJECT_ROOT = process.cwd();
const ENV_LOCAL_PATH = path.join(PROJECT_ROOT, ".env.local");
const ENCRYPTED_PATH = path.join(PROJECT_ROOT, ".env.local.encrypted");

// Encryption settings
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

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

async function promptPassphrase(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    // Hide input for passphrase
    process.stdout.write(prompt);
    rl.question("", (answer) => {
      rl.close();
      console.log(""); // New line after hidden input
      resolve(answer);
    });
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

  // Read .env.local
  const envContent = fs.readFileSync(ENV_LOCAL_PATH, "utf8");

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

  // Write encrypted file
  fs.writeFileSync(ENCRYPTED_PATH, encrypted);

  console.log("✅ Encrypted successfully!");
  console.log(`   Output: .env.local.encrypted`);
  console.log("");
  console.log("📝 Next steps:");
  console.log("   1. Commit .env.local.encrypted to your repo");
  console.log("   2. Remember your passphrase!");
  console.log("   3. At session start, run: node scripts/secrets/decrypt-secrets.js");
}

main().catch(console.error);
