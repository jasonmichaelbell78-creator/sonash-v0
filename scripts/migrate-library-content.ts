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

// Existing Quick Links from library-page.tsx
const existingLinks = [
    { title: "AA.org", url: "https://www.aa.org", description: "Official AA website", category: "official", order: 0 },
    { title: "NA.org", url: "https://www.na.org", description: "Official NA website", category: "official", order: 1 },
    { title: "SMART Recovery", url: "https://www.smartrecovery.org", description: "Science-based recovery", category: "official", order: 2 },
    { title: "InTheRooms", url: "https://www.intherooms.com", description: "Free online meetings 24/7", category: "online", order: 0 },
    { title: "AA Online Intergroup", url: "https://aa-intergroup.org", description: "24/7 online AA meetings", category: "online", order: 1 },
    { title: "Virtual NA", url: "https://virtual-na.org", description: "24/7 online NA meetings", category: "online", order: 2 },
    { title: "988 Suicide & Crisis", url: "tel:988", description: "Call or text 988", category: "crisis", order: 0 },
    { title: "SAMHSA Helpline", url: "tel:1-800-662-4357", description: "1-800-662-HELP (24/7)", category: "crisis", order: 1 }
]

// Existing Prayers from library-page.tsx
const existingPrayers = [
    {
        title: "Serenity Prayer",
        text: "God, grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference.",
        category: "morning",
        order: 0
    },
    {
        title: "Third Step Prayer",
        text: "God, I offer myself to Thee—to build with me and to do with me as Thou wilt. Relieve me of the bondage of self, that I may better do Thy will. Take away my difficulties, that victory over them may bear witness to those I would help of Thy Power, Thy Love, and Thy Way of life. May I do Thy will always!",
        category: "step",
        order: 0
    },
    {
        title: "Seventh Step Prayer",
        text: "My Creator, I am now willing that you should have all of me, good and bad. I pray that you now remove from me every single defect of character which stands in the way of my usefulness to you and my fellows. Grant me strength, as I go out from here, to do your bidding. Amen.",
        category: "step",
        order: 1
    },
    {
        title: "Eleventh Step Prayer (St. Francis)",
        text: "Lord, make me a channel of thy peace—that where there is hatred, I may bring love—that where there is wrong, I may bring the spirit of forgiveness—that where there is discord, I may bring harmony—that where there is error, I may bring truth—that where there is doubt, I may bring faith—that where there is despair, I may bring hope—that where there are shadows, I may bring light—that where there is sadness, I may bring joy.",
        category: "morning",
        order: 1
    },
    {
        title: "Evening/Night Review",
        text: "God, forgive me where I have been resentful, selfish, dishonest, or afraid today. Help me to not keep anything to myself but to discuss it all openly with another person—and make amends quickly if I have harmed anyone. Help me to be more loving and tolerant tomorrow than I was today. Amen.",
        category: "evening",
        order: 0
    }
]

async function migrateLibraryContent() {
    console.log('🚀 Starting Library Content Migration...\n')

    try {
        let linksAdded = 0
        let linksSkipped = 0
        let prayersAdded = 0
        let prayersSkipped = 0

        // Migrate Quick Links
        console.log('📌 Migrating Quick Links...')
        const linksRef = db.collection('quick_links')

        for (const link of existingLinks) {
            // Use improved slugification for robust idempotency
            const slug = link.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            const docId = `link-${link.category}-${slug}`
            const docRef = linksRef.doc(docId)

            const existing = await docRef.get()

            if (existing.exists) {
                console.log(`  ⏭️  Skipped: ${link.title} (already exists)`)
                linksSkipped++
                continue
            }

            await docRef.set({
                ...link,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                source: 'migrate-library-content',
            })
            console.log(`  ✅ Added: ${link.title}`)
            linksAdded++
        }
        console.log(`\n✓ Links: ${linksAdded} added, ${linksSkipped} skipped\n`)

        // Migrate Prayers
        console.log('🙏 Migrating Prayers...')
        const prayersRef = db.collection('prayers')

        for (const prayer of existingPrayers) {
            // Use improved slugification for robust idempotency
            const slug = prayer.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            const docId = `prayer-${prayer.category}-${slug}`
            const docRef = prayersRef.doc(docId)

            const existing = await docRef.get()

            if (existing.exists) {
                console.log(`  ⏭️  Skipped: ${prayer.title} (already exists)`)
                prayersSkipped++
                continue
            }

            await docRef.set({
                ...prayer,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                source: 'migrate-library-content',
            })
            console.log(`  ✅ Added: ${prayer.title}`)
            prayersAdded++
        }
        console.log(`\n✓ Prayers: ${prayersAdded} added, ${prayersSkipped} skipped\n`)

        console.log('🎉 Migration complete!')
        console.log(`\nTotal items processed:`)
        console.log(`  - Quick Links: ${linksAdded + linksSkipped} (${linksAdded} new, ${linksSkipped} existing)`)
        console.log(`  - Prayers: ${prayersAdded + prayersSkipped} (${prayersAdded} new, ${prayersSkipped} existing)`)

    } catch (error) {
        // Use sanitizeError to avoid exposing sensitive paths
        console.error('❌ Migration failed:', sanitizeError(error))
        throw error
    }
}

// Run migration
migrateLibraryContent()
    .then(() => process.exit(0))
    .catch((error) => {
        // Use sanitizeError to avoid exposing sensitive paths
        console.error(sanitizeError(error))
        process.exit(1)
    })
