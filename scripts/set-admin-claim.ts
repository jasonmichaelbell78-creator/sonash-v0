/**
 * Set Admin Claim Script
 *
 * Run this once to make your account an admin:
 *   npx tsx scripts/set-admin-claim.ts your-email@gmail.com
 *
 * Requires Firebase Admin SDK service account key.
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join } from "path";
import { sanitizeError } from "./lib/sanitize-error.js";

/**
 * Mask email address for logging (prevents PII exposure in logs)
 * Example: "user@example.com" -> "u***@e***.com"
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***@***";
  const [domainName, ...tld] = domain.split(".");
  const maskedLocal = local.length > 1 ? local[0] + "***" : "***";
  const maskedDomain = domainName.length > 1 ? domainName[0] + "***" : "***";
  // Handle domains without TLD (e.g., localhost) to avoid trailing dot
  const tldPart = tld.length > 0 ? `.${tld.join(".")}` : "";
  return `${maskedLocal}@${maskedDomain}${tldPart}`;
}

/**
 * Mask UID for logging (prevents direct identifier exposure)
 * Example: "abc123xyz789" -> "abc***789"
 */
function maskUid(uid: string): string {
  if (!uid || uid.length < 6) return "***";
  return `${uid.slice(0, 3)}***${uid.slice(-3)}`;
}

/**
 * Get current operator identity for audit trail
 * Returns whoami username on Unix, USERNAME on Windows, or 'unknown'
 */
function getOperatorIdentity(): string {
  return process.env.USER || process.env.USERNAME || "unknown";
}

// Initialize Firebase Admin
const serviceAccountPath = join(process.cwd(), "firebase-service-account.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setAdminClaim(email: string) {
  try {
    const auth = admin.auth();

    // Find user by email
    const user = await auth.getUserByEmail(email);

    // Set admin custom claim
    await auth.setCustomUserClaims(user.uid, { admin: true });

    // Audit trail: timestamp, operator, action, target (masked)
    const auditEntry = {
      timestamp: new Date().toISOString(),
      operator: getOperatorIdentity(),
      action: "SET_ADMIN_CLAIM",
      target: maskEmail(email),
      targetUid: maskUid(user.uid),
      result: "SUCCESS",
    };
    console.log(`[AUDIT] ${JSON.stringify(auditEntry)}`);
    console.log(`✅ Admin claim set for ${maskEmail(email)} (uid: ${maskUid(user.uid)})`);
    console.log("   User must sign out and sign back in for changes to take effect.");
    process.exit(0);
  } catch (error) {
    // Audit trail for failures too
    const auditEntry = {
      timestamp: new Date().toISOString(),
      operator: getOperatorIdentity(),
      action: "SET_ADMIN_CLAIM",
      target: maskEmail(email),
      result: "FAILURE",
      errorCode: (error as { code?: string }).code || "unknown",
    };
    console.log(`[AUDIT] ${JSON.stringify(auditEntry)}`);

    if ((error as { code?: string }).code === "auth/user-not-found") {
      console.error(`❌ User not found: ${maskEmail(email)}`);
    } else {
      // Use sanitizeError to avoid exposing sensitive paths
      console.error("❌ Error setting admin claim:", sanitizeError(error));
    }
    process.exit(1);
  }
}

// Get email from command line args
const email = process.argv[2];

if (!email) {
  console.log("Usage: npx tsx scripts/set-admin-claim.ts <email>");
  console.log("Example: npx tsx scripts/set-admin-claim.ts admin@example.com");
  process.exit(1);
}

setAdminClaim(email);
