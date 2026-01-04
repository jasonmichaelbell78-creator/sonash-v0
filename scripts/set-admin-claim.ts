/**
 * Set Admin Claim Script
 * 
 * Run this once to make your account an admin:
 *   npx tsx scripts/set-admin-claim.ts your-email@gmail.com
 * 
 * Requires Firebase Admin SDK service account key.
 */

import admin from "firebase-admin"
import { readFileSync } from "fs"
import { join } from "path"
import { sanitizeError } from "./lib/sanitize-error.js"

/**
 * Mask email address for logging (prevents PII exposure in logs)
 * Example: "user@example.com" -> "u***@e***.com"
 */
function maskEmail(email: string): string {
    const [local, domain] = email.split("@")
    if (!domain) return "***@***"
    const [domainName, ...tld] = domain.split(".")
    const maskedLocal = local.length > 1 ? local[0] + "***" : "***"
    const maskedDomain = domainName.length > 1 ? domainName[0] + "***" : "***"
    return `${maskedLocal}@${maskedDomain}.${tld.join(".")}`
}

// Initialize Firebase Admin
const serviceAccountPath = join(process.cwd(), "firebase-service-account.json")
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"))

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

async function setAdminClaim(email: string) {
    try {
        const auth = admin.auth()

        // Find user by email
        const user = await auth.getUserByEmail(email)

        // Set admin custom claim
        await auth.setCustomUserClaims(user.uid, { admin: true })

        console.log(`✅ Admin claim set for ${maskEmail(email)} (uid: ${user.uid})`)
        console.log("   User must sign out and sign back in for changes to take effect.")
        process.exit(0)

    } catch (error) {
        if ((error as { code?: string }).code === "auth/user-not-found") {
            console.error(`❌ User not found: ${maskEmail(email)}`)
        } else {
            // Use sanitizeError to avoid exposing sensitive paths
            console.error("❌ Error setting admin claim:", sanitizeError(error))
        }
        process.exit(1)
    }
}

// Get email from command line args
const email = process.argv[2]

if (!email) {
    console.log("Usage: npx tsx scripts/set-admin-claim.ts <email>")
    console.log("Example: npx tsx scripts/set-admin-claim.ts admin@example.com")
    process.exit(1)
}

setAdminClaim(email)
