import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { join } from 'path'
import { sanitizeError } from './lib/sanitize-error.js'

// Initialize Firebase Admin
if (getApps().length === 0) {
    const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json')
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))
    initializeApp({
        credential: cert(serviceAccount)
    })
}

const db = getFirestore()

// Nashville Recovery Resources - Parsed from nashville_recovery_resources_links.md
const nashvilleLinks = [
    // Crisis (additions to existing)
    { title: "Tennessee Crisis Line", url: "tel:855-274-7471", description: "855-CRISIS-1 (24/7)", category: "crisis", order: 2 },
    { title: "Crisis Text Line TN", url: "sms:741741&body=TN", description: "Text TN to 741741", category: "crisis", order: 3 },
    { title: "Mental Health Cooperative Nashville", url: "https://www.mhc-tn.org/our-services/emergency-psychiatric-services/", description: "Walk-in crisis treatment center", category: "crisis", order: 4 },

    // Local Nashville/TN
    { title: "Middle Tennessee AA Intergroup", url: "https://aanashville.org/", description: "Nashville meeting finder + hotline", category: "local", order: 0 },
    { title: "202 Friendship House", url: "https://202friendshiphouse.org/meeting-schedule", description: "Nashville AA meeting schedule", category: "local", order: 1 },
    { title: "NA Nashville", url: "https://nanashville.org/", description: "Greater Middle TN area meetings", category: "local", order: 2 },
    { title: "Al-Anon Middle Tennessee", url: "https://afsofmiddletn.org/", description: "Families & friends of alcoholics", category: "local", order: 3 },
    { title: "Nar-Anon Nashville", url: "https://www.nar-anon.org/", description: "Families & friends (drug addiction)", category: "local", order: 4 },
    { title: "Metro Nashville Behavioral Health", url: "https://www.nashville.gov/departments/health/clinical-health-services/behavioral-health-services", description: "Public behavioral health services", category: "local", order: 5 },

    // Treatment & Referral
    { title: "Tennessee REDLINE", url: "https://www.tn.gov/behavioral-health/substance-abuse-services/prevention/tennessee-redline.html", description: "24/7 treatment referrals (call/text)", category: "treatment", order: 0 },
    { title: "FindTreatment.gov", url: "https://findtreatment.gov/", description: "Federal treatment locator", category: "treatment", order: 1 },

    // Recovery Housing
    { title: "TN-ARR", url: "https://www.tnarr.org/", description: "Certified recovery residences directory", category: "housing", order: 0 },
    { title: "Oxford House of Tennessee", url: "https://www.oxfordhousetn.org/", description: "Democratic sober living homes", category: "housing", order: 1 },
    { title: "Recovery Community Inc.", url: "https://www.recoverycommunity.org/", description: "Madison/Nashville housing + support", category: "housing", order: 2 },

    // Harm Reduction
    { title: "Nashville CARES DART Program", url: "https://www.nashvillecares.org/harm-reduction-and-syringe-exchange/", description: "Syringe exchange & harm reduction", category: "harm-reduction", order: 0 },
    { title: "TN Syringe Services Programs", url: "https://www.tn.gov/health/health-program-areas/std/std/syringe-services-program.html", description: "Statewide SSP map/list", category: "harm-reduction", order: 1 },
    { title: "Tennessee Harm Reduction", url: "https://tennesseeharmreduction.com/how-to-request-supplies-via-mail/", description: "Supplies by mail (naloxone/test strips)", category: "harm-reduction", order: 2 },
    { title: "TN Overdose Prevention Specialists", url: "https://www.tn.gov/behavioral-health/substance-abuse-services/prevention/rops.html", description: "ROPS - training + naloxone", category: "harm-reduction", order: 3 },

    // Other Recovery Pathways (add to online category)
    { title: "Recovery Dharma", url: "https://recoverydharma.org/meetings-and-events/", description: "Buddhist-inspired recovery meetings", category: "online", order: 3 },
    { title: "Refuge Recovery", url: "https://refugerecovery.org/meetings/", description: "Buddhist-inspired recovery path", category: "online", order: 4 },
    { title: "Celebrate Recovery", url: "https://celebraterecovery.com/find-help-2/", description: "Christ-centered recovery program", category: "online", order: 5 },
    { title: "LifeRing Secular Recovery", url: "https://lifering.org/meetings/", description: "Secular recovery support meetings", category: "online", order: 6 },
    { title: "Women for Sobriety", url: "https://womenforsobriety.org/meetings/", description: "Women-focused recovery program", category: "online", order: 7 },
]

async function importNashvilleLinks() {
    console.log('🚀 Starting Nashville Recovery Resources Import...\n')

    try {
        const linksRef = db.collection('quick_links')
        let addedCount = 0
        let skippedCount = 0

        for (const link of nashvilleLinks) {
            // Use deterministic ID for idempotency (avoid composite index requirement)
            const docId = `${link.category}__${link.title}`.toLowerCase()
                .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
                .replace(/(^-|-$)/g, "")     // Trim leading/trailing hyphens

            const docRef = linksRef.doc(docId)
            const existingDoc = await docRef.get()

            if (existingDoc.exists) {
                console.log(`  ⏭️  Skipped: ${link.title} (already exists)`)
                skippedCount++
                continue
            }

            await docRef.set({
                ...link,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                source: 'import-nashville-links', // Track import source
            }, { merge: true })
            console.log(`  ✅ Added: ${link.title} (${link.category})`)
            addedCount++
        }

        console.log(`\n🎉 Import complete!`)
        console.log(`\nTotal links processed: ${nashvilleLinks.length}`)
        console.log(`Links added: ${addedCount}`)
        console.log(`Links skipped: ${skippedCount}`)
        console.log(`\nBreakdown by category:`)
        const categoryCounts = nashvilleLinks.reduce((acc, link) => {
            acc[link.category] = (acc[link.category] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        Object.entries(categoryCounts).forEach(([category, count]) => {
            console.log(`  - ${category}: ${count} links`)
        })

    } catch (error) {
        // Use sanitizeError to avoid exposing sensitive paths
        console.error('❌ Import failed:', sanitizeError(error))
        throw error
    }
}

// Run import
importNashvilleLinks()
    .then(() => process.exit(0))
    .catch((error) => {
        // Use sanitizeError to avoid exposing sensitive paths
        console.error(sanitizeError(error))
        process.exit(1)
    })
