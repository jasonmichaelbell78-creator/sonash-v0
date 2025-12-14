/**
 * Set Admin Claim Script
 * 
 * Run this once to make your account an admin:
 *   npx ts-node --skip-project scripts/set-admin-claim.ts your-email@gmail.com
 * 
 * Requires Firebase Admin SDK service account key.
 */

import * as admin from "firebase-admin"
import { getAuth } from "firebase-admin/auth"

// Initialize Firebase Admin
const serviceAccount = require("../firebase-service-account.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

async function setAdminClaim(email: string) {
    try {
        const auth = getAuth()

        // Find user by email
        const user = await auth.getUserByEmail(email)

        // Set admin custom claim
        await auth.setCustomUserClaims(user.uid, { admin: true })

        console.log(`✅ Admin claim set for ${email} (uid: ${user.uid})`)
        console.log("   User must sign out and sign back in for changes to take effect.")

    } catch (error) {
        if ((error as { code?: string }).code === "auth/user-not-found") {
            console.error(`❌ User not found: ${email}`)
        } else {
            console.error("❌ Error setting admin claim:", error)
        }
        process.exit(1)
    }
}

// Get email from command line args
const email = process.argv[2]

if (!email) {
    console.log("Usage: npx ts-node --skip-project scripts/set-admin-claim.ts <email>")
    console.log("Example: npx ts-node --skip-project scripts/set-admin-claim.ts admin@example.com")
    process.exit(1)
}

setAdminClaim(email)
